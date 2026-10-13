'use strict';
// power.js — 省电（QA）：限帧、后台/锁屏暂停并按离线公式结算、「省电模式」「息屏挂机」。须最后加载（包装各层最终版本的函数）。
(function(){
const KEY='anye_pwr';
const mobile=(typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches)||/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent||'');
let P={};try{P=JSON.parse(localStorage.getItem(KEY))||{}}catch(e){P={}}
// 省电模式默认关闭（手机默认开启会关掉攻击/技能特效）；旧版自动开启但未手动设置过(无 m 标记)的一次性重置为关闭
if(!P.m)P.eco=false;
const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify({eco:P.eco,m:1}))}catch(e){}};
function apply(){PWRF.fps=P.eco?15:30;PWRF.ui=P.eco?0.5:0.25;window.PWR_ECO=!!P.eco;
 if(document.body)document.body.classList.toggle('eco',!!P.eco)}
// 省电模式下跳过：飘字、技能特效（画布/图片/帧动画）、地面掉落标签
for(const n of['spawnFloat','fx','fxLine','art2FxAt','art2PlayFx','clsFxRing','groundLoot']){const f=window[n];if(typeof f!=='function')continue;
 window[n]=function(){if(P.eco)return;return f.apply(this,arguments)}}
// ---------- 后台 / 锁屏：停止推进与渲染，回来后按离线公式结算 ----------
let hidAt=0;
function settle(from){if(!from||typeof S!=='object'||!S)return;if(Date.now()-from<60000)return;S.last=from;try{offline()}catch(e){console.error(e)}}
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){hidAt=Date.now();PWRF.paused=1}
 else{if(!SLEEP.on){PWRF.paused=0;PWRF.resume()}if(!SLEEP.on&&hidAt)settle(hidAt);hidAt=0}});
// ---------- 息屏挂机：黑屏 + 文字统计；不跑实时战斗，退出时按离线公式结算 ----------
const SLEEP={on:0,at:0,tm:0};
function sleepText(){const sec=(Date.now()-SLEEP.at)/1000,t=Math.min(sec,8*3600),kpm=Math.max(2,S.kpm||4);
 const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=Math.floor(sec%60);
 return`<div class="sl1">息屏挂机中</div><div>已挂机 ${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}</div>
 <div>预计击杀 ${Math.floor(kpm*t/60*0.5)} 只（${(kpm*0.5).toFixed(1)}/分钟，效率50%，上限8小时）</div>
 <div>Lv.${S.lvl} · ◈${typeof fmt==='function'?fmt(S.gold):S.gold}</div><div class="sl2">${sec<60?'满 1 分钟后开始计收益 · ':''}轻触屏幕退出并结算</div>`}
function sleepTick(){if(!SLEEP.on)return;const e=document.getElementById('sleepv');if(e)e.innerHTML=sleepText();SLEEP.tm=setTimeout(sleepTick,5000)}
window.sleepOn=function(){if(SLEEP.on)return;try{save()}catch(e){}SLEEP.on=1;SLEEP.at=Date.now();PWRF.paused=1;
 if(window.AUDIO&&AUDIO.pause)AUDIO.pause(1);
 let e=document.getElementById('sleepv');if(!e){e=document.createElement('div');e.id='sleepv';document.body.appendChild(e)}
 e.onclick=sleepOff;e.classList.remove('hide');sleepTick()};
window.sleepOff=function(){if(!SLEEP.on)return;SLEEP.on=0;clearTimeout(SLEEP.tm);const e=document.getElementById('sleepv');if(e)e.classList.add('hide');
 if(window.AUDIO&&AUDIO.pause)AUDIO.pause(0);PWRF.paused=0;PWRF.resume();settle(SLEEP.at);if(typeof render==='function')render()};
window.PWR={get eco(){return!!P.eco},setEco(v){P.eco=!!v;persist();apply();if(typeof render==='function')render()},sleep:()=>sleepOn(),wake:()=>sleepOff(),get sleeping(){return!!SLEEP.on}};
// ---------- 设置面板（角色页，声音设置之后） ----------
function panel(){return`<div class="gp" id="pwrSet"><h3>省电</h3>
 <div class="row"><span>省电模式<br><small class="dim">15fps，关闭特效动画、飘字，简化背景音乐</small></span><button class="btn sm ${P.eco?'on':''}" onclick="PWR.setEco(!PWR.eco)">${P.eco?'已开启':'关闭'}</button></div>
 <div class="row"><span>息屏挂机<br><small class="dim">黑屏只显示统计，按离线公式推进</small></span><button class="btn sm" onclick="PWR.sleep()">进入</button></div></div>`}
if(typeof renderHero==='function'){const f=renderHero;renderHero=function(){const r=f.apply(this,arguments);try{const P0=document.getElementById('panel');if(P0&&!document.getElementById('pwrSet')){const a=document.getElementById('audioSet');
 if(a)a.insertAdjacentHTML('afterend',panel());else P0.insertAdjacentHTML('beforeend',panel())}}catch(e){}return r}}

// ---------- 战斗界面差异更新：各层包装照旧，但容器的 innerHTML 写入改为“和现有 DOM 做 diff 后只改变化处” ----------
// 语义不变：每次仍以基础 HTML 为准（各包装层在其上再加工），只是节点不再整片销毁重建。
const NATIVE_IH=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');
const TPL=document.createElement('template');
function sameNode(a,b){if(a.nodeType!==b.nodeType)return false;if(a.nodeType!==1)return true;return a.tagName===b.tagName&&(a.id||'')===(b.id||'')}
function patchNode(a,b){if(a.nodeType!==1){if(a.nodeValue!==b.nodeValue)a.nodeValue=b.nodeValue;return}
 const ba=b.attributes;for(let i=0;i<ba.length;i++){const t=ba[i];if(a.getAttribute(t.name)!==t.value)a.setAttribute(t.name,t.value)}
 const aa=a.attributes;for(let i=aa.length-1;i>=0;i--){const n=aa[i].name;if(!b.hasAttribute(n))a.removeAttribute(n)}
 morphKids(a,b)}
function morphKids(a,b){const bc=[...b.childNodes];let ids=null,nid=null;
 // 滚动列表（如战斗日志）：头部被挤掉几条时，先删头部再对齐，避免整列逐条改文字
 if(bc.length>8&&a.firstChild&&a.firstChild.nodeType===1&&bc[0].nodeType===1&&!bc[0].id&&a.firstChild.outerHTML!==bc[0].outerHTML){const h=bc[0].outerHTML;let x=a.firstChild,k=0;
  while(x&&k<8&&!(x.nodeType===1&&x.outerHTML===h)){x=x.nextSibling;k++}if(x&&k>0)for(let i=0;i<k;i++)a.removeChild(a.firstChild)}
 let ac=a.firstChild;
 for(const bn of bc){
  if(ac&&ac.nodeType===1&&ac.id){if(!nid){nid=new Set();for(const x of bc)if(x.nodeType===1&&x.id)nid.add(x.id)}
   while(ac&&ac.nodeType===1&&ac.id&&!nid.has(ac.id)){const nx=ac.nextSibling;a.removeChild(ac);ac=nx}}
  let an=ac;
  if(bn.nodeType===1&&bn.id&&!(an&&an.nodeType===1&&an.id===bn.id)){if(!ids){ids=new Map();for(let x=a.firstChild;x;x=x.nextSibling)if(x.nodeType===1&&x.id)ids.set(x.id,x)}
   const m=ids.get(bn.id);if(m&&m.tagName===bn.tagName&&m.parentNode===a&&m!==an){a.insertBefore(m,an);an=m}}
  if(!an){a.appendChild(bn);continue}
  if(sameNode(an,bn)){patchNode(an,bn);ac=an.nextSibling}else{a.insertBefore(bn,an);ac=an}}
 while(ac){const nx=ac.nextSibling;a.removeChild(ac);ac=nx}}
function diffHTML(el,html){NATIVE_IH.set.call(TPL,html);morphKids(el,TPL.content)}
const DIFF_IDS=['ftop','mgrid','arow','flog','fquest','fzone'];
function installDiff(){for(const id of DIFF_IDS){const el=document.getElementById(id);if(!el||el.__diff)continue;el.__diff=1;
 Object.defineProperty(el,'innerHTML',{configurable:true,get(){return NATIVE_IH.get.call(this)},set(v){v=String(v);if(v===this.__last)return;this.__last=v;diffHTML(this,v)}})}
 // #fbattle 背景：多层在同一次渲染里先后覆盖写，合并到渲染结束只写一次最终值
 const fb=document.getElementById('fbattle');if(fb&&!fb.__bg){fb.__bg=1;const st=fb.style;let pend=null,lastV=null;const real=()=>st.getPropertyValue('background-image');
  Object.defineProperty(st,'backgroundImage',{configurable:true,get(){return pend!=null?pend:real()},set(v){if(RF_DEPTH){pend=String(v);return}pend=null;lastV=String(v);st.setProperty('background-image',lastV)}});
  FLUSH.push(()=>{if(pend==null)return;const v=pend;pend=null;if(v===lastV)return;lastV=v;if(v==='')st.removeProperty('background-image');else st.setProperty('background-image',v)})}}
let RF_DEPTH=0;const FLUSH=[];
if(typeof renderFight==='function'){const f=renderFight;renderFight=function(){RF_DEPTH++;try{return f.apply(this,arguments)}finally{if(--RF_DEPTH===0)for(const g of FLUSH)g()}}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installDiff);else installDiff();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();
})();
