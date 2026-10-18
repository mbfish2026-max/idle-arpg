'use strict';
// ===================================================================================
// cubeux.js — 炼金匣界面整理（背包与仓库版共用）：顶部单行分类页签（记住选择 S.cubeTab）、配方说明折叠为「配方说明」、
// 「一键合成所有宝石」：从低到高反复 3 合 1，直到无法再合；不消耗完美宝石、锁定宝石；已镶嵌的宝石不在背包故不受影响。
// 仓库版（stashux.js）打开时仓库物品临时并入背包，本功能同样可用（cube 前缀函数会被 stcWrap 包装）。加载于 stashux.js 之后。
// ===================================================================================
const CUBE_TABS=[['all','全部'],['gem','宝石'],['rune','符文'],['re','重铸升级'],['sock','打孔拆镶'],['etc','其他']];
const CUBE_FN={cubeGem:'gem',cubeRune:'rune',cubeReroll:'re',essReroll:'re',cubeUpgrade:'re',cubeRepair:'re',cubeSocket:'sock',cubeMagSock:'sock',cubeUnsock:'sock'};
const CUBE_HELP={gem:'3 颗同级同色宝石 → 升一级（完美为最高级）。一键合成从碎裂开始逐级合成，不消耗完美宝石与锁定宝石。',
 rune:'符文升级：1~9号 3 枚；10号起 3 枚+指定宝石；21号起 2 枚+指定宝石。'};
function cubeTabOf(fn){const m=/^\s*([A-Za-z0-9_]+)\(/.exec(fn||'');return(m&&CUBE_FN[m[1]])||'etc'}
function cubeGemPlan(){const c={};for(const x of S.bag)if(x&&x.k==='gem'&&x.lv<4&&!x.lk){const k=x.g+x.lv;c[k]=(c[k]||0)+1}return c}
function cubeGemCanAll(){return Object.values(cubeGemPlan()).some(n=>n>=3)}
function cubeGemAll(){const made={};let n=0;
 for(let lv=0;lv<4;lv++)for(const g of Object.keys(GEMS)){const f=x=>x&&x.k==='gem'&&x.g===g&&x.lv===lv&&!x.lk;
  let have=S.bag.filter(f).length;while(have>=3){if(slotsUsed(S.bag)>=BAG_SZ&&!S.bag.some(x=>x&&x.k==='gem'&&x.g===g&&x.lv===lv+1))break;
   takeBag(f,3);S.bag.push({uid:S.uid++,k:'gem',g,lv:lv+1});have-=3;n++;const k=GEMG[lv+1]+GEMS[g].n;made[k]=(made[k]||0)+1}}
 if(!window.__NOUI){toast(n?`合成 ${n} 次：`+Object.entries(made).map(([k,v])=>`${k}×${v}`).join('、'):'没有可合成的宝石（需 3 颗同级同色，完美/锁定除外）');cubeUI();render()}return made}
{const f=cubeUI;cubeUI=function(){const r=f.apply(this,arguments);if(typeof document==='undefined'||window.__NOUI)return r;
 const box=document.querySelector('#modal .gp');if(!box||box.querySelector('.cubetabs'))return r;
 const tab=CUBE_TABS.some(t=>t[0]===S.cubeTab)?S.cubeTab:'all',rows=[...box.querySelectorAll(':scope>.row')],cnt={};
 for(const row of rows){const b=row.querySelector('button[onclick]');const t=cubeTabOf(b&&b.getAttribute('onclick'));row.dataset.ct=t;cnt[t]=(cnt[t]||0)+1;if(tab!=='all'&&t!==tab)row.style.display='none'}
 const help=box.querySelector(':scope>.dim');const hh=help?help.innerHTML:'';if(help)help.remove();
 const tabs=`<div class="cubetabs">${CUBE_TABS.map(([k,n])=>{const c=k==='all'?rows.length:cnt[k]||0;return`<button class="${k===tab?'on':''}" onclick="S.cubeTab='${k}';cubeUI()">${n}${c?`<small>${c}</small>`:''}</button>`}).join('')}</div>`;
 const tip=CUBE_HELP[tab]?`<div class="dim cubetip">${CUBE_HELP[tab]}</div>`:'';
 const gemBtn=(tab==='all'||tab==='gem')&&cubeGemCanAll()?`<div class="btns c"><button class="btn gold" onclick="cubeGemAll()">一键合成所有宝石</button></div>`:'';
 const shown=rows.filter(x=>x.style.display!=='none').length;
 box.insertAdjacentHTML('afterbegin',tabs+`<details class="cubehelp"><summary>配方说明</summary><div class="dim">${hh}</div></details>`+tip+gemBtn+(rows.length&&!shown?'<div class="dim" style="margin:10px 0">此分类暂无可合成的配方</div>':''));return r}}
const _cst=document.createElement('style');_cst.textContent=`
#modal .cubetabs{display:flex;flex-wrap:nowrap;gap:2px;margin:0 0 6px;overflow-x:auto}
#modal .cubetabs>button{flex:1 1 auto;min-width:0;white-space:nowrap;font:inherit;font-size:12px;padding:5px 2px;background:#1a130d;color:#a08a60;border:1px solid #4a3820;border-radius:3px}
#modal .cubetabs>button.on{color:#ffd76a;border-color:#c8a060;background:#2a1d10}
#modal .cubetabs small{margin-left:2px;color:#888;font-size:10px}
#modal .cubehelp{margin:2px 0 6px;font-size:12px}#modal .cubehelp>summary{cursor:pointer;color:#c8a060}
#modal .cubetip{margin:0 0 6px}`;document.head.appendChild(_cst);
