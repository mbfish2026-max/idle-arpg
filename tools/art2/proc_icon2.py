#!/usr/bin/env python3
"""美术2：手绘防具/饰品图 -> assets/icon2/{cat}_{n|x|e}.webp (128x128 透明)
源：/workspace/icon2_gen/{cat}_{normal|exceptional|elite|magic|unique}.jpg（黑底居中）
去黑底：亮度 alpha + unmultiply（辉光保持柔和）；bbox 裁切 +8% 边距；等比缩放进方形画布（不裁掉物体）。"""
import sys, os, glob
import numpy as np
from PIL import Image
SRC = sys.argv[1] if len(sys.argv) > 1 else '/workspace/icon2_gen'
DST = os.path.join(os.path.dirname(__file__), '..', '..', 'assets', 'icon2')
SIZE, PAD = 128, 0.08
TIER = {'normal': 'n', 'exceptional': 'x', 'elite': 'e', 'magic': 'x', 'unique': 'e'}
LO, HI = 0.04, 0.30  # 亮度阈值：<LO 全透明，>HI 不透明

def proc(path):
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.float32) / 255
    lum = a.max(axis=2)  # 用最大通道，避免暗色饱和物体被吃掉
    alpha = np.clip((lum - LO) / (HI - LO), 0, 1)
    rgb = np.where(alpha[..., None] > 0, np.clip(a / np.maximum(alpha[..., None], 1e-3), 0, 1), 0)
    rgb = np.where(alpha[..., None] >= 1, a, rgb)
    ys, xs = np.where(alpha > 0.05)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    img = Image.fromarray((np.dstack([rgb, alpha]) * 255).astype(np.uint8), 'RGBA').crop((x0, y0, x1, y1))
    side = int(max(img.size) * (1 + 2 * PAD))
    can = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    can.paste(img, ((side - img.width) // 2, (side - img.height) // 2))
    return can.resize((SIZE, SIZE), Image.LANCZOS)

os.makedirs(DST, exist_ok=True)
for p in sorted(glob.glob(os.path.join(SRC, '*.jpg'))):
    cat, lv = os.path.basename(p)[:-4].rsplit('_', 1)
    out = os.path.join(DST, f'{cat}_{TIER[lv]}.webp')
    proc(p).save(out, 'WEBP', quality=90, method=6)
    print(out)
