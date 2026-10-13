'use strict';
// ===================================================================================
// group.js — 战斗画面同种单位合并显示：召唤物(骨仆/骨巫/复生/魔像…)与怪物小兵，每种一个头像 + 右上角「×N」+ 组总血量。
// 运行时包装 renderFight（在其输出 DOM 上合并）与 rectOf（被合并成员的特效/飘字定位到组头像）。不修改他人源文件。
// ===================================================================================
const GRP={alias:{},n:0};
// 分组键：返回 null 表示不参与合并
function grpAllyKey(a){if(a.kind==='merc'||a.hp<=0)return null;return[a.kind,a.sub||'',a.a||'',a.n||''].join('|')}
function grpMonKey(m){if(m.hp<=0||m.boss||m.fl==='uniq'||m.qb)return null;return[m.key||'',m.fl||'',m.n||'',m.lv].join('|')}
function grpApply(list,idp,keyf){const groups=new Map();for(const o of list){const k=keyf(o);if(k==null)continue;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(o)}
 for(const arr of groups.values()){if(arr.length<2)continue;const rep=arr.find(o=>document.getElementById(idp+o.uid));if(!rep)continue;const el=document.getElementById(idp+rep.uid);
  let hp=0,mx=0,hit=0;for(const o of arr){hp+=Math.max(0,o.hp);mx+=o.max||0;if(o.hitT>0)hit=1;if(o===rep)continue;const e=document.getElementById(idp+o.uid);if(e)e.remove();GRP.alias[idp+o.uid]=idp+rep.uid}
  const b=el.querySelector('.bar');if(b){const cls=[...b.classList].filter(c=>c!=='bar').join(' ');b.outerHTML=bar(hp,mx,cls)}
  el.classList.add('grp');if(hit)el.classList.add('hit');el.dataset.n=arr.length;el.insertAdjacentHTML('beforeend',`<em class="gcnt">×${arr.length}</em>`)}}
const _grp_rf=renderFight;renderFight=function(){_grp_rf();if(typeof document==='undefined'||window.__NOUI)return;
 if(++GRP.n>400){GRP.n=0;GRP.alias={}}
 try{grpApply(ALLY,'ca',grpAllyKey);grpApply(MON,'c',grpMonKey)}catch(e){console.warn('group.js',e)}};
const _grp_rect=rectOf;rectOf=function(id){const r=_grp_rect(id);if(r||!GRP.alias[id])return r;return _grp_rect(GRP.alias[id])};
