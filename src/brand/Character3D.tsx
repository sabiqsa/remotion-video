// Karakter 3D ber-rig (Quaternius Universal Base Characters / Mannequin, CC0)
// dengan animasi dari Universal Animation Library. Semua animasi diputar
// deterministik per frame (waktu klip dihitung dari detik video), lalu tulang
// bisa ditimpa (pose override) untuk aksi khusus: kepala jatuh, melambai, dll.

import { useThree } from "@react-three/fiber";
import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";
import {
  applyFace,
  buildCartoonBody,
  CartoonColors,
  CartoonRig,
  DEFAULT_CARTOON_COLORS,
  FaceState,
  Wardrobe,
} from "./cartoonBody";

export type CharacterModel = "mannequin" | "superhero_male" | "superhero_female";

export const CHARACTER_FILES: Record<CharacterModel, string> = {
  mannequin: "models/ual/UAL1_Standard.glb",
  superhero_male: "models/ubc/Superhero_Male_FullBody.gltf",
  superhero_female: "models/ubc/Superhero_Female_FullBody.gltf",
};
export const ANIMATION_FILE = "models/ual/UAL1_Standard.glb";
export const HAIR_FILES = {
  simple_parted: "models/hair/Hair_SimpleParted.gltf",
  buzzed: "models/hair/Hair_Buzzed.gltf",
  long: "models/hair/Hair_Long.gltf",
  buns: "models/hair/Hair_Buns.gltf",
  buzzed_female: "models/hair/Hair_BuzzedFemale.gltf",
  beard: "models/hair/Hair_Beard.gltf",
} as const;
export type HairStyle = keyof typeof HAIR_FILES;

/* ------------------------------ loader ------------------------------ */

const cache = new Map<string, Promise<GLTF>>();
const loadGltf = (path: string) => {
  const url = staticFile(path);
  if (!cache.has(url)) {
    cache.set(
      url,
      new Promise<GLTF>((resolve, reject) => new GLTFLoader().load(url, resolve, undefined, reject)),
    );
  }
  return cache.get(url)!;
};

/** Muat beberapa glTF sekaligus. */
const useGltfs = (paths: string[]) => {
  const key = paths.join("|");
  const [result, setResult] = useState<GLTF[] | null>(null);
  useLayoutEffect(() => {
    let alive = true;
    Promise.all(key.split("|").map(loadGltf))
      .then((g) => {
        if (alive) setResult(g);
      })
      .catch((e) => cancelRender(e));
    return () => {
      alive = false;
    };
  }, [key]);
  return result;
};

/* ------------------------------ timeline ------------------------------ */

export type ClipSegment = {
  /** nama klip di Universal Animation Library, mis. "Sitting_Idle_Loop" */
  clip: string;
  /** detik mulai (waktu video) */
  at: number;
  /** detik crossfade dari segmen sebelumnya (default 0.25) */
  fade?: number;
  speed?: number;
  loop?: boolean;
  /** offset detik di dalam klip */
  offset?: number;
};

/** Rotasi tambahan (radian) per tulang, ditambahkan di atas animasi. */
export type BoneOverride = Partial<Record<string, [number, number, number]>>;

export type Character3DProps = {
  /**
   * "cartoon" (default brand): tubuh kartun kepala besar di atas kerangka Mannequin.
   * "model": tampilkan mesh asli dari `model`.
   */
  look?: "cartoon" | "model";
  /** ekspresi wajah (hanya look="cartoon") */
  face?: FaceState;
  /** warna tubuh kartun */
  colors?: Partial<CartoonColors>;
  /** rambut, baju, aksesori (lihat src/brand/wardrobe.ts & still WardrobeSheet) */
  wardrobe?: Wardrobe;
  model?: CharacterModel;
  hair?: HairStyle | null;
  /** waktu video dalam detik */
  t: number;
  clips: ClipSegment[];
  bones?: BoneOverride;
  /** warna utama Mannequin (badan) dan sendi */
  tint?: { main?: string; joints?: string };
  position?: [number, number, number];
  rotationY?: number;
  scale?: number;
};

const clipTime = (seg: ClipSegment, t: number, duration: number) => {
  const local = Math.max(0, (t - seg.at) * (seg.speed ?? 1) + (seg.offset ?? 0));
  const loop = seg.loop ?? seg.clip.endsWith("_Loop");
  return loop ? local % duration : Math.min(local, duration - 1e-3);
};

/* ------------------------------ komponen ------------------------------ */

export const Character3D: React.FC<Character3DProps> = ({
  look = "cartoon",
  face,
  colors,
  wardrobe,
  model: modelProp = "mannequin",
  hair = null,
  t,
  clips,
  bones,
  tint,
  position = [0, 0, 0],
  rotationY = 0,
  scale = 1,
}) => {
  const model: CharacterModel = look === "cartoon" ? "mannequin" : modelProp;
  const colorKey = JSON.stringify(colors ?? {});
  const wardrobeKey = JSON.stringify(wardrobe ?? {});
  const paths = useMemo(() => {
    const p = [CHARACTER_FILES[model], ANIMATION_FILE];
    if (hair) p.push(HAIR_FILES[hair]);
    return p;
  }, [model, hair]);
  const gltfs = useGltfs(paths);
  const advance = useThree((s) => s.advance);
  // Tahan render sampai model dimuat DAN pose pertama sudah digambar.
  const [handle] = useState(() =>
    delayRender("Memuat karakter 3D", { timeoutInMilliseconds: 60000 }),
  );
  const released = useRef(false);

  const rig = useMemo(() => {
    if (!gltfs) return null;
    const [body, anims, hairG] = gltfs;
    const root = cloneSkinned(body.scene) as THREE.Object3D;
    const hairRoot = hairG ? (cloneSkinned(hairG.scene) as THREE.Object3D) : null;

    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.frustumCulled = false;
      if (model === "mannequin" && tint) {
        const mat = (m.material as THREE.MeshStandardMaterial).clone();
        if (mat.name === "M_Main" && tint.main) mat.color = new THREE.Color(tint.main);
        if (mat.name === "M_Joints" && tint.joints) mat.color = new THREE.Color(tint.joints);
        m.material = mat;
      }
    });

    // Rambut di-rig ke tulang Head milik skeleton yang sama: ikat ke skeleton badan.
    if (hairRoot) {
      const bodyBones = new Map<string, THREE.Bone>();
      root.traverse((o) => {
        if ((o as THREE.Bone).isBone) bodyBones.set(o.name, o as THREE.Bone);
      });
      hairRoot.traverse((o) => {
        const sm = o as THREE.SkinnedMesh;
        if (!sm.isSkinnedMesh) return;
        sm.frustumCulled = false;
        const newBones = sm.skeleton.bones.map((b) => bodyBones.get(b.name) ?? b);
        sm.bind(new THREE.Skeleton(newBones, sm.skeleton.boneInverses), sm.bindMatrix);
      });
    }

    const mixer = new THREE.AnimationMixer(root);
    const byName = new Map(anims.animations.map((a) => [a.name, a]));
    const boneMap = new Map<string, THREE.Object3D>();
    root.traverse((o) => boneMap.set(o.name, o));
    let cartoon: CartoonRig | null = null;
    if (look === "cartoon") {
      cartoon = buildCartoonBody(
        root,
        (n) => {
          const b = boneMap.get(n);
          if (!b) throw new Error(`Tulang tidak ditemukan: ${n}`);
          return b;
        },
        { ...DEFAULT_CARTOON_COLORS, ...(JSON.parse(colorKey) as Partial<CartoonColors>) },
        JSON.parse(wardrobeKey) as Wardrobe,
        "shirt" in (JSON.parse(colorKey) as object),
      );
    }
    return { root, hairRoot, mixer, byName, boneMap, cartoon };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gltfs, model, look, colorKey, wardrobeKey, tint?.main, tint?.joints]);

  useLayoutEffect(() => {
    if (!rig) return;
    const { mixer, byName, boneMap } = rig;
    mixer.stopAllAction();
    const sorted = [...clips].sort((a, b) => a.at - b.at);
    let idx = -1;
    sorted.forEach((s, i) => {
      if (t >= s.at) idx = i;
    });
    if (idx < 0) idx = 0;
    const active = sorted[idx];
    const prev = idx > 0 ? sorted[idx - 1] : null;
    const fade = active.fade ?? 0.25;
    const w = prev ? Math.min(1, Math.max(0, (t - active.at) / Math.max(1e-3, fade))) : 1;

    const apply = (seg: ClipSegment, weight: number) => {
      const clip = byName.get(seg.clip);
      if (!clip || weight <= 0) return;
      const action = mixer.clipAction(clip);
      action.reset();
      action.play();
      action.setEffectiveWeight(weight);
      action.time = clipTime(seg, t, clip.duration);
    };
    if (prev && w < 1) apply(prev, 1 - w);
    apply(active, w);
    mixer.update(0);

    if (bones) {
      for (const [name, rot] of Object.entries(bones)) {
        const b = boneMap.get(name);
        if (!b || !rot) continue;
        b.rotateX(rot[0]);
        b.rotateY(rot[1]);
        b.rotateZ(rot[2]);
      }
    }
    if (rig.cartoon) applyFace(rig.cartoon, face);
    rig.root.updateMatrixWorld(true);
    // ThreeCanvas hanya menggambar saat frame berganti; model dimuat async,
    // jadi gambar ulang di sini lalu lepaskan delayRender.
    advance(performance.now());
    if (!released.current) {
      released.current = true;
      continueRender(handle);
    }
  }, [rig, t, clips, bones, face, advance, handle]);

  if (!rig) return null;
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <primitive object={rig.root} />
      {rig.hairRoot ? <primitive object={rig.hairRoot} /> : null}
    </group>
  );
};
