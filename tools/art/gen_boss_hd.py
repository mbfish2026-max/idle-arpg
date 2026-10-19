# 5 章末首领立绘高清重绘：单张 1280×720 → 中央正方形 → 软 alpha、底部淡出 → 512×512 webp q80，覆盖 assets/boss/<id>.webp
# 方法同 gen_abyss.py 的 boss()；mehet 两侧暗绿尖塔：取景偏左保住权杖，左右边缘与底角做额外淡化
import os,sys
import numpy as np
from PIL import Image,ImageFilter
from scipy import ndimage as nd
SRC='/cursor/stores/store-d6d0dde9-6f70-444f-9651-7ebc8c960baf/grok-bot/agents/8fc86b3c-8fbf-49dc-a9d3-1d905888f3e3/attachments/'
B='assets/boss/'
HD={'thorn_mother':('d8870919',{}),'kassar':('9b02735f',{}),'mehet':('102f3734',{'x0':230,'side':0.16,'corner':1}),
    'valax':('e26d5093',{}),'eldron':('c8769abd',{})}
def load(h):return Image.open(SRC+[x for x in os.listdir(SRC) if x.startswith(h)][0]).convert('RGB')
def cx_of(im):
    a=np.asarray(im).astype(float).max(2);w=np.clip(a-28,0,None).sum(0);return int((w*np.arange(len(w))).sum()/w.sum())
def boss(id_,N=512):
    h,o=HD[id_];im=load(h);W,H=im.size
    x0=o.get('x0');x0=min(max(cx_of(im)-H//2,0),W-H) if x0 is None else x0
    c=im.crop((x0,0,x0+H,H));a=np.asarray(c).astype(float).max(2);al=np.clip((a-8)/40,0,1)
    fill=nd.binary_fill_holes(nd.binary_closing(a>22,iterations=4));fill=nd.binary_erosion(fill,iterations=2)
    al=np.maximum(al,np.asarray(Image.fromarray((fill*255).astype('uint8')).filter(ImageFilter.GaussianBlur(1.5)))/255)
    y=np.arange(H)[:,None];x=np.arange(H)[None,:]
    al=al*np.clip((H-y)/(H*0.12),0,1)  # 底部 12% 淡出
    if o.get('side'):  # 左右边缘淡化（背景建筑）
        s=o['side']*H;al=al*np.clip(np.minimum(x,H-1-x)/s,0,1)**0.7
    if o.get('corner'):  # 底部两角（尖塔）压暗：距底部中心越远、越靠下越透明
        d=np.clip((np.abs(x-H*0.5)/(H*0.5)-0.45)/0.4,0,1)*np.clip((y-H*0.55)/(H*0.3),0,1);al=al*(1-0.9*d)
    r=c.convert('RGBA');r.putalpha(Image.fromarray((al*255).astype('uint8')));return r.resize((N,N),Image.LANCZOS)
if __name__=='__main__':
    for id_ in (sys.argv[1:] or HD):
        p=B+id_+'.webp';boss(id_).save(p,'WEBP',quality=80,method=6);print(p,os.path.getsize(p))
