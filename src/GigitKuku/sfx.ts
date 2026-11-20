// Daftar efek suara (dipisah dari komponen supaya bisa dicek terukur tanpa React).
import { BEATS } from "./beats";
import { CRUNCHES } from "./Scene3D";

/** Efek suara: [detik, file, volume]. Puncak file −6 dBFS; narasi di-duck saat efek berbunyi. */
export const SFX: [number, string, number][] = [
  [BEATS.scare, "thud", 0.5],
  [BEATS.buck0, "glint", 0.5],
  [BEATS.scream0, "boing", 0.45],
  ...CRUNCHES.map((c) => [c, "crunch", 0.75] as [number, string, number]),
  [BEATS.card, "pop", 0.8],
  [BEATS.people, "tick", 0.6],
  [BEATS.count1, "pop", 0.6],
  [BEATS.count3, "pop", 0.7],
  [BEATS.load, "tick", 0.6],
  [BEATS.stress, "boing", 0.45],
  [BEATS.clock, "tick", 0.7],
  [BEATS.drift, "whoosh", 0.35],
  [BEATS.notice, "boing", 0.5],
  [BEATS.think, "pop", 0.6],
  [BEATS.snack - 0.15, "whoosh", 0.35],
  [BEATS.germs - 0.15, "whoosh", 0.35],
  [BEATS.germs, "pop", 0.6],
  [BEATS.germs + 0.6, "ding", 0.4],
  [BEATS.crack, "crunch", 0.6],
  [BEATS.tick1, "click", 0.9],
  [BEATS.tick2, "click", 0.9],
  [BEATS.tick3, "click", 0.9],
  [BEATS.tick3 + 0.02, "squish", 0.7],
  [BEATS.calm, "ding", 0.4],
  [BEATS.teamA, "click", 0.9],
  [BEATS.teamB, "click", 0.9],
  [BEATS.teamC, "click", 0.9],
];
