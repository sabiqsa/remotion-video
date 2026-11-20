// Daftar efek suara (dipisah dari komponen supaya bisa dicek terukur tanpa React).
import { BEATS } from "./beats";

/** Efek suara: [detik, file, volume]. Puncak file −6 dBFS; narasi di-duck saat efek berbunyi. */
export const SFX: [number, string, number][] = [
  [BEATS.rocket, "rocket", 0.55],
  [BEATS.race, "boing", 0.5],
  [BEATS.ehem, "whoosh", 0.4],
  [BEATS.glint, "glint", 0.6],
  [BEATS.smart, "pop", 0.7],
  [BEATS.count, "tick", 0.6],
  [BEATS.barFakta, "pop", 0.6],
  [BEATS.barHoaks, "pop", 0.8],
  [BEATS.runA, "whoosh", 0.3],
  [BEATS.finish, "ding", 0.5],
  [BEATS.baru, "pop", 0.8],
  [BEATS.otak, "tick", 0.6],
  [BEATS.kaget, "boing", 0.5],
  [BEATS.jijik, "burp", 0.5],
  [BEATS.share, "pop", 0.8],
  [BEATS.bot, "tick", 0.6],
  [BEATS.kita, "boing", 0.5],
  [BEATS.notif, "buzz", 0.3],
  [BEATS.stop, "thud", 0.5],
  [BEATS.stop - 0.1, "whoosh", 0.35],
  [BEATS.stamp, "thud", 0.7],
  [BEATS.tick1, "click", 0.9],
  [BEATS.tick2, "click", 0.9],
  [BEATS.tick3, "click", 0.9],
  [BEATS.teamA, "click", 0.9],
  [BEATS.teamB, "click", 0.9],
];
