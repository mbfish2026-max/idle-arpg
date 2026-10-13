#!/usr/bin/env python3
"""美术2：野蛮人技能图标/特效  /workspace/bskill_gen/*.jpg → assets/skills/
图标 <id>.jpg：带手绘边框（宽或方）。按亮度找边框外接框 → 每边内缩 11%（去掉边框）→ 内区居中取正方形 → 128 webp（画面为彩绘底，保持不透明方图）
特效 fx_<id>.jpg：纯黑底 → 亮度 alpha + unmultiply → 内容 bbox → 补成正方形(+6%) → 256 透明 webp（单帧，播放一次）"""
import os, sys, glob
import numpy as np
from PIL import Image
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'); OUT = os.path.join(R, 'assets', 'skills')
SRC = os.environ.get('BSKILL_SRC', '/workspace/bskill_gen'); INSET = 0.11

def icon(p):
    im = Image.open(p).convert('RGB'); a = np.asarray(im).astype(np.float32).max(2)
    ys, xs = np.where(a > 40); x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    d = int(min(x1 - x0, y1 - y0) * INSET); x0, x1, y0, y1 = x0 + d, x1 - d, y0 + d, y1 - d
    s = min(x1 - x0, y1 - y0); cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
    return im.crop((cx - s // 2, cy - s // 2, cx - s // 2 + s, cy - s // 2 + s)).resize((128, 128), Image.LANCZOS)

def fx(p, lo=0.03, hi=0.45):
    a = np.asarray(Image.open(p).convert('RGB')).astype(np.float32) / 255
    al = np.clip((a.max(2) - lo) / (hi - lo), 0, 1)
    rgb = np.where(al[..., None] >= 1, a, np.clip(a / np.maximum(al[..., None], 1e-3), 0, 1))
    im = Image.fromarray((np.dstack([rgb, al]) * 255).astype(np.uint8), 'RGBA')
    ys, xs = np.where(al > 0.03); im = im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    s = int(max(im.size) * 1.06); c = Image.new('RGBA', (s, s), (0, 0, 0, 0)); c.paste(im, ((s - im.width) // 2, (s - im.height) // 2))
    return c.resize((256, 256), Image.LANCZOS)

os.makedirs(OUT, exist_ok=True)
for p in sorted(glob.glob(f'{SRC}/*.jpg')):
    n = os.path.basename(p)[:-4]; o = f'{OUT}/{n}.webp'
    if n.startswith('fx_'):
        im = fx(p)
        for q, aq in [(75, 50), (65, 40), (55, 30), (45, 25)]:  # 超过 25KB 时逐级降质量
            im.save(o, 'WEBP', quality=q, alpha_quality=aq, method=6)
            if os.path.getsize(o) <= 25000: break
    else: icon(p).save(o, 'WEBP', quality=78, method=6)
    print(n, os.path.getsize(o), flush=True)
