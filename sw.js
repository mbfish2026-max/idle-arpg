/* 静态资源缓存；index.html 网络优先；从不缓存 supabase / 跨域请求 */
var V='anye-20261018y';
self.addEventListener('install',function(){self.skipWaiting()});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==V}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('fetch',function(e){
  var r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin||/supabase/i.test(r.url))return;
  var isDoc=r.mode==='navigate'||/\/(index\.html)?$/.test(u.pathname);
  if(isDoc){e.respondWith(fetch(r).then(function(res){var c=res.clone();caches.open(V).then(function(ca){ca.put(r,c)});return res}).catch(function(){return caches.match(r)}));return}
  e.respondWith(caches.match(r).then(function(hit){return hit||fetch(r).then(function(res){if(res.ok){var c=res.clone();caches.open(V).then(function(ca){ca.put(r,c)})}return res})}));
});
