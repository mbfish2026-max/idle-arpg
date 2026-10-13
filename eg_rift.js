'use strict';
// ===== 2. 虚隙 / 深渊虚隙：随机章节怪物池，击杀积累进度 → 守望者现身；深渊虚隙限时、层数无限，层数越高怪越强奖励越好；钥石可升级；本地排行「虚隙碑」 =====
const EG_RKEY='anye_eg_rank';
function egRank(){try{return JSON.parse(localStorage.getItem(EG_RKEY))||[]}catch(e){return[]}}
function egRankAdd(r){const L=egRank();L.push(r);L.sort((a,b)=>b.t-a.t||a.s-b.s);localStorage.setItem(EG_RKEY,JSON.stringify(L.slice(0,20)))}
function egRiftLock(){return egNormalDone()?null:'击败普通难度第五章首领后，雪峰要塞的裂隙术士将为你开启虚隙'}
function egRiftMl(T){return Math.min(99,Math.max(S.lvl,10)+Math.floor(T/8))}
function egRiftPool(a){const s=new Set();for(const z of ACTS[a].zones)for(const m of z.mons||[])if(MONS[m])s.add(m);return[...s]}
function egRiftStart(T){if(egRiftLock())return toast(egRiftLock());const R0=EG().rift;T=Math.max(0,Math.min(T|0,R0.max));
 if(T>0){if(R0.keys<=0)return toast('没有'+EG_RIFT.key.n);R0.keys--}
 const a=R(0,ACTS.length-1),pool=egRiftPool(a),ml=egRiftMl(T);const nf=egRiftNorm(a,ml);
 const run={k:'rift',T,a,pool,ml,nf,lk:0,prog:0,t:0,deaths:0,guard:null,gdone:0,over:0,
  name:T?`${EG_RIFT.gn} ${T}层`:EG_RIFT.n,bg:'bg_act'+(a+1),bountyOk:1,
  spawn(){if(this.gdone)return;if(this.prog>=EG_RIFT.goal&&!this.guard){egRiftGuard(this);return}if(this.guard)return;
   const r=rnd(),k=pick(pool);if(r<0.12){for(let i=0;i<R(3,4);i++)MON.push(egRiftMon(this,k,ml+2,'champ'))}
   else if(r<0.2){const L=egRiftMon(this,k,ml+3,'uniq');MON.push(L);for(let i=0;i<R(2,3);i++)MON.push(egRiftMon(this,k,ml+3))}
   else for(let i=0;i<R(4,6);i++)MON.push(egRiftMon(this,pick(pool),ml));MON=MON.slice(0,8)},
  next(){this.spawn()},
  onKill(m){this.lk=this.el||0;if(m.egGuard){this.gdone=1;egRiftDone(this);return}if(this.guard)return;const P=EG_RIFT.pts;this.prog=Math.min(EG_RIFT.goal,this.prog+(m.fl==='uniq'?P.uniq:m.fl==='champ'?P.champ:P.n));
   if(this.prog>=EG_RIFT.goal&&!this.guard){MON=MON.filter(x=>x.hp>0);spawnT=0.8}},
  onDie(){this.deaths++;if(this.T)this.t+=Math.min(15,5*this.deaths);spawnT=3},
  wave(){return this.guard?'守望者':`进度 ${Math.floor(this.prog)}%`},
  top(){const lim=EG_RIFT.limit;return`<div class="egline"><span>${this.T?'⏳ '+egTime(Math.max(0,lim-this.t)):'∞'}</span>${egPbar(this.prog,EG_RIFT.goal,'rift')}<span>${Math.floor(this.prog)}%</span></div>`+(this.T?`<div class="egline">${egPbar(Math.max(0,lim-this.t),lim,'time')}<span>${this.over?'<b class="bad">已超时</b>':'限时'}</span></div>`:'')},
  quest(){return`【${this.name}】${this.guard?'击败 '+EG_RIFT.guard+'！':'清除怪物积累进度 '+Math.floor(this.prog)+'/'+EG_RIFT.goal}${this.deaths?' · 阵亡'+this.deaths:''}`},
  quit(){if(!this.gdone&&this.T)log('<span class="dim">虚隙已中止（钥石已消耗）</span>')}};
 egEnter(run);R0.runs++}
// 各章怪物池强度不同：按“全部章节平均”归一化生命/伤害，使同层难度稳定
function egRiftNorm(a,ml){const st=p=>{let h=0,d=0;for(const k of p){const m=_eg_mkMonQ(k,ml);h+=m.max;d+=(m.dmg[0]+m.dmg[1])/2}return[h/p.length,d/p.length]};
 const all=ACTS.map((_,i)=>st(egRiftPool(i)));const ah=all.reduce((s,x)=>s+x[0],0)/all.length,ad=all.reduce((s,x)=>s+x[1],0)/all.length;return{h:ah/all[a][0],d:ad/all[a][1]}}
function _eg_mkMonQ(k,lv){const u=mUid;const m=mkMon(k,lv);mUid=u;return m}
function egRiftMon(run,k,lv,fl){const m=mkMon(k,lv,fl),T=run.T;m.max=m.hp=Math.round(m.max*EG_RIFT.hp(T)*run.nf.h);m.dmg=m.dmg.map(x=>x*EG_RIFT.dmg(T)*run.nf.d);m.exp*=EG_RIFT.xp(T);return m}
function egRiftGuard(run){const ks=Object.keys(BOSSES).filter(k=>!BOSSES[k].actboss&&BOSSES[k].a);const k=pick(ks.length?ks:Object.keys(BOSSES));
 const m=egRiftMon(run,k,run.ml+2);m.max=m.hp=Math.round(m.max*EG_RIFT.guardHP);m.n=EG_RIFT.guard+'·'+BOSSES[k].n;m.egGuard=1;run.guard=m;MON=[m];log(`<b class="bossn">${m.n}</b> 撕开裂隙降临！`)}
egOn('tick',dt=>{if(EGM&&EGM.k==='rift'&&!EGM.gdone)EGM.el=(EGM.el||0)+dt;if(EGM&&EGM.k==='rift'&&EGM.T&&!EGM.gdone){EGM.t+=dt;if(!EGM.over&&EGM.t>EG_RIFT.limit){EGM.over=1;log('<b style="color:#f66">深渊虚隙已超时：仍可击败守望者，但钥石不会升级</b>')}}});
// 虚隙内不触发区域“僵持撤退”；改为 45 秒无击杀时怪物遁入裂隙（守望者除外，守望者 90 秒血量毫无进展则判定失败离开）
const _eg_stuckTick=stuckTick;stuckTick=function(dt){if(EGM)return;return _eg_stuckTick(dt)};
egOn('sec',()=>{const r=EGM;if(!r||r.k!=='rift'||r.gdone)return;if(r.guard){const g=r.guard;if(r.gmin==null||g.hp<r.gmin-g.max*0.005){r.gmin=g.hp;r.lk=r.el}}const idle=(r.el||0)-r.lk;if(!r.guard&&idle>45&&liveMon().length){MON=[];spawnT=1;r.lk=r.el;log('<span class="dim">裂隙中的怪物遁走了</span>')}
 if(r.guard&&idle>90){log('<b style="color:#f84">守望者过于强大，你被逐出了虚隙</b>');egLeave(1)}});
egOn('calc',o=>{if(EGM&&EGM.k==='rift'){o.mf+=EG_RIFT.mf(EGM.T);o.gf+=EG_RIFT.gf(EGM.T)}});
function egRiftDone(run){const R0=EG().rift,T=run.T,ok=!T||!run.over;const ml=run.ml;let up=0;
 const g=run.guard,ex=[];for(let i=0;i<1+Math.floor(T/5);i++)for(const it of rollTC(g)){ex.push(it);addBag(it)}
 if(T>=1&&rnd()<Math.min(0.6,0.1+T*0.02))ex.push(egGive(genItem(Math.min(99,ml+3),{q:5})));
 const rr=rollRune(ml+Math.min(30,T*1.5));ex.push(egGive(rr));
 let keys=T?(ok?1:0):1;if(T&&ok&&rnd()<0.25)keys++;R0.keys+=keys;
 if(T&&ok){const left=EG_RIFT.limit-run.t;up=left>EG_RIFT.limit*0.5?3:left>EG_RIFT.limit*0.25?2:1;R0.max=Math.max(R0.max,T+up);R0.ok++;R0.best=Math.max(R0.best,T);
  egRankAdd({t:T,s:Math.round(run.t),lv:S.lvl,d:egDay(),se:EG().season?EG().season.n:'',nm:EG().title||''})}
 egWeekProg('wrift');egStat('rift');if(T)egStat('grift');
 const gx=Math.round((xpNeed(Math.min(99,S.lvl+1))-xpNeed(S.lvl))*Math.min(0.2,0.02+0.01*T));if(S.lvl<99&&gx>0)gainXp(gx);
 const msg=T?(ok?`<b class="quest">深渊虚隙 ${T} 层完成！用时 ${egTime(run.t)}，钥石等级 +${up}（最高 ${R0.max} 层）</b>`:`<b style="color:#f84">深渊虚隙 ${T} 层：超时完成，钥石未升级</b>`):`<b class="quest">虚隙完成！获得 ${EG_RIFT.key.ic}${EG_RIFT.key.n}×${keys}</b>`;
 log(msg);toast(T?(ok?'虚隙完成 +'+up+'层':'虚隙超时'):'虚隙完成');
 run.res={ok,up,keys,ex,gx,t:run.t};
 setTimeout(()=>{if(EGM===run)egLeave(1);egRiftResult(run)},0)}
function egGive(it){addBag(it);return it}
function egRiftResult(run){const r=run.res;if(!r||EG_RIFT.auto)return;modal(`<div class="mtitle">${run.name} ${r.ok?'完成':'超时'}</div><div class="gp"><div>${run.T?`用时 ${egTime(r.t)} / ${egTime(EG_RIFT.limit)} · 阵亡 ${run.deaths}`:'普通虚隙'}</div>${run.T&&r.ok?`<div class="quest">钥石等级 +${r.up}</div>`:''}<div>${EG_RIFT.key.ic}${EG_RIFT.key.n} +${r.keys}${r.gx?' · 经验 +'+fmt(r.gx):''}</div><div class="grid">${r.ex.map(it=>cell(it,'')).join('')}</div>
 <div class="btns c"><button class="btn" onclick="closeM()">返回</button><button class="btn gold" onclick="closeM();egRiftStart(${run.T?Math.min(EG().rift.max,run.T+(r.ok?1:0)):0})">${run.T?'再来一层':'再开一次'}</button></div></div>`)}
function egRiftUp(){const R0=EG().rift,c=EG_RIFT.upCost,g=c.gold(R0.max);if(R0.keys<c.keys||S.gold<g)return toast('需要 '+c.keys+' 枚钥石与 '+fmt(g)+' 金币');R0.keys-=c.keys;S.gold-=g;R0.max++;log(`钥石熔铸：最高可开启 ${R0.max} 层`);egRefresh()}
let EG_RSEL=null;
function egRiftPage(){const R0=EG().rift;if(EG_RSEL==null||EG_RSEL>R0.max)EG_RSEL=R0.max;const T=EG_RSEL,ml=egRiftMl(T);const rk=egRank();const c=EG_RIFT.upCost;
 return`<div class="gp"><h3>${EG_RIFT.n} <span class="r dim">免费 · 不限时</span></h3><div class="dim">随机章节的怪物，击杀积累进度，满 100% 后${EG_RIFT.guard}现身。击败后必得 ${EG_RIFT.key.ic}${EG_RIFT.key.n}。</div>
  <div class="btns"><button class="btn gold" onclick="egRiftStart(0)" ${EGM?'disabled':''}>开启虚隙</button></div></div>
 <div class="gp"><h3>${EG_RIFT.gn} <span class="r">${EG_RIFT.key.ic}×${R0.keys}</span></h3>
  <div class="row"><span>层数</span><span class="btns" style="margin:0"><button class="btn xs" onclick="EG_RSEL=Math.max(1,EG_RSEL-5);egRefresh()">-5</button><button class="btn xs" onclick="EG_RSEL=Math.max(1,EG_RSEL-1);egRefresh()">-</button><b style="min-width:42px;text-align:center">${T}</b><button class="btn xs" onclick="EG_RSEL=Math.min(EG().rift.max,EG_RSEL+1);egRefresh()">+</button><button class="btn xs" onclick="EG_RSEL=EG().rift.max;egRefresh()">最高</button></span></div>
  <div class="row"><span>怪物等级 / 生命 / 伤害</span><b>${ml} / ×${EG_RIFT.hp(T).toFixed(1)} / ×${EG_RIFT.dmg(T).toFixed(2)}</b></div>
  <div class="row"><span>经验 / 寻宝 / 金币加成</span><b>×${EG_RIFT.xp(T).toFixed(1)} / +${EG_RIFT.mf(T)}% / +${EG_RIFT.gf(T)}%</b></div>
  <div class="row"><span>限时 · 钥石最高层</span><b>${egTime(EG_RIFT.limit)} · ${R0.max}</b></div>
  <div class="dim">剩余时间 >50% 升 3 层，>25% 升 2 层，按时升 1 层；超时仍可打守望者但不升级。阵亡额外扣时（第 n 次 +5n 秒，最多 15 秒）。</div>
  <div class="btns"><button class="btn gold" onclick="egRiftStart(EG_RSEL)" ${R0.keys&&!EGM?'':'disabled'}>开启 ${T} 层</button><button class="btn sm" onclick="egRiftUp()">熔铸钥石 (${c.keys}${EG_RIFT.key.ic}+${fmt(c.gold(R0.max))}◈ → 最高+1层)</button></div>
  <div class="dim">完成 ${R0.ok} 次 · 最高通关 ${R0.best} 层 · 开启 ${R0.runs} 次</div></div>
 <div class="gp"><h3>${EG_RIFT.rank} <span class="r dim">本机记录</span></h3>${rk.length?`<table class="egrank"><tr><th>#</th><th>层数</th><th>用时</th><th>等级</th><th>日期</th><th>纪元</th></tr>${rk.map((r,i)=>`<tr><td>${i+1}</td><td><b>${r.t}</b></td><td>${egTime(r.s)}</td><td>${r.lv}</td><td>${r.d}</td><td>${r.se||'永恒'}</td></tr>`).join('')}</table>`:'<div class="dim">尚无记录</div>'}</div>`}
egPage({k:'rift',n:'虚隙',lock:egRiftLock,render:egRiftPage,intro:'无尽的裂隙连通各章节的残影。深渊虚隙限时 5 分钟，层数无上限。'});
