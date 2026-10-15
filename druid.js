'use strict';
// ===================================================================================
// druid.js — 德鲁伊(dru)：自然元素 / 变形 / 召唤 三系 30 技能 + 专属头饰(毛皮兜帽) + 专属词缀。
// 走 classes.js 的数据驱动技能引擎；本文件新增 3 种技能类型：
//   csum   召唤自然生物（盟友 kind='dpet'，sub=技能 id；g 同组互斥：藤蔓 vine / 灵体 spirit，灵体在场时给英雄光环增益）
//   dhit   变形近战（需处于狼人/熊人形态；n 个目标各打 hits 下，可带吸血 ll）
//   plague 狂噬：近战一击 + 毒素传染给多个敌人
// 美术：技能图标/特效 assets/skills/<id>.webp、fx_<id>.webp（manifest 登记）；召唤物 assets/summon/dru_<id>.webp；变身形态 assets/char/dru_wolf|dru_bear.webp
// 必须在 classes.js 之后、eg_power.js / classes2.js 之前加载。
// ===================================================================================
CLS_BAL.dru=[[1,0.2],[12,0.32],[24,0.35],[30,0.28]];// 技能/召唤伤害系数（按等级插值，对标亡灵术士 60 秒击杀）
CLS_BAL.drum=[[1,1],[12,1.85],[24,1.65],[30,1.8]];// 变形近战伤害系数
CLS_BAL.drus=[[1,1],[12,1],[24,1],[30,1]];// 召唤物伤害系数（召唤物不吃技能系数 dk，单独调）
CLS_DEF.dru={n:'德鲁伊',ic:'🐺',glyph:'🐺',at:{str:15,dex:20,vit:25,ene:20},life0:55,lpl:1.5,lpv:2,mana0:20,mpl:2,mpe:2,trees:['自然元素','变形','召唤'],
 sk:{dfs:1},eq:['mac1'],ww:1,mk:()=>clsBalK(CLS_BAL.drum),dk:()=>clsBalK(CLS_BAL.dru),autoEne:()=>S.at.ene<Math.floor(S.lvl*1.2)+25};
// ---------- 新技能类型 ----------
Object.assign(CLS_TYK,{csum:'csum',dhit:'melee',plague:'melee'});Object.assign(CLS_PRI,{csum:1,dhit:8,plague:7});Object.assign(CLS_TYR,{dhit:2,plague:2});
for(const t of['dhit','plague']){CLS_SINGLE.add(t);CLS_MELEE.add(t)}
if(!AC_KINDS.includes('csum'))AC_KINDS.push('csum');
const druPets=id=>ALLY.filter(a=>a.kind==='dpet'&&a.sub===id&&a.hp>0);
const druForm=()=>{for(const k in H.cbs||{}){const b=H.cbs[k];if(b.g==='shape'&&b.until>GT)return k}return null};
CLS_TY.csum=function(s,v){if(s.g)for(const a of ALLY)if(a.kind==='dpet'&&a.g===s.g&&a.sub!==s.id)a.hp=0;
 addAlly('dpet',{sub:s.id,g:s.g,n:s.n,hp:v.hp,dmg:v.dmg||[0,0],el:s.el||'phys',until:v.dur?GT+v.dur:0,heal:v.heal||0,mreg:v.mreg||0});
 if(v.aura)setBuff(s.id,Object.assign({dur:1e6,pet:1},v.aura),'spirit');floatHero(s.n,'#9e6');return[]};
CLS_TY.dhit=function(s,v,ms,tg){const L=clsOthers(ms,tg).slice(0,v.n||1);let d=0;for(const m of L)for(let i=0;i<(v.hits||1);i++)d+=clsMelee(m,v.pct,v.flat,v);if(v.ll&&d)H.life=Math.min(ST.life,H.life+d*v.ll/100);return L};
CLS_TY.plague=function(s,v,ms,tg){clsMelee(tg,v.pct,0,v);const L=clsOthers(ms,tg).slice(0,v.n);for(const m of L)if(m.hp>0)m.pois={dps:v.dps*(1-resOf(m,'pois')/100),left:v.pdur,src:'hero'};return L};
// ---------- 技能 ----------
const druSh='（需狼人或熊人形态）';
clsDef('dru',[
 // 自然元素
 {id:'dfs',t:0,n:'野火风暴',r:1,col:0,ty:'aoe',el:'fire',ic:'🔥',fx:'boom',mana:L=>4+0.3*(L-1),sm:1,syn:[['dmb','dfis','darm'],12],v:(L,sy)=>{const d=CLS_DR(4,8,3,5,L,sy),p=Math.round((2+1.5*(L-1))*sy);return{dmg:d,n:3,dps:p,bdur:3,txt:`烈焰扫过 3 个敌人：${clsDtx(d,'fire')}，并灼烧每秒 ${p}（3 秒）`}}},
 {id:'dab',t:0,n:'极地寒息',r:1,col:2,ty:'cone',el:'cold',ic:'🌬',fx:'ring',mana:L=>3+0.3*(L-1),syn:[['dcyc','dhur'],12],v:(L,sy)=>{const d=CLS_DR(3,6,2,4,L,sy);return{dmg:d,n:3,slow:2,txt:`寒风吹袭前方 3 个敌人：各 ${clsDtx(d,'cold')}，减速 2 秒`}}},
 {id:'dmb',t:0,n:'熔岩巨石',r:6,col:0,pre:['dfs'],ty:'splash',el:'fire',ic:'🪨',fx:'boom',mana:L=>6+0.5*(L-1),sm:1,syn:[['dfs','dvol'],12],v:(L,sy)=>{const d=CLS_DR(10,16,7,10,L,sy);return{dmg:d,sp:50,n:4,txt:`巨石碾过：命中 ${clsDtx(d,'fire')}，沿途 4 个敌人受 50% 伤害`}}},
 {id:'dfis',t:0,n:'大地裂隙',r:12,col:1,pre:['dmb'],ty:'aoe',el:'fire',ic:'🌋',fx:'boom',mana:L=>12+(L-1),sm:3,syn:[['dfs','dmb','dvol'],10],v:(L,sy)=>{const d=CLS_DR(15,24,10,14,L,sy),p=Math.round((4+3*(L-1))*sy);return{dmg:d,n:6,dps:p,bdur:3,txt:`大地裂开：6 个敌人受 ${clsDtx(d,'fire')}，并灼烧每秒 ${p}（3 秒）`}}},
 {id:'dcyc',t:0,n:'旋风护甲',r:12,col:2,pre:['dab'],ty:'buff',g:'carm',ic:'🍃',fx:'shield',mana:L=>10,v:L=>{const r=Math.min(50,15+3*(L-1)),df=30+8*(L-1),t=60+10*(L-1);return{res:r,def:df,dur:t,txt:`风之屏障：全部抗性 +${r}%，防御 +${df}%，持续 ${t} 秒`}}},
 {id:'dtw',t:0,n:'扭曲旋风',r:18,col:2,pre:['dcyc'],ty:'cone',el:'phys',ic:'🌪',fx:'slash',mana:L=>7,syn:[['dcyc','dtor','dhur'],10],v:(L,sy)=>{const d=CLS_DR(6,10,4,6,L,sy);return{dmg:d,n:3,stun:0.5,txt:`三道旋风卷向 3 个敌人：各 ${clsDtx(d,'phys')}，击晕 0.5 秒`}}},
 {id:'dvol',t:0,n:'火山',r:24,col:1,pre:['dfis'],ty:'turret',el:'fire',ic:'🌋',fx:'boom',mana:L=>20+(L-1),syn:[['dfs','dmb','dfis'],8],v:(L,sy)=>{const d=CLS_DR(14,22,7,10,L,sy),t=10+L;return{dmg:d,iv:1.5,n:2,dur:t,txt:`地涌火山 ${t} 秒：每 1.5 秒喷出 2 块熔岩，各 ${clsDtx(d,'fire')}`}}},
 {id:'dtor',t:0,n:'龙卷风暴',r:24,col:2,pre:['dtw'],ty:'bolt',el:'phys',ic:'🌀',fx:'slash',mana:L=>10+0.5*(L-1),syn:[['dtw','dcyc','dhur'],10],v:(L,sy)=>{const d=CLS_DR(28,40,12,16,L,sy);return{dmg:d,txt:`龙卷风撕裂单体 ${clsDtx(d,'phys')}`}}},
 {id:'darm',t:0,n:'陨火天降',r:30,col:0,pre:['dvol'],ty:'turret',el:'fire',ic:'☄',fx:'boom',mana:L=>35+(L-1),syn:[['dfis','dvol','dmb'],6],v:(L,sy)=>{const d=CLS_DR(20,30,10,14,L,sy),t=10+L;return{dmg:d,iv:1,n:3,dur:t,txt:`天火坠落 ${t} 秒：每秒落下 3 颗陨火，各 ${clsDtx(d,'fire')}`}}},
 {id:'dhur',t:0,n:'极寒飓风',r:30,col:2,pre:['dtor'],ty:'turret',el:'cold',ic:'🌨',fx:'ring',mana:L=>30,syn:[['dab','dcyc','dtor'],6],v:(L,sy)=>{const d=CLS_DR(10,16,6,8,L,sy),t=10+L;return{dmg:d,iv:1.5,n:4,dur:t,txt:`飓风环身 ${t} 秒：每 1.5 秒冰风击中 4 个敌人，各 ${clsDtx(d,'cold')}`}}},
 // 变形
 {id:'dwere',t:1,n:'狼人化',r:1,col:0,ty:'buff',g:'shape',ic:'🐺',fx:'spirit',mana:L=>15,v:L=>{const i=Math.min(60,20+3*(L-1)),a=50+15*(L-1),l=15+3*(L-1),t=60+12*(L-1);return{ias:i,ar:a,life:l,dur:t,txt:`化身狼人：攻速 +${i}%，命中 +${a}%，生命 +${l}%，持续 ${t} 秒（与熊人化互斥）`}}},
 {id:'dlyc',t:1,n:'兽魂',r:1,col:1,ty:'passive',ic:'💚',v:L=>{const l=Math.min(100,10+4*(L-1));return{life:l,txt:`被动：野兽之魂，最大生命 +${l}%`}}},
 {id:'dbear',t:1,n:'熊人化',r:6,col:2,ty:'buff',g:'shape',ic:'🐻',fx:'spirit',mana:L=>15,v:L=>{const l=25+5*(L-1),df=50+15*(L-1),w=30+8*(L-1),t=60+12*(L-1);return{life:l,def:df,wdmg:w,dur:t,txt:`化身熊人：生命 +${l}%，防御 +${df}%，伤害 +${w}%，持续 ${t} 秒（与狼人化互斥）`}}},
 {id:'dferal',t:1,n:'野性狂怒',r:12,col:0,pre:['dwere'],ty:'dhit',form:1,ic:'😾',fx:'slash',mana:L=>3,v:(L,sy)=>{const p=Math.round((40+12*(L-1))*sy),l=Math.min(15,4+0.5*(L-1));return{pct:p,ll:l,n:2,txt:`狂怒扑咬 2 个敌人：${clsMtx(p)}，伤害 ${l}% 转为生命${druSh}`}}},
 {id:'dmaul',t:1,n:'重殴',r:12,col:2,pre:['dbear'],ty:'dhit',form:1,ic:'🐾',fx:'slash',mana:L=>3,v:(L,sy)=>{const p=Math.round((50+15*(L-1))*sy);return{pct:p,n:2,stun:1,txt:`熊掌重击 2 个敌人：${clsMtx(p)}，击晕 1 秒${druSh}`}}},
 {id:'drab',t:1,n:'狂噬',r:18,col:0,pre:['dferal'],ty:'plague',form:1,el:'pois',ic:'🦠',fx:'slash',mana:L=>6,v:(L,sy)=>{const p=Math.round((20+6*(L-1))*sy),d=Math.round((4+3*(L-1))*sy),n=Math.min(8,3+Math.floor(L/4));return{pct:p,dps:d,pdur:4,n,txt:`狂犬噬咬：${clsMtx(p)}，毒素传染 ${n} 个敌人，每秒 ${d} 毒素（4 秒）${druSh}`}}},
 {id:'dclaw',t:1,n:'焰爪',r:18,col:1,pre:['dlyc'],ty:'dhit',form:1,el:'fire',ic:'🔥',fx:'boom',mana:L=>4,v:(L,sy)=>{const p=Math.round((60+15*(L-1))*sy);return{pct:p,el:'fire',n:3,txt:`燃烧之爪横扫 3 个敌人：${clsMtx(p)}，伤害全部转为火焰${druSh}`}}},
 {id:'dhung',t:1,n:'饥噬',r:24,col:1,pre:['dclaw'],ty:'dhit',form:1,ic:'🩸',fx:'slash',mana:L=>3,v:(L,sy)=>{const p=Math.round((30+10*(L-1))*sy),l=Math.min(60,30+2*(L-1));return{pct:p,ll:l,txt:`饥渴撕咬：${clsMtx(p)}，伤害 ${l}% 转为生命${druSh}`}}},
 {id:'dshock',t:1,n:'震地波',r:24,col:2,pre:['dmaul'],ty:'mall',form:1,ic:'💢',fx:'ring',mana:L=>7,sm:2,v:(L,sy)=>{const p=Math.round((-30+8*(L-1))*sy),s=Math.min(3,+(1+0.2*(L-1)).toFixed(1));return{pct:p,n:8,stun:s,sure:1,txt:`踏地震波：全部敌人受 ${clsMtx(p)}（必中），击晕 ${s} 秒${druSh}`}}},
 {id:'dfury',t:1,n:'狂怒连击',r:30,col:0,pre:['drab'],ty:'dhit',form:1,ic:'⚡',fx:'slash',mana:L=>4,v:(L,sy)=>{const h=Math.min(5,2+Math.floor(L/5)),p=Math.round((50+12*(L-1))*sy);return{n:h,pct:p,txt:`疾风连击 ${h} 个敌人：各 ${clsMtx(p)}${druSh}`}}},
 // 召唤
 {id:'drav',t:2,n:'渡鸦群',r:1,col:0,ty:'csum',ic:'🐦',mana:L=>6,v:(L,sy)=>{const n=Math.min(5,1+Math.floor(L/2)),d=CLS_DR(2,4,1,2,L,sy),h=8+4*L;return{n,dmg:d,hp:h,dur:60,txt:`召唤渡鸦（最多 ${n} 只，存在 60 秒）：啄击 ${clsDtx(d,'phys')}，生命 ${h}`}}},
 {id:'dvine',t:2,n:'剧毒藤',r:1,col:2,ty:'csum',g:'vine',el:'pois',ic:'🌿',mana:L=>8,v:(L,sy)=>{const d=CLS_DR(4,6,3,4,L,sy),h=30+10*L;return{n:1,dmg:d,hp:h,txt:`种下毒藤：缠绕敌人造成 ${clsDtx(d,'phys').replace('物理','毒素')}，生命 ${h}（藤蔓同时只存在一种）`}}},
 {id:'doak',t:2,n:'橡木之灵',r:6,col:1,ty:'csum',g:'spirit',ic:'🌳',mana:L=>15,v:L=>{const l=30+5*(L-1),h=40+15*L;return{n:1,hp:h,aura:{life:l},txt:`召出橡木之灵（生命 ${h}）：在场时你的最大生命 +${l}%（灵体同时只存在一种）`}}},
 {id:'dswolf',t:2,n:'灵狼',r:6,col:0,pre:['drav'],ty:'csum',ic:'🐺',mana:L=>12,v:(L,sy)=>{const n=Math.min(5,L),d=CLS_DR(3,6,2,3,L,sy),h=30+12*L;return{n,dmg:d,hp:h,txt:`召唤灵狼（最多 ${n} 只）：撕咬 ${clsDtx(d,'phys')}，生命 ${h}`}}},
 {id:'dcvine',t:2,n:'腐生藤',r:12,col:2,pre:['dvine'],ty:'csum',g:'vine',ic:'🥀',mana:L=>10,v:L=>{const h=Math.min(3,+(0.5+0.1*(L-1)).toFixed(1)),hp=40+12*L;return{n:1,hp,heal:h,txt:`种下腐生藤（生命 ${hp}）：每秒为你回复 ${h}% 最大生命（藤蔓同时只存在一种）`}}},
 {id:'dheart',t:2,n:'狼獾之心',r:18,col:1,pre:['doak'],ty:'csum',g:'spirit',ic:'❤',mana:L=>20,v:L=>{const w=20+6*(L-1),a=25+7*(L-1),h=60+18*L;return{n:1,hp:h,aura:{wdmg:w,ar:a,sumdmg:w},txt:`召出狼獾之心（生命 ${h}）：在场时你与召唤物伤害 +${w}%，命中 +${a}%（灵体同时只存在一种）`}}},
 {id:'ddire',t:2,n:'恐狼',r:18,col:0,pre:['dswolf'],ty:'csum',ic:'🐕',mana:L=>20,v:(L,sy)=>{const n=Math.min(3,1+Math.floor(L/4)),d=CLS_DR(8,14,4,6,L,sy),h=80+25*L;return{n,dmg:d,hp:h,txt:`召唤恐狼（最多 ${n} 只）：撕咬 ${clsDtx(d,'phys')}，生命 ${h}`}}},
 {id:'dsolar',t:2,n:'日光藤',r:24,col:2,pre:['dcvine'],ty:'csum',g:'vine',ic:'🌻',mana:L=>12,v:L=>{const m=Math.min(4,+(1+0.15*(L-1)).toFixed(1)),hp=60+15*L;return{n:1,hp,mreg:m,txt:`种下日光藤（生命 ${hp}）：每秒为你回复 ${m}% 最大法力（藤蔓同时只存在一种）`}}},
 {id:'dbarb',t:2,n:'荆棘之灵',r:24,col:1,pre:['dheart'],ty:'csum',g:'spirit',ic:'🌵',mana:L=>25,v:L=>{const t=10+8*(L-1),h=80+20*L;return{n:1,hp:h,aura:{thorns:t,def:30},txt:`召出荆棘之灵（生命 ${h}）：在场时近战攻击你的敌人受到 ${t} 点反伤，防御 +30%（灵体同时只存在一种）`}}},
 {id:'dgriz',t:2,n:'灰熊王',r:30,col:0,pre:['ddire'],ty:'csum',ic:'🐻',mana:L=>40,v:(L,sy)=>{const d=CLS_DR(30,45,10,15,L,sy),h=300+60*L;return{n:1,dmg:d,hp:h,txt:`召唤灰熊王：重击 ${clsDtx(d,'phys')}，生命 ${h}`}}},
]);
CLS_SKPLAN.dru={order:['dfs','drav','dfs','dfs','dfs','dswolf','dmb','dfs','doak','dswolf','dfs','dfis','dfis','dfis','dfis','dfis','dfis','ddire','dfis','dfis','dfis','dfis','dfis','dvol','dfis','dfis','dvol','dfis','dvol','dfis','darm','dgriz','dvol','darm'],
 fill:()=>['dfis','dvol','darm','dmb','dfs','dswolf','ddire','dgriz','doak']};
clsRegister();
// 召唤物数值：协同 × 召唤系数 drus；变形近战：只乘协同（伤害由近战系数 drum 统一缩放）；两者都不乘技能系数 dk
{const f=clsSV;clsSV=function(id,L){const s=SKM[id];if(s&&s.cls==='dru'){if(s.ty==='csum')return s.v(Math.max(1,L),syn(id)*clsBalK(CLS_BAL.drus));if(s.form)return s.v(Math.max(1,L),syn(id))}return f(id,L)}}
// ---------- 施放判定 ----------
// 狂噬估值：近战只打一个目标 + 毒素按传染数量计
{const f=clsEst;clsEst=function(s,ms){if(s.ty!=='plague')return f(s,ms);const v=SV(s.id,slvl(s.id));return clsWAvg()*(1+(v.pct||0)/100)+v.dps*v.pdur*Math.min(ms.length,v.n)/Math.max(0.05,clsMk())}}
{const f=acFeasible;acFeasible=function(id,ms){const s=SKM[id];if(!s||s.cls!=='dru')return f(id,ms);if(!castable(id))return 0;
 if(s.form&&!druForm())return 0;
 if(s.ty==='csum'){if(!ms.length)return 0;if(s.g&&clsGroupPick(s.g)!==id)return 0;return druPets(id).length<SV(id,slvl(id)).n}
 return f(id,ms)}}
{const f=acSmart;acSmart=function(id,ms){const s=SKM[id];if(s&&s.ty==='csum')return 1;return f(id,ms)}}
{const f=acSmartTxt;acSmartTxt=function(id){const s=SKM[id];if(s&&s.ty==='csum')return s.g?'未在场时召唤（同组只保留等级最高的一种）':'数量未满时召唤';const t=f(id);return s&&s.form?t+'；需处于变身形态':t}}
// ---------- 属性：灵体光环的反伤/召唤伤害/吸血 ----------
{const f=clsCalc;clsCalc=function(o){f(o);if(curCls()!=='dru')return;for(const id in H.cbs||{}){const b=buffOn(id);if(!b)continue;
 if(b.thorns)o.thorns=(o.thorns||0)+b.thorns;if(b.sumdmg)o.sumdmg=(o.sumdmg||0)+b.sumdmg}}}
// ---------- 每帧：藤蔓回复、灵体死亡后光环消失 ----------
{const f=step;step=function(dt){const r=f(dt);if(!ST||curCls()!=='dru'||H.life<=0)return r;
 for(const a of ALLY){if(a.kind!=='dpet'||a.hp<=0)continue;if(a.heal)H.life=Math.min(ST.life,H.life+ST.life*a.heal/100*dt);if(a.mreg)H.mana=Math.min(ST.mana,H.mana+ST.mana*a.mreg/100*dt)}
 let ch=0;for(const k in H.cbs||{}){if(H.cbs[k].pet&&!druPets(k).length){delete H.cbs[k];ch=1}}if(ch)calc();return r}}
// ---------- 画面：召唤物卡片、变身立绘 ----------
if(typeof IMG!=='undefined')for(const s of CLS_SKILLS)if(s.cls==='dru'&&s.ty==='csum')IMG['dru_'+s.id]=`assets/summon/dru_${s.id}.webp`;
{const f=allyCard;allyCard=function(a){if(a.kind!=='dpet')return f(a);const s=SKM[a.sub];const t=a.until?`<em class="tm">${Math.max(0,Math.ceil(a.until-GT))}s</em>`:'';
 return`<div class="ac ${a.hitT>0?'hit':''}" id="ca${a.uid}">${t}<div class="pt">${art('dru_'+a.sub,s?s.ic:'🐾')}</div><div class="nm">${a.n}</div>${bar(a.hp,a.max,'hp g')}</div>`}}
{const f=heroArt;heroArt=function(cls){if(curCls()==='dru'){const fm=buffOn('dwere')?'wolf':buffOn('dbear')?'bear':null;
 if(fm)return`<img class="art ${cls||''}" src="assets/char/dru_${fm}.webp" alt="${fm==='wolf'?'狼人':'熊人'}" onerror="this.src='assets/char/dru_portrait.webp'">`}return f(cls)}}
// ---------- 专属底材：毛皮头饰（dp1-dp5），与野蛮人头盔同档 ----------
TCAP.pelt=[2,3,3];ITYPES.pelt=['armo','helm','pelt'];
{const nb=[A('dp1','helm','pelt','狼皮兜帽',3,0,[4,9],0,2),A('dp2','helm','pelt','鹰羽头饰',12,0,[10,16],20,2),A('dp3','helm','pelt','鹿角盔',24,0,[18,26],30,3),
 A('dp4','helm','pelt','苔纹熊首盔',40,1,[40,55],50,3),A('dp5','helm','pelt','森灵王冠',62,2,[75,100],65,3)];
 for(const b of nb){b.cls=1;b.ccls='dru';BASES.push(b);BASEM[b.id]=b}}
{const add=(n,lv,rq,k,v)=>PREFIX.push(AF(n,lv,rq,'skill','pelt,amul',{[k]:[v,v]}));const T=[['风语的','地火的','天灾的'],['兽性的','狼魂的','熊王的'],['唤灵的','森语的','万兽的']];
 for(let t=0;t<3;t++){const k='tc_dru'+t;MODT[k]='+{v} '+CLS_DEF.dru.trees[t]+'（德鲁伊专属）';HIDDEN_KEYS.add(k);T[t].forEach((n,i)=>add(n,[20,40,60][i],[15,30,45][i],k,i+1))}}
if(typeof STAFFMOD_CATS!=='undefined')STAFFMOD_CATS.add('pelt');// 毛皮头饰可出德鲁伊单技能词缀
