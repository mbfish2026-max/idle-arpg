'use strict';
// ===================================================================================
// cmp2.js — 装备对比补充：在 compare.js 的「换上后变化」上方加一行紧凑的「角色变化」：
// 试穿计算（临时把物品放进该部位 → calc → 读 ST → 放回 → calc），列出 武器秒伤/生命/防御/四抗/属性/全技能/施法·攻速 的增减（绿+红-），
// 只显示有变化的项。战力（=装备战力合计的变化）仍由 compare.js 显示。戒指对比较弱的那只（沿用 cmpTarget）。加载于 compare.js 之后。
// ===================================================================================
(function(){
if(typeof cmpTarget!=='function')return;
function snap(){const s=ST,r=s.res||{},a=s.attr||{};const avg=((s.wmin||0)+(s.wmax||0))/2;
 return{dps:s.atkT?avg/s.atkT:0,life:s.life||0,mana:s.mana||0,def:s.def||0,fire:r.fire||0,cold:r.cold||0,light:r.light||0,pois:r.pois||0,
  str:a.str||0,dex:a.dex||0,vit:a.vit||0,ene:a.ene||0,allsk:s.allsk||0,fcr:s.fcr||0,ias:s.ias||0}}
const N=[['dps','武器秒伤'],['life','生命'],['mana','法力'],['def','防御'],['fire','火抗'],['cold','冰抗'],['light','电抗'],['pois','毒抗'],
 ['str','力量'],['dex','敏捷'],['vit','体力'],['ene','精力'],['allsk','全技能'],['fcr','施法速度'],['ias','攻击速度']];
function trial(it,cur){const k=SLOTS.find(x=>S.eq[x]===cur);if(!k)return null;let a,b;
 try{calc();a=snap();S.eq[k]=it;calc();b=snap()}finally{S.eq[k]=cur;calc()}
 const out=[];for(const[key,n]of N){const d=Math.round((b[key]-a[key])*10)/10;if(d)out.push([n,d])}return out}
const f=showItem;showItem=function(uid,...r){const ret=f(uid,...r);try{if(window.__NOUI)return ret;const box=document.querySelector('#modal .cmpd');if(!box||box.querySelector('.cmpc'))return ret;
 const F=findItem(uid),it=F&&F.it;const cur=it&&cmpTarget(it);if(!cur||cur===it)return ret;const L=trial(it,cur);if(!L)return ret;
 box.querySelector('h4').insertAdjacentHTML('afterend',`<div class="cmpc"><span class="cmpcl">角色</span>${L.length?L.map(([n,d])=>`<i class="${d>0?'up':'dn'}">${n}${d>0?'+':''}${d}</i>`).join(''):'<i>角色属性无变化</i>'}</div>`)}catch(e){console.warn(e)}return ret};
const st=document.createElement('style');st.textContent=`
#modal .cmpc{display:flex;flex-wrap:wrap;gap:3px 8px;font-size:12px;line-height:1.5;padding:2px 0 5px;margin-bottom:3px;border-bottom:1px solid #3a2a18}
#modal .cmpc i{font-style:normal;color:#aaa;white-space:nowrap}#modal .cmpc i.up{color:#6f6}#modal .cmpc i.dn{color:#f66}
#modal .cmpcl{color:#c8a050}
#modal .btns.cmpbtns{margin-left:0;margin-right:0;max-width:100%;box-sizing:border-box}`;document.head.appendChild(st);
})();
