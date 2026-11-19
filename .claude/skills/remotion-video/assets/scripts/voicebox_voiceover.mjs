#!/usr/bin/env node
// Generate voiceover per klip lewat Voicebox (aplikasi lokal, API di 127.0.0.1:17493),
// lalu gabungkan jadi satu file <out>/full.wav (jeda 1 dtk antar klip) untuk
// ditranskripsi & dicocokkan oleh transcribe.mjs + match_voiceover.mjs.
//
//   node scripts/voicebox_voiceover.mjs scripts/voiceover/<video>.json [--lang en] [--seed 42] [--only hook,p1]
//
// Profil diambil dari VOICEBOX_PROFILE_ID di .env (default: profil "day.one.eight narator").
// Semua lokal — tidak ada yang dikirim ke internet.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const root = resolve(dirname(new URL(import.meta.url).pathname), "..");
const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const configPath = args.find((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
if (!configPath) {
  console.error("Pakai: node scripts/voicebox_voiceover.mjs <config.json> [--lang en] [--seed 42] [--only id1,id2] [--no-pad]");
  process.exit(1);
}

// .env (opsional)
const envPath = join(root, ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
}

const BASE = process.env.VOICEBOX_URL || "http://127.0.0.1:17493";
const LANG = opt("lang", "en");
const SEED = Number(opt("seed", "42"));
const ONLY = opt("only", "")?.split(",").filter(Boolean);
const PAD = !process.argv.includes("--no-pad");
const config = JSON.parse(readFileSync(resolve(root, configPath), "utf8"));
const outDir = resolve(root, config.out);
const rawDir = join(outDir, "raw");
mkdirSync(rawDir, { recursive: true });

const api = async (path, body) => {
  const res = await fetch(BASE + path, body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {});
  if (!res.ok) throw new Error(`${path} → ${res.status} ${(await res.text()).slice(0, 200)}`);
  return res;
};

const profileId = await (async () => {
  if (process.env.VOICEBOX_PROFILE_ID) return process.env.VOICEBOX_PROFILE_ID;
  const profiles = await (await api("/profiles")).json();
  const p = profiles.find((x) => x.name === "day.one.eight narator");
  if (!p) throw new Error('Profil "day.one.eight narator" tidak ditemukan; set VOICEBOX_PROFILE_ID di .env');
  return p.id;
})();

/** Baca data PCM dari WAV 16-bit (mono). */
const readWav = (buf) => {
  const sr = buf.readUInt32LE(24);
  const ch = buf.readUInt16LE(22);
  let off = 12;
  while (off < buf.length) {
    const id = buf.toString("ascii", off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    if (id === "data") return { sr, ch, pcm: buf.subarray(off + 8, off + 8 + size) };
    off += 8 + size + (size % 2);
  }
  throw new Error("WAV tanpa chunk data");
};
const wavHeader = (sr, bytes) => {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + bytes, 4);
  h.write("WAVEfmt ", 8);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(sr, 24);
  h.writeUInt32LE(sr * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36);
  h.writeUInt32LE(bytes, 40);
  return h;
};

/**
 * Deteksi kata terakhir terpotong. Qwen3-TTS yang berhenti terlalu cepat langsung jatuh ke hening
 * digital (< −85 dB) ≤ 50 ms setelah bunyi terakhir (> −40 dB); generate yang selesai normal masih
 * menyisakan suara ruang ±60–330 ms. Profil energi per 10 ms.
 */
const isCut = ({ sr, ch, pcm }) => {
  const n = Math.floor(pcm.length / 2 / ch);
  const k = Math.round(sr * 0.01);
  const db = [];
  for (let s = 0; s + k <= n; s += k) {
    let e = 0;
    for (let i = s; i < s + k; i++) e += (pcm.readInt16LE(i * ch * 2) / 32768) ** 2;
    db.push(10 * Math.log10(e / k + 1e-12));
  }
  let j = db.length - 1;
  while (j > 0 && db[j] <= -40) j--;
  let m = j + 1;
  while (m < db.length && db[m] > -85) m++;
  const tailMs = (m - j) * 10;
  return { cut: tailMs < 60, tailMs };
};

const ids = Object.keys(config.clips).filter((id) => !ONLY?.length || ONLY.includes(id));
console.log(`• Voicebox ${BASE}, profil ${profileId}, bahasa ${LANG}, seed ${SEED}`);
for (const id of ids) {
  const text = config.clips[id];
  const t0 = Date.now();
  // Qwen3-TTS sering berhenti 1 token terlalu cepat → suku kata terakhir terpotong. Pad " .."
  // di akhir teks memberi model ruang meluruh alami (bagian hening dibuang matcher). Bila ekor
  // masih terdengar terpotong, coba ulang dengan seed berikutnya.
  let st;
  let audio;
  let chk = { cut: false, tailMs: 0 };
  const pads = [" ..", " ...", " .. ."];
  for (let attempt = 0; attempt < 6; attempt++) {
    const seed = SEED + attempt;
    const pad = PAD ? pads[attempt % pads.length] : "";
    const g = await (await api("/generate", { profile_id: profileId, text: text + pad, language: LANG, seed })).json();
    st = g;
    for (let i = 0; i < 600 && !["completed", "failed", "error"].includes(st.status); i++) {
      await new Promise((r) => setTimeout(r, 1000));
      st = await (await api(`/history/${g.id}`)).json();
    }
    if (st.status !== "completed") throw new Error(`${id}: ${st.status} ${st.error ?? ""}`);
    audio = Buffer.from(await (await api(`/history/${g.id}/export-audio`)).arrayBuffer());
    chk = isCut(readWav(audio));
    if (!chk.cut) break;
    console.log(`  ${id}: ujung putus (ekor ${chk.tailMs} ms, seed ${seed}, pad "${pad}"), coba ulang`);
  }
  if (chk.cut) console.log(`  ⚠ ${id}: kata terakhir kemungkinan terpotong, dengar & ganti teks`);
  writeFileSync(join(rawDir, `${id}.wav`), audio);
  // perkiraan wajar: ±13 karakter/detik; jauh lebih panjang = kemungkinan ocehan tambahan
  const expect = text.length / 13;
  const warn = st.duration > expect * 1.8 ? "  ⚠ jauh lebih panjang dari perkiraan, cek ocehan" : "";
  console.log(`• ${id}: ${st.duration?.toFixed(2)} dtk (perkiraan ±${expect.toFixed(1)}), ${((Date.now() - t0) / 1000).toFixed(0)} dtk proses${warn}`);
}

// gabungkan SEMUA klip mentah (urutan naskah) + jeda 1 dtk → full.wav
const parts = [];
let sr = 0;
for (const id of Object.keys(config.clips)) {
  const f = join(rawDir, `${id}.wav`);
  if (!existsSync(f)) throw new Error(`klip ${id} belum ada di ${rawDir}`);
  const w = readWav(readFileSync(f));
  if (w.ch !== 1) throw new Error(`${id}: harus mono`);
  if (sr && w.sr !== sr) throw new Error(`${id}: sample rate beda (${w.sr} vs ${sr})`);
  sr = w.sr;
  parts.push(w.pcm, Buffer.alloc(sr * 2)); // 1 dtk hening
}
const data = Buffer.concat(parts);
writeFileSync(join(outDir, "full.wav"), Buffer.concat([wavHeader(sr, data.length), data]));
console.log(`✔ ${join(config.out, "full.wav")} (${(data.length / 2 / sr).toFixed(1)} dtk). Lanjut:`);
console.log(`  node scripts/transcribe.mjs ${join(config.out, "full.wav")} /tmp/<video>-transcript.json --model small --lang id`);
console.log(`  node scripts/match_voiceover.mjs ${configPath} ${join(config.out, "full.wav")} /tmp/<video>-transcript.json`);
