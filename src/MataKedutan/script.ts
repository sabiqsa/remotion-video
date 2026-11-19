// Naskah & timeline "kenapa mata kedutan? pertanda rezeki atau cuma kurang tidur?" — si biru
// begadang di kamar jam 2 pagi. Diringkas dengan kata-kata sendiri dari Alodokter (miokimia,
// pemicu: kurang tidur, kafein, stres/mata lelah) & Cleveland Clinic (kapan perlu ke dokter).
// Waktu dalam DETIK. Tandai kata kunci dengan *bintang*; `sync` = kata narasi pemicu.

import { PIXEL_CLOSING_SECONDS } from "../brand/BrandClosingPixel";
import { VO_LEAD, wordTime } from "../brand/voiceover";
import type { Line } from "../brand/WordText";
import { VO } from "./vo.generated";

export const FPS = 60;

export type SceneId = "hook" | "mitos" | "promise" | "p1" | "p2" | "p3" | "fakta" | "tips" | "serius" | "komen";

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
    duration: 4.6,
    lines: [
      { text: "mata kedutan, pertanda *rezeki?*", at: 0.15, sync: "mata", style: "title" },
      { text: "atau cuma kurang tidur 😴", at: 2.6, sync: "atau", style: "note" },
    ],
  },
  {
    id: "mitos",
    duration: 3.4,
    lines: [{ text: "katanya kiri = *cuan*", at: 0.15, sync: "katanya", style: "title" }],
  },
  {
    id: "promise",
    duration: 3.6,
    lines: [{ text: "kata sains: *3 pemicu*", at: 0.15, sync: "jadi", style: "title" }],
  },
  {
    id: "p1",
    point: 1,
    duration: 5.2,
    lines: [
      { text: "*kurang tidur*", at: 0.15, sync: "pertama", style: "title" },
      { text: "otot kelopak jadi sensitif", at: 1.6, sync: "otot", style: "body" },
    ],
  },
  {
    id: "p2",
    point: 2,
    duration: 5.0,
    lines: [
      { text: "*kafein* kebanyakan", at: 0.15, sync: "kedua", style: "title" },
      { text: "kopi = stimulan ⚡", at: 2.4, sync: "kopi", style: "note" },
    ],
  },
  {
    id: "p3",
    point: 3,
    duration: 5.0,
    lines: [
      { text: "*stres* & layar", at: 0.15, sync: "ketiga", style: "title" },
      { text: "mata capek, kering", at: 2.8, sync: "matanya", style: "body" },
    ],
  },
  {
    id: "fakta",
    duration: 4.4,
    lines: [
      { text: "namanya *miokimia*", at: 0.15, sync: "namanya", style: "title" },
      { text: "umumnya hilang sendiri", at: 1.6, sync: "umumnya", style: "note" },
    ],
  },
  {
    id: "tips",
    duration: 4.8,
    lines: [{ text: "biar *kalem* lagi", at: 0.15, sync: "jadi", style: "title" }],
  },
  {
    id: "serius",
    duration: 6.0,
    lines: [
      { text: "> 2 minggu? *cek dokter*", at: 0.15, sync: "tapi", style: "title" },
      { text: "apalagi sampai nutup / menjalar ke wajah", at: 2.2, sync: "sampai", style: "note" },
    ],
  },
  {
    id: "komen",
    duration: 3.8,
    lines: [
      { text: "kamu *kiri* atau *kanan?*", at: 0.15, sync: "kamu", style: "title" },
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

export const SOURCE = { name: "alodokter.com · clevelandclinic.org", note: "info umum" };

export const sceneById = (id: SceneId): Scene => SCENES.find((s) => s.id === id)!;

/** detik absolut sebuah kata di narasi scene (atau fallback relatif scene). */
export const beat = (id: SceneId, word: string | undefined, fallback: number, after = 0) =>
  sceneById(id).start + syncAt(id, word, fallback, after);

export const END = (id: SceneId) => sceneById(id).start + sceneById(id).duration;

export const CONTENT_SECONDS = SCENES.reduce((a, s) => a + s.duration, 0);
export const CLOSING_SECONDS = PIXEL_CLOSING_SECONDS;
export const TOTAL_SECONDS = CONTENT_SECONDS + CLOSING_SECONDS;

/** Detik frame hook untuk cover (judul penuh + koin rezeki di atas kepala si biru). */
export const COVER_AT = 2.2;
