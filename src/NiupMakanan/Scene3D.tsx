// Scene 3D "makanan panas gaboleh ditiup" — si biru jadi koki mini 👨‍🍳 di meja makan dapur,
// semangkuk bakso beruap. Meniup sendok (pipi menggembung) → napas membawa kuman ke bakso; kue
// ulang tahun (studi tiup lilin); bayi di kursi makan; bersin flu → percikan ke kuah.
// Macro zoom in/out ke mulut, sendok, bayi, dan mangkuk pada ketukan. Gerak diskret per ketukan.

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
import { BEATS, BLOWS, SPOON_UP, ZoomTarget, ZOOMS } from "./beats";
import { END, sceneById, SceneId, SCENES } from "./script";

const TABLE_TOP = 1.2;
const DESK_Z = 0.78;
const CHAR_SCALE = 1.75;
const WARDROBE: Wardrobe = { hair: "bowl", outfit: "chef", accessories: ["chef_hat"] };
const COLORS = { pants: "#2b2f3a", shoes: "#ffffff" };
const SKIN = "#f2c09b";

type V3 = [number, number, number];
/** mulut si biru (perkiraan dunia) */
export const MOUTH: V3 = [0.125, 2.215, 0.49];
/** mangkuk bakso di meja */
export const BOWL: V3 = [0.02, TABLE_TOP, DESK_Z - 0.1];
/** bakso di sendok saat diangkat ke depan mulut */
const SPOON_HELD: V3 = [MOUTH[0] + 0.07, MOUTH[1] - 0.17, MOUTH[2] + 0.3];
/** bakso di sendok saat diam di mangkuk */
const SPOON_REST: V3 = [BOWL[0] + 0.03, BOWL[1] + 0.13, BOWL[2] + 0.02];
/** kue ulang tahun (studi tiup lilin) */
const CAKE: V3 = [0.62, TABLE_TOP, DESK_Z - 0.02];
/** bayi di kursi makan tinggi (ujung kanan meja) */
const BABY: V3 = [1.42, 1.58, DESK_Z - 0.05];
export const BABY_MOUTH: V3 = [BABY[0] - 0.03, BABY[1] - 0.06, BABY[2] + 0.16];
const BABY_SPOON: V3 = [BABY_MOUTH[0] - 0.13, BABY_MOUTH[1] - 0.02, BABY_MOUTH[2] + 0.08];

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
type Ease = (x: number) => number;
const pr = (t: number, start: number, dur: number, ease: Ease = EASE.out) =>
  interpolate(t, [start, start + Math.max(0.001, dur)], [0, 1], { ...CLAMP, easing: ease });
const hold = (t: number, a: number, b: number, inDur = 0.2, outDur = 0.25) =>
  Math.min(pr(t, a, inDur), 1 - pr(t, b, outDur, EASE.in));
const S = (id: SceneId) => sceneById(id).start;
const popIn = (t: number, from: number, to: number) =>
  t < from || t > to ? 0 : pr(t, from, 0.35, EASE.back) * (1 - pr(t, to - 0.15, 0.15, EASE.in));
const wiggle = (t: number, at: number, dur: number, n = 2) => {
  const u = pr(t, at, dur, (v) => v);
  return u <= 0 || u >= 1 ? 0 : Math.sin(u * Math.PI * 2 * n) * (1 - u);
};
const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/** 0..1 seberapa sedang meniup */
export const blowAt = (t: number) => BLOWS.reduce((m, [a, b]) => Math.max(m, hold(t, a, b, 0.15, 0.2)), 0);
/** 0..1 sendok diangkat ke depan mulut */
const spoonUpAt = (t: number) => SPOON_UP.reduce((m, [a, b]) => Math.max(m, hold(t, a, b, 0.4, 0.35)), 0);
/** posisi bakso di sendok */
export const spoonBall = (t: number): V3 => lerp3(SPOON_REST, SPOON_HELD, spoonUpAt(t));
/** tiupan ke bayi (p2): kepala menoleh kanan */
const babyBlowAt = (t: number) => hold(t, BEATS.baby + 0.05, BEATS.baby + 0.75, 0.2, 0.25);
/** bersin */
const sneezeAt = (t: number) => hold(t, BEATS.sneeze - 0.05, BEATS.sneeze + 0.3, 0.06, 0.3);
const inhaleSneezeAt = (t: number) => hold(t, BEATS.sneeze - 0.5, BEATS.sneeze - 0.05, 0.3, 0.05);

/** 0..1 panas makanan (uap): turun saat ditiup/didinginkan, hampir habis setelah "tunggu" */
const heatAt = (t: number) => 1 - 0.45 * pr(t, BEATS.cool, 0.6, EASE.inOut) - 0.45 * pr(t, BEATS.tick3, 1.2, EASE.inOut);

/* ------------------------------- kamera ------------------------------- */

type Pose = { x: number; y: number; z: number; lx: number; ly: number; lz: number };
const P = (x: number, y: number, z: number, ly: number, lx = 0, lz = 0.3): Pose => ({ x, y, z, lx, ly, lz });
const POSES: Record<SceneId, Pose> = {
  hook: P(0.55, 2.4, 5.0, 2.05),
  ehem: P(-0.7, 2.5, 5.8, 2.05),
  p1: P(0.9, 2.3, 5.2, 1.95, 0.2),
  p2: P(1.6, 2.4, 5.4, 1.95, 0.6),
  p3: P(-0.5, 2.25, 5.0, 1.9),
  twist: P(0.4, 2.5, 5.6, 2.0),
  tips: P(-0.6, 2.55, 5.8, 2.0),
  komen: P(0, 2.5, 6.0, 2.0),
};
const macroPose = (target: ZoomTarget, t: number): Pose => {
  const p: V3 =
    target === "mouth"
      ? [(MOUTH[0] + SPOON_HELD[0]) / 2, MOUTH[1] - 0.04, (MOUTH[2] + SPOON_HELD[2]) / 2]
      : target === "spoon"
        ? spoonBall(t)
        : target === "baby"
          ? [(BABY_MOUTH[0] + BABY_SPOON[0]) / 2, BABY_MOUTH[1], BABY_MOUTH[2]]
          : [BOWL[0], BOWL[1] + 0.1, BOWL[2]];
  const d = target === "mouth" ? 1.15 : target === "spoon" ? 0.75 : target === "baby" ? 0.85 : 0.75;
  const up = target === "bowl" ? 0.45 : 0.03;
  return { x: p[0] + 0.04, y: p[1] + up, z: p[2] + d, lx: p[0], ly: p[1], lz: p[2] };
};

export const macroAt = (t: number) =>
  ZOOMS.reduce((m, [a, b]) => Math.max(m, Math.min(pr(t, a, 0.3, EASE.inOut), 1 - pr(t, b, 0.45, EASE.inOut))), 0);
const zoomTarget = (t: number) =>
  ZOOMS.reduce((best, cur) => (Math.abs(t - (cur[0] + cur[1]) / 2) < Math.abs(t - (best[0] + best[1]) / 2) ? cur : best))[2];

const SHAKES = [
  { at: BEATS.scold, amp: 0.03 },
  { at: BEATS.sneeze, amp: 0.06 },
  { at: BEATS.plus, amp: 0.025 },
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
  pose = lerpPose(pose, macroPose(zoomTarget(t), t), macroAt(t));
  const sh = shakeAt(t) * (0.25 + 0.75 * (1 - macroAt(t)));
  return { ...pose, x: pose.x + sh, y: pose.y - sh * 0.6 };
};

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

/* --------------------------- si biru (ekspresi) --------------------------- */

const BLINKS = [3.1, 7.9, 12.6, 17.8, 22.4, 27.9, 33.1, 38.6, 43.2];

const faceAt = (t: number): FaceState => {
  const blink = BLINKS.some((b) => Math.abs(t - b) < 0.05) ? 0.1 : 1;
  const puff = Math.max(blowAt(t), babyBlowAt(t));
  const yum = hold(t, BEATS.lift, BEATS.blow0 - 0.15, 0.25, 0.15);
  const shock = hold(t, BEATS.scold, END("ehem"), 0.08, 0.3);
  const ew = hold(t, BEATS.germs1 + 0.3, BEATS.cake - 0.1, 0.2, 0.2);
  const proud = hold(t, BEATS.x15, END("p1"), 0.2, 0.3) * 0;
  const worry = hold(t, BEATS.move2, END("p2"), 0.2, 0.3);
  const sick = hold(t, BEATS.flu, END("p3"), 0.3, 0.3);
  const inhale = inhaleSneezeAt(t);
  const sneeze = sneezeAt(t);
  const grin = hold(t, BEATS.plus, END("twist"), 0.1, 0.3);
  const fresh = hold(t, S("tips") + 0.3, END("tips"), 0.3, 0.3);
  const happy = pr(t, S("komen"), 0.3);
  return {
    eyeOpen: Math.max(0.06, Math.min(blink, 1 - sneeze * 0.9 - inhale * 0.35 - sick * 0.25 + shock * 0.1)),
    puff,
    buck: grin,
    smile: Math.max(yum, fresh, happy, 0.25 * (1 - ew) * (1 - sick) + proud),
    open: Math.max(shock * 0.8, inhale * 0.6, sneeze),
    surprise: Math.max(shock, inhale * 0.7, worry * 0.4),
    sad: Math.max(ew * 0.5, worry * 0.7, sick * 0.6, grin * 0.3),
    frown: Math.max(ew * 0.7, worry * 0.4),
    pale: sick * 0.25,
    blush: Math.max(happy * 0.4, sick * 0.8, yum * 0.3, puff * 0.5),
    sweat: Math.max(shock * 0.8, sick * 0.7, grin * 0.6),
  };
};

const SiBiru: React.FC<{ t: number }> = ({ t }) => {
  const spoon = spoonUpAt(t);
  const blow = blowAt(t);
  const shock = hold(t, BEATS.scold, END("ehem") - 0.1, 0.08, 0.3);
  const babyBlow = babyBlowAt(t);
  const lookBaby = hold(t, S("p2") + 0.1, END("p2") - 0.1, 0.3, 0.3);
  const inhale = inhaleSneezeAt(t);
  const sneeze = sneezeAt(t);
  const candle = hold(t, BEATS.candle - 0.3, BEATS.candle + 0.6, 0.25, 0.3);
  const stir = hold(t, BEATS.tick1 - 0.2, BEATS.tick1 + 0.9, 0.2, 0.3);
  const wave = hold(t, BEATS.teamB, END("komen") - 0.1, 0.3, 0.3);

  const bones: BoneOverride = {
    spine_01: [shock * -0.08 + sneeze * 0.12 - inhale * 0.06, 0, 0],
    spine_02: [blow * 0.04 + candle * 0.06 + stir * 0.06 + sneeze * 0.1, candle * 0.12 + lookBaby * 0.1, 0],
    Head: [blow * 0.05 - inhale * 0.25 + sneeze * 0.45 - shock * 0.1, lookBaby * 0.55 + candle * 0.35 + babyBlow * 0.1, 0],
    // tangan kanan memegang sendok di depan mulut
    upperarm_r: [spoon * 1.25 + stir * 0.55, 0, 0],
    lowerarm_r: [spoon * 0.75 + stir * 0.35, 0, 0],
    upperarm_l: [sneeze * 1.2 + inhale * 0.9, 0, wave * 1.75],
    lowerarm_l: [-wave * 1.05 + (sneeze + inhale) * 0.7, 0, 0],
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

/* ------------------------------- dapur ------------------------------- */

const TILE = "#f6f1e7";

const Kitchen: React.FC = () => (
  <group>
    {/* dinding hangat + lantai kayu */}
    <mesh position={[0, 3, -1.7]}>
      <planeGeometry args={[12, 8]} />
      <meshStandardMaterial color="#ffd9a8" roughness={0.95} />
    </mesh>
    {/* backsplash keramik: deretan ubin putih di bawah */}
    {Array.from({ length: 10 }).map((_, i) =>
      Array.from({ length: 3 }).map((__, j) => (
        <mesh key={`${i}-${j}`} position={[-2.25 + i * 0.5, 1.05 + j * 0.5, -1.68]}>
          <boxGeometry args={[0.47, 0.47, 0.02]} />
          <meshStandardMaterial color={(i + j) % 2 ? TILE : "#e9f4f1"} roughness={0.4} />
        </mesh>
      )),
    )}
    <mesh position={[0, 0, 1]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[12, 8]} />
      <meshStandardMaterial color="#c99c6e" roughness={0.9} />
    </mesh>
    {/* jendela kiri: langit siang */}
    <group position={[-1.55, 3.05, -1.66]}>
      <mesh>
        <boxGeometry args={[1.1, 0.95, 0.04]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0, 0.025]}>
        <planeGeometry args={[0.98, 0.83]} />
        <meshStandardMaterial color="#9fdcff" emissive="#9fdcff" emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[0.03, 0.85, 0.02]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.2, 0.18, 0.028]}>
        <circleGeometry args={[0.1, 20]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
    {/* papan menu berstiker @day.one.eight */}
    <group position={[1.4, 3.05, -1.64]} rotation={[0, 0, -0.03]}>
      <mesh>
        <boxGeometry args={[1.15, 1.0, 0.04]} />
        <meshStandardMaterial color="#2f3b33" />
      </mesh>
      {[
        [-0.18, 0.3, 0.55],
        [-0.1, 0.12, 0.7],
        [-0.22, -0.04, 0.45],
      ].map(([x, y, len], i) => (
        <mesh key={i} position={[x, y, 0.025]}>
          <boxGeometry args={[len, 0.035, 0.005]} />
          <meshStandardMaterial color="#f4f1ea" />
        </mesh>
      ))}
      <HandleDecal position={[0, -0.3, 0.025]} width={0.85} />
    </group>
    {/* rak + toples bumbu */}
    <group position={[0, 3.55, -1.5]}>
      <mesh>
        <boxGeometry args={[1.3, 0.05, 0.3]} />
        <meshStandardMaterial color="#8a5a3a" />
      </mesh>
      {["#ff8a3d", "#e3263b", "#5cc56b", "#FFD400"].map((c, i) => (
        <group key={i} position={[-0.45 + i * 0.3, 0.13, 0]}>
          <mesh>
            <cylinderGeometry args={[0.08, 0.08, 0.2, 16]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.6} roughness={0.1} />
          </mesh>
          <mesh position={[0, -0.03, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.12, 16]} />
            <meshStandardMaterial color={c} />
          </mesh>
          <mesh position={[0, 0.11, 0]}>
            <cylinderGeometry args={[0.085, 0.085, 0.03, 16]} />
            <meshStandardMaterial color="#8a5a3a" />
          </mesh>
        </group>
      ))}
    </group>
    {/* kursi */}
    <mesh position={[0, 0.8, -0.15]}>
      <boxGeometry args={[0.95, 0.08, 0.85]} />
      <meshStandardMaterial color="#e3263b" roughness={0.6} />
    </mesh>
    <mesh position={[0, 1.35, -0.62]} rotation={[-0.15, 0, 0]}>
      <boxGeometry args={[0.95, 0.95, 0.08]} />
      <meshStandardMaterial color="#e3263b" roughness={0.6} />
    </mesh>
    <mesh position={[0, 0.4, -0.15]}>
      <cylinderGeometry args={[0.05, 0.05, 0.8, 10]} />
      <meshStandardMaterial color="#9aa0aa" metalness={0.5} roughness={0.4} />
    </mesh>
    {/* meja + taplak kotak-kotak + panel depan berstiker */}
    <mesh position={[0, TABLE_TOP - 0.04, DESK_Z]}>
      <boxGeometry args={[2.4, 0.08, 0.95]} />
      <meshStandardMaterial color="#ffffff" roughness={0.6} />
    </mesh>
    {Array.from({ length: 12 }).map((_, i) =>
      Array.from({ length: 5 }).map((__, j) =>
        (i + j) % 2 ? null : (
          <mesh key={`g${i}-${j}`} position={[-1.1 + i * 0.2, TABLE_TOP + 0.001, DESK_Z - 0.38 + j * 0.19]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.2, 0.19]} />
            <meshStandardMaterial color="#ff9aa2" roughness={0.7} />
          </mesh>
        ),
      ),
    )}
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * 1.1, (TABLE_TOP - 0.08) / 2, DESK_Z]}>
        <boxGeometry args={[0.08, TABLE_TOP - 0.08, 0.85]} />
        <meshStandardMaterial color="#d9d4ca" roughness={0.6} />
      </mesh>
    ))}
    <mesh position={[0, TABLE_TOP - 0.2, DESK_Z + 0.44]}>
      <boxGeometry args={[2.2, 0.26, 0.04]} />
      <meshStandardMaterial color="#e3263b" roughness={0.6} />
    </mesh>
    <HandleDecal position={[-0.45, TABLE_TOP - 0.2, DESK_Z + 0.465]} width={0.62} />
    {/* kaleng kerupuk berstiker */}
    <group position={[-0.78, TABLE_TOP, DESK_Z - 0.12]}>
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.32, 0.4, 0.32]} />
        <meshStandardMaterial color="#f5b83d" roughness={0.4} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.27, 0.161]}>
        <planeGeometry args={[0.24, 0.16]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.55} />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[0.34, 0.04, 0.34]} />
        <meshStandardMaterial color="#e3263b" />
      </mesh>
      <HandleDecal position={[0, 0.09, 0.162]} width={0.28} />
    </group>
    {/* lampu gantung */}
    <mesh position={[0.1, 4.4, 0.6]}>
      <cylinderGeometry args={[0.01, 0.01, 1.2, 6]} />
      <meshStandardMaterial color="#333333" />
    </mesh>
    <mesh position={[0.1, 3.75, 0.6]}>
      <coneGeometry args={[0.28, 0.22, 24, 1, true]} />
      <meshStandardMaterial color="#5cc56b" side={THREE.DoubleSide} />
    </mesh>
    <mesh position={[0.1, 3.67, 0.6]}>
      <sphereGeometry args={[0.08, 12, 10]} />
      <meshStandardMaterial color="#fff6d8" emissive="#ffe08a" emissiveIntensity={1.2} />
    </mesh>
  </group>
);

/* ------------------------------- props ------------------------------- */

const Bakso: React.FC<{ r?: number; seed?: number }> = ({ r = 0.032, seed = 0 }) => (
  <mesh rotation={[rnd(seed) * 3, rnd(seed + 1) * 3, 0]}>
    <sphereGeometry args={[r, 16, 12]} />
    <meshStandardMaterial color="#9b6b45" roughness={0.85} />
  </mesh>
);

/** mangkuk ayam jago: putih bergaris merah, kuah, bakso, mi, daun bawang */
const Bowl: React.FC<{ t: number }> = ({ t }) => {
  const drops = t >= BEATS.sneeze + 0.3 && t < END("p3") + 0.1;
  return (
    <group position={BOWL}>
      <mesh position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.2, 0.12, 0.14, 32, 1, true]} />
        <meshStandardMaterial color="#ffffff" side={THREE.DoubleSide} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.005, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.01, 32]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.188, 0.008, 6, 40]} />
        <meshStandardMaterial color="#e3263b" />
      </mesh>
      <mesh position={[0, 0.14, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.2, 0.008, 6, 40]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* kuah */}
      <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.185, 32]} />
        <meshStandardMaterial color={drops ? "#d9a35b" : "#e0a95e"} roughness={0.2} />
      </mesh>
      {/* bakso + mi + daun bawang */}
      {[
        [-0.07, 0.04],
        [0.06, 0.07],
        [0.0, -0.07],
        [-0.08, -0.05],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0.135, z]}>
          <Bakso r={0.042} seed={i} />
        </group>
      ))}
      {Array.from({ length: 7 }).map((_, i) => (
        <mesh key={`m${i}`} position={[0.08 - i * 0.02, 0.124, -0.02 + (i % 2) * 0.03]} rotation={[-Math.PI / 2, 0, 0.6 + i * 0.25]}>
          <torusGeometry args={[0.035, 0.004, 4, 16, Math.PI]} />
          <meshStandardMaterial color="#f6dc8a" />
        </mesh>
      ))}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`d${i}`} position={[-0.1 + rnd(i + 20) * 0.2, 0.125, -0.1 + rnd(i + 30) * 0.2]}>
          <cylinderGeometry args={[0.009, 0.009, 0.006, 8]} />
          <meshStandardMaterial color="#5cc56b" />
        </mesh>
      ))}
    </group>
  );
};

/** sendok bebek (bakso di ujung). Mengikuti `spoonBall`; diaduk sekali saat "diaduk". */
const Spoon: React.FC<{ t: number }> = ({ t }) => {
  const up = spoonUpAt(t);
  const stir = pr(t, BEATS.tick1 - 0.1, 0.9, EASE.inOut);
  const stirOn = t > BEATS.tick1 - 0.1 && t < BEATS.tick1 + 0.9;
  let p = spoonBall(t);
  if (stirOn) {
    const a = stir * Math.PI * 2;
    p = add3(p, [Math.cos(a) * 0.07 - 0.07, -0.03, Math.sin(a) * 0.07]);
  }
  // pegangan (-X lokal): saat diam menyembul ke atas-kiri dari mangkuk; saat diangkat turun ke tangan kanan
  const rotZ = -0.9 + 1.4 * up;
  const eaten = t >= BEATS.tick1 - 0.1; // setelah "diaduk": bakso kembali ke kuah
  return (
    <group position={p} rotation={[0.15, 0.25, rotZ]}>
      <mesh scale={[1, 0.32, 1.25]}>
        <sphereGeometry args={[0.048, 20, 14]} />
        <meshStandardMaterial color="#dfe4ea" metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh position={[-0.15, 0.012, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.018, 0.24, 0.01]} />
        <meshStandardMaterial color="#dfe4ea" metalness={0.7} roughness={0.25} />
      </mesh>
      {eaten ? null : (
        <group position={[0, 0.03, 0]}>
          <Bakso r={0.034} seed={9} />
        </group>
      )}
    </group>
  );
};

/** uap: gumpalan putih transparan naik dari mangkuk (dan dari bakso di sendok), tanda "panas".
 *  Terdorong menjauh saat ditiup; makin tipis saat dingin. */
const Steam: React.FC<{ t: number }> = ({ t }) => {
  const heat = heatAt(t);
  const push = Math.max(blowAt(t), sneezeAt(t));
  const PERIOD = 1.5;
  const wisps: React.ReactNode[] = [];
  const sources: { base: V3; n: number; spread: number; scale: number }[] = [
    { base: [BOWL[0], BOWL[1] + 0.14, BOWL[2]], n: 5, spread: 0.12, scale: 1 },
  ];
  if (spoonUpAt(t) > 0.2) sources.push({ base: add3(spoonBall(t), [0, 0.035, 0]), n: 3, spread: 0.02, scale: 0.45 });
  sources.forEach((src, si) => {
    for (let i = 0; i < src.n; i++) {
      for (let k = 0; k < 3; k++) {
        const phase = (rnd(i * 7 + si * 31) + k / 3) * PERIOD;
        const u = ((t + phase) % PERIOD) / PERIOD; // 0..1 umur gumpalan
        const ox = (rnd(i + si * 11) - 0.5) * 2 * src.spread;
        const oz = (rnd(i + 5 + si * 11) - 0.5) * src.spread;
        const rise = u * 0.42 * src.scale;
        const drift = push * u * 0.25 * src.scale;
        const op = heat * 0.3 * Math.sin(u * Math.PI) * (1 - push * 0.6);
        if (op < 0.01) continue;
        const sc = (0.035 + u * 0.06) * (src.scale > 0.5 ? 1 : 0.6);
        wisps.push(
          <mesh key={`${si}-${i}-${k}`} position={[src.base[0] + ox + drift, src.base[1] + rise, src.base[2] + oz - drift * 0.4]} scale={[sc, sc * 1.4, sc]}>
            <sphereGeometry args={[1, 10, 8]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={op} depthWrite={false} roughness={1} />
          </mesh>,
        );
      }
    }
  });
  return <>{wisps}</>;
};

/** target napas per tiupan: bakso di sendok, bakso di sendok, lilin kue */
const blowTarget = (i: number, t: number): V3 =>
  i === 2 ? [CAKE[0], CAKE[1] + 0.36, CAKE[2]] : add3(spoonBall(t), [0, 0.02, 0]);
const MOUTH_OUT: V3 = [MOUTH[0], MOUTH[1] - 0.015, MOUTH[2] + 0.06];

/** aliran napas: butir putih kecil dari mulut ke target, hanya selama tiupan */
const Breath: React.FC<{ t: number }> = ({ t }) => {
  const out: React.ReactNode[] = [];
  const streams: { a: number; b: number; target: (t: number) => V3; key: string }[] = BLOWS.map(([a, b], i) => ({
    a,
    b,
    target: (tt: number) => blowTarget(i, tt),
    key: `b${i}`,
  }));
  streams.push({ a: BEATS.baby + 0.15, b: BEATS.baby + 0.7, target: () => BABY_SPOON, key: "bb" });
  for (const s of streams) {
    if (t < s.a || t > s.b + 0.5) continue;
    for (let j = 0; j < 14; j++) {
      const born = s.a + j * 0.05;
      if (born > s.b) break;
      const u = pr(t, born, 0.4, (v) => v);
      if (u <= 0 || u >= 1) continue;
      const tgt = s.target(t);
      const p = lerp3(MOUTH_OUT, tgt, u);
      const wob = (rnd(j) - 0.5) * 0.03 * Math.sin(u * Math.PI);
      out.push(
        <mesh key={`${s.key}-${j}`} position={[p[0] + wob, p[1] + wob * 0.6, p[2]]} scale={0.012 + u * 0.012}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshStandardMaterial color="#e8f6ff" transparent opacity={0.55 * (1 - u * 0.6)} depthWrite={false} />
        </mesh>,
      );
    }
  }
  return <>{out}</>;
};

/** kuman lucu: bola warna, mata, duri kecil. `wave` = lambai/lompat sekali */
const Germ: React.FC<{ color: string; scale: number; hop?: number; sad?: boolean }> = ({ color, scale, hop = 0, sad }) => (
  <group scale={scale} position={[0, hop, 0]}>
    <mesh>
      <sphereGeometry args={[1, 14, 12]} />
      <meshStandardMaterial color={color} roughness={0.4} />
    </mesh>
    {[-1, 1].map((k) => (
      <mesh key={k} position={[k * 0.34, 0.2, 0.86]}>
        <sphereGeometry args={[0.17, 8, 6]} />
        <meshStandardMaterial color="#1b1b1f" />
      </mesh>
    ))}
    <mesh position={[0, -0.22, 0.9]} rotation={[0, 0, sad ? 0.4 : Math.PI + 0.4]}>
      <torusGeometry args={[0.2, 0.06, 6, 12, Math.PI * 0.75]} />
      <meshStandardMaterial color="#5a1f22" />
    </mesh>
    {[0, 1, 2, 3, 4].map((k) => (
      <mesh key={`s${k}`} position={[Math.cos(k * 1.25 + 0.3) * 1.05, Math.sin(k * 1.25 + 0.3) * 1.05, -0.1]}>
        <sphereGeometry args={[0.22, 6, 4]} />
        <meshStandardMaterial color={color} />
      </mesh>
    ))}
  </group>
);

const GERM_COLS = ["#9dff8a", "#ff8fb0", "#7fe3ff", "#FFD400", "#b38bff"];

/** p1: kuman ikut napas lalu duduk di bakso sendok; melambai sekali. Hilang saat sendok turun. */
const SpoonGerms: React.FC<{ t: number }> = ({ t }) => {
  const [a] = BLOWS[1];
  if (t < a || t > BEATS.cake) return null;
  const vis = 1 - pr(t, BEATS.cake - 0.35, 0.2, EASE.in);
  const ball = spoonBall(t);
  return (
    <>
      {GERM_COLS.map((c, i) => {
        const born = a + 0.1 + i * 0.1;
        const u = pr(t, born, 0.45, EASE.out);
        if (t < born) return null;
        const ang = (i / GERM_COLS.length) * Math.PI * 2;
        const land: V3 = add3(ball, [Math.cos(ang) * 0.03, 0.035 + Math.abs(Math.sin(ang)) * 0.012, Math.sin(ang) * 0.02 + 0.015]);
        const p = lerp3(MOUTH_OUT, land, u);
        const hop = wiggle(t, BEATS.germs1 + 0.2 + i * 0.08, 0.5, 1) * 0.006;
        return (
          <group key={i} position={[p[0], p[1] + Math.sin(u * Math.PI) * 0.03, p[2]]}>
            <Germ color={c} scale={0.0085 * vis * (0.6 + 0.4 * u)} hop={hop / 0.0085} />
          </group>
        );
      })}
    </>
  );
};

/** kue ulang tahun mini + 3 lilin; api padam saat ditiup; bintik kuman pop di krim pada "lima belas" */
const Cake: React.FC<{ t: number }> = ({ t }) => {
  const vis = popIn(t, BEATS.cake - 0.15, END("p1"));
  if (vis <= 0) return null;
  const out = pr(t, BEATS.candle + 0.15, 0.15, EASE.in);
  return (
    <group position={CAKE} scale={vis}>
      <mesh position={[0, 0.005, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.01, 32]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.18, 32]} />
        <meshStandardMaterial color="#ffb3c7" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.19, 0]}>
        <cylinderGeometry args={[0.165, 0.165, 0.02, 32]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh key={i} position={[Math.cos((i / 10) * Math.PI * 2) * 0.15, 0.19, Math.sin((i / 10) * Math.PI * 2) * 0.15]}>
          <sphereGeometry args={[0.022, 10, 8]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}
      {[-0.06, 0, 0.06].map((x, i) => (
        <group key={i} position={[x, 0.2, i === 1 ? 0.03 : -0.01]}>
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.009, 0.009, 0.12, 8]} />
            <meshStandardMaterial color={["#7fe3ff", "#FFD400", "#9dff8a"][i]} />
          </mesh>
          {out < 1 ? (
            <mesh position={[0, 0.14, 0]} scale={[1 - out, (1 - out) * 1.6, 1 - out]}>
              <sphereGeometry args={[0.016, 10, 8]} />
              <meshStandardMaterial color="#ffb000" emissive="#ff8a00" emissiveIntensity={1.4} />
            </mesh>
          ) : null}
          {/* asap kecil sekali setelah padam */}
          {t > BEATS.candle + 0.15 && t < BEATS.candle + 1.0 ? (
            <mesh position={[0.01, 0.15 + pr(t, BEATS.candle + 0.15, 0.85) * 0.12, 0]} scale={0.014 + pr(t, BEATS.candle + 0.15, 0.85) * 0.02}>
              <sphereGeometry args={[1, 8, 6]} />
              <meshStandardMaterial color="#cfd3da" transparent opacity={0.5 * (1 - pr(t, BEATS.candle + 0.15, 0.85))} depthWrite={false} />
            </mesh>
          ) : null}
        </group>
      ))}
      {/* 15 bintik kuman di krim */}
      {Array.from({ length: 15 }).map((_, i) => {
        const s = pr(t, BEATS.x15 + i * 0.04, 0.2, EASE.back);
        if (s <= 0) return null;
        const a = rnd(i + 40) * Math.PI * 2;
        const r = 0.04 + rnd(i + 50) * 0.1;
        return (
          <mesh key={`g${i}`} position={[Math.cos(a) * r, 0.202, Math.sin(a) * r]} scale={0.012 * s}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshStandardMaterial color={GERM_COLS[i % 5]} />
          </mesh>
        );
      })}
    </group>
  );
};

/** bayi di kursi makan tinggi: kepala bulat, jambul, celemek bebek, sendok kecil di depan mulut.
 *  Kuman (S. mutans, ungu) muncul di sendok lalu pindah ke mulut bayi. */
const Baby: React.FC<{ t: number }> = ({ t }) => {
  const vis = popIn(t, S("p2") + 0.05, END("p2") + 0.2);
  if (vis <= 0) return null;
  const sad = t >= BEATS.move2 + 0.4;
  const munch = hold(t, BEATS.move2 + 0.1, BEATS.move2 + 0.5, 0.1, 0.15);
  return (
    <group scale={vis}>
      {/* kursi tinggi */}
      <group position={[BABY[0], 0, BABY[2] - 0.05]}>
        {[-1, 1].map((sx) =>
          [-1, 1].map((sz) => (
            <mesh key={`${sx}${sz}`} position={[sx * 0.18, 0.62, sz * 0.18]} rotation={[sz * -0.08, 0, sx * 0.08]}>
              <cylinderGeometry args={[0.02, 0.025, 1.24, 8]} />
              <meshStandardMaterial color="#f5b83d" />
            </mesh>
          )),
        )}
        <mesh position={[0, 1.24, 0]}>
          <boxGeometry args={[0.44, 0.05, 0.44]} />
          <meshStandardMaterial color="#f5b83d" />
        </mesh>
        <mesh position={[0, 1.48, -0.2]}>
          <boxGeometry args={[0.44, 0.45, 0.04]} />
          <meshStandardMaterial color="#f5b83d" />
        </mesh>
        {/* nampan */}
        <mesh position={[-0.05, 1.36, 0.2]}>
          <boxGeometry args={[0.5, 0.03, 0.22]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>
      {/* badan + celemek */}
      <mesh position={[BABY[0], BABY[1] - 0.22, BABY[2] - 0.02]} scale={[1, 1.05, 0.9]}>
        <sphereGeometry args={[0.14, 20, 16]} />
        <meshStandardMaterial color="#7fe3ff" />
      </mesh>
      <mesh position={[BABY[0] - 0.01, BABY[1] - 0.2, BABY[2] + 0.11]} rotation={[-0.2, 0, 0]}>
        <circleGeometry args={[0.09, 20]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[BABY[0] - 0.01, BABY[1] - 0.2, BABY[2] + 0.115]} rotation={[-0.2, 0, 0]}>
        <circleGeometry args={[0.035, 16]} />
        <meshStandardMaterial color="#FFD400" />
      </mesh>
      {/* kepala (menoleh sedikit ke si biru) */}
      <group position={BABY} rotation={[0, -0.45, 0]}>
        <mesh>
          <sphereGeometry args={[0.15, 24, 18]} />
          <meshStandardMaterial color={SKIN} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.15, 0.02]} rotation={[0.3, 0, 0.4]}>
          <torusGeometry args={[0.03, 0.01, 6, 14, Math.PI * 1.4]} />
          <meshStandardMaterial color="#2b1d16" />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.05, 0.02, 0.135]} scale={[1, sad ? 0.7 : 1, 1]}>
            <sphereGeometry args={[0.016, 10, 8]} />
            <meshStandardMaterial color="#1b1b1f" />
          </mesh>
        ))}
        {[-1, 1].map((s) => (
          <mesh key={`c${s}`} position={[s * 0.085, -0.03, 0.115]} scale={[1, 0.6, 0.4]}>
            <sphereGeometry args={[0.025, 10, 8]} />
            <meshStandardMaterial color="#ff9aa2" />
          </mesh>
        ))}
        {/* mulut: "aaa" terbuka saat disuap, lalu cemberut */}
        {sad ? (
          <mesh position={[0, -0.075, 0.13]} rotation={[0, 0, 0.4]}>
            <torusGeometry args={[0.022, 0.006, 6, 12, Math.PI * 0.75]} />
            <meshStandardMaterial color="#7a2e2e" />
          </mesh>
        ) : (
          <mesh position={[0, -0.06, 0.135]} scale={[1, 0.8 + munch * 0.6, 0.5]}>
            <sphereGeometry args={[0.024, 12, 10]} />
            <meshStandardMaterial color="#5a1f22" />
          </mesh>
        )}
      </group>
      {/* sendok bayi (ungu) di depan mulut */}
      <group position={BABY_SPOON} rotation={[0.1, 0.4, -0.3]}>
        <mesh scale={[1, 0.32, 1.2]}>
          <sphereGeometry args={[0.032, 16, 12]} />
          <meshStandardMaterial color="#b38bff" roughness={0.4} />
        </mesh>
        <mesh position={[-0.1, 0.01, 0]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.014, 0.16, 0.008]} />
          <meshStandardMaterial color="#b38bff" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.012, 0]} scale={[1, 0.5, 1]}>
          <sphereGeometry args={[0.022, 12, 10]} />
          <meshStandardMaterial color="#ffe08a" />
        </mesh>
      </group>
      <BabyGerms t={t} />
    </group>
  );
};

const BabyGerms: React.FC<{ t: number }> = ({ t }) => {
  if (t < BEATS.germs2 - 0.1) return null;
  return (
    <>
      {[0, 1, 2].map((i) => {
        const born = BEATS.germs2 + i * 0.12;
        const s = pr(t, born, 0.3, EASE.back);
        if (s <= 0) return null;
        const go = pr(t, BEATS.move2 + i * 0.1, 0.4, EASE.inOut);
        if (go >= 1) return null;
        const ang = i * 2.1;
        const on: V3 = add3(BABY_SPOON, [Math.cos(ang) * 0.018, 0.03, Math.sin(ang) * 0.012 + 0.01]);
        const p = lerp3(on, add3(BABY_MOUTH, [0, 0, 0.01]), go);
        const hop = wiggle(t, born + 0.35, 0.5, 1) * 0.005;
        return (
          <group key={i} position={[p[0], p[1] + hop + Math.sin(go * Math.PI) * 0.03, p[2]]}>
            <Germ color="#b38bff" scale={0.009 * s * (1 - go * 0.5)} />
          </group>
        );
      })}
    </>
  );
};

/** percikan bersin: butir biru kecil menyembur ke mangkuk lalu menempel di kuah (bermuka kuman) */
const Droplets: React.FC<{ t: number }> = ({ t }) => {
  if (t < BEATS.sneeze || t > END("p3") + 0.1) return null;
  const out: React.ReactNode[] = [];
  for (let i = 0; i < 12; i++) {
    const u = pr(t, BEATS.sneeze + i * 0.012, 0.35, EASE.out);
    const a = rnd(i + 70) * Math.PI * 2;
    const r = 0.03 + rnd(i + 80) * 0.13;
    const land: V3 = [BOWL[0] + Math.cos(a) * r, BOWL[1] + 0.127, BOWL[2] + Math.sin(a) * r * 0.9];
    const p = lerp3(MOUTH_OUT, land, u);
    const arc = Math.sin(u * Math.PI) * 0.08;
    const germ = i % 3 === 0 && u >= 1;
    out.push(
      <group key={i} position={[p[0], p[1] + arc, p[2]]}>
        {germ ? (
          <Germ color={GERM_COLS[i % 5]} scale={0.012 * pr(t, BEATS.sneeze + 0.5 + i * 0.03, 0.25, EASE.back)} />
        ) : (
          <mesh scale={[0.011, u >= 1 ? 0.004 : 0.011, 0.011]}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshStandardMaterial color="#9fd8ff" transparent opacity={0.85} roughness={0.05} />
          </mesh>
        )}
      </group>,
    );
  }
  return <>{out}</>;
};

/** tips: piring ceper (makanan disebar) + jam pasir (dibalik sekali) */
const Plate: React.FC<{ t: number }> = ({ t }) => {
  const vis = popIn(t, BEATS.tick2 - 0.2, END("tips") + 1);
  if (vis <= 0) return null;
  return (
    <group position={[0.55, TABLE_TOP, DESK_Z - 0.05]} scale={vis}>
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.24, 0.2, 0.02, 32]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
      {[
        [-0.1, -0.04],
        [0.08, -0.08],
        [0.11, 0.07],
        [-0.06, 0.09],
        [0.0, 0.0],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0.045, z]}>
          <Bakso r={0.03} seed={i + 12} />
        </group>
      ))}
    </group>
  );
};

const Hourglass: React.FC<{ t: number }> = ({ t }) => {
  const vis = popIn(t, BEATS.tick3 - 0.25, END("tips") + 1);
  if (vis <= 0) return null;
  const flip = pr(t, BEATS.tick3, 0.45, EASE.back);
  return (
    <group position={[-0.45, TABLE_TOP + 0.13, DESK_Z + 0.1]} scale={vis} rotation={[0, 0, flip * Math.PI]}>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, s * 0.12, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.02, 16]} />
          <meshStandardMaterial color="#8a5a3a" />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`g${s}`} position={[0, s * 0.055, 0]} rotation={[s > 0 ? Math.PI : 0, 0, 0]}>
          <coneGeometry args={[0.055, 0.11, 16, 1, true]} />
          <meshStandardMaterial color="#cfefff" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      ))}
      <mesh position={[0, -0.075, 0]}>
        <coneGeometry args={[0.04, 0.05, 16]} />
        <meshStandardMaterial color="#f5b83d" />
      </mesh>
    </group>
  );
};

/* -------------------------------- proyeksi -------------------------------- */

const projCam = new THREE.PerspectiveCamera(FOV, 1080 / FULL_H, 0.05, 60);
applyLens(projCam);
export const toScreen = (t: number, p: V3) => {
  const cam = cameraAt(t);
  projCam.position.set(cam.x, cam.y, cam.z);
  projCam.lookAt(cam.lx, cam.ly, cam.lz);
  projCam.updateMatrixWorld(true);
  const v = new THREE.Vector3(...p).project(projCam);
  return { x: ((v.x + 1) / 2) * 1080, y: ((1 - v.y) / 2) * 1920 };
};
export const headScreen = (t: number) => toScreen(t, [0, 3.05, 0.3]);
export const mouthScreen = (t: number) => toScreen(t, MOUTH);
export const bowlScreen = (t: number) => toScreen(t, [BOWL[0], BOWL[1] + 0.12, BOWL[2]]);
export const babyScreen = (t: number) => toScreen(t, [BABY[0], BABY[1] + 0.2, BABY[2]]);
export const spoonScreen = (t: number) => toScreen(t, spoonBall(t));

/* -------------------------------- scene ------------------------------- */

export const Scene3D: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const cam = cameraAt(t);
  return (
    <ThreeCanvas width={width} height={height} camera={{ fov: FOV, position: [0, 2.6, 7.8] }}>
      <Camera pose={cam} />
      <ambientLight intensity={0.75} color="#fff4e6" />
      <pointLight position={[0.1, 3.5, 0.8]} intensity={5} distance={5} color="#ffe2a8" />
      <directionalLight position={[-3, 5, 4]} intensity={1.9} color="#fff1dc" />
      <directionalLight position={[3, 3, 5]} intensity={0.9} color="#ffffff" />
      <Kitchen />
      <SiBiru t={t} />
      <Bowl t={t} />
      <Spoon t={t} />
      <Steam t={t} />
      <Breath t={t} />
      <SpoonGerms t={t} />
      <Cake t={t} />
      <Baby t={t} />
      <Droplets t={t} />
      <Plate t={t} />
      <Hourglass t={t} />
    </ThreeCanvas>
  );
};
