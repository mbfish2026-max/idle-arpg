// audio.js — 音频系统（Web Audio 程序化合成，零外部资源）
// 背景音乐：五章各一首 + 城镇 + 首领战，按小节前瞻调度，无缝循环、换曲交叉淡入淡出。
// 音效：普攻 / 技能 / 掉落(按品质，暗金/套装/符文之语特殊) / 升级 / UI 点击。
// 接入方式：沿用项目惯例包装全局函数(fx / rollTC / gainXp / goZone / goAct / townPortal / renderHero)，不改 game.js。
// 设置保存在存档 S.audio 中，随 save() 写入 localStorage。
(function(){
'use strict';
const AC=window.AudioContext||window.webkitAudioContext;
const DEF={mv:0.6,sv:0.8,mm:0,sm:0};
function cfg(){if(typeof S!=='object'||!S)return DEF;if(!S.audio||typeof S.audio!=='object')S.audio=Object.assign({},DEF);for(const k in DEF)if(S.audio[k]==null)S.audio[k]=DEF[k];return S.audio}
let ctx=null,master,musBus,sfxBus,rev,noiseBuf,unlocked=false,hidden=false;
const mtof=n=>440*Math.pow(2,(n-69)/12);

function init(){if(ctx||!AC)return;try{ctx=new AC()}catch(e){return}
 master=ctx.createDynamicsCompressor();master.threshold.value=-14;master.ratio.value=4;master.connect(ctx.destination);
 musBus=ctx.createGain();sfxBus=ctx.createGain();musBus.connect(master);sfxBus.connect(master);
 // 简易混响：衰减噪声脉冲
 rev=ctx.createConvolver();const len=ctx.sampleRate*2.6,ir=ctx.createBuffer(2,len,ctx.sampleRate);
 for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6)}
 rev.buffer=ir;const rg=ctx.createGain();rg.gain.value=0.45;rev.connect(rg);rg.connect(master);
 noiseBuf=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);const nd=noiseBuf.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;
 applyVol()}
function applyVol(){if(!ctx)return;const c=cfg(),t=ctx.currentTime;
 musBus.gain.setTargetAtTime(c.mm?0:c.mv*0.5,t,0.08);sfxBus.gain.setTargetAtTime(c.sm?0:c.sv*0.7,t,0.03)}

// ---------- 合成原语 ----------
function env(g,t,a,peak,d,sus,r,end){g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(Math.max(0.0001,peak*sus),t+a+d);g.gain.setValueAtTime(Math.max(0.0001,peak*sus),end);g.gain.exponentialRampToValueAtTime(0.0001,end+r)}
function tone(dest,{f,t,dur,type='sine',vol=0.2,a=0.01,d=0.1,sus=0.6,r=0.2,det=0,cut=0,q=1,glide=0,wet=0}){
 const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(glide)o.frequency.exponentialRampToValueAtTime(Math.max(20,glide),t+dur);o.detune.value=det;
 let n=o;if(cut){const fl=ctx.createBiquadFilter();fl.type='lowpass';fl.frequency.value=cut;fl.Q.value=q;o.connect(fl);n=fl}
 n.connect(g);g.connect(dest);if(wet){const w=ctx.createGain();w.gain.value=wet;g.connect(w);w.connect(rev)}
 env(g,t,a,vol,d,sus,r,t+dur);o.start(t);o.stop(t+dur+r+0.05)}
function noise(dest,{t,dur,vol=0.2,type='bandpass',f=1000,f2=0,q=1,a=0.002,wet=0}){
 const s=ctx.createBufferSource(),fl=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=noiseBuf;s.loop=true;fl.type=type;fl.frequency.setValueAtTime(f,t);if(f2)fl.frequency.exponentialRampToValueAtTime(f2,t+dur);fl.Q.value=q;
 s.connect(fl);fl.connect(g);g.connect(dest);if(wet){const w=ctx.createGain();w.gain.value=wet;g.connect(w);w.connect(rev)}
 g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(vol,t+a);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);s.start(t);s.stop(t+dur+0.05)}

// ---------- 曲目定义（全部原创） ----------
// root: MIDI 根音；sc: 音阶；prog: 每小节和弦根(音阶级数)；arp: 琶音型(音阶级数, null=休止)；
// bpm、perc(打击强度)、bell(钟声)、choir(人声 pad)、lead(旋律句)
const PHRY=[0,1,3,5,7,8,10],AEOL=[0,2,3,5,7,8,10],HARM=[0,2,3,5,7,8,11],DORI=[0,2,3,5,7,9,10],LOCR=[0,1,3,5,6,8,10];
const TRACKS={
 town:{root:50,sc:DORI,bpm:66,prog:[0,5,3,4],arp:[0,2,4,2,7,4,2,4],perc:0,bell:0,choir:0.6,lead:[4,null,3,2,null,0,null,null,2,null,3,4,null,2,null,null],ldiv:2,lt:'triangle',pad:0.06},
 a0:{root:45,sc:AEOL,bpm:72,prog:[0,0,5,4],arp:[0,4,7,4,2,4,7,9],perc:0.4,bell:0.5,choir:0.5,lead:[7,null,6,4,null,null,5,null,4,null,2,null,0,null,null,null],ldiv:2,lt:'triangle',pad:0.07},
 a1:{root:47,sc:PHRY,bpm:84,prog:[0,1,0,6],arp:[0,1,4,1,0,4,1,3],perc:0.6,bell:0,choir:0.3,lead:[4,3,1,0,null,1,null,4,5,4,3,1,0,null,null,null],ldiv:4,lt:'sawtooth',pad:0.06},
 a2:{root:43,sc:AEOL,bpm:78,prog:[0,6,5,6],arp:[0,2,4,6,4,2,0,2],perc:0.7,bell:0.2,choir:0.4,lead:[0,null,2,null,4,null,3,2,0,null,null,6,0,null,null,null],ldiv:2,lt:'square',pad:0.05},
 a3:{root:40,sc:LOCR,bpm:60,prog:[0,1,4,0],arp:[0,4,7,null,4,1,null,4],perc:0.3,bell:0.6,choir:0.8,lead:[7,null,null,8,7,null,4,null,null,null,1,null,0,null,null,null],ldiv:2,lt:'sine',pad:0.08},
 a4:{root:42,sc:HARM,bpm:70,prog:[0,3,6,4],arp:[0,2,4,7,9,7,4,2],perc:0.5,bell:0.7,choir:0.6,lead:[4,null,6,7,null,6,4,null,3,null,2,null,1,null,null,null],ldiv:2,lt:'triangle',pad:0.07},
 boss:{root:38,sc:HARM,bpm:132,prog:[0,0,1,6],arp:[0,7,0,6,0,4,0,3],perc:1,bell:0.3,choir:0.7,lead:[7,null,6,7,8,null,7,null,4,null,6,null,7,null,null,null],ldiv:4,lt:'sawtooth',pad:0.06}
};
function deg(T,i,oct=0){const L=T.sc.length,o=Math.floor(i/L),k=((i%L)+L)%L;return T.root+T.sc[k]+12*(o+oct)}

let cur=null,want=null,nextBar=0,bar=0,trackGain=null,timer=null;
function playBar(T,t,b,dest){const beat=60/T.bpm,bl=beat*4,ch=T.prog[b%T.prog.length];
 // 低音 drone + 和弦 pad
 tone(dest,{f:mtof(deg(T,ch,-1)),t,dur:bl,type:'sawtooth',vol:0.09,a:0.4,d:0.4,sus:0.8,r:0.6,cut:260,q:2});
 for(const iv of[0,2,4])for(const dt of[-7,7])tone(dest,{f:mtof(deg(T,ch+iv,0)),t,dur:bl,type:'sawtooth',vol:T.pad/2,a:bl*0.3,d:0.5,sus:0.8,r:1.2,det:dt,cut:900,wet:0.5});
 if(T.choir)for(const iv of[0,4])tone(dest,{f:mtof(deg(T,ch+iv,1)),t,dur:bl,type:'triangle',vol:0.03*T.choir,a:bl*0.4,d:0.3,sus:0.9,r:1.5,det:(b%2?5:-5),wet:0.9});
 // 琶音（八分音符）
 const st=bl/T.arp.length;T.arp.forEach((x,i)=>{if(x==null)return;tone(dest,{f:mtof(deg(T,ch+x,1)),t:t+i*st,dur:st*0.9,type:'triangle',vol:0.045,a:0.005,d:st*0.6,sus:0.2,r:0.25,cut:2400,wet:0.35})});
 // 旋律：每两小节一句
 const half=T.lead.length/2,base=(b%2)*half,lst=bl/half;for(let i=0;i<half;i++){const x=T.lead[base+i];if(x==null)continue;let len=1;while(i+len<half&&T.lead[base+i+len]==null&&len<4)len++;
  if(b%8>=2)tone(dest,{f:mtof(deg(T,x,1)),t:t+i*lst,dur:lst*len*0.95,type:T.lt,vol:0.05,a:0.03,d:0.2,sus:0.6,r:0.4,cut:T.lt==='sawtooth'?1600:3000,wet:0.6})}
 // 钟
 if(T.bell&&b%4===0)for(const m of[1,2.76,5.4])tone(dest,{f:mtof(deg(T,ch,1))*m,t,dur:2.5,type:'sine',vol:0.05*T.bell/m,a:0.002,d:2.4,sus:0.01,r:0.5,wet:0.8});
 // 打击：战鼓 + 碎拍
 if(T.perc){for(let i=0;i<4;i++){const tt=t+i*beat;if(i===0||i===2||(T.perc>0.8))tone(dest,{f:110,glide:38,t:tt,dur:0.35,type:'sine',vol:0.25*T.perc,a:0.002,d:0.3,sus:0.01,r:0.1});
  if(T.perc>0.5&&(i===1||i===3))noise(dest,{t:tt,dur:0.18,vol:0.05*T.perc,f:1800,q:0.8,wet:0.3});
  if(T.perc>0.9)noise(dest,{t:tt+beat/2,dur:0.05,vol:0.03,type:'highpass',f:6000})}}}
function sched(){if(!ctx||!cur||ctx.state!=='running')return;const T=TRACKS[cur];while(nextBar<ctx.currentTime+1.2){playBar(T,nextBar,bar,trackGain);nextBar+=240/T.bpm;bar++}}
function switchTo(k){if(!ctx||!TRACKS[k]||k===cur)return;const t=ctx.currentTime;
 if(trackGain){const old=trackGain;old.gain.cancelScheduledValues(t);old.gain.setValueAtTime(old.gain.value,t);old.gain.linearRampToValueAtTime(0.0001,t+2);setTimeout(()=>{try{old.disconnect()}catch(e){}},6000)}
 trackGain=ctx.createGain();trackGain.gain.setValueAtTime(0.0001,t);trackGain.gain.linearRampToValueAtTime(1,t+2);trackGain.connect(musBus);
 cur=k;bar=0;nextBar=t+0.05;sched()}

// ---------- 场景判定：章节 / 城镇 / 首领战 ----------
let townUntil=0;
function scene(){try{if(typeof MON!=='undefined'&&MON.some(m=>m.boss&&m.hp>0))return'boss';
 if(Date.now()<townUntil||(typeof TAB!=='undefined'&&TAB==='shop'))return'town';
 const a=typeof S==='object'&&S?S.act|0:0;return'a'+Math.max(0,Math.min(4,a))}catch(e){return'a0'}}
function tick(){if(!ctx||hidden)return;const s=scene();if(s!==cur)switchTo(s);sched()}

// ---------- 音效 ----------
function sfx(name,arg){if(!ctx||!unlocked||hidden||ctx.state!=='running'||cfg().sm)return;const t=ctx.currentTime,D=sfxBus;
 switch(name){
 case'attack':noise(D,{t,dur:0.12,vol:0.25,f:3000,f2:600,q:1.5});tone(D,{f:180,glide:70,t,dur:0.08,type:'square',vol:0.06,a:0.002,d:0.06,sus:0.1,r:0.05,cut:1200});break;
 case'skill':{const k=arg||'';const fq={teeth:900,spear:700,spirit:520,nova:300,boom:160,cloud:240,summon:220,stab:800,shield:440}[k]||480;
  if(k==='boom'||k==='nova')noise(D,{t,dur:0.6,vol:0.3,type:'lowpass',f:2000,f2:120,q:0.7,wet:0.4});
  if(k==='summon'){for(const m of[1,1.5,1.89])tone(D,{f:fq*m,t,dur:0.5,type:'sawtooth',vol:0.05,a:0.08,d:0.3,sus:0.5,r:0.3,cut:900,wet:0.7})}
  else tone(D,{f:fq*2,glide:fq,t,dur:0.22,type:'triangle',vol:0.12,a:0.005,d:0.15,sus:0.3,r:0.15,wet:0.4});
  noise(D,{t,dur:0.25,vol:0.08,f:fq*3,f2:fq,q:4,wet:0.3});break}
 case'drop':{const it=arg||{};const q=it.rw!=null?8:(it.q|0);
  if(it.k==='rune'){[0,7,12].forEach((s,i)=>tone(D,{f:mtof(76+s),t:t+i*0.07,dur:0.4,type:'sine',vol:0.12,a:0.002,d:0.35,sus:0.1,r:0.4,wet:0.6}));break}
  if(q===5||q===8){ // 暗金/符文之语：低沉轰鸣 + 金属钟群 + 上行闪光，辨识度最高
   tone(D,{f:55,glide:41,t,dur:1.2,type:'sawtooth',vol:0.18,a:0.01,d:1,sus:0.3,r:0.6,cut:300});
   noise(D,{t,dur:1.4,vol:0.12,type:'lowpass',f:800,f2:80,wet:0.6});
   [0,4,7,11,12,16,19,24].forEach((s,i)=>{const tt=t+0.15+i*0.08;for(const m of[1,2.76])tone(D,{f:mtof(67+s)*m,t:tt,dur:1.2,type:'sine',vol:0.09/m,a:0.002,d:1.1,sus:0.05,r:0.8,wet:0.9})});
   noise(D,{t:t+0.15,dur:1.5,vol:0.05,type:'highpass',f:7000,wet:0.8});break}
  if(q===6){[0,7,12,19].forEach((s,i)=>tone(D,{f:mtof(72+s),t:t+i*0.09,dur:0.8,type:'triangle',vol:0.1,a:0.003,d:0.7,sus:0.1,r:0.6,wet:0.8}));break}
  if(q===4||q===7){[0,4,7].forEach((s,i)=>tone(D,{f:mtof(74+s),t:t+i*0.06,dur:0.4,type:'triangle',vol:0.08,a:0.003,d:0.35,sus:0.1,r:0.3,wet:0.5}));break}
  if(q===3){tone(D,{f:mtof(79),t,dur:0.3,type:'sine',vol:0.08,a:0.003,d:0.25,sus:0.1,r:0.3,wet:0.5});break}
  if(it.k==='gem'||it.k==='jewel'){tone(D,{f:mtof(84),t,dur:0.3,type:'sine',vol:0.07,a:0.002,d:0.3,sus:0.1,r:0.3,wet:0.5});break}
  noise(D,{t,dur:0.07,vol:0.06,f:1500,q:2});break}
 case'gold':for(let i=0;i<3;i++)tone(D,{f:2400+Math.random()*800,t:t+i*0.03,dur:0.06,type:'square',vol:0.02,a:0.001,d:0.05,sus:0.1,r:0.05,cut:5000});break;
 case'level':[0,4,7,12,16].forEach((s,i)=>tone(D,{f:mtof(60+s),t:t+i*0.1,dur:0.9,type:'triangle',vol:0.1,a:0.005,d:0.5,sus:0.4,r:0.6,wet:0.7}));
  tone(D,{f:mtof(48),t,dur:1.4,type:'sawtooth',vol:0.06,a:0.2,d:0.5,sus:0.6,r:0.8,cut:700,wet:0.6});break;
 case'click':tone(D,{f:1100,glide:700,t,dur:0.04,type:'square',vol:0.04,a:0.001,d:0.03,sus:0.1,r:0.02,cut:3000});break}}
// 节流：避免挂机加速时音效刷屏
const last={};function sfxT(n,a,gap){const now=performance.now();if(now-(last[n]||0)<gap)return;last[n]=now;sfx(n,a)}

// ---------- 解锁 & 前后台 ----------
function unlock(){init();if(!ctx)return;if(ctx.state==='suspended'&&!hidden)ctx.resume();
 if(!unlocked){unlocked=true;// iOS：播放一个静音 buffer 才真正解锁
  const b=ctx.createBufferSource();b.buffer=ctx.createBuffer(1,1,22050);b.connect(ctx.destination);b.start(0);
  if(!timer)timer=setInterval(tick,250);tick()}}
['pointerdown','touchstart','touchend','mousedown','keydown','click'].forEach(e=>document.addEventListener(e,unlock,{capture:true,passive:true}));
document.addEventListener('click',e=>{const b=e.target&&e.target.closest&&e.target.closest('button,.cell,.zc,.tn,#tabs button');if(b)sfxT('click',null,40)},true);
document.addEventListener('visibilitychange',()=>{hidden=document.hidden;if(!ctx)return;
 if(hidden){ctx.suspend()}else if(unlocked){ctx.resume().then(()=>{nextBar=Math.max(nextBar,ctx.currentTime+0.05);tick()})}});

// ---------- 事件钩子（包装全局函数，与 loot.js 等同一惯例） ----------
function wrap(name,after,before){const f=window[name];if(typeof f!=='function')return;window[name]=function(){if(before)try{before.apply(this,arguments)}catch(e){}const r=f.apply(this,arguments);try{after&&after.call(this,r,arguments)}catch(e){}return r}}
if(typeof fx==='function')wrap('fx',null,function(kind){if(typeof TAB!=='undefined'&&TAB!=='fight')return;if(kind==='slash')sfxT('attack',null,90);else sfxT('skill',kind,110)});
// rollTC 返回本次击杀掉落的装备列表（gold 已直接加到 S.gold）
let goldPrev=null;
wrap('rollTC',function(drops){let best=null,rank=-1;const rk=it=>it.rw!=null?9:it.q===5?8:it.q===6?7:it.k==='rune'?6:it.q===4||it.q===7?5:it.q===3?3:it.k?2:1;
 for(const it of drops||[]){const r=rk(it);if(r>rank){rank=r;best=it}}
 if(best)sfxT(rank>=7?'drop_hi':'drop_'+rank,best,rank>=7?0:120)},null);
// sfxT 名称前缀映射到 drop
const _sfx=sfx;sfx=function(n,a){if(n.startsWith('drop'))return _sfx('drop',a);return _sfx(n,a)};
let lvPrev=null;
wrap('gainXp',function(){if(lvPrev!=null&&S.lvl>lvPrev)sfxT('level',null,300)},function(){lvPrev=S.lvl});
wrap('goAct',function(){townUntil=Date.now()+30000;tick()});
wrap('townPortal',function(){townUntil=Date.now()+20000;tick()});
wrap('goZone',function(){townUntil=0;tick()});

// ---------- 设置界面：角色页「设置」下追加音频面板 ----------
function panel(){const c=cfg(),pct=v=>Math.round(v*100);
 return`<div class="gp" id="audioSet"><h3>声音</h3>
 <div class="row"><span>音乐 <b id="au_mvT">${pct(c.mv)}</b></span><span><input type="range" min="0" max="100" value="${pct(c.mv)}" oninput="AUDIO.set('mv',this.value/100)" style="width:46vw;max-width:220px"> <button class="btn xs ${c.mm?'':'on'}" onclick="AUDIO.toggle('mm');render()">${c.mm?'已静音':'开'}</button></span></div>
 <div class="row"><span>音效 <b id="au_svT">${pct(c.sv)}</b></span><span><input type="range" min="0" max="100" value="${pct(c.sv)}" oninput="AUDIO.set('sv',this.value/100)" style="width:46vw;max-width:220px"> <button class="btn xs ${c.sm?'':'on'}" onclick="AUDIO.toggle('sm');render()">${c.sm?'已静音':'开'}</button></span></div></div>`}
if(typeof renderHero==='function'){const _rh=renderHero;renderHero=function(){const r=_rh.apply(this,arguments);try{const P=document.getElementById('panel');if(P&&!document.getElementById('audioSet')){const h=[...P.querySelectorAll('.gp h3')].find(e=>e.textContent.trim().startsWith('设置'));const box=h?h.parentElement:null;
 if(box)box.insertAdjacentHTML('afterend',panel());else P.insertAdjacentHTML('beforeend',panel())}}catch(e){}return r}}

let saveT=0;
window.AUDIO={
 set(k,v){const c=cfg();c[k]=Math.max(0,Math.min(1,+v||0));const e=document.getElementById('au_'+k+'T');if(e)e.textContent=Math.round(c[k]*100);applyVol();
  clearTimeout(saveT);saveT=setTimeout(()=>{try{save()}catch(e){}},400);if(k==='sv')sfxT('click',null,80)},
 toggle(k){const c=cfg();c[k]=c[k]?0:1;applyVol();try{save()}catch(e){}},
 play:(n,a)=>sfx(n,a), music:k=>switchTo(k), tracks:Object.keys(TRACKS), get scene(){return cur}
};
})();
