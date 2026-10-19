# 暗渊三魂/血月素材 22 张：GenerateImage 黑底 3×2 网格 → assets/boss/abyss_*.webp、assets/icon2/abyss/*.webp、assets/ui2/bloodmoon*.webp
# id 自定（系统开发暂无对应 id）。方法同 gen_pw_lt_icons.py：格内检测物体、软 alpha、webp q80
import os,sys
sys.path.insert(0,os.path.dirname(__file__))
import numpy as np
from PIL import Image,ImageDraw,ImageFilter
from scipy import ndimage as nd
SRC='/cursor/stores/store-d6d0dde9-6f70-444f-9651-7ebc8c960baf/grok-bot/agents/8fc86b3c-8fbf-49dc-a9d3-1d905888f3e3/attachments/'
B='assets/boss/';I='assets/icon2/abyss/';U='assets/ui2/'
for d in(B,I,U):os.makedirs(d,exist_ok=True)
GRID=[('d03f59e5',[(B,'abyss_g1','苦痛之母·莉丝艾'),(B,'abyss_g2','腐沙之王·度瑞恩'),(B,'abyss_g3','堕天使·伊苏尔德'),(B,'abyss_s1','憎恨之魂'),(B,'abyss_s2','毁灭之魂'),(B,'abyss_s3','恐惧之魂')]),
 ('a43eef23',[(I,'key_fear','恐惧魂钥'),(I,'key_hate','憎恨魂钥'),(I,'key_doom','毁灭魂钥'),(I,'core_horn','悲恸之角'),(I,'core_eye','凝视之眼'),(I,'core_brain','低语之脑')]),
 ('95d1d2ad',[(I,'torch','渊火之炬'),(I,'shard','灭魂碎片'),(I,'myth_crown','命运之冠'),(I,'myth_armor','永夜战甲'),(I,'myth_ring','群星之戒'),(U,'bloodmoon','血月之地标识')]),
 ('7d8a30a4',[(I,'ward_fire','破障护符·烈焰'),(I,'ward_cold','破障护符·冰封'),(I,'ward_lit','破障护符·雷鸣'),(I,'ward_pois','破障护符·剧毒'),(I,'ward_phys','破障护符·骨裂（物理）'),(I,'ward_void','破障护符·虚空')])]
def load(h):return Image.open(SRC+[x for x in os.listdir(SRC) if x.startswith(h)][0]).convert('RGB')
def bbox(c,thr=28,dil=8,minarea=300):
    a=np.asarray(c).astype(int);m=a.max(2)>thr;lab,n=nd.label(nd.binary_dilation(m,iterations=dil));bs=[]
    for i,s in enumerate(nd.find_objects(lab)):
        sub=(lab[s]==i+1)&m[s]
        if sub.sum()<minarea:continue
        ys,xs=np.nonzero(sub);bs.append((sub.sum(),(s[1].start+xs.min(),s[0].start+ys.min(),s[1].start+xs.max()+1,s[0].start+ys.max()+1)))
    big=max(x[0] for x in bs);bs=[b for a,b in bs if a>=big*0.08]
    return min(b[0] for b in bs),min(b[1] for b in bs),max(b[2] for b in bs),max(b[3] for b in bs)
def soft(c):
    a=np.asarray(c).astype(float);mx=a.max(2);s=np.clip((mx-8)/40,0,1)
    fill=nd.binary_fill_holes(nd.binary_closing(mx>22,iterations=4));fill=nd.binary_erosion(fill,iterations=2)
    f=np.asarray(Image.fromarray((fill*255).astype('uint8')).filter(ImageFilter.GaussianBlur(1.2)))/255;s=np.maximum(s,f)
    r=c.convert('RGBA');r.putalpha(Image.fromarray((s*255).astype('uint8')));return r
def fit(c,N,p):
    x0,y0,x1,y1=bbox(c);r=soft(c.crop((max(0,x0-p),max(0,y0-p),min(c.width,x1+p),min(c.height,y1+p))))
    S=N-2*p;sc=S/max(r.size);r=r.resize((max(1,round(r.width*sc)),max(1,round(r.height*sc))),Image.LANCZOS)
    o=Image.new('RGBA',(N,N),(0,0,0,0));o.paste(r,((N-r.width)//2,(N-r.height)//2),r);return o
def save(o,path):o.save(path,'WEBP',quality=80,method=6);print(path,o.size,os.path.getsize(path))
def circle(o):  # 圆形外强制透明
    N=o.width;m=Image.new('L',(N*4,N*4),0);ImageDraw.Draw(m).ellipse((0,0,N*4-1,N*4-1),fill=255);m=m.resize((N,N),Image.LANCZOS)
    a=np.minimum(np.asarray(o.getchannel('A')),np.asarray(m));o=o.copy();o.putalpha(Image.fromarray(a));return o
OUT=[]
for h,items in GRID:
    im=load(h);W,H=im.size
    for k,(d,id_,zh) in enumerate(items):
        cx,cy=k%3,k//3;c=im.crop((round(cx*W/3),round(cy*H/2),round((cx+1)*W/3),round((cy+1)*H/2)))
        if d==B:o=fit(c,256,4);save(o,d+id_+'.webp');OUT.append((d+id_+'.webp',zh))
        elif d==U:
            for n,suf in((128,''),(64,'_64')):
                o=circle(fit(c,n,2 if n==64 else 4));save(o,d+id_+suf+'.webp');OUT.append((d+id_+suf+'.webp',zh+f' {n}px'))
        else:o=fit(c,128,4);save(o,d+id_+'.webp');OUT.append((d+id_+'.webp',zh))
# 预览拼图（棋盘格底）
from PIL import ImageFont
fp=[p for p in('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc','/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc','/usr/share/fonts/truetype/wqy/wqy-microhei.ttc') if os.path.exists(p)]
font=ImageFont.truetype(fp[0],14) if fp else ImageFont.load_default()
CW,CH,cols=280,320,6;rows=(len(OUT)+cols-1)//cols;sh=Image.new('RGB',(CW*cols,CH*rows),(40,40,40))
for i,(p,zh) in enumerate(OUT):
    x,y=(i%cols)*CW,(i//cols)*CH;t=Image.new('RGB',(256,256))
    for yy in range(0,256,16):
        for xx in range(0,256,16):ImageDraw.Draw(t).rectangle((xx,yy,xx+15,yy+15),fill=(200,200,200) if (xx+yy)//16%2 else (150,150,150))
    o=Image.open(p).convert('RGBA');t.paste(o,((256-o.width)//2,(256-o.height)//2),o);sh.paste(t,(x+12,y+6))
    d=ImageDraw.Draw(sh);d.text((x+12,y+266),zh,fill=(255,230,160),font=font);d.text((x+12,y+288),p.replace('assets/',''),fill=(200,200,200),font=font)
os.makedirs('art_preview',exist_ok=True);sh.save('art_preview/p_abyss_sheet.png');print(len(OUT),'files')
