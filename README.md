# remotion-video

Produksi video vertikal (TikTok / Reels / Shorts) untuk **@day.one.eight** dengan [Remotion](https://www.remotion.dev): 1080×1920, 60fps, caption per kata, karakter 3D "si biru", voiceover yang disinkronkan, dan closing pixel art.

## Mulai

```bash
npm i
npm run dev        # Remotion Studio
```

Render video:

```bash
npx remotion render KenapaNgantuk out/kenapa-ngantuk.mp4 --codec=h264 --crf=18
```

Render closing saja (untuk ditempel di editor lain):

```bash
npx remotion render BrandClosingPixel out/closing-day-one-eight.mp4 --codec=h264 --crf=18
```

## Struktur

| Folder | Isi |
|---|---|
| `src/<Video>/` | satu folder per video: `script.ts` (naskah + timeline), scene, `voiceover.md` |
| `src/brand/` | komponen bersama: caption, watermark, karakter, closing, aset channel |
| `src/lib/motion.ts` | helper gerak (easing, timing dalam detik) |
| `public/` | logo, model 3D (CC0, Quaternius), efek suara, voiceover |
| `scripts/` | transkripsi lokal (whisper.cpp), pencocokan voiceover, generator suara |
| `.claude/skills/remotion-video/` | standar produksi & aset brand |

## Voiceover

1. Ambil teks narasi dari `src/<Video>/voiceover.md`, convert di tool TTS.
2. Transkripsi lokal & cocokkan ke naskah:

```bash
node scripts/transcribe.mjs <audio> /tmp/transcript.json --model small --lang id
node scripts/match_voiceover.mjs scripts/voiceover/<video>.json <audio> /tmp/transcript.json
```

`whisper.cpp/` dipasang otomatis saat pertama dijalankan dan tidak ikut ke git.

## Lisensi aset

Model 3D & animasi: Quaternius (CC0) — lihat `public/models/*/LICENSE.txt`. Remotion memerlukan company license untuk entitas tertentu: [syaratnya](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).
