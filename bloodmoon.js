// 血月之地 + 破障护符（运行时包装 mkMon/rollTC/resOf/charmMods/calc/itemIcon/renderMap/showItem）
// 每真实 1 小时，当前难度已肃清区域中随机 1 个成为「血月之地」：怪物等级=max(原, 角色等级+2，≤99)、经验 +50%、品质 +50%、
// 精英/头目必掉 1 件魔法以上；专属掉落「破障护符」6 种。秘境/虚隙等终局模式中不生效。
// 破障护符（小护身符，背包生效，同类不叠加）：目标该伤害类型有效抗性上限 80→40（含免疫）；代价：自身同系抗性 -25（骨裂/虚空无对应抗性，改为所有抗性 -10/-15）。
const BM={XP:1.5,MF:50,LV:2,CAP:40,P:{boss:0.08,uniq:0.03,champ:0.015,n:0.002},
 WARD:{fire:{n:'烈焰',ic:'ward_fire',m:{fres:-25}},cold:{n:'冰封',ic:'ward_cold',m:{cres:-25}},light:{n:'雷鸣',ic:'ward_lit',m:{lres:-25}},
  pois:{n:'剧毒',ic:'ward_pois',m:{pres:-25}},phys:{n:'骨裂',ic:'ward_phys',m:{allres:-10}},magic:{n:'虚空',ic:'ward_void',m:{allres:-15}}}};
function bmHour(t){return Math.floor((t||Date.now())/3600e3)}
function bmCands(d){const o=[];ACTS.forEach((A,a)=>{const cl=a===S.act&&d===S.diff?S.cleared:(S.CL&&S.CL[pkey(a,d)])||{};A.zones.forEach((z,i)=>{if(cl[i])o.push([a,i])})});return o}
function bmCur(){if(typeof S!=='object'||!S)return null;const h=bmHour(),d=S.diff;if(S.bm&&S.bm.h===h&&S.bm.d===d&&S.bm.a!=null)return S.bm;
 const c=bmCands(d);if(!c.length)return null;let x=(h*2654435761+d*97)>>>0;x^=x>>>13;const [a,i]=c[x%c.length];S.bm={h,d,a,i};return S.bm}
function bmHere(){if(typeof EGM!=='undefined'&&EGM)return false;const b=bmCur();return!!(b&&b.a===S.act&&b.d===S.diff&&b.i===S.zone)}
function bmLeft(){return 60-Math.floor((Date.now()%3600e3)/60e3)}
{const f=mkMon;mkMon=function(key,lv,flag){let L=lv;const here=bmHere();if(here)L=Math.max(lv,Math.min(99,(S.lvl||1)+BM.LV));const m=f.call(this,key,L,flag);if(here&&m){m.exp*=BM.XP;m.bm=1}return m}}
function wardMake(k){const W=BM.WARD[k];if(!W)return null;const it=makeBase(BASEM.cha_s,Math.min(99,(S&&S.lvl)||1));it.q=5;it.name='破障护符·'+W.n;it.ward=k;it.req=1;it.m=Object.assign({},W.m);it.uid=S.uid++;return it}
{const f=rollTC;rollTC=function(m){if(!m||!m.bm||!bmHere())return f.apply(this,arguments);let mf=null;if(ST){mf=ST.mf;ST.mf=mf+BM.MF}let o;try{o=f.apply(this,arguments)}finally{if(mf!=null)ST.mf=mf}
 try{const el=m.fl==='champ'||m.fl==='uniq'||m.boss;if(el&&!o.some(it=>it&&!it.k&&it.q>=3))o.push(genItem(m.lv,{q:3}));
  const p=m.boss?BM.P.boss:m.fl==='uniq'?BM.P.uniq:m.fl==='champ'?BM.P.champ:BM.P.n;if(rnd()<p){const ks=Object.keys(BM.WARD);o.push(wardMake(ks[Math.floor(rnd()*ks.length)]))}}catch(e){console.warn(e)}return o}}
// 背包破障：同类只算一件
{const f=charmMods;charmMods=function(){const bag=S.bag;const seen={},keep=[];for(const it of bag||[]){if(it&&it.ward){if(seen[it.ward])continue;seen[it.ward]=1}keep.push(it)}S.bag=keep;try{return f.apply(this,arguments)}finally{S.bag=bag}}}
function bmWards(){const w={};for(const it of (S&&S.bag)||[])if(it&&it.ward&&BM.WARD[it.ward])w[it.ward]=1;return w}
{const f=calc;calc=function(){const r=f.apply(this,arguments);try{if(ST)ST.ward=bmWards()}catch(e){}return r}}
{const f=resOf;resOf=function(m,k){const r=f(m,k);return ST&&ST.ward&&ST.ward[k]&&r>BM.CAP?BM.CAP:r}}
{const f=itemIcon;itemIcon=function(it){if(it&&it.ward&&BM.WARD[it.ward])return`<i class="ii art ic2 chm c1 bmw" style="background-image:url(assets/icon2/abyss/${BM.WARD[it.ward].ic}.webp);background-size:contain;background-position:center;background-repeat:no-repeat"></i>`;return f(it)}}
{const f=showItem;showItem=function(uid){const r=f.apply(this,arguments);try{const fi=findItem(uid),it=fi&&fi.it;const p=document.querySelector('#modal .ipanel');if(it&&it.ward&&p&&!p.querySelector('.bmward')){
 const h=`<div class="sec bmward">破障：目标<b>${ELN[it.ward]}</b>系有效抗性上限 80→${BM.CAP}（含免疫）<br><small class="dim">放在背包生效，同类不叠加 · 血月之地专属掉落</small></div>`;const b=p.querySelector('.btns');if(b)b.insertAdjacentHTML('beforebegin',h);else p.insertAdjacentHTML('beforeend',h)}}catch(e){console.warn(e)}return r}}
{const f=renderMap;renderMap=function(){const r=f.apply(this,arguments);try{const b=bmCur(),P=$('#panel');if(!b||P.querySelector('.bmbar'))return r;const z=ACTS[b.a].zones[b.i];
 const ac=P.querySelector('.actc');if(ac)ac.insertAdjacentHTML('afterend',`<div class="gp bmbar"><img src="assets/ui2/bloodmoon_64.webp" alt=""><span>血月之地：<b>${z.n}</b></span><small class="dim">${bmLeft()} 分后转移</small><button class="btn xs" onclick="event.stopPropagation();mapGo(${b.a},${b.d},${b.i})">前往</button></div>`);
 if(MAPA===b.a&&MAPD===b.d){const row=P.querySelectorAll('.zc')[b.i];if(row){row.classList.add('bmz');const t=row.querySelector('b');if(t)t.insertAdjacentHTML('afterend','<span class="tag bmt">血月</span>')}}}catch(e){console.warn(e)}return r}}
