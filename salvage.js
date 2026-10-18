'use strict';
// ===================================================================================
// salvage.js — 自动回收「凹槽底材」条件（包装 loot.js 的 shouldRecycle / ensureLoot / rcyUI，不改他人文件）
// 设置：S.rcy.sk = {n:{weapon,armor,shield,helm,gloves,belt,boots} 阈值 0-6（手套/腰带/靴子 0-2，缺省 2；毛皮/野蛮人头盔→头盔、圣徽盾→盾牌、专属弓/标枪/法球→武器）（0=关闭），elite:0|1}，缺省全部关闭；随角色存档 JSON（含云同步）保存。
// 规则：自动回收开启时，带凹槽且未镶嵌的灰/白底材（破旧/普通；sup=1 时含超强），「精英底材」保护(keepElite)优先；该部位阈值 N>0：
//   凹槽数 ≥ N → 保留（且「只保留扩展/精英」开启时须为扩展/精英底材）；凹槽数 < N → 回收（覆盖原“带凹槽底材”保护与品质/部位勾选）。
//   锁定物品永不回收。
// ===================================================================================
const SKP=[['weapon','武器'],['armor','护甲'],['shield','盾牌'],['helm','头盔'],['gloves','手套'],['belt','腰带'],['boots','靴子']];
const SKMAX={gloves:2,belt:2,boots:2};// 手套/腰带/靴子凹槽上限 2
const SKCAT={pelt:'helm',bhelm:'helm',pshd:'shield',abow:'weapon',ajav:'weapon',orb:'weapon'};// 职业专属底材计入父部位
function skDefault(){return{n:{weapon:0,armor:0,shield:0,helm:0,gloves:2,belt:2,boots:2},elite:0,sup:0}}
function skNorm(){if(!S||!S.rcy)return;const d=skDefault();const s=S.rcy.sk&&typeof S.rcy.sk==='object'?S.rcy.sk:{};s.n=Object.assign({},d.n,s.n||{});for(const k in s.n)s.n[k]=Math.max(0,Math.min(SKMAX[k]||6,+s.n[k]||0));s.elite=s.elite?1:0;s.sup=s.sup?1:0;S.rcy.sk=s}
// 默认自动回收（dv=2，一次性迁移，新旧角色都生效）：开启自动回收，破旧/普通/超强/魔法品质默认回收；
// 带凹槽白/超强底材、精英底材、带亡灵技能、未收录暗金/套装、锁定物品仍受保护。迁移时顺带把背包里已有的符合规则的杂物回收一次。
// dv=3（20261020a）：稀有品质默认也回收（一次性开启；之后玩家可在设置里取消勾选）
function rcyMigrate(){const r=S&&S.rcy;if(!r)return;if(r.dv===2){r.dv=3;r.q=Object.assign({},r.q||{},{4:1});return}if(r.dv>=2)return;r.dv=3;r.on=1;r.q=Object.assign({},r.q||{},{0:1,1:1,2:1,3:1,4:1});
 if(!Array.isArray(S.bag))return;const keep=[];for(const it of S.bag){if(it&&!it.k&&!it.lk&&shouldRecycle(it,false))doRecycle(it);else keep.push(it)}S.bag=keep}
{const f=ensureLoot;ensureLoot=function(){f.apply(this,arguments);skNorm();rcyMigrate()}}
function skPart(b){if(!b)return null;if(SKCAT[b.cat])return SKCAT[b.cat];if(b.s==='gloves'||b.s==='belt'||b.s==='boots')return b.s;if(b.s==='weapon')return'weapon';if(b.s==='armor')return'armor';if(b.s==='shield')return'shield';if(b.s==='helm')return'helm';return null}
// 返回 true=回收 / false=保留 / null=不适用（交给原规则）
function skRule(it){const r=S.rcy;if(!r||!r.on||!r.sk||!it||it.k||it.lk)return null;if(!(it.q<=1||(it.q===2&&r.sk.sup))||!it.sock||(it.soc&&it.soc.length)||it.rw!=null)return null;
 const b=BASEM[it.b],p=skPart(b);if(!p)return null;const N=r.sk.n[p]||0;if(!N)return null;if(r.keepElite&&(b.tier||0)>=2)return false;
 if(it.sock>=N&&(!r.sk.elite||(b.tier||0)>=1))return false;return true}
{const f=shouldRecycle;shouldRecycle=function(it,isNew){if(it&&it.lk)return false;skNorm();const v=skRule(it);return v==null?f(it,isNew):v}}
{const f=rcyUI;rcyUI=function(){f.apply(this,arguments);if(typeof document==='undefined'||window.__NOUI)return;skNorm();const box=document.querySelector('#modal .gp.rcy');if(!box||box.querySelector('.skrule'))return;
 const sk=S.rcy.sk,hs=[...box.querySelectorAll('h4')].find(h=>/回收所得/.test(h.textContent));
 const row=([k,n])=>`<div class="row skr"><span>${n}：${sk.n[k]?`凹槽 <b>&lt;${sk.n[k]}</b> 回收，≥${sk.n[k]} 保留`:'<span class="dim">关闭</span>'}</span><span><button class="btn xs" onclick="skSet('${k}',-1)">－</button><b class="skn">${sk.n[k]}</b><button class="btn xs" onclick="skSet('${k}',1)">＋</button></span></div>`;
 const h=`<div class="skrule"><h4>凹槽底材（灰/白、未镶嵌）</h4>${SKP.map(row).join('')}
  <div class="btns"><button class="btn xs ${sk.elite?'on':''}" onclick="S.rcy.sk.elite^=1;rcyUI()">只保留扩展/精英底材</button><button class="btn xs ${sk.sup?'on':''}" onclick="S.rcy.sk.sup^=1;rcyUI()">超强品质也适用</button></div>
  <div class="dim">阈值 0=关闭（沿用上方规则）。开启的部位：凹槽数达标保留，不达标回收（不受上方品质/部位/“带凹槽底材”保护影响）。「只保留扩展/精英」开启时普通底材即使达标也回收。默认只适用破旧/普通品质；「超强品质也适用」开启后包含超强。上方「精英底材」保护开启时，破旧/普通/超强品质的精英底材不论凹槽数一律保留（魔法/稀有等精英装备不受此保护）。锁定物品永不回收。</div></div>`;
 if(hs)hs.insertAdjacentHTML('beforebegin',h);else box.insertAdjacentHTML('beforeend',h)}}
function skSet(k,d){skNorm();S.rcy.sk.n[k]=Math.max(0,Math.min(SKMAX[k]||6,(S.rcy.sk.n[k]||0)+d));if(!window.__NOUI)rcyUI()}

// 部位/类型勾选：职业专属弓/标枪归入 弓/标枪（否则 r.c 无此类别，永不回收）
{const f=rcyCat;rcyCat=function(it){const c=f(it);return c==='abow'?'bow':c==='ajav'?'jav':c}}
// 「带职业技能」保护按当前角色职业判断（不再只认亡灵术士）：+全部技能、本职业单技能 sk_<id>、本职业系别 tc_<cls><t>；亡灵系别 t0sk..t2sk 只算亡灵术士
hasNecroSkill=function(it){const m=(it&&it.m)||{};const c=typeof curCls==='function'?curCls():'nec';
 return Object.keys(m).some(k=>{if(k==='allsk')return true;if(k.startsWith('sk_')){const s=SKM[k.slice(3)];return !!s&&(s.cls||'nec')===c}
  if(/^t\dsk$/.test(k))return c==='nec';if(k.startsWith('tc_'))return k.slice(3).replace(/\d+$/,'')===c;return false})};
