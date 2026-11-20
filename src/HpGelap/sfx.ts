// Daftar efek suara (dipisah dari komponen supaya bisa dicek terukur tanpa React).
import { BEATS } from "./beats";

/** Efek suara: [detik, file, volume]. Puncak file −6 dBFS; narasi di-duck saat efek berbunyi. */
export const SFX: [number, string, number][] = [
  [BEATS.off, "switch", 1.0], // saklar lampu "tek" (remotion.media/switch.wav)
  [BEATS.off + 0.05, "whoosh", 0.2],
  [BEATS.minus0, "sting", 0.5],
  [BEATS.glasses, "pop", 0.5],
  [BEATS.myth, "thud", 0.55],
  [BEATS.three, "ding", 0.3],
  [BEATS.pupil - 0.35, "whoosh", 0.25],
  [BEATS.dilate, "squish", 0.35],
  [BEATS.bright, "glint", 0.45],
  [BEATS.tired, "huff", 0.4],
  [BEATS.blink, "tick", 0.5],
  [BEATS.dry, "drip", 0.4],
  [BEATS.sting, "twitch", 0.35],
  [BEATS.sleep, "tick", 0.45],
  [BEATS.light, "glint", 0.35],
  [BEATS.mela, "boing", 0.35],
  [BEATS.tilt, "srek", 0.45],
  [BEATS.pillow, "thud", 0.35],
  [BEATS.blind, "switch", 1.0], // lampu dinyalakan
  [BEATS.blind + 0.05, "sting", 0.5],
  [BEATS.mins, "ding", 0.3],
  [BEATS.tick1, "click", 0.7],
  [BEATS.tick2, "click", 0.7],
  [BEATS.tick3, "click", 0.7],
  [BEATS.tick3 + 0.05, "ding", 0.35],
  [BEATS.teamA, "click", 0.9],
  [BEATS.teamB, "click", 0.9],
];
