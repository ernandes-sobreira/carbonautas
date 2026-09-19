/* Carbonautas P155 · carregador seguro
   Mantém o núcleo da Rede, aplica orientação real e acabamento visual isolado. */
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
    await load('./modules/rede-orientacao-p150.js?v=P151-20260919','carbonautas-rede-orientacao-p150');
    await load('./modules/rede-orientacao-rede-p154.js?v=P154-20260919','carbonautas-rede-orientacao-rede-p154');
    await load('./modules/rede-ui-p155.js?v=P155-20260919','carbonautas-rede-ui-p155');
  }catch(e){console.error('Carbonautas loader',e)}
})();
})();
