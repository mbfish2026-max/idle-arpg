// 天光单元测试：node tests/tianguang_test.js
// 校验 tianguang.js：5 色档位映射、多件取最高档、AUDIO.playLootTier 接口与档位名、离线静默、拾取过滤「至少保留」
const fs=require('fs'),vm=require('vm'),path=require('path');const root=path.join(__dirname,'..');
const stub=()=>new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?()=>'' :k==='readyState'?'loading':stub(),apply:()=>stub(),construct:()=>stub(),set:()=>true});
const store={};const ctx={console:{log(){},warn(){},error:console.error},Math,Date,JSON,setTimeout:()=>0,setInterval:()=>0,clearInterval(){},clearTimeout(){},requestAnimationFrame:()=>0,
 localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v},removeItem:k=>{delete store[k]}},document:stub(),Image:function(){return stub()},navigator:{},location:{search:''},addEventListener(){},performance:{now:()=>Date.now()},confirm:()=>true};
ctx.window=ctx;vm.createContext(ctx);ctx.__NOUI=1;ctx.__NOSHOWLOGIN=1;
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');const files=[...html.matchAll(/<script src="([^"?]+)/g)].map(m=>m[1]).filter(f=>!/^(cloud|login_flow|audio|power|ui_art|icon2|art2_)/.test(f));
for(const f of files)try{vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f})}catch(e){if(f==='tianguang.js')throw e}
const G=s=>vm.runInContext(s,ctx);let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('  ✗ '+m)}};
G(`S=newSave();try{load()}catch(e){};S.diff=2;calc();EGM=null;`);
const T=s=>G(`tgTier(${s})`);
ok(T("{q:5,name:'x',m:{}}")==='unique'&&T("{q:6,m:{}}")==='set'&&T("{q:5,anc:1,m:{}}")==='ancient'&&T("{q:6,anc:2,m:{}}")==='primal'&&T("{q:5,myth:1,m:{}}")==='mythic','档位映射');
ok(T("{k:'rune',r:19}")==='hirune'&&T("{k:'rune',r:18}")===null&&T("{q:4,m:{}}")===null&&T("{k:'gem',g:0,lv:0}")===null,'符文≥20 紫，稀有/宝石无光柱');
ok(G("tgBest([{q:5,m:{}},{q:6,anc:2,m:{}},{k:'rune',r:25}]).t")==='primal','多件同掉取最高档');
ok(new Set(Object.values(G("TG.COL"))).size===5,'5 种颜色');
// 音效接口：调用 AUDIO.playLootTier，档位名均被 audio.js 识别
G(`var _snd=[];AUDIO={playLootTier:t=>{_snd.push(t);return true}};`);
G(`tgFire([{q:5,m:{}},{q:5,anc:1,m:{}}])`);ok(G("_snd.join()")==='ancient','播放最高档 ancient');
const names=G("Object.keys(TG.RANK).join()").split(',');const LN=require('fs').readFileSync(path.join(root,'audio.js'),'utf8').match(/LOOT_NAMES=\{([^}]*)\}/)[1];
ok(names.every(n=>new RegExp('\\b'+n+':').test(LN)),'档位名都在 audio.js LOOT_NAMES 中');
G(`AUDIO=undefined`);ok(G("(()=>{try{tgFire([{q:5,anc:2,m:{}}]);return true}catch(e){return false}})()"),'AUDIO 不存在不报错');
// 离线结算静默
G(`_snd=[];AUDIO={playLootTier:t=>{_snd.push(t)}};TG.busy=1;__NOUI=0;`);G(`try{rollTC({lv:80,boss:1,actboss:1})}catch(e){}`);ok(G("_snd.length")===0,'离线期间不发声');G(`TG.busy=0;__NOUI=1`);
// 拾取过滤
G(`ensureLoot();S.rcy.on=1;for(const k in S.rcy.c)S.rcy.c[k]=1;S.rcy.runeMax=33;S.rcy.keepHR=1;S.rcy.hrMin=20`);
ok(G("shouldRecycle({k:'rune',r:19},false)")===false&&G("shouldRecycle({k:'rune',r:18},false)")===true,'符文≥20 保留，19 号回收');
G(`S.rcy.keepHR=0`);ok(G("shouldRecycle({k:'rune',r:25},false)")===true,'关闭后高符文可回收');
ok(G("S.rcy.keepAnc!==0")&&!('keepHR' in G("rcyDefault()")),'旧存档默认：上古保留、符文过滤关');
console.log(`tianguang_test: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);
