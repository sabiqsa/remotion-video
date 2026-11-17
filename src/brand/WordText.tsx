// Teks gaya caption viral: muncul per kata, huruf kecil, putih, dengan satu
// frasa kunci (*...*) yang diberi blok highlight kuning + punch. Rata tengah.
// Masuk -> diam -> keluar cepat ke atas. Waktu dalam detik.

import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { EASE, punch } from "../lib/motion";

export type LineStyle = "title" | "body" | "note" | "tip";

export type Line = {
  /** Tandai frasa kunci dengan *bintang* untuk highlight kuning. */
  text: string;
  /** detik relatif ke awal Sequence (dipakai bila tidak ada voiceover) */
  at: number;
  style: LineStyle;
  /** kata di narasi; bila ada voiceover, baris muncul tepat saat kata ini diucapkan */
  sync?: string;
};

export const YELLOW = "#FFD400";
export const INK = "#0B0B0C";
export const FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';

const WORD_STAGGER = 0.05;
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const STYLE: Record<LineStyle, React.CSSProperties> = {
  title: { fontSize: 112, fontWeight: 800, letterSpacing: -3, lineHeight: 1.08, color: "#FFFFFF" },
  body: { fontSize: 54, fontWeight: 600, letterSpacing: -0.5, lineHeight: 1.22, color: "#E9ECF5" },
  note: { fontSize: 42, fontWeight: 500, letterSpacing: 0, lineHeight: 1.2, color: "#9EA6C2", fontStyle: "italic" },
  tip: { fontSize: 44, fontWeight: 700, letterSpacing: 0, lineHeight: 1, color: YELLOW },
};

type Token = { text: string; key: boolean };

/** "langsung *ngantuk?*" -> kata biasa + satu token frasa kunci. */
const tokenize = (text: string): Token[] =>
  text
    .split(/(\*[^*]+\*)/)
    .filter(Boolean)
    .flatMap((seg): Token[] =>
      seg.startsWith("*")
        ? [{ text: seg.slice(1, -1), key: true }]
        : seg
            .split(" ")
            .filter(Boolean)
            .map((w) => ({ text: w, key: false })),
    );

const pr = (t: number, start: number, dur: number, ease = EASE.out) =>
  interpolate(t, [start, start + dur], [0, 1], { ...CLAMP, easing: ease });

const WordLine: React.FC<{ line: Line; t: number; frame: number; fps: number }> = ({
  line,
  t,
  frame,
  fps,
}) => {
  const tokens = tokenize(line.text);
  const base = STYLE[line.style];

  if (line.style === "tip") {
    const p = pr(t, line.at, 0.3, EASE.back);
    if (t < line.at) return <div style={{ height: 84 }} />;
    return (
      <div
        style={{
          marginTop: 30,
          padding: "16px 28px",
          borderRadius: 999,
          border: `4px solid ${YELLOW}`,
          fontFamily: FONT,
          ...base,
          opacity: pr(t, line.at, 0.12),
          transform: `scale(${0.7 + 0.3 * p})`,
        }}
      >
        {line.text}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        columnGap: base.fontSize === 112 ? 26 : 14,
        rowGap: 4,
        marginTop: line.style === "title" ? 0 : 22,
        fontFamily: FONT,
        ...base,
      }}
    >
      {tokens.map((tok, i) => {
        const at = line.at + i * WORD_STAGGER;
        const p = pr(t, at, 0.22, EASE.out);
        const pop = pr(t, at, 0.28, EASE.back);
        if (t < at) {
          return (
            <span key={i} style={{ visibility: "hidden" }}>
              {tok.text}
            </span>
          );
        }
        if (!tok.key) {
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                opacity: pr(t, at, 0.1),
                transform: `translateY(${(1 - p) * 28}px) scale(${0.86 + 0.14 * pop})`,
              }}
            >
              {tok.text}
            </span>
          );
        }
        // frasa kunci: blok kuning menyapu dari kiri, teks berubah gelap, lalu punch
        const boxAt = at + 0.1;
        const box = pr(t, boxAt, 0.2, EASE.inOut);
        const k = punch(frame, Math.round((boxAt + 0.2) * fps), fps, 0.08);
        return (
          <span
            key={i}
            style={{
              position: "relative",
              display: "inline-block",
              whiteSpace: "nowrap",
              padding: "0 0.16em",
              opacity: pr(t, at, 0.1),
              transform: `translateY(${(1 - p) * 28}px) scale(${(0.86 + 0.14 * pop) * k})`,
            }}
          >
            <span
              style={{
                position: "absolute",
                inset: "0.06em 0 0.02em 0",
                background: YELLOW,
                borderRadius: 10,
                transform: `scaleX(${box}) rotate(-1.2deg)`,
                transformOrigin: "left center",
              }}
            />
            <span
              style={{
                position: "relative",
                color: box > 0.5 ? INK : (base.color as string),
              }}
            >
              {tok.text}
            </span>
          </span>
        );
      })}
    </div>
  );
};

/** Blok teks satu scene. `duration` = durasi scene (detik) untuk animasi keluar. */
export const WordText: React.FC<{ lines: Line[]; duration: number }> = ({ lines, duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const out = pr(t, duration - 0.15, 0.15, EASE.in);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        opacity: 1 - out,
        transform: `translateY(${out * -50}px)`,
      }}
    >
      {lines.map((l, i) => (
        <WordLine key={i} line={l} t={t} frame={frame} fps={fps} />
      ))}
    </div>
  );
};
