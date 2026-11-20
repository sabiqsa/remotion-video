"""Efek suara komedi (tanpa dependency) → public/sfx/*.wav

Jalankan ulang:  python3 scripts/make_sfx_comedy.py

Semua file mono 44.1 kHz, puncak −6 dBFS (supaya selalu di bawah narasi),
dipadding hening sampai ≥0.5 dtk agar sempat diputar di preview.
"""

import math
import os
import random
import struct
import sys
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


def rain():
    """guyuran hujan sekali (±1.6 dtk): desis noise terang + tetesan acak, masuk cepat lalu reda."""
    n = int(SR * 1.6)
    low = lp_noise(n, 0.15, 7)
    random.seed(8)
    white = [random.random() * 2 - 1 for _ in range(n)]
    drops = [0.0] * n
    random.seed(9)
    for _ in range(90):
        at = random.randint(0, n - 2000)
        f = random.uniform(1800, 3800)
        a = random.uniform(0.3, 1.0)
        for k in range(1200):
            drops[at + k] += a * math.sin(2 * math.pi * f * k / SR) * math.exp(-k / 180)
    out = []
    for i in range(n):
        t = i / SR
        e = min(1.0, t / 0.12) * (1.0 if t < 0.9 else math.exp(-(t - 0.9) / 0.25))
        out.append(((white[i] - low[i]) * 0.55 + drops[i] * 0.25) * e)
    return out


def thunder():
    """petir: retakan tajam lalu gemuruh rendah ±1.4 dtk."""
    n = int(SR * 1.4)
    crack = lp_noise(n, 0.6, 11)
    rumble = lp_noise(n, 0.012, 12)
    out = []
    for i in range(n):
        t = i / SR
        c = crack[i] * math.exp(-t / 0.05)
        r = rumble[i] * 9 * min(1.0, t / 0.08) * math.exp(-t / 0.5)
        out.append(c * 0.8 + r)
    return out


def drip():
    """tetes air pertama 'plok': sinus menurun 1300→420 Hz."""
    n = int(SR * 0.12)
    out, ph = [], 0.0
    for i in range(n):
        t = i / SR
        f = 420 + 880 * math.exp(-t / 0.025)
        ph += 2 * math.pi * f / SR
        out.append(math.sin(ph) * env(t, 0.002, 0.03))
    return out


def coin():
    """koin 'tring': dua nada terang (B6 → E7) dengan sedikit harmonik, ekor pendek."""
    n = int(SR * 0.5)
    out = []
    for i in range(n):
        t = i / SR
        f = 1976 if t < 0.07 else 2637
        t2 = t if t < 0.07 else t - 0.07
        e = env(t2, 0.002, 0.06 if t < 0.07 else 0.16)
        out.append((math.sin(2 * math.pi * f * t) + 0.35 * math.sin(2 * math.pi * f * 2.01 * t)) * e * 0.8)
    return out


def buzz():
    """getar HP 'bzzt bzzt': dengung 170 Hz kasar, dua pulsa."""
    n = int(SR * 0.62)
    out = []
    for i in range(n):
        t = i / SR
        on = (0.0 <= t < 0.22) or (0.32 <= t < 0.54)
        if not on:
            out.append(0.0)
            continue
        tt = t if t < 0.27 else t - 0.32
        g = min(1.0, tt / 0.01) * min(1.0, (0.22 - tt) / 0.02)
        x = math.sin(2 * math.pi * 170 * t)
        x = max(-0.6, min(0.6, x * 1.8)) + 0.25 * math.sin(2 * math.pi * 340 * t)
        out.append(x * g)
    return out


def twitch():
    """'dug-dug' kedut: tiga ketukan rendah cepat (sinus 140→70 Hz)."""
    n = int(SR * 0.5)
    out = [0.0] * n
    for k, at in enumerate([0.0, 0.11, 0.22]):
        start = int(at * SR)
        ph = 0.0
        for i in range(int(SR * 0.09)):
            t = i / SR
            f = 70 + 70 * math.exp(-t / 0.02)
            ph += 2 * math.pi * f / SR
            if start + i < n:
                out[start + i] += math.sin(ph) * env(t, 0.002, 0.03) * (1 - 0.15 * k)
    return out


def glint():
    """kilau kacamata 'ting~': nada tinggi 3.1 kHz + 4.7 kHz dengan ekor berkilau."""
    n = int(SR * 0.55)
    out = []
    for i in range(n):
        t = i / SR
        e = env(t, 0.002, 0.18)
        shimmer = 1 + 0.25 * math.sin(2 * math.pi * 18 * t)
        out.append((math.sin(2 * math.pi * 3136 * t) + 0.5 * math.sin(2 * math.pi * 4699 * t)) * e * shimmer * 0.6)
    return out


def rocket():
    """roket 'fwoooosh': noise rendah naik ke terang selama ±0.9 dtk, lalu hilang."""
    n = int(SR * 0.95)
    lo = lp_noise(n, 0.08, 77)
    hi = lp_noise(n, 0.5, 78)
    out = []
    for i in range(n):
        t = i / SR
        u = t / 0.95
        mix = min(1.0, u * 1.4)
        g = min(1.0, t / 0.05) * (1 - u) ** 1.5
        out.append((lo[i] * 4 * (1 - mix) + hi[i] * 1.6 * mix) * g)
    return out


def crunch():
    """'kriuk' keripik/kuku: tiga retakan noise terang berurutan dengan klik tajam."""
    n = int(SR * 0.5)
    out = [0.0] * n
    hi = lp_noise(n, 0.85, 91)
    for k, at in enumerate([0.0, 0.07, 0.16]):
        a = int(at * SR)
        for i in range(int(SR * 0.06)):
            if a + i < n:
                t = i / SR
                out[a + i] += hi[a + i] * 2.2 * env(t, 0.001, 0.012) * (1 - 0.2 * k)
    return out


def squish():
    """'squish' squishy diremas: gelembung rendah turun + desis basah pendek."""
    n = int(SR * 0.5)
    noise = lp_noise(n, 0.25, 92)
    out, ph = [], 0.0
    for i in range(n):
        t = i / SR
        f = 260 - 160 * min(1.0, t / 0.25)
        ph += 2 * math.pi * f / SR
        tone = math.sin(ph) * env(t, 0.01, 0.12)
        wet = noise[i] * 1.5 * env(t, 0.005, 0.08)
        out.append(tone * 0.8 + wet)
    return out


def blow():
    """tiupan 'fuuuh': noise napas (pita 300–2.5 kHz) membengkak 0.08 dtk, bertahan, lalu reda ±0.75 dtk."""
    n = int(SR * 0.8)
    a = lp_noise(n, 0.35, 101)
    b = lp_noise(n, 0.06, 102)
    out = []
    for i in range(n):
        t = i / SR
        g = min(1.0, t / 0.08) * (1 - min(1.0, max(0.0, t - 0.35) / 0.45)) ** 1.6
        out.append((a[i] - b[i] * 1.2) * g)
    return out


def sneeze():
    """bersin 'ha-CHI!': tarikan napas naik (sinus 300→520 Hz + desis) lalu ledakan desis terang."""
    n = int(SR * 0.75)
    hi = lp_noise(n, 0.7, 111)
    soft = lp_noise(n, 0.2, 112)
    out, ph = [], 0.0
    for i in range(n):
        t = i / SR
        if t < 0.32:
            f = 300 + 220 * (t / 0.32)
            ph += 2 * math.pi * f / SR
            g = min(1.0, t / 0.05) * (0.35 + 0.65 * t / 0.32)
            out.append((math.sin(ph) * 0.35 + soft[i] * 0.9) * g * 0.55)
        else:
            u = t - 0.36
            out.append(hi[i] * 2.0 * env(max(0.0, u), 0.004, 0.09) if u >= 0 else 0.0)
    return out


def steam():
    """desis uap halus ±0.9 dtk (noise terang, masuk-keluar lembut)."""
    n = int(SR * 0.9)
    noise = lp_noise(n, 0.9, 121)
    return [noise[i] * math.sin(math.pi * i / n) ** 1.5 for i in range(n)]


def growl():
    """perut keroncongan 'krucuk~': dengung rendah 70–130 Hz bergelombang + gelembung pendek, ±1.1 dtk."""
    n = int(SR * 1.1)
    gurgle = lp_noise(n, 0.02, 131)
    out, ph = [], 0.0
    for i in range(n):
        t = i / SR
        f = 85 + 35 * math.sin(2 * math.pi * 3.2 * t) + 25 * t
        ph += 2 * math.pi * f / SR
        bub = 0.5 + 0.5 * math.sin(2 * math.pi * 11 * t + 2 * math.sin(2 * math.pi * 2.3 * t))
        g = min(1.0, t / 0.08) * (1 - min(1.0, max(0.0, t - 0.7) / 0.4)) ** 1.5
        tone = math.sin(ph) + 0.45 * math.sin(2 * ph) + 0.2 * math.sin(3 * ph)
        out.append((tone * (0.4 + 0.6 * bub) + gurgle[i] * 3) * g)
    return out


def huff():
    """dengus kesal 'hmph!': hembusan hidung pendek (desis rendah + dengung 160 Hz), ±0.35 dtk."""
    n = int(SR * 0.4)
    a = lp_noise(n, 0.25, 141)
    out, ph = [], 0.0
    for i in range(n):
        t = i / SR
        ph += 2 * math.pi * (170 - 60 * t) / SR
        g = env(t, 0.012, 0.11)
        out.append((a[i] * 1.6 + math.sin(ph) * 0.35) * g)
    return out


def sting():
    """hentakan syok 'DUN!': sub 55 Hz + akor rendah disonan (A1/D#2) dengan desis tabrakan, ekor ±1.0 dtk."""
    n = int(SR * 1.1)
    a = lp_noise(n, 0.5, 151)
    out = []
    for i in range(n):
        t = i / SR
        g = env(t, 0.006, 0.45)
        tone = (math.sin(2 * math.pi * 55 * t) * 0.9 + math.sin(2 * math.pi * 110 * t) * 0.45
                + math.sin(2 * math.pi * 77.8 * t) * 0.4 + math.sin(2 * math.pi * 155.6 * t) * 0.2)
        hit = a[i] * env(t, 0.002, 0.06) * 1.2
        out.append(tone * g * 0.7 + hit)
    return out


def kaching():
    """mesin kasir 'ka-ching!': klik mekanis + dua nada bel terang (E6 → B6) dengan ekor berkilau."""
    n = int(SR * 0.8)
    a = lp_noise(n, 0.9, 161)
    out = []
    for i in range(n):
        t = i / SR
        click = a[i] * env(t, 0.001, 0.012) * 1.4 + a[i] * env(max(0.0, t - 0.06), 0.001, 0.015) * (t > 0.06) * 1.0
        b = 0.0
        if t > 0.1:
            u = t - 0.1
            for f, w in ((1318.5, 0.6), (1975.5, 0.5), (2637.0, 0.25), (3951.0, 0.15)):
                b += math.sin(2 * math.pi * f * u) * w
            b *= env(u, 0.003, 0.22)
        out.append(click + b * 0.55)
    return out


if __name__ == "__main__":
    for name, fn in [("whoosh", whoosh), ("thud", thud), ("boing", boing), ("burp", burp),
                     ("srek", srek), ("tick", tick), ("ding", ding), ("pop", pop), ("slurp", slurp),
                     ("rain", rain), ("thunder", thunder), ("drip", drip),
                     ("coin", coin), ("buzz", buzz), ("twitch", twitch),
                     ("glint", glint), ("rocket", rocket),
                     ("crunch", crunch), ("squish", squish),
                     ("blow", blow), ("sneeze", sneeze), ("steam", steam),
                     ("growl", growl), ("huff", huff),
                     ("sting", sting), ("kaching", kaching)]:
        # python3 scripts/make_sfx_comedy.py rain thunder  → hanya file itu
        if len(sys.argv) > 1 and name not in sys.argv[1:]:
            continue
        write(f"{name}.wav", fn())
    print("ok:", os.path.abspath(OUT))
