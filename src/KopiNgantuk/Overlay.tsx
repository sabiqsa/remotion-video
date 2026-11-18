// Elemen 2D interaktif & komedi: kartu rating bintang (1/5 → 4/5), balon teks
// "si americano", tombol tim. Muncul sekali pada ketukan lalu diam.

import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT, INK, YELLOW } from "../brand/WordText";
import { EASE } from "../lib/motion";
import { BEATS, STAR_TIMES } from "./beats";
import { cupScreen } from "./Scene3D";
import { END, sceneById } from "./script";

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pr = (t: number, start: number, dur: number, ease = EASE.out) =>
  interpolate(t, [start, start + dur], [0, 1], { ...CLAMP, easing: ease });

const useT = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

const S = (id: Parameters<typeof sceneById>[0]) => sceneById(id).start;

/* ---------------------------- balon teks ---------------------------- */

const Bubble: React.FC<{
  text: string;
  from: number;
  to: number;
  size?: number;
}> = ({ text, from, to, size = 42 }) => {
  const t = useT();
  if (t < from || t > to) return null;
  const s = pr(t, from, 0.28, EASE.back) * (1 - pr(t, to - 0.12, 0.12, EASE.in));
  // ekor di atas gelas; balon memanjang ke kiri, tidak melewati tepi kanan aman
  const p = cupScreen(Math.min(t, from + 0.3));
  const x = Math.min(p.x + 40, 1080 - 140);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: p.y,
        transform: `translate(-100%, -100%) scale(${s})`,
        transformOrigin: "90% 120%",
      }}
    >
      <div
        style={{
          position: "relative",
          padding: "14px 26px",
          background: "#ffffff",
          border: `5px solid ${INK}`,
          borderRadius: 28,
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: size,
          color: INK,
          whiteSpace: "nowrap",
          boxShadow: "0 6px 0 rgba(0,0,0,0.25)",
        }}
      >
        {text}
        <div
          style={{
            position: "absolute",
            bottom: -26,
            right: 34,
            width: 0,
            height: 0,
            borderLeft: "16px solid transparent",
            borderRight: "16px solid transparent",
            borderTop: `26px solid ${INK}`,
          }}
        />
      </div>
    </div>
  );
};

/* --------------------------- kartu rating --------------------------- */

const Star: React.FC<{ on: number; pop: number; size: number }> = ({ on, pop, size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ transform: `scale(${1 + 0.35 * pop})` }}>
    <path
      d="M12 2.2l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"
      fill={on > 0.5 ? YELLOW : "rgba(255,255,255,0.14)"}
      stroke={on > 0.5 ? "#c99a00" : "rgba(255,255,255,0.35)"}
      strokeWidth={1.2}
      strokeLinejoin="round"
    />
  </svg>
);

const RatingCard: React.FC = () => {
  const t = useT();
  const inRating = t >= S("rating") && t < END("rating");
  const inUlang = t >= S("ulang") && t < END("ulang");
  if (!inRating && !inUlang) return null;
  const from = inRating ? S("rating") : S("ulang");
  const to = inRating ? END("rating") : END("ulang");
  const cardIn = pr(t, from + 0.1, 0.3, EASE.back) * (1 - pr(t, to - 0.15, 0.15, EASE.in));

  // bintang 1 dicap di "satu"; di rating ulang bintang 2–4 menyala satu per satu
  const stars = [0, 1, 2, 3, 4].map((i) => {
    if (i === 0) {
      const at = inRating ? BEATS.ratingStamp : -1;
      return { on: inRating ? (t >= at ? 1 : 0) : 1, pop: inRating ? pr(t, at, 0.05) - pr(t, at + 0.06, 0.25) : 0 };
    }
    if (inUlang && i <= 3) {
      const at = STAR_TIMES[i - 1];
      return { on: t >= at ? 1 : 0, pop: pr(t, at, 0.05) - pr(t, at + 0.06, 0.25) };
    }
    return { on: 0, pop: 0 };
  });

  return (
    <div style={{ position: "absolute", left: 80, right: 140, top: 600, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "16px 30px",
          borderRadius: 30,
          background: "rgba(14,10,6,0.82)",
          border: "3px solid rgba(255,255,255,0.18)",
          transform: `scale(${cardIn})`,
          boxShadow: "0 8px 0 rgba(0,0,0,0.3)",
        }}
      >
        {stars.map((s, i) => (
          <Star key={i} on={s.on} pop={s.pop} size={92} />
        ))}
      </div>
    </div>
  );
};

/* ------------------------------ komen ------------------------------ */

const Teams: React.FC = () => {
  const t = useT();
  const stop = END("komen");
  if (t < BEATS.teamA || t > stop) return null;
  const out = 1 - pr(t, stop - 0.15, 0.15, EASE.in);
  const teams = [
    { label: "tim americano ☕", at: BEATS.teamA, bg: YELLOW },
    { label: "tim kopsu gula aren 🧋", at: BEATS.teamB, bg: "#ffffff" },
  ];
  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        right: 140,
        top: 660,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
        opacity: out,
      }}
    >
      {teams.map((tm) =>
        t >= tm.at ? (
          <div
            key={tm.label}
            style={{
              padding: "18px 34px",
              borderRadius: 999,
              background: tm.bg,
              color: INK,
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: 44,
              boxShadow: "0 7px 0 rgba(0,0,0,0.3)",
              transform: `scale(${0.6 + 0.4 * pr(t, tm.at, 0.3, EASE.back)})`,
            }}
          >
            {tm.label}
          </div>
        ) : null,
      )}
    </div>
  );
};

/* ------------------------------ rangkai ------------------------------ */

export const Overlay: React.FC = () => (
  <>
    <RatingCard />
    <Bubble text="hah? aku?" from={BEATS.ratingStamp + 0.35} to={END("rating")} />
    <Bubble text="fiuh~" from={BEATS.promiseRelief} to={END("promise")} />
    <Bubble text="aku kopi, bukan kasur" from={BEATS.kasur} to={END("p2")} size={38} />
    <Bubble text="pusiiing~" from={BEATS.spin + 0.5} to={END("siklus")} />
    <Bubble text="aku 0 gula ya!" from={BEATS.zeroSugar} to={BEATS.sachet - 0.05} />
    <Bubble text="heh?!" from={BEATS.sachet + 0.6} to={END("p4")} />
    <Bubble text="yes! 4/5 🎉" from={BEATS.highFive + 0.2} to={END("ulang")} />
    <Bubble text="pilih aku dong 🥺" from={BEATS.teamB + 0.6} to={END("komen")} size={38} />
    <Teams />
  </>
);
