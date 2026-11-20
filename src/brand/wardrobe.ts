// "Lemari baju" si biru: rambut, baju, dan aksesori yang dibangun lewat kode
// (bentuk dasar three.js) supaya gayanya konsisten dengan tubuh kartun & pas di
// kepala besar. Semua ukuran kepala dalam "satuan desain" (radius kepala 0.46),
// dikali K saat dipasang.

import * as THREE from "three";

export type HairStyle = "bowl" | "comma" | "spiky" | "curly" | "side" | "ponytail" | "bald";
export type Outfit = "tee" | "hoodie" | "shirt" | "jacket" | "doctor" | "bowtie" | "dino" | "chef";
export type Accessory =
  | "glasses_round"
  | "glasses_square"
  | "sunglasses"
  | "cap"
  | "mask"
  | "headphones"
  | "stethoscope"
  | "dino_hood"
  | "chef_hat";

export type Wardrobe = {
  hair?: HairStyle;
  outfit?: Outfit;
  accessories?: Accessory[];
};

export const HAIR_STYLES: HairStyle[] = ["bowl", "comma", "spiky", "curly", "side", "ponytail", "bald"];
export const OUTFITS: Outfit[] = ["tee", "hoodie", "shirt", "jacket", "doctor", "bowtie", "dino", "chef"];
export const ACCESSORIES: Accessory[] = [
  "glasses_round",
  "glasses_square",
  "sunglasses",
  "cap",
  "mask",
  "headphones",
  "stethoscope",
  "dino_hood",
  "chef_hat",
];

/** Warna baju bawaan tiap outfit (bisa ditimpa lewat `colors.shirt`). */
export const OUTFIT_COLORS: Record<Outfit, { main: string; accent: string }> = {
  tee: { main: "#2f7cf6", accent: "#ffffff" },
  hoodie: { main: "#ff8a3d", accent: "#ffe0c8" },
  shirt: { main: "#e9f2ff", accent: "#2f7cf6" },
  jacket: { main: "#3b5b8f", accent: "#ffffff" },
  doctor: { main: "#fbfbfb", accent: "#7fd1c8" },
  bowtie: { main: "#f5b83d", accent: "#ffffff" },
  dino: { main: "#5cc56b", accent: "#f6e7b0" },
  chef: { main: "#fbfbf7", accent: "#e3263b" },
};

/** warna duri piyama dino (punggung, ekor, tudung) */
export const DINO_SPIKE = "#ff9f1a";

export const mat = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra });

type Add = (
  geo: THREE.BufferGeometry,
  m: THREE.Material,
  pos: [number, number, number],
  scale?: [number, number, number],
  rot?: [number, number, number],
  parent?: THREE.Object3D,
) => THREE.Mesh;

/* -------------------------------- rambut -------------------------------- */

export const buildHair = (add: Add, K: number, style: HairStyle, color: string) => {
  const hair = mat(color, { roughness: 0.8, side: THREE.DoubleSide });
  const cap = (r: number, theta: number, tilt: number, sy = 1) =>
    add(new THREE.SphereGeometry(r * K, 40, 20, 0, Math.PI * 2, 0, Math.PI * theta), hair, [0, 0, 0], [1, sy, 1], [tilt, 0, 0]);

  switch (style) {
    case "bowl":
      cap(0.48, 0.42, -0.45);
      return;
    case "comma": {
      // comma hair: volume di atas, poni menyamping, ujungnya melengkung seperti koma
      cap(0.5, 0.47, -0.22, 1.06);
      const strands: [number, number, number, number][] = [
        [0.24, 0.36, 0.3, 0.75],
        [0.13, 0.33, 0.36, 0.65],
        [0.02, 0.3, 0.39, 0.55],
        [-0.09, 0.27, 0.4, 0.5],
        [-0.17, 0.24, 0.39, 0.45],
      ];
      for (const [x, y, z, rz] of strands) {
        add(new THREE.SphereGeometry(0.12 * K, 18, 14), hair, [x, y, z], [1.45, 0.55, 0.6], [0.15, 0, rz]);
      }
      // lengkung "koma" di dekat alis kiri
      add(new THREE.TorusGeometry(0.075 * K, 0.034 * K, 10, 24, Math.PI * 1.35), hair, [-0.25, 0.15, 0.39], [1, 1, 1], [0, 0.35, 0.9]);
      add(new THREE.SphereGeometry(0.045 * K, 14, 12), hair, [-0.2, 0.09, 0.42]);
      return;
    }
    case "spiky":
      cap(0.48, 0.38, -0.4);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const x = Math.cos(a) * 0.22;
        const z = Math.sin(a) * 0.18 - 0.02;
        add(new THREE.ConeGeometry(0.08 * K, 0.26 * K, 10), hair, [x, 0.48, z], [1, 1, 1], [z * 1.6, 0, -x * 1.6]);
      }
      add(new THREE.ConeGeometry(0.09 * K, 0.3 * K, 10), hair, [0, 0.52, 0.04]);
      return;
    case "curly": {
      cap(0.47, 0.4, -0.35);
      const pts: [number, number, number][] = [];
      for (let ring = 0; ring < 3; ring++) {
        const lat = 0.25 + ring * 0.38;
        const n = 10 - ring * 3;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + ring * 0.4;
          const y = Math.cos(lat) * 0.47;
          const rr = Math.sin(lat) * 0.47;
          const z = Math.sin(a) * rr;
          if (z > 0.3 && y < 0.3) continue; // jangan tutupi wajah
          pts.push([Math.cos(a) * rr, y + 0.05, z - 0.03]);
        }
      }
      for (const p of pts) add(new THREE.SphereGeometry(0.1 * K, 14, 12), hair, p);
      return;
    }
    case "side":
      cap(0.49, 0.44, -0.38);
      add(new THREE.SphereGeometry(0.2 * K, 20, 16), hair, [0.17, 0.36, 0.14], [1.7, 0.7, 1.15], [0, 0, -0.35]);
      add(new THREE.SphereGeometry(0.1 * K, 16, 12), hair, [-0.28, 0.27, 0.27], [1.2, 0.6, 0.7], [0, 0, 0.5]);
      return;
    case "ponytail":
      cap(0.49, 0.45, -0.3);
      add(new THREE.SphereGeometry(0.14 * K, 18, 14), hair, [0, 0.16, -0.5]);
      add(new THREE.TorusGeometry(0.06 * K, 0.02 * K, 8, 16), mat("#e3263b"), [0, 0.09, -0.56], [1, 1, 1], [0.3, 0, 0]);
      add(new THREE.CapsuleGeometry(0.075 * K, 0.36 * K, 6, 12), hair, [0, -0.13, -0.6], [1, 1, 1], [0.35, 0, 0]);
      return;
    case "bald":
      return;
  }
};

/* --------------------------- aksesori kepala --------------------------- */

export const buildHeadAccessories = (add: Add, K: number, list: Accessory[]) => {
  const frame = mat("#1b1b1f", { roughness: 0.4 });
  const lens = mat("#bfe6ff", { transparent: true, opacity: 0.25, roughness: 0.05 });
  const temples = () => {
    for (const s of [-1, 1]) {
      add(new THREE.BoxGeometry(0.02 * K, 0.025 * K, 0.42 * K), frame, [s * 0.4, 0.08, 0.22], [1, 1, 1], [0, s * 0.18, 0]);
    }
  };

  for (const a of list) {
    if (a === "glasses_round" || a === "glasses_square") {
      const square = a === "glasses_square";
      for (const s of [-1, 1]) {
        add(
          new THREE.TorusGeometry(0.105 * K, 0.016 * K, 8, square ? 4 : 28),
          frame,
          [s * 0.16, 0.06, 0.47],
          square ? [1.15, 0.85, 1] : [1, 1, 1],
          [0, 0, square ? Math.PI / 4 : 0],
        );
        add(new THREE.CircleGeometry(0.1 * K, 24), lens, [s * 0.16, 0.06, 0.465]);
      }
      add(new THREE.CylinderGeometry(0.012 * K, 0.012 * K, 0.11 * K, 8), frame, [0, 0.09, 0.47], [1, 1, 1], [0, 0, Math.PI / 2]);
      temples();
    }
    if (a === "sunglasses") {
      for (const s of [-1, 1]) {
        add(new THREE.SphereGeometry(0.11 * K, 20, 14), mat("#141418", { roughness: 0.15, metalness: 0.3 }), [s * 0.16, 0.07, 0.46], [1.25, 0.85, 0.25]);
      }
      add(new THREE.BoxGeometry(0.62 * K, 0.025 * K, 0.025 * K), frame, [0, 0.15, 0.47]);
      temples();
    }
    if (a === "dino_hood") {
      // tudung piyama dino: cangkang hijau menutup kepala atas, duri oranye di garis tengah,
      // dua mata dino bulat di depan atas, plus pipi tudung sampai ke samping wajah
      const g = mat("#5cc56b", { roughness: 0.75, side: THREE.DoubleSide });
      add(new THREE.SphereGeometry(0.53 * K, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.47), g, [0, 0.02, -0.02], [1, 1, 1], [-0.32, 0, 0]);
      add(new THREE.TorusGeometry(0.44 * K, 0.05 * K, 12, 40), g, [0, 0.14, 0.2], [1, 1, 1], [-0.95, 0, 0]);
      const spike = mat(DINO_SPIKE, { roughness: 0.5 });
      [
        [0.5, 0.14, 0.3],
        [0.53, -0.04, 0.32],
        [0.43, -0.24, 0.26],
        [0.25, -0.42, 0.2],
      ].forEach(([y, z, h], i) => {
        add(new THREE.ConeGeometry(0.075 * K, h * K, 16), spike, [0, y, z], [0.55, 1, 1], [-0.25 - i * 0.45, 0, 0]);
      });
      const white = mat("#ffffff", { roughness: 0.3 });
      const black = mat("#1b1b1f", { roughness: 0.2 });
      for (const s of [-1, 1]) {
        add(new THREE.SphereGeometry(0.075 * K, 18, 14), white, [s * 0.15, 0.47, 0.25]);
        add(new THREE.SphereGeometry(0.038 * K, 14, 10), black, [s * 0.15, 0.48, 0.32]);
      }
    }
    if (a === "chef_hat") {
      // topi koki: pita putih melingkar di dahi + "jamur" gembung dari 7 bola di atasnya
      const w = mat("#ffffff", { roughness: 0.85 });
      add(new THREE.CylinderGeometry(0.43 * K, 0.45 * K, 0.2 * K, 40, 1, true), mat("#f3f3ef", { roughness: 0.85, side: THREE.DoubleSide }), [0, 0.36, -0.03], [1, 1, 1], [-0.12, 0, 0]);
      add(new THREE.SphereGeometry(0.4 * K, 32, 20), w, [0, 0.62, -0.08], [1.08, 0.7, 1.02]);
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2;
        add(new THREE.SphereGeometry(0.2 * K, 20, 14), w, [Math.cos(ang) * 0.27, 0.66, Math.sin(ang) * 0.24 - 0.08]);
      }
      add(new THREE.SphereGeometry(0.22 * K, 20, 14), w, [0, 0.8, -0.08]);
    }
    if (a === "cap") {
      const c = mat("#e3263b", { roughness: 0.7, side: THREE.DoubleSide });
      add(new THREE.SphereGeometry(0.5 * K, 36, 18, 0, Math.PI * 2, 0, Math.PI * 0.44), c, [0, 0.02, 0], [1, 1, 1], [-0.28, 0, 0]);
      // paruh topi menjorok ke depan
      add(new THREE.CylinderGeometry(0.3 * K, 0.3 * K, 0.03 * K, 32), c, [0, 0.27, 0.46], [1, 1, 0.75], [0.18, 0, 0]);
      add(new THREE.SphereGeometry(0.04 * K, 12, 10), c, [0, 0.5, -0.12]);
    }
    if (a === "mask") {
      const m = mat("#a9dcff", { roughness: 0.8 });
      add(new THREE.SphereGeometry(0.3 * K, 28, 20), m, [0, -0.13, 0.3], [1.05, 0.72, 0.52]);
      for (const y of [-0.06, -0.13, -0.2]) {
        add(new THREE.BoxGeometry(0.42 * K, 0.008 * K, 0.01 * K), mat("#8cc8f0"), [0, y, 0.455 - Math.abs(y + 0.13) * 0.3]);
      }
      for (const s of [-1, 1]) {
        add(new THREE.TorusGeometry(0.08 * K, 0.008 * K, 6, 16), mat("#ffffff"), [s * 0.42, -0.06, 0.08], [1, 1, 1], [0, Math.PI / 2, 0]);
      }
    }
    if (a === "headphones") {
      const band = mat("#26282e", { roughness: 0.4 });
      add(new THREE.TorusGeometry(0.52 * K, 0.04 * K, 10, 32, Math.PI), band, [0, 0.02, -0.02], [1, 1.05, 1], [0, 0, 0]);
      for (const s of [-1, 1]) {
        add(new THREE.CylinderGeometry(0.15 * K, 0.15 * K, 0.11 * K, 24), band, [s * 0.5, 0, 0], [1, 1, 1], [0, 0, Math.PI / 2]);
        add(new THREE.CylinderGeometry(0.11 * K, 0.11 * K, 0.115 * K, 24), mat("#FFD400"), [s * 0.5, 0, 0], [1, 1, 1], [0, 0, Math.PI / 2]);
      }
    }
  }
};
