// build_manual.js — 选流派后仍可手动加技能点（运行时包装 nec_build.js 的 nbPick / nbPanel，不改原文件）
// 原因：nbPick 选/切流派时强制 S.autoSk=1，autoTick 每秒把剩余技能点按流派计划全部花掉，技能点永远为 0，
//   手动「+」按钮没有可用点；而「自动加技能」开关只在 ⚙ 设置弹窗里，难以发现。
// 改法：流派面板加单行「技能点：自动 / 手动」开关（即 S.autoSk）；
//   手动模式下选/切流派只返还技能点、不自动重新加点，且不再把 S.autoSk 改回 1；
//   自动模式下手动加的点照常保留（自动加点只补足计划缺口，从不扣除已加的点）。流派被动、套装、共鸣只看 S.build，不受影响。
(function(){
 if(typeof nbPick!=='function'||typeof nbPanel!=='function')return;
 let hold=0;
 {const f=autoTick;autoTick=function(...a){if(!hold)return f.apply(this,a);const k=S.autoSk;S.autoSk=0;try{return f.apply(this,a)}finally{S.autoSk=k}}}
 {const f=nbPick;nbPick=function(b){const man=!S.autoSk;hold=man?1:0;let r;try{r=f.apply(this,arguments)}finally{hold=0}
  if(man){S.autoSk=0;if(S.kp>0){log(`<b style="color:#ffd76a">手动加点模式：已返还技能点，当前可用 ${S.kp} 点，请在技能页手动分配</b>`);save();if(!window.__NOUI)render()}}return r}}
 window.bmSet=function(v){S.autoSk=v?1:0;if(v&&typeof autoTick==='function')autoTick();calc();save();render()};
 {const f=nbPanel;nbPanel=function(...a){const h=f.apply(this,a);try{const on=!!S.autoSk;
  const row=`<div class="bmrow"><span>技能点</span><button class="btn xs ${on?'on':''}" onclick="bmSet(1)">自动</button><button class="btn xs ${on?'':'on'}" onclick="bmSet(0)">手动</button><span class="dim">${on?'按流派计划自动加点，手动加的点保留':'可用 '+S.kp+' 点，点技能「+」自由加'}</span></div>`;
  return h.replace(/<\/div>$/,row+'</div>')}catch(e){return h}}}
 document.head.insertAdjacentHTML('beforeend',`<style>.bmrow{display:flex;flex-wrap:nowrap;align-items:center;gap:4px;margin-top:4px;white-space:nowrap;overflow:hidden}.bmrow .dim{overflow:hidden;text-overflow:ellipsis;font-size:11px}</style>`);
})();
