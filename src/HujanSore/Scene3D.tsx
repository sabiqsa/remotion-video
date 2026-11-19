// Scene 3D "kenapa hujan sering turun sore?" — si biru (rambut spiky, kaos biru, kacamata
// hitam) santai di halaman. "Si awan" = pegawai yang baru masuk kerja jam 3: muncul,
// tumbuh, numpuk, lalu tumpah. Semua gerak = aksi diskret pada ketukan narasi (BEATS);
// hujan turun sekali per kejadian lalu reda (bukan loop).

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
import { BEATS, RAINS } from "./beats";
import { END, sceneById, SceneId, SCENES } from "./script";

const TABLE_TOP = 1.2;
const CHAR_SCALE = 1.75;
const WARDROBE: Wardrobe = { hair: "spiky", outfit: "tee", accessories: ["sunglasses"] };

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
/** lompatan kecil (parabola) 0→1 selama `dur` */
const hop = (t: number, at: number, dur: number) => {
  const u = pr(t, at, dur, (v) => v);
  return u <= 0 || u >= 1 ? 0 : 4 * u * (1 - u);
};
/** angka acak deterministik 0..1 */
const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/* ------------------------------- kamera ------------------------------- */

type Pose = { x: number; y: number; z: number; look: number; lookZ?: number };
const POSES: Partial<Record<SceneId, Pose>> = {
  hook: { x: 0.6, y: 2.4, z: 5.6, look: 2.0 },
  kerja: { x: 1.1, y: 2.6, z: 5.4, look: 2.25 },
  promise: { x: -0.6, y: 2.4, z: 5.9, look: 1.95 },
  p1: { x: -0.9, y: 2.3, z: 6.2, look: 2.1 },
  p2: { x: 0.7, y: 2.4, z: 6.2, look: 2.2 },
  p3: { x: 0.2, y: 2.5, z: 6.6, look: 2.35 },
  data: { x: 0, y: 2.6, z: 6.6, look: 2.45 },
  tapi: { x: 0.9, y: 2.5, z: 5.9, look: 2.15 },
  tips: { x: -0.5, y: 2.5, z: 5.7, look: 2.1 },
  serius: { x: 0, y: 2.4, z: 6.0, look: 2.2 },
  komen: { x: 0, y: 2.5, z: 6.2, look: 2.0 },
};

const SHAKES = [
  { at: BEATS.pour0, amp: 0.08 },
  { at: BEATS.pour, amp: 0.08 },
  { at: BEATS.bolt, amp: 0.12 },
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

/* ------------------------------ langit ------------------------------ */

/** campuran langit 0..1: `grey` = mendung sore, `night` = malam. Berubah hanya pada ketukan. */
export const skyAt = (t: number) => {
  const grey = Math.max(
    hold(t, BEATS.pour0 - 0.25, S("promise"), 0.3, 0.35),
    hold(t, BEATS.full - 0.3, END("p3"), 0.4, 0.35),
    hold(t, S("serius"), END("serius"), 0.35, 0.35),
  );
  const night = hold(t, BEATS.malam - 0.1, END("tapi"), 0.35, 0.3);
  return { grey, night };
};

/* --------------------------- si biru (ekspresi) --------------------------- */

const BLINKS = [6.2, 11.8, 17.4, 24.9, 31.3, 37.6, 43.2];

const faceAt = (t: number): FaceState => {
  const blink = BLINKS.some((b) => Math.abs(t - b) < 0.05) ? 0.1 : 1;
  const chill = 1 - pr(t, BEATS.drip, 0.1);
  const heh = Math.max(hold(t, BEATS.drip, S("kerja") + 0.4, 0.1, 0.3), hold(t, BEATS.pour, END("p3"), 0.1, 0.3));
  const wet = Math.max(hold(t, BEATS.pour0, END("kerja"), 0.15, 0.4), hold(t, BEATS.pour, END("p3"), 0.15, 0.3));
  const annoyed = hold(t, BEATS.badge, END("kerja"), 0.2, 0.3);
  const hot = hold(t, BEATS.heat, END("p1"), 0.3, 0.3);
  const curious = hold(t, S("p2"), END("p2"), 0.3, 0.3);
  const ready = hold(t, BEATS.umbrella, END("tips"), 0.2, 0.3);
  const worry = hold(t, BEATS.serious, END("serius"), 0.3, 0.3);
  const happy = pr(t, S("komen"), 0.3);
  return {
    eyeOpen: Math.max(0.06, Math.min(blink, 1 - hot * 0.3)),
    smile: Math.max(0.8 * chill, 0.35 * (1 - heh) * (1 - annoyed) * (1 - worry), ready, happy, curious * 0.5),
    open: Math.max(heh * 0.9, curious * 0.3),
    surprise: heh,
    sad: Math.max(wet * 0.4, worry * 0.9),
    frown: Math.max(annoyed * 0.8, worry * 0.6),
    pale: worry * 0.5,
    blush: Math.max(hot, happy * 0.4),
    sweat: Math.max(wet, hot, worry * 0.6),
  };
};

const SiBiru: React.FC<{ t: number }> = ({ t }) => {
  const relax = 1 - pr(t, BEATS.drip - 0.05, 0.15);
  const lookUp = hold(t, BEATS.drip, BEATS.pour0 + 0.05, 0.1, 0.15);
  const flinch = Math.max(hold(t, BEATS.pour0, S("kerja") + 0.3, 0.12, 0.3), hold(t, BEATS.pour, END("p3") - 0.1, 0.12, 0.3));
  const umbrella = hold(t, BEATS.umbrella - 0.25, END("tips") - 0.1, 0.25, 0.25);
  const wave = hold(t, BEATS.teamB, END("komen") - 0.1, 0.3, 0.3);

  const lean = -relax * 0.18 + flinch * 0.22;
  const bones: BoneOverride = {
    spine_01: [lean * 0.4, 0, 0],
    spine_02: [lean * 0.4, 0, 0],
    spine_03: [lean * 0.3, 0, 0],
    Head: [-lookUp * 0.45 + flinch * 0.2, 0, relax * 0.12],
    upperarm_r: [umbrella * 1.25, 0, -umbrella * 0.2],
    lowerarm_r: [-umbrella * 0.6, 0, 0],
    upperarm_l: [flinch * 0.9, 0, wave * 1.75],
    lowerarm_l: [-wave * 1.05 - flinch * 0.6, 0, 0],
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

/* ------------------------------ si awan ------------------------------ */

type CloudMood = { smile: number; open: number; closed: number; sweat: number };
const PUFFS = [
  [0, 0, 0, 0.32],
  [-0.3, -0.06, 0, 0.24],
  [0.3, -0.05, 0, 0.25],
  [-0.15, 0.17, -0.05, 0.22],
  [0.16, 0.16, -0.05, 0.21],
];

const Cloud: React.FC<{ mood: CloudMood; grey: number; tiers: number; badge: number }> = ({ mood, grey, tiers, badge }) => {
  const c = new THREE.Color("#f6fbff").lerp(new THREE.Color("#6f7a8c"), grey);
  const face = tiers - 1; // wajah di tingkat paling bawah
  return (
    <group>
      {[0, 1, 2].map((k) => {
        const s = Math.max(0, Math.min(1, tiers - k));
        if (s <= 0.001) return null;
        return (
          <group key={k} position={[0, k * 0.42, -k * 0.05]} scale={s * (1 - k * 0.12)}>
            {PUFFS.map(([x, y, z, r], i) => (
              <mesh key={i} position={[x, y, z]}>
                <sphereGeometry args={[r, 24, 20]} />
                <meshStandardMaterial color={c} roughness={0.85} emissive="#cfe8ff" emissiveIntensity={0.12 * (1 - grey)} />
              </mesh>
            ))}
          </group>
        );
      })}
      <group position={[0, face >= 0 ? 0 : 0, 0]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.1, 0.04, 0.3]} scale={[1, Math.max(0.12, 1 - mood.closed), 0.6]}>
            <sphereGeometry args={[0.04, 14, 12]} />
            <meshStandardMaterial color="#1b1b1f" />
          </mesh>
        ))}
        {[-1, 1].map((s) => (
          <mesh key={`c${s}`} position={[s * 0.19, -0.04, 0.27]} scale={[1, 0.6, 0.4]}>
            <sphereGeometry args={[0.045, 12, 10]} />
            <meshStandardMaterial color="#ff9fb2" transparent opacity={0.8} />
          </mesh>
        ))}
        {mood.open > 0.3 ? (
          <mesh position={[0, -0.08, 0.31]} scale={[0.7, 0.5 + mood.open * 0.6, 0.4]}>
            <sphereGeometry args={[0.05, 14, 12]} />
            <meshStandardMaterial color="#5a1f22" />
          </mesh>
        ) : (
          <mesh position={[0, mood.smile >= 0 ? -0.06 : -0.1, 0.31]} rotation={[0, 0, mood.smile >= 0 ? Math.PI + 0.4 : 0.4]}>
            <torusGeometry args={[0.045, 0.012, 8, 16, Math.PI * 0.75]} />
            <meshStandardMaterial color="#5a1f22" />
          </mesh>
        )}
        {mood.sweat > 0.05 ? (
          <mesh position={[0.28, 0.2, 0.18]} scale={mood.sweat}>
            <sphereGeometry args={[0.04, 12, 10]} />
            <meshStandardMaterial color="#8fd3ff" transparent opacity={0.9} />
          </mesh>
        ) : null}
      </group>
      {/* kartu pegawai (ID card) */}
      {badge > 0.001 ? (
        <group position={[0.05, -0.36, 0.28]} scale={badge} rotation={[0.1, 0, -0.08]}>
          <mesh position={[0, 0.17, -0.02]}>
            <cylinderGeometry args={[0.006, 0.006, 0.3, 6]} />
            <meshStandardMaterial color="#e3263b" />
          </mesh>
          <mesh>
            <boxGeometry args={[0.22, 0.15, 0.015]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[-0.05, 0.01, 0.01]}>
            <boxGeometry args={[0.07, 0.08, 0.005]} />
            <meshStandardMaterial color="#8fd3ff" />
          </mesh>
          <mesh position={[0.05, 0.02, 0.01]}>
            <boxGeometry args={[0.08, 0.015, 0.005]} />
            <meshStandardMaterial color="#1b1b1f" />
          </mesh>
          <mesh position={[0.05, -0.02, 0.01]}>
            <boxGeometry args={[0.08, 0.015, 0.005]} />
            <meshStandardMaterial color="#FFD400" />
          </mesh>
        </group>
      ) : null}
    </group>
  );
};

/** Posisi, ukuran, warna & mood si awan sepanjang video (aksi diskret per ketukan). */
const cloudAt = (t: number) => {
  let x = 0.45;
  let y = 3.0;
  let z = 0.25;
  let vis = 0;
  let tiers = 1;
  let grey = 0;
  let badge = 0;
  let scale = 1;
  let mood: CloudMood = { smile: 0.5, open: 0, closed: 0, sweat: 0 };

  if (t >= BEATS.drip - 0.35 && t < END("kerja")) {
    // hook→kerja: meluncur masuk, mengguyur si biru, lalu pamer kartu absen
    const slide = pr(t, BEATS.drip - 0.35, 0.3, EASE.out);
    x = 2.4 - 1.95 * slide;
    vis = 1 - pr(t, END("kerja") - 0.15, 0.15, EASE.in);
    grey = 0.75 * pr(t, BEATS.pour0 - 0.2, 0.25) * (1 - pr(t, S("kerja") + 0.3, 0.3));
    mood = { smile: 0.2, open: 0, closed: 0.6, sweat: 0 };
    if (t >= BEATS.pour0) mood = { smile: 1, open: 0, closed: 0.85, sweat: 0 };
    if (t >= S("kerja")) {
      x = 0.62;
      y = 2.85;
      mood = { smile: 0.4, open: 0, closed: 0.55, sweat: 0 };
      badge = pr(t, BEATS.badge - 0.05, 0.3, EASE.back);
      y += 0.12 * hop(t, BEATS.badge - 0.05, 0.3);
    }
  } else if (t >= BEATS.condense - 0.1 && t < END("p3")) {
    // p2 lahir dari uap → p3 numpuk 3 tingkat → kepenuhan → tumpah
    x = 0.7;
    y = 2.95;
    z = 0.1;
    vis = pr(t, BEATS.condense - 0.1, 0.4, EASE.back) * (1 - pr(t, END("p3") - 0.15, 0.15, EASE.in));
    scale = t < S("p3") ? 0.7 : 0.7 + 0.3 * pr(t, S("p3") + 0.1, 0.35, EASE.back);
    tiers = 1 + pr(t, BEATS.stack1, 0.3, EASE.back) + pr(t, BEATS.stack2, 0.3, EASE.back);
    grey = 0.85 * pr(t, BEATS.laundry, 0.6) * (1 - 0.6 * pr(t, BEATS.pour + 0.6, 0.5));
    mood = { smile: 1, open: 0, closed: 0.5, sweat: 0 };
    if (t >= BEATS.stack1) mood = { smile: 0.3, open: 0, closed: 0, sweat: 0.6 };
    if (t >= BEATS.full) mood = { smile: -0.5, open: 1, closed: 0, sweat: 1 };
    if (t >= BEATS.pour + 0.3) mood = { smile: 1, open: 0, closed: 0.85, sweat: 0.3 };
    // tiap tingkat baru: memantul sekali; kepenuhan: menggembung
    const swell = pr(t, BEATS.full, 0.08) - pr(t, BEATS.full + 0.1, 0.35);
    scale *= 1 + 0.12 * swell;
  } else if (t >= S("tapi") + 0.25 && t < END("tapi")) {
    x = 0.95;
    y = 2.95;
    vis = popIn(t, S("tapi") + 0.25, END("tapi"));
    scale = 0.85;
    mood = { smile: 0.6, open: 0, closed: t >= BEATS.dini ? 0.85 : 0, sweat: 0 };
  } else if (t >= S("serius") + 0.1 && t < END("serius")) {
    x = 0.85;
    y = 3.05;
    vis = popIn(t, S("serius") + 0.1, END("serius"));
    grey = 1;
    scale = 1.1;
    mood = { smile: -0.6, open: 0, closed: 0, sweat: 0 };
  } else if (t >= S("komen") + 0.3) {
    x = 1.0;
    y = 2.95;
    vis = popIn(t, S("komen") + 0.3, END("komen"));
    scale = 0.85;
    mood = { smile: 1, open: 0, closed: t >= BEATS.teamB + 0.5 ? 0.8 : 0, sweat: 0 };
  }

  return { x, y, z, vis: Math.max(0, vis), tiers, grey, badge, scale, mood };
};

const SiAwan: React.FC<{ t: number; cam: Required<Pose> }> = ({ t, cam }) => {
  const c = cloudAt(t);
  if (c.vis <= 0.001) return null;
  const face = Math.atan2(cam.x - c.x, cam.z - c.z) * 0.8;
  return (
    <group position={[c.x, c.y, c.z]} rotation={[0, face, 0]} scale={c.vis * c.scale}>
      <Cloud mood={c.mood} grey={c.grey} tiers={c.tiers} badge={c.badge} />
    </group>
  );
};

/* --------------------------------- hujan --------------------------------- */

const DROPS = 46;
const FALL = 0.42;

/** Hujan dari bawah si awan: tiap tetes jatuh sekali (waktu acak dalam rentang guyuran). */
const Rain: React.FC<{ t: number }> = ({ t }) => (
  <group>
    {RAINS.map(([a, b], r) => {
      if (t < a || t > b + FALL) return null;
      const c = cloudAt(Math.min(t, b - 0.05));
      return Array.from({ length: DROPS }).map((_, i) => {
        const start = a + rnd(i + r * 97) * Math.max(0.1, b - a - FALL);
        const u = (t - start) / FALL;
        if (u < 0 || u > 1) return null;
        const x0 = c.x + (rnd(i * 3 + 1 + r * 31) - 0.5) * 1.0 * c.scale;
        const z0 = c.z + (rnd(i * 5 + 2 + r * 13) - 0.5) * 0.6 + 0.2;
        const y = c.y - 0.25 - u * (c.y - 0.25);
        return (
          <mesh key={`${r}-${i}`} position={[x0, y, z0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.22, 6]} />
            <meshStandardMaterial color="#9fd6ff" emissive="#5aa9e6" emissiveIntensity={0.4} transparent opacity={0.85} />
          </mesh>
        );
      });
    })}
  </group>
);

/* ------------------------------- matahari ------------------------------- */

const Sun: React.FC<{ sweat: number; smile: number }> = ({ sweat, smile }) => (
  <group>
    <mesh>
      <sphereGeometry args={[0.34, 28, 22]} />
      <meshStandardMaterial color="#FFD400" emissive="#ffb000" emissiveIntensity={0.6} />
    </mesh>
    {Array.from({ length: 10 }).map((_, i) => {
      const a = (i / 10) * Math.PI * 2;
      return (
        <mesh key={i} position={[Math.cos(a) * 0.48, Math.sin(a) * 0.48, -0.05]} rotation={[0, 0, a - Math.PI / 2]}>
          <coneGeometry args={[0.06, 0.16, 8]} />
          <meshStandardMaterial color="#ffc21a" emissive="#ff9a00" emissiveIntensity={0.5} />
        </mesh>
      );
    })}
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * 0.11, 0.06, 0.32]} scale={[1, 1, 0.5]}>
        <sphereGeometry args={[0.04, 12, 10]} />
        <meshStandardMaterial color="#3a2200" />
      </mesh>
    ))}
    <mesh position={[0, -0.07, 0.33]} rotation={[0, 0, Math.PI + 0.4]} scale={[1, smile, 1]}>
      <torusGeometry args={[0.07, 0.016, 8, 16, Math.PI * 0.75]} />
      <meshStandardMaterial color="#3a2200" />
    </mesh>
    {sweat > 0.05 ? (
      <mesh position={[0.3, 0.2, 0.2]} scale={sweat}>
        <sphereGeometry args={[0.05, 12, 10]} />
        <meshStandardMaterial color="#8fd3ff" transparent opacity={0.9} />
      </mesh>
    ) : null}
  </group>
);

const sunAt = (t: number) => {
  // hook: bersinar, lalu "kabur" saat guyuran; p1–p2: kerja keras manasin tanah
  const hookVis = t < S("kerja") ? 1 - pr(t, BEATS.pour0 - 0.2, 0.3, EASE.in) : 0;
  const workVis = popIn(t, BEATS.sun - 0.05, END("p2"));
  const tipsVis = popIn(t, S("tips") + 0.1, BEATS.umbrella + 0.2);
  const vis = Math.max(hookVis, workVis, tipsVis);
  const sweat = hold(t, BEATS.heat, END("p2"), 0.2, 0.2);
  const pump = 1 + 0.15 * (pr(t, BEATS.heat, 0.08) - pr(t, BEATS.heat + 0.1, 0.3));
  return { vis, sweat, pump, sink: pr(t, BEATS.pour0 - 0.2, 0.3, EASE.in) * (t < S("kerja") ? 1 : 0) };
};

/* ------------------------------- set halaman ------------------------------- */

const Shirt: React.FC<{ color: string; decal?: boolean }> = ({ color, decal }) => (
  <group>
    <mesh position={[0, -0.25, 0]}>
      <boxGeometry args={[0.42, 0.46, 0.03]} />
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * 0.27, -0.1, 0]} rotation={[0, 0, s * 0.6]}>
        <boxGeometry args={[0.18, 0.13, 0.03]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
    ))}
    {decal ? <HandleDecal position={[0, -0.27, 0.02]} width={0.36} /> : null}
  </group>
);

const Yard: React.FC<{ glow: number }> = ({ glow }) => (
  <group>
    {/* rumput — menyala hangat saat dipanasi matahari */}
    <mesh position={[0, -0.01, 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[3.0, 64]} />
      <meshStandardMaterial color="#4f9a4a" roughness={0.9} emissive="#ff7a1a" emissiveIntensity={glow * 0.45} />
    </mesh>
    {/* meja plastik bundar + es teh */}
    <mesh position={[0, TABLE_TOP - 0.04, 0.78]}>
      <cylinderGeometry args={[0.8, 0.8, 0.07, 48]} />
      <meshStandardMaterial color="#f4f1ea" roughness={0.5} />
    </mesh>
    <mesh position={[0, (TABLE_TOP - 0.08) / 2, 0.78]}>
      <cylinderGeometry args={[0.06, 0.08, TABLE_TOP - 0.08, 16]} />
      <meshStandardMaterial color="#f4f1ea" roughness={0.5} />
    </mesh>
    <group position={[0.5, TABLE_TOP, 0.75]}>
      <mesh position={[0, 0.17, 0]}>
        <cylinderGeometry args={[0.11, 0.09, 0.34, 24]} />
        <meshStandardMaterial color="#c8742a" transparent opacity={0.85} roughness={0.2} />
      </mesh>
      <mesh position={[0.02, 0.32, 0]} rotation={[0, 0, 0.15]}>
        <cylinderGeometry args={[0.014, 0.014, 0.34, 8]} />
        <meshStandardMaterial color="#e3263b" />
      </mesh>
    </group>
    {/* kartu kecil di meja: stiker @day.one.eight (anti re-upload) */}
    <group position={[-0.5, TABLE_TOP, 0.62]} rotation={[0, 0.45, 0]}>
      <mesh position={[0, 0.15, 0]} rotation={[-0.18, 0, 0]}>
        <boxGeometry args={[0.56, 0.3, 0.02]} />
        <meshStandardMaterial color="#20294f" roughness={0.5} />
      </mesh>
      <HandleDecal position={[0, 0.15, 0.015]} rotation={[-0.18, 0, 0]} width={0.5} />
    </group>
    {/* kursi santai */}
    <mesh position={[0, 0.8, -0.15]}>
      <boxGeometry args={[0.95, 0.08, 0.85]} />
      <meshStandardMaterial color="#2f8fd6" roughness={0.6} />
    </mesh>
    <mesh position={[0, 1.25, -0.62]} rotation={[-0.25, 0, 0]}>
      <boxGeometry args={[0.95, 0.75, 0.08]} />
      <meshStandardMaterial color="#2f8fd6" roughness={0.6} />
    </mesh>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * 0.42, 0.4, -0.15]}>
        <cylinderGeometry args={[0.035, 0.035, 0.8, 10]} />
        <meshStandardMaterial color="#d9d9d9" metalness={0.4} roughness={0.4} />
      </mesh>
    ))}
    {/* jemuran di belakang */}
    {[-2.3, 2.3].map((x) => (
      <mesh key={x} position={[x, 1.3, -1.8]}>
        <cylinderGeometry args={[0.04, 0.04, 2.6, 10]} />
        <meshStandardMaterial color="#8a6a4a" roughness={0.7} />
      </mesh>
    ))}
    <mesh position={[0, 2.55, -1.8]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.01, 0.01, 4.6, 6]} />
      <meshStandardMaterial color="#eeeeee" />
    </mesh>
    <group position={[-1.6, 2.55, -1.8]}>
      <Shirt color="#FFD400" decal />
    </group>
    <group position={[-0.95, 2.55, -1.8]}>
      <mesh position={[0, -0.32, 0]}>
        <boxGeometry args={[0.38, 0.62, 0.02]} />
        <meshStandardMaterial color="#ff8fb0" roughness={0.9} />
      </mesh>
    </group>
    <group position={[1.4, 2.55, -1.8]}>
      <Shirt color="#e3263b" />
    </group>
    <group position={[1.95, 2.55, -1.8]}>
      <mesh position={[0, -0.14, 0]}>
        <boxGeometry args={[0.1, 0.26, 0.02]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.05, -0.28, 0]}>
        <boxGeometry args={[0.18, 0.08, 0.02]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  </group>
);

/* ------------------------------- props poin ------------------------------- */

/** panah udara hangat naik */
const UpArrow: React.FC = () => (
  <group>
    <mesh>
      <cylinderGeometry args={[0.03, 0.03, 0.34, 8]} />
      <meshStandardMaterial color="#ffb36b" transparent opacity={0.85} />
    </mesh>
    <mesh position={[0, 0.23, 0]}>
      <coneGeometry args={[0.08, 0.14, 12]} />
      <meshStandardMaterial color="#ffb36b" transparent opacity={0.85} />
    </mesh>
  </group>
);

const Umbrella: React.FC<{ open: number }> = ({ open }) => (
  <group>
    <mesh position={[0, 0, 0]} scale={[0.25 + 0.75 * open, 0.35 + 0.65 * open, 0.25 + 0.75 * open]}>
      <sphereGeometry args={[0.62, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2.4]} />
      <meshStandardMaterial color="#e3263b" roughness={0.5} side={2} />
    </mesh>
    <mesh position={[0, 0.66 * (0.35 + 0.65 * open), 0]}>
      <sphereGeometry args={[0.04, 10, 8]} />
      <meshStandardMaterial color="#FFD400" />
    </mesh>
    <mesh position={[0, -0.62, 0]}>
      <cylinderGeometry args={[0.018, 0.018, 1.34, 8]} />
      <meshStandardMaterial color="#2a2a2e" />
    </mesh>
  </group>
);

const BOLT = (() => {
  const sh = new THREE.Shape();
  [
    [0.05, 0.4],
    [-0.16, 0.0],
    [-0.02, 0.0],
    [-0.12, -0.4],
    [0.16, 0.08],
    [0.02, 0.08],
    [0.14, 0.4],
  ].forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y)));
  sh.closePath();
  return new THREE.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: false });
})();

const Bolt: React.FC = () => (
  <mesh geometry={BOLT}>
    <meshStandardMaterial color="#FFD400" emissive="#FFD400" emissiveIntensity={0.9} />
  </mesh>
);

const Props: React.FC<{ t: number }> = ({ t }) => {
  const s = sunAt(t);

  /* p2: udara hangat naik dari tanah sekali, lalu diam */
  const arrows = popIn(t, BEATS.rise - 0.1, END("p2"));
  const riseU = pr(t, BEATS.rise, 0.9, EASE.out);

  /* tips: payung terbuka */
  const umb = popIn(t, BEATS.umbrella - 0.1, END("tips"));
  const umbOpen = pr(t, BEATS.umbrella, 0.3, EASE.back);

  /* serius: petir */
  const bolt = popIn(t, BEATS.bolt, END("serius"));

  return (
    <group>
      {s.vis > 0.001 ? (
        <group
          position={[-1.05, 3.3 - 0.8 * s.sink, -0.4]}
          scale={s.vis * s.pump}
          rotation={[0, 0.25 + spinIn(t, BEATS.sun - 0.05) * (t > S("p1") ? 1 : 0), 0]}
        >
          <Sun sweat={s.sweat} smile={1 - s.sweat * 0.5} />
        </group>
      ) : null}

      {arrows > 0
        ? [-1.3, -0.75, 0.75, 1.3].map((x, i) => (
            <group key={i} position={[x, 0.9 + riseU * (1.4 + (i % 2) * 0.2), 0.7]} scale={arrows * 1.3}>
              <UpArrow />
            </group>
          ))
        : null}

      {umb > 0 ? (
        <group position={[-0.32, 3.2 + 0.15 * hop(t, BEATS.umbrella, 0.3), 0.35]} scale={umb * 0.95} rotation={[0.1, 0, 0.1]}>
          <Umbrella open={umbOpen} />
        </group>
      ) : null}

      {bolt > 0 ? (
        <group position={[0.85, 2.45, 0.45]} scale={bolt * 1.3} rotation={[0, 0, 0.1]}>
          <Bolt />
        </group>
      ) : null}
    </group>
  );
};

/* -------------------------------- proyeksi -------------------------------- */

/** Posisi layar (px, komposisi 1080x1920) sebuah titik 3D, untuk balon teks overlay. */
export const CANVAS_TOP = 600;
const projCam = new THREE.PerspectiveCamera(38, 1080 / (1920 - CANVAS_TOP), 0.1, 100);
const toScreen = (t: number, p: [number, number, number]) => {
  const cam = cameraAt(t);
  projCam.position.set(cam.x, cam.y, cam.z);
  projCam.lookAt(0, cam.look, cam.lookZ);
  projCam.updateMatrixWorld(true);
  const v = new THREE.Vector3(...p).project(projCam);
  return { x: ((v.x + 1) / 2) * 1080, y: CANVAS_TOP + ((1 - v.y) / 2) * (1920 - CANVAS_TOP) };
};
/** titik di atas si awan (ikut tinggi tumpukan) */
export const cloudScreen = (t: number) => {
  const c = cloudAt(t);
  return toScreen(t, [c.x, c.y + (0.25 + (c.tiers - 1) * 0.42) * c.scale + 0.25, c.z]);
};
/** sisi kiri tingkat paling bawah si awan (untuk balon saat awan bertumpuk tinggi) */
export const cloudBaseScreen = (t: number) => {
  const c = cloudAt(t);
  return toScreen(t, [c.x - 0.3 * c.scale, c.y + 0.3 * c.scale, c.z + 0.3]);
};
/** titik di atas kepala si biru */
export const headScreen = (t: number) => toScreen(t, [0, 2.75, 0.1]);

/* -------------------------------- scene ------------------------------- */

export const Scene3D: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const cam = cameraAt(t);
  const sky = skyAt(t);
  const dim = 1 - 0.35 * Math.max(sky.grey, sky.night);
  const flash = hold(t, BEATS.bolt, BEATS.bolt + 0.1, 0.02, 0.12);
  const glow = hold(t, BEATS.heat, END("p2"), 0.4, 0.3);
  return (
    <ThreeCanvas width={width} height={height} camera={{ fov: 38, position: [0, 2.6, 7.8] }}>
      <Camera pose={cam} />
      <ambientLight intensity={(0.75 + flash * 1.5) * dim} />
      <directionalLight position={[3, 6, 5]} intensity={2.2 * dim} color={sky.grey > 0.5 ? "#dfe6f2" : "#fff1dc"} />
      <directionalLight position={[-4, 3, -3]} intensity={1.0 * dim} color="#ffd27a" />
      <directionalLight position={[0, 4, -6]} intensity={1.2} color="#ffffff" />
      <pointLight position={[0, 3, 3]} intensity={5 * dim} distance={8} color="#ffffff" />
      <Yard glow={glow} />
      <SiBiru t={t} />
      <SiAwan t={t} cam={cam} />
      <Rain t={t} />
      <Props t={t} />
    </ThreeCanvas>
  );
};
