'use strict';
// art_icons3.js — 美术：16 个轻型底材专属图标（assets/icon2/light/<id>.webp）+ 17 个新威能图标（assets/icon2/pw/<id>.webp），tools/art/gen_pw_lt_icons.py
// 底材：写 ICON2[base id]（icon2Url 按 ICON2[it.b] 优先查）。威能：带 it.lp 且有图的传说/暗金物品，图标优先显示威能图标（包装 icon2Url + 最外层 itemIcon）
// 熔炼匣槽位 / 威能图鉴行原本无图标位置，不新增 DOM。须在 light_bases.js、art_nec_icons.js、art_cls_icons.js 之后加载
const LT_ICON_IDS=['ltc1','ltc2','ltc3','ltc4','ltr1','ltr2','ltr3','ltg1','ltg2','ltg3','lts1','lts2','lts3','ltb1','ltb2','ltb3'];
const PW_ICON_IDS=['pw_bonepact','pw_marrow','pw_shroud','pw_whirl','pw_ironspin','pw_soulcleave','pw_emberheart','pw_frostcore','pw_surge','pw_magma','pw_galestaff','pw_beastfang','pw_blazequiver','pw_blazecloak','pw_thunderbadge','pw_zealring','pw_judgham'];
if(typeof ICON2!=='undefined')for(const id of LT_ICON_IDS)ICON2[id]='assets/icon2/light/'+id+'.webp';
function pwIconUrl(it){const k=it&&!it.k&&it.lp;return k&&PW_ICON_IDS.includes(k)?'assets/icon2/pw/'+k+'.webp':null}
if(typeof icon2Url==='function'){const _u=icon2Url;icon2Url=function(it){return pwIconUrl(it)||_u(it)}}
if(typeof itemIcon==='function'){const _ii=itemIcon;itemIcon=function(it){const u=pwIconUrl(it);if(!u)return _ii(it);
 const t=typeof icon2Tier==='function'?'nxe'.indexOf(icon2Tier(it)):2;
 return`<i class="ii art eq t${t} ic2 pw" style="background-image:url(${u});background-size:contain;background-position:center;background-repeat:no-repeat"></i>`}}
