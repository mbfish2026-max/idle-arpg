'use strict';
// bagkeep.js — 背包顺序保持：自动换装/佣兵换装/回收等函数内部会把部分物品(锁定/双手/护符/珠宝/赌博)临时移出 S.bag 再 push 回末尾，
// 每次 autoTick 都把这些物品挪到最后，导致「自动整理」后几秒又乱。这里在最外层包装：执行后按执行前顺序恢复原有物品，新进入背包的物品排在末尾。
function bagKeepOrder(before){if(!Array.isArray(S.bag))return;const pos=new Map();before.forEach((x,i)=>pos.set(x,i));
 const old=S.bag.filter(x=>pos.has(x)).sort((a,b)=>pos.get(a)-pos.get(b)),nw=S.bag.filter(x=>!pos.has(x));
 const r=old.concat(nw);if(r.length===S.bag.length&&r.every((x,i)=>x===S.bag[i]))return;S.bag.length=0;S.bag.push(...r)}
for(const n of['autoTick','mercAutoEq','recycleNow','sellJunk','autoEquip']){if(typeof window[n]!=='function')continue;const f=window[n];
 window[n]=function(...a){if(typeof S==='undefined'||!S||!Array.isArray(S.bag))return f.apply(this,a);const b=S.bag.slice();try{return f.apply(this,a)}finally{bagKeepOrder(b)}}}
