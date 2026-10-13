#!/usr/bin/env python3
"""美术2：野蛮人头盔 /workspace/bskill_gen/bh1..bh5.jpg（纯黑底）→ assets/icon2/bh1..bh5.webp
亮度 alpha + unmultiply → 内容 bbox → 补正方形(+8%) → 128 透明 webp"""
import os
import numpy as np
from PIL import Image
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'); SRC = os.environ.get('BHELM_SRC', '/workspace/bskill_gen')
for i in range(1, 6):
    a = np.asarray(Image.open(f'{SRC}/bh{i}.jpg').convert('RGB')).astype(np.float32) / 255
    al = np.clip((a.max(2) - 0.04) / 0.26, 0, 1)
    rgb = np.where(al[..., None] >= 1, a, np.clip(a / np.maximum(al[..., None], 1e-3), 0, 1))
    im = Image.fromarray((np.dstack([rgb, al]) * 255).astype(np.uint8), 'RGBA')
    ys, xs = np.where(al > 0.05); im = im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    s = int(max(im.size) * 1.16); c = Image.new('RGBA', (s, s), (0, 0, 0, 0)); c.paste(im, ((s - im.width) // 2, (s - im.height) // 2))
    o = os.path.join(R, 'assets', 'icon2', f'bh{i}.webp'); c.resize((128, 128), Image.LANCZOS).save(o, 'WEBP', quality=80, alpha_quality=70, method=6)
    print(o, os.path.getsize(o))
