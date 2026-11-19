# Transkrip voiceover — "kenapa hujan sering turun sore?"

> Narasi video ini sudah dibuat lewat **Voicebox** (profil "day.one.eight narator", bahasa `en`, seed 42)
> dari `scripts/voiceover/hujan-sore.json`. File ini hanya untuk referensi / bila ingin merekam ulang.
>
> **Penting:** bila memakai tool TTS lain, tempel **hanya teks narasinya** (blok "Teks polos" di bawah) —
> jangan seluruh file ini.

## Generate ulang (lokal)

```bash
node scripts/voicebox_voiceover.mjs scripts/voiceover/hujan-sore.json --lang en --seed 42
node scripts/transcribe.mjs public/vo/hujan-sore/full.wav /tmp/hujan.json --model small --lang id
node scripts/match_voiceover.mjs scripts/voiceover/hujan-sore.json public/vo/hujan-sore/full.wav /tmp/hujan.json
```

## Naskah per klip

| No | File | Teks |
|---|---|---|
| 1 | `hook` | kenapa hujan sering turun sore? padahal siangnya panas banget. |
| 2 | `kerja` | tenang, awan juga punya jam kerja. |
| 3 | `promise` | ini prosesnya, cuma tiga langkah. |
| 4 | `p1` | pertama, dari pagi matahari manasin tanah. |
| 5 | `p2` | kedua, udara hangat dan lembap naik, makin tinggi makin dingin, lalu ngembun jadi awan. |
| 6 | `p3` | ketiga, awannya numpuk berjam-jam, kayak cucian seminggu. sore, kepenuhan, tumpah deh. |
| 7 | `data` | data tujuh tahun dari tiga puluh satu stasiun: hujan umumnya memuncak sore, paling jarang pagi. |
| 8 | `tapi` | tapi tiap daerah beda, ada yang malam, bahkan dini hari. |
| 9 | `tips` | jadi kalau siang terik banget, siapin payung buat sore. |
| 10 | `serius` | hujan sore sering bawa petir dan angin kencang. waspada ya. |
| 11 | `komen` | di tempatmu hujannya jam berapa? tulis di komen. |

Narasi closing ("follow day one eight…") tidak perlu — sudah bawaan video.

## Teks polos (salin bagian ini saja)

kenapa hujan sering turun sore? padahal siangnya panas banget.

tenang, awan juga punya jam kerja.

ini prosesnya, cuma tiga langkah.

pertama, dari pagi matahari manasin tanah.

kedua, udara hangat dan lembap naik, makin tinggi makin dingin, lalu ngembun jadi awan.

ketiga, awannya numpuk berjam-jam, kayak cucian seminggu. sore, kepenuhan, tumpah deh.

data tujuh tahun dari tiga puluh satu stasiun: hujan umumnya memuncak sore, paling jarang pagi.

tapi tiap daerah beda, ada yang malam, bahkan dini hari.

jadi kalau siang terik banget, siapin payung buat sore.

hujan sore sering bawa petir dan angin kencang. waspada ya.

di tempatmu hujannya jam berapa? tulis di komen.
