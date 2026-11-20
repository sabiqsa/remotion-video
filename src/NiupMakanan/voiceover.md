# Transkrip voiceover — "kenapa makanan panas gaboleh ditiup?"

> Narasi video ini dibuat lewat **Voicebox** (profil "day.one.eight narator", bahasa `en`, seed 42)
> dari `scripts/voiceover/niup-makanan.json`. Ejaan "kechil", "perchikan", "chepat" disengaja: TTS mode `en`
> membaca "c" sebagai "k", jadi "c" ditulis "ch". File ini hanya untuk referensi / bila ingin merekam ulang.
>
> **Penting:** bila memakai tool TTS lain, tempel **hanya teks narasinya** (blok "Teks polos" di bawah) —
> jangan seluruh file ini.

## Generate ulang (lokal)

```bash
node scripts/voicebox_voiceover.mjs scripts/voiceover/niup-makanan.json --lang en --seed 42
node scripts/transcribe.mjs public/vo/niup-makanan/full.wav /tmp/niup.json --model small --lang id
node scripts/match_voiceover.mjs scripts/voiceover/niup-makanan.json public/vo/niup-makanan/full.wav /tmp/niup.json
```

Whisper menulis "15" sebagai angka — ganti jadi "lima belas" di transcript JSON sebelum match.

## Naskah per klip

| File | Teks |
|---|---|
| `hook.wav` | makanan masih panas, langsung ditiup? eh, tunggu dulu. |
| `ehem.wav` | dari kechil dilarang, ternyata ada alasannya. |
| `p1.wav` | pertama, napas kita bawa bakteri dari mulut. studi tiup lilin kue: bakteri di kue naik sampai lima belas kali. |
| `p2.wav` | kedua, paling bahaya buat bayi. bakteri penyebab gigi berlubang bisa pindah ke makanannya. |
| `p3.wav` | ketiga, lagi flu atau batuk? perchikan ludah ikut nempel ke makanan. |
| `twist.wav` | niup memang bikin chepat dingin. tapi sayangnya, kumannya ikut juga. |
| `tips.wav` | jadi, mending diaduk dulu, disebar di piring, atau sabar tunggu sebentar. |
| `komen.wav` | kamu tim tiup atau tim sabar? tulis di komen ya. |

## Teks polos

```
makanan masih panas, langsung ditiup? eh, tunggu dulu.
dari kechil dilarang, ternyata ada alasannya.
pertama, napas kita bawa bakteri dari mulut. studi tiup lilin kue: bakteri di kue naik sampai lima belas kali.
kedua, paling bahaya buat bayi. bakteri penyebab gigi berlubang bisa pindah ke makanannya.
ketiga, lagi flu atau batuk? perchikan ludah ikut nempel ke makanan.
niup memang bikin chepat dingin. tapi sayangnya, kumannya ikut juga.
jadi, mending diaduk dulu, disebar di piring, atau sabar tunggu sebentar.
kamu tim tiup atau tim sabar? tulis di komen ya.
```
