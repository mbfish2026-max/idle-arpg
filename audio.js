// audio.js — 音频系统（Web Audio 程序化合成，零外部资源）
// 背景音乐：五章各一首 + 城镇 + 首领战，按小节前瞻调度，无缝循环、换曲交叉淡入淡出。
// 音效：普攻 / 技能 / 掉落(按品质，暗金/套装/符文之语特殊) / 升级 / UI 点击。
// 接入方式：沿用项目惯例包装全局函数(fx / rollTC / gainXp / goZone / goAct / townPortal / renderHero)，不改 game.js。
// 设置保存在存档 S.audio 中，随 save() 写入云端存档（cloud.js）。
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
// ================= 技能 / 战斗音效（按技能 id 建表） =================
// 限流：① 每类最小间隔 GAP；② 全局同时发声上限 VOICE_MAX（按每个音效预计时长计数，超出则丢弃低优先级）；
//       ③ 同类同时发声上限 CAT_MAX；④ 召唤物/佣兵/命中类额外随机稀疏，避免满屏召唤物时成噪音。
const VOICE_MAX=8,CAT_MAX={hit:2,ally:2,merc:1,crit:1,block:1,skill:3,attack:1};
const GAP={skill:70,attack:90,hit:110,crit:160,block:200,ally:140,merc:180};
const PRIO={skill:3,crit:3,block:2,attack:2,merc:1,ally:1,hit:0};
const VOICES=[];// {end,cat}
function vClean(){const now=ctx.currentTime;for(let i=VOICES.length-1;i>=0;i--)if(VOICES[i].end<now)VOICES.splice(i,1)}
const lastC={};
function voice(cat,key,dur,fn){if(!ctx||!unlocked||hidden||ctx.state!=='running'||cfg().sm)return;if(typeof TAB!=='undefined'&&TAB!=='fight')return;
 const now=performance.now(),k=cat+':'+key;if(now-(lastC[k]||0)<(GAP[cat]||80))return;
 vClean();if(VOICES.filter(v=>v.cat===cat).length>=(CAT_MAX[cat]||2))return;
 if(VOICES.length>=VOICE_MAX){// 满载：只有高优先级可挤掉最旧的低优先级计数（已发声的不截断，只是占位让出）
  const p=PRIO[cat]||0,i=VOICES.findIndex(v=>(PRIO[v.cat]||0)<p);if(i<0)return;VOICES.splice(i,1)}
 lastC[k]=now;VOICES.push({end:ctx.currentTime+dur,cat});try{fn(ctx.currentTime,sfxBus)}catch(e){}}

// --- 音色原语（风格化） ---
const P={
 crack(D,t,v=1,f=2600){for(let i=0;i<3;i++)noise(D,{t:t+i*0.018,dur:0.05,vol:0.16*v,f:f*(1-i*0.15),q:6});tone(D,{f:320,glide:120,t,dur:0.06,type:'square',vol:0.05*v,a:0.001,d:0.05,sus:0.1,r:0.03,cut:1500})},
 rattle(D,t,v=1){for(let i=0;i<6;i++)noise(D,{t:t+i*0.03+Math.random()*0.01,dur:0.03,vol:0.07*v,f:1800+Math.random()*1500,q:8})},
 whoosh(D,t,v=1,f=600,f2=2400,dur=0.3){noise(D,{t,dur,vol:0.12*v,f,f2,q:1.2,a:dur*0.4})},
 hiss(D,t,v=1,dur=0.6){noise(D,{t,dur,vol:0.09*v,type:'highpass',f:2500,f2:5000,a:0.08,wet:0.3});noise(D,{t,dur:dur*0.8,vol:0.08*v,f:500,f2:250,q:3})},
 bubble(D,t,v=1,n=4){for(let i=0;i<n;i++){const f=300+Math.random()*400;tone(D,{f,glide:f*2.2,t:t+i*0.06,dur:0.07,type:'sine',vol:0.08*v,a:0.003,d:0.06,sus:0.2,r:0.04})}},
 fire(D,t,v=1,dur=0.5){noise(D,{t,dur,vol:0.16*v,type:'lowpass',f:3000,f2:400,q:0.8,a:0.03,wet:0.2});noise(D,{t,dur:dur*0.7,vol:0.06*v,f:900,q:2,a:0.05})},
 boom(D,t,v=1){tone(D,{f:90,glide:30,t,dur:0.6,type:'sine',vol:0.35*v,a:0.003,d:0.5,sus:0.05,r:0.2});noise(D,{t,dur:0.8,vol:0.22*v,type:'lowpass',f:1800,f2:100,a:0.003,wet:0.5})},
 ice(D,t,v=1){[0,7,12,19].forEach((s,i)=>tone(D,{f:mtof(88+s),t:t+i*0.025,dur:0.25,type:'sine',vol:0.05*v,a:0.001,d:0.22,sus:0.05,r:0.3,wet:0.7}));noise(D,{t,dur:0.3,vol:0.07*v,type:'highpass',f:6000,a:0.002})},
 zap(D,t,v=1,n=3){for(let i=0;i<n;i++){const tt=t+i*0.045;tone(D,{f:1200+Math.random()*1800,glide:200,t:tt,dur:0.05,type:'sawtooth',vol:0.06*v,a:0.001,d:0.04,sus:0.2,r:0.02});noise(D,{t:tt,dur:0.04,vol:0.1*v,type:'highpass',f:4000})}},
 dark(D,t,v=1,root=41,iv=[0,1,6]){for(const s of iv)tone(D,{f:mtof(root+s),t,dur:0.7,type:'sawtooth',vol:0.045*v,a:0.08,d:0.3,sus:0.5,r:0.5,cut:900,det:(s*3)%11,wet:0.8});noise(D,{t,dur:0.6,vol:0.04*v,f:300,f2:1200,q:6,a:0.2,wet:0.6})},
 rise(D,t,v=1,f=200,f2=800,type='triangle',dur=0.4){tone(D,{f,glide:f2,t,dur,type,vol:0.08*v,a:0.02,d:0.2,sus:0.5,r:0.2,wet:0.6})},
 thud(D,t,v=1,f=140){tone(D,{f,glide:f*0.35,t,dur:0.18,type:'sine',vol:0.28*v,a:0.002,d:0.15,sus:0.05,r:0.06});noise(D,{t,dur:0.08,vol:0.1*v,type:'lowpass',f:900})},
 clang(D,t,v=1,f=900){for(const m of[1,1.47,2.09,2.76])tone(D,{f:f*m,t,dur:0.3,type:'square',vol:0.025*v/m,a:0.001,d:0.25,sus:0.05,r:0.2,cut:5000,wet:0.4});noise(D,{t,dur:0.04,vol:0.12*v,f:3500,q:2})},
 roar(D,t,v=1,f=110,dur=0.7){for(const d of[-12,0,9])tone(D,{f,glide:f*0.8,t,dur,type:'sawtooth',vol:0.07*v,a:0.05,d:0.2,sus:0.7,r:0.25,cut:1100,q:4,det:d,wet:0.4});noise(D,{t,dur,vol:0.06*v,f:700,q:2,a:0.05})},
 slash(D,t,v=1,f=3000){noise(D,{t,dur:0.12,vol:0.22*v,f,f2:f/5,q:1.5})}
};
const mid=m=>mtof(m);
// --- 技能 id → 音效。每个 id 一个独立配方 ---
const SK={
 // 召唤系
 rs:(D,t)=>{P.rattle(D,t,1.2);P.rise(D,t,1,110,220,'sawtooth',0.5)},                     // 唤起骨仆：骨头拼合咔嗒+低升
 rm:(D,t)=>{P.rattle(D,t);[0,3,7].forEach((s,i)=>tone(D,{f:mid(64+s),t:t+i*0.07,dur:0.5,type:'triangle',vol:0.06,a:0.01,d:0.3,sus:0.3,r:0.4,wet:0.8}))}, // 骨巫：骨响+幽暗和弦
 cg:(D,t)=>{P.thud(D,t,1.2,90);noise(D,{t:t+0.05,dur:0.5,vol:0.12,type:'lowpass',f:500,f2:150,a:0.05})}, // 泥偶：泥土翻涌
 bg:(D,t)=>{P.thud(D,t,1,100);P.bubble(D,t+0.05,1.2,5)},                                   // 血肉：心跳+血泡
 ig:(D,t)=>{P.thud(D,t,1,80);P.clang(D,t+0.05,1.2,520)},                                   // 钢骸：金属铿锵
 fg:(D,t)=>{P.thud(D,t,1,80);P.fire(D,t+0.03,1.3,0.8)},                                    // 焚火：烈焰轰起
 rv:(D,t)=>{P.dark(D,t,1.2,45,[0,7,13]);P.rise(D,t+0.1,1,90,260,'sawtooth',0.7)},          // 亡者复生：圣咏般不协和上升
 // 骨系
 te:(D,t)=>{for(let i=0;i<4;i++)P.crack(D,t+i*0.035,0.5,3200+i*300)},                      // 噬骨齿：连串碎齿
 ba:(D,t)=>{P.rattle(D,t,0.8);tone(D,{f:mid(55),t,dur:0.6,type:'triangle',vol:0.08,a:0.05,d:0.3,sus:0.6,r:0.4,wet:0.7})}, // 骨铠：骨片环绕
 bw:(D,t)=>{for(let i=0;i<3;i++){P.thud(D,t+i*0.08,0.6,120);P.crack(D,t+i*0.08,0.6,1500)}}, // 骨墙：层层砸起
 bs:(D,t)=>{P.whoosh(D,t,1,1200,300,0.22);P.crack(D,t+0.02,1,2200)},                       // 骨矛：破空+骨裂
 bp:(D,t)=>{for(let i=0;i<5;i++)P.crack(D,t+i*0.05,0.6,1600+i*200);P.thud(D,t+0.25,0.6,150)}, // 骨牢：骨栅合拢
 bx:(D,t)=>{P.rise(D,t,1,mid(76),mid(64),'sine',0.5);noise(D,{t,dur:0.5,vol:0.07,f:1500,f2:600,q:5,wet:0.8})}, // 骨魂：幽灵呼啸
 // 毒系 / 尸体
 pd:(D,t)=>{P.slash(D,t,0.8,4000);P.bubble(D,t+0.03,0.7,2)},                               // 毒蚀刃
 ce:(D,t)=>{P.boom(D,t,1);P.bubble(D,t+0.05,0.8,3)},                                       // 尸爆：血肉爆裂
 pe:(D,t)=>{P.thud(D,t,0.8,120);P.hiss(D,t+0.03,1.2,0.7);P.bubble(D,t,1,4)},              // 毒爆：闷爆+毒雾
 pn:(D,t)=>{P.hiss(D,t,1.4,1);noise(D,{t,dur:0.9,vol:0.1,f:200,f2:1600,q:2,a:0.15,wet:0.5})}, // 毒新星：毒雾环扩
 // 诅咒（共用暗黑和弦底色，音程/音色各异）
 ad:(D,t)=>{P.dark(D,t,1,43,[0,1]);P.crack(D,t+0.1,0.5,1200)},
 dv:(D,t)=>{P.dark(D,t,1,47,[0,6]);noise(D,{t,dur:0.6,vol:0.06,type:'lowpass',f:600,f2:200,a:0.2})},
 wk:(D,t)=>{P.dark(D,t,1,41,[0,3]);P.rise(D,t,0.8,300,120,'triangle',0.6)},
 im:(D,t)=>{P.dark(D,t,1,49,[0,11]);P.clang(D,t+0.05,0.5,1400)},
 tr:(D,t)=>{P.dark(D,t,1,52,[0,1,2]);P.whoosh(D,t,0.6,2000,500,0.4)},
 cf:(D,t)=>{P.dark(D,t,1,46,[0,6,13]);tone(D,{f:600,t,dur:0.5,type:'sine',vol:0.05,a:0.02,d:0.4,sus:0.3,r:0.3,det:50,wet:0.7})},
 lt:(D,t)=>{P.dark(D,t,1,44,[0,5]);P.thud(D,t,0.5,70);P.thud(D,t+0.3,0.4,70)},             // 汲命：心跳
 at:(D,t)=>{P.dark(D,t,1,50,[0,4,8]);P.rise(D,t,0.7,800,400,'sine',0.6)},
 de:(D,t)=>{P.dark(D,t,1.2,36,[0,1,13]);noise(D,{t,dur:0.9,vol:0.05,f:4000,f2:300,q:3,a:0.3})}, // 衰老：沙漏流逝
 lr:(D,t)=>{P.dark(D,t,1,45,[0,6]);P.zap(D,t+0.05,0.5,2)},
 // 野蛮人
 bbash:(D,t)=>{P.thud(D,t,1.3,110);P.clang(D,t,0.7,600)},                                  // 猛击
 bww:(D,t)=>{for(let i=0;i<3;i++)P.whoosh(D,t+i*0.09,0.9,500,2500,0.12);P.slash(D,t+0.25,0.8)}, // 旋风斩
 bshout:(D,t)=>P.roar(D,t,1.2,130,0.8),                                                    // 战斗怒吼
 bhowl:(D,t)=>{P.roar(D,t,1.3,90,0.9);P.thud(D,t,0.8,60)},                                 // 震慑战嚎
 bmast:(D,t)=>P.clang(D,t,0.6,800),
 // 法师
 mfb:(D,t)=>{P.whoosh(D,t,0.8,400,1500,0.2);P.fire(D,t+0.1,0.9,0.35)},                     // 火焰弹
 mmet:(D,t)=>{P.whoosh(D,t,1,3000,200,0.5);P.boom(D,t+0.45,1.3);P.fire(D,t+0.5,1,0.7)},    // 陨石术
 mnova:(D,t)=>{P.ice(D,t,1.3);noise(D,{t,dur:0.6,vol:0.1,f:3000,f2:8000,q:1,a:0.05,wet:0.6})}, // 霜冻新星
 mcl:(D,t)=>{P.zap(D,t,1.2,6);tone(D,{f:60,t,dur:0.3,type:'sawtooth',vol:0.06,a:0.001,d:0.2,sus:0.3,r:0.1,cut:400})}, // 连锁闪电
 mfa:(D,t)=>{P.ice(D,t,1);P.rise(D,t,0.6,mid(72),mid(84),'sine',0.5)}                      // 寒冰护甲
};
// 缺省回退：按技能元素/类型
const KIND_FB={summon:'rs',golem:'cg',attack:'bs',buff:'ba',cbuff:'bshout',corpse:'ce',wall:'bw',cc:'bp',curse:'ad',melee:'bbash',warcry:'bhowl',spell:'mfb',passive:null};
const EL_FB={fire:(D,t)=>P.fire(D,t),cold:(D,t)=>P.ice(D,t),light:(D,t)=>P.zap(D,t),pois:(D,t)=>P.hiss(D,t),magic:(D,t)=>P.crack(D,t),phys:(D,t)=>P.slash(D,t)};
function skillRecipe(id){if(SK[id])return SK[id];const s=typeof SKM!=='undefined'&&SKM[id];if(s){if(s.el&&EL_FB[s.el])return EL_FB[s.el];const f=KIND_FB[s.kind];if(f&&SK[f])return SK[f]}return EL_FB.magic}
function playSkill(id){voice('skill',id,0.6,(t,D)=>skillRecipe(id)(D,t))}

// --- 召唤物 / 佣兵 / 命中 / 暴击 / 格挡 ---
const colEl=c=>({'#f84':'fire','#f60':'fire','#8cf':'cold','#ff6':'light','#6f6':'pois','#8f6':'pois'})[c]||'phys';
const ALLY_SFX={
 skel:(D,t)=>{P.slash(D,t,0.6,2200);P.crack(D,t,0.3,1800)},
 rev:(D,t)=>{P.slash(D,t,0.6,1500);P.thud(D,t,0.4,160)},
 golem:{cg:(D,t)=>P.thud(D,t,0.8,90),bg:(D,t)=>{P.thud(D,t,0.7,100);P.bubble(D,t,0.5,2)},ig:(D,t)=>P.clang(D,t,0.6,500),fg:(D,t)=>{P.thud(D,t,0.6,90);P.fire(D,t,0.5,0.25)}},
 mage:{fire:(D,t)=>P.fire(D,t,0.5,0.25),cold:(D,t)=>P.ice(D,t,0.5),light:(D,t)=>P.zap(D,t,0.5,2),pois:(D,t)=>P.bubble(D,t,0.6,2)}
};
function allySfx(a,fxc){if(a.kind==='merc'){const el=colEl(fxc);return voice('merc',el,0.3,(t,D)=>{if(el==='phys'){P.slash(D,t,0.8,2600);P.thud(D,t,0.5,150)}else EL_FB[el](D,t)})}
 if(Math.random()<0.5)return;// 召唤物多：稀疏一半
 const S2=ALLY_SFX[a.kind];const fn=typeof S2==='function'?S2:S2&&(S2[a.sub]||S2[a.el]);voice('ally',a.kind,0.25,(t,D)=>(fn||((D,t)=>P.slash(D,t,0.5)))(D,t))}

// 钩子：spend(id) 是所有主动技能（含职业技能/自动施法）的唯一耗蓝入口 → 按 id 发声；随后同一动作内的 fx() 不再重复发声
let castPending=0;
wrap('spend',null,function(id){castPending=1;playSkill(id)});
if(typeof fx==='function')wrap('fx',function(){castPending=0},function(kind){if(castPending)return;if(typeof TAB!=='undefined'&&TAB!=='fight')return;
 if(kind==='slash')voice('attack','slash',0.15,(t,D)=>{P.slash(D,t);tone(D,{f:180,glide:70,t,dur:0.08,type:'square',vol:0.06,a:0.002,d:0.06,sus:0.1,r:0.05,cut:1200})});
 else voice('skill','fx_'+kind,0.4,(t,D)=>EL_FB.magic(D,t))});
// 命中 / 暴击(致命一击黄色飘字) / 召唤物与佣兵攻击：包装最外层 hitMon
wrap('hitMon',function(r,args){const src=args[2],fxc=args[3];if(!r)return;
 if(src==='hero'){if(fxc==='#ff4')voice('crit','c',0.4,(t,D)=>{P.thud(D,t,1,120);P.clang(D,t,0.8,1300);P.crack(D,t+0.02,0.8,3000)});
  else voice('hit','h',0.1,(t,D)=>{noise(D,{t,dur:0.05,vol:0.08,type:'lowpass',f:1400});tone(D,{f:150,glide:80,t,dur:0.05,type:'sine',vol:0.08,a:0.001,d:0.04,sus:0.1,r:0.02})})}
 else if(src&&typeof src==='object')allySfx(src,fxc)});
// 野蛮人重击(双倍)：clsMelee 内部判定，比较伤害与正常上限推断
if(typeof clsMelee==='function'){wrap('clsMelee',function(r,args){if(!r||!ST||!ST.bcrit)return;const mul=1+(args[1]||0)/100,mx=(ST.wmax*mul+(args[2]||0));if(r>mx*1.15)voice('crit','c',0.4,(t,D)=>{P.thud(D,t,1.2,100);P.clang(D,t,0.9,1100)})})}
// 格挡：英雄格挡飘字 / 佣兵格挡飘字
const blockSfx=()=>voice('block','b',0.3,(t,D)=>{P.clang(D,t,1,700);P.thud(D,t,0.5,200)});
wrap('floatHero',null,function(txt){if(txt==='格挡')blockSfx()});
wrap('floatNum',null,function(id,v){if(v==='格挡')blockSfx()});
window.AUDIO_SK={table:SK,recipe:skillRecipe,play:playSkill};
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
