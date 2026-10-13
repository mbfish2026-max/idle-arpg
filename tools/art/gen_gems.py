# 宝石(7色×5品级)、符文(33，号码+原创印记)、工匠图标 精灵表（原创 SVG/程序化）
import sys,os,random;sys.path.insert(0,os.path.dirname(__file__))
from render import R
from PIL import Image
C=128
GEMS=[('ame','#b060ff'),('top','#ffd040'),('sap','#4080ff'),('eme','#40d060'),('rub','#ff3030'),('dia','#f0f0ff'),('sku','#d0c8a0')]
def svg(inner,defs=''):return f'<svg xmlns="http://www.w3.org/2000/svg" width="{C}" height="{C}" viewBox="0 0 100 100" style="display:block"><defs>{defs}<filter id="sh"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity=".9"/></filter><filter id="bl"><feGaussianBlur stdDeviation="5"/></filter></defs>{inner}</svg>'
def gem(c,lv):
    s=.55+lv*.11;rnd=random.Random(lv*7+len(c))
    # 品级越高切面越多、越规整
    n=[5,6,7,8,10][lv];import math
    pts=[(50+38*s*math.cos(2*math.pi*i/n-math.pi/2)*(1 if lv>=3 else rnd.uniform(.75,1.05)),50+38*s*math.sin(2*math.pi*i/n-math.pi/2)*(1 if lv>=3 else rnd.uniform(.75,1.05))) for i in range(n)]
    inner=[(50+(x-50)*.5,48+(y-50)*.5) for x,y in pts]
    P=lambda L:' '.join(f'{x:.1f},{y:.1f}' for x,y in L)
    facets=''.join(f'<polygon points="{P([pts[i],pts[(i+1)%n],inner[(i+1)%n],inner[i]])}" fill="{c}" fill-opacity="{.35+.5*((i*37)%n)/n:.2f}"/>' for i in range(n))
    d=f'<radialGradient id="gg" cx="40%" cy="35%"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="{c}"/><stop offset="1" stop-color="#000"/></radialGradient>'
    glow=f'<circle cx="50" cy="50" r="{20+lv*6}" fill="{c}" opacity="{.08+lv*.08:.2f}" filter="url(#bl)"/>'
    spark='' if lv<4 else '<path d="M72 22 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 l6 -2Z" fill="#fff"/>'
    return svg(glow+f'<g filter="url(#sh)"><polygon points="{P(pts)}" fill="#000"/>{facets}<polygon points="{P(inner)}" fill="url(#gg)"/><polygon points="{P(pts)}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1"/></g>'+spark,d)
def skull(lv):
    s=.6+lv*.1;c=['#8a8070','#a89c84','#c8bca0','#e0d6bc','#fff4dc'][lv]
    eye=['#000','#300','#602020','#c03030','#ff4040'][lv]
    return svg(f'<circle cx="50" cy="50" r="{18+lv*6}" fill="{eye}" opacity="{lv*.1}" filter="url(#bl)"/><g filter="url(#sh)" transform="translate(50 50) scale({s}) translate(-50 -50)"><path d="M50 10 C76 10 86 30 84 50 C82 64 72 68 70 80 L30 80 C28 68 18 64 16 50 C14 30 24 10 50 10Z" fill="{c}" stroke="#1a120a" stroke-width="2"/><ellipse cx="36" cy="48" rx="9" ry="10" fill="#120806"/><ellipse cx="64" cy="48" rx="9" ry="10" fill="#120806"/><circle cx="36" cy="49" r="3" fill="{eye}"/><circle cx="64" cy="49" r="3" fill="{eye}"/><path d="M45 64 L50 56 L55 64Z" fill="#120806"/><path d="M34 74 L66 74" stroke="#120806" stroke-width="3" stroke-dasharray="3 2"/></g>'+('' if lv<4 else '<path d="M80 20 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 l6 -2Z" fill="#fff"/>'))
# 原创印记：在 3x3 节点网格上按种子连 3~5 笔，外加装饰点/弧（不使用任何既有符文字形）
def sigil(i):
    r=random.Random(9001+i*131);N=[(x,y) for y in (30,48,66) for x in (34,50,66)]
    seg=[];k=3+i%3
    a=r.randrange(9)
    for _ in range(k):
        b=r.choice([j for j in range(9) if j!=a]);seg.append((N[a],N[b]));a=b
    p=''.join(f'M{x1} {y1} L{x2} {y2} ' for (x1,y1),(x2,y2) in seg)
    if i%4==1:p+=f'M34 {r.choice((30,66))} Q50 {r.choice((20,76))} 66 {r.choice((30,66))} '
    dots=''.join(f'<circle cx="{N[j][0]}" cy="{N[j][1]}" r="2.6"/>' for j in r.sample(range(9),1+i%2))
    return p,dots
def rune(i):
    tier=0 if i<11 else 1 if i<22 else 2
    st=[('#8a8478','#3a362e','#ffd9a0'),('#4a4e5a','#16181e','#ffa040'),('#2a1c22','#060304','#ff3a2a')][tier]
    d=f'<linearGradient id="st" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{st[0]}"/><stop offset="1" stop-color="{st[1]}"/></linearGradient><linearGradient id="gd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a8"/><stop offset="1" stop-color="#8a5a1a"/></linearGradient>'
    r=random.Random(i);sh=f'M{20+r.randint(-3,3)} {16+r.randint(-3,3)} L{50} {8+r.randint(0,4)} L{80+r.randint(-3,3)} {16+r.randint(-3,3)} L{88+r.randint(-3,2)} {58+r.randint(-4,4)} L{70+r.randint(-3,3)} {90+r.randint(-3,2)} L{30+r.randint(-3,3)} {90+r.randint(-3,2)} L{12+r.randint(-2,3)} {58+r.randint(-4,4)}Z'
    p,dots=sigil(i)
    glow=f'<path d="{p}" stroke="{st[2]}" stroke-width="7" fill="none" opacity="{.25+tier*.2}" filter="url(#bl)"/>'
    num=f'<g transform="translate(76 80)"><circle r="13" fill="#0a0604" stroke="url(#gd)" stroke-width="2"/><text y="5" text-anchor="middle" font-family="DejaVu Serif" font-weight="bold" font-size="{14 if i<9 else 12}" fill="#ffe0a0">{i+1}</text></g>'
    return svg(f'<g filter="url(#sh)"><path d="{sh}" fill="url(#st)" stroke="#000" stroke-width="2"/><path d="{sh}" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width="2" transform="translate(50 50) scale(.9) translate(-50 -50)"/></g>{glow}<path d="{p}" stroke="#0a0604" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="{p}" stroke="{st[2]}" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><g fill="{st[2]}">{dots}</g>{num}',d)
G='<linearGradient id="gd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a8"/><stop offset="1" stop-color="#8a5a1a"/></linearGradient><linearGradient id="ir" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5a5a62"/><stop offset="1" stop-color="#16161a"/></linearGradient>'
CRAFT={
 'ess':svg('<circle cx="50" cy="52" r="30" fill="#b98cff" opacity=".35" filter="url(#bl)"/><g filter="url(#sh)"><path d="M38 20 L62 20 L58 34 Q78 44 74 66 Q70 88 50 88 Q30 88 26 66 Q22 44 42 34Z" fill="#2a1a3a" stroke="url(#gd)" stroke-width="3"/><path d="M30 64 Q50 56 70 64 Q68 84 50 84 Q32 84 30 64Z" fill="#b98cff"/><rect x="36" y="14" width="28" height="8" rx="2" fill="url(#gd)"/></g><circle cx="44" cy="70" r="3" fill="#fff" opacity=".8"/>',G),
 'cube':svg('<g filter="url(#sh)"><path d="M50 12 L84 30 L84 70 L50 88 L16 70 L16 30Z" fill="url(#ir)" stroke="url(#gd)" stroke-width="3"/><path d="M16 30 L50 48 L84 30 M50 48 L50 88" stroke="url(#gd)" stroke-width="2.5" fill="none"/><circle cx="50" cy="30" r="6" fill="#ff7a2a"/><path d="M28 50 L40 56 L40 70 L28 64Z M60 56 L72 50 L72 64 L60 70Z" fill="#ff7a2a" opacity=".6"/></g>',G),
 'anvil':svg('<g filter="url(#sh)"><path d="M14 36 L80 36 Q90 36 92 28 L92 46 Q80 50 72 52 L66 64 L76 80 L24 80 L34 64 L30 52 Q16 50 14 36Z" fill="url(#ir)" stroke="url(#gd)" stroke-width="2.5"/><rect x="40" y="14" width="10" height="26" fill="#4a2a14" transform="rotate(-30 45 27)"/><rect x="28" y="8" width="30" height="12" fill="url(#gd)" transform="rotate(-30 43 14)"/></g>',G),
 'socket':svg('<g filter="url(#sh)"><circle cx="50" cy="50" r="34" fill="url(#ir)" stroke="url(#gd)" stroke-width="3"/><circle cx="50" cy="50" r="14" fill="#050303" stroke="#000" stroke-width="2"/><path d="M50 8 L50 22 M50 78 L50 92 M8 50 L22 50 M78 50 L92 50" stroke="url(#gd)" stroke-width="4"/></g>',G),
 'scroll':svg('<g filter="url(#sh)"><rect x="24" y="20" width="52" height="62" fill="#c8b48a" stroke="#3a2410" stroke-width="2"/><rect x="18" y="14" width="64" height="10" rx="5" fill="url(#gd)"/><rect x="18" y="78" width="64" height="10" rx="5" fill="url(#gd)"/><path d="M32 36 H68 M32 48 H62 M32 60 H66" stroke="#5a3a1a" stroke-width="3"/><circle cx="62" cy="70" r="6" fill="#8a1a10"/></g>',G),
 'recycle':svg('<g filter="url(#sh)"><path d="M28 24 L72 24 L66 90 L34 90Z" fill="url(#ir)" stroke="url(#gd)" stroke-width="3"/><rect x="22" y="16" width="56" height="10" fill="url(#gd)"/><path d="M42 40 L44 80 M58 40 L56 80" stroke="#000" stroke-width="3"/><path d="M50 4 Q62 10 56 16" stroke="#ff7a2a" stroke-width="3" fill="none"/></g>',G),
}
if __name__=='__main__':
    os.makedirs('/workspace/idle-arpg/assets/icon',exist_ok=True)
    with R() as r:
        gs=Image.new('RGBA',(C*5,C*7))
        for gi,(k,c) in enumerate(GEMS):
            for lv in range(5):gs.paste(r.img(skull(lv) if k=='sku' else gem(c,lv),C,C),(lv*C,gi*C))
        gs.save('/workspace/idle-arpg/assets/icon/gems_sheet.webp','WEBP',quality=82,method=6);gs.save('/tmp/gems.png')
        rs=Image.new('RGBA',(C*11,C*3))
        for i in range(33):rs.paste(r.img(rune(i),C,C),((i%11)*C,(i//11)*C))
        rs.save('/workspace/idle-arpg/assets/icon/runes_sheet.webp','WEBP',quality=82,method=6);rs.save('/tmp/runes.png')
        cs=Image.new('RGBA',(C*len(CRAFT),C))
        for i,k in enumerate(CRAFT):cs.paste(r.img(CRAFT[k],C,C),(i*C,0))
        cs.save('/workspace/idle-arpg/assets/icon/craft_sheet.webp','WEBP',quality=82,method=6);cs.save('/tmp/craft.png')
    print('ok',list(CRAFT))
