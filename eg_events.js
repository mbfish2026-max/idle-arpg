'use strict';
// ===== 8. 新精英/首领词缀 · 血潮（定时事件，血烬→血誓宝箱）· 世界首领（定时降临） =====
Object.assign(ELITE_AFF,EG_AFF);
const _eg_mkMon=mkMon;mkMon=function(key,lv,flag){const m=_eg_mkMon(key,lv,flag);
 if(BOSSES[key]&&!BOSSES[key].eg&&S.diff>=1&&rnd()<0.5){const k=pick(EG_BOSSAFF);EG_AFF[k].f(m);m.aff=(m.aff||[]).concat(EG_AFF[k].n)}
 if(egTideOn()&&!EGM&&!m.egNoTide){m.max=m.hp=Math.round(m.max*EG_TIDE.hp);m.dmg=m.dmg.map(x=>x*EG_TIDE.dmg);m.exp*=EG_TIDE.xp;m.egTide=1}
 return m};
// 词缀效果
const _eg_hitMon3=hitMon;hitMon=function(m,d,src,fxc){if(m&&m.egWard&&m.egWardOn>GT){if(src==='hero')floatNum(m.uid,'护盾','#9cf');return 0}
 const hp0=m?m.hp:0;const r=_eg_hitMon3(m,d,src,fxc);
 if(m&&m.egThorn&&src==='hero'&&r>0&&ST){const v=Math.min(Math.round(r*m.egThorn),Math.round(ST.life*0.05));if(v>0){H.life-=v;floatHero('荆棘-'+v,'#c8a')}}
 if(m&&m.egMirror===1&&m.hp>0&&m.hp<m.max*0.5&&liveMon().length<8){m.egMirror=2;const c=Object.assign({},m,{uid:mUid++,egMirror:2,cur:null,pois:null,aff:null,n:'镜像·'+m.n.split('·').pop(),boss:false,qb:0,fl:'champ'});c.max=Math.round(m.max*0.5);c.hp=Math.round(m.hp*0.5);c.exp=m.exp*0.3;c.res=Object.assign({},m.res);MON.push(c);log(`<span class="uniq">${m.n}</span> 分裂出镜像！`)}
 return r};
egOn('tick',dt=>{for(const m of MON){if(m.hp<=0)continue;if(m.egRegen&&m.hp<m.max)m.hp=Math.min(m.max,m.hp+m.max*m.egRegen*dt*(m.pois&&m.pois.left>0?0.3:1));
 if(m.egWard){m.egWardT-=dt;if(m.egWardT<=0){m.egWardT=10;m.egWardOn=GT+2}}
 if(m.egFrz&&m.stun<=0){m.egFrzT-=dt;if(m.egFrzT<=0){m.egFrzT=8+rnd()*3;if(ST&&!ST.cbr){H.castT+=1.0;floatHero('冰封','#8cf')}}}}});
egOn('kill',m=>{if(m.egBomb&&ST){const avg=(m.dmg[0]+m.dmg[1])/2;aoe(m,avg*1.6,'fire');fx('boom',[])}});
const _eg_monCard=monCard;monCard=function(m){let h=_eg_monCard(m);if(m.egWard&&m.egWardOn>GT)h=h.replace('class="mc ','class="mc egward ');if(m.egTide)h=h.replace('class="mc ','class="mc egtide ');return h};

// ---------- 血潮 ----------
function egTideUnlocked(){return S&&S.actU&&((S.actU[0]||0)>=1||S.diffU>0)}
function egTidePhase(){const c=EG().clock%EG_TIDE.cyc;return c}
function egTideOn(){return !!(S&&egTideUnlocked()&&egTidePhase()<EG_TIDE.dur)}
let EG_TIDEW=null;
egOn('sec',()=>{const on=egTideOn();if(EG_TIDEW===null)EG_TIDEW=on;if(on!==EG_TIDEW){EG_TIDEW=on;const ev=EG().ev;
  if(on){log(`<b style="color:#ff4040">${EG_TIDE.n}涌动！怪物更强、经验更多，击杀可获得 ${EG_TIDE.ember.ic}${EG_TIDE.ember.n}（${egTime(EG_TIDE.dur)}）</b>`);toast(EG_TIDE.n+'降临');egStat('tide')}
  else{if(ev.ember>0)log(`<span class="dim">${EG_TIDE.n}退去，未使用的 ${ev.ember} 枚${EG_TIDE.ember.n}化为尘埃</span>`);ev.ember=0}}
 if(on&&EG().ev.autoChest)while(EG().ev.ember>=EG_TIDE.chest.cost)egTideChest(1)});
egOn('kill',(m,c)=>{if(!m.egTide||c.mode)return;const E=EG_TIDE.ember,ev=EG().ev;const n=m.boss?E.boss:m.fl==='uniq'?E.uniq:m.fl==='champ'?E.champ:E.n0;ev.ember+=n;ev.emberT=(ev.emberT||0)+n});
function egTideChest(quiet){const ev=EG().ev,C=EG_TIDE.chest;if(ev.ember<C.cost)return toast(`需要 ${C.cost} 枚${EG_TIDE.ember.n}`);ev.ember-=C.cost;const ml=Math.min(99,zoneData().ml+3);
 const got=[egLpApply(genItem(ml,{q:rnd()<0.15?5:4}),2),genItem(ml,{mf:ST.mf+200})];if(rnd()<0.5)got.push(rollRune(ml+3));for(const it of got)addBag(it);egStat('tchest');
 log(`<b style="color:#ff5050">${C.n}开启：</b>${got.map(it=>`<span style="color:${itemColor(it)}">${itemName(it)}</span>`).join('、')}`);if(!quiet)egRefresh()}
EG_BANNER.push(()=>{if(!S||!egTideUnlocked()||EGM)return'';const ph=egTidePhase(),ev=EG().ev;if(ph<EG_TIDE.dur)return`<div class="egline tide"><span>🩸 ${EG_TIDE.n} ${egTime(EG_TIDE.dur-ph)}</span>${egPbar(EG_TIDE.dur-ph,EG_TIDE.dur,'tide')}<span>${EG_TIDE.ember.ic}${ev.ember}</span></div>`;
 const left=EG_TIDE.cyc-ph;return left<300?`<div class="egline tide"><span class="dim">🩸 ${EG_TIDE.n}将在 ${egTime(left)} 后涌动</span></div>`:''});

// ---------- 世界首领 ----------
function egWbPhase(){return(EG().clock+EG_WB.cyc-EG_WB.off)%EG_WB.cyc}// 0..dur 为降临窗口；cyc-warn..cyc 为预告
function egWbUnlocked(){return S&&egNormalDone()}
function egWbStart(){if(EGM)return toast('正在其他挑战中');const ph=egWbPhase();if(ph>=EG_WB.dur)return toast('世界首领尚未降临');const ev=EG().ev,id=Math.floor((EG().clock+EG_WB.cyc-EG_WB.off)/EG_WB.cyc);if(ev.wbDone===id)return toast('本次已挑战');ev.wbDone=id;
 const ml=Math.min(99,Math.max(S.lvl,egMaxMl())+3),end=EG().clock+(EG_WB.dur-ph);
 const run={k:'wboss',name:EG_WB.n,bg:'bg_act4',boss:null,
  start(){},spawn(){if(this.boss){if(this.boss.hp<=0){egLeave(1);return}if(!MON.includes(this.boss)){this.boss.cur=null;MON.push(this.boss);log(`${EG_WB.n} 仍在等待你的归来（剩余 ${Math.ceil(this.boss.hp/this.boss.max*100)}%）`)}return}const m=mkMon('wb_mogos',ml);m.egNoTide=1;const k=pick(EG_BOSSAFF);EG_AFF[k].f(m);m.aff=[EG_AFF[k].n];m.n=EG_WB.ic+m.n;m.max=m.hp=Math.round(m.max*(1+S.diff*0.5));m.egWb=1;this.boss=m;MON.push(m);log(`<b class="bossn">${EG_WB.n}</b> [${m.aff.join('/')}] 从灰烬中站起！`)},
  onKill(m){if(!m.egWb)return;egStat('wboss');const got=[egLpApply(genItem(ml,{q:5}),3),egLpApply(genItem(ml,{q:5}),3),genItem(ml,{q:4}),rollRune(ml+9),rollRune(ml+6)];for(const it of got)addBag(it);const g=5000+ml*200;S.gold+=g;EG().rift.keys+=2;
   log(`<b class="quest">${EG_WB.n} 倒下了！获得 ◈${fmt(g)}、🔮钥石×2、${got.map(it=>`<span style="color:${itemColor(it)}">${itemName(it)}</span>`).join('、')}</b>`);toast('世界首领已击败')},
  onDie(){},
  wave(){return`剩余 ${egTime(end-EG().clock)}`},quest(){return`【世界首领】击败 ${EG_WB.n}（限时 ${egTime(end-EG().clock)}）`},
  top(){const b=this.boss;return`<div class="egline wb"><span>${EG_WB.ic} ⏳${egTime(end-EG().clock)}</span>${b?egPbar(b.hp,b.max,'time'):''}<span>${b?Math.ceil(b.hp/b.max*100)+'%':''}</span></div>`},end};
 egEnter(run)}
egOn('sec',()=>{if(!egWbUnlocked())return;const ph=egWbPhase(),ev=EG().ev;const id=Math.floor((EG().clock+EG_WB.cyc-EG_WB.off)/EG_WB.cyc);
 if(EGM&&EGM.k==='wboss'&&EG().clock>=EGM.end){log(`<span class="dim">${EG_WB.n} 沉入灰烬，下次再战</span>`);egLeave(1);return}
 if(ph>EG_WB.cyc-EG_WB.warn&&ev.wbWarn!==id+1){ev.wbWarn=id+1;log(`<b style="color:#ffb040">${EG_WB.n} 将在 2 分钟后降临暮土！</b>`);toast('世界首领即将降临')}
 if(ph<EG_WB.dur-30&&!EGM&&ev.wbAuto!==0&&ev.wbDone!==id){log('<b style="color:#ffb040">自动前往世界首领战场</b>');egWbStart()}});
EG_BANNER.push(()=>{if(!S||!egWbUnlocked()||EGM)return'';const ph=egWbPhase();if(ph<EG_WB.dur&&EG().ev.wbDone!==Math.floor((EG().clock+EG_WB.cyc-EG_WB.off)/EG_WB.cyc))return`<div class="egline wb"><span>${EG_WB.ic} 世界首领降临中</span><button class="btn xs gold" onclick="egWbStart()">迎战</button></div>`;
 if(ph>EG_WB.cyc-EG_WB.warn)return`<div class="egline wb"><span>${EG_WB.ic} ${EG_WB.n} ${egTime(EG_WB.cyc-ph)} 后降临</span></div>`;return''});
function egEvLock(){return egTideUnlocked()?null:'完成普通难度第一章后开放血潮与世界首领事件'}
function egEvPage(){const ev=EG().ev,ph=egTidePhase(),on=ph<EG_TIDE.dur,wp=egWbPhase();
 const aff=Object.values(EG_AFF).map(a=>a.n).join('、');
 return`<div class="gp"><h3>🩸 ${EG_TIDE.n} <span class="r ${on?'bad':'dim'}">${on?'涌动中 '+egTime(EG_TIDE.dur-ph):'下次 '+egTime(EG_TIDE.cyc-ph)}</span></h3>
 <div class="dim">每 ${EG_TIDE.cyc/60} 分钟（游戏时间）涌动 ${EG_TIDE.dur/60} 分钟：普通区域怪物生命 ×${EG_TIDE.hp}、伤害 ×${EG_TIDE.dmg}、经验 ×${EG_TIDE.xp}；击杀掉落 ${EG_TIDE.ember.ic}${EG_TIDE.ember.n}（普通 1 / 精英 4 / 金色 8 / 首领 15），潮退时清空。</div>
 <div class="row"><span>${EG_TIDE.ember.ic}${EG_TIDE.ember.n}</span><b>${ev.ember}</b></div>
 <div class="btns"><button class="btn gold" ${ev.ember>=EG_TIDE.chest.cost?'':'disabled'} onclick="egTideChest()">开启${EG_TIDE.chest.n}（${EG_TIDE.chest.cost}）</button><button class="btn sm ${ev.autoChest?'on':''}" onclick="EG().ev.autoChest^=1;egRefresh()">自动开箱</button></div><div class="dim">宝箱：必出稀有（15% 暗金，威能几率×2）+ 1 件随机装备，50% 符文。</div></div>
 <div class="gp"><h3>${EG_WB.ic} 世界首领 <span class="r dim">${egWbUnlocked()?(wp<EG_WB.dur?'降临中':'下次 '+egTime(EG_WB.cyc-wp)):'🔒 通关普通后'}</span></h3><div class="dim">${EG_WB.n}每 ${EG_WB.cyc/3600} 小时（游戏时间）降临，持续 ${EG_WB.dur/60} 分钟，提前 2 分钟预告。随机携带 1 条首领词缀。击败必得 2 件暗金（威能几率×3）、稀有、高阶符文与 2 枚钥石。</div>
 <div class="btns"><button class="btn sm ${ev.wbAuto!==0?'on':''}" onclick="EG().ev.wbAuto=EG().ev.wbAuto===0?1:0;egRefresh()">降临时自动迎战</button>${egWbUnlocked()&&wp<EG_WB.dur?'<button class="btn sm gold" onclick="egWbStart()">迎战</button>':''}</div></div>
 <div class="gp"><h3>新精英词缀</h3><div class="dim">${aff}。噩梦起章节首领 50% 携带 1 条（${EG_BOSSAFF.map(k=>EG_AFF[k].n).join('/')}）。</div>
 ${Object.values(EG_AFF).map(a=>`<div class="row"><span>${a.n}</span><span class="dim">${{血肉再生:'每秒回复 3% 生命（中毒时 ×0.3）',死亡爆裂:'死亡时火焰爆炸波及全体',镜像:'生命低于 50% 时分裂出镜像',骨盾守护:'每 10 秒 2 秒无敌护盾',荆棘:'受英雄伤害时反弹 6%（单次≤5%生命）',冰狱:'每 8-11 秒冻结英雄 1 秒（不可冻结免疫）'}[a.n]}</span></div>`).join('')}</div>`}
egPage({k:'event',n:'事件',lock:egEvLock,render:egEvPage,dot:()=>egTideOn()||egWbUnlocked()&&egWbPhase()<EG_WB.dur});
