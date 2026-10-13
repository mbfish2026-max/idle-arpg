# UI2 前后截图：python tools/art/shot_ui2.py <port> <tag>  → art_preview/p_ui2_<tag>_*.png
import sys
from playwright.sync_api import sync_playwright
port,tag=sys.argv[1],sys.argv[2];OUT='art_preview/p_ui2_'+tag+'_'
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/home/box/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome')
    c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True);pg=c.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append('PAGEERR '+str(e)));pg.on('console',lambda m: m.type=='error' and errs.append(m.text))
    import subprocess
    if tag!='before' and subprocess.run(['node','--check','icon2.js'],capture_output=True).returncode:  # 同事改坏 icon2.js 时用 HEAD 版本验证
        H=subprocess.run(['git','show','HEAD:icon2.js'],capture_output=True,text=True).stdout;print('NOTE icon2.js 工作区语法错误，截图用 HEAD 版')
        pg.route('**/icon2.js',lambda r:r.fulfill(body=H,content_type='application/javascript'))
    pg.goto(f'http://localhost:{port}/');pg.wait_for_timeout(2500)
    pg.evaluate("CL_GATE=0;try{CLOUD.mode='guest';clMetaSave()}catch(e){};closeM();S.autoEq=0;dbg.lvl(40);S.pot.hp=12;S.pot.mp=9;S.pot.rej=3;S.pot.tp=2")
    def shot(n):pg.wait_for_timeout(600);pg.screenshot(path=OUT+n+'.png');print('shot',OUT+n+'.png')
    pg.evaluate("S.act=0;S.unl=99;TAB='fight';goZone(3);render()");pg.wait_for_timeout(2500)
    pg.evaluate("try{MON.length=0;const z=zoneData();MON.push(mkMon(z.mons[0],z.ml));MON.push(mkMon(z.mons[0],z.ml,'champ'));MON.push(mkMon(z.mons[0],z.ml,'uniq'));const bm=mkMon(z.mons[0],z.ml);bm.fl='boss';bm.boss=1;MON.push(bm);P.hp=P.max*0.6;P.mp=(P.mmax||P.maxmp||100)*0.35}catch(e){console.log(e)};render()")
    shot("fight");pg.evaluate("document.querySelector('#orbL').style.setProperty('--p',.4);document.querySelector('#orbR').style.setProperty('--p',.75)");pg.screenshot(path=OUT+"orbs.png",clip={"x":0,"y":440,"width":390,"height":120})
    pg.evaluate("""S.bag.length=0;const cats=[...new Set(BASES.map(b=>b.cat))].slice(0,12);for(const c of cats){const bs=BASES.filter(b=>b.cat===c);S.bag.push(genItem(40,{base:bs[0],q:[1,3,5,4][S.bag.length%4]}))}
      for(let i=0;i<3;i++)S.bag.push({uid:S.uid++,k:'gem',g:'rub',lv:0});for(let i=0;i<3;i++)S.bag.push({uid:S.uid++,k:'rune',r:2});window._x=S.bag[2].uid;TAB='bag';STV='bag';render()""")
    shot('bag')
    pg.evaluate("TAB='shop';SHT='buy';render()");shot('shop')
    pg.evaluate("TAB='bag';render();cubeUI()");shot('cube');pg.evaluate("closeM()")
    pg.evaluate("showItem(_x)");shot('detail');pg.evaluate("closeM()")
    if tag!='before':
        for t in ['hero','skill','map','merc','eg']:
            pg.evaluate(f"TAB='{t}';render()");shot('x_'+t)
    print('errors',errs);b.close()
