'use strict';
const $=s=>document.querySelector(s);
const rnd=Math.random,R=(a,b)=>a+Math.floor(rnd()*(b-a+1)),pick=a=>a[Math.floor(rnd()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fmt=n=>n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e4?(n/1e3).toFixed(1)+'K':Math.floor(n)+'';
function wpick(arr,wf){let t=0;for(const x of arr)t+=wf(x);let r=rnd()*t;for(const x of arr){r-=wf(x);if(r<0)return x}return arr[arr.length-1]}
// ===== 资源加载 =====
const IMG={};
function loadAssets(){for(const k in ASSETS){const i=new Image();i.onload=()=>{IMG[k]=ASSETS[k]};i.src=ASSETS[k]}}
function art(key,glyph,cls=''){return IMG[key]?`<img class="art ${cls}" src="${IMG[key]}">`:`<span class="glyph ${cls}">${glyph}</span>`}

// ===== 存档 =====
const KEY='anye_d2_v2';let S;
function newSave(){return{v:2,lvl:1,xp:0,gold:0,at:{str:15,dex:25,vit:15,ene:25},sp:0,kp:0,sk:{rs:1},eq:{},bag:[],uid:1,
 autoSk:1,autoAt:1,autoEq:1,act:0,zone:0,wave:0,unl:0,cleared:{},q:{},pot:{hp:5,mp:3,rej:1,tp:3},auto:1,main:null,curse:null,diff:0,
 imbue:0,found:{},kpm:0,last:Date.now(),sell:{0:1,1:1,2:0,3:0},log:[]}}
// 存档仅存于内存 GS（云端为唯一真相，见 cloud.js）；不再写入 localStorage
const GS=(()=>{const m=new Map();return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>{v=String(v);if(m.get(k)!==v){m.set(k,v);if(typeof clDirty==='function')clDirty()}},removeItem:k=>{m.delete(k)},keys:()=>[...m.keys()],clear:()=>m.clear()}})();
function load(){try{S=JSON.parse(GS.getItem(KEY))}catch(e){S=null}if(!S||S.v!==2){S=newSave();for(const b of['wand1','shd1']){const it=makeBase(BASEM[b],1);S.eq[BASEM[b].s]=it}}}
function save(){S.last=Date.now();GS.setItem(KEY,JSON.stringify(S))}

// ===== 物品属性计算 =====
function slotOf(b){return b.s==='ring'?'ring':b.s}
function itemGroups(b){if(b.s==='weapon')return'W';if(b.jew)return'J';let g='A';if(b.cat==='head')g+='H';if(b.s==='gloves')g+='G';return g}
function sockCat(b){return b.s==='weapon'?'w':(b.s==='shield'?'s':'a')}
function socketMods(it){const b=BASEM[it.b],m={},c=sockCat(b);
 for(const x of it.soc||[]){let e;if(x.g){const G=GEMS[x.g];e=(c==='w'?G.w:c==='s'?G.s:G.a)(x.lv)}else{const r=RUNES[x.r];e=c==='w'?r[2]:r[3]}for(const k in e)m[k]=(m[k]||0)+e[k]}
 if(it.rw!=null){const w=RUNEWORDS[it.rw].m;for(const k in w)m[k]=(m[k]||0)+w[k]}return m}
function allMods(it){const m=Object.assign({},it.m),s=socketMods(it);for(const k in s)m[k]=(m[k]||0)+s[k];return m}
function itemLocal(it){const b=BASEM[it.b],m=allMods(it),o={};
 if(b.dmg){const ed=(m.edmg||0)/100;o.min=Math.floor(it.dmg[0]*(1+ed))+(m.mindmg||0);o.max=Math.max(o.min+1,Math.floor(it.dmg[1]*(1+ed))+(m.maxdmg||0))}
 if(b.def){o.def=Math.floor(it.def*(1+(m.edef||0)/100))+(m.def||0)}return o}
function itemReq(it){const b=BASEM[it.b];let l=it.req||0;for(const x of it.soc||[])if(x.r!=null)l=Math.max(l,RUNES[x.r][1]);if(it.rw!=null)l=Math.max(l,RUNEWORDS[it.rw].lv);
 const f=it.q===0?0.8:1;return{lv:l,str:Math.floor((b.str||0)*f),dex:Math.floor((b.dex||0)*f)}}
function canEquip(it){const r=itemReq(it),A=ST?ST.attr:S.at;if(BASEM[it.b]&&BASEM[it.b].cls&&typeof curCls==='function'&&(BASEM[it.b].ccls||'nec')!==curCls())return false;return S.lvl>=r.lv&&A.str>=r.str&&A.dex>=r.dex}
function itemName(it){if(!it)return'损坏物品';if(it.k==='gem')return GEMS[it.g]?(GEMG[it.lv]||'')+GEMS[it.g].n:'未知宝石';if(it.k==='rune')return RUNES[it.r]?RUNES[it.r][0]+'符文':'未知符文';return it.rw!=null?(RUNEWORDS[it.rw]?RUNEWORDS[it.rw].n:'未知符文之语'):(it.name||'未知物品')}
function itemColor(it){if(it.k==='gem')return GEMS[it.g].c;if(it.k==='rune')return'#ffa040';if(it.rw!=null)return QC[8];if((it.q===1||it.q===2)&&it.sock)return'#a0a0a0';return QC[it.q]}
function power(it){if(it.k)return 0;const m=allMods(it),l=itemLocal(it);let p=(l.def||0)*1+((l.min||0)+(l.max||0))*2;
 const w={str:3,dex:3,vit:4,ene:3,life:2,mana:1.5,ar:.2,fres:1.5,cres:1.5,lres:1.5,pres:1.2,allres:6,allsk:120,t0sk:60,t1sk:60,t2sk:60,fcr:3,mf:2,gf:.3,ll:8,ml:6,ias:3,regen:6,mpk:8,undead:.5,firemin:4,coldmin:4,lightmax:2,poisdmg:.3,tdef:1,dr:8,mdr:6,fhr:1.5,block:2,thorns:1,mregen:1,dmgmana:1,sumdmg:2,sumlife:2};
 for(const k in m){if(k.startsWith('sk_'))p+=m[k]*45;else p+=(w[k]||0)*m[k]}return Math.max(1,Math.round(p))}

// ===== 品质判定（原版公式结构） =====
const QRATIO={u:[400,1,6400],s:[160,2,5600],r:[100,2,3200],m:[34,3,192],h:[12,8,0],n:[2,2,0]};
function qRoll(k,ilvl,qlvl,mfEff,bossMod){const[b,d,mn]=QRATIO[k];let c=Math.floor((b-(ilvl-qlvl)/d)*128);
 if(mfEff)c=Math.floor(c*100/(100+mfEff));if(c<mn)c=mn;if(bossMod)c=Math.floor(c-c*bossMod/1024);return Math.floor(rnd()*c)<128}
function alvlOf(ilvl,qlvl){if(qlvl>ilvl)ilvl=qlvl;let a=ilvl<99-qlvl/2?ilvl-Math.floor(qlvl/2):2*ilvl-99;return clamp(a,1,99)}
function maxSock(b,ilvl){const s=b.sock;if(!s)return 0;return ilvl<=25?s[0]:ilvl<=40?s[1]:s[2]}
function rollAff(list,b,alvl,used){const g=itemGroups(b);const c=list.filter(a=>a[1]<=alvl&&(a[2]==='*'||[...a[2]].some(x=>g.includes(x)))&&!used.has(a[3]));
 if(b.s!=='weapon'&&!b.sock){/*无凹槽部位不出嵌工*/}const f=c.filter(a=>!(a[3]==='sockp'&&!b.sock));if(!f.length)return null;
 // 高等级词缀权重略低
 const a=wpick(f,x=>1+ (alvl-x[1])*0.05);used.add(a[3]);return a}
function applyAff(it,a,b,ilvl){let v=R(a[4],a[5]);if(a[3]==='sockp'){it.sock=Math.max(it.sock||0,Math.min(v,maxSock(b,ilvl)||1));return}
 it.m[a[3]]=(it.m[a[3]]||0)+v;it.req=Math.max(it.req||0,Math.floor(a[1]*0.85))}
function makeBase(b,ilvl){const it={uid:S.uid++,b:b.id,q:1,il:ilvl,m:{},soc:[],sock:0};if(b.dmg)it.dmg=b.dmg.slice();if(b.def)it.def=R(b.def[0],b.def[1]);return it}
function pickBase(ilvl,slot){const lv=Math.ceil(Math.max(1,ilvl)/3)*3;const c=BASES.filter(b=>b.q<=lv&&(!slot||b.s===slot));return pick(c)}
function genItem(ilvl,opt={}){const b=opt.base||pickBase(ilvl,opt.slot);const it=makeBase(b,ilvl),mf=opt.mf||0,bm=opt.bossMod||0;
 const al=alvlOf(ilvl,b.q);let q=opt.q;
 if(q==null){if(qRoll('u',ilvl,b.q,mf*250/(mf+250),bm))q=5;else if(qRoll('s',ilvl,b.q,mf*500/(mf+500),bm))q=6;else if(qRoll('r',ilvl,b.q,mf*600/(mf+600),bm))q=4;
  else if(qRoll('m',ilvl,b.q,mf,bm))q=3;else if(qRoll('h',ilvl,b.q,0,0))q=2;else if(qRoll('n',ilvl,b.q,0,0))q=1;else q=0}
 if(b.jew&&q<3)q=3;
 if(q===5){const u=UNIQUES.filter(x=>x.b===b.id&&x.lv<=ilvl+2&&!opt.noUnique);if(u.length){const U=pick(u);it.q=5;it.name=U.n;it.req=U.lv;for(const k in U.m){const v=U.m[k];it.m[k]=Array.isArray(v)?R(v[0],v[1]):v}return finish(it,b)}q=4}
 if(q===6){const u=SETITEMS.filter(x=>x.b===b.id);if(u.length){const U=pick(u);it.q=6;it.name=U.n;it.set=U.set;it.req=U.lv;Object.assign(it.m,U.m);return finish(it,b)}q=3}
 it.q=q;const used=new Set();
 if(q===0){it.name='破旧的'+b.n;if(it.def)it.def=Math.floor(it.def*0.75);if(it.dmg)it.dmg=it.dmg.map(x=>Math.max(1,Math.floor(x*0.75)))}
 else if(q===1||q===2){it.name=(q===2?'精良的':'')+b.n;if(q===2){if(b.dmg)it.m.edmg=R(5,15);else if(b.def)it.m.edef=R(5,15)}
  if(maxSock(b,ilvl)&&rnd()<0.18)it.sock=R(1,maxSock(b,ilvl))}
 else if(q===3){let p=null,s=null;const r=rnd();if(r<0.75)p=rollAff(PREFIX,b,al,used);if(r>=0.25||!p)s=rollAff(SUFFIX,b,al,used);
  if(p)applyAff(it,p,b,ilvl);if(s)applyAff(it,s,b,ilvl);it.name=(s?s[0]:'')+(p?p[0]:'')+b.n}
 else if(q===4||q===7){const n=q===7?R(1,4):R(3,6);let np=0,ns=0;for(let i=0;i<n*3&&np+ns<n;i++){const isP=(np<3&&(ns>=3||rnd()<0.5));const a=rollAff(isP?PREFIX:SUFFIX,b,al,used);if(!a)continue;applyAff(it,a,b,ilvl);isP?np++:ns++}
  if(q===4)it.name=pick(RARE_A)+pick(RARE_A)+pick(RARE_B[slotOf(b)])}
 return finish(it,b)}
function finish(it,b){return it}

// ===== 角色属性汇总 =====
let ST=null;
function setCount(){const c={};for(const k of SLOTS){const it=S.eq[k];if(it&&it.set)c[it.set]=(c[it.set]||0)+1}return c}
function calc(){const M={};const add=(k,v)=>{M[k]=(M[k]||0)+v};let idef=0,wep=null;
 for(const k of SLOTS){const it=S.eq[k];if(!it)continue;const m=allMods(it);for(const x in m)if(x!=='edmg'&&x!=='edef'&&x!=='mindmg'&&x!=='maxdmg'&&!(x==='def'&&BASEM[it.b].def))add(x,m[x]);
  const l=itemLocal(it);if(l.def)idef+=l.def;if(k==='weapon')wep=l;if(BASEM[it.b].block)add('block',BASEM[it.b].block)}
 const sc=setCount();for(const s in sc){const bo=SETS[s].bonus;for(const n in bo)if(sc[s]>=+n)for(const k in bo[n])add(k,bo[n][k])}
 const A={str:S.at.str+(M.str||0),dex:S.at.dex+(M.dex||0),vit:S.at.vit+(M.vit||0),ene:S.at.ene+(M.ene||0)};
 const pen=DIFFS[S.diff].pen;const res=k=>Math.min(75,(M[k]||0)+(M.allres||0)+pen);
 const CB=typeof clsBase==='function'?clsBase():{life0:45,lpl:1.5,lpv:2,mana0:25,mpl:2,mpe:2,at:{vit:15,ene:25}};// 职业系数（classes.js；亡灵术士与原公式一致）
 const o={attr:A,M,life:Math.floor((CB.life0+(S.lvl-1)*CB.lpl+(A.vit-CB.at.vit)*CB.lpv+(M.life||0))*(1+(M.lifepct||0)/100)),mana:Math.floor((CB.mana0+(S.lvl-1)*CB.mpl+(A.ene-CB.at.ene)*CB.mpe+(M.mana||0))*(1+(M.manapct||0)/100)),
  def:Math.floor(A.dex/4)+idef+(M.def||0),ar:A.dex*5-35+(M.ar||0)+S.lvl*3,
  res:{fire:res('fres'),cold:res('cres'),light:res('lres'),pois:res('pres')},
  fcr:M.fcr||0,ias:M.ias||0,mf:M.mf||0,gf:M.gf||0,ll:M.ll||0,ml:M.ml||0,mpk:M.mpk||0,regen:M.regen||0,mregen:M.mregen||0,dr:M.dr||0,mdr:M.mdr||0,block:Math.min(75,M.block||0),thorns:M.thorns||0,undead:M.undead||0,tdef:M.tdef||0,
  allsk:M.allsk||0,dmgmana:M.dmgmana||0,sumdmg:M.sumdmg||0,sumlife:M.sumlife||0};
 const wd=wep&&wep.min?[wep.min,wep.max]:[1,2];const sb=1+A.str/100;o.wmin=Math.floor(wd[0]*sb);o.wmax=Math.floor(wd[1]*sb);
 o.fire=M.firemin||0;o.cold=M.coldmin||0;o.light=M.lightmax||0;o.pois=M.poisdmg||0;o.dagger=S.eq.weapon&&BASEM[S.eq.weapon.b].cat==='dagger';
 const bp=[0,9,18,30,48,75,125],fr=[15,14,13,12,11,10,9];let i=0;while(i<bp.length-1&&o.fcr>=bp[i+1])i++;o.castT=fr[i]/25;o.fcrBP=bp[i];
 o.atkT=1.5/(1+o.ias/100);
 for(let t=0;t<3;t++)o['t'+t+'sk']=M['t'+t+'sk']||0;for(const s of SKILLS)o['sk_'+s.id]=M['sk_'+s.id]||0;
if(typeof clsCalc==='function')clsCalc(o);
 ST=o;return o}

// ===== 技能数值 =====
const bl=id=>S.sk[id]||0;
function slvl(id){const b=bl(id);if(!b)return 0;const s=SKM[id];return b+ST.allsk+ST['t'+s.t+'sk']+ST['sk_'+id]}
const SYN={te:[['bw','bp','bs','bx'],15],bs:[['te','bw','bp','bx'],8],bx:[['te','bw','bp','bs'],6],pd:[['pe','pn'],20],pe:[['pd','pn'],20],pn:[['pd','pe'],10]};
function syn(id){const k=SYN[id];if(!k)return 1;return 1+k[0].reduce((a,x)=>a+bl(x),0)*k[1]/100}
const skN=L=>L<=0?0:L<=3?L:3+Math.floor((L-3)/3);
const ncur=L=>Math.min(8,2+Math.floor(L/2));
const dim=(L,lo,hi)=>Math.round(lo+(hi-lo)*(110*L/(L+6))/100);
function SV(id,L){if(SKM[id]&&SKM[id].cls&&typeof clsSV==='function'){const v=clsSV(id,L);v.mana=SKM[id].mana?Math.round(SKM[id].mana(L)*10)/10:0;return v}const sm=slvl('sm'),gm=slvl('gm'),sy=syn(id),r=(a,b)=>[Math.round(a*sy),Math.round(b*sy)];let v;
 switch(id){
 case'sm':v={txt:`骨仆/骨巫 +${7*L}生命 +${2*L}伤害；复生怪 +${10*L}%生命与伤害`};break;
 case'rs':{const n=skN(L),d=[1+(L-1)+2*sm,2+(L-1)+2*sm];v={n,life:21+3*(L-1)+7*sm,dmg:d,txt:`召唤 ${n} 只骨仆（伤害 ${d[0]}-${d[1]}，生命 ${21+3*(L-1)+7*sm}）`};break}
 case'rm':{const n=skN(L),d=[Math.round(2+(L-1)*1.5)+2*sm,4+(L-1)*2+2*sm];v={n,life:15+3*(L-1)+7*sm,dmg:d,txt:`召唤 ${n} 只骨巫（元素伤害 ${d[0]}-${d[1]}）`};break}
 case'cg':{const life=Math.round((100+35*(L-1))*(1+0.2*gm)),d=[2+(L-1),5+2*(L-1)];v={life,dmg:d,txt:`魔像 生命${life} 伤害${d[0]}-${d[1]}，命中减速`};break}
 case'gm':v={txt:`魔像生命 +${20*L}%`};break;
 case'bg':{const life=Math.round((201+22*(L-1))*(1+0.2*gm)),d=[6+3*(L-1),16+5*(L-1)];v={life,dmg:d,txt:`血魔像 生命${life} 伤害${d[0]}-${d[1]}，伤害50%治疗你`};break}
 case'sr':{const x=dim(L,20,75);v={res:x,txt:`召唤物全抗 +${x}%`};break}
 case'ig':{const life=Math.round((306+51*(L-1))*(1+0.2*gm)),d=[7+2*(L-1),19+4*(L-1)],th=150+15*(L-1);v={life,dmg:d,th,txt:`钢骸 生命${life} 伤害${d[0]}-${d[1]} 反伤${th}%`};break}
 case'fg':{const life=Math.round((386+52*(L-1))*(1+0.2*gm)),d=[10+8*(L-1),27+12*(L-1)],au=6+3*(L-1);v={life,dmg:d,aura:au,txt:`炎魔像 火焰${d[0]}-${d[1]}，灼烧光环 ${au}/秒`};break}
 case'rv':v={n:L,txt:`复生 ${L} 只怪物，生命+200%，持续180秒`};break;
 case'te':{const n=Math.min(24,1+L),d=r(2+(L-1),4+(L-1));v={n,dmg:d,txt:`${n} 枚骨牙，每枚魔法 ${d[0]}-${d[1]}`};break}
 case'ba':{const a=20+10*(L-1)+15*(bl('bw')+bl('bp'));v={abs:a,txt:`吸收 ${a} 点物理伤害`};break}
 case'pd':{const d=r(4+4*(L-1),8+5*(L-1));v={dmg:d,txt:`2秒毒伤 ${d[0]}-${d[1]}（需匕首）`};break}
 case'ce':{const n=2+Math.floor(L/3);v={n,txt:`尸体生命 60-100% 爆炸，波及 ${n} 个目标`};break}
 case'bw':{const life=100+40*(L-1);v={life,txt:`骨墙 生命${life}，吸引火力 24 秒`};break}
 case'pe':{const d=r(8+4*(L-1),12+6*(L-1)),n=3+Math.floor(L/3);v={dmg:d,n,txt:`尸体毒爆 ${d[0]}-${d[1]}，波及 ${n} 个目标`};break}
 case'bs':{const d=r(16+8*(L-1),24+8*(L-1));v={dmg:d,txt:`穿透骨矛 魔法 ${d[0]}-${d[1]}，最多穿 3 个目标`};break}
 case'bp':{const t=+(3+0.5*L).toFixed(1);v={dur:t,n:3,txt:`囚禁 3 个目标 ${t} 秒`};break}
 case'pn':{const d=r(50+18*(L-1),75+25*(L-1));v={dmg:d,txt:`全体毒伤 ${d[0]}-${d[1]}（2秒）`};break}
 case'bx':{const d=r(20+10*(L-1),30+12*(L-1));v={dmg:d,txt:`追踪骨魂 魔法 ${d[0]}-${d[1]}`};break}
 case'ad':{const t=8+3*(L-1);v={dur:t,n:ncur(L),txt:`${ncur(L)} 个目标物理抗性 -100%，${t}秒`};break}
 case'dv':{const t=+(7+1.4*(L-1)).toFixed(1);v={dur:t,n:ncur(L),txt:`${ncur(L)} 个目标无法远程攻击 ${t}秒`};break}
 case'wk':{const t=14+2*(L-1);v={dur:t,n:ncur(L),txt:`${ncur(L)} 个目标伤害 -33%，${t}秒`};break}
 case'im':{const p=225+25*(L-1),t=+(12+2.4*(L-1)).toFixed(1);v={dur:t,n:ncur(L),p,txt:`近战反伤 ${p}%，${t}秒`};break}
 case'tr':{const t=8+(L-1);v={dur:t,n:ncur(L),txt:`${ncur(L)} 个目标逃跑 ${t}秒（首领免疫）`};break}
 case'cf':{const t=10+2*(L-1);v={dur:t,n:ncur(L),txt:`${ncur(L)} 个目标互相攻击 ${t}秒`};break}
 case'lt':{const t=+(13.6+2.4*(L-1)).toFixed(1);v={dur:t,n:ncur(L),txt:`攻击目标回复伤害 50% 生命，${t}秒`};break}
 case'at':{const t=+(12+3.6*(L-1)).toFixed(1);v={dur:t,n:1,txt:`单体：怪物集火该目标 ${t}秒`};break}
 case'de':{const t=+(4+0.6*(L-1)).toFixed(1);v={dur:t,n:ncur(L),txt:`减速50% 伤害-50% 物抗-50%，${t}秒`};break}
 case'lr':{const x=dim(L,25,70),t=20+2*(L-1);v={x,dur:t,n:ncur(L),txt:`元素/毒抗 -${x}%，${t}秒`};break}
 }
 v.mana=SKM[id].mana?Math.round(SKM[id].mana(L)*10)/10:0;return v}

// ===== 战斗 =====
let MON=[],ALLY=[],CORPSE=[],H={life:45,mana:25,abs:0,castT:0,atkT:0},spawnT=1,SPEED=1,killWin=[],GT=0,mUid=1;
const zoneData=()=>ACTS[S.act].zones[S.zone];
const mlvlNow=()=>zoneData().ml;
function mkMon(key,lv,flag){const T=MONS[key]||BOSSES[key];const boss=!!BOSSES[key];let hm=1+0.32*(lv-1),dm=1+0.15*(lv-1),am=1+0.25*(lv-1),em=2.5*(1+0.45*(lv-1));
 const m={uid:mUid++,key,n:T.n,a:T.a,ic:T.ic,lv,res:Object.assign({phys:0,fire:0,cold:0,light:0,pois:0,magic:0},T.res||{}),ranged:T.ranged,el:T.el,undead:T.undead,
  hp:0,max:0,dmg:[T.dmg[0]*dm,T.dmg[1]*dm],ar:T.ar*am,def:T.def*am,exp:T.exp*em,t:rnd()*1.5,spd:T.spd||1,boss,actboss:T.actboss,fl:boss?'boss':flag||'',cur:null,pois:null,stun:0,hitT:0};
 let mul=1;if(flag==='champ'){mul=3;m.dmg=m.dmg.map(x=>x*1.5);m.exp*=3;m.n='精英·'+m.n}if(flag==='uniq'){mul=4;m.dmg=m.dmg.map(x=>x*2);m.exp*=5;m.n=pick(['狂暴','迅捷','石肤','冰咒','炎魔'])+'·'+T.n}
 if(boss)mul=1+0.32*(lv-1);m.max=m.hp=Math.round(T.hp*(boss?mul:hm*mul));return m}
function spawnWave(){const z=zoneData();const last=S.wave>=z.w-1;
 if(last&&z.boss){const lv=z.ml+(BOSSES[z.boss].actboss?0:2);MON.push(mkMon(z.boss,lv));for(let i=0;i<R(2,4);i++)MON.push(mkMon(pick(z.mons),z.ml));log(`<b class="bossn">${BOSSES[z.boss].n}</b> 出现了！`);return}
 const r=rnd();if(r<0.1){const k=pick(z.mons);for(let i=0;i<R(2,3);i++)MON.push(mkMon(k,z.ml+2,'champ'));}
 else if(r<0.15){const k=pick(z.mons);MON.push(mkMon(k,z.ml+3,'uniq'));for(let i=0;i<R(2,3);i++)MON.push(mkMon(k,z.ml+3));}
 else for(let i=0;i<R(2,5);i++)MON.push(mkMon(pick(z.mons),z.ml));
 MON=MON.slice(0,8)}
function curseOf(m,id){return m.cur&&m.cur.id===id&&m.cur.until>GT?m.cur:null}
function resOf(m,k){let r=m.res[k]||0;const c=m.cur&&m.cur.until>GT?m.cur:null;if(c){if(c.id==='ad'&&k==='phys')r-=100;if(c.id==='de'&&k==='phys')r-=50;if(c.id==='lr'&&k!=='phys'&&k!=='magic')r-=c.x}return clamp(r,-100,95)}
// d:{phys,fire,cold,light,magic,pois}；src:'hero'|ally对象
function hitMon(m,d,src,fxc){if(m.hp<=0)return 0;let tot=0;
 for(const k in d){if(!d[k])continue;if(k==='pois'){const v=d[k]*(1-resOf(m,'pois')/100);if(!m.pois||m.pois.dps*m.pois.left<v)m.pois={dps:v/2,left:2,src};continue}
  let v=d[k];if(k==='phys'&&m.undead&&src==='hero')v*=1+ST.undead/100;v*=1-resOf(m,k)/100;tot+=v}
 tot=Math.max(0,Math.round(tot));if(tot>0){m.hp-=tot;m.hitT=0.25;floatNum(m.uid,tot,fxc||'#fff');
  if(curseOf(m,'lt')){if(src==='hero')H.life=Math.min(ST.life,H.life+tot*0.5);else if(src&&src.hp)src.hp=Math.min(src.max,src.hp+tot*0.5)}
  if(src==='hero'){if(ST.dmgmana)H.mana=Math.min(ST.mana,H.mana+tot*ST.dmgmana/100)}
  if(src&&src.kind==='bg')H.life=Math.min(ST.life,H.life+tot*0.5)}
 if(m.hp<=0)killMon(m);return tot}
function killMon(m){m.hp=0;S.kills=(S.kills||0)+1;killWin.push(GT);
 if(!m.boss&&!m.raised)CORPSE.push({max:m.max,key:m.key,lv:m.lv});if(CORPSE.length>10)CORPSE.shift();
 const diff=S.lvl-m.lv;let f=1;if(diff>5)f=[.81,.62,.43,.24][diff-6]??.05;else if(diff<-5)f=S.lvl/m.lv;
 const xp=Math.max(1,Math.round(m.exp*f));gainXp(xp);H.mana=Math.min(ST.mana,H.mana+ST.mpk);
 const drops=rollTC(m);const names=drops.map(it=>`<span style="color:${itemColor(it)}">${itemName(it)}</span>*1`);
 log(`击杀 <span class="${m.boss?'bossn':m.fl}">${m.n}</span>，经验+${xp}${names.length?'，获得 '+names.join('、'):''}`);
 for(const it of drops){groundLoot(it);addBag(it)}
 if(m.boss)bossKilled(m)}
function gainXp(x){S.xp+=x;while(S.lvl<99&&S.xp>=xpNeed(S.lvl+1)){S.lvl++;S.sp+=5;S.kp+=1;calc();H.life=ST.life;H.mana=ST.mana;toast(`升级！等级 ${S.lvl}：属性点+5 技能点+1`);log(`<b style="color:#ffd76a">升到 ${S.lvl} 级</b>`)}}
// --- TC 掉落 ---
function rollTC(m){const t=m.actboss?{p:7,nd:0}:m.boss?{p:5,nd:15}:m.fl==='uniq'?{p:3,nd:40}:m.fl==='champ'?{p:2,nd:60}:{p:1,nd:100};
 const out=[],bm=m.boss?983:0;for(let i=0;i<t.p;i++){const e=wpick([['nd',t.nd],['gold',30],['junk',25],['eq',22],['good',4+(m.boss?8:0)]],x=>x[1])[0];
  if(e==='gold'){const g=Math.round(R(m.lv,4*m.lv+8)*(1+ST.gf/100));S.gold+=g}
  else if(e==='junk'){const k=wpick([['hp',5],['mp',3],['rej',1],['tp',1]],x=>x[1])[0];S.pot[k]++}
  else if(e==='eq')out.push(genItem(m.lv,{mf:ST.mf,bossMod:bm}));
  else if(e==='good')out.push(rnd()<0.5?rollRune(m.lv):rollGem(m.lv))}
 return out}
function rollRune(ml){const mx=Math.min(RUNES.length-1,Math.floor(ml/3));const r=wpick([...Array(mx+1).keys()],i=>1/Math.pow(1.6,i));return{uid:S.uid++,k:'rune',r}}
function rollGem(ml){const g=ml>=36?R(0,3):ml>=24?R(0,2):ml>=12?R(0,1):0;return{uid:S.uid++,k:'gem',g:pick(Object.keys(GEMS)),lv:g}}
function addBag(it){if(it.k==='rune')S.found[it.r]=1;
 if(!it.k&&it.sock===0&&S.sell[it.q]&&it.q<3){S.gold+=sellPrice(it);return}
 if(S.bag.length>=40){S.gold+=sellPrice(it);log('背包已满，自动出售 '+itemName(it));return}S.bag.push(it)}
function sellPrice(it){if(it.k==='rune')return 50*(it.r+1);if(it.k==='gem')return 20*(it.lv+1);return Math.round((5+BASEM[it.b].q*3)*[0.5,1,1.5,3,6,10,8,8,10][it.q])+power(it)}
function bossKilled(m){const z=zoneData();if(z.quest&&!S.q[z.quest])questDone(z.quest)}
function questDone(q){S.q[q]=1;const Q=QUESTS[q];log(`<b class="quest">任务完成【${Q.n}】奖励：${Q.rw}</b>`);toast('任务完成：'+Q.n);
 if(q==='q1')S.kp++;if(q==='q2'){gainXp(500);S.gold+=300}
 if(q==='q3'){const it=genItem(S.lvl,{base:BASEM.rin,q:3});addBag(it);log('长老赠予 '+itemName(it))}
 if(q==='q4'){for(let i=0;i<3;i++){const r=rollRune(15);addBag(r);log('获得 '+itemName(r))}}
 if(q==='q5')S.imbue=1;if(q==='q6')S.act1done=1}
// --- 召唤物 ---
function addAlly(kind,o){const a=Object.assign({uid:mUid++,kind,t:rnd(),res:slvl('sr')?SV('sr',slvl('sr')).res:0},o);a.max=a.hp=Math.round(a.hp*(1+ST.sumlife/100));ALLY.push(a);return a}
function cntA(k){return ALLY.filter(a=>a.kind===k).length}
function golemKind(){return['fg','ig','bg','cg'].find(k=>bl(k))}
// --- 英雄施法 AI ---
function liveMon(){return MON.filter(m=>m.hp>0)}
function castable(id){const L=slvl(id);return L>0&&S.lvl>=SKM[id].r&&H.mana>=SV(id,L).mana}
function spend(id){H.mana-=SV(id,slvl(id)).mana}
function mainSkill(){if(S.main&&castable(S.main))return S.main;const c=['bx','bs','pn','te','pd'].filter(id=>castable(id)&&(id!=='pd'||ST.dagger));
 let best=null,bv=0;for(const id of c){const v=SV(id,slvl(id));const d=(v.dmg[0]+v.dmg[1])/2*(id==='te'?Math.min(v.n,6)*0.5:id==='pn'?liveMon().length:1);if(d>bv){bv=d;best=id}}return best}
function curseSkill(){if(S.curse)return castable(S.curse)?S.curse:null;return['lr','de','ad','lt','wk','im','at','cf','tr','dv'].find(castable)}
function heroAct(){const ms=liveMon();const L=x=>slvl(x);
 if(castable('ba')&&H.abs<=0){spend('ba');H.abs=SV('ba',L('ba')).abs;fx('shield');return 1}
 const gk=golemKind();if(gk&&!cntA('golem')&&castable(gk)){spend(gk);const v=SV(gk,L(gk));addAlly('golem',{sub:gk,n:SKM[gk].n,hp:v.life,dmg:v.dmg,th:v.th,aura:v.aura,el:gk==='fg'?'fire':'phys'});fx('summon');return 1}
 if(!ms.length){ // 无怪：用尸体补召唤
  return summonFromCorpse()}
 const cu=curseSkill();if(cu){const tg=ms.filter(m=>!curseOf(m,cu)&&!(cu==='tr'&&m.boss));if(tg.length){const v=SV(cu,L(cu));spend(cu);for(const m of tg.slice(0,v.n))m.cur={id:cu,until:GT+v.dur,x:v.x,p:v.p};fxCurse(tg.slice(0,v.n));return 1}}
 if(summonFromCorpse())return 1;
 if(castable('bw')&&!cntA('wall')&&ms.length>=3){spend('bw');addAlly('wall',{n:'骨墙',hp:SV('bw',L('bw')).life,dmg:[0,0],until:GT+24});return 1}
 if(castable('bp')&&ms.length>=3&&rnd()<0.3){spend('bp');const v=SV('bp',L('bp'));for(const m of ms.slice(0,3))m.stun=v.dur;fx('prison',ms.slice(0,3));return 1}
 if(CORPSE.length&&ms.length>=2){for(const id of['pe','ce'])if(castable(id)&&rnd()<0.5){spend(id);const c=CORPSE.pop(),v=SV(id,L(id));const tg=ms.slice().sort(()=>rnd()-.5).slice(0,v.n);
   for(const m of tg){if(id==='ce'){const d=c.max*(0.6+rnd()*0.4);hitMon(m,{phys:d/2,fire:d/2},'hero','#ff8a30')}else hitMon(m,{pois:R(v.dmg[0],v.dmg[1])},'hero','#6f6')}fx(id==='ce'?'boom':'cloud',tg);return 1}}
 const full=!(bl('rs')&&cntA('skel')<SV('rs',L('rs')).n);const sk=(full||H.mana>ST.mana*0.4)?mainSkill():null;if(sk){const v=SV(sk,L(sk));spend(sk);const tg=target(ms);
  if(sk==='te'){for(let i=0;i<v.n;i++){const m=pick(liveMon());if(!m)break;if(rnd()<0.45)hitMon(m,{magic:R(v.dmg[0],v.dmg[1])},'hero','#e8e0c0')}fx('teeth',liveMon())}
  else if(sk==='bs'){const tg3=[tg,...ms.filter(m=>m!==tg)].slice(0,3);for(const m of tg3)hitMon(m,{magic:R(v.dmg[0],v.dmg[1])},'hero','#f0ead0');fx('spear',tg3)}
  else if(sk==='bx'){hitMon(tg,{magic:R(v.dmg[0],v.dmg[1])},'hero','#cfe');fx('spirit',[tg])}
  else if(sk==='pn'){for(const m of ms)hitMon(m,{pois:R(v.dmg[0],v.dmg[1])},'hero','#6f6');fx('nova',ms)}
  else if(sk==='pd'){if(hitChance(ST.ar,tg.def,S.lvl,tg.lv))hitMon(tg,{pois:R(v.dmg[0],v.dmg[1]),phys:R(ST.wmin,ST.wmax)},'hero','#6f6');fx('stab',[tg])}
  return 1}
 // 普攻
 const tg=target(ms);if(hitChance(ST.ar,tg.def*(1-ST.tdef/100),S.lvl,tg.lv)){const d=hitMon(tg,{phys:R(ST.wmin,ST.wmax),fire:ST.fire,cold:ST.cold,light:ST.light?R(1,ST.light):0,pois:ST.pois},'hero','#fff');
  if(d){H.life=Math.min(ST.life,H.life+d*ST.ll/100);H.mana=Math.min(ST.mana,H.mana+d*ST.ml/100)}}fx('slash',[tg]);return 2}
function summonFromCorpse(){if(!CORPSE.length)return 0;const L=x=>slvl(x);
 if(castable('rv')&&cntA('rev')<SV('rv',L('rv')).n){const c=CORPSE.pop();const T=MONS[c.key];if(T){spend('rv');const sm=L('sm'),m=mkMon(c.key,c.lv);addAlly('rev',{n:'复生·'+T.n,ic:T.ic,a:T.a,hp:m.max*3*(1+0.1*sm),dmg:m.dmg.map(x=>x*(1+0.1*sm)),until:GT+180});fx('summon');return 1}}
 if(castable('rs')&&cntA('skel')<SV('rs',L('rs')).n){CORPSE.pop();spend('rs');const v=SV('rs',L('rs'));addAlly('skel',{n:'骨仆',hp:v.life,dmg:v.dmg});fx('summon');return 1}
 if(castable('rm')&&cntA('mage')<SV('rm',L('rm')).n){CORPSE.pop();spend('rm');const v=SV('rm',L('rm'));addAlly('mage',{n:'骨巫',hp:v.life,dmg:v.dmg,el:pick(['fire','cold','light','pois']),ranged:1});fx('summon');return 1}
 return 0}
function target(ms){const at=ms.find(m=>curseOf(m,'at'));if(at)return at;const b=ms.find(m=>m.boss);return b||ms[0]}
function hitChance(ar,def,al,dl){const c=clamp(200*ar/(ar+Math.max(1,def))*al/(al+dl),5,95);return rnd()*100<c}
// --- 主循环 ---
function step(dt){GT+=dt;const ms=liveMon();
 H.mana=Math.min(ST.mana,H.mana+ST.mana/120*(1+ST.mregen/100)*dt);H.life=Math.min(ST.life,H.life+ST.regen*dt);
 if(H.life<ST.life*0.4&&S.pot.hp>0&&!H.potT){S.pot.hp--;H.potT=7;H.potHeal=ST.life*0.5/7}
 if(H.life<ST.life*0.2&&S.pot.rej>0){S.pot.rej--;H.life=Math.min(ST.life,H.life+ST.life*0.35);H.mana=Math.min(ST.mana,H.mana+ST.mana*0.35);floatHero('瞬回','#d0f')}
 if(H.mana<ST.mana*0.15&&S.pot.mp>0&&!H.mpT){S.pot.mp--;H.mpT=5;H.mpHeal=ST.mana*0.6/5}
 if(H.potT>0){H.potT=Math.max(0,H.potT-dt);H.life=Math.min(ST.life,H.life+H.potHeal*dt)}if(H.mpT>0){H.mpT=Math.max(0,H.mpT-dt);H.mana=Math.min(ST.mana,H.mana+H.mpHeal*dt)}
 // 英雄
 H.castT-=dt;if(H.castT<=0){const r=heroAct();H.castT=r===2?ST.atkT:r?ST.castT:0.3}
 // 召唤物
 for(const a of ALLY){if(a.until&&GT>a.until)a.hp=0;if(a.hp<=0||a.kind==='wall')continue;
  if(a.aura){a.auT=(a.auT||0)-dt;if(a.auT<=0){a.auT=1;for(const m of liveMon())hitMon(m,{fire:a.aura},a,'#f84')}}
  a.t-=dt;if(a.t>0)continue;a.t=a.kind==='mage'?1.6:1.2;const ms2=liveMon();if(!ms2.length)continue;const m=target(ms2);
  const d=R(Math.round(a.dmg[0]),Math.round(a.dmg[1]))*(1+ST.sumdmg/100);
  if(a.kind==='mage'){hitMon(m,{[a.el==='pois'?'pois':a.el]:a.el==='pois'?d*3:d},a,{fire:'#f84',cold:'#8cf',light:'#ff6',pois:'#6f6'}[a.el]);fxLine(a.uid,m.uid,{fire:'#f84',cold:'#8cf',light:'#ff6',pois:'#6f6'}[a.el])}
  else if(hitChance(30+S.lvl*8,m.def,S.lvl,m.lv)){hitMon(m,{[a.el||'phys']:d},a,'#dfd');if(a.sub==='cg')m.slow=GT+3}}
 // 怪物
 for(const m of ms){if(m.hp<=0)continue;if(m.pois&&m.pois.left>0){const v=Math.min(m.pois.left,dt);m.hp-=m.pois.dps*v;m.pois.left-=v;if(m.hp<=0){killMon(m);continue}}
  if(m.hitT>0)m.hitT-=dt;if(m.stun>0){m.stun-=dt;continue}if(curseOf(m,'tr'))continue;
  let sp=m.spd*(curseOf(m,'de')?0.5:1)*(m.slow>GT?0.67:1);m.t-=dt*sp;if(m.t>0)continue;m.t=2.0+rnd()*0.6;
  if(m.ranged&&curseOf(m,'dv'))continue;
  let dmg=R(Math.round(m.dmg[0]),Math.round(m.dmg[1]));if(curseOf(m,'wk'))dmg*=0.67;if(curseOf(m,'de'))dmg*=0.5;dmg=Math.max(1,Math.round(dmg));
  if(curseOf(m,'cf')){const o=liveMon().filter(x=>x!==m);if(o.length){hitMon(pick(o),{phys:dmg},null,'#fa0')}continue}
  const at=liveMon().find(x=>x!==m&&curseOf(x,'at'));if(at){hitMon(at,{phys:dmg},null,'#fa0');continue}
  const allies=ALLY.filter(a=>a.hp>0);const wall=allies.find(a=>a.kind==='wall');let tg=wall||(allies.length&&rnd()<0.7?pick(allies):'hero');
  if(tg==='hero'){if(!hitChance(m.ar,ST.def,m.lv,S.lvl)){floatHero('闪避','#aaa');continue}
   if(ST.block&&BASEM[S.eq.shield?.b]?.block&&rnd()*100<ST.block){floatHero('格挡','#ccc');continue}
   let el=m.el||'phys',v=dmg;if(el==='phys'){v=Math.max(1,v-ST.dr);const ab=Math.min(H.abs,v);H.abs-=ab;v-=ab}else v=Math.round(v*(1-ST.res[el]/100));
   if(v>0){H.life-=v;floatHero('-'+v,'#f44')}if(!m.ranged&&ST.thorns)hitMon(m,{phys:ST.thorns},'hero','#fa0');
   if(!m.ranged&&curseOf(m,'im'))hitMon(m,{phys:dmg*m.cur.p/100},'hero','#f60')}
  else{const a=tg;let v=dmg;if(m.el&&m.el!=='phys')v*=1-a.res/100;a.hp-=Math.round(v);a.hitT=0.25;floatNum('a'+a.uid,Math.round(v),'#f66');
   if(!m.ranged&&a.th)hitMon(m,{phys:dmg*a.th/100},a,'#ccc');if(!m.ranged&&curseOf(m,'im'))hitMon(m,{phys:dmg*m.cur.p/100},'hero','#f60')}}
 ALLY=ALLY.filter(a=>a.hp>0);MON=MON.filter(m=>m.hp>0||m.fade>0);
 if(H.life<=0)return die();
 if(!liveMon().length){spawnT-=dt;if(spawnT<=0){spawnT=1.2;nextWave()}}}
function nextWave(){const z=zoneData();if(S.wave>=z.w){zoneClear();return}spawnWave();S.wave++}
function zoneClear(){S.dz=0;const z=zoneData();if(!S.cleared[S.zone]){S.cleared[S.zone]=1;log(`<b class="quest">${z.n} 已肃清</b>`)}
 if(z.quest==='q1'&&!S.q.q1)questDone('q1');
 const zs=ACTS[S.act].zones;let nx=S.zone+1;if(nx<zs.length)S.unl=Math.max(S.unl,nx);while(nx<zs.length&&zs[nx].side){nx++;S.unl=Math.max(S.unl,nx)}
 if(S.auto&&nx<zs.length&&nx<=S.unl){S.zone=nx;log(`前往 <b>${zoneData().n}</b>`)}S.wave=0}
function die(){S.dz=(S.dz||0)+1;if(S.dz>=2&&S.zone>0){S.dz=0;S.zone--;while(S.zone>0&&zoneData().side)S.zone--;log('<b style="color:#f84">连续阵亡，退回上一区域历练</b>')}
log(`<b style="color:#f44">你倒下了……回到营地</b>`);toast('死亡：回到营地');
 MON=[];ALLY=[];CORPSE=[];S.wave=0;calc();H.life=ST.life;H.mana=ST.mana;H.abs=0;spawnT=3}
function goZone(i){if(i>S.unl)return;S.zone=i;S.wave=0;MON=[];CORPSE=[];spawnT=1;log(`前往 <b>${zoneData().n}</b>`);render()}
function townPortal(){if(S.pot.tp<=0)return toast('没有回城卷轴');S.pot.tp--;MON=[];S.wave=0;H.life=ST.life;H.mana=ST.mana;spawnT=2;log('使用回城卷轴：在营地恢复后返回 '+zoneData().n)}
function usePot(k){if(S.pot[k]<=0)return;if(k==='tp')return townPortal();S.pot[k]--;if(k==='hp'){H.potT=7;H.potHeal=ST.life*0.5/7}if(k==='mp'){H.mpT=5;H.mpHeal=ST.mana*0.6/5}if(k==='rej'){H.life=Math.min(ST.life,H.life+ST.life*.35);H.mana=Math.min(ST.mana,H.mana+ST.mana*.35)}}

// ===== UI：战斗页 =====
let TAB='fight',LOGS=[],SKT=0,BAGF='all';
function log(h){LOGS.push(h);if(LOGS.length>60)LOGS.shift();LOGDIRTY=1}let LOGDIRTY=1;
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('on'),1800)}
function bar(v,m,cls){const p=m>0?clamp(v/m*100,0,100):0;return`<div class="bar ${cls}"><i style="width:${p}%"></i><span>${fmt(Math.max(0,v))}/${fmt(m)}</span></div>`}
function monCard(m){const cur=m.cur&&m.cur.until>GT?`<em class="cur">${SKM[m.cur.id].n.slice(0,2)}</em>`:'';
 return`<div class="mc ${m.fl} ${m.hitT>0?'hit':''} ${m.stun>0?'stun':''}" id="c${m.uid}"><b class="lv">${m.lv}</b>${cur}${m.pois&&m.pois.left>0?'<em class="psn">毒</em>':''}
 <div class="pt">${art(m.a,m.ic)}</div><div class="nm">${m.n}</div>${bar(m.hp,m.max,'hp')}</div>`}
function allyCard(a){const ic={skel:'💀',mage:'🔮',golem:SKM[a.sub||'cg']?.ic||'🗿',wall:'🧱',rev:a.ic}[a.kind];const key={skel:'skeleton',mage:'skmage',golem:'golem_'+a.sub,wall:'bonewall',rev:(IMG[a.a]?a.a:'revive')}[a.kind];
 const t=a.until?`<em class="tm">${Math.max(0,Math.ceil(a.until-GT))}s</em>`:'';return`<div class="ac ${a.hitT>0?'hit':''}" id="ca${a.uid}">${t}<div class="pt">${art(key,ic)}</div><div class="nm">${a.n}</div>${bar(a.hp,a.max,'hp g')}</div>`}
function questLine(){const z=zoneData();const q=z.quest||Object.keys(QUESTS).find(k=>!S.q[k]);if(!q)return'【主线】第一章已完成，第二章将于下一阶段开放';const Q=QUESTS[q];return`【主线】${Q.d} (${S.q[q]?1:0}/1)`}
function renderFight(){const z=zoneData(),boss=MON.find(m=>m.boss&&m.hp>0),tgt=boss||liveMon()[0];
 $('#ftop').innerHTML=`<div class="zt"><span class="zn">${ACTS[S.act].n.split('·')[1]} · ${z.n}</span><span class="wv">第 ${Math.min(S.wave,z.w)}/${z.w} 波${z.boss?' · 首领':''}</span></div>
 <div class="tg">${tgt?`<span class="${tgt.boss?'bossn':''}">${tgt.n}（${tgt.lv}级）</span>`+bar(tgt.hp,tgt.max,'hp big'):'<span class="dim">搜寻敌人中……</span>'}</div>
 <div class="xpb"><b>EXP</b>${bar(S.xp-xpNeed(S.lvl),xpNeed(S.lvl+1)-xpNeed(S.lvl),'xp')}<span class="lvt">Lv.${S.lvl}</span><span class="gold">◈${fmt(S.gold)}</span></div>`;
 const ms=MON.filter(m=>m.hp>0);$('#mgrid').innerHTML=ms.map(monCard).join('')+(ms.length?'':'<div class="empty">· 静 ·</div>');
 $('#arow').innerHTML=`<div class="ac hero" id="chero"><b class="lv">${S.lvl}</b><div class="pt">${heroArt()}</div><div class="nm">${clsName()}</div>${H.abs>0?`<div class="abs">骨铠 ${Math.round(H.abs)}</div>`:''}</div>`+ALLY.map(allyCard).join('')+`<div class="corpse">尸体×${CORPSE.length}</div>`;
 setVar($('#orbL'),'--p',clamp(H.life/ST.life,0,1).toFixed(3));setVar($('#orbR'),'--p',clamp(H.mana/ST.mana,0,1).toFixed(3));
 setTxt($('#orbL span'),Math.max(0,Math.round(H.life)));setTxt($('#orbR span'),Math.round(H.mana));
 for(const k of['hp','mp','rej','tp'])setTxt($('#p_'+k),S.pot[k]);
 if(LOGDIRTY){const L=$('#flog');L.innerHTML=LOGS.map(x=>`<div>${x}</div>`).join('');L.scrollTop=L.scrollHeight;LOGDIRTY=0}
 $('#fquest').innerHTML=`<span class="qtag">${questLine()}</span>`;
 $('#fzone').innerHTML=`<button onclick="goZone(Math.max(0,S.zone-1))">◀</button><span>${z.n} <small>mlvl ${z.ml}</small></span><button onclick="goZone(Math.min(S.unl,S.zone+1))">▶</button><button class="auto ${S.auto?'on':''}" onclick="S.auto^=1;render()">${S.auto?'自动推进':'原地挂机'}</button>`;
 const bgk=z.bg;$('#fbattle').style.backgroundImage=IMG[bgk]?`linear-gradient(rgba(0,0,0,.35),rgba(0,0,0,.6)),url(${IMG[bgk]})`:'';if($('#fbattle').dataset.bg!==bgk)$('#fbattle').dataset.bg=bgk}
// 省电：值没变就不写 DOM（避免无谓的样式重算）
function setTxt(e,v){v=String(v);if(e&&e.textContent!==v)e.textContent=v}
function setVar(e,k,v){v=String(v);if(e&&e.style.getPropertyValue(k)!==v)e.style.setProperty(k,v)}
// ===== 特效层 =====
const FX=[];
function rectOf(id){const e=document.getElementById(id),b=$('#fbattle');if(!e||!b)return null;const r=e.getBoundingClientRect(),o=b.getBoundingClientRect();return{x:r.left-o.left+r.width/2,y:r.top-o.top+r.height/2,w:r.width,h:r.height}}
function heroPos(){return rectOf('chero')||{x:60,y:300}}
function fx(kind,tg=[]){if(TAB!=='fight')return;const pts=tg.map(m=>rectOf('c'+m.uid)).filter(Boolean),h=heroPos();
 const col={spear:'#f4ecd0',spirit:'#bff',teeth:'#eee',nova:'#5f5',cloud:'#5c5',boom:'#f80',slash:'#fff',stab:'#5f5',prison:'#dcb',shield:'#ddd',summon:'#7f7',curse:'#c3f'}[kind]||'#fff';
 if(FX.length>=48)FX.shift();FX.push({k:kind,pts,h,c:col,t:0,life:kind==='nova'?0.7:0.45})}
function fxCurse(ms){fx('curse',ms)}
function fxLine(fromUid,toUid,c){if(TAB!=='fight')return;const a=rectOf('ca'+fromUid),b=rectOf('c'+toUid);if(a&&b)FX.push({k:'line',pts:[b],h:a,c,t:0,life:.3})}
function floatNum(id,v,c){if(TAB!=='fight')return;const p=rectOf(typeof id==='string'?'c'+id:'c'+id);if(!p)return;spawnFloat(p.x+R(-14,14),p.y-10,typeof v==='number'?'-'+v:v,c)}
function floatHero(t,c){if(TAB!=='fight')return;const p=heroPos();spawnFloat(p.x,p.y-20,t,c)}
function spawnFloat(x,y,t,c){const e=document.createElement('div');e.className='fl';e.textContent=t;e.style.cssText=`left:${x}px;top:${y}px;color:${c}`;$('#fbattle').appendChild(e);setTimeout(()=>e.remove(),900)}
function groundLoot(it){if(TAB!=='fight')return;const g=$('#mgrid').getBoundingClientRect(),o=$('#fbattle').getBoundingClientRect();const e=document.createElement('div');
 const hi=it.k||it.q>=4||it.rw!=null;e.className='loot'+(hi?' hi':'');e.style.cssText=`left:${g.left-o.left+R(10,g.width-90)}px;top:${g.top-o.top+R(20,g.height-20)}px;color:${itemColor(it)};--c:${itemColor(it)}`;e.innerHTML=(hi?'<i></i>':'')+itemName(it);$('#fbattle').appendChild(e);setTimeout(()=>e.remove(),3500)}
let FX_CLR=0;function drawFX(dt){if(!FX.length){if(FX_CLR)return;FX_CLR=1}else FX_CLR=0;const cv=$('#fx');if(!cv)return;const b=$('#fbattle'),W=b.clientWidth,Hh=b.clientHeight,d=2;if(cv.width!==W*d||cv.height!==Hh*d){cv.width=W*d;cv.height=Hh*d}
 const c=cv.getContext('2d');c.setTransform(d,0,0,d,0,0);c.clearRect(0,0,W,Hh);
 for(const f of FX){f.t+=dt;const a=1-f.t/f.life;if(a<=0)continue;c.globalAlpha=a;c.strokeStyle=f.c;c.fillStyle=f.c;c.shadowColor=f.c;c.shadowBlur=12;const h=f.h;
  if(f.k==='spear'||f.k==='line'||f.k==='spirit'||f.k==='stab'||f.k==='teeth'){for(const p of f.pts){c.lineWidth=f.k==='spear'?4:2;c.beginPath();c.moveTo(h.x,h.y);const tx=h.x+(p.x-h.x)*Math.min(1,f.t/f.life*2.2),ty=h.y+(p.y-h.y)*Math.min(1,f.t/f.life*2.2);c.lineTo(tx,ty);c.stroke();c.beginPath();c.arc(tx,ty,f.k==='spear'?5:3,0,7);c.fill()}}
  if(f.k==='nova'){const r=f.t/f.life*Math.max(W,Hh);c.lineWidth=8*a;c.beginPath();c.arc(h.x,h.y,r,0,7);c.stroke()}
  if(f.k==='boom'||f.k==='cloud'){for(const p of f.pts){c.beginPath();c.arc(p.x,p.y,10+30*(f.t/f.life),0,7);c.globalAlpha=a*0.5;c.fill()}}
  if(f.k==='curse'||f.k==='prison'){for(const p of f.pts){c.lineWidth=2;c.beginPath();c.arc(p.x,p.y-p.h*0.38,8+f.t*20,0,7);c.stroke();if(f.k==='curse'){c.font='14px serif';c.fillText('☠',p.x-7,p.y-p.h*0.38+5)}}}
  if(f.k==='slash'){for(const p of f.pts){c.lineWidth=3;c.beginPath();c.moveTo(p.x-18,p.y-18);c.lineTo(p.x+18,p.y+18);c.stroke()}}
  if(f.k==='summon'||f.k==='shield'){c.globalAlpha=a*0.6;const g=c.createLinearGradient(h.x,0,h.x,h.y);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,f.c);c.fillStyle=g;c.fillRect(h.x-14,0,28,h.y+30)}
  if(f.k==='bolt'){for(const p of f.pts){c.lineWidth=3;c.beginPath();let x=p.x,y=0;c.moveTo(x,y);while(y<p.y){y+=18;x=p.x+R(-12,12);c.lineTo(x,y)}c.stroke()}}}
 c.globalAlpha=1;c.shadowBlur=0;for(let i=FX.length-1;i>=0;i--)if(FX[i].t>=FX[i].life)FX.splice(i,1)}

// ===== 角色页 =====
function renderHero(){const s=ST,A=s.attr,P=$('#panel');const row=(a,b)=>`<div class="row"><span>${a}</span><b>${b}</b></div>`;
 const at=[['str','力量','装备需求 · 武器伤害+1%/点'],['dex','敏捷','命中+5 · 防御+1/4'],['vit','体力','生命+2/点'],['ene','精力','法力+2/点']];
 P.innerHTML=`<div class="gp"><div class="heroart">${heroArt()}</div><h3>${clsName()} · Lv.${S.lvl}</h3><div class="sub">经验 ${fmt(S.xp)} / ${fmt(xpNeed(S.lvl+1))} · 难度 ${DIFFS[S.diff].n}</div>
 <div class="pts">可用属性点 <b>${S.sp}</b> · 技能点 <b>${S.kp}</b></div>
 ${at.map(([k,n,d])=>`<div class="attr"><div><b>${n}</b> <span class="v">${A[k]}</span>${A[k]!==S.at[k]?`<span class="plus"> (+${A[k]-S.at[k]})</span>`:''}<div class="dim">${d}</div></div>
  <div><button class="btn sm" onclick="addStat('${k}',1)" ${S.sp?'':'disabled'}>+1</button><button class="btn sm" onclick="addStat('${k}',5)" ${S.sp>=5?'':'disabled'}>+5</button></div></div>`).join('')}</div>
 <div class="gp"><h3>战斗属性</h3>${row('生命',s.life)+row('法力',s.mana)+row('防御',s.def)+row('命中',s.ar)+row('武器伤害',s.wmin+'-'+s.wmax)+row('施法速度',`${s.fcr}%（断点 ${s.fcrBP}，${Math.round(s.castT*25)}帧）`)+row('攻击速度',s.ias+'%')+
 row('火/冰/电/毒 抗',`<span style="color:#f84">${s.res.fire}</span>/<span style="color:#8cf">${s.res.cold}</span>/<span style="color:#ff6">${s.res.light}</span>/<span style="color:#6f6">${s.res.pois}</span>`)+
 row('寻宝(MF)',s.mf+'%')+row('金币获取',s.gf+'%')+row('生命/法力偷取',s.ll+'% / '+s.ml+'%')+row('格挡',s.block+'%')+row('+全部技能',s.allsk)+row('召唤物伤害/生命',`+${s.sumdmg}% / +${s.sumlife}%`)}</div>
 <div class="gp"><h3>任务</h3>${Object.entries(QUESTS).map(([k,q])=>`<div class="row"><span>${S.q[k]?'✔':'○'} ${q.n}<div class="dim">${q.d}</div></span><b class="dim">${q.rw}</b></div>`).join('')}</div>
 <div class="gp"><h3>设置</h3><div class="btns">${[['autoSk','自动加技能'],['autoAt','自动加属性(力量够用,其余体力)'],['autoEq','自动换装(战力更高)']].map(([k,n])=>`<button class="btn sm ${S[k]?'on':''}" onclick="S.${k}^=1;render()">${n}</button>`).join('')}</div><div class="dim">自动出售（无凹槽）：</div><div class="btns">${[0,1,2,3].map(q=>`<button class="btn sm ${S.sell[q]?'on':''}" onclick="S.sell[${q}]^=1;render()" ${q===3?'disabled':''}>${QN[q]}</button>`).join('')}</div>
 <button class="btn sm" onclick="resetChar()">重置存档</button></div>`}
function addStat(k,n){n=Math.min(n,S.sp);S.at[k]+=n;S.sp-=n;calc();render()}

// ===== 技能页 =====
function renderSkills(){const P=$('#panel');const tabs=trees().map((t,i)=>`<button class="${SKT===i?'on':''}" onclick="SKT=${i};render()">${t}</button>`).join('')+`<button class="${SKT===3?'on':''}" onclick="SKT=3;render()">符文图鉴</button>`;
 if(SKT===3){P.innerHTML=`<div class="stabs">${tabs}</div><div class="gp"><h3>符文图鉴</h3><div class="rgrid">${RUNES.map((r,i)=>S.found[i]?`<div class="rc on"><div class="ro">${i+1}</div><b>${r[0]}符文</b><small>需求 ${r[1]} 级</small><small>武:${modsTxt(r[2])}</small><small>防:${modsTxt(r[3])}</small></div>`:`<div class="rc back"><div class="ro">?</div><small>未发现</small></div>`).join('')}</div></div>
  <div class="gp"><h3>符文之语</h3>${RUNEWORDS.map(w=>`<div class="rw"><b class="uq">${w.n}</b> <span class="dim">${w.r.map(i=>RUNES[i][0]).join('+')} · ${w.cats.map(c=>({wand:'魔杖',dagger:'匕首',sword:'剑',helm:'头盔',armor:'铠甲',shield:'盾',head:'缩颅'})[c]).join('/')} ${w.r.length}孔 · 需求${w.lv}</span><div class="dim">${modsTxt(w.m)}</div></div>`).join('')}</div>`;return}
 const list=SKILLS.filter(s=>s.t===SKT&&skOfCls(s)).sort((a,b)=>a.r-b.r||a.col-b.col);
 P.innerHTML=`<div class="stabs">${tabs}</div><div class="pts">技能点 <b>${S.kp}</b>　主攻：<b>${S.main?SKM[S.main].n:'自动'}</b>　诅咒：<b>${S.curse?SKM[S.curse].n:'自动'}</b></div>
 <div class="tree">${REQL.map((r,ri)=>`<div class="trow"><span class="rq">${r}</span>${[0,1,2].map(c=>{const s=list.find(x=>x.r===r&&x.col===c);return s?`<div class="tn ${bl(s.id)?'has':''} ${canLearn(s.id)?'can':''}" id="tn_${s.id}" onclick="skPop('${s.id}')">${skIcon(s)}<b>${bl(s.id)||''}</b></div>`:'<div class="tn void"></div>'}).join('')}</div>`).join('')}</div>
 ${list.map(s=>{const L=slvl(s.id),v=SV(s.id,Math.max(1,L||1));return`<div class="skc ${L?'':'off'}">${skIcon(s)}<div class="si"><div><b>${s.n}</b> <span class="lvt">Lv.${bl(s.id)}${L>bl(s.id)?`<span class="plus">+${L-bl(s.id)}</span>`:''}</span></div>
 <div class="dim">${s.kind==='passive'?'被动':'消耗 '+v.mana+' 法力'} · 施法 ${Math.round(ST.castT*25)}帧 · 需求 ${s.r}级${s.pre.length?' · 前置 '+s.pre.map(p=>SKM[p].n).join('、'):''}</div><div class="eff">${v.txt}</div>
 <div class="btns">${['attack'].includes(s.kind)&&L?`<button class="btn xs ${S.main===s.id?'on':''}" onclick="S.main=S.main==='${s.id}'?null:'${s.id}';render()">主攻</button>`:''}${s.kind==='curse'&&L?`<button class="btn xs ${S.curse===s.id?'on':''}" onclick="S.curse=S.curse==='${s.id}'?null:'${s.id}';render()">诅咒</button>`:''}</div></div>
 <button class="btn up" onclick="skPop('${s.id}')" ${canLearn(s.id)?'':'disabled'}>升级</button></div>`}).join('')}`;drawTree(list)}
function drawTree(list){const t=$('.tree');if(!t)return;const o=t.getBoundingClientRect();let h='',h2='';
 // 折角连线：竖→横→竖，横段走两行图标之间的空隙；优先在父技能下方拐弯，子技能那一列竖段被别的图标挡住时改在子技能上方拐弯；
 // 折角线后画并垫一层暗色底边，和竖线交叉处显示为“跨过去”，不会被看成连到中间技能
 const R=[...t.querySelectorAll('.tn:not(.void) .ski')].map(e=>e.getBoundingClientRect()),rw=[...t.querySelectorAll('.trow')].map(e=>e.getBoundingClientRect().top),pitch=rw.length>1?rw[1]-rw[0]:48;
 const hit=(x,y1,y2,ex)=>R.some(r=>r!==ex&&x>r.left&&x<r.right&&r.bottom>y1&&r.top<y2);
 for(const s of list)for(const p of s.pre){const a=$('#tn_'+p+' .ski'),b=$('#tn_'+s.id+' .ski');if(!a||!b)continue;const A=a.getBoundingClientRect(),B=b.getBoundingClientRect();
 const on=bl(p)>0,x1=A.left+A.width/2,y1=A.bottom,x2=B.left+B.width/2,y2=B.top,g=Math.max(4,(pitch-A.height)/2);
 const ln=d=>`<path d="${d}" fill="none" stroke="${on?'#c9a45a':'#4a3820'}" stroke-width="2" stroke-linejoin="round" marker-end="url(#ar${on?1:0})"/>`;
 if(Math.abs(x1-x2)<2){h+=ln(`M${x1-o.left},${y1-o.top}V${y2-o.top}`);continue}
 const Bb=R.find(r=>r.top===B.top&&r.left===B.left),ym=hit(x2,y1+g,y2,Bb)?y2-g:y1+g,d=`M${x1-o.left},${y1-o.top}V${ym-o.top}H${x2-o.left}V${y2-o.top}`;
 h2+=`<path d="${d}" fill="none" stroke="#120d09" stroke-width="7"/>`+ln(d)}
 t.insertAdjacentHTML('beforeend',`<svg class="tlines" width="${o.width}" height="${o.height}"><defs><marker id="ar1" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0L6,3L0,6z" fill="#c9a45a"/></marker><marker id="ar0" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0L6,3L0,6z" fill="#4a3820"/></marker></defs>${h}${h2}</svg>`)}
function skIcon(s){const i=SKILLS.filter(x=>x.t===s.t).indexOf(s);const k='sk_sheet'+s.t;return IMG[k]?`<i class="ski" style="background-image:url(${IMG[k]});background-position:${(i%5)*25}% ${Math.floor(i/5)*100}%"></i>`:`<i class="ski t${s.t}">${s.ic}</i>`}
function canLearn(id){const s=SKM[id];return skOfCls(s)&&S.kp>0&&S.lvl>=s.r&&s.pre.every(p=>bl(p)>0)&&bl(id)<20}
function skPop(id){const s=SKM[id],b=bl(id);const lo=Math.max(1,b-1),hi=Math.max(4,b+3);let rows='';for(let l=lo;l<=hi;l++){const v=SV(id,l);rows+=`<div class="lvr ${l===b?'cur':''} ${l===b+1?'nx':''}">${l}级：${v.txt}${v.mana?`，消耗 ${v.mana} 法力`:''}</div>`}
 const syns=SYN[id]?`<div class="dim">协同：${SYN[id][0].map(x=>SKM[x].n+'('+bl(x)+')').join('、')} 每级 +${SYN[id][1]}%，当前 ×${syn(id).toFixed(2)}</div>`:'';
 const why=S.lvl<s.r?`需要角色等级 ${s.r}`:!s.pre.every(p=>bl(p))?`需要前置：${s.pre.map(p=>SKM[p].n).join('、')}`:S.kp<=0?'技能点不足':'';
 modal(`<div class="mtitle">技能升级</div><div class="gp"><div class="skh">${skIcon(s)}<div><b>${s.n}升级说明：</b><div class="dim">${trees()[s.t]} · 需求 ${s.r} 级${s.pre.length?' · 前置 '+s.pre.map(p=>SKM[p].n).join('、'):''}</div></div></div>${rows}${syns}
 <div class="dim">剩余技能点：${S.kp}${why?` · <span style="color:#f66">${why}</span>`:''}</div><div class="btns c"><button class="btn" onclick="closeM()">关闭</button><button class="btn gold" onclick="learn('${id}')" ${canLearn(id)?'':'disabled'}>开始升级</button></div></div>`)}
function learn(id){if(!canLearn(id))return;S.sk[id]=bl(id)+1;S.kp--;calc();skPop(id);render()}

// ===== 背包/装备 =====
function modsTxt(m){return Object.entries(m).map(([k,v])=>(MODT[k]||k+' {v}').replace('{v}',v)).join('，')}
const SLOTG={weapon:'🪄',shield:'💀',helm:'⛑',armor:'🥋',gloves:'🧤',belt:'🎗',boots:'🥾',amulet:'📿',ring:'💍'};
function itemIcon(it){if(it.k==='rune')return`<i class="ii rune">${it.r+1}</i>`;if(it.k==='gem')return`<i class="ii gem" style="--c:${GEMS[it.g].c}">◆</i>`;
 const b=BASEM[it.b];return`<i class="ii">${b.cat==='wand'?'🪄':b.cat==='dagger'?'🗡':b.cat==='sword'?'⚔':b.cat==='shield'?'🛡':SLOTG[slotOf(b)]}</i>`}
// 坏物品（缺数据/旧版存档）只显示占位，不让整页渲染崩溃
function cell(it,on){try{return cell0(it,on)}catch(e){console.warn('坏物品',it,e);return`<div class="cell bad" style="--c:#844"><span class="glyph">?</span><small>损坏物品</small></div>`}}
function cell0(it,on){return`<div class="cell q${it.q??'x'} ${it.rw!=null?'rw':''}" style="--c:${itemColor(it)}" onclick="${on}">${itemIcon(it)}${it.sock?`<em class="sk">${'●'.repeat((it.soc||[]).length)}${'○'.repeat(it.sock-(it.soc||[]).length)}</em>`:''}<small>${itemName(it)}</small></div>`}
function renderBag(){const P=$('#panel');const doll=SLOTS.map(k=>{const it=S.eq[k];return it?`<div class="dslot">${cell(it,`showItem(${it.uid},'eq')`)}</div>`:`<div class="dslot"><div class="cell empty"><i class="ii">${SLOTG[k.startsWith('ring')?'ring':k]}</i><small>${SLOTN[k]}</small></div></div>`}).join('');
 const sc=setCount();const sets=Object.entries(sc).map(([k,n])=>`<span class="setb">${SETS[k].n} ${n}件</span>`).join('');
 const fl=[['all','全部'],['eq','装备'],['misc','符文宝石']];const items=S.bag.filter(it=>BAGF==='all'||(BAGF==='eq'?!it.k:!!it.k));
 P.innerHTML=`<div class="gp"><h3>装备 <span class="dim">战力 ${SLOTS.reduce((a,k)=>a+(S.eq[k]?power(S.eq[k]):0),0)}</span></h3><div class="doll">${doll}</div>${sets}</div>
 <div class="gp"><h3>背包 ${S.bag.length}/40 <span class="r"><button class="btn xs" onclick="cubeUI()">炼金匣</button><button class="btn xs" onclick="sellJunk()">出售白/蓝</button></span></h3>
 <div class="stabs sm">${fl.map(([k,n])=>`<button class="${BAGF===k?'on':''}" onclick="BAGF='${k}';render()">${n}</button>`).join('')}</div>
 <div class="grid">${items.map(it=>cell(it,`showItem(${it.uid},'bag')`)).join('')||'<div class="dim">空</div>'}</div></div>`}
function findItem(uid){for(const k of SLOTS)if(S.eq[k]&&S.eq[k].uid===uid)return{it:S.eq[k],slot:k};const i=S.bag.findIndex(x=>x.uid===uid);return i>=0?{it:S.bag[i],i}:null}
function stars(it){const n=it.k?1:it.rw!=null?5:[1,1,2,3,4,5,5,4,5][it.q];return'★'.repeat(n)+'☆'.repeat(5-n)}
function showItem(uid){const f=findItem(uid);if(!f)return;const it=f.it;
 if(it.k){const desc=it.k==='rune'?`<div class="sec"><h4>【符文】</h4><div>需求等级 ${RUNES[it.r][1]}</div><div>镶入武器：<span class="g">${modsTxt(RUNES[it.r][2])}</span></div><div>镶入防具/盾：<span class="g">${modsTxt(RUNES[it.r][3])}</span></div></div>`:
  `<div class="sec"><h4>【宝石】</h4><div>武器：<span class="g">${modsTxt(GEMS[it.g].w(it.lv))}</span></div><div>防具：<span class="g">${modsTxt(GEMS[it.g].a(it.lv))}</span></div><div>盾/缩颅：<span class="g">${modsTxt(GEMS[it.g].s(it.lv))}</span></div></div>`;
  return modal(`<div class="ipanel"><div class="ih">${itemIcon(it)}<div><b style="color:${itemColor(it)}">${itemName(it)}</b><div class="dim">${stars(it)}</div></div></div>${desc}<div class="tags"><span>可交易</span><span>可镶嵌</span></div><div class="btns c"><button class="btn" onclick="sell(${uid})">出售 ${sellPrice(it)}◈</button><button class="btn" onclick="closeM()">关闭</button></div></div>`)}
 const b=BASEM[it.b],l=itemLocal(it),r=itemReq(it),m=allMods(it),ok=canEquip(it);
 const vis=[],hid=[];for(const k in it.m){const t=(MODT[k]||k).replace('{v}',it.m[k]);if(['edmg','edef','mindmg','maxdmg'].includes(k)&&(b.dmg||b.def))continue;(HIDDEN_KEYS.has(k)?hid:vis).push(t)}
 const sm=socketMods(it);
 let base='';if(b.dmg){const enh=l.min!==it.dmg[0]||l.max!==it.dmg[1];base+=`<div>单手伤害：<span class="${enh?'g':''}">${l.min}-${l.max}</span>${enh?` <small class="dim">(基础 ${it.dmg[0]}-${it.dmg[1]})</small>`:''}</div>`}
 if(b.def){const enh=l.def!==it.def;base+=`<div>防御：<span class="${enh?'g':''}">${l.def}</span>${enh?` <small class="dim">(基础 ${it.def})</small>`:''}</div>`}if(b.block)base+=`<div>格挡：${b.block}%</div>`;
 const setT=it.set?`<div class="setsec"><b>${SETS[it.set].n}</b>（已装备 ${setCount()[it.set]||0} 件）${Object.entries(SETS[it.set].bonus).map(([n,bo])=>`<div class="${(setCount()[it.set]||0)>=+n?'g':'dim'}">${n}件：${modsTxt(bo)}</div>`).join('')}${SETITEMS.filter(x=>x.set===it.set).map(x=>`<div class="dim">· ${x.n}</div>`).join('')}</div>`:'';
 const rwT=it.rw!=null?`<div class="rwt">符文之语「${RUNEWORDS[it.rw].n}」『${RUNEWORDS[it.rw].r.map(i=>RUNES[i][0]).join('+')}』</div><div class="g">${modsTxt(RUNEWORDS[it.rw].m)}</div>`:'';
 const socs=it.sock?`<div class="socks">${[...Array(it.sock)].map((_,i)=>{const x=it.soc[i];return x?`<span class="so on" style="--c:${x.g?GEMS[x.g].c:'#ffa040'}">${x.g?'◆':x.r+1}</span>`:'<span class="so"></span>'}).join('')}</div>
  <div>${it.soc.length?`<span class="g">${modsTxt(Object.fromEntries(Object.entries(sm).filter(([k])=>it.rw==null||!(k in RUNEWORDS[it.rw].m))))}</span>`:'<span class="dim">空凹槽可镶嵌宝石/符文；白色底材按配方顺序镶满符文可组成符文之语</span>'}</div>${rwT}`:'<span class="dim">无凹槽</span>';
 const cmp=f.slot?'':(()=>{const k=slotOf(b)==='ring'?'ring1':slotOf(b);const e=S.eq[k];return e?`<div class="dim">当前已装备：${itemName(e)}（战力 ${power(e)}）</div>`:''})();
 const canSock=it.sock>it.soc.length&&it.rw==null&&S.bag.some(x=>x.k);
 modal(`<div class="ipanel q${it.q}"><div class="ih">${itemIcon(it)}<div><b style="color:${itemColor(it)}">${itemName(it)}</b><div class="dim">${b.n} · ${['普通','扩展','精英'][b.tier]}级 · ${QN[it.rw!=null?8:it.q]}${it.sock&&it.q<3&&it.rw==null?' · 有凹槽':''}</div><div class="star">${stars(it)}</div><div class="dim">物品等级 ${it.il} · 耐久 —（挂机不磨损）</div></div></div>
 <div class="sec"><h4>【基础属性】</h4>${base}${vis.map(t=>`<div class="g">${t}</div>`).join('')}<div class="${S.lvl>=r.lv?'':'bad'}">需求等级：${r.lv}</div>${r.str?`<div class="${ST.attr.str>=r.str?'':'bad'}">需求力量：${r.str}</div>`:''}${r.dex?`<div class="${ST.attr.dex>=r.dex?'':'bad'}">需求敏捷：${r.dex}</div>`:''}</div>
 ${hid.length?`<div class="sec hid"><h4>【隐藏属性】</h4>${hid.map(t=>`<div>${t}</div>`).join('')}</div>`:''}${setT}
 <div class="sec"><h4>【铸造 / 凹槽 ${it.soc.length}/${it.sock}】</h4>${socs}</div>
 <div class="pw">战力 <b>${power(it)}</b></div>${cmp}<div class="tags"><span>可交易</span><span>已鉴定</span>${it.q===5?'<span class="u">暗金</span>':''}${it.set?'<span class="s">套装</span>':''}${it.rw!=null?'<span class="u">符文之语</span>':''}</div>
 <div class="btns c">${f.slot?`<button class="btn" onclick="unequip('${f.slot}')">卸下</button>`:`<button class="btn gold" onclick="equip(${uid})" ${ok?'':'disabled'}>${ok?'装备':'需求不足'}</button>`}
 ${canSock?`<button class="btn" onclick="sockUI(${uid})">镶嵌</button>`:''}${S.imbue&&!f.slot&&(it.q===1||it.q===2)&&!it.soc.length?`<button class="btn gold" onclick="imbue(${uid})">灌注</button>`:''}
 ${f.slot?'':`<button class="btn" onclick="sell(${uid})">出售 ${sellPrice(it)}◈</button>`}<button class="btn" onclick="closeM()">关闭</button></div></div>`)}
function equip(uid){const f=findItem(uid);if(!f||f.slot)return;const it=f.it,b=BASEM[it.b];let k=slotOf(b);if(k==='ring')k=!S.eq.ring1?'ring1':!S.eq.ring2?'ring2':'ring1';
 S.bag.splice(f.i,1);if(S.eq[k])S.bag.push(S.eq[k]);S.eq[k]=it;calc();H.life=Math.min(H.life,ST.life);closeM();render()}
function unequip(k){if(S.bag.length>=40)return toast('背包已满');S.bag.push(S.eq[k]);delete S.eq[k];calc();closeM();render()}
function sell(uid){const f=findItem(uid);if(!f||f.slot)return;S.gold+=sellPrice(f.it);S.bag.splice(f.i,1);closeM();render()}
function sellJunk(){let g=0;S.bag=S.bag.filter(it=>{if(!it.k&&it.q<=3&&!it.sock&&it.rw==null){g+=sellPrice(it);return false}return true});S.gold+=g;toast('出售获得 '+g+' 金币');render()}
function imbue(uid){const f=findItem(uid);const it=f.it;const n=genItem(Math.max(S.lvl,it.il),{base:BASEM[it.b],q:4});n.uid=it.uid;S.bag[f.i]=n;S.imbue=0;log(`灌注成功：<span style="color:${QC[4]}">${n.name}</span>`);showItem(n.uid);render()}
function sockUI(uid){const f=findItem(uid);const g=S.bag.filter(x=>x.k);modal(`<div class="mtitle">选择镶嵌物</div><div class="gp"><div class="dim">镶嵌不可逆。白色底材镶满且顺序与配方一致时形成符文之语。</div><div class="grid">${g.map(x=>cell(x,`doSock(${uid},${x.uid})`)).join('')}</div><div class="btns c"><button class="btn" onclick="showItem(${uid})">返回</button></div></div>`)}
function doSock(uid,gid){const f=findItem(uid),it=f.it,gi=S.bag.findIndex(x=>x.uid===gid),g=S.bag[gi];if(it.soc.length>=it.sock)return;S.bag.splice(gi,1);it.soc.push(g.k==='gem'?{g:g.g,lv:g.lv}:{r:g.r});
 if(it.soc.length===it.sock&&(it.q===1||it.q===2)&&it.soc.every(x=>x.r!=null)){const cat=BASEM[it.b].cat;const w=RUNEWORDS.findIndex(w=>w.r.length===it.sock&&(typeof rwCatOk==='function'?rwCatOk(w,cat):w.cats.includes(cat))&&w.r.every((r,i)=>it.soc[i].r===r));if(w>=0){it.rw=w;log(`<b class="uq">符文之语「${RUNEWORDS[w].n}」诞生！</b>`);toast('符文之语：'+RUNEWORDS[w].n)}}
 calc();showItem(uid);render()}
// ===== 炼金匣 =====
function cubeUI(){const rec=[];const gc={},rc={};for(const x of S.bag){if(x.k==='gem'&&x.lv<4)(gc[x.g+x.lv]=gc[x.g+x.lv]||[]).push(x);if(x.k==='rune'&&x.r<10)(rc[x.r]=rc[x.r]||[]).push(x)}
 for(const k in gc)if(gc[k].length>=3)rec.push([`3×${itemName(gc[k][0])} → ${GEMG[gc[k][0].lv+1]}${GEMS[gc[k][0].g].n}`,`cubeGem('${k}')`]);
 for(const k in rc)if(rc[k].length>=3)rec.push([`3×${RUNES[k][0]}符文 → ${RUNES[+k+1][0]}符文`,`cubeRune(${k})`]);
 const has=(f)=>S.bag.find(f);const amu=has(x=>!x.k&&x.b==='amu'&&x.q===3),rin=has(x=>!x.k&&x.b==='rin'&&x.q===3);
 if(amu&&has(x=>x.k==='rune'&&x.r===7)&&has(x=>x.k==='gem'&&x.g==='ame'))rec.push(['魔法护符+8号符文+紫晶 → 施法护符(合成)',"craft('amu')"]);
 if(rin&&has(x=>x.k==='rune'&&x.r===10)&&has(x=>x.k==='gem'&&x.g==='rub'))rec.push(['魔法戒指+11号符文+赤玉 → 嗜血戒指(合成)',"craft('rin')"]);
 modal(`<div class="mtitle">炼金匣</div><div class="gp"><div class="dim">配方：3 同级同色宝石→升一级；3 同符文→下一枚(前10枚)；魔法护符+8号+紫晶→施法护符；魔法戒指+11号+赤玉→嗜血戒指</div>
 ${rec.length?rec.map(([t,f])=>`<div class="row"><span>${t}</span><button class="btn xs gold" onclick="${f}">合成</button></div>`).join(''):'<div class="dim" style="margin:10px 0">背包中没有满足条件的材料</div>'}<div class="btns c"><button class="btn" onclick="closeM()">关闭</button></div></div>`)}
function takeBag(f,n){for(let i=0;i<n;i++){const j=S.bag.findIndex(f);if(j>=0)S.bag.splice(j,1)}}
function cubeGem(k){const g=k.slice(0,3),lv=+k.slice(3);takeBag(x=>x.k==='gem'&&x.g===g&&x.lv===lv,3);S.bag.push({uid:S.uid++,k:'gem',g,lv:lv+1});cubeUI();render()}
function cubeRune(r){takeBag(x=>x.k==='rune'&&x.r===r,3);S.bag.push({uid:S.uid++,k:'rune',r:r+1});S.found[r+1]=1;cubeUI();render()}
function craft(t){const isA=t==='amu';takeBag(x=>!x.k&&x.b===t&&x.q===3,1);takeBag(x=>x.k==='rune'&&x.r===(isA?7:10),1);takeBag(x=>x.k==='gem'&&x.g===(isA?'ame':'rub'),1);
 const it=genItem(Math.max(S.lvl,10),{base:BASEM[t],q:7});it.name=isA?'施法护符':'嗜血戒指';if(isA){it.m.fcr=(it.m.fcr||0)+R(5,10);it.m.mana=(it.m.mana||0)+R(10,20)}else{it.m.ll=(it.m.ll||0)+R(1,3);it.m.life=(it.m.life||0)+R(10,20)}
 S.bag.push(it);log(`合成：<span style="color:${QC[7]}">${it.name}</span>`);showItem(it.uid);render()}

// ===== 地图页 =====
let MAPA=0;
function renderMap(){const P=$('#panel');const A=ACTS[MAPA];
 P.innerHTML=`<div class="stabs">${ACTS.map((a,i)=>`<button class="${MAPA===i?'on':''}" onclick="MAPA=${i};render()">第${'一二三四五'[i]}章</button>`).join('')}</div>
 <div class="gp actc"><h3>${A.n}</h3><div class="dim">营地：${A.camp} · 章节首领：<b class="bossn">${A.boss}</b></div>
 <div class="btns">${DIFFS.map((d,i)=>`<button class="btn xs ${S.diff===i?'on':''}" disabled>${d.n}${d.pen?`(抗性${d.pen})`:''}${d.lock?' 🔒':''}</button>`).join('')}</div></div>
 ${A.lock?`<div class="gp"><div class="dim">🔒 本章将在后续阶段开放（区域结构已在数据中预留）</div>${A.zones.map(z=>`<div class="zc lock"><b>${z.n}</b><span>mlvl ${z.ml}</span></div>`).join('')}</div>`:
 A.zones.map((z,i)=>{const lk=i>S.unl,cur=i===S.zone;return`<div class="zc ${lk?'lock':''} ${cur?'cur':''} ${z.boss?'bz':''}" onclick="${lk?'':`goZone(${i});TAB='fight';render()`}">
  <div><b>${z.n}</b> ${z.dun?'<span class="tag">地下城</span>':''}${z.side?'<span class="tag">支线</span>':''}${S.cleared[i]?'<span class="tag ok">已肃清</span>':''}<div class="dim">${z.mons.map(k=>MONS[k].n).join('·')}${z.boss?` · 首领 <span class="bossn">${BOSSES[z.boss].n}</span>`:''}</div>
  ${z.quest?`<div class="q ${S.q[z.quest]?'ok':''}">${S.q[z.quest]?'✔':'❗'} 任务：${QUESTS[z.quest].n}（${QUESTS[z.quest].rw}）</div>`:''}</div>
  <div class="zr"><span>mlvl ${z.ml}</span><small>${z.w}波</small>${lk?'🔒':cur?'<em>当前</em>':''}</div></div>`}).join('')}`}

// ===== 通用 =====
function modal(h){const m=$('#modal');m.innerHTML=`<div class="mb">${h}</div>`;m.classList.remove('hide')}
function closeM(){$('#modal').classList.add('hide')}
function render(){document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===TAB));
 $('#fightv').classList.toggle('hide',TAB!=='fight');$('#panel').classList.toggle('hide',TAB==='fight');
 if(TAB==='fight'){LOGDIRTY=1;renderFight()}else if(TAB==='hero')renderHero();else if(TAB==='skill')renderSkills();else if(TAB==='bag')renderBag();else if(TAB==='map')renderMap()}
// ===== 离线收益 =====
function offline(){const sec=(Date.now()-S.last)/1000;if(sec<60)return;const t=Math.min(sec,8*3600);const kpm=Math.max(2,S.kpm||4);const kills=Math.floor(kpm*t/60*0.5);if(kills<1)return;
 const z=zoneData();let xp=0,g0=S.gold,got=[];for(let i=0;i<kills;i++){const m=mkMon(pick(z.mons),z.ml);const diff=S.lvl-m.lv;let f=diff>5?([.81,.62,.43,.24][diff-6]??.05):1;xp+=m.exp*f;
  if(got.length<30)for(const it of rollTC(m)){got.push(it)}}
 xp=Math.round(xp);gainXp(xp);for(const it of got)addBag(it);
 modal(`<div class="mtitle">离线收益</div><div class="gp"><div>离线 ${Math.floor(t/3600)}小时${Math.floor(t%3600/60)}分（上限8小时，效率50%）</div><div>于 <b>${z.n}</b> 击杀 ${kills} 只怪物</div><div>经验 +${fmt(xp)}　金币 +${fmt(S.gold-g0)}</div>
 <div class="grid">${got.map(it=>cell(it,'')).join('')}</div><div class="btns c"><button class="btn gold" onclick="closeM()">收下</button></div></div>`)}
// ===== 挂机自动化：自动加点/换装 =====
const SK_ORDER=['rs','rs','rs','sm','te','ce','rs','sm','cg','ad','rm','bs','bs','bs','sm','rs','bs','bs','bs','bs','bs','wk'];
// 列表走完后：骨矛加满(20) → 骨铠/骨墙/骨牢(前置各 1) → 骨魂加满 → 骨巫/骨仆精通/骨仆
const SK_FILL=()=>bl('bs')<20?['bs','sm','rs','te']:[...['ba','bw','bp'].filter(x=>!bl(x)),'bx','rm','sm','rs','cg','te'];
function autoTick(){let ch={};ch=0;const learned=[];for(const[k,c]of[['hp',30],['mp',30]])while(S.pot[k]<8&&S.gold>=c*4){S.gold-=c;S.pot[k]++}
 const PL=(typeof clsSkPlan==='function'&&clsSkPlan())||{order:SK_ORDER,fill:SK_FILL};
 if(S.autoSk)while(S.kp>0){const done={};const id=PL.order.find(x=>{done[x]=(done[x]||0)+1;return bl(x)<done[x]&&canLearn(x)})||PL.fill().find(canLearn);if(!id)break;S.sk[id]=bl(id)+1;S.kp--;ch=1;learned.push(SKM[id].n)}if(learned.length)log('自动加点：'+learned.join('、'));
 if(S.autoAt&&S.sp>0){const ns=needStr();while(S.sp>0){if(ST.attr.str<ns)S.at.str++;else if(curCls()==='nec'?(ST.attr.ene<S.lvl+25&&S.at.ene<S.lvl+15):clsBase().autoEne())S.at.ene++;else S.at.vit++;S.sp--;calc()}ch=1}
 if(S.autoEq)for(const it of S.bag.slice()){if(!it||it.k||!BASEM[it.b]||!canEquip(it))continue;const b=BASEM[it.b];let k=slotOf(b);if(k==='ring')k=!S.eq.ring1?'ring1':!S.eq.ring2?'ring2':(power(S.eq.ring1)<power(S.eq.ring2)?'ring1':'ring2');
  if(!S.eq[k]||power(it)>power(S.eq[k])){const i=S.bag.indexOf(it);S.bag.splice(i,1);if(S.eq[k])S.bag.push(S.eq[k]);S.eq[k]=it;ch=1;log(`自动换装：<span style="color:${itemColor(it)}">${itemName(it)}</span>`)}}
 if(ch){calc();if(TAB!=='fight')render()}}
function needStr(){let n=0;for(const it of S.bag)if(it&&!it.k&&BASEM[it.b]){const r=itemReq(it);if(r.lv<=S.lvl+3&&r.str<=ST.attr.str+10)n=Math.max(n,r.str)}return Math.min(n,60)}
// 我方行可横向滑动：右侧还有内容时加渐隐遮罩提示
function arowHint(){const a=$('#arow');if(a)a.classList.toggle('ovf',a.scrollLeft+a.clientWidth<a.scrollWidth-2)}
// ===== 主循环 =====
let arowN=0,lastT=performance.now(),autoT=0,acc=0,uiT=0,saveT=0;
// 主循环出错时也要继续调度下一帧，否则单个坏数据会让整个游戏停住
// 省电：限帧（普通 30fps / 省电 15fps）；息屏或后台时不推进、不渲染（回来后按离线公式结算，见 power.js）
const PWRF={fps:30,ui:0.25,paused:0};
// 暂停（息屏/后台）时彻底停掉 rAF，不空转；恢复时调用 PWRF.resume()
PWRF.stopped=0;PWRF.resume=()=>{if(!PWRF.stopped)return;PWRF.stopped=0;lastT=performance.now();requestAnimationFrame(loop)};
// 省电：非战斗页不需要画面，改为 4 次/秒的定时器只跑模拟（不再每帧唤醒 rAF）；回到战斗页立即切回 rAF
PWRF.bgMs=250;let loopTm=0;
function loopSched(){if(TAB==='fight'){requestAnimationFrame(loop)}else{loopTm=setTimeout(()=>{loopTm=0;loop(performance.now())},PWRF.bgMs)}}
PWRF.kick=()=>{if(PWRF.stopped||PWRF.paused||!loopTm||TAB!=='fight')return;clearTimeout(loopTm);loopTm=0;requestAnimationFrame(loop)};
function loop(now){if(PWRF.paused){PWRF.stopped=1;return}if(TAB!=='fight'||now-lastT>=1000/PWRF.fps-2){try{loop0(now)}catch(e){console.error(e)}}loopSched()}
function loop0(now){let dt=Math.min(TAB==='fight'?0.1:0.3,(now-lastT)/1000);lastT=now;const sim=dt*SPEED;let n=Math.ceil(sim/0.05);for(let i=0;i<n;i++)step(sim/n);
 uiT+=dt;if(uiT>PWRF.ui){uiT=0;if(TAB==='fight'){renderFight();if(++arowN%4===0)arowHint()}}if(TAB==='fight')drawFX(dt);else if(FX.length){FX.length=0;drawFX(0)}
 autoT+=dt*SPEED;if(autoT>1){autoT=0;autoTick()}saveT+=dt;if(saveT>5){saveT=0;killWin=killWin.filter(t=>GT-t<120);if(GT>60)S.kpm=killWin.length/Math.min(2,GT/60);save()}}
function init(){load();calc();H.life=ST.life;H.mana=ST.mana;loadAssets();
 document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>{TAB=b.dataset.t;render();PWRF.kick()});
 $('#modal').onclick=e=>{if(e.target.id==='modal')closeM()};
 for(const k of['hp','mp','rej','tp'])$('#pb_'+k).onclick=()=>usePot(k);
 if(S.lvl===1&&!S.kills){log('欢迎来到暮土。'+clsName()+'，从<b>荒血原野</b>开始你的旅程。');}
 offline();render();requestAnimationFrame(loop);document.addEventListener('visibilitychange',save)}
const dbg={speed:n=>SPEED=n,lvl:n=>{while(S.lvl<n)gainXp(xpNeed(S.lvl+1)-S.xp)},zone:i=>{S.unl=Math.max(S.unl,i);goZone(i)},loot:(n,ml=12,mf=300)=>{for(let i=0;i<n;i++)addBag(genItem(ml,{mf}))},
 give:it=>addBag(it),rune:r=>addBag({uid:S.uid++,k:'rune',r}),gem:(g,lv)=>addBag({uid:S.uid++,k:'gem',g,lv}),offline:h=>{S.last=Date.now()-h*3600e3;offline()}};
// 延迟到 DOMContentLoaded，让后续脚本(acts.js)先完成扩展
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
