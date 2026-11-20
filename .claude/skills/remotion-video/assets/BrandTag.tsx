// Tanda kecil "@day.one.eight" untuk ditempel di panel interaktif (grafik, meter, checklist,
// tombol komen) dan di bar letterbox saat macro. Lapis ke-3 & ke-4 watermark anti re-upload.

import React from "react";
import { BRAND_HANDLE } from "./BrandClosing";
import { FONT } from "./WordText";

export const BrandTag: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div
    style={{
      fontFamily: FONT,
      fontWeight: 700,
      fontSize: 24,
      letterSpacing: 0.5,
      color: "rgba(255,255,255,0.7)",
      textShadow: "0 2px 4px rgba(0,0,0,0.6)",
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {BRAND_HANDLE}
  </div>
);

/** posisi pojok kanan-bawah di dalam panel (panel harus `position: absolute/relative`) */
export const BRAND_TAG_CORNER: React.CSSProperties = { position: "absolute", right: 22, bottom: 8 };
