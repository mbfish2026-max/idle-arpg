'use strict';
// ===================================================================================
// merc.js — 佣兵系统完整版（独立页面/独立经验等级/难度版本与光环/解雇重雇/原版复活费/装备限制/符文之语光环/套装）
// 全部通过运行时包装 acts.js / game.js 中的全局函数实现，不修改他人源文件。必须在所有脚本之后加载。
// 存档：全部字段在 S.merc 下：{_v,t,v,nm,lvl,xp,hd,eq:{weapon,helm,armor},dead,off,auto,ar,prev,hires}
//   off=1 表示已解雇（S.merc 保持非 null，避免 acts.js migrate 自动重新赠送）；prev=上一位被解雇佣兵(可召回)。
// ===================================================================================
const MERC_V=2,MX={slot:null,auT:0,conv:0,auras:[],flt:'all'};
const MERC_SLOTS=['weapon','shield','helm','armor','gloves','belt','boots','amulet','ring1','ring2'];
// 副手：原版仅铁狼(单手剑+盾)可持盾；弓/长柄/矛为双手，剑士不持盾。缩颅(head)为角色职业物品，不可用
const MERC_SHIELD={mage:1};
const mslotBase=k=>k==='ring1'||k==='ring2'?'ring':k;
// 原版武器类型限制：罗格=弓；沙漠卫兵=长柄/矛；铁狼=单手剑(+盾，本游戏佣兵无副手)；野蛮人=剑
const MERC_WCATS={archer:['bow'],guard:['polearm','spear'],mage:['sword'],barb:['sword']};
// 原版 1.10 雇佣等级（按营地章节 × 难度）；实际等级不超过角色
const MERC_HIRELV={0:[[3,7],[36,40],[67,71]],1:[[9,13],[43,47],[75,79]],2:[[15,19],[49,53],[79,83]],4:[[28,32],[58,62],[80,84]]};
// 原版 hireling.txt ExpPerLvl（普通/噩梦/地狱），按本游戏经验曲线缩放：需求(L)=xpNeed(L)*ExpPerLvl/100
const MERC_XPR={archer:[100,105,110],guard:[110,115,120],mage:[110,115,120],barb:[120,125,130]};
const MERC_NAMES={archer:['莉娅','卡拉','艾琳','苏菲','萝拉','妮可'],guard:['阿兹','哈卡','萨米','莫拉','吉恩','法鲁'],mage:['奥兰','维克','赛门','诺曼','伊万','塔隆'],barb:['布恩','卡格','欧瑞','索尔','格拉','罗尔']};
const MERC_ART={archer:'assets/merc/merc_archer_moor.webp',guard:'assets/merc/merc_spear_port.webp',mage:'assets/merc/merc_mage_ironwolf.webp',barb:'assets/merc/merc_barb_snow.webp'};
// 光环：lv=光环等级；返回效果。dmg=伤害%（佣兵+召唤物），def=防御%，ar=命中%，ias，heal=每秒回复，mreg=回蓝%，thorns=反伤%，conv=降敌抗，tick={元素:每秒伤害}，slow
const AURAS={
 might:{n:'力量',f:a=>({dmg:40+10*a}),t:e=>`伤害 +${e.dmg}%`},
 pray:{n:'祈祷',f:(a,L)=>({heal:Math.round(2+a*1.5+L*0.1)}),t:e=>`全队每秒回复生命 ${e.heal}`},
 defi:{n:'反抗',f:a=>({def:70+10*a}),t:e=>`防御 +${e.def}%`},
 hfz:{n:'神圣冰冻',f:(a,L)=>({tick:{cold:Math.round(2+a*3+L*0.5)},slow:1}),t:e=>`周围敌人减速，每秒冰冷伤害 ${e.tick.cold}`},
 thorns:{n:'荆棘',f:a=>({thorns:250+40*a}),t:e=>`反弹近战伤害 ${e.thorns}%`},
 baim:{n:'祝福瞄准',f:a=>({ar:75+15*a}),t:e=>`命中 +${e.ar}%`},
 conc:{n:'专注',f:a=>({dmg:60+15*a}),t:e=>`伤害 +${e.dmg}%（不被打断）`},
 fana:{n:'狂热',f:a=>({dmg:50+18*a,ias:Math.min(40,10+a*2),ar:40+5*a}),t:e=>`伤害 +${e.dmg}%，攻速 +${e.ias}%，命中 +${e.ar}%`},
 conv:{n:'信念',f:a=>({conv:Math.min(150,30+5*a)}),t:e=>`敌人火/冰/电抗 -${e.conv}%（免疫按 1/5 打破）`},
 medi:{n:'冥想',f:a=>({mreg:Math.min(300,40+6*a)}),t:e=>`角色法力回复 +${e.mreg}%`},
 hfire:{n:'圣火',f:(a,L)=>({tick:{fire:Math.round(4+a*5+L*0.6)}}),t:e=>`每秒对所有敌人火焰伤害 ${e.tick.fire}`},
 hshock:{n:'神圣冲击',f:(a,L)=>({tick:{light:Math.round(4+a*7+L*0.7)}}),t:e=>`每秒对所有敌人闪电伤害 ${e.tick.light}`},
 vigor:{n:'活力',f:a=>({heal:Math.round(1+a*0.6)}),t:e=>`角色/全队每秒回复 ${e.heal}`},
};
// 符文之语附带光环（原版对应：洞见=冥想、无尽=信念、骄傲=专注、信仰/凶兽=狂热、天谴(末日)=神圣冰冻、裁决之手/龙吟=圣火、梦魇(梦境)=神圣冲击、荆冠=荆棘、遗愿=力量、和弦=活力）
const RW_AURA={'洞见':['medi',14],'无尽':['conv',12],'骄傲':['conc',18],'信仰':['fana',13],'凶兽':['fana',9],'天谴':['hfz',12],'裁决之手':['hfire',16],'龙吟':['hfire',14],'梦魇':['hshock',15],'荆冠':['thorns',18],'遗愿':['might',17],'和弦':['vigor',10]};
// 版本：按类型与难度（原版：沙漠卫兵 普通/地狱=战斗(祈祷)/防御(反抗)/攻击(力量)，噩梦=战斗(神圣冰冻)/防御(荆棘)/攻击(祝福瞄准)）
const MERC_VARS={
 archer:{all:{fire:{n:'火焰箭',sk:['火焰箭','内视'],d:'火焰箭附加火焰伤害；内视降低目标防御 40%'},cold:{n:'冰霜箭',sk:['冰霜箭','缓速投射'],d:'冰霜箭附加冰冷伤害并减速目标'}}},
 guard:{0:{pray:{n:'战斗·祈祷',sk:['刺击'],au:'pray'},defi:{n:'防御·反抗',sk:['刺击'],au:'defi'},might:{n:'攻击·力量',sk:['刺击'],au:'might'}},
        1:{hfz:{n:'战斗·神圣冰冻',sk:['刺击'],au:'hfz'},thorns:{n:'防御·荆棘',sk:['刺击'],au:'thorns'},baim:{n:'攻击·祝福瞄准',sk:['刺击'],au:'baim'}}},
 mage:{all:{fire:{n:'火系',sk:['火球','地狱火'],d:'火球单体高伤'},cold:{n:'冰系',sk:['冰爆','冰封装甲','冰锥'],d:'冰爆伤害并减速，自带冰封装甲(防御+)'},light:{n:'电系',sk:['充能弹','闪电'],d:'闪电攻击最多 3 个目标'}}},
 barb:{all:{bash:{n:'重击',sk:['重击','震晕'],d:'15% 几率震晕非首领'},frenzy:{n:'狂乱',sk:['狂乱'],d:'攻速 +30%'}}},
};
MERC_VARS.guard[2]=MERC_VARS.guard[0];
function mercVars(t,d){const V=MERC_VARS[t];return V.all||V[d]||V[0]}
function mercVarDef(t,v){const V=MERC_VARS[t];for(const k in V)if(V[k][v])return V[k][v];return null}
for(const t in MERC_WCATS)if(typeof MERCS!=='undefined'&&MERCS[t]){MERCS[t].wcats=MERC_WCATS[t];for(const d of [0,1,2])for(const v in mercVars(t,d))MERCS[t].vars[v]=mercVars(t,d)[v].n}

// ---------- 数据 / 迁移 ----------
const mercUp=()=>!!(typeof S!=='undefined'&&S&&S.merc&&S.merc.t&&!S.merc.off&&MERCS[S.merc.t]);
const bagFull=()=>typeof slotsUsed==='function'&&typeof BAG_SZ!=='undefined'?slotsUsed(S.bag)>=BAG_SZ:S.bag.length>=40;
function mercXpNeed(L,t,d){if(L<=1)return 0;const m=S.merc||{};const r=(MERC_XPR[t||m.t]||[110,115,120])[d??m.hd??0];return Math.floor(xpNeed(L)*r/100)}
function mercHireLv(t,d=S.diff){return Math.max(1,S.lvl||1);const r=MERC_HIRELV[MERCS[t].act]||MERC_HIRELV[0];const[lo,hi]=r[d]||r[0];return Math.max(1,Math.min(S.lvl,lo+(S.lvl+t.length)%(hi-lo+1)))}
function mercNorm(){if(typeof S==='undefined'||!S)return;const m=S.merc;if(m&&m._v===MERC_V&&m.t&&m.lvl!==Math.max(1,S.lvl||1)){m.lvl=Math.max(1,S.lvl||1);m.xp=mercXpNeed(m.lvl,m.t,m.hd)}if(!m||m._v===MERC_V)return;
 if(!m.t||!MERCS[m.t]){S.merc={_v:MERC_V,t:null,off:1,eq:{},lvl:1,xp:0};return}
 m.eq=m.eq&&typeof m.eq==='object'?m.eq:{};m.hd=m.hd??(S.diff||0);if(m.lvl==null)m.lvl=Math.max(1,S.lvl||1);m.lvl=Math.max(1,S.lvl||1);// 佣兵等级始终=角色等级
 if(m.xp==null||m.xp<mercXpNeed(m.lvl,m.t,m.hd))m.xp=mercXpNeed(m.lvl,m.t,m.hd);m.dead=m.dead?1:0;m.off=m.off?1:0;if(m.auto==null)m.auto=S.autoMerc??1;if(m.ar==null)m.ar=1;m.hires=m.hires||1;
 if(!m.nm){const ns=MERC_NAMES[m.t];m.nm=ns[(S.uid||0)%ns.length]}
 if(!mercVarDef(m.t,m.v)||!mercVars(m.t,m.hd)[m.v]){const vs=mercVars(m.t,m.hd);m.v=vs[m.v]?m.v:(vs[MERCS[m.t].vd]?MERCS[m.t].vd:Object.keys(vs)[0])}
 m._v=MERC_V;for(const k of MERC_SLOTS){const it=m.eq[k];if(it&&!mercFits(it,k,m.t)){S.bag.push(it);delete m.eq[k];log&&log(`佣兵无法使用 ${itemName(it)}（类型限制），已放回背包`)}}
 for(const k in m.eq)if(!MERC_SLOTS.includes(k))delete m.eq[k]}
function mercFits(it,k,t,eq){if(!it||it.k)return false;const b=BASEM[it.b];if(!b||b.s!==mslotBase(k))return false;if(k==='weapon')return(MERC_WCATS[t]||[]).includes(b.cat)&&!(b.th&&!MERC_WCATS[t].includes('sword')&&false);
 if(k==='shield'){if(!MERC_SHIELD[t]||b.cat!=='shield')return false;const w=(eq||(S.merc&&S.merc.eq)||{}).weapon;return!(w&&BASEM[w.b]&&BASEM[w.b].th)}return true}
function mercSlotFor(it,pref){const b=BASEM[it.b];if(b.s!=='ring')return b.s;if(pref==='ring1'||pref==='ring2')return pref;const e=S.merc.eq;return!e.ring1?'ring1':!e.ring2?'ring2':(power(e.ring1)<=power(e.ring2)?'ring1':'ring2')}
const _mx_load=load;load=function(){_mx_load();mercNorm()};

// ---------- 属性 ----------
// 后期成长（30 级前全部为 1/0，前期不变；按佣兵等级线性插值）
const MERC_GROW={hp:[[1,1],[30,1],[50,1.4],[70,1.9],[85,2.5]],def:[[1,1],[30,1],[50,1.3],[70,1.7],[85,2]],res:[[1,0],[30,0],[50,15],[70,30],[85,45]]};
// 主属性加伤：与角色规则一致（late.js）——超出 1 级初始值每 X 点 +1% 伤害
const MERC_MAIN={archer:['dex',5],guard:['str',5],mage:['str',5],barb:['str',6]};
const MERC_SKX=4;// 技能等级超过 7（≈30 级水平）后每级 +4% 伤害
function mercK(t,L){if(L<=t[0][0])return t[0][1];for(let i=1;i<t.length;i++)if(L<=t[i][0]){const[a,x]=t[i-1],[b,y]=t[i];return x+(y-x)*(L-a)/(b-a)}return t[t.length-1][1]}
function mercSets(eq){const c={};for(const k of MERC_SLOTS){const it=eq[k];if(it&&it.set)c[it.set]=(c[it.set]||0)+1}return c}
function mercAuraList(ms){const out={};const add=(id,lv,src)=>{if(!AURAS[id]||lv<=0)return;if(!out[id]||out[id].lv<lv)out[id]={id,lv,src}};
 const V=mercVarDef(S.merc.t,S.merc.v);if(V&&V.au)add(V.au,ms.skl,'自身');
 for(const k of MERC_SLOTS){const it=S.merc.eq[k];if(it&&it.rw!=null&&RUNEWORDS[it.rw]){const a=RW_AURA[RUNEWORDS[it.rw].n];if(a)add(a[0],a[1],'符文之语「'+RUNEWORDS[it.rw].n+'」')}}
 return Object.values(out).map(x=>Object.assign(x,{e:AURAS[x.id].f(x.lv,ms.L)}))}
mercStats=function(eqOverride){mercNorm();const m=S.merc,T=MERCS[m.t],L=m.lvl,eq=eqOverride||m.eq,M={};let wmn=0,wmx=0,idef=0;
 for(const k of MERC_SLOTS){const it=eq[k];if(!it)continue;const mm=allMods(it),l=itemLocal(it);for(const x in mm)if(typeof mm[x]==='number')M[x]=(M[x]||0)+mm[x];if(l.def)idef+=l.def;if(k==='weapon'&&l.min){wmn=l.min;wmx=l.max}}
 const sets=mercSets(eq);for(const s in sets){const bo=SETS[s]&&SETS[s].bonus;if(bo)for(const n in bo)if(sets[s]>=+n)for(const x in bo[n])if(typeof bo[n][x]==='number')M[x]=(M[x]||0)+bo[n][x]}
 const dv=m.hd||0,allsk=M.allsk||0,skl=Math.min(40,1+Math.floor(L*0.22)+Math.floor(Math.max(0,L-30)*0.15)+allsk);
 const str=Math.floor(T.str[0]+T.str[1]*L)+(M.str||0),dex=Math.floor(T.dex[0]+T.dex[1]*L)+(M.dex||0);
 const gHp=mercK(MERC_GROW.hp,L),gDef=mercK(MERC_GROW.def,L),gRes=Math.round(mercK(MERC_GROW.res,L));
 const life=Math.round(((T.life[0]+T.life[1]*L)*gHp+(M.life||0)+(M.vit||0)*2)*(1+(M.lifepct||0)/100));
 // 防具防御走 itemLocal（含 edef/def）；首饰等非防具上的 +防御 也计入
 for(const k of MERC_SLOTS){const it=eq[k];if(it&&!BASEM[it.b].def&&it.m&&it.m.def)idef+=allMods(it).def}
 let def=Math.round((T.def[0]+T.def[1]*L)*gDef+idef+dex/4);
 const sb=1+str/100*(T.spell?0:1);let mn=(T.dmg[0][0]+T.dmg[0][1]*L+wmn+(M.mindmg||0))*sb,mx=(T.dmg[1][0]+T.dmg[1][1]*L+wmx+(M.maxdmg||0))*sb;
 if(T.spell){const k=1+0.06*skl;mn*=k;mx*=k}
 const[mk,mx_]=MERC_MAIN[m.t]||['str',5],mst=mk==='dex'?dex:str,m0=Math.floor(T[mk][0]+T[mk][1]),mainP=Math.max(0,Math.floor((mst-m0)/mx_)),skP=MERC_SKX*Math.max(0,skl-7);
 const lateK=(1+mainP/100)*(1+skP/100);mn*=lateK;mx*=lateK;
 const pen=curPen(),er=k=>Math.min(75+(M['max'+k]||0),Math.round(T.res*L)+dv*10+gRes+(M[k]||0)+(M.allres||0)+pen);const res={fire:er('fres'),cold:er('cres'),light:er('lres'),pois:er('pres')};
 let ias=(M.ias||0)+(m.v==='frenzy'?30:0),ar=40+L*10+dex*2+(M.ar||0);
 const sh=eq.shield,blk=sh?Math.min(75,Math.max(0,Math.floor(((BASEM[sh.b].block||0)+(M.block||0))*(dex-15)/(L*2)))):0;
 const o={L,str,dex,life,def,res,block:blk,ll:M.ll||0,cb:M.cb||0,ds:M.ds||0,dr:M.dr||0,allsk,skl,M,sets,gHp,gDef,gRes,mainP,mk,skP,lateK,regen:M.regen||0,
  edmg:{fire:(M.firemin||0)*lateK,cold:(M.coldmin||0)*lateK,light:(M.lightmax||0)*lateK,pois:(M.poisdmg||0)*lateK}};
 o.auras=mercAuraList(o);let dmgP=0,defP=0,arP=0;for(const a of o.auras){dmgP+=a.e.dmg||0;defP+=a.e.def||0;arP+=a.e.ar||0;ias+=a.e.ias||0}
 if(m.t==='mage'&&m.v==='cold')defP+=Math.min(150,30+skl*5);
 mn*=1+dmgP/100;mx*=1+dmgP/100;def=Math.round(def*(1+defP/100));ar=Math.round(ar*(1+arP/100)*(1+(M.arp||0)/100));
 // 物理减伤：防御换算（def/(def+120×等级)，≤40%）+ 装备物理减伤%（≤50%）；装备「伤害减少」为固定值
 o.ntg=1+Math.floor(Math.max(0,L-50)/20);// 后期：50 级起每 20 级多攻击 1 个目标（穿透/顺劈；70 级 2 个）
 o.pdr=Math.min(40,Math.round(def/(def+120*L)*100));o.drp=Math.min(50,M.drp||0);
 Object.assign(o,{def,dmg:[mn,mx],ar,ias,dmgP,atk:T.atk/(1+ias/100),avgres:Math.round((res.fire+res.cold+res.light+res.pois)/4)});return o};
// 光环对角色/召唤物生效；关闭 acts.js 旧的固定光环
mercAlive=function(){return !MX.inCalc&&mercUp()&&!S.merc.dead};
mercDead=function(){return mercUp()&&!!S.merc.dead};
const _mx_calc=calc;calc=function(){MX.inCalc=1;let o;try{o=_mx_calc()}finally{MX.inCalc=0}MX.conv=0;MX.auras=[];
 if(mercUp()&&!S.merc.dead){const ms=mercStats();MX.auras=ms.auras;for(const a of ms.auras){const e=a.e;
  if(e.dmg)o.sumdmg+=e.dmg;if(e.def)o.def=Math.round(o.def*(1+e.def/100));if(e.ar)o.ar=Math.round(o.ar*(1+e.ar/100));if(e.heal)o.regen+=e.heal;if(e.mreg)o.mregen+=e.mreg;
  if(e.thorns)o.thorns+=Math.round(S.lvl*e.thorns/100);if(e.conv)MX.conv=Math.max(MX.conv,e.conv)}}
 o.mercAuras=MX.auras.map(a=>a.id);ST=o;return o};
const _mx_resOf=resOf;resOf=function(m,k){const r=_mx_resOf(m,k);if(!MX.conv||!(k==='fire'||k==='cold'||k==='light'))return r;if(r>=100){const x=(m.res[k]||0)-MX.conv/5;return x>=100?100:clamp(x,-100,95)}return clamp(r-MX.conv,-100,95)};

// ---------- 雇佣 / 解雇 / 复活 ----------
function mercHireCost(L){return Math.round(100+2*L*L)}
hireCost=function(){return mercHireCost(S.merc&&S.merc.lvl||S.lvl)};
// 原版：min(int(lvl²/2)×15, 50000)
reviveCost=function(){const L=S.merc&&S.merc.lvl||1;return Math.min(Math.floor(L*L/2)*15,50000)};
function mercReturnEq(m){for(const k of MERC_SLOTS){const it=m.eq&&m.eq[k];if(it){S.bag.push(it);delete m.eq[k]}}}
hireMerc=function(t,v,free,opt){opt=opt||{};if(!MERCS[t])return;const d=opt.hd??S.diff,L=Math.max(1,S.lvl||1);
 if(!free){const c=opt.cost??mercHireCost(L);if(S.gold<c)return toast('金币不足');S.gold-=c}
 const old=S.merc;if(old&&old.t&&!old.off){mercReturnEq(old);old.prev=null}
 const vs=mercVars(t,d);v=v&&vs[v]?v:(vs[MERCS[t].vd]?MERCS[t].vd:Object.keys(vs)[0]);
 const ns=MERC_NAMES[t];const nm=opt.nm||ns[((old&&old.hires)||0)%ns.length];
 S.merc={_v:MERC_V,t,v,nm,lvl:L,xp:opt.xp??mercXpNeed(L,t,d),hd:d,eq:{},dead:0,off:0,auto:old?old.auto??1:1,ar:old?old.ar??1:1,prev:opt.keepPrev?null:(old&&old.off?old.prev:null),hires:((old&&old.hires)||0)+1};
 S.mercU=1;ALLY=ALLY.filter(a=>a.kind!=='merc');if(typeof ACX!=='undefined')ACX.mercOn=0;if(ST)calc();
 if(!free)log(`雇佣了 <b>${nm}</b>（${MERCS[t].n}·${mercVarDef(t,v).n}，Lv.${L}）`);if(typeof TAB!=='undefined'&&TAB!=='fight'&&!window.__NOUI)render()};
function mercDismiss(ok){if(!mercUp())return;if(!ok&&!window.__NOUI)return modal(`<div class="mtitle">解雇佣兵</div><div class="gp"><div>确定解雇 <b>${S.merc.nm}</b>？装备将退回背包。可在下方「召回」以原等级重新雇用（需雇佣费）。</div><div class="btns c"><button class="btn gold" onclick="mercDismiss(1);closeM()">解雇</button><button class="btn" onclick="closeM()">取消</button></div></div>`);
 const m=S.merc;mercReturnEq(m);m.prev={t:m.t,v:m.v,nm:m.nm,lvl:m.lvl,xp:m.xp,hd:m.hd};m.off=1;m.dead=0;ALLY=ALLY.filter(a=>a.kind!=='merc');if(typeof ACX!=='undefined')ACX.mercOn=0;calc();log(`解雇了佣兵 ${m.nm}`);if(!window.__NOUI)render()}
function mercRecall(){const p=S.merc&&S.merc.prev;if(!p)return;const L=S.lvl;hireMerc(p.t,p.v,0,{lvl:L,xp:Math.min(p.xp,mercXpNeed(L+1,p.t,p.hd)),hd:p.hd,nm:p.nm,keepPrev:1})}
mercRevive=function(auto){if(!mercDead())return;const c=reviveCost();if(S.gold<c){if(!auto)toast('金币不足');return}S.gold-=c;S.merc.dead=0;calc();log(`花费 ${c} 金币复活佣兵 ${S.merc.nm}`);if(!auto&&!window.__NOUI)render()};

// ---------- 经验 ----------
function mercGainXp(x){if(mercUp()&&S.merc.lvl!==S.lvl){S.merc.lvl=S.lvl;S.merc.xp=mercXpNeed(S.lvl);calc()}return;if(!mercUp()||S.merc.dead||x<=0)return;const m=S.merc;m.xp+=x;const cap=mercXpNeed(S.lvl+1)-1;if(S.lvl<99&&m.xp>cap)m.xp=Math.max(cap,mercXpNeed(m.lvl));
 if(m.lvl>S.lvl)m.lvl=S.lvl;let up=0;while(m.lvl<S.lvl&&m.lvl<99&&m.xp>=mercXpNeed(m.lvl+1)){m.lvl++;up=1}if(up){log(`<b style="color:#8cf">佣兵 ${m.nm} 升到 ${m.lvl} 级</b>`);calc()}}
// 佣兵经验：等量获得角色的全部经验（击杀/任务/离线结算）；升级需求按原版 ExpPerLvl 放大，上限为角色等级
const _mx_gx=gainXp;gainXp=function(x){_mx_gx(x);if(mercUp())mercGainXp(x)};// 角色升级后佣兵立即同步等级（不再独立累计经验）

// ---------- 装备 ----------
canMercEquip=function(it,k){if(!mercUp()||!it||it.k)return false;const b=BASEM[it.b];if(!b)return false;k=k||mercSlotFor(it);if(!MERC_SLOTS.includes(k)||!mercFits(it,k,S.merc.t))return false;const r=itemReq(it),ms=mercStats();return ms.L>=r.lv&&ms.str>=r.str&&ms.dex>=r.dex};
function mercWhyNot(it,k){if(!mercFits(it,k||mercSlotFor(it),S.merc.t))return BASEM[it.b].s==='shield'?'双手武器/类型不能持盾':'类型不符';const r=itemReq(it),ms=mercStats();const w=[];if(ms.L<r.lv)w.push('需等级'+r.lv);if(ms.str<r.str)w.push('需力量'+r.str);if(ms.dex<r.dex)w.push('需敏捷'+r.dex);return w.join(' ')}
mercEquip=function(uid,slot){let f=findItem(uid);if(!f||f.slot)return false;const k=mercSlotFor(f.it,slot||MX.slot);if(!canMercEquip(f.it,k))return false;const cur=S.merc.eq[k];
 const obj=f.it;if(f.stash){if(typeof withdrawUid!=='function'||withdrawUid(uid,1)===false)return false}
 const bi=S.bag.indexOf(obj);if(bi<0)return false;const it=S.bag.splice(bi,1)[0];if(cur)S.bag.push(cur);S.merc.eq[k]=it;
 if(k==='weapon'&&BASEM[it.b].th&&S.merc.eq.shield){S.bag.push(S.merc.eq.shield);delete S.merc.eq.shield}
 calc();log(`佣兵装备：<span style="color:${itemColor(it)}">${itemName(it)}</span>`);if(!window.__NOUI){closeM();render()}return true};
mercUnequip=function(k){if(!S.merc||!S.merc.eq[k])return false;if(bagFull()){toast('背包已满');return false}S.bag.push(S.merc.eq[k]);delete S.merc.eq[k];calc();if(!window.__NOUI){closeM();render()}return true};
// 佣兵自动换装只看佣兵页自己的「自动换装」开关（S.merc.auto）；不再要求角色的 S.autoEq——角色自动换装在设置弹窗里关掉后，佣兵页按钮仍显示开启却不再换装
mercAutoEq=function(){if(!mercUp()||!S.merc.auto||!Array.isArray(S.bag))return;for(const it of S.bag.slice()){if(!it||it.k)continue;const b=BASEM[it.b];if(!b)continue;
 const ks=b.s==='ring'?['ring1','ring2']:[b.s];if(it.lk)continue;for(const k of ks){if(!canMercEquip(it,k))continue;const c=S.merc.eq[k];if(c&&c.lk)continue;if(k==='weapon'&&BASEM[it.b].th&&S.merc.eq.shield&&S.merc.eq.shield.lk)continue;
  if(!c||power(it)>power(c)){S.bag.splice(S.bag.indexOf(it),1);if(c)S.bag.push(c);S.merc.eq[k]=it;if(k==='weapon'&&BASEM[it.b].th&&S.merc.eq.shield){S.bag.push(S.merc.eq.shield);delete S.merc.eq.shield}calc();log(`佣兵换装：<span style="color:${itemColor(it)}">${itemName(it)}</span>`);break}}}};
// items2.js 的命中特效(压碎/撕裂/偷取等)只统计了 3 格，扩展到全身
if(typeof attackerMods==='function'){const _mx_am=attackerMods;attackerMods=function(src){if(src&&src.kind==='merc'&&S.merc&&S.merc.eq){const M={};for(const k of MERC_SLOTS){const it=S.merc.eq[k];if(!it)continue;const m=allMods(it);for(const x in m)if(typeof m[x]==='number')M[x]=(M[x]||0)+m[x]}return M}return _mx_am(src)}}

// ---------- 战斗 ----------
const ELC={fire:'#f84',cold:'#8cf',light:'#ff6',pois:'#8f6'};
mercTick=function(dt){if(typeof S==='undefined'||!S||!S.merc)return;mercNorm();const M=S.merc;let a=ALLY.find(x=>x.kind==='merc');
 if(!mercUp()){if(a)ALLY.splice(ALLY.indexOf(a),1);ACX.mercOn=0;return}
 if(!a){if(ACX.mercOn&&!M.dead){M.dead=1;ACX.mercOn=0;log(`<b style="color:#f84">佣兵 ${M.nm} 阵亡</b>（复活 ${reviveCost()} 金）`);calc();return}
  if(M.dead){if(M.ar&&!liveMon().length)mercRevive(1);return}
  const ms=mercStats(),T=MERCS[M.t];a={uid:mUid++,kind:'merc',n:M.nm,ic:T.ic,hp:ms.life,max:ms.life,dmg:ms.dmg,res:ms.avgres,t:1e9,mt:1,ms};mercArmHp(a);ALLY.unshift(a);ACX.mercOn=1;calc();return}
 a.t=1e9;ACX.mercOn=1;ACX.mst=(ACX.mst||0)-dt;
 if(ACX.mst<=0){ACX.mst=1;const ms=mercStats();const r=a.hp/a.max;a.max=ms.life;MX.self=1;a.hp=Math.min(a.max,Math.max(1,r*a.max));MX.self=0;a.dmg=ms.dmg;a.res=ms.avgres;a.ms=ms;a.n=M.nm}
 const ms=a.ms||mercStats(),mons=liveMon();
 if(ms.regen)a.hp=Math.min(a.max,a.hp+ms.regen*dt);
 for(const au of ms.auras)if(au.e.heal)for(const x of ALLY)if(x.hp>0&&x.kind!=='wall')x.hp=Math.min(x.max,x.hp+au.e.heal*dt);
 if(!mons.length){a.hp=Math.min(a.max,a.hp+a.max*0.05*dt);if(ms.L>=40)a.mt=Math.min(a.mt,0.2);return}// 40 级起波次间隙攻击就绪（后期怪 0.5 秒内被清空，计时冻结会让佣兵出手不及）
 MX.auT-=dt;if(MX.auT<=0){MX.auT=1;for(const au of ms.auras){if(au.e.tick)for(const m of liveMon()){for(const el in au.e.tick)hitMon(m,{[el]:au.e.tick[el]},a,ELC[el])}if(au.e.slow)for(const m of liveMon())m.slow=GT+1.5}}
 a.mt-=dt;if(a.mt>0)return;a.mt=ms.atk;const ls=liveMon();if(!ls.length)return;const tg=target(ls),T=MERCS[M.t],v=M.v;let d=R(Math.round(ms.dmg[0]),Math.max(Math.round(ms.dmg[0]),Math.round(ms.dmg[1])));
 if(ms.cb&&rnd()*100<ms.cb)d*=2;let done=0;const ed=ms.edmg||{},ex=o=>{for(const e in ed)if(ed[e]>0)o[e]=(o[e]||0)+ed[e];return o};
 const tgs=[tg,...ls.filter(x=>x!==tg)].slice(0,(T.spell&&v==='light'?2:0)+(ms.ntg||1));
 if(T.spell){for(const m of tgs){done+=hitMon(m,ex({[v]:d}),a,ELC[v]);if(v==='cold')m.slow=GT+2}fxLine(a.uid,tg.uid,ELC[v])}
 else for(const tg of tgs){const def=M.t==='archer'&&v==='fire'?tg.def*0.6:tg.def;
  if(hitChance(ms.ar,def,ms.L,tg.lv)){if(M.t==='archer'){const el=v==='fire'?'fire':'cold';done+=hitMon(tg,ex({phys:d*0.6,[el]:d*0.6*(1+0.04*ms.skl)}),a,ELC[el]);if(el==='cold')tg.slow=GT+1.5;fxLine(a.uid,tg.uid,ELC[el])}
   else{done+=hitMon(tg,ex({phys:d}),a,'#dfd');if(M.t==='barb'&&v==='bash'&&rnd()<0.15&&!tg.boss)tg.stun=1}}}
 if(done&&ms.ll)a.hp=Math.min(a.max,a.hp+done*ms.ll/100)};
const _mx_allyCard=allyCard;allyCard=function(a){if(a.kind!=='merc'||!mercUp())return _mx_allyCard(a);const h=_mx_allyCard(a);
 return h.replace(/<b class="lv">\d+<\/b>/,`<b class="lv">${S.merc.lvl}</b>`).replace(/<div class="pt">[\s\S]*?<\/div>/,`<div class="pt"><img class="art mport t_${S.merc.t} v_${S.merc.v}" src="${MERC_ART[S.merc.t]}" onerror="this.remove()"></div>`).replace('<div class="nm">',`<div class="nm">${MX.auras.length?'<i class="mau">✺</i>':''}`)};

// ---------- 界面 ----------
function mercPortrait(t,v,big){return`<div class="mportw ${big?'big':''}"><img class="mport t_${t} v_${v}" src="${MERC_ART[t]}" onerror="this.style.display='none'"><span class="mglyph">${MERCS[t].ic}</span></div>`}
mercPanel=function(){mercNorm();if(!S.mercU&&!mercUp())return`<div class="gp"><h3>佣兵</h3><div class="dim">完成第一章任务「堕落女猎手」后可获得佣兵。</div></div>`;
 const m=S.merc;if(!mercUp())return`<div class="gp"><h3>佣兵</h3><div class="dim">当前没有佣兵。</div><div class="btns"><button class="btn sm gold" onclick="TAB='merc';render()">前往佣兵页雇佣</button></div></div>`;
 const ms=mercStats();return`<div class="gp mercmini" onclick="TAB='merc';render()"><h3>佣兵</h3><div class="mminih">${mercPortrait(m.t,m.v)}<div style="flex:1"><div class="row"><span><b>${m.nm}</b> <span class="dim">${MERCS[m.t].n}·${mercVarDef(m.t,m.v).n}</span></span><b>${m.dead?'<span class="bad">阵亡</span>':'Lv.'+m.lvl}</b></div>
 <div class="row"><span>光环</span><b>${ms.auras.map(a=>AURAS[a.id].n+' '+a.lv).join('、')||'无'}</b></div></div></div><div class="btns"><button class="btn sm gold">佣兵详情 ›</button></div></div>`};
function mercStatsHTML(ms){const row=(a,b,w)=>`<div class="mrow${w?' wide':''}"><span>${a}</span><b>${b}</b></div>`;const T=MERCS[S.merc.t];
 return row('生命',ms.life)+row('防御',ms.def)+row(T.spell?'法术伤害':'伤害',Math.round(ms.dmg[0])+'-'+Math.round(ms.dmg[1]))+row('攻击间隔',ms.atk.toFixed(2)+'s'+(ms.ias?` <small>(+${ms.ias}%)</small>`:''))+row('命中',ms.ar)+row('力量 / 敏捷',ms.str+' / '+ms.dex)+
 row('火 / 冰 / 电 / 毒抗',`<span class="mrf">${ms.res.fire}</span>/<span class="mrc">${ms.res.cold}</span>/<span class="mrl">${ms.res.light}</span>/<span class="mrp">${ms.res.pois}</span>`,1)+row('偷取生命',ms.ll+'%')+row('+所有技能',ms.allsk)+row('压碎打击',ms.cb+'%')+row('格挡率',ms.block+'%'+(S.merc.eq.shield?'':' <small class="dim">(无盾)</small>'))+row('物理减伤',ms.pdr+'%'+(ms.drp?` +${ms.drp}%`:'')+(ms.dr?` · -${ms.dr}`:''))+row('攻击目标',ms.ntg)}
// 装备带来的加成：与「不穿装备」时对比（同等级/光环下）
function mercEqHTML(ms){const z=mercStats({}),row=(a,b)=>`<div class="mrow"><span>${a}</span><b class="g">${b}</b></div>`,av=x=>(x.dmg[0]+x.dmg[1])/2,out=[];
 const add=(n,d,u='')=>{d=Math.round(d);if(d)out.push(row(n,(d>0?'+':'')+d+u))};
 add('生命',ms.life-z.life);add('防御',ms.def-z.def);add('平均伤害',av(ms)-av(z));if(av(z)>0)add('伤害',(av(ms)/av(z)-1)*100,'%');add('命中',ms.ar-z.ar);add('攻速',ms.ias-z.ias,'%');
 for(const[k,n]of[['fire','火抗'],['cold','冰抗'],['light','电抗'],['pois','毒抗']])add(n,ms.res[k]-z.res[k]);
 add('力量',ms.str-z.str);add('敏捷',ms.dex-z.dex);add('+所有技能',ms.allsk);add('偷取生命',ms.ll,'%');add('压碎打击',ms.cb,'%');add('致命一击',ms.ds,'%');add('格挡',ms.block,'%');add('物理减伤',ms.pdr-z.pdr+ms.drp,'%');add('伤害减少',ms.dr);add('生命回复',ms.regen,'/秒');
 const el=Object.entries(ms.edmg).filter(e=>e[1]>0).map(([k,v])=>({fire:'火',cold:'冰',light:'电',pois:'毒'})[k]+Math.round(v)).join(' ');if(el)out.push(row('附加元素伤害',el));
 const au=ms.auras.filter(a=>a.src!=='自身');if(au.length)out.push(row('光环',au.map(a=>AURAS[a.id].n+' '+a.lv).join('、')));
 return out.join('')||'<div class="dim">未穿戴装备，或装备没有带来加成</div>'}
function mercGrowHTML(ms){const row=(a,b)=>`<div class="mrow"><span>${a}</span><b>${b}</b></div>`;
 return row('生命成长','×'+ms.gHp.toFixed(2))+row('防御成长','×'+ms.gDef.toFixed(2))+row('抗性成长','+'+ms.gRes)+row(`${ms.mk==='dex'?'敏捷':'力量'}加成伤害`,'+'+ms.mainP+'%')+row('技能成长伤害','+'+ms.skP+'%')+row('攻击目标数',ms.ntg)}
function renderMercPage(){mercNorm();const P=$('#panel');const m=S.merc;let h='<div class="mercpg">';
 if(mercUp()){const ms=mercStats(),T=MERCS[m.t],V=mercVarDef(m.t,m.v),need0=mercXpNeed(m.lvl),need1=mercXpNeed(m.lvl+1);const pct=m.lvl>=S.lvl?100:Math.max(0,Math.min(100,(m.xp-need0)/Math.max(1,need1-need0)*100));
  h+=`<div class="gp mhead">${mercPortrait(m.t,m.v,1)}<div class="minfo"><div class="mname">${m.nm}${m.dead?' <span class="bad">阵亡</span>':''}</div><div class="dim">${T.n} · ${T.kind}</div><div class="mver"><b class="diff d${m.hd}">${DIFFS[m.hd].n}</b> ${V.n}</div>
   <div class="mlv">Lv.<b>${m.lvl}</b> <small class="dim">（与角色等级同步）</small></div></div></div>`;
  h+=`<div class="gp"><h3>装备</h3><div class="mdoll">${MERC_SLOTS.map(k=>{const it=m.eq[k];return`<div class="mslot ms_${k} ${k==='shield'&&!MERC_SHIELD[m.t]?'lock':''}" onclick="mercSlotUI('${k}')"><small>${SLOTN[k]}${k==='shield'&&!MERC_SHIELD[m.t]?'·不可用':''}${k==='weapon'?'·'+MERC_WCATS[m.t].map(c=>CATN?CATN[c]:c).join('/'):''}</small>${it?cell(it,''):`<div class="cell empty"><small>空</small></div>`}</div>`}).join('')}</div>
   ${Object.keys(ms.sets).length?`<div class="dim">套装：${Object.entries(ms.sets).map(([s,n])=>SETS[s].n+' '+n+'件').join('、')}</div>`:''}<div class="dim">点格子：从背包/仓库穿戴、卸下、对比属性。武器限制按原版：${T.n}只能使用${MERC_WCATS[m.t].map(c=>CATN[c]).join('/')}${MERC_SHIELD[m.t]?'，可持盾(双手武器时不可)':'，不能持盾'}。</div></div>`;
  h+=`<div class="gp"><h3>属性</h3><div class="mstats">${mercStatsHTML(ms)}</div></div>`;
  h+=`<div class="gp mbonus"><h3>装备加成 <small class="dim">（对比不穿装备）</small></h3><div class="mstats">${mercEqHTML(ms)}</div></div>`;
  h+=`<div class="gp mgrow"><h3>等级成长</h3><div class="mstats">${mercGrowHTML(ms)}</div><div class="dim">30 级后生命/防御/抗性随等级成长；伤害吃主属性（${ms.mk==='dex'?'敏捷':'力量'}超出初始值每 ${(MERC_MAIN[m.t]||[0,5])[1]} 点 +1%，同角色规则），技能等级超过 7 后每级 +${MERC_SKX}% 伤害；50 级起每 20 级多攻击 1 个目标；防御换算物理减伤 = 防御/(防御+120×等级)，上限 40%。</div></div>`;
  h+=`<div class="gp"><h3>技能与光环</h3>${V.sk.map(s=>`<div class="msk"><b>${s}</b> <span class="dim">Lv.${ms.skl}</span></div>`).join('')}${V.d?`<div class="dim">${V.d}</div>`:''}
   ${ms.auras.length?ms.auras.map(a=>`<div class="maura"><b>✺ ${AURAS[a.id].n}</b> Lv.${a.lv} <small class="dim">来源：${a.src}</small><div>${AURAS[a.id].t(a.e)}</div></div>`).join(''):'<div class="dim">无光环</div>'}
   <div class="dim">技能/光环等级 = 1 + 等级×0.22 + (等级-30)×0.15 + 装备「+所有技能」(${ms.allsk})；光环作用于角色、召唤物与佣兵。</div></div>`;
  h+=`<div class="gp"><div class="btns">${m.dead?`<button class="btn sm gold" onclick="mercRevive()">复活 ${fmt(reviveCost())}◈</button>`:''}<button class="btn sm ${m.auto?'on':''}" onclick="S.merc.auto^=1;render()">自动换装</button><button class="btn sm ${m.ar?'on':''}" onclick="S.merc.ar^=1;render()">自动复活</button><button class="btn sm bad" onclick="mercDismiss()">解雇</button></div>
   <div class="dim">复活费用（原版）：min(⌊等级²/2⌋×15, 50000) = ${fmt(reviveCost())}</div></div>`}
 else h+=`<div class="gp"><h3>佣兵</h3><div class="dim">${S.mercU?'当前没有佣兵，可在下方雇佣。':'完成第一章任务「堕落女猎手」后可获得佣兵。'}</div></div>`;
 if(S.mercU||mercUp()){h+=`<div class="gp"><h3>营地雇佣 <span class="dim">${DIFFS[S.diff].n}版本</span></h3><div class="dim">雇佣新佣兵会替换当前佣兵（装备退回背包）。等级按原版营地范围，且不超过角色等级。</div>`;
  const p=m&&m.off&&m.prev;if(p)h+=`<div class="mhire"><span>↺ 召回 <b>${p.nm}</b> ${MERCS[p.t].n}·${mercVarDef(p.t,p.v).n} Lv.${S.lvl}</span><button class="btn xs gold" onclick="mercRecall()">${fmt(mercHireCost(S.lvl))}◈</button></div>`;
  for(const t of mercAvail()){const T=MERCS[t],L=mercHireLv(t);h+=`<div class="mhire"><span>${T.ic} ${T.n} <span class="dim">Lv.${L} · ${ACTS[T.act].camp}</span></span><span class="btns">${Object.entries(mercVars(t,S.diff)).map(([v,V])=>`<button class="btn xs" onclick="hireMerc('${t}','${v}')">${V.n} ${fmt(mercHireCost(L))}◈</button>`).join('')}</span></div>`}h+='</div>'}
 P.innerHTML=h+'</div>'}
function mercCands(k){const out=[];const add=(it,src)=>{if(!it||it.k)return;const b=BASEM[it.b];if(b&&b.s===mslotBase(k)&&(mercFits(it,k,S.merc.t)||(k==='shield'&&MERC_SHIELD[S.merc.t]&&b.cat==='shield')))out.push({it,src})};
 for(const it of S.bag)add(it,'背包');if(S.pst)S.pst.forEach((pg,i)=>pg.forEach(it=>add(it,'仓库'+(i+1))));if(typeof ACCT!=='undefined'&&ACCT&&ACCT.shared)ACCT.shared.forEach((pg,i)=>pg.forEach(it=>add(it,'共享'+(i+1))));for(const it of S.stash||[])add(it,'仓库');return out.sort((a,b)=>power(b.it)-power(a.it))}
function mercDelta(k,it){const a=mercStats(),eq=Object.assign({},S.merc.eq);if(it)eq[k]=it;else delete eq[k];const b=mercStats(eq);
 const f=(n,x,y,u='')=>{const d=Math.round(y-x);return d?`<span class="${d>0?'g':'bad'}">${n}${d>0?'+':''}${d}${u}</span>`:''};
 return[f('生命',a.life,b.life),f('防御',a.def,b.def),f('伤害',(a.dmg[0]+a.dmg[1])/2,(b.dmg[0]+b.dmg[1])/2),f('偷取',a.ll,b.ll,'%'),f('格挡',a.block,b.block,'%'),f('技能',a.allsk,b.allsk),f('火抗',a.res.fire,b.res.fire),f('冰抗',a.res.cold,b.res.cold),f('电抗',a.res.light,b.res.light),f('毒抗',a.res.pois,b.res.pois),
  b.auras.length!==a.auras.length||b.auras.some(x=>!a.auras.find(y=>y.id===x.id))?`<span class="g">光环:${b.auras.map(x=>AURAS[x.id].n).join('/')||'无'}</span>`:''].filter(Boolean).join(' ')||'<span class="dim">无变化</span>'}
function mercSlotUI(k){if(!mercUp())return;MX.slot=k;const cur=S.merc.eq[k],cs=mercCands(k);
 const desc=it=>`${it.rw!=null?`<div class="g">符文之语「${RUNEWORDS[it.rw].n}」${RW_AURA[RUNEWORDS[it.rw].n]?' · 光环 '+AURAS[RW_AURA[RUNEWORDS[it.rw].n][0]].n:''}</div>`:''}<div class="dim small">${modsTxt(allMods(it))}</div>`;
 modal(`<div class="mtitle">佣兵 · ${SLOTN[k]}</div><div class="gp mslotm">${cur?`<div class="mcur">${cell(cur,`showItem(${cur.uid})`)}<div><b style="color:${itemColor(cur)}">${itemName(cur)}</b>${desc(cur)}<div>${mercDelta(k,null)}</div><button class="btn sm" onclick="mercUnequip('${k}')">卸下到背包</button> <button class="btn sm ${cur.lk?'gold':''}" onclick="toggleLock&&toggleLock(${cur.uid})">${cur.lk?'🔓 解锁':'🔒 锁定'}</button></div></div>`:'<div class="dim">未装备</div>'}
 <h4>可用物品（${cs.length}）</h4>${cs.length?cs.map(({it,src})=>{const why=canMercEquip(it,k)?'':mercWhyNot(it,k);return`<div class="mcand">${cell(it,`showItem(${it.uid})`)}<div><b style="color:${itemColor(it)}">${itemName(it)}</b> <small class="dim">[${src}]</small>${desc(it)}<div>${mercDelta(k,it)}</div>${why?`<span class="bad">${why}</span>`:`<button class="btn sm gold" onclick="mercEquip(${it.uid},'${k}')">穿戴</button>`}</div></div>`}).join(''):'<div class="dim">背包和仓库中没有可用物品</div>'}
 <div class="btns c"><button class="btn" onclick="closeM()">关闭</button></div></div>`)}
const _mx_render=render;render=function(){if(typeof TAB==='undefined'||TAB!=='merc')return _mx_render();
 document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t==='merc'));$('#fightv').classList.add('hide');$('#panel').classList.remove('hide');renderMercPage()};
function mercAddTab(){if(typeof document==='undefined'||window.__NOUI)return;const nav=$('#tabs');if(!nav||nav.querySelector('[data-t="merc"]'))return;const b=document.createElement('button');b.dataset.t='merc';b.innerHTML='<i>⚜</i>佣兵';b.onclick=()=>{TAB='merc';render()};
 const ref=nav.querySelector('[data-t="bag"]');ref?ref.after(b):nav.appendChild(b)}
if(typeof document!=='undefined'&&document.addEventListener){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mercAddTab);else mercAddTab()}

// ---------- 格挡（原版公式：总格挡 = (盾牌基础格挡 + 装备格挡) × (敏捷 - 15) / (等级 × 2)，上限 75%） ----------
// 所有伤害来源（game.js 普攻 a.hp-=、acts.js hurtAlly、怪物技能/光环等）最终都是对佣兵对象 hp 的扣减：
// 在佣兵对象上把 hp 定义为访问器，扣血入口统一在 setter 中判定格挡（格挡则本次伤害归零），不依赖飘字。
function mercArmHp(a){let hp=a.hp;Object.defineProperty(a,'hp',{enumerable:true,configurable:true,get(){return hp},set(v){
 if(!MX.self&&v<hp&&hp>0){const ms=a.ms||mercStats(),bl=ms.block||0;if(bl>0&&rnd()*100<bl){MX.blocks=(MX.blocks||0)+1;a._blk=1;return}
  // 物理伤害减免（hurtAlly 标记元素；game.js 普攻按物理处理；直接置 0 视为强制阵亡不减免）
  if(v!==0&&(!MX.el||MX.el==='phys')){let loss=hp-v;loss=Math.max(1,loss-(ms.dr||0))*(1-(ms.pdr||0)/100)*(1-(ms.drp||0)/100);v=hp-loss}}hp=v}})}
if(typeof hurtAlly==='function'){const _mx_ha=hurtAlly;hurtAlly=function(a,v,el){if(!a||a.kind!=='merc')return _mx_ha(a,v,el);MX.el=el||'phys';try{return _mx_ha(a,v,el)}finally{MX.el=null}}}
// 飘字只做显示：被格挡的那一下改为显示「格挡」
{const _mx_fn=floatNum;floatNum=function(id,v,c){if(typeof id==='string'&&id[0]==='a'){const a=ALLY.find(x=>x.kind==='merc'&&'a'+x.uid===id);if(a&&a._blk){a._blk=0;return _mx_fn(id,'格挡','#ccc')}}return _mx_fn(id,v,c)}}
