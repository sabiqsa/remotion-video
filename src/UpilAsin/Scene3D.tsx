// Scene 3D "kenapa upil asin?" — si biru duduk di sofa ruang tamu siang hari. Hook: tangan naik ke
// hidung (ngupil), lirik kanan-kiri, lalu ketahuan → syok + zoom wajah. p2: macro hidung. Twist: crash
// zoom wajah saat "ketelan". Tips: tangan naik lagi lalu turun saat dicoret; kotak tisu di meja punch.
// Gerak diskret per ketukan (tanpa idle loop props/kamera).

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
import { BEATS, PICKS, SHOCK, ZoomTarget, ZOOMS } from "./beats";
import { END, sceneById, SceneId, SCENES } from "./script";

const CHAR_SCALE = 1.75;
/** variasi gaya per video (bukan kaos biru terus): rambut keriting + hoodie hijau tosca */
const WARDROBE: Wardrobe = { hair: "curly", outfit: "hoodie", accessories: [] };
const COLORS = { shirt: "#2bb8a3" };

type V3 = [number, number, number];
const FACE: V3 = [0.12, 2.32, 0.42];
const HEAD: V3 = [0.12, 2.5, 0.25];
/** ujung hidung — target macro p2 & titik tempel debu */
export const NOSE: V3 = [0.125, 2.285, 0.52];
/** tenggorokan (untuk jalur tetes "ketelan") */
export const THROAT: V3 = [0.12, 1.98, 0.36];
const TABLE: V3 = [1.25, 0, 0.1];
const TISSUE: V3 = [TABLE[0], 0.98, TABLE[2]];

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
type Ease = (x: number) => number;
const pr = (t: number, start: number, dur: number, ease: Ease = EASE.out) =>
  interpolate(t, [start, start + Math.max(0.001, dur)], [0, 1], { ...CLAMP, easing: ease });
const hold = (t: number, a: number, b: number, inDur = 0.2, outDur = 0.25) =>
  Math.min(pr(t, a, inDur), 1 - pr(t, b, outDur, EASE.in));
const S = (id: SceneId) => sceneById(id).start;
/** satu denyut (0 → 1 → 0) */
const punch = (t: number, at: number, dur = 0.25) => {
  const u = pr(t, at, dur, (v) => v);
  return u <= 0 || u >= 1 ? 0 : Math.sin(u * Math.PI);
};
const band = (list: [number, number, number][], t: number, i = 0.12, o = 0.35) =>
  list.reduce((m, [a, b, k]) => Math.max(m, hold(t, a, b, i, o) * k), 0);

export const shockAt = (t: number) => band(SHOCK, t, 0.08, 0.35);
/** tangan di hidung 0..1 */
export const pickAt = (t: number) => PICKS.reduce((m, [a, b]) => Math.max(m, hold(t, a, b, 0.3, 0.25)), 0);
/** jijik setelah sadar ketelan */
const yuckAt = (t: number) => hold(t, BEATS.unaware - 0.1, END("twist") - 0.05, 0.25, 0.2);

/* ------------------------------- kamera ------------------------------- */

type Pose = { x: number; y: number; z: number; lx: number; ly: number; lz: number; fov: number };
const FOV = 66.6;
const P = (x: number, y: number, z: number, ly: number, lx = 0, lz = 0.3): Pose => ({ x, y, z, lx, ly, lz, fov: FOV });
const POSES: Record<SceneId, Pose> = {
  hook: P(0.45, 2.4, 5.0, 2.05),
  janji: P(-0.6, 2.35, 5.2, 1.95),
  p1: P(0.4, 2.45, 5.4, 2.05),
  p2: P(-0.4, 2.4, 4.6, 2.05),
  p3: P(0.6, 2.5, 5.0, 2.1, -0.1),
  twist: P(-0.3, 2.4, 4.8, 2.05, 0.1),
  tips: P(0.6, 2.5, 5.6, 2.0, 0.15),
  dokter: P(-0.5, 2.45, 5.4, 2.0),
  komen: P(0, 2.5, 6.0, 2.0),
};

/** dolly zoom: lebar bidang di wajah dijaga tetap (d · tan(fov/2) = konstan) */
const HALF = Math.tan(((FOV / 2) * Math.PI) / 180);
const dollyFov = (d: number, dRef: number) => (2 * Math.atan((dRef * HALF) / d) * 180) / Math.PI;

const macroPose = (target: ZoomTarget, t: number): Pose => {
  if (target === "nose") {
    // macro hidung: dorong pelan masuk saat lendir "mengalir"
    const d = 1.05 - 0.15 * pr(t, BEATS.encer, 1.0, EASE.inOut);
    return { x: NOSE[0] + 0.12, y: NOSE[1] + 0.02, z: NOSE[2] + d, lx: NOSE[0], ly: NOSE[1] - 0.1, lz: NOSE[2], fov: FOV };
  }
  if (target === "face") {
    // ketahuan → dolly zoom ke wajah
    const k = pr(t, BEATS.caught, 0.9, EASE.inOut);
    const d = 5.0 + (2.3 - 5.0) * k;
    return { x: FACE[0] + 0.04, y: FACE[1] + 0.03, z: FACE[2] + d, lx: FACE[0], ly: FACE[1] - 0.12, lz: FACE[2], fov: dollyFov(d, 2.3) };
  }
  // face2: crash zoom pendek saat "ketelan"
  const d = 2.2 + 0.9 * (1 - pr(t, BEATS.swallow, 0.25, EASE.out));
  return { x: FACE[0] - 0.05, y: FACE[1] - 0.02, z: FACE[2] + d, lx: FACE[0], ly: FACE[1] - 0.2, lz: FACE[2], fov: FOV };
};

export const macroAt = (t: number) =>
  ZOOMS.reduce((m, [a, b]) => Math.max(m, Math.min(pr(t, a, 0.3, EASE.inOut), 1 - pr(t, b, 0.45, EASE.inOut))), 0);
const zoomTarget = (t: number) =>
  ZOOMS.reduce((best, cur) => (Math.abs(t - (cur[0] + cur[1]) / 2) < Math.abs(t - (best[0] + best[1]) / 2) ? cur : best))[2];
export const noseMacroAt = (t: number) => (zoomTarget(t) === "nose" ? macroAt(t) : 0);

const SHAKES = [
  { at: BEATS.caught, amp: 0.03 },
  { at: BEATS.swallow, amp: 0.035 },
  { at: BEATS.noPick, amp: 0.02 },
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

const BLINKS = [0.4, 5.6, 9.8, 14.6, 19.4, 25.8, 33.2, 38.6, 43.2];

const faceAt = (t: number): FaceState => {
  const blink = BLINKS.some((b) => Math.abs(t - b) < 0.05) ? 0.1 : 1;
  const shock = shockAt(t);
  const pick = pickAt(t);
  const yuck = yuckAt(t);
  // senyum puas saat ngupil sebelum ketahuan, malu sesudahnya
  const sneaky = hold(t, BEATS.pick, BEATS.caught, 0.2, 0.08);
  const shy = hold(t, BEATS.caught + 0.3, END("hook"), 0.3, 0.2);
  const curious = hold(t, S("p1"), END("p1"), 0.3, 0.3);
  const proud = hold(t, BEATS.enzim, END("p3"), 0.2, 0.2);
  const ouch = hold(t, BEATS.bleed - 0.05, BEATS.tick1, 0.12, 0.25);
  const happy = pr(t, BEATS.tick1, 0.3);
  return {
    eyeOpen: shock > 0.2 ? 1 : Math.min(blink, 1 - sneaky * 0.45 - yuck * 0.35 - ouch * 0.3),
    shock,
    surprise: Math.max(shock, curious * 0.3),
    smile: Math.max(sneaky * 0.7, proud * 0.8, happy * 0.85, 0.3 * (1 - shock) * (1 - yuck) * (1 - ouch)),
    frown: yuck * 0.8,
    pain: ouch * 0.6,
    sad: ouch * 0.4,
    open: punch(t, BEATS.eh, 0.4) * 0.6 + pick * 0.15,
    pale: yuck * 0.25,
    sweat: shock * 0.8,
    blush: Math.max(shy * 0.8, happy * 0.3),
  };
};

const SiBiru: React.FC<{ t: number }> = ({ t }) => {
  const shock = shockAt(t);
  const pick = pickAt(t);
  // lirik kiri lalu kanan (sekali, kecil supaya jari tetap di hidung) saat ngupil diam-diam
  const yaw = 0.1 * (pr(t, BEATS.pick + 0.25, 0.2, EASE.inOut) - 2 * pr(t, BEATS.asin, 0.25, EASE.inOut) + pr(t, BEATS.caught, 0.15, EASE.out));
  const recoil = punch(t, BEATS.caught, 0.35) + punch(t, BEATS.swallow, 0.35) + punch(t, BEATS.noPick, 0.3) * 0.6;
  const gulp = punch(t, BEATS.swallow, 0.4);
  const yuck = yuckAt(t);
  const wave = hold(t, BEATS.teamB, END("komen") - 0.1, 0.3, 0.3);

  const bones: BoneOverride = {
    spine_01: [-recoil * 0.12 - shock * 0.04, 0, 0],
    neck_01: [gulp * 0.12, 0, 0],
    Head: [-recoil * 0.1 + pick * 0.08 - yuck * 0.06, yaw, yuck * 0.1],
    // tangan kanan ke hidung
    upperarm_r: [pick * 1.55, 0, 0],
    lowerarm_r: [pick * 0.82, 0, 0],
    // tangan kiri: melambai di komen
    upperarm_l: [0, 0, wave * 1.75],
    lowerarm_l: [-wave * 1.05, 0, 0],
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

/** kepalan + jari telunjuk masuk lubang hidung (lengan rig tak sampai karena kepala besar) */
const SKIN = "#f2c09b";
const PickFinger: React.FC<{ t: number }> = ({ t }) => {
  const k = pickAt(t);
  if (k < 0.05) return null;
  const tip: V3 = [NOSE[0] + 0.02, NOSE[1] - 0.035, NOSE[2] + 0.005];
  // jari naik dari bawah menuju lubang hidung saat tangan terangkat
  const rise = 0.12 * (1 - k);
  const fist: V3 = [tip[0] + 0.03, tip[1] - 0.15 - rise, tip[2] + 0.06];
  const dx = tip[0] - fist[0];
  const dy = tip[1] - rise - fist[1];
  const dz = tip[2] - fist[2];
  const len = Math.hypot(dx, dy, dz);
  const mid: V3 = [fist[0] + dx / 2, fist[1] + dy / 2, fist[2] + dz / 2];
  const dir = new THREE.Vector3(dx, dy, dz).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  return (
    <group scale={Math.min(1, k * 1.5)}>
      <mesh position={fist} scale={[1, 0.9, 0.85]}>
        <sphereGeometry args={[0.075, 24, 16]} />
        <meshStandardMaterial color={SKIN} roughness={0.7} />
      </mesh>
      <mesh position={mid} quaternion={q}>
        <capsuleGeometry args={[0.024, len - 0.03, 6, 12]} />
        <meshStandardMaterial color={SKIN} roughness={0.7} />
      </mesh>
    </group>
  );
};

/* ------------------------------- ruang tamu ------------------------------- */

const LivingRoom: React.FC<{ t: number }> = ({ t }) => {
  const tissuePop = punch(t, BEATS.tick2, 0.35);
  return (
    <group>
      {/* dinding krem + lantai */}
      <mesh position={[0, 3, -1.75]}>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial color="#f1e6d2" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0, 1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial color="#b98d63" roughness={0.8} />
      </mesh>
      {/* jendela siang */}
      <group position={[-1.55, 3.0, -1.72]}>
        <mesh>
          <boxGeometry args={[1.25, 1.35, 0.04]} />
          <meshStandardMaterial color="#ffffff" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0, 0.025]}>
          <planeGeometry args={[1.1, 1.2]} />
          <meshStandardMaterial color="#9fd6ff" emissive="#8fcfff" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[-0.2, -0.32, 0.03]}>
          <circleGeometry args={[0.2, 24]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.035]}>
          <boxGeometry args={[0.04, 1.2, 0.01]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0, 0.035]}>
          <boxGeometry args={[1.1, 0.04, 0.01]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>
      {/* bingkai foto di dinding */}
      <group position={[1.35, 3.3, -1.72]}>
        <mesh>
          <boxGeometry args={[0.8, 0.6, 0.04]} />
          <meshStandardMaterial color="#5b3b2a" />
        </mesh>
        <mesh position={[0, 0, 0.025]}>
          <planeGeometry args={[0.68, 0.48]} />
          <meshStandardMaterial color="#ffd400" />
        </mesh>
      </group>
      {/* sofa: dudukan + sandaran berstiker + lengan */}
      <mesh position={[0, 0.42, -0.55]}>
        <boxGeometry args={[2.5, 0.84, 1.1]} />
        <meshStandardMaterial color="#e85d4a" roughness={0.9} />
      </mesh>
      <group position={[0, 1.3, -1.05]}>
        <mesh>
          <boxGeometry args={[2.5, 1.1, 0.35]} />
          <meshStandardMaterial color="#d94f3d" roughness={0.9} />
        </mesh>
        <HandleDecal position={[-0.75, 0.2, 0.18]} width={0.6} />
      </group>
      {[-1.35, 1.35].map((x) => (
        <mesh key={x} position={[x, 0.65, -0.55]}>
          <boxGeometry args={[0.3, 1.3, 1.1]} />
          <meshStandardMaterial color="#c9473a" roughness={0.9} />
        </mesh>
      ))}
      {/* meja samping + kotak tisu */}
      <mesh position={[TABLE[0] + 0.55, 0.42, TABLE[2]]}>
        <boxGeometry args={[0.6, 0.84, 0.6]} />
        <meshStandardMaterial color="#efe6d6" roughness={0.7} />
      </mesh>
      <group position={[TISSUE[0] + 0.55, TISSUE[1] - 0.1, TISSUE[2]]} scale={1 + tissuePop * 0.3}>
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[0.36, 0.16, 0.22]} />
          <meshStandardMaterial color="#5ec8f2" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.2 + tissuePop * 0.08, 0]} rotation={[0, 0, 0.15]}>
          <boxGeometry args={[0.12, 0.12, 0.01]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>
      {/* tanaman pot di kiri */}
      <group position={[-1.9, 0, -0.6]}>
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.22, 0.17, 0.5, 20]} />
          <meshStandardMaterial color="#f4f1ec" />
        </mesh>
        <mesh position={[0, 0.85, 0]}>
          <sphereGeometry args={[0.42, 20, 14]} />
          <meshStandardMaterial color="#3fae6a" roughness={0.9} />
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
export const noseScreen = (t: number) => toScreen(t, NOSE);
export const throatScreen = (t: number) => toScreen(t, THROAT);

/* -------------------------------- scene ------------------------------- */

export const Scene3D: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const cam = cameraAt(t);
  return (
    <ThreeCanvas width={width} height={height} camera={{ fov: FOV, position: [0, 2.6, 7.8] }}>
      <Camera pose={cam} />
      <ambientLight intensity={0.7} color="#fff6ea" />
      {/* matahari dari jendela kiri + isi hangat dari kanan */}
      <directionalLight position={[-3, 5, 4]} intensity={1.6} color="#ffffff" />
      <pointLight position={[1.4, 3.2, 1.6]} intensity={3.5} distance={7} color="#ffe2b8" />
      <LivingRoom t={t} />
      <SiBiru t={t} />
      <PickFinger t={t} />
    </ThreeCanvas>
  );
};
