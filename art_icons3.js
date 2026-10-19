'use strict';
// art_icons3.js — 美术：16 个轻型底材专属图标（assets/icon2/light/<id>.webp）+ 17 个新威能图标（assets/icon2/pw/<id>.webp），tools/art/gen_pw_lt_icons.py
// 底材：写 ICON2[base id]（icon2Url 按 ICON2[it.b] 优先查）。威能：带 it.lp 且有图、且没有按名字专属图标的物品才显示威能图标（包装 icon2Url + 最外层 itemIcon）
// 保留原图标：nec/cls 按名映射命中；或暗金/套装(q 5/6)且原链路给出的不是通用底材图（ICON2[b]/ICON2[cat_tier]）
// 熔炼匣槽位 / 威能图鉴行原本无图标位置，不新增 DOM。须在 light_bases.js、art_nec_icons.js、art_cls_icons.js 之后加载
const LT_ICON_IDS=['ltc1','ltc2','ltc3','ltc4','ltr1','ltr2','ltr3','ltg1','ltg2','ltg3','lts1','lts2','lts3','ltb1','ltb2','ltb3'];
const PW_ICON_IDS=['pw_bonepact','pw_marrow','pw_shroud','pw_whirl','pw_ironspin','pw_soulcleave','pw_emberheart','pw_frostcore','pw_surge','pw_magma','pw_galestaff','pw_beastfang','pw_blazequiver','pw_blazecloak','pw_thunderbadge','pw_zealring','pw_judgham'];
if(typeof ICON2!=='undefined')for(const id of LT_ICON_IDS)ICON2[id]='assets/icon2/light/'+id+'.webp';
// 原链路（不含本文件包装）：_pwBaseUrl/_pwBaseIcon；判断时临时把 icon2Url 换回原版，避免递归
let _pwBaseUrl=typeof icon2Url==='function'?icon2Url:null,_pwBaseIcon=typeof itemIcon==='function'?itemIcon:null;
function pwOrig(it){if(!_pwBaseIcon)return'';const f=icon2Url;try{if(_pwBaseUrl)icon2Url=_pwBaseUrl;return String(_pwBaseIcon(it))}finally{icon2Url=f}}
function pwNamed(it){if((typeof necIconUrl==='function'&&necIconUrl(it))||(typeof artClsIconUrl==='function'&&artClsIconUrl(it)))return 1;
 if(it.q===5||it.q===6){const b=BASEM[it.b];const gen=b?[ICON2[it.b],ICON2[b.cat+'_'+(typeof icon2Tier==='function'?icon2Tier(it):'n')]].filter(Boolean):[];
  const m=pwOrig(it).match(/url\(['"]?([^)'"]+)/);if(m&&!gen.includes(m[1]))return 1}return 0}
function pwIconUrl(it){const k=it&&!it.k&&it.lp;return k&&PW_ICON_IDS.includes(k)&&!pwNamed(it)?'assets/icon2/pw/'+k+'.webp':null}
if(_pwBaseUrl){const _u=_pwBaseUrl;icon2Url=function(it){return pwIconUrl(it)||_u(it)}}
if(_pwBaseIcon){const _ii=_pwBaseIcon;itemIcon=function(it){const u=pwIconUrl(it);if(!u)return _ii(it);
 const t=typeof icon2Tier==='function'?'nxe'.indexOf(icon2Tier(it)):2;
 return`<i class="ii art eq t${t} ic2 pw" style="background-image:url(${u});background-size:contain;background-position:center;background-repeat:no-repeat"></i>`}}
