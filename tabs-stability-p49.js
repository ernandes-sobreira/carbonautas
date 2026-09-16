/* Carbonautas P49 · estabiliza destaque Fofoca geral / Panelinhas / Privadas */
(function(){
'use strict';
const ACTIVE_CLASS='p49-panelinhas-active';

function injectCss(){
  if(document.getElementById('p49TabsStyle')) return;
  const st=document.createElement('style');
  st.id='p49TabsStyle';
  st.textContent=`
    body.${ACTIVE_CLASS} #subNav [data-sub-view="mensagens"]{
      background:#fff!important;
      color:#17313d!important;
      border-color:#cfdde1!important;
      box-shadow:none!important;
    }
    body.${ACTIVE_CLASS} #subNav [data-sub-view="mensagens"].on{
      background:#fff!important;
      color:#17313d!important;
      border-color:#cfdde1!important;
      box-shadow:none!important;
    }
    body.${ACTIVE_CLASS} #subNav .p46-panel-btn,
    body.${ACTIVE_CLASS} #subNav .p46-panel-btn.on{
      background:#0d8192!important;
      color:#fff!important;
      border-color:#0d8192!important;
      box-shadow:none!important;
    }
  `;
  document.head.appendChild(st);
}

function setPanelinhasActive(on){
  document.body.classList.toggle(ACTIVE_CLASS,!!on);
}

function bind(){
  injectCss();
  document.addEventListener('click',function(e){
    const target=e.target.closest && e.target.closest('#subNav button');
    if(!target) return;
    if(target.classList.contains('p46-panel-btn')){
      setPanelinhasActive(true);
      return;
    }
    if(target.matches('[data-sub-view="mensagens"], [data-sub-view="conversas"]')){
      setPanelinhasActive(false);
    }
  },true);

  // Ao abrir/recarregar já dentro da tela de panelinhas, fixa o estado uma vez.
  setTimeout(()=>{
    if(document.body.dataset.view==='mensagens' && document.getElementById('p48GroupsRoot')){
      setPanelinhasActive(true);
    }
  },700);

  console.info('Carbonautas tabs P49 carregado');
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bind,{once:true});
else bind();
})();
