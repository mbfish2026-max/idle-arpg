#!/usr/bin/env python3
"""游戏美术生成：调用 grsai 的 nano-banana-2.1 出图 → 下载原图 → 按用途处理成 webp 放进 assets/。

用法（单张）：
  python3 tools/gen_image.py --prompt "..." --out assets/icon3/potion_hp.webp --mode icon --size 128
  python3 tools/gen_image.py --prompt "..." --out assets/bg/a1_z0.webp --mode fit --size 512x768 --ratio 2:3
用法（批量）：--jobs jobs.json，内容为 [{"prompt":..,"out":..,"mode":..,"size":..,"ratio":..,"ref":[..]}, ...]

处理模式：
  icon  黑底图 → 按亮度抠透明（unmultiply 去黑边）→ 裁到内容 + 8% 边距 → 正方形 size×size（同 tools/art2/proc_icon3.py）
  fit   居中裁成目标宽高比 → 缩放到 size（宽x高）
  raw   不处理，只把原图转成 webp
密钥读取顺序：环境变量 GRSAI_API_KEY → ~/.config/grsai/api_key（不打印、不写进仓库）。
网络请求走系统代理（urllib 读取 HTTPS_PROXY），原图存 tools/gen_raw/（已加入 .gitignore）。
"""
import argparse, base64, io, json, os, sys, time, urllib.request
import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
RAW = os.path.join(ROOT, 'tools', 'gen_raw')
API = 'https://grsaiapi.com/v1/api/generate'
MODEL = 'nano-banana-2.1'
# 统一画风：与现有手绘美术一致（暗黑奇幻、手绘油画质感）；icon 模式要求纯黑底方便抠图
STYLE = 'dark fantasy hand-painted game art, painterly oil texture, dramatic lighting, rich detail, no text, no watermark, no border'
ICON_BG = 'single centered object on a pure black background (#000000), nothing else in the frame'


def api_key():
    k = os.environ.get('GRSAI_API_KEY')
    if not k:
        p = os.path.expanduser('~/.config/grsai/api_key')
        if os.path.exists(p):
            k = open(p).read().strip()
    if not k:
        sys.exit('找不到密钥：请设置 GRSAI_API_KEY，或写入 ~/.config/grsai/api_key')
    return k


def ref_data(r):
    if r.startswith('http'):
        return r
    with open(os.path.join(ROOT, r) if not os.path.isabs(r) else r, 'rb') as f:
        return 'data:image/%s;base64,' % (os.path.splitext(r)[1][1:] or 'png') + base64.b64encode(f.read()).decode()


def generate(prompt, ratio='1:1', size='1K', refs=(), tries=3):
    body = {'model': MODEL, 'prompt': prompt, 'images': [ref_data(r) for r in refs], 'aspectRatio': ratio, 'imageSize': size, 'replyType': 'json'}
    req = urllib.request.Request(API, data=json.dumps(body).encode(), headers={'Authorization': 'Bearer ' + api_key(), 'Content-Type': 'application/json'})
    for i in range(tries):
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                d = json.load(r)
            if d.get('status') == 'succeeded' and d.get('results'):
                return d['results'][0]['url']
            print('  生成失败：', d.get('status'), d.get('error', '')[:200])
            if d.get('status') == 'violation':
                return None
        except Exception as e:
            print('  请求出错（第 %d 次）：%s' % (i + 1, str(e)[:200]))
        time.sleep(3 * (i + 1))
    return None


def download(url):
    with urllib.request.urlopen(url, timeout=120) as r:
        return Image.open(io.BytesIO(r.read())).convert('RGB')


def proc_icon(im, side, lo=0.04, hi=0.30, pad=0.08):
    im = im.copy(); im.thumbnail((768, 768), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32) / 255
    al = np.clip((a.max(2) - lo) / (hi - lo), 0, 1)
    rgb = np.where(al[..., None] >= 1, a, np.clip(a / np.maximum(al[..., None], 1e-3), 0, 1))
    ys, xs = np.where(al > 0.05)
    if not len(xs):
        raise ValueError('图里没有内容（全黑）')
    out = Image.fromarray((np.dstack([rgb, al]) * 255).astype(np.uint8), 'RGBA').crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    s = int(max(out.size) * (1 + 2 * pad)); can = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    can.paste(out, ((s - out.size[0]) // 2, (s - out.size[1]) // 2), out)
    return can.resize((side, side), Image.LANCZOS)


def proc_fit(im, w, h):
    sw, sh = im.size; t = w / h
    if sw / sh > t:
        nw = int(sh * t); im = im.crop(((sw - nw) // 2, 0, (sw - nw) // 2 + nw, sh))
    else:
        nh = int(sw / t); im = im.crop((0, (sh - nh) // 2, sw, (sh - nh) // 2 + nh))
    return im.resize((w, h), Image.LANCZOS)


def run(job):
    out, mode = job['out'], job.get('mode', 'icon')
    prompt = job['prompt'] + '. ' + STYLE + ('. ' + ICON_BG if mode == 'icon' else '')
    ratio = job.get('ratio', '1:1')
    print('生成：', out)
    url = generate(prompt, ratio, job.get('res', '1K'), job.get('ref', []))
    if not url:
        print('  ✗ 没有拿到图片'); return False
    im = download(url)
    os.makedirs(RAW, exist_ok=True)
    raw = os.path.join(RAW, os.path.splitext(os.path.basename(out))[0] + '.png'); im.save(raw)
    size = str(job.get('size', '128'))
    if mode == 'icon':
        res = proc_icon(im, int(size))
    elif mode == 'fit':
        w, h = map(int, size.lower().split('x')); res = proc_fit(im, w, h)
    else:
        res = im
    dst = os.path.join(ROOT, out); os.makedirs(os.path.dirname(dst), exist_ok=True)
    res.save(dst, 'WEBP', quality=80, method=6)
    print('  ✓ 原图 %s → %s（%dx%d，%d 字节）' % (os.path.relpath(raw, ROOT), out, res.size[0], res.size[1], os.path.getsize(dst)))
    return True


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description='nano-banana-2.1 游戏美术生成')
    ap.add_argument('--prompt'); ap.add_argument('--out'); ap.add_argument('--mode', default='icon', choices=['icon', 'fit', 'raw'])
    ap.add_argument('--size', default='128'); ap.add_argument('--ratio', default='1:1'); ap.add_argument('--res', default='1K')
    ap.add_argument('--ref', action='append', default=[]); ap.add_argument('--jobs')
    a = ap.parse_args()
    jobs = json.load(open(a.jobs, encoding='utf-8')) if a.jobs else [{'prompt': a.prompt, 'out': a.out, 'mode': a.mode, 'size': a.size, 'ratio': a.ratio, 'res': a.res, 'ref': a.ref}]
    if any(not j.get('prompt') or not j.get('out') for j in jobs):
        sys.exit('每个任务都需要 prompt 和 out')
    ok = sum(run(j) for j in jobs)
    print('完成 %d/%d' % (ok, len(jobs)))
