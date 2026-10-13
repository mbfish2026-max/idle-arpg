'use strict';
// ===================================================================================
// cloud.js — Supabase 云存档（唯一存储）：必须登录才能游玩；游戏数据只在内存 GS 与云端 public.saves.data，不写 localStorage。
// 同步：有改动时每 20 秒防抖上传；切后台/关页面/切角色/锁定/暗金套装掉落立即上传；失败指数退避重试并显示状态。
// 多设备：写前比对云端 updated_at，若被其他设备更新 → 本机显示「已在其他设备登录」并停止写入（绝不覆盖较新的云端）。
// 旧本机存档迁移（静默）：云端无存档→上传本机；云端有→按角色合并（同角色取等级/经验高者，共享仓库取物品多者），成功后删除本机旧键。
// ===================================================================================
const SB_URL='https://yzhjhyroekrcdqqjrlgm.supabase.co',SB_KEY='sb_publishable_RLRQQmjYDEVhdg2dhAMmEg_qQGh38vh',SB_CDN='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
let SB=null,CU=null,CLOUD={},CL_BUSY=0,CL_ERR='',CL_PROFILE=null;
const CL={ready:0,dirty:0,state:'',fail:0,retryT:null,lastUp:0,kicked:0,warned:0};
function clMetaSave(){}
function sbReady(){if(SB)return Promise.resolve(SB);return new Promise(res=>{const done=()=>{try{SB=window.supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true,storageKey:'anye_sb_auth'}})}catch(e){CL_ERR='云服务不可用'}res(SB)};
 if(window.supabase&&window.supabase.createClient)return done();const s=document.createElement('script');s.src=SB_CDN;s.onload=done;s.onerror=()=>{CL_ERR='无法加载云服务，请检查网络后刷新';res(null)};document.head.appendChild(s)})}
// ---------- 状态指示 ----------
function clSetState(st){CL.state=st;if(typeof document==='undefined'||window.__NOUI)return;let e=document.getElementById('clsync');
 if(!e){e=document.createElement('div');e.id='clsync';e.style.cssText='position:fixed;top:0;right:2px;z-index:60;font-size:10px;line-height:13px;padding:0 4px;border-radius:0 0 0 6px;background:rgba(0,0,0,.5);pointer-events:none;white-space:nowrap';document.body.appendChild(e)}
 /* 正常状态只显示小 ☁ 图标（屏幕右上角最顶端 13px 空白带；层数已移到顶部居中）；仅离线/被顶号时显示文字 */const M={ok:['☁','#8c8'],busy:['☁','#888'],err:['☁ 离线重试','#e96'],kick:['⚠ 他处登录','#f66'],'':['','']};const m=M[st]||M[''];e.textContent=m[0];e.style.color=m[1];e.title={ok:'已同步',busy:'同步中'}[st]||'';e.style.display=m[0]?'':'none'}
function clDirty(){CL.dirty=1}
// ---------- 账号存档导出 / 导入（内存 GS） ----------
function exportAccount(){save();const a=JSON.parse(GS.getItem(ACCT_KEY));const chars={};for(const c of a.chars){const r=GS.getItem(CH_PRE+c.id);if(r)chars[c.id]=JSON.parse(r)}
 const extra={};const rk=GS.getItem('anye_eg_rank');if(rk)extra.anye_eg_rank=rk;
 return{fmt:1,acct:a,chars,extra,profile:{nickname:CL_PROFILE&&CL_PROFILE.nickname||''},at:Date.now()}}
function importAccount(d){if(!d||!d.acct||!d.chars)throw new Error('云端存档格式错误');ST_RESET=1;GS.clear();
 GS.setItem(ACCT_KEY,JSON.stringify(d.acct));for(const id in d.chars)GS.setItem(CH_PRE+id,JSON.stringify(d.chars[id]));for(const k in d.extra||{})GS.setItem(k,d.extra[k]);ST_RESET=0;
 ACCT=null;resetRuntime();load();calc();H.life=ST.life;H.mana=ST.mana;if(!window.__NOUI&&typeof offline==='function')offline();save();if(!window.__NOUI){closeM();render()}}
function summary(d){if(!d||!d.acct)return'（空）';return d.acct.chars.map(c=>`${c.name} Lv.${(d.chars[c.id]||{}).lvl||c.lvl}`).join('、')}
// ---------- 旧本机存档（localStorage）读取 / 合并 / 删除 ----------
function legacyKeys(){const out=[];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(/^anye_(d2_|eg_rank|cloud$)/.test(k))out.push(k)}}catch(e){}return out}
function legacyRead(acctKey,pre){try{const a=JSON.parse(localStorage.getItem(acctKey));if(!a||!a.chars)return null;const chars={};for(const c of a.chars){const r=localStorage.getItem(pre+c.id);if(r)chars[c.id]=JSON.parse(r)}return{fmt:1,acct:a,chars}}catch(e){return null}}
function legacyExport(uid){let L=[];const own=uid&&legacyRead('anye_d2_acct@'+uid,'anye_d2_ch@'+uid+'_');if(own)L.push(own);const g=legacyRead('anye_d2_acct','anye_d2_ch_');if(g)L.push(g);
 if(!g){try{const o=JSON.parse(localStorage.getItem('anye_d2_v2'));if(o&&o.v===2)L.push({fmt:1,acct:{v:1,cur:1,nid:2,suid:1e9,chars:[{id:1,name:o.name||'亡灵术士',cls:'亡灵术士',lvl:o.lvl||1,t:o.last||0}],shared:[]},chars:{1:o}})}catch(e){}}
 L=L.filter(hasProgress);if(!L.length)return null;let d=L[0];for(const x of L.slice(1))d=mergeAccounts(d,x);
 try{const rk=localStorage.getItem('anye_eg_rank');if(rk)d.extra={anye_eg_rank:rk}}catch(e){}return d}
function chProg(o){return o?[o.lvl||0,o.xp||0,o.kills||0]:[0,0,0]}
function progGT(a,b){for(let i=0;i<3;i++){if(a[i]!==b[i])return a[i]>b[i]}return false}
function hasProgress(d){return!!d&&d.acct.chars.some(c=>{const o=d.chars[c.id];return o&&(o.lvl>1||o.xp||o.kills)})||!!d&&(d.acct.shared||[]).some(p=>p.length)}
function itemCount(sh){return(sh||[]).reduce((n,p)=>n+p.length,0)}
// 合并：同角色(同 id 且同名同职业)取等级/经验高者；不同角色都保留（id 冲突则重新编号）；共享仓库取物品更多者
function mergeAccounts(base,add){const r=JSON.parse(JSON.stringify(base));r.acct.nid=Math.max(r.acct.nid||1,add.acct.nid||1,...r.acct.chars.map(c=>c.id+1),...add.acct.chars.map(c=>c.id+1));
 r.acct.suid=Math.max(r.acct.suid||0,add.acct.suid||0);
 for(const c of add.acct.chars){const o=add.chars[c.id];if(!o)continue;const ex=r.acct.chars.find(x=>x.id===c.id);
  if(ex&&ex.name===c.name&&(ex.cls||'')===(c.cls||'')){const keep=r.chars[c.id];let k=keep,other=o;if(progGT(chProg(o),chProg(keep))){k=JSON.parse(JSON.stringify(o));other=keep;r.chars[c.id]=k;ex.lvl=o.lvl;ex.t=c.t}
   if(k&&other&&other.pst){if(!k.pst)k.pst=[];const ctr={n:Math.max(k.uid||0,other.uid||0)};unionPages(k.pst,other.pst,ctr,'n');k.uid=ctr.n+1}continue}
  const pl=r.acct.chars.length===1&&!hasProgress({acct:{chars:r.acct.chars},chars:r.chars});
  const nid=ex?r.acct.nid++:c.id;const oc=JSON.parse(JSON.stringify(o));oc.cid=nid;r.acct.chars.push(Object.assign({},c,{id:nid}));r.chars[nid]=oc;
  if(pl){const ph=r.acct.chars[0].id;r.acct.chars.shift();delete r.chars[ph];r.acct.cur=nid}}
 if(!r.acct.shared)r.acct.shared=[];const ctr={n:r.acct.suid||1e9};unionPages(r.acct.shared,add.acct.shared||[],ctr,'n');r.acct.suid=ctr.n+1;return r}
// 仓库并集：相同物品(内容完全一致)去重；uid 冲突但内容不同 → 重新编号后保留；按页放入，满 48 格顺延，绝不丢弃
function unionPages(dst,src,ctr,_){const seen=new Set(),uids=new Set();for(const p of dst)for(const it of p){seen.add(JSON.stringify(it));uids.add(it.uid)}
 for(const it of dst.flat())ctr.n=Math.max(ctr.n,it.uid||0);
 for(const p of src||[])for(const it0 of p||[]){const key=JSON.stringify(it0);if(seen.has(key))continue;seen.add(key);const it=JSON.parse(key);if(it.uid!=null&&uids.has(it.uid))it.uid=++ctr.n;uids.add(it.uid);
  let i=dst.findIndex(pg=>pg.length<48);if(i<0){dst.push([]);i=dst.length-1}dst[i].push(it)}}
function legacyClear(){for(const k of legacyKeys())try{localStorage.removeItem(k)}catch(e){}}
// ---------- 认证 ----------
const CL_ACCT_DOM='anye-game.local';
function clName2Email(n){return 'u'+Array.from(new TextEncoder().encode(n.toLowerCase())).map(b=>b.toString(16).padStart(2,'0')).join('')+'@'+CL_ACCT_DOM}
function clEmail2Name(e){const m=/^u([0-9a-f]+)@anye-game\.local$/i.exec(e||'');if(!m)return e||'';try{return new TextDecoder().decode(new Uint8Array(m[1].match(/../g).map(h=>parseInt(h,16))))}catch(x){return e}}
function clCheckName(n){if(!/^[A-Za-z0-9_\u4e00-\u9fff]+$/.test(n))throw new Error('账号只能包含字母、数字、下划线或中文');if([...n].length<6)throw new Error('账号至少 6 位');if(clName2Email(n).split('@')[0].length>64)throw new Error('账号过长（中文最多 21 字，英文数字最多 31 位）')}
function clAcctName(){return CU?clEmail2Name(CU.email):''}
function clFriendlyErr(e){const m=(e&&e.message)||String(e);if(/already registered|already exists/i.test(m))return '账号已存在';if(/invalid login credentials/i.test(m))return '账号或密码错误';if(/password/i.test(m)&&/6/.test(m))return '密码至少 6 位';if(/fetch|network/i.test(m))return '网络错误，请检查网络';return m}
async function clSignUp(email,pw,nick){const sb=await sbReady();if(!sb)throw new Error(CL_ERR);const{data,error}=await sb.auth.signUp({email,password:pw,options:{data:{nickname:nick,account:clEmail2Name(email)}}});if(error)throw error;
 if(!data.session){const r=await sb.auth.signInWithPassword({email,password:pw});if(r.error)throw r.error}await afterLogin(nick);return CU}
async function clSignIn(email,pw){const sb=await sbReady();if(!sb)throw new Error(CL_ERR);const{error}=await sb.auth.signInWithPassword({email,password:pw});if(error)throw error;await afterLogin();return CU}
async function clSignOut(){if(!CL.kicked){try{await flushNow()}catch(e){}if(CL.dirty&&!confirm('还有未同步到云端的进度，退出将丢失这些进度。确定退出？'))return}if(SB)await SB.auth.signOut();location.reload()}
async function afterLogin(nick){const{data}=await SB.auth.getUser();CU=data.user;
 if(nick){await SB.from('profiles').upsert({id:CU.id,nickname:nick,updated_at:new Date().toISOString()})}
 const p=await SB.from('profiles').select('nickname,created_at').eq('id',CU.id).maybeSingle();CL_PROFILE=p.data||{nickname:nick||''};
 await firstSync()}
async function fetchRemote(withData){const r=await SB.from('saves').select(withData?'data,updated_at,version':'updated_at,version').eq('user_id',CU.id).maybeSingle();if(r.error)throw r.error;return r.data}
// 登录后：云端为准；旧本机数据静默迁移
async function firstSync(){clSetState('busy');const rem=await fetchRemote(true);const leg=legacyExport(CU.id);let d=rem&&rem.data&&rem.data.acct?rem.data:null;
 if(d){CLOUD.remoteAt=rem.updated_at;CLOUD.ver=rem.version||1}else{CLOUD.remoteAt=null;CLOUD.ver=0}
 if(leg)d=d?mergeAccounts(d,leg):leg;
 if(d)importAccount(d);CL.ready=1;
 if(!rem||leg){await upload();if(leg)legacyClear()}else{legacyClear();CL.dirty=0;CLOUD.last=Date.now();clSetState('ok')}
 if(leg&&!window.__NOUI)toast('本机旧存档已迁移到云端');return rem?(leg?'merge':'down'):'up'}
// 上传（带版本检查：云端被其他设备更新 → 停止写入）
async function upload(){if(CL.kicked)return'kicked';const d=exportAccount();CL.dirty=0;const at=new Date().toISOString(),ver=(CLOUD.ver||0)+1;let r;
 try{if(CLOUD.remoteAt){// 原子条件更新：仅当云端仍是本机上次看到的版本时才写入
   r=await SB.from('saves').update({data:d,version:ver,updated_at:at}).eq('user_id',CU.id).eq('updated_at',CLOUD.remoteAt).select('updated_at,version');if(r.error)throw r.error;if(!r.data||!r.data.length){clKick();return'kicked'}}
  else{r=await SB.from('saves').insert({user_id:CU.id,data:d,version:ver,updated_at:at}).select('updated_at,version');if(r.error){if(r.error.code==='23505'){clKick();return'kicked'}throw r.error}}}
 catch(e){CL.dirty=1;throw e}
 CLOUD.remoteAt=r.data[0].updated_at;CLOUD.ver=r.data[0].version||ver;CLOUD.last=Date.now();CL.lastUp=Date.now();CL_ERR='';CL.fail=0;CL.warned=0;clSetState('ok');return'up'}
function clKick(){CL.kicked=1;CL.dirty=0;clSetState('kick');if(window.__NOUI)return;
 modal(`<div class="mtitle">已在其他设备登录</div><div class="gp"><div>该账号已在其他设备登录并更新了云存档。为避免覆盖最新进度，本设备已停止保存。</div><div class="btns c"><button class="btn gold" onclick="location.reload()">重新载入云存档</button></div></div>`)}
async function syncNow(manual){if(!CU||!SB||!CL.ready||CL.kicked)return null;if(CL_BUSY){clSyncSoon();return null}CL_BUSY=1;clSetState('busy');
 try{const r=await upload();if(manual&&!window.__NOUI&&r==='up')toast('云同步完成');return r}
 catch(e){CL.fail++;CL_ERR='同步失败：'+clFriendlyErr(e);clSetState('err');if(!window.__NOUI&&(manual||!CL.warned)){CL.warned=1;toast('网络异常，进度暂存内存并自动重试，请勿关闭页面')}
  clearTimeout(CL.retryT);CL.retryT=setTimeout(()=>syncNow(),Math.min(60000,2000*2**Math.min(5,CL.fail-1)));return null}finally{CL_BUSY=0}}
function flushNow(){save();return syncNow()}
function clSyncSoon(){if(!CL.ready)return;clearTimeout(CL._soon);CL._soon=setTimeout(flushNow,800)}
// 关页面兜底：keepalive 直接写 REST（体积 <60KB 时）
function clBeacon(){if(!CU||!CL.ready||CL.kicked)return;try{save();if(!CL.dirty)return;const d=exportAccount();const at=new Date().toISOString();const body=JSON.stringify({user_id:CU.id,data:d,version:(CLOUD.ver||0)+1,updated_at:at});
 const tok=CL.token;if(!tok||!CLOUD.remoteAt||body.length>60000){syncNow();return}
 fetch(SB_URL+'/rest/v1/saves?user_id=eq.'+CU.id+'&updated_at=eq.'+encodeURIComponent(CLOUD.remoteAt),{method:'PATCH',keepalive:true,headers:{apikey:SB_KEY,Authorization:'Bearer '+tok,'Content-Type':'application/json',Prefer:'return=minimal'},body});CLOUD.remoteAt=at;CLOUD.ver++;CL.dirty=0}catch(e){}}
// ---------- 界面 ----------
let CL_GATE=0;
function loginUI(tab){tab=tab||'in';CL_GATE=1;modal(`<div class="mtitle">暗夜挂机 · 账号</div><div class="gp login">
 <div class="stabs"><button class="${tab==='in'?'on':''}" onclick="loginUI('in')">登录</button><button class="${tab==='up'?'on':''}" onclick="loginUI('up')">注册</button></div>
 <input id="lg_em" type="text" maxlength="40" placeholder="${tab==='up'?'账号（至少6位）':'账号（至少6位）或邮箱'}" autocomplete="username"><input id="lg_pw" type="password" placeholder="密码（至少 6 位）" autocomplete="${tab==='up'?'new-password':'current-password'}">${tab==='up'?'<input id="lg_nk" maxlength="16" placeholder="昵称（可选，默认同账号）"><div class="dim">账号支持字母、数字、下划线、中文；无需邮箱，请牢记密码（无法通过邮件找回）。</div>':''}
 <div class="dim" id="lg_msg">${CL_ERR||'存档全部保存在云端，登录后即可在任意设备继续游戏。'}</div>
 <div class="btns c"><button class="btn gold" onclick="loginDo('${tab}')">${tab==='up'?'注册并登录':'登录'}</button></div></div>`)}
async function loginDo(tab){const raw=$('#lg_em').value.trim(),pw=$('#lg_pw').value;let nk=tab==='up'?$('#lg_nk').value.trim():'';const msg=$('#lg_msg');msg.textContent='请稍候…';
 try{if(!raw)throw new Error('请填写账号');if(pw.length<6)throw new Error('密码至少 6 位');let em;
  if(raw.includes('@')){if(tab==='up')throw new Error('注册请使用账号名（无需邮箱）');em=raw}else{clCheckName(raw);em=clName2Email(raw)}
  if(tab==='up'){if(!nk)nk=raw;await clSignUp(em,pw,nk)}else await clSignIn(em,pw);CL_GATE=0;closeM();toast('已登录：'+clAcctName());render()}catch(e){msg.textContent='失败：'+clFriendlyErr(e)}}
function accountPanel(){const t=CLOUD.last?new Date(CLOUD.last).toLocaleString('zh-CN'):'从未';const st={ok:'已同步',busy:'同步中',err:'离线重试',kick:'已在其他设备登录'}[CL.state]||'-';
 return CU?`<div class="gp acct"><h3>账号与云存档</h3><div class="row"><span>账号</span><b>${clAcctName()}</b></div><div class="row"><span>昵称</span><b>${(CL_PROFILE&&CL_PROFILE.nickname)||'-'}</b></div><div class="row"><span>同步状态</span><b>${st}</b></div><div class="row"><span>最后同步</span><b>${t}</b></div>${CL_ERR?`<div class="bad">${CL_ERR}</div>`:''}
 <div class="btns"><button class="btn sm gold" onclick="flushNow().then(()=>render())">立即同步</button><button class="btn sm" onclick="clSignOut()">退出登录</button></div>${chSwBtn()}<div class="dim">存档仅保存在云端：有改动时约 20 秒自动同步，切到后台、切换角色、锁定物品、掉落暗金/套装时立即同步。</div></div>`
 :`<div class="gp acct"><h3>账号与云存档</h3><div class="dim">请先登录。${CL_ERR?'<br>'+CL_ERR:''}</div><div class="btns"><button class="btn sm gold" onclick="loginUI('in')">登录 / 注册</button></div></div>`}
function chSwBtn(){return typeof charUI==='function'?`<div class="btns"><button class="btn sm gold" onclick="charUI()">🔄 切换角色（${(typeof ACCT!=='undefined'&&ACCT?ACCT.chars.length:1)} 个）</button></div>`:''}
const _cl_hero=renderHero;renderHero=function(){_cl_hero();document.querySelector('#panel').insertAdjacentHTML('beforeend',accountPanel())};
// 未登录时登录框不可关闭
const _cl_closeM=closeM;closeM=function(){if(CL_GATE&&!CU&&!window.__NOUI)return;_cl_closeM()};
// 重要事件立即同步
function clHookEvents(){for(const n of['switchChar','newChar','deleteChar','toggleLock','resetChar']){const f=window[n];if(typeof f!=='function'||f._cl)continue;const g=function(...a){const r=f.apply(this,a);clSyncSoon();return r};g._cl=1;window[n]=g;try{eval(n+'=g')}catch(e){}}
 if(typeof addBag==='function'&&!addBag._cl){const f=addBag;addBag=function(it){const r=f.apply(this,arguments);if(it&&(it.q===5||it.set))clSyncSoon();return r};addBag._cl=1}}
async function cloudBoot(){clHookEvents();const sb=await sbReady();if(!sb){loginUI('in');return}
 sb.auth.onAuthStateChange((ev,s)=>{CL.token=s&&s.access_token||null});
 try{const{data}=await sb.auth.getSession();if(data.session){CU=data.session.user;CL.token=data.session.access_token;const p=await sb.from('profiles').select('nickname').eq('id',CU.id).maybeSingle();CL_PROFILE=p.data;await firstSync();CL_GATE=0;if(!window.__NOUI){closeM();render()}}
 else loginUI('in')}catch(e){CL_ERR='云服务连接失败：'+clFriendlyErr(e);clSetState('err');CL.bootFail=(CL.bootFail||0)+1;if(!window.__NOUI){loginUI('in');setTimeout(()=>{if(!CL.ready)cloudBoot()},Math.min(60000,3000*2**CL.bootFail))}}}
if(typeof window!=='undefined'&&typeof document!=='undefined'&&document.addEventListener&&!window.__NOUI){
 window.addEventListener('load',()=>{loginUI('in');setTimeout(cloudBoot,50);setInterval(()=>{if(CL.ready&&(CL.dirty||Date.now()-CL.lastUp>60000))flushNow()},20000)});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flushNow()});window.addEventListener('pagehide',clBeacon);window.addEventListener('beforeunload',e=>{clBeacon();if(CL.dirty&&CL.state==='err'){e.preventDefault();e.returnValue=''}})}
