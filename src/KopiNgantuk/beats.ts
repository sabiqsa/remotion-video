// Ketukan animasi (detik absolut) yang dipakai bersama scene 3D, overlay, dan SFX.
// Dijangkarkan ke kata narasi lewat `beat()`, jadi ikut bergeser saat voiceover masuk.

import { beat, sceneById } from "./script";

const S = (id: Parameters<typeof sceneById>[0]) => sceneById(id).start;

export const BEATS = {
  sip: beat("hook", "sruput", 1.3),
  slump: beat("hook", "ngantuk", 2.9) - 0.1,
  ratingStamp: beat("rating", "satu", 1.0),
  promiseRelief: beat("promise", "ternyata", 0.3) + 0.3,
  guard: beat("p1", "kafein", 1.4),
  rush: beat("p1", "habis", 4.2),
  borongan: beat("p1", "borongan", 4.9),
  battery: beat("p2", "kurang", 0.4),
  kasur: beat("p2", "bukan", 2.0),
  cyc1: beat("siklus", "sore", 0.9),
  cyc2: beat("siklus", "tidur", 1.6),
  cyc3: beat("siklus", "besoknya", 2.3),
  spin: beat("siklus", "muter", 3.6),
  cups: beat("p3", "rutin", 1.6),
  zeroSugar: beat("p4", "americano", 3.2),
  sachet: beat("p4", "tiga", 4.3),
  dna: beat("p5", "gen", 0.6),
  clock: beat("tips", "efek", 1.0),
  serious: S("serius") + 0.05,
  stars: beat("ulang", "empat", 1.0),
  highFive: beat("ulang", "asal", 2.0),
  teamA: beat("komen", "americano", 1.0),
  teamB: beat("komen", "susu", 2.0),
};

/** waktu tiap bintang tambahan menyala di "rating ulang" */
export const STAR_TIMES = [0, 1, 2].map((i) => BEATS.stars + 0.05 + i * 0.16);

