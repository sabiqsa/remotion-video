# Transkrip voiceover — "kenapa upil asin?"

> Narasi video ini dibuat lewat **Voicebox** (profil "day.one.eight narator", bahasa `en`, seed 42)
> dari `scripts/voiceover/upil-asin.json`. File ini hanya untuk referensi / bila ingin merekam ulang.
>
> **Penting:** bila memakai tool TTS lain, tempel **hanya teks narasinya** (blok "Teks polos" di bawah) —
> jangan seluruh file ini.

## Generate ulang (lokal)

```bash
node scripts/voicebox_voiceover.mjs scripts/voiceover/upil-asin.json --lang en --seed 42
node scripts/transcribe.mjs public/vo/upil-asin/full.wav /tmp/upil-asin.json --model small --lang id
node scripts/match_voiceover.mjs scripts/voiceover/upil-asin.json public/vo/upil-asin/full.wav /tmp/upil-asin.json
```

Whisper menulis "sembilan puluh lima persen" sebagai "95%" — ganti jadi empat kata itu di transcript JSON sebelum match.

## Naskah per klip

| File | Teks |
|---|---|
| `hook.wav` | kenapa sih upil rasanya asin? jangan pura-pura nggak tahu. |
| `janji.wav` | jawabannya ada di ingus. upil itu ingus yang mengering. |
| `p1.wav` | pertama, ingus itu sembilan puluh lima persen air. sisanya musin, protein, dan garam. |
| `p2.wav` | kedua, garamnya penting. bikin lendir tetap encer dan bisa mengalir. |
| `p3.wav` | ketiga, ingus itu jebakan. debu dan kuman nempel, terus dilawan enzim antikuman. |
| `twist.wav` | eh, ada lagi. sebagian besar ingusmu ketelan tiap hari, tanpa sadar. |
| `tips.wav` | jadi jangan dikorek pakai jari, bisa luka dan mimisan. buang ingus pelan, pakai tisu. |
| `dokter.wav` | kalau sering berdarah, atau hijau kuning disertai demam, cek ke dokter ya. |
| `komen.wav` | kamu tim ngupil diam-diam, atau tim tisu? tulis di komen. |

## Teks polos

```
kenapa sih upil rasanya asin? jangan pura-pura nggak tahu.
jawabannya ada di ingus. upil itu ingus yang mengering.
pertama, ingus itu sembilan puluh lima persen air. sisanya musin, protein, dan garam.
kedua, garamnya penting. bikin lendir tetap encer dan bisa mengalir.
ketiga, ingus itu jebakan. debu dan kuman nempel, terus dilawan enzim antikuman.
eh, ada lagi. sebagian besar ingusmu ketelan tiap hari, tanpa sadar.
jadi jangan dikorek pakai jari, bisa luka dan mimisan. buang ingus pelan, pakai tisu.
kalau sering berdarah, atau hijau kuning disertai demam, cek ke dokter ya.
kamu tim ngupil diam-diam, atau tim tisu? tulis di komen.
```
