# Transkrip voiceover — "kenapa harga barang naik terus?"

> Narasi video ini dibuat lewat **Voicebox** (profil "day.one.eight narator", bahasa `en`, seed 42)
> dari `scripts/voiceover/inflasi.json`. Ejaan "chepat" disengaja: TTS mode `en` membaca "c"
> sebagai "k", jadi "c" ditulis "ch"; "bli" (= beli) karena "beli" terbaca "beuli" dan "beuli" malah terbaca "boli". File ini hanya untuk referensi / bila ingin merekam ulang.
>
> **Penting:** bila memakai tool TTS lain, tempel **hanya teks narasinya** (blok "Teks polos" di bawah) —
> jangan seluruh file ini.

## Generate ulang (lokal)

```bash
node scripts/voicebox_voiceover.mjs scripts/voiceover/inflasi.json --lang en --seed 42
node scripts/transcribe.mjs public/vo/inflasi/full.wav /tmp/inflasi.json --model small --lang id
node scripts/match_voiceover.mjs scripts/voiceover/inflasi.json public/vo/inflasi/full.wav /tmp/inflasi.json
```

Whisper menulis "3", "3%", dan "10" sebagai angka — ganti jadi "tiga" / "tiga persen" / "sepuluh" di transcript
JSON sebelum match. Naskah dipangkas sekali (tanpa "menjelang lebaran", dll.) supaya total ≤ 50 dtk.

## Naskah per klip

| File | Teks |
|---|---|
| `hook.wav` | kenapa ya, harga barang naik terus? padahal gaji segitu-segitu aja. |
| `ehem.wav` | ini namanya inflasi. penyebabnya ada tiga. |
| `p1.wav` | pertama, permintaan naik. banyak orang mau bli, tapi barangnya terbatas, harganya ikut naik. |
| `p2.wav` | kedua, biaya produksi naik. bensin, bahan baku, dan upah naik, pabrik ikut menaikkan harga jual. |
| `p3.wav` | ketiga, uang yang beredar bertambah lebih chepat dari jumlah barang. uangnya makin banyak, nilainya jadi turun. |
| `twist.wav` | jadi, yang turun itu nilai uangmu. inflasi tiga persen setahun, sepuluh tahun lagi harga naik sekitar sepertiga. |
| `tips.wav` | belanja sesuai kebutuhan, simpan uang di tempat yang hasilnya di atas inflasi, dan tambah skill. |
| `komen.wav` | dulu waktu kecil, uang jajan kamu berapa? tulis di komen ya. |

## Teks polos

```
kenapa ya, harga barang naik terus? padahal gaji segitu-segitu aja.
ini namanya inflasi. penyebabnya ada tiga.
pertama, permintaan naik. banyak orang mau bli, tapi barangnya terbatas, harganya ikut naik.
kedua, biaya produksi naik. bensin, bahan baku, dan upah naik, pabrik ikut menaikkan harga jual.
ketiga, uang yang beredar bertambah lebih chepat dari jumlah barang. uangnya makin banyak, nilainya jadi turun.
jadi, yang turun itu nilai uangmu. inflasi tiga persen setahun, sepuluh tahun lagi harga naik sekitar sepertiga.
belanja sesuai kebutuhan, simpan uang di tempat yang hasilnya di atas inflasi, dan tambah skill.
dulu waktu kecil, uang jajan kamu berapa? tulis di komen ya.
```
