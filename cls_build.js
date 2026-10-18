'use strict';
// ===================================================================================
// cls_build.js — 其余 5 职业流派（野蛮人/法师/德鲁伊/荒野射手/圣誓骑士，各 3 个），沿用 nec_build.js 的框架与规则：
//  软流派（推荐加点 + 自动施法顺序 + 属性比例 + 约 10% 被动），首次免费、之后消耗技能重置药水；每个流派 6 件套（2/4/6 件）+ 2 件流派暗金（另列可复用的现有职业暗金）；
//  只在地狱 / 秘境掉落，秘晶兑换同亡灵。6 件机制（分裂/回响/爆裂/骸爆）不触发技能次数、不连锁尸潮冥爆/星火连爆等击杀爆炸。
// 词缀只用现有键（tc_/sk_/allsk/fcr/ias/edmg/ll/sumdmg…）+ 通用新键 skd_<技能>（该技能伤害 +%）/ nb_boss / nb_m_* / nb_e_*；
//  注意：野蛮人旋风斩(mall)、法术按施法速度出手 → 配 fcr；单体近战/弓/标枪(hit/mhit/arw)按攻速 → 配 ias。
// 加载于 nec_build.js 之后。设计稿：/workspace/design/class_builds.md
// ===================================================================================
// ---------- 通用词缀文字 ----------
for(const s of SKILLS){if(!MODT['skd_'+s.id])MODT['skd_'+s.id]=s.n+' 伤害 +{v}%';
 MODT['nb_m_split_'+s.id]=`【分裂】${s.n}命中后分裂，再打 2 个敌人，伤害 50%{v}`;MODT['nb_m_echo_'+s.id]=`【回响】${s.n}施放后 30% 几率立即免费再施放一次，伤害 60%{v}`;
 MODT['nb_m_burst_'+s.id]=`【爆裂】被${s.n}击杀的敌人爆裂：对 3 个敌人造成 40% 的${s.n}伤害（每秒最多 3 次，首领不触发）{v}`;
 MODT['nb_e_dbl_'+s.id]=s.n+' {v}% 几率造成双倍伤害';MODT['nb_e_cheap_'+s.id]=s.n+' 法力消耗 -{v}%'}
Object.assign(MODT,{nb_e_exec:'对生命低于 30% 的敌人伤害 +{v}%',nb_e_open:'对满血敌人伤害 +{v}%',nb_e_leech:'击杀回复 {v}% 生命与法力',nb_e_dr:'受到伤害 -{v}%'});
{const f=modsTxt;modsTxt=function(m){const o={},fl=[];for(const k in m){if(/^nb_m_/.test(k)){fl.push(MODT[k].replace('{v}',''));continue}o[k]=m[k]}const t=f(o);return fl.length?(t?t+'，':'')+fl.join('，'):t}}
// ---------- 部件模板（4 条属性）：W 主武器/副手，H 头，A 甲，G 手，B 腰，F 鞋 ----------
const CB_TPL={
 caster:{W:(c)=>({['sk_'+c.core]:3,[c.tc]:2,fcr:25,[c.st]:20}),H:()=>({allsk:1,fcr:10,life:60,allres:20}),A:()=>({edef:150,life:80,allres:15,dr:6}),
  G:(c)=>({['sk_'+c.sec]:2,fcr:20,[c.st]:15,mpk:4}),B:()=>({manapct:15,mregen:30,life:40,allres:15}),F:()=>({edef:80,fhr:20,allres:20,mpk:3})},
 spin:{W:(c)=>({['sk_'+c.core]:2,[c.tc]:2,edmg:[200,240],fcr:20}),H:()=>({allsk:1,life:60,ll:5,allres:20}),A:()=>({edef:150,life:80,allres:15,dr:6}),
  G:(c)=>({['sk_'+c.sec]:2,fcr:20,[c.st]:15,ll:4}),B:()=>({life:60,str:15,allres:15,dr:5}),F:()=>({edef:80,fhr:20,allres:20,fcr:10})},
 melee:{W:(c)=>({['sk_'+c.core]:2,[c.tc]:2,edmg:[200,240],ias:20}),H:()=>({allsk:1,life:60,ll:5,allres:20}),A:()=>({edef:150,life:80,allres:15,dr:6}),
  G:(c)=>({['sk_'+c.sec]:2,ias:20,[c.st]:15,ll:4}),B:()=>({life:60,[ 'str']:15,allres:15,dr:5}),F:()=>({edef:80,fhr:20,allres:20,ias:10})},
 summon:{W:(c)=>({['sk_'+c.core]:2,[c.tc]:2,sumdmg:15,fcr:20}),H:()=>({allsk:1,life:60,sumlife:15,allres:20}),A:()=>({edef:150,vit:20,sumlife:20,dr:5}),
  G:(c)=>({['sk_'+c.sec]:1,sumdmg:10,fcr:10,pres:30}),B:()=>({life:40,mregen:20,sumlife:15,fhr:20}),F:()=>({edef:80,ene:15,allres:15,mpk:3})}};
// 职业部位 → 底材
const CB_SLOTS={bar:{W:'swde2',H:'bh5'},sor:{W:'orb5',H:'hlme3'},dru:{W:'stfe3',H:'dp5'},ama:{W:'bowe4',H:'hlme3'},pal:{W:'swde2',H:'ps5'}};
const CB_REST={A:'arme2',G:'glve2',B:'blte2',F:'bote3'};
// ---------- 15 个流派 ----------
// k 流派键；core/sec 核心/副技能；t 核心所在系；st 主属性；role 模板；mech 6 件机制；pm 被动；names 6 件名（W,H,A,G,B,F）；u 两件流派暗金 [名,底材,等级,属性]；reuse 可复用的现有暗金
const CB_SPECS=[
 // ---- 野蛮人 ----
 {cls:'bar',k:'bar_ww',b2:50,b6:200,n:'旋风狂徒',ic:'🌀',d:'持刃狂旋，一路绞碎敌群',core:'bww',sec:'bbash',t:0,st:'str',role:'spin',mech:'echo',pm:{skd_bww:10},pas:'旋风斩伤害 +10%',set:'风暴绞刃',
  names:['绞刃·狂旋剑','绞刃·狼首盔','绞刃·旋甲','绞刃·握柄','绞刃·束腰','绞刃·疾步靴'],
  order:['bbash','bshout','bmast','bbash','bmast','bww','bww','bww','bww','bww','bbo','bww','bww','bww'],fill:()=>bl('bww')<20?['bww','bbo','bmast']:['bbash','bmast','bbo','bnres','biron','bbcmd','bfury','bstam'],
  ac:['bbo','bbcmd','bshout','bww','bbash'],w:'swde2',
  u:[['狂旋之戒','rin',72,{tc_bar0:1,fcr:10,ll:5,str:10,nb_e_dbl_bww:15}],['风暴之心','amu',75,{allsk:1,life:60,allres:20,str:15,nb_e_dr:8}]],reuse:['巨角怒魂','苍狼王之冠']},
 {cls:'bar',k:'bar_bers',lite:1,noedmg:1,slow:0.01,b2:0,b4:0,b6:150,n:'狂暴斩魂',ic:'💢',d:'魔力灌注的狂暴一击，无视物理免疫',core:'bbers',sec:'bconc',t:0,st:'str',role:'melee',mech:'echo',pm:{skd_bbers:10,nb_e_cheap_bbers:40},pas:'狂暴伤害 +10%，狂暴法力消耗 -40%',set:'怒魂誓约',
  names:['怒魂·斩铁','怒魂·獠盔','怒魂·血甲','怒魂·铁拳','怒魂·腰环','怒魂·踏靴'],
  order:['bbash','bshout','bbash','bstun','bbash','bconc','bconc','bconc','bbers','bbers','bbers','bbers'],fill:()=>bl('bbers')<20?['bbers','bconc','bbash']:['bconc','bbo','bmast','bnres','biron','bfury','bcrit'],
  ac:['bbo','bbcmd','bshout','bbers','bconc','bbash'],w:'axee5',
  u:[['斩魂指环','rin',72,{ias:10,str:10,life:40,nb_e_exec:15}],['怒魂吊坠','amu',75,{life:60,allres:20,str:10,nb_e_leech:2}]],reuse:['屠场面具']},
 {cls:'bar',k:'bar_cry',lite:1,slow:0.01,b2:10,b4:20,b6:30,n:'战吼领主',ic:'📣',d:'一声怒吼震碎敌阵',core:'bwcry',sec:'bbcry',t:2,st:'str',role:'caster',mech:'echo',pm:{skd_bwcry:10},pas:'战争怒吼伤害 +10%',set:'雷鸣战号',
  names:['战号·号角剑','战号·狼王盔','战号·鼓甲','战号·护手','战号·皮带','战号·战靴'],
  order:['bbash','bshout','bhowl','btaunt','bshout','bbcry','bbo','bbcry','bwcry','bwcry','bwcry','bwcry'],fill:()=>bl('bwcry')<20?['bwcry','bbcry','bshout']:['bbo','bbcmd','bbcry','bgrim','bnres','biron'],
  ac:['bbo','bbcmd','bshout','bbcry','bwcry','bbash'],w:'swde2',
  u:[['怒吼之戒','rin',72,{tc_bar2:1,life:40,str:10,nb_e_exec:20}],['战号徽记','amu',75,{allsk:1,life:60,allres:20,nb_e_dr:8}]],reuse:['狼王咆哮','苍狼王之冠']},
 // ---- 法师 ----
 {cls:'sor',k:'sor_fire',heavy:3,b2:60,b6:250,x4:{fcr:20},n:'焚天术士',ic:'🔥',d:'爆炎与陨石覆盖整片战场',core:'mfball',sec:'mmet',t:0,st:'ene',role:'caster',mech:'burst',pm:{skd_mfball:10},pas:'爆炎球伤害 +10%',set:'焚天之仪',
  names:['焚天·炎珠','焚天·焰冠','焚天·灰袍','焚天·燃指','焚天·炎带','焚天·焦靴'],
  order:['mfb','mfa','mfb','mwarm','minf','mfb','mfb','mblaze','mfball','mfball','mmet','mfball','mfball','mmet','mfball','mfball'],fill:()=>bl('mfball')<20?['mfball','mmet']:bl('mmet')<20?['mmet','mfm']:['mfm','mbliz','mglac','menc','mshiv','mchill'],
  ac:['mchill','mshiv','mfa','menc','mfball','mmet','mbliz','mfb'],
  u:[['烬火之戒','rin',72,{tc_sor0:1,fcr:10,mana:40,ene:10,nb_e_dbl_mfball:15}],['焚天坠饰','amu',75,{allsk:1,life:60,allres:20,fcr:10,nb_e_open:30}]],reuse:['焚天之瞳']},
 {cls:'sor',k:'sor_cold',n:'霜语术士',ic:'❄',d:'暴雪倾泻，冻结一切',core:'mbliz',sec:'morb',t:1,st:'ene',role:'caster',mech:'echo',pm:{skd_mbliz:10},pas:'暴雪伤害 +10%',set:'永冬誓言',
  names:['永冬·霜珠','永冬·冰冠','永冬·雪袍','永冬·寒指','永冬·冰带','永冬·雪靴'],
  order:['mice','mfa','mice','mnova','mspike','mice','mglac','mglac','mshiv','mbliz','mbliz','mbliz','mbliz'],fill:()=>bl('mbliz')<20?['mbliz','mglac']:bl('morb')<20?['morb','mcm']:['mcm','mfball','mmet','mchill'],
  ac:['mchill','mshiv','mfa','mbliz','morb','mglac','mfball','mice'],
  u:[['霜脉之戒','rin',72,{tc_sor1:1,fcr:10,mana:40,ene:10,nb_e_cheap_mbliz:25}],['永冬之泪','amu',75,{allsk:1,life:60,allres:20,fcr:10,nb_e_dr:8}]],reuse:['天穹之心','霜心晶球']},
 {cls:'sor',k:'sor_light',heavy:3,b2:60,b6:250,x4:{fcr:20},n:'雷殛术士',ic:'⚡',d:'穿云电矛一分为三',core:'mlit',sec:'mnov',t:2,st:'ene',role:'caster',mech:'split',pm:{skd_mlit:10},pas:'穿云电矛伤害 +10%',set:'天雷权柄',
  names:['天雷·雷珠','天雷·电冠','天雷·云袍','天雷·电指','天雷·雷带','天雷·踏雷靴'],
  order:['mcb','mfa','mcb','mstatic','mcl','mcb','mlit','mlit','mnov','mlit','mlit','mlit','mlit'],fill:()=>bl('mlit')<20?['mlit','mnov']:bl('mnov')<20?['mnov','mlm']:['mlm','mfball','mmet','mchill','mshiv'],
  ac:['mchill','mshiv','mfa','mlit','mnov','mcl','mfball','mcb'],
  u:[['雷纹之戒','rin',72,{tc_sor2:1,fcr:10,mana:40,ene:10,nb_e_exec:25}],['天雷之核','amu',75,{allsk:1,life:60,allres:20,fcr:10,nb_e_leech:3}]],reuse:['雷鸣星辰']},
 // ---- 德鲁伊 ----
 {cls:'dru',k:'dru_fire',heavy:3,b2:60,b6:250,x4:{fcr:20},n:'熔岩德鲁伊',ic:'🌋',d:'大地开裂，岩浆奔涌',core:'dfis',sec:'dmb',t:0,st:'ene',role:'caster',mech:'echo',pm:{skd_dfis:10},pas:'大地裂隙伤害 +10%',set:'熔心之脉',
  names:['熔心·炎杖','熔心·岩冠','熔心·熔甲','熔心·烬手','熔心·岩带','熔心·焦土靴'],
  order:['dfs','drav','dfs','dfs','dmb','dfs','doak','dmb','dfis','dfis','dfis','dfis','dfis'],fill:()=>bl('dfis')<20?['dfis','dmb']:bl('dvol')<10?['dvol','dmb']:['dmb','darm','dvol','doak','dfs'],
  ac:['doak','dcyc','dfis','dmb','dvol','darm','dfs'],
  u:[['熔火之戒','rin',72,{tc_dru0:1,fcr:10,mana:40,ene:10,nb_e_dbl_dfis:15}],['地脉坠饰','amu',75,{allsk:1,life:60,allres:20,fcr:10,nb_e_dr:8}]],reuse:['万林之冠','风语羽冠']},
 {cls:'dru',k:'dru_wind',lite:1,b2:10,b4:20,b6:30,n:'风暴德鲁伊',ic:'🌪',d:'龙卷风暴撕裂敌阵',core:'dtor',sec:'dtw',t:0,st:'ene',role:'caster',mech:'echo',pm:{skd_dtor:10},pas:'龙卷风暴伤害 +10%',set:'苍岚之誓',
  names:['苍岚·风杖','苍岚·羽冠','苍岚·风甲','苍岚·旋手','苍岚·风带','苍岚·云靴'],
  order:['dab','drav','dab','dab','dcyc','dab','doak','dtw','dtw','dtw','dtor','dtor','dtor','dtor'],fill:()=>bl('dtor')<20?['dtor','dtw']:bl('dtw')<20?['dtw','dhur']:['dhur','dcyc','doak','dab'],
  ac:['doak','dcyc','dtor','dtw','dhur','dab'],
  u:[['风眼之戒','rin',72,{tc_dru0:1,fcr:10,mana:40,ene:10,nb_e_exec:25}],['苍岚之羽','amu',75,{allsk:1,life:60,allres:20,fcr:10,nb_e_leech:3}]],reuse:['风语羽冠']},
 {cls:'dru',k:'dru_sum',n:'兽群之主',ic:'🐺',d:'狼群与灰熊王为你冲锋',core:'dgriz',sec:'ddire',t:2,st:'ene',role:'summon',mech:'boom',pm:{sumdmg:10,sumlife:10},pas:'召唤物伤害 +10%，召唤物生命 +10%',set:'荒野兽契',
  names:['兽契·藤杖','兽契·兽首冠','兽契·皮甲','兽契·爪套','兽契·兽牙带','兽契·林行靴'],
  order:['drav','dswolf','drav','dswolf','doak','dswolf','ddire','ddire','ddire','dheart','dgriz','dgriz','dgriz'],fill:()=>bl('dgriz')<20?['dgriz','ddire','dswolf']:['ddire','dswolf','dheart','dbarb','doak','drav'],
  ac:['dheart','doak','dgriz','ddire','dswolf','drav','dfs'],
  u:[['兽王之戒','rin',72,{tc_dru2:1,sumdmg:20,fcr:10,ene:10,nb_e_dr:8}],['群狼图腾','amu',75,{allsk:1,sumlife:25,allres:20,life:40,nb_e_leech:3}]],reuse:['雄鹿之魂']},
 // ---- 荒野射手 ----
 {cls:'ama',k:'ama_strafe',b2:60,b6:250,x4:{ias:20},n:'疾风猎手',ic:'🏹',d:'箭雨连射，一箭化三',core:'astraf',sec:'amul',t:0,st:'dex',role:'melee',mech:'split',pm:{skd_astraf:10},pas:'疾风连射伤害 +10%',set:'疾风长弦',
  names:['长弦·疾风弓','长弦·鹰盔','长弦·猎装','长弦·拉弦手','长弦·箭袋带','长弦·追猎靴'],
  order:['amag','acrit','amag','amul','amul','adodge','amul','aguide','aguide','astraf','astraf','astraf','astraf'],fill:()=>bl('astraf')<20?['astraf','amul','aguide']:['amul','aguide','apen','acrit','aavoid','apier'],
  ac:['asight','astraf','amul','aguide','amag'],w:'bowe4',
  u:[['鹰隼之戒','rin',72,{tc_ama0:1,ias:15,ll:5,dex:10,nb_e_dbl_astraf:15}],['长风坠饰','amu',75,{allsk:1,life:60,allres:20,ias:10,nb_e_dr:8}]],reuse:['母神之怒','灰林幽语']},
 {cls:'ama',k:'ama_elem',heavy:3,b2:60,b6:250,x4:{ias:20},n:'元素弓手',ic:'☄',d:'燎原之矢点燃大地',core:'aimm',sec:'aexp',t:0,st:'dex',role:'melee',mech:'burst',pm:{skd_aimm:10},pas:'燎原矢伤害 +10%',set:'炽羽箭冢',
  names:['炽羽·焰弓','炽羽·焰盔','炽羽·炎装','炽羽·燃手','炽羽·炎带','炽羽·焦靴'],
  order:['afire','acrit','afire','afire','afire','amul','aexp','aexp','aexp','aimm','aimm','aimm','aimm'],fill:()=>bl('aimm')<20?['aimm','aexp']:bl('aexp')<20?['aexp','afire']:['afire','afrz','aice','apen','acrit'],
  ac:['asight','aimm','aexp','afrz','afire'],w:'bowe4',
  u:[['燎原之戒','rin',72,{tc_ama0:1,ias:15,mana:40,dex:10,nb_e_open:30}],['炽羽坠饰','amu',75,{life:60,allres:20,str:10,nb_e_leech:2}]],reuse:['灰林幽语']},
 {cls:'ama',k:'ama_jav',n:'雷枪战姬',ic:'⚡',d:'天雷之矛贯穿战场',core:'alstr',sec:'achg',t:1,st:'dex',role:'melee',mech:'echo',pm:{skd_alstr:10},pas:'天雷刺伤害 +10%',set:'雷枪战旗',
  names:['战旗·雷枪','战旗·雷盔','战旗·雷甲','战旗·握枪手','战旗·腰带','战旗·奔雷靴'],
  order:['ajab','acrit','ajab','apow','apow','apoi','albolt','albolt','achg','achg','alstr','alstr','alstr','alstr'],fill:()=>bl('alstr')<20?['alstr','achg','albolt']:['achg','albolt','apow','afury','acrit','aavoid'],
  ac:['asight','alstr','achg','albolt','afury','ajab'],w:'aw4',
  u:[['雷枪之戒','rin',72,{tc_ama1:1,ias:15,ll:5,dex:10,nb_e_exec:25}],['战旗纹章','amu',75,{allsk:1,life:60,allres:20,ias:10,nb_e_dr:8}]],reuse:['祭雷之枪','少女之誓']},
 // ---- 圣誓骑士 ----
 {cls:'pal',k:'pal_zeal',b2:20,b6:80,n:'热忱圣骑',ic:'⚔',d:'狂信加持，连斩不息',core:'pzeal',sec:'psac',t:0,st:'str',role:'melee',mech:'split',pm:{skd_pzeal:10},pas:'热忱连斩伤害 +10%',set:'狂信圣仪',
  names:['圣仪·誓剑','圣仪·圣盾','圣仪·圣甲','圣仪·铁手','圣仪·腰环','圣仪·战靴'],
  order:['pmight','psac','ppray','psac','psac','pzeal','pzeal','pzeal','paim','pconc','pzeal','pzeal','pfana','pfana'],fill:()=>bl('pzeal')<20?['pzeal','pfana','psac']:['pfana','psac','pconc','pvigor','pdefi'],
  ac:['pfana','pconc','pmight','pzeal','psac'],w:'swde2',
  u:[['誓刃之戒','rin',72,{tc_pal0:1,ias:15,ll:6,str:10,nb_e_dbl_pzeal:15}],['圣仪圣徽','amu',75,{allsk:1,life:60,allres:20,ias:10,nb_e_dr:8}]],reuse:['天使之翼','圣王冠盾']},
 {cls:'pal',k:'pal_ham',lite:1,b2:0,b4:0,b6:60,n:'圣锤审判',ic:'🔨',d:'旋转圣锤碾碎一切邪魔',core:'pham',sec:'pbolt',t:0,st:'str',role:'caster',mech:'echo',pm:{skd_pham:10},pas:'圣佑旋锤伤害 +10%',set:'审判圣锤',
  names:['审判·锤杖','审判·圣盾','审判·圣袍','审判·护手','审判·腰索','审判·圣靴'],
  order:['pmight','psac','ppray','pmight','pbolt','pbolt','pmight','paim','pham','pconc','pham','pconc','pham','pham'],fill:()=>bl('pham')<20?['pham','pconc']:bl('pconc')<20?['pconc','pbolt']:['pbolt','pvigor','pmedi','psac'],
  ac:['pconc','pfana','pmight','pham','pbolt'],w:'mace5',
  u:[['审判之戒','rin',72,{tc_pal0:1,fcr:10,mana:40,str:10,nb_e_cheap_pham:25}],['圣锤圣徽','amu',75,{allsk:1,life:60,allres:20,fcr:10,nb_e_leech:3}]],reuse:['晨曦守望']},
 {cls:'pal',k:'pal_fist',b2:20,b6:40,n:'天罚雷拳',ic:'🌩',d:'雷霆之拳自天而降',core:'pfist',sec:'pham',t:0,st:'str',role:'caster',mech:'burst',pm:{skd_pfist:10},pas:'天罚雷拳伤害 +10%',set:'雷霆天罚',
  names:['天罚·雷杖','天罚·雷盾','天罚·雷甲','天罚·雷手','天罚·雷带','天罚·雷靴'],
  order:['pmight','psac','ppray','psac','pbolt','pbolt','pzeal','pveng','pham','pconv','pfist','pfist','pfist','pfist'],fill:()=>bl('pfist')<20?['pfist','pham','pbolt']:['pham','pbolt','pconc','pvigor','pconv'],
  ac:['pconc','pfana','pmight','pfist','pham','pbolt'],w:'mace5',
  u:[['雷罚之戒','rin',72,{tc_pal0:1,fcr:10,mana:40,str:10,nb_e_open:30}],['天罚圣徽','amu',75,{allsk:1,life:60,allres:20,fcr:10,nb_e_dr:8}]],reuse:['圣王冠盾']},
];
// 6 件套奖励（2/4/6），机制按 mech 生成
function cbBonus(c){const k='skd_'+c.core,ks='skd_'+c.sec;
 if(c.mech==='boom')return{2:{sumdmg:20,sumlife:20},4:{sumlife:20,sumdmg:20},6:{nb_boom:1,sumdmg:30}};
 const b2=c.b2!=null?c.b2:40,b4=c.b4!=null?c.b4:60;return{2:b2?{[k]:b2}:{life:80},4:Object.assign(b4?{[ks]:b4}:{allres:15},{nb_boss:15},c.x4||{}),6:{['nb_m_'+c.mech+'_'+c.core]:1,[k]:c.b6||150}}}
const CB_SET_LV=[75,72,72,70,70,70],CB_KEYS=['W','H','A','G','B','F'];
for(const c of CB_SPECS){const st={cls:c.cls,n:c.n,ic:c.ic,d:c.d,pas:c.pas,pm:c.pm,set:'nb_'+c.k,order:c.order,fill:c.fill,ac:c.ac,share:null,core:c.core,mech:c.mech,reuse:c.reuse};
 c.tc='tc_'+c.cls+c.t;NB.builds[c.k]=st;const B=cbBonus(c);
 SETS['nb_'+c.k]={n:c.set,nb:c.k,bonus:B};
 const T=CB_TPL[c.role];CB_KEYS.forEach((K,i)=>{const mm=T[K](c);if(c.lite){delete mm['sk_'+c.core];delete mm[c.tc];delete mm['sk_'+c.sec];if(K==='H')delete mm.allsk}if(c.slow&&mm.fcr)mm.fcr=Math.round(mm.fcr*c.slow);if(c.noedmg&&mm.edmg)mm.edmg=[60,80];if(c.heavy&&K==='W')mm['sk_'+c.core]=(mm['sk_'+c.core]||0)+c.heavy;const base=K==='W'?(c.w||CB_SLOTS[c.cls].W):K==='H'?CB_SLOTS[c.cls].H:CB_REST[K];if(!BASEM[base])return;
  const it=S_(c.names[i],'nb_'+c.k,base,CB_SET_LV[i],CB_SET_LV[i]-8,mm);it.nb=c.k;SETITEMS.push(it);NB_SETITEMS.push(it);NB_NAMES.add(it.n)});
 for(const[n,b,lv,m]of c.u){const u=Object.assign(U(n,b,lv,lv-8,m),{nb:c.k});UNIQUES.push(u);NB_UNIQUES.push(u);NB_NAMES.add(n)}}
// 召唤职业骸爆：德鲁伊/射手召唤物也参与
NB.boomKinds=new Set(['skel','mage','dpet','apet']);
// ---------- 机制：分裂 / 回响（施放后）、爆裂（击杀时）；不触发技能次数、不连锁击杀爆炸 ----------
NB.K=0;NB.REP=0;
{const f=hitMon;hitMon=function(m,d,src,fxc){if(src==='hero'&&d&&m&&m.hp>0){const N=ST&&ST.nb;let k=NB.K||1;
  if(N&&N.e){const e=N.e,c=NB.CAST;if(c&&e['dbl_'+c]&&rnd()*100<e['dbl_'+c])k*=2;if(e.exec&&m.hp<m.max*0.3)k*=1+e.exec/100;if(e.open&&m.hp>=m.max)k*=1+e.open/100}
  if(k!==1){const o={};for(const x in d)o[x]=d[x]*k;d=o}}return f(m,d,src,fxc)}}
function cbReplay(id,tg,k,single){const s=SKM[id];if(!s||!s.cls||!CLS_TY[s.ty]||!tg.length)return;const v=SV(id,slvl(id));const p=NB.CAST,mana=H.mana;NB.K=k;NB.REP=1;NB.CAST=id;
 try{nbNoChain(()=>{if(single){for(const m of tg)CLS_TY[s.ty](s,Object.assign({},v,{n:1,hits:1}),[m],m)}else CLS_TY[s.ty](s,v,tg,(typeof target==='function'?target(tg):tg[0]))})}finally{NB.K=0;NB.REP=0;NB.CAST=p;H.mana=mana}}
{const f=acCast;acCast=function(id,ms){const r=f(id,ms);try{const N=ST&&ST.nb;if(!N||!N.mech||!N.mech.length||NB.REP||(typeof MC_K!=='undefined'&&MC_K))return r;
  for(const x of N.mech){if(x.id!==id)continue;const l=liveMon();if(!l.length)break;
   if(x.t==='split'){const o=l.slice().sort(()=>rnd()-.5).slice(0,2);cbReplay(id,o,0.5,1)}
   else if(x.t==='echo'&&rnd()<0.3)cbReplay(id,l,0.6,0)}}catch(e){console.warn('cb mech',e)}return r}}
NB.bT=0;NB.bN=0;
{const f=killMon;killMon=function(m){const N=ST&&ST.nb;const c=NB.CAST;const r=f(m);
 try{if(N&&N.mech&&c&&!m.boss&&!NB.REP&&!(typeof MC_K!=='undefined'&&MC_K)&&NB.bN<3&&GT-NB.bT<1e9){const x=N.mech.find(q=>q.t==='burst'&&q.id===c);if(x){if(GT-NB.bT>=1){NB.bT=GT;NB.bN=0}NB.bN++;
   const o=liveMon().slice().sort(()=>rnd()-.5).slice(0,3);if(o.length)cbReplay(c,o,0.4,1)}}
  if(N&&N.e&&N.e.leech&&ST){H.life=Math.min(ST.life,H.life+ST.life*N.e.leech/100);H.mana=Math.min(ST.mana,H.mana+ST.mana*N.e.leech/100)}}catch(e){console.warn('cb burst',e)}return r}}
// 法力消耗折扣
{const f=SV;SV=function(id,L){const v=f(id,L);try{const e=ST&&ST.nb&&ST.nb.e;if(e&&v&&v.mana&&e['cheap_'+id])v.mana=Math.round(v.mana*(1-e['cheap_'+id]/100)*10)/10}catch(x){}return v}}
// 自动施法估值：计入技能伤害加成、分裂/回响（让自动施法优先流派核心技能）
{const f=clsEst;clsEst=function(s,ms){let e=f(s,ms);try{const N=ST&&ST.nb;if(!N)return e;const sk=N.skd&&N.skd[s.id];if(sk)e*=1+sk/100;
  for(const x of N.mech||[])if(x.id===s.id){if(x.t==='split')e*=1+Math.min(2,Math.max(0,ms.length-1))*0.5;else if(x.t==='echo')e*=1.18;else if(x.t==='burst')e*=ms.length>1?1.2:1}}catch(x){}return e}}
// 骸爆扩展到德鲁伊/射手召唤物（nec_build 的 step 包装只认 skel/mage）
{const f=step;step=function(dt){const N=ST&&ST.nb;const pre=N&&N.boom&&nbCls()!=='nec'?ALLY.filter(a=>NB.boomKinds.has(a.kind)&&a.hp>0&&!a.until):null;const r=f(dt);
 try{if(pre){for(const a of pre.filter(a=>a.hp<=0)){nbBoom(a);ALLY.push(Object.assign({},a,{uid:mUid++,hp:a.max,hitT:0}))}
  NB.cbT=(NB.cbT||0)+dt;if(NB.cbT>=12){NB.cbT=0;for(const a of ALLY)if(NB.boomKinds.has(a.kind)&&a.hp>0&&!a.until){nbBoom(a);a.hp=a.max}}}}catch(e){console.warn('cb boom',e)}return r}}
