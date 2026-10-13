# 第五阶段（终局系统）截图与自动测试：python shot_eg.py <项> ；项=bounty|rift|para|power|season|secret|ach|event|all
import sys, json
from playwright.sync_api import sync_playwright
W=sys.argv[1] if len(sys.argv)>1 else 'all'
SIMJS="""window.egSim=function(sec){const end=GT+sec;let a=0;while(GT<end){step(0.05);a+=0.05;if(a>=1){a=0;autoTick()}}return GT}"""
SETUP="""localStorage.clear();"""
def run(pg,js): return pg.evaluate(js)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/home/box/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome')
    c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True)
    pg=c.new_page(); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: m.type=='error' and 'Failed to load resource' not in m.text and errs.append(m.text))
    pg.goto('http://localhost:8090/'); pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_timeout(800)
    run(pg,SIMJS)
    def hero(lv,diff=0):
        run(pg,f"""dbg.lvl({lv});Object.assign(S.sk,{{rs:12,sm:10,cg:1,rm:5,te:1,ba:1,ce:4,bs:16,ad:4,wk:1,bw:1,bp:1,bx:6}});S.kp=0;S.sp=0;S.at.vit+={lv*3};
          for(const s of ['weapon','helm','armor','gloves','belt','boots','amulet','ring1','ring2','shield']){{}}
          egdbg.beatNormal();egdbg.unlockZones();calc();H.life=ST.life;H.mana=ST.mana""")
    def shot(name,tab=None,js=None,wait=400):
        if js: run(pg,js)
        if tab: run(pg,f"TAB='{tab}';render()")
        pg.wait_for_timeout(wait); pg.screenshot(path=name); print('shot',name)
    LC=[0]
    def loadchar(f):
        import json as _j
        d=open(f).read(); LC[0]+=1; tok='egl%d'%LC[0]
        pg.add_init_script("if(!sessionStorage.%s){sessionStorage.%s=1;localStorage.clear();localStorage.setItem('anye_d2_v2',%s)}"%(tok,tok,_j.dumps(d)))
        pg.goto('http://localhost:8090/'); pg.wait_for_timeout(800); run(pg,SIMJS); run(pg,"closeM();SPEED=0")
        print('loaded',run(pg,"S.lvl"))
    out={}
    if W in('bounty','all'):
        hero(30)
        run(pg,"SPEED=0;egBountyReset();EG().bounty.auto=1")
        shot('p5_bounty.png','eg',"EGT='bounty'")
        # 自动悬赏挂机 40 分钟游戏时间
        r=run(pg,"egSim(2400);JSON.stringify({d:EG().bounty.d.map(b=>b.t+':'+b.p+'/'+b.goal+(b.done?'✔':'')),w:EG().bounty.w.map(w=>w.t+':'+w.p),caches:EG().bounty.caches,ret:EG().bounty.ret,zone:S.zone,act:S.act,auto:S.auto,lvl:S.lvl})")
        print('bounty sim',r); out['bounty']=r
        shot('p5_bounty_done.png','eg')
        run(pg,"EG().bounty.caches=Math.max(1,EG().bounty.caches);egOpenCache(0)"); shot('p5_bounty_cache.png')
        run(pg,"closeM();SPEED=1")
        shot('p5_bounty_fight.png','fight',"egBountyGo(EG().bounty.d.findIndex(b=>!b.done)>=0?EG().bounty.d.findIndex(b=>!b.done):0)",2000)
    if W in('rift','all'):
        import os
        loadchar(os.environ.get('EGCHAR','tests/eg_char_normal.json'))
        run(pg,"SPEED=0;EG_RIFT.auto=1")
        res=[]
        for T in [0,0,1,1,3,3,5,5,8,8,10,10,15,15,20,20]:
            r=run(pg,"""(()=>{EG().rift.max=Math.max(EG().rift.max,TT);EG().rift.keys+=1;egRiftStart(TT);const run=EGM;let s=0;while(EGM===run&&s<900){egSim(5);s+=5}
              return JSON.stringify({T:TT,t:Math.round(run.t),el:Math.round(run.el||0),kills:S.kills,ok:run.res?run.res.ok:null,done:!!run.gdone,deaths:run.deaths,prog:run.prog,up:run.res&&run.res.up,lv:S.lvl,life:ST.life})})()""".replace('TT',str(T)))
            print('rift',r); res.append(r)
        out['rift']=res
        run(pg,"EG_RIFT.auto=0;SPEED=1;closeM()")
        shot('p5_rift.png','eg',"EGT='rift'")
        run(pg,"EG().rift.keys+=1;egRiftStart(3)"); pg.wait_for_timeout(3000); shot('p5_rift_fight.png')
        run(pg,"EGM.prog=100;MON=[];spawnT=0.1"); pg.wait_for_timeout(1500); shot('p5_rift_guard.png')
        run(pg,"EGM.guard.hp=1;hitMon(EGM.guard,{magic:99},'hero')"); pg.wait_for_timeout(500); shot('p5_rift_done.png')
        run(pg,"closeM()")
    print('errors',errs)
    b.close()
