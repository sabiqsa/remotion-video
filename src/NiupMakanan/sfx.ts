// Daftar efek suara (dipisah dari komponen supaya bisa dicek terukur tanpa React).
import { BEATS } from "./beats";

/** Efek suara: [detik, file, volume]. Puncak file −6 dBFS; narasi di-duck saat efek berbunyi. */
export const SFX: [number, string, number][] = [
  [0.05, "steam", 0.35],
  [BEATS.lift, "whoosh", 0.3],
  [BEATS.blow0 - 0.25, "whoosh", 0.3],
  [BEATS.blow0, "blow", 0.7],
  [BEATS.scold, "boing", 0.5],
  [BEATS.blow1, "blow", 0.55],
  [BEATS.germs1 - 0.3, "whoosh", 0.3],
  [BEATS.germs1 + 0.2, "pop", 0.6],
  [BEATS.cake, "pop", 0.7],
  [BEATS.candle, "blow", 0.6],
  [BEATS.x15, "tick", 0.6],
  [BEATS.baby, "pop", 0.6],
  [BEATS.germs2 - 0.3, "whoosh", 0.3],
  [BEATS.germs2 + 0.2, "ding", 0.4],
  [BEATS.move2 + 0.3, "boing", 0.45],
  [BEATS.flu, "pop", 0.5],
  [BEATS.sneeze - 0.36, "sneeze", 0.42],
  [BEATS.sneeze + 0.15, "whoosh", 0.3],
  [BEATS.cool, "steam", 0.35],
  [BEATS.plus, "boing", 0.32],
  [BEATS.tick1, "click", 0.9],
  [BEATS.tick2, "click", 0.9],
  [BEATS.tick3, "click", 0.9],
  [BEATS.tick3 + 0.05, "ding", 0.4],
  [BEATS.teamA, "click", 0.9],
  [BEATS.teamB, "click", 0.9],
];
