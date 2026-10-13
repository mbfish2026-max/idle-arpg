'use strict';
// ===================================================================================
// loot.js — 拾取管线：自动回收（品质/部位/符文阈值/保护规则）→ 图鉴 → 自动存仓 → 背包（按格，堆叠）
// 回收得金币（按卖价）或「残骸精华」材料（炼金匣重铸、商店兑换）。设置存于角色存档 S.rcy / S.ast。
// 优先级：自动回收 > 自动存仓 > 背包（界面中有说明）。依赖 stash.js。
// ===================================================================================
const MATS={ess:{n:'残骸精华',c:'#b98cff',d:'回收装备得到的魔力残渣。用途：炼金匣「精华重铸」，商店「精华兑换」宝石/护身符/符文。'}};
const RCY_Q=[[0,'破旧'],[1,'普通'],[2,'超强'],[3,'魔法'],[4,'稀有'],[6,'套装'],[5,'暗金']];
const RCY_C=[['wand','魔杖'],['dagger','匕首'],['sword','剑'],['axe','斧'],['mace','锤'],['staff','法杖'],['bow','弓'],['xbow','弩'],['polearm','长柄'],['spear','矛'],['jav','标枪'],['throw','投掷'],
 ['shield','盾'],['head','缩颅'],['helm','头盔'],['armor','铠甲'],['gloves','手套'],['boots','鞋'],['belt','腰带'],['ring','戒指'],['amulet','护符'],['charm','护身符'],['jewel','珠宝'],['gem','宝石'],['rune','符文']];
function rcyDefault(){const s=S.sell||{};const c={};for(const[k]of RCY_C)c[k]=!['gem','rune','charm','jewel'].includes(k)?1:0;
 return{on:(s[0]||s[1])?1:0,q:{0:s[0]?1:0,1:s[1]?1:0,2:s[2]?1:0,3:0,4:0,5:0,6:0},c,runeMax:0,keepSock:1,keepElite:1,keepNew:1,keepSkill:1,mode:'gold'}}
function ensureLoot(){if(!S)return;if(!S.rcy)S.rcy=rcyDefault();if(!S.codex){S.codex={};const all=[...S.bag,...Object.values(S.eq),...(S.pst||[]).flat()];for(const it of all)if(it&&!it.k&&(it.q===5||it.q===6))S.codex[it.name]=1}}
const _lt_load=load;load=function(){_lt_load();ensureLoot()};
// ---------- 材料 ----------
function matCount(id){return S.bag.filter(x=>x.k==='mat'&&x.id===id).reduce((a,x)=>a+(x.n||0),0)}
function addMat(id,n){if(n<=0)return;pushInto(S.bag,{uid:S.uid++,k:'mat',id,n})}
function takeMat(id,n){if(matCount(id)<n)return false;for(const x of S.bag)if(x.k==='mat'&&x.id===id){const t=Math.min(x.n,n);x.n-=t;n-=t;if(!n)break}mergeMats(S.bag);return true}
const _lt_name=itemName;itemName=function(it){return it&&it.k==='mat'?(MATS[it.id]?MATS[it.id].n:'未知材料'):_lt_name(it)};
const _lt_color=itemColor;itemColor=function(it){return it.k==='mat'?MATS[it.id].c:_lt_color(it)};
const _lt_price=sellPrice;sellPrice=function(it){return it.k==='mat'?2:_lt_price(it)};
const _lt_show=showItem;showItem=function(uid){const f=findItem(uid);if(f&&f.it.k==='mat'){const it=f.it;const n=f.stash?groupCount(f):matCount(it.id);
 return modal(`<div class="ipanel"><div class="ih">${itemIcon(it)}<div><b style="color:${itemColor(it)}">${itemName(it)}</b><div class="dim">材料 · 数量 ${n}</div></div></div><div class="sec"><div>${MATS[it.id].d}</div></div>
 <div class="btns c">${f.stash?`<button class="btn gold" onclick="fromStash(${uid})">取回背包</button>`:`<button class="btn" onclick="depositUid(${uid},'p')">存入个人仓库</button><button class="btn" onclick="depositUid(${uid},'s')">存入共享仓库</button>`}<button class="btn" onclick="closeM()">关闭</button></div></div>`)}
 return _lt_show(uid)};
// 出售：堆叠一次卖 1；材料一次卖 1
const _lt_sell=sell;sell=function(uid){const f=findItem(uid);if(f&&f.it.k==='mat'&&!f.stash){S.gold+=2;f.it.n--;mergeMats(S.bag);closeM();render();return}return _lt_sell(uid)};
// ---------- 回收规则 ----------
function rcyCat(it){if(it.k==='gem')return'gem';if(it.k==='rune')return'rune';const b=BASEM[it.b];if(b.s==='weapon')return b.cat;if(b.s==='shield')return b.cat==='head'?'head':'shield';return b.s}
function hasNecroSkill(it){const m=it.m||{};return Object.keys(m).some(k=>k.startsWith('sk_')||/^t\dsk$/.test(k)||k==='allsk')}
function shouldRecycle(it,isNew){const r=S.rcy;if(!r||!r.on||it.k==='mat')return false;const c=rcyCat(it);if(!r.c[c])return false;
 if(it.k==='rune')return it.r+1<=(r.runeMax||0);if(it.k==='gem')return true;
 if(it.rw!=null||!r.q[it.q])return false;const b=BASEM[it.b];
 if(r.keepSock&&it.sock&&it.q<=2)return false;if(r.keepElite&&b.tier>=2)return false;if(r.keepNew&&isNew)return false;if(r.keepSkill&&hasNecroSkill(it))return false;return true}
function essOf(it){if(it.k==='gem')return it.lv+1;if(it.k==='rune')return it.r+1;return[1,1,2,3,6,15,12,5][it.q]||1}
function doRecycle(it){const r=S.rcy;STATS.rcy++;if(r.mode==='ess'){const e=essOf(it);addMat('ess',e);STATS.rcyE+=e}else{const g=Math.min(35000,sellPrice(it));S.gold+=g;STATS.rcyG+=g}}
addBag=function(it){if(it.k==='rune')S.found[it.r]=1;ensureLoot();if(it.k==='mat'){pushInto(S.bag,it);return true}
 const isNew=!it.k&&(it.q===5||it.q===6)&&!S.codex[it.name];
 if(shouldRecycle(it,isNew)){doRecycle(it);return false}
 if(!S.rcy&&!it.k&&!it.sock&&S.sell[it.q]&&it.q<3){S.gold+=sellPrice(it);return false}
 if(isNew)S.codex[it.name]=1;
 if(autoStash(it))return true;
 if(!bagFits(it)){S.gold+=sellPrice(it);log('背包已满，自动出售 '+itemName(it));return false}S.bag.push(it);return true};
function recycleNow(){ensureLoot();const was=S.rcy.on;S.rcy.on=1;const b0=STATS.rcy,g0=STATS.rcyG,e0=STATS.rcyE;const keep=[];
 for(const it of S.bag){if(shouldRecycle(it,false))doRecycle(it);else keep.push(it)}
 // doRecycle 可能新增精华材料到 S.bag，需要保留
 const mats=S.bag.filter(x=>x.k==='mat'&&!keep.includes(x));S.bag=keep.concat(mats);mergeMats(S.bag);S.rcy.on=was;calc();
 const n=STATS.rcy-b0;if(!window.__NOUI){toast(n?`回收 ${n} 件：+${STATS.rcyG-g0}金币 +${STATS.rcyE-e0}精华`:'没有符合回收规则的物品');render()}return n}
// ---------- 离线结算附加回收/存仓统计 ----------
const _lt_off=offline;offline=function(){const a=STATS.rcy,g=STATS.rcyG,e=STATS.rcyE,s=STATS.ast;_lt_off();const n=STATS.rcy-a,m=STATS.ast-s;if(window.__NOUI||(!n&&!m))return;
 const box=document.querySelector('#modal .gp .grid');for(const d of document.querySelectorAll('#modal .gp>.dim'))if(n&&d.textContent.startsWith('自动出售'))d.remove();if(box)box.insertAdjacentHTML('beforebegin',`<div class="g">自动回收 ${n} 件：+${STATS.rcyG-g} 金币，+${STATS.rcyE-e} 残骸精华${m?`；自动存仓 ${m} 件`:''}</div>`)};
// ---------- 炼金匣：精华重铸 ----------
const ESS_REROLL=20;
const _lt_rec=cubeRecipes;cubeRecipes=function(){const rec=_lt_rec();if(matCount('ess')>=ESS_REROLL)for(const it of S.bag)if(!it.k&&(it.q===3||it.q===4))rec.push([`${ESS_REROLL}×残骸精华 + ${itemName(it)} → 精华重铸（同品质，物品等级不变）`,`essReroll(${it.uid})`]);return rec};
function essReroll(uid){const i=S.bag.findIndex(x=>x.uid===uid);if(i<0||!takeMat('ess',ESS_REROLL))return false;const o=S.bag[i];const j=S.bag.findIndex(x=>x.uid===uid);const n=genItem(o.il,{base:BASEM[o.b],q:o.q});n.uid=o.uid;S.bag[j]=n;if(!window.__NOUI){showItem(uid);render()}return true}
// ---------- 设置面板 ----------
function rcyUI(){ensureLoot();const r=S.rcy,a=S.ast;const ck=(on,fn,t)=>`<button class="btn xs ${on?'on':''}" onclick="${fn};rcyUI()">${t}</button>`;
 modal(`<div class="mtitle">自动回收 / 自动存仓</div><div class="gp rcy">
 <div class="row"><b>自动回收</b>${ck(r.on,'S.rcy.on^=1',r.on?'已开启':'已关闭')}</div>
 <div class="dim">优先级：<b>自动回收 ＞ 自动存仓 ＞ 放入背包</b>。被保护的物品不会回收。离线结算同样生效。</div>
 <h4>品质</h4><div class="btns">${RCY_Q.map(([q,n])=>ck(r.q[q],`S.rcy.q[${q}]^=1`,n)).join('')}</div>
 <h4>部位 / 类型</h4><div class="btns">${RCY_C.map(([k,n])=>ck(r.c[k],`S.rcy.c['${k}']^=1`,n)).join('')}</div>
 <div class="row"><span>符文：回收 <b>${r.runeMax||0}号</b> 及以下（0=不回收）</span><span><button class="btn xs" onclick="S.rcy.runeMax=Math.max(0,(S.rcy.runeMax||0)-1);rcyUI()">－</button><button class="btn xs" onclick="S.rcy.runeMax=Math.min(33,(S.rcy.runeMax||0)+1);rcyUI()">＋</button></span></div>
 <h4>保护（例外）</h4><div class="btns">${ck(r.keepSock,'S.rcy.keepSock^=1','带凹槽白/超强底材')}${ck(r.keepElite,'S.rcy.keepElite^=1','精英底材')}${ck(r.keepNew,'S.rcy.keepNew^=1','未收录图鉴的暗金/套装')}${ck(r.keepSkill,'S.rcy.keepSkill^=1','带本职业技能')}</div>
 <h4>回收所得</h4><div class="btns">${ck(r.mode==='gold',"S.rcy.mode='gold'",'金币（按卖价）')}${ck(r.mode==='ess',"S.rcy.mode='ess'",'残骸精华')}</div>
 <div class="dim">残骸精华：炼金匣 ${ESS_REROLL} 个重铸魔法/稀有物品；商店「精华兑换」。当前 ${matCount('ess')} 个。</div>
 <hr><div class="row"><b>自动存仓</b>${ck(a.on,'S.ast.on^=1',a.on?'已开启':'已关闭')}</div>
 <div class="btns">${Object.entries(AST_T).map(([k,n])=>ck(a.t[k],`S.ast.t['${k}']^=1`,n)).join('')}</div>
 <div class="btns">目标：${ck(a.dest!=='s',"S.ast.dest='p'",'个人仓库')}${ck(a.dest==='s',"S.ast.dest='s'",'共享仓库')}</div>
 <div class="dim">拾取时先与仓库中同类堆叠，仓库满则留在背包并提示。</div>
 <div class="btns c"><button class="btn gold" onclick="closeM();recycleNow()">按规则一键回收背包</button><button class="btn" onclick="closeM();render()">完成</button></div></div>`)}
// 背包页按钮；角色页旧“自动出售”入口改为提示
const _lt_rb=renderBag;renderBag=function(){_lt_rb();ensureLoot();const r=document.querySelector('#panel .gp h3 .r');const gps=[...document.querySelectorAll('#panel .gp')];const bg=gps.find(g=>/背包 \d+/.test(g.querySelector('h3')?.textContent||''));
 const sp=bg&&bg.querySelector('h3 .r');if(sp)sp.insertAdjacentHTML('beforeend',`<button class="btn xs" onclick="rcyUI()">自动回收${S.rcy.on?'✓':''}</button><button class="btn xs gold" onclick="recycleNow()">一键回收</button>`)};
const _lt_hero=renderHero;renderHero=function(){_lt_hero();const d=[...document.querySelectorAll('#panel .dim')].find(e=>/自动出售/.test(e.textContent));if(d){const nx=d.nextElementSibling;if(nx&&nx.classList.contains('btns'))nx.remove();d.innerHTML='自动出售已升级为「自动回收」：背包页 → 自动回收 设置'}};
