// Tipe & helper voiceover (ElevenLabs, timestamp per kata).
// Data dibuat oleh scripts/make_voiceover.mjs ke <video>/vo.generated.ts.

export type VoWord = { word: string; start: number; end: number };
export type VoClip = { file: string; duration: number; words: VoWord[] };

/** detik dari awal scene sampai suara mulai */
export const VO_LEAD = 0.15;
/** jeda setelah suara selesai sebelum scene berganti */
export const VO_TAIL = 0.45;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Waktu (detik, relatif ke awal klip) saat `word` mulai diucapkan.
 * Mencari kemunculan pertama setelah `after` detik. null bila tidak ketemu.
 */
export const wordTime = (clip: VoClip | undefined, word: string, after = 0): number | null => {
  if (!clip) return null;
  const target = norm(word);
  const hit = clip.words.find((w) => w.start >= after && norm(w.word).startsWith(target));
  return hit ? hit.start : null;
};

/** Durasi scene yang cukup untuk suaranya (minimal `base`). */
export const sceneDurationFor = (clip: VoClip | undefined, base: number) =>
  clip ? Math.max(base, VO_LEAD + clip.duration + VO_TAIL) : base;
