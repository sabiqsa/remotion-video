// Scene 3D "kenapa harga barang naik terus?" — si biru duduk di meja makan minimarket, rak
// berisi kardus & kaleng di belakang. Mie diangkat untuk dilihat harganya → DOLLY ZOOM wajah syok
// (kamera mundur sambil zoom masuk: wajah tetap, latar "tertarik"). Rak mengosong (permintaan),
// label harga meja membengkak (biaya), tumpukan uang naik sementara isi keranjang menyusut
// (uang beredar), kalender 2026 → 2036 + syok kedua. Gerak diskret per ketukan.

import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import React, { useLayoutEffect, useMemo } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import type { FaceState } from "../brand/cartoonBody";
import { BoneOverride, Character3D } from "../brand/Character3D";
import { HandleDecal } from "../brand/HandleDecal";
import type { Wardrobe } from "../brand/wardrobe";
import { EASE } from "../lib/motion";
import { BEATS, PRICES, SHOCK, STRESS, ZoomTarget, ZOOMS } from "./beats";
import { END, sceneById, SceneId, SCENES } from "./script";

const TABLE_TOP = 1.2;
const DESK_Z = 0.78;
const CHAR_SCALE = 1.75;
const WARDROBE: Wardrobe = { hair: "spiky", outfit: "tee", accessories: [] };

type V3 = [number, number, number];
/** mulut & pusat wajah si biru (perkiraan dunia, sama dengan set meja lain) */
const MOUTH: V3 = [0.125, 2.215, 0.49];
const FACE: V3 = [0.12, 2.32, 0.42];
const HEAD: V3 = [0.12, 2.5, 0.25];
/** label harga berdiri di meja (kanan depan) */
export const TAG: V3 = [0.62, TABLE_TOP, DESK_Z + 0.18];
/** mie instan: di meja → diangkat di depan wajah saat hook */
const MIE_REST: V3 = [0.3, TABLE_TOP + 0.03, DESK_Z + 0.1];
const MIE_HELD: V3 = [MOUTH[0] + 0.28, MOUTH[1] - 0.12, MOUTH[2] + 0.32];
/** keranjang (kiri), uang (tengah kiri), kalender (kanan belakang) */
const BASKET: V3 = [-0.72, TABLE_TOP, DESK_Z + 0.02];
export const MONEY: V3 = [-0.2, TABLE_TOP, DESK_Z + 0.24];
export const CAL: V3 = [-0.3, TABLE_TOP, DESK_Z + 0.12];

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
type Ease = (x: number) => number;
const pr = (t: number, start: number, dur: number, ease: Ease = EASE.out) =>
  interpolate(t, [start, start + Math.max(0.001, dur)], [0, 1], { ...CLAMP, easing: ease });
const hold = (t: number, a: number, b: number, inDur = 0.2, outDur = 0.25) =>
  Math.min(pr(t, a, inDur), 1 - pr(t, b, outDur, EASE.in));
const S = (id: SceneId) => sceneById(id).start;
const popIn = (t: number, from: number, to: number) =>
  t < from || t > to ? 0 : pr(t, from, 0.35, EASE.back) * (1 - pr(t, to - 0.15, 0.15, EASE.in));
/** satu denyut (0 → 1 → 0) */
const punch = (t: number, at: number, dur = 0.25) => {
  const u = pr(t, at, dur, (v) => v);
  return u <= 0 || u >= 1 ? 0 : Math.sin(u * Math.PI);
};
const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const band = (list: [number, number, number][], t: number, i = 0.12, o = 0.35) =>
  list.reduce((m, [a, b, k]) => Math.max(m, hold(t, a, b, i, o) * k), 0);

export const shockAt = (t: number) => band(SHOCK, t, 0.08, 0.35);
export const stressAt = (t: number) => band(STRESS, t, 0.25, 0.3);
/** mie diangkat ke depan wajah selama hook */
const mieUpAt = (t: number) => hold(t, BEATS.grab - 0.1, END("hook") - 0.1, 0.4, 0.35);
export const miePos = (t: number): V3 => lerp3(MIE_REST, MIE_HELD, mieUpAt(t));
/** harga yang sedang tampil di label */
export const priceAt = (t: number) => PRICES.reduce((v, [at, p]) => (t >= at ? p : v), PRICES[0][1]);
export const rupiah = (n: number) => `Rp${n.toLocaleString("id-ID")}`;

/* ------------------------------- kamera ------------------------------- */

type Pose = { x: number; y: number; z: number; lx: number; ly: number; lz: number; fov: number };
const FOV = 66.6;
const P = (x: number, y: number, z: number, ly: number, lx = 0, lz = 0.3): Pose => ({ x, y, z, lx, ly, lz, fov: FOV });
const POSES: Record<SceneId, Pose> = {
  hook: P(0.45, 2.4, 5.0, 2.05),
  ehem: P(-0.7, 2.35, 5.4, 1.95),
  p1: P(0.2, 2.55, 6.0, 2.15),
  p2: P(-0.5, 2.3, 4.9, 1.95),
  p3: P(0.7, 2.4, 5.2, 1.95, -0.1),
  twist: P(0.5, 2.45, 5.2, 2.0, 0.2),
  tips: P(-0.6, 2.55, 5.8, 2.0),
  komen: P(0, 2.5, 6.0, 2.0),
};

/** dolly zoom: lebar bidang di wajah dijaga tetap (d · tan(fov/2) = konstan) */
const HALF = Math.tan(((FOV / 2) * Math.PI) / 180);
const dollyFov = (d: number, dRef: number) => (2 * Math.atan((dRef * HALF) / d) * 180) / Math.PI;

const macroPose = (target: ZoomTarget, t: number): Pose => {
  if (target === "tag") {
    const p: V3 = [TAG[0], TAG[1] + 0.2, TAG[2]];
    return { x: p[0] - 0.1, y: p[1] + 0.12, z: p[2] + 1.15, lx: p[0], ly: p[1] - 0.05, lz: p[2], fov: FOV };
  }
  if (target === "face") {
    // snap-zoom masuk (jauh + sempit) lalu dolly: kamera maju & lensa melebar, wajah tetap
    const k = pr(t, BEATS.shock0, 0.8, EASE.inOut);
    const d = 5.4 + (2.3 - 5.4) * k;
    return { x: FACE[0] + 0.04, y: FACE[1] + 0.03, z: FACE[2] + d, lx: FACE[0], ly: FACE[1] - 0.12, lz: FACE[2], fov: dollyFov(d, 2.3) };
  }
  // face2: crash zoom pendek di "sepertiga"
  const d = 2.2 + 0.9 * (1 - pr(t, BEATS.third, 0.25, EASE.out));
  return { x: FACE[0] - 0.05, y: FACE[1] + 0.04, z: FACE[2] + d, lx: FACE[0], ly: FACE[1] - 0.12, lz: FACE[2], fov: FOV };
};

export const macroAt = (t: number) =>
  ZOOMS.reduce((m, [a, b]) => Math.max(m, Math.min(pr(t, a, 0.3, EASE.inOut), 1 - pr(t, b, 0.45, EASE.inOut))), 0);
const zoomTarget = (t: number) =>
  ZOOMS.reduce((best, cur) => (Math.abs(t - (cur[0] + cur[1]) / 2) < Math.abs(t - (best[0] + best[1]) / 2) ? cur : best))[2];

const SHAKES = [
  { at: BEATS.shock0, amp: 0.03 },
  { at: BEATS.hike1, amp: 0.025 },
  { at: BEATS.hike2, amp: 0.03 },
  { at: BEATS.third, amp: 0.045 },
];
const PATTERN = [1, -0.8, 0.6, -0.4, 0.2];
const shakeAt = (t: number) =>
  SHAKES.reduce((acc, s) => {
    const dt = t - s.at;
    if (dt < 0 || dt >= 0.3) return acc;
    return acc + s.amp * (1 - dt / 0.3) * PATTERN[Math.floor(dt / 0.06)];
  }, 0);

const lerpPose = (a: Pose, b: Pose, k: number): Pose => ({
  x: a.x + (b.x - a.x) * k,
  y: a.y + (b.y - a.y) * k,
  z: a.z + (b.z - a.z) * k,
  lx: a.lx + (b.lx - a.lx) * k,
  ly: a.ly + (b.ly - a.ly) * k,
  lz: a.lz + (b.lz - a.lz) * k,
  fov: a.fov + (b.fov - a.fov) * k,
});

export const cameraAt = (t: number): Pose => {
  let pose = POSES[SCENES[0].id];
  for (const s of SCENES.slice(1)) pose = lerpPose(pose, POSES[s.id], pr(t, s.start, 0.35, EASE.inOut));
  pose = lerpPose(pose, macroPose(zoomTarget(t), t), macroAt(t));
  const sh = shakeAt(t) * (0.25 + 0.75 * (1 - macroAt(t)));
  return { ...pose, x: pose.x + sh, y: pose.y - sh * 0.6 };
};

const FULL_H = 2520;
const applyLens = (cam: THREE.PerspectiveCamera, fov: number) => {
  cam.fov = fov;
  cam.near = 0.05;
  cam.far = 60;
  cam.setViewOffset(1080, FULL_H, 0, 0, 1080, 1920);
  cam.updateProjectionMatrix();
};

const Camera: React.FC<{ pose: Pose }> = ({ pose }) => {
  const camera = useThree((st) => st.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    applyLens(camera, pose.fov);
    camera.position.set(pose.x, pose.y, pose.z);
    camera.lookAt(pose.lx, pose.ly, pose.lz);
  }, [camera, pose.x, pose.y, pose.z, pose.lx, pose.ly, pose.lz, pose.fov]);
  return null;
};

/* --------------------------- si biru (ekspresi) --------------------------- */

const BLINKS = [3.9, 8.4, 13.6, 18.9, 24.6, 29.2, 36.1, 40.7, 43.8];

const faceAt = (t: number): FaceState => {
  const blink = BLINKS.some((b) => Math.abs(t - b) < 0.05) ? 0.1 : 1;
  const shock = shockAt(t);
  const stress = stressAt(t);
  const look = hold(t, BEATS.grab + 0.2, BEATS.shock0 - 0.05, 0.2, 0.08);
  const thinking = hold(t, BEATS.money, BEATS.drop - 0.15, 0.25, 0.2);
  const happy = Math.max(pr(t, S("tips"), 0.3), 0);
  return {
    eyeOpen: shock > 0.2 ? 1 : blink,
    shock,
    surprise: Math.max(shock, look * 0.35, thinking * 0.25),
    open: look * 0.2,
    smile: Math.max(happy * 0.9, 0.35 * (1 - shock) * (1 - stress) * (1 - look)),
    frown: Math.max(stress * 0.7, thinking * 0.2),
    sad: stress,
    pale: Math.max(shock * 0.35, stress * 0.15),
    sweat: Math.max(shock * 0.8, stress),
    blush: happy * 0.4,
  };
};

const SiBiru: React.FC<{ t: number }> = ({ t }) => {
  const shock = shockAt(t);
  const stress = stressAt(t);
  const mie = mieUpAt(t);
  const recoil = punch(t, BEATS.shock0, 0.35) + punch(t, BEATS.third, 0.35);
  const lookTag = hold(t, BEATS.cost, BEATS.hike2 + 0.8, 0.3, 0.3);
  const lookMoney = hold(t, BEATS.money, BEATS.drop, 0.3, 0.3);
  const wave = hold(t, BEATS.teamB, END("komen") - 0.1, 0.3, 0.3);

  const bones: BoneOverride = {
    spine_01: [-recoil * 0.12 - shock * 0.04 + stress * 0.05, 0, 0],
    spine_02: [stress * 0.06 + lookTag * 0.08, lookTag * -0.12 + lookMoney * 0.12, 0],
    Head: [-recoil * 0.1 + stress * 0.1 + lookTag * 0.18 + lookMoney * 0.22, lookTag * -0.4 + lookMoney * 0.35, stress * 0.06],
    // tangan kanan: angkat mie ke depan wajah
    upperarm_r: [mie * 1.05, 0, 0],
    lowerarm_r: [mie * 0.85, 0, 0],
    // tangan kiri: melambai di komen
    upperarm_l: [0, 0, wave * 1.75],
    lowerarm_l: [-wave * 1.05, 0, 0],
  };

  return (
    <Character3D
      look="cartoon"
      face={faceAt(t)}
      wardrobe={WARDROBE}
      t={t}
      clips={[
        { clip: "Sitting_Idle_Loop", at: 0 },
        { clip: "Sitting_Talking_Loop", at: S("komen"), fade: 0.3 },
      ]}
      bones={bones}
      position={[0, 0, -0.05]}
      scale={CHAR_SCALE}
    />
  );
};

/* ------------------------------- teks di 3D ------------------------------- */

/** bidang bertekstur kanvas (label harga, kalender, bungkus mie) */
const TextPlane: React.FC<{
  text: string;
  w: number;
  h: number;
  bg?: string;
  fg?: string;
  px?: number;
  position?: V3;
  rotation?: V3;
}> = ({ text, w, h, bg = "#ffffff", fg = "#e3263b", px = 220, position = [0, 0, 0], rotation = [0, 0, 0] }) => {
  const tex = useMemo(() => {
    const cw = 512;
    const ch = Math.round((512 * h) / w);
    const c = document.createElement("canvas");
    c.width = cw;
    c.height = ch;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = fg;
    ctx.font = `900 ${px}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, cw / 2, ch / 2 + px * 0.05);
    const tx = new THREE.CanvasTexture(c);
    tx.colorSpace = THREE.SRGBColorSpace;
    tx.anisotropy = 8;
    return tx;
  }, [text, w, h, bg, fg, px]);
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial map={tex} roughness={0.6} side={THREE.DoubleSide} />
    </mesh>
  );
};

/* ------------------------------- minimarket ------------------------------- */

const PRODUCT_COLORS = ["#e3263b", "#ffd23d", "#2f7cf6", "#3e9b4f", "#ff8a3d", "#9b59d0", "#ffffff", "#ff8fb0"];
type Product = { x: number; y: number; w: number; h: number; c: string; can: boolean; i: number };
const SHELF_X = [-1.85, 1.85];
const SHELF_Y = [1.55, 2.35, 3.15, 3.95];
const PRODUCTS: Product[] = (() => {
  const out: Product[] = [];
  let i = 0;
  for (const cx of SHELF_X) {
    for (const [row, y] of SHELF_Y.entries()) {
      for (let k = 0; k < 6; k++) {
        const can = (row + k) % 3 === 0;
        const h = can ? 0.26 : 0.34 + ((k * 7 + row * 3) % 4) * 0.04;
        out.push({ x: cx - 0.6 + k * 0.24, y, w: can ? 0.17 : 0.2, h, c: PRODUCT_COLORS[(k * 3 + row * 5 + (cx > 0 ? 2 : 0)) % PRODUCT_COLORS.length], can, i: i++ });
      }
    }
  }
  return out;
})();
/** urutan barang yang "habis diborong" (tersebar acak tetap) */
const SOLD_ORDER = PRODUCTS.map((p) => p.i).sort((a, b) => ((a * 37) % 48) - ((b * 37) % 48));
const soldAt = (i: number) => BEATS.crowd + 0.1 + SOLD_ORDER.indexOf(i) * 0.035;

const Shelves: React.FC<{ t: number }> = ({ t }) => (
  <group position={[0, 0, -1.4]}>
    {SHELF_X.map((cx) => (
      <group key={cx}>
        {/* rangka rak */}
        <mesh position={[cx, 2.45, -0.18]}>
          <boxGeometry args={[1.6, 3.4, 0.06]} />
          <meshStandardMaterial color="#e9edf2" roughness={0.8} />
        </mesh>
        {SHELF_Y.map((y) => (
          <group key={y}>
            <mesh position={[cx, y - 0.03, 0]}>
              <boxGeometry args={[1.6, 0.05, 0.42]} />
              <meshStandardMaterial color="#cfd6de" roughness={0.6} />
            </mesh>
            {/* strip label harga merah */}
            <mesh position={[cx, y - 0.06, 0.215]}>
              <boxGeometry args={[1.6, 0.06, 0.01]} />
              <meshStandardMaterial color="#e3263b" />
            </mesh>
          </group>
        ))}
      </group>
    ))}
    {PRODUCTS.map((p) => {
      const gone = t >= S("p1") && t < END("p1") + 0.4 ? pr(t, soldAt(p.i), 0.18, EASE.in) : 0;
      // barang kembali (restock) saat scene p2 mulai
      const back = t >= END("p1") ? pr(t, END("p1"), 0.3, EASE.back) : 1;
      const s = Math.max(0.001, (1 - gone) * back);
      return (
        <mesh key={p.i} position={[p.x, p.y + (p.h * s) / 2, 0]} scale={[s, s, s]}>
          {p.can ? <cylinderGeometry args={[p.w / 2, p.w / 2, p.h, 16]} /> : <boxGeometry args={[p.w, p.h, 0.24]} />}
          <meshStandardMaterial color={p.c} roughness={0.55} />
        </mesh>
      );
    })}
  </group>
);

const Store: React.FC<{ t: number }> = ({ t }) => (
  <group>
    {/* dinding + lantai keramik */}
    <mesh position={[0, 3, -1.75]}>
      <planeGeometry args={[12, 8]} />
      <meshStandardMaterial color="#f3f1ea" roughness={0.95} />
    </mesh>
    <mesh position={[0, 0, 1]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[12, 8]} />
      <meshStandardMaterial color="#d9dde3" roughness={0.7} />
    </mesh>
    {/* papan nama toko berstiker @day.one.eight */}
    <group position={[0, 4.55, -1.7]}>
      <mesh>
        <boxGeometry args={[2.1, 0.5, 0.05]} />
        <meshStandardMaterial color="#2f7cf6" />
      </mesh>
      <TextPlane text="minimarket" w={1.5} h={0.3} bg="#2f7cf6" fg="#ffffff" px={78} position={[0, 0.05, 0.03]} />
      <HandleDecal position={[0, -0.16, 0.03]} width={0.62} />
    </group>
    {/* lampu neon panjang */}
    {[-1.6, 1.6].map((x) => (
      <mesh key={x} position={[x, 5.0, -1.2]}>
        <boxGeometry args={[1.3, 0.06, 0.12]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.2} />
      </mesh>
    ))}
    <Shelves t={t} />
    {/* kursi bar */}
    <mesh position={[0, 0.8, -0.15]}>
      <cylinderGeometry args={[0.45, 0.45, 0.1, 28]} />
      <meshStandardMaterial color="#e3263b" roughness={0.6} />
    </mesh>
    <mesh position={[0, 0.4, -0.15]}>
      <cylinderGeometry args={[0.05, 0.05, 0.8, 10]} />
      <meshStandardMaterial color="#9aa0aa" metalness={0.5} roughness={0.4} />
    </mesh>
    {/* meja makan minimarket + panel depan berstiker */}
    <mesh position={[0, TABLE_TOP - 0.04, DESK_Z]}>
      <boxGeometry args={[2.6, 0.08, 0.95]} />
      <meshStandardMaterial color="#f7f7f5" roughness={0.5} />
    </mesh>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * 1.2, (TABLE_TOP - 0.08) / 2, DESK_Z]}>
        <boxGeometry args={[0.08, TABLE_TOP - 0.08, 0.85]} />
        <meshStandardMaterial color="#b7bec8" metalness={0.3} roughness={0.5} />
      </mesh>
    ))}
    <mesh position={[0, TABLE_TOP - 0.25, DESK_Z + 0.44]}>
      <boxGeometry args={[2.4, 0.36, 0.04]} />
      <meshStandardMaterial color="#2f3b52" roughness={0.6} />
    </mesh>
    <HandleDecal position={[-0.5, TABLE_TOP - 0.25, DESK_Z + 0.465]} width={0.62} />
  </group>
);

/* ------------------------------- props ------------------------------- */

/** label harga berdiri: angka berganti dengan putaran sekali (flip) + membengkak saat naik */
const PriceTag: React.FC<{ t: number }> = ({ t }) => {
  const price = priceAt(t);
  const last = PRICES.reduce((a, [at]) => (t >= at ? at : a), 0);
  const flip = last > 0 ? 1 - pr(t, last, 0.35, EASE.out) : 0;
  const swell = 1 + (last > 0 ? punch(t, last, 0.4) * 0.25 : 0) + (PRICES.findIndex(([, p]) => p === price) * 0.06);
  return (
    <group position={TAG} rotation={[0, -0.2, 0]}>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.12, 8]} />
        <meshStandardMaterial color="#9aa0aa" metalness={0.5} />
      </mesh>
      <group position={[0, 0.22, 0]} rotation={[flip * Math.PI * 2, 0, 0]} scale={swell}>
        <mesh position={[0, 0, -0.006]}>
          <boxGeometry args={[0.4, 0.22, 0.01]} />
          <meshStandardMaterial color="#e3263b" />
        </mesh>
        <TextPlane text={rupiah(price)} w={0.37} h={0.19} bg="#ffd400" fg="#e3263b" px={120} position={[0, 0, 0.001]} />
      </group>
    </group>
  );
};

/** bungkus mie instan (bantal kuning-merah) */
const Mie: React.FC<{ t: number }> = ({ t }) => {
  const p = miePos(t);
  const k = mieUpAt(t);
  return (
    <group position={p} rotation={[0.2 * k, -0.5 * k, 0]} scale={1.25}>
      <mesh scale={[1, 0.28, 0.75]}>
        <boxGeometry args={[0.26, 0.26, 0.26]} />
        <meshStandardMaterial color="#ffd23d" roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.0375, 0.02]} scale={[1, 1, 1]}>
        <boxGeometry args={[0.18, 0.004, 0.12]} />
        <meshStandardMaterial color="#e3263b" />
      </mesh>
      {/* bungkus diputar menghadap kamera saat diangkat: sisi depan dengan "mie" */}
      <TextPlane text="mie" w={0.18} h={0.06} bg="#e3263b" fg="#ffffff" px={190} position={[0, 0, 0.0985]} />
    </group>
  );
};

/** keranjang belanja: isinya menyusut satu per satu di p3 */
const Basket: React.FC<{ t: number }> = ({ t }) => {
  const items = [
    { x: -0.12, z: -0.05, c: "#e3263b", h: 0.22 },
    { x: 0.0, z: 0.05, c: "#ffd23d", h: 0.26 },
    { x: 0.12, z: -0.04, c: "#3e9b4f", h: 0.2 },
    { x: -0.05, z: -0.08, c: "#2f7cf6", h: 0.3 },
    { x: 0.1, z: 0.07, c: "#ffffff", h: 0.18 },
  ];
  return (
    <group position={BASKET} rotation={[0, 0.25, 0]}>
      {items.map((it, i) => {
        const gone = t >= S("p3") && t < END("p3") + 0.3 ? pr(t, BEATS.goods + i * 0.12, 0.2, EASE.in) : 0;
        const back = t >= END("p3") ? pr(t, END("p3"), 0.3, EASE.back) : 1;
        const s = Math.max(0.001, (1 - gone) * back);
        return (
          <mesh key={i} position={[it.x, 0.1 + (it.h * s) / 2, it.z]} scale={[s, s, s]}>
            <boxGeometry args={[0.1, it.h, 0.08]} />
            <meshStandardMaterial color={it.c} roughness={0.6} />
          </mesh>
        );
      })}
      {/* badan keranjang merah berlubang (sisi depan & samping) */}
      <mesh position={[0, 0.09, 0]}>
        <boxGeometry args={[0.44, 0.18, 0.3]} />
        <meshStandardMaterial color="#e3263b" roughness={0.5} transparent opacity={0.92} />
      </mesh>
      <mesh position={[0, 0.25, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.16, 0.012, 8, 24, Math.PI]} />
        <meshStandardMaterial color="#b71c2c" />
      </mesh>
    </group>
  );
};

/** tumpukan uang: lembar hijau bertambah satu per satu di p3 */
const MONEY_N = 9;
const Money: React.FC<{ t: number }> = ({ t }) => {
  const vis = popIn(t, BEATS.money - 0.1, END("p3") + 0.15);
  if (vis <= 0) return null;
  return (
    <group position={MONEY} scale={vis} rotation={[0, 0.15, 0]}>
      {Array.from({ length: MONEY_N }).map((_, i) => {
        const at = i < 2 ? BEATS.money : BEATS.more + (i - 2) * 0.13;
        const k = pr(t, at, 0.2, EASE.back);
        if (k <= 0) return null;
        return (
          <group key={i} position={[((i * 37) % 5) * 0.006 - 0.012, 0.012 + i * 0.022, 0]} rotation={[0, ((i * 53) % 7) * 0.04 - 0.12, 0]} scale={k}>
            <mesh>
              <boxGeometry args={[0.34, 0.018, 0.16]} />
              <meshStandardMaterial color="#5cc56b" roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.0095, 0]}>
              <boxGeometry args={[0.08, 0.002, 0.08]} />
              <meshStandardMaterial color="#2e8b44" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

/** kalender meja: 2026 membalik → 2036 (10 tahun) */
const Calendar: React.FC<{ t: number }> = ({ t }) => {
  const vis = popIn(t, BEATS.pct - 0.2, END("twist") + 0.2);
  if (vis <= 0) return null;
  const flip = pr(t, BEATS.years, 0.45, EASE.inOut);
  return (
    <group position={CAL} scale={vis * 1.15} rotation={[0, -0.3, 0]}>
      <mesh position={[0, 0.13, -0.06]} rotation={[0.42, 0, 0]}>
        <boxGeometry args={[0.36, 0.3, 0.01]} />
        <meshStandardMaterial color="#2f3b52" />
      </mesh>
      <group position={[0, 0.27, 0]} rotation={[-0.42, 0, 0]}>
        <TextPlane text="2036" w={0.34} h={0.22} position={[0, -0.13, 0.008]} px={150} />
        <mesh position={[0, -0.025, 0.009]}>
          <planeGeometry args={[0.34, 0.05]} />
          <meshStandardMaterial color="#e3263b" />
        </mesh>
        {flip < 0.98 && (
          <group rotation={[flip * Math.PI * 0.95, 0, 0]}>
            <TextPlane text="2026" w={0.34} h={0.22} position={[0, -0.13, 0.014]} px={150} fg="#2f3b52" />
          </group>
        )}
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[0.36, 0.02, 0.02]} />
          <meshStandardMaterial color="#9aa0aa" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
};

/* -------------------------------- proyeksi -------------------------------- */

const projCam = new THREE.PerspectiveCamera(FOV, 1080 / FULL_H, 0.05, 60);
export const toScreen = (t: number, p: V3) => {
  const cam = cameraAt(t);
  applyLens(projCam, cam.fov);
  projCam.position.set(cam.x, cam.y, cam.z);
  projCam.lookAt(cam.lx, cam.ly, cam.lz);
  projCam.updateMatrixWorld(true);
  const v = new THREE.Vector3(...p).project(projCam);
  return { x: ((v.x + 1) / 2) * 1080, y: ((1 - v.y) / 2) * 1920 };
};
export const headScreen = (t: number) => toScreen(t, [HEAD[0], 3.05, HEAD[2] + 0.05]);
export const faceScreen = (t: number) => toScreen(t, FACE);
export const mieScreen = (t: number) => toScreen(t, miePos(t));
export const tagScreen = (t: number) => toScreen(t, [TAG[0], TAG[1] + 0.22, TAG[2]]);
export const moneyScreen = (t: number) => toScreen(t, [MONEY[0], MONEY[1] + 0.15, MONEY[2]]);
export const shelfScreen = (t: number) => toScreen(t, [SHELF_X[1], 3.0, -1.4]);
export const shelfLScreen = (t: number) => toScreen(t, [SHELF_X[0], 3.0, -1.4]);
export const calScreen = (t: number) => toScreen(t, [CAL[0], CAL[1] + 0.3, CAL[2]]);

/* -------------------------------- scene ------------------------------- */

export const Scene3D: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const cam = cameraAt(t);
  return (
    <ThreeCanvas width={width} height={height} camera={{ fov: FOV, position: [0, 2.6, 7.8] }}>
      <Camera pose={cam} />
      <ambientLight intensity={0.8} color="#f5f8ff" />
      <pointLight position={[0.1, 3.5, 0.9]} intensity={4} distance={5} color="#ffffff" />
      <directionalLight position={[-3, 5, 4]} intensity={1.8} color="#ffffff" />
      <directionalLight position={[3, 3, 5]} intensity={0.9} color="#eef4ff" />
      <Store t={t} />
      <SiBiru t={t} />
      <PriceTag t={t} />
      <Mie t={t} />
      <Basket t={t} />
      <Money t={t} />
      <Calendar t={t} />
    </ThreeCanvas>
  );
};
