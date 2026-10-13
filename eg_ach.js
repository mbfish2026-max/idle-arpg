'use strict';
// ===== 7. 功业录（成就）· 称号 · 珍藏图鉴（暗金/套装收集，集齐给小加成） =====
function egCodexAdd(it){if(!it||it.k)return;const c=EG().codex;if(it.q===5&&it.name&&!c.u[egUname(it)]){c.u[egUname(it)]=1;egCodexNew('暗金',egUname(it))}if(it.q===6&&it.name&&!c.s[it.name]){c.s[it.name]=1;egCodexNew('套装',it.name)}}
function egUname(it){return String(it.name).replace(/^亡灵术士的/,'')}
function egCodexNew(t,n){if(EG_BOOTED)log(`<span style="color:#c8a050">图鉴新增${t}：${n}</span>`);calc()}
let EG_BOOTED=0;
egOn('item',egCodexAdd);
function egCodexScan(){const all=[...S.bag,...Object.values(S.eq||{}),...(S.stash||[])];if(S.pst)for(const p of S.pst)all.push(...p);if(typeof ACCT!=='undefined'&&ACCT&&ACCT.shared)for(const p of ACCT.shared)all.push(...p);for(const it of all)egCodexAdd(it)}
function egCodexSetsDone(){const c=EG().codex.s;let n=0;for(const k in SETS){const items=SETITEMS.filter(x=>x.set===k);if(items.length&&items.every(x=>c[x.n]))n++}return n}
egOn('calc',o=>{const c=EG().codex;const nu=Object.keys(c.u).length;o.mf+=Math.floor(nu*EG_CODEX.uMF);const sd=egCodexSetsDone();if(sd)for(const k in o.res)o.res[k]=Math.min(75,o.res[k]+sd*EG_CODEX.setRes)});
egOn('xp',x=>{const c=EG().codex;return UNIQUES.length&&Object.keys(c.u).length>=UNIQUES.length?x*(1+EG_CODEX.allU/100):x});
// 成就判定（每 5 秒）
function egAchCheck(){const e=EG(),st=e.stat;let n=0;for(const a of EG_ACH){if(e.ach[a[0]])continue;const[v,g]=a[3](e,st);if(v>=g){e.ach[a[0]]=Date.now();n++;log(`<b style="color:#ffd76a">🏆 功业达成【${a[1]}】${a[5]?' · 解锁称号「'+a[5]+'」':''}</b>`);toast('功业：'+a[1])}}if(n)egRefresh()}
let EG_achT=0;egOn('sec',()=>{if(++EG_achT%5===0)egAchCheck()});
function egAchPts(){const e=EG();return EG_ACH.reduce((s,a)=>s+(e.ach[a[0]]?a[4]:0),0)}
function egTitles(){const e=EG(),t=EG_ACH.filter(a=>a[5]&&e.ach[a[0]]).map(a=>a[5]);if(e.ach._t)t.push(...Object.keys(e.ach._t));return t}
function egSetTitle(t){EG().title=t||null;egRefresh()}
// 角色页 / 战斗页显示称号
const _eg_rh=renderHero;renderHero=function(){_eg_rh();const t=EG().title;if(t){const h=document.querySelector('#panel .gp h3');if(h)h.insertAdjacentHTML('afterbegin',`<span class="egtitle">「${t}」</span>`)}};
const _eg_rf_t=renderFight;renderFight=function(){_eg_rf_t();const t=EG().title;if(t){const n=document.querySelector('#chero .nm');if(n&&!n.dataset.t){n.dataset.t=1;n.innerHTML=`<small class="egtitle" style="margin:0;display:block;font-size:9px;line-height:10px">${t}</small>`+n.innerHTML}}};
let EG_ACV='ach';
function egAchPage(){const e=EG(),st=e.stat,tl=egTitles();const sub=`<div class="stabs sm"><button class="${EG_ACV==='ach'?'on':''}" onclick="EG_ACV='ach';egRefresh()">功业录</button><button class="${EG_ACV==='cx'?'on':''}" onclick="EG_ACV='cx';egRefresh()">珍藏图鉴</button></div>`;
 if(EG_ACV==='cx'){const c=e.codex,nu=Object.keys(c.u).length,sd=egCodexSetsDone();
  const sets=Object.keys(SETS).map(k=>{const its=SETITEMS.filter(x=>x.set===k),got=its.filter(x=>c.s[x.n]).length;return`<div class="gp"><h3 style="font-size:13px">${SETS[k].n} <span class="r ${got===its.length?'g':'dim'}">${got}/${its.length}</span></h3><div class="egcx">${its.map(x=>`<span class="set ${c.s[x.n]?'ok':''}">${c.s[x.n]?x.n:'？？？'}</span>`).join('')}</div></div>`}).join('');
  return sub+`<div class="gp"><h3>图鉴加成</h3><div class="row"><span>暗金 ${nu}/${UNIQUES.length}</span><b>寻宝 +${Math.floor(nu*EG_CODEX.uMF)}%</b></div><div class="row"><span>集齐套装 ${sd}/${Object.keys(SETS).length}</span><b>全抗 +${sd*EG_CODEX.setRes}</b></div><div class="row"><span>暗金全收集</span><b>${nu>=UNIQUES.length?'经验 +'+EG_CODEX.allU+'%':'未达成'}</b></div><div class="dim">拾取过即收录（含仓库中已有的）。</div></div>
  <div class="gp"><h3>暗金 ${nu}/${UNIQUES.length}</h3><div class="egcx">${UNIQUES.map(u=>`<span class="${c.u[u.n]?'ok':''}">${c.u[u.n]?u.n:'？？？'} <small>Lv${u.lv}</small></span>`).join('')}</div></div>`+sets}
 const done=EG_ACH.filter(a=>e.ach[a[0]]).length;
 return sub+`<div class="gp"><h3>称号 <span class="r dim">${tl.length} 个</span></h3><div class="btns"><button class="btn xs ${!e.title?'on':''}" onclick="egSetTitle()">不显示</button>${tl.map(t=>`<button class="btn xs ${e.title===t?'on':''}" onclick="egSetTitle('${t}')">${t}</button>`).join('')||''}</div>${tl.length?'':'<div class="dim">达成带称号的功业后解锁</div>'}</div>
 <div class="gp"><h3>功业录 <span class="r">${done}/${EG_ACH.length} · ${egAchPts()} 点</span></h3>${EG_ACH.map(a=>{const ok=e.ach[a[0]],[v,g]=a[3](e,st);return`<div class="egach ${ok?'ok':''}"><i>🏆</i><div style="flex:1"><b>${a[1]}</b> <span class="dim">${a[4]}点${a[5]?' · 称号「'+a[5]+'」':''}</span><div class="dim">${a[2]}</div>${ok?'':egPbar(Math.min(v,g),g)}</div><span class="dim">${ok?'✔':fmt(Math.min(v,g))+'/'+fmt(g)}</span></div>`}).join('')}</div>`}
egPage({k:'ach',n:'功业',render:egAchPage});
EG_BOOT.push(()=>{egCodexScan();EG_BOOTED=1;calc();egAchCheck()});
