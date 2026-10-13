'use strict';
// power.js — 省电（QA）：限帧、后台/锁屏暂停并按离线公式结算、「省电模式」「息屏挂机」。须最后加载（包装各层最终版本的函数）。
(function(){
const KEY='anye_pwr';
const mobile=(typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches)||/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent||'');
let P={};try{P=JSON.parse(localStorage.getItem(KEY))||{}}catch(e){P={}}
if(P.eco==null)P.eco=mobile;            // 手机默认开启省电模式
const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify({eco:P.eco}))}catch(e){}};
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
 else{if(!SLEEP.on)PWRF.paused=0;if(!SLEEP.on&&hidAt)settle(hidAt);hidAt=0}});
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
 if(window.AUDIO&&AUDIO.pause)AUDIO.pause(0);PWRF.paused=0;settle(SLEEP.at);if(typeof render==='function')render()};
window.PWR={get eco(){return!!P.eco},setEco(v){P.eco=!!v;persist();apply();if(typeof render==='function')render()},sleep:()=>sleepOn(),wake:()=>sleepOff(),get sleeping(){return!!SLEEP.on}};
// ---------- 设置面板（角色页，声音设置之后） ----------
function panel(){return`<div class="gp" id="pwrSet"><h3>省电</h3>
 <div class="row"><span>省电模式<br><small class="dim">15fps，关闭特效动画、飘字，简化背景音乐</small></span><button class="btn sm ${P.eco?'on':''}" onclick="PWR.setEco(!PWR.eco)">${P.eco?'已开启':'关闭'}</button></div>
 <div class="row"><span>息屏挂机<br><small class="dim">黑屏只显示统计，按离线公式推进</small></span><button class="btn sm" onclick="PWR.sleep()">进入</button></div></div>`}
if(typeof renderHero==='function'){const f=renderHero;renderHero=function(){const r=f.apply(this,arguments);try{const P0=document.getElementById('panel');if(P0&&!document.getElementById('pwrSet')){const a=document.getElementById('audioSet');
 if(a)a.insertAdjacentHTML('afterend',panel());else P0.insertAdjacentHTML('beforeend',panel())}}catch(e){}return r}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();
})();
