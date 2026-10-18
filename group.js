'use strict';
// ===================================================================================
// group.js — 战斗画面同种单位合并显示：召唤物(骨仆/骨巫/复生/魔像…)与怪物小兵，每种一个头像 + 右上角「×N」+ 组总血量。
// 运行时包装 renderFight（在其输出 DOM 上合并）与 rectOf（被合并成员的特效/飘字定位到组头像）。不修改他人源文件。
// ===================================================================================
const GRP={alias:{},n:0};
// 分组键：返回 null 表示不参与合并
function grpAllyKey(a){if(a.kind==='merc'||a.hp<=0)return null;return[a.kind,a.sub||'',a.a||'',a.n||''].join('|')}
function grpMonKey(m){if(m.hp<=0||m.boss||m.fl==='uniq'||m.qb)return null;return[m.key||'',m.fl||'',m.n||'',m.lv].join('|')}
function grpApply(list,idp,keyf,root){const gid=root?(id=>root.querySelector('#'+id)):(id=>document.getElementById(id));const groups=new Map();for(const o of list){const k=keyf(o);if(k==null)continue;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(o)}
 for(const arr of groups.values()){if(arr.length<2)continue;const rep=arr.find(o=>gid(idp+o.uid));if(!rep)continue;const el=gid(idp+rep.uid);
  let hp=0,mx=0,hit=0;for(const o of arr){hp+=Math.max(0,o.hp);mx+=o.max||0;if(o.hitT>0)hit=1;if(o===rep)continue;const e=gid(idp+o.uid);if(e)e.remove();GRP.alias[idp+o.uid]=idp+rep.uid}
  const b=el.querySelector('.bar');if(b){const cls=[...b.classList].filter(c=>c!=='bar').join(' ');const nb=bar(hp,mx,cls);if(b.outerHTML!==nb)b.outerHTML=nb}
  if(!el.classList.contains('grp'))el.classList.add('grp');if(hit&&!el.classList.contains('hit'))el.classList.add('hit');if(el.dataset.n!=String(arr.length))el.dataset.n=arr.length;
  const gc=el.querySelector('.gcnt'),gt=`×${arr.length}`;if(gc){if(gc.textContent!==gt)gc.textContent=gt}else el.insertAdjacentHTML('beforeend',`<em class="gcnt">${gt}</em>`)}}
// 省电：在 diff 之前对新 HTML 片段做合并（power.js 调用），避免每次渲染先恢复被合并成员再删除造成的 DOM 抖动
window.grpPre=function(id,frag){if(id==='arow')grpApply(ALLY,'ca',grpAllyKey,frag);else if(id==='mgrid')grpApply(MON,'c',grpMonKey,frag)};
const _grp_rf=renderFight;renderFight=function(){_grp_rf();if(typeof document==='undefined'||window.__NOUI)return;
 if(++GRP.n>400){GRP.n=0;GRP.alias={}}
 try{grpApply(ALLY,'ca',grpAllyKey);grpApply(MON,'c',grpMonKey)}catch(e){console.warn('group.js',e)}};
const _grp_rect=rectOf;rectOf=function(id){const r=_grp_rect(id);if(r||!GRP.alias[id])return r;return _grp_rect(GRP.alias[id])};
