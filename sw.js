/* Carbonautas · service worker P221
   - estabiliza a URL antes dos patches legados (P85/P86/P87/P96/P97)
   - remove parametros diagnosticos build/apprefresh/pwa da barra de endereco
   - nao ativa um worker novo no meio da sessao; atualiza na proxima abertura
   - mantem cache de recursos e pagina offline
*/
const CACHE='carbonautas-url-stable-20260925a';
const OFFLINE_HTML='<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Carbonautas</title><body style="font-family:system-ui;padding:32px;background:#f6faf9;color:#183844"><h1>Carbonautas</h1><p>Sem conexao agora. Reconecte-se para carregar a versao mais recente.</p></body>';

const URL_STABILITY_BOOT=`<script id="carbonautas-url-stability">(function(){
  if(window.__CARBONAUTAS_URL_STABILITY)return;
  window.__CARBONAUTAS_URL_STABILITY=true;
  var DROP={build:1,apprefresh:1,pwa:1};
  var nativeReplace=history.replaceState.bind(history);
  var nativePush=history.pushState.bind(history);
  function clean(input){
    try{
      var u=new URL(input==null?location.href:input,location.href);
      Object.keys(DROP).forEach(function(k){u.searchParams.delete(k)});
      return u.href;
    }catch(_e){return input}
  }
  try{
    var first=clean(location.href);
    if(first&&first!==location.href)nativeReplace(history.state,'',first);
  }catch(_e){}
  history.replaceState=function(state,title,url){
    if(url==null)return nativeReplace(state,title,url);
    var next=clean(url);
    if(next===location.href&&state===null)return;
    return nativeReplace(state,title,next);
  };
  history.pushState=function(state,title,url){
    if(url==null)return nativePush(state,title,url);
    return nativePush(state,title,clean(url));
  };
})();</script>`;

function injectUrlStability(html=''){
  if(!html||html.includes('id="carbonautas-url-stability"'))return html;
  const head=/<head(?:\s[^>]*)?>/i;
  if(head.test(html))return html.replace(head,m=>m+URL_STABILITY_BOOT);
  return URL_STABILITY_BOOT+html;
}

async function stableHtmlResponse(res){
  const text=await res.text();
  const headers={};
  try{res.headers?.forEach?.((v,k)=>{if(String(k).toLowerCase()!=='content-length')headers[k]=v})}catch(_e){}
  headers['content-type']=headers['content-type']||'text/html; charset=utf-8';
  headers['cache-control']='no-store';
  return new Response(injectUrlStability(text),{status:res.status,statusText:res.statusText,headers});
}

/* Nao usamos skipWaiting. O P85 legado tenta mandar SKIP_WAITING ao worker
   em espera; sem handler a mensagem e ignorada e nao ha controllerchange/reload. */
self.addEventListener('install',()=>{});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k.startsWith('carbonautas-')&&k!==CACHE).map(k=>caches.delete(k)));
  await self.clients.claim();
})());});

async function networkFirstHtml(req){
  try{
    const fresh=await fetch(req,{cache:'no-store'});
    if(fresh&&fresh.ok){
      const stable=await stableHtmlResponse(fresh);
      const c=await caches.open(CACHE);await c.put(req,stable.clone());
      return stable;
    }
    return fresh;
  }catch(_e){
    const cached=await (await caches.open(CACHE)).match(req);
    if(cached)return cached;
    return new Response(injectUrlStability(OFFLINE_HTML),{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
  }
}

self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;
  const url=new URL(req.url);if(url.origin!==self.location.origin)return;
  if(req.mode==='navigate'||url.pathname.endsWith('.html')||url.pathname.endsWith('/')){event.respondWith(networkFirstHtml(req));return;}
  event.respondWith((async()=>{
    try{const fresh=await fetch(req,{cache:'reload'});if(fresh&&fresh.ok){const c=await caches.open(CACHE);await c.put(req,fresh.clone());}return fresh;}
    catch(e){const cached=await (await caches.open(CACHE)).match(req);if(cached)return cached;throw e;}
  })());
});
