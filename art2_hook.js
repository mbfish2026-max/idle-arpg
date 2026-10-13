'use strict';
// art2_hook.js — 接入 art2 素材（运行时包装，不修改他人源文件）。依赖 art2_map.js；须在 art_map.js、group.js 之后加载。
// 1) renderFight：精英(champ)/小首领(uniq)卡片换 elite2 立绘   2) spend：施放技能时在目标处播放 fx2 帧动画（rectOf 定位）
// 3) renderMap：地图页顶部显示当前章节 map2 下层缩略图
const ART2_SKFX={bs:'bone_spear',pn:'poison_nova',ce:'corpse_explosion',pe:'corpse_explosion',bp:'bone_prison'};
function art2FxAt(id,p,big){const fb=document.getElementById('fbattle'),n=ART2.fx[id];if(!fb||!p||!n)return;
 const s=big?150:96,d=document.createElement('i');d.className='art2fx';
 d.style.cssText=`position:absolute;left:${p.x-s/2}px;top:${p.y-s/2}px;width:${s}px;height:${s}px;pointer-events:none;z-index:6;background:url(assets/fx2/${id}_strip.webp) 0 0/${n*100}% 100% no-repeat`;
 fb.appendChild(d);let k=0;const tm=setInterval(()=>{k++;if(k>=n){clearInterval(tm);d.remove();return}d.style.backgroundPosition=`${k/(n-1)*100}% 0`},60)}
{const _a2_rf=renderFight;renderFight=function(){_a2_rf();if(typeof document==='undefined'||window.__NOUI||typeof MON==='undefined')return;
  for(const m of MON){if(m.fl!=='champ'&&m.fl!=='uniq')continue;const c=document.getElementById('c'+m.uid);const pt=c&&c.querySelector('.pt');if(!pt)continue;
   const mk=Object.keys(MONS).find(k=>MONS[k].a===m.a)||'';const u=art2Elite(S.act,mk,m.fl);if(!u||pt.dataset.a2===u)continue;
   pt.dataset.a2=u;pt.innerHTML=`<img src="${u}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:4px">`}}}
{const _a2_sp=spend;spend=function(id){_a2_sp(id);try{if(typeof TAB==='undefined'||TAB!=='fight'||typeof document==='undefined'||window.__NOUI)return;
  const s=SKM[id];const fx=ART2_SKFX[id]||(s&&s.kind==='curse'?'curse_aura':null);if(!fx||!ART2.fx[fx])return;
  const live=MON.filter(m=>m.hp>0);if(!live.length)return;const t=live.find(m=>m.boss)||live[0];
  if(fx==='poison_nova'||fx==='curse_aura'){const ps=live.map(m=>rectOf('c'+m.uid)).filter(Boolean);if(!ps.length)return;
   art2FxAt(fx,{x:ps.reduce((a,p)=>a+p.x,0)/ps.length,y:ps.reduce((a,p)=>a+p.y,0)/ps.length},1)}
  else art2FxAt(fx,rectOf('c'+t.uid))}catch(e){}}}
{const _a2_rm=renderMap;renderMap=function(){_a2_rm();const P=document.getElementById('panel');if(!P)return;const ai=typeof MAPA==='number'?MAPA:S.act;
  const L=ART2.map['a'+(ai+1)]||[];if(!L.length)return;const h=`<div class="gp art2map" style="display:flex;gap:4px;overflow-x:auto;padding:4px">${L.map((u,i)=>`<figure style="margin:0;flex:0 0 auto;text-align:center"><img src="${u}" alt="" style="width:110px;height:73px;border-radius:3px;display:block"><figcaption class="dim" style="font-size:10px">下层 ${i+1}</figcaption></figure>`).join('')}</div>`;
  const st=P.querySelector('.stabs');if(st)st.insertAdjacentHTML('afterend',h);else P.insertAdjacentHTML('afterbegin',h)}}
