/* Carbonautas P173 · destaques mais compactos no celular
   - cards menores no Painel
   - reações alinhadas em uma única linha
   - mantém o emoji/tipo do destaque como está
   - deixa explícito que o destaque aceita print OU foto
   - não altera regras do Firebase nem VPS
*/
(function(){
'use strict';
if(window.__CARBONAUTAS_P173_DESTAQUES)return;
window.__CARBONAUTAS_P173_DESTAQUES=true;

const $=(s,r=document)=>r.querySelector(s);

function css(){
  if($('#p173DestaquesStyle'))return;
  const s=document.createElement('style');
  s.id='p173DestaquesStyle';
  s.textContent=`
  /* Desktop: só uma compactação leve. */
  #p117Highlights .p117-card{min-height:0!important}
  #p117Highlights .p117-visual{aspect-ratio:auto!important;height:154px!important}
  #p117Highlights .p117-placeholder{font-size:44px!important}

  /* As três reações ficam rigorosamente alinhadas. */
  #p117Highlights .p123-reactions{
    display:grid!important;
    grid-template-columns:repeat(3,minmax(0,1fr))!important;
    gap:6px!important;
    align-items:stretch!important;
    width:100%!important;
    flex-wrap:nowrap!important;
  }
  #p117Highlights .p123-react{
    width:100%!important;
    min-width:0!important;
    min-height:34px!important;
    padding:6px 6px!important;
    display:flex!important;
    align-items:center!important;
    justify-content:center!important;
    gap:4px!important;
    line-height:1!important;
    overflow:hidden!important;
  }
  #p117Highlights .p123-react .em{
    display:inline-flex!important;
    align-items:center!important;
    justify-content:center!important;
    width:18px!important;
    height:18px!important;
    flex:0 0 18px!important;
    font-size:15px!important;
    line-height:18px!important;
    vertical-align:middle!important;
  }
  #p117Highlights .p123-react .n{
    display:inline-flex!important;
    align-items:center!important;
    justify-content:center!important;
    min-width:10px!important;
    height:18px!important;
    line-height:18px!important;
  }

  /* O tipo do destaque permanece como no P117. */
  #p117Highlights .p117-cat{transform:none!important}

  /* Upload mais claro no modal. */
  #p117Overlay .p173-photo-help{font-size:10px;line-height:1.4;color:#6b8186;margin-top:5px}
  #p117Overlay .p117-drop{min-height:105px!important}
  #p117Overlay .p117-drop .hint b{font-size:12px!important}

  @media(max-width:620px){
    #p117Highlights{padding:12px 10px!important}
    #p117Highlights .p117-head{margin-bottom:9px!important}
    #p117Highlights .p117-head-actions{margin-top:8px!important}
    #p117Highlights .p117-deck{
      grid-auto-columns:minmax(238px,74%)!important;
      gap:8px!important;
      padding-bottom:7px!important;
      margin-right:-10px!important;
    }
    #p117Highlights .p117-card{
      min-height:0!important;
      border-radius:17px!important;
    }
    #p117Highlights .p117-visual{
      height:128px!important;
      min-height:128px!important;
      aspect-ratio:auto!important;
    }
    #p117Highlights .p117-visual img{object-fit:cover!important;object-position:center!important}
    #p117Highlights .p117-placeholder{font-size:38px!important}
    #p117Highlights .p117-body{
      padding:10px 10px 9px!important;
      gap:5px!important;
    }
    #p117Highlights .p117-av{width:27px!important;height:27px!important;border-radius:8px!important}
    #p117Highlights .p117-person b{font-size:10px!important}
    #p117Highlights .p117-card h3{font-size:13px!important;line-height:1.2!important}
    #p117Highlights .p117-venue{font-size:9.5px!important}
    #p117Highlights .p117-desc{font-size:9.5px!important;-webkit-line-clamp:1!important}
    #p117Highlights .p117-meta{font-size:9px!important}
    #p117Highlights .p123-reactions{gap:4px!important;padding-top:6px!important}
    #p117Highlights .p123-react{
      min-height:32px!important;
      padding:5px 3px!important;
      gap:2px!important;
      font-size:8.3px!important;
      border-radius:12px!important;
    }
    #p117Highlights .p123-react .em{width:17px!important;height:17px!important;flex-basis:17px!important;font-size:15px!important;line-height:17px!important}
    #p117Highlights .p123-react .n{font-size:8.5px!important;min-width:8px!important}
    #p117Highlights .p117-card-actions{gap:5px!important}
    #p117Highlights .p117-card-actions button,
    #p117Highlights .p117-card-actions a{padding:5px 7px!important;font-size:9px!important}
  }
  `;
  document.head.appendChild(s);
}

function patchModal(){
  const ov=$('#p117Overlay');if(!ov)return;
  const file=$('#p117File',ov),drop=$('#p117Drop',ov);if(!file||!drop)return;
  file.setAttribute('accept','image/*');
  const field=drop.closest('.p117-field');
  const label=field?.querySelector('label');
  if(label)label.textContent='Print ou foto (opcional)';
  const hint=drop.querySelector('.hint');
  if(hint&&!drop.querySelector('img'))hint.innerHTML='<b>🖼 Escolher print ou foto</b>Toque para selecionar uma imagem do celular ou computador.';
  if(field&&!field.querySelector('.p173-photo-help')){
    const help=document.createElement('div');
    help.className='p173-photo-help';
    help.textContent='Pode ser print de tela, foto do evento, certificado, artigo, prêmio ou outro registro visual.';
    drop.insertAdjacentElement('afterend',help);
  }
}

function patchVisible(){
  css();
  patchModal();
}

function boot(){
  css();
  patchModal();
  document.addEventListener('click',e=>{
    if(e.target.closest?.('[data-p117-add],[data-p117-edit]'))setTimeout(patchModal,0);
  },true);
  // O modal é criado somente no primeiro uso. Observa apenas a inclusão direta no body e se encerra quando já existe.
  if(!$('#p117Overlay')){
    const mo=new MutationObserver(()=>{
      if($('#p117Overlay')){patchModal();mo.disconnect()}
    });
    mo.observe(document.body,{childList:true});
  }
  window.addEventListener('pageshow',patchVisible,{passive:true});
  console.info('Carbonautas P173 destaques compactos carregados');
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();
