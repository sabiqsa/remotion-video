// Naskah & timeline "kenapa upil asin?" — si biru duduk di sofa ruang tamu siang hari, ketahuan ngupil.
// Diringkas dengan kata-kata sendiri dari:
// - Kumparan Sains: upil berasal dari ingus; ingus ±95% air, ±3% musin, sisanya protein lain & garam.
// - Alodokter: upil = ingus/lendir yang mengering; normal karena hidung terus memproduksi lendir; ke dokter
//   bila hidung sering berdarah, upil hijau/kuning/hitam disertai demam, sakit kepala, nyeri/bengkak.
// - Tinjauan komposisi lendir (PMC7196697): natrium & klorida termasuk ion utama lendir saluran napas.
// - Cole dkk. (PMC116505): lisozim & laktoferin (protein antikuman) selalu ada di sekret hidung.
// Waktu dalam DETIK. Tandai kata kunci dengan *bintang*; `sync` = kata narasi pemicu.

import { PIXEL_CLOSING_SECONDS } from "../brand/BrandClosingPixel";
import { VO_LEAD, wordTime } from "../brand/voiceover";
import type { Line } from "../brand/WordText";
import { VO } from "./vo.generated";

export const FPS = 60;

export type SceneId = "hook" | "janji" | "p1" | "p2" | "p3" | "twist" | "tips" | "dokter" | "komen";

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
    duration: 4.0,
    lines: [
      { text: "upil kok *asin?*", at: 0.15, sync: "kenapa", style: "title" },
      { text: "jangan pura-pura nggak tahu 👀", at: 1.9, sync: "jangan", style: "note" },
    ],
  },
  {
    id: "janji",
    duration: 3.8,
    lines: [
      { text: "upil = *ingus kering*", at: 0.15, sync: "jawabannya", style: "title" },
    ],
  },
  {
    id: "p1",
    point: 1,
    duration: 6.5,
    lines: [
      { text: "*95%* air", at: 0.15, sync: "pertama", style: "title" },
      { text: "sisanya musin, protein & garam", at: 3.5, sync: "sisanya", style: "body" },
    ],
  },
  {
    id: "p2",
    point: 2,
    duration: 4.6,
    lines: [
      { text: "garamnya *penting*", at: 0.15, sync: "kedua", style: "title" },
      { text: "bikin lendir tetap encer & mengalir", at: 1.7, sync: "bikin", style: "body" },
    ],
  },
  {
    id: "p3",
    point: 3,
    duration: 5.7,
    lines: [
      { text: "*jebakan* kuman", at: 0.15, sync: "ketiga", style: "title" },
      { text: "debu & kuman nempel, lalu dilawan enzim", at: 2.6, sync: "debu", style: "body" },
    ],
  },
  {
    id: "twist",
    duration: 5.5,
    lines: [
      { text: "eh, ada lagi 👀", at: 0.15, sync: "eh", style: "body" },
      { text: "*ketelan* tiap hari", at: 1.2, sync: "sebagian", style: "title" },
      { text: "(tanpa sadar)", at: 4.1, sync: "tanpa", style: "note" },
    ],
  },
  {
    id: "tips",
    duration: 6.0,
    lines: [
      { text: "jangan *dikorek*", at: 0.15, sync: "jadi", style: "title" },
      { text: "bisa luka & mimisan", at: 2.1, sync: "bisa", style: "body" },
    ],
  },
  {
    id: "dokter",
    duration: 4.6,
    lines: [
      { text: "ke *dokter* kalau", at: 0.15, sync: "kalau", style: "title" },
      { text: "sering berdarah", at: 0.6, sync: "sering", style: "body" },
      { text: "hijau/kuning + demam", at: 1.5, sync: "hijau", style: "body" },
    ],
  },
  {
    id: "komen",
    duration: 4.0,
    lines: [
      { text: "kamu tim *mana?*", at: 0.15, sync: "kamu", style: "title" },
      { text: "tulis di komen 👇", at: 2.5, sync: "tulis", style: "note" },
    ],
  },
];

/** Waktu (relatif awal scene) saat kata diucapkan, atau fallback bila belum ada suara. */
export const syncAt = (id: string, word: string | undefined, fallback: number, after = 0) => {
  if (!word) return fallback;
  const w = wordTime(VO[id], word, after);
  return w === null ? fallback : Math.max(0, VO_LEAD + w - 0.06);
};

/** jeda setelah suara selesai sebelum scene berganti (dipersingkat agar total ≤ 50 dtk) */
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

export const SOURCE = { name: "kumparan · alodokter · PMC", note: "info umum" };

export const sceneById = (id: SceneId): Scene => SCENES.find((s) => s.id === id)!;

/** detik absolut sebuah kata di narasi scene (atau fallback relatif scene). */
export const beat = (id: SceneId, word: string | undefined, fallback: number, after = 0) =>
  sceneById(id).start + syncAt(id, word, fallback, after);

export const END = (id: SceneId) => sceneById(id).start + sceneById(id).duration;

export const CONTENT_SECONDS = SCENES.reduce((a, s) => a + s.duration, 0);
export const CLOSING_SECONDS = PIXEL_CLOSING_SECONDS;
export const TOTAL_SECONDS = CONTENT_SECONDS + CLOSING_SECONDS;

/** Detik frame hook untuk cover (judul penuh + si biru ketahuan ngupil + stempel "KETAHUAN"):
 *  npx remotion still UpilAsin out/12-upil-asin/cover.png --frame=138 --image-format=png */
export const COVER_AT = 2.3;
