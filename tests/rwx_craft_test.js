// 符文之语「找底材合成」测试：node tests/rwx_craft_test.js
const fs=require('fs'),vm=require('vm'),path=require('path');const root=path.join(__dirname,'..');
const stub=()=>new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?()=>'':k==='readyState'?'loading':stub(),apply:()=>stub(),construct:()=>stub(),set:()=>true});
const store={};const ctx={console,Math,Date,JSON,setTimeout:()=>0,setInterval:()=>0,clearInterval(){},clearTimeout(){},requestAnimationFrame:()=>0,
 localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v},removeItem:k=>{delete store[k]}},document:stub(),Image:function(){return stub()},navigator:{},location:{search:''},addEventListener(){},performance:{now:()=>Date.now()}};
ctx.window=ctx;vm.createContext(ctx);ctx.__NOUI=1;ctx.__NOSHOWLOGIN=1;
for(const f of ['data.js','data_items.js','data_items2.js','data_acts.js','game.js','items.js','acts.js','items2.js','stash.js','loot.js','shop.js','cloud.js','skills.js','rwx.js','rwx_craft.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});
const G=s=>vm.runInContext(s,ctx);let fails=0;const ok=(c,m)=>{if(!c){fails++;console.log('  ✗ '+m)}};
G('ACCT={shared:[[],[]],chars:[]};S=newSave();S.pst=[[],[]];calc();render=function(){};showItem=function(){};log=function(){};toast=function(){}');
const r=G(`(()=>{const wi=RUNEWORDS.findIndex(w=>w.cats.includes('armor')&&w.r.length>=2),w=RUNEWORDS[wi],n=w.r.length,b=BASES.find(b=>!b.jew&&b.cat==='armor'&&b.sock&&b.sock[2]>=n);
 const mk=(q,s)=>{const it=makeBase(b,40);it.q=q;it.sock=s;it.soc=[];it.uid=S.uid++;delete it.rw;return it};
 const e=mk(1,n),sh=mk(2,n),mg=mk(3,n),wr=mk(1,n+1);S.eq.armor=e;ACCT.shared[0].push(sh);S.bag.push(mg,wr);S.bag=S.bag.filter(x=>x.k!=='rune');
 const c0=rwcCands(wi).map(x=>x.loc).sort().join();const miss=rwcMissing(w).length;const noRunes=rwcCraft(wi,sh.uid,1);
 w.r.forEach((r,i)=>(i?ACCT.shared[0]:S.pst[0]).push({uid:S.uid++,k:'rune',r}));const c1=rwcCraft(wi,sh.uid,1);
 w.r.forEach(r=>S.bag.push({uid:S.uid++,k:'rune',r}));const c2=rwcCraft(wi,e.uid,1);
 return{c0,miss,noRunes,c1,shRw:sh.rw===wi&&!!sh.rwm&&ACCT.shared[0].includes(sh),c2,eq:S.eq.armor===e&&e.rw===wi,left:Object.keys(rwxOwned()).length}})()`);
ok(r.c0==='eq,s','候选只含 身上/共享仓库 白色/精良且孔数恰好: '+r.c0);ok(r.miss>0&&r.noRunes===false,'缺符文不能合成');
ok(r.c1&&r.shRw,'共享仓库底材合成后留在共享仓库');ok(r.c2&&r.eq,'身上底材合成后仍装备');ok(r.left===0,'符文已全部消耗');
console.log(fails?`rwx_craft_test: ${fails} 失败`:'rwx_craft_test: 全部通过');process.exit(fails?1:0)
