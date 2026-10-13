'use strict';
// ===== 1. 悬赏令：每日 5 条（猎杀/清剿/讨首，随机已解锁区域）+ 每周 4 条誓约；完成发金币/符文/经验，日常全清得「暮誓宝匣」，周常每条得「夜誓重匣」 =====
function egZonePool(){const d=S.diff,out=[];for(let a=0;a<ACTS.length;a++){if(!actOpen(a,d))continue;const un=a===S.act?S.unl:(S.UN[pkey(a,d)]||0);
  ACTS[a].zones.forEach((z,i)=>{if(i<=un&&z.ml<=S.lvl+3)out.push({d,a,i,z})})}return out.length?out:[{d,a:S.act,i:S.zone,z:zoneData()}]}
function egBossOf(z){if(z.boss)return z.boss;if(z.bosses)return z.bosses[z.bosses.length-1];return null}
function egGenDaily(){const pool=egZonePool(),L=[],used=new Set();
 for(let n=0;n<EG_BOUNTY.dailyN&&n<40;n++){let c=null;for(let t=0;t<12;t++){const x=pick(pool);if(!used.has(x.a+'_'+x.i)||t===11){c=x;break}}used.add(c.a+'_'+c.i);
  const bk=egBossOf(c.z);const r=rnd();const type=bk&&r<0.3?'boss':r<0.6?'clear':'kill';
  const b={t:type,d:c.d,a:c.a,i:c.i,zn:c.z.n,ml:c.z.ml,p:0,goal:type==='kill'?R(4,8)*5:1,done:0};if(type==='boss'){b.bk=bk;b.bn=BOSSES[bk].n}L.push(b)}return L}
function egBountyReset(){const B=EG().bounty,day=egDay(),wk=egWeek();
 if(B.day!==day){B.day=day;B.d=egGenDaily();B.dall=0}
 if(B.week!==wk){B.week=wk;B.w=EG_BOUNTY.weekly.map(x=>({t:x.t,p:0,goal:x.goal,done:0}))}}
function egBountyDesc(b){const T=EG_BOUNTY.types[b.t];const zn=`${DIFFS[b.d].n}·${ACTS[b.a].n.split('·')[1].trim()}·${b.zn}`;return b.t==='kill'?T.d(zn,b.goal):b.t==='boss'?T.d(zn,b.bn):T.d(zn)}
function egBountyRw(b){const ml=b.ml;return{gold:Math.round((150+ml*30)*(b.t==='kill'?1:1.4)),xp:Math.round((xpNeed(S.lvl+1)-xpNeed(S.lvl))*(S.lvl<99?0.04:0)),rune:b.t!=='kill'}}
function egBountyFinish(b){b.done=1;const r=egBountyRw(b);S.gold+=r.gold;if(r.xp)gainXp(r.xp);let rn='';if(r.rune){const it=rollRune(b.ml);addBag(it);rn='、'+itemName(it)}
 egStat('bounty');log(`<b class="quest">悬赏完成【${EG_BOUNTY.types[b.t].n}·${b.zn}】◈${fmt(r.gold)}${r.xp?' 经验+'+fmt(r.xp):''}${rn}</b>`);toast('悬赏完成');
 const B=EG().bounty;if(!B.dall&&B.d.every(x=>x.done)){B.dall=1;B.caches++;log(`<b class="quest">今日悬赏全部完成！获得 ${EG_BOUNTY.cache.ic}${EG_BOUNTY.cache.n}</b>`)}egRefresh()}
function egWeekProg(t,n=1){const B=EG().bounty;if(!B.w)return;for(const w of B.w)if(w.t===t&&!w.done){w.p=Math.min(w.goal,w.p+n);if(w.p>=w.goal){w.done=1;B.wcaches++;const W=EG_BOUNTY.weekly.find(x=>x.t===t);log(`<b class="quest">周誓【${W.n}】达成！获得 ${EG_BOUNTY.wcache.ic}${EG_BOUNTY.wcache.n}</b>`);toast('周誓达成');egRefresh()}}}
egOn('kill',(m,c)=>{const B=EG().bounty;if(!B.d)return;egWeekProg('wkill');if(m.boss)egWeekProg('wboss');if(c.mode)return;
 for(const b of B.d){if(b.done||b.d!==c.d||b.a!==c.a||b.i!==c.z)continue;if(b.t==='kill'){b.p++;if(b.p>=b.goal)egBountyFinish(b)}else if(b.t==='boss'&&m.key===b.bk){b.p=1;egBountyFinish(b)}}});
egOn('clear',c=>{const B=EG().bounty;if(!B.d)return;egWeekProg('wclear');for(const b of B.d)if(!b.done&&b.t==='clear'&&b.d===c.d&&b.a===c.a&&b.i===c.z){b.p=1;egBountyFinish(b)}});
// 宝匣：装备(魔法以上，必出 1 件稀有+)、符文、宝石、金币
function egOpenCache(w){const B=EG().bounty;const k=w?'wcaches':'caches';if(B[k]<=0)return;B[k]--;const ml=Math.min(99,egMaxMl()+(w?3:1)),got=[];
 const n=w?R(4,5):R(2,3);for(let i=0;i<n;i++)got.push(genItem(ml,{q:rnd()<0.7?3:4}));
 got.push(genItem(ml,{q:4}));if(w&&rnd()<0.35)got.push(genItem(ml,{q:5}));
 for(let i=0;i<(w?2:1);i++)got.push(rollRune(ml+(w?9:3)));got.push(rollGem(ml));
 const g=Math.round((w?2500:800)+ml*(w?60:25));S.gold+=g;for(const it of got)addBag(it);egStat('cache');
 modal(`<div class="mtitle">${w?EG_BOUNTY.wcache.ic+EG_BOUNTY.wcache.n:EG_BOUNTY.cache.ic+EG_BOUNTY.cache.n}</div><div class="gp"><div>金币 +${fmt(g)}</div><div class="grid">${got.map(it=>cell(it,'')).join('')}</div><div class="btns c"><button class="btn gold" onclick="closeM();egRefresh()">收下</button></div></div>`)}
// 自动悬赏：前往第一条未完成的日常，原地挂机；全部完成后回到原位置并恢复自动推进
function egGoBounty(b){if(EGM)egLeave(1);const B=EG().bounty;if(!B.ret)B.ret={d:S.diff,a:S.act,z:S.zone,auto:S.auto};if(b.d!==S.diff||b.a!==S.act)goAct(b.a,b.d,1);S.unl=Math.max(S.unl,b.i);S.auto=0;goZone(b.i)}
function egBountyGo(i){const b=EG().bounty.d[i];if(!b||b.done)return;egGoBounty(b);TAB='fight';render()}
function egBountyReturn(){const B=EG().bounty,r=B.ret;B.ret=null;if(!r)return;if(r.d!==S.diff||r.a!==S.act)goAct(r.a,r.d,1);S.auto=r.auto;goZone(Math.min(r.z,S.unl));log('<span class="dim">悬赏告一段落，返回原处继续</span>')}
egOn('sec',()=>{egBountyReset();const B=EG().bounty;if(!B.auto||EGM||egBountyLock())return;
 const here=B.d.find(b=>!b.done&&b.d===S.diff&&b.a===S.act&&b.i===S.zone);if(here){if(S.auto)S.auto=0;return}
 const nx=B.d.find(b=>!b.done&&actOpen(b.a,b.d));if(nx){egGoBounty(nx);log(`<b class="quest">自动悬赏：前往 ${nx.zn}</b>`)}else if(B.ret)egBountyReturn()});
function egBountyLock(){return S.actU&&(S.actU[0]||0)>=1||S.diffU>0?null:'完成普通难度第一章后，营地告示板开放悬赏令'}
function egBountyPage(){egBountyReset();const B=EG().bounty;const typeC={kill:'⚔',clear:'🔥',boss:'☠'};
 const rows=B.d.map((b,i)=>{const r=egBountyRw(b);return`<div class="egb ${b.done?'ok':''}"><div><b>${typeC[b.t]} ${EG_BOUNTY.types[b.t].n}</b> <span class="dim">mlvl ${b.ml}</span><div class="dim">${egBountyDesc(b)}</div><div class="egrw">◈${fmt(r.gold)}${r.xp?' · 经验'+fmt(r.xp):''}${r.rune?' · 符文':''}</div></div>
  <div class="egbr">${b.done?'✔':`<span>${b.p}/${b.goal}</span><button class="btn xs" onclick="egBountyGo(${i})">前往</button>`}</div></div>`}).join('');
 const wk=B.w.map(w=>{const W=EG_BOUNTY.weekly.find(x=>x.t===w.t);return`<div class="egb ${w.done?'ok':''}"><div><b>${W.n}</b><div class="dim">${W.d(w.goal)}</div>${egPbar(w.p,w.goal)}</div><div class="egbr">${w.done?'✔':w.p+'/'+w.goal}</div></div>`}).join('');
 return`<div class="gp"><h3>每日悬赏 <span class="r dim">${B.day} · 次日刷新</span></h3>${rows}
 <div class="btns"><button class="btn sm ${B.auto?'on':''}" onclick="EG().bounty.auto^=1;egRefresh()">自动悬赏挂机</button>${B.ret?'<button class="btn sm" onclick="egBountyReturn();egRefresh()">返回原处</button>':''}</div>
 <div class="dim">全部完成额外获得 ${EG_BOUNTY.cache.ic}${EG_BOUNTY.cache.n}。自动悬赏：依次前往未完成区域原地挂机，完成后回到原处并恢复自动推进。</div></div>
 <div class="gp"><h3>每周誓约 <span class="r dim">每周一刷新</span></h3>${wk}<div class="dim">每条誓约达成获得 ${EG_BOUNTY.wcache.ic}${EG_BOUNTY.wcache.n}</div></div>
 <div class="gp"><h3>宝匣</h3><div class="row"><span>${EG_BOUNTY.cache.ic} ${EG_BOUNTY.cache.n} ×${B.caches}</span><button class="btn sm gold" ${B.caches?'':'disabled'} onclick="egOpenCache(0)">开启</button></div>
 <div class="row"><span>${EG_BOUNTY.wcache.ic} ${EG_BOUNTY.wcache.n} ×${B.wcaches}</span><button class="btn sm gold" ${B.wcaches?'':'disabled'} onclick="egOpenCache(1)">开启</button></div><div class="dim">宝匣按已解锁的最高区域等级生成：必出稀有装备、符文、宝石与金币；重匣有几率出暗金。</div></div>`}
function egPbar(v,m,cls=''){return`<div class="egpb ${cls}"><i style="width:${Math.min(100,v/m*100)}%"></i></div>`}
egPage({k:'bounty',n:'悬赏',lock:egBountyLock,render:egBountyPage,dot:()=>{const B=EG().bounty;return B.caches+B.wcaches>0}});
