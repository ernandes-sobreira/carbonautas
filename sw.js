const CACHE='carbonautas-p36-20260915';
const OFFLINE_HTML='<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Carbonautas</title><body style="font-family:system-ui;padding:32px;background:#061a28;color:white"><h1>Carbonautas</h1><p>Sem conexão agora. Reconecte-se para carregar a versão mais recente.</p></body>';
const SYNC_SCRIPT='<script src="./calendar-sync-v2.js?v=P36-20260915"><\/script>';
const DURATION_SCRIPT='<script src="./calendar-duration-v1.js?v=P36-20260915"><\/script>';
const FIX_SCRIPT='<script src="./calendar-sync-v3.js?v=P36-20260915"><\/script>';
self.addEventListener('install',event=>{self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();})());});
self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting();});
async function navigationResponse(req){
  try{
    const fresh=await fetch(req,{cache:'no-store'});
    if(!fresh.ok)return fresh;
    const type=fresh.headers.get('content-type')||'';
    if(!type.includes('text/html'))return fresh;
    let html=await fresh.text(),inject='';
    if(!html.includes('calendar-sync-v2.js'))inject+=SYNC_SCRIPT;
    if(!html.includes('calendar-duration-v1.js'))inject+=DURATION_SCRIPT;
    if(!html.includes('calendar-sync-v3.js'))inject+=FIX_SCRIPT;
    if(inject){const lower=html.toLowerCase(),pos=lower.lastIndexOf('</body>');html=pos>=0?html.slice(0,pos)+inject+html.slice(pos):html+inject;}
    const headers=new Headers(fresh.headers);headers.delete('content-length');headers.set('cache-control','no-store, max-age=0');
    return new Response(html,{status:fresh.status,statusText:fresh.statusText,headers});
  }catch(e){return new Response(OFFLINE_HTML,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});}
}
self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin!==self.location.origin)return;
  if(req.mode==='navigate'||url.pathname.endsWith('/index.html')||url.pathname.endsWith('/carbonautas/')){event.respondWith(navigationResponse(req));return;}
  event.respondWith((async()=>{try{const fresh=await fetch(req,{cache:'reload'});if(fresh&&fresh.ok){const c=await caches.open(CACHE);c.put(req,fresh.clone());}return fresh;}catch(e){const cached=await caches.match(req);if(cached)return cached;throw e;}})());
});
