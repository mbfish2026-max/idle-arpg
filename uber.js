'use strict';
// ===== 暗渊三魂（终极首领）：魂钥 → 魂狱（守魂者，掉魂核）→ 暗渊（三魂同场，m.uber=true 切 BGM）→ 终极/神话物品（it.myth 紫色天光） =====
// 解锁：地狱第五章通关 且 秘境最高 ≥20 层。暗渊/魂狱内不做离线结算（后台/息屏 → 退出，同秘境）。
// 存档：EG().uber={k:{t,h,d},o:{horn,eye,brain},runs,wins,pr,prw,got:{},best:{torch:0},day:{d,n}}；物品 it.ub=<id>、it.myth=1（神话）、it.uniq1=1（每角色只生效 1 件）。
const UB={n:'暗渊',limit:180,maxDie:3,L:30,dayCap:6,crys:3,
 KEYS:{t:{n:'恐惧魂钥',ic:'key_fear'},h:{n:'憎恨魂钥',ic:'key_hate'},d:{n:'毁灭魂钥',ic:'key_doom'}},
 CORES:{horn:{n:'悲恸之角',ic:'core_horn',g:'abyss_g1'},eye:{n:'凝视之眼',ic:'core_eye',g:'abyss_g2'},brain:{n:'低语之脑',ic:'core_brain',g:'abyss_g3'}},
 GATE:{abyss_g1:{n:'悲恸之母·婀萝',c:'horn'},abyss_g2:{n:'腐沙之王·萨墨',c:'eye'},abyss_g3:{n:'堕羽司祭·泠迦',c:'brain'}},
 SOUL:{abyss_s1:{n:'血噬·厄罗',t:'憎恨之魂',mech:'寒魂新星：每 8 秒全屏冰伤，冰抗不足 75 冻结 1 秒'},
  abyss_s2:{n:'焚世·巴戈',t:'毁灭之魂',mech:'残影：生命 50% 时召出分身（伤害 50%），分身存活时本体减伤 50%'},
  abyss_s3:{n:'噩魇·缪渊',t:'恐惧之魂',mech:'魇牢·赤芒：每 12 秒禁锢英雄 2 秒，随后一道高伤赤芒'}},
 // 终极物品（区间追求满值）；allst=四项属性同值；tree=随机职业系别 +1
 ITEMS:{torch:{n:'渊火之炬',ic:'torch',b:'cha_l',w:60,u1:1,m:{tree:1,allst:[2,5],allres:[10,20]}},
  shard:{n:'灭魂碎片',ic:'shard',b:'cha_s',w:25,u1:1,m:{allst:[5,10],allres:[10,20],ub_xp:[5,10]}},
  crown:{n:'命运之冠',ic:'myth_crown',s:'helm',w:7,myth:1,sock:2,m:{drp:[10,15],allres:[20,30]}},
  armor:{n:'永夜战甲',ic:'myth_armor',s:'armor',w:5,myth:1,m:{lifepct:[15,25],nb_e_dr:[8,12],nofreeze:1}},
  ring:{n:'群星之戒',ic:'myth_ring',b:'rin',w:3,myth:1,m:{nb_boss:[20,30],allres:[10,15],mf:[30,50]}}},
 CLS:['nec','ama','sor','pal','bar','dru'],lock:0,nova:0,cage:0,cageHit:0};
if(typeof MODT!=='undefined'&&!MODT.ub_xp)MODT.ub_xp='经验 +{v}%';
// ---------- 首领数据（立绘 assets/boss/abyss_*.webp） ----------
{const E=BOSSES.eldron;const mk=(k,n,o)=>{BOSSES[k]=Object.assign({},E,{n,actboss:0,a:'b_'+k,ic:'☠'},o||{});if(typeof ASSETS!=='undefined')ASSETS['b_'+k]='assets/boss/'+k+'.webp'};
 for(const k in UB.GATE)mk(k,UB.GATE[k].n,{gate:1});for(const k in UB.SOUL)mk(k,UB.SOUL[k].n,{uber:true})}
// ---------- 存档 ----------
const UB_DEF=()=>({k:{t:0,h:0,d:0},o:{horn:0,eye:0,brain:0},runs:0,wins:0,pr:0,prw:0,got:{},best:{torch:0},day:{d:'',n:0}});
function egUb(){const e=EG();if(!e.uber||typeof e.uber!=='object')e.uber=UB_DEF();else egFill(e.uber,UB_DEF());return e.uber}
function ubLock(){if(!egHellDone())return'击败地狱第五章首领后开放';return egMj().best>=20?null:`秘境最高 ≥20 层后开放（当前 ${egMj().best}）`}
// ---------- 魂钥掉落 ----------
function ubGiveKey(k,why){const U=egUb(),d=egDay();if(U.day.d!==d){U.day.d=d;U.day.n=0}
 if(why!=='week'&&U.day.n>=UB.dayCap){egMj().cr+=UB.crys;log(`<span class="dim">${UB.KEYS[k].n}今日已满 ${UB.dayCap} 把，转为 ${EG_MJ.ic}${EG_MJ.cur}+${UB.crys}</span>`);return false}
 if(why!=='week')U.day.n++;U.k[k]++;log(`<b style="color:#c9f">获得 ${UB.KEYS[k].n}</b>`);if(!window.__NOUI)toast('✦ '+UB.KEYS[k].n);return true}
function ubKeyChance(m){if(!m||!S)return null;const E=typeof EGM!=='undefined'?EGM:null;
 if(m.egMjBoss&&E&&E.k==='mj'&&E.L>=20)return['d',Math.min(0.16,0.08+0.02*Math.floor((E.L-20)/10))];
 if(m.egGuard&&E&&E.k==='rift'&&E.T>=10)return['h',0.10];
 if(!E&&S.diff===2&&m.boss&&S.act<=1&&BOSSES[m.key]&&!BOSSES[m.key].uber&&!BOSSES[m.key].gate)return['t',0.06];return null}
{const f=rollTC;rollTC=function(m){const o=f.apply(this,arguments);try{if(!ubLock()){const c=ubKeyChance(m);const E=typeof EGM!=='undefined'?EGM:null;
 if(c&&!(E&&E._ubk)){if(E)E._ubk=1;if(rnd()<c[1])ubGiveKey(c[0])}}}catch(e){console.warn(e)}return o}}
// 每周悬赏「夜誓重匣」保底 1 把随机魂钥
if(typeof egOpenCache==='function'){const f=egOpenCache;egOpenCache=function(w){const B=EG().bounty,n=B.wcaches;const r=f.apply(this,arguments);try{if(w&&B.wcaches<n&&!ubLock())ubGiveKey(pick(['t','h','d']),'week')}catch(e){}return r}}
// ---------- 终极物品 ----------
function ubTree(cls,t){return cls==='nec'?'t'+t+'sk':'tc_'+cls+t}
function ubBase(D){if(D.b)return BASEM[D.b];return BASES.filter(x=>x.s===D.s&&!x.jew&&!x.ccls).sort((x,y)=>(y.tier|0)-(x.tier|0)||y.q-x.q)[0]}
function ubRanges(it){const D=UB.ITEMS[it&&it.ub];if(!D)return null;const m={};for(const k in D.m){const v=D.m[k];if(k==='allst'){for(const s of['str','dex','vit','ene'])m[s]=v}else if(k!=='tree')m[k]=v}return{n:D.n,m}}
function ubMake(id,o={}){const D=UB.ITEMS[id];const b=ubBase(D);const it=makeBase(b,99);it.q=5;it.name=D.n;it.ub=id;it.req=Math.min(85,b.q||1);it.m={};
 for(const k in D.m){const v=D.m[k];const r=Array.isArray(v)?(o.max?v[1]:R(v[0],v[1])):v;
  if(k==='allst'){for(const s of['str','dex','vit','ene'])it.m[s]=r}else if(k==='tree'){const c=o.cls||pick(UB.CLS);it.m[ubTree(c,o.tree!=null?o.tree:R(0,2))]=v;it.tcls=c}else it.m[k]=r}
 if(D.myth)it.myth=1;if(D.u1)it.uniq1=1;if(D.sock){it.sock=D.sock;it.soc=[]}if(typeof finishDefense==='function')try{finishDefense(it,b)}catch(e){}
 if(id==='crown'&&o.anc!==0&&(o.anc||rnd()<0.1)&&typeof ancApply==='function')ancApply(it,o.anc||1);
 if(S&&S.uid!=null)it.uid=S.uid++;return it}
// 上古/属性品质：让 ancient.js 认识终极物品的区间
if(typeof ancDef==='function'){const f=ancDef;ancDef=function(it){return ubRanges(it)||f(it)}}
function ubPickItem(){const T=Object.entries(UB.ITEMS),W=T.reduce((a,[,d])=>a+d.w,0);let r=rnd()*W;for(const[k,d]of T){r-=d.w;if(r<0)return k}return'torch'}
// 每角色限 1：同 ub 的 uniq1 护身符只算第一件
{const f=charmMods;charmMods=function(){const bag=S.bag,seen={},keep=[];for(const it of bag||[]){if(it&&it.uniq1&&it.ub){if(seen[it.ub])continue;seen[it.ub]=1}keep.push(it)}S.bag=keep;try{return f.apply(this,arguments)}finally{S.bag=bag}}}
// 经验加成（灭魂碎片）
function ubXp(){let v=0,seen=0;for(const it of (S&&S.bag)||[])if(it&&it.ub==='shard'&&!seen){seen=1;v+=it.m.ub_xp||0}return v}
egOn('xp',x=>{const v=ubXp();return v?x*(1+v/100):x});
{const f=itemColor;itemColor=function(it){return it&&it.myth?'#b05cff':f(it)}}
{const f=itemIcon;itemIcon=function(it){const D=it&&UB.ITEMS[it.ub];if(!D)return f(it);const b=BASEM[it.b]||{};
 return`<i class="ii art ic2 ${b.s==='charm'?'chm c'+(b.sz||1):'eq'} ubic" style="background-image:url(assets/icon2/abyss/${D.ic}.webp);background-size:contain;background-position:center;background-repeat:no-repeat"></i>`}}
{const f=cell;cell=function(it,on){const h=f(it,on);return it&&it.myth?h.replace('class="cell ','class="cell myth '):h}}
{const f=showItem;showItem=function(uid){const r=f.apply(this,arguments);try{const fi=findItem(uid),it=fi&&fi.it;const p=document.querySelector('#modal .ipanel');if(it&&it.ub&&p&&!p.querySelector('.ubtag')){
 const c=it.tcls?`（${(CLS_DEF[it.tcls]||{}).n||it.tcls}）`:'';const h=`<div class="sec ubtag"><b class="${it.myth?'ubmy':'ubul'}">${it.myth?'神话':'终极'}</b><span class="ubex">暗渊专属</span>${c?`<span class="dim">${c}</span>`:''}${it.uniq1?'<span class="dim">每角色限 1</span>':''}</div>`;
 const t=p.querySelector('.ih');if(t)t.insertAdjacentHTML('afterend',h);else p.insertAdjacentHTML('afterbegin',h)}}catch(e){console.warn(e)}return r}}
// ---------- 战斗 ----------
function ubMon(k,mul){const fr={L:UB.L,nf:{h:1,d:1}},ml=EG_MJ.ml(UB.L);const m=egMjMon(fr,k,ml+2);m.max=m.hp=Math.round(egMjBossHP(UB.L,ml)*mul.h);m.dmg=m.dmg.map(x=>x*mul.d);m.n=BOSSES[k].n;m.boss=true;return m}
function ubRun(kind,o){const run={k:kind,name:kind==='uba'?UB.n:'魂狱·'+UB.GATE[o.g].n,bg:'bg_act5',t:0,el:0,deaths:0,spawned:0,end:0,done:0,g:o.g,souls:[],all:[],enr:1,
  spawn(){if(this.spawned||this.end)return;this.spawned=1;if(kind==='uba'){this.souls=Object.keys(UB.SOUL).map(k=>{const m=ubMon(k,{h:1.5,d:1.2});m.uber=true;m.ubS=k;return m});this.all=this.souls.slice();MON=this.souls.slice();UB.nova=GT+8;UB.cage=GT+12;UB.cageHit=0;
    log(`<b class="bossn">暗渊三魂</b> 同时降临：${this.souls.map(m=>m.n).join('、')}！`)}else{const m=ubMon(o.g,{h:1,d:1});m.ubG=1;this.all=[m];MON=[m];log(`<b class="bossn">${m.n}</b> 守在魂狱深处`)}},
  next(){this.spawn()},
  onKill(m){if(this.end)return;if(kind==='ubp'&&m.ubG){ubPrisonDone(this);return}
   if(kind==='uba'&&m.ubS){const left=this.souls.filter(x=>x.hp>0);for(const x of left)x.dmg=x.dmg.map(v=>v*1.2);if(left.length)log(`<b style="color:#f66">${m.n} 陨落，其余魂魄狂暴：伤害 +20%</b>`);
    if(m.ubS==='abyss_s2')MON.filter(x=>x.ubClone).forEach(x=>x.hp=0);if(!left.length)ubAbyssDone(this)}},
  onDie(){this.deaths++;spawnT=3;if(this.deaths>=UB.maxDie)ubFail(this,`阵亡 ${this.deaths} 次`);else if(this.spawned){MON=(this.all||[]).filter(x=>x.hp>0);spawnT=99}},
  wave(){return kind==='uba'?'三魂':'守魂者'},
  top(){const lim=UB.limit,left=lim-this.t;return`<div class="egline"><span>⏳ ${egTime(Math.max(0,left))}</span>${egPbar(Math.max(0,left),lim,'time')}<span>☠${this.deaths}/${UB.maxDie}</span></div>`},
  quest(){return`【${this.name}】${kind==='uba'?'击败三魂（'+this.souls.filter(x=>x.hp>0).length+'/3）':'击败守魂者'}${this.deaths?' · 阵亡'+this.deaths:''}`},
  quit(){this.end=1;UB.lock=0}};
 egEnter(run);return run}
// 英雄被冻结/禁锢时不行动
{const f=heroAct;heroAct=function(){if(UB.lock>GT)return 0;return f.apply(this,arguments)}}
function ubHitHero(v,el,txt){if(el&&el!=='phys')v=Math.round(v*(1-((ST.res&&ST.res[el])||0)/100));else v=Math.max(1,v-(ST.dr||0));H.life-=v;floatHero('-'+v+' '+txt,'#f4a');return v}
egOn('tick',dt=>{const r=EGM;if(!r||(r.k!=='uba'&&r.k!=='ubp')||r.end||r.done)return;r.t+=dt;if(r.t>UB.limit){ubFail(r,'超过 3 分钟');return}if(r.k!=='uba'||!r.spawned)return;
 const S1=r.souls.find(x=>x.ubS==='abyss_s1'&&x.hp>0),S2=r.souls.find(x=>x.ubS==='abyss_s2'&&x.hp>0),S3=r.souls.find(x=>x.ubS==='abyss_s3'&&x.hp>0),avg=m=>(m.dmg[0]+m.dmg[1])/2;
 if(S1&&GT>=UB.nova){UB.nova=GT+8;ubHitHero(avg(S1)*1.5,'cold','寒魂新星');if(((ST.res&&ST.res.cold)||0)<75&&!ST.nofreeze){UB.lock=Math.max(UB.lock,GT+1);floatHero('冻结','#8cf')}}
 if(S2){if(!S2.ubSplit&&S2.hp<=S2.max*0.5){S2.ubSplit=1;const c=Object.assign({},S2,{uid:mUid++,n:S2.n+'之影',ubS:null,ubClone:1,uber:false,max:Math.round(S2.max*0.25),dmg:S2.dmg.map(x=>x*0.5),cur:null,pois:null});c.hp=c.max;MON.push(c);r.all.push(c);log(`<b style="color:#f84">${S2.n} 分出残影！残影存活时本体减伤 50%</b>`)}
  if(S2._ph!=null&&S2.hp<S2._ph&&MON.some(x=>x.ubClone&&x.hp>0))S2.hp+=(S2._ph-S2.hp)*0.5;S2._ph=S2.hp}
 if(S3){if(GT>=UB.cage){UB.cage=GT+12;UB.lock=Math.max(UB.lock,GT+2);UB.cageHit=GT+2;floatHero('魇牢','#f44')}if(UB.cageHit&&GT>=UB.cageHit){UB.cageHit=0;ubHitHero(avg(S3)*3,'phys','赤芒')}}});
egOn('sec',()=>{const r=EGM;if(r&&(r.k==='uba'||r.k==='ubp')&&!r.end&&r.spawned&&!liveMon().length&&!r.done){spawnT=99}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&EGM&&(EGM.k==='uba'||EGM.k==='ubp')){log('<span class="dim">切到后台，已退出暗渊（不做离线结算）</span>');ubFail(EGM,'离开')}});
EG_BOOT.push(()=>{if(typeof sleepOn==='function'){const f=sleepOn;window.sleepOn=sleepOn=function(){if(EGM&&(EGM.k==='uba'||EGM.k==='ubp'))ubFail(EGM,'息屏');return f.apply(this,arguments)}}});
function ubCan(){const U=egUb();return{p:U.k.t>0&&U.k.h>0&&U.k.d>0,a:U.o.horn>0&&U.o.eye>0&&U.o.brain>0}}
function ubPrison(){if(ubLock())return toast(ubLock());if(EGM)return toast('请先离开当前挑战');const U=egUb();if(!ubCan().p)return toast('需要三把不同的魂钥');U.k.t--;U.k.h--;U.k.d--;U.pr++;const g=pick(Object.keys(UB.GATE));closeM&&closeM();save();return ubRun('ubp',{g})}
function ubAbyss(){if(ubLock())return toast(ubLock());if(EGM)return toast('请先离开当前挑战');const U=egUb();if(!ubCan().a)return toast('需要三枚魂核');U.o.horn--;U.o.eye--;U.o.brain--;U.runs++;closeM&&closeM();save();return ubRun('uba',{})}
function ubEnd(run,res){run.done=1;run.end=1;UB.lock=0;run.res=res;MON=[];setTimeout(()=>{if(EGM===run)egLeave(1);ubResult(run)},window.__NOUI?0:1000);save();egRefresh()}
function ubFail(run,why){if(run.end)return;const U=egUb();let back='';
 if(run.k==='uba'){const c=pick(Object.keys(UB.CORES));U.o[c]++;back=`返还 ${UB.CORES[c].n}×1`}else{const k=pick(['t','h','d']);U.k[k]++;back=`返还 ${UB.KEYS[k].n}×1`}
 log(`<b style="color:#f84">${run.name} 失败（${why}），${back}</b>`);toast(run.name+' 失败');ubEnd(run,{fail:1,why,back})}
function ubPrisonDone(run){const U=egUb(),c=UB.GATE[run.g].c;U.o[c]++;U.prw++;log(`<b class="quest">击败守魂者，获得 ${UB.CORES[c].n}</b>`);ubEnd(run,{core:c,ex:[]})}
function ubLoot(run){const ex=[],U=egUb();const id=ubPickItem();const it=ubMake(id);ex.push(it);if(rnd()<0.25)ex.push(ubMake('shard'));
 const m=run.souls[0]||{lv:EG_MJ.ml(UB.L),boss:1,actboss:1,fl:'boss',key:'eldron'};for(let i=0;i<2;i++){const mm=Object.assign({},m,{actboss:1,boss:1,fl:'boss',uber:false,ubS:null});for(const x of rollTC(mm))ex.push(x)}
 const rn={k:'rune',r:Math.min(32,19+Math.floor(Math.pow(rnd(),2)*14))};ex.push(rn);
 for(const x of ex){if(x.ub){U.got[x.ub]=1;if(x.ub==='torch'){const q=typeof ancQual==='function'?ancQual(x):0;U.best.torch=Math.max(U.best.torch||0,Math.round((q||0)*100))}}addBag(x)}
 if(typeof tgFire==='function'&&!window.__NOUI)tgFire(ex);return ex}
function ubAbyssDone(run){const U=egUb();U.wins++;const ex=ubLoot(run);log(`<b class="quest">暗渊三魂已灭！用时 ${egTime(run.t)}</b>`);egStat('uber');ubEnd(run,{ok:1,ex})}
// 秘境 50 层以上通关 0.5% 灭魂碎片
if(typeof egMjDone==='function'){const f=egMjDone;egMjDone=function(run){const r=f.apply(this,arguments);try{if(run.L>=50&&rnd()<0.005){const it=ubMake('shard');addBag(it);egUb().got.shard=1;log('<b style="color:#c9f">秘境深处遗落了一枚灭魂碎片！</b>')}}catch(e){}return r}}
function ubResult(run){const r=run.res;if(!r||window.__NOUI)return;
 modal(`<div class="mtitle">${run.name} ${r.fail?'失败':'完成'}</div><div class="gp"><div>用时 ${egTime(run.t)} · 阵亡 ${run.deaths}</div>${r.fail?`<div class="bad">${r.why} · ${r.back}</div>`:r.core?`<div>获得 ${UB.CORES[r.core].n}</div>`:`<div class="grid">${(r.ex||[]).map(it=>cell(it,'')).join('')}</div>`}
 <div class="btns c ubbtn"><button class="btn" onclick="closeM()">返回</button><button class="btn gold" onclick="closeM();TAB='eg';EGT='uber';render()">暗渊</button></div></div>`)}
// ---------- 页面 ----------
function ubIcon(ic,on){return`<i class="ubi ${on?'':'off'}" style="background-image:url(assets/icon2/abyss/${ic}.webp)"></i>`}
function ubPage(){const U=egUb(),c=ubCan(),in_=EGM&&(EGM.k==='uba'||EGM.k==='ubp');const lk=ubLock();
 return`<div class="gp ubp"><h3>☠ ${UB.n} <span class="r dim">今日魂钥 ${U.day.d===egDay()?U.day.n:0}/${UB.dayCap}</span></h3>
 <div class="ubkeys">魂钥 ${Object.entries(UB.KEYS).map(([k,K])=>`<span>${ubIcon(K.ic,U.k[k])}${K.n.slice(0,2)}×${U.k[k]}</span>`).join('')}</div>
 <div class="dim">恐惧：地狱第一、二章首领 6% · 憎恨：深渊虚隙 ≥10 层守望者 10% · 毁灭：秘境 ≥20 层秘境之主 8%（每 10 层 +2%，上限 16%）· 周誓重匣保底 1 把</div>
 <div class="ubcores">${Object.entries(UB.CORES).map(([k,C])=>`<div class="ubc ${U.o[k]?'on':''}">${ubIcon(C.ic,U.o[k])}<small>${C.n}×${U.o[k]}</small></div>`).join('')}</div>
 <div class="btns c ubbtn">${in_?`<button class="btn" onclick="ubFail(EGM,'主动离开')">放弃挑战</button>`:`<button class="btn ${c.p&&!lk?'gold':''}" ${c.p&&!lk&&!EGM?'':'disabled'} onclick="ubPrison()">开启魂狱</button><button class="btn ${c.a&&!lk?'gold':''}" ${c.a&&!lk&&!EGM?'':'disabled'} onclick="ubAbyss()">开启暗渊</button>`}</div>
 <div class="dim">三把不同魂钥开启魂狱（随机守魂者：${Object.values(UB.GATE).map(g=>g.n).join(' / ')}，掉对应魂核）；三枚魂核开启暗渊。阵亡 ${UB.maxDie} 次或 3 分钟超时失败，返还 1 件。推荐：秘境 30 层能稳定通关。</div></div>
 <div class="gp ubsoul"><h3>三魂</h3>${Object.entries(UB.SOUL).map(([k,s])=>`<div class="ubsr"><img src="assets/boss/${k}.webp" alt=""><div><b class="bossn">${s.t}·${s.n}</b><div class="dim">${s.mech}</div></div></div>`).join('')}
 <div class="dim">每只陨落后其余两只伤害 +20%。</div></div>
 <div class="gp ubtab"><h3>暗渊掉落 <span class="r dim">必掉 1 件终极 + 2 次首领掉落 + 20 号以上符文</span></h3>${Object.entries(UB.ITEMS).map(([k,D])=>`<div class="row"><span>${ubIcon(D.ic,1)}<b style="color:${D.myth?'#b05cff':'#c8a060'}">${D.n}</b>${D.myth?' <small class="ubmy">神话</small>':''}</span><span>${U.got[k]?'<b class="ok">✔</b>':'<span class="dim">—</span>'} <small class="dim">${D.w}</small></span></div>`).join('')}
 <div class="row"><span>战绩</span><b>魂狱 ${U.prw}/${U.pr} · 暗渊 ${U.wins}/${U.runs} · 最好火炬 ${U.best.torch||0}%</b></div></div>`}
egPage({k:'uber',n:UB.n,hide:1,parent:'rift',lock:ubLock,render:ubPage,intro:'地狱与秘境的尽头，三道魂魄在暗渊中等待。'});
{const P=EG_PAGES.find(p=>p.k==='rift');if(P){const f=P.render;P.render=function(){const lk=ubLock(),U=egUb();return`<div class="gp mjent ubent"><div class="row"><span>☠ <b>${UB.n}</b><br><small class="dim">${lk?'🔒 '+lk:`魂钥 ${U.k.t}/${U.k.h}/${U.k.d} · 魂核 ${U.o.horn}/${U.o.eye}/${U.o.brain}`}</small></span><button class="btn sm ${lk?'':'gold'}" onclick="EGT='uber';render()">${lk?'查看':'进入'}</button></div></div>`+f.apply(this,arguments)}}}
