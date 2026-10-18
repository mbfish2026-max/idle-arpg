'use strict';
// ===================================================================================
// dlog.js — 掉落提醒 + 掉落记录。包装 rollTC（在线击杀的新掉落；离线结算期间 busy 时跳过提醒但仍记录）。
// 亮眼掉落：暗金/套装/符文之语/20号及以上符文/可做 3 孔以上符文之语的白色·精良空孔底材。
// 提醒：战斗场景一道光柱 + 闪光（一次性 CSS 动画，结束即移除）+ 短 toast；音效沿用 audio.js 已有 rollTC 掉落音，不新增音频。
// 记录：最近 50 条存 S.dlog=[[秒级时间,名称,q码,地图,uid]]，随云存档。入口：战斗统计弹窗底部「📜 掉落记录」。点条目若物品仍在则打开详情。
// ===================================================================================
(function(){
const MAX=50;
function rwBase(it){if(it.k||it.rw!=null||!(it.q===1||it.q===2)||!(it.sock>=3)||(it.soc&&it.soc.length))return false;const b=BASEM[it.b];if(!b||b.jew)return false;
 return RUNEWORDS.some(w=>w.r.length===it.sock&&w.cats.includes(b.cat))}
// q码：u暗金 s套装 w符文之语 r符文 b底材
function kind(it){if(!it)return'';if(it.k==='rune')return it.r>=19?'r':'';if(it.k)return'';if(it.rw!=null)return'w';if(it.q===5)return'u';if(it.q===6)return's';return rwBase(it)?'b':''}
const COL={u:'#c8a060',s:'#3c3',w:'#e8c070',r:'#f90',b:'#bbb'},TAG={u:'暗金',s:'套装',w:'符文之语',r:'符文',b:'底材'};
function zn(){try{return zoneData().n||''}catch(e){return''}}
function beam(k){const fb=document.getElementById('fbattle');if(!fb||document.hidden)return;const old=fb.querySelector('.dlbeam');if(old)old.remove();
 const d=document.createElement('div');d.className='dlbeam';d.style.setProperty('--c',COL[k]);d.innerHTML='<i></i><b></b>';fb.appendChild(d);
 setTimeout(()=>d.remove(),2100)}
function push(it,k){if(!Array.isArray(S.dlog))S.dlog=[];S.dlog.unshift([Math.floor(Date.now()/1000),itemName(it),k,zn(),it.uid]);if(S.dlog.length>MAX)S.dlog.length=MAX}
let busy=0;
if(typeof offline==='function'){const _of=offline;offline=function(){busy=1;try{return _of.apply(this,arguments)}finally{busy=0}}}
const f0=rollTC;
function note(o){let best=null,bk='';const rk='busrw';for(const it of o||[]){const k=kind(it);if(!k)continue;push(it,k);if(!best||rk.indexOf(k)<rk.indexOf(bk)){best=it;bk=k}}
 if(best&&!busy){beam(bk);toast(`✦ ${TAG[bk]}掉落：${itemName(best)}`)}}
rollTC=function(){const o=f0.apply(this,arguments);if(window.__NOUI||typeof S!=='object'||!S)return o;try{note(o)}catch(e){console.warn(e)}return o};
function hm(t){const d=new Date(t*1000),p=n=>String(n).padStart(2,'0'),now=new Date();return(d.toDateString()===now.toDateString()?'':`${d.getMonth()+1}/${d.getDate()} `)+`${p(d.getHours())}:${p(d.getMinutes())}`}
function show(){const L=Array.isArray(S.dlog)?S.dlog:[];
 modal(`<div class="dsw dlw"><h3>📜 掉落记录 <small>最近 ${MAX} 条</small></h3><div class="dll">${L.length?L.map((e,i)=>`<div class="dlr" onclick="DLOG.open(${i})"><span class="dlt">${hm(e[0])}</span><b style="color:${COL[e[2]]||'#ddd'}">${e[1]}</b><span class="dlm">${e[3]||''}</span></div>`).join(''):'<div class="dse">还没有亮眼掉落，继续刷吧</div>'}</div>
 <div class="dsf"><button onclick="dmgStatsShow()">返回统计</button><button onclick="closeM()">关闭</button></div></div>`)}
function open(i){const e=(S.dlog||[])[i];if(!e)return;const f=findItem(e[4]);if(f&&f.it&&itemName(f.it)===e[1])showItem(e[4]);else toast('该物品已不在（已出售/回收/分解）')}
window.DLOG={show,open,kind,note};
// 战斗统计弹窗底部加入口（该弹窗每 2 秒重建，故在 modal 层注入）
const _m=modal;modal=function(h){if(typeof h==='string'&&h.includes('id="ds_rst"')&&!h.includes('DLOG.show'))h=h.replace('<button id="ds_rst">','<button onclick="DLOG.show()">📜 掉落记录</button><button id="ds_rst">');return _m.call(this,h)};
const st=document.createElement('style');st.textContent=`
#fbattle .dlbeam{position:absolute;inset:0;pointer-events:none;z-index:6;overflow:hidden}
#fbattle .dlbeam i{position:absolute;left:50%;top:-10%;width:46px;height:120%;margin-left:-23px;background:linear-gradient(90deg,transparent,var(--c) 40%,#fff 50%,var(--c) 60%,transparent);opacity:0;filter:blur(2px);animation:dlb 2s ease-out forwards}
#fbattle .dlbeam b{position:absolute;inset:0;background:radial-gradient(circle at 50% 55%,var(--c),transparent 60%);opacity:0;animation:dlf .9s ease-out forwards}
@keyframes dlb{0%{opacity:0;transform:scaleX(.2)}15%{opacity:.9;transform:scaleX(1)}70%{opacity:.6}100%{opacity:0;transform:scaleX(.6)}}
@keyframes dlf{0%{opacity:0}20%{opacity:.45}100%{opacity:0}}
#modal .dlw{margin:0 6px}
#modal .dlw h3{margin:0 0 6px;color:#e8c070;font-size:15px}#modal .dlw h3 small{color:#888;font-size:11px;font-weight:normal}
#modal .dll{max-height:56vh;overflow-y:auto}
#modal .dlr{display:flex;gap:8px;align-items:baseline;font-size:13px;line-height:1.7;border-bottom:1px dashed #2a2018;cursor:pointer}
#modal .dlr b{flex:1 1 auto;min-width:0;font-weight:normal;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#modal .dlt{color:#887;font-size:11px;flex:none}#modal .dlm{color:#9a8a6a;font-size:11px;flex:none;max-width:34%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#modal .dsf{white-space:nowrap}`;document.head.appendChild(st);
})();
