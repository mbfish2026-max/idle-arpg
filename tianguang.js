// 天光：掉落分级光柱（5 色）+ 顶级 1 行屏顶横幅 + 音效接口 + 简易拾取过滤「至少保留」
// 档位（事件名 → AUDIO.playLootTier）：unique 橙 / set 绿 / ancient 金 / primal 红 / hirune·mythic 紫
// 省电模式（window.PWR_ECO）：不画光柱，只保留横幅与声音。离线结算期间完全静默。
const TG={COL:{unique:'#ff8a1e',set:'#3ccf3c',ancient:'#ffcf3a',primal:'#ff3030',hirune:'#b05cff',mythic:'#b05cff'},
 TAG:{unique:'暗金',set:'套装',ancient:'上古',primal:'至臻',hirune:'高阶符文',mythic:'终极'},
 RANK:{unique:1,set:1,hirune:2,ancient:3,primal:4,mythic:5},TOP:{primal:1,mythic:1,ancient:1},HR:20,busy:0,last:null};
// 物品 → 档位名（null=无天光）
function tgTier(it){if(!it)return null;if(it.k==='rune')return it.r+1>=TG.HR?'hirune':null;if(it.k)return null;
 if(it.myth)return'mythic';if(it.anc===2)return'primal';if(it.anc===1)return'ancient';if(it.q===5)return'unique';if(it.q===6)return'set';return null}
function tgBest(list){let b=null,bt=null;for(const it of list||[]){const t=tgTier(it);if(t&&(!bt||TG.RANK[t]>TG.RANK[bt])){b=it;bt=t}}return bt?{it:b,t:bt}:null}
function tgPillar(t){const fb=document.getElementById('fbattle');if(!fb||document.hidden)return;
 fb.querySelectorAll('.dlbeam,.tgbeam').forEach(e=>e.remove());if(window.PWR_ECO)return;
 const d=document.createElement('div');d.className='tgbeam tg_'+t;d.style.setProperty('--c',TG.COL[t]);d.innerHTML='<i></i><b></b>';fb.appendChild(d);setTimeout(()=>d.remove(),1700)}
function tgBanner(it,t){let d=document.getElementById('tgban');if(d)d.remove();d=document.createElement('div');d.id='tgban';d.className='tg_'+t;d.style.setProperty('--c',TG.COL[t]);
 d.textContent=`✦ ${TG.TAG[t]}掉落：${itemName(it)}`;document.body.appendChild(d);setTimeout(()=>d.remove(),2600)}
function tgSound(t){try{if(typeof AUDIO!=='undefined'&&AUDIO&&typeof AUDIO.playLootTier==='function')return AUDIO.playLootTier(t)}catch(e){}return false}
function tgFire(list){const b=tgBest(list);if(!b)return null;TG.last=b.t;tgPillar(b.t);if(TG.TOP[b.t])tgBanner(b.it,b.t);tgSound(b.t);return b.t}
if(typeof offline==='function'){const f=offline;offline=function(){TG.busy++;try{return f.apply(this,arguments)}finally{TG.busy--}}}
{const f=rollTC;rollTC=function(){const o=f.apply(this,arguments);if(window.__NOUI||TG.busy||typeof document==='undefined')return o;try{tgFire(o)}catch(e){console.warn(e)}return o}}
// ---------- 拾取过滤：至少保留 上古 / 符文≥X / 未收录（一行） ----------
{const f=shouldRecycle;shouldRecycle=function(it,isNew){const r=S.rcy;if(r&&it&&it.k==='rune'&&r.keepHR&&it.r+1>=(r.hrMin||TG.HR))return false;return f(it,isNew)}}
function tgRcyRow(){const r=S.rcy,b=(on,fn,t)=>`<button class="btn xs ${on?'on':''}" onclick="${fn};rcyUI()">${t}</button>`;const x=r.hrMin||TG.HR;
 return`<div class="row tgkeep"><b>至少保留</b><span>${b(r.keepAnc!==0,'S.rcy.keepAnc=S.rcy.keepAnc===0?1:0','上古')}${b(r.keepHR,'S.rcy.keepHR=S.rcy.keepHR?0:1',`符文≥${x}`)}<button class="btn xs" onclick="S.rcy.hrMin=Math.max(1,(S.rcy.hrMin||${TG.HR})-1);rcyUI()">－</button><button class="btn xs" onclick="S.rcy.hrMin=Math.min(33,(S.rcy.hrMin||${TG.HR})+1);rcyUI()">＋</button>${b(r.keepNew,'S.rcy.keepNew^=1','未收录')}</span></div>`}
{const f=rcyUI;rcyUI=function(){f.apply(this,arguments);try{const h=[...document.querySelectorAll('#modal .rcy h4')].find(x=>x.textContent.indexOf('保护')>=0);if(h&&!document.querySelector('#modal .tgkeep'))h.insertAdjacentHTML('beforebegin',tgRcyRow())}catch(e){console.warn(e)}}}
