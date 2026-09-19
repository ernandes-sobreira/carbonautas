/* Carbonautas P135 · carregador seguro
   O módulo P133 original foi preservado em dossier-p133-original.js.
   Este arquivo já é carregado pelo index.html no fim da página e apenas
   encadeia o dossiê original + a correção auditada Rede/Acompanhamento. */
(function(){
'use strict';
if(window.__CARBONAUTAS_P135_LOADER)return;
window.__CARBONAUTAS_P135_LOADER=true;

function load(src,id){
  return new Promise((resolve,reject)=>{
    if(document.getElementById(id)){resolve();return;}
    const s=document.createElement('script');
    s.id=id;s.src=src;s.async=false;
    s.onload=resolve;
    s.onerror=()=>reject(new Error('Falha ao carregar '+src));
    document.body.appendChild(s);
  });
}

(async()=>{
  try{
    await load('./modules/dossier-p133-original.js?v=P133-20260919','carbonautas-dossier-p133-original');
    await load('./p135-rede-acompanhamento.js?v=P135-20260919','carbonautas-p135-rede-acompanhamento');
  }catch(e){console.error('Carbonautas P135 loader',e)}
})();
})();
