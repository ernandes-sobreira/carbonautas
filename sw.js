const CACHE='carbonautas-p88-20260918';
const BUILD='P88';
const OFFLINE_HTML='<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Carbonautas</title><body style="font-family:system-ui;padding:32px;background:#061a28;color:white"><h1>Carbonautas</h1><p>Sem conexão agora. Reconecte-se para carregar a versão mais recente.</p></body>';
const SYNC_SCRIPT='<script src="./calendar-sync-v4.js?v=P76-20260917"><\/script>';
const DURATION_SCRIPT='<script src="./calendar-duration-v1.js?v=P76-20260917"><\/script>';
const NOTIFY_SCRIPT='<script src="./notification-fix-v1.js?v=P76-20260917"><\/script>';
const UI_SCRIPT='<script src="./ui-fixes-p44.js?v=P76-20260917"><\/script>';
const ACADEMIC_SCRIPT='<script src="./academic-periods-p45.js?v=P76-20260917"><\/script>';
const CHAT_SCRIPT='<script src="./chat-whatsapp-p46.js?v=P76-20260917"><\/script>';
const PRIVATE_REPO_SCRIPT='<script src="./private-repo-p47.js?v=P76-20260917"><\/script>';
const GROUPS_SCRIPT='<script src="./panelinhas-p48.js?v=P76-20260917"><\/script>';
const TABS_SCRIPT='<script src="./tabs-stability-p50.js?v=P76-20260917"><\/script>';
const AGENDA_BADGE_SCRIPT='<script src="./agenda-badge-p51.js?v=P76-20260917"><\/script>';
const REVIEW_FLOW_SCRIPT='<script src="./review-flow-p52.js?v=P76-20260917"><\/script>';
const REPOSITORY_UI_SCRIPT='<script src="./repository-ui-p54.js?v=P76-20260917"><\/script>';
const REPOSITORY_ACTIONS_SCRIPT='<script src="./repository-actions-p55.js?v=P76-20260917"><\/script>';
const DASH_MEDALS_SCRIPT='<script src="./dashboard-medals-p56.js?v=P76-20260917"><\/script>';
const MOBILE_MEDALS_SCRIPT='<script src="./mobile-medals-p57.js?v=P76-20260917"><\/script>';
const MOBILE_RESCUE_SCRIPT='<script src="./mobile-repo-rescue-p58.js?v=P76-20260917"><\/script>';
const REPO_CHECKIN_UI_SCRIPT='<script src="./repo-checkin-ui-p59.js?v=P76-20260917"><\/script>';
const EDITOR_SAFE_SCRIPT='<script src="./editor-safe-p62.js?v=P76-20260917"><\/script>';
const REPOSITORY_CLEAN_SCRIPT='<script src="./repository-cleanup-p63.js?v=P76-20260917"><\/script>';
const REPOSITORY_PRIVATE_CHAT_SCRIPT='<script src="./repository-private-chat-p64.js?v=P76-20260917"><\/script>';
const REPOSITORY_DELETE_DEDUPE_SCRIPT='<script src="./repository-delete-dedupe-p65.js?v=P76-20260917"><\/script>';
const DASH_ACTION_SCRIPT='<script src="./dashboard-action-detail-p66.js?v=P76-20260917"><\/script>';
const DASH_TARGET_SCRIPT='<script src="./dashboard-action-target-p67.js?v=P76-20260917"><\/script>';
const DASH_CLARITY_SCRIPT='<script src="./dashboard-clarity-p68.js?v=P76-20260917"><\/script>';
const DASH_RESOLVE_SCRIPT='<script src="./dashboard-resolve-flow-p69.js?v=P76-20260917"><\/script>';
const DASH_SMART_REQUEST_SCRIPT='<script src="./dashboard-smart-request-p70.js?v=P76-20260917"><\/script>';
const DASH_CHAT_ACTION_SCRIPT='<script src="./dashboard-chat-action-p71.js?v=P76-20260917"><\/script>';
const DASH_DIRECT_CHAT_SCRIPT='<script src="./dashboard-direct-chat-p72.js?v=P76-20260917"><\/script>';
const DASH_NATIVE_CHAT_SCRIPT='<script src="./dashboard-native-chat-p73.js?v=P76-20260917"><\/script>';
const ACCESS_PASSWORD_SCRIPT='<script src="./access-password-admin-p74.js?v=P76-20260917"><\/script>';
const DASH_PANEL_CLEANUP_SCRIPT='<script src="./dashboard-panel-cleanup-p85.js?v=P85-20260917"><\/script>';
const PRODUCT_SIMPLIFY_SCRIPT='<script src="./product-simplify-notifications-p78.js?v=P78-20260917"><\/script>';
const CHAT_IMAGES_SCRIPT='<script src="./chat-images-p79.js?v=P79-20260917"><\/script>';
const GROUP_CHAT_NOTIFY_SCRIPT='<script src="./group-chat-notifications-p80.js?v=P80-20260917"><\/script>';
const PWA_MOBILE_FIX_SCRIPT='<script src="./pwa-mobile-fix-p85.js?v=P85-20260917"><\/script>';
const MOBILE_CHAT_COMPOSER_SCRIPT='<script src="./mobile-chat-composer-p85.js?v=P85-20260917"><\/script>';
const CHAT_COMPOSER_LAYOUT_SCRIPT='<script src="./chat-composer-layout-p86.js?v=P86-20260917"><\/script>';
const DASH_RENDER_STABILITY_SCRIPT='<script src="./dashboard-render-stability-p87.js?v=P87-20260917"><\/script>';
const REPOSITORY_ARCHIVE_SCRIPT='<script src="./repository-archive-p88.js?v=P88-20260918"><\/script>';

async function forceRefreshClients(){
  const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  await Promise.all(clients.map(c=>{
    try{
      const u=new URL(c.url);
      if(u.pathname.endsWith('/recovery.html')||u.pathname.endsWith('/chrome-reset.html')) return null;
      u.searchParams.set('build',BUILD);
      u.searchParams.set('swrefresh',Date.now().toString());
      return c.navigate(u.href).catch(()=>null);
    }catch(_e){return null}
  }));
}
self.addEventListener('install',event=>{self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
  await self.clients.claim();
  await forceRefreshClients();
})());});
self.addEventListener('message',event=>{
  if(event.data==='SKIP_WAITING') self.skipWaiting();
  if(event.data==='FORCE_REFRESH_ALL') event.waitUntil(forceRefreshClients());
});
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
    if(!html.includes('tabs-stability-p50.js'))inject+=TABS_SCRIPT;
    if(!html.includes('agenda-badge-p51.js'))inject+=AGENDA_BADGE_SCRIPT;
    if(!html.includes('review-flow-p52.js'))inject+=REVIEW_FLOW_SCRIPT;
    if(!html.includes('repository-ui-p54.js'))inject+=REPOSITORY_UI_SCRIPT;
    if(!html.includes('repository-actions-p55.js'))inject+=REPOSITORY_ACTIONS_SCRIPT;
    if(!html.includes('dashboard-medals-p56.js'))inject+=DASH_MEDALS_SCRIPT;
    if(!html.includes('mobile-medals-p57.js'))inject+=MOBILE_MEDALS_SCRIPT;
    if(!html.includes('mobile-repo-rescue-p58.js'))inject+=MOBILE_RESCUE_SCRIPT;
    if(!html.includes('repo-checkin-ui-p59.js'))inject+=REPO_CHECKIN_UI_SCRIPT;
    if(!html.includes('editor-safe-p62.js'))inject+=EDITOR_SAFE_SCRIPT;
    if(!html.includes('repository-cleanup-p63.js'))inject+=REPOSITORY_CLEAN_SCRIPT;
    if(!html.includes('repository-private-chat-p64.js'))inject+=REPOSITORY_PRIVATE_CHAT_SCRIPT;
    if(!html.includes('repository-delete-dedupe-p65.js'))inject+=REPOSITORY_DELETE_DEDUPE_SCRIPT;
    if(!html.includes('dashboard-action-detail-p66.js'))inject+=DASH_ACTION_SCRIPT;
    if(!html.includes('dashboard-action-target-p67.js'))inject+=DASH_TARGET_SCRIPT;
    if(!html.includes('dashboard-clarity-p68.js'))inject+=DASH_CLARITY_SCRIPT;
    if(!html.includes('dashboard-resolve-flow-p69.js'))inject+=DASH_RESOLVE_SCRIPT;
    if(!html.includes('dashboard-smart-request-p70.js'))inject+=DASH_SMART_REQUEST_SCRIPT;
    if(!html.includes('dashboard-chat-action-p71.js'))inject+=DASH_CHAT_ACTION_SCRIPT;
    if(!html.includes('dashboard-direct-chat-p72.js'))inject+=DASH_DIRECT_CHAT_SCRIPT;
    if(!html.includes('dashboard-native-chat-p73.js'))inject+=DASH_NATIVE_CHAT_SCRIPT;
    if(!html.includes('access-password-admin-p74.js'))inject+=ACCESS_PASSWORD_SCRIPT;
    if(!html.includes('dashboard-panel-cleanup-p85.js'))inject+=DASH_PANEL_CLEANUP_SCRIPT;
    if(!html.includes('product-simplify-notifications-p78.js'))inject+=PRODUCT_SIMPLIFY_SCRIPT;
    if(!html.includes('chat-images-p79.js'))inject+=CHAT_IMAGES_SCRIPT;
    if(!html.includes('group-chat-notifications-p80.js'))inject+=GROUP_CHAT_NOTIFY_SCRIPT;
    if(!html.includes('pwa-mobile-fix-p85.js'))inject+=PWA_MOBILE_FIX_SCRIPT;
    if(!html.includes('mobile-chat-composer-p85.js'))inject+=MOBILE_CHAT_COMPOSER_SCRIPT;
    if(!html.includes('chat-composer-layout-p86.js'))inject+=CHAT_COMPOSER_LAYOUT_SCRIPT;
    if(!html.includes('dashboard-render-stability-p87.js'))inject+=DASH_RENDER_STABILITY_SCRIPT;
    if(!html.includes('repository-archive-p88.js'))inject+=REPOSITORY_ARCHIVE_SCRIPT;
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