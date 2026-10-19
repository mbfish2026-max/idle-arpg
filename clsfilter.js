'use strict';
// ===================================================================================
// clsfilter.js — 背包 / 个人仓库 / 共享仓库「职业」筛选（运行时包装 stMatch / renderBag，不改他人文件）
// 适合某职业 = 物品职业集合为空（通用装备）或包含该职业；「仅专属」= 集合包含该职业。职业集合来源：
//  专属底材(ccls)；词缀 tc_<职业><系>、亡灵系别 t0sk..t2sk、单技能 sk_/skd_/nb_e_dbl_/nb_e_cheap_/nb_m_*_<技能>、亡灵流派键 nb_u_/nb_skel…；
//  职业套装(SETS.cls) / 流派套装(SETS.nb → NB.builds.cls)；传说威能(EG_LP.cls，或通用威能作为某流派核心威能 PB.core)。
// 宝石/符文/材料没有职业属性，按通用处理（「仅专属」时隐藏）。状态只在内存（CLF），默认「全部」。
// 界面：仓库=品质/类型下拉框右侧再加一个「职业」下拉框（含「仅专属」分组）；背包=格子上方一行「职业」下拉框。
// ===================================================================================
const CLF={c:'all',only:0};
function clfList(){const L=typeof CLASSES!=='undefined'&&CLASSES.length?CLASSES:Object.keys(CLS_DEF).map(id=>({id}));
 return L.map(c=>({id:c.id,n:(CLS_DEF[c.id]&&CLS_DEF[c.id].n)||c.n||c.id,open:!!CLS_DEF[c.id]}))}
function clfSk(id){const s=typeof SKM!=='undefined'&&SKM[id];return s?(s.cls||'nec'):null}
function clfModCls(k){let m;if(/^t[012]sk$/.test(k))return'nec';if((m=/^tc_([a-z]+)\d$/.exec(k)))return m[1];
 if((m=/^(?:sk|skd)_(.+)$/.exec(k)))return clfSk(m[1]);if((m=/^nb_(?:e_dbl|e_cheap|m_[a-z]+)_(.+)$/.exec(k)))return clfSk(m[1]);
 if(/^nb_(?:u_|skel|pois|bsmana|cekeep|skdr)/.test(k))return'nec';return null}
function clfBuildCls(k){const B=typeof NB!=='undefined'&&NB.builds&&NB.builds[k];return B?(B.cls||'nec'):null}
let CLF_CORE=null;function clfCore(lp){if(!CLF_CORE){CLF_CORE={};if(typeof PB!=='undefined'&&PB.core)for(const b in PB.core){const c=clfBuildCls(b);if(c)for(const p of PB.core[b])(CLF_CORE[p]=CLF_CORE[p]||new Set()).add(c)}}return CLF_CORE[lp]||[]}
function itemClsSet(it){const out=new Set();if(!it||it.k)return out;const b=BASEM[it.b];if(b&&b.ccls)out.add(b.ccls);
 let M=it.m||{};try{M=allMods(it)}catch(e){}for(const k in M){const c=clfModCls(k);if(c)out.add(c)}
 const st=it.set&&typeof SETS!=='undefined'&&SETS[it.set];if(st){if(st.nb){const c=clfBuildCls(st.nb);if(c)out.add(c)}else if(st.cls)out.add(typeof st.cls==='string'?st.cls:'nec')}
 const L=it.lp&&typeof EG_LP!=='undefined'&&EG_LP[it.lp];if(L){if(L.cls&&L.cls!=='*')out.add(L.cls);for(const c of clfCore(it.lp))out.add(c)}
 return out}
function clfOk(it,c=CLF.c,only=CLF.only){if(c==='all')return true;const s=itemClsSet(it);return s.has(c)||(!only&&!s.size)}
function clfSel(){const cur=typeof curCls==='function'?curCls():'',v=CLF.c==='all'?'all':CLF.c+(CLF.only?'!':''),L=clfList();
 const op=(val,n)=>`<option value="${val}" ${v===val?'selected':''}>${n}</option>`,nm=c=>c.n+(c.id===cur?'·当前':'')+(c.open?'':'(未开放)');
 // 一个下拉框：「职业」= 该职业专属 + 通用；「仅专属」分组 = 只看带该职业属性的
 return`<select class="clfsel" title="职业筛选" onchange="const v=this.value;CLF.c=v==='all'?'all':v.replace('!','');CLF.only=v.endsWith('!')?1:0;BGP=0;render()">${op('all','全部职业')}<optgroup label="适合（含通用）">${L.map(c=>op(c.id,nm(c))).join('')}</optgroup><optgroup label="仅专属">${L.map(c=>op(c.id+'!',c.n+'·专属')).join('')}</optgroup></select>`}
// 仓库：叠加到现有筛选（品质/类型/搜索）
{const f=stMatch;stMatch=function(g){return f(g)&&clfOk(g.it)}}
{const f=renderBag;renderBag=function(){const on=CLF.c!=='all',inSt=typeof STV!=='undefined'&&STV!=='bag';
 // 仓库视图：只选了职业时也进入「跨全部页筛选」模式（stash.js 以 STF.s 为真判定，用空 String 对象占位，渲染后复原）
 const s0=STF.s,force=on&&inSt&&STF.q==='all'&&STF.t==='all'&&!STF.s;if(force)STF.s=new String('');
 // 背包视图：渲染期间只给过滤后的背包
 const full=S.bag,fb=on&&!inSt;if(fb)S.bag=full.filter(it=>clfOk(it));
 try{f.apply(this,arguments)}finally{if(fb)S.bag=full;if(force)STF.s=s0}
 if(window.__NOUI)return;const P=document.getElementById('panel');if(!P)return;
 if(fb){const cap=P.querySelector('.buxcap');if(cap){const used=typeof slotsUsed==='function'?slotsUsed(S.bag):S.bag.length;cap.textContent=`${used}/${typeof BAG_SZ!=='undefined'?BAG_SZ:40}`}}
 if(inSt){const t=P.querySelector('.stash2 .sttools');if(t&&!t.querySelector('.clfsel')){t.classList.add('clft');const sel=t.querySelectorAll('select');(sel[sel.length-1]||t.firstChild).insertAdjacentHTML(sel.length?'afterend':'beforebegin',clfSel())}}
 else{const gp=[...P.querySelectorAll('.gp')].find(g=>/背包/.test((g.querySelector('h3')||{}).textContent||''));const grid=gp&&gp.querySelector('.grid');
  if(grid&&!gp.querySelector('.clfrow'))grid.insertAdjacentHTML('beforebegin',`<div class="clfrow"><span>职业</span>${clfSel()}${on?`<span class="dim">${CLF.only?'仅显示专属':'专属 + 通用'}</span>`:''}</div>`)}}}
