// Ketukan animasi (detik absolut) yang dipakai bersama scene 3D, overlay, dan SFX.
// Dijangkarkan ke kata narasi lewat `beat()`, jadi ikut bergeser saat voiceover berubah.

import { beat, END, sceneById } from "./script";

const S = (id: Parameters<typeof sceneById>[0]) => sceneById(id).start;

export const BEATS = {
  // hook: macro mata → kedut ×3 → zoom out (reveal kamar jam 2) → koin rezeki → menguap
  twitch0: beat("hook", "kedutan", 0.55),
  reveal: beat("hook", "pertanda", 1.3),
  coin: beat("hook", "rezeki", 1.9),
  coinDrop: beat("hook", "atau", 2.7),
  yawn: beat("hook", "tidur", 3.6),
  // mitos: push ke mata kiri saat "kiri", dompet dibuka saat "cuan" → kosong, debu
  kiri: beat("mitos", "kiri", 1.1),
  wallet: beat("mitos", "cuan", 2.4),
  // promise: kuis A/B, kursor ragu di A lalu tap B
  quiz: S("promise") + 0.25,
  hover: beat("promise", "mana", 1.0),
  tapB: beat("promise", "sains", 1.9),
  three: beat("promise", "tiga", 2.8),
  // p1 kurang tidur
  clock: beat("p1", "kurang", 0.6),
  buzz1: beat("p1", "tidur", 1.0) + 0.15,
  bags: beat("p1", "otot", 1.6),
  tw1: beat("p1", "kedutan", 3.6),
  // p2 kafein: gelas menumpuk 1..4 → kesetrum (push + kedut cepat)
  cup1: beat("p2", "kebanyakan", 0.7),
  cup2: beat("p2", "kafein", 1.3),
  cup3: beat("p2", "kopi", 2.3),
  cup4: beat("p2", "stimulan", 3.0),
  zap: beat("p2", "kesetrum", 3.9),
  // p3 stres & layar: notifikasi menumpuk, mata kering → push + kedut
  notif1: beat("p3", "stres", 0.9),
  notif2: beat("p3", "layar", 2.1),
  notif3: beat("p3", "matanya", 2.8),
  dry: beat("p3", "kering", 3.6),
  // fakta
  name: beat("fakta", "miokimia", 0.9),
  calm: beat("fakta", "hilang", 2.6),
  // tips: pagi datang, checklist dicentang kursor
  morning: S("tips") + 0.05,
  tick1: beat("tips", "tidur", 0.6),
  tick2: beat("tips", "kurangi", 1.6),
  tick3: beat("tips", "istirahatin", 2.6),
  // serius
  serious: S("serius") + 0.05,
  cal: beat("serius", "dua", 1.0),
  doc: beat("serius", "dokter", 4.5),
  // komen: tombol tim ditap bergantian
  teamL: beat("komen", "kiri", 1.4),
  teamR: beat("komen", "kanan", 1.8),
};

/** Kedut kelopak kiri: [detik, kali]. Jarak 0.11 dtk = sama dengan ketukan file sfx "twitch"
 *  (3 ketukan per file). Tiap kedut = sempit 0.03 dtk → buka 0.09 dtk. */
export const TWITCH_GAP = 0.11;
export const TWITCH_BURSTS: [number, number][] = [
  [BEATS.twitch0, 3],
  [BEATS.kiri + 0.32, 3],
  [BEATS.tw1, 3],
  [BEATS.zap + 0.3, 6],
  [BEATS.dry + 0.3, 3],
];
export const TWITCHES: number[] = TWITCH_BURSTS.flatMap(([at, n]) => Array.from({ length: n }, (_, i) => at + i * TWITCH_GAP));

/** Zoom macro ke mata: [mulai dorong, mulai tarik keluar, geser mata dx, dy, dz]. Hook dimulai
 *  sudah di macro. Geser = posisi mata yang berpindah karena pose (mis. tersentak ke belakang). */
export const ZOOMS: [number, number, number, number, number][] = [
  [-1, BEATS.reveal, 0, 0, 0],
  [BEATS.kiri, BEATS.kiri + 0.95, 0, 0, 0],
  [BEATS.zap, BEATS.zap + 1.0, 0, 0.058, -0.16],
  [BEATS.dry, END("p3") - 0.35, 0, 0, 0],
];

/** Kedut-meter 0..1 (naik tiap pemicu, turun saat tips). */
export const METER: [number, number][] = [
  [S("p1") + 0.3, 0.34],
  [S("p2") + 0.3, 0.67],
  [BEATS.notif3, 1],
  [BEATS.tick1, 0.66],
  [BEATS.tick2, 0.33],
  [BEATS.tick3, 0.05],
];
