'use strict';
// ===================================================================================
// items2.js — 第四阶段装备机制（包装 game.js / items.js / acts.js 的函数，不改其本体）
// 双手武器、珠宝镶嵌、护身符（背包生效）、撕裂伤口/压碎性打击/致命一击等属性生效、详情显示修正、
// 珠宝/护身符掉落、升级/修复配方、新武器图标、随从可用弓/长柄。必须在 acts.js 之后加载。
// ===================================================================================
const CATN={wand:'魔杖',dagger:'匕首',sword:'剑',helm:'头盔',armor:'铠甲',shield:'盾',head:'缩颅',bow:'弓',xbow:'弩',polearm:'长柄',spear:'矛',jav:'标枪',throw:'投掷',axe:'斧',mace:'锤',staff:'法杖',jewel:'珠宝',scha:'小护身符',mcha:'大护身符',lcha:'超大护身符'};
const isTH=it=>!!(it&&!it.k&&BASEM[it.b]&&BASEM[it.b].th);
const isCharm=it=>!!(it&&!it.k&&BASEM[it.b]&&BASEM[it.b].s==='charm');
const isJewel=it=>!!(it&&!it.k&&BASEM[it.b]&&BASEM[it.b].s==='jewel');
// 随从：弓箭手用弓/弩，卫枪兵用长柄/矛（原版 1.13 随从武器规则）
if(typeof MERCS!=='undefined'){if(MERCS.archer)MERCS.archer.wcats=['bow','xbow'];if(MERCS.guard)MERCS.guard.wcats=[...new Set([...(MERCS.guard.wcats||[]),'polearm','spear'])];if(MERCS.barb)MERCS.barb.wcats=[...new Set([...(MERCS.barb.wcats||[]),'axe','mace'])]}

// ---------- 图标 ----------
const _i2_icon=itemIcon;itemIcon=function(it){if(it.k==='mat')return`<i class="ii">✷</i>`;if(!it.k){const b=BASEM[it.b];const g={bow:'🏹',xbow:'🏹',polearm:'🔱',spear:'🔱',jav:'🎯',throw:'🔪',axe:'🪓',mace:'🔨',staff:'🦯',jewel:'💎',scha:'🧿',mcha:'🧿',lcha:'🧿'}[b&&b.cat];if(g)return`<i class="ii ${b.s==='charm'?'chm c'+b.sz:''}">${g}</i>`}return _i2_icon(it)};

// ---------- 装备限制：护身符/珠宝不可穿戴；双手武器与副手互斥 ----------
const _i2_canEquip=canEquip;canEquip=function(it){if(isCharm(it)||isJewel(it))return false;return _i2_canEquip(it)};
const _i2_equip=equip;equip=function(uid){const f=findItem(uid);if(!f||f.slot)return;const it=f.it,b=BASEM[it.b];if(isCharm(it)||isJewel(it))return;
 let off=null;if(b.th&&S.eq.shield)off='shield';else if(b.s==='shield'&&isTH(S.eq.weapon))off='weapon';
 if(off){if(slotsUsed(S.bag)>=BAG_SZ)return toast('背包已满，无法卸下'+(off==='shield'?'副手':'双手武器'));S.bag.push(S.eq[off]);delete S.eq[off]}
 _i2_equip(uid)};
const _i2_auto=autoTick;autoTick=function(){const hide=S.bag.filter(it=>!it.k&&(isTH(it)||isCharm(it)||isJewel(it)||(isTH(S.eq.weapon)&&BASEM[it.b].s==='shield')));
 if(!hide.length)return _i2_auto();const set=new Set(hide);S.bag=S.bag.filter(x=>!set.has(x));try{_i2_auto()}finally{for(const x of hide)S.bag.push(x)}};

// ---------- 珠宝：镶嵌进凹槽 ----------
const _i2_sockMods=socketMods;socketMods=function(it){const js=(it.soc||[]).filter(x=>x.j);if(!js.length)return _i2_sockMods(it);const o=it.soc;it.soc=o.filter(x=>!x.j);let m;try{m=_i2_sockMods(it)}finally{it.soc=o}
 for(const x of js)for(const k in x.m)m[k]=(m[k]||0)+x.m[k];return m};
function jewelUI(uid){const js=S.bag.filter(isJewel);modal(`<div class="mtitle">选择珠宝</div><div class="gp"><div class="dim">镶嵌不可逆；珠宝会使白色底材无法再组成符文之语。</div><div class="grid">${js.map(x=>cell(x,`doSockJewel(${uid},${x.uid})`)).join('')}</div><div class="btns c"><button class="btn" onclick="showItem(${uid})">返回</button></div></div>`)}
function doSockJewel(uid,jid){const f=findItem(uid);if(!f||f.stash)return;const it=f.it;if(it.soc.length>=it.sock||it.rw!=null)return;const ji=S.bag.findIndex(x=>x.uid===jid);if(ji<0)return;const j=S.bag.splice(ji,1)[0];
 it.soc.push({j:1,n:j.name,q:j.q,m:Object.assign({},j.m)});calc();if(!window.__NOUI){showItem(uid);render()}}

// ---------- 护身符：放在背包里生效（以临时“护身符槽”并入 calc） ----------
function charmMods(){const m={};let n=0;for(const it of S.bag||[])if(isCharm(it)){n++;for(const k in it.m)m[k]=(m[k]||0)+it.m[k]}return n?m:null}
const _i2_calc=calc;calc=function(){const C=S&&S.bag?charmMods():null;let o;
 if(C){SLOTS.push('__charm');S.eq.__charm={uid:-1,b:'cha_s',q:3,m:C,soc:[]}}
 try{o=_i2_calc()}finally{if(C){SLOTS.pop();delete S.eq.__charm}}
 const M=o.M||{};
 // 最大抗性：超出 75 的部分最多可到 75+最大抗性
 const pen=DIFFS[S.diff].pen,bon=(S.bon&&S.bon.res)||0;
 for(const [k,mk,rk] of [['fire','maxfres','fres'],['cold','maxcres','cres'],['light','maxlres','lres'],['pois','maxpres','pres']])if(M[mk]&&o.res[k]>=75){const raw=(M[rk]||0)+(M.allres||0)+pen+bon;o.res[k]=Math.min(75+M[mk],Math.max(o.res[k],raw))}
 if(M.arp)o.ar=Math.round(o.ar*(1+M.arp/100));
 ST=o;return o};

// ---------- 让“只显示”的属性在战斗中生效 ----------
// 撕裂伤口 ow：8 秒流血（伤害按角色等级，原版公式分段，首领 1/2）；压碎性打击 cb：扣当前生命 1/4（首领 1/8）；
// 致命一击 ds：物理伤害翻倍；对恶魔伤害 demon；无视防御 ignoredef；击退 kb；击中致盲 blind / 逃跑 flee：短暂失能；冻结 freeze。
function owDps(L){const f=L<=15?9*L+31:L<=30?18*L-104:L<=45?27*L-374:L<=60?36*L-779:45*L-1319;return Math.max(1,f*25/256)}
function attackerMods(src){if(src==='hero')return ST&&ST.M||{};if(src&&src.kind==='merc'&&S.merc){const M={};for(const k of ['weapon','helm','armor']){const it=S.merc.eq[k];if(!it)continue;const m=allMods(it);for(const x in m)M[x]=(M[x]||0)+m[x]}return M}return null}
let _i2_atk=0;
const _i2_hitMon=hitMon;hitMon=function(m,d,src,fxc){if(!m||m.hp<=0)return _i2_hitMon(m,d,src,fxc);
 const atk=(src==='hero'&&(fxc==='#fff'||(fxc==='#6f6'&&d.phys)))||(src&&src.kind==='merc');const M=atk?attackerMods(src):null;
 if(!M||!d.phys)return _i2_hitMon(m,d,src,fxc);
 const T=MONS[m.key]||BOSSES[m.key]||{};const dd=Object.assign({},d);
 if(M.demon&&T.demon)dd.phys*=1+M.demon/100;
 let crit=false;if(M.ds&&rnd()*100<Math.min(100,M.ds)){dd.phys*=2;crit=true}
 const r=_i2_hitMon(m,dd,src,crit?'#ff4':fxc);
 if(m.hp>0&&M.cb&&rnd()*100<M.cb){const x=Math.round(m.hp*(m.boss?1/8:1/4));if(x>0){m.hp-=x;floatNum(m.uid,x,'#c6f');if(m.hp<=0){killMon(m);return r+x}}}
 if(m.hp>0&&M.ow&&rnd()*100<M.ow){const lv=src==='hero'?S.lvl:(mercStats().L||S.lvl);m.ow={dps:owDps(lv)*(m.boss?0.5:1),left:8}}
 if(m.hp>0&&!m.boss){if(M.kb)m.t+=0.25;if((M.blind&&rnd()*100<M.blind)||(M.flee&&rnd()*100<M.flee))m.stun=Math.max(m.stun||0,0.8)}
 if(m.hp>0&&M.freeze){m.stun=Math.max(m.stun||0,0.2*M.freeze*(m.boss?0.5:1));m.slow=GT+2}
 return r};
const _i2_hc=hitChance;hitChance=function(ar,def,al,dl){if(ST&&ar===ST.ar&&ST.M&&ST.M.ignoredef)def=0;return _i2_hc(ar,def,al,dl)};
const _i2_step=step;step=function(dt){const hp0=H.life;_i2_step(dt);if(!ST)return;
 for(const m of MON){if(m.hp>0&&m.ow&&m.ow.left>0){const t=Math.min(dt,m.ow.left);m.hp-=m.ow.dps*t;m.ow.left-=t;if(m.hp<=0)killMon(m)}}
 const drp=Math.min(50,(ST.M&&ST.M.drp)||0);if(drp&&H.life<hp0&&H.life>0)H.life+=(hp0-H.life)*drp/100}; // 物理伤害减免%（近似：按本帧受到的伤害返还）
if(typeof monsTick==='function'){const _i2_mt=monsTick;monsTick=function(dt){const c=H.castT;_i2_mt(dt);if(ST&&ST.M&&ST.M.nofreeze&&H.castT>c)H.castT=c}}
// 战斗相关属性不再隐藏（详情中统一显示在【基础属性】）
for(const k of['ow','ds','cb','drp','ignoredef','kb','flee','blind','freeze','nofreeze','arp','demon','maxfres','maxcres','maxlres','maxpres'])HIDDEN_KEYS.delete(k);

// ---------- 掉落：珠宝 / 护身符（近似原版 TC 中 jewl/char 的权重） ----------
function genJC(lv,mf){const c=[['jew',4],['cha_s',3],['cha_m',2],['cha_l',1]].filter(([id])=>BASEM[id].q<=lv);if(!c.length)return null;const id=wpick(c,x=>x[1])[0];return genItem(lv,{base:BASEM[id],mf})}
const _i2_rollTC=rollTC;rollTC=function(m){const out=_i2_rollTC(m);const p=m.actboss?0.25:m.boss?0.12:m.fl==='uniq'?0.05:m.fl==='champ'?0.025:0.004;if(rnd()<p){const it=genJC(m.lv,ST?ST.mf:0);if(it)out.push(it)}return out};
const _i2_gen=genItem;genItem=function(il,opt={}){let it=_i2_gen(il,opt);const b=BASEM[it.b];
 if(b&&b.s==='charm'&&(it.q===4||it.q===6||it.q===7))it=_i2_gen(il,Object.assign({},opt,{base:b,q:3})); // 原版护身符无稀有
 else if(b&&b.s==='jewel'&&it.q===4){let t=0;while((it.af||[]).length>4&&t++<20)it=_i2_gen(il,Object.assign({},opt,{base:b,q:4}))} // 稀有珠宝最多 4 词缀
 return it};

// ---------- 物品详情：属性统一显示、双手、珠宝/护身符按钮 ----------
const _i2_show=showItem;showItem=function(uid){_i2_show(uid);if(typeof document==='undefined'||window.__NOUI)return;const f=findItem(uid);if(!f||f.it.k)return;const it=f.it,b=BASEM[it.b];
 const P=document.querySelector('#modal .ipanel');if(!P)return;
 const hid=P.querySelector('.sec.hid'),base=P.querySelector('.sec');
 if(hid&&base){const req=[...base.children].find(e=>/^需求等级/.test(e.textContent));for(const e of [...hid.children]){if(e.tagName==='H4')continue;e.className='g';base.insertBefore(e,req||null)}hid.remove()}
 if(b.th)P.innerHTML=P.innerHTML.replace('单手伤害','双手伤害');
 P.querySelectorAll('.socks .so.on').forEach(e=>{if(e.textContent==='NaN'){e.textContent='◇';e.style.setProperty('--c','#9cf')}});
 const box=P.querySelector('.btns.c');if(!box)return;
 if(isCharm(it)||isJewel(it)){const eb=[...box.querySelectorAll('button')].find(x=>/装备|需求不足/.test(x.textContent));if(eb)eb.remove();
  base.insertAdjacentHTML('beforeend',`<div class="dim">${isCharm(it)?'护身符：放在背包中即生效（仓库中不生效）':'珠宝：可镶嵌到有空凹槽的装备中'}</div>`)}
 if(!f.slot&&!f.stash&&it.sock>it.soc.length&&it.rw==null&&!isJewel(it)&&S.bag.some(isJewel))box.insertAdjacentHTML('afterbegin',`<button class="btn" onclick="jewelUI(${uid})">镶嵌珠宝</button>`)};
modsTxt=function(m){return Object.entries(m).map(([k,v])=>(MODT[k]||k+' {v}').replace('{v}',Array.isArray(v)?v[0]+'-'+v[1]:v).replace('+-','-')).join('，')};

// ---------- 炼金匣：升级 / 修复配方 ----------
function nextTierBase(b){const cur=BASES.filter(x=>x.cat===b.cat&&x.tier===b.tier&&!x.jew).sort((a,c)=>a.q-c.q),nx=BASES.filter(x=>x.cat===b.cat&&x.tier===b.tier+1&&!x.jew).sort((a,c)=>a.q-c.q);
 if(!nx.length)return null;const i=cur.indexOf(b);return nx[Math.round(Math.max(0,i)*(nx.length-1)/Math.max(1,cur.length-1))]}
function partOf(b){return b.s==='weapon'?'w':(b.def&&!b.jew)?'a':null}
const runeIn=r=>x=>x.k==='rune'&&x.r===r;
const _i2_rec=cubeRecipes;cubeRecipes=function(){const rec=_i2_rec();
 for(const [i,U] of UPGRADE_RECIPES.entries()){const[n,q,p,t,r1,r2,g]=U;if(!bagHas(runeIn(r1))||!bagHas(runeIn(r2))||!bagHas(gemOf(g,4)))continue;
  for(const it of S.bag){if(it.k||it.q!==q)continue;const b=BASEM[it.b];if(partOf(b)!==p||b.tier!==t||!nextTierBase(b))continue;rec.push([`${n}：${itemName(it)} + ${RUNES[r1][0]}+${RUNES[r2][0]}符文 + 完美${GEMS[g].n}`,`cubeUpgrade(${i},${it.uid})`])}}
 const chip=x=>x.k==='gem'&&x.lv===0;
 for(const [p,r] of REPAIR_RECIPES){if(!bagHas(runeIn(r))||!bagHas(chip))continue;for(const it of S.bag)if(!it.k&&it.q===0&&partOf(BASEM[it.b])===p)rec.push([`修复：${itemName(it)} + ${RUNES[r][0]}符文 + 碎裂宝石 → 普通品质`,`cubeRepair('${p}',${it.uid})`])}
 return rec};
function cubeUpgrade(i,uid){const[n,q,p,t,r1,r2,g]=UPGRADE_RECIPES[i];const f=findItem(uid);if(!f||f.slot||f.stash)return false;const it=f.it,b=BASEM[it.b],nb=nextTierBase(b);
 if(!nb||it.q!==q||b.tier!==t||!bagHas(runeIn(r1))||!bagHas(runeIn(r2))||!bagHas(gemOf(g,4)))return false;
 takeBag(runeIn(r1),1);takeBag(runeIn(r2),1);takeBag(gemOf(g,4),1);it.b=nb.id;if(nb.dmg)it.dmg=nb.dmg.slice();if(nb.def)it.def=R(nb.def[0],nb.def[1]);it.req=Math.max(it.req||0,nb.q);
 if(it.q===4)it.name=it.name;log(`炼金匣升级：${itemName(it)} → ${nb.n}`);if(!window.__NOUI){showItem(uid);render()}return true}
function cubeRepair(p,uid){const r=REPAIR_RECIPES.find(x=>x[0]===p)[1];const f=findItem(uid);if(!f||f.stash||f.slot||f.it.q!==0)return false;takeBag(runeIn(r),1);takeBag(x=>x.k==='gem'&&x.lv===0,1);
 const it=f.it,b=BASEM[it.b];it.q=1;it.name=b.n;if(b.dmg)it.dmg=b.dmg.slice();if(b.def)it.def=R(b.def[0],b.def[1]);if(!window.__NOUI){showItem(uid);render()}return true}
const _i2_help=recipeHelp;recipeHelp=function(){return _i2_help()+`；<br>升级（原版 1.10+）：暗金武器 8号+12号+完美翡翠 / 17号+21号+完美翡翠；暗金防具 7号+13号+完美钻石 / 18号+20号+完美钻石；稀有武器 9号+11号+完美蓝玉 / 19号+22号+完美蓝玉；稀有防具 8号+10号+完美紫晶 / 18号+21号+完美紫晶（普通→扩展→精英，名称词缀保留）；修复破旧品：武器 2号+碎裂宝石，防具 1号+碎裂宝石`};

// ---------- 技能页：符文之语列表显示新类型；随从面板类型名 ----------
const _i2_rs=renderSkills;renderSkills=function(){_i2_rs();if(SKT!==3||window.__NOUI)return;const g=[...document.querySelectorAll('#panel .gp')].find(e=>/符文之语/.test(e.querySelector('h3')?.textContent||''));if(!g)return;
 g.innerHTML=`<h3>符文之语 <span class="dim">${RUNEWORDS.length} 个</span></h3>`+RUNEWORDS.map(w=>`<div class="rw"><b class="uq">${w.n}</b> <span class="dim">${w.r.map(i=>RUNES[i][0]).join('+')} · ${w.cats.map(c=>CATN[c]||c).join('/')} ${w.r.length}孔 · 需求${w.lv}</span><div class="dim">${modsTxt(w.m)}</div></div>`).join('')};
if(typeof mercPanel==='function'){const _i2_mp=mercPanel;mercPanel=function(){let h=_i2_mp();if(S.merc&&MERCS[S.merc.t].wcats){const T=MERCS[S.merc.t];const bad=T.wcats.map(c=>({wand:'魔杖',dagger:'匕首',sword:'剑'})[c]).join('/');h=h.replace(bad,T.wcats.map(c=>CATN[c]||c).join('/'))}return h}}
