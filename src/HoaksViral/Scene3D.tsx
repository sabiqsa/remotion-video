// Scene 3D "hoaks vs fakta" — si biru "sok pintar" (kacamata bulat, dasi kupu-kupu, rambut
// klimis) di meja belajar dengan rak buku & papan tulis. Roket HOAKS melesat sekali di hook,
// zoom macro ke kacamata saat "ehem" dan saat twist, robot kecil menggeleng ("bukan bot"),
// ruangan meredup dramatis saat notifikasi BREAKING. Semua gerak = aksi diskret per ketukan.

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
import { BEATS, DIM, ZOOMS } from "./beats";
import { END, sceneById, SceneId, SCENES } from "./script";

const TABLE_TOP = 1.2;
const DESK_Z = 0.78;
const CHAR_SCALE = 1.75;
const WARDROBE: Wardrobe = { hair: "side", outfit: "bowtie", accessories: ["glasses_round"] };

/** lensa kiri kacamata si biru (sisi +X karakter = kanan layar) */
export const LENS: [number, number, number] = [0.225, 2.4, 0.5];

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
type Ease = (x: number) => number;
const pr = (t: number, start: number, dur: number, ease: Ease = EASE.out) =>
  interpolate(t, [start, start + Math.max(0.001, dur)], [0, 1], { ...CLAMP, easing: ease });
const hold = (t: number, a: number, b: number, inDur = 0.2, outDur = 0.25) =>
  Math.min(pr(t, a, inDur), 1 - pr(t, b, outDur, EASE.in));
const S = (id: SceneId) => sceneById(id).start;
const popIn = (t: number, from: number, to: number) =>
  t < from || t > to ? 0 : pr(t, from, 0.35, EASE.back) * (1 - pr(t, to - 0.15, 0.15, EASE.in));
/** goyang teredam sekali (bukan loop): 0 di luar [at, at+dur] */
const wiggle = (t: number, at: number, dur: number, n = 2) => {
  const u = pr(t, at, dur, (v) => v);
  return u <= 0 || u >= 1 ? 0 : Math.sin(u * Math.PI * 2 * n) * (1 - u);
};

/* ------------------------------- kamera ------------------------------- */

type Pose = { x: number; y: number; z: number; lx: number; ly: number; lz: number };
const P = (x: number, y: number, z: number, ly: number, lx = 0, lz = 0.3): Pose => ({ x, y, z, lx, ly, lz });
const POSES: Record<SceneId, Pose> = {
  hook: P(0.8, 2.5, 5.4, 2.05),
  ehem: P(0, 2.45, 5.0, 2.1),
  data: P(-0.8, 2.6, 6.2, 2.05),
  cepat: P(0.9, 2.5, 6.2, 2.05),
  p1: P(-0.6, 2.35, 5.0, 2.0),
  p2: P(0.7, 1.7, 5.0, 2.15, 0.1), // low angle
  p3: P(1.6, 2.5, 4.8, 1.95, 0.2), // dari samping, robot kelihatan
  twist: P(0, 2.45, 4.6, 2.1),
  tips: P(-0.7, 2.55, 5.9, 2.0),
  komen: P(0, 2.5, 6.0, 2.0),
};
const MACRO: Pose = { x: LENS[0] + 0.01, y: LENS[1] + 0.01, z: LENS[2] + 0.34, lx: LENS[0], ly: LENS[1], lz: LENS[2] };

export const macroAt = (t: number) =>
  ZOOMS.reduce((m, [a, b]) => Math.max(m, Math.min(pr(t, a, 0.3, EASE.inOut), 1 - pr(t, b, 0.45, EASE.inOut))), 0);

const SHAKES = [
  { at: BEATS.rocket + 0.25, amp: 0.05 },
  { at: BEATS.notif, amp: 0.03 },
  { at: BEATS.stamp, amp: 0.05 },
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
  pose = lerpPose(pose, MACRO, macroAt(t));
  const sh = shakeAt(t) * (0.3 + 0.7 * (1 - macroAt(t)));
  return { ...pose, x: pose.x + sh, y: pose.y - sh * 0.6 };
};

/** Kanvas penuh 1080x1920 (kamera virtual setinggi 2520 px, pusat di y=1260). */
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

/** 0..1 ruangan redup (twist) */
export const dimAt = (t: number) => hold(t, DIM[0], DIM[1], 0.3, 0.4);

/* --------------------------- si biru (ekspresi) --------------------------- */

const BLINKS = [4.4, 8.9, 13.6, 19.1, 24.3, 29.8, 36.2, 41.7, 47.3];

const faceAt = (t: number): FaceState => {
  const blink = BLINKS.some((b) => Math.abs(t - b) < 0.05) ? 0.1 : 1;
  const whoa = hold(t, BEATS.rocket + 0.1, S("ehem") + 0.1, 0.1, 0.25);
  const smug = Math.max(hold(t, BEATS.ehem + 0.2, END("cepat"), 0.25, 0.3), hold(t, S("tips") + 0.6, END("tips"), 0.3, 0.3));
  const baru = hold(t, BEATS.baru, END("p1") - 0.2, 0.1, 0.25);
  const kaget = hold(t, BEATS.kaget, BEATS.jijik, 0.08, 0.1);
  const jijik = hold(t, BEATS.jijik, END("p2") - 0.2, 0.12, 0.25);
  const oops = hold(t, BEATS.kita, END("p3"), 0.15, 0.25);
  const curious = hold(t, BEATS.notif + 0.2, BEATS.stop, 0.2, 0.1);
  const caught = hold(t, BEATS.stop, END("twist"), 0.08, 0.3);
  const happy = pr(t, S("komen"), 0.3);
  return {
    eyeOpen: Math.max(0.06, Math.min(blink, 1 - smug * 0.28 + whoa * 0.1)),
    smile: Math.max(smug * 0.75, oops * 0.35, happy, curious * 0.3, 0.2 * (1 - jijik) * (1 - caught)),
    open: Math.max(whoa * 0.85, baru * 0.6, kaget * 0.9),
    surprise: Math.max(whoa, baru * 0.8, kaget, caught * 0.8),
    frown: Math.max(jijik * 0.9, caught * 0.3),
    sad: Math.max(jijik * 0.4, caught * 0.5),
    blush: Math.max(oops, happy * 0.4, smug * 0.25),
    sweat: Math.max(oops, caught),
  };
};

const SiBiru: React.FC<{ t: number }> = ({ t }) => {
  // kepala mengikuti roket yang lewat (kiri → kanan), lalu kembali
  const follow = t < BEATS.rocket - 0.1 || t > BEATS.rocket + 1.2 ? 0 : -0.5 + 1.1 * pr(t, BEATS.rocket, 0.55, EASE.inOut);
  const back = 1 - pr(t, BEATS.rocket + 0.8, 0.35, EASE.inOut);
  const yaw = follow * back * hold(t, BEATS.rocket - 0.15, BEATS.rocket + 1.15, 0.1, 0.1);
  const push = hold(t, BEATS.ehem + 0.15, BEATS.glint + 0.35, 0.3, 0.3); // dorong kacamata
  const point = hold(t, BEATS.point - 0.2, END("p3") - 0.15, 0.25, 0.3);
  const peek = hold(t, BEATS.notif + 0.15, BEATS.stop, 0.3, 0.12); // condong ke HP
  const recoil = hold(t, BEATS.stop, END("twist") - 0.1, 0.08, 0.3);
  const wave = hold(t, BEATS.teamB, END("komen") - 0.1, 0.3, 0.3);
  const chin = hold(t, BEATS.otak - 0.2, END("p1") - 0.1, 0.25, 0.25); // pose mikir

  const bend = peek * 0.2 - recoil * 0.12;
  const bones: BoneOverride = {
    spine_01: [bend * 0.4, 0, 0],
    spine_02: [bend * 0.4, 0, 0],
    spine_03: [bend * 0.3, 0, 0],
    Head: [peek * 0.3 - recoil * 0.12 + push * -0.08, yaw, chin * 0.12],
    upperarm_r: [push * 1.55 + chin * 1.2, 0, 0],
    lowerarm_r: [push * 0.75 + chin * 0.6, 0, 0],
    upperarm_l: [point * 1.35, 0, wave * 1.75],
    lowerarm_l: [-point * 0.15 - wave * 1.05, 0, 0],
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

/* ------------------------------- ruang belajar ------------------------------- */

const BOOK_COLORS = ["#e3263b", "#2f7cf6", "#FFD400", "#2fd27a", "#ff8a3d", "#7b5cff", "#f4f1ea"];

const Shelf: React.FC = () => (
  <group position={[-1.55, 2.6, -1.5]}>
    <mesh>
      <boxGeometry args={[1.3, 2.2, 0.35]} />
      <meshStandardMaterial color="#7a4e30" roughness={0.7} />
    </mesh>
    {[0.62, -0.08, -0.78].map((y, r) => (
      <group key={r} position={[0, y, 0.12]}>
        <mesh position={[0, -0.27, 0]}>
          <boxGeometry args={[1.2, 0.04, 0.3]} />
          <meshStandardMaterial color="#5c3820" />
        </mesh>
        {Array.from({ length: 8 }).map((_, i) => {
          const h = 0.34 + ((i * 7 + r * 3) % 5) * 0.04;
          return (
            <mesh key={i} position={[-0.5 + i * 0.135, -0.25 + h / 2, 0.02]} rotation={[0, 0, i === 6 ? 0.25 : 0]}>
              <boxGeometry args={[0.11, h, 0.24]} />
              <meshStandardMaterial color={BOOK_COLORS[(i + r * 2) % BOOK_COLORS.length]} roughness={0.6} />
            </mesh>
          );
        })}
      </group>
    ))}
  </group>
);

/** papan tulis: grafik naik + coretan, stiker @day.one.eight (anti re-upload) */
const Board: React.FC = () => (
  <group position={[1.35, 3.05, -1.62]}>
    <mesh>
      <boxGeometry args={[1.5, 1.0, 0.05]} />
      <meshStandardMaterial color="#cfd4da" />
    </mesh>
    <mesh position={[0, 0, 0.03]}>
      <planeGeometry args={[1.4, 0.9]} />
      <meshStandardMaterial color="#ffffff" roughness={0.3} />
    </mesh>
    {[
      [-0.45, -0.2, 0.3, 0.5],
      [-0.2, -0.05, 0.3, 0.9],
      [0.08, 0.12, 0.35, 0.5],
    ].map(([x, y, len, rot], i) => (
      <mesh key={i} position={[x, y, 0.04]} rotation={[0, 0, rot]}>
        <boxGeometry args={[len, 0.025, 0.005]} />
        <meshStandardMaterial color="#e3263b" />
      </mesh>
    ))}
    {[0.3, 0.2, 0.1].map((y, i) => (
      <mesh key={i} position={[0.42, y + 0.05, 0.04]}>
        <boxGeometry args={[0.32 - i * 0.07, 0.022, 0.005]} />
        <meshStandardMaterial color="#2f7cf6" />
      </mesh>
    ))}
    <HandleDecal position={[-0.25, -0.28, 0.04]} width={0.8} />
  </group>
);

const Room: React.FC = () => (
  <group>
    <mesh position={[0, 3, -1.7]}>
      <planeGeometry args={[12, 8]} />
      <meshStandardMaterial color="#e6d3b3" roughness={0.95} />
    </mesh>
    <mesh position={[0, 0, 1]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[12, 8]} />
      <meshStandardMaterial color="#9c6f4b" roughness={0.9} />
    </mesh>
    <Shelf />
    <Board />
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
    {/* panel depan meja + stiker @day.one.eight (anti re-upload, hampir selalu masuk frame) */}
    <mesh position={[0, TABLE_TOP - 0.2, DESK_Z + 0.44]}>
      <boxGeometry args={[2.2, 0.26, 0.04]} />
      <meshStandardMaterial color="#7a4e30" roughness={0.6} />
    </mesh>
    <HandleDecal position={[0.45, TABLE_TOP - 0.2, DESK_Z + 0.465]} width={0.62} />
    {/* tumpukan buku di meja, punggung buku teratas berstiker */}
    <group position={[0.92, TABLE_TOP, DESK_Z - 0.12]} rotation={[0, -0.2, 0]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.045 + i * 0.09, 0]} rotation={[0, i * 0.12, 0]}>
          <boxGeometry args={[0.42, 0.085, 0.3]} />
          <meshStandardMaterial color={BOOK_COLORS[i + 1]} roughness={0.6} />
        </mesh>
      ))}
      <HandleDecal position={[0, 0.225, 0.152]} width={0.36} />
    </group>
    {/* lampu meja */}
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
        <meshStandardMaterial color="#2fd27a" side={2} emissive="#2fd27a" emissiveIntensity={0.2} />
      </mesh>
    </group>
  </group>
);

/* ------------------------------- props ------------------------------- */

/** roket kertas "HOAKS": melesat sekali kiri → kanan di depan si biru */
const Rocket: React.FC<{ t: number }> = ({ t }) => {
  const u = pr(t, BEATS.rocket, 0.6, EASE.inOut);
  if (u <= 0 || u >= 1) return null;
  const x = -2.6 + 5.4 * u;
  const y = 1.7 + 0.5 * u;
  return (
    <group position={[x, y, 1.45]} rotation={[0, 0, -Math.PI / 2 + 0.25]}>
      <mesh>
        <cylinderGeometry args={[0.09, 0.09, 0.4, 16]} />
        <meshStandardMaterial color="#e3263b" />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <coneGeometry args={[0.09, 0.18, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, -0.2, 0]} rotation={[0, (i * Math.PI * 2) / 3, 0]}>
          <boxGeometry args={[0.28, 0.12, 0.015]} />
          <meshStandardMaterial color="#FFD400" />
        </mesh>
      ))}
      <mesh position={[0, -0.38, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.08, 0.3, 12]} />
        <meshStandardMaterial color="#ffb000" emissive="#ff7a00" emissiveIntensity={1.2} transparent opacity={0.9} />
      </mesh>
    </group>
  );
};

/** HP di meja: menyala + bergetar saat notifikasi BREAKING */
const Phone: React.FC<{ t: number }> = ({ t }) => {
  const lit = t >= BEATS.notif && t < S("tips") + 0.3 ? 1 : 0;
  const d = t - BEATS.notif;
  const on = (d >= 0 && d < 0.22) || (d >= 0.32 && d < 0.54);
  const jitter = on ? (Math.floor(d * 60) % 2 ? 0.012 : -0.012) : 0;
  return (
    <group position={[-0.55 + jitter, TABLE_TOP + 0.012, DESK_Z + 0.3]} rotation={[0, 0.35, 0]}>
      <mesh>
        <boxGeometry args={[0.16, 0.022, 0.3]} />
        <meshStandardMaterial color="#1b1b1f" />
      </mesh>
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.14, 0.27]} />
        <meshStandardMaterial color={lit ? "#ffd2d6" : "#0d0f18"} emissive="#ff6b7a" emissiveIntensity={lit * 0.9} />
      </mesh>
    </group>
  );
};

/** robot kecil: muncul di p3, menggeleng sekali saat "bot" */
const Robot: React.FC<{ t: number }> = ({ t }) => {
  const vis = popIn(t, S("p3") + 0.2, END("p3"));
  if (vis <= 0) return null;
  const shake = wiggle(t, BEATS.bot, 0.7, 2) * 0.55;
  const grey = "#c3cad6";
  return (
    <group position={[0.66, TABLE_TOP, DESK_Z + 0.32]} scale={vis * 1.1} rotation={[0, -0.25, 0]}>
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[0.2, 0.22, 0.14]} />
        <meshStandardMaterial color={grey} metalness={0.4} roughness={0.4} />
      </mesh>
      <HandleDecal position={[0, 0.12, 0.072]} width={0.18} />
      <group position={[0, 0.34, 0]} rotation={[0, shake, 0]}>
        <mesh>
          <boxGeometry args={[0.26, 0.2, 0.2]} />
          <meshStandardMaterial color={grey} metalness={0.4} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.101]}>
          <planeGeometry args={[0.21, 0.13]} />
          <meshStandardMaterial color="#1b2340" />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.05, 0.01, 0.103]}>
            <circleGeometry args={[0.022, 14]} />
            <meshStandardMaterial color="#7fe3ff" emissive="#7fe3ff" emissiveIntensity={1} />
          </mesh>
        ))}
        <mesh position={[0, 0.16, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.12, 6]} />
          <meshStandardMaterial color="#2a2a2e" />
        </mesh>
        <mesh position={[0, 0.23, 0]}>
          <sphereGeometry args={[0.025, 10, 8]} />
          <meshStandardMaterial color="#e3263b" emissive="#e3263b" emissiveIntensity={0.6} />
        </mesh>
      </group>
    </group>
  );
};

/* -------------------------------- proyeksi -------------------------------- */

const projCam = new THREE.PerspectiveCamera(FOV, 1080 / FULL_H, 0.05, 60);
applyLens(projCam);
export const toScreen = (t: number, p: [number, number, number]) => {
  const cam = cameraAt(t);
  projCam.position.set(cam.x, cam.y, cam.z);
  projCam.lookAt(cam.lx, cam.ly, cam.lz);
  projCam.updateMatrixWorld(true);
  const v = new THREE.Vector3(...p).project(projCam);
  return { x: ((v.x + 1) / 2) * 1080, y: ((1 - v.y) / 2) * 1920 };
};
export const headScreen = (t: number) => toScreen(t, [0, 3.0, 0.3]);
export const robotScreen = (t: number) => toScreen(t, [0.66, TABLE_TOP + 0.7, DESK_Z + 0.32]);

/* -------------------------------- scene ------------------------------- */

export const Scene3D: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const cam = cameraAt(t);
  const dim = dimAt(t);
  const k = 1 - 0.7 * dim;
  return (
    <ThreeCanvas width={width} height={height} camera={{ fov: FOV, position: [0, 2.6, 7.8] }}>
      <Camera pose={cam} />
      <ambientLight intensity={0.7 * k} color="#fff6ea" />
      {/* matahari sore dari kiri */}
      <directionalLight position={[-4, 5, 4]} intensity={2.3 * k} color="#ffd9a8" />
      <directionalLight position={[3, 3, 5]} intensity={0.9 * k} color="#ffffff" />
      <directionalLight position={[0, 4, -5]} intensity={0.8} color={dim > 0.5 ? "#ff5a6a" : "#ffffff"} />
      {/* cahaya merah HP ke wajah saat twist */}
      <pointLight position={[-0.45, 1.6, 1.0]} intensity={5 * dim} distance={3} color="#ff6b7a" />
      <Room />
      <SiBiru t={t} />
      <Rocket t={t} />
      <Phone t={t} />
      <Robot t={t} />
    </ThreeCanvas>
  );
};
