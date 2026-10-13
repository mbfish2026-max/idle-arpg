'use strict';
// ===== 美术资源映射：替换 assets/ 下同名文件即可生效；缺失时使用程序占位绘制 =====
const ASSETS={
 hero:'assets/char/necromancer_idle.webp',
 skeleton:'assets/summon/skeleton_warrior.webp', skmage:'assets/summon/skeleton_mage.webp',
 golem_cg:'assets/summon/golem_clay.webp', golem_bg:'assets/summon/golem_blood.webp', golem_ig:'assets/summon/golem_iron.webp', golem_fg:'assets/summon/golem_fire.webp', bonewall:'assets/summon/bone_wall.webp', revive:'assets/summon/revive.webp',
 m_imp:'assets/monster/imp.webp', m_shaman:'assets/monster/imp_shaman.webp', m_rat:'assets/monster/quill_rat.webp', m_zombie:'assets/monster/zombie.webp', m_skel:'assets/monster/skeleton_enemy.webp',
 m_rogue:'assets/monster/fallen_huntress.webp', m_archer:'assets/monster/shadow_archer.webp', m_ape:'assets/monster/rock_ape.webp', m_ghost:'assets/monster/ghost.webp', m_bat:'assets/monster/cave_bat.webp',
 b_raven:'assets/boss/blood_raven_huntress.webp', b_smith:'assets/boss/smith_ghost.webp', b_countess:'assets/boss/tower_mistress.webp', b_butcher:'assets/boss/hammer_butcher.webp', b_queen:'assets/boss/thorn_mother.webp',
 bg_moor:'assets/bg/moor.png', bg_cave:'assets/bg/cave.png', bg_grave:'assets/bg/graveyard.png', bg_forest:'assets/bg/forest.png', bg_village:'assets/bg/ruined_village.png',
 bg_tower:'assets/bg/tower.png', bg_monastery:'assets/bg/monastery.png', bg_jail:'assets/bg/jail.png', bg_cathedral:'assets/bg/cathedral.png', bg_catacomb:'assets/bg/catacomb.png',
 sk_sheet0:'assets/icon/skills_summon.png', sk_sheet1:'assets/icon/skills_bone.png', sk_sheet2:'assets/icon/skills_curse.png',
 items:'assets/icon/items_sheet.png', runes:'assets/icon/runes_gems_sheet.png', ui_stone:'assets/ui/stone_panel.png', ui_frame:'assets/ui/gold_frame.png',
};
// 精灵表：每张 skills_*.png 为 5x2 网格，按技能在本系顺序；items_sheet 4x3 按 SLOTICON 顺序
const SLOTS=['weapon','shield','helm','armor','gloves','belt','boots','amulet','ring1','ring2'];
const SLOTN={weapon:'武器',shield:'副手',helm:'头盔',armor:'铠甲',gloves:'手套',belt:'腰带',boots:'鞋子',amulet:'护符',ring1:'戒指',ring2:'戒指'};
const QN=['低劣','普通','超强','魔法','稀有','暗金','套装','合成','符文之语'];
const QC=['#8a8a8a','#e8e0d0','#e8e0d0','#6f8fff','#f2e05a','#c8a050','#3fdc4f','#ff9a30','#c8a050'];

// ===== 经验表（前 30 级取原版门槛，之后近似） =====
const XPT=[0,0,500,1500,3750,7875,14175,22680,32886,44396,57715,72144,90180,112725,140906,176132,220165,275207,344008,430010,537513,671891,839864,1049830,1312287,1640359,2050449,2563061,3203826,3902260,4663553];
function xpNeed(l){return l<XPT.length?XPT[l]:Math.floor(XPT[30]*Math.pow(1.19,l-30))}

// ===== 技能（t:系 0冥仆 1骨毒 2咒怨；row 对应需求 1/6/12/18/24/30；col 0-2）=====
const TREES=['冥仆系','骨毒系','咒怨系'];
const REQL=[1,6,12,18,24,30];
const SKILLS=[
 {id:'sm',t:0,n:'骨仆精通',r:1,col:0,pre:[],kind:'passive',ic:'☠'},
 {id:'rs',t:0,n:'唤起骨仆',r:1,col:1,pre:[],kind:'summon',ic:'💀',mana:L=>6},
 {id:'cg',t:0,n:'泥偶魔像',r:6,col:2,pre:[],kind:'golem',ic:'🗿',mana:L=>15},
 {id:'gm',t:0,n:'魔像精通',r:12,col:0,pre:['cg'],kind:'passive',ic:'⚙'},
 {id:'rm',t:0,n:'唤起骨巫',r:12,col:1,pre:['rs'],kind:'summon',ic:'🔮',mana:L=>8},
 {id:'bg',t:0,n:'血肉魔像',r:12,col:2,pre:['cg'],kind:'golem',ic:'🩸',mana:L=>25},
 {id:'sr',t:0,n:'冥仆抗性',r:24,col:0,pre:['gm'],kind:'passive',ic:'🛡'},
 {id:'ig',t:0,n:'钢骸魔像',r:24,col:2,pre:['bg'],kind:'golem',ic:'⛓',mana:L=>35},
 {id:'fg',t:0,n:'焚火魔像',r:30,col:2,pre:['ig'],kind:'golem',ic:'🔥',mana:L=>50},
 {id:'rv',t:0,n:'亡者复生',r:30,col:1,pre:['rm','ig'],kind:'summon',ic:'✝',mana:L=>45},
 {id:'te',t:1,n:'噬骨齿',r:1,col:1,pre:[],kind:'attack',ic:'🦷',mana:L=>3+0.5*(L-1)},
 {id:'ba',t:1,n:'骨铠',r:1,col:2,pre:[],kind:'buff',ic:'🦴',mana:L=>11+(L-1)},
 {id:'pd',t:1,n:'毒蚀刃',r:6,col:0,pre:[],kind:'attack',ic:'🗡',mana:L=>3+0.25*(L-1)},
 {id:'ce',t:1,n:'尸爆',r:6,col:1,pre:['te'],kind:'corpse',ic:'💥',mana:L=>15},
 {id:'bw',t:1,n:'骨墙',r:12,col:2,pre:['ba'],kind:'wall',ic:'🧱',mana:L=>17},
 {id:'pe',t:1,n:'毒爆',r:18,col:0,pre:['pd','ce'],kind:'corpse',ic:'☣',mana:L=>8+(L-1)},
 {id:'bs',t:1,n:'骨矛',r:18,col:1,pre:['ce'],kind:'attack',ic:'➶',mana:L=>7+0.25*(L-1)},
 {id:'bp',t:1,n:'骨牢',r:24,col:2,pre:['bs','bw'],kind:'cc',ic:'⛓',mana:L=>Math.max(8,27-(L-1))},
 {id:'pn',t:1,n:'毒新星',r:30,col:0,pre:['pe'],kind:'attack',ic:'✺',mana:L=>20+(L-1)},
 {id:'bx',t:1,n:'骨魂',r:30,col:1,pre:['bp'],kind:'attack',ic:'👻',mana:L=>12+(L-1)},
 {id:'ad',t:2,n:'碎骨咒',r:1,col:0,pre:[],kind:'curse',ic:'✖',mana:L=>4},
 {id:'dv',t:2,n:'昏目咒',r:6,col:2,pre:[],kind:'curse',ic:'◉',mana:L=>9},
 {id:'wk',t:2,n:'衰弱咒',r:6,col:1,pre:['ad'],kind:'curse',ic:'↓',mana:L=>4},
 {id:'im',t:2,n:'棘镜咒',r:12,col:0,pre:['ad'],kind:'curse',ic:'⚔',mana:L=>5},
 {id:'tr',t:2,n:'惊惧咒',r:12,col:1,pre:['wk'],kind:'curse',ic:'!',mana:L=>7},
 {id:'cf',t:2,n:'迷乱咒',r:18,col:2,pre:['dv'],kind:'curse',ic:'?',mana:L=>13},
 {id:'lt',t:2,n:'汲命咒',r:18,col:0,pre:['im'],kind:'curse',ic:'♥',mana:L=>9},
 {id:'at',t:2,n:'引诱咒',r:24,col:2,pre:['cf'],kind:'curse',ic:'◎',mana:L=>17},
 {id:'de',t:2,n:'衰老咒',r:24,col:1,pre:['tr'],kind:'curse',ic:'⌛',mana:L=>11},
 {id:'lr',t:2,n:'弱抗咒',r:30,col:0,pre:['lt','de'],kind:'curse',ic:'⚡',mana:L=>22},
];
const SKM=Object.fromEntries(SKILLS.map(s=>[s.id,s]));

// ===== 怪物（mechanics: hp/dmg 为 mlvl1 基准，ranged 远程，undead 亡灵，res 抗性%）=====
const MONS={
 imp:{n:'腐爪小鬼',hp:9,dmg:[1,3],ar:20,def:3,exp:10,a:'m_imp',ic:'👺'},
 shaman:{n:'小鬼巫祝',hp:11,dmg:[1,4],ar:15,def:2,exp:16,ranged:1,el:'fire',a:'m_shaman',ic:'🧙',res:{fire:25}},
 rat:{n:'棘背鼠',hp:8,dmg:[1,3],ar:18,def:4,exp:10,ranged:1,a:'m_rat',ic:'🦔',res:{pois:20}},
 zombie:{n:'行尸',hp:24,dmg:[2,5],ar:16,def:2,exp:14,undead:1,spd:0.6,a:'m_zombie',ic:'🧟',res:{pois:50}},
 skel:{n:'枯骨兵',hp:16,dmg:[1,4],ar:25,def:8,exp:13,undead:1,a:'m_skel',ic:'💀',res:{pois:75,cold:25}},
 rogue:{n:'堕落女卫',hp:18,dmg:[2,5],ar:30,def:6,exp:16,a:'m_rogue',ic:'🧝'},
 archer:{n:'暗影射手',hp:14,dmg:[1,5],ar:28,def:5,exp:16,ranged:1,a:'m_archer',ic:'🏹'},
 ape:{n:'岩背猿',hp:30,dmg:[2,6],ar:24,def:10,exp:20,a:'m_ape',ic:'🦍',res:{cold:30}},
 ghost:{n:'游魂',hp:15,dmg:[1,4],ar:25,def:20,exp:18,undead:1,el:'cold',a:'m_ghost',ic:'👻',res:{phys:50,pois:75}},
 bat:{n:'洞穴蝠',hp:8,dmg:[1,3],ar:22,def:6,exp:9,spd:1.6,a:'m_bat',ic:'🦇',res:{light:30}},
};
const BOSSES={
 raven:{n:'鸦血猎手·伊芙',hp:110,dmg:[3,9],ar:60,def:30,exp:400,ranged:1,el:'fire',a:'b_raven',ic:'🦅',undead:1,res:{fire:50,pois:50}},
 smith:{n:'铸匠亡魂',hp:160,dmg:[4,12],ar:70,def:40,exp:600,undead:1,a:'b_smith',ic:'⚒',res:{pois:75}},
 countess:{n:'烛塔女主人·薇欧拉',hp:140,dmg:[3,10],ar:70,def:30,exp:700,ranged:1,el:'fire',a:'b_countess',ic:'🕯',res:{fire:50}},
 butcher:{n:'熔锤屠夫',hp:190,dmg:[6,15],ar:80,def:50,exp:900,a:'b_butcher',ic:'🔨'},
 queen:{n:'荆棘之母·瑟拉维',hp:260,dmg:[6,18],ar:90,def:60,exp:4000,el:'pois',a:'b_queen',ic:'🕸',actboss:1,res:{fire:50,pois:50}},
};

// ===== 章节/区域 =====
const ACTS=[
 {n:'第一章 · 荒原之殇',camp:'流放者营地',boss:'荆棘之母·瑟拉维',zones:[
  {n:'荒血原野',ml:1,w:5,mons:['imp','zombie','rat'],bg:'bg_moor'},
  {n:'邪秽洞窟',ml:1,w:6,mons:['imp','shaman','bat'],bg:'bg_cave',quest:'q1',dun:1},
  {n:'寒风平原',ml:2,w:5,mons:['imp','zombie','rat','skel'],bg:'bg_moor'},
  {n:'冷泉洞',ml:2,w:5,mons:['bat','skel','imp'],bg:'bg_cave',dun:1,side:1},
  {n:'墓园坡地',ml:3,w:5,mons:['zombie','skel','ghost'],bg:'bg_grave',boss:'raven',quest:'q2'},
  {n:'寂静陵墓',ml:7,w:5,mons:['zombie','skel','ghost'],bg:'bg_grave',dun:1,side:1},
  {n:'碎石荒野',ml:4,w:5,mons:['imp','shaman','ape'],bg:'bg_moor'},
  {n:'幽暗密林',ml:5,w:5,mons:['ape','rogue','archer'],bg:'bg_forest'},
  {n:'坍颓村',ml:6,w:5,mons:['zombie','imp','skel'],bg:'bg_village',boss:'smith',quest:'q3'},
  {n:'黑沼泽',ml:6,w:5,mons:['rogue','archer','ghost'],bg:'bg_forest'},
  {n:'遗忘烛塔',ml:9,w:6,mons:['bat','ghost','skel'],bg:'bg_tower',boss:'countess',quest:'q4',dun:1},
  {n:'高原峭壁',ml:8,w:5,mons:['ape','rogue','archer'],bg:'bg_moor'},
  {n:'无底深坑',ml:7,w:5,mons:['bat','skel','shaman'],bg:'bg_cave',dun:1,side:1},
  {n:'修道院大门',ml:8,w:5,mons:['rogue','archer','ghost'],bg:'bg_monastery'},
  {n:'外回廊',ml:9,w:5,mons:['rogue','archer','zombie'],bg:'bg_monastery',dun:1},
  {n:'兵营',ml:9,w:6,mons:['rogue','skel','zombie'],bg:'bg_jail',boss:'butcher',quest:'q5',dun:1},
  {n:'地牢',ml:10,w:5,mons:['ghost','rogue','skel'],bg:'bg_jail',dun:1},
  {n:'内回廊',ml:10,w:5,mons:['rogue','archer','ghost'],bg:'bg_monastery',dun:1},
  {n:'圣骸大教堂',ml:11,w:5,mons:['ghost','rogue','skel','archer'],bg:'bg_cathedral',dun:1},
  {n:'地下墓穴',ml:11,w:6,mons:['ghost','rogue','archer','bat'],bg:'bg_catacomb',dun:1},
  {n:'墓穴深处',ml:12,w:4,mons:['rogue','ghost','archer'],bg:'bg_catacomb',boss:'queen',quest:'q6',dun:1},
 ]},
 {n:'第二章 · 沙海之墓',camp:'风蚀港',boss:'沙渊之王·卡萨尔',lock:1,zones:['碎岩荒地','港口下水道','干涸高地','远古墓群','绿洲','遗失之城','蛇谷','术士圣所','真墓'].map((n,i)=>({n,ml:13+i*1.5|0}))},
 {n:'第三章 · 腐沼神庙',camp:'雨林码头',boss:'腐沼祭主·迈赫特',lock:1,zones:['蛛林','大沼泽','雨林','旧城下水道','神殿区','议会厅','憎恨之囚'].map((n,i)=>({n,ml:26+i*1.6|0}))},
 {n:'第四章 · 炎狱之门',camp:'炼狱堡垒',boss:'恐惧魔君·瓦拉克斯',lock:1,zones:['外围平原','绝望之地','熔火河','混沌圣所'].map((n,i)=>({n,ml:36+i*3}))},
 {n:'第五章 · 霜峰之巅',camp:'雪峰要塞',boss:'毁灭领主·艾尔德隆',lock:1,zones:['血山','冰原','冰川','冻苔原','远古之路','毁灭王座','世界之心'].map((n,i)=>({n,ml:40+i*1.3|0}))},
];
const DIFFS=[{n:'普通',pen:0},{n:'噩梦',pen:-40,lock:1},{n:'地狱',pen:-100,lock:1}];
const QUESTS={
 q1:{n:'净化洞窟',d:'清空邪秽洞窟全部怪物',rw:'技能点 +1'},
 q2:{n:'堕落女猎手',d:'击败 鸦血猎手·伊芙',rw:'经验与金币(随从系统第二阶段)'},
 q3:{n:'寻找长老',d:'击败坍颓村的 铸匠亡魂 救出长老',rw:'魔法戒指'},
 q4:{n:'烛塔女主人',d:'击败 烛塔女主人·薇欧拉',rw:'必掉符文'},
 q5:{n:'匠魂之锤',d:'击败 熔锤屠夫',rw:'灌注：白色物品→稀有'},
 q6:{n:'荆棘之母',d:'击败 荆棘之母·瑟拉维',rw:'解锁第二章(第二阶段开放)'},
};

// ===== 基础类型：tier 0普通 1扩展 2精英；cat 用于符文之语底材 =====
const BASES=[
 // 武器
 {id:'wand1',s:'weapon',cat:'wand',n:'魔杖',q:2,dmg:[2,4],str:0,sock:[1,1,1],tier:0},
 {id:'wand2',s:'weapon',cat:'wand',n:'紫杉杖',q:12,dmg:[2,8],str:0,sock:[1,1,1],tier:0},
 {id:'wand3',s:'weapon',cat:'wand',n:'骨杖',q:18,dmg:[3,7],str:0,sock:[2,2,2],tier:0},
 {id:'wand4',s:'weapon',cat:'wand',n:'墓杖',q:26,dmg:[5,11],str:0,sock:[2,2,2],tier:0},
 {id:'wand5',s:'weapon',cat:'wand',n:'焦魂杖',q:38,dmg:[8,18],str:0,sock:[1,2,2],tier:1},
 {id:'wand6',s:'weapon',cat:'wand',n:'冥王杖',q:63,dmg:[18,33],str:0,sock:[2,2,2],tier:2},
 {id:'dag1',s:'weapon',cat:'dagger',n:'匕首',q:3,dmg:[1,4],str:0,dex:0,sock:[1,1,1],tier:0},
 {id:'dag2',s:'weapon',cat:'dagger',n:'短锋',q:9,dmg:[3,9],str:0,dex:25,sock:[1,1,1],tier:0},
 {id:'dag3',s:'weapon',cat:'dagger',n:'曲刃',q:17,dmg:[2,11],str:0,dex:45,sock:[2,3,3],tier:0},
 {id:'swd1',s:'weapon',cat:'sword',n:'短剑',q:1,dmg:[2,7],str:0,sock:[2,2,2],tier:0},
 {id:'swd2',s:'weapon',cat:'sword',n:'弯月刀',q:5,dmg:[3,8],str:0,dex:21,sock:[2,2,2],tier:0},
 {id:'swd3',s:'weapon',cat:'sword',n:'军刀',q:8,dmg:[3,8],str:25,dex:25,sock:[2,2,2],tier:0},
 {id:'swd4',s:'weapon',cat:'sword',n:'阔剑',q:12,dmg:[5,11],str:35,sock:[2,3,3],tier:0},
 {id:'swd5',s:'weapon',cat:'sword',n:'王者长剑',q:33,dmg:[10,22],str:50,sock:[2,3,4],tier:1},
 // 副手
 {id:'head1',s:'shield',cat:'head',n:'缩颅',q:4,def:[2,5],str:12,sock:[2,2,2],tier:0,cls:1},
 {id:'head2',s:'shield',cat:'head',n:'腐颅',q:8,def:[4,8],str:14,sock:[2,2,2],tier:0,cls:1},
 {id:'head3',s:'shield',cat:'head',n:'噬颅',q:16,def:[6,10],str:18,sock:[2,2,2],tier:0,cls:1},
 {id:'head4',s:'shield',cat:'head',n:'尸王颅',q:33,def:[40,53],str:58,sock:[2,2,2],tier:1,cls:1},
 {id:'head5',s:'shield',cat:'head',n:'夜魔颅',q:60,def:[96,113],str:106,sock:[2,2,2],tier:2,cls:1},
 {id:'shd1',s:'shield',cat:'shield',n:'小圆盾',q:1,def:[4,6],str:12,sock:[1,1,1],tier:0,block:20},
 {id:'shd2',s:'shield',cat:'shield',n:'鸢形盾',q:11,def:[12,14],str:47,sock:[2,2,2],tier:0,block:28},
 // 头盔
 {id:'hlm1',s:'helm',cat:'helm',n:'布帽',q:1,def:[3,5],str:0,sock:[2,2,2],tier:0},
 {id:'hlm2',s:'helm',cat:'helm',n:'骷髅盔',q:5,def:[8,11],str:15,sock:[2,2,2],tier:0},
 {id:'hlm3',s:'helm',cat:'helm',n:'铁盔',q:11,def:[15,18],str:26,sock:[2,2,2],tier:0},
 {id:'hlm4',s:'helm',cat:'helm',n:'战面盔',q:34,def:[52,62],str:58,sock:[2,2,3],tier:1},
 // 铠甲
 {id:'arm1',s:'armor',cat:'armor',n:'布袍',q:1,def:[8,11],str:12,sock:[2,2,2],tier:0},
 {id:'arm2',s:'armor',cat:'armor',n:'软皮甲',q:3,def:[14,17],str:15,sock:[2,2,2],tier:0},
 {id:'arm3',s:'armor',cat:'armor',n:'硬皮甲',q:5,def:[21,24],str:20,sock:[2,2,2],tier:0},
 {id:'arm4',s:'armor',cat:'armor',n:'镶钉甲',q:8,def:[27,30],str:27,sock:[2,2,2],tier:0},
 {id:'arm5',s:'armor',cat:'armor',n:'环甲',q:11,def:[45,48],str:36,sock:[2,3,3],tier:0},
 {id:'arm6',s:'armor',cat:'armor',n:'鳞甲',q:13,def:[57,60],str:44,sock:[2,3,3],tier:0},
 {id:'arm7',s:'armor',cat:'armor',n:'幽影甲',q:37,def:[108,128],str:61,sock:[2,3,3],tier:1},
 {id:'arm8',s:'armor',cat:'armor',n:'暗鳞甲',q:65,def:[260,300],str:94,sock:[2,3,4],tier:2},
 // 其他
 {id:'glv1',s:'gloves',n:'皮手套',q:3,def:[2,3],str:0,tier:0},{id:'glv2',s:'gloves',n:'重手套',q:7,def:[5,6],str:0,tier:0},{id:'glv3',s:'gloves',n:'链甲手套',q:12,def:[8,9],str:25,tier:0},
 {id:'blt1',s:'belt',n:'束带',q:3,def:[2,2],str:0,tier:0},{id:'blt2',s:'belt',n:'轻腰带',q:7,def:[3,3],str:0,tier:0},{id:'blt3',s:'belt',n:'腰带',q:12,def:[5,5],str:25,tier:0},
 {id:'bot1',s:'boots',n:'布靴',q:3,def:[2,3],str:0,tier:0},{id:'bot2',s:'boots',n:'重靴',q:7,def:[5,6],str:18,tier:0},{id:'bot3',s:'boots',n:'链甲靴',q:12,def:[8,9],str:30,tier:0},
 {id:'amu',s:'amulet',n:'护符',q:1,tier:0,jew:1},{id:'rin',s:'ring',n:'戒指',q:1,tier:0,jew:1},
];
const BASEM=Object.fromEntries(BASES.map(b=>[b.id,b]));
// 词缀分组：W武器 A防具(头/甲/副手/手/腰/鞋) J首饰 H缩颅 / 全部=*
// [名字, lvl, 适用, 键, min, max]
const PREFIX=[
 ['锋利的',1,'W','edmg',10,20],['致命的',5,'W','edmg',21,30],['凶残的',11,'W','edmg',31,40],['残暴的',16,'W','edmg',41,50],
 ['坚固的',1,'A','edef',10,20],['强韧的',6,'A','edef',21,30],['精工的',11,'A','edef',31,40],['神铸的',18,'A','edef',41,50],
 ['青铜的',1,'WJ','ar',10,20],['黑铁的',5,'WJ','ar',21,40],['精钢的',13,'WJ','ar',41,60],
 ['赤焰的',1,'AJ','fres',5,10],['烈焰的',12,'AJ','fres',11,20],['冰蓝的',1,'AJ','cres',5,10],['霜寒的',12,'AJ','cres',11,20],
 ['雷金的',1,'AJ','lres',5,10],['雷霆的',12,'AJ','lres',11,20],['碧毒的',1,'AJ','pres',5,10],['剧毒的',12,'AJ','pres',11,20],
 ['微光的',9,'AJH','allres',5,10],['虹彩的',17,'AJH','allres',11,15],
 ['蜥纹的',1,'JWH','mana',1,5],['蛇纹的',7,'JWH','mana',6,10],['蟒纹的',14,'JAH','mana',11,15],
 ['唤魂的',3,'WJH','t0sk',1,1],['骨刻的',3,'WJH','t1sk',1,1],['咒织的',3,'WJH','t2sk',1,1],['墓语者的',20,'WJH','allsk',1,1],
 ['嵌工的',1,'WA','sockp',1,2],['幸运的',12,'AJ','mf',5,10],
 ['尖锐的',4,'W','maxdmg',2,3],['精确的',8,'W','mindmg',1,2],
];
const SUFFIX=[
 ['力量之',1,'*','str',1,2],['刚毅之',8,'*','str',3,5],['灵巧之',1,'*','dex',1,2],['敏捷之',8,'*','dex',3,5],
 ['体魄之',1,'*','vit',1,2],['坚韧之',8,'*','vit',3,5],['精神之',1,'*','ene',1,3],['智慧之',8,'*','ene',4,6],
 ['豺狼之',1,'AJ','life',1,5],['灵狐之',7,'AJ','life',6,10],['孤狼之',13,'AJ','life',11,20],['猛虎之',20,'AJ','life',21,30],
 ['学徒之',3,'JWH','fcr',10,10],['秘法之',21,'JH','fcr',20,20],
 ['水蛭之',9,'WJ','ll',3,5],['夜蝠之',9,'WJ','ml',3,5],['贪婪之',5,'*','gf',10,40],['财运之',12,'AJ','mf',5,15],
 ['迅捷之',7,'WG','ias',10,10],['再生之',4,'AJ','regen',2,4],['渴魂之',6,'WJ','mpk',1,2],['铁壁之',2,'A','def',2,10],
 ['驱亡之',4,'W','undead',30,50],['烈火之',3,'W','firemin',1,4],['冰霜之',5,'W','coldmin',1,3],
];
// 键 → 显示
const MODT={str:'+{v} 力量',dex:'+{v} 敏捷',vit:'+{v} 体力',ene:'+{v} 精力',life:'+{v} 生命',mana:'+{v} 法力',ar:'+{v} 命中',
 edmg:'+{v}% 增强伤害',edef:'+{v}% 增强防御',def:'+{v} 防御',mindmg:'+{v} 最小伤害',maxdmg:'+{v} 最大伤害',
 fres:'火焰抗性 +{v}%',cres:'冰冷抗性 +{v}%',lres:'闪电抗性 +{v}%',pres:'毒素抗性 +{v}%',allres:'所有抗性 +{v}%',
 allsk:'+{v} 所有技能等级',t0sk:'+{v} 冥仆系技能',t1sk:'+{v} 骨毒系技能',t2sk:'+{v} 咒怨系技能',sockp:'凹槽 ({v})',
 mf:'{v}% 获得魔法装备几率提高',gf:'{v}% 额外金币',fcr:'+{v}% 施法速度',ll:'{v}% 生命偷取',ml:'{v}% 法力偷取',ias:'+{v}% 攻击速度',
 regen:'生命回复 +{v}/秒',mpk:'+{v} 法力/每次击杀',undead:'+{v}% 对亡灵伤害',firemin:'+{v} 火焰伤害',coldmin:'+{v} 冰冷伤害',lightmax:'+1-{v} 闪电伤害',poisdmg:'+{v} 毒素伤害(3秒)',
 tdef:'-{v}% 目标防御',dr:'伤害减少 {v}',mdr:'魔法伤害减少 {v}',fhr:'+{v}% 受击恢复',block:'+{v}% 格挡几率',thorns:'攻击者受到 {v} 伤害',mregen:'法力回复 +{v}%',
 lifepct:'+{v}% 最大生命',manapct:'+{v}% 最大法力',dmgmana:'{v}% 伤害转为法力',minres:'',sumlife:'召唤物 +{v}% 生命',sumdmg:'召唤物 +{v}% 伤害',
};
for(const s of SKILLS)MODT['sk_'+s.id]='+{v} '+s.n+'（亡灵术士专属）';
const HIDDEN_KEYS=new Set(['allsk','t0sk','t1sk','t2sk','ll','ml','mf','gf','fcr','ias','mpk','undead','tdef','dmgmana','thorns','sumlife','sumdmg','regen','mregen','dr','mdr','fhr'].concat(SKILLS.map(s=>'sk_'+s.id)));

// ===== 宝石：7 种 × 5 级，[武器, 防具, 盾] 效果 =====
const GEMG=['碎裂的','瑕疵的','','无瑕的','完美的'];
const GEMS={
 ame:{n:'紫晶',c:'#b060ff',w:g=>({ar:[40,60,80,100,150][g]}),a:g=>({str:[3,4,6,8,10][g]}),s:g=>({def:[8,12,18,24,30][g]})},
 top:{n:'黄玉',c:'#ffd040',w:g=>({lightmax:[8,14,22,30,40][g]}),a:g=>({mf:[9,13,16,20,24][g]}),s:g=>({lres:[12,16,22,28,40][g]})},
 sap:{n:'蓝玉',c:'#4080ff',w:g=>({coldmin:[1,3,4,6,10][g]}),a:g=>({mana:[10,17,24,31,38][g]}),s:g=>({cres:[12,16,22,28,40][g]})},
 eme:{n:'翠玉',c:'#40d060',w:g=>({poisdmg:[10,20,40,60,100][g]}),a:g=>({dex:[3,4,6,8,10][g]}),s:g=>({pres:[12,16,22,28,40][g]})},
 rub:{n:'赤玉',c:'#ff3030',w:g=>({firemin:[4,7,10,13,17][g]}),a:g=>({life:[10,17,24,31,38][g]}),s:g=>({fres:[12,16,22,28,40][g]})},
 dia:{n:'白钻',c:'#f0f0ff',w:g=>({undead:[28,34,44,54,68][g]}),a:g=>({ar:[20,40,60,80,100][g]}),s:g=>({allres:[6,8,11,14,19][g]})},
 sku:{n:'颅石',c:'#d0c8a0',w:g=>({ll:[2,2,3,3,4][g],ml:[1,2,2,3,3][g]}),a:g=>({regen:[2,3,3,4,5][g]}),s:g=>({thorns:[4,8,12,16,20][g]})},
};
// ===== 符文：[名, 需求等级, 武器效果, 防具效果(头/甲/盾同) ] =====
const RUNES=[
 ['晨',11,{ar:50},{def:15}],['曦',11,{undead:75,ar:50},{block:7}],['溪',13,{mpk:2},{mpk:2}],['澜',13,{ar:20},{def:30}],
 ['霁',15,{tdef:25},{mregen:15}],['锋',15,{maxdmg:9},{dmgmana:15}],['蚀',17,{poisdmg:75},{pres:30}],['炎',19,{firemin:12},{fres:30}],
 ['雷',21,{lightmax:50},{lres:30}],['霜',23,{coldmin:8},{cres:30}],['渴',25,{ll:7},{thorns:14}],['甲',27,{mindmg:9},{dr:7}],
 ['疾',29,{ias:20},{fhr:20}],['惧',31,{ar:30},{regen:7}],['简',33,{edmg:10},{edef:10}],
];
// ===== 符文之语 =====
const RUNEWORDS=[
 {n:'精钢',r:[2,0],cats:['sword','dagger'],lv:13,m:{ias:20,edmg:20,mindmg:3,maxdmg:3,ar:50,mpk:2}},
 {n:'天幕',r:[3,2],cats:['helm'],lv:13,m:{edef:50,def:10,str:5,mpk:2,gf:-33}},
 {n:'恶念',r:[5,0,4],cats:['wand','dagger','sword'],lv:15,m:{edmg:33,maxdmg:9,tdef:25,ar:50,def:-100}},
 {n:'潜影',r:[6,4],cats:['armor'],lv:17,m:{fcr:25,fhr:25,dex:6,mregen:15,pres:30,mdr:3}},
 {n:'古誓',r:[7,8,6],cats:['shield','head'],lv:21,m:{edef:50,allres:13,cres:30,dmgmana:10}},
 {n:'力能',r:[10,2],cats:['wand','dagger','sword'],lv:25,m:{edmg:35,ll:7,str:20,vit:10,mpk:2}},
 {n:'学识',r:[8,11],cats:['helm'],lv:27,m:{allsk:1,ene:10,lres:30,dr:7,mpk:2}},
 {n:'韵律',r:[12,4],cats:['shield','head'],lv:29,m:{allres:25,gf:50,mf:25,block:20,mregen:15}},
];
// ===== 暗金 =====
const UNIQUES=[
 {n:'腐根之咏',b:'wand1',lv:2,m:{t0sk:1,sk_rs:2,mana:10,edmg:[30,50],ll:3}},
 {n:'骨语者',b:'head1',lv:4,m:{sk_te:2,sk_bs:1,mana:20,fcr:10,allres:10}},
 {n:'守夜人的面纱',b:'hlm1',lv:3,m:{def:[10,15],ar:30,regen:2,mana:15}},
 {n:'荒原裹布',b:'arm1',lv:2,m:{edef:[40,60],ene:10,mana:20,mregen:15}},
 {n:'枯手',b:'glv1',lv:3,m:{ias:20,ll:3,dex:5,fres:20}},
 {n:'渡鸦之扣',b:'blt1',lv:4,m:{life:20,fhr:20,str:5,cres:15}},
 {n:'泥行者',b:'bot1',lv:5,m:{edef:[60,80],life:15,pres:30,mf:10}},
 {n:'暮光之戒',b:'rin',lv:7,m:{mf:[15,25],allres:5,mana:15}},
 {n:'哀泣护符',b:'amu',lv:10,m:{t1sk:1,fcr:10,life:20,lres:20}},
];
// ===== 套装 =====
const SETS={
 grave:{n:'掘墓人遗物',bonus:{2:{life:20},3:{allres:10},4:{allsk:1,mf:30}}},
 night:{n:'寒夜誓约',bonus:{2:{fcr:10,mana:20},3:{t1sk:1,sumdmg:25,allres:15}}},
};
const SETITEMS=[
 {n:'掘墓人的兜帽',set:'grave',b:'hlm2',lv:5,m:{def:15,life:10}},
 {n:'掘墓人的尸衣',set:'grave',b:'arm3',lv:6,m:{edef:40,vit:5}},
 {n:'掘墓人的铲柄手套',set:'grave',b:'glv1',lv:4,m:{str:5,regen:2}},
 {n:'掘墓人的绳腰带',set:'grave',b:'blt2',lv:7,m:{life:15,pres:15}},
 {n:'寒夜·骨杖',set:'night',b:'wand1',lv:5,m:{sk_rs:1,mana:15,cres:10}},
 {n:'寒夜·冷颅',set:'night',b:'head1',lv:6,m:{sk_ad:1,def:10,cres:20}},
 {n:'寒夜·冰链',set:'night',b:'amu',lv:8,m:{ene:10,cres:20,mregen:20}},
];
const RARE_A=['暮','血','骨','魂','冥','灰','夜','荆','渊','腐','霜','鸦'],RARE_B={weapon:['之咬','之喉','之牙','之殇'],shield:['之颅','之守','之面'],helm:['之冠','之盔','之眼'],armor:['之壳','之袍','之鳞'],gloves:['之爪','之握','之掌'],belt:['之环','之链','之扣'],boots:['之踵','之行','之履'],amulet:['之心','之印','之泪'],ring:['之环','之誓','之结']};
