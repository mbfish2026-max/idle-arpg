# 17 个新威能 + 16 个轻型底材图标：GenerateImage 黑底网格图集 → assets/icon2/pw/<id>.webp、assets/icon2/light/<id>.webp
# 方法同 gen_nec_icons.py：格内检测物体（膨胀合并，手套/靴子成对整体保留）、软 alpha、4px 边距、居中 128×128 webp q80
# 989c3dcd 行高不均（冠矮、袍高）：按列等分，列内按物体间的空白行切分上下两格，而非等分网格
import numpy as np,os,json,sys
sys.path.insert(0,os.path.dirname(__file__))
from PIL import Image,ImageFilter
from scipy import ndimage as nd
SRC='/cursor/stores/store-d6d0dde9-6f70-444f-9651-7ebc8c960baf/grok-bot/agents/8fc86b3c-8fbf-49dc-a9d3-1d905888f3e3/attachments/'
PW='assets/icon2/pw/';LT='assets/icon2/light/'
for d in(PW,LT):os.makedirs(d,exist_ok=True)
GRID=[('62b25e7b',3,2,PW,['pw_bonepact','pw_marrow','pw_shroud','pw_whirl','pw_ironspin','pw_soulcleave']),
 ('ba9c0bd5',3,2,PW,['pw_emberheart','pw_frostcore','pw_surge','pw_magma','pw_galestaff','pw_beastfang']),
 ('1b38c6d5',3,2,PW,['pw_blazequiver','pw_blazecloak','pw_thunderbadge','pw_zealring','pw_judgham']),
 ('37a8c1f1',4,2,LT,['ltg2','ltg3','lts1','lts2','lts3','ltb1','ltb2','ltb3'])]
UNEVEN=('989c3dcd',4,LT,[['ltc1','ltr1'],['ltc2','ltr2'],['ltc3','ltr3'],['ltc4','ltg1']])
def load(h):return Image.open(SRC+[x for x in os.listdir(SRC) if x.startswith(h)][0]).convert('RGB')
def bbox(c,thr=28,dil=8,minarea=300):
    a=np.asarray(c).astype(int);m=a.max(2)>thr;lab,n=nd.label(nd.binary_dilation(m,iterations=dil));bs=[]
    for i,s in enumerate(nd.find_objects(lab)):
        sub=(lab[s]==i+1)&m[s]
        if sub.sum()<minarea:continue
        ys,xs=np.nonzero(sub);bs.append((sub.sum(),(s[1].start+xs.min(),s[0].start+ys.min(),s[1].start+xs.max()+1,s[0].start+ys.max()+1)))
    big=max(x[0] for x in bs);bs=[b for a,b in bs if a>=big*0.08]
    return min(b[0] for b in bs),min(b[1] for b in bs),max(b[2] for b in bs),max(b[3] for b in bs)
def soft(c,fill_holes=True):
    a=np.asarray(c).astype(float);mx=a.max(2);s=np.clip((mx-8)/40,0,1)
    if not fill_holes:  # 只按亮度生成 alpha（环形物体圈内保持透明）
        r=c.convert('RGBA');r.putalpha(Image.fromarray((s*255).astype('uint8')));return r
    fill=nd.binary_fill_holes(nd.binary_closing(mx>22,iterations=4));fill=nd.binary_erosion(fill,iterations=2)
    f=np.asarray(Image.fromarray((fill*255).astype('uint8')).filter(ImageFilter.GaussianBlur(1.2)))/255;s=np.maximum(s,f)
    r=c.convert('RGBA');r.putalpha(Image.fromarray((s*255).astype('uint8')));return r
NOFILL={'ltc1'}  # 环冠：圈内须透明，不做连通填充
def emit(c,path):
    x0,y0,x1,y1=bbox(c);p=4
    r=soft(fill_holes=os.path.basename(path)[:-5] not in NOFILL,c=c.crop((max(0,x0-p),max(0,y0-p),min(c.width,x1+p),min(c.height,y1+p))))
    S=124;sc=S/max(r.size);r=r.resize((max(1,round(r.width*sc)),max(1,round(r.height*sc))),Image.LANCZOS)
    o=Image.new('RGBA',(128,128),(0,0,0,0));o.paste(r,((128-r.width)//2,(128-r.height)//2),r)
    o.save(path,'WEBP',quality=80,method=6);print(path,(x1-x0,y1-y0),os.path.getsize(path))
for h,cols,rows,out,ids in GRID:
    im=load(h);W,H=im.size
    for k,id_ in enumerate(ids):
        cx,cy=k%cols,k//cols;emit(im.crop((round(cx*W/cols),round(cy*H/rows),round((cx+1)*W/cols),round((cy+1)*H/rows))),out+id_+'.webp')
h,cols,out,colids=UNEVEN;im=load(h);W,H=im.size
for cx,(top,bot) in enumerate(colids):
    x0,x1=round(cx*W/cols),round((cx+1)*W/cols);col=im.crop((x0,0,x1,H))
    m=(np.asarray(col).astype(int).max(2)>28).sum(1)  # 每行亮像素数
    lo,hi=int(H*.12),int(H*.6);empty=m[lo:hi]<=2;best=(0,0);run=0
    for i,e in enumerate(empty):
        run=run+1 if e else 0
        if run>best[0]:best=(run,lo+i-run+1)
    cut=best[1]+best[0]//2;print(h,cx,'split y=',cut,'gap',best[0])
    emit(col.crop((0,0,col.width,cut)),out+top+'.webp');emit(col.crop((0,cut,col.width,H)),out+bot+'.webp')
