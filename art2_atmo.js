'use strict';
// art2_atmo.js — 美术2：战斗氛围层。只在 #fbattle 内一次性插入两个静态层（暗角地面 + 前景雾）；
// 单位光环由 art2_atmo.css 的 ::after 实现（单位是 DOM 卡片，不需要画布/新 rAF）。renderFight 只改子容器 innerHTML，层不会被清掉。
(function(){function add(){const fb=document.getElementById('fbattle');if(!fb||fb.querySelector('.a2atmo'))return;
 for(const c of ['vig','fog']){const d=document.createElement('div');d.className='a2atmo '+c;d.setAttribute('aria-hidden','true');fb.insertBefore(d,fb.firstChild)}}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add);else add()})();
