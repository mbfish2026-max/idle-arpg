# 第四阶段截图 + 云存档实测：python shot_p4.py → eq4_*.png
import time,json
from playwright.sync_api import sync_playwright
EM=f"anye.test+{int(time.time())}@gmail.com";PW="Test123456!"
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/home/box/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome')
    def ctx():
        c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True);pg=c.new_page();errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m: m.type=='error' and 'Failed to load resource' not in m.text and errs.append(m.text))
        return c,pg,errs
    c,pg,errs=ctx()
    pg.goto('http://localhost:8090/');pg.wait_for_timeout(2500);pg.screenshot(path='eq4_login.png')
    pg.evaluate("loginUI('up')");pg.wait_for_timeout(200);pg.screenshot(path='eq4_register.png')
    pg.evaluate("CLOUD.mode='guest';clMetaSave();closeM();S.autoEq=0;dbg.lvl(70);SPEED=0;document.querySelectorAll('.toast').forEach(e=>e.remove())")
    pg.evaluate("""newChar('骨语者','nec','normal');switchChar(1);
      for(let i=0;i<60;i++)S.bag.push(genItem(40+i%40,{mf:500}));for(let i=0;i<9;i++)S.bag.push({uid:S.uid++,k:'rune',r:i%3+5});for(let i=0;i<6;i++)S.bag.push({uid:S.uid++,k:'gem',g:'rub',lv:3});
      addMat('ess',37);for(let i=0;i<40;i++){const it=genItem(70,{q:3+i%4});pushInto(S.pst[pickPage('p',it)],it)};for(let i=0;i<20;i++){const it=genItem(80,{q:4+i%3});pushInto(ACCT.shared[pickPage('s',it)],it)};for(let i=0;i<12;i++)ACCT.shared[0].push({uid:S.uid++,k:'rune',r:20});
      const C=UNIQUES.find(u=>BASEM[u.b].s==='charm');let ch;let k=0;do{ch=genItem(80,{base:BASEM[C.b],q:5})}while(ch.name!==C.n&&++k<3000);S.bag.unshift(ch);window._ch=ch.uid;
      const nu=UNIQUES[UNIQUES.length-5];let u;k=0;do{u=genItem(90,{base:BASEM[nu.b],q:5})}while(u.name!==nu.n&&++k<3000);S.bag.push(u);window._u=u.uid;
      const ss=SETITEMS[SETITEMS.length-3];let s;k=0;do{s=genItem(90,{base:BASEM[ss.b],q:6})}while(s.name!==ss.n&&++k<3000);S.bag.push(s);window._s=s.uid;
      const w=RUNEWORDS[RUNEWORDS.length-4],wb=BASES.filter(b=>w.cats.includes(b.cat)&&maxSock(b,99)>=w.r.length).pop();const ir=genItem(85,{base:wb,q:1});ir.sock=w.r.length;ir.soc=w.r.map(r=>({r}));ir.rw=RUNEWORDS.indexOf(w);S.bag.push(ir);window._w=ir.uid;
      console.log('mk',ch.name,u.name,s.name);save();TAB='hero';render();charUI()""")
    pg.wait_for_timeout(300);pg.screenshot(path='eq4_chars.png')
    pg.evaluate("newCharUI()");pg.wait_for_timeout(200);pg.screenshot(path='eq4_newchar.png')
    pg.evaluate("closeM();TAB='bag';STV='bag';render()");pg.wait_for_timeout(300);pg.screenshot(path='eq4_bag.png',full_page=True)
    pg.evaluate("STV='pst';STMOVE=1;render()");pg.wait_for_timeout(300);pg.screenshot(path='eq4_stash_personal.png',full_page=True)
    pg.evaluate("STV='shared';render()");pg.wait_for_timeout(300);pg.screenshot(path='eq4_stash_shared.png',full_page=True)
    for n,v in (('charm','_ch'),('unique','_u'),('set','_s'),('runeword','_w')):
        pg.evaluate(f"STV='bag';showItem({v})");pg.wait_for_timeout(250);pg.screenshot(path=f'eq4_{n}.png');pg.evaluate("closeM()")
    pg.evaluate("rcyUI()");pg.wait_for_timeout(250);pg.screenshot(path='eq4_recycle.png',full_page=True);pg.evaluate("closeM()")
    pg.evaluate("TAB='shop';render()");pg.wait_for_timeout(300);pg.screenshot(path='eq4_shop.png',full_page=True)
    # 云：注册（游客存档→上传到账号）
    r=pg.evaluate(f"""(async()=>{{try{{await clSignUp('{EM}','{PW}','测试昵称');await new Promise(r=>setTimeout(r,800));
       if(CL_PENDING===null&&/上传本地存档/.test(document.querySelector('#modal').textContent))await uploadGuest();
       else await upload();await new Promise(r=>setTimeout(r,500));return {{ok:1,uid:CU.id,ns:ACCT_NS,chars:ACCT.chars.length,data:JSON.stringify(exportAccount().acct.chars.map(c=>c.name))}}}}catch(e){{return {{err:String(e.message||e)}}}}}})()""")
    print('signup',r)
    pg.evaluate("closeM();TAB='hero';render()");pg.wait_for_timeout(500);pg.screenshot(path='eq4_account.png',full_page=True)
    sig=pg.evaluate("(async()=>{await upload();return JSON.stringify(exportAccount().chars)})()")
    print('errors1',errs)
    c2,pg2,errs2=ctx();pg2.goto('http://localhost:8090/');pg2.wait_for_timeout(2500)
    r2=pg2.evaluate(f"""(async()=>{{await clSignIn('{EM}','{PW}');await new Promise(r=>setTimeout(r,1500));return {{ns:ACCT_NS,chars:ACCT.chars.map(c=>c.name)}}}})()""")
    sig2=pg2.evaluate("(async()=>{const r=await fetchRemote(true);return JSON.stringify(r.data.chars)})()")
    A,B=json.loads(sig),json.loads(sig2)
    diff=[(cid,k) for cid in A for k in set(A[cid])|set(B.get(cid,{})) if A[cid].get(k)!=B.get(cid,{}).get(k)]
    print('login2',r2,'云端读回与写入一致' if not diff else diff)
    for cid,k in diff[:6]: print(' ',cid,k,str(A[cid].get(k))[:150],'|',str(B[cid].get(k))[:150])
    pg2.evaluate("(async()=>{await clSignOut()})()");pg2.wait_for_timeout(800)
    print('guest after logout',pg2.evaluate("[ACCT_NS,ACCT.chars.length,S.lvl]"))
    print('cleanup',pg.evaluate("(async()=>{const a=await SB.from('saves').delete().eq('user_id',CU.id);const b=await SB.from('profiles').delete().eq('id',CU.id);return [a.error&&a.error.message,b.error&&b.error.message,a.status,b.status]})()"))
    print('errors2',errs2);b.close()
