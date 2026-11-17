// Tampilan kartun (karakter "si biru" ber-kepala besar) yang ditempel ke kerangka
// Mannequin. Mesh asli disembunyikan; tiap bagian dibangun di ruang dunia pada
// pose diam (rest pose) dari posisi sendi asli, lalu di-`attach` ke tulangnya,
// sehingga ikut semua animasi rig. Wajah bisa diatur per frame lewat `applyFace`.

import * as THREE from "three";

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
  /** 0..1 mulut menguap */
  yawn?: number;
  /** 0..1 senyum */
  smile?: number;
  /** 0..1 alis turun (ngantuk) */
  sleepy?: number;
};

export type CartoonRig = {
  eyes: THREE.Object3D[];
  brows: THREE.Object3D[];
  smile: THREE.Mesh;
  yawnMouth: THREE.Mesh;
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
const buildHead = (c: CartoonColors) => {
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
  add(
    new THREE.SphereGeometry(0.48 * K, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.42),
    mat(c.hair, { roughness: 0.8, side: THREE.DoubleSide }),
    [0, 0, 0],
    [1, 1, 1],
    [-0.45, 0, 0],
  );
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

  const brows: THREE.Object3D[] = [];
  for (const s of [-1, 1]) {
    const b = add(new THREE.BoxGeometry(0.16 * K, 0.03 * K, 0.03 * K), mat(c.hair), [s * 0.16, 0.2, 0.42]);
    b.userData.side = s;
    brows.push(b);
  }
  for (const s of [-1, 1]) {
    add(
      new THREE.SphereGeometry(0.07 * K, 16, 12),
      mat("#f08a8a", { transparent: true, opacity: 0.7 }),
      [s * 0.27, -0.1, 0.35],
      [1, 0.6, 0.4],
    );
  }
  add(new THREE.SphereGeometry(0.045 * K, 16, 12), mat("#e8a983"), [0, -0.04, 0.46]);

  const smile = add(
    new THREE.TorusGeometry(0.07 * K, 0.018 * K, 8, 20, Math.PI * 0.75),
    mat("#7a2e2e"),
    [0, -0.18, 0.42],
    [1, 1, 1],
    [0, 0, Math.PI + Math.PI * 0.125],
  );
  const yawnMouth = add(
    new THREE.SphereGeometry(0.08 * K, 20, 16),
    mat("#5a1f22"),
    [0, -0.2, 0.41],
    [0.8, 0.5, 0.4],
  );
  yawnMouth.visible = false;

  return { head, rig: { eyes, brows, smile, yawnMouth } as CartoonRig };
};

/**
 * Sembunyikan mesh Mannequin lalu tempel tubuh kartun ke tulangnya.
 * Panggil sekali pada clone yang masih di rest pose (sebelum mixer berjalan).
 */
export const buildCartoonBody = (
  root: THREE.Object3D,
  bone: (name: string) => THREE.Object3D,
  colors: CartoonColors = DEFAULT_CARTOON_COLORS,
): CartoonRig => {
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.visible = false;
  });
  root.updateMatrixWorld(true);

  const P = (n: string) => worldPos(bone(n));
  const skin = mat(colors.skin, { roughness: 0.7 });
  const shirt = mat(colors.shirt, { roughness: 0.55 });
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
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.022, 10, 24), mat(colors.collar));
  collar.position.copy(P("neck_01"));
  collar.rotation.x = Math.PI / 2;
  attach("spine_03", collar);
  attach("neck_01", capsuleBetween(P("neck_01"), P("Head"), 0.05, skin));

  // kepala besar ala chibi
  const { head, rig } = buildHead(colors);
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
    attach(`lowerarm_${s}`, capsuleBetween(el, wr, 0.05, skin));
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

/** Terapkan ekspresi wajah (dipanggil tiap frame). */
export const applyFace = (rig: CartoonRig, face: FaceState = {}) => {
  const eyeOpen = Math.max(0.06, Math.min(1, face.eyeOpen ?? 1));
  const yawn = Math.max(0, Math.min(1, face.yawn ?? 0));
  const smile = Math.max(0, Math.min(1, face.smile ?? 0.4));
  const sleepy = Math.max(0, Math.min(1, face.sleepy ?? 0));
  for (const e of rig.eyes) e.scale.y = eyeOpen;
  for (const b of rig.brows) {
    const s = b.userData.side as number;
    b.rotation.z = s * (-0.1 - sleepy * 0.25);
    b.position.y = (0.2 - sleepy * 0.03) * K;
  }
  const yawning = yawn > 0.15;
  rig.yawnMouth.visible = yawning;
  rig.yawnMouth.scale.set(0.8, 0.5 + yawn, 0.4);
  rig.smile.visible = !yawning;
  rig.smile.scale.set(1, 0.5 + smile * 0.8, 1);
};
