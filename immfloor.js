'use strict';
// immfloor.js — 免疫保底（?v=20261020p）
// 原：抗性≥100 为免疫，resOf 返回 100 → 伤害 0；只有诅咒（伤害加深 -100/5=-20、衰老 -50/5=-10、降低抗性 /5）和 MX.conv/PAL_CV 能削，
// 野蛮人等物理职业无诅咒，物免怪（地狱深坑巨魔等）打不动，压碎打击只在命中触发、估值也按 0，结果整波卡住（久战撤退要 300 秒且仅自动推进时）。
// 现：任何伤害类型的有效抗性最高 80（伤害至少 20%），免疫/高抗仍先吃全部 -抗来源（诅咒 1/5 等）再封顶；元素免疫同样适用。
const RES_CAP_EFF=80;
{const f=resOf;resOf=function(m,k){const r=f(m,k);return r>RES_CAP_EFF?RES_CAP_EFF:r}}
// 安全网：原地挂机（S.auto=0）时 stuckTick 不处理；同一波 45 秒毫无进展则重刷本波
{const f=stuckTick;stuckTick=function(dt){f(dt);if(S.auto||!ACX||!(ACX.st>45))return;ACX.st=0;if(typeof log==='function')log('<b style="color:#f84">久战不下，重整本波</b>');MON=[];spawnT=0.5}}
