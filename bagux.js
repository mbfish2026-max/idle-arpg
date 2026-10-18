'use strict';
// ===================================================================================
// bagux.js — 手机端背包/仓库体验 + 弹窗点空白关闭（加载于最后）
// 1) 弹窗：点暗色背景（pointerdown 与 click 都落在背景上，且打开 >300ms）即关闭；ESC 关闭。登录/新建角色/他处登录/存档冲突/上传存档等必选弹窗除外
// 2) 物品详情：底部抽屉（.sheet），操作按钮加大固定在底部
// 3) 背包分类：全部/装备/宝石/符文/材料（+已锁定）；容量徽标
// 4) 仓库/背包网格左右滑动翻页；长按物品弹快捷菜单（详情对比/锁定/出售/存仓/取回）
// ===================================================================================
const BUX={openAt:0,downBg:0,lp:null,lpFired:0};
function buxLocked(){const m=document.getElementById('modal');if(!m)return true;
 if(typeof CL_GATE!=='undefined'&&CL_GATE&&typeof CU!=='undefined'&&!CU)return true;
 const t=((m.querySelector('.mtitle')||{}).textContent||'')+'|'+(m.textContent||'').slice(0,60);
 if(/暗夜挂机 · 账号|已在其他设备登录|存档冲突|上传本地存档|正在恢复|连接云端失败/.test(t))return true;
 if(/新建角色/.test(t)&&typeof LF!=='undefined'&&LF.placeholder)return true;
 if(m.querySelector('[data-nobg]'))return true;return false}
function buxTryClose(){const m=document.getElementById('modal');if(!m||m.classList.contains('hide'))return;if(Date.now()-BUX.openAt<300||buxLocked())return;closeM()}
(function(){const m=document.getElementById('modal');if(!m)return;
 const mark=()=>{const open=!m.classList.contains('hide');if(open&&!BUX.wasOpen)BUX.openAt=Date.now();BUX.wasOpen=open;
  m.classList.toggle('sheet',open&&!!m.querySelector('.mb>.ipanel,.mb>.cmpw,.mb>.buxq'))};
 new MutationObserver(mark).observe(m,{attributes:true,attributeFilter:['class'],childList:true});
 // 内容替换（如详情→镶嵌）也算重新打开，避免同一次点击落到新背景
 new MutationObserver(()=>{BUX.openAt=Date.now()}).observe(m,{childList:true});
 m.onclick=null;// 取代 game.js 无保护的背景关闭
 const isBg=t=>t===m||(t&&t.classList&&t.classList.contains('mb')&&t.parentNode===m&&!m.classList.contains('sheet'));
 m.addEventListener('pointerdown',e=>{BUX.downBg=isBg(e.target)&&Date.now()-BUX.openAt>=300},true);
 document.addEventListener('click',e=>{if(!isBg(e.target))return;e.stopPropagation();if(BUX.downBg){BUX.downBg=0;buxTryClose()}},true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape')buxTryClose()})})();
// ---------- 背包分类 ----------
const BUX_CAT={gem:it=>it.k==='gem',rune:it=>it.k==='rune',mat:it=>it.k==='mat'};
{const f=renderBag;renderBag=function(){const c=BUX_CAT[BAGF];if(c){const full=S.bag,sv=BAGF;S.bag=full.filter(c);BAGF='all';try{f.apply(this,arguments)}finally{S.bag=full;BAGF=sv}}else f.apply(this,arguments);
 if(window.__NOUI)return;const P=document.getElementById('panel');if(!P)return;
 const h3=[...P.querySelectorAll('.gp h3')].find(e=>/背包 \d+\//.test(e.textContent));
 if(h3){const used=typeof slotsUsed==='function'?slotsUsed(S.bag):S.bag.length,cap=typeof BAG_SZ!=='undefined'?BAG_SZ:40;
  h3.innerHTML=h3.innerHTML.replace(/背包 \d+\/\d+/,`背包 <span class="buxcap ${used>=cap?'full':used>=cap*.9?'hi':''}">${used}/${cap}</span>`)}
 const sb=h3&&h3.closest('.gp').querySelector('.stabs.sm');
 if(sb){const mis=[...sb.querySelectorAll('button')].find(b=>b.textContent.trim()==='符文宝石');
  if(mis){const cnt=fn=>groups(S.bag.filter(fn)).length;
   mis.outerHTML=[['gem','宝石'],['rune','符文'],['mat','材料']].map(([k,n])=>`<button class="${BAGF===k?'on':''}" onclick="BAGF='${k}';BGP=0;render()">${n} ${cnt(BUX_CAT[k])}</button>`).join('')}}
 P.querySelectorAll('.grid').forEach(g=>g.classList.add('buxswipe'))}}
// ---------- 网格左右滑动翻页 ----------
function buxPage(grid,dir){const sg=grid.classList.contains('sgrid');let v,n;
 if(sg){const sh=STV==='shared';if(STF.q!=='all'||STF.t!=='all'||STF.s)return;v=sh?'SHP':'STP';n=(sh?ACCT.shared:S.pst).length}
 else{const pg=grid.parentElement&&grid.parentElement.querySelector('.pager');if(!pg||grid.closest('.stash2'))return;v='BGP';n=+((pg.textContent.match(/\/(\d+)页/)||[])[1]||1)}
 const cur=window[v]!==undefined?window[v]:eval(v),nx=Math.max(0,Math.min(n-1,cur+dir));if(nx===cur)return;eval(v+'='+nx);render();if(!window.__NOUI)toast(`第 ${nx+1}/${n} 页`)}
{let sx=0,sy=0,g=null,t0=0;
 document.addEventListener('touchstart',e=>{const t=e.touches[0];g=e.touches.length===1&&e.target.closest&&e.target.closest('#panel .buxswipe');if(g){sx=t.clientX;sy=t.clientY;t0=Date.now()}},{passive:true});
 document.addEventListener('touchend',e=>{if(!g)return;const t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy,G=g;g=null;
  if(Math.abs(dx)>50&&Math.abs(dx)>1.6*Math.abs(dy)&&Date.now()-t0<800){BUX.swiped=Date.now();buxPage(G,dx<0?1:-1)}},{passive:true})}
// ---------- 长按快捷菜单 ----------
function buxUid(cell){const s=cell.getAttribute('onclick')||'';const m=/(?:showItem|depositUid|withdrawUid|qtyUI)\((\d+)/.exec(s);return m?+m[1]:null}
function buxQuick(uid){const f=findItem(uid);if(!f)return;const it=f.it,lk=!!it.lk,b=[];
 b.push(`<button class="btn gold" onclick="showItem(${uid})">${!it.k&&!f.slot&&typeof cmpTarget==='function'&&cmpTarget(it)?'详情 / 对比':'详情'}</button>`);
 if(typeof toggleLock==='function'&&!it.k)b.push(`<button class="btn" onclick="toggleLock(${uid});closeM();render()">${lk?'🔓 解锁':'🔒 锁定'}</button>`);
 if(f.stash){b.push(`<button class="btn" onclick="fromStash(${uid})">取回背包</button>`,`<button class="btn" onclick="stashToStash(${uid})">转到${f.where==='s'?'个人':'共享'}仓库</button>`)}
 else if(!f.slot){b.push(`<button class="btn" onclick="depositUid(${uid},'p')">存个人仓库</button>`,`<button class="btn" onclick="depositUid(${uid},'s')">存共享仓库</button>`);
  if(!lk)b.push(`<button class="btn" onclick="sell(${uid})">出售 ${sellPrice(it)}◈</button>`)}
 modal(`<div class="buxq ipanel"><div class="ih">${itemIcon(it)}<div><b style="color:${itemColor(it)}">${itemName(it)}</b><div class="dim">${f.stash?(f.where==='s'?'共享仓库':'个人仓库'):f.slot?'已装备':'背包'}${lk?' · 已锁定':''}</div></div></div><div class="btns c buxbtns">${b.join('')}<button class="btn" onclick="closeM()">关闭</button></div></div>`)}
{const P=()=>document.getElementById('panel');let x0=0,y0=0;
 const cancel=()=>{if(BUX.lp){clearTimeout(BUX.lp);BUX.lp=null}};
 document.addEventListener('pointerdown',e=>{cancel();BUX.lpFired=0;const c=e.target.closest&&e.target.closest('#panel .cell');if(!c||c.classList.contains('void')||c.classList.contains('empty'))return;const uid=buxUid(c);if(uid==null)return;
  x0=e.clientX;y0=e.clientY;BUX.lp=setTimeout(()=>{BUX.lp=null;BUX.lpFired=Date.now();try{navigator.vibrate&&navigator.vibrate(15)}catch(_){}buxQuick(uid)},480)},true);
 document.addEventListener('pointermove',e=>{if(BUX.lp&&Math.hypot(e.clientX-x0,e.clientY-y0)>10)cancel()},true);
 ['pointerup','pointercancel'].forEach(t=>document.addEventListener(t,cancel,true));
 document.addEventListener('contextmenu',e=>{if(e.target.closest&&e.target.closest('#panel .cell'))e.preventDefault()},true);
 // 长按/滑动后的那次 click 不再触发格子原有动作
 document.addEventListener('click',e=>{const now=Date.now();if((BUX.lpFired&&now-BUX.lpFired<900)||(BUX.swiped&&now-BUX.swiped<400)){if(e.target.closest&&e.target.closest('#panel')){e.preventDefault();e.stopPropagation()}BUX.lpFired=0}},true)}
