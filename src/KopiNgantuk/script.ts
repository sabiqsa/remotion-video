// Naskah & timeline "kenapa habis ngopi malah ngantuk?" — format "review jujur americano".
// Diringkas dengan kata-kata sendiri dari Hello Sehat, Alodokter, Antara, CNN Indonesia.
// Waktu dalam DETIK. Tandai kata kunci dengan *bintang*; `sync` = kata narasi pemicu.

import { PIXEL_CLOSING_SECONDS } from "../brand/BrandClosingPixel";
import { VO_LEAD, wordTime } from "../brand/voiceover";
import type { Line } from "../brand/WordText";
import { VO } from "./vo.generated";

export const FPS = 60;

export type SceneId =
  | "hook"
  | "rating"
  | "promise"
  | "p1"
  | "p2"
  | "siklus"
  | "p3"
  | "p4"
  | "p5"
  | "tips"
  | "serius"
  | "ulang"
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
    duration: 4.4,
    lines: [
      { text: "review jujur: americano ☕", at: 0.15, sync: "review", style: "note" },
      { text: "habis ngopi kok *ngantuk?*", at: 2.4, sync: "lho", style: "title" },
    ],
  },
  {
    id: "rating",
    duration: 3.4,
    lines: [{ text: "rating melek: *1/5*", at: 0.15, sync: "rating", style: "title" }],
  },
  {
    id: "promise",
    duration: 3.4,
    lines: [
      { text: "bukan salah kopinya doang", at: 0.15, sync: "ternyata", style: "note" },
      { text: "ada *5 alasan*", at: 1.4, sync: "lima", style: "title" },
    ],
  },
  {
    id: "p1",
    point: 1,
    duration: 7,
    lines: [
      { text: "*adenosin* numpuk", at: 0.15, sync: "adenosin", style: "title" },
      { text: "kafein cuma nahan sinyal ngantuk", at: 1.4, sync: "kafein", style: "body" },
      { text: "pas habis → ngantuk borongan", at: 3.8, sync: "pas", style: "body" },
    ],
  },
  {
    id: "p2",
    point: 2,
    duration: 4.5,
    lines: [
      { text: "kurang *tidur*", at: 0.15, sync: "kurang", style: "title" },
      { text: "kopi bukan pengganti tidur", at: 1.4, sync: "kopi", style: "body" },
    ],
  },
  {
    id: "siklus",
    point: 2,
    duration: 5,
    lines: [
      { text: "lingkaran *setan*", at: 0.15, sync: "apalagi", style: "title" },
      { text: "kopi sore → tidur jelek → kopi", at: 1.2, sync: "tidur", style: "body" },
    ],
  },
  {
    id: "p3",
    point: 3,
    duration: 4.6,
    lines: [
      { text: "udah *kebal*", at: 0.15, sync: "kebal", style: "title" },
      { text: "efek kafein bisa makin lemah", at: 1.4, sync: "efek", style: "body" },
    ],
  },
  {
    id: "p4",
    point: 4,
    duration: 6,
    lines: [
      { text: "awas *gula*", at: 0.15, sync: "gula", style: "title" },
      { text: "gula darah bisa naik-turun", at: 1.2, sync: "manis", style: "body" },
      { text: "americano aman… kecuali +3 sachet", at: 3.2, sync: "americano", style: "note" },
    ],
  },
  {
    id: "p5",
    point: 5,
    duration: 4.4,
    lines: [
      { text: "beda *gen*", at: 0.15, sync: "gen", style: "title" },
      { text: "beda cara ngolah kafein", at: 1.2, sync: "tiap", style: "body" },
    ],
  },
  {
    id: "tips",
    duration: 7.5,
    lines: [
      { text: "biar *nggak zonk*", at: 0.1, sync: "biar", style: "title" },
      { text: "efek kopi 5–6 jam", at: 1.0, sync: "efek", style: "tip" },
      { text: "ngopi pagi", at: 3.2, sync: "pagi", style: "tip" },
      { text: "maks 4 cangkir/hari", at: 4.0, sync: "maksimal", style: "tip" },
      { text: "stop sore", at: 5.4, sync: "stop", style: "tip" },
    ],
  },
  {
    id: "serius",
    duration: 5,
    lines: [
      { text: "ngantuk *terus?*", at: 0.15, sync: "ngantuk", style: "title" },
      { text: "ganggu aktivitas? cek ke dokter", at: 1.2, sync: "ganggu", style: "body" },
      { text: "& jangan nyetir pas ngantuk", at: 3.0, sync: "jangan", style: "note" },
    ],
  },
  {
    id: "ulang",
    duration: 3.8,
    lines: [
      { text: "rating ulang: *4/5*", at: 0.15, sync: "rating", style: "title" },
      { text: "asal tidurnya cukup", at: 1.8, sync: "asal", style: "note" },
    ],
  },
  {
    id: "komen",
    duration: 4.8,
    lines: [
      { text: "tim *mana?*", at: 0.15, sync: "kamu", style: "title" },
      { text: "tulis di komen 👇", at: 2.8, sync: "tulis", style: "note" },
    ],
  },
];

/** Waktu (relatif awal scene) saat kata diucapkan, atau fallback bila belum ada suara. */
export const syncAt = (id: string, word: string | undefined, fallback: number, after = 0) => {
  if (!word) return fallback;
  const w = wordTime(VO[id], word, after);
  return w === null ? fallback : Math.max(0, VO_LEAD + w - 0.06);
};

/** jeda setelah suara selesai sebelum scene berganti (lebih rapat dari VO_TAIL bawaan 0.45) */
const TAIL = 0.2;

export const SCENES: Scene[] = (() => {
  let start = 0;
  return scenes.map((s) => {
    // durasi = panjang suara + ekor pendek, supaya tidak ada jeda mati antar scene
    // (`duration` di atas hanya dipakai bila belum ada voiceover)
    const clip = VO[s.id];
    const duration = clip ? VO_LEAD + clip.duration + TAIL : s.duration;
    const lines = s.lines.map((l) => ({ ...l, at: syncAt(s.id, l.sync, l.at) }));
    const out = { ...s, duration, lines, start };
    start += duration;
    return out;
  });
})();

export const SOURCE = { name: "hellosehat.com · alodokter.com" };

export const sceneById = (id: SceneId): Scene => SCENES.find((s) => s.id === id)!;

/** detik absolut sebuah kata di narasi scene (atau fallback relatif scene). */
export const beat = (id: SceneId, word: string | undefined, fallback: number, after = 0) =>
  sceneById(id).start + syncAt(id, word, fallback, after);

export const END = (id: SceneId) => sceneById(id).start + sceneById(id).duration;

export const CONTENT_SECONDS = SCENES.reduce((a, s) => a + s.duration, 0);
export const CLOSING_SECONDS = PIXEL_CLOSING_SECONDS;
export const TOTAL_SECONDS = CONTENT_SECONDS + CLOSING_SECONDS;

/** Detik frame hook yang dipakai sebagai cover (judul tampil penuh + aksi karakter):
 *  npx remotion still KopiNgantuk out/03-kopi-ngantuk/cover.png --frame=240 --image-format=png */
export const COVER_AT = 4.0;
