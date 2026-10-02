/* Carbonautas · service worker de estabilidade
   Regra: nunca reescrever HTML, nunca injetar scripts, nunca servir cache antigo
   e nunca tomar o controle da sessão à força.
*/
self.addEventListener('install',()=>{});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(
      keys
        .filter(key=>key.startsWith('carbonautas-'))
        .map(key=>caches.delete(key))
    );
  })());
});

/* Mantido apenas para compatibilidade de instalação/PWA.
   Sem respondWith: navegador usa a rede normalmente. */
self.addEventListener('fetch',()=>{});
