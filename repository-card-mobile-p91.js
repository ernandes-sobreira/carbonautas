/* Carbonautas P101 · Ajuste mobile + tema + pastas/baralho + conversas estáveis + privadas compactas + voltar mobile + ZAP dinâmico */
(function(){
'use strict';
const BUILD='P101';
function inject(){
  if(document.getElementById('p91MobileDeckStyle'))return;
  const st=document.createElement('style');
  st.id='p91MobileDeckStyle';
  st.textContent=`
  @media(max-width:680px){
    #p90Deck{padding:6px 6px calc(6px + env(safe-area-inset-bottom))!important;place-items:stretch!important;align-items:stretch!important;overflow:hidden!important}
    #p90Deck .p90-table{width:calc(100vw - 12px)!important;max-width:calc(100vw - 12px)!important;height:calc(100dvh - 12px - env(safe-area-inset-bottom))!important;max-height:none!important;margin:0!important;border-radius:22px!important;overflow:hidden!important;display:flex!important;flex-direction:column!important}
    #p90Deck .p90-head{flex:0 0 auto!important;position:relative!important;z-index:5!important;grid-template-columns:auto minmax(0,1fr) auto!important;padding:9px 9px!important;gap:8px!important;border-radius:22px 22px 0 0!important}
    #p90Deck .p90-title{min-width:0!important;overflow:hidden!important}
    #p90Deck .p90-title b{white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;max-width:100%!important}
    #p90Deck .p90-stage-wrap{flex:1 1 auto!important;min-height:0!important;max-height:none!important;height:auto!important;overflow-y:auto!important;overflow-x:hidden!important;padding:12px 8px 14px!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior:contain!important}
    #p90Deck .p90-stage{width:100%!important;min-width:0!important;min-height:0!important;display:block!important}
    #p90Deck .p90-card-shell{width:100%!important;min-width:0!important;max-width:100%!important;overflow:hidden!important;box-sizing:border-box!important}
    #p90Deck .p90-card-shell>.pub-row,#p90Deck .p90-card-shell>.repo-package-card{width:100%!important;min-width:0!important;max-width:100%!important;box-sizing:border-box!important;overflow:hidden!important;border-radius:18px!important}
    #p90Deck .p90-card-shell .pub-body,#p90Deck .p90-card-shell .pub-main,#p90Deck .p90-card-shell .pub-info,#p90Deck .p90-card-shell .repo-package-body,#p90Deck .p90-card-shell [class*="history"],#p90Deck .p90-card-shell [class*="History"]{min-width:0!important;max-width:100%!important;width:100%!important;box-sizing:border-box!important;overflow-x:hidden!important}
    #p90Deck .p90-card-shell .pub-t,#p90Deck .p90-card-shell .repo-package-title,#p90Deck .p90-card-shell h1,#p90Deck .p90-card-shell h2,#p90Deck .p90-card-shell h3,#p90Deck .p90-card-shell p,#p90Deck .p90-card-shell small{max-width:100%!important;overflow-wrap:anywhere!important;word-break:normal!important;white-space:normal!important}
    #p90Deck .p90-card-shell .pub-act,#p90Deck .p90-card-shell .repo-package-actions{display:grid!important;grid-template-columns:1fr!important;gap:8px!important;width:100%!important;max-width:100%!important;padding-left:0!important;padding-right:0!important;box-sizing:border-box!important}
    #p90Deck .p90-card-shell .pub-act>* ,#p90Deck .p90-card-shell .repo-package-actions>*{width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;justify-content:center!important;white-space:normal!important}
    #p90Deck .p90-card-shell table{width:100%!important;max-width:100%!important;table-layout:fixed!important}
    #p90Deck .p90-card-shell img,#p90Deck .p90-card-shell video,#p90Deck .p90-card-shell canvas{max-width:100%!important;height:auto!important}
    #p90Deck .p90-nav{flex:0 0 auto!important;position:relative!important;z-index:6!important;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr)!important;gap:6px!important;padding:8px 8px calc(8px + env(safe-area-inset-bottom))!important;border-radius:0 0 22px 22px!important;background:rgba(255,255,255,.98)!important;box-shadow:0 -8px 24px rgba(15,49,60,.06)!important}
    #p90Deck .p90-nav button{width:100%!important;min-width:0!important;height:44px!important;padding:0 8px!important;font-size:11px!important;white-space:nowrap!important}
    #p90Deck .p90-count{min-width:64px!important;max-width:76px!important}
    #p90Deck .p90-count small{font-size:7px!important;max-width:76px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
    #p90Deck .p90-count b{font-size:12px!important}
    #p90Deck .p90-table:before{inset:9px 12px -8px!important}#p90Deck .p90-table:after{inset:5px 7px -4px!important}
  }
  `;
  document.head.appendChild(st);
}
function loadSoftStyle(){
  if(document.querySelector('script[data-carbonautas-p92]')||document.getElementById('p92SoftStyle'))return;
  const s=document.createElement('script');s.src='./repository-soft-style-p92.js?v=P92-20260918';s.async=false;s.dataset.carbonautasP92='1';document.head.appendChild(s);
}
function loadGlobalTheme(){
  if(document.querySelector('script[data-carbonautas-p97-theme]')||document.body?.classList.contains('carbonautas-p96-names'))return;
  const s=document.createElement('script');s.src='./carbonautas-soft-theme-p93.js?v=P97-20260918';s.async=false;s.dataset.carbonautasP97Theme='1';document.head.appendChild(s);
}
function loadTrackingDeck(){
  if(document.querySelector('script[data-carbonautas-p97-track]')||document.getElementById('p97Style'))return;
  const s=document.createElement('script');s.src='./tracking-folders-p97.js?v=P97-20260918';s.async=false;s.dataset.carbonautasP97Track='1';document.head.appendChild(s);
}
function loadChatStability(){
  if(document.querySelector('script[data-carbonautas-p98-chat]')||document.getElementById('p98ChatStableStyle'))return;
  const s=document.createElement('script');s.src='./chat-stability-p98.js?v=P98-20260918';s.async=false;s.dataset.carbonautasP98Chat='1';document.head.appendChild(s);
}
function loadPrivateCompact(){
  if(document.querySelector('script[data-carbonautas-p99-private]')||document.getElementById('p99PrivateCompactStyle'))return;
  const s=document.createElement('script');s.src='./private-empty-compact-p99.js?v=P99-20260918';s.async=false;s.dataset.carbonautasP99Private='1';document.head.appendChild(s);
}
function loadMobileBack(){
  if(document.querySelector('script[data-carbonautas-p100-back]')||document.getElementById('p100ChatBackStyle'))return;
  const s=document.createElement('script');s.src='./chat-mobile-back-p100.js?v=P100-20260918';s.async=false;s.dataset.carbonautasP100Back='1';document.head.appendChild(s);
}
function loadZapDelight(){
  if(document.querySelector('script[data-carbonautas-p101-zap]')||document.getElementById('p101ZapStyle'))return;
  const s=document.createElement('script');s.src='./chat-zap-delight-p101.js?v=P101-20260918';s.async=false;s.dataset.carbonautasP101Zap='1';document.head.appendChild(s);
}
function boot(){
  inject();loadSoftStyle();loadGlobalTheme();loadTrackingDeck();loadChatStability();loadPrivateCompact();loadMobileBack();loadZapDelight();
  try{const u=new URL(location.href);if(u.searchParams.get('build')!==BUILD){u.searchParams.set('build',BUILD);u.searchParams.delete('pwa');history.replaceState(null,'',u.href)}}catch(_e){}
  window.CARBONAUTAS_RUNTIME_BUILD=BUILD;console.info('Carbonautas P101 acompanhamento + conversas + ZAP dinâmico carregado');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
