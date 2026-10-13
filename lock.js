'use strict';
// ===================================================================================
// lock.js — 装备锁定：item.lk=1（缺省未锁；随物品对象 JSON 序列化，本地/云端存档整包 JSON 不丢字段）
// 锁定物品：不可出售/一键出售/自动回收；不会被炼金匣等配方当材料消耗；不能作为重铸/拆除/升级/改造/提取等破坏性操作的目标；
// 不被自动换装（角色/佣兵）替换。全部为运行时包装，不改他人源文件。
// ===================================================================================
const LK={inAuto:0};
const isLk=it=>!!(it&&it.lk);
function lkAll(){const out=[];const push=(arr,w)=>{for(const it of arr||[])if(it)out.push([it,w])};push(S.bag,'bag');for(const k in S.eq)push([S.eq[k]],'eq');
 if(S.merc&&S.merc.eq)for(const k in S.merc.eq)push([S.merc.eq[k]],'merc');for(const p of S.pst||[])push(p,'pst');push(S.stash,'pst');
 if(typeof ACCT!=='undefined'&&ACCT&&ACCT.shared)for(const p of ACCT.shared)push(p,'shared');return out}
function lkFind(uid){const r=lkAll().find(([it])=>it.uid===uid);return r?r[0]:null}
function toggleLock(uid,v){const it=lkFind(uid);if(!it)return false;if(v==null)v=!it.lk;if(v)it.lk=1;else delete it.lk;
 if(typeof acctSave==='function'&&typeof ACCT!=='undefined'&&ACCT)acctSave();save();
 if(!window.__NOUI){toast(v?'已锁定':'已解锁');if(document.querySelector('#modal:not(.hide) .mslotm')&&typeof mercSlotUI==='function')mercSlotUI(MX.slot);else{const f=findItem(uid);if(f)showItem(uid);else closeM()}render()}return true}
const lkMsg=()=>{if(!window.__NOUI)toast('物品已锁定，请先解锁');return false};
// 1) 直接以物品为目标的操作：目标锁定则拦截
function lkGuard(name,pos){if(typeof window[name]!=='function')return;const f=window[name];window[name]=function(...a){const it=lkFind(a[pos]);if(isLk(it))return lkMsg();return f.apply(this,a)}}
// 2) 以背包为材料来源的操作：执行期间把锁定物品从背包里“藏起来”，因此不会被当材料消耗，配方可用数量也不计入锁定物品
function lkHide(name){if(typeof window[name]!=='function')return;const f=window[name];window[name]=function(...a){if(!S||!S.bag||!S.bag.some(isLk))return f.apply(this,a);
 const hid=S.bag.filter(isLk);S.bag=S.bag.filter(x=>!x.lk);let r;try{r=f.apply(this,a)}finally{for(const x of hid)S.bag.push(x);if(!window.__NOUI&&typeof TAB!=='undefined'&&TAB!=='fight'&&!LK.noRe){LK.noRe=1;try{render()}finally{LK.noRe=0}}}return r}}
for(const n of ['cubeRecipes','cubeUI','cubeGem','cubeRune','craft','craft2','cubeJewel','cubePot','cubeSocket','cubeMagSock','cubeUpgrade','cubeRepair','cubeReroll','essReroll','egLpExtract','sellJunk','recycleNow'])lkHide(n);
for(const[n,p]of[['sell',0],['shopSell',0],['imbue',0],['cubeReroll',0],['essReroll',0],['cubeUnsock',0],['craft2',1],['cubeUpgrade',1],['cubeRepair',1],['doSock',1],['doSockJewel',1],['egLpExtract',0],['toStash',-1]])if(p>=0)lkGuard(n,p);
if(typeof shouldRecycle==='function'){const f=shouldRecycle;shouldRecycle=function(it,n){return isLk(it)?false:f(it,n)}}
// 3) 角色自动换装：锁定的背包物品不自动穿；已穿戴的锁定物品不被替换
lkHide('autoTick');
{const f=autoTick;autoTick=function(){LK.inAuto=1;try{return f.apply(this,arguments)}finally{LK.inAuto=0}}}
{const f=canEquip;canEquip=function(it){if(LK.inAuto&&it&&!it.k){const b=BASEM[it.b];if(b){const k=slotOf(b);if(k==='ring'){if(isLk(S.eq.ring1)&&isLk(S.eq.ring2))return false}else if(isLk(S.eq[k]))return false;if(b.th&&isLk(S.eq.shield))return false;if(k==='shield'&&isLk(S.eq.weapon))return false}}return f(it)}}
// ---------- 界面 ----------
{const f=cell;cell=function(it,on){const h=f(it,on);return it&&it.lk?h.replace(/<\/div>$/,'<i class="lkic">🔒</i></div>'):h}}
{const f=showItem;showItem=function(uid,...r){f(uid,...r);if(typeof document==='undefined'||window.__NOUI)return;const it=lkFind(uid);if(!it)return;const box=document.querySelector('#modal .btns.c');if(!box||box.querySelector('[data-lk]'))return;
 box.insertAdjacentHTML('afterbegin',`<button class="btn ${it.lk?'gold':''}" data-lk onclick="toggleLock(${uid})">${it.lk?'🔓 解锁':'🔒 锁定'}</button>`);
 if(it.lk){const h=document.querySelector('#modal .ih b, #modal .mtitle');if(h&&!h.querySelector('.lktag'))h.insertAdjacentHTML('beforeend',' <span class="lktag">🔒已锁定</span>')}}}
// 背包筛选「已锁定」：渲染期间只把锁定物品交给背包渲染，结束后恢复，并修正容量显示
{const f=renderBag;renderBag=function(){if(BAGF!=='lk'){f();lkTabBtn();return}const full=S.bag,cnt=typeof slotsUsed==='function'?slotsUsed(full):full.length;S.bag=full.filter(isLk);BAGF='all';
 try{f()}finally{S.bag=full;BAGF='lk'}const h3=[...document.querySelectorAll('#panel .gp h3')].find(e=>/背包/.test(e.textContent));if(h3)h3.innerHTML=h3.innerHTML.replace(/背包 \d+\//,`背包 ${cnt}/`);
 document.querySelectorAll('#panel .stabs.sm button').forEach(b=>{if(b.textContent==='全部')b.classList.remove('on')});lkTabBtn()}}
function lkTabBtn(){const sb=[...document.querySelectorAll('#panel .stabs.sm')].find(e=>[...e.querySelectorAll('button')].some(b=>b.textContent==='全部'));if(!sb||sb.querySelector('[data-lkf]'))return;
 sb.insertAdjacentHTML('beforeend',`<button data-lkf class="${BAGF==='lk'?'on':''}" onclick="BAGF='lk';render()">🔒已锁定 ${S.bag.filter(isLk).length}</button>`)}
// 合成数量校验（防止锁定后材料不足仍被直接调用）
if(typeof cubeGem==='function'){const f=cubeGem;cubeGem=function(k){const g=k.slice(0,3),lv=+k.slice(3);if(S.bag.filter(x=>x.k==='gem'&&x.g===g&&x.lv===lv&&!x.lk).length<3)return lkMsg();return f(k)}}
if(typeof cubeRune==='function'){const f=cubeRune;cubeRune=function(r){const n=typeof runeUpCount==='function'?runeUpCount(r):3;if(S.bag.filter(x=>x.k==='rune'&&x.r===r&&!x.lk).length<n)return lkMsg();return f(r)}}
// 戒指：只跳过锁定的那一格——自动换装期间锁定戒指的战力视为无穷大，autoTick 的“替换较弱戒指”自然落到另一格
{const f=power;power=function(it){if(LK.inAuto&&isLk(it)&&it&&(it===S.eq.ring1||it===S.eq.ring2))return Infinity;return f(it)}}
