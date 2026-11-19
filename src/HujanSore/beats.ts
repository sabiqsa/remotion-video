// Ketukan animasi (detik absolut) yang dipakai bersama scene 3D, overlay, dan SFX.
// Dijangkarkan ke kata narasi lewat `beat()`, jadi ikut bergeser saat voiceover berubah.

import { beat, sceneById } from "./script";

const S = (id: Parameters<typeof sceneById>[0]) => sceneById(id).start;

export const BEATS = {
  // hook: santai berjemur → tetes pertama → guyuran
  drip: beat("hook", "banget", 3.3) + 0.3,
  pour0: beat("hook", "banget", 3.3) + 0.6,
  badge: beat("kerja", "jam", 2.0),
  steps: beat("promise", "tiga", 1.3),
  sun: beat("p1", "matahari", 1.3),
  heat: beat("p1", "manasin", 1.8),
  rise: beat("p2", "naik", 2.2),
  cold: beat("p2", "dingin", 3.5),
  condense: beat("p2", "ngembun", 4.2),
  stack1: beat("p3", "numpuk", 1.3),
  stack2: beat("p3", "berjam", 1.7),
  laundry: beat("p3", "cucian", 2.8),
  full: beat("p3", "kepenuhan", 4.3),
  pour: beat("p3", "tumpah", 5.0),
  barSore: beat("data", "memuncak", 3.4),
  barPagi: beat("data", "jarang", 4.8),
  malam: beat("tapi", "malam", 2.5),
  dini: beat("tapi", "dini", 3.2),
  umbrella: beat("tips", "payung", 2.0),
  serious: S("serius") + 0.05,
  bolt: beat("serius", "petir", 1.4),
  teamA: beat("komen", "hujannya", 0.7),
  teamB: beat("komen", "berapa", 1.5),
};

/** guyuran hujan: [mulai, selesai] — hujan turun sekali per kejadian, lalu reda */
export const RAINS: [number, number][] = [
  [BEATS.pour0, sceneById("kerja").start + 0.6],
  [BEATS.pour, sceneById("p3").start + sceneById("p3").duration + 0.1],
];
