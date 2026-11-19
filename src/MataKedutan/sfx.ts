// Daftar efek suara (dipisah dari komponen supaya bisa dicek terukur tanpa React).
import { BEATS, TWITCH_BURSTS } from "./beats";

/** Efek suara: [detik, file, volume]. Puncak file −6 dBFS; narasi di-duck saat efek berbunyi. */
export const SFX: [number, string, number][] = [
  // kedut: tiap 3 kedut = satu file "twitch" (dug-dug-dug)
  ...TWITCH_BURSTS.flatMap(([at, n]) =>
    Array.from({ length: Math.ceil(n / 3) }, (_, i) => [at + i * 0.33, "twitch", 0.75] as [number, string, number]),
  ),
  [BEATS.reveal, "whoosh", 0.6],
  [BEATS.coin, "coin", 0.6],
  [BEATS.coinDrop + 0.32, "thud", 0.6],
  [BEATS.kiri, "whoosh", 0.4],
  [BEATS.wallet, "srek", 0.6],
  [BEATS.wallet + 0.3, "boing", 0.55],
  [BEATS.quiz + 0.1, "pop", 0.7],
  [BEATS.hover, "tick", 0.6],
  [BEATS.tapB, "click", 0.9],
  [BEATS.tapB + 0.08, "ding", 0.5],
  [BEATS.clock, "tick", 0.7],
  [BEATS.buzz1, "buzz", 0.35],
  [BEATS.cup1, "pop", 0.7],
  [BEATS.cup2, "pop", 0.7],
  [BEATS.cup3, "pop", 0.7],
  [BEATS.cup4, "pop", 0.8],
  [BEATS.zap, "whoosh", 0.5],
  [BEATS.notif1, "pop", 0.7],
  [BEATS.notif2, "pop", 0.7],
  [BEATS.notif3, "pop", 0.7],
  [BEATS.dry, "whoosh", 0.4],
  [BEATS.name, "pop", 0.8],
  [BEATS.calm, "ding", 0.5],
  [BEATS.morning, "whoosh", 0.4],
  [BEATS.tick1, "click", 0.9],
  [BEATS.tick2, "click", 0.9],
  [BEATS.tick3, "click", 0.9],
  [BEATS.cal, "tick", 0.6],
  [BEATS.doc, "pop", 0.8],
  [BEATS.teamL, "click", 0.9],
  [BEATS.teamR, "click", 0.9],
];
