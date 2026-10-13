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
    if W in('para','all'):
        loadchar('tests/eg_char_hell.json')
        r=run(pg,"(()=>{const a=JSON.stringify({lv:S.lvl,life:ST.life,res:ST.res,mf:ST.mf,vit:ST.attr.vit});const x0=S.xp,k0=S.kills;egSim(3600);return a+' → 1h: '+JSON.stringify({lv:S.lvl,xpGain:S.xp-x0,kills:S.kills-k0,para:EG().para.lv,pxp:Math.round(EG().para.xp)})})()")
        print('para 1h',r)
        r=run(pg,"(()=>{EG().para.lv+=40;const b=JSON.stringify({life:ST.life,res:ST.res.fire,mf:ST.mf,fcr:ST.fcr,sumdmg:ST.sumdmg,vit:ST.attr.vit});egParaAuto();return b+' → +40点自动分配: '+JSON.stringify({pts:EG().para.pts,life:ST.life,res:ST.res.fire,mf:ST.mf,fcr:ST.fcr,sumdmg:ST.sumdmg,vit:ST.attr.vit,baseVit:S.at.vit,spd:ST.egSpd})})()")
        print('para alloc',r)
        shot('p5_para.png','eg',"EGT='para'")
        run(pg,"egParaReset();EG().para.auto=0;calc()"); shot('p5_para_free.png','eg')
        print('reset ok',run(pg,"JSON.stringify({free:egPfree(),vit:ST.attr.vit,base:S.at.vit})"))
    if W in('power','all'):
        loadchar('tests/eg_char_normal.json')
        # 掉落率：章节首领/精英/普通各 3000 次 TC
        r=run(pg,"""(()=>{const c={u:0,ulp:0,leg:0,n:0};const z=ACTS[4].zones[3];for(const fl of ['','champ','boss'])for(let i=0;i<3000;i++){const m=fl==='boss'?mkMon('eldron',45):mkMon(z.mons[0],45,fl);for(const it of rollTC(m)){if(it.k)continue;c.n++;if(it.q===5){c.u++;if(it.lp)c.ulp++}if(it.leg)c.leg++}}S.bag=S.bag.filter(x=>!x.lp);return JSON.stringify(c)})()""")
        print('lp drops',r)
        # 战力对比：同一区域 30 分钟击杀数，无威能 vs 各组合
        base="(()=>{const k0=S.kills;goAct(4,0,1);S.auto=0;goZone(3);egSim(1800);return S.kills-k0})()"
        for combo in [[],['bs_split'],['skel_burst','legion'],['curse_spread','curse_wide'],['bs_split','legion','soul_feast']]:
            run(pg,"EG().lp.cube={w:null,a:null,j:null};EG().lp.arch={};"+";".join("EG().lp.arch['%s']=1;EG().lp.cube[EG_LP['%s'].c]='%s'"%(k,k,k) for k in combo)+";calc()")
            print('combo',combo,'kills/30min',run(pg,base),'deaths',run(pg,"EG().stat.egdie||0"))
        run(pg,"EG().lp.cube={w:null,a:null,j:null};calc()")
        run(pg,"const it=egLpApply(genItem(45,{base:BASEM[pick(Object.keys(BASEM).filter(k=>BASEM[k].s==='weapon'))],q:4}),999);S.bag.push(it);window._lpu=it.uid;S.bag.push({uid:S.uid++,k:'gem',g:'rub',lv:1});S.gold+=1e6")
        shot('p5_lp_item.png','bag',"showItem(window._lpu)")
        run(pg,"EG_LPNOCONF=1;egLpExtract(window._lpu)"); print('extract',run(pg,"JSON.stringify(EG().lp)"))
        run(pg,"for(const k of ['skel_burst','curse_spread','ce_ember'])EG().lp.arch[k]=1;egLpSet('a','skel_burst');egLpSet('j','curse_spread');const u=egLpApply(genItem(45,{q:5}),99);S.bag.push(u)")
        shot('p5_lp_cube.png','eg',"EGT='power'")
        shot('p5_lp_skill.png','skill',"SKT=0")
    if W in('season','all'):
        pg.goto('http://localhost:8090/'); pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_timeout(800); run(pg,SIMJS)
        hero(30); run(pg,"save()")
        shot('p5_season_pre.png','eg',"EGT='season'")
        run(pg,"window.__NOUI=0;document.getElementById('egsname').value='灰烬行者';egNewSeasonChar()")
        print('season char',run(pg,"JSON.stringify({lv:S.lvl,name:S.name,season:EG().season,chars:typeof ACCT!=='undefined'?ACCT.chars.map(c=>c.name+':'+c.lvl):null,mf:ST.mf})"))
        run(pg,"closeM();S.sk.rs=1;S.kp=0;calc();SPEED=0")
        r=run(pg,"egSim(7200);egJourneyTick();JSON.stringify({lv:S.lvl,jc:EG().season.jc,kills:EG().stat.kills,act:S.act,gold:S.gold})")
        print('season 2h',r)
        shot('p5_season.png','eg',"EGT='season'")
    if W in('secret','all'):
        loadchar('tests/eg_char_normal.json')
        shot('p5_secret_lock.png','eg',"EGT='secret'")
        r=run(pg,"(()=>{goAct(0,0,1);S.unl=Math.max(S.unl,8);S.auto=0;goZone(8);let t=0;while(!egSec().staff[0]&&t<3600){egSim(30);t+=30}return JSON.stringify({t,staff:egSec().staff})})()")
        print('staff',r)
        shot('p5_secret.png','eg',"EGT='secret'")
        r=run(pg,"(()=>{const x0=S.xp,k0=S.kills,b0=S.bag.filter(i=>i.q===5).length;egSecretStart();const run=EGM;let t=0;while(EGM===run&&t<1800){egSim(5);t+=5}return JSON.stringify({t,won:!!run.won,deaths:run.deaths||0,kills:S.kills-k0,xp:S.xp-x0,uniq:S.bag.filter(i=>i.q===5).length-b0,king:egSec().king})})()")
        print('secret run',r)
        run(pg,"SPEED=1;S.pot.tp+=1;egSecretStart()"); pg.wait_for_timeout(2500); shot('p5_secret_fight.png')
        run(pg,"EGM.w=11;MON=[];spawnT=0.1"); pg.wait_for_timeout(2000); shot('p5_secret_king.png')
        run(pg,"egLeave(1)")
    if W in('ach','all'):
        loadchar('tests/eg_char_hell.json')
        print('codex',run(pg,"JSON.stringify({u:Object.keys(EG().codex.u).length,s:Object.keys(EG().codex.s).length,sets:egCodexSetsDone(),mf:ST.mf,ach:Object.keys(EG().ach)})"))
        run(pg,"EG().stat.kills=25000;egAchCheck();egSetTitle(egTitles()[0]||null)")
        shot('p5_ach.png','eg',"EGT='ach';EG_ACV='ach'")
        run(pg,"for(const x of SETITEMS.filter(x=>x.set==='grave'))EG().codex.s[x.n]=1;for(const u of UNIQUES.slice(0,12))EG().codex.u[u.n]=1;calc()")
        print('codex2',run(pg,"JSON.stringify({sets:egCodexSetsDone(),mf:ST.mf,res:ST.res})"))
        shot('p5_codex.png','eg',"EG_ACV='cx'")
        shot('p5_title_hero.png','hero')
        shot('p5_title_fight.png','fight',None,1200)
    if W in('event','all'):
        loadchar('tests/eg_char_normal.json')
        run(pg,"EG().ev.wbAuto=0;goAct(4,0,1);S.auto=0;goZone(3)")
        a=run(pg,"(()=>{EG().clock=EG_TIDE.dur+10;const k0=S.kills,d0=EG().stat.egdie||0,x0=S.xp;egSim(900);return JSON.stringify({kills:S.kills-k0,xp:S.xp-x0})})()")
        bb=run(pg,"(()=>{EG().clock=EG_TIDE.cyc*3;const k0=S.kills,x0=S.xp;egSim(890);return JSON.stringify({tide:egTideOn(),kills:S.kills-k0,xp:S.xp-x0,ember:EG().ev.ember})})()")
        print('15min 无血潮',a,' 血潮',bb)
        run(pg,"SPEED=1;EG().clock=EG_TIDE.cyc*4+60;MON=[];spawnT=0.1"); pg.wait_for_timeout(2500); shot('p5_tide_fight.png')
        run(pg,"SPEED=0;EG().ev.ember=520")
        shot('p5_event.png','eg',"EGT='event'")
        run(pg,"egTideChest()"); print('chest ok',run(pg,"EG().ev.ember"))
        # 精英词缀
        print('aff',run(pg,"(()=>{const r={};for(const k in EG_AFF){const m=mkMon('minion',45,'uniq');EG_AFF[k].f(m);r[k]=!!(m.egRegen||m.egBomb||m.egMirror||m.egWard||m.egThorn||m.egFrz)}return JSON.stringify(r)})()"))
        # 世界首领
        r=run(pg,"(()=>{EG().ev.wbAuto=1;EG().ev.wbDone=null;EG().clock=EG_WB.off+EG_WB.cyc*5+1;egSim(2);const run=EGM;const k=run&&run.k;let t=0;while(EGM===run&&t<400){egSim(5);t+=5}return JSON.stringify({k,t,dead:run&&run.boss&&run.boss.hp<=0,hp:run&&run.boss&&Math.round(run.boss.hp/run.boss.max*100),wboss:EG().stat.wboss||0})})()")
        print('world boss',r)
        run(pg,"EG().ev.wbDone=null;EG().clock=EG_WB.off+EG_WB.cyc*7+1;SPEED=1;egWbStart()"); pg.wait_for_timeout(3000); shot('p5_wboss.png')
        run(pg,"egLeave(1);EG().clock=EG_WB.off+EG_WB.cyc*8-60;TAB='fight';render()"); pg.wait_for_timeout(800); shot('p5_wboss_warn.png')
    print('errors',errs)
    b.close()
