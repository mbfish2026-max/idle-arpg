'use strict';
// ===== 秘境（地狱通关后的无尽层数）：复用 eg_rift.js 的运行框架（随机章节怪池/归一化/进度条/首领），免费无钥石 =====
// 规则：进度 100% → 秘境之主；5 分钟内通关 → 下一层 +1；超时通关仍发奖励不升层；阵亡 3 次或首领 90 秒无进展 → 层数 -1。
// 自动推层：从当前层开始，成功 +1；失败 -1 并在该层循环刷，每刷 10 次再试一次失败的那层。秘境内不做离线结算（后台/息屏 → 退出秘境）。
// 存档：S.eg.mj（每角色一份）。
const EG_MJ={n:'秘境',boss:'秘境之主',cur:'秘晶',ic:'◆',limit:300,goal:100,pts:{n:1,champ:3,uniq:6},maxDie:3,bossIdle:90,retry:10,
 ml:L=>Math.min(99,85+Math.floor(L/5)),hp:L=>Math.pow(1.08,L),dmg:L=>Math.pow(1.035,L),bossHP:1.5,
 xp:L=>1.4*(1+0.12*L),mf:L=>40+3*L,gf:L=>30+10*L,rolls:L=>1+Math.floor(L/5),leg:L=>Math.min(0.6,0.1+0.02*L),
 crys:L=>1+Math.floor(L/10),gemCost:lv=>5*(lv+1)};
const EG_MJ_DEF=()=>({cur:1,best:0,bestT:0,bestD:'',cr:0,runs:0,ok:0,fail:0,auto:1,wall:0,farm:0});
function egMj(){const e=EG();if(!e.mj||typeof e.mj!=='object')e.mj=EG_MJ_DEF();else egFill(e.mj,EG_MJ_DEF());return e.mj}
function egMjLock(){return egHellDone()?null:'击败地狱第五章首领（毁灭领主·艾尔德隆）后开放'}
// 以地狱难度为基准生成怪物（只在生成时临时切换难度，不影响角色所在难度）
function egMjHell(f){const d=S.diff;S.diff=2;try{return f()}finally{S.diff=d}}
function egMjMon(run,k,lv,fl){const L=run.L;const m=egMjHell(()=>mkMon(k,lv,fl));m.max=m.hp=Math.round(m.max*EG_MJ.hp(L)*run.nf.h);m.dmg=m.dmg.map(x=>x*EG_MJ.dmg(L)*run.nf.d);m.exp*=EG_MJ.xp(L);return m}
function egMjBossHP(L,ml){const b=egMjHell(()=>_eg_mkMonQ('eldron',ml));return Math.round(b.max*EG_MJ.hp(L)*EG_MJ.bossHP)}
function egMjStart(L){if(egMjLock())return toast(egMjLock());const M=egMj();L=Math.max(1,Math.min(L|0||M.cur,M.cur));
 const a=R(0,ACTS.length-1),pool=egRiftPool(a),ml=EG_MJ.ml(L),nf=egMjHell(()=>egRiftNorm(a,ml));
 const run={k:'mj',L,a,pool,ml,nf,lk:0,el:0,prog:0,t:0,deaths:0,guard:null,gdone:0,over:0,name:`${EG_MJ.n} ${L}层`,bg:'bg_act'+(a+1),
  spawn(){if(this.gdone||this.end)return;if(this.prog>=EG_MJ.goal&&!this.guard){egMjBoss(this);return}if(this.guard)return;
   const r=rnd(),k=pick(pool);if(r<0.12){for(let i=0;i<R(3,4);i++)MON.push(egMjMon(this,k,ml+2,'champ'))}
   else if(r<0.2){MON.push(egMjMon(this,k,ml+3,'uniq'));for(let i=0;i<R(2,3);i++)MON.push(egMjMon(this,k,ml+3))}
   else for(let i=0;i<R(4,6);i++)MON.push(egMjMon(this,pick(pool),ml));MON=MON.slice(0,8)},
  next(){this.spawn()},
  onKill(m){this.lk=this.el;if(m.egMjBoss){this.gdone=1;egMjDone(this);return}if(this.guard)return;const P=EG_MJ.pts;
   this.prog=Math.min(EG_MJ.goal,this.prog+(m.fl==='uniq'?P.uniq:m.fl==='champ'?P.champ:P.n));if(this.prog>=EG_MJ.goal&&!this.guard){MON=MON.filter(x=>x.hp>0);spawnT=0.8}},
  onDie(){this.deaths++;spawnT=3;if(this.deaths>=EG_MJ.maxDie)egMjFail(this,`阵亡 ${this.deaths} 次`)},
  wave(){return this.guard?EG_MJ.boss:`进度 ${Math.floor(this.prog)}%`},
  top(){const lim=EG_MJ.limit,left=lim-this.t;return`<div class="egline"><span>${this.guard?'👑':'🌀'} ${L}层</span>${egPbar(this.prog,EG_MJ.goal,'rift')}<span>${Math.floor(this.prog)}%</span></div>`+
   `<div class="egline"><span>⏳ ${egTime(Math.max(0,left))}</span>${egPbar(Math.max(0,left),lim,'time')}<span>${this.over?'<b class="bad">超时</b>':'☠'+this.deaths+'/'+EG_MJ.maxDie}</span></div>`},
  quest(){return`【${this.name}】${this.guard?'击败 '+EG_MJ.boss+'！':'清除怪物积累进度 '+Math.floor(this.prog)+'/'+EG_MJ.goal}${this.deaths?' · 阵亡'+this.deaths:''}`},
  quit(){this.end=1}};
 egEnter(run);M.runs++;return run}
function egMjBoss(run){const ks=Object.keys(BOSSES).filter(k=>!BOSSES[k].actboss&&BOSSES[k].a);const k=pick(ks.length?ks:Object.keys(BOSSES));
 const m=egMjMon(run,k,run.ml+2);m.max=m.hp=egMjBossHP(run.L,run.ml);m.n=EG_MJ.boss+'·'+BOSSES[k].n;m.egMjBoss=1;run.guard=m;MON=[m];run.lk=run.el;run.gmin=null;log(`<b class="bossn">${m.n}</b> 自秘境深处现身！`)}
egOn('tick',dt=>{const r=EGM;if(!r||r.k!=='mj'||r.gdone||r.end)return;r.el+=dt;r.t+=dt;if(!r.over&&r.t>EG_MJ.limit){r.over=1;log('<b style="color:#f66">秘境已超时：击败秘境之主仍有奖励，但不会升层</b>')}});
egOn('sec',()=>{const r=EGM;if(!r||r.k!=='mj'||r.gdone||r.end)return;
 if(r.guard){const g=r.guard;if(r.gmin==null||g.hp<r.gmin-g.max*0.005){r.gmin=g.hp;r.lk=r.el}if(r.el-r.lk>EG_MJ.bossIdle)egMjFail(r,EG_MJ.boss+` ${EG_MJ.bossIdle} 秒毫无进展`);return}
 if(r.el-r.lk>45&&liveMon().length){MON=[];spawnT=1;r.lk=r.el;log('<span class="dim">秘境中的怪物遁走了</span>')}});
egOn('calc',o=>{if(EGM&&EGM.k==='mj'){o.mf+=EG_MJ.mf(EGM.L);o.gf+=EG_MJ.gf(EGM.L)}});
// 推层规则（纯函数，tests/mj_test.js 覆盖）：返回新的 {cur,wall,farm}
function egMjNext(M,L,res){let{cur,wall,farm}=M;const W=EG_MJ.retry;
 if(res==='fail'){wall=L;cur=Math.max(1,L-1);farm=0}
 else if(res==='up'){if(wall&&L+1===wall&&farm+1<W){farm++;cur=L}else{cur=L+1;farm=0;if(wall&&L>=wall)wall=0}}
 else{cur=L;if(wall&&L+1===wall&&++farm>=W){cur=wall;farm=0}}// 超时通关：原层
 return{cur,wall,farm}}
function egMjAutoL(M){return M.cur}
function egMjAfter(run,res){const M=egMj(),L=run.L;Object.assign(M,egMjNext(M,L,res));
 run.res=Object.assign(run.res||{},{res,next:M.cur});
 setTimeout(()=>{if(EGM===run)egLeave(1);if(M.auto&&!egMjBlocked()){egMjStart(egMjAutoL(M))}else egMjResult(run)},M.auto?1200:0);egRefresh()}
function egMjBlocked(){return document.hidden||(window.PWR&&PWR.sleeping)||EGM}
function egMjFail(run,why){if(run.end||run.gdone)return;run.end=1;const M=egMj();M.fail++;log(`<b style="color:#f84">秘境 ${run.L} 层失败（${why}），退回 ${Math.max(1,run.L-1)} 层</b>`);toast('秘境失败 -1层');MON=[];egMjAfter(run,'fail')}
function egMjDone(run){const M=egMj(),L=run.L,ml=run.ml,ok=!run.over&&run.t<=EG_MJ.limit,ex=[];
 for(let i=0;i<EG_MJ.rolls(L);i++)for(const it of rollTC(run.guard)){ex.push(it);addBag(it)}
 if(rnd()<EG_MJ.leg(L)){const il=Math.min(99,ml+3),six=rnd()<0.5,P=(six?SETITEMS:UNIQUES).filter(x=>x.lv<=il&&BASEM[x.b]);
  if(P.length){const it=genItem(il,{base:BASEM[pick(P).b],q:six?6:5});ex.push(it);addBag(it)}}
 const rr=rollRune(ml+Math.min(30,L*1.5));ex.push(rr);addBag(rr);
 const cr=EG_MJ.crys(L);M.cr+=cr;M.ok++;
 if(L>M.best||(L===M.best&&ok&&(!M.bestT||run.t<M.bestT))){if(ok||L>M.best){M.best=Math.max(M.best,L);M.bestT=Math.round(run.t);M.bestD=egDay()}}
 const gx=Math.round((xpNeed(Math.min(99,S.lvl+1))-xpNeed(S.lvl))*Math.min(0.2,0.02+0.01*L));if(S.lvl<99&&gx>0)gainXp(gx);
 egStat('mj');log(ok?`<b class="quest">秘境 ${L} 层完成！用时 ${egTime(run.t)}，${EG_MJ.ic}${EG_MJ.cur}+${cr}，进入 ${L+1} 层</b>`:`<b style="color:#f84">秘境 ${L} 层超时完成，${EG_MJ.ic}${EG_MJ.cur}+${cr}，层数不变</b>`);
 toast(ok?'秘境完成 +1层':'秘境超时完成');run.res={ok,ex,cr,gx,t:run.t};egMjAfter(run,ok?'up':'stay')}
function egMjResult(run){const r=run.res;if(!r||window.__NOUI)return;const fail=r.res==='fail';
 modal(`<div class="mtitle">${run.name} ${fail?'失败':r.ok?'完成':'超时'}</div><div class="gp"><div>用时 ${egTime(run.t)} / ${egTime(EG_MJ.limit)} · 阵亡 ${run.deaths}</div>
 ${fail?'<div class="bad">层数 -1</div>':`<div>${EG_MJ.ic}${EG_MJ.cur} +${r.cr}${r.gx?' · 经验 +'+fmt(r.gx):''}</div><div class="grid">${(r.ex||[]).map(it=>cell(it,'')).join('')}</div>`}
 <div class="btns c"><button class="btn" onclick="closeM()">返回</button><button class="btn gold" onclick="closeM();egMjStart(${r.next})">开启 ${r.next} 层</button></div></div>`)}
// 后台 / 息屏：秘境不做离线推进，直接退出（回来后按普通离线公式在原区域结算）
document.addEventListener('visibilitychange',()=>{if(document.hidden&&EGM&&EGM.k==='mj'){log('<span class="dim">切到后台，已退出秘境（秘境内不做离线结算）</span>');egLeave(1)}});
EG_BOOT.push(()=>{if(typeof sleepOn==='function'){const f=sleepOn;window.sleepOn=sleepOn=function(){if(EGM&&EGM.k==='mj')egLeave(1);return f.apply(this,arguments)}}});
// ---------- 宝石升阶（秘晶唯一用途）：背包宝石 +1 阶 ----------
function egMjGems(){const g={};for(const x of S.bag)if(x&&x.k==='gem'&&x.lv<4){const k=x.g+x.lv;(g[k]=g[k]||{g:x.g,lv:x.lv,n:0}).n++}return Object.values(g).sort((a,b)=>b.lv-a.lv||a.g.localeCompare(b.g))}
function egMjGemUp(g,lv){const M=egMj(),c=EG_MJ.gemCost(lv);if(lv>=4)return;if(M.cr<c)return toast(`需要 ${c} ${EG_MJ.cur}`);const it=S.bag.find(x=>x&&x.k==='gem'&&x.g===g&&x.lv===lv);if(!it)return;
 M.cr-=c;it.lv++;log(`${EG_MJ.cur}升阶：<span style="color:${GEMS[g].c}">${itemName(it)}</span>`);toast('升阶成功：'+itemName(it));save();egRefresh()}
// ---------- 各角色对比（读本账号各角色存档，当前角色取实时数据） ----------
function egMjChars(){const out=[];if(typeof ACCT==='undefined'||!ACCT||!ACCT.chars)return out;
 for(const c of ACCT.chars){let s=null;if(c.id===ACCT.cur)s=S;else try{s=JSON.parse(GS.getItem(CH_PRE+c.id))}catch(e){}
  const m=s&&s.eg&&s.eg.mj||{};out.push({nm:c.name||c.cls,cls:c.cls,lv:(s&&s.lvl)||c.lvl||1,best:m.best||0,t:m.bestT||0,d:m.bestD||'',cur:c.id===ACCT.cur})}
 return out.sort((a,b)=>b.best-a.best||a.t-b.t)}
function egMjPage(){const M=egMj(),L=M.cur,ml=EG_MJ.ml(L),in_=EGM&&EGM.k==='mj';const gs=egMjGems(),ch=egMjChars();
 return`<div class="gp mjp"><h3>🌀 ${EG_MJ.n} <span class="r">${EG_MJ.ic}${EG_MJ.cur} ×${M.cr}</span></h3>
  <div class="dim">免费进入。击杀积累进度，满 100% 后${EG_MJ.boss}现身。5 分钟内通关升 1 层；阵亡 ${EG_MJ.maxDie} 次或首领 ${EG_MJ.bossIdle} 秒无进展退 1 层。</div>
  <div class="row"><span>当前层 · 最高通关</span><b>${L} · ${M.best}</b></div>
  <div class="row"><span>怪物等级 / 生命 / 伤害</span><b>${ml} / ×${EG_MJ.hp(L).toFixed(2)} / ×${EG_MJ.dmg(L).toFixed(2)}</b></div>
  <div class="row"><span>寻宝 / 金币 / 首领掉落</span><b>+${EG_MJ.mf(L)}% / +${EG_MJ.gf(L)}% / ×${EG_MJ.rolls(L)}</b></div>
  <div class="row"><span>暗金/套装 · ${EG_MJ.cur}</span><b>${Math.round(EG_MJ.leg(L)*100)}% · +${EG_MJ.crys(L)}</b></div>
  <div class="row"><span>自动推层<br><small class="dim">成功+1，失败-1并刷${EG_MJ.retry}次再试</small></span><button class="btn sm ${M.auto?'on':''}" onclick="egMj().auto=egMj().auto?0:1;egRefresh()">${M.auto?'已开启':'关闭'}</button></div>
  ${M.wall?`<div class="dim">卡在 ${M.wall} 层：已刷 ${M.farm}/${EG_MJ.retry} 次</div>`:''}
  <div class="btns">${in_?`<button class="btn" onclick="egLeave()">离开秘境</button>`:`<button class="btn gold" onclick="egMjStart(egMjAutoL(egMj()))" ${EGM?'disabled':''}>进入 ${egMjAutoL(M)} 层</button>`}<button class="btn sm" onclick="EGT='rift';render()">← 虚隙</button></div>
  <div class="dim">完成 ${M.ok} · 失败 ${M.fail} · 进入 ${M.runs}</div></div>
 <div class="gp"><h3>${EG_MJ.cur}升阶 <span class="r dim">背包宝石 +1 阶</span></h3>${gs.length?gs.map(x=>{const c=EG_MJ.gemCost(x.lv);return`<div class="row"><span style="color:${GEMS[x.g].c}">${itemName({k:'gem',g:x.g,lv:x.lv})} ×${x.n}</span><button class="btn sm" onclick="egMjGemUp('${x.g}',${x.lv})" ${M.cr<c?'disabled':''}>升阶 ${c}${EG_MJ.ic}</button></div>`}).join(''):'<div class="dim">背包里没有可升阶的宝石（完美宝石已满阶）</div>'}</div>
 <div class="gp"><h3>秘境碑 <span class="r dim">本账号各角色</span></h3><table class="egrank"><tr><th>#</th><th>角色</th><th>等级</th><th>最高层</th><th>用时</th><th>日期</th></tr>${ch.map((r,i)=>`<tr${r.cur?' class="mjcur"':''}><td>${i+1}</td><td>${r.nm}</td><td>${r.lv}</td><td><b>${r.best||'-'}</b></td><td>${r.best?egTime(r.t):'-'}</td><td>${r.d||'-'}</td></tr>`).join('')}</table></div>`}
egPage({k:'mj',n:EG_MJ.n,hide:1,parent:'rift',lock:egMjLock,render:egMjPage,intro:'通关地狱后，虚隙尽头会裂开一道通往秘境的门：层数无限，越深越强，奖励越好。'});
// 虚隙页顶部入口（不新增页签行）
{const P=EG_PAGES.find(p=>p.k==='rift');if(P){const f=P.render;P.render=function(){const lk=egMjLock(),M=egMj();return`<div class="gp mjent"><div class="row"><span>🌀 <b>${EG_MJ.n}</b><br><small class="dim">${lk?'🔒 '+lk:`当前 ${M.cur} 层 · 最高 ${M.best} 层 · ${EG_MJ.ic}${M.cr}`}</small></span><button class="btn sm ${lk?'':'gold'}" onclick="EGT='mj';render()">${lk?'查看':'进入'}</button></div></div>`+f.apply(this,arguments)}}}
