// Ketukan animasi (detik absolut) yang dipakai bersama scene 3D, overlay, dan SFX.
// Dijangkarkan ke kata narasi lewat `beat()`, jadi ikut bergeser saat voiceover berubah.

import { beat, END, sceneById } from "./script";

const S = (id: Parameters<typeof sceneById>[0]) => sceneById(id).start;

export const BEATS = {
  // hook: perut keroncongan → notifikasi laptop → macro wajah marah 💢 + uap kepala → "tenang"
  growl0: beat("hook", "lapar", 0.5),
  angry0: beat("hook", "gampang", 1.6),
  calm0: beat("hook", "tenang", 2.6),
  // ehem: keroncongan lagi, pegang perut, jam 13.30
  growl1: beat("ehem", "penjelasan", 0.9),
  // p1: meter gula darah turun → macro kepala: baterai otak → rem kesabaran melemah
  sugar: beat("p1", "gula", 0.7),
  brain: beat("p1", "otak", 2.2),
  brake: beat("p1", "rem", 4.2),
  weak: beat("p1", "melemah", 5.4),
  // p2: badge hormon pop di dada + jantung berdebar → "tersulut": meledak sekali
  cort: beat("p2", "kortisol", 1.3),
  adren: beat("p2", "adrenalin", 2.1),
  snap: beat("p2", "tersulut", 5.4),
  // p3: kalender meja muncul → macro kalender 1 → 21 hari → kartu data
  study: beat("p3", "penelitian", 0.8),
  during: beat("p3", "selama", 2.6),
  days: beat("p3", "hari", 3.8),
  data: beat("p3", "rasa", 4.4, 3.5),
  third: beat("p3", "sepertiga", 5.6),
  // twist: kotak bekal dibuka → gigit onigiri (macro) → wajah adem
  open: beat("twist", "jadi", 0.2),
  bite: beat("twist", "perutmu", 1.5),
  relief: beat("twist", "bukan", 2.4),
  // tips
  tick1: beat("tips", "chamilan", 0.6),
  tick2: beat("tips", "teratur", 1.6),
  tick3: beat("tips", "sadari", 2.6),
  // komen
  teamA: beat("komen", "diam", 0.9),
  teamB: beat("komen", "ngamuk", 1.6),
};

/** Marah (alis menukik, wajah merah, 💢): [mulai, selesai, kekuatan]. */
export const ANGER: [number, number, number][] = [
  [BEATS.angry0 - 0.05, BEATS.calm0 + 0.1, 1],
  [BEATS.weak - 0.1, END("p1") - 0.1, 0.6],
  [BEATS.snap - 0.05, END("p2") - 0.1, 1],
  [BEATS.data, BEATS.bite - 0.1, 0.45],
];

/** Uap marah dari kepala (sekali per ledakan). */
export const STEAMS = [BEATS.angry0 + 0.05, BEATS.snap + 0.05];

/** Perut keroncongan: cincin bunyi dari perut. */
export const GROWLS = [BEATS.growl0, BEATS.growl1];

export type ZoomTarget = "face" | "head" | "calendar" | "bite";
/** Zoom macro: [mulai dorong, mulai tarik keluar, target]. */
export const ZOOMS: [number, number, ZoomTarget][] = [
  [BEATS.angry0 - 0.2, BEATS.calm0 + 0.15, "face"],
  [BEATS.brain - 0.25, BEATS.weak + 0.6, "head"],
  [BEATS.during - 0.2, BEATS.data - 0.35, "calendar"],
  [BEATS.bite - 0.35, END("twist") - 0.45, "bite"],
];

export { S };
