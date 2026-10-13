import sys
if len(sys.argv)>1 and sys.argv[1]=='p2':
    # 第二阶段截图：各章战斗/地图、噩梦/地狱、随从面板。用法: python shot.py p2
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        b=p.chromium.launch(executable_path='/home/box/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome')
        c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True)
        pg=c.new_page(); errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: m.type=='error' and 'Failed to load resource' not in m.text and errs.append(m.text))
        pg.goto('http://localhost:8090/'); pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_timeout(800)
        pg.evaluate("""dbg.lvl(24);Object.assign(S.sk,{rs:8,sm:6,cg:1,rm:3,te:1,ba:1,ce:1,bs:8,ad:2,wk:1});S.kp=0;
          S.actU={0:4,1:4,2:4};S.diffU=2;S.Q[0].q2=1;S.mercU=1;hireMerc('guard','might',1);calc();H.life=ST.life;H.mana=ST.mana""")
        boss={0:20,1:17,2:13,3:4,4:17}
        lv={0:14,1:24,2:32,3:37,4:44}
        for a in range(5):
            pg.evaluate(f"dbg.lvl({lv[a]});goAct({a},0,1);TAB='fight';S.auto=0;S.unl=ACTS[{a}].zones.length-1;goZone({boss[a]});S.wave={'2' if a==4 else 'ACTS[%d].zones[%d].w-1'%(a,boss[a])};MON=[];spawnT=0.1;calc();H.life=ST.life;render()")
            pg.wait_for_timeout(2500); pg.screenshot(path=f'p2_battle_a{a+1}.png')
            pg.evaluate(f"MAPA={a};MAPD=0;TAB='map';render()"); pg.wait_for_timeout(300); pg.screenshot(path=f'p2_map_a{a+1}.png')
        pg.evaluate("dbg.lvl(60);goAct(3,1,1);MAPA=3;MAPD=1;TAB='map';render()"); pg.wait_for_timeout(300); pg.screenshot(path='p2_map_nm_a4.png')
        pg.evaluate("dbg.lvl(75);goAct(4,2,1);TAB='fight';S.auto=0;S.unl=18;goZone(15);S.wave=3;MON=[];spawnT=0.1;render()"); pg.wait_for_timeout(2500); pg.screenshot(path='p2_battle_hell_a5.png')
        pg.evaluate("MAPA=4;MAPD=2;TAB='map';render()"); pg.wait_for_timeout(300); pg.screenshot(path='p2_map_hell_a5.png')
        pg.evaluate("S.autoEq=0;S.sockq=1;S.pers=1;const it=genItem(40,{base:BASEM.hlm3,q:1});it.sock=0;S.bag.push(it);window._sh=it.uid;TAB='hero';render()"); pg.wait_for_timeout(300)
        pg.evaluate("document.querySelectorAll('.gp')[2]&&document.querySelectorAll('.gp')[2].scrollIntoView()"); pg.screenshot(path='p2_hero_merc.png')
        pg.evaluate("showItem(window._sh)"); pg.wait_for_timeout(300); pg.screenshot(path='p2_item_sock.png')
        print('errors',errs, pg.evaluate("JSON.stringify({lv:S.lvl,diff:S.diff,act:S.act,zone:S.zone,ally:ALLY.map(a=>a.kind),merc:!!S.merc})"))
        b.close()
    sys.exit()
from playwright.sync_api import sync_playwright
import json
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/home/box/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome')
    c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True)
    pg=c.new_page(); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: m.type=='error' and 'Failed to load resource' not in m.text and errs.append(m.text))
    pg.goto('http://localhost:8090/'); pg.evaluate("localStorage.clear()"); pg.reload()
    # 先用默认 1 技能点学骨仆，跑一段
    pg.evaluate("S.sk.rs=1;S.kp=0;calc()"); pg.evaluate("dbg.speed(6)"); pg.wait_for_timeout(8000)
    pg.evaluate("""dbg.lvl(14);Object.assign(S.sk,{rs:5,sm:3,cg:1,rm:2,te:1,ba:1,ce:1,ad:2,wk:1});S.kp=0;S.unl=8;calc();H.life=ST.life;H.mana=ST.mana;
      dbg.loot(25,12,400);for(const r of [2,0,3,2])dbg.rune(r);dbg.gem('rub',1);dbg.gem('top',0);
      S.bag.push(genItem(12,{base:BASEM.wand2,q:5}));S.bag.push(genItem(12,{base:BASEM.head1,q:5}));S.bag.push(genItem(12,{base:BASEM.hlm2,q:6}));
      const sw=genItem(12,{base:BASEM.swd2,q:1});sw.sock=2;S.bag.push(sw);
      for(const it of S.bag.slice())if(!it.k&&canEquip(it)){const k=slotOf(BASEM[it.b]);const kk=k==='ring'?(S.eq.ring1?'ring2':'ring1'):k;if(!S.eq[kk])equip(it.uid)}
      doSock(sw.uid,S.bag.find(x=>x.k==='rune'&&x.r===2).uid);doSock(sw.uid,S.bag.find(x=>x.k==='rune'&&x.r===0).uid);closeM();
      dbg.zone(6);""")
    pg.wait_for_timeout(6000)
    pg.evaluate("dbg.speed(1);S.auto=0;dbg.zone(8);S.wave=4;spawnT=0.1"); pg.wait_for_timeout(2600)
    pg.screenshot(path='p1_battle.png')
    pg.tap('#tabs button[data-t=skill]'); pg.wait_for_timeout(300); pg.screenshot(path='p1_skills.png')
    pg.evaluate("S.kp=2;render();skPop('rs')"); pg.wait_for_timeout(300); pg.screenshot(path='p1_skill_up.png'); pg.evaluate("closeM()")
    pg.tap('#tabs button[data-t=bag]'); pg.wait_for_timeout(300); pg.screenshot(path='p1_bag.png')
    pg.evaluate("showItem((S.bag.find(x=>x.rw!=null)||S.eq.weapon).uid)"); pg.wait_for_timeout(300); pg.screenshot(path='p1_item_rw.png')
    pg.evaluate("const u=S.bag.find(x=>x.q===5)||Object.values(S.eq).find(x=>x.q===5);showItem(u.uid)"); pg.wait_for_timeout(300); pg.screenshot(path='p1_item_unique.png')
    pg.evaluate("closeM()"); pg.tap('#tabs button[data-t=map]'); pg.wait_for_timeout(300); pg.screenshot(path='p1_map.png')
    pg.tap('#tabs button[data-t=hero]'); pg.wait_for_timeout(300); pg.screenshot(path='p1_hero.png')
    print('errors',errs, pg.evaluate("JSON.stringify({lv:S.lvl,zone:S.zone,ally:ALLY.length,bag:S.bag.length,eq:Object.keys(S.eq),kills:S.kills})"))
    b.close()
