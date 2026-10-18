// 符文之语扩充测试（职业底材映射 / 孔数可达 / 手套腰带靴子凹槽 / 新符文之语镶嵌）：node tests/rw_expand_test.js
const fs=require('fs'),vm=require('vm'),path=require('path');const root=path.join(__dirname,'..');
const stub=()=>new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?()=>'':k==='readyState'?'loading':stub(),apply:()=>stub(),construct:()=>stub(),set:()=>true});
const store={};const ctx={console,Math,Date,JSON,setTimeout:()=>0,setInterval:()=>0,clearInterval(){},clearTimeout(){},requestAnimationFrame:()=>0,
 localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v},removeItem:k=>{delete store[k]}},document:stub(),Image:function(){return stub()},navigator:{},location:{search:''},addEventListener(){},performance:{now:()=>Date.now()}};
ctx.window=ctx;vm.createContext(ctx);ctx.__NOUI=1;ctx.__NOSHOWLOGIN=1;
for(const f of ['data.js','data_items.js','data_items2.js','data_acts.js','game.js','items.js','acts.js','items2.js','stash.js','loot.js','shop.js','cloud.js','skills.js','rwx.js','rwx_craft.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});
const G=s=>vm.runInContext(s,ctx);let fails=0,n=0;const ok=(c,m)=>{n++;if(!c){fails++;console.log('  ✗ '+m)}};
G('ACCT={shared:[[],[]],chars:[]};S=newSave();S.pst=[[],[]];calc();render=function(){};showItem=function(){};log=function(){};toast=function(){}');
const R=G('RUNEWORDS'),B=G('BASEM');
// 每个符文之语的每个类别都有能打出足够孔数的底材；同类别下无相同配方遮挡
const ms={};for(const k in B){const b=B[k];ms[b.cat]=Math.max(ms[b.cat]||0,Array.isArray(b.sock)?Math.max(...b.sock):0)}
R.forEach((w,i)=>{for(const c of w.cats)ok(w.r.length<=ms[c],`孔数不可达 ${w.n} ${c}`);for(const k in w.m)ok(G('MODT')[k],`未知词缀 ${w.n} ${k}`);
 R.slice(0,i).forEach(v=>ok(!(v.r.join()===w.r.join()&&v.cats.some(x=>w.cats.includes(x))),`配方遮挡 ${w.n} ← ${v.n}`))});
for(const c of ['gloves','belt','boots']){ok(ms[c]===2,c+' 凹槽上限应为2');ok(G('SOCKET_RECIPES')[c],c+' 炼金匣打孔配方')}
for(const c of ['helm','shield','gloves','belt','boots','head','wand','staff'])ok(R.filter(w=>w.cats.includes(c)).length>=3,c+' 符文之语≥3');
// 映射：毛皮头饰=头盔、圣徽盾=盾、法球=魔杖/法杖、专属弓=弓
const map=(cat,par)=>G(`RUNEWORDS.filter(w=>w.cats.includes('${par}')).every(w=>rwCatOk(w,'${cat}'))`);
ok(map('pelt','helm')&&map('bhelm','helm')&&map('pshd','shield')&&map('abow','bow')&&map('orb','wand')&&map('orb','staff'),'职业底材映射');
// 实际镶嵌：伪造毛皮头饰底材 + 手套/腰带/靴子
const res=G(`(()=>{const out={};BASEM.tpelt={id:'tpelt',s:'helm',cat:'pelt',n:'测试毛皮',q:1,tier:0,str:0,def:[5,9],sock:[2,3,3]};
 const mk=(b,s)=>{const it=makeBase(b,40);it.q=1;it.sock=s;it.soc=[];it.uid=S.uid++;delete it.rw;S.bag.push(it);return it};
 const go=(b,name)=>{const w=RUNEWORDS.find(x=>x.n===name),it=mk(b,w.r.length);for(const r of w.r){const g={uid:S.uid++,k:'rune',r};S.bag.push(g);doSock(it.uid,g.uid)}return it.rw!=null&&RUNEWORDS[it.rw].n};
 out.pelt=go(BASEM.tpelt,'新芽');for(const [c,nm] of [['gloves','握力'],['belt','韧带'],['boots','旅者']])out[c]=go(BASES.find(b=>b.cat===c),nm);
 out.cands=(()=>{const wi=RUNEWORDS.findIndex(x=>x.n==='星识');mk(BASEM.tpelt,3);return rwcCands(wi).length})();return out})()`);
ok(res.pelt==='新芽','毛皮头饰合成头盔符文之语 '+res.pelt);ok(res.gloves==='握力'&&res.belt==='韧带'&&res.boots==='旅者','手套/腰带/靴子合成 '+JSON.stringify(res));ok(res.cands>=1,'找底材合成 识别毛皮头饰');
console.log(`符文之语扩充测试：${n-fails}/${n} 通过`);process.exit(fails?1:0);
