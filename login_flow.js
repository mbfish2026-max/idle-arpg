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
  if(c&&(!o||(o.lvl<=1&&!o.xp&&!o.kills)))deleteChar(ph,true);if(!window.__NOUI){closeM();render()}}return id}}
