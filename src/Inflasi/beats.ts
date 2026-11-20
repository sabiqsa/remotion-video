// Ketukan animasi (detik absolut) yang dipakai bersama scene 3D, overlay, dan SFX.
// Dijangkarkan ke kata narasi lewat `beat()`, jadi ikut bergeser saat voiceover berubah.

import { beat, END } from "./script";

export const BEATS = {
  // hook: ambil mie → label 3.000 berputar jadi 3.500 → dolly zoom wajah syok → "padahal gaji…"
  grab: beat("hook", "harga", 0.3),
  hike0: beat("hook", "naik", 1.1),
  shock0: beat("hook", "terus", 1.45),
  sigh0: beat("hook", "padahal", 2.6),
  // ehem: stempel inflasi
  infl: beat("ehem", "inflasi", 0.9),
  three: beat("ehem", "tiga", 1.8),
  // p1: rak mengosong satu per satu → harga naik
  demand: beat("p1", "permintaan", 0.6),
  crowd: beat("p1", "banyak", 1.6),
  limit: beat("p1", "terbatas", 2.8),
  hike1: beat("p1", "harganya", 3.6),
  // p2: macro label → chip biaya jatuh menumpuk → harga membengkak
  cost: beat("p2", "biaya", 0.6),
  fuel: beat("p2", "bensin", 1.8),
  raw: beat("p2", "bahan", 2.4),
  wage: beat("p2", "upah", 3.1),
  hike2: beat("p2", "menaikkan", 4.2),
  // p3: uang di meja bertambah, keranjang mengecil, meter nilai uang turun
  money: beat("p3", "uang", 0.7),
  more: beat("p3", "bertambah", 1.6),
  goods: beat("p3", "barang", 3.0),
  drop: beat("p3", "turun", 4.6),
  // twist: kalender 2026 → 2036, kartu data, syok kedua di "sepertiga"
  value: beat("twist", "nilai", 1.2),
  pct: beat("twist", "inflasi", 2.6),
  years: beat("twist", "sepuluh", 3.8),
  third: beat("twist", "sepertiga", 5.6),
  // tips
  tick1: beat("tips", "kebutuhan", 0.9),
  tick2: beat("tips", "inflasi", 2.8),
  tick3: beat("tips", "skill", 4.4),
  // komen
  teamA: beat("komen", "jajan", 1.0),
  teamB: beat("komen", "berapa", 1.6),
};

/** Syok (mata melotot, rahang jatuh): [mulai, selesai, kekuatan]. */
export const SHOCK: [number, number, number][] = [
  [BEATS.shock0 - 0.05, BEATS.sigh0 + 0.1, 1],
  [BEATS.hike1 - 0.05, BEATS.hike1 + 1.0, 0.55],
  [BEATS.third - 0.05, END("twist") - 0.1, 1],
];

/** Stres (alis khawatir + keringat): [mulai, selesai, kekuatan]. */
export const STRESS: [number, number, number][] = [
  [BEATS.sigh0, END("hook") - 0.05, 0.9],
  [BEATS.fuel, END("p2") - 0.1, 0.9],
  [BEATS.drop - 0.1, END("p3") - 0.1, 0.7],
  [BEATS.value, BEATS.third - 0.05, 0.7],
];

/** Label harga mie (harga nyata): ±Rp3.500 → Rp4.000 per bungkus di minimarket (dilaporkan Nov 2026). */
export const PRICES: [number, number][] = [
  [0, 3500],
  [BEATS.hike0, 4000],
];
/** Pertalite per liter: Rp7.650 → Rp10.000 (naik 3 Sep 2022, masih Rp10.000 per Nov 2026). */
export const PERTALITE: [number, number] = [7650, 10000];

export type ZoomTarget = "face" | "tag" | "face2";
/** Zoom macro: [mulai dorong, mulai tarik keluar, target]. "face" = dolly zoom (vertigo). */
export const ZOOMS: [number, number, ZoomTarget][] = [
  [BEATS.hike0 - 0.15, BEATS.sigh0 + 0.5, "face"],
  [BEATS.fuel - 0.3, BEATS.hike2 + 0.9, "tag"],
  [BEATS.third - 0.2, END("twist") - 0.45, "face2"],
];
