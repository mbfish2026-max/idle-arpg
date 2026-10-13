# gen_art2.py — 第二批美术：精英/小首领立绘(基于现有手绘立绘调色+光环)、技能特效帧、地图下层缩略图
# 只新增文件：assets/elite2 assets/fx2 assets/map2
import os, math, random
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance, ImageDraw, ImageOps
R=os.path.join(os.path.dirname(__file__),'..','..'); A=lambda *p:os.path.join(R,'assets',*p)
for d in ['elite2','fx2','map2']: os.makedirs(A(d),exist_ok=True)
random.seed(7); np.random.seed(7)
# ---------- 1) 精英(蓝光 champ) / 小首领(金光 uniq) 立绘：每章各 2 只精英 + 1 只小首领 ----------
ELITE={1:['zombie','skeleton_enemy','imp'],2:['beetle','mosq','scarab'],3:['fly','frog','zealot'],4:['fiend','knight','pitlord'],5:['yeti','minion','mauler']}
def tint(im,col,amt):
    gl=ImageOps.grayscale(im); g=gl.convert("RGB"); c=Image.new('RGB',im.size,col)
    t=Image.blend(g,Image.composite(c,g,gl.point(lambda v:min(255,v*1.4))),0.6)
    return Image.blend(im,t,amt)
def aura(size,col,seed):
    rng=np.random.default_rng(seed); w=h=size; y,x=np.mgrid[0:h,0:w]; cx,cy=w/2,h*0.55
    r=np.hypot(x-cx,(y-cy)*0.85)/(w/2); ang=np.arctan2(y-cy,x-cx)
    fl=0.5+0.5*np.sin(ang*9+rng.random()*6)*np.sin(ang*4+rng.random()*6)
    a=np.clip((1-np.abs(r-0.82)/0.22)*(0.55+0.45*fl),0,1)
    img=np.zeros((h,w,4),np.float32); img[...,:3]=col; img[...,3]=a*255
    return Image.fromarray(img.astype(np.uint8)).filter(ImageFilter.GaussianBlur(6))
def frame_vignette(im,col):
    w,h=im.size; y,x=np.mgrid[0:h,0:w]; r=np.hypot(x-w/2,y-h/2)/(w*0.72)
    v=np.clip(1.15-r**2,0.25,1)[...,None]; a=np.asarray(im).astype(np.float32)*v
    out=Image.fromarray(a.clip(0,255).astype(np.uint8)); d=ImageDraw.Draw(out)
    for i,al in enumerate([200,120,60]): d.rectangle([i,i,w-1-i,h-1-i],outline=tuple(int(c*al/255) for c in col))
    return out
for act,lst in ELITE.items():
    for i,m in enumerate(lst):
        uniq=(i==2); col=(255,190,70) if uniq else (90,140,255)
        src=Image.open(A('monster',m+'.webp')).convert('RGB').resize((256,256),Image.LANCZOS)
        im=ImageEnhance.Contrast(tint(src,col,0.28 if uniq else 0.32)).enhance(1.15)
        base=im.convert('RGBA'); base.alpha_composite(aura(256,col,act*10+i))
        # 眼光/符文高光
        gl=Image.new('RGBA',(256,256)); d=ImageDraw.Draw(gl)
        for _ in range(26 if uniq else 16):
            px,py=random.randint(10,246),random.randint(10,246); s=random.randint(1,3); d.ellipse([px-s,py-s,px+s,py+s],fill=col+(random.randint(120,230),))
        base.alpha_composite(gl.filter(ImageFilter.GaussianBlur(1)))
        out=frame_vignette(base.convert('RGB'),col)
        out.save(A('elite2',f"a{act}_{'uniq' if uniq else 'champ'}_{m}.webp"),'WEBP',quality=86)
# ---------- 2) 技能特效帧（透明 RGBA 256x256，8 帧） ----------
N=8; S=256
def glow_layer(pts,col,size=S,blur=(2,7)):
    base=np.zeros((size,size,4),np.float32)
    im=Image.new('RGBA',(size,size)); d=ImageDraw.Draw(im)
    for (x,y,r,a) in pts: d.ellipse([x-r,y-r,x+r,y+r],fill=col+(int(max(0,min(255,a))),))
    core=im.filter(ImageFilter.GaussianBlur(blur[0])); halo=im.filter(ImageFilter.GaussianBlur(blur[1]))
    out=Image.new('RGBA',(size,size)); out.alpha_composite(halo); out.alpha_composite(halo); out.alpha_composite(core)
    return out
def save(name,frames):
    for k,f in enumerate(frames): f.save(A('fx2',f'{name}_{k}.webp'),'WEBP',quality=88)
    strip=Image.new('RGBA',(S*N,S)); [strip.paste(f,(k*S,0)) for k,f in enumerate(frames)]
    strip.save(A('fx2',f'{name}_strip.webp'),'WEBP',quality=88)
# 骨矛：骨白长矛自左向右穿刺 + 碎骨拖尾
def bone_spear():
    fr=[]
    for k in range(N):
        t=k/(N-1); im=Image.new('RGBA',(S,S)); tip=30+t*210
        pts=[(tip-j*4,128+math.sin(j*.5)*1.5,max(1,9-j*0.12),255-j*3) for j in range(int(min(tip,150)/4))]
        im.alpha_composite(glow_layer(pts,(225,215,190)))
        tr=[(tip-40-random.random()*120,128+random.gauss(0,10),random.uniform(1,3),200*(1-t*0.5)) for _ in range(30)]
        im.alpha_composite(glow_layer(tr,(180,200,220),blur=(1,4)))
        d=ImageDraw.Draw(im); d.polygon([(tip+14,128),(tip-6,120),(tip-6,136)],fill=(245,240,225,255))
        fr.append(im)
    save('bone_spear',fr)
# 毒新星：绿色毒环扩散 + 毒雾粒子
def poison_nova():
    fr=[]
    for k in range(N):
        t=(k+1)/N; r=18+t*104; im=Image.new('RGBA',(S,S)); a=255*(1-t**2)+30
        pts=[]
        for j in range(140):
            g=j/140*2*math.pi+random.gauss(0,.03); rr=r+random.gauss(0,5)
            pts.append((128+math.cos(g)*rr,128+math.sin(g)*rr,random.uniform(2,5),a*random.uniform(.5,1)))
        im.alpha_composite(glow_layer(pts,(120,220,60)))
        mist=[(128+random.gauss(0,r*.55),128+random.gauss(0,r*.55),random.uniform(4,10),60*(1-t)+20) for _ in range(40)]
        im.alpha_composite(glow_layer(mist,(70,130,40),blur=(4,10)))
        fr.append(im)
    save('poison_nova',fr)
# 尸爆：中心闪光→血肉火焰爆裂→碎块飞散
def corpse_explosion():
    fr=[]; parts=[(random.uniform(0,6.283),random.uniform(40,120),random.uniform(2,5)) for _ in range(60)]
    for k in range(N):
        t=(k+1)/N; im=Image.new('RGBA',(S,S))
        core=max(0,1-t*1.6); im.alpha_composite(glow_layer([(128,140,20+60*t,255*core)],(255,200,120),blur=(8,18)))
        fire=[(128+random.gauss(0,30*t+5),140+random.gauss(-10*t,24*t+5),random.uniform(5,12),200*(1-t)+30) for _ in range(50)]
        im.alpha_composite(glow_layer(fire,(200,60,25),blur=(3,9)))
        ch=[(128+math.cos(g)*d*t,140+math.sin(g)*d*t+40*t*t,s,255*(1-t*.7)) for g,d,s in parts]
        im.alpha_composite(glow_layer(ch,(110,20,15),blur=(0.6,2)))
        fr.append(im)
    save('corpse_explosion',fr)
# 诅咒光环：脚下旋转的暗紫符文圈（循环）
def curse_aura():
    fr=[]
    for k in range(N):
        ph=k/N*2*math.pi; im=Image.new('RGBA',(S,S)); pts=[]
        for j in range(180):
            g=j/180*2*math.pi; rr=96+6*math.sin(g*6+ph*2)
            pts.append((128+math.cos(g+ph/3)*rr,128+math.sin(g+ph/3)*rr*0.5+50,2.5,170+60*math.sin(g*3+ph)))
        for s in range(6):  # 符文点
            g=s/6*2*math.pi+ph/3; pts.append((128+math.cos(g)*70,178+math.sin(g)*35,7,230))
        im.alpha_composite(glow_layer(pts,(150,60,200)))
        wisps=[(128+random.gauss(0,50),178-random.uniform(0,120),random.uniform(2,5),random.uniform(60,160)) for _ in range(24)]
        im.alpha_composite(glow_layer(wisps,(90,30,130),blur=(2,6)))
        fr.append(im)
    save('curse_aura',fr)
# 骨墙/骨牢（额外）：白骨尖刺破土
def bone_prison():
    fr=[]
    for k in range(N):
        t=min(1,(k+1)/(N*0.6)); fade=1 if k<N-2 else 0.6; im=Image.new('RGBA',(S,S)); d=ImageDraw.Draw(im)
        for s in range(9):
            x=30+s*24; h=(60+40*math.sin(s*1.7))*t
            d.polygon([(x-9,210),(x+9,210),(x+1,210-h)],fill=(220,210,185,int(255*fade)))
        g=glow_layer([(30+s*24,205,10,120*fade) for s in range(9)],(200,210,230),blur=(3,8)); g.alpha_composite(im); fr.append(g)
    save('bone_prison',fr)
# fx2 v3：改用手绘素材驱动的帧动画（见 gen_fx2.py）；以上程序化版本保留作参考/后备
import sys; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
if os.path.isdir(os.environ.get('FX2_SRC','/workspace/fx2_gen')):
    import gen_fx2; gen_fx2.main()
else:
    bone_spear(); poison_nova(); corpse_explosion(); curse_aura(); bone_prison()
# ---------- 3) 地图下层场景缩略图（240x160，暗化+阶梯下行标记+章节色调） ----------
MAP={1:['a1_z05','a1_z09','a1_z12','a1_z17'],2:['a2_cave_0','a2_tomb_1','a2_jail_0','a2_tower_1'],3:['a3_cave_1','a3_jail_1','a3_temple_0','a3_jungle_1'],4:['a4_hell_0','a4_hell_1'],5:['a5_ice_0','a5_temple_0','a5_snow_1']}
TONE={1:(150,110,70),2:(170,130,70),3:(80,130,80),4:(170,50,30),5:(110,140,180)}
for act,lst in MAP.items():
    for lv,b in enumerate(lst):
        p=A('bg',b+'.webp')
        if not os.path.exists(p): continue
        im=Image.open(p).convert('RGB'); w,h=im.size; ch=int(w*2/3); y0=int(h*0.45)-ch//2
        im=im.crop((0,y0,w,y0+ch)).resize((240,160),Image.LANCZOS)
        im=ImageEnhance.Brightness(im).enhance(0.62-lv*0.05); im=Image.blend(im,Image.new('RGB',im.size,TONE[act]),0.16)
        arr=np.asarray(im).astype(np.float32); y,x=np.mgrid[0:160,0:240]; v=np.clip(1.2-(np.hypot(x-120,y-80)/140)**2,.2,1)[...,None]
        im=Image.fromarray((arr*v).clip(0,255).astype(np.uint8)); d=ImageDraw.Draw(im)
        for i in range(3): d.rectangle([12+i*7,138-i*7,40,140-i*7+4],fill=(30,22,18)); d.line([12+i*7,138-i*7,40,138-i*7],fill=(180,150,100))
        d.rectangle([0,0,239,159],outline=(120,95,60)); d.rectangle([2,2,237,157],outline=(50,38,26))
        im.save(A('map2',f'a{act}_lower{lv+1}.webp'),'WEBP',quality=85)
print('done')
