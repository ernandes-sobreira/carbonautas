/* Carbonautas · service worker P222
   - estabiliza a URL
   - injeta abertura direta do Arquivo Vivo no card inicial
   - mantém cache/offline
*/
const CACHE='carbonautas-url-stable-20261001b';
const OFFLINE_HTML='<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Carbonautas</title><body style="font-family:system-ui;padding:32px;background:#f6faf9;color:#183844"><h1>Carbonautas</h1><p>Sem conexao agora. Reconecte-se para carregar a versao mais recente.</p></body>';

const URL_STABILITY_BOOT=`<script id="carbonautas-url-stability">(function(){
  if(window.__CARBONAUTAS_URL_STABILITY)return;
  window.__CARBONAUTAS_URL_STABILITY=true;
  var DROP={build:1,apprefresh:1,pwa:1};
  var nativeReplace=history.replaceState.bind(history);
  var nativePush=history.pushState.bind(history);
  function clean(input){
    try{var u=new URL(input==null?location.href:input,location.href);Object.keys(DROP).forEach(function(k){u.searchParams.delete(k)});return u.href;}catch(_e){return input}
  }
  try{var first=clean(location.href);if(first&&first!==location.href)nativeReplace(history.state,'',first);}catch(_e){}
  history.replaceState=function(state,title,url){if(url==null)return nativeReplace(state,title,url);var next=clean(url);if(next===location.href&&state===null)return;return nativeReplace(state,title,next)};
  history.pushState=function(state,title,url){if(url==null)return nativePush(state,title,url);return nativePush(state,title,clean(url))};
})();</script>`;

const DIRECT_FILE_BOOT=`<script id="carbonautas-direct-file-open">(function(){
  if(window.__CARBONAUTAS_DIRECT_FILE_OPEN)return;
  window.__CARBONAUTAS_DIRECT_FILE_OPEN=true;
  function norm(v){return String(v||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().replace(/\\s+/g,' ').trim()}
  function pubs(){try{return (window.CarbonautasApp&&window.CarbonautasApp.state&&window.CarbonautasApp.state.publicacoes)||window.state&&window.state.publicacoes||[]}catch(_e){return[]}}
  function findCard(btn){var el=btn;for(var i=0;el&&i<9;i++,el=el.parentElement){var t=String(el.innerText||el.textContent||'');if(/Arquivo\\s*:/i.test(t)&&(/AÇÃO SUA/i.test(t)||/CORREÇÃO/i.test(t)||/Manuscrito corrigido/i.test(t)))return el}return null}
  function newest(list){return list.slice().sort(function(a,b){return Number(b.reviewVersion||b.onlineEditVersion||1)-Number(a.reviewVersion||a.onlineEditVersion||1)})[0]||null}
  function findPub(card){
    var text=String(card.innerText||card.textContent||'').replace(/\\s+/g,' ').trim();
    var m=text.match(/Arquivo:\\s*([^|]+?)(?=\\s+(?:1\\s+de\\s+\\d+|deslize|Dispensar|Abrir|$))/i);
    var file=m&&m[1]?norm(m[1]):'';
    var all=pubs();
    if(file){var exact=all.filter(function(p){return norm(p.fileName)===file});if(exact.length)return newest(exact)}
    var title='';var h=card.querySelector&&card.querySelector('h1,h2,h3,h4,strong');if(h)title=norm(h.textContent);
    if(title){var byTitle=all.filter(function(p){return norm(p.titulo)===title||norm(p.reviewBaseTitle)===title});if(byTitle.length)return newest(byTitle)}
    if(file){var loose=all.filter(function(p){var f=norm(p.fileName);return f&&(f.indexOf(file)>=0||file.indexOf(f)>=0)});if(loose.length)return newest(loose)}
    return null;
  }
  document.addEventListener('click',function(e){
    var btn=e.target&&e.target.closest&&e.target.closest('button,a,[role="button"]');
    if(!btn||norm(btn.textContent)!=='abrir')return;
    var card=findCard(btn);if(!card)return;
    var pub=findPub(card);if(!pub||!pub.id)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    try{if(typeof window.switchView==='function')window.switchView('pubs')}catch(_e){}
    setTimeout(function(){try{if(window.CarbonautasRepository&&typeof window.CarbonautasRepository.openDeck==='function')window.CarbonautasRepository.openDeck(String(pub.id));else if(typeof window.openReviewConversation==='function')window.openReviewConversation(pub.id)}catch(err){console.warn('Abertura direta do arquivo',err)}},180);
  },true);
})();</script>`;

function injectBoot(html=''){
  if(!html)return html;
  var boot='';
  if(!html.includes('id="carbonautas-url-stability"'))boot+=URL_STABILITY_BOOT;
  if(!html.includes('id="carbonautas-direct-file-open"'))boot+=DIRECT_FILE_BOOT;
  if(!boot)return html;
  const head=/<head(?:\\s[^>]*)?>/i;
  if(head.test(html))return html.replace(head,m=>m+boot);
  return boot+html;
}

async function stableHtmlResponse(res){
  const text=await res.text();const headers={};
  try{res.headers&&res.headers.forEach&&res.headers.forEach((v,k)=>{if(String(k).toLowerCase()!=='content-length')headers[k]=v})}catch(_e){}
  headers['content-type']=headers['content-type']||'text/html; charset=utf-8';headers['cache-control']='no-store';
  return new Response(injectBoot(text),{status:res.status,statusText:res.statusText,headers});
}

self.addEventListener('install',event=>{event.waitUntil(Promise.resolve())});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('carbonautas-')&&k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();})())});

async function networkFirstHtml(req){
  try{const fresh=await fetch(req,{cache:'no-store'});if(fresh&&fresh.ok){const stable=await stableHtmlResponse(fresh);const c=await caches.open(CACHE);await c.put(req,stable.clone());return stable}return fresh}
  catch(_e){const cached=await (await caches.open(CACHE)).match(req);if(cached)return cached;return new Response(injectBoot(OFFLINE_HTML),{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}})}
}

self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;
  const url=new URL(req.url);if(url.origin!==self.location.origin)return;
  if(req.mode==='navigate'||url.pathname.endsWith('.html')||url.pathname.endsWith('/')){event.respondWith(networkFirstHtml(req));return}
  event.respondWith((async()=>{try{const fresh=await fetch(req,{cache:'reload'});if(fresh&&fresh.ok){const c=await caches.open(CACHE);await c.put(req,fresh.clone())}return fresh}catch(e){const cached=await (await caches.open(CACHE)).match(req);if(cached)return cached;throw e}})());
});
