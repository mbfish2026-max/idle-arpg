# gen_fx2.py — fx2 v3：以 GenerateImage 手绘特效图（/workspace/fx2_gen/{id}.jpg，纯黑底）为素材生成 8 帧动画
# 黑底→alpha：alpha=亮度(max RGB)，颜色反预乘，适合发光叠加。输出 assets/fx2/{id}_0..7.webp + {id}_strip.webp（256x256/帧，RGBA）
import os, math, numpy as np
from PIL import Image
R=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..'); OUT=os.path.join(R,'assets','fx2')
SRC=os.environ.get('FX2_SRC','/workspace/fx2_gen'); N=8; S=256
def load(id):
    a=np.asarray(Image.open(f'{SRC}/{id}.jpg').convert('RGB')).astype(np.float32)/255
    al=np.clip((a.max(2)-0.04)/0.96,0,1)**0.9
    rgb=np.where(al[...,None]>1e-3,np.clip(a/np.maximum(a.max(2,keepdims=True),1e-3),0,1),0)  # 反预乘：保留色相，亮度交给 alpha
    rgb=rgb*np.clip(a.max(2,keepdims=True)/np.maximum(al[...,None],1e-3),0,1)**0  # 颜色取饱和版
    im=Image.fromarray((np.dstack([rgb,al])*255).astype(np.uint8),'RGBA')
    bb=im.getchannel('A').point(lambda v:255 if v>12 else 0).getbbox(); return im.crop(bb)
def fit(im,box):
    s=min(box[0]/im.width,box[1]/im.height); return im.resize((max(1,int(im.width*s)),max(1,int(im.height*s))),Image.LANCZOS)
def put(canvas,sp,cx,cy,alpha=1.0,scale=1.0,rot=0):
    if scale!=1.0: sp=sp.resize((max(1,int(sp.width*scale)),max(1,int(sp.height*scale))),Image.LANCZOS)
    if rot: sp=sp.rotate(rot,Image.BICUBIC,expand=True)
    if alpha<1: sp=sp.copy(); sp.putalpha(sp.getchannel('A').point(lambda v:int(v*alpha)))
    canvas.alpha_composite(sp,(int(cx-sp.width/2),int(cy-sp.height/2)))  # 允许越界裁切
def safe_put(c,sp,cx,cy,**k):
    tmp=Image.new('RGBA',(S*3,S*3)); put(tmp,sp,cx+S,cy+S,**k); c.alpha_composite(tmp.crop((S,S,2*S,2*S)))
def frames(id):
    sp=load(id); fr=[]
    for k in range(N):
        t=k/(N-1); c=Image.new('RGBA',(S,S))
        if id=='bone_spear':          # 从左往右飞 + 后段淡出
            p=fit(sp,(150,60)); safe_put(c,p,-40+t*300,128,alpha=1.0 if t<0.55 else max(0,1-(t-0.55)/0.45))
        elif id in('poison_nova','corpse_explosion'):  # 由小到大 + 淡出
            p=fit(sp,(250,250)); safe_put(c,p,128,128,scale=0.2+0.85*t**0.7,alpha=1.0 if t<0.5 else max(0,1-(t-0.5)/0.5)*0.95+0.05*(k<N-1))
        elif id=='curse_aura':         # 缓慢旋转，可循环（8 帧转 45°，符文 8 重对称，首尾衔接）
            p=fit(sp,(230,230)); safe_put(c,p,128,128,rot=-k*45/N,alpha=0.92)
        elif id=='bone_prison':        # 从下往上升起（底部遮罩），末帧略淡
            p=fit(sp,(220,150)); h=p.height; rise=min(1,t/0.7)
            y=230-h/2*rise-h/2*(1-rise)+h*(1-rise); tmp=Image.new('RGBA',(S,S)); safe_put(tmp,p,128,y)
            m=Image.new('L',(S,S),0); m.paste(255,(0,0,S,232)); a=np.minimum(np.asarray(tmp.getchannel('A')),np.asarray(m))
            if k>=N-2: a=(a*(0.75 if k==N-2 else 0.5)).astype(np.uint8)
            tmp.putalpha(Image.fromarray(a.astype(np.uint8))); c=tmp
        fr.append(c)
    return fr
IDS=['bone_spear','poison_nova','corpse_explosion','curse_aura','bone_prison']
def main():
    os.makedirs(OUT,exist_ok=True)
    for id in IDS:
        fr=frames(id); strip=Image.new('RGBA',(S*N,S))
        for k,f in enumerate(fr): f.save(f'{OUT}/{id}_{k}.webp','WEBP',quality=88); strip.paste(f,(k*S,0))
        strip.save(f'{OUT}/{id}_strip.webp','WEBP',quality=88)
if __name__=='__main__': main(); print('fx2 v3 done')
