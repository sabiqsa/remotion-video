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
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
/* ---------------- pembersih suara: de-esser + peredam frekuensi tinggi ----------------
 * Suara TTS sering punya bunyi "s/c" yang tajam & berdesis (terdengar seperti kresek tipis).
 * - De-esser: bila energi pita 4.5–9 kHz melewati ambang, frekuensi tinggi diredam
 *   sementara (maks −8 dB), hanya selama bunyi desis itu.
 * - Low-pass lembut ~10 kHz untuk memotong desis kasar di atasnya.
 * Lewati dengan flag --raw.
 */
const biquad = (type, f, q = 0.7071) => {
  const w0 = (2 * Math.PI * f) / SR;
  const al = Math.sin(w0) / (2 * q);
  const c = Math.cos(w0);
  const [b0, b1, b2] = type === "lp" ? [(1 - c) / 2, 1 - c, (1 - c) / 2] : [(1 + c) / 2, -(1 + c), (1 + c) / 2];
  const a0 = 1 + al;
  const a1 = -2 * c;
  const a2 = 1 - al;
  return (x) => {
    const y = new Float32Array(x.length);
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < x.length; i++) {
      const o = (b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
      x2 = x1; x1 = x[i]; y2 = y1; y1 = o; y[i] = o;
    }
    return y;
  };
};
const cleanVoice = (input) => {
  const x = Float32Array.from(input, (v) => v / 32768);
  // Pisah pita secara komplementer: x = low + hf (pasti, tanpa masalah fase saat dijumlah).
  const low = biquad("lp", 4500)(biquad("lp", 4500)(x));
  const hf = Float32Array.from(x, (v, i) => v - low[i]);
  const side = biquad("lp", 9000)(biquad("hp", 4500)(biquad("hp", 4500)(x))); // deteksi pita desis 4.5–9 kHz
  const THR = Math.pow(10, -44 / 20); // vokal ≈ −41…−51 dBFS, desis s/c ≈ −30…−36 dBFS
  const RATIO = 3;
  const MAX_RED = Math.pow(10, -12 / 20);
  const att = Math.exp(-1 / (0.001 * SR));
  const rel = Math.exp(-1 / (0.06 * SR));
  let env = 0;
  const y = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) {
    const a = Math.abs(side[i]);
    env = a > env ? att * env + (1 - att) * a : rel * env + (1 - rel) * a;
    const g = env > THR ? Math.max(MAX_RED, Math.pow(THR / env, 1 - 1 / RATIO)) : 1;
    y[i] = low[i] + g * hf[i];
  }
  // low-pass 9 kHz: bagian di atasnya paling rusak saat dikompres ulang platform
  return biquad("lp", 9000)(biquad("lp", 9000)(y));
};
/* ---------------- mastering: kompresor + loudness −14 LUFS + limiter true-peak ----------------
 * Standar platform sosial: ±−14 LUFS terintegrasi, puncak ≤ −1 dBTP. Bila file lebih pelan,
 * TikTok menaikkan volume lalu menekan puncak dengan limiter → kresek di konsonan.
 */
export const TARGET_LUFS = -14;
// Remotion menaruh klip mono di dua kanal; BS.1770 menjumlahkan kanal (+3.01 dB),
// jadi klip mono di-master ke −17 LUFS agar video stereo akhirnya −14 LUFS.
const MONO_TARGET_LUFS = TARGET_LUFS - 3.01;
const CEILING_DB = -2.0; // puncak sampel; menyisakan ruang ±0.5 dB untuk puncak antar-sampel (≤ −1.5 dBTP)

const kWeight = (x) => {
  // ITU-R BS.1770: high-shelf + high-pass RLB, koefisien untuk SR
  const shelf = (() => {
    const f0 = 1681.974450955533, G = 3.999843853973347, Q = 0.7071752369554196;
    const K = Math.tan((Math.PI * f0) / SR), Vh = 10 ** (G / 20), Vb = Vh ** 0.4996667741545416;
    const a0 = 1 + K / Q + K * K;
    return [[(Vh + (Vb * K) / Q + K * K) / a0, (2 * (K * K - Vh)) / a0, (Vh - (Vb * K) / Q + K * K) / a0], [(2 * (K * K - 1)) / a0, (1 - K / Q + K * K) / a0]];
  })();
  const rlb = (() => {
    const f0 = 38.13547087602444, Q = 0.5003270373238773, K = Math.tan((Math.PI * f0) / SR);
    const a0 = 1 + K / Q + K * K;
    return [[1, -2, 1], [(2 * (K * K - 1)) / a0, (1 - K / Q + K * K) / a0]];
  })();
  const run = (sig, [[b0, b1, b2], [a1, a2]]) => {
    const y = new Float32Array(sig.length);
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < sig.length; i++) {
      const o = b0 * sig[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
      x2 = x1; x1 = sig[i]; y2 = y1; y1 = o; y[i] = o;
    }
    return y;
  };
  return run(run(x, shelf), rlb);
};
const integratedLufs = (x) => {
  const k = kWeight(x);
  const n = Math.round(0.4 * SR), hop = Math.round(0.1 * SR);
  const blocks = [];
  for (let s = 0; s + n <= k.length; s += hop) {
    let z = 0;
    for (let i = s; i < s + n; i++) z += k[i] * k[i];
    blocks.push(z / n);
  }
  const L = (z) => -0.691 + 10 * Math.log10(z + 1e-15);
  const g1 = blocks.filter((z) => L(z) > -70);
  const m1 = g1.reduce((a, b) => a + b, 0) / g1.length;
  const g2 = g1.filter((z) => L(z) > L(m1) - 10);
  return L(g2.reduce((a, b) => a + b, 0) / g2.length);
};
const compress = (x) => {
  // RMS 10 ms, ambang −26 dBFS, rasio 2:1, attack 5 ms, release 80 ms
  const T = -26, R = 2;
  const att = Math.exp(-1 / (0.005 * SR)), rel = Math.exp(-1 / (0.08 * SR)), av = Math.exp(-1 / (0.01 * SR));
  let ms = 0, gDb = 0;
  const y = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) {
    ms = av * ms + (1 - av) * x[i] * x[i];
    const lev = 10 * Math.log10(ms + 1e-12);
    const want = lev > T ? -(lev - T) * (1 - 1 / R) : 0;
    gDb = want < gDb ? att * gDb + (1 - att) * want : rel * gDb + (1 - rel) * want;
    y[i] = x[i] * 10 ** (gDb / 20);
  }
  return y;
};
const limit = (x) => {
  // look-ahead 5 ms: min-filter kebutuhan gain di sekitar puncak, lalu dihaluskan (tanpa klik)
  const c = 10 ** (CEILING_DB / 20), L = Math.round(0.005 * SR);
  const need = Float32Array.from(x, (v) => Math.min(1, c / Math.max(Math.abs(v), 1e-9)));
  const mn = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) {
    let m = 1;
    for (let k = Math.max(0, i - L); k <= Math.min(x.length - 1, i + L); k++) if (need[k] < m) m = need[k];
    mn[i] = m;
  }
  const y = new Float32Array(x.length);
  let acc = 0;
  const half = Math.floor(L / 2);
  for (let i = 0; i < x.length + half; i++) {
    if (i < x.length) acc += mn[i];
    if (i - L >= 0) acc -= mn[i - L];
    const j = i - half;
    if (j >= 0 && j < x.length) y[j] = x[j] * (acc / Math.min(L, i + 1));
  }
  return y;
};
const toInt16 = (f) => Int16Array.from(f, (v) => Math.max(-32768, Math.min(32767, Math.round(v * 32768))));

const RAW = process.argv.includes("--raw");
let voice = pcm; // diisi setelah batas klip diketahui (mastering mengukur bagian narasi saja)

/** Tulis WAV mono 16-bit dari potongan PCM, dengan fade pendek anti-klik. */
const writeClip = (file, t0, t1) => {
  const s0 = Math.max(0, Math.round(t0 * SR));
  const s1 = Math.min(voice.length, Math.round(t1 * SR));
  const seg = Int16Array.from(voice.subarray(s0, s1));
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

// Jalur Voicebox: klip mentah terpisah ada di <out>/raw dan full.wav = klip berurutan + jeda
// 1 dtk, jadi posisi tiap klip diketahui PASTI. Pakai itu untuk batas potong, lalu petakan
// ulang timestamp whisper secara linear ke rentang suara sebenarnya (whisper.cpp sering
// melenceng 1–2 dtk lebih awal di bagian akhir audio panjang).
const knownLayout = (() => {
  const rawDir = join(outDir, "raw");
  const all = Object.keys(config.clips);
  if (!all.every((id) => existsSync(join(rawDir, `${id}.wav`)))) return null;
  const map = {};
  let at = 0;
  for (const id of all) {
    const b = readFileSync(join(rawDir, `${id}.wav`));
    const byteRate = b.readUInt32LE(28);
    let off = 12;
    let size = 0;
    while (off < b.length) {
      const tag = b.toString("ascii", off, off + 4);
      const sz = b.readUInt32LE(off + 4);
      if (tag === "data") {
        size = sz;
        break;
      }
      off += 8 + sz + (sz % 2);
    }
    const d = size / byteRate;
    map[id] = { start: at, end: at + d };
    at += d + 1;
  }
  return Math.abs(at - totalDur) < 0.1 ? map : null; // full.wav diakhiri jeda 1 dtk juga
})();
if (knownLayout) {
  for (const c of found) {
    const span = knownLayout[c.id];
    if (!span) continue;
    const f0 = Math.floor(span.start / FRAME);
    const f1 = Math.min(frameDb.length - 1, Math.ceil(span.end / FRAME));
    let a = f0;
    while (a < f1 && frameDb[a] < SILENT_DB) a++;
    let b = f1;
    while (b > a && frameDb[b] < SILENT_DB) b--;
    const s0 = a * FRAME;
    const s1 = (b + 1) * FRAME;
    const idxs = [...c.r.pairs.values()];
    const w0 = T[Math.min(...idxs)].start;
    const w1 = T[Math.max(...idxs)].end;
    c.clipStart = Math.max(span.start - 0.3, s0 - 0.12);
    c.clipEnd = Math.min(span.end + 0.5, s1 + 0.2);
    c.remap = (x) => s0 + ((x - w0) * (s1 - s0)) / Math.max(0.1, w1 - w0);
  }
  console.log("• posisi klip diambil pasti dari raw/ (Voicebox), timestamp whisper dipetakan ulang");
}

if (!RAW) {
  const r0 = Math.max(0, Math.round(found[0].clipStart * SR));
  const r1 = Math.min(pcm.length, Math.round(found[found.length - 1].clipEnd * SR));
  const region = compress(cleanVoice(pcm.subarray(r0, r1)));
  const before = integratedLufs(region);
  const gain = 10 ** ((MONO_TARGET_LUFS - before) / 20);
  const mastered = limit(Float32Array.from(region, (v) => v * gain));
  const out = Int16Array.from(pcm);
  out.set(toInt16(mastered), r0);
  voice = out;
  console.log(
    `• mastering: de-esser + low-pass 9 kHz + kompresor 2:1, ${before.toFixed(1)} → ${integratedLufs(mastered).toFixed(1)} LUFS mono (= ${TARGET_LUFS} LUFS di video stereo), limiter ${CEILING_DB} dBFS (--raw untuk mematikan)`,
  );
}

for (const { id, words, r, clipStart, clipEnd, remap } of found) {
  // waktu tiap kata naskah (relatif klip); yang tidak cocok diinterpolasi
  const at = (x) => (remap ? remap(x) : x);
  const times = words.map((_, k) => (r.pairs.has(k) ? Math.max(0, at(T[r.pairs.get(k)].start) - clipStart) : null));
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
