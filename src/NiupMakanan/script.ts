// Naskah & timeline "kenapa makanan panas gaboleh ditiup?" — si biru jadi koki mini 👨‍🍳,
// meniup sesendok bakso panas. Diringkas dengan kata-kata sendiri dari studi Dawson dkk. (2017,
// Clemson Univ., tiup lilin kue) & ADA MouthHealthy (bakteri gigi berlubang pindah lewat ludah ke bayi).
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
    duration: 3.5,
    lines: [
      { text: "makanan panas,", at: 0.15, sync: "makanan", style: "body" },
      { text: "langsung *ditiup?*", at: 1.0, sync: "langsung", style: "title" },
      { text: "eh, tunggu dulu ✋", at: 2.6, sync: "tunggu", style: "note" },
    ],
  },
  {
    id: "ehem",
    duration: 3.0,
    lines: [
      { text: "dari kecil *dilarang*", at: 0.15, sync: "dari", style: "title" },
      { text: "ternyata ada alasannya", at: 1.6, sync: "ternyata", style: "body" },
    ],
  },
  {
    id: "p1",
    point: 1,
    duration: 8.0,
    lines: [
      { text: "napas bawa *bakteri*", at: 0.15, sync: "pertama", style: "title" },
      { text: "studi tiup lilin kue 🎂", at: 3.2, sync: "studi", style: "note" },
    ],
  },
  {
    id: "p2",
    point: 2,
    duration: 6.0,
    lines: [
      { text: "bahaya buat *bayi*", at: 0.15, sync: "kedua", style: "title" },
      { text: "bakteri gigi berlubang bisa pindah", at: 2.2, sync: "penyebab", style: "body" },
    ],
  },
  {
    id: "p3",
    point: 3,
    duration: 4.5,
    lines: [
      { text: "lagi *flu?*", at: 0.15, sync: "ketiga", style: "title" },
      { text: "percikan ludah ikut nempel", at: 1.6, sync: "perchikan", style: "body" },
    ],
  },
  {
    id: "twist",
    duration: 4.5,
    lines: [
      { text: "cepat dingin, *tapi…*", at: 0.15, sync: "niup", style: "title" },
      { text: "kumannya ikut 🦠", at: 2.2, sync: "kumannya", style: "body" },
    ],
  },
  {
    id: "tips",
    duration: 7.0,
    lines: [{ text: "cara *aman*", at: 0.15, sync: "mending", style: "title" }],
  },
  {
    id: "komen",
    duration: 3.5,
    lines: [
      { text: "tim tiup atau *tim sabar?*", at: 0.15, sync: "kamu", style: "title" },
      { text: "tulis di komen 👇", at: 2.4, sync: "tulis", style: "note" },
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

export const SOURCE = { name: "Dawson dkk. 2017 · ADA (mouthhealthy.org)", note: "info umum" };

export const sceneById = (id: SceneId): Scene => SCENES.find((s) => s.id === id)!;

/** detik absolut sebuah kata di narasi scene (atau fallback relatif scene). */
export const beat = (id: SceneId, word: string | undefined, fallback: number, after = 0) =>
  sceneById(id).start + syncAt(id, word, fallback, after);

export const END = (id: SceneId) => sceneById(id).start + sceneById(id).duration;

export const CONTENT_SECONDS = SCENES.reduce((a, s) => a + s.duration, 0);
export const CLOSING_SECONDS = PIXEL_CLOSING_SECONDS;
export const TOTAL_SECONDS = CONTENT_SECONDS + CLOSING_SECONDS;

/** Detik frame hook untuk cover (judul penuh + macro pipi menggembung "fuuuh" + napas ke bakso). */
export const COVER_AT = 2.6;
