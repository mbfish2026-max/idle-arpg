'use strict';
// ===================================================================================
// classes2.js — 职业相关的后置包装（需在 shop.js / eg_power.js / lock.js 之后加载）：
// 1) 商人只卖通用 + 本职业专属底材；赌博约 12% 几率出其他职业专属底材
// 2) 战力评估按职业（他职业技能词缀不计分，本职业 tc_ 系别词缀计分）
// 3) 传说威能按职业：掉落只出本职业(或通用)威能；新增野蛮人/法师威能
// ===================================================================================
const CLS_GAM_OTHER=0.12;let CLS_CTX=null;
const clsBaseOk=b=>!b||!b.ccls||b.ccls===curCls();
{const f=pickBase;pickBase=function(ilvl,slot){if(!CLS_CTX)return f(ilvl,slot);
 if(CLS_CTX==='gam'&&rnd()<CLS_GAM_OTHER){const lv=Math.ceil(Math.max(1,ilvl)/3)*3;const o=BASES.filter(b=>b.ccls&&b.ccls!==curCls()&&b.q<=lv&&(!slot||b.s===slot));if(o.length)return pick(o)}
 const lv=Math.ceil(Math.max(1,ilvl)/3)*3;const c=BASES.filter(b=>b.q<=lv&&(!slot||b.s===slot)&&clsBaseOk(b));return c.length?pick(c):f(ilvl,slot)}}
if(typeof ensureShop==='function'){const f=ensureShop;ensureShop=function(...a){const i0=S.shop&&S.shop.items,cx=CLS_CTX;let r;CLS_CTX='buy';try{r=f.apply(this,a)}finally{CLS_CTX=cx}
 const sh=S.shop;if(sh&&(sh.items!==i0||sh.cls!==curCls())){
  if(sh.cls&&sh.cls!==curCls()&&sh.items===i0){CLS_CTX='buy';try{r=f(true)}finally{CLS_CTX=cx}}
  sh.cls=curCls();CLS_CTX='gam';try{for(const g of sh.gam||[])if(g.slot!=='ring'&&g.slot!=='amulet')g.b=pickBase(S.lvl,g.slot).id}finally{CLS_CTX=cx}}
 return r}}
if(typeof gamble==='function'){const f=gamble;gamble=function(...a){CLS_CTX='gam';try{return f.apply(this,a)}finally{CLS_CTX=null}}}
// 战力：他职业专属的技能词缀不计分；本职业系别词缀按 60/点计分
{const f=power;power=function(it){let p=f(it);if(!it||it.k||!it.m||!S)return p;const c=curCls(),m=typeof allMods==='function'?allMods(it):it.m;
 for(const k in m){const v=m[k];if(typeof v!=='number')continue;
  if(/^t[012]sk$/.test(k)&&c!=='nec')p-=60*v;
  else if(k.startsWith('sk_')){const s=SKM[k.slice(3)];if(s&&(s.cls||'nec')!==c)p-=45*v}
  else if(k.startsWith('tc_'))p+=k.startsWith('tc_'+c)?60*v:0}
 return Infinity===p?p:Math.max(1,Math.round(p))}}
// ---------- 传说威能 ----------
if(typeof EG_LP!=='undefined'){
 for(const k in EG_LP)if(!EG_LP[k].cls)EG_LP[k].cls=k==='soul_feast'?'*':'nec';
 Object.assign(EG_LP,{
  ww_tempest:{c:'w',cls:'bar',n:'裂风旋刃',d:'旋风斩伤害 +50%'},
  bash_quake:{c:'w',cls:'bar',n:'震地猛击',d:'猛击有 30% 几率震晕目标 1.5 秒（首领免疫）'},
  shout_iron:{c:'a',cls:'bar',n:'钢铁战吼',d:'战斗怒吼持续时间 +100%，防御加成 +50%'},
  howl_blood:{c:'j',cls:'bar',n:'血怒战嚎',d:'震慑战嚎命中的每个敌人为你回复 2% 生命'},
  met_twin:{c:'w',cls:'sor',n:'双星坠落',d:'陨石术有 35% 几率再坠落一次（不耗法力）'},
  fb_split:{c:'w',cls:'sor',n:'分裂火焰',d:'火焰弹额外分裂 2 枚，对其他敌人造成 50% 伤害'},
  ice_shell:{c:'a',cls:'sor',n:'冰晶外壳',d:'寒冰护甲期间受到的伤害 -20%'},
  cl_fork:{c:'j',cls:'sor',n:'叉形闪电',d:'连锁闪电弹跳目标 +3，伤害 +20%'},
  pack_alpha:{c:'w',cls:'dru',n:'头狼之魂',d:'灵狼与恐狼数量上限 +2'},
  fury_storm:{c:'w',cls:'dru',n:'狂风利爪',d:'狂怒连击攻击目标 +2'},
  oak_bloom:{c:'a',cls:'dru',n:'古橡新芽',d:'橡木之灵的生命加成 +50%，并每秒回复 1% 生命'},
  arm_rain:{c:'j',cls:'dru',n:'陨火如雨',d:'陨火天降每次多落 2 颗陨火'},
  ms_rain:{c:'w',cls:'ama',n:'万箭齐发',d:'连珠箭箭矢数量 +3'},
  fury_chain:{c:'w',cls:'ama',n:'怒雷连环',d:'雷霆怒涛闪电 +4 道，闪电伤害 +20%'},
  valk_oath:{c:'a',cls:'ama',n:'英灵之誓',d:'英灵战姬生命 +50%，攻击伤害 +30%'},
  echo_arrow:{c:'j',cls:'ama',n:'回响之矢',d:'寻踪矢命中后 30% 几率再射出一箭（不耗法力）'}});
 const lpOk=k=>EG_LP[k]&&(EG_LP[k].cls==='*'||EG_LP[k].cls===curCls());
 egLpRoll=function(it){const c=egLpCat(it);const ks=Object.keys(EG_LP).filter(k=>EG_LP[k].c===c&&lpOk(k));return pick(ks)};
 // 威能只在对应职业生效：重算生效集合时去掉他职业威能
 {const f=egLpRefresh;egLpRefresh=function(){f();for(const k of [...EG_LPS])if(!lpOk(k))EG_LPS.delete(k)}}
 {const f=SV;SV=function(id,L){const v=f(id,L);if(!v)return v;
  if(id==='bww'&&egLp('ww_tempest')){v.pct=Math.round((100+v.pct)*1.5-100);v.txt+='（裂风旋刃 +50%）'}
  if(id==='bshout'&&egLp('shout_iron')){v.dur*=2;v.def=Math.round(v.def*1.5);v.txt+='（钢铁战吼）'}
  if(id==='mcl'&&egLp('cl_fork')){v.n+=3;v.dmg=v.dmg.map(x=>Math.round(x*1.2));v.txt+='（叉形闪电）'}
  if((id==='dswolf'||id==='ddire')&&egLp('pack_alpha')){v.n+=2;v.txt+='（头狼之魂 +2）'}
  if(id==='dfury'&&egLp('fury_storm')){v.n+=2;v.txt+='（狂风利爪 +2 个目标）'}
  if(id==='doak'&&egLp('oak_bloom')){v.aura={life:Math.round(v.aura.life*1.5)};v.heal=1;v.txt+='（古橡新芽）'}
  if(id==='darm'&&egLp('arm_rain')){v.n+=2;v.txt+='（陨火如雨 +2）'}
  if(id==='amul'&&egLp('ms_rain')){v.n+=3;v.txt+='（万箭齐发 +3）'}
  if(id==='afury'&&egLp('fury_chain')){v.cn+=4;v.cd=v.cd.map(x=>Math.round(x*1.2));v.txt+='（怒雷连环）'}
  if(id==='avalk'&&egLp('valk_oath')){v.hp=Math.round(v.hp*1.5);v.dmg=v.dmg.map(x=>Math.round(x*1.3));v.txt+='（英灵之誓）'}
  return v}}
 // 技能引擎施放后钩子（classes.js clsCast 调用）：职业传说威能
 {const f=typeof clsAfterCast==='function'?clsAfterCast:null;window.clsAfterCast=function(s,v,ms,L){if(f)f(s,v,ms,L);const tg=L[0];
  if(s.id==='bbash'&&egLp('bash_quake')&&tg&&!tg.boss&&tg.hp>0&&rnd()<0.3)tg.stun=Math.max(tg.stun||0,1.5);
  if(s.id==='bhowl'&&egLp('howl_blood'))H.life=Math.min(ST.life,H.life+ST.life*0.02*ms.length);
  if(s.id==='mmet'&&egLp('met_twin')&&rnd()<0.35){const l=liveMon();if(l.length)CLS_TY.aoe(s,v,l,l[0])}
  if(s.id==='aguide'&&egLp('echo_arrow')&&tg&&rnd()<0.3){const l=liveMon();if(l.length)CLS_TY.arw(s,v,l,l.includes(tg)?tg:l[0])}
  if(s.id==='mfb'&&egLp('fb_split'))for(const m of ms.filter(x=>x!==tg&&x.hp>0).slice(0,2))clsHit(m,'fire',clsRR(v.dmg)*0.5)}}
 {const f=step;step=function(dt){const h0=H.life;const r=f(dt);if(curCls()==='sor'&&egLp('ice_shell')&&buffOn('mfa')&&H.life<h0&&H.life>0)H.life=Math.min(ST.life,H.life+(h0-H.life)*0.2);return r}}
}

// 职业技能音效：每个新技能有独立音效 id（技能定义 sfx 字段，形如 sfx_<id>）。音乐 bot 往 AUDIO_SK.table 里加 sfx_<id> 配方即生效；没有配方时静默
// 独立音效 id 尚无配方时回退到同元素/同类旧技能音效（否则 25 个新技能施放时完全无声）
if(window.AUDIO_SK&&AUDIO_SK.table){const T=AUDIO_SK.table,FB={fire:'mfb',cold:'mnova',light:'mcl',magic:'mcl',phys:'bbash',pois:'bbash',buff:'mfa',cbuff:'bshout',warcry:'bhowl',melee:'bbash',csum:'rs'};
 for(const s of CLS_SKILLS)if(!T[s.id]&&s.sfx!==s.id)T[s.id]=(D,t)=>{const f=T[s.sfx]||T[FB[s.el]]||T[FB[s.kind]]||T[s.cls==='bar'?'bbash':'mfb'];if(f)f(D,t)}}
