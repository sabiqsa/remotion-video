#!/usr/bin/env node
// Generate voiceover per scene lewat ElevenLabs (text-to-speech + timestamp per kata).
//
//   node scripts/make_voiceover.mjs scripts/voiceover/kenapa-ngantuk.json [--force]
//
// Membaca ELEVENLABS_API_KEY & ELEVENLABS_VOICE_ID dari .env (tidak pernah dicetak).
// Hasil: <out>/<id>.mp3 untuk tiap klip + modul TS berisi durasi & timestamp kata.
// Klip yang teksnya tidak berubah dilewati (cache via hash), kecuali --force.

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const root = resolve(dirname(new URL(import.meta.url).pathname), "..");

const loadEnv = () => {
  const p = join(root, ".env");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
};

const fail = (msg) => {
  console.error(`✖ ${msg}`);
  process.exit(1);
};

loadEnv();
const configPath = process.argv[2];
const force = process.argv.includes("--force");
if (!configPath) fail("Pakai: node scripts/make_voiceover.mjs <config.json> [--force]");
const apiKey = process.env.ELEVENLABS_API_KEY;
const voiceId = process.env.ELEVENLABS_VOICE_ID;
const modelId = process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";
if (!apiKey) fail("ELEVENLABS_API_KEY belum diisi di .env");
if (!voiceId) fail("ELEVENLABS_VOICE_ID belum diisi di .env");

const config = JSON.parse(readFileSync(resolve(root, configPath), "utf8"));
const outDir = resolve(root, config.out);
const modulePath = resolve(root, config.module);
const publicPrefix = config.out.replace(/^public\//, "");
mkdirSync(outDir, { recursive: true });

const metaPath = join(outDir, "meta.json");
const meta = existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, "utf8")) : {};

/** Gabungkan alignment per karakter menjadi daftar kata + waktu. */
const toWords = (al) => {
  const words = [];
  let cur = null;
  al.characters.forEach((ch, i) => {
    const s = al.character_start_times_seconds[i];
    const e = al.character_end_times_seconds[i];
    if (/\s/.test(ch)) {
      if (cur) words.push(cur);
      cur = null;
      return;
    }
    if (!cur) cur = { word: "", start: s, end: e };
    cur.word += ch;
    cur.end = e;
  });
  if (cur) words.push(cur);
  return words.map((w) => ({ ...w, start: +w.start.toFixed(3), end: +w.end.toFixed(3) }));
};

for (const [id, text] of Object.entries(config.clips)) {
  const hash = createHash("sha1").update(`${voiceId}|${modelId}|${text}`).digest("hex");
  const mp3 = join(outDir, `${id}.mp3`);
  if (!force && meta[id]?.hash === hash && existsSync(mp3)) {
    console.log(`• ${id}: tidak berubah, dilewati`);
    continue;
  }
  process.stdout.write(`• ${id}: generate... `);
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/with-timestamps?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.2, use_speaker_boost: true },
      }),
    },
  );
  if (!res.ok) fail(`${id}: ElevenLabs ${res.status} ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  writeFileSync(mp3, Buffer.from(data.audio_base64, "base64"));
  const al = data.alignment ?? data.normalized_alignment;
  const words = toWords(al);
  const duration = +Math.max(...al.character_end_times_seconds).toFixed(3);
  meta[id] = { hash, text, duration, words };
  console.log(`${duration}s, ${words.length} kata`);
}

writeFileSync(metaPath, JSON.stringify(meta, null, 2));

const entries = Object.keys(config.clips)
  .filter((id) => meta[id])
  .map(
    (id) =>
      `  ${JSON.stringify(id)}: {\n    file: ${JSON.stringify(`${publicPrefix}/${id}.mp3`)},\n    duration: ${meta[id].duration},\n    words: ${JSON.stringify(meta[id].words.map(({ word, start, end }) => ({ word, start, end })))},\n  },`,
  )
  .join("\n");

writeFileSync(
  modulePath,
  `// DIBUAT OTOMATIS oleh scripts/make_voiceover.mjs — jangan diedit manual.\n` +
    `import type { VoClip } from "../brand/voiceover";\n\n` +
    `export const VO: Partial<Record<string, VoClip>> = {\n${entries}\n};\n`,
);
console.log(`✔ selesai: ${Object.keys(meta).length} klip → ${config.out}, modul → ${config.module}`);
