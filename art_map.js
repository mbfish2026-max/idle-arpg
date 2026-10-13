'use strict';
// ===================================================================================
// art_map.js — 原创美术资源映射（只做映射/包装，不改动玩法数据）
// 生成脚本：tools/art/*.py   资源：assets/icon assets/bg assets/ui assets/merc
// 必须在其它脚本之后加载（包装 itemIcon / renderFight）
// ===================================================================================
const ART={
 // 装备精灵表：行=类型（与 tools/art/gen_items.py TYPES 一致），列=底材档次 0普通 1扩展 2精英
 eqSheet:'assets/icon/equip_sheet.webp',
 gemSheet:'assets/icon/gems_sheet.webp',gemRows:['ame','top','sap','eme','rub','dia','sku'],// 列=品级 lv0-4
 runeSheet:'assets/icon/runes_sheet.webp',// 11列×3行，序号 r=0..32
 craftSheet:'assets/icon/craft_sheet.webp',craftCols:['ess','cube','anvil','socket','scroll','recycle'],// 工匠/材料
 eqRows:['sword','axe','mace','polearm','spear','bow','xbow','wand','staff','dagger','shield','head','helm','armor','gloves','boots','belt','ring','amulet','scha','mcha','lcha','jewel','jav','throw'],
};
// 首饰类无档次：按品质取色（普通/魔法+/暗金及以上）
function artTier(it,b){if(b.jew)return it.q>=5?2:it.q>=3?1:0;return Math.max(0,Math.min(2,b.tier|0))}
function artSprite(url,col,row,cols,rows,cls){return`<i class="ii art ${cls||''}" style="background-image:url(${url});background-size:${cols*100}% ${rows*100}%;background-position:${cols>1?col/(cols-1)*100:0}% ${rows>1?row/(rows-1)*100:0}%"></i>`}
{const _art_icon=itemIcon;itemIcon=function(it){
  if(it&&!it.k){const b=BASEM[it.b];const r=b?ART.eqRows.indexOf(b.cat):-1;
   if(r>=0)return artSprite(ART.eqSheet,artTier(it,b),r,3,ART.eqRows.length,'eq t'+artTier(it,b)+(b.s==='charm'?' chm c'+b.sz:''))}
  if(it&&it.k==='gem'){const r=ART.gemRows.indexOf(it.g);if(r>=0)return artSprite(ART.gemSheet,Math.max(0,Math.min(4,it.lv|0)),r,5,7,'gm')}
  if(it&&it.k==='rune'&&it.r>=0&&it.r<33)return artSprite(ART.runeSheet,it.r%11,Math.floor(it.r/11),11,3,'rn')
  if(it&&it.k==='mat'){const c=ART.craftCols.indexOf(it.id||it.m||'ess');return artSprite(ART.craftSheet,c<0?0:c,0,ART.craftCols.length,1,'mt')}
  return _art_icon(it)}}
// 工匠图标（供其它面板按需调用）：artCraft('cube')
function artCraft(k,cls){const c=Math.max(0,ART.craftCols.indexOf(k));return artSprite(ART.craftSheet,c,0,ART.craftCols.length,1,'mt '+(cls||''))}
// ---------- 区域背景：第一章逐区域一张；二~五章按(章节, 场景类型)多张轮换 ----------
// 文件：assets/bg/a1_zNN.webp、assets/bg/a{章}_{类型}_{v}.webp（720x1280 webp）。只按需加载当前一张。
function artZoneBg(ai,zi){const A=ACTS[ai];if(!A||!A.zones[zi])return null;const z=A.zones[zi];
 if(ai===0)return`assets/bg/a1_z${String(zi).padStart(2,'0')}.webp`;
 // 二~五章的 a{章}_{类型}_{v}.webp 为程序化占位图（竖柱条纹+橙色小方块/三角，像切条叠图），改用各章手绘整图 act{N}.webp
 if(ai>4)return null;return`assets/bg/act${ai+1}.webp`}
const ART_BG={};
{const _art_rf=renderFight;renderFight=function(){_art_rf();const fb=document.getElementById('fbattle');if(!fb)return;
  const z=zoneData(),zi=ACTS[S.act]?ACTS[S.act].zones.indexOf(z):-1;const u=zi>=0?artZoneBg(S.act,zi):null;if(!u)return;
  const apply=()=>{if(fb.dataset.artbg!==u||!fb.style.backgroundImage.includes(u)){fb.style.backgroundImage=`linear-gradient(rgba(0,0,0,.4),rgba(0,0,0,.15) 35%,rgba(0,0,0,.65)),url(${u})`;fb.style.backgroundSize='cover';fb.style.backgroundRepeat='no-repeat';fb.style.backgroundPosition='center';fb.dataset.artbg=u}};
  if(ART_BG[u]===1)apply();else if(!ART_BG[u]){ART_BG[u]=2;const i=new Image();i.onload=()=>{ART_BG[u]=1;if(TAB==='fight')renderFight()};i.onerror=()=>{ART_BG[u]=3};i.src=u}}}
