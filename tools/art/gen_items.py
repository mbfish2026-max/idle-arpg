# 装备图标精灵表（原创 SVG）：行=类型(TYPES顺序)，列=底材档次(0普通 1扩展/精英前 2精英)
# 输出 assets/icon/equip_sheet.webp  每格 128x128
import sys,os;sys.path.insert(0,os.path.dirname(__file__))
from render import R
C=128
TYPES=['sword','axe','mace','polearm','spear','bow','xbow','wand','staff','dagger','shield','head','helm','armor','gloves','boots','belt','ring','amulet','scha','mcha','lcha','jewel','jav','throw']
T=[dict(m1='#5c6066',m2='#b8bcc0',tr='#6a5a48',tr2='#a89880',gem='#8a8a8a',hl='#d8dce0',grip='#4a3020',glow=None),
   dict(m1='#4a5868',m2='#dfe8f2',tr='#8a5a2a',tr2='#e0a860',gem='#4aa0ff',hl='#ffffff',grip='#3a2818',glow='#4aa0ff'),
   dict(m1='#24202c',m2='#8c84a0',tr='#9a6a1a',tr2='#ffe08a',gem='#ff3030',hl='#ffe9b0',grip='#2a1010',glow='#ff5a2a')]
def D(t):
    p=T[t];return f'''<defs><linearGradient id="m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{p['m2']}"/><stop offset=".5" stop-color="{p['m1']}"/><stop offset="1" stop-color="{p['m2']}"/></linearGradient>
<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{p['tr2']}"/><stop offset="1" stop-color="{p['tr']}"/></linearGradient>
<radialGradient id="j"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="{p['gem']}"/><stop offset="1" stop-color="#000"/></radialGradient>
<linearGradient id="w" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a1a0e"/><stop offset=".5" stop-color="{p['grip']}"/><stop offset="1" stop-color="#1a0e06"/></linearGradient>
<radialGradient id="aura"><stop offset="0" stop-color="{p['glow'] or '#000'}" stop-opacity="{.45 if t==2 else .25 if t==1 else 0}"/><stop offset="1" stop-color="{p['glow'] or '#000'}" stop-opacity="0"/></radialGradient>
<filter id="sh"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity=".9"/></filter></defs>'''
S='stroke="#0a0806" stroke-width="2"'
def gemc(x,y,r=5):return f'<circle cx="{x}" cy="{y}" r="{r}" fill="url(#j)" {S}/>'
def spikes(t,x,y,n=3):return '' if t<2 else ''.join(f'<path d="M{x-6+i*6} {y} l3 -8 l3 8Z" fill="url(#g)"/>' for i in range(n))
def diag(inner):return f'<g transform="rotate(45 50 50)">{inner}</g>'
def sword(t):
    w=8+t*2;orn=f'<path d="M50 12 L50 66" stroke="{T[t]["hl"]}" stroke-width="1" opacity=".7"/>'
    guard=['<rect x="36" y="66" width="28" height="5" fill="url(#g)" '+S+'/>','<path d="M32 70 Q50 60 68 70 L64 74 Q50 68 36 74Z" fill="url(#g)" '+S+'/>','<path d="M28 64 Q38 72 50 66 Q62 72 72 64 L70 74 Q50 70 30 74Z" fill="url(#g)" '+S+'/>'][t]
    return diag(f'<path d="M{50-w/2} 66 L{50-w/2} 16 L50 {6-t*2} L{50+w/2} 16 L{50+w/2} 66Z" fill="url(#m)" {S}/>{orn}{guard}<rect x="47" y="72" width="6" height="16" fill="url(#w)" {S}/><circle cx="50" cy="91" r="{4+t}" fill="url(#g)" {S}/>'+(gemc(50,69,3) if t else ''))
def axe(t):
    head=['<path d="M50 20 Q70 16 76 30 Q72 42 50 40Z"','<path d="M50 18 Q76 10 82 32 Q76 50 50 42Z"','<path d="M50 16 Q80 2 86 32 Q80 60 50 44 Q60 32 50 16Z"'][t]
    back='' if t==0 else f'<path d="M50 22 Q34 {22 if t==1 else 14} 28 {30} Q34 40 50 38Z" fill="url(#m)" {S}/>'
    return f'<g transform="rotate(20 50 50)"><rect x="47" y="12" width="6" height="80" rx="2" fill="url(#w)" {S}/>{head} fill="url(#m)" {S}/>{back}<rect x="45" y="24" width="10" height="12" fill="url(#g)" {S}/>{spikes(t,50,14)}</g>'
def mace(t):
    hd=[f'<rect x="38" y="12" width="24" height="26" rx="4" fill="url(#m)" {S}/>',f'<circle cx="50" cy="26" r="15" fill="url(#m)" {S}/>'+''.join(f'<path d="M{50+15*c} {26+15*s} l{6*c} {6*s}" stroke="url(#g)" stroke-width="5"/>' for c,s in [(1,0),(-1,0),(0,-1),(.7,.7),(-.7,.7),(.7,-.7),(-.7,-.7)]),
        f'<path d="M50 6 L64 18 L64 34 L50 44 L36 34 L36 18Z" fill="url(#m)" {S}/>'+''.join(f'<path d="M{x} {y} l{dx} {dy}" stroke="url(#g)" stroke-width="4"/>' for x,y,dx,dy in [(64,18,10,-6),(36,18,-10,-6),(64,34,10,6),(36,34,-10,6),(50,6,0,-6)])+gemc(50,26,6)][t]
    return f'<g transform="rotate(30 50 50)"><rect x="46" y="36" width="8" height="56" fill="url(#w)" {S}/><rect x="44" y="84" width="12" height="6" fill="url(#g)"/>{hd}</g>'
def polearm(t):
    bl=['<path d="M54 12 Q74 22 70 44 L54 40Z"','<path d="M54 8 Q82 20 74 50 L54 42 Z"','<path d="M54 4 Q88 18 78 54 L60 46 Q68 30 54 30Z"'][t]
    return f'<g transform="rotate(25 50 50)"><rect x="47" y="4" width="6" height="94" fill="url(#w)" {S}/>{bl} fill="url(#m)" {S}/><path d="M47 10 L40 4 L44 22Z" fill="url(#m)" {S}/><rect x="45" y="40" width="10" height="6" fill="url(#g)"/>{spikes(t,50,6,2)}</g>'
def spear(t):
    tip=['<path d="M50 2 L56 22 L50 28 L44 22Z"','<path d="M50 0 L58 20 L50 30 L42 20Z M42 22 L34 14 M58 22 L66 14"','<path d="M50 0 L58 22 L50 32 L42 22Z M42 24 Q30 20 32 8 Q38 18 46 18 M58 24 Q70 20 68 8 Q62 18 54 18"'][t]
    return diag(f'<rect x="47.5" y="26" width="5" height="72" fill="url(#w)" {S}/>{tip.replace("Z M","Z\" fill=\"url(#m)\" "+S+"/><path d=\"M",1) if t else tip} fill="url(#m)" {S}/><rect x="45" y="28" width="10" height="5" fill="url(#g)"/>'+('<path d="M53 34 Q66 40 60 54" stroke="#8a1a10" stroke-width="3" fill="none"/>' if t==2 else ''))
def bow(t):
    return f'<g transform="rotate(35 50 50)"><path d="M40 6 Q{78+t*4} 50 40 94" stroke="#0a0806" stroke-width="10" fill="none"/><path d="M40 6 Q{78+t*4} 50 40 94" stroke="url(#{"w" if t==0 else "m"})" stroke-width="6" fill="none"/><path d="M40 6 L40 94" stroke="#e8dcc0" stroke-width="1.2"/><rect x="{55+t*2}" y="42" width="8" height="16" fill="url(#g)" {S}/>'+('' if t==0 else f'<path d="M40 6 l-6 -2 M40 94 l-6 2" stroke="url(#g)" stroke-width="3"/>')+(gemc(59+t*2,50,3) if t==2 else '')+'</g>'
def xbow(t):
    return diag(f'<rect x="46" y="20" width="8" height="74" fill="url(#w)" {S}/><path d="M18 {34-t*2} Q50 {20-t*4} 82 {34-t*2}" stroke="#0a0806" stroke-width="8" fill="none"/><path d="M18 {34-t*2} Q50 {20-t*4} 82 {34-t*2}" stroke="url(#m)" stroke-width="5" fill="none"/><path d="M18 {34-t*2} L50 40 L82 {34-t*2}" stroke="#e8dcc0" stroke-width="1"/><rect x="44" y="36" width="12" height="10" fill="url(#g)" {S}/><path d="M50 12 L50 40" stroke="url(#m)" stroke-width="3"/>{gemc(50,60,3) if t else ""}')
def wand(t):
    top=['<circle cx="50" cy="14" r="6" fill="#d8ccb0" '+S+'/>','<path d="M50 4 L58 14 L50 24 L42 14Z" fill="url(#j)" '+S+'/>','<circle cx="50" cy="15" r="10" fill="#e8dcc4" '+S+'/><circle cx="46" cy="14" r="2.5" fill="#000"/><circle cx="54" cy="14" r="2.5" fill="#000"/><circle cx="50" cy="13" r="18" fill="url(#aura)"/>'][t]
    return diag(f'<path d="M47 22 L53 22 L52 90 L48 90Z" fill="{["#7a5a3a","#d8ccb0","#c8bca4"][t]}" {S}/>'+''.join(f'<rect x="46" y="{34+i*16}" width="8" height="3" fill="url(#g)"/>' for i in range(t+1))+top)
def staff(t):  # 权杖/法杖
    top=[f'<path d="M50 6 Q62 10 58 24 L42 24 Q38 10 50 6Z" fill="url(#m)" {S}/>',f'<path d="M50 2 L62 14 L56 26 L44 26 L38 14Z" fill="url(#g)" {S}/>'+gemc(50,14,5),
         f'<path d="M50 0 L56 8 L66 6 L62 18 L66 28 L34 28 L38 18 L34 6 L44 8Z" fill="url(#g)" {S}/>'+gemc(50,17,7)][t]
    return diag(f'<circle cx="50" cy="16" r="20" fill="url(#aura)"/><rect x="47" y="24" width="6" height="72" fill="url(#w)" {S}/>'+''.join(f'<rect x="45" y="{36+i*20}" width="10" height="4" fill="url(#g)"/>' for i in range(t+1))+top)
def dagger(t):
    return diag(f'<path d="M45 60 L45 {30-t*4} Q50 {14-t*4} 55 {30-t*4} L55 60Z" fill="url(#m)" {S}/><path d="M38 60 L62 60 L{60+t*4} 66 L{40-t*4} 66Z" fill="url(#g)" {S}/><rect x="47" y="66" width="6" height="18" fill="url(#w)" {S}/><path d="M50 84 L54 90 L50 96 L46 90Z" fill="url(#g)" {S}/>'+(gemc(50,63,3) if t else ''))
def shield(t):
    shape=['M50 10 Q74 14 80 18 Q80 66 50 90 Q20 66 20 18 Q26 14 50 10Z','M50 6 L82 14 Q82 66 50 94 Q18 66 18 14Z','M50 4 L86 12 Q86 40 76 60 Q64 82 50 96 Q36 82 24 60 Q14 40 14 12Z'][t]
    em=['<circle cx="50" cy="44" r="8" fill="url(#g)" '+S+'/>','<path d="M50 24 L50 72 M32 40 L68 40" stroke="url(#g)" stroke-width="6"/>','<path d="M50 20 L60 40 L50 76 L40 40Z" fill="url(#g)" '+S+'/>'+gemc(50,42,5)][t]
    return f'<path d="{shape}" fill="url(#m)" {S}/><path d="{shape}" fill="none" stroke="url(#g)" stroke-width="{3+t}" transform="translate(50 50) scale(.88) translate(-50 -50)"/>{em}'
def head(t):  # 缩颅
    return f'<path d="M50 10 C74 10 82 30 80 50 C78 68 68 74 64 86 L36 86 C32 74 22 68 20 50 C18 30 26 10 50 10Z" fill="{["#9a8a6a","#b8a888","#7a6a7a"][t]}" {S}/><ellipse cx="38" cy="50" rx="8" ry="9" fill="#120808"/><ellipse cx="62" cy="50" rx="8" ry="9" fill="#120808"/>'+(f'<circle cx="38" cy="50" r="3" fill="{T[t]["gem"]}"/><circle cx="62" cy="50" r="3" fill="{T[t]["gem"]}"/>' if t else '')+'<path d="M46 64 L50 58 L54 64Z" fill="#120808"/><path d="M38 78 L62 78" stroke="#120808" stroke-width="3" stroke-dasharray="3 2"/>'+('<path d="M30 20 Q50 0 70 20" stroke="url(#g)" stroke-width="4" fill="none"/>' if t else '')+spikes(t,50,14)+('<path d="M28 28 L18 8 L36 22Z M72 28 L82 8 L64 22Z" fill="url(#g)" '+S+'/>' if t==2 else '')
def helm(t):
    b=['M24 56 Q22 18 50 14 Q78 18 76 56 L70 82 L30 82Z','M22 58 Q20 14 50 10 Q80 14 78 58 L72 86 L28 86Z','M20 60 Q18 12 50 8 Q82 12 80 60 L72 90 L28 90Z'][t]
    return f'<path d="{b}" fill="url(#m)" {S}/><path d="M32 44 L68 44 L66 52 L54 52 L54 76 L46 76 L46 52 L34 52Z" fill="#0a0806"/><path d="M50 12 L50 42" stroke="url(#g)" stroke-width="{2+t*2}"/>'+(f'<path d="M24 56 Q50 66 76 56" stroke="url(#g)" stroke-width="4" fill="none"/>' if t else '')+('<path d="M22 30 Q6 20 10 2 Q18 18 30 22Z M78 30 Q94 20 90 2 Q82 18 70 22Z" fill="url(#g)" '+S+'/>'+gemc(50,30,4) if t==2 else '')
def armor(t):
    b='M26 18 L40 12 Q50 20 60 12 L74 18 L88 30 L80 44 L74 40 L74 88 L26 88 L26 40 L20 44 L12 30Z'
    return f'<path d="{b}" fill="url(#m)" {S}/><path d="M40 12 Q50 24 60 12" fill="none" stroke="url(#g)" stroke-width="3"/>'+(f'<path d="M26 54 L74 54 M26 70 L74 70" stroke="#0a0806" stroke-width="2"/>' if t==0 else f'<path d="M50 26 L50 88 M26 50 Q50 60 74 50" stroke="url(#g)" stroke-width="3" fill="none"/>')+(f'<path d="M12 30 Q20 10 34 16 L26 30Z M88 30 Q80 10 66 16 L74 30Z" fill="url(#g)" {S}/>'+gemc(50,40,6) if t==2 else '')
def gloves(t):
    return f'<path d="M30 92 L30 60 Q24 50 26 40 L30 24 Q34 18 38 24 L38 40 L40 16 Q45 10 48 16 L48 40 L52 14 Q57 8 60 14 L60 40 L64 20 Q69 14 72 20 L70 48 L80 40 Q88 40 84 50 L70 70 L70 92Z" fill="url(#m)" {S}/><rect x="28" y="76" width="44" height="{10+t*2}" fill="url(#g)" {S}/>'+(''.join(f'<path d="M{40+i*10} {24-i%2*2} l2 -7 l2 7" fill="url(#g)"/>' for i in range(3)) if t==2 else '')+(gemc(50,82,3) if t else '')
def boots(t):
    return f'<path d="M30 10 L58 10 L58 62 L84 72 Q90 80 84 90 L26 90 Q22 60 30 10Z" fill="url(#m)" {S}/><rect x="28" y="10" width="32" height="{8+t*2}" fill="url(#g)" {S}/><path d="M26 90 L86 90" stroke="url(#g)" stroke-width="4"/>'+(f'<path d="M58 40 L70 30 L66 46Z" fill="url(#g)" {S}/>' if t==2 else '')+(gemc(44,15+t,3) if t else '')
def belt(t):
    return f'<path d="M6 40 Q50 {30-t*2} 94 40 L94 {58+t*2} Q50 {50} 6 {58+t*2}Z" fill="{["#5a3a20","#4a3a3a","#2a2028"][t]}" {S}/>'+''.join(f'<rect x="{14+i*14}" y="{40}" width="8" height="12" fill="url(#m)" {S}/>' for i in range(6) if t)+f'<rect x="38" y="32" width="24" height="{30+t*2}" rx="3" fill="none" stroke="url(#g)" stroke-width="5"/><rect x="48" y="36" width="4" height="24" fill="url(#g)"/>'+(gemc(50,47,5) if t==2 else '')
def ring(t):return f'<ellipse cx="50" cy="58" rx="26" ry="24" fill="none" stroke="#0a0806" stroke-width="12"/><ellipse cx="50" cy="58" rx="26" ry="24" fill="none" stroke="url(#g)" stroke-width="8"/><path d="M38 34 L50 22 L62 34Z" fill="url(#g)" {S}/>{gemc(50,28,9)}'
def amulet(t):return f'<path d="M24 6 Q50 60 76 6" stroke="url(#g)" stroke-width="3" fill="none" stroke-dasharray="4 2"/><path d="M50 44 L70 62 L50 96 L30 62Z" fill="url(#g)" {S}/>{gemc(50,66,10)}'
def charm(sz):
    h=[40,62,84][sz];y0=50-h/2
    return f'<rect x="30" y="{y0}" width="40" height="{h}" rx="8" fill="#3a3024" {S}/><rect x="34" y="{y0+4}" width="32" height="{h-8}" rx="6" fill="none" stroke="url(#g)" stroke-width="2"/><path d="M50 {50-h/4} L{50+8} 50 L50 {50+h/4} L{42} 50Z" fill="url(#j)" {S}/><circle cx="50" cy="{y0+6}" r="3" fill="url(#g)"/>'
def jewel(t):return f'<path d="M50 14 L76 34 L66 82 L34 82 L24 34Z" fill="url(#j)" {S}/><path d="M50 14 L50 82 M24 34 L76 34 M34 82 L50 34 L66 82" stroke="#fff" stroke-opacity=".35" stroke-width="1.5" fill="none"/>'
def jav(t):return diag(f'<rect x="48" y="24" width="4" height="70" fill="url(#w)" {S}/><path d="M50 4 L55 26 L45 26Z" fill="url(#m)" {S}/><path d="M46 86 L40 98 M54 86 L60 98" stroke="#c8b890" stroke-width="3"/>')+f'<g transform="translate(14 0)">{diag(f"<rect x=48 y=30 width=4 height=60 fill=url(#w) {S}/><path d=\"M50 12 L55 32 L45 32Z\" fill=url(#m) {S}/>")}</g>'
def throw(t):return ''.join(f'<g transform="translate({dx} {dy}) scale(.7) translate(21 21)">{dagger(t)}</g>' for dx,dy in [(-12,-6),(12,6)])
F=dict(sword=sword,axe=axe,mace=mace,polearm=polearm,spear=spear,bow=bow,xbow=xbow,wand=wand,staff=staff,dagger=dagger,shield=shield,head=head,helm=helm,armor=armor,gloves=gloves,boots=boots,belt=belt,ring=ring,amulet=amulet,
       scha=lambda t:charm(0),mcha=lambda t:charm(1),lcha=lambda t:charm(2),jewel=jewel,jav=jav,throw=throw)
def tile(k,t):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{C}" height="{C}" viewBox="0 0 100 100" style="display:block">{D(t)}<circle cx="50" cy="50" r="48" fill="url(#aura)"/><g filter="url(#sh)">{F[k](t)}</g></svg>'
if __name__=='__main__':
    from PIL import Image
    sheet=Image.new('RGBA',(C*3,C*len(TYPES)))
    with R() as r:
        for i,k in enumerate(TYPES):
            for t in range(3): sheet.paste(r.img(tile(k,t),C,C),(t*C,i*C))
    os.makedirs('/workspace/idle-arpg/assets/icon',exist_ok=True)
    sheet.save('/workspace/idle-arpg/assets/icon/equip_sheet.webp','WEBP',quality=80,method=6)
    sheet.save('/tmp/equip.png');print(sheet.size,TYPES)
