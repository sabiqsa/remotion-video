# Transkrip voiceover — "kenapa lapar gampang marah?"

> Narasi video ini dibuat lewat **Voicebox** (profil "day.one.eight narator", bahasa `en`, seed 42)
> dari `scripts/voiceover/lapar-marah.json`. Ejaan "chamilan" disengaja: TTS mode `en` membaca "c"
> sebagai "k", jadi "c" ditulis "ch". File ini hanya untuk referensi / bila ingin merekam ulang.
>
> **Penting:** bila memakai tool TTS lain, tempel **hanya teks narasinya** (blok "Teks polos" di bawah) —
> jangan seluruh file ini.

## Generate ulang (lokal)

```bash
node scripts/voicebox_voiceover.mjs scripts/voiceover/lapar-marah.json --lang en --seed 42
node scripts/transcribe.mjs public/vo/lapar-marah/full.wav /tmp/lapar.json --model small --lang id
node scripts/match_voiceover.mjs scripts/voiceover/lapar-marah.json public/vo/lapar-marah/full.wav /tmp/lapar.json
```

Whisper menulis "64" dan "21" sebagai angka — ganti jadi "enam puluh empat" / "dua puluh satu" di transcript JSON
sebelum match. Kata "studi" sempat terbaca "setidak", jadi naskah p3 memakai "ada penelitian pada…".

## Naskah per klip

| File | Teks |
|---|---|
| `hook.wav` | lagi lapar, tiba-tiba gampang kesal? tenang, bukan kamu jahat kok. |
| `ehem.wav` | ternyata, ini ada penjelasan ilmiahnya. |
| `p1.wav` | pertama, gula darah turun. otak bagian pengendali emosi butuh energi, jadi rem kesabaran ikut melemah. |
| `p2.wav` | kedua, tubuh melepas hormon kortisol dan adrenalin buat menaikkan gula darah. efeknya, kamu lebih gampang tersulut. |
| `p3.wav` | ketiga, ada penelitian pada enam puluh empat orang selama dua puluh satu hari: rasa lapar berkaitan dengan sepertiga rasa kesal dan marah. |
| `twist.wav` | jadi, yang marah sebenarnya perutmu, bukan hatimu. |
| `tips.wav` | sedia chamilan, makan teratur, dan sadari: aku lagi lapar, bukan lagi kesal. |
| `komen.wav` | kamu tipe lapar diam, atau lapar ngamuk? tulis di komen ya. |

## Teks polos

```
lagi lapar, tiba-tiba gampang kesal? tenang, bukan kamu jahat kok.
ternyata, ini ada penjelasan ilmiahnya.
pertama, gula darah turun. otak bagian pengendali emosi butuh energi, jadi rem kesabaran ikut melemah.
kedua, tubuh melepas hormon kortisol dan adrenalin buat menaikkan gula darah. efeknya, kamu lebih gampang tersulut.
ketiga, ada penelitian pada enam puluh empat orang selama dua puluh satu hari: rasa lapar berkaitan dengan sepertiga rasa kesal dan marah.
jadi, yang marah sebenarnya perutmu, bukan hatimu.
sedia chamilan, makan teratur, dan sadari: aku lagi lapar, bukan lagi kesal.
kamu tipe lapar diam, atau lapar ngamuk? tulis di komen ya.
```
