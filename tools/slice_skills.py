# 技能图标(4x3 卡片网格，自动检测卡片边界并去掉装饰边框) + 技能特效(3x3 纯黑底，转透明 webp)
import numpy as np, os, sys
from PIL import Image
sys.path.insert(0,os.path.dirname(__file__))
from slice_art import runs, detect, SRC
OUT='/workspace/idle-arpg/assets/'
os.makedirs(OUT+'skill',exist_ok=True);os.makedirs(OUT+'fx',exist_ok=True)
def icons(fn,names):
    im=Image.open(SRC+fn).convert('RGB');a=np.asarray(im).astype(float)
    cols,rows=detect(a);print(fn[:8],im.size,'cols',cols,'rows',rows);assert len(cols)==4 and len(rows)==3
    for j,(y0,y1) in enumerate(rows):
        for i,(x0,x1) in enumerate(cols):
            n=names[j*4+i] if j*4+i<len(names) else None
            if not n:continue
            w,h=x1-x0,y1-y0;ins=int(min(w,h)*0.09)   # 装饰框约占短边 7-8%，内缩 9%
            c=im.crop((x0+ins,y0+ins,x1-ins,y1-ins));cw,ch=c.size;s=min(cw,ch);x=(cw-s)//2;y=(ch-s)//2
            c.crop((x,y,x+s,y+s)).resize((128,128),Image.LANCZOS).save(f'{OUT}skill/{n}.webp',quality=88)
def cuts(prof,n,lo,hi):
    # 在 n 等分点附近 ±12% 窗口内找能量最低的列/行作为切线（纯黑底、无边框）
    L=hi-lo;r=[lo]
    for k in range(1,n):
        c=lo+L*k//n;w=L*12//100;seg=prof[c-w:c+w];r.append(c-w+int(seg.argmin()))
    return r+[hi]
GAIN={'curse':3.0,'teeth':1.3}  # 细线条法阵提高不透明度，叠在头像上也清晰
def fx(fn,names):
    im=Image.open(SRC+fn).convert('RGB');a=np.asarray(im).astype(float);g=a.max(2)
    m=g>24;ys=np.where(m.mean(1)>0.002)[0];xs=np.where(m.mean(0)>0.002)[0]
    cx=cuts(g.mean(0),3,xs[0],xs[-1]+1);cy=cuts(g.mean(1),3,ys[0],ys[-1]+1);print('fx cuts',cx,cy)
    for j in range(3):
        for i in range(3):
            c=a[cy[j]:cy[j+1],cx[i]:cx[i+1]];gg=c.max(2)
            # 收紧到内容包围盒
            mm=gg>20;yy=np.where(mm.any(1))[0];xx=np.where(mm.any(0))[0];c=c[yy[0]:yy[-1]+1,xx[0]:xx[-1]+1]
            al=np.clip((c.max(2)-12)*GAIN.get(names[j*3+i],1.15),0,255);rgb=np.clip(c*255/np.maximum(al[...,None],1),0,255)
            if names[j*3+i]=='curse':rgb=np.broadcast_to(np.array([255,120,235.]),rgb.shape)  # 法阵改为亮品红，叠在红色头像上也醒目
            out=Image.fromarray(np.dstack([rgb,al]).astype('uint8'),'RGBA');out.thumbnail((256,256),Image.LANCZOS)
            out.save(f'{OUT}fx/{names[j*3+i]}.webp',quality=85);print(' ',names[j*3+i],out.size)
icons('fe3717f211739f7910a785f3016469a5fdfc1333dbbb244e49428e62b67f3a7a.jpg',['sm','rs','cg','gm','rm','bg','sr','ig','fg','rv'])
icons('bea15c4e2c185da822b3e03526ade0e7c98a674cbdcc14cdc7f9da09eea6bba2.jpg',['te','ba','pd','ce','bw','pe','bs','bp','pn','bx'])
icons('9a8d95172aa65b7641598114158f8b20fb6e4397e40bfdf61e97a7cefd586b3b.jpg',['ad','dv','wk','im','tr','cf','lt','at','de','lr'])
fx('983cdab093a5e04400754a4913866c6673059e48cecffc44f565d4c93b59d73e.jpg',['spear','spirit','teeth','boom','poison','nova','armor','curse','summon'])
