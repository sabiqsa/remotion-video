// Naskah & timeline "kenapa suka gigitin kuku?" — si biru berpiyama dino 🦖 + gigi kelinci,
// melawan geng "si kuku" (kuku bermuka di tangan raksasa). Diringkas dengan kata-kata sendiri
// dari Alodokter, detikHealth, Halodoc & Cleveland Clinic (onikofagia).
// Waktu dalam DETIK. Tandai kata kunci dengan *bintang*; `sync` = kata narasi pemicu.

import { PIXEL_CLOSING_SECONDS } from "../brand/BrandClosingPixel";
import { VO_LEAD, wordTime } from "../brand/voiceover";
import type { Line } from "../brand/WordText";
import { VO } from "./vo.generated";

export const FPS = 60;

export type SceneId = "hook" | "nama" | "promise" | "p1" | "p2" | "p3" | "bahaya" | "tips" | "serius" | "komen";

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
      { text: "kenapa suka *gigitin kuku?*", at: 0.15, sync: "kenapa", style: "title" },
      { text: "padahal nggak laper 🦖", at: 2.4, sync: "padahal", style: "note" },
    ],
  },
  {
    id: "nama",
    duration: 4.0,
    lines: [
      { text: "namanya *onikofagia*", at: 0.15, sync: "nama", style: "title" },
      { text: "kamu nggak sendirian", at: 2.2, sync: "kamu", style: "note" },
    ],
  },
  {
    id: "promise",
    duration: 2.5,
    lines: [{ text: "biasanya ada *3 pemicu*", at: 0.15, sync: "biasanya", style: "title" }],
  },
  {
    id: "p1",
    point: 1,
    duration: 5.0,
    lines: [
      { text: "*cemas* & stres", at: 0.15, sync: "pertama", style: "title" },
      { text: "otak lagi nenangin diri", at: 2.2, sync: "gigit", style: "body" },
    ],
  },
  {
    id: "p2",
    point: 2,
    duration: 4.5,
    lines: [
      { text: "*bosan*", at: 0.15, sync: "kedua", style: "title" },
      { text: "tangan nganggur 🙃", at: 1.4, sync: "tangan", style: "note" },
    ],
  },
  {
    id: "p3",
    point: 3,
    duration: 4.5,
    lines: [
      { text: "lagi *mikir keras*", at: 0.15, sync: "ketiga", style: "title" },
      { text: "kuku jadi camilan", at: 2.4, sync: "kuku", style: "body" },
    ],
  },
  {
    id: "bahaya",
    duration: 5.0,
    lines: [
      { text: "kuku = *sarang kuman*", at: 0.15, sync: "tapi", style: "title" },
      { text: "infeksi & gigi retak", at: 2.2, sync: "infeksi", style: "body" },
    ],
  },
  {
    id: "tips",
    duration: 5.5,
    lines: [{ text: "biar *berhenti*", at: 0.15, sync: "coba", style: "title" }],
  },
  {
    id: "serius",
    duration: 5.0,
    lines: [
      { text: "susah berhenti? *minta bantuan*", at: 0.15, sync: "kalau", style: "title" },
      { text: "jangan marahin diri sendiri ya", at: 2.6, sync: "nggak", style: "note" },
    ],
  },
  {
    id: "komen",
    duration: 3.6,
    lines: [
      { text: "kamu gigit kuku *pas apa?*", at: 0.15, sync: "kamu", style: "title" },
      { text: "tulis di komen 👇", at: 4.2, sync: "tulis", style: "note" },
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

export const SOURCE = { name: "alodokter.com · health.detik.com", note: "info umum" };

export const sceneById = (id: SceneId): Scene => SCENES.find((s) => s.id === id)!;

/** detik absolut sebuah kata di narasi scene (atau fallback relatif scene). */
export const beat = (id: SceneId, word: string | undefined, fallback: number, after = 0) =>
  sceneById(id).start + syncAt(id, word, fallback, after);

export const END = (id: SceneId) => sceneById(id).start + sceneById(id).duration;

export const CONTENT_SECONDS = SCENES.reduce((a, s) => a + s.duration, 0);
export const CLOSING_SECONDS = PIXEL_CLOSING_SECONDS;
export const TOTAL_SECONDS = CONTENT_SECONDS + CLOSING_SECONDS;

/** Detik frame hook untuk cover (judul penuh + gigi kelinci + si kuku menjerit "aaa!"). */
export const COVER_AT = 1.67;
