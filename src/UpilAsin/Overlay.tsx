// Lapisan 2D: sinematik (letterbox & fokus palsu saat macro, vignette, kilat syok) dan komedi/interaktif
// (stempel "KETAHUAN", ingus → upil, bar komposisi ingus, debu menempel di hidung, tetes ketelan,
// coretan ngupil, checklist tisu, 2 tombol komen). Muncul sekali lalu diam.

import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND_TAG_CORNER, BrandTag } from "../brand/BrandTag";
import { FONT, INK, YELLOW } from "../brand/WordText";
import { EASE } from "../lib/motion";
import { BEATS } from "./beats";
import { faceScreen, headScreen, macroAt, noseScreen, shockAt, throatScreen } from "./Scene3D";
import { END, sceneById } from "./script";

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pr = (t: number, start: number, dur: number, ease = EASE.out) =>
  interpolate(t, [start, start + dur], [0, 1], { ...CLAMP, easing: ease });
const S = (id: Parameters<typeof sceneById>[0]) => sceneById(id).start;
const GREEN = "#2fd27a";
const RED = "#ff4d5e";
const BLUE = "#6cc4ff";
const SLIME = "#b9e36a";

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

const PANEL: React.CSSProperties = {
  background: "rgba(14,16,34,0.8)",
  border: "3px solid rgba(255,255,255,0.18)",
  borderRadius: 30,
  padding: "22px 26px",
  boxShadow: "0 10px 0 rgba(0,0,0,0.25)",
};
const CORNER = BRAND_TAG_CORNER;

/* ------------------------------ sinematik ------------------------------ */

/** Scrim gelap halus di sepertiga atas: teks putih tetap terbaca saat lampu kamar nyala. */
const Scrim: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      height: 1100,
      background: "linear-gradient(180deg, rgba(8,10,24,0.65) 0%, rgba(8,10,24,0.45) 55%, rgba(8,10,24,0) 100%)",
    }}
  />
);

/** Bar hitam atas-bawah selama macro. */
const Letterbox: React.FC = () => {
  const t = useT();
  const k = macroAt(t) * 0.75;
  if (k <= 0.001) return null;
  const h = 200 * k;
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: h, background: "#000" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: h, background: "#000" }} />
      <BrandTag style={{ position: "absolute", left: 0, right: 0, bottom: h / 2 - 16, textAlign: "center", opacity: Math.min(1, k * 1.6), color: "rgba(255,255,255,0.8)" }} />
    </>
  );
};

/** Vignette tipis, sedikit lebih pekat saat macro. */
const Vignette: React.FC = () => {
  const t = useT();
  const k = 0.25 + 0.25 * macroAt(t);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(ellipse 70% 55% at 50% 52%, rgba(0,0,0,0) 40%, rgba(2,4,14,${Math.min(0.92, k)}) 100%)`,
      }}
    />
  );
};

/** Fokus palsu: tepi layar diblur saat kamera macro. */
const FakeDof: React.FC = () => {
  const t = useT();
  const m = macroAt(t);
  if (m <= 0.02) return null;
  const mask = "radial-gradient(circle at 50% 60%, rgba(0,0,0,0) 26%, rgba(0,0,0,1) 58%)";
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

/** kilat putih sekali saat syok (bersama sting) */
const Flashes: React.FC = () => {
  const t = useT();
  const k = [BEATS.caught, BEATS.swallow].reduce((m, a) => Math.max(m, t >= a && t < a + 0.25 ? 1 - pr(t, a, 0.25) : 0), 0);
  return k > 0 ? <div style={{ position: "absolute", inset: 0, background: "#ffffff", opacity: k * 0.55 }} /> : null;
};

/** garis konsentrasi manga di sekeliling wajah selama syok */
const SpeedLines: React.FC = () => {
  const t = useT();
  const k = shockAt(t) * macroAt(t);
  if (k <= 0.05) return null;
  const c = faceScreen(t);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: k * 0.5 }}>
      {Array.from({ length: 36 }).map((_, i) => {
        const a = (i / 36) * Math.PI * 2 + (i % 2) * 0.05;
        const r0 = 470 + ((i * 53) % 5) * 30;
        const r1 = 1500;
        return (
          <line
            key={i}
            x1={c.x + Math.cos(a) * r0}
            y1={c.y + Math.sin(a) * r0}
            x2={c.x + Math.cos(a) * r1}
            y2={c.y + Math.sin(a) * r1}
            stroke="#ffffff"
            strokeWidth={i % 3 === 0 ? 10 : 5}
          />
        );
      })}
    </svg>
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

/* ------------------------------ stempel komik ------------------------------ */

const Stamp: React.FC<{ text: string; at: number; dur?: number; anchor: (t: number) => { x: number; y: number }; dx?: number; dy?: number; size?: number; color?: string; rot?: number }> = ({
  text,
  at,
  dur = 0.6,
  anchor,
  dx = 0,
  dy = 0,
  size = 90,
  color = YELLOW,
  rot = -10,
}) => {
  const t = useT();
  if (t < at || t > at + dur) return null;
  const s = pr(t, at, 0.16, EASE.back) * (1 - pr(t, at + dur - 0.14, 0.14, EASE.in));
  const p = anchor(at);
  const x = Math.max(200, Math.min(880, p.x + dx));
  const y = Math.max(560, Math.min(1450, p.y + dy));
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${s})`,
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: size,
        color,
        WebkitTextStroke: `${Math.round(size / 14)}px ${INK}`,
        paintOrder: "stroke",
        textShadow: "0 7px 0 rgba(0,0,0,0.35)",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};

const Chip: React.FC<{ text: string; from: number; to: number; top: number; bg?: string; rot?: number; size?: number }> = ({ text, from, to, top, bg = YELLOW, rot = -3, size = 46 }) => {
  const t = useT();
  if (t < from || t > to) return null;
  const s = pr(t, from, 0.3, EASE.back) * (1 - pr(t, to - 0.15, 0.15, EASE.in));
  return (
    <Row top={top}>
      <div style={{ ...pillStyle, fontSize: size, padding: "14px 32px", background: bg, transform: `scale(${s}) rotate(${rot}deg)` }}>{text}</div>
    </Row>
  );
};

/* ---------------------------------- janji ---------------------------------- */

/** tetes ingus pop → panah → mengering jadi upil (2 langkah, lalu diam) */
const IngusToUpil: React.FC = () => {
  const t = useT();
  const from = BEATS.drop - 0.1;
  const to = END("janji");
  if (t < from || t > to) return null;
  const s = pr(t, from, 0.3, EASE.back) * (1 - pr(t, to - 0.15, 0.15, EASE.in));
  const arrow = pr(t, BEATS.dry - 0.25, 0.2);
  const dry = pr(t, BEATS.dry, 0.25, EASE.back);
  const item = (emoji: React.ReactNode, label: string, k: number) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, transform: `scale(${k})` }}>
      {emoji}
      <div style={{ color: INK, fontWeight: 800, fontSize: 40 }}>{label}</div>
    </div>
  );
  return (
    <div style={{ position: "absolute", left: 540, top: 1400, transform: `translate(-50%, -50%) scale(${s})`, fontFamily: FONT }}>
      <div style={{ ...PANEL, background: "#ffffff", border: `5px solid ${INK}`, display: "flex", alignItems: "center", gap: 34, padding: "24px 44px", position: "relative" }}>
        {item(<div style={{ width: 96, height: 120, background: SLIME, border: `5px solid ${INK}`, borderRadius: "50% 50% 50% 50% / 62% 62% 38% 38%" }} />, "ingus 💧", 1)}
        <div style={{ fontSize: 70, fontWeight: 900, color: INK, opacity: arrow, transform: `translateX(${-30 * (1 - arrow)}px)` }}>→</div>
        {item(
          <div style={{ width: 100, height: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 80, height: 62, background: "#8d9b4a", border: `5px solid ${INK}`, borderRadius: "40% 55% 45% 60%", transform: "rotate(-12deg)" }} />
          </div>,
          "upil 🫣",
          dry,
        )}
        <BrandTag style={{ ...CORNER, color: "rgba(0,0,0,0.45)" }} />
      </div>
    </div>
  );
};

/* ---------------------------------- p1 ---------------------------------- */

const PARTS = [
  { label: "air 💧", pct: 95, color: BLUE, at: () => BEATS.water },
  { label: "musin", pct: 3, color: SLIME, at: () => BEATS.musin },
  { label: "protein & garam 🧂", pct: 2, color: YELLOW, at: () => BEATS.protein },
];

/** bar komposisi ingus: air 95% terisi dulu, lalu musin, lalu protein & garam */
const CompositionBar: React.FC = () => {
  const t = useT();
  const from = BEATS.water - 0.3;
  const to = END("p1");
  if (t < from || t > to) return null;
  const s = pr(t, from, 0.35, EASE.back) * (1 - pr(t, to - 0.15, 0.15, EASE.in));
  return (
    <div style={{ ...PANEL, position: "absolute", left: 80, right: 140, top: 1330, transform: `scale(${s})`, transformOrigin: "50% 0%", fontFamily: FONT, padding: "18px 26px 36px" }}>
      <div style={{ color: "#ffffff", fontWeight: 800, fontSize: 36 }}>🤧 isi ingus</div>
      <div style={{ marginTop: 14, height: 60, borderRadius: 18, background: "rgba(255,255,255,0.12)", overflow: "hidden", display: "flex" }}>
        {PARTS.map((p, i) => {
          const k = pr(t, p.at(), i === 0 ? 0.7 : 0.25, EASE.inOut);
          return <div key={i} style={{ width: `${p.pct * k}%`, height: "100%", background: p.color, borderRight: k > 0.5 && i < 2 ? `4px solid ${INK}` : undefined }} />;
        })}
      </div>
      <div style={{ display: "flex", gap: 14, marginTop: 16, flexWrap: "wrap" }}>
        {PARTS.map((p, i) => {
          const k = pr(t, p.at(), 0.3, EASE.back);
          return k > 0.01 ? (
            <div key={i} style={{ ...pillStyle, fontSize: 32, padding: "8px 20px", background: p.color, transform: `scale(${k})` }}>
              {p.label} {p.pct}%
            </div>
          ) : null;
        })}
      </div>
      <BrandTag style={CORNER} />
    </div>
  );
};

/* ---------------------------------- p3 ---------------------------------- */

/** debu & kuman terbang dari tepi layar sekali (stagger), lalu menempel diam di sekitar hidung */
const DUST = Array.from({ length: 9 }).map((_, i) => {
  const a = (i / 9) * Math.PI * 2 + 0.4;
  return {
    from: { x: 540 + Math.cos(a) * 700, y: 1000 + Math.sin(a) * 900 },
    off: { x: Math.cos(a * 1.7) * 55, y: Math.sin(a * 1.3) * 35 },
    emoji: i % 3 === 0 ? "🦠" : "",
    size: i % 3 === 0 ? 46 : 18 + (i % 2) * 8,
    delay: i * 0.06,
  };
});

const DustTrap: React.FC = () => {
  const t = useT();
  const from = BEATS.dust - 0.1;
  const to = END("p3");
  if (t < from || t > to) return null;
  const out = 1 - pr(t, to - 0.15, 0.15, EASE.in);
  const n = noseScreen(BEATS.dust);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: out }}>
      {DUST.map((d, i) => {
        const k = pr(t, BEATS.dust + d.delay, 0.45, EASE.inOut);
        const stuck = t >= BEATS.dust + d.delay + 0.45;
        const x = d.from.x + (n.x + d.off.x - d.from.x) * k;
        const y = d.from.y + (n.y + d.off.y - d.from.y) * k;
        const sq = stuck ? 1 + 0.25 * (1 - pr(t, BEATS.dust + d.delay + 0.45, 0.2)) : 1;
        return d.emoji ? (
          <div key={i} style={{ position: "absolute", left: x, top: y, fontSize: d.size, transform: `translate(-50%, -50%) scale(${sq})` }}>
            {d.emoji}
          </div>
        ) : (
          <div
            key={i}
            style={{ position: "absolute", left: x, top: y, width: d.size, height: d.size, borderRadius: 999, background: "#8a7a66", border: `3px solid ${INK}`, transform: `translate(-50%, -50%) scale(${sq})` }}
          />
        );
      })}
    </div>
  );
};

/* --------------------------------- twist --------------------------------- */

/** tetes ingus meluncur dari hidung ke tenggorokan sekali, lalu "glek" */
const SwallowDrop: React.FC = () => {
  const t = useT();
  const from = BEATS.swallow - 0.45;
  const to = BEATS.swallow + 0.1;
  if (t < from || t > to + 0.2) return null;
  const k = pr(t, from, 0.5, EASE.in);
  const a = noseScreen(t);
  const b = throatScreen(t);
  const x = a.x + (b.x - a.x) * k + 40;
  const y = a.y + (b.y - a.y) * k;
  const fade = 1 - pr(t, to, 0.2);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: fade }}>
      <path d={`M ${a.x + 40} ${a.y} C ${a.x + 110} ${a.y + 60}, ${b.x + 110} ${b.y - 60}, ${b.x + 40} ${b.y}`} stroke="#ffffff" strokeWidth={6} strokeDasharray="14 14" fill="none" opacity={0.85} />
      <ellipse cx={x} cy={y} rx={20} ry={26} fill={SLIME} stroke={INK} strokeWidth={5} />
    </svg>
  );
};

/* --------------------------------- tips --------------------------------- */

const CHECK_TOP = 1270;
const CHECK_ROW = 96;
const CHECKS = [
  { label: "buang ingus pelan 🤧", at: () => BEATS.tick1 },
  { label: "pakai tisu 🧻", at: () => BEATS.tick2 },
];
const checkBox = (i: number) => ({ x: 188, y: CHECK_TOP + i * CHECK_ROW + 55 });

const Checklist: React.FC = () => {
  const t = useT();
  const from = BEATS.tick1 - 0.4;
  const to = END("tips");
  if (t < from || t > to) return null;
  const out = 1 - pr(t, to - 0.15, 0.15, EASE.in);
  return (
    <div style={{ position: "absolute", left: 150, top: CHECK_TOP, opacity: out, display: "flex", flexDirection: "column", gap: 16 }}>
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
      <BrandTag style={{ paddingLeft: 96 }} />
    </div>
  );
};

/** silang merah besar di atas tangan yang ngupil */
const NoPick: React.FC = () => {
  const t = useT();
  const from = BEATS.noPick;
  const to = BEATS.bleed - 0.05;
  if (t < from || t > to) return null;
  const s = pr(t, from, 0.2, EASE.back) * (1 - pr(t, to - 0.15, 0.15, EASE.in));
  const n = noseScreen(from);
  const x1 = pr(t, from, 0.14);
  const x2 = pr(t, from + 0.08, 0.14);
  return (
    <svg width={300} height={300} style={{ position: "absolute", left: n.x - 150 + 30, top: n.y - 150 + 40, transform: `scale(${s})` }}>
      <line x1={40} y1={40} x2={40 + 220 * x1} y2={40 + 220 * x1} stroke={RED} strokeWidth={26} strokeLinecap="round" />
      <line x1={260} y1={40} x2={260 - 220 * x2} y2={40 + 220 * x2} stroke={RED} strokeWidth={26} strokeLinecap="round" />
    </svg>
  );
};

/* --------------------------------- komen --------------------------------- */

const TEAM_TOP = 1240;
const TEAMS = [
  { label: "ngupil diam-diam 🤫", at: () => BEATS.teamA, bg: "#ffffff" },
  { label: "selalu pakai tisu 🧻", at: () => BEATS.teamB, bg: YELLOW },
];
const teamPos = (i: number) => ({ x: 760, y: TEAM_TOP + i * 120 + 70 });

const Teams: React.FC = () => {
  const t = useT();
  const from = S("komen") + 0.25;
  const to = END("komen");
  if (t < from) return null;
  const out = 1 - pr(t, to - 0.15, 0.15, EASE.in);
  return (
    <Row top={TEAM_TOP} style={{ flexDirection: "column", alignItems: "center", gap: 22, opacity: out }}>
      {TEAMS.map((tm, i) => {
        const k = pr(t, from + i * 0.1, 0.3, EASE.back);
        const hit = t >= tm.at();
        const pop = hit ? 1 + 0.12 * (1 - pr(t, tm.at(), 0.3)) : 1;
        return (
          <div
            key={i}
            style={{ ...pillStyle, borderRadius: 26, fontSize: 44, padding: "18px 36px", background: tm.bg, border: `5px solid ${INK}`, transform: `scale(${k * pop})` }}
          >
            {tm.label} {hit ? "+1" : ""}
          </div>
        );
      })}
      <BrandTag />
    </Row>
  );
};

/* ------------------------------ rangkai ------------------------------ */

export const Overlay: React.FC = () => (
  <>
    <FakeDof />
    <SpeedLines />
    <Scrim />
    <Vignette />
    {/* hook */}
    <Stamp text="KETAHUAN 😳" at={BEATS.caught} dur={1.3} anchor={faceScreen} dx={0} dy={-420} size={104} color={YELLOW} rot={-7} />
    {/* janji */}
    <IngusToUpil />
    {/* p1 */}
    <CompositionBar />
    <Stamp text="🧂 asin!" at={BEATS.salt} dur={0.9} anchor={headScreen} dx={190} dy={40} size={80} color={YELLOW} rot={8} />
    {/* p2 */}
    <Chip text="😢 air mata & 💦 keringat juga asin" from={BEATS.penting - 0.1} to={BEATS.lendir - 0.25} top={1380} bg="#ffffff" rot={-2} size={40} />
    <Chip text="🧂 garam → lendir encer" from={BEATS.encer - 0.1} to={END("p2")} top={1390} bg={YELLOW} rot={-3} size={46} />
    <Chip text="〰️ mengalir lancar" from={BEATS.flow - 0.05} to={END("p2")} top={1480} bg={BLUE} rot={2} size={46} />
    {/* p3 */}
    <DustTrap />
    <Stamp text="nempel! 🪤" at={BEATS.stick} dur={0.9} anchor={headScreen} dx={-180} dy={30} size={74} color="#ffffff" rot={-8} />
    <Chip text="🛡️ enzim antikuman" from={BEATS.enzim - 0.05} to={END("p3")} top={1380} bg={GREEN} rot={-3} size={50} />
    {/* twist */}
    <SwallowDrop />
    <Stamp text="GLEK! 😳" at={BEATS.swallow} dur={0.9} anchor={faceScreen} dx={0} dy={-420} size={110} color={YELLOW} rot={6} />
    <Stamp text="iyuh 🤢" at={BEATS.unaware} dur={1.0} anchor={() => ({ x: 540, y: 1400 })} size={84} color={SLIME} rot={-5} />
    {/* tips */}
    <NoPick />
    <Stamp text="mimisan 🩸" at={BEATS.bleed} dur={0.85} anchor={headScreen} dx={0} dy={-10} size={70} color={RED} rot={-5} />
    <Checklist />
    <TapCursor
      from={BEATS.tick1 - 0.4}
      to={END("tips")}
      taps={[BEATS.tick1, BEATS.tick2]}
      keys={[
        { t: BEATS.tick1 - 0.4, x: checkBox(0).x, y: checkBox(0).y + 40 },
        { t: BEATS.tick1, ...checkBox(0) },
        { t: BEATS.tick2, ...checkBox(1) },
      ]}
    />
    {[BEATS.tick1, BEATS.tick2].map((a, i) => (
      <TapRing key={i} at={a} {...checkBox(i)} />
    ))}
    {/* dokter */}
    <Chip text="🩺 cek ke dokter" from={BEATS.doc - 0.15} to={END("dokter")} top={1380} bg="#ffffff" rot={-3} size={52} />
    {/* komen */}
    <Teams />
    <TapCursor
      from={BEATS.teamA - 0.45}
      to={END("komen")}
      taps={[BEATS.teamA, BEATS.teamB]}
      keys={[
        { t: BEATS.teamA - 0.45, ...teamPos(0), y: teamPos(0).y + 60 },
        { t: BEATS.teamA, ...teamPos(0) },
        { t: BEATS.teamB, ...teamPos(1) },
      ]}
    />
    {[BEATS.teamA, BEATS.teamB].map((a, i) => (
      <TapRing key={`tr${i}`} at={a} {...teamPos(i)} />
    ))}
    <Flashes />
    <Letterbox />
  </>
);
