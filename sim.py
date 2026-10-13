# 无头数值模拟：全自动挂机（自动加点/加属性/换装/买药/推进/随从），从 1 级起跑
# 用法: [PORT=8090] python sim.py [最大模拟小时=60] [停止于: normal|nm|hell]
# 死亡不再扣经验(24ed91f)，sim 直接调用游戏内 die()，无独立公式副本
import sys, json, time
from playwright.sync_api import sync_playwright
MAXH=float(sys.argv[1]) if len(sys.argv)>1 else 60
STOP=sys.argv[2] if len(sys.argv)>2 else 'nm'
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/home/box/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome')
    pg=b.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('http://localhost:%s/'%__import__('os').environ.get('PORT','8090')); pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_timeout(500)
    pg.evaluate("""(()=>{TAB='map';render();SPEED=0;window.SIM={t:0,ev:[],deaths:0,done:{},kills0:0,dz:{}};const od=die;die=function(){SIM.deaths++;const k=S.diff+'_'+S.act;SIM.dz[k]=(SIM.dz[k]||0)+1;if(S.act>=0){const zn=S.diff+'_'+ACTS[S.act].zones[S.zone].n;SIM.dzn=SIM.dzn||{};SIM.dzn[zn]=(SIM.dzn[zn]||0)+1}od()};
      window.simRun=function(sec){let acc=0;const end=SIM.t+sec;while(SIM.t<end){step(0.05);SIM.t+=0.05;acc+=0.05;if(acc>=1){acc=0;autoTick();
        for(let d=0;d<3;d++)for(let a=0;a<5;a++){const k=d+'_'+a,fq=ACTS[a].fq,Q=(S.Q&&S.Q[d])||{};if(!SIM.done[k]&&Q[fq]){SIM.done[k]=1;SIM.ev.push({d,a,h:+(SIM.t/3600).toFixed(2),lv:S.lvl,deaths:SIM.deaths,kills:S.kills,gold:S.gold})}}}}
        return{h:+(SIM.t/3600).toFixed(2),lv:S.lvl,d:S.diff,a:S.act,z:S.zone,zn:ACTS[S.act].zones[S.zone].n,deaths:SIM.deaths,kills:S.kills,merc:S.merc?(S.merc.dead?'dead':ALLY.find(x=>x.kind==='merc')?.max):null,sk:JSON.stringify(S.sk),life:ST.life,res:ST.res}}})()""")
    t0=time.time();last=None
    while True:
        r=pg.evaluate("simRun(1800)")
        print(json.dumps(r,ensure_ascii=False),flush=True)
        ev=pg.evaluate("SIM.ev")
        done={(e['d'],e['a']) for e in ev}
        if STOP=='nm' and (1,4) in done: break
        if STOP=='hell' and (2,4) in done: break
        if STOP=='normal' and (0,4) in done: break
        if r['h']>=MAXH: break
    ev=pg.evaluate("SIM.ev"); prev=0
    print('\n== 各章通关（模拟挂机时间） ==')
    for e in ev:
        print(f"{['普通','噩梦','地狱'][e['d']]} 第{e['a']+1}章: 累计 {e['h']}h (本章 {e['h']-prev:.2f}h)  等级 {e['lv']}  累计死亡 {e['deaths']}  击杀 {e['kills']}"); prev=e['h']
    print('死亡分布',pg.evaluate("JSON.stringify(SIM.dz)"),'僵持撤退',pg.evaluate("JSON.stringify([ACX.stuckN||0,ACX.stz])"))
    print('死亡区域',pg.evaluate("JSON.stringify(SIM.dzn||{})"))
    print('真实耗时 %.0fs'%(time.time()-t0),'JS错误',errs)
    b.close()
