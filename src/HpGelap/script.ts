// Naskah & timeline "kenapa gaboleh main hp di tempat gelap?" — si biru rebahan-duduk di kasur,
// lampu kamar dimatikan, wajah cuma diterangi cahaya HP. Diringkas dengan kata-kata sendiri dari:
// - dokter mata (JawaPos, Hellosehat): main gadget di gelap TIDAK terbukti bikin minus; yang terjadi mata
//   cepat lelah karena terus menyesuaikan layar terang vs sekitar gelap (KlikDokter, RRI).
// - AAO: saat menatap layar kita lebih jarang berkedip → mata kering.
// - Chang dkk. 2015 (PNAS) & Alodokter: cahaya layar sebelum tidur menekan melatonin, jam tidur mundur.
// - Alim-Marvasti dkk. 2016 (NEJM, 2 kasus) & EyeWiki AAO: "transient smartphone blindness" — main HP
//   sambil berbaring miring di gelap, satu mata ketutup bantal → mata itu tak melihat beberapa menit (≤ ±15
//   menit), lalu pulih penuh.
// Waktu dalam DETIK. Tandai kata kunci dengan *bintang*; `sync` = kata narasi pemicu.

import { PIXEL_CLOSING_SECONDS } from "../brand/BrandClosingPixel";
import { VO_LEAD, wordTime } from "../brand/voiceover";
import type { Line } from "../brand/WordText";
import { VO } from "./vo.generated";

export const FPS = 60;

export type SceneId = "hook" | "mitos" | "p1" | "p2" | "p3" | "twist" | "tips" | "komen";

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
      { text: "main hp di gelap", at: 0.15, sync: "kenapa", style: "body" },
      { text: "*bahaya?*", at: 1.2, sync: "gelap", style: "title" },
      { text: "katanya bikin minus 👀", at: 3.0, sync: "katanya", style: "note" },
    ],
  },
  {
    id: "mitos",
    duration: 3.6,
    lines: [
      { text: "minus? *belum terbukti*", at: 0.15, sync: "minus", style: "title" },
      { text: "tapi ada 3 hal ini", at: 1.8, sync: "tapi", style: "body" },
    ],
  },
  {
    id: "p1",
    point: 1,
    duration: 6.0,
    lines: [
      { text: "mata *kerja lembur*", at: 0.15, sync: "pertama", style: "title" },
      { text: "pupil melebar, layar terang", at: 2.0, sync: "pupil", style: "body" },
    ],
  },
  {
    id: "p2",
    point: 2,
    duration: 4.6,
    lines: [
      { text: "jarang *kedip*", at: 0.15, sync: "kedua", style: "title" },
      { text: "mata kering & perih", at: 2.0, sync: "kering", style: "body" },
    ],
  },
  {
    id: "p3",
    point: 3,
    duration: 5.2,
    lines: [
      { text: "*susah* tidur", at: 0.15, sync: "ketiga", style: "title" },
      { text: "melatonin ditekan cahaya layar", at: 1.8, sync: "cahaya", style: "body" },
    ],
  },
  {
    id: "twist",
    duration: 7.2,
    lines: [
      { text: "eh, ada lagi 👀", at: 0.15, sync: "eh", style: "body" },
      { text: "buta *sementara*", at: 0.15, sync: "buta", style: "title" },
      { text: "(baru 2 kasus dilaporkan)", at: 0.4, sync: "beberapa", style: "note" },
    ],
  },
  {
    id: "tips",
    duration: 7.0,
    lines: [{ text: "cara *aman*", at: 0.15, sync: "jadi", style: "title" }],
  },
  {
    id: "komen",
    duration: 4.0,
    lines: [
      { text: "kamu *tim mana?*", at: 0.15, sync: "kamu", style: "title" },
      { text: "tulis di komen 👇", at: 3.0, sync: "tulis", style: "note" },
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

export const SOURCE = { name: "NEJM 2016 · AAO · PNAS 2015", note: "info umum" };

export const sceneById = (id: SceneId): Scene => SCENES.find((s) => s.id === id)!;

/** detik absolut sebuah kata di narasi scene (atau fallback relatif scene). */
export const beat = (id: SceneId, word: string | undefined, fallback: number, after = 0) =>
  sceneById(id).start + syncAt(id, word, fallback, after);

export const END = (id: SceneId) => sceneById(id).start + sceneById(id).duration;

export const CONTENT_SECONDS = SCENES.reduce((a, s) => a + s.duration, 0);
export const CLOSING_SECONDS = PIXEL_CLOSING_SECONDS;
export const TOTAL_SECONDS = CONTENT_SECONDS + CLOSING_SECONDS;

/** Detik frame hook untuk cover (judul penuh + wajah syok diterangi HP + stempel "MINUS?!"):
 *  npx remotion still HpGelap out/11-hp-gelap/cover.png --frame=258 --image-format=png */
export const COVER_AT = 4.3;
