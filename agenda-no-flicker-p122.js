/* Carbonautas P122 · Agenda sem flicker.
   P114 continua sendo o único controlador de navegação/swipe.
   Neutraliza apenas o esconder/revelar da P121. */
(function(){
'use strict';
const BUILD='P122';
const STYLE_ID='p122AgendaNoFlickerStyle';

function installStyle(){
  if(document.getElementById(STYLE_ID))return;
  const st=document.createElement('style');
  st.id=STYLE_ID;
  st.textContent=`
    html body #viewCrono[data-p114-mode] .ag-month,
    html body #viewCrono[data-p114-mode="day"] .ag-month,
    html body #viewCrono[data-p114-mode="day"] .ag-month:not([data-p121-positioned="1"]),
    html body #viewCrono[data-p114-mode="day"] .ag-month[data-p121-positioned="1"]{
      opacity:1!important;
      visibility:visible!important;
      pointer-events:auto!important;
      transition:none!important;
    }
    #viewCrono .ag-month{
      opacity:1!important;
      visibility:visible!important;
      transition:none!important;
    }
    #viewCrono .ag-day{
      animation:none!important;
    }
    #viewCrono .ag-day.sel{
      animation:none!important;
    }
  `;
  document.head.appendChild(st);
}

function neutralizeP121(root=document){
  const tracks=[];
  if(root?.matches?.('#viewCrono .ag-month'))tracks.push(root);
  if(root?.querySelectorAll)tracks.push(...root.querySelectorAll('#viewCrono .ag-month'));
  tracks.forEach(track=>{
    /* P114 já posiciona o dia selecionado. Impede a P121 de esconder/recentrar novamente. */
    track.dataset.p121Positioned='1';
    track.style.removeProperty('opacity');
    track.style.removeProperty('visibility');
  });
}

function boot(){
  installStyle();
  neutralizeP121();
  const body=document.getElementById('agBody');
  if(!body){setTimeout(boot,180);return}
  if(body.dataset.p122Observed==='1')return;
  body.dataset.p122Observed='1';
  const ob=new MutationObserver(muts=>{
    for(const m of muts){
      for(const n of m.addedNodes||[]){
        if(n.nodeType===1)neutralizeP121(n);
      }
    }
  });
  ob.observe(body,{childList:true,subtree:true});
  window.CARBONAUTAS_AGENDA_NO_FLICKER_BUILD=BUILD;
  console.info('Carbonautas P122 · trilho da agenda sempre visível; P121 neutralizada');
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
