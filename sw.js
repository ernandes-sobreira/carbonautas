/* Carbonautas · service worker passivo 2026-10-02
   Estabilidade primeiro:
   - não intercepta navegação nem assets;
   - não serve HTML/cache;
   - não injeta scripts;
   - não chama skipWaiting nem clients.claim;
   - remove caches legados do Carbonautas na ativação.
*/
self.addEventListener('install',()=>{});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(
      keys.filter(k=>k.startsWith('carbonautas-')).map(k=>caches.delete(k))
    );
  })());
});

self.addEventListener('fetch',()=>{});
