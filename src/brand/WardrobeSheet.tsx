// Katalog "lemari baju" si biru (still 2400x1800): rambut, baju, aksesori.
// Dipakai untuk memilih `wardrobe` sebelum dipasang di video.

import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import React, { useLayoutEffect } from "react";
import { AbsoluteFill } from "remotion";
import { Character3D } from "./Character3D";
import { ACCESSORIES, Accessory, HAIR_STYLES, HairStyle, Outfit, OUTFITS, Wardrobe } from "./wardrobe";
import { FONT, YELLOW } from "./WordText";

const W = 2400;

const HAIR_LABEL: Record<HairStyle, string> = {
  bowl: "mangkok (default)",
  comma: "comma hair",
  spiky: "jabrik",
  curly: "keriting",
  side: "belah samping",
  ponytail: "kuncir",
  bald: "botak",
};
const OUTFIT_LABEL: Record<Outfit, string> = {
  tee: "kaos (default)",
  hoodie: "hoodie",
  shirt: "kemeja",
  jacket: "jaket",
  doctor: "jas dokter",
  bowtie: "dasi kupu-kupu",
  dino: "piyama dino",
  chef: "baju koki",
};
const ACC_LABEL: Record<Accessory, string> = {
  glasses_round: "kacamata bulat",
  glasses_square: "kacamata kotak",
  sunglasses: "kacamata hitam",
  cap: "topi",
  mask: "masker",
  headphones: "headphone",
  stethoscope: "stetoskop",
  dino_hood: "tudung dino",
  chef_hat: "topi koki",
};

const OrthoCam: React.FC<{ y: number; zoom: number }> = ({ y, zoom }) => {
  const camera = useThree((s) => s.camera);
  useLayoutEffect(() => {
    camera.position.set(0, y + 0.15, 6);
    camera.lookAt(0, y, 0);
    camera.zoom = zoom;
    camera.updateProjectionMatrix();
  }, [camera, y, zoom]);
  return null;
};

const Row: React.FC<{
  title: string;
  items: { label: string; wardrobe: Wardrobe }[];
  height: number;
  centerY: number;
  spacing: number;
  zoom: number;
  turn?: number;
}> = ({ title, items, height, centerY, spacing, zoom, turn = 0.25 }) => {
  const n = items.length;
  const xs = items.map((_, i) => (i - (n - 1) / 2) * spacing);
  return (
    <div style={{ position: "relative", width: W, height: height + 70 }}>
      <div style={{ position: "absolute", left: 30, top: 10, fontFamily: FONT, fontWeight: 800, fontSize: 40, color: YELLOW, zIndex: 2 }}>
        {title}
      </div>
      <ThreeCanvas width={W} height={height} orthographic camera={{ zoom, position: [0, centerY, 6] }}>
        <OrthoCam y={centerY} zoom={zoom} />
        <ambientLight intensity={1} />
        <directionalLight position={[2, 4, 5]} intensity={2.2} />
        <directionalLight position={[-3, 2, -4]} intensity={0.8} color="#ffd400" />
        {items.map((it, i) => (
          <Character3D
            key={it.label}
            t={0.5}
            clips={[{ clip: "Idle_Loop", at: 0 }]}
            face={{ smile: 0.7, blush: 0.3 }}
            wardrobe={it.wardrobe}
            position={[xs[i], 0, 0]}
            rotationY={turn}
          />
        ))}
      </ThreeCanvas>
      {items.map((it, i) => (
        <div
          key={it.label}
          style={{
            position: "absolute",
            top: height + 6,
            left: W / 2 + xs[i] * zoom - 160,
            width: 320,
            textAlign: "center",
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 30,
            color: "#ffffff",
          }}
        >
          {it.label}
        </div>
      ))}
    </div>
  );
};

export const WardrobeSheet: React.FC = () => (
  <AbsoluteFill style={{ background: "#141d4a", flexDirection: "column" }}>
    <Row
      title="rambut"
      items={HAIR_STYLES.map((h) => ({ label: HAIR_LABEL[h], wardrobe: { hair: h } }))}
      height={520}
      centerY={1.72}
      spacing={0.62}
      zoom={520}
      turn={0.35}
    />
    <Row
      title="baju"
      items={OUTFITS.map((o) => ({ label: OUTFIT_LABEL[o], wardrobe: { outfit: o } }))}
      height={620}
      centerY={1.45}
      spacing={0.75}
      zoom={500}
      turn={0.3}
    />
    <Row
      title="aksesori"
      items={ACCESSORIES.map((a) => ({
        label: ACC_LABEL[a],
        wardrobe: { accessories: [a], outfit: a === "stethoscope" ? "doctor" : "tee" },
      }))}
      height={520}
      centerY={1.6}
      spacing={0.62}
      zoom={480}
      turn={0.3}
    />
  </AbsoluteFill>
);
