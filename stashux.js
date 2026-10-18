'use strict';
// stashux.js — 个人/共享仓库：显眼「⇅ 自动整理」按钮（同背包样式）+「炼金匣」（仓库物品可作材料）
// 整理：sort.js 的 sortPages（品质→类型→等级→名称，锁定不变，从第 1 页起铺满）；共享仓库 acctSave + 云同步（clSyncSoon，同其他共享仓库事件）。
// 炼金匣：打开时把当前仓库物品临时并入背包供配方识别/消耗，每次配方或界面刷新后立即放回原页；产物留在背包，背包满则放回当前仓库。
autoSortStash=function(sh){const P=sh?ACCT.shared:S.pst;sortPages(P);if(sh){SHP=0;acctSave()}else STP=0;save();if(sh&&typeof clSyncSoon==='function')try{clSyncSoon()}catch(e){}
 if(!window.__NOUI){toast(sh?'共享仓库已整理':'个人仓库已整理');render()}return true};
let STCUBE=null,STC_D=0;
function stcIn(){if(!STCUBE||STC_D++)return;const P=STCUBE.sh?ACCT.shared:S.pst;STCUBE.n0=S.bag.length;STCUBE.src=[];
 P.forEach((p,pi)=>{for(const it of p.splice(0)){it._stc=pi+1;S.bag.push(it)}})}
function stcOut(){if(!STCUBE||--STC_D)return;const P=STCUBE.sh?ACCT.shared:S.pst,keep=[];
 for(const it of S.bag){if(it._stc){const pi=it._stc-1;delete it._stc;P[pi].push(it)}else keep.push(it)}S.bag=keep;
 while(slotsUsed(S.bag)>BAG_SZ){const it=S.bag.pop();const w=STCUBE.sh?'s':'p';const p=pickPage(w,it,0);if(p<0){S.bag.push(it);break}if(STCUBE.sh)it.uid=ACCT.suid++;pushInto(P[p],it)}
 for(const p of P)mergeMats(p);calc();save();if(STCUBE.sh){acctSave();if(typeof clSyncSoon==='function')try{clSyncSoon()}catch(e){}}}
function stcWrap(){for(const n of Object.keys(window)){if(!/^cube[A-Z]/.test(n))continue;const f=window[n];if(typeof f!=='function'||f._stc)continue;
 const g=function(){if(!STCUBE)return f.apply(this,arguments);stcIn();try{const r=f.apply(this,arguments);if(n==='cubeUI'){const t=document.querySelector('#modal .mtitle');if(t)t.textContent=`炼金匣（含${STCUBE.sh?'共享':'个人'}仓库物品）`}return r}finally{stcOut();if(!STC_D&&!window.__NOUI&&typeof render==='function')render()}};g._stc=1;window[n]=g}}
function stashCube(sh){stcWrap();STCUBE={sh:!!sh};cubeUI();const t=document.querySelector('#modal .mtitle');if(t)t.textContent=`炼金匣（含${sh?'共享':'个人'}仓库物品）`}
{const f=closeM;closeM=function(){STCUBE=null;STC_D=0;return f.apply(this,arguments)}}
{const f=renderBag;renderBag=function(){f.apply(this,arguments);if(typeof document==='undefined'||window.__NOUI)return;const G=document.querySelector('#panel .stash2');if(!G)return;
 const sh=G.classList.contains('shared')?1:0;G.querySelectorAll('.sttools .sortbtn').forEach(b=>b.remove());
 if(!G.querySelector('.sortbar')){const h3=G.querySelector('h3');if(h3)h3.insertAdjacentHTML('afterend',`<div class="sortbar stsortbar"><button class="btn gold sortbtn" onclick="autoSortStash(${sh})">⇅ 自动整理</button><button class="btn xs stcube" onclick="stashCube(${sh})">炼金匣</button></div>`)}}}
