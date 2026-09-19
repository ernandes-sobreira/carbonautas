/* Carbonautas P125 · Agenda realmente estável.
   P114 é o único controlador de navegação/swipe.
   Bloqueia ANTES do DOMContentLoaded o observer/recentramento visual do P121,
   preservando apenas os recursos de mídia (print/link) dos compromissos. */
(function(){
'use strict';
const BUILD='P125';
const STYLE_ID='p122AgendaNoFlickerStyle';
const LEGACY_STYLE_ID='p121AgendaStableStyle';

const SAFE_MEDIA_CSS=`
  /* P121 continua podendo oferecer mídia, mas NÃO controla visibilidade/posição da agenda. */
  #viewCrono .p121-media{display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin-top:10px}
  #viewCrono .p121-thumb{width:74px;height:52px;border:0;border-radius:12px;padding:0;overflow:hidden;background:#eef6f4;box-shadow:0 4px 12px rgba(25,66,69,.08)}
  #viewCrono .p121-thumb img{width:100%;height:100%;object-fit:cover;display:block}
  #viewCrono .p121-link{display:inline-flex;align-items:center;gap:5px;min-height:34px;padding:7px 10px;border:1px solid #d8e6e3;border-radius:11px;background:#fff;color:#176e6a;text-decoration:none;font-size:11px;font-weight:850}
  #eventOverlay .p121-upload{border:1.5px dashed #b8d5d0;border-radius:15px;background:#f7fbfa;min-height:108px;padding:12px;display:grid;place-items:center;text-align:center;cursor:pointer;overflow:hidden}
  #eventOverlay .p121-upload img{max-width:100%;max-height:190px;border-radius:10px;object-fit:contain}
  #eventOverlay .p121-upload b{display:block;color:#2d5a60;margin-bottom:4px}
  #eventOverlay .p121-upload small{color:#71868b;line-height:1.4}
  #eventOverlay .p121-media-actions{display:flex;gap:7px;margin-top:7px;flex-wrap:wrap}
  #eventOverlay .p121-media-actions button{border:1px solid #d6e3e1;background:#fff;border-radius:10px;padding:7px 10px;font-weight:750;color:#365d63}
  #p121ImageOverlay{position:fixed;inset:0;z-index:2147483646;background:rgba(6,25,31,.82);display:none;align-items:center;justify-content:center;padding:18px}
  #p121ImageOverlay.open{display:flex}
  #p121ImageOverlay .p121-viewer{width:min(960px,100%);max-height:94dvh;background:#fff;border-radius:20px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 30px 90px rgba(0,0,0,.34)}
  #p121ImageOverlay .p121-viewer-head{display:flex;align-items:center;gap:10px;padding:11px 13px;border-bottom:1px solid #e4eceb;color:#284d54;font-weight:850}
  #p121ImageOverlay .p121-viewer-head span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #p121ImageOverlay .p121-viewer-head button{width:38px;height:38px;border:0;border-radius:11px;background:#eef4f3;font-size:22px;color:#35545a}
  #p121ImageOverlay .p121-viewer-body{padding:12px;overflow:auto;display:grid;place-items:center;background:#f5f9f8}
  #p121ImageOverlay img{max-width:100%;max-height:78dvh;border-radius:12px;object-fit:contain}
  @media(max-width:640px){#eventOverlay .p121-upload{min-height:92px}.p121-media-actions{font-size:11px}#viewCrono .p121-thumb{width:68px;height:48px}}
`;

function installSafeLegacyStyle(){
  let st=document.getElementById(LEGACY_STYLE_ID);
  if(!st){st=document.createElement('style');st.id=LEGACY_STYLE_ID;document.head.appendChild(st)}
  /* Se o P121 já colocou opacity:0, substitui todo o CSS dele por uma versão sem controle visual do calendário. */
  if(st.textContent!==SAFE_MEDIA_CSS)st.textContent=SAFE_MEDIA_CSS;
}

function installNoFlickerStyle(){
  let st=document.getElementById(STYLE_ID);
  if(!st){st=document.createElement('style');st.id=STYLE_ID;document.head.appendChild(st)}
  st.textContent=`
    html body #viewCrono .ag-month,
    html body #viewCrono[data-p114-mode] .ag-month,
    html body #viewCrono[data-p114-mode="day"] .ag-month,
    html body #viewCrono[data-p114-mode="day"] .ag-month:not([data-p121-positioned="1"]),
    html body #viewCrono[data-p114-mode="day"] .ag-month[data-p121-positioned="1"]{
      opacity:1!important;
      visibility:visible!important;
      pointer-events:auto!important;
      transition:none!important;
      animation:none!important;
    }
    #viewCrono .ag-day,#viewCrono .ag-day.sel{animation:none!important}
  `;
}

function disableLegacyController(){
  const body=document.getElementById('agBody');
  if(body){
    /* P121 verifica exatamente esta flag antes de instalar seu MutationObserver. */
    body.dataset.p121Observed='1';
  }
}

function neutralizeTrack(root=document){
  const tracks=[];
  if(root?.matches?.('#viewCrono .ag-month'))tracks.push(root);
  if(root?.querySelectorAll)tracks.push(...root.querySelectorAll('#viewCrono .ag-month'));
  tracks.forEach(track=>{
    /* positionTrack() do P121 retorna imediatamente quando esta flag já existe. */
    track.dataset.p121Positioned='1';
    track.style.removeProperty('opacity');
    track.style.removeProperty('visibility');
    track.style.removeProperty('transition');
  });
}

function preemptP121(){
  installSafeLegacyStyle();
  installNoFlickerStyle();
  disableLegacyController();
  neutralizeTrack();
}

/* CRÍTICO: executa AGORA, enquanto os scripts ainda estão sendo parseados.
   O P121 foi carregado antes deste arquivo, mas seu boot aguarda DOMContentLoaded.
   Assim chegamos primeiro e impedimos que ele instale o controller antigo. */
preemptP121();

let observed=false;
function boot(){
  preemptP121();
  const body=document.getElementById('agBody');
  if(!body){setTimeout(boot,80);return}
  if(observed)return;observed=true;
  const ob=new MutationObserver(muts=>{
    let changed=false;
    for(const m of muts){
      for(const n of m.addedNodes||[]){if(n.nodeType===1){neutralizeTrack(n);changed=true}}
    }
    if(changed)disableLegacyController();
  });
  ob.observe(body,{childList:true,subtree:true});
  window.CARBONAUTAS_AGENDA_NO_FLICKER_BUILD=BUILD;
  console.info('Carbonautas P125 · P121 impedido de esconder/recentralizar a Agenda');
}

/* Também observa cedo o aparecimento do agBody/trilho, antes dos callbacks de render. */
const early=new MutationObserver(()=>{disableLegacyController();neutralizeTrack()});
early.observe(document.documentElement,{childList:true,subtree:true});
setTimeout(()=>{try{early.disconnect()}catch(_e){}},2500);

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
