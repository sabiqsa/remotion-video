// Scene 3D "gigit kuku" — si biru berpiyama dino 🦖 (tudung bermata, duri, ekor) di meja kamar
// malam. Saat menggigit: gigi kelinci keluar + "tangan raksasa" kartun naik ke mulut; tiap kuku
// punya muka ("geng si kuku") yang panik saat digigit, lalu jempolnya pendek & diplester.
// Macro ke mulut saat menggigit dan ke kuku saat "sarang kuman". Semua gerak diskret per ketukan.

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
import { BEATS, BITES, ZOOMS } from "./beats";
import { END, sceneById, SceneId, SCENES } from "./script";

const TABLE_TOP = 1.2;
const DESK_Z = 0.78;
const CHAR_SCALE = 1.75;
const WARDROBE: Wardrobe = { hair: "bowl", outfit: "dino", accessories: ["dino_hood"] };
const COLORS = { pants: "#5cc56b", shoes: "#ff9f1a" };
const SKIN = "#f2c09b";

/** mulut si biru (perkiraan dunia) & kuku telunjuk tangan raksasa saat rebahan di meja */
export const MOUTH: [number, number, number] = [0.125, 2.215, 0.49];

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

/** 0..1 seberapa sedang menggigit */
export const biteAt = (t: number) => BITES.reduce((m, [a, b]) => Math.max(m, hold(t, a, b, 0.22, 0.25)), 0);
/** "kriuk": kapan rahang mengatup di tiap gigitan */
export const CRUNCHES = [BEATS.bite0, BEATS.bite1 + 0.25, BEATS.snack + 0.2];

/* ------------------------------- tangan raksasa ------------------------------- */

/** posisi tangan raksasa per waktu: dekat mulut saat menggigit, berdiri di meja saat lain */
type HandState = { pos: [number, number, number]; rot: [number, number, number]; scale: number; ext: number[]; vis: number };

const GERM_HAND: HandState = { pos: [0.62, TABLE_TOP + 0.2, DESK_Z + 0.2], rot: [0, -0.3, 0.15], scale: 1.25, ext: [1, 1, 1, 1, 1], vis: 1 };
/** kuku telunjuk tangan raksasa di meja (target macro "sarang kuman") */
export const GERM_NAIL: [number, number, number] = [0.6, TABLE_TOP + 0.53, DESK_Z + 0.27];

const handAt = (t: number): HandState => {
  const bite = biteAt(t);
  if (bite > 0.001) {
    return {
      pos: [MOUTH[0] - 0.13, MOUTH[1] - 0.125 - (1 - bite) * 0.5, MOUTH[2] + 0.05],
      rot: [0, 0, 0.35],
      scale: 0.85,
      ext: [1, 0.1, 0.1, 0.1, 0.1],
      vis: Math.min(1, bite * 1.5),
    };
  }
  // promise: diangkat di samping, jari 1-2-3 berdiri satu per satu
  const pVis = popIn(t, S("promise") + 0.1, END("promise"));
  if (pVis > 0) {
    const e1 = pr(t, BEATS.count1, 0.2, EASE.back);
    const e2 = pr(t, (BEATS.count1 + BEATS.count3) / 2, 0.2, EASE.back);
    const e3 = pr(t, BEATS.count3, 0.2, EASE.back);
    return { pos: [0.72, 2.3, 0.95], rot: [0, -0.25, 0], scale: 2.1 * pVis, ext: [0, e1, e2, e3, 0], vis: 1 };
  }
  // bahaya & serius: berdiri di meja (target macro kuman; lalu jempol diplester)
  const dVis = Math.max(popIn(t, S("bahaya") + 0.1, END("bahaya")), popIn(t, S("serius") + 0.2, END("serius")));
  if (dVis > 0) return { ...GERM_HAND, scale: GERM_HAND.scale * dVis };
  return { pos: [0, 0, 0], rot: [0, 0, 0], scale: 0, ext: [1, 1, 1, 1, 1], vis: 0 };
};

type NailMood = "happy" | "scared" | "sad";

const Nail: React.FC<{ mood: NailMood; short?: number; bandage?: boolean }> = ({ mood, short = 0, bandage }) => {
  const black = "#1b1b1f";
  return (
    <group scale={[1, 1 - 0.45 * short, 1]}>
      <mesh scale={[1, 1.15, 0.35]}>
        <sphereGeometry args={[0.026, 18, 14]} />
        <meshStandardMaterial color="#ffb3c7" roughness={0.25} />
      </mesh>
      {/* mata */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.009, 0.006, 0.009]} scale={mood === "scared" ? 1.35 : 1}>
          <sphereGeometry args={[0.0048, 8, 6]} />
          <meshStandardMaterial color={black} />
        </mesh>
      ))}
      {/* mulut */}
      {mood === "scared" ? (
        <mesh position={[0, -0.011, 0.009]} scale={[1, 1.4, 0.5]}>
          <sphereGeometry args={[0.005, 8, 6]} />
          <meshStandardMaterial color="#5a1f22" />
        </mesh>
      ) : (
        <mesh position={[0, mood === "happy" ? -0.008 : -0.013, 0.009]} rotation={[0, 0, mood === "happy" ? Math.PI + 0.4 : 0.4]}>
          <torusGeometry args={[0.0055, 0.0014, 6, 12, Math.PI * 0.75]} />
          <meshStandardMaterial color="#5a1f22" />
        </mesh>
      )}
      {/* pipi */}
      {[-1, 1].map((s) => (
        <mesh key={`c${s}`} position={[s * 0.016, -0.004, 0.006]} scale={[1, 0.6, 0.4]}>
          <sphereGeometry args={[0.005, 8, 6]} />
          <meshStandardMaterial color="#ff7a95" />
        </mesh>
      ))}
      {bandage ? (
        <group position={[0, -0.03, 0.006]} rotation={[0, 0, 0.3]}>
          <mesh>
            <boxGeometry args={[0.07, 0.022, 0.006]} />
            <meshStandardMaterial color="#f1c9a5" />
          </mesh>
          <mesh position={[0, 0, 0.004]}>
            <boxGeometry args={[0.022, 0.016, 0.003]} />
            <meshStandardMaterial color="#e8b089" />
          </mesh>
        </group>
      ) : null}
    </group>
  );
};

const FINGERS = [
  { x: -0.075, len: 0.13 },
  { x: -0.025, len: 0.145 },
  { x: 0.025, len: 0.135 },
  { x: 0.075, len: 0.11 },
];

/** tangan kartun: telapak menghadap +Z, jari ke atas; jempol di sisi +X menunjuk serong atas */
const GiantHand: React.FC<{ t: number }> = ({ t }) => {
  const h = handAt(t);
  if (h.vis <= 0.001 || h.scale <= 0.001) return null;
  const skin = <meshStandardMaterial color={SKIN} roughness={0.7} />;
  // mood kuku: panik saat jempol didekatkan ke gigi; sedih setelah digigit; senang selain itu
  const bite = biteAt(t);
  const bitten = CRUNCHES.some((c) => t >= c && t < c + 1.2);
  const thumbMood: NailMood = bite > 0.3 ? (bitten ? "sad" : "scared") : "happy";
  const othersMood: NailMood = bite > 0.3 ? "scared" : t >= S("bahaya") && t < END("bahaya") ? "sad" : "happy";
  const short = t >= BEATS.bite0 ? 1 : 0;
  const bandage = t >= S("serius");
  const tremble = bite > 0.3 ? wiggle(t, BITES.find(([a, b]) => t >= a && t <= b)?.[0] ?? 0, 0.5, 3) * 0.02 : 0;
  return (
    <group position={h.pos} rotation={h.rot} scale={h.scale}>
      <mesh scale={[1.1, 1, 0.55]}>
        <sphereGeometry args={[0.12, 24, 18]} />
        {skin}
      </mesh>
      {FINGERS.map((f, i) => {
        const ext = h.ext[i + 1];
        const curl = (1 - ext) * 2.0;
        return (
          <group key={i} position={[f.x, 0.09, 0]} rotation={[-curl, 0, tremble * (i % 2 ? 1 : -1)]}>
            <mesh position={[0, f.len / 2, 0]}>
              <capsuleGeometry args={[0.032, f.len, 6, 12]} />
              {skin}
            </mesh>
            <group position={[0, f.len + 0.012, 0.027]}>
              <Nail mood={othersMood} />
            </group>
          </group>
        );
      })}
      {/* jempol */}
      <group position={[0.1, 0.0, 0.02]} rotation={[0, 0, -0.6 + (1 - h.ext[0]) * 1.2]}>
        <mesh position={[0, 0.055, 0]}>
          <capsuleGeometry args={[0.036, 0.09, 6, 12]} />
          {skin}
        </mesh>
        <group position={[0, 0.115, 0.03]}>
          <Nail mood={thumbMood} short={short} bandage={bandage} />
        </group>
      </group>
    </group>
  );
};

/* ------------------------------- kamera ------------------------------- */

type Pose = { x: number; y: number; z: number; lx: number; ly: number; lz: number };
const P = (x: number, y: number, z: number, ly: number, lx = 0, lz = 0.3): Pose => ({ x, y, z, lx, ly, lz });
const POSES: Record<SceneId, Pose> = {
  hook: P(0.7, 2.45, 5.2, 2.05),
  nama: P(-0.7, 2.55, 6.0, 2.05),
  promise: P(0.2, 2.5, 6.0, 2.1),
  p1: P(1.1, 2.3, 5.0, 1.95),
  p2: P(-0.9, 2.45, 5.2, 2.0),
  p3: P(0.6, 1.75, 4.9, 2.15, 0.1),
  bahaya: P(0.9, 2.5, 5.6, 2.0),
  tips: P(-0.6, 2.55, 5.9, 2.0),
  serius: P(0, 2.4, 5.3, 2.05),
  komen: P(0, 2.5, 6.0, 2.0),
};
const macroPose = (target: "mouth" | "germ"): Pose => {
  const p = target === "mouth" ? MOUTH : GERM_NAIL;
  const d = target === "mouth" ? 0.6 : 0.32;
  return { x: p[0] + 0.03, y: p[1] + 0.02, z: p[2] + d, lx: p[0], ly: p[1], lz: p[2] };
};

export const macroAt = (t: number) =>
  ZOOMS.reduce((m, [a, b]) => Math.max(m, Math.min(pr(t, a, 0.3, EASE.inOut), 1 - pr(t, b, 0.45, EASE.inOut))), 0);
const zoomTarget = (t: number) =>
  ZOOMS.reduce((best, cur) => (Math.abs(t - (cur[0] + cur[1]) / 2) < Math.abs(t - (best[0] + best[1]) / 2) ? cur : best))[2];

const SHAKES = [
  ...CRUNCHES.map((at) => ({ at, amp: 0.05 })),
  { at: BEATS.crack, amp: 0.04 },
  { at: BEATS.scare, amp: 0.03 },
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
  pose = lerpPose(pose, macroPose(zoomTarget(t)), macroAt(t));
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

/** 0 = malam, 1 = lampu kamar menyala (tips → akhir) */
export const lightsAt = (t: number) => pr(t, S("tips"), 0.4, EASE.inOut);
/** cahaya layar horor (hook) */
const horrorAt = (t: number) => hold(t, 0.05, END("hook") - 0.2, 0.2, 0.3);

/* --------------------------- si biru (ekspresi) --------------------------- */

const BLINKS = [3.4, 8.2, 12.9, 18.6, 23.1, 28.8, 34.2, 40.1, 45.6, 50.2];

const faceAt = (t: number): FaceState => {
  const blink = BLINKS.some((b) => Math.abs(t - b) < 0.05) ? 0.1 : 1;
  const bite = biteAt(t);
  const scared = hold(t, BEATS.scare, BEATS.buck0, 0.1, 0.2);
  const nervous = hold(t, BEATS.load, END("p1"), 0.25, 0.3);
  const bored = hold(t, BEATS.clock, BEATS.notice - 0.1, 0.3, 0.15);
  const huh = hold(t, BEATS.notice, END("p2"), 0.08, 0.3);
  const think = hold(t, BEATS.think, BEATS.snack - 0.2, 0.25, 0.2);
  const proud = hold(t, BEATS.card, END("nama"), 0.25, 0.3);
  const ew = hold(t, BEATS.germs, BEATS.crack, 0.2, 0.15);
  const ouch = hold(t, BEATS.crack, END("bahaya"), 0.06, 0.3);
  const fresh = hold(t, S("tips") + 0.3, END("tips"), 0.3, 0.3);
  const kind = hold(t, S("serius") + 0.2, END("serius"), 0.3, 0.3);
  const happy = pr(t, S("komen"), 0.3);
  return {
    eyeOpen: Math.max(0.06, Math.min(blink, 1 - bored * 0.45 + scared * 0.1)),
    buck: Math.max(bite, ouch),
    smile: Math.max(proud * 0.8, fresh, kind * 0.6, happy, 0.2 * (1 - nervous) * (1 - ew)),
    open: Math.max(scared * 0.8, huh * 0.6),
    surprise: Math.max(scared, huh, ouch * 0.6),
    sleepy: bored * 0.7,
    sad: Math.max(nervous * 0.7, ew * 0.5, ouch * 0.7, think * 0.3),
    frown: Math.max(ew * 0.8, nervous * 0.3),
    pain: ouch * 0.0,
    blush: Math.max(happy * 0.4, kind * 0.3, proud * 0.3),
    sweat: Math.max(nervous, scared * 0.7, ouch * 0.6),
  };
};

const SiBiru: React.FC<{ t: number }> = ({ t }) => {
  const bite = biteAt(t);
  const scared = hold(t, BEATS.scare, BEATS.buck0, 0.1, 0.2);
  const lookHand = hold(t, BEATS.notice, END("p2") - 0.1, 0.1, 0.3); // "eh? siapa yang nyuruh?"
  const think = hold(t, BEATS.think - 0.2, BEATS.snack - 0.35, 0.3, 0.25);
  const squish = hold(t, BEATS.tick3 - 0.2, END("tips") - 0.1, 0.25, 0.3);
  const wave = hold(t, BEATS.teamC, END("komen") - 0.1, 0.3, 0.3);
  const hug = hold(t, BEATS.calm - 0.2, END("serius") - 0.1, 0.3, 0.3);

  const bones: BoneOverride = {
    spine_01: [scared * -0.06, 0, 0],
    spine_02: [bite * 0.06, 0, 0],
    Head: [lookHand * 0.35 + bite * -0.05 - think * 0.15, lookHand * -0.25, think * 0.15],
    // tangan kanan ke mulut saat menggigit (tertutup tangan raksasa)
    upperarm_r: [bite * 1.3 + think * 1.15 + squish * 0.8 + hug * 0.7, 0, 0],
    lowerarm_r: [bite * 0.6 + think * 0.6 + squish * 0.4 + hug * 0.2, 0, 0],
    upperarm_l: [squish * 0.8 + hug * 0.7, 0, wave * 1.75],
    lowerarm_l: [-wave * 1.05 + squish * 0.1, 0, 0],
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

const LIGHTS = Array.from({ length: 11 }, (_, i) => [-2.4 + i * 0.48, 3.9 - Math.sin((i / 10) * Math.PI) * 0.35] as const);
const BULB_COLORS = ["#FFD400", "#ff8fb0", "#7fe3ff", "#9dff8a"];

const Room: React.FC<{ on: number }> = ({ on }) => {
  const wall = new THREE.Color("#2a2550").lerp(new THREE.Color("#cfe6ff"), on);
  const floor = new THREE.Color("#3a2f4f").lerp(new THREE.Color("#c99c6e"), on);
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
      {/* lampu tumbler warna-warni (statis) */}
      {LIGHTS.map(([x, y], i) => (
        <mesh key={i} position={[x, y, -1.65]}>
          <sphereGeometry args={[0.055, 12, 10]} />
          <meshStandardMaterial color={BULB_COLORS[i % 4]} emissive={BULB_COLORS[i % 4]} emissiveIntensity={0.9 - 0.5 * on} />
        </mesh>
      ))}
      {/* poster dino + stiker @day.one.eight */}
      <group position={[-1.3, 2.95, -1.66]} rotation={[0, 0, 0.04]}>
        <mesh>
          <boxGeometry args={[0.95, 1.15, 0.02]} />
          <meshStandardMaterial color="#9dff8a" />
        </mesh>
        <mesh position={[0, 0.12, 0.015]}>
          <circleGeometry args={[0.3, 24]} />
          <meshStandardMaterial color="#5cc56b" />
        </mesh>
        {[-0.12, 0.02, 0.15].map((x, i) => (
          <mesh key={i} position={[x, 0.42 - Math.abs(x) * 0.3, 0.02]} rotation={[0, 0, 0]}>
            <coneGeometry args={[0.05, 0.12, 12]} />
            <meshStandardMaterial color="#ff9f1a" />
          </mesh>
        ))}
        <HandleDecal position={[0, -0.36, 0.015]} width={0.8} />
      </group>
      {/* papan kecil untuk "mikir keras" */}
      <group position={[1.35, 3.05, -1.62]}>
        <mesh>
          <boxGeometry args={[1.4, 0.95, 0.05]} />
          <meshStandardMaterial color="#2f4a3a" />
        </mesh>
        {[
          [-0.35, 0.22, 0.4],
          [0.05, 0.22, 0.25],
          [-0.2, -0.02, 0.6],
          [0.25, -0.22, 0.35],
        ].map(([x, y, len], i) => (
          <mesh key={i} position={[x, y, 0.03]}>
            <boxGeometry args={[len, 0.03, 0.005]} />
            <meshStandardMaterial color="#f4f1ea" />
          </mesh>
        ))}
      </group>
      {/* rak + boneka dino */}
      <group position={[1.45, 1.9, -1.45]}>
        <mesh>
          <boxGeometry args={[1.1, 0.06, 0.35]} />
          <meshStandardMaterial color="#8a5a3a" />
        </mesh>
        <group position={[-0.2, 0.2, 0]}>
          <mesh scale={[1, 1.1, 0.9]}>
            <sphereGeometry args={[0.17, 18, 14]} />
            <meshStandardMaterial color="#5cc56b" />
          </mesh>
          <mesh position={[0, 0.2, 0.04]}>
            <sphereGeometry args={[0.12, 16, 12]} />
            <meshStandardMaterial color="#5cc56b" />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.045, 0.23, 0.14]}>
              <sphereGeometry args={[0.02, 8, 6]} />
              <meshStandardMaterial color="#1b1b1f" />
            </mesh>
          ))}
        </group>
        {[0.15, 0.32].map((x, i) => (
          <mesh key={i} position={[x, 0.15, 0]}>
            <boxGeometry args={[0.1, 0.24, 0.2]} />
            <meshStandardMaterial color={i ? "#ff8fb0" : "#7fe3ff"} />
          </mesh>
        ))}
      </group>
      {/* kursi */}
      <mesh position={[0, 0.8, -0.15]}>
        <boxGeometry args={[0.95, 0.08, 0.85]} />
        <meshStandardMaterial color="#ff8fb0" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.35, -0.62]} rotation={[-0.15, 0, 0]}>
        <boxGeometry args={[0.95, 0.95, 0.08]} />
        <meshStandardMaterial color="#ff8fb0" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.4, -0.15]}>
        <cylinderGeometry args={[0.05, 0.05, 0.8, 10]} />
        <meshStandardMaterial color="#9aa0aa" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* meja + panel depan berstiker */}
      <mesh position={[0, TABLE_TOP - 0.04, DESK_Z]}>
        <boxGeometry args={[2.4, 0.08, 0.95]} />
        <meshStandardMaterial color="#f4f1ea" roughness={0.5} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 1.1, (TABLE_TOP - 0.08) / 2, DESK_Z]}>
          <boxGeometry args={[0.08, TABLE_TOP - 0.08, 0.85]} />
          <meshStandardMaterial color="#d9d4ca" roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, TABLE_TOP - 0.2, DESK_Z + 0.44]}>
        <boxGeometry args={[2.2, 0.26, 0.04]} />
        <meshStandardMaterial color="#7fe3ff" roughness={0.6} />
      </mesh>
      <HandleDecal position={[0.45, TABLE_TOP - 0.2, DESK_Z + 0.465]} width={0.62} />
      {/* lampu tidur bintang */}
      <group position={[-0.9, TABLE_TOP, DESK_Z - 0.15]}>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.1, 0.12, 0.1, 20]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0.28, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.06, 5]} />
          <meshStandardMaterial color="#FFD400" emissive="#ffb000" emissiveIntensity={0.7} />
        </mesh>
      </group>
    </group>
  );
};

/* ------------------------------- props ------------------------------- */

/** HP berdiri di meja menghadap si biru: layar horor menyala di hook */
const Phone: React.FC<{ t: number }> = ({ t }) => {
  const lit = horrorAt(t);
  return (
    <group position={[-0.3, TABLE_TOP, DESK_Z + 0.1]} rotation={[-0.3, Math.PI + 0.25, 0]}>
      <mesh position={[0, 0.16, 0]}>
        <boxGeometry args={[0.18, 0.32, 0.02]} />
        <meshStandardMaterial color="#1b1b1f" />
      </mesh>
      <mesh position={[0, 0.16, 0.011]}>
        <planeGeometry args={[0.16, 0.29]} />
        <meshStandardMaterial color={lit > 0.5 ? "#7a1020" : "#0d0f18"} emissive="#ff2a40" emissiveIntensity={lit * 0.8} />
      </mesh>
    </group>
  );
};

/** squishy dino di meja: diremas sekali saat "squishy" */
const Squishy: React.FC<{ t: number }> = ({ t }) => {
  const vis = popIn(t, BEATS.tick3 - 0.3, END("tips"));
  if (vis <= 0) return null;
  const sq = hold(t, BEATS.tick3, BEATS.tick3 + 0.25, 0.08, 0.3);
  return (
    <group position={[0.55, TABLE_TOP, DESK_Z + 0.15]} scale={vis}>
      <group scale={[1 + 0.35 * sq, 1 - 0.45 * sq, 1 + 0.35 * sq]}>
        <mesh position={[0, 0.12, 0]}>
          <sphereGeometry args={[0.13, 20, 16]} />
          <meshStandardMaterial color="#9dff8a" roughness={0.4} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.045, 0.16, 0.12]}>
            <sphereGeometry args={[0.018, 8, 6]} />
            <meshStandardMaterial color="#1b1b1f" />
          </mesh>
        ))}
        <mesh position={[0, 0.27, -0.02]}>
          <coneGeometry args={[0.035, 0.07, 10]} />
          <meshStandardMaterial color="#ff9f1a" />
        </mesh>
      </group>
    </group>
  );
};

/** kuman lucu 3D di atas kuku (macro "sarang kuman"): pop satu per satu, melambai sekali */
const Germs: React.FC<{ t: number }> = ({ t }) => {
  if (t < BEATS.germs - 0.1 || t > END("bahaya")) return null;
  const cols = ["#9dff8a", "#ff8fb0", "#7fe3ff", "#FFD400", "#b38bff"];
  return (
    <group position={GERM_NAIL}>
      {cols.map((c, i) => {
        const at = BEATS.germs + i * 0.12;
        const s = popIn(t, at, END("bahaya"));
        if (s <= 0) return null;
        const a = (i / cols.length) * Math.PI * 2;
        const hop = wiggle(t, at + 0.35, 0.6, 1) * 0.006;
        return (
          <group key={i} position={[Math.cos(a) * 0.022, Math.sin(a) * 0.024 + hop, 0.012 + rnd(i) * 0.004]} scale={s}>
            <mesh>
              <sphereGeometry args={[0.0085, 12, 10]} />
              <meshStandardMaterial color={c} roughness={0.4} />
            </mesh>
            {[-1, 1].map((k) => (
              <mesh key={k} position={[k * 0.003, 0.002, 0.008]}>
                <sphereGeometry args={[0.0014, 6, 4]} />
                <meshStandardMaterial color="#1b1b1f" />
              </mesh>
            ))}
            {[0, 1, 2, 3].map((k) => (
              <mesh key={`s${k}`} position={[Math.cos(k * 1.6) * 0.0095, Math.sin(k * 1.6) * 0.0095, 0]}>
                <sphereGeometry args={[0.0018, 6, 4]} />
                <meshStandardMaterial color={c} />
              </mesh>
            ))}
          </group>
        );
      })}
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
export const headScreen = (t: number) => toScreen(t, [0, 3.05, 0.3]);
export const mouthScreen = (t: number) => toScreen(t, MOUTH);

/* -------------------------------- scene ------------------------------- */

export const Scene3D: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const cam = cameraAt(t);
  const on = lightsAt(t);
  const night = 1 - on;
  const horror = horrorAt(t);
  return (
    <ThreeCanvas width={width} height={height} camera={{ fov: FOV, position: [0, 2.6, 7.8] }}>
      <Camera pose={cam} />
      <ambientLight intensity={0.35 + 0.5 * on} color={on > 0.5 ? "#ffffff" : "#a99cff"} />
      <pointLight position={[-0.8, 2.0, 0.9]} intensity={4.5 * night + 1} distance={6} color="#ffd27a" />
      <pointLight position={[-0.25, 1.7, 1.0]} intensity={6 * horror} distance={3} color="#ff4458" />
      <directionalLight position={[-2, 4, -4]} intensity={1.2 * night + 0.5} color="#8f7dff" />
      <directionalLight position={[-3, 5, 4]} intensity={0.6 + 1.8 * on} color="#fff1dc" />
      <directionalLight position={[3, 3, 5]} intensity={0.5 + 0.7 * on} color="#ffffff" />
      <Room on={on} />
      <SiBiru t={t} />
      <GiantHand t={t} />
      <Phone t={t} />
      <Squishy t={t} />
      <Germs t={t} />
    </ThreeCanvas>
  );
};
