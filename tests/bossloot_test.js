// 首领专属掉落单元测试：node tests/bossloot_test.js
// 校验 bossloot.js：专属表分配（每首领 3 档、互不重复、无暴雪名）、×4 权重只替换暗金、上古保留、速刷重进与每日递减、旧存档兼容
const fs=require('fs'),vm=require('vm'),path=require('path');const root=path.join(__dirname,'..');
const stub=()=>new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?()=>'' :k==='readyState'?'loading':stub(),apply:()=>stub(),construct:()=>stub(),set:()=>true});
const store={};const ctx={console:{log(){},warn(){},error:console.error},Math,Date,JSON,setTimeout:()=>0,setInterval:()=>0,clearInterval(){},clearTimeout(){},requestAnimationFrame:()=>0,
 localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v},removeItem:k=>{delete store[k]}},document:stub(),Image:function(){return stub()},navigator:{},location:{search:''},addEventListener(){},performance:{now:()=>Date.now()},confirm:()=>true};
ctx.window=ctx;vm.createContext(ctx);ctx.__NOUI=1;ctx.__NOSHOWLOGIN=1;
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');const files=[...html.matchAll(/<script src="([^"?]+)/g)].map(m=>m[1]).filter(f=>!/^(cloud|login_flow|audio|power|ui_art|icon2|art2_)/.test(f));
for(const f of files)try{vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f})}catch(e){if(f==='bossloot.js')throw e}
const G=s=>vm.runInContext(s,ctx);let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('  ✗ '+m)}};
G(`S=newSave();try{load()}catch(e){};S.diff=2;S.lvl=85;calc();EGM=null;`);
const L=JSON.parse(G("JSON.stringify(blBuild())"));const ks=Object.keys(L);
ok(ks.length>=39&&ks.every(k=>L[k].length===3),'每个首领 3 件专属 '+ks.length);
const all=ks.flatMap(k=>L[k]);ok(new Set(all).size===all.length,'专属互不重复');
ok(L.cowking&&L.rift_guard&&L.mj_lord,'含牛魔王/虚隙守望者/秘境之主');
ok(G("JSON.stringify(blBuild())")===G("BOSS_LOOT=null;JSON.stringify(blBuild())"),'分配确定性');
const p=G("blChance('queen',85)");ok(p>0.05&&p<=0.5,'地狱 ×4 替换概率 '+p.toFixed(3));
ok(G("blChance('raven',10)")>0&&G("blPool('raven',10).length")===1,'低等级只开放普通档');
// 统计：首领暗金里专属占比 ≈ 理论值，暗金总数不变
const st=JSON.parse(G(`(()=>{BL.cur='queen';let u=0,e=0;for(let i=0;i<3000;i++){const it=genItem(85,{q:5});if(it.q===5){u++;if(BOSS_LOOT.queen.includes(it.name))e++}}BL.cur=null;let u0=0;for(let i=0;i<3000;i++){if(genItem(85,{q:5}).q===5)u0++}return JSON.stringify({u,e,u0})})()`));
ok(Math.abs(st.e/st.u-p)<0.04,'实测专属占比 '+(st.e/st.u).toFixed(3));ok(Math.abs(st.u-st.u0)<200,'暗金总数不变 '+st.u+'/'+st.u0);
ok(G("(()=>{const it=genItem(85,{q:5});it.anc=1;it.name='x';const U=blPool('queen',85)[0];blSwap(it,'queen',85);return it.anc===1&&it.blk==='queen'&&BOSS_LOOT.queen.includes(it.name)})()"),'替换后保留上古');
// 速刷
G(`S.frun=undefined`);ok(G("blFR().on")===0,'旧存档速刷默认关');
ok(G("blBonus(0)")===50&&G("blBonus(29)")===50&&G("blBonus(30)")===47.5&&G("blBonus(49)")===0,'每日前 30 次 +50%，之后递减到 0');
G(`S.frun.d=1;S.frun.n=40`);ok(G("blFR().n")===0,'跨日重置');
const z=G(`(()=>{goAct(0,0,1);const zi=ACTS[0].zones.findIndex(z=>z.boss==='raven');S.unl=99;S.zone=zi;ACTS[0].zones.forEach((q,i)=>S.cleared[i]=1);S.auto=1;blFR().on=1;S.wave=5;zoneClear();return JSON.stringify([S.zone===zi,S.wave,ACTS[0].zones[zi].w])})()`);
const zz=JSON.parse(z);ok(zz[0]&&zz[1]===zz[2]-1,'速刷：留在原区域并直进首领波');
const zp=G(`(()=>{goAct(0,0,1);const zi=ACTS[0].zones.findIndex(z=>z.boss==='raven');S.cleared={};for(let i=0;i<=zi;i++)S.cleared[i]=1;S.unl=zi+1;S.zone=zi;S.auto=1;blFR().on=1;S.wave=5;zoneClear();return S.zone!==zi})()`);ok(zp,'速刷：自动推进且本章未肃清完时不劫持（防撤退后卡死）');
const z2=JSON.parse(G(`(()=>{blFR().on=0;const zi=S.zone;S.wave=5;zoneClear();return JSON.stringify([S.zone!==zi])})()`));ok(z2[0],'关闭时照常前往下一区');
// MF 加成只在速刷首领击杀时
G(`S.diff=0;calc();blFR().on=1;blFR().n=0;var _mf=[];var _o=genItem;genItem=function(){_mf.push(ST.mf);return _o.apply(this,arguments)};`);
G(`(()=>{const m=mkMon('raven',10);m.boss=1;for(let i=0;i<20;i++)rollTC(m)})()`);G(`genItem=_o`);
ok(G("blFR().n")===20&&G("_mf.length?Math.min(..._mf)>=ST.mf+50:true"),'速刷首领 +50% 品质，计数 '+G("blFR().n"));
ok(!/墨斐斯|巴尔|迪亚|安达利|督瑞尔|梅菲|Baal|Diablo|Meph/.test(G("Object.keys(BOSS_LOOT).map(blName).join()")),'无暴雪名字');
console.log(`bossloot_test: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);
