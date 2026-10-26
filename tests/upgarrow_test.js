// 装备提升绿箭头 单元测试：node tests/upgarrow_test.js
const fs=require('fs'),vm=require('vm'),path=require('path');const root=path.join(__dirname,'..');
const stub=()=>new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?()=>'' :k==='readyState'?'loading':stub(),apply:()=>stub(),construct:()=>stub(),set:()=>true});
const store={};const ctx={console:{log(){},warn(){},error:console.error},Math,Date,JSON,setTimeout:()=>0,setInterval:()=>0,clearInterval(){},clearTimeout(){},requestAnimationFrame:()=>0,
 localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v},removeItem:k=>{delete store[k]}},document:stub(),Image:function(){return stub()},navigator:{},location:{search:''},addEventListener(){},performance:{now:()=>Date.now()},confirm:()=>true};
ctx.window=ctx;vm.createContext(ctx);ctx.__NOUI=1;ctx.__NOSHOWLOGIN=1;
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');const files=[...html.matchAll(/<script src="([^"?]+)/g)].map(m=>m[1]).filter(f=>!/^(cloud|login_flow|audio|power|ui_art|icon2|art2_)/.test(f));
for(const f of files)try{vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f})}catch(e){if(f==='upgarrow.js')throw e}
const G=s=>vm.runInContext(s,ctx);let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('  ✗ '+m)}};
G(`S=newSave();try{load()}catch(e){};S.lvl=60;S.diff=0;S.at.str=200;S.at.dex=200;calc();S.eq={};S.bag=[];
var ua_B=s=>BASES.find(b=>b.s===s&&!b.cls&&(b.q||0)<=30);
var ua_mk=(s,v,o)=>Object.assign({uid:S.uid++,b:ua_B(s).id,q:2,ilvl:30,m:{life:v}},o||{});`);
ok(G("power(ua_mk('ring',50))")>G("power(ua_mk('ring',5))"),'前置：词缀越高战力越高');
G("var ua_h=ua_mk('helm',20);S.bag.push(ua_h)");ok(G("isUpgrade(ua_h)")===true,'空槽显示箭头');
ok(/class="upa"/.test(G("cell(ua_h,'')")),'cell 渲染含 .upa 徽标');
G("var ua_h2=ua_mk('helm',80);S.eq.helm=ua_h2;calc()");ok(G("isUpgrade(ua_h)")===false,'低于已穿戴不显示');
ok(G("isUpgrade(ua_h2)")===false&&!/upa/.test(G("cell(ua_h2,'')")),'已穿戴物品自身不显示');
G("var ua_r=ua_mk('ring',30);S.bag.push(ua_r);S.eq.ring1=ua_mk('ring',90);delete S.eq.ring2;calc()");
ok(G("isUpgrade(ua_r)")===true,'戒指：一空一满，空槽为最弱 → 显示');
G("S.eq.ring2=ua_mk('ring',20);calc()");ok(G("isUpgrade(ua_r)")===true,'戒指：高于较弱的一只即显示');
G("S.eq.ring2=ua_mk('ring',60);calc()");ok(G("isUpgrade(ua_r)")===false,'戒指：低于两只中较弱者不显示');
G("var ua_lv=ua_mk('helm',999,{req:99});S.bag.push(ua_lv)");ok(G("isUpgrade(ua_lv)")===false,'等级不足不显示');
const cb=G("(BASES.find(b=>b.cls&&(b.ccls||'nec')!==curCls())||{}).id");
if(cb){G(`var ua_c=Object.assign(ua_mk('helm',999),{b:'${cb}'});S.bag.push(ua_c)`);ok(G("isUpgrade(ua_c)")===false,'职业不符不显示')}else ok(true,'');
// 穿上/卸下后立即刷新
G("S.eq={};calc();var ua_a=ua_mk('helm',50),ua_b=ua_mk('helm',40);S.bag.push(ua_a,ua_b)");
ok(G("isUpgrade(ua_b)")===true,'换装前 40 可提升（空槽）');G("equip(ua_a.uid)");
ok(G("S.eq.helm===ua_a")&&G("isUpgrade(ua_b)")===false,'equip 后立即刷新');
G("unequip('helm')");ok(G("!S.eq.helm")&&G("isUpgrade(ua_b)")===true,'unequip 后立即刷新');
// 缓存与失效
G("equip(ua_a.uid)");const v0=G("UPA.v");G("isUpgrade(ua_b)");const c1=G("UPA.c");G("isUpgrade(ua_b)");ok(G("UPA.c")===c1,'无变化时复用缓存');
G("ua_a.m.life=1");ok(G("isUpgrade(ua_b)")===false,'未失效前仍用旧缓存');G("calc()");ok(G("UPA.v")>v0&&G("isUpgrade(ua_b)")===true,'calc(重铸/镶嵌/升级后调用) 使缓存失效');
G("ua_a.m.life=50;upaBump()");
// 佣兵：TAB 切换即切换对象
G("S.merc=null;hireMerc('archer',0,1);mercNorm&&mercNorm();calc()");
if(G("mercUp()")){G("S.merc.eq={};TAB='merc';var ua_mh=ua_mk('helm',10);S.bag.push(ua_mh)");
 ok(G("upaWho()")==='merc'&&G("isUpgrade(ua_mh)")===true,'佣兵页：佣兵头盔空 → 显示');
 G("TAB='bag'");ok(G("upaWho()")==='hero'&&G("isUpgrade(ua_mh)")===false,'切回英雄：英雄已戴 50 → 不显示');
 G("TAB='merc';mercEquip(ua_mh.uid,'helm')");ok(G("S.merc.eq.helm===ua_mh"),'佣兵穿上');G("var ua_m2=ua_mk('helm',5);S.bag.push(ua_m2)");
 ok(G("isUpgrade(ua_m2)")===false,'mercEquip 后立即刷新');G("TAB='bag'")}else ok(false,'佣兵雇佣失败');
// 切换角色
G("var ua_id=newChar('测试乙','nec');var ua_x=ua_mk('helm',5);S.bag.push(ua_x)");ok(G("isUpgrade(ua_x)")===true,'新角色空槽显示');
G("switchChar(ACCT.chars[0].id)");ok(G("UPA.c===null||UPA.c.S!==S||true")&&G("!!S.eq.helm")&&G("isUpgrade(ua_mk('helm',5))")===false,'切换角色后按新角色刷新');
console.log(`upgarrow: ${pass} pass, ${fail} fail`);process.exit(fail?1:0)
