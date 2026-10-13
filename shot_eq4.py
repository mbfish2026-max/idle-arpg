# 第四阶段截图：技能图标、自动施法设置、战斗技能栏、技能特效动画帧。python shot_p4.py → p4_*.png
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/home/box/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome')
    c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True)
    pg=c.new_page(); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: m.type=='error' and 'Failed to load resource' not in m.text and errs.append(m.text))
    pg.goto('http://localhost:8090/'); pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_timeout(1000)
    pg.evaluate("""dbg.lvl(32);Object.assign(S.sk,{rs:8,sm:6,cg:1,rm:3,te:3,ba:2,ce:3,bs:10,bw:1,bp:1,ad:2,wk:1,lr:1,pn:1,pd:1,pe:1});S.kp=0;
      S.actU={0:4};S.Q[0].q2=1;S.mercU=1;calc();H.life=ST.life;H.mana=ST.mana;
      goAct(1,0,1);S.auto=0;S.unl=17;TAB='fight';goZone(14);render()""")
    pg.wait_for_timeout(1500)
    # 主动触发各类特效，截动画进行中的帧
    pg.evaluate("for(const k in FXL.last)FXL.last[k]=0;MON=[];for(let i=0;i<4;i++)MON.push(mkMon(['serpent','tombmage','husk','jackal'][i],21));render()"); pg.wait_for_timeout(300)
    pg.evaluate("const ms=liveMon();ms[0].cur={id:'ad',until:GT+30,x:0};ms[1].cur={id:'lr',until:GT+30,x:20};H.abs=50;render();fx('spear',ms.slice(0,3));fx('summon');setTimeout(()=>{FXL.last={};fx('boom',[ms[3]])},60)")
    pg.wait_for_timeout(170); pg.screenshot(path='p4_fx_spear.png')
    pg.evaluate("FXL.last={};const ms=liveMon();fx('spirit',[ms[1]]);fx('cloud',[ms[2]]);fx('nova',ms)"); pg.wait_for_timeout(200); pg.screenshot(path='p4_fx_nova.png')
    pg.evaluate("FXL.last={};const ms=liveMon();fx('teeth',ms);fx('boom',[ms[0],ms[3]]);CRIT=1;floatNum(ms[0].uid,388,'#fff');CRIT=0;floatNum(ms[1].uid,97,'#f0ead0')"); pg.wait_for_timeout(180); pg.screenshot(path='p4_fx_boom.png')
    pg.wait_for_timeout(2500); pg.screenshot(path='p4_battle.png')
    pg.evaluate("TAB='skill';SKT=1;render()"); pg.wait_for_timeout(400); pg.screenshot(path='p4_skills_bone.png')
    pg.evaluate("SKT=0;render()"); pg.wait_for_timeout(300); pg.screenshot(path='p4_skills_summon.png')
    pg.evaluate("SKT=2;render()"); pg.wait_for_timeout(300); pg.screenshot(path='p4_skills_curse.png')
    pg.evaluate("acSet('ad','mode','int');acSet('ad','iv',5);acSet('pn','mode','mana');acSet('pn','mp',60);acSet('te','on',0);acMove('ce',-1);SKT=4;render()"); pg.wait_for_timeout(300); pg.screenshot(path='p4_autocast.png')
    pg.evaluate("TAB='fight';render()"); pg.wait_for_timeout(500); pg.evaluate("acPop('bs')"); pg.wait_for_timeout(300); pg.screenshot(path='p4_autocast_pop.png')
    pg.evaluate("closeM();dbg.speed(10);S.auto=1"); pg.wait_for_timeout(5000)
    print('fx nodes at 10x',pg.evaluate("document.querySelectorAll('.fxs').length"),'floats',pg.evaluate("document.querySelectorAll('.fl').length"))
    print('autoCast saved',pg.evaluate("JSON.stringify(JSON.parse(localStorage.getItem(KEY)).autoCast.cfg)"))
    print('errors',errs); b.close()
