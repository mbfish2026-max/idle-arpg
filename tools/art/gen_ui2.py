# UI2：手绘黑底 jpg → assets/ui2/*.webp（按真实像素检测物体，alpha 软边；九宫格保留内部暗底）
import numpy as np,os
from PIL import Image,ImageFilter
from scipy import ndimage as nd
SRC='/home/box/agent-data/agents/8fc86b3c-8fbf-49dc-a9d3-1d905888f3e3/assets/';OUT='assets/ui2/';os.makedirs(OUT,exist_ok=True)
def load(h):
    f=[x for x in os.listdir(SRC) if x.startswith(h)][0];return Image.open(SRC+f).convert('RGB')
def objs(im,thr=28,dil=6,minarea=800):
    a=np.asarray(im).astype(int);m=a.max(2)>thr;lab,n=nd.label(nd.binary_dilation(m,iterations=dil));out=[]
    for i,s in enumerate(nd.find_objects(lab)):
        sub=(lab[s]==i+1)&m[s]
        if sub.sum()<minarea:continue
        ys,xs=np.nonzero(sub);out.append((s[1].start+xs.min(),s[0].start+ys.min(),s[1].start+xs.max()+1,s[0].start+ys.max()+1))
    return out
def cut(im,box,pad=3,keep_inside=True):
    x0,y0,x1,y1=box;box=(max(0,x0-pad),max(0,y0-pad),min(im.width,x1+pad),min(im.height,y1+pad));c=im.crop(box)
    a=np.asarray(c).astype(float);mx=a.max(2);soft=np.clip((mx-8)/40,0,1)
    if keep_inside:
        fill=nd.binary_fill_holes(nd.binary_closing(mx>22,iterations=4));fill=nd.binary_erosion(fill,iterations=2)
        f=np.asarray(Image.fromarray((fill*255).astype('uint8')).filter(ImageFilter.GaussianBlur(1.2)))/255;soft=np.maximum(soft,f)
    r=c.convert('RGBA');r.putalpha(Image.fromarray((soft*255).astype('uint8')));return r
def save(img,name,w=None,h=None,q=78):
    if w or h:
        W=w or round(img.width*h/img.height);H=h or round(img.height*w/img.width);img=img.resize((W,H),Image.LANCZOS)
    img.save(OUT+name+'.webp','WEBP',quality=q,method=6);print(name,img.size,os.path.getsize(OUT+name+'.webp'))
    return img
def srt(bs,key):return sorted(bs,key=key)
# 1 面板
im=load('fcf0903a');b=max(objs(im),key=lambda b:(b[2]-b[0])*(b[3]-b[1]));print('panel box',b);save(cut(im,b),'panel_9s',w=420,q=80)
# 2 按钮
im=load('9bc95009');bs=srt(objs(im),lambda b:b[1]);print('btn',bs)
for b,n in zip(bs,['btn_9s','btn_down_9s','btn_gold_9s']):save(cut(im,b),n,w=240)
# 3 页签图标
im=load('053ae3dc');bs=srt(objs(im,28,1,2000),lambda b:b[0]);print('tabs',len(bs),bs)
for b,n in zip(bs,['fight','hero','skill','bag','merc','shop','map','eg']):save(cut(im,b,keep_inside=True),'tab_'+n,w=88)
# 4 标题条 / 底栏
im=load('e288cd25');bs=srt(objs(im),lambda b:b[1]);print('bars',bs)
save(cut(im,bs[0]),'title_9s',w=560);save(cut(im,bs[-1]),'nav_9s',w=780)
# 5 球
im=load('fac29120');bs=srt(objs(im),lambda b:b[0]);print('orbs',bs)
for b,n in zip(bs,['orb_red','orb_blue']):
    o=cut(im,b);o=o.resize((150,round(o.height*150/o.width)),Image.LANCZOS)
    g=np.asarray(o).astype(float);H,W=g.shape[:2];yy,xx=np.mgrid[0:H,0:W];CX,CY,RR=74,75,52
    d=np.sqrt((xx-CX)**2+(yy-CY)**2);w=np.clip((RR+1-d)/3,0,1)[...,None]
    l=g[...,:3].mean(2,keepdims=True);dark=np.repeat(l,3,2)*np.array([.42,.36,.34])
    e=np.concatenate([g[...,:3]*(1-w)+dark*w,g[...,3:]],2);save(Image.fromarray(e.clip(0,255).astype('uint8'),'RGBA'),n+'_empty',q=75)
    lq=np.concatenate([g[...,:3],(np.clip((RR-d)/2,0,1)*255)[...,None]],2)[CY-RR:CY+RR,CX-RR:CX+RR]
    save(Image.fromarray(lq.clip(0,255).astype('uint8'),'RGBA'),n+'_liq',q=78)
# 6 卡框
im=load('a6f7fe23');bs=srt(objs(im),lambda b:b[0]);print('cards',bs)
for b,n in zip(bs,['card_n','card_champ','card_uniq','card_boss']):save(cut(im,b),n+'_9s',w=150)
# 7 条
im=load('9a8c96a4');bs=srt(objs(im),lambda b:b[1]);print('bars',bs)
for b,n in zip(bs,['bar_frame','bar_red','bar_gold','divider']):save(cut(im,b),n,w=480 if n!='divider' else 520)  # bar_red/bar_gold 仅作 _fill 的中间产物
# 8 羊皮纸
im=load('996f6a1a');c=im.crop((340,120,940,600));save(c.convert('RGBA'),'parch',w=360,q=70)
# 9 药水
im=load('10102f5d');bs=srt(objs(im),lambda b:b[0]);print('pots',bs)
for b,n in zip(bs,['pot_hp','pot_mp','pot_rej','pot_tp']):save(cut(im,b),n,h=72)
# 1b 面板：上下中花饰单独切出（::before/::after 居中贴），九宫格边去掉中花饰以免被拉伸
p=Image.open(OUT+'panel_9s.webp').convert('RGBA');W,H=p.size;cx=W//2
for nm,(y0,y1) in (('panel_orn_t',(0,52)),('panel_orn_b',(H-52,H))):save(p.crop((cx-42,y0,cx+42,y1)),nm,q=80)
q=p.copy()
for (y0,y1) in ((0,56),(H-56,H)):
    seg=p.crop((90,y0,130,y1))
    for x in range(cx-60,cx+60,40):q.paste(seg,(x,y0))
save(q,'panel_9s',q=80)
# 4b 底栏去掉两端塔楼（窄屏 8 个页签需要每格 ≥44px），保留中段尖饰
n=Image.open(OUT+'nav_9s.webp').convert('RGBA');save(n.crop((70,0,n.width-70,n.height)),'nav_9s',q=78)
# 7b 条内填充（去掉框，只留液体段，作 .bar i 的底图）
for n in ('bar_red','bar_gold'):
    b=Image.open(OUT+n+'.webp').convert('RGB');save(b.crop((46,19,434,42)).convert('RGBA'),n+'_fill',w=240,q=75)
