// 首领专属掉落 & 速刷（运行时包装 rollTC/genItem/zoneClear/renderMap/showItem）
// BOSS_LOOT[key]=[普通档, 噩梦档, 地狱档] 各 1 件现有暗金（按底材等级分档，确定性分配、互不重复）。
// 首领掉出暗金时，专属暗金权重 ×4（只替换暗金，不改暗金总量 → 不影响通关时长）。
// 速刷：已肃清的首领区域，清场后直接重进首领波（6 秒重进耗时）；每日前 30 次首领击杀 +50% 品质加成，之后每次 -2.5%，第 50 次起为 0。
const BL={W:4,PMAX:0.5,N:30,MF:50,DEC:2.5,RE:6,TIERS:[[0,30],[31,60],[61,999]],cur:null,
 EXTRA:{rift_guard:()=>typeof EG_RIFT!=='undefined'?EG_RIFT.guard:'虚隙守望者',mj_lord:()=>typeof EG_MJ!=='undefined'?EG_MJ.boss:'秘境之主'}};
let BOSS_LOOT=null;
function blKeys(){return Object.keys(BOSSES).filter(k=>!BOSSES[k].uber&&!/^abyss/.test(k)).concat(Object.keys(BL.EXTRA))}
function blBuild(){if(BOSS_LOOT)return BOSS_LOOT;BOSS_LOOT={};const ks=blKeys(),N=ks.length;
 const tiers=BL.TIERS.map(([a,b])=>UNIQUES.filter(u=>u.lv>=a&&u.lv<=b).sort((x,y)=>x.lv-y.lv||(x.n<y.n?-1:1)));
 ks.forEach((k,j)=>{BOSS_LOOT[k]=tiers.map(t=>t.length?t[Math.floor(j*t.length/N)].n:null).filter(Boolean)});return BOSS_LOOT}
function blName(k){return BL.EXTRA[k]?BL.EXTRA[k]():(BOSSES[k]||{}).n||k}
function blKeyOf(m){if(!m)return null;if(m.egMjBoss)return'mj_lord';if(m.egGuard)return'rift_guard';return m.boss&&BOSSES[m.key]&&!BOSSES[m.key].uber?m.key:null}
// 名称 → 首领 key 列表（详情显示「首领专属」）
function blOwners(name){const L=blBuild(),o=[];for(const k in L)if(L[k].includes(name))o.push(k);return o}
function blPool(k,ilvl){return(blBuild()[k]||[]).map(n=>UNIQUES.find(u=>u.n===n)).filter(u=>u&&u.lv<=ilvl)}
function blChance(k,ilvl){const c=blPool(k,ilvl).length;if(!c)return 0;const n=UNIQUES.filter(u=>u.lv<=ilvl).length;return Math.min(BL.PMAX,BL.W*c/(BL.W*c+Math.max(0,n-c)))}
function blSwap(it,k,ilvl){const P=blPool(k,ilvl);if(!P.length||P.some(u=>u.n===it.name))return it;const U=pick(P),b=BASEM[U.b];if(!b)return it;
 const lv=it.anc;const nw=makeBase(b,it.ilvl||ilvl);nw.q=5;nw.name=U.n;nw.req=U.rq;nw.m=rollMods(U.m);try{finishDefense(nw,b)}catch(e){}
 for(const x of Object.keys(it))delete it[x];Object.assign(it,nw);if(lv&&typeof ancApply==='function')ancApply(it,lv);it.blk=k;return it}
{const f=genItem;genItem=function(ilvl){const it=f.apply(this,arguments);try{const k=BL.cur;if(k&&it&&!it.k&&it.q===5&&rnd()<blChance(k,ilvl))blSwap(it,k,ilvl)}catch(e){console.warn(e)}return it}}
// ---------- 速刷 ----------
function blDay(){const d=new Date();return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate()}
function blFR(){if(!S.frun)S.frun={on:0,d:0,n:0};if(S.frun.d!==blDay()){S.frun.d=blDay();S.frun.n=0}return S.frun}
function blBonus(n){return n<BL.N?BL.MF:Math.max(0,BL.MF-(n-BL.N+1)*BL.DEC)}
function blZoneBoss(z){return!!(z&&(z.boss||(z.bosses&&z.bosses.length)))}
{const f=rollTC;rollTC=function(m){const k=blKeyOf(m);if(!k)return f.apply(this,arguments);const pc=BL.cur;BL.cur=k;let mf=null;
 try{const fr=S&&blFR();if(fr&&fr.on&&!EGM&&m.boss){const b=blBonus(fr.n);fr.n++;if(b&&ST){mf=ST.mf;ST.mf=mf+b}}return f.apply(this,arguments)}finally{BL.cur=pc;if(mf!=null)ST.mf=mf}}}
{const f=zoneClear;zoneClear=function(){const z=zoneData(),zi=S.zone,a=S.act,d=S.diff,was=!!S.cleared[zi];f.apply(this,arguments);
 try{const fr=blFR();if(fr.on&&was&&blZoneBoss(z)&&!EGM&&S.act===a&&S.diff===d){if(S.zone!==zi){S.zone=zi;log(`⚡ 速刷：重进 <b>${z.n}</b>`)}S.wave=Math.max(0,z.w-1);MON=[];spawnT=Math.max(spawnT||0,BL.RE)}}catch(e){console.warn(e)}}}
function blToggle(){const fr=blFR();fr.on=fr.on?0:1;save&&save();render()}
// ---------- 地图页：速刷开关 + 每个首领区域「可掉落」 ----------
function blDropLine(bs,ml){const L=blBuild(),seen=new Set(),it=[];for(const k of bs)for(const n of L[k]||[])if(!seen.has(n)){seen.add(n);const U=UNIQUES.find(u=>u.n===n);it.push(`<i class="${U&&U.lv<=ml?'ok':''}">${n}</i>`)}
 return it.length?`<div class="bldrop">可掉落：${it.join('')}</div>`:''}
{const f=renderMap;renderMap=function(){const r=f.apply(this,arguments);try{const P=$('#panel');const A=ACTS[MAPA],d=MAPD;const rows=P.querySelectorAll('.zc');
 A.zones.forEach((z,i)=>{const bs=z.bosses||(z.boss?[z.boss]:[]);const row=rows[i];if(!bs.length||!row)return;const box=row.firstElementChild;if(box&&!box.querySelector('.bldrop'))box.insertAdjacentHTML('beforeend',blDropLine(bs,mlD(z.ml0,d)))});
 const fr=blFR(),b=blBonus(fr.n),ac=P.querySelector('.actc');
 if(ac&&!P.querySelector('.blfr'))ac.insertAdjacentHTML('afterend',`<div class="gp blfr"><span>⚡ 速刷首领</span><small class="dim">今日 ${fr.n} 次${b?` · 品质 +${b}%`:' · 无加成'}</small><button class="btn xs ${fr.on?'on':''}" onclick="event.stopPropagation();blToggle()">${fr.on?'已开启':'已关闭'}</button></div>`)}catch(e){console.warn(e)}return r}}
// 详情：首领专属
{const f=showItem;showItem=function(uid){const r=f.apply(this,arguments);try{const fi=findItem(uid),it=fi&&fi.it;if(it&&!it.k&&it.q===5){const o=blOwners(it.name);const p=document.querySelector('#modal .ipanel');
 if(o.length&&p&&!p.querySelector('.blown')){const h=`<div class="sec blown">首领专属：<b class="bossn">${o.map(blName).join('、')}</b></div>`;const b=p.querySelector('.btns');if(b)b.insertAdjacentHTML('beforebegin',h);else p.insertAdjacentHTML('beforeend',h)}}}catch(e){console.warn(e)}return r}}
