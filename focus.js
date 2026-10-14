'use strict';
// ===================================================================================
// focus.js — 点怪集火：点击战斗页怪物卡片锁定目标，英雄/召唤物/佣兵/职业技能的单体攻击都优先打它；再点一次取消。
// 点中 group.js 合并的「×N」卡片时，锁定点击那一刻这一组的全部成员，每次打其中血最少的一只，直到这组死光（不会跳到下一波同种怪）。
// 范围技能（剧毒新星、尸爆等）本来就打全体，不受影响。玩家集火优先于引诱咒和首领。
// 只存在运行时：不进存档、不影响离线结算/sim；目标全部死亡后自动失效。包装 target / monCard，不改他人源文件。
// ===================================================================================
let FOCUS=null; // {uids:Set, n:名称}
function focusLive(){if(!FOCUS)return[];const L=MON.filter(m=>m.hp>0&&FOCUS.uids.has(m.uid));if(!L.length)FOCUS=null;return L}
const _fc_target=target;target=function(ms){if(FOCUS){const L=ms.filter(m=>m.hp>0&&FOCUS.uids.has(m.uid));
  if(L.length)return L.reduce((a,b)=>b.hp<a.hp?b:a);focusLive()}return _fc_target(ms)};
const _fc_monCard=monCard;monCard=function(m){let h=_fc_monCard(m);if(FOCUS&&FOCUS.uids.has(m.uid))h=h.replace('class="mc ','class="mc focus ').replace('<div class="pt">','<em class="fcs">集火</em><div class="pt">');return h};
function focusTap(uid){const m=MON.find(x=>x.uid===uid&&x.hp>0);if(!m)return;if(typeof sfxT==='function')sfxT('click',null,40);
 if(FOCUS&&FOCUS.uids.has(uid)){FOCUS=null;toast('取消集火')}
 else{const el=document.getElementById('c'+uid),k=el&&el.classList.contains('grp')&&typeof grpMonKey==='function'?grpMonKey(m):null;
  const L=k?MON.filter(x=>x.hp>0&&grpMonKey(x)===k):[m];FOCUS={uids:new Set(L.map(x=>x.uid)),n:m.n};toast(`集火：${m.n}${L.length>1?' ×'+L.length:''}`)}
 renderFight()}
if(typeof document!=='undefined')document.addEventListener('click',e=>{const c=e.target&&e.target.closest&&e.target.closest('#mgrid .mc');if(c&&/^c\d+$/.test(c.id))focusTap(+c.id.slice(1))});
