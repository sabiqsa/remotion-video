# Transkrip voiceover — "kenapa habis ngopi malah ngantuk?" (review jujur americano)

> Narasi video ini sudah dibuat lewat **Voicebox** (profil "day.one.eight narator", bahasa `en`, seed 42)
> dari `scripts/voiceover/kopi-ngantuk.json`. File ini hanya untuk referensi / bila ingin merekam ulang.
>
> **Penting:** bila memakai tool TTS lain, tempel **hanya teks narasinya** (blok "Teks polos" di bawah) —
> jangan seluruh file ini.

## Generate ulang (lokal)

```bash
node scripts/voicebox_voiceover.mjs scripts/voiceover/kopi-ngantuk.json --lang en --seed 42
node scripts/transcribe.mjs public/vo/kopi-ngantuk/full.wav /tmp/kopi.json --model small --lang id
node scripts/match_voiceover.mjs scripts/voiceover/kopi-ngantuk.json public/vo/kopi-ngantuk/full.wav /tmp/kopi.json
```

## Naskah per klip

| No | File | Teks |
|---|---|---|
| 1 | `hook` | review jujur americano. sruput dulu... lho, kok malah ngantuk? |
| 2 | `rating` | rating melek: satu dari lima. maaf ya, kopi. |
| 3 | `promise` | eits, ternyata bukan salah kopinya doang. ada lima alasan. |
| 4 | `p1` | pertama, adenosin numpuk. kafein cuma nahan sinyal ngantuk. pas efeknya habis, ngantuknya datang borongan. |
| 5 | `p2` | kedua, kurang tidur. kopi itu bukan pengganti tidur. |
| 6 | `siklus` | apalagi kalau ngopi sore. tidur jadi jelek, besoknya ngantuk, ngopi lagi. muter terus. |
| 7 | `p3` | ketiga, udah kebal. yang rutin ngopi, efek kafeinnya bisa makin lemah. |
| 8 | `p4` | keempat, gula. kopi manis bisa bikin gula darah naik turun. americano mah aman, kecuali kamu tambah tiga sachet. |
| 9 | `p5` | kelima, gen. tiap orang beda cara ngolah kafein. |
| 10 | `tips` | biar nggak zonk: efek kopi bisa lima sampai enam jam. jadi ngopi pagi, maksimal empat cangkir sehari, dan stop di sore hari. |
| 11 | `serius` | tapi kalau ngantuk terus sampai ganggu aktivitas, cek ke dokter. dan jangan nyetir pas ngantuk. |
| 12 | `ulang` | rating ulang: empat dari lima. asal tidurnya cukup. |
| 13 | `komen` | kamu tim americano, atau tim kopi susu gula aren? tulis di komen. |

Narasi closing ("follow day one eight…") tidak perlu — sudah bawaan video.

## Teks polos (salin bagian ini saja)

review jujur americano. sruput dulu... lho, kok malah ngantuk?

rating melek: satu dari lima. maaf ya, kopi.

eits, ternyata bukan salah kopinya doang. ada lima alasan.

pertama, adenosin numpuk. kafein cuma nahan sinyal ngantuk. pas efeknya habis, ngantuknya datang borongan.

kedua, kurang tidur. kopi itu bukan pengganti tidur.

apalagi kalau ngopi sore. tidur jadi jelek, besoknya ngantuk, ngopi lagi. muter terus.

ketiga, udah kebal. yang rutin ngopi, efek kafeinnya bisa makin lemah.

keempat, gula. kopi manis bisa bikin gula darah naik turun. americano mah aman, kecuali kamu tambah tiga sachet.

kelima, gen. tiap orang beda cara ngolah kafein.

biar nggak zonk: efek kopi bisa lima sampai enam jam. jadi ngopi pagi, maksimal empat cangkir sehari, dan stop di sore hari.

tapi kalau ngantuk terus sampai ganggu aktivitas, cek ke dokter. dan jangan nyetir pas ngantuk.

rating ulang: empat dari lima. asal tidurnya cukup.

kamu tim americano, atau tim kopi susu gula aren? tulis di komen.
