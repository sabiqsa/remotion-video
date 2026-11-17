---
name: remotion-video
description: Standar produksi video/motion graphic Remotion untuk akun @day.one.eight — format vertikal 1080x1920 60fps untuk TikTok/Reels/Shorts, caption gaya viral (huruf kecil, muncul per kata, highlight kuning), karakter 3D default "si biru" kartun kepala besar di atas rig Mannequin (animasi CC0), struktur hook → poin, sumber sebagai watermark kecil, watermark anti re-upload @day.one.eight, voiceover dari TTS pihak ketiga yang dicocokkan per kata (whisper lokal), closing pixel art dengan logo + CTA "@day.one.eight" + suara klik, dan gaya gerak anti-generik (tanpa floating/bobbing ala screensaver). Gunakan skill ini SETIAP kali membuat video, motion graphic, explainer, konten short/TikTok/Reels baru, atau komposisi Remotion baru di proyek ini — termasuk saat user hanya memberi judul + naskah/artikel dan bilang "buatin video", "bikin motion graphic", "jadikan konten tiktok", atau minta revisi besar pada video yang ada.
---

# remotion-video

Panduan membuat video Remotion yang konsisten dengan brand @day.one.eight dan tidak terlihat generik. Hasil akhirnya adalah **source yang siap dirender** — user yang menjalankan render-nya sendiri. Contoh acuan lengkap di proyek ini: `src/KenapaNgantuk/`.

## Alur kerja

1. **Review dulu, kerjakan kemudian.** Sebelum menulis kode, baca permintaan, konten sumber, dan kode yang sudah ada. Lalu sampaikan rencana singkat ke user dan tunggu persetujuannya:
   - naskah per scene (teks layar huruf kecil, diringkas dengan kata-kata sendiri, kata kunci ditandai),
   - durasi tiap scene dalam detik + total,
   - ide visual/gerak tiap scene (apa yang terjadi pada ketukan mana),
   - aset yang dibutuhkan dan fallback-nya.
   Pertanyaan yang benar-benar terbuka ditanyakan di tahap ini, bukan di tengah coding. Kalau user minta ide/riset referensi, boleh riset singkat dan sebutkan sumbernya.
2. **Siapkan fondasi** (sekali per proyek). Pastikan file ini ada; kalau belum, salin dari `assets/` skill ini:
   - `src/lib/motion.ts`, `src/brand/WordText.tsx`, `src/brand/SourceWatermark.tsx`, `src/brand/HandleWatermark.tsx`, `src/brand/HandleDecal.tsx`, `src/brand/Character3D.tsx` + `src/brand/cartoonBody.ts`, `src/brand/BrandClosingPixel.tsx` (+ `BrandClosing.tsx`, karena konstanta brand diimpor dari sana)
   - `public/logo.png`, `public/sfx/click.wav`, `public/models/ual/UAL1_Standard.glb`
   - dependency: `npx remotion add @remotion/google-fonts @remotion/media` (dan `@remotion/three` bila pakai 3D)
3. **Bangun komposisi** di `src/<NamaVideo>/` dengan `script.ts` (naskah + timeline dalam detik) terpisah dari komponen visual, supaya teks mudah direvisi.
4. **Sumber sebagai watermark** sepanjang konten, lalu **akhiri dengan `BrandClosingPixel`**. Siapkan juga teks caption untuk upload (lihat Watermark sumber).
5. **Verifikasi tanpa merender video**: `npx tsc --noEmit`, `npx eslint src/<NamaVideo>`, grep anti-floating (di bawah), lalu cek visual lewat Remotion Studio atau still (`npx remotion still <Id> out.jpg --frame=N --scale=0.3`) di setiap scene + closing. Periksa terutama: teks tidak meluber/terpotong, blok highlight tidak terbelah dua baris, elemen tidak menabrak teks. Jangan jalankan `npx remotion render`.
6. **Serah terima**: sebutkan file yang dibuat, ID komposisi, durasi, apa yang belum dicek (mis. suara belum didengar), dan perintah render siap salin:
   ```bash
   npx remotion render <Id> out/<nama>.mp4 --codec=h264 --crf=18
   ```

## Spesifikasi format

| Item | Nilai |
|---|---|
| Ukuran | 1080 × 1920 (9:16) |
| FPS | **60** |
| Codec saran | H.264, CRF 18 |
| Safe zone | atas 150px, bawah 380px, kanan 140px, kiri 80px (UI TikTok/Reels menutupi area ini) |
| Durasi | 30–45 detik ideal, termasuk closing 4 detik |

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

Elemen pendukung yang terbukti bekerja (lihat `src/KenapaNgantuk/Overlay.tsx`):
- **Penanda poin**: pill gelap di `top ≈ 170` berisi "n/5" (angka bergeser naik saat berganti) + 5 blok progres.
- **Ticker daftar**: nama item putih + tag kuning + titik progres.

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

Narasi dibuat user di **tool TTS pihak ketiga** dengan voice miliknya; Claude menyiapkan transkrip lalu mencocokkan hasil suaranya ke video. (Jalur ElevenLabs API via `make_voiceover.mjs` tetap tersedia bila user punya API key.)

1. **Naskah narasi** di `scripts/voiceover/<video>.json` (`out`, `module`, `clips` per scene + `closing`: "follow day one eight untuk info lainnya."). Kalimat lebih mengalir dari teks layar, angka ditulis dengan huruf, handle dieja "day one eight". Masukkan ke rencana review.
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
   Smith-Waterman per kata menemukan tiap klip (kemunculan **terakhir** dipakai bila teks terbaca dua kali), memotong `public/vo/<video>/<id>.wav`, dan menulis `vo.generated.ts` (durasi + timestamp tiap kata naskah; kata yang tak cocok, mis. angka "7" vs "tujuh", diinterpolasi). Laporkan skor cocok per klip; skor rendah karena ejaan (mis. "day 1/8") tetap aman bila posisinya benar. Batas potong **tidak** memakai timestamp akhir kata whisper (sering terlalu cepat → klip terpotong / kemasukan awal kata berikutnya), melainkan tengah jeda hening sungguhan (< −40 dB) di sekitarnya, plus fade 10 ms masuk / 30 ms keluar. Setelah memotong, ukur energi 60 ms di awal/akhir tiap klip (harus < −40 dB) dan pastikan bagian yang dibuang di antara klip hening.
6. **Sinkron otomatis** (`src/brand/voiceover.ts`): durasi scene = `max(dasar, VO_LEAD 0.15 + durasi suara + VO_TAIL 0.45)`; baris teks dengan `sync: "<kata>"` muncul saat kata itu diucapkan; audio per scene `<Sequence from={sec(start + VO_LEAD)} layout="none"><Audio src={staticFile(clip.file)} /></Sequence>`; closing VO +0.25 dtk. Ketukan animasi relatif ke awal scene sehingga ikut memanjang.
7. Cek dengan still (teks belum muncul sebelum kata diucapkan, muncul sesudahnya) + track `vo …` di timeline Studio. Kualitas suara tetap harus didengar user. Bila total durasi melebihi ~45 dtk, tawarkan memangkas naskah atau mempercepat tempo di tool TTS.

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
- Sumber lengkap + disclaimer ("info umum, bukan pengganti saran dokter") ditulis di **caption upload**: buat `src/<NamaVideo>/caption.md` berisi hook, ringkasan poin, sumber, ajakan follow @day.one.eight, dan hashtag. Jangan mengarang judul artikel sumber yang tidak diketahui.
- Untuk topik kesehatan/keuangan/hukum, tandai klaim yang belum pasti di scene-nya.
- `SourceCard` (kartu terpisah) masih tersedia di `assets/` bila user memintanya.

## Watermark anti re-upload (wajib)

Setiap video diberi dua lapis watermark **@day.one.eight** supaya sulit diunduh lalu di-upload ulang tanpa jejak:

1. **`HandleWatermark`** — ikon logo + handle (Helvetica 30px semibold, putih 40%) yang **melompat** ke titik aman berikutnya setiap pergantian scene, lalu diam (bukan melayang). Tampil sepanjang konten, tidak di closing.
   ```tsx
   <Sequence durationInFrames={sec(contentSeconds, fps)} layout="none">
     <SourceWatermark name="alodokter.com" />
     <HandleWatermark cuts={SCENES.map((s) => s.start)} />
   </Sequence>
   ```
   Titik default (`DEFAULT_WATERMARK_SPOTS`): kiri-tengah `top 870`, kanan `top 1250`, kiri-bawah `top 1460` — di luar area teks, penanda n/5, dan UI TikTok. Sesuaikan bila layout video berbeda; cek dengan still bahwa watermark tidak menutupi teks.
2. **`HandleDecal`** — stiker kuning @day.one.eight **di dalam scene 3D** (mis. panel depan meja), ikut perspektif kamera sehingga tidak bisa di-crop tanpa memotong isi:
   ```tsx
   <HandleDecal position={[0, tableTop - 0.24, 1.43]} width={1.0} />
   ```
   Untuk video tanpa 3D, taruh handle di elemen utama (kartu, ilustrasi) sebagai pengganti.

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

- **Wajah** (`face`): `eyeOpen` (kedip pada daftar waktu tetap, mata sayu saat ngantuk), `yawn` (mulut menguap, menggantikan senyum), `smile`, `sleepy` (alis turun). Ubah nilainya dengan `keyed()`/`prog()` pada ketukan.
- **Warna** bisa diganti lewat `colors={{ shirt, pants, skin, hair, shoes, collar }}` (mis. variasi tokoh kedua), tapi default tetap si biru.
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

- Prop: `ctaLabel` (default "jangan lupa follow"), `sound={false}` untuk tanpa klik, `logoSrc` untuk logo lain. Handle selalu `@day.one.eight`.
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
| `assets/HandleWatermark.tsx` | `src/brand/HandleWatermark.tsx` | Watermark handle yang pindah tiap scene |
| `assets/HandleDecal.tsx` | `src/brand/HandleDecal.tsx` | Stiker handle di scene 3D |
| `assets/Character3D.tsx` | `src/brand/Character3D.tsx` | Karakter ber-rig + klip + pose override + wajah |
| `assets/cartoonBody.ts` | `src/brand/cartoonBody.ts` | Tubuh kartun "si biru" yang ditempel ke rig |
| `assets/ChannelArt.tsx` | `src/brand/ChannelArt.tsx` | Banner, foto profil, watermark channel YouTube |
| `assets/models/UAL1_Standard.glb` | `public/models/ual/UAL1_Standard.glb` | Mannequin + 43 animasi (CC0, Quaternius), sertakan `LICENSE.txt` |
| `assets/SourceCard.tsx` | `src/brand/SourceCard.tsx` | Kartu sumber terpisah (alternatif) |
| `assets/BrandClosingPixel.tsx` | `src/brand/BrandClosingPixel.tsx` | Closing standar |
| `assets/BrandClosing.tsx` | `src/brand/BrandClosing.tsx` | Closing halus + konstanta brand (dibutuhkan closing pixel) |
| `assets/RevealText.tsx` | `src/brand/RevealText.tsx` | Teks reveal bermasker (gaya lama, opsional) |
| `assets/logo.png` | `public/logo.png` | Logo bulan, PNG transparan 512×512 |
| `assets/sfx/click.wav` | `public/sfx/click.wav` | Klik 8-bit 0.5 dtk |
| `assets/scripts/make_sfx.py` | `scripts/make_sfx.py` | Generator `click.wav` |
| `assets/scripts/transcribe.mjs` | `scripts/transcribe.mjs` | Transkripsi lokal whisper.cpp (timestamp kata) |
| `assets/scripts/match_voiceover.mjs` | `scripts/match_voiceover.mjs` | Cocokkan audio ke naskah, potong per scene, tulis `vo.generated.ts` |
| `assets/scripts/make_voiceover.mjs` | `scripts/make_voiceover.mjs` | (Opsional) generator ElevenLabs API |
| `assets/voiceover.ts` | `src/brand/voiceover.ts` | Tipe & helper sinkron voiceover |
| `assets/env.example` | `.env.example` | Contoh variabel ElevenLabs |

## Konten dari artikel

Ringkas dengan kata-kata sendiri menjadi kalimat pendek huruf kecil yang enak dibaca di layar — jangan menyalin paragraf. Pertahankan nuansa penting dari sumber (mis. "teori ini masih diteliti", "konsultasi ke dokter bila berat") supaya info tetap jujur.
