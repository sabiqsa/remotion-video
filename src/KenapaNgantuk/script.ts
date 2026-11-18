// Naskah & timeline v2 "kenapa habis makan ngantuk?" — semua waktu dalam DETIK.
// Konten diringkas dari artikel Alodokter dengan kata-kata sendiri.
// Tandai kata kunci dengan *bintang* agar diberi highlight kuning.

import { PIXEL_CLOSING_SECONDS } from '../brand/BrandClosingPixel';

export const FPS = 60;

export type SceneId =
  | 'hook'
  | 'promise'
  | 'p1'
  | 'p2'
  | 'p3'
  | 'p4'
  | 'p5'
  | 'food'
  | 'outro';

import type { Line } from '../brand/WordText';
import { sceneDurationFor, VO_LEAD, wordTime } from '../brand/voiceover';
import { VO } from './vo.generated';
export type { Line, LineStyle } from '../brand/WordText';

export type FoodItem = { name: string; tag: string; at: number; sync?: string };

export type Scene = {
  id: SceneId;
  start: number;
  duration: number;
  lines: Line[];
  /** nomor poin 1..5 untuk penanda "n/5" */
  point?: number;
};

const scenes: Omit<Scene, 'start'>[] = [
  {
    id: 'hook',
    duration: 3,
    lines: [
      { text: 'habis makan', at: 0.15, sync: 'habis', style: 'title' },
      { text: 'langsung *ngantuk?*', at: 0.4, sync: 'langsung', style: 'title' },
      { text: 'bukan karena kamu malas kok', at: 1.35, sync: 'bukan', style: 'note' },
    ],
  },
  {
    id: 'promise',
    duration: 2,
    lines: [{ text: 'ada *5 alasan*', at: 0.05, sync: 'lima', style: 'title' }],
  },
  {
    id: 'p1',
    point: 1,
    duration: 4.5,
    lines: [
      { text: '*hormon* ngantuk naik', at: 0.15, sync: 'hormon', style: 'title' },
      {
        text: 'saat mencerna, tubuh melepas serotonin & melatonin',
        sync: 'saat',
        at: 0.65,
        style: 'body',
      },
    ],
  },
  {
    id: 'p2',
    point: 2,
    duration: 4.5,
    lines: [
      { text: 'darah “pindah” ke *perut*', at: 0.15, sync: 'aliran', style: 'title' },
      {
        text: 'suplai darah ke otak jadi sedikit berkurang',
        sync: 'suplai',
        at: 0.65,
        style: 'body',
      },
      { text: '(teori ini masih diteliti)', at: 2.0, sync: 'teori', style: 'note' },
    ],
  },
  {
    id: 'p3',
    point: 3,
    duration: 4,
    lines: [
      { text: 'kamu *kurang tidur*', at: 0.15, sync: 'kurang', style: 'title' },
      {
        text: 'badan capek & gampang lapar, jadi makan lebih banyak',
        sync: 'badan',
        at: 0.6,
        style: 'body',
      },
      { text: 'tip: tidur 7–9 jam', at: 1.9, sync: 'usahakan', style: 'tip' },
    ],
  },
  {
    id: 'p4',
    point: 4,
    duration: 4,
    lines: [
      { text: 'jarang *gerak*', at: 0.15, sync: 'jarang', style: 'title' },
      { text: 'tubuh jadi gampang lelah', at: 0.55, sync: 'tubuh', style: 'body' },
      { text: 'tip: jalan kaki 15 menit/hari', at: 1.6, sync: 'coba', style: 'tip' },
    ],
  },
  {
    id: 'p5',
    point: 5,
    duration: 4.5,
    lines: [
      { text: 'ada *gangguan* kesehatan', at: 0.15, sync: 'gangguan', style: 'title' },
      {
        text: 'misalnya diabetes, anemia, hipotiroid, atau sleep apnea',
        sync: 'misalnya',
        at: 0.7,
        style: 'body',
      },
    ],
  },
  {
    id: 'food',
    duration: 4.5,
    lines: [{ text: 'makanan yang bikin *ngantuk*', at: 0.1, style: 'title' }],
  },
  {
    id: 'outro',
    duration: 3,
    lines: [
      { text: 'normal kok.', at: 0.1, sync: 'normal', style: 'title' },
      { text: 'tapi kalau sering & berat,', at: 0.55, sync: 'tapi', style: 'body' },
      { text: '*cek ke dokter*', at: 1.0, sync: 'cek', style: 'title' },
    ],
  },
];

/** Waktu (relatif awal scene) saat kata diucapkan, atau fallback bila belum ada suara. */
const syncAt = (id: string, word: string | undefined, fallback: number) => {
  if (!word) return fallback;
  const w = wordTime(VO[id], word);
  return w === null ? fallback : Math.max(0, VO_LEAD + w - 0.06);
};

export const SCENES: Scene[] = (() => {
  let start = 0;
  return scenes.map((s) => {
    const duration = sceneDurationFor(VO[s.id], s.duration);
    const lines = s.lines.map((l) => ({ ...l, at: syncAt(s.id, l.sync, l.at) }));
    const out = { ...s, duration, lines, start };
    start += duration;
    return out;
  });
})();

const FOOD_BASE: FoodItem[] = [
  { name: 'telur · tahu · ikan', tag: 'tinggi triptofan', at: 0.75, sync: 'telur' },
  { name: 'pisang', tag: 'kalium & magnesium', at: 1.45, sync: 'pisang' },
  { name: 'buah ceri', tag: 'melatonin alami', at: 2.15, sync: 'ceri' },
  { name: 'teh chamomile', tag: 'apigenin bikin rileks', at: 2.85, sync: 'chamomile' },
  { name: 'minuman berenergi', tag: 'segarnya cuma sesaat', at: 3.55, sync: 'minuman' },
];

export const FOOD_ITEMS: FoodItem[] = FOOD_BASE.map((f) => ({
  ...f,
  at: syncAt('food', f.sync, f.at),
}));

// Suara closing ("follow day one eight…") kini bawaan BrandClosingPixel (public/sfx/closing-vo.wav).

export const SOURCE = {
  name: 'alodokter.com',
};

export const sceneById = (id: SceneId): Scene =>
  SCENES.find((s) => s.id === id)!;

/** Detik akhir konten (sebelum closing). Sumber tampil sebagai watermark. */
export const CONTENT_SECONDS = SCENES.reduce((a, s) => a + s.duration, 0);
export const CLOSING_SECONDS = PIXEL_CLOSING_SECONDS;
export const TOTAL_SECONDS = CONTENT_SECONDS + CLOSING_SECONDS;
