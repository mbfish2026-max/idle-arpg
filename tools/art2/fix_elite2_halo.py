# 修复带光晕的 elite2 立绘暗底：估算背景色 → color-to-alpha（unmultiply）保留半透明光晕；角色本体用实心核心掩膜保护不透明
import os,sys,numpy as np
from PIL import Image,ImageFilter
from scipy import ndimage
SRC='/workspace/elite2_gen'; OUT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','assets','elite2')
NAMES=sys.argv[1:] or ['a3_champ_fly','a3_champ_frog','a2_champ_beetle','a3_uniq_zealot']
for n in NAMES:
    a=np.asarray(Image.open(f'{SRC}/{n}.jpg').convert('RGB')).astype(np.float32)
    H0,W0=a.shape[:2]; yy,xx=np.mgrid[0:H0,0:W0]; r=np.hypot((xx-W0/2)/(W0/2),(yy-H0/2)/(H0/2))
    # 背景是径向渐变：按半径分环取低分位数，用外环(r>0.55)拟合二次曲线外推到中心 → 空间变化的背景色 bg(r)
    bins=np.linspace(0.55,1.4,18); rc=[];vals=[]
    for b0,b1 in zip(bins[:-1],bins[1:]):
        m=(r>=b0)&(r<b1)
        if m.sum()>500: rc.append((b0+b1)/2); vals.append(np.percentile(a[m],40,axis=0))
    rc=np.array(rc); vals=np.array(vals); bg=np.stack([np.polyval(np.polyfit(rc,vals[:,c],2),np.clip(r,0.3,1.5)) for c in range(3)],-1)
    up=np.where(a>=bg,(a-bg)/np.maximum(255-bg,1),0*a); al=np.clip(up.max(2),0,1)
    al=np.clip((al-0.04)/0.96,0,1)
    D=np.abs(a-bg).max(2)
    core=ndimage.binary_fill_holes(ndimage.binary_closing(ndimage.binary_opening(D>12,iterations=3),iterations=6))
    lab,nl=ndimage.label(core)
    if nl: sz=ndimage.sum(core,lab,range(1,nl+1)); core=np.isin(lab,1+np.where(sz>0.02*sz.max())[0])
    core=ndimage.binary_erosion(core,iterations=5)
    coref=np.asarray(Image.fromarray((core*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2))).astype(np.float32)/255
    A=np.maximum(al,coref)
    rgb=np.clip(bg+(a-bg)/np.maximum(A[...,None],1e-3),0,255)   # unmultiply
    im=Image.fromarray(np.dstack([rgb,A*255]).astype(np.uint8),'RGBA')
    bb=im.getchannel('A').point(lambda v:255 if v>30 else 0).getbbox(); W,H=im.size
    m=int(0.04*max(bb[2]-bb[0],bb[3]-bb[1])); c=im.crop((max(0,bb[0]-m),max(0,bb[1]-m),min(W,bb[2]+m),min(H,bb[3]+m)))
    s=256/max(c.size); c=c.resize((max(1,round(c.width*s)),max(1,round(c.height*s))),Image.LANCZOS)
    o=Image.new('RGBA',(256,256),(0,0,0,0)); o.alpha_composite(c,((256-c.width)//2,(256-c.height)//2))
    o.save(f'{OUT}/{n}.webp','WEBP',quality=88); print(n,bb)
