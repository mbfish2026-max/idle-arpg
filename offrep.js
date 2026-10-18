'use strict';
// ===================================================================================
// offrep.js — 离线收益报告：包装 offline()（含 loot.js / power.js 等调用方），把原「离线收益」弹窗换成紧凑卡片：
// 离开时长、击杀、经验(升级)、金币、亮眼掉落（暗金/套装/符文之语/15号及以上符文）、自动回收件数。离开不足 2 分钟不弹。
// 只读结算结果，不改结算公式。登录同步期间 cloud.js 会暂存 modal 内容，本卡片同样被暂存后再显示。加载于 power.js 之后。
// ===================================================================================
(function(){
const MIN_SEC=120;
window.OFFREP={busy:0};
function notable(it){if(!it)return false;if(it.k==='rune')return it.r>=14;if(it.k)return false;return it.rw!=null||it.q===5||it.q===6}
function qc(it){return it.k==='rune'?'#f90':it.rw!=null?'#c8a060':it.q===5?'#c8a060':it.q===6?'#3c3':'#ddd'}
function hm(s){s=Math.floor(s);const h=Math.floor(s/3600),m=Math.floor(s%3600/60);return h?`${h}小时${m}分`:`${m}分钟`}
const f0=offline;
offline=function(){
 if(typeof S!=='object'||!S||!S.last)return f0.apply(this,arguments);
 const sec=(Date.now()-S.last)/1000;
 const lv0=S.lvl,g0=S.gold,r0=(typeof STATS==='object'&&STATS.rcy)||0,got=[];let xp=0,html='';
 const _m=modal,_rt=rollTC,_gx=gainXp;
 modal=h=>{html=h};
 rollTC=function(){const o=_rt.apply(this,arguments);for(const it of o||[])got.push(it);return o};
 gainXp=function(x){xp+=x||0;return _gx.apply(this,arguments)};
 OFFREP.busy=1;
 try{f0.apply(this,arguments)}finally{modal=_m;rollTC=_rt;gainXp=_gx;OFFREP.busy=0}
 if(!html)return;                       // 原函数未结算（<60秒或无击杀）
 if(sec<MIN_SEC||window.__NOUI)return;  // 太短：照常结算但不打扰
 const km=html.match(/击杀\s*(\d+)/),kills=km?+km[1]:0,zn=(html.match(/<b>([^<]+)<\/b>\s*击杀/)||[])[1]||'';
 const rc=((typeof STATS==='object'&&STATS.rcy)||0)-r0,dl=S.lvl-lv0,good=got.filter(notable);
 const capped=sec>8*3600;
 const drops=good.length?good.slice(0,8).map(it=>`<span style="color:${qc(it)}">${itemName(it)}</span>`).join('、')+(good.length>8?` 等${good.length}件`:''):'<span class="dim">无</span>';
 modal(`<div class="orp"><div class="orh">🌙 离线收益</div>
 <div class="org"><span>离开</span><b>${hm(sec)}${capped?'<small>（按8小时）</small>':''}</b><span>击杀</span><b>${fmt(kills)}${zn?`<small> · ${zn}</small>`:''}</b>
 <span>经验</span><b>+${fmt(Math.round(xp))}${dl>0?` <em>升 ${dl} 级 → ${S.lvl}</em>`:''}</b><span>金币</span><b>+${fmt(Math.max(0,S.gold-g0))}</b>
 <span>掉落</span><b class="ord">${drops}</b>${rc>0?`<span>回收</span><b>${rc} 件</b>`:''}</div>
 <div class="orf"><button class="btn" onclick="closeM()">收下</button></div></div>`)};
const st=document.createElement('style');st.textContent=`
#modal .orp{margin:0 auto;max-width:340px;padding:12px 14px 10px;background:#140e0a;border:1px solid #6b5230;border-radius:6px}
#modal .orh{text-align:center;color:#e8c070;font-size:16px;letter-spacing:2px;margin-bottom:8px}
#modal .org{display:grid;grid-template-columns:auto 1fr;gap:5px 10px;font-size:13px;line-height:1.45}
#modal .org>span{color:#9a8a6a}#modal .org>b{color:#eee;font-weight:normal;min-width:0;overflow-wrap:anywhere}
#modal .org small{color:#888}#modal .org em{color:#ffd76a;font-style:normal}
#modal .orf{text-align:center;margin-top:10px}#modal .orf .btn{min-width:120px}`;document.head.appendChild(st);
})();
