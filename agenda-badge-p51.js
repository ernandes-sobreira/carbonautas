/* Carbonautas P51 · remove contador confuso da aba Agenda */
(function(){
'use strict';
function apply(){
  document.querySelectorAll('#cronoBadge').forEach(b=>{
    b.textContent='';
    b.style.setProperty('display','none','important');
    b.setAttribute('aria-hidden','true');
  });
}
function inject(){
  if(document.getElementById('p51AgendaBadgeStyle'))return;
  const st=document.createElement('style');
  st.id='p51AgendaBadgeStyle';
  st.textContent='#cronoBadge{display:none!important}';
  document.head.appendChild(st);
}
function loadP116(){
  if(document.getElementById('carbonautasP116Script'))return;
  const s=document.createElement('script');
  s.id='carbonautasP116Script';
  s.src='./chat-notifications-reactions-p116.js?v=P116-20260918';
  s.async=false;
  document.head.appendChild(s);
}
function boot(){inject();apply();loadP116();setTimeout(apply,300);setTimeout(apply,1200);console.info('Carbonautas agenda badge P51 + P116 carregado')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
