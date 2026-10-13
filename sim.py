from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/home/box/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome')
    pg=b.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('http://localhost:8090/'); pg.evaluate("localStorage.clear()"); pg.reload()
    r=pg.evaluate("""(()=>{TAB='map';let deaths=0;const od=die;die=function(){deaths++;od()};const order=['rs','rs','rs','sm','te','ce','rs','sm','cg','ad','rm','bs','bs','bs','rs','sm','bs','bs'];let oi=0;const out=[];
     for(let t=0;t<3600*3;t+=0.05){step(0.05);if(S.kp>0){const id=order.find((x,i)=>i>=oi&&canLearn(x));if(id){learn(id);oi++}else{for(const x of ['bs','sm','rs','te'])if(canLearn(x)){learn(x);break}}}
      if(S.sp>0){S.at.vit+=S.sp;S.sp=0;calc()}

      if(Math.round(t)%600===0&&t%600<0.05)out.push(`${Math.round(t/60)}min lv${S.lvl} zone${S.zone} deaths${deaths} q${Object.keys(S.q)}`);if(S.q.q6)break}
     out.push(`END lv${S.lvl} zone${S.zone} deaths${deaths} q${Object.keys(S.q)} gold${S.gold} kills${S.kills}`);return out})()""")
    print('\n'.join(r),errs)
