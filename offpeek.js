'use strict';
// ===================================================================================
// offpeek.js — 结果/汇总弹窗里的物品图标可点（通用 peekWrap）：被包装函数运行期间生成的 cell(it,'') 自动带 onclick=offPeek(i)，
// 点开沿用原物品详情 showItem（含对比等扩展），只读（底部仅「返回」）；返回或点空白回到原弹窗；原弹窗内点空白/按钮照常。
// 物品已被回收/存仓不在背包时，用弹窗生成时保存的物品对象临时放入背包渲染（同 shopPeek）。不改结算。
// 已接入：离线收益 offline、深渊虚隙结果 egRiftResult、秘境结果 egMjResult、悬赏宝箱 egOpenCache。
// （虚隙/秘境自动连打不弹结果窗，无倒计时需暂停；掉落记录 dlog.js 本就可点。）
// ===================================================================================
(function(){
let items=[],back=null,inner=0;
function peekWrap(name){const f0=window[name];if(typeof f0!=='function'||f0._peek)return;
 const g=function(){const cap=[],c0=cell;
  cell=function(it,on){if(it&&!on){on=`offPeek(${cap.length})`;cap.push(it)}return c0.call(this,it,on)};
  try{return f0.apply(this,arguments)}finally{cell=c0;if(cap.length)items=cap}};g._peek=1;window[name]=g}
window.peekWrap=peekWrap;
for(const n of ['offline','egRiftResult','egMjResult','egOpenCache'])peekWrap(n);
const m0=modal;modal=function(){if(!inner)back=null;return m0.apply(this,arguments)};
window.offPeek=function(i){const it=items[i],m=document.querySelector('#modal .mb');if(!it||!m)return;
 const h=m.innerHTML;const has=!!findItem(it.uid);inner=1;
 try{if(!has)S.bag.push(it);try{showItem(it.uid)}finally{if(!has){const k=S.bag.lastIndexOf(it);if(k>=0)S.bag.splice(k,1)}}}finally{inner=0}
 back=h;const box=document.querySelector('#modal .btns.c');if(box)box.innerHTML='<button class="btn" onclick="closeM()">返回</button>'};
const c1=closeM;closeM=function(){if(back){const h=back;back=null;inner=1;try{m0(h)}finally{inner=0}return}return c1.apply(this,arguments)};
})();
