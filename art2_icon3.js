'use strict';
// ===================================================================================
// art2_icon3.js — 美术2：终局/章节/佣兵/回收 emoji → 手绘图标 assets/icon3/<slug>.webp（计划：/workspace/emoji_plan.json）
// 只新增文件，不改他人代码：包装 EG_PAGES[*].render / renderEG / renderMap / log；
// 兜底 MutationObserver 仅观察 #panel #tabs #flog #modal，节流 ≥200ms；无 CSS 动画。
// ===================================================================================
const ICON3_DIR='assets/icon3/';
// 无歧义 emoji：任何受控区域都替换
const ICON3_MAP={'🏆':'trophy','✔':'check','✓':'check','○':'pending','✘':'cross','◈':'gold','🔒':'lock','🔓':'unlock','🔮':'rift_key','⏳':'timer',
 '✸':'legendary_power','🍄':'secret','📜':'secret_scroll','❗':'quest_new','◇':'quest_part','✺':'merc_aura','↺':'merc_recall','🎁':'cache','🧰':'cache_big'};
// 有歧义 emoji：只在对应终局页（按 EG 页 key）替换
const ICON3_CTX={bounty:{'⚔':'bounty_kill','🔥':'bounty_clear','☠':'bounty_boss'},
 para:{'◆':'para_core','⚔':'para_atk','⛨':'para_def','⌛':'para_idle'},
 event:{'🗿':'world_boss'},
 secret:{'🦯':'secret_staff','🟣':'mon_sporer','🐸':'mon_hopper','👑':'mon_shroomking'}};
function ic3(slug,e){return`<img class="ic3" src="${ICON3_DIR}${slug}.webp" alt="${e||''}" draggable="false">`}
function icon3Re(m){return new RegExp('('+Object.keys(m).sort((a,b)=>b.length-a.length).map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')\\uFE0F?','gu')}
const ICON3_RE=icon3Re(ICON3_MAP),ICON3_CRE={};for(const k in ICON3_CTX)ICON3_CRE[k]=icon3Re(ICON3_CTX[k]);
// HTML 字符串替换（emoji 只出现在文本里，不在属性中）
function icon3Html(h,ctx){if(typeof h!=='string')return h;
 if(ctx&&ICON3_CRE[ctx])h=h.replace(ICON3_CRE[ctx],(m,e)=>ic3(ICON3_CTX[ctx][e],e));
 return h.replace(ICON3_RE,(m,e)=>ic3(ICON3_MAP[e],e))}
// DOM 文本节点替换（兜底）：跳过怪物占位 .glyph / 技能 .ski / 输入框
function icon3Scan(root,ctx){if(!root)return;const re=ctx&&ICON3_CRE[ctx]?[ICON3_CRE[ctx],ICON3_CTX[ctx]]:null;
 const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>{const p=n.parentNode;
  if(!p||p.closest('.glyph,.ski,script,style,textarea,input,[contenteditable]'))return NodeFilter.FILTER_REJECT;
  ICON3_RE.lastIndex=0;const hit=ICON3_RE.test(n.data)||(re&&(re[0].lastIndex=0,re[0].test(n.data)));return hit?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP}});
 const L=[];while(w.nextNode())L.push(w.currentNode);
 for(const n of L){const esc=n.data.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');const h=icon3Html(esc,ctx);
  const t=document.createElement('template');t.innerHTML=h;n.parentNode.replaceChild(t.content,n)}}
// 底部导航：只换终局/佣兵两个按钮的图标（不碰战斗/角色/技能等其他按钮）
function icon3Tabs(){const T={eg:'tab_endgame',merc:'tab_merc'};for(const k in T){const i=document.querySelector(`#tabs button[data-t=${k}]>i`);
 if(i&&!i.querySelector('.ic3'))i.innerHTML=ic3(T[k],i.textContent.trim())}}
// 巅峰等级角标（eg_para.js 在角色等级旁插入 <small style="color:#c0a0ff">✦N</small>）
function icon3Para(root){(root||document).querySelectorAll('small[style*="c0a0ff"]').forEach(s=>{const n=s.firstChild;
 if(n&&n.nodeType===3&&n.data.startsWith('✦'))s.innerHTML=ic3('paragon','✦')+n.data.slice(1)})}
// ---------- 包装 ----------
if(typeof EG_PAGES!=='undefined')for(const p of EG_PAGES){const r=p.render;if(typeof r==='function'&&!r._ic3){p.render=function(){return icon3Html(r.apply(this,arguments),p.k)};p.render._ic3=1}}
if(typeof renderEG==='function'){const _r=renderEG;renderEG=function(){const v=_r.apply(this,arguments);icon3Scan(document.getElementById('panel'));icon3Para();return v}}
if(typeof renderMap==='function'){const _r=renderMap;renderMap=function(){const v=_r.apply(this,arguments);icon3Scan(document.getElementById('panel'));return v}}
if(typeof log==='function'){const _l=log;log=function(h){return _l.call(this,icon3Html(h))}}
// ---------- 秘径蘑菇怪立绘（原只有 emoji 占位）----------
{const P={m_shroom:'secret',m_sporer:'mon_sporer',m_hopper:'mon_hopper',b_shroomking:'mon_shroomking'};
 if(typeof ASSETS!=='undefined')for(const k in P){ASSETS[k]=ICON3_DIR+P[k]+'.webp';if(typeof IMG!=='undefined')IMG[k]=ASSETS[k]}}
// ---------- 兜底 Observer：只观察 4 个容器，200ms 节流 ----------
{let tm=0;const run=()=>{tm=0;const eg=typeof TAB!=='undefined'&&TAB==='eg'&&typeof EGT!=='undefined'?EGT:null;
  icon3Scan(document.getElementById('panel'),eg);icon3Scan(document.getElementById('flog'));icon3Scan(document.getElementById('modal'),eg);icon3Tabs();icon3Para()};
 const go=()=>{if(!tm)tm=setTimeout(run,200)};
 const init=()=>{if(typeof MutationObserver==='undefined')return;const mo=new MutationObserver(go);
  for(const id of ['panel','tabs','flog','modal']){const el=document.getElementById(id);if(el)mo.observe(el,{childList:true,subtree:true})}go()};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init()}
