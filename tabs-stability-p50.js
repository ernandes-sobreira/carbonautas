/* Carbonautas P127 · estado correto das abas de conversa.
   Corrige o bug em que "Conversas em panelinha" permanecia verde ao abrir Privadas.
   A aba ativa passa a seguir a tela REAL aberta, e não apenas a existência de DOM escondido. */
(function(){
'use strict';
if(window.__CARBONAUTAS_TABS_P127)return;
window.__CARBONAUTAS_TABS_P127=true;
const BUILD='P127';
let queued=false;

function installStyle(){
  let st=document.getElementById('p50TabsStyle');
  if(!st){st=document.createElement('style');st.id='p50TabsStyle';document.head.appendChild(st)}
  st.textContent=`
    #subNav button{transition:none!important;animation:none!important;}

    /* padrão: qualquer botão não ativo fica branco */
    #subNav [data-sub-view="mensagens"],
    #subNav .p46-panel-btn,
    #subNav [data-sub-view="conversas"]{
      background:#fff!important;
      color:#17313d!important;
      border-color:#cfdde1!important;
      box-shadow:none!important;
      transform:none!important;
    }

    /* somente a classe ON recebe o verde */
    #subNav [data-sub-view="mensagens"].on,
    #subNav .p46-panel-btn.on,
    #subNav [data-sub-view="conversas"].on{
      background:#0d8192!important;
      color:#fff!important;
      border-color:#0d8192!important;
      box-shadow:none!important;
      transform:none!important;
    }

    /* trava de segurança: em Privadas, SOMENTE Privadas pode ficar verde */
    body[data-view="conversas"] #subNav [data-sub-view="mensagens"],
    body[data-view="conversas"] #subNav .p46-panel-btn{
      background:#fff!important;color:#17313d!important;border-color:#cfdde1!important;
    }
    body[data-view="conversas"] #subNav [data-sub-view="conversas"]{
      background:#0d8192!important;color:#fff!important;border-color:#0d8192!important;
    }
  `;
}

function isPanelinhaMounted(){
  const root=document.querySelector('#viewMensagens #p48GroupsRoot');
  if(!root)return false;
  /* Só vale como panelinha ativa quando a própria view de mensagens está ativa. */
  return document.body.dataset.view==='mensagens';
}

function syncTabs(){
  const nav=document.getElementById('subNav');
  if(!nav)return;
  const gen=nav.querySelector('[data-sub-view="mensagens"]');
  const pan=nav.querySelector('.p46-panel-btn');
  const priv=nav.querySelector('[data-sub-view="conversas"]');
  if(!gen&&!pan&&!priv)return;

  const view=document.body.dataset.view||'';
  if(view==='conversas'){
    gen?.classList.remove('on');
    pan?.classList.remove('on');
    priv?.classList.add('on');
    return;
  }
  if(view==='mensagens'){
    priv?.classList.remove('on');
    if(isPanelinhaMounted()){
      gen?.classList.remove('on');
      pan?.classList.add('on');
    }else{
      pan?.classList.remove('on');
      gen?.classList.add('on');
    }
  }
}

function scheduleSync(){
  if(queued)return;queued=true;
  requestAnimationFrame(()=>{queued=false;syncTabs()});
}

function bindClicks(){
  if(document.documentElement.dataset.p127TabsBound==='1')return;
  document.documentElement.dataset.p127TabsBound='1';
  document.addEventListener('click',e=>{
    if(!e.target.closest?.('#subNav button'))return;
    setTimeout(syncTabs,0);
    setTimeout(syncTabs,35);
  },true);
}

function boot(){
  installStyle();bindClicks();syncTabs();
  const nav=document.getElementById('subNav');
  if(nav&&!nav.dataset.p127Observed){
    nav.dataset.p127Observed='1';
    new MutationObserver(scheduleSync).observe(nav,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  }
  const body=document.body;
  if(body&&!body.dataset.p127ViewObserved){
    body.dataset.p127ViewObserved='1';
    new MutationObserver(scheduleSync).observe(body,{attributes:true,attributeFilter:['data-view']});
  }
  const vm=document.getElementById('viewMensagens');
  if(vm&&!vm.dataset.p127Observed){
    vm.dataset.p127Observed='1';
    new MutationObserver(scheduleSync).observe(vm,{childList:true,subtree:false});
  }
  setInterval(syncTabs,1200);
  window.CARBONAUTAS_TABS_BUILD=BUILD;
  console.info('Carbonautas P127 · abas Geral / Panelinha / Privadas sincronizadas');
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
