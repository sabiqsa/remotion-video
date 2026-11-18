// Scene 3D "kenapa masuk angin?" — versi komedi: si biru berselimut + "si angin"
// (awan kecil berwajah) yang terus dituduh. Semua gerak & ekspresi = aksi diskret
// pada ketukan narasi (BEATS). Kamera pindah pose di awal scene lalu diam.

import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import React, { useLayoutEffect } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { FaceState } from "../brand/cartoonBody";
import { BoneOverride, Character3D } from "../brand/Character3D";
import { HandleDecal } from "../brand/HandleDecal";
import { EASE } from "../lib/motion";
import { BEATS } from "./Overlay";
import { sceneById, SceneId, SCENES } from "./script";

const WOOD = "#a0673f";
const TABLE_TOP = 1.2;
const CHAR_SCALE = 1.75;
const BLANKET = "#e0783f";

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
type Ease = (x: number) => number;
const pr = (t: number, start: number, dur: number, ease: Ease = EASE.out) =>
  interpolate(t, [start, start + Math.max(0.001, dur)], [0, 1], { ...CLAMP, easing: ease });
/** naik di `a`, bertahan, turun di `b` (0..1) */
const hold = (t: number, a: number, b: number, inDur = 0.2, outDur = 0.25) =>
  Math.min(pr(t, a, inDur), 1 - pr(t, b, outDur, EASE.in));

const S = (id: SceneId) => sceneById(id).start;
const END = (id: SceneId) => sceneById(id).start + sceneById(id).duration;

const popIn = (t: number, from: number, to: number) =>
  t < from || t > to ? 0 : pr(t, from, 0.35, EASE.back) * (1 - pr(t, to - 0.15, 0.15, EASE.in));
const spinIn = (t: number, from: number) => (1 - pr(t, from, 0.5)) * -0.9;

/* ------------------------------- kamera ------------------------------- */

type Pose = { x: number; y: number; z: number; look: number; lookZ?: number };
const POSES: Partial<Record<SceneId, Pose>> = {
  hook: { x: 0, y: 2.6, z: 7.8, look: 1.9 },
  promise: { x: -1.6, y: 2.8, z: 7.6, look: 1.95 },
  p1: { x: 1.2, y: 2.8, z: 6.9, look: 2.15 },
  p2: { x: 2.6, y: 2.4, z: 7.0, look: 1.85 },
  p3: { x: -2.0, y: 2.6, z: 7.6, look: 1.95 },
  p4: { x: 1.8, y: 2.7, z: -6.0, look: 1.95, lookZ: -0.2 },
  p5: { x: 0.9, y: 2.5, z: 6.9, look: 2.05 },
  tips: { x: 0, y: 3.5, z: 7.6, look: 1.6 },
  dokter: { x: -1.6, y: 2.8, z: 8.0, look: 1.85 },
  komen: { x: 0, y: 2.7, z: 7.6, look: 2.0 },
};

const SHAKES = [
  { at: BEATS.stamp, amp: 0.13 },
  { at: BEATS.sneeze, amp: 0.08 },
  { at: BEATS.crack, amp: 0.06 },
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

const BLINKS = [4.6, 9.2, 15.1, 21.4, 27.6, 33.9, 40.3, 46.1, 52.6, 58.8];

const faceAt = (t: number): FaceState => {
  const blink = BLINKS.some((b) => Math.abs(t - b) < 0.05) ? 0.1 : 1;
  const p2 = S("p2");
  const tips = S("tips");
  const komen = S("komen");

  // dasar: sakit & kedinginan, membaik di tips, ceria di komen
  const recover = pr(t, tips + 0.6, 0.6);
  const happy = pr(t, komen + 0.2, 0.4);
  const base = {
    pale: 0.55 * (1 - recover) * (1 - happy),
    sad: 0.55 * (1 - recover) * (1 - happy),
    frown: 0.35 * (1 - recover) * (1 - happy),
    smile: 0.55 * recover * (1 - happy) + happy,
  };

  const shock = hold(t, BEATS.stamp, BEATS.stamp + 0.55, 0.06, 0.3);
  const relief = hold(t, BEATS.promiseRelief, S("p1"), 0.25, 0.3);
  const preSneeze = hold(t, BEATS.sneeze - 0.35, BEATS.sneeze, 0.12, 0.05);
  const sneezing = t >= BEATS.sneeze && t < BEATS.sneeze + 0.35;
  const tummy = hold(t, p2 + 0.3, END("p2"), 0.3, 0.3);
  const burp = hold(t, BEATS.burp, BEATS.burp + 0.3, 0.05, 0.12);
  const shy = hold(t, BEATS.burp + 0.35, BEATS.burp + 1.6, 0.2, 0.3);
  const waduh = hold(t, BEATS.crack, BEATS.crack + 1.2, 0.06, 0.3);
  const pain = hold(t, BEATS.scrapeStart, BEATS.scrapeStart + 1.6, 0.1, 0.3);
  const worry = hold(t, BEATS.serious, END("p5"), 0.3, 0.3);

  return {
    eyeOpen: Math.min(blink, sneezing ? 0.08 : 1, 0.78 - preSneeze * 0.4 + happy * 0.07),
    smile: Math.max(base.smile * (1 - worry), relief * 0.6, shy * 0.35),
    frown: Math.max(base.frown * (1 - relief) * (1 - shy), tummy * 0.6 * (1 - shy), worry * 0.7),
    sad: Math.max(base.sad * (1 - relief), worry * 0.9, tummy * 0.4),
    pale: Math.max(base.pale, worry * 0.7, tummy * 0.5),
    open: Math.max(shock * 0.85, preSneeze * 0.6, burp * 0.75, waduh),
    surprise: Math.max(shock, waduh, preSneeze * 0.5),
    pain,
    blush: Math.max(0.6 * happy, shy),
    sweat: Math.max(shock * 0.8, waduh, worry * 0.8, shy * 0.6, pain),
  };
};

const SiBiru: React.FC<{ t: number }> = ({ t }) => {
  const p2 = S("p2");
  const p4 = S("p4");
  const p5 = S("p5");
  const komen = S("komen");

  // menggigil sekali di awal hook (aksi terbatas waktu, bukan loop)
  const sv = t - 0.4;
  const shiver = sv > 0 && sv < 1 ? Math.sin(sv * 46) * (1 - sv) * 0.06 : 0;

  const sneeze =
    -0.22 * (pr(t, BEATS.sneeze - 0.35, 0.3) - pr(t, BEATS.sneeze, 0.06)) +
    0.45 * (pr(t, BEATS.sneeze, 0.08, EASE.in) - pr(t, BEATS.sneeze + 0.15, 0.4));
  const flinch = -0.15 * (pr(t, BEATS.crack, 0.08) - pr(t, BEATS.crack + 0.15, 0.3));
  const burpPush = -0.1 * (pr(t, BEATS.burp, 0.06) - pr(t, BEATS.burp + 0.1, 0.3));

  const lean = 0.08 + 0.22 * hold(t, p4, p5 + 0.1, 0.4, 0.35);
  const bellyHand = hold(t, p2 + 0.3, END("p2") - 0.3, 0.35, 0.3);
  const chestHand = hold(t, BEATS.serious, END("p5") - 0.3, 0.35, 0.3);
  const wave = hold(t, BEATS.highFive - 0.4, END("komen"), 0.3, 0.3);

  const bones: BoneOverride = {
    spine_01: [lean * 0.35, 0, shiver],
    spine_02: [lean * 0.35 + burpPush, 0, -shiver],
    spine_03: [lean * 0.25, 0, shiver],
    Head: [sneeze + flinch, 0, 0],
    upperarm_r: [bellyHand * 0.55, 0, 0],
    upperarm_l: [chestHand * 0.95, 0, wave * 1.75],
    lowerarm_l: [-wave * 1.05, 0, 0],
  };

  return (
    <Character3D
      look="cartoon"
      face={faceAt(t)}
      t={t}
      clips={[
        { clip: "Sitting_Idle_Loop", at: 0 },
        { clip: "Sitting_Talking_Loop", at: komen, fade: 0.3 },
      ]}
      bones={bones}
      position={[0, 0, -0.05]}
      scale={CHAR_SCALE}
    />
  );
};

/* ------------------------------ si angin ------------------------------ */

type CloudMood = { smile: number; open: number; closed: number; sweat: number };

const Cloud: React.FC<{ mood: CloudMood }> = ({ mood }) => (
  <group>
    {[
      [0, 0, 0, 0.32],
      [-0.3, -0.06, 0, 0.24],
      [0.3, -0.05, 0, 0.25],
      [-0.15, 0.17, -0.05, 0.22],
      [0.16, 0.16, -0.05, 0.21],
    ].map(([x, y, z, r], i) => (
      <mesh key={i} position={[x, y, z]}>
        <sphereGeometry args={[r, 24, 20]} />
        <meshStandardMaterial color="#f6fbff" roughness={0.85} emissive="#cfe8ff" emissiveIntensity={0.15} />
      </mesh>
    ))}
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
);

/** Posisi, skala, & mood si angin sepanjang video (aksi diskret per ketukan). */
const cloudAt = (t: number, cam: Required<Pose>) => {
  const p2 = S("p2");
  const komen = S("komen");
  const step = (v: number, n: number) => Math.floor(v * n) / n; // jalan mengendap (staccato)

  let x = 0;
  let y = 0;
  let z = 0;
  let sx = 1;
  let sy = 1;
  let rot = 0;
  let vis = 0;
  let mood: CloudMood = { smile: 0.3, open: 0, closed: 0, sweat: 0 };

  if (t < BEATS.sneeze + 0.8) {
    // hook→p1: mengendap masuk, dicap, lega, lalu tertiup bersin
    const sneak = step(pr(t, 0.2, 0.9, (v) => v), 8);
    x = -3.2 + 2.2 * sneak;
    y = 2.45;
    z = 0.7;
    vis = 1;
    const squash = pr(t, BEATS.stamp, 0.06) - pr(t, BEATS.stamp + 0.1, 0.35);
    sx = 1 + 0.3 * squash;
    sy = 1 - 0.4 * squash;
    if (t >= BEATS.stamp) mood = { smile: -0.5, open: 1, closed: 0, sweat: 1 };
    if (t >= BEATS.promiseRelief) mood = { smile: 1, open: 0, closed: 0.85, sweat: 0.5 };
    const blown = pr(t, BEATS.sneeze, 0.6, EASE.out);
    x -= 2.6 * blown;
    y += 0.8 * blown;
    rot = blown * Math.PI * 2;
    if (t >= BEATS.sneeze) mood = { smile: 0, open: 1, closed: 0, sweat: 1 };
    vis = 1 - pr(t, BEATS.sneeze + 0.5, 0.2);
  } else if (t >= p2 && t < END("p2")) {
    x = 1.15 + 0.3 * pr(t, BEATS.burp + 0.1, 0.3);
    y = 2.55;
    z = 0.6;
    vis = popIn(t, p2 + 0.4, END("p2"));
    if (t >= BEATS.burp + 0.1) mood = { smile: -1, open: 0, closed: 1, sweat: 0.6 };
  } else if (t >= BEATS.peek - 0.4 && t < END("jawab")) {
    x = -2.0 + 1.1 * pr(t, BEATS.peek - 0.4, 0.35, EASE.back);
    y = 2.45;
    z = -0.6;
    vis = 1 - pr(t, END("jawab") - 0.15, 0.15, EASE.in);
    mood = { smile: 0.8, open: 0, closed: 0.3, sweat: 0 };
  } else if (t >= BEATS.sitJoke && t < BEATS.serious + 0.25) {
    x = -0.95;
    y = TABLE_TOP + 0.28;
    z = 1.05;
    sy = 0.8;
    sx = 1.1;
    vis = popIn(t, BEATS.sitJoke, BEATS.serious + 0.25);
    mood = { smile: 0.5, open: 0, closed: 0, sweat: 0 };
  } else if (t >= komen + 0.3) {
    const five = pr(t, BEATS.highFive, 0.2, EASE.out);
    x = 1.25 - 0.4 * five;
    y = 2.6 + 0.35 * five;
    z = 0.55;
    vis = popIn(t, komen + 0.3, END("komen"));
    const bump = 1 + 0.15 * (pr(t, BEATS.highFive + 0.15, 0.06) - pr(t, BEATS.highFive + 0.21, 0.25));
    sx = bump;
    sy = bump;
    mood = { smile: 1, open: 0, closed: t > BEATS.highFive ? 0.8 : 0, sweat: 0 };
  }

  const face = Math.atan2(cam.x - x, cam.z - z);
  return { x, y, z, sx, sy, rot, vis, mood, face };
};

const SiAngin: React.FC<{ t: number; cam: Required<Pose> }> = ({ t, cam }) => {
  const c = cloudAt(t, cam);
  if (c.vis <= 0.001) return null;
  return (
    <group position={[c.x, c.y, c.z]} rotation={[0, c.face, c.rot]} scale={[c.sx * c.vis, c.sy * c.vis, c.vis]}>
      <Cloud mood={c.mood} />
    </group>
  );
};

/* ------------------------------- selimut ------------------------------- */

const Blanket: React.FC<{ t: number }> = ({ t }) => {
  const off = pr(t, S("p4") + 0.1, 0.5, EASE.in);
  if (off >= 1) return null;
  return (
    <group position={[0, -1.1 * off, -0.04 - 0.3 * off]} rotation={[0.5 * off, 0, 0]} scale={1 - 0.3 * off}>
      <mesh position={[0, 1.6, -0.42]} rotation={[-0.08, 0, 0]}>
        <boxGeometry args={[1.0, 0.85, 0.07]} />
        <meshStandardMaterial color={BLANKET} roughness={0.9} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.5, 1.95, -0.1]} rotation={[0.2, 0, s * -0.35]}>
          <boxGeometry args={[0.3, 0.08, 0.6]} />
          <meshStandardMaterial color={BLANKET} roughness={0.9} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`f${s}`} position={[s * 0.55, 1.55, 0.18]} rotation={[0, 0, s * 0.06]}>
          <boxGeometry args={[0.14, 0.75, 0.08]} />
          <meshStandardMaterial color={BLANKET} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
};

/* -------------------------------- meja -------------------------------- */

const Table: React.FC<{ t: number }> = ({ t }) => {
  const tips = S("tips");
  return (
    <group>
      <mesh position={[0, TABLE_TOP - 0.06, 0.75]}>
        <boxGeometry args={[3.2, 0.12, 1.4]} />
        <meshStandardMaterial color={WOOD} roughness={0.6} />
      </mesh>
      <mesh position={[0, TABLE_TOP - 0.24, 1.4]}>
        <boxGeometry args={[3.0, 0.26, 0.05]} />
        <meshStandardMaterial color="#8a5634" roughness={0.65} />
      </mesh>
      <HandleDecal position={[0, TABLE_TOP - 0.24, 1.43]} width={1.0} />
      {[
        [-1.45, 0.2],
        [1.45, 0.2],
        [-1.45, 1.3],
        [1.45, 1.3],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, (TABLE_TOP - 0.12) / 2, z]}>
          <boxGeometry args={[0.1, TABLE_TOP - 0.12, 0.1]} />
          <meshStandardMaterial color="#7d4e2f" />
        </mesh>
      ))}
      <group position={[0.7, TABLE_TOP, 0.85]}>
        <mesh position={[0, 0.17, 0]}>
          <cylinderGeometry args={[0.15, 0.13, 0.34, 28]} />
          <meshStandardMaterial color="#ffffff" roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.152, 0.152, 0.06, 28]} />
          <meshStandardMaterial color="#FFD400" roughness={0.4} />
        </mesh>
        <mesh position={[0.17, 0.18, 0]}>
          <torusGeometry args={[0.07, 0.022, 8, 16]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0.33, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.01, 24]} />
          <meshStandardMaterial color="#c98a3a" />
        </mesh>
        {[0, 1, 2].map((i) => {
          const at = tips + 0.5 + i * 0.25;
          if (t < at || t > at + 1.4) return null;
          const u = pr(t, at, 1.4, EASE.out);
          return (
            <mesh key={i} position={[(i - 1) * 0.06, 0.45 + u * 0.7, 0]} scale={0.6 + u * 0.8}>
              <sphereGeometry args={[0.07, 14, 14]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={0.55 * (1 - u)} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
};

/* -------------------------------- props ------------------------------- */

const Virus: React.FC = () => (
  <group>
    <mesh>
      <sphereGeometry args={[0.13, 20, 20]} />
      <meshStandardMaterial color="#7bd389" roughness={0.4} />
    </mesh>
    {[
      [0, 0],
      [Math.PI / 2, 0],
      [Math.PI, 0],
      [-Math.PI / 2, 0],
      [0, Math.PI / 2],
      [0, -Math.PI / 2],
      [Math.PI / 4, Math.PI / 4],
      [-Math.PI / 4, -Math.PI / 4],
    ].map(([a, b], i) => (
      <group key={i} rotation={[a, 0, b]}>
        <mesh position={[0, 0.17, 0]}>
          <coneGeometry args={[0.035, 0.1, 8]} />
          <meshStandardMaterial color="#3e9a55" />
        </mesh>
      </group>
    ))}
  </group>
);

const Heart: React.FC = () => (
  <group>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * 0.1, 0.06, 0]}>
        <sphereGeometry args={[0.14, 20, 20]} />
        <meshStandardMaterial color="#e3263b" roughness={0.3} />
      </mesh>
    ))}
    <mesh position={[0, -0.12, 0]} rotation={[0, 0, Math.PI]}>
      <coneGeometry args={[0.235, 0.3, 24]} />
      <meshStandardMaterial color="#e3263b" roughness={0.3} />
    </mesh>
  </group>
);

const STRIPES = [-0.21, -0.08, 0.08, 0.21];
/** permukaan punggung (z dunia) saat si biru membungkuk di p4 */
const BACK_Z = -0.85;
const STROKE = 0.38;

const Props: React.FC<{ t: number }> = ({ t }) => {
  const wind = [0, 1, 2].map((i) => {
    const at = 0.15 + i * 0.12;
    const u = pr(t, at, 0.7, EASE.out);
    const gone = pr(t, BEATS.stamp, 0.15, EASE.in);
    return { i, u, gone, on: t >= at && gone < 1 };
  });

  const p1 = S("p1");
  const p2 = S("p2");
  const p3 = S("p3");
  const dok = S("dokter");

  const virus = popIn(t, p1 + 0.25, END("p1"));
  const blown = pr(t, BEATS.sneeze, 0.55, EASE.out);
  const belly = popIn(t, p2 + 0.5, END("p2"));
  const shield = popIn(t, p3 + 0.3, END("p3"));
  const cracked = pr(t, BEATS.crack, 0.18, EASE.out);
  const seriousEnd = END("p5");
  const heart = popIn(t, BEATS.serious + 0.1, seriousEnd);
  const heartBeat = 1 + 0.18 * (pr(t, BEATS.serious + 0.9, 0.08) - pr(t, BEATS.serious + 0.98, 0.25));
  const warn = popIn(t, BEATS.serious + 0.3, seriousEnd);
  const kit = popIn(t, dok + 0.3, END("dokter"));

  const scrape0 = BEATS.scrapeStart;
  const stripesEnd = END("jawab");

  return (
    <group>
      {wind.map(({ i, u, gone, on }) =>
        on ? (
          <mesh
            key={i}
            position={[-3.2 + u * 2.6, 2.15 + i * 0.32, 0.6 + i * 0.1]}
            rotation={[0, 0, Math.PI / 2]}
            scale={[1 - gone, 0.4 + u * 0.8, 1 - gone]}
          >
            <capsuleGeometry args={[0.025, 0.9, 4, 10]} />
            <meshStandardMaterial color="#cfe6ff" transparent opacity={0.85 * (1 - gone)} emissive="#9fd0ff" emissiveIntensity={0.4} />
          </mesh>
        ) : null,
      )}

      {virus > 0
        ? [
            [-1.0, 2.9, 0.4, 0.25],
            [1.05, 2.75, 0.5, 0.35],
            [-0.75, 2.2, 0.8, 0.45],
          ].map(([x, y, z, d], i) => (
            <group
              key={i}
              position={[x + Math.sign(x) * 2.2 * blown, y + 0.5 * blown, z]}
              scale={virus * (1 - i * 0.15) * (1 - blown)}
              rotation={[0.3, spinIn(t, p1 + d) + blown * 6, 0.2]}
            >
              <Virus />
            </group>
          ))
        : null}

      {belly > 0 ? (
        <mesh position={[0, 1.3, 0.38]} scale={[belly, belly * 0.8, belly * 0.3]}>
          <sphereGeometry args={[0.24, 24, 24]} />
          <meshStandardMaterial color="#ffb25b" emissive="#ff8a1f" emissiveIntensity={0.6} />
        </mesh>
      ) : null}
      {[0, 1, 2].map((i) => {
        const at = BEATS.burp - 0.4 + i * 0.12;
        if (t < at || t > at + 0.9) return null;
        const u = pr(t, at, 0.9, EASE.out);
        return (
          <mesh key={i} position={[(i - 1) * 0.18, 1.45 + u * 1.0, 0.55]} scale={0.6 + u * 0.6}>
            <sphereGeometry args={[0.07, 16, 16]} />
            <meshStandardMaterial color="#ffe9b0" transparent opacity={0.8 * (1 - u)} />
          </mesh>
        );
      })}

      {shield > 0 ? (
        <group position={[-1.25, 2.3, 0.6]} rotation={[0, 0.35, 0]} scale={shield}>
          {[0, 1].map((h) => (
            <mesh
              key={h}
              position={[(h === 0 ? -1 : 1) * 0.05 * cracked, -0.05 * cracked * h, 0]}
              rotation={[Math.PI / 2, 0, (h === 0 ? 1 : -1) * 0.12 * cracked]}
            >
              <cylinderGeometry args={[0.45, 0.45, 0.06, 32, 1, false, h * Math.PI, Math.PI]} />
              <meshStandardMaterial color="#4aa8ff" metalness={0.3} roughness={0.35} side={2} />
            </mesh>
          ))}
          {cracked > 0
            ? [0.18, -0.05, 0.12, -0.1].map((x, k) => (
                <mesh key={k} position={[x * 0.4, 0.3 - k * 0.18, 0.05]} rotation={[0, 0, k % 2 ? 0.7 : -0.7]} scale={cracked}>
                  <boxGeometry args={[0.03, 0.2, 0.02]} />
                  <meshStandardMaterial color="#10183a" />
                </mesh>
              ))
            : null}
        </group>
      ) : null}

      {t >= scrape0 && t <= stripesEnd
        ? STRIPES.map((x, i) => {
            const at = scrape0 + i * STROKE;
            if (t < at) return null;
            const grow = Math.floor(pr(t, at, STROKE * 0.85, (v) => v) * 4) / 4;
            const fade = 1 - pr(t, stripesEnd - 0.15, 0.15, EASE.in);
            return (
              <mesh key={i} position={[x, 1.98 - 0.24 * grow, BACK_Z]} rotation={[0.3, 0, x * -0.6]} scale={[1, Math.max(0.01, grow), 1]}>
                <boxGeometry args={[0.045, 0.48, 0.012]} />
                <meshStandardMaterial color="#d6303a" transparent opacity={0.9 * fade} />
              </mesh>
            );
          })
        : null}
      {(() => {
        const t1 = scrape0 + STRIPES.length * STROKE;
        if (t < scrape0 - 0.2 || t > t1 + 0.4) return null;
        const i = Math.min(STRIPES.length - 1, Math.max(0, Math.floor((t - scrape0) / STROKE)));
        const down = Math.min(1, Math.max(0, t - (scrape0 + i * STROKE)) / (STROKE * 0.85));
        const out = pr(t, t1 + 0.1, 0.3, EASE.in);
        return (
          <mesh position={[STRIPES[i] + 0.07, 1.98 - 0.48 * down, BACK_Z - 0.05]} rotation={[Math.PI / 2 + 0.3, 0, 0]} scale={1 - out}>
            <cylinderGeometry args={[0.07, 0.07, 0.016, 28]} />
            <meshStandardMaterial color="#e7b739" metalness={0.8} roughness={0.25} />
          </mesh>
        );
      })()}

      {heart > 0 ? (
        <group position={[1.15, 2.35, 0.55]} scale={heart * heartBeat} rotation={[0, spinIn(t, BEATS.serious + 0.1) - 0.2, 0]}>
          <Heart />
        </group>
      ) : null}
      {warn > 0 ? (
        <group position={[1.3, 3.0, 0.3]} scale={warn} rotation={[Math.PI / 2, 0, 0]}>
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
      ) : null}

      {kit > 0 ? (
        <group position={[-1.35, 2.7, 0.3]} scale={kit} rotation={[0.15, 0.35 + spinIn(t, dok + 0.3), 0]}>
          <mesh>
            <boxGeometry args={[0.7, 0.55, 0.35]} />
            <meshStandardMaterial color="#ffffff" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, 0.18]}>
            <boxGeometry args={[0.36, 0.1, 0.02]} />
            <meshStandardMaterial color="#e3263b" />
          </mesh>
          <mesh position={[0, 0, 0.18]}>
            <boxGeometry args={[0.1, 0.36, 0.02]} />
            <meshStandardMaterial color="#e3263b" />
          </mesh>
        </group>
      ) : null}
    </group>
  );
};

/* -------------------------------- scene ------------------------------- */

export const Scene3D: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const cam = cameraAt(t);
  // kursi + si biru mundur sedikit saat bersin keras (boing!)
  const kick = -0.28 * (pr(t, BEATS.sneeze, 0.12, EASE.out) - pr(t, BEATS.sneeze + 0.45, 0.4, EASE.inOut));
  return (
    <ThreeCanvas width={width} height={height} camera={{ fov: 38, position: [0, 2.6, 7.8] }}>
      <Camera pose={cam} />
      <ambientLight intensity={0.75} />
      <directionalLight position={[3, 6, 5]} intensity={2.2} />
      <directionalLight position={[-4, 3, -3]} intensity={1.2} color="#ffd400" />
      <directionalLight position={[0, 4, -6]} intensity={1.4} color="#ffffff" />
      <pointLight position={[0, 3, 3]} intensity={6} distance={8} color="#ffffff" />
      <mesh position={[0, -0.01, 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.6, 64]} />
        <meshStandardMaterial color="#1d2a55" roughness={0.9} />
      </mesh>
      <group position={[0, 0, kick]}>
        <mesh position={[0, 0.8, -0.15]}>
          <boxGeometry args={[1.0, 0.08, 0.8]} />
          <meshStandardMaterial color="#e94e3c" />
        </mesh>
        <mesh position={[0, 1.15, -0.6]}>
          <boxGeometry args={[1.0, 0.6, 0.1]} />
          <meshStandardMaterial color="#e94e3c" />
        </mesh>
        <SiBiru t={t} />
        <Blanket t={t} />
      </group>
      <Table t={t} />
      <Props t={t} />
      <SiAngin t={t} cam={cam} />
    </ThreeCanvas>
  );
};
