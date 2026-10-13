#!/usr/bin/env python3
"""美术2：战斗氛围层素材 /workspace/atmo_gen/*.jpg（黑底）→ assets/atmo/*.webp（亮度 alpha + unmultiply，q75/alpha 50；vignette q60）
fog_front / vignette_ground：宽 390（vignette 保持原比例全幅，不裁切；fog 裁到有内容的竖向范围）
ring_hero / ring_enemy：bbox 裁切后宽 160"""
import os
import numpy as np
from PIL import Image
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'); SRC = os.environ.get('ATMO_SRC', '/workspace/atmo_gen')
OUT = os.path.join(R, 'assets', 'atmo'); os.makedirs(OUT, exist_ok=True)
JOBS = {'fog_front': (390, 'rows'), 'vignette_ground': (390, None), 'ring_hero': (160, 'bbox'), 'ring_enemy': (160, 'bbox')}
LO, HI = 0.03, 0.45

def key(path):
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.float32) / 255
    al = np.clip((a.max(2) - LO) / (HI - LO), 0, 1)
    rgb = np.where(al[..., None] >= 1, a, np.clip(a / np.maximum(al[..., None], 1e-3), 0, 1))
    return Image.fromarray((np.dstack([rgb, al]) * 255).astype(np.uint8), 'RGBA'), al

for n, (w, crop) in JOBS.items():
    im, al = key(f'{SRC}/{n}.jpg')
    if crop == 'bbox':
        ys, xs = np.where(al > 0.03); im = im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    elif crop == 'rows':
        ys = np.where(al.max(1) > 0.03)[0]; im = im.crop((0, ys.min(), im.width, ys.max() + 1))
    im = im.resize((w, max(1, round(im.height * w / im.width))), Image.LANCZOS)
    o = f'{OUT}/{n}.webp'; q, aq = (60, 35) if n == 'vignette_ground' else (75, 50)  # 体积：vignette 边缘细节多，略降质量
    im.save(o, 'WEBP', quality=q, alpha_quality=aq, method=6); print(o, im.size, os.path.getsize(o))
