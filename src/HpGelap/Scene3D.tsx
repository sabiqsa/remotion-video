// Scene 3D "kenapa gaboleh main hp di tempat gelap?" — si biru duduk di tepi kasur malam hari,
// memegang HP di depan wajah. Lampu kamar dimatikan "tek" → kamar gelap, wajah cuma diterangi cahaya
// biru HP (DOLLY ZOOM ke wajah). Macro mata: pupil melebar di gelap → layar menyala terang → pupil
// mengecil. Jam dinding berputar 22:00 → 01:00. Twist: kepala miring ke bantal (mata kiri tertutup),
// lampu dinyalakan → syok. Tips: lampu tetap nyala, HP diturunkan. Gerak diskret per ketukan.

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
import { BEATS, CLOCK, ROOM_LIGHT, SHOCK, TIRED, ZoomTarget, ZOOMS } from "./beats";
import { END, sceneById, SceneId, SCENES } from "./script";

const SEAT = 0.84;
const CHAR_SCALE = 1.75;
const WARDROBE: Wardrobe = { hair: "spiky", outfit: "tee", accessories: [] };

type V3 = [number, number, number];
const MOUTH: V3 = [0.125, 2.215, 0.49];
const FACE: V3 = [0.12, 2.32, 0.42];
const HEAD: V3 = [0.12, 2.5, 0.25];
/** mata kiri karakter (sisi +X) — target macro */
export const EYE: V3 = [0.225, 2.39, 0.46];
/** HP dipegang tangan kanan di depan wajah (layar menghadap wajah) */
const PHONE_HELD: V3 = [MOUTH[0] + 0.26, MOUTH[1] - 0.16, MOUTH[2] + 0.34];
const PHONE_DOWN: V3 = [0.55, SEAT + 0.05, 0.35];
/** bantal: di kasur belakang → ditempel ke sisi kiri wajah saat twist */
const PILLOW_REST: V3 = [0.95, SEAT + 0.16, -0.95];
const PILLOW_FACE: V3 = [EYE[0] + 0.3, EYE[1] - 0.02, EYE[2] - 0.04];
const LAMP: V3 = [1.45, 1.02, -0.7];
const CLOCK_POS: V3 = [-1.05, 3.85, -1.72];

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
const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const band = (list: [number, number, number][], t: number, i = 0.12, o = 0.35) =>
  list.reduce((m, [a, b, k]) => Math.max(m, hold(t, a, b, i, o) * k), 0);

export const shockAt = (t: number) => band(SHOCK, t, 0.08, 0.35);
export const tiredAt = (t: number) => band(TIRED, t, 0.3, 0.3);
/** lampu kamar 0..1 (saklar: cepat 0.08 dtk) */
export const roomLightAt = (t: number) =>
  ROOM_LIGHT.slice(1).reduce((v, [at, to]) => v + (to - v) * pr(t, at, 0.08, (x) => x), ROOM_LIGHT[0][1]);
/** layar HP menyala terang sesaat di "terang" (p1) */
export const flareAt = (t: number) => hold(t, BEATS.bright - 0.04, BEATS.bright + 0.7, 0.06, 0.5);
/** HP diturunkan saat tips "istirahatin" */
const phoneUpAt = (t: number) => 1 - pr(t, BEATS.tick3, 0.45, EASE.inOut);
export const phonePos = (t: number): V3 => lerp3(PHONE_DOWN, PHONE_HELD, phoneUpAt(t));
/** kepala miring ke bantal (twist) */
const tiltAt = (t: number) => hold(t, BEATS.tilt - 0.1, BEATS.blind, 0.45, 0.2);
const pillowAt = (t: number) => hold(t, BEATS.pillow - 0.35, BEATS.blind + 0.05, 0.35, 0.3);
/** jam (desimal) di jam dinding */
export const clockAt = (t: number) =>
  CLOCK.slice(1).reduce((v, [at, h], i) => {
    const prev = CLOCK[i];
    return t >= prev[0] ? v + (h - v) * pr(t, prev[0], Math.max(0.01, at - prev[0]), EASE.inOut) : v;
  }, CLOCK[0][1]);

/* ------------------------------- kamera ------------------------------- */

type Pose = { x: number; y: number; z: number; lx: number; ly: number; lz: number; fov: number };
const FOV = 66.6;
const P = (x: number, y: number, z: number, ly: number, lx = 0, lz = 0.3): Pose => ({ x, y, z, lx, ly, lz, fov: FOV });
const POSES: Record<SceneId, Pose> = {
  hook: P(0.45, 2.4, 5.0, 2.05),
  mitos: P(-0.6, 2.35, 5.2, 1.95),
  p1: P(0.3, 2.45, 4.6, 2.05),
  p2: P(-0.5, 2.4, 4.4, 2.05),
  p3: P(0.6, 2.5, 5.6, 2.1, -0.15),
  twist: P(-0.3, 2.4, 4.8, 2.05, 0.15),
  tips: P(0.5, 2.5, 5.8, 2.0),
  komen: P(0, 2.5, 6.0, 2.0),
};

/** dolly zoom: lebar bidang di wajah dijaga tetap (d · tan(fov/2) = konstan) */
const HALF = Math.tan(((FOV / 2) * Math.PI) / 180);
const dollyFov = (d: number, dRef: number) => (2 * Math.atan((dRef * HALF) / d) * 180) / Math.PI;

const macroPose = (target: ZoomTarget, t: number): Pose => {
  if (target === "eye") {
    // macro mata kiri: dorong pelan masuk saat pupil melebar
    const d = 1.0 - 0.18 * pr(t, BEATS.dilate, 1.0, EASE.inOut);
    return { x: EYE[0] + 0.03, y: EYE[1] + 0.02, z: EYE[2] + d, lx: EYE[0], ly: EYE[1] - 0.01, lz: EYE[2], fov: FOV };
  }
  if (target === "face") {
    // lampu mati → dolly: kamera maju & lensa melebar, wajah tetap, kamar "tertarik" ke belakang
    const k = pr(t, BEATS.off, 1.0, EASE.inOut);
    const d = 5.2 + (2.3 - 5.2) * k;
    return { x: FACE[0] + 0.04, y: FACE[1] + 0.03, z: FACE[2] + d, lx: FACE[0], ly: FACE[1] - 0.12, lz: FACE[2], fov: dollyFov(d, 2.3) };
  }
  // face2: crash zoom pendek saat lampu dinyalakan (buta sementara)
  const d = 2.2 + 0.9 * (1 - pr(t, BEATS.blind, 0.25, EASE.out));
  return { x: FACE[0] - 0.05, y: FACE[1] + 0.04, z: FACE[2] + d, lx: FACE[0], ly: FACE[1] - 0.12, lz: FACE[2], fov: FOV };
};

export const macroAt = (t: number) =>
  ZOOMS.reduce((m, [a, b]) => Math.max(m, Math.min(pr(t, a, 0.3, EASE.inOut), 1 - pr(t, b, 0.45, EASE.inOut))), 0);
const zoomTarget = (t: number) =>
  ZOOMS.reduce((best, cur) => (Math.abs(t - (cur[0] + cur[1]) / 2) < Math.abs(t - (best[0] + best[1]) / 2) ? cur : best))[2];
export const eyeMacroAt = (t: number) => (zoomTarget(t) === "eye" ? macroAt(t) : 0);

const SHAKES = [
  { at: BEATS.minus0, amp: 0.03 },
  { at: BEATS.myth, amp: 0.02 },
  { at: BEATS.blind, amp: 0.045 },
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

/** kedip normal di luar p2 (di p2 sengaja tidak berkedip: "jarang kedip") */
const BLINKS = [0.9, 5.2, 9.6, 21.5, 27.2, 33.4, 38.8, 43.1];

/** ukuran pupil: normal terang, melebar di gelap, melebar besar di "melebar", mengecil di "terang" */
const pupilAt = (t: number) => {
  const dark = 1 - roomLightAt(t);
  let p = 1 + dark * 0.25;
  p += 0.45 * hold(t, BEATS.dilate - 0.1, BEATS.bright, 0.5, 0.12);
  p -= 0.6 * flareAt(t);
  return p;
};

const faceAt = (t: number): FaceState => {
  const inP2 = t >= S("p2") && t < END("p2");
  const blink = !inP2 && BLINKS.some((b) => Math.abs(t - b) < 0.05) ? 0.1 : 1;
  const shock = shockAt(t);
  const tired = tiredAt(t);
  const stare = hold(t, BEATS.focus - 0.1, BEATS.dry, 0.2, 0.2);
  const pain = hold(t, BEATS.sting - 0.05, END("p2") - 0.1, 0.12, 0.25);
  const squint = flareAt(t);
  const yawn = hold(t, BEATS.yawn - 0.15, END("p3") - 0.1, 0.3, 0.3);
  const relief = hold(t, BEATS.myth + 0.1, END("mitos") - 0.05, 0.25, 0.2);
  const happy = pr(t, S("tips"), 0.3);
  return {
    eyeOpen: shock > 0.2 || stare > 0.2 ? 1 : Math.min(blink, 1 - tired * 0.45 - squint * 0.4),
    shock,
    pupil: pupilAt(t),
    surprise: Math.max(shock, stare * 0.3),
    yawn,
    pain: pain * 0.6,
    sleepy: tired * 0.8,
    sad: Math.max(tired * 0.6, pain * 0.4),
    smile: Math.max(happy * 0.9, relief * 0.8, 0.3 * (1 - shock) * (1 - tired) * (1 - pain) * (1 - yawn)),
    frown: tired * 0.3,
    pale: shock * 0.3,
    sweat: shock * 0.8,
    blush: happy * 0.35,
    bags: hold(t, S("p3"), END("p3"), 0.4, 0.4) * 0.6,
  };
};

const SiBiru: React.FC<{ t: number }> = ({ t }) => {
  const shock = shockAt(t);
  const hp = phoneUpAt(t);
  const tilt = tiltAt(t);
  const recoil = punch(t, BEATS.minus0, 0.35) + punch(t, BEATS.blind, 0.35);
  const tired = tiredAt(t);
  const wave = hold(t, BEATS.teamB, END("komen") - 0.1, 0.3, 0.3);

  const bones: BoneOverride = {
    spine_01: [-recoil * 0.12 - shock * 0.04 + tired * 0.05, 0, 0],
    spine_02: [tired * 0.05, 0, -tilt * 0.12],
    // kepala miring ke sisi kiri karakter (+X) menempel bantal
    Head: [-recoil * 0.1 + tired * 0.08 + hp * 0.06, 0, -tilt * 0.38],
    // tangan kanan: pegang HP di depan wajah
    upperarm_r: [hp * 1.05, 0, 0],
    lowerarm_r: [hp * 0.85, 0, 0],
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

/* ------------------------------- kamar tidur ------------------------------- */

const Bedroom: React.FC<{ t: number }> = ({ t }) => {
  const L = roomLightAt(t);
  return (
    <group>
      {/* dinding + lantai kayu */}
      <mesh position={[0, 3, -1.75]}>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial color="#c9d3e6" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0, 1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial color="#8a6a4f" roughness={0.8} />
      </mesh>
      {/* jendela malam dengan bulan */}
      <group position={[-1.55, 3.0, -1.72]}>
        <mesh>
          <boxGeometry args={[1.25, 1.35, 0.04]} />
          <meshStandardMaterial color="#e9edf5" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0, 0.025]}>
          <planeGeometry args={[1.1, 1.2]} />
          <meshStandardMaterial color="#14204a" emissive="#0d1640" emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[0.25, 0.28, 0.03]}>
          <circleGeometry args={[0.15, 32]} />
          <meshStandardMaterial color="#fff6c8" emissive="#fff0a8" emissiveIntensity={1.1} />
        </mesh>
        <mesh position={[0, 0, 0.035]}>
          <boxGeometry args={[0.04, 1.2, 0.01]} />
          <meshStandardMaterial color="#e9edf5" />
        </mesh>
        <mesh position={[0, 0, 0.035]}>
          <boxGeometry args={[1.1, 0.04, 0.01]} />
          <meshStandardMaterial color="#e9edf5" />
        </mesh>
      </group>
      {/* kasur: rangka + kasur + sprei + kepala ranjang berstiker */}
      <mesh position={[0, 0.32, -0.6]}>
        <boxGeometry args={[2.4, 0.4, 2.1]} />
        <meshStandardMaterial color="#6b4a33" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.66, -0.6]}>
        <boxGeometry args={[2.3, 0.3, 2.0]} />
        <meshStandardMaterial color="#f4f1ec" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.83, -0.9]}>
        <boxGeometry args={[2.32, 0.05, 1.4]} />
        <meshStandardMaterial color="#5b8de0" roughness={0.9} />
      </mesh>
      <group position={[0, 1.35, -1.62]}>
        <mesh>
          <boxGeometry args={[2.5, 1.5, 0.1]} />
          <meshStandardMaterial color="#7a5539" roughness={0.6} />
        </mesh>
        <HandleDecal position={[-0.7, 0.45, 0.06]} width={0.62} />
      </group>
      <Pillow t={t} />
      {/* meja samping + lampu tidur */}
      <mesh position={[LAMP[0], 0.45, LAMP[2]]}>
        <boxGeometry args={[0.6, 0.9, 0.5]} />
        <meshStandardMaterial color="#e9e2d6" roughness={0.7} />
      </mesh>
      <group position={LAMP}>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.1, 0.12, 0.04, 20]} />
          <meshStandardMaterial color="#3a3f4a" />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.36, 8]} />
          <meshStandardMaterial color="#3a3f4a" />
        </mesh>
        <mesh position={[0, 0.44, 0]}>
          <cylinderGeometry args={[0.12, 0.2, 0.24, 24, 1, true]} />
          <meshStandardMaterial color="#ffe3a3" emissive="#ffc35a" emissiveIntensity={0.15 + 1.1 * L} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <WallClock t={t} />
    </group>
  );
};

/** bantal: ditempel ke sisi kiri wajah saat twist (mata kiri tertutup) */
const Pillow: React.FC<{ t: number }> = ({ t }) => {
  const k = pillowAt(t);
  const p = lerp3(PILLOW_REST, PILLOW_FACE, k);
  return (
    <mesh position={p} rotation={[0, -0.3 * (1 - k), (1 - k) * 0.1 + k * -0.35]} scale={[0.42 - k * 0.18, 0.22 + k * 0.06, 0.3 - k * 0.12]}>
      <sphereGeometry args={[1, 28, 18]} />
      <meshStandardMaterial color="#7f8aa6" roughness={1} />
    </mesh>
  );
};

/** jam dinding: jarum jam & menit berputar mengikuti CLOCK */
const WallClock: React.FC<{ t: number }> = ({ t }) => {
  const h = clockAt(t);
  const minAng = -((h % 1) * Math.PI * 2);
  const hourAng = -(((h % 12) / 12) * Math.PI * 2);
  return (
    <group position={CLOCK_POS}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 0.05, 40]} />
        <meshStandardMaterial color="#2f3b52" />
      </mesh>
      <mesh position={[0, 0, 0.03]}>
        <circleGeometry args={[0.28, 40]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.sin(a) * 0.23, Math.cos(a) * 0.23, 0.035]}>
            <boxGeometry args={[0.02, i % 3 === 0 ? 0.06 : 0.035, 0.005]} />
            <meshStandardMaterial color="#2f3b52" />
          </mesh>
        );
      })}
      <group position={[0, 0, 0.04]} rotation={[0, 0, hourAng]}>
        <mesh position={[0, 0.07, 0]}>
          <boxGeometry args={[0.03, 0.14, 0.01]} />
          <meshStandardMaterial color="#2f3b52" />
        </mesh>
      </group>
      <group position={[0, 0, 0.045]} rotation={[0, 0, minAng]}>
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[0.018, 0.2, 0.01]} />
          <meshStandardMaterial color="#e3263b" />
        </mesh>
      </group>
    </group>
  );
};

/* ------------------------------- props ------------------------------- */

/** HP di tangan: punggung menghadap kamera, layar menyala ke arah wajah */
const Phone: React.FC<{ t: number }> = ({ t }) => {
  const p = phonePos(t);
  const up = phoneUpAt(t);
  const glow = 0.8 + 1.4 * flareAt(t);
  return (
    <group position={p} rotation={[-0.25 * up - (1 - up) * 1.5, -0.35 * up, 0]}>
      <mesh>
        <boxGeometry args={[0.16, 0.3, 0.02]} />
        <meshStandardMaterial color="#1b1b1f" roughness={0.4} />
      </mesh>
      {/* kamera belakang */}
      <mesh position={[-0.045, 0.1, 0.011]}>
        <circleGeometry args={[0.018, 16]} />
        <meshStandardMaterial color="#444a55" />
      </mesh>
      {/* layar (menghadap −z = ke wajah) */}
      <mesh position={[0, 0, -0.011]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.14, 0.27]} />
        <meshStandardMaterial color="#cfe8ff" emissive="#9fd0ff" emissiveIntensity={glow} />
      </mesh>
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
export const eyeScreen = (t: number) => toScreen(t, EYE);
export const phoneScreen = (t: number) => toScreen(t, phonePos(t));
export const clockScreen = (t: number) => toScreen(t, CLOCK_POS);
export const lampScreen = (t: number) => toScreen(t, [LAMP[0], LAMP[1] + 0.45, LAMP[2]]);

/* -------------------------------- scene ------------------------------- */

export const Scene3D: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const cam = cameraAt(t);
  const L = roomLightAt(t);
  const hp = phoneUpAt(t);
  const ph = phonePos(t);
  const flare = flareAt(t);
  return (
    <ThreeCanvas width={width} height={height} camera={{ fov: FOV, position: [0, 2.6, 7.8] }}>
      <Camera pose={cam} />
      <ambientLight intensity={0.1 + 0.6 * L} color={L > 0.5 ? "#fff3e0" : "#7f93c9"} />
      {/* lampu kamar (hangat) dari kanan atas */}
      <pointLight position={[1.3, 3.2, 1.2]} intensity={5 * L} distance={7} color="#ffd9a8" />
      <directionalLight position={[-3, 5, 4]} intensity={1.2 * L} color="#ffffff" />
      {/* cahaya bulan dari jendela (selalu, tipis biru) */}
      <directionalLight position={[-4, 3, 2]} intensity={0.35} color="#7d9bff" />
      {/* cahaya biru layar HP ke wajah */}
      <pointLight
        position={[ph[0] - 0.05, ph[1] + 0.05, ph[2] - 0.12]}
        intensity={(2.6 + 4 * flare) * hp * (1 - 0.5 * L)}
        distance={1.6}
        decay={1.5}
        color="#9fc8ff"
      />
      <Bedroom t={t} />
      <SiBiru t={t} />
      <Phone t={t} />
    </ThreeCanvas>
  );
};
