// 职业调平：node tests/cls_bal.js [职业,逗号分隔=nec,sor,bar,dru] [每项次数=24]
// 各职业在 1/12/24/30 级自动加点（技能计划/属性），普通难度、怪物等级≈角色等级的区域连续刷 60 秒，统计击杀与死亡。
// 装备两档：开局装（职业初始武器），好武器（同类最好的白色武器，需求等级≤角色等级）。输出与亡灵术士的击杀比。
const fs=require('fs'),vm=require('vm'),path=require('path');const root=path.join(__dirname,'..');
const stub=()=>new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?()=>'' :k==='readyState'?'loading':stub(),apply:()=>stub(),construct:()=>stub(),set:()=>true});
const store={};let _sd=Number(process.env.SEED||11)>>>0;const SMath=Object.create(Math);SMath.random=()=>{_sd=(_sd+0x6D2B79F5)>>>0;let t=_sd;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296};
const ctx={console:{log(){},warn(){},error:console.error},Math:SMath,Date,JSON,setTimeout:()=>0,setInterval:()=>0,clearInterval(){},clearTimeout(){},requestAnimationFrame:()=>0,
 localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v},removeItem:k=>{delete store[k]}},document:stub(),Image:function(){return stub()},navigator:{},location:{search:''},addEventListener(){},performance:{now:()=>Date.now()}};
ctx.window=ctx;vm.createContext(ctx);ctx.__NOUI=1;ctx.__NOSHOWLOGIN=1;
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');const files=[...html.matchAll(/<script src="([^"?]+)/g)].map(m=>m[1]).filter(f=>!/^(cloud|login_flow|audio|power|ui_art|icon2|art2_)/.test(f));
for(const f of files)try{vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f})}catch(e){console.error('load',f,e.message)}
const G=s=>vm.runInContext(s,ctx);
G(`function balRun(c,L,good){S=newSave();S.cls=c;S.ci=0;S.eq={};if(c==='nec'){S.sk={rs:1};for(const b of['wand1','shd1'])S.eq[BASEM[b].s]=makeBase(BASEM[b],1)}else clsInit();
 const W={nec:'wand',sor:'wand',bar:'sword',dru:'mace'}[c];if(good){const w=BASES.filter(b=>b.cat===W&&b.q<=L).sort((a,b)=>(b.dmg[0]+b.dmg[1])-(a.dmg[0]+a.dmg[1]))[0];if(w)S.eq.weapon=makeBase(w,L)}
 S.lvl=L;S.xp=xpNeed(L);S.kp=L-1;S.sp=5*(L-1);S.auto=0;S.autoEq=0;S.gold=0;calc();autoTick();calc();
 let best=null;for(let a=0;a<ACTS.length;a++)ACTS[a].zones.forEach((z,i)=>{if(z.boss)return;const d=Math.abs(z.ml-L);if(!best||d<best.d)best={a,i,d}});S.act=best.a;S.zone=best.i;S.diff=0;S.wave=0;
 resetRuntime();MON=[];ALLY=[];CORPSE=[];H.life=ST.life;H.mana=ST.mana;H.abs=0;spawnT=0.1;const k0=S.kills||0;let dead=0;const od=die;die=function(){dead++;od()};
 try{for(let t=0;t<60;t+=0.05){step(0.05)}}finally{die=od}return[(S.kills||0)-k0,dead]}`);
const cls=(process.argv[2]||'nec,sor,bar,dru').split(','),N=+process.argv[3]||24,LV=[1,12,24,30];const res={};
for(const good of[0,1])for(const c of cls)for(const L of LV){let k=0,d=0;for(let i=0;i<N;i++){const[a,b]=G(`balRun('${c}',${L},${good})`);k+=a;d+=b}res[[c,L,good]]=[k/N,d/N]}
for(const good of[0,1]){console.log(good?'\n== 好武器 ==':'== 开局装 ==');console.log('职业   '+LV.map(l=>('L'+l).padStart(16)).join(''));
 for(const c of cls)console.log(c.padEnd(6)+LV.map(L=>{const[k,d]=res[[c,L,good]],n=res[['nec',L,good]];return(`${k.toFixed(1)}${n?' ×'+(k/Math.max(0.1,n[0])).toFixed(2):''}${d?' 死'+d.toFixed(1):''}`).padStart(16)}).join(''))}
