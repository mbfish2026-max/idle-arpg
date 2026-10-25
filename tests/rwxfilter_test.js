// 符文之语「可合成·有底材」筛选测试：node tests/rwxfilter_test.js
// 不勾选全部显示 / 勾选只留符文够且有底材 / 符文不足、无底材、孔数不符、已镶嵌、锁定被过滤 / 空列表提示 / 状态记忆（S.rwf.ok 随存档）
const fs=require('fs'),vm=require('vm'),path=require('path');const root=path.join(__dirname,'..');
const stub=()=>new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?()=>'' :k==='readyState'?'loading':stub(),apply:()=>stub(),construct:()=>stub(),set:()=>true});
const store={};const ctx={console:{log(){},warn(){},error:console.error},Math,Date,JSON,setTimeout:()=>0,setInterval:()=>0,clearInterval(){},clearTimeout(){},requestAnimationFrame:()=>0,
 localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v},removeItem:k=>{delete store[k]}},document:stub(),Image:function(){return stub()},navigator:{},location:{search:''},addEventListener(){},performance:{now:()=>Date.now()},confirm:()=>true};
ctx.window=ctx;vm.createContext(ctx);ctx.__NOUI=1;ctx.__NOSHOWLOGIN=1;
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');const files=[...html.matchAll(/<script src="([^"?]+)/g)].map(m=>m[1]).filter(f=>!/^(cloud|login_flow|audio|power|ui_art|icon2|art2_)/.test(f));
for(const f of files)try{vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f})}catch(e){if(f==='rwxfilter.js')throw e}
const G=s=>vm.runInContext(s,ctx);let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('  ✗ '+m)}};
G(`S=newSave();try{load()}catch(e){};S.lvl=60;calc();S.bag=[];S.pst=[];if(typeof ACCT!=='undefined'&&ACCT)ACCT.shared=[];for(const k of SLOTS)S.eq[k]=null;`);
G(`var WI=RUNEWORDS.findIndex(w=>w.r.length===2&&w.r[0]!==w.r[1]);var TW=RUNEWORDS[WI];var TB=BASES.find(b=>!b.jew&&b.sock&&rwCatOk(TW,b.cat)&&!b.ccls);
var mkB=(n,q)=>{const it=makeBase(BASEM[TB.id],60);it.q=q||1;it.sock=n;it.soc=[];it.uid=S.uid++;delete it.rw;S.bag.push(it);return it};
var mkR=r=>{const x={uid:S.uid++,k:'rune',r};S.bag.push(x);return x};var names=()=>rwxList().L.map(x=>x.i);`);
ok(G("WI")>=0&&G("!!TB"),'找到测试用 2 孔符文之语与底材');
G("rwxF().g='all';rwxF().n=0;rwxF().c='all';rwxF().ok=0");
ok(G("names().length")===G("RUNEWORDS.length"),'不勾选：显示全部');
ok(/可合成·有底材/.test(G("rwxPanel()"))&&!/ checked /.test(G("rwxPanel()")),'选项行有未勾选复选框');
G("rwfToggle(1)");ok(G("names().length")===0,'勾选且无符文无底材：列表为空');
ok(/暂无可合成的符文之语/.test(G("rwxPanel()"))&&/ checked /.test(G("rwxPanel()")),'空列表提示「暂无可合成的符文之语」');
G("var tR1=mkR(TW.r[0]);var tR2=mkR(TW.r[1])");ok(!G("names().includes(WI)"),'符文够但无底材：被过滤');
G("var tB3=mkB(3)");ok(!G("names().includes(WI)"),'孔数不符（3 孔≠2）不算底材');
G("var tBs=mkB(2);tBs.soc=[{r:0}]");ok(!G("names().includes(WI)"),'已镶嵌的底材不算');
G("var tBm=mkB(2,4)");ok(!G("names().includes(WI)"),'稀有品质（非白/精良）不算底材');
G("var tBl=mkB(2);tBl.lk=1");ok(!G("names().includes(WI)"),'锁定底材不算');
G("tBl.lk=0");ok(G("names().includes(WI)"),'符文够且有合适底材：显示');
ok(G("names().every(i=>rwfCan(i))")&&G("names().every(i=>rwcCands(i).length&&!rwcMissing(RUNEWORDS[i]).length)"),'勾选结果与「找底材合成」判断一致');
G("tR2.lk=1");ok(!G("names().includes(WI)"),'锁定符文不计入：被过滤');G("tR2.lk=0");
G("S.bag.splice(S.bag.indexOf(tR2),1)");ok(!G("names().includes(WI)"),'符文不足：被过滤');G("S.bag.push(tR2)");
ok(G("rwcCraft(WI,tBl.uid,1)")===true&&!G("names().includes(WI)"),'实际合成成功后不再列出（符文已消耗）');
// 记忆：S.rwf.ok 随存档
G("rwfToggle(1);save()");G("S=newSave();load()");ok(G("rwxF().ok")===1,'勾选状态随存档保存，读档后仍勾选');
G("rwfToggle(0);save();S=newSave();load()");ok(!G("rwxF().ok"),'取消勾选也被记住');
G("delete S.rwf.ok");ok(G("names().length")===G("RUNEWORDS.length"),'旧存档无该字段：等同不勾选');
console.log(`rwxfilter_test: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);
