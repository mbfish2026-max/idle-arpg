'use strict';
// ===================================================================================
// shop.js — 营地商人 / 赌博 / 出售与回购 / 精华兑换（底部导航「商店」）
// 原版规则近似：商人货架 ilvl = 角色等级（不超过章节×难度上限），魔法装可带亡灵术士技能；货架每 10 分钟或花金币刷新；
// 买价 ≈ 卖价×4，卖价有上限（普通 5000 / 噩梦 15000 / 地狱 35000）；回购价 = 卖出所得。
// 赌博：ilvl = 角色等级 -5~+4，品质 暗金 1/2000、套装 1/1000、稀有 10%，其余魔法（暗金/套装无对应底材时按原版降级）。
// ===================================================================================
const MERCHANTS=['药婆萝希','商人塔里克','巫医乌鲁','铁匠嘉朗','老兵布劳'],GAMBLERS=['赌客卡莫','赌客希兰','赌客多尔','赌客维恩','赌客妮珂'];
const POT_N={hp:['轻型','普通','强效','超级','超级'],mp:['轻型','普通','强效','超级','超级']};
const SHOP_REFRESH=600e3,SELL_CAP=[5000,15000,35000],GAMBLE_P={u:1/2000,s:1/1000,r:0.10};
const ACT_CAP=[[12,20,28,36,45],[40,48,55,62,68],[68,75,82,88,99]];
let SHT='buy';
function shopIlvl(){return clamp(Math.min(S.lvl,ACT_CAP[S.diff||0][S.act||0]),1,99)}
function potPrice(k){const a=(S.act||0)+(S.diff||0)*2;return{hp:25+a*20,mp:25+a*20,rej:300+a*120,tp:100}[k]}
function shopSellPrice(it){return Math.min(SELL_CAP[S.diff||0],sellPrice(it))}
function buyPrice(it){return Math.max(10,Math.round(sellPrice(it)*4))}
function gamblePrice(slot){const L=S.lvl;return Math.round((['ring','amulet'].includes(slot)?1000+L*L*15:500+L*L*5)*(1+(S.diff||0)*0.25))}
function ensureShop(force){if(!S.shop)S.shop={t:0,items:[],gam:[],bb:[]};const sh=S.shop,key=(S.diff||0)+'_'+(S.act||0);
 if(force||sh.key!==key||Date.now()-sh.t>SHOP_REFRESH||!sh.items.length){sh.key=key;sh.t=Date.now();const il=shopIlvl();sh.items=[];
  for(let i=0;i<12;i++){const slot=pick(['weapon','weapon','shield','helm','armor','gloves','belt','boots']);const it=genItem(il,{q:i<5?1:3,slot});sh.items.push(it)}
  for(const s of ['ring','amulet'])sh.items.push(genItem(il,{q:3,base:BASEM[s==='ring'?'rin':'amu']}));
  sh.gam=['ring','amulet','weapon','weapon','shield','helm','armor','gloves','belt','boots'].map(slot=>({slot,b:(slot==='ring'?BASEM.rin:slot==='amulet'?BASEM.amu:pickBase(S.lvl,slot)).id}))}}
function gambleRoll(slot,bid){const il=clamp(S.lvl+R(-5,4),1,99);const b=BASEM[bid];const r=rnd();const q=r<GAMBLE_P.u?5:r<GAMBLE_P.u+GAMBLE_P.s?6:r<GAMBLE_P.u+GAMBLE_P.s+GAMBLE_P.r?4:3;return genItem(il,{base:b,q})}
function buyPot(k){const p=potPrice(k);if(S.gold<p)return shopMsg('金币不足');S.gold-=p;S.pot[k]++;shopRe()}
function buyItem(uid){ensureShop();const i=S.shop.items.findIndex(x=>x.uid===uid);if(i<0)return false;const it=S.shop.items[i],p=buyPrice(it);if(S.gold<p)return shopMsg('金币不足'),false;if(!bagFits(it))return shopMsg('背包已满'),false;
 S.gold-=p;S.shop.items.splice(i,1);S.bag.push(it);shopRe();return true}
function gamble(i){ensureShop();const g=S.shop.gam[i];if(!g)return null;const p=gamblePrice(g.slot);if(S.gold<p)return shopMsg('金币不足'),null;if(slotsUsed(S.bag)>=BAG_SZ)return shopMsg('背包已满'),null;
 S.gold-=p;const it=gambleRoll(g.slot,g.b);S.bag.push(it);if(it.q===5||it.q===6)S.codex&&(S.codex[it.name]=1);log(`赌博获得 <span style="color:${itemColor(it)}">${itemName(it)}</span>`);
 g.b=(g.slot==='ring'?BASEM.rin:g.slot==='amulet'?BASEM.amu:pickBase(S.lvl,g.slot)).id;if(!window.__NOUI){render();showItem(it.uid)}return it}
function shopSell(uid){const i=S.bag.findIndex(x=>x.uid===uid);if(i<0)return false;const it=S.bag[i];let p,sold;
 if(it.k==='mat'){p=2;it.n--;sold={uid:S.uid++,k:'mat',id:it.id,n:1};mergeMats(S.bag)}else{p=shopSellPrice(it);S.bag.splice(i,1);sold=it}
 S.gold+=p;S.shop.bb.unshift({it:sold,p});if(S.shop.bb.length>12)S.shop.bb.pop();shopRe();return true}
function buyBack(i){const e=S.shop.bb[i];if(!e)return false;if(S.gold<e.p)return shopMsg('金币不足'),false;if(!bagFits(e.it))return shopMsg('背包已满'),false;S.gold-=e.p;S.shop.bb.splice(i,1);pushInto(S.bag,e.it);shopRe();return true}
function shopRefreshPaid(){const c=S.lvl*50;if(S.gold<c)return shopMsg('金币不足');S.gold-=c;ensureShop(true);shopRe()}
const ESS_EX=[['瑕疵宝石',30,()=>({uid:S.uid++,k:'gem',g:pick(Object.keys(GEMS)),lv:1})],['魔法小护身符',80,()=>genItem(Math.max(28,S.lvl),{base:BASEM.cha_s,q:3})],['随机符文(1~12号)',150,()=>({uid:S.uid++,k:'rune',r:R(0,11)})]];
function essExchange(i){const[n,c,f]=ESS_EX[i];if(matCount('ess')<c)return shopMsg('残骸精华不足'),false;const it=f();if(!bagFits(it))return shopMsg('背包已满'),false;takeMat('ess',c);addBag(it);shopRe();return true}
function shopMsg(t){if(!window.__NOUI)toast(t)}
function shopRe(){if(!window.__NOUI){closeM();render()}}
function renderShop(){ensureShop();const P=$('#panel'),a=S.act||0;const left=Math.max(0,Math.ceil((SHOP_REFRESH-(Date.now()-S.shop.t))/60000));
 const tabs=[['buy','商人'],['gam','赌博'],['sell','出售/回购'],['ess','精华兑换']].map(([k,n])=>`<button class="${SHT===k?'on':''}" onclick="SHT='${k}';render()">${n}</button>`).join('');
 let h=`<div class="gp shoph"><h3>${ACTS[a].camp} · ${SHT==='gam'?GAMBLERS[a]:MERCHANTS[a]} <span class="r gold">◈ ${fmt(S.gold)}</span></h3><div class="dim">${DIFFS[S.diff||0].n} · 货架物品等级 ${shopIlvl()} · ${left} 分钟后刷新</div></div><div class="stabs">${tabs}</div>`;
 if(SHT==='buy'){h+=`<div class="gp"><h3>药水 / 卷轴</h3>${[['hp',`${POT_N.hp[a]}生命药水`,'🧪'],['mp',`${POT_N.mp[a]}法力药水`,'🧪'],['rej','回复药剂','💜'],['tp','回城卷轴','📜']].map(([k,n,i])=>`<div class="row"><span>${i} ${n} <span class="dim">持有 ${S.pot[k]}</span></span><button class="btn xs gold" onclick="buyPot('${k}')">${potPrice(k)}◈</button></div>`).join('')}
  <div class="dim">本作物品拾取即鉴定，不设鉴定卷轴。</div></div><div class="gp"><h3>货架 <span class="r"><button class="btn xs" onclick="shopRefreshPaid()">立即刷新 ${S.lvl*50}◈</button></span></h3><div class="grid">${S.shop.items.map(it=>`<div class="shc">${cell(it,`shopPeek(${it.uid})`)}<button class="btn xs gold" onclick="buyItem(${it.uid})">${fmt(buyPrice(it))}</button></div>`).join('')}</div></div>`}
 else if(SHT==='gam'){h+=`<div class="gp"><h3>赌博 <span class="dim">物品等级 ${Math.max(1,S.lvl-5)}~${Math.min(99,S.lvl+4)}</span></h3><div class="dim">买下后才揭晓品质：暗金 0.05%、套装 0.1%、稀有 10%，其余为魔法。</div><div class="grid">${S.shop.gam.map((g,i)=>`<div class="shc"><div class="cell q3 unid" onclick="gamble(${i})"><i class="ii">❔</i><small>${BASEM[g.b].n}</small></div><button class="btn xs gold" onclick="gamble(${i})">${fmt(gamblePrice(g.slot))}</button></div>`).join('')}</div></div>`}
 else if(SHT==='sell'){h+=`<div class="gp"><h3>点背包物品出售 <span class="dim">（卖价上限 ${SELL_CAP[S.diff||0]}）</span></h3><div class="grid">${groups(S.bag).map(g=>`<div class="shc">${cellG(g,`shopSell(${g.it.uid})`)}<small class="dim">${g.it.k==='mat'?2:shopSellPrice(g.it)}◈</small></div>`).join('')||'<div class="dim">背包为空</div>'}</div></div>
  <div class="gp"><h3>回购 <span class="dim">最近卖出的 12 件</span></h3><div class="grid">${S.shop.bb.map((e,i)=>`<div class="shc">${cell(e.it,`buyBack(${i})`)}<button class="btn xs" onclick="buyBack(${i})">${e.p}◈</button></div>`).join('')||'<div class="dim">无</div>'}</div></div>`}
 else{h+=`<div class="gp"><h3>精华兑换 <span class="r">持有 ${matCount('ess')} 残骸精华</span></h3>${ESS_EX.map(([n,c],i)=>`<div class="row"><span>${n}</span><button class="btn xs gold" onclick="essExchange(${i})" ${matCount('ess')<c?'disabled':''}>${c} 精华</button></div>`).join('')}<div class="dim">残骸精华来自自动回收（回收所得选「残骸精华」）。</div></div>`}
 P.innerHTML=h}
function shopPeek(uid){const it=S.shop.items.find(x=>x.uid===uid);if(!it)return;S.bag.push(it);try{showItem(uid)}finally{S.bag.pop()}const box=document.querySelector('#modal .btns.c');if(box)box.innerHTML=`<button class="btn gold" onclick="buyItem(${uid})">购买 ${fmt(buyPrice(it))}◈</button><button class="btn" onclick="closeM()">关闭</button>`}
const _sh_render=render;render=function(){if(TAB!=='shop')return _sh_render();document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===TAB));$('#fightv').classList.add('hide');$('#panel').classList.remove('hide');renderShop()};
