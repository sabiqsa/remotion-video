// Ketukan animasi (detik absolut) yang dipakai bersama scene 3D, overlay, dan SFX.
// Dijangkarkan ke kata narasi lewat `beat()`, jadi ikut bergeser saat voiceover berubah.

import { beat, END } from "./script";

export const BEATS = {
  // hook: nonton horor → tangan ke mulut → macro: gigi kelinci "ting", si kuku menjerit, KRIUK
  scare: beat("hook", "suka", 0.5),
  buck0: beat("hook", "gigitin", 0.9),
  scream0: beat("hook", "kuku", 1.3),
  bite0: beat("hook", "padahal", 2.1),
  // nama
  card: beat("nama", "onikofagia", 1.0),
  people: beat("nama", "sendirian", 2.6),
  // promise: si kuku acungkan 1-2-3
  count1: beat("promise", "ada", 0.8),
  count3: beat("promise", "tiga", 1.2),
  // p1 cemas: loading 99%, stres-meter, gigit
  load: beat("p1", "cemas", 0.7),
  stress: beat("p1", "stres", 1.3),
  bite1: beat("p1", "gigit", 2.4),
  // p2 bosan: jam antre, tangan naik sendiri, "eh?"
  clock: beat("p2", "bosan", 0.6),
  drift: beat("p2", "tangan", 1.4),
  notice: beat("p2", "eh", 3.2),
  // p3 mikir: soal di papan, label harga camilan, kriuk
  think: beat("p3", "mikir", 0.8),
  snack: beat("p3", "camilan", 2.8),
  // bahaya: macro mikroskop kuman, gigi retak
  germs: beat("bahaya", "kuman", 1.0),
  crack: beat("bahaya", "retak", 3.6),
  // tips
  tick1: beat("tips", "potong", 0.5),
  tick2: beat("tips", "kutek", 1.8),
  tick3: beat("tips", "squishy", 3.6),
  // serius
  calm: beat("serius", "nggak", 2.4),
  // komen
  teamA: beat("komen", "horor", 2.2),
  teamB: beat("komen", "nunggu", 2.8),
  teamC: beat("komen", "mikir", 3.4),
};

/** Gigitan (gigi kelinci keluar + jari di mulut): [mulai, selesai]. */
export const BITES: [number, number][] = [
  [BEATS.buck0 - 0.2, END("hook") - 0.2],
  [BEATS.bite1 - 0.25, END("p1") - 0.2],
  [BEATS.notice - 0.35, BEATS.notice + 0.15],
  [BEATS.snack - 0.3, END("p3") - 0.2],
];

/** Zoom macro: [mulai dorong, mulai tarik keluar, target]. */
export const ZOOMS: [number, number, "mouth" | "germ"][] = [
  [BEATS.buck0 - 0.1, END("hook") - 0.45, "mouth"],
  [BEATS.snack - 0.15, END("p3") - 0.35, "mouth"],
  [BEATS.germs - 0.15, BEATS.crack - 0.4, "germ"],
];

/** Stres-meter 0..1 */
export const STRESS: [number, number][] = [
  [BEATS.stress, 0.9],
  [BEATS.bite1 + 0.3, 0.45],
  [END("p1") - 0.2, 0],
];
