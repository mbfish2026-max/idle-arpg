# 佣兵立绘（原创，SVG 程序化绘制）→ assets/merc/*.webp  512x640
import sys,os;sys.path.insert(0,os.path.dirname(__file__))
from render import R
W,H=512,640
def defs(bg1,bg2,glow,cloth1,cloth2,metal1,metal2,skin='#8a6a55',eye='#ffcf6a'):
    return f'''<defs>
<radialGradient id="bg" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="{bg1}"/><stop offset=".55" stop-color="{bg2}"/><stop offset="1" stop-color="#050404"/></radialGradient>
<radialGradient id="glow" cx="50%" cy="40%" r="50%"><stop offset="0" stop-color="{glow}" stop-opacity=".55"/><stop offset="1" stop-color="{glow}" stop-opacity="0"/></radialGradient>
<linearGradient id="cloth" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{cloth1}"/><stop offset="1" stop-color="{cloth2}"/></linearGradient>
<linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{metal1}"/><stop offset=".45" stop-color="{metal2}"/><stop offset=".55" stop-color="{metal1}"/><stop offset="1" stop-color="#111"/></linearGradient>
<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a8"/><stop offset=".4" stop-color="#c8963c"/><stop offset="1" stop-color="#5a3c12"/></linearGradient>
<radialGradient id="skin" cx="55%" cy="35%" r="70%"><stop offset="0" stop-color="{skin}"/><stop offset="1" stop-color="#1c120d"/></radialGradient>
<radialGradient id="eye"><stop offset="0" stop-color="#fff"/><stop offset=".3" stop-color="{eye}"/><stop offset="1" stop-color="{eye}" stop-opacity="0"/></radialGradient>
<linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".85"/></linearGradient>
<radialGradient id="vig" cx="50%" cy="45%" r="70%"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".8"/></radialGradient>
<filter id="blur"><feGaussianBlur stdDeviation="6"/></filter><filter id="b2"><feGaussianBlur stdDeviation="2"/></filter>
<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .18 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
<filter id="rough"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="3" seed="7"/><feDisplacementMap in="SourceGraphic" scale="9"/></filter>
</defs>'''
def back(sym=''):
    return f'''<rect width="{W}" height="{H}" fill="url(#bg)"/><circle cx="256" cy="250" r="230" fill="url(#glow)"/>
<g opacity=".22" stroke="url(#gold)" fill="none" stroke-width="3"><circle cx="256" cy="250" r="190"/><circle cx="256" cy="250" r="176" stroke-dasharray="4 10"/>{sym}</g>'''
def face(cy=270,eyes=True,beard=''):
    e=f'<ellipse cx="232" cy="{cy+2}" rx="11" ry="5" fill="url(#eye)"/><ellipse cx="280" cy="{cy+2}" rx="11" ry="5" fill="url(#eye)"/>' if eyes else ''
    return f'''<path d="M256 {cy-82} C306 {cy-82} 318 {cy-30} 314 {cy+10} C310 {cy+56} 284 {cy+86} 256 {cy+90} C228 {cy+86} 202 {cy+56} 198 {cy+10} C194 {cy-30} 206 {cy-82} 256 {cy-82}Z" fill="url(#skin)"/>
<path d="M214 {cy-14} Q232 {cy-24} 248 {cy-12}M264 {cy-12} Q280 {cy-24} 298 {cy-14}" stroke="#120a06" stroke-width="5" fill="none"/>
<path d="M256 {cy+4} L250 {cy+36} L262 {cy+38}" stroke="#2a1a12" stroke-width="3" fill="none"/><path d="M240 {cy+56} Q256 {cy+62} 272 {cy+56}" stroke="#1a0e08" stroke-width="3" fill="none"/>{beard}{e}'''
def torso(fill='url(#cloth)'):
    return f'<path d="M30 640 C40 540 70 470 150 440 C190 425 215 400 256 398 C297 400 322 425 362 440 C442 470 472 540 482 640Z" fill="{fill}"/>'
def fin(extra=''):
    return f'{extra}<rect width="{W}" height="{H}" fill="url(#shade)"/><rect width="{W}" height="{H}" fill="url(#vig)"/><rect width="{W}" height="{H}" filter="url(#grain)" fill="#fff"/></svg>'
def svg(body): return f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">{body}'

# 1 荒原女射手
archer=svg(defs('#7a2a1a','#2a0e0a','#ff7040','#3b4a2a','#141a0e','#6a5a48','#cbb89a',skin='#c09078',eye='#ffd890')+back('<path d="M256 70 L256 430 M76 250 L436 250"/>')+
 '<path d="M90 100 Q40 330 110 560" stroke="#3a2412" stroke-width="14" fill="none"/><path d="M90 100 Q40 330 110 560" stroke="url(#gold)" stroke-width="4" fill="none"/><path d="M90 100 L110 560" stroke="#e8dcc0" stroke-width="1.6" opacity=".8"/>'
 '<g transform="rotate(18 380 300)"><rect x="350" y="200" width="44" height="210" rx="10" fill="#4a2a14"/><rect x="350" y="200" width="44" height="12" fill="url(#gold)"/>'
 +''.join(f'<path d="M{356+i*8} 205 L{356+i*8} 130" stroke="#c8b890" stroke-width="2.5"/><path d="M{352+i*8} 130 L{356+i*8} 112 L{360+i*8} 130Z" fill="#8a1a10"/>' for i in range(5))+'</g>'
 +'<path d="M150 380 C140 300 160 170 256 150 C352 170 372 300 362 380 C340 330 330 300 310 290 L202 290 C182 300 172 330 150 380Z" fill="#5a2a18"/>'  # hair
 +torso()+'<path d="M150 440 L256 560 L362 440 L340 640 L172 640Z" fill="#2a1a10" opacity=".7"/><path d="M200 470 L256 540 L312 470" stroke="url(#gold)" stroke-width="5" fill="none"/>'
 +'<path d="M120 470 Q150 430 200 440 L190 500 Q150 500 120 470Z" fill="url(#metal)"/><path d="M392 470 Q362 430 312 440 L322 500 Q362 500 392 470Z" fill="url(#metal)"/>'
 +face(278)+'<path d="M160 400 C150 250 180 150 256 140 C332 150 362 250 352 400 C346 300 330 230 300 205 C270 190 242 190 212 205 C182 230 166 300 160 400Z" fill="#2c3a1e"/><path d="M160 400 C150 250 180 150 256 140 C332 150 362 250 352 400" stroke="url(#gold)" stroke-width="3" fill="none" opacity=".8"/>'
 +'<path d="M206 214 Q256 196 306 214" stroke="#6a2a18" stroke-width="10" fill="none"/>'
 +fin('<path d="M70 300 L180 300" stroke="#e8dcc0" stroke-width="2" opacity=".0"/>'))

# 2 风蚀港卫枪兵
spear=svg(defs('#a8642a','#3a1a08','#ffb050','#7a5a2a','#2a1a08','#7a5a30','#e0c080',skin='#9a6a48',eye='#ffe0a0')+back('<path d="M256 60 L300 250 L256 440 L212 250Z"/>')+
 '<path d="M400 40 L400 640" stroke="#3a2010" stroke-width="12"/><path d="M400 40 L380 110 L400 150 L420 110Z" fill="url(#metal)" stroke="url(#gold)" stroke-width="3"/><rect x="386" y="150" width="28" height="10" fill="url(#gold)"/>'
 '<path d="M406 165 L470 175 L462 230 L476 290 L406 270Z" fill="#7a1a10"/><path d="M406 165 L470 175 L462 230 L476 290 L406 270Z" fill="none" stroke="url(#gold)" stroke-width="2"/>'
 +torso('url(#metal)')+'<path d="M180 440 L332 440 L350 640 L162 640Z" fill="url(#cloth)"/>'
 +''.join(f'<path d="M{186+i*20} 470 L{196+i*20} 600" stroke="url(#gold)" stroke-width="3" opacity=".7"/>' for i in range(8))
 +'<path d="M70 500 Q100 420 190 430 L200 520 Q120 540 70 500Z" fill="url(#metal)" stroke="url(#gold)" stroke-width="4"/><path d="M442 500 Q412 420 322 430 L312 520 Q392 540 442 500Z" fill="url(#metal)" stroke="url(#gold)" stroke-width="4"/>'
 +face(284)+'<path d="M200 300 L312 300 L318 380 Q256 410 194 380Z" fill="#6a4a28"/><path d="M200 300 L312 300" stroke="url(#gold)" stroke-width="3"/>'  # veil
 +'<path d="M186 250 C180 160 220 130 256 128 C292 130 332 160 326 250 Z" fill="url(#cloth)"/><path d="M186 250 Q256 220 326 250 L330 268 Q256 238 182 268Z" fill="url(#gold)"/>'
 +'<path d="M256 128 C266 100 250 80 256 60" stroke="#7a1a10" stroke-width="8" fill="none"/><circle cx="256" cy="236" r="10" fill="#c02020" stroke="url(#gold)" stroke-width="3"/>'
 +fin('<path d="M110 640 L120 560 Q256 600 392 560 L402 640Z" fill="#000" opacity=".3"/>'))

# 3 铁狼术士
mage=svg(defs('#2a4a6a','#0a1020','#70c0ff','#2a2440','#0a0814','#4a4a58','#a8a8c0',skin='#8a7a70',eye='#9ae0ff')+back('<path d="M256 80 L403 335 L109 335Z"/><path d="M256 420 L109 165 L403 165Z"/>')+
 '<circle cx="110" cy="470" r="46" fill="#ff5a20" filter="url(#blur)"/><circle cx="110" cy="470" r="22" fill="#ffd080"/><circle cx="402" cy="470" r="46" fill="#40a0ff" filter="url(#blur)"/><circle cx="402" cy="470" r="22" fill="#e0f4ff"/>'
 '<path d="M256 40 L240 90 L262 100 L246 150" stroke="#e8e0ff" stroke-width="4" fill="none" filter="url(#b2)"/><path d="M256 40 L240 90 L262 100 L246 150" stroke="#fff" stroke-width="1.5" fill="none"/>'
 +torso()+'<path d="M226 400 L256 640 L286 400Z" fill="#14101e"/><path d="M226 420 L256 640 M286 420 L256 640" stroke="url(#gold)" stroke-width="3"/>'
 +'<path d="M120 440 C150 380 200 380 230 400 L200 470 C170 460 140 470 120 440Z" fill="#5a5048"/><path d="M392 440 C362 380 312 380 282 400 L312 470 C342 460 372 470 392 440Z" fill="#5a5048"/>'
 +face(286,beard='<path d="M210 320 Q256 420 302 320 Q290 380 256 392 Q222 380 210 320Z" fill="#9a9aa8"/>')
 # wolf pelt hood
 +'<path d="M170 380 C150 260 170 170 256 150 C342 170 362 260 342 380 C330 300 320 240 296 214 Q256 196 216 214 C192 240 182 300 170 380Z" fill="#4a4a50"/>'
 +'<path d="M196 190 L176 120 L222 160Z M316 190 L336 120 L290 160Z" fill="#3a3a40"/><path d="M200 170 Q256 120 312 170 L300 200 Q256 176 212 200Z" fill="#55555c"/>'
 +'<circle cx="236" cy="168" r="4" fill="#ff4030"/><circle cx="276" cy="168" r="4" fill="#ff4030"/>'
 +'<path d="M196 440 L316 440" stroke="url(#gold)" stroke-width="6"/><circle cx="256" cy="440" r="14" fill="#40c0ff" stroke="url(#gold)" stroke-width="4"/>'
 +fin())

# 4 雪峰剑士
barb=svg(defs('#5a7a9a','#101a28','#c0e0ff','#5a4030','#1a1008','#6a7078','#dfe6ee',skin='#b08068',eye='#e0f0ff')+back('<path d="M96 330 L176 170 L226 250 L286 120 L416 330"/>')+
 '<g transform="rotate(-32 256 330)"><rect x="244" y="-20" width="24" height="470" fill="url(#metal)"/><path d="M244 -20 L256 -60 L268 -20Z" fill="url(#metal)"/><path d="M256 -50 L256 440" stroke="#2a2a30" stroke-width="2"/>'
 '<rect x="196" y="440" width="120" height="22" rx="6" fill="url(#gold)"/><rect x="246" y="462" width="20" height="90" fill="#3a2010"/><circle cx="256" cy="560" r="14" fill="url(#gold)"/></g>'
 +torso('url(#skin)')+'<path d="M40 640 C50 560 80 500 150 470 L362 470 C432 500 462 560 472 640Z" fill="url(#cloth)" opacity=".0"/>'
 +'<path d="M60 520 C70 430 140 400 210 420 C230 450 200 500 160 520 C120 540 80 545 60 520Z" fill="#cfc4b4" filter="url(#rough)"/><path d="M452 520 C442 430 372 400 302 420 C282 450 312 500 352 520 C392 540 432 545 452 520Z" fill="#cfc4b4" filter="url(#rough)"/>'
 +'<path d="M140 560 L372 520 L376 548 L144 590Z" fill="#3a2414"/><circle cx="256" cy="545" r="16" fill="url(#gold)"/>'
 +face(290,beard='<path d="M204 310 Q256 440 308 310 Q300 400 256 420 Q212 400 204 310Z" fill="#a0583a" filter="url(#rough)"/>')
 +'<path d="M190 270 C186 180 220 150 256 148 C292 150 326 180 322 270 L304 262 L300 230 L212 230 L208 262Z" fill="url(#metal)"/><path d="M190 270 L322 270" stroke="url(#gold)" stroke-width="5"/><path d="M252 230 L260 230 L262 300 L250 300Z" fill="url(#metal)"/>'
 +'<path d="M196 200 C150 190 120 150 128 90 C150 140 170 160 206 168Z" fill="#e8dcc4"/><path d="M316 200 C362 190 392 150 384 90 C362 140 342 160 306 168Z" fill="#e8dcc4"/>'
 +''.join(f'<circle cx="{(i*97)%512}" cy="{(i*53)%640}" r="{1+i%3}" fill="#fff" opacity=".7"/>' for i in range(40))
 +fin())

out='/workspace/idle-arpg/assets/merc';os.makedirs(out,exist_ok=True)
with R() as r:
    for n,s in [('merc_archer_moor',archer),('merc_spear_port',spear),('merc_mage_ironwolf',mage),('merc_barb_snow',barb)]:
        r.save(s,W,H,f'{out}/{n}.webp',q=88)
print('done')
