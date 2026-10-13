'use strict';
// ===== 第四阶段：技能图标 / 自动施法设置（替换原施法 AI）/ 战斗技能栏 / 技能特效动画 =====
// 在 acts.js 之后加载；只包装 game.js 的全局函数。设置存于当前角色存档 S.autoCast（缺失用默认值）。

// ---------- 资源 ----------
for(const s of SKILLS)ASSETS['ski_'+s.id]='assets/skill/'+s.id+'.webp';
for(const k of ['spear','spirit','teeth','boom','poison','nova','armor','curse','summon'])ASSETS['fx_'+k]='assets/fx/'+k+'.webp';
skIcon=function(s){const k='ski_'+s.id;if(IMG[k])return`<i class="ski img" style="background-image:url(${IMG[k]})"></i>`;
 const i=SKILLS.filter(x=>x.t===s.t).indexOf(s),sh='sk_sheet'+s.t;return IMG[sh]?`<i class="ski" style="background-image:url(${IMG[sh]});background-position:${(i%5)*25}% ${Math.floor(i/5)*100}%"></i>`:`<i class="ski t${s.t}">${s.ic}</i>`};

// ---------- 自动施法设置 ----------
const AC_KINDS=['attack','curse','summon','golem','corpse','wall','cc','buff'];
const AC_IV=[1,2,3,5,10],AC_MP=[20,40,60,80];
const AC_MODEN={smart:'智能',int:'固定间隔',mana:'法力阈值'};
// 默认优先级 = 原 AI 顺序：骨铠 → 魔像 → 诅咒 → 召唤(复生/骨仆/骨巫) → 骨墙 → 骨牢 → 尸体技能 → 攻击
const AC_DEF_ORDER=['ba','fg','ig','bg','cg','lr','de','ad','lt','wk','im','at','cf','tr','dv','rv','rs','rm','bw','bp','pe','ce','bx','bs','pn','te','pd'];
const AC_SMART={curseN:3,corpseN:2,wallN:3,ccN:3,atkMana:40};// 智能模式条件参数
function acActive(id){const s=SKM[id];return s&&AC_KINDS.includes(s.kind)}
function acState(){const a=S.autoCast||(S.autoCast={});a.cfg=a.cfg||{};a.order=a.order||[];
 for(const id of AC_DEF_ORDER)if(!a.order.includes(id))a.order.push(id);for(const s of SKILLS)if(acActive(s.id)&&!a.order.includes(s.id))a.order.push(s.id);return a}
function acCfg(id){const a=acState();return Object.assign({on:1,mode:'smart',iv:2,mp:40},a.cfg[id]||{})}
function acSet(id,k,v){const a=acState();a.cfg[id]=Object.assign(acCfg(id),{[k]:v});if(typeof save==='function')save();acRefresh()}
function acMove(id,d){const o=acState().order,i=o.indexOf(id),j=i+d;if(i<0)return;
 // 只在“已学”技能之间移动
 let k=j;while(k>=0&&k<o.length&&!bl(o[k]))k+=d;if(k<0||k>=o.length)return;[o[i],o[k]]=[o[k],o[i]];save();acRefresh()}
function acLearned(){return acState().order.filter(id=>acActive(id)&&bl(id))}
const ACT={};// 上次施放时间(GT)
// 通用可行性（三种模式都要满足）：法力足、有目标/尸体、召唤未满等
function acFeasible(id,ms){if(!castable(id))return 0;const s=SKM[id],L=slvl(id);
 switch(s.kind){
 case'buff':return H.abs<ST.life*0.02+1;// 骨铠：护盾(几乎)耗尽才补，避免浪费
 case'golem':return golemKind()===id&&!cntA('golem');
 case'summon':if(!CORPSE.length)return 0;if(id==='rs')return cntA('skel')<SV('rs',L).n;if(id==='rm')return cntA('mage')<SV('rm',L).n;if(id==='rv')return cntA('rev')<SV('rv',L).n&&MONS[CORPSE[CORPSE.length-1].key];return 0;
 case'curse':return ms.some(m=>!curseOf(m,id)&&!(id==='tr'&&m.boss));
 case'corpse':return CORPSE.length&&ms.length>0;
 case'wall':return ms.length>0&&!cntA('wall');
 case'cc':return ms.length>0;
 case'attack':return ms.length>0&&(id!=='pd'||ST.dagger);}
 return 0}
function acSmart(id,ms){const s=SKM[id];
 switch(s.kind){
 case'curse':{const cu=S.curse||null;if(cu&&cu!==id)return 0;if(!cu&&curseSkillAuto()!==id)return 0;
  return ms.length>=AC_SMART.curseN||ms.some(m=>m.boss||m.fl==='uniq'||m.fl==='champ')}
 case'corpse':return ms.length>=AC_SMART.corpseN&&rnd()<0.5;
 case'wall':return ms.length>=AC_SMART.wallN;
 case'cc':return ms.length>=AC_SMART.ccN&&rnd()<0.3;
 case'attack':{if(mainSkill()!==id)return 0;const full=!(bl('rs')&&cntA('skel')<SV('rs',slvl('rs')).n);return full||H.mana>ST.mana*AC_SMART.atkMana/100}}
 return 1}
function curseSkillAuto(){return['lr','de','ad','lt','wk','im','at','cf','tr','dv'].find(castable)}
function acWant(id,ms){const c=acCfg(id);if(!c.on||!acFeasible(id,ms))return 0;
 if(c.mode==='int')return GT-(ACT[id]??-1e9)>=c.iv;
 if(c.mode==='mana')return H.mana>=ST.mana*c.mp/100;
 return acSmart(id,ms)}
// 施放实现（与原 heroAct 各分支一致）
function acCast(id,ms){const L=slvl(id),s=SKM[id];ACT[id]=GT;
 if(s.kind==='buff'){spend(id);H.abs=SV('ba',L).abs;fx('shield');return 1}
 if(s.kind==='golem'){spend(id);const v=SV(id,L);addAlly('golem',{sub:id,n:s.n,hp:v.life,dmg:v.dmg,th:v.th,aura:v.aura,el:id==='fg'?'fire':'phys'});fx('summon');return 1}
 if(s.kind==='summon'){const L2=x=>slvl(x);
  if(id==='rv'){const c=CORPSE.pop();const T=MONS[c.key];spend('rv');const sm=L2('sm'),m=mkMon(c.key,c.lv);addAlly('rev',{n:'复生·'+T.n,ic:T.ic,a:T.a,hp:m.max*3*(1+0.1*sm),dmg:m.dmg.map(x=>x*(1+0.1*sm)),until:GT+180});fx('summon');return 1}
  CORPSE.pop();spend(id);const v=SV(id,L);if(id==='rs')addAlly('skel',{n:'骨仆',hp:v.life,dmg:v.dmg});else addAlly('mage',{n:'骨巫',hp:v.life,dmg:v.dmg,el:pick(['fire','cold','light','pois']),ranged:1});fx('summon');return 1}
 if(s.kind==='curse'){const tg=ms.filter(m=>!curseOf(m,id)&&!(id==='tr'&&m.boss));const v=SV(id,L);spend(id);for(const m of tg.slice(0,v.n))m.cur={id,until:GT+v.dur,x:v.x,p:v.p};fxCurse(tg.slice(0,v.n));return 1}
 if(s.kind==='wall'){spend(id);addAlly('wall',{n:'骨墙',hp:SV('bw',L).life,dmg:[0,0],until:GT+24});return 1}
 if(s.kind==='cc'){spend(id);const v=SV('bp',L);for(const m of ms.slice(0,3))m.stun=v.dur;fx('prison',ms.slice(0,3));return 1}
 if(s.kind==='corpse'){spend(id);const c=CORPSE.pop(),v=SV(id,L);const tg=ms.slice().sort(()=>rnd()-.5).slice(0,v.n);
  for(const m of tg){if(id==='ce'){const d=c.max*(0.6+rnd()*0.4);hitMon(m,{phys:d/2,fire:d/2},'hero','#ff8a30')}else hitMon(m,{pois:R(v.dmg[0],v.dmg[1])},'hero','#6f6')}fx(id==='ce'?'boom':'cloud',tg);return 1}
 if(s.kind==='attack'){const v=SV(id,L);spend(id);const tg=target(ms);
  if(id==='te'){for(let i=0;i<v.n;i++){const m=pick(liveMon());if(!m)break;if(rnd()<0.45)hitMon(m,{magic:R(v.dmg[0],v.dmg[1])},'hero','#e8e0c0')}fx('teeth',liveMon())}
  else if(id==='bs'){const tg3=[tg,...ms.filter(m=>m!==tg)].slice(0,3);for(const m of tg3)hitMon(m,{magic:R(v.dmg[0],v.dmg[1])},'hero','#f0ead0');fx('spear',tg3)}
  else if(id==='bx'){hitMon(tg,{magic:R(v.dmg[0],v.dmg[1])},'hero','#cfe');fx('spirit',[tg])}
  else if(id==='pn'){for(const m of ms)hitMon(m,{pois:R(v.dmg[0],v.dmg[1])},'hero','#6f6');fx('nova',ms)}
  else if(id==='pd'){if(hitChance(ST.ar,tg.def,S.lvl,tg.lv))hitMon(tg,{pois:R(v.dmg[0],v.dmg[1]),phys:R(ST.wmin,ST.wmax)},'hero','#6f6');fx('stab',[tg])}
  return 1}
 return 0}
// 新施法 AI：按优先级逐个检查“开关 + 模式条件 + 可行性”，都不满足则普攻（离线结算按在线击杀速率折算，sim.py 也走这里）
heroAct=function(){const ms=liveMon();
 for(const id of acState().order){if(!bl(id)||!acActive(id))continue;if(!ms.length&&!['buff','golem','summon'].includes(SKM[id].kind))continue;if(acWant(id,ms))return acCast(id,ms)}
 if(!ms.length)return 0;
 const tg=target(ms);if(hitChance(ST.ar,tg.def*(1-ST.tdef/100),S.lvl,tg.lv)){const d=hitMon(tg,{phys:R(ST.wmin,ST.wmax),fire:ST.fire,cold:ST.cold,light:ST.light?R(1,ST.light):0,pois:ST.pois},'hero','#fff');
  if(d){H.life=Math.min(ST.life,H.life+d*ST.ll/100);H.mana=Math.min(ST.mana,H.mana+d*ST.ml/100)}}fx('slash',[tg]);return 2};

// ---------- 设置 UI ----------
function acRow(id,i,n){const s=SKM[id],c=acCfg(id);
 const opt=c.mode==='int'?AC_IV.map(v=>`<button class="btn xs ${c.iv===v?'on':''}" onclick="acSet('${id}','iv',${v})">${v}秒</button>`).join(''):c.mode==='mana'?AC_MP.map(v=>`<button class="btn xs ${c.mp===v?'on':''}" onclick="acSet('${id}','mp',${v})">${v}%</button>`).join(''):`<span class="dim">${acSmartTxt(id)}</span>`;
 return`<div class="acr ${c.on?'':'off'}"><div class="acn"><span class="aci">${i+1}</span>${skIcon(s)}<b>${s.n}</b><span class="btns"><button class="btn xs" onclick="acMove('${id}',-1)" ${i?'':'disabled'}>▲</button><button class="btn xs" onclick="acMove('${id}',1)" ${i<n-1?'':'disabled'}>▼</button>
 <button class="btn xs ${c.on?'on':''}" onclick="acSet('${id}','on',${c.on?0:1})">${c.on?'自动:开':'自动:关'}</button></span></div>
 <div class="btns acm">${Object.entries(AC_MODEN).map(([k,v])=>`<button class="btn xs ${c.mode===k?'on':''}" onclick="acSet('${id}','mode','${k}')">${v}</button>`).join('')}</div><div class="btns aco">${opt}</div></div>`}
function acSmartTxt(id){const k=SKM[id].kind;return{curse:`目标无该诅咒且怪物≥${AC_SMART.curseN}或有精英/首领`,summon:'数量未满且有尸体时补',golem:'魔像不在场时召唤',corpse:`怪物≥${AC_SMART.corpseN}且有尸体`,wall:`怪物≥${AC_SMART.wallN}且无骨墙`,cc:`怪物≥${AC_SMART.ccN}`,buff:'护盾耗尽时补',attack:`主攻技能；骨仆未满时法力<${AC_SMART.atkMana}%停手留蓝`}[k]||''}
function acPanel(){const L=acLearned();return`<div class="gp acp"><h3>自动施法</h3><div class="dim">按优先级从上到下检查：开关打开、模式条件满足且法力/尸体/目标可行时施放；都不满足则普攻。</div>
 ${L.length?L.map((id,i)=>acRow(id,i,L.length)).join(''):'<div class="dim">尚未学会主动技能</div>'}</div>`}
function acPop(id){const L=acLearned(),i=L.indexOf(id);if(i<0)return skPop(id);modal(`<div class="mtitle">自动施法 · ${SKM[id].n}</div><div class="gp acp">${acRow(id,i,L.length)}<div class="btns c"><button class="btn" onclick="closeM()">关闭</button><button class="btn" onclick="closeM();TAB='skill';SKT=4;render()">全部设置</button></div></div>`);ACX.acpop=id}
function acRefresh(){if(ACX.acpop&&!$('#modal').classList.contains('hide'))acPop(ACX.acpop);else if(TAB==='skill')render();ACX.skSig=''}
const _renderSkills=renderSkills;renderSkills=function(){if(SKT===4){const P=$('#panel');
  const tabs=TREES.map((t,i)=>`<button onclick="SKT=${i};render()">${t}</button>`).join('')+`<button onclick="SKT=3;render()">符文图鉴</button><button class="on">自动施法</button>`;
  P.innerHTML=`<div class="stabs">${tabs}</div>${acPanel()}`;return}
 _renderSkills();const st=$('#panel .stabs');if(st)st.insertAdjacentHTML('beforeend',`<button onclick="SKT=4;render()">自动施法</button>`);
 // 技能卡片上加“自动施法”按钮
 for(const e of document.querySelectorAll('#panel .skc')){const b=e.querySelector('.btn.up');const m=(b&&b.getAttribute('onclick')||'').match(/skPop\('(\w+)'\)/);if(m&&acActive(m[1])&&bl(m[1])){const bx=e.querySelector('.si .btns');bx&&bx.insertAdjacentHTML('beforeend',`<button class="btn xs ${acCfg(m[1]).on?'on':''}" onclick="acPop('${m[1]}')">自动施法·${AC_MODEN[acCfg(m[1]).mode]}</button>`)}}};
const _skPop=skPop;skPop=function(id){ACX.acpop=null;_skPop(id);if(acActive(id)&&bl(id)){const b=document.querySelector('#modal .btns.c');b&&b.insertAdjacentHTML('afterbegin',`<button class="btn" onclick="acPop('${id}')">自动施法设置</button>`)}};

// ---------- 战斗技能栏（点按打开该技能的自动施法设置） ----------
function skBar(){const fb=$('#fbattle');if(!fb)return;let e=$('#skbar');if(!e){e=document.createElement('div');e.id='skbar';fb.appendChild(e)}
 const L=acLearned();const sig=L.map(id=>id+acCfg(id).on+acCfg(id).mode+(castable(id)?1:0)).join();if(sig===ACX.skSig)return;ACX.skSig=sig;
 e.innerHTML=L.map(id=>{const c=acCfg(id);return`<button class="skb ${c.on?'':'off'} ${castable(id)?'':'nm'}" onclick="acPop('${id}')">${skIcon(SKM[id])}<small>${c.on?AC_MODEN[c.mode].slice(0,2):'关'}</small></button>`}).join('')}

// ---------- 技能特效（DOM 精灵 + CSS 动画；10 倍速时节流） ----------
const FXS={spear:'spear',spirit:'spirit',teeth:'teeth',boom:'boom',cloud:'poison',nova:'nova',summon:'summon'};
const FXL={n:0,last:{}};
function fxLayer(){let l=$('#fxl');if(!l){const fb=$('#fbattle');if(!fb)return null;l=document.createElement('div');l.id='fxl';fb.appendChild(l)}return l}
function fxOk(kind){const now=performance.now(),gap=80*Math.max(1,SPEED/2);if(now-(FXL.last[kind]||0)<gap||FXL.n>=14)return 0;FXL.last[kind]=now;return 1}
function sprite(cls,img,x,y,w,css,ms){const l=fxLayer();if(!l)return;const e=document.createElement('i');e.className='fxs '+cls;
 e.style.cssText=`left:${x}px;top:${y}px;width:${w}px;height:${w}px;background-image:url(${img});${css||''}`;l.appendChild(e);FXL.n++;setTimeout(()=>{e.remove();FXL.n--},ms)}
const _fx=fx;fx=function(kind,tg=[]){if(TAB!=='fight')return;const k=FXS[kind],img=k&&IMG['fx_'+k];
 if(!img||(kind==='nova'&&!tg.length))return _fx(kind,tg);// 无图/怪物新星：沿用画布特效
 if(!fxOk(kind))return;const h=heroPos(),pts=tg.map(m=>rectOf('c'+m.uid)).filter(Boolean),sp=Math.max(1,Math.min(SPEED,4));
 if(kind==='spear'||kind==='spirit'||kind==='teeth'){for(const p of pts.slice(0,3)){const dx=p.x-h.x,dy=p.y-h.y,a=Math.atan2(dy,dx)*180/Math.PI;
   const w=kind==='spear'?86:kind==='spirit'?64:48,dur=Math.round(380/sp);sprite('fly',img,h.x,h.y,w,`--dx:${dx}px;--dy:${dy}px;--a:${kind==='teeth'?0:a}deg;animation-duration:${dur}ms`,dur)}}
 else if(kind==='boom'||kind==='cloud'){for(const p of pts.slice(0,4)){const dur=Math.round(520/sp);sprite('pop',img,p.x,p.y,80,`animation-duration:${dur}ms`,dur)}}
 else if(kind==='nova'){const fb=$('#fbattle'),m=$('#mgrid');const r=m?rectOf('mgrid'):null;const dur=Math.round(700/sp);sprite('ring',img,r?r.x:fb.clientWidth/2,r?r.y:h.y-120,120,`animation-duration:${dur}ms`,dur)}
 else if(kind==='summon'){const dur=Math.round(650/sp);sprite('pillar',img,h.x,h.y-30,90,`animation-duration:${dur}ms`,dur)}};
// 持续特效：诅咒法阵（怪物脚下旋转，诅咒期间一直显示）、骨铠环绕（护盾 >0 时）；卡片重绘后按全局时间对齐动画相位
function persistFX(){const ph=`animation-delay:-${(performance.now()%6000)/1000}s`;
 if(IMG.fx_curse)for(const m of MON){if(m.hp<=0||!m.cur||m.cur.until<=GT)continue;const c=document.getElementById('c'+m.uid);if(c&&!c.querySelector('.fxcur'))c.insertAdjacentHTML('beforeend',`<i class="fxcur" style="background-image:url(${IMG.fx_curse});${ph}"></i>`)}
 const hc=$('#chero');if(hc&&IMG.fx_armor&&H.abs>0&&!hc.querySelector('.fxarm'))hc.insertAdjacentHTML('beforeend',`<i class="fxarm" style="background-image:url(${IMG.fx_armor});${ph}"></i>`)}
// 飘字：暴击（装备「致命一击」几率，伤害 ×2）放大黄色
let CRIT=0;
const _hitMon=hitMon;hitMon=function(m,d,src,fxc){if(src==='hero'&&ST.dsx&&rnd()*100<ST.dsx){const d2={};for(const k in d)d2[k]=d[k]*2;CRIT=1;try{return _hitMon(m,d2,src,'#ffd23a')}finally{CRIT=0}}return _hitMon(m,d,src,fxc)};
const _spawnFloat=spawnFloat;spawnFloat=function(x,y,t,c){if(FXL.fl>=18&&!CRIT)return;FXL.fl=(FXL.fl||0)+1;setTimeout(()=>FXL.fl--,900);
 if(CRIT){const e=document.createElement('div');e.className='fl crit';e.textContent=t+'!';e.style.cssText=`left:${x}px;top:${y-6}px`;$('#fbattle').appendChild(e);setTimeout(()=>e.remove(),1000);return}_spawnFloat(x,y,t,c)};
const _calc2=calc;calc=function(){const o=_calc2();let ds=0;for(const k in S.eq){const it=S.eq[k];if(it&&!it.k){ds+=allMods(it).ds||0}}o.dsx=Math.min(75,ds);ST=o;return o};
const _renderFight2=renderFight;renderFight=function(){_renderFight2();skBar();persistFX()};
