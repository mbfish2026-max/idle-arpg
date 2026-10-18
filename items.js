'use strict';
// ===================================================================================
// items.js — 装备生成 / 掉落 TC / 镶嵌 / 炼金匣 / 储物箱（覆盖 game.js 中的同名函数）
// 依赖 data.js + data_items.js + game.js；必须在 game.js 之后、init 之前加载
// ===================================================================================

// ---------- 存档兼容 ----------
const _itm_load=load;
load=function(){_itm_load();if(!S.stash)S.stash=[];
 // 法力过紧修正：新角色的初始魔杖改为魔法品质（+10法力 / 法力回复+15%），仅作用于 1 级零经验的新档
 {const w=S.eq.weapon;if(S.lvl===1&&!S.xp&&w&&w.q===1&&!w.af){w.q=3;w.m={mana:10,mregen:15};w.af=['冥想'];w.name='冥想之'+((BASEM[w.b]||{}).n||'魔杖')}}
for(const k of SLOTS)if(S.eq[k]&&!S.eq[k].name&&!S.eq[k].k)S.eq[k].name=(BASEM[S.eq[k].b]||{}).n;
 for(const arr of[S.bag,S.stash])for(const it of arr)if(!it.k&&!BASEM[it.b])it.b=BASES.find(b=>b.s===(it.b||'').replace(/\d.*/,''))?.id||'wand1'};

// 原版式区间在说明中显示为 a-b
modsTxt=function(m){return Object.entries(m).map(([k,v])=>(MODT[k]||k+' {v}').replace('{v}',Array.isArray(v)?v[0]+'-'+v[1]:v).replace('+-','-')).join('，')};
// ---------- 基础工具 ----------
function baseTypes(b){return ITYPES[b.cat]||[]}
function affOk(a,b){const t=baseTypes(b);return a.it.some(x=>t.includes(x))&&!a.ex.some(x=>t.includes(x))}
function ratioRow(b){return b.cls?(b.tier?IRATIO.clsu:IRATIO.cls):(b.tier?IRATIO.uber:IRATIO.norm)}
function effMF(k,mf){if(k==='m'||mf<=10)return mf;const F=MF_DIM[k];return F?Math.floor(mf*F/(mf+F)):0}
// 原版品质检定：返回 rand(chance) 的 chance（<128 成功）；导出给测试使用
function qualityChance(k,ilvl,b,mf,fac){const row=ratioRow(b)[k];let c=Math.floor((row[0]-Math.floor((ilvl-b.q)/row[1]))*128);
 if(k==='u'||k==='s'||k==='r'||k==='m'){c=Math.floor(c*100/(100+effMF(k,mf||0)));if(c<row[2])c=row[2];const f=fac&&fac[k]||0;if(f)c=c-Math.floor(c*f/1024)}
 return Math.max(1,c)}
qRoll=function(k,ilvl,b,mf,fac){return Math.floor(rnd()*qualityChance(k,ilvl,b,mf,fac))<128};
function rollQuality(ilvl,b,mf,fac){if(qRoll('u',ilvl,b,mf,fac))return 5;if(qRoll('s',ilvl,b,mf,fac))return 6;if(qRoll('r',ilvl,b,mf,fac))return 4;if(qRoll('m',ilvl,b,mf,fac))return 3;
 if(qRoll('h',ilvl,b,0,0))return 2;if(qRoll('n',ilvl,b,0,0))return 1;return 0}
maxSock=function(b,ilvl){const s=b.sock;if(!s)return 0;return ilvl<=25?s[0]:ilvl<=40?s[1]:s[2]};
alvlOf=function(ilvl,qlvl){if(qlvl>ilvl)ilvl=qlvl;let a=ilvl<99-Math.floor(qlvl/2)?ilvl-Math.floor(qlvl/2):2*ilvl-99;return clamp(a,1,99)};

// ---------- 词缀 ----------
rollAff=function(list,b,alvl,used){const c=list.filter(a=>a.lv<=alvl&&affOk(a,b)&&!used.has(a.g)&&!(a.m.sockp&&!maxSock(b,99)));if(!c.length)return null;const a=pick(c);used.add(a.g);return a};
applyAff=function(it,a,b,ilvl){for(const k in a.m){const[lo,hi]=a.m[k];const v=R(lo,hi);if(k==='sockp'){it.sock=Math.max(it.sock||0,Math.max(1,Math.min(v,maxSock(b,ilvl))));continue}it.m[k]=(it.m[k]||0)+v}
 it.req=Math.max(it.req||0,a.rq);(it.af=it.af||[]).push(a.n)};
function rollMods(m){const o={};for(const k in m){const v=m[k];o[k]=Array.isArray(v)?R(v[0],v[1]):v}return o}
function staffMods(it,b,ilvl){if(!STAFFMOD_CATS.has(b.cat)||rnd()<0.5)return;const pool=SKILLS.filter(s=>s.r<=Math.max(1,ilvl));const n=rnd()<0.7?1:2;
 for(let i=0;i<n&&pool.length;i++){const s=pool.splice(Math.floor(rnd()*pool.length),1)[0];const v=R(1,ilvl>=24?3:ilvl>=12?2:1);it.m['sk_'+s.id]=(it.m['sk_'+s.id]||0)+v;it.req=Math.max(it.req||0,s.r)}}

// ---------- 底材选择：weapX/armoX 以 3 级为一档，当前档权重最高，向下逐档递减 (近似原版 TC 递归) ----------
pickBase=function(ilvl,slot){const lv=Math.ceil(Math.max(1,ilvl)/3)*3;const c=BASES.filter(b=>!b.jew&&b.q<=lv&&(!slot||b.s===slot));if(!c.length)return BASEM.wand1;
 const isW=b=>b.s==='weapon';const pool=slot?c:(rnd()<0.5?c.filter(isW):c.filter(b=>!isW(b)));
 return wpick(pool.length?pool:c,b=>3*Math.pow(0.55,Math.floor((lv-b.q)/3)))};

// ---------- 物品生成 ----------
genItem=function(ilvl,opt={}){const b=opt.base||pickBase(ilvl,opt.slot);const it=makeBase(b,ilvl),mf=opt.mf||0,fac=opt.fac||(opt.bossMod?{u:opt.bossMod,s:opt.bossMod,r:opt.bossMod,m:1024}:null);
 it.name=b.n;let q=opt.q;if(q==null)q=rollQuality(ilvl,b,mf,fac);if(b.jew&&q<3)q=3;
 if(q===5){const u=UNIQUES.filter(x=>x.b===b.id&&x.lv<=ilvl&&!opt.noUnique);if(u.length){const U=pick(u);it.q=5;it.name=U.n;it.req=U.rq;it.m=rollMods(U.m);finishDefense(it,b);return it}
  q=4;it.dur3=1} // 原版：暗金失败 → 稀有（3 倍耐久）
 if(q===6){const u=SETITEMS.filter(x=>x.b===b.id&&x.lv<=ilvl);if(u.length){const U=pick(u);it.q=6;it.name=U.n;it.set=U.set;it.req=U.rq;it.m=rollMods(U.m);finishDefense(it,b);return it}
  q=3} // 原版：套装失败 → 魔法
 it.q=q;const used=new Set(),al=alvlOf(ilvl,b.q);
 if(q===0){it.name='破旧的'+b.n;if(it.def)it.def=Math.max(1,Math.floor(it.def*0.75));if(it.dmg)it.dmg=it.dmg.map(x=>Math.max(1,Math.floor(x*0.75)))}
 else if(q===1||q===2){it.name=(q===2?'精良的':'')+b.n;if(q===2){if(b.dmg)it.m.edmg=R(5,15);else if(b.def)it.m.edef=R(5,15)}
  if(maxSock(b,ilvl)&&rnd()<0.18)it.sock=R(1,maxSock(b,ilvl))}
 else if(q===3){let p=null,s=null;const r=rnd();if(r<0.75)p=rollAff(PREFIX,b,al,used);if(r>=0.25||!p)s=rollAff(SUFFIX,b,al,used);if(!p&&!s)p=rollAff(PREFIX,b,al,used);
  if(p)applyAff(it,p,b,ilvl);if(s)applyAff(it,s,b,ilvl);staffMods(it,b,ilvl);it.name=(s?(s.dn||s.n):'')+(p?p.n:'')+b.n}
 else if(q===4||q===7){const n=q===7?R(1,4):R(3,6);let np=0,ns=0;
  for(let i=0;i<n*4&&np+ns<n;i++){const wantP=np<3&&(ns>=3||rnd()<0.5);const a=rollAff(wantP?PREFIX:SUFFIX,b,al,used);if(!a)continue;applyAff(it,a,b,ilvl);wantP?np++:ns++}
  it.np=np;it.ns=ns;staffMods(it,b,ilvl);if(q===4)it.name=pick(RARE_A)+pick(RARE_A)+pick(RARE_B[slotOf(b)])}
 finishDefense(it,b);return it};
function finishDefense(it,b){/* 暗金/套装的 def 区间作为本地加成；防御基础值已在 makeBase 生成 */return it}

// ---------- 物品显示 / 需求 ----------
const _itm_itemName=itemName;itemName=function(it){if(it&&!it.k&&it.rw==null&&!it.name)return(BASEM[it.b]||{n:'?'}).n;const nm=_itm_itemName(it);return typeof sufDn==='function'&&it&&!it.k&&nm&&nm[0]==='之'?nm.replace(/^之.(·[小大巨])?/,x=>sufDn(x)):nm};
socketMods=function(it){const b=BASEM[it.b],m={},c=sockCat(b);
 for(const x of it.soc||[]){let e;if(x.g){const G=GEMS[x.g];e=(c==='w'?G.w:c==='s'?G.s:G.a)(x.lv)}else{const r=RUNES[x.r];e=c==='w'?r[2]:(c==='s'&&r[4]?r[4]:r[3])}for(const k in e)m[k]=(m[k]||0)+e[k]}
 if(it.rw!=null){const w=it.rwm||RUNEWORDS[it.rw].m;for(const k in w){const v=Array.isArray(w[k])?w[k][1]:w[k];m[k]=(m[k]||0)+v}}return m};
itemReq=function(it){const b=BASEM[it.b];let l=it.req||0;for(const x of it.soc||[])if(x.r!=null)l=Math.max(l,RUNES[x.r][1]);if(it.rw!=null)l=Math.max(l,RUNEWORDS[it.rw].lv);
 const red=(socketMods(it).reqp||0)/100;const f=(it.q===0?0.8:1)*(1-red);return{lv:l,str:Math.floor((b.str||0)*f),dex:Math.floor((b.dex||0)*f)}};

// ---------- 掉落 ----------
function goodBand(off){return clamp((S.diff||0)*5+(S.act||0)+(off||0),0,14)}
function rollRuneTC(tc){for(let n=tc;n>=1;n--){const lo=2*n-2;const opts=n===17?[[32,1]]:[[lo,3],[lo+1,2]];if(n>1)opts.push(['fall',RUNE_FALL[n]]);const r=wpick(opts,x=>x[1])[0];if(r!=='fall')return r}return 0}
rollRune=function(ml,tc){if(tc==null){const g=GOODT[goodBand(0)].R;const ks=Object.keys(g);tc=ks.length?+ks[ks.length-1]:1}const r=Math.min(RUNES.length-1,rollRuneTC(tc));return{uid:S.uid++,k:'rune',r}};
rollGem=function(ml,band){const G=GOODT[band==null?goodBand(0):band].G;const lv=wpick(G.map((w,i)=>[i,w]),x=>x[1])[0];return{uid:S.uid++,k:'gem',g:pick(Object.keys(GEMS)),lv}};
function rollGood(m,band){const T=GOODT[band];const opts=[['J',T.J*JEWEL_SCALE],['G',T.G.reduce((a,b)=>a+b,0)]];for(const k in T.R)opts.push(['R'+k,T.R[k]]);const e=wpick(opts,x=>x[1])[0];
 if(e==='J')return genItem(m.lv,{base:rnd()<8/12?BASEM.rin:BASEM.amu,mf:ST.mf,fac:m._fac});if(e==='G')return rollGem(m.lv,band);return{uid:S.uid++,k:'rune',r:Math.min(RUNES.length-1,rollRuneTC(+e.slice(1)))}}
function tcOf(m){if(m.actboss)return TCS.actboss;if(m.key==='countess')return TCS.countess;if(m.boss)return TCS.boss;if(m.fl==='uniq')return TCS.uniq;if(m.fl==='champ')return TCS.champ;return TCS.normal}
function rollPicks(m,T,out){m._fac=T.f||null;const band=goodBand(T.gb||0);
 for(let i=0;i<T.pk;i++){const e=wpick([['nd',T.nd],['gold',T.gold],['junk',T.junk],['eq',T.eq],['good',T.good]],x=>x[1])[0];
  if(e==='gold'){const g=Math.round(R(m.lv,4*m.lv+8)*(T.gmul||1)*(1+ST.gf/100));S.gold+=g}
  else if(e==='junk'){const k=wpick([['hp',5],['mp',3],['rej',1],['tp',1]],x=>x[1])[0];S.pot[k]++}
  else if(e==='eq')out.push(genItem(m.lv,{mf:ST.mf,fac:T.f}));
  else if(e==='good')out.push(rollGood(m,band))}}
rollTC=function(m){const T=tcOf(m),out=[];rollPicks(m,T,out);
 if(T.extra)for(let i=0;i<T.extraPk;i++)rollPicks(m,TCS[T.extra],out);
 if(T.pots)for(let i=0;i<T.pots;i++)if(rnd()<0.5)S.pot.hp++;
 if(T.runes){const tc=COUNTESS_RTC[clamp(S.diff||0,0,2)];for(let i=0;i<T.runes;i++)if(rnd()<0.75)out.push({uid:S.uid++,k:'rune',r:rollRuneTC(tc)})}
 return out};

// ---------- 背包 / 出售（addBag 返回是否进入背包） ----------
addBag=function(it){if(it.k==='rune')S.found[it.r]=1;
 if(!it.k&&!it.sock&&S.sell[it.q]&&it.q<3){S.gold+=sellPrice(it);return false}
 if(S.bag.length>=40){S.gold+=sellPrice(it);log('背包已满，自动出售 '+itemName(it));return false}S.bag.push(it);return true};
const _itm_sellPrice=sellPrice;sellPrice=function(it){if(it.k==='rune')return 50*(it.r+1)*(it.r>=10?2:1);return _itm_sellPrice(it)};

// ---------- 离线收益：只列出真正放入背包的物品 ----------
// 离线：按掉落表期望值折算的每只怪金币（与在线 rollPicks 的金币分支一致，不实际掷骰）
function tcGoldExp(m){let g=0;const one=T=>{const w=T.nd+T.gold+T.junk+T.eq+T.good;if(w>0)g+=T.pk*T.gold/w*(5*m.lv+8)/2*(T.gmul||1)};const T=tcOf(m);one(T);if(T.extra)for(let i=0;i<T.extraPk;i++)one(TCS[T.extra]);return g*(1+(ST.gf||0)/100)}
offline=function(){const sec=(Date.now()-S.last)/1000;if(sec<60)return;const t=Math.min(sec,8*3600);const kpm=Math.max(2,S.kpm||4);const kills=Math.floor(kpm*t/60*0.5);if(kills<1)return;
 const z=zoneData();let xp=0,g0=S.gold,got=[],kept=[],sold=0,soldG=0,baseG=0;
 for(let i=0;i<kills;i++){const m=mkMon(pick(z.mons),z.ml);const diff=S.lvl-m.lv;let f=diff>5?([.81,.62,.43,.24][diff-6]??.05):1;xp+=m.exp*f;if(got.length<30)for(const it of rollTC(m))got.push(it);else baseG+=tcGoldExp(m)}
 xp=Math.round(xp);gainXp(xp);baseG=Math.round(baseG);S.gold+=baseG;
 for(const it of got){const g=S.gold;if(addBag(it))kept.push(it);else{sold++;soldG+=S.gold-g}}
 modal(`<div class="mtitle">离线收益</div><div class="gp"><div>离线 ${Math.floor(t/3600)}小时${Math.floor(t%3600/60)}分（上限8小时，效率50%）</div><div>于 <b>${z.n}</b> 击杀 ${kills} 只怪物</div><div>经验 +${fmt(xp)}　金币 +${fmt(S.gold-g0)}${baseG?`<span class="dim">（含击杀金币 ${fmt(baseG)}）</span>`:''}</div>
 ${sold?`<div class="dim">自动出售 ${sold} 件（${soldG}◈）</div>`:''}<div class="grid">${kept.map(it=>cell(it,'')).join('')||'<div class="dim">没有新物品放入背包</div>'}</div><div class="btns c"><button class="btn gold" onclick="closeM()">收下</button></div></div>`)};

// ---------- 储物箱 ----------
let BAGV='bag';
const _itm_findItem=findItem;findItem=function(uid){const f=_itm_findItem(uid);if(f)return f;const i=(S.stash||[]).findIndex(x=>x.uid===uid);return i>=0?{it:S.stash[i],i:null,si:i,stash:1}:null};
function toStash(uid){const i=S.bag.findIndex(x=>x.uid===uid);if(i<0)return;if(S.stash.length>=STASH_SIZE)return toast('储物箱已满');S.stash.push(S.bag.splice(i,1)[0]);closeM();render()}
function fromStash(uid){const i=S.stash.findIndex(x=>x.uid===uid);if(i<0)return;if(S.bag.length>=40)return toast('背包已满');S.bag.push(S.stash.splice(i,1)[0]);closeM();render()}
const _itm_showItem=showItem;
showItem=function(uid){const f=findItem(uid);if(!f)return;_itm_showItem(uid);const box=document.querySelector('#modal .btns.c');if(!box)return;
 if(f.stash){box.innerHTML=`<button class="btn gold" onclick="fromStash(${uid})">取回背包</button><button class="btn" onclick="closeM()">关闭</button>`;return}
 if(!f.slot){box.insertAdjacentHTML('afterbegin',`<button class="btn" onclick="toStash(${uid})">存入储物箱</button>`)}};
// 背包页：在原渲染后追加储物箱切换与面板；修正空槽图标
const _itm_renderBag=renderBag;
renderBag=function(){_itm_renderBag();const P=$('#panel');const gps=P.querySelectorAll('.gp');const bagGp=gps[gps.length-1];
 const sw=`<div class="stabs sm bagv"><button class="${BAGV==='bag'?'on':''}" onclick="BAGV='bag';render()">背包</button><button class="${BAGV==='stash'?'on':''}" onclick="BAGV='stash';render()">储物箱 ${S.stash.length}/${STASH_SIZE}</button></div>`;
 bagGp.insertAdjacentHTML('beforebegin',sw);
 if(BAGV==='stash'){bagGp.outerHTML=`<div class="gp stash"><h3>储物箱 ${S.stash.length}/${STASH_SIZE} <span class="r dim">点击物品可取回</span></h3><div class="grid">${S.stash.map(it=>cell(it,`showItem(${it.uid})`)).join('')||'<div class="dim">空。可在背包物品详情中点“存入储物箱”。</div>'}</div></div>`}};

// ---------- 镶嵌（底材顺序检测保持原逻辑；符文之语区间词缀在形成时掷骰） ----------
const _itm_doSock=doSock;doSock=function(uid,gid){_itm_doSock(uid,gid);const f=findItem(uid);if(f&&f.it.rw!=null&&!f.it.rwm){f.it.rwm=rollMods(RUNEWORDS[f.it.rw].m);calc();showItem(uid);render()}};

// ---------- 炼金匣 ----------
function bagHas(f){return S.bag.find(f)}
function gemOf(g,lv){return x=>x.k==='gem'&&x.g===g&&x.lv===lv}
function craftSlot(b){if(b.s==='weapon')return'weapon';if(b.s==='shield')return'shield';if(b.s==='ring')return'ring';return b.s}
function cubeRecipes(){const rec=[];const gc={},rc={};
 for(const x of S.bag){if(x.k==='gem'&&x.lv<4)(gc[x.g+x.lv]=gc[x.g+x.lv]||[]).push(x);if(x.k==='rune'&&x.r<RUNES.length-1)(rc[x.r]=rc[x.r]||[]).push(x)}
 for(const k in gc)if(gc[k].length>=3)rec.push([`3×${itemName(gc[k][0])} → ${GEMG[gc[k][0].lv+1]}${GEMS[gc[k][0].g].n}`,`cubeGem('${k}')`]);
 for(const k in rc){const r=+k,need=runeUpCount(r),g=RUNE_UP[r];if(rc[k].length<need)continue;if(g&&!bagHas(gemOf(g[0],g[1])))continue;
  rec.push([`${need}×${RUNES[r][0]}符文${g?' + '+GEMG[g[1]]+GEMS[g[0]].n:''} → ${RUNES[r+1][0]}符文`,`cubeRune(${r})`])}
 // 3 魔法戒指 → 魔法护符；3 魔法护符 → 魔法戒指
 const mr=S.bag.filter(x=>!x.k&&x.b==='rin'&&x.q===3),ma=S.bag.filter(x=>!x.k&&x.b==='amu'&&x.q===3);
 if(mr.length>=3)rec.push(['3×魔法戒指 → 魔法护符',"cubeJewel('rin')"]);if(ma.length>=3)rec.push(['3×魔法护符 → 魔法戒指',"cubeJewel('amu')"]);
 // 3 完美宝石 + 魔法物品 → 重铸魔法物品(ilvl 不变)
 const perf=S.bag.filter(x=>x.k==='gem'&&x.lv===4);const mag=S.bag.find(x=>!x.k&&x.q===3);if(perf.length>=3&&mag)rec.push([`3×完美宝石 + ${itemName(mag)} → 重铸魔法物品`,`cubeReroll(${mag.uid},'m')`]);
 // 6 完美颅石 + 稀有 → 重铸稀有(ilvl 40)
 const ps=S.bag.filter(gemOf('sku',4));const rar=S.bag.find(x=>!x.k&&x.q===4);if(ps.length>=6&&rar)rec.push([`6×完美颅石 + ${itemName(rar)} → 重铸稀有物品`,`cubeReroll(${rar.uid},'r')`]);
 // 3 碎裂宝石 + 魔法武器 → 带 1 孔魔法武器
 const chip=S.bag.filter(x=>x.k==='gem'&&x.lv===0);const mw=S.bag.find(x=>!x.k&&x.q===3&&BASEM[x.b].s==='weapon'&&!x.sock&&maxSock(BASEM[x.b],x.il));
 if(chip.length>=3&&mw)rec.push([`3×碎裂宝石 + ${itemName(mw)} → 魔法武器 +1 凹槽`,`cubeMagSock(${mw.uid})`]);
 // 普通底材加孔
 for(const it of S.bag){if(it.k||it.q!==1||it.sock||it.rw!=null)continue;const b=BASEM[it.b];const cs=b.s==='weapon'?'weapon':b.s==='armor'?'armor':b.s==='helm'?'helm':b.s==='shield'?'shield':SOCKET_RECIPES[b.s]?b.s:null;if(!cs||!maxSock(b,it.il))continue;
  const[r1,r2,g]=SOCKET_RECIPES[cs];if(bagHas(x=>x.k==='rune'&&x.r===r1)&&bagHas(x=>x.k==='rune'&&x.r===r2&&(r1!==r2))&&bagHas(gemOf(g,4)))rec.push([`${RUNES[r1][0]}+${RUNES[r2][0]}+完美${GEMS[g].n} + ${itemName(it)} → 随机凹槽`,`cubeSocket(${it.uid})`])}
 // 拆镶嵌：有镶嵌物的物品 + 简符文 + 回城卷轴 → 清空凹槽（镶嵌物销毁）
 if(bagHas(x=>x.k==='rune'&&x.r===14)&&S.pot.tp>0)for(const it of S.bag.concat(Object.values(S.eq)))if(it&&!it.k&&it.soc&&it.soc.length)rec.push([`${itemName(it)} + 15号符文 + 回城卷轴 → 拆除镶嵌（镶嵌物销毁）`,`cubeUnsock(${it.uid})`]);
 // 合成：魔法底材 + 指定符文 + 完美宝石 + 任意宝石（代替珠宝）
 for(const ck in CRAFTS){const C=CRAFTS[ck];for(const it of S.bag){if(it.k||it.q!==3)continue;const part=C.parts[craftSlot(BASEM[it.b])];if(!part)continue;
  if(bagHas(x=>x.k==='rune'&&x.r===part[0])&&bagHas(gemOf(C.gem,4))&&S.bag.filter(x=>x.k==='gem').length>=2)rec.push([`${C.n}合成：${itemName(it)} + ${RUNES[part[0]][0]} + 完美${GEMS[C.gem].n} + 任意宝石`,`craft2('${ck}',${it.uid})`])}}
 // 3 红药 + 3 蓝药 + 碎裂宝石 → 瞬回
 if(S.pot.hp>=3&&S.pot.mp>=3&&chip.length)rec.push(['3 红药 + 3 蓝药 + 碎裂宝石 → 瞬回药剂',"cubePot()"]);
 return rec}
function recipeHelp(){const C=Object.values(CRAFTS).map(c=>`${c.n}(完美${GEMS[c.gem].n})`).join('、');
 return `3 同级同色宝石→升一级；符文升级 1~9号 3 枚，10号起 3 枚+宝石，21号起 2 枚+宝石；3 魔法戒指⇄护符；3 完美宝石+魔法=重铸；6 完美颅石+稀有=重铸；3 碎裂宝石+魔法武器=1 孔；
 普通无孔底材加孔：甲(7号+10号+完美黄玉)/武器(8号+11号+完美紫晶)/盔(8号+10号+完美蓝玉)/盾(7号+11号+完美赤玉)；拆镶嵌：物品+15号符文+回城卷轴（镶嵌物销毁）；合成：${C} + 部位符文 + 魔法底材 + 任意宝石`}
cubeUI=function(){const rec=cubeRecipes();
 modal(`<div class="mtitle">炼金匣</div><div class="gp"><div class="dim">${recipeHelp()}</div>
 ${rec.length?rec.map(([t,f])=>`<div class="row"><span>${t}</span><button class="btn xs gold" onclick="${f}">合成</button></div>`).join(''):'<div class="dim" style="margin:10px 0">背包中没有满足条件的材料</div>'}<div class="btns c"><button class="btn" onclick="closeM()">关闭</button></div></div>`)};
cubeRune=function(r){const g=RUNE_UP[r];takeBag(x=>x.k==='rune'&&x.r===r,runeUpCount(r));if(g)takeBag(gemOf(g[0],g[1]),1);S.bag.push({uid:S.uid++,k:'rune',r:r+1});S.found[r+1]=1;cubeUI();render()};
function cubeJewel(from){takeBag(x=>!x.k&&x.b===from&&x.q===3,3);const it=genItem(S.lvl,{base:BASEM[from==='rin'?'amu':'rin'],q:3});S.bag.push(it);cubeUI();render()}
function cubeReroll(uid,t){const f=findItem(uid);if(!f||f.slot||f.stash)return;const old=f.it;if(t==='m'){takeBag(x=>x.k==='gem'&&x.lv===4,3)}else takeBag(gemOf('sku',4),6);
 const n=genItem(t==='m'?old.il:40,{base:BASEM[old.b],q:t==='m'?3:4});n.uid=old.uid;const i=S.bag.findIndex(x=>x.uid===uid);S.bag[i]=n;showItem(uid);render()}
function cubeMagSock(uid){const f=findItem(uid);takeBag(x=>x.k==='gem'&&x.lv===0,3);f.it.sock=1;showItem(uid);render()}
function cubeSocket(uid){const f=findItem(uid);const it=f.it,b=BASEM[it.b],cs=b.s==='weapon'?'weapon':b.s;const[r1,r2,g]=SOCKET_RECIPES[cs];takeBag(x=>x.k==='rune'&&x.r===r1,1);takeBag(x=>x.k==='rune'&&x.r===r2,1);takeBag(gemOf(g,4),1);
 it.sock=R(1,maxSock(b,it.il));log(`炼金匣：${itemName(it)} 获得 ${it.sock} 个凹槽`);showItem(uid);render()}
function cubeUnsock(uid){const f=findItem(uid);if(!f)return;takeBag(x=>x.k==='rune'&&x.r===14,1);S.pot.tp--;const it=f.it;const n=it.soc.length;it.soc=[];delete it.rw;delete it.rwm;calc();log(`炼金匣：拆除 ${itemName(it)} 的 ${n} 个镶嵌物（已销毁）`);showItem(uid);render()}
function cubePot(){S.pot.hp-=3;S.pot.mp-=3;takeBag(x=>x.k==='gem'&&x.lv===0,1);S.pot.rej++;cubeUI();render()}
// 合成物品：ilvl = ⌊clvl/2⌋+⌊底材ilvl/2⌋；固定词缀 + 1~4 随机；需求等级 = 最高词缀需求 + 10 + 3×词缀数
function craft2(ck,uid){const C=CRAFTS[ck],f=findItem(uid);if(!f)return;const old=f.it,b=BASEM[old.b],part=C.parts[craftSlot(b)];
 const i=S.bag.findIndex(x=>x.uid===uid);S.bag.splice(i,1);takeBag(x=>x.k==='rune'&&x.r===part[0],1);takeBag(gemOf(C.gem,4),1);takeBag(x=>x.k==='gem',1);
 const il=Math.floor(S.lvl/2)+Math.floor(old.il/2);const it=genItem(il,{base:b,q:7});it.name=C.n+'·'+b.n;it.craft=ck;const fixed=rollMods(part[1]);for(const k in fixed)it.m[k]=(it.m[k]||0)+fixed[k];
 const na=(it.af||[]).length;it.req=Math.min(99,(it.req||0)+10+3*na);S.bag.push(it);log(`合成：<span style="color:${QC[7]}">${it.name}</span>`);showItem(it.uid);render()}
craft=function(t){toast('请使用新合成配方')};

// 若 game.js 未延迟 init（旧版入口），在此补齐存档字段
if(typeof S!=='undefined'&&S&&!S.stash)S.stash=[];
// ---------- 防具力量/敏捷需求缩放（D3 式放宽） ----------
// 原版底材需求（精英腰带 106、精英盔甲 158 力量）远超法系默认加点（自动加点只把力量加到「背包里够得着的装备」，法系 85 级约 25 力量）。
// 防具类（头/甲/盾/手/腰/鞋）：50 以内不变，超出部分 ×0.35（106→70、158→88；重甲仍高于轻甲）。武器不变。
// 法系流派套装/暗金（亡灵 3 流派 + cls_build 中 role:'caster' 的流派）：力量/敏捷需求再封顶 30。
const REQ_ARMS=new Set(['helm','armor','shield','gloves','belt','boots']);
function reqScale(v){return v>50?50+Math.round((v-50)*0.35):v}
function reqCasterBuild(it){if(!it||!it.name||typeof NB_NAMES==='undefined'||!NB_NAMES.has(it.name))return false;const k=it.nb||(it.set&&SETS[it.set]&&SETS[it.set].nb)||(typeof UNIQUES!=='undefined'&&(UNIQUES.find(u=>u.n===it.name)||{}).nb);if(!k)return false;
 if(['sum','bone','plague'].includes(k))return true;const c=typeof CB_SPECS!=='undefined'&&CB_SPECS.find(x=>x.k===k);return!!(c&&c.role==='caster')}
{const f=itemReq;itemReq=function(it){const r=f(it);try{const b=BASEM[it.b];if(b&&REQ_ARMS.has(b.s)){r.str=reqScale(r.str);r.dex=reqScale(r.dex)}if(reqCasterBuild(it)){r.str=Math.min(r.str,30);r.dex=Math.min(r.dex,30)}}catch(e){}return r}}
// 自动加点的力量目标：原来只看「需求 ≤ 当前力量+10」的装备且封顶 60，法系力量永远停在初始值附近。
// 改为：背包中需求等级 ≤ 角色等级+3、力量需求 ≤ 20+0.6×等级（30 级 38 / 60 级 56 / 85 级 71）的装备里取最高需求。
function reqStrCap(){return Math.round(20+0.6*((S&&S.lvl)||1))}
needStr=function(){const cap=reqStrCap();let n=0;for(const it of S.bag)if(it&&!it.k&&BASEM[it.b]){const r=itemReq(it);if(r.lv<=S.lvl+3&&r.str<=cap)n=Math.max(n,r.str)}return Math.min(n,cap)};
