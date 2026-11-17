// Aset channel YouTube @day.one.eight (still, bukan video):
// - ChannelBanner 2560x1440 — semua teks & wajah di area aman 1546x423 (tengah)
// - ProfilePicture 800x800 — tampil sebagai lingkaran
// - ChannelWatermark 150x150 — PNG transparan untuk branding video YouTube

import { loadFont } from "@remotion/google-fonts/PixelifySans";
import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import React, { useLayoutEffect } from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { BRAND_BG, BRAND_HANDLE, BRAND_LOGO, BRAND_YELLOW } from "./BrandClosing";
import { BoneOverride, Character3D } from "./Character3D";
import { FONT } from "./WordText";

const { fontFamily: PIXEL_FONT } = loadFont("normal", {
  weights: ["500", "700"],
  subsets: ["latin"],
});

export const CHANNEL_TAGLINE = "jangan lupa subscribe, update setiap hari";

const BG =
  "radial-gradient(ellipse at 50% 50%, #2b3c8a 0%, rgba(20,28,70,0) 55%), linear-gradient(180deg, #0a0f2c 0%, #121a46 55%, #090d26 100%)";

/** Pose melambai + senyum untuk aset statis. */
const WAVE: BoneOverride = {
  upperarm_l: [0, 0, 1.75],
  lowerarm_l: [-1.05, 0, 0.25],
  Head: [-0.05, 0.12, 0],
};
const HAPPY = { eyeOpen: 1, smile: 1, sleepy: 0 };

const Cam: React.FC<{ pos: [number, number, number]; look: [number, number, number] }> = ({
  pos,
  look,
}) => {
  const camera = useThree((s) => s.camera);
  useLayoutEffect(() => {
    camera.position.set(...pos);
    camera.lookAt(...look);
  }, [camera, pos, look]);
  return null;
};

const Lights: React.FC = () => (
  <>
    <ambientLight intensity={0.9} />
    <directionalLight position={[3, 5, 5]} intensity={2.4} />
    <directionalLight position={[-4, 3, -3]} intensity={1.1} color="#ffd400" />
  </>
);

/** Kotak-kotak pixel dekoratif (statis). */
const PixelStar: React.FC<{ x: number; y: number; s: number; c?: string }> = ({
  x,
  y,
  s,
  c = "#fff6c2",
}) => (
  <svg
    width={s * 3}
    height={s * 3}
    style={{ position: "absolute", left: x, top: y, shapeRendering: "crispEdges" }}
  >
    <rect x={s} y={0} width={s} height={s * 3} fill={c} />
    <rect x={0} y={s} width={s * 3} height={s} fill={c} />
  </svg>
);

/* ------------------------------ banner ------------------------------ */

// area aman YouTube (terlihat di semua perangkat)
const SAFE = { x: (2560 - 1546) / 2, y: (1440 - 423) / 2, w: 1546, h: 423 };

export const ChannelBanner: React.FC<{ showGuides?: boolean }> = ({ showGuides = false }) => (
  <AbsoluteFill style={{ background: BG }}>
    {/* dekorasi di luar area aman: hanya terlihat di TV/desktop */}
    {[
      [140, 180, 12],
      [380, 1180, 8],
      [2280, 220, 10],
      [2420, 1100, 14],
      [260, 640, 6],
      [2330, 700, 6],
      [1250, 160, 8, "#FFD400"],
      [1500, 1250, 10, "#FFD400"],
    ].map(([x, y, s, c], i) => (
      <PixelStar key={i} x={x as number} y={y as number} s={s as number} c={c as string | undefined} />
    ))}
    <div
      style={{
        position: "absolute",
        left: 2560 - 420,
        top: 1440 - 420,
        width: 300,
        height: 300,
        opacity: 0.18,
      }}
    >
      <Img src={staticFile(BRAND_LOGO)} style={{ width: 300, height: 300 }} />
    </div>

    {/* si biru melambai: wajah & tangan di dalam area aman */}
    <div
      style={{
        position: "absolute",
        left: SAFE.x - 130,
        top: SAFE.y - 235,
        // pudar di bawah agar tubuh tidak terpotong garis keras
        WebkitMaskImage: "linear-gradient(180deg, #000 70%, transparent 96%)",
        maskImage: "linear-gradient(180deg, #000 70%, transparent 96%)",
      }}
    >
      <ThreeCanvas width={620} height={860} camera={{ fov: 32 }}>
        <Cam pos={[0.35, 1.6, 3.1]} look={[0.05, 1.55, 0]} />
        <Lights />
        <Character3D
          t={0.6}
          clips={[{ clip: "Idle_Loop", at: 0 }]}
          bones={WAVE}
          face={HAPPY}
          rotationY={0.25}
        />
      </ThreeCanvas>
    </div>

    {/* wordmark + tagline + handle */}
    <div
      style={{
        position: "absolute",
        left: SAFE.x + 540,
        top: SAFE.y + 48,
        width: SAFE.w - 560,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
        <Img src={staticFile(BRAND_LOGO)} style={{ width: 112, height: 112 }} />
        <div
          style={{
            fontFamily: PIXEL_FONT,
            fontWeight: 700,
            fontSize: 108,
            lineHeight: 1,
            color: BRAND_YELLOW,
            letterSpacing: 2,
          }}
        >
          day.one.eight
        </div>
      </div>
      <div
        style={{
          marginTop: 22,
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: 50,
          color: "#ffffff",
          letterSpacing: -0.5,
        }}
      >
        {CHANNEL_TAGLINE}
      </div>
      <div
        style={{
          marginTop: 26,
          padding: "10px 26px",
          borderRadius: 999,
          background: BRAND_YELLOW,
          color: BRAND_BG,
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 40,
        }}
      >
        {BRAND_HANDLE}
      </div>
    </div>

    {showGuides ? (
      <>
        <div
          style={{
            position: "absolute",
            left: SAFE.x,
            top: SAFE.y,
            width: SAFE.w,
            height: SAFE.h,
            outline: "4px dashed #ff3b6b",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            top: SAFE.y,
            width: 2560,
            height: SAFE.h,
            outline: "3px dashed rgba(255,255,255,0.4)",
          }}
        />
      </>
    ) : null}
  </AbsoluteFill>
);

/* ------------------------------ profil ------------------------------ */

export const ProfilePicture: React.FC = () => (
  <AbsoluteFill style={{ background: BG }}>
    <ThreeCanvas width={800} height={800} camera={{ fov: 30 }}>
      <Cam pos={[0.12, 1.68, 1.75]} look={[0.02, 1.6, 0]} />
      <Lights />
      <Character3D t={0.6} clips={[{ clip: "Idle_Loop", at: 0 }]} face={HAPPY} rotationY={0.18} />
    </ThreeCanvas>
  </AbsoluteFill>
);

/* ----------------------------- watermark ----------------------------- */

export const ChannelWatermark: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "transparent", alignItems: "center", justifyContent: "center" }}>
    <Img src={staticFile(BRAND_LOGO)} style={{ width: 150, height: 150 }} />
  </AbsoluteFill>
);
