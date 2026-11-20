// Lapisan 2D: sinematik (letterbox & fokus palsu saat macro, vignette makin pekat saat gelap, kilat
// syok, kilat layar terang) dan komedi/interaktif (stempel "MINUS?!", kacamata dicoret, label pupil,
// chip kedip, bar melatonin, panel mata kiri vs kanan, checklist 3 tips, 2 tombol komen).
// Muncul sekali lalu diam.

import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND_TAG_CORNER, BrandTag } from "../brand/BrandTag";
import { FONT, INK, YELLOW } from "../brand/WordText";
import { EASE } from "../lib/motion";
import { BEATS } from "./beats";
import { clockAt, eyeMacroAt, faceScreen, flareAt, headScreen, macroAt, roomLightAt, shockAt } from "./Scene3D";
import { END, sceneById } from "./script";

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pr = (t: number, start: number, dur: number, ease = EASE.out) =>
  interpolate(t, [start, start + dur], [0, 1], { ...CLAMP, easing: ease });
const S = (id: Parameters<typeof sceneById>[0]) => sceneById(id).start;
const GREEN = "#2fd27a";
const RED = "#ff4d5e";
const BLUE = "#9fd0ff";

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

/** Vignette: makin pekat saat lampu mati & macro (kesan kamar gelap diterangi HP). */
const Vignette: React.FC = () => {
  const t = useT();
  const dark = 1 - roomLightAt(t);
  const k = 0.28 + 0.4 * dark + 0.2 * macroAt(t);
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

/** kilat putih sekali saat syok (bersama sting) + kilat biru-putih layar terang di p1 */
const Flashes: React.FC = () => {
  const t = useT();
  const k = [BEATS.minus0, BEATS.blind].reduce((m, a) => Math.max(m, t >= a && t < a + 0.25 ? 1 - pr(t, a, 0.25) : 0), 0);
  const f = flareAt(t);
  return (
    <>
      {f > 0.01 && <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 75%, rgba(220,240,255,${0.7 * f}) 0%, rgba(160,205,255,${0.35 * f}) 45%, rgba(0,0,0,0) 80%)` }} />}
      {k > 0 && <div style={{ position: "absolute", inset: 0, background: "#ffffff", opacity: k * 0.6 }} />}
    </>
  );
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

/* ---------------------------------- mitos ---------------------------------- */

/** kacamata minus besar pop, lalu dicoret silang merah di "terbukti" */
const GlassesMyth: React.FC = () => {
  const t = useT();
  const from = BEATS.glasses - 0.05;
  const to = END("mitos");
  if (t < from || t > to) return null;
  const s = pr(t, from, 0.3, EASE.back) * (1 - pr(t, to - 0.15, 0.15, EASE.in));
  const x1 = pr(t, BEATS.myth, 0.14);
  const x2 = pr(t, BEATS.myth + 0.1, 0.14);
  return (
    <div style={{ position: "absolute", left: 540, top: 760, transform: `translate(-50%, -50%) scale(${s})`, fontFamily: FONT }}>
      <div style={{ ...PANEL, background: "#ffffff", border: `5px solid ${INK}`, display: "flex", flexDirection: "column", alignItems: "center", padding: "26px 48px", position: "relative" }}>
        <div style={{ fontSize: 120, lineHeight: 1 }}>👓</div>
        <div style={{ color: INK, fontWeight: 800, fontSize: 44, marginTop: 10 }}>mata minus</div>
        <svg width={360} height={260} style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
          <line x1={40} y1={30} x2={40 + 280 * x1} y2={30 + 200 * x1} stroke={RED} strokeWidth={18} strokeLinecap="round" />
          <line x1={320} y1={30} x2={320 - 280 * x2} y2={30 + 200 * x2} stroke={RED} strokeWidth={18} strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
};

/* ---------------------------------- p1 ---------------------------------- */

/** label pupil saat macro mata: gelap → melebar, layar terang → mengecil */
const PupilLabels: React.FC = () => {
  const t = useT();
  const m = eyeMacroAt(t);
  if (m <= 0.3) return null;
  const a = pr(t, BEATS.dilate, 0.3, EASE.back) * (1 - pr(t, BEATS.bright - 0.1, 0.15, EASE.in));
  const b = pr(t, BEATS.bright, 0.3, EASE.back) * (1 - pr(t, BEATS.tired + 0.4, 0.15, EASE.in));
  const pill = (txt: string, k: number, bg: string) =>
    k > 0.01 ? (
      <div style={{ ...pillStyle, fontSize: 48, padding: "14px 30px", background: bg, border: `5px solid ${INK}`, transform: `scale(${k}) rotate(-3deg)` }}>{txt}</div>
    ) : null;
  return (
    <Row top={1330} style={{ flexDirection: "column", alignItems: "center", gap: 18 }}>
      {pill("🌑 gelap → pupil melebar", a, "#ffffff")}
      {pill("☀️ layar terang → mengecil", b, BLUE)}
    </Row>
  );
};

/* ---------------------------------- p3 ---------------------------------- */

const hhmm = (h: number) => {
  const hh = Math.floor(h) % 24;
  const mm = Math.floor((h % 1) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
};

/** jam digital di dekat jam dinding (22:00 → 01:00) */
const ClockChip: React.FC = () => {
  const t = useT();
  const from = S("p3") + 0.2;
  const to = END("p3");
  if (t < from || t > to) return null;
  const s = pr(t, from, 0.3, EASE.back) * (1 - pr(t, to - 0.15, 0.15, EASE.in));
  const late = clockAt(t) >= 24;
  return (
    <div
      style={{
        position: "absolute",
        left: 540,
        top: 1300,
        transform: `translate(-50%, -50%) scale(${s}) rotate(-4deg)`,
      }}
    >
      <div style={{ ...pillStyle, fontSize: 52, padding: "12px 30px", background: late ? RED : "#ffffff", color: late ? "#ffffff" : INK, border: `5px solid ${INK}` }}>
        🕐 {hhmm(clockAt(t))}
      </div>
    </div>
  );
};

/** bar melatonin: penuh → turun saat "melatonin" */
const MelatoninBar: React.FC = () => {
  const t = useT();
  const from = BEATS.light - 0.05;
  const to = END("p3");
  if (t < from || t > to) return null;
  const s = pr(t, from, 0.35, EASE.back) * (1 - pr(t, to - 0.15, 0.15, EASE.in));
  const v = 0.85 - 0.6 * pr(t, BEATS.mela, 0.7, EASE.inOut);
  return (
    <div style={{ ...PANEL, position: "absolute", left: 80, right: 140, top: 1390, transform: `scale(${s})`, transformOrigin: "50% 0%", fontFamily: FONT, padding: "18px 26px 34px" }}>
      <div style={{ color: "#ffffff", fontWeight: 800, fontSize: 36 }}>🌙 melatonin (hormon ngantuk)</div>
      <div style={{ marginTop: 14, height: 44, borderRadius: 22, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
        <div style={{ width: `${v * 100}%`, height: "100%", background: v > 0.5 ? "#8f7bff" : RED, borderRadius: 22 }} />
      </div>
      <BrandTag style={CORNER} />
    </div>
  );
};

/* --------------------------------- twist --------------------------------- */

/** panel mata kanan vs mata kiri: kiri "gelap" lalu pulih perlahan (beberapa menit) */
const EyeCompare: React.FC = () => {
  const t = useT();
  const from = BEATS.temp + 0.4;
  const to = END("twist");
  if (t < from || t > to) return null;
  const s = pr(t, from, 0.35, EASE.back) * (1 - pr(t, to - 0.15, 0.15, EASE.in));
  const rec = pr(t, BEATS.mins, 1.0, EASE.inOut);
  const eye = (label: string, dark: number) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div
        style={{
          width: 190,
          height: 190,
          borderRadius: 999,
          border: `6px solid ${INK}`,
          background: `radial-gradient(circle, #ffffff 0%, #ffffff 40%, #cfe8ff 100%)`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", left: 60, top: 60, width: 70, height: 70, borderRadius: 999, background: INK }} />
        <div style={{ position: "absolute", inset: 0, background: "#1a1d2b", opacity: dark * 0.92 }} />
      </div>
      <div style={{ color: "#ffffff", fontWeight: 800, fontSize: 36 }}>{label}</div>
    </div>
  );
  return (
    <div style={{ ...PANEL, position: "absolute", left: 80, right: 140, top: 1260, transform: `scale(${s})`, transformOrigin: "50% 0%", fontFamily: FONT, padding: "22px 26px 40px" }}>
      <div style={{ display: "flex", justifyContent: "space-around" }}>
        {eye("mata kanan 👁️", 0)}
        {eye(rec > 0.9 ? "mata kiri ✅" : "mata kiri 🌑", 1 - rec * 0.85)}
      </div>
      <div style={{ color: "rgba(255,255,255,0.75)", fontStyle: "italic", fontWeight: 600, fontSize: 28, marginTop: 12, textAlign: "center" }}>
        pulih sendiri dalam beberapa menit
      </div>
      <BrandTag style={CORNER} />
    </div>
  );
};

/* --------------------------------- tips --------------------------------- */

const CHECK_TOP = 640;
const CHECK_ROW = 96;
const CHECKS = [
  { label: "nyalain lampu 💡", at: () => BEATS.tick1 },
  { label: "turunin kecerahan 🔅", at: () => BEATS.tick2 },
  { label: "istirahatin mata 👀", at: () => BEATS.tick3 },
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

const TEAM_TOP = 680;
const TEAMS = [
  { label: "main sampai ketiduran 😴", at: () => BEATS.teamA, bg: "#ffffff" },
  { label: "hp di-charge jauh 🔌", at: () => BEATS.teamB, bg: YELLOW },
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
    <Stamp text="MINUS?! 😱" at={BEATS.minus0} dur={1.0} anchor={faceScreen} dx={0} dy={-430} size={110} color={YELLOW} rot={-7} />
    {/* mitos */}
    <GlassesMyth />
    {/* p1 */}
    <PupilLabels />
    <Stamp text="capek 😵‍💫" at={BEATS.tired} dur={1.0} anchor={() => ({ x: 540, y: 1180 })} size={90} color={YELLOW} rot={-6} />
    {/* p2 */}
    <Chip text="👁️ kedip ⬇" from={BEATS.blink} to={END("p2")} top={1380} bg="#ffffff" rot={-3} />
    <Stamp text="kering 🏜️" at={BEATS.dry} dur={0.8} anchor={faceScreen} dx={-180} dy={-360} size={78} color="#ffffff" rot={-8} />
    <Stamp text="perih!" at={BEATS.sting} dur={0.9} anchor={faceScreen} dx={190} dy={-340} size={90} color={RED} rot={7} />
    {/* p3 */}
    <ClockChip />
    <MelatoninBar />
    <Stamp text="hoaam… tapi melek 👀" at={BEATS.yawn} dur={1.1} anchor={headScreen} dx={0} dy={-20} size={62} color={YELLOW} rot={-4} />
    {/* twist */}
    <Stamp text="satu mata ketutup 🛏️" at={BEATS.pillow} dur={0.95} anchor={headScreen} dx={0} dy={-10} size={64} color="#ffffff" rot={-5} />
    <Stamp text="GELAP?! 😱" at={BEATS.blind} dur={0.9} anchor={faceScreen} dx={0} dy={-430} size={110} color={YELLOW} rot={6} />
    <EyeCompare />
    {/* tips */}
    <Checklist />
    <TapCursor
      from={BEATS.tick1 - 0.4}
      to={END("tips")}
      taps={[BEATS.tick1, BEATS.tick2, BEATS.tick3]}
      keys={[
        { t: BEATS.tick1 - 0.4, x: checkBox(0).x, y: checkBox(0).y + 40 },
        { t: BEATS.tick1, ...checkBox(0) },
        { t: BEATS.tick2, ...checkBox(1) },
        { t: BEATS.tick3, ...checkBox(2) },
      ]}
    />
    {[BEATS.tick1, BEATS.tick2, BEATS.tick3].map((a, i) => (
      <TapRing key={i} at={a} {...checkBox(i)} />
    ))}
    <Chip text="kabur terus? → dokter mata 🩺" from={BEATS.doc - 0.2} to={END("tips")} top={1060} bg="#ffffff" rot={-2} size={42} />
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
