'use strict';
// light_bases.js — D2 风轻型/施法友好底材：头环系（新类别 circ，可出职业技能/FCR 词缀，最多 2–3 孔）+ 法袍/轻手套/束带/软靴（沿用原类别）
// 新增 id 均为 lt* 前缀，不改动任何既有底材 id（存档稳定）；需在 data_items*/druid/paladin/amazon/classes/salvage/items2/rwx/icon2 之后加载
TCAP.circ=[1,2,3];ITYPES.circ=['armo','helm','circ'];
const LIGHT_BASES=[
 A('ltc1','helm','circ','环冠',16,0,[20,30],0,2), A('ltc2','helm','circ','宝冠',39,1,[30,40],0,2),
 A('ltc3','helm','circ','秘冕',52,1,[40,50],0,3), A('ltc4','helm','circ','星冕',64,2,[50,60],0,3),
 A('ltr1','armor','armor','法师长袍',6,0,[15,20],0,2), A('ltr2','armor','armor','秘纹法袍',40,1,[95,110],25,3), A('ltr3','armor','armor','星辉法袍',66,2,[270,340],40,4),
 A('ltg1','gloves','gloves','丝织手套',9,0,[4,6],0), A('ltg2','gloves','gloves','秘纹手套',41,1,[26,32],15), A('ltg3','gloves','gloves','星辉手套',64,2,[48,55],25),
 A('lts1','belt','belt','丝绦',9,0,[3,4],0), A('lts2','belt','belt','秘纹束带',41,1,[26,30],15), A('lts3','belt','belt','星辉束带',66,2,[48,54],25),
 A('ltb1','boots','boots','布履',9,0,[4,6],0), A('ltb2','boots','boots','秘纹软靴',41,1,[26,32],15), A('ltb3','boots','boots','星辉软靴',66,2,[48,55],25)];
for(const b of LIGHT_BASES){b.light=1;if(!BASEM[b.id]){BASES.push(b);BASEM[b.id]=b}}
// 头环同 D2：可出项链同款的职业技能树 / 全技能 / FCR 词缀
for(const L of [PREFIX,SUFFIX])for(const a of L){const it=a.it;if(!it||!(a.g==='skill'||a.g==='fcr'))continue;
 const has=Array.isArray(it)?it.includes('amul'):String(it).split(',').includes('amul');if(!has)continue;
 if(Array.isArray(it)){if(!it.includes('circ'))it.push('circ')}else if(!String(it).split(',').includes('circ'))a.it=it+',circ'}
if(typeof RW_CATMAP!=='undefined')RW_CATMAP.circ=['helm'];
if(typeof SKCAT!=='undefined')SKCAT.circ='helm';
if(typeof CATN!=='undefined')CATN.circ='头环';
if(typeof RWX_GRP!=='undefined'){const f=RWX_GRP.helm[1];RWX_GRP.helm[1]=c=>c==='circ'||f(c)}
// 图标：GenerateImage 成图无法落盘到 box，暂复用同部位同档位的现有图标（头环→头盔图标；其余 lt* 走 ICON2[cat_tier] 自动回退）
if(typeof ICON2!=='undefined')for(const t of['n','x','e'])if(!ICON2['circ_'+t]&&ICON2['helm_'+t])ICON2['circ_'+t]=ICON2['helm_'+t];
