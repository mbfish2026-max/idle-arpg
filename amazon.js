'use strict';
// ===================================================================================
// amazon.js — 荒野射手(ama)：弓与弩 / 标枪与长矛 / 被动与魔法 三系 30 技能 + 专属弓/标枪 + 专属词缀。
// 走 classes.js 的数据驱动技能引擎；本文件新增 2 种技能类型：
//   arw   远程武器攻击（弓箭/标枪）：武器伤害(clsMelee) × n 个目标 × hits 次，可附加元素 dmg、溅射 sp/sn、
//         连锁闪电 cn/cd、灼烧 bd、毒素 pd/pn；v.el 为伤害转换（雷矛/雷霆怒涛把武器伤害全部转为闪电）；透矢被动可让箭矢多穿一个敌人
//   asum  召唤（盟友 kind='apet'，sub=技能 id）：幻影替身 / 英灵战姬
// 武器：弓按敏捷加成武器伤害，标枪按力量与敏捷各 75%（原版规则）；ww:1 武器权重防好武器过强
// 数值三个系数：amam 武器部分（clsMk）/ ama 元素附加（第三个参数 k）/ amas 召唤物
// 美术：技能图标/特效 assets/skills/<id>.webp、fx_<id>.webp（manifest 登记）；召唤物 assets/summon/ama_<id>.webp
// 必须在 classes.js 之后、eg_power.js / classes2.js 之前加载。
// ===================================================================================
CLS_BAL.ama=[[1,0.65],[6,1.2],[9,1.4],[12,1.25],[18,1.25],[24,0.85],[30,0.8]];// 元素附加伤害系数（按等级插值，对标亡灵术士 60 秒击杀）
CLS_BAL.amam=[[1,0.65],[6,1.2],[9,1.3],[12,1.08],[18,1.1],[24,0.85],[30,0.8]];// 武器部分伤害系数
CLS_BAL.amas=[[1,1],[12,1],[24,1],[30,1]];// 召唤物伤害系数
CLS_DEF.ama={n:'荒野射手',ic:'🏹',glyph:'🏹',at:{str:20,dex:25,vit:20,ene:15},life0:50,lpl:2,lpv:3,mana0:15,mpl:1.5,mpe:1.5,trees:['弓与弩','标枪与长矛','被动与魔法'],
 sk:{amag:1},eq:['bow1'],ww:1,mk:()=>clsBalK(CLS_BAL.amam),dk:()=>clsBalK(CLS_BAL.ama),autoEne:()=>S.at.ene<S.lvl+15};
// ---------- 新技能类型 ----------
Object.assign(CLS_TYK,{arw:'melee',asum:'csum'});Object.assign(CLS_PRI,{arw:7,asum:1});CLS_TYR.arw=2;
CLS_SINGLE.add('arw');CLS_MELEE.add('arw');
if(!AC_KINDS.includes('csum'))AC_KINDS.push('csum');
const amaPets=id=>ALLY.filter(a=>a.kind==='apet'&&a.sub===id&&a.hp>0);
CLS_TY.arw=function(s,v,ms,tg){const L=clsOthers(ms,tg).slice(0,v.n||1);
 if(ST.apier){const rest=ms.filter(m=>!L.includes(m));let x=0;for(const m of L.slice())if(rest[x]&&rnd()*100<ST.apier)L.push(rest[x++])}// 透矢：箭矢穿透到下一个敌人
 const hit=[];for(const m of L){let d=0;for(let i=0;i<(v.hits||1);i++)d+=clsMelee(m,v.pct,v.flat,v);if(d||v.sure)hit.push(m)}
 if(v.dmg)for(const m of hit)clsHit(m,s.el,clsRR(v.dmg));
 const all=L.slice();
 if(v.sp&&hit.length){const o=ms.filter(m=>m.hp>0&&!L.includes(m)).slice(0,v.sn||3);for(const m of o){clsHit(m,s.el,clsRR(v.dmg)*v.sp/100);clsCC(m,v)}all.push(...o)}
 if(v.cn&&hit.length)for(let i=0;i<v.cn;i++){const l=liveMon();if(!l.length)break;const m=pick(l);clsHit(m,'light',clsRR(v.cd));if(!all.includes(m))all.push(m)}
 if(v.bd)for(const m of all)if(m.hp>0&&(hit.includes(m)||!L.includes(m)))m.burn={dps:v.bd*elMul('fire'),left:v.bdur||4};
 if(v.pd)for(const m of ms.slice(0,v.pn||1))if(m.hp>0){m.pois={dps:v.pd*(1-resOf(m,'pois')/100),left:v.pdur||3,src:'hero'};if(!all.includes(m))all.push(m)}
 return all};
CLS_TY.asum=function(s,v){addAlly('apet',{sub:s.id,n:s.n,hp:v.hp,dmg:v.dmg||[0,0],el:'phys',until:v.dur?GT+v.dur:0});floatHero(s.n,'#cdf');return[]};
// ---------- 技能 ----------
const amaPtx=(d,t)=>`每秒 ${d} 毒素（${t} 秒）`;
clsDef('ama',[
 // 弓与弩
 {id:'amag',t:0,n:'奥术矢',r:1,col:1,ty:'arw',el:'magic',ic:'✴',fx:'spirit',mana:L=>Math.max(0,1.5-0.1*(L-1)),v:(L,sy,k)=>{const p=Math.round(5*(L-1)*sy),d=CLS_DR(1,3,1,2,L,k);return{pct:p,dmg:d,sure:1,txt:`必中的奥术之箭：${clsMtx(p)}，附加 ${clsDtx(d,'magic')}`}}},
 {id:'afire',t:0,n:'炽焰矢',r:1,col:2,ty:'arw',el:'fire',ic:'🔥',fx:'boom',mana:L=>1.5+0.15*(L-1),syn:[['aexp','aimm'],12],v:(L,sy,k)=>{const d=CLS_DR(2,4,3,4,L,sy*k);return{dmg:d,txt:`燃烧之箭：武器伤害并附加 ${clsDtx(d,'fire')}`}}},
 {id:'acold',t:0,n:'霜寒矢',r:6,col:0,ty:'arw',el:'cold',ic:'❄',fx:'ring',mana:L=>1.5+0.15*(L-1),syn:[['aice','afrz'],12],v:(L,sy,k)=>{const d=CLS_DR(2,4,2,3,L,sy*k);return{dmg:d,slow:2,txt:`寒霜之箭：武器伤害并附加 ${clsDtx(d,'cold')}，减速 2 秒`}}},
 {id:'amul',t:0,n:'连珠箭',r:6,col:1,pre:['amag'],ty:'arw',ic:'🏹',fx:'stab',mana:L=>2+0.2*(L-1),v:L=>{const n=Math.min(10,2+Math.floor(L/2)),p=Math.min(30,-25+4*(L-1));return{n,pct:p,txt:`一次射出 ${n} 支箭，各射向不同敌人：${clsMtx(p)}`}}},
 {id:'aexp',t:0,n:'爆燃矢',r:12,col:2,pre:['afire','amul'],ty:'arw',el:'fire',ic:'💥',fx:'boom',mana:L=>3+0.25*(L-1),syn:[['afire','aimm'],12],v:(L,sy,k)=>{const d=CLS_DR(5,9,4,6,L,sy*k);return{dmg:d,sp:100,sn:3,txt:`命中后爆炸：武器伤害并附加 ${clsDtx(d,'fire')}，爆炸波及周围 3 个敌人`}}},
 {id:'aice',t:0,n:'凝冰矢',r:18,col:0,pre:['acold'],ty:'arw',el:'cold',ic:'🧊',fx:'ring',mana:L=>3+0.25*(L-1),syn:[['acold','afrz'],10],v:(L,sy,k)=>{const d=CLS_DR(6,10,4,6,L,sy*k),s=Math.min(2,+(1+0.1*(L-1)).toFixed(1));return{dmg:d,stun:s,txt:`冰晶之箭：武器伤害并附加 ${clsDtx(d,'cold')}，冻结 ${s} 秒`}}},
 {id:'aguide',t:0,n:'寻踪矢',r:18,col:1,pre:['acold','amul'],ty:'arw',ic:'🎯',fx:'stab',mana:L=>Math.max(2,5-0.2*(L-1)),syn:[['amag','acold'],8],v:(L,sy)=>{const p=Math.round((50+12*(L-1))*sy);return{pct:p,sure:1,txt:`自动追踪、必定命中：${clsMtx(p)}`}}},
 {id:'astraf',t:0,n:'疾风连射',r:24,col:1,pre:['aguide'],ty:'arw',ic:'🌪',fx:'stab',mana:L=>4+0.2*(L-1),syn:[['amul'],6],v:(L,sy)=>{const n=Math.min(10,4+Math.floor(L/3)),p=Math.round((10+6*(L-1))*sy);return{n,pct:p,txt:`快速连射 ${n} 个敌人：${clsMtx(p)}`}}},
 {id:'aimm',t:0,n:'燎原矢',r:24,col:2,pre:['aexp'],ty:'arw',el:'fire',ic:'☄',fx:'boom',mana:L=>5+0.3*(L-1),syn:[['afire','aexp'],10],v:(L,sy,k)=>{const d=CLS_DR(10,18,6,10,L,sy*k),b=Math.round((5+4*(L-1))*sy*k);return{dmg:d,sp:100,sn:4,bd:b,bdur:4,txt:`烈焰之箭：武器伤害并附加 ${clsDtx(d,'fire')}，爆炸波及 4 个敌人，地面燃烧每秒 ${b}（4 秒）`}}},
 {id:'afrz',t:0,n:'冰封矢',r:30,col:0,pre:['aice'],ty:'arw',el:'cold',ic:'🌨',fx:'ring',mana:L=>6+0.3*(L-1),syn:[['acold','aice'],7],v:(L,sy,k)=>{const d=CLS_DR(8,12,4,6,L,sy*k);return{dmg:d,sp:100,sn:4,stun:1.5,txt:`寒冰爆裂之箭：武器伤害并附加 ${clsDtx(d,'cold')}，波及 4 个敌人，冻结 1.5 秒`}}},
 // 标枪与长矛
 {id:'ajab',t:1,n:'三连刺',r:1,col:0,ty:'arw',ic:'🔱',fx:'stab',mana:L=>1.5+0.15*(L-1),v:L=>{const p=Math.min(60,-15+5*(L-1));return{pct:p,hits:3,txt:`快速连刺 3 下：每下 ${clsMtx(p)}`}}},
 {id:'apow',t:1,n:'雷鸣刺',r:6,col:1,pre:['ajab'],ty:'arw',el:'light',ic:'⚡',fx:'bolt',mana:L=>1.5+0.15*(L-1),syn:[['achg','alstr'],10],v:(L,sy,k)=>{const d=CLS_DR(1,6,1,4,L,sy*k);return{dmg:d,cn:2,cd:d,txt:`雷霆一刺：武器伤害并附加 ${clsDtx(d,'light')}，再放出 2 道电弧各 ${clsDtx(d,'light')}`}}},
 {id:'apoi',t:1,n:'毒牙投枪',r:6,col:2,ty:'arw',el:'pois',ic:'🐍',fx:'stab',mana:L=>3+0.25*(L-1),syn:[['aplag'],12],v:(L,sy,k)=>{const d=Math.round((5+4*(L-1))*sy*k);return{pd:d,pdur:3,pn:4,txt:`投出淬毒标枪：武器伤害，毒雾笼罩 4 个敌人 ${amaPtx(d,3)}`}}},
 {id:'aimp',t:1,n:'贯心刺',r:12,col:0,pre:['ajab'],ty:'arw',ic:'🗡',fx:'slash',mana:L=>3,v:(L,sy)=>{const p=Math.round((100+25*(L-1))*sy);return{pct:p,ar:30,txt:`全力贯刺：${clsMtx(p)}，本次命中 +30%`}}},
 {id:'albolt',t:1,n:'雷矛',r:12,col:2,pre:['apow','apoi'],ty:'arw',el:'light',ic:'🌩',fx:'bolt',mana:L=>4+0.2*(L-1),syn:[['apow','achg','alstr','afury'],8],v:(L,sy,k)=>{const d=CLS_DR(1,12,1,5,L,sy*k);return{el:'light',n:2,dmg:d,txt:`化作闪电的标枪贯穿 2 个敌人：武器伤害全部转为闪电，并附加 ${clsDtx(d,'light')}`}}},
 {id:'achg',t:1,n:'荷电刺',r:18,col:1,pre:['apow','albolt'],ty:'arw',el:'light',ic:'🔆',fx:'bolt',mana:L=>3+0.2*(L-1),syn:[['apow','alstr'],10],v:(L,sy,k)=>{const n=Math.min(8,2+Math.floor(L/4)),d=CLS_DR(1,8,1,5,L,sy*k);return{cn:n,cd:d,txt:`刺中后迸出 ${n} 道电荷，随机击中敌人各 ${clsDtx(d,'light')}`}}},
 {id:'aplag',t:1,n:'疫病之矛',r:18,col:2,pre:['albolt'],ty:'arw',el:'pois',ic:'☣',fx:'stab',mana:L=>5+0.3*(L-1),syn:[['apoi'],12],v:(L,sy,k)=>{const d=Math.round((10+7*(L-1))*sy*k);return{pd:d,pdur:4,pn:8,txt:`疫毒标枪：武器伤害，毒云笼罩 8 个敌人 ${amaPtx(d,4)}`}}},
 {id:'afend',t:1,n:'回旋突刺',r:24,col:0,pre:['aimp'],ty:'arw',ic:'🌀',fx:'slash',mana:L=>4,v:(L,sy)=>{const n=Math.min(8,3+Math.floor(L/4)),p=Math.round((40+10*(L-1))*sy);return{n,pct:p,txt:`连续突刺周围 ${n} 个敌人：各 ${clsMtx(p)}`}}},
 {id:'alstr',t:1,n:'天雷刺',r:30,col:1,pre:['achg'],ty:'arw',el:'light',ic:'⛈',fx:'bolt',mana:L=>6,syn:[['apow','achg'],10],v:(L,sy,k)=>{const n=Math.min(10,2+Math.floor(L/3)),p=Math.round((20+5*(L-1))*sy),d=CLS_DR(4,16,2,7,L,sy*k);return{pct:p,cn:n,cd:d,txt:`引雷一刺：${clsMtx(p)}，落雷连锁 ${n} 次各 ${clsDtx(d,'light')}`}}},
 {id:'afury',t:1,n:'雷霆怒涛',r:30,col:2,pre:['aplag'],ty:'arw',el:'light',ic:'🌊',fx:'bolt',mana:L=>6+0.3*(L-1),syn:[['apow','albolt','achg','alstr'],8],v:(L,sy,k)=>{const n=Math.min(12,3+Math.floor(L/2)),d=CLS_DR(6,24,3,9,L,sy*k);return{el:'light',cn:n,cd:d,txt:`雷光标枪：武器伤害全部转为闪电，炸开 ${n} 道闪电各 ${clsDtx(d,'light')}`}}},
 // 被动与魔法
 {id:'asight',t:2,n:'猎眼印记',r:1,col:0,ty:'debuff',g:'mark',ic:'👁',fx:'ring',mana:L=>5,sm:2,v:L=>{const d=Math.min(75,25+5*(L-1)),t=8+L;return{dd:d,dur:t,txt:`标记全部敌人：防御 -${d}%，持续 ${t} 秒（与迟滞力场互斥）`}}},
 {id:'acrit',t:2,n:'致命洞察',r:1,col:1,ty:'passive',ic:'💢',v:L=>{const c=Math.min(60,dim(L,5,60));return{crit:c,txt:`被动：攻击 ${c}% 几率重击(双倍伤害)`}}},
 {id:'adodge',t:2,n:'侧闪',r:6,col:2,ty:'passive',ic:'💨',v:L=>{const d=Math.min(35,dim(L,10,45));return{dodge:d,txt:`被动：${d}% 几率闪开伤害（与灵避、疾影叠乘，总计不超过 60%）`}}},
 {id:'aslow',t:2,n:'迟滞力场',r:12,col:0,pre:['asight'],ty:'debuff',g:'mark',ic:'🕸',fx:'ring',mana:L=>5,sm:2,v:L=>{const w=Math.min(50,25+3*(L-1)),t=10+L;return{wk:w,dd:10,dur:t,txt:`力场笼罩全部敌人：伤害 -${w}%，防御 -10%，持续 ${t} 秒（与猎眼印记互斥）`}}},
 {id:'aavoid',t:2,n:'灵避',r:12,col:2,pre:['adodge'],ty:'passive',ic:'🍃',v:L=>{const d=Math.min(35,dim(L,10,45));return{dodge:d,txt:`被动：${d}% 几率闪开伤害（与侧闪、疾影叠乘）`}}},
 {id:'apen',t:2,n:'锐眼',r:18,col:1,pre:['acrit'],ty:'passive',cat:'*',ic:'🔭',v:L=>{const a=40+12*(L-1);return{ar:a,txt:`被动：命中 +${a}%`}}},
 {id:'adecoy',t:2,n:'幻影替身',r:24,col:0,pre:['aslow'],ty:'asum',ic:'👤',mana:L=>Math.max(6,15-0.5*(L-1)),v:L=>{const h=60+25*L,t=20+2*(L-1);return{n:1,hp:h,dur:t,txt:`召出替身吸引敌人攻击：生命 ${h}，存在 ${t} 秒`}}},
 {id:'aevade',t:2,n:'疾影',r:24,col:2,pre:['aavoid'],ty:'passive',ic:'👣',v:L=>{const d=Math.min(30,dim(L,8,40));return{dodge:d,txt:`被动：${d}% 几率闪开伤害（与侧闪、灵避叠乘）`}}},
 {id:'avalk',t:2,n:'英灵战姬',r:30,col:0,pre:['adecoy'],ty:'asum',ic:'⚔',mana:L=>Math.max(10,25-0.5*(L-1)),v:(L,sy,k)=>{const d=CLS_DR(12,20,6,9,L,k),h=200+50*L;return{n:1,dmg:d,hp:h,txt:`召唤英灵战姬并肩作战：攻击 ${clsDtx(d,'phys')}，生命 ${h}`}}},
 {id:'apier',t:2,n:'透矢',r:30,col:1,pre:['apen'],ty:'passive',ic:'➶',v:L=>{const p=Math.min(75,dim(L,15,80));return{pier:p,txt:`被动：弓箭与标枪 ${p}% 几率穿透目标，再命中后方一个敌人`}}},
]);
CLS_SKPLAN.ama={order:['afire','acrit','afire','afire','afire','adodge','amul','adodge','amul','acold','amul','amul','amul','aexp','aexp','aexp','aexp','aexp','aexp','aguide','asight','aexp','aexp','aexp','aexp','aexp',
  'aimm','aimm','aslow','adecoy','aimm','aimm','aimm','avalk','aimm','aimm','aimm'],
 fill:()=>['aimm','aexp','afire','amul','avalk','astraf','apen','apier','acrit']};
clsRegister();
// 数值：协同 sy 只乘武器百分比与元素附加；元素附加再乘技能系数 k（ama），召唤物乘 amas；武器部分在 clsMelee 里乘 amam
{const f=clsSV;clsSV=function(id,L){const s=SKM[id];if(s&&s.cls==='ama')return s.v(Math.max(1,L),syn(id),s.ty==='asum'?clsBalK(CLS_BAL.amas):clsDk('ama'));return f(id,L)}}
// ---------- 施放判定 ----------
// 远程武器攻击估值：武器部分 × 近战系数 × 重击，加元素附加/溅射/连锁/灼烧/毒素
{const f=clsEst;clsEst=function(s,ms){if(s.ty!=='arw')return f(s,ms);const v=SV(s.id,slvl(s.id)),n=ms.length,tn=Math.min(n,v.n||1);
 let e=(clsWAvg()*(1+(v.pct||0)/100)+(v.flat||0))*clsMk()*(1+(ST.bcrit||0)/100)*(v.hits||1)*tn*(1+(ST.apier||0)/200);const ed=v.dmg?clsAvgD(v.dmg)*elMul(s.el):0;
 e+=ed*tn;if(v.sp)e+=ed*v.sp/100*Math.min(n-tn,v.sn||3);if(v.cn)e+=v.cn*clsAvgD(v.cd)*elMul('light');
 // 持续伤害只按「尚未中毒/灼烧（剩余≤1秒）」的目标估值：否则毒素估值恒高，疫病之矛等会一直压过连珠箭等箭矢技能（重复施放只会刷新毒素）
 // 每个目标的持续伤害不超过其剩余生命（溢出的毒素不算收益）
 const dot=(arr,k,tot)=>arr.reduce((t,m)=>t+(m[k]&&m[k].left>1?0:Math.min(tot,Math.max(0,m.hp))),0);
 if(v.bd)e+=dot(ms.slice(0,tn+(v.sn||0)),'burn',v.bd*(v.bdur||4)*elMul('fire'));if(v.pd)e+=dot(ms.slice(0,v.pn||1),'pois',v.pd*(v.pdur||3));return e}}
{const f=acFeasible;acFeasible=function(id,ms){const s=SKM[id];if(!s||s.cls!=='ama')return f(id,ms);if(!castable(id))return 0;
 if(s.ty==='asum'){if(!ms.length)return 0;return amaPets(id).length<SV(id,slvl(id)).n}
 if(s.ty==='debuff'&&s.g&&clsGroupPick(s.g)!==id)return 0;
 return f(id,ms)}}
{const f=acSmart;acSmart=function(id,ms){const s=SKM[id];if(s&&s.ty==='asum')return 1;return f(id,ms)}}
{const f=acSmartTxt;acSmartTxt=function(id){const s=SKM[id];if(s&&s.ty==='asum')return'未在场时召唤';const t=f(id);return s&&s.cls==='ama'&&s.g==='mark'?t+'（两种印记只施放等级最高的一种）':t}}
// ---------- 属性：弓按敏捷、标枪按力敏加成武器伤害；攻击更快；闪避叠乘；透矢 ----------
const AMA_BOW=new Set(['bow','xbow','abow']),AMA_JAV=new Set(['jav','ajav']);
{const f=clsCalc;clsCalc=function(o){f(o);if(curCls()!=='ama')return;const A=o.attr,c=clsWCat(),sb=1+A.str/100;
 const k=AMA_BOW.has(c)?(1+A.dex/100)/sb:AMA_JAV.has(c)?(1+0.75*(A.str+A.dex)/100)/sb:1;
 if(k!==1){o.wmin=Math.floor(o.wmin*k);o.wmax=Math.floor(o.wmax*k);o.wmul=(o.wmul||1)*k}
 o.atkT*=2/3;// 射手出手快：基础攻击间隔 1.5→1.0 秒（每秒出手数是平衡的关键，否则伤害都溢出在单个目标上）
 const M=o.M||{};let keep=1,pier=0;for(const s of CLS_SKILLS){if(s.cls!=='ama'||s.ty!=='passive')continue;const b=bl(s.id);if(!b)continue;
  const v=clsSV(s.id,b+o.allsk+(M['tc_ama'+s.t]||0)+(o['sk_'+s.id]||0));if(v.dodge)keep*=1-v.dodge/100;if(v.pier)pier=v.pier}
 if(keep<1)o.cdodge=Math.max(o.cdodge||0,Math.min(60,Math.round(100*(1-keep))));o.apier=pier}}
// ---------- 自动加点：力量够装备后，法力少量，其余优先敏捷(1.2×等级+20)再体力 ----------
{const f=autoTick;autoTick=function(){if(curCls()==='ama'&&S.autoAt&&S.sp>0&&ST){const ns=needStr();
 while(S.sp>0){if(ST.attr.str<ns)S.at.str++;else if(clsBase().autoEne())S.at.ene++;else if(S.at.dex<20+1.2*S.lvl)S.at.dex++;else S.at.vit++;S.sp--;calc()}}return f()}}
// 战力（自动换装用）：荒野射手的非弓/标枪武器战力记为 1，自动换装不会换上锤剑魔杖（吃不到敏捷加成、白加力量）
{const f=power;power=function(it){const p=f(it);if(curCls()!=='ama'||!it||it.k)return p;const b=BASEM[it.b];return b&&b.s==='weapon'&&!AMA_BOW.has(b.cat)&&!AMA_JAV.has(b.cat)?1:p}}
// ---------- 画面：召唤物卡片 ----------
if(typeof IMG!=='undefined')for(const s of CLS_SKILLS)if(s.cls==='ama'&&s.ty==='asum')IMG['ama_'+s.id]=`assets/summon/ama_${s.id}.webp`;
{const f=allyCard;allyCard=function(a){if(a.kind!=='apet')return f(a);const s=SKM[a.sub];const t=a.until?`<em class="tm">${Math.max(0,Math.ceil(a.until-GT))}s</em>`:'';
 return`<div class="ac ${a.hitT>0?'hit':''}" id="ca${a.uid}">${t}<div class="pt">${art('ama_'+a.sub,s?s.ic:'🏹')}</div><div class="nm">${a.n}</div>${bar(a.hp,a.max,'hp g')}</div>`}}
// ---------- 专属底材：弓（双手）与标枪 aw1-aw5 ----------
TWOH.add('abow');TCAP.abow=[3,4,5];TCAP.ajav=[0,0,0];ITYPES.abow=['weap','miss','bow','amaw'];ITYPES.ajav=['weap','miss','jave','thro','amaw'];
if(typeof CATN!=='undefined')Object.assign(CATN,{abow:'弓',ajav:'标枪'});
{const nb=[W2('aw1','abow','鹿角猎弓',3,0,[3,9],0,20,3),W2('aw2','ajav','少女投枪',12,0,[9,20],25,30,0),W2('aw3','abow','灰木灵弓',24,0,[10,28],40,55,4),
 W2('aw4','ajav','祭典标枪',40,1,[25,52],60,80,0),W2('aw5','abow','母神巨弓',62,2,[22,72],90,140,5)];
 for(const b of nb){b.cls=1;b.ccls='ama';BASES.push(b);BASEM[b.id]=b}}
{const add=(n,lv,rq,k,v)=>PREFIX.push(AF(n,lv,rq,'skill','amaw,amul',{[k]:[v,v]}));const T=[['弦音的','鹰羽的','天弓的'],['掷矛的','雷枪的','战姬的'],['敏行的','魅影的','英灵的']];
 for(let t=0;t<3;t++){const k='tc_ama'+t;MODT[k]='+{v} '+CLS_DEF.ama.trees[t]+'（荒野射手专属）';HIDDEN_KEYS.add(k);T[t].forEach((n,i)=>add(n,[20,40,60][i],[15,30,45][i],k,i+1))}}
if(typeof STAFFMOD_CATS!=='undefined'){STAFFMOD_CATS.add('abow');STAFFMOD_CATS.add('ajav')}// 专属弓/标枪可出荒野射手单技能词缀
