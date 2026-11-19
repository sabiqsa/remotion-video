// Tampilan kartun (karakter "si biru" ber-kepala besar) yang ditempel ke kerangka
// Mannequin. Mesh asli disembunyikan; tiap bagian dibangun di ruang dunia pada
// pose diam (rest pose) dari posisi sendi asli, lalu di-`attach` ke tulangnya,
// sehingga ikut semua animasi rig. Wajah bisa diatur per frame lewat `applyFace`.

import * as THREE from "three";
import { buildHair, buildHeadAccessories, OUTFIT_COLORS, Wardrobe } from "./wardrobe";

export type { Accessory, HairStyle, Outfit, Wardrobe } from "./wardrobe";

export type CartoonColors = {
  skin: string;
  shirt: string;
  pants: string;
  shoes: string;
  hair: string;
  collar: string;
};

export const DEFAULT_CARTOON_COLORS: CartoonColors = {
  skin: "#f2c09b",
  shirt: "#2f7cf6",
  pants: "#283050",
  shoes: "#f4f4f4",
  hair: "#2b1d16",
  collar: "#ffffff",
};

export type FaceState = {
  /** 0 = terpejam, 1 = terbuka */
  eyeOpen?: number;
  /** 0..1 mulut menguap (lebar) */
  yawn?: number;
  /** 0..1 senyum */
  smile?: number;
  /** 0..1 cemberut / sedih (mulut melengkung ke bawah) */
  frown?: number;
  /** 0..1 mulut "O" (kaget, "waduh", "ah—") */
  open?: number;
  /** 0..1 meringis kesakitan (gigi terlihat, mata dipicingkan) */
  pain?: number;
  /** 0..1 alis turun (ngantuk) */
  sleepy?: number;
  /** 0..1 alis sedih/khawatir (ujung dalam naik) */
  sad?: number;
  /** 0..1 alis naik (kaget) */
  surprise?: number;
  /** 0..1 wajah & bibir pucat (sakit) */
  pale?: number;
  /** 0..1 pipi merona (malu/senang) */
  blush?: number;
  /** 0..1 tetes keringat di pelipis */
  sweat?: number;
  /** 0..1 kelopak mata KIRI (sisi +X karakter) menyempit: dipakai sebagai kedutan per ketukan */
  twitchL?: number;
  /** 0..1 kantung mata gelap (kurang tidur) */
  bags?: number;
};

export type CartoonRig = {
  eyes: THREE.Object3D[];
  brows: THREE.Object3D[];
  smile: THREE.Mesh;
  yawnMouth: THREE.Mesh;
  teeth: THREE.Object3D;
  sweat: THREE.Object3D;
  bags: THREE.MeshStandardMaterial;
  skinMats: THREE.MeshStandardMaterial[];
  lipMats: THREE.MeshStandardMaterial[];
  cheekMats: THREE.MeshStandardMaterial[];
  baseSkin: THREE.Color;
};

const HEAD_R = 0.23;
/** faktor dari desain karakter lama (radius kepala 0.46) */
const K = HEAD_R / 0.46;

const mat = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra });

const worldPos = (o: THREE.Object3D) => o.getWorldPosition(new THREE.Vector3());

/** Kapsul dari titik a ke b (ruang dunia). `from`/`to` 0..1 memotong sebagian ruas. */
const capsuleBetween = (
  a: THREE.Vector3,
  b: THREE.Vector3,
  radius: number,
  material: THREE.Material,
  from = 0,
  to = 1,
) => {
  const p0 = a.clone().lerp(b, from);
  const p1 = a.clone().lerp(b, to);
  const dir = p1.clone().sub(p0);
  const len = Math.max(0.001, dir.length());
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, len, 6, 16), material);
  mesh.position.copy(p0.clone().add(p1).multiplyScalar(0.5));
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return mesh;
};

const sphereAt = (p: THREE.Vector3, r: number, material: THREE.Material) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), material);
  m.position.copy(p);
  return m;
};

/** Bangun kepala kartun di ruang lokal (pusat kepala = 0,0,0, menghadap +Z). */
const buildHead = (c: CartoonColors, w: Wardrobe) => {
  const head = new THREE.Group();
  const skin = mat(c.skin, { roughness: 0.7 });
  const add = (
    geo: THREE.BufferGeometry,
    m: THREE.Material,
    pos: [number, number, number],
    scale: [number, number, number] = [1, 1, 1],
    rot: [number, number, number] = [0, 0, 0],
    parent: THREE.Object3D = head,
  ) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(pos[0] * K, pos[1] * K, pos[2] * K);
    mesh.scale.set(...scale);
    mesh.rotation.set(...rot);
    parent.add(mesh);
    return mesh;
  };

  add(new THREE.SphereGeometry(0.46 * K, 40, 32), skin, [0, 0, 0]);
  buildHair(add, K, w.hair ?? "bowl", c.hair);
  buildHeadAccessories(add, K, (w.accessories ?? []).filter((a) => a !== "stethoscope"));
  for (const s of [-1, 1]) {
    add(new THREE.SphereGeometry(0.1 * K, 16, 12), skin, [s * 0.45, 0, 0], [0.5, 1, 0.8]);
  }

  const eyes: THREE.Object3D[] = [];
  for (const s of [-1, 1]) {
    const g = new THREE.Group();
    g.position.set(s * 0.16 * K, 0.06 * K, 0.41 * K);
    head.add(g);
    add(new THREE.SphereGeometry(0.085 * K, 20, 16), mat("#ffffff", { roughness: 0.3 }), [0, 0, 0], [1, 1, 0.5], [0, 0, 0], g);
    add(new THREE.SphereGeometry(0.045 * K, 16, 12), mat("#1b1b1f", { roughness: 0.2 }), [0, -0.01, 0.035], [1, 1, 1], [0, 0, 0], g);
    eyes.push(g);
  }
  // kantung mata (tak terlihat sampai face.bags > 0)
  const bags = mat("#7b4f7a", { transparent: true, opacity: 0 });
  for (const s of [-1, 1]) {
    add(new THREE.SphereGeometry(0.07 * K, 16, 12), bags, [s * 0.16, -0.035, 0.405], [1.1, 0.35, 0.3]);
  }

  const brows: THREE.Object3D[] = [];
  for (const s of [-1, 1]) {
    const b = add(new THREE.BoxGeometry(0.16 * K, 0.03 * K, 0.03 * K), mat(c.hair), [s * 0.16, 0.2, 0.42]);
    b.userData.side = s;
    brows.push(b);
  }
  const cheek = mat("#f08a8a", { transparent: true, opacity: 0.7 });
  for (const s of [-1, 1]) {
    add(new THREE.SphereGeometry(0.07 * K, 16, 12), cheek, [s * 0.27, -0.1, 0.35], [1, 0.6, 0.4]);
  }
  add(new THREE.SphereGeometry(0.045 * K, 16, 12), mat("#e8a983"), [0, -0.04, 0.46]);

  const lip = mat("#7a2e2e");
  const inner = mat("#5a1f22");
  const smile = add(
    new THREE.TorusGeometry(0.07 * K, 0.018 * K, 8, 20, Math.PI * 0.75),
    lip,
    [0, -0.18, 0.42],
    [1, 1, 1],
    [0, 0, Math.PI + Math.PI * 0.125],
  );
  const yawnMouth = add(new THREE.SphereGeometry(0.08 * K, 20, 16), inner, [0, -0.2, 0.41], [0.8, 0.5, 0.4]);
  yawnMouth.visible = false;

  // meringis: deretan gigi dibingkai bibir
  const teeth = new THREE.Group();
  teeth.position.set(0, -0.19 * K, 0.425 * K);
  head.add(teeth);
  add(new THREE.BoxGeometry(0.17 * K, 0.06 * K, 0.03 * K), lip, [0, 0, 0], [1, 1, 1], [0, 0, 0], teeth);
  add(new THREE.BoxGeometry(0.15 * K, 0.04 * K, 0.035 * K), mat("#ffffff", { roughness: 0.3 }), [0, 0, 0.004], [1, 1, 1], [0, 0, 0], teeth);
  teeth.visible = false;

  // tetes keringat di pelipis
  const sweat = new THREE.Group();
  sweat.position.set(0.33 * K, 0.2 * K, 0.3 * K);
  head.add(sweat);
  const drop = mat("#8fd3ff", { roughness: 0.1, transparent: true, opacity: 0.9 });
  add(new THREE.SphereGeometry(0.035 * K, 14, 12), drop, [0, 0, 0], [1, 1, 1], [0, 0, 0], sweat);
  add(new THREE.ConeGeometry(0.033 * K, 0.06 * K, 12), drop, [0, 0.045, 0], [1, 1, 1], [0, 0, 0], sweat);
  sweat.visible = false;

  return {
    head,
    rig: {
      eyes,
      brows,
      smile,
      yawnMouth,
      teeth,
      sweat,
      bags,
      skinMats: [skin as THREE.MeshStandardMaterial],
      lipMats: [lip as THREE.MeshStandardMaterial, inner as THREE.MeshStandardMaterial],
      cheekMats: [cheek as THREE.MeshStandardMaterial],
      baseSkin: new THREE.Color(c.skin),
    } as CartoonRig,
  };
};

/** Warna digelapkan/diterangkan (f < 1 = lebih gelap). */
const shade = (m: THREE.MeshStandardMaterial, f: number) => "#" + m.color.clone().multiplyScalar(f).getHexString();

type Attach = (boneName: string, mesh: THREE.Object3D) => void;
type Pos = (n: string) => THREE.Vector3;
const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const boxAt = (p: THREE.Vector3, size: [number, number, number], m: THREE.Material, rot: [number, number, number] = [0, 0, 0]) => {
  const b = new THREE.Mesh(new THREE.BoxGeometry(...size), m);
  b.position.copy(p);
  b.rotation.set(...rot);
  return b;
};

/** Detail tiap outfit di depan/belakang badan (rest pose menghadap +Z). */
const buildOutfitDetails = (
  outfit: string,
  P: Pos,
  attach: Attach,
  main: THREE.MeshStandardMaterial,
  accent: THREE.Material,
) => {
  const neck = P("neck_01");
  const s3 = P("spine_03");
  const s2 = P("spine_02");
  const s1 = P("spine_01");
  const pelvis = P("pelvis");
  const FRONT = 0.18;
  if (outfit === "hoodie") {
    const rib = mat(shade(main, 0.82), { roughness: 0.75 });
    const string = mat("#fdf6ee", { roughness: 0.6 });
    // tudung: gundukan di belakang leher + bibir tudung melingkari leher (depan lebih rendah)
    const hoodBack = sphereAt(neck.clone().add(v3(0, -0.04, -0.11)), 0.17, main);
    hoodBack.scale.set(1.65, 0.72, 0.85);
    attach("spine_03", hoodBack);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.04, 14, 36), rib);
    rim.position.copy(neck.clone().add(v3(0, -0.07, 0.03)));
    rim.rotation.x = Math.PI / 2 - 0.75;
    attach("spine_03", rim);
    // tali tudung + ujung (aglet)
    for (const s of [-1, 1]) {
      const a = neck.clone().add(v3(s * 0.05, -0.15, 0.175));
      const b = a.clone().add(v3(s * 0.01, -0.17, 0.035));
      attach("spine_03", capsuleBetween(a, b, 0.011, string));
      const tip = capsuleBetween(b, b.clone().add(v3(0, -0.035, 0.005)), 0.014, string);
      attach("spine_03", tip);
    }
    // saku kanguru: lembaran melengkung mengikuti perut
    const pocket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.184, 0.19, 0.13, 32, 1, true, -0.8, 1.6),
      mat(shade(main, 0.78), { roughness: 0.75, side: THREE.DoubleSide }),
    );
    const pocketAt = pelvis.clone().lerp(s3, 0.42);
    pocket.position.copy(pocketAt);
    attach("spine_01", pocket);
    // bibir atas saku (garis tebal) supaya terbaca sebagai saku
    const lip = new THREE.Mesh(new THREE.TorusGeometry(0.187, 0.012, 8, 32, 1.6), rib);
    lip.position.copy(pocketAt.clone().add(v3(0, 0.065, 0)));
    lip.rotation.set(Math.PI / 2, 0, Math.PI / 2 - 0.8);
    attach("spine_01", lip);
    // rib bawah + manset
    const hem = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.03, 10, 36), rib);
    hem.position.copy(pelvis.clone().lerp(s3, 0.2));
    hem.rotation.x = Math.PI / 2;
    attach("spine_01", hem);
    for (const side of ["l", "r"]) {
      const el = P(`lowerarm_${side}`);
      const wr = P(`hand_${side}`);
      attach(`lowerarm_${side}`, capsuleBetween(el, wr, 0.067, rib, 0.78, 0.86));
    }
  }
  if (outfit === "shirt") {
    for (const s of [-1, 1]) {
      attach("spine_03", boxAt(neck.clone().add(v3(s * 0.05, -0.04, 0.09)), [0.09, 0.012, 0.07], main, [0.5, 0, s * 0.6]));
    }
    for (let i = 0; i < 4; i++) {
      const p = neck.clone().lerp(s1, 0.15 + i * 0.25).add(v3(0, 0, FRONT + 0.01));
      attach(i < 2 ? "spine_03" : "spine_01", sphereAt(p, 0.012, accent));
    }
  }
  if (outfit === "jacket") {
    // jaket terbuka: kaos putih di tengah + resleting
    attach("spine_03", boxAt(s3.clone().lerp(neck, 0.2).add(v3(0, 0, FRONT + 0.005)), [0.11, 0.26, 0.02], accent));
    attach("spine_01", boxAt(s1.clone().lerp(s2, 0.5).add(v3(0, 0, FRONT - 0.005)), [0.11, 0.2, 0.02], accent));
    for (const s of [-1, 1]) {
      attach("spine_03", boxAt(s3.clone().add(v3(s * 0.065, 0.02, FRONT + 0.012)), [0.012, 0.4, 0.012], mat("#c7ccd4", { metalness: 0.6 })));
    }
  }
  if (outfit === "doctor") {
    // jas dokter: dalaman scrub, kerah lancip, saku + pena, ekor jas sampai paha
    attach("spine_03", boxAt(s3.clone().lerp(neck, 0.15).add(v3(0, 0, FRONT + 0.005)), [0.1, 0.28, 0.02], accent));
    for (const s of [-1, 1]) {
      attach("spine_03", boxAt(s3.clone().add(v3(s * 0.07, 0.08, FRONT + 0.012)), [0.05, 0.22, 0.015], main, [0, 0, s * -0.35]));
      attach("pelvis", boxAt(pelvis.clone().add(v3(s * 0.1, -0.16, 0.13)), [0.16, 0.36, 0.04], main));
    }
    attach("spine_03", boxAt(s3.clone().add(v3(-0.1, -0.03, FRONT + 0.01)), [0.08, 0.09, 0.015], main));
    attach("spine_03", boxAt(s3.clone().add(v3(-0.1, 0.0, FRONT + 0.02)), [0.012, 0.09, 0.012], mat("#2f7cf6")));
  }
  if (outfit === "bowtie") {
    // kemeja lengan pendek: kerah putih kecil + dasi kupu-kupu merah di bawah dagu
    for (const s of [-1, 1]) {
      const sh = new THREE.Shape();
      sh.moveTo(s * 0.004, 0.035);
      sh.lineTo(s * 0.11, 0.035);
      sh.lineTo(s * 0.03, -0.06);
      sh.closePath();
      const flap = new THREE.Mesh(
        new THREE.ExtrudeGeometry(sh, { depth: 0.012, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.006, bevelSegments: 3 }),
        accent,
      );
      flap.position.copy(neck.clone().add(v3(s * 0.006, -0.07, 0.19)));
      flap.rotation.set(-0.75, s * 0.35, 0);
      flap.scale.setScalar(1.15);
      attach("spine_03", flap);
    }
    const red = mat("#e3263b", { roughness: 0.45 });
    const knotAt = neck.clone().add(v3(0, -0.12, 0.245));
    for (const s of [-1, 1]) {
      // sayap dasi: kerucut membulat, ujung runcing bertemu di simpul
      const wing = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.1, 24), red);
      wing.position.copy(knotAt.clone().add(v3(s * 0.052, 0, -0.006)));
      wing.rotation.set(0, 0, s * (Math.PI / 2));
      wing.scale.set(1, 1, 0.45);
      attach("spine_03", wing);
    }
    const knot = sphereAt(knotAt.clone().add(v3(0, 0, 0.01)), 0.028, red);
    knot.scale.set(1, 1.15, 0.8);
    attach("spine_03", knot);
  }
};

const buildStethoscope = (P: Pos, attach: Attach) => {
  const tube = mat("#26282e", { roughness: 0.5 });
  const metal = mat("#c7ccd4", { metalness: 0.8, roughness: 0.25 });
  const neck = P("neck_01");
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.012, 8, 28, Math.PI * 1.4), tube);
  ring.position.copy(neck.clone().add(v3(0, -0.02, 0.01)));
  ring.rotation.set(Math.PI / 2, 0, Math.PI * 0.3);
  attach("spine_03", ring);
  const a = neck.clone().add(v3(-0.09, -0.03, 0.08));
  const b = P("spine_02").clone().add(v3(0.04, 0.02, 0.2));
  attach("spine_03", capsuleBetween(a, b, 0.011, tube));
  const disk = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.015, 20), metal);
  disk.position.copy(b.clone().add(v3(0, -0.02, 0.01)));
  disk.rotation.x = Math.PI / 2;
  attach("spine_03", disk);
};

/**
 * Sembunyikan mesh Mannequin lalu tempel tubuh kartun ke tulangnya.
 * Panggil sekali pada clone yang masih di rest pose (sebelum mixer berjalan).
 */
export const buildCartoonBody = (
  root: THREE.Object3D,
  bone: (name: string) => THREE.Object3D,
  colors: CartoonColors = DEFAULT_CARTOON_COLORS,
  wardrobe: Wardrobe = {},
  /** true = warna baju dari `colors.shirt` (bukan warna bawaan outfit) */
  customShirt = false,
): CartoonRig => {
  const outfit = wardrobe.outfit ?? "tee";
  const oc = OUTFIT_COLORS[outfit];
  const shirtColor = customShirt || outfit === "tee" ? colors.shirt : oc.main;
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.visible = false;
  });
  root.updateMatrixWorld(true);

  const P = (n: string) => worldPos(bone(n));
  const skin = mat(colors.skin, { roughness: 0.7 });
  const shirt = mat(shirtColor, { roughness: 0.55 });
  const accent = mat(oc.accent, { roughness: 0.55 });
  const longSleeves = outfit === "hoodie" || outfit === "shirt" || outfit === "jacket" || outfit === "doctor";
  const pants = mat(colors.pants, { roughness: 0.7 });
  const shoes = mat(colors.shoes, { roughness: 0.5 });

  const attach = (boneName: string, mesh: THREE.Object3D) => {
    mesh.traverse((o) => (o.frustumCulled = false));
    bone(boneName).attach(mesh);
  };

  // pinggul + badan (dua ruas agar ikut membungkuk)
  const pelvis = sphereAt(P("pelvis"), 0.165, pants);
  pelvis.scale.set(1.15, 0.8, 0.95);
  attach("pelvis", pelvis);
  attach("spine_01", capsuleBetween(P("pelvis"), P("spine_03"), 0.175, shirt, 0.2, 1));
  attach("spine_03", capsuleBetween(P("spine_03"), P("neck_01"), 0.185, shirt, 0, 0.8));
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.022, 10, 24), outfit === "tee" ? mat(colors.collar) : accent);
  collar.position.copy(P("neck_01"));
  collar.rotation.x = Math.PI / 2;
  if (outfit !== "hoodie") attach("spine_03", collar);
  buildOutfitDetails(outfit, P, attach, shirt, accent);
  if ((wardrobe.accessories ?? []).includes("stethoscope")) buildStethoscope(P, attach);
  attach("neck_01", capsuleBetween(P("neck_01"), P("Head"), 0.05, skin));

  // kepala besar ala chibi
  const { head, rig } = buildHead(colors, wardrobe);
  rig.skinMats.push(skin);
  head.position.copy(P("Head").add(new THREE.Vector3(0, 0.17, 0.02)));
  attach("Head", head);

  for (const s of ["l", "r"]) {
    const sh = P(`upperarm_${s}`);
    const el = P(`lowerarm_${s}`);
    const wr = P(`hand_${s}`);
    const mid = P(`middle_01_${s}`);
    attach(`upperarm_${s}`, sphereAt(sh, 0.078, shirt));
    attach(`upperarm_${s}`, capsuleBetween(sh, el, 0.054, skin));
    attach(`upperarm_${s}`, capsuleBetween(sh, el, 0.07, shirt, 0, 0.55));
    if (longSleeves) {
      attach(`upperarm_${s}`, capsuleBetween(sh, el, 0.07, shirt, 0.5, 1));
      attach(`lowerarm_${s}`, capsuleBetween(el, wr, 0.062, shirt, 0, 0.85));
      attach(`lowerarm_${s}`, sphereAt(el, 0.066, shirt));
    } else {
      attach(`lowerarm_${s}`, capsuleBetween(el, wr, 0.05, skin));
    }
    attach(`hand_${s}`, sphereAt(wr.clone().lerp(mid, 0.6), 0.066, skin));

    const hip = P(`thigh_${s}`);
    const knee = P(`calf_${s}`);
    const ankle = P(`foot_${s}`);
    const ball = P(`ball_${s}`);
    attach(`thigh_${s}`, capsuleBetween(hip, knee, 0.1, pants));
    attach(`calf_${s}`, sphereAt(knee, 0.088, pants));
    attach(`calf_${s}`, capsuleBetween(knee, ankle, 0.08, pants));
    const toe = ball.clone().add(ball.clone().sub(ankle).multiplyScalar(0.5));
    const heel = ankle.clone().add(new THREE.Vector3(0, -0.04, 0));
    attach(`foot_${s}`, capsuleBetween(heel, toe, 0.068, shoes));
  }

  return rig;
};

const PALE_SKIN = new THREE.Color("#ebdcd0");
const LIP = new THREE.Color("#7a2e2e");
const LIP_PALE = new THREE.Color("#b99a93");
const INNER = new THREE.Color("#5a1f22");
const INNER_PALE = new THREE.Color("#8d6a66");
const c01 = (v: number | undefined, d: number) => Math.max(0, Math.min(1, v ?? d));

/** Terapkan ekspresi wajah (dipanggil tiap frame). */
export const applyFace = (rig: CartoonRig, face: FaceState = {}) => {
  const eyeOpen = Math.max(0.06, Math.min(1, face.eyeOpen ?? 1));
  const yawn = c01(face.yawn, 0);
  const smile = c01(face.smile, 0.4);
  const frown = c01(face.frown, 0);
  const open = c01(face.open, 0);
  const pain = c01(face.pain, 0);
  const sleepy = c01(face.sleepy, 0);
  const sad = c01(face.sad, 0);
  const surprise = c01(face.surprise, 0);
  const pale = c01(face.pale, 0);
  const blush = c01(face.blush, 0);
  const sweat = c01(face.sweat, 0);
  const twitchL = c01(face.twitchL, 0);
  const bags = c01(face.bags, 0);

  // mata: kesakitan → dipicingkan
  rig.eyes.forEach((e, i) => {
    const tw = i === 1 ? twitchL : 0;
    e.scale.y = Math.max(0.06, eyeOpen * (1 - pain * 0.75) * (1 - tw * 0.7));
  });
  rig.bags.opacity = bags * 0.75;

  // alis: ngantuk turun, sedih ujung dalam naik, kaget naik
  for (const b of rig.brows) {
    const s = b.userData.side as number;
    const tw = s > 0 ? twitchL : 0;
    b.rotation.z = s * (-0.1 - sleepy * 0.25 - sad * 0.5 + pain * 0.3 + tw * 0.25);
    b.position.y = (0.2 - sleepy * 0.03 + surprise * 0.06 + sad * 0.015 - tw * 0.04) * K;
  }

  // warna: pucat & merona
  for (const m of rig.skinMats) m.color.copy(rig.baseSkin).lerp(PALE_SKIN, pale * 0.8);
  rig.lipMats[0].color.copy(LIP).lerp(LIP_PALE, pale);
  rig.lipMats[1].color.copy(INNER).lerp(INNER_PALE, pale);
  for (const m of rig.cheekMats) m.opacity = Math.min(1, 0.7 * (1 - pale) + blush * 0.9);

  // mulut: prioritas meringis > menguap/O > senyum/cemberut
  const mouthOpen = Math.max(yawn, open);
  rig.teeth.visible = pain > 0.3;
  rig.yawnMouth.visible = !rig.teeth.visible && mouthOpen > 0.15;
  rig.yawnMouth.scale.set(yawn >= open ? 0.8 : 0.55 + 0.15 * open, yawn >= open ? 0.5 + yawn : 0.35 + 0.7 * open, 0.4);
  rig.smile.visible = !rig.teeth.visible && !rig.yawnMouth.visible;
  const curve = smile - frown; // >0 senyum, <0 cemberut
  if (curve >= 0) {
    rig.smile.rotation.z = Math.PI + Math.PI * 0.125;
    rig.smile.position.y = -0.18 * K;
  } else {
    rig.smile.rotation.z = Math.PI * 0.125;
    rig.smile.position.y = -0.23 * K;
  }
  rig.smile.scale.set(1, 0.5 + Math.abs(curve) * 0.8, 1);

  rig.sweat.visible = sweat > 0.05;
  rig.sweat.scale.setScalar(Math.max(0.01, sweat));
};
