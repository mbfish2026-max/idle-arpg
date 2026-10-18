// 佣兵后期强度模拟：node tests/merc_late_sim.js [每档模拟小时=1]  环境变量 CLS=职业 MERC=archer|guard|mage|barb SEED
// 每档：角色/佣兵同级，自动加点，背包里放若干件对应 ilvl 的稀有装（角色/佣兵各自自动换装），固定在对应难度区域刷怪。
// 输出：佣兵伤害占队伍比例、佣兵死亡次数/小时、角色死亡次数/小时、佣兵生命/防御/平均抗性/伤害
const fs=require('fs'),vm=require('vm'),path=require('path');const root=path.join(__dirname,'..');
const stub=()=>new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?()=>'' :k==='readyState'?'loading':stub(),apply:()=>stub(),construct:()=>stub(),set:()=>true});
const HOURS=+process.argv[2]||1,MT=process.env.MERC||'guard';
const LV=[[30,0,32],[50,1,52],[70,2,74],[85,2,85]];// [等级, 难度, 目标区域等级]
function run(L,diff,tml){const store={};let sd=(Number(process.env.SEED||7)+L)>>>0;const SM=Object.create(Math);SM.random=()=>{sd=(sd+0x6D2B79F5)>>>0;let t=sd;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296};
 const ctx={console:{log(){},warn(){},error:console.error},Math:SM,Date,JSON,setTimeout:()=>0,setInterval:()=>0,clearInterval(){},clearTimeout(){},requestAnimationFrame:()=>0,
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v},removeItem:k=>{delete store[k]}},document:stub(),Image:function(){return stub()},navigator:{},location:{search:''},addEventListener(){},performance:{now:()=>Date.now()}};
 ctx.window=ctx;vm.createContext(ctx);ctx.__NOUI=1;ctx.__NOSHOWLOGIN=1;
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');const files=[...html.matchAll(/<script src="([^"?]+)/g)].map(m=>m[1]).filter(f=>!/^(cloud|login_flow|audio|power|ui_art|icon2|art2_)/.test(f));
 for(const f of files)try{vm.runInContext(fs.readFileSync(f==='merc.js'&&process.env.MERCJS?process.env.MERCJS:path.join(root,f),'utf8'),ctx,{filename:f})}catch(e){console.error('load',f,e.message)}
 const G=s=>vm.runInContext(s,ctx);
 G(`S=newSave();try{load()}catch(e){};${process.env.CLS?`S.cls='${process.env.CLS}';S.ci=0;clsInit();`:''}if(typeof ensureLoot==='function')ensureLoot();
 S.lvl=${L};S.xp=xpNeed(${L});S.sp=5*(${L}-1)+15;S.kp=${L}-1+6;S.gold=1e9;S.auto=0;S.autoEq=1;S.autoSk=1;S.autoAt=1;S.mercU=1;S.diffU=2;S.actU=[4,4,4];
 calc();for(let i=0;i<3;i++)autoTick();
 // 选区域：目标难度中区域等级最接近 tml 的主线区域
 S.diff=${diff};applyDiff();let best=null;ACTS.forEach((A,a)=>A.zones.forEach((z,i)=>{if(z.side)return;const d=Math.abs(z.ml-${tml});if(!best||d<best.d)best={a,i,d,ml:z.ml,n:z.n}}));
 goAct(best.a,${diff},1);S.unl=99;S.zone=best.i;window.__Z=best;
 hireMerc('${MT}',null,1,{lvl:${L},hd:${diff}});S.merc.ar=1;S.merc.auto=1;
 // 装备：每部位 3 件 ilvl=等级-5 的魔法/稀有（各半）；佣兵另给 3 件可用类型武器（MERCJS=旧 merc.js 路径可跑改前对照）
 const SL=['weapon','shield','helm','armor','gloves','belt','boots','amulet','ring','ring'];
 for(const s of SL)for(let k=0;k<3;k++){const it=genItem(${L}-5,{slot:s,q:rnd()<0.5?3:4});S.bag.push(it)}
 const wc=MERCS['${MT}'].wcats;const wb=BASES.filter(b=>b.s==='weapon'&&wc.includes(b.cat)&&b.q<=${L});for(let k=0;k<3;k++)S.bag.push(genItem(${L}-5,{base:pick(wb),q:rnd()<0.5?3:4}));
 for(let i=0;i<3;i++){autoTick();mercAutoEq&&mercAutoEq()}
 S.bag=[];calc();H.life=ST.life;H.mana=ST.mana;MON=[];spawnT=0.5;
 window.SIMD={m:0,o:0,md:0,hd:0,bm:0,bo:0,tt:0,nk:0};
 {const f=hitMon;hitMon=function(m,d,src,c){const h0=m.hp;const r=f(m,d,src,c);const dd=Math.max(0,h0-Math.max(0,m.hp));if(m._t0==null)m._t0=GT;if(src&&src.kind==='merc'){SIMD.m+=dd;if(m.fl)SIMD.bm+=dd}else{SIMD.o+=dd;if(m.fl)SIMD.bo+=dd}if(h0>0&&m.hp<=0){SIMD.tt+=GT-m._t0;SIMD.nk++}return r}}
 {const f=killMon;killMon=function(m){if(m.hp>0){}return f(m)}}
 {const f=die;die=function(){SIMD.hd++;f();S.zone=__Z.i}}
 {let was=0;const f=mercTick;mercTick=function(dt){f(dt);const d=!!(S.merc&&S.merc.dead);if(d&&!was)SIMD.md++;was=d;S.gold=1e9}}`);
 const ms=JSON.parse(G(`const ms=mercStats();JSON.stringify({life:ms.life,def:ms.def,res:ms.avgres,dmg:Math.round((ms.dmg[0]+ms.dmg[1])/2),skl:ms.skl,pdr:ms.pdr,au:ms.auras.map(a=>AURAS[a.id].n+a.lv).join('/'),eq:Object.keys(S.merc.eq).length,hl:ST.life})`));
 const dt=0.05;for(let t=0;t<HOURS*3600;t+=dt){G(`step(${dt})`);if(Math.round(t/dt)%200===0)G(`autoTick();S.zone=__Z.i;S.lvl=${L}`)}
 const r=JSON.parse(G('JSON.stringify(SIMD)')),z=G('__Z.n+" ml"+__Z.ml'),kills=G('S.kills');
 return{L,diff,z,share:(100*r.m/Math.max(1,r.m+r.o)).toFixed(1)+'%',bshare:(100*r.bm/Math.max(1,r.bm+r.bo)).toFixed(1)+'%',ttk:(r.tt/Math.max(1,r.nk)).toFixed(2),mDeath:(r.md/HOURS).toFixed(1),hDeath:(r.hd/HOURS).toFixed(1),kph:Math.round(kills/HOURS),...ms}}
const out=[];for(const[L,d,t]of LV){const r=run(L,d,t);out.push(r);console.log(JSON.stringify(r))}
