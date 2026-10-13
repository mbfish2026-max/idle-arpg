'use strict';
// art2_char.js — 新建角色页：把职业 emoji 换成手绘立绘 assets/char/{id}_portrait.webp（运行时包装 newCharUI，不改他人文件）
const ART2_CHAR={nec:1,ama:1,sor:1,pal:1,bar:1,ass:1,dru:1};
function art2CharUrl(id){return ART2_CHAR[id]?`assets/char/${id}_portrait.webp`:null}
if(typeof newCharUI==='function'){const _a2_nc=newCharUI;newCharUI=function(){const r=_a2_nc.apply(this,arguments);
  try{const cards=document.querySelectorAll('#modal .clsgrid .clsc');cards.forEach((el,i)=>{const C=CLASSES[i];const u=C&&art2CharUrl(C.id);const ic=el.querySelector('i');
   if(!u||!ic||ic.dataset.a2)return;ic.dataset.a2=1;ic.innerHTML=`<img src="${u}" alt="${C.n}" style="width:84px;height:84px;object-fit:contain;display:block;border-radius:4px;background:radial-gradient(circle at 50% 60%,#2a1c14,#0d0907 75%)">`})}catch(e){}
  return r}}
