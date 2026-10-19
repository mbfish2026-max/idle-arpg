'use strict';
// 淬锋精铸：炼金匣配方，单条词缀重铸（loot_plan P7）。运行时包装 cubeRecipes / showItem。
// 适用：魔法/稀有（任意一条词缀）、上古/至臻（只限额外词缀 it.ax）。首次选定一条后锁定，只能重铸该条；每件最多 3 次（淬锋 n/3）。
// 每次付费后给 3 个候选 + 原属性四选一（候选存在 it.rf.off，关掉弹窗不丢）。候选来自该底材合法词缀池、单键、不与其他属性重复；
// 魔法/稀有按原词缀规则（含技能等级词缀，按原 alvl 门槛）；上古额外条排除技能等级、区间上移，至臻取满。
// 花费：金币 5000×(n+1)² + 残骸精华 10×(n+1)。存档：it.rf={k:锁定键,n:次数,off:[[k,v,lo,hi],...]|null}，旧物品无字段。
const RF={MAX:3,gold:n=>5000*(n+1)*(n+1),ess:n=>10*(n+1)};
function rfKind(it){if(!it||it.k||it.rw!=null)return null;if(it.anc&&it.ax&&Object.keys(it.ax).length)return'anc';if(it.q===3||it.q===4)return'rare';return null}
function rfLines(it){const k=rfKind(it);if(!k)return[];if(k==='anc')return Object.keys(it.ax).filter(x=>x in it.m);return Object.keys(it.m).filter(x=>x!=='sockp'&&typeof it.m[x]==='number')}
function rfTxt(k,v){return(MODT[k]||k+' {v}').replace('{v}',v).replace('+-','-')}
function rfCands(it,key){const b=BASEM[it.b],kind=rfKind(it),al=kind==='anc'?99:alvlOf(it.il||it.ilvl||S.lvl||1,b.q||1);const out=[],seen=new Set([key]);
 for(let i=0;i<120&&out.length<3;i++){const used=new Set();const a=rollAff(rnd()<0.5?PREFIX:SUFFIX,b,al,used);if(!a||!a.m)continue;const ks=Object.keys(a.m);if(ks.length!==1)continue;const k=ks[0];
  if(seen.has(k)||(k in it.m)||k==='sockp'||!Array.isArray(a.m[k]))continue;if(kind==='anc'&&typeof ANC_XSKIP!=='undefined'&&ANC_XSKIP.test(k))continue;
  let[lo,hi]=a.m[k];if(kind==='anc'){[lo,hi]=ancShift(lo,hi)}const v=kind==='anc'&&it.anc===2?hi:R(lo,hi);seen.add(k);out.push([k,v,lo,hi])}
 return out}
function rfCanPay(n){return S.gold>=RF.gold(n)&&matCount('ess')>=RF.ess(n)}
function rfRoll(uid,key){const f=findItem(uid),it=f&&f.it;if(!it||f.stash)return toast('物品需在背包中');if(!rfKind(it))return false;it.rf=it.rf||{k:null,n:0,off:null};const R0=it.rf;
 if(R0.off)return rfUI(uid);if(R0.n>=RF.MAX)return toast('已达淬锋上限');if(R0.k&&key!==R0.k)return toast('只能重铸已选定的词缀');if(!rfLines(it).includes(key))return false;
 if(!rfCanPay(R0.n))return toast(`需要 ${fmt(RF.gold(R0.n))} 金币 + ${RF.ess(R0.n)} 残骸精华`);
 const c=rfCands(it,key);if(!c.length)return toast('该部位没有可用的候选词缀');S.gold-=RF.gold(R0.n);takeMat('ess',RF.ess(R0.n));R0.k=key;R0.n++;R0.off=c;save&&save();if(!window.__NOUI)rfUI(uid);return true}
function rfPick(uid,i){const f=findItem(uid),it=f&&f.it;if(!it||!it.rf||!it.rf.off)return false;const R0=it.rf;
 if(i>=0){const[k,v,lo,hi]=R0.off[i]||[];if(!k)return false;const old=R0.k;delete it.m[old];it.m[k]=v;if(it.ax){delete it.ax[old];it.ax[k]=[lo,hi]}R0.k=k;log(`淬锋精铸：${rfTxt(old,'?').replace('?','')}→ <b>${rfTxt(k,v)}</b>`)}
 R0.off=null;if(typeof calc==='function')calc();save&&save();if(!window.__NOUI){closeM();showItem(uid);render()}return true}
function rfUI(uid){const f=findItem(uid),it=f&&f.it;if(!it)return;const R0=it.rf||{k:null,n:0,off:null},kind=rfKind(it);const n=R0.n;
 const head=`<div class="mtitle">淬锋精铸 <small class="dim">${n}/${RF.MAX}</small></div><div class="rfh"><b style="color:${itemColor(it)}">${itemName(it)}</b></div>`;
 if(R0.off){const cur=R0.k;modal(head+`<div class="gp rf"><div class="dim">四选一（关闭弹窗不会丢失候选）</div>
  <div class="rfo keep" onclick="rfPick(${uid},-1)"><small>保留原属性</small><b>${rfTxt(cur,it.m[cur])}</b></div>
  ${R0.off.map((o,i)=>`<div class="rfo" onclick="rfPick(${uid},${i})"><small>候选 ${i+1}</small><b>${rfTxt(o[0],o[1])}</b><span class="dim">${o[2]}-${o[3]}</span></div>`).join('')}</div>`);return}
 const L=rfLines(it);const cost=`<div class="rfc">花费：<b class="${S.gold>=RF.gold(n)?'':'bad'}">${fmt(RF.gold(n))} 金币</b> + <b class="${matCount('ess')>=RF.ess(n)?'':'bad'}">${RF.ess(n)} 残骸精华</b><span class="dim">（拥有 ${matCount('ess')}）</span></div>`;
 modal(head+`<div class="gp rf">${n>=RF.MAX?'<div class="bad">已达淬锋上限</div>':cost}<div class="dim">${R0.k?'已锁定词缀，只能重铸这一条：':'选择要重铸的一条词缀（选定后锁定）：'}${kind==='anc'?'（上古只限额外词缀）':''}</div>
 ${L.map(k=>{const lk=R0.k&&R0.k!==k,dis=lk||n>=RF.MAX||!rfCanPay(n);return`<button class="btn rfl ${R0.k===k?'gold':''}" ${dis?'disabled':''} onclick="rfRoll(${uid},'${k}')">${rfTxt(k,it.m[k])}${lk?' 🔒':''}</button>`}).join('')}
 <div class="btns c rfb"><button class="btn" onclick="closeM()">关闭</button></div></div>`)}
// 炼金匣配方入口
{const f=cubeRecipes;cubeRecipes=function(){const rec=f.apply(this,arguments);try{for(const it of S.bag)if(rfKind(it)){const r=it.rf||{n:0};rec.push([`淬锋精铸：${itemName(it)}（${r.off?'待选择':(r.n||0)+'/'+RF.MAX}）`,`rfUI(${it.uid})`])}}catch(e){console.warn(e)}return rec}}
// 详情：淬锋次数 + 锁定词缀
{const f=showItem;showItem=function(uid){const r=f.apply(this,arguments);try{const fi=findItem(uid),it=fi&&fi.it;const p=document.querySelector('#modal .ipanel');if(it&&it.rf&&it.rf.n&&p&&!p.querySelector('.rftag')){
 const h=`<div class="sec rftag">淬锋 ${it.rf.n}/${RF.MAX} · 锁定：<b>${rfTxt(it.rf.k,it.m[it.rf.k])}</b></div>`;const b=p.querySelector('.btns');if(b)b.insertAdjacentHTML('beforebegin',h);else p.insertAdjacentHTML('beforeend',h)}}catch(e){console.warn(e)}return r}}
