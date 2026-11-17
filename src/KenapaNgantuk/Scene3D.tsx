// Scene 3D v2: karakter + props tanpa idle loop. Semua gerak adalah aksi diskret
// pada ketukan (makan, kepala jatuh, menguap, bangun) dan kamera pindah pose di
// awal tiap scene lalu diam. Waktu dihitung dalam detik.

import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import React, { useLayoutEffect } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { EASE } from "../lib/motion";
import { BoneOverride, Character3D } from "../brand/Character3D";
import { HandleDecal } from "../brand/HandleDecal";
import { FOOD_ITEMS, sceneById, SceneId, SCENES } from "./script";


const WOOD = "#a0673f";
const TABLE_TOP = 1.2;

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
type Ease = (x: number) => number;

const pr = (t: number, start: number, dur: number, ease: Ease = EASE.out) =>
  interpolate(t, [start, start + Math.max(0.001, dur)], [0, 1], { ...CLAMP, easing: ease });

type Key = { at: number; dur: number; v: number; ease?: Ease };
/** Nilai yang berpindah antar target pada waktu tertentu, lalu diam. */
const keyed = (t: number, initial: number, keys: Key[]) =>
  keys.reduce((v, k) => v + (k.v - v) * pr(t, k.at, k.dur, k.ease ?? EASE.inOut), initial);

const S = (id: SceneId) => sceneById(id).start;
const END = (id: SceneId) => sceneById(id).start + sceneById(id).duration;

/** Skala props: pop masuk (sekali), diam, mengecil cepat di akhir scene. */
const presence = (t: number, id: SceneId, delay = 0.25) => {
  if (t < S(id) + delay || t > END(id)) return 0;
  return pr(t, S(id) + delay, 0.35, EASE.back) * (1 - pr(t, END(id) - 0.15, 0.15, EASE.in));
};
/** Putaran masuk satu kali, lalu berhenti. */
const spinIn = (t: number, id: SceneId, delay = 0.25) => (1 - pr(t, S(id) + delay, 0.5)) * -0.9;

/* ------------------------------- kamera ------------------------------- */

type Pose = { x: number; y: number; z: number; look: number };
const POSES: Partial<Record<SceneId, Pose>> = {
  hook: { x: 0, y: 2.7, z: 8.6, look: 1.75 },
  promise: { x: -2.8, y: 3.1, z: 8.2, look: 1.75 },
  p1: { x: 1.4, y: 2.9, z: 7.2, look: 2.15 },
  p2: { x: 4.6, y: 2.5, z: 8.4, look: 1.65 },
  p3: { x: -1.8, y: 2.3, z: 8.0, look: 2.0 },
  p4: { x: 2.4, y: 4.8, z: 8.8, look: 1.45 },
  p5: { x: 0, y: 2.7, z: 7.6, look: 2.0 },
  food: { x: 0, y: 4.0, z: 8.2, look: 1.45 },
  outro: { x: 0, y: 2.7, z: 8.4, look: 1.85 },
};

const SHAKES = [
  { at: 0.92, amp: 0.14 },
  { at: sceneById("p4").start + 0.6, amp: 0.07 },
];
const PATTERN = [1, -0.8, 0.6, -0.4, 0.2];
const shakeAt = (t: number) =>
  SHAKES.reduce((acc, s) => {
    const dt = t - s.at;
    if (dt < 0 || dt >= 0.3) return acc;
    return acc + s.amp * (1 - dt / 0.3) * PATTERN[Math.floor(dt / 0.06)];
  }, 0);

const cameraAt = (t: number): Pose => {
  const order = SCENES.filter((s) => POSES[s.id]);
  const pose = { ...POSES[order[0].id]! };
  for (const s of order.slice(1)) {
    const target = POSES[s.id]!;
    const p = pr(t, s.start, 0.35, EASE.inOut);
    pose.x += (target.x - pose.x) * p;
    pose.y += (target.y - pose.y) * p;
    pose.z += (target.z - pose.z) * p;
    pose.look += (target.look - pose.look) * p;
  }
  const sh = shakeAt(t);
  return { ...pose, x: pose.x + sh, y: pose.y - sh * 0.6 };
};

const Camera: React.FC<{ pose: Pose }> = ({ pose }) => {
  const camera = useThree((st) => st.camera);
  useLayoutEffect(() => {
    camera.position.set(pose.x, pose.y, pose.z);
    camera.lookAt(0, pose.look, 0.3);
  }, [camera, pose.x, pose.y, pose.z, pose.look]);
  return null;
};

/* ------------------------------ karakter ------------------------------ */

const BLINKS = [6.2, 8.4, 11.2, 13.1, 17.3, 23.4, 25.6, 28.2, 30.1, 32.4, 33.3];

/** Skala kerangka Mannequin (tinggi 1.83 m) agar pas dengan meja & kursi di scene ini. */
const CHAR_SCALE = 1.75;

const Character: React.FC<{ t: number }> = ({ t }) => {
  const p4 = S("p4");
  const p3 = S("p3");
  const outro = S("outro");

  // Nilai 0..1 yang berpindah pada ketukan (lalu diam), dipetakan ke tulang.
  const headTilt = keyed(t, 0, [
    { at: 0.75, dur: 0.17, v: 1, ease: EASE.in },
    { at: 3.0, dur: 0.35, v: 0.3 },
    { at: p4 + 0.9, dur: 0.3, v: 0.9, ease: EASE.in },
    { at: p4 + 1.5, dur: 0.12, v: 0.25, ease: EASE.out },
    { at: outro, dur: 0.3, v: 0 },
  ]);
  const lean = keyed(t, 0, [
    { at: 0.75, dur: 0.17, v: 1, ease: EASE.in },
    { at: 3.0, dur: 0.35, v: 0.15 },
    { at: p4 + 0.9, dur: 0.3, v: 0.5, ease: EASE.in },
    { at: p4 + 1.5, dur: 0.12, v: 0.12, ease: EASE.out },
    { at: outro, dur: 0.3, v: 0 },
  ]);
  // menguap: kepala mendongak sekali
  const yawn = pr(t, p3 + 0.5, 0.3) - pr(t, p3 + 1.3, 0.35);
  // satu suapan di awal
  const raise = pr(t, 0.1, 0.25) - pr(t, 0.38, 0.22);
  // outro: melambai dua kali lalu turun
  const armUp = pr(t, outro + 0.3, 0.3) - pr(t, outro + 2.4, 0.3, EASE.in);
  const waveT = t - (outro + 0.65);
  const swing = waveT > 0 && waveT < 1 ? Math.sin(waveT * Math.PI * 4) * (1 - waveT) : 0;

  // ekspresi wajah
  const blink = BLINKS.some((b) => Math.abs(t - b) < 0.05) ? 0.1 : 1;
  const eyeBase = keyed(t, 1, [
    { at: 0.8, dur: 0.1, v: 0.05 },
    { at: 3.0, dur: 0.3, v: 0.4 },
    { at: S("p1") + 1.5, dur: 0.4, v: 0.3 },
    { at: p4 + 0.9, dur: 0.15, v: 0.05 },
    { at: p4 + 1.5, dur: 0.08, v: 0.8 },
    { at: p4 + 1.9, dur: 0.4, v: 0.35 },
    { at: outro, dur: 0.2, v: 1 },
  ]);
  const sleepy = 1 - pr(t, outro, 0.3);
  const face = {
    eyeOpen: Math.min(eyeBase * blink, 1 - yawn * 0.9),
    yawn,
    smile: 0.35 + 0.65 * pr(t, outro + 0.1, 0.3),
    sleepy,
  };

  const bones: BoneOverride = {
    spine_01: [lean * 0.35, 0, 0],
    spine_02: [lean * 0.35, 0, 0],
    spine_03: [lean * 0.25, 0, 0],
    neck_01: [headTilt * 0.35, 0, 0],
    Head: [headTilt * 0.55 - yawn * 0.35, 0, 0],
    upperarm_r: [raise * 1.25 + lean * 0.7, 0, 0],
    lowerarm_r: [raise * 0.5, 0, 0],
    upperarm_l: [lean * 0.7 * (1 - armUp), 0, armUp * 1.75],
    lowerarm_l: [-armUp * 1.05, 0, swing * 0.4 * armUp],
  };

  return (
    <Character3D
      look="cartoon"
      face={face}
      t={t}
      clips={[
        { clip: "Sitting_Idle_Loop", at: 0 },
        { clip: "Sitting_Talking_Loop", at: outro, fade: 0.3 },
      ]}
      bones={bones}
      position={[0, 0, -0.05]}
      scale={CHAR_SCALE}
    />
  );
};

/* -------------------------------- meja -------------------------------- */

const Table: React.FC<{ t: number }> = ({ t }) => {
  const rice = 1 - 0.35 * pr(t, 0.35, 0.1);
  return (
    <group>
      <mesh position={[0, TABLE_TOP - 0.06, 0.75]}>
        <boxGeometry args={[3.2, 0.12, 1.4]} />
        <meshStandardMaterial color={WOOD} roughness={0.6} />
      </mesh>
      {/* panel depan meja + stiker watermark */}
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
      <mesh position={[0, TABLE_TOP + 0.02, 0.75]}>
        <cylinderGeometry args={[0.42, 0.34, 0.05, 40]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
      <mesh position={[-0.05, TABLE_TOP + 0.05, 0.75]} scale={[rice, rice * 0.7, rice]}>
        <sphereGeometry args={[0.25, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#fbf6ea" roughness={0.9} />
      </mesh>
      <mesh position={[0.18, TABLE_TOP + 0.06, 0.8]} scale={rice}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial color="#f4c430" />
      </mesh>
      <mesh position={[1.05, TABLE_TOP + 0.17, 0.55]}>
        <cylinderGeometry args={[0.12, 0.1, 0.34, 24]} />
        <meshStandardMaterial color="#9fd8ff" transparent opacity={0.6} roughness={0.1} />
      </mesh>
    </group>
  );
};

/* -------------------------------- props ------------------------------- */

const Molecule: React.FC<{ color: string }> = ({ color }) => (
  <group>
    <mesh>
      <sphereGeometry args={[0.16, 20, 20]} />
      <meshStandardMaterial color={color} roughness={0.3} />
    </mesh>
    {[0, 2.1, 4.2].map((a) => (
      <group key={a} rotation={[0, 0, a]}>
        <mesh position={[0, 0.22, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.25, 8]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0.38, 0]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>
    ))}
  </group>
);

/** Huruf "Z" dari tiga balok. */
const ZShape: React.FC<{ size: number }> = ({ size }) => (
  <group scale={size}>
    <mesh position={[0, 0.25, 0]}>
      <boxGeometry args={[0.5, 0.09, 0.06]} />
      <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.4} />
    </mesh>
    <mesh rotation={[0, 0, 0.78]}>
      <boxGeometry args={[0.66, 0.09, 0.06]} />
      <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.4} />
    </mesh>
    <mesh position={[0, -0.25, 0]}>
      <boxGeometry args={[0.5, 0.09, 0.06]} />
      <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.4} />
    </mesh>
  </group>
);

const ZZZ_SETS: { from: number; to: number; pos: [number, number, number][] }[] = [
  {
    from: 1.2,
    to: 3.0,
    pos: [
      [0.55, 2.0, 1.2],
      [0.85, 2.45, 1.1],
      [1.2, 2.95, 1.0],
    ],
  },
  {
    from: sceneById("p5").start + 1.0,
    to: sceneById("p5").start + sceneById("p5").duration,
    pos: [
      [0.7, 2.55, 0.45],
      [1.05, 2.95, 0.4],
      [1.45, 3.35, 0.35],
    ],
  },
];

const Zzz: React.FC<{ t: number; cam: Pose }> = ({ t, cam }) => (
  <>
    {ZZZ_SETS.flatMap((set, si) =>
      set.pos.map((p, i) => {
        const at = set.from + i * 0.2;
        if (t < at || t > set.to) return null;
        const s = pr(t, at, 0.3, EASE.back) * (1 - pr(t, set.to - 0.15, 0.15, EASE.in));
        const face = Math.atan2(cam.x - p[0], cam.z - p[2]);
        return (
          <group key={`${si}-${i}`} position={p} rotation={[0, face, 0]} scale={s}>
            <ZShape size={0.38 + i * 0.12} />
          </group>
        );
      }),
    )}
  </>
);

const FoodProp: React.FC<{ i: number }> = ({ i }) => {
  if (i === 0)
    return (
      <mesh scale={[0.8, 1, 0.8]} position={[0, 0.18, 0]}>
        <sphereGeometry args={[0.2, 24, 24]} />
        <meshStandardMaterial color="#fff8ec" roughness={0.6} />
      </mesh>
    );
  if (i === 1)
    return (
      <mesh rotation={[Math.PI / 2, 0, 0.4]} position={[0, 0.1, 0]}>
        <torusGeometry args={[0.28, 0.08, 12, 24, Math.PI * 0.7]} />
        <meshStandardMaterial color="#ffd93b" roughness={0.5} />
      </mesh>
    );
  if (i === 2)
    return (
      <group position={[0, 0.12, 0]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.11, 0, 0]}>
            <sphereGeometry args={[0.11, 20, 20]} />
            <meshStandardMaterial color="#c8102e" roughness={0.2} />
          </mesh>
        ))}
        <mesh position={[0, 0.2, 0]}>
          <coneGeometry args={[0.12, 0.26, 3, 1, true]} />
          <meshStandardMaterial color="#3d8b37" side={2} />
        </mesh>
      </group>
    );
  if (i === 3)
    return (
      <group position={[0, 0.15, 0]}>
        <mesh>
          <cylinderGeometry args={[0.16, 0.12, 0.28, 24]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
        <mesh position={[0.18, 0, 0]}>
          <torusGeometry args={[0.07, 0.022, 8, 16]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0.13, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 0.02, 24]} />
          <meshStandardMaterial color="#e2b33c" />
        </mesh>
      </group>
    );
  return (
    <group position={[0, 0.22, 0]}>
      <mesh>
        <cylinderGeometry args={[0.11, 0.11, 0.44, 24]} />
        <meshStandardMaterial color="#1f6feb" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.02, 0.105]}>
        <boxGeometry args={[0.1, 0.18, 0.01]} />
        <meshStandardMaterial color="#c6ff3d" emissive="#88cc00" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
};

const FOOD_X = [-1.2, -0.6, 0, 0.6, 1.2];

const Props: React.FC<{ t: number }> = ({ t }) => {
  const p1 = presence(t, "p1");
  const p3 = presence(t, "p3");
  const p5 = presence(t, "p5");

  // 02: butir darah mengalir sekali dari kepala ke perut
  const p2s = S("p2");
  const p2on = t >= p2s && t <= END("p2");
  const belly = p2on ? pr(t, p2s + 0.9, 1.0) * (1 - pr(t, END("p2") - 0.15, 0.15, EASE.in)) : 0;

  // 04: dumbel jatuh ke meja
  const p4s = S("p4");
  const p4on = t >= p4s + 0.3 && t <= END("p4");
  const dropY =
    interpolate(pr(t, p4s + 0.3, 0.3, EASE.in), [0, 1], [4.4, TABLE_TOP + 0.2]) +
    0.14 * (pr(t, p4s + 0.6, 0.1) - pr(t, p4s + 0.7, 0.14, EASE.in));
  const p4out = 1 - pr(t, END("p4") - 0.15, 0.15, EASE.in);

  const food = sceneById("food");

  return (
    <group>
      {p1 > 0 ? (
        <>
          <group position={[-1.3, 3.0, 0.3]} scale={p1} rotation={[0.4, spinIn(t, "p1"), 0.2]}>
            <Molecule color="#ff5fa2" />
          </group>
          <group
            position={[1.35, 2.75, 0.4]}
            scale={p1 * 0.85}
            rotation={[0.1, -spinIn(t, "p1", 0.35), -0.3]}
          >
            <Molecule color="#a46bff" />
          </group>
        </>
      ) : null}

      {p2on
        ? new Array(12).fill(0).map((_, i) => {
            const start = p2s + 0.4 + i * 0.09;
            if (t < start || t > start + 0.9) return null;
            const u = pr(t, start, 0.9, EASE.inOut);
            const x = 0.6 + 0.4 * Math.sin(Math.PI * u);
            const y = 2.15 - 0.85 * u;
            const z = 0.35 + 0.1 * u;
            const sc = Math.min(pr(t, start, 0.1), 1 - pr(t, start + 0.8, 0.1));
            return (
              <mesh key={i} position={[x, y, z]} scale={sc}>
                <sphereGeometry args={[0.08, 16, 16]} />
                <meshStandardMaterial color="#e3263b" emissive="#7a0010" roughness={0.3} />
              </mesh>
            );
          })
        : null}
      {belly > 0 ? (
        <mesh position={[0, 1.3, 0.38]} scale={[belly, belly * 0.8, belly * 0.3]}>
          <sphereGeometry args={[0.24, 24, 24]} />
          <meshStandardMaterial color="#ff8a5b" emissive="#ff5a1f" emissiveIntensity={0.6} />
        </mesh>
      ) : null}

      {p3 > 0 ? (
        <group position={[-1.5, 3.1, -0.2]} scale={p3} rotation={[0, spinIn(t, "p3"), 0]}>
          <mesh>
            <sphereGeometry args={[0.42, 32, 32]} />
            <meshStandardMaterial color="#ffe27a" emissive="#ffcc33" emissiveIntensity={0.5} />
          </mesh>
          {[0, 1, 2, 3].map((i) => (
            <mesh
              key={i}
              position={[0.8 + 0.5 * Math.cos(i * 1.7), 0.5 * Math.sin(i * 2.3) - 0.1, 0.2]}
              rotation={[0.6, 0.4 * i, 0]}
            >
              <octahedronGeometry args={[0.1]} />
              <meshStandardMaterial color="#fff6c2" emissive="#ffe27a" emissiveIntensity={0.8} />
            </mesh>
          ))}
        </group>
      ) : null}

      {p4on ? (
        <group position={[0.95, dropY, 1.05]} rotation={[0, 0.5, 0]} scale={p4out}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.05, 0.05, 0.9, 16]} />
            <meshStandardMaterial color="#c7ccd4" metalness={0.8} roughness={0.25} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.42, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.2, 0.2, 0.18, 24]} />
              <meshStandardMaterial color="#26282e" roughness={0.4} />
            </mesh>
          ))}
        </group>
      ) : null}

      {p5 > 0 ? (
        <group
          position={[-1.45, 2.9, 0.1]}
          scale={p5}
          rotation={[0.15, 0.35 + spinIn(t, "p5"), 0]}
        >
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

      {/* makanan muncul satu per satu di tepi meja */}
      {t >= food.start && t <= food.start + food.duration
        ? FOOD_ITEMS.map((it, i) => {
            const at = food.start + it.at;
            if (t < at) return null;
            const s =
              pr(t, at, 0.3, EASE.back) *
              (1 - pr(t, food.start + food.duration - 0.15, 0.15, EASE.in));
            const drop = (1 - pr(t, at, 0.25, EASE.out)) * 0.6;
            return (
              <group key={i} position={[FOOD_X[i], TABLE_TOP + drop, 1.3]} scale={s * 1.25}>
                <FoodProp i={i} />
              </group>
            );
          })
        : null}
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
    <ThreeCanvas width={width} height={height} camera={{ fov: 38, position: [0, 2.7, 8.6] }}>
      <Camera pose={cam} />
      <ambientLight intensity={0.75} />
      <directionalLight position={[3, 6, 5]} intensity={2.2} />
      <directionalLight position={[-4, 3, -3]} intensity={1.2} color="#ffd400" />
      <pointLight position={[0, 3, 3]} intensity={6} distance={8} color="#ffffff" />
      <mesh position={[0, -0.01, 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.6, 64]} />
        <meshStandardMaterial color="#1d2a55" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.8, -0.15]}>
        <boxGeometry args={[1.0, 0.08, 0.8]} />
        <meshStandardMaterial color="#e94e3c" />
      </mesh>
      <mesh position={[0, 1.45, -0.6]}>
        <boxGeometry args={[1.0, 1.3, 0.1]} />
        <meshStandardMaterial color="#e94e3c" />
      </mesh>
      <Character t={t} />
      <Table t={t} />
      <Props t={t} />
      <Zzz t={t} cam={cam} />
    </ThreeCanvas>
  );
};
