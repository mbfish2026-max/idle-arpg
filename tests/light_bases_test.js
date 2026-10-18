// 轻型/施法底材测试：node tests/light_bases_test.js —— 底材注册、掉落等级门槛、头环词缀/孔数、符文之语/回收/仓库分类
const fs=require('fs'),vm=require('vm'),path=require('path');const root=path.join(__dirname,'..');
const stub=()=>new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?()=>'' :k==='readyState'?'loading':stub(),apply:()=>stub(),construct:()=>stub(),set:()=>true});
const store={};let _sd=Number(process.env.SEED||11)>>>0;const SMath=Object.create(Math);SMath.random=()=>{_sd=(_sd+0x6D2B79F5)>>>0;let t=_sd;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296};
const ctx={console:{log(){},warn(){},error:console.error},Math:SMath,Date,JSON,setTimeout:()=>0,setInterval:()=>0,clearInterval(){},clearTimeout(){},requestAnimationFrame:()=>0,
 localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v},removeItem:k=>{delete store[k]}},document:stub(),Image:function(){return stub()},navigator:{},location:{search:''},addEventListener(){},MutationObserver:function(){return{observe(){},disconnect(){}}},performance:{now:()=>Date.now()},confirm:()=>true};
ctx.window=ctx;vm.createContext(ctx);ctx.__NOUI=1;ctx.__NOSHOWLOGIN=1;
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');const files=[...html.matchAll(/<script src="([^"?]+)/g)].map(m=>m[1]).filter(f=>!/^(cloud|login_flow|audio|power|ui_art)/.test(f));
let loadErr=0;for(const f of files)try{vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f})}catch(e){loadErr++;console.error('load',f,e.message)}
const G=s=>vm.runInContext(s,ctx);G('S=newSave();if(!S.stash)S.stash=[];calc()');
let fails=0,passes=0;const ok=(c,m)=>{if(c)passes++;else{fails++;console.log('  ✗ '+m)}};
const L=G('LIGHT_BASES'),BM=G('BASEM');
ok(files.includes('light_bases.js'),'index.html 未引用 light_bases.js');
ok(L.length===16,'应有 16 个轻型底材');
for(const b of L){ok(BM[b.id]===b,'未注册 '+b.id);ok(G('BASES').filter(x=>x.id===b.id).length===1,'重复 '+b.id);ok(b.str<=40,b.id+' 力量需求过高');ok(b.def[1]>0,b.id+' 无防御')}
// 掉落门槛：ilvl < q-3 绝不出；ilvl ≥ q 能出
const drops=(ilvl,n,slot)=>{const c={};for(let i=0;i<n;i++){const b=G('pickBase')(ilvl,slot);c[b.id]=(c[b.id]||0)+1}return c};
for(const b of L){const lo=Math.max(1,b.q-4);if(b.q>4){const c=drops(lo,3000,b.s);ok(!c[b.id],`${b.id}(q${b.q}) 在 ilvl${lo} 掉落了`)}
 const c=drops(b.q,6000,b.s);ok(c[b.id]>0,`${b.id}(q${b.q}) 在 ilvl${b.q} 未掉落`)}
// 头环：孔数上限、施法词缀
const ms=G('maxSock');for(const[id,lv,mx]of[['ltc1',20,1],['ltc1',30,2],['ltc3',60,3],['ltc4',85,3]]){let m=0;for(let i=0;i<400;i++){const it=G('genItem')(lv,{base:BM[id]});m=Math.max(m,it.sock||0)}ok(m<=mx&&m>=1,`${id}@${lv} 最大孔 ${m} 期望≤${mx}`)}
const hasCirc=a=>a.it.includes('circ');ok(G('PREFIX').filter(a=>a.g==='skill'&&hasCirc(a)).length>=20,'头环职业技能前缀不足');ok(G('SUFFIX').filter(a=>a.g==='fcr'&&hasCirc(a)).length>=1||G('PREFIX').filter(a=>a.g==='fcr'&&hasCirc(a)).length>=1,'头环无 FCR 词缀');
let sk=0,fc=0;for(let i=0;i<3000;i++){const it=G('genItem')(70,{base:BM.ltc4});const m=it.m||it.mods||{};if(Object.keys(m).some(k=>/^(t\dsk|tc_|allsk)/.test(k)))sk++;if(m.fcr)fc++}
ok(sk>0,'头环未出技能词缀');ok(fc>0,'头环未出 FCR');
ok(G('rwCatOk')({cats:['helm']},'circ'),'头环不能做头盔符文之语');ok(G('SKCAT').circ==='helm'&&G('CATN').circ,'SKCAT/CATN 缺 circ');
ok(G('RWX_GRP').helm[1]('circ'),'符文之语图鉴头盔组未含头环');
ok(G("stType({b:'ltc2'})")==='helm'&&G("stType({b:'ltr2'})")==='armor','仓库类型筛选');
ok(G("rcyCat(genItem(60,{base:BASEM.ltc4}))")==='helm','回收分类');
ok(!loadErr,'脚本加载报错');
console.log(`light_bases_test: ${passes} 通过, ${fails} 失败  (技能词缀 ${sk}/3000, FCR ${fc}/3000)`);process.exit(fails?1:0);
