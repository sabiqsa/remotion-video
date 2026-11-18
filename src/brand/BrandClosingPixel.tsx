// Varian pixel art dari closing @day.one.eight (eksperimen).
// Semua gerak dikuantisasi ke 12 langkah/detik (gaya sprite), rata tengah.
// Durasi 4 detik. Setelah ~2.8 detik semuanya DIAM.

import { loadFont } from "@remotion/google-fonts/PixelifySans";
import { Audio } from "@remotion/media";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  cancelRender,
  continueRender,
  delayRender,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { stepped } from "../lib/motion";
import { BRAND_BG, BRAND_HANDLE, BRAND_LOGO, BRAND_YELLOW } from "./BrandClosing";

const { fontFamily: PIXEL_FONT } = loadFont("normal", {
  weights: ["500", "700"],
  subsets: ["latin"],
});

export const PIXEL_CLOSING_SECONDS = 4;
const STEPS = 12; // langkah per detik
const P = 8; // ukuran 1 "pixel" layar dalam px
const LOGO = 320;
const SHADOW = "#9C7F00";

/* ------------------------------ helpers ------------------------------ */

/** Index langkah sejak `start` detik (negatif = belum mulai). */
const stepSince = (T: number, start: number) => Math.floor((T - start) * STEPS + 1e-6);

/** Pop bergaya sprite: muncul kecil, kebesaran sedikit, lalu pas. */
const pop = (T: number, start: number) => {
  const i = stepSince(T, start);
  if (i < 0) return 0;
  return [0.5, 1.12, 1][i] ?? 1;
};

/** Kotak dengan sudut "bertangga" khas pixel art + bayangan keras di bawah. */
const pixelBox = (bg: string, shadow: string | null, depth = P) => ({
  background: bg,
  boxShadow: [
    `0 -${P}px 0 0 ${bg}`,
    `0 ${P}px 0 0 ${bg}`,
    `-${P}px 0 0 0 ${bg}`,
    `${P}px 0 0 0 ${bg}`,
    ...(shadow ? [`0 ${P + depth}px 0 0 ${shadow}`] : []),
  ].join(", "),
});

/* ------------------------------ sprites ------------------------------ */

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

const CHECK = ["......##", ".....##.", "##..##..", ".####...", "..##...."];

const Sprite: React.FC<{ map: string[]; px: number; colors: Record<string, string> }> = ({
  map,
  px,
  colors,
}) => (
  <svg
    width={map[0].length * px}
    height={map.length * px}
    style={{ display: "block", shapeRendering: "crispEdges" }}
  >
    {map.flatMap((row, y) =>
      row.split("").map((c, x) =>
        colors[c] ? (
          <rect key={`${x}-${y}`} x={x * px} y={y * px} width={px} height={px} fill={colors[c]} />
        ) : null,
      ),
    )}
  </svg>
);

/** Kilau plus dari 5 kotak pixel. */
const PlusSparkle: React.FC<{ px: number; color: string }> = ({ px, color }) => (
  <Sprite map={[".#.", "###", ".#."]} px={px} colors={{ "#": color }} />
);

/* ------------------------------ logo pixel ------------------------------ */

/** Logo digambar ulang di grid N×N lalu diperbesar tanpa smoothing. */
const PixelLogo: React.FC<{ src: string; grid: number; size: number }> = ({ src, grid, size }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [handle] = useState(() => delayRender("Memuat logo pixel"));

  useEffect(() => {
    const i = new Image();
    i.onload = () => {
      setImg(i);
      continueRender(handle);
    };
    i.onerror = () => cancelRender(new Error(`Gagal memuat logo: ${src}`));
    i.src = src;
  }, [src, handle]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img || grid <= 0) return;
    const small = document.createElement("canvas");
    small.width = grid;
    small.height = grid;
    const sctx = small.getContext("2d");
    const ctx = canvas.getContext("2d");
    if (!sctx || !ctx) return;
    sctx.drawImage(img, 0, 0, grid, grid);
    // Alpha dibuat tegas (0/255) supaya tepinya kotak-kotak rapi.
    const data = sctx.getImageData(0, 0, grid, grid);
    for (let k = 3; k < data.data.length; k += 4) {
      data.data[k] = data.data[k] > 110 ? 255 : 0;
    }
    sctx.putImageData(data, 0, 0);
    ctx.clearRect(0, 0, size, size);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(small, 0, 0, size, size);
  }, [img, grid, size]);

  return <canvas ref={canvasRef} width={size} height={size} style={{ display: "block" }} />;
};

/* ------------------------------ komponen ------------------------------ */

const WORDMARK = ["day.", "one.", "eight"];
const SPARKLES = [
  { x: 0.44, y: 0.2, start: 0.6 },
  { x: 0.6, y: 0.25, start: 0.68 },
  { x: 0.54, y: 0.38, start: 0.76 },
];

/** Suara ajakan bawaan closing ("follow day one eight untuk info lainnya"). */
export const CLOSING_VOICE = "sfx/closing-vo.wav";

type Props = {
  /** false = tanpa efek suara klik. */
  sound?: boolean;
  /** false = tanpa suara ajakan; atau path lain di public/ untuk mengganti suaranya. */
  voice?: boolean | string;
  logoSrc?: string;
  ctaLabel?: string;
  accent?: string;
};

export const BrandClosingPixel: React.FC<Props> = ({
  sound = true,
  voice = true,
  logoSrc,
  ctaLabel = "jangan lupa follow",
  accent = BRAND_YELLOW,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = stepped(frame, fps, STEPS) / fps; // waktu terkuantisasi (detik)

  // Logo: resolusi naik bertahap 4 -> 8 -> 16 -> 32 lalu berhenti.
  const grid = T < 0 ? 0 : T < 0.12 ? 4 : T < 0.25 ? 8 : T < 0.38 ? 16 : 32;

  // Wordmark diketik 2 huruf per langkah.
  const totalChars = WORDMARK.join("").length;
  const typed = Math.max(0, Math.min(totalChars, (stepSince(T, 0.45) + 1) * 2));
  const typingDone = typed >= totalChars;
  const cursorOn = !typingDone && stepSince(T, 0.45) >= 0 && Math.floor(T * 6) % 2 === 0;

  // Garis blok: 13 blok, muncul dari tengah 1 blok tiap sisi per langkah.
  const RULE_BLOCKS = 13;
  const ruleHalf = Math.max(0, Math.min(6, stepSince(T, 1.0)));

  const labelOn = T >= 1.25;
  const labelShift = stepSince(T, 1.25) === 0 ? P : 0;
  const pillScale = pop(T, 1.35);
  const btnScale = pop(T, 1.7);

  // Aksi tap
  const TAP = 2.33;
  const followed = T >= TAP + 1 / STEPS;
  const pressed = T >= TAP && T < TAP + 2 / STEPS;
  const HAND_PATH: [number, number][] = [
    [300, 260],
    [190, 160],
    [80, 60],
    [24, 18],
  ];
  const handStep = stepSince(T, 2.0);
  const handLeave = stepSince(T, 2.6);
  let handPos: [number, number] | null = null;
  if (handLeave >= 0) {
    handPos = handLeave === 0 ? [80, 120] : handLeave === 1 ? [200, 300] : null;
  } else if (handStep >= 0) {
    handPos = HAND_PATH[Math.min(handStep, HAND_PATH.length - 1)];
  }
  const handDown = pressed ? 8 : 0;
  const burstStep = stepSince(T, TAP + 1 / STEPS);
  // Frame pertama saat visual tap muncul (mengikuti kuantisasi langkah).
  const tapFrame = Math.ceil((TAP * fps) / (fps / STEPS) - 1e-6) * (fps / STEPS);

  const center: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  };

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND_BG, fontFamily: PIXEL_FONT }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 290, ...center }}>
        {/* logo */}
        <div style={{ position: "relative", width: LOGO, height: LOGO }}>
          {grid > 0 ? (
            <PixelLogo src={logoSrc ?? staticFile(BRAND_LOGO)} grid={grid} size={LOGO} />
          ) : null}
          {SPARKLES.map((sp, i) => {
            const k = stepSince(T, sp.start);
            // berkedip: nyala, mati, nyala, lalu hilang
            const on = k === 0 || k === 1 || k === 3;
            if (!on) return null;
            const px = k === 1 ? 10 : 8;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: sp.x * LOGO - 1.5 * px,
                  top: sp.y * LOGO - 1.5 * px,
                }}
              >
                <PlusSparkle px={px} color={i === 1 ? accent : "#ffffff"} />
              </div>
            );
          })}
        </div>

        {/* wordmark diketik */}
        <div style={{ marginTop: 44, ...center }}>
          {WORDMARK.map((w, i) => {
            const before = WORDMARK.slice(0, i).join("").length;
            const show = Math.max(0, Math.min(w.length, typed - before));
            const active = show < w.length && typed >= before;
            return (
              <div
                key={w}
                style={{
                  fontSize: 128,
                  fontWeight: 700,
                  lineHeight: 0.95,
                  color: accent,
                  whiteSpace: "pre",
                }}
              >
                <span style={{ position: "relative" }}>
                  {w.slice(0, show)}
                  {active && cursorOn ? (
                    <span
                      style={{
                        position: "absolute",
                        left: "100%",
                        bottom: 14,
                        width: 44,
                        height: 72,
                        background: accent,
                      }}
                    />
                  ) : null}
                </span>
                <span style={{ visibility: "hidden" }}>{w.slice(show)}</span>
              </div>
            );
          })}
        </div>

        {/* garis blok */}
        <div style={{ display: "flex", gap: 6, marginTop: 40, height: 16 }}>
          {new Array(RULE_BLOCKS).fill(0).map((_, i) => {
            const d = Math.abs(i - (RULE_BLOCKS - 1) / 2);
            const on = stepSince(T, 1.0) >= 0 && d <= ruleHalf;
            return (
              <div
                key={i}
                style={{ width: 34, height: 16, background: on ? accent : "transparent" }}
              />
            );
          })}
        </div>

        {/* label */}
        <div
          style={{
            marginTop: 44,
            fontSize: 44,
            fontWeight: 500,
            letterSpacing: 1,
            color: "#ffffff",
            visibility: labelOn ? "visible" : "hidden",
            transform: `translateY(${labelShift}px)`,
          }}
        >
          {ctaLabel}
        </div>

        {/* handle */}
        <div
          style={{
            marginTop: 30,
            padding: "14px 30px 10px",
            transform: `scale(${pillScale})`,
            ...pixelBox(accent, null),
          }}
        >
          <div style={{ fontSize: 64, fontWeight: 700, color: BRAND_BG, letterSpacing: 0 }}>
            {BRAND_HANDLE}
          </div>
        </div>

        {/* tombol follow + aksi */}
        <div style={{ position: "relative", marginTop: 52 }}>
          <div
            style={{
              transform: `scale(${btnScale}) translateY(${pressed ? 8 : 0}px)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 430,
              height: 88,
              ...pixelBox(
                followed ? accent : "#FFFFFF",
                pressed ? null : followed ? SHADOW : "#8E8E93",
                pressed ? 0 : P,
              ),
              color: BRAND_BG,
              fontSize: 50,
              fontWeight: 700,
            }}
          >
            {followed ? (
              <div style={{ marginRight: 18 }}>
                <Sprite map={CHECK} px={6} colors={{ "#": BRAND_BG }} />
              </div>
            ) : (
              <span style={{ marginRight: 16 }}>+</span>
            )}
            {followed ? "following" : "follow"}
          </div>

          {/* kotak pixel memancar saat tap */}
          {burstStep >= 0 && burstStep < 4
            ? new Array(8).fill(0).map((_, i) => {
                const a = (i / 8) * Math.PI * 2;
                const r = 70 + burstStep * 40;
                const size = burstStep === 3 ? 8 : 16;
                return (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      left: 215 + Math.cos(a) * r * 2.6 - size / 2,
                      top: 44 + Math.sin(a) * r * 0.9 - size / 2,
                      width: size,
                      height: size,
                      background: i % 2 ? accent : "#ffffff",
                    }}
                  />
                );
              })
            : null}

          {/* kursor tangan pixel */}
          {handPos ? (
            <div
              style={{
                position: "absolute",
                left: 215 - 4.5 * 7 + handPos[0],
                top: 44 + handPos[1] + handDown,
              }}
            >
              <Sprite map={HAND} px={7} colors={{ "#": "#111111", W: "#ffffff" }} />
            </div>
          ) : null}
        </div>
      </div>

      {voice ? (
        <Sequence from={Math.round(0.25 * fps)} name="suara ajakan" layout="none">
          <Audio src={staticFile(typeof voice === "string" ? voice : CLOSING_VOICE)} />
        </Sequence>
      ) : null}
      {sound ? (
        <Sequence from={tapFrame} name="sfx klik" layout="none">
          <Audio src={staticFile("sfx/click.wav")} volume={0.6} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
