'use strict';
// ===================================================================================
// ui_hold.js — 后台自动重绘不打断、不闪烁（必须最后加载，包在 render 最外层）
// 挂机时 autoTick 每秒可能 render()（自动加点/换装/回收），原来会整块重建 #panel：图片重建、emoji→手绘图标的替换要等 200ms，界面一闪一闪；展开的下拉框也被关掉。
// 规则（只对非玩家操作触发的重绘，玩家点击/修改 window.event.isTrusted 照常整块重绘）：
// 1) 焦点在 #panel 内的 input/select/textarea 上：推迟到失焦后再补一次
// 2) 非战斗页：先画到隐藏的替身 #panel，立即做图标替换，再与真实页面比对，只改有变化的节点（同 power.js 战斗页做法）
// ===================================================================================
let UIH_PEND=0;
function uhSame(a,b){if(a.nodeType!==b.nodeType)return false;if(a.nodeType!==1)return true;return a.tagName===b.tagName&&(a.id||'')===(b.id||'')}
function uhPatch(a,b){if(a.nodeType!==1){if(a.nodeValue!==b.nodeValue)a.nodeValue=b.nodeValue;return}
 const ba=b.attributes;for(let i=0;i<ba.length;i++){const t=ba[i];if(a.getAttribute(t.name)!==t.value)a.setAttribute(t.name,t.value)}
 const aa=a.attributes;for(let i=aa.length-1;i>=0;i--){const n=aa[i].name;if(!b.hasAttribute(n))a.removeAttribute(n)}uhKids(a,b)}
function uhKids(a,b){const bc=[...b.childNodes];let ac=a.firstChild;
 for(const bn of bc){const an=ac;if(!an){a.appendChild(bn);continue}if(uhSame(an,bn)){uhPatch(an,bn);ac=an.nextSibling}else{a.insertBefore(bn,an);ac=an}}
 while(ac){const nx=ac.nextSibling;a.removeChild(ac);ac=nx}}
// 替身面板上立即执行各模块的图标替换（否则它们的 MutationObserver 200ms 后才换，会先露出 emoji）
function uhFixIcons(root){const eg=typeof TAB!=='undefined'&&TAB==='eg'&&typeof EGT!=='undefined'?EGT:null;
 for(const fn of[()=>typeof icon2Fix3==='function'&&icon2Fix3(root),()=>typeof icon3Scan==='function'&&icon3Scan(root,eg),()=>typeof icon3Para==='function'&&icon3Para(root),()=>typeof uaFix==='function'&&uaFix()])try{fn()}catch(e){}}
// 真实面板整个移出文档（其他模块用全局 id 判断「是否已插入」时不会误判），替身占位；同一个任务内放回，浏览器不会画出中间状态
function uhQuietRender(f,a){const live=document.getElementById('panel');if(!live||!live.parentNode)return f.apply(this,a);
 const par=live.parentNode,nx=live.nextSibling,sy=live.scrollTop,tmp=live.cloneNode(false);par.replaceChild(tmp,live);let r;
 try{r=f.apply(this,a);uhFixIcons(tmp)}finally{par.replaceChild(live,tmp);live.scrollTop=sy}
 const ta=tmp.attributes;for(let i=0;i<ta.length;i++){const t=ta[i];if(t.name!=='id'&&live.getAttribute(t.name)!==t.value)live.setAttribute(t.name,t.value)}
 uhKids(live,tmp);return r}
{const f=render;render=function(...a){const el=document.activeElement,P=document.getElementById('panel'),ev=window.event,user=!!(ev&&ev.isTrusted);
 if(!user&&el&&P&&P.contains(el)&&/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)){
  if(!UIH_PEND){UIH_PEND=1;el.addEventListener('blur',()=>setTimeout(()=>{if(UIH_PEND){UIH_PEND=0;render()}},0),{once:true})}return}
 UIH_PEND=0;if(!user&&!window.__NOUI&&typeof TAB!=='undefined'&&TAB!=='fight'&&P&&!P.classList.contains('hide'))return uhQuietRender(f,a);return f.apply(this,a)}}
