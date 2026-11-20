// Lapisan 2D: sinematik (letterbox & fokus palsu saat macro, vignette, scrim, bingkai mikroskop)
// dan komedi/interaktif (stempel "aaa!" / "KRIUK!" / "krek!", kartu nama onikofagia + 3 dari 10
// orang, loading nilai 99% + stres-meter, antre 47 menit, label harga "camilan", checklist,
// 3 tombol komen). Semua muncul sekali pada ketukan lalu diam.

import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND_TAG_CORNER, BrandTag } from "../brand/BrandTag";
import { FONT, INK, YELLOW } from "../brand/WordText";
import { EASE } from "../lib/motion";
import { BEATS, STRESS, ZOOMS } from "./beats";
import { CRUNCHES, headScreen, lightsAt, macroAt, mouthScreen } from "./Scene3D";
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

/** Scrim gelap halus di sepertiga atas: teks putih tetap terbaca di dinding kamar terang (tips → akhir). */
const Scrim: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      height: 1100,
      background: "linear-gradient(180deg, rgba(20,12,6,0.62) 0%, rgba(20,12,6,0.45) 55%, rgba(20,12,6,0) 100%)",
    }}
  />
);

const PANEL: React.CSSProperties = {
  background: "rgba(14,16,34,0.78)",
  border: "3px solid rgba(255,255,255,0.18)",
  borderRadius: 30,
  padding: "22px 26px",
  boxShadow: "0 10px 0 rgba(0,0,0,0.25)",
};

const CORNER = BRAND_TAG_CORNER;

/** Bar hitam atas-bawah selama macro (mulut / kuku). */
const Letterbox: React.FC = () => {
  const t = useT();
  const k = macroAt(t) * 0.75;
  if (k <= 0.001) return null;
  const h = 200 * k;
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: h, background: "#000" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: h, background: "#000" }} />
      {/* kredit ala film di bar bawah saat macro */}
      <BrandTag style={{ position: "absolute", left: 0, right: 0, bottom: h / 2 - 16, textAlign: "center", opacity: Math.min(1, k * 1.6), color: "rgba(255,255,255,0.8)" }} />
    </>
  );
};

/** Vignette statis (lebih pekat saat malam & macro). */
const Vignette: React.FC = () => {
  const t = useT();
  const k = 0.22 + 0.3 * (1 - lightsAt(t)) + 0.25 * macroAt(t);
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



/* ------------------------------ stempel komik ------------------------------ */

/** Teks komik besar yang pop, miring, lalu hilang (kriuk!, aaa!, krek!). */
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

/* --------------------------------- nama --------------------------------- */

const PersonIcon: React.FC<{ on: number }> = ({ on }) => (
  <svg width={52} height={70} viewBox="0 0 52 70" style={{ transform: `scale(${1 + 0.15 * on})` }}>
    <circle cx={26} cy={16} r={13} fill={on > 0.5 ? YELLOW : "rgba(255,255,255,0.35)"} />
    <rect x={8} y={32} width={36} height={36} rx={16} fill={on > 0.5 ? YELLOW : "rgba(255,255,255,0.35)"} />
  </svg>
);

const NameCard: React.FC = () => {
  const t = useT();
  const from = BEATS.card;
  const to = END("nama");
  if (t < from || t > to) return null;
  const s = pr(t, from, 0.35, EASE.back) * (1 - pr(t, to - 0.15, 0.15, EASE.in));
  const lit = [0, 1, 2].map((i) => pr(t, BEATS.people + i * 0.15, 0.2, EASE.back));
  return (
    <Row top={690} style={{ flexDirection: "column", alignItems: "center", gap: 26, transform: `scale(${s})`, transformOrigin: "50% 0%" }}>
      <div style={{ transform: "rotate(-2deg)", background: "#ffffff", border: `5px solid ${INK}`, borderRadius: 26, boxShadow: "0 8px 0 rgba(0,0,0,0.3)", overflow: "hidden", fontFamily: FONT, textAlign: "center" }}>
        <div style={{ background: RED, color: "#ffffff", fontWeight: 800, fontSize: 28, padding: "8px 30px", letterSpacing: 2 }}>HALO, NAMAKU</div>
        <div style={{ fontWeight: 900, fontSize: 60, color: INK, padding: "14px 40px 16px" }}>onikofagia 💅</div>
      </div>
      {t >= BEATS.people - 0.2 ? (
        <div style={{ ...PANEL, position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "18px 26px 34px" }}>
          <div style={{ display: "flex", gap: 10 }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <PersonIcon key={i} on={i < 3 ? lit[i] : 0} />
            ))}
          </div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 34, color: "#ffffff" }}>
            ±3 dari 10 orang <span style={{ fontWeight: 600, fontStyle: "italic", fontSize: 28, opacity: 0.75 }}>(diperkirakan)</span>
          </div>
          <BrandTag style={CORNER} />
        </div>
      ) : null}
    </Row>
  );
};

/* ---------------------------------- p1 ---------------------------------- */

const LoadPanel: React.FC = () => {
  const t = useT();
  const from = BEATS.load - 0.1;
  const to = END("p1");
  if (t < from || t > to) return null;
  const s = pr(t, from, 0.3, EASE.back) * (1 - pr(t, to - 0.15, 0.15, EASE.in));
  const load = 0.99 * pr(t, BEATS.load, 0.9, EASE.out);
  let stress = 0;
  for (const [at, v] of STRESS) stress += (v - stress) * pr(t, at, 0.4, EASE.back);
  const meterColor = stress > 0.7 ? RED : stress > 0.35 ? "#ff9f1a" : GREEN;
  return (
    <div style={{ ...PANEL, position: "absolute", left: 80, right: 140, top: 660, transform: `scale(${s})`, transformOrigin: "50% 0%", fontFamily: FONT }}>
      <div style={{ color: "#ffffff", fontWeight: 800, fontSize: 36, marginBottom: 12 }}>📄 pengumuman nilai…</div>
      <div style={{ position: "relative", height: 50, borderRadius: 25, background: "rgba(255,255,255,0.15)", border: "4px solid #fff", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${load * 100}%`, background: YELLOW }} />
        <div style={{ position: "absolute", right: 16, top: 4, fontWeight: 900, fontSize: 32, color: INK }}>{Math.round(load * 100)}%</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 18 }}>
        <div style={{ color: "#ffffff", fontWeight: 800, fontSize: 32, width: 170 }}>stres 😬</div>
        <div style={{ flex: 1, height: 34, borderRadius: 17, background: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
          <div style={{ width: `${Math.max(0, Math.min(1, stress)) * 100}%`, height: "100%", background: meterColor, borderRadius: 17 }} />
        </div>
      </div>
      <div style={{ height: 20 }} />
      <BrandTag style={CORNER} />
    </div>
  );
};

/* ---------------------------------- p2 · p3 ---------------------------------- */

const Chip: React.FC<{ text: string; from: number; to: number; top: number; bg?: string; rot?: number }> = ({ text, from, to, top, bg = YELLOW, rot = -3 }) => {
  const t = useT();
  if (t < from || t > to) return null;
  const s = pr(t, from, 0.3, EASE.back) * (1 - pr(t, to - 0.15, 0.15, EASE.in));
  return (
    <Row top={top}>
      <div style={{ ...pillStyle, fontSize: 46, padding: "14px 32px", background: bg, transform: `scale(${s}) rotate(${rot}deg)` }}>{text}</div>
    </Row>
  );
};

/** label harga "camilan" yang menempel di kuku saat macro gigitan p3 */
const PriceTag: React.FC = () => {
  const t = useT();
  const from = BEATS.snack - 0.1;
  const to = END("p3") - 0.3;
  if (t < from || t > to) return null;
  const s = pr(t, from, 0.3, EASE.back) * (1 - pr(t, to - 0.15, 0.15, EASE.in));
  const p = mouthScreen(from + 0.35);
  return (
    <div style={{ position: "absolute", left: Math.max(120, p.x - 330), top: Math.min(1400, p.y + 120), transform: `rotate(-12deg) scale(${s})`, transformOrigin: "100% 0%" }}>
      <div style={{ position: "relative", background: YELLOW, border: `5px solid ${INK}`, borderRadius: "14px 40px 40px 14px", padding: "12px 36px 12px 46px", fontFamily: FONT, fontWeight: 900, fontSize: 44, color: INK, boxShadow: "0 7px 0 rgba(0,0,0,0.3)" }}>
        <div style={{ position: "absolute", left: 14, top: "50%", width: 18, height: 18, marginTop: -9, borderRadius: 9, background: "#fff", border: `4px solid ${INK}` }} />
        camilan 🍿 Rp0
      </div>
    </div>
  );
};

/* --------------------------------- bahaya --------------------------------- */

/** bingkai mikroskop saat macro kuku (lingkaran tajam, luar gelap) */
const Microscope: React.FC = () => {
  const t = useT();
  const z = ZOOMS[2];
  const k = Math.min(pr(t, z[0] + 0.1, 0.3, EASE.out), 1 - pr(t, z[1] - 0.05, 0.3, EASE.in));
  if (k <= 0.001) return null;
  const R = 440;
  const cx = 540;
  const cy = 1260;
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle ${R}px at ${cx}px ${cy}px, rgba(0,0,0,0) ${R - 4}px, rgba(8,10,24,${0.92 * k}) ${R}px)`,
        }}
      />
      <div style={{ position: "absolute", left: cx - R, top: cy - R, width: 2 * R, height: 2 * R, borderRadius: R, border: `14px solid rgba(220,230,255,${0.9 * k})`, boxShadow: `0 0 0 8px rgba(0,0,0,${0.5 * k})` }} />
      {[0, 90, 180, 270].map((a) => (
        <div key={a} style={{ position: "absolute", left: cx - 3, top: cy - R + 14, width: 6, height: 40, background: `rgba(220,230,255,${0.8 * k})`, transformOrigin: `3px ${R - 14}px`, transform: `rotate(${a}deg)` }} />
      ))}
      <div style={{ position: "absolute", left: 0, right: 0, top: cy + R + 24, textAlign: "center", opacity: k }}>
        <span style={{ ...pillStyle, fontSize: 36, padding: "10px 24px", background: "#ffffff" }}>🔬 perbesaran 1000×</span>
      </div>
      <div style={{ position: "absolute", left: cx + R - 470, top: cy - R - 30, opacity: pr(t, BEATS.germs + 0.6, 0.3) * k }}>
        <div style={{ ...pillStyle, fontSize: 40, padding: "12px 26px", background: "#9dff8a", border: `4px solid ${INK}`, transform: "rotate(4deg)" }}>hai 👋 kami kuman</div>
      </div>
    </>
  );
};

const CHECK_TOP = 640;
const CHECK_ROW = 96;
const CHECKS = [
  { label: "potong kuku pendek ✂️", at: () => BEATS.tick1 },
  { label: "kutek pahit 🧪", at: () => BEATS.tick2 },
  { label: "sibukin tangan 🧸", at: () => BEATS.tick3 },
];
/** titik kotak centang baris ke-i (untuk kursor) */
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



const TEAM_TOP = 660;
const TEAMS = [
  { label: "nonton horor 😱", at: () => BEATS.teamA, bg: YELLOW },
  { label: "nunggu 🕒", at: () => BEATS.teamB, bg: "#ffffff" },
  { label: "mikir 🤔", at: () => BEATS.teamC, bg: "#9dff8a" },
];
const teamPos = (i: number) => ({ x: 720, y: TEAM_TOP + i * 112 + 70 });

const Teams: React.FC = () => {
  const t = useT();
  const from = S("komen") + 0.25;
  const to = END("komen");
  if (t < from) return null;
  const out = 1 - pr(t, to - 0.15, 0.15, EASE.in);
  return (
    <Row top={TEAM_TOP} style={{ flexDirection: "column", alignItems: "center", gap: 18, opacity: out }}>
      {TEAMS.map((tm, i) => {
        const k = pr(t, from + i * 0.1, 0.3, EASE.back);
        const hit = t >= tm.at();
        const pop = hit ? 1 + 0.12 * (1 - pr(t, tm.at(), 0.3)) : 1;
        return (
          <div
            key={i}
            style={{ ...pillStyle, borderRadius: 26, fontSize: 42, padding: "18px 34px", background: tm.bg, border: `5px solid ${INK}`, transform: `scale(${k * pop})` }}
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
    <Scrim />
    <Vignette />
    <Microscope />
    <Stamp text="aaa!" at={BEATS.scream0} anchor={mouthScreen} dx={-300} dy={-30} size={84} color="#ffffff" rot={-8} />
    {CRUNCHES.map((c, i) => (
      <Stamp key={i} text="KRIUK!" at={c} anchor={mouthScreen} dx={250} dy={130} size={i === 1 ? 70 : 96} rot={8} />
    ))}
    <NameCard />
    <LoadPanel />
    <Chip text="🕒 antre 47 menit" from={BEATS.clock} to={END("p2")} top={640} />
    <Bubble text="tangan, kamu ngapain?! 🤨" from={BEATS.notice + 0.1} to={END("p2")} at={headScreen} size={38} />
    <Chip text="x² + 🤯 = ?" from={BEATS.think} to={BEATS.snack - 0.15} top={640} bg="#ffffff" rot={2} />
    <PriceTag />
    <Stamp text="krek! 🦷" at={BEATS.crack} dur={0.9} anchor={mouthScreen} dx={250} dy={-170} size={84} color="#ffffff" rot={10} />
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
    <Chip text="💛 pelan-pelan aja" from={BEATS.calm} to={END("serius")} top={760} bg="#ffffff" rot={-2} />
    <Teams />
    <TapCursor
      from={BEATS.teamA - 0.45}
      to={END("komen")}
      taps={[BEATS.teamA, BEATS.teamB, BEATS.teamC]}
      keys={[
        { t: BEATS.teamA - 0.45, ...teamPos(0), y: teamPos(0).y + 60 },
        { t: BEATS.teamA, ...teamPos(0) },
        { t: BEATS.teamB, ...teamPos(1) },
        { t: BEATS.teamC, ...teamPos(2) },
      ]}
    />
    {[BEATS.teamA, BEATS.teamB, BEATS.teamC].map((a, i) => (
      <TapRing key={`tr${i}`} at={a} {...teamPos(i)} />
    ))}
    <Letterbox />
  </>
);
