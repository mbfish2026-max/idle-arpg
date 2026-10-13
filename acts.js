'use strict';
// ===== 第二阶段逻辑：章节/难度切换、怪物难度与免疫、精英词缀、怪物技能、多首领/波次首领、任务奖励、随从 =====
// 通过包装 game.js 中的函数实现，尽量不改动 game.js 本体。
const ACX={};const HSOFT=0.008,DSOFT=0.012;// 高等级怪物生命/伤害成长软化(近似调校)
const GATE=4;let MAPD=null;
const MSLOT=['weapon','helm','armor'];
const ELK=['fire','cold','light','pois'],ELN={phys:'物',fire:'火',cold:'冰',light:'电',pois:'毒',magic:'魔'};
function curPen(){return DIFFS[S.diff].pen}
// ---------- 存档 / 进度 ----------
function pkey(a=S.act,d=S.diff){return d+'_'+a}
function syncProg(){if(!S.Q)return;S.Q[S.diff]=S.q;const k=pkey();S.CL[k]=S.cleared;S.UN[k]=S.unl;S.ZN[k]=S.zone}
function migrate(){
 if(!S.Q){S.Q={0:S.q||{}};S.CL={'0_0':S.cleared||{}};S.UN={'0_0':S.unl||0};S.ZN={'0_0':S.zone||0};S.diff=0;S.act=0}
 S.ZN=S.ZN||{};S.actU=S.actU||{0:0};S.diffU=S.diffU||0;S.bon=S.bon||{life:0,res:0};S.sockq=S.sockq||0;S.pers=S.pers||0;
 if(S.act1done)S.actU[0]=Math.max(S.actU[0]||0,1);
 if(S.autoMerc==null)S.autoMerc=1;
 S.q=S.Q[S.diff]||(S.Q[S.diff]={});const k=pkey();S.cleared=S.CL[k]||(S.CL[k]={});S.unl=S.UN[k]||0;
 if(S.merc===undefined)S.merc=null;
 if(!S.merc&&S.Q[0]&&S.Q[0].q2)hireMerc('archer',null,1);
 applyDiff();MAPA=S.act;MAPD=S.diff}
function applyDiff(){for(const A of ACTS)for(const z of A.zones){if(z.ml0==null)z.ml0=z.ml;z.ml=mlD(z.ml0,S.diff)}}
const _load=load;load=function(){_load();migrate()};
const _save=save;save=function(){syncProg();_save()};
function actOpen(a,d){return d<=S.diffU&&a<=(S.actU[d]||0)}
function goAct(a,d,quiet){if(!actOpen(a,d))return toast('尚未解锁');syncProg();const dc=d!==S.diff;S.diff=d;S.act=a;
 S.q=S.Q[d]||(S.Q[d]={});const k=pkey();S.cleared=S.CL[k]||(S.CL[k]={});S.unl=S.UN[k]||0;S.zone=Math.min(S.ZN[k]||0,S.unl);S.wave=0;
 applyDiff();MON=[];CORPSE=[];if(dc)ALLY=ALLY.filter(x=>x.kind==='merc');spawnT=2;calc();H.life=ST.life;H.mana=ST.mana;
 log(`<b class="quest">前往 ${DIFFS[d].n} · ${ACTS[a].n}（营地：${ACTS[a].camp}）</b>`);if(!quiet)render()}
function unlockAfter(a){const d=S.diff;
 if(a<ACTS.length-1){S.actU[d]=Math.max(S.actU[d]||0,a+1);log(`<b class="quest">${DIFFS[d].n}难度 ${ACTS[a+1].n} 已解锁</b>`)}
 else if(d<DIFFS.length-1){S.diffU=Math.max(S.diffU,d+1);S.actU[d+1]=Math.max(S.actU[d+1]||0,0);log(`<b class="quest">${DIFFS[d+1].n}难度已解锁！（抗性 ${DIFFS[d+1].pen}）</b>`);toast(DIFFS[d+1].n+'难度已解锁')}
 else log('<b class="quest">恭喜！地狱难度全部章节已完成</b>')}
function nextStage(){const a=S.act,d=S.diff;if(a<ACTS.length-1&&actOpen(a+1,d))return[a+1,d];if(a===ACTS.length-1&&d<DIFFS.length-1&&actOpen(0,d+1))return[0,d+1];return null}

// ---------- 怪物：难度、抗性/免疫、精英词缀、技能 ----------
function resFor(T,d,isBoss){const b=Object.assign({},T.res||{});if(!d)return b;const o=d===1?T.resN:T.resH;const r={};
 for(const k in b)r[k]=b[k]>0?Math.min(isBoss?90:95,b[k]+(d===1?15:30)):b[k];
 if(o&&!isBoss)Object.assign(r,o);else if(o)for(const k in o)r[k]=Math.min(90,o[k]);return r}
const _mkMon=mkMon;mkMon=function(key,lv,flag){const m=_mkMon(key,lv,flag),T=MONS[key]||BOSSES[key],D=DIFFS[S.diff]||DIFFS[0];
 Object.assign(m.res,resFor(T,S.diff,!!BOSSES[key]));
 const hg=lv>25?1/(1+HSOFT*(lv-25)):1,dg=lv>25?1/(1+DSOFT*(lv-25)):1;m.max=m.hp=Math.round(m.max*D.hp*hg);m.dmg=m.dmg.map(x=>x*D.dmg*dg);m.exp=m.exp*expCurve(lv)*D.exp;m.sk=(T.sk||[]).slice();m.skT=2.5+rnd()*3;m.demon=T.demon;
 if(flag==='uniq'){const ks=Object.keys(ELITE_AFF).filter(k=>!(k==='mb'&&false));const n=Math.min(3,D.naff||1);const aff=[];
  while(aff.length<n){const k=pick(ks);if(!aff.includes(k))aff.push(k)}for(const k of aff)ELITE_AFF[k].f(m);m.aff=aff.map(k=>ELITE_AFF[k].n);m.n=pick(UNIQ_T)+'·'+T.n}
 if(flag==='champ'){const v=pick(CHAMP_V);v.f(m);m.n=v.n+'·'+T.n}
 m.imm=Object.keys(m.res).filter(k=>m.res[k]>=100);return m};
// 免疫：抗性≥100。诅咒对免疫怪物只有 1/5 效果（同原版机制），未打破则伤害为 0
resOf=function(m,k){let r=m.res[k]||0;const c=m.cur&&m.cur.until>GT?m.cur:null;let red=0;
 if(c){if(c.id==='ad'&&k==='phys')red=100;if(c.id==='de'&&k==='phys')red=50;if(c.id==='lr'&&k!=='phys'&&k!=='magic')red=c.x||0}
 if(r>=100){r-=red/5;return r>=100?100:clamp(r,-100,95)}return clamp(r-red,-100,95)};
function zoneMons(z){return z.mons&&z.mons.length?z.mons:['imp']}
spawnWave=function(){const z=zoneData(),wi=S.wave,last=wi>=z.w-1;const mons=zoneMons(z);
 const bw=z.bw&&z.bw[wi];
 if(bw){for(const k of bw.b){const m=mkMon(k,z.ml+2);MON.push(m);log(`<b class="bossn">${m.n}</b> 现身！`)}for(let i=0;i<(bw.n||3);i++)MON.push(mkMon(pick(bw.m||mons),z.ml+1,i===0?'champ':''));MON=MON.slice(0,8);return}
 if(last&&(z.boss||z.bosses)){const list=z.bosses||[z.boss];for(const k of list){const lv=z.ml+(BOSSES[k].actboss?(z.bl||0):2);const m=mkMon(k,lv);m.qb=1;MON.push(m);log(`<b class="bossn">${m.n}</b> 出现了！`)}
  if(!z.solo)for(let i=0;i<R(2,4);i++)MON.push(mkMon(pick(mons),z.ml));MON=MON.slice(0,8);return}
 const r=rnd();
 if(r<0.1){const k=pick(mons);for(let i=0;i<R(2,3);i++)MON.push(mkMon(k,z.ml+2,'champ'))}
 else if(r<0.15){const k=pick(mons);const L=mkMon(k,z.ml+3,'uniq');MON.push(L);log(`<span class="uniq">${L.n}</span> [${L.aff.join('/')}]${L.imm.length?' <b style="color:#f66">免疫'+L.imm.map(x=>ELN[x]).join('')+'</b>':''}`);
  for(let i=0;i<R(2,3);i++){const mm=mkMon(k,z.ml+3);if(L.fan)mm.spd*=1.25;MON.push(mm)}}
 else for(let i=0;i<R(2,5);i++)MON.push(mkMon(pick(mons),z.ml));
 MON=MON.slice(0,8)};
// TC 升级：噩梦/地狱中精英与首领按更高一档(每难度 +3 级)的宝藏级别抽取
const _rollTC=rollTC;rollTC=function(m){const lv=m.lv;const up=(m.boss||m.fl==='uniq'||m.fl==='champ')?3*S.diff:0;m.lv=lv+up;try{return _rollTC(m)}finally{m.lv=lv}};
// 多首领：最后一个任务首领倒下时才完成任务
bossKilled=function(m){if(!m.qb)return;if(MON.some(x=>x!==m&&x.hp>0&&x.qb))return;const z=zoneData();if(z.quest&&!S.q[z.quest]&&!QUESTS[z.quest].clear)questDone(z.quest)};
// ---------- 怪物技能 ----------
const SKCD={charge:5,frost:9,nova:9,spark:4,randel:4,poisbreath:8,inferno:8,leech:5,manaburn:5,curse:9,stun:6,web:7,revive:6,heal:6,corpsefire:6};
function hurtHero(v,el,m,dodge){if(dodge&&!hitChance(m.ar,ST.def,m.lv,S.lvl)){floatHero('闪避','#aaa');return 0}
 if(el==='phys'){v=Math.max(1,v-ST.dr);const ab=Math.min(H.abs,v);H.abs-=ab;v-=ab}else v=v*(1-ST.res[el]/100);v=Math.round(v);if(v>0){H.life-=v;floatHero('-'+v,{fire:'#f84',cold:'#8cf',light:'#ff6',pois:'#6f6'}[el]||'#f44')}return v}
function hurtAlly(a,v,el){if(el!=='phys')v*=1-(a.res||0)/100;v=Math.round(v);a.hp-=v;a.hitT=0.25;floatNum('a'+a.uid,v,'#f66');return v}
function aoe(m,v,el){hurtHero(v,el,m,0);for(const a of ALLY)if(a.hp>0)hurtAlly(a,v*0.8,el)}
function single(m,v,el,dodge){const al=ALLY.filter(a=>a.hp>0);const w=al.find(a=>a.kind==='wall');const tg=w||(al.length&&rnd()<0.6?pick(al):'hero');if(tg==='hero')return hurtHero(v,el,m,dodge);return hurtAlly(tg,v,el)}
function monSkill(m,s){let avg=(m.dmg[0]+m.dmg[1])/2;if(curseOf(m,'wk'))avg*=0.67;if(curseOf(m,'de'))avg*=0.5;const el=m.el&&m.el!=='phys'?m.el:null;
 switch(s){
 case'charge':single(m,avg*1.8,'phys',1);break;
 case'frost':aoe(m,avg*0.8,'cold');fx('nova',[]);break;
 case'nova':aoe(m,avg*0.8,el||'light');fx('nova',[]);break;
 case'spark':single(m,avg*1.2,'light',0);break;
 case'randel':single(m,avg*1.2,pick(ELK),0);break;
 case'poisbreath':aoe(m,avg*0.9,'pois');break;
 case'inferno':aoe(m,avg*0.9,'fire');break;
 case'leech':{const v=single(m,avg,'phys',1);m.hp=Math.min(m.max,m.hp+v);break}
 case'manaburn':{const v=Math.round(avg*1.5);H.mana=Math.max(0,H.mana-v);floatHero('噬法-'+v,'#58f');break}
 case'curse':H.curse=GT+6;calc();floatHero('受咒：抗性-25','#c3f');break;
 case'stun':if(single(m,avg*1.2,'phys',1)>0&&!ST.cbr){H.castT+=0.8;floatHero('眩晕','#fc6')}break;
 case'web':H.castT+=0.5;floatHero('缠网','#ccc');break;
 case'revive':{const i=CORPSE.findIndex(c=>MONS[c.key]);if(i<0||liveMon().length>=8)return 0;const c=CORPSE.splice(i,1)[0];const n=mkMon(c.key,c.lv);n.exp*=0.5;n.n='复苏·'+n.n;MON.push(n);log(`${m.n} 复活了 ${n.n}`);break}
 case'heal':{const t=liveMon().filter(x=>x.hp<x.max).sort((a,b)=>a.hp/a.max-b.hp/b.max)[0];if(!t)return 0;t.hp=Math.min(t.max,t.hp+t.max*0.2);break}
 case'corpsefire':{if(!CORPSE.length)return 0;const c=CORPSE.pop();aoe(m,Math.min(c.max*0.25,avg*3),'fire');fx('boom',[]);break}
 default:return 0}return 1}
function monsTick(dt){const ms=liveMon();let chill=0;
 for(const m of ms){if(m.sk&&m.sk.includes('chill'))chill=1;if(!m.sk||!m.sk.length||m.stun>0||curseOf(m,'tr'))continue;
  m.skT-=dt*(curseOf(m,'de')?0.5:1);if(m.skT>0)continue;const s=pick(m.sk.filter(x=>x!=='chill'));if(!s){m.skT=99;continue}
  if((m.ranged||['spark','randel'].includes(s))&&curseOf(m,'dv')){m.skT=2;continue}
  if(curseOf(m,'cf')){m.skT=SKCD[s]||5;continue}
  monSkill(m,s);m.skT=(SKCD[s]||5)*(0.8+rnd()*0.4)/(m.spd||1)}
 if(chill){H.castT+=dt*0.33;for(const a of ALLY){a.t+=dt*0.33;if(a.mt!=null)a.mt+=dt*0.33}}
 if(H.curse&&H.curse<GT){H.curse=0;calc()}}

// ---------- 角色属性：任务永久奖励、随从光环、受咒 ----------
const _calc=calc;calc=function(){const o=_calc();const b=S.bon||{life:0,res:0};o.life+=b.life||0;
 for(const k in o.res){let v=o.res[k];if(b.res&&v<75)v=Math.min(75,v+b.res);if(typeof H!=='undefined'&&H.curse>GT)v-=25;o.res[k]=v}
 const mc=mercAlive()&&S.merc.t==='guard'?S.merc.v:null;if(mc==='might')o.sumdmg+=30;if(mc==='defi')o.def=Math.round(o.def*1.7);if(mc==='pray')o.regen+=2+S.lvl*0.15;
 ST=o;return o};

// ---------- 任务 ----------
const _questDone=questDone;questDone=function(q){_questDone(q);const d=S.diff,Q=QUESTS[q];
 switch(q){
 case'q2':S.mercU=1;if(!S.merc){hireMerc('archer',null,1);log('<b class="quest">荒原女射手 加入了你的队伍（随从）</b>')}break;
 case'a2q1':S.kp++;break;
 case'a3q1':S.bon.life+=20;calc();break;
 case'a3q2':{const it=genItem(S.lvl,{base:BASEM.rin,q:3});addBag(it);log('获得 '+itemName(it));break}
 case'a3q4':S.sp+=5;break;
 case'a4q1':S.kp+=2;break;
 case'a4q2':{const gl=[1,2,3][d];for(let i=0;i<4;i++)addBag({uid:S.uid++,k:'gem',g:pick(Object.keys(GEMS)),lv:gl});const rr=[[0,9],[6,11],[9,14]][d];const r={uid:S.uid++,k:'rune',r:R(rr[0],Math.min(RUNES.length-1,rr[1]))};addBag(r);log('熔炉迸出 4 颗宝石与 '+itemName(r));break}
 case'a5q1':S.sockq++;toast('铁匠：可为一件物品加凹槽');break;
 case'a5q2':for(const r of [[7,8,9],[8,9,10],[9,10,11]][d]){const it={uid:S.uid++,k:'rune',r:Math.min(RUNES.length-1,r)};addBag(it);log('获得 '+itemName(it))}break;
 case'a5q3':S.bon.res+=10;calc();break;
 case'a5q4':S.pers++;toast('可个性化一件物品');break;
 case'a5q5':{const x=Math.round((xpNeed(S.lvl+1)-xpNeed(S.lvl))*0.6);gainXp(x);log('远古英灵的祝福：经验 +'+fmt(x));break}
 }
 if(Q&&Q.fin)unlockAfter(Q.act)};
function partGet(qid,p){const k=qid+'_'+p;if(S.q[k])return;S.q[k]=1;const Q=QUESTS[qid];log(`<b class="quest">获得任务道具【${Q.parts[p]}】</b>`);if(Object.keys(Q.parts).every(x=>S.q[qid+'_'+x])&&!S.q[qid])questDone(qid)}
const _zoneClear=zoneClear;zoneClear=function(){const z=zoneData(),zi=S.zone,a=S.act;
 if(z.quest&&QUESTS[z.quest].clear&&!S.q[z.quest])questDone(z.quest);if(z.part)partGet(z.part[0],z.part[1]);
 _zoneClear();
 if(mercDead())mercRevive(1);
 const zs=ACTS[a].zones;
 // 挂机推进门槛：角色等级 ≥ 下一区域怪物等级 - GATE 才自动前进，否则原地历练
 if(S.auto&&S.zone!==zi&&S.lvl<zs[S.zone].ml-GATE){log(`<span class="dim">${zs[S.zone].n} 推荐 ${zs[S.zone].ml-GATE} 级，先在 ${zs[zi].n} 历练</span>`);S.zone=zi}
 if(S.auto&&zi===zs.length-1&&S.q[ACTS[a].fq]){const n=nextStage();if(n){const nz=ACTS[n[0]].zones[0];if(S.lvl>=mlD(nz.ml0,n[1])-GATE)goAct(n[0],n[1],TAB!=='fight')}}};
const _die=die;die=function(){const D=DIFFS[S.diff];if(D.dxp){const cur=S.xp-xpNeed(S.lvl),loss=Math.min(cur,Math.floor((xpNeed(S.lvl+1)-xpNeed(S.lvl))*D.dxp));if(loss>0){S.xp-=loss;log(`<b style="color:#f44">${D.n}死亡惩罚：经验 -${fmt(loss)}</b>`)}}
 const keep=ALLY.filter(a=>a.kind==='merc');_die();ALLY=keep;H.curse=0;calc()};
questLine=function(){const z=zoneData();let q=z.quest&&!S.q[z.quest]?z.quest:Object.keys(QUESTS).find(k=>QUESTS[k].act===S.act&&!S.q[k]);
 if(!q){const n=nextStage();return`【主线】${DIFFS[S.diff].n}·${ACTS[S.act].n.split('·')[1]} 已完成${n?'，可前往 '+DIFFS[n[1]].n+'·'+ACTS[n[0]].n.split('·')[1]:''}`}
 const Q=QUESTS[q];let p='';if(Q.parts)p=` (${Object.keys(Q.parts).filter(x=>S.q[q+'_'+x]).length}/${Object.keys(Q.parts).length})`;else p=` (${S.q[q]?1:0}/1)`;return`【主线】${Q.n}：${Q.d}${p}`};

// ---------- 随从 ----------
function mercAlive(){return S&&S.merc&&!S.merc.dead}
function mercDead(){return S&&S.merc&&S.merc.dead}
function mercAvail(){const mx=Math.max(...Object.values(S.actU||{0:0}),0);return Object.keys(MERCS).filter(k=>MERCS[k].act<=mx||(k==='archer'))}
function hireCost(){return Math.round(100+S.lvl*S.lvl*2)}
function reviveCost(){return 50+S.lvl*20}
function hireMerc(t,v,free){if(!free){const c=hireCost();if(S.gold<c)return toast('金币不足');S.gold-=c}
 const old=S.merc;if(old)for(const k of MSLOT)if(old.eq[k])addBag(old.eq[k]);
 S.merc={t,v:v||MERCS[t].vd,eq:{},dead:0};S.mercU=1;ALLY=ALLY.filter(a=>a.kind!=='merc');if(ST)calc();if(!free)log(`雇佣了 <b>${MERCS[t].n}</b>（${MERCS[t].vars[S.merc.v]}）`);if(typeof TAB!=='undefined'&&TAB!=='fight')render()}
function mercRevive(auto){if(!mercDead())return;const c=reviveCost();if(S.gold<c){if(!auto)toast('金币不足');return}S.gold-=c;S.merc.dead=0;calc();log(`花费 ${c} 金币复活随从 ${MERCS[S.merc.t].n}`);if(!auto)render()}
function mercStats(){const T=MERCS[S.merc.t],L=S.lvl,M={};let wmn=0,wmx=0,idef=0;
 for(const k of MSLOT){const it=S.merc.eq[k];if(!it)continue;const m=allMods(it),l=itemLocal(it);for(const x in m)M[x]=(M[x]||0)+m[x];if(l.def)idef+=l.def;if(k==='weapon'&&l.min){wmn=l.min;wmx=l.max}}
 const str=Math.floor(T.str[0]+T.str[1]*L)+(M.str||0),dex=Math.floor(T.dex[0]+T.dex[1]*L)+(M.dex||0);
 const life=Math.round(T.life[0]+T.life[1]*L+(M.life||0)+(M.vit||0)*2);const def=Math.round(T.def[0]+T.def[1]*L+idef+dex/4);
 const sb=1+str/100*(T.spell?0:1);const mn=(T.dmg[0][0]+T.dmg[0][1]*L+wmn)*sb,mx=(T.dmg[1][0]+T.dmg[1][1]*L+wmx)*sb;
 const er=k=>Math.min(75,Math.round(T.res*L)+(M[k]||0)+(M.allres||0)+curPen());const res={fire:er('fres'),cold:er('cres'),light:er('lres'),pois:er('pres')};
 const ias=(M.ias||0)+(S.merc.v==='frenzy'?30:0);
 return{L,str,dex,life,def,dmg:[mn,mx],res,ar:40+L*10+dex*2+(M.ar||0),ll:M.ll||0,atk:T.atk/(1+ias/100),avgres:Math.round((res.fire+res.cold+res.light+res.pois)/4)}}
function canMercEquip(it){if(!S.merc||it.k)return false;const b=BASEM[it.b],T=MERCS[S.merc.t];if(!MSLOT.includes(b.s))return false;if(b.s==='weapon'&&T.wcats&&!T.wcats.includes(b.cat))return false;
 const r=itemReq(it),ms=mercStats();return ms.L>=r.lv&&ms.str>=r.str&&ms.dex>=r.dex}
function mercEquip(uid){const f=findItem(uid);if(!f||f.slot||!canMercEquip(f.it))return;const it=f.it,k=BASEM[it.b].s;S.bag.splice(f.i,1);if(S.merc.eq[k])S.bag.push(S.merc.eq[k]);S.merc.eq[k]=it;closeM();render()}
function mercUnequip(k){if(S.bag.length>=40)return toast('背包已满');S.bag.push(S.merc.eq[k]);delete S.merc.eq[k];render()}
function mercAutoEq(){if(!S.merc||!S.autoEq||!S.autoMerc)return;for(const it of S.bag.slice()){if(it.k||!canMercEquip(it))continue;const k=BASEM[it.b].s,c=S.merc.eq[k];
 if(!c||power(it)>power(c)){S.bag.splice(S.bag.indexOf(it),1);if(c)S.bag.push(c);S.merc.eq[k]=it;log(`随从换装：<span style="color:${itemColor(it)}">${itemName(it)}</span>`)}}}
function mercTick(dt){if(!S.merc)return;let a=ALLY.find(x=>x.kind==='merc');
 if(!a){if(ACX.mercOn&&!S.merc.dead){S.merc.dead=1;ACX.mercOn=0;log(`<b style="color:#f84">随从 ${MERCS[S.merc.t].n} 阵亡</b>（营地可复活，${reviveCost()}金）`);calc();return}
  if(S.merc.dead){if(!liveMon().length)mercRevive(1);return}
  const ms=mercStats(),T=MERCS[S.merc.t];a={uid:mUid++,kind:'merc',n:T.n,ic:T.ic,hp:ms.life,max:ms.life,dmg:ms.dmg,res:ms.avgres,t:1e9,mt:1};ALLY.unshift(a);ACX.mercOn=1;calc();return}
 a.t=1e9;ACX.mercOn=1;
 ACX.mst=(ACX.mst||0)-dt;if(ACX.mst<=0){ACX.mst=1;const ms=mercStats();const r=a.hp/a.max;a.max=ms.life;a.hp=Math.min(a.max,Math.max(1,r*a.max));a.dmg=ms.dmg;a.res=ms.avgres;a.ms=ms}
 const ms=a.ms||mercStats();const mons=liveMon();if(!mons.length){a.hp=Math.min(a.max,a.hp+a.max*0.05*dt);return}
 if(S.merc.t==='guard'&&S.merc.v==='pray'){const h=(2+S.lvl*0.15)*dt;for(const x of ALLY)if(x.hp>0)x.hp=Math.min(x.max,x.hp+h)}
 a.mt-=dt;if(a.mt>0)return;a.mt=ms.atk;const tg=target(mons),T=MERCS[S.merc.t];const d=R(Math.round(ms.dmg[0]),Math.round(ms.dmg[1]));let done=0;
 if(T.spell){const el=S.merc.v;const tgs=el==='light'?mons.slice(0,3):[tg];for(const m of tgs){done+=hitMon(m,{[el]:d},a,{fire:'#f84',cold:'#8cf',light:'#ff6'}[el]);if(el==='cold')m.slow=GT+2}fxLine(a.uid,tg.uid,{fire:'#f84',cold:'#8cf',light:'#ff6'}[el])}
 else if(hitChance(ms.ar,tg.def,ms.L,tg.lv)){if(S.merc.t==='archer'){done=hitMon(tg,{phys:d*0.6,[S.merc.v]:d*0.6},a,S.merc.v==='fire'?'#f84':'#8cf');fxLine(a.uid,tg.uid,S.merc.v==='fire'?'#f84':'#8cf')}
  else{done=hitMon(tg,{phys:d*(1+(S.merc.t==='guard'&&S.merc.v==='might'?0.3:0))},a,'#dfd');if(S.merc.t==='barb'&&S.merc.v==='bash'&&rnd()<0.15&&!tg.boss)tg.stun=1}}
 if(done&&ms.ll)a.hp=Math.min(a.max,a.hp+done*ms.ll/100)}
const _allyCard=allyCard;allyCard=function(a){if(a.kind!=='merc')return _allyCard(a);return`<div class="ac merc ${a.hitT>0?'hit':''}" id="ca${a.uid}"><b class="lv">${S.lvl}</b><div class="pt">${art('merc_'+S.merc.t,a.ic)}</div><div class="nm">${a.n}</div>${bar(a.hp,a.max,'hp g')}</div>`};
const _monCard=monCard;monCard=function(m){let h=_monCard(m);if(m.imm&&m.imm.length)h=h.replace('<div class="pt">',`<em class="imm">${m.imm.map(x=>ELN[x]).join('')}免</em><div class="pt">`);return h};

// ---------- 主循环附加 ----------
const _step=step;step=function(dt){_step(dt);if(!ST)return;monsTick(dt);mercTick(dt);ACX.eqT=(ACX.eqT||0)+dt;if(ACX.eqT>3){ACX.eqT=0;mercAutoEq()}};

// ---------- 物品：加凹槽 / 个性化 （任务奖励） ----------
function addSock(uid){const f=findItem(uid);if(!f||S.sockq<=0)return;const it=f.it,b=BASEM[it.b];if(it.k||!b.sock||it.sock||it.rw!=null)return;
 const mx=Math.max(1,maxSock(b,it.il));it.sock=it.q<=2?mx:it.q===3?Math.min(mx,R(1,2)):1;S.sockq--;log(`铁匠为 ${itemName(it)} 打出 ${it.sock} 个凹槽`);calc();showItem(uid);render()}
function personalize(uid){const f=findItem(uid);if(!f||S.pers<=0)return;const it=f.it;if(it.k||it.pn||it.rw!=null)return;it.name='亡灵术士的'+it.name;it.pn=1;S.pers--;log('个性化完成：'+it.name);showItem(uid);render()}
const _showItem=showItem;showItem=function(uid){_showItem(uid);const f=findItem(uid);if(!f||f.it.k)return;const it=f.it,b=BASEM[it.b];const box=document.querySelector('#modal .ipanel .btns.c');if(!box)return;let h='';
 if(f.i!=null&&S.merc&&canMercEquip(it))h+=`<button class="btn" onclick="mercEquip(${uid})">给随从</button>`;
 if(S.sockq>0&&b.sock&&!it.sock&&it.rw==null)h+=`<button class="btn gold" onclick="addSock(${uid})">加凹槽×${S.sockq}</button>`;
 if(S.pers>0&&!it.pn&&it.rw==null)h+=`<button class="btn gold" onclick="personalize(${uid})">个性化×${S.pers}</button>`;
 if(h)box.insertAdjacentHTML('afterbegin',h)};

// ---------- UI：战斗页、角色页随从、地图页 ----------
const _renderFight=renderFight;renderFight=function(){_renderFight();const e=document.querySelector('#ftop .zn');if(e&&S.diff)e.innerHTML=`<b class="diff d${S.diff}">${DIFFS[S.diff].n}</b> `+e.innerHTML};
function mercPanel(){if(!S.mercU&&!S.merc)return`<div class="gp"><h3>随从</h3><div class="dim">完成第一章任务「堕落女猎手」后可获得随从。</div></div>`;
 let h='<div class="gp"><h3>随从</h3>';
 if(S.merc){const T=MERCS[S.merc.t],ms=mercStats();const row=(a,b)=>`<div class="row"><span>${a}</span><b>${b}</b></div>`;
  h+=`<div class="row"><span><b>${T.n}</b> <span class="dim">${T.kind} · ${T.vars[S.merc.v]}</span></span><b>${S.merc.dead?'<span class="bad">阵亡</span>':'Lv.'+ms.L}</b></div>`+
  row('生命 / 防御',ms.life+' / '+ms.def)+row('伤害',Math.round(ms.dmg[0])+'-'+Math.round(ms.dmg[1])+(T.spell?'（法术）':''))+row('力量 / 敏捷',ms.str+' / '+ms.dex)+row('火/冰/电/毒 抗',`${ms.res.fire}/${ms.res.cold}/${ms.res.light}/${ms.res.pois}`)+
  `<div class="doll merc">${MSLOT.map(k=>{const it=S.merc.eq[k];return it?`<div class="dslot">${cell(it,`mercUnequip('${k}')`)}</div>`:`<div class="dslot"><div class="cell empty"><small>${SLOTN[k]}</small></div></div>`}).join('')}</div>
  <div class="dim">点背包物品详情中的「给随从」装备；点上方格子卸下。随从等级跟随角色，可穿：${T.wcats?T.wcats.map(c=>({wand:'魔杖',dagger:'匕首',sword:'剑'})[c]).join('/'):'任意武器'}、头盔、铠甲</div>
  <div class="btns">${S.merc.dead?`<button class="btn sm gold" onclick="mercRevive()">复活 ${reviveCost()}◈</button>`:''}<button class="btn sm ${S.autoMerc?'on':''}" onclick="S.autoMerc^=1;render()">随从自动换装</button></div>`}
 h+=`<div class="dim" style="margin-top:6px">营地雇佣（替换当前随从，装备退回背包）：${hireCost()}◈</div>`;
 for(const t of mercAvail()){const T=MERCS[t];h+=`<div class="row"><span>${T.ic} ${T.n} <span class="dim">(${ACTS[T.act].camp})</span></span><span class="btns">${Object.entries(T.vars).map(([v,n])=>`<button class="btn xs" onclick="hireMerc('${t}','${v}')">${n.split('(')[0]}</button>`).join('')}</span></div>`}
 return h+'</div>'}
const _renderHero=renderHero;renderHero=function(){_renderHero();const P=$('#panel');const g=P.querySelectorAll('.gp');if(g.length>1)g[1].insertAdjacentHTML('afterend',mercPanel());else P.insertAdjacentHTML('beforeend',mercPanel())};
renderMap=function(){const P=$('#panel');if(MAPD==null)MAPD=S.diff;if(MAPA==null)MAPA=S.act;const A=ACTS[MAPA],d=MAPD,open=actOpen(MAPA,d),k=pkey(MAPA,d),here=MAPA===S.act&&d===S.diff;
 const q=d===S.diff?S.q:(S.Q[d]||{}),cl=here?S.cleared:(S.CL[k]||{}),unl=here?S.unl:(S.UN[k]||0);
 const imm=key=>{const T=MONS[key];if(!T)return'';const r=resFor(T,d,0);const im=Object.keys(r).filter(x=>r[x]>=100);return im.length?`<span class="imm2">${im.map(x=>ELN[x]).join('')}免</span>`:''};
 const dtabs=DIFFS.map((D,i)=>`<button class="${MAPD===i?'on':''} ${i>S.diffU?'lk':''}" onclick="MAPD=${i};render()">${D.n}${D.pen?`(抗${D.pen})`:''}${i>S.diffU?'🔒':''}</button>`).join('');
 const atabs=ACTS.map((a,i)=>`<button class="${MAPA===i?'on':''} ${actOpen(i,d)?'':'lk'}" onclick="MAPA=${i};render()">第${'一二三四五'[i]}章${actOpen(i,d)?'':'🔒'}</button>`).join('');
 const qs=Object.entries(QUESTS).filter(([,Q])=>Q.act===MAPA);
 P.innerHTML=`<div class="stabs">${dtabs}</div><div class="stabs">${atabs}</div>
 <div class="gp actc"><h3>${A.n} <span class="dim">${DIFFS[d].n}</span></h3><div class="dim">营地：<b>${A.camp}</b> · 章节首领：<b class="bossn">${A.boss}</b> · 怪物等级 ${Math.min(...A.zones.map(z=>mlD(z.ml0,d)))}-${Math.max(...A.zones.map(z=>mlD(z.ml0,d)))}</div>
 <div class="dim">营地服务：随从雇佣/复活（角色页）${S.sockq?` · 铁匠加凹槽×${S.sockq}`:''}${S.pers?` · 个性化×${S.pers}`:''} · 当前：${DIFFS[S.diff].n}·${ACTS[S.act].n.split('·')[1]}</div>
 ${open&&!here?`<div class="btns"><button class="btn sm gold" onclick="goAct(${MAPA},${d});MAPD=${d}">前往 ${A.camp}</button></div>`:''}
 <div class="qlist">${qs.map(([k2,Q])=>`<div class="q ${q[k2]?'ok':''}">${q[k2]?'✔':'○'} ${Q.n}：<span class="dim">${Q.d}</span> → ${Q.rw}</div>`).join('')}</div></div>
 ${!open?`<div class="gp"><div class="dim">🔒 ${d>S.diffU?'击败上一难度终章首领后开放':'击败上一章首领后开放'}</div></div>`:''}
 ${A.zones.map((z,i)=>{const lk=!open||i>unl,cur=here&&i===S.zone,ml=mlD(z.ml0,d);const bs=z.bosses||(z.boss?[z.boss]:[]);const wb=z.bw?Object.values(z.bw).flatMap(x=>x.b):[];
  return`<div class="zc ${lk?'lock':''} ${cur?'cur':''} ${bs.length||wb.length?'bz':''}" onclick="${lk?'':`mapGo(${MAPA},${d},${i})`}">
  <div><b>${z.n}</b> ${z.dun?'<span class="tag">地下城</span>':''}${z.side?'<span class="tag">支线</span>':''}${cl[i]?'<span class="tag ok">已肃清</span>':''}<div class="dim">${z.mons.map(m=>MONS[m].n+imm(m)).join('·')}${bs.length?` · 首领 <span class="bossn">${bs.map(b=>BOSSES[b].n).join('、')}</span>`:''}${wb.length?` · 波次首领 <span class="bossn">${wb.map(b=>BOSSES[b].n).join('、')}</span>`:''}</div>
  ${z.quest?`<div class="q ${q[z.quest]?'ok':''}">${q[z.quest]?'✔':'❗'} 任务：${QUESTS[z.quest].n}（${QUESTS[z.quest].rw}）</div>`:''}${z.part?`<div class="q ${q[z.part[0]+'_'+z.part[1]]?'ok':''}">${q[z.part[0]+'_'+z.part[1]]?'✔':'◇'} 道具：${QUESTS[z.part[0]].parts[z.part[1]]}</div>`:''}</div>
  <div class="zr"><span>mlvl ${ml}</span><small>${z.w}波</small>${lk?'🔒':cur?'<em>当前</em>':''}</div></div>`}).join('')}`};
function mapGo(a,d,i){if(a!==S.act||d!==S.diff)goAct(a,d,1);goZone(i);TAB='fight';render()}
