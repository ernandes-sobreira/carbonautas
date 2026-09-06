const CACHE='carbonautas-predator-p6-20260906';
const OFFLINE_HTML='<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Carbonautas</title><body style="font-family:system-ui;padding:32px;background:#061a28;color:white"><h1>Carbonautas</h1><p>Sem conexão agora. Reconecte-se para carregar a versão mais recente.</p></body>';
self.addEventListener('install',event=>{self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();})());});
self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin!==self.location.origin)return;
  if(req.mode==='navigate'||url.pathname.endsWith('/index.html')||url.pathname.endsWith('/carbonautas/')){event.respondWith((async()=>{try{return await fetch(req,{cache:'no-store'});}catch(e){return new Response(OFFLINE_HTML,{headers:{'Content-Type':'text/html; charset=utf-8'}});}})());return;}
  event.respondWith((async()=>{try{const fresh=await fetch(req,{cache:'no-cache'});if(fresh&&fresh.ok){const c=await caches.open(CACHE);c.put(req,fresh.clone());}return fresh;}catch(e){const cached=await caches.match(req);if(cached)return cached;throw e;}})());
});
