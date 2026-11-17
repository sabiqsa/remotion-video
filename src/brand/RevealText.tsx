// Teks per baris yang masuk dengan reveal bermasker (slide dari balik garis
// + fade), tertahan diam, lalu keluar serempak. Waktu dalam detik.

import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { EASE, prog, punch, sec } from "../lib/motion";

export type RevealLine = {
  text: string;
  size: number;
  /** detik relatif ke awal Sequence */
  at: number;
  /** arah masuk: dari bawah garis (default), kiri, atau kanan */
  from?: "below" | "left" | "right";
  weight?: number;
  color?: string;
  /** detik untuk punch skala (penekanan kata kunci) */
  punchAt?: number;
};

export const RevealText: React.FC<{
  lines: RevealLine[];
  color?: string;
  font?: string;
  /** detik sebelum akhir Sequence untuk keluar (default 0.25) */
  exit?: number;
}> = ({
  lines,
  color = "#FFD400",
  font = '"Helvetica Neue", Helvetica, Arial, sans-serif',
  exit = 0.25,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const outDur = sec(exit, fps);
  const out = prog(frame, durationInFrames - outDur, outDur, EASE.in);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 4,
        opacity: 1 - out,
        transform: `translateY(${out * -50}px)`,
      }}
    >
      {lines.map((l, i) => {
        const p = prog(frame, sec(l.at, fps), sec(0.45, fps), EASE.out);
        const fade = prog(frame, sec(l.at, fps), sec(0.2, fps), EASE.out);
        const dir = l.from ?? "below";
        const tx = dir === "left" ? (1 - p) * -140 : dir === "right" ? (1 - p) * 140 : 0;
        const ty = dir === "below" ? (1 - p) * 105 : 0;
        const k = l.punchAt === undefined ? 1 : punch(frame, sec(l.punchAt, fps), fps);
        return (
          <div key={i} style={{ overflow: "hidden", paddingBottom: 6 }}>
            <div
              style={{
                fontFamily: font,
                fontWeight: l.weight ?? 900,
                fontSize: l.size,
                lineHeight: 1,
                letterSpacing: l.size > 80 ? -2 : 0.5,
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                color: l.color ?? color,
                opacity: fade,
                transform: `translate(${tx}px, ${ty}%) scale(${k})`,
                transformOrigin: "left center",
              }}
            >
              {l.text}
            </div>
          </div>
        );
      })}
    </div>
  );
};
