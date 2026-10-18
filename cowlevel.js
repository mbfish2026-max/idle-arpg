'use strict';
// ===== 奶牛关（哞哞牧场）：通关某难度第五章终章首领后，地图页出现该难度专属入口 =====
// 实现：区域挂在 ACTS[4].zones.cow（非数组下标，不影响章节进度/区域数），S.zone='cow' 时进入。
// 清图后原地循环；怪物等级 = 该难度第五章末(mlD(45)) +1；美术暂用现有贴图+CSS 滤镜（TODO：美术bot出图）
const COW={xp:1.25,mf:60,rune:0.04,ml:1,w:25,dens:2,gap:0.35};
MONS.cowbeast={n:'狂蛮牛魔',ic:'🐂',fam:'牛魔',hp:48,dmg:[5,12],ar:38,def:22,exp:40,res:{},resH:{fire:30},a:MONS.yeti.a,sk:['charge'],cow:1};
MONS.cowbrute={n:'铁角蛮牛',ic:'🐃',fam:'牛魔',hp:60,dmg:[6,15],ar:42,def:30,exp:46,spd:0.9,res:{phys:20},resH:{phys:40,light:50},a:MONS.mauler.a||MONS.yeti.a,sk:['stun'],cow:1};
BOSSES.cowking={n:'牛魔王',ic:'🐮',hp:900,dmg:[14,34],ar:160,def:120,exp:30000,res:{fire:40,cold:40,light:40,pois:40},a:BOSSES.valax.a,sk:['charge','stun'],cow:1};
const COWZ={n:'哞哞牧场',w:COW.w,mons:['cowbeast','cowbrute','cowbeast'],bg:'bg_snow',boss:'cowking',cow:1};
Object.defineProperty(COWZ,'ml',{get(){return mlD(45,S.diff)+COW.ml},set(){}});
ACTS[4].zones.cow=COWZ;
function cowOpen(d){const q=d===S.diff?S.q:(S.Q&&S.Q[d])||{};return!!(q&&q[ACTS[4].fq])}
function inCow(){return S&&S.zone==='cow'}
function cowGo(d){if(!cowOpen(d))return toast('尚未解锁');if(S.act!==4||S.diff!==d)goAct(4,d,1);if(!inCow())S.cowPrev=S.zone;S.zone='cow';S.wave=0;MON=[];CORPSE=[];spawnT=1;log(`前往 <b>${COWZ.n}</b>（${DIFFS[d].n}）`);TAB='fight';render()}
// 存档进度只记录数字区域，防止 'cow' 污染 ZN
{const f=syncProg;syncProg=function(){if(!inCow())return f();const z=S.zone;S.zone=S.cowPrev|0;try{f()}finally{S.zone=z}}}
{const f=goZone;goZone=function(i){if(typeof i!=='number'||isNaN(i))i=inCow()?(S.cowPrev|0):0;return f(i)}}
{const f=goAct;goAct=function(a,d,q){if(inCow())S.zone=S.cowPrev|0;return f(a,d,q)}}
// 密度更高
{const f=spawnWave;spawnWave=function(){const n0=MON.length;f();if(!inCow()||MON.some(m=>m.boss))return;const add=Math.round((MON.length-n0)*(COW.dens-1));const z=zoneData();for(let i=0;i<add&&MON.length<DENSITY.cap;i++)MON.push(mkMon(pick(z.mons),z.ml))}}
// 经验加成
{const f=mkMon;mkMon=function(k,lv,fl){const m=f(k,lv,fl);if(inCow())m.exp*=COW.xp;return m}}
// 掉落：MF +60，额外符文几率
{const f=rollTC;rollTC=function(m){if(!inCow())return f(m);const mf=ST.mf;ST.mf=mf+COW.mf;let o;try{o=f(m)}finally{ST.mf=mf}
 if(rnd()<(m.boss?1:COW.rune))o=(o||[]).concat([rollRune(m.lv)]);return o}}
// 清图：留在牧场循环
{const f=zoneClear;zoneClear=function(){if(!inCow())return f();S.dz=0;if(mercDead())mercRevive(1);S.cowN=(S.cowN||0)+1;log(`<b class="quest">${COWZ.n} 已肃清（第${S.cowN}轮）</b>${S.auto?' · 牛群再度聚集':''}`);S.wave=0}}
// 连续阵亡：退回第五章最后已解锁区域
{const f=die;die=function(){if(inCow()){S.dz=(S.dz||0)+1;if(S.dz>=3){S.dz=0;S.zone=Math.min(S.cowPrev|0,S.unl);log('<b style="color:#f84">牛群太凶猛，暂且撤离牧场</b>')}}return f()}}
// 卡片滤镜
{const f=monCard;monCard=function(m){const h=f(m);return(MONS[m.key]||BOSSES[m.key]||{}).cow?h.replace('class="mc ','class="mc cowm '):h}}
// 地图入口（每难度一个，挂在章节标签下方）
{const f=renderMap;renderMap=function(){f();const d=MAPD==null?S.diff:MAPD;if(!cowOpen(d))return;const P=$('#panel'),cur=inCow()&&S.diff===d;
 const h=`<div class="zc bz cowzc ${cur?'cur':''}" onclick="cowGo(${d})"><div><b>🐮 ${COWZ.n}</b> <span class="tag">秘境</span><span class="tag">${DIFFS[d].n}</span><div class="dim">狂蛮牛魔·铁角蛮牛 · 首领 <span class="bossn">牛魔王</span></div><div class="dim">经验+25% · 寻宝+60 · 符文↑ · 循环刷图</div></div><div class="zr"><span>mlvl ${mlD(45,d)+COW.ml}</span><small>${COW.w}波</small>${cur?'<em>当前</em>':''}</div></div>`;
 const g=P.querySelector('.actc');if(g)g.insertAdjacentHTML('beforebegin',h);else P.insertAdjacentHTML('beforeend',h)}}
// 战斗页区域名
{const f=renderFight;renderFight=function(){f();if(!inCow())return;const fb=$('#fbattle');if(fb)fb.classList.add('cowbg')}}
document.head.insertAdjacentHTML('beforeend',`<style>.mc.cowm .pt img{filter:sepia(1) saturate(2.2) hue-rotate(-25deg) brightness(1.05)}.mc.cowm.boss .pt img{filter:sepia(1) saturate(3) hue-rotate(-40deg) brightness(1.1) drop-shadow(0 0 4px #f80)}
.cowzc{border-color:#c8963c!important;background:linear-gradient(90deg,rgba(120,80,20,.35),rgba(0,0,0,.2))!important;max-width:100%;box-sizing:border-box}#fbattle.cowbg{filter:none}</style>`);
// 25 波高密度：同屏上限仍为 12（省电），清屏后下一波快速刷出
{const f=step;step=function(dt){f(dt);if(inCow()&&!liveMon().length&&spawnT>COW.gap)spawnT=COW.gap}}
