'use strict';
// ===================================================================================
// art2_map.js — 第二批美术资源映射（只做映射，不修改任何现有文件/玩法）
// 生成脚本：tools/art2/gen_art2.py   资源：assets/elite2 assets/fx2 assets/map2
// 在 art_map.js 之后加载；未接入任何渲染包装，调用方按需使用下列函数。
// ===================================================================================
const ART2={
 // 精英(champ 蓝光)/小首领(uniq 金光) 立绘 256x256：按章节 a1..a5
 elite:{"a1": ["assets/elite2/a1_champ_skeleton_enemy.webp", "assets/elite2/a1_champ_zombie.webp", "assets/elite2/a1_uniq_imp.webp"], "a2": ["assets/elite2/a2_champ_beetle.webp", "assets/elite2/a2_champ_mosq.webp", "assets/elite2/a2_uniq_scarab.webp"], "a3": ["assets/elite2/a3_champ_fly.webp", "assets/elite2/a3_champ_frog.webp", "assets/elite2/a3_uniq_zealot.webp"], "a4": ["assets/elite2/a4_champ_fiend.webp", "assets/elite2/a4_champ_knight.webp", "assets/elite2/a4_uniq_pitlord.webp"], "a5": ["assets/elite2/a5_champ_minion.webp", "assets/elite2/a5_champ_yeti.webp", "assets/elite2/a5_uniq_mauler.webp"]},
 // 技能特效帧：assets/fx2/{id}_{0..7}.webp（256x256 透明），另有横向条带 {id}_strip.webp（8 列）
 fx:{bone_spear:8,poison_nova:8,corpse_explosion:8,curse_aura:8,bone_prison:8},
 fxLoop:{curse_aura:1},
 // 地图下层场景缩略图 240x160：按章节
 map:{"a1": ["assets/map2/a1_lower1.webp", "assets/map2/a1_lower2.webp", "assets/map2/a1_lower3.webp", "assets/map2/a1_lower4.webp"], "a2": ["assets/map2/a2_lower1.webp", "assets/map2/a2_lower2.webp", "assets/map2/a2_lower3.webp", "assets/map2/a2_lower4.webp"], "a3": ["assets/map2/a3_lower1.webp", "assets/map2/a3_lower2.webp", "assets/map2/a3_lower3.webp", "assets/map2/a3_lower4.webp"], "a4": ["assets/map2/a4_lower1.webp", "assets/map2/a4_lower2.webp"], "a5": ["assets/map2/a5_lower1.webp", "assets/map2/a5_lower2.webp", "assets/map2/a5_lower3.webp"]},
};
// 精英/小首领立绘：art2Elite(章节0基, 怪物key, 'champ'|'uniq') → url|null
function art2Elite(ai,mk,fl){const L=ART2.elite['a'+(ai+1)]||[];const t=fl==='uniq'?'uniq':'champ';
 return L.find(u=>u.endsWith(`_${t}_${mk}.webp`))||L.find(u=>u.includes(`_${t}_`))||null}
// 技能特效帧 url：art2Fx('poison_nova', 帧号)
function art2Fx(id,k){const n=ART2.fx[id];if(!n)return null;k=ART2.fxLoop[id]?((k%n)+n)%n:Math.max(0,Math.min(n-1,k|0));return`assets/fx2/${id}_${k}.webp`}
// 在元素上播放一次特效（CSS 条带动画，不依赖其它代码）
function art2PlayFx(el,id,ms){const n=ART2.fx[id];if(!el||!n)return;const d=document.createElement('i');
 d.style.cssText=`position:absolute;left:50%;top:50%;width:128px;height:128px;margin:-64px 0 0 -64px;pointer-events:none;background:url(assets/fx2/${id}_strip.webp) 0 0/${n*100}% 100% no-repeat;z-index:5`;
 el.appendChild(d);let k=0;const step=(ms||480)/n;const tm=setInterval(()=>{k++;if(k>=n&&!ART2.fxLoop[id]){clearInterval(tm);d.remove();return}d.style.backgroundPosition=`${(k%n)/(n-1)*100}% 0`},step);return d}
// 地图下层缩略图：art2MapThumb(章节0基, 层号0基)
function art2MapThumb(ai,lv){const L=ART2.map['a'+(ai+1)]||[];return L.length?L[Math.min(L.length-1,Math.max(0,lv|0))]:null}
