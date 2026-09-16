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
function boot(){inject();apply();setTimeout(apply,300);setTimeout(apply,1200);console.info('Carbonautas agenda badge P51 carregado')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
