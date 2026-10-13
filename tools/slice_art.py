# 切图：检测黑底上的卡片/竖条实际像素边界，去边框后输出 256px webp 头像与 512 宽背景
import sys, numpy as np
from PIL import Image, ImageEnhance
SRC='/home/box/agent-data/agents/7850468d-16f1-47a1-827e-5a25d4a70296/assets/'
OUT='/workspace/idle-arpg/assets/'
def runs(prof,thr,minlen=40):
    r=[];s=None
    for i,v in enumerate(list(prof)+[0]):
        if v>thr and s is None:s=i
        elif v<=thr and s is not None:
            if i-s>=minlen:r.append((s,i))
            s=None
    return r
def detect(a):
    # 背景近乎纯色：与背景亮度相差 >6 的像素视为"非背景"；整列/整行 >8% 非背景即属于卡片（含细边框）
    g=a.mean(2); bg=np.median(np.concatenate([g[:,:8].ravel(),g[:,-8:].ravel()])); m=np.abs(g-bg)>6
    cols=runs(m.mean(0),0.08); rows=runs(m.mean(1),0.08)
    # 行方向再仅在卡片列范围内统计，避免列间缝影响
    return cols,rows
def inner(a,x0,x1,y0,y1):
    # 从外缘向内收缩，直到越过细边框（边框像素行/列与内侧差异大），最多 12px，再额外内缩 3px
    g=a.mean(2)
    def edge(lines):
        prev=None
        for k,l in enumerate(lines):
            if k>12:break
            v=l.mean()
            if prev is not None and abs(v-prev)<6 and k>=3:return k
            prev=v
        return 6
    t=edge([g[y0+k,x0:x1] for k in range(14)]);b=edge([g[y1-1-k,x0:x1] for k in range(14)])
    l=edge([g[y0:y1,x0+k] for k in range(14)]);r=edge([g[y0:y1,x1-1-k] for k in range(14)])
    return x0+l+3,x1-r-3,y0+t+3,y1-b-3
def square(im,yb=0.45):
    w,h=im.size;s=min(w,h);x=(w-s)//2;y=int((h-s)*yb);return im.crop((x,y,x+s,y+s))
def grid(fn,names,dst,ncol,nrow):
    im=Image.open(SRC+fn).convert('RGB');a=np.asarray(im).astype(float)
    cols,rows=detect(a);print(fn[:8],'cols',cols,'rows',rows)
    assert len(cols)==ncol and len(rows)==nrow,(cols,rows)
    for j,(y0,y1) in enumerate(rows):
        for i,(x0,x1) in enumerate(cols):
            n=names[j*ncol+i]
            if not n:continue
            bx=inner(a,x0,x1,y0,y1);c=im.crop((bx[0],bx[2],bx[1],bx[3]))
            square(c,0.35).resize((256,256),Image.LANCZOS).save(f'{OUT}{dst}/{n}.webp',quality=86)
            print(' ',n,bx)
def bgs():
    fn='45067118cad6f915047e219d062fe860d06d5ccdf42a6dfe19568434daa02e22.jpg'
    im=Image.open(SRC+fn).convert('RGB');a=np.asarray(im).astype(float)
    # 竖条之间是细暗缝：找列均值的局部低谷
    cm=a.mean(2)[:300].mean(0);W=a.shape[1];cuts=[0]
    for k in range(1,5):
        c=int(W*k/5);lo=max(c-40,1);seg=cm[lo:c+40];x=lo+int(seg.argmin());cuts.append(x)
    cuts.append(W);print('bg cuts',cuts)
    # 上下黑边
    rm=a.mean(2).mean(1);ys=[i for i,v in enumerate(rm) if v>8];y0,y1=ys[0],ys[-1]+1;print('bg rows',y0,y1)
    for k in range(5):
        c=im.crop((cuts[k]+3,y0,cuts[k+1]-3,y1));w,h=c.size
        c=c.resize((512,round(h*512/w)),Image.LANCZOS)
        c.save(f'{OUT}bg/act{k+1}.webp',quality=80);print(' act',k+1,c.size)
if __name__=='__main__':
    import os
    for d in ['monster','boss','bg']:os.makedirs(OUT+d,exist_ok=True)
    grid('bf439599131475933aff5e25a44a99cd1cdda8cf0239d8f08e71e86ef7d42bfe.jpg',['beetle','husk','jackal','serpent','fly','vulture','tombmage','leaper','scarab'],'monster',3,3)
    grid('11b5488e3fc7b6b6124be7435121bfdb0b001e69f4808c5de4fa5cff1e6cd34e.jpg',['spider','mosq','flayer','flshaman','frog','hulk','zealot','priest','corrupt'],'monster',3,3)
    grid('89e9b4deacad73a9c72a961c2fce185e669f2b0c6f3a20d71075353c5978a2af.jpg',['fiend','hound','knight','venom','storm','pitlord','yeti','horror','siren'],'monster',3,3)
    grid('7b00257b566ef4f3feb7ed954aa76e91e57d8269d1149ff2b35d3234b7e386a0.jpg',['kassar','mehet','valax','eldron'],'boss',2,2)
    bgs()

# ---------- 复用图的变体（色调变换 / 放大） ----------
from PIL import ImageOps
def variant(src,dst,tint=None,amt=0.4,zoom=1.0,flip=False,sat=None):
    im=Image.open(OUT+src).convert('RGB')
    if zoom>1:w,h=im.size;s=int(w/zoom);x=(w-s)//2;y=int((h-s)*0.35);im=im.crop((x,y,x+s,y+s)).resize((256,256),Image.LANCZOS)
    if flip:im=ImageOps.mirror(im)
    if sat is not None:im=ImageEnhance.Color(im).enhance(sat)
    if tint:
        g=ImageOps.grayscale(im);c=ImageOps.colorize(g,black=(0,0,0),white=tint,mid=tuple(v//2 for v in tint))
        im=Image.blend(im,c,amt)
    im.save(OUT+dst,quality=86)
RED=(255,90,70);ICE=(150,200,255);GOLD=(255,215,130);GREEN=(150,255,120);VIO=(200,130,255)
VARS=[ # 第五章复用家族
 ('monster/fiend.webp','monster/minion.webp',(255,150,60),0.35,1.0,True),
 ('monster/pitlord.webp','monster/mauler.webp',ICE,0.45,1.1,True),
 ('monster/hound.webp','monster/wolf.webp',ICE,0.6,1.0,True),
 ('monster/ghost.webp','monster/wraith.webp',ICE,0.5,1.0,True),
 ('monster/priest.webp','monster/vamp.webp',RED,0.45,1.1,True),
 # 中小首领：同章怪物 + 红色调 + 放大
 ('monster/husk.webp','boss/rotwarden.webp',GREEN,0.35,1.25,False),
 ('monster/serpent.webp','boss/fangqueen.webp',RED,0.35,1.25,False),
 ('monster/tombmage.webp','boss/summoner.webp',ICE,0.35,1.25,False),
 ('monster/mosq.webp','boss/jadeguard.webp',GREEN,0.4,1.2,False),
 ('monster/flayer.webp','boss/flaychief.webp',RED,0.4,1.25,False),
 ('monster/priest.webp','boss/tomekeeper.webp',ICE,0.4,1.25,False),
 ('monster/zealot.webp','boss/council1.webp',RED,0.4,1.25,False),
 ('monster/priest.webp','boss/council2.webp',RED,0.4,1.3,True),
 ('monster/zealot.webp','boss/council3.webp',VIO,0.4,1.3,True),
 ('monster/fiend.webp','boss/fallen.webp',ICE,0.45,1.25,False),
 ('monster/pitlord.webp','boss/forger.webp',RED,0.35,1.25,False),
 ('monster/storm.webp','boss/seal1.webp',RED,0.3,1.25,False),
 ('monster/knight.webp','boss/seal2.webp',RED,0.4,1.25,False),
 ('monster/venom.webp','boss/seal3.webp',RED,0.3,1.25,True),
 ('monster/fiend.webp','boss/siegelord.webp',GOLD,0.35,1.3,True),
 ('monster/horror.webp','boss/frostjailer.webp',ICE,0.3,1.25,False),
 ('monster/siren.webp','boss/traitor.webp',VIO,0.4,1.25,True),
 ('monster/yeti.webp','boss/anc1.webp',GOLD,0.45,1.25,False),
 ('monster/pitlord.webp','boss/anc2.webp',GOLD,0.45,1.3,True),
 ('monster/knight.webp','boss/anc3.webp',GOLD,0.45,1.3,False),
 ('monster/knight.webp','boss/tw1.webp',ICE,0.45,1.25,True),
 ('monster/tombmage.webp','boss/tw2.webp',RED,0.45,1.25,True),
 ('monster/fiend.webp','boss/tw3.webp',RED,0.4,1.35,False),
 ('monster/venom.webp','boss/tw4.webp',GREEN,0.5,1.25,False),
 ('monster/venom.webp','boss/tw5.webp',RED,0.35,1.35,True),
]
if __name__=='__main__':
    for s,d,t,a,z,f in VARS:variant(s,d,t,a,z,f)
    print('variants',len(VARS))
