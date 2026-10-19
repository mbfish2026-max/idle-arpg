// uber_bal.js — 弱势流派对首领伤害补偿（只调技能数值，不改首领）：暗渊/魂狱/秘境之主/章节首领等 m.boss 目标。
// 依据 ub_abyss 终局配装测试：召唤死灵/召唤德鲁伊/锤子圣骑/拳圣骑/风德/战吼野蛮人/电法 暗渊 0–20% 胜率，首领战输出不足（三魂剩 90–100% 血）。
// 系数作用于英雄与召唤物（协同）对首领造成的全部伤害；佣兵不吃。流派判定用当前流派 nbOn()。
function ubbBoss(m){return !!(m&&(m.boss||m.egMjBoss||m.ubS||m.ubG))}
var UBB={sum:3.5,dru_sum:5,dru_wind:1.7,pal_ham:7,pal_fist:9,bar_cry:2};
// 未成套补偿：已选流派但套装件数 n<6 时，对首领伤害再 ×(1+UBN.per×(6−n))，让随机掉落/无套装角色也有机会。
var UBN={per:0.25};
function ubbSetK(b){try{const B=NB.builds[b];if(!B||!B.set||typeof nbSetN!=='function')return 1;return 1+UBN.per*Math.max(0,6-nbSetN(B.set))}catch(e){return 1}}
{const f=hitMon;hitMon=function(m,d,src,fxc){try{if(m&&ubbBoss(m)&&d&&src!=='merc'&&!(src&&src.kind==='merc')&&typeof nbOn==='function'){const b=nbOn(),k=b?(UBB[b]||1)*ubbSetK(b):1;if(k!==1){const o={};for(const e in d)o[e]=typeof d[e]==='number'?d[e]*k:d[e];d=o}}}catch(e){}return f(m,d,src,fxc)}}
// 召唤流派首领战协同（白骨统帅 sum / 召唤德鲁伊 dru_sum，仅首领在场时）：
// ①替死：英雄将阵亡时，牺牲一只召唤物替死，英雄回复 UBS.heal 生命，冷却 UBS.cd 秒；
// ②首领机制伤害（暗渊新星/赤芒）×(1 − min(UBS.cap, UBS.per×存活召唤物数))；
// ③白骨统帅首领战无尸体：首领在场时每 UBS.bone 秒凝出一具骸骨（尸体）。
var UBS={heal:1,cd:1,per:0.12,cap:0.5,bone:2.5,b:{sum:1,dru_sum:1}};
function ubbOn(){return typeof nbOn==='function'&&!!UBS.b[nbOn()]&&MON.some(m=>ubbBoss(m)&&m.hp>0)}
function ubbPets(){return ALLY.filter(a=>a.hp>0&&a.kind!=='merc')}
{let next=0;const f=die;die=function(...a){try{if(ubbOn()&&GT>=next){const L=ubbPets();if(L.length){const p=L.sort((x,y)=>y.hp-x.hp)[0];p.hp=0;H.life=Math.round(ST.life*UBS.heal);next=GT+UBS.cd;floatHero('替死','#9f9');return}}}catch(e){}return f.apply(this,a)}}
if(typeof ubHitHero==='function'){const f=ubHitHero;ubHitHero=function(v,el,txt){try{if(ubbOn()){const n=ubbPets().length;if(n)v=v*(1-Math.min(UBS.cap,UBS.per*n))}}catch(e){}return f(v,el,txt)}}
{let acc=0;const f=step;step=function(dt){try{if(typeof nbOn==='function'&&nbOn()==='sum'&&MON.some(m=>ubbBoss(m)&&m.hp>0)){acc+=dt;if(acc>=UBS.bone){acc=0;if(CORPSE.length<4){const b=MON.find(m=>ubbBoss(m)&&m.hp>0);CORPSE.push({max:Math.min(b.max,ST.life*20),key:'skel',lv:S.lvl})}}}else acc=0}catch(e){}return f(dt)}}
// 火德（火系流派或未选流派的德鲁伊）对首领火焰穿透：首领火焰有效抗性 −UBF.pen（免疫保底 80 → 50），解决秘境之主火免/高火抗时「毫无进展」失败。
var UBF={pen:20};
if(typeof resOf==='function'){const f=resOf;resOf=function(m,k){const r=f(m,k);try{if(k==='fire'&&m&&ubbBoss(m)&&curCls()==='dru'){const b=typeof nbOn==='function'?nbOn():null;if(!b||b==='dru_fire')return r-UBF.pen}}catch(e){}return r}}
