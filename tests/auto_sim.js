// 自动推进长时模拟：[CLS=职业] node tests/auto_sim.js [模拟小时数]  —— 检测“非等级门槛”的推进停滞
const fs=require('fs'),vm=require('vm'),path=require('path');const root=path.join(__dirname,'..');
const stub=()=>new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?()=>'' :k==='readyState'?'loading':stub(),apply:()=>stub(),construct:()=>stub(),set:()=>true});
const store={};let _sd=Number(process.env.SEED||7)>>>0;const SMath=Object.create(Math);SMath.random=()=>{_sd=(_sd+0x6D2B79F5)>>>0;let t=_sd;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296};
const ctx={console:{log(){},warn(){},error:console.error},Math:SMath,Date,JSON,setTimeout:()=>0,setInterval:()=>0,clearInterval(){},clearTimeout(){},requestAnimationFrame:()=>0,
 localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v},removeItem:k=>{delete store[k]}},document:stub(),Image:function(){return stub()},navigator:{},location:{search:''},addEventListener(){},performance:{now:()=>Date.now()}};
ctx.window=ctx;vm.createContext(ctx);ctx.__NOUI=1;ctx.__NOSHOWLOGIN=1;
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');const files=[...html.matchAll(/<script src="([^"?]+)/g)].map(m=>m[1]).filter(f=>!/^(cloud|login_flow|audio|power|ui_art|icon2|art2_)/.test(f));
for(const f of files)try{vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f})}catch(e){console.error('load',f,e.message)}
const G=s=>vm.runInContext(s,ctx);
G("S=newSave();if(typeof load==='function')try{load()}catch(e){};"+(process.env.CLS?`S.cls='${process.env.CLS}';S.ci=0;clsInit();`:'')+"if(typeof ensureLoot==='function')ensureLoot();calc();H.life=ST.life;H.mana=ST.mana;S.auto=1;S.autoEq=1;S.autoSk=1;S.autoAt=1;TAB='fight';MON=[];spawnT=0.1");
const hours=+process.argv[2]||6,dt=0.05;let last='',lastT=0,stalls=[],t=0;const prog=()=>G("JSON.stringify([S.diff,S.act,S.zone,S.wave,S.auto])");
for(;t<hours*3600;t+=dt){G(`step(${dt})`);if(Math.round(t/dt)%144000===0&&t>0){G("try{save();load();calc();MON=[];spawnT=0.5}catch(e){}")}
  if(Math.round(t/dt)%200===0){G("typeof autoTick==='function'&&autoTick()");
  const p=G("[S.diff,S.act,S.zone,S.auto].join()");if(p!==last||G("typeof autoHoldWhy==='function'?autoHoldWhy():''")){last=p;lastT=t}
  else if(t-lastT>1800){const why=G("typeof autoHoldWhy==='function'?autoHoldWhy():''");if(!/等级不足|最终/.test(why))stalls.push(`${(t/3600).toFixed(2)}h ${prog()} lv${G('S.lvl')} hold=${why} kills=${G('S.kills')}`);lastT=t}}}
console.log('end',prog(),'lv',G('S.lvl'),'kills',G('S.kills'));console.log('reloadAutoOn',G('S.auto'),'stalls',stalls.length);for(const s of stalls.slice(0,30))console.log(' ',s);
