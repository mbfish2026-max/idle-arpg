'use strict';
// ===================================================================================
// stash_equip.js — 个人/共享仓库物品详情加「装备」：走原 equip()（需求/职业/双手与副手/戒指位/套装重算），
// 换下的装备放回新装备原来所在的仓库页；放不下则进背包；背包也满则提示且不装备。共享仓库改动后 acctSave + clSyncSoon。
// 不满足需求时显示灰色「需求不足」（同背包）。按钮一行不换行：装备 / 取回 / 转共享(个人) / 关闭。加载于 stash.js、items2.js 之后。
// ===================================================================================
function stEquipable(it){if(!it||it.k)return false;const b=BASEM[it.b];if(!b||b.jew)return false;if(typeof isCharm==='function'&&(isCharm(it)||isJewel(it)))return false;return !!slotOf(b)&&b.s!=='charm'&&b.s!=='jewel'}
function stEquip(uid){const f=findItem(uid);if(!f||!f.stash)return false;const it=f.it,b=BASEM[it.b];if(!stEquipable(it))return false;
 if(!canEquip(it)){if(!window.__NOUI)toast('需求不足');return false}
 let k=slotOf(b);if(k==='ring')k=!S.eq.ring1?'ring1':!S.eq.ring2?'ring2':'ring1';
 const old=S.eq[k]||null,off=b.th&&S.eq.shield?'shield':(b.s==='shield'&&typeof isTH==='function'&&isTH(S.eq.weapon))?'weapon':null;
 const P=pagesOf(f.where),page=P[f.pg];page.splice(page.indexOf(it),1);
 // 需要进背包的件数：副手/双手被挤下 + 换下的若原页放不下
 const oldFits=!old||fits(page,old,PAGE_SZ),needBag=(off&&S.eq[off]?1:0)+(oldFits?0:1);
 if(needBag&&slotsUsed(S.bag)+needBag>BAG_SZ){page.splice(f.si,0,it);if(!window.__NOUI)toast('背包已满，无法装备');return false}
 it.uid=S.uid++;S.bag.push(it);const n0=S.bag.length;
 const nu=window.__NOUI;window.__NOUI=1;try{equip(it.uid)}finally{window.__NOUI=nu}
 if(S.eq[k]!==it){const j=S.bag.indexOf(it);if(j>=0)S.bag.splice(j,1);if(f.where==='s')it.uid=ACCT.suid++;page.splice(f.si,0,it);if(!window.__NOUI){toast('无法装备');render()}return false}
 if(old&&oldFits){const j=S.bag.indexOf(old);if(j>=0){S.bag.splice(j,1);if(f.where==='s')old.uid=ACCT.suid++;pushInto(page,old)}}
 calc();H.life=Math.min(H.life,ST.life);save();if(f.where==='s'){acctSave();if(typeof clSyncSoon==='function')try{clSyncSoon()}catch(e){}}
 if(!window.__NOUI){toast(`已装备：${itemName(it)}${old?`；换下 ${itemName(old)} → ${oldFits?(f.where==='s'?'共享':'个人')+'仓库':'背包'}`:''}`);closeM();render()}return true}
{const f=showItem;showItem=function(uid){const r=f.apply(this,arguments);if(window.__NOUI)return r;const F=findItem(uid);if(!F||!F.stash)return r;
 const box=document.querySelector('#modal .btns.c');if(!box||box.querySelector('[data-steq]'))return r;
 for(const b of box.querySelectorAll('button')){if(b.textContent==='取回背包')b.textContent='取回';else if(/^转到(共享|个人)仓库$/.test(b.textContent))b.textContent='转'+b.textContent.slice(2,4)}
 if(stEquipable(F.it)){const ok=canEquip(F.it);box.insertAdjacentHTML('afterbegin',`<button class="btn gold" data-steq onclick="stEquip(${uid})" ${ok?'':'disabled'}>${ok?'装备':'需求不足'}</button>`)}
 box.style.flexWrap='nowrap';box.style.whiteSpace='nowrap';return r}}
