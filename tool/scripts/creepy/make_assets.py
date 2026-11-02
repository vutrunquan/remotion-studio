#!/usr/bin/env python3
"""Tạo tài nguyên dùng chung: hạt phim (public/fx/grain.png) và âm thanh tổng hợp (public/sfx/*.wav).
Chạy:  python3 tools/make_assets.py [--only grain|sfx]     (cần numpy, Pillow)"""
import sys, os, wave
import numpy as np

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
PUB = os.path.join(ROOT, 'public')
SR = 44100
rng = np.random.default_rng(41)


def make_grain():
    from PIL import Image
    os.makedirs(os.path.join(PUB, 'fx'), exist_ok=True)
    n = rng.normal(0.5, 0.22, (512, 512))
    # ít hạt sáng, nhiều hạt tối: dùng với mix-blend-mode: screen
    n = np.clip((n - 0.45) * 2.2, 0, 1) ** 1.6
    img = (n * 255).astype(np.uint8)
    Image.fromarray(img, 'L').save(os.path.join(PUB, 'fx', 'grain.png'), optimize=True)
    print('grain.png ok')


def write_wav(name, x, sr=SR):
    os.makedirs(os.path.join(PUB, 'sfx'), exist_ok=True)
    x = np.asarray(x, dtype=np.float64)
    peak = np.max(np.abs(x)) or 1
    x = x / peak * 0.89
    pcm = (x * 32767).astype(np.int16)
    with wave.open(os.path.join(PUB, 'sfx', name + '.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(pcm.tobytes())
    print(f'{name}.wav  {len(x)/sr:.2f}s')


def env_exp(n, tau):
    return np.exp(-np.arange(n) / (tau * SR))


def lp(x, fc):
    # lọc thông thấp một cực (đủ cho SFX)
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.zeros_like(x); s = 0.0
    for i in range(len(x)):
        s = (1 - a) * x[i] + a * s
        y[i] = s
    return y


def make_sfx():
    t = lambda d: np.arange(int(d * SR)) / SR
    # boom: sóng sin tụt tần + nhiễu trầm
    d = 2.4; tt = t(d)
    f = 38 + 90 * np.exp(-tt * 9)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(len(tt), 0.55)
    boom += 0.35 * lp(rng.normal(0, 1, len(tt)), 220) * env_exp(len(tt), 0.18) * 6
    write_wav('boom', boom)
    # hit: cú đập ngắn
    d = 0.7; tt = t(d)
    hit = np.sin(2 * np.pi * np.cumsum(60 + 140 * np.exp(-tt * 30)) / SR) * env_exp(len(tt), 0.12)
    hit += 0.5 * rng.normal(0, 1, len(tt)) * env_exp(len(tt), 0.012)
    write_wav('hit', hit)
    # glitch: nhiễu số vỡ vụn
    d = 0.55; n = int(d * SR); g = np.zeros(n)
    pos = 0
    while pos < n:
        seg = int(rng.integers(120, 2400))
        v = rng.choice([0, 1, 1, 2])
        if v == 0: block = np.zeros(seg)
        elif v == 1: block = np.sign(np.sin(2 * np.pi * rng.uniform(300, 3500) * np.arange(seg) / SR)) * rng.uniform(0.3, 1)
        else: block = rng.normal(0, 0.7, seg)
        g[pos:pos + seg] = block[:n - pos]
        pos += seg
    write_wav('glitch', g * (1 - np.linspace(0, 1, n) ** 2))
    # static: nhiễu trắng/hồng 1.2s
    d = 1.2; n = int(d * SR)
    st = rng.normal(0, 1, n); st = st - lp(st, 400) * 0.8
    write_wav('static', st * np.minimum(1, np.linspace(0, 12, n)) * np.linspace(1, 0.1, n))
    # whoosh
    d = 0.9; n = int(d * SR); w = rng.normal(0, 1, n)
    sw = np.zeros(n); fc0 = 200
    for blk in range(0, n, 441):
        fc = 300 + 5000 * np.sin(np.pi * blk / n) ** 2
        sw[blk:blk + 441] = lp(w[blk:blk + 441], fc)
    write_wav('whoosh', sw * np.sin(np.pi * np.arange(n) / n) ** 1.5)
    # tick
    d = 0.12; tt = t(d)
    write_wav('tick', np.sin(2 * np.pi * 1900 * tt) * env_exp(len(tt), 0.01) + 0.4 * np.sin(2 * np.pi * 950 * tt) * env_exp(len(tt), 0.02))
    # ding (đánh dấu tick xanh)
    d = 1.0; tt = t(d)
    write_wav('ding', (np.sin(2 * np.pi * 1318 * tt) + 0.5 * np.sin(2 * np.pi * 1975 * tt)) * env_exp(len(tt), 0.22) * (1 - np.exp(-tt * 800)))
    # shutter (chụp ảnh tư liệu)
    d = 0.35; n = int(d * SR); tt = t(d)
    sh = rng.normal(0, 1, n) * (env_exp(n, 0.006) + 0.7 * np.roll(env_exp(n, 0.008), int(0.09 * SR)))
    write_wav('shutter', sh * 0.8)
    # riser (căng thẳng dâng lên)
    d = 3.0; tt = t(d)
    rs = np.sin(2 * np.pi * np.cumsum(80 + 700 * (tt / d) ** 3) / SR) * (tt / d) ** 2
    rs += 0.3 * rng.normal(0, 1, len(tt)) * (tt / d) ** 3
    write_wav('riser', rs)
    # heartbeat
    d = 1.6; n = int(d * SR); hb = np.zeros(n)
    for off in (0.0, 0.28):
        k = int(off * SR); m = int(0.25 * SR); tt2 = np.arange(m) / SR
        hb[k:k + m] += np.sin(2 * np.pi * 55 * tt2) * np.exp(-tt2 * 18)
    write_wav('heartbeat', hb)
    # drone: nền trầm, lặp mượt 24s (mọi tần số là bội của 1/24 Hz => lặp liền mạch)
    d = 24.0; n = int(d * SR); tt = np.arange(n) / SR
    base = 1 / d
    dr = np.zeros(n)
    for k, a in ((round(55 / base), 1.0), (round(55.5 / base), 0.8), (round(82.4 / base), 0.35), (round(110.2 / base), 0.2)):
        dr += a * np.sin(2 * np.pi * k * base * tt + rng.uniform(0, 6.28))
    lfo = 0.75 + 0.25 * np.sin(2 * np.pi * 3 * base * tt)
    dr *= lfo
    hiss = rng.normal(0, 1, n); hiss = lp(hiss, 1800) - lp(hiss, 300)
    dr = dr / np.max(np.abs(dr)) + 0.12 * hiss / np.max(np.abs(hiss))
    write_wav('drone', dr * 0.9)


if __name__ == '__main__':
    only = sys.argv[2] if len(sys.argv) > 2 and sys.argv[1] == '--only' else None
    if only in (None, 'grain'): make_grain()
    if only in (None, 'sfx'): make_sfx()
