// summon_keep.js — 终局场景（魂狱/暗渊/秘境等 egEnter）进场保留召唤物 + 开场自动召回。
// egEnter 会清空尸体（CORPSE=[]），召唤死灵（骷髅/骨巫要尸体）与召唤德鲁伊在首领战里等同光杆开局。
// ①进场前存活的非佣兵召唤物原样带入；②进场后按已学技能补满：骷髅 rs / 骨巫 rm（不耗尸体、不耗法力），德鲁伊 csum（同组只召唤 clsGroupPick 选中的一种）。
var SMKEEP={on:1};
function skpRecall(){let n=0;try{if(!S||!ST)return 0;
 if(S.cls==='nec'){for(const id of['rs','rm']){const L=slvl(id);if(!L)continue;const v=SV(id,L),k=id==='rs'?'skel':'mage';let g=0;while(cntA(k)<v.n&&g++<20){if(id==='rs')addAlly('skel',{n:'骨仆',hp:v.life,dmg:v.dmg});else addAlly('mage',{n:'骨巫',hp:v.life,dmg:v.dmg,el:pick(['fire','cold','light','pois']),ranged:1});n++}}}
 if(S.cls==='dru'&&typeof CLS_TY!=='undefined'&&CLS_TY.csum){for(const s of CLS_SKILLS){if(s.cls!=='dru'||s.ty!=='csum')continue;const L=slvl(s.id);if(!L)continue;if(s.g&&typeof clsGroupPick==='function'&&clsGroupPick(s.g)!==s.id)continue;const v=SV(s.id,L);let g=0;while(ALLY.filter(a=>a.kind==='dpet'&&a.sub===s.id&&a.hp>0).length<(v.n||1)&&g++<20){CLS_TY.csum(s,v);n++}}}
}catch(e){console.error('skp',e)}return n}
{const f=egEnter;egEnter=function(m){const keep=SMKEEP.on&&typeof ALLY!=='undefined'?ALLY.filter(a=>a.hp>0&&a.kind!=='merc'):[];const r=f(m);
 try{if(SMKEEP.on&&EGM===m){for(const a of keep)if(!ALLY.includes(a))ALLY.push(a);const n=skpRecall();if(n)log(`<span class="dim">召唤物随行入场，召回 ${n} 只</span>`)}}catch(e){console.warn('skp',e)}return r}}
