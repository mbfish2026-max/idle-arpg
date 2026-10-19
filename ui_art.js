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
// 战斗技能栏：默认「智能」字样隐藏（改为按钮 title），其他模式缩成右上角角标，「关」保留（不改 skills.js）
function uaSkb(){try{document.querySelectorAll('#skbar .skb>small').forEach(s=>{const t=s.textContent.trim(),b=s.parentNode;
 if(s.dataset.uat===t)return;s.dataset.uat=t;s.classList.remove('uahide','uatag');
 if(t==='智能'){s.classList.add('uahide');b.title='自动施法：智能'}else if(t==='关'){b.title='自动施法：关'}else{s.classList.add('uatag');b.title='自动施法：'+t}})}catch(e){console.warn('uaSkb',e)}}
{let q=0,lt=0;const go=()=>{q=0;lt=performance.now();uaSkb()};if(typeof MutationObserver!=='undefined'){new MutationObserver(()=>{if(q)return;q=1;const w=Math.max(0,120-(performance.now()-lt));setTimeout(()=>requestAnimationFrame(go),w)}).observe(document.body,{childList:true,subtree:true})};uaSkb()}
// 首领战：卡片放大在 art.css；这里只做出场一次性震屏 + 暗角叠层 + 名字横幅（节流 MutationObserver，无常驻动画）
{const SEEN=new Set();let q=0,lt=0,vig=null,ban=null;
 const ov=()=>{const fb=document.getElementById('fbattle');if(!fb)return null;
  if(!vig||!vig.isConnected){vig=document.createElement('div');vig.id='uabVig';fb.insertBefore(vig,fb.firstChild)}
  if(!ban||!ban.isConnected){ban=document.createElement('div');ban.id='uabBan';fb.appendChild(ban);
   ban.addEventListener('animationend',()=>{ban.classList.remove('on')})}return fb};
 const once=(el,c,ms)=>{el.classList.remove(c);void el.offsetWidth;el.classList.add(c);const f=()=>{el.classList.remove(c);el.removeEventListener('animationend',f)};el.addEventListener('animationend',f);setTimeout(f,ms)};
 const chk=()=>{q=0;lt=performance.now();try{const g=document.getElementById('mgrid');if(!g||!ov())return;
  const bs=g.querySelectorAll('.mc.boss');vig.classList.toggle('on',bs.length>0);let nw=null;
  bs.forEach(b=>{if(!SEEN.has(b.id)){SEEN.add(b.id);nw=nw||b}});if(SEEN.size>200)SEEN.clear();
  if(nw){once(g,'uab-shake',500);const nm=(nw.querySelector('.nm')||{}).textContent||'';const ab=!!nw.querySelector('img[src*="assets/boss/abyss_"]');
   ban.innerHTML=`<small>${ab?'终 极 首 领':'首 领 降 临'}</small>`;ban.appendChild(document.createTextNode(nm));ban.classList.remove('on');void ban.offsetWidth;ban.classList.add('on')}
 }catch(e){console.warn('uaBoss',e)}};
 const g=document.getElementById('mgrid');if(g&&typeof MutationObserver!=='undefined')new MutationObserver(()=>{if(q)return;q=1;setTimeout(()=>requestAnimationFrame(chk),Math.max(0,150-(performance.now()-lt)))}).observe(g,{childList:true});chk()}
