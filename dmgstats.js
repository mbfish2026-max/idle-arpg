// 战斗统计（dmgstats.js）：运行时包装 hitMon/acCast/heroAct/step，按伤害来源累计 伤害/次数；只在弹窗打开时渲染。
// 归属：技能施放期间的英雄伤害→该技能；heroAct 内非施法→普通攻击；召唤物→召唤它的技能；佣兵→佣兵；
// 灼烧→施加它的技能；毒素按施加者归属（每帧按 dps 估算累加，命中次数只计施加次数）。离线结算只算击杀不算伤害，故不计入。
// 存档：S.dmgst={t0:重置时刻ms,s:战斗秒数,r:{key:[伤害,次数]}}，体积很小，随存档/云存档同步。
(function(){
const SUMK={skel:'rs',mage:'rm',rev:'rv',wall:'bw'};
let CAST=null,INHERO=0,OPEN=0;
function st(){if(!S)return null;let d=S.dmgst;if(!d||typeof d!=='object'||!d.r){d=S.dmgst={t0:Date.now(),s:0,r:{}}}return d}
function add(k,v,h){const d=st();if(!d||!(v>=0))return;const e=d.r[k]||(d.r[k]=[0,0]);e[0]=Math.round((e[0]+v)*10)/10;e[1]+=h}
function keyOf(src,m,d,fxc){
 if(src==='hero'){if(CAST)return CAST;if(INHERO)return'_atk';
  if(m.burn&&m.burn.left>=0&&m.burn._k&&d.fire&&Object.keys(d).length===1)return m.burn._k;return'_misc'}
 if(src==='xboom')return'_xboom';
 if(src&&typeof src==='object'){if(src.kind==='merc')return'_merc';return src._dk||src.sub||SUMK[src.kind]||'_sum'}
 return'_misc'}
const _h=hitMon;hitMon=function(m,d,src,fxc){if(!m||m.hp<=0||!d)return _h(m,d,src,fxc);
 let k;try{k=keyOf(src,m,d,fxc)}catch(e){k='_misc'}
 const hp0=m.hp,r=_h(m,d,src,fxc);
 try{const v=Math.min(r||0,Math.max(0,hp0));const pz=d.pois&&m.pois&&m.pois.src===src;if(pz)m.pois._k=k;if(v>0||pz)add(k,v,1)}catch(e){}
 return r};
const _c=acCast;acCast=function(id,ms){const p=CAST;CAST=id;try{return _c(id,ms)}finally{CAST=p;
 try{for(const m of MON)if(m.burn&&!m.burn._k)m.burn._k=id;for(const a of ALLY)if(!a._dk&&a.kind!=='merc'){a._dk=a.sub||SUMK[a.kind]||id}}catch(e){}}};
const _a=heroAct;heroAct=function(){INHERO=1;try{return _a.apply(this,arguments)}finally{INHERO=0}};
const _s=step;step=function(dt){try{const d=st();if(d&&MON.length){d.s+=dt;
  for(const m of MON){const p=m.pois;if(p&&p.left>0&&m.hp>0)add(p._k||'_pois',Math.min(m.hp,p.dps*Math.min(p.left,dt)),0)}}}catch(e){}
 return _s(dt)};
// —— 界面 ——
function nf(n){n=Math.round(n);return n>=1e9?(n/1e9).toFixed(2)+'B':n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e4?(n/1e3).toFixed(1)+'K':String(n)}
function dur(sec){sec=Math.max(0,Math.floor(sec));const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;return h?`${h}小时${m}分`:m?`${m}分${s}秒`:`${s}秒`}
const FIX={_atk:['普通攻击','⚔'],_merc:['佣兵','🛡'],_xboom:['怪物爆炸（词缀）','💥'],_pois:['毒素（来源未知）','☠'],_sum:['召唤物','💀'],_misc:['其他（反伤/光环等）','✧']};
function rowHead(k){if(FIX[k]){let n=FIX[k][0];if(k==='_merc'&&S.merc&&typeof MERCS!=='undefined'&&MERCS[S.merc.t])n='佣兵·'+MERCS[S.merc.t].n;return[n,`<i class="ski dsg">${FIX[k][1]}</i>`]}
 const s=typeof SKM!=='undefined'&&SKM[k];if(!s)return[k,'<i class="ski dsg">✦</i>'];let ic='';try{ic=skIcon(s)}catch(e){ic=`<i class="ski dsg">${s.ic||'✦'}</i>`}return[s.n,ic]}
function body(){const d=st();const L=Object.entries(d.r).filter(e=>e[1][0]>0).sort((a,b)=>b[1][0]-a[1][0]);const tot=L.reduce((a,e)=>a+e[1][0],0);
 const rows=L.length?L.map(([k,[v,h]])=>{const[n,ic]=rowHead(k);const p=tot?v/tot*100:0;
  return`<div class="dsr">${ic}<div class="dsm"><div class="dsn"><b>${n}</b><span>${nf(v)}</span></div><div class="dsb"><i style="width:${p.toFixed(1)}%"></i><em>${p.toFixed(1)}%</em></div><div class="dsx">命中 ${nf(h)} 次 · 平均 ${h?nf(v/h):'—'}/次</div></div></div>`}).join(''):'<div class="dse">暂无数据，战斗一会儿再来看看</div>';
 return`<div class="dsw"><h3>⚔ 战斗统计</h3><div class="dst">已累计 ${dur((Date.now()-d.t0)/1000)}（游戏内战斗 ${dur(d.s)}）· 总伤害 ${nf(tot)}${d.s>1?` · 秒伤 ${nf(tot/d.s)}`:''}</div><div class="dsl">${rows}</div>
 <div class="dsf"><button id="ds_rst">重置统计</button><button id="ds_cls">关闭</button></div><div class="dsh">离线挂机只结算击杀，不计入伤害统计</div></div>`}
function show(){modal(body());OPEN=1;const m=$('#modal');
 m.querySelector('#ds_rst').onclick=()=>{S.dmgst={t0:Date.now(),s:0,r:{}};show();toast('战斗统计已重置')};
 m.querySelector('#ds_cls').onclick=()=>closeM()}
window.dmgStatsShow=show;
// 打开期间每 2 秒刷新一次（不打开不渲染）
setInterval(()=>{if(!OPEN)return;const m=$('#modal');if(m.classList.contains('hide')||!m.querySelector('.dsw')){OPEN=0;return}
 const l=m.querySelector('.dsl'),y=l?l.scrollTop:0;show();const l2=$('#modal .dsl');if(l2)l2.scrollTop=y},2000);
function mount(){const fb=$('#fbattle');if(!fb||$('#dsbtn'))return;const b=document.createElement('button');b.id='dsbtn';b.innerHTML='<i>📊</i><span>战斗统计</span>';
 b.onclick=e=>{e.stopPropagation();show()};fb.appendChild(b)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
