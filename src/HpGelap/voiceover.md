# Transkrip voiceover — "kenapa gaboleh main hp di tempat gelap?"

> Narasi video ini dibuat lewat **Voicebox** (profil "day.one.eight narator", bahasa `en`, seed 42)
> dari `scripts/voiceover/hp-gelap.json`. Ejaan khusus untuk TTS mode `en`: "hp" ditulis **"hape"**
> (kalau "hp" dibaca "eych-pee"), "cepat" ditulis **"chepat"** ("c" dibaca "k"). File ini hanya untuk
> referensi / bila ingin merekam ulang.
>
> **Penting:** bila memakai tool TTS lain, tempel **hanya teks narasinya** (blok "Teks polos" di bawah) —
> jangan seluruh file ini.

## Generate ulang (lokal)

```bash
node scripts/voicebox_voiceover.mjs scripts/voiceover/hp-gelap.json --lang en --seed 42
node scripts/transcribe.mjs public/vo/hp-gelap/full.wav /tmp/hp-gelap.json --model small --lang id
node scripts/match_voiceover.mjs scripts/voiceover/hp-gelap.json public/vo/hp-gelap/full.wav /tmp/hp-gelap.json
```

Whisper menulis "3" sebagai angka — ganti jadi "tiga" di transcript JSON sebelum match.

## Naskah per klip

| File | Teks |
|---|---|
| `hook.wav` | kenapa sih nggak boleh main hape di tempat gelap? katanya bikin mata minus. |
| `mitos.wav` | tenang, minus belum terbukti. tapi ada tiga hal yang beneran terjadi. |
| `p1.wav` | pertama, mata kerja lembur. pupil melebar karena gelap, layarnya terang, mata jadi chepat lelah. |
| `p2.wav` | kedua, jarang kedip. mata fokus ke layar, jadi kering dan perih. |
| `p3.wav` | ketiga, susah tidur. cahaya layar menekan melatonin, hormon ngantuk. |
| `twist.wav` | eh, ada lagi. main hape sambil miring, satu mata ketutup bantal? mata itu bisa buta sementara, beberapa menit. |
| `tips.wav` | jadi nyalain lampu, turunin kecerahan, istirahatin mata. kalau kabur terus, cek ke dokter mata ya. |
| `komen.wav` | kamu tim main hape sampai ketiduran, atau tim hape di-charge jauh? tulis di komen. |

## Teks polos

```
kenapa sih nggak boleh main hape di tempat gelap? katanya bikin mata minus.
tenang, minus belum terbukti. tapi ada tiga hal yang beneran terjadi.
pertama, mata kerja lembur. pupil melebar karena gelap, layarnya terang, mata jadi chepat lelah.
kedua, jarang kedip. mata fokus ke layar, jadi kering dan perih.
ketiga, susah tidur. cahaya layar menekan melatonin, hormon ngantuk.
eh, ada lagi. main hape sambil miring, satu mata ketutup bantal? mata itu bisa buta sementara, beberapa menit.
jadi nyalain lampu, turunin kecerahan, istirahatin mata. kalau kabur terus, cek ke dokter mata ya.
kamu tim main hape sampai ketiduran, atau tim hape di-charge jauh? tulis di komen.
```
