// 上古 / 至臻 品质 + 属性品质% / 完美 标识（运行时包装，不改共享文件）
// it.anc=1 上古（区间整体上移 20%，下限抬到原上限 60%），it.anc=2 至臻（全满）
const ANC={P_HELL:0.05,P_MJ0:0.05,P_MJL:0.001,P_MAX:0.12,P_TOP:0.02,TOP_L:30,
 SKIP:/^(allsk|sk_|skd_|tc_|t\dsk|nb_)/,N:['','上古','至臻'],C:['','#e8b84a','#ff4a3a']};
let _ancMap=null;
function ancDef(it){if(!it||it.k||(it.q!==5&&it.q!==6)||!it.name)return null;
 if(!_ancMap){_ancMap={};for(const u of (typeof UNIQUES!=='undefined'?UNIQUES:[]))_ancMap['5|'+u.n]=u;for(const u of (typeof SETITEMS!=='undefined'?SETITEMS:[]))_ancMap['6|'+u.n]=u}
 return _ancMap[it.q+'|'+it.name]||null}
// 返回该物品当前生效区间 {k:[lo,hi]}
function ancRanges(it){const d=ancDef(it);if(!d||!d.m)return{};const o={};
 for(const k in d.m){const v=d.m[k];if(!Array.isArray(v)||typeof v[0]!=='number'||v[1]<=v[0])continue;let lo=v[0],hi=v[1];
  if(it.anc&&lo>=0&&!ANC.SKIP.test(k)){const nl=Math.max(Math.round(lo*1.2),Math.round(hi*0.6)),nh=Math.max(nl,Math.round(hi*1.2));lo=nl;hi=nh}
  else if(it.anc&&ANC.SKIP.test(k)){/* 技能等级不上移，只抬到上限 */lo=hi}
  o[k]=[lo,hi]}return o}
// 属性品质：区间内归一位置平均；无区间返回 null
function ancQual(it){const r=ancRanges(it),m=it&&it.m||{};let s=0,n=0;
 for(const k in r){const[lo,hi]=r[k];const v=m[k];if(typeof v!=='number')continue;n++;s+=hi>lo?Math.max(0,Math.min(1,(v-lo)/(hi-lo))):(v>=hi?1:0)}
 return n?s/n:null}
function ancApply(it,lv){if(!it||it.k||(it.q!==5&&it.q!==6)||it.anc)return it;const d=ancDef(it);if(!d)return it;
 it.anc=lv;const r=ancRanges(it);it.m=it.m||{};
 for(const k in r){const[lo,hi]=r[k];it.m[k]=lv===2?hi:R(lo,hi)}return it}
function ancChance(){if(typeof S!=='object'||!S)return[0,0];const mj=typeof EGM!=='undefined'&&EGM&&EGM.k==='mj';
 if(mj){const L=EGM.L||0;return[Math.min(ANC.P_MAX,ANC.P_MJ0+ANC.P_MJL*L),L>=ANC.TOP_L?ANC.P_TOP:0]}
 return S.diff===2?[ANC.P_HELL,0]:[0,0]}
{const f=genItem;genItem=function(){const it=f.apply(this,arguments);try{if(it&&!it.k&&(it.q===5||it.q===6)&&!it.anc){const[p,t]=ancChance();if(p&&rnd()<p)ancApply(it,t&&rnd()<t?2:1)}}catch(e){console.warn(e)}return it}}
// 名字前缀（图鉴仍用 it.name，不受影响）
{const f=itemName;itemName=function(it){const n=f(it);return it&&it.anc&&ANC.N[it.anc]?ANC.N[it.anc]+'·'+n:n}}
// 格子边框
{const f=cell;cell=function(it,on){const h=f(it,on);return it&&it.anc?h.replace('class="cell ',`class="cell anc${it.anc} `):h}}
// 战力加成
{const f=power;power=function(it){const p=f(it);return it&&it.anc&&p!==Infinity?p+(it.anc===2?120:40):p}}
// 回收保护（默认开）
{const f=shouldRecycle;shouldRecycle=function(it,isNew){if(it&&it.anc&&S.rcy&&S.rcy.keepAnc!==0)return false;return f(it,isNew)}}
// 「保留上古」开关并入天光（tianguang.js）的「至少保留」行
// 详情：属性品质 / 完美
function ancTag(it){const q=ancQual(it);if(q==null&&!it.anc)return'';const pf=q!=null&&q>=0.9999;
 return`<div class="sec anctag">${it.anc?`<b class="ancq anc${it.anc}">${ANC.N[it.anc]}品质</b>`:''}${q!=null?`<span class="ancp">属性品质 ${Math.round(q*100)}%</span>`:''}${pf?'<b class="ancpf">完美</b>':''}</div>`}
{const f=showItem;showItem=function(uid){const r=f.apply(this,arguments);try{const fi=findItem(uid),it=fi&&fi.it;if(it&&!it.k){const p=document.querySelector('#modal .ipanel');
 if(p&&!p.querySelector('.anctag')){const b=p.querySelector('.btns');const h=ancTag(it);if(h){if(b)b.insertAdjacentHTML('beforebegin',h);else p.insertAdjacentHTML('beforeend',h)}}}}catch(e){console.warn(e)}return r}}
