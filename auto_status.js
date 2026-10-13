'use strict';
// auto_status.js — 自动推进状态说明：开启自动推进但暂不前进时（等级门槛/下一章门槛/悬赏），在战斗页任务栏明确显示原因，避免误以为“失灵”。
function autoHoldWhy(){if(!S||!S.auto)return'';try{
 const B=typeof EG==='function'&&EG().bounty;if(B&&B.ret)return'悬赏进行中，完成后自动返回';
 const a=S.act,zs=ACTS[a].zones,g=typeof gateOf==='function'?gateOf(a,S.diff):0;let nx=S.zone+1;while(nx<zs.length&&zs[nx].side)nx++;
 if(nx<zs.length){const need=zs[nx].ml-g;if(nx<=S.unl&&S.lvl<need)return`等级不足：${zs[nx].n} 需 Lv.${need}，正在刷当前区域`;return''}
 if(!S.q[ACTS[a].fq])return'';const n=nextStage();if(!n)return'已到达最终章节，原地挂机';
 const need=mlD(ACTS[n[0]].zones[0].ml0,n[1])-gateOf(n[0],n[1]);return S.lvl<need?`等级不足：${DIFFS[n[1]].n}${ACTS[n[0]].n} 需 Lv.${need}，正在刷当前区域`:''}catch(e){return''}}
if(typeof renderFight==='function'){const f=renderFight;renderFight=function(){f.apply(this,arguments);if(window.__NOUI)return;const w=autoHoldWhy(),q=document.getElementById('fquest');
 if(w&&q)q.innerHTML=`<span class="qtag" style="color:#e9c46a">【自动推进暂停】${w}</span>`}}
