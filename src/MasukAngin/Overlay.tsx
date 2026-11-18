// Elemen 2D interaktif & komedi: balon teks, cap ✕, kuis A/B + hitung mundur,
// tombol "tim kerokan / tim minyak angin". Semua muncul sekali pada ketukan lalu diam.

import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT, INK, YELLOW } from "../brand/WordText";
import { EASE } from "../lib/motion";
import { beat, sceneById } from "./script";

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pr = (t: number, start: number, dur: number, ease = EASE.out) =>
  interpolate(t, [start, start + dur], [0, 1], { ...CLAMP, easing: ease });

const useT = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

/* ------------------------------ ketukan ------------------------------ */

const end = (id: Parameters<typeof sceneById>[0]) => sceneById(id).start + sceneById(id).duration;

export const BEATS = {
  stamp: beat("hook", "padahal", 1.5) - 0.2,
  windIn: 0.15,
  promiseRelief: beat("promise", "ternyata", 0.2) + 0.3,
  sneeze: beat("p1", "flu", 0.8) + 0.45, // bersin tepat setelah kata "flu"
  burp: beat("p2", "sendawa", 1.6),
  crack: beat("p3", "turun", 2.0) + 0.1, // retak saat "turun"
  scrapeStart: beat("p4", "kerokan", 1.1), // koin mulai menggores saat "kerokan"
  quizShow: beat("p4", "merahnya", 1.5) + 0.15,
  countStart: sceneById("kuis").start + 0.1,
  reveal: beat("jawab", "b", 0.6), // jawaban B menyala saat "B" diucapkan
  peek: beat("jawab", "bikin", 2.8) - 0.4,
  sitJoke: beat("p5", "duduk", 1.3) - 0.25, // si angin duduk saat "angin duduk"
  serious: beat("p5", "nah", 1.6),
  teamA: beat("komen", "kerokan", 1.0),
  teamB: beat("komen", "minyak", 1.8),
  highFive: beat("komen", "tulis", 2.6) + 0.3,
};

/* ---------------------------- balon teks ---------------------------- */

const Bubble: React.FC<{
  text: string;
  x: number;
  y: number;
  from: number;
  to: number;
  tail?: "left" | "right";
  size?: number;
}> = ({ text, x, y, from, to, tail = "left", size = 44 }) => {
  const t = useT();
  if (t < from || t > to) return null;
  const s = pr(t, from, 0.28, EASE.back) * (1 - pr(t, to - 0.12, 0.12, EASE.in));
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -100%) scale(${s})`,
        transformOrigin: tail === "left" ? "20% 120%" : "80% 120%",
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
            [tail === "left" ? "left" : "right"]: 34,
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

/* ------------------------------ cap ✕ ------------------------------ */

const Stamp: React.FC = () => {
  const t = useT();
  const hookEnd = end("hook");
  if (t < BEATS.stamp || t > hookEnd) return null;
  const hit = interpolate(t, [BEATS.stamp, BEATS.stamp + 0.18], [1.6, 1], { ...CLAMP, easing: EASE.out });
  const fade = pr(t, BEATS.stamp, 0.06);
  const out = 1 - pr(t, hookEnd - 0.15, 0.15, EASE.in);
  return (
    <div
      style={{
        position: "absolute",
        left: 110,
        top: 960,
        width: 260,
        height: 260,
        opacity: fade * out,
        transform: `scale(${hit}) rotate(-10deg)`,
      }}
    >
      {[45, -45].map((r) => (
        <div
          key={r}
          style={{
            position: "absolute",
            left: 0,
            top: 104,
            width: 260,
            height: 52,
            borderRadius: 30,
            background: "#e3263b",
            boxShadow: "0 6px 0 rgba(0,0,0,0.25)",
            transform: `rotate(${r}deg)`,
          }}
        />
      ))}
    </div>
  );
};

/* -------------------------------- kuis -------------------------------- */

const Quiz: React.FC = () => {
  const t = useT();
  // pilihan tetap tampil sebentar setelah jawaban dibuka, lalu memberi ruang untuk teks jawaban
  const stop = BEATS.reveal + 1.8;
  if (t < BEATS.quizShow || t > stop) return null;
  const out = 1 - pr(t, stop - 0.15, 0.15, EASE.in);
  const revealed = t >= BEATS.reveal;
  const rv = pr(t, BEATS.reveal, 0.25, EASE.back);
  const options = [
    { key: "A", label: "angin keluar", right: false },
    { key: "B", label: "pembuluh darah pecah", right: true },
  ];
  // hitung mundur 3-2-1 bergaya sprite (berganti tiap 1 detik)
  const n = 3 - Math.floor((t - BEATS.countStart) / 1);
  const showCount = t >= BEATS.countStart && t < BEATS.reveal && n >= 1;
  const countPop = showCount ? pr(t, BEATS.countStart + (3 - n), 0.2, EASE.back) : 0;

  return (
    <div style={{ position: "absolute", left: 80, right: 140, top: 560, opacity: out }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "stretch" }}>
        {options.map((o, i) => {
          const pIn = pr(t, BEATS.quizShow + i * 0.12, 0.3, EASE.back);
          const win = revealed && o.right;
          const lose = revealed && !o.right;
          return (
            <div
              key={o.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                padding: "16px 22px",
                borderRadius: 22,
                background: win ? YELLOW : "rgba(10,14,40,0.82)",
                border: `4px solid ${win ? YELLOW : "rgba(255,255,255,0.35)"}`,
                opacity: lose ? 0.4 : 1,
                transform: `scale(${(0.7 + 0.3 * pIn) * (win ? 1 + 0.06 * rv : 1)})`,
                fontFamily: FONT,
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: win ? INK : YELLOW,
                  color: win ? YELLOW : INK,
                  fontSize: 44,
                  fontWeight: 900,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {o.key}
              </div>
              <div style={{ fontSize: 46, fontWeight: 800, color: win ? INK : "#ffffff", textDecoration: lose ? "line-through" : "none" }}>
                {o.label}
              </div>
              {win ? <div style={{ marginLeft: "auto", fontSize: 48, fontWeight: 900, color: INK }}>✓</div> : null}
            </div>
          );
        })}
      </div>
      {showCount ? (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 40 }}>
          <div
            style={{
              width: 150,
              height: 150,
              borderRadius: 999,
              background: YELLOW,
              color: INK,
              fontFamily: FONT,
              fontWeight: 900,
              fontSize: 110,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${0.6 + 0.4 * countPop})`,
              boxShadow: "0 8px 0 rgba(0,0,0,0.3)",
            }}
          >
            {n}
          </div>
        </div>
      ) : null}
    </div>
  );
};

/* ------------------------------ komen ------------------------------ */

const Teams: React.FC = () => {
  const t = useT();
  const stop = end("komen");
  if (t < BEATS.teamA || t > stop) return null;
  const out = 1 - pr(t, stop - 0.15, 0.15, EASE.in);
  const teams = [
    { label: "tim kerokan", at: BEATS.teamA, bg: YELLOW, fg: INK },
    { label: "tim minyak angin", at: BEATS.teamB, bg: "#ffffff", fg: INK },
  ];
  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        right: 140,
        top: 680,
        display: "flex",
        justifyContent: "center",
        gap: 22,
        opacity: out,
      }}
    >
      {teams.map((tm) =>
        t >= tm.at ? (
          <div
            key={tm.label}
            style={{
              padding: "18px 30px",
              borderRadius: 999,
              background: tm.bg,
              color: tm.fg,
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: 42,
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
    <Stamp />
    <Bubble text="bukan aku!" x={330} y={930} from={BEATS.stamp + 0.2} to={end("hook")} tail="left" />
    <Bubble text="fiuh~" x={330} y={940} from={BEATS.promiseRelief} to={end("promise")} tail="left" />
    <Bubble text="*burp*" x={560} y={1010} from={BEATS.burp} to={BEATS.burp + 1.2} tail="left" size={48} />
    <Bubble text="waduh!" x={560} y={1010} from={BEATS.crack + 0.05} to={BEATS.crack + 1.3} tail="left" />
    <Bubble text="tuh kan, bukan aku" x={700} y={1000} from={BEATS.peek} to={end("jawab")} tail="right" size={38} />
    <Bubble text="angin… duduk?" x={330} y={1300} from={BEATS.sitJoke + 0.25} to={BEATS.serious} tail="left" size={40} />
    <Quiz />
    <Teams />
  </>
);
