'use strict';
// ===================================================================================
// stash.js — 多角色账号存档 / 个人仓库（3 页×48）/ 共享仓库（4 页×48）/ 堆叠显示 / 自动存仓
// 存储：anye_d2_acct = {v,cur,nid,suid,chars:[{id,name,cls,lvl,t}],shared:[[...]...]}；每个角色 anye_d2_ch_<id>（与旧 KEY 同格式）。
// 旧 KEY(anye_d2_v2) 始终是“当前角色”的镜像，因此 game.js/acts.js/items.js 的 load/save 无需改动。
// 堆叠：宝石(同色同级)/符文(同号) 在数组中仍是独立对象（所有旧消耗逻辑天然“一次扣 1”），显示与占格按组合并；
// 材料(k:'mat') 为带数量 n 的单对象。占格 = 组数。
// ===================================================================================
let ACCT_KEY='anye_d2_acct',CH_PRE='anye_d2_ch_',ACCT_NS=null;const PST_PAGES=20,SH_PAGES=20,PAGE_SZ=48,BAG_SZ=400,BAG_PG=48;
let ACCT=null,STV='bag',STP=0,SHP=0,STMOVE=1,ST_RESET=0,BGP=0,STF={q:'all',t:'all',s:''};
function mkPages(n){return Array.from({length:n},()=>[])}
function acctSave(){try{ACCT.t=Date.now();localStorage.setItem(ACCT_KEY,JSON.stringify(ACCT))}catch(e){}}
function acctLoad(){try{ACCT=JSON.parse(localStorage.getItem(ACCT_KEY))}catch(e){ACCT=null}
 if(!ACCT||ACCT.v!==1){ACCT={v:1,cur:1,nid:2,suid:1e9,chars:[{id:1,name:'亡灵术士',cls:'亡灵术士',lvl:1,t:Date.now()}],shared:mkPages(SH_PAGES)};
  const old=ACCT_NS?null:localStorage.getItem(KEY);if(old){localStorage.setItem(CH_PRE+1,old);try{const o=JSON.parse(old);ACCT.chars[0].lvl=o.lvl||1}catch(e){}}acctSave()}
 while(ACCT.shared.length<SH_PAGES)ACCT.shared.push([]);if(!ACCT.chars.length)ACCT.chars.push({id:ACCT.nid++,name:'亡灵术士',cls:'亡灵术士',lvl:1,t:Date.now()});
 for(const p of ACCT.shared)mergeMats(p)}
// 存档命名空间：游客 = 默认 key；登录账号 = key 带 user_id（数据按账号隔离）
function setNS(uid){ACCT_NS=uid||null;ACCT_KEY=uid?'anye_d2_acct@'+uid:'anye_d2_acct';CH_PRE=uid?'anye_d2_ch@'+uid+'_':'anye_d2_ch_'}
function switchNS(uid){if((uid||null)===ACCT_NS)return false;if(S&&ACCT)save();setNS(uid);ACCT=null;resetRuntime();load();S.last=Date.now();calc();H.life=ST.life;H.mana=ST.mana;save();if(!window.__NOUI){closeM();render()}return true}
function curChar(){return ACCT.chars.find(c=>c.id===ACCT.cur)}
// ---------- 堆叠工具 ----------
function stackKey(it){return it.k==='gem'?'g:'+it.g+it.lv:it.k==='rune'?'r:'+it.r:it.k==='mat'?'m:'+it.id:null}
function qtyOf(it){return it.k==='mat'?(it.n||0):1}
function groups(arr){const out=[],idx={};for(const it of arr){const k=stackKey(it);if(k&&idx[k]!=null){out[idx[k]].items.push(it);out[idx[k]].n+=qtyOf(it);continue}if(k)idx[k]=out.length;out.push({k,items:[it],n:qtyOf(it),it})}return out}
function slotsUsed(arr){return groups(arr).length}
function fits(arr,it,cap){const k=stackKey(it);if(k&&arr.some(x=>stackKey(x)===k))return true;return slotsUsed(arr)<cap}
function mergeMats(arr){const m={};for(let i=arr.length-1;i>=0;i--){const x=arr[i];if(x.k!=='mat')continue;if(m[x.id]){m[x.id].n+=x.n||0;arr.splice(i,1)}else m[x.id]=x}for(let i=arr.length-1;i>=0;i--)if(arr[i].k==='mat'&&!(arr[i].n>0))arr.splice(i,1)}
function pushInto(arr,it){if(it.k==='mat'){const e=arr.find(x=>x.k==='mat'&&x.id===it.id);if(e){e.n+=it.n;return}}arr.push(it)}
function bagFits(it){return fits(S.bag,it,BAG_SZ)}
// ---------- 账号 / 角色：load/save 包装 ----------
const _st_load=load;load=function(){acctLoad();const c=curChar()||ACCT.chars[0];ACCT.cur=c.id;const d=localStorage.getItem(CH_PRE+c.id);
 if(d)localStorage.setItem(KEY,d);else localStorage.removeItem(KEY);_st_load();migrateChar(c)};
function migrateChar(c){if(!S.pst){S.pst=mkPages(PST_PAGES);let p=0;for(const it of (S.stash||[])){while(p<PST_PAGES-1&&!fits(S.pst[p],it,PAGE_SZ))p++;S.pst[p].push(it)}S.stash=[]}
 while(S.pst.length<PST_PAGES)S.pst.push([]);if(!S.stash)S.stash=[];drainOld();for(const p of S.pst)mergeMats(p);mergeMats(S.bag);
 S.name=S.name||c.name;S.cid=c.id;S.cls=S.cls||c.cid||'nec';S.mode=S.mode||c.mode||'normal';if(S.eg&&S.eg.season&&S.mode!=='season')S.mode='season';if(S.mode==='season')c.mode='season';if(S.cls!=='nec'&&!S.ci&&typeof clsInit==='function')clsInit();if(!S.ast)S.ast={on:0,dest:'p',t:{gem:1,rune:1,mat:1,jewel:0,charm:0,unique:0,set:0,rare:0,sock:0}}}
function drainOld(){if(S.stash&&S.stash.length){for(const it of S.stash.splice(0)){const p=S.pst.findIndex(pg=>fits(pg,it,PAGE_SZ));(S.pst[p<0?0:p]).push(it)}}}
const _st_save=save;save=function(){if(ST_RESET)return;if(S.pst)drainOld();_st_save();try{const raw=localStorage.getItem(KEY);if(raw)localStorage.setItem(CH_PRE+ACCT.cur,raw);const c=curChar();if(c){c.lvl=S.lvl;c.t=Date.now();c.name=S.name||c.name}acctSave()}catch(e){}};
function resetRuntime(){MON=[];ALLY=[];CORPSE=[];killWin=[];spawnT=2;LOGS.length=0;LOGDIRTY=1;Object.assign(H,{cb:null,abs:0,castT:0,atkT:0,potT:0,mpT:0,curse:0});if(typeof ACX!=='undefined')ACX.mercOn=0}
function switchChar(id){if(!ACCT.chars.some(c=>c.id===id))return false;if(id!==ACCT.cur){save();ACCT.cur=id;acctSave()}resetRuntime();load();S.last=Date.now();calc();H.life=ST.life;H.mana=ST.mana;save();
 if(typeof syncNow==='function')try{syncNow()}catch(e){}
 if(!window.__NOUI){closeM();TAB='hero';render();toast('已切换到 '+S.name)}return true}
const CLASSES=[{id:'nec',n:'亡灵术士',d:'召唤骷髅与魔像、骨矛与诅咒',ic:'☠',open:1},{id:'ama',n:'荒野射手',d:'弓弩与标枪，元素箭矢',ic:'🏹'},{id:'sor',n:'法师',d:'火焰弹/陨石、霜冻新星/寒冰护甲、连锁闪电',ic:'🔮',open:1},
 {id:'pal',n:'圣誓骑士',d:'光环与神圣近战',ic:'🛡'},{id:'bar',n:'野蛮人',d:'猛击/旋风斩、武器精通、战吼与震慑',ic:'🪓',open:1},{id:'ass',n:'影杀刺客',d:'陷阱、武学与暗影',ic:'🗡'},{id:'dru',n:'变形德鲁尔',d:'变身、召唤自然与元素',ic:'🐺'}];
let NEWCLS='nec',NEWMODE='normal';
function newChar(name,cls,mode){cls=cls||'nec';const C=CLASSES.find(c=>c.id===cls);if(!C||!C.open){if(!window.__NOUI)toast('该职业敬请期待');return 0}
 name=(name||'').trim().slice(0,12)||(C.n+ACCT.nid);const id=ACCT.nid++;ACCT.chars.push({id,name,cls:C.n,cid:cls,mode:mode||'normal',lvl:1,t:Date.now()});save();acctSave();
 localStorage.removeItem(CH_PRE+id);switchChar(id);S.name=name;S.cls=cls;S.mode=mode||'normal';save();if(!window.__NOUI)log('新角色 <b>'+name+'</b> 踏上了暮土。');return id}
function deleteChar(id,force){if(ACCT.chars.length<=1){if(!window.__NOUI)toast('至少保留一个角色');return false}const c=ACCT.chars.find(x=>x.id===id);if(!c)return false;
 if(!force&&!confirm(`确定删除角色「${c.name}」？其个人仓库与装备将一并删除（共享仓库不受影响）。`))return false;
 if(id===ACCT.cur){const o=ACCT.chars.find(x=>x.id!==id);switchChar(o.id)}ACCT.chars=ACCT.chars.filter(x=>x.id!==id);localStorage.removeItem(CH_PRE+id);acctSave();if(!window.__NOUI)charUI();return true}
function charUI(){const L=ACCT.chars.map(c=>`<div class="chrow ${c.id===ACCT.cur?'cur':''}"><div class="chic">${(CLASSES.find(x=>x.id===(c.cid||'nec'))||CLASSES[0]).ic}</div><div class="chi"><b>${c.name}</b><div class="dim">${c.cls}${c.mode==='season'?' · 赛季':''} · Lv.${c.id===ACCT.cur?S.lvl:c.lvl} · ${new Date(c.t).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div></div>
 ${c.id===ACCT.cur?'<span class="tag ok">当前</span>':`<button class="btn xs gold" onclick="switchChar(${c.id})">进入</button>`}<button class="btn xs" onclick="deleteChar(${c.id})" ${ACCT.chars.length<=1?'disabled':''}>删除</button></div>`).join('');
 modal(`<div class="mtitle">角色选择</div><div class="gp chsel">${L}<div class="btns c"><button class="btn gold" onclick="newCharUI()">＋ 新建角色</button></div>
 <div class="dim">所有角色共用共享仓库（${SH_PAGES}页×${PAGE_SZ}格）；个人仓库/背包/装备/进度各自独立。${ACCT_NS?'当前为账号存档':'当前为游客存档（仅本机）'}</div><div class="btns c"><button class="btn" onclick="closeM()">关闭</button></div></div>`)}
function newCharUI(){modal(`<div class="mtitle">新建角色</div><div class="gp newcu"><h4>选择职业</h4><div class="clsgrid">${CLASSES.map(c=>`<div class="clsc ${c.open?'':'lock'} ${NEWCLS===c.id?'on':''}" onclick="${c.open?`NEWCLS='${c.id}';newCharUI()`:"toast('敬请期待')"}"><i>${c.ic}</i><b>${c.n}</b><small>${c.open?c.d:'敬请期待'}</small></div>`).join('')}</div>
 <h4>角色名</h4><div class="newch"><input id="chname" maxlength="12" placeholder="最多 12 字"></div>
 <h4>模式</h4><div class="btns"><button class="btn sm ${NEWMODE==='normal'?'on':''}" onclick="NEWMODE='normal';newCharUI()">普通</button><button class="btn sm ${NEWMODE==='season'?'on':''}" onclick="NEWMODE='season';newCharUI()">赛季</button></div><div class="dim">赛季规则后续开放（存档已记录模式字段 mode，可扩展）。</div>
 <div class="btns c"><button class="btn gold" onclick="newChar($('#chname').value,NEWCLS,NEWMODE)">创建</button><button class="btn" onclick="charUI()">返回</button></div></div>`)}
// 角色页：显示角色名 + 角色按钮；重置存档只重置当前角色
const _st_hero=renderHero;renderHero=function(){_st_hero();const h=document.querySelector('#panel .gp h3');if(h)h.innerHTML=`${S.name} · `+h.innerHTML+` <button class="btn xs gold r chsw" onclick="charUI()">🔄 切换角色</button>`;
 const b=[...document.querySelectorAll('#panel button')].find(x=>x.textContent==='重置存档');if(b)b.setAttribute('onclick','resetChar()')};
function resetChar(){if(!confirm('确定重置当前角色「'+S.name+'」？（共享仓库保留）'))return;const nm=S.name;ST_RESET=1;localStorage.removeItem(CH_PRE+ACCT.cur);localStorage.removeItem(KEY);ST_RESET=0;resetRuntime();load();S.name=nm;calc();H.life=ST.life;H.mana=ST.mana;save();render()}
// ---------- 查找 / 移动 ----------
const _st_find=findItem;findItem=function(uid){const f=_st_find(uid);if(f)return f;if(!S.pst)return null;
 for(let p=0;p<S.pst.length;p++){const i=S.pst[p].findIndex(x=>x.uid===uid);if(i>=0)return{it:S.pst[p][i],i:null,stash:1,where:'p',pg:p,si:i}}
 for(let p=0;p<ACCT.shared.length;p++){const i=ACCT.shared[p].findIndex(x=>x.uid===uid);if(i>=0)return{it:ACCT.shared[p][i],i:null,stash:1,where:'s',pg:p,si:i}}return null};
function pagesOf(w){return w==='s'?ACCT.shared:S.pst}
function pickPage(w,it,pref){const P=pagesOf(w);const order=[pref,...P.keys()].filter((v,i,a)=>v!=null&&a.indexOf(v)===i);for(const p of order)if(fits(P[p],it,PAGE_SZ))return p;return -1}
// 背包 → 仓库：整组移动（gem/rune 组内全部对象；mat 整体）
function depositUid(uid,w,pref){const i=S.bag.findIndex(x=>x.uid===uid);if(i<0)return false;const it=S.bag[i],k=stackKey(it);
 const p=pickPage(w,it,pref!=null?pref:(w==='s'?SHP:STP));if(p<0){if(!window.__NOUI)toast((w==='s'?'共享':'个人')+'仓库已满');return false}
 const mv=k?S.bag.filter(x=>stackKey(x)===k):[it];S.bag=S.bag.filter(x=>!mv.includes(x));for(const x of mv){if(w==='s')x.uid=ACCT.suid++;pushInto(pagesOf(w)[p],x)}
 calc();save();stRefresh();return true}
// 仓库 → 背包：n 为数量（默认全部）
function withdrawUid(uid,n){const f=findItem(uid);if(!f||!f.stash)return false;const P=pagesOf(f.where)[f.pg],it=f.it,k=stackKey(it);
 if(!bagFits(it)){if(!window.__NOUI)toast('背包已满');return false}
 let mv;if(it.k==='mat'){const q=Math.max(1,Math.min(n||it.n,it.n));if(q>=it.n){P.splice(P.indexOf(it),1);mv=[it]}else{it.n-=q;mv=[{uid:0,k:'mat',id:it.id,n:q}]}}
 else{const all=k?P.filter(x=>stackKey(x)===k):[it];mv=all.slice(0,Math.max(1,Math.min(n||all.length,all.length)));for(const x of mv)P.splice(P.indexOf(x),1)}
 for(const x of mv){x.uid=S.uid++;pushInto(S.bag,x)}calc();save();stRefresh();return true}
function stashToStash(uid){const f=findItem(uid);if(!f||!f.stash)return false;const to=f.where==='s'?'p':'s',it=f.it,P=pagesOf(f.where)[f.pg],k=stackKey(it);const p=pickPage(to,it,to==='s'?SHP:STP);if(p<0){if(!window.__NOUI)toast('目标仓库已满');return false}
 const mv=k?P.filter(x=>stackKey(x)===k):[it];for(const x of mv){P.splice(P.indexOf(x),1);x.uid=to==='s'?ACCT.suid++:S.uid++;pushInto(pagesOf(to)[p],x)}save();stRefresh();return true}
function stRefresh(){if(window.__NOUI)return;closeM();render()}
toStash=function(uid){depositUid(uid,'p')};fromStash=function(uid){const f=findItem(uid);if(f&&stackKey(f.it)&&groupCount(f)>1)return qtyUI(uid);withdrawUid(uid)};
function groupCount(f){const P=pagesOf(f.where)[f.pg],k=stackKey(f.it);return f.it.k==='mat'?f.it.n:P.filter(x=>stackKey(x)===k).length}
function qtyUI(uid){const f=findItem(uid);const n=groupCount(f);modal(`<div class="mtitle">取出 ${itemName(f.it)}</div><div class="gp"><div>共 ${n} 个</div><div class="btns c"><button class="btn" onclick="withdrawUid(${uid},1)">取 1</button><button class="btn gold" onclick="withdrawUid(${uid})">取全部</button></div>
 <div class="newch"><input id="qtyn" type="number" min="1" max="${n}" value="${Math.min(n,3)}"><button class="btn sm" onclick="withdrawUid(${uid},+$('#qtyn').value)">取出数量</button></div><div class="btns c"><button class="btn sm" onclick="stashToStash(${uid})">整组转到${f.where==='s'?'个人':'共享'}仓库</button><button class="btn" onclick="closeM()">关闭</button></div></div>`)}
// 物品详情：仓库内物品按钮
const _st_show=showItem;showItem=function(uid){_st_show(uid);if(window.__NOUI)return;const f=findItem(uid);if(!f)return;const box=document.querySelector('#modal .btns.c');if(!box)return;
 if(f.stash){box.innerHTML=`<button class="btn gold" onclick="fromStash(${uid})">取回背包</button><button class="btn" onclick="stashToStash(${uid})">转到${f.where==='s'?'个人':'共享'}仓库</button><button class="btn" onclick="closeM()">关闭</button>`;return}
 if(f.slot)return;[...box.querySelectorAll('button')].forEach(b=>{if(b.textContent==='存入储物箱')b.textContent='存入个人仓库'});
 if(!box.querySelector('[data-sh]'))box.insertAdjacentHTML('afterbegin',`<button class="btn" data-sh onclick="depositUid(${uid},'s')">存入共享仓库</button>`)};
// ---------- 背包容量（按格）与卸装 ----------
unequip=function(k){if(slotsUsed(S.bag)>=BAG_SZ)return toast('背包已满');S.bag.push(S.eq[k]);delete S.eq[k];calc();closeM();render()};
if(typeof mercUnequip==='function')mercUnequip=function(k){if(slotsUsed(S.bag)>=BAG_SZ)return toast('背包已满');S.bag.push(S.merc.eq[k]);delete S.merc.eq[k];render()};
// ---------- 自动存仓（拾取时；自动回收优先，见 loot.js） ----------
const AST_T={gem:'宝石',rune:'符文',mat:'材料',jewel:'珠宝',charm:'护身符',unique:'暗金',set:'套装',rare:'稀有',sock:'带凹槽底材'};
function astType(it){if(it.k==='gem')return'gem';if(it.k==='rune')return'rune';if(it.k==='mat')return'mat';const b=BASEM[it.b];if(b.s==='jewel')return'jewel';if(b.s==='charm')return'charm';
 if(it.q===5)return'unique';if(it.q===6)return'set';if(it.q===4)return'rare';if(it.sock&&it.q<=2&&it.rw==null)return'sock';return null}
let AST_WARN=0;const STATS={rcy:0,rcyG:0,rcyE:0,ast:0};
function autoStash(it){const a=S.ast;if(!a||!a.on)return false;const t=astType(it);if(!t||!a.t[t])return false;const w=a.dest==='s'?'s':'p';const p=pickPage(w,it,null);
 if(p<0){if(!AST_WARN&&!window.__NOUI){AST_WARN=1;toast('自动存仓：目标仓库已满，物品留在背包');setTimeout(()=>AST_WARN=0,30000)}return false}
 if(w==='s')it.uid=ACCT.suid++;pushInto(pagesOf(w)[p],it);STATS.ast++;return true}
// ---------- 背包页：堆叠格子 + 个人/共享仓库视图（点选移动） ----------
function cellG(g,on){const h=cell(g.it,on);return g.n>1?h.replace(/<\/div>$/,`<b class="qty">${g.n}</b></div>`):h}
function stashTotal(P){return P.reduce((a,p)=>a+slotsUsed(p),0)}
const _st_rb=renderBag;renderBag=function(){if(!S.pst)migrateChar(curChar()||{name:'亡灵术士',id:1});drainOld();const sv=BAGV;BAGV='bag';_st_rb();BAGV=sv;const P=$('#panel');
 P.querySelectorAll('.stabs.bagv').forEach(e=>e.remove());const gps=[...P.querySelectorAll('.gp')];const bagGp=gps.find(g=>/背包/.test(g.querySelector('h3')?.textContent||''))||gps[gps.length-1];
 const h3=bagGp.querySelector('h3');if(h3)h3.innerHTML=h3.innerHTML.replace(/背包 \d+\/40/,`背包 ${slotsUsed(S.bag)}/${BAG_SZ}`);
 const items=S.bag.filter(it=>BAGF==='all'||(BAGF==='eq'?!it.k:!!it.k));const inSt=STV!=='bag';
 const on=it=>inSt&&STMOVE?`depositUid(${it.uid},'${STV==='shared'?'s':'p'}')`:`showItem(${it.uid},'bag')`;
 const bg=groups(items),bpn=Math.max(1,Math.ceil(bg.length/BAG_PG));BGP=Math.min(BGP,bpn-1);const grid=bagGp.querySelector('.grid');
 if(grid){grid.innerHTML=bg.slice(BGP*BAG_PG,(BGP+1)*BAG_PG).map(g=>cellG(g,on(g.it))).join('')||'<div class="dim">空</div>';if(bpn>1)grid.insertAdjacentHTML('afterend',pager('BGP',BGP,bpn))}
 const sb=bagGp.querySelector('.stabs.sm');if(sb)sb.insertAdjacentHTML('beforeend',`<button onclick="sortArr(S.bag);render()">整理</button>`);
 const tabs=`<div class="stabs sm bagv"><button class="${STV==='bag'?'on':''}" onclick="STV='bag';render()">背包</button><button class="${STV==='pst'?'on':''}" onclick="STV='pst';render()">个人仓库 ${stashTotal(S.pst)}/${PST_PAGES*PAGE_SZ}</button><button class="${STV==='shared'?'on':''}" onclick="STV='shared';render()">共享仓库 ${stashTotal(ACCT.shared)}/${SH_PAGES*PAGE_SZ}</button></div>`;
 if(!inSt){bagGp.insertAdjacentHTML('beforebegin',tabs);return}
 if(gps[0]&&gps[0]!==bagGp)gps[0].remove();
 const sh=STV==='shared',Pg=sh?ACCT.shared:S.pst,pi=sh?SHP:STP,page=Pg[pi],flt=STF.q!=='all'||STF.t!=='all'||STF.s,gs=flt?groups(Pg.flat()).filter(stMatch).slice(0,PAGE_SZ*2):groups(page);
 const V=sh?'SHP':'STP';const ptabs=flt?`<span class="dim">筛选结果 ${gs.length} 组（跨全部页，最多显示 ${PAGE_SZ*2}）</span>`:pager(V,pi,Pg.length,i=>slotsUsed(Pg[i]));
 const cells=gs.map(g=>cellG(g,STMOVE?(stackKey(g.it)&&g.n>1?`qtyUI(${g.it.uid})`:`withdrawUid(${g.it.uid})`):`showItem(${g.it.uid})`)).join('')+(flt?'':'<div class="cell void"></div>'.repeat(Math.max(0,PAGE_SZ-gs.length)));
 bagGp.insertAdjacentHTML('beforebegin',tabs+`<div class="gp stash2 ${sh?'shared':''}"><h3>${sh?'共享仓库 <span class="dim">（所有角色可存取）</span>':`个人仓库 <span class="dim">（${S.name}）</span>`}<span class="r"><button class="btn xs ${STMOVE?'on':''}" onclick="STMOVE^=1;render()">点选即移动</button></span></h3>
 ${stTools(sh)}<div class="stabs sm pg">${ptabs}</div><div class="grid sgrid">${cells}</div><div class="dim">${STMOVE?'点仓库物品→取回背包（堆叠可选数量）；点下方背包物品→整组存入本页（本页满则顺延）':'点物品查看详情'}</div></div>`)};

// ---------- 多页 / 整理 / 筛选 / 搜索 ----------
function pager(v,cur,n,cnt){const btn=i=>`<button class="${i===cur?'on':''}" onclick="${v}=${i};render()">${i+1}${cnt?`<small>·${cnt(i)}</small>`:''}</button>`;
 const lo=Math.max(0,Math.min(cur-3,n-7)),hi=Math.min(n,lo+7);let h=`<div class="pager"><button onclick="${v}=Math.max(0,${v}-1);render()" ${cur?'':'disabled'}>◀</button>`;for(let i=lo;i<hi;i++)h+=btn(i);
 return h+`<button onclick="${v}=Math.min(${n-1},${v}+1);render()" ${cur<n-1?'':'disabled'}>▶</button><span class="dim">${cur+1}/${n}页</span></div>`}
function stType(it){if(it.k)return it.k;const b=BASEM[it.b];return b.s==='weapon'?'weapon':b.s}
function stMatch(g){const it=g.it;if(STF.q!=='all'&&(it.k||String(it.rw!=null?8:it.q)!==STF.q))return false;if(STF.t!=='all'&&stType(it)!==STF.t)return false;if(STF.s&&!itemName(it).includes(STF.s))return false;return true}
function stTools(sh){const qs=[['all','全部品质'],...[0,1,2,3,4,5,6,7,8].map(q=>[String(q),QN[q]])],ts=[['all','全部类型'],['weapon','武器'],['shield','副手'],['helm','头盔'],['armor','铠甲'],['gloves','手套'],['belt','腰带'],['boots','鞋'],['ring','戒指'],['amulet','护符'],['charm','护身符'],['jewel','珠宝'],['gem','宝石'],['rune','符文'],['mat','材料']];
 return`<div class="sttools"><select onchange="STF.q=this.value;render()">${qs.map(([k,n])=>`<option value="${k}" ${STF.q===k?'selected':''}>${n}</option>`).join('')}</select><select onchange="STF.t=this.value;render()">${ts.map(([k,n])=>`<option value="${k}" ${STF.t===k?'selected':''}>${n}</option>`).join('')}</select>
 <input placeholder="搜索名称" value="${STF.s.replace(/"/g,'')}" onchange="STF.s=this.value.trim();render()"><button class="btn xs" onclick="sortPages(${sh?'ACCT.shared':'S.pst'});save();render()">整理</button></div>`}
const TORD={weapon:0,shield:1,helm:2,armor:3,gloves:4,belt:5,boots:6,amulet:7,ring:8,charm:9,jewel:10,rune:11,gem:12,mat:13};
function sortKey(it){return[TORD[stType(it)]??20,-(it.rw!=null?8:it.q||0),it.k==='rune'?-it.r:it.k==='gem'?(it.g+(9-it.lv)):itemName(it)]}
function cmpIt(a,b){const x=sortKey(a),y=sortKey(b);for(let i=0;i<3;i++){if(x[i]<y[i])return-1;if(x[i]>y[i])return 1}return 0}
function sortArr(arr){mergeMats(arr);const g=groups(arr).sort((a,b)=>cmpIt(a.it,b.it));arr.length=0;for(const x of g)for(const it of x.items)arr.push(it);return arr}
// 整理：合并全部页、排序后按页容量重新铺排（物品守恒）
function sortPages(P){const all=[];for(const p of P)all.push(...p);sortArr(all);const gs=groups(all);for(const p of P)p.length=0;let pi=0;for(const g of gs){while(pi<P.length-1&&slotsUsed(P[pi])>=PAGE_SZ)pi++;for(const it of g.items)P[pi].push(it)}mergeMatsAll(P)}
function mergeMatsAll(P){for(const p of P)mergeMats(p)}
