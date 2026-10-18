#!/usr/bin/env python3
"""美术2：5 职业流派套装/暗金手绘图 -> assets/icon2/cls/<key>.webp (128x128 透明)
源：/workspace/cls_gen/<key>.jpg（GenerateImage 黑底）。亮度 alpha + unmultiply，bbox 裁切 +8% 边距，方形画布。"""
import sys, os, glob
import numpy as np
from PIL import Image
SRC = sys.argv[1] if len(sys.argv) > 1 else '/workspace/cls_gen'
DST = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets', 'icon2', 'cls')
SIZE, PAD, LO, HI = 128, 0.08, 0.04, 0.30
def proc(path):
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.float32) / 255
    alpha = np.clip((a.max(axis=2) - LO) / (HI - LO), 0, 1)
    rgb = np.where(alpha[..., None] > 0, np.clip(a / np.maximum(alpha[..., None], 1e-3), 0, 1), 0)
    rgb = np.where(alpha[..., None] >= 1, a, rgb)
    ys, xs = np.where(alpha > 0.05)
    img = Image.fromarray((np.dstack([rgb, alpha]) * 255).astype(np.uint8), 'RGBA').crop((xs.min(), ys.min(), xs.max()+1, ys.max()+1))
    side = int(max(img.size) * (1 + 2 * PAD))
    can = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    can.paste(img, ((side - img.width) // 2, (side - img.height) // 2))
    return can.resize((SIZE, SIZE), Image.LANCZOS)
os.makedirs(DST, exist_ok=True)
for p in sorted(glob.glob(os.path.join(SRC, '*.jpg'))):
    out = os.path.join(DST, os.path.basename(p)[:-4] + '.webp')
    im = proc(p); q = 80
    im.save(out, 'WEBP', quality=q, method=6)
    while os.path.getsize(out) > 8500 and q > 50:
        q -= 10; im.save(out, 'WEBP', quality=q, method=6)
    print(out, os.path.getsize(out))
