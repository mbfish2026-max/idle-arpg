// 血月之地/破障护符单元测试：node tests/bloodmoon_test.js
// 校验 bloodmoon.js：每小时选区（确定性、只选已肃清）、怪物等级/经验/精英保底、破障抗性上限 40、同类不叠加、代价、旧存档兼容、原创名
const fs=require('fs'),vm=require('vm'),path=require('path');const root=path.join(__dirname,'..');
const stub=()=>new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?()=>'' :k==='readyState'?'loading':stub(),apply:()=>stub(),construct:()=>stub(),set:()=>true});
const store={};const ctx={console:{log(){},warn(){},error:console.error},Math,Date,JSON,setTimeout:()=>0,setInterval:()=>0,clearInterval(){},clearTimeout(){},requestAnimationFrame:()=>0,
 localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v},removeItem:k=>{delete store[k]}},document:stub(),Image:function(){return stub()},navigator:{},location:{search:''},addEventListener(){},performance:{now:()=>Date.now()},confirm:()=>true};
ctx.window=ctx;vm.createContext(ctx);ctx.__NOUI=1;ctx.__NOSHOWLOGIN=1;
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');const files=[...html.matchAll(/<script src="([^"?]+)/g)].map(m=>m[1]).filter(f=>!/^(cloud|login_flow|audio|power|ui_art|icon2|art2_)/.test(f));
for(const f of files)try{vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f})}catch(e){if(f==='bloodmoon.js')throw e}
const G=s=>vm.runInContext(s,ctx);let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('  ✗ '+m)}};
G(`S=newSave();try{load()}catch(e){};S.diff=0;S.lvl=60;calc();EGM=null;`);
ok(G("bmCur()")===null,'无已肃清区域时无血月');
G(`S.cleared[0]=1;S.cleared[2]=1;S.bm=undefined`);const b=JSON.parse(G("JSON.stringify(bmCur())"));
ok(b&&b.a===0&&[0,2].includes(b.i),'只选已肃清区域');ok(G("JSON.stringify(bmCur())")===JSON.stringify(b),'同一小时不变');
G(`S.bm.h=1`);ok(G("bmCur().h")===G("bmHour()"),'跨小时重新选');
G(`S.zone=bmCur().i;S.act=0`);ok(G("bmHere()"),'在血月区域');
const m=JSON.parse(G("(()=>{const m=mkMon('imp',3);const n=(()=>{const z=S.zone;S.zone=99;const x=mkMon('imp',3);S.zone=z;return x})();return JSON.stringify({lv:m.lv,e:m.exp,e0:n.exp,bm:m.bm,lv0:n.lv})})()"));
ok(m.lv===62&&m.bm===1,'怪物等级=角色+2 → '+m.lv);
ok(G("(()=>{const a=mkMon('imp',62);const z=S.zone;S.zone=99;const b=mkMon('imp',62);S.zone=z;return Math.abs(a.exp/b.exp-1.5)<1e-9})()"),'经验 ×1.5');
G(`S.lvl=99`);ok(G("mkMon('imp',3).lv")===99,'等级上限 99');G(`S.lvl=60`);
G(`EGM={k:'mj',L:1}`);ok(!G("bmHere()"),'终局模式中不生效');G(`EGM=null`);
ok(G("(()=>{for(let i=0;i<200;i++){const m=mkMon('imp',3,'champ');const o=rollTC(m);if(!o.some(it=>it&&!it.k&&it.q>=3))return false}return true})()"),'精英必掉魔法以上');
const wd=G("(()=>{let n=0;for(let i=0;i<3000;i++){const m=mkMon('imp',3,'uniq');if(rollTC(m).some(it=>it&&it.ward))n++}return n/3000})()");ok(wd>0.015&&wd<0.05,'头目破障掉率 '+wd.toFixed(3));
ok(G("(()=>{const z=S.zone;S.zone=99;const m=mkMon('imp',3,'uniq');m.bm=0;let n=0;for(let i=0;i<1500;i++)if(rollTC(m).some(it=>it&&it.ward))n++;S.zone=z;return n===0})()"),'非血月不掉破障');
// 破障效果
const mon="(()=>{const m=mkMon('imp',30);m.res.fire=120;m.res.cold=60;m.res.light=30;return m})()";
G(`var M=${mon};S.bag=[];calc()`);ok(G("resOf(M,'fire')")===80&&G("resOf(M,'cold')")===60,'无护符：免疫封顶 80');
G(`S.bag=[wardMake('fire')];calc()`);ok(G("resOf(M,'fire')")===40&&G("resOf(M,'cold')")===60&&G("resOf(M,'light')")===30,'烈焰破障：火 40，其他不变，低抗不抬高');
const fr0=G("(()=>{S.bag=[];calc();return ST.fres!=null?ST.fres:ST.res&&ST.res.fire})()"),fr1=G("(()=>{S.bag=[wardMake('fire')];calc();return ST.fres!=null?ST.fres:ST.res&&ST.res.fire})()"),fr2=G("(()=>{S.bag=[wardMake('fire'),wardMake('fire')];calc();return ST.fres!=null?ST.fres:ST.res&&ST.res.fire})()");
ok(fr0-fr1===25&&fr1===fr2,`代价 -25 火抗且同类不叠加 ${fr0}/${fr1}/${fr2}`);
ok(G("Object.keys(BM.WARD).length")===6&&G("Object.values(BM.WARD).map(w=>w.n).join()")==='烈焰,冰封,雷鸣,剧毒,骨裂,虚空','6 种原创名');
ok(G("(()=>{const it=wardMake('magic');return /ward_void\\.webp/.test(itemIcon(it))&&itemName(it)==='破障护符·虚空'})()"),'图标与名字');
G(`S.bm=undefined;delete S.bm`);ok(G("(()=>{try{bmCur();return true}catch(e){return false}})()"),'旧存档无 S.bm 兼容');
console.log(`bloodmoon_test: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);
