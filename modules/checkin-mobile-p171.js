/* Carbonautas P171 · check-in diário seguro no celular
   Evita tela inteira borrada quando o card do check-in não é renderizado pelo navegador móvel.
   No celular o aviso vira um card flutuante, sem backdrop-filter, e nunca bloqueia a interface.
*/
(function(){
'use strict';
if(window.__CARBONAUTAS_P171_CHECKIN_MOBILE)return;
window.__CARBONAUTAS_P171_CHECKIN_MOBILE=true;

const MOBILE='(max-width: 760px)';
function mobile(){return window.matchMedia?.(MOBILE)?.matches ?? window.innerWidth<=760}

function css(){
  if(document.getElementById('p171CheckinMobileStyle'))return;
  const s=document.createElement('style');
  s.id='p171CheckinMobileStyle';
  s.textContent=`
  @media(max-width:760px){
    .p59-checkin-backdrop{
      position:fixed!important;
      inset:0!important;
      z-index:2147483600!important;
      display:flex!important;
      align-items:flex-start!important;
      justify-content:center!important;
      padding:calc(env(safe-area-inset-top,0px) + 12px) 10px calc(env(safe-area-inset-bottom,0px) + 12px)!important;
      background:transparent!important;
      -webkit-backdrop-filter:none!important;
      backdrop-filter:none!important;
      pointer-events:none!important;
      overflow:visible!important;
      animation:none!important;
    }
    .p59-checkin-card{
      display:block!important;
      visibility:visible!important;
      opacity:1!important;
      position:relative!important;
      z-index:1!important;
      width:min(520px,100%)!important;
      max-width:calc(100vw - 20px)!important;
      max-height:calc(100dvh - env(safe-area-inset-top,0px) - env(safe-area-inset-bottom,0px) - 24px)!important;
      overflow:auto!important;
      pointer-events:auto!important;
      margin:0!important;
      transform:none!important;
      animation:p171CheckinIn .24s ease-out!important;
      border-radius:20px!important;
      box-shadow:0 14px 42px rgba(2,24,34,.32)!important;
      -webkit-transform:translateZ(0)!important;
    }
    .p59-checkin-title{font-size:clamp(23px,7vw,30px)!important;line-height:1.02!important;padding-right:34px!important}
    .p59-checkin-main{grid-template-columns:54px minmax(0,1fr)!important;gap:11px!important}
    .p59-checkin-icon{width:54px!important;height:54px!important;border-radius:16px!important;font-size:27px!important}
    .p59-checkin-ok{display:grid!important;grid-template-columns:1fr!important;gap:2px!important;margin-top:13px!important}
    .p59-checkin-close{position:absolute!important;right:9px!important;top:9px!important;width:38px!important;height:38px!important;z-index:4!important}
  }
  @keyframes p171CheckinIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:none}}
  `;
  document.head.appendChild(s);
}

function removeOrphan(el){
  if(!el?.isConnected)return;
  const card=el.querySelector('.p59-checkin-card');
  if(card)return false;
  el.remove();
  return true;
}

function hardFix(el){
  if(!el||el.dataset.p171Fixed)return;
  el.dataset.p171Fixed='1';
  if(removeOrphan(el))return;
  if(!mobile())return;
  const card=el.querySelector('.p59-checkin-card');
  // Android/WebView pode falhar ao compor backdrop-filter + z-index muito alto.
  // Estes estilos inline são uma segunda proteção além do CSS acima.
  Object.assign(el.style,{
    background:'transparent',
    backdropFilter:'none',
    webkitBackdropFilter:'none',
    pointerEvents:'none',
    display:'flex',
    alignItems:'flex-start',
    justifyContent:'center'
  });
  Object.assign(card.style,{
    display:'block',
    visibility:'visible',
    opacity:'1',
    position:'relative',
    zIndex:'1',
    pointerEvents:'auto',
    transform:'translateZ(0)'
  });
  requestAnimationFrame(()=>{
    if(!card.isConnected)return;
    const r=card.getBoundingClientRect();
    const bad=r.width<120||r.height<70||r.bottom<0||r.top>window.innerHeight;
    if(bad){
      card.style.cssText+=';display:block!important;visibility:visible!important;opacity:1!important;position:fixed!important;left:10px!important;right:10px!important;top:calc(env(safe-area-inset-top,0px) + 10px)!important;width:auto!important;max-width:none!important;max-height:calc(100dvh - 20px)!important;overflow:auto!important;z-index:2147483646!important;transform:none!important;';
    }
  });
  // Mesmo que algum bug de composição volte a acontecer, o app nunca fica bloqueado.
  setTimeout(()=>{if(el.isConnected)el.remove()},7500);
}

function scan(){
  document.querySelectorAll('.p59-checkin-backdrop').forEach(hardFix);
}

function boot(){
  css();
  scan();
  const mo=new MutationObserver(ms=>{
    for(const m of ms){
      for(const n of m.addedNodes){
        if(!(n instanceof Element))continue;
        if(n.matches?.('.p59-checkin-backdrop'))hardFix(n);
        n.querySelectorAll?.('.p59-checkin-backdrop').forEach(hardFix);
      }
      for(const n of m.removedNodes){
        if(!(n instanceof Element))continue;
        // se o card sumiu mas o fundo ficou, limpa imediatamente
        if(n.matches?.('.p59-checkin-card'))scan();
      }
    }
  });
  mo.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('pageshow',scan,{passive:true});
  window.addEventListener('orientationchange',()=>setTimeout(scan,80),{passive:true});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();
