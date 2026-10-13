'use strict';
// ===== 3. 魂阶：满级后经验转为魂阶经验，每阶 1 点，分配到 主属性 / 攻击 / 防御 / 挂机效率 四类（每项有上限） =====
function egPv(k){const P=EG().para.pts;return P[k]||0}
function egPstat(k){for(const c of EG_PARA.cats)for(const s of c.stats)if(s[0]===k)return s;return null}
function egPval(k){const s=egPstat(k);return s?egPv(k)*s[2]:0}
function egPfree(){const P=EG().para;let u=0;for(const k in P.pts)u+=P.pts[k];return P.lv-u}
function egParaShare(){return S.lvl>=99?1:S.lvl>=EG_PARA.start?EG_PARA.share:0}
egOn('xp',x=>{x=x*(1+egPval('xp')/100);const sh=egParaShare();if(sh>0)egParaGain(x*sh);return x});
function egParaGain(x){const P=EG().para;P.xp+=x;let up=0;while(P.xp>=EG_PARA.need(P.lv)){P.xp-=EG_PARA.need(P.lv);P.lv++;up++}
 if(up){log(`<b style="color:#c0a0ff">${EG_PARA.n}提升至 ${P.lv}（可分配 ${egPfree()} 点）</b>`);toast(EG_PARA.n+' '+P.lv);egStat('para',up);if(EG().para.auto)egParaAuto();egRefresh()}}
// 主属性：calc 前临时加到 S.at（显示为装备加成样式的 +n）
egOn('pre',()=>{const a={str:egPval('str'),dex:egPval('dex'),vit:egPval('vit'),ene:egPval('ene')};if(!a.str&&!a.dex&&!a.vit&&!a.ene)return null;for(const k in a)S.at[k]+=a[k];return()=>{for(const k in a)S.at[k]-=a[k]}});
egOn('calc',o=>{const v=egPval;o.egSpd=(o.egSpd||0)+v('spd');o.sumdmg+=v('sumdmg');o.sumlife+=v('sumlife');o.mf+=v('mf');o.gf+=v('gf');o.dr+=v('dr');o.dsx=Math.min(75,(o.dsx||0)+v('dsx'));
 if(v('lifep'))o.life=Math.round(o.life*(1+v('lifep')/100));if(v('defp'))o.def=Math.round(o.def*(1+v('defp')/100));
 if(v('allres'))for(const k in o.res)o.res[k]=Math.min(75,o.res[k]+v('allres'));
 if(v('fcr')){o.fcr+=v('fcr');const bp=[0,9,18,30,48,75,125],fr=[15,14,13,12,11,10,9];let i=0;while(i<bp.length-1&&o.fcr>=bp[i+1])i++;o.castT=fr[i]/25;o.fcrBP=bp[i]}});
// 法术伤害%：英雄造成的伤害（含尸爆、毒）提高
const _eg_hitMon=hitMon;hitMon=function(m,d,src,fxc){if(src==='hero'&&ST&&ST.egSpd){const k=1+ST.egSpd/100,d2={};for(const x in d)d2[x]=d[x]*k;d=d2}return _eg_hitMon(m,d,src,fxc)};
function egParaAdd(k,n){const s=egPstat(k);if(!s)return;const P=EG().para;n=Math.min(n,egPfree(),s[3]-egPv(k));if(n<=0)return;P.pts[k]=egPv(k)+n;calc();egRefresh()}
function egParaReset(){EG().para.pts={};calc();egRefresh()}
// 自动分配：按 体力→法术伤害→召唤物伤害→全抗→生命%→寻宝… 轮转
const EG_PAUTO=['vit','spd','sumdmg','allres','lifep','mf','fcr','dr','xp','ene','dsx','sumlife','defp','gf','str','dex'];
function egParaAuto(){let g=0;while(egPfree()>0&&g++<999){const k=EG_PAUTO.find(k=>egPv(k)<egPstat(k)[3]&&(EG_PAUTO.indexOf(k)<4?egPv(k)<=Math.min(...EG_PAUTO.slice(0,4).map(egPv)):true));if(!k)break;EG().para.pts[k]=egPv(k)+1}calc()}
function egParaLock(){return S.lvl>=EG_PARA.start||EG().para.lv>0?null:`角色达到 ${EG_PARA.start} 级后，部分经验将凝为${EG_PARA.n}；99 级后全部经验转为${EG_PARA.n}`}
function egParaPage(){const P=EG().para,need=EG_PARA.need(P.lv),f=egPfree();
 return`<div class="gp"><h3>${EG_PARA.n} ${P.lv} <span class="r dim">经验注入 ${Math.round(egParaShare()*100)}%</span></h3>${egPbar(P.xp,need)}<div class="dim">${fmt(P.xp)} / ${fmt(need)} · 可分配 <b class="quest">${f}</b> 点</div>
 <div class="btns"><button class="btn sm ${P.auto?'on':''}" onclick="EG().para.auto^=1;if(EG().para.auto)egParaAuto();egRefresh()">自动分配</button><button class="btn sm" onclick="egParaReset()">重置（免费）</button></div></div>
 ${EG_PARA.cats.map(c=>`<div class="gp"><h3>${c.ic} ${c.n}</h3>${c.stats.map(([k,n,per,cap])=>`<div class="egpt"><span>${n} <b>+${+(egPv(k)*per).toFixed(1)}</b> <span class="dim">(${egPv(k)}/${cap}，每点+${per})</span></span><span><button class="btn xs" ${f&&egPv(k)<cap?'':'disabled'} onclick="egParaAdd('${k}',1)">+1</button> <button class="btn xs" ${f&&egPv(k)<cap?'':'disabled'} onclick="egParaAdd('${k}',10)">+10</button></span></div>`).join('')}</div>`).join('')}`}
egPage({k:'para',n:EG_PARA.n,lock:egParaLock,render:egParaPage,dot:()=>egPfree()>0});
EG_BANNER.push(()=>'');// 占位：保持横幅顺序
const _eg_rf_para=renderFight;renderFight=function(){_eg_rf_para();const P=EG().para;if(P.lv){const e=document.querySelector('#ftop .lvt');if(e&&!e.dataset.eg){e.innerHTML+=` <small style="color:#c0a0ff">✦${P.lv}</small>`}}};
