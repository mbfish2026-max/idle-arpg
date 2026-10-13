'use strict';
// ===================================================================================
// data_items.js — 装备 / 掉落 / 符文 / 合成 数据（覆盖 data.js 中同名表，原地修改以保持 const 引用）
// 机制数字来自公开的 1.13 数据表（armor/weapons/itemtypes/magicprefix/magicsuffix/itemratio/
// treasureclassex/runes/gems/cubemain）。所有物品/词缀/套装/符文名称均为本作原创。
// 标注 (近似) 的地方为挂机化或简化处理。
// ===================================================================================

// ---------- 基础类型 ----------
// gs = 原版 gemsockets；TCAP = 物品类型凹槽上限 [ilvl1-25, 26-40, 41+]；sock 由两者取小
const TCAP={wand:[2,2,2],dagger:[2,3,3],sword:[3,4,6],head:[2,3,3],shield:[3,3,4],helm:[2,2,3],armor:[3,4,6],gloves:[0,0,0],belt:[0,0,0],boots:[0,0,0]};
const NECRO_BLOCK=20; // 原版职业格挡加成（亡灵术士 20），盾/缩颅的 block 字段已含此值
function _B(id,s,cat,n,q,tier,o){const b=Object.assign({id,s,cat,n,q,tier,str:0},o);const cap=TCAP[cat]||[0,0,0];b.sock=cap.map(c=>Math.min(c,o.gs||0));if(b.block!=null)b.block+=NECRO_BLOCK;delete b.gs;return b}
const W=(id,cat,n,q,t,dmg,str,dex,gs)=>_B(id,'weapon',cat,n,q,t,{dmg,str,dex:dex||0,gs});
const A=(id,s,cat,n,q,t,def,str,gs,blk)=>_B(id,s,cat,n,q,t,Object.assign({def,str,gs:gs||0},blk!=null?{block:blk}:{},cat==='head'?{cls:1}:{}));
const NEW_BASES=[
 // 魔杖（普通 / 扩展 / 精英）
 W('wand1','wand','魔杖',2,0,[2,4],0,0,1), W('wand2','wand','紫杉杖',12,0,[2,8],0,0,1), W('wand3','wand','骨杖',18,0,[3,7],0,0,2), W('wand4','wand','墓杖',26,0,[5,11],0,0,2),
 W('wand5','wand','焦魂杖',31,1,[8,18],25,0,1), W('wandx2','wand','石化杖',38,1,[8,24],25,0,2), W('wandx3','wand','冢骨杖',43,1,[10,22],25,0,2), W('wandx4','wand','掘冢杖',49,1,[13,29],25,0,2),
 W('wand6','wand','冥王杖',55,2,[18,33],25,0,2), W('wande2','wand','幽魂杖',65,2,[20,40],25,0,2), W('wande3','wand','巫妖杖',75,2,[10,31],25,0,2), W('wande4','wand','出土杖',86,2,[22,28],25,0,2),
 // 匕首
 W('dag1','dagger','匕首',3,0,[1,4],0,0,1), W('dag2','dagger','短锋',9,0,[3,9],0,25,1), W('dag3','dagger','曲刃',17,0,[2,11],0,45,3), W('dag4','dagger','薄刃',23,0,[4,15],35,51,2),
 W('dagx1','dagger','穿甲锥',31,1,[6,18],25,0,1), W('dagx3','dagger','五指刃',42,1,[15,31],25,88,3),
 W('dage1','dagger','骨刃',58,2,[23,49],38,75,1), W('dage2','dagger','秘银刺',70,2,[37,53],55,98,1),
 // 剑
 W('swd1','sword','短剑',1,0,[2,7],0,0,2), W('swd2','sword','弯月刀',5,0,[2,6],0,21,2), W('swd3','sword','军刀',8,0,[3,8],25,25,2), W('swd6','sword','水晶剑',11,0,[5,15],43,0,6),
 W('swd4','sword','阔剑',15,0,[7,14],48,0,4), W('swd5','sword','角斗剑',30,1,[8,22],25,0,2), W('swdx2','sword','弯月战刃',37,1,[16,35],70,42,2), W('swdx3','sword','维度之刃',37,1,[13,35],85,60,6),
 W('swde1','sword','鹰嘴弯刀',56,2,[31,59],150,88,2), W('swde2','sword','幻相刃',73,2,[31,35],25,136,6),
 // 缩颅（亡灵术士专属副手）
 A('head1','shield','head','缩颅',4,0,[2,5],12,2,3), A('head2','shield','head','腐颅',8,0,[4,8],14,2,5), A('head3','shield','head','噬颅',16,0,[6,10],18,2,8),
 A('headn4','shield','head','石像颅',20,0,[10,16],20,2,10), A('headn5','shield','head','魔首颅',24,0,[15,20],25,2,12),
 A('head4','shield','head','尸王颅',33,1,[38,48],38,2,3), A('headx3','shield','head','司祭颅',45,1,[44,55],47,2,8), A('headx5','shield','head','圣徒颅',54,1,[58,70],58,2,12),
 A('head5','shield','head','夜魔颅',59,2,[95,139],77,2,3), A('heade3','shield','head','魅魔颅',81,2,[100,146],95,2,10), A('heade4','shield','head','血主颅',85,2,[103,148],106,2,12),
 // 盾
 A('shd1','shield','shield','小圆盾',1,0,[4,6],12,1,0), A('shd3','shield','shield','小盾',5,0,[8,10],22,2,5), A('shd2','shield','shield','大方盾',11,0,[12,14],34,3,12), A('shd4','shield','shield','骨盾',19,0,[10,30],25,2,20),
 A('shdx1','shield','shield','护卫盾',34,1,[41,49],38,1,10), A('shdx2','shield','shield','狰狞盾',48,1,[50,150],58,2,20),
 A('shde1','shield','shield','加热盾',58,2,[95,110],77,2,22), A('shde2','shield','shield','巨魔巢盾',76,2,[158,173],106,3,20), A('shde3','shield','shield','君主盾',72,2,[133,148],156,4,22),
 // 头盔
 A('hlm1','helm','helm','布帽',1,0,[3,5],0,2), A('hlm2','helm','helm','骷髅盔',5,0,[8,11],15,2), A('hlm3','helm','helm','铁盔',11,0,[15,18],26,2), A('hlm5','helm','helm','全盔',15,0,[23,26],41,2),
 A('hlm6','helm','helm','面具',19,0,[9,27],23,3), A('hlm7','helm','helm','骨盔',22,0,[33,36],25,2),
 A('hlm4','helm','helm','战帽',34,1,[45,53],20,2), A('hlmx2','helm','helm','轻盔',37,1,[52,62],43,2), A('hlmx3','helm','helm','死亡面具',48,1,[54,86],55,3), A('hlmx4','helm','helm','狰狞盔',50,1,[60,125],58,2),
 A('hlme1','helm','helm','高顶冠',58,2,[98,141],50,2), A('hlme2','helm','helm','魔首冠',74,2,[101,154],102,3), A('hlme3','helm','helm','骨面盔',84,2,[100,157],106,3),
 // 铠甲
 A('arm1','armor','armor','布袍',1,0,[8,11],12,2), A('arm2','armor','armor','软皮甲',3,0,[14,17],15,2), A('arm3','armor','armor','硬皮甲',5,0,[21,24],20,2), A('arm4','armor','armor','镶钉甲',8,0,[32,35],27,2),
 A('arm5','armor','armor','环甲',11,0,[45,48],36,3), A('arm6','armor','armor','鳞甲',13,0,[57,60],44,2), A('arm9','armor','armor','胸甲',18,0,[65,68],30,3), A('arm10','armor','armor','板甲',24,0,[108,116],65,2),
 A('arm12','armor','armor','哥特板甲',32,0,[128,135],70,4), A('arm11','armor','armor','轻板甲',35,0,[90,107],41,3),
 A('arm7','armor','armor','幽影甲',34,1,[102,117],38,2), A('armx2','armor','armor','蛇皮甲',36,1,[111,126],43,2), A('armx3','armor','armor','魔皮甲',37,1,[122,136],50,2), A('armx5','armor','armor','网链甲',45,1,[198,213],92,3), A('armx4','armor','armor','法师板甲',60,1,[225,261],55,3),
 A('arm8','armor','armor','暮色裹布',65,2,[361,467],77,4), A('arme2','armor','armor','骨织甲',62,2,[399,505],158,4), A('arme3','armor','armor','执政板甲',84,2,[410,524],103,4),
 // 手套 / 腰带 / 鞋（无凹槽）
 A('glv1','gloves','gloves','皮手套',3,0,[2,3],0), A('glv2','gloves','gloves','重手套',7,0,[5,6],0), A('glv3','gloves','gloves','链甲护腕',12,0,[8,9],25), A('glv4','gloves','gloves','轻护手',20,0,[9,11],45), A('glv5','gloves','gloves','臂铠',27,0,[12,15],60),
 A('glvx1','gloves','gloves','魔皮手套',33,1,[28,35],20), A('glvx2','gloves','gloves','鲨皮手套',39,1,[33,39],20), A('glvx3','gloves','gloves','重护腕',43,1,[37,44],58),
 A('glve1','gloves','gloves','荆棘手套',57,2,[54,62],50), A('glve2','gloves','gloves','血骨手套',63,2,[56,65],50), A('glve3','gloves','gloves','钢臂甲',69,2,[59,67],106),
 A('blt1','belt','belt','束带',3,0,[2,2],0), A('blt2','belt','belt','轻腰带',7,0,[3,3],0), A('blt3','belt','belt','腰带',12,0,[5,5],25), A('blt4','belt','belt','重腰带',20,0,[6,6],45), A('blt5','belt','belt','板带',27,0,[8,11],60),
 A('bltx1','belt','belt','魔皮束带',36,1,[29,34],20), A('bltx2','belt','belt','鲨皮腰带',39,1,[31,36],20), A('bltx3','belt','belt','网链腰带',43,1,[35,40],58),
 A('blte1','belt','belt','蛛丝腰带',61,2,[55,62],50), A('blte2','belt','belt','血牙腰带',68,2,[56,63],50), A('blte3','belt','belt','秘银环带',75,2,[58,65],106),
 A('bot1','boots','boots','皮靴',3,0,[2,3],0), A('bot2','boots','boots','重靴',7,0,[5,6],18), A('bot3','boots','boots','链甲靴',12,0,[8,9],30), A('bot4','boots','boots','轻板靴',20,0,[9,11],50), A('bot5','boots','boots','板靴',27,0,[12,15],70),
 A('botx1','boots','boots','魔皮靴',36,1,[28,35],20), A('botx2','boots','boots','鲨皮靴',39,1,[33,39],47), A('botx3','boots','boots','网链靴',43,1,[37,44],65),
 A('bote1','boots','boots','龙鳞靴',60,2,[54,62],50), A('bote2','boots','boots','甲虫靴',66,2,[56,65],91), A('bote3','boots','boots','骨织靴',72,2,[59,67],118),
 // 首饰
 {id:'amu',s:'amulet',cat:'amulet',n:'护符',q:1,tier:0,jew:1,str:0}, {id:'rin',s:'ring',cat:'ring',n:'戒指',q:1,tier:0,jew:1,str:0},
];
BASES.length=0;for(const b of NEW_BASES)BASES.push(b);
for(const k in BASEM)delete BASEM[k];for(const b of BASES)BASEM[b.id]=b;
// 原版 itemtype 继承关系（词缀 itype/etype 用）
const ITYPES={wand:['weap','mele','wand','rod'],dagger:['weap','mele','knif'],sword:['weap','mele','swor'],head:['armo','shld','head'],shield:['armo','shld','shie'],
 helm:['armo','helm'],armor:['armo','tors'],gloves:['armo','glov'],belt:['armo','belt'],boots:['armo','boot'],amulet:['amul'],ring:['ring']};

// ---------- 词缀 ----------
// {n 名, lv 词缀等级(alvl门槛), rq 需求等级, it 可出现类型, ex 排除类型, g 组(同组互斥), m:{键:[min,max]}}
const AF=(n,lv,rq,g,it,m,ex)=>({n,lv,rq,g,it:it.split(','),ex:ex?ex.split(','):[],m});
const NEW_PREFIX=[
 // 增强防御 (ac%)
 AF('坚固的',1,1,'ac%','armo',{edef:[10,20]}),AF('结实的',4,3,'ac%','armo',{edef:[21,30]}),AF('强韧的',9,6,'ac%','armo',{edef:[31,40]}),AF('荣耀的',19,14,'ac%','armo',{edef:[41,50]}),
 AF('祝福的',25,18,'ac%','armo',{edef:[51,65]}),AF('圣洁的',31,23,'ac%','armo',{edef:[66,80]}),AF('神圣的',36,27,'ac%','armo',{edef:[81,100]}),AF('神铸的',45,38,'ac%','armo',{edef:[101,200]}),
 // 增强伤害 (dmg%)，原版魔杖不可出现
 AF('锋利的',1,1,'dmg%','weap',{edmg:[10,20]},'wand'),AF('致命的',5,3,'dmg%','weap',{edmg:[21,30]},'wand'),AF('凶残的',8,6,'dmg%','weap',{edmg:[31,40]},'wand'),AF('残暴的',14,10,'dmg%','weap',{edmg:[41,50]},'wand'),
 AF('巨力的',20,15,'dmg%','weap',{edmg:[51,65]},'wand'),AF('野蛮的',26,19,'dmg%','weap',{edmg:[66,80]},'wand'),AF('无情的',32,24,'dmg%','weap',{edmg:[81,100]},'wand'),AF('狂怒的',41,33,'dmg%','weap',{edmg:[101,200]},'wand'),AF('酷虐的',51,43,'dmg%','weap',{edmg:[201,300]},'wand'),
 // 命中
 AF('青铜的',1,1,'att','weap,ring,glov,amul',{ar:[10,20]},'wand'),AF('黑铁的',4,3,'att','weap,ring',{ar:[21,40]},'wand'),AF('精钢的',8,6,'att','weap,ring',{ar:[41,60]},'wand'),AF('白银的',12,9,'att','weap,ring',{ar:[61,80]},'wand'),
 AF('黄金的',17,12,'att','weap,ring',{ar:[81,100]},'wand'),AF('白金的',22,16,'att','weap,ring',{ar:[101,120]},'wand'),AF('陨铁的',27,20,'att','weap',{ar:[121,150]},'wand'),AF('奇异的',32,24,'att','weap',{ar:[151,300]},'wand'),
 // 命中+增强伤害 混合
 AF('锐利的',5,3,'attdmg','weap',{ar:[10,20],edmg:[10,20]},'wand'),AF('精巧的',12,9,'attdmg','weap',{ar:[21,40],edmg:[21,30]},'wand'),AF('战士的',19,13,'attdmg','weap',{ar:[41,60],edmg:[31,40]},'wand'),
 AF('士兵的',27,19,'attdmg','weap',{ar:[61,80],edmg:[41,50]},'wand'),AF('骑士的',38,30,'attdmg','weap',{ar:[81,100],edmg:[51,65]},'wand'),AF('领主的',47,39,'attdmg','weap',{ar:[101,120],edmg:[66,80]},'wand'),AF('王者的',56,48,'attdmg','weap',{ar:[121,150],edmg:[81,100]},'wand'),
 // 法力
 AF('蜥纹的',3,2,'mana','armo,ring,amul,rod',{mana:[3,5]},'boot,glov'),AF('蛇纹的',6,4,'mana','shld,rod,belt,ring',{mana:[5,10]}),AF('蟒纹的',14,10,'mana','shld,rod,belt,ring',{mana:[11,20]}),
 AF('幼龙的',20,15,'mana','rod,ring,amul',{mana:[21,30]}),AF('巨龙的',24,18,'mana','rod,ring,amul',{mana:[31,40]}),AF('古龙的',30,22,'mana','rod,ring,amul',{mana:[41,60]}),AF('龙王的',37,29,'mana','rod,ring,amul',{mana:[61,90]}),
 // 全抗（原版仅盾类，含缩颅）
 AF('微光的',6,4,'resall','shld',{allres:[3,7]}),AF('虹彩的',18,13,'resall','shld',{allres:[8,11]}),AF('闪耀的',28,21,'resall','shld',{allres:[12,15]}),AF('棱彩的',39,31,'resall','shld',{allres:[16,20]}),AF('炫彩的',50,42,'resall','shld',{allres:[21,30]}),
 // 单抗
 AF('冰蓝的',5,3,'rcold','armo,weap,ring,amul',{cres:[5,10]}),AF('青金的',12,9,'rcold','armo,ring,amul',{cres:[11,20]}),AF('钴蓝的',18,13,'rcold','armo,ring,amul',{cres:[21,30]}),AF('苍玉的',25,18,'rcold','boot,amul,rod',{cres:[31,40]}),
 AF('赤焰的',5,3,'rfire','armo,ring,amul',{fres:[5,10]}),AF('赭红的',12,9,'rfire','armo,ring,amul',{fres:[11,20]}),AF('石榴的',18,13,'rfire','armo,ring,amul',{fres:[21,30]}),AF('炽红的',25,18,'rfire','boot,amul,rod',{fres:[31,40]}),
 AF('雷金的',5,3,'rltng','armo,weap,ring,amul',{lres:[5,10]}),AF('赭黄的',12,9,'rltng','armo,ring,amul',{lres:[11,20]}),AF('珊瑚的',18,13,'rltng','armo,ring,amul',{lres:[21,30]}),AF('琥珀的',25,18,'rltng','boot,amul,rod',{lres:[31,40]}),
 AF('碧毒的',5,3,'rpois','armo,weap,ring,amul',{pres:[5,10]}),AF('翠绿的',12,9,'rpois','armo,ring,amul',{pres:[11,20]}),AF('玉石的',18,13,'rpois','armo,ring,amul',{pres:[21,30]}),AF('翡翠的',25,18,'rpois','boot,amul,rod',{pres:[31,40]}),
 // 法力/击杀
 AF('胜利的',3,2,'mpk','weap,ring',{mpk:[1,1]}),AF('凯旋的',17,12,'mpk','weap',{mpk:[2,5]}),
 // 凹槽
 AF('嵌工的',10,7,'sock','weap,shld,helm,tors',{sockp:[1,2]}),AF('匠师的',33,25,'sock','weap,shld,helm,tors',{sockp:[3,3]}),AF('宝匠的',55,47,'sock','weap,shld,helm,tors',{sockp:[4,4]}),
 // 寻宝
 AF('幸运的',5,3,'mag','ring,amul',{mf:[5,10]}),AF('鸿运的',12,8,'mag','ring,amul',{mf:[11,15]}),
 // 系别技能 / 职业技能（同一组互斥）
 AF('唤魂的',20,15,'skill','wand,head,amul',{t0sk:[1,1]}),AF('冥仆的',40,30,'skill','wand,head,amul',{t0sk:[2,2]}),AF('冥主的',60,45,'skill','wand,head,amul',{t0sk:[3,3]}),
 AF('骨刻的',20,15,'skill','wand,head,amul,knif',{t1sk:[1,1]}),AF('骨蚀的',40,30,'skill','wand,head,amul,knif',{t1sk:[2,2]}),AF('骨灾的',60,45,'skill','wand,head,amul,knif',{t1sk:[3,3]}),
 AF('咒织的',20,15,'skill','wand,head,amul',{t2sk:[1,1]}),AF('咒缚的',40,30,'skill','wand,head,amul',{t2sk:[2,2]}),AF('咒魔的',60,45,'skill','wand,head,amul',{t2sk:[3,3]}),
 AF('召魂者的',36,27,'skill','amul',{allsk:[1,1]}),AF('墓语者的',90,67,'skill','amul',{allsk:[2,2]}),
 // 对亡灵 / 毒伤
 AF('洁净的',1,1,'undead','weap',{undead:[25,75]},'wand'),AF('纯净的',15,11,'undead','weap',{undead:[76,125]},'wand'),AF('圣化的',25,18,'undead','weap',{undead:[126,200]},'wand'),
 AF('腐毒的',1,1,'pois','weap',{poisdmg:[31,31]}),AF('淬毒的',10,7,'pois','weap',{poisdmg:[41,41]}),AF('蚀骨的',20,15,'pois','weap',{poisdmg:[205,205]}),AF('剧毒的',35,26,'pois','weap',{poisdmg:[308,308]}),
];
const NEW_SUFFIX=[
 AF('力量之',1,1,'str','amul,belt',{str:[1,2]}),AF('威能之',10,8,'str','amul,belt',{str:[3,5]}),AF('公牛之',26,19,'str','amul,belt',{str:[6,9]}),AF('巨人之',42,34,'str','amul,belt',{str:[10,15]}),AF('泰坦之',58,50,'str','amul,belt',{str:[16,20]}),
 AF('膂力之',5,3,'str','ring,tors',{str:[1,2]}),AF('蛮力之',21,15,'str','ring,tors',{str:[3,5]}),AF('臂力之',12,8,'str','mele,glov,shld',{str:[1,2]}),AF('猛力之',33,25,'str','mele,glov,shld',{str:[3,5]}),
 AF('灵巧之',1,1,'dex','amul',{dex:[1,2]}),AF('技艺之',11,8,'dex','amul',{dex:[3,5]}),AF('精准之',27,20,'dex','amul',{dex:[6,9]}),AF('极准之',43,35,'dex','amul',{dex:[10,15]}),
 AF('轻巧之',6,4,'dex','ring,glov',{dex:[1,2]}),AF('敏捷之',22,16,'dex','ring,glov',{dex:[3,5]}),AF('轻灵之',13,9,'dex','tors,boot',{dex:[2,3]},'glov'),AF('迅灵之',34,26,'dex','tors,boot',{dex:[4,5]},'glov'),
 AF('精神之',1,1,'enr','amul,wand',{ene:[1,3]}),AF('心智之',7,3,'enr','amul,wand',{ene:[4,6]}),AF('才华之',13,9,'enr','amul,wand',{ene:[7,10]}),AF('巫术之',21,16,'enr','amul,wand',{ene:[11,15]}),AF('法师之',31,23,'enr','amul,wand',{ene:[16,20]}),
 AF('灵思之',7,5,'enr','ring',{ene:[1,3]}),AF('灵悟之',13,9,'enr','ring',{ene:[4,6]}),AF('明思之',4,3,'enr','helm',{ene:[1,3]}),AF('明悟之',10,7,'enr','helm',{ene:[4,6]}),AF('明慧之',16,12,'enr','helm',{ene:[7,10]}),
 AF('豺狼之',1,1,'hp','tors,belt,amul',{life:[1,5]}),AF('灵狐之',7,5,'hp','tors,belt,amul',{life:[6,10]}),AF('孤狼之',15,11,'hp','tors,belt,amul',{life:[11,20]}),AF('猛虎之',20,15,'hp','tors,belt,amul',{life:[21,30]}),
 AF('猛犸之',25,18,'hp','tors,belt,amul',{life:[31,40]}),AF('巨像之',30,22,'hp','tors,belt,amul',{life:[41,60]}),AF('海妖之',40,30,'hp','tors,belt,amul',{life:[61,80]}),AF('巨鲸之',50,37,'hp','tors,belt,amul',{life:[81,100]}),
 AF('护体之',4,3,'hp','shld',{life:[1,5]}),AF('护魂之',11,8,'hp','shld',{life:[6,10]}),AF('护命之',27,20,'hp','shld',{life:[11,20]}),AF('环佑之',8,6,'hp','ring',{life:[1,5]}),AF('环护之',17,13,'hp','ring',{life:[6,10]}),
 AF('学徒之',5,3,'fcr','rod,ring,amul',{fcr:[10,10]}),AF('秘法之',29,21,'fcr','rod',{fcr:[20,20]}),
 AF('平衡之',5,3,'fhr','armo',{fhr:[10,10]},'glov'),AF('稳固之',9,6,'fhr','tors,belt,shld',{fhr:[17,17]}),
 AF('水蛭之',6,4,'ll','weap',{ll:[4,5]}),AF('蝗群之',20,15,'ll','mele',{ll:[6,7]}),AF('血环之',14,10,'ll','ring',{ll:[3,4]}),AF('血掌之',34,26,'ll','glov',{ll:[3,3]}),
 AF('夜蝠之',7,4,'ml','weap',{ml:[4,5]}),AF('怨灵之',21,16,'ml','mele',{ml:[6,7]}),AF('蝠符之',15,11,'ml','amul',{ml:[3,4]}),AF('蝠掌之',35,27,'ml','glov',{ml:[3,3]}),
 AF('贪婪之',1,1,'gold','ring,amul',{gf:[25,40]}),AF('富足之',17,12,'gold','boot,glov,belt,amul',{gf:[41,80]}),
 AF('机缘之',12,9,'mag','boot,glov,ring,amul',{mf:[5,15]}),AF('财运之',16,12,'mag','boot,glov,amul',{mf:[16,25]}),AF('洪福之',26,19,'mag','boot,amul',{mf:[26,35]}),
 AF('迅捷之',5,3,'ias','weap',{ias:[10,10]},'wand'),AF('疾速之',25,17,'ias','weap',{ias:[20,20]},'wand'),AF('灵手之',20,15,'ias','glov',{ias:[10,10]}),
 AF('再生之',10,7,'regen','belt,ring,amul',{regen:[3,5]}),AF('复苏之',17,12,'regen','amul',{regen:[6,10]}),AF('愈合之',40,30,'regen','shld,glov',{regen:[3,5]}),
 AF('荆刺之',14,10,'thorns','tors,shld,belt',{thorns:[1,3]}),AF('尖刺之',21,15,'thorns','tors,shld,belt',{thorns:[4,6]}),AF('利刃之',34,26,'thorns','tors,shld',{thorns:[7,9]}),
 AF('康健之',7,5,'dr','tors,shld,ring,amul',{dr:[1,1]}),AF('守护之',18,13,'dr','ring,amul',{dr:[2,2]}),AF('吸收之',26,19,'dr','amul',{dr:[3,3]}),
 AF('护法之',7,5,'mdr','tors,shld,ring,amul',{mdr:[1,1]}),AF('哨卫之',18,12,'mdr','ring,amul',{mdr:[2,2]}),AF('结界之',26,19,'mdr','amul',{mdr:[3,3]}),
 AF('格挡之',1,1,'block','shld',{block:[10,10]}),AF('偏折之',11,8,'block','shld',{block:[20,20]}),
 AF('火苗之',4,3,'fire','weap',{firemin:[2,4]},'wand'),AF('烈火之',15,11,'fire','weap',{firemin:[4,8]},'wand'),AF('焚烧之',25,18,'fire','weap',{firemin:[8,15]},'wand'),
 AF('冰霜之',1,1,'cold','weap',{coldmin:[1,1]},'wand'),
 AF('工匠之',1,1,'dmax','weap,ring,amul',{maxdmg:[1,1]},'wand'),AF('品质之',4,3,'dmax','weap',{maxdmg:[2,2]},'wand'),AF('致残之',7,5,'dmax','weap',{maxdmg:[3,4]},'wand'),AF('屠杀之',11,8,'dmax','weap',{maxdmg:[5,7]},'wand'),
 AF('血腥之',14,10,'dmax','weap',{maxdmg:[8,10]},'wand'),AF('杀戮之',19,14,'dmax','weap',{maxdmg:[11,14]},'wand'),AF('屠戮之',25,18,'dmax','weap',{maxdmg:[15,20]},'wand'),
 AF('价值之',1,1,'dmin','weap',{mindmg:[1,2]},'wand'),AF('度量之',12,9,'dmin','weap',{mindmg:[3,4]},'wand'),AF('卓越之',24,18,'dmin','weap',{mindmg:[5,8]},'wand'),
];
PREFIX.length=0;for(const a of NEW_PREFIX)PREFIX.push(a);SUFFIX.length=0;for(const a of NEW_SUFFIX)SUFFIX.push(a);
// 原版 "StaffMods"：魔法以上的魔杖/缩颅随机获得 +1~3 单技能 (近似：最多 2 个技能)
const STAFFMOD_CATS=new Set(['wand','head']);

// ---------- 品质判定参数（itemratio：普通行 / 扩展精英行 / 职业专属行） ----------
// [base, divisor, min]，超强/普通/低劣只有 base/div
const IRATIO={
 norm:{u:[400,1,6400],s:[160,2,5600],r:[100,2,3200],m:[34,3,192],h:[12,8],n:[2,2]},
 uber:{u:[400,1,6400],s:[160,2,5600],r:[100,2,3200],m:[34,3,192],h:[12,8],n:[1,1]},
 cls:{u:[240,3,6400],s:[120,3,5600],r:[80,3,3200],m:[17,6,192],h:[9,8],n:[2,2]},
 clsu:{u:[240,3,6400],s:[120,3,5600],r:[80,3,3200],m:[17,6,192],h:[9,8],n:[1,1]},
};
const MF_DIM={u:250,s:500,r:600}; // 有效MF = MF×F/(MF+F)，魔法不递减；MF≤10 时不递减

// ---------- TC（宝藏级别）----------
// pk 抽取次数；nd/gold/eq/junk/good 权重；f 品质因子 {u,s,r,m}（/1024）；gb 掉落好物所用章节段偏移
const TCS={
 normal:{pk:1,nd:100,gold:21,eq:16,junk:21,good:2},
 champ:{pk:1,nd:0,gold:60,eq:37,junk:0,good:3,f:{u:800,s:800,r:800,m:1024},pots:2},
 uniq:{pk:1,nd:0,gold:0,eq:58,junk:0,good:4,f:{u:800,s:800,r:800,m:1024},extra:'normal',extraPk:2},
 boss:{pk:5,nd:19,gold:14,eq:19,junk:5,good:3,f:{u:800,s:800,r:972,m:1024},gmul:1.25},
 countess:{pk:5,nd:19,gold:11,eq:19,junk:15,good:3,f:{u:883,s:883,r:883,m:1024},gmul:1.25,gb:1,runes:3},
 actboss:{pk:7,nd:19,gold:11,eq:19,junk:15,good:3,f:{u:983,s:983,r:983,m:1024},gmul:1.25,gb:1},
};
// "ActX Good" 表：band = 难度×5 + 章节；J 首饰(只保留戒指/护符，按 12/20 折算) G 宝石级别权重 R 符文TC权重
const GOODT=[
 {J:5,G:[5],R:{}},{J:20,G:[12,4],R:{1:3,2:3}},{J:20,G:[8,8],R:{3:3,4:3}},{J:50,G:[14,28,42],R:{5:14,6:7}},{J:50,G:[6,8,24,4],R:{7:10}},
 {J:60,G:[6,8,28,14],R:{8:14}},
];
for(let b=6;b<15;b++)GOODT.push({J:60,G:[4,10,14,28],R:{[b+3]:14}});
const JEWEL_SCALE=12/20;
// 符文 TC：Runes n 含 2 枚符文 (3:2)，并以 FALL[n] 权重落到 Runes n-1；Runes 17 仅最高符文(1) vs 5170 落回
const RUNE_FALL=[0,0,2,5,7,12,22,45,90,180,360,720,1066,1519,2170,2941,3957,5170];
const COUNTESS_RTC=[4,8,12]; // 女伯爵式首领的专属符文 TC（普通/噩梦/地狱），3 次，NoDrop 5:15

// ---------- 宝石（数值按原版 gems 表；伤害区间取均值） ----------
Object.assign(GEMS.sap,{w:g=>({coldmin:[2,4,6,8,12][g]})});
Object.assign(GEMS.eme,{w:g=>({poisdmg:[34,51,82,101,143][g]})});
Object.assign(GEMS.rub,{w:g=>({firemin:[4,6,10,13,18][g]})});
Object.assign(GEMS.sku,{a:g=>({regen:[2,3,3,4,5][g],mregen:[8,8,12,12,19][g]})});

// ---------- 符文：[名, 需求等级, 武器, 头盔/铠甲, 盾(缺省同铠甲)] ----------
const NEW_RUNES=[
 ['晨',11,{ar:50},{def:15}], ['曦',11,{undead:75,ar:50},{},{block:7}], ['溪',13,{mpk:2},{mpk:2}], ['澜',13,{kb:1},{def:30}],
 ['霁',15,{tdef:25},{mregen:15}], ['锋',15,{maxdmg:9},{dmgmana:15}], ['蚀',17,{poisdmg:75},{pres:30},{pres:35}], ['炎',19,{firemin:17},{fres:30},{fres:35}],
 ['雷',21,{lightmax:50},{lres:30},{lres:35}], ['霜',23,{coldmin:8},{cres:30},{cres:35}], ['渴',25,{ll:7},{thorns:14}], ['甲',27,{mindmg:9},{dr:7}],
 ['疾',29,{ias:20},{fhr:20},{fbr:20}], ['惧',31,{flee:25},{regen:7}], ['简',0,{reqp:20},{reqp:15}], ['烬',35,{vit:10},{vit:10}],
 ['辉',37,{ene:10},{ene:10}], ['魄',39,{dex:10},{dex:10}], ['岚',41,{str:10},{str:10}], ['镰',43,{gf:75},{gf:50}],
 ['磐',45,{demon:75},{edef:30}], ['渊',47,{ow:25},{allres:15},{allres:22}], ['瘴',49,{noheal:1},{mdr:7}], ['祈',51,{mf:30},{mf:25}],
 ['噬',53,{arp:20},{maxpres:5}], ['冥',55,{ml:7},{maxfres:5}], ['煌',57,{edmg:50},{maxcres:5}], ['烁',59,{ds:20},{maxlres:5}],
 ['魇',61,{blind:20},{manapct:5},{mana:50}], ['裂',63,{cb:20},{drp:8}], ['恒',65,{ignoredef:1},{lifepct:5},{life:50}], ['凛',67,{freeze:3},{nofreeze:1}],
 ['寂',69,{indestr:1},{indestr:1}],
];
RUNES.length=0;for(const r of NEW_RUNES)RUNES.push(r);
// 面向玩家的符文名一律用编号（按需求等级顺序：原「晨」=1号 … 33号）；存档只存索引 r，无需迁移
NEW_RUNES.forEach((r,i)=>{r.orig=r[0];r[0]=(i+1)+'号'});
// 炼金匣符文升级（原版 1.11+）：前 9 次只需 3 枚；之后需宝石 [宝石, 级别]；Pul(20) 起只需 2 枚
const RUNE_UP=[null,null,null,null,null,null,null,null,null,['top',0],['ame',0],['sap',0],['rub',0],['eme',0],['dia',0],['top',1],['ame',1],['sap',1],['rub',1],['eme',1],
 ['dia',1],['top',2],['ame',2],['sap',2],['rub',2],['eme',2],['dia',2],['top',3],['ame',3],['sap',3],['rub',3],['eme',3]];
const runeUpCount=r=>r>=20?2:3;

// ---------- 符文之语（配方顺序/类型/凹槽 按原版；m 只写符文之语自身加成，符文本身效果另计） ----------
const RW=(n,r,cats,m,lv)=>({n,r,cats,m,lv:Math.max(lv||0,...r.map(i=>NEW_RUNES[i][1]))});
const WEAP=['wand','dagger','sword'],SHLD=['shield','head'];
const NEW_RW=[
 RW('精钢',[2,0],['sword'],{ias:25,edmg:20,mindmg:3,maxdmg:3,ow:50}),
 RW('天幕',[3,2],['helm'],{edef:50,def:10,str:5,gf:-33}),
 RW('恶念',[5,0,4],WEAP,{edmg:33,ow:100,regen:-5}),
 RW('潜影',[6,4],['armor'],{mdr:3,dex:6,fcr:25,fhr:25}),
 RW('古誓',[7,8,6],SHLD,{cres:30,allres:13,edef:50,dmgmana:10}),
 RW('力能',[10,2],WEAP,{str:20,edmg:35,vit:10,cb:25}),
 RW('学识',[8,11],['helm'],{ene:10,allsk:1,mpk:2}),
 RW('韵律',[12,4],SHLD,{block:20,allres:25,gf:50,mf:25}),
 RW('君恩',[10,7,9],['sword'],{edmg:100,ar:150,undead:50}),
 RW('灵魄',[6,9,8,10],['sword','shield'],{allsk:2,fcr:[25,35],fhr:55,mana:[89,112],vit:22}),
 RW('荣光',[10,0,5,2,11],['sword'],{edmg:160,regen:10,allsk:1,ar:200,ds:25,str:10}),
 RW('白骨',[13,15],['wand'],{t1sk:3,mdr:4,fcr:20,mana:13,sk_ba:3,sk_bs:2,sk_sm:4}),
 RW('烟幕',[3,16],['armor'],{allres:50,edef:75,fhr:20}),
 RW('辉煌',[4,16],SHLD,{allsk:1,fcr:10,gf:50,mf:20,edef:[60,100]}),
 RW('狮心',[14,16,18],['armor'],{str:15,vit:20,dex:15,edmg:20,life:50,allres:30}),
 RW('富饶',[19,17,2],['armor'],{gf:250,mf:100}),
 RW('阴霾',[18,21,20],['armor'],{edef:[170,230],allres:30,dmgmana:5}),
 RW('胁迫',[12,21,9],['armor'],{coldmin:85,edmg:[10,20],edef:[150,200],fhr:20,ow:33,cb:15}),
 RW('骸咏',[11,21,21],['armor'],{allsk:2,mana:[100,150]}),
 RW('审慎',[22,2],['armor'],{edef:[140,170],mdr:10,dr:3,allres:[25,35],fhr:25}),
 RW('谵语',[19,23,15],['helm'],{allsk:2,def:261}),
 RW('圣域',[17,17,22],['shield'],{block:20,edef:[130,160],allres:[50,70],fhr:20}),
 RW('毒噬',[6,13,22],WEAP,{poisdmg:312,ignoredef:1,ml:7}),
 RW('王弑',[22,21,24,18],['sword'],{ias:30,edmg:[230,270],tdef:25,cb:33,ow:25,gf:40}),
 RW('誓约',[12,20,22,16],['sword'],{edmg:[210,340],ias:30,mdr:[10,15],indestr:1}),
 RW('枷锁之荣',[13,21,29,23],['armor'],{allres:65,edef:70,ll:8,allsk:2,str:20,undead:100}),
 RW('亡潮',[14,0,25,8,24],['sword'],{edmg:[300,385],cb:50,ds:30,indestr:1}),
 RW('寂默',[13,1,14,23,2,25],['sword'],{ml:4,edmg:200,ias:20,allres:75,allsk:2,fhr:20}),
 RW('刚毅',[0,11,13,27],['wand','dagger','sword','armor'],{edef:200,edmg:300,fcr:25,dmgmana:12,allres:[25,30],life:60}),
 RW('战令',[10,7,22,23,26],['sword'],{ias:40,edmg:[200,240],allsk:1,regen:12}),
 RW('龙吟',[28,27,11],['armor','shield'],{def:360,str:20,dex:5,vit:5,ene:5}),
 RW('梦魇',[15,30,20],['helm','shield'],{def:[150,220],allres:[5,20],fhr:[20,30],mf:[12,25]}),
 RW('谜域',[30,5,29],['armor'],{def:[750,775],allsk:2,str:40,mf:50}),
 RW('涅槃',[25,25,27,30],['sword','shield'],{edmg:[350,400],allres:30}),
 RW('终焉之息',[25,14,0,1,32,4],['sword'],{ias:60,edmg:[350,400],ll:[12,15],undead:125,str:30,dex:30,vit:30,ene:30}),
];
RUNEWORDS.length=0;for(const w of NEW_RW)RUNEWORDS.push(w);

// ---------- 暗金（lv=物品等级门槛 qlvl，rq=需求等级；蓝本为原版对应物品，重新命名并小幅改造） ----------
const U=(n,b,lv,rq,m)=>({n,b,lv,rq,m});
const NEW_UNIQUES=[
 // —— 普通档 ——
 U('腐根之咏','wand1',7,5,{allsk:1,ll:5,firemin:6,ene:10,mregen:5,mana:10}),
 U('雷蛇之杖','wand2',19,14,{lightmax:9,lres:40,mana:13,fcr:30,sk_ce:[1,3],sk_tr:[1,3],sk_ad:[1,3],sk_im:[1,3]}),
 U('灰烬之喉','wand3',27,20,{str:10,dex:10,coldmin:6,ml:5,allsk:2,mana:[25,50]}),
 U('哭墓之杖','wand4',38,28,{allsk:2,mana:40,fcr:20,sk_tr:3,sk_de:2}),
 U('鸥羽','dag1',6,4,{mindmg:1,maxdmg:15,mf:80,mana:-5}),
 U('翠蛇之吻','dag3',26,19,{ar:[100,150],poisdmg:300,pres:60}),
 U('血月弯刀','swd2',10,7,{allres:15,edmg:[60,80],life:15,ias:15,ll:10}),
 U('骨语者','head1',6,4,{sk_te:1,sk_ba:1,mana:15,allres:8,edef:[20,40]}),
 U('冢主之颅','headn4',24,18,{t0sk:1,sk_rs:2,sumlife:15,edef:[40,60],life:20,mregen:15}),
 U('圆舞盾','shd1',3,2,{def:30,vit:10,str:2,ene:10,edef:[30,40],block:20}),
 U('暗影盘盾','shd3',12,9,{dex:10,def:30,life:20,edef:[40,50],block:30}),
 U('守夜人的面纱','hlm1',4,3,{life:12,ar:30,mana:15,def:[10,14]}),
 U('金翎骷髅盔','hlm2',20,15,{gf:75,mf:[25,50],allsk:1}),
 U('荒原裹布','arm1',10,7,{mdr:3,cres:20,fres:20,dex:8,ll:4,def:20}),
 U('蝠影皮甲','arm2',16,12,{def:25,fhr:40,firemin:4,dex:5}),
 U('百夫长胸铠','arm3',19,14,{def:30,ar:50,dr:2,life:15,mana:15,regen:5}),
 U('双刃之铠','arm4',22,16,{ias:20,dex:10,block:25,def:25,str:10,fhr:20}),
 U('暗辉环甲','arm5',19,14,{ar:20,allres:10,edef:[70,100]}),
 U('枯手','glv1',7,5,{ml:3,ll:3,pres:10,mana:20,def:10,edef:[10,20]}),
 U('血拳','glv2',12,9,{mindmg:5,life:40,fhr:30,def:10,edef:[10,20],ias:10}),
 U('机运护手','glv3',20,15,{gf:200,mf:[25,40],ar:25,def:15,edef:[20,30]}),
 U('法拳','glv4',31,23,{fcr:20,mregen:25,t1sk:1,firemin:3,def:10,edef:[20,30]}),
 U('渡鸦之扣','blt1',10,7,{mana:15,mregen:30,allres:5}),
 U('蛇索','blt2',16,12,{poisdmg:40,pres:25,def:10,edef:[20,30],regen:5}),
 U('夜烟腰带','blt3',27,20,{allres:10,dmgmana:50,mana:20,dr:2,def:15,edef:[30,50]}),
 U('泥行者','bot1',7,5,{fres:45,life:15,firemin:4,def:6,edef:[10,20]}),
 U('血足','bot2',12,9,{ml:2,thorns:2,def:12,edef:[20,30],fhr:10}),
 U('地藏行','bot3',20,15,{def:12,edef:[30,40],life:10,fhr:20}),
 U('暮光之戒','rin',10,7,{mdr:3,thorns:3,ar:[50,75],mf:[15,30]}),
 U('愈泉之戒','rin',20,15,{ml:[4,7],regen:[5,8],life:20,mregen:20}),
 U('哀泣护符','amu',14,10,{fres:50,firemin:4,fhr:20,mana:10}),
 U('晨星之眼','amu',20,15,{allsk:1,ll:[3,7],coldmin:3}),
 // —— 扩展档 ——
 U('自刎枝','wand5',41,33,{thorns:25,fcr:50,allres:10,manapct:10,life:40,allsk:1}),
 U('冥碑杖','wandx2',43,35,{fcr:10,regen:5,allsk:1,t0sk:2,fhr:30,life:40}),
 U('骨王之臂','wandx3',44,36,{t0sk:2,t1sk:2,fcr:10,sk_rm:2,sk_rs:2,sk_te:3,sk_bp:3}),
 U('黑手之钥','wandx4',49,41,{t2sk:1,dmgmana:20,life:50,fcr:30,fres:37,allsk:2}),
 U('侏儒魂颅','headx5',50,42,{allsk:2,t2sk:2,edef:[150,200],block:40,ene:20,mregen:33,mpk:5,allres:40}),
 U('农夫之冠','hlm4',36,28,{ene:20,vit:20,allsk:1,regen:[6,12],edef:100}),
 U('灵魂裹尸布','arm7',36,28,{allsk:1,mdr:[7,11],regen:10,edef:150}),
 U('贤者法铠','armx4',59,51,{fcr:20,mpk:3,mdr:[6,10],ene:15,fhr:20,edef:[140,160],allsk:1}),
 U('墓掌','glvx2',39,32,{ene:10,str:10,undead:[100,200],edef:[140,180]}),
 U('耳串','bltx1',37,29,{mdr:[10,15],dr:[6,10],ll:[6,8],edef:[150,180],def:15}),
 U('水行者','botx2',40,32,{dex:15,edef:[180,210],life:[45,65],def:20}),
 U('无盖之墙','shdx2',41,34,{fcr:20,ene:10,manapct:10,allsk:1,mpk:[3,5],edef:[80,130]}),
 U('冥约之戒','rin',39,29,{mana:20,manapct:25,lightmax:12,allsk:1}),
 U('四象护符','amu',34,25,{str:10,dex:10,vit:10,ene:10,allres:10}),
 // —— 精英档 ——
 U('骨影','wande3',84,79,{allsk:2,fcr:25,sk_te:[4,5],sk_ba:[4,5],sk_bs:[2,3],sk_bx:[1,2],sk_bw:[2,3]}),
 U('死网','wande4',74,66,{allsk:2,t1sk:[1,2],mpk:[7,12],regen:[7,12]}),
 U('暗锻之颅','heade4',72,64,{edef:[140,180],fcr:30,manapct:10,t0sk:[1,3],t1sk:[1,3],t2sk:[1,3]}),
 U('骨焰颅','heade3',80,72,{edef:[120,150],allsk:[2,3],allres:[20,30]}),
 U('谐谑之冠','hlme1',69,62,{allsk:2,life:60,mana:60,mf:50,dr:5,str:2,dex:2,vit:2,ene:2}),
 U('蛛后之容','hlme2',85,83,{edef:[100,150],pres:70,allsk:2,ias:20,str:[25,30],ll:[8,10],fres:-30}),
 U('秘法长袍','arm8',83,75,{def:[10,20],fcr:20,mregen:[10,15],sk_bs:[2,3],allres:10}),
 U('血爪之握','glve2',84,76,{edef:[90,120],ll:[7,10],ow:25,str:[10,15]}),
 U('蛛网束腰','blte1',87,80,{edef:[90,120],fcr:20,allsk:1,manapct:5}),
 U('沙暴之履','bote2',72,64,{edef:[140,170],fhr:20,pres:[40,70],str:[10,15],vit:[10,15]}),
 U('誓约婚戒','rin',66,58,{allsk:1,ll:[3,5],life:40}),
 U('万象护符','amu',80,67,{allsk:2,allres:[20,30],str:5,dex:5,vit:5,ene:5}),
];
UNIQUES.length=0;for(const u of NEW_UNIQUES)UNIQUES.push(u);

// ---------- 套装（部分件数奖励 + 全套奖励，蓝本为原版对应套装） ----------
for(const k in SETS)delete SETS[k];
Object.assign(SETS,{
 grave:{n:'掘墓人遗物',bonus:{2:{life:20},3:{allres:10},4:{allsk:1,mf:30}}},
 night:{n:'寒夜誓约',bonus:{2:{fcr:10,mana:20},3:{t1sk:1,sumdmg:25,allres:15}}},
 hell:{n:'炼狱器具',bonus:{2:{fcr:10,mana:20},3:{allsk:1,sumlife:20,mregen:20,allres:10}}},
 angel:{n:'天誓圣衣',bonus:{2:{life:30},3:{ar:150,dr:2},4:{allres:20,mf:40,regen:6}}},
 sigon:{n:'铁卫全钢',bonus:{2:{ar:100},3:{life:30},4:{def:100},5:{mf:50},6:{allres:12,dr:5,str:10}}},
 arcanna:{n:'秘术师之术',bonus:{2:{mana:50},3:{fcr:10,mregen:10},4:{allsk:1,life:50,manapct:15}}},
 cathan:{n:'卡珊秘仪',bonus:{2:{mregen:16,fcr:10},3:{lres:25,fres:25},4:{mf:25,cres:25},5:{allsk:1,allres:25,fhr:20}}},
 trang:{n:'冥王化身',cls:1,bonus:{2:{life:50,regen:5},3:{mregen:15,fcr:10},4:{t2sk:1,ll:10,allres:25},5:{allsk:3,lifepct:10,sumlife:30,sumdmg:30,manapct:15}}},
 tal:{n:'星渊术士',bonus:{2:{life:65,mregen:15},3:{fcr:15,allres:15},4:{mf:65,dr:8},5:{allsk:3,manapct:10,allres:25,def:150}}},
});
const S_=(n,set,b,lv,rq,m)=>({n,set,b,lv,rq,m});
const NEW_SETITEMS=[
 S_('掘墓人的兜帽','grave','hlm2',5,5,{def:15,life:10}), S_('掘墓人的尸衣','grave','arm3',6,6,{edef:40,vit:5}),
 S_('掘墓人的铲柄手套','grave','glv1',4,4,{str:5,regen:2}), S_('掘墓人的绳腰带','grave','blt2',7,7,{life:15,pres:15}),
 S_('寒夜·骨杖','night','wand1',5,5,{sk_rs:1,mana:15,cres:10}), S_('寒夜·冷颅','night','head1',6,6,{sk_ad:1,def:10,cres:20}), S_('寒夜·冰链','night','amu',8,8,{ene:10,cres:20,mregen:20}),
 S_('炼狱·焦帽','hell','hlm1',7,5,{def:8,mana:15,mregen:10}), S_('炼狱·墓杖','hell','wand4',26,26,{sk_bs:1,sk_rs:2,edmg:[60,80],ll:6}), S_('炼狱·腰索','hell','blt4',20,20,{def:25,mdr:2,life:20}),
 S_('天誓·圣剑','angel','swd3',12,12,{edmg:100,undead:50,ar:75}), S_('天誓·法衣','angel','arm5',17,12,{edef:40,dex:10,def:25}),
 S_('天誓·光环','angel','rin',12,12,{ar:75,ene:10,regen:3}), S_('天誓·羽链','angel','amu',21,21,{def:25,mana:20,mregen:15}),
 S_('铁卫·盔','sigon','hlm5',8,6,{def:25,ar:50}), S_('铁卫·胸甲','sigon','arm6',11,9,{def:30,allres:5}), S_('铁卫·护手','sigon','glv3',9,6,{ias:10,ar:50}),
 S_('铁卫·腰环','sigon','blt3',9,6,{def:20,dr:1}), S_('铁卫·铁靴','sigon','bot3',9,6,{def:15,fhr:20}), S_('铁卫·塔盾','sigon','shd2',9,6,{def:25,fres:24}),
 S_('秘术·护符','arcanna','amu',20,15,{mana:15,fcr:10,mregen:10}), S_('秘术·法铠','arcanna','arm11',20,15,{def:100,mana:15,ene:10}),
 S_('秘术·头冠','arcanna','hlm6',20,15,{def:30,mana:15,dr:3}), S_('秘术·短杖','arcanna','wand3',20,15,{mana:30,fcr:20,sk_bs:1}),
 S_('卡珊·面容','cathan','hlm6',16,11,{def:20,cres:25,mana:20}), S_('卡珊·印记','cathan','amu',16,11,{fcr:10,lres:25,mana:15}), S_('卡珊·戒印','cathan','rin',16,11,{ml:2,regen:6,mdr:2}),
 S_('卡珊·链甲','cathan','arm9',16,11,{def:60,fres:30,thorns:6}), S_('卡珊·法规','cathan','wand2',16,11,{fcr:10,ar:20,firemin:5,mregen:10}),
 S_('冥王·翼颅','trang','headx3',45,54,{edef:[150,200],fres:45,cres:15,t1sk:2,life:25}), S_('冥王·伪面','trang','hlme3',84,65,{def:[180,200],life:100,mregen:15,fhr:25}),
 S_('冥王·鳞甲','trang','armx5',45,49,{edef:150,cres:40,regen:10,t2sk:2}), S_('冥王·利爪','trang','glvx3',43,45,{edef:[80,100],pres:30,cres:30,t2sk:2,fcr:20}),
 S_('冥王·腰环','trang','bltx3',43,47,{def:[75,100],life:[25,30],str:20,mregen:15}),
 S_('星渊·护符','tal','amu',67,67,{lres:33,fres:33,cres:33,ll:10}), S_('星渊·束带','tal','blte1',67,66,{life:60,ll:8,fhr:10,fres:[37,45]}),
 S_('星渊·法铠','tal','arme3',71,71,{def:400,fcr:10,allres:15,manapct:10}), S_('星渊·冠冕','tal','hlme2',66,66,{def:[150,200],allsk:2,dr:15}), S_('星渊·法杖','tal','wande2',65,65,{allsk:2,fcr:20,life:57,mana:57}),
];
SETITEMS.length=0;for(const s of NEW_SETITEMS)SETITEMS.push(s);

// ---------- 合成配方（原版 cubemain：魔法底材 + 指定符文 + 完美宝石；本作无珠宝，以任意宝石代替） ----------
// 部位 → [符文索引, 固定词缀]
const CRAFTS={
 caster:{n:'施法',gem:'ame',parts:{helm:[3,{mregen:[4,10],mana:[10,20],ml:[1,4]}],boots:[9,{mregen:[4,10],mana:[10,20],manapct:[2,5]}],gloves:[8,{mregen:[4,10],mana:[10,20],mpk:[1,3]}],
  belt:[5,{mregen:[4,10],mana:[10,20],fcr:[5,10]}],shield:[4,{mregen:[4,10],mana:[10,20],block:[5,10]}],armor:[6,{mregen:[4,10],mana:[10,20],mpk:[1,3]}],amulet:[7,{mregen:[4,10],mana:[10,20],fcr:[5,10]}],ring:[10,{mregen:[4,10],mana:[10,20],ene:[1,5]}],weapon:[2,{mregen:[4,10],mana:[10,20],manapct:[1,5]}]}},
 blood:{n:'嗜血',gem:'rub',parts:{helm:[7,{ll:[1,3],life:[10,20],ds:[5,10]}],boots:[4,{ll:[1,3],life:[10,20],regen:[5,10]}],gloves:[3,{ll:[1,3],life:[10,20],cb:[5,10]}],
  belt:[6,{ll:[1,3],life:[10,20],ow:[5,10]}],shield:[5,{ll:[1,3],life:[10,20],thorns:[4,7]}],armor:[9,{ll:[1,3],life:[10,20]}],amulet:[10,{ll:[1,4],life:[10,20]}],ring:[11,{ll:[1,3],life:[10,20],str:[1,5]}],weapon:[8,{ll:[1,4],life:[10,20],edmg:[35,60]}]}},
 hit:{n:'强击',gem:'sap',parts:{helm:[5,{thorns:[3,7],def:[25,50]}],boots:[7,{thorns:[3,7],def:[25,60]}],gloves:[8,{thorns:[3,7],kb:[1,1]}],belt:[6,{thorns:[3,7],dmgmana:[5,10]}],
  shield:[4,{thorns:[3,10],block:[5,10]}],armor:[3,{thorns:[3,10],fhr:[10,20]}],amulet:[9,{thorns:[3,10],flee:[5,15]}],ring:[10,{thorns:[3,6],dex:[1,5]}],weapon:[2,{thorns:[3,7],edmg:[35,60]}]}},
 safety:{n:'守护',gem:'eme',parts:{helm:[5,{dr:[1,4],mdr:[1,2],lres:[5,10],edef:[10,30]}],boots:[8,{dr:[1,4],mdr:[1,2],fres:[5,10],edef:[10,30]}],gloves:[7,{dr:[1,4],mdr:[1,2],cres:[5,10],edef:[10,30]}],
  belt:[6,{dr:[1,4],mdr:[1,2],pres:[5,10],edef:[10,30]}],shield:[3,{dr:[1,4],mdr:[1,2],allres:[5,10],edef:[10,30]}],armor:[4,{dr:[1,4],mdr:[1,2],edef:[10,30]}],amulet:[9,{dr:[1,4],mdr:[1,2],block:[1,10]}],ring:[10,{dr:[1,4],mdr:[1,2],vit:[1,5]}],weapon:[11,{dr:[1,4],mdr:[1,2],edmg:[5,10]}]}},
};
// 底材加孔（原版：普通且无孔底材 + 两枚符文 + 完美宝石 → 随机 1~上限 个凹槽）
const SOCKET_RECIPES={armor:[6,9,'top'],weapon:[7,10,'ame'],helm:[7,9,'sap'],shield:[6,10,'rub']};
const STASH_SIZE=48; // 储物箱容量（原版资料片 6×8）

// ---------- 显示文本（新增键；无战斗实现的只做显示，标注于 DESIGN） ----------
Object.assign(MODT,{kb:'击退',flee:'击中使怪物逃跑 {v}%',reqp:'需求 -{v}%',demon:'+{v}% 对恶魔伤害',ow:'{v}% 撕裂伤口几率',noheal:'阻止怪物回复',arp:'{v}% 命中加成',
 maxfres:'+{v}% 最大火焰抗性',maxcres:'+{v}% 最大冰冷抗性',maxlres:'+{v}% 最大闪电抗性',maxpres:'+{v}% 最大毒素抗性',ds:'{v}% 致命一击',blind:'{v}% 击中致盲',cb:'{v}% 压碎性打击',
 drp:'物理伤害减少 {v}%',ignoredef:'无视目标防御',freeze:'冻结目标 +{v}',nofreeze:'不会被冻结',indestr:'无法破坏',fbr:'+{v}% 快速格挡'});
for(const k of['ow','ds','cb','drp','ignoredef','fbr','maxfres','maxcres','maxlres','maxpres','kb','flee','blind','freeze','nofreeze','noheal','arp','demon'])HIDDEN_KEYS.add(k);
