'use strict';
// ===================================================================================
// classes.js — 玩家职业：野蛮人(bar) / 法师(sor)。亡灵术士(nec)为原有职业，逻辑不变。
// 存档：沿用角色存档 S.cls（缺省 'nec'，旧存档自动视为亡灵术士）；S.ci=1 表示已按职业初始化（新建/重置角色时一次性写入属性、技能、初始装备）。
// 新增技能放入全局 SKILLS/SKM（带 cls 字段），技能页/加点/自动施法按 S.cls 过滤；数值在 clsSV，施放在 acFeasible/acSmart/acCast 包装中。
// 必须在 skills.js 之后加载（包装其自动施法函数）。
// ===================================================================================
const CLS_DEF={
 nec:{n:'亡灵术士',ic:'☠',glyph:'🧙‍♂️',at:{str:15,dex:25,vit:15,ene:25},life0:45,lpl:1.5,lpv:2,mana0:25,mpl:2,mpe:2,trees:['冥仆系','骨毒系','咒怨系']},
 bar:{n:'野蛮人',ic:'🪓',glyph:'🪓',at:{str:30,dex:20,vit:25,ene:10},life0:55,lpl:2,lpv:4,mana0:10,mpl:1,mpe:1,trees:['战斗技能','武器精通','战吼'],
  sk:{bbash:1},eq:['swd1','shd1'],autoEne:()=>false},
 sor:{n:'法师',ic:'🔮',glyph:'🧝‍♀️',at:{str:10,dex:25,vit:10,ene:35},life0:40,lpl:1,lpv:2,mana0:35,mpl:2,mpe:2,trees:['火焰法术','冰霜法术','闪电法术'],
  sk:{mfb:1},eq:['wand1'],autoEne:()=>S.at.ene<Math.floor(S.lvl*1.5)+35},
};
// 技能：顺序即默认自动施法优先级（增益/控制 → 群攻 → 单体）
const CLS_SKILLS=[
 {id:'bshout',cls:'bar',t:2,n:'战斗怒吼',r:1,col:1,pre:[],kind:'cbuff',ic:'📯',mana:L=>3},
 {id:'bhowl',cls:'bar',t:2,n:'震慑战嚎',r:6,col:0,pre:[],kind:'warcry',ic:'🗣',mana:L=>4},
 {id:'bww',cls:'bar',t:0,n:'旋风斩',r:12,col:2,pre:['bbash'],kind:'melee',ic:'🌀',mana:L=>3+0.2*(L-1)},
 {id:'bbash',cls:'bar',t:0,n:'猛击',r:1,col:1,pre:[],kind:'melee',ic:'🔨',mana:L=>1},
 {id:'bmast',cls:'bar',t:1,n:'武器精通',r:1,col:0,pre:[],kind:'passive',ic:'⚔'},
 {id:'mfa',cls:'sor',t:1,n:'寒冰护甲',r:1,col:1,pre:[],kind:'cbuff',ic:'❄',mana:L=>7},
 {id:'mmet',cls:'sor',t:0,n:'陨石术',r:12,col:2,pre:['mfb'],kind:'spell',ic:'☄',mana:L=>17+(L-1)},
 {id:'mnova',cls:'sor',t:1,n:'霜冻新星',r:6,col:0,pre:[],kind:'spell',ic:'✳',mana:L=>9+(L-1)},
 {id:'mcl',cls:'sor',t:2,n:'连锁闪电',r:6,col:1,pre:[],kind:'spell',ic:'⚡',mana:L=>9+0.5*(L-1)},
 {id:'mfb',cls:'sor',t:0,n:'火焰弹',r:1,col:0,pre:[],kind:'spell',ic:'🔥',mana:L=>2.5},
];
for(const s of CLS_SKILLS){SKILLS.push(s);SKM[s.id]=s;MODT['sk_'+s.id]='+{v} '+s.n+'（'+CLS_DEF[s.cls].n+'专属）';HIDDEN_KEYS.add('sk_'+s.id)}
Object.assign(SYN,{mfb:[['mmet'],12],mmet:[['mfb'],10],bww:[['bbash'],5]});
const curCls=()=>(S&&CLS_DEF[S.cls])?S.cls:'nec';
function clsBase(){return CLS_DEF[curCls()]}
function clsName(){return clsBase().n}
function heroArt(cls){const c=curCls();return c==='nec'?art('hero','🧙‍♂️',cls):`<img class="art ${cls||''}" src="assets/char/${c}_portrait.webp" alt="${clsBase().n}" onerror="this.outerHTML='<span class=&quot;glyph&quot;>${clsBase().glyph}</span>'">`}// 野蛮人/法师：美术立绘 assets/char/{id}_portrait.webp
function trees(){return clsBase().trees}
function skOfCls(s){return (s.cls||'nec')===curCls()}
// 新角色/重置角色：按职业写入初始属性/技能/装备（只执行一次）
function clsInit(){const c=curCls();if(c==='nec'||S.ci)return;const D=CLS_DEF[c];S.ci=1;S.at=Object.assign({},D.at);S.sk=Object.assign({},D.sk);S.main=null;S.curse=null;S.autoCast=null;
 S.eq={};for(const b of D.eq){const B=BASEM[b];if(B)S.eq[B.s]=makeBase(B,1)}calc();H.life=ST.life;H.mana=ST.mana}
// ---------- 技能数值 ----------
function clsSV(id,L){const sy=syn(id),r=(a,b)=>[Math.round(a*sy),Math.round(b*sy)];
 switch(id){
 case'bbash':{const p=80+20*(L-1),f=3+3*(L-1);return{pct:p,flat:f,txt:`近战一击：武器伤害 +${p}%，额外 +${f} 物理伤害`}}
 case'bww':{const p=Math.round((50+20*(L-1))*sy),f=2+3*(L-1);return{pct:p,flat:f,txt:`旋转攻击全部敌人（最多 8 个），武器伤害 +${p}%，额外 +${f} 物理伤害`}}
 case'bmast':{const d=20+8*(L-1),a=30+10*(L-1),c=Math.min(35,Math.round(dim(L,5,45))),i=Math.min(40,8+2*(L-1));return{dmg:d,ar:a,crit:c,ias:i,txt:`武器伤害 +${d}%，命中 +${a}%，攻速 +${i}%，${c}% 几率重击(双倍)`}}
 case'bshout':{const d=15+5*(L-1),df=20+10*(L-1),t=12+2*(L-1);return{dmg:d,def:df,dur:t,txt:`战吼：伤害 +${d}%，防御 +${df}%，持续 ${t} 秒`}}
 case'bhowl':{const t=+(1.5+0.25*(L-1)).toFixed(2),w=Math.min(60,20+3*(L-1));return{dur:t,wk:w,txt:`震慑所有敌人 ${t} 秒，并使其伤害 -${w}%（${t*3}秒）`}}
 case'mfb':{const d=r(3+3*(L-1),6+4*(L-1));return{dmg:d,txt:`火焰弹：单体火焰 ${d[0]}-${d[1]}`}}
 case'mmet':{const d=r(20+16*(L-1),30+22*(L-1));return{dmg:d,txt:`陨石坠落：全部敌人火焰 ${d[0]}-${d[1]}`}}
 case'mnova':{const d=r(4+4*(L-1),8+5*(L-1)),t=4+0.5*(L-1);return{dmg:d,dur:t,txt:`全部敌人冰冷 ${d[0]}-${d[1]}，冻结减速 ${t} 秒`}}
 case'mcl':{const d=r(1+2*(L-1),30+6*(L-1)),n=3+Math.floor(L/3);return{dmg:d,n,txt:`闪电在 ${n} 个目标间弹跳，每次闪电 ${d[0]}-${d[1]}`}}
 case'mfa':{const df=40+10*(L-1),cr=Math.min(40,10+2*(L-1)),t=60+12*(L-1);return{def:df,cres:cr,dur:t,txt:`防御 +${df}%，冰冷抗性 +${cr}%，近战攻击者被冻结减速；持续 ${t} 秒`}}
 }
 return{txt:''}}
// ---------- 属性：被动/增益（由 game.js calc 末尾调用） ----------
function clsCalc(o){const c=curCls();if(c==='nec')return;
 if(c==='bar'){const b0=bl('bmast'),L=b0?b0+o.allsk+((o.M||{}).tc_bar1||0)+(o.sk_bmast||0):0;if(L){const v=clsSV('bmast',L);o.wmin=Math.floor(o.wmin*(1+v.dmg/100));o.wmax=Math.floor(o.wmax*(1+v.dmg/100));o.ar=Math.round(o.ar*(1+v.ar/100));o.bcrit=v.crit;o.atkT=1.5/(1+(o.ias+v.ias)/100)}
  if(BASEM[S.eq.shield?.b]?.block)o.block=Math.min(75,o.block+5);// 野蛮人职业格挡 25（亡灵术士/法师 20，已含在底材里）
  const b=H.cb;if(b&&b.id==='bshout'&&b.until>GT){o.wmin=Math.floor(o.wmin*(1+b.dmg/100));o.wmax=Math.floor(o.wmax*(1+b.dmg/100));o.def=Math.round(o.def*(1+b.def/100))}}
 if(c==='sor'){const b=H.cb;if(b&&b.id==='mfa'&&b.until>GT){o.def=Math.round(o.def*(1+b.def/100));o.res.cold=Math.min(75,o.res.cold+b.cres)}}}
// ---------- 战斗 ----------
function clsMelee(m,mul,flat){if(!hitChance(ST.ar,m.def*(1-ST.tdef/100),S.lvl,m.lv))return 0;let k=1+mul/100;if(ST.bcrit&&rnd()*100<ST.bcrit)k*=2;
 const d=hitMon(m,{phys:Math.max(1,R(ST.wmin,ST.wmax)*k+(flat||0)),fire:ST.fire,cold:ST.cold,light:ST.light?R(1,ST.light):0,pois:ST.pois},'hero','#fff');
 if(d){H.life=Math.min(ST.life,H.life+d*ST.ll/100);H.mana=Math.min(ST.mana,H.mana+d*ST.ml/100+(curCls()==='bar'?2:0))}return d}// 野蛮人：每次近战命中 +2 法力（挂机下保证战吼/旋风斩可持续）
function clsFxRing(c){if(TAB!=='fight')return;FX.push({k:'nova',pts:[],h:heroPos(),c,t:0,life:.7})}
const CLS_CAST={
 bbash(ms,v){const tg=target(ms);clsMelee(tg,v.pct,v.flat);fx('slash',[tg]);return 2},
 bww(ms,v){const tg=ms.slice(0,8);for(const m of tg)clsMelee(m,v.pct,v.flat);fx('slash',tg);clsFxRing('#e8d0a0');return 1}/* 旋风斩按施法节奏(连续旋转) */,
 bshout(ms,v){H.cb={id:'bshout',until:GT+v.dur,dmg:v.dmg,def:v.def};calc();floatHero('战吼!','#ffd76a');fx('shield');return 1},
 bhowl(ms,v){for(const m of ms){if(!m.boss)m.stun=Math.max(m.stun||0,v.dur);m.bwk={until:GT+v.dur*3,x:v.wk}}clsFxRing('#ffb050');floatHero('震慑!','#ffb050');return 1},
 mfb(ms,v){const tg=target(ms);hitMon(tg,{fire:R(v.dmg[0],v.dmg[1])},'hero','#f84');fx('boom',[tg]);return 1},
 mmet(ms,v){for(const m of ms)hitMon(m,{fire:R(v.dmg[0],v.dmg[1])},'hero','#f60');fx('boom',ms);return 1},
 mnova(ms,v){for(const m of ms){hitMon(m,{cold:R(v.dmg[0],v.dmg[1])},'hero','#8cf');m.slow=GT+v.dur}clsFxRing('#8cf');return 1},
 mcl(ms,v){const tg=[target(ms),...ms.filter(m=>m!==target(ms))].slice(0,v.n);for(const m of tg)hitMon(m,{light:R(v.dmg[0],v.dmg[1])},'hero','#ff6');fx('bolt',tg);return 1},
 mfa(ms,v){H.cb={id:'mfa',until:GT+v.dur,def:v.def,cres:v.cres};calc();floatHero('寒冰护甲','#8cf');fx('shield');return 1},
};
for(const k of['melee','spell','cbuff','warcry'])if(!AC_KINDS.includes(k))AC_KINDS.push(k);
{const f=acFeasible;acFeasible=function(id,ms){const s=SKM[id];if(!s||!s.cls)return f(id,ms);if(!castable(id))return 0;
 if(s.kind==='cbuff')return!(H.cb&&H.cb.id===id&&H.cb.until>GT+2);
 if(s.kind==='warcry')return ms.some(m=>!(m.stun>0)&&!(m.bwk&&m.bwk.until>GT));
 return ms.length>0}}
const CLS_SMART={bww:2,mmet:3,mnova:3,mcl:2,bhowl:3};
{const f=acSmart;acSmart=function(id,ms){const s=SKM[id];if(!s||!s.cls)return f(id,ms);const n=CLS_SMART[id];
 if(n)return ms.length>=n||(id!=='mnova'&&ms.some(m=>m.boss||m.fl==='uniq'));return 1}}
{const f=acCast;acCast=function(id,ms){const s=SKM[id];if(!s||!s.cls)return f(id,ms);ACT[id]=GT;const v=SV(id,slvl(id));spend(id);return CLS_CAST[id](ms,v)}}
{const f=acSmartTxt;acSmartTxt=function(id){const s=SKM[id];if(!s||!s.cls)return f(id);
 return{bbash:'有目标即用（主攻单体）',bww:'怪物≥2或有精英/首领',bshout:'战吼未生效时施放',bhowl:'怪物≥3或有精英/首领',mfb:'有目标即用（主攻单体）',mmet:'怪物≥3或有精英/首领',mnova:'怪物≥3',mcl:'怪物≥2或有精英/首领',mfa:'护甲未生效时施放'}[id]||''}}
// 增益到期重算属性；震慑战嚎的减伤：本帧怪物出手前临时降低伤害（step 结束后还原）
{const f=step;step=function(dt){if(H.cb&&H.cb.until<=GT){H.cb=null;calc()}const sv=[];
 for(const m of MON)if(m.bwk&&m.bwk.until>GT&&m.hp>0){sv.push([m,m.dmg]);m.dmg=m.dmg.map(x=>x*(1-m.bwk.x/100))}
 try{return f(dt)}finally{for(const[m,d]of sv)m.dmg=d}}}
// 寒冰护甲：近战怪物攻击时被减速（按怪物命中英雄的近战出手近似：英雄掉血且护甲生效 → 所有近战怪减速 2 秒）
{const f=step;step=function(dt){const hp0=H.life;const r=f(dt);if(curCls()==='sor'&&H.cb&&H.cb.id==='mfa'&&H.cb.until>GT&&H.life<hp0)for(const m of MON)if(m.hp>0&&!m.ranged)m.slow=Math.max(m.slow||0,GT+2);return r}}
// 技能加点计划（autoTick 使用）
const CLS_SKPLAN={
 bar:{order:['bbash','bshout','bmast','bbash','bmast','bhowl','bbash','bmast','bshout','bmast','bbash','bww','bww','bww','bww','bww'],fill:()=>bl('bww')<20?['bww','bmast','bshout','bbash','bhowl']:['bmast','bshout','bhowl','bbash']},
 sor:{order:['mfb','mfa','mfb','mfb','mfb','mcl','mnova','mcl','mcl','mfb','mmet','mmet','mmet'],fill:()=>['mmet','mfb','mcl','mnova','mfa']},
};
function clsSkPlan(){return CLS_SKPLAN[curCls()]||null}
// ===================================================================================
// 职业专属底材 / 词缀 / 技能等级加成（b.ccls = 职业 id；缩颅标记为亡灵术士）
// ===================================================================================
TCAP.orb=[2,3,3];TCAP.bhelm=[2,3,3];ITYPES.orb=['armo','shld','orb'];ITYPES.bhelm=['armo','helm','phlm'];
{const nb=[
 A('orb1','shield','orb','鹰眼法球',1,0,[1,3],0,2),A('orb2','shield','orb','冰晶法球',12,0,[2,5],0,2),A('orb3','shield','orb','烈焰法球',22,0,[3,7],0,2),
 A('orb4','shield','orb','星辰法球',36,1,[6,12],0,3),A('orb5','shield','orb','天穹法球',60,2,[10,20],0,3),
 A('bh1','helm','bhelm','狼首盔',3,0,[8,11],25,2),A('bh2','helm','bhelm','獠牙战盔',12,0,[15,20],40,2),A('bh3','helm','bhelm','巨角盔',24,0,[25,35],55,3),
 A('bh4','helm','bhelm','屠夫面盔',40,1,[50,70],80,3),A('bh5','helm','bhelm','苍狼王冠',62,2,[90,125],110,3)];
 for(const b of nb){b.cls=1;b.ccls=b.cat==='orb'?'sor':'bar';BASES.push(b);BASEM[b.id]=b}
 for(const b of BASES)if(b.cat==='head')b.ccls='nec'}
{const add=(n,lv,rq,it,k,v)=>PREFIX.push(AF(n,lv,rq,'skill',it,{[k]:[v,v]}));
 const T={bar:[['斗士的','战魂的','战神的'],['剑士的','锋主的','兵圣的'],['呼号的','咆哮的','雷吼的']],sor:[['焰语的','炎术的','焚天的'],['霜语的','冰术的','凛冬的'],['雷语的','电术的','天雷的']]};
 const IT={bar:'phlm,amul',sor:'orb,amul'};
 for(const c in T)for(let t=0;t<3;t++){const k='tc_'+c+t;MODT[k]='+{v} '+CLS_DEF[c].trees[t]+'（'+CLS_DEF[c].n+'专属）';HIDDEN_KEYS.add(k);T[c][t].forEach((n,i)=>add(n,[20,40,60][i],[15,30,45][i],IT[c],k,i+1))}
 MODT.t0sk='+{v} 冥仆系技能（亡灵术士专属）';MODT.t1sk='+{v} 骨毒系技能（亡灵术士专属）';MODT.t2sk='+{v} 咒怨系技能（亡灵术士专属）'}
const baseCls=b=>b&&b.ccls||null;
// 职业专属底材：其他职业不可装备（缩颅/法球/野蛮人头盔）
{const f=canEquip;canEquip=function(it){const b=it&&!it.k&&BASEM[it.b];if(b&&b.ccls&&b.ccls!==curCls())return false;return f(it)}}
// 技能等级：职业技能吃 +全部技能、本职业系别(tc_<cls><t>)、单技能 sk_<id>；亡灵术士系别词缀(t0sk..)只对亡灵术士生效
{const f=slvl;slvl=function(id){const s=SKM[id];if(!s||!s.cls)return f(id);const b=bl(id);if(!b)return 0;const M=ST.M||{};return b+ST.allsk+(M['tc_'+s.cls+s.t]||0)+(ST['sk_'+id]||0)}}
// 法球/野蛮人头盔的法杖技能词缀只出本职业技能；魔杖/缩颅只出亡灵术士技能
if(typeof staffMods==='function'){STAFFMOD_CATS.add('orb');STAFFMOD_CATS.add('bhelm');const f=staffMods;staffMods=function(it,b,ilvl){const c=(b&&b.ccls)||'nec';const all=SKILLS.slice();
 SKILLS.length=0;for(const s of all)if((s.cls||'nec')===c)SKILLS.push(s);try{return f(it,b,ilvl)}finally{SKILLS.length=0;for(const s of all)SKILLS.push(s)}}}
