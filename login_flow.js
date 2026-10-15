'use strict';
// ===================================================================================
// login_flow.js — 登录流程：注册新账号 → 先弹「新建角色」；每次登录 → 先弹「选择角色」。
// 运行时包装 cloud.js 的 clSignUp/clSignIn/clResolve/uploadGuest 与 stash.js 的 newChar，不改 cloud.js。
// 若登录后出现云存档冲突/上传游客存档弹窗，则等用户处理完再弹角色界面。
// 新账号自动生成的占位角色（未玩过的 1 级亡灵术士）在玩家建好第一个角色后自动删除。
// ===================================================================================
const LF={pending:null,placeholder:null};
function lfFresh(){return ACCT&&ACCT.chars.length===1&&S&&S.lvl<=1&&!S.xp&&!S.kills}
function lfBlocked(){const m=document.querySelector('#modal:not(.hide) .mtitle');return!!(m&&/存档冲突|上传本地存档/.test(m.textContent))}
function lfShow(){const k=LF.pending;if(!k||window.__NOUI)return;if(lfBlocked())return;LF.pending=null;
 if(k==='new'&&lfFresh()){LF.placeholder=ACCT.chars[0].id;newCharUI()}else{LF.placeholder=null;charUI()}}
if(typeof clSignUp==='function'){const f=clSignUp;clSignUp=async function(...a){LF.pending='new';const r=await f.apply(this,a);setTimeout(lfShow,60);return r}}
if(typeof clSignIn==='function'){const f=clSignIn;clSignIn=async function(...a){LF.pending='sel';const r=await f.apply(this,a);setTimeout(lfShow,60);return r}}
for(const n of['clResolve','uploadGuest'])if(typeof window[n]==='function'){const f=window[n];window[n]=async function(...a){const r=await f.apply(this,a);setTimeout(lfShow,60);return r}}
if(typeof newChar==='function'){const f=newChar;newChar=function(...a){const ph=LF.placeholder;const id=f.apply(this,a);
 if(id&&ph&&ph!==id){LF.placeholder=null;const c=ACCT.chars.find(x=>x.id===ph);const raw=c&&GS.getItem(CH_PRE+ph);let o=null;try{o=raw&&JSON.parse(raw)}catch(e){}
  if(c&&(!o||o.lvl<=1))deleteChar(ph,true);if(!window.__NOUI){closeM();render()}}return id}}
// 新账号必须先建角色：占位角色待删除时关掉「新建角色」弹窗 → 重新弹出（避免占位亡灵术士在后台战斗、拿到经验后不再被视为占位）
if(typeof closeM==='function'){const f=closeM;closeM=function(...a){const r=f.apply(this,a);if(LF.placeholder&&!window.__NOUI)setTimeout(()=>{const m=document.querySelector('#modal');
 if(LF.placeholder&&ACCT&&ACCT.chars.some(c=>c.id===LF.placeholder)&&(!m||m.classList.contains('hide')))newCharUI()},0);return r}}
// 没有可玩角色时不开战：未登录，或账号里只有自动生成的占位角色（无 cid、1 级、未玩过）→ 主循环不推进战斗，战场清空并提示；
// 已登录但只有占位角色（含上次注册后没建角色就退出）→ 自动弹「新建角色」。只拦实时主循环 loop0，不影响 step()（模拟/测试直接调用 step）
function lfPh(){if(!ACCT||ACCT.chars.length!==1)return null;const c=ACCT.chars[0];return!c.cid&&lfFresh()?c:null}
function lfGated(){if(window.__NOGATE||window.__NOUI)return 0;if(typeof CU!=='undefined'&&!CU)return'login';
 if(LF.placeholder&&ACCT&&ACCT.chars.some(c=>c.id===LF.placeholder))return'new';return lfPh()?'new':0}
{const st=document.createElement('style');st.textContent='body.nochar #mgrid,body.nochar #arow,body.nochar #flog,body.nochar #fquest,body.nochar #fzone,body.nochar #ftop{visibility:hidden}'+
 'body.nochar #fbattle::after{content:attr(data-gate);position:absolute;left:0;right:0;top:40%;text-align:center;color:#c8b48a;font-size:15px;letter-spacing:2px}';document.head.appendChild(st)}
if(typeof loop0==='function'){const f=loop0;loop0=function(now){const g=lfGated();const b=document.body;if(b)b.classList.toggle('nochar',!!g);
 if(!g)return f(now);lastT=now;if(MON.length||ALLY.length){MON=[];ALLY=[];CORPSE=[]}const fb=document.getElementById('fbattle');if(fb)fb.dataset.gate=g==='login'?'请先登录账号':'请先新建角色';
 if(g==='new'&&!LF.pending&&!lfBlocked()){const m=document.getElementById('modal');if(!m||m.classList.contains('hide')){const ph=lfPh();if(ph)LF.placeholder=ph.id;newCharUI()}}}}
