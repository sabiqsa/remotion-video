// Lembar referensi ekspresi si biru (still 1600x900): dipakai untuk mengecek &
// memilih nilai `face` di video.

import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import React, { useLayoutEffect } from "react";
import { AbsoluteFill } from "remotion";
import { Character3D } from "./Character3D";
import type { FaceState } from "./cartoonBody";
import { FONT } from "./WordText";

export const EXPRESSIONS: { name: string; face: FaceState }[] = [
  { name: "netral", face: {} },
  { name: "senang", face: { smile: 1, blush: 0.6, eyeOpen: 0.8 } },
  { name: "sedih", face: { frown: 0.8, sad: 1, eyeOpen: 0.75 } },
  { name: "sakit/pucat", face: { frown: 0.5, sad: 0.7, pale: 1, eyeOpen: 0.6, sweat: 0.8 } },
  { name: "kesakitan", face: { pain: 1, sad: 0.6, sweat: 1 } },
  { name: "kaget", face: { open: 1, surprise: 1 } },
  { name: "ngantuk", face: { eyeOpen: 0.3, sleepy: 1, smile: 0.2 } },
  { name: "malu", face: { smile: 0.5, blush: 1, eyeOpen: 0.7, sweat: 0.6 } },
];

const Cam: React.FC = () => {
  const camera = useThree((s) => s.camera);
  useLayoutEffect(() => {
    camera.position.set(0.05, 1.68, 1.25);
    camera.lookAt(0.02, 1.62, 0);
  }, [camera]);
  return null;
};

export const FaceSheet: React.FC = () => (
  <AbsoluteFill style={{ background: "#141d4a", flexDirection: "row", flexWrap: "wrap" }}>
    {EXPRESSIONS.map((e) => (
      <div key={e.name} style={{ width: 400, height: 450, position: "relative" }}>
        <ThreeCanvas width={400} height={400} camera={{ fov: 30 }}>
          <Cam />
          <ambientLight intensity={1} />
          <directionalLight position={[2, 4, 5]} intensity={2.2} />
          <Character3D t={0.5} clips={[{ clip: "Idle_Loop", at: 0 }]} face={e.face} />
        </ThreeCanvas>
        <div
          style={{
            position: "absolute",
            bottom: 8,
            width: "100%",
            textAlign: "center",
            color: "#fff",
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 30,
          }}
        >
          {e.name}
        </div>
      </div>
    ))}
  </AbsoluteFill>
);
