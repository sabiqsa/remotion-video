# Transkrip voiceover — "kenapa suka gigitin kuku?"

> Narasi video ini sudah dibuat lewat **Voicebox** (profil "day.one.eight narator", bahasa `en`, seed 42)
> dari `scripts/voiceover/gigit-kuku.json`. Ejaan "pemichunya" & "chari" disengaja: TTS mode `en` membaca
> "c" sebagai "k" ("pemiku", "kari"), jadi "c" ditulis "ch" agar terdengar seperti "c" Indonesia.
> File ini hanya untuk referensi / bila ingin merekam ulang.
>
> **Penting:** bila memakai tool TTS lain, tempel **hanya teks narasinya** (blok "Teks polos" di bawah) —
> jangan seluruh file ini.

## Generate ulang (lokal)

```bash
node scripts/voicebox_voiceover.mjs scripts/voiceover/gigit-kuku.json --lang en --seed 42
node scripts/transcribe.mjs public/vo/gigit-kuku/full.wav /tmp/kuku.json --model small --lang id
node scripts/match_voiceover.mjs scripts/voiceover/gigit-kuku.json public/vo/gigit-kuku/full.wav /tmp/kuku.json
```

## Naskah per klip

| No | File | Teks |
|---|---|---|
| 1 | `hook` | kenapa sih suka gigitin kuku? padahal nggak laper. |
| 2 | `nama` | nama kerennya onikofagia. dan kamu nggak sendirian. |
| 3 | `promise` | biasanya ada tiga pemichunya. |
| 4 | `p1` | pertama, cemas atau stres. gigit kuku jadi cara otak nenangin diri. |
| 5 | `p2` | kedua, bosan. tangan nganggur, mulut ikut chari kerjaan. eh, siapa yang nyuruh? |
| 6 | `p3` | ketiga, lagi mikir keras. tanpa sadar, kuku jadi camilan. |
| 7 | `bahaya` | tapi di kuku banyak kuman, dan semuanya ikut masuk mulut. bisa infeksi, gigi juga bisa retak. |
| 8 | `tips` | coba potong kuku pendek, pakai kutek pahit, atau sibukin tangan pakai squishy. |
| 9 | `serius` | kalau susah banget berhenti sampai luka, nggak apa-apa minta bantuan profesional. |
| 10 | `komen` | kamu biasanya gigit kuku pas lagi apa? nonton horor, nunggu, atau mikir? tulis di komen. |

Narasi closing ("follow day one eight…") tidak perlu — sudah bawaan video.

## Teks polos (salin bagian ini saja)

kenapa sih suka gigitin kuku? padahal nggak laper.

nama kerennya onikofagia. dan kamu nggak sendirian.

biasanya ada tiga pemichunya.

pertama, cemas atau stres. gigit kuku jadi cara otak nenangin diri.

kedua, bosan. tangan nganggur, mulut ikut chari kerjaan. eh, siapa yang nyuruh?

ketiga, lagi mikir keras. tanpa sadar, kuku jadi camilan.

tapi di kuku banyak kuman, dan semuanya ikut masuk mulut. bisa infeksi, gigi juga bisa retak.

coba potong kuku pendek, pakai kutek pahit, atau sibukin tangan pakai squishy.

kalau susah banget berhenti sampai luka, nggak apa-apa minta bantuan profesional.

kamu biasanya gigit kuku pas lagi apa? nonton horor, nunggu, atau mikir? tulis di komen.
