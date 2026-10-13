'use strict';
// ===== 数据定义 =====
const SLOTS=[['weapon','武器','🗡️'],['helm','头盔','⛑️'],['armor','铠甲','🥋'],['gloves','手套','🧤'],['boots','鞋子','🥾'],['ring','戒指','💍'],['amulet','项链','📿']];
const SLOTN=Object.fromEntries(SLOTS.map(s=>[s[0],s[1]])),SLOTI=Object.fromEntries(SLOTS.map(s=>[s[0],s[2]]));
const RAR=[{n:'普通',c:'#ddd',aff:0,m:1},{n:'魔法',c:'#6a9aff',aff:2,m:1.2},{n:'稀有',c:'#f0e060',aff:3,m:1.45},{n:'暗金',c:'#e0a050',aff:4,m:1.9},{n:'套装',c:'#50f070',aff:3,m:1.7}];
const AFF={atk:['攻击',v=>'+'+v],crit:['暴击率',v=>'+'+v+'%'],cdmg:['暴击伤害',v=>'+'+v+'%'],hp:['生命',v=>'+'+v],aspd:['攻速',v=>'+'+v+'%'],leech:['吸血',v=>'+'+v+'%'],def:['护甲',v=>'+'+v],gold:['金币获取',v=>'+'+v+'%'],mf:['寻宝率',v=>'+'+v+'%']};
const PRE={0:['破旧的','粗糙的','普通的'],1:['幽光','霜咬','焰纹','毒蚀'],2:['血誓','骨棘','灰烬','夜啸'],3:['葬月之','永夜·','深渊之喉','焚魂者'],4:['血月']};
const SUB={weapon:['长剑','战斧','骨刃','镰刀'],helm:['铁盔','角盔','面甲'],armor:['链甲','板甲','皮甲'],gloves:['护手','铁拳套'],boots:['战靴','皮靴'],ring:['指环','印戒'],amulet:['护符','吊坠']};
const SETNAME='血月誓约';const SETB={2:{leech:3,atk:20},4:{crit:10,cdmg:50,hp:200}};
const MON=['🦇','🐺','🕷️','🧟','💀','👹','🐍','🦂','👻'],BOSS=['😈','🐉','👺','🧛'];
const $=s=>document.querySelector(s),R=(a,b)=>a+Math.floor(Math.random()*(b-a+1)),pick=a=>a[Math.floor(Math.random()*a.length)];
const fmt=n=>n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e4?(n/1e3).toFixed(1)+'K':Math.floor(n)+'';
// ===== 存档 =====
const KEY='anye_guaji_v1';let S;
function newSave(){return{lv:1,exp:0,pts:0,str:0,vit:0,agi:0,gold:0,floor:1,best:1,kills:0,bag:[],eq:{},uid:1,last:Date.now(),log:[],autoSell:-1}}
function load(){try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){}if(!S)S=newSave();S=Object.assign(newSave(),S)}
function save(){S.last=Date.now();localStorage.setItem(KEY,JSON.stringify(S))}
// ===== 属性 =====
function stats(){const s={atk:10+S.lv*3+S.str*3,hp:100+S.lv*20+S.vit*15,def:S.lv*2,crit:5+S.agi*0.3,cdmg:150,aspd:S.agi*1,leech:0,gold:0,mf:0};
 let setc=0;for(const k in S.eq){const it=S.eq[k];if(!it)continue;for(const[a,v]of Object.entries(it.base))s[a]+=v;for(const f of it.aff)s[f.k]+=f.v;if(it.r===4)setc++}
 for(const n of[2,4])if(setc>=n)for(const[a,v]of Object.entries(SETB[n]))s[a]+=v;s.setc=setc;s.crit=Math.min(s.crit,75);s.aspd=Math.min(s.aspd,200);
 s.power=Math.floor(s.atk*(1+s.crit/100*(s.cdmg/100-1))*(1+s.aspd/100)+s.hp/5+s.def);return s}
function expNeed(l){return Math.floor(50*Math.pow(l,1.6))}
function gainExp(x){S.exp+=x;while(S.exp>=expNeed(S.lv)){S.exp-=expNeed(S.lv);S.lv++;S.pts+=5;toast('⬆️ 升级！等级 '+S.lv+'，获得5属性点');H.hp=stats().hp}}
// ===== 装备生成 =====
function rollRarity(mf){const r=Math.random()*100/(1+mf/100);if(r<1.2)return 3;if(r<2.4)return 4;if(r<9)return 2;if(r<30)return 1;return 0}
function genItem(lvl,forceR){const slot=pick(SLOTS)[0],r=forceR??rollRarity(stats().mf),m=RAR[r].m,base={};
 if(slot==='weapon')base.atk=Math.round((6+lvl*2.2)*m*(0.85+Math.random()*.3));else if(slot==='ring'||slot==='amulet')base.hp=Math.round((10+lvl*4)*m);else base.def=Math.round((3+lvl*1.2)*m),base.hp=Math.round((8+lvl*3)*m);
 const keys=Object.keys(AFF).sort(()=>Math.random()-.5).slice(0,RAR[r].aff+(r>=2?R(0,1):0)),aff=keys.map(k=>({k,v:affVal(k,lvl,m)}));
 const name=r===4?SETNAME+'·'+pick(SUB[slot]):pick(PRE[r])+pick(SUB[slot]);
 return{id:S.uid++,slot,r,lvl,name,base,aff}}
function affVal(k,l,m){const t={atk:2+l*.9,crit:1.5+l*.08,cdmg:8+l*.6,hp:10+l*5,aspd:2+l*.15,leech:.8+l*.04,def:2+l*.8,gold:5+l*.5,mf:5+l*.6}[k];let v=t*m*(0.7+Math.random()*.6);return['crit','leech'].includes(k)?Math.round(v*10)/10:Math.max(1,Math.round(v))}
function score(it){if(!it)return 0;let s=0;const w={atk:3,def:1,hp:.3,crit:4,cdmg:1,aspd:3,leech:4,gold:.3,mf:.4};for(const[a,v]of Object.entries(it.base))s+=v*w[a];for(const f of it.aff)s+=f.v*w[f.k];return Math.round(s)}
function sellPrice(it){return Math.round((5+it.lvl*2)*[1,2.5,6,20,15][it.r])}
// ===== 战斗 =====
const H={hp:0,t:0,lunge:0};let M=null,FX=[],BEAMS=[],SPEED=1,waveKill=0;
function spawn(){const boss=S.floor%10===0,f=S.floor,hp=Math.round((20+f*f*1.6+f*10)*(boss?8:1)),atk=Math.round((3+f*2)*(boss?2:1));
 M={boss,hp,max:hp,atk,e:boss?BOSS[(f/10-1)%BOSS.length|0]:pick(MON),t:0,shake:0,dead:0};waveKill=waveKill||0}
function addFx(x,y,t,c,sz){FX.push({x,y,t,c,sz:sz||16,life:1})}
function step(dt){const s=stats();if(H.hp<=0||H.hp>s.hp)H.hp=Math.min(H.hp||s.hp,s.hp);
 if(!M)spawn();if(M.dead>0){M.dead-=dt;if(M.dead<=0)spawn();return}
 H.t+=dt;const iv=1/(1+s.aspd/100);
 if(H.t>=iv){H.t-=iv;H.lunge=.15;let d=s.atk*(0.9+Math.random()*.2),cr=Math.random()*100<s.crit;if(cr)d*=s.cdmg/100;d=Math.round(d);M.hp-=d;M.shake=.15;
  addFx(W*.72+R(-15,15),110,(cr?'暴击 ':'')+d,cr?'#ffcc30':'#fff',cr?22:16);
  if(s.leech>0){const h=Math.round(d*s.leech/100);H.hp=Math.min(s.hp,H.hp+h)}
  if(M.hp<=0)kill(s)}
 if(M&&M.dead<=0){M.t+=dt;if(M.t>=1.6){M.t=0;const d=Math.max(1,Math.round(M.atk*(0.9+Math.random()*.2)*100/(100+s.def)));H.hp-=d;addFx(W*.28+R(-10,10),120,'-'+d,'#ff4040',15);
  if(H.hp<=0){toast('☠️ 你倒下了…退回第 '+Math.max(1,S.floor-1)+' 层');S.floor=Math.max(1,S.floor-1);H.hp=s.hp;waveKill=0;spawn()}}}
 H.lunge=Math.max(0,H.lunge-dt);M&&(M.shake=Math.max(0,M.shake-dt))}
function kill(s){S.kills++;H.hp=Math.min(s.hp,H.hp+s.hp*.25);M.dead=.5;const g=Math.round((3+S.floor*2)*(M.boss?10:1)*(1+s.gold/100));S.gold+=g;addFx(W*.72,80,'+'+g+'💰','#f0c040',14);
 gainExp(Math.round((5+S.floor*3)*(M.boss?8:1)));
 const n=M.boss?3:(Math.random()<.35?1:0);for(let i=0;i<n;i++)drop(genItem(S.floor+R(0,2),M.boss&&i===0?Math.max(2,rollRarity(s.mf)):undefined));
 if(M.boss){toast('👑 击败Boss！第'+S.floor+'层');S.floor++;waveKill=0}else if(++waveKill>=5){S.floor++;waveKill=0}
 S.best=Math.max(S.best,S.floor);save();if(cur==='fight'||cur==='bag')render()}
function drop(it){if(it.r<=S.autoSell){S.gold+=sellPrice(it);return}
 if(S.bag.length>=60){S.gold+=sellPrice(it);toast('背包已满，自动出售 '+it.name);return}
 S.bag.push(it);if(it.r>=2){BEAMS.push({x:W*.72,c:RAR[it.r].c,life:2.2});addLog(it)}if(it.r>=3)toast('<span style="color:'+RAR[it.r].c+'">✨ '+RAR[it.r].n+'掉落：'+it.name+'</span>')}
function addLog(it){S.log.unshift({t:Date.now(),r:it.r,n:it.name});S.log.length=Math.min(S.log.length,30)}
// ===== 渲染画布 =====
const cv=$('#cv'),ctx=cv.getContext('2d');let W=390,Hh=250;
function resize(){const d=devicePixelRatio||1,r=cv.getBoundingClientRect();W=r.width;Hh=r.height;cv.width=W*d;cv.height=Hh*d;ctx.setTransform(d,0,0,d,0,0)}
function bar(x,y,w,p,c){ctx.fillStyle='#200';ctx.fillRect(x,y,w,6);ctx.fillStyle=c;ctx.fillRect(x,y,w*Math.max(0,p),6);ctx.strokeStyle='#000';ctx.strokeRect(x,y,w,6)}
function draw(t){const g=ctx.createLinearGradient(0,0,0,Hh);g.addColorStop(0,'#1a0808');g.addColorStop(1,'#050202');ctx.fillStyle=g;ctx.fillRect(0,0,W,Hh);
 ctx.fillStyle='#2a1208';ctx.fillRect(0,Hh-50,W,50);for(let i=0;i<8;i++){ctx.fillStyle='rgba(255,90,30,'+(.08+.06*Math.sin(t/300+i))+')';ctx.beginPath();ctx.arc((i*67+t/40)%W,Hh-48,20,0,7);ctx.fill()}
 // 月亮/墓碑
 ctx.fillStyle='#5a1010';ctx.beginPath();ctx.arc(W-50,45,18,0,7);ctx.fill();ctx.fillStyle='#1a0808';ctx.beginPath();ctx.arc(W-43,40,16,0,7);ctx.fill();
 ctx.fillStyle='#140808';for(const x of[30,W/2,W-90]){ctx.fillRect(x,Hh-75,14,26);ctx.fillRect(x-5,Hh-68,24,5)}
 const s=stats(),hx=W*.28-(H.lunge>0?-25:0),hy=Hh-90;ctx.font='54px serif';ctx.textAlign='center';ctx.textBaseline='middle';
 ctx.shadowColor='#c9302c';ctx.shadowBlur=14;ctx.fillText('🧙',hx,hy);ctx.shadowBlur=0;
 bar(hx-35,hy-48,70,H.hp/s.hp,'#c9302c');ctx.font='11px sans-serif';ctx.fillStyle='#ddd';ctx.fillText(fmt(Math.max(0,H.hp))+'/'+fmt(s.hp),hx,hy-56);
 if(M){const mx=W*.72+(M.shake>0?R(-4,4):0);ctx.globalAlpha=M.dead>0?Math.max(0,M.dead*2):1;ctx.font=(M.boss?72:50)+'px serif';if(M.boss){ctx.shadowColor='#f00';ctx.shadowBlur=20}ctx.fillText(M.e,mx,hy-(M.boss?8:0));ctx.shadowBlur=0;ctx.globalAlpha=1;
  bar(mx-40,hy-58,80,M.hp/M.max,M.boss?'#e07020':'#8a2020');ctx.font='11px sans-serif';ctx.fillStyle='#ddd';ctx.fillText((M.boss?'【首领】':'')+fmt(Math.max(0,M.hp)),mx,hy-66)}
 for(const b of BEAMS){const a=Math.min(1,b.life);const gg=ctx.createLinearGradient(0,0,0,Hh);gg.addColorStop(0,'transparent');gg.addColorStop(1,b.c);ctx.globalAlpha=a*.7;ctx.fillStyle=gg;ctx.fillRect(b.x-12,0,24,Hh-40);ctx.globalAlpha=a;ctx.fillStyle=b.c;ctx.shadowColor=b.c;ctx.shadowBlur=25;ctx.beginPath();ctx.arc(b.x,Hh-40,8,0,7);ctx.fill();ctx.shadowBlur=0;ctx.globalAlpha=1}
 for(const f of FX){ctx.globalAlpha=Math.min(1,f.life*1.5);ctx.font='bold '+f.sz+'px sans-serif';ctx.fillStyle=f.c;ctx.strokeStyle='#000';ctx.lineWidth=3;ctx.strokeText(f.t,f.x,f.y);ctx.fillText(f.t,f.x,f.y)}ctx.globalAlpha=1;
 $('#floor').innerHTML='第 <b>'+S.floor+'</b> 层 '+(S.floor%10===0?'· 👑首领战':'· 进度 '+waveKill+'/5')+' '+(SPEED>1?'⏩x'+SPEED:'')}
let lt=performance.now();
function loop(t){let dt=Math.min(.1,(t-lt)/1000);lt=t;for(let i=0;i<SPEED;i++)step(dt);
 for(const f of FX){f.life-=dt;f.y-=30*dt}FX=FX.filter(f=>f.life>0);for(const b of BEAMS)b.life-=dt;BEAMS=BEAMS.filter(b=>b.life>0);
 draw(t);hdr();requestAnimationFrame(loop)}
function hdr(){const s=stats();$('#hdr').innerHTML='Lv.<b>'+S.lv+'</b> 💰<b>'+fmt(S.gold)+'</b><br>战力 <b>'+fmt(s.power)+'</b>'}
// ===== UI =====
let cur='fight';
function toast(h){const T=$('#toast');while(T.children.length>=3)T.firstChild.remove();const d=document.createElement('div');d.innerHTML=h;$('#toast').appendChild(d);setTimeout(()=>d.remove(),2600)}
function itemTip(it){return '<div class="tip"><div class="n" style="color:'+RAR[it.r].c+'">'+SLOTI[it.slot]+' '+it.name+'</div><div style="color:#998">'+RAR[it.r].n+' · '+SLOTN[it.slot]+' · 物品等级 '+it.lvl+' · 评分 '+score(it)+'</div>'+
 Object.entries(it.base).map(([a,v])=>'<div>'+AFF[a][0]+' '+v+'</div>').join('')+it.aff.map(f=>'<div style="color:#8ab0ff">'+AFF[f.k][0]+' '+AFF[f.k][1](f.v)+'</div>').join('')+
 (it.r===4?'<div style="color:#50f070">套装「'+SETNAME+'」<br>(2) 吸血+3% 攻击+20<br>(4) 暴击+10% 暴伤+50% 生命+200</div>':'')+'</div>'}
function slotHtml(it,attr){return '<div class="slot r'+(it?it.r:'')+'" '+(attr||'')+'>'+(it?SLOTI[it.slot]+'<small>'+it.lvl+'</small>':'')+'</div>'}
function render(){const p=$('#panel'),s=stats();
 if(cur==='fight'){p.innerHTML='<div class="card"><h3>⚔️ 战况</h3><div class="row"><span>当前层数</span><span>'+S.floor+'（最高 '+S.best+'）</span></div><div class="row"><span>击杀总数</span><span>'+S.kills+'</span></div><div class="row"><span>经验</span><span>'+fmt(S.exp)+' / '+fmt(expNeed(S.lv))+'</span></div><div class="bar"><i style="width:'+(S.exp/expNeed(S.lv)*100)+'%"></i></div>'+
  '<div class="btns"><button class="btn g" onclick="setSpeed()">挂机速度 x'+SPEED+'</button><button class="btn g" onclick="S.floor=Math.max(1,S.floor-1);waveKill=0;spawn();render()">退一层</button><button class="btn g" onclick="S.floor=S.best;waveKill=0;spawn();render()">去最高层</button></div></div>'+
  '<div class="card"><h3>✨ 稀有掉落记录</h3><div class="log">'+(S.log.length?S.log.map(l=>'<div style="color:'+RAR[l.r].c+'">['+RAR[l.r].n+'] '+l.n+'</div>').join(''):'<span style="color:#666">暂无，继续挂机吧…</span>')+'</div></div>'}
 else if(cur==='equip'){p.innerHTML='<div class="card"><h3>🛡️ 已穿戴（点击查看/卸下）</h3><div class="eqgrid">'+SLOTS.map(([k,n,i])=>{const it=S.eq[k];return '<div class="eq" onclick="'+(it?'showEq(\''+k+'\')':'')+'">'+slotHtml(it)+'<div><div style="color:'+(it?RAR[it.r].c:'#555')+'">'+(it?it.name:n+'：空')+'</div><div style="color:#887">'+(it?'评分 '+score(it):'')+'</div></div></div>'}).join('')+'</div>'+
  '<div class="btns"><button class="btn" onclick="autoEquip()">⚡ 一键穿戴最优</button></div><div style="font-size:12px;color:#50f070">套装「'+SETNAME+'」已穿 '+s.setc+'/4</div></div>'}
 else if(cur==='bag'){const bag=[...S.bag].sort((a,b)=>b.r-a.r||score(b)-score(a));p.innerHTML='<div class="card"><h3>🎒 背包 '+S.bag.length+'/60</h3><div class="grid">'+bag.map(it=>{const e=S.eq[it.slot],d=score(it)-score(e);return '<div style="position:relative">'+slotHtml(it,'onclick="showItem('+it.id+')"')+(d>0?'<span style="position:absolute;top:0;left:3px;color:#50e060;font-size:12px">▲</span>':'')+'</div>'}).join('')+'</div>'+
  '<div class="btns"><button class="btn" onclick="bulk(1,0)">分解 普通+魔法</button><button class="btn" onclick="bulk(2,0)">分解 ≤稀有</button><button class="btn g" onclick="bulk(1,1)">出售 普通+魔法</button><button class="btn g" onclick="autoEquip()">一键穿戴</button></div>'+
  '<div class="row"><span>自动出售</span><select onchange="S.autoSell=+this.value;save()" style="background:#1a0d08;color:#ddd;border:1px solid #533">'+[[-1,'关闭'],[0,'普通'],[1,'≤魔法'],[2,'≤稀有']].map(([v,n])=>'<option value="'+v+'" '+(S.autoSell==v?'selected':'')+'>'+n+'</option>').join('')+'</select></div><div class="row"><span>魂晶（分解所得）</span><span>'+(S.shard||0)+'</span></div></div>'}
 else{p.innerHTML='<div class="card"><h3>💀 夜行者 · 等级 '+S.lv+'</h3><div class="bar"><i style="width:'+(S.exp/expNeed(S.lv)*100)+'%"></i></div><div class="row"><span>可用属性点</span><b style="color:#f0c040">'+S.pts+'</b></div>'+
  [['str','力量','攻击+3'],['vit','体魄','生命+15'],['agi','敏捷','暴击+0.3% 攻速+1%']].map(([k,n,d])=>'<div class="row" style="align-items:center"><span>'+n+' <b>'+S[k]+'</b> <small style="color:#887">('+d+')</small></span><span><button class="btn" onclick="addPt(\''+k+'\',1)">+1</button> <button class="btn g" onclick="addPt(\''+k+'\',5)">+5</button></span></div>').join('')+'</div>'+
  '<div class="card"><h3>📊 属性</h3>'+[['战力',fmt(s.power)],['攻击',Math.round(s.atk)],['生命',Math.round(s.hp)],['护甲',Math.round(s.def)],['暴击率',s.crit.toFixed(1)+'%'],['暴击伤害',s.cdmg+'%'],['攻速加成',s.aspd.toFixed(0)+'%'],['吸血',s.leech.toFixed(1)+'%'],['金币获取','+'+s.gold+'%'],['寻宝率','+'+s.mf+'%']].map(([a,b])=>'<div class="row"><span>'+a+'</span><span>'+b+'</span></div>').join('')+'</div>'+
  '<div class="card"><div class="btns"><button class="btn g" onclick="if(confirm(\'确定重置存档？\')){localStorage.removeItem(KEY);location.reload()}">重置存档</button></div></div>'}}
function modal(h){$('#modal').innerHTML='<div class="box">'+h+'<div class="btns"><button class="btn g" onclick="closeM()" style="width:100%">关闭</button></div></div>';$('#modal').classList.remove('hide')}
function closeM(){$('#modal').classList.add('hide')}
$('#modal').onclick=e=>{if(e.target.id==='modal')closeM()};
function showItem(id){const it=S.bag.find(i=>i.id===id),e=S.eq[it.slot],d=score(it)-score(e);
 modal(itemTip(it)+'<div style="margin:8px 0;font-size:13px">对比当前：'+(e?'<span class="'+(d>=0?'up':'dn')+'">'+(d>=0?'▲ +':'▼ ')+d+' 评分</span>':'<span class="up">该部位为空</span>')+'</div>'+(e?'<div class="card"><div style="font-size:12px;color:#887">当前穿戴</div>'+itemTip(e)+'</div>':'')+
 '<div class="btns"><button class="btn" onclick="equip('+id+')">穿戴</button><button class="btn g" onclick="sell('+id+')">出售 '+sellPrice(it)+'💰</button><button class="btn g" onclick="salv('+id+')">分解</button></div>')}
function showEq(k){modal(itemTip(S.eq[k])+'<div class="btns"><button class="btn" onclick="unequip(\''+k+'\')">卸下</button></div>')}
function equip(id){const i=S.bag.findIndex(x=>x.id===id),it=S.bag[i];S.bag.splice(i,1);if(S.eq[it.slot])S.bag.push(S.eq[it.slot]);S.eq[it.slot]=it;closeM();save();render();toast('已穿戴 '+it.name)}
function unequip(k){if(S.bag.length>=60)return toast('背包已满');S.bag.push(S.eq[k]);delete S.eq[k];closeM();save();render()}
function sell(id){const i=S.bag.findIndex(x=>x.id===id);S.gold+=sellPrice(S.bag[i]);S.bag.splice(i,1);closeM();save();render()}
function salv(id){const i=S.bag.findIndex(x=>x.id===id);S.shard=(S.shard||0)+[1,3,8,25,20][S.bag[i].r];S.bag.splice(i,1);closeM();save();render()}
function bulk(maxR,isSell){let g=0,c=0;S.bag=S.bag.filter(it=>{if(it.r<=maxR&&score(it)<=score(S.eq[it.slot])){c++;if(isSell)g+=sellPrice(it);else S.shard=(S.shard||0)+[1,3,8,25,20][it.r];return false}return true});S.gold+=g;toast((isSell?'出售':'分解')+' '+c+' 件（不含比当前更好的装备）'+(isSell?' +'+g+'💰':''));save();render()}
function autoEquip(){let n=0;for(const[k]of SLOTS){const best=S.bag.filter(i=>i.slot===k).sort((a,b)=>score(b)-score(a))[0];if(best&&score(best)>score(S.eq[k])){equip(best.id);n++}}toast(n?'已更换 '+n+' 件装备':'已是最优');render()}
function addPt(k,n){n=Math.min(n,S.pts);if(!n)return;S[k]+=n;S.pts-=n;save();render()}
function setSpeed(){SPEED=SPEED>=4?1:SPEED*2;render()}
document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('#tabs button').forEach(x=>x.classList.remove('on'));b.classList.add('on');cur=b.dataset.t;render()});
// ===== 离线收益 =====
function offline(){const sec=Math.min(8*3600,(Date.now()-S.last)/1000);if(sec<60)return;const s=stats(),kills=Math.floor(sec/4),g=Math.round(kills*(3+S.floor*2)*(1+s.gold/100)),xp=kills*(5+S.floor*3);
 S.gold+=g;const lv0=S.lv;gainExp(xp);let items=0;const n=Math.min(20,Math.floor(kills*.05));for(let i=0;i<n;i++){const it=genItem(S.floor);if(S.bag.length<60&&it.r>S.autoSell){S.bag.push(it);items++;if(it.r>=2)addLog(it)}}
 modal('<h3 style="color:#c9a060">🌙 离线收益</h3><div class="tip">离线 '+(sec/3600).toFixed(1)+' 小时（上限8小时）<br>击杀 '+kills+'<br>金币 +'+fmt(g)+'<br>经验 +'+fmt(xp)+(S.lv>lv0?'（升至 '+S.lv+' 级）':'')+'<br>装备 +'+items+' 件</div>');save()}
// ===== 调试 =====
window.dbg={speed:n=>{SPEED=n;render()},loot:n=>{for(let i=0;i<(n||10);i++)drop(genItem(S.floor+R(0,3),i%5));render()},floor:f=>{S.floor=f;waveKill=0;spawn()},offline:h=>{S.last=Date.now()-h*3600e3;offline()},gold:g=>{S.gold+=g}};
load();resize();addEventListener('resize',resize);H.hp=stats().hp;offline();render();requestAnimationFrame(loop);setInterval(save,5000);
document.addEventListener('visibilitychange',()=>{if(document.hidden)save();else{offline();lt=performance.now()}});
