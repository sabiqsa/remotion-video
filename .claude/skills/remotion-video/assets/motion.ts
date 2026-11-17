// Helper gerak anti-generik untuk Remotion.
// Prinsip: setiap gerakan punya awal, akhir, lalu DIAM. Tidak ada idle loop
// berbasis Math.sin(frame) (bobbing/floating/orbit ala screensaver).
// Semua waktu ditulis dalam DETIK lalu dikonversi ke frame, supaya aman di 60fps.

import { Easing, interpolate } from "remotion";

export const EASE = {
  /** Keluar cepat, mendarat halus. Default untuk elemen masuk. */
  out: Easing.bezier(0.16, 1, 0.3, 1),
  /** Untuk perpindahan kamera / transisi antar posisi. */
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  /** Akselerasi untuk elemen keluar. */
  in: Easing.bezier(0.7, 0, 0.84, 0),
  /** Sedikit overshoot, pakai hemat untuk aksen. */
  back: Easing.bezier(0.34, 1.56, 0.64, 1),
} as const;

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Detik -> frame. */
export const sec = (s: number, fps: number) => Math.round(s * fps);

/** Progres 0..1 dari `start` selama `dur` frame, dengan easing, lalu tertahan di 1. */
export const prog = (
  frame: number,
  start: number,
  dur: number,
  ease: (t: number) => number = EASE.out,
) => interpolate(frame, [start, start + Math.max(1, dur)], [0, 1], { ...CLAMP, easing: ease });

/**
 * Amplop masuk -> diam -> keluar. Menghasilkan 0..1.
 * Di antara masuk dan keluar nilainya tepat 1 (benar-benar diam).
 */
export const envelope = (
  frame: number,
  o: { inAt: number; inDur: number; outAt: number; outDur: number },
) => {
  const a = prog(frame, o.inAt, o.inDur, EASE.out);
  const b = 1 - prog(frame, o.outAt, o.outDur, EASE.in);
  return Math.min(a, b);
};

/**
 * "Punch" skala pada sebuah ketukan: naik cepat lalu kembali ke 1 dan diam.
 * Pakai untuk menekankan kata kunci / angka, bukan sebagai loop.
 */
export const punch = (frame: number, at: number, fps: number, amount = 0.08) => {
  const up = sec(0.06, fps);
  const down = sec(0.28, fps);
  if (frame < at || frame > at + up + down) return 1;
  if (frame <= at + up) return 1 + amount * prog(frame, at, up, EASE.out);
  return 1 + amount * (1 - prog(frame, at + up, down, EASE.out));
};

/**
 * Gerak bertahap (staccato): nilai hanya berubah `steps` kali per detik.
 * Bagus untuk counter, ikon "ticking", atau gaya stop-motion.
 */
export const stepped = (frame: number, fps: number, steps = 12) => {
  const every = Math.max(1, Math.round(fps / steps));
  return Math.floor(frame / every) * every;
};

/**
 * Kamera/objek yang berpindah antar "pose" pada ketukan tertentu, lalu diam.
 * keys: daftar { at (frame), value }. Transisi pakai EASE.inOut selama `dur` frame.
 */
export const holdTo = (
  frame: number,
  keys: { at: number; value: number }[],
  dur: number,
) => {
  let v = keys[0].value;
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    const p = prog(frame, k.at, dur, EASE.inOut);
    v = v + (k.value - v) * p;
  }
  return v;
};
