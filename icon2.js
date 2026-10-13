'use strict';
// ===================================================================================
// icon2.js — 手绘装备图标（第二批，128×128 透明 webp：assets/icon2/{类别}_{n|x|e}.webp）
// 共用文件：美术（武器）+ 美术2（防具/饰品）。紧跟 art_map.js 之后加载，包装其 itemIcon。
// 查找顺序（仅非特殊物品 !it.k）：ICON2[it.b]（底材专属）→ ICON2[cat+'_'+icon2Tier(it)] → 回退原 itemIcon
// ===================================================================================
const ICON2={
 // ---------- 武器（美术维护）----------
 'sword_n':'assets/icon2/sword_n.webp','sword_x':'assets/icon2/sword_x.webp','sword_e':'assets/icon2/sword_e.webp',
 'axe_n':'assets/icon2/axe_n.webp','axe_x':'assets/icon2/axe_x.webp','axe_e':'assets/icon2/axe_e.webp',
 'mace_n':'assets/icon2/mace_n.webp','mace_x':'assets/icon2/mace_x.webp','mace_e':'assets/icon2/mace_e.webp',
 'polearm_n':'assets/icon2/polearm_n.webp','polearm_x':'assets/icon2/polearm_x.webp','polearm_e':'assets/icon2/polearm_e.webp',
 'spear_n':'assets/icon2/spear_n.webp','spear_x':'assets/icon2/spear_x.webp','spear_e':'assets/icon2/spear_e.webp',
 'bow_n':'assets/icon2/bow_n.webp','bow_x':'assets/icon2/bow_x.webp','bow_e':'assets/icon2/bow_e.webp',
 'xbow_n':'assets/icon2/xbow_n.webp','xbow_x':'assets/icon2/xbow_x.webp','xbow_e':'assets/icon2/xbow_e.webp',
 'wand_n':'assets/icon2/wand_n.webp','wand_x':'assets/icon2/wand_x.webp','wand_e':'assets/icon2/wand_e.webp',
 'staff_n':'assets/icon2/staff_n.webp','staff_x':'assets/icon2/staff_x.webp','staff_e':'assets/icon2/staff_e.webp',
 'dagger_n':'assets/icon2/dagger_n.webp','dagger_x':'assets/icon2/dagger_x.webp','dagger_e':'assets/icon2/dagger_e.webp',
 'jav_n':'assets/icon2/jav_n.webp','jav_x':'assets/icon2/jav_x.webp','jav_e':'assets/icon2/jav_e.webp',
 'throw_n':'assets/icon2/throw_n.webp','throw_x':'assets/icon2/throw_x.webp','throw_e':'assets/icon2/throw_e.webp',
 // ---------- 防具/饰品（美术2 维护）----------
};
// 档位：普通/扩展/精英 = BASEM[it.b].tier 0/1/2 → 'n'/'x'/'e'；首饰类(b.jew)无档次，按品质：q>=5→e，q>=3→x，否则 n（同 art_map.js artTier）
function icon2Tier(it){const b=it&&BASEM[it.b];if(!b)return'n';return'nxe'[b.jew?(it.q>=5?2:it.q>=3?1:0):Math.max(0,Math.min(2,b.tier|0))]}
function icon2Url(it){if(!it||it.k)return null;const b=BASEM[it.b];if(!b)return null;return ICON2[it.b]||ICON2[b.cat+'_'+icon2Tier(it)]||null}
{const _icon2=itemIcon;itemIcon=function(it){const u=icon2Url(it);if(!u)return _icon2(it);const b=BASEM[it.b],t='nxe'.indexOf(icon2Tier(it));
  return`<i class="ii art eq t${t} ic2${b.s==='charm'?' chm c'+b.sz:''}" style="background-image:url(${u});background-size:contain;background-position:center;background-repeat:no-repeat"></i>`}}
