// Naskah & timeline "kenapa harga barang naik terus?" (inflasi) — si biru belanja di minimarket,
// syok lihat label harga mie naik. Diringkas dengan kata-kata sendiri dari penjelasan umum inflasi
// Bank Indonesia (bi.go.id: inflasi tarikan permintaan, dorongan biaya, ekspektasi/uang beredar) & BPS.
// Harga nyata (Nov 2026): mie instan di minimarket ±Rp3.500 → Rp4.000/bungkus; Pertalite Rp7.650 → Rp10.000/liter
// (naik 3 Sep 2022). Angka "3%/tahun → ±34% dalam 10 tahun" = hitungan bunga majemuk (1,03^10 ≈ 1,34), bukan data.
// Waktu dalam DETIK. Tandai kata kunci dengan *bintang*; `sync` = kata narasi pemicu.

import { PIXEL_CLOSING_SECONDS } from "../brand/BrandClosingPixel";
import { VO_LEAD, wordTime } from "../brand/voiceover";
import type { Line } from "../brand/WordText";
import { VO } from "./vo.generated";

export const FPS = 60;

export type SceneId = "hook" | "ehem" | "p1" | "p2" | "p3" | "twist" | "tips" | "komen";

export type Scene = {
  id: SceneId;
  start: number;
  duration: number;
  lines: Line[];
  /** nomor pemicu 1..3 untuk penanda "n/3" */
  point?: number;
};

const scenes: Omit<Scene, "start">[] = [
  {
    id: "hook",
    duration: 4.4,
    lines: [
      { text: "harga barang", at: 0.15, sync: "harga", style: "body" },
      { text: "*naik terus?*", at: 1.0, sync: "naik", style: "title" },
      { text: "padahal gaji segitu-segitu aja 🥲", at: 2.6, sync: "padahal", style: "note" },
    ],
  },
  {
    id: "ehem",
    duration: 3.2,
    lines: [
      { text: "namanya *inflasi*", at: 0.15, sync: "namanya", style: "title" },
      { text: "penyebabnya ada 3", at: 1.6, sync: "penyebabnya", style: "body" },
    ],
  },
  {
    id: "p1",
    point: 1,
    duration: 7.5,
    lines: [
      { text: "*rebutan* barang", at: 0.15, sync: "pertama", style: "title" },
      { text: "pembeli banyak, barang terbatas", at: 1.6, sync: "banyak", style: "body" },
    ],
  },
  {
    id: "p2",
    point: 2,
    duration: 6.5,
    lines: [
      { text: "*ongkos* naik", at: 0.15, sync: "kedua", style: "title" },
      { text: "bensin, bahan baku, upah", at: 1.6, sync: "bensin", style: "body" },
    ],
  },
  {
    id: "p3",
    point: 3,
    duration: 6.5,
    lines: [
      { text: "*uang* bertambah", at: 0.15, sync: "ketiga", style: "title" },
      { text: "barangnya tetap, nilainya turun", at: 3.6, sync: "uangnya", style: "body" },
    ],
  },
  {
    id: "twist",
    duration: 7.0,
    lines: [
      { text: "yang turun", at: 0.15, sync: "jadi", style: "body" },
      { text: "nilai *uangmu*", at: 1.2, sync: "nilai", style: "title" },
    ],
  },
  {
    id: "tips",
    duration: 6.0,
    lines: [{ text: "cara *ngakalin*", at: 0.15, sync: "belanja", style: "title" }],
  },
  {
    id: "komen",
    duration: 3.8,
    lines: [
      { text: "dulu jajan *berapa?*", at: 0.15, sync: "dulu", style: "title" },
      { text: "tulis di komen 👇", at: 2.6, sync: "tulis", style: "note" },
    ],
  },
];

/** Waktu (relatif awal scene) saat kata diucapkan, atau fallback bila belum ada suara. */
export const syncAt = (id: string, word: string | undefined, fallback: number, after = 0) => {
  if (!word) return fallback;
  const w = wordTime(VO[id], word, after);
  return w === null ? fallback : Math.max(0, VO_LEAD + w - 0.06);
};

/** jeda setelah suara selesai sebelum scene berganti (jeda antar scene ±0.6 dtk; dipersingkat agar total ≤ 50 dtk) */
const TAIL = 0.15;

export const SCENES: Scene[] = (() => {
  let start = 0;
  return scenes.map((s) => {
    const clip = VO[s.id];
    const duration = clip ? VO_LEAD + clip.duration + TAIL : s.duration;
    const lines = s.lines.map((l) => ({ ...l, at: syncAt(s.id, l.sync, l.at) }));
    const out = { ...s, duration, lines, start };
    start += duration;
    return out;
  });
})();

export const SOURCE = { name: "Bank Indonesia · BPS", note: "info umum, bukan saran keuangan" };

export const sceneById = (id: SceneId): Scene => SCENES.find((s) => s.id === id)!;

/** detik absolut sebuah kata di narasi scene (atau fallback relatif scene). */
export const beat = (id: SceneId, word: string | undefined, fallback: number, after = 0) =>
  sceneById(id).start + syncAt(id, word, fallback, after);

export const END = (id: SceneId) => sceneById(id).start + sceneById(id).duration;

export const CONTENT_SECONDS = SCENES.reduce((a, s) => a + s.duration, 0);
export const CLOSING_SECONDS = PIXEL_CLOSING_SECONDS;
export const TOTAL_SECONDS = CONTENT_SECONDS + CLOSING_SECONDS;

/** Detik frame hook untuk cover (judul penuh + dolly zoom wajah syok + label Rp4.000):
 *  npx remotion still Inflasi out/10-inflasi/cover.png --frame=126 --image-format=png */
export const COVER_AT = 2.1;
