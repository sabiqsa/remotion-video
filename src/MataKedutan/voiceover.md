# Transkrip voiceover — "kenapa mata kedutan? pertanda rezeki atau cuma kurang tidur?"

> Narasi video ini sudah dibuat lewat **Voicebox** (profil "day.one.eight narator", bahasa `en`, seed 42;
> klip `tips` memakai seed 52 karena ujung kata "layar" terpotong di seed 42)
> dari `scripts/voiceover/mata-kedutan.json`. File ini hanya untuk referensi / bila ingin merekam ulang.
>
> **Penting:** bila memakai tool TTS lain, tempel **hanya teks narasinya** (blok "Teks polos" di bawah) —
> jangan seluruh file ini.

## Generate ulang (lokal)

```bash
node scripts/voicebox_voiceover.mjs scripts/voiceover/mata-kedutan.json --lang en --seed 42
node scripts/voicebox_voiceover.mjs scripts/voiceover/mata-kedutan.json --lang en --seed 52 --only tips
node scripts/transcribe.mjs public/vo/mata-kedutan/full.wav /tmp/kedutan.json --model small --lang id
node scripts/match_voiceover.mjs scripts/voiceover/mata-kedutan.json public/vo/mata-kedutan/full.wav /tmp/kedutan.json
```

## Naskah per klip

| No | File | Teks |
|---|---|---|
| 1 | `hook` | mata kedutan, pertanda rezeki? atau cuma kurang tidur? |
| 2 | `mitos` | katanya, kalau yang kiri, bakal dapet cuan. |
| 3 | `promise` | jadi yang bener yang mana? kata sains, pemicunya ada tiga. |
| 4 | `p1` | pertama, kurang tidur. otot kelopak mata jadi sensitif, gampang kedutan sendiri. |
| 5 | `p2` | kedua, kebanyakan kafein. kopi itu stimulan, ototnya ikut kesetrum. |
| 6 | `p3` | ketiga, stres dan kelamaan natap layar. matanya capek dan kering. |
| 7 | `fakta` | namanya miokimia. umumnya nggak bahaya, dan hilang sendiri. |
| 8 | `tips` | jadi tidur cukup, kurangi kopi, dan istirahatin mata dari layar. |
| 9 | `serius` | tapi kalau lebih dari dua minggu, sampai kelopaknya nutup, atau menjalar ke wajah, cek ke dokter ya. |
| 10 | `komen` | kamu biasanya kedutan kiri atau kanan? tulis di komen. |

Narasi closing ("follow day one eight…") tidak perlu — sudah bawaan video.

## Teks polos (salin bagian ini saja)

mata kedutan, pertanda rezeki? atau cuma kurang tidur?

katanya, kalau yang kiri, bakal dapet cuan.

jadi yang bener yang mana? kata sains, pemicunya ada tiga.

pertama, kurang tidur. otot kelopak mata jadi sensitif, gampang kedutan sendiri.

kedua, kebanyakan kafein. kopi itu stimulan, ototnya ikut kesetrum.

ketiga, stres dan kelamaan natap layar. matanya capek dan kering.

namanya miokimia. umumnya nggak bahaya, dan hilang sendiri.

jadi tidur cukup, kurangi kopi, dan istirahatin mata dari layar.

tapi kalau lebih dari dua minggu, sampai kelopaknya nutup, atau menjalar ke wajah, cek ke dokter ya.

kamu biasanya kedutan kiri atau kanan? tulis di komen.
