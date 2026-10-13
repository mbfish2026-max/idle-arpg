# 第三阶段截图（装备系统）：python shot_p3.py  → p3_*.png
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/home/box/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome')
    c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True)
    pg=c.new_page(); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: m.type=='error' and 'Failed to load resource' not in m.text and errs.append(m.text))
    pg.goto('http://localhost:8090/'); pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_timeout(800)
    pg.evaluate("""S.autoEq=0;dbg.lvl(70);SPEED=0;document.querySelectorAll('.toast').forEach(e=>e.remove());
      const mk=(U,q)=>{const it=genItem(85,{base:BASEM[U.b],q});return it};
      const u=UNIQUES.find(x=>BASEM[x.b].tier===2&&BASEM[x.b].s==='weapon')||UNIQUES[UNIQUES.length-1];let iu;do{iu=mk(u,5)}while(iu.name!==u.n);
      const si=SETITEMS.find(x=>x.set==='trang');let is;do{is=mk(si,6)}while(is.name!==si.n);
      const w=RUNEWORDS.find(w=>w.r.length>=3&&BASES.some(b=>w.cats.includes(b.cat)&&maxSock(b,99)>=w.r.length));
      const wb=BASES.filter(b=>w.cats.includes(b.cat)&&maxSock(b,99)>=w.r.length).pop();const ir=genItem(85,{base:wb,q:1});ir.sock=w.r.length;ir.soc=w.r.map(r=>({r}));ir.rw=RUNEWORDS.indexOf(w);
      S.bag.push(iu,is,ir);for(let i=0;i<14;i++)S.bag.push(genItem(20+i*5,{mf:400}));S.bag.push({uid:S.uid++,k:'rune',r:12},{uid:S.uid++,k:'rune',r:24});
      for(let i=0;i<10;i++)S.stash.push(genItem(60,{q:i%3?4:5}));
      window._ids=[iu.uid,is.uid,ir.uid];TAB='bag';BAGV='bag';render()""")
    pg.wait_for_timeout(3500); pg.screenshot(path='p3_bag.png')
    for n,i in (('unique',0),('set',1),('runeword',2)):
        pg.evaluate(f"showItem(_ids[{i}])"); pg.wait_for_timeout(300); pg.screenshot(path=f'p3_{n}.png')
        pg.evaluate("closeM();render()")
    pg.evaluate("BAGV='stash';TAB='bag';render()"); pg.wait_for_timeout(300); pg.screenshot(path='p3_stash.png')
    pg.evaluate("TAB='bag';BAGV='bag';render();cubeUI()"); pg.wait_for_timeout(300); pg.screenshot(path='p3_cube.png')
    print('errors',errs); b.close()
