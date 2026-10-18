'use strict';
// ===================================================================================
// offpeek.js — 离线收益弹窗里的物品图标可点：点开沿用原物品详情（showItem，含对比等扩展），只读（底部仅「返回」）。
// 关闭详情（返回按钮或点空白）回到离线收益弹窗；在离线弹窗点空白/收下照常关闭。
// 物品已被回收/存仓不在背包时，用离线结算时保存的物品对象临时放入背包渲染（同 shopPeek）。不改结算。
// ===================================================================================
(function(){
let items=[],cap=null,back=null,inner=0;
const f0=offline;
offline=function(){cap=[];const c0=cell;
 cell=function(it,on){if(cap&&it&&!on){on=`offPeek(${cap.length})`;cap.push(it)}return c0.call(this,it,on)};
 try{return f0.apply(this,arguments)}finally{cell=c0;if(cap.length)items=cap;cap=null}};
const m0=modal;modal=function(){if(!inner)back=null;return m0.apply(this,arguments)};
window.offPeek=function(i){const it=items[i],m=document.querySelector('#modal .mb');if(!it||!m)return;
 const h=m.innerHTML;const has=!!findItem(it.uid);inner=1;
 try{if(!has)S.bag.push(it);try{showItem(it.uid)}finally{if(!has){const k=S.bag.lastIndexOf(it);if(k>=0)S.bag.splice(k,1)}}}finally{inner=0}
 back=h;const box=document.querySelector('#modal .btns.c');if(box)box.innerHTML='<button class="btn" onclick="closeM()">返回</button>'};
const c1=closeM;closeM=function(){if(back){const h=back;back=null;inner=1;try{m0(h)}finally{inner=0}return}return c1.apply(this,arguments)};
})();
