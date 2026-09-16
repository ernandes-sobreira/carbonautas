const CACHE='carbonautas-p48-20260916';
const OFFLINE_HTML='<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Carbonautas</title><body style="font-family:system-ui;padding:32px;background:#061a28;color:white"><h1>Carbonautas</h1><p>Sem conexão agora. Reconecte-se para carregar a versão mais recente.</p></body>';
const SYNC_SCRIPT='<script src="./calendar-sync-v4.js?v=P48-20260916"><\/script>';
const DURATION_SCRIPT='<script src="./calendar-duration-v1.js?v=P48-20260916"><\/script>';
const NOTIFY_SCRIPT='<script src="./notification-fix-v1.js?v=P48-20260916"><\/script>';
const UI_SCRIPT='<script src="./ui-fixes-p44.js?v=P48-20260916"><\/script>';
const ACADEMIC_SCRIPT='<script src="./academic-periods-p45.js?v=P48-20260916"><\/script>';
const CHAT_SCRIPT='<script src="./chat-whatsapp-p46.js?v=P48-20260916"><\/script>';
const PRIVATE_REPO_SCRIPT='<script src="./private-repo-p47.js?v=P48-20260916"><\/script>';
const GROUPS_SCRIPT='<script src="./panelinhas-p48.js?v=P48-20260916"><\/script>';
self.addEventListener('install',event=>{self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();})());});
self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting();});
async function plainFresh(req){try{return await fetch(req,{cache:'no-store'})}catch(e){return new Response(OFFLINE_HTML,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}})}}
async function navigationResponse(req){
  try{
    const fresh=await fetch(req,{cache:'no-store'});
    if(!fresh.ok)return fresh;
    const type=fresh.headers.get('content-type')||'';
    if(!type.includes('text/html'))return fresh;
    let html=await fresh.text(),inject='';
    if(!html.includes('calendar-duration-v1.js'))inject+=DURATION_SCRIPT;
    if(!html.includes('calendar-sync-v4.js'))inject+=SYNC_SCRIPT;
    if(!html.includes('notification-fix-v1.js'))inject+=NOTIFY_SCRIPT;
    if(!html.includes('ui-fixes-p44.js'))inject+=UI_SCRIPT;
    if(!html.includes('academic-periods-p45.js'))inject+=ACADEMIC_SCRIPT;
    if(!html.includes('chat-whatsapp-p46.js'))inject+=CHAT_SCRIPT;
    if(!html.includes('private-repo-p47.js'))inject+=PRIVATE_REPO_SCRIPT;
    if(!html.includes('panelinhas-p48.js'))inject+=GROUPS_SCRIPT;
    if(inject){const lower=html.toLowerCase(),pos=lower.lastIndexOf('</body>');html=pos>=0?html.slice(0,pos)+inject+html.slice(pos):html+inject;}
    const headers=new Headers(fresh.headers);headers.delete('content-length');headers.set('cache-control','no-store, max-age=0');
    return new Response(html,{status:fresh.status,statusText:fresh.statusText,headers});
  }catch(e){return new Response(OFFLINE_HTML,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});}
}
self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin!==self.location.origin)return;
  if(req.mode==='navigate'){
    if(url.pathname.endsWith('/recovery.html')||url.pathname.endsWith('/chrome-reset.html')){event.respondWith(plainFresh(req));return;}
    event.respondWith(navigationResponse(req));return;
  }
  if(url.pathname.endsWith('/index.html')||url.pathname.endsWith('/carbonautas/')){event.respondWith(navigationResponse(req));return;}
  event.respondWith((async()=>{try{const fresh=await fetch(req,{cache:'reload'});if(fresh&&fresh.ok){const c=await caches.open(CACHE);c.put(req,fresh.clone());}return fresh;}catch(e){const cached=await caches.match(req);if(cached)return cached;throw e;}})());
});
