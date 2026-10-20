// 法师主线怪物血量系数 CLS_HPK 单元测试：node tests/clshpk_test.js
// 校验：主线区域 sor ×1.4、其他职业 ×1；任何终局模式（EGM 非空：秘境/虚隙/魂狱/暗渊）与奶牛关不生效
const fs=require('fs'),vm=require('vm'),path=require('path');const root=path.join(__dirname,'..');
const stub=()=>new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?()=>'' :k==='readyState'?'loading':stub(),apply:()=>stub(),construct:()=>stub(),set:()=>true});
const store={};const ctx={console:{log(){},warn(){},error:console.error},Math,Date,JSON,setTimeout:()=>0,setInterval:()=>0,clearInterval(){},clearTimeout(){},requestAnimationFrame:()=>0,
 localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v},removeItem:k=>{delete store[k]}},document:stub(),Image:function(){return stub()},navigator:{},location:{search:''},addEventListener(){},performance:{now:()=>Date.now()},confirm:()=>true};
ctx.window=ctx;vm.createContext(ctx);ctx.__NOUI=1;ctx.__NOSHOWLOGIN=1;
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');const files=[...html.matchAll(/<script src="([^"?]+)/g)].map(m=>m[1]).filter(f=>!/^(cloud|login_flow|audio|power|ui_art|icon2|art2_)/.test(f));
for(const f of files)try{vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f})}catch(e){if(f==='data_acts.js'||f==='acts.js')throw e}
const G=s=>vm.runInContext(s,ctx);let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('  ✗ '+m)}};
const HP=(cls,eg,cow)=>G(`(()=>{S.cls=${JSON.stringify(cls)};EGM=${eg};S.zone=${cow?"'cow'":"S.zone"};const r=Math.random;let s=7;Math.random=()=>((s=s*16807%2147483647)/2147483647);const m=mkMon(Object.keys(MONS)[3],70);Math.random=r;const h=m.max;EGM=null;return h})()`);
G(`S=newSave();try{load()}catch(e){};S.diff=2;S.lvl=80;S.act=1;S.zone=1;calc();EGM=null;`);
const bar=HP('bar','null'),sor=HP('sor','null');
ok(Math.abs(sor/bar-1.4)<0.01,`主线 sor/bar=${(sor/bar).toFixed(3)} 应为 1.4`);
ok(G("S.cls='bar';clsHpK()")===1,'主线非法师职业系数 1');
for(const k of ['mj','rift','ubp','uber']){const b=HP('bar',`{k:'${k}',L:25,T:10}`),s=HP('sor',`{k:'${k}',L:25,T:10}`);ok(s===b,`终局 ${k}: sor ${s} 应等于 bar ${b}`)}
G(`S.cls='sor';EGM={k:'mj',L:25}`);ok(G("clsHpK()")===1,'秘境中 clsHpK()=1');G(`EGM=null`);ok(G("clsHpK()")===1.4,'离开终局恢复 1.4');
ok(HP('sor','null',1)===HP('bar','null',1),'奶牛关不生效');
console.log(`clshpk_test: ${pass} 通过, ${fail} 失败`);process.exit(fail?1:0);
