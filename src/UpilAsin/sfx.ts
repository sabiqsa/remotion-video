// Daftar efek suara (dipisah dari komponen supaya bisa dicek terukur tanpa React).
import { BEATS } from "./beats";

/** Efek suara: [detik, file, volume]. Puncak file −6 dBFS; narasi di-duck saat efek berbunyi. */
export const SFX: [number, string, number][] = [
  [BEATS.pick, "srek", 0.35],
  [BEATS.caught, "sting", 0.5],
  [BEATS.caught + 0.03, "whoosh", 0.2],
  [BEATS.drop, "drip", 0.45],
  [BEATS.dry, "crunch", 0.35],
  [BEATS.water, "squish", 0.3],
  [BEATS.musin, "pop", 0.35],
  [BEATS.protein, "pop", 0.35],
  [BEATS.salt, "glint", 0.45],
  [BEATS.lendir - 0.35, "whoosh", 0.25],
  [BEATS.flow, "slurp", 0.35],
  [BEATS.dust, "whoosh", 0.25],
  [BEATS.stick, "squish", 0.35],
  [BEATS.enzim, "ding", 0.3],
  [BEATS.eh, "boing", 0.3],
  [BEATS.swallow, "slurp", 0.45],
  [BEATS.swallow + 0.05, "sting", 0.4],
  [BEATS.noPick, "buzz", 0.35],
  [BEATS.bleed, "drip", 0.4],
  [BEATS.tick1, "click", 0.7],
  [BEATS.tick2, "click", 0.7],
  [BEATS.doc, "ding", 0.3],
  [BEATS.teamA, "click", 0.9],
  [BEATS.teamB, "click", 0.9],
];
