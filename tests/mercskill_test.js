// 佣兵专属技能 单元测试：node tests/mercskill_test.js
const fs=require('fs'),vm=require('vm'),path=require('path');const root=path.join(__dirname,'..');
const stub=()=>new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?()=>'' :k==='readyState'?'loading':stub(),apply:()=>stub(),construct:()=>stub(),set:()=>true});
const store={};const ctx={console:{log(){},warn(){},error:console.error},Math,Date,JSON,setTimeout:()=>0,setInterval:()=>0,clearInterval(){},clearTimeout(){},requestAnimationFrame:()=>0,
 localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v},removeItem:k=>{delete store[k]}},document:stub(),Image:function(){return stub()},navigator:{},location:{search:''},addEventListener(){},performance:{now:()=>Date.now()},confirm:()=>true};
ctx.window=ctx;vm.createContext(ctx);ctx.__NOUI=1;ctx.__NOSHOWLOGIN=1;
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');const files=[...html.matchAll(/<script src="([^"?]+)/g)].map(m=>m[1]).filter(f=>!/^(cloud|login_flow|audio|power|ui_art|icon2|art2_)/.test(f));
for(const f of files)try{vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f})}catch(e){if(f==='mercskill.js')throw e}
const G=s=>vm.runInContext(s,ctx);let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('  ✗ '+m)}};
G(`S=newSave();try{load()}catch(e){};S.mercU=1;S.lvl=5;calc();`);
const T=['archer','guard','mage','barb'];
for(const t of T){const D=G(`MSK.${t}`);ok(D&&D.p.n&&D.a.n&&D.a.cd>0,t+' 有主动+被动');}
ok(new Set(T.flatMap(t=>[G(`MSK.${t}.p.n`),G(`MSK.${t}.a.n`)])).size===8,'8 个技能名互不相同');
// 解锁
G("hireMerc('guard',null,1,{lvl:5,hd:0});S.merc.lvl=5;calc()");
ok(G("mskInfo('guard',5).pr")===0&&G("mskInfo('guard',5).ar")===0,'Lv5 均未解锁');
ok(G("mskInfo('guard',8).pr")===1&&G("mskInfo('guard',8).ar")===0,'Lv8 解锁被动');
ok(G("mskInfo('guard',15).ar")===1&&G("mskInfo('guard',35).ar")===2&&G("mskInfo('guard',99).ar")===4,'Lv15 解锁主动，每 20 级升阶，封顶 4');
// 被动
G("S.lvl=40;mercNorm();calc()");const L=G("S.merc.lvl");
const a0=G("_msk_ms().avgres"),a1=G("mercStats().avgres"),l0=G("_msk_ms().life"),l1=G("mercStats().life");
ok(L>=8&&a1>a0&&l1>l0,'守卫被动：抗性/生命提高');
G("hireMerc('barb',null,1,{lvl:40,hd:0});calc()");ok(G("mercStats().life")>G("_msk_ms().life")&&G("mercStats().pdr")>G("_msk_ms().pdr"),'野蛮人被动：生命/减伤');
ok(G("JSON.stringify(_msk_ms().dmg)")===G("JSON.stringify(mercStats().dmg)"),'被动不加伤害');
// 主动 + 冷却：构造战斗
G(`var mk_a={uid:9001,kind:'merc',hp:100,max:1000,ms:mercStats(),dmg:[10,20]};var mk_ms=[{uid:9101,hp:1e6,max:1e6,lv:40,def:0,res:{}},{uid:9102,hp:1e6,max:1e6,lv:40,def:0,res:{},boss:1}];`);
const b0=G("mk_ms[1].hp");G("mskCast(mk_a,mk_a.ms,mk_ms)");ok(G("mk_ms[1].hp")<b0,'野蛮人主动：对全体（含首领）造成伤害');ok(G("mk_a.hp")>100&&G("mk_ms[0].stun")===1&&!G("mk_ms[1].stun"),'野蛮人主动：回血+震晕非首领');
G("hireMerc('guard',null,1,{lvl:40,hd:0});calc();mk_a.ms=mercStats()");G("mk_a.hp=100;ALLY.length=0;ALLY.push(mk_a);H.life=1");const h0=G("mk_ms[0].hp");G("mskCast(mk_a,mk_a.ms,mk_ms)");ok(G("mk_a.hp")>100&&G("H.life")>1&&G("mk_ms[0].hp")<h0&&G("mk_ms[0].slow")>G("GT"),'守卫主动：前方伤害+全队回血+减速');
G("hireMerc('mage',null,1,{lvl:40,hd:0});calc();mk_a.ms=mercStats()");const h1=G("mk_ms[0].hp");G("mskCast(mk_a,mk_a.ms,mk_ms)");ok(G("mk_ms[0].hp")<h1&&G("mk_ms[1].hp")<1e6,'法师主动：全体元素伤害');
G("hireMerc('guard',null,1,{lvl:40,hd:0});calc();mk_a.ms=mercStats()");
// 冷却：通过 mercTick 驱动
G("MON=[];ALLY.length=0;S.merc.dead=0;MSKX.cd=0;MSKX.fire=0;mercTick(0.1)");// 生成佣兵单位
G("MON.push({uid:9200,hp:1e9,max:1e9,lv:40,def:0,res:{},n:'靶',dmg:[0,0]})");
const f0=G("MSKX.fire");G("mercTick(0.1)");const f1=G("MSKX.fire");
ok(f1===f0+1&&Math.abs(G("MSKX.cd")-15)<1e-6,'首次释放并进入 15 秒冷却');
for(let i=0;i<100;i++)G("mercTick(0.1)");ok(G("MSKX.fire")===f1,'冷却中不再释放');
for(let i=0;i<60;i++)G("mercTick(0.1)");ok(G("MSKX.fire")===f1+1,'冷却结束再次释放');
G("S.merc.lvl=10;S.lvl=10;mercNorm();MSKX.cd=0;const fb=MSKX.fire;mercTick(0.1);var mk_fb=fb");ok(G("MSKX.fire")===G("mk_fb"),'未解锁主动不释放');
// 旧存档兼容：存档无新字段，读写后正常
G("S.lvl=40;mercNorm();save();load();calc()");ok(G("mercUp()")&&G("mercStats().msk")>=1&&!/msk/.test(G("JSON.stringify(S.merc)")),'旧存档无需新字段，读档后被动生效');
console.log(`mercskill: ${pass} pass, ${fail} fail`);process.exit(fail?1:0)
