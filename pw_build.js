'use strict';
// ===================================================================================
// pw_build.js — 威能共鸣（设计稿 /workspace/design/power_builds_plan.md 方案 A）
// 1) 每个流派 3 个核心威能（武器/护甲/饰品各 1）：生效 2 个 → 共鸣 I（核心技能 +25%），3 个 → 共鸣 II（再 +40%，并获得该流派的 6 件机制）
//    共鸣只在已选该流派时生效；流派 6 件套穿满时共鸣数值减半且不再给机制（6 件已有）。共鸣机制沿用 6 件机制代码：不触发技能次数、不连锁尸潮冥爆
// 2) 熔炼匣第 4 槽「通用槽」（地狱通关解锁，可放任意类）；同时生效的威能最多 6 个（匣槽优先，其次按装备部位）
// 3) 威能品阶 1–3：重复收录同名威能 +1 阶；新威能数值 ×1 / 1.25 / 1.5
// 4) 地狱 / 秘境掉落时 40% 优先出当前流派核心威能；秘晶兑换核心威能（每周每流派 1 次）；炼金匣「威能重铸」保底
// 存档：EG().lp = {arch:{k:品阶}, cube:{w,a,j,u}, wk:{w:周序号,b:{流派:1}}}；共鸣不存档，calc 时实时计算
// ===================================================================================
const PB={cap:6,tierK:[1,1,1.25,1.5],r1:25,r2:40,bias:0.4,price:300,tab:'slot',over:[],
 core:{sum:['pw_bonepact','legion','soul_feast'],bone:['bx_echo','ba_surge','pw_marrow'],plague:['pn_venom','pw_shroud','ce_ember'],
  bar_ww:['pw_whirl','pw_ironspin','taunt_doom'],bar_bers:['pw_soulcleave','bo_titan','taunt_doom'],bar_cry:['leap_quake','bo_titan','taunt_doom'],
  sor_fire:['hydra_brood','es_aegis','pw_emberheart'],sor_cold:['blizz_deep','es_aegis','pw_frostcore'],sor_light:['pw_surge','es_aegis','static_rift'],
  dru_fire:['fissure_rage','bear_hide','pw_magma'],dru_wind:['pw_galestaff','bear_hide','raven_swarm'],dru_sum:['pw_beastfang','bear_hide','raven_swarm'],
  ama_strafe:['strafe_gale','decoy_twin','keen_mark'],ama_elem:['pw_blazequiver','pw_blazecloak','keen_mark'],ama_jav:['plague_cloud','decoy_twin','pw_thunderbadge'],
  pal_zeal:['veng_tri','vigor_oath','pw_zealring'],pal_ham:['pw_judgham','vigor_oath','smite_judg'],pal_fist:['fist_storm','vigor_oath','smite_judg']},
 // 共鸣作用对象：sum=召唤物伤害，否则技能 id 列表；mech：共鸣 II 机制（nec 用 N 旗标）
 tgt:{sum:'sum',dru_sum:'sum',bone:['bs','bx'],plague:['pn']},
 sumK:0.6,necMech:{sum:'boom',bone:'split',plague:'plague'}};
// ---------- 新威能（17 个）----------
Object.assign(EG_LP,{
 pw_bonepact:{c:'w',cls:'nec',n:'冥契骨杖',d:'召唤物伤害 +15%',e:{sum:15}},
 pw_marrow:{c:'j',cls:'nec',n:'骨髓共振',d:'骨矛、骨魂伤害 +12%',e:{skd:{bs:12,bx:12}}},
 pw_shroud:{c:'a',cls:'nec',n:'疫母裹尸布',d:'毒素伤害 +15%，全部抗性 +10%',e:{pois:15,res:10}},
 pw_whirl:{c:'w',cls:'bar',n:'绞风利刃',d:'旋风斩伤害 +25%',e:{skd:{bww:25}}},
 pw_ironspin:{c:'a',cls:'bar',n:'铁旋护甲',d:'最大生命 +10%，全部抗性 +10%',e:{life:10,res:10}},
 pw_soulcleave:{c:'w',cls:'bar',n:'斩魂之刃',d:'狂暴伤害 +25%',e:{skd:{bbers:25}}},
 pw_emberheart:{c:'j',cls:'sor',n:'烬心坠',d:'爆炎球伤害 +25%',e:{skd:{mfball:25}}},
 pw_frostcore:{c:'j',cls:'sor',n:'霜蚀之心',d:'暴雪伤害 +20%',e:{skd:{mbliz:20}}},
 pw_surge:{c:'w',cls:'sor',n:'电涌法杖',d:'穿云电矛伤害 +25%',e:{skd:{mlit:25}}},
 pw_magma:{c:'j',cls:'dru',n:'熔心坠',d:'大地裂隙伤害 +25%',e:{skd:{dfis:25}}},
 pw_galestaff:{c:'w',cls:'dru',n:'苍岚风杖',d:'龙卷风暴伤害 +25%',e:{skd:{dtor:25}}},
 pw_beastfang:{c:'w',cls:'dru',n:'兽王獠牙',d:'召唤物伤害 +25%',e:{sum:25}},
 pw_blazequiver:{c:'w',cls:'ama',n:'燃心箭囊',d:'燎原矢伤害 +25%',e:{skd:{aimm:25}}},
 pw_blazecloak:{c:'a',cls:'ama',n:'炽羽披风',d:'最大生命 +10%，全部抗性 +10%',e:{life:10,res:10}},
 pw_thunderbadge:{c:'j',cls:'ama',n:'雷枪纹章',d:'天雷刺伤害 +25%',e:{skd:{alstr:25}}},
 pw_zealring:{c:'j',cls:'pal',n:'狂信之戒',d:'热忱连斩伤害 +25%',e:{skd:{pzeal:25}}},
 pw_judgham:{c:'w',cls:'pal',n:'审判圣锤',d:'圣佑旋锤伤害 +25%',e:{skd:{pham:25}}}});
const pbCls=k=>(EG_LP[k]&&EG_LP[k].cls)||'nec';
function pbTier(k){const v=EG().lp.arch[k];return v>=1?Math.min(3,v|0):0}
function pbFix(){const A=EG().lp;if(!A.cube)A.cube={};for(const c of['w','a','j','u'])if(!(c in A.cube))A.cube[c]=null;
 for(const k in A.arch){const v=A.arch[k];if(!(typeof v==='number'&&v>=1))A.arch[k]=1;else if(v>3)A.arch[k]=3}
 if(!A.wk||typeof A.wk!=='object')A.wk={w:0,b:{}};return A}
function pbUOpen(){return typeof egHellDone==='function'&&egHellDone()}
function pbBuildsOf(k){const c=pbCls(k);return Object.keys(PB.core).filter(b=>PB.core[b].includes(k)&&NB.builds[b]&&(c==='*'||nbBc(NB.builds[b])===c))}
// ---------- 生效集合：第 4 槽 + 上限 6 ----------
{const f=egLpRefresh;egLpRefresh=function(){f();if(!S)return;const A=pbFix();const all=EG_LPS;if(!pbUOpen()&&A.cube.u){const u=A.cube.u;if(!['w','a','j'].some(c=>A.cube[c]===u)&&!Object.values(S.eq).some(it=>it&&it.lp===u))all.delete(u)}
 const ord=[],add=k=>{if(k&&all.has(k)&&!ord.includes(k))ord.push(k)};
 for(const c of['w','a','j','u'])if(c!=='u'||pbUOpen())add(A.cube[c]);for(const s in S.eq){const it=S.eq[s];if(it&&it.lp)add(it.lp)}for(const k of all)add(k);
 EG_LPS=new Set(ord.slice(0,PB.cap));PB.over=ord.slice(PB.cap)}}
// ---------- 共鸣 ----------
function pbRes(){const b=typeof nbOn==='function'&&nbOn();if(!b||!PB.core[b])return{lv:0,b:b||null,n:0};const B=NB.builds[b],cs=PB.core[b],n=cs.filter(k=>EG_LPS.has(k)).length;
 const lv=n>=3?2:n>=2?1:0,full=nbSetN(B.set)>=6,k=(full?0.5:1)*(PB.tgt[b]==='sum'?PB.sumK:1);return{b,n,lv,full,pct:((lv>=1?PB.r1:0)+(lv>=2?PB.r2:0))*k,mech:lv>=2&&!full}}
function pbTgtN(b){const t=PB.tgt[b];if(t==='sum')return'召唤物';if(t)return t.map(id=>SKM[id]?SKM[id].n:id).join('、');const c=NB.builds[b].core;return SKM[c]?SKM[c].n:c}
const PB_MECHN={echo:'回响',split:'分裂',burst:'爆裂',boom:'骸爆',plague:'疫爆'};
function pbMechOf(b){const B=NB.builds[b];return PB.necMech[b]||B.mech}
function pbApply(){if(!ST||!ST.nb)return;const N=ST.nb;N.skd=N.skd||{};
 for(const k of EG_LPS){const L=EG_LP[k];if(!L||!L.e)continue;const t=PB.tierK[pbTier(k)]||1,e=L.e;
  if(e.skd)for(const id in e.skd)N.skd[id]=(N.skd[id]||0)+Math.round(e.skd[id]*t);
  if(e.sum)ST.sumdmg=(ST.sumdmg||0)+Math.round(e.sum*t);if(e.pois)N.pois=(N.pois||0)+Math.round(e.pois*t);
  if(e.res&&ST.res)for(const r in ST.res)ST.res[r]=Math.min(75,ST.res[r]+Math.round(e.res*t));
  if(e.life)ST.life=Math.round(ST.life*(1+e.life*t/100))}
 const R=pbRes();ST.pbr=R;if(!R.lv)return;const b=R.b,t=PB.tgt[b];
 if(t==='sum')ST.sumdmg=(ST.sumdmg||0)+R.pct;else for(const id of(t||[NB.builds[b].core]))N.skd[id]=(N.skd[id]||0)+R.pct;
 if(R.mech){const m=pbMechOf(b),B=NB.builds[b];if(PB.necMech[b]||m==='boom')N[m]=true;else if(!(N.mech||[]).some(x=>x.id===B.core&&x.t===m))(N.mech=N.mech||[]).push({t:m,id:B.core})}}
{const f=calc;calc=function(...a){const r=f.apply(this,a);try{pbApply()}catch(e){console.warn('pb calc',e)}return r}}
// ---------- 品阶：重复收录 +1 ----------
{const f=egLpExtract;egLpExtract=function(uid){const fi=findItem(uid),k=fi&&fi.it&&fi.it.lp,A=pbFix(),t0=k?pbTier(k):0,inBag=k&&S.bag.includes(fi.it);f(uid);
 if(k&&inBag&&!S.bag.includes(fi.it)){if(t0>=1&&t0<3){A.arch[k]=t0+1;log(`<b style="color:${EG_LEG.c}">威能【${EG_LP[k].n}】升至 ${t0+1} 阶</b>`)}else A.arch[k]=Math.max(1,t0);calc();egRefresh()}}}
// ---------- 掉落倾向 ----------
function pbDeep(){return(S&&S.diff===2)||(typeof EGM!=='undefined'&&EGM&&(EGM.k==='rift'||EGM.k==='mj'))}
{const f=egLpRoll;egLpRoll=function(it){const k=f(it);try{const b=nbOn();if(b&&PB.core[b]&&pbDeep()&&rnd()<PB.bias){const c=egLpCat(it),ic=itemCls(it)||curCls();
 const cs=PB.core[b].filter(x=>EG_LP[x].c===c&&(pbCls(x)==='*'||pbCls(x)===ic));if(cs.length)return pick(cs)}}catch(e){}return k}}
// ---------- 秘晶兑换 ----------
const pbWeek=()=>Math.floor((Date.now()+8*3600e3-4*86400e3)/604800e3);
function pbWk(){const A=pbFix(),w=pbWeek();if(A.wk.w!==w){A.wk.w=w;A.wk.b={}}return A.wk}
function pbBuy(k){const b=nbOn();if(!b||!PB.core[b].includes(k))return;const M=egMj(),A=pbFix(),W=pbWk();
 if(W.b[b])return toast('本周该流派已兑换');if(pbTier(k)>=3)return toast('已满阶');if(M.cr<PB.price)return toast(`需要 ${PB.price} 秘晶`);
 if(!window.__NOUI&&typeof confirm==='function'&&!confirm(`花费 ${PB.price} 秘晶：核心威能【${EG_LP[k].n}】${pbTier(k)?'+1 阶':'收录'}？`))return;
 M.cr-=PB.price;W.b[b]=1;A.arch[k]=Math.min(3,pbTier(k)+1);const c=EG_LP[k].c;if(!A.cube[c])A.cube[c]=k;
 log(`秘晶兑换：威能【${EG_LP[k].n}】${A.arch[k]} 阶`);toast('兑换成功');calc();save();egRefresh()}
function pbExHtml(){const b=nbOn();if(!b||!PB.core[b])return'';const M=egMj(),W=pbWk(),done=!!W.b[b];
 return`<div class="gp pbex"><h3>核心威能兑换 <span class="r">◆秘晶 ×${M.cr}</span></h3>${PB.core[b].map(k=>`<div class="row"><span>◆${EG_LP[k].n} <span class="dim">${pbTier(k)?pbTier(k)+'阶':'未收录'}</span></span><button class="btn xs ${!done&&M.cr>=PB.price&&pbTier(k)<3?'gold':''}" onclick="pbBuy('${k}')">◆${PB.price}</button></div>`).join('')}<div class="dim">${NB.builds[b].n}：每周限兑换 1 次（周一刷新），收录或 +1 阶。</div></div>`}
{const p=typeof EG_PAGES!=='undefined'&&EG_PAGES.find(x=>x.k==='mj');if(p){const f=p.render;p.render=function(...a){const h=f.apply(this,a);try{return h+pbExHtml()}catch(e){return h}}}}
// ---------- 炼金匣：威能重铸（保底）----------
function pbCubeSrc(c){return S.bag.filter(it=>!it.k&&it.lp&&EG_LP[it.lp]&&EG_LP[it.lp].c===c)}
const pbPerf=x=>x.k==='gem'&&x.lv===4;
{const f=cubeRecipes;cubeRecipes=function(){const rec=f();try{if(bagHas(pbPerf))for(const c of['w','a','j'])if(pbCubeSrc(c).length>=3)rec.push([`威能重铸：3 件${EG_LPC[c]}类威能装备 + 1 颗完美宝石 → 本职业${EG_LPC[c]}类威能（优先未收录 / 当前流派核心）`,`pbCube('${c}')`])}catch(e){}return rec}}
function pbCube(c){const src=pbCubeSrc(c);if(src.length<3||!bagHas(pbPerf))return false;src.sort((x,y)=>power(x)-power(y));const keep=src[src.length-1],gone=src.slice(0,2);
 const cc=curCls(),A=pbFix(),pool=Object.keys(EG_LP).filter(k=>EG_LP[k].c===c&&(pbCls(k)===cc||pbCls(k)==='*'));const b=nbOn(),core=b&&PB.core[b]?PB.core[b].filter(k=>pool.includes(k)&&pbTier(k)<3):[];
 const fresh=pool.filter(k=>!A.arch[k]);const k=core.length?pick(core):fresh.length?pick(fresh):pick(pool);
 for(const it of gone)S.bag.splice(S.bag.indexOf(it),1);takeBag(pbPerf,1);keep.lp=k;
 log(`<b style="color:${EG_LEG.c}">威能重铸：${itemName(keep)} 获得【${EG_LP[k].n}】</b>`);toast('威能重铸成功');if(typeof save==='function')save();if(typeof closeM==='function'&&!window.__NOUI)closeM();if(typeof render==='function')render();return true}
// ---------- 物品详情：核心标签 ----------
{const f=showItem;showItem=function(uid){f(uid);try{const fi=findItem(uid);if(!fi||!fi.it||!fi.it.lp)return;const bs=pbBuildsOf(fi.it.lp);if(!bs.length)return;const e=document.querySelector('#modal .eglp.egsep');if(!e)return;
 const cur=nbOn();e.insertAdjacentHTML('beforeend',`<div class="pbtag">${bs.map(b=>`<span class="${b===cur?'on':''}">◆${NB.builds[b].n}核心</span>`).join('')}</div>`)}catch(e){}}}
// ---------- 熔炼匣页面 ----------
function pbStars(k){const t=pbTier(k);return t?'★'.repeat(t):''}
function pbNm(k){return(typeof egLpName==='function'?egLpName(k):EG_LP[k].n)}
function pbCard(){const R=pbRes();if(!R.b)return`<div class="gp pbcard"><div class="pbh"><b>威能共鸣</b><span class="dim">未选流派</span></div><div class="dim">在技能页选择流派后，凑齐该流派 2 / 3 个核心威能即可触发共鸣。威能单体效果照常生效。</div></div>`;
 const B=NB.builds[R.b],cs=PB.core[R.b],dots=cs.map(k=>EG_LPS.has(k)?'●':'○').join('');const k=(R.full?0.5:1)*(PB.tgt[R.b]==='sum'?PB.sumK:1);
 return`<div class="gp pbcard"><div class="pbh"><b>${B.ic||''} ${B.n}</b><span class="pblv l${R.lv}">${R.lv?'共鸣 '+(R.lv===2?'II':'I'):'未共鸣'} ${dots}</span></div>
 <div class="pbcs">${cs.map(x=>`<span class="${EG_LPS.has(x)?'on':''}">${EG_LPS.has(x)?'✔':'○'}${EG_LP[x].n}${pbStars(x)}<small>${EG_LPC[EG_LP[x].c]}</small></span>`).join('')}</div>
 <div class="${R.lv>=1?'g':'dim'}">I（2 核心）：${pbTgtN(R.b)}伤害 +${PB.r1*k}%</div><div class="${R.lv>=2?'g':'dim'}">II（3 核心）：再 +${PB.r2*k}%${R.full?'':`，获得【${PB_MECHN[pbMechOf(R.b)]||'流派机制'}】（同 6 件机制）`}</div>
 ${R.full?'<div class="pbwarn">6 件套已提供机制：共鸣数值减半</div>':''}</div>`}
function pbSlots(){const A=pbFix(),u=pbUOpen();return['w','a','j','u'].map(c=>{const k=A.cube[c],lock=c==='u'&&!u,core=k&&pbBuildsOf(k).includes(nbOn());
 return`<div class="pbslot ${lock?'lock':''}" onclick="${lock?"toast('击败地狱第五章首领后解锁通用槽')":`pbPick('${c}')`}"><b>${c==='u'?'通用':EG_LPC[c]}</b><span>${lock?'🔒 地狱通关解锁':k?`${core?'◆':''}${EG_LP[k].n}<i>${pbStars(k)}</i>${EG_LPS.has(k)?'':' <small class="dim">未生效</small>'}`:'<span class="dim">空 · 点击选择</span>'}</span></div>`}).join('')}
function pbPick(c){const A=pbFix(),b=nbOn(),cs=b&&PB.core[b]||[];const ok=k=>(typeof egLpOk!=='function'||egLpOk(k));
 const L=Object.keys(EG_LP).filter(k=>(c==='u'||EG_LP[k].c===c)&&A.arch[k]&&ok(k)).sort((x,y)=>(cs.includes(y)-cs.includes(x))||(pbTier(y)-pbTier(x)));
 const row=k=>`<div class="pbopt ${A.cube[c]===k?'on':''}" onclick="pbSet('${c}','${k}')"><span>${cs.includes(k)?'◆':''}${pbNm(k)}<i>${pbStars(k)}</i></span><small class="dim">${EG_LP[k].d}</small></div>`;
 modal(`<div class="mtitle">${c==='u'?'通用':EG_LPC[c]}槽</div><div class="pbsheet">${A.cube[c]?`<div class="pbopt" onclick="pbSet('${c}','')"><span>卸下</span></div>`:''}${L.map(row).join('')||'<div class="dim">尚未收录可用威能</div>'}</div><div class="dim">◆ 当前流派核心 · ★ 品阶 · 点空白处关闭</div>`)}
function pbSet(c,k){const A=pbFix();if(k&&!A.arch[k])return;for(const x in A.cube)if(k&&x!==c&&A.cube[x]===k)A.cube[x]=null;A.cube[c]=k||null;calc();closeM();egRefresh()}
function pbPage(){const A=pbFix();egLpRefresh();const tabs=[['slot','匣槽'],['act','生效'],['arch','图鉴'],['bag','背包']].map(([k,n])=>`<button class="btn xs ${PB.tab===k?'on':''}" onclick="PB.tab='${k}';egRefresh()">${n}</button>`).join('');
 let body='';const cc=curCls(),cs=(nbOn()&&PB.core[nbOn()])||[];
 if(PB.tab==='slot')body=`<div class="gp"><h3>${EG_LEG.cube} <span class="r dim">生效 ${EG_LPS.size}/${PB.cap}</span></h3>${pbSlots()}<div class="dim">提取：物品详情「提取威能」（摧毁物品，1 宝石 + 金币）。重复收录同名威能 +1 阶（最高 3 阶）。</div></div>`;
 else if(PB.tab==='act'){const eqp=Object.values(S.eq).filter(it=>it&&it.lp);body=`<div class="gp"><h3>当前生效 ${EG_LPS.size}/${PB.cap}</h3>${[...EG_LPS].map(k=>`<div class="row"><span class="eglp">${cs.includes(k)?'◆':''}${EG_LP[k].n}${pbStars(k)}</span><span class="dim">${EG_LP[k].d}</span></div>`).join('')||'<div class="dim">无</div>'}
  ${PB.over.length?`<div class="pbwarn">超出上限未生效：${PB.over.map(k=>EG_LP[k].n).join('、')}</div>`:''}${eqp.length?`<div class="dim">来自装备：${eqp.map(it=>itemName(it)).join('、')}</div>`:''}</div>`}
 else if(PB.tab==='arch'){const ks=Object.keys(EG_LP).filter(k=>pbCls(k)===cc||pbCls(k)==='*');body=`<div class="gp"><h3>威能图鉴 <span class="r dim">${ks.filter(k=>A.arch[k]).length}/${ks.length}</span></h3>${ks.map(k=>`<div class="row"><span class="${A.arch[k]?'eglp':'dim'}">${A.arch[k]?'✔':'○'}${cs.includes(k)?'◆':''}${EG_LP[k].n}${pbStars(k)} <small class="dim">${EG_LPC[EG_LP[k].c]}</small></span><span class="dim" style="text-align:right">${EG_LP[k].d}</span></div>`).join('')}</div>`}
 else{const bagL=S.bag.filter(it=>it.lp);body=`<div class="gp"><h3>背包中的威能装备</h3>${bagL.length?`<div class="grid">${bagL.map(it=>cell(it,`showItem(${it.uid})`)).join('')}</div>`:'<div class="dim">暂无。暗金 25% 带威能，稀有 3% 升格为「传说」；地狱 / 秘境 40% 优先出当前流派核心威能。</div>'}</div>`}
 return pbCard()+`<div class="btns pbtabs">${tabs}</div>`+body}
{const p=typeof EG_PAGES!=='undefined'&&EG_PAGES.find(x=>x.k==='power');if(p)p.render=pbPage}
document.head.insertAdjacentHTML('beforeend',`<style>
.pbcard .pbh{display:flex;justify-content:space-between;align-items:center;gap:6px}.pbcard .g{color:#8f8}.pblv{font-size:12px;color:#aaa;white-space:nowrap}.pblv.l1{color:#ffd27a}.pblv.l2{color:#ff9a3c}
.pbcs{display:flex;gap:4px;margin:6px 0}.pbcs span{flex:1;min-width:0;font-size:12px;padding:3px 4px;border:1px solid #333;border-radius:4px;color:#888;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pbcs span.on{color:#ffb070;border-color:#7a4a20}.pbcs small{display:block;color:#666;font-size:10px}
.pbwarn{color:#e9a;font-size:12px;margin-top:4px}.pbtabs{display:flex;flex-wrap:nowrap;gap:4px;margin:6px 0}.pbtabs .btn{flex:1;min-width:0}
.pbslot{display:flex;gap:8px;align-items:center;padding:8px 6px;border-bottom:1px solid #2a2a2a;cursor:pointer}.pbslot b{width:34px;flex:none;color:#aaa;font-size:12px}.pbslot span{flex:1;min-width:0;color:#ffb070}.pbslot i,.pbopt i{color:#ffd27a;font-style:normal;font-size:11px;margin-left:2px}.pbslot.lock span{color:#666}
.pbsheet{max-height:60vh;overflow:auto}.pbopt{padding:8px 4px;border-bottom:1px solid #2a2a2a;cursor:pointer}.pbopt span{color:#ffb070;display:block}.pbopt.on{background:#2a1c10}
.pbtag{margin-top:4px;display:flex;flex-wrap:wrap;gap:4px}.pbtag span{font-size:11px;padding:1px 5px;border:1px solid #6a4a20;border-radius:3px;color:#c9a070}.pbtag span.on{color:#ffb070;border-color:#ff9a3c}
.pbex .row{align-items:center}</style>`);
