// Elemen 2D di atas scene 3D: penanda "n/5" dan daftar makanan.
// Semua masuk sekali pada ketukan lalu diam.

import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { EASE } from "../lib/motion";
import { FONT, INK, YELLOW } from "../brand/WordText";
import { FOOD_ITEMS, sceneById, SCENES } from "./script";

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pr = (t: number, start: number, dur: number, ease = EASE.out) =>
  interpolate(t, [start, start + dur], [0, 1], { ...CLAMP, easing: ease });

/** Penanda poin di atas: "3/5" + 5 blok progres. Tampil dari scene promise s/d p5. */
export const PointCounter: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const promise = sceneById("promise");
  const p5 = sceneById("p5");
  const end = p5.start + p5.duration;
  if (t < promise.start || t > end) return null;

  const current = SCENES.find((s) => s.point && t >= s.start && t < s.start + s.duration);
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
            {n > 0 ? `${n}/5` : ""}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[1, 2, 3, 4, 5].map((i) => {
            const shown = t >= promise.start + 0.35 + (i - 1) * 0.08;
            const filled = i <= n;
            return (
              <div
                key={i}
                style={{
                  width: 34,
                  height: 12,
                  borderRadius: 3,
                  background: filled ? YELLOW : "rgba(255,255,255,0.22)",
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

/** Daftar makanan: satu item tampil, berganti tiap ketukan. Dipakai di dalam Sequence "food". */
export const FoodTicker: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const out = pr(t, durationInFrames / fps - 0.15, 0.15, EASE.in);
  const idx = FOOD_ITEMS.reduce((acc, it, i) => (t >= it.at ? i : acc), -1);
  if (idx < 0) return null;
  const it = FOOD_ITEMS[idx];
  const p = pr(t, it.at, 0.18);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 18,
        marginTop: 36,
        fontFamily: FONT,
        opacity: 1 - out,
      }}
    >
      <div style={{ overflow: "hidden", paddingBottom: 6 }}>
        <div
          style={{
            fontSize: 66,
            fontWeight: 800,
            letterSpacing: -1.5,
            color: "#ffffff",
            transform: `translateY(${(1 - p) * 100}%)`,
          }}
        >
          {it.name}
        </div>
      </div>
      <div
        style={{
          padding: "10px 22px",
          borderRadius: 999,
          background: YELLOW,
          color: INK,
          fontSize: 36,
          fontWeight: 700,
          transform: `scale(${0.8 + 0.2 * pr(t, it.at + 0.06, 0.2, EASE.back)})`,
          opacity: pr(t, it.at + 0.06, 0.1),
        }}
      >
        {it.tag}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
        {FOOD_ITEMS.map((_, i) => (
          <div
            key={i}
            style={{
              width: 14,
              height: 14,
              borderRadius: 7,
              background: i <= idx ? YELLOW : "rgba(255,255,255,0.25)",
            }}
          />
        ))}
      </div>
    </div>
  );
};
