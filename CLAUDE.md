# Aturan proyek Remotion-Video

Proyek Remotion untuk konten video vertikal akun @day.one.eight.

## Aturan kerja

1. **Review dulu, kerjakan kemudian.** Sebelum mengubah atau membuat file, review permintaan, konten sumber, dan kode terkait. Sampaikan rencana singkat (naskah per scene, durasi, ide visual/gerak, aset yang dibutuhkan) dan tunggu persetujuan user sebelum mulai mengerjakan.
2. **Hasil kerja = file siap render, jangan render sendiri.** Jangan menjalankan `npx remotion render` atau render video lainnya. Verifikasi cukup lewat `npx tsc --noEmit`, lint, Remotion Studio, atau still ringan (`npx remotion still ... --scale=0.3`). Di akhir, berikan perintah render siap salin untuk user.
3. **Setiap video baru wajib memakai skill `remotion-video`** (`.claude/skills/remotion-video/`). Skill ini mengatur format 1080x1920 60fps, gaya teks, gerak anti-generik, dan closing logo + CTA "@day.one.eight".

## Struktur

- `src/<NamaVideo>/` — satu folder per video; naskah + timeline di `script.ts`, caption upload di `caption.md`.
- `src/lib/motion.ts` — helper gerak (easing, `sec`, `prog`, `envelope`, `punch`, `holdTo`).
- `src/brand/` — komponen brand bersama (`BrandClosingPixel`, `WordText`, `SourceWatermark`, `HandleWatermark`, `HandleDecal`, `Character3D`).
- `public/models/` — model 3D CC0 (Quaternius); karakter default = "si biru" kartun di atas rig Mannequin.
- `src/Root.tsx` — daftar komposisi.

## Skill tambahan (`.claude/skills/`)

Aturan kerja di atas dan skill `remotion-video` selalu menang bila bertentangan dengan skill lain.

- `remotion-best-practices` (resmi Remotion, v4.0.545): referensi API/markup/caption/render. Abaikan anjurannya membuka Studio sendiri (user menjalankan Studio di port 3001) dan tetap jangan render tanpa diminta.
- `gsap-core` / `gsap-timeline` / `gsap-utils`: hanya sebagai referensi easing & susunan timeline. GSAP tidak dipasang di proyek; animasi Remotion wajib digerakkan `useCurrentFrame()`. Bila suatu saat memakai GSAP, timeline harus `paused: true` lalu `tl.seek(frame / fps)` tiap frame, tanpa tween berbasis waktu nyata.
- `auto-editor*`: memotong hening/diam dari rekaman (butuh CLI `auto-editor`).
- `yt-*`: paket YouTube (judul, SEO, komentar, riset viral). Profil suara di `.claude/youtube/voice.md`.
