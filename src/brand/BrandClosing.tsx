// Closing logo + CTA "@day.one.eight" — scene penutup wajib di setiap video.
// Durasi: 4 detik (BRAND_CLOSING_SECONDS). Logo bulan terbit, bintang berkelip
// sekali, wordmark + CTA masuk, lalu aksi tap tombol FOLLOW -> FOLLOWING.
// Setelah 2.7 detik semuanya DIAM (tanpa floating).

import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { EASE, prog, punch, sec } from "../lib/motion";

export const BRAND_HANDLE = "@day.one.eight";
export const BRAND_CLOSING_SECONDS = 4;
export const BRAND_YELLOW = "#FFD400";
export const BRAND_BG = "#0B0B0C";
export const BRAND_FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';
/** File logo default di public/. */
export const BRAND_LOGO = "logo.png";

const WORDMARK = ["DAY.", "ONE.", "EIGHT"];
const LOGO_SIZE = 320;
// Posisi kilau, mengikuti bintang pada logo bulan (koordinat 0..1).
const SPARKLES = [
  { x: 0.44, y: 0.2, size: 46, color: "#FFFFFF" },
  { x: 0.6, y: 0.24, size: 30, color: "#FFE45C" },
  { x: 0.54, y: 0.38, size: 38, color: "#FFFFFF" },
];

const Sparkle: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <path
      d="M50 0 C54 34 66 46 100 50 C66 54 54 66 50 100 C46 66 34 54 0 50 C34 46 46 34 50 0 Z"
      fill={color}
    />
  </svg>
);

const Check: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ marginRight: 14 }}>
    <path
      d="M4 12.5 L9.5 18 L20 6"
      fill="none"
      stroke={color}
      strokeWidth={3.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

type Props = {
  /** false = sembunyikan ikon logo, hanya wordmark tipografi. */
  showLogo?: boolean;
  /** Ganti sumber logo (default staticFile("logo.png")). */
  logoSrc?: string;
  /** Ajakan di atas handle. */
  ctaLabel?: string;
  /** false = tanpa animasi tap tombol follow. */
  showFollowAction?: boolean;
  accent?: string;
};

export const BrandClosing: React.FC<Props> = ({
  showLogo = true,
  logoSrc,
  ctaLabel = "JANGAN LUPA FOLLOW",
  showFollowAction = true,
  accent = BRAND_YELLOW,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = (x: number) => sec(x, fps);
  const t = frame / fps; // detik

  // --- Logo: bulan "terbit" (mask lingkaran + putar + mendarat) ---
  const rise = prog(frame, 0, s(0.5), EASE.out);
  const logoPunch = punch(frame, s(0.8), fps, 0.05);

  // --- Teks & CTA ---
  const wordStart = showLogo ? 0.3 : 0.1;
  const rule = prog(frame, s(0.8), s(0.35), EASE.inOut);
  const label = prog(frame, s(0.95), s(0.3));
  const pill = prog(frame, s(1.05), s(0.35), EASE.inOut);
  const handle = prog(frame, s(1.15), s(0.3));

  // --- Aksi follow ---
  const TAP = 2.2;
  const btnIn = prog(frame, s(1.5), s(0.35));
  const followed = t >= TAP;
  const press = punch(frame, s(TAP - 0.05), fps, -0.07);
  const afterPunch = punch(frame, s(TAP + 0.12), fps, 0.06);
  const touchIn = prog(frame, s(1.9), s(0.28), EASE.out);
  const touchOut = prog(frame, s(2.45), s(0.25), EASE.in);
  const touchPress = punch(frame, s(TAP - 0.05), fps, -0.22);
  const ripple = prog(frame, s(TAP), s(0.45), EASE.out);
  const burst = prog(frame, s(TAP), s(0.35), EASE.out);
  const touchX = interpolate(touchIn, [0, 1], [320, 0]) + touchOut * 260;
  const touchY = interpolate(touchIn, [0, 1], [240, 0]) + touchOut * 320;

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND_BG, fontFamily: BRAND_FONT }}>
      <div
        style={{
          position: "absolute",
          left: 80,
          right: 140,
          top: showLogo ? 300 : 480,
        }}
      >
        {showLogo ? (
          <div
            style={{
              position: "relative",
              width: LOGO_SIZE,
              height: LOGO_SIZE,
              marginBottom: 40,
              transform: `scale(${logoPunch})`,
              transformOrigin: "left bottom",
            }}
          >
            <Img
              src={logoSrc ?? staticFile(BRAND_LOGO)}
              style={{
                width: LOGO_SIZE,
                height: LOGO_SIZE,
                clipPath: `circle(${rise * 72}% at 50% 50%)`,
                transform: `rotate(${(1 - rise) * -25}deg) scale(${1.15 - 0.15 * rise})`,
              }}
            />
            {SPARKLES.map((sp, i) => {
              const p = prog(frame, s(0.55 + i * 0.07), s(0.4), (x) => x);
              if (p <= 0 || p >= 1) return null;
              const k = Math.sin(p * Math.PI); // satu kali muncul-hilang
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: sp.x * LOGO_SIZE - sp.size / 2,
                    top: sp.y * LOGO_SIZE - sp.size / 2,
                    transform: `scale(${k * 1.2}) rotate(${p * 60}deg)`,
                    opacity: k,
                    filter: "drop-shadow(0 0 10px rgba(255,228,92,0.9))",
                  }}
                >
                  <Sparkle size={sp.size} color={sp.color} />
                </div>
              );
            })}
          </div>
        ) : null}

        {WORDMARK.map((w, i) => {
          const p = prog(frame, s(wordStart + i * 0.08), s(0.45));
          return (
            <div key={w} style={{ overflow: "hidden", lineHeight: 0.86 }}>
              <div
                style={{
                  fontSize: showLogo ? 150 : 230,
                  fontWeight: 900,
                  letterSpacing: showLogo ? -5 : -8,
                  color: accent,
                  transform: `translateY(${(1 - p) * 105}%)`,
                }}
              >
                {w}
              </div>
            </div>
          );
        })}

        {/* garis aksen */}
        <div
          style={{
            marginTop: 40,
            height: 10,
            width: 520,
            background: accent,
            transform: `scaleX(${rule})`,
            transformOrigin: "left center",
          }}
        />

        {/* label CTA */}
        <div style={{ marginTop: 52, overflow: "hidden" }}>
          <div
            style={{
              fontSize: 40,
              fontWeight: 800,
              letterSpacing: 4,
              color: "#ffffff",
              transform: `translateX(${(1 - label) * -100}%)`,
            }}
          >
            {ctaLabel}
          </div>
        </div>

        {/* handle */}
        <div
          style={{
            marginTop: 20,
            display: "inline-block",
            background: accent,
            padding: "18px 34px 20px",
            borderRadius: 14,
            clipPath: `inset(0 ${(1 - pill) * 100}% 0 0 round 14px)`,
          }}
        >
          <div
            style={{
              fontSize: 76,
              fontWeight: 900,
              letterSpacing: -1,
              color: BRAND_BG,
              opacity: handle,
              transform: `translateY(${(1 - handle) * 30}px)`,
            }}
          >
            {BRAND_HANDLE}
          </div>
        </div>

        {/* tombol follow + aksi tap */}
        {showFollowAction ? (
          <div style={{ marginTop: 26, overflow: "visible", position: "relative", width: 440 }}>
            <div style={{ overflow: "hidden", paddingBottom: 8 }}>
              <div
                style={{
                  transform: `translateY(${(1 - btnIn) * 110}%) scale(${press * afterPunch})`,
                  transformOrigin: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 440,
                  height: 104,
                  boxSizing: "border-box",
                  borderRadius: 52,
                  border: `5px solid ${accent}`,
                  background: followed ? accent : "transparent",
                  color: followed ? BRAND_BG : accent,
                  fontSize: 46,
                  fontWeight: 900,
                  letterSpacing: 2,
                }}
              >
                {followed ? <Check size={44} color={BRAND_BG} /> : <span style={{ marginRight: 14 }}>+</span>}
                {followed ? "FOLLOWING" : "FOLLOW"}
              </div>
            </div>

            {/* kilau garis memancar saat tap */}
            {burst > 0 && burst < 1
              ? new Array(6).fill(0).map((_, i) => {
                  const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
                  const r = 150 + burst * 70;
                  return (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        left: 220 + Math.cos(a) * r * 1.25 - 5,
                        top: 52 + Math.sin(a) * r * 0.55 - 23,
                        width: 10,
                        height: 46 * (1 - burst * 0.6),
                        borderRadius: 4,
                        background: accent,
                        opacity: 1 - burst,
                        transform: `rotate(${(a * 180) / Math.PI + 90}deg)`,
                      }}
                    />
                  );
                })
              : null}

            {/* riak sentuhan */}
            {ripple > 0 && ripple < 1 ? (
              <div
                style={{
                  position: "absolute",
                  left: 220 - 60,
                  top: 52 - 60,
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  border: "6px solid rgba(255,255,255,0.9)",
                  transform: `scale(${0.4 + ripple * 2})`,
                  opacity: 1 - ripple,
                }}
              />
            ) : null}

            {/* titik sentuh */}
            {touchIn > 0 && touchOut < 1 ? (
              <div
                style={{
                  position: "absolute",
                  left: 220 - 40 + touchX,
                  top: 52 - 40 + touchY,
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  background: "rgba(255,255,255,0.92)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                  transform: `scale(${touchPress})`,
                  opacity: Math.min(touchIn * 1.5, 1 - touchOut),
                }}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
