/* Carbonautas P120 · Agenda mobile: compromisso inteiro, sem corte. Somente layout. */
(function(){
'use strict';
const ID='p120AgendaMobileFit';
function install(){
  if(document.getElementById(ID)) return;
  const st=document.createElement('style');
  st.id=ID;
  st.textContent=`
    @media (max-width: 680px){
      /* bloco do dia selecionado */
      #viewCrono .ag-daylist{
        display:block!important;
        width:100%!important;
        max-width:100%!important;
        min-width:0!important;
        margin:14px 0 0!important;
        padding:0 0 22px!important;
        overflow:visible!important;
        box-sizing:border-box!important;
      }
      #viewCrono .ag-daylist>h4{
        position:static!important;
        display:block!important;
        width:100%!important;
        max-width:100%!important;
        margin:0 0 8px!important;
        padding:0 2px!important;
        box-sizing:border-box!important;
        white-space:normal!important;
        overflow:visible!important;
      }
      #viewCrono .p110-subtitle{
        display:block!important;
        width:100%!important;
        max-width:100%!important;
        margin:0 0 12px!important;
        padding:0 3px!important;
        box-sizing:border-box!important;
        white-space:normal!important;
        writing-mode:horizontal-tb!important;
        text-orientation:mixed!important;
        line-height:1.35!important;
      }

      /* um compromisso inteiro por vez */
      #viewCrono .p110-event-track{
        display:flex!important;
        width:100%!important;
        max-width:100%!important;
        min-width:0!important;
        gap:12px!important;
        margin:0!important;
        padding:12px 2px 20px!important;
        box-sizing:border-box!important;
        overflow-x:auto!important;
        overflow-y:visible!important;
        scroll-padding-inline:2px!important;
        scroll-snap-type:x mandatory!important;
        overscroll-behavior-x:contain!important;
        touch-action:pan-x pan-y!important;
      }
      #viewCrono .p110-event-card,
      #viewCrono .p110-empty-card{
        flex:0 0 calc(100% - 4px)!important;
        width:calc(100% - 4px)!important;
        min-width:calc(100% - 4px)!important;
        max-width:calc(100% - 4px)!important;
        margin:0!important;
        box-sizing:border-box!important;
        scroll-snap-align:center!important;
      }
      #viewCrono .p110-event-card.ag-item{
        grid-template-columns:50px minmax(0,1fr)!important;
        gap:11px 10px!important;
        padding:16px 14px!important;
        overflow:visible!important;
      }
      #viewCrono .p110-event-card .ag-time{
        width:50px!important;
        min-width:50px!important;
        max-width:50px!important;
      }
      #viewCrono .p110-event-card .ag-main{
        min-width:0!important;
        width:100%!important;
        overflow:visible!important;
      }
      #viewCrono .p110-event-card .ag-t,
      #viewCrono .p110-event-card .ag-desc,
      #viewCrono .p110-event-card .ag-who{
        max-width:100%!important;
        overflow-wrap:anywhere!important;
        word-break:normal!important;
      }
      #viewCrono .p110-event-card .ag-act{
        width:100%!important;
        max-width:100%!important;
        flex-wrap:wrap!important;
        justify-content:flex-end!important;
      }
      #viewCrono .p110-event-nav{
        position:static!important;
        width:100%!important;
        max-width:100%!important;
        margin:0!important;
        padding:0 2px 4px!important;
        box-sizing:border-box!important;
        display:flex!important;
        align-items:center!important;
        justify-content:space-between!important;
      }
      #viewCrono .p110-event-index{
        flex:1!important;
        min-width:0!important;
        text-align:center!important;
      }
      #viewCrono .ag-empty,
      #viewCrono .p110-empty-card{
        min-height:170px!important;
        padding:24px 18px!important;
      }
    }

    @media (max-width: 390px){
      #viewCrono .p110-event-card.ag-item{
        grid-template-columns:44px minmax(0,1fr)!important;
        padding:14px 12px!important;
        gap:10px 9px!important;
      }
      #viewCrono .p110-event-card .ag-time{
        width:44px!important;
        min-width:44px!important;
        max-width:44px!important;
        font-size:10px!important;
      }
    }
  `;
  document.head.appendChild(st);
  window.CARBONAUTAS_AGENDA_MOBILE_FIT_BUILD='P120';
  console.info('Carbonautas P120 · cards da agenda ajustados no celular');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
