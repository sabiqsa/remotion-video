// Naskah & timeline "kenapa hujan sering turun sore?" — si biru santai di halaman, si awan
// = "pegawai yang baru masuk kerja jam 3". Diringkas dengan kata-kata sendiri dari ANTARA
// (kajian 7 tahun, 31 stasiun) & penjelasan BMKG (CNN Indonesia, CNBC Indonesia).
// Waktu dalam DETIK. Tandai kata kunci dengan *bintang*; `sync` = kata narasi pemicu.

import { PIXEL_CLOSING_SECONDS } from "../brand/BrandClosingPixel";
import { VO_LEAD, wordTime } from "../brand/voiceover";
import type { Line } from "../brand/WordText";
import { VO } from "./vo.generated";

export const FPS = 60;

export type SceneId = "hook" | "kerja" | "promise" | "p1" | "p2" | "p3" | "data" | "tapi" | "tips" | "serius" | "komen";

export type Scene = {
  id: SceneId;
  start: number;
  duration: number;
  lines: Line[];
  /** nomor langkah 1..3 untuk penanda "n/3" */
  point?: number;
};

const scenes: Omit<Scene, "start">[] = [
  {
    id: "hook",
    duration: 4.4,
    lines: [
      { text: "kenapa hujan sering turun *sore?*", at: 0.15, sync: "kenapa", style: "title" },
      { text: "padahal siangnya panas banget ☀️", at: 2.1, sync: "padahal", style: "note" },
    ],
  },
  {
    id: "kerja",
    duration: 3.1,
    lines: [{ text: "awan juga punya *jam kerja*", at: 0.15, sync: "awan", style: "title" }],
  },
  {
    id: "promise",
    duration: 2.6,
    lines: [
      { text: "prosesnya cuma *3 langkah*", at: 0.15, sync: "ini", style: "title" },
    ],
  },
  {
    id: "p1",
    point: 1,
    duration: 3.1,
    lines: [
      { text: "*matahari* manasin tanah", at: 0.15, sync: "pertama", style: "title" },
      { text: "sejak pagi", at: 1.0, sync: "dari", style: "note" },
    ],
  },
  {
    id: "p2",
    point: 2,
    duration: 5.7,
    lines: [
      { text: "udara naik → *ngembun*", at: 0.15, sync: "kedua", style: "title" },
      { text: "makin tinggi, makin dingin", at: 2.6, sync: "makin", style: "body" },
    ],
  },
  {
    id: "p3",
    point: 3,
    duration: 6.3,
    lines: [
      { text: "awan *numpuk* berjam-jam", at: 0.15, sync: "ketiga", style: "title" },
      { text: "kayak cucian seminggu 👕", at: 2.4, sync: "kayak", style: "note" },
      { text: "sore: kepenuhan → tumpah!", at: 4.0, sync: "sore", style: "body" },
    ],
  },
  {
    id: "data",
    duration: 6.2,
    lines: [
      { text: "puncaknya *sore*", at: 0.15, sync: "data", style: "title" },
      { text: "data 7 tahun · 31 stasiun", at: 0.5, sync: "tujuh", style: "note" },
    ],
  },
  {
    id: "tapi",
    duration: 4.1,
    lines: [{ text: "tiap daerah *beda*", at: 0.15, sync: "tapi", style: "title" }],
  },
  {
    id: "tips",
    duration: 3.6,
    lines: [
      { text: "siang terik?", at: 0.15, sync: "jadi", style: "note" },
      { text: "siapin *payung*", at: 1.6, sync: "siapin", style: "title" },
    ],
  },
  {
    id: "serius",
    duration: 4.3,
    lines: [
      { text: "waspada *petir*", at: 0.15, sync: "hujan", style: "title" },
      { text: "& angin kencang", at: 2.0, sync: "angin", style: "body" },
    ],
  },
  {
    id: "komen",
    duration: 3.6,
    lines: [
      { text: "jam berapa *di tempatmu?*", at: 0.15, sync: "di", style: "title" },
      { text: "tulis di komen 👇", at: 2.0, sync: "tulis", style: "note" },
    ],
  },
];

/** Waktu (relatif awal scene) saat kata diucapkan, atau fallback bila belum ada suara. */
export const syncAt = (id: string, word: string | undefined, fallback: number, after = 0) => {
  if (!word) return fallback;
  const w = wordTime(VO[id], word, after);
  return w === null ? fallback : Math.max(0, VO_LEAD + w - 0.06);
};

/** jeda setelah suara selesai sebelum scene berganti (jeda antar scene ±0.65 dtk) */
const TAIL = 0.2;

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

export const SOURCE = { name: "antaranews.com · cnnindonesia.com" };

export const sceneById = (id: SceneId): Scene => SCENES.find((s) => s.id === id)!;

/** detik absolut sebuah kata di narasi scene (atau fallback relatif scene). */
export const beat = (id: SceneId, word: string | undefined, fallback: number, after = 0) =>
  sceneById(id).start + syncAt(id, word, fallback, after);

export const END = (id: SceneId) => sceneById(id).start + sceneById(id).duration;

export const CONTENT_SECONDS = SCENES.reduce((a, s) => a + s.duration, 0);
export const CLOSING_SECONDS = PIXEL_CLOSING_SECONDS;
export const TOTAL_SECONDS = CONTENT_SECONDS + CLOSING_SECONDS;

/** Detik frame hook yang dipakai sebagai cover (judul tampil penuh + hujan mengguyur si biru):
 *  npx remotion still HujanSore out/04-hujan-sore/cover.png --frame=252 --image-format=png */
export const COVER_AT = 4.2;
