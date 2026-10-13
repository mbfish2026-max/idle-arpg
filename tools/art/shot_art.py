# 美术接入截图检查：python tools/art/shot_art.py <stage> → art_preview/*.png，打印 JS 错误
import sys
from playwright.sync_api import sync_playwright
st=sys.argv[1] if len(sys.argv)>1 else 'all';OUT='art_preview/'
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/home/box/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome')
    c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True);pg=c.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m: m.type=='error' and 'Failed to load resource' not in m.text and errs.append(m.text))
    pg.goto('http://localhost:8090/?art='+st);pg.wait_for_timeout(2500)
    pg.evaluate("CLOUD.mode='guest';clMetaSave();closeM();S.autoEq=0;dbg.lvl(70);document.querySelectorAll('.toast').forEach(e=>e.remove())")
    def shot(n,full=False):pg.wait_for_timeout(400);pg.screenshot(path=OUT+n+'.png',full_page=full);print('shot',OUT+n+'.png')
    if st in('items','all'):
        pg.evaluate("""S.bag.length=0;const cats=[...new Set(BASES.map(b=>b.cat))];
          for(const c of cats)for(const t of [0,1,2]){const bs=BASES.filter(b=>b.cat===c&&b.tier===t);if(bs.length)S.bag.push(genItem(80,{base:bs[0],q:[1,3,5][t]}))}
          window._x=S.bag.find(i=>BASEM[i.b].tier===2).uid;TAB='bag';STV='bag';render()""")
        shot('p_items_bag',True)
        pg.evaluate("showItem(_x)");shot('p_items_detail');pg.evaluate("closeM()")
    if st in('gems','all'):
        pg.evaluate("""S.bag.length=0;for(const g in GEMS)for(let l=0;l<5;l++)S.bag.push({uid:S.uid++,k:'gem',g,lv:l});
          for(let r=0;r<33;r++)S.bag.push({uid:S.uid++,k:'rune',r});addMat&&addMat('ess',12);TAB='bag';STV='bag';render()""")
        shot('p_gems_bag',True)
        pg.evaluate("showItem(S.bag[40].uid)");shot('p_gems_detail');pg.evaluate("closeM()")
    if st in('bg','all'):
        for a,z in [(0,0),(0,4),(0,10),(0,18),(1,3),(2,5),(3,1),(4,10)]:
            pg.evaluate(f"S.act={a};S.unl=99;TAB='fight';goZone({z});render()");shot(f'p_bg_a{a+1}_z{z}')
    if st in('ui','all'):
        pg.evaluate("TAB='fight';S.act=0;goZone(0);render()");shot('p_ui_fight')
        pg.evaluate("TAB='hero';render()");shot('p_ui_hero')
        pg.evaluate("TAB='bag';render()");shot('p_ui_bag')
        pg.evaluate("TAB='shop';render()");shot('p_ui_shop')
    print('errors',errs);b.close()
