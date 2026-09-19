/* Carbonautas · service worker P134
   Só faz cache de recursos e página offline. Não recarrega abas ao ativar; a atualização acontece na próxima abertura.
   Não injeta scripts no HTML: todas as camadas estão dentro do index.html. */
const CACHE='carbonautas-p134-20260919';
const OFFLINE_HTML='<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Carbonautas</title><body style="font-family:system-ui;padding:32px;background:#f6faf9;color:#183844"><h1>Carbonautas</h1><p>Sem conexão agora. Reconecte-se para carregar a versão mais recente.</p></body>';

self.addEventListener('install',()=>{self.skipWaiting();});

self.addEventListener('activate',event=>{event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
  await self.clients.claim();
})());});

self.addEventListener('message',event=>{
  if(event.data==='SKIP_WAITING')self.skipWaiting();
});

async function networkFirstHtml(req){
  try{
    const fresh=await fetch(req,{cache:'no-store'});
    if(fresh&&fresh.ok){const c=await caches.open(CACHE);c.put(req,fresh.clone());}
    return fresh;
  }catch(_e){
    const cached=await caches.match(req);
    if(cached)return cached;
    return new Response(OFFLINE_HTML,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
  }
}

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;
  if(req.mode==='navigate'||url.pathname.endsWith('.html')||url.pathname.endsWith('/')){
    event.respondWith(networkFirstHtml(req));
    return;
  }
  event.respondWith((async()=>{
    try{
      const fresh=await fetch(req,{cache:'reload'});
      if(fresh&&fresh.ok){const c=await caches.open(CACHE);c.put(req,fresh.clone());}
      return fresh;
    }catch(e){
      const cached=await caches.match(req);
      if(cached)return cached;
      throw e;
    }
  })());
});
