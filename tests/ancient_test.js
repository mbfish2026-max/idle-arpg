// 上古/至臻单元测试：node tests/ancient_test.js
// 校验 bonus.js：区间上移、概率、至臻全满/完美、回收保护、旧存档兼容
const fs=require('fs'),vm=require('vm'),path=require('path');const root=path.join(__dirname,'..');
const stub=()=>new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?()=>'' :k==='readyState'?'loading':stub(),apply:()=>stub(),construct:()=>stub(),set:()=>true});
const store={};const ctx={console:{log(){},warn(){},error:console.error},Math,Date,JSON,setTimeout:()=>0,setInterval:()=>0,clearInterval(){},clearTimeout(){},requestAnimationFrame:()=>0,
 localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v},removeItem:k=>{delete store[k]}},document:stub(),Image:function(){return stub()},navigator:{},location:{search:''},addEventListener(){},performance:{now:()=>Date.now()},confirm:()=>true};
ctx.window=ctx;vm.createContext(ctx);ctx.__NOUI=1;ctx.__NOSHOWLOGIN=1;
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');const files=[...html.matchAll(/<script src="([^"?]+)/g)].map(m=>m[1]).filter(f=>!/^(cloud|login_flow|audio|power|ui_art|icon2|art2_)/.test(f));
for(const f of files)try{vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f})}catch(e){if(f==='ancient.js')throw e}
const G=s=>vm.runInContext(s,ctx);let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('  ✗ '+m)}};
G(`S=newSave();try{load()}catch(e){};S.lvl=85;S.diff=2;calc();EGM=null;`);
const U=G("UNIQUES.findIndex(u=>Object.values(u.m).some(v=>Array.isArray(v)&&v[0]>=10&&!/^(allsk|sk_)/.test('')))");
ok(U>=0,'找到带区间暗金');
// 上古区间
const r=JSON.parse(G(`(()=>{const u=UNIQUES[${U}];const it={b:u.b,q:5,name:u.n,m:{}};const o={};for(const k in u.m)if(Array.isArray(u.m[k]))o[k]=u.m[k];it.anc=1;return JSON.stringify({o,a:ancRanges(it)})})()`));
for(const k in r.a){const[l,h]=r.o[k],[al,ah]=r.a[k];if(/^(allsk|sk_|skd_|tc_|t\dsk|nb_)/.test(k)||l<0)continue;
 ok(al===Math.max(Math.round(l*1.2),Math.round(h*0.6))&&ah>=Math.round(h*1.2)-0.01,'上古区间 '+k+` ${l}-${h} → ${al}-${ah}`)}
// 概率：普通难度 0；地狱 ~5%；秘境 40 层 ~9%；至臻只在 30+ 层
G(`S.diff=0`);ok(JSON.stringify(G("ancChance()"))==='[0,0]','普通难度无上古');
G(`S.diff=2`);ok(G("ancChance()[0]")===0.05&&G("ancChance()[1]")===0,'地狱 5%');
G(`EGM={k:'mj',L:20}`);ok(Math.abs(G("ancChance()[0]")-0.07)<1e-9&&G("ancChance()[1]")===0,'秘境20层 7% 无至臻');
G(`EGM={k:'mj',L:200}`);ok(G("ancChance()[0]")===0.12&&G("ancChance()[1]")===0.02,'秘境封顶 12%，至臻 2%');
const st=JSON.parse(G(`(()=>{let n=0,a=0,t=0;for(let i=0;i<4000;i++){const it=genItem(85,{q:5});if(it.q!==5)continue;n++;if(it.anc)a++;if(it.anc===2)t++}return JSON.stringify({n,a,t})})()`));
ok(st.a/st.n>0.08&&st.a/st.n<0.16,'实测上古率 '+(st.a/st.n).toFixed(3));ok(st.t/st.a<0.07,'实测至臻占比 '+(st.t/st.a).toFixed(3));
// 至臻全满 + 完美
const z=JSON.parse(G(`(()=>{const u=UNIQUES[${U}];const it=genItem(85,{q:5});it.q=5;it.name=u.n;it.b=u.b;it.m={};for(const k in u.m)it.m[k]=Array.isArray(u.m[k])?u.m[k][0]:u.m[k];delete it.anc;ancApply(it,2);
 return JSON.stringify({q:ancQual(it),nm:itemName(it),tag:ancTag(it),p:power(it)})})()`));
ok(z.q===1&&/完美/.test(z.tag)&&/^至臻·/.test(z.nm),'至臻全满=完美 '+z.nm);
const lo=JSON.parse(G(`(()=>{const u=UNIQUES[${U}];const it={b:u.b,q:5,name:u.n,m:{}};for(const k in u.m)it.m[k]=Array.isArray(u.m[k])?u.m[k][0]:u.m[k];return JSON.stringify({q:ancQual(it),tag:ancTag(it)})})()`));
ok(lo.q===0&&/属性品质 0%/.test(lo.tag)&&!/完美/.test(lo.tag),'下限=0% 无完美');
// 套装、旧存档
ok(G(`(()=>{const s=SETITEMS.find(x=>Object.values(x.m).some(Array.isArray));if(!s)return true;const it={b:s.b,q:6,name:s.n,m:{}};for(const k in s.m)it.m[k]=Array.isArray(s.m[k])?s.m[k][1]:s.m[k];return ancQual(it)===1})()`),'套装满值=100%');
ok(G(`(()=>{const it={b:'rin',q:5,name:'不存在的旧物品',m:{life:3}};return ancTag(it)===''&&itemName(it).indexOf('上古')<0})()`),'旧存档/未知物品不报错');
// 回收保护
G(`ensureLoot();S.rcy.on=1;S.rcy.q[5]=1;for(const k in S.rcy.c)S.rcy.c[k]=1;S.rcy.keepNew=0;S.rcy.keepSkill=0;`);
ok(G(`(()=>{const it=genItem(85,{q:5});it.anc=1;return shouldRecycle(it,false)===false})()`),'保留上古默认开');
ok(G(`(()=>{S.rcy.keepAnc=0;const it=genItem(85,{q:5});it.m={};it.anc=1;return shouldRecycle(it,false)===true})()`),'关闭后可回收');
console.log(`ancient_test: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);
