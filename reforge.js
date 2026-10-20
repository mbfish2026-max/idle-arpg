'use strict';
// 淬锋精铸（v2）：商店「淬锋」页签选装备 → 弹窗主界面（左大装备框按品质发光 / 右词条列表，点一条锁定 / 下方「淬锋」大按钮）
// → 锁定词条 1 秒一次性锻光特效 → 3 张新词条依次翻牌 + 原属性，共四选一（满值金边）。候选存 it.rf.off，关掉不丢、不重复扣费。
// 适用：魔法/稀有（任意一条）、上古/至臻（只限额外词缀 it.ax）。首次锁定后只能重铸该条；每件最多 10 次（旧存档 n 原样保留，上限改 10）。
// 候选：该底材合法单键词缀、不与其他属性重复；魔法/稀有按原 alvl 规则；上古排除技能等级、区间上移；至臻取满。
// 花费：第 n 次 金币 5000×n²（第 10 次 50 万）+ 残骸精华 5×n。存档 it.rf={k,n,off}。
// 特效全部为一次性 CSS 动画（无常驻循环）；音效 AUDIO.reforge(charge/reveal/pick/perfect)，不存在时退回 AUDIO.playLootTier。
const RF={MAX:10,gold:n=>5000*(n+1)*(n+1),ess:n=>5*(n+1),tab:'eq',busy:0};
function rfKind(it){if(!it||it.k||it.rw!=null)return null;if(it.anc&&it.ax&&Object.keys(it.ax).length)return'anc';if(it.q===3||it.q===4)return'rare';return null}
function rfLines(it){const k=rfKind(it);if(!k)return[];if(k==='anc')return Object.keys(it.ax).filter(x=>x in it.m);return Object.keys(it.m).filter(x=>x!=='sockp'&&typeof it.m[x]==='number')}
function rfTxt(k,v){return(MODT[k]||k+' {v}').replace('{v}',v).replace('+-','-')}
function rfCands(it,key){const b=BASEM[it.b],kind=rfKind(it),al=kind==='anc'?99:alvlOf(it.il||it.ilvl||S.lvl||1,b.q||1);const out=[],seen=new Set([key]);
 for(let i=0;i<120&&out.length<3;i++){const used=new Set();const a=rollAff(rnd()<0.5?PREFIX:SUFFIX,b,al,used);if(!a||!a.m)continue;const ks=Object.keys(a.m);if(ks.length!==1)continue;const k=ks[0];
  if(seen.has(k)||(k in it.m)||k==='sockp'||!Array.isArray(a.m[k]))continue;if(kind==='anc'&&typeof ANC_XSKIP!=='undefined'&&ANC_XSKIP.test(k))continue;
  let[lo,hi]=a.m[k];if(kind==='anc'){[lo,hi]=ancShift(lo,hi)}const v=kind==='anc'&&it.anc===2?hi:R(lo,hi);seen.add(k);out.push([k,v,lo,hi])}
 return out}
function rfCanPay(n){return S.gold>=RF.gold(n)&&matCount('ess')>=RF.ess(n)}
function rfSnd(k){try{const A=window.AUDIO;if(A&&A.reforge){A.reforge(k);return}if(A&&A.playLootTier){const t={perfect:'ancient',pick:'rare'}[k];if(t)A.playLootTier(t)}}catch(e){}}
function rfSt(it){if(!it.rf)it.rf={k:null,n:0,off:null};return it.rf}
// 锁定一条（不扣费）
function rfLock(uid,key){const f=findItem(uid),it=f&&f.it;if(!it||!rfKind(it))return false;const R0=rfSt(it);if(R0.off)return false;
 if(R0.k&&R0.k!==key){toast('已锁定其他词缀，只能重铸那一条');return false}if(!rfLines(it).includes(key))return false;R0.k=key;save&&save();if(!window.__NOUI)rfMain(uid);return true}
// 付费并生成候选（纯逻辑，UI 另做动画）
function rfRoll(uid,key){const f=findItem(uid),it=f&&f.it;if(!it||f.stash)return toast('物品需在身上或背包中');if(!rfKind(it))return false;const R0=rfSt(it);key=key||R0.k;
 if(R0.off)return false;if(R0.n>=RF.MAX)return toast('已达淬锋上限');if(!key)return toast('先点选一条词缀');if(R0.k&&key!==R0.k)return toast('只能重铸已锁定的词缀');if(!rfLines(it).includes(key))return false;
 if(!rfCanPay(R0.n))return toast(`需要 ${fmt(RF.gold(R0.n))} 金币 + ${RF.ess(R0.n)} 残骸精华`);
 const c=rfCands(it,key);if(!c.length)return toast('该部位没有可用的候选词缀');S.gold-=RF.gold(R0.n);takeMat('ess',RF.ess(R0.n));R0.k=key;R0.n++;R0.off=c;save&&save();return true}
function rfPick(uid,i){const f=findItem(uid),it=f&&f.it;if(!it||!it.rf||!it.rf.off)return false;const R0=it.rf;let res=null;
 if(i>=0){const[k,v,lo,hi]=R0.off[i]||[];if(!k)return false;const old=R0.k;delete it.m[old];it.m[k]=v;if(it.ax){delete it.ax[old];it.ax[k]=[lo,hi]}R0.k=k;res=[k,v,lo,hi];log(`淬锋精铸：<b>${rfTxt(k,v)}</b>`)}
 R0.off=null;if(typeof calc==='function')calc();save&&save();if(!window.__NOUI){rfSnd('pick');rfDone(uid,res)}return true}
// ---------- 界面 ----------
function rfEligible(where){const L=where==='eq'?SLOTS.map(s=>S.eq[s]).filter(Boolean):S.bag;return L.filter(it=>rfKind(it))}
function rfPage(){const L=rfEligible(RF.tab);const tb=[['eq','身上'],['bag','背包']].map(([k,n])=>`<button class="${RF.tab===k?'on':''}" onclick="RF.tab='${k}';render()">${n} ${rfEligible(k).length}</button>`).join('');
 return`<div class="gp rfshop"><h3>⚒ 淬锋精铸 <span class="r dim">精华 ${matCount('ess')}</span></h3><div class="dim">在锻炉中重铸装备上的一条词缀：魔法/稀有任选一条，上古/至臻只限额外词缀。首次锁定后只能重铸这一条，每件最多 ${RF.MAX} 次。</div>
 <div class="stabs rftabs">${tb}</div>${L.length?`<div class="grid">${L.map(it=>{const r=it.rf||{n:0};return`<div class="shc">${cell(it,`rfMain(${it.uid})`)}<small class="rfn ${r.off?'pend':''}">${r.off?'待选择':(r.n||0)+'/'+RF.MAX}</small></div>`}).join('')}</div>`:'<div class="dim rfempty">没有可淬锋的装备（需魔法/稀有，或带额外词缀的上古/至臻）</div>'}</div>`}
{const f=renderShop;renderShop=function(){const r=f.apply(this,arguments);try{const P=$('#panel'),t=P.querySelector('.stabs');if(t&&!t.querySelector('.rft'))t.insertAdjacentHTML('beforeend',`<button class="rft ${SHT==='rf'?'on':''}" onclick="SHT='rf';render()">重铸</button>`);
 if(SHT==='rf'){t.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.classList.contains('rft')));let n=t.nextElementSibling;while(n){const x=n.nextElementSibling;n.remove();n=x}t.insertAdjacentHTML('afterend',rfPage())}}catch(e){console.warn(e)}return r}}
function rfFrame(it){return`<div class="rfbox" style="--c:${itemColor(it)}"><div class="rfic">${itemIcon(it)}</div><b style="color:${itemColor(it)}">${itemName(it)}</b><small class="dim">${it.anc===2?'至臻':it.anc?'上古':it.q===4?'稀有':'魔法'}</small></div>`}
function rfHead(it){const n=(it.rf||{}).n||0;return`<div class="mtitle">⚒ 淬锋精铸 <small class="dim">${n}/${RF.MAX}</small></div>`}
function rfMain(uid){const f=findItem(uid),it=f&&f.it;if(!it||!rfKind(it))return;const R0=it.rf||{k:null,n:0,off:null};if(R0.off)return rfCards(uid,0);const n=R0.n||0,L=rfLines(it);
 const btn=n>=RF.MAX?`<button class="btn rfgo" disabled>已达上限 ${n}/${RF.MAX}</button>`:`<button class="btn gold rfgo" ${R0.k&&rfCanPay(n)?'':'disabled'} onclick="rfGo(${uid})"><b>重 铸</b><small>${fmt(RF.gold(n))}◈ + ${RF.ess(n)} 精华 · ${n+1}/${RF.MAX}</small></button>`;
 modal(rfHead(it)+`<div class="rfm">${rfFrame(it)}<div class="rflist"><div class="dim">${R0.k?'已锁定：':'点一条词缀锁定：'}</div>${L.map(k=>`<div class="rfl ${R0.k===k?'lk':''} ${R0.k&&R0.k!==k?'off':''}" data-k="${k}" onclick="rfLock(${uid},'${k}')">${rfTxt(k,it.m[k])}${R0.k===k?' <i>🔒</i>':''}</div>`).join('')}</div></div>
 <div class="rfcost ${rfCanPay(n)?'':'bad'}">持有 ${fmt(S.gold)}◈ · 精华 ${matCount('ess')}</div><div class="btns c rfbtns">${btn}<button class="btn" onclick="closeM()">关闭</button></div>`)}
function rfGo(uid){if(RF.busy)return;if(!rfRoll(uid))return;const el=document.querySelector('#modal .rfl.lk');RF.busy=1;rfSnd('charge');
 if(el){el.classList.add('charge');el.insertAdjacentHTML('beforeend','<span class="rfspark"></span>')}const bx=document.querySelector('#modal .rfbox');if(bx)bx.classList.add('forge');
 const g=document.querySelector('#modal .rfgo');if(g)g.disabled=true;setTimeout(()=>{RF.busy=0;rfCards(uid,1)},window.__NOUI?0:1000)}
function rfCards(uid,anim){const f=findItem(uid),it=f&&f.it;if(!it||!it.rf||!it.rf.off)return;const R0=it.rf,cur=R0.k;
 const card=(i,k,v,lo,hi,lab)=>{const full=hi!=null&&v>=hi;return`<div class="rfcard ${anim?'flip':''} ${full?'full':''} ${i<0?'keep':''}" style="animation-delay:${anim?(i<0?0:(i+1)*0.28):0}s" onclick="rfPick(${uid},${i})"><small>${lab}</small><b>${rfTxt(k,v)}</b>${hi!=null?`<span class="dim">${lo}-${hi}${full?' · 满值':''}</span>`:'<span class="dim">原属性</span>'}</div>`};
 modal(`<div class="rfst">`+rfHead(it)+`<div class="rfh2">${rfFrame(it)}</div><div class="dim c">四选一：点一张卡确认（关闭界面候选保留）</div><div class="rfcards">${card(-1,cur,it.m[cur],null,null,'保留原属性')}${R0.off.map((o,i)=>card(i,o[0],o[1],o[2],o[3],'新词条 '+(i+1))).join('')}</div></div>`);
 if(anim&&!window.__NOUI)R0.off.forEach((o,i)=>setTimeout(()=>{rfSnd(o[1]>=o[3]?'perfect':'reveal')},(i+1)*280))}
function rfDone(uid,res){const f=findItem(uid),it=f&&f.it;if(!it)return;const n=it.rf.n;
 modal(`<div class="rfst">`+rfHead(it)+`<div class="rfh2">${rfFrame(it)}</div><div class="rfres ${res&&res[1]>=res[3]?'full':''}">${res?`淬锋完成：<b>${rfTxt(res[0],res[1])}</b>`:'保留原属性'}</div>
 <div class="btns c rfbtns">${n<RF.MAX?`<button class="btn gold" onclick="rfMain(${uid})">继续淬锋</button>`:''}<button class="btn" onclick="closeM();SHT='rf';TAB='shop';render()">换装备</button><button class="btn" onclick="closeM();render()">关闭</button></div></div>`)}
// 详情：淬锋次数 + 锁定词缀
{const f=showItem;showItem=function(uid){const r=f.apply(this,arguments);try{const fi=findItem(uid),it=fi&&fi.it;const p=document.querySelector('#modal .ipanel');if(it&&it.rf&&it.rf.n&&p&&!p.querySelector('.rftag')){
 const h=`<div class="sec rftag">淬锋 ${it.rf.n}/${RF.MAX} · 锁定：<b>${rfTxt(it.rf.k,it.m[it.rf.k])}</b></div>`;const b=p.querySelector('.btns');if(b)b.insertAdjacentHTML('beforebegin',h);else p.insertAdjacentHTML('beforeend',h)}}catch(e){console.warn(e)}return r}}
