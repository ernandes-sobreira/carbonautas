/* Carbonautas P61 · edição REAL no celular (ONLYOFFICE Community) */
(function(){
'use strict';
const VERSION='P61';
function mobile61(){
  const vv=window.visualViewport?.width||9999, sw=window.screen?.width||9999;
  return Math.min(window.innerWidth||9999,vv,sw)<=900 || /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent||'');
}
function css61(){
  if(document.getElementById('p61Style'))return;
  const s=document.createElement('style');s.id='p61Style';s.textContent=`
  @media(max-width:900px){
    #onlyOfficeOverlay.open{padding:0!important;overflow:hidden!important;overscroll-behavior:none!important}
    #onlyOfficeOverlay .oo-modal{position:fixed!important;inset:0!important;width:100vw!important;max-width:100vw!important;height:100dvh!important;max-height:100dvh!important;margin:0!important;border-radius:0!important;overflow:hidden!important}
    #onlyOfficeOverlay .oo-commandbar{position:relative!important;z-index:6!important;width:100%!important;min-width:0!important;box-sizing:border-box!important;padding:6px 8px!important;overflow:hidden!important}
    #onlyOfficeOverlay .oo-command-title{display:none!important}
    #onlyOfficeOverlay .oo-command-actions{width:100%!important;display:grid!important;grid-template-columns:1.08fr .82fr .82fr!important;gap:6px!important}
    #onlyOfficeOverlay .oo-command-actions .btn{width:100%!important;min-width:0!important;height:38px!important;padding:5px 5px!important;font-size:10.5px!important;justify-content:center!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
    #onlyOfficeOverlay .oo-config-btn{display:none!important}
    #onlyOfficeOverlay .modal-b{position:relative!important;width:100%!important;min-width:0!important;max-width:100%!important;overflow:hidden!important;padding:0!important;touch-action:auto!important}
    #onlyOfficeEditor{position:absolute!important;inset:0!important;width:100%!important;min-width:0!important;max-width:100%!important;height:100%!important;overflow:hidden!important;margin:0!important;padding:0!important;transform:none!important}
    #onlyOfficeEditor iframe{position:absolute!important;inset:0!important;width:100%!important;min-width:0!important;max-width:100%!important;height:100%!important;border:0!important;margin:0!important;transform:none!important}
    #onlyOfficeOverlay .oo-statusbar{position:relative!important;z-index:6!important;min-height:33px!important;padding:6px 9px!important;font-size:10px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
  }
  `;document.head.appendChild(s);
}

/*
  P60 usou type=mobile. No ONLYOFFICE Community isso abre a interface móvel de visualização,
  sem as ferramentas de edição. P61 preserva o enquadramento mobile do Carbonautas,
  mas pede ao ONLYOFFICE a interface desktop compacta, que é editável também no telefone.
*/
function patchConfig61(){
  if(window.__p61FetchPatched)return;window.__p61FetchPatched=true;
  const previous=window.fetch.bind(window);
  window.fetch=async function(...args){
    const res=await previous(...args);
    try{
      const u=typeof args[0]==='string'?args[0]:(args[0]?.url||'');
      if(mobile61()&&res.ok&&/\/carbonautas-api\/api\/editor-config(?:-package)?\//.test(u)){
        const data=await res.clone().json();
        if(data&&data.config){
          const cfg=data.config;
          cfg.type='desktop';
          cfg.width='100%';cfg.height='100%';
          cfg.editorConfig=cfg.editorConfig||{};
          cfg.editorConfig.mode='edit';
          cfg.document=cfg.document||{};
          cfg.document.permissions=cfg.document.permissions||{};
          cfg.document.permissions.edit=true;
          cfg.document.permissions.comment=true;
          cfg.editorConfig.customization=cfg.editorConfig.customization||{};
          Object.assign(cfg.editorConfig.customization,{
            compactToolbar:true,
            toolbarNoTabs:true,
            hideRightMenu:true,
            hideLeftMenu:true,
            autosave:true,
            forcesave:true
          });
          /* impede que preferências mobile antigas voltem a forçar visualização */
          cfg.editorConfig.customization.mobile=Object.assign({},cfg.editorConfig.customization.mobile||{}, {forceView:false,standardView:true});
          cfg.editorConfig.customization.mobileForceView=false;
          const h=new Headers(res.headers);h.delete('content-length');h.delete('content-encoding');h.set('content-type','application/json; charset=utf-8');
          return new Response(JSON.stringify(data),{status:res.status,statusText:res.statusText,headers:h});
        }
      }
    }catch(e){console.warn('P61 config editável',e)}
    return res;
  };
}
function statusHint61(){
  const ov=document.getElementById('onlyOfficeOverlay');if(!ov)return;
  const mo=new MutationObserver(()=>{
    if(ov.classList.contains('open')&&mobile61()){
      const st=document.getElementById('ooStatus');
      if(st)setTimeout(()=>{if(ov.classList.contains('open'))st.textContent='Toque duas vezes no texto para posicionar o cursor. O teclado deve subir e a barra de edição fica no próprio ONLYOFFICE.'},1800);
    }
  });mo.observe(ov,{attributes:true,attributeFilter:['class']});
}
function boot61(){css61();patchConfig61();statusHint61();console.info('Carbonautas',VERSION,'ONLYOFFICE editável no celular carregado')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot61,{once:true});else boot61();
})();
