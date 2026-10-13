'use strict';
// ===================================================================================
// salvage.js — 自动回收「凹槽底材」条件（包装 loot.js 的 shouldRecycle / ensureLoot / rcyUI，不改他人文件）
// 设置：S.rcy.sk = {n:{weapon,armor,shield,helm} 阈值 0-6（0=关闭），elite:0|1}，缺省全部关闭；随角色存档 JSON（含云同步）保存。
// 规则：自动回收开启时，带凹槽且未镶嵌的灰/白底材（破旧/普通/超强），该部位阈值 N>0：
//   凹槽数 ≥ N → 保留（且「只保留扩展/精英」开启时须为扩展/精英底材）；凹槽数 < N → 回收（覆盖原“带凹槽底材”保护与品质/部位勾选）。
//   锁定物品永不回收。
// ===================================================================================
const SKP=[['weapon','武器'],['armor','护甲'],['shield','盾牌'],['helm','头盔']];
function skDefault(){return{n:{weapon:0,armor:0,shield:0,helm:0},elite:0}}
function skNorm(){if(!S||!S.rcy)return;const d=skDefault();const s=S.rcy.sk&&typeof S.rcy.sk==='object'?S.rcy.sk:{};s.n=Object.assign({},d.n,s.n||{});for(const k in s.n)s.n[k]=Math.max(0,Math.min(6,+s.n[k]||0));s.elite=s.elite?1:0;S.rcy.sk=s}
{const f=ensureLoot;ensureLoot=function(){f.apply(this,arguments);skNorm()}}
function skPart(b){if(!b)return null;if(b.s==='weapon')return'weapon';if(b.s==='armor')return'armor';if(b.s==='shield')return'shield';if(b.s==='helm')return'helm';return null}
// 返回 true=回收 / false=保留 / null=不适用（交给原规则）
function skRule(it){const r=S.rcy;if(!r||!r.on||!r.sk||!it||it.k||it.lk)return null;if(!(it.q<=2)||!it.sock||(it.soc&&it.soc.length)||it.rw!=null)return null;
 const b=BASEM[it.b],p=skPart(b);if(!p)return null;const N=r.sk.n[p]||0;if(!N)return null;
 if(it.sock>=N&&(!r.sk.elite||(b.tier||0)>=1))return false;return true}
{const f=shouldRecycle;shouldRecycle=function(it,isNew){if(it&&it.lk)return false;skNorm();const v=skRule(it);return v==null?f(it,isNew):v}}
{const f=rcyUI;rcyUI=function(){f.apply(this,arguments);if(typeof document==='undefined'||window.__NOUI)return;skNorm();const box=document.querySelector('#modal .gp.rcy');if(!box||box.querySelector('.skrule'))return;
 const sk=S.rcy.sk,hs=[...box.querySelectorAll('h4')].find(h=>/回收所得/.test(h.textContent));
 const row=([k,n])=>`<div class="row skr"><span>${n}：${sk.n[k]?`凹槽 <b>&lt;${sk.n[k]}</b> 回收，≥${sk.n[k]} 保留`:'<span class="dim">关闭</span>'}</span><span><button class="btn xs" onclick="skSet('${k}',-1)">－</button><b class="skn">${sk.n[k]}</b><button class="btn xs" onclick="skSet('${k}',1)">＋</button></span></div>`;
 const h=`<div class="skrule"><h4>凹槽底材（灰/白、未镶嵌）</h4>${SKP.map(row).join('')}
  <div class="btns"><button class="btn xs ${sk.elite?'on':''}" onclick="S.rcy.sk.elite^=1;rcyUI()">只保留扩展/精英底材</button></div>
  <div class="dim">阈值 0=关闭（沿用上方规则）。开启的部位：凹槽数达标保留，不达标回收（不受上方品质/部位/“带凹槽底材”保护影响）。「只保留扩展/精英」开启时普通底材即使达标也回收。锁定物品永不回收。</div></div>`;
 if(hs)hs.insertAdjacentHTML('beforebegin',h);else box.insertAdjacentHTML('beforeend',h)}}
function skSet(k,d){skNorm();S.rcy.sk.n[k]=Math.max(0,Math.min(6,(S.rcy.sk.n[k]||0)+d));if(!window.__NOUI)rcyUI()}
