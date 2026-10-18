'use strict';
// ===================================================================================
// rwx_craft.js — 符文之语详情「找底材合成」：列出身上/背包/个人仓库/共享仓库中合适的白色/精良空孔底材，
// 一键按配方顺序镶嵌（符文取自 背包→个人仓库→共享仓库），走原 doSock 逻辑，结果与手动镶嵌一致。加载于 rwx.js 之后。
// ===================================================================================
const RWC_LOC={eq:'身上',bag:'背包',p:'个人仓库',s:'共享仓库'};
function rwcOk(it,w){if(!it||it.k||it.rw!=null)return false;const b=BASEM[it.b];if(!b||b.jew||!rwCatOk(w,b.cat))return false;
 return(it.q===1||it.q===2)&&it.sock===w.r.length&&!(it.soc&&it.soc.length)}
function rwcCands(wi){const w=RUNEWORDS[wi],out=[],add=(it,loc)=>{if(rwcOk(it,w))out.push({it,loc})};
 for(const k of SLOTS)add(S.eq[k],'eq');for(const it of S.bag)add(it,'bag');for(const p of S.pst||[])for(const it of p)add(it,'p');
 if(typeof ACCT!=='undefined'&&ACCT&&ACCT.shared)for(const p of ACCT.shared)for(const it of p)add(it,'s');return out}
function rwcMissing(w){const own=rwxOwned(),need={};for(const r of w.r)need[r]=(need[r]||0)+1;return Object.keys(need).map(Number).filter(r=>(own[r]||0)<need[r]).map(r=>[r,need[r]-(own[r]||0)])}
// 取一个符文到背包：背包 → 个人仓库 → 共享仓库；返回 uid
function rwcTake(r,flag){const m=x=>x&&x.k==='rune'&&x.r===r;const b=S.bag.find(m);if(b)return b.uid;
 for(const[P,sh]of[[S.pst||[],0],[(typeof ACCT!=='undefined'&&ACCT&&ACCT.shared)||[],1]])for(const p of P){const i=p.findIndex(m);if(i>=0){const x=p.splice(i,1)[0];S.bag.push(x);if(sh)flag.sh=1;return x.uid}}return null}
function rwcReq(it){const q=itemReq(it);if(typeof q!=='object')return'等级'+q;return'等级'+q.lv+(q.str?' 力量'+q.str:'')+(q.dex?' 敏捷'+q.dex:'')}
let RWC={wi:0,uid:null};
function rwcItemHtml(uid){// 复用原物品详情渲染，去掉按钮与附加段
 const m=$('#modal'),keep=m.innerHTML,hid=m.classList.contains('hide');showItem(uid);const d=document.createElement('div');d.innerHTML=m.innerHTML;m.innerHTML=keep;if(hid)m.classList.add('hide');
 d.querySelectorAll('.btns,button,.rwxin').forEach(e=>e.remove());const p=d.querySelector('.ipanel');return p?p.innerHTML:''}
function rwcOpen(wi,uid){RWC.wi=wi;const w=RUNEWORDS[wi],L=rwcCands(wi);if(uid===undefined)uid=L.length?L[0].it.uid:null;RWC.uid=uid;
 const miss=rwcMissing(w),sel=L.find(x=>x.it.uid===uid);
 const rows=L.map(({it,loc})=>`<div class="rwcrow ${it.uid===uid?'on':''}" onclick="rwcOpen(${wi},${it.uid})"><b style="color:${itemColor(it)}">${itemName(it)}</b><span class="rwctag t${loc}">${RWC_LOC[loc]}</span><span class="dim">${it.sock}孔 · 需求${rwcReq(it)}</span></div>`).join('');
 const empty=`<div class="rwcempty">没有合适的底材（需要 ${w.cats.map(c=>CATN[c]||c).join('/')} · 恰好 ${w.r.length} 个空孔 · 白色/精良）。<br>请查看下方「底材在哪里打」。</div>`;
 const rune=`<div class="sec"><h4>【所需符文（按顺序）】</h4>${w.r.map(r=>`<span class="rwxr ${miss.some(x=>x[0]===r)?'':'have'}">${RUNES[r][0]}</span>`).join('')}${miss.length?`<div class="rwcmiss">缺少：${miss.map(([r,n])=>RUNES[r][0]+'×'+n).join('、')}</div>`:''}</div>`;
 const can=sel&&!miss.length;
 modal(`<div class="ipanel rwcd"><div class="ih"><div><b class="uq">「${w.n}」找底材合成</b><div class="dim">${w.cats.map(c=>CATN[c]||c).join('/')} · ${w.r.length}孔 · 需求等级 ${w.lv}</div></div></div>
 <div class="sec"><h4>【可用底材 ${L.length}】</h4>${rows||empty}</div>${sel?`<div class="sec rwcsel">${rwcItemHtml(uid)}</div>`:''}${rune}${L.length?'':`<div class="sec"><h4>【底材在哪里打】</h4>${rwxBaseHtml(w,w.cats.length===1)}</div>`}
 <div class="btns c rwcb"><button class="btn" onclick="rwxShow(${wi})">返回</button><button class="btn gold" ${can?'':'disabled'} onclick="rwcCraft(${wi},${uid})">合成</button></div></div>`)}
function rwcCraft(wi,uid,noConfirm){const w=RUNEWORDS[wi],c=rwcCands(wi).find(x=>x.it.uid===uid);if(!c||rwcMissing(w).length)return false;
 if(!noConfirm&&!confirm(`将 ${w.r.map(r=>RUNES[r][0]).join('+')} 按顺序镶入「${itemName(c.it)}」（${RWC_LOC[c.loc]}），合成「${w.n}」？符文会被消耗。`))return false;
 const flag={sh:c.loc==='s'?1:0};
 for(const r of w.r){const ru=rwcTake(r,flag);if(ru==null)break;doSock(uid,ru)}
 const f=findItem(uid);calc();save();if(flag.sh){if(typeof acctSave==='function')acctSave();if(typeof clSyncSoon==='function')try{clSyncSoon()}catch(e){}}
 if(!window.__NOUI){render();showItem(uid)}return!!(f&&f.it.rw===wi)}
{const f=rwxShow;rwxShow=function(i){f.apply(this,arguments);const box=document.querySelector('#modal .rwxd .btns.c');if(box)box.insertAdjacentHTML('afterbegin',`<button class="btn gold" onclick="rwcOpen(${i})">找底材合成</button>`)}}
(function(){const s=document.createElement('style');s.textContent=`.rwcd{max-width:100%;overflow-x:hidden}.rwcrow{display:flex;flex-wrap:wrap;align-items:center;gap:4px 6px;padding:7px 4px;border-bottom:1px solid rgba(90,70,48,.35);cursor:pointer}
.rwcrow.on{background:rgba(160,112,48,.25);outline:1px solid #a07030}.rwctag{font-size:11px;border-radius:8px;padding:0 6px;border:1px solid #777;color:#ddd}
.rwctag.teq{border-color:#4a8a4a;color:#8f8}.rwctag.tbag{border-color:#8a6a2a;color:#fc6}.rwctag.tp{border-color:#4a6a9a;color:#9cf}.rwctag.ts{border-color:#8a4a9a;color:#e9f}
.rwcmiss{color:#f88;margin-top:4px}.rwcempty{color:#c8b48a;line-height:1.6}.rwcsel{word-break:break-all}.rwcb{flex-wrap:nowrap}.rwcb .btn{flex:1;min-width:0}.btn[disabled]{opacity:.45}
.rwxd .btns.c{flex-wrap:nowrap}.rwxd .btns.c .btn{flex:1;min-width:0}`;document.head.appendChild(s)})();
