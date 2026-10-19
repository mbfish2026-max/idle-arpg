// 加成汇总单元测试：node tests/bonus_test.js
// 校验 bonus.js：技能加成总值=calc 结果、来源归属（装备/镶嵌符文之语/护身符/套装档位/其他来源）、非本职业词缀标注、威能核心与共鸣、流派 6 件套档位、符文之语、缓存签名
const fs=require('fs'),vm=require('vm'),path=require('path');const root=path.join(__dirname,'..');
const stub=()=>new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?()=>'' :k==='readyState'?'loading':stub(),apply:()=>stub(),construct:()=>stub(),set:()=>true});
const store={};const ctx={console:{log(){},warn(){},error:console.error},Math,Date,JSON,setTimeout:()=>0,setInterval:()=>0,clearInterval(){},clearTimeout(){},requestAnimationFrame:()=>0,
 localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v},removeItem:k=>{delete store[k]}},document:stub(),Image:function(){return stub()},navigator:{},location:{search:''},addEventListener(){},performance:{now:()=>Date.now()},confirm:()=>true};
ctx.window=ctx;vm.createContext(ctx);ctx.__NOUI=1;ctx.__NOSHOWLOGIN=1;
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');const files=[...html.matchAll(/<script src="([^"?]+)/g)].map(m=>m[1]).filter(f=>!/^(cloud|login_flow|audio|power|ui_art|icon2|art2_)/.test(f));
for(const f of files)try{vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f})}catch(e){if(f==='bonus.js')throw e}
const G=s=>vm.runInContext(s,ctx);let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('  ✗ '+m)}};
G(`S=newSave();try{load()}catch(e){};S.lvl=80;S.diff=2;calc();
 var mk=(b,m,o)=>{const it=makeBase(BASEM[b],80);it.q=4;it.m=Object.assign({},m||{});it.uid=S.uid++;it.req=1;Object.assign(it,o||{});return it};
 var rw=RUNEWORDS.findIndex(r=>r.m&&r.m.allsk);var wp=mk('wand4',{},{q:2,rw,soc:[],sock:0});
 S.eq.weapon=wp;S.eq.amulet=mk('amu',{allsk:2,t1sk:1},{set:'nb_bone',lp:'pw_marrow'});S.eq.ring1=mk('rin',{sk_bs:2,tc_bar0:1},{set:'nb_bone'});S.eq.ring2=mk('rin',{skd_bs:30},{set:'nb_bone'});
 S.eq.helm=mk('hlm1',{life:10},{set:'nb_bone'});S.eq.armor=mk('arm1',{},{set:'nb_bone',lp:'bx_echo'});S.eq.gloves=mk('glv1',{},{set:'nb_bone'});S.eq.boots=mk('boot1'in BASEM?'boot1':BASES.find(b=>b.s==='boots').id,{},{lp:'ba_surge'});
 var ch=BASES.find(b=>b.s==='charm').id;S.bag=[mk(ch,{sk_bs:1})];S.build='bone';calc();`);
ok(G("setCount().nb_bone")===6,'6 件套');
ok(G("EG_LPS.has('pw_marrow')&&EG_LPS.has('bx_echo')&&EG_LPS.has('ba_surge')"),'威能生效');
ok(G("ST.pbr&&ST.pbr.lv")===2&&G("ST.pbr.full")===true,'共鸣 II（6 件减半）');
const rows=JSON.parse(G("JSON.stringify(bxSkillRows())"));const R=k=>rows.find(r=>r.k===k);
ok(R('allsk')&&R('allsk').v===G("ST.allsk"),'全技能总值=ST.allsk '+(R('allsk')||{}).v);
ok(R('t1sk')&&R('t1sk').v===G("ST.t1sk"),'系别总值=ST.t1sk');
ok(R('sk_bs')&&R('sk_bs').v===G("ST.sk_bs")&&R('sk_bs').v===3,'单技能=ST.sk_bs(戒指2+护身符1)');
ok(R('tc_bar0')&&R('tc_bar0').off,'野蛮人系别标注不生效');
ok(R('skd_bs')&&R('skd_bs').v===G("ST.nb.skd.bs"),'技能伤害=ST.nb.skd '+(R('skd_bs')||{}).v+' / '+G("ST.nb.skd.bs"));
const src=k=>JSON.parse(G(`JSON.stringify(BX.src['${k}'])`));
ok(src('sk_bs').some(x=>x.w==='护身符（背包）'&&x.v===1)&&src('sk_bs').some(x=>x.v===2),'来源：戒指+护身符');
ok(src('allsk').some(x=>x.w===G("SLOTN.weapon"))&&src('allsk').some(x=>x.w===G("SLOTN.amulet")&&x.v===2),'来源：符文之语武器+护身符');
ok(src('skd_bs').reduce((a,x)=>a+x.v,0)===R('skd_bs').v,'来源合计=总值（含其他来源）');
ok(src('skd_bs').some(x=>x.n==='其他来源'),'流派被动/共鸣记为其他来源');
const body=G("BX.sig='';bxBody()");
ok(/共鸣 II/.test(body)&&/核心 3\/3/.test(body),'共鸣显示');ok((body.match(/◆ /g)||[]).length===3,'核心标记 3 个');
ok(/✔ 6 件/.test(body)&&/【/.test(body),'6 件套档位+机制文字');
ok(/符文之语/.test(body)&&body.includes(G("RUNEWORDS[rw].n")),'符文之语');ok(/流派 <b>/.test(body),'流派被动');
ok(!/undefined|NaN|\{v\}/.test(body),'无 undefined/NaN/{v}');
ok(G("bxBody()===BX.html"),'缓存');G("S.eq.ring2=null;calc()");ok(G("bxSig()!==BX.sig"),'换装后签名变化');
G("S.eq={};S.bag=[];S.build=null;calc();BX.sig=''");const b2=G("bxBody()");ok(/未穿戴套装/.test(b2)&&/无生效威能/.test(b2),'空装备');
ok(G("bxOpen()")===false,'默认折叠');G("bxToggle()");ok(G("bxOpen()")===true&&store.anye_bonus_open==='1','记住展开');
console.log(`\n结果：通过 ${pass}，失败 ${fail}`);process.exit(fail?1:0);
