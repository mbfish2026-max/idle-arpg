'use strict';
// ===================================================================================
// paladin.js — 圣誓骑士(pal)：战斗技能 / 攻击光环 / 防御光环 三系 30 技能 + 专属盾(圣徽盾) + 专属词缀。
// 走 classes.js 的数据驱动技能引擎；本文件新增 2 种技能类型：
//   aura  光环：常驻增益（dur 1e6），数值每次 calc 按当前技能等级重算（升级不必重开）；
//         攻击光环同组 g='paura'、防御光环同组 g='pdaura'，各自只开一个（同时最多一攻一防），clsGroupPick 选等级最高的；
//         v.pulse=1 的元素光环（炽焰/霜誓/雷誓/圣域）每 iv 秒对全场 n 个敌人造成伤害（持续群伤）
//   ptri  誓仇之刃：近战打 n 个目标，额外附加武器伤害 ep% 的火焰/冰冷/闪电（各占 1/3）
// 美术：技能图标/特效 assets/skills/<id>.webp、fx_<id>.webp（manifest 登记）；专属盾图标 assets/icon2/ps1..ps5.webp；立绘 assets/char/pal_portrait.webp
// 必须在 classes.js 之后、eg_power.js / classes2.js 之前加载。
// ===================================================================================
CLS_BAL.pal=[[1,0.2],[3,0.4],[6,0.45],[9,0.45],[12,0.2],[15,0.65],[18,1],[21,0.85],[24,0.3],[30,0.19]];// 技能/光环伤害系数 dk（按等级插值，对标亡灵术士 60 秒击杀）
CLS_BAL.palm=[[1,0.55],[3,1.5],[6,1.8],[9,1.8],[12,1.3],[15,2.6],[18,2.4],[21,1.6],[24,0.55],[30,0.55]];// 近战伤害系数 mk
CLS_DEF.pal={n:'圣誓骑士',ic:'🛡',glyph:'🛡',at:{str:25,dex:20,vit:25,ene:15},life0:55,lpl:2,lpv:3,mana0:15,mpl:1.5,mpe:2,trees:['战斗技能','攻击光环','防御光环'],
 sk:{psac:1},eq:['swd1','shd1'],ww:1,mk:()=>clsBalK(CLS_BAL.palm),dk:()=>clsBalK(CLS_BAL.pal),autoEne:()=>S.at.ene<Math.floor(S.lvl*1.5)+15};
// ---------- 新技能类型 ----------
Object.assign(CLS_TYK,{aura:'cbuff',ptri:'melee'});Object.assign(CLS_PRI,{aura:0,ptri:7});Object.assign(CLS_TYR,{ptri:2});
CLS_SINGLE.add('ptri');CLS_MELEE.add('ptri');
CLS_TY.aura=function(s){setBuff(s.id,{dur:1e6,aura:1},s.g);floatHero(s.n,'#ffe28a');return[]};
CLS_TY.ptri=function(s,v,ms,tg){const L=clsOthers(ms,tg).slice(0,v.n||1);
 for(const m of L){if(!clsMelee(m,v.pct,0,v)||m.hp<=0)continue;const e=clsWRoll()*v.ep/100*clsMk()/3;hitMon(m,{fire:e*elMul('fire'),cold:e*elMul('cold'),light:e*elMul('light')},'hero','#ffcf70')}return L};
const palAuraOn=()=>{const r=[];for(const k in H.cbs||{}){const b=buffOn(k);if(b&&b.aura)r.push(k)}return r};
// ---------- 技能 ----------
const palSh='（需装备盾牌）',palMx=(m,el)=>m?`，${el}抗性上限 +${m}%`:'';
clsDef('pal',[
 // 战斗技能
 {id:'psac',t:0,n:'献祭斩',r:1,col:0,ty:'hit',wm:1,ic:'🗡',fx:'slash',mana:L=>1,syn:[['pzeal','pveng'],8],v:(L,sy)=>{const p=Math.round((100+20*(L-1))*sy),a=20+6*(L-1);return{pct:p,ar:a,self:2,txt:`以血起誓的一击：${clsMtx(p)}，命中 +${a}%，自身损失 2% 生命`}}},
 {id:'psmite',t:0,n:'惩戒盾击',r:1,col:2,ty:'hit',wm:1,ic:'🛡',fx:'slash',mana:L=>2,v:(L,sy)=>{const p=Math.round((30+12*(L-1))*sy),s=Math.min(2.5,+(0.6+0.1*(L-1)).toFixed(1));return{pct:p,stun:s,sure:1,txt:`盾牌猛击（必中）：${clsMtx(p)}，击晕 ${s} 秒（首领免疫）`}}},
 {id:'pbolt',t:0,n:'圣光飞矢',r:6,col:1,ty:'cone',el:'magic',ic:'✨',fx:'spirit',mana:L=>4,syn:[['pham','pfist','ppray'],12],v:(L,sy)=>{const d=CLS_DR(8,16,5,8,L,sy);return{dmg:d,n:3,txt:`圣光贯穿前方 3 个敌人：各 ${clsDtx(d,'magic')}`}}},
 {id:'pzeal',t:0,n:'热忱连斩',r:12,col:0,pre:['psac'],ty:'mhit',wm:1,ic:'⚔',fx:'slash',mana:L=>2,syn:[['psac'],6],v:(L,sy)=>{const n=Math.min(5,2+Math.floor((L-1)/4)),p=Math.round((30+10*(L-1))*sy),a=30+8*(L-1);return{n,pct:p,ar:a,txt:`疾斩连击 ${n} 个敌人：各 ${clsMtx(p)}，命中 +${a}%`}}},
 {id:'pchg',t:0,n:'破阵冲锋',r:12,col:2,pre:['psmite'],ty:'hit',wm:1,ic:'🐎',fx:'slash',mana:L=>9,v:(L,sy)=>{const p=Math.round((100+25*(L-1))*sy);return{pct:p,stun:1,txt:`策马冲锋：${clsMtx(p)}，击晕 1 秒`}}},
 {id:'pveng',t:0,n:'誓仇之刃',r:18,col:0,pre:['pzeal'],ty:'ptri',wm:1,ic:'🔱',fx:'boom',mana:L=>4,syn:[['phfire','phfrz','phshk'],5],v:(L,sy)=>{const p=Math.round((10+6*(L-1))*sy),e=Math.round((60+15*(L-1))*sy);return{n:3,pct:p,ep:e,txt:`誓仇斩击 3 个敌人：${clsMtx(p)}，并附加武器伤害 ${e}% 的火焰/冰冷/闪电（各占三分之一）`}}},
 {id:'pham',t:0,n:'圣佑旋锤',r:18,col:1,pre:['pbolt'],ty:'aoe',el:'magic',ic:'🔨',fx:'spirit',mana:L=>4+0.2*(L-1),sm:2,syn:[['paim','pvigor'],14],v:(L,sy)=>{const d=CLS_DR(12,16,8,10,L,sy);return{dmg:d,n:8,txt:`圣锤盘旋：全部敌人（最多 8 个）受 ${clsDtx(d,'magic')}`}}},
 {id:'pconv',t:0,n:'感召之击',r:24,col:0,pre:['pveng'],ty:'hit',wm:1,ic:'🙏',fx:'spirit',mana:L=>4,v:(L,sy)=>{const p=Math.round((90+15*(L-1))*sy),c=Math.min(60,20+3*(L-1));return{pct:p,cv:c,cdur:8,txt:`圣光感召：${clsMtx(p)}，${c}% 几率令非首领敌人倒戈 8 秒（转而攻击其他怪物）`}}},
 {id:'pshield',t:0,n:'神佑圣盾',r:24,col:2,pre:['pchg','pham'],ty:'buff',g:'hshield',ic:'🔰',fx:'shield',mana:L=>15,v:L=>{const df=50+15*(L-1),b=Math.min(30,8+2*(L-1)),t=60+15*(L-1);return{def:df,blk:b,dur:t,txt:`圣光附盾：防御 +${df}%，格挡 +${b}%，持续 ${t} 秒${palSh}`}}},
 {id:'pfist',t:0,n:'天罚雷拳',r:30,col:1,pre:['pbolt','pconv'],ty:'splash',el:'light',ic:'⚡',fx:'bolt',mana:L=>15+(L-1),sm:1,syn:[['pbolt','pham'],8],v:(L,sy)=>{const d=CLS_DR(30,45,15,20,L,sy);return{dmg:d,sp:60,n:8,txt:`天雷落下：目标受 ${clsDtx(d,'light')}，周围敌人受 60% 伤害`}}},
 // 攻击光环（同组 paura，只开一个）
 {id:'pmight',t:1,n:'威能光环',r:1,col:0,ty:'aura',g:'paura',ic:'💪',fx:'shield',mana:L=>5,v:L=>{const w=40+10*(L-1);return{wdmg:w,sumdmg:w,txt:`光环：你的伤害 +${w}%，召唤物/佣兵伤害 +${w}%（攻击光环只开一个）`}}},
 {id:'phfire',t:1,n:'炽焰光环',r:6,col:1,pre:['pmight'],ty:'aura',g:'paura',el:'fire',ic:'🔥',fx:'boom',mana:L=>8,syn:[['prfire','psalv'],15],v:(L,sy)=>{const d=CLS_DR(4,8,3,4,L,sy);return{pulse:1,dmg:d,iv:1.5,n:8,txt:`光环：每 1.5 秒灼烧全部敌人（最多 8 个）${clsDtx(d,'fire')}（攻击光环只开一个）`}}},
 {id:'pthorn',t:1,n:'棘刺光环',r:6,col:2,pre:['pmight'],ty:'aura',g:'paura',ic:'🌵',fx:'shield',mana:L=>8,v:L=>{const t=12+10*(L-1);return{th:t,def:20,txt:`光环：近战攻击你的敌人受到 ${t} 点反伤，防御 +20%（攻击光环只开一个）`}}},
 {id:'paim',t:1,n:'明察光环',r:12,col:0,pre:['pmight'],ty:'aura',g:'paura',ic:'🎯',fx:'shield',mana:L=>8,v:L=>{const a=60+15*(L-1),c=Math.min(25,5+Math.floor(L/2)),w=15+4*(L-1);return{ar:a,crit:c,wdmg:w,txt:`光环：命中 +${a}%，伤害 +${w}%，${c}% 几率重击（双倍）（攻击光环只开一个）`}}},
 {id:'pconc',t:1,n:'凝神光环',r:18,col:0,pre:['paim'],ty:'aura',g:'paura',ic:'🧘',fx:'shield',mana:L=>12,v:L=>{const w=60+15*(L-1),s=Math.round(w/2);return{wdmg:w,sdmg:s,txt:`光环：武器伤害 +${w}%，技能与光环伤害 +${s}%（攻击光环只开一个）`}}},
 {id:'phfrz',t:1,n:'霜誓光环',r:18,col:1,pre:['phfire'],ty:'aura',g:'paura',el:'cold',ic:'❄',fx:'ring',mana:L=>12,syn:[['prcold','psalv'],15],v:(L,sy)=>{const d=CLS_DR(6,10,3,5,L,sy);return{pulse:1,dmg:d,iv:1.5,n:8,slow:2,txt:`光环：每 1.5 秒冻伤全部敌人（最多 8 个）${clsDtx(d,'cold')}，并减速（攻击光环只开一个）`}}},
 {id:'phshk',t:1,n:'雷誓光环',r:24,col:1,pre:['phfrz'],ty:'aura',g:'paura',el:'light',ic:'🌩',fx:'bolt',mana:L=>15,syn:[['prlite','psalv'],12],v:(L,sy)=>{const d=CLS_DR(1,24,1,8,L,sy);return{pulse:1,dmg:d,iv:1.5,n:8,txt:`光环：每 1.5 秒电击全部敌人（最多 8 个）${clsDtx(d,'light')}（攻击光环只开一个）`}}},
 {id:'psanc',t:1,n:'圣域光环',r:24,col:2,pre:['pthorn','phfrz'],ty:'aura',g:'paura',el:'magic',ic:'⛪',fx:'spirit',mana:L=>15,v:(L,sy)=>{const d=CLS_DR(6,10,4,5,L,sy),t=Math.min(50,20+2*(L-1));return{pulse:1,und:1,dmg:d,iv:2,n:8,tdef:t,txt:`光环：每 2 秒净化全部敌人 ${clsDtx(d,'magic')}（对不死生物双倍），敌人防御 -${t}%（攻击光环只开一个）`}}},
 {id:'pfana',t:1,n:'狂信光环',r:30,col:0,pre:['pconc'],ty:'aura',g:'paura',ic:'😤',fx:'shield',mana:L=>15,v:L=>{const i=Math.min(60,20+3*(L-1)),w=60+12*(L-1),a=40+6*(L-1);return{ias:i,wdmg:w,ar:a,sumdmg:w,txt:`光环：攻速 +${i}%，伤害 +${w}%，命中 +${a}%，召唤物/佣兵伤害 +${w}%（攻击光环只开一个）`}}},
 {id:'pconvic',t:1,n:'信念光环',r:30,col:2,pre:['psanc'],ty:'aura',g:'paura',ic:'⚖',fx:'spirit',mana:L=>15,v:L=>{const r=Math.min(80,30+3*(L-1)),d=Math.min(60,25+2*(L-1));return{cvr:r,tdef:d,txt:`光环：敌人元素与魔法抗性 -${r}%，防御 -${d}%（攻击光环只开一个）`}}},
 // 防御光环（同组 pdaura，只开一个）
 {id:'ppray',t:2,n:'慈光光环',r:1,col:0,ty:'aura',g:'pdaura',ic:'💖',fx:'shield',mana:L=>5,v:L=>{const h=+(2+1.5*(L-1)).toFixed(1);return{regen:h,txt:`光环：每秒回复 ${h} 生命（防御光环只开一个）`}}},
 {id:'prfire',t:2,n:'焰盾光环',r:1,col:1,ty:'aura',g:'pdaura',ic:'🔥',fx:'shield',mana:L=>5,v:L=>{const r=30+5*(L-1),m=Math.min(10,Math.floor(L/2));return{pfres:r,pmx:m,txt:`光环：火焰抗性 +${r}%${palMx(m,'火焰')}（防御光环只开一个）`}}},
 {id:'pdefi',t:2,n:'坚壁光环',r:6,col:2,ty:'aura',g:'pdaura',ic:'🏰',fx:'shield',mana:L=>6,v:L=>{const d=70+15*(L-1);return{def:d,txt:`光环：防御 +${d}%（防御光环只开一个）`}}},
 {id:'prcold',t:2,n:'霜盾光环',r:6,col:1,pre:['prfire'],ty:'aura',g:'pdaura',ic:'❄',fx:'shield',mana:L=>6,v:L=>{const r=30+5*(L-1),m=Math.min(10,Math.floor(L/2));return{pcres:r,pmx:m,txt:`光环：冰冷抗性 +${r}%${palMx(m,'冰冷')}（防御光环只开一个）`}}},
 {id:'pclean',t:2,n:'涤罪光环',r:12,col:0,pre:['ppray'],ty:'aura',g:'pdaura',ic:'💧',fx:'shield',mana:L=>8,v:L=>{const r=Math.min(75,30+5*(L-1)),h=+(1+0.8*(L-1)).toFixed(1);return{ppres:r,regen:h,txt:`光环：毒素抗性 +${r}%，每秒回复 ${h} 生命（防御光环只开一个）`}}},
 {id:'prlite',t:2,n:'雷盾光环',r:12,col:1,pre:['prcold'],ty:'aura',g:'pdaura',ic:'⚡',fx:'shield',mana:L=>8,v:L=>{const r=30+5*(L-1),m=Math.min(10,Math.floor(L/2));return{plres:r,pmx:m,txt:`光环：闪电抗性 +${r}%${palMx(m,'闪电')}（防御光环只开一个）`}}},
 {id:'pvigor',t:2,n:'奋进光环',r:18,col:0,pre:['pclean','pdefi'],ty:'aura',g:'pdaura',ic:'🏃',fx:'shield',mana:L=>10,v:L=>{const l=15+3*(L-1),i=Math.min(30,8+L);return{life:l,ias:i,txt:`光环：最大生命 +${l}%，攻速 +${i}%（防御光环只开一个）`}}},
 {id:'pmedi',t:2,n:'冥思光环',r:24,col:2,pre:['pclean'],ty:'aura',g:'pdaura',ic:'🔮',fx:'shield',mana:L=>5,v:L=>{const m=80+25*(L-1);return{mregen:m,txt:`光环：法力回复 +${m}%（防御光环只开一个）`}}},
 {id:'predm',t:2,n:'赎魂光环',r:30,col:0,pre:['pvigor'],ty:'aura',g:'pdaura',ic:'👼',fx:'shield',mana:L=>10,v:L=>{const c=Math.min(80,30+3*(L-1)),h=Math.min(10,3+0.4*(L-1));return{rch:c,rhl:h,txt:`光环：击杀敌人时 ${c}% 几率回复 ${h.toFixed(1)}% 生命与法力（防御光环只开一个）`}}},
 {id:'psalv',t:2,n:'圣佑光环',r:30,col:1,pre:['prlite'],ty:'aura',g:'pdaura',ic:'🌟',fx:'shield',mana:L=>12,v:L=>{const r=25+4*(L-1),m=Math.min(10,Math.floor(L/3));return{pallres:r,pmx:m,txt:`光环：全部元素抗性 +${r}%${palMx(m,'')}（防御光环只开一个）`}}},
]);
CLS_SKPLAN.pal={order:['pmight','psac','ppray','psac','phfire','phfire','phfire','phfire','psac','psac','pzeal','pzeal','pzeal','pzeal','paim','pbolt','pham','pconc','pconc','pham','pconc','pham','pconc','pham','pham','pconc','pham','pham','pconc','pham'],
 fill:()=>['pham','pconc','pfist','pzeal','phfire','pclean','pvigor','ppray']};
clsRegister();
// 近战类（wm）只乘协同（伤害由近战系数 palm 统一缩放），不乘技能系数 dk
{const f=clsSV;clsSV=function(id,L){const s=SKM[id];if(s&&s.cls==='pal'&&s.wm)return s.v(Math.max(1,L),syn(id));return f(id,L)}}
// ---------- 施放判定 ----------
// 近战估值 × 近战系数 mk × 命中率（否则与吃 dk、必中的法术比较失真）；誓仇之刃估值：近战部分 + 元素附加
const palHitP=(ms,v)=>{if(!ms.length||v.sure)return 1;let t=0;for(const m of ms){const df=m.def*(1-ST.tdef/100),ar=ST.ar*(1+(v.ar||0)/100);t+=clamp(200*ar/(ar+Math.max(1,df))*S.lvl/(S.lvl+m.lv),5,95)/100}return t/ms.length};
{const f=clsEst;clsEst=function(s,ms){if(s.cls!=='pal'||!s.wm)return f(s,ms);const v=SV(s.id,slvl(s.id));
 const e=s.ty==='ptri'?clsWAvg()*(1+(v.pct||0)/100+(v.ep||0)/100)*Math.min(ms.length,v.n||1):f(s,ms);return e*clsMk()*palHitP(ms,v)}}
{const f=acFeasible;acFeasible=function(id,ms){const s=SKM[id];if(!s||s.cls!=='pal')return f(id,ms);if(!castable(id))return 0;
 if(s.ty==='aura'){if(clsGroupPick(s.g)!==id)return 0;return!buffOn(id)}
 if(s.id==='pshield'&&!(S.eq.shield&&BASEM[S.eq.shield.b]&&BASEM[S.eq.shield.b].block))return 0;
 return f(id,ms)}}
{const f=acSmartTxt;acSmartTxt=function(id){const s=SKM[id];if(s&&s.ty==='aura')return'光环未开启时开启（同组只开等级最高的一个）';return f(id)}}
// ---------- 属性：光环按当前技能等级生效 ----------
let PAL_CV=0;// 信念光环：敌人抗性降低值
{const f=clsCalc;clsCalc=function(o){PAL_CV=0;const c=curCls();const M=o.M||{};const lv=id=>{const b=bl(id);return b?b+o.allsk+(M['tc_pal'+SKM[id].t]||0)+(o['sk_'+id]||0):0};
 const au=c==='pal'?palAuraOn():[],V={};
 for(const id of au){const L=lv(id);if(!L)continue;const v=V[id]=SV(id,L);const b=H.cbs[id];for(const k of['wdmg','ar','ias','def','life','sdmg'])b[k]=v[k]||0}
 f(o);if(c!=='pal')return;
 const R=(k,v,m)=>{o.res[k]=Math.min(75+(m||0),o.res[k]+v)};
 for(const id of au){const v=V[id];if(!v)continue;
  if(v.sumdmg)o.sumdmg=(o.sumdmg||0)+v.sumdmg;if(v.th)o.thorns=(o.thorns||0)+v.th;if(v.crit)o.bcrit=Math.min(60,(o.bcrit||0)+v.crit);if(v.tdef)o.tdef=(o.tdef||0)+v.tdef;
  if(v.regen)o.regen+=v.regen;if(v.mregen)o.mregen+=v.mregen;if(v.cvr)PAL_CV=v.cvr;
  if(v.pfres)R('fire',v.pfres,v.pmx);if(v.pcres)R('cold',v.pcres,v.pmx);if(v.plres)R('light',v.plres,v.pmx);if(v.ppres)R('pois',v.ppres);if(v.pallres)for(const k of['fire','cold','light'])R(k,v.pallres,v.pmx)}
 const hs=buffOn('pshield');const sh=S.eq.shield&&BASEM[S.eq.shield.b];
 if(sh&&sh.block)o.block=Math.min(75,o.block+10+(hs?hs.blk||0:0))}}// 圣誓骑士职业格挡 30（亡灵术士 20）
// 信念光环：降低敌人元素/魔法抗性（全队受益）
{const f=resOf;resOf=function(m,k){const r=f(m,k);return PAL_CV&&k!=='phys'&&curCls()==='pal'?Math.max(-100,r-PAL_CV):r}}
// ---------- 每帧：元素光环脉冲 ----------
{const f=step;step=function(dt){const r=f(dt);if(!ST||curCls()!=='pal'||H.life<=0)return r;H.pat=H.pat||{};
 for(const id of palAuraOn()){const s=SKM[id];if(s.ty!=='aura')continue;const v=SV(id,slvl(id));if(!v.pulse)continue;
  if((H.pat[id]||0)>GT)continue;const l=liveMon();if(!l.length)continue;H.pat[id]=GT+v.iv;const L=l.slice(0,v.n||8);
  for(const m of L){clsHit(m,s.el,clsRR(v.dmg)*(v.und&&m.undead?2:1));if(v.slow)m.slow=Math.max(m.slow||0,GT+v.slow)}clsFx(s,L)}
 return r}}
{const f=resetRuntime;resetRuntime=function(){f();H.pat={}}}
// ---------- 施放后：献祭自伤、感召倒戈 ----------
{const f=typeof clsAfterCast==='function'?clsAfterCast:null;window.clsAfterCast=function(s,v,ms,L){if(f)f(s,v,ms,L);if(s.cls!=='pal')return;const tg=L[0];
 if(v.self&&L.length)H.life=Math.max(1,H.life-ST.life*v.self/100);
 if(v.cv&&tg&&tg.hp>0&&!tg.boss&&rnd()*100<v.cv){tg.cur={id:'cf',until:GT+v.cdur};floatNum(tg.uid,'倒戈','#ffe28a')}}}
// 赎魂光环：击杀回复
{const f=killMon;killMon=function(m){const r=f(m);if(curCls()==='pal'&&ST&&buffOn('predm')){const v=SV('predm',slvl('predm'));if(rnd()*100<v.rch){H.life=Math.min(ST.life,H.life+ST.life*v.rhl/100);H.mana=Math.min(ST.mana,H.mana+ST.mana*v.rhl/100)}}return r}}
// ---------- 专属底材：圣徽盾（ps1-ps5），格挡高于普通盾 ----------
TCAP.pshd=[2,3,4];ITYPES.pshd=['armo','shld','shie','pshd'];
{const nb=[A('ps1','shield','pshd','圣徽圆盾',3,0,[6,10],14,1,8),A('ps2','shield','pshd','誓言纹章盾',12,0,[14,20],24,2,10),A('ps3','shield','pshd','晨曦鸢盾',24,0,[24,34],38,3,12),
 A('ps4','shield','pshd','天使翼盾',40,1,[52,72],56,3,15),A('ps5','shield','pshd','圣王冠盾',62,2,[100,135],76,4,18)];
 for(const b of nb){b.cls=1;b.ccls='pal';BASES.push(b);BASEM[b.id]=b}}
{const add=(n,lv,rq,k,v)=>PREFIX.push(AF(n,lv,rq,'skill','pshd,amul',{[k]:[v,v]}));const T=[['剑誓的','圣裁的','天罚的'],['炽心的','圣怒的','狂信的'],['守誓的','庇护的','神佑的']];
 for(let t=0;t<3;t++){const k='tc_pal'+t;MODT[k]='+{v} '+CLS_DEF.pal.trees[t]+'（圣誓骑士专属）';HIDDEN_KEYS.add(k);T[t].forEach((n,i)=>add(n,[20,40,60][i],[15,30,45][i],k,i+1))}}
if(typeof STAFFMOD_CATS!=='undefined')STAFFMOD_CATS.add('pshd');// 圣徽盾可出圣誓骑士单技能词缀
