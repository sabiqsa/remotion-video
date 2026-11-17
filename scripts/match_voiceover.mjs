#!/usr/bin/env node
// Cocokkan rekaman/TTS pihak ketiga ke naskah voiceover:
// 1) cari tiap klip naskah di transkrip whisper (alignment fuzzy per kata),
// 2) potong audionya per scene → <out>/<id>.wav,
// 3) tulis modul vo.generated.ts (durasi + timestamp per kata naskah).
//
//   node scripts/match_voiceover.mjs <config.json> <audio> <transcript.json>
//
// config.json sama dengan yang dipakai make_voiceover.mjs (out, module, clips).
// Bila klip muncul lebih dari sekali di audio, kemunculan TERAKHIR yang dipakai.

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const root = resolve(dirname(new URL(import.meta.url).pathname), "..");
const [configPath, audioPath, transcriptPath] = process.argv.slice(2);
if (!configPath || !audioPath || !transcriptPath) {
  console.error("Pakai: node scripts/match_voiceover.mjs <config.json> <audio> <transcript.json>");
  process.exit(1);
}
const config = JSON.parse(readFileSync(resolve(root, configPath), "utf8"));
const { words: tWords } = JSON.parse(readFileSync(resolve(transcriptPath), "utf8"));
const outDir = resolve(root, config.out);
const publicPrefix = config.out.replace(/^public\//, "");
mkdirSync(outDir, { recursive: true });

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const lev = (a, b) => {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
};
const sim = (a, b) => {
  if (!a || !b) return 0;
  if (a === b) return 1;
  return 1 - lev(a, b) / Math.max(a.length, b.length);
};

const T = tWords.map((w) => ({ ...w, n: norm(w.word) })).filter((w) => w.n);

/* ---------------- audio: decode sekali, cari jeda hening sungguhan ---------------- */
const SR = 44100;
const tmpWav = join(outDir, "_full.wav");
execFileSync("npx", ["remotion", "ffmpeg", "-y", "-loglevel", "error", "-i", resolve(audioPath), "-ac", "1", "-ar", String(SR), "-c:a", "pcm_s16le", tmpWav], {
  cwd: root,
  stdio: "inherit",
});
const wavBuf = readFileSync(tmpWav);
rmSync(tmpWav);
const dataAt = wavBuf.indexOf("data") + 8;
const pcm = new Int16Array(wavBuf.buffer.slice(wavBuf.byteOffset + dataAt, wavBuf.byteOffset + wavBuf.length - ((wavBuf.length - dataAt) % 2)));
const FRAME = 0.01; // 10 ms
const frameDb = (() => {
  const n = Math.round(SR * FRAME);
  const out = new Float32Array(Math.floor(pcm.length / n));
  for (let f = 0; f < out.length; f++) {
    let sum = 0;
    for (let k = f * n; k < (f + 1) * n; k++) sum += pcm[k] * pcm[k];
    out[f] = 20 * Math.log10(Math.max(Math.sqrt(sum / n), 1) / 32768);
  }
  return out;
})();
const SILENT_DB = -40;
/** Jeda hening terpanjang di [a, b] detik → {start, end} atau null. */
const longestSilence = (a, b) => {
  let best = null;
  let runStart = null;
  const f0 = Math.max(0, Math.floor(a / FRAME));
  const f1 = Math.min(frameDb.length - 1, Math.ceil(b / FRAME));
  for (let f = f0; f <= f1 + 1; f++) {
    const silent = f <= f1 && frameDb[f] < SILENT_DB;
    if (silent && runStart === null) runStart = f;
    if (!silent && runStart !== null) {
      if (!best || f - runStart > best.end - best.start) best = { start: runStart, end: f };
      runStart = null;
    }
  }
  return best && best.end - best.start >= 3 ? { start: best.start * FRAME, end: best.end * FRAME } : null;
};
/** Tulis WAV mono 16-bit dari potongan PCM, dengan fade pendek anti-klik. */
const writeClip = (file, t0, t1) => {
  const s0 = Math.max(0, Math.round(t0 * SR));
  const s1 = Math.min(pcm.length, Math.round(t1 * SR));
  const seg = Int16Array.from(pcm.subarray(s0, s1));
  const fin = Math.round(0.01 * SR);
  const fout = Math.round(0.03 * SR);
  for (let k = 0; k < Math.min(fin, seg.length); k++) seg[k] = Math.round((seg[k] * k) / fin);
  for (let k = 0; k < Math.min(fout, seg.length); k++) {
    const i = seg.length - 1 - k;
    seg[i] = Math.round((seg[i] * k) / fout);
  }
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + seg.length * 2, 4);
  header.write("WAVEfmt ", 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(SR, 24);
  header.writeUInt32LE(SR * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(seg.length * 2, 40);
  writeFileSync(file, Buffer.concat([header, Buffer.from(seg.buffer)]));
};

/** Smith-Waterman: cari kecocokan lokal terbaik naskah c di transkrip T[from..to). */
const align = (c, from, to) => {
  const n = c.length;
  const m = to - from;
  const H = Array.from({ length: n + 1 }, () => new Float32Array(m + 1));
  const P = Array.from({ length: n + 1 }, () => new Int8Array(m + 1)); // 1 diag, 2 up, 3 left
  let best = { score: 0, i: 0, j: 0 };
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const s = sim(c[i - 1], T[from + j - 1].n);
      const diag = H[i - 1][j - 1] + (s >= 0.7 ? 2 * s : -1);
      const up = H[i - 1][j] - 0.8;
      const left = H[i][j - 1] - 0.8;
      const v = Math.max(0, diag, up, left);
      H[i][j] = v;
      P[i][j] = v === 0 ? 0 : v === diag ? 1 : v === up ? 2 : 3;
      if (v > best.score) best = { score: v, i, j };
    }
  }
  // backtrack → pasangan (index naskah → index transkrip)
  const pairs = new Map();
  let { i, j } = best;
  let firstJ = j;
  while (i > 0 && j > 0 && H[i][j] > 0) {
    const p = P[i][j];
    if (p === 1) {
      if (sim(c[i - 1], T[from + j - 1].n) >= 0.7) pairs.set(i - 1, from + j - 1);
      firstJ = j;
      i--;
      j--;
    } else if (p === 2) i--;
    else j--;
  }
  return { score: best.score / (2 * n), pairs, start: from + firstJ - 1, end: from + best.j - 1 };
};

const ids = Object.keys(config.clips);
const tokens = Object.fromEntries(
  ids.map((id) => [id, config.clips[id].split(/\s+/).filter((w) => norm(w))]),
);

// Klip pertama: pakai kemunculan TERAKHIR yang cukup bagus.
const first = ids[0];
let anchor = 0;
{
  let cursor = 0;
  let found = null;
  while (cursor < T.length) {
    const r = align(tokens[first].map(norm), cursor, T.length);
    if (r.score < 0.6) break;
    found = r;
    cursor = r.end + 1;
  }
  if (!found) {
    console.error(`✖ klip "${first}" tidak ditemukan di transkrip`);
    process.exit(1);
  }
  anchor = found.start;
}

const meta = {};
const found = [];
let cursor = anchor;
for (const id of ids) {
  const words = tokens[id];
  const r = align(words.map(norm), cursor, T.length);
  if (r.score < 0.5) {
    console.warn(`⚠ ${id}: kecocokan rendah (${r.score.toFixed(2)}), dilewati`);
    continue;
  }
  const idxs = [...r.pairs.values()];
  found.push({ id, words, r, startT: T[Math.min(...idxs)].start, endT: T[Math.max(...idxs)].end });
  cursor = r.end + 1;
}

// Batas antar klip = tengah jeda hening sungguhan di sekitar batas versi whisper
// (timestamp akhir kata whisper sering terlalu cepat → kata terpotong).
const totalDur = pcm.length / SR;
for (let k = 0; k < found.length; k++) {
  const c = found[k];
  const prev = found[k - 1];
  const next = found[k + 1];
  if (!prev) {
    const g = longestSilence(c.startT - 0.8, c.startT + 0.15);
    c.clipStart = g ? Math.max(g.start, g.end - 0.12) : Math.max(0, c.startT - 0.1);
  }
  if (next) {
    const g = longestSilence(c.endT - 0.3, next.startT + 0.3);
    const mid = g ? (g.start + g.end) / 2 : (c.endT + next.startT) / 2;
    c.clipEnd = g ? Math.min(mid, g.start + 0.2) : mid;
    next.clipStart = g ? Math.max(mid, g.end - 0.12) : mid;
  } else {
    const g = longestSilence(c.endT - 0.1, Math.min(totalDur, c.endT + 1.0));
    c.clipEnd = g ? Math.min(g.start + 0.2, totalDur) : Math.min(totalDur, c.endT + 0.3);
  }
}

for (const { id, words, r, clipStart, clipEnd } of found) {
  // waktu tiap kata naskah (relatif klip); yang tidak cocok diinterpolasi
  const times = words.map((_, k) => (r.pairs.has(k) ? Math.max(0, T[r.pairs.get(k)].start - clipStart) : null));
  for (let k = 0; k < times.length; k++) {
    if (times[k] !== null) continue;
    let a = k - 1;
    while (a >= 0 && times[a] === null) a--;
    let b = k + 1;
    while (b < times.length && times[b] === null) b++;
    const ta = a >= 0 ? times[a] : 0;
    const tb = b < times.length ? times[b] : clipEnd - clipStart;
    const ka = a >= 0 ? a : -1;
    const kb = b < times.length ? b : times.length;
    times[k] = ta + ((tb - ta) * (k - ka)) / (kb - ka);
  }

  writeClip(join(outDir, `${id}.wav`), clipStart, clipEnd);
  const duration = +(clipEnd - clipStart).toFixed(3);
  meta[id] = {
    file: `${publicPrefix}/${id}.wav`,
    duration,
    source: [+clipStart.toFixed(3), +clipEnd.toFixed(3)],
    match: +r.score.toFixed(2),
    words: words.map((w, k) => ({ word: w, start: +times[k].toFixed(3), end: +(times[k + 1] ?? duration).toFixed(3) })),
  };
  console.log(`• ${id}: ${clipStart.toFixed(2)}–${clipEnd.toFixed(2)}s (${duration}s), cocok ${(r.score * 100).toFixed(0)}%`);
}

writeFileSync(join(outDir, "meta.json"), JSON.stringify(meta, null, 2));
const entries = ids
  .filter((id) => meta[id])
  .map(
    (id) =>
      `  ${JSON.stringify(id)}: {\n    file: ${JSON.stringify(meta[id].file)},\n    duration: ${meta[id].duration},\n    words: ${JSON.stringify(meta[id].words)},\n  },`,
  )
  .join("\n");
writeFileSync(
  resolve(root, config.module),
  `// DIBUAT OTOMATIS oleh scripts/match_voiceover.mjs — jangan diedit manual.\n` +
    `import type { VoClip } from "../brand/voiceover";\n\n` +
    `export const VO: Partial<Record<string, VoClip>> = {\n${entries}\n};\n`,
);
console.log(`✔ ${Object.keys(meta).length}/${ids.length} klip → ${config.out}`);
