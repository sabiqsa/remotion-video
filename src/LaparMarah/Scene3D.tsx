// Scene 3D "kenapa lapar gampang marah?" — si biru pegawai kantoran di meja kerja jam 13.30,
// belum makan siang. Perut keroncongan (cincin bunyi), marah 💢 + uap kepala, jantung berdebar
// (hormon stres), kalender meja 1 → 21 hari, kotak bekal dibuka & onigiri digigit.
// Macro zoom in/out ke wajah, kepala, kalender, dan gigitan pada ketukan. Gerak diskret per ketukan.

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
import { ANGER, BEATS, GROWLS, STEAMS, ZoomTarget, ZOOMS } from "./beats";
import { END, sceneById, SceneId, SCENES } from "./script";

const TABLE_TOP = 1.2;
const DESK_Z = 0.78;
const CHAR_SCALE = 1.75;
const WARDROBE: Wardrobe = { hair: "side", outfit: "shirt", accessories: [] };
const COLORS = { pants: "#2b2f3a", shoes: "#3a2a22" };

type V3 = [number, number, number];
/** mulut si biru (perkiraan dunia) */
export const MOUTH: V3 = [0.125, 2.215, 0.49];
/** pusat wajah & kepala */
const FACE: V3 = [0.12, 2.32, 0.42];
const HEAD: V3 = [0.12, 2.5, 0.25];
/** perut & dada (di atas meja) */
export const BELLY: V3 = [0.1, 1.42, 0.38];
export const CHEST: V3 = [0.12, 1.78, 0.42];
/** kotak bekal, onigiri, kalender meja, laptop */
const LUNCH: V3 = [0.48, TABLE_TOP, DESK_Z - 0.08];
const ONI_REST: V3 = [LUNCH[0], LUNCH[1] + 0.13, LUNCH[2]];
const ONI_HELD: V3 = [MOUTH[0] + 0.06, MOUTH[1] - 0.13, MOUTH[2] + 0.27];
export const CAL: V3 = [0.95, TABLE_TOP, DESK_Z + 0.08];
export const LAPTOP: V3 = [-0.52, TABLE_TOP, DESK_Z - 0.02];

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
/** satu denyut (0 → 1 → 0) */
const punch = (t: number, at: number, dur = 0.25) => {
  const u = pr(t, at, dur, (v) => v);
  return u <= 0 || u >= 1 ? 0 : Math.sin(u * Math.PI);
};
const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

/** 0..1 seberapa marah */
export const angerAt = (t: number) => ANGER.reduce((m, [a, b, k]) => Math.max(m, hold(t, a, b, 0.12, 0.35) * k), 0);
/** 0..1 memegangi perut (keroncongan) */
const holdBellyAt = (t: number) => hold(t, BEATS.growl1 - 0.15, END("ehem") - 0.1, 0.3, 0.3);
/** onigiri: diangkat ke mulut di twist */
const oniUpAt = (t: number) => hold(t, BEATS.open + 0.35, END("twist") - 0.05, 0.4, 0.35);
export const oniPos = (t: number): V3 => lerp3(ONI_REST, ONI_HELD, oniUpAt(t));
/** jantung berdebar (hormon stres) */
const HEARTBEATS = [BEATS.adren + 0.35, BEATS.adren + 0.75, BEATS.snap, BEATS.snap + 0.4];

/* ------------------------------- kamera ------------------------------- */

type Pose = { x: number; y: number; z: number; lx: number; ly: number; lz: number };
const P = (x: number, y: number, z: number, ly: number, lx = 0, lz = 0.3): Pose => ({ x, y, z, lx, ly, lz });
const POSES: Record<SceneId, Pose> = {
  hook: P(0.5, 2.4, 5.0, 2.05),
  ehem: P(-0.7, 2.3, 5.4, 1.95),
  p1: P(0.6, 2.5, 5.2, 2.05),
  p2: P(-0.5, 2.3, 4.9, 1.95),
  p3: P(1.1, 2.35, 5.3, 1.95, 0.35),
  twist: P(0.4, 2.45, 5.2, 2.0),
  tips: P(-0.6, 2.55, 5.8, 2.0),
  komen: P(0, 2.5, 6.0, 2.0),
};
const macroPose = (target: ZoomTarget, t: number): Pose => {
  const p: V3 =
    target === "face"
      ? FACE
      : target === "head"
        ? HEAD
        : target === "calendar"
          ? [CAL[0], CAL[1] + 0.16, CAL[2]]
          : lerp3(MOUTH, oniPos(t), 0.5);
  const d = target === "face" ? 1.75 : target === "head" ? 2.6 : target === "calendar" ? 1.05 : 1.55;
  const up = target === "calendar" ? 0.12 : 0.03;
  return { x: p[0] + (target === "calendar" ? -0.12 : 0.04), y: p[1] + up, z: p[2] + d, lx: p[0], ly: p[1] - (target === "head" ? 0.22 : 0), lz: p[2] };
};

export const macroAt = (t: number) =>
  ZOOMS.reduce((m, [a, b]) => Math.max(m, Math.min(pr(t, a, 0.3, EASE.inOut), 1 - pr(t, b, 0.45, EASE.inOut))), 0);
const zoomTarget = (t: number) =>
  ZOOMS.reduce((best, cur) => (Math.abs(t - (cur[0] + cur[1]) / 2) < Math.abs(t - (best[0] + best[1]) / 2) ? cur : best))[2];

const SHAKES = [
  { at: BEATS.angry0, amp: 0.035 },
  { at: BEATS.snap, amp: 0.06 },
  { at: BEATS.adren + 0.35, amp: 0.015 },
  { at: BEATS.adren + 0.75, amp: 0.015 },
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

const BLINKS = [3.4, 8.6, 13.1, 19.4, 24.2, 29.8, 35.6, 40.3, 43.9];

const faceAt = (t: number): FaceState => {
  const blink = BLINKS.some((b) => Math.abs(t - b) < 0.05) ? 0.1 : 1;
  const angry = angerAt(t);
  const sheepish = hold(t, BEATS.calm0 + 0.1, END("hook"), 0.25, 0.2);
  const hungry = Math.max(holdBellyAt(t), hold(t, BEATS.growl0, BEATS.angry0 - 0.05, 0.15, 0.1));
  const dizzy = hold(t, BEATS.brain, BEATS.weak - 0.1, 0.3, 0.2);
  const tense = hold(t, BEATS.cort, BEATS.snap - 0.05, 0.25, 0.1);
  const look = hold(t, BEATS.study, BEATS.data - 0.1, 0.25, 0.2);
  const chew = punch(t, BEATS.bite, 0.18);
  const happy = Math.max(hold(t, BEATS.bite + 0.2, END("twist"), 0.25, 0.2), pr(t, S("tips"), 0.3));
  return {
    eyeOpen: Math.max(0.06, Math.min(blink, 1 - dizzy * 0.45 - angry * 0.12 - happy * 0.15)),
    angry,
    smile: Math.max(sheepish * 0.7, happy, 0.3 * (1 - angry) * (1 - hungry) * (1 - tense)),
    frown: Math.max(angry * 0.9, hungry * 0.6, tense * 0.4),
    open: Math.max(chew * 0.6, look * 0.15),
    sad: Math.max(hungry * 0.7, dizzy * 0.5),
    sleepy: dizzy * 0.6,
    surprise: Math.max(tense * 0.35, look * 0.3),
    blush: Math.max(happy * 0.5, sheepish * 0.6),
    sweat: Math.max(sheepish * 0.8, tense * 0.6),
  };
};

const SiBiru: React.FC<{ t: number }> = ({ t }) => {
  const angry = angerAt(t);
  const belly = holdBellyAt(t);
  const oni = oniUpAt(t);
  const dizzy = hold(t, BEATS.brain, BEATS.weak - 0.1, 0.3, 0.2);
  const lookCal = hold(t, BEATS.study, BEATS.data - 0.1, 0.3, 0.3);
  const snap = hold(t, BEATS.snap - 0.05, END("p2") - 0.1, 0.08, 0.3);
  const huff = wiggle(t, BEATS.angry0, 0.45, 2) + wiggle(t, BEATS.snap, 0.45, 2);
  const chew = punch(t, BEATS.bite, 0.18);
  const wave = hold(t, BEATS.teamB, END("komen") - 0.1, 0.3, 0.3);

  const bones: BoneOverride = {
    spine_01: [angry * 0.06 - snap * 0.1 + belly * 0.1, 0, 0],
    spine_02: [angry * 0.05 + belly * 0.12 + dizzy * 0.05, lookCal * 0.15, 0],
    Head: [-angry * 0.08 + dizzy * 0.22 + belly * 0.15 + chew * 0.06, lookCal * 0.5 + huff * 0.12, dizzy * 0.12],
    // pegang perut (dua tangan) / tangan kanan memegang onigiri
    upperarm_r: [belly * 0.05 + oni * 1.25, 0, 0],
    lowerarm_r: [belly * 0.75 + oni * 0.75, 0, 0],
    upperarm_l: [belly * 0.05, 0, wave * 1.75],
    lowerarm_l: [belly * 0.75 - wave * 1.05, 0, 0],
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

/* ------------------------------- teks di 3D ------------------------------- */

/** bidang bertekstur kanvas (angka kalender, jam) */
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

/* ------------------------------- kantor ------------------------------- */

const Office: React.FC<{ t: number }> = ({ t }) => {
  const clockWig = wiggle(t, BEATS.tick2, 0.5, 2) * 0.15;
  return (
    <group>
      {/* dinding biru keabu + lantai karpet */}
      <mesh position={[0, 3, -1.7]}>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial color="#dfe7ef" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.55, -1.69]}>
        <planeGeometry args={[12, 1.1]} />
        <meshStandardMaterial color="#b9c6d6" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0, 1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial color="#6f7d91" roughness={0.95} />
      </mesh>
      {/* jendela kiri: gedung kota siang */}
      <group position={[-1.75, 3.0, -1.66]}>
        <mesh>
          <boxGeometry args={[1.2, 1.05, 0.04]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0, 0.025]}>
          <planeGeometry args={[1.08, 0.93]} />
          <meshStandardMaterial color="#a8dcff" emissive="#a8dcff" emissiveIntensity={0.35} />
        </mesh>
        {[
          [-0.38, 0.5, "#8aa1bd"],
          [-0.14, 0.72, "#7189a8"],
          [0.1, 0.42, "#94a9c2"],
          [0.34, 0.62, "#6d84a3"],
        ].map(([x, h, c], i) => (
          <mesh key={i} position={[x as number, -0.465 + (h as number) / 2, 0.03]}>
            <boxGeometry args={[0.2, h as number, 0.005]} />
            <meshStandardMaterial color={c as string} />
          </mesh>
        ))}
        <mesh position={[0, 0, 0.035]}>
          <boxGeometry args={[0.03, 0.95, 0.02]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>
      {/* jam dinding 13.30 */}
      <group position={[-0.55, 3.45, -1.64]} rotation={[0, 0, clockWig]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.05, 40]} />
          <meshStandardMaterial color="#2f3b52" />
        </mesh>
        <mesh position={[0, 0, 0.03]}>
          <circleGeometry args={[0.26, 40]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.sin(a) * 0.22, Math.cos(a) * 0.22, 0.035]}>
              <boxGeometry args={[0.015, 0.04, 0.005]} />
              <meshStandardMaterial color="#2f3b52" />
            </mesh>
          );
        })}
        {/* jarum jam (antara 1 & 2) dan menit (angka 6) */}
        <group rotation={[0, 0, -(1.5 / 12) * Math.PI * 2]}>
          <mesh position={[0, 0.07, 0.04]}>
            <boxGeometry args={[0.025, 0.14, 0.006]} />
            <meshStandardMaterial color="#2f3b52" />
          </mesh>
        </group>
        <group rotation={[0, 0, Math.PI]}>
          <mesh position={[0, 0.1, 0.045]}>
            <boxGeometry args={[0.016, 0.2, 0.006]} />
            <meshStandardMaterial color="#e3263b" />
          </mesh>
        </group>
      </group>
      {/* papan tulis berstiker @day.one.eight */}
      <group position={[1.45, 3.05, -1.64]} rotation={[0, 0, 0.02]}>
        <mesh>
          <boxGeometry args={[1.25, 0.95, 0.04]} />
          <meshStandardMaterial color="#c9ced6" />
        </mesh>
        <mesh position={[0, 0, 0.022]}>
          <planeGeometry args={[1.15, 0.85]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        {[
          [-0.2, 0.28, 0.6, "#2f7cf6"],
          [-0.14, 0.14, 0.72, "#2f3b52"],
          [-0.26, 0.0, 0.48, "#e3263b"],
        ].map(([x, y, len, c], i) => (
          <mesh key={i} position={[x as number, y as number, 0.025]}>
            <boxGeometry args={[len as number, 0.03, 0.004]} />
            <meshStandardMaterial color={c as string} />
          </mesh>
        ))}
        <HandleDecal position={[0, -0.27, 0.026]} width={0.85} />
      </group>
      {/* kursi kantor */}
      <mesh position={[0, 0.8, -0.15]}>
        <boxGeometry args={[0.95, 0.1, 0.85]} />
        <meshStandardMaterial color="#2f3440" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.45, -0.64]} rotation={[-0.12, 0, 0]}>
        <boxGeometry args={[0.9, 1.15, 0.1]} />
        <meshStandardMaterial color="#2f3440" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.4, -0.15]}>
        <cylinderGeometry args={[0.05, 0.05, 0.8, 10]} />
        <meshStandardMaterial color="#9aa0aa" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* meja kerja kayu + panel depan berstiker */}
      <mesh position={[0, TABLE_TOP - 0.04, DESK_Z]}>
        <boxGeometry args={[2.6, 0.08, 0.95]} />
        <meshStandardMaterial color="#c89b6d" roughness={0.6} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 1.2, (TABLE_TOP - 0.08) / 2, DESK_Z]}>
          <boxGeometry args={[0.08, TABLE_TOP - 0.08, 0.85]} />
          <meshStandardMaterial color="#8a6a4a" roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, TABLE_TOP - 0.25, DESK_Z + 0.44]}>
        <boxGeometry args={[2.4, 0.36, 0.04]} />
        <meshStandardMaterial color="#2f3b52" roughness={0.6} />
      </mesh>
      <HandleDecal position={[-0.5, TABLE_TOP - 0.25, DESK_Z + 0.465]} width={0.62} />
      {/* tanaman pot di ujung kiri meja */}
      <group position={[-1.05, TABLE_TOP, DESK_Z - 0.2]}>
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.1, 0.08, 0.2, 20]} />
          <meshStandardMaterial color="#e3763b" />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.06, 0.32, Math.sin(a) * 0.06]} rotation={[Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4]}>
              <sphereGeometry args={[0.08, 12, 10]} />
              <meshStandardMaterial color="#4caf63" roughness={0.8} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
};

/* ------------------------------- props ------------------------------- */

/** laptop: layar menghadap si biru, punggung tutup (dengan stiker) menghadap kamera */
const Laptop: React.FC<{ t: number }> = ({ t }) => {
  const ping = punch(t, BEATS.angry0 - 0.55, 0.3);
  return (
    <group position={LAPTOP} rotation={[0, 0.35, 0]}>
      <mesh position={[0, 0.012, 0]}>
        <boxGeometry args={[0.5, 0.024, 0.34]} />
        <meshStandardMaterial color="#c3c8d1" metalness={0.4} roughness={0.35} />
      </mesh>
      <group position={[0, 0.024, 0.16]} rotation={[0.25, 0, 0]}>
        <mesh position={[0, 0.165, 0]}>
          <boxGeometry args={[0.5, 0.33, 0.018]} />
          <meshStandardMaterial color="#c3c8d1" metalness={0.4} roughness={0.35} />
        </mesh>
        {/* layar (sisi belakang, menghadap si biru) menyala saat notifikasi */}
        <mesh position={[0, 0.165, -0.0095]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.46, 0.29]} />
          <meshStandardMaterial color="#9fd0ff" emissive="#9fd0ff" emissiveIntensity={0.4 + ping * 1.2} />
        </mesh>
        <HandleDecal position={[0, 0.165, 0.0095]} width={0.36} />
      </group>
    </group>
  );
};

/** kotak bekal: tutup terbuka di twist; nasi, telur, brokoli, onigiri */
const Lunchbox: React.FC<{ t: number }> = ({ t }) => {
  const open = pr(t, BEATS.open, 0.4, EASE.back);
  return (
    <group position={LUNCH}>
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[0.36, 0.1, 0.26]} />
        <meshStandardMaterial color="#ff8fb0" roughness={0.5} />
      </mesh>
      {/* isi */}
      <mesh position={[-0.08, 0.1, 0]}>
        <boxGeometry args={[0.16, 0.02, 0.22]} />
        <meshStandardMaterial color="#fbfbf7" roughness={0.9} />
      </mesh>
      <mesh position={[0.1, 0.105, -0.05]} scale={[1, 0.45, 1]}>
        <sphereGeometry args={[0.045, 14, 10]} />
        <meshStandardMaterial color="#ffd23d" />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0.07 + i * 0.03, 0.115, 0.06]}>
          <sphereGeometry args={[0.025, 10, 8]} />
          <meshStandardMaterial color="#3e9b4f" roughness={0.9} />
        </mesh>
      ))}
      {/* tutup, berengsel di sisi belakang */}
      <group position={[0, 0.1, -0.13]} rotation={[-open * 1.9, 0, 0]}>
        <mesh position={[0, 0.02, 0.13]}>
          <boxGeometry args={[0.37, 0.04, 0.27]} />
          <meshStandardMaterial color="#2f7cf6" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.045, 0.13]}>
          <boxGeometry args={[0.2, 0.012, 0.05]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>
    </group>
  );
};

/** onigiri segitiga dengan nori; diangkat ke mulut lalu digigit (mengecil sekali) */
const Onigiri: React.FC<{ t: number }> = ({ t }) => {
  if (t < BEATS.open + 0.2) return null;
  const p = oniPos(t);
  const bitten = (t >= BEATS.bite ? 0.82 : 1) * 1.4;
  const bump = 1 + punch(t, BEATS.bite, 0.2) * 0.12;
  return (
    <group position={p} rotation={[0, 0, 0]} scale={bitten * bump}>
      <mesh rotation={[Math.PI / 2, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.07, 0.07, 0.045, 3]} />
        <meshStandardMaterial color="#fbfbf7" roughness={0.9} />
      </mesh>
      <mesh position={[0, -0.035, 0.024]}>
        <boxGeometry args={[0.06, 0.05, 0.004]} />
        <meshStandardMaterial color="#1f2b22" />
      </mesh>
    </group>
  );
};

/** kalender meja (tenda): halaman "1" membalik ke atas → "21" */
const Calendar: React.FC<{ t: number }> = ({ t }) => {
  const vis = popIn(t, BEATS.study, END("p3") + 0.2);
  if (vis <= 0) return null;
  const flip = pr(t, BEATS.days, 0.4, EASE.inOut);
  return (
    <group position={CAL} scale={vis} rotation={[0, -0.25, 0]}>
      {/* kaki tenda */}
      <mesh position={[0, 0.13, -0.06]} rotation={[0.42, 0, 0]}>
        <boxGeometry args={[0.3, 0.3, 0.01]} />
        <meshStandardMaterial color="#2f3b52" />
      </mesh>
      <group position={[0, 0.27, 0]} rotation={[-0.42, 0, 0]}>
        {/* halaman bawah: hari ke-21 */}
        <TextPlane text="21" w={0.28} h={0.22} position={[0, -0.13, 0.008]} px={230} />
        <mesh position={[0, -0.025, 0.009]}>
          <planeGeometry args={[0.28, 0.05]} />
          <meshStandardMaterial color="#e3263b" />
        </mesh>
        {/* halaman atas: hari ke-1, membalik ke belakang */}
        {flip < 0.98 && (
          <group rotation={[flip * Math.PI * 0.95, 0, 0]}>
            <TextPlane text="1" w={0.28} h={0.22} position={[0, -0.13, 0.014]} px={230} fg="#2f3b52" />
          </group>
        )}
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[0.3, 0.02, 0.02]} />
          <meshStandardMaterial color="#9aa0aa" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
};

/** cincin bunyi keroncongan dari perut (3 cincin, sekali per keroncongan) */
const GrowlRings: React.FC<{ t: number }> = ({ t }) => (
  <>
    {GROWLS.flatMap((g, gi) =>
      [0, 1, 2].map((i) => {
        const a = g + i * 0.18;
        if (t < a || t > a + 0.6) return null;
        const u = pr(t, a, 0.6);
        return (
          <mesh key={`${gi}-${i}`} position={[BELLY[0], BELLY[1], BELLY[2] + 0.12]} scale={0.08 + u * 0.3}>
            <torusGeometry args={[1, 0.06, 8, 32]} />
            <meshBasicMaterial color="#FFD400" transparent opacity={(1 - u) * 0.9} />
          </mesh>
        );
      }),
    )}
  </>
);

/** uap marah: kepulan putih naik dari atas kepala, sekali per ledakan */
const AngerSteam: React.FC<{ t: number }> = ({ t }) => (
  <>
    {STEAMS.flatMap((s, si) =>
      [-1, 1].flatMap((side) =>
        [0, 1, 2].map((i) => {
          const a = s + i * 0.1;
          if (t < a || t > a + 0.9) return null;
          const u = pr(t, a, 0.9);
          const x = HEAD[0] + side * (0.32 + u * 0.18 + i * 0.03);
          const y = HEAD[1] + 0.25 + u * 0.45 + i * 0.05;
          return (
            <mesh key={`${si}-${side}-${i}`} position={[x, y, HEAD[2] + 0.1]} scale={0.05 + u * 0.08}>
              <sphereGeometry args={[1, 12, 10]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={(1 - u) * 0.9} roughness={1} />
            </mesh>
          );
        }),
      ),
    )}
  </>
);

/** jantung merah di depan dada: pop di "kortisol", berdebar di ketukan */
const Heart: React.FC<{ t: number }> = ({ t }) => {
  const vis = popIn(t, BEATS.cort - 0.05, END("p2"));
  if (vis <= 0) return null;
  const beat = HEARTBEATS.reduce((m, b) => Math.max(m, punch(t, b, 0.22)), 0);
  const s = vis * (1 + beat * 0.3) * 0.08;
  return (
    <group position={[CHEST[0] - 0.02, CHEST[1], CHEST[2] + 0.2]} scale={s}>
      {[-1, 1].map((k) => (
        <mesh key={k} position={[k * 0.5, 0.3, 0]}>
          <sphereGeometry args={[0.62, 18, 14]} />
          <meshStandardMaterial color="#ff3b52" emissive="#ff3b52" emissiveIntensity={0.25 + beat * 0.6} />
        </mesh>
      ))}
      <mesh position={[0, -0.4, 0]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[1.0, 1.4, 4]} />
        <meshStandardMaterial color="#ff3b52" emissive="#ff3b52" emissiveIntensity={0.25 + beat * 0.6} />
      </mesh>
    </group>
  );
};

/** tips: pisang di meja (camilan) */
const Banana: React.FC<{ t: number }> = ({ t }) => {
  const vis = popIn(t, BEATS.tick1 - 0.15, END("tips") + 1);
  if (vis <= 0) return null;
  const spin = (1 - pr(t, BEATS.tick1 - 0.15, 0.45)) * Math.PI;
  return (
    <group position={[0.2, TABLE_TOP + 0.04, DESK_Z + 0.2]} scale={vis} rotation={[Math.PI / 2, 0, spin + 0.4]}>
      <mesh>
        <torusGeometry args={[0.12, 0.035, 10, 24, Math.PI * 0.7]} />
        <meshStandardMaterial color="#ffd23d" roughness={0.6} />
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
export const faceScreen = (t: number) => toScreen(t, FACE);
export const bellyScreen = (t: number) => toScreen(t, BELLY);
export const chestScreen = (t: number) => toScreen(t, CHEST);
export const laptopScreen = (t: number) => toScreen(t, [LAPTOP[0], LAPTOP[1] + 0.35, LAPTOP[2]]);
export const calScreen = (t: number) => toScreen(t, [CAL[0], CAL[1] + 0.3, CAL[2]]);
export const oniScreen = (t: number) => toScreen(t, oniPos(t));

/* -------------------------------- scene ------------------------------- */

export const Scene3D: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const cam = cameraAt(t);
  return (
    <ThreeCanvas width={width} height={height} camera={{ fov: FOV, position: [0, 2.6, 7.8] }}>
      <Camera pose={cam} />
      <ambientLight intensity={0.75} color="#f2f6ff" />
      <pointLight position={[0.1, 3.5, 0.8]} intensity={4} distance={5} color="#fff4dc" />
      <directionalLight position={[-3, 5, 4]} intensity={1.9} color="#fff7ea" />
      <directionalLight position={[3, 3, 5]} intensity={0.9} color="#ffffff" />
      <Office t={t} />
      <SiBiru t={t} />
      <Laptop t={t} />
      <Lunchbox t={t} />
      <Onigiri t={t} />
      <Calendar t={t} />
      <GrowlRings t={t} />
      <AngerSteam t={t} />
      <Heart t={t} />
      <Banana t={t} />
    </ThreeCanvas>
  );
};
