// Lapisan 2D: sinematik (letterbox & fokus palsu saat macro, vignette, scrim, kilat syok) dan
// komedi/interaktif (label harga mie dicoret 3.500 → 4.000, stempel "HAH?! 😱" / "diborong!" /
// "+34%?!", chip biaya jatuh menumpuk, meter uang beredar vs nilai uang, kartu hitungan 10 tahun,
// checklist 3 tips, 2 tombol komen). Muncul sekali lalu diam.

import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND_TAG_CORNER, BrandTag } from "../brand/BrandTag";
import { FONT, INK, YELLOW } from "../brand/WordText";
import { EASE } from "../lib/motion";
import { BEATS, PERTALITE, PRICES } from "./beats";
import { calScreen, faceScreen, headScreen, macroAt, moneyScreen, rupiah, shelfLScreen, shelfScreen, shockAt, tagScreen } from "./Scene3D";
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
      background: "linear-gradient(180deg, rgba(20,12,6,0.7) 0%, rgba(20,12,6,0.5) 55%, rgba(20,12,6,0) 100%)",
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

/* ---------------------------------- hook ---------------------------------- */

/** kilat putih sekali saat syok (bersama sting) */
const ShockFlash: React.FC = () => {
  const t = useT();
  const k = [BEATS.shock0, BEATS.third].reduce((m, a) => Math.max(m, t >= a && t < a + 0.22 ? 1 - pr(t, a, 0.22) : 0), 0);
  if (k <= 0) return null;
  return <div style={{ position: "absolute", inset: 0, background: "#ffffff", opacity: k * 0.55 }} />;
};

/** garis konsentrasi manga di sekeliling wajah selama syok (statis, muncul sekali) */
const SpeedLines: React.FC = () => {
  const t = useT();
  const k = shockAt(t) * macroAt(t);
  if (k <= 0.05) return null;
  const c = faceScreen(t);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: k * 0.55 }}>
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

/** label harga 2D di mie: Rp3.000 dicoret → Rp3.500 pop merah */
const PriceSticker: React.FC = () => {
  const t = useT();
  const from = BEATS.grab + 0.25;
  const to = BEATS.sigh0 + 0.3;
  if (t < from || t > to) return null;
  const s = pr(t, from, 0.25, EASE.back) * (1 - pr(t, to - 0.12, 0.12, EASE.in));
  // posisi tetap di kanan bawah (dekat mie), jadi tidak menutup wajah saat dolly zoom
  const p = { x: 720, y: 1640 };
  const strike = pr(t, BEATS.hike0, 0.18);
  const next = pr(t, BEATS.hike0 + 0.08, 0.25, EASE.back);
  return (
    <div style={{ position: "absolute", left: p.x + 60, top: p.y - 170, transform: `translate(-50%, -50%) rotate(-6deg) scale(${s * 0.9})` }}>
      <div style={{ ...pillStyle, fontSize: 54, padding: "12px 30px", background: "#ffffff", border: `5px solid ${INK}`, position: "relative" }}>
        {rupiah(PRICES[0][1])}
        <div style={{ position: "absolute", left: 18, top: "50%", height: 8, width: `${(100 - 12) * strike}%`, background: RED, borderRadius: 4 }} />
      </div>
      <div style={{ ...pillStyle, fontSize: 64, padding: "12px 30px", background: YELLOW, color: RED, border: `5px solid ${INK}`, marginTop: 16, transform: `scale(${next}) rotate(4deg)` }}>
        {rupiah(PRICES[1][1])} ⬆
      </div>
    </div>
  );
};

/* ---------------------------------- p2 ---------------------------------- */

const COSTS = [
  { label: `⛽ pertalite ${rupiah(PERTALITE[0])} → ${rupiah(PERTALITE[1])}`, at: () => BEATS.fuel, bg: "#ffd0d6" },
  { label: "🌾 bahan baku", at: () => BEATS.raw, bg: "#ffe58a" },
  { label: "👷 upah", at: () => BEATS.wage, bg: "#c9f0ff" },
];
/** chip biaya jatuh dari atas dan menumpuk di atas label harga */
const CostStack: React.FC = () => {
  const t = useT();
  const from = BEATS.fuel - 0.1;
  const to = END("p2");
  if (t < from || t > to) return null;
  const out = 1 - pr(t, to - 0.15, 0.15, EASE.in);
  const base = tagScreen(BEATS.fuel + 0.3);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, opacity: out }}>
      {COSTS.map((c, i) => {
        const a = c.at();
        if (t < a - 0.25) return null;
        const fall = pr(t, a - 0.25, 0.25, EASE.in);
        const y = Math.max(640, base.y - 260 - i * 92);
        const bounce = t > a ? Math.sin(pr(t, a, 0.2, (v) => v) * Math.PI) * 14 : 0;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: Math.max(260, Math.min(800, base.x)),
              top: 300 + (y - 300) * fall - bounce,
              transform: `translate(-50%, -50%) rotate(${(i - 1) * 4}deg)`,
            }}
          >
            <div style={{ ...pillStyle, fontSize: 44, padding: "12px 28px", background: c.bg, border: `4px solid ${INK}` }}>{c.label} ⬆</div>
          </div>
        );
      })}
    </div>
  );
};

/* ---------------------------------- p3 ---------------------------------- */

/** meter: uang beredar naik, barang tetap, nilai uang turun */
const MoneyMeters: React.FC = () => {
  const t = useT();
  const from = BEATS.money - 0.05;
  const to = END("p3");
  if (t < from || t > to) return null;
  const s = pr(t, from, 0.35, EASE.back) * (1 - pr(t, to - 0.15, 0.15, EASE.in));
  const money = 0.35 + 0.6 * pr(t, BEATS.more, 1.0, EASE.inOut);
  const goodsIn = pr(t, BEATS.goods - 0.2, 0.3, EASE.back);
  const valueIn = pr(t, BEATS.drop - 0.6, 0.3, EASE.back);
  const value = 0.8 - 0.5 * pr(t, BEATS.drop, 0.6, EASE.inOut);
  const row = (label: string, v: number, color: string, k: number) => (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 14, opacity: k, transform: `scale(${0.6 + 0.4 * k})`, transformOrigin: "0% 50%" }}>
      <div style={{ width: 300, color: "#ffffff", fontWeight: 800, fontSize: 34 }}>{label}</div>
      <div style={{ flex: 1, height: 42, borderRadius: 21, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
        <div style={{ width: `${v * 100}%`, height: "100%", background: color, borderRadius: 21 }} />
      </div>
    </div>
  );
  return (
    <div style={{ ...PANEL, position: "absolute", left: 80, right: 140, top: 700, transform: `scale(${s})`, transformOrigin: "50% 0%", fontFamily: FONT, padding: "8px 26px 40px" }}>
      {row("💵 uang beredar", money, GREEN, 1)}
      {row("📦 jumlah barang", 0.5, "#9fb3c8", goodsIn)}
      {row("💪 nilai uang", value, value > 0.5 ? GREEN : RED, valueIn)}
      <BrandTag style={CORNER} />
    </div>
  );
};

/* --------------------------------- twist --------------------------------- */

/** kartu hitungan: inflasi 3%/tahun → mie Rp4.000 hari ini jadi ±Rp5.400 dalam 10 tahun */
const CalcCard: React.FC = () => {
  const t = useT();
  const from = BEATS.pct - 0.05;
  // keluar sebelum crash zoom "sepertiga" supaya wajah syok tidak tertutup
  const to = BEATS.third - 0.15;
  if (t < from || t > to) return null;
  const s = pr(t, from, 0.35, EASE.back) * (1 - pr(t, to - 0.15, 0.15, EASE.in));
  const grow = pr(t, BEATS.years + 0.2, 0.9, EASE.inOut);
  const NOW = PRICES[PRICES.length - 1][1];
  const later = Math.round((NOW * Math.pow(1.03, 10 * grow)) / 100) * 100;
  const bar = (label: string, v: number, txt: string, color: string, k = 1) => (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 14, opacity: k }}>
      <div style={{ width: 150, color: "#ffffff", fontWeight: 800, fontSize: 36 }}>{label}</div>
      <div style={{ flex: 1, height: 44, borderRadius: 22, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
        <div style={{ width: `${v * 100}%`, height: "100%", background: color, borderRadius: 22 }} />
      </div>
      <div style={{ width: 210, textAlign: "right", color, fontWeight: 900, fontSize: 40 }}>{txt}</div>
    </div>
  );
  return (
    <div style={{ ...PANEL, position: "absolute", left: 80, right: 140, top: 700, transform: `scale(${s})`, transformOrigin: "50% 0%", fontFamily: FONT, padding: "22px 26px 40px" }}>
      <div style={{ color: "#ffffff", fontWeight: 800, fontSize: 36 }}>📈 inflasi 3% / tahun · 1 bungkus mie</div>
      {bar("2026", 0.6, rupiah(NOW), "#9fb3c8")}
      {bar("2036", 0.6 * (later / NOW), `±${rupiah(later)}`, RED, pr(t, BEATS.years, 0.3))}
      <div style={{ color: "rgba(255,255,255,0.7)", fontStyle: "italic", fontWeight: 600, fontSize: 26, marginTop: 14 }}>(ilustrasi hitungan: 1,03¹⁰ ≈ 1,34)</div>
      <BrandTag style={CORNER} />
    </div>
  );
};

/* --------------------------------- tips --------------------------------- */

const CHECK_TOP = 640;
const CHECK_ROW = 96;
const CHECKS = [
  { label: "belanja sesuai butuh 🛒", at: () => BEATS.tick1 },
  { label: "simpan > inflasi 📈", at: () => BEATS.tick2 },
  { label: "tambah skill 💪", at: () => BEATS.tick3 },
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
  { label: "goceng 🍭", at: () => BEATS.teamA, bg: "#ffffff" },
  { label: "ceban 🍔", at: () => BEATS.teamB, bg: YELLOW },
];
const teamPos = (i: number) => ({ x: 720, y: TEAM_TOP + i * 120 + 70 });

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
    <SpeedLines />
    <Scrim />
    <Vignette />
    {/* hook */}
    <PriceSticker />
    <Stamp text="HAH?! 😱" at={BEATS.shock0} dur={1.0} anchor={faceScreen} dx={0} dy={-430} size={110} color={YELLOW} rot={-7} />
    <Chip text="💼 gaji: tetap segini 🥲" from={BEATS.sigh0 + 0.1} to={END("hook")} top={640} bg="#ffffff" rot={-2} />
    {/* ehem */}
    <Stamp text="inflasi 📈" at={BEATS.infl} dur={1.1} anchor={headScreen} dx={0} dy={-40} size={90} color={YELLOW} rot={-5} />
    {/* p1 */}
    <Stamp text="diborong! 🛒" at={BEATS.crowd + 0.3} dur={1.1} anchor={shelfScreen} dx={-80} dy={0} size={80} color="#ffffff" rot={6} />
    <Stamp text="stok terbatas 📦" at={BEATS.limit} dur={1.0} anchor={shelfLScreen} dx={60} dy={120} size={60} color={YELLOW} rot={-5} />
    <Stamp text="harga ⬆" at={BEATS.hike1} dur={1.1} anchor={tagScreen} dx={0} dy={-160} size={80} color={RED} rot={-6} />
    {/* p2 */}
    <CostStack />
    <Stamp text="harga jual ⬆" at={BEATS.hike2} dur={1.0} anchor={tagScreen} dx={0} dy={330} size={100} color={RED} rot={5} />
    {/* p3 */}
    <MoneyMeters />
    <Stamp text="💸 makin banyak" at={BEATS.more} dur={1.0} anchor={moneyScreen} dx={0} dy={160} size={58} color={GREEN} rot={-4} />
    {/* twist */}
    <CalcCard />
    <Stamp text="+10 tahun ⏩" at={BEATS.years + 0.2} dur={0.9} anchor={calScreen} dx={0} dy={190} size={60} color={YELLOW} rot={-6} />
    <Stamp text="+34%?! 😱" at={BEATS.third} dur={1.1} anchor={faceScreen} dx={0} dy={-430} size={110} color={RED} rot={6} />
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
    <ShockFlash />
    <Letterbox />
  </>
);
