// Ketukan animasi (detik absolut) yang dipakai bersama scene 3D, overlay, dan SFX.
// Dijangkarkan ke kata narasi lewat `beat()`, jadi ikut bergeser saat voiceover berubah.

import { beat, END, sceneById } from "./script";

const S = (id: Parameters<typeof sceneById>[0]) => sceneById(id).start;

export const BEATS = {
  // hook: sendok bakso naik ke mulut → macro mulut: pipi menggembung "fuuuh"
  lift: beat("hook", "makanan", 0.2),
  blow0: beat("hook", "ditiup", 1.6),
  // ehem: "kata ibu: jangan ditiup!" → kaget
  scold: beat("ehem", "dilarang", 0.9),
  // p1: tiup lagi → macro sendok: kuman ikut napas mendarat; lalu kue ulang tahun + kartu 15×
  blow1: beat("p1", "napas", 0.8),
  germs1: beat("p1", "bakteri", 1.6),
  cake: beat("p1", "studi", 3.2),
  candle: beat("p1", "tiup", 3.6),
  x15: beat("p1", "lima", 5.2),
  // p2: bayi di kursi makan, sendok bayi, macro: kuman gigi berlubang pindah
  baby: beat("p2", "bayi", 1.2),
  germs2: beat("p2", "penyebab", 2.2),
  move2: beat("p2", "pindah", 3.6),
  // p3: hidung merah flu, "ha… CHI!" percikan ke mangkuk
  flu: beat("p3", "flu", 0.7),
  sneeze: beat("p3", "perchikan", 1.6),
  // twist: termometer turun, lalu stempel "+ kuman"
  cool: beat("twist", "dingin", 1.2),
  plus: beat("twist", "kumannya", 2.4),
  // tips
  tick1: beat("tips", "diaduk", 0.6),
  tick2: beat("tips", "disebar", 1.6),
  tick3: beat("tips", "tunggu", 2.8),
  // komen
  teamA: beat("komen", "tiup", 0.8),
  teamB: beat("komen", "sabar", 1.4),
};

/** Tiupan (pipi gembung + napas mengalir): [mulai, selesai]. */
export const BLOWS: [number, number][] = [
  [BEATS.blow0 - 0.15, END("hook") - 0.35],
  [BEATS.blow1 - 0.1, BEATS.germs1 + 0.9],
  [BEATS.candle - 0.1, BEATS.candle + 0.6],
];

/** Sendok di depan mulut: [naik, turun]. */
export const SPOON_UP: [number, number][] = [
  [BEATS.lift, END("hook") - 0.1],
  [S("p1") + 0.1, BEATS.cake - 0.2],
];

export type ZoomTarget = "mouth" | "spoon" | "baby" | "bowl";
/** Zoom macro: [mulai dorong, mulai tarik keluar, target]. */
export const ZOOMS: [number, number, ZoomTarget][] = [
  [BEATS.blow0 - 0.25, END("hook") - 0.45, "mouth"],
  [BEATS.germs1 - 0.3, BEATS.cake - 0.5, "spoon"],
  [BEATS.germs2 - 0.3, END("p2") - 0.45, "baby"],
  [BEATS.sneeze + 0.15, END("p3") - 0.45, "bowl"],
];
