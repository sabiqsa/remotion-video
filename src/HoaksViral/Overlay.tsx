// Lapisan 2D: sinematik (letterbox & fokus palsu saat macro kacamata, vignette, kilau lensa) dan
// interaktif (balapan HOAKS vs FAKTA, angka studi, balapan ke 1.500 orang, stiker BARU, emosi-meter,
// notifikasi BREAKING + kursor yang nyaris menekan "teruskan", cap HOAKS, checklist, tombol komen).
// Semua muncul sekali pada ketukan lalu diam.

import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND_TAG_CORNER, BrandTag } from "../brand/BrandTag";
import { FONT, INK, YELLOW } from "../brand/WordText";
import { EASE } from "../lib/motion";
import { BEATS } from "./beats";
import { dimAt, headScreen, LENS, macroAt, robotScreen, toScreen } from "./Scene3D";
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

/** Scrim gelap halus di sepertiga atas: teks putih tetap terbaca di dinding krem yang terang. */
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

/** Bar hitam atas-bawah selama macro kacamata. */
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

/** Vignette statis (lebih pekat saat redup & macro). */
const Vignette: React.FC = () => {
  const t = useT();
  const k = 0.22 + 0.35 * dimAt(t) + 0.25 * macroAt(t);
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


/** Kilau 4 sudut di lensa saat "ehem" (sekali putar lalu hilang). */
const Glint: React.FC = () => {
  const t = useT();
  const at = BEATS.glint;
  if (t < at || t > at + 0.6) return null;
  const s = pr(t, at, 0.2, EASE.back) * (1 - pr(t, at + 0.4, 0.2, EASE.in));
  const rot = 90 * pr(t, at, 0.6);
  const p = toScreen(at, [LENS[0] + 0.04, LENS[1] + 0.035, LENS[2] + 0.02]);
  return (
    <svg
      width={260}
      height={260}
      viewBox="-50 -50 100 100"
      style={{ position: "absolute", left: p.x - 130, top: p.y - 130, transform: `scale(${s}) rotate(${rot}deg)` }}
    >
      <path d="M0 -48 L9 -9 L48 0 L9 9 L0 48 L-9 9 L-48 0 L-9 -9 Z" fill="#ffffff" />
      <circle r={8} fill="#fffbe0" />
    </svg>
  );
};

/* --------------------------------- hook --------------------------------- */

const Lane: React.FC<{ label: string; bg: string; x: number; note?: string; noteOn?: number }> = ({ label, bg, x, note, noteOn = 0 }) => (
  <div style={{ position: "relative", height: 92, borderBottom: "4px dashed rgba(255,255,255,0.6)" }}>
    <div style={{ ...pillStyle, position: "absolute", left: x, top: 8, fontSize: 40, padding: "12px 26px", background: bg, border: `4px solid ${INK}` }}>
      {label}
    </div>
    {note ? (
      <div
        style={{
          position: "absolute",
          left: 250,
          top: 26,
          fontFamily: FONT,
          fontWeight: 600,
          fontStyle: "italic",
          fontSize: 32,
          color: "#ffffff",
          textShadow: "0 3px 0 rgba(0,0,0,0.45)",
          opacity: noteOn,
          whiteSpace: "nowrap",
        }}
      >
        {note}
      </div>
    ) : null}
  </div>
);

const RaceHook: React.FC = () => {
  const t = useT();
  const from = BEATS.rocket - 0.25;
  const to = END("hook");
  if (t < from || t > to) return null;
  const s = pr(t, from, 0.3, EASE.back) * (1 - pr(t, to - 0.15, 0.15, EASE.in));
  const run = pr(t, BEATS.rocket, 0.55, EASE.in);
  return (
    <div style={{ position: "absolute", left: 80, right: 140, top: 770, transform: `scale(${s})`, transformOrigin: "50% 0%" }}>
      <div style={{ position: "absolute", right: -10, top: -10, bottom: -10, width: 12, background: `repeating-linear-gradient(180deg, #fff 0 18px, ${INK} 18px 36px)` }} />
      <Lane label="🚀 HOAKS" bg={YELLOW} x={600 * run} />
      <Lane label="👟 FAKTA" bg="#ffffff" x={0} note="lagi ngiket tali sepatu…" noteOn={pr(t, BEATS.race, 0.3)} />
    </div>
  );
};

/* --------------------------------- ehem --------------------------------- */

const SmartChip: React.FC = () => {
  const t = useT();
  const from = BEATS.smart;
  const to = END("ehem");
  if (t < from || t > to) return null;
  const s = pr(t, from, 0.3, EASE.back) * (1 - pr(t, to - 0.15, 0.15, EASE.in));
  return (
    <Row top={640}>
      <div style={{ ...pillStyle, fontSize: 42, padding: "14px 30px", background: "#ffffff", border: `4px solid ${INK}`, transform: `scale(${s}) rotate(-3deg)` }}>
        mode sok pintar: <span style={{ background: GREEN, color: "#fff", borderRadius: 12, padding: "2px 12px" }}>ON</span> 🤓
      </div>
    </Row>
  );
};

/* --------------------------------- data --------------------------------- */

const fmt = (n: number) =>
  Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");

const DataCard: React.FC = () => {
  const t = useT();
  const from = BEATS.count - 0.15;
  const to = END("data");
  if (t < from || t > to) return null;
  const s = pr(t, from, 0.3, EASE.back) * (1 - pr(t, to - 0.15, 0.15, EASE.in));
  const n = 126000 * pr(t, BEATS.count, 0.9, EASE.out);
  const bars = [
    { label: "fakta", w: 1, at: BEATS.barFakta, bg: "#ffffff", tag: "1×" },
    { label: "hoaks", w: 1.7, at: BEATS.barHoaks, bg: YELLOW, tag: "+70% 🔁" },
  ];
  return (
    <div style={{ ...PANEL, position: "absolute", left: 80, right: 140, top: 800, transform: `scale(${s})`, transformOrigin: "50% 0%", fontFamily: FONT }}>
      <div style={{ textAlign: "center", color: "#ffffff", textShadow: "0 4px 0 rgba(0,0,0,0.45)" }}>
        <span style={{ fontWeight: 900, fontSize: 84 }}>{fmt(n)}</span>
        <span style={{ fontWeight: 700, fontSize: 36 }}> kabar diteliti</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
        {bars.map((b) => {
          const g = pr(t, b.at, 0.45, EASE.back);
          return (
            <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 16, opacity: t >= b.at ? 1 : 0 }}>
              <div style={{ width: 120, fontWeight: 800, fontSize: 38, color: "#ffffff", textShadow: "0 3px 0 rgba(0,0,0,0.45)", textAlign: "right" }}>{b.label}</div>
              <div style={{ height: 64, width: 330 * b.w * Math.max(0.02, g), background: b.bg, border: `4px solid ${INK}`, borderRadius: 14, boxShadow: "0 6px 0 rgba(0,0,0,0.3)" }} />
              <div style={{ ...pillStyle, fontSize: 32, padding: "6px 14px", background: "#ffffff", boxShadow: "none", opacity: g > 0.7 ? 1 : 0 }}>{b.tag}</div>
            </div>
          );
        })}
      </div>
      <div style={{ height: 22 }} />
      <BrandTag style={CORNER} />
    </div>
  );
};

/* --------------------------------- cepat --------------------------------- */

const Race1500: React.FC = () => {
  const t = useT();
  const from = BEATS.runA - 0.1;
  const to = END("cepat");
  if (t < from || t > to) return null;
  const s = pr(t, from, 0.3, EASE.back) * (1 - pr(t, to - 0.15, 0.15, EASE.in));
  const span = Math.max(0.6, BEATS.finish - BEATS.runA);
  const hoaks = pr(t, BEATS.runA, span, EASE.inOut);
  const fakta = pr(t, BEATS.runA, span * 6, (v) => v);
  const done = t >= BEATS.runA + span;
  const W = 580;
  const bar = (label: string, v: number, bg: string, tip: string) => (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 120, textAlign: "right", fontWeight: 800, fontSize: 38, color: "#fff", textShadow: "0 3px 0 rgba(0,0,0,0.45)" }}>{label}</div>
      <div style={{ position: "relative", width: W, height: 58, borderRadius: 29, background: "rgba(10,14,40,0.6)", border: "4px solid #fff" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: Math.max(50, W * v), background: bg, borderRadius: 26 }} />
        <div style={{ position: "absolute", left: Math.max(50, W * v) - 46, top: 2, fontSize: 40 }}>{tip}</div>
      </div>
    </div>
  );
  return (
    <div style={{ ...PANEL, position: "absolute", left: 50, right: 110, top: 720, transform: `scale(${s})`, transformOrigin: "50% 0%", fontFamily: FONT }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <div style={{ ...pillStyle, fontSize: 34, padding: "8px 20px", background: "#ffffff" }}>🏁 1.500 orang</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {bar("hoaks", hoaks, YELLOW, done ? "🏆" : "🚀")}
        {bar("fakta", fakta, "#ffffff", "🐌")}
      </div>
      <div style={{ height: 22 }} />
      <BrandTag style={CORNER} />
    </div>
  );
};

/* ------------------------------- p1 · p2 ------------------------------- */

const STAR = Array.from({ length: 24 }, (_, i) => {
  const r = i % 2 ? 64 : 100;
  const a = (i / 24) * Math.PI * 2;
  return `${Math.cos(a) * r},${Math.sin(a) * r}`;
}).join(" ");

const BaruSticker: React.FC = () => {
  const t = useT();
  const from = BEATS.baru;
  const to = END("p1");
  if (t < from || t > to) return null;
  const s = pr(t, from, 0.35, EASE.back) * (1 - pr(t, to - 0.15, 0.15, EASE.in));
  const chip = pr(t, BEATS.otak, 0.3, EASE.back);
  return (
    <Row top={630} style={{ alignItems: "center", gap: 24 }}>
      <div style={{ position: "relative", width: 220, height: 220, transform: `scale(${s}) rotate(${-12 + 12 * (1 - s)}deg)` }}>
        <svg width={220} height={220} viewBox="-110 -110 220 220" style={{ position: "absolute", inset: 0 }}>
          <polygon points={STAR} fill={RED} stroke={INK} strokeWidth={6} />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 50,
            color: YELLOW,
            WebkitTextStroke: `3px ${INK}`,
            paintOrder: "stroke",
          }}
        >
          BARU!!
        </div>
      </div>
      {t >= BEATS.otak ? <div style={{ ...pillStyle, fontSize: 40, padding: "12px 26px", background: "#ffffff", transform: `scale(${chip})` }}>🧠 doyan yang baru</div> : null}
    </Row>
  );
};

const EmoMeter: React.FC = () => {
  const t = useT();
  const from = BEATS.kaget - 0.2;
  const to = END("p2");
  if (t < from || t > to) return null;
  const s = pr(t, from, 0.3, EASE.back) * (1 - pr(t, to - 0.15, 0.15, EASE.in));
  const cols = [
    { icon: "😱", label: "kaget", at: BEATS.kaget, v: 0.9, bg: YELLOW },
    { icon: "🤢", label: "jijik", at: BEATS.jijik, v: 0.8, bg: GREEN },
  ];
  const share = pr(t, BEATS.share, 0.35, EASE.back);
  return (
    <Row top={630} style={{ gap: 40, alignItems: "flex-end", transform: `scale(${s})`, transformOrigin: "50% 0%" }}>
      {cols.map((c) => {
        const g = pr(t, c.at, 0.45, EASE.back);
        return (
          <div key={c.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 64, transform: `scale(${0.6 + 0.4 * g})` }}>{c.icon}</div>
            <div style={{ position: "relative", width: 80, height: 220, borderRadius: 40, background: "rgba(10,14,40,0.6)", border: "5px solid #fff", overflow: "hidden" }}>
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 220 * c.v * g, background: c.bg }} />
            </div>
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 34, color: "#fff", textShadow: "0 3px 0 rgba(0,0,0,0.45)" }}>{c.label}</div>
          </div>
        );
      })}
      {t >= BEATS.share ? (
        <div
          style={{
            ...pillStyle,
            fontSize: 52,
            padding: "22px 36px",
            background: YELLOW,
            border: `5px solid ${INK}`,
            marginBottom: 90,
            transform: `scale(${share * (1 + 0.15 * (1 - pr(t, BEATS.share, 0.4)))})`,
          }}
        >
          🔁 share!
        </div>
      ) : null}
      <BrandTag style={{ position: "absolute", left: 0, right: 0, bottom: -46, textAlign: "center" }} />
    </Row>
  );
};

/* ------------------------------ twist · tips ------------------------------ */

const NOTIF_TOP = 640;
/** tombol "teruskan" (perkiraan posisi layar, untuk kursor) */
const SEND = { x: 760, y: NOTIF_TOP + 255 };

const NotifCard: React.FC<{ stamp: number }> = ({ stamp }) => (
  <div style={{ position: "relative", width: 640, background: "#ffffff", border: `5px solid ${INK}`, borderRadius: 30, boxShadow: "0 10px 0 rgba(0,0,0,0.35)", fontFamily: FONT, overflow: "hidden" }}>
    <div style={{ background: "#25d366", color: "#fff", fontWeight: 800, fontSize: 28, padding: "10px 24px" }}>💬 grup keluarga besar (128)</div>
    <div style={{ padding: "18px 26px 10px", fontWeight: 900, fontSize: 46, color: RED }}>📢 BREAKING!!!</div>
    <div style={{ padding: "0 26px 18px", fontWeight: 700, fontSize: 36, color: INK }}>sebarkan sebelum dihapus‼️</div>
    <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 24px 22px" }}>
      <div style={{ ...pillStyle, fontSize: 34, padding: "12px 28px", background: "#25d366", color: "#fff", boxShadow: "none", border: `4px solid ${INK}` }}>teruskan ➤</div>
    </div>
    {stamp > 0 ? (
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) rotate(-14deg) scale(${2.2 - 1.2 * stamp})`,
          opacity: Math.min(1, stamp * 1.5),
          border: `8px solid ${RED}`,
          borderRadius: 16,
          color: RED,
          fontWeight: 900,
          fontSize: 92,
          padding: "0 30px",
          letterSpacing: 6,
          background: "rgba(255,255,255,0.75)",
        }}
      >
        HOAKS
      </div>
    ) : null}
  </div>
);

const Notif: React.FC = () => {
  const t = useT();
  const from = BEATS.notif;
  const to = BEATS.tick1 - 0.45;
  if (t < from || t > to) return null;
  const inn = pr(t, from, 0.35, EASE.back);
  const out = pr(t, to - 0.2, 0.2, EASE.in);
  const stamp = pr(t, BEATS.stamp, 0.18, EASE.in);
  return (
    <Row top={NOTIF_TOP} style={{ transform: `translateY(${-220 * (1 - inn) + 40 * out}px) scale(${1 - out})`, transformOrigin: "50% 0%" }}>
      <NotifCard stamp={stamp} />
    </Row>
  );
};

const CHECK_TOP = 640;
const CHECK_ROW = 96;
const CHECKS = [
  { label: "cek sumbernya 🔎", at: () => BEATS.tick1 },
  { label: "cek tanggalnya 📅", at: () => BEATS.tick2 },
  { label: "cari di situs cek fakta ✅", at: () => BEATS.tick3 },
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
const TL = { x: 420, y: TEAM_TOP + 80 };
const TR = { x: 800, y: TEAM_TOP + 80 };

const Teams: React.FC = () => {
  const t = useT();
  const from = S("komen") + 0.25;
  const to = END("komen");
  if (t < from) return null;
  const out = 1 - pr(t, to - 0.15, 0.15, EASE.in);
  const teams = [
    { label: "pernah 🙋", at: BEATS.teamA, bg: YELLOW },
    { label: "belum dong 😎", at: BEATS.teamB, bg: "#ffffff" },
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
      <BrandTag style={{ position: "absolute", left: 0, right: 0, bottom: -44, textAlign: "center" }} />
    </Row>
  );
};


/* ------------------------------ rangkai ------------------------------ */

export const Overlay: React.FC = () => (
  <>
    <FakeDof />
    <Scrim />
    <Vignette />
    <Glint />
    <RaceHook />
    <SmartChip />
    <DataCard />
    <Race1500 />
    <BaruSticker />
    <EmoMeter />
    <Bubble text="bukan aku 🙅" from={BEATS.bot + 0.1} to={BEATS.kita + 0.2} at={robotScreen} />
    <Bubble text="hehe… 😅" from={BEATS.kita + 0.1} to={END("p3")} at={headScreen} />
    <Notif />
    <TapCursor
      from={BEATS.notif + 0.35}
      to={BEATS.tick1 - 0.5}
      taps={[]}
      keys={[
        { t: BEATS.notif + 0.35, x: SEND.x - 140, y: SEND.y + 200 },
        { t: BEATS.hover, x: SEND.x - 40, y: SEND.y + 70 },
        { t: BEATS.stop, x: SEND.x - 20, y: SEND.y + 40 },
        { t: BEATS.stop + 0.5, x: SEND.x - 90, y: SEND.y + 150 },
      ]}
    />
    <Bubble text="kayak kenal… 🤨" from={BEATS.stop + 0.1} to={END("twist")} at={headScreen} />
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
    <Teams />
    <TapCursor
      from={BEATS.teamA - 0.45}
      to={END("komen")}
      taps={[BEATS.teamA, BEATS.teamB]}
      keys={[
        { t: BEATS.teamA - 0.45, x: TL.x, y: TL.y + 40 },
        { t: BEATS.teamA, ...TL },
        { t: BEATS.teamB, ...TR },
      ]}
    />
    <TapRing at={BEATS.teamA} {...TL} />
    <TapRing at={BEATS.teamB} {...TR} />
    <Letterbox />
  </>
);
