'use strict';
// art_nec_icons.js — 美术：亡灵流派 3 套套装 18 件 + 8 件流派暗金 手绘图标（assets/icon2/nec/<id>.webp，tools/art/gen_nec_icons.py）
// 按物品名 it.name 覆盖：包装 icon2Url（icon2.js 的 itemIcon 包装按名调用）+ 最外层 itemIcon 兜底；背包/详情/装备栏/仓库均走 itemIcon
const NEC_ICONS={'万骨·统御颅':'nb_wg_head','万骨·骸冠':'nb_wg_helm','万骨·墓甲':'nb_wg_armor','万骨·驭尸手':'nb_wg_gloves','万骨·亡索':'nb_wg_belt','万骨·冥途靴':'nb_wg_boots',
 '棘冠·骨镞':'nb_jg_wand','棘冠·骸面':'nb_jg_helm','棘冠·骨织袍':'nb_jg_armor','棘冠·穿骨手':'nb_jg_gloves','棘冠·髓带':'nb_jg_belt','棘冠·疾骨靴':'nb_jg_boots',
 '疫母·腐颅':'nb_ym_head','疫母·疫冠':'nb_ym_helm','疫母·毒囊甲':'nb_ym_armor','疫母·腐指':'nb_ym_gloves','疫母·瘟带':'nb_ym_belt','疫母·尸行靴':'nb_ym_boots',
 '白骨王座':'nb_u_throne','亡契':'nb_u_pact','冥卫之戒':'nb_u_ward','骨髓之环':'nb_u_marrow','骸语之眼':'nb_u_eye','腐心':'nb_u_rot','疫源护符':'nb_u_src','尸王之戒':'nb_u_corpse'};
function necIconUrl(it){const id=it&&!it.k&&it.name&&NEC_ICONS[it.name];return id?'assets/icon2/nec/'+id+'.webp':null}
if(typeof icon2Url==='function'){const _u=icon2Url;icon2Url=function(it){return necIconUrl(it)||_u(it)}}
if(typeof itemIcon==='function'){const _ii=itemIcon;itemIcon=function(it){const u=necIconUrl(it);if(!u)return _ii(it);const b=(typeof BASEM!=='undefined'&&BASEM[it.b])||{};
 const t=typeof icon2Tier==='function'?'nxe'.indexOf(icon2Tier(it)):2;
 return`<i class="ii art eq t${t} ic2 nec" style="background-image:url(${u});background-size:contain;background-position:center;background-repeat:no-repeat"></i>`}}
