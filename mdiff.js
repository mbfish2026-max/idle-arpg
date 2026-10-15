'use strict';
// ===================================================================================
// mdiff.js — 怪物难度等级 1–9（角色页「设置」里选择，存 S.md，默认 1）
// 等级越高：怪物越强，经验与高级物品掉率越高；每级线性递增，9 级 = 怪物生命×4、伤害×2.5、经验×3、高级物品掉率×3。只影响之后刷出的怪物。
// 高级物品掉率：每次掉落额外按（倍率-1）次重掷掉落表，只保留稀有及以上（稀有/暗金/套装/传说）；额外重掷产生的金币和药水退回，不白送。
// 与 普通/噩梦/地狱 难度独立叠加。加载于 acts.js/eg_events.js（mkMon）与 items2.js/eg_power.js（rollTC）之后。
// ===================================================================================
const MDIFF={max:9,hp:4,dmg:2.5,exp:3,drop:3};
const mdLv=()=>Math.max(1,Math.min(MDIFF.max,(S&&S.md)|0||1));
const mdF=k=>1+(MDIFF[k]-1)*(mdLv()-1)/(MDIFF.max-1);
{const f=mkMon;mkMon=function(...a){const m=f.apply(this,a);if(m&&mdLv()>1){const h=mdF('hp'),d=mdF('dmg');m.max=Math.round(m.max*h);m.hp=Math.round(m.hp*h);m.dmg=m.dmg.map(x=>x*d);m.exp*=mdF('exp')}return m}}
{const f=rollTC;rollTC=function(m){const out=f(m);const x=mdF('drop')-1;if(x<=0)return out;let n=Math.floor(x)+(rnd()<x-Math.floor(x)?1:0);
 for(let i=0;i<n;i++){const g=S.gold,pot=Object.assign({},S.pot);let more;try{more=f(m)}finally{S.gold=g;S.pot=pot}for(const it of more||[])if(!it.k&&it.q>=4)out.push(it)}return out}}
function mdSet(v){S.md=Math.max(1,Math.min(MDIFF.max,v|0));save();if(!window.__NOUI){toast(`怪物难度 ${S.md}：之后刷出的怪物生效`);render()}}
const mdTxt=()=>`怪物生命 ×${mdF('hp').toFixed(2)}、伤害 ×${mdF('dmg').toFixed(2)}；经验 ×${mdF('exp').toFixed(2)}、高级物品掉率 ×${mdF('drop').toFixed(2)}`;
{const f=renderHero;renderHero=function(...a){const r=f.apply(this,a);if(window.__NOUI)return r;const P=document.getElementById('panel');if(!P||P.querySelector('.mdset'))return r;
 const g=[...P.querySelectorAll('.gp')].find(e=>(e.querySelector('h3')?.textContent||'').trim().startsWith('设置'));
 const h=`<div class="mdset"><div class="dim">怪物难度（1–9，越高怪物越强、经验与高级物品掉率越高）：</div><div class="btns">${Array.from({length:MDIFF.max},(_,i)=>i+1).map(v=>`<button class="btn sm ${mdLv()===v?'on':''}" onclick="mdSet(${v})">${v}</button>`).join('')}</div><div class="dim">当前 ${mdLv()} 级：${mdTxt()}</div></div>`;
 if(g){const h3=g.querySelector('h3');h3.insertAdjacentHTML('afterend',h)}else P.insertAdjacentHTML('beforeend',`<div class="gp"><h3>设置</h3>${h}</div>`);return r}}
