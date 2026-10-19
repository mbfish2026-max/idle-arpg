// 威能共鸣单元测试：node tests/pb_test.js
// 校验 PB_DEF 与流派 id、核心威能分类、上限 6、共鸣 I/II、6 件减半、存档迁移、品阶、掉落倾向、秘晶兑换、炼金匣重铸
const fs=require('fs'),vm=require('vm'),path=require('path');const root=path.join(__dirname,'..');
const stub=()=>new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?()=>'' :k==='readyState'?'loading':stub(),apply:()=>stub(),construct:()=>stub(),set:()=>true});
const store={};let _sd=Number(process.env.SEED||7)>>>0;const SMath=Object.create(Math);SMath.random=()=>{_sd=(_sd+0x6D2B79F5)>>>0;let t=_sd;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296};
const ctx={console:{log(){},warn(){},error:console.error},Math:SMath,Date,JSON,setTimeout:()=>0,setInterval:()=>0,clearInterval(){},clearTimeout(){},requestAnimationFrame:()=>0,
 localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v},removeItem:k=>{delete store[k]}},document:stub(),Image:function(){return stub()},navigator:{},location:{search:''},addEventListener(){},performance:{now:()=>Date.now()},confirm:()=>true};
ctx.window=ctx;vm.createContext(ctx);ctx.__NOUI=1;ctx.__NOSHOWLOGIN=1;
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');const files=[...html.matchAll(/<script src="([^"?]+)/g)].map(m=>m[1]).filter(f=>!/^(cloud|login_flow|audio|power|ui_art|icon2|art2_)/.test(f));
for(const f of files)try{vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f})}catch(e){console.error('load',f,e.message)}
const G=s=>vm.runInContext(/^function /.test(s)?s:'{'+s+'\n}',ctx);
let fail=0;const ok=(c,m)=>{if(!c){fail++;console.error('✗ '+m)}else console.log('✓ '+m)};
G(`function pbMk(cls,b){S=newSave();S.cls=cls;S.ci=cls==='nec'?1:0;S.sk=cls==='nec'?{rs:1}:{};if(cls!=='nec')clsInit();S.eq={};S.lvl=85;S.diff=2;S.build=null;S.buildN=0;calc();if(b)nbPick(b);calc()}`);
// 1 流派 id 对齐
const ids=G(`Object.keys(NB.builds).sort().join(',')`),pk=G(`Object.keys(PB.core).sort().join(',')`);ok(ids===pk,'PB.core 覆盖全部 18 个流派 id：'+pk);
// 2 核心威能存在、分属三类、职业一致
const bad=G(`Object.entries(PB.core).filter(([b,cs])=>{const c=nbBc(NB.builds[b]);return cs.length!==3||cs.some(k=>!EG_LP[k]||(pbCls(k)!=='*'&&pbCls(k)!==c))||cs.map(k=>EG_LP[k].c).sort().join('')!=='ajw'}).map(x=>x[0]).join(',')`);ok(!bad,'核心威能存在/职业一致/武器护甲饰品各 1 '+bad);
ok(G(`Object.keys(EG_LP).filter(k=>k.startsWith('pw_')).length`)===17,'新增 17 个威能');
ok(G(`new Set(Object.values(EG_LP).map(x=>x.n)).size===Object.keys(EG_LP).length`),'威能名不重复');
// 3 共鸣 I/II
G(`pbMk('bar','bar_ww');const A=EG().lp;for(const k of PB.core.bar_ww)A.arch[k]=1;A.cube.w='pw_whirl';calc()`);ok(G(`ST.pbr.lv`)===0,'1 核心无共鸣');
const s1=G(`ST.nb.skd.bww||0`);G(`EG().lp.cube.a='pw_ironspin';calc()`);ok(G(`ST.pbr.lv`)===1&&G(`ST.nb.skd.bww`)-s1===25,'2 核心=共鸣 I +25%');
G(`EG().lp.cube.j='taunt_doom';calc()`);ok(G(`ST.pbr.lv`)===2&&G(`ST.nb.skd.bww`)-s1===65,'3 核心=共鸣 II +65%');ok(G(`ST.nb.mech.some(x=>x.t==='echo'&&x.id==='bww')`),'共鸣 II 给回响机制');
// 4 6 件减半
G(`for(const d of SETITEMS.filter(x=>x.set==='nb_bar_ww')){const it=nbMake(d,85);const s=BASEM[d.b].s;S.eq[s==='ring'?'ring1':s]=it}calc()`);ok(G(`ST.pbr.full&&ST.pbr.pct===32.5`),'6 件套满：共鸣减半 32.5%');ok(G(`ST.nb.mech.filter(x=>x.id==='bww').length`)===1,'6 件满时机制不重复');
// 5 未选流派无共鸣
G(`S.build=null;calc()`);ok(G(`ST.pbr.lv`)===0,'无流派不共鸣');
// 6 上限 6 + 通用槽
G(`pbMk('nec','bone');const A=EG().lp;['bs_split','bx_echo','skel_burst','curse_wide'].forEach(k=>A.arch[k]=1);A.cube={w:'bs_split',a:'skel_burst',j:'curse_wide',u:'bx_echo'};
 const ks=['te_storm','pn_venom','golem_undying','ba_surge','legion','curse_spread'],sl=['weapon','armor','helm','gloves','belt','boots'];ks.forEach((k,i)=>{const B=BASES.find(b=>b.s===sl[i]&&!b.ccls);const it=makeBase(B,85);it.lp=k;S.eq[sl[i]]=it});calc()`);
ok(G(`EG_LPS.size`)===6&&G(`PB.over.length`)===3,'生效上限 6，超出 3 个');ok(!G(`EG_LPS.has('bx_echo')`),'通用槽未解锁（地狱未通关）不生效');
G(`egDone=()=>true;calc()`);ok(G(`EG_LPS.has('bx_echo')&&EG_LPS.size===6`),'通用槽解锁后生效且匣槽优先');
// 7 存档迁移
G(`pbMk('sor');EG().lp={arch:{blizz_deep:true,es_aegis:1},cube:{w:'blizz_deep',a:null,j:null}};calc()`);ok(G(`JSON.stringify(EG().lp.cube)`)==='{"w":"blizz_deep","a":null,"j":null,"u":null}'&&G(`EG().lp.arch.blizz_deep`)===1,'旧存档迁移 cube.u / arch 品阶');
// 8 品阶
G(`pbMk('sor','sor_cold');EG_LPNOCONF=1;S.gold=1e9;const A=EG().lp;A.arch.pw_frostcore=1;A.cube.j='pw_frostcore';const B=BASES.find(b=>b.s==='ring');for(let i=0;i<3;i++){const it=makeBase(B,85);it.lp='pw_frostcore';S.bag.push(it);S.bag.push({k:'gem',g:'rub',lv:0,uid:900+i});egLpExtract(it.uid)}calc()`);
ok(G(`EG().lp.arch.pw_frostcore`)===3,'重复收录升到 3 阶（封顶）');ok(G(`ST.nb.skd.mbliz>=30`),'3 阶霜蚀之心 ×1.5 = +30%');
// 9 掉落倾向
const n=G(`pbMk('ama','ama_jav');let c=0;const B=BASES.find(b=>b.s==='amulet');for(let i=0;i<400;i++){const it=makeBase(B,85);if(egLpRoll(it)==='pw_thunderbadge')c++}c`);ok(n>120,'地狱饰品 40% 倾向核心：'+n+'/400');
const n2=G(`S.diff=0;let c=0;const B=BASES.find(b=>b.s==='amulet');for(let i=0;i<400;i++){const it=makeBase(B,85);if(egLpRoll(it)==='pw_thunderbadge')c++}c`);ok(n2<n/2,'普通难度无倾向：'+n2+'/400');
// 10 秘晶兑换
G(`pbMk('pal','pal_ham');egMj().cr=700;pbBuy('pw_judgham');pbBuy('vigor_oath')`);ok(G(`egMj().cr`)===400&&G(`EG().lp.arch.pw_judgham`)===1&&!G(`EG().lp.arch.vigor_oath`),'秘晶兑换 300 + 每周限 1');
// 11 炼金匣重铸
G(`pbMk('dru','dru_wind');S.bag=[];const B=BASES.find(b=>b.s==='weapon'&&!b.ccls);for(const k of['fissure_rage','volc_twin','boss_bane']){const it=makeBase(B,85);it.lp=k;S.bag.push(it)}S.bag.push({k:'gem',g:'rub',lv:4,uid:999})`);
ok(G(`cubeRecipes().some(r=>r[1]==="pbCube('w')")`),'炼金匣出现威能重铸配方');ok(G(`pbCube('w')`)&&G(`S.bag.length`)===1&&G(`S.bag[0].lp`)==='pw_galestaff','重铸消耗 2 件+完美宝石，优先当前流派核心');
// 12 核心标签数据
ok(G(`pbBuildsOf('es_aegis').length`)===3&&G(`pbBuildsOf('strafe_gale').join()`)==='ama_strafe','核心归属查询');
console.log(fail?`失败 ${fail}`:'全部通过');process.exit(fail?1:0);
