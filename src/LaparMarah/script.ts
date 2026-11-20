// Naskah & timeline "kenapa lapar gampang marah?" — si biru pegawai kantoran 👔 jam 13.30 belum
// makan siang. Diringkas dengan kata-kata sendiri dari Swami dkk. (2022, PLOS ONE, "Hangry in the
// field": 64 orang, 21 hari) + penjelasan umum gula darah & hormon stres (kortisol, adrenalin).
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
    duration: 4.2,
    lines: [
      { text: "lagi lapar,", at: 0.15, sync: "lagi", style: "body" },
      { text: "gampang *marah?*", at: 1.0, sync: "gampang", style: "title" },
      { text: "bukan kamu jahat kok", at: 2.9, sync: "bukan", style: "note" },
    ],
  },
  {
    id: "ehem",
    duration: 2.8,
    lines: [{ text: "ada *alasannya*", at: 0.15, sync: "ternyata", style: "title" }],
  },
  {
    id: "p1",
    point: 1,
    duration: 6.5,
    lines: [
      { text: "gula darah *turun*", at: 0.15, sync: "pertama", style: "title" },
      { text: "rem kesabaran melemah", at: 3.4, sync: "rem", style: "body" },
    ],
  },
  {
    id: "p2",
    point: 2,
    duration: 6.5,
    lines: [
      { text: "hormon *stres* naik", at: 0.15, sync: "kedua", style: "title" },
      { text: "lebih gampang tersulut", at: 4.4, sync: "efeknya", style: "body" },
    ],
  },
  {
    id: "p3",
    point: 3,
    duration: 7.0,
    lines: [
      { text: "*terbukti* di studi", at: 0.15, sync: "ketiga", style: "title" },
      { text: "64 orang · 21 hari", at: 1.0, sync: "penelitian", style: "note" },
    ],
  },
  {
    id: "twist",
    duration: 4.0,
    lines: [
      { text: "yang marah", at: 0.15, sync: "jadi", style: "body" },
      { text: "*perutmu* 🍱", at: 1.4, sync: "perutmu", style: "title" },
    ],
  },
  {
    id: "tips",
    duration: 5.5,
    lines: [{ text: "biar *nggak hangry*", at: 0.15, sync: "sedia", style: "title" }],
  },
  {
    id: "komen",
    duration: 3.8,
    lines: [
      { text: "lapar *diam* atau *ngamuk?*", at: 0.15, sync: "kamu", style: "title" },
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

export const SOURCE = { name: "Swami dkk. 2022 · PLOS ONE", note: "info umum" };

export const sceneById = (id: SceneId): Scene => SCENES.find((s) => s.id === id)!;

/** detik absolut sebuah kata di narasi scene (atau fallback relatif scene). */
export const beat = (id: SceneId, word: string | undefined, fallback: number, after = 0) =>
  sceneById(id).start + syncAt(id, word, fallback, after);

export const END = (id: SceneId) => sceneById(id).start + sceneById(id).duration;

export const CONTENT_SECONDS = SCENES.reduce((a, s) => a + s.duration, 0);
export const CLOSING_SECONDS = PIXEL_CLOSING_SECONDS;
export const TOTAL_SECONDS = CONTENT_SECONDS + CLOSING_SECONDS;

/** Detik frame hook untuk cover (judul penuh + macro wajah marah 💢). Diset ulang setelah VO. */
export const COVER_AT = 2.35;
