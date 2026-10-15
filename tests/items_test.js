// 装备/掉落系统测试：node tests/items_test.js
const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.join(__dirname,'..');
const stub=()=>new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?()=>'' :k==='readyState'?'loading':stub(),apply:()=>stub(),construct:()=>stub(),set:()=>true});
const store={};
// 固定随机种子（mulberry32）：游戏代码在加载时捕获 Math.random，故在此替换上下文的 Math，保证每次运行结果一致
const SEED=Number(process.env.SEED||20261013)>>>0;let _sd=SEED;const SMath=Object.create(Math);SMath.random=()=>{_sd=(_sd+0x6D2B79F5)>>>0;let t=_sd;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296};
const ctx={console,Math:SMath,Date,JSON,setTimeout:()=>0,setInterval:()=>0,clearInterval(){},requestAnimationFrame:()=>0,
 localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v},removeItem:k=>{delete store[k]}},
 document:stub(),Image:function(){return stub()},navigator:{},location:{search:''},addEventListener(){},performance:{now:()=>Date.now()}};
ctx.window=ctx;vm.createContext(ctx);
ctx.__NOUI=1;ctx.__NOSHOWLOGIN=1;
for(const f of ['data.js','data_items.js','data_items2.js','data_acts.js','game.js','items.js','acts.js','items2.js','stash.js','loot.js','shop.js','cloud.js'])if(fs.existsSync(path.join(root,f)))vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});
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
 ok(mono,slot+' 强度曲线应基本单调(允许5%抖动)');{const lim=slot==='armor'?2.6:2.5;ok(jump<lim,slot+' 相邻档跳变<'+lim+'x')}}


// ======================= 第四阶段：装备扩充 / 仓库 / 多角色 / 商店 / 回收 / 堆叠 =======================
sec('第四阶段数据');
const CATS=new Set(BASES.map(b=>b.cat));for(const c of ['bow','xbow','polearm','spear','jav','throw','axe','mace','staff','jewel','scha','mcha','lcha'])ok(CATS.has(c),'缺少底材类型 '+c);
for(const b of BASES){if(b.dmg)ok(b.dmg[0]<=b.dmg[1]&&b.dmg[0]>0,'底材伤害非法 '+b.id);if(b.def)ok(b.def[0]<=b.def[1],'底材防御非法 '+b.id);ok(b.q>=1&&b.q<=99,'底材等级 '+b.id);ok(b.tier>=0&&b.tier<=2,'档位 '+b.id)}
ok(new Set(BASES.map(b=>b.id)).size===BASES.length,'底材 id 重复');
ok(UNIQUES.length>=58+60,'暗金至少 118（现 '+UNIQUES.length+'）');ok(Object.keys(SETS).length>=30,'套装≥30');ok(RUNEWORDS.length>=78,'符文之语≥78');
ok(new Set(UNIQUES.map(u=>u.n)).size===UNIQUES.length,'暗金重名');ok(new Set(SETITEMS.map(u=>u.n)).size===SETITEMS.length,'套装件重名');ok(new Set(RUNEWORDS.map(u=>u.n)).size===RUNEWORDS.length,'符文之语重名');
for(const u of [...UNIQUES,...SETITEMS]){for(const k in u.m){const v=u.m[k];ok(Array.isArray(v)?v[0]<=v[1]:typeof v==='number','数值非法 '+u.n+'.'+k)}ok(u.rq<=99&&u.lv<=99,'等级 '+u.n)}
for(const k in SETS){const n=SETITEMS.filter(x=>x.set===k).length;ok(n>=2,'套装件数<2 '+k);for(const t in SETS[k].bonus)ok(+t<=n,'套装奖励阈值超件数 '+k+t)}
const UPK=G('UPGRADE_RECIPES').map(r=>r.slice(1).join(','));ok(new Set(UPK).size===UPK.length,'升级配方重复');
ok(G("BASEM.bow1.th===1&&BASEM.pole1.th===1&&!BASEM.jav1.th"),'双手标记');ok(G("MERCS.archer.wcats.includes('bow')&&MERCS.guard.wcats.includes('polearm')"),'随从可用弓/长柄');
console.log(`  底材 ${BASES.length}  暗金 ${UNIQUES.length}  套装 ${Object.keys(SETS).length}/${SETITEMS.length}件  符文之语 ${RUNEWORDS.length}`);

sec('护身符 / 珠宝 / 战斗属性');
G('GS.clear()');G('load();calc()');
let cq=0;for(let i=0;i<3000;i++){const it=G(`genItem(60,{base:BASEM.cha_l})`);if(it.q!==3&&it.q!==5)cq++}ok(cq===0,'护身符只能是魔法/暗金 '+cq);
G(`S.bag=[];calc();window._l0=ST.life;const c=genItem(60,{base:BASEM.cha_l,q:3});c.m={life:40};S.bag.push(c);calc();window._l1=ST.life;S.pst[0].push(S.bag.pop());calc();window._l2=ST.life`);
ok(G('_l1')===G('_l0')+40&&G('_l2')===G('_l0'),'护身符背包生效/仓库不生效 '+G('[_l0,_l1,_l2]'));
G(`window._w=genItem(40,{base:BASEM.swd4,q:1});_w.sock=2;_w.soc=[];S.bag=[_w];const j=genItem(40,{base:BASEM.jew,q:3});j.m={edmg:20,str:5};S.bag.push(j);doSockJewel(_w.uid,j.uid)`);
ok(G('allMods(_w).str===5&&S.bag.length===1'),'珠宝镶嵌生效');
G(`calc();ST.M.cb=100;ST.M.ow=100;ST.M.ds=0;window._m=mkMon(Object.keys(MONS)[0],10);_m.hp=_m.max=1000;hitMon(_m,{phys:1},'hero','#fff')`);ok(G('_m.hp<=750&&_m.ow&&_m.ow.left===8'),'压碎性打击/撕裂伤口生效 hp='+G('_m.hp'));
G(`calc();ST.M.ds=100;window._m2=mkMon(Object.keys(MONS)[0],10);_m2.res.phys=0;_m2.hp=_m2.max=1e6;hitMon(_m2,{phys:100},'hero','#fff')`);ok(G('1e6-_m2.hp>=190'),'致命一击翻倍');
G(`calc();window._u=genItem(30,{base:BASES.find(b=>b.s==='weapon'&&b.tier===0&&nextTierBase(b)),q:4});_u.q=5;_u.name='测试暗金';S.bag=[_u,{uid:S.uid++,k:'rune',r:7},{uid:S.uid++,k:'rune',r:11},{uid:S.uid++,k:'gem',g:'eme',lv:4}]`);
const un=G('_u.name');ok(G('cubeUpgrade(0,_u.uid)')&&G('BASEM[_u.b].tier===1&&_u.name')===un&&G('S.bag.length')===1,'暗金升级配方');

sec('堆叠 / 仓库存取守恒');
G('GS.clear()');G('load();calc()');
G(`S.bag=[];for(let i=0;i<7;i++)S.bag.push({uid:S.uid++,k:'rune',r:3});for(let i=0;i<5;i++)S.bag.push({uid:S.uid++,k:'gem',g:'rub',lv:2});for(let i=0;i<30;i++)S.bag.push(genItem(30))`);
ok(G('slotsUsed(S.bag)')===32,'堆叠占格 '+G('slotsUsed(S.bag)'));
G(`takeBag(x=>x.k==='rune'&&x.r===3,1)`);ok(G(`S.bag.filter(x=>x.k==='rune').length`)===6,'消耗一次只扣 1');
const census=()=>G(`(()=>{const a=[...S.bag,...S.pst.flat(),...ACCT.shared.flat()];const c={};for(const x of a){const k=stackKey(x)||('u'+x.b+x.name+x.il);c[k]=(c[k]||0)+qtyOf(x)}return JSON.stringify(Object.entries(c).sort())})()`);
const before=census();let dupBad=0;
for(let i=0;i<1500;i++){const op=Math.random();
 if(op<0.4){const u=G('S.bag.length?S.bag[Math.floor(Math.random()*S.bag.length)].uid:0');if(u)G(`depositUid(${u},Math.random()<0.5?'p':'s',Math.floor(Math.random()*3))`)}
 else if(op<0.8){const u=G(`(()=>{const a=Math.random()<0.5?S.pst.flat():ACCT.shared.flat();return a.length?a[Math.floor(Math.random()*a.length)].uid:0})()`);if(u)G(`withdrawUid(${u},Math.random()<0.5?1:undefined)`)}
 else{const u=G(`(()=>{const a=S.pst.flat().concat(ACCT.shared.flat());return a.length?a[Math.floor(Math.random()*a.length)].uid:0})()`);if(u)G(`stashToStash(${u})`)}
 if(i%100===0){const d=G(`(()=>{const a=[...S.bag,...S.pst.flat()];return a.length-new Set(a.map(x=>x.uid)).size+(new Set([...S.bag,...S.pst.flat(),...ACCT.shared.flat()]).size-[...S.bag,...S.pst.flat(),...ACCT.shared.flat()].length)})()`);dupBad+=d}}
ok(census()===before,'1500 次随机存取后物品守恒');ok(dupBad===0,'uid/对象无重复');
G('save();load()');ok(census()===before,'存档读回后守恒');
G(`S.pst[1].push({uid:S.uid++,k:'mat',id:'ess',n:5},{uid:S.uid++,k:'mat',id:'ess',n:3});mergeMats(S.pst[1])`);ok(G(`S.pst[1].filter(x=>x.k==='mat').length===1&&S.pst[1].find(x=>x.k==='mat').n===8`),'材料合并');
const c2=census();G('sortPages(S.pst)');ok(census()===c2,'整理守恒');

sec('多角色隔离 / 共享仓库 / 旧存档迁移');
G('GS.clear()');
const old=JSON.parse(G('JSON.stringify((()=>{const s=newSave();s.lvl=17;s.autoCast=1;s.bf={x:1};s.stash=[];for(let i=0;i<10;i++)s.stash.push(genItem(20));s.bag=[genItem(10)];return s})())'));
G('GS').setItem(G('KEY'),JSON.stringify(old));G('ACCT=null;load();calc()');
ok(G('ACCT.chars.length')===1&&G('S.lvl')===17,'旧存档成为第一个角色');ok(G('S.pst[0].length')===10&&G('S.stash.length')===0,'旧 48 格储物箱迁移到个人仓库');
ok(G('S.autoCast===1&&S.bf.x===1'),'同事新增字段保留');
G(`window._sid=S.pst[0][0].uid;depositUid(S.bag[0].uid,'s')`);ok(G('ACCT.shared.flat().length')===1,'存入共享');
const id2=G(`newChar('第二个','nec','normal')`);ok(G('S.lvl')===1&&G('S.name')==='第二个'&&G('S.pst.flat().length')===0&&G("S.cls==='nec'"),'新角色独立');
ok(G(`newChar('x','ass')`)===0,'未开放职业不可创建');
G(`withdrawUid(ACCT.shared.flat()[0].uid)`);ok(G('ACCT.shared.flat().length')===0&&G('S.bag.filter(x=>!x.k).length')>=1,'其他角色从共享取出');
G('S.lvl=5;save()');G('switchChar(1)');ok(G('S.lvl')===17&&G('S.pst[0].length')===10&&G('S.bag.length')===0,'切回角色1 存档隔离');
G(`switchChar(${id2})`);ok(G('S.lvl')===5,'切回角色2');ok(G(`deleteChar(1,true)`)&&G('ACCT.chars.length')===1,'删除角色');
G("setNS('u1');ACCT=null;load();calc()");ok(G('ACCT.chars.length===1&&S.lvl===1'),'账号命名空间与游客隔离');G("switchNS(null)");ok(G('S.lvl')===5,'切回游客存档');

sec('自动回收 / 自动存仓');
G(`S.bag=[];S.rcy=rcyDefault();S.rcy.on=1;S.rcy.q={0:1,1:1,2:1,3:1,4:0,5:0,6:0};S.rcy.mode='ess'`);
let rc=0,kept=0;for(let i=0;i<500;i++){const r=G(`addBag(genItem(40,{q:${1+(i%3)}}))`);r?kept++:rc++}
ok(G(`S.bag.filter(x=>!x.k).every(it=>(it.sock&&it.q<=2)||BASEM[it.b].tier>=2||hasNecroSkill(it))`),'只保留受保护物品');ok(G('matCount("ess")')>0,'回收成精华');
G(`S.rcy.mode='gold';window._g0=S.gold;window._ri=genItem(10,{q:1,base:BASEM.arm1});_ri.sock=0;addBag(_ri)`);ok(G('S.gold>_g0'),'回收得金币');
G(`S.rcy.on=0;S.ast={on:1,dest:'s',t:{gem:1,rune:1}};window._n0=ACCT.shared.flat().length;addBag({uid:S.uid++,k:'rune',r:2});addBag({uid:S.uid++,k:'gem',g:'top',lv:1})`);ok(G('ACCT.shared.flat().length-_n0')===2,'自动存仓');
G(`S.rcy.on=1;S.rcy.c.rune=1;S.rcy.runeMax=5;window._n1=ACCT.shared.flat().length;addBag({uid:S.uid++,k:'rune',r:1})`);ok(G('ACCT.shared.flat().length')===G('_n1'),'回收优先于存仓');
G('S.rcy.on=0;S.ast.on=0');

sec('商店 / 赌博');
G(`S.gold=100;S.bag=[];ensureShop(true);window._it=S.shop.items[0];buyItem(_it.uid)`);ok(G('S.gold')>=0,'金币不负');
G(`S.gold=1e7;S.bag=[];window._c=S.shop.items.length;buyItem(S.shop.items[0].uid)`);ok(G('S.shop.items.length===_c-1&&S.bag.length===1'),'购买');
G(`window._sold=S.bag[0];shopSell(_sold.uid)`);ok(G('S.bag.length===0&&S.shop.bb[0].it===_sold'),'出售进入回购');G('buyBack(0)');ok(G('S.bag.length===1&&S.shop.bb.length===0&&S.bag[0]===_sold'),'回购不复制');
ok(G('shopSellPrice(_sold)<=buyPrice(_sold)'),'卖价低于买价');
G('S.gold=0;buyPot("hp");buyPot("rej")');ok(G('S.gold')===0,'金币不足无法购买');
G('S.gold=1e12;S.lvl=60');const qc={};for(let i=0;i<20000;i++){G('S.bag=[]');const it=G('gamble(0)');qc[it.q]=(qc[it.q]||0)+1;const il=it.il;if(il<55||il>64)qc.bad=(qc.bad||0)+1}
console.log('  赌博戒指 20000 次：',JSON.stringify(qc));ok(!qc.bad,'赌博 ilvl 范围');ok(Math.abs((qc[4]||0)/20000-0.1)<0.012,'稀有约 10%');ok((qc[5]||0)<60&&(qc[6]||0)+(qc[3]||0)>15000,'暗金/套装稀少');

console.log(`\n结果：通过 ${passes}，失败 ${fails}`);process.exit(fails?1:0);
