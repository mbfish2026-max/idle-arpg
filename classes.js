'use strict';
// ===================================================================================
// classes.js — 玩家职业：野蛮人(bar) / 法师(sor)。亡灵术士(nec)为原有职业，逻辑不变。
// 存档：沿用角色存档 S.cls（缺省 'nec'，旧存档自动视为亡灵术士）；S.ci=1 表示已按职业初始化（新建/重置角色时一次性写入属性、技能、初始装备）。
// 新增技能放入全局 SKILLS/SKM（带 cls 字段），技能页/加点/自动施法按 S.cls 过滤；数值在 clsSV，施放在 acFeasible/acSmart/acCast 包装中。
// 必须在 skills.js 之后加载（包装其自动施法函数）。
// ===================================================================================
// 平衡系数表（按角色等级线性插值）：法师=技能伤害系数 dk，野蛮人=近战伤害系数 mk。依据 1/12/24/30 级 60 秒击杀与亡灵术士对比调校
const CLS_BAL={sor:[[1,0.253],[12,0.13],[24,0.172],[30,0.175]],bar:[[1,0.5],[12,0.125],[24,0.92],[30,0.34]]};
function clsBalK(t){const l=(typeof S!=='undefined'&&S&&S.lvl)||1;if(l<=t[0][0])return t[0][1];for(let i=1;i<t.length;i++)if(l<=t[i][0]){const[a,x]=t[i-1],[b,y]=t[i];return x+(y-x)*(l-a)/(b-a)}return t[t.length-1][1]}
const CLS_DEF={
 nec:{n:'亡灵术士',ic:'☠',glyph:'🧙‍♂️',at:{str:15,dex:25,vit:15,ene:25},life0:45,lpl:1.5,lpv:2,mana0:25,mpl:2,mpe:2,trees:['冥仆系','骨毒系','咒怨系']},
 bar:{n:'野蛮人',ic:'🪓',glyph:'🪓',at:{str:30,dex:20,vit:25,ene:10},life0:55,lpl:2,lpv:4,mana0:10,mpl:1,mpe:1,trees:['战斗技能','武器精通','战吼'],
  sk:{bbash:1},eq:['swd1','shd1'],mk:()=>clsBalK(CLS_BAL.bar),autoEne:()=>false},
 sor:{n:'法师',ic:'🔮',glyph:'🧝‍♀️',at:{str:10,dex:25,vit:10,ene:35},life0:40,lpl:1,lpv:2,mana0:35,mpl:2,mpe:2,trees:['火焰法术','冰霜法术','闪电法术'],
  sk:{mfb:1},eq:['wand1'],dk:()=>clsBalK(CLS_BAL.sor),autoEne:()=>S.at.ene<Math.floor(S.lvl*1.5)+35},
};
const curCls=()=>(S&&CLS_DEF[S.cls])?S.cls:'nec';
function clsBase(){return CLS_DEF[curCls()]}
function clsName(){return clsBase().n}
function heroArt(cls){const c=curCls();return c==='nec'?art('hero','🧙‍♂️',cls):`<img class="art ${cls||''}" src="assets/char/${c}_portrait.webp" alt="${clsBase().n}" onerror="this.outerHTML='<span class=&quot;glyph&quot;>${clsBase().glyph}</span>'">`}// 野蛮人/法师：美术立绘 assets/char/{id}_portrait.webp
function trees(){return clsBase().trees}
function skOfCls(s){return (s.cls||'nec')===curCls()}
// 新角色/重置角色：按职业写入初始属性/技能/装备（只执行一次）
function clsInit(){const c=curCls();if(c==='nec'||S.ci)return;const D=CLS_DEF[c];S.ci=1;S.at=Object.assign({},D.at);S.sk=Object.assign({},D.sk);S.main=null;S.curse=null;S.autoCast=null;
 S.eq={};for(const b of D.eq){const B=BASEM[b];if(B)S.eq[B.s]=makeBase(B,1)}calc();H.life=ST.life;H.mana=ST.mana}
// ===================================================================================
// 职业技能引擎（数据驱动）：每个技能 = 定义 {id,cls,t 系,n,r 需求等级,col,pre 前置,ty 类型,el 元素,ic,mana,sm 智能施放所需怪数,v(L,sy) 数值}
// ty：bolt 单体 / splash 溅射 / cone 前排 n 个 / multi n 发随机 / chain 弹跳 / aoe 全体 / burn 灼烧 / static 按当前生命比例 / turret 持续炮台
//     buff 自身增益(g 同组互斥) / passive 被动 / hit 近战单体 / mhit 近战多目标 / mall 近战全体 / throw 投掷 / debuff 战吼减益 / wcry 战吼伤害
// 音效：每个技能 sfx 字段 = 独立音效 id，接入 audio.js 的 AUDIO_SK.table（无配方时静默）
// 美术：assets/skills/manifest.json 列出已到位的 icons / fx（文件 assets/skills/<id>.webp、assets/skills/fx_<id>.webp），列入才加载，避免 404
// 省电：只做一次性特效，不加持续动画
// ===================================================================================
const CLS_SKILLS=[];const CLS_LEGACY=new Set(['mfb','mfa','mcl','mnova','mmet','bbash','bww','bmast','bshout','bhowl']);// 旧技能 id：存档与已有音效沿用
const CLS_DR=(a,b,ga,gb,L,sy)=>[Math.round((a+ga*(L-1))*sy),Math.round((b+gb*(L-1))*sy)];
const CLS_TYK={bolt:'spell',splash:'spell',cone:'spell',multi:'spell',chain:'spell',aoe:'spell',burn:'spell',static:'spell',turret:'spell',
 buff:'cbuff',passive:'passive',hit:'melee',mhit:'melee',mall:'melee',throw:'melee',debuff:'warcry',wcry:'warcry'};
const CLS_PRI={buff:0,debuff:1,wcry:2,turret:3,burn:4,static:4,aoe:5,mall:5,chain:6,splash:6,cone:7,multi:7,mhit:7,throw:7,bolt:8,hit:8,passive:9};
const CLS_SINGLE=new Set(['bolt','cone','multi','hit','mhit','throw']),CLS_AOE=new Set(['aoe','splash','chain','mall','burn']);
function clsDef(cls,list){for(const o of list){const s=Object.assign({cls,pre:[],sm:1,sfx:CLS_LEGACY.has(o.id)?o.id:'sfx_'+o.id,mana:()=>0},o);s.kind=CLS_TYK[s.ty]||'spell';s.pri=CLS_PRI[s.ty]??8;CLS_SKILLS.push(s)}}
function clsRegister(){CLS_SKILLS.sort((a,b)=>a.pri-b.pri);for(const s of CLS_SKILLS){if(SKM[s.id])continue;SKILLS.push(s);SKM[s.id]=s;MODT['sk_'+s.id]='+{v} '+s.n+'（'+CLS_DEF[s.cls].n+'专属）';HIDDEN_KEYS.add('sk_'+s.id);if(s.syn)SYN[s.id]=s.syn}}
// ---------- 美术清单 ----------
const CLS_ART={icons:new Set(),fx:new Set()};
function clsArtLoad(){if(typeof fetch!=='function'||typeof document==='undefined')return;try{const st=document.createElement('style');st.textContent='.ski.img{background:center/cover no-repeat;color:transparent}';document.head.appendChild(st);fetch('assets/skills/manifest.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(j=>{if(!j)return;for(const k of['icons','fx'])for(const id of j[k]||[])CLS_ART[k].add(id);if(typeof ACX!=='undefined')ACX.skSig=''}).catch(()=>{})}catch(e){}}
const clsIconUrl=id=>CLS_ART.icons.has(id)?`assets/skills/${id}.webp`:null,clsFxUrl=id=>CLS_ART.fx.has(id)?`assets/skills/fx_${id}.webp`:null;
{const f=skIcon;skIcon=function(s){if(s&&s.cls){const u=clsIconUrl(s.id);return u?`<i class="ski img" style="background-image:url(${u})"></i>`:`<i class="ski t${s.t}">${s.ic}</i>`}return f(s)}}
// ---------- 数值 ----------
function clsMk(){const k=CLS_DEF[curCls()].mk;return typeof k==='function'?k():(k||1)}// mk：职业近战伤害总系数（平衡用）
function clsDk(c){const k=CLS_DEF[c].dk;return typeof k==='function'?k():(k||1)}
function clsSV(id,L){const s=SKM[id];if(!s||!s.v)return{txt:''};return s.v(Math.max(1,L),syn(id)*clsDk(s.cls))}// dk：职业技能伤害总系数（平衡用，已计入显示数值）
const CLS_ELC={fire:'#f84',cold:'#8cf',light:'#ff6',magic:'#e0c0ff',phys:'#fff'};
const clsAvgD=d=>d?(d[0]+d[1])/2:0,clsRR=d=>R(Math.round(d[0]),Math.round(d[1]));
const buffOn=id=>{const b=H.cbs&&H.cbs[id];return b&&b.until>GT?b:null};
function pasV(id){return bl(id)?clsSV(id,slvl(id)):null}
function elMul(el){let p=ST.sdmg||0;if(curCls()==='sor'){const k={fire:'mfm',cold:'mcm',light:'mlm'}[el];const v=k&&pasV(k);if(v)p+=v.dmg||0;if(el==='fire'){const e=buffOn('menc');if(e)p+=e.fdmg||0}}return 1+p/100}
function clsHit(m,el,dmg,col){if(!m||m.hp<=0||!(dmg>0))return 0;let pr=0;if(el==='cold'&&curCls()==='sor'){const v=pasV('mcm');if(v){pr=v.pierce;m.res.cold=(m.res.cold||0)-pr}}
 try{return hitMon(m,{[el]:dmg*elMul(el)},'hero',col||CLS_ELC[el])}finally{if(pr)m.res.cold+=pr}}
function clsOthers(ms,tg){return[tg,...ms.filter(m=>m!==tg)]}
function clsCC(m,v){if(!m||m.hp<=0)return;if(v.slow)m.slow=Math.max(m.slow||0,GT+v.slow);if(v.stun&&!m.boss)m.stun=Math.max(m.stun||0,v.stun)}
// 近战：武器伤害 × (1+pct%) + flat；o.el 转换元素(如狂暴→魔法)
function clsMelee(m,pct,flat,o){o=o||{};if(!m||m.hp<=0)return 0;const db=m.dbf&&m.dbf.until>GT?m.dbf:null;const df=m.def*(1-ST.tdef/100)*(1-((db&&db.def)||0)/100);
 if(!o.sure&&!hitChance(ST.ar*(1+(o.ar||0)/100),df,S.lvl,m.lv))return 0;let k=1+(pct||0)/100;if(ST.bcrit&&rnd()*100<ST.bcrit)k*=2;
 const base=Math.max(1,(clsWRoll()*k+(flat||0))*clsMk());const d=o.el?hitMon(m,{[o.el]:base},'hero',CLS_ELC[o.el]):hitMon(m,{phys:base,fire:ST.fire,cold:ST.cold,light:ST.light?R(1,ST.light):0,pois:ST.pois},'hero','#fff');
 if(d){H.life=Math.min(ST.life,H.life+d*(ST.ll+(ST.bll||0))/100);H.mana=Math.min(ST.mana,H.mana+d*ST.ml/100+(curCls()==='bar'?2:0));clsCC(m,o)}return d}// 野蛮人：每次近战命中 +2 法力
// 野蛮人武器权重（修复好武器偏强）：伤害 = 20% 实际武器 + 80% 等级基准武器(2+0.9×等级)，基准同样吃力量/精通/增益倍率
const CLS_WW=0.2;function clsWRef(){return(2+0.9*S.lvl)*(ST.wmul||1)}
function clsWRoll(){const w=R(ST.wmin,ST.wmax);return curCls()==='bar'?CLS_WW*w+(1-CLS_WW)*clsWRef():w}
function clsWAvg(){const w=(ST.wmin+ST.wmax)/2;return curCls()==='bar'?CLS_WW*w+(1-CLS_WW)*clsWRef():w}
function setBuff(id,v,g){H.cbs=H.cbs||{};if(g)for(const k in H.cbs)if(k!==id&&H.cbs[k].g===g)delete H.cbs[k];H.cbs[id]=Object.assign({},v,{g,until:GT+(v.dur||30)});calc()}
const CLS_TY={
 bolt(s,v,ms,tg){clsHit(tg,s.el,clsRR(v.dmg));clsCC(tg,v);return[tg]},
 splash(s,v,ms,tg){clsHit(tg,s.el,clsRR(v.dmg));clsCC(tg,v);const o=ms.filter(m=>m!==tg).slice(0,v.n||8);for(const m of o){clsHit(m,s.el,clsRR(v.dmg)*(v.sp||50)/100);clsCC(m,v)}return[tg,...o]},
 cone(s,v,ms,tg){const L=clsOthers(ms,tg).slice(0,v.n||3);for(const m of L){clsHit(m,s.el,clsRR(v.dmg));clsCC(m,v)}return L},
 chain(s,v,ms,tg){return CLS_TY.cone(s,v,ms,tg)},
 multi(s,v,ms,tg){const L=[];for(let i=0;i<(v.n||3);i++){const l=liveMon();if(!l.length)break;const m=pick(l);if(rnd()<(v.acc||0.7)){clsHit(m,s.el,clsRR(v.dmg));L.push(m)}}return L},
 aoe(s,v,ms,tg){const L=ms.slice(0,v.n||8);for(const m of L){clsHit(m,s.el,clsRR(v.dmg));clsCC(m,v);if(v.dps)m.burn={dps:v.dps*elMul('fire'),left:v.bdur||3}}return L},
 burn(s,v,ms,tg){const L=ms.slice(0,v.n||8);for(const m of L)m.burn={dps:v.dps*elMul('fire'),left:v.bdur||4};return L},
 static(s,v,ms,tg){for(const m of ms){if(m.hp<=m.max*0.05)continue;hitMon(m,{light:Math.max(1,m.hp*v.pct/100*(m.boss?0.5:1))},'hero','#ff6')}return ms},
 turret(s,v,ms,tg){H.tur=H.tur||{};H.tur[s.id]={until:GT+v.dur,next:GT,iv:v.iv,dmg:v.dmg,el:s.el,n:v.n||1,id:s.id};floatHero(s.n,CLS_ELC[s.el]);return[]},
 buff(s,v){setBuff(s.id,v,s.g);floatHero(s.n,'#ffd76a');return[]},
 hit(s,v,ms,tg){for(let i=0;i<(v.hits||1);i++)clsMelee(tg,v.pct,v.flat,v);return[tg]},
 mhit(s,v,ms,tg){const L=clsOthers(ms,tg).slice(0,v.n||2);for(const m of L)clsMelee(m,v.pct,v.flat,v);if(v.fz)setBuff('bfrz_st',{ias:v.fz,dur:4},null);return L},
 mall(s,v,ms,tg){const L=ms.slice(0,v.n||8);for(const m of L)v.pct==null?clsCC(m,v):clsMelee(m,v.pct,v.flat,v);if(v.dmg)for(const m of L)hitMon(m,{phys:clsRR(v.dmg)},'hero','#fff');return L},
 throw(s,v,ms,tg){const L=clsOthers(ms,tg).slice(0,v.n||2);for(const m of L)clsMelee(m,v.pct,v.flat,v);return L},
 debuff(s,v,ms){for(const m of ms){m.dbf={id:s.id,until:GT+v.dur,dmg:v.wk||0,def:v.dd||0};clsCC(m,v)}floatHero(s.n,'#ffb050');return ms},
 wcry(s,v,ms){for(const m of ms){hitMon(m,{phys:clsRR(v.dmg)},'hero','#ffb050');clsCC(m,v)}floatHero(s.n,'#ffb050');return ms},
};
const CLS_TYR={hit:2,mhit:2,throw:2};// 单体近战按攻速；其余按施法速度
function clsFxRing(c){if(TAB!=='fight')return;FX.push({k:'nova',pts:[],h:heroPos(),c,t:0,life:.7})}
function clsFx(s,L){if(typeof TAB==='undefined'||TAB!=='fight')return;const u=clsFxUrl(s.id);
 if(u&&typeof sprite==='function'&&typeof fxOk==='function'&&fxOk('c_'+s.id)){const pts=L.map(m=>rectOf('c'+m.uid)).filter(Boolean);const h=heroPos();for(const p of(pts.length?pts.slice(0,3):[h]))sprite('pop',u,p.x,p.y,84,'animation-duration:500ms',500);return}
 const k=s.fx||({fire:'boom',cold:'ring',light:'bolt',magic:'spirit'}[s.el])||'slash';
 if(k==='ring')clsFxRing(CLS_ELC[s.el]||'#e8d0a0');else if(k==='shield')fx('shield');else fx(k,L.length?L:[])}
function clsCast(id,ms){const s=SKM[id],v=SV(id,slvl(id));spend(id);ACT[id]=GT;const tg=target(ms);const L=CLS_TY[s.ty](s,v,ms,tg)||[];if(typeof clsAfterCast==='function')clsAfterCast(s,v,ms,L);clsFx(s,L);return CLS_TYR[s.ty]||1}
// ---------- 自动施法 ----------
for(const k of['melee','spell','cbuff','warcry'])if(!AC_KINDS.includes(k))AC_KINDS.push(k);
function clsEst(s,ms){const v=SV(s.id,slvl(s.id)),n=ms.length;const tn=CLS_SINGLE.has(s.ty)?Math.min(n,s.ty==='hit'?1:(v.n||1)):Math.min(n,v.n||8);
 if(['hit','mhit','mall','throw'].includes(s.ty))return(clsWAvg()*(1+(v.pct||0)/100)+(v.flat||0)+clsAvgD(v.dmg))*(v.hits||1)*tn;
 if(s.ty==='burn')return v.dps*(v.bdur||4)*elMul('fire')*tn;if(s.ty==='multi')return clsAvgD(v.dmg)*elMul(s.el)*(v.n||3)*(v.acc||0.7);
 return(clsAvgD(v.dmg)*(s.ty==='splash'?1+(tn-1)*(v.sp||50)/100:tn)+(v.dps?v.dps*(v.bdur||3)*tn:0))*elMul(s.el)}
function clsBest(set,ms){let b=null,bv=-1;for(const s of SKILLS){if(!s.cls||!skOfCls(s)||!set.has(s.ty)||!bl(s.id)||!castable(s.id)||!acCfg(s.id).on)continue;if(CLS_AOE.has(s.ty)&&ms.length<s.sm&&!ms.some(m=>m.boss||m.fl==='uniq'))continue;const e=clsEst(s,ms);if(e>bv){bv=e;b=s.id}}return b}
{const f=acFeasible;acFeasible=function(id,ms){const s=SKM[id];if(!s||!s.cls)return f(id,ms);if(!castable(id))return 0;
 switch(s.ty){case'buff':{const b=buffOn(id);return!(b&&b.until>GT+2)}case'passive':return 0;
  case'turret':return ms.length>0&&!(H.tur&&H.tur[id]&&H.tur[id].until>GT+1);case'debuff':return ms.some(m=>!(m.dbf&&m.dbf.id===id&&m.dbf.until>GT)&&!(m.stun>0));
  case'static':return ms.some(m=>m.hp>m.max*0.4);case'burn':return ms.some(m=>!(m.burn&&m.burn.left>1))}
 return ms.length>0}}
{const f=acSmart;acSmart=function(id,ms){const s=SKM[id];if(!s||!s.cls)return f(id,ms);const big=ms.some(m=>m.boss||m.fl==='uniq'||m.fl==='champ');
 if(['buff','turret'].includes(s.ty))return 1;if(['debuff','wcry','static'].includes(s.ty))return ms.length>=s.sm||big;
 if(CLS_AOE.has(s.ty)){if(ms.length<s.sm&&!big)return 0;const b=clsBest(CLS_AOE,ms);const bs=clsBest(CLS_SINGLE,ms);return b===id&&(!bs||clsEst(s,ms)>=clsEst(SKM[bs],ms)*0.9)}
 if(CLS_SINGLE.has(s.ty)){const b=clsBest(new Set([...CLS_SINGLE,...CLS_AOE]),ms);return b===id}return 1}}
{const f=acCast;acCast=function(id,ms){const s=SKM[id];if(!s||!s.cls)return f(id,ms);return clsCast(id,ms)}}
{const f=acSmartTxt;acSmartTxt=function(id){const s=SKM[id];if(!s||!s.cls)return f(id);
 if(s.ty==='buff')return'增益未生效时施放';if(s.ty==='turret')return'未在场时召出';if(s.ty==='debuff'||s.ty==='wcry')return`怪物≥${s.sm}或有精英/首领，且未受此效果`;if(s.ty==='static')return'有敌人生命高于40%';
 return CLS_AOE.has(s.ty)?`怪物≥${s.sm}或有精英/首领，且为当前伤害最高的技能`:'当前伤害最高的单体技能'}}
// ---------- 属性：被动/增益（game.js calc 末尾调用） ----------
const clsWCat=()=>{const w=S.eq&&S.eq.weapon;return w&&BASEM[w.b]?BASEM[w.b].cat:null};
function clsCalc(o){const c=curCls();if(c==='nec')return;const M=o.M||{};const lv=id=>{const b=bl(id);return b?b+o.allsk+(M['tc_'+SKM[id].cls+SKM[id].t]||0)+(o['sk_'+id]||0):0};const pv=id=>{const L=lv(id);return L?clsSV(id,L):null};
 let wd=0,ar=0,ias=0,crit=0,lifeP=0,manaP=0,defP=0;
 for(const s of CLS_SKILLS)if(s.cls===c&&s.ty==='passive'&&s.cat!=null){const v=pv(s.id);if(!v)continue;if(s.cat==='*'||s.cat.split(',').includes(clsWCat()||'none')){wd+=v.dmg||0;ar+=v.ar||0;crit+=v.crit||0;ias+=v.ias||0}}
 for(const s of CLS_SKILLS)if(s.cls===c&&s.ty==='passive'&&s.cat==null){const v=pv(s.id);if(!v)continue;lifeP+=v.life||0;defP+=v.def||0;ias+=v.ias||0;crit+=v.crit||0;
  if(v.res)for(const k in o.res)o.res[k]=Math.min(75,o.res[k]+v.res);if(v.mregen)o.mregen+=v.mregen;if(v.mf)o.mf+=v.mf;if(v.gf)o.gf+=v.gf;if(v.ll)o.bll=(o.bll||0)+v.ll}
 if(c==='bar'&&BASEM[S.eq.shield?.b]?.block)o.block=Math.min(75,o.block+5);// 野蛮人职业格挡 25（亡灵术士/法师 20，已含在底材里）
 for(const id in H.cbs||{}){const b=buffOn(id);if(!b)continue;wd+=b.wdmg||0;ar+=b.ar||0;ias+=b.ias||0;defP+=b.def||0;lifeP+=b.life||0;manaP+=b.mana||0;o.allsk+=b.allsk||0;o.sdmg=(o.sdmg||0)+(b.sdmg||0);
  if(b.cres)o.res.cold=Math.min(75,o.res.cold+b.cres);if(b.res)for(const k in o.res)o.res[k]=Math.min(75,o.res[k]+b.res);if(b.dodge)o.cdodge=Math.max(o.cdodge||0,b.dodge);if(b.es)o.ces=Math.max(o.ces||0,b.es);if(b.ret)o.cret=b}
 o.wmin=Math.floor(o.wmin*(1+wd/100));o.wmax=Math.floor(o.wmax*(1+wd/100));o.wmul=(1+o.attr.str/100)*(1+wd/100);o.ar=Math.round(o.ar*(1+ar/100));o.bcrit=Math.min(60,crit);o.atkT=1.5/(1+(o.ias+ias)/100);
 o.def=Math.round(o.def*(1+defP/100));o.life=Math.round(o.life*(1+lifeP/100));o.mana=Math.round(o.mana*(1+manaP/100))}
// ---------- 每帧：增益到期、减益减伤、灼烧、炮台、闪避/能量护盾/反击 ----------
{const f=step;step=function(dt){if(!ST||curCls()==='nec')return f(dt);
 let ch=0;for(const k in H.cbs||{})if(H.cbs[k].until<=GT){delete H.cbs[k];ch=1}if(ch)calc();
 const sv=[];for(const m of MON)if(m.dbf&&m.dbf.until>GT&&m.dbf.dmg&&m.hp>0){sv.push([m,m.dmg]);m.dmg=m.dmg.map(x=>x*(1-m.dbf.dmg/100))}
 const h0=H.life,mp0=H.mana;let r;try{r=f(dt)}finally{for(const[m,d]of sv)m.dmg=d}
 for(const m of MON){const b=m.burn;if(!b||m.hp<=0||b.left<=0)continue;b.acc=(b.acc||0)+dt;b.left-=dt;if(b.acc>=0.5||b.left<=0){const d=b.dps*b.acc;b.acc=0;hitMon(m,{fire:d},'hero','#f60')}}
 for(const k in H.tur||{}){const t=H.tur[k];if(t.until<=GT){delete H.tur[k];continue}if(GT<t.next)continue;t.next=GT+t.iv;const l=liveMon();if(!l.length)continue;const L=[];for(let i=0;i<t.n;i++){const m=pick(l);clsHit(m,t.el,clsRR(t.dmg));L.push(m)}clsFx(SKM[t.id],L)}
 const loss=h0-H.life;if(loss>0&&H.life>0){let back=0;if(ST.cdodge&&rnd()*100<ST.cdodge){back=loss;floatHero('闪避','#aaf')}
  else if(ST.ces){const ab=Math.min(loss*ST.ces/100,H.mana/1.5);back=ab;H.mana-=ab*1.5}
  H.life=Math.min(ST.life,H.life+back);
  if(ST.cret&&GT>(H.retT||0)){H.retT=GT+1;const ml=liveMon().filter(m=>!m.ranged);if(ml.length){const m=pick(ml);clsHit(m,'cold',clsRR(ST.cret.ret));m.slow=GT+2}}}
 return r}}
{const f=resetRuntime;resetRuntime=function(){f();H.cbs={};H.tur={}}}
// ---------------- 法师：火焰 / 冰霜 / 闪电（旧 id mfb/mfa/mcl/mnova/mmet 及其需求等级保持不变） ----------------
const clsDtx=(d,el)=>`${d[0]}-${d[1]} ${({fire:'火焰',cold:'冰冷',light:'闪电',magic:'魔法',phys:'物理'})[el]}`;
clsDef('sor',[
 // 火焰
 {id:'mfb',t:0,n:'火焰弹',r:1,col:0,ty:'bolt',el:'fire',ic:'🔥',fx:'boom',mana:L=>2.5,syn:[['mfball','mmet'],12],v:(L,sy)=>{const d=CLS_DR(6,9,3,4,L,sy);return{dmg:d,txt:`单体 ${clsDtx(d,'fire')}`}}},
 {id:'mwarm',t:0,n:'暖流',r:1,col:1,ty:'passive',ic:'♨',v:L=>{const m=30+12*(L-1);return{mregen:m,txt:`被动：法力回复 +${m}%`}}},
 {id:'minf',t:0,n:'烈焰喷射',r:1,col:2,ty:'cone',el:'fire',ic:'🌋',fx:'boom',mana:L=>4+0.4*(L-1),syn:[['mwarm','mblaze'],10],v:(L,sy)=>{const d=CLS_DR(3,7,3,4,L,sy);return{dmg:d,n:3,txt:`喷射前方 3 个敌人，各 ${clsDtx(d,'fire')}`}}},
 {id:'mblaze',t:0,n:'焰行',r:6,col:2,pre:['minf'],ty:'burn',el:'fire',ic:'👣',mana:L=>8,syn:[['mfwall','mwarm'],4],sm:2,v:(L,sy)=>{const p=Math.round((4+3*(L-1))*sy);return{dps:p,bdur:4,txt:`点燃全部敌人：每秒 ${p} 火焰，持续 4 秒`}}},
 {id:'mfball',t:0,n:'爆炎球',r:12,col:0,pre:['mfb'],ty:'splash',el:'fire',ic:'☀',fx:'boom',mana:L=>5+0.5*(L-1),sm:2,syn:[['mfb','mmet'],14],v:(L,sy)=>{const d=CLS_DR(10,16,7,10,L,sy);return{dmg:d,sp:60,n:8,txt:`命中 ${clsDtx(d,'fire')}，周围敌人受 60% 溅射`}}},
 {id:'mmet',t:0,n:'陨石术',r:12,col:1,pre:['mfb'],ty:'aoe',el:'fire',ic:'☄',fx:'boom',mana:L=>17+(L-1),sm:3,syn:[['mfb','mfball','mfwall'],5],v:(L,sy)=>{const d=CLS_DR(20,30,16,22,L,sy),p=Math.round((3+2*(L-1))*sy);return{dmg:d,dps:p,bdur:3,txt:`全部敌人 ${clsDtx(d,'fire')}，并灼烧每秒 ${p}（3 秒）`}}},
 {id:'menc',t:0,n:'炎附',r:18,col:1,pre:['mwarm'],ty:'buff',g:'ench',ic:'🕯',fx:'shield',mana:L=>15,v:L=>{const f=20+8*(L-1),t=90+12*(L-1);return{fdmg:f,dur:t,txt:`火焰伤害 +${f}%，持续 ${t} 秒`}}},
 {id:'mfwall',t:0,n:'火墙术',r:18,col:2,pre:['mblaze'],ty:'burn',el:'fire',ic:'🧱',mana:L=>14+(L-1),sm:3,syn:[['mblaze','mwarm'],4],v:(L,sy)=>{const p=Math.round((14+9*(L-1))*sy);return{dps:p,bdur:4,txt:`火墙灼烧全部敌人：每秒 ${p} 火焰，持续 4 秒`}}},
 {id:'mhyd',t:0,n:'九首炎蛇',r:24,col:2,pre:['mfwall'],ty:'turret',el:'fire',ic:'🐉',fx:'boom',mana:L=>20+(L-1),syn:[['mfb','mfball'],3],v:(L,sy)=>{const d=CLS_DR(12,18,6,9,L,sy),t=10+L;return{dmg:d,iv:1.2,n:3,dur:t,txt:`召出炎蛇 ${t} 秒：每 1.2 秒喷 3 发火球，各 ${clsDtx(d,'fire')}`}}},
 {id:'mfm',t:0,n:'火焰精通',r:30,col:1,ty:'passive',ic:'💠',v:L=>{const d=20+5*(L-1);return{dmg:d,txt:`被动：火焰技能伤害 +${d}%`}}},
 // 冰霜
 {id:'mice',t:1,n:'冰晶箭',r:1,col:1,ty:'bolt',el:'cold',ic:'🧊',fx:'ring',mana:L=>3,syn:[['mspike','mglac','mbliz','morb'],15],v:(L,sy)=>{const d=CLS_DR(3,5,2,3,L,sy),s=3+0.2*(L-1);return{dmg:d,slow:s,txt:`单体 ${clsDtx(d,'cold')}，减速 ${s.toFixed(1)} 秒`}}},
 {id:'mfa',t:1,n:'寒冰护甲',r:1,col:2,ty:'buff',g:'armor',ic:'❄',fx:'shield',mana:L=>7,v:L=>{const df=40+10*(L-1),cr=Math.min(40,10+2*(L-1)),t=60+12*(L-1);return{def:df,cres:cr,dur:t,chill:1,txt:`防御 +${df}%，冰冷抗性 +${cr}%，近战攻击者被减速；持续 ${t} 秒`}}},
 {id:'mnova',t:1,n:'霜冻新星',r:6,col:0,ty:'aoe',el:'cold',ic:'✳',fx:'ring',mana:L=>9+(L-1),sm:3,v:(L,sy)=>{const d=CLS_DR(4,8,4,5,L,sy),t=4+0.5*(L-1);return{dmg:d,slow:t,txt:`全部敌人 ${clsDtx(d,'cold')}，减速 ${t} 秒`}}},
 {id:'mspike',t:1,n:'冰锥',r:6,col:1,pre:['mice'],ty:'splash',el:'cold',ic:'🔷',fx:'ring',mana:L=>6+0.5*(L-1),sm:1,syn:[['mice','mglac','mbliz','morb'],8],v:(L,sy)=>{const d=CLS_DR(8,12,5,7,L,sy);return{dmg:d,sp:40,n:3,stun:0.8,txt:`命中 ${clsDtx(d,'cold')} 并冻结 0.8 秒，邻近 3 敌 40% 溅射`}}},
 {id:'mshiv',t:1,n:'碎霜甲',r:12,col:2,pre:['mfa'],ty:'buff',g:'armor',ic:'🛡',fx:'shield',mana:L=>11,v:(L,sy)=>{const df=45+12*(L-1),t=120+12*(L-1),r=CLS_DR(4,6,2,3,L,1);return{def:df,ret:r,dur:t,txt:`防御 +${df}%，受近战攻击时反击 ${clsDtx(r,'cold')}；持续 ${t} 秒（与其他护甲互斥）`}}},
 {id:'mglac',t:1,n:'冰川尖刺',r:18,col:1,pre:['mspike'],ty:'aoe',el:'cold',ic:'🏔',fx:'ring',mana:L=>11+(L-1),sm:2,syn:[['mice','mspike','mbliz'],5],v:(L,sy)=>{const d=CLS_DR(16,24,8,10,L,sy),s=+(1.2+0.1*(L-1)).toFixed(1);return{dmg:d,n:4,stun:Math.min(3,s),txt:`冻结 4 个敌人 ${Math.min(3,s)} 秒，各 ${clsDtx(d,'cold')}`}}},
 {id:'mbliz',t:1,n:'暴雪',r:24,col:0,pre:['mnova','mglac'],ty:'aoe',el:'cold',ic:'🌨',fx:'ring',mana:L=>23+(L-1),sm:3,syn:[['mice','mglac'],5],v:(L,sy)=>{const d=CLS_DR(30,44,14,18,L,sy);return{dmg:d,slow:4,txt:`全部敌人 ${clsDtx(d,'cold')}，减速 4 秒`}}},
 {id:'mchill',t:1,n:'凛冬甲',r:24,col:2,pre:['mshiv'],ty:'buff',g:'armor',ic:'🥶',fx:'shield',mana:L=>17,v:(L,sy)=>{const df=60+15*(L-1),t=150+12*(L-1),r=CLS_DR(8,10,4,5,L,1);return{def:df,ret:r,res:Math.min(25,5+L),dur:t,txt:`防御 +${df}%，全部抗性 +${Math.min(25,5+L)}%，受近战攻击反击 ${clsDtx(r,'cold')}；持续 ${t} 秒（与其他护甲互斥）`}}},
 {id:'mcm',t:1,n:'冰霜精通',r:30,col:0,ty:'passive',ic:'💎',v:L=>{const p=Math.min(95,20+5*(L-1)),d=10+5*(L-1);return{pierce:p,dmg:d,txt:`被动：冰冷技能穿透敌人冰冷抗性 ${p}%，冰冷伤害 +${d}%`}}},
 {id:'morb',t:1,n:'凛冬宝珠',r:30,col:1,pre:['mbliz'],ty:'aoe',el:'cold',ic:'🔵',fx:'ring',mana:L=>25+(L-1),sm:3,syn:[['mice'],2],v:(L,sy)=>{const d=CLS_DR(48,58,20,24,L,sy);return{dmg:d,stun:1,txt:`宝珠迸裂：全部敌人 ${clsDtx(d,'cold')}，冻结 1 秒`}}},
 // 闪电
 {id:'mcb',t:2,n:'电荷弹',r:1,col:1,ty:'multi',el:'light',ic:'✨',fx:'bolt',mana:L=>3+0.25*(L-1),syn:[['mlit','mnov'],6],v:(L,sy)=>{const d=CLS_DR(2,4,1,2,L,sy),n=Math.min(12,3+Math.floor(L/2));return{dmg:d,n,acc:0.75,txt:`射出 ${n} 枚游走电荷（约 75% 命中），各 ${clsDtx(d,'light')}`}}},
 {id:'mtk',t:2,n:'念力冲击',r:1,col:2,ty:'bolt',el:'magic',ic:'🌀',fx:'spirit',mana:L=>3,v:(L,sy)=>{const d=CLS_DR(2,6,1,2,L,sy);return{dmg:d,stun:0.5,txt:`单体 ${clsDtx(d,'magic')}，击晕 0.5 秒`}}},
 {id:'mcl',t:2,n:'连锁闪电',r:6,col:0,ty:'chain',el:'light',ic:'⚡',fx:'bolt',mana:L=>9+0.5*(L-1),sm:2,syn:[['mcb','mlit','mnov'],6],v:(L,sy)=>{const d=CLS_DR(1,30,2,6,L,sy),n=3+Math.floor(L/3);return{dmg:d,n,txt:`在 ${n} 个目标间弹跳，每次 ${clsDtx(d,'light')}`}}},
 {id:'mstatic',t:2,n:'静电场',r:6,col:2,ty:'static',el:'light',ic:'🔆',fx:'bolt',mana:L=>9,sm:2,v:L=>{const p=Math.min(40,25+L);return{pct:p,txt:`全部敌人损失当前生命 ${p}%（首领减半，受闪电抗性影响）`}}},
 {id:'mlit',t:2,n:'穿云电矛',r:12,col:1,pre:['mcb'],ty:'cone',el:'light',ic:'〽',fx:'bolt',mana:L=>8+0.5*(L-1),syn:[['mcb','mnov','mcl'],8],v:(L,sy)=>{const d=CLS_DR(1,40,1,9,L,sy);return{dmg:d,n:3,txt:`贯穿前方 3 个敌人，各 ${clsDtx(d,'light')}`}}},
 {id:'mnov',t:2,n:'雷霆新星',r:12,col:2,pre:['mstatic'],ty:'aoe',el:'light',ic:'💥',fx:'ring',mana:L=>15+(L-1),sm:3,syn:[['mcb','mlit'],5],v:(L,sy)=>{const d=CLS_DR(2,40,4,10,L,sy);return{dmg:d,txt:`全部敌人 ${clsDtx(d,'light')}`}}},
 {id:'mtel',t:2,n:'相位闪移',r:18,col:1,pre:['mlit'],ty:'buff',g:'phase',ic:'🌫',fx:'shield',mana:L=>9,v:L=>{const d=Math.min(45,15+2*(L-1)),t=30+3*(L-1);return{dodge:d,dur:t,txt:`${d}% 几率闪避伤害，持续 ${t} 秒`}}},
 {id:'mtstorm',t:2,n:'雷暴',r:24,col:0,pre:['mcl','mnov'],ty:'turret',el:'light',ic:'⛈',fx:'bolt',mana:L=>19,syn:[['mlit','mcl'],4],v:(L,sy)=>{const d=CLS_DR(12,60,8,14,L,sy),t=24+4*(L-1);return{dmg:d,iv:1.8,n:1,dur:t,txt:`雷云伴身 ${t} 秒：每 1.8 秒落雷 ${clsDtx(d,'light')}`}}},
 {id:'mesh',t:2,n:'奥能护盾',r:24,col:2,pre:['mtel'],ty:'buff',g:'es',ic:'🔮',fx:'shield',mana:L=>5,v:L=>{const a=Math.min(85,25+5*(L-1)),t=144+24*(L-1);return{es:a,dur:t,txt:`${a}% 受到伤害改由法力承担（每点 1.5 法力），持续 ${t} 秒`}}},
 {id:'mlm',t:2,n:'闪电精通',r:30,col:1,ty:'passive',ic:'🌟',v:L=>{const d=50+12*(L-1);return{dmg:d,txt:`被动：闪电技能伤害 +${d}%`}}},
]);
// 寒冰护甲：近战怪攻击英雄时被减速（掉血近似）
{const f=step;step=function(dt){const hp0=H.life;const r=f(dt);if(curCls()==='sor'&&buffOn('mfa')&&H.life<hp0)for(const m of MON)if(m.hp>0&&!m.ranged)m.slow=Math.max(m.slow||0,GT+2);return r}}
// ---------------- 野蛮人：战斗技能 / 武器精通 / 战吼（旧 id bbash/bww/bmast/bshout/bhowl 及其需求等级保持不变） ----------------
const clsMtx=(p,f)=>`武器伤害 ${p>=0?'+':''}${p}%${f?`，额外 +${f} 物理`:''}`;
const CLS_MST=(L)=>{const d=20+8*(L-1),a=30+10*(L-1),c=Math.min(35,Math.round(dim(L,5,45))),i=Math.min(40,8+2*(L-1));return{dmg:d,ar:a,crit:c,ias:i,txt:`使用对应武器时：武器伤害 +${d}%，命中 +${a}%，攻速 +${i}%，${c}% 几率重击(双倍)`}};
clsDef('bar',[
 // 战斗技能
 {id:'bbash',t:0,n:'猛击',r:1,col:1,ty:'hit',ic:'🔨',fx:'slash',mana:L=>1,syn:[['bstun','bconc'],5],v:(L,sy)=>{const p=Math.round((80+20*(L-1))*sy),f=3+3*(L-1);return{pct:p,flat:f,txt:`近战一击：${clsMtx(p,f)}`}}},
 {id:'bleap',t:0,n:'跃击',r:6,col:0,ty:'mall',ic:'🦘',fx:'slash',mana:L=>3,sm:2,v:(L,sy)=>{const p=Math.round(-40+8*(L-1)),s=+(0.8+0.1*(L-1)).toFixed(1);return{pct:p,n:3,stun:Math.min(2.5,s),txt:`跃入敌群：打击 3 个敌人（${clsMtx(p)}），击晕 ${Math.min(2.5,s)} 秒`}}},
 {id:'bdsw',t:0,n:'双重挥击',r:6,col:2,pre:['bbash'],ty:'mhit',ic:'⚔',fx:'slash',mana:L=>2,syn:[['bfrz'],5],v:(L,sy)=>{const p=Math.round((15+10*(L-1))*sy);return{pct:p,n:2,txt:`双手各攻击一个敌人：${clsMtx(p)}`}}},
 {id:'bstun',t:0,n:'震晕',r:12,col:1,pre:['bbash'],ty:'hit',ic:'💫',fx:'slash',mana:L=>2,v:(L,sy)=>{const p=Math.round((40+10*(L-1))*sy),s=+(1+0.15*(L-1)).toFixed(2);return{pct:p,stun:Math.min(4,s),txt:`近战一击 ${clsMtx(p)}，击晕 ${Math.min(4,s)} 秒（首领免疫）`}}},
 {id:'bww',t:0,n:'旋风斩',r:12,col:2,pre:['bbash'],ty:'mall',ic:'🌀',fx:'slash',mana:L=>3+0.2*(L-1),sm:2,syn:[['bbash','bdsw'],5],v:(L,sy)=>{const p=Math.round((50+12*(L-1))*sy),f=2+2*(L-1);return{pct:p,flat:f,txt:`旋转攻击全部敌人（最多 8 个）：${clsMtx(p,f)}`}}},
 {id:'b2thr',t:0,n:'双重投掷',r:12,col:0,pre:['bdsw'],ty:'throw',ic:'🪃',fx:'slash',mana:L=>2,v:(L,sy)=>{const p=Math.round((20+12*(L-1))*sy);return{pct:p,n:2,txt:`投掷两件武器击中 2 个敌人：${clsMtx(p)}（远程，不受近战限制）`}}},
 {id:'bla',t:0,n:'跃斩',r:18,col:0,pre:['bleap'],ty:'hit',ic:'🗡',fx:'slash',mana:L=>9,v:(L,sy)=>{const p=Math.round((100+30*(L-1))*sy),f=5+4*(L-1);return{pct:p,flat:f,stun:0.5,txt:`跃起重斩：${clsMtx(p,f)}，击晕 0.5 秒`}}},
 {id:'bconc',t:0,n:'专注',r:18,col:1,pre:['bstun'],ty:'hit',ic:'🎯',fx:'slash',mana:L=>2,syn:[['bbash','bbers'],5],v:(L,sy)=>{const p=Math.round((70+15*(L-1))*sy),a=60+10*(L-1);return{pct:p,ar:a,sure:0,txt:`凝神一击：${clsMtx(p)}，本次命中 +${a}%`}}},
 {id:'bfrz',t:0,n:'狂乱',r:24,col:2,pre:['bww'],ty:'mhit',ic:'🌪',fx:'slash',mana:L=>4,syn:[['bdsw','bww'],4],v:(L,sy)=>{const p=Math.round((60+18*(L-1))*sy),z=Math.min(60,20+4*(L-1));return{pct:p,n:2,fz:z,txt:`连续攻击 2 个敌人：${clsMtx(p)}，之后 4 秒攻速 +${z}%`}}},
 {id:'bbers',t:0,n:'狂暴',r:30,col:1,pre:['bconc'],ty:'hit',ic:'😡',fx:'spirit',mana:L=>4,v:(L,sy)=>{const p=Math.round((120+18*(L-1))*sy);return{pct:p,el:'magic',sure:1,txt:`必中一击，伤害全部转为魔法：${clsMtx(p)}`}}},
 // 武器精通（被动）
 {id:'bmast',t:1,n:'剑刃精通',r:1,col:0,ty:'passive',cat:'sword,dagger',ic:'⚔',v:CLS_MST},
 {id:'baxm',t:1,n:'斧锤精通',r:1,col:1,ty:'passive',cat:'axe,mace',ic:'🪓',v:CLS_MST},
 {id:'bpolm',t:1,n:'长柄精通',r:6,col:0,ty:'passive',cat:'polearm,spear,staff',ic:'🔱',v:CLS_MST},
 {id:'bthrm',t:1,n:'投掷精通',r:6,col:2,ty:'passive',cat:'throw,jav',ic:'🎯',v:CLS_MST},
 {id:'bstam',t:1,n:'坚韧体魄',r:12,col:1,ty:'passive',ic:'💪',v:L=>{const l=10+3*(L-1);return{life:l,txt:`被动：最大生命 +${l}%`}}},
 {id:'bcrit',t:1,n:'破绽洞察',r:18,col:0,pre:['bstam'],ty:'passive',ic:'👁',v:L=>{const c=Math.min(30,Math.round(dim(L,5,40)));return{crit:c,txt:`被动：任意武器额外 ${c}% 几率重击(双倍)`}}},
 {id:'biron',t:1,n:'铁肤',r:18,col:2,pre:['bstam'],ty:'passive',ic:'🛡',v:L=>{const d=30+10*(L-1);return{def:d,txt:`被动：防御 +${d}%`}}},
 {id:'bspeed',t:1,n:'迅捷',r:24,col:1,pre:['bcrit'],ty:'passive',ic:'💨',v:L=>{const i=Math.min(40,10+2*(L-1));return{ias:i,txt:`被动：攻击速度 +${i}%`}}},
 {id:'bfury',t:1,n:'嗜血',r:30,col:0,pre:['bcrit'],ty:'passive',ic:'🩸',v:L=>{const l=Math.min(10,2+0.5*(L-1));return{ll:l,txt:`被动：近战伤害 ${l}% 转为生命`}}},
 {id:'bnres',t:1,n:'自然抗性',r:30,col:2,pre:['biron'],ty:'passive',ic:'🌿',v:L=>{const r=Math.min(60,Math.round(dim(L,15,80)));return{res:r,txt:`被动：全部元素抗性 +${r}%（不超过上限）`}}},
 // 战吼
 {id:'bpot',t:2,n:'寻药',r:1,col:0,ty:'passive',ic:'🧪',v:L=>{const c=Math.min(50,Math.round(dim(L,8,60)));return{potch:c,txt:`被动：击杀时 ${c}% 几率搜出药剂，回复 10% 生命与法力`}}},
 {id:'bshout',t:2,n:'战斗怒吼',r:1,col:1,ty:'buff',g:'shout',ic:'📯',fx:'shield',mana:L=>3,v:L=>{const d=15+5*(L-1),df=20+10*(L-1),t=12+2*(L-1);return{wdmg:d,def:df,dur:t,txt:`战吼：伤害 +${d}%，防御 +${df}%，持续 ${t} 秒`}}},
 {id:'bhowl',t:2,n:'震慑战嚎',r:6,col:0,ty:'debuff',ic:'🗣',fx:'ring',mana:L=>4,sm:3,v:L=>{const t=+(1.5+0.25*(L-1)).toFixed(2),w=Math.min(60,20+3*(L-1));return{stun:t,dur:t*3,wk:w,txt:`震慑所有敌人 ${t} 秒，并使其伤害 -${w}%（${t*3}秒）`}}},
 {id:'btaunt',t:2,n:'挑衅',r:6,col:2,ty:'debuff',ic:'😤',fx:'ring',mana:L=>3,sm:2,v:L=>{const d=Math.min(60,20+4*(L-1)),t=10+L;return{dd:d,wk:10,dur:t,txt:`激怒全部敌人：防御 -${d}%，伤害 -10%，持续 ${t} 秒`}}},
 {id:'bfind',t:2,n:'搜刮',r:12,col:0,pre:['bpot'],ty:'passive',ic:'💰',v:L=>{const m=Math.round(dim(L,10,60)),g=Math.round(dim(L,20,120));return{mf:m,gf:g,txt:`被动：魔法装备掉率 +${m}%，金币 +${g}%`}}},
 {id:'bbcry',t:2,n:'战斗吶喊',r:18,col:2,pre:['btaunt'],ty:'debuff',ic:'📢',fx:'ring',mana:L=>5,sm:2,v:L=>{const d=Math.min(70,30+4*(L-1)),w=Math.min(50,20+3*(L-1)),t=12+L;return{dd:d,wk:w,dur:t,txt:`全部敌人防御 -${d}%、伤害 -${w}%，持续 ${t} 秒`}}},
 {id:'bgrim',t:2,n:'恐惧图腾',r:24,col:0,pre:['bfind'],ty:'debuff',ic:'🗿',fx:'ring',mana:L=>8,sm:3,v:L=>{const s=+(2+0.2*(L-1)).toFixed(1);return{stun:Math.min(5,s),wk:30,dd:20,dur:8+L,txt:`竖起图腾：非首领敌人恐惧(定身) ${Math.min(5,s)} 秒，伤害 -30%、防御 -20%`}}},
 {id:'bbo',t:2,n:'战斗号令',r:24,col:1,pre:['bshout'],ty:'buff',g:'bo',ic:'🚩',fx:'shield',mana:L=>8,v:L=>{const p=35+3*(L-1),t=30+6*(L-1);return{life:p,mana:p,dur:t,txt:`最大生命与法力 +${p}%，持续 ${t} 秒`}}},
 {id:'bbcmd',t:2,n:'战斗指挥',r:30,col:1,pre:['bbo'],ty:'buff',g:'bc',ic:'🎖',fx:'shield',mana:L=>10,v:L=>{const a=1+Math.floor((L-1)/10),t=20+4*(L-1);return{allsk:a,dur:t,txt:`全部技能 +${a}，持续 ${t} 秒`}}},
 {id:'bwcry',t:2,n:'战争怒吼',r:30,col:2,pre:['bbcry'],ty:'wcry',ic:'🦁',fx:'ring',mana:L=>12+0.5*(L-1),sm:2,syn:[['bhowl','btaunt','bbcry','bbo'],10],v:(L,sy)=>{const d=CLS_DR(30,40,12,14,L,sy),s=1;return{dmg:d,stun:s,txt:`怒吼震伤全部敌人 ${clsDtx(d,'phys')}，击晕 1 秒`}}},
]);
// 寻药：击杀时概率回复
{const f=killMon;killMon=function(m){const r=f(m);if(curCls()==='bar'){const v=pasV('bpot');if(v&&rnd()*100<v.potch&&ST){H.life=Math.min(ST.life,H.life+ST.life*0.1);H.mana=Math.min(ST.mana,H.mana+ST.mana*0.1)}}return r}}
const CLS_SKPLAN={
 bar:{order:['bbash','bshout','bmast','bbash','bmast','bhowl','bbash','bmast','bshout','bmast','bbash','bww','bstam','bww','bww','bww','bww','bcrit','bww','bww','bww','bww','bww','bbo','bww','bspeed','bww','bww','bww','bfury','bbcmd'],
  fill:()=>bl('bww')<20?['bww','bmast','bfury','bspeed','bshout']:['bmast','bfury','bspeed','bbo','bshout','bstam']},
 sor:{order:['mfb','mfa','mfb','mwarm','mfb','mfb','mcl','mfb','mfb','mfb','mfb','mfball','mmet','mfball','mfball','mmet','mfball','mfball','menc','mfball','mfball','mmet','mfball','mmet','mblaze','mfwall','mhyd','mfball','mmet','mfm','mfm','mfm'],
  fill:()=>['mfball','mmet','mfm','mfb','mhyd','menc','mwarm']},
};
function clsSkPlan(){return CLS_SKPLAN[curCls()]||null}
clsRegister();clsArtLoad();
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
