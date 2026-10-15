'use strict';
// ===================================================================================
// legend.js — 传说装备扩充与职业对齐（加载于 classes2.js 之后）
// 1) 装备所属职业 itemCls：专属底材(ccls) > 职业技能词缀(sk_<id>) > 系别词缀(tc_<cls><t>/亡灵 t0sk..t2sk)；无职业特征的通用装备返回 null
// 2) 威能抽取按装备所属职业：只出该职业或通用(cls:'*')威能；通用装备按当前角色职业。旧存档里对不上的威能读档时按同规则重抽
// 3) 新增 8 个通用威能 + 5 个新职业各 4 个威能；5 个新职业专属底材各 1 件暗金（共 25 件）
// ===================================================================================
const LG_CLSN=c=>c==='*'?'通用':(CLS_DEF[c]&&CLS_DEF[c].n)||c;
function lgModCls(k){if(/^t[012]sk$/.test(k))return'nec';if(k.startsWith('tc_'))return k.slice(3).replace(/\d+$/,'');if(k.startsWith('sk_')){const s=SKM[k.slice(3)];return s?(s.cls||'nec'):null}return null}
function itemCls(it){if(!it||it.k)return null;const b=BASEM[it.b];if(b&&b.ccls)return b.ccls;for(const k in it.m||{}){const c=lgModCls(k);if(c)return c}return null}
const egLpOk=k=>EG_LP[k]&&(EG_LP[k].cls==='*'||EG_LP[k].cls===curCls());
function egLpName(k){const L=EG_LP[k];return L?L.n+'·'+LG_CLSN(L.cls||'nec'):k}
egLpRoll=function(it){const c=egLpCat(it),ic=itemCls(it)||curCls();let ks=Object.keys(EG_LP).filter(k=>EG_LP[k].c===c&&(EG_LP[k].cls==='*'||EG_LP[k].cls===ic));
 if(!ks.length)ks=Object.keys(EG_LP).filter(k=>EG_LP[k].c===c&&EG_LP[k].cls==='*');return pick(ks)};
// ---------- 新威能 ----------
Object.assign(EG_LP,{
 // 通用
 boss_bane:{c:'w',cls:'*',n:'屠魁之刃',d:'你与召唤物对首领、精英和暗金怪物的伤害 +30%'},
 crit_storm:{c:'w',cls:'*',n:'雷霆一击',d:'你造成的伤害有 12% 几率翻倍'},
 iron_skin:{c:'a',cls:'*',n:'磐石之躯',d:'受到的伤害 -12%'},
 beast_bond:{c:'a',cls:'*',n:'万灵共生',d:'召唤物与佣兵生命 +40%，伤害 +25%'},
 ward_all:{c:'a',cls:'*',n:'元素庇护',d:'全部抗性 +15%（不超过上限）'},
 gold_tide:{c:'j',cls:'*',n:'金潮',d:'金币掉落 +80%，获得魔法装备几率 +35%'},
 mana_font:{c:'j',cls:'*',n:'涌泉之心',d:'法力回复 +80%，最大法力 +20%'},
 sage_mind:{c:'j',cls:'*',n:'贤者之思',d:'获得的经验 +10%'},
 // 野蛮人
 leap_quake:{c:'w',cls:'bar',n:'撼地跃击',d:'跃击打击目标 +3，击晕时间 +1 秒'},
 frenzy_blood:{c:'w',cls:'bar',n:'狂乱血涌',d:'狂乱攻击目标 +1，攻速加成 +50%'},
 bo_titan:{c:'a',cls:'bar',n:'巨人号令',d:'战斗号令的生命加成 +50%，持续时间翻倍'},
 taunt_doom:{c:'j',cls:'bar',n:'末日挑衅',d:'挑衅与战斗吶喊的降防效果 +50%'},
 // 法师
 blizz_deep:{c:'w',cls:'sor',n:'永冬暴雪',d:'暴雪伤害 +40%，减速 +2 秒'},
 hydra_brood:{c:'w',cls:'sor',n:'炎蛇之巢',d:'九首炎蛇每次多喷 2 发火球'},
 es_aegis:{c:'a',cls:'sor',n:'奥能壁垒',d:'奥能护盾转由法力承担的比例 +15%（上限 95%）'},
 static_rift:{c:'j',cls:'sor',n:'静电裂隙',d:'静电场削减生命比例 +10%'},
 // 德鲁伊
 fissure_rage:{c:'w',cls:'dru',n:'地心怒火',d:'大地裂隙目标 +4，灼烧伤害 +50%'},
 volc_twin:{c:'w',cls:'dru',n:'双生火山',d:'火山每次多喷 2 块熔岩'},
 bear_hide:{c:'a',cls:'dru',n:'熊皮厚甲',d:'熊人化的生命与防御加成 +50%'},
 raven_swarm:{c:'j',cls:'dru',n:'鸦群蔽日',d:'渡鸦数量上限 +3，存在时间翻倍'},
 // 荒野射手
 strafe_gale:{c:'w',cls:'ama',n:'疾风骤雨',d:'疾风连射箭矢 +3'},
 plague_cloud:{c:'w',cls:'ama',n:'疫云',d:'疫病之矛毒素伤害 +60%，传染目标 +3'},
 decoy_twin:{c:'a',cls:'ama',n:'双影',d:'幻影替身数量 +1，生命 +50%'},
 keen_mark:{c:'j',cls:'ama',n:'鹰隼印记',d:'猎眼印记的降防效果 +50%'},
 // 圣誓骑士
 fist_storm:{c:'w',cls:'pal',n:'天罚风暴',d:'天罚雷拳溅射目标 +4，伤害 +30%'},
 veng_tri:{c:'w',cls:'pal',n:'三誓同辉',d:'誓仇之刃攻击目标 +2'},
 vigor_oath:{c:'a',cls:'pal',n:'奋进誓约',d:'奋进光环的生命加成 +50%'},
 smite_judg:{c:'j',cls:'pal',n:'审判之击',d:'惩戒盾击伤害 +50%，击晕时间 +1 秒'}});
{const f=SV;SV=function(id,L){const v=f(id,L);if(!v||!SKM[id]||!SKM[id].cls)return v;const mul=(k,x)=>{if(Array.isArray(v[k]))v[k]=v[k].map(y=>Math.round(y*x));else if(typeof v[k]==='number')v[k]=Math.round(v[k]*x)};
 const P=(k,t)=>{if(!egLp(k))return 0;v.txt+='（'+EG_LP[k].n+(t?' '+t:'')+'）';return 1};
 switch(id){
  case'bleap':if(P('leap_quake')){v.n+=3;v.stun=(v.stun||0)+1}break;
  case'bfrz':if(P('frenzy_blood')){v.n+=1;mul('fz',1.5)}break;
  case'bbo':if(P('bo_titan')){mul('life',1.5);v.dur*=2}break;
  case'btaunt':case'bbcry':if(P('taunt_doom'))v.dd=Math.min(90,Math.round(v.dd*1.5));break;
  case'mbliz':if(P('blizz_deep')){mul('dmg',1.4);v.slow=(v.slow||0)+2}break;
  case'mhyd':if(P('hydra_brood','+2'))v.n+=2;break;
  case'mesh':if(P('es_aegis'))v.es=Math.min(95,v.es+15);break;
  case'mstatic':if(P('static_rift'))v.pct+=10;break;
  case'dfis':if(P('fissure_rage')){v.n+=4;mul('dps',1.5)}break;
  case'dvol':if(P('volc_twin','+2'))v.n+=2;break;
  case'dbear':if(P('bear_hide')){mul('life',1.5);mul('def',1.5)}break;
  case'drav':if(P('raven_swarm')){v.n+=3;v.dur*=2}break;
  case'astraf':if(P('strafe_gale','+3'))v.n+=3;break;
  case'aplag':if(P('plague_cloud')){mul('pd',1.6);v.pn+=3}break;
  case'adecoy':if(P('decoy_twin')){v.n+=1;mul('hp',1.5)}break;
  case'asight':if(P('keen_mark'))v.dd=Math.min(90,Math.round(v.dd*1.5));break;
  case'pfist':if(P('fist_storm')){v.n+=4;mul('dmg',1.3)}break;
  case'pveng':if(P('veng_tri','+2'))v.n+=2;break;
  case'pvigor':if(P('vigor_oath'))mul('life',1.5);break;
  case'psmite':if(P('smite_judg')){v.pct=Math.round((100+v.pct)*1.5-100);v.stun=(v.stun||0)+1}break}
 return v}}
// 通用威能：属性 / 经验 / 伤害 / 减伤
egOn('calc',o=>{if(egLp('beast_bond')){o.sumlife+=40;o.sumdmg+=25}if(egLp('ward_all'))for(const k in o.res)o.res[k]=Math.min(75,o.res[k]+15);
 if(egLp('gold_tide')){o.gf+=80;o.mf+=35}if(egLp('mana_font')){o.mregen+=80;o.mana=Math.round(o.mana*1.2)}});
egOn('xp',x=>egLp('sage_mind')?x*1.1:x);
{const f=hitMon;hitMon=function(m,d,src,fxc){if(m&&m.hp>0&&(src==='hero'||(src&&src.kind))){let k=1;if(egLp('boss_bane')&&(m.boss||m.fl))k*=1.3;if(src==='hero'&&egLp('crit_storm')&&rnd()<0.12)k*=2;
 if(k!==1){const d2={};for(const x in d)d2[x]=d[x]*k;d=d2}}return f(m,d,src,fxc)}}
{const f=step;step=function(dt){const h0=H.life;const r=f(dt);if(ST&&H.life>0&&H.life<h0&&egLp('iron_skin'))H.life=Math.min(ST.life,H.life+(h0-H.life)*0.12);return r}}
// ---------- 旧存档：对不上的威能按装备所属职业重抽 ----------
function lgFixItem(it){if(!it||!it.lp)return 0;const L=EG_LP[it.lp],c=itemCls(it);if(L&&(L.cls==='*'||!c||L.cls===c))return 0;it.lp=egLpRoll(it);return 1}
function lgFixAll(){let n=0;const each=a=>{for(const it of a||[])n+=lgFixItem(it)};each(S.bag);each(Object.values(S.eq||{}));for(const p of S.pst||[])each(p);
 if(typeof ACCT!=='undefined'&&ACCT&&ACCT.shared){let m=0;for(const p of ACCT.shared)for(const it of p||[])m+=lgFixItem(it);if(m&&typeof acctSave==='function')acctSave();n+=m}return n}
if(typeof migrateChar==='function'){const f=migrateChar;migrateChar=function(c){const r=f(c);try{if(lgFixAll()&&typeof log==='function')log('已修正与装备职业不符的传说威能')}catch(e){}return r}}
// ---------- 职业暗金：每件专属底材 1 件 ----------
UNIQUES.push(
 // 野蛮人·专属头盔
 {n:'裂颅者之誓',b:'bh1',lv:5,rq:3,m:{tc_bar0:1,str:10,life:15,edef:[40,60],ll:3}},
 {n:'狼王咆哮',b:'bh2',lv:15,rq:12,m:{tc_bar2:2,sk_bhowl:2,vit:10,allres:10,edef:[60,90]}},
 {n:'巨角怒魂',b:'bh3',lv:28,rq:24,m:{tc_bar0:2,sk_bww:2,ias:20,ar:120,edef:[80,120]}},
 {n:'屠场面具',b:'bh4',lv:44,rq:40,m:{tc_bar1:2,sk_bmast:3,ll:6,cb:20,str:20,edef:[100,140]}},
 {n:'苍狼王之冠',b:'bh5',lv:66,rq:62,m:{allsk:2,tc_bar2:3,sk_bbo:3,lifepct:15,allres:20,edef:[150,200]}},
 // 法师·法球
 {n:'星火之眼',b:'orb1',lv:5,rq:3,m:{tc_sor0:1,sk_mfb:2,mana:20,fcr:10}},
 {n:'霜心晶球',b:'orb2',lv:15,rq:12,m:{tc_sor1:2,sk_mfa:2,sk_mice:2,cres:30,ene:15}},
 {n:'焚天之瞳',b:'orb3',lv:26,rq:22,m:{tc_sor0:2,sk_mfball:2,sk_mmet:1,fcr:20,fres:25}},
 {n:'雷鸣星辰',b:'orb4',lv:40,rq:36,m:{tc_sor2:3,sk_mcl:2,lres:30,mregen:30,manapct:15}},
 {n:'天穹之心',b:'orb5',lv:65,rq:60,m:{allsk:2,tc_sor1:3,sk_morb:2,fcr:30,allres:15,lifepct:10}},
 // 德鲁伊·毛皮头饰
 {n:'野径兜帽',b:'dp1',lv:5,rq:3,m:{tc_dru2:1,sk_drav:2,life:15,edef:[40,60]}},
 {n:'风语羽冠',b:'dp2',lv:15,rq:12,m:{tc_dru0:2,sk_dfs:2,fcr:15,mana:25,edef:[60,90]}},
 {n:'雄鹿之魂',b:'dp3',lv:28,rq:24,m:{tc_dru2:2,sk_dswolf:2,sk_ddire:1,sumdmg:25,sumlife:25,edef:[80,120]}},
 {n:'熊王遗皮',b:'dp4',lv:44,rq:40,m:{tc_dru1:3,sk_dbear:2,sk_dmaul:2,lifepct:15,dr:10,edef:[100,140]}},
 {n:'万林之冠',b:'dp5',lv:66,rq:62,m:{allsk:2,tc_dru0:3,sk_dfis:2,sk_darm:1,fcr:25,allres:20,edef:[150,200]}},
 // 荒野射手·专属弓/标枪
 {n:'晨猎之弦',b:'aw1',lv:5,rq:3,m:{tc_ama0:1,sk_amul:2,edmg:[80,110],dex:8,ias:20}},
 {n:'少女之誓',b:'aw2',lv:15,rq:12,m:{tc_ama1:2,sk_ajab:2,sk_apow:1,edmg:[100,140],lightmax:15,ll:4}},
 {n:'灰林幽语',b:'aw3',lv:28,rq:24,m:{tc_ama0:2,sk_aguide:2,sk_aexp:1,edmg:[120,160],ar:150,ias:20}},
 {n:'祭雷之枪',b:'aw4',lv:44,rq:40,m:{tc_ama1:3,sk_achg:2,sk_albolt:2,edmg:[150,200],lightmax:40,lres:25}},
 {n:'母神之怒',b:'aw5',lv:66,rq:62,m:{allsk:2,tc_ama0:3,sk_astraf:2,edmg:[200,260],ias:30,ds:20}},
 // 圣誓骑士·圣徽盾
 {n:'初誓圆盾',b:'ps1',lv:5,rq:3,m:{tc_pal0:1,sk_psmite:2,block:10,life:15,edef:[40,60]}},
 {n:'圣誓纹章',b:'ps2',lv:15,rq:12,m:{tc_pal2:2,sk_ppray:2,allres:15,regen:4,edef:[60,90]}},
 {n:'晨曦守望',b:'ps3',lv:28,rq:24,m:{tc_pal1:2,sk_pmight:2,sk_phfire:2,fres:30,block:15,edef:[80,120]}},
 {n:'天使之翼',b:'ps4',lv:44,rq:40,m:{tc_pal0:3,sk_pzeal:2,ias:20,allres:20,edef:[100,140]}},
 {n:'圣王冠盾',b:'ps5',lv:66,rq:62,m:{allsk:2,tc_pal1:3,sk_pfana:2,block:20,allres:25,edef:[150,200]}});
