// Scene 3D "kenapa habis ngopi malah ngantuk?" — si biru (keriting, jaket, kacamata
// kotak) me-review americano di kafe. "Si americano" = gelas es kopi berwajah yang
// ikut bereaksi. Semua gerak & ekspresi = aksi diskret pada ketukan narasi (BEATS).

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
import { BEATS, STAR_TIMES } from "./beats";
import { END, sceneById, SceneId, SCENES } from "./script";

const TABLE_TOP = 1.2;
const CHAR_SCALE = 1.75;
const WARDROBE: Wardrobe = { hair: "curly", outfit: "jacket", accessories: ["glasses_square"] };

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
const spinIn = (t: number, from: number) => (1 - pr(t, from, 0.5)) * -0.9;
/** lompatan kecil (parabola) dari 0→1 selama `dur` */
const hop = (t: number, at: number, dur: number) => {
  const u = pr(t, at, dur, (v) => v);
  return u <= 0 || u >= 1 ? 0 : 4 * u * (1 - u);
};

/* ------------------------------- kamera ------------------------------- */

type Pose = { x: number; y: number; z: number; look: number; lookZ?: number };
const POSES: Partial<Record<SceneId, Pose>> = {
  hook: { x: 2.7, y: 2.35, z: 4.6, look: 1.85, lookZ: 0.15 },
  rating: { x: -0.3, y: 2.6, z: 5.9, look: 1.75 },
  promise: { x: 0.9, y: 2.4, z: 5.6, look: 1.85 },
  p1: { x: -0.9, y: 2.5, z: 6.0, look: 1.95 },
  p2: { x: 0.9, y: 2.35, z: 5.6, look: 1.9 },
  siklus: { x: 0, y: 2.45, z: 6.2, look: 2.05 },
  p3: { x: 1.2, y: 2.6, z: 5.9, look: 1.8 },
  p4: { x: 0.7, y: 2.3, z: 5.2, look: 1.65 },
  p5: { x: -1.0, y: 2.45, z: 5.8, look: 1.95 },
  tips: { x: -0.8, y: 2.9, z: 6.0, look: 1.8 },
  serius: { x: 0, y: 2.3, z: 5.3, look: 1.95 },
  ulang: { x: 0.8, y: 2.5, z: 5.8, look: 1.9 },
  komen: { x: 0, y: 2.5, z: 6.2, look: 1.9 },
};

const SHAKES = [
  { at: BEATS.slump + 0.28, amp: 0.12 },
  { at: BEATS.ratingStamp, amp: 0.07 },
  { at: BEATS.borongan, amp: 0.06 },
];
const PATTERN = [1, -0.8, 0.6, -0.4, 0.2];
const shakeAt = (t: number) =>
  SHAKES.reduce((acc, s) => {
    const dt = t - s.at;
    if (dt < 0 || dt >= 0.3) return acc;
    return acc + s.amp * (1 - dt / 0.3) * PATTERN[Math.floor(dt / 0.06)];
  }, 0);

const cameraAt = (t: number): Required<Pose> => {
  const order = SCENES.filter((s) => POSES[s.id]);
  const first = POSES[order[0].id]!;
  const pose = { ...first, lookZ: first.lookZ ?? 0.3 };
  for (const s of order.slice(1)) {
    const target = POSES[s.id]!;
    const p = pr(t, s.start, 0.35, EASE.inOut);
    pose.x += (target.x - pose.x) * p;
    pose.y += (target.y - pose.y) * p;
    pose.z += (target.z - pose.z) * p;
    pose.look += (target.look - pose.look) * p;
    pose.lookZ += ((target.lookZ ?? 0.3) - pose.lookZ) * p;
  }
  const sh = shakeAt(t);
  return { ...pose, x: pose.x + sh, y: pose.y - sh * 0.6 };
};

const Camera: React.FC<{ pose: Required<Pose> }> = ({ pose }) => {
  const camera = useThree((st) => st.camera);
  useLayoutEffect(() => {
    camera.position.set(pose.x, pose.y, pose.z);
    camera.lookAt(0, pose.look, pose.lookZ);
  }, [camera, pose.x, pose.y, pose.z, pose.look, pose.lookZ]);
  return null;
};

/* --------------------------- si biru (ekspresi) --------------------------- */

const BLINKS = [3.8, 9.6, 14.2, 20.1, 26.5, 31.8, 38.4, 44.9, 50.3, 57.2, 63.6, 69.1];

/** kepala tergeletak di meja: dari jatuh (slump) sampai bangun di scene rating */
const slumpAt = (t: number) => {
  const wake = S("rating") + 0.5;
  return Math.min(pr(t, BEATS.slump, 0.28, EASE.in), 1 - pr(t, wake, 0.45, EASE.inOut));
};

const faceAt = (t: number): FaceState => {
  const blink = BLINKS.some((b) => Math.abs(t - b) < 0.05) ? 0.1 : 1;
  const enjoy = hold(t, BEATS.sip - 0.1, BEATS.sip + 0.7, 0.15, 0.25);
  const lho = hold(t, BEATS.sip + 0.75, BEATS.slump, 0.12, 0.1);
  const slump = slumpAt(t);
  const groggy = hold(t, S("rating") + 0.5, S("promise") + 0.2, 0.3, 0.3);
  const eits = hold(t, S("promise"), BEATS.promiseRelief + 0.6, 0.12, 0.3);
  const sleepyP1 = hold(t, BEATS.rush, END("p2"), 0.3, 0.4);
  const yawn = Math.max(
    hold(t, BEATS.borongan - 0.1, BEATS.borongan + 1.0, 0.2, 0.3),
    hold(t, BEATS.battery + 0.4, BEATS.battery + 1.5, 0.2, 0.3),
  );
  const dizzy = hold(t, BEATS.spin, END("siklus"), 0.2, 0.3);
  const tired = hold(t, S("p3"), END("p3"), 0.3, 0.3);
  const caught = hold(t, BEATS.sachet + 0.4, END("p4"), 0.2, 0.3);
  const worry = hold(t, BEATS.serious, END("serius"), 0.3, 0.3);
  const happy = Math.max(pr(t, S("tips") + 0.2, 0.4) * (1 - worry), pr(t, S("ulang"), 0.3));

  const eye = Math.min(
    blink,
    1 - enjoy * 0.75,
    1 - slump * 0.94,
    1 - groggy * 0.5,
    1 - sleepyP1 * 0.55,
    1 - dizzy * 0.85,
    1 - tired * 0.4,
  );
  return {
    eyeOpen: Math.max(0.06, eye),
    smile: Math.max(0.45 * (1 - lho) * (1 - slump) * (1 - sleepyP1) * (1 - worry), enjoy * 0.9, caught * 0.35, happy),
    open: Math.max(lho * 0.8, eits * 0.7),
    surprise: Math.max(lho, eits),
    yawn,
    sleepy: Math.max(slump, groggy, sleepyP1, tired * 0.6),
    sad: Math.max(worry * 0.9, dizzy * 0.5),
    frown: Math.max(worry * 0.7, tired * 0.3),
    pale: worry * 0.6,
    blush: Math.max(caught, happy * 0.5),
    sweat: Math.max(lho * 0.6, dizzy, caught * 0.7, worry * 0.7),
  };
};

const SiBiru: React.FC<{ t: number }> = ({ t }) => {
  const sipLean = hold(t, BEATS.sip - 0.35, BEATS.sip + 0.55, 0.3, 0.3);
  const slump = slumpAt(t);
  const hide = hold(t, BEATS.sachet + 0.35, END("p4") - 0.2, 0.25, 0.3);
  const wave = hold(t, BEATS.highFive - 0.35, END("ulang") - 0.1, 0.3, 0.3);

  const lean = sipLean * 0.3 + slump * 0.42;
  const bones: BoneOverride = {
    spine_01: [lean * 0.4, 0, 0],
    spine_02: [lean * 0.4, 0, 0],
    spine_03: [lean * 0.3, 0, 0],
    Head: [sipLean * 0.15 + slump * 0.55, 0, slump * 0.25],
    upperarm_r: [-hide * 0.7, 0, 0],
    lowerarm_r: [0, 0, 0],
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

/* ---------------------------- si americano ---------------------------- */

type CupMood = { smile: number; open: number; closed: number; sweat: number; angry: number };
const CALM: CupMood = { smile: 0.4, open: 0, closed: 0, sweat: 0, angry: 0 };

const CUP_H = 0.56;
const CUP_R = 0.2;
const CUP_R0 = 0.155;

/** Gelas es americano: plastik bening, kopi gelap + es batu, tutup kubah, sedotan. */
const IcedCup: React.FC<{ level: number; face?: CupMood; label?: boolean }> = ({ level, face, label = true }) => {
  const fill = Math.max(0.05, level) * (CUP_H - 0.06);
  return (
    <group>
      {/* kopi */}
      <mesh position={[0, 0.03 + fill / 2, 0]}>
        <cylinderGeometry args={[CUP_R0 + (CUP_R - CUP_R0) * (fill / CUP_H) - 0.012, CUP_R0 - 0.012, fill, 28]} />
        <meshStandardMaterial color="#3a2114" roughness={0.3} />
      </mesh>
      {/* es batu di permukaan */}
      {[
        [-0.06, 0.03, 0.4],
        [0.07, -0.03, -0.3],
        [0, 0.07, 0.9],
      ].map(([x, z, r], i) => (
        <mesh key={i} position={[x, 0.03 + fill - 0.02, z]} rotation={[r, r * 0.7, 0]}>
          <boxGeometry args={[0.075, 0.075, 0.075]} />
          <meshStandardMaterial color="#eaf6ff" transparent opacity={0.75} roughness={0.1} />
        </mesh>
      ))}
      {/* gelas plastik bening */}
      <mesh position={[0, CUP_H / 2, 0]}>
        <cylinderGeometry args={[CUP_R, CUP_R0, CUP_H, 32, 1, true]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.22} roughness={0.05} side={2} />
      </mesh>
      <mesh position={[0, 0.006, 0]}>
        <cylinderGeometry args={[CUP_R0, CUP_R0, 0.012, 28]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.35} />
      </mesh>
      {/* tutup kubah + bibir */}
      <mesh position={[0, CUP_H, 0]}>
        <torusGeometry args={[CUP_R, 0.014, 8, 32]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.6} />
      </mesh>
      <mesh position={[0, CUP_H, 0]} scale={[1, 0.55, 1]}>
        <sphereGeometry args={[CUP_R, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.25} roughness={0.05} />
      </mesh>
      {/* sedotan hitam */}
      <mesh position={[-0.03, CUP_H + 0.08, 0.02]} rotation={[0.12, 0, 0.18]}>
        <cylinderGeometry args={[0.018, 0.018, 0.62, 12]} />
        <meshStandardMaterial color="#141418" roughness={0.4} />
      </mesh>
      {label ? (
        <HandleDecal position={[0, 0.2, CUP_R0 + 0.035]} rotation={[-0.08, 0, 0]} width={0.34} text="americano" bg="#ffffff" fg="#3a2114" />
      ) : null}
      {face ? <CupFace mood={face} /> : null}
    </group>
  );
};

const CupFace: React.FC<{ mood: CupMood }> = ({ mood }) => {
  const z = CUP_R0 + (CUP_R - CUP_R0) * 0.68 + 0.012;
  return (
    <group position={[0, 0.39, z]}>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.07, 0, 0]}>
          <mesh scale={[1, Math.max(0.12, 1 - mood.closed), 0.5]}>
            <sphereGeometry args={[0.034, 14, 12]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0, -0.004, 0.014]} scale={[1, Math.max(0.12, 1 - mood.closed), 0.5]}>
            <sphereGeometry args={[0.018, 12, 10]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          {mood.angry > 0.05 ? (
            <mesh position={[0, 0.05, 0.01]} rotation={[0, 0, s * -0.5 * mood.angry]}>
              <boxGeometry args={[0.06, 0.012, 0.01]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
          ) : null}
        </group>
      ))}
      {mood.open > 0.3 ? (
        <mesh position={[0, -0.07, 0]} scale={[0.8, 0.5 + mood.open * 0.6, 0.4]}>
          <sphereGeometry args={[0.03, 14, 12]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ) : (
        <mesh position={[0, mood.smile >= 0 ? -0.055 : -0.085, 0]} rotation={[0, 0, mood.smile >= 0 ? Math.PI + 0.4 : 0.4]}>
          <torusGeometry args={[0.03, 0.008, 8, 16, Math.PI * 0.75]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      )}
      {mood.sweat > 0.05 ? (
        <mesh position={[0.15, 0.08, -0.02]} scale={mood.sweat}>
          <sphereGeometry args={[0.025, 12, 10]} />
          <meshStandardMaterial color="#8fd3ff" transparent opacity={0.9} />
        </mesh>
      ) : null}
    </group>
  );
};

const CUP_HOME: [number, number, number] = [0.62, TABLE_TOP, 0.72];
const CUP_SIP: [number, number, number] = [0.3, TABLE_TOP, 0.34];

const cupAt = (t: number, cam: Required<Pose>) => {
  // lompat ke depan si biru untuk disruput, lalu kembali
  const go = pr(t, BEATS.sip - 0.5, 0.3, EASE.out) - pr(t, BEATS.sip + 0.65, 0.3, EASE.out);
  const pos: [number, number, number] = [
    CUP_HOME[0] + (CUP_SIP[0] - CUP_HOME[0]) * go,
    CUP_HOME[1] + 0.18 * (hop(t, BEATS.sip - 0.5, 0.3) + hop(t, BEATS.sip + 0.65, 0.3)),
    CUP_HOME[2] + (CUP_SIP[2] - CUP_HOME[2]) * go,
  ];
  // kaget dicap 1/5: lompat sekali
  pos[1] += 0.14 * hop(t, BEATS.ratingStamp + 0.05, 0.28);
  // tos di rating ulang
  pos[1] += 0.6 * hop(t, BEATS.highFive, 0.45);

  // isi berkurang bertahap tiap disruput
  const level = 0.85 - 0.25 * (t >= BEATS.sip + 0.25 ? 1 : 0);

  // mood per ketukan
  let mood: CupMood = { ...CALM, smile: 0.7 };
  if (t >= BEATS.sip - 0.5 && t < BEATS.sip + 0.9) mood = { ...CALM, smile: 1, closed: 0.85 };
  if (t >= BEATS.ratingStamp && t < S("promise")) mood = { ...CALM, open: 1, sweat: 1 };
  if (t >= BEATS.promiseRelief && t < S("p1")) mood = { ...CALM, smile: 1, closed: 0.85, sweat: 0.4 };
  if (t >= BEATS.kasur && t < END("p2")) mood = { ...CALM, smile: -0.6, angry: 0.7 };
  if (t >= BEATS.spin && t < END("siklus")) mood = { ...CALM, open: 0.6, closed: 1, sweat: 1 };
  if (t >= BEATS.zeroSugar && t < BEATS.sachet) mood = { ...CALM, open: 1, angry: 1 };
  if (t >= BEATS.sachet && t < END("p4")) mood = { ...CALM, open: 1, sweat: 1, angry: 0.4 };
  if (t >= S("tips") && t < S("serius")) mood = { ...CALM, smile: 1 };
  if (t >= S("ulang")) mood = { ...CALM, smile: 1, closed: t > BEATS.highFive ? 0.8 : 0 };

  // hilang saat bagian serius, kembali di rating ulang
  const vis = 1 - pr(t, BEATS.serious, 0.25, EASE.in) + pr(t, S("ulang") + 0.05, 0.35, EASE.back);
  const squash = pr(t, BEATS.ratingStamp, 0.05) - pr(t, BEATS.ratingStamp + 0.08, 0.3);
  const face = Math.atan2(cam.x - pos[0], cam.z - pos[2]) * 0.7;
  return { pos, level, mood, vis: Math.max(0, Math.min(1.1, vis)), squash, face };
};

const SiAmericano: React.FC<{ t: number; cam: Required<Pose> }> = ({ t, cam }) => {
  const c = cupAt(t, cam);
  if (c.vis <= 0.001) return null;
  return (
    <group
      position={c.pos}
      rotation={[0, c.face, 0]}
      scale={[c.vis * (1 + 0.2 * c.squash), c.vis * (1 - 0.3 * c.squash), c.vis * (1 + 0.2 * c.squash)]}
    >
      <IcedCup level={c.level} face={c.mood} />
    </group>
  );
};

/** Posisi layar (px, komposisi 1080x1920) titik di atas gelas, untuk balon teks overlay. */
export const CANVAS_TOP = 600;
const projCam = new THREE.PerspectiveCamera(38, 1080 / (1920 - CANVAS_TOP), 0.1, 100);
export const cupScreen = (t: number, above = 0.95) => {
  const cam = cameraAt(t);
  const c = cupAt(t, cam);
  projCam.position.set(cam.x, cam.y, cam.z);
  projCam.lookAt(0, cam.look, cam.lookZ);
  projCam.updateMatrixWorld(true);
  const v = new THREE.Vector3(c.pos[0], c.pos[1] + CUP_H + above, c.pos[2]).project(projCam);
  return { x: ((v.x + 1) / 2) * 1080, y: CANVAS_TOP + ((1 - v.y) / 2) * (1920 - CANVAS_TOP) };
};

/* -------------------------------- set kafe -------------------------------- */

const Cafe: React.FC = () => (
  <group>
    {/* lantai kayu */}
    <mesh position={[0, -0.01, 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[2.8, 64]} />
      <meshStandardMaterial color="#5a3a26" roughness={0.85} />
    </mesh>
    {/* meja bundar */}
    <mesh position={[0, TABLE_TOP - 0.04, 0.78]}>
      <cylinderGeometry args={[0.95, 0.95, 0.08, 48]} />
      <meshStandardMaterial color="#c58a55" roughness={0.55} />
    </mesh>
    <mesh position={[0, TABLE_TOP - 0.1, 0.78]}>
      <cylinderGeometry args={[0.93, 0.9, 0.05, 48]} />
      <meshStandardMaterial color="#9c6a3f" roughness={0.6} />
    </mesh>
    <mesh position={[0, (TABLE_TOP - 0.12) / 2, 0.78]}>
      <cylinderGeometry args={[0.06, 0.06, TABLE_TOP - 0.12, 16]} />
      <meshStandardMaterial color="#26282e" metalness={0.5} roughness={0.4} />
    </mesh>
    <mesh position={[0, 0.03, 0.78]}>
      <cylinderGeometry args={[0.38, 0.42, 0.05, 32]} />
      <meshStandardMaterial color="#26282e" metalness={0.5} roughness={0.4} />
    </mesh>
    {/* kartu menu berdiri: stiker @day.one.eight (anti re-upload) */}
    <group position={[-0.58, TABLE_TOP, 0.55]} rotation={[0, 0.5, 0]}>
      <mesh position={[0, 0.17, 0]} rotation={[-0.18, 0, 0]}>
        <boxGeometry args={[0.6, 0.34, 0.02]} />
        <meshStandardMaterial color="#20294f" roughness={0.5} />
      </mesh>
      <HandleDecal position={[0, 0.17, 0.015]} rotation={[-0.18, 0, 0]} width={0.54} />
    </group>
    {/* kursi */}
    <mesh position={[0, 0.8, -0.15]}>
      <cylinderGeometry args={[0.5, 0.5, 0.08, 32]} />
      <meshStandardMaterial color="#2f7a5b" roughness={0.6} />
    </mesh>
    <mesh position={[0, 1.2, -0.62]}>
      <boxGeometry args={[0.95, 0.65, 0.08]} />
      <meshStandardMaterial color="#2f7a5b" roughness={0.6} />
    </mesh>
    <mesh position={[0, 0.4, -0.15]}>
      <cylinderGeometry args={[0.05, 0.05, 0.8, 12]} />
      <meshStandardMaterial color="#26282e" metalness={0.5} roughness={0.4} />
    </mesh>
    {/* tanaman pot di belakang */}
    <group position={[-1.9, 0, -1.2]}>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.3, 0.24, 0.6, 24]} />
        <meshStandardMaterial color="#d8d2c4" roughness={0.7} />
      </mesh>
      {[
        [0, 1.0, 0, 0.35],
        [-0.25, 0.85, 0.1, 0.28],
        [0.25, 0.9, 0.05, 0.3],
        [0.05, 1.3, -0.05, 0.27],
      ].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[r, 18, 14]} />
          <meshStandardMaterial color={i % 2 ? "#3f9a5a" : "#2f7f49"} roughness={0.8} />
        </mesh>
      ))}
    </group>
  </group>
);

/* ------------------------------- props poin ------------------------------- */

/** "adenosin": bola ungu mengantuk */
const Zzz: React.FC = () => (
  <group>
    <mesh>
      <sphereGeometry args={[0.13, 20, 16]} />
      <meshStandardMaterial color="#9b7bff" roughness={0.5} />
    </mesh>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * 0.045, 0.02, 0.125]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.022, 0.006, 6, 12, Math.PI]} />
        <meshStandardMaterial color="#2a1a5e" />
      </mesh>
    ))}
  </group>
);

/** "kafein": satpam cokelat berkacamata hitam */
const Guard: React.FC = () => (
  <group>
    <mesh>
      <capsuleGeometry args={[0.16, 0.28, 8, 16]} />
      <meshStandardMaterial color="#6b3f22" roughness={0.5} />
    </mesh>
    <mesh position={[0, 0.12, 0.13]}>
      <boxGeometry args={[0.26, 0.06, 0.06]} />
      <meshStandardMaterial color="#111" roughness={0.2} />
    </mesh>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * 0.25, -0.02, 0]} rotation={[0, 0, s * 1.1]}>
        <capsuleGeometry args={[0.045, 0.2, 6, 10]} />
        <meshStandardMaterial color="#6b3f22" roughness={0.5} />
      </mesh>
    ))}
  </group>
);

const Battery: React.FC<{ bars: number }> = ({ bars }) => (
  <group>
    <mesh>
      <boxGeometry args={[0.62, 0.3, 0.06]} />
      <meshStandardMaterial color="#ffffff" roughness={0.4} />
    </mesh>
    <mesh position={[0, 0, 0.02]}>
      <boxGeometry args={[0.55, 0.23, 0.04]} />
      <meshStandardMaterial color="#1b1b1f" />
    </mesh>
    <mesh position={[0.34, 0, 0]}>
      <boxGeometry args={[0.05, 0.12, 0.05]} />
      <meshStandardMaterial color="#ffffff" />
    </mesh>
    {[0, 1, 2].map((i) =>
      i < bars ? (
        <mesh key={i} position={[-0.18 + i * 0.18, 0, 0.05]}>
          <boxGeometry args={[0.15, 0.18, 0.02]} />
          <meshStandardMaterial color={bars === 1 ? "#e3263b" : "#5ad16a"} emissive={bars === 1 ? "#e3263b" : "#2d8a3a"} emissiveIntensity={0.4} />
        </mesh>
      ) : null,
    )}
  </group>
);

const Moon: React.FC = () => (
  <mesh rotation={[0, 0, 0.6]}>
    <torusGeometry args={[0.13, 0.06, 10, 24, Math.PI * 1.1]} />
    <meshStandardMaterial color="#FFD400" emissive="#c9a400" emissiveIntensity={0.3} />
  </mesh>
);

const SleepyFace: React.FC = () => (
  <group>
    <mesh>
      <sphereGeometry args={[0.16, 20, 16]} />
      <meshStandardMaterial color="#f2c09b" roughness={0.6} />
    </mesh>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * 0.055, 0.02, 0.15]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.025, 0.007, 6, 12, Math.PI]} />
        <meshStandardMaterial color="#2b1d16" />
      </mesh>
    ))}
    <mesh position={[0, -0.06, 0.15]} scale={[1, 1.3, 0.5]}>
      <sphereGeometry args={[0.025, 12, 10]} />
      <meshStandardMaterial color="#5a1f22" />
    </mesh>
  </group>
);

const MiniCup: React.FC = () => (
  <group>
    <mesh position={[0, 0.1, 0]}>
      <cylinderGeometry args={[0.11, 0.09, 0.22, 20]} />
      <meshStandardMaterial color="#3a2114" />
    </mesh>
    <mesh position={[0.13, 0.11, 0]}>
      <torusGeometry args={[0.05, 0.015, 8, 14]} />
      <meshStandardMaterial color="#3a2114" />
    </mesh>
  </group>
);

const Arrow: React.FC = () => (
  <mesh rotation={[0, 0, -Math.PI / 2]}>
    <coneGeometry args={[0.07, 0.16, 3]} />
    <meshStandardMaterial color="#ffffff" />
  </mesh>
);

const Sachet: React.FC = () => (
  <group>
    <mesh>
      <boxGeometry args={[0.1, 0.24, 0.02]} />
      <meshStandardMaterial color="#ffffff" roughness={0.5} />
    </mesh>
    <mesh position={[0, 0.03, 0.012]}>
      <boxGeometry args={[0.1, 0.06, 0.004]} />
      <meshStandardMaterial color="#e3263b" />
    </mesh>
  </group>
);

const Dna: React.FC = () => (
  <group>
    {Array.from({ length: 11 }).map((_, i) => {
      const a = i * 0.62;
      const y = (i - 5) * 0.085;
      const x = Math.cos(a) * 0.17;
      const z = Math.sin(a) * 0.17;
      return (
        <group key={i} position={[0, y, 0]}>
          <mesh position={[x, 0, z]}>
            <sphereGeometry args={[0.038, 12, 10]} />
            <meshStandardMaterial color="#4aa8ff" />
          </mesh>
          <mesh position={[-x, 0, -z]}>
            <sphereGeometry args={[0.038, 12, 10]} />
            <meshStandardMaterial color="#ff7ab0" />
          </mesh>
          <mesh rotation={[0, -a, Math.PI / 2]}>
            <cylinderGeometry args={[0.01, 0.01, 0.34, 6]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        </group>
      );
    })}
  </group>
);

const Clock: React.FC = () => (
  <group>
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.3, 0.3, 0.06, 32]} />
      <meshStandardMaterial color="#ffffff" roughness={0.4} />
    </mesh>
    <mesh position={[0, 0, 0.03]}>
      <torusGeometry args={[0.3, 0.025, 8, 32]} />
      <meshStandardMaterial color="#e3263b" />
    </mesh>
    {/* jam 9 pagi */}
    <mesh position={[-0.08, 0, 0.045]} rotation={[0, 0, Math.PI / 2]}>
      <boxGeometry args={[0.03, 0.17, 0.01]} />
      <meshStandardMaterial color="#1b1b1f" />
    </mesh>
    <mesh position={[0, 0.11, 0.045]}>
      <boxGeometry args={[0.022, 0.22, 0.01]} />
      <meshStandardMaterial color="#1b1b1f" />
    </mesh>
  </group>
);

const Warning: React.FC = () => (
  <group rotation={[Math.PI / 2, 0, 0]}>
    <mesh rotation={[0, Math.PI / 6 - Math.PI / 2, 0]}>
      <cylinderGeometry args={[0.3, 0.3, 0.05, 3]} />
      <meshStandardMaterial color="#FFD400" roughness={0.4} />
    </mesh>
    <mesh position={[0, 0.04, -0.04]}>
      <boxGeometry args={[0.05, 0.02, 0.17]} />
      <meshStandardMaterial color="#10183a" />
    </mesh>
    <mesh position={[0, 0.04, 0.1]}>
      <boxGeometry args={[0.05, 0.02, 0.05]} />
      <meshStandardMaterial color="#10183a" />
    </mesh>
  </group>
);

const HEAD: [number, number, number] = [0, 2.15, 0.15];

const Props: React.FC<{ t: number }> = ({ t }) => {
  /* p1: antrean adenosin ditahan satpam kafein, lalu menyerbu kepala */
  const p1 = S("p1");
  const p1End = END("p1");
  const queue = popIn(t, p1 + 0.3, p1End + 0.01);
  const guardIn = popIn(t, BEATS.guard, BEATS.rush + 0.01);
  const guardOut = pr(t, BEATS.rush - 0.05, 0.35, EASE.in);

  /* p2 */
  const batt = popIn(t, S("p2") + 0.2, END("p2"));
  const bars = 3 - Math.min(2, Math.max(0, Math.floor((t - BEATS.battery) / 0.35) + 1)) * (t >= BEATS.battery ? 1 : 0);

  /* siklus */
  const ring = popIn(t, BEATS.cyc1 - 0.05, END("siklus"));
  const ringSpin = -Math.PI * 2 * pr(t, BEATS.spin, 1.1, EASE.inOut);
  const cycAt = [BEATS.cyc1, BEATS.cyc2, BEATS.cyc3];

  /* p3: gelas bertambah */
  const p3End = END("p3");

  /* p4: sachet jatuh & memantul sekali di meja */
  const p4End = END("p4");

  /* p5 */
  const dna = popIn(t, BEATS.dna, END("p5"));

  /* tips */
  const clock = popIn(t, BEATS.clock, END("tips"));

  /* serius */
  const warn = popIn(t, BEATS.serious + 0.3, END("serius"));

  /* rating ulang: kilau bintang kecil dari gelas */
  return (
    <group>
      {queue > 0
        ? [0, 1, 2, 3, 4].map((i) => {
            const base: [number, number, number] = [
              [-1.05, 1.95, 0.5],
              [-1.15, 2.3, 0.45],
              [-1.05, 2.65, 0.4],
              [-0.8, 2.92, 0.35],
              [-0.45, 3.08, 0.3],
            ][i] as [number, number, number];
            const at = BEATS.rush + 0.1 + i * 0.1;
            const u = pr(t, at, 0.4, EASE.in);
            const gone = u >= 1;
            if (gone) return null;
            return (
              <group
                key={i}
                position={[base[0] + (HEAD[0] - 0.2 - base[0]) * u, base[1] + (HEAD[1] + 0.1 - base[1]) * u + 0.2 * hop(t, at, 0.4), base[2]]}
                scale={queue * (1 - 0.6 * u)}
                rotation={[0, 0.3, 0]}
              >
                <Zzz />
              </group>
            );
          })
        : null}
      {guardIn > 0 && guardOut < 1 ? (
        <group
          position={[-0.62, 2.3 + 1.2 * guardOut, 0.6]}
          scale={guardIn * (1 - guardOut)}
          rotation={[0, 0.3 + spinIn(t, BEATS.guard), guardOut * 1.2]}
        >
          <Guard />
        </group>
      ) : null}

      {batt > 0 ? (
        <group position={[-0.9, 2.8, 0.45]} scale={batt * 0.9} rotation={[0, 0.25 + spinIn(t, S("p2") + 0.2), 0]}>
          <Battery bars={bars} />
        </group>
      ) : null}

      {ring > 0 ? (
        <group position={[0, 2.6, 0.95]} rotation={[0, 0, ringSpin]} scale={ring}>
          {[<MiniCup key="c" />, <Moon key="m" />, <SleepyFace key="f" />].map((icon, i) => {
            const a = Math.PI / 2 - (i * Math.PI * 2) / 3;
            const s = pr(t, cycAt[i], 0.3, EASE.back);
            const aa = a - Math.PI / 3; // panah di antara ikon
            const arrow = pr(t, cycAt[i] + 0.15, 0.25, EASE.back);
            return (
              <group key={i}>
                <group position={[Math.cos(a) * 0.95, Math.sin(a) * 0.95, 0]} scale={s * 1.5} rotation={[0, 0, -ringSpin]}>
                  {icon}
                </group>
                <group position={[Math.cos(aa) * 0.95, Math.sin(aa) * 0.95, 0]} rotation={[0, 0, aa - Math.PI / 2]} scale={arrow * 1.6}>
                  <Arrow />
                </group>
              </group>
            );
          })}
        </group>
      ) : null}

      {t >= BEATS.cups && t <= p3End
        ? [0, 1].map((i) => {
            const s = popIn(t, BEATS.cups + i * 0.25, p3End);
            return s > 0 ? (
              <group key={i} position={[0.95 + i * 0.32, TABLE_TOP, 0.5 + i * 0.18]} scale={s * 0.85} rotation={[0, -0.3, 0]}>
                <IcedCup level={0.15} label={false} />
              </group>
            ) : null;
          })
        : null}

      {t >= BEATS.sachet - 0.2 && t <= p4End
        ? [0, 1, 2].map((i) => {
            const at = BEATS.sachet + i * 0.25;
            if (t < at - 0.2) return null;
            const fall = pr(t, at - 0.2, 0.2, EASE.in);
            const land: [number, number, number] = [0.2 + i * 0.24, TABLE_TOP + 0.02, 1.05 + (i % 2) * 0.12];
            const y = land[1] + 1.4 * (1 - fall) + 0.08 * hop(t, at, 0.18);
            const out = 1 - pr(t, p4End - 0.15, 0.15, EASE.in);
            return (
              <group key={i} position={[land[0], y, land[2]]} rotation={[fall * -Math.PI / 2, 0, i * 0.6 - 0.5]} scale={out * 1.7}>
                <Sachet />
              </group>
            );
          })
        : null}

      {dna > 0 ? (
        <group position={[-0.88, 2.5, 0.5]} scale={dna * 1.2} rotation={[0.15, spinIn(t, BEATS.dna) * 3, 0.2]}>
          <Dna />
        </group>
      ) : null}

      {clock > 0 ? (
        <group position={[-0.92, 2.65, 0.45]} scale={clock * 0.9} rotation={[0, 0.3 + spinIn(t, BEATS.clock), 0]}>
          <Clock />
        </group>
      ) : null}

      {warn > 0 ? (
        <group position={[0.82, 2.8, 0.45]} scale={warn} rotation={[0, -0.25 + spinIn(t, BEATS.serious + 0.3), 0]}>
          <Warning />
        </group>
      ) : null}

      {STAR_TIMES.map((at, i) => {
        if (t < at || t > at + 0.6) return null;
        const u = pr(t, at, 0.6, EASE.out);
        return (
          <mesh key={i} position={[CUP_HOME[0] + (i - 1) * 0.25, CUP_HOME[1] + 0.7 + u * 0.5, CUP_HOME[2]]} scale={0.8 * (1 - u)}>
            <octahedronGeometry args={[0.08]} />
            <meshStandardMaterial color="#FFD400" emissive="#FFD400" emissiveIntensity={0.6} />
          </mesh>
        );
      })}
    </group>
  );
};

/* -------------------------------- scene ------------------------------- */

export const Scene3D: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const cam = cameraAt(t);
  return (
    <ThreeCanvas width={width} height={height} camera={{ fov: 38, position: [0, 2.6, 7.8] }}>
      <Camera pose={cam} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 6, 5]} intensity={2.1} color="#fff1dc" />
      <directionalLight position={[-4, 3, -3]} intensity={1.1} color="#ffb54a" />
      <directionalLight position={[0, 4, -6]} intensity={1.3} color="#ffffff" />
      <pointLight position={[1.7, 4.1, -1.4]} intensity={4} distance={6} color="#ffd98a" />
      <pointLight position={[0, 3, 3]} intensity={5} distance={8} color="#ffffff" />
      <Cafe />
      <SiBiru t={t} />
      <SiAmericano t={t} cam={cam} />
      <Props t={t} />
    </ThreeCanvas>
  );
};
