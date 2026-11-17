// Kartu sumber terpisah, ditampilkan ~2 detik tepat sebelum closing.
// Masuk dengan wipe dari bawah, diam, lalu fade cepat di akhir Sequence.

import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { EASE } from "../lib/motion";
import { FONT, YELLOW } from "./WordText";

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pr = (t: number, start: number, dur: number, ease = EASE.out) =>
  interpolate(t, [start, start + dur], [0, 1], { ...CLAMP, easing: ease });

export const SOURCE_CARD_SECONDS = 2;

export const SourceCard: React.FC<{
  /** mis. "alodokter.com" */
  name: string;
  /** catatan kecil, mis. "info umum, bukan pengganti saran dokter" */
  note?: string;
  label?: string;
}> = ({ name, note, label = "sumber" }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const inP = pr(t, 0.05, 0.3);
  const out = pr(t, durationInFrames / fps - 0.15, 0.15, EASE.in);
  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        right: 140,
        top: 700,
        display: "flex",
        justifyContent: "center",
        opacity: 1 - out,
      }}
    >
      <div
        style={{
          width: "100%",
          padding: "52px 48px",
          borderRadius: 32,
          background: "#141a3a",
          border: "3px solid #2b3570",
          fontFamily: FONT,
          textAlign: "center",
          clipPath: `inset(${(1 - inP) * 100}% 0 0 0 round 32px)`,
          transform: `translateY(${(1 - inP) * 40}px)`,
        }}
      >
        <div style={{ fontSize: 36, fontWeight: 600, letterSpacing: 4, color: "#9EA6C2" }}>
          {label}
        </div>
        <div
          style={{ marginTop: 14, fontSize: 76, fontWeight: 800, letterSpacing: -2, color: "#fff" }}
        >
          {name}
        </div>
        {note ? (
          <>
            <div style={{ height: 6, width: 120, background: YELLOW, margin: "28px auto" }} />
            <div style={{ fontSize: 36, fontWeight: 500, color: "#C9CEE0", lineHeight: 1.3 }}>
              {note}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};
