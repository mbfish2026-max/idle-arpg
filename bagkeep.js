'use strict';
// bagkeep.js — 「自动整理」后保持有序（v2，?v=20261020n）
// 背包顺序会被很多路径改动：拾取 push 到末尾、自动换装/佣兵换装换下件 push 到末尾、items2/gamble_fix/lock 在 autoTick/回收/出售期间把
// 双手/护身符/珠宝/赌博/锁定物品临时移出再 push 回末尾、回收 S.bag=keep.concat(mats) 等。逐个修补不可靠，改为「整理状态」：
// 点「自动整理」后记 S.bagSort=1（个人仓库 S.pstSort、共享仓库 ACCT.shSort），之后背包内容一有变化就按同一规则重新排序，
// 新物品直接落到排序位置。检查时机：每秒一次 + 每次 render 之前 + 自动换装/回收等函数之后。背包没有手动拖动排序，所以状态一直保持。
function bkSig(a){let s='';for(const x of a)s+=x.uid+(x.n?'x'+x.n:'')+(x.lk?'L':'')+',';return s}
function bkPagesSig(P){return P.map(bkSig).join('|')}
const BK={bag:'',pst:'',sh:''};
function bkApply(){if(typeof S==='undefined'||!S||typeof sortArr!=='function')return;
 try{if(S.bagSort&&Array.isArray(S.bag)){const g=bkSig(S.bag);if(g!==BK.bag){sortArr(S.bag);BK.bag=bkSig(S.bag)}}
  if(S.pstSort&&Array.isArray(S.pst)&&typeof sortPages==='function'){const g=bkPagesSig(S.pst);if(g!==BK.pst){sortPages(S.pst);BK.pst=bkPagesSig(S.pst)}}
  if(typeof ACCT!=='undefined'&&ACCT&&ACCT.shSort&&Array.isArray(ACCT.shared)&&typeof sortPages==='function'){const g=bkPagesSig(ACCT.shared);if(g!==BK.sh){sortPages(ACCT.shared);BK.sh=bkPagesSig(ACCT.shared)}}}catch(e){}}
{const f=autoSortBag;autoSortBag=function(...a){if(S)S.bagSort=1;const r=f.apply(this,a);BK.bag=bkSig(S.bag);return r}}
{const f=autoSortStash;autoSortStash=function(sh,...a){if(sh){if(typeof ACCT!=='undefined'&&ACCT)ACCT.shSort=1}else if(S)S.pstSort=1;return f.call(this,sh,...a)}}
for(const n of['autoTick','mercAutoEq','recycleNow','sellJunk','autoEquip','render']){if(typeof window[n]!=='function')continue;const f=window[n];
 window[n]=n==='render'?function(...a){bkApply();return f.apply(this,a)}:function(...a){try{return f.apply(this,a)}finally{bkApply()}}}
setInterval(bkApply,1000);
