// Scene 3D "mata kedutan" — si biru (hoodie, rambut berantakan) begadang di meja kamar jam 2.
// Sinematik: kamera dibuka MACRO di mata kiri, kedut, lalu zoom out memperlihatkan kamar;
// tiap kedutan berikutnya kamera mendorong cepat ke mata lalu menarik keluar lagi.
// Cahaya malam (lampu meja hangat + cahaya biru layar) → pagi cerah saat tips.
// Semua gerak = aksi diskret pada ketukan narasi (BEATS), tanpa idle loop.

import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import React, { useLayoutEffect } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import type { FaceState } from "../brand/cartoonBody";
import { BoneOverride, Character3D } from "../brand/Character3D";
import { HandleDecal } from "../brand/HandleDecal";
import type { Wardrobe } from "../brand/wardrobe";
import { EASE } from "../lib/motion";
import { BEATS, TWITCHES, ZOOMS } from "./beats";
import { END, sceneById, SceneId, SCENES } from "./script";

const TABLE_TOP = 1.2;
const DESK_Z = 0.78;
const CHAR_SCALE = 1.75;
const WARDROBE: Wardrobe = { hair: "curly", outfit: "hoodie", accessories: [] };
const COLORS = { shirt: "#2f7cf6" };

/** titik tengah mata kiri si biru (sisi +X karakter = kanan layar) di dunia */
export const EYE: [number, number, number] = [0.225, 2.39, 0.46];

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
type Ease = (x: number) => number;
const pr = (t: number, start: number, dur: number, ease: Ease = EASE.out) =>
  interpolate(t, [start, start + Math.max(0.001, dur)], [0, 1], { ...CLAMP, easing: ease });
/** naik di `a`, bertahan, turun di `b` (0..1) */
const hold = (t: number, a: number, b: number, inDur = 0.2, outDur = 0.25) =>
  Math.min(pr(t, a, inDur), 1 - pr(t, b, outDur, EASE.in));
const S = (id: SceneId) => sceneById(id).start;
const popIn = (t: number, from: number, to: number) =>
  t < from || t > to ? 0 : pr(t, from, 0.35, EASE.back) * (1 - pr(t, to - 0.15, 0.15, EASE.in));
/** lompatan kecil (parabola) 0→1 selama `dur` */
const hop = (t: number, at: number, dur: number) => {
  const u = pr(t, at, dur, (v) => v);
  return u <= 0 || u >= 1 ? 0 : 4 * u * (1 - u);
};
const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/* ------------------------------ kedutan ------------------------------ */

/** 0..1 kelopak kiri menyempit — tiap kedut 0.12 dtk lalu diam */
export const twitchAt = (t: number) =>
  TWITCHES.reduce((m, at) => {
    const d = t - at;
    if (d < 0 || d > 0.12) return m;
    return Math.max(m, d < 0.03 ? d / 0.03 : 1 - (d - 0.03) / 0.09);
  }, 0);

/* ------------------------------- kamera ------------------------------- */

type Pose = { x: number; y: number; z: number; lx: number; ly: number; lz: number };
const P = (x: number, y: number, z: number, ly: number, lx = 0, lz = 0.3): Pose => ({ x, y, z, lx, ly, lz });
const POSES: Record<SceneId, Pose> = {
  hook: P(0.7, 2.5, 5.4, 2.05),
  mitos: P(-0.9, 2.45, 5.0, 2.0, 0.1),
  promise: P(0, 2.6, 6.4, 2.05),
  p1: P(1.2, 2.35, 5.2, 1.95),
  p2: P(0.6, 1.55, 4.9, 2.15, 0.15), // low angle: menara gelas kopi
  p3: P(2.1, 2.7, 4.4, 1.9, -0.1, 0.4), // dari samping ke laptop
  fakta: P(0, 2.5, 5.6, 2.05),
  tips: P(-0.7, 2.55, 5.9, 2.0),
  serius: P(0, 2.4, 5.3, 2.05),
  komen: P(0, 2.5, 6.0, 2.0),
};
/** pose macro: tepat di depan mata kiri (digeser sesuai zoom yang sedang aktif) */
const macroPose = (t: number): Pose => {
  const z = ZOOMS.reduce((best, cur) => (Math.abs(t - (cur[0] + cur[1]) / 2) < Math.abs(t - (best[0] + best[1]) / 2) ? cur : best));
  const e = [EYE[0] + z[2], EYE[1] + z[3], EYE[2] + z[4]];
  return { x: e[0] + 0.01, y: e[1] + 0.005, z: e[2] + 0.24, lx: e[0], ly: e[1], lz: e[2] };
};
/** posisi mata kiri saat `t` (untuk stempel "kedut!") */
export const eyeAt = (t: number): [number, number, number] => {
  const m = macroPose(t);
  return [m.lx, m.ly, m.lz];
};

/** 0..1 seberapa "macro" kamera: dorong 0.3 dtk, tarik keluar 0.6 dtk (hook) / 0.45 dtk */
export const macroAt = (t: number) =>
  ZOOMS.reduce((m, [a, b], i) => {
    const inn = a < 0 ? 1 : pr(t, a, 0.3, EASE.inOut);
    const out = pr(t, b, i === 0 ? 0.6 : 0.45, EASE.inOut);
    return Math.max(m, Math.min(inn, 1 - out));
  }, 0);

const SHAKES = [
  ...TWITCHES.map((at) => ({ at, amp: 0.006 })),
  { at: BEATS.coinDrop + 0.32, amp: 0.025 },
  { at: BEATS.zap, amp: 0.05 },
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
});

export const cameraAt = (t: number): Pose => {
  let pose = POSES[SCENES[0].id];
  for (const s of SCENES.slice(1)) pose = lerpPose(pose, POSES[s.id], pr(t, s.start, 0.35, EASE.inOut));
  pose = lerpPose(pose, macroPose(t), macroAt(t));
  const sh = shakeAt(t);
  const k = 0.3 + 0.7 * (1 - macroAt(t)); // di macro getarnya lebih kecil (jarak dekat)
  return { ...pose, x: pose.x + sh * k, y: pose.y - sh * 0.6 * k };
};

/** Kanvas penuh 1080x1920; proyeksi = kamera virtual setinggi 2520 px dengan pusat di y=1260,
 *  sehingga karakter duduk di bagian bawah layar dan teks punya ruang di atas. */
const FOV = 66.6;
const FULL_H = 2520;
const applyLens = (cam: THREE.PerspectiveCamera) => {
  cam.fov = FOV;
  cam.near = 0.05;
  cam.far = 60;
  cam.setViewOffset(1080, FULL_H, 0, 0, 1080, 1920);
  cam.updateProjectionMatrix();
};

const Camera: React.FC<{ pose: Pose }> = ({ pose }) => {
  const camera = useThree((st) => st.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    applyLens(camera);
    camera.position.set(pose.x, pose.y, pose.z);
    camera.lookAt(pose.lx, pose.ly, pose.lz);
  }, [camera, pose.x, pose.y, pose.z, pose.lx, pose.ly, pose.lz]);
  return null;
};

/* ------------------------------ suasana ------------------------------ */

/** 0 = malam, 1 = pagi (mulai tips, bertahan sampai akhir) */
export const dayAt = (t: number) => pr(t, BEATS.morning, 0.6, EASE.inOut);

/* --------------------------- si biru (ekspresi) --------------------------- */

const BLINKS = [5.6, 9.8, 15.2, 21.4, 27.9, 33.1, 38.7, 44.6, 49.2];

const faceAt = (t: number): FaceState => {
  const blink = BLINKS.some((b) => Math.abs(t - b) < 0.05) ? 0.1 : 1;
  const day = dayAt(t);
  const tired = 1 - pr(t, BEATS.calm, 0.5);
  const yawn = hold(t, BEATS.yawn, BEATS.yawn + 0.9, 0.2, 0.25);
  const hope = hold(t, BEATS.coin, BEATS.coinDrop + 0.2, 0.15, 0.2);
  const huh = hold(t, BEATS.wallet + 0.15, END("mitos"), 0.12, 0.25);
  const think = hold(t, BEATS.quiz, BEATS.tapB, 0.2, 0.2);
  const aha = hold(t, BEATS.tapB, END("promise"), 0.1, 0.25);
  const zap = hold(t, BEATS.zap, BEATS.zap + 0.9, 0.05, 0.3);
  const stress = hold(t, BEATS.notif1, END("p3"), 0.2, 0.3);
  const relief = hold(t, BEATS.calm, END("fakta"), 0.25, 0.25);
  const fresh = hold(t, BEATS.morning + 0.3, END("tips"), 0.3, 0.25);
  const worry = hold(t, BEATS.serious, END("serius"), 0.3, 0.3);
  const happy = pr(t, S("komen"), 0.3);
  const bags = pr(t, BEATS.bags, 0.4) * (1 - pr(t, BEATS.tick1, 0.4));
  return {
    eyeOpen: Math.max(0.06, Math.min(blink, 1 - 0.32 * tired * (1 - day) - yawn * 0.6 + zap * 0.25)),
    twitchL: twitchAt(t),
    bags: Math.max(bags, 0.35 * tired * (1 - day) * pr(t, 0.01, 0.01)),
    yawn,
    smile: Math.max(hope, aha * 0.8, relief * 0.7, fresh, happy, 0.15 * (1 - stress)),
    open: Math.max(huh * 0.7, zap * 0.6),
    surprise: Math.max(zap, huh * 0.6, hope * 0.5),
    sleepy: Math.max(0.55 * tired * (1 - day) * (1 - hope) * (1 - zap), yawn * 0.6),
    sad: Math.max(huh * 0.6, stress * 0.6, worry * 0.9, think * 0.3),
    frown: Math.max(stress * 0.5, worry * 0.5),
    blush: Math.max(hope * 0.6, happy * 0.4),
    sweat: Math.max(stress, zap * 0.7, worry * 0.5),
  };
};

const SiBiru: React.FC<{ t: number }> = ({ t }) => {
  const reach = hold(t, BEATS.wallet - 0.35, END("mitos") - 0.1, 0.25, 0.3);
  const lookUp = hold(t, BEATS.coin, BEATS.coinDrop + 0.1, 0.15, 0.2);
  const lookDown = hold(t, BEATS.coinDrop + 0.1, BEATS.coinDrop + 0.7, 0.15, 0.25);
  const flinch = hold(t, BEATS.zap, BEATS.zap + 0.6, 0.06, 0.3);
  const lean = hold(t, BEATS.notif1 - 0.1, BEATS.dry - 0.3, 0.3, 0.3); // condong ke laptop, lalu mundur (mata perih)
  const slump = hold(t, S("p1"), END("p1") - 0.1, 0.3, 0.3);
  const stretch = hold(t, BEATS.morning + 0.25, BEATS.tick1 + 0.5, 0.35, 0.35);
  const wave = hold(t, BEATS.teamR, END("komen") - 0.1, 0.3, 0.3);

  const bend = slump * 0.18 + lean * 0.22 - flinch * 0.15 - stretch * 0.1;
  const bones: BoneOverride = {
    spine_01: [bend * 0.4, 0, 0],
    spine_02: [bend * 0.4, 0, 0],
    spine_03: [bend * 0.3, 0, 0],
    Head: [-lookUp * 0.4 + lookDown * 0.3 + slump * 0.12 - flinch * 0.2, 0, slump * 0.1],
    upperarm_r: [reach * 0.9 + lean * 0.5, 0, -stretch * 1.7],
    lowerarm_r: [-reach * 0.4 - stretch * 1.0, 0, 0],
    upperarm_l: [lean * 0.5, 0, Math.max(stretch, wave) * 1.75],
    lowerarm_l: [-Math.max(stretch, wave) * 1.05, 0, 0],
  };

  return (
    <Character3D
      look="cartoon"
      face={faceAt(t)}
      wardrobe={WARDROBE}
      colors={COLORS}
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

/* ------------------------------- kamar ------------------------------- */

const STARS = Array.from({ length: 14 }, (_, i) => [(rnd(i) - 0.5) * 0.9, (rnd(i + 40) - 0.5) * 1.05, rnd(i + 80)] as const);

const Room: React.FC<{ t: number; day: number }> = ({ t, day }) => {
  const wall = new THREE.Color("#1c2244").lerp(new THREE.Color("#f2dfc4"), day);
  const floor = new THREE.Color("#2a2340").lerp(new THREE.Color("#c99c6e"), day);
  const glass = new THREE.Color("#0a0f2e").lerp(new THREE.Color("#9fd8ff"), day);
  // jam dinding: 02.00 → 07.00 saat pagi (jarum pendek berputar sekali)
  const hourA = -((2 + 5 * day) / 12) * Math.PI * 2;
  return (
    <group>
      <mesh position={[0, 3, -1.7]}>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial color={wall} roughness={0.95} />
      </mesh>
      <mesh position={[0, 0, 1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial color={floor} roughness={0.9} />
      </mesh>
      {/* jendela */}
      <group position={[-1.35, 3.0, -1.68]}>
        <mesh>
          <boxGeometry args={[1.15, 1.3, 0.05]} />
          <meshStandardMaterial color="#e9e4da" />
        </mesh>
        <mesh position={[0, 0, 0.03]}>
          <planeGeometry args={[1.0, 1.15]} />
          <meshStandardMaterial color={glass} emissive={glass} emissiveIntensity={0.35 + 0.4 * day} />
        </mesh>
        {day < 0.95
          ? STARS.map(([x, y, s], i) => (
              <mesh key={i} position={[x, y, 0.04]} scale={(0.6 + s * 0.8) * (1 - day)}>
                <sphereGeometry args={[0.018, 6, 6]} />
                <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
              </mesh>
            ))
          : null}
        {/* bulan → matahari */}
        <mesh position={[0.25, 0.3 - 0.15 * day, 0.045]}>
          <circleGeometry args={[0.12 + 0.03 * day, 24]} />
          <meshStandardMaterial
            color={new THREE.Color("#f5f1d8").lerp(new THREE.Color("#FFD400"), day)}
            emissive={new THREE.Color("#f5f1d8").lerp(new THREE.Color("#ffb000"), day)}
            emissiveIntensity={0.9}
          />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <boxGeometry args={[0.04, 1.15, 0.02]} />
          <meshStandardMaterial color="#e9e4da" />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <boxGeometry args={[1.0, 0.04, 0.02]} />
          <meshStandardMaterial color="#e9e4da" />
        </mesh>
      </group>
      {/* jam dinding */}
      <group position={[1.3, 3.35, -1.66]} scale={1 + 0.12 * hop(t, BEATS.clock, 0.3)}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.05, 32]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.3, 0.025, 8, 32]} />
          <meshStandardMaterial color="#e3263b" />
        </mesh>
        <mesh position={[0, 0, 0.035]} rotation={[0, 0, hourA]}>
          <boxGeometry args={[0.03, 0.17, 0.01]} />
          <meshStandardMaterial color="#1b1b1f" />
        </mesh>
        <mesh position={[0, 0, 0.035]}>
          <boxGeometry args={[0.02, 0.24, 0.01]} />
          <meshStandardMaterial color="#1b1b1f" />
        </mesh>
      </group>
      {/* poster dinding + stiker @day.one.eight (anti re-upload) */}
      <group position={[0.15, 3.55, -1.66]} rotation={[0, 0, -0.04]}>
        <mesh>
          <boxGeometry args={[0.8, 0.5, 0.02]} />
          <meshStandardMaterial color="#FFD400" />
        </mesh>
        <HandleDecal position={[0, 0, 0.015]} width={0.7} />
      </group>
      {/* kursi */}
      <mesh position={[0, 0.8, -0.15]}>
        <boxGeometry args={[0.95, 0.08, 0.85]} />
        <meshStandardMaterial color="#3a3f52" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.35, -0.62]} rotation={[-0.15, 0, 0]}>
        <boxGeometry args={[0.95, 0.95, 0.08]} />
        <meshStandardMaterial color="#3a3f52" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.4, -0.15]}>
        <cylinderGeometry args={[0.05, 0.05, 0.8, 10]} />
        <meshStandardMaterial color="#9aa0aa" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* meja */}
      <mesh position={[0, TABLE_TOP - 0.04, DESK_Z]}>
        <boxGeometry args={[2.4, 0.08, 0.95]} />
        <meshStandardMaterial color="#8a5a3a" roughness={0.6} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 1.1, (TABLE_TOP - 0.08) / 2, DESK_Z]}>
          <boxGeometry args={[0.08, TABLE_TOP - 0.08, 0.85]} />
          <meshStandardMaterial color="#6e4529" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
};

/* ------------------------------- props ------------------------------- */

const Laptop: React.FC<{ glow: number }> = ({ glow }) => (
  <group position={[-0.15, TABLE_TOP, DESK_Z + 0.05]}>
    <mesh position={[0, 0.015, 0]}>
      <boxGeometry args={[0.7, 0.03, 0.45]} />
      <meshStandardMaterial color="#b9bec8" metalness={0.4} roughness={0.4} />
    </mesh>
    {/* layar menghadap si biru (−Z); punggung + stiker menghadap kamera (+Z) */}
    <group position={[0, 0.03, 0.2]} rotation={[0.25, 0, 0]}>
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[0.7, 0.45, 0.025]} />
        <meshStandardMaterial color="#b9bec8" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.22, -0.014]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.64, 0.4]} />
        <meshStandardMaterial color="#9fd0ff" emissive="#7fc0ff" emissiveIntensity={0.4 + glow} />
      </mesh>
      <HandleDecal position={[0, 0.22, 0.014]} width={0.5} />
    </group>
  </group>
);

const Lamp: React.FC = () => (
  <group position={[-0.9, TABLE_TOP, DESK_Z - 0.15]}>
    <mesh position={[0, 0.02, 0]}>
      <cylinderGeometry args={[0.12, 0.14, 0.04, 20]} />
      <meshStandardMaterial color="#2a2a2e" />
    </mesh>
    <mesh position={[0.05, 0.3, 0]} rotation={[0, 0, -0.25]}>
      <cylinderGeometry args={[0.015, 0.015, 0.6, 8]} />
      <meshStandardMaterial color="#2a2a2e" />
    </mesh>
    <mesh position={[0.18, 0.58, 0.02]} rotation={[0, 0, -1.0]}>
      <coneGeometry args={[0.13, 0.18, 20, 1, true]} />
      <meshStandardMaterial color="#FFD400" side={2} emissive="#ffb000" emissiveIntensity={0.4} />
    </mesh>
  </group>
);

/** HP tergeletak di meja; menyala + bergetar saat ada notifikasi */
const Phone: React.FC<{ t: number }> = ({ t }) => {
  const buzzes = [BEATS.buzz1, BEATS.notif1, BEATS.notif2, BEATS.notif3];
  const lit = buzzes.some((b) => t >= b && t < b + 1.4) ? 1 : 0;
  const jitter = buzzes.reduce((acc, b) => {
    const d = t - b;
    const on = (d >= 0 && d < 0.22) || (d >= 0.32 && d < 0.54);
    return on ? (Math.floor(d * 60) % 2 ? 0.012 : -0.012) : acc;
  }, 0);
  return (
    <group position={[-0.62 + jitter, TABLE_TOP + 0.012, DESK_Z + 0.3]} rotation={[0, 0.35, 0]}>
      <mesh>
        <boxGeometry args={[0.16, 0.022, 0.3]} />
        <meshStandardMaterial color="#1b1b1f" />
      </mesh>
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.14, 0.27]} />
        <meshStandardMaterial color={lit ? "#cfe8ff" : "#0d0f18"} emissive="#9fd0ff" emissiveIntensity={lit * 0.9} />
      </mesh>
    </group>
  );
};

const Coin: React.FC = () => (
  <group rotation={[Math.PI / 2, 0, 0]}>
    <mesh>
      <cylinderGeometry args={[0.13, 0.13, 0.03, 32]} />
      <meshStandardMaterial color="#FFD400" metalness={0.7} roughness={0.25} emissive="#a06a00" emissiveIntensity={0.35} />
    </mesh>
    <mesh position={[0, 0.017, 0]}>
      <cylinderGeometry args={[0.09, 0.09, 0.005, 24]} />
      <meshStandardMaterial color="#ffc21a" metalness={0.7} roughness={0.3} />
    </mesh>
  </group>
);

/** posisi koin: pop di atas kepala (rezeki!) lalu jatuh "tuk" ke meja dan diam */
const coinAt = (t: number) => {
  if (t < BEATS.coin || t > END("mitos")) return null;
  const s = pr(t, BEATS.coin, 0.35, EASE.back) * (1 - pr(t, END("mitos") - 0.15, 0.15, EASE.in));
  const spin = (1 - pr(t, BEATS.coin, 0.45)) * Math.PI * 4; // 2 putaran lalu menghadap kamera
  const fall = pr(t, BEATS.coinDrop, 0.32, EASE.in);
  const y = 3.0 + (TABLE_TOP + 0.02 - 3.0) * fall + 0.12 * hop(t, BEATS.coinDrop + 0.32, 0.22);
  const x = 0.2 + 0.4 * fall;
  const z = 0.55 + (DESK_Z + 0.1 - 0.55) * fall;
  const flat = pr(t, BEATS.coinDrop + 0.2, 0.15);
  return { x, y, z, s, rotY: spin, rotX: flat * (Math.PI / 2) };
};

const Wallet: React.FC<{ t: number }> = ({ t }) => {
  const vis = popIn(t, S("mitos") + 0.15, END("mitos"));
  if (vis <= 0) return null;
  const open = pr(t, BEATS.wallet, 0.3, EASE.back);
  const dust = pr(t, BEATS.wallet + 0.1, 0.8, EASE.out);
  return (
    <group position={[0.62, TABLE_TOP + 0.02, DESK_Z + 0.22]} scale={vis * 1.2} rotation={[0, -0.25, 0]}>
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[0.36, 0.04, 0.24]} />
        <meshStandardMaterial color="#6b3d1f" roughness={0.7} />
      </mesh>
      <group position={[0, 0.04, -0.12]} rotation={[-open * 1.9, 0, 0]}>
        <mesh position={[0, 0.0, 0.12]}>
          <boxGeometry args={[0.36, 0.03, 0.24]} />
          <meshStandardMaterial color="#7d4a26" roughness={0.7} />
        </mesh>
      </group>
      {/* isinya cuma debu: kepulan keluar sekali lalu hilang */}
      {dust > 0 && dust < 1
        ? Array.from({ length: 6 }).map((_, i) => (
            <mesh
              key={i}
              position={[(rnd(i + 7) - 0.5) * 0.3 * (1 + dust), 0.08 + dust * (0.35 + rnd(i) * 0.25), (rnd(i + 3) - 0.5) * 0.15]}
              scale={(1 - dust) * (0.7 + rnd(i + 11) * 0.6)}
            >
              <sphereGeometry args={[0.05, 10, 8]} />
              <meshStandardMaterial color="#b9b2a6" transparent opacity={0.8} />
            </mesh>
          ))
        : null}
    </group>
  );
};

const Cup: React.FC = () => (
  <group>
    <mesh position={[0, 0.1, 0]}>
      <cylinderGeometry args={[0.1, 0.08, 0.2, 24]} />
      <meshStandardMaterial color="#ffffff" roughness={0.4} />
    </mesh>
    <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.092, 20]} />
      <meshStandardMaterial color="#4a2a16" />
    </mesh>
    <mesh position={[0, 0.08, 0]}>
      <cylinderGeometry args={[0.083, 0.083, 0.05, 20]} />
      <meshStandardMaterial color="#e3263b" />
    </mesh>
    <mesh position={[0.11, 0.11, 0]} rotation={[0, 0, Math.PI / 2]}>
      <torusGeometry args={[0.045, 0.012, 8, 14]} />
      <meshStandardMaterial color="#ffffff" />
    </mesh>
  </group>
);

/** menara gelas kopi: tiap gelas pop di atas gelas sebelumnya, lalu diam */
const Cups: React.FC<{ t: number }> = ({ t }) => {
  const end = END("p2");
  const at = [BEATS.cup1, BEATS.cup2, BEATS.cup3, BEATS.cup4];
  return (
    <group position={[0.55, TABLE_TOP, DESK_Z + 0.05]}>
      {at.map((a, i) => {
        const s = popIn(t, a, end);
        if (s <= 0) return null;
        const drop = 1 - pr(t, a, 0.22, EASE.in);
        const tilt = (i % 2 ? 1 : -1) * 0.08 * hop(t, at[3] ?? 0, 0.4) * (i + 1) * 0.5;
        return (
          <group key={i} position={[(i % 2 ? 0.015 : -0.015), i * 0.205 + drop * 0.35, 0]} rotation={[0, i * 0.6, tilt]} scale={s}>
            <Cup />
          </group>
        );
      })}
    </group>
  );
};

const Props: React.FC<{ t: number; day: number }> = ({ t, day }) => {
  const c = coinAt(t);
  const screenGlow = Math.max(0.4 * (1 - day), hold(t, BEATS.notif1, END("p3"), 0.2, 0.3));
  return (
    <group>
      <Laptop glow={screenGlow} />
      <Lamp />
      <Phone t={t} />
      <Wallet t={t} />
      <Cups t={t} />
      {c ? (
        <group position={[c.x, c.y, c.z]} scale={c.s} rotation={[c.rotX, c.rotY, 0]}>
          <Coin />
        </group>
      ) : null}
    </group>
  );
};

/* -------------------------------- proyeksi -------------------------------- */

const projCam = new THREE.PerspectiveCamera(FOV, 1080 / FULL_H, 0.05, 60);
applyLens(projCam);
/** Posisi layar (px, komposisi 1080x1920) sebuah titik 3D, untuk overlay. */
export const toScreen = (t: number, p: [number, number, number]) => {
  const cam = cameraAt(t);
  projCam.position.set(cam.x, cam.y, cam.z);
  projCam.lookAt(cam.lx, cam.ly, cam.lz);
  projCam.updateMatrixWorld(true);
  const v = new THREE.Vector3(...p).project(projCam);
  return { x: ((v.x + 1) / 2) * 1080, y: ((1 - v.y) / 2) * 1920 };
};
/** titik di atas kepala si biru */
export const headScreen = (t: number) => toScreen(t, [0, 3.0, 0.3]);
/** di atas laptop (notifikasi) */
export const laptopScreen = (t: number) => toScreen(t, [-0.15, TABLE_TOP + 0.62, DESK_Z + 0.2]);
/** di atas dompet */
export const walletScreen = (t: number) => toScreen(t, [0.62, TABLE_TOP + 0.45, DESK_Z + 0.22]);

/* -------------------------------- scene ------------------------------- */

export const Scene3D: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const cam = cameraAt(t);
  const day = dayAt(t);
  const night = 1 - day;
  const screen = hold(t, BEATS.notif1, END("p3"), 0.2, 0.3);
  return (
    <ThreeCanvas width={width} height={height} camera={{ fov: FOV, position: [0, 2.6, 7.8] }}>
      <Camera pose={cam} />
      <ambientLight intensity={0.28 + 0.6 * day} color={day > 0.5 ? "#ffffff" : "#8f9cff"} />
      {/* lampu meja hangat dari kiri */}
      <pointLight position={[-0.75, 2.0, 0.9]} intensity={(6 + 2 * screen) * night + 1} distance={6} color="#ffb766" />
      {/* cahaya biru layar ke wajah */}
      <pointLight position={[-0.1, 1.75, 0.95]} intensity={(3 + 6 * screen) * night} distance={3.2} color="#7fb8ff" />
      {/* rim light biru dari belakang (malam) / matahari pagi dari jendela */}
      <directionalLight position={[-2, 4, -4]} intensity={1.4 * night + 0.6 * day} color="#6f86ff" />
      <directionalLight position={[-3, 5, 4]} intensity={2.4 * day} color="#fff1dc" />
      <directionalLight position={[3, 3, 5]} intensity={0.35 + 0.8 * day} color="#ffffff" />
      <Room t={t} day={day} />
      <SiBiru t={t} />
      <Props t={t} day={day} />
    </ThreeCanvas>
  );
};
