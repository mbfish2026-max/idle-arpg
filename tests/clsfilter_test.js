// 职业筛选单元测试：node tests/clsfilter_test.js
// 校验 clsfilter.js：职业集合判定（专属底材/系别词缀/单技能词缀/流派键/职业与流派套装/威能/核心威能）、clfOk、与仓库现有筛选 stMatch 叠加、背包渲染后复原
const fs=require('fs'),vm=require('vm'),path=require('path');const root=path.join(__dirname,'..');
const stub=()=>new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?()=>'' :k==='readyState'?'loading':stub(),apply:()=>stub(),construct:()=>stub(),set:()=>true});
const store={};const ctx={console:{log(){},warn(){},error:console.error},Math,Date,JSON,setTimeout:()=>0,setInterval:()=>0,clearInterval(){},clearTimeout(){},requestAnimationFrame:()=>0,
 localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v},removeItem:k=>{delete store[k]}},document:stub(),Image:function(){return stub()},navigator:{},location:{search:''},addEventListener(){},performance:{now:()=>Date.now()},confirm:()=>true};
ctx.window=ctx;vm.createContext(ctx);ctx.__NOUI=1;ctx.__NOSHOWLOGIN=1;
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');const files=[...html.matchAll(/<script src="([^"?]+)/g)].map(m=>m[1]).filter(f=>!/^(cloud|login_flow|audio|power|ui_art|icon2|art2_)/.test(f));
for(const f of files)try{vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f})}catch(e){if(f==='clsfilter.js')throw e}
const G=s=>vm.runInContext(s,ctx);let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('  ✗ '+m)}};
G("S=newSave();try{load()}catch(e){};calc()");
const cs=e=>G(`(()=>{${e};return [...itemClsSet(it)].sort().join(',')})()`);
const mk=(b,m)=>`const it=makeBase(BASEM['${b}'],60);it.q=4;it.m=${JSON.stringify(m||{})}`;
ok(G("clfList().length")===G("CLASSES.length")&&G("clfList().length")>=6,'职业列表=CLASSES');
ok(G("clfList().every(c=>c.n)"),'职业名');
ok(cs(mk('orb1'))==='sor','法珠=法师专属底材');
ok(cs(mk('bh1'))==='bar','野蛮人头盔');
ok(cs(mk('head1'))==='nec','缩颅=亡灵');
ok(cs(mk('ps1'))==='pal'&&cs(mk('dp1'))==='dru'&&cs(mk('aw1'))==='ama','骑士盾/德鲁伊头/射手弓');
ok(cs(mk('rin',{tc_bar0:1,life:20}))==='bar','戒指 +野蛮人系别');
ok(cs(mk('amu',{t1sk:2}))==='nec','护符 亡灵系别 t1sk');
const skOf=c=>G(`SKILLS.find(s=>(s.cls||'nec')==='${c}').id`);
for(const c of ['nec','sor','bar','dru','ama','pal'])ok(cs(mk('amu',{['sk_'+skOf(c)]:1}))===c,'单技能词缀 '+c);
ok(cs(mk('rin',{nb_e_dbl_bww:15}))==='bar','nb_e_dbl_<技能>');
ok(cs(mk('rin',{nb_e_cheap_mbliz:25}))==='sor','nb_e_cheap_<技能>');
ok(cs(mk('rin',{nb_u_throne:1}))==='nec','亡灵流派暗金键');
ok(cs(mk('rin',{nb_e_dr:8,allsk:1,life:60}))==='','通用词缀不算职业');
ok(cs(mk('rin',{tc_bar0:1,sk_bs:1}))==='bar,nec','多职业词缀');
const J=G("BASES.find(b=>b.s==='jewel').id"),C=G("BASES.find(b=>b.s==='charm').id");
ok(cs(mk(J,{['skd_'+skOf('sor')]:20}))==='sor','珠宝 skd_');ok(cs(mk(C,{tc_dru2:1}))==='dru','护身符 tc_dru2');ok(cs(mk(C,{life:20}))==='','通用护身符');
ok(cs(mk('rin')+";it.set='nb_pal_zeal'")==='pal','流派套装(骑士)');ok(cs(mk('rin')+";it.set='nb_sum'")==='nec','流派套装(亡灵)');
ok(cs(mk('rin')+";it.set='trang'")==='nec','职业套装 冥王化身');ok(cs(mk('rin')+";it.set='night'")==='','普通套装');
ok(cs(mk('rin')+";it.lp='pw_whirl'")==='bar','职业威能');ok(cs(mk('rin')+";it.lp='soul_feast'")==='nec','通用威能作为亡灵核心威能');
ok(cs(mk('rin')+";it.lp='boss_bane'")==='','通用威能');
ok(G("itemClsSet({k:'gem',g:0,lv:1}).size")===0,'宝石无职业');
// clfOk
G(`var TA=makeBase(BASEM.orb1,60);TA.m={};var TB=makeBase(BASEM.rin,60);TB.m={life:10};var Cc=makeBase(BASEM.rin,60);Cc.m={tc_bar0:1}`);
ok(G("clfOk(TA,'all')&&clfOk(TB,'all')&&clfOk(Cc,'all')"),'全部');
ok(G("clfOk(TA,'sor')&&clfOk(TB,'sor')&&!clfOk(Cc,'sor')"),'法师：专属+通用，不含野蛮人');
ok(G("clfOk(TA,'sor',1)&&!clfOk(TB,'sor',1)&&clfOk(Cc,'bar',1)"),'仅专属');
ok(G("clfOk(TB,'ass')&&!clfOk(TA,'ass')"),'未开放职业只看通用');
// 与 stMatch 叠加
G("STF.q='all';STF.t='all';STF.s='';CLF.c='sor';CLF.only=0");
ok(G("stMatch({it:TA})&&stMatch({it:TB})&&!stMatch({it:Cc})"),'stMatch 叠加职业');
G("STF.t='ring'");ok(G("!stMatch({it:TA})&&stMatch({it:TB})&&!stMatch({it:Cc})"),'类型+职业');
G("STF.t='all';CLF.c='all'");ok(G("stMatch({it:TA})&&stMatch({it:Cc})"),'全部不影响');
// 背包渲染期间过滤、之后复原（NOUI 下 renderBag 走 stub DOM）
G("S.bag=[TA,TB,Cc];CLF.c='bar';STV='bag'");let n=-1;try{G("renderBag()");}catch(e){}n=G("S.bag.length");ok(n===3,'背包渲染后复原 '+n);
G("STV='shared';const s0=STF.s;try{renderBag()}catch(e){}");ok(G("STF.s===''"),'仓库占位 STF.s 复原');
G("CLF.c='all';CLF.only=0");
console.log(`\n结果：通过 ${pass}，失败 ${fail}`);process.exit(fail?1:0);
