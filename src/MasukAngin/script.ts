// Naskah & timeline "kenapa masuk angin?" — versi interaktif + komedi. Waktu dalam DETIK.
// Diringkas dengan kata-kata sendiri dari Alodokter (utama) & Halodoc (kerokan).
// Tandai kata kunci dengan *bintang*; `sync` = kata narasi pemicu munculnya baris.

import { PIXEL_CLOSING_SECONDS } from "../brand/BrandClosingPixel";
import { VO_LEAD, wordTime } from "../brand/voiceover";
import type { Line } from "../brand/WordText";
import { VO } from "./vo.generated";

export const FPS = 60;

export type SceneId =
  | "hook"
  | "promise"
  | "p1"
  | "p2"
  | "p3"
  | "p4"
  | "kuis"
  | "jawab"
  | "p5"
  | "tips"
  | "dokter"
  | "komen";

export type Scene = {
  id: SceneId;
  start: number;
  duration: number;
  lines: Line[];
  /** nomor poin 1..5 untuk penanda "n/5" */
  point?: number;
};

const scenes: Omit<Scene, "start">[] = [
  {
    id: "hook",
    duration: 3.6,
    lines: [
      { text: "kenapa masuk *angin?*", at: 0.15, sync: "kenapa", style: "title" },
      { text: "padahal jendela udah ditutup", at: 1.6, sync: "padahal", style: "note" },
    ],
  },
  {
    id: "promise",
    duration: 3.4,
    lines: [
      { text: "ternyata bukan *angin*", at: 0.15, sync: "ternyata", style: "title" },
      { text: "ini 5 tersangka aslinya", at: 1.4, sync: "lima", style: "body" },
    ],
  },
  {
    id: "p1",
    point: 1,
    duration: 5,
    lines: [
      { text: "*flu* & pilek", at: 0.15, sync: "flu", style: "title" },
      { text: "meriang, pilek, badan pegal", at: 0.9, sync: "bikin", style: "body" },
    ],
  },
  {
    id: "p2",
    point: 2,
    duration: 5,
    lines: [
      { text: "perut *bermasalah*", at: 0.15, sync: "perut", style: "title" },
      { text: "kembung, mual, sendawa terus", at: 0.9, sync: "kembung", style: "body" },
    ],
  },
  {
    id: "p3",
    point: 3,
    duration: 4.5,
    lines: [
      { text: "*daya tahan* turun", at: 0.15, sync: "daya", style: "title" },
      { text: "badan jadi gampang kena infeksi", at: 0.9, sync: "badan", style: "body" },
    ],
  },
  {
    id: "p4",
    point: 4,
    duration: 3.4,
    lines: [
      { text: "*kerokan*", at: 0.15, sync: "kerokan", style: "title" },
      { text: "tebak, merahnya itu apa?", at: 0.9, sync: "coba", style: "body" },
    ],
  },
  // hitung mundur kuis (tanpa narasi)
  { id: "kuis", point: 4, duration: 3.2, lines: [] },
  {
    id: "jawab",
    point: 4,
    duration: 5,
    lines: [
      { text: "jawabannya *B*", at: 0.15, sync: "jawabannya", style: "title" },
      { text: "pembuluh darah kecil yang pecah", at: 0.9, sync: "pembuluh", style: "body" },
      { text: "bikin lega, tapi bukan menyembuhkan", at: 2.8, sync: "bikin", style: "note" },
    ],
  },
  {
    id: "p5",
    point: 5,
    duration: 5.5,
    lines: [
      { text: "awas *angin duduk*", at: 0.15, sync: "angin", style: "title" },
      { text: "serius, ini bukan bercanda", at: 1.6, sync: "nah", style: "note" },
      { text: "nyeri dada bisa tanda masalah jantung", at: 2.6, sync: "nyeri", style: "body" },
    ],
  },
  {
    id: "tips",
    duration: 4,
    lines: [
      { text: "yang *aman* dilakukan", at: 0.1, sync: "yang", style: "title" },
      { text: "minum air hangat", at: 1.0, sync: "minum", style: "tip" },
      { text: "istirahat cukup", at: 1.8, sync: "istirahat", style: "tip" },
    ],
  },
  {
    id: "dokter",
    duration: 5,
    lines: [
      { text: "ke *dokter* kalau", at: 0.1, sync: "tapi", style: "title" },
      { text: "demam lebih dari 3 hari", at: 0.8, sync: "demam", style: "body" },
      { text: "muntah / diare terus", at: 1.8, sync: "muntah", style: "body" },
      { text: "nyeri dada", at: 2.8, sync: "nyeri", style: "body" },
    ],
  },
  {
    id: "komen",
    duration: 4.6,
    lines: [
      { text: "kamu tim *mana?*", at: 0.15, sync: "kamu", style: "title" },
      { text: "tulis di komen 👇", at: 2.6, sync: "tulis", style: "note" },
    ],
  },
];

/** Waktu (relatif awal scene) saat kata diucapkan, atau fallback bila belum ada suara. */
export const syncAt = (id: string, word: string | undefined, fallback: number) => {
  if (!word) return fallback;
  const w = wordTime(VO[id], word);
  return w === null ? fallback : Math.max(0, VO_LEAD + w - 0.06);
};

/** Jeda setelah suara habis. Durasi scene = VO_LEAD + suara + TAIL (durasi dasar hanya untuk scene tanpa
 * suara, mis. hitung mundur kuis) → jeda antar scene ±0.65 dtk, bukan ±0.9 dtk. */
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

export const SOURCE = { name: "alodokter.com · halodoc.com" };

export const sceneById = (id: SceneId): Scene => SCENES.find((s) => s.id === id)!;

/** detik absolut sebuah kata di narasi scene (atau fallback relatif scene). */
export const beat = (id: SceneId, word: string | undefined, fallback: number) =>
  sceneById(id).start + syncAt(id, word, fallback);

export const CONTENT_SECONDS = SCENES.reduce((a, s) => a + s.duration, 0);
export const CLOSING_SECONDS = PIXEL_CLOSING_SECONDS;
export const TOTAL_SECONDS = CONTENT_SECONDS + CLOSING_SECONDS;

/** Detik frame hook yang dipakai sebagai cover (judul tampil penuh + aksi karakter):
 *  npx remotion still MasukAngin out/02-masuk-angin/cover.png --frame=150 --image-format=png */
export const COVER_AT = 2.5;
