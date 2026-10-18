// summon_surv.js — 召唤物后期生存成长（亡灵骷髅/骨巫/魔像/复生怪、德鲁伊与射手召唤物；不含雇佣兵、骨墙）
// 原版召唤物生命只随技能等级线性增长，没有防御/减伤，元素抗性只来自「冥仆抗性」，地狱后期怪（再叠加怪物难度）几下就秒掉。
// 包装 addAlly / step / calc：
//  1) 生命（复生怪除外，它按原怪物生命）× 等级成长系数 SUMS_HP（30 级前 =1，按对数插值）× (1 + 主属性加成% × 0.5)
//  2) 元素抗性下限 SUMS_RES（取与冥仆抗性的较大值）
//  3) 持续回复：每秒回复最大生命的 SUMS_REG%（受伤 1.5 秒后生效，不叠加动画）
//  4) 物理减伤：受到的物理伤害按 SUMS_DR% 返还（存活时结算，按回合差值计算）
//  5) 荒野之潮 额外召唤物生命 +10~60%（与冥主统御对称）
const SUMS_HP=[[1,1],[30,1],[50,1.8],[70,3.2],[85,5]];
const SUMS_RES=[[1,0],[30,0],[50,20],[70,40],[85,55]];
const SUMS_DR=[[1,0],[30,0],[50,15],[70,30],[85,40]];
const SUMS_REG=[[1,0],[30,0.5],[85,2]];
function sumsK(t){const l=(typeof S!=='undefined'&&S&&S.lvl)||1;if(l<=t[0][0])return t[0][1];for(let i=1;i<t.length;i++)if(l<=t[i][0]){const[a,x]=t[i-1],[b,y]=t[i];return x+(y-x)*(l-a)/(b-a)}return t[t.length-1][1]}
function sumsHpK(){const l=(typeof S!=='undefined'&&S&&S.lvl)||1;let k=1;for(let i=1;i<SUMS_HP.length;i++){const[a,x]=SUMS_HP[i-1],[b,y]=SUMS_HP[i];if(l>a)k=x*Math.pow(y/x,Math.min(1,(l-a)/(b-a)))}return k*(1+(typeof latePct==='function'?latePct():0)*0.5/100)}
const sumsOk=a=>a&&a.kind!=='merc'&&a.kind!=='wall';
{const f=addAlly;addAlly=function(kind,o){const a=f(kind,o);try{if(sumsOk(a)){const k=a.kind==='rev'?1:sumsHpK();if(k>1){a.max=Math.round(a.max*k);a.hp=Math.round(a.hp*k)}a.res=Math.max(a.res||0,sumsK(SUMS_RES));a.sdr=sumsK(SUMS_DR)}}catch(e){}return a}}
{const f=step;step=function(dt){const pre=typeof ALLY!=='undefined'?ALLY.map(a=>[a,a.hp]):[];const r=f(dt);try{const reg=sumsK(SUMS_REG)/100;
 for(const[a,h0]of pre){if(!sumsOk(a)||a.hp<=0)continue;const loss=h0-a.hp;if(loss>0){if(a.sdr)a.hp=Math.min(a.max,a.hp+loss*a.sdr/100);a.sumsT=GT}
  else if(reg&&GT-(a.sumsT||0)>1.5)a.hp=Math.min(a.max,a.hp+a.max*reg*dt)}}catch(e){}return r}}
{const f=calc;calc=function(...a){const r=f.apply(this,a);try{if(ST&&typeof bl==='function'&&bl('xd_wild')&&typeof slvl==='function'){const L=slvl('xd_wild');ST.sumlife=(ST.sumlife||0)+Math.min(60,10+3*(L-1))}}catch(e){}return r}}
