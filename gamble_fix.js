'use strict';
// gamble_fix.js — 赌博所得物品保护：赌博（花钱买的）物品打上 gb=1 标记，
// 永不被自动回收 / 自动存仓 / 自动换装(本人与佣兵) 挪走，留在背包里由玩家在弹窗中自行决定（装备/锁定/存仓/出售）。
// 背景：赌博到更好的装备时，autoTick 会在弹窗打开期间把它自动穿上，导致弹窗按钮失效、背包里也找不到。
(function(){
 if(typeof gamble==='function'){const f=gamble;gamble=function(...a){const it=f.apply(this,a);if(it&&typeof it==='object')it.gb=1;return it}}
 if(typeof shouldRecycle==='function'){const f=shouldRecycle;shouldRecycle=function(it,n){return it&&it.gb?false:f(it,n)}}
 if(typeof autoStash==='function'){const f=autoStash;autoStash=function(it,...a){return it&&it.gb?false:f(it,...a)}}
 const hideGb=name=>{if(typeof window[name]!=='function')return;const f=window[name];window[name]=function(...a){if(!S||!Array.isArray(S.bag)||!S.bag.some(x=>x&&x.gb))return f.apply(this,a);
  const hid=S.bag.filter(x=>x&&x.gb);S.bag=S.bag.filter(x=>!(x&&x.gb));try{return f.apply(this,a)}finally{for(const x of hid)S.bag.push(x)}}};
 for(const n of['autoTick','mercAutoEq'])hideGb(n);
 {const f=gamble;gamble=function(...a){if(S&&typeof slotsUsed==='function'&&typeof BAG_SZ!=='undefined'&&slotsUsed(S.bag)>=BAG_SZ){shopMsg('背包已满，未扣金币：请先出售或存入仓库再赌博');return null}return f.apply(this,a)}}
})();
