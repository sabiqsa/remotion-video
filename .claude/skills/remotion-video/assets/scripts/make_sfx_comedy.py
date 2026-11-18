"""Efek suara komedi (tanpa dependency) → public/sfx/*.wav

Jalankan ulang:  python3 scripts/make_sfx_comedy.py

Semua file mono 44.1 kHz, puncak −6 dBFS (supaya selalu di bawah narasi),
dipadding hening sampai ≥0.5 dtk agar sempat diputar di preview.
"""

import math
import os
import random
import struct
import wave

SR = 44100
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "sfx")
PEAK = 0.5  # −6 dBFS


def write(name, samples):
    os.makedirs(OUT, exist_ok=True)
    pad = max(0, int(SR * 0.5) - len(samples))
    samples = list(samples) + [0.0] * pad
    peak = max(1e-9, max(abs(x) for x in samples))
    g = PEAK / peak
    # fade keluar 5 ms anti-klik
    n = len(samples)
    for i in range(min(220, n)):
        samples[n - 1 - i] *= i / 220
    with wave.open(os.path.join(OUT, name), "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, x * g)) * 32767)) for x in samples))


def env(t, a, d):
    return min(1.0, t / a) * math.exp(-max(0.0, t - a) / d) if a > 0 else math.exp(-t / d)


def lp_noise(n, alpha, seed):
    random.seed(seed)
    y, out = 0.0, []
    for _ in range(n):
        y += alpha * ((random.random() * 2 - 1) - y)
        out.append(y)
    return out


def whoosh():
    n = int(SR * 0.6)
    noise = lp_noise(n, 0.08, 1)
    return [noise[i] * math.sin(math.pi * i / n) ** 2 for i in range(n)]


def thud():
    n = int(SR * 0.35)
    out = []
    for i in range(n):
        t = i / SR
        f = 120 * math.exp(-t * 9) + 45
        out.append(math.sin(2 * math.pi * f * t) * env(t, 0.002, 0.09) + (random.random() * 2 - 1) * 0.3 * env(t, 0.001, 0.01))
    return out


def boing():
    n = int(SR * 0.55)
    out, ph = [], 0.0
    for i in range(n):
        t = i / SR
        f = 180 + 160 * math.sin(2 * math.pi * 9 * t) * math.exp(-t * 4) + 120 * math.exp(-t * 6)
        ph += 2 * math.pi * f / SR
        out.append(math.sin(ph) * env(t, 0.005, 0.22))
    return out


def burp():
    # "pop" bergetar rendah yang lucu, bukan suara sendawa sungguhan
    n = int(SR * 0.4)
    out, ph = [], 0.0
    for i in range(n):
        t = i / SR
        f = 95 + 25 * math.sin(2 * math.pi * 31 * t)
        ph += 2 * math.pi * f / SR
        v = math.sin(ph) + 0.4 * math.sin(2 * ph)
        out.append(v * env(t, 0.02, 0.12))
    return out


def srek():
    n = int(SR * 0.32)
    noise = lp_noise(n, 0.5, 7)
    out = []
    for i in range(n):
        t = i / SR
        grit = 0.6 + 0.4 * (1 if math.sin(2 * math.pi * 55 * t) > 0 else -1)
        out.append(noise[i] * grit * math.sin(math.pi * i / n))
    return out


def tick():
    n = int(SR * 0.06)
    return [math.sin(2 * math.pi * 1900 * i / SR) * env(i / SR, 0.0005, 0.012) for i in range(n)]


def ding():
    n = int(SR * 1.0)
    out = []
    for i in range(n):
        t = i / SR
        v = sum(a * math.sin(2 * math.pi * 1568 * r * t) * math.exp(-t / d) for r, a, d in ((1, 1, 0.5), (2.0, 0.4, 0.3), (2.76, 0.2, 0.18)))
        out.append(v * min(1, t / 0.002))
    return out


def pop():
    """'bloop' kartun: dua nada naik + badan rendah, cukup tebal agar terdengar di atas narasi."""
    n = int(SR * 0.22)
    out, ph1, ph2 = [], 0.0, 0.0
    for i in range(n):
        t = i / SR
        f1 = 380 + 900 * min(1, t / 0.06)
        f2 = 190 + 450 * min(1, t / 0.06)
        ph1 += 2 * math.pi * f1 / SR
        ph2 += 2 * math.pi * f2 / SR
        out.append((math.sin(ph1) + 0.7 * math.sin(ph2)) * env(t, 0.003, 0.07))
    return out


def slurp():
    """'sruput': desis sedotan dengan formant naik-turun + gelembung kecil."""
    n = int(SR * 0.55)
    random.seed(11)
    out, y1, y2, ph = [], 0.0, 0.0, 0.0
    for i in range(n):
        t = i / SR
        # resonator 2-kutub pada noise, frekuensi menyapu 700→1600→900 Hz
        f = 700 + 900 * math.sin(math.pi * min(1, t / 0.45))
        r = 0.985
        c = 2 * r * math.cos(2 * math.pi * f / SR)
        x = random.random() * 2 - 1
        y = x + c * y1 - r * r * y2
        y2, y1 = y1, y
        # gelembung: nada pendek berulang tak beraturan
        bub = 0.0
        if int(t * 22) % 3 == 0:
            ph += 2 * math.pi * (300 + 200 * random.random()) / SR
            bub = math.sin(ph) * 0.6
        amp = min(1, t / 0.04) * (1 - max(0, t - 0.4) / 0.15 if t > 0.4 else 1)
        out.append((y * 0.04 + bub * 0.5) * max(0, amp))
    return out


if __name__ == "__main__":
    for name, fn in [("whoosh", whoosh), ("thud", thud), ("boing", boing), ("burp", burp),
                     ("srek", srek), ("tick", tick), ("ding", ding), ("pop", pop), ("slurp", slurp)]:
        write(f"{name}.wav", fn())
    print("ok:", os.path.abspath(OUT))
