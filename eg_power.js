'use strict';
// ===== 4. 传说威能 / 威能熔炼匣：部分暗金与「传说」装备带改变技能的特效；可提取到熔炼匣，每类 1 个长期生效 =====
function egLpCat(it){const s=BASEM[it.b]&&BASEM[it.b].s;return s==='weapon'?'w':(s==='amulet'||s==='ring')?'j':'a'}
function egLpRoll(it){const c=egLpCat(it);const ks=Object.keys(EG_LP).filter(k=>EG_LP[k].c===c);return pick(ks)}
// 掉落时附加：仅对怪物/宝匣/虚隙掉落（rollTC 结果），不影响商店等其他 genItem 调用
function egLpApply(it,boost=1){if(!it||it.k||it.lp)return it;
 if(it.q===5&&rnd()<EG_LEG.urate*boost)it.lp=egLpRoll(it);
 else if(it.q===4&&rnd()<EG_LEG.rate*boost){it.lp=egLpRoll(it);it.leg=1;it.name=EG_LEG.n+'·'+it.name;const ks=Object.keys(it.m);if(ks.length){const k=pick(ks);if(typeof it.m[k]==='number')it.m[k]=Math.ceil(it.m[k]*1.3)}}
 if(it.lp)egStat('lpfind');return it}
const _eg_rollTC=rollTC;rollTC=function(m){const out=_eg_rollTC(m);const b=EGM&&EGM.k==='rift'?1+EGM.T*0.05:1;for(const it of out)egLpApply(it,b);return out};
const _eg_itemColor=itemColor;itemColor=function(it){if(it&&it.leg)return EG_LEG.c;return _eg_itemColor(it)};
const _eg_power=power;power=function(it){const p=_eg_power(it);return it&&it.lp?p+150:p};
// 生效威能集合：已装备物品 + 熔炼匣
let EG_LPS=new Set();
function egLpRefresh(){const s=new Set();if(S&&S.eq)for(const k in S.eq){const it=S.eq[k];if(it&&it.lp)s.add(it.lp)}const cu=EG().lp.cube;for(const c in cu)if(cu[c])s.add(cu[c]);EG_LPS=s}
egOn('calc',()=>egLpRefresh());
const egLp=k=>EG_LPS.has(k);
// 技能数值修正（也会体现在技能页说明中）
const EG_CURSES=['ad','dv','wk','im','tr','cf','lt','at','de','lr'];
const _eg_SV=SV;SV=function(id,L){const v=_eg_SV(id,L);if(!v)return v;
 if(id==='te'&&egLp('te_storm')&&v.n){v.n=Math.round(v.n*1.5);v.txt+='（骨牙风暴：数量+50%）'}
 if(id==='pn'&&egLp('pn_venom')&&v.dmg){v.dmg=v.dmg.map(x=>Math.round(x*1.6));v.txt+='（蚀骨余毒 +60%）'}
 if(id==='rs'&&egLp('legion')){v.n+=2;v.txt+='（亡者之潮 +2）'}
 if(id==='rm'&&egLp('legion')){v.n+=1;v.txt+='（亡者之潮 +1）'}
 if(EG_CURSES.includes(id)&&egLp('curse_wide')&&v.n&&id!=='at'){v.n+=3;v.txt+='（广域凋零 +3 目标）'}
 if(id==='ba'&&egLp('ba_surge')){v.abs=Math.round(v.abs*1.6);v.txt+='（骨甲回涌 +60%）'}
 if(['cg','bg','ig','fg'].includes(id)&&egLp('golem_undying')&&v.life){v.life*=2;v.dmg=v.dmg.map(x=>Math.round(x*1.5));v.txt+='（不朽泥偶）'}
 return v};
// 施法上下文
let EG_CAST=null,EG_SPLIT=0;
const _eg_acCast=acCast;acCast=function(id,ms){EG_CAST=id;const c0=CORPSE.length,top=CORPSE[CORPSE.length-1];let r;try{r=_eg_acCast(id,ms)}finally{EG_CAST=null}
 if(id==='bx'&&r&&egLp('bx_echo')&&rnd()<0.35){const L=liveMon();if(L.length){const v=SV('bx',slvl('bx'));EG_CAST='bx';try{hitMon(target(L),{magic:R(v.dmg[0],v.dmg[1])},'hero','#cfe')}finally{EG_CAST=null}fx('spirit',[target(L)])}}
 if(id==='ce'&&r&&egLp('ce_ember')&&CORPSE.length<c0&&top&&rnd()<0.3)CORPSE.push(top);
 return r};
const _eg_hitMon2=hitMon;hitMon=function(m,d,src,fxc){
 if(src==='hero'&&EG_CAST==='ce'&&egLp('ce_ember')){const d2={};for(const k in d)d2[k]=d[k]*1.3;d=d2}
 const r=_eg_hitMon2(m,d,src,fxc);
 if(src==='hero'&&EG_CAST==='bs'&&!EG_SPLIT&&egLp('bs_split')){EG_SPLIT=1;try{const o=liveMon().filter(x=>x!==m);for(let i=0;i<2&&o.length;i++){const x=o.splice(Math.floor(rnd()*o.length),1)[0];const d2={};for(const k in d)d2[k]=d[k]*0.4;_eg_hitMon2(x,d2,'hero','#ffe0a0')}}finally{EG_SPLIT=0}}
 return r};
// 骨仆死亡爆炸、骨铠破碎回血
let EG_ABS0=0;
const _eg_step2=step;step=function(dt){const sk=egLp('skel_burst')?ALLY.filter(a=>a.kind==='skel'&&a.hp>0):null;const ab=H.abs;_eg_step2(dt);
 if(sk&&ST){let n=0;for(const a of sk)if(a.hp<=0&&n<3){n++;const ms=liveMon();for(const m of ms)_eg_hitMon2(m,{fire:a.max*1.5},'hero','#ff8a30');if(ms.length)fx('boom',ms)}}
 if(ab>0&&H.abs<=0&&egLp('ba_surge')&&ST){H.life=Math.min(ST.life,H.life+ST.life*0.15);floatHero('骨甲回涌','#ffd090')}};
egOn('kill',(m)=>{if(egLp('soul_feast')&&ST){H.life=Math.min(ST.life,H.life+ST.life*0.02);H.mana=Math.min(ST.mana,H.mana+ST.mana*0.03)}
 if(egLp('curse_spread')&&m.cur&&m.cur.until>GT){const c=m.cur,o=liveMon().filter(x=>x!==m&&!(x.cur&&x.cur.until>GT)&&!(c.id==='tr'&&x.boss));for(const x of o.slice(0,2))x.cur=Object.assign({},c,{until:GT+Math.max(4,c.until-GT)})}});
// 物品详情：显示威能 + 提取按钮
const _eg_showItem=showItem;showItem=function(uid){_eg_showItem(uid);const f=findItem(uid);if(!f||!f.it||!f.it.lp)return;const L=EG_LP[f.it.lp];const p=document.querySelector('#modal .ipanel')||document.querySelector('#modal .mb');if(!p)return;
 const box=p.querySelector('.btns.c');const h=`<div class="eglp egsep">✸ 传说威能【${typeof egLpName==='function'?egLpName(f.it.lp):L.n}】<div>${L.d}</div><div class="dim">${EG_LPC[L.c]}类 · ${EG().lp.arch[f.it.lp]?'已收录于'+EG_LEG.cube:'可提取到'+EG_LEG.cube}</div></div>`;if(box)box.insertAdjacentHTML('beforebegin',h);else p.insertAdjacentHTML('beforeend',h);
 if(box&&f.i!=null)box.insertAdjacentHTML('afterbegin',`<button class="btn gold" onclick="egLpExtract(${uid})">提取威能</button>`)};
function egLpExtract(uid){const f=findItem(uid);if(!f||f.i==null||!f.it.lp)return toast('只能提取背包中的物品');const it=f.it,cost=EG_LEG.cost(it.il||1);const gi=S.bag.findIndex(x=>x.k==='gem');
 if(gi<0)return toast('需要 1 颗任意宝石');if(S.gold<cost)return toast('需要 '+fmt(cost)+' 金币');
 if(typeof confirm==='function'&&!window.__NOUI&&!EG_LPNOCONF&&!confirm(`提取【${EG_LP[it.lp].n}】将摧毁 ${itemName(it)}，消耗 1 颗宝石与 ${fmt(cost)} 金币。确定？`))return;
 S.gold-=cost;S.bag.splice(S.bag.indexOf(it),1);S.bag.splice(S.bag.findIndex(x=>x.k==='gem'),1);const A=EG().lp;A.arch[it.lp]=1;const c=EG_LP[it.lp].c;if(!A.cube[c])A.cube[c]=it.lp;egStat('lpx');
 log(`<b style="color:${EG_LEG.c}">${EG_LEG.cube}收录威能【${EG_LP[it.lp].n}】</b>`);toast('威能已收录');calc();closeM();render()}
let EG_LPNOCONF=0;
function egLpSet(c,k){const A=EG().lp;if(k&&!A.arch[k])return;A.cube[c]=k||null;calc();egRefresh()}
function egLpPage(){const A=EG().lp;egLpRefresh();const eqp=Object.keys(S.eq).map(k=>S.eq[k]).filter(it=>it&&it.lp);
 const slots=Object.keys(EG_LPC).map(c=>{const cur=A.cube[c];const opts=Object.keys(EG_LP).filter(k=>EG_LP[k].c===c&&(typeof egLpOk!=='function'||egLpOk(k)||A.arch[k]));
  return`<div class="egslot"><b>${EG_LPC[c]}槽</b>：${cur?`<span class="eglp">【${EG_LP[cur].n}】</span><div class="dim">${EG_LP[cur].d}</div>`:'<span class="dim">空</span>'}
  <div class="btns">${opts.map(k=>`<button class="btn xs ${cur===k?'on':''}" ${A.arch[k]?'':'disabled'} onclick="egLpSet('${c}','${cur===k?'':k}')">${A.arch[k]?'':'🔒'}${(typeof egLpName==='function'?egLpName(k):EG_LP[k].n)}</button>`).join('')}</div></div>`}).join('');
 const bagL=S.bag.filter(it=>it.lp);
 return`<div class="gp"><h3>${EG_LEG.cube} <span class="r dim">已收录 ${Object.keys(A.arch).length}/${Object.keys(EG_LP).length}</span></h3>${slots}<div class="dim">提取：在物品详情点「提取威能」（摧毁物品，消耗 1 颗任意宝石 + 金币）。三个槽各可装 1 个已收录威能，与装备上的威能同时生效（同名不叠加）。</div></div>
 <div class="gp"><h3>当前生效 ${EG_LPS.size}</h3>${[...EG_LPS].map(k=>`<div class="row"><span class="eglp">【${EG_LP[k].n}】</span><span class="dim">${EG_LP[k].d}</span></div>`).join('')||'<div class="dim">无</div>'}
 ${eqp.length?`<div class="dim">来自装备：${eqp.map(it=>itemName(it)).join('、')}</div>`:''}</div>
 <div class="gp"><h3>背包中的威能装备</h3>${bagL.length?`<div class="grid">${bagL.map(it=>cell(it,`showItem(${it.uid})`)).join('')}</div>`:'<div class="dim">暂无。暗金装备 25% 带威能；稀有装备 3% 升格为「传说」品质（橙红色）并带威能；深渊虚隙层数越高几率越大。</div>'}</div>
 <div class="gp"><h3>威能图录</h3>${Object.keys(EG_LP).map(k=>`<div class="row"><span class="${A.arch[k]?'eglp':'dim'}">${A.arch[k]?'✔':'○'} ${(typeof egLpName==='function'?egLpName(k):EG_LP[k].n)} <small class="dim">${EG_LPC[EG_LP[k].c]}</small></span><span class="dim" style="text-align:right">${EG_LP[k].d}</span></div>`).join('')}</div>`}
egPage({k:'power',n:'威能',render:egLpPage,dot:()=>S.bag.some(it=>it.lp&&!EG().lp.arch[it.lp])});
