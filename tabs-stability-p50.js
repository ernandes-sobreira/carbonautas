/* Carbonautas P50 · elimina definitivamente o pisca-pisca das abas */
(function(){
'use strict';

function install(){
  if(document.getElementById('p50TabsStyle')) return;
  const st=document.createElement('style');
  st.id='p50TabsStyle';
  st.textContent=`
    #subNav button{transition:none!important;animation:none!important;}

    body:has(#p48GroupsRoot) #subNav [data-sub-view="mensagens"],
    body:has(#p48GroupsRoot) #subNav [data-sub-view="mensagens"].on{
      background:#fff!important;
      color:#17313d!important;
      border-color:#cfdde1!important;
      box-shadow:none!important;
      transform:none!important;
    }

    body:has(#p48GroupsRoot) #subNav .p46-panel-btn,
    body:has(#p48GroupsRoot) #subNav .p46-panel-btn.on{
      background:#0d8192!important;
      color:#fff!important;
      border-color:#0d8192!important;
      box-shadow:none!important;
      transform:none!important;
    }

    body:has(#p48GroupsRoot) #subNav [data-sub-view="conversas"],
    body:has(#p48GroupsRoot) #subNav [data-sub-view="conversas"].on{
      background:#fff!important;
      color:#17313d!important;
      border-color:#cfdde1!important;
      box-shadow:none!important;
      transform:none!important;
    }
  `;
  document.head.appendChild(st);

  // O P46 antigo reaplica classes a cada 900 ms. Em vez de disputar classes,
  // a P50 trava o visual pelo conteúdo realmente montado na tela (#p48GroupsRoot).
  console.info('Carbonautas tabs P50 carregado');
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true});
else install();
})();
