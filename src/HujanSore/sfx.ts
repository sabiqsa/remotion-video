// Daftar efek suara (dipisah dari komponen supaya bisa dicek terukur tanpa React).
import { BEATS } from "./beats";

/** Efek suara komedi: [detik, file, volume]. Puncak file −6 dBFS; narasi di-duck saat efek berbunyi. */
export const SFX: [number, string, number][] = [
  [BEATS.drip, "drip", 0.9],
  [BEATS.pour0, "rain", 0.3],
  [BEATS.badge, "pop", 0.8],
  [BEATS.steps, "pop", 0.7],
  [BEATS.sun, "pop", 0.8],
  [BEATS.heat, "whoosh", 0.6],
  [BEATS.rise, "whoosh", 0.6],
  [BEATS.cold, "tick", 0.7],
  [BEATS.condense, "pop", 0.8],
  [BEATS.stack1, "pop", 0.7],
  [BEATS.stack2, "pop", 0.7],
  [BEATS.laundry, "boing", 0.6],
  [BEATS.full, "burp", 0.6],
  [BEATS.pour, "rain", 0.3],
  [BEATS.barSore, "pop", 0.8],
  [BEATS.barPagi, "pop", 0.7],
  [BEATS.malam, "pop", 0.7],
  [BEATS.dini, "pop", 0.7],
  [BEATS.umbrella, "boing", 0.7],
  [BEATS.bolt, "thunder", 0.5],
  [BEATS.teamA, "pop", 0.8],
  [BEATS.teamB, "pop", 0.8],
];
