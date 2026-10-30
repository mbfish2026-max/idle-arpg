'use strict';
// ===================================================================================
// mercskill.js — 佣兵专属技能：每种佣兵 1 个主动（冷却、战斗中自动释放、飘字+特效）+ 1 个被动（持续属性加成）
// 解锁：佣兵等级 ≥ MSK_PLV(被动) / MSK_ALV(主动) 自动解锁；之后每 20 级提升 1 阶（最高 4 阶）。
// 平衡：被动只给生存类属性（不加伤害）；弓手/法师主动为平均伤害的小比例、长冷却；守卫/野蛮人主动无伤害（治疗/减速/震晕）。
// 不写存档（全部由佣兵类型/等级推导），旧存档无需迁移。运行时包装 mercStats / mercTick / renderMercPage，须在 merc.js 后加载。
// ===================================================================================
const MSK_PLV=8,MSK_ALV=15;
const MSK={
 archer:{p:{n:'林影身法',d:r=>`防御 +${15+5*r}%，物理减伤 +${2+r}%`,f:(ms,r)=>{ms.def=Math.round(ms.def*(1+(15+5*r)/100));ms.pdr=(ms.pdr||0)+2+r}},
         a:{n:'流星散矢',cd:12,ic:'✶',d:r=>`向至多 4 个敌人各射出一支元素箭，造成平均伤害 ${15+3*r}% 的${'火焰/冰冷'}伤害`}},
 guard:{p:{n:'铁卫姿态',d:r=>`全抗性 +${6+3*r}，生命 +${4+2*r}%`,f:(ms,r)=>{for(const e in ms.res)ms.res[e]+=6+3*r;ms.avgres=(ms.avgres||0)+6+3*r;ms.life=Math.round(ms.life*(1+(4+2*r)/100))}},
        a:{n:'守望号角',cd:15,ic:'⟲',d:r=>`吹响号角，为角色、召唤物与自身回复 ${8+2*r}% 最大生命，并使全部敌人减速 2 秒`}},
 mage:{p:{n:'法纹护幕',d:r=>`全抗性 +${8+4*r}，每秒回复生命 +${r}×等级/10`,f:(ms,r)=>{for(const e in ms.res)ms.res[e]+=8+4*r;ms.avgres=(ms.avgres||0)+8+4*r;ms.regen=(ms.regen||0)+r*ms.L/10}},
       a:{n:'星潮迸发',cd:14,ic:'✺',d:r=>`以自身元素冲击全部敌人，造成平均伤害 ${15+3*r}% 的元素伤害`}},
 barb:{p:{n:'岩骨之躯',d:r=>`生命 +${6+3*r}%，物理减伤 +${2+r}%`,f:(ms,r)=>{ms.life=Math.round(ms.life*(1+(6+3*r)/100));ms.pdr=(ms.pdr||0)+2+r}},
       a:{n:'裂地战嚎',cd:18,ic:'✊',d:r=>`怒吼回复自身 ${15+5*r}% 最大生命，并震晕全部非首领敌人`}},
};
const MSKX={cd:0,fire:0};
function mskRank(L,need){return L>=need?Math.min(4,1+Math.floor((L-need)/20)):0}
function mskInfo(t,L){const D=MSK[t];if(!D)return null;return{D,pr:mskRank(L,MSK_PLV),ar:mskRank(L,MSK_ALV)}}
// 被动：包装 mercStats（含界面预览/对比）
const _msk_ms=mercStats;mercStats=function(){const ms=_msk_ms.apply(this,arguments);try{const m=S.merc;const I=m&&mskInfo(m.t,ms.L||m.lvl);if(I&&I.pr){I.D.p.f(ms,I.pr);ms.msk=I.pr}}catch(e){}return ms};
// 主动：包装 mercTick
// 技能伤害不触发装备命中特效（压碎打击/撕裂等按目标生命比例，横扫全体时会放大输出）
if(typeof attackerMods==='function'){const _msk_am=attackerMods;attackerMods=function(src){return MSKX.raw?{}:_msk_am.apply(this,arguments)}}
function mskCast(a,ms,mons){MSKX.raw=1;try{return mskCast0(a,ms,mons)}finally{MSKX.raw=0}}
function mskCast0(a,ms,mons){const M=S.merc,I=mskInfo(M.t,M.lvl),r=I.ar,avg=(ms.dmg[0]+ms.dmg[1])/2,el=M.t==='archer'?(M.v==='fire'?'fire':'cold'):M.v;let n=0;
 if(M.t==='archer'){for(const m of mons.slice(0,4)){hitMon(m,{[el]:avg*(15+3*r)/100},a,ELC[el]);if(typeof fxLine==='function')fxLine(a.uid,m.uid,ELC[el]);n++}}
 else if(M.t==='guard'){for(const x of ALLY)if(x.hp>0&&x.kind!=='wall')x.hp=Math.min(x.max,x.hp+x.max*(8+2*r)/100);if(typeof H!=='undefined'&&typeof ST!=='undefined'&&ST&&H.life>0)H.life=Math.min(ST.life,H.life+ST.life*(8+2*r)/100);for(const m of mons){m.slow=GT+2;n++}if(typeof fx==='function')fx('shield',mons)}
 else if(M.t==='mage'){const e=ELC[el]?el:'fire';for(const m of mons){hitMon(m,{[e]:avg*(15+3*r)/100},a,ELC[e]);n++}if(typeof fx==='function')fx('nova',mons)}
 else if(M.t==='barb'){a.hp=Math.min(a.max,a.hp+a.max*(15+5*r)/100);for(const m of mons)if(!m.boss){m.stun=1;n++}if(typeof fx==='function')fx('boom',mons)}
 MSKX.fire++;try{if(typeof document!=='undefined'&&!window.__NOUI&&TAB==='fight'){floatNum('a'+a.uid,I.D.a.ic+' '+I.D.a.n,'#7dffb0');const el=document.getElementById('ca'+a.uid);if(el){el.classList.add('mskcast');setTimeout(()=>el.classList.remove('mskcast'),700)}}}catch(e){}return n}
const _msk_tick=mercTick;mercTick=function(dt){_msk_tick.apply(this,arguments);try{if(!S||!S.merc||!mercUp()||S.merc.dead)return;const a=ALLY.find(x=>x.kind==='merc');if(!a||a.hp<=0)return;
 const ms=a.ms||mercStats(),I=mskInfo(S.merc.t,S.merc.lvl);if(!I||!I.ar)return;MSKX.cd-=dt;if(MSKX.cd>0)return;const mons=liveMon();if(!mons.length){MSKX.cd=Math.max(MSKX.cd,0);return}
 mskCast(a,ms,mons);MSKX.cd=I.D.a.cd}catch(e){console.warn('mercskill',e)}};
// 界面：佣兵页「专属技能」面板 + 点击弹窗详情
function mskHTML(){const m=S.merc,I=mskInfo(m.t,m.lvl);if(!I)return'';const row=(k,need,rk)=>{const X=I.D[k];return`<div class="mskx ${rk?'':'off'}" onclick="mskDetail('${k}')"><div class="mskh"><b>${k==='a'?'⚡ 主动':'◆ 被动'} · ${X.n}</b><span class="dim">${rk?'阶 '+rk+'/4':'Lv.'+need+' 解锁'}${k==='a'?' · 冷却 '+X.cd+'s':''}</span></div><div class="mskd">${X.d(Math.max(1,rk))}</div></div>`};
 return`<div class="gp mskp"><h3>专属技能</h3>${row('p',MSK_PLV,I.pr)}${row('a',MSK_ALV,I.ar)}<div class="dim">佣兵等级达到 ${MSK_PLV}/${MSK_ALV} 级分别解锁被动/主动，之后每 20 级提升 1 阶（最高 4 阶）。主动在战斗中自动释放。</div></div>`}
function mskDetail(k){const m=S.merc,I=mskInfo(m.t,m.lvl),X=I.D[k],rk=k==='a'?I.ar:I.pr,need=k==='a'?MSK_ALV:MSK_PLV;
 const lv=[1,2,3,4].map(r=>`<div class="mrow"><span>阶 ${r}（Lv.${need+20*(r-1)}）</span><b class="${r===rk?'g':'dim'}">${X.d(r)}</b></div>`).join('');
 modal(`<div class="mtitle">${X.n}</div><div class="gp"><div class="dim">${k==='a'?'主动 · 冷却 '+X.cd+' 秒 · 战斗中自动释放':'被动 · 持续生效'}</div><div class="mskd big">当前：${rk?X.d(rk):'未解锁（佣兵 Lv.'+need+'）'}</div>${lv}<div class="btns"><button class="btn sm" onclick="closeM()">关闭</button></div></div>`)}
const _msk_rp=renderMercPage;renderMercPage=function(){const r=_msk_rp.apply(this,arguments);try{if(typeof document==='undefined'||window.__NOUI||!mercUp())return r;const P=$('#panel');
 const h=[...P.querySelectorAll('.mercpg .gp h3')].find(x=>x.textContent.startsWith('技能与光环'));const g=h?h.parentElement:P.querySelector('.mercpg .gp');if(g)g.insertAdjacentHTML('afterend',mskHTML())}catch(e){console.warn('mercskill ui',e)}return r};
