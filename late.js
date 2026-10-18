// late.js — 后期伤害方案：主属性加伤 + 技能 20 级以后成长 + 职业后期系数 + 自动加点主属性/体力分配
// 全部用运行时包装实现（hitMon / syn / skPop / renderHero / autoTick），不改其他文件的函数体。
// 主属性：超出职业初始值的部分每 X 点 → 所有技能、攻击、召唤物伤害 +1%（雇佣兵不算）
const LATE_MAIN={nec:['ene',4],sor:['ene',4],dru:['ene',4],ama:['dex',5],pal:['str',5],bar:['str',6]};
const LATE_AN={str:'力量',dex:'敏捷',ene:'精力',vit:'体力'};
// 技能有效等级超过 20 后，每级额外 +LATE_SL（乘在协同系数上，技能等级/协同/精通同吃）
const LATE_SL=0.05;
// 职业后期成长系数（按角色等级插值；≤30 级接近 1，保持 1–30 级平衡）
const LATE_K={
 nec:[[1,1],[24,1],[30,0.56],[50,1.51],[70,1.3],[85,2.4]],// 原 70:4.63 / 85:2.95——地狱段(64–80 级)伤害约为相邻节点的 3 倍，满屏秒怪；全程通关模拟 57.7h→65.2h
 sor:[[1,1],[24,1],[30,0.7],[50,0.47],[70,0.35],[85,7.5]],
 bar:[[1,1],[24,1],[30,0.45],[50,0.9],[70,1.2],[85,0.5]],
 dru:[[1,1],[24,1],[30,0.82],[50,0.58],[70,0.4],[85,2.0]],
 ama:[[1,1],[24,1],[30,0.83],[50,0.9],[70,1.1],[85,4.2]],
 pal:[[1,1],[24,1],[30,0.8],[50,1.0],[70,0.75],[85,1.3]]};
// 自动加点：主属性占「主属性+体力」新增点的比例（按角色等级插值）
const LATE_SHARE={nec:[[1,0],[24,0],[30,0.3],[60,0.45],[85,0.5]],sor:[[1,0],[24,0],[30,0.3],[60,0.45],[85,0.5]],dru:[[1,0],[24,0],[30,0.3],[60,0.45],[85,0.5]],
 ama:[[1,0],[24,0],[30,0.35],[85,0.5]],pal:[[1,0],[24,0],[30,0.3],[85,0.5]],bar:[[1,0],[24,0],[30,0.2],[85,0.3]]};
function lateC(){return typeof curCls==='function'?curCls():'nec'}
function lateTb(t){return typeof clsBalK==='function'&&t?clsBalK(t):1}
function lateMain(){return LATE_MAIN[lateC()]||LATE_MAIN.nec}
function latePct(){if(typeof ST==='undefined'||!ST||!ST.attr)return 0;const[k,x]=lateMain(),B=typeof respBaseAt==='function'?respBaseAt():{};return Math.max(0,Math.floor(((ST.attr[k]||0)-(B[k]||0))/x))}
// 后期系数按对数插值（相邻节点间按等比变化，避免线性插值在 70→85 级出现陡跳）
function lateLog(t){const l=(typeof S!=='undefined'&&S&&S.lvl)||1;if(!t)return 1;if(l<=t[0][0])return t[0][1];for(let i=1;i<t.length;i++)if(l<=t[i][0]){const[a,x]=t[i-1],[b,y]=t[i];return x*Math.pow(y/x,(l-a)/(b-a))}return t[t.length-1][1]}
function lateMul(){return(1+latePct()/100)*lateLog(LATE_K[lateC()])}
// 低等级生存：野蛮人 45 级前 / 射手、骑士 30 级前额外减伤（普通卡萨尔卡关）（靠生存过普通难度，伤害系数按 cls_bal 压低），之后 15 级内线性退出
const LATE_SURV={bar:[[1,20],[45,20],[60,0]],ama:[[1,25],[30,25],[45,0]],pal:[[1,20],[30,20],[45,0]],sor:[[1,0],[60,0],[85,20]]};
{const f=calc;calc=function(...a){const r=f.apply(this,a);try{const t=LATE_SURV[lateC()];if(t&&ST){const v=lateTb(t);if(v>0)ST.cdr=Math.min(75,(ST.cdr||0)+v)}}catch(e){}return r}}
// 伤害：英雄与召唤物（非雇佣兵）的所有命中
{const f=hitMon;hitMon=function(m,d,src,fxc){if(d&&(src==='hero'||(src&&typeof src==='object'&&src.kind!=='merc'&&typeof ALLY!=='undefined'&&ALLY.includes(src)))){const k=lateMul();if(k!==1){const o={};for(const e in d)o[e]=d[e]*k;d=o}}return f(m,d,src,fxc)}}
// 技能 20 级后成长 + 详情显示时把属性加成/后期系数算进伤害
let LATE_DISP=0;
{const f=syn;syn=function(id){let v=f(id);try{const L=slvl(id);if(L>20)v*=1+LATE_SL*(L-20)}catch(e){}return LATE_DISP?v*LATE_DISP:v}}
{const f=skPop;skPop=function(...a){LATE_DISP=lateMul();try{return f.apply(this,a)}finally{LATE_DISP=0}}}
// 角色页
{const f=renderHero;renderHero=function(...a){const r=f.apply(this,a);if(typeof window!=='undefined'&&window.__NOUI)return r;try{const P=document.getElementById('panel');if(!P)return r;
 const[k,x]=lateMain(),g=P.querySelector('.pts');// 放在首屏「可用属性点」下方
 if(g&&!P.querySelector('.latebn')){const lk=lateLog(LATE_K[lateC()]);g.insertAdjacentHTML('afterend',`<div class="row latebn"><span>属性加成伤害<div class="dim">${LATE_AN[k]}超出初始值每${x}点 +1%${lk!==1?` · 后期成长 ×${lk.toFixed(2)}`:''}</div></span><b>+${latePct()}%</b></div>`)}
 for(const e of P.querySelectorAll('.attr')){const b=e.querySelector('b');if(b&&b.textContent===LATE_AN[k]){const d=e.querySelector('.dim');if(d&&!/伤害\+1%\/\d/.test(d.textContent))d.textContent+=` · 全部伤害+1%/${x}点`}}}catch(e){}return r}}
// 自动加点（所有职业）：力量够装备 → 职业法力需求 → 主属性与体力按比例
{const f=autoTick;autoTick=function(...a){try{if(S.autoAt&&S.sp>0&&ST){const c=lateC(),[k]=lateMain(),B=typeof respBaseAt==='function'?respBaseAt():{str:15,dex:25,vit:15,ene:25};const ns=needStr();const sh=lateTb(LATE_SHARE[c]);
  const eneNeed=()=>c==='nec'?(ST.attr.ene<S.lvl+25&&S.at.ene<S.lvl+15):clsBase().autoEne();
  while(S.sp>0){if(ST.attr.str<ns)S.at.str++;else if(k!=='ene'&&eneNeed())S.at.ene++;else if(c==='ama'&&S.at.dex<20+1.2*S.lvl)S.at.dex++;
   else{const mk=Math.max(0,S.at[k]-(B[k]||0)),vt=Math.max(0,S.at.vit-(B.vit||0));if(k==='ene'&&eneNeed())S.at.ene++;else if(mk<sh*(mk+vt+1))S.at[k]++;else S.at.vit++}S.sp--;calc()}}}catch(e){}return f.apply(this,a)}}
// 详情显示：伤害没有走协同系数的技能（如亡灵召唤物），把伤害区间按倍率换算后替换到文字里
{const f=SV;SV=function(id,L){const v=f(id,L);if(!LATE_DISP||!v||!Array.isArray(v.dmg))return v;const d0=LATE_DISP;LATE_DISP=0;let raw;try{raw=f(id,L)}finally{LATE_DISP=d0}
 if(raw&&Array.isArray(raw.dmg)&&raw.dmg[0]===v.dmg[0]&&raw.dmg[1]===v.dmg[1]){const n=v.dmg.map(x=>Math.round(x*d0)),o=v.dmg.join('-');if(v.txt&&v.txt.includes(o)){v.txt=v.txt.replace(o,n.join('-'));v.dmg=n}}return v}}
// 亡者复生：原数量 = 技能等级（20 级 20 只、+技能后更多），远多于骨仆（20 级 8 只）。同时存在数量上限改为同等级骨仆数量。
{const f=SV;SV=function(id,L,...a){const v=f(id,L,...a);try{if(id==='rv'&&v&&v.n>0){const n=Math.max(1,f('rs',L).n|0);if(v.n>n)return Object.assign({},v,{n,txt:String(v.txt||'').replace(/复生 \d+ 只/,`复生 ${n} 只`)})}}catch(e){}return v}}
// 亡者复生：伤害直接取自尸体怪物（mkMon 已含 等级成长 × 地狱难度 × 怪物难度 1–9），再吃上面的后期系数/召唤物加成就是双重成长，
// 地狱 + 高怪物难度时复生每击远超骨仆、单体秒怪。每击平均伤害上限 = 同技能等级骨仆的平均伤害 × LATE_REVK（低于上限的不变）。
const LATE_REVK=1;
{const f=addAlly;addAlly=function(kind,o){if(kind==='rev'&&o&&Array.isArray(o.dmg)&&typeof SV==='function'){try{const L=Math.max(1,slvl('rv')||0),v=SV('rs',L);
  const cap=(v.dmg[0]+v.dmg[1])/2*LATE_REVK,avg=(o.dmg[0]+o.dmg[1])/2;if(cap>0&&avg>cap){const k=cap/avg;o=Object.assign({},o,{dmg:o.dmg.map(x=>x*k)})}}catch(e){}}return f(kind,o)}}
