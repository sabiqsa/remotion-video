// Lapisan 2D: sinematik (letterbox, vignette, fokus palsu saat macro, stempel "kedut!") dan
// interaktif (kuis A/B ditap kursor, kedut-meter, notifikasi, checklist, kalender, tombol tim).
// Semua muncul sekali pada ketukan lalu diam.

import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT, INK, YELLOW } from "../brand/WordText";
import { EASE } from "../lib/motion";
import { BEATS, METER, TWITCH_BURSTS, ZOOMS } from "./beats";
import { dayAt, eyeAt, headScreen, macroAt, toScreen } from "./Scene3D";
import { END, sceneById } from "./script";

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pr = (t: number, start: number, dur: number, ease = EASE.out) =>
  interpolate(t, [start, start + dur], [0, 1], { ...CLAMP, easing: ease });
const S = (id: Parameters<typeof sceneById>[0]) => sceneById(id).start;
const GREEN = "#2fd27a";
const RED = "#ff4d5e";

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

/** wadah area aman lebar penuh (kiri 80, kanan 140) pada `top` */
const Row: React.FC<{ top: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ top, children, style }) => (
  <div style={{ position: "absolute", left: 80, right: 140, top, display: "flex", justifyContent: "center", ...style }}>{children}</div>
);

/* ------------------------------ sinematik ------------------------------ */

/** Bar hitam atas-bawah: penuh saat macro pembuka, tipis saat dorongan macro berikutnya. */
const Letterbox: React.FC = () => {
  const t = useT();
  const hook = 1 - pr(t, BEATS.reveal, 0.55, EASE.inOut);
  const later = ZOOMS.slice(1).some(([a, b]) => t > a - 0.05 && t < b + 0.5) ? macroAt(t) * 0.55 : 0;
  const k = Math.max(hook, later);
  if (k <= 0.001) return null;
  const h = 210 * k;
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: h, background: "#000" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: h, background: "#000" }} />
    </>
  );
};

/** Vignette statis (lebih pekat malam & saat macro). */
const Vignette: React.FC = () => {
  const t = useT();
  const k = 0.5 * (1 - dayAt(t)) + 0.18 + 0.25 * macroAt(t);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(ellipse 75% 60% at 50% 58%, rgba(0,0,0,0) 45%, rgba(0,0,0,${k}) 100%)`,
      }}
    />
  );
};

/** Fokus palsu: tepi layar diblur saat kamera macro (pusat mata tetap tajam). */
const FakeDof: React.FC = () => {
  const t = useT();
  const m = macroAt(t);
  if (m <= 0.02) return null;
  const mask = "radial-gradient(circle at 50% 66%, rgba(0,0,0,0) 26%, rgba(0,0,0,1) 58%)";
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backdropFilter: `blur(${10 * m}px)`,
        WebkitBackdropFilter: `blur(${10 * m}px)`,
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
    />
  );
};

/** Stempel komik "kedut!" di samping mata pada awal tiap rentetan kedut. */
const KedutStamp: React.FC = () => {
  const t = useT();
  const burst = TWITCH_BURSTS.find(([at]) => t >= at && t < at + 0.55);
  if (!burst) return null;
  const at = burst[0];
  const s = pr(t, at, 0.18, EASE.back) * (1 - pr(t, at + 0.42, 0.13, EASE.in));
  const p = toScreen(at, eyeAt(at));
  const m = macroAt(at);
  const x = Math.min(900, p.x + (m > 0.5 ? 170 : 70));
  const y = Math.max(560, p.y - (m > 0.5 ? 260 : 110));
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(-10deg) scale(${s})`,
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: m > 0.5 ? 84 : 52,
        color: YELLOW,
        WebkitTextStroke: `${m > 0.5 ? 6 : 4}px ${INK}`,
        paintOrder: "stroke",
        textShadow: "0 6px 0 rgba(0,0,0,0.35)",
        whiteSpace: "nowrap",
      }}
    >
      kedut!
    </div>
  );
};

/* ------------------------------ balon teks ------------------------------ */

const Bubble: React.FC<{
  text: string;
  from: number;
  to: number;
  at: (t: number) => { x: number; y: number };
  size?: number;
  dir?: "left" | "right";
}> = ({ text, from, to, at, size = 40, dir = "right" }) => {
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

/* ------------------------------ kursor tap ------------------------------ */

const HAND = [
  "....##......",
  "...#WW#.....",
  "...#WW#.....",
  "...#WW#.....",
  "...#WW###...",
  "...#WW#WW##.",
  ".###WW#WW#W#",
  "#WW#WWWWWWW#",
  "#WWWWWWWWWW#",
  ".#WWWWWWWWW#",
  "..#WWWWWWW#.",
  "..#WWWWWWW#.",
  "...#WWWWW#..",
  "...#######..",
];

type Key = { t: number; x: number; y: number };
/** Kursor tangan pixel: berpindah antar titik (0.25 dtk, EASE.inOut), menekan saat `taps`. */
const TapCursor: React.FC<{ keys: Key[]; taps: number[]; from: number; to: number }> = ({ keys, taps, from, to }) => {
  const t = useT();
  if (t < from || t > to) return null;
  let x = keys[0].x;
  let y = keys[0].y;
  for (const k of keys.slice(1)) {
    const p = pr(t, k.t - 0.25, 0.25, EASE.inOut);
    x += (k.x - x) * p;
    y += (k.y - y) * p;
  }
  const enter = pr(t, from, 0.25, EASE.out);
  const exit = pr(t, to - 0.2, 0.2, EASE.in);
  const press = taps.some((a) => t >= a - 0.04 && t < a + 0.1) ? 0.85 : 1;
  return (
    <div
      style={{
        position: "absolute",
        left: x - 14,
        top: y + 220 * (1 - enter) + 300 * exit,
        transform: `scale(${press})`,
        transformOrigin: "30% 5%",
        filter: "drop-shadow(0 6px 0 rgba(0,0,0,0.35))",
      }}
    >
      <svg width={12 * 7} height={14 * 7} style={{ display: "block", shapeRendering: "crispEdges" }}>
        {HAND.flatMap((row, yy) =>
          row.split("").map((c, xx) =>
            c === "#" || c === "W" ? (
              <rect key={`${xx}-${yy}`} x={xx * 7} y={yy * 7} width={7} height={7} fill={c === "#" ? "#111111" : "#ffffff"} />
            ) : null,
          ),
        )}
      </svg>
    </div>
  );
};

/** cincin tap memancar sekali */
const TapRing: React.FC<{ at: number; x: number; y: number }> = ({ at, x, y }) => {
  const t = useT();
  if (t < at || t > at + 0.45) return null;
  const u = pr(t, at, 0.45);
  return (
    <div
      style={{
        position: "absolute",
        left: x - 70 * u,
        top: y - 70 * u,
        width: 140 * u,
        height: 140 * u,
        borderRadius: 999,
        border: `6px solid ${YELLOW}`,
        opacity: 1 - u,
      }}
    />
  );
};

/* -------------------------------- kuis -------------------------------- */

const QUIZ_TOP = 640;
const QA = { x: 330, y: QUIZ_TOP + 60 };
const QB = { x: 700, y: QUIZ_TOP + 60 };

const Quiz: React.FC = () => {
  const t = useT();
  const from = BEATS.quiz;
  const to = BEATS.three + 0.6;
  if (t < from || t > to) return null;
  const out = 1 - pr(t, to - 0.15, 0.15, EASE.in);
  const done = t >= BEATS.tapB;
  const shake = done ? Math.sin(pr(t, BEATS.tapB + 0.05, 0.4, (v) => v) * Math.PI * 4) * (1 - pr(t, BEATS.tapB, 0.45)) * 12 : 0;
  const btn = (label: string, at: number, i: number, state: "idle" | "right" | "wrong"): React.ReactNode => {
    const s = pr(t, at, 0.3, EASE.back);
    const bg = state === "right" ? GREEN : state === "wrong" ? "rgba(255,255,255,0.55)" : "#ffffff";
    return (
      <div
        key={i}
        style={{
          ...pillStyle,
          borderRadius: 26,
          fontSize: 40,
          padding: "20px 28px",
          background: bg,
          border: `5px solid ${INK}`,
          transform: `scale(${s * (state === "right" ? 1 + 0.08 * (1 - pr(t, BEATS.tapB, 0.3)) : 1)}) translateX(${i === 0 ? shake : 0}px)`,
          textDecoration: state === "wrong" ? "line-through" : "none",
        }}
      >
        {label}
        {state === "right" ? " ✓" : ""}
      </div>
    );
  };
  return (
    <Row top={QUIZ_TOP} style={{ gap: 26, opacity: out, flexDirection: "column", alignItems: "center" }}>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 38, color: "#ffffff", textShadow: "0 3px 0 rgba(0,0,0,0.4)", opacity: pr(t, from, 0.2) }}>
        menurutmu yang bener?
      </div>
      <div style={{ display: "flex", gap: 30 }}>
        {btn("A. rezeki 🪙", from + 0.1, 0, done ? "wrong" : "idle")}
        {btn("B. kurang tidur 😴", from + 0.22, 1, done ? "right" : "idle")}
      </div>
    </Row>
  );
};

/* ------------------------------ kedut-meter ------------------------------ */

const meterAt = (t: number) => {
  let v = 0;
  for (const [at, target] of METER) v += (target - v) * pr(t, at, 0.4, EASE.back);
  return Math.max(0, Math.min(1.05, v));
};

const KedutMeter: React.FC = () => {
  const t = useT();
  const from = S("p1") + 0.1;
  const to = END("tips");
  if (t < from || t > to) return null;
  const s = pr(t, from, 0.3, EASE.back) * (1 - pr(t, to - 0.15, 0.15, EASE.in));
  const v = meterAt(t);
  const max = t >= METER[2][0] && t < METER[3][0];
  const color = v > 0.85 ? RED : v > 0.5 ? "#ff9f1a" : v > 0.2 ? YELLOW : GREEN;
  const H = 330;
  return (
    <div
      style={{
        position: "absolute",
        left: 70,
        top: 760,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        transform: `scale(${s})`,
        transformOrigin: "50% 0%",
      }}
    >
      <div style={{ ...pillStyle, fontSize: 26, padding: "8px 16px", background: "rgba(10,14,40,0.8)", color: "#ffffff", boxShadow: "none" }}>
        kedut-meter
      </div>
      <div style={{ position: "relative", width: 74, height: H, borderRadius: 37, background: "rgba(10,14,40,0.75)", border: "5px solid #ffffff", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: H * Math.min(1, v), background: color, borderRadius: 30 }} />
      </div>
      <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 34, color: max ? RED : "#ffffff", textShadow: "0 3px 0 rgba(0,0,0,0.5)" }}>
        {max ? "MAX 😵" : `${Math.round(Math.min(1, v) * 100)}%`}
      </div>
    </div>
  );
};

/* ------------------------------ elemen poin ------------------------------ */

const Clock: React.FC = () => {
  const t = useT();
  const from = BEATS.clock;
  const to = END("p1");
  if (t < from || t > to) return null;
  const s = pr(t, from, 0.3, EASE.back) * (1 - pr(t, to - 0.15, 0.15, EASE.in));
  return (
    <Row top={610}>
      <div style={{ ...pillStyle, fontSize: 48, padding: "14px 34px", background: YELLOW, transform: `scale(${s}) rotate(-3deg)` }}>🕑 02.00</div>
    </Row>
  );
};

const NOTIFS = [
  { at: () => BEATS.notif1, icon: "📩", text: "revisi lagi ya", bg: "#ffffff" },
  { at: () => BEATS.notif2, icon: "⏰", text: "deadline 17.00", bg: YELLOW },
  { at: () => BEATS.notif3, icon: "💬", text: "udah belum??", bg: "#ffffff" },
];

const Notifs: React.FC = () => {
  const t = useT();
  const to = END("p3");
  if (t < BEATS.notif1 || t > to) return null;
  const out = 1 - pr(t, to - 0.15, 0.15, EASE.in);
  return (
    <div style={{ position: "absolute", left: 230, right: 140, top: 600, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 14, opacity: out }}>
      {NOTIFS.map((n, i) => {
        const a = n.at();
        if (t < a) return null;
        const k = pr(t, a, 0.3, EASE.back);
        return (
          <div
            key={i}
            style={{
              ...pillStyle,
              borderRadius: 22,
              fontSize: 36,
              padding: "14px 24px",
              background: n.bg,
              border: `4px solid ${INK}`,
              transform: `translateX(${(1 - k) * 260}px) rotate(${i % 2 ? 1.5 : -1.5}deg)`,
            }}
          >
            {n.icon} {n.text}
          </div>
        );
      })}
    </div>
  );
};

const NameCard: React.FC = () => {
  const t = useT();
  const from = BEATS.name;
  const to = END("fakta");
  if (t < from || t > to) return null;
  const s = pr(t, from, 0.35, EASE.back) * (1 - pr(t, to - 0.15, 0.15, EASE.in));
  return (
    <Row top={640}>
      <div
        style={{
          transform: `scale(${s}) rotate(-2deg)`,
          background: "#ffffff",
          border: `5px solid ${INK}`,
          borderRadius: 26,
          boxShadow: "0 8px 0 rgba(0,0,0,0.3)",
          overflow: "hidden",
          fontFamily: FONT,
          textAlign: "center",
        }}
      >
        <div style={{ background: RED, color: "#ffffff", fontWeight: 800, fontSize: 28, padding: "8px 30px", letterSpacing: 2 }}>HALO, NAMAKU</div>
        <div style={{ fontWeight: 900, fontSize: 60, color: INK, padding: "14px 40px 6px" }}>miokimia 👋</div>
        <div style={{ fontWeight: 600, fontSize: 30, color: "#555", padding: "0 30px 16px" }}>kedutan ringan otot kelopak</div>
      </div>
    </Row>
  );
};

const CHECK_TOP = 610;
const CHECK_ROW = 96;
const CHECKS = [
  { label: "tidur cukup 😴", at: () => BEATS.tick1 },
  { label: "kurangi kopi ☕", at: () => BEATS.tick2 },
  { label: "rehat dari layar 📵", at: () => BEATS.tick3 },
];
/** titik kotak centang baris ke-i (untuk kursor) */
const checkBox = (i: number) => ({ x: 318, y: CHECK_TOP + i * CHECK_ROW + 55 });

const Checklist: React.FC = () => {
  const t = useT();
  const from = BEATS.morning + 0.3;
  const to = END("tips");
  if (t < from || t > to) return null;
  const out = 1 - pr(t, to - 0.15, 0.15, EASE.in);
  return (
    <div style={{ position: "absolute", left: 280, top: CHECK_TOP, opacity: out, display: "flex", flexDirection: "column", gap: 16 }}>
      {CHECKS.map((c, i) => {
        const k = pr(t, from + i * 0.08, 0.3, EASE.back);
        const done = t >= c.at();
        const pop = done ? 1 + 0.2 * (1 - pr(t, c.at(), 0.25)) : 1;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 20, transform: `scale(${k})`, transformOrigin: "0% 50%" }}>
            <div
              style={{
                width: 76,
                height: 76,
                borderRadius: 18,
                border: `5px solid ${INK}`,
                background: done ? GREEN : "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 50,
                fontWeight: 900,
                color: "#ffffff",
                transform: `scale(${pop})`,
                boxShadow: "0 6px 0 rgba(0,0,0,0.3)",
                fontFamily: FONT,
              }}
            >
              {done ? "✓" : ""}
            </div>
            <div style={{ ...pillStyle, fontSize: 42, padding: "12px 26px", background: done ? YELLOW : "#ffffff" }}>{c.label}</div>
          </div>
        );
      })}
    </div>
  );
};

const Calendar: React.FC = () => {
  const t = useT();
  const from = BEATS.cal - 0.15;
  const to = END("serius");
  if (t < from || t > to) return null;
  const s = pr(t, from, 0.3, EASE.back) * (1 - pr(t, to - 0.15, 0.15, EASE.in));
  const filled = Math.floor(pr(t, BEATS.cal, 0.9, (v) => v) * 14);
  const doc = pr(t, BEATS.doc, 0.3, EASE.back);
  return (
    <Row top={690} style={{ gap: 30, alignItems: "center" }}>
      <div
        style={{
          transform: `scale(${s})`,
          background: "#ffffff",
          border: `5px solid ${INK}`,
          borderRadius: 22,
          overflow: "hidden",
          boxShadow: "0 8px 0 rgba(0,0,0,0.3)",
          fontFamily: FONT,
        }}
      >
        <div style={{ background: RED, color: "#fff", fontWeight: 800, fontSize: 30, padding: "8px 0", textAlign: "center" }}>14 hari+</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 46px)", gap: 8, padding: 14 }}>
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 46,
                height: 46,
                borderRadius: 10,
                background: i < filled ? "#ffd2d6" : "#eef0f4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 30,
                fontWeight: 900,
                color: RED,
              }}
            >
              {i < filled ? "×" : ""}
            </div>
          ))}
        </div>
      </div>
      {t >= BEATS.doc ? (
        <div style={{ ...pillStyle, fontSize: 44, padding: "16px 28px", background: YELLOW, transform: `scale(${doc}) rotate(3deg)` }}>🩺 dokter</div>
      ) : null}
    </Row>
  );
};

const TEAM_TOP = 680;
const TL = { x: 440, y: TEAM_TOP + 80 };
const TR = { x: 810, y: TEAM_TOP + 80 };

const Teams: React.FC = () => {
  const t = useT();
  const from = S("komen") + 0.25;
  const to = END("komen");
  if (t < from) return null;
  const out = 1 - pr(t, to - 0.15, 0.15, EASE.in);
  const teams = [
    { label: "tim kiri 👁️", at: BEATS.teamL, bg: YELLOW },
    { label: "tim kanan 👁️", at: BEATS.teamR, bg: "#ffffff" },
  ];
  return (
    <Row top={TEAM_TOP} style={{ gap: 30, opacity: out }}>
      {teams.map((tm, i) => {
        const k = pr(t, from + i * 0.1, 0.3, EASE.back);
        const hit = t >= tm.at;
        const pop = hit ? 1 + 0.12 * (1 - pr(t, tm.at, 0.3)) : 1;
        return (
          <div
            key={i}
            style={{
              ...pillStyle,
              borderRadius: 26,
              fontSize: 42,
              padding: "20px 30px",
              background: tm.bg,
              border: `5px solid ${INK}`,
              transform: `scale(${k * pop})`,
            }}
          >
            {tm.label} {hit ? "+1" : ""}
          </div>
        );
      })}
    </Row>
  );
};

/* ------------------------------ rangkai ------------------------------ */

export const Overlay: React.FC = () => (
  <>
    <FakeDof />
    <Vignette />
    <KedutStamp />
    <Bubble text="mana cuannya? 🥲" from={BEATS.wallet + 0.35} to={END("mitos")} at={headScreen} />
    <Quiz />
    <TapCursor
      from={BEATS.quiz + 0.35}
      to={BEATS.three + 0.4}
      taps={[BEATS.tapB]}
      keys={[
        { t: BEATS.quiz + 0.35, x: QA.x + 70, y: QA.y + 110 },
        { t: BEATS.hover, x: QA.x + 70, y: QA.y + 45 },
        { t: BEATS.tapB, x: QB.x + 140, y: QB.y + 45 },
      ]}
    />
    <TapRing at={BEATS.tapB} x={QB.x + 140} y={QB.y + 45} />
    <KedutMeter />
    <Clock />
    <Bubble text="satu video lagi…" from={BEATS.buzz1 + 0.25} to={END("p1")} at={headScreen} />
    <Bubble text="masih aman kok ☕" from={BEATS.cup3 + 0.1} to={BEATS.zap} at={headScreen} />
    <Notifs />
    <NameCard />
    <Bubble text="segeerr ☀️" from={BEATS.morning + 0.45} to={BEATS.tick1 + 0.3} at={headScreen} />
    <Checklist />
    <TapCursor
      from={BEATS.tick1 - 0.45}
      to={END("tips")}
      taps={[BEATS.tick1, BEATS.tick2, BEATS.tick3]}
      keys={[
        { t: BEATS.tick1 - 0.45, x: checkBox(0).x, y: checkBox(0).y + 40 },
        { t: BEATS.tick1, ...checkBox(0) },
        { t: BEATS.tick2, ...checkBox(1) },
        { t: BEATS.tick3, ...checkBox(2) },
      ]}
    />
    {[BEATS.tick1, BEATS.tick2, BEATS.tick3].map((a, i) => (
      <TapRing key={i} at={a} {...checkBox(i)} />
    ))}
    <Calendar />
    <Teams />
    <TapCursor
      from={BEATS.teamL - 0.45}
      to={END("komen")}
      taps={[BEATS.teamL, BEATS.teamR]}
      keys={[
        { t: BEATS.teamL - 0.45, x: TL.x, y: TL.y + 40 },
        { t: BEATS.teamL, ...TL },
        { t: BEATS.teamR, ...TR },
      ]}
    />
    <TapRing at={BEATS.teamL} {...TL} />
    <TapRing at={BEATS.teamR} {...TR} />
    <Letterbox />
  </>
);
