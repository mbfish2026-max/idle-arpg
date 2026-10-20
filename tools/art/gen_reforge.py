# 「淬锋精铸」重铸界面 UI 素材 → assets/ui2/reforge/*.webp（接入由系统开发做）
# 4a39bf92 背景：中间裁 390:844 竖版、压暗 → bg.webp 780×1688
# 09e6060c 图集：连通域自动检测四件 → 软 alpha、4px 边；框内空黑区 → 半透明暗底（alpha≈150），量出 9-slice 值
# 3c3a8274 左：按下态按钮（缩放到 btn 同尺寸）；右：火花，按亮度转 alpha → 512px
import os,json
import numpy as np
from PIL import Image,ImageDraw,ImageFilter,ImageEnhance
from scipy import ndimage as nd
SRC='/cursor/stores/store-d6d0dde9-6f70-444f-9651-7ebc8c960baf/grok-bot/agents/8fc86b3c-8fbf-49dc-a9d3-1d905888f3e3/attachments/'
O='assets/ui2/reforge/';os.makedirs(O,exist_ok=True);INFO={}
def load(h):return Image.open(SRC+[x for x in os.listdir(SRC) if x.startswith(h)][0]).convert('RGB')
def save(im,n,q=80):p=O+n;im.save(p,'WEBP',quality=q,method=6);INFO[n]={'size':im.size,'kb':round(os.path.getsize(p)/1024,1)};print(p,im.size,INFO[n]['kb'],'KB')
def objects(im,thr=30,minarea=4000):
    m=np.asarray(im).astype(int).max(2)>thr;lab,n=nd.label(nd.binary_dilation(m,iterations=6));out=[]
    for i,s in enumerate(nd.find_objects(lab)):
        if ((lab[s]==i+1)&m[s]).sum()>=minarea:out.append((s[1].start,s[0].start,s[1].stop,s[0].stop))
    return sorted(out,key=lambda b:(b[0]//150,b[1]))
def cut(im,b,p=4):x0,y0,x1,y1=b;return im.crop((max(0,x0-p),max(0,y0-p),min(im.width,x1+p),min(im.height,y1+p)))
def frame_alpha(c,hollow=True,inner=150):
    """软 alpha；hollow=True 时框内空黑区设为半透明暗底，返回 (RGBA, 内区 bbox)"""
    a=np.asarray(c).astype(float);mx=a.max(2);s=np.clip((mx-8)/40,0,1)
    body=nd.binary_closing(mx>22,iterations=3);fill=nd.binary_fill_holes(body)
    if hollow:
        lab,n=nd.label(fill&~body);sz=nd.sum(np.ones_like(lab),lab,range(1,n+1));hole=lab==(1+int(np.argmax(sz)))
        hole=nd.binary_opening(hole,iterations=3);solid=fill&~nd.binary_dilation(hole,iterations=2)
    else:solid=fill;hole=np.zeros_like(fill)
    f=np.asarray(Image.fromarray((nd.binary_erosion(solid,iterations=2)*255).astype('uint8')).filter(ImageFilter.GaussianBlur(1.2)))/255
    al=np.maximum(s,f)
    if hollow:
        h=np.asarray(Image.fromarray((hole*255).astype('uint8')).filter(ImageFilter.GaussianBlur(2)))/255
        al=al*(1-h)+h*(inner/255);a=a*(1-h[...,None])+h[...,None]*np.array([10,8,7])  # 内区统一暗底
    r=Image.fromarray(a.astype('uint8')).convert('RGBA');r.putalpha(Image.fromarray((np.clip(al,0,1)*255).astype('uint8')))
    ys,xs=np.nonzero(hole);hb=(xs.min(),ys.min(),xs.max()+1,ys.max()+1) if hollow else None
    return r,hb
def scaled(r,hb,W):
    sc=W/r.width;o=r.resize((W,round(r.height*sc)),Image.LANCZOS)
    if hb:hb=tuple(round(v*sc) for v in hb)
    return o,hb
# 背景
bg=load('4a39bf92');W,H=bg.size;w=round(H*390/844);x0=(W-w)//2
b=bg.crop((x0,0,x0+w,H)).resize((780,1688),Image.LANCZOS);b=ImageEnhance.Brightness(b).enhance(0.75)
g=np.asarray(b).astype(float);yy=np.linspace(-1,1,1688)[:,None];xx=np.linspace(-1,1,780)[None,:]
g=g*np.clip(1-0.35*(xx**2+0.6*yy**2),0.55,1)[...,None]  # 暗角
b=Image.fromarray(g.astype('uint8'))
for q in (80,74,68,62):
    save(b,'bg.webp',q)
    if INFO['bg.webp']['kb']<=150:break
# 图集
at=load('09e6060c');objs=objects(at);print('objects',objs)
assert len(objs)==4,objs
SL={}
for b_,(n,Wt,hol) in zip(objs,[('equip_frame.webp',300,1),('panel_old.webp',400,1),('panel_new.webp',400,1),('btn.webp',600,0)]):
    r,hb=frame_alpha(cut(at,b_),hollow=bool(hol));o,hb=scaled(r,hb,Wt);save(o,n)
    if hb:SL[n]={'top':hb[1],'right':o.width-hb[2],'bottom':o.height-hb[3],'left':hb[0]}
BTN=Image.open(O+'btn.webp').size
# 按下按钮 + 火花
sp=load('3c3a8274');W,H=sp.size;L=sp.crop((0,0,W//2,H));R=sp.crop((W//2,0,W,H))
lb=objects(L)[0];r,_=frame_alpha(cut(L,lb),hollow=False);save(r.resize(BTN,Image.LANCZOS),'btn_down.webp')
a=np.asarray(R).astype(float);m=a.max(2);ys,xs=np.nonzero(m>30);cx,cy=int(np.median(xs)),int(np.median(ys))
hw=max(cx-xs.min(),xs.max()-cx,cy-ys.min(),ys.max()-cy)+6;R=R.crop((cx-hw,cy-hw,cx+hw,cy+hw));a=np.asarray(R).astype(float);m=a.max(2)
al=np.clip((m-6)/200,0,1)**0.8;rgb=np.clip(a/np.maximum(al[...,None],1e-3),0,255)  # 去黑底预乘
o=Image.fromarray(rgb.astype('uint8')).convert('RGBA');o.putalpha(Image.fromarray((al*255).astype('uint8')));save(o.resize((512,512),Image.LANCZOS),'spark.webp')
json.dump({'files':INFO,'slice':SL},open('/tmp/reforge_info.json','w'),indent=1,default=int);print('slice',SL)
# 预览
os.makedirs('art_preview',exist_ok=True)
from PIL import ImageFont
F=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',16)
def chk(w,h,s=16):
    t=Image.new('RGB',(w,h));d=ImageDraw.Draw(t)
    for y in range(0,h,s):
        for x in range(0,w,s):d.rectangle((x,y,x+s-1,y+s-1),fill=(190,190,190) if (x+y)//s%2 else (140,140,140))
    return t
names=['bg.webp','equip_frame.webp','panel_old.webp','panel_new.webp','btn.webp','btn_down.webp','spark.webp']
CW,CH=420,470;sh=Image.new('RGB',(CW*4,CH*2),(40,40,40));d=ImageDraw.Draw(sh)
for i,n in enumerate(names):
    im=Image.open(O+n).convert('RGBA');sc=min(400/im.width,420/im.height,1);im=im.resize((round(im.width*sc),round(im.height*sc)),Image.LANCZOS)
    x,y=(i%4)*CW+10,(i//4)*CH+10;t=chk(400,420);t.paste(im,((400-im.width)//2,(420-im.height)//2),im);sh.paste(t,(x,y))
    d.text((x,y+425),f"{n}  {INFO[n]['size'][0]}×{INFO[n]['size'][1]}  {INFO[n]['kb']}KB",fill=(255,230,160),font=F)
sh.save('art_preview/p_reforge_sheet.png')
# 布局示意 390 宽（1x）
mk=Image.open(O+'bg.webp').convert('RGBA').resize((390,844),Image.LANCZOS);dm=ImageDraw.Draw(mk)
def put(n,box):
    im=Image.open(O+n).convert('RGBA').resize((box[2]-box[0],box[3]-box[1]),Image.LANCZOS);mk.alpha_composite(im,(box[0],box[1]))
def nine(n,box):  # 9-slice 拉伸
    im=Image.open(O+n).convert('RGBA');s=SL[n];W,H=im.size;w,h=box[2]-box[0],box[3]-box[1];k=0.5  # 2x 图 → 1x
    t,r,b_,l=s['top'],s['right'],s['bottom'],s['left'];T,R_,B,L=[round(v*k) for v in (t,r,b_,l)]
    xs=[(0,l,0,L),(l,W-r,L,w-R_),(W-r,W,w-R_,w)];ys=[(0,t,0,T),(t,H-b_,T,h-B),(H-b_,H,h-B,h)]
    for sy0,sy1,dy0,dy1 in ys:
        for sx0,sx1,dx0,dx1 in xs:
            mk.alpha_composite(im.crop((sx0,sy0,sx1,sy1)).resize((max(1,dx1-dx0),max(1,dy1-dy0)),Image.LANCZOS),(box[0]+dx0,box[1]+dy0))
dm.text((150,40),'淬锋精铸',fill=(255,210,140),font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',24))
put('equip_frame.webp',(14,110,14+150,110+round(150*INFO['equip_frame.webp']['size'][1]/INFO['equip_frame.webp']['size'][0])))
nine('panel_old.webp',(176,120,378,300));nine('panel_new.webp',(176,330,378,520))
dm=ImageDraw.Draw(mk);f2=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',13)
for i,tx in enumerate(['原词条','+12% 火焰伤害','+80 生命','+9% 攻击速度']):dm.text((202,146+i*24),tx,fill=(190,190,190),font=f2)
for i,tx in enumerate(['新词条','+18% 火焰伤害','+120 生命','+2 火系技能']):dm.text((202,360+i*24),tx,fill=(255,190,110),font=f2)
bw=300;bh=round(bw*BTN[1]/BTN[0]);put('btn.webp',((390-bw)//2,640,(390+bw)//2,640+bh))
sp=Image.open(O+'spark.webp').resize((160,160));mk.alpha_composite(sp,(195-80,640+bh//2-80))
mk.convert('RGB').save('art_preview/p_reforge_mock.png')
