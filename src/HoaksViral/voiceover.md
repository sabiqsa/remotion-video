# Transkrip voiceover — "kenapa hoaks lebih cepat viral daripada fakta?"

> Narasi video ini sudah dibuat lewat **Voicebox** (profil "day.one.eight narator", bahasa `en`, seed 42;
> klip `cepat` & `tips` memakai seed 50 karena ujungnya terpotong di seed 42)
> dari `scripts/voiceover/hoaks-viral.json`. File ini hanya untuk referensi / bila ingin merekam ulang.
>
> **Penting:** bila memakai tool TTS lain, tempel **hanya teks narasinya** (blok "Teks polos" di bawah) —
> jangan seluruh file ini.

## Generate ulang (lokal)

```bash
node scripts/voicebox_voiceover.mjs scripts/voiceover/hoaks-viral.json --lang en --seed 42
node scripts/voicebox_voiceover.mjs scripts/voiceover/hoaks-viral.json --lang en --seed 50 --only cepat,tips
node scripts/transcribe.mjs public/vo/hoaks-viral/full.wav /tmp/hoaks.json --model small --lang id
node scripts/match_voiceover.mjs scripts/voiceover/hoaks-viral.json public/vo/hoaks-viral/full.wav /tmp/hoaks.json
```

Catatan: whisper menulis angka sebagai digit ("126.000", "70%", "6", "1500"). Sebelum `match_voiceover`, eja dulu
angka itu di transkrip ("seratus dua puluh enam ribu", "tujuh puluh persen", "enam", "seribu lima ratus") — tanpa itu
klip `data` dilewati karena skor cocoknya rendah.

## Naskah per klip

| No | File | Teks |
|---|---|---|
| 1 | `hook` | kenapa hoaks lebih cepat viral daripada fakta? faktanya masih pakai sepatu. |
| 2 | `ehem` | ehem, ini ada penelitiannya. |
| 3 | `data` | studi MIT ke seratus dua puluh enam ribu kabar: hoaks tujuh puluh persen lebih mungkin di-retweet. |
| 4 | `cepat` | fakta butuh waktu enam kali lebih lama buat nyampe ke seribu lima ratus orang. |
| 5 | `p1` | pertama, hoaks terasa baru dan mengejutkan. otak kita doyan yang baru. |
| 6 | `p2` | kedua, bikin emosi, kaget dan jijik. yang bikin baper, lebih gampang dibagi. |
| 7 | `p3` | ketiga, yang nyebarin itu manusia, bukan bot. iya, kita. |
| 8 | `twist` | eh, tunggu. kayak kenal pola ini. |
| 9 | `tips` | jadi sebelum share, cek sumbernya, cek tanggalnya, dan cari di situs cek fakta. baru deh share. |
| 10 | `komen` | kamu pernah ketipu hoaks apa? jujur aja, tulis di komen. |

Narasi closing ("follow day one eight…") tidak perlu — sudah bawaan video.

## Teks polos (salin bagian ini saja)

kenapa hoaks lebih cepat viral daripada fakta? faktanya masih pakai sepatu.

ehem, ini ada penelitiannya.

studi MIT ke seratus dua puluh enam ribu kabar: hoaks tujuh puluh persen lebih mungkin di-retweet.

fakta butuh waktu enam kali lebih lama buat nyampe ke seribu lima ratus orang.

pertama, hoaks terasa baru dan mengejutkan. otak kita doyan yang baru.

kedua, bikin emosi, kaget dan jijik. yang bikin baper, lebih gampang dibagi.

ketiga, yang nyebarin itu manusia, bukan bot. iya, kita.

eh, tunggu. kayak kenal pola ini.

jadi sebelum share, cek sumbernya, cek tanggalnya, dan cari di situs cek fakta. baru deh share.

kamu pernah ketipu hoaks apa? jujur aja, tulis di komen.
