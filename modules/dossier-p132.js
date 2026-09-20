/* Carbonautas P165 · carregador leve
   Prioriza a interface principal da Rede e deixa gestão avançada para ocioso.
   Não altera Firebase nem VPS. */
(function(){
'use strict';
if(window.__CARBONAUTAS_P135_LOADER)return;
window.__CARBONAUTAS_P135_LOADER=true;

function load(src,id){
  return new Promise((resolve,reject)=>{
    if(document.getElementById(id)){resolve();return;}
    const s=document.createElement('script');s.id=id;s.src=src;s.async=false;s.onload=resolve;s.onerror=()=>reject(new Error('Falha ao carregar '+src));document.body.appendChild(s)
  })
}
function idle(fn){if('requestIdleCallback'in window)requestIdleCallback(fn,{timeout:900});else setTimeout(fn,220)}
(async()=>{
  try{
    await load('./modules/dossier-p133-original.js?v=P133-20260919','carbonautas-dossier-p133-original');
    await load('./p135-rede-acompanhamento.js?v=P165-20260919','carbonautas-p135-rede-acompanhamento');
    await load('./modules/rede-orientacao-p150.js?v=P165-20260919','carbonautas-rede-orientacao-p150');
    await load('./modules/rede-ui-p155.js?v=P157-20260919','carbonautas-rede-ui-p155');
    await load('./modules/rede-legenda-p158.js?v=P158-20260919','carbonautas-rede-legenda-p158');
    await load('./modules/rede-controles-p161.js?v=P165-20260919','carbonautas-rede-controles-p161');
    await load('./modules/rede-estabilidade-p163.js?v=P165-20260919','carbonautas-rede-estabilidade-p163');
    idle(()=>load('./modules/rede-pessoas-p164.js?v=P165-20260919','carbonautas-rede-pessoas-p164').catch(e=>console.error('Carbonautas gestão pessoas',e)));
  }catch(e){console.error('Carbonautas loader',e)}
})();
})();
