'use strict';
// ===================================================================================
// upgarrow.js — 装备提升绿箭头：所有物品图标列表（背包/个人仓库/共享仓库/佣兵候选等，凡经 cell0 渲染）
// 若该物品战力 power() 高于「当前查看对象」(佣兵页=佣兵，否则=英雄)同部位已穿戴物品，则在图标右上角显示 ↑。
// 规则：空槽也显示；戒指与两只中较弱者比较（空槽视为最弱）；不能穿戴(职业/等级/属性/佣兵部位限制)不显示；已穿戴物品自身不显示。
// 缓存：每部位已穿戴战力按 (版本号, 对象, S 引用) 缓存；equip/unequip/佣兵换装/换角色/calc(镶嵌/重铸/升级后均会调用) 时版本号+1。
// 运行时包装 cell0，不改列表结构。必须在 merc.js 之后加载。
// ===================================================================================
const UPA={v:0,c:null};
function upaWho(){return typeof TAB!=='undefined'&&TAB==='merc'&&typeof mercUp==='function'&&mercUp()?'merc':'hero'}
function upaBump(){UPA.v++}
function upaCache(){const who=upaWho(),c=UPA.c;if(c&&c.v===UPA.v&&c.who===who&&c.S===S)return c;
 const eq=who==='merc'?S.merc.eq:S.eq,pw={},own=new Set();
 for(const k in eq){const it=eq[k];if(it){own.add(it);pw[k]=power(it)}}
 const ms=who==='merc'&&typeof mercStats==='function'?mercStats():null;
 return UPA.c={v:UPA.v,who,S,eq,pw,own,ms}}
function upaSlot(it,c){const b=BASEM[it.b];if(!b)return null;const s=slotOf(b);
 if(s==='ring'){const a=c.eq.ring1?c.pw.ring1:-Infinity,d=c.eq.ring2?c.pw.ring2:-Infinity;return a<=d?'ring1':'ring2'}return s}
function upaCan(it,k,c){if(c.who==='hero')return canEquip(it);
 if(!mercFits(it,k,S.merc.t))return false;const r=itemReq(it),ms=c.ms;return ms.L>=r.lv&&ms.str>=r.str&&ms.dex>=r.dex}
function isUpgrade(it){try{if(!it||it.k||!BASEM[it.b]||typeof S==='undefined'||!S||!S.eq)return false;const c=upaCache();if(c.own.has(it))return false;
 const k=upaSlot(it,c);if(!k)return false;if(!upaCan(it,k,c))return false;if(!c.eq[k])return true;return power(it)>c.pw[k]}catch(e){return false}}
const _upa_cell0=cell0;cell0=function(it,on){const h=_upa_cell0.apply(this,arguments);return isUpgrade(it)?h.replace(/<\/div>$/,'<i class="upa" title="战力提升">↑</i></div>'):h};
// 失效：包装会改变已穿戴/对象的函数
for(const n of ['calc','equip','unequip','mercEquip','mercUnequip','switchChar','doSock','load']){
 if(typeof globalThis[n]!=='function')continue;const f=globalThis[n];
 globalThis[n]=function(){upaBump();try{return f.apply(this,arguments)}finally{upaBump()}}}
