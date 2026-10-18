'use strict';
// settings.js — 统一设置页：终局页第三行「⚙ 设置」打开。复用各模块原有面板/开关与存储（不复制状态）：
// 角色页原「设置」(自动加点/换装、怪物难度、重置存档)、声音(audio.js)、省电(power.js)、账号与云存档(cloud.js) 均从角色页移入此处，角色页只留一个快捷按钮。
// 背包「自动回收」开关、战斗页「自动推进」快捷按钮保持原位。须在 power.js / mdiff.js / cloud.js 之后加载。
(function(){
if(typeof renderHero!=='function')return;
const isSet=g=>(g.querySelector('h3')?.textContent||'').trim().startsWith('设置');
// 在离屏 #panel 中生成一份角色页，取出设置相关块（各模块包装层照常生效）
function grab(){const real=document.getElementById('panel');if(!real)return null;real.id='panel_real';const tmp=document.createElement('div');tmp.id='panel';tmp.style.display='none';document.body.appendChild(tmp);
 let o={};try{_rh0();const gs=[...tmp.querySelectorAll('.gp')];const g=gs.find(isSet);
  o.game=g?g.innerHTML.replace(/<h3>[\s\S]*?<\/h3>/,''):'';o.audio=tmp.querySelector('#audioSet')?.innerHTML.replace(/<h3>[\s\S]*?<\/h3>/,'')||'';
  o.pwr=tmp.querySelector('#pwrSet')?.innerHTML.replace(/<h3>[\s\S]*?<\/h3>/,'')||'';o.quest=gs.find(g=>(g.querySelector('h3')?.textContent||'').trim()==='任务')?.outerHTML||'';o.acct=tmp.querySelector('.gp.acct')?.innerHTML.replace(/<h3>[\s\S]*?<\/h3>/,'')||''}
 finally{tmp.remove();real.id='panel'}return o}
const _rh0=renderHero;
renderHero=function(){const r=_rh0.apply(this,arguments);if(window.__NOUI)return r;const P=document.getElementById('panel');if(!P||P.querySelector('.setsc'))return r;
 for(const g of [...P.querySelectorAll('.gp')])if(isSet(g)||(g.querySelector('h3')?.textContent||'').trim()==='任务'||g.id==='audioSet'||g.id==='pwrSet'||g.classList.contains('acct'))g.remove();
 P.insertAdjacentHTML('beforeend',`<div class="gp setsc"><div class="btns c"><button class="btn sm gold" onclick="setUI()">⚙ 设置（自动、难度、声音、省电、账号）</button></div></div>`);return r};
function sec(t,h){return h?`<div class="gp setsec"><h3>${t}</h3>${h}</div>`:''}
window.setUI=function(){const o=grab();if(!o)return;
 const auto=`<div class="row"><span>自动推进<br><small class="dim">关闭则原地挂机（战斗页也可切换）</small></span><button class="btn sm ${S.auto?'on':''}" onclick="S.auto^=1;render()">${S.auto?'已开启':'关闭'}</button></div>`;
 // 游戏块拆分：怪物难度/重置存档 → 游戏；自动加点/换装 → 战斗/自动
 const d=document.createElement('div');d.innerHTML=o.game;const md=d.querySelector('.mdset');const rs=[...d.querySelectorAll('button')].find(b=>/重置存档/.test(b.textContent));
 const mdH=md?md.outerHTML:'';if(md)md.remove();if(rs)rs.remove();
 [...d.querySelectorAll('.dim')].filter(e=>/自动出售/.test(e.textContent)).forEach(e=>e.remove());
 const rcy=`<div class="row"><span>自动回收规则<br><small class="dim">品质、凹槽底材等条件（背包页开关保留）</small></span><button class="btn sm" onclick="rcyUI()">设置</button></div>`;
 const chs=typeof charUI==='function'&&!/切换角色/.test(o.acct)?`<div class="btns"><button class="btn sm gold" onclick="charUI()">🔄 切换角色</button></div>`:'';
 const rsH=rs?`<div class="btns"><button class="btn sm" onclick="${rs.getAttribute('onclick')}">重置存档</button></div>`:'';
 modal(`<div id="setM"><div class="mtitle">⚙ 设置</div>`+sec('游戏',mdH)+sec('战斗 / 自动',auto+d.innerHTML)+(typeof rcyUI==='function'?sec('拾取回收',rcy):'')+sec('声音',o.audio)+sec('显示 / 省电',o.pwr)+sec('账号',o.acct+chs+rsH)+`<div class="btns c"><button class="btn sm" onclick="closeM()">关闭</button></div></div>`)};
// 任务列表（原在角色页，现由终局页第三行「📜 任务」打开）
window.questUI=function(){const o=grab();if(!o)return;modal(`<div class="mtitle">📜 任务</div>${o.quest||'<div class="gp"><div class="dim">暂无任务</div></div>'}<div class="btns c"><button class="btn sm" onclick="closeM()">关闭</button></div>`)};
// 设置页内按钮点击后刷新（打开了其他弹窗则不刷新）
const keep=()=>{const m=document.querySelector('#modal .mb');return m?m.scrollTop:0};
document.addEventListener('click',e=>{if(!e.target.closest||!e.target.closest('#setM button'))return;const b=e.target.closest('button');if(/closeM|rcyUI|charUI|PWR.sleep/.test(b.getAttribute('onclick')||''))return;
 setTimeout(()=>{if(!document.getElementById('setM')||document.getElementById('modal').classList.contains('hide'))return;const t=keep();setUI();const m=document.querySelector('#modal .mb');if(m)m.scrollTop=t},0)},true);
// 终局页：第三行快捷按钮
if(typeof renderEG==='function'){const f=renderEG;renderEG=function(){const r=f.apply(this,arguments);const t=document.querySelector('#panel .egtabs');if(t&&!document.querySelector('#panel .egrow3'))
 t.insertAdjacentHTML('afterend',`<div class="stabs egtabs egrow3"><button onclick="setUI()">⚙ 设置</button><button onclick="questUI()">📜 任务</button>${typeof rcyUI==='function'?'<button onclick="rcyUI()">♻ 回收</button>':''}${typeof charUI==='function'?'<button onclick="charUI()">🔄 角色</button>':''}<button onclick="PWR&&PWR.sleep()">🌙 息屏</button></div>`);return r}}
})();
