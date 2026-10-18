// late_mods.js — 魔改技能（6 职业各 2 个，60/75 级解锁）：击杀连锁爆炸、分裂、吸血、召唤物强化、减伤增益、大范围冰潮/震吼
// 接入：clsDef 注册（技能页/前置/自动施法沿用职业技能引擎）；技能树追加 60/75 级两行；CLS_SKPLAN 前置后各先点 1 级、补到 4 级，主线技能点满后再补满；
// 伤害全部走 hitMon，吃主属性加伤（爆炸按死亡怪最大生命百分比，只吃主属性加成不吃后期成长系数，避免地狱后期连锁清屏过快）。
// 音效 sfx_<id>（无配方时按元素回退）；图标为 emoji 占位，特效一次性，不加持续动画。
const XMOD={boom:{},list:[]};
const XM_P=(L,a,b,cap)=>Math.min(cap,a+b*(L-1));
clsDef('nec',[
 {id:'xn_rot',t:1,n:'尸潮冥爆',r:60,col:0,pre:['pe'],ty:'passive',ic:'💀',xboom:{el:'magic',n:4},v:L=>{const p=XM_P(L,8,1,25);return{boom:p,txt:`怪物死亡时尸骸冥爆：对最多 4 个敌人造成其最大生命 ${p}% 的魔法伤害（首领减半，可连锁 2 层）`}}},
 {id:'xn_lord',t:0,n:'冥主统御',r:75,col:1,pre:['rv'],ty:'passive',ic:'👑',v:L=>{const d=XM_P(L,25,5,120),h=XM_P(L,10,3,60);return{sumdmg:d,sumlife:h,txt:`召唤物伤害 +${d}%，召唤物生命 +${h}%`}}}]);
clsDef('sor',[
 {id:'xs_chain',t:0,n:'星火连爆',r:60,col:0,pre:['mmet'],ty:'passive',ic:'🎆',xboom:{el:'fire',n:5},v:L=>{const p=XM_P(L,8,1,25);return{boom:p,txt:`怪物死亡时爆燃：对最多 5 个敌人造成其最大生命 ${p}% 的火焰伤害（首领减半，可连锁 2 层）`}}},
 {id:'xs_tide',t:1,n:'寂灭冰潮',r:75,col:1,pre:['mbliz'],ty:'aoe',el:'cold',ic:'🌊',fx:'boom',sm:3,mana:L=>8,v:(L,sy)=>{const k=1.6+0.05*(L-1),B=['mbliz','mmet','mfball'].filter(x=>bl(x)).map(x=>clsSV(x,Math.max(1,slvl(x))).dmg).reduce((a,b)=>(b[0]+b[1]>a[0]+a[1]?b:a),CLS_DR(60,90,24,32,L,sy)),d=B.map(x=>Math.round(x*k));return{dmg:d,n:12,slow:4,txt:`冰潮席卷最多 12 个敌人 ${clsDtx(d,'cold')}（取暴雪/陨石术/爆炎球中最高伤害 ×${k.toFixed(2)}），减速 4 秒`}}}]);
clsDef('bar',[
 {id:'xb_blood',t:1,n:'血怒狂潮',r:60,col:1,pre:['bfury'],ty:'passive',ic:'🩸',v:L=>{const ll=XM_P(L,2,0.3,8),dr=XM_P(L,5,0.5,15);return{xll:ll,xdr:dr,txt:`攻击吸取 ${ll}% 生命，受到伤害 -${dr}%`}}},
 {id:'xb_quake',t:2,n:'裂地震吼',r:75,col:2,pre:['bbo'],ty:'mall',ic:'🌋',sm:3,mana:L=>8+0.3*L,v:(L,sy)=>{const k=1.15+0.05*(L-1),W=bl('bww')?clsSV('bww',Math.max(1,slvl('bww'))):{pct:Math.round((60+12*(L-1))*sy),flat:4+3*(L-1)};const p=Math.round((100+W.pct)*k-100),f=Math.round((W.flat||0)*k);return{pct:p,flat:f,n:12,stun:1,txt:`震吼撼地：最多 12 个敌人 ${clsMtx(p,f)}（旋风斩 ×${k.toFixed(2)}），并眩晕 1 秒`}}}]);
clsDef('dru',[
 {id:'xd_rift',t:0,n:'元素崩解',r:60,col:0,pre:['darm'],ty:'passive',ic:'🌀',xboom:{el:'magic',n:5},v:L=>{const p=XM_P(L,9,1,26);return{boom:p,txt:`怪物死亡时元素崩解：对最多 5 个敌人造成其最大生命 ${p}% 的魔法伤害（首领减半，可连锁 2 层）`}}},
 {id:'xd_wild',t:2,n:'荒野之潮',r:75,col:1,pre:['dgriz'],ty:'passive',ic:'🐺',v:L=>{const d=XM_P(L,25,5,120),ll=XM_P(L,2,0.2,6);return{sumdmg:d,xll:ll,txt:`召唤物伤害 +${d}%，你的攻击吸取 ${ll}% 生命`}}}]);
clsDef('ama',[
 {id:'xa_split',t:0,n:'裂星分矢',r:60,col:1,pre:['astraf'],ty:'passive',ic:'✴',v:L=>{const n=Math.min(4,2+Math.floor(L/6)),p=XM_P(L,30,2,60);return{split:n,spct:p,txt:`单体技能命中后分裂，再打 ${n} 个敌人，伤害 ${p}%`}}},
 {id:'xa_mark',t:1,n:'猎魂印记',r:75,col:0,pre:['afury'],ty:'passive',ic:'🎯',xboom:{el:'light',n:4},v:L=>{const p=XM_P(L,7,1,22),ll=XM_P(L,2,0.2,6);return{boom:p,xll:ll,txt:`怪物死亡时雷魂炸裂：对最多 4 个敌人造成其最大生命 ${p}% 闪电伤害；攻击吸取 ${ll}% 生命`}}}]);
clsDef('pal',[
 {id:'xp_judg',t:0,n:'圣裁连环',r:60,col:2,pre:['pfist'],ty:'passive',ic:'⚖',xboom:{el:'magic',n:5},v:L=>{const p=XM_P(L,8,1,25);return{boom:p,txt:`怪物死亡时降下圣裁：对最多 5 个敌人造成其最大生命 ${p}% 的魔法伤害（首领减半，可连锁 2 层）`}}},
 {id:'xp_aegis',t:2,n:'圣辉壁垒',r:75,col:2,pre:['psalv'],ty:'buff',ic:'🛡',fx:'shield',mana:L=>20,v:L=>{const dr=XM_P(L,10,0.75,25),ll=XM_P(L,2,0.2,6),t=60+3*(L-1);return{dr,xll:ll,dur:t,txt:`受到伤害 -${dr}%，攻击吸取 ${ll}% 生命；持续 ${t} 秒`}}}]);
clsRegister();
for(const s of CLS_SKILLS)if(/^x[nsbdap]_/.test(s.id))XMOD.list.push(s.id);
function xmOwn(){const c=curCls();return XMOD.list.filter(id=>SKM[id].cls===c)}
function xmV(id){const L=typeof slvl==='function'&&bl(id)?slvl(id):0;return L?clsSV(id,L):null}
// 被动/增益效果：calc 后叠加
{const f=calc;calc=function(...a){const r=f.apply(this,a);try{if(!ST)return r;ST.xll=0;ST.xboom=null;ST.xsplit=null;for(const id of xmOwn()){const s=SKM[id];let v=null;
  if(s.ty==='passive')v=xmV(id);else if(s.ty==='buff'){const b=typeof buffOn==='function'&&buffOn(id);if(b)v=b}if(!v)continue;
  if(v.sumdmg)ST.sumdmg=(ST.sumdmg||0)+v.sumdmg;if(v.sumlife)ST.sumlife=(ST.sumlife||0)+v.sumlife;if(v.xll)ST.xll+=v.xll;if(v.xdr)ST.cdr=Math.min(75,(ST.cdr||0)+v.xdr);
  if(v.boom&&s.xboom)ST.xboom={p:v.boom,el:s.xboom.el,n:s.xboom.n};if(v.split)ST.xsplit={n:v.split,p:v.spct}}}catch(e){}return r}}
// 吸血 / 分裂倍率
let XM_SPK=0;
{const f=hitMon;hitMon=function(m,d,src,fxc){if(XM_SPK&&d){const o={};for(const e in d)o[e]=d[e]*XM_SPK;d=o}const t=f(m,d,src,fxc);
 if(src==='hero'&&t>0&&ST&&ST.xll&&typeof H!=='undefined')H.life=Math.min(ST.life,H.life+t*ST.xll/100*(m&&m.boss?0.5:1));return t}}
// 击杀连锁爆炸（最多 2 层）
let XM_DEP=0;
{const f=killMon;killMon=function(m){const r=f(m);try{const B=ST&&ST.xboom;if(B&&XM_DEP<2&&typeof H!=='undefined'&&H.life>0){XM_DEP++;try{const ts=liveMon().filter(x=>x!==m).slice(0,B.n);const k=1+(typeof latePct==='function'?latePct():0)/100;
  for(const t of ts)hitMon(t,{[B.el]:m.max*B.p/100*k*(t.boss?0.5:1)},'xboom',(typeof CLS_ELC!=='undefined'&&CLS_ELC[B.el])||'#e0c0ff')}finally{XM_DEP--}}}catch(e){}return r}}
// 分裂：单体技能施放后对额外目标按比例重放
{const f=typeof clsAfterCast==='function'?clsAfterCast:null;window.clsAfterCast=function(s,v,ms,L){if(f)f(s,v,ms,L);const X=ST&&ST.xsplit;if(!X||XM_SPK||!CLS_SINGLE.has(s.ty))return;
 const others=liveMon().filter(m=>!L.includes(m)).slice(0,X.n);if(!others.length)return;XM_SPK=X.p/100;try{for(const m of others){const vv=Object.assign({},v,{n:1,hits:1});CLS_TY[s.ty](s,vv,[m],m)}}finally{XM_SPK=0}}}
// 自动加点：前置满足后每个魔改技能先 1 级，主线计划后补到 10，再全部补满
{const f=clsSkPlan;clsSkPlan=function(){const P=f()||(curCls()==='nec'?{order:SK_ORDER,fill:SK_FILL}:null);if(!P)return P;const ms=xmOwn();if(!ms.length)return P;
 const ok=ms.filter(id=>S.lvl>=SKM[id].r);const pre=typeof clsPlanFix==='function'?clsPlanFix(ok):ok;
 return{order:[...pre,...P.order],fill:()=>{const a=P.fill();return[...ok.filter(id=>bl(id)<4),...a,...ok]}}}}
// 技能树：追加 60/75 级两行
{const f=renderSkills;renderSkills=function(...a){const rows=[...new Set(xmOwn().filter(id=>SKM[id].t===SKT).map(id=>SKM[id].r))].filter(r=>!REQL.includes(r));const n0=REQL.length;REQL.push(...rows.sort((x,y)=>x-y));try{return f.apply(this,a)}finally{REQL.length=n0}}}
// 自动施法顺序：魔改技能按类型优先级插到同类技能旁（避免排在列表末尾永远轮不到，尤其增益）
{const f=acState;acState=function(){const a=f();const o=a.order;if(!o._xm){o._xm=1;for(const id of XMOD.list){const i=o.indexOf(id);if(i<0)continue;o.splice(i,1);const p=SKM[id].pri;let j=o.findIndex(x=>SKM[x]&&SKM[x].cls===SKM[id].cls&&(SKM[x].pri??8)>p);if(j<0)j=o.length;o.splice(j,0,id)}}return a}}
// 自动施法估值修正：近战/远程武器技能计入命中率期望与出手耗时（CLS_TYR），避免地狱高防御怪面前误选低命中的单体近战而闲置主力范围技能
{const f=clsEst;clsEst=function(s,ms){let e=f(s,ms);if(CLS_MELEE.has(s.ty)&&ms.length){const m=ms[0],df=m.def*(1-(ST.tdef||0)/100);const c=Math.min(95,Math.max(5,200*ST.ar/(ST.ar+Math.max(1,df))*S.lvl/(S.lvl+m.lv)));e*=c/100/(CLS_TYR[s.ty]||1)}return e}}
