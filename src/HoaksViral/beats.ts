// Ketukan animasi (detik absolut) yang dipakai bersama scene 3D, overlay, dan SFX.
// Dijangkarkan ke kata narasi lewat `beat()`, jadi ikut bergeser saat voiceover berubah.

import { beat, END, sceneById } from "./script";

const S = (id: Parameters<typeof sceneById>[0]) => sceneById(id).start;

export const BEATS = {
  // hook: roket HOAKS melesat, FAKTA masih ngiket tali sepatu
  rocket: beat("hook", "hoaks", 0.5),
  race: beat("hook", "faktanya", 2.6),
  // ehem: macro ke kacamata, dorong kacamata, kilau
  ehem: S("ehem") + 0.05,
  glint: beat("ehem", "ini", 0.9),
  smart: beat("ehem", "penelitiannya", 1.3),
  // data
  count: beat("data", "seratus", 1.0),
  barFakta: beat("data", "hoaks", 3.2),
  barHoaks: beat("data", "tujuh", 3.6),
  // cepat: balapan ke 1.500 orang
  runA: beat("cepat", "fakta", 0.2),
  finish: beat("cepat", "enam", 1.6),
  // p1..p3
  baru: beat("p1", "baru", 1.6),
  otak: beat("p1", "otak", 2.8),
  kaget: beat("p2", "kaget", 1.6),
  jijik: beat("p2", "jijik", 2.2),
  share: beat("p2", "dibagi", 3.8),
  bot: beat("p3", "bot", 2.2),
  point: beat("p3", "iya", 3.0),
  kita: beat("p3", "kita", 3.4),
  // twist: notifikasi BREAKING, kursor ke "teruskan", berhenti
  notif: S("twist") + 0.1,
  hover: beat("twist", "tunggu", 0.8),
  stop: beat("twist", "kayak", 1.7),
  // tips: cap HOAKS, checklist
  stamp: S("tips") + 0.25,
  tick1: beat("tips", "sumbernya", 1.6),
  tick2: beat("tips", "tanggalnya", 2.6),
  tick3: beat("tips", "situs", 3.8),
  // komen
  teamA: beat("komen", "ketipu", 0.9),
  teamB: beat("komen", "tulis", 2.2),
};

/** Zoom macro ke lensa kiri: [mulai dorong, mulai tarik keluar]. */
export const ZOOMS: [number, number][] = [
  [BEATS.ehem, END("ehem") - 0.25],
  [BEATS.stop - 0.1, END("twist") - 0.2],
];

/** Ruangan redup dramatis saat twist. */
export const DIM: [number, number] = [BEATS.notif - 0.05, sceneById("tips").start + 0.1];
