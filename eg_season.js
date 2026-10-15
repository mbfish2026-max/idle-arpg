'use strict';
// ===== 5. 纪元（赛季）：新建纪元角色（依赖多角色存档 newChar），纪元旅程四章，主题加成；纪元结束/手动转入永恒 =====
function egSeasonOn(){const s=EG().season;return !!(s&&s.id===EG_SEASON.id&&!s.eternal)}
function egSeasonEnd(s){return s.start+EG_SEASON.days*86400e3}
egOn('calc',o=>{if(egSeasonOn())o.mf+=EG_SEASON.buff.mf});
egOn('xp',x=>egSeasonOn()?x*(1+EG_SEASON.buff.xp/100):x);
function egGoal(g){const[t,v]=g,e=EG(),st=e.stat;switch(t){
 case'lvl':return[S.lvl,v];case'act':return[egDone(v[0],v[1])?1:0,1];case'kills':return[st.kills||0,v];case'bounty':return[st.bounty||0,v];
 case'rift':return[st.rift||0,v];case'lpx':return[Object.keys(e.lp.arch).length,v];case'tier':return[e.rift.best||0,v];case'para':return[e.para.lv,v]}return[0,1]}
function egGoalOk(g){const[a,b]=egGoal(g);return a>=b}
function egJourneyTick(){if(!egSeasonOn())return;const s=EG().season;s.jc=s.jc||{};
 EG_SEASON.journey.forEach((c,i)=>{if(s.jc[i])return;if(i>0&&!s.jc[i-1])return;if(c.goals.every(egGoalOk)){s.jc[i]=1;const r=c.rw,e=EG();S.gold+=r.gold||0;e.rift.keys+=r.keys||0;e.bounty.caches+=r.cache||0;e.bounty.wcaches+=r.wcache||0;if(r.title){e.ach._t=e.ach._t||{};e.ach._t[r.title]=1}
  log(`<b class="quest">纪元旅程「${c.n}」完成！奖励：${c.rwT}</b>`);toast('旅程完成：'+c.n);egRefresh()}})}
egOn('sec',()=>{const t=(EG_secN=(EG_secN||0)+1);if(t%5===0)egJourneyTick();const s=EG().season;if(s&&!s.eternal&&Date.now()>egSeasonEnd(s)){s.eternal=1;log('<b class="quest">纪元已结束，角色转入永恒领域</b>')}});
let EG_secN=0;
// 纪元角色初始化：任何途径以 mode='season' 新建角色（纪元页按钮 / 新建角色弹窗的「纪元」模式）都会写入纪元数据
function egSeasonInit(){const e=EG();e.season={id:EG_SEASON.id,n:EG_SEASON.n,start:Date.now(),jc:{}};e.stat={};calc();if(typeof save==='function')save();log(`<b class="quest">${EG_SEASON.n} 开启！纪元角色 ${S.name||''} 踏上旅程</b>`)}
if(typeof newChar==='function'){const f=newChar;newChar=function(name,cls,mode){const id=f.apply(this,arguments);if(id&&mode==='season'&&S&&S.mode==='season'&&!(EG().season&&EG().season.id===EG_SEASON.id))egSeasonInit();return id}}
let EG_SCLS=null,EG_SNAME='';// 纪元页选中的职业/填写的名字（重绘时保留）
const egOpenCls=()=>(typeof CLASSES!=='undefined'?CLASSES.filter(c=>c.open):[{id:'nec',n:'亡灵术士'}]);
function egNewSeasonChar(){if(typeof newChar!=='function')return toast('多角色存档未就绪，暂不能新建纪元角色');
 const cs=egOpenCls(),cid=(document.getElementById('egscls')||{}).value||EG_SCLS||(typeof curCls==='function'?curCls():'nec'),C=cs.find(c=>c.id===cid)||cs[0];
 const nm=(document.getElementById('egsname')||{}).value||EG_SNAME||'';const id=newChar((nm||'纪元'+C.n).slice(0,12),C.id,'season');if(!id)return;EG_SCLS=null;EG_SNAME='';
 const e=EG();if(!(e.season&&e.season.id===EG_SEASON.id))egSeasonInit();
 TAB='eg';EGT='season';render()}
function egToEternal(){const s=EG().season;if(!s)return;if(!window.__NOUI&&!confirm('转入永恒后不再享受纪元加成，旅程停止。确定？'))return;s.eternal=1;calc();egRefresh()}
function egSeasonPage(){const s=EG().season,on=egSeasonOn();
 const head=`<div class="gp"><h3>${EG_SEASON.n} <span class="r dim">${on?'纪元角色':s&&s.eternal?'已转入永恒':'永恒角色'}</span></h3><div class="dim">${EG_SEASON.buffT}</div>
 ${on?`<div class="row"><span>纪元剩余</span><b>${Math.max(0,Math.ceil((egSeasonEnd(s)-Date.now())/86400e3))} 天</b></div><div class="btns"><button class="btn sm" onclick="egToEternal()">提前转入永恒</button></div>`:
 `<div class="dim" style="margin-top:6px">纪元角色从 1 级开始（共享仓库仍可使用），完成纪元旅程获得专属奖励与称号。当前角色不受影响。</div><div class="newch" style="display:flex;gap:6px;margin-top:6px"><select id="egscls" onchange="EG_SCLS=this.value" style="background:#120c08;color:#e6d6b0;border:1px solid #6b5230;padding:4px">${egOpenCls().map(c=>`<option value="${c.id}" ${c.id===(EG_SCLS||(typeof curCls==='function'?curCls():'nec'))?'selected':''}>${c.n}</option>`).join('')}</select><input id="egsname" maxlength="12" placeholder="纪元角色名" value="${EG_SNAME.replace(/["<>&]/g,'')}" oninput="EG_SNAME=this.value" style="flex:1;min-width:0;background:#120c08;color:#e6d6b0;border:1px solid #6b5230;padding:4px"><button class="btn sm gold" onclick="egNewSeasonChar()">新建纪元角色</button></div>`}</div>`;
 const jc=(s&&s.jc)||{};
 const J=EG_SEASON.journey.map((c,i)=>{const open=on&&(i===0||jc[i-1]);return`<div class="gp"><h3>旅程 ${i+1} ·「${c.n}」 <span class="r ${jc[i]?'g':'dim'}">${jc[i]?'✔ 已完成':open?'进行中':'🔒'}</span></h3>
  ${c.goals.map(g=>{const[a,b]=egGoal(g),ok=a>=b;return`<div class="egpt"><span class="${ok&&on?'g':''}">${ok&&on?'✔':'○'} ${g[2]}</span><span class="dim">${on?Math.min(a,b)+'/'+b:''}</span></div>`}).join('')}<div class="egrw">奖励：${c.rwT}</div></div>`}).join('');
 return head+J}
egPage({k:'season',n:'纪元',render:egSeasonPage});
