# 战斗/区域背景（原创 SVG 程序化）：720x1280 竖屏，webp q70
# 第一章每个区域一张 bg/a1_zXX.webp；二~五章每个大场景(章节×bg类型)各 2~3 张 bg/a{n}_{type}_{v}.webp
import sys,os,random,math,json;sys.path.insert(0,os.path.dirname(__file__))
from render import R
W,H=720,1280
PAL={ # 天空上, 天空下, 远景, 近景, 雾, 点光
 'moor':('#1a0c0a','#5a2a1a','#2a1812','#0e0806','#8a5a4a','#ff8a4a'),
 'cave':('#050406','#1a1418','#1c161a','#0a0808','#3a3040','#ffa040'),
 'grave':('#0a0c14','#2a3040','#1a1c24','#08090c','#6a7088','#c0d0ff'),
 'forest':('#06100a','#1a3020','#0e1a10','#040805','#4a6a50','#a0ff80'),
 'village':('#140808','#4a1a10','#20100c','#080404','#7a3a2a','#ff6020'),
 'tower':('#0a0812','#2a2040','#181424','#06050a','#5a4a70','#ff9050'),
 'monastery':('#100a08','#3a281c','#221810','#0a0604','#6a5040','#ffb060'),
 'jail':('#060505','#1a1412','#1a1412','#080606','#3a302a','#ff8030'),
 'cathedral':('#0a0408','#2a0e1a','#1e0e14','#080306','#5a2a3a','#ff4040'),
 'catacomb':('#050404','#16120e','#18140e','#070504','#3a3226','#d0a050'),
 'desert':('#3a1a08','#c07a30','#7a4a20','#2a1608','#d0a060','#ffe0a0'),
 'tomb':('#0a0806','#3a2a14','#2a1e0e','#0c0804','#6a5030','#ffc060'),
 'jungle':('#040a06','#16301a','#0c200e','#030604','#3a5a3a','#80ff60'),
 'temple':('#08100c','#20382a','#1a2a20','#060a08','#4a6a58','#60ffb0'),
 'hell':('#120202','#6a1004','#2a0604','#0a0202','#a02a10','#ff6a10'),
 'snow':('#0c1420','#5a7090','#3a4a60','#141a24','#c0d0e0','#ffffff'),
 'ice':('#06101a','#2a5a7a','#1a3a50','#081420','#80c0e0','#a0f0ff'),
}
def ridge(rnd,y0,amp,step=24,rough=.5):
    pts=[];y=y0
    for x in range(-20,W+40,step):
        y=y0+amp*math.sin(x/130+rnd.random()*.3)*.6+rnd.uniform(-amp,amp)*rough;pts.append((x,y))
    return 'M-20 %d '%H+' '.join(f'L{x} {y:.0f}' for x,y in pts)+f' L{W+40} {H} Z'
def tree(x,y,s,rnd,col):
    p=f'M{x} {y} L{x-4*s} {y-60*s} '
    br=''.join(f'M{x-2*s} {y-(30+i*12)*s} L{x+rnd.choice((-1,1))*rnd.uniform(18,40)*s} {y-(50+i*14)*s} ' for i in range(4))
    return f'<path d="{p}{br}" stroke="{col}" stroke-width="{5*s:.1f}" stroke-linecap="round" fill="none"/><path d="M{x-6*s} {y} L{x-2*s} {y-120*s} L{x+3*s} {y-120*s} L{x+7*s} {y}Z" fill="{col}"/>'+''.join(f'<path d="M{x} {y-(60+i*15)*s} q{d*30*s} {-20*s} {d*55*s} {-14*s}" stroke="{col}" stroke-width="{3*s:.1f}" fill="none"/>' for i,d in enumerate([1,-1,1,-1,1]))
def props(t,rnd,c,fg):
    o=''
    if t in('moor','village','grave','snow','desert'):pass
    if t=='grave':
        for i in range(9):
            x=rnd.randint(0,W);y=rnd.randint(1000,1220);s=rnd.uniform(.6,1.3)
            o+=rnd.choice([f'<path d="M{x-20*s} {y} L{x-20*s} {y-50*s} Q{x} {y-75*s} {x+20*s} {y-50*s} L{x+20*s} {y}Z" fill="{fg}"/>',f'<path d="M{x-4*s} {y} L{x-4*s} {y-80*s} M{x-24*s} {y-58*s} L{x+24*s} {y-58*s}" stroke="{fg}" stroke-width="{9*s:.0f}"/>'])
    if t in('forest','jungle','moor','grave'):
        n={'forest':9,'jungle':10,'moor':3,'grave':4}[t]
        for i in range(n):o+=tree(rnd.randint(-20,W+20),rnd.randint(1080,1280),rnd.uniform(1.4,3) if t!='moor' else rnd.uniform(1,1.6),rnd,fg)
        if t=='jungle':o+=''.join(f'<path d="M{rnd.randint(0,W)} 0 q{rnd.randint(-40,40)} 200 {rnd.randint(-30,30)} {rnd.randint(200,420)}" stroke="{fg}" stroke-width="5" fill="none"/>' for _ in range(10))
    if t in('cave','catacomb','jail','tomb','ice'):
        for i in range(14):
            x=rnd.randint(-20,W);w=rnd.randint(20,70);h=rnd.randint(60,260)
            o+=f'<path d="M{x} -5 L{x+w/2} {h} L{x+w} -5Z" fill="url(#pil)"/>'
    if t in('monastery','cathedral','tower','jail','catacomb','tomb','temple'):
        n=rnd.randint(3,5)
        for i in range(n):
            x=int((i+.5)*W/n)+rnd.randint(-20,20);w=rnd.randint(46,70)
            o+=f'<ellipse cx="{x+w/2+24}" cy="560" rx="60" ry="80" fill="{c[5]}" opacity=".35" filter="url(#gl)"/><path d="M{x+w/2+16} 600 l8 -26 l8 26Z" fill="{c[5]}"/><rect x="{x-w/2}" y="300" width="{w}" height="980" fill="url(#pil)"/><rect x="{x-w/2-10}" y="290" width="{w+20}" height="26" fill="{fg}"/><rect x="{x-w/2-10}" y="1060" width="{w+20}" height="30" fill="{fg}"/>'
        o+=f'<path d="M0 0 L{W} 0 L{W} 330 '+''.join(f'Q{(i+.5)*W/n} {120+rnd.randint(-20,20)} {i*W/n} 330 ' for i in range(n,0,-1))+'Z" fill="'+fg+'"/>'
    if t in('monastery','cathedral','tower','jail','catacomb','tomb','temple','cave','ice','hell'):
        o=f'<path d="M0 1280 L0 980 L{W} 980 L{W} 1280Z" fill="{c[2]}" opacity=".5"/>'+''.join(f'<path d="M{W/2+(i-6)*30} 980 L{W/2+(i-6)*160} 1280" stroke="#000" stroke-opacity=".35" stroke-width="2"/>' for i in range(13))+''.join(f'<path d="M0 {980+k*k*9} L{W} {980+k*k*9}" stroke="#000" stroke-opacity=".3" stroke-width="2"/>' for k in range(1,7))+o
    if t in('cathedral','monastery'):
        o+=f'<path d="M{W/2-70} 700 L{W/2-70} 520 Q{W/2} 400 {W/2+70} 520 L{W/2+70} 700Z" fill="{c[5]}" opacity=".18"/><circle cx="{W/2}" cy="520" r="40" fill="none" stroke="{c[5]}" stroke-opacity=".3" stroke-width="6"/>'
    if t in('tower','village'):
        x=rnd.randint(150,W-150);o+=f'<path d="M{x-60} 1100 L{x-50} 360 L{x-70} 360 L{x} 230 L{x+70} 360 L{x+50} 360 L{x+60} 1100Z" fill="{fg}"/>'+''.join(f'<rect x="{x-8}" y="{420+i*120}" width="16" height="30" fill="{c[5]}" opacity=".6"/>' for i in range(4))
    if t=='village':
        for i in range(5):
            x=rnd.randint(0,W);y=rnd.randint(1000,1150);s=rnd.uniform(1,1.8)
            o+=f'<path d="M{x-60*s} {y} L{x-60*s} {y-60*s} L{x-20*s} {y-110*s} L{x+10*s} {y-70*s} L{x+50*s} {y-90*s} L{x+60*s} {y}Z" fill="{fg}"/>'
            o+=f'<ellipse cx="{x}" cy="{y-80*s}" rx="{40*s}" ry="{70*s}" fill="{c[5]}" opacity=".12"/>'
    if t=='desert':
        x=rnd.randint(100,W-100);o+=f'<path d="M{x-220} 820 L{x} 560 L{x+220} 820Z" fill="{c[2]}" opacity=".7"/>'
        for i in range(3):o+=f'<path d="M{rnd.randint(0,W)} 1180 l0 -{rnd.randint(140,260)}" stroke="{fg}" stroke-width="{rnd.randint(14,22)}"/>'
    if t=='temple':
        o+=f'<path d="M{W/2-260} 900 L{W/2-200} 760 L{W/2+200} 760 L{W/2+260} 900Z M{W/2-180} 760 L{W/2-130} 640 L{W/2+130} 640 L{W/2+180} 760Z" fill="{fg}" opacity=".85"/>'
    if t=='hell':
        o+=''.join(f'<path d="M{rnd.randint(0,W)} {rnd.randint(980,1200)} q{rnd.randint(-80,80)} {rnd.randint(20,60)} {rnd.randint(100,260)} {rnd.randint(-10,40)}" stroke="#ff6a10" stroke-width="{rnd.randint(3,8)}" fill="none" opacity=".85" filter="url(#gl)"/>' for _ in range(10))
        o+=''.join(f'<path d="M{x} 1280 L{x+rnd.randint(20,50)} {rnd.randint(500,900)} L{x+rnd.randint(60,110)} 1280Z" fill="{fg}"/>' for x in rnd.sample(range(0,W,40),6))
    if t in('snow','ice'):
        o+=''.join(f'<path d="M{x} 700 L{x+rnd.randint(80,200)} {rnd.randint(330,560)} L{x+rnd.randint(250,380)} 700Z" fill="{c[2]}"/><path d="M{x+120} 470 l40 -60 l40 60 l-20 -10 l-20 20 l-20 -15Z" fill="#e8f0ff" opacity=".7"/>' for x in rnd.sample(range(-100,W,90),4))
        if t=='ice':o+=''.join(f'<path d="M{x} 1280 L{x+15} {rnd.randint(900,1100)} L{x+40} 1280Z" fill="{c[5]}" opacity=".25"/>' for x in rnd.sample(range(0,W,30),10))
    return o
def scene(t,seed,tint=0):
    rnd=random.Random(seed);c=PAL[t];fg=c[3]
    stars=''.join(f'<circle cx="{rnd.randint(0,W)}" cy="{rnd.randint(0,500)}" r="{rnd.uniform(.6,1.8):.1f}" fill="#fff" opacity="{rnd.uniform(.2,.7):.2f}"/>' for _ in range(60)) if t in('moor','grave','snow','forest','desert') else ''
    moon='' if t in('cave','jail','catacomb','tomb','hell') else f'<circle cx="{rnd.randint(120,W-120)}" cy="{rnd.randint(150,380)}" r="{rnd.randint(40,80)}" fill="{c[5]}" opacity=".55" filter="url(#gl)"/>'
    layers=''.join(f'<path d="{ridge(rnd,620+i*170,60-i*10,rough=.6)}" fill="{[c[2],c[2],fg][i]}" opacity="{[.55,.85,1][i]}"/>' for i in range(3))
    fog=f'<rect x="0" y="{rnd.randint(500,800)}" width="{W}" height="380" fill="{c[4]}" opacity=".22" filter="url(#fog)"/>'
    embers=''.join(f'<circle cx="{rnd.randint(0,W)}" cy="{rnd.randint(300,1280)}" r="{rnd.uniform(1,3):.1f}" fill="{c[5]}" opacity="{rnd.uniform(.3,.9):.2f}"/>' for _ in range(40 if t in('hell','village','cave','jail') else 0))
    snow=''.join(f'<circle cx="{rnd.randint(0,W)}" cy="{rnd.randint(0,H)}" r="{rnd.uniform(1,3.5):.1f}" fill="#fff" opacity="{rnd.uniform(.3,.8):.2f}"/>' for _ in range(120 if t in('snow','ice') else 0))
    hue=f'<feColorMatrix type="hueRotate" values="{tint}"/>' if tint else ''
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" style="display:block"><defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{c[0]}"/><stop offset=".55" stop-color="{c[1]}"/><stop offset="1" stop-color="{c[0]}"/></linearGradient>
<radialGradient id="vig" cx="50%" cy="45%" r="75%"><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".85"/></radialGradient>
<linearGradient id="pil" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="{fg}"/><stop offset=".3" stop-color="{c[2]}"/><stop offset=".7" stop-color="{fg}"/><stop offset="1" stop-color="#000"/></linearGradient>
<filter id="gl"><feGaussianBlur stdDeviation="14"/></filter>
<filter id="fog" x="-10%" y="-50%" width="120%" height="200%"><feTurbulence type="fractalNoise" baseFrequency=".004 .02" numOctaves="3" seed="{seed%97}"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.4 -.4"/><feComposite in2="SourceGraphic" operator="in"/><feGaussianBlur stdDeviation="8"/></filter>
<filter id="tex"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3" seed="{seed%31}"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .22 0"/></filter>
<filter id="all">{hue or '<feOffset/>'}</filter></defs>
<g filter="url(#all)"><rect width="{W}" height="{H}" fill="url(#sky)"/>{stars}{moon}{layers}{fog}{props(t,rnd,c,fg)}{embers}{snow}</g>
<rect width="{W}" height="{H}" filter="url(#tex)"/><rect width="{W}" height="{H}" fill="url(#vig)"/></svg>'''
if __name__=='__main__':
    import subprocess
    acts=json.loads(subprocess.check_output(['node','-e',"""const vm=require('vm');const c={console,localStorage:{getItem(){},setItem(){}}};c.window=c;vm.createContext(c);
for(const f of ['data.js','data_items.js','data_items2.js','data_acts.js'])vm.runInContext(require('fs').readFileSync(f,'utf8'),c);
vm.runInContext('console.log(JSON.stringify(ACTS.map(a=>a.zones.map(z=>z.bg.replace(\"bg_\",\"\")))))',c)"""],cwd='/workspace/idle-arpg'))
    out='/workspace/idle-arpg/assets/bg';os.makedirs(out,exist_ok=True);made={}
    only=sys.argv[1] if len(sys.argv)>1 else None
    with R() as r:
        for zi,t in enumerate(acts[0]):
            n=f'a1_z{zi:02d}';
            if only and only!=n:continue
            r.save(scene(t,1000+zi*17,tint=[0,-12,10,0,8,-8][zi%6]),W,H,f'{out}/{n}.webp',q=68);made[n]=t
        for ai in range(1,5):
            for t in sorted(set(acts[ai])):
                nv=3 if acts[ai].count(t)>=4 else 2
                for v in range(nv):
                    n=f'a{ai+1}_{t}_{v}'
                    if only and only!=n:continue
                    r.save(scene(t,ai*5000+hash(t)%1000+v*131,tint=[0,14,-14][v]),W,H,f'{out}/{n}.webp',q=68);made[n]=t
    print(len(made),made)
