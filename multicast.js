// multicast.js — 装备词缀「技能次数」mcast：攻击技能额外施放 +N 次 / 召唤技能召唤数量 +N
// 出处：稀有及以上（稀有/暗金/套装/传奇）的 武器、护符、副手法器（缩颅等职业副手）；物品等级 40+ 才出现
//   N：物品等级 40–64 → 1；65–79 → 1–2；80+ → 1–3。出现概率：稀有 6%，暗金/套装 12%，传奇 20%
// 全身叠加上限 MC_CAP=3。
// 攻击技能：施放后立即对当前敌人追加 N 次，不额外耗法力；第 2/3/4 次伤害 ×0.4/0.25/0.15（按次递减）。
//   增益/护甲/光环/被动/召唤/炮台/战吼/诅咒/静电场 不触发。追加施放不重复播放特效（只在角色头顶飘一次「连发×N」）。
// 召唤技能：召唤数量上限 +N，且每次施放额外再召 N 只（未满上限时，不额外耗法力）；同组互斥的灵体/藤蔓不受影响。
// 接入：genItem（掉落/商店/赌博共用）→ 词缀文字 MODT.mcast → calc 汇总 ST.mcast → 自动换装战力 power 每点 +110。
const MC_CAP=3,MC_DECAY=[1,0.4,0.25,0.15],MC_NO=new Set(['buff','passive','turret','debuff','wcry','aura','csum','asum','static']);
const MC_P={4:0.06,5:0.12,6:0.12,7:0.2};
MODT.mcast='攻击技能额外施放 / 召唤技能召唤数量 +{v}';
function mcSlotOk(b){return b&&(b.s==='weapon'||b.s==='amulet'||b.cat==='head'||b.cat==='orb')}
function mcRollN(il){if(il<40)return 0;if(il<65)return 1;if(il<80)return R(1,2);return R(1,3)}
function mcAdd(it,il){if(!it||it.k||!it.m||it.m.mcast)return it;const b=BASEM[it.b];const q=it.lp?7:it.q;const p=MC_P[q];if(!p||!mcSlotOk(b))return it;const n=mcRollN(il);if(n&&rnd()<p)it.m.mcast=n;return it}
{const f=genItem;genItem=function(ilvl,opt){return mcAdd(f(ilvl,opt),ilvl)}}
{const f=power;power=function(it){const p=f(it);if(!it||it.k||p===Infinity)return p;const m=typeof allMods==='function'?allMods(it):it.m;return m&&m.mcast?p+110*m.mcast:p}}
{const f=calc;calc=function(...a){const r=f.apply(this,a);try{if(ST){let n=0;for(const k of SLOTS){const it=S.eq[k];if(it&&!it.k){const m=allMods(it);n+=m.mcast||0}}ST.mcast=Math.min(MC_CAP,n)}}catch(e){}return r}}
function mcN(){return(typeof ST!=='undefined'&&ST&&ST.mcast)|0}
// 召唤数量上限 +N
{const f=SV;SV=function(id,L){const v=f(id,L);const n=mcN();if(!n||!v||typeof v.n!=='number')return v;const s=SKM[id];if(!s)return v;
 const sum=s.cls?((s.ty==='csum'||s.ty==='asum')&&!s.g):(s.kind==='summon');if(sum){v.n+=n;if(v.txt)v.txt+=`（召唤数量 +${n}）`}return v}}
let MC_K=0;
{const f=hitMon;hitMon=function(m,d,src,fxc){if(MC_K&&d&&src==='hero'){const o={};for(const e in d)o[e]=d[e]*MC_K;d=o}return f(m,d,src,fxc)}}
function mcIsSummon(s){return s.cls?((s.ty==='csum'||s.ty==='asum')&&!s.g):s.kind==='summon'}
function mcIsAttack(s){return s.cls?!MC_NO.has(s.ty)&&!s.g:s.kind==='attack'}
{const f=acCast;acCast=function(id,ms){const r=f(id,ms);const n=mcN(),s=SKM[id];if(!n||!s||MC_K)return r;try{
 if(mcIsAttack(s)){const ofx=typeof fx==='function'?fx:null,ocf=typeof clsFx==='function'?clsFx:null;if(ofx)fx=()=>{};if(ocf)clsFx=()=>{};let done=0;
  try{for(let i=1;i<=n;i++){const l=liveMon();if(!l.length)break;MC_K=MC_DECAY[i]||0.25;const mana=H.mana;
   if(s.cls){const v=SV(id,slvl(id));CLS_TY[s.ty](s,v,l,target(l))}else f(id,l);H.mana=mana;done++}}finally{MC_K=0;if(ofx)fx=ofx;if(ocf)clsFx=ocf}
  if(done&&typeof floatHero==='function')floatHero('连发×'+(done+1),'#ffd76a')}
 else if(mcIsSummon(s)){for(let i=0;i<n;i++){if(!acFeasible(id,liveMon()))break;const mana=H.mana;MC_K=1;try{s.cls?CLS_TY[s.ty](s,SV(id,slvl(id)),liveMon(),null):f(id,liveMon())}finally{MC_K=0}H.mana=mana}}}catch(e){MC_K=0}return r}}
