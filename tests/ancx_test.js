// 上古/至臻额外词缀测试：node tests/ancx_test.js
// 校验 ancient.js ancExtra：上古+1/至臻+2、部位合法、不重复、无技能等级、上古区间上移、至臻满值、品质含额外条、旧上古不补发
const fs=require('fs'),vm=require('vm'),path=require('path');const root=path.join(__dirname,'..');
const stub=()=>new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?()=>'' :k==='readyState'?'loading':stub(),apply:()=>stub(),construct:()=>stub(),set:()=>true});
const store={};const ctx={console:{log(){},warn(){},error:console.error},Math,Date,JSON,setTimeout:()=>0,setInterval:()=>0,clearInterval(){},clearTimeout(){},requestAnimationFrame:()=>0,
 localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v},removeItem:k=>{delete store[k]}},document:stub(),Image:function(){return stub()},navigator:{},location:{search:''},addEventListener(){},performance:{now:()=>Date.now()},confirm:()=>true};
ctx.window=ctx;vm.createContext(ctx);ctx.__NOUI=1;ctx.__NOSHOWLOGIN=1;
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');const files=[...html.matchAll(/<script src="([^"?]+)/g)].map(m=>m[1]).filter(f=>!/^(cloud|login_flow|audio|power|ui_art|icon2|art2_)/.test(f));
for(const f of files)try{vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f})}catch(e){if(f==='ancient.js')throw e}
const G=s=>vm.runInContext(s,ctx);let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('  ✗ '+m)}};
G(`S=newSave();try{load()}catch(e){};S.lvl=85;S.diff=2;calc();EGM=null;`);
const R0=JSON.parse(G(`(()=>{const out=[];const P=UNIQUES.concat(SETITEMS).filter(u=>BASEM[u.b]);for(let i=0;i<600;i++){const u=P[i%P.length];const it=makeBase(BASEM[u.b],85);it.q=SETITEMS.includes(u)?6:5;it.name=u.n;it.m=rollMods(u.m);const k0=Object.keys(it.m);const lv=i%3===0?2:1;ancApply(it,lv);const L=new Set();for(const a of PREFIX.concat(SUFFIX))if(affOk(a,BASEM[u.b]))for(const k in a.m)L.add(k);out.push({lv,k0,ax:it.ax||{},m:it.m,q:ancQual(it),L:[...L]})}return JSON.stringify(out)})()`));
const cnt=R0.map(x=>Object.keys(x.ax).length);
ok(R0.filter(x=>x.lv===1).every(x=>Object.keys(x.ax).length>=1),'上古至少 +1 条 (多键词缀可能占 2 键)');
ok(R0.filter(x=>x.lv===2).every(x=>Object.keys(x.ax).length>=2),'至臻至少 +2 条');
ok(R0.every(x=>Object.keys(x.ax).every(k=>!x.k0.includes(k))),'不与已有属性重复');
ok(R0.every(x=>Object.keys(x.ax).every(k=>!/^(allsk|sk_|skd_|tc_|t\d?sk|nb_|sockp)/.test(k))),'无技能等级/凹槽');
ok(R0.filter(x=>x.lv===2).every(x=>Object.entries(x.ax).every(([k,r])=>x.m[k]===r[1])),'至臻额外条满值');
ok(R0.filter(x=>x.lv===1).every(x=>Object.entries(x.ax).every(([k,r])=>x.m[k]>=r[0]&&x.m[k]<=r[1])),'上古额外条在上移区间内');
ok(R0.filter(x=>x.lv===2).every(x=>x.q===1),'至臻品质仍 100%');
ok(R0.every(x=>Object.keys(x.ax).every(k=>x.L.includes(k))),'额外词缀属于该底材合法词缀池');
// 旧上古不补发
ok(G(`(()=>{const it={b:UNIQUES[0].b,q:5,name:UNIQUES[0].n,m:{a:1},anc:1};ancApply(it,1);return !it.ax&&Object.keys(it.m).length===1})()`),'旧上古不补发');
ok(G(`(()=>{const it={b:UNIQUES[0].b,q:5,name:UNIQUES[0].n,m:{},anc:1};return ancQual(it)!==undefined})()`),'旧上古品质计算不报错');
console.log(`ancx_test: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);
