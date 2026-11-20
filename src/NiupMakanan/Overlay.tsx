// Lapisan 2D: sinematik (letterbox & fokus palsu saat macro, vignette, scrim) dan komedi/interaktif
// (stempel "fuuuh" / "HACHI!" / "+ kuman", chip "kata ibu", kartu data tiup lilin 1× → 15×,
// chip S. mutans, termometer, checklist 3 cara aman, 2 tombol komen). Muncul sekali lalu diam.

import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND_TAG_CORNER, BrandTag } from "../brand/BrandTag";
import { FONT, INK, YELLOW } from "../brand/WordText";
import { EASE } from "../lib/motion";
import { BEATS } from "./beats";
import { babyScreen, bowlScreen, headScreen, macroAt, mouthScreen, spoonScreen } from "./Scene3D";
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
  const k = 0.28 + 0.3 * macroAt(t);
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

/* ---------------------------------- p1 ---------------------------------- */

/** label kecil yang menempel di titik 3D (mis. kuman di sendok) */
const Tag: React.FC<{ text: string; from: number; to: number; at: (t: number) => { x: number; y: number }; dx?: number; dy?: number; bg?: string; rot?: number }> = ({
  text,
  from,
  to,
  at,
  dx = 0,
  dy = 0,
  bg = "#9dff8a",
  rot = 4,
}) => {
  const t = useT();
  if (t < from || t > to) return null;
  const s = pr(t, from, 0.3, EASE.back) * (1 - pr(t, to - 0.15, 0.15, EASE.in));
  const p = at(from + 0.35);
  const x = Math.max(300, Math.min(780, p.x + dx));
  const y = Math.max(640, Math.min(1420, p.y + dy));
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${s})` }}>
      <div style={{ ...pillStyle, fontSize: 40, padding: "12px 26px", background: bg, border: `4px solid ${INK}` }}>{text}</div>
    </div>
  );
};

/** kartu data studi tiup lilin: bakteri di kue 1× → ±15× */
const DataCard: React.FC = () => {
  const t = useT();
  const from = BEATS.cake - 0.05;
  const to = END("p1");
  if (t < from || t > to) return null;
  const s = pr(t, from, 0.35, EASE.back) * (1 - pr(t, to - 0.15, 0.15, EASE.in));
  const grow = pr(t, BEATS.x15, 0.7, EASE.out);
  const n = Math.round(1 + 14 * grow);
  const bar = (label: string, w: number, color: string, value: string) => (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 14 }}>
      <div style={{ width: 200, color: "#ffffff", fontWeight: 800, fontSize: 32 }}>{label}</div>
      <div style={{ flex: 1, height: 44, borderRadius: 22, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
        <div style={{ width: `${w * 100}%`, height: "100%", background: color, borderRadius: 22 }} />
      </div>
      <div style={{ width: 110, textAlign: "right", color, fontWeight: 900, fontSize: 44 }}>{value}</div>
    </div>
  );
  return (
    <div style={{ ...PANEL, position: "absolute", left: 80, right: 140, top: 720, transform: `scale(${s})`, transformOrigin: "50% 0%", fontFamily: FONT, padding: "22px 26px 40px" }}>
      <div style={{ color: "#ffffff", fontWeight: 800, fontSize: 36 }}>🎂 bakteri di kue setelah lilin…</div>
      {bar("nggak ditiup", 1 / 15, "#9dff8a", "1×")}
      {bar("ditiup 💨", Math.max(1 / 15, n / 15), RED, `${n}×`)}
      <div style={{ color: "rgba(255,255,255,0.7)", fontStyle: "italic", fontWeight: 600, fontSize: 26, marginTop: 14 }}>(rata-rata, studi lab · Dawson dkk. 2017)</div>
      <BrandTag style={CORNER} />
    </div>
  );
};

/* --------------------------------- twist --------------------------------- */

const Thermo: React.FC = () => {
  const t = useT();
  const from = sceneById("twist").start + 0.2;
  const to = END("twist");
  if (t < from || t > to) return null;
  const s = pr(t, from, 0.3, EASE.back) * (1 - pr(t, to - 0.15, 0.15, EASE.in));
  const k = pr(t, BEATS.cool, 0.8, EASE.inOut);
  const temp = Math.round(80 - 25 * k);
  const color = k > 0.5 ? "#ff9f1a" : RED;
  return (
    <div style={{ ...PANEL, position: "absolute", left: 230, right: 290, top: 650, transform: `scale(${s})`, transformOrigin: "50% 0%", fontFamily: FONT, display: "flex", alignItems: "center", gap: 20, padding: "18px 26px 34px" }}>
      <div style={{ position: "relative", width: 44, height: 150, borderRadius: 22, background: "rgba(255,255,255,0.15)", border: "4px solid #fff", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `${(temp / 100) * 100}%`, background: color }} />
      </div>
      <div>
        <div style={{ color: "#ffffff", fontWeight: 900, fontSize: 72 }}>{temp}°C</div>
        <div style={{ color: "rgba(255,255,255,0.75)", fontWeight: 700, fontSize: 30 }}>{k > 0.5 ? "cepat dingin ✓" : "panas banget 🔥"}</div>
      </div>
      <BrandTag style={CORNER} />
    </div>
  );
};

/* --------------------------------- tips --------------------------------- */

const CHECK_TOP = 640;
const CHECK_ROW = 96;
const CHECKS = [
  { label: "aduk dulu 🥄", at: () => BEATS.tick1 },
  { label: "sebar di piring 🍽️", at: () => BEATS.tick2 },
  { label: "tunggu sebentar ⏳", at: () => BEATS.tick3 },
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

const TEAM_TOP = 680;
const TEAMS = [
  { label: "tim tiup 💨", at: () => BEATS.teamA, bg: "#ffffff" },
  { label: "tim sabar ⏳", at: () => BEATS.teamB, bg: YELLOW },
];
const teamPos = (i: number) => ({ x: 700, y: TEAM_TOP + i * 120 + 70 });

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
            style={{ ...pillStyle, borderRadius: 26, fontSize: 46, padding: "18px 40px", background: tm.bg, border: `5px solid ${INK}`, transform: `scale(${k * pop})` }}
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
    {/* hook */}
    <Stamp text="fuuuh 💨" at={BEATS.blow0} dur={1.0} anchor={mouthScreen} dx={250} dy={-170} size={84} color="#ffffff" rot={8} />
    {/* ehem */}
    <Chip text="👵 kata ibu: jangan ditiup!" from={BEATS.scold} to={END("ehem")} top={650} bg="#ffffff" rot={-2} />
    <Bubble text="hah? kenapa? 😳" from={BEATS.scold + 0.4} to={END("ehem")} at={headScreen} size={38} />
    {/* p1 */}
    <Tag text="hai 👋 dari mulutmu" from={BEATS.germs1 + 0.2} to={BEATS.cake - 0.5} at={spoonScreen} dx={0} dy={-230} />
    <DataCard />
    {/* p2 */}
    <Tag text="🦷 S. mutans: biang gigi berlubang" from={BEATS.germs2 + 0.2} to={END("p2") - 0.3} at={babyScreen} dx={-120} dy={800} bg="#e2d4ff" rot={-3} />
    <Stamp text="pindah! 😢" at={BEATS.move2 + 0.3} dur={0.9} anchor={babyScreen} dx={-200} dy={260} size={72} color="#ffffff" rot={-6} />
    {/* p3 */}
    <Chip text="🤧 lagi flu" from={BEATS.flu} to={BEATS.sneeze + 0.1} top={660} />
    <Stamp text="HACHI!" at={BEATS.sneeze} dur={0.8} anchor={mouthScreen} dx={-230} dy={-120} size={110} rot={-10} />
    {/* twist */}
    <Thermo />
    <Stamp text="+ kuman 🦠" at={BEATS.plus} dur={1.2} anchor={bowlScreen} dx={230} dy={-60} size={78} color="#9dff8a" rot={8} />
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
    <Letterbox />
  </>
);
