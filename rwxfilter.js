'use strict';
// ===================================================================================
// rwxfilter.js — 符文之语图鉴「可合成·有底材」复选框（运行时包装 rwxList / rwxPanel，不改 rwx.js / rwx_craft.js）
// 勾选后只显示：符文足够（与「找底材合成」同一取符范围：背包→个人仓库→共享仓库，锁定 lk 的符文不计）
//            且有合适底材（复用 rwcCands：白色/精良、类型匹配、恰好 n 个空孔、未镶嵌；锁定 lk 的底材不计）。
// 勾选状态存档于 S.rwf.ok（与其余图鉴筛选同处；旧存档缺省为不勾选）。加载于 rwx_craft.js 之后。
// ===================================================================================
function rwfOwnFree(){const n={};const add=a=>{for(const x of a||[])if(x&&x.k==='rune'&&!x.lk)n[x.r]=(n[x.r]||0)+1};add(S.bag);for(const p of S.pst||[])add(p);
 if(typeof ACCT!=='undefined'&&ACCT&&ACCT.shared)for(const p of ACCT.shared)add(p);return n}
function rwfRunesOk(w,own){const need={};for(const r of w.r)need[r]=(need[r]||0)+1;for(const r in need)if((own[r]||0)<need[r])return false;return true}
function rwfBaseOk(wi){return rwcCands(wi).some(c=>!c.it.lk)}
function rwfCan(wi,own){const w=RUNEWORDS[wi];return rwfRunesOk(w,own||rwfOwnFree())&&rwfBaseOk(wi)}
function rwfToggle(v){rwxF().ok=v?1:0;if(typeof save==='function')save();render()}
{const f=rwxList;rwxList=function(){const r=f.apply(this,arguments);if(rwxF().ok){const own=rwfOwnFree();r.L=r.L.filter(x=>rwfCan(x.i,own))}return r}}
{const f=rwxPanel;rwxPanel=function(){let h=f.apply(this,arguments);const on=!!rwxF().ok;
 const cb=`<label class="rwfck ${on?'on':''}"><input type="checkbox" ${on?' checked ':''} onchange="rwfToggle(this.checked)">可合成·有底材</label>`;
 h=h.replace(/(<div class="rwxch)("><span class="dim">排序<\/span>[\s\S]*?)(<\/div>)/,`$1 rwfrow$2${cb}$3`);
 if(on)h=h.replace('<div class="dim">没有符合条件的符文之语</div>','<div class="dim rwfempty">暂无可合成的符文之语</div>');return h}}
