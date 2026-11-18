// Penanda poin generik di atas layar: "3/5" + blok progres.
// Tampil dari `showFrom` sampai akhir scene poin terakhir; angka bergeser naik
// saat poin berganti, lalu diam.

import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { EASE } from "../lib/motion";
import { FONT, YELLOW } from "./WordText";

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pr = (t: number, start: number, dur: number, ease = EASE.out) =>
  interpolate(t, [start, start + dur], [0, 1], { ...CLAMP, easing: ease });

export type CounterScene = { start: number; duration: number; point?: number };

export const PointCounter: React.FC<{
  scenes: CounterScene[];
  /** detik mulai tampil (mis. awal scene "janji isi") */
  showFrom: number;
  total?: number;
}> = ({ scenes, showFrom, total = 5 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const pts = scenes.filter((s) => s.point);
  const last = pts[pts.length - 1];
  const end = last.start + last.duration;
  if (t < showFrom || t > end) return null;

  const current = pts.find((s) => t >= s.start && t < s.start + s.duration);
  const n = current?.point ?? 0;
  const out = pr(t, end - 0.15, 0.15, EASE.in);
  const numIn = current ? pr(t, current.start, 0.18) : 0;

  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        right: 140,
        top: 170,
        display: "flex",
        justifyContent: "center",
        opacity: 1 - out,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 22,
          padding: "14px 26px",
          borderRadius: 999,
          background: "rgba(10,14,40,0.75)",
          border: "2px solid rgba(255,255,255,0.12)",
          fontFamily: FONT,
        }}
      >
        <div
          style={{
            overflow: "hidden",
            height: 46,
            minWidth: 64,
            fontSize: 40,
            fontWeight: 800,
            color: YELLOW,
            textAlign: "center",
          }}
        >
          <div style={{ transform: `translateY(${(1 - numIn) * 100}%)` }}>
            {n > 0 ? `${n}/${total}` : ""}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {new Array(total).fill(0).map((_, k) => {
            const i = k + 1;
            const shown = t >= showFrom + 0.35 + k * 0.08;
            return (
              <div
                key={i}
                style={{
                  width: 34,
                  height: 12,
                  borderRadius: 3,
                  background: i <= n ? YELLOW : "rgba(255,255,255,0.22)",
                  opacity: shown ? 1 : 0,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
