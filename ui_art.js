'use strict';
// ui_art.js — UI2 手绘框架的少量 DOM 接入（只替换 emoji / 给炼金匣配方加工匠图标；不改玩法文件）
// 商店「药水/卷轴」行的 🧪💜📜 → assets/ui2/pot_*.webp；炼金匣配方行 → artCraft() 工匠图标（art_map.js）
const UA_CRAFT={cubeGem:'cube',cubeRune:'cube',cubeJewel:'cube',cubePot:'cube',craft:'anvil',craft2:'anvil',cubeUpgrade:'anvil',cubeRepair:'anvil',
 cubeSocket:'socket',cubeMagSock:'socket',cubeReroll:'scroll',essReroll:'ess',recycleNow:'recycle',egLpExtract:'ess'};
function uaFix(){try{
 document.querySelectorAll('#panel .row>button[onclick^="buyPot("]').forEach(b=>{const sp=b.parentNode.firstElementChild;if(!sp||sp.dataset.ua)return;
  const k=(b.getAttribute('onclick').match(/buyPot\('(\w+)'/)||[])[1];const t=sp.firstChild;if(!k||!t||t.nodeType!==3)return;
  t.data=t.data.replace(/^\s*(🧪|💜|📜)\s*/u,'');const i=document.createElement('i');i.className='uapot '+k;sp.insertBefore(i,t);sp.dataset.ua=1});
 const m=document.getElementById('modal');if(m&&!m.classList.contains('hide')&&typeof artCraft==='function'){const tt=m.querySelector('.mtitle');
  if(tt&&tt.textContent.includes('炼金匣'))m.querySelectorAll('.row').forEach(r=>{if(r.dataset.ua)return;const b=r.querySelector('button[onclick]'),sp=r.firstElementChild;if(!b||!sp||sp===b)return;
   const f=(b.getAttribute('onclick').match(/^\s*(\w+)/)||[])[1];const k=UA_CRAFT[f]||'cube';sp.classList.add('uacr');sp.insertAdjacentHTML('afterbegin',artCraft(k));r.dataset.ua=1})}
}catch(e){console.warn('uaFix',e)}}
{let q=0;const go=()=>{q=0;uaFix()};if(typeof MutationObserver!=='undefined'){const mo=new MutationObserver(()=>{if(!q){q=1;requestAnimationFrame(go)}});
 for(const id of ['panel','modal']){const el=document.getElementById(id);if(el)mo.observe(el,{childList:true,subtree:true})}};uaFix()}
