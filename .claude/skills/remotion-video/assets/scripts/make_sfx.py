"""Bangkitkan efek suara closing (tanpa dependency): public/sfx/click.wav.

Jalankan ulang:  python3 scripts/make_sfx.py
"""

import math
import os
import random
import struct
import wave

SR = 44100
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "sfx")


def write(name, samples):
    os.makedirs(OUT, exist_ok=True)
    peak = max(1e-9, max(abs(x) for x in samples))
    gain = 0.8 / peak
    with wave.open(os.path.join(OUT, name), "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(
            b"".join(struct.pack("<h", int(max(-1, min(1, x * gain)) * 32767)) for x in samples)
        )


def click():
    """Klik tombol bergaya 8-bit, cukup tebal agar terdengar di HP.

    Isi: transien noise + "tok" bernada (900 Hz turun) + blip square tinggi,
    lalu blip lepas yang lebih pelan. File dipanjangkan dengan hening sampai
    0.5 detik supaya pemutar audio di Studio/browser sempat memutarnya.
    """
    random.seed(7)
    n = int(SR * 0.5)
    out = []
    for i in range(n):
        t = i / SR
        s = 0.0
        for start, amp in ((0.0, 1.0), (0.06, 0.55)):
            tt = t - start
            if tt < 0:
                continue
            # badan "tok" (sinus, nada turun cepat)
            f_body = 900 * math.exp(-tt * 18) + 250
            s += amp * 0.9 * math.sin(2 * math.pi * f_body * tt) * math.exp(-tt / 0.03)
            # kilau 8-bit (square)
            f_hi = 2200 * math.exp(-tt * 25)
            sq = 1.0 if math.sin(2 * math.pi * f_hi * tt) >= 0 else -1.0
            s += amp * 0.35 * sq * math.exp(-tt / 0.012)
            # transien
            if tt < 0.003:
                s += amp * (random.random() * 2 - 1) * 0.8 * (1 - tt / 0.003)
        out.append(s)
    return out


if __name__ == "__main__":
    write("click.wav", click())
    print("ok:", os.path.abspath(OUT))
