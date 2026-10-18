# 亡灵流派 26 件套装/暗金图标：手绘黑底网格图集 → assets/icon2/nec/<id>.webp（128×128，软 alpha，居中）
# 每格内检测物体（膨胀合并，手套/靴子一对整体保留），取格内所有物体的并集边界
import numpy as np,os,json
from PIL import Image,ImageFilter
from scipy import ndimage as nd
SRC='/cursor/stores/store-d6d0dde9-6f70-444f-9651-7ebc8c960baf/grok-bot/agents/8fc86b3c-8fbf-49dc-a9d3-1d905888f3e3/attachments/'
OUT='assets/icon2/nec/';os.makedirs(OUT,exist_ok=True)
SHEETS=[('fa033c19',3,2,[('nb_wg_head','万骨·统御颅'),('nb_wg_helm','万骨·骸冠'),('nb_wg_armor','万骨·墓甲'),('nb_wg_gloves','万骨·驭尸手'),('nb_wg_belt','万骨·亡索'),('nb_wg_boots','万骨·冥途靴')]),
 ('42b50845',3,2,[('nb_jg_wand','棘冠·骨镞'),('nb_jg_helm','棘冠·骸面'),('nb_jg_armor','棘冠·骨织袍'),('nb_jg_gloves','棘冠·穿骨手'),('nb_jg_belt','棘冠·髓带'),('nb_jg_boots','棘冠·疾骨靴')]),
 ('4f59deb1',3,2,[('nb_ym_head','疫母·腐颅'),('nb_ym_helm','疫母·疫冠'),('nb_ym_armor','疫母·毒囊甲'),('nb_ym_gloves','疫母·腐指'),('nb_ym_belt','疫母·瘟带'),('nb_ym_boots','疫母·尸行靴')]),
 ('27b2e764',4,2,[('nb_u_throne','白骨王座'),('nb_u_pact','亡契'),('nb_u_ward','冥卫之戒'),('nb_u_marrow','骨髓之环'),('nb_u_eye','骸语之眼'),('nb_u_rot','腐心'),('nb_u_src','疫源护符'),('nb_u_corpse','尸王之戒')])]
def load(h):return Image.open(SRC+[x for x in os.listdir(SRC) if x.startswith(h)][0]).convert('RGB')
def bbox(c,thr=28,dil=8,minarea=300):
    a=np.asarray(c).astype(int);m=a.max(2)>thr;lab,n=nd.label(nd.binary_dilation(m,iterations=dil));bs=[]
    H,W=m.shape
    for i,s in enumerate(nd.find_objects(lab)):
        sub=(lab[s]==i+1)&m[s]
        if sub.sum()<minarea:continue
        ys,xs=np.nonzero(sub);b=(s[1].start+xs.min(),s[0].start+ys.min(),s[1].start+xs.max()+1,s[0].start+ys.max()+1)
        bs.append((sub.sum(),b))
    big=max(x[0] for x in bs);bs=[b for a,b in bs if a>=big*0.08]  # 去掉零星噪点/文字碎片
    return min(b[0] for b in bs),min(b[1] for b in bs),max(b[2] for b in bs),max(b[3] for b in bs)
def soft(c):
    a=np.asarray(c).astype(float);mx=a.max(2);s=np.clip((mx-8)/40,0,1)
    fill=nd.binary_fill_holes(nd.binary_closing(mx>22,iterations=4));fill=nd.binary_erosion(fill,iterations=2)
    f=np.asarray(Image.fromarray((fill*255).astype('uint8')).filter(ImageFilter.GaussianBlur(1.2)))/255;s=np.maximum(s,f)
    r=c.convert('RGBA');r.putalpha(Image.fromarray((s*255).astype('uint8')));return r
M={}
for h,cols,rows,items in SHEETS:
    im=load(h);W,H=im.size
    for k,(id_,nm) in enumerate(items):
        cx,cy=k%cols,k//cols;cell=(round(cx*W/cols),round(cy*H/rows),round((cx+1)*W/cols),round((cy+1)*H/rows))
        c=im.crop(cell);x0,y0,x1,y1=bbox(c);p=4
        r=soft(c.crop((max(0,x0-p),max(0,y0-p),min(c.width,x1+p),min(c.height,y1+p))))
        S=124;sc=S/max(r.size);r=r.resize((max(1,round(r.width*sc)),max(1,round(r.height*sc))),Image.LANCZOS)
        o=Image.new('RGBA',(128,128),(0,0,0,0));o.paste(r,((128-r.width)//2,(128-r.height)//2),r)
        o.save(OUT+id_+'.webp','WEBP',quality=80,method=6);M[nm]=id_;print(id_,nm,(x1-x0,y1-y0),os.path.getsize(OUT+id_+'.webp'))
print(json.dumps(M,ensure_ascii=False))
