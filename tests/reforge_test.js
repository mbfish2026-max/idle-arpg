// 淬锋精铸 v2 单元测试：node tests/reforge_test.js
// 校验 reforge.js：适用范围、锁定（不扣费）、3 候选+原属性四选一、花费 5000×n²/精华 5×n、上限 10、旧存档 n 兼容、商店入口/炼金匣无入口、身上/背包列表、上古/至臻
const fs=require('fs'),vm=require('vm'),path=require('path');const root=path.join(__dirname,'..');
const stub=()=>new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?()=>'' :k==='readyState'?'loading':stub(),apply:()=>stub(),construct:()=>stub(),set:()=>true});
const store={};const ctx={console:{log(){},warn(){},error:console.error},Math,Date,JSON,setTimeout:()=>0,setInterval:()=>0,clearInterval(){},clearTimeout(){},requestAnimationFrame:()=>0,
 localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v},removeItem:k=>{delete store[k]}},document:stub(),Image:function(){return stub()},navigator:{},location:{search:''},addEventListener(){},performance:{now:()=>Date.now()},confirm:()=>true};
ctx.window=ctx;vm.createContext(ctx);ctx.__NOUI=1;ctx.__NOSHOWLOGIN=1;
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');const files=[...html.matchAll(/<script src="([^"?]+)/g)].map(m=>m[1]).filter(f=>!/^(cloud|login_flow|audio|power|ui_art|icon2|art2_)/.test(f));
for(const f of files)try{vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f})}catch(e){if(f==='reforge.js')throw e}
const G=s=>vm.runInContext(s,ctx);let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('  ✗ '+m)}};
G(`S=newSave();try{load()}catch(e){};S.lvl=85;S.diff=2;calc();EGM=null;S.gold=1e8;addMat('ess',2000);`);
G(`var rare=null;for(let i=0;i<50&&!rare;i++){const x=genItem(85,{q:4});if(x.q===4&&Object.keys(x.m).length>=3)rare=x}rare.uid=S.uid++;S.bag.push(rare);`);
ok(G("rfKind(rare)")==='rare'&&G("rfKind({q:5,m:{}})")===null&&G("rfKind({q:2,m:{}})")===null,'魔法/稀有可用，暗金/白装不可');
ok(G("RF.gold(9)")===500000&&G("RF.gold(0)")===5000&&G("RF.ess(0)")===5&&G("RF.ess(9)")===50,'花费：第 1 次 5000 / 第 10 次 50 万，精华 5×n');
const k0=G("rfLines(rare)[0]");const g0=G("S.gold"),e0=G("matCount('ess')");
ok(G(`rfLock(rare.uid,'${k0}')`)===true&&G("rare.rf.k")===k0&&G("S.gold")===g0,'点选锁定不扣费');
ok(G(`rfLock(rare.uid,rfLines(rare)[1])`)===false,'锁定后不能改选');
ok(G(`rfRoll(rare.uid)`)===true&&G("S.gold")===g0-5000&&G("matCount('ess')")===e0-5,'第 1 次扣 5000 金 + 5 精华');
const off=JSON.parse(G("JSON.stringify(rare.rf.off)"));ok(off.length===3&&new Set(off.map(o=>o[0])).size===3,'3 个新候选（连同原属性四选一）');
ok(off.every(o=>o[0]!==k0&&!G(`Object.keys(rare.m)`).includes(o[0])),'候选不与已有属性重复');ok(off.every(o=>o[1]>=o[2]&&o[1]<=o[3]),'候选值在区间内');
const g1=G("S.gold"),e1=G("matCount('ess')"),m1=G("JSON.stringify(rare.m)");ok(G(`rfRoll(rare.uid)`)===true&&G("S.gold")===g1-20000&&G("matCount('ess')")===e1-10&&G("rare.rf.n")===2,'不选直接再重铸：扣费（第 2 次 2 万+10 精华）并计次');
ok(G("JSON.stringify(rare.m)")===m1&&G("rare.rf.k")===k0,'不选再重铸：原词条保持不变');const offB=JSON.parse(G("JSON.stringify(rare.rf.off)"));ok(offB.length===3&&JSON.stringify(offB)!==JSON.stringify(off),'上一轮候选作废，换成新一轮');
const sv=JSON.parse(JSON.stringify(G("rare.rf")));ok(JSON.stringify(JSON.parse(G("JSON.stringify(S)")).bag.find(x=>x.uid===G("rare.uid")).rf.off)===JSON.stringify(offB),'候选随存档保存');
const g2=G("S.gold");G("rfMain(rare.uid)");ok(G("S.gold")===g2&&G("rare.rf.n")===2,'重新打开不自动扣费');const off2=offB;
G(`rfPick(rare.uid,0)`);const nk=off2[0][0];ok(G(`rare.m['${nk}']`)===off2[0][1]&&G(`!('${k0}' in rare.m)`)&&G("rare.rf.k")===nk&&!G("rare.rf.off"),'点新词条替换原词条并锁定新键');
const keep=G("JSON.stringify(rare.m)");G(`rfRoll(rare.uid);rfPick(rare.uid,-1)`);ok(G("JSON.stringify(rare.m)")===keep&&G("rare.rf.n")===3,'保留原属性不变');
G(`var gs=[];for(let i=0;i<20;i++){const g=S.gold;if(rfRoll(rare.uid)){gs.push(g-S.gold);rfPick(rare.uid,-1)}}`);ok(G("rare.rf.n")===10&&G("gs.length")===7&&G("gs[gs.length-1]")===500000,'上限 10 次，第 10 次 50 万');
// 旧存档：n=3（旧上限）仍可继续到 10
G(`var r2=null;for(let i=0;i<50&&!r2;i++){const x=genItem(85,{q:4});if(x.q===4)r2=x}r2.uid=S.uid++;r2.rf={k:rfLines(r2)[0],n:3,off:null};S.bag.push(r2)`);
ok(G("rfRoll(r2.uid)")===true&&G("r2.rf.n")===4&&G("RF.gold(3)")===80000,'旧存档 3/3 物品可继续（上限改 10）');G(`rfPick(r2.uid,-1)`);
G(`var r3={...r2,uid:S.uid++,rf:{k:r2.rf.k,n:1,off:[[ 'life',5,1,9 ]]}};S.bag.push(r3)`);ok(G("rfPick(r3.uid,0)")===true&&G("r3.m.life")===5,'旧存档未选候选可继续选');
G(`S.gold=10`);ok(G(`(()=>{const it=S.bag.find(x=>x.uid===r2.uid);const n=it.rf.n;rfRoll(it.uid);return it.rf.n===n&&!it.rf.off})()`),'金币不足不扣');G(`S.gold=1e8`);
// 上古/至臻
const anc=JSON.parse(G(`(()=>{const res=[];for(const lv of[1,2]){const P=UNIQUES.filter(u=>BASEM[u.b]);const u=P[3];const it=makeBase(BASEM[u.b],85);it.q=5;it.name=u.n;it.m=rollMods(u.m);ancApply(it,lv);it.uid=S.uid++;S.bag.push(it);
 const k=rfLines(it)[0];const ok1=rfLines(it).every(x=>x in it.ax);rfLock(it.uid,k);rfRoll(it.uid);const o=it.rf.off;rfPick(it.uid,0);res.push({lv,ok1,o,ax:it.ax,m:it.m,q:ancQual(it)})}return JSON.stringify(res)})()`));
ok(anc.every(a=>a.ok1),'上古/至臻只能重铸额外词缀');ok(anc[1].o.every(o=>o[1]===o[3])&&anc[1].q===1,'至臻候选满值、重铸后仍完美');
ok(anc.every(a=>a.o.every(o=>!/^(allsk|sk_|skd_|tc_|t\d?sk|nb_)/.test(o[0]))),'上古候选无技能等级');
ok(G("rfKind({q:5,anc:1,m:{a:1},name:'x'})")===null,'旧上古（无额外词缀）不可重铸');
// 列表与入口
G(`S.eq.ring1=(()=>{let x=null;for(let i=0;i<50&&!x;i++){const y=genItem(85,{q:4,base:BASEM.rin});if(y.q===4)x=y}x.uid=S.uid++;return x})()`);
ok(G("rfEligible('eq').some(x=>x===S.eq.ring1)")&&G("rfEligible('bag').includes(rare)")&&!G("rfEligible('bag').some(x=>x.q===5&&!x.anc)"),'身上/背包列表');
ok(G("rfEligible('eq').length>0&&rfLock(S.eq.ring1.uid,rfLines(S.eq.ring1)[0])&&rfRoll(S.eq.ring1.uid)"),'身上装备可直接重铸');
ok(!G("cubeRecipes().some(r=>/淬锋|重铸·单条|淬锋精铸/.test(r[0]))"),'炼金匣无淬锋入口');
ok(/重铸/.test(G("rfPage()"))&&typeof G("renderShop")==='function','商店重铸页');
console.log(`reforge_test: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);
