// Watermark sumber kecil yang diam sepanjang konten (pengganti kartu sumber).
// Diletakkan di bawah penanda poin, rata tengah di area aman.

import React from "react";
import { FONT } from "./WordText";

export const SourceWatermark: React.FC<{
  /** mis. "alodokter.com" */
  name: string;
  /** catatan pendek opsional, mis. "info umum" */
  note?: string;
  top?: number;
}> = ({ name, note, top = 262 }) => (
  <div
    style={{
      position: "absolute",
      left: 80,
      right: 140,
      top,
      textAlign: "center",
      fontFamily: FONT,
      fontSize: 26,
      fontWeight: 600,
      letterSpacing: 0.5,
      color: "rgba(255,255,255,0.45)",
    }}
  >
    sumber: {name}
    {note ? ` · ${note}` : ""}
  </div>
);
