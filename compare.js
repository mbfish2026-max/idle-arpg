'use strict';
// ===================================================================================
// compare.js — 装备对比：查看未穿戴的装备时，并排显示同部位当前装备，并列出「换上后变化」
// 做法：先用 showItem 渲染已穿戴物品 → 克隆其面板（去掉按钮）→ 再渲染查看的物品 → 两块并排 + 差异表。
// 复用原有详情面板（威能/凹槽/锁定等其他模块的包装都照常生效）。加载于所有 showItem 包装之后。
// 戒指：与两只戒指中战力较低的那只对比（自动换装也替换那只）。
// ===================================================================================
let CMP_BUSY=0;
function cmpTarget(it){const b=BASEM[it.b];if(!b||it.k)return null;let k=slotOf(b);if(!k)return null;
 if(k==='ring'){const a=S.eq.ring1,c=S.eq.ring2;if(!a||!c)return a||c||null;return power(a)<=power(c)?a:c}return S.eq[k]||null}
// 物品的可比较数值：伤害均值/防御/格挡 + 全部词缀（增强伤害/防御等已折算进本地数值）
function cmpStats(it){const b=BASEM[it.b],m=allMods(it),l=itemLocal(it),o={};
 if(l.min!=null)o._dmg=(l.min+l.max)/2;if(l.def!=null)o._def=l.def;if(b.block)o._blk=b.block;
 for(const k in m){if(typeof m[k]!=='number'||['edmg','edef','mindmg','maxdmg'].includes(k)||(k==='def'&&b.def))continue;o[k]=(o[k]||0)+m[k]}return o}
const CMP_N={_dmg:['平均伤害',''],_def:['防御',''],_blk:['格挡',''],lightmax:['闪电伤害(最大)','']};
function cmpLabel(k){if(CMP_N[k])return CMP_N[k];const t=MODT[k];if(!t)return[k,''];if(!t.includes('{v}'))return[t,''];
 return[t.replace(/[+\-]?\{v\}%?/,'').replace(/^[：:\s]+|[：:\s]+$/g,'').replace(/\s+/g,' ').trim()||k,/\{v\}%/.test(t)?'%':'']}
function cmpDiff(nw,cur){const a=cmpStats(nw),b=cmpStats(cur),keys=[...new Set([...Object.keys(a),...Object.keys(b)])];const rows=[];
 const pw=power(nw)-power(cur);rows.push({k:'_pw',n:'战力',d:pw,u:'',top:1});
 for(const k of keys){const d=Math.round(((a[k]||0)-(b[k]||0))*10)/10;if(!d)continue;const[n,u]=cmpLabel(k);rows.push({k,n,d,u,top:k[0]==='_'?1:0})}
 return rows.sort((x,y)=>(y.top-x.top)||(Math.abs(y.d)-Math.abs(x.d)))}
function cmpHtml(rows){const same=rows.length===1&&!rows[0].d;
 return`<div class="cmpd"><h4>【换上后变化】</h4>${same?'<div class="dim">属性完全相同</div>':rows.filter(r=>r.d||r.k==='_pw').map(r=>`<div class="cmpr ${r.d>0?'up':r.d<0?'dn':''}"><span>${r.n}</span><b>${r.d>0?'▲ +':r.d<0?'▼ ':''}${r.d}${r.u}</b></div>`).join('')}</div>`}
{const st=document.createElement('style');st.textContent=`
#modal .cmpw{display:flex;gap:4px;align-items:flex-start}
#modal .cmpw>.ipanel{flex:1 1 0;min-width:0;margin:8px 2px}
#modal .cmpw>.ipanel.cmpcur{order:-1;opacity:.92}
#modal .cmptag{text-align:center;font-size:12px;color:#c8b48a;letter-spacing:2px;margin:-2px 0 6px;border-bottom:1px solid #3a2a18;padding-bottom:4px}
#modal .cmpcur .cmptag{color:#9a8a6a}
@media (max-width:600px){#modal .cmpw .ipanel{font-size:11px;padding:7px 6px}#modal .cmpw .ih{gap:4px}#modal .cmpw .ih .ii{width:34px;height:34px;flex:0 0 34px}#modal .cmpw .sec h4{font-size:11px}}
#modal .cmpd{margin:4px 10px 6px;padding:8px 10px;background:#140e0a;border:1px solid #6b5230;border-radius:4px}
#modal .cmpd h4{margin:0 0 4px;color:#c8a050;font-size:13px}
#modal .cmpr{display:flex;justify-content:space-between;font-size:13px;line-height:1.6;border-bottom:1px dashed #2a2018}
#modal .cmpr.up b{color:#6f6}#modal .cmpr.dn b{color:#f66}#modal .cmpr span{color:#cbb}
#modal .cmpbtns{margin:0 6px 8px}`;document.head.appendChild(st)}
{const f=showItem;showItem=function(uid,...r){if(CMP_BUSY||window.__NOUI)return f(uid,...r);const F=findItem(uid);const it=F&&F.it;
 const cur=it&&!it.k&&!F.slot&&cmpTarget(it);if(!cur||cur===it)return f(uid,...r);
 let clone=null;CMP_BUSY=1;try{f(cur.uid);const p=document.querySelector('#modal .ipanel');if(p){clone=p.cloneNode(true);clone.querySelectorAll('.btns,button').forEach(e=>e.remove());clone.removeAttribute('id')}}finally{CMP_BUSY=0}
 const ret=f(uid,...r);const mb=document.querySelector('#modal .mb'),np=mb&&mb.querySelector('.ipanel');if(!np||!clone)return ret;
 const w=document.createElement('div');w.className='cmpw';np.replaceWith(w);w.appendChild(np);w.appendChild(clone);clone.classList.add('cmpcur');
 np.insertAdjacentHTML('afterbegin','<div class="cmptag">查看中</div>');clone.insertAdjacentHTML('afterbegin','<div class="cmptag">当前装备</div>');
 clone.querySelectorAll('.dim').forEach(e=>{if(/^当前已装备/.test(e.textContent))e.remove()});np.querySelectorAll('.dim').forEach(e=>{if(/^当前已装备/.test(e.textContent))e.remove()});
 w.insertAdjacentHTML('afterend',cmpHtml(cmpDiff(it,cur)));const bt=np.querySelector('.btns.c');if(bt){bt.classList.add('cmpbtns');mb.appendChild(bt)}
 return ret}}
