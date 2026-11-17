#!/usr/bin/env node
// Transkripsi audio secara LOKAL dengan whisper.cpp (tidak ada yang dikirim ke internet
// selain unduhan awal whisper.cpp & model). Output: JSON berisi kata + timestamp.
//
//   node scripts/transcribe.mjs <audio> <out.json> [--model small] [--lang id]

import { downloadWhisperModel, installWhisperCpp, transcribe } from "@remotion/install-whisper-cpp";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const root = resolve(dirname(new URL(import.meta.url).pathname), "..");
const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const [input, output] = args.filter((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
if (!input || !output) {
  console.error("Pakai: node scripts/transcribe.mjs <audio> <out.json> [--model small] [--lang id]");
  process.exit(1);
}
const model = opt("model", "small");
const language = opt("lang", "id");
const whisperPath = join(root, "whisper.cpp");
const VERSION = "1.5.5";

await installWhisperCpp({ to: whisperPath, version: VERSION, printOutput: false });
await downloadWhisperModel({ model, folder: whisperPath, printOutput: false });

// whisper.cpp butuh WAV 16 kHz mono
const tmpDir = join(whisperPath, "tmp");
mkdirSync(tmpDir, { recursive: true });
const wav = join(tmpDir, "input-16k.wav");
execFileSync("npx", ["remotion", "ffmpeg", "-y", "-loglevel", "error", "-i", resolve(input), "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", wav], {
  cwd: root,
  stdio: "inherit",
});

const { transcription } = await transcribe({
  inputPath: wav,
  whisperPath,
  whisperCppVersion: VERSION,
  model,
  language,
  tokenLevelTimestamps: true,
  printOutput: false,
});

// gabungkan token jadi kata
const words = [];
for (const seg of transcription) {
  for (const tok of seg.tokens) {
    const text = tok.text;
    if (!text || text.startsWith("[_") || text.startsWith("<|")) continue;
    const start = tok.offsets.from / 1000;
    const end = tok.offsets.to / 1000;
    if (text.startsWith(" ") || words.length === 0) {
      words.push({ word: text.trim(), start, end });
    } else {
      const last = words[words.length - 1];
      last.word += text;
      last.end = end;
    }
  }
}
const clean = words.filter((w) => w.word.length > 0);
writeFileSync(resolve(output), JSON.stringify({ text: transcription.map((s) => s.text).join(""), words: clean }, null, 2));
console.log(`✔ ${clean.length} kata → ${output}`);
