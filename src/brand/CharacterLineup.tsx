// Komposisi pratinjau untuk memilih model karakter default.

import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import React, { useLayoutEffect } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Character3D, Character3DProps } from "./Character3D";
import { FONT } from "./WordText";

type Entry = { label: string; note: string; props: Omit<Character3DProps, "t" | "clips"> };

const ENTRIES: Entry[] = [
  { label: "5. kartun (rig)", note: "default brand", props: { look: "cartoon" } },
  { label: "1. mannequin", note: "netral, polos", props: { look: "model", model: "mannequin" } },
  {
    label: "2. mannequin brand",
    note: "biru + sendi kuning",
    props: { look: "model", model: "mannequin", tint: { main: "#2f7cf6", joints: "#FFD400" } },
  },
  {
    label: "3. superhero pria",
    note: "pakaian dalam + rambut",
    props: { look: "model", model: "superhero_male", hair: "simple_parted" },
  },
  {
    label: "4. superhero wanita",
    note: "pakaian dalam + rambut",
    props: { look: "model", model: "superhero_female", hair: "long" },
  },
];

const SPACING = 1.15;

const Cam: React.FC = () => {
  const camera = useThree((s) => s.camera);
  useLayoutEffect(() => {
    camera.position.set(0, 1.05, 7.2);
    camera.lookAt(0, 0.95, 0);
  }, [camera]);
  return null;
};

export const CharacterLineup: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg,#0a0f2c,#141d4a)" }}>
      <ThreeCanvas width={width} height={height} camera={{ fov: 30, position: [0, 1.05, 6.2] }}>
        <Cam />
        <ambientLight intensity={1.1} />
        <directionalLight position={[3, 5, 5]} intensity={2.4} />
        <directionalLight position={[-4, 3, -3]} intensity={1.0} color="#ffd400" />
        {ENTRIES.map((e, i) => (
          <Character3D
            key={i}
            {...e.props}
            t={t}
            clips={[{ clip: "Idle_Loop", at: 0, offset: i * 0.4 }]}
            position={[(i - (ENTRIES.length - 1) / 2) * SPACING, 0, 0]}
          />
        ))}
      </ThreeCanvas>
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          fontFamily: FONT,
        }}
      >
        {ENTRIES.map((e) => (
          <div key={e.label} style={{ width: 360, textAlign: "center", color: "#fff" }}>
            <div style={{ fontSize: 40, fontWeight: 800 }}>{e.label}</div>
            <div style={{ fontSize: 28, color: "#9EA6C2" }}>{e.note}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
