// Ketukan animasi (detik absolut) yang dipakai bersama scene 3D, overlay, dan SFX.
// Dijangkarkan ke kata narasi lewat `beat()`, jadi ikut bergeser saat voiceover berubah.

import { beat, END, sceneById } from "./script";

const S = (id: Parameters<typeof sceneById>[0]) => sceneById(id).start;

export const BEATS = {
  // hook: lampu kamar dimatikan "tek" → wajah diterangi HP → "minus?!" syok
  off: beat("hook", "gelap", 1.3),
  says: beat("hook", "katanya", 2.6),
  minus0: beat("hook", "minus", 3.4),
  // mitos: kacamata minus dicap "mitos"
  glasses: beat("mitos", "minus", 0.5),
  myth: beat("mitos", "terbukti", 1.2),
  three: beat("mitos", "tiga", 2.4),
  // p1: macro mata — pupil melebar (gelap) → layar menyala terang → pupil mengecil → lelah
  work: beat("p1", "lembur", 1.0),
  pupil: beat("p1", "pupil", 2.0),
  dilate: beat("p1", "melebar", 2.4),
  bright: beat("p1", "terang", 3.6),
  tired: beat("p1", "lelah", 4.8),
  // p2: kedip jarang → kering → perih
  blink: beat("p2", "kedip", 1.0),
  focus: beat("p2", "fokus", 1.8),
  dry: beat("p2", "kering", 2.8),
  sting: beat("p2", "perih", 3.4),
  // p3: jam berputar 22:00 → 01:00, bar melatonin turun, menguap tapi melek
  sleep: beat("p3", "susah", 0.9),
  light: beat("p3", "cahaya", 1.8),
  mela: beat("p3", "melatonin", 2.8),
  yawn: beat("p3", "ngantuk", 3.8),
  // twist: kepala miring ke bantal (mata kiri tertutup) → lampu nyala → mata kiri "gelap" → pulih
  eh: beat("twist", "eh", 0.2),
  tilt: beat("twist", "miring", 1.8),
  pillow: beat("twist", "bantal", 3.0),
  blind: beat("twist", "buta", 3.9),
  temp: beat("twist", "sementara", 4.5),
  mins: beat("twist", "menit", 5.8),
  // tips: lampu kamar menyala lagi + checklist
  tick1: beat("tips", "nyalain", 0.5),
  tick2: beat("tips", "turunin", 1.6),
  tick3: beat("tips", "istirahatin", 2.8),
  doc: beat("tips", "dokter", 5.0),
  // komen
  teamA: beat("komen", "ketiduran", 1.6),
  teamB: beat("komen", "jauh", 2.9),
};

/** Lampu kamar: 1 = nyala (hangat), 0 = mati (cuma cahaya HP). Mati di "gelap", nyala di twist "buta", tetap nyala sampai akhir. */
export const ROOM_LIGHT: [number, number][] = [
  [0, 1],
  [BEATS.off, 0],
  [BEATS.blind, 1],
];

/** Syok (mata melotot, rahang jatuh): [mulai, selesai, kekuatan]. */
export const SHOCK: [number, number, number][] = [
  [BEATS.minus0 - 0.05, END("hook") - 0.1, 1],
  [BEATS.blind - 0.05, BEATS.mins - 0.2, 0.9],
];

/** Lelah / perih (alis turun, mata sayu): [mulai, selesai, kekuatan]. */
export const TIRED: [number, number, number][] = [
  [BEATS.tired - 0.1, END("p1") - 0.05, 0.8],
  [BEATS.dry - 0.1, END("p2") - 0.05, 1],
];

export type ZoomTarget = "face" | "eye" | "face2";
/** Zoom macro: [mulai dorong, mulai tarik keluar, target]. "face" = dolly zoom saat lampu mati. */
export const ZOOMS: [number, number, ZoomTarget][] = [
  [BEATS.off - 0.1, END("hook") - 0.4, "face"],
  [BEATS.pupil - 0.35, BEATS.tired + 0.6, "eye"],
  [BEATS.blind - 0.1, BEATS.temp + 0.35, "face2"],
];

/** Jam dinding (jam desimal): 22:00 di awal p3 → 01:00 saat "ngantuk". */
export const CLOCK: [number, number][] = [
  [0, 22],
  [S("p3") + 0.3, 22],
  [BEATS.yawn, 25],
];
