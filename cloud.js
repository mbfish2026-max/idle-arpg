'use strict';
// ===================================================================================
// cloud.js — Supabase 云存档：邮箱登录/注册（昵称）、游客模式、整账号（所有角色+共享仓库+资料）存入 public.saves.data
// 自动同步：每 60 秒、切到后台/关页面；写前比对云端 updated_at，若他处更新过则让玩家选择保留哪份。网络失败不影响游戏。
// ===================================================================================
const SB_URL='https://yzhjhyroekrcdqqjrlgm.supabase.co',SB_KEY='sb_publishable_RLRQQmjYDEVhdg2dhAMmEg_qQGh38vh',SB_CDN='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
const CLOUD_KEY='anye_cloud';let SB=null,CU=null,CLOUD={},CL_BUSY=0,CL_ERR='',CL_PROFILE=null;
function clMetaLoad(){try{CLOUD=JSON.parse(localStorage.getItem(CLOUD_KEY))||{}}catch(e){CLOUD={}}}
function clMetaSave(){try{localStorage.setItem(CLOUD_KEY,JSON.stringify(CLOUD))}catch(e){}}
clMetaLoad();
if(CLOUD.mode==='user'&&CLOUD.uid)setNS(CLOUD.uid);
function sbReady(){if(SB)return Promise.resolve(SB);return new Promise(res=>{const done=()=>{try{SB=window.supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true,storageKey:'anye_sb_auth'}})}catch(e){CL_ERR='云服务不可用'}res(SB)};
 if(window.supabase&&window.supabase.createClient)return done();const s=document.createElement('script');s.src=SB_CDN;s.onload=done;s.onerror=()=>{CL_ERR='无法加载云服务（离线模式）';res(null)};document.head.appendChild(s)})}
// ---------- 账号存档导出 / 导入 ----------
function exportAccount(){save();const a=JSON.parse(localStorage.getItem(ACCT_KEY));const chars={};for(const c of a.chars){const r=localStorage.getItem(CH_PRE+c.id);if(r)chars[c.id]=JSON.parse(r)}
 return{fmt:1,acct:a,chars,profile:{nickname:CL_PROFILE&&CL_PROFILE.nickname||CLOUD.nick||''},at:Date.now()}}
function importAccount(d){if(!d||!d.acct||!d.chars)throw new Error('云端存档格式错误');ST_RESET=1;
 const old=JSON.parse(localStorage.getItem(ACCT_KEY)||'{"chars":[]}');for(const c of old.chars||[])localStorage.removeItem(CH_PRE+c.id);
 localStorage.setItem(ACCT_KEY,JSON.stringify(d.acct));for(const id in d.chars)localStorage.setItem(CH_PRE+id,JSON.stringify(d.chars[id]));localStorage.removeItem(KEY);ST_RESET=0;
 ACCT=null;resetRuntime();load();S.last=Date.now();calc();H.life=ST.life;H.mana=ST.mana;save();if(!window.__NOUI){closeM();render()}}
function summary(d){if(!d||!d.acct)return'（空）';return d.acct.chars.map(c=>`${c.name} Lv.${(d.chars[c.id]||{}).lvl||c.lvl}`).join('、')}
function guestExport(){try{const a=JSON.parse(localStorage.getItem('anye_d2_acct'));if(!a)return null;const chars={};for(const c of a.chars){const r=localStorage.getItem('anye_d2_ch_'+c.id);if(r)chars[c.id]=JSON.parse(r)}return{fmt:1,acct:a,chars}}catch(e){return null}}
async function uploadGuest(){const g=guestExport();if(g)importAccount(g);await upload();toast('已把游客存档上传到账号');closeM();render()}
// ---------- 认证 ----------
async function clSignUp(email,pw,nick){const sb=await sbReady();if(!sb)throw new Error(CL_ERR);const{data,error}=await sb.auth.signUp({email,password:pw,options:{data:{nickname:nick}}});if(error)throw error;
 if(!data.session){const r=await sb.auth.signInWithPassword({email,password:pw});if(r.error)throw r.error}await afterLogin(nick);return CU}
async function clSignIn(email,pw){const sb=await sbReady();if(!sb)throw new Error(CL_ERR);const{error}=await sb.auth.signInWithPassword({email,password:pw});if(error)throw error;await afterLogin();return CU}
async function clSignOut(){try{await syncNow(true)}catch(e){}if(SB)await SB.auth.signOut();CU=null;CLOUD={mode:'guest'};clMetaSave();switchNS(null);if(!window.__NOUI){toast('已退出登录（继续以游客模式本地游玩）');render()}}
async function afterLogin(nick){const{data}=await SB.auth.getUser();CU=data.user;CLOUD.mode='user';CLOUD.email=CU.email;if(CLOUD.uid!==CU.id){CLOUD.uid=CU.id;CLOUD.remoteAt=null}clMetaSave();switchNS(CU.id);
 if(nick){await SB.from('profiles').upsert({id:CU.id,nickname:nick,updated_at:new Date().toISOString()})}
 const p=await SB.from('profiles').select('nickname,created_at').eq('id',CU.id).maybeSingle();CL_PROFILE=p.data||{nickname:nick||''};CLOUD.nick=CL_PROFILE.nickname;clMetaSave();
 await firstSync()}
async function fetchRemote(withData){const r=await SB.from('saves').select(withData?'data,updated_at,version':'updated_at').eq('user_id',CU.id).maybeSingle();if(r.error)throw r.error;return r.data}
function localFresh(){return ACCT.chars.length===1&&S.lvl<=1&&!S.xp}
async function firstSync(){const rem=await fetchRemote(true);
 if(!rem){const g=guestExport();if(!window.__NOUI&&g&&g.acct.chars.some(c=>(g.chars[c.id]||{}).lvl>1||(g.chars[c.id]||{}).xp))return conflictUI(null,'upload');return upload()}
 if(CLOUD.remoteAt&&rem.updated_at===CLOUD.remoteAt)return upload();
 if(localFresh()||!CLOUD.remoteAt&&ACCT_NS&&ACCT.chars.length===1&&S.lvl<=1)return download(rem);return conflictUI(rem)}
async function upload(){const d=exportAccount();const at=new Date().toISOString();const r=await SB.from('saves').upsert({user_id:CU.id,data:d,version:1,updated_at:at});if(r.error)throw r.error;CLOUD.remoteAt=at;CLOUD.last=Date.now();clMetaSave();CL_ERR='';return'up'}
function download(rem){importAccount(rem.data);CLOUD.remoteAt=rem.updated_at;CLOUD.last=Date.now();clMetaSave();return'down'}
// 写前比对：云端 updated_at 与本机最后一次同步时记录的不同 → 他处更新过 → 冲突
async function syncNow(manual){if(!CU||!SB||CL_BUSY)return null;CL_BUSY=1;try{const rem=await fetchRemote(false);
  if(rem&&CLOUD.remoteAt&&rem.updated_at!==CLOUD.remoteAt){const full=await fetchRemote(true);if(window.__NOUI)return'conflict';conflictUI(full);return'conflict'}
  if(rem&&!CLOUD.remoteAt){const full=await fetchRemote(true);if(window.__NOUI)return'conflict';conflictUI(full);return'conflict'}
  const r=await upload();if(manual&&!window.__NOUI)toast('云同步完成');return r}catch(e){CL_ERR='同步失败：'+(e.message||e);if(manual&&!window.__NOUI)toast(CL_ERR);return null}finally{CL_BUSY=0}}
let CL_PENDING=null;
function conflictUI(rem,mode){CL_PENDING=rem;const loc=exportAccount();
 if(mode==='upload')return modal(`<div class="mtitle">上传本地存档</div><div class="gp"><div>账号 <b>${CLOUD.email}</b> 云端还没有存档。是否把本机游客存档复制到该账号并上传？</div><div class="dim">游客存档：${summary(guestExport())}</div><div class="btns c"><button class="btn gold" onclick="uploadGuest()">上传游客存档</button><button class="btn" onclick="upload().then(()=>{closeM();render()})">新开空白存档</button></div></div>`);
 modal(`<div class="mtitle">存档冲突</div><div class="gp"><div>云端存档在其他设备上更新过（或本机首次登录），请选择保留哪一份：</div>
 <div class="row"><span><b>云端</b><div class="dim">${new Date(rem.updated_at).toLocaleString('zh-CN')} · ${summary(rem.data)}</div></span><button class="btn gold" onclick="clResolve('cloud')">保留云端</button></div>
 <div class="row"><span><b>本机</b><div class="dim">${new Date(loc.acct.t||Date.now()).toLocaleString('zh-CN')} · ${summary(loc)}</div></span><button class="btn" onclick="clResolve('local')">保留本机</button></div>
 <div class="dim">未选择前不会自动同步，游戏可继续。</div></div>`)}
async function clResolve(w){try{if(w==='cloud'&&CL_PENDING){download(CL_PENDING);toast('已载入云端存档')}else{await upload();toast('已上传本机存档')}}catch(e){toast('操作失败：'+(e.message||e))}CL_PENDING=null;closeM();render()}
// ---------- 界面 ----------
function loginUI(tab){tab=tab||'in';modal(`<div class="mtitle">暗夜挂机 · 账号</div><div class="gp login">
 <div class="stabs"><button class="${tab==='in'?'on':''}" onclick="loginUI('in')">登录</button><button class="${tab==='up'?'on':''}" onclick="loginUI('up')">注册</button></div>
 <input id="lg_em" type="email" placeholder="邮箱" autocomplete="email"><input id="lg_pw" type="password" placeholder="密码（至少 6 位）">${tab==='up'?'<input id="lg_nk" maxlength="16" placeholder="昵称">':''}
 <div class="dim" id="lg_msg">${CL_ERR||'登录后存档自动云同步，可在多设备继续游戏。'}</div>
 <div class="btns c"><button class="btn gold" onclick="loginDo('${tab}')">${tab==='up'?'注册并登录':'登录'}</button></div>
 <div class="btns c"><button class="btn" onclick="CLOUD.mode='guest';clMetaSave();closeM()">游客先玩（仅本机保存）</button></div></div>`)}
async function loginDo(tab){const em=$('#lg_em').value.trim(),pw=$('#lg_pw').value,nk=tab==='up'?$('#lg_nk').value.trim():'';const msg=$('#lg_msg');msg.textContent='请稍候…';
 try{if(tab==='up'){if(!nk)throw new Error('请填写昵称');await clSignUp(em,pw,nk)}else await clSignIn(em,pw);if(!$('#modal').classList.contains('hide')&&!CL_PENDING&&/账号/.test($('#modal').textContent))closeM();toast('已登录：'+CU.email);render()}catch(e){msg.textContent='失败：'+(e.message||e)}}
function accountPanel(){const t=CLOUD.last?new Date(CLOUD.last).toLocaleString('zh-CN'):'从未';
 return CU?`<div class="gp acct"><h3>账号与云存档</h3><div class="row"><span>账号</span><b>${CU.email}</b></div><div class="row"><span>昵称</span><b>${(CL_PROFILE&&CL_PROFILE.nickname)||'-'}</b></div><div class="row"><span>最后同步</span><b>${t}</b></div>${CL_ERR?`<div class="bad">${CL_ERR}</div>`:''}
 <div class="btns"><button class="btn sm gold" onclick="syncNow(true).then(()=>render())">手动同步</button><button class="btn sm" onclick="clSignOut()">退出登录</button></div>${chSwBtn()}<div class="dim">每 60 秒及切到后台时自动同步；云端被其他设备更新时会提示选择。</div></div>`
 :`<div class="gp acct"><h3>账号与云存档</h3><div class="dim">当前为游客模式，存档仅保存在本机浏览器。${CL_ERR?'<br>'+CL_ERR:''}</div><div class="btns"><button class="btn sm gold" onclick="loginUI('in')">登录 / 注册</button></div>${chSwBtn()}</div>`}
function chSwBtn(){return typeof charUI==='function'?`<div class="btns"><button class="btn sm gold" onclick="charUI()">🔄 切换角色（${(typeof ACCT!=='undefined'&&ACCT?ACCT.chars.length:1)} 个）</button></div>`:''}
const _cl_hero=renderHero;renderHero=function(){_cl_hero();document.querySelector('#panel').insertAdjacentHTML('beforeend',accountPanel())};
async function cloudBoot(){const sb=await sbReady();if(!sb)return;try{const{data}=await sb.auth.getSession();if(data.session){CU=data.session.user;if(CLOUD.uid!==CU.id){CLOUD.uid=CU.id;CLOUD.mode='user';CLOUD.remoteAt=null;clMetaSave()}switchNS(CU.id);const p=await sb.from('profiles').select('nickname').eq('id',CU.id).maybeSingle();CL_PROFILE=p.data;syncNow()}
 else if(!CLOUD.mode&&!window.__NOSHOWLOGIN)loginUI('in')}catch(e){CL_ERR='云服务连接失败：'+(e.message||e)}}
if(typeof window!=='undefined'&&typeof document!=='undefined'&&document.addEventListener&&!window.__NOUI){
 window.addEventListener&&window.addEventListener('load',()=>{setTimeout(cloudBoot,300);setInterval(()=>syncNow(),60000)});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')syncNow()});window.addEventListener&&window.addEventListener('pagehide',()=>syncNow())}
