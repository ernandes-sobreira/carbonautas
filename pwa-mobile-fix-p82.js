/* Carbonautas P82 · PWA auto-update + mobile product fixes */
(function(){
'use strict';
const BUILD='P82';
let reloading=false;

function ensureStyle(){
  if(document.getElementById('p82Style')) return;
  const st=document.createElement('style');
  st.id='p82Style';
  st.textContent=`
    .tab[data-view="lab"],.app-nav-card[data-app-view="lab"]{display:none!important}
    #p78TodayCard{scroll-margin-top:18px}
    @media(max-width:920px){
      #p78TodayCard{margin-top:12px!important;margin-bottom:12px!important}
    }
  `;
  document.head.appendChild(st);
}

function relocateTodayCard(){
  const hero=document.querySelector('#viewPainel .dash-hero');
  const card=document.getElementById('p78TodayCard');
  if(!hero||!card) return false;
  if(hero.nextElementSibling!==card) hero.insertAdjacentElement('afterend',card);
  return true;
}

function keepProductLayout(){
  ensureStyle();
  relocateTodayCard();
  const labMobile=document.querySelector('.app-nav-card[data-app-view="lab"]');
  if(labMobile) labMobile.style.display='none';
}

async function activateWaiting(reg){
  try{
    if(reg?.waiting) reg.waiting.postMessage('SKIP_WAITING');
  }catch(_e){}
}

async function checkUpdate(){
  if(!('serviceWorker' in navigator)) return;
  try{
    const reg=await navigator.serviceWorker.getRegistration('./');
    if(!reg) return;
    await reg.update();
    await activateWaiting(reg);
  }catch(e){ console.warn('P82 update check',e); }
}

if('serviceWorker' in navigator){
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(reloading) return;
    reloading=true;
    const u=new URL(location.href);
    u.searchParams.set('build',BUILD);
    u.searchParams.set('apprefresh',Date.now().toString());
    location.replace(u.href);
  });
  window.addEventListener('focus',checkUpdate);
  document.addEventListener('visibilitychange',()=>{ if(!document.hidden) checkUpdate(); });
  setTimeout(checkUpdate,1200);
}

const obs=new MutationObserver(()=>keepProductLayout());
obs.observe(document.documentElement,{childList:true,subtree:true});
keepProductLayout();
setTimeout(keepProductLayout,500);
setTimeout(keepProductLayout,1500);
window.CARBONAUTAS_RUNTIME_BUILD=BUILD;
console.info('Carbonautas P82 mobile/PWA fix carregado');
})();
