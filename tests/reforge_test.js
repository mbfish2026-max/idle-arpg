// 淬锋精铸单元测试：node tests/reforge_test.js
// 校验 reforge.js：适用范围、首次锁定、3 候选+原属性四选一、花费递增与扣除、上限 3 次、合法池/不重复、上古区间上移/至臻满值、候选持久、旧存档
const fs=require('fs'),vm=require('vm'),path=require('path');const root=path.join(__dirname,'..');
const stub=()=>new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?()=>'' :k==='readyState'?'loading':stub(),apply:()=>stub(),construct:()=>stub(),set:()=>true});
const store={};const ctx={console:{log(){},warn(){},error:console.error},Math,Date,JSON,setTimeout:()=>0,setInterval:()=>0,clearInterval(){},clearTimeout(){},requestAnimationFrame:()=>0,
 localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v},removeItem:k=>{delete store[k]}},document:stub(),Image:function(){return stub()},navigator:{},location:{search:''},addEventListener(){},performance:{now:()=>Date.now()},confirm:()=>true};
ctx.window=ctx;vm.createContext(ctx);ctx.__NOUI=1;ctx.__NOSHOWLOGIN=1;
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');const files=[...html.matchAll(/<script src="([^"?]+)/g)].map(m=>m[1]).filter(f=>!/^(cloud|login_flow|audio|power|ui_art|icon2|art2_)/.test(f));
for(const f of files)try{vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f})}catch(e){if(f==='reforge.js')throw e}
const G=s=>vm.runInContext(s,ctx);let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('  ✗ '+m)}};
G(`S=newSave();try{load()}catch(e){};S.lvl=85;S.diff=2;calc();EGM=null;S.gold=1e7;addMat('ess',500);`);
G(`var rare=null;for(let i=0;i<50&&!rare;i++){const x=genItem(85,{q:4});if(x.q===4&&Object.keys(x.m).length>=3)rare=x}rare.uid=S.uid++;S.bag.push(rare);`);
ok(G("rfKind(rare)")==='rare'&&G("rfKind({q:5,m:{}})")===null&&G("rfKind({q:2,m:{}})")===null,'魔法/稀有可用，暗金/白装不可');
ok(G("rfKind(genItem(85,{q:3}))")==='rare'||G("genItem(85,{q:3}).q")!==3,'魔法可用');
const k0=G("rfLines(rare)[0]");const g0=G("S.gold"),e0=G("matCount('ess')");
ok(G(`rfRoll(rare.uid,'${k0}')`)===true,'首次淬锋');ok(G("S.gold")===g0-5000&&G("matCount('ess')")===e0-10,'第 1 次 5000 金 + 10 精华');
const off=JSON.parse(G("JSON.stringify(rare.rf.off)"));ok(off.length===3&&new Set(off.map(o=>o[0])).size===3,'3 个候选（连同原属性四选一）');
ok(off.every(o=>o[0]!==k0&&!G(`Object.keys(rare.m)`).includes(o[0])),'候选不与已有属性重复');
ok(off.every(o=>o[1]>=o[2]&&o[1]<=o[3]),'候选值在区间内');
ok(G(`rfRoll(rare.uid,'${k0}')`)===undefined||G("rare.rf.n")===1,'待选时不能再扣费');
G(`rfPick(rare.uid,0)`);const nk=off[0][0];ok(G(`rare.m['${nk}']`)===off[0][1]&&G(`!('${k0}' in rare.m)`)&&G("rare.rf.k")===nk,'选候选替换并锁定新键');
const other=G(`rfLines(rare).find(k=>k!==rare.rf.k)`);ok(G(`(()=>{const n=rare.rf.n;rfRoll(rare.uid,'${other}');return rare.rf.n===n&&!rare.rf.off})()`),'其他词缀被锁不能重铸');
const g1=G("S.gold");G(`rfRoll(rare.uid,rare.rf.k)`);ok(g1-G("S.gold")===20000&&G("rare.rf.n")===2,'第 2 次 20000 金（递增）');
const keep=G("JSON.stringify(rare.m)");G(`rfPick(rare.uid,-1)`);ok(G("JSON.stringify(rare.m)")===keep,'保留原属性不变');
G(`rfRoll(rare.uid,rare.rf.k);rfPick(rare.uid,-1)`);ok(G("rare.rf.n")===3&&G(`rfRoll(rare.uid,rare.rf.k)`)===undefined&&G("rare.rf.n")===3,'上限 3 次');
// 钱不够
G(`var r2=null;for(let i=0;i<50&&!r2;i++){const x=genItem(85,{q:4});if(x.q===4)r2=x}r2.uid=S.uid++;S.bag.push(r2);S.gold=100`);ok(G(`(()=>{rfRoll(r2.uid,rfLines(r2)[0]);return !r2.rf.off&&r2.rf.n===0})()`),'金币不足不扣');G(`S.gold=1e7`);
// 上古/至臻
const anc=JSON.parse(G(`(()=>{const res=[];for(const lv of[1,2]){const P=UNIQUES.filter(u=>BASEM[u.b]);const u=P[3];const it=makeBase(BASEM[u.b],85);it.q=5;it.name=u.n;it.m=rollMods(u.m);ancApply(it,lv);it.uid=S.uid++;S.bag.push(it);
 const k=rfLines(it)[0];const ok1=Object.keys(it.ax).includes(k)&&rfLines(it).every(x=>x in it.ax);rfRoll(it.uid,k);const o=it.rf.off;rfPick(it.uid,0);res.push({lv,ok1,o,ax:it.ax,m:it.m})}return JSON.stringify(res)})()`));
ok(anc.every(a=>a.ok1),'上古只能重铸额外词缀');
ok(anc[1].o.every(o=>o[1]===o[3]),'至臻候选取满');ok(anc.every(a=>a.o.every(o=>!/^(allsk|sk_|skd_|tc_|t\d?sk|nb_)/.test(o[0]))),'上古候选无技能等级');
ok(anc.every(a=>a.ax[a.o[0][0]]&&a.m[a.o[0][0]]===a.o[0][1]),'替换后 it.ax 同步');
ok(G(`(()=>{const it=S.bag[S.bag.length-1];return ancQual(it)===1})()`),'至臻重铸后仍完美');
ok(G("rfKind({q:5,anc:1,m:{a:1},name:'x'})")===null,'旧上古（无额外词缀）不可重铸');
ok(G("cubeRecipes().some(r=>/淬锋精铸/.test(r[0]))"),'炼金匣入口');
console.log(`reforge_test: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);
