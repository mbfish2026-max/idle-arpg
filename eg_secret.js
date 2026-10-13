'use strict';
// ===== 6. 隐藏关卡「蘑菇王国」：通关该难度后，坍颓村击败铸匠亡魂掉落「老园丁的枯手杖」；手杖+回城卷轴开启秘径（手杖可重复使用） =====
function egSec(){const e=EG();e.secret=e.secret||{staff:{},runs:0,king:0};return e.secret}
function egSecOk(d=S.diff){return egDone(d,ACTS.length-1)}
egOn('kill',(m,c)=>{if(c.mode||m.key!=='smith')return;const s=egSec();if(s.staff[c.d]||!egSecOk(c.d))return;s.staff[c.d]=1;
 log(`<b style="color:#c8a050">铸匠亡魂身后掉落了 ${EG_SECRET.staff.ic}${EG_SECRET.staff.n}……似乎能打开什么地方</b>`);toast('获得 '+EG_SECRET.staff.n);egRefresh()});
function egSecretStart(){const s=egSec(),d=S.diff;if(!s.staff[d])return toast('缺少 '+EG_SECRET.staff.n);if(S.pot.tp<1)return toast('需要 1 张回城卷轴');S.pot.tp--;s.runs++;
 const ml=mlD(42,d)+2;const run={k:'secret',name:EG_SECRET.n,bg:'bg_act1',w:0,ml,
  spawn(){if(this.won){egLeave(1);toast('蘑菇王国已肃清');return}if(this.w>=EG_SECRET.waves)return;this.w++;const last=this.w===EG_SECRET.waves;
   if(last){const b=mkMon(EG_SECRET.boss,ml+3);b.egKing=1;MON.push(b);log(`<b class="bossn">${b.n}</b>：噗——谁踩了我的菌床！`);for(let i=0;i<2;i++)MON.push(egSecMon(ml,'champ'));return}
   const n=R(6,8);const ch=this.w%4===0;for(let i=0;i<n;i++)MON.push(egSecMon(ml,ch&&i<3?'champ':''));MON=MON.slice(0,8)},
  onKill(m){if(m.egKing){s.king++;egStat('king');log('<b class="quest">菌伞大王倒下了，王冠滚落在地！</b>');for(let i=0;i<2;i++)addBag(egLpApply(genItem(Math.min(99,ml+3),{q:5}),2));addBag(rollRune(ml+6));this.won=1}},
  onDie(){this.deaths=(this.deaths||0)+1;this.w=Math.max(0,this.w-1);if(this.deaths>=5){log('<b style="color:#f84">菌群太过凶猛，你被赶出了蘑菇王国</b>');egLeave(1)}},
  wave(){return`第 ${this.w}/${EG_SECRET.waves} 波`},quest(){return`【${EG_SECRET.n}】肃清菌群，讨伐菌伞大王 (${this.w}/${EG_SECRET.waves})`},
  top(){return`<div class="egline"><span>🍄 秘径</span>${egPbar(this.w,EG_SECRET.waves)}<span>${this.w}/${EG_SECRET.waves}</span></div>`}};
 egEnter(run)}
function egSecMon(ml,fl){const m=mkMon(pick(EG_SECRET.mons),ml,fl);m.exp*=EG_SECRET.xp;return m}
egOn('calc',o=>{if(EGM&&EGM.k==='secret')o.mf+=EG_SECRET.mf});
// 虚隙守望者不抽到彩蛋首领
const _eg_rg=egRiftGuard;egRiftGuard=function(run){const B=BOSSES.shroomking;const a=B.a;B.a=null;try{return _eg_rg(run)}finally{B.a=a}};
function egSecLock(){const s=egSec();return Object.keys(s.staff).length?null:'???　'+EG_SECRET.hint}
function egSecPage(){const s=egSec(),d=S.diff;return`<div class="gp"><h3>🍄 ${EG_SECRET.n} <span class="r dim">隐藏关卡</span></h3>
 <div class="egintro">枯手杖轻点地面，一圈蘑菇破土而出，围成一道小小的门。门后是喧闹的菌之王国——伞菇兵列队巡逻，毒孢菇四处喷雾，菌丝跳跳蹦来蹦去，而菌伞大王·噗噗正躺在王座上打呼。</div>
 <div class="row"><span>${EG_SECRET.staff.ic}${EG_SECRET.staff.n}</span><b>${DIFFS.map((D,i)=>`${D.n}${s.staff[i]?'✔':'✘'}`).join(' ')}</b></div>
 <div class="row"><span>当前难度怪物等级 / 波数</span><b>${mlD(42,d)+2} / ${EG_SECRET.waves}</b></div><div class="row"><span>寻宝加成 / 经验</span><b>+${EG_SECRET.mf}% / ×${EG_SECRET.xp}</b></div>
 <div class="row"><span>进入次数 / 讨伐大王</span><b>${s.runs} / ${s.king}</b></div>
 <div class="dim">消耗 1 张回城卷轴开启（手杖不消耗）。大王必掉 2 件暗金（威能几率翻倍）与高阶符文。各难度需分别找到手杖。</div>
 <div class="btns"><button class="btn gold" ${s.staff[d]&&!EGM?'':'disabled'} onclick="egSecretStart()">开启秘径（📜×1）</button></div></div>`}
egPage({k:'secret',n:'秘径',lock:egSecLock,render:egSecPage});
