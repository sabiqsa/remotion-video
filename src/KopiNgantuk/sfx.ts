// Daftar efek suara (dipisah dari komponen supaya bisa dicek terukur tanpa React).
import { BEATS, STAR_TIMES } from "./beats";

export /** Efek suara komedi: [detik, file, volume]. Puncak file −6 dBFS; narasi di-duck saat efek berbunyi. */
const SFX: [number, string, number][] = [
  [BEATS.sip - 0.5, "pop", 0.7],
  [BEATS.sip, "slurp", 0.85],
  [BEATS.slump + 0.28, "thud", 1],
  [BEATS.ratingStamp, "thud", 0.85],
  [BEATS.ratingStamp + 0.05, "pop", 0.8],
  [BEATS.promiseRelief, "pop", 0.7],
  [BEATS.guard, "pop", 0.8],
  [BEATS.rush - 0.05, "whoosh", 1],
  [BEATS.borongan, "boing", 0.85],
  ...[0, 1].map((i): [number, string, number] => [BEATS.battery + i * 0.35, "tick", 0.8]),
  [BEATS.kasur, "pop", 0.75],
  [BEATS.cyc1, "pop", 0.7],
  [BEATS.cyc2, "pop", 0.7],
  [BEATS.cyc3, "pop", 0.7],
  [BEATS.spin, "boing", 0.6],
  ...[0, 1].map((i): [number, string, number] => [BEATS.cups + i * 0.25, "pop", 0.75]),
  [BEATS.zeroSugar, "pop", 0.8],
  ...[0, 1, 2].map((i): [number, string, number] => [BEATS.sachet + i * 0.25, "srek", 0.7]),
  [BEATS.dna, "pop", 0.75],
  [BEATS.clock, "pop", 0.7],
  [BEATS.serious + 0.3, "thud", 0.7],
  ...STAR_TIMES.map((at): [number, string, number] => [at, "pop", 0.8]),
  [BEATS.highFive + 0.2, "ding", 0.4],
  [BEATS.teamA, "pop", 0.8],
  [BEATS.teamB, "pop", 0.8],
];
