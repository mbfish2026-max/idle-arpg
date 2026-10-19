// 暗渊三魂单元测试：node tests/uber_test.js
// 校验 uber.js：解锁门槛、魂钥掉率/每日上限/周保底、魂狱→魂核、暗渊三魂机制（m.uber/寒魂新星/残影/魇牢/狂暴）、失败返还、终极物品与 it.myth、限 1、旧存档、原创名
const fs=require('fs'),vm=require('vm'),path=require('path');const root=path.join(__dirname,'..');
const stub=()=>new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?()=>'' :k==='readyState'?'loading':stub(),apply:()=>stub(),construct:()=>stub(),set:()=>true});
const store={};const ctx={console:{log(){},warn(){},error:console.error},Math,Date,JSON,setTimeout:()=>0,setInterval:()=>0,clearInterval(){},clearTimeout(){},requestAnimationFrame:()=>0,
 localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v},removeItem:k=>{delete store[k]}},document:stub(),Image:function(){return stub()},navigator:{},location:{search:''},addEventListener(){},performance:{now:()=>Date.now()},confirm:()=>true};
ctx.window=ctx;vm.createContext(ctx);ctx.__NOUI=1;ctx.__NOSHOWLOGIN=1;
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');const files=[...html.matchAll(/<script src="([^"?]+)/g)].map(m=>m[1]).filter(f=>!/^(cloud|login_flow|audio|power|ui_art|icon2|art2_)/.test(f));
for(const f of files)try{vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f})}catch(e){if(f==='uber.js')throw e}
const G=s=>vm.runInContext(s,ctx);let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('  ✗ '+m)}};
G(`S=newSave();try{load()}catch(e){};S.lvl=90;calc();EGM=null;`);
ok(!!G("ubLock()"),'未通关地狱时锁定');
G(`egHellDone=()=>true;egMj().best=19`);ok(/20/.test(G("ubLock()")),'秘境 19 层仍锁定');G(`egMj().best=20`);ok(G("ubLock()")===null,'地狱+秘境20 解锁');
ok(G("JSON.stringify(egUb())")===G("JSON.stringify(UB_DEF())"),'旧存档自动补 EG().uber');
// 掉率
G(`EGM={k:'mj',L:20}`);ok(G("ubKeyChance({egMjBoss:1})[1]")===0.08,'毁灭 20 层 8%');G(`EGM={k:'mj',L:45}`);ok(Math.abs(G("ubKeyChance({egMjBoss:1})[1]")-0.12)<1e-9,'45 层 12%');G(`EGM={k:'mj',L:200}`);ok(G("ubKeyChance({egMjBoss:1})[1]")===0.16,'上限 16%');
G(`EGM={k:'rift',T:9}`);ok(G("ubKeyChance({egGuard:1})")===null,'虚隙 9 层无');G(`EGM={k:'rift',T:10}`);ok(G("ubKeyChance({egGuard:1})[1]")===0.1,'虚隙 10 层 10%');
G(`EGM=null;S.diff=2;S.act=1`);ok(G("ubKeyChance({boss:1,key:'countess'})[1]")===0.06,'恐惧 地狱一二章首领 6%');G(`S.act=2`);ok(G("ubKeyChance({boss:1,key:'countess'})")===null,'第三章不掉');
// 每日上限 6
G(`egUb().k={t:0,h:0,d:0};egUb().day={d:'',n:0};var cr0=egMj().cr;for(let i=0;i<8;i++)ubGiveKey('t')`);ok(G("egUb().k.t")===6&&G("egMj().cr-cr0")===6,'每日 6 把，超出转秘晶');
G(`ubGiveKey('h','week')`);ok(G("egUb().k.h")===1,'周保底不受上限');
// 魂狱
G(`egUb().k={t:1,h:1,d:1};S.diff=2;calc();H.life=ST.life`);G(`ubPrison()`);ok(G("EGM&&EGM.k")==='ubp'&&G("egUb().k.t")===0,'开启魂狱扣三钥');
G(`nextWave()`);const gm=JSON.parse(G("JSON.stringify(MON.map(m=>({n:m.n,k:m.key,hp:m.max})))"));ok(gm.length===1&&/^abyss_g/.test(gm[0].k),'守魂者 '+gm[0].n);
const core=G("UB.GATE[EGM.g].c");G(`MON[0].hp=0;killMon(MON[0])`);ok(G(`egUb().o.${core}`)===1,'击败守魂者得魂核 '+core);G(`EGM&&egLeave(1)`);
// 暗渊
G(`egUb().o={horn:1,eye:1,brain:1};ubAbyss();nextWave()`);ok(G("EGM.k")==='uba'&&G("MON.length")===3&&G("MON.every(m=>m.uber===true)"),'三魂同场 m.uber');
const hpr=G("(()=>{const b=egMjBossHP(30,EG_MJ.ml(30));return MON[0].max/b})()");ok(Math.abs(hpr-1.5)<0.01,'生命 = 秘境30层之主 ×1.5');
ok(JSON.stringify(G("MON.map(m=>m.n)"))===JSON.stringify(['血噬·厄罗','焚世·巴戈','噩魇·缪渊']),'三魂原创名');
G(`ST.res.cold=10;ST.nofreeze=0;H.life=1e12;UB.nova=GT;var lk=0;for(let i=0;i<3;i++)step(0.05);lk=UB.lock>GT`);ok(G("lk"),'冰抗<75 寒魂新星冻结');
G(`const b=MON.find(m=>m.ubS==='abyss_s2');b.hp=b.max*0.49;step(0.05)`);ok(G("MON.some(m=>m.ubClone)"),'巴戈 50% 召残影');
const dr=G("(()=>{const b=MON.find(m=>m.ubS==='abyss_s2');b._ph=b.hp;const h0=b.hp;b.hp-=1000;H.life=1e12;step(0.01);return h0-b.hp})()");ok(dr>400&&dr<=520,'残影存活本体减伤 50% → '+Math.round(dr));
G(`UB.cage=GT;H.life=1e12;step(0.01)`);ok(G("UB.lock>GT+1.5")&&G("heroAct()")===0,'魇牢禁锢英雄');
const en=G("(()=>{const a=MON.find(m=>m.ubS==='abyss_s3');const d0=a.dmg[0];const s=MON.find(m=>m.ubS==='abyss_s1');s.hp=0;killMon(s);return a.dmg[0]/d0})()");ok(Math.abs(en-1.2)<1e-6,'一魂陨落其余 +20%');
G(`var bag0=S.bag.length;for(const m of MON.filter(m=>m.ubS)){m.hp=0;killMon(m)}`);ok(G("egUb().wins")===1&&G("S.bag.length-bag0")>=4,'三魂全灭结算掉落 '+G("S.bag.length-bag0"));
ok(G("S.bag.some(x=>x.ub)")&&G("S.bag.some(x=>x.k==='rune'&&x.r>=19)"),'必掉终极 + 20 号以上符文');
G(`EGM&&egLeave(1)`);
// 失败返还
G(`egUb().o={horn:1,eye:1,brain:1};ubAbyss();nextWave();EGM.t=181;step(0.01)`);ok(!G("EGM&&!EGM.end")&&G("egUb().o.horn+egUb().o.eye+egUb().o.brain")===1,'超时失败返还 1 魂核');G(`EGM&&egLeave(1)`);
// 物品
const w=JSON.parse(G("(()=>{const c={};for(let i=0;i<20000;i++){const k=ubPickItem();c[k]=(c[k]||0)+1}return JSON.stringify(c)})()"));const my=(w.crown+w.armor+w.ring)/20000;ok(Math.abs(my-0.15)<0.015,'神话合计 15% → '+my.toFixed(3));
ok(G("['crown','armor','ring'].every(k=>ubMake(k,{anc:0}).myth===1)")&&!G("ubMake('torch').myth"),'神话 it.myth=1');
ok(G("tgTier(ubMake('ring'))")==='mythic','神话 = 紫色天光 mythic');
ok(G("(()=>{const t=ubMake('torch',{max:1,cls:'nec',tree:1});return t.m.t1sk===1&&t.m.str===5&&t.m.allres===20&&ancQual(t)===1&&/完美/.test(ancTag(t))})()"),'满值火炬 = 完美');
const t2=G("(()=>{S.bag=[ubMake('torch',{max:1,cls:'nec',tree:0}),ubMake('torch',{max:1,cls:'nec',tree:0})];calc();const a=ST.t0sk;S.bag=[S.bag[0]];calc();return a===ST.t0sk})()");ok(t2,'火炬每角色限 1');
ok(G("(()=>{S.bag=[ubMake('shard',{max:1})];calc();return ubXp()})()")===10,'碎片经验 +10%');
ok(G("ubMake('crown',{anc:1}).anc")===1,'命运之冠可上古');
ok(!/墨斐斯|巴尔泽|迪亚波洛|莉丝艾|度瑞恩|伊苏尔德|墨菲斯托|巴尔|迪亚波罗|安达利尔/.test(G("Object.values(UB.GATE).map(g=>g.n).join()+Object.values(UB.SOUL).map(g=>g.n+g.mech).join()")),'无暴雪名');
ok(G("S.bm===undefined||true")&&G("blKeys().every(k=>!/^abyss/.test(k))"),'三魂/守魂者不进首领专属表');
console.log(`uber_test: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);
