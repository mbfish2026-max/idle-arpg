# elite2 v2：去暗背景 → 按不透明 bbox 裁剪 + 边距 → 等比缩放进 256x256，透明补齐
import glob,os,numpy as np
from PIL import Image,ImageFilter
from scipy import ndimage
for f in sorted(glob.glob('/workspace/elite2_gen/*.jpg')):
    im=Image.open(f).convert('RGB'); a=np.asarray(im).astype(np.float32); L=a.max(2)
    bgv=np.median(np.r_[L[0],L[-1],L[:,0],L[:,-1]]); bgc=np.median(np.r_[a[0],a[-1],a[:,0],a[:,-1]],0); D=np.abs(a-bgc).max(2)
    lab,_=ndimage.label(D<24); edge=set(np.unique(np.r_[lab[0],lab[-1],lab[:,0],lab[:,-1]]))-{0}
    al=np.where(np.isin(lab,list(edge)),np.clip((D-6)/40,0,1)**1.2,1.0)
    al=np.asarray(Image.fromarray((al*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2)))
    rgba=Image.fromarray(np.dstack([a.astype(np.uint8),al]),'RGBA')
    ys,xs=np.where(al>40); x0,x1,y0,y1=xs.min(),xs.max(),ys.min(),ys.max()
    m=int(0.04*max(x1-x0,y1-y0)); W,H=im.size
    box=(max(0,x0-m),max(0,y0-m),min(W,x1+m+1),min(H,y1+m+1)); c=rgba.crop(box)
    s=256/max(c.size); c=c.resize((max(1,round(c.width*s)),max(1,round(c.height*s))),Image.LANCZOS)
    out=Image.new('RGBA',(256,256),(0,0,0,0)); out.alpha_composite(c,((256-c.width)//2,(256-c.height)//2))
    out.save(f'/workspace/idle-arpg/assets/elite2/{os.path.basename(f)[:-4]}.webp','WEBP',quality=88)
    print(os.path.basename(f),box)
