// 装备/掉落系统测试：node tests/items_test.js
const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.join(__dirname,'..');
const stub=()=>new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?()=>'' :k==='readyState'?'loading':stub(),apply:()=>stub(),construct:()=>stub(),set:()=>true});
const store={};
const ctx={console,Math,Date,JSON,setTimeout:()=>0,setInterval:()=>0,clearInterval(){},requestAnimationFrame:()=>0,
 localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v},removeItem:k=>{delete store[k]}},
 document:stub(),Image:function(){return stub()},navigator:{},location:{search:''},addEventListener(){},performance:{now:()=>Date.now()}};
ctx.window=ctx;vm.createContext(ctx);
for(const f of ['data.js','data_items.js','data_acts.js','game.js','items.js','acts.js'])if(fs.existsSync(path.join(root,f)))vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});
const G=s=>vm.runInContext(s,ctx);
G('S=newSave();if(!S.stash)S.stash=[];calc()');
let fails=0,passes=0;const ok=(c,msg)=>{if(c)passes++;else{fails++;console.log('  ✗ '+msg)}};
const sec=t=>console.log('\n== '+t);
const BASES=G('BASES'),BASEM=G('BASEM'),PREFIX=G('PREFIX'),SUFFIX=G('SUFFIX'),RUNES=G('RUNES'),RUNEWORDS=G('RUNEWORDS'),UNIQUES=G('UNIQUES'),SETITEMS=G('SETITEMS'),SETS=G('SETS');
const genItem=G('genItem'),qualityChance=G('qualityChance'),power=G('power'),maxSock=G('maxSock');
const Q=['破旧','普通','精良','魔法','稀有','暗金','套装'];

sec('数据规模');
console.log(`  底材 ${BASES.length}  前缀 ${PREFIX.length}  后缀 ${SUFFIX.length}  符文 ${RUNES.length}  符文之语 ${RUNEWORDS.length}  暗金 ${UNIQUES.length}  套装 ${Object.keys(SETS).length}/${SETITEMS.length}件`);
ok(RUNES.length===33,'符文应为33');ok(RUNEWORDS.length>=30,'符文之语≥30');ok(UNIQUES.length>=40,'暗金≥40');ok(Object.keys(SETS).length>=8,'套装≥8');
for(const u of [...UNIQUES,...SETITEMS])ok(BASEM[u.b],'暗金/套装底材不存在: '+u.n);
const slots=new Set(BASES.filter(b=>!b.jew).map(b=>b.s)),uslots=new Set(UNIQUES.map(u=>BASEM[u.b]&&BASEM[u.b].s));
for(const s of slots)ok(uslots.has(s),'暗金未覆盖部位 '+s);
const tiers=new Set(UNIQUES.map(u=>BASEM[u.b]&&(BASEM[u.b].tier||0)));ok(tiers.size>=3,'暗金应覆盖三档底材');

sec('品质分布（各 20000 件）');
for(const [il,mf] of [[10,0],[30,0],[60,0],[85,0],[85,300]]){const c=[0,0,0,0,0,0,0];for(let i=0;i<20000;i++)c[genItem(il,{mf}).q]++;
 console.log(`  ilvl${il} MF${mf}: `+c.map((n,i)=>Q[i]+(n/200).toFixed(2)+'%').join(' '));ok(c[3]>c[4]&&c[4]>c[5],'魔法>稀有>暗金 应成立 ilvl'+il)}

sec('暗金率 vs MF（qualityChance 理论值，与原版公式一致）');
const ub=BASES.find(b=>b.tier===2)||BASES[BASES.length-1];const pr={};
for(const mf of [0,100,300]){const p=128/qualityChance('u',85,ub,mf,null);pr[mf]=p;const eff=G(`effMF('u',${mf})`);console.log(`  MF${mf}（有效${eff}）: 暗金检定成功率 ${(p*100).toFixed(3)}%  底材=${ub.n}`)}
ok(pr[100]>pr[0]&&pr[300]>pr[100],'暗金率随MF单调上升');ok(pr[300]/pr[0]<=2.37,'MF300 暗金倍数应受递减(有效MF136 → ≤2.36x)');
ok(G(`effMF('u',300)`)===136&&G(`effMF('s',300)`)===187&&G(`effMF('r',300)`)===200&&G(`effMF('m',300)`)===300,'MF 递减值应为 136/187/200/300');

sec('词缀合法性（30000 件魔法/稀有）');
const AFF={};for(const a of [...PREFIX,...SUFFIX])AFF[a.n]=a;
let bad=0,dup=0,cnt=0,pmax=0,smax=0;
for(let i=0;i<30000;i++){const il=1+(i%99);const it=genItem(il,{q:i%2?3:4});if(!it.af)continue;cnt++;
 const gs=it.af.map(n=>AFF[n].g);if(new Set(gs).size!==gs.length)dup++;
 const np=it.af.filter(n=>PREFIX.includes(AFF[n])).length,ns=it.af.length-np;pmax=Math.max(pmax,np);smax=Math.max(smax,ns);
 if(it.q===3&&(np>1||ns>1))bad++;if(it.q===4&&(np>3||ns>3||it.af.length>6))bad++;
 const al=G('alvlOf')(il,BASEM[it.b].q);
 for(const n of it.af){const a=AFF[n];if(a.lv>al)bad++;if(!G('affOk')(a,BASEM[it.b]))bad++}
 // 数值范围：若某属性只来自单个词缀，值须在区间内
 const src={};for(const n of it.af)for(const k in AFF[n].m)(src[k]=src[k]||[]).push(AFF[n].m[k]);
 for(const k in src){if(k==='sockp'||src[k].length>1||String(k).startsWith('sk_'))continue;const [lo,hi]=src[k][0],v=it.m[k];if(k==='edmg'||k==='edef')continue;if(v<lo||v>hi){bad++;if(bad<5)console.log('  越界',it.name,k,v,lo,hi)}}}
console.log(`  检查 ${cnt} 件，非法 ${bad}，同组重复 ${dup}，最多前缀 ${pmax} 后缀 ${smax}`);ok(bad===0,'词缀非法');ok(dup===0,'同组词缀重复');ok(pmax<=3&&smax<=3,'前后缀上限3');
for(const a of [...PREFIX,...SUFFIX])for(const k in a.m)ok(a.m[k][0]<=a.m[k][1],'词缀区间倒置 '+a.n+k);

sec('暗金/套装数值区间');
let ub2=0;for(let i=0;i<3000;i++){const U=UNIQUES[i%UNIQUES.length];const it=genItem(99,{base:BASEM[U.b],q:5});if(it.q!==5)continue;const UU=UNIQUES.find(x=>x.n===it.name&&x.b===U.b);
 for(const k in UU.m){const v=UU.m[k];if(Array.isArray(v)){if(it.m[k]<v[0]||it.m[k]>v[1])ub2++}}}
ok(ub2===0,'暗金数值越界 '+ub2);console.log('  暗金越界 '+ub2);

sec('凹槽上限');
let sb=0;for(let i=0;i<20000;i++){const il=1+(i%99);const it=genItem(il);if((it.sock||0)>maxSock(BASEM[it.b],il))sb++}
ok(sb===0,'凹槽超上限 '+sb);console.log('  超上限 '+sb);

sec('符文之语配方');
const D2={'精钢':[2,0]};const NAMES=new Set();let rb=0;
for(const w of RUNEWORDS){if(NAMES.has(w.n))rb++;NAMES.add(w.n);
 if(!w.r.every(i=>i>=0&&i<33))rb++;
 const cap=Math.max(0,...BASES.filter(b=>w.cats.includes(b.cat)).map(b=>maxSock(b,99)));if(w.r.length>cap){rb++;console.log('  孔不够',w.n,w.r.length,cap)}
 const rq=Math.max(...w.r.map(i=>RUNES[i][1]));if(w.lv<rq){rb++;console.log('  需求低于符文',w.n)}}
const keys=RUNEWORDS.map(w=>w.r.join(',')+'|'+w.cats.join(','));ok(new Set(keys).size===keys.length,'配方重复');
ok(rb===0,'符文之语配方错误 '+rb);
// 实际镶嵌验证：用 doSock 流程拼一个
const w0=RUNEWORDS[0];const b0=BASES.find(b=>w0.cats.includes(b.cat)&&maxSock(b,99)>=w0.r.length);
const it0=genItem(60,{base:b0,q:1});it0.sock=w0.r.length;it0.soc=[];
G('S').bag=[it0];for(const r of w0.r){const ru={uid:G('S.uid++'),k:'rune',r};G('S').bag.push(ru);try{G('doSock')(it0.uid,ru.uid)}catch(e){}}
console.log(`  ${w0.n}：镶嵌后 rw=${it0.rw} soc=${it0.soc.length}`);ok(it0.rw===0,'按配方镶嵌应生成符文之语（doSock 签名不同时可能失败）');

sec('物品强度曲线（按部位，各等级 2000 件稀有平均 power）');
for(const slot of ['weapon','armor','helm','shield']){const curve=[];for(let l=5;l<=95;l+=10){let s=0;for(let i=0;i<2000;i++)s+=power(genItem(l,{q:4,slot}));curve.push(s/2000)}
 let mono=true,jump=0;for(let i=1;i<curve.length;i++){if(curve[i]<curve[i-1]*0.95)mono=false;jump=Math.max(jump,curve[i]/curve[i-1])}
 console.log(`  ${slot}: `+curve.map((v,i)=>`L${5+i*10}:${v.toFixed(0)}`).join(' ')+`  最大相邻倍率 ${jump.toFixed(2)}`);
 ok(mono,slot+' 强度曲线应基本单调(允许5%抖动)');ok(jump<2.5,slot+' 相邻档跳变<2.5x')}

console.log(`\n结果：通过 ${passes}，失败 ${fails}`);process.exit(fails?1:0);
