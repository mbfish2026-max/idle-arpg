'use strict';
// ===== 终局系统核心（第五阶段）：存档字段 S.eg、终局页签、特殊战斗模式框架、游戏时钟 =====
// 全部通过包装 game.js / acts.js 的全局函数实现；所有全局名以 EG/eg 开头避免冲突。
// 存档：角色对象新字段 S.eg（缺失字段一律用默认值补齐，兼容多角色存档）；跨角色排行在 GS 'anye_eg_rank'（随账号云存档）。
const EG_DEF=()=>({v:1,clock:0,
 bounty:{day:'',week:'',d:[],w:[],caches:0,wcaches:0,auto:0,done:0,ret:null},
 rift:{keys:0,max:1,best:0,runs:0,ok:0},
 para:{lv:0,xp:0,pts:{}},
 lp:{arch:{},cube:{w:null,a:null,j:null}},
 season:null,ach:{},title:null,codex:{u:{},s:{}},
 ev:{wbN:0,wbNext:0},stat:{}});
function egFill(o,d){for(const k in d){if(o[k]===undefined||o[k]===null&&d[k]!==null)o[k]=d[k];else if(d[k]&&typeof d[k]==='object'&&!Array.isArray(d[k])&&typeof o[k]==='object'&&o[k])egFill(o[k],d[k])}return o}
function EG(){if(!S)return EG_DEF();if(!S.eg||typeof S.eg!=='object')S.eg=EG_DEF();else if(!S.eg._ok){egFill(S.eg,EG_DEF());const v=S.eg.ev;if(v&&typeof v==='object')for(const k of['tideB','ember','emberT','autoChest'])delete v[k];if(S.eg.ach)delete S.eg.ach.t1;if(S.eg.stat)for(const k of['tide','tchest'])delete S.eg.stat[k];Object.defineProperty(S.eg,'_ok',{value:1,enumerable:false})}return S.eg}
function egStat(k,n=1){const s=EG().stat;s[k]=(s[k]||0)+n}
// 进度判定
function egDone(d,a){return !!(S.Q&&S.Q[d]&&S.Q[d][ACTS[a].fq])}
function egNormalDone(){return egDone(0,ACTS.length-1)}
function egHellDone(){return egDone(2,ACTS.length-1)}

// ---------- 特殊战斗模式（虚隙/秘径/世界首领等）----------
// EGM={k,name,bg,spawn(),next(),onKill(m),onDie(),top(),quit()}；不入存档（刷新即中止且不扣钥石）
let EGM=null;
function egEnter(m){if(EGM)egLeave(1);S.dz=0;EGM=m;MON=[];CORPSE=[];S.wave=0;spawnT=1.5;calc();H.life=ST.life;H.mana=ST.mana;if(m.start)m.start();log(`<b class="egm">进入 ${m.name}</b>`);if(typeof TAB!=='undefined'){TAB='fight';render()}}
function egLeave(silent){const m=EGM;if(!m)return;EGM=null;MON=[];CORPSE=[];S.wave=0;spawnT=1.5;if(m.quit)m.quit();calc();if(!silent)log(`<span class="dim">离开 ${m.name}</span>`);if(typeof TAB!=='undefined'&&TAB==='fight')render()}
const _eg_spawnWave=spawnWave;spawnWave=function(){if(EGM&&EGM.spawn)return EGM.spawn();return _eg_spawnWave()};
const _eg_nextWave=nextWave;nextWave=function(){if(EGM)return EGM.next?EGM.next():EGM.spawn();return _eg_nextWave()};
const _eg_die=die;die=function(){const m=EGM;if(m){S.dz=0;egStat('egdie');MON=[]}_eg_die();if(m&&EGM===m&&m.onDie)m.onDie()};
const _eg_goZone=goZone;goZone=function(i){if(EGM)egLeave();return _eg_goZone(i)};
const _eg_goAct=goAct;goAct=function(a,d,q){if(EGM)egLeave(1);return _eg_goAct(a,d,q)};
// 事件钩子（各子系统注册）
const EG_HOOK={kill:[],clear:[],tick:[],sec:[],calc:[],pre:[],item:[],xp:[]};
function egOn(k,f){EG_HOOK[k].push(f)}
// 通用防卡死：特殊模式内 240 秒既无击杀、怪物总血量也无新低则离开
egOn('sec',()=>{if(!EGM)return;const c=EG().clock;if(EGM._lk==null)EGM._lk=c;const hp=liveMon().reduce((a,m)=>a+m.hp/m.max,0);if(EGM._mh==null||hp<EGM._mh-0.005){EGM._mh=hp;EGM._lk=c}if(!liveMon().length)EGM._mh=null;if(c-EGM._lk>240){log('<b style="color:#f84">久战无果，撤离 '+EGM.name+'</b>');egLeave(1)}});
const _eg_killMon=killMon;killMon=function(m){const ctx={d:S.diff,a:S.act,z:S.zone,mode:EGM};_eg_killMon(m);egStat('kills');if(m.boss)egStat('boss');if(EGM){EGM._lk=EG().clock;if(EGM.onKill)EGM.onKill(m)}for(const f of EG_HOOK.kill)f(m,ctx)};
const _eg_zoneClear=zoneClear;zoneClear=function(){const ctx={d:S.diff,a:S.act,z:S.zone};_eg_zoneClear();egStat('clears');for(const f of EG_HOOK.clear)f(ctx)};
let EG_secT=0;
const _eg_step=step;step=function(dt){_eg_step(dt);if(!S||!ST)return;const e=EG();e.clock+=dt;for(const f of EG_HOOK.tick)f(dt);EG_secT+=dt;if(EG_secT>=1){EG_secT=0;for(const f of EG_HOOK.sec)f()}};
const _eg_calc=calc;calc=function(){const und=S?EG_HOOK.pre.map(f=>f()).filter(Boolean):[];let o;try{o=_eg_calc()}finally{for(const u of und)u()}if(S)for(const f of EG_HOOK.calc)f(o);ST=o;return o};
const _eg_addBag=addBag;addBag=function(it){for(const f of EG_HOOK.item)f(it);return _eg_addBag(it)};
const _eg_gainXp=gainXp;gainXp=function(x){let v=x;for(const f of EG_HOOK.xp)v=f(v);return _eg_gainXp(v)};
const _eg_questLine=questLine;questLine=function(){if(EGM&&EGM.quest)return EGM.quest();return _eg_questLine()};
// 战斗页：特殊模式顶栏/进度条/退出按钮 + 事件横幅
const EG_BANNER=[];// 函数返回 html
const _eg_renderFight=renderFight;renderFight=function(){_eg_renderFight();
 let fb=$('#egbar');const top=$('#ftop');if(!top)return;
 if(EGM){const zn=top.querySelector('.zn'),wv=top.querySelector('.wv');if(zn)zn.innerHTML=`<b class="egm">${EGM.name}</b>`;if(wv)wv.innerHTML=EGM.wave?EGM.wave():'';
  $('#fzone').innerHTML=`<span>${EGM.name}</span><button class="auto on" onclick="egLeave()">离开</button>`;
  if(EGM.bg&&IMG[EGM.bg])$('#fbattle').style.backgroundImage=`linear-gradient(rgba(20,0,30,.5),rgba(0,0,0,.3) 35%,rgba(0,0,0,.75)),url(${IMG[EGM.bg]})`}
 const h=(EGM&&EGM.top?EGM.top():'')+EG_BANNER.map(f=>f()).join('');
 if(!fb){fb=document.createElement('div');fb.id='egbar';top.after(fb)}if(fb._h!==h){fb.innerHTML=h;fb._h=h}fb.style.display=h?'':'none'};

// ---------- 终局页签 ----------
let EGT='bounty';const EG_PAGES=[];// {k,n,lock(),render()}
function egPage(p){EG_PAGES.push(p)}
function egTabBtn(){const nav=$('#tabs');if(!nav||nav.querySelector('[data-t=eg]'))return;const b=document.createElement('button');b.dataset.t='eg';b.innerHTML='<i>✠</i>终局';b.onclick=()=>{TAB='eg';render()};nav.appendChild(b)}
const _eg_render=render;render=function(){_eg_render();if(TAB==='eg')renderEG()};
function renderEG(){const P=$('#panel');const ps=EG_PAGES;if(!ps.find(p=>p.k===EGT))EGT=ps[0].k;
 const cur=ps.find(p=>p.k===EGT)||{};const tabs=ps.filter(p=>!p.hide).map(p=>`<button class="${EGT===p.k||cur.parent===p.k?'on':''}" onclick="EGT='${p.k}';render()">${p.n}${p.dot&&p.dot()?'<em class="egdot"></em>':''}</button>`).join('');
 const p=ps.find(x=>x.k===EGT);const lk=p.lock&&p.lock();
 P.innerHTML=`<div class="stabs egtabs">${tabs}</div>`+(lk?`<div class="gp"><h3>${p.n}</h3><div class="dim">🔒 ${lk}</div>${p.intro?`<div class="egintro">${p.intro}</div>`:''}</div>`:p.render())}
function egRefresh(){if(TAB==='eg')render()}
// game.js 以函数引用注册 init，这里另挂 DOMContentLoaded（在 init 之后执行）
function egBoot(){EG();egTabBtn();for(const f of EG_BOOT)f();render()}const EG_BOOT=[];
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',egBoot);else setTimeout(egBoot,0);
// 工具
function egDay(t=Date.now()){const d=new Date(t);return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()}
function egWeek(t=Date.now()){const d=new Date(t);d.setHours(0,0,0,0);const day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);return 'W'+egDay(d.getTime())}
function egTime(s){s=Math.max(0,Math.round(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
function egRuneName(r){return itemName({k:'rune',r})}
function egMaxMl(){let mx=1;const d=S.diff;for(let a=0;a<ACTS.length;a++){if(!actOpen(a,d))continue;const un=(a===S.act?S.unl:(S.UN[pkey(a,d)]||0));for(let i=0;i<=un&&i<ACTS[a].zones.length;i++)mx=Math.max(mx,ACTS[a].zones[i].ml)}return mx}
// 测试/调试
const egdbg={beatNormal(){S.Q[0]=S.Q[0]||{};for(const A of ACTS)S.Q[0][A.fq]=1;S.actU[0]=4;S.diffU=Math.max(S.diffU,1);S.actU[1]=S.actU[1]||0},
 beatAll(){for(let d=0;d<3;d++){S.Q[d]=S.Q[d]||{};for(const A of ACTS)S.Q[d][A.fq]=1;S.actU[d]=4}S.diffU=2;S.q=S.Q[S.diff]},
 unlockZones(){for(let d=0;d<=S.diffU;d++)for(let a=0;a<ACTS.length;a++){const k=pkey(a,d);S.UN[k]=ACTS[a].zones.length-1}S.unl=ACTS[S.act].zones.length-1}};
