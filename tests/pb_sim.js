// 威能共鸣倍率模拟：CLS=nec,bar,... node tests/pb_sim.js [次数=3] [秒=60]
// 85 级地狱第五章；四档：无流派白装 / 流派 6 件套+暗金 / 流派白装+3 核心威能(共鸣 II, 1 阶) / 两者同开。输出击杀与对 6 件套的倍率（目标 ≤1.6）。
const fs=require('fs'),vm=require('vm'),path=require('path');const root=path.join(__dirname,'..');
const stub=()=>new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?()=>'' :k==='readyState'?'loading':stub(),apply:()=>stub(),construct:()=>stub(),set:()=>true});
const store={};let _sd=Number(process.env.SEED||7)>>>0;const SMath=Object.create(Math);SMath.random=()=>{_sd=(_sd+0x6D2B79F5)>>>0;let t=_sd;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296};
const ctx={console:{log(){},warn(){},error:console.error},Math:SMath,Date,JSON,setTimeout:()=>0,setInterval:()=>0,clearInterval(){},clearTimeout(){},requestAnimationFrame:()=>0,
 localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v},removeItem:k=>{delete store[k]}},document:stub(),Image:function(){return stub()},navigator:{},location:{search:''},addEventListener(){},performance:{now:()=>Date.now()},confirm:()=>true};
ctx.window=ctx;vm.createContext(ctx);ctx.__NOUI=1;ctx.__NOSHOWLOGIN=1;
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');const files=[...html.matchAll(/<script src="([^"?]+)/g)].map(m=>m[1]).filter(f=>!/^(cloud|login_flow|audio|power|ui_art|icon2|art2_)/.test(f));
for(const f of files)try{vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f})}catch(e){console.error('load',f,e.message)}
const G=s=>vm.runInContext(s,ctx);
if(process.env.MJ){const L=+process.env.MJ;G(`{const f=mkMon;mkMon=function(...a){const m=f(...a);m.max=m.hp=Math.round(m.max*Math.pow(1.08,${L}));m.dmg=m.dmg.map(x=>x*Math.pow(1.035,${L}));return m}}`)}
G(`function nbRun(b,gear,T,zi,cls,res){cls=cls||'nec';S=newSave();S.cls=cls;S.ci=0;S.eq={};if(cls==='nec'){S.ci=1;S.sk={rs:1}}else clsInit();S.eq={};const L=85;S.lvl=L;S.xp=xpNeed(L);S.kp=L-1+12;S.sp=5*(L-1);S.auto=0;S.autoEq=0;S.autoSk=1;S.autoAt=1;S.gold=0;S.diff=2;applyDiff();S.build=null;S.buildN=0;
 const WC={nec:'wand',bar:'sword',sor:'wand',dru:'staff',ama:'abow',pal:'sword'}[cls],SC={nec:'head',bar:'shield',sor:'orb',dru:null,ama:null,pal:'pshd'}[cls],HC={bar:'bhelm',dru:'pelt'}[cls];
 const bw=b&&NB.builds[b]&&gear?null:null;const wcat=(b&&{bar_bers:'axe',pal_ham:'mace',pal_fist:'mace',ama_jav:'ajav',ama_strafe:'bow',ama_elem:'bow'}[b])||WC;
 const best=s=>BASES.filter(x=>x.s===s&&!x.jew&&x.q<=L&&(!x.ccls||x.ccls===cls)&&(s!=='weapon'||x.cat===wcat)&&(s!=='shield'||x.cat===SC)&&(s!=='helm'||!HC||x.cat===HC)).sort((x,y)=>(y.tier|0)-(x.tier|0)||y.q-x.q)[0];
 for(const s of['weapon','shield','helm','armor','gloves','belt','boots']){if(s==='shield'&&(!SC||TWOH.has(wcat)))continue;const B=best(s);if(B)S.eq[s]=makeBase(B,L)}
 calc();if(b)nbPick(b);
 if(gear&&b){const set=NB.builds[b].set;for(const d of SETITEMS.filter(x=>x.set===set)){const it=nbMake(d,L);it.m=Object.fromEntries(Object.entries(d.m).map(([k,v])=>[k,Array.isArray(v)?v[1]:v]));S.eq[BASEM[d.b].s]=it;if(BASEM[d.b].s==='weapon'&&TWOH.has(BASEM[d.b].cat))delete S.eq.shield}
  for(const d of UNIQUES.filter(x=>x.nb===b)){const it=nbMake(d,L);const s=BASEM[d.b].s;const k=s==='ring'?(S.eq.ring1?'ring2':'ring1'):s;if(s==='weapon'&&S.eq.weapon&&S.eq.weapon.set)continue;S.eq[k]=it}}
 if(res&&b){const A=EG().lp;A.arch={};A.cube={w:null,a:null,j:null,u:null};for(const k of PB.core[b]){A.arch[k]=1;A.cube[EG_LP[k].c]=k}}
 calc();for(let i=0;i<40;i++){autoTick();calc()}
 const Z=[];ACTS[4].zones.forEach((q,i)=>{if(q.boss||!Array.isArray(q.mons))return;Z.push({i,ml:q.ml})});const z=Z[(zi||0)%Z.length];S.act=4;S.zone=z.i;S.wave=0;
 resetRuntime();MON=[];ALLY=[];CORPSE=[];H.life=ST.life;H.mana=ST.mana;H.abs=0;spawnT=0.1;const k0=S.kills||0;let dead=0;const od=die;die=function(){dead++;od()};
 const oz=zoneClear;zoneClear=function(){S.wave=0};
 let mlv=0;try{for(let t=0;t<T;t+=0.05){if(!liveMon().length)spawnT=Math.min(spawnT,0.05);step(0.05);for(const m of MON)mlv=Math.max(mlv,m.lv)}}finally{die=od;zoneClear=oz}return[(S.kills||0)-k0,dead,mlv,Object.entries(S.sk).filter(x=>x[1]>=5).map(x=>SKM[x[0]].n+x[1]).join(' ')]}`);
if(process.env.PBNR)G('PB.r1=0;PB.r2=0');
const N=+process.argv[2]||3,T=+process.argv[3]||60;const out=[];
const run=(b,g,r,C)=>{let k=0,d=0,lv=0;for(let i=0;i<N;i++){const x=G(`nbRun('${b}',${g},${T},${i},'${C}',${r})`);k+=x[0];d+=x[1];lv=G('ST.pbr?ST.pbr.lv:0')}return[k/N,d/N,lv]};
for(const C of(process.env.CLS||'nec').split(',')){const base=run('',0,0,C);for(const b of G(`nbClsBuilds('${C}').map(x=>x[0]).join(',')`).split(',')){const st=run(b,1,0,C),rs=run(b,0,1,C),bo=run(b,1,1,C);const q=x=>(x/Math.max(0.1,st[0])).toFixed(2);
 const line=`| ${C} | ${b} | ${base[0].toFixed(0)} | ${st[0].toFixed(0)} | ${rs[0].toFixed(0)} (×${q(rs[0])}) | ${bo[0].toFixed(0)} (×${q(bo[0])}) | ${rs[2]}/${bo[2]} | ${(st[1]+rs[1]+bo[1]).toFixed(1)} |`;console.log(line)}}
