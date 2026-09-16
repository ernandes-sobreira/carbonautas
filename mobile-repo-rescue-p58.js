/* Carbonautas P58 · resgate do Repositório no app/celular */
(function(){
'use strict';
const VERSION='P58';

function mobile58(){
  const vv=window.visualViewport?.width||9999;
  const sw=window.screen?.width||9999;
  return Math.min(window.innerWidth||9999,vv,sw)<=900;
}
function imp(el,prop,val){if(el)el.style.setProperty(prop,val,'important')}

function css58(){
  if(document.getElementById('p58MobileRepoStyle'))return;
  const s=document.createElement('style');
  s.id='p58MobileRepoStyle';
  s.textContent=`
  @media(max-width:900px){
    #viewPubs .pub-row{
      display:block!important;position:relative!important;
      width:100%!important;min-width:0!important;max-width:100%!important;
      height:auto!important;min-height:0!important;max-height:none!important;
      overflow:visible!important;padding:12px 10px 12px 20px!important;
      margin:0 0 10px!important;box-sizing:border-box!important;
    }
    #viewPubs .pub-cat{
      position:absolute!important;left:8px!important;top:10px!important;bottom:10px!important;
      width:5px!important;min-width:5px!important;max-width:5px!important;
      height:auto!important;min-height:0!important;margin:0!important;display:block!important;
    }
    #viewPubs .pub-body{
      display:block!important;float:none!important;position:static!important;
      width:100%!important;min-width:0!important;max-width:100%!important;
      height:auto!important;min-height:0!important;max-height:none!important;
      flex:none!important;padding:0!important;margin:0!important;overflow:visible!important;
    }
    #viewPubs .pub-t{
      display:block!important;width:100%!important;min-width:0!important;max-width:100%!important;
      white-space:normal!important;word-break:normal!important;overflow-wrap:anywhere!important;
      overflow:visible!important;text-overflow:clip!important;
      font-size:14px!important;line-height:1.3!important;letter-spacing:0!important;
      writing-mode:horizontal-tb!important;text-orientation:mixed!important;
    }
    #viewPubs .pub-meta{
      display:flex!important;width:100%!important;min-width:0!important;max-width:100%!important;
      flex-wrap:wrap!important;gap:5px 7px!important;align-items:center!important;
      margin-top:6px!important;font-size:10.5px!important;line-height:1.3!important;
    }
    #viewPubs .pub-body>*{max-width:100%!important;min-width:0!important;box-sizing:border-box!important}
    #viewPubs .review-note,#viewPubs .repo-sequence,#viewPubs .repo-seq,
    #viewPubs .p52-review-flow,#viewPubs .scientific-context,#viewPubs .p54-history{
      display:block!important;width:100%!important;min-width:0!important;max-width:100%!important;
      height:auto!important;min-height:0!important;max-height:none!important;
      overflow:hidden!important;white-space:normal!important;overflow-wrap:anywhere!important;
    }
    #viewPubs .p54-history{margin:10px 0 0!important}
    #viewPubs .p54-head{display:none!important}
    #viewPubs .p54-row{
      display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;
      grid-template-rows:auto auto auto!important;gap:3px 8px!important;
      width:100%!important;min-width:0!important;max-width:100%!important;
      height:auto!important;min-height:0!important;padding:8px 9px!important;
    }
    #viewPubs .p54-date{grid-column:1!important;grid-row:1!important;font-size:10px!important}
    #viewPubs .p54-version{grid-column:2!important;grid-row:1!important;justify-self:end!important}
    #viewPubs .p54-person{grid-column:1/-1!important;grid-row:2!important;min-width:0!important}
    #viewPubs .p54-person b{white-space:normal!important;overflow-wrap:anywhere!important}
    #viewPubs .p54-action-text{grid-column:1/-1!important;grid-row:3!important;padding-left:0!important;white-space:normal!important}
    #viewPubs .p54-next{display:block!important;width:100%!important;height:auto!important;min-height:0!important}
    #viewPubs .p54-next b{display:block!important;margin-bottom:3px!important}

    #viewPubs .pub-act,#viewPubs .pub-act.p55-actions-grid{
      display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;
      grid-auto-flow:row!important;grid-auto-rows:40px!important;
      gap:6px!important;position:static!important;float:none!important;inset:auto!important;
      transform:none!important;width:100%!important;min-width:0!important;max-width:100%!important;
      height:auto!important;min-height:0!important;max-height:none!important;
      padding:0!important;margin:10px 0 0!important;align-items:stretch!important;justify-content:stretch!important;
    }
    #viewPubs .pub-act button:not(.mini-x),#viewPubs .pub-act a,
    #viewPubs .p55-actions-grid button:not(.mini-x),#viewPubs .p55-actions-grid a{
      width:100%!important;min-width:0!important;max-width:100%!important;
      height:40px!important;min-height:40px!important;max-height:40px!important;
      margin:0!important;padding:0 7px!important;border-radius:9px!important;
      display:flex!important;align-items:center!important;justify-content:center!important;
      font-size:10.5px!important;line-height:1!important;white-space:nowrap!important;
      overflow:hidden!important;text-overflow:ellipsis!important;box-sizing:border-box!important;
    }
    #viewPubs .pub-act .mini-x,#viewPubs .pub-act .p55-close{
      grid-column:2!important;justify-self:end!important;
      width:40px!important;min-width:40px!important;max-width:40px!important;
      height:40px!important;min-height:40px!important;max-height:40px!important;
      margin:0!important;padding:0!important;position:static!important;
    }
  }
  `;
  document.head.appendChild(s);
}

function repair58(){
  if(!mobile58())return;
  document.querySelectorAll('#viewPubs .pub-row').forEach(card=>{
    imp(card,'display','block');imp(card,'position','relative');imp(card,'width','100%');imp(card,'min-width','0');imp(card,'max-width','100%');imp(card,'height','auto');imp(card,'min-height','0');imp(card,'max-height','none');imp(card,'overflow','visible');
    const cat=card.querySelector('.pub-cat');
    if(cat){imp(cat,'position','absolute');imp(cat,'left','8px');imp(cat,'top','10px');imp(cat,'bottom','10px');imp(cat,'width','5px');imp(cat,'height','auto');}
    const body=card.querySelector('.pub-body');
    if(body){imp(body,'display','block');imp(body,'width','100%');imp(body,'min-width','0');imp(body,'max-width','100%');imp(body,'height','auto');imp(body,'min-height','0');imp(body,'flex','none');imp(body,'margin','0');}
    const title=card.querySelector('.pub-t');
    if(title){imp(title,'display','block');imp(title,'width','100%');imp(title,'min-width','0');imp(title,'max-width','100%');imp(title,'white-space','normal');imp(title,'word-break','normal');imp(title,'overflow-wrap','anywhere');imp(title,'writing-mode','horizontal-tb');}
    const act=card.querySelector('.pub-act');
    if(act){imp(act,'position','static');imp(act,'display','grid');imp(act,'grid-template-columns','repeat(2,minmax(0,1fr))');imp(act,'width','100%');imp(act,'min-width','0');imp(act,'max-width','100%');imp(act,'height','auto');imp(act,'min-height','0');imp(act,'padding','0');imp(act,'margin','10px 0 0');imp(act,'transform','none');}
    card.querySelectorAll('.p54-history,.review-note,.repo-sequence,.repo-seq,.p52-review-flow,.scientific-context').forEach(el=>{imp(el,'width','100%');imp(el,'min-width','0');imp(el,'max-width','100%');imp(el,'height','auto');imp(el,'min-height','0');});
  });
}
function boot58(){
  css58();repair58();
  // Sem MutationObserver: reaplica de forma leve porque o app recria os cartões.
  setInterval(repair58,900);
  window.addEventListener('resize',repair58,{passive:true});
  window.visualViewport?.addEventListener('resize',repair58,{passive:true});
  console.info('Carbonautas mobile repository rescue',VERSION,'carregado');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot58,{once:true});else boot58();
})();
