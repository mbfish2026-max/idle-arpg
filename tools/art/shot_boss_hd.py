# 章末首领高清立绘战斗页截图：python tools/art/shot_boss_hd.py → art_preview/p_boss_hd_fight.png（需本地 8090 服务；--no-proxy-server、__NOGATE=1；截图前隐藏登录框/升级与首领降临横幅）
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(args=['--no-proxy-server'])
    c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True);pg=c.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.add_init_script("window.__NOGATE=1");pg.goto('http://localhost:8090/');pg.wait_for_timeout(3000)
    pg.evaluate("""try{CLOUD.mode='guest';clMetaSave()}catch(e){};try{closeM()}catch(e){};dbg.speed(0);dbg.lvl(40);S.act=3;S.unl=99;TAB='fight';
      const z=ACTS[3].zones.findIndex(z=>z.boss==='valax');if(z>=0)goZone(z);MON=[mkMon('valax',40,'boss')];spawnT=999;try{S.dead=0;S.deadT=0;S.hp=S.mhp||9e9}catch(e){};Object.assign(S,{});render();
      document.querySelectorAll('.toast').forEach(e=>e.remove())""")
    pg.wait_for_timeout(300)
    print(pg.evaluate("[...document.querySelectorAll('body > *')].filter(e=>getComputedStyle(e).position=='fixed'&&e.offsetHeight>300).map(e=>e.id+'.'+e.className)"))
    pg.evaluate("[...document.querySelectorAll('body > *')].filter(e=>getComputedStyle(e).position=='fixed'&&e.offsetHeight>300&&/账号/.test(e.textContent)).forEach(e=>e.remove());document.querySelectorAll('.toast').forEach(e=>e.remove())")
    print(pg.evaluate('''(()=>{const inp=[...document.querySelectorAll('input')].find(i=>/6/.test(i.placeholder||''));let e=inp,ch=[];while(e&&e!==document.body){ch.push(e.tagName+'#'+e.id+'.'+e.className+' '+getComputedStyle(e).position);e=e.parentElement};return ch})()'''));print(pg.evaluate('''(()=>{const out=[];document.querySelectorAll('*').forEach(e=>{const cs=getComputedStyle(e);if((cs.position=='fixed'||cs.position=='absolute')&&e.offsetHeight>400&&/至少6位/.test(e.textContent)){out.push(e.tagName+'#'+e.id+'.'+e.className);e.style.display='none'}});document.getElementById('modal').style.display='none';document.querySelectorAll('body *').forEach(e=>{if(/属性点\+5|首\s*领\s*降\s*临/.test(e.textContent)&&e.offsetHeight<150&&e.offsetHeight>20)e.style.display='none'});document.querySelectorAll('.toast,[class*=toast]').forEach(e=>e.style.display='none');return out})()'''));pg.wait_for_timeout(4000);pg.screenshot(path='art_preview/p_boss_hd_fight.png');print('errs',errs)
    print(pg.evaluate("[...document.images].filter(i=>i.src.includes('boss/')).map(i=>i.src+' '+i.naturalWidth)"))
    b.close()
