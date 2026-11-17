// Stiker "@day.one.eight" di dalam scene 3D (mis. di sisi depan meja).
// Ikut perspektif kamera, jadi tidak bisa di-crop tanpa memotong isi video.

import React, { useMemo } from "react";
import * as THREE from "three";
import { BRAND_BG, BRAND_HANDLE, BRAND_YELLOW } from "./BrandClosing";

const W = 1024;
const H = 160;

const makeTexture = (text: string, bg: string, fg: string) => {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, W, H);
  const r = H / 2 - 8;
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(8, 8, W - 16, H - 16, r);
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.font = '800 96px "Helvetica Neue", Helvetica, Arial, sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, W / 2, H / 2 + 4);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
};

export const HandleDecal: React.FC<{
  position: [number, number, number];
  rotation?: [number, number, number];
  /** lebar stiker dalam satuan dunia */
  width?: number;
  text?: string;
  bg?: string;
  fg?: string;
}> = ({
  position,
  rotation = [0, 0, 0],
  width = 0.9,
  text = BRAND_HANDLE,
  bg = BRAND_YELLOW,
  fg = BRAND_BG,
}) => {
  const texture = useMemo(() => makeTexture(text, bg, fg), [text, bg, fg]);
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[width, (width * H) / W]} />
      <meshStandardMaterial map={texture} transparent roughness={0.5} />
    </mesh>
  );
};
