#!/usr/bin/env python3
"""美术2：emoji→手绘图标 + map2 缩略图重画
icon3：/workspace/icon3_gen/<slug>.jpg（黑底）→ 亮度 alpha + unmultiply → bbox 裁切 +8% 边距 → 128 透明 webp（q80）
map2 ：/workspace/map2_gen/<name>.jpg（16:9）→ 居中裁 3:2 → 240x160 webp（q80），覆盖 assets/map2/<name>.webp"""
import os, glob
import numpy as np
from PIL import Image
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
ISRC = os.environ.get('ICON3_SRC', '/workspace/icon3_gen'); MSRC = os.environ.get('MAP2_SRC', '/workspace/map2_gen')
LO, HI, PAD, SIZE = 0.04, 0.30, 0.08, 128

def icon(path):
    im = Image.open(path).convert('RGB'); im.thumbnail((768, 768), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32) / 255
    al = np.clip((a.max(2) - LO) / (HI - LO), 0, 1)
    rgb = np.where(al[..., None] >= 1, a, np.clip(a / np.maximum(al[..., None], 1e-3), 0, 1))
    ys, xs = np.where(al > 0.05)
    out = Image.fromarray((np.dstack([rgb, al]) * 255).astype(np.uint8), 'RGBA').crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    side = int(max(out.size) * (1 + 2 * PAD)); can = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    can.paste(out, ((side - out.width) // 2, (side - out.height) // 2))
    return can.resize((SIZE, SIZE), Image.LANCZOS)

def thumb(path):
    im = Image.open(path).convert('RGB'); w, h = im.size
    if w / h > 1.5: cw = int(h * 1.5); im = im.crop(((w - cw) // 2, 0, (w - cw) // 2 + cw, h))
    else: ch = int(w / 1.5); im = im.crop((0, (h - ch) // 2, w, (h - ch) // 2 + ch))
    return im.resize((240, 160), Image.LANCZOS)

os.makedirs(os.path.join(R, 'assets', 'icon3'), exist_ok=True)
for p in sorted(glob.glob(f'{ISRC}/*.jpg')):
    o = os.path.join(R, 'assets', 'icon3', os.path.basename(p)[:-4] + '.webp'); icon(p).save(o, 'WEBP', quality=80, method=6); print(o, os.path.getsize(o))
for p in sorted(glob.glob(f'{MSRC}/*.jpg')):
    o = os.path.join(R, 'assets', 'map2', os.path.basename(p)[:-4] + '.webp'); thumb(p).save(o, 'WEBP', quality=80, method=6); print(o, os.path.getsize(o))
