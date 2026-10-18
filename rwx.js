'use strict';
// ===================================================================================
// rwx.js — 符文之语图鉴（类型/孔数/适合职业筛选 + 排序，记住选择）、底材掉落提示、普通难度前期符文掉率提升
// 全部由数据表推导（RUNEWORDS / BASES / ACTS / mlD / SOCKET_RECIPES / ACT_CAP），不写死。加载于 bagux.js 之后。
// ===================================================================================
const RWX_W=new Set(['wand','dagger','sword','axe','mace','bow','xbow','polearm','spear','staff','jav','throw','orb','abow','ajav']);
const RWX_CLS=[['nec','亡灵'],['bar','野蛮人'],['sor','法师'],['dru','德鲁伊'],['ama','荒野射手'],['pal','圣誓骑士']];
const RWX_GRP={w:['武器',c=>RWX_W.has(c)],armor:['铠甲',c=>c==='armor'],helm:['头盔',c=>c==='helm'||c==='head'],shield:['盾牌',c=>c==='shield'||c==='head'||c==='pshd'],gloves:['手套',c=>c==='gloves'],belt:['腰带',c=>c==='belt'],boots:['靴子',c=>c==='boots']};
// 适合职业：施法向(+技能/FCR/法力/能量) vs 近战向(IAS/ED/CB/LL/压碎…) vs 弓弩；按可用底材类别 + 词缀倾向推导
function rwxScore(w){const m=w.m,has=k=>m[k]!=null;let c=0,me=0;
 for(const k of['allsk','fcr','mana','manapct','ene','mregen','t1sk','sumdmg'])if(has(k))c+=k==='allsk'||k==='fcr'?2:1;
 for(const k in m)if(/^sk_/.test(k))c+=2;
 for(const k of['ias','edmg','cb','ll','ow','ds','ignoredef','mindmg','maxdmg','ar','ml','kb','str','noheal','dex'])if(has(k))me+=k==='ias'||k==='edmg'||k==='cb'||k==='ds'?2:1;return{c,me}}
function rwxClasses(w){if(w._cls)return w._cls;if(w.cats.every(c=>c==='gloves'||c==='belt'||c==='boots'))return w._cls=RWX_CLS.map(x=>x[0]);const{c,me}=rwxScore(w),cats=w.cats,set=new Set(),wc=cats.filter(x=>RWX_W.has(x)),m=w.m;
 const add=(...a)=>a.forEach(x=>set.add(x));
 if(Object.keys(m).some(k=>/^sk_/.test(k))||cats.includes('head'))add('nec');
 if(wc.length){const caster=c>me;
  if(cats.some(x=>x==='bow'||x==='xbow'))add('ama');
  if(cats.some(x=>x==='spear'||x==='polearm'||x==='jav'))add(caster?'dru':'ama');
  if(caster){if(cats.some(x=>['wand','dagger'].includes(x)))add('nec');if(cats.some(x=>['staff','wand','orb','sword','dagger'].includes(x)))add('sor');if(cats.some(x=>['staff','mace'].includes(x)))add('dru');if(cats.some(x=>['sword','mace'].includes(x))||cats.includes('shield'))add('pal')}
  else{if(cats.some(x=>['sword','axe','mace','polearm','spear'].includes(x)))add('bar','pal');if(cats.some(x=>['axe','mace','staff'].includes(x)))add('dru');if(cats.includes('dagger')&&!set.size)add('nec')}
  if(m.undead||m.demon)add('pal')}
 else{if(c>me+1)add('nec','sor','dru','pal');else if(me>c+1)add('bar','pal','ama','dru');else RWX_CLS.forEach(x=>set.add(x[0]))}
 if(!set.size)RWX_CLS.forEach(x=>set.add(x[0]));return w._cls=[...set]}
// 已拥有符文（背包+个人仓库+共享仓库）
function rwxOwned(){const n={};const add=a=>{for(const x of a||[])if(x&&x.k==='rune')n[x.r]=(n[x.r]||0)+1};add(S.bag);for(const p of S.pst||[])add(p);if(typeof ACCT!=='undefined'&&ACCT&&ACCT.shared)for(const p of ACCT.shared)add(p);return n}
function rwxProg(w,own){const need={};for(const r of w.r)need[r]=(need[r]||0)+1;let have=0;for(const r in need)have+=Math.min(need[r],own[r]||0);return have/w.r.length}
function rwxF(){if(!S.rwf)S.rwf={g:'all',n:0,c:typeof curCls==='function'?curCls():'all',s:'lv'};return S.rwf}
function rwxSet(k,v){rwxF()[k]=v;render()}
function rwxList(){const F=rwxF(),own=rwxOwned();let L=RUNEWORDS.map((w,i)=>({w,i,p:rwxProg(w,own)}));
 if(F.g!=='all')L=L.filter(x=>x.w.cats.some(RWX_GRP[F.g][1]));if(F.n)L=L.filter(x=>F.n===6?x.w.r.length>=6:x.w.r.length===F.n);if(F.c!=='all')L=L.filter(x=>rwxClasses(x.w).includes(F.c));
 const S_={lv:(a,b)=>a.w.lv-b.w.lv,n:(a,b)=>a.w.r.length-b.w.r.length||a.w.lv-b.w.lv,p:(a,b)=>b.p-a.p||a.w.lv-b.w.lv,name:(a,b)=>a.w.n.localeCompare(b.w.n,'zh')};L.sort(S_[F.s]||S_.lv);return{L,own}}
function rwxChips(k,opts,cur){return`<div class="rwxch">${opts.map(([v,n])=>`<button class="${String(cur)===String(v)?'on':''}" onclick="rwxSet('${k}',${typeof v==='number'?v:`'${v}'`})">${n}</button>`).join('')}</div>`}
function rwxPanel(){const F=rwxF(),{L,own}=rwxList();
 const head=`<h3>符文之语 <span class="dim">${L.length}/${RUNEWORDS.length} 个</span></h3>`+
 rwxChips('g',[['all','全部'],...Object.entries(RWX_GRP).map(([k,v])=>[k,v[0]])],F.g)+
 rwxChips('n',[[0,'孔数不限'],[1,'1孔'],[2,'2孔'],[3,'3孔'],[4,'4孔'],[5,'5孔'],[6,'6孔']],F.n)+
 rwxChips('c',[['all','全职业'],...RWX_CLS],F.c)+
 `<div class="rwxch"><span class="dim">排序</span>${[['lv','需求等级'],['n','符文数'],['p','可合成优先'],['name','名称']].map(([v,n])=>`<button class="${F.s===v?'on':''}" onclick="rwxSet('s','${v}')">${n}</button>`).join('')}</div>`;
 const rows=L.map(({w,i,p})=>`<div class="rw rwx" onclick="rwxShow(${i})"><b class="uq">${w.n}</b> ${p>=1?'<span class="rwxok">可合成</span>':p>0?`<span class="rwxpg">${Math.round(p*w.r.length)}/${w.r.length}</span>`:''}<span class="dim"> ${w.r.map(r=>`<span class="${own[r]?'g':''}">${RUNES[r][0]}</span>`).join('+')} · ${w.cats.map(c=>CATN[c]||c).join('/')} ${w.r.length}孔 · 需求${w.lv}</span>
 <div class="rwxs">${rwxSum(w)}</div><div class="dim rwxc">${rwxClasses(w).map(c=>RWX_CLS.find(x=>x[0]===c)[1]).join('·')}</div></div>`).join('')||'<div class="dim">没有符合条件的符文之语</div>';return head+rows}
// 列表行内属性摘要（2-4 条关键属性，短标签）
const RWX_SH=[['allsk','+{v}技能'],['t1sk','+{v}技能'],['fcr','施法+{v}%'],['ias','攻速+{v}%'],['edmg','伤害+{v}%'],['cb','压碎{v}%'],['ds','致命{v}%'],['ignoredef','无视防御'],['allres','抗性+{v}'],['ll','吸血{v}%'],['life','生命+{v}'],['lifepct','生命+{v}%'],['mana','法力+{v}'],['manapct','法力+{v}%'],['fhr','受击+{v}%'],['edef','防御+{v}%'],['def','防御+{v}'],['mf','寻宝+{v}%'],['gf','金币+{v}%'],['str','力量+{v}'],['dex','敏捷+{v}'],['vit','体力+{v}'],['ene','能量+{v}'],['mdr','魔伤减免{v}'],['block','格挡+{v}%'],['ow','撕裂{v}%'],['undead','对不死+{v}%'],['demon','对恶魔+{v}%'],['ml','偷法{v}%'],['coldmin','冰伤'],['firemin','火伤'],['lightmax','电伤'],['poisdmg','毒伤'],['freeze','冻结'],['indestr','不可破坏']];
function rwxSum(w){const m=w.m,out=[];const fv=v=>Array.isArray(v)?v[0]+'-'+v[1]:v;
 for(const k in m)if(/^sk_/.test(k)&&out.length<1)out.push((typeof modsTxt==='function'?modsTxt({[k]:m[k]}):k).replace(/\s+/g,''));
 for(const[k,t]of RWX_SH){if(out.length>=4)break;if(m[k]!=null&&!(k==='t1sk'&&m.allsk))out.push(t.replace('{v}',fv(m[k])).replace('+-','-'))}
 if(!out.length&&typeof modsTxt==='function')for(const k of Object.keys(m).slice(0,3))out.push(modsTxt({[k]:m[k]}));return out.join(' · ')}
// ---------- 底材掉落提示 ----------
const RWX_IL=[1,26,41];// maxSock 档位：ilvl≤25 / ≤40 / 其余
function rwxNeedIl(b,n){if(!b.sock)return null;for(let i=0;i<3;i++)if(b.sock[i]>=n)return Math.max(b.q,RWX_IL[i]);return null}
function rwxWhere(il){const out=[];for(let d=0;d<DIFFS.length;d++){let hit=null;ACTS.forEach((A,a)=>{if(hit||A.lock)return;let best=null;A.zones.forEach(z=>{const ml=mlD(z.ml0!=null?z.ml0:z.ml,d);if(ml>=il&&(!best||ml<best[1]))best=[z,ml]});if(best)hit=`${DIFFS[d].n}·第${'一二三四五'[a]}章 ${best[0].n}（怪物等级${best[1]}）起`});if(hit){out.push(hit);if(d===0)break}else if(d===DIFFS.length-1)out.push('当前开放区域无法达到')}
 return out.join('；')}
function rwxShopTxt(il){for(let d=0;d<ACT_CAP.length;d++)for(let a=0;a<ACT_CAP[d].length;a++)if(ACT_CAP[d][a]>=il)return`商店白装货架（${DIFFS[d].n}·第${'一二三四五'[a]}章起，角色等级≥${il}）可能带孔`;return''}
function rwxBases(cat,n){return BASES.filter(b=>!b.jew&&(b.cat===cat||(RW_CATMAP[b.cat]||[]).includes(cat))).map(b=>({b,il:rwxNeedIl(b,n)})).filter(x=>x.il!=null).sort((x,y)=>x.il-y.il)}
function rwxSockSrc(cat){const s=BASEM[(BASES.find(b=>b.cat===cat)||{}).id];const slot=s?(s.s==='weapon'?'weapon':s.s):null;const R=typeof SOCKET_RECIPES!=='undefined'&&SOCKET_RECIPES[slot];
 return['白色/精良底材掉落时 18% 带孔，孔数随机 1~上限（上限由物品等级决定）',R?`炼金匣打孔：${RUNES[R[0]][0]}+${RUNES[R[1]][0]}+完美${(GEMS[R[2]]||{}).n||R[2]}`:'','第五章铁匠任务：白色底材直接打满孔'].filter(Boolean).join('；')}
function rwxBaseHtml(w,open){const n=w.r.length;return w.cats.map(cat=>{const L=rwxBases(cat,n);if(!L.length)return`<details><summary>${CATN[cat]||cat}</summary><div class="dim">没有可开 ${n} 孔的底材</div></details>`;
 const ccls=L[0].b.ccls?`（${(RWX_CLS.find(x=>x[0]===L[0].b.ccls)||[0,''])[1]}专属）`:'';
 return`<details ${open?'open':''}><summary>${CATN[cat]||cat}${ccls} · 最早 ${L[0].b.n}</summary>${L.slice(0,4).map(({b,il})=>`<div class="rwxb"><b>${b.n}</b> <span class="dim">底材等级${b.q} · ${n}孔需物品等级≥${il}</span><div>掉落：${rwxWhere(il)}</div>${rwxShopTxt(il)?`<div class="dim">${rwxShopTxt(il)}</div>`:''}</div>`).join('')}<div class="dim">凹槽来源：${rwxSockSrc(cat)}</div></details>`}).join('')}
function rwxShow(i){const w=RUNEWORDS[i],own=rwxOwned();
 modal(`<div class="ipanel rwxd"><div class="ih"><div><b class="uq">符文之语「${w.n}」</b><div class="dim">${w.cats.map(c=>CATN[c]||c).join('/')} · ${w.r.length}孔 · 需求等级 ${w.lv}</div></div></div>
 <div class="sec"><h4>【配方（按顺序镶嵌）】</h4>${w.r.map(r=>`<span class="rwxr ${own[r]?'have':''}">${RUNES[r][0]}<small>${own[r]?'×'+own[r]:'缺'}</small></span>`).join('')}</div>
 <div class="sec"><h4>【属性】</h4><div class="g">${modsTxt(w.m)}</div></div>
 <div class="sec"><h4>【适合职业】</h4>${rwxClasses(w).map(c=>RWX_CLS.find(x=>x[0]===c)[1]).join('、')}</div>
 <div class="sec"><h4>【底材在哪里打】</h4>${rwxBaseHtml(w,w.cats.length===1)}</div>
 <div class="btns c"><button class="btn" onclick="closeM()">关闭</button></div></div>`)}
// 物品详情（白色/精良底材）：可做的符文之语 + 补孔来源
{const f=showItem;showItem=function(uid){f.apply(this,arguments);if(window.__NOUI)return;const fi=findItem(uid);if(!fi||fi.slot)return;const it=fi.it,b=BASEM[it.b];
 if(!b||it.k||it.rw!=null||!(it.q===1||it.q===2)||!b.sock||(it.soc&&it.soc.length))return;const mx=maxSock(b,it.il),ns=it.sock||0;
 const L=RUNEWORDS.map((w,i)=>({w,i})).filter(({w})=>rwCatOk(w,b.cat)&&(ns?w.r.length===ns:w.r.length<=mx)).sort((x,y)=>x.w.lv-y.w.lv).slice(0,8);if(!L.length&&ns)return;
 const bs=document.querySelectorAll('#modal .btns.c'),box=bs[bs.length-1];if(!box)return;
 box.insertAdjacentHTML('beforebegin',`<div class="sec rwxin"><h4>【底材 · 可做符文之语】</h4>${ns?`<div class="dim">当前 ${ns} 孔</div>`:`<div class="dim">无孔；本物品等级 ${it.il} 最多可开 ${mx} 孔</div>`}
 ${L.map(({w,i})=>`<div class="rwx" onclick="rwxShow(${i})"><b class="uq">${w.n}</b> <span class="dim">${w.r.map(r=>RUNES[r][0]).join('+')} · 需求${w.lv}</span></div>`).join('')||'<div class="dim">该类型暂无符文之语</div>'}
 <div class="dim">凹槽来源：${rwxSockSrc(b.cat)}</div></div>`)}}
{const f=renderSkills;renderSkills=function(){f.apply(this,arguments);if(SKT!==3||window.__NOUI)return;const g=[...document.querySelectorAll('#panel .gp')].find(e=>/符文之语/.test(e.querySelector('h3')?.textContent||''));if(g){g.innerHTML=rwxPanel();g.classList.add('rwxgp')}}}
// ---------- 前期符文掉率（仅普通难度第一~三章，含离线结算：离线同样调用 rollTC） ----------
// 额外独立掷骰：普通怪 0.6% / 精英 6% / 头目 10% / 首领 40% / 章节首领 100%×2；符文 TC 按章节 2/3/4（1~8 号为主，按原版 FALL 回落到更低）
const RWX_ER={tc:[2,3,4],p:{n:0.006,champ:0.06,uniq:0.10,boss:0.40,actboss:1},k:{actboss:2}};
function rwxEarly(m){if((S.diff||0)!==0||(S.act||0)>2||typeof EGM!=='undefined'&&EGM)return[];const t=m.actboss?'actboss':m.boss?'boss':m.fl==='uniq'?'uniq':m.fl==='champ'?'champ':'n';
 const out=[];const p=RWX_ER.p[t]*(t==='n'||t==='champ'?(typeof DENSITY!=='undefined'&&DENSITY.drop||1):1);for(let i=0;i<(RWX_ER.k[t]||1);i++)if(rnd()<p)out.push({uid:S.uid++,k:'rune',r:rollRuneTC(RWX_ER.tc[S.act||0])});return out}
{const f=rollTC;rollTC=function(m){const out=f.apply(this,arguments);try{for(const r of rwxEarly(m))out.push(r)}catch(e){}return out}}
