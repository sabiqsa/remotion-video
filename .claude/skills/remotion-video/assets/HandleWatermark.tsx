// Watermark anti re-upload: ikon logo + "@day.one.eight" yang MELOMPAT ke posisi
// aman lain setiap kali scene berganti (hard cut), lalu diam. Posisi yang
// berganti-ganti membuat watermark sulit di-crop/blur sekali jalan. Default memakai pill gelap
// transparan di belakangnya supaya tetap terbaca di latar terang (dinding krem, langit siang).

import React from "react";
import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND_FONT, BRAND_HANDLE, BRAND_LOGO } from "./BrandClosing";

export type WatermarkSpot = { left?: number; right?: number; top: number };

/** Titik aman default untuk 1080x1920 (di luar area teks, penanda, dan UI TikTok). */
export const DEFAULT_WATERMARK_SPOTS: WatermarkSpot[] = [
  { left: 90, top: 870 },
  { right: 160, top: 1250 },
  { left: 90, top: 1460 },
  { right: 160, top: 1000 },
];

export const HandleWatermark: React.FC<{
  /** detik-detik pergantian scene; watermark pindah di tiap titik ini */
  cuts: number[];
  spots?: WatermarkSpot[];
  /** default 0.75 dengan pill, 0.4 tanpa pill */
  opacity?: number;
  /** pill gelap transparan di belakang logo + handle (default: aktif) */
  pill?: boolean;
}> = ({ cuts, spots = DEFAULT_WATERMARK_SPOTS, opacity, pill = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const passed = cuts.filter((c) => c > 0 && t >= c).length;
  const spot = spots[passed % spots.length];

  return (
    <div
      style={{
        position: "absolute",
        top: spot.top,
        left: spot.left,
        right: spot.right,
        display: "flex",
        alignItems: "center",
        gap: 10,
        opacity: opacity ?? (pill ? 0.75 : 0.4),
        ...(pill ? { background: "rgba(10,12,28,0.5)", padding: "7px 18px 7px 9px", borderRadius: 999 } : {}),
        fontFamily: BRAND_FONT,
        fontWeight: 600,
        fontSize: 30,
        color: "#ffffff",
        textShadow: "0 2px 6px rgba(0,0,0,0.6)",
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))",
      }}
    >
      <Img src={staticFile(BRAND_LOGO)} style={{ width: 36, height: 36 }} />
      {BRAND_HANDLE}
    </div>
  );
};
