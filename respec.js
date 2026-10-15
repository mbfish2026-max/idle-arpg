'use strict';
// ===================================================================================
// respec.js — 技能点重置药水 / 属性点重置药水
// 商人「药水 / 卷轴」出售（价格随等级上涨），持有数存在 S.resp={sk,at}；在技能页 / 角色页使用。
// 技能重置：技能回到职业初始技能，其余点数全部返还到可用技能点（含任务奖励点）；属性重置：属性回到职业初始值，其余返还到可用属性点。
// 使用后关闭对应的自动加点（否则自动加点会立刻按原计划把点数加回去），玩家可手动分配或重新打开。
// ===================================================================================
const RESP={sk:{n:'技能重置药水',ic:'rsk',p:L=>1000+L*L*30},at:{n:'属性重置药水',ic:'rat',p:L=>500+L*L*20}};
function respN(){if(!S.resp)S.resp={sk:0,at:0};return S.resp}
function respPrice(k){return Math.round(RESP[k].p(S.lvl||1)/100)*100}
function buyResp(k){const p=respPrice(k);if(S.gold<p)return shopMsg('金币不足');S.gold-=p;respN()[k]++;save();shopRe()}
function respBaseSk(){const c=typeof curCls==='function'?curCls():'nec';const D=typeof CLS_DEF!=='undefined'&&CLS_DEF[c];return Object.assign({},(D&&D.sk)||{rs:1})}
function respBaseAt(){const c=typeof curCls==='function'?curCls():'nec';const D=typeof CLS_DEF!=='undefined'&&CLS_DEF[c];return Object.assign({},(D&&D.at)||{str:15,dex:25,vit:15,ene:25})}
const respSum=o=>Object.values(o||{}).reduce((a,v)=>a+(+v||0),0);
function useResp(k){const R=respN();if(R[k]<=0)return toast('没有'+RESP[k].n+'，可在商人处购买');
 if(k==='sk'){const base=respBaseSk(),back=respSum(S.sk)-respSum(base);if(back<=0)return toast('没有可返还的技能点');
  if(!window.__NOUI&&typeof confirm==='function'&&!confirm(`使用${RESP.sk.n}：技能回到初始状态，返还 ${back} 技能点，并关闭「自动加点」。确定？`))return;
  R.sk--;S.sk=base;S.kp+=back;S.autoSk=0;S.main=null;S.curse=null;H.cbs={};H.tur={};ALLY=ALLY.filter(a=>a.kind==='merc');log(`<b style="color:#ffd76a">使用${RESP.sk.n}：返还 ${back} 技能点</b>`)}
 else{const base=respBaseAt(),back=respSum(S.at)-respSum(base);if(back<=0)return toast('没有可返还的属性点');
  if(!window.__NOUI&&typeof confirm==='function'&&!confirm(`使用${RESP.at.n}：属性回到初始值，返还 ${back} 属性点，并关闭「自动加属性」。确定？`))return;
  R.at--;S.at=base;S.sp+=back;S.autoAt=0;log(`<b style="color:#ffd76a">使用${RESP.at.n}：返还 ${back} 属性点</b>`)}
 calc();H.life=Math.min(H.life,ST.life);H.mana=Math.min(H.mana,ST.mana);save();if(!window.__NOUI){toast(RESP[k].n+'已使用');render()}}
function respRow(k,useBtn){const R=respN();return`<div class="row resprow"><span><i class="uapot ${RESP[k].ic}"></i>${RESP[k].n} <span class="dim">持有 ${R[k]}</span></span>${useBtn?
 `<button class="btn xs ${R[k]?'gold':''}" onclick="useResp('${k}')">使用</button>`:`<button class="btn xs gold" onclick="buyResp('${k}')">${fmt(respPrice(k))}◈</button>`}</div>`}
{const st=document.createElement('style');st.textContent='.uapot.rsk{background-image:url(assets/ui2/pot_rsk.webp)}.uapot.rat{background-image:url(assets/ui2/pot_rat.webp)}.respgp .dim{margin-top:4px}';document.head.appendChild(st)}
// 商店：药水区追加两行
{const f=renderShop;renderShop=function(...a){const r=f.apply(this,a);if(window.__NOUI||SHT!=='buy')return r;const g=[...document.querySelectorAll('#panel .gp')].find(e=>/药水/.test(e.querySelector('h3')?.textContent||''));
 if(g){const last=[...g.querySelectorAll('.row')].pop();const h=respRow('sk')+respRow('at');if(last)last.insertAdjacentHTML('afterend',h);else g.insertAdjacentHTML('beforeend',h)}return r}}
// 角色页：属性重置；技能页：技能重置
{const f=renderHero;renderHero=function(...a){const r=f.apply(this,a);if(window.__NOUI)return r;const P=document.getElementById('panel');const g=P&&P.querySelectorAll('.gp')[0];
 if(g&&!P.querySelector('.resp-at'))g.insertAdjacentHTML('afterend',`<div class="gp respgp resp-at"><h3>洗点</h3>${respRow('at',1)}<div class="dim">属性回到职业初始值，点数全部返还，并关闭自动加属性。药水在商人处购买。</div></div>`);return r}}
{const f=renderSkills;renderSkills=function(...a){const r=f.apply(this,a);if(window.__NOUI||SKT>2)return r;const P=document.getElementById('panel');const t=P&&P.querySelector('.stabs');
 if(t&&!P.querySelector('.resp-sk'))t.insertAdjacentHTML('afterend',`<div class="gp respgp resp-sk">${respRow('sk',1)}<div class="dim">技能回到职业初始技能，点数全部返还，并关闭自动加点。药水在商人处购买。</div></div>`);return r}}
