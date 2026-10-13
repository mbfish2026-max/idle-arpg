'use strict';
// ===== 第二阶段：章节 / 区域 / 怪物 / 首领 / 任务 / 难度 / 随从 数据 =====
// 本文件在 data.js 之后、game.js 之前加载；只改写章节相关表，不触碰装备数据。
// 所有名称均为原创；注释中的“对应机制”只描述机制。

// ---------- 难度 ----------
// pen 抗性惩罚；hp/dmg/exp 为在怪物等级成长之上的难度系数(近似)；dxp 死亡损失“本级所需经验”的比例
Object.assign(DIFFS[0],{n:'普通',pen:0,hp:1,dmg:1,exp:1,dxp:0,lock:0,naff:1});
Object.assign(DIFFS[1],{n:'噩梦',pen:-40,hp:1.15,dmg:0.85,exp:2.8,dxp:0.05,lock:0,naff:2});
Object.assign(DIFFS[2],{n:'地狱',pen:-100,hp:1.8,dmg:1.0,exp:2.6,dxp:0.10,lock:0,naff:3});
// 区域怪物等级：普通 ml → 噩梦 36..68 / 地狱 67..85 线性映射（普通最高 45）
function mlD(ml,d){if(!d)return ml;return d===1?Math.round(36+(ml-1)*32/44):Math.round(67+(ml-1)*18/44)}

// ---------- 经验表（30 级以后改为接近原版走势的近似：31→70 每级 ×1.1476，70→99 每级 ×1.0444） ----------
xpNeed=function(l){if(l<XPT.length)return XPT[l];const b=XPT[XPT.length-1];if(l<=70)return Math.floor(b*Math.pow(1.1476,l-30));return Math.floor(b*Math.pow(1.1476,40)*Math.pow(1.0444,l-70))};
// 怪物经验额外成长（mlvl>12 起，近似）
// 怪物经验额外系数（挂机节奏调校，近似）：ml≤12 ×1；12–20 降到 0.25；20–45 回升到 0.5；45–60 回升到 1；之后 ×1
function expCurve(lv){return lv<=12?1:lv<=20?1-0.75*(lv-12)/8:lv<=45?0.25+0.25*(lv-20)/25:lv<=60?0.5+0.5*(lv-45)/15:1}

// ---------- 第一章怪物：补充噩梦/地狱抗性 ----------
// resN/resH 未写时：噩梦 = 普通非零抗性 +15，地狱 = +30（≥100 即免疫）
Object.assign(MONS.zombie,{resH:{pois:100}});Object.assign(MONS.skel,{resH:{pois:100,cold:50}});
Object.assign(MONS.ghost,{resN:{phys:50,pois:90,magic:0},resH:{phys:75,pois:100,cold:50}});
Object.assign(MONS.shaman,{resH:{fire:100}});Object.assign(MONS.ape,{resH:{cold:100}});Object.assign(MONS.bat,{resH:{light:100}});
Object.assign(MONS.rat,{resH:{pois:75}});Object.assign(MONS.archer,{resH:{fire:50,cold:50}});
Object.assign(MONS.rogue,{sk:['charge']});Object.assign(MONS.shaman,{sk:['revive']});

// ---------- 第二~五章怪物家族 ----------
// sk: 怪物技能 charge冲撞 frost冰霜新星 nova元素新星 spark闪电弹 randel随机元素弹 poisbreath毒息 inferno烈焰喷吐 leech吸血 manaburn噬法 curse诅咒(降抗) stun重击眩晕 web缠网 revive复活同伴 heal治疗同伴 chill冰寒光环(减速)
Object.assign(MONS,{
 // 第二章 沙海之墓
 beetle:{n:'沙颚甲虫',ic:'🪲',fam:'甲虫',hp:22,dmg:[2,5],ar:24,def:14,exp:18,el:'light',res:{light:50},resH:{light:100},sk:['spark']},
 husk:{n:'风干尸',ic:'🧟',fam:'干尸',hp:30,dmg:[2,6],ar:20,def:6,exp:20,undead:1,spd:0.7,res:{pois:50,fire:-25},resH:{pois:100},sk:['poisbreath']},
 jackal:{n:'豺首卫',ic:'🐺',fam:'豺人',hp:20,dmg:[2,6],ar:32,def:10,exp:17,sk:['charge'],resH:{fire:50}},
 serpent:{n:'鳞蛇祭司',ic:'🐍',fam:'蛇人',hp:18,dmg:[1,5],ar:26,def:8,exp:19,ranged:1,el:'cold',res:{cold:40},resH:{cold:100}},
 fly:{n:'沙蝇群',ic:'🪰',fam:'虫群',hp:10,dmg:[1,3],ar:30,def:22,exp:12,spd:1.5,res:{pois:30},sk:['leech']},
 vulture:{n:'腐翼秃鹫',ic:'🦅',fam:'鹫魔',hp:16,dmg:[2,4],ar:28,def:10,exp:15,spd:1.3,res:{light:20}},
 tombmage:{n:'墓巫骨',ic:'☠',fam:'骸骨法师',hp:14,dmg:[2,5],ar:20,def:6,exp:20,undead:1,ranged:1,el:'fire',res:{pois:75,cold:25},resH:{pois:100,cold:60},sk:['randel']},
 leaper:{n:'沙跃兽',ic:'🦎',fam:'跃兽',hp:18,dmg:[2,5],ar:30,def:10,exp:16,spd:1.4},
 // 第三章 腐沼神庙
 spider:{n:'毒脊蛛',ic:'🕷',fam:'蛛类',hp:20,dmg:[2,6],ar:30,def:14,exp:22,el:'pois',res:{pois:50},resH:{pois:100},sk:['web']},
 mosq:{n:'血喙蚊',ic:'🦟',fam:'飞虫',hp:14,dmg:[1,4],ar:30,def:18,exp:18,spd:1.5,res:{light:30},sk:['manaburn']},
 flayer:{n:'剥皮侏儒',ic:'👹',fam:'侏儒',hp:12,dmg:[2,5],ar:28,def:8,exp:14,spd:1.3},
 flshaman:{n:'剥皮巫医',ic:'🧌',fam:'侏儒',hp:14,dmg:[2,5],ar:20,def:6,exp:22,ranged:1,el:'fire',res:{fire:50},resH:{fire:100},sk:['revive']},
 frog:{n:'泥沼蛙魔',ic:'🐸',fam:'蛙魔',hp:24,dmg:[2,6],ar:24,def:12,exp:20,ranged:1,el:'fire',res:{fire:30,pois:30}},
 hulk:{n:'棘背巨魔',ic:'🦍',fam:'巨魔',hp:44,dmg:[3,9],ar:30,def:20,exp:30,spd:0.8,res:{phys:20,cold:20},resH:{phys:60,cold:100}},
 zealot:{n:'狂信护卫',ic:'🗡',fam:'狂信者',hp:28,dmg:[3,8],ar:36,def:16,exp:24,res:{fire:20,light:20},resH:{light:100},sk:['charge']},
 priest:{n:'赦罪司祭',ic:'⛪',fam:'狂信者',hp:22,dmg:[2,6],ar:24,def:10,exp:26,ranged:1,el:'light',res:{light:40},resH:{light:100,fire:50},sk:['heal']},
 vamp:{n:'血裔领主',ic:'🧛',fam:'血裔',hp:30,dmg:[3,8],ar:30,def:16,exp:30,undead:1,ranged:1,el:'fire',res:{fire:50,pois:50},resH:{fire:100,pois:100},sk:['inferno','leech']},
 corrupt:{n:'腐池蠕魔',ic:'🪱',fam:'蠕魔',hp:26,dmg:[2,7],ar:24,def:10,exp:20,el:'pois',res:{pois:60},resH:{pois:100},sk:['poisbreath']},
 // 第四章 炎狱之门
 fiend:{n:'渊魔兵',ic:'😈',fam:'渊魔',hp:34,dmg:[3,9],ar:34,def:18,exp:30,demon:1,res:{fire:40},resH:{fire:100}},
 hound:{n:'炎喉狱犬',ic:'🐕',fam:'狱犬',hp:28,dmg:[3,8],ar:36,def:14,exp:28,spd:1.4,demon:1,el:'fire',res:{fire:75},resH:{fire:100},sk:['inferno']},
 knight:{n:'湮誓骑士',ic:'⚔',fam:'湮誓者',hp:40,dmg:[4,10],ar:40,def:24,exp:36,undead:1,res:{pois:50,magic:20},resN:{pois:60,magic:40},resH:{pois:75,magic:100},sk:['curse']},
 venom:{n:'毒焰领主',ic:'🔥',fam:'焰魔',hp:44,dmg:[4,12],ar:40,def:26,exp:40,demon:1,el:'fire',res:{fire:50,pois:50},resH:{fire:100,pois:75},sk:['inferno']},
 storm:{n:'雷殛魔',ic:'⚡',fam:'雷魔',hp:30,dmg:[3,10],ar:34,def:16,exp:34,ranged:1,el:'light',res:{light:75},resH:{light:100,cold:50},sk:['spark']},
 pitlord:{n:'深坑巨魔',ic:'👿',fam:'深渊巨魔',hp:60,dmg:[5,13],ar:38,def:28,exp:44,spd:0.8,demon:1,res:{fire:30,phys:20},resH:{phys:100,fire:50},sk:['charge']},
 // 第五章 霜峰之巅
 yeti:{n:'雪原魔猿',ic:'🦣',fam:'魔猿',hp:46,dmg:[4,11],ar:36,def:20,exp:36,res:{cold:50},resH:{cold:100},sk:['charge']},
 horror:{n:'冰骸魔仆',ic:'🧊',fam:'冰骸',hp:36,dmg:[3,10],ar:34,def:22,exp:34,el:'cold',res:{cold:75,pois:30},resH:{cold:100,pois:60},sk:['frost']},
 minion:{n:'毁灭爪牙',ic:'🪓',fam:'爪牙',hp:40,dmg:[4,12],ar:40,def:24,exp:38,demon:1,res:{fire:30,light:30},resH:{fire:100,light:50}},
 siren:{n:'霜咒魅妖',ic:'🧚',fam:'魅妖',hp:26,dmg:[3,9],ar:30,def:16,exp:34,ranged:1,el:'cold',demon:1,res:{cold:50},resH:{cold:100,light:50},sk:['curse']},
 mauler:{n:'断骨重锤',ic:'🔨',fam:'重锤兵',hp:50,dmg:[5,14],ar:40,def:26,exp:42,spd:0.9,res:{phys:30},resH:{phys:60,light:100},sk:['stun']},
 wolf:{n:'霜狼',ic:'🐺',fam:'狼群',hp:30,dmg:[3,9],ar:36,def:16,exp:28,spd:1.5,res:{cold:30},resH:{cold:100}},
 wraith:{n:'怨灵',ic:'👻',fam:'怨灵',hp:24,dmg:[3,9],ar:30,def:30,exp:32,undead:1,el:'cold',res:{phys:50,pois:75},resH:{phys:75,pois:100,magic:100},sk:['manaburn']},
});

// ---------- 首领 ----------
Object.assign(BOSSES,{
 // 第二章
 rotwarden:{n:'腐棺守卫·拉蒙',ic:'⚰',hp:150,dmg:[5,12],ar:70,def:40,exp:1100,undead:1,el:'pois',res:{pois:75,fire:-25},sk:['revive','poisbreath']},
 fangqueen:{n:'碧鳞蛇后·纳迦',ic:'🐉',hp:140,dmg:[5,12],ar:70,def:40,exp:1000,el:'light',res:{light:75},sk:['spark']},
 summoner:{n:'秘术士·奥伦',ic:'🧙',hp:120,dmg:[4,12],ar:60,def:30,exp:1300,ranged:1,el:'cold',res:{fire:40,cold:40,light:40},sk:['frost','randel']},
 kassar:{n:'沙渊之王·卡萨尔',ic:'🦂',hp:380,dmg:[9,24],ar:110,def:80,exp:6000,actboss:1,res:{fire:20,cold:50,light:20,pois:20},sk:['chill','charge']},
 // 第三章
 jadeguard:{n:'翠羽守望者',ic:'🦜',hp:160,dmg:[5,13],ar:70,def:40,exp:1200,ranged:1,el:'fire',res:{fire:50},sk:['inferno']},
 flaychief:{n:'剥皮酋长·古姆',ic:'👺',hp:160,dmg:[5,14],ar:75,def:40,exp:1300,res:{fire:50},sk:['revive','charge']},
 tomekeeper:{n:'书冢看守·赛勒',ic:'📕',hp:170,dmg:[5,14],ar:75,def:45,exp:1300,undead:1,el:'cold',res:{cold:50,pois:75},sk:['frost']},
 council1:{n:'黑袍议员·伊格',ic:'🧿',hp:180,dmg:[6,15],ar:80,def:50,exp:1500,ranged:1,el:'fire',res:{fire:75,light:30},sk:['inferno']},
 council2:{n:'黑袍议员·萨恩',ic:'🧿',hp:180,dmg:[6,15],ar:80,def:50,exp:1500,ranged:1,el:'fire',res:{fire:75,cold:30},sk:['heal']},
 council3:{n:'黑袍议员·托尔',ic:'🧿',hp:180,dmg:[6,15],ar:80,def:50,exp:1500,res:{fire:75,pois:30},sk:['charge']},
 mehet:{n:'腐沼祭主·迈赫特',ic:'🐙',hp:520,dmg:[10,28],ar:130,def:90,exp:12000,actboss:1,ranged:1,el:'light',res:{fire:30,cold:75,light:75,pois:75},sk:['nova','frost','chill']},
 // 第四章
 fallen:{n:'堕翼者·伊扎恩',ic:'🪽',hp:400,dmg:[10,26],ar:120,def:80,exp:6000,el:'cold',res:{cold:75,fire:50,light:50,pois:50},sk:['frost','chill']},
 forger:{n:'熔铸者·赫法',ic:'⚒',hp:380,dmg:[12,30],ar:120,def:90,exp:6000,res:{fire:75,cold:50,light:50,pois:50},sk:['inferno','charge']},
 seal1:{n:'封印守卫·维泽',ic:'🔯',hp:300,dmg:[8,22],ar:100,def:70,exp:4000,ranged:1,el:'light',res:{light:75},sk:['nova']},
 seal2:{n:'封印守卫·德赛',ic:'🔯',hp:320,dmg:[9,24],ar:110,def:80,exp:4000,res:{fire:50},sk:['curse','charge']},
 seal3:{n:'封印守卫·因菲',ic:'🔯',hp:300,dmg:[8,22],ar:100,def:70,exp:4000,el:'fire',res:{fire:75},sk:['inferno']},
 valax:{n:'恐惧魔君·瓦拉克斯',ic:'👹',hp:800,dmg:[14,36],ar:150,def:110,exp:24000,actboss:1,el:'fire',res:{fire:75,cold:50,light:75,pois:50},sk:['inferno','charge','nova']},
 // 第五章
 siegelord:{n:'围城统领·申克',ic:'🛡',hp:450,dmg:[12,30],ar:130,def:90,exp:7000,res:{fire:50},sk:['charge','inferno']},
 frostjailer:{n:'冰封典狱·弗洛斯',ic:'❄',hp:420,dmg:[11,28],ar:120,def:90,exp:6000,el:'cold',res:{cold:75},sk:['frost','chill']},
 traitor:{n:'叛长老·尼萨',ic:'🧓',hp:400,dmg:[10,28],ar:120,def:80,exp:8000,ranged:1,el:'cold',res:{fire:50,cold:75,light:50,pois:50},sk:['corpsefire','frost']},
 anc1:{n:'远古英灵·塔洛',ic:'🗿',hp:500,dmg:[12,30],ar:140,def:100,exp:9000,res:{fire:50,cold:50,light:50,pois:50},sk:['charge']},
 anc2:{n:'远古英灵·马达',ic:'🗿',hp:500,dmg:[12,30],ar:140,def:100,exp:9000,res:{fire:50,cold:50,light:50,pois:50},sk:['stun']},
 anc3:{n:'远古英灵·科恩',ic:'🗿',hp:500,dmg:[12,30],ar:140,def:100,exp:9000,res:{fire:50,cold:50,light:50,pois:50},sk:['leech','charge']},
 tw1:{n:'腐誓骑士·科伦',ic:'🛡',hp:360,dmg:[10,26],ar:120,def:80,exp:5000,ranged:1,el:'cold',res:{cold:75},sk:['frost']},
 tw2:{n:'骸骨大祭司·阿彻',ic:'💀',hp:340,dmg:[10,26],ar:120,def:80,exp:5000,undead:1,ranged:1,el:'fire',res:{fire:75,pois:75},sk:['inferno','revive']},
 tw3:{n:'堕魂战将·巴图',ic:'🪓',hp:420,dmg:[12,30],ar:130,def:90,exp:5000,res:{phys:30},sk:['charge','stun']},
 tw4:{n:'疫骑·文塔',ic:'☣',hp:380,dmg:[10,28],ar:120,def:80,exp:5000,el:'pois',res:{pois:75},sk:['poisbreath','curse']},
 tw5:{n:'炎魔领主·利斯',ic:'🔥',hp:420,dmg:[12,30],ar:130,def:90,exp:5500,demon:1,el:'fire',res:{fire:75,light:50},sk:['inferno','charge']},
 eldron:{n:'毁灭领主·艾尔德隆',ic:'💠',hp:1100,dmg:[16,42],ar:170,def:130,exp:40000,actboss:1,el:'cold',res:{fire:50,cold:50,light:50,pois:50},sk:['frost','leech','charge','chill']},
});

// 数值调校(近似，挂机节奏)：第二章起的怪物家族生命 ×HPX；伤害 ×DMX；新首领伤害 ×BDX
// 难度调整(第四阶段)：怪物伤害 0.65→DMX；章节终点首领单独 ABX，使其有一定阵亡风险
const HPX=1.6,DMX=0.68,BDX=0.55,ABX=1.25;
for(const k in MONS)if(MONS[k].fam&&!MONS[k]._t){MONS[k]._t=1;MONS[k].hp*=HPX;MONS[k].dmg=MONS[k].dmg.map(x=>x*DMX)}
for(const k of ['rotwarden','fangqueen','summoner','kassar','jadeguard','flaychief','tomekeeper','council1','council2','council3','mehet','fallen','forger','seal1','seal2','seal3','valax','siegelord','frostjailer','traitor','anc1','anc2','anc3','tw1','tw2','tw3','tw4','tw5','eldron'])BOSSES[k].dmg=BOSSES[k].dmg.map(x=>x*(BOSSES[k].actboss?ABX:BDX));

// ---------- 精英词缀（金色首领小队 / 蓝色精英小队） ----------
const ELITE_AFF={
 st:{n:'蛮力',f:m=>{m.dmg=m.dmg.map(x=>x*1.5)}},
 fast:{n:'迅疾',f:m=>{m.spd*=1.5}},
 stone:{n:'石肤',f:m=>{m.def*=3;m.res.phys+=50}},
 fe:{n:'炎附',f:m=>{m.res.fire+=75;m.sk.push('inferno')}},
 ce:{n:'霜附',f:m=>{m.res.cold+=75;m.sk.push('frost')}},
 le:{n:'雷附',f:m=>{m.res.light+=75;m.sk.push('spark')}},
 mr:{n:'法抗',f:m=>{m.res.fire+=40;m.res.cold+=40;m.res.light+=40}},
 mb:{n:'噬法',f:m=>{m.sk.push('manaburn')}},
 cur:{n:'咒缚',f:m=>{m.sk.push('curse')}},
 spec:{n:'幽击',f:m=>{m.sk.push('randel')}},
 fan:{n:'狂热',f:m=>{m.spd*=1.25;m.fan=1}},
};
const CHAMP_V=[{n:'狂战',f:m=>{m.dmg=m.dmg.map(x=>x*1.3)}},{n:'幽影',f:m=>{m.res.phys+=50;m.spd*=0.85}},{n:'狂热',f:m=>{m.spd*=1.4}},{n:'精英',f:m=>{}}];
const UNIQ_T=['血爪','腐眼','碎颅','裂魂','灰鬃','毒牙','暗刺','霜喉','焦骨','噬心','铁颚','夜啸'];

// ---------- 随从 ----------
// life/def: [基础, 每级]；dmg: [[最小基础,每级],[最大基础,每级]]；atk 攻击间隔(秒)；res 每级抗性
const MERCS={
 archer:{n:'荒原女射手',act:0,ic:'🏹',ranged:1,kind:'弓箭',life:[45,9],def:[15,6],dmg:[[1,0.55],[3,0.95]],atk:1.3,str:[20,1.0],dex:[30,1.6],res:0.8,wcats:null,
  vars:{fire:'火焰箭',cold:'冰霜箭'},vd:'fire'},
 guard:{n:'风蚀港卫枪兵',act:1,ic:'🔱',kind:'近战+光环',life:[120,16],def:[30,9],dmg:[[3,1.0],[7,1.6]],atk:1.4,str:[35,1.6],dex:[25,1.0],res:0.9,wcats:['sword','dagger'],
  vars:{might:'战意光环(召唤物/随从伤害+30%)',pray:'祈祷光环(每秒回复生命)',defi:'坚壁光环(防御+70%)'},vd:'might'},
 mage:{n:'铁狼术士',act:2,ic:'🪄',ranged:1,spell:1,kind:'元素法术',life:[70,10],def:[20,6],dmg:[[3,1.3],[6,2.1]],atk:1.7,str:[25,1.0],dex:[20,0.9],res:1.0,wcats:['sword','wand','dagger'],
  vars:{fire:'火球',cold:'冰爆(减速)',light:'连锁闪电'},vd:'cold'},
 barb:{n:'雪峰剑士',act:4,ic:'⚔',kind:'近战重击',life:[150,18],def:[30,9],dmg:[[4,1.4],[9,2.2]],atk:1.3,str:[45,1.8],dex:[30,1.0],res:0.9,wcats:['sword'],
  vars:{bash:'重击(15%眩晕)',frenzy:'狂怒(攻速+30%)'},vd:'bash'},
};

// ---------- 章节 / 区域 ----------
// w 波数；boss 末波首领；bosses 末波多首领；bw {波序:{b:[首领],m:[随从],n:数量}} 中途首领波（封印/王座）；
// quest 任务；part 清空获得任务道具；side 支线(自动推进跳过)；dun 地下城；bl 章节首领额外等级；solo 首领波无随从
const Z=(n,ml,mons,bg,o={})=>Object.assign({n,ml,w:o.w||5,mons,bg},o);
ACTS[0].fq='q6';
ACTS.splice(1,4,
 {n:'第二章 · 沙海之墓',camp:'风蚀港',boss:'沙渊之王·卡萨尔',fq:'a2q6',zones:[
  Z('港口下水道·一层',13,['husk','fly','tombmage'],'bg_cave',{dun:1}),
  Z('港口下水道·二层',14,['husk','tombmage','fly'],'bg_cave',{dun:1}),
  Z('港口下水道·三层',15,['husk','tombmage','beetle'],'bg_cave',{dun:1,w:6,boss:'rotwarden',quest:'a2q1'}),
  Z('碎岩荒地',14,['jackal','vulture','leaper'],'bg_desert'),
  Z('石棺墓',16,['husk','tombmage','jackal'],'bg_tomb',{dun:1,side:1}),
  Z('干涸高地',15,['jackal','vulture','beetle'],'bg_desert'),
  Z('亡者之厅',16,['husk','tombmage','beetle'],'bg_tomb',{dun:1,w:6,part:['a2q2','cube']}),
  Z('远方绿洲',16,['leaper','fly','beetle'],'bg_desert'),
  Z('蛆巢',17,['beetle','fly','leaper'],'bg_cave',{dun:1,w:6,part:['a2q2','shaft']}),
  Z('遗失之城',17,['vulture','jackal','tombmage'],'bg_desert'),
  Z('远古隧道',18,['tombmage','husk','beetle'],'bg_tomb',{dun:1,side:1}),
  Z('蛇谷',18,['serpent','leaper','vulture'],'bg_desert'),
  Z('蛇神殿',19,['serpent','beetle','fly'],'bg_tomb',{dun:1,w:6,boss:'fangqueen',quest:'a2q3',part:['a2q2','amulet']}),
  Z('宫殿地窖',20,['jackal','serpent','tombmage'],'bg_jail',{dun:1,quest:'a2q4'}),
  Z('术士圣所',21,['tombmage','serpent','husk'],'bg_tower',{dun:1,w:6,boss:'summoner',quest:'a2q5'}),
  Z('魔导峡谷',22,['beetle','vulture','serpent','leaper'],'bg_desert'),
  Z('七座古墓',23,['husk','tombmage','beetle','serpent'],'bg_tomb',{dun:1,w:7}),
  Z('真墓·沙渊',24,['husk','tombmage','serpent'],'bg_tomb',{dun:1,w:4,boss:'kassar',quest:'a2q6',bl:1,solo:1}),
 ]},
 {n:'第三章 · 腐沼神庙',camp:'雨林码头',boss:'腐沼祭主·迈赫特',fq:'a3q6',zones:[
  Z('蛛林',24,['spider','mosq','frog'],'bg_forest'),
  Z('蛛穴',25,['spider','mosq'],'bg_cave',{dun:1,part:['a3q3','eye']}),
  Z('蛛巢洞',26,['spider','mosq','corrupt'],'bg_cave',{dun:1,side:1}),
  Z('大沼泽',25,['frog','mosq','flayer'],'bg_jungle',{boss:'jadeguard',quest:'a3q1'}),
  Z('毒沼坑',26,['frog','corrupt','spider'],'bg_cave',{dun:1,side:1}),
  Z('雨林',26,['flayer','flshaman','hulk'],'bg_jungle',{boss:'flaychief',quest:'a3q2'}),
  Z('剥皮地窟',27,['flayer','flshaman','hulk'],'bg_cave',{dun:1,part:['a3q3','brain']}),
  Z('下城区',27,['hulk','flayer','frog'],'bg_village'),
  Z('集市',28,['zealot','mosq','hulk'],'bg_village'),
  Z('废弃神庙',28,['vamp','zealot','corrupt'],'bg_temple',{dun:1,boss:'tomekeeper',quest:'a3q4'}),
  Z('上城区',29,['zealot','priest','hulk'],'bg_village'),
  Z('旧城下水道',29,['corrupt','vamp','frog'],'bg_cave',{dun:1,part:['a3q3','heart']}),
  Z('堤道',30,['zealot','priest','flayer'],'bg_temple'),
  Z('议会厅',31,['zealot','priest'],'bg_temple',{w:6,bosses:['council1','council2','council3'],quest:'a3q5',part:['a3q3','flail']}),
  Z('憎恨之囚·一层',31,['vamp','priest','corrupt'],'bg_jail',{dun:1}),
  Z('憎恨之囚·二层',32,['vamp','zealot','priest'],'bg_jail',{dun:1}),
  Z('憎恨之囚·三层',33,['vamp','priest'],'bg_jail',{dun:1,w:4,boss:'mehet',quest:'a3q6',bl:1}),
 ]},
 {n:'第四章 · 炎狱之门',camp:'炼狱堡垒',boss:'恐惧魔君·瓦拉克斯',fq:'a4q3',zones:[
  Z('外围平原',33,['fiend','hound','storm'],'bg_hell',{w:6}),
  Z('绝望之地',34,['fiend','hound','knight'],'bg_hell',{w:6,boss:'fallen',quest:'a4q1'}),
  Z('诅咒之城',35,['knight','storm','venom'],'bg_hell',{w:7}),
  Z('熔火河',36,['venom','hound','pitlord'],'bg_hell',{w:7,boss:'forger',quest:'a4q2'}),
  Z('混沌圣所',37,['venom','knight','pitlord','storm'],'bg_hell',{dun:1,w:8,bl:3,boss:'valax',quest:'a4q3',
   bw:{3:{b:['seal1'],m:['storm','venom'],n:3},4:{b:['seal2'],m:['knight','fiend'],n:3},5:{b:['seal3'],m:['venom','hound'],n:3}}}),
 ]},
 {n:'第五章 · 霜峰之巅',camp:'雪峰要塞',boss:'毁灭领主·艾尔德隆',fq:'a5q6',zones:[
  Z('血丘',38,['minion','yeti','wolf'],'bg_snow',{boss:'siegelord',quest:'a5q1'}),
  Z('霜原高地',38,['minion','wolf','yeti'],'bg_snow',{quest:'a5q2'}),
  Z('冥渊裂隙',39,['horror','wraith'],'bg_ice',{dun:1,side:1}),
  Z('高原台地',39,['yeti','minion','siren'],'bg_snow'),
  Z('晶石隧道',39,['horror','yeti','wraith'],'bg_ice',{dun:1}),
  Z('冻河',40,['horror','wraith'],'bg_ice',{dun:1,boss:'frostjailer',quest:'a5q3'}),
  Z('苦痛殿堂',40,['wraith','minion','siren'],'bg_temple',{dun:1}),
  Z('哀嚎殿堂',41,['wraith','siren','horror'],'bg_temple',{dun:1,boss:'traitor',quest:'a5q4'}),
  Z('冰川小径',40,['horror','yeti','wolf'],'bg_ice',{dun:1}),
  Z('漂流者洞穴',41,['yeti','wraith'],'bg_ice',{dun:1,side:1}),
  Z('冻苔原',41,['mauler','wolf','siren'],'bg_snow'),
  Z('远古之路',42,['mauler','yeti','horror'],'bg_snow'),
  Z('冰窖',43,['horror','wraith'],'bg_ice',{dun:1,side:1}),
  Z('先祖峰顶',42,['mauler','yeti'],'bg_snow',{w:4,bosses:['anc1','anc2','anc3'],quest:'a5q5',solo:1}),
  Z('世石要塞·一层',43,['minion','mauler','siren'],'bg_temple',{dun:1}),
  Z('世石要塞·二层',43,['minion','wraith','horror'],'bg_temple',{dun:1}),
  Z('世石要塞·三层',44,['mauler','siren','minion'],'bg_temple',{dun:1}),
  Z('毁灭王座',44,['minion','mauler','siren'],'bg_temple',{dun:1,w:7,
   bw:{2:{b:['tw1'],m:['horror'],n:3},3:{b:['tw2'],m:['wraith'],n:3},4:{b:['tw3'],m:['minion'],n:3},5:{b:['tw4'],m:['siren','minion'],n:3},6:{b:['tw5'],m:['mauler','minion'],n:3}}}),
  Z('世界之心',45,['minion'],'bg_temple',{dun:1,w:2,boss:'eldron',quest:'a5q6',solo:1}),
 ]},
);
// 第二章起每区域波数 ×WX（不含有波次首领的区域与终点首领房），挂机节奏近似
const WX=1.8;
for(let a=0;a<ACTS.length;a++){ACTS[a].lock=0;for(const z of ACTS[a].zones){z.ml0=z.ml;if(a>0&&!z.bw&&z.w>2)z.w=Math.round(z.w*WX)}}

// ---------- 任务 ----------
for(const k of ['q1','q2','q3','q4','q5','q6'])QUESTS[k].act=0;
QUESTS.q2.rw='雇佣随从：荒原女射手（免费）+ 经验金币';QUESTS.q6.rw='解锁第二章';QUESTS.q6.fin=1;
Object.assign(QUESTS,{
 a2q1:{act:1,n:'下水道魔物',d:'击败 腐棺守卫·拉蒙',rw:'技能点 +1'},
 a2q2:{act:1,n:'合铸权杖',d:'收集 符文匣、权杖杖身、蛇首护符',rw:'开启真墓',parts:{cube:'符文匣',shaft:'权杖杖身',amulet:'蛇首护符'}},
 a2q3:{act:1,n:'蚀日',d:'击败蛇神殿的 碧鳞蛇后·纳迦',rw:'驱散日蚀（剧情）'},
 a2q4:{act:1,n:'秘术圣所',d:'肃清宫殿地窖，找到圣所入口',rw:'开启术士圣所',clear:1},
 a2q5:{act:1,n:'秘术士',d:'击败 秘术士·奥伦',rw:'得知真墓位置'},
 a2q6:{act:1,n:'七座古墓',d:'击败 沙渊之王·卡萨尔',rw:'解锁第三章',fin:1},
 a3q1:{act:2,n:'金鸟',d:'击败大沼泽的 翠羽守望者，取回翠玉鸟像',rw:'生命丹：永久最大生命 +20'},
 a3q2:{act:2,n:'古教之刃',d:'击败 剥皮酋长·古姆',rw:'魔法戒指'},
 a3q3:{act:2,n:'先知遗骸',d:'收集 先知之眼/脑/心/鞭',rw:'开启憎恨之囚',parts:{eye:'先知之眼',brain:'先知之脑',heart:'先知之心',flail:'先知之鞭'}},
 a3q4:{act:2,n:'禁忌之书',d:'击败废弃神庙的 书冢看守·赛勒',rw:'属性点 +5'},
 a3q5:{act:2,n:'黑暗议会',d:'击败三位黑袍议员',rw:'—'},
 a3q6:{act:2,n:'腐沼祭主',d:'击败 腐沼祭主·迈赫特',rw:'解锁第四章',fin:1},
 a4q1:{act:3,n:'堕翼者',d:'击败 堕翼者·伊扎恩',rw:'技能点 +2'},
 a4q2:{act:3,n:'熔炉',d:'击败 熔铸者·赫法，砸碎魂晶碎片',rw:'宝石×4 + 符文×1（随难度提升）'},
 a4q3:{act:3,n:'恐惧终结',d:'击破三座封印守卫，击败 恐惧魔君·瓦拉克斯',rw:'解锁第五章',fin:1},
 a5q1:{act:4,n:'围城',d:'击败 围城统领·申克',rw:'铁匠为一件物品加凹槽'},
 a5q2:{act:4,n:'救援囚兵',d:'肃清霜原高地，救出被俘士兵',rw:'符文×3',clear:1},
 a5q3:{act:4,n:'冰牢',d:'击败冻河的 冰封典狱·弗洛斯，救出巫女',rw:'永久所有抗性 +10'},
 a5q4:{act:4,n:'背叛',d:'击败 叛长老·尼萨',rw:'个性化一件物品'},
 a5q5:{act:4,n:'远古试炼',d:'同时击败三位远古英灵',rw:'大量经验'},
 a5q6:{act:4,n:'毁灭前夜',d:'击退王座五波守卫，于世界之心击败 毁灭领主·艾尔德隆',rw:'解锁下一难度',fin:1},
});

// ---------- 美术：第二~五章怪物/首领头像、章节战斗背景（assets/README.md） ----------
for(const k of ['beetle','husk','jackal','serpent','fly','vulture','tombmage','leaper','spider','mosq','flayer','flshaman','frog','hulk','zealot','priest','vamp','corrupt',
 'fiend','hound','knight','venom','storm','pitlord','yeti','horror','minion','siren','mauler','wolf','wraith']){ASSETS['m_'+k]='assets/monster/'+k+'.webp';MONS[k].a='m_'+k}
ASSETS.m_scarab='assets/monster/scarab.webp';// 装甲圣甲虫（备用/精英）
for(const k of ['rotwarden','fangqueen','summoner','kassar','jadeguard','flaychief','tomekeeper','council1','council2','council3','mehet','fallen','forger','seal1','seal2','seal3','valax',
 'siegelord','frostjailer','traitor','anc1','anc2','anc3','tw1','tw2','tw3','tw4','tw5','eldron']){ASSETS['b_'+k]='assets/boss/'+k+'.webp';BOSSES[k].a='b_'+k}
for(let i=1;i<=5;i++)ASSETS['bg_act'+i]='assets/bg/act'+i+'.webp';
