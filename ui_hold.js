'use strict';
// ===================================================================================
// ui_hold.js — 防止后台自动重绘打断玩家操作（必须最后加载，包在 render 最外层）
// 挂机时 autoTick 每秒可能 render()（自动加点/换装/回收），会重建 #panel，正在展开的下拉框被关掉、输入框失焦（纪元页选职业选不中）。
// 规则：焦点在 #panel 内的 input/select/textarea 上时，非玩家操作触发的 render 推迟到失焦后再补一次；玩家点击/修改（window.event.isTrusted）照常立即重绘。
// ===================================================================================
let UIH_PEND=0;
{const f=render;render=function(...a){const el=document.activeElement,P=document.getElementById('panel'),ev=window.event;
 if(el&&P&&P.contains(el)&&/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)&&!(ev&&ev.isTrusted)){
  if(!UIH_PEND){UIH_PEND=1;el.addEventListener('blur',()=>setTimeout(()=>{if(UIH_PEND){UIH_PEND=0;render()}},0),{once:true})}return}
 UIH_PEND=0;return f.apply(this,a)}}
