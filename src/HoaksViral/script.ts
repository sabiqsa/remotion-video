// Naskah & timeline "kenapa hoaks lebih cepat viral daripada fakta?" — si biru "sok pintar"
// (kacamata bulat + dasi kupu-kupu) menjelaskan studi MIT (Vosoughi, Roy & Aral, Science 2018),
// lalu dia sendiri hampir meneruskan hoaks. Diringkas dengan kata-kata sendiri dari MIT News.
// Waktu dalam DETIK. Tandai kata kunci dengan *bintang*; `sync` = kata narasi pemicu.

import { PIXEL_CLOSING_SECONDS } from "../brand/BrandClosingPixel";
import { VO_LEAD, wordTime } from "../brand/voiceover";
import type { Line } from "../brand/WordText";
import { VO } from "./vo.generated";

export const FPS = 60;

export type SceneId = "hook" | "ehem" | "data" | "cepat" | "p1" | "p2" | "p3" | "twist" | "tips" | "komen";

export type Scene = {
  id: SceneId;
  start: number;
  duration: number;
  lines: Line[];
  /** nomor alasan 1..3 untuk penanda "n/3" */
  point?: number;
};

const scenes: Omit<Scene, "start">[] = [
  {
    id: "hook",
    duration: 3.6,
    lines: [
      { text: "kenapa hoaks lebih cepat *viral?*", at: 0.15, sync: "kenapa", style: "title" },
      { text: "daripada fakta 🤔", at: 2.2, sync: "daripada", style: "note" },
    ],
  },
  {
    id: "ehem",
    duration: 2.8,
    lines: [{ text: "ehem, ada *penelitiannya*", at: 0.15, sync: "ehem", style: "title" }],
  },
  {
    id: "data",
    duration: 6.0,
    lines: [
      { text: "hoaks *70%* lebih sering di-share", at: 0.15, sync: "studi", style: "title" },
      { text: "studi MIT · 126 ribu kabar di twitter", at: 0.5, sync: "seratus", style: "note" },
    ],
  },
  {
    id: "cepat",
    duration: 5.0,
    lines: [
      { text: "fakta *6× lebih lama*", at: 0.15, sync: "fakta", style: "title" },
      { text: "buat nyampe 1.500 orang", at: 2.4, sync: "nyampe", style: "body" },
    ],
  },
  {
    id: "p1",
    point: 1,
    duration: 4.6,
    lines: [
      { text: "terasa *baru*", at: 0.15, sync: "pertama", style: "title" },
      { text: "& mengejutkan (diduga)", at: 1.4, sync: "mengejutkan", style: "note" },
    ],
  },
  {
    id: "p2",
    point: 2,
    duration: 5.0,
    lines: [
      { text: "bikin *emosi*", at: 0.15, sync: "kedua", style: "title" },
      { text: "kaget & jijik", at: 1.4, sync: "kaget", style: "body" },
    ],
  },
  {
    id: "p3",
    point: 3,
    duration: 4.2,
    lines: [{ text: "bukan bot, tapi *kita*", at: 0.15, sync: "ketiga", style: "title" }],
  },
  {
    id: "twist",
    duration: 3.2,
    lines: [{ text: "eh… *tahan dulu*", at: 0.15, sync: "eh", style: "title" }],
  },
  {
    id: "tips",
    duration: 5.4,
    lines: [{ text: "sebelum share, *cek dulu*", at: 0.15, sync: "jadi", style: "title" }],
  },
  {
    id: "komen",
    duration: 3.6,
    lines: [
      { text: "pernah *ketipu?*", at: 0.15, sync: "kamu", style: "title" },
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

export const SOURCE = { name: "news.mit.edu · science.org", note: "studi 2018" };

export const sceneById = (id: SceneId): Scene => SCENES.find((s) => s.id === id)!;

/** detik absolut sebuah kata di narasi scene (atau fallback relatif scene). */
export const beat = (id: SceneId, word: string | undefined, fallback: number, after = 0) =>
  sceneById(id).start + syncAt(id, word, fallback, after);

export const END = (id: SceneId) => sceneById(id).start + sceneById(id).duration;

export const CONTENT_SECONDS = SCENES.reduce((a, s) => a + s.duration, 0);
export const CLOSING_SECONDS = PIXEL_CLOSING_SECONDS;
export const TOTAL_SECONDS = CONTENT_SECONDS + CLOSING_SECONDS;

/** Detik frame hook untuk cover (judul penuh + balapan HOAKS di garis finis, FAKTA masih ngiket tali sepatu). */
export const COVER_AT = 3.4;
