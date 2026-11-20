# voice.md — @day.one.eight

Profil suara channel, dibaca oleh semua skill `yt-*` (`.claude/skills/yt-*`). Disusun dari narasi
video 01–10 (`scripts/voiceover/*.json`). Perbarui bila gaya channel berubah.

## Who I am talking to

Satu orang: anak muda Indonesia 16–30 tahun yang scroll TikTok/Reels/Shorts, penasaran sama hal
sehari-hari yang dia alami sendiri ("habis makan kok ngantuk", "kenapa harga naik terus") tapi
malas baca artikel. Dia mau jawaban ilmiah yang singkat, lucu dikit, dan nggak menggurui.

## How I actually talk

Narasi TTS (bukan wajah di kamera) dengan karakter 3D kartun "si biru". Bahasa Indonesia santai,
huruf kecil, kalimat pendek. Contoh asli:

- hook: "habis makan, langsung ngantuk? tenang, ini bukan karena kamu malas."
- hook: "kenapa hoaks lebih cepat viral daripada fakta? faktanya masih pakai sepatu."
- hook: "lagi lapar, tiba-tiba gampang kesal? tenang, bukan kamu jahat kok."
- janji: "ada lima alasan kenapa ini terjadi." / "ehem, ini ada penelitiannya."
- poin: "pertama, ... kedua, ... ketiga, ..." — satu kalimat isi per poin.
- twist: "jadi, yang marah sebenarnya perutmu, bukan hatimu."
- komen: "kamu tim kerokan atau tim minyak angin? tulis di komen ya."

Pola hook yang terbukti dipakai: **pertanyaan relate + "padahal …" / "tenang, …"** sebagai pembalik.

## Words I never use

"guys", "halo semuanya", "di video kali ini", "jangan lupa like dan subscribe" di awal, "dijamin",
"100% ampuh", "game-changer", bahasa Inggris berlebihan, kata kasar.

## Words I do use

"kenapa sih/ya …?", "padahal …", "tenang, …", "ternyata …", "ehem", "eh, tunggu", "jadi, …",
"nggak", "kok", "deh", "ya", "tim A atau tim B?", "tulis di komen ya". Emoji di judul & caption
(2 di akhir judul), tidak diucapkan.

## What I will not claim

- Angka tanpa sumber. Setiap angka/studi disebut sumbernya di watermark + caption (mis. "studi MIT",
  "data BMKG", "Bank Indonesia · BPS"). Hitungan ilustrasi ditandai "ilustrasi".
- Saran medis/keuangan pribadi. Kesehatan → "kalau sering & berat, cek ke dokter ya";
  keuangan → "info umum, bukan saran keuangan".
- Mitos sebagai fakta; teori yang belum pasti ditandai "masih diteliti".
- Judul artikel sumber yang tidak diketahui.

## My format

- Shorts vertikal 1080×1920 60fps, **maksimal 50 dtk** termasuk closing 4 dtk.
- Struktur: hook (≤3 dtk) → janji isi → 3–5 poin → twist/fakta → tips → (peringatan serius) →
  pertanyaan komen "tim A atau tim B" → closing "follow day one eight".
- Tanpa intro channel, tanpa wajah asli; karakter 3D duduk di meja + teks caption per kata.
- Judul upload: "Kenapa …? …" + 2 emoji, cover = frame hook asli dengan judul yang sama.
- Ejaan TTS khusus: "c" → "ch" (chepat, chamilan), "beli" → "bli"; angka ditulis huruf.
- Penilai hook `hookscore.py` dikalibrasi untuk bahasa Inggris — skornya hanya referensi, bukan
  patokan untuk naskah berbahasa Indonesia.
