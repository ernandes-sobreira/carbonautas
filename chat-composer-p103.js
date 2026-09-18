/* Carbonautas P103 · área de escrita maior + controles compactos no mobile */
(function(){
'use strict';
const VERSION='P103';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
function css(){
  if($('#p103ComposerStyle'))return;
  const s=document.createElement('style');s.id='p103ComposerStyle';s.textContent=`
  @media(max-width:760px){
    /* Fofoca geral: utilidades pequenas em cima, escrita grande embaixo */
    .p46-compose{padding:8px!important}
    .p46-compose-row{display:grid!important;grid-template-columns:auto 30px 30px minmax(0,1fr) 48px!important;grid-template-areas:'topic sticker clip spacer spacer' 'input input input input send'!important;gap:5px 6px!important;align-items:end!important;width:100%!important;min-width:0!important}
    .p46-topic-select{grid-area:topic!important;width:auto!important;min-width:0!important;max-width:96px!important;height:30px!important;min-height:30px!important;padding:2px 9px!important;border-radius:999px!important;background:#eef8f7!important;border-color:#cfe6e2!important;font-size:10.5px!important;font-weight:800!important;color:#1c6670!important}
    #p101GeneralSticker{grid-area:sticker!important;width:30px!important;height:30px!important;min-width:30px!important;max-width:30px!important;min-height:30px!important;border-radius:10px!important;font-size:14px!important}
    #p79GeneralClip{grid-area:clip!important;width:30px!important;height:30px!important;min-width:30px!important;max-width:30px!important;min-height:30px!important;border-radius:10px!important;font-size:15px!important}
    #p46Input{grid-area:input!important;width:100%!important;min-width:0!important;height:64px!important;min-height:64px!important;max-height:144px!important;padding:15px 14px!important;font-size:16px!important;line-height:1.35!important;border-radius:16px!important;background:#fff!important;color:#17313d!important;caret-color:#168f94!important}
    #p46Send{grid-area:send!important;width:48px!important;height:64px!important;min-width:48px!important;max-width:48px!important;min-height:64px!important;border-radius:15px!important}

    /* Privadas: emoji/figurinha/clipe discretos, texto dominante */
    .private-composer{display:grid!important;grid-template-columns:28px 28px 28px minmax(0,1fr) 48px!important;grid-template-areas:'emoji sticker clip spacer spacer' 'input input input input send'!important;gap:5px 6px!important;align-items:end!important;width:100%!important;min-width:0!important}
    #privateEmojiToggle{grid-area:emoji!important;width:28px!important;height:28px!important;min-width:28px!important;max-width:28px!important;min-height:28px!important;border-radius:9px!important;font-size:14px!important}
    #p101PrivateSticker{grid-area:sticker!important;width:28px!important;height:28px!important;min-width:28px!important;max-width:28px!important;min-height:28px!important;border-radius:9px!important;font-size:13px!important}
    #p79PrivateClip{grid-area:clip!important;width:28px!important;height:28px!important;min-width:28px!important;max-width:28px!important;min-height:28px!important;border-radius:9px!important;font-size:14px!important}
    #privateInput{grid-area:input!important;width:100%!important;min-width:0!important;height:64px!important;min-height:64px!important;max-height:144px!important;padding:15px 14px!important;font-size:16px!important;line-height:1.35!important;border-radius:16px!important;background:#fff!important;color:#17313d!important;caret-color:#168f94!important}
    #privateSendBtn{grid-area:send!important;width:48px!important;height:64px!important;min-width:48px!important;max-width:48px!important;min-height:64px!important;border-radius:15px!important}

    /* Panelinhas segue a mesma linguagem */
    .p48-compose-row{display:grid!important;grid-template-columns:auto 30px minmax(0,1fr) 48px!important;grid-template-areas:'topic sticker spacer spacer' 'input input input send'!important;gap:5px 6px!important;align-items:end!important;width:100%!important;min-width:0!important}
    .p48-topic{grid-area:topic!important;width:auto!important;min-width:0!important;max-width:96px!important;height:30px!important;min-height:30px!important;padding:2px 9px!important;border-radius:999px!important;font-size:10.5px!important}
    #p101P48Sticker{grid-area:sticker!important;width:30px!important;height:30px!important;min-width:30px!important;max-width:30px!important;min-height:30px!important;border-radius:10px!important;font-size:14px!important}
    #p48Input{grid-area:input!important;width:100%!important;min-width:0!important;height:64px!important;min-height:64px!important;max-height:144px!important;padding:15px 14px!important;font-size:16px!important;line-height:1.35!important;border-radius:16px!important}
    #p48Send{grid-area:send!important;width:48px!important;height:64px!important;min-width:48px!important;max-width:48px!important;min-height:64px!important;border-radius:15px!important}

    /* botão coral do topo: menor, sem roubar espaço da tela */
    .p103-top-plus{width:46px!important;height:46px!important;min-width:46px!important;max-width:46px!important;min-height:46px!important;padding:0!important;border-radius:15px!important;font-size:22px!important;box-shadow:0 8px 22px rgba(244,92,120,.14)!important}
  }
  `;document.head.appendChild(s)
}
function markTopPlus(){
  if(innerWidth>760)return;
  $$('button').forEach(b=>{
    if(String(b.textContent||'').trim()!=='+')return;
    if(b.closest('.private-composer,.p46-compose,.p48-compose-row,#softBottomNav'))return;
    const r=b.getBoundingClientRect();
    if(r.top>=0&&r.top<360&&r.width<=110&&r.height<=110)b.classList.add('p103-top-plus');
  })
}
function boot(){css();markTopPlus();new MutationObserver(()=>markTopPlus()).observe(document.documentElement,{subtree:true,childList:true});window.addEventListener('resize',markTopPlus,{passive:true});console.info('Carbonautas',VERSION,'escrita mobile ampliada')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
