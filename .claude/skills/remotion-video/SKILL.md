---
name: remotion-video
description: Standar produksi video/motion graphic Remotion untuk akun @day.one.eight — format vertikal 1080x1920 60fps untuk TikTok/Reels/Shorts, caption gaya viral (huruf kecil, muncul per kata, highlight kuning), karakter 3D default "si biru" kartun kepala besar di atas rig Mannequin (animasi CC0), struktur hook → poin, sumber sebagai watermark kecil, watermark anti re-upload @day.one.eight, voiceover dari TTS pihak ketiga yang dicocokkan per kata (whisper lokal), closing pixel art dengan logo + CTA "@day.one.eight" + suara klik, dan gaya gerak anti-generik (tanpa floating/bobbing ala screensaver). Gunakan skill ini SETIAP kali membuat video, motion graphic, explainer, konten short/TikTok/Reels baru, atau komposisi Remotion baru di proyek ini — termasuk saat user hanya memberi judul + naskah/artikel dan bilang "buatin video", "bikin motion graphic", "jadikan konten tiktok", atau minta revisi besar pada video yang ada.
---

# remotion-video

Panduan membuat video Remotion yang konsisten dengan brand @day.one.eight dan tidak terlihat generik. Hasil akhirnya adalah **source yang siap dirender** — user yang menjalankan render-nya sendiri. Contoh acuan lengkap di proyek ini: `src/KenapaNgantuk/`, `src/MasukAngin/` (set selimut, cap ✕ di hook, kamera punggung, props diskret), dan `src/KopiNgantuk/` (set kafe, gelas berwajah, rating bintang, wardrobe keriting + jaket + kacamata kotak).

## Alur kerja

1. **Review dulu, kerjakan kemudian.** Sebelum menulis kode, baca permintaan, konten sumber, dan kode yang sudah ada. Lalu sampaikan rencana singkat ke user dan tunggu persetujuannya:
   - naskah per scene (teks layar huruf kecil, diringkas dengan kata-kata sendiri, kata kunci ditandai),
   - durasi tiap scene dalam detik + total,
   - ide visual/gerak tiap scene (apa yang terjadi pada ketukan mana),
   - aset yang dibutuhkan dan fallback-nya.
   Pertanyaan yang benar-benar terbuka ditanyakan di tahap ini, bukan di tengah coding. Kalau user minta ide/riset referensi, boleh riset singkat dan sebutkan sumbernya.
2. **Siapkan fondasi** (sekali per proyek). Pastikan file ini ada; kalau belum, salin dari `assets/` skill ini:
   - `src/lib/motion.ts`, `src/brand/WordText.tsx`, `src/brand/SourceWatermark.tsx`, `src/brand/HandleWatermark.tsx`, `src/brand/HandleDecal.tsx`, `src/brand/BrandTag.tsx`, `src/brand/Character3D.tsx` + `src/brand/cartoonBody.ts` + `src/brand/wardrobe.ts`, `src/brand/BrandClosingPixel.tsx` (+ `BrandClosing.tsx`, karena konstanta brand diimpor dari sana)
   - `public/logo.png`, `public/sfx/click.wav`, `public/models/ual/UAL1_Standard.glb`
   - dependency: `npx remotion add @remotion/google-fonts @remotion/media` (dan `@remotion/three` bila pakai 3D)
3. **Bangun komposisi** di `src/<NamaVideo>/` dengan `script.ts` (naskah + timeline dalam detik) terpisah dari komponen visual, supaya teks mudah direvisi.
4. **Sumber sebagai watermark** sepanjang konten, lalu **akhiri dengan `BrandClosingPixel`**. Siapkan juga teks caption untuk upload (lihat Watermark sumber).
5. **Verifikasi tanpa merender video**: `npx tsc --noEmit`, `npx eslint src/<NamaVideo>`, grep anti-floating (di bawah), lalu cek visual lewat Remotion Studio atau still (`npx remotion still <Id> out.jpg --frame=N --scale=0.3`) di setiap scene + closing. Periksa terutama: teks tidak meluber/terpotong, blok highlight tidak terbelah dua baris, elemen tidak menabrak teks. Jangan jalankan `npx remotion render`.
6. **Serah terima**: sebutkan file yang dibuat, ID komposisi, durasi, apa yang belum dicek (mis. suara belum didengar), dan perintah render siap salin:
   ```bash
   npx remotion render <Id> out/<NN>-<nama>/<nama>.mp4 --codec=h264 --crf=18 --audio-bitrate=320k
   ```
   **Folder hasil berurut per konten:** `out/<NN>-<nama>/` dengan `NN` = nomor urut 2 digit (lanjutan folder bernomor tertinggi di `out/`, mis. `04-…`). Isinya `<nama>.mp4`, `caption.txt` (baris 1 `NN – <nama>.mp4 (m:ss)`, lalu judul/caption/sumber/tag/komentar pin TikTok + blok YouTube Shorts), dan opsional `cover.png`. Aset non-konten (`karakter/`, `youtube/`, `voice-*`) tetap di akar `out/`.
   **Cover wajib** di setiap video (`out/<NN>-<nama>/cover.png`, 1080×1920) = **frame asli dari video**, bukan desain terpisah, supaya cover pasti sesuai isi konten. Rancang hook agar judulnya **sama dengan judul upload** (mis. "habis ngopi kok *ngantuk?*") dan ada momen aksi yang menggambarkannya; cover diambil di detik saat judul sudah tampil penuh + aksi paling jelas (mis. kepala jatuh, si angin dicoret "bukan aku!"). Catat detiknya sebagai `export const COVER_AT` (+ perintah still di komentarnya) di `script.ts`. Judul & wajah karakter wajib di **tengah 1080×1440** (grid profil TikTok memotong cover jadi 3:4; rak Shorts juga memotong tengah) — cek dengan `sips -c 1440 1080`. Masukkan momen cover ke rencana review. Perintah (frame = detik × 60; jangan pakai komposisi 1-frame + `<Freeze>` — Sequence di dalamnya terpotong durasi 1 frame sehingga teks hilang):
   ```bash
   npx remotion still <Id> out/<NN>-<nama>/cover.png --frame=<COVER_AT×60> --image-format=png
   ```
   **Cek judul upload sebelum cover dikunci** (skill `yt-package`, profil suara di `.claude/youtube/voice.md`). Tulis beberapa calon judul + teks hook layar, lalu lint sebagai pasangan:
   ```bash
   python3 .claude/skills/yt-package/title.py --title "Kenapa Harga Barang Naik Terus? 😱💸" --thumb "naik terus?"
   ```
   Perhatikan batas 40 karakter (feed mobile) dan saran "no-number". Peringatan "duplicate" boleh diabaikan karena aturan cover kita memang judul = teks hook. Skor `yt-script/hookscore.py` dikalibrasi untuk bahasa Inggris, jadi pakai daftar 21 rumusnya (`yt-script/hooks.json`) sebagai inspirasi hook, bukan skornya sebagai patokan. Untuk cari topik berikutnya, pakai `yt-viral`.

## Spesifikasi format

| Item | Nilai |
|---|---|
| Ukuran | 1080 × 1920 (9:16) |
| FPS | **60** |
| Codec saran | H.264, CRF 18 |
| Safe zone | atas 150px, bawah 380px, kanan 140px, kiri 80px (UI TikTok/Reels menutupi area ini) |
| Durasi | **maksimal 50 detik** total (termasuk closing 4 dtk → konten ≤46 dtk; sasaran 46–50 dtk) — preferensi channel, menggantikan aturan lama 50–59 dtk. Narasi Voicebox ±13 karakter/dtk + jeda ±0.65 dtk per scene; bila lewat, pangkas naskah (jangan percepat tempo). Isi dengan poin + komedi, bukan jeda kosong |
| Audio | **−14 LUFS** terintegrasi, true peak **≤ −1.5 dBTP**, AAC 320 kbps (`--audio-bitrate=320k`). Lebih pelan dari itu → TikTok menaikkan volume & menekan puncak → kresek. |

Tulis semua waktu dalam **detik** dan konversi dengan `sec(detik, fps)`. Angka frame mentah yang ditulis untuk 30fps akan jadi dua kali lebih cepat di 60fps.

## Struktur video

Penonton memutuskan lanjut atau tidak di 3 detik pertama, jadi jangan buka dengan logo atau judul panjang.

| Bagian | Durasi | Isi |
|---|---|---|
| Hook | 0–3 dtk | Pertanyaan/klaim yang relate ("habis makan langsung *ngantuk?*") + aksi visual tegas (mis. kepala jatuh + getar kamera sekali), lalu satu baris pembalik kecil ("bukan karena kamu malas kok") |
| Janji isi | ~2 dtk | "ada *5 alasan*" — penanda poin mulai muncul |
| Poin | 4–4.5 dtk per poin | Penanda "n/5" di atas, judul poin + 1 kalimat isi, opsional `tip:` atau catatan kejujuran ("(teori ini masih diteliti)") |
| Daftar cepat (opsional) | ~0.7 dtk per item | Item berganti cepat dengan tag alasan singkat |
| Penutup isi | ~3 dtk | Kesimpulan + ajakan aman ("tapi kalau sering & berat, *cek ke dokter*") |
| Closing | 4 dtk | `BrandClosingPixel` |

Ganti sesuatu di layar tiap 3–5 detik (poin baru, pose kamera baru, prop baru) supaya perhatian ter-reset.

## Gaya teks: caption viral

Komponen: `WordText` (`src/brand/WordText.tsx`), diletakkan di `left: 80, right: 140, top: 320`. Isi `lines` di `script.ts`:

```ts
{ text: "langsung *ngantuk?*", at: 0.4, style: "title" }
```

- **Huruf kecil**, Helvetica (`"Helvetica Neue", Helvetica, Arial, sans-serif`), rata tengah di area aman, di atas karakter/visual.
- **Putih**; satu **frasa kunci per scene** diapit `*bintang*` → blok kuning `#FFD400` menyapu dari kiri di belakang kata, teks berubah gelap, lalu satu punch.
- Gaya baris: `title` 112px/800, `body` 54px/600, `note` 42px italic abu-abu, `tip` chip outline kuning 44px.
- Kata muncul **satu per satu** (stagger 0.05 dtk, slide naik + pop kecil). Blok teks keluar cepat ke atas 0.15 dtk di akhir scene, lalu hard cut.
- Panjang: judul maks ~16 karakter per baris di 112px; frasa kunci tidak boleh lebih lebar dari ~800px karena tidak akan dipatah (`nowrap`). Kalau terlalu panjang, pendekkan kalimatnya (mis. "masalah kesehatan" → "*gangguan* kesehatan"), jangan mengecilkan font.
- Isi maksimal ~2 baris body per scene agar sempat terbaca; beri hold ≥1.2 dtk setelah kata terakhir muncul.

Elemen pendukung yang terbukti bekerja (`src/brand/PointCounter.tsx` generik: `<PointCounter scenes={SCENES} showFrom={sceneById("promise").start} />`; contoh lain di `src/KenapaNgantuk/Overlay.tsx`):
- **Penanda poin**: pill gelap di `top ≈ 170` berisi "n/5" (angka bergeser naik saat berganti) + 5 blok progres.
- **Ticker daftar**: nama item putih + tag kuning + titik progres.

## Interaktif & komedi (pola dari `src/MasukAngin/`)

Konten edukasi lebih ditonton sampai habis & dikomentari bila ada momen interaktif dan lucu — tapi bagian kesehatan/keselamatan tetap serius.

- **Hook pakai pola "kenapa …?"** + keluhan relate yang lucu ("padahal jendela udah ditutup").
- **Tokoh pendamping** untuk komedi (mis. "si angin": awan kecil berwajah 3D yang terus "dituduh"): masuk mengendap (gerak `stepped`), dicap ✕, membela diri lewat balon teks ("bukan aku!", "tuh kan, bukan aku"), ditiup bersin, tutup hidung saat sendawa, tos di akhir. Mood awan: `smile`, `open`, `closed`, `sweat`.
- **Balon teks komik** (`Bubble` di `Overlay.tsx`): putih, border gelap, ekor, pop `EASE.back`, 1–1.5 dtk. Taruh tepat di atas tokoh yang bicara; cek dengan still. Bila tokohnya objek 3D yang berpindah/kamera berganti pose, **proyeksikan** posisinya ke layar (lihat `cupScreen()` di `src/KopiNgantuk/Scene3D.tsx`: `PerspectiveCamera` dengan fov & aspek kanvas yang sama → `Vector3.project`) lalu taruh ekor balon di titik ±0.95 di atas objek, memanjang ke kiri — supaya balon tidak menutupi wajah karakter.
- **Tokoh benda berwajah** (pola `src/KopiNgantuk/`): gelas "si americano" dengan mata/mulut sederhana + mood per ketukan (`smile`, `open`, `closed`, `sweat`, `angry`), lompat kecil (`hop`) saat bereaksi, menghilang di bagian serius lalu kembali. Format **"review jujur"** (rating bintang 1/5 di hook → rating ulang 4/5 di akhir) bekerja sebagai hook + payoff.
- **Kuis tebak-tebakan**: pertanyaan di narasi → kartu A/B → scene tanpa narasi berisi hitung mundur 3-2-1 (+ `tick`) → jawaban dibuka (+ `ding`), opsi salah dicoret & redup, opsi benar kuning + ✓. Kartu hilang ±1.8 dtk setelah jawaban agar tidak menabrak teks.
- **Ajakan komen** sebelum closing: "kamu tim X atau tim Y?" + dua tombol pil + "tulis di komen 👇"; siapkan juga **komentar yang di-pin** di `caption.md`.
- **Pergantian nada**: candaan berhenti saat info serius ("nah, yang ini serius") — tokoh komedi menghilang, wajah si biru khawatir, ikon peringatan muncul.
- **Efek suara komedi** dari `scripts/make_sfx_comedy.py` (tanpa dependency): `whoosh`, `thud`, `boing`, `burp` (pop lucu), `srek`, `tick`, `ding`, `pop`, `slurp` ("sruput" sedotan), `rain`, `thunder`, `drip`, `coin`, `buzz`, `twitch`, `glint`, `rocket`, `crunch`, `squish`, `blow` (tiup "fuuuh"), `sneeze` ("ha-CHI!"), `steam` (desis uap), `growl` (perut keroncongan "krucuk~"), `huff` (dengus kesal "hmph!"), `sting` (hentakan syok "DUN!" sub-bass, untuk momen kaget dramatis), `kaching` (mesin kasir, harga naik) — puncak −6 dBFS, volume 0.35–0.9, dipasang di ketukan lewat daftar `SFX` di `src/<Video>/sfx.ts` (file tanpa React, supaya bisa di-bundle esbuild untuk verifikasi terukur). `whoosh` (noise rendah) mudah menjumlah dengan narasi jadi puncak tinggi; bila true peak lewat, turunkan volumenya atau ganti `boing`.
- **Suara saklar lampu**: `public/sfx/switch.wav` diambil dari pustaka SFX Remotion (`https://remotion.media/switch.wav`, daftar lengkap di skill `remotion-best-practices` → `remotion-markup/sfx.md`), dipadding ke 0.6 dtk, puncak ±−8 dBFS. Simpan SFX remote ke `public/sfx/` (jangan URL langsung) supaya render tidak butuh internet. Taruh `name` + `from` langsung di `<Audio>` (tanpa bungkus `<Sequence>`), contoh `src/HpGelap/index.tsx`.
- Semua ketukan dikumpulkan di satu objek `BEATS` di `src/<Video>/beats.ts` (detik absolut, dari `beat(scene, kataNarasi, fallback, after?)`) yang dipakai bersama oleh scene 3D, overlay, dan SFX — jadi ikut bergeser otomatis saat voiceover masuk. Kata pemicu dicocokkan dengan **awalan**: "b" juga cocok dengan "berapa", jadi pakai argumen `after` (mis. cari "B" setelah waktu "A") untuk kata pendek.
- **Jangkar ketukan ke kata yang tepat**, bukan ke awal scene: efek yang menggambarkan kata harus jatuh *di* kata itu (bersin setelah "flu", retak saat "turun", ding saat "B", kerok saat "kerokan", duduk saat "duduk"). Setelah VO masuk, cetak tabel "ketukan → kata yang sedang diucapkan" dari `meta.json` dan perbaiki yang meleset.
- **Efek suara harus terdengar di atas narasi**: bunyi pendek/tipis (pop) tenggelam. Pakai `pop` versi "bloop" (dua nada + badan rendah), volume efek 0.7–1.0 × `SFX_GAIN`, dan **ducking** narasi (`voDuck`: −4 dB selama 0.25 dtk di setiap efek, lewat `volume={(f) => …}` pada `<Audio>` narasi).
- **Preview Studio**: `prefetch()` semua file audio (efek + VO) di komponen komposisi supaya bunyi pertama tidak telat/terlewat. Waktu di hasil render sendiri presisi.
- **Verifikasi terukur** (tanpa render video): `npx remotion render <Id> /tmp/a.wav --codec=wav`, lalu cross-correlation tiap file efek & awal klip VO terhadap audio render (target: geser ≤ ±10 ms, korelasi ≥ 0.5; korelasi < 0.3 = bunyi tertutup), plus ukur LUFS/true peak (target −14 LUFS, ≤ −1.5 dBTP; turunkan `SFX_GAIN` bila puncak lewat).

- **Dolly zoom (vertigo) untuk momen syok** (`src/Inflasi/Scene3D.tsx`): `Pose` punya `fov`; macro wajah mulai jauh + lensa sempit (snap zoom), lalu kamera maju sambil FOV melebar dengan `fov = 2·atan(dRef·tan(FOV/2)/d)` sehingga wajah tetap seukuran dan latar "tertarik". Proyeksi overlay (`toScreen`) wajib memakai FOV pose yang sama. Elemen 2D di hook jangan dikunci ke posisi layar benda yang ikut membesar saat macro (bisa menutup mata) — taruh di posisi tetap di luar wajah.

## Gerak anti-generik

Yang membuat motion graphic terasa "template" adalah gerak yang tidak punya alasan: benda melayang naik-turun, berputar terus, kamera mengorbit tanpa henti. Gerak yang bagus **bercerita pada ketukan**: sesuatu terjadi, mendarat, lalu diam supaya penonton sempat membaca.

Prinsip:
- **Masuk → diam → keluar.** Setiap elemen punya momen masuk yang jelas, lalu benar-benar diam sampai keluar/scene berganti. Gunakan `prog()`/`envelope()` dari `motion.ts`, atau helper `keyed()` (nilai berpindah antar target pada detik tertentu) seperti di `src/KenapaNgantuk/Scene3D.tsx`.
- **Tidak ada idle loop berbasis waktu.** Hindari `Math.sin(frame / x)` / `Math.cos(frame ...)` dan rotasi `frame * k` terus-menerus. Kalau objek perlu "hidup", beri aksi diskret: punch, satu kali goyang lalu berhenti, ganti pose, jatuh lalu memantul sekali.
- **Kamera bergerak karena ada alasan.** Satu pose kamera per scene, pindah 0.35 dtk (`EASE.inOut`) tepat saat scene baru mulai, lalu diam. Getaran kamera hanya untuk benturan (kepala jatuh, benda mendarat) — pola teredam 0.3 dtk.
- **Karakter beraksi pada ketukan**: menyuap sekali, kepala jatuh ke meja, mendongak/menguap sekali, tersentak bangun, melambai dua kali. Klip idle karakter (`Sitting_Idle_Loop`, `Idle_Loop`) boleh berjalan terus karena itu gerak tubuh alami, bukan dekorasi — yang dilarang adalah props/kamera/background yang melayang.
- **Props** pop masuk (`EASE.back`) + satu putaran masuk, lalu diam; mengecil cepat di akhir scene.
- **Easing tegas.** Masuk `EASE.out`, keluar `EASE.in`, hindari linear; overshoot hanya untuk aksen.
- **Ritme**: stagger 0.05–0.12 dtk; jeda baca ≥1.2 dtk.
- **Staccato** (`stepped()`) untuk gaya pixel/sprite.

| Pola generik | Ganti dengan |
|---|---|
| Objek melayang naik-turun (`sin`) | Pop masuk lalu diam; punch saat disebut |
| Kamera orbit pelan terus-menerus | Pose kamera per scene, pindah di awal scene |
| Partikel/ikon berputar terus | Satu putaran ber-easing saat masuk, lalu berhenti |
| Partikel mengalir terus | Mengalir **sekali** (stagger), lalu hasilnya diam (mis. perut menyala) |
| Fade-in lambat semua elemen | Muncul per kata + highlight + stagger berirama |
| Background "bernapas" | Background statis |
| Karakter mengangguk berulang | Aksi diskret per ketukan |

Cek mandiri sebelum serah terima (hasil harus kosong, atau setiap baris punya alasan cerita):
```bash
grep -nE "Math\.(sin|cos)\(\s*frame|frame\s*\*\s*0?\.[0-9]+\)" -r src/<NamaVideo>
```

## Voiceover

**Jalur utama: Voicebox (aplikasi lokal milik user, Qwen3-TTS voice clone, API `http://127.0.0.1:17493`).** Profil **"day.one.eight narator"** berisi sampel 15.5 dtk narasi video KenapaNgantuk (transkrip persis) sehingga suara konsisten antar video. Pakai bahasa **`en`** (kata santai seperti "udah" tetap; `ms` membakukan kata; tidak ada `id`).

```bash
node scripts/voicebox_voiceover.mjs scripts/voiceover/<video>.json --lang en --seed 42
node scripts/transcribe.mjs public/vo/<video>/full.wav /tmp/<video>.json --model small --lang id
node scripts/match_voiceover.mjs scripts/voiceover/<video>.json public/vo/<video>/full.wav /tmp/<video>.json
```

Script pertama generate tiap klip (async → poll `/history/{id}` → `export-audio`), simpan di `public/vo/<video>/raw/`, beri peringatan bila durasi jauh di atas perkiraan (±13 karakter/dtk = tanda ocehan), lalu menggabungkan semua klip + jeda 1 dtk jadi `full.wav`. Pelajaran: **sampel profil yang pendek/transkripnya tidak cocok membuat Qwen "melanjutkan" sampel** (ocehan "kaba kaba kabar…" di awal, atau mengulang "apakah…") — jangan pakai profil lama "Indonesia". Setiap generate tercatat di riwayat Voicebox user. Bila Voicebox tidak jalan (`curl 127.0.0.1:17493/health` gagal), minta user membuka aplikasinya. **Kata terakhir terpotong:** Qwen3-TTS sering berhenti terlalu cepat sehingga suku kata terakhir putus mendadak (terdengar "kepotong"; terjadi di 5/13 klip KopiNgantuk dan 3/11 MasukAngin). Ciri pastinya: suara jatuh ke hening digital (< −85 dB) **≤ 50 ms** setelah bunyi terakhir (> −40 dB), sedangkan generate yang selesai normal masih menyisakan suara ruang ±60–330 ms (jangan cuma mengukur 60 ms terakhir — file yang terpotong sering ditutup hening digital sehingga lolos). Script menambahkan pad `" .."` di akhir teks (heningnya dibuang matcher), memeriksa tiap klip mentah dengan ciri itu, dan mencoba ulang hingga 6× dengan seed+1 serta pad bergantian (`" .."`, `" ..."`, `" .. ."`); `--no-pad` mematikan pad. Klip lama yang terpotong → generate ulang dengan `--only <id>` lalu transkripsi + match ulang.

Alternatif: user membuat suara sendiri di tool TTS pihak ketiga dari transkrip `voiceover.md` (lalu langkah 3–7 di bawah), atau ElevenLabs API via `make_voiceover.mjs` bila ada API key.

1. **Naskah narasi** di `scripts/voiceover/<video>.json` (`out`, `module`, `clips` per scene). Narasi closing tidak perlu — sudah bawaan `BrandClosingPixel`. Kalimat lebih mengalir dari teks layar, angka ditulis dengan huruf, handle dieja "day one eight". Masukkan ke rencana review. **Huruf "c" Indonesia**: Voicebox mode `en` membacanya "k" ("pemicu" → "pemiku", "cari" → "kari"). Setelah generate, cek transkrip whisper untuk kata ber-c; bila salah, tulis "ch" di naskah narasi ("pemichunya", "chari") lalu generate ulang klip itu saja (`--only`). Kata yang sudah terbaca benar (mis. "cemas", "camilan") biarkan. **Huruf "e" pepet**: TTS bisa membaca "e" pepet jadi "eu" (mis. "beli" → "beuli"). Perbaiki hanya kata yang dikeluhkan user: buang "e"-nya ("beli" → "bli"). Jangan tulis "eu" ("beuli" malah terbaca "boli"). Bila ragu, buat 3–4 varian ejaan ke `out/voice-test/` (config dengan `"out": "out/voice-test/<kata>"`) dan biarkan user memilih lewat telinga; whisper tidak bisa membedakan pepet vs "eu".
2. **Transkrip untuk user**: `src/<Video>/voiceover.md` — tabel nama file + teks per klip, pengaturan (bahasa Indonesia, santai, tempo normal–cepat, tanpa musik), dan blok **teks polos**. Tulis jelas di atas: *tempel hanya teks narasi, jangan seluruh file* (pernah terjadi seluruh md ikut terbaca → audio 4 menit).
3. **User mengirim audio**: per klip (`<id>.wav/mp3/m4a` di `public/vo/<video>/`) atau satu file panjang.
4. **Transkripsi lokal** (whisper.cpp 1.5.5 + model `small`, tanpa cmake, ±560 MB di `whisper.cpp/` yang di-.gitignore; minta izin sebelum pemasangan pertama):
   ```bash
   node scripts/transcribe.mjs <audio> <transcript.json> --model small --lang id
   ```
5. **Cocokkan & potong**:
   ```bash
   node scripts/match_voiceover.mjs scripts/voiceover/<video>.json <audio> <transcript.json>
   ```
   Smith-Waterman per kata menemukan tiap klip (kemunculan **terakhir** dipakai bila teks terbaca dua kali), memotong `public/vo/<video>/<id>.wav`, dan menulis `vo.generated.ts` (durasi + timestamp tiap kata naskah; kata yang tak cocok, mis. angka "7" vs "tujuh", diinterpolasi). Laporkan skor cocok per klip; skor rendah karena ejaan (mis. "day 1/8") tetap aman bila posisinya benar. **Jalur Voicebox:** bila semua klip mentah ada di `public/vo/<video>/raw/` dan `full.wav` = klip berurutan + jeda 1 dtk, script memakai **posisi klip yang pasti** dari file mentah (log: "posisi klip diambil pasti dari raw/") dan memetakan ulang timestamp whisper secara linear ke rentang suara sebenarnya — whisper.cpp terbukti melenceng 1–2 dtk lebih awal di bagian akhir audio ±90 dtk sehingga klip akhir tertukar/terpotong. Untuk audio pihak ketiga (tanpa `raw/`): batas potong **tidak** memakai timestamp akhir kata whisper (sering terlalu cepat → klip terpotong / kemasukan awal kata berikutnya), melainkan tengah jeda hening sungguhan (< −40 dB) di sekitarnya, plus fade 10 ms masuk / 30 ms keluar. Setelah memotong, ukur energi 60 ms di awal/akhir tiap klip (harus < −40 dB) dan pastikan bagian yang dibuang di antara klip hening. Script juga otomatis **me-master** suara (bagian narasi saja): de-esser split-band (deteksi 4.5–9 kHz, ambang −44 dBFS, rasio 3, maks −12 dB) + low-pass 9 kHz + kompresor 2:1 (RMS 10 ms, ambang −26 dBFS) + normalisasi ke **−17 LUFS mono** (= **−14 LUFS** di video stereo, karena BS.1770 menjumlahkan 2 kanal) + limiter look-ahead 5 ms dengan plafon **−2.0 dBFS** (≈ ≤ −1.5 dBTP). `--raw` untuk mematikan. Setelah memotong, salin juga `closing.wav` ke `public/sfx/closing-vo.wav` bila suara closing ikut diperbarui. Bila user mendengar kresek: tanya detik/kalimatnya, petakan ke kata lewat `meta.json`, lalu ukur — jangan menebak.
6. **Sinkron otomatis** (`src/brand/voiceover.ts`): durasi scene = `max(dasar, VO_LEAD 0.15 + durasi suara + VO_TAIL 0.45)`. Dengan klip Voicebox itu menghasilkan jeda hening ±0.9 dtk di **setiap** pergantian scene — terasa "ngelag", apalagi di scene pendek. Untuk video baru pakai durasi = `VO_LEAD + durasi suara + 0.2` (abaikan durasi dasar bila ada suara; lihat `src/KopiNgantuk/script.ts`) → jeda ±0.65 dtk, lalu pastikan tiap scene masih punya hold ≥1.2 dtk setelah baris terakhir; baris teks dengan `sync: "<kata>"` muncul saat kata itu diucapkan; audio per scene `<Sequence from={sec(start + VO_LEAD)} layout="none"><Audio src={staticFile(clip.file)} /></Sequence>`; closing VO +0.25 dtk. Ketukan animasi relatif ke awal scene sehingga ikut memanjang.
7. Cek dengan still (teks belum muncul sebelum kata diucapkan, muncul sesudahnya) + track `vo …` di timeline Studio. Kualitas suara tetap harus didengar user. Target total di atas 60 dtk; bila jauh melebihi ~80 dtk, tawarkan memangkas naskah atau mempercepat tempo di tool TTS, dan bila kurang dari 60 dtk, tambah poin/momen interaktif.

## Suara

- Pakai `import { Audio } from "@remotion/media"`, **bukan** `Audio`/`Html5Audio` dari `remotion` — yang lama tidak terdaftar di timeline Studio sehingga tidak terdengar.
- Bungkus dengan `<Sequence from={frame} layout="none">` tepat di frame saat visualnya terjadi (perhatikan kuantisasi bila animasi `stepped`).
- Efek suara pendek perlu durasi file ≥0.5 dtk (dipadding hening) agar sempat diputar di preview. `assets/scripts/make_sfx.py` membangkitkan `click.wav` tanpa dependency; salin ke `scripts/` lalu `python3 scripts/make_sfx.py`.
- Suara belum bisa diverifikasi tanpa didengar — sebutkan itu saat serah terima dan minta user mengecek di Studio.

## Watermark sumber

Kredit sumber ditampilkan sebagai **watermark kecil yang diam sepanjang konten** — bukan kartu full-screen (terlihat jelek dan memotong alur):

```tsx
<Sequence durationInFrames={sec(contentSeconds, fps)} name="watermark sumber" layout="none">
  <SourceWatermark name="alodokter.com" note="info umum" />
</Sequence>
```

- Posisi default `top: 262` (tepat di bawah penanda n/5), 26px, putih 45%, rata tengah. Teks konten mulai di `top: 320`.
- Hilang saat closing.
- **Di layar maksimal 2 sumber utama** (mis. `alodokter.com · halodoc.com`); daftar lengkap ditaruh di **deskripsi**. Buat `src/<NamaVideo>/caption.md` dengan dua versi: **TikTok/Reels** (tautan tak bisa diklik → 2–3 nama situs, ringkasan poin, disclaimer "info umum, bukan pengganti saran dokter", ajakan follow @day.one.eight, hashtag) dan **YouTube** (daftar tautan artikel yang benar-benar dipakai). Jangan mengarang judul artikel — pakai judul/slug dari halaman yang dibuka.
- Untuk topik kesehatan/keuangan/hukum, tandai klaim yang belum pasti di scene-nya.
- `SourceCard` (kartu terpisah) masih tersedia di `assets/` bila user memintanya.

## Watermark anti re-upload (wajib, standar sejak video 06)

Setiap video wajib punya **empat lapis** watermark **@day.one.eight** supaya sulit diunduh lalu di-upload ulang tanpa jejak, dan tetap terbaca di latar terang maupun gelap. Contoh lengkap: `src/HoaksViral/`.

1. **`HandleWatermark`**: ikon logo + handle (Helvetica 30px semibold) di atas **pill gelap transparan** (default `pill`, opacity 0.75). Label ini **melompat** ke titik aman berikutnya setiap pergantian scene, lalu diam (bukan melayang). Tampil sepanjang konten, tidak di closing.
   ```tsx
   <Sequence durationInFrames={sec(contentSeconds, fps)} layout="none">
     <SourceWatermark name="alodokter.com" />
     <HandleWatermark cuts={SCENES.map((s) => s.start)} spots={[
       { left: 90, top: 1180 }, { right: 160, top: 1500 }, { right: 160, top: 1180 }, { left: 90, top: 1500 },
     ]} />
   </Sequence>
   ```
   - Pakai **minimal 4 titik** yang menyebar kiri/kanan dan tengah/bawah. Default (`DEFAULT_WATERMARK_SPOTS`) juga berisi 4 titik.
   - Titik harus di luar area teks (`top` 320–±620), di luar panel interaktif (±620–1100), dan di luar UI TikTok (kanan 140, bawah 380).
   - Cek dengan still di **setiap scene** bahwa label tidak menabrak panel, balon teks, atau wajah.
2. **`HandleDecal` di scene 3D (minimal 3 stiker)**: stiker kuning @day.one.eight yang ikut perspektif kamera, sehingga tidak bisa di-crop tanpa memotong isi.
   - **Wajib**: **panel depan meja** (atau benda utama di bawah karakter), karena hampir selalu masuk frame:
     ```tsx
     <mesh position={[0, TABLE_TOP - 0.2, DESK_Z + 0.44]}><boxGeometry args={[2.2, 0.26, 0.04]} />…</mesh>
     <HandleDecal position={[0.45, TABLE_TOP - 0.2, DESK_Z + 0.465]} width={0.62} />
     ```
   - Plus minimal dua lagi di set: poster atau papan tulis di dinding (cukup besar, `width ≥ 0.7`, dan pastikan masuk frame), punggung laptop, sampul buku, dada robot, atau baju di jemuran.
   - Untuk video tanpa 3D, taruh handle di elemen utama (kartu, ilustrasi) sebagai pengganti.
3. **`BrandTag` di panel interaktif**: teks kecil "@day.one.eight" (24px, putih 70%) yang menempel di pojok kanan-bawah setiap panel grafik/data, di bawah emosi-meter atau kedut-meter, di bawah checklist, dan di bawah tombol komen. Komponen: `src/brand/BrandTag.tsx` (`BrandTag` + `BRAND_TAG_CORNER`; salinan di `assets/BrandTag.tsx`).
   - **Jangan** menempelkan handle pada konten negatif (kartu hoaks, contoh pesan penipuan, dsb.), supaya brand tidak terkesan ikut menyebarkannya.
4. **Kredit di letterbox**: saat kamera macro dengan letterbox, tampilkan `BrandTag` di tengah bar hitam bawah (ala kredit film), dengan opacity mengikuti tinggi bar.

## Karakter default: "si biru" (kartun di atas rig Mannequin)

Tokoh default semua video adalah karakter kartun kepala besar — kaos biru `#2f7cf6`, kerah putih, celana gelap, sepatu putih, rambut cokelat tua, pipi merah — yang ditempel ke **kerangka Mannequin** dari Quaternius Universal Animation Library (CC0). Mesh Mannequin disembunyikan; tiap bagian kartun di-`attach` ke tulangnya pada rest pose (`cartoonBody.ts`), jadi ikut semua animasi rig dan tetap punya **ekspresi wajah**.

```tsx
import { BoneOverride, Character3D } from "../brand/Character3D";

<Character3D
  look="cartoon"                      // default
  face={{ eyeOpen, yawn, smile, sleepy }}  // 0..1, atur per ketukan
  t={frame / fps}
  clips={[
    { clip: "Sitting_Idle_Loop", at: 0 },
    { clip: "Sitting_Talking_Loop", at: 31, fade: 0.3 },
  ]}
  bones={bones}
  scale={1.75}
/>
```

- **Wajah** (`face`, semua 0..1, ubah per ketukan dengan `keyed()`/`prog()`/`hold()` — wajah harus ikut cerita, jangan datar):
  - mata `eyeOpen` (kedip di daftar waktu tetap), alis `sleepy` (turun), `sad` (ujung dalam naik, khawatir), `surprise` (naik)
  - mulut `smile`, `frown` (cemberut), `open` (mulut "O": kaget/"waduh"/"ah—"), `yawn` (menguap), `pain` (meringis: gigi terlihat + mata dipicingkan)
  - warna `pale` (kulit & **bibir pucat** saat sakit), `blush` (merona malu/senang), `sweat` (tetes keringat)
  - `twitchL` (kelopak **kiri** menyempit + alis kiri turun = kedutan; mainkan per ketukan: sempit 0.03 dtk → buka 0.09 dtk, rentetan 3× berjarak 0.11 dtk = sama dengan sfx `twitch`), `bags` (kantung mata gelap, kurang tidur), `buck` (dua gigi depan besar ala kelinci — menggigit/nyengir lucu, contoh di `src/GigitKuku/`), `puff` (meniup "fuuuh": pipi menggembung + bibir monyong bulat, menggantikan mulut lain; contoh `src/NiupMakanan/` — sendok ditaruh ±0.17 di bawah & 0.3 di depan mulut supaya bibir monyong tetap terlihat saat macro), `angry` (marah/kesal: alis menukik ke dalam, wajah memerah, tanda urat 💢 merah di dahi kanan muncul >0.3; padukan dengan `frown` ±0.9, uap kepala sekali per ledakan, dan sfx `huff`; contoh `src/LaparMarah/`), `shock` (syok berat: bola mata membesar 1.3×, pupil mengecil, rahang jatuh lonjong, alis melonjak; padukan dengan `surprise` 1, `sweat` 0.8, `pale` ±0.35, sfx `sting`, kilat putih 0.22 dtk + garis konsentrasi manga di sekitar wajah. Pakai rambut yang tidak menutupi dahi/mata (mis. `spiky`) — `comma` menutupi mata kanan saat macro. Contoh `src/Inflasi/`), `pupil` (skala pupil, 1 = normal: >1 melebar di gelap, <1 mengecil kena cahaya terang; dikalikan efek `shock`, dibatasi 0.3–2.2; paling terlihat saat macro mata. Contoh `src/HpGelap/`: 1.25 saat lampu mati, 1.7 di "melebar", 0.55 saat layar menyala terang)
  - Resep: sakit = `pale .55 + sad .55 + frown .35`; kaget = `open .85 + surprise 1 + sweat .8`; malu = `smile .35 + blush 1 + sweat .6`; kesakitan = `pain 1 + sweat 1`; khawatir = `sad .9 + frown .7 + pale .7`; senang = `smile 1 + blush .6`.
  - Lihat semua di still `FaceSheet` (folder Brand) sebelum memilih nilai.
- **Kamera macro** (contoh `src/MataKedutan/`): kanvas 3D penuh 1080×1920 dengan `camera.setViewOffset(1080, 2520, 0, 0, 1080, 1920)` + fov 66.6 → pose kamera gaya lama (kanvas mulai `top: 600`) tetap berlaku. Zoom ke mata: dorong 0.3 dtk `EASE.inOut` ke ±0.24 di depan mata, tahan, tarik keluar 0.45–0.6 dtk; tambah letterbox + vignette + blur tepi (`backdrop-filter` bermasker radial) selama macro. Mata kartun berdiameter ±0.06 pada `scale 1.75`; ukur posisinya dari still (triangulasi dua sudut + ukuran di layar), dan beri geser per zoom bila pose kepala sedang berubah (tersentak/condong).
- **Warna** bisa diganti lewat `colors={{ shirt, pants, skin, hair, shoes, collar }}` (mis. variasi tokoh kedua), tapi default tetap si biru.
- **Gaya wajib berganti tiap video** (permintaan user): jangan kaos biru + rambut spiky terus. Pilih kombinasi rambut + outfit + warna `colors.shirt` (+ aksesori bila cocok tema) yang **berbeda dari 2–3 video terakhir** (cek `const WARDROBE` di `src/*/Scene3D.tsx`), sebutkan di rencana review, dan cek still close-up wajah: rambut `comma` bisa menutupi mata saat macro.
- **Wardrobe** (`wardrobe={{ hair, outfit, accessories }}`, semua dibangun dari kode di `wardrobe.ts` + `cartoonBody.ts`, boleh diganti per scene/tokoh). Lihat still `WardrobeSheet` (folder Brand) atau `assets/wardrobe-katalog.jpg` sebelum memilih:
  - `hair`: `bowl` (default), `comma` (comma hair), `spiky`, `curly`, `side`, `ponytail`, `bald`; warnanya ikut `colors.hair`.
  - `outfit`: `tee` (default), `hoodie` (tudung, tali, saku kanguru, rib), `shirt` (kemeja putih lengan panjang), `jacket`, `doctor` (jas dokter + scrub), `bowtie` (baju mustard + kerah putih + dasi kupu-kupu merah), `dino` (piyama dino hijau: perut krem, duri oranye di punggung, ekor; pasangkan `colors={{ pants: "#5cc56b", shoes: "#ff9f1a" }}` agar celana ikut hijau), `chef` (baju koki putih: dua baris kancing + saputangan leher merah, tanpa kerah; contoh `src/NiupMakanan/`). Warna bawaan di `OUTFIT_COLORS`; `colors.shirt` menimpanya.
  - `accessories`: `glasses_round`, `glasses_square`, `sunglasses`, `cap`, `mask`, `headphones`, `stethoscope` (pasangkan dengan `outfit: "doctor"`), `dino_hood` (tudung dino bermata + duri; pasangkan dengan `outfit: "dino"`), `chef_hat` (topi koki gembung; pasangkan dengan `outfit: "chef"`).
  - Contoh: `wardrobe={{ hair: "comma", outfit: "hoodie", accessories: ["glasses_round"] }}`. Item baru dibuat dengan bentuk dasar three.js (bukan model unduhan) supaya gayanya tetap sama; cek tiap item baru dengan still close-up karena kepala besar menutupi area leher/dada atas — detail dada taruh ≥0.07 di bawah `neck_01` dan sedikit di depan permukaan badan.
- **Klip** (43 tersedia di `UAL1_Standard.glb`): `Idle_Loop`, `Idle_Talking_Loop`, `Sitting_Enter`, `Sitting_Idle_Loop`, `Sitting_Talking_Loop`, `Sitting_Exit`, `Walk_Loop`, `Walk_Formal_Loop`, `Jog_Fwd_Loop`, `Sprint_Loop`, `Interact`, `PickUp_Table`, `Hit_Head`, `Dance_Loop`, `Jump_*`, `Crouch_*`, `Push_Loop`, `Roll`, `Driving_Loop`, `Fixing_Kneeling`, dll. Waktu klip dihitung dari detik video (deterministik). Ganti klip dengan segmen baru + `fade`.
- **Pose override** (`bones`, radian, ditambahkan di atas klip). Arah yang sudah diuji:
  - `spine_01/02/03`, `neck_01`, `Head` — **X+ = membungkuk/menunduk**, X− = mendongak.
  - `upperarm_r/l` — **X+ = tangan naik ke depan/wajah** (menyuap); `upperarm_l` **Z+ = lengan kiri terangkat ke samping**.
  - `lowerarm_l` — **X− = lengan bawah lurus**; Z kecil ± = ayunan melambai. Karena kepala besar, melambai pakai `upperarm_l Z≈1.75` + `lowerarm_l X≈−1.05` agar tangan tidak menabrak kepala.
- **Skala & set**: kerangka tingginya 1.83 m. Di set meja KenapaNgantuk dipakai `scale={1.75}`, dudukan kursi y≈0.84, permukaan meja y=1.2. Cek dengan still dari depan + samping.
- `Character3D` menahan render (`delayRender`) sampai model dimuat dan pose pertama digambar, lalu memanggil `advance()` — wajib karena `ThreeCanvas` hanya menggambar saat frame berganti.
- Alternatif (`look="model"`): Mannequin polos (`tint`), Superhero pria/wanita + rambut. Semua bisa dibandingkan di komposisi `CharacterLineup`.

## Closing: `BrandClosingPixel` (standar)

4 detik (`PIXEL_CLOSING_SECONDS`), rata tengah, gaya pixel art: semua gerak dikuantisasi 12 langkah/detik, font **Pixelify Sans** huruf kecil (via `@remotion/google-fonts`).

| Detik | Yang terjadi |
|---|---|
| 0.0–0.4 | Logo bulan (`public/logo.png`) terbentuk dari blok 4×4 → 8×8 → 16×16 → 32×32 |
| 0.45–1.0 | "day. one. eight" diketik 2 huruf per langkah + kursor blok |
| 0.6–0.9 | Tiga kilau pixel berkedip di posisi bintang logo |
| 1.0–1.5 | Garis 13 blok muncul dari tengah, label "jangan lupa follow" |
| 1.35 | Pill kuning **@day.one.eight** pop |
| 1.7 | Tombol putih "+ follow" pop |
| 2.0–2.8 | Kursor tangan pixel melompat masuk, tap (frame 140 → `click.wav`), tombol jadi "✓ following" kuning, 8 kotak memancar, tangan keluar |
| 2.8–4.0 | Semua diam |

```tsx
import { BrandClosingPixel, PIXEL_CLOSING_SECONDS } from "../brand/BrandClosingPixel";
<Sequence from={sec(contentSeconds, fps)} durationInFrames={sec(PIXEL_CLOSING_SECONDS, fps)} name="closing">
  <BrandClosingPixel />
</Sequence>
```

- **Suara bawaan**: ajakan "follow day one eight untuk info lainnya" (`public/sfx/closing-vo.wav`, mulai 0.25 dtk) + klik di tap. Jadi closing sudah bersuara di mana pun dipakai — **jangan** tambahkan narasi closing lagi di video.
- Prop: `ctaLabel` (default "jangan lupa follow"), `sound={false}` tanpa klik, `voice={false}` tanpa suara ajakan (atau `voice="path/di/public.wav"` untuk suara lain), `logoSrc` untuk logo lain. Handle selalu `@day.one.eight`.
- Durasi komposisi = konten + closing.
- `BrandClosing` (versi halus, Helvetica, 4 dtk) tetap tersedia sebagai alternatif bila user memintanya.

## Aset channel YouTube (still)

Komponen di `src/brand/ChannelArt.tsx`, folder Studio **YouTube**. Export dengan `npx remotion still <Id> out/youtube/<nama>.png --image-format=png`.

| Id | Ukuran | Aturan |
|---|---|---|
| `ChannelBanner` | 2560×1440 (maks 6 MB) | Teks, logo, dan wajah si biru wajib di area aman tengah **1546×423**; dekorasi pixel boleh di luar (hanya tampil di TV/desktop). Prop `showGuides` menampilkan garis area aman untuk dicek. Tubuh karakter dipudarkan di bawah (mask) agar tidak terpotong garis keras. |
| `ProfilePicture` | 800×800 | Wajah si biru tersenyum di tengah — aman untuk crop lingkaran. |
| `ChannelWatermark` | 150×150 PNG transparan | Logo bulan, untuk YouTube Studio → Branding. |

Tagline default: `CHANNEL_TAGLINE` = "jangan lupa subscribe, update setiap hari". Kepala si biru (kerangka skala 1) ada di y≈1.6 — pakai itu untuk membidik kamera close-up.

## 3D (opsional)

Karakter/objek 3D via `@remotion/three` + react-three-fiber; set `Config.setChromiumOpenGlRenderer("angle")` di `remotion.config.ts`. Canvas 3D ditaruh di bawah area teks (mis. `top: 600`) dan disembunyikan saat closing. Atur framing dengan still dulu: kepala tidak terpotong, props tidak menabrak teks, meja/kaki boleh masuk area bawah.

## Aset di skill ini

| Aset | Salin ke | Isi |
|---|---|---|
| `assets/motion.ts` | `src/lib/motion.ts` | `EASE`, `sec`, `prog`, `envelope`, `punch`, `stepped`, `holdTo` |
| `assets/WordText.tsx` | `src/brand/WordText.tsx` | Caption per kata + highlight `*kunci*`, tipe `Line` |
| `assets/SourceWatermark.tsx` | `src/brand/SourceWatermark.tsx` | Watermark sumber (standar) |
| `assets/PointCounter.tsx` | `src/brand/PointCounter.tsx` | Penanda "n/5" generik |
| `assets/HandleWatermark.tsx` | `src/brand/HandleWatermark.tsx` | Watermark handle yang pindah tiap scene |
| `assets/HandleDecal.tsx` | `src/brand/HandleDecal.tsx` | Stiker handle di scene 3D |
| `assets/Character3D.tsx` | `src/brand/Character3D.tsx` | Karakter ber-rig + klip + pose override + wajah |
| `assets/cartoonBody.ts` | `src/brand/cartoonBody.ts` | Tubuh kartun "si biru" + ekspresi wajah lengkap |
| `assets/FaceSheet.tsx` | `src/brand/FaceSheet.tsx` | Still referensi 8 ekspresi |
| `assets/wardrobe.ts` | `src/brand/wardrobe.ts` | Rambut, aksesori kepala, warna outfit (tipe `Wardrobe`) |
| `assets/WardrobeSheet.tsx` | `src/brand/WardrobeSheet.tsx` | Still katalog wardrobe 2400×1800 (daftarkan di Root, folder Brand) |
| `assets/wardrobe-katalog.jpg` | — | Gambar referensi katalog wardrobe |
| `assets/scripts/make_sfx_comedy.py` | `scripts/make_sfx_comedy.py` | Generator efek suara komedi (`python3 scripts/make_sfx_comedy.py growl huff` → hanya file itu) |
| `assets/ChannelArt.tsx` | `src/brand/ChannelArt.tsx` | Banner, foto profil, watermark channel YouTube |
| `assets/models/UAL1_Standard.glb` | `public/models/ual/UAL1_Standard.glb` | Mannequin + 43 animasi (CC0, Quaternius), sertakan `LICENSE.txt` |
| `assets/SourceCard.tsx` | `src/brand/SourceCard.tsx` | Kartu sumber terpisah (alternatif) |
| `assets/BrandClosingPixel.tsx` | `src/brand/BrandClosingPixel.tsx` | Closing standar |
| `assets/BrandClosing.tsx` | `src/brand/BrandClosing.tsx` | Closing halus + konstanta brand (dibutuhkan closing pixel) |
| `assets/RevealText.tsx` | `src/brand/RevealText.tsx` | Teks reveal bermasker (gaya lama, opsional) |
| `assets/logo.png` | `public/logo.png` | Logo bulan, PNG transparan 512×512 |
| `assets/sfx/click.wav` | `public/sfx/click.wav` | Klik 8-bit 0.5 dtk |
| `assets/sfx/closing-vo.wav` | `public/sfx/closing-vo.wav` | Suara ajakan closing "follow day one eight…" |
| `assets/scripts/make_sfx.py` | `scripts/make_sfx.py` | Generator `click.wav` |
| `assets/scripts/voicebox_voiceover.mjs` | `scripts/voicebox_voiceover.mjs` | Generate narasi per klip via Voicebox lokal → `full.wav` |
| `assets/scripts/transcribe.mjs` | `scripts/transcribe.mjs` | Transkripsi lokal whisper.cpp (timestamp kata) |
| `assets/scripts/match_voiceover.mjs` | `scripts/match_voiceover.mjs` | Cocokkan audio ke naskah, potong per scene, tulis `vo.generated.ts` |
| `assets/scripts/make_voiceover.mjs` | `scripts/make_voiceover.mjs` | (Opsional) generator ElevenLabs API |
| `assets/voiceover.ts` | `src/brand/voiceover.ts` | Tipe & helper sinkron voiceover |
| `assets/env.example` | `.env.example` | Contoh variabel ElevenLabs |

## Konten dari artikel

Ringkas dengan kata-kata sendiri menjadi kalimat pendek huruf kecil yang enak dibaca di layar — jangan menyalin paragraf. Pertahankan nuansa penting dari sumber (mis. "teori ini masih diteliti", "konsultasi ke dokter bila berat") supaya info tetap jujur.
