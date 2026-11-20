// Ketukan animasi (detik absolut) yang dipakai bersama scene 3D, overlay, dan SFX.
// Dijangkarkan ke kata narasi lewat `beat()`, jadi ikut bergeser saat voiceover berubah.

import { beat, END } from "./script";

export const BEATS = {
  // hook: tangan naik ke hidung (ngupil), lirik kanan-kiri → ketahuan "jangan pura-pura" → syok
  pick: beat("hook", "upil", 0.6),
  asin: beat("hook", "asin", 1.25),
  caught: beat("hook", "jangan", 1.8),
  // janji: tetes ingus → mengering jadi upil
  drop: beat("janji", "ingus", 1.2),
  dry: beat("janji", "mengering", 2.4),
  // p1: bar komposisi terisi: air → musin → protein → garam
  water: beat("p1", "sembilan", 2.2),
  musin: beat("p1", "musin", 4.2),
  protein: beat("p1", "protein", 4.7),
  salt: beat("p1", "garam", 5.5),
  // p2: macro hidung, lendir mengalir
  penting: beat("p2", "penting", 1.0),
  lendir: beat("p2", "lendir", 2.1),
  encer: beat("p2", "encer", 2.7),
  flow: beat("p2", "mengalir", 3.5),
  // p3: debu & kuman terbang lalu menempel, perisai enzim
  trap: beat("p3", "jebakan", 1.7),
  dust: beat("p3", "debu", 2.6),
  stick: beat("p3", "nempel", 3.3),
  enzim: beat("p3", "enzim", 4.3),
  // twist: tetes turun ke tenggorokan → "glek" → jijik
  eh: beat("twist", "eh", 0.1),
  swallow: beat("twist", "ketelan", 2.9),
  daily: beat("twist", "tiap", 3.5),
  unaware: beat("twist", "tanpa", 4.1),
  // tips: tangan naik lagi → dicoret → mimisan → checklist
  pick2: beat("tips", "jangan", 0.8),
  noPick: beat("tips", "dikorek", 0.9),
  luka: beat("tips", "luka", 2.5),
  bleed: beat("tips", "mimisan", 2.9),
  tick1: beat("tips", "buang", 3.8),
  tick2: beat("tips", "tisu", 5.1),
  // dokter
  d1: beat("dokter", "sering", 0.6),
  d2: beat("dokter", "hijau", 1.5),
  doc: beat("dokter", "dokter", 3.4),
  // komen
  teamA: beat("komen", "ngupil", 0.8),
  teamB: beat("komen", "tisu", 2.3),
};

/** Tangan kanan ke hidung (ngupil): [mulai, selesai]. */
export const PICKS: [number, number][] = [
  [BEATS.pick - 0.15, BEATS.caught + 0.25],
  [BEATS.pick2 - 0.1, BEATS.noPick + 0.45],
];

/** Syok (mata melotot, rahang jatuh): [mulai, selesai, kekuatan]. */
export const SHOCK: [number, number, number][] = [
  [BEATS.caught - 0.05, END("hook") - 0.1, 1],
  [BEATS.swallow - 0.05, BEATS.unaware - 0.1, 0.85],
];

export type ZoomTarget = "face" | "nose" | "face2";
/** Zoom macro: [mulai dorong, mulai tarik keluar, target]. */
export const ZOOMS: [number, number, ZoomTarget][] = [
  [BEATS.caught - 0.1, END("hook") - 0.4, "face"],
  [BEATS.lendir - 0.35, END("p2") - 0.35, "nose"],
  [BEATS.swallow - 0.1, BEATS.unaware - 0.1, "face2"],
];
