# UI 9宫格纹理（黑铁底+金色镶边，原创 SVG），2x 分辨率 → assets/ui/*.png
import sys,os;sys.path.insert(0,os.path.dirname(__file__))
from render import R
D='''<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0b8"/><stop offset=".35" stop-color="#d6a446"/><stop offset=".7" stop-color="#7a5218"/><stop offset="1" stop-color="#c89440"/></linearGradient>
<linearGradient id="gh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7a5218"/><stop offset=".5" stop-color="#f6d78a"/><stop offset="1" stop-color="#7a5218"/></linearGradient>
<linearGradient id="ir" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2622"/><stop offset="1" stop-color="#0e0c0a"/></linearGradient>
<filter id="tx" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".6" numOctaves="3" seed="4"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .45  0 0 0 0 .4  0 0 0 .35 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
<radialGradient id="rv"><stop offset="0" stop-color="#ffe9a8"/><stop offset=".5" stop-color="#9a6a20"/><stop offset="1" stop-color="#2a1a06"/></radialGradient></defs>'''
def S(w,h,body):return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" style="display:block">{D}{body}</svg>'
def corner(x,y,sx,sy):
    return f'<g transform="translate({x} {y}) scale({sx} {sy})"><path d="M0 0 L44 0 L36 8 L14 8 Q8 8 8 14 L8 36 L0 44Z" fill="url(#g)" stroke="#1a0e02" stroke-width="1.5"/><path d="M14 14 L30 14 L14 30Z" fill="url(#g)" stroke="#1a0e02"/><circle cx="20" cy="20" r="4" fill="url(#rv)"/></g>'
# 面板 192x192 slice 60
P=192;panel=S(P,P,f'<rect x="4" y="4" width="{P-8}" height="{P-8}" rx="6" fill="url(#ir)"/><rect x="4" y="4" width="{P-8}" height="{P-8}" rx="6" filter="url(#tx)" fill="#fff"/>'
 f'<rect x="5" y="5" width="{P-10}" height="{P-10}" rx="6" fill="none" stroke="#000" stroke-width="4"/><rect x="9" y="9" width="{P-18}" height="{P-18}" rx="4" fill="none" stroke="url(#g)" stroke-width="4"/>'
 f'<rect x="17" y="17" width="{P-34}" height="{P-34}" fill="none" stroke="#7a5a28" stroke-width="1.5"/><rect x="20" y="20" width="{P-40}" height="{P-40}" fill="#0c0a08" fill-opacity=".55"/>'
 +corner(2,2,1,1)+corner(P-2,2,-1,1)+corner(2,P-2,1,-1)+corner(P-2,P-2,-1,-1)
 +''.join(f'<circle cx="{c}" cy="{e}" r="3" fill="url(#rv)"/>' for c in (P/2,) for e in (13,P-13))+''.join(f'<circle cx="{e}" cy="{P/2}" r="3" fill="url(#rv)"/>' for e in (13,P-13)))
# 按钮 96x64 slice 22；常态/按下(高亮)
def btn(on):
    a,b=('#6a4618','#2a1806') if on else ('#3a3430','#141210')
    return S(96,64,f'<linearGradient id="bf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{a}"/><stop offset="1" stop-color="{b}"/></linearGradient><rect x="2" y="2" width="92" height="60" rx="6" fill="#000"/><rect x="4" y="4" width="88" height="56" rx="5" fill="url(#bf)"/><rect x="4" y="4" width="88" height="56" rx="5" filter="url(#tx)" fill="#fff" opacity=".6"/>'
     f'<rect x="5" y="5" width="86" height="54" rx="5" fill="none" stroke="url(#g)" stroke-width="{3 if on else 2.5}"/><path d="M10 9 L86 9" stroke="#fff" stroke-opacity=".18" stroke-width="2"/>'
     +''.join(f'<path d="M{x} {y} l5 -5 l5 5 l-5 5Z" fill="url(#g)" stroke="#1a0e02"/>' for x,y in [(0,32),(86,32)])+(f'<rect x="4" y="4" width="88" height="56" rx="5" fill="none" stroke="#ffcc66" stroke-opacity=".5" stroke-width="6" style="filter:blur(3px)"/>' if on else ''))
# 标题条 240x56 slice 左右 56 / 上下 18
title=S(240,56,'<path d="M0 28 L22 6 L218 6 L240 28 L218 50 L22 50Z" fill="#000"/><path d="M4 28 L24 9 L216 9 L236 28 L216 47 L24 47Z" fill="url(#ir)"/><path d="M4 28 L24 9 L216 9 L236 28 L216 47 L24 47Z" filter="url(#tx)" fill="#fff"/>'
 '<path d="M4 28 L24 9 L216 9 L236 28 L216 47 L24 47Z" fill="none" stroke="url(#g)" stroke-width="3"/><path d="M30 14 L210 14 M30 42 L210 42" stroke="#7a5a28" stroke-width="1.2"/><path d="M12 28 l8 -8 l8 8 l-8 8Z M212 28 l8 -8 l8 8 l-8 8Z" fill="url(#g)" stroke="#1a0e02"/>')
# 底部导航 160x120 slice 上 40 左右 40 下 8
nav=S(160,120,'<rect width="160" height="120" fill="url(#ir)"/><rect width="160" height="120" filter="url(#tx)" fill="#fff"/><rect y="0" width="160" height="10" fill="#000"/><rect y="4" width="160" height="5" fill="url(#gh)"/><rect y="12" width="160" height="1.5" fill="#7a5a28"/>'
 '<path d="M0 4 L40 4 L48 18 L40 30 L0 30Z" fill="none"/>'+''.join(f'<circle cx="{x}" cy="22" r="3" fill="url(#rv)"/>' for x in (20,140))+'<path d="M64 9 L80 24 L96 9Z" fill="url(#g)" stroke="#1a0e02"/>')
out='/workspace/idle-arpg/assets/ui';os.makedirs(out,exist_ok=True)
with R() as r:
    for n,(s,w,h) in dict(panel_9s=(panel,192,192),btn_9s=(btn(0),96,64),btn_on_9s=(btn(1),96,64),title_9s=(title,240,56),nav_9s=(nav,160,120)).items():
        r.save(s,w,h,f'{out}/{n}.png')
print('ok')
