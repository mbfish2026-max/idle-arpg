'use strict';
// ===================================================================================
// nec_build.js — 亡灵术士 流派（软流派 + 流派套装/暗金）。设计稿：/workspace/design/necro_builds.md
// 1) 流派：无 / 白骨统帅(sum) / 骨矛术士(bone) / 瘟疫尸爆(plague)。选流派 = 推荐加点(CLS_SKPLAN.nec) + 自动施法顺序 + 属性比例(LATE_SHARE.nec) + 约 10% 小被动。
//    首次选择免费；之后切换消耗 1 瓶技能重置药水并自动重新加点。技能点仍可手动自由加。存档：S.build / S.buildN（已切换次数）。
// 2) 三套 6 件套装（2/4/6 件）+ 8 件流派暗金；只在地狱 / 秘境掉落（另有精英/首领额外掉率），秘境页可用秘晶兑换指定部位。
// 3) 6 件机制（骸爆 / 裂骨 / 疫爆）不触发技能次数(mcast)，也不连锁尸潮冥爆（结算时临时占满 XM_DEP）。
// 全部为运行时包装（calc / SV / hitMon / killMon / step / acCast / mainSkill / target / addAlly / genItem / renderSkills / EG 秘境页），不改其他文件函数体。
// 美术：图标暂复用底材图标（GenerateImage 产出未能落盘），见 TODO.md。
// ===================================================================================
const NB={
 builds:{
  sum:{n:'白骨统帅',ic:'💀',d:'骷髅大军和魔像推平地图，你在后面下诅咒',pas:'召唤物伤害 +10%，召唤物生命 +10%',set:'nb_sum',curse:'wk',
   order:['rs','rs','rs','sm','sm','rm','rs','sm','cg','rm','rs','sm','wk','rm','rs','sm'],
   fill:()=>bl('rs')<20?['rs','sm','rm']:['rm','sm','rv','sr','ig','wk','rs','cg'],
   ac:['ba','fg','ig','bg','cg','rs','rm','wk','rv','bs','bx','te'],share:[[1,0],[24,0],[30,0.25],[60,0.35],[85,0.4]]},
  bone:{n:'骨矛术士',ic:'➶',d:'贯穿全屏的骨矛，一分为三',pas:'骨矛、骨魂伤害 +10%',set:'nb_bone',curse:null,
   order:['te','te','te','ce','te','ba','te','bs','bs','bs','bs','bs'],
   fill:()=>bl('bs')<20?['bs','te']:[...['bw','bp'].filter(x=>!bl(x)),'bx','te','bw','bp','ba'],
   ac:['ba','bs','bx','lr','de','ad','te'],share:null},
  plague:{n:'瘟疫尸爆',ic:'☣',d:'毒云扩散，尸体连环爆炸',pas:'毒素技能伤害 +10%，敌人毒抗 -5%',set:'nb_plague',curse:'lr',
   order:['te','te','ce','pd','pd','pd','ce','pd','pd','pe','pe','pe','pe'],
   fill:()=>bl('pn')<20?['pn','pe','pd','ce']:['pe','pd','lr','ce','pn'],
   ac:['ba','lr','pe','ce','pn','bs','te'],share:null}},
 price:{belt:30,boots:30,gloves:40,helm:40,armor:50,weapon:60,shield:60,uj:50,uw:80},
 CAST:null,boomT:0,plT:0,plN:0,crT:0,cdrAdd:0,mjB:'sum'};
const NB_SLOTN={weapon:'武器',shield:'副手',helm:'头盔',armor:'铠甲',gloves:'手套',belt:'腰带',boots:'鞋子',amulet:'护符',ring:'戒指'};
// ---------- 数据：词缀文字 ----------
Object.assign(MODT,{skd_bs:'骨矛伤害 +{v}%',skd_bx:'骨魂伤害 +{v}%',skd_pn:'毒新星伤害 +{v}%',skd_pe:'毒爆 / 尸爆 伤害 +{v}%',nb_pois:'毒素技能伤害 +{v}%',
 nb_boss:'对首领伤害 +{v}%',nb_bsmana:'骨矛法力消耗 -{v}%',nb_skel:'唤起骨仆 召唤数量 +{v}',nb_skdr:'骷髅受到伤害 -{v}%',nb_cekeep:'尸爆/毒爆 {v}% 几率不消耗尸体',
 nb_boom:'【骸爆】骷髅/骨巫每 12 秒或死亡时爆炸：对 3 个敌人造成自身最大生命 25% 的魔法伤害（首领减半），随后免费重新召唤',
 nb_split:'【裂骨】骨矛命中后分裂，再打 2 个敌人，伤害 50%',
 nb_plague:'【疫爆】中毒的敌人死亡时，释放 50% 伤害的毒新星（每秒最多 3 次，首领不触发）',
 nb_u_throne:'骨巫攻击 20% 几率召出临时骷髅（10 秒，最多 3 只）',nb_u_ward:'每只存活召唤物，你受到伤害 -1%（上限 -12%）',
 nb_u_marrow:'骨矛每多命中一个敌人，伤害 +8%（上限 +40%）',nb_u_eye:'骨魂追踪生命最低的敌人',
 nb_u_rot:'毒伤结算时间缩短 30%',nb_u_src:'中毒的敌人受到你的伤害 +8%',nb_u_corpse:'附近没有尸体时，每 6 秒留下一具可引爆的骨骸'});
// ---------- 数据：套装 ----------
Object.assign(SETS,{
 nb_sum:{n:'万骨军团',nb:'sum',bonus:{2:{sumdmg:20,sumlife:20},4:{nb_skel:1,nb_skdr:15},6:{nb_boom:1,sumdmg:30}}},
 nb_bone:{n:'白骨棘冠',nb:'bone',bonus:{2:{skd_bs:40,nb_bsmana:30},4:{skd_bx:60,nb_boss:15},6:{nb_split:1,skd_bs:150}}},
 nb_plague:{n:'疫母之怀',nb:'plague',bonus:{2:{skd_pn:40},4:{skd_pe:60,nb_cekeep:30},6:{nb_plague:1,skd_pn:150}}}});
const NB_SETITEMS=[
 S_('万骨·统御颅','nb_sum','heade4',72,64,{t0sk:1,sk_rm:1,sumdmg:15,fcr:20}),
 S_('万骨·骸冠','nb_sum','hlme3',72,64,{allsk:1,life:60,sumlife:15,allres:20}),
 S_('万骨·墓甲','nb_sum','arme2',72,64,{edef:150,vit:20,sumlife:20,dr:5}),
 S_('万骨·驭尸手','nb_sum','glve2',70,62,{sk_rm:1,sumdmg:10,fcr:10,pres:30}),
 S_('万骨·亡索','nb_sum','blte2',70,62,{life:40,mregen:20,sumlife:15,fhr:20}),
 S_('万骨·冥途靴','nb_sum','bote3',70,62,{edef:80,ene:15,allres:15,mpk:3}),
 S_('棘冠·骨镞','nb_bone','wande3',75,66,{sk_bs:3,t1sk:2,fcr:25,ene:20}),
 S_('棘冠·骸面','nb_bone','hlme3',72,64,{allsk:1,fcr:10,mana:60,allres:20}),
 S_('棘冠·骨织袍','nb_bone','arme2',72,64,{edef:140,life:60,mdr:8,fhr:25}),
 S_('棘冠·穿骨手','nb_bone','glve2',70,62,{sk_bx:2,fcr:20,ene:15,mpk:4}),
 S_('棘冠·髓带','nb_bone','blte3',75,66,{manapct:15,mregen:30,life:40,allres:15}),
 S_('棘冠·疾骨靴','nb_bone','bote2',70,62,{edef:80,fhr:20,allres:20,mpk:3}),
 S_('疫母·腐颅','nb_plague','heade4',72,64,{t1sk:2,sk_pn:2,nb_pois:30,fcr:20}),
 S_('疫母·疫冠','nb_plague','hlme3',72,64,{allsk:1,life:60,pres:40,fcr:10}),
 S_('疫母·毒囊甲','nb_plague','arme3',75,66,{edef:160,life:80,dr:6,allres:15}),
 S_('疫母·腐指','nb_plague','glve3',70,62,{sk_pe:2,nb_pois:20,fcr:10,ll:4}),
 S_('疫母·瘟带','nb_plague','blte2',70,62,{sk_pd:2,life:40,mregen:20,pres:30}),
 S_('疫母·尸行靴','nb_plague','bote3',70,62,{edef:80,ene:15,allres:20,mpk:3})];
const NB_UNIQUES=[
 Object.assign(U('白骨王座','wande3',80,72,{allsk:1,t0sk:1,sumdmg:25,fcr:20,nb_u_throne:1}),{nb:'sum'}),
 Object.assign(U('亡契','amu',75,67,{sk_rs:1,sumlife:25,allres:20,life:40,nb_skel:1}),{nb:'sum'}),
 Object.assign(U('冥卫之戒','rin',70,62,{sumdmg:20,ll:5,fcr:10,mregen:15,nb_u_ward:1}),{nb:'sum'}),
 Object.assign(U('骨髓之环','rin',70,62,{sk_bs:2,t1sk:1,fcr:10,mana:40,nb_u_marrow:1}),{nb:'bone'}),
 Object.assign(U('骸语之眼','amu',75,67,{allsk:1,t1sk:2,ene:20,mregen:20,nb_u_eye:1}),{nb:'bone'}),
 Object.assign(U('腐心','dage2',75,67,{sk_pn:3,sk_pe:2,nb_pois:40,fcr:20,nb_u_rot:1}),{nb:'plague'}),
 Object.assign(U('疫源护符','amu',70,62,{t1sk:2,pres:30,life:40,mregen:15,nb_u_src:1}),{nb:'plague'}),
 Object.assign(U('尸王之戒','rin',65,57,{sk_ce:2,mpk:5,ll:4,fcr:10,nb_u_corpse:1}),{nb:'plague'})];
for(const x of NB_SETITEMS)x.nb=SETS[x.set].nb;
SETITEMS.push(...NB_SETITEMS);UNIQUES.push(...NB_UNIQUES);
const NB_NAMES=new Set([...NB_SETITEMS,...NB_UNIQUES].map(x=>x.n));
// 无数值的机制词缀：显示时不带数字
{const f=modsTxt;modsTxt=function(m){const o={},fl=[];for(const k in m){if(/^nb_(boom|split|plague|u_)/.test(k)){fl.push(MODT[k].replace('{v}',''));continue}o[k]=m[k]}const t=f(o);return fl.length?(t?t+'，':'')+fl.join('，'):t}}
// ---------- 汇总：流派 + 装备 → ST.nb ----------
function nbCls(){return typeof curCls==='function'?curCls():'nec'}
function nbBc(B){return(B&&B.cls)||'nec'}
function nbOn(){const B=NB.builds[S.build];return B&&nbBc(B)===nbCls()?S.build:null}
function nbClsBuilds(c){c=c||nbCls();return Object.entries(NB.builds).filter(([k,B])=>nbBc(B)===c)}
function nbM(k){return(ST&&ST.M&&ST.M[k])||0}
function nbSetN(set){const c=typeof setCount==='function'?setCount():{};return c[set]||0}
{const f=calc;calc=function(...a){const r=f.apply(this,a);try{if(!ST)return r;const b=nbOn(),M=ST.M||{},nec=true;
  const N={skd:{bs:M.skd_bs||0,bx:M.skd_bx||0,pn:M.skd_pn||0,pe:M.skd_pe||0,ce:M.skd_pe||0},pois:M.nb_pois||0,boss:M.nb_boss||0,bsmana:M.nb_bsmana||0,skel:M.nb_skel||0,skdr:M.nb_skdr||0,
   cekeep:M.nb_cekeep||0,boom:!!M.nb_boom,split:!!M.nb_split,plague:!!M.nb_plague,u:{},pres:0};
  for(const k in M)if(/^nb_u_/.test(k)&&M[k])N.u[k.slice(5)]=1;
  N.mech=[];N.e={};for(const k in M){if(!M[k])continue;let x;if((x=/^skd_(\w+)$/.exec(k))&&!['bs','bx','pn','pe'].includes(x[1]))N.skd[x[1]]=(N.skd[x[1]]||0)+M[k];else if((x=/^nb_m_(split|echo|burst)_(\w+)$/.exec(k)))N.mech.push({t:x[1],id:x[2]});else if((x=/^nb_e_(\w+)$/.exec(k)))N.e[x[1]]=(N.e[x[1]]||0)+M[k]}
  const PB=b&&NB.builds[b].pm;if(PB)for(const k in PB){let x;if((x=/^skd_(\w+)$/.exec(k)))N.skd[x[1]]=(N.skd[x[1]]||0)+PB[k];else if(k==='sumdmg'||k==='sumlife')ST[k]+=PB[k];else if(k==='nb_boss')N.boss+=PB[k];else if(k==='nb_pois')N.pois+=PB[k];else if(k==='cdr')ST.cdr=Math.min(75,(ST.cdr||0)+PB[k]);else if(k==='res'){for(const r in ST.res)ST.res[r]=Math.min(75,ST.res[r]+PB[k])}else if(k==='ll')ST.ll+=PB[k];else if(/^nb_e_/.test(k))N.e[k.slice(5)]=(N.e[k.slice(5)]||0)+PB[k]}
  if(N.e.dr)ST.cdr=Math.min(75,(ST.cdr||0)+N.e.dr);
  if(b==='sum'){ST.sumdmg+=10;ST.sumlife+=10}else if(b==='bone'){N.skd.bs+=10;N.skd.bx+=10}else if(b==='plague'){N.pois+=10;N.pres=5}
  ST.nb=nec?N:{skd:{},u:{}};
  if(typeof LATE_SHARE!=='undefined'){const c=nbCls();NB.defShare=NB.defShare||{};if(!(c in NB.defShare))NB.defShare[c]=LATE_SHARE[c];LATE_SHARE[c]=(b&&NB.builds[b].share)||NB.defShare[c]}}catch(e){console.warn('nb calc',e)}return r}}
// ---------- 技能数值：骨仆数量 / 骨矛法力 ----------
{const f=SV;SV=function(id,L){const v=f(id,L);try{const N=ST&&ST.nb;if(!N||!v)return v;
  if(id==='rs'&&N.skel&&typeof v.n==='number'){v.n+=N.skel;if(v.txt)v.txt+=`（流派装备 +${N.skel}）`}
  if(id==='bs'&&N.bsmana&&v.mana)v.mana=Math.round(v.mana*(1-N.bsmana/100)*10)/10}catch(e){}return v}}
// ---------- 伤害倍率（技能伤害 / 毒素 / 首领 / 暗金特效） ----------
function nbHeroK(m,d){const N=ST&&ST.nb;if(!N)return 1;let k=1;const c=NB.CAST;
 if(c&&N.skd[c])k*=1+N.skd[c]/100;
 if(d.pois&&N.pois)k*=1+N.pois/100;
 if(d.pois&&N.pres){const r=resOf(m,'pois');if(r<100)k*=Math.max(0,1-(r-N.pres)/100)/Math.max(0.01,1-r/100)}
 if(m.boss&&N.boss)k*=1+N.boss/100;
 if(c==='bs'&&N.u.marrow){const n=Math.min(5,Math.max(0,liveMon().length-1));k*=1+0.08*n}
 if(N.u.src&&m.pois&&m.pois.left>0)k*=1.08;return k}
{const f=hitMon;hitMon=function(m,d,src,fxc){if(!d||!m||m.hp<=0)return f(m,d,src,fxc);const N=ST&&ST.nb;
 if(src==='hero'&&N){const k=nbHeroK(m,d);if(k!==1){const o={};for(const e in d)o[e]=d[e]*k;d=o}}
 const p0=m.pois;const t=f(m,d,src,fxc);
 try{if(N&&src==='hero'&&d.pois&&N.u.rot&&m.pois&&m.pois!==p0&&m.pois.left===2){const tot=m.pois.dps*2;m.pois.left=1.4;m.pois.dps=tot/1.4}
  if(N&&N.u.throne&&src&&src.kind==='mage'&&rnd()<0.2&&ALLY.filter(a=>a.kind==='tskel'&&a.hp>0).length<3&&bl('rs')){const v=SV('rs',Math.max(1,slvl('rs')));addAlly('tskel',{n:'骨仆·临',hp:v.life,dmg:v.dmg,until:GT+10})}}catch(e){}
 return t}}
// 机制伤害：不连锁尸潮冥爆（临时占满 late_mods 的 XM_DEP）、不触发技能次数
function nbNoChain(fn){let d0=null;try{if(typeof XM_DEP!=='undefined'){d0=XM_DEP;XM_DEP=2}return fn()}finally{if(d0!==null)XM_DEP=d0}}
// ---------- 施法包装：记录当前技能 / 裂骨 / 尸体保留 ----------
{const f=acCast;acCast=function(id,ms){const N=ST&&ST.nb;const p=NB.CAST;NB.CAST=id;const c0=CORPSE.length,top=CORPSE[c0-1];let r;
 try{r=f(id,ms)}finally{NB.CAST=p}
 try{if(!N)return r;
  if(id==='bs'&&N.split&&!(typeof MC_K!=='undefined'&&MC_K)){const l=liveMon();if(l.length>1){const v=SV('bs',slvl('bs'));const tg=l.slice().sort(()=>rnd()-.5).slice(0,2);
    NB.CAST='bs';try{nbNoChain(()=>{for(const m of tg)hitMon(m,{magic:R(v.dmg[0],v.dmg[1])*0.5},'hero','#bfe4ff')})}finally{NB.CAST=p}
    if(typeof fx==='function')fx('spear',tg)}}
  if((id==='ce'||id==='pe')&&N.cekeep&&top&&CORPSE.length<c0&&rnd()*100<N.cekeep)CORPSE.push(top)}catch(e){console.warn('nb cast',e)}
 return r}}
// ---------- 自动施法估值：裂骨让骨矛群体价值上升；疫爆让毒新星群体价值打 8 折 ----------
{const f=mainSkill;mainSkill=function(){const b=nbOn(),N=ST&&ST.nb;if(!b||S.main||!N)return f();const ms=liveMon(),n=ms.length;
 const val=id=>{if(!castable(id))return -1;const v=SV(id,slvl(id));let d=(v.dmg[0]+v.dmg[1])/2*(1+(N.skd[id]||0)/100);
  if(id==='bs')d*=Math.min(3,Math.max(1,n))+(N.split&&n>1?Math.min(2,n-1)*0.5:0);else if(id==='te')d*=Math.min(v.n,6)*0.5;else if(id==='pn')d*=Math.max(1,n)*(1+N.pois/100)*(N.plague?0.8:1);
  else if(id==='pd')d=ST.dagger?d:-1;return d};
 let best=null,bv=0;for(const id of['bx','bs','pn','te','pd']){const v=val(id);if(v>bv){bv=v;best=id}}return best||f()}}
// 骸语之眼：骨魂追踪生命最低的敌人
{const f=target;target=function(ms){if(NB.CAST==='bx'&&ST&&ST.nb&&ST.nb.u.eye&&ms&&ms.length){return ms.reduce((a,m)=>m.hp<a.hp?m:a,ms[0])}return f(ms)}}
// ---------- 召唤：骷髅减伤 / 临时骷髅显示 ----------
{const f=addAlly;addAlly=function(kind,o){const a=f(kind,o);try{const N=ST&&ST.nb;if(a&&N&&N.skdr&&(kind==='skel'||kind==='tskel'))a.sdr=Math.min(80,(a.sdr||0)+N.skdr)}catch(e){}return a}}
{const f=allyCard;allyCard=function(a){return a&&a.kind==='tskel'?f(Object.assign({},a,{kind:'skel'})):f(a)}}
// 骸爆：对 3 个敌人造成自身最大生命 50% 魔法伤害（首领减半）
function nbBoom(a){const l=liveMon();if(!l.length)return;const tg=l.slice().sort(()=>rnd()-.5).slice(0,3);
 nbNoChain(()=>{for(const m of tg)hitMon(m,{magic:a.max*0.25*(m.boss?0.5:1)},'nbboom','#d8ffb0')});if(typeof fx==='function')fx('boom',tg)}
{const f=step;step=function(dt){const N=ST&&ST.nb;const pre=N&&N.boom?ALLY.filter(a=>(a.kind==='skel'||a.kind==='mage')&&a.hp>0):null;const r=f(dt);
 try{if(!N)return r;
  if(pre){const dead=pre.filter(a=>a.hp<=0);for(const a of dead){nbBoom(a);const b=Object.assign({},a,{uid:mUid++,hp:a.max,hitT:0});ALLY.push(b)}
   NB.boomT+=dt;if(NB.boomT>=12){NB.boomT=0;for(const a of ALLY)if((a.kind==='skel'||a.kind==='mage')&&a.hp>0){nbBoom(a);a.hp=a.max}}}
  if(N.u.corpse){NB.crT+=dt;if(NB.crT>=6){NB.crT=0;const l=liveMon();if(!CORPSE.length&&l.length){const nb=l.filter(m=>!m.boss);const mx=nb.length?nb.reduce((s,m)=>s+m.max,0)/nb.length:l[0].max*0.05;CORPSE.push({max:mx,key:null,lv:l[0].lv,nb:1})}}}
  if(N.u.ward){const n=Math.min(12,ALLY.filter(a=>a.hp>0&&a.kind!=='merc'&&a.kind!=='wall').length);if(n!==NB.cdrAdd){ST.cdr=Math.max(0,(ST.cdr||0)-NB.cdrAdd+n);NB.cdrAdd=n}}
  else if(NB.cdrAdd){ST.cdr=Math.max(0,(ST.cdr||0)-NB.cdrAdd);NB.cdrAdd=0}
  NB.plT+=dt;if(NB.plT>=1){NB.plT=0;NB.plN=0}}catch(e){console.warn('nb step',e)}return r}}
{const f=calc;calc=function(...a){NB.cdrAdd=0;return f.apply(this,a)}}// calc 会重建 ST.cdr
// 疫爆：中毒敌人死亡 → 40% 毒新星（叠加到现有毒伤上；不连锁、每秒最多 3 次、首领不触发）
{const f=killMon;killMon=function(m){const N=ST&&ST.nb;const pz=N&&N.plague&&!m.boss&&m.pois&&m.pois.left>0&&NB.plN<3&&bl('pn');const r=f(m);
 try{if(pz){NB.plN++;const v=SV('pn',slvl('pn'));const base=(v.dmg[0]+v.dmg[1])/2*0.5*(typeof lateMul==='function'?lateMul():1);const l=liveMon();
   for(const t of l){const k=nbHeroK(t,{pois:1})*(1+(N.skd.pn||0)/100)/(NB.CAST==='pn'?1+(N.skd.pn||0)/100:1);const dmg=base*k*(1-resOf(t,'pois')/100);if(dmg<=0)continue;
    if(t.pois&&t.pois.left>0)t.pois.dps+=dmg/t.pois.left;else t.pois={dps:dmg/2,left:2,src:'hero'}}
   if(l.length&&typeof fx==='function')fx('nova',l)}}catch(e){console.warn('nb plague',e)}return r}}
// ---------- 掉落：只在地狱 / 秘境；精英首领额外掉率 ----------
function nbInMj(){return typeof EGM!=='undefined'&&EGM&&EGM.k==='mj'}
{const f=genItem;genItem=function(ilvl,opt){const it=f(ilvl,opt);try{if(it&&NB_NAMES.has(it.name)&&!(opt&&opt.nb)&&!(S.diff===2||nbInMj()))return f(ilvl,Object.assign({},opt||{},{q:4}))}catch(e){}return it}}
function nbMake(def,ilvl){const b=BASEM[def.b];const it=makeBase(b,Math.max(ilvl||0,def.lv));it.name=def.n;it.req=def.rq;it.m=rollMods(def.m);if(def.set){it.q=6;it.set=def.set}else it.q=5;
 if(typeof finishDefense==='function')finishDefense(it,b);return it}
function nbDropPool(){const b=nbOn(),c=nbCls();return[...NB_SETITEMS,...NB_UNIQUES].filter(x=>nbBc(NB.builds[x.nb])===c&&(!b||x.nb===b||rnd()<0.5))}
{const f=killMon;killMon=function(m){const r=f(m);try{if(!nbClsBuilds().length)return r;let p=0;
  if(nbInMj()&&m.boss){const L=(EGM&&EGM.L)||1;p=1/60*(1+0.1*Math.floor(L/10))}
  else if(S.diff===2&&S.act>=3&&(m.boss||m.fl==='champ'||m.fl==='uniq'))p=1/400;
  if(p&&rnd()<p){const pool=nbDropPool();const def=pool[Math.floor(rnd()*pool.length)];if(def){const it=nbMake(def,m.lv);if(typeof groundLoot==='function')groundLoot(it);addBag(it);
   log(`<b style="color:${itemColor(it)}">流派装备掉落：${itemName(it)}</b>`)}}}catch(e){console.warn('nb drop',e)}return r}}
// ---------- 选流派 ----------
function nbPlan(){const b=nbOn();if(!b)return undefined;const B=NB.builds[b];return{order:B.order,fill:B.fill}}
NB.origPlan={};
function nbHookPlans(){if(typeof CLS_SKPLAN==='undefined'||typeof CLS_DEF==='undefined')return;for(const c in CLS_DEF){if(NB.origPlan.hasOwnProperty(c))continue;const d=Object.getOwnPropertyDescriptor(CLS_SKPLAN,c);NB.origPlan[c]=d&&!d.get?d.value:undefined;Object.defineProperty(CLS_SKPLAN,c,{get:()=>(nbCls()===c&&nbPlan())||NB.origPlan[c],set:v=>{NB.origPlan[c]=v},configurable:true,enumerable:true})}}
nbHookPlans();
function nbApplyAc(b){const a=acState();const pri=NB.builds[b].ac;a.order=[...pri.filter(id=>a.order.includes(id)),...a.order.filter(id=>!pri.includes(id))];S.main=null;S.curse=nbCls()==='nec'?(NB.builds[b].curse||null):S.curse}
function nbCost(b){return !S.build?0:S.build===b?-1:1}
function nbPick(b){if(b&&(!NB.builds[b]||nbBc(NB.builds[b])!==nbCls()))return;if((S.build||null)===(b||null))return;
 const free=!S.build&&!S.buildN,R=respN();
 if(!free&&R.sk<=0)return toast('切换流派需要 1 瓶技能重置药水（商人处购买）');
 const nm=b?NB.builds[b].n:'无流派';
 if(!window.__NOUI&&typeof confirm==='function'&&!confirm(free?`选择流派「${nm}」（首次免费）：技能点全部返还并按流派计划自动重新加点。确定？`:`切换为「${nm}」：消耗 1 瓶技能重置药水，技能点全部返还并按新计划自动重新加点。确定？`))return;
 if(!free)R.sk--;S.buildN=(S.buildN||0)+1;
 const base=respBaseSk(),back=respSum(S.sk)-respSum(base);if(back>0){S.sk=base;S.kp+=back}
 S.build=b||null;S.autoSk=1;H.cbs={};H.tur={};ALLY=ALLY.filter(a=>a.kind==='merc');if(typeof CLS_PLANC!=='undefined')CLS_PLANC.sig='';
 if(b)nbApplyAc(b);else{S.main=null;S.curse=null}
 calc();autoTick();calc();H.life=Math.min(H.life,ST.life);H.mana=Math.min(H.mana,ST.mana);
 log(`<b style="color:#ffd76a">流派：${nm}${free?'（首次免费）':'（消耗技能重置药水）'}，已自动重新加点</b>`);save();if(!window.__NOUI){toast('流派：'+nm);render()}}
function nbPanel(){const b=nbOn(),R=respN();const free=!S.build&&!S.buildN;
 const btn=(k,n)=>`<button class="btn xs ${(S.build||'')===k?'on':''}" onclick="nbPick(${k?`'${k}'`:'null'})">${n}</button>`;
 let info;if(b){const B=NB.builds[b],sn=SETS[B.set];info=`<div class="dim">${B.d}</div><div>流派被动：<b class="g">${B.pas}</b></div><div class="dim">${sn.n} ${nbSetN(B.set)}/6 · 推荐加点与自动施法已按流派设置</div>`;NB.panelB=b}
 else info=`<div class="dim">未选流派：沿用默认计划。选流派会设置推荐加点、自动施法顺序与属性比例，并获得约 10% 小被动；技能点仍可自由加。</div>`;
 return`<div class="gp nbgp"><h3>流派 <span class="r dim">${free?'首次免费':'切换需技能重置药水 ×1（持有 '+R.sk+'）'}</span></h3><div class="btns nbb">${btn('','无')}${nbClsBuilds().map(([k,B])=>btn(k,B.ic+' '+B.n)).join('')}</div>${info}</div>`}
{const f=renderSkills;renderSkills=function(...a){const r=f.apply(this,a);try{if(window.__NOUI||SKT>2||!nbClsBuilds().length)return r;const P=document.getElementById('panel');const t=P&&P.querySelector('.stabs');
  if(t&&!P.querySelector('.nbgp'))t.insertAdjacentHTML('afterend',nbPanel())}catch(e){console.warn('nb ui',e)}return r}}
// ---------- 秘晶兑换（秘境页） ----------
function nbExList(b){return[...NB_SETITEMS.filter(x=>x.nb===b),...NB_UNIQUES.filter(x=>x.nb===b)]}
function nbExPrice(d){const s=BASEM[d.b].s,c=BASEM[d.b].cat;if(!d.set)return BASEM[d.b].s==='weapon'?NB.price.uw:NB.price.uj;return NB.price[s]||NB.price[c]||60}
function nbExBuy(n){const d=[...NB_SETITEMS,...NB_UNIQUES].find(x=>x.n===n);if(!d)return;const M=egMj(),p=nbExPrice(d);
 if(M.cr<p)return toast(`需要 ${p} 秘晶`);if(S.bag.length>=40)return toast('背包已满');
 if(!window.__NOUI&&typeof confirm==='function'&&!confirm(`花费 ${p} 秘晶兑换「${d.n}」（属性随机）？`))return;
 M.cr-=p;const it=nbMake(d,EG_MJ.ml(M.cur||1));S.bag.push(it);log(`秘晶兑换：<span style="color:${itemColor(it)}">${itemName(it)}</span>`);toast('兑换成功：'+d.n);save();egRefresh()}
function nbExHtml(){const M=egMj(),L=nbClsBuilds();if(!L.length)return'';if(!L.some(x=>x[0]===NB.mjB))NB.mjB=nbOn()||L[0][0];const b=NB.mjB;const tabs=L.map(([k,B])=>`<button class="btn xs ${k===b?'on':''}" onclick="NB.mjB='${k}';egRefresh()">${B.n}</button>`).join('');
 const rows=nbExList(b).map(d=>{const p=nbExPrice(d),sl=NB_SLOTN[BASEM[d.b].s]||BASEM[d.b].s;return`<div class="row"><span>${d.set?'<b class="nbs">套</b>':'<b class="nbu">金</b>'} ${d.n} <span class="dim">${sl}</span></span><button class="btn xs ${M.cr>=p?'gold':''}" onclick="nbExBuy('${d.n}')">◆${p}</button></div>`}).join('');
 return`<div class="gp nbex"><h3>流派装备兑换 <span class="r">◆秘晶 ×${M.cr}</span></h3><div class="btns">${tabs}</div>${rows}<div class="dim">兑换指定部位，属性在范围内随机。本职业专属。</div></div>`}
{const p=typeof EG_PAGES!=='undefined'&&EG_PAGES.find(x=>x.k==='mj');if(p){const f=p.render;p.render=function(...a){const h=f.apply(this,a);try{if(!nbClsBuilds().length)return h;const x=nbExHtml();return h+x}catch(e){return h}}}}
document.head.insertAdjacentHTML('beforeend',`<style>.nbgp .nbb{flex-wrap:wrap;gap:4px}.nbgp .g{color:#8f8}.nbex .nbs{color:#3c3}.nbex .nbu{color:#c8963c}.nbex .row{align-items:center}</style>`);
