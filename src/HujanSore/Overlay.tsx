// Elemen 2D interaktif & komedi: balon teks si awan / si biru (ikut posisi 3D), kartu absen
// "15.00", grafik puncak hujan, chip "malam / dini hari", tombol tim. Muncul sekali lalu diam.

import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT, INK, YELLOW } from "../brand/WordText";
import { EASE } from "../lib/motion";
import { BEATS } from "./beats";
import { cloudBaseScreen, cloudScreen, headScreen } from "./Scene3D";
import { END } from "./script";

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pr = (t: number, start: number, dur: number, ease = EASE.out) =>
  interpolate(t, [start, start + dur], [0, 1], { ...CLAMP, easing: ease });

const useT = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

const pillStyle: React.CSSProperties = {
  fontFamily: FONT,
  fontWeight: 800,
  color: INK,
  borderRadius: 999,
  boxShadow: "0 7px 0 rgba(0,0,0,0.3)",
  whiteSpace: "nowrap",
};

/* ---------------------------- balon teks ---------------------------- */

const Bubble: React.FC<{
  text: string;
  from: number;
  to: number;
  at: (t: number) => { x: number; y: number };
  size?: number;
  /** "left" = balon memanjang ke kiri dari ekor, "right" = ke kanan */
  dir?: "left" | "right";
}> = ({ text, from, to, at, size = 42, dir = "left" }) => {
  const t = useT();
  if (t < from || t > to) return null;
  const s = pr(t, from, 0.28, EASE.back) * (1 - pr(t, to - 0.12, 0.12, EASE.in));
  const p = at(Math.min(t, from + 0.3));
  const x = dir === "left" ? Math.min(p.x + 40, 1080 - 140) : Math.max(p.x - 40, 80);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: p.y,
        transform: `translate(${dir === "left" ? "-100%" : "0"}, -100%) scale(${s})`,
        transformOrigin: dir === "left" ? "90% 120%" : "10% 120%",
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
            [dir === "left" ? "right" : "left"]: 34,
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

/* -------------------------- kartu absen 15.00 -------------------------- */

const Absen: React.FC = () => {
  const t = useT();
  const from = BEATS.badge;
  const to = END("kerja");
  if (t < from || t > to) return null;
  const s = pr(t, from, 0.3, EASE.back) * (1 - pr(t, to - 0.15, 0.15, EASE.in));
  return (
    <div style={{ position: "absolute", left: 80, right: 140, top: 600, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          ...pillStyle,
          fontSize: 46,
          padding: "16px 34px",
          background: YELLOW,
          transform: `scale(${s}) rotate(-3deg)`,
        }}
      >
        🕒 absen awan: 15.00
      </div>
    </div>
  );
};

/* --------------------------- grafik puncak hujan --------------------------- */

const Bars: React.FC = () => {
  const t = useT();
  const from = BEATS.barSore - 0.1;
  const to = END("data");
  if (t < from || t > to) return null;
  const out = 1 - pr(t, to - 0.15, 0.15, EASE.in);
  const bars = [
    { label: "pagi", tag: "paling jarang", h: 0.22, at: BEATS.barPagi, color: "rgba(255,255,255,0.85)" },
    { label: "sore", tag: "puncak ☔", h: 1, at: BEATS.barSore, color: YELLOW },
  ];
  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        right: 140,
        top: 590,
        display: "flex",
        justifyContent: "center",
        gap: 70,
        opacity: out,
      }}
    >
      {bars.map((b) => {
        const g = pr(t, b.at, 0.45, EASE.back);
        if (t < b.at) return <div key={b.label} style={{ width: 230 }} />;
        return (
          <div key={b.label} style={{ width: 230, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div style={{ ...pillStyle, fontSize: 32, padding: "8px 20px", background: "#ffffff", boxShadow: "none", opacity: g > 0.6 ? 1 : 0 }}>
              {b.tag}
            </div>
            <div style={{ height: 230, display: "flex", alignItems: "flex-end" }}>
              <div
                style={{
                  width: 170,
                  height: 230 * b.h * Math.max(0.02, g),
                  background: b.color,
                  borderRadius: "22px 22px 6px 6px",
                  border: `5px solid ${INK}`,
                  boxShadow: "0 8px 0 rgba(0,0,0,0.3)",
                }}
              />
            </div>
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 44, color: "#ffffff", textShadow: "0 3px 0 rgba(0,0,0,0.35)" }}>{b.label}</div>
          </div>
        );
      })}
    </div>
  );
};

/* -------------------------- chip malam / dini hari -------------------------- */

const Chips: React.FC = () => {
  const t = useT();
  const to = END("tapi");
  if (t < BEATS.malam || t > to) return null;
  const out = 1 - pr(t, to - 0.15, 0.15, EASE.in);
  const chips = [
    { label: "🌙 malam", at: BEATS.malam, bg: "#ffffff" },
    { label: "🌌 dini hari", at: BEATS.dini, bg: YELLOW },
  ];
  return (
    <div style={{ position: "absolute", left: 80, right: 140, top: 625, display: "flex", justifyContent: "center", gap: 24, opacity: out }}>
      {chips.map((c) =>
        t >= c.at ? (
          <div
            key={c.label}
            style={{
              ...pillStyle,
              fontSize: 46,
              padding: "16px 32px",
              background: c.bg,
              transform: `scale(${0.6 + 0.4 * pr(t, c.at, 0.3, EASE.back)})`,
            }}
          >
            {c.label}
          </div>
        ) : null,
      )}
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
    { label: "tim hujan sore ☔", at: BEATS.teamA, bg: YELLOW },
    { label: "tim hujan malam 🌙", at: BEATS.teamB, bg: "#ffffff" },
  ];
  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        right: 140,
        top: 690,
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
              ...pillStyle,
              fontSize: 44,
              padding: "18px 34px",
              background: tm.bg,
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
    <Bubble text="heh?!" from={BEATS.pour0 + 0.1} to={END("hook")} at={headScreen} dir="right" size={48} />
    <Absen />
    <Bubble text="baru masuk kerja 😴" from={BEATS.badge + 0.35} to={END("kerja")} at={cloudScreen} size={38} />
    <Bubble text="halo, aku lahir ☁️" from={BEATS.condense + 0.2} to={END("p2")} at={cloudScreen} size={38} />
    <Bubble text="berat nih 😵" from={BEATS.full} to={BEATS.pour} at={cloudBaseScreen} />
    <Bubble text="lega~" from={BEATS.pour + 0.3} to={END("p3")} at={cloudBaseScreen} />
    <Bars />
    <Chips />
    <Bubble text="kadang aku lembur" from={BEATS.dini + 0.25} to={END("tapi")} at={cloudScreen} size={38} />
    <Bubble text="siap tempur ☂️" from={BEATS.umbrella + 0.3} to={END("tips")} at={headScreen} dir="right" />
    <Teams />
  </>
);
