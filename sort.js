'use strict';
// ===================================================================================
// sort.js — 背包 / 个人仓库 / 共享仓库「自动整理」增强（包装 stash.js 的 sortArr/sortPages/sortKey 等，不改他人文件）
// 排序：类型（装备按部位 武器→副手→头盔→铠甲→手套→腰带→鞋→护符→戒指→护身符→珠宝 → 宝石 → 符文 → 材料 → 其他）→ 品质高到低 → 等级高到低 → 名称
// 压紧空格、同类可堆叠合并；锁定与未锁定物品分开堆叠（stackKey/mergeMats/pushInto 区分 lk），锁定状态不变。
// 选项「整理时先自动存仓」：S.ast.onSort（缺省 0），复用 stash.js 自动存仓的类型与目标设置（跳过锁定物品）。
// ===================================================================================
const SORT_T={weapon:0,shield:1,helm:2,armor:3,gloves:4,belt:5,boots:6,amulet:7,ring:8,charm:9,jewel:10,gem:20,rune:21,mat:22,pot:23};
const SORT_Q={8:9,7:8,5:7,6:6,4:5,3:4,2:3,1:2,0:1};
function sortType(it){if(it.k)return SORT_T[it.k]??30;const b=BASEM[it.b];if(!b)return 30;return SORT_T[b.s==='weapon'?'weapon':b.s]??15}
function sortLv(it){if(it.k==='gem')return it.lv||0;if(it.k==='rune')return it.r||0;if(it.k)return 0;return Math.max(it.il||0,typeof itemReq==='function'?(itemReq(it).lv||0):0)}
sortKey=function(it){return[sortType(it),it.k?0:-(SORT_Q[it.rw!=null?8:(it.q||0)]||0),it.k==='gem'?(it.g||''):'',-sortLv(it),itemName(it),it.lk?1:0]};
cmpIt=function(a,b){const x=sortKey(a),y=sortKey(b);for(let i=0;i<x.length;i++){if(x[i]<y[i])return-1;if(x[i]>y[i])return 1}return 0};
// 锁定物品单独成组 / 不与未锁定堆叠合并
{const f=stackKey;stackKey=function(it){const k=f(it);return k&&it.lk?k+':lk':k}}
mergeMats=function(arr){const m={};for(let i=arr.length-1;i>=0;i--){const x=arr[i];if(x.k!=='mat')continue;const key=x.id+(x.lk?':lk':'');if(m[key]){m[key].n+=x.n||0;arr.splice(i,1)}else m[key]=x}};
pushInto=function(arr,it){if(it.k==='mat'){const e=arr.find(x=>x.k==='mat'&&x.id===it.id&&!!x.lk===!!it.lk);if(e){e.n+=it.n;return}}arr.push(it)};
function sortAstOn(){return!!(S.ast&&S.ast.onSort)}
function sortAstToggle(){if(!S.ast)return;S.ast.onSort=S.ast.onSort?0:1;save();if(!window.__NOUI)render()}
// 整理背包：可选先自动存仓 → 排序压紧
function autoSortBag(){let n=0;if(sortAstOn()&&typeof autoStash==='function'&&S.ast){const was=S.ast.on;S.ast.on=1;try{const keep=[];for(const it of S.bag){if(!it.lk&&autoStash(it))n++;else keep.push(it)}S.bag=keep}finally{S.ast.on=was}}
 sortArr(S.bag);calc();save();if(!window.__NOUI){toast(n?`已整理，${n} 件自动存仓`:'背包已整理');render()}return n}
function autoSortStash(sh){const P=sh?ACCT.shared:S.pst;sortPages(P);if(sh)acctSave();save();if(!window.__NOUI){toast(sh?'共享仓库已整理':'个人仓库已整理');render()}return true}
// ---------- 界面：背包顶部显眼按钮 + 开关；仓库工具栏按钮替换 ----------
{const f=renderBag;renderBag=function(){f.apply(this,arguments);if(typeof document==='undefined'||window.__NOUI)return;const P=$('#panel');
 P.querySelectorAll('.stabs.sm button').forEach(b=>{if(b.textContent==='整理')b.remove()});
 const h3=[...P.querySelectorAll('.gp h3')].find(e=>/背包/.test(e.textContent));if(h3&&!P.querySelector('.sortbar')){h3.insertAdjacentHTML('afterend',`<div class="sortbar"><button class="btn gold sortbtn" onclick="autoSortBag()">⇅ 自动整理</button><button class="btn xs ${sortAstOn()?'on':''}" onclick="sortAstToggle()">整理时先自动存仓</button></div>`)}
 P.querySelectorAll('.sttools button').forEach(b=>{if(b.textContent==='整理'){const sh=/shared/.test(b.getAttribute('onclick')||'');b.textContent='⇅ 自动整理';b.className='btn xs gold sortbtn';b.setAttribute('onclick',`autoSortStash(${sh?1:0})`)}})}}
