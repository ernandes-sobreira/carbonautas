/* Carbonautas P103 · área de escrita maior + controles compactos e alinhados no mobile */
(function(){
'use strict';
const VERSION='P103.1';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
function css(){
  if($('#p103ComposerStyle'))return;
  const s=document.createElement('style');s.id='p103ComposerStyle';s.textContent=`
  @media(max-width:760px){
    .p46-compose{padding:8px!important}

    /* mesma linguagem visual para FIGURINHA e CLIPE */
    #p101GeneralSticker,#p79GeneralClip,#p101PrivateSticker,#p79PrivateClip,#p101P48Sticker{
      appearance:none!important;-webkit-appearance:none!important;
      box-sizing:border-box!important;
      display:grid!important;place-items:center!important;
      padding:0!important;margin:0!important;
      border:1px solid #d4e1e5!important;
      background:#fff!important;color:#27434d!important;
      box-shadow:none!important;transform:none!important;
      line-height:1!important;vertical-align:middle!important;
      overflow:hidden!important;
    }
    #p101GeneralSticker::before,#p101PrivateSticker::before,#p101P48Sticker::before{content:'🎴';font-size:16px!important;line-height:1!important}
    #p79GeneralClip::before,#p79PrivateClip::before{content:'📎';font-size:17px!important;line-height:1!important}
    #p101GeneralSticker,#p101PrivateSticker,#p101P48Sticker,#p79GeneralClip,#p79PrivateClip{font-size:0!important}

    /* Fofoca geral: utilidades pequenas em cima, escrita grande embaixo */
    .p46-compose-row{display:grid!important;grid-template-columns:auto 34px 34px minmax(0,1fr) 48px!important;grid-template-areas:'topic sticker clip spacer spacer' 'input input input input send'!important;gap:6px!important;align-items:end!important;width:100%!important;min-width:0!important}
    .p46-topic-select{grid-area:topic!important;width:auto!important;min-width:0!important;max-width:96px!important;height:34px!important;min-height:34px!important;padding:2px 9px!important;border-radius:999px!important;background:#eef8f7!important;border-color:#cfe6e2!important;font-size:10.5px!important;font-weight:800!important;color:#1c6670!important}
    #p101GeneralSticker{grid-area:sticker!important}
    #p79GeneralClip{grid-area:clip!important}
    #p101GeneralSticker,#p79GeneralClip{width:34px!important;height:34px!important;min-width:34px!important;max-width:34px!important;min-height:34px!important;max-height:34px!important;border-radius:11px!important}
    #p46Input{grid-area:input!important;width:100%!important;min-width:0!important;height:68px!important;min-height:68px!important;max-height:150px!important;padding:15px 14px!important;font-size:16px!important;line-height:1.35!important;border-radius:16px!important;background:#fff!important;color:#17313d!important;caret-color:#168f94!important;overflow-y:auto!important}
    #p46Send{grid-area:send!important;width:48px!important;height:68px!important;min-width:48px!important;max-width:48px!important;min-height:68px!important;border-radius:15px!important}

    /* Privadas */
    .private-composer{display:grid!important;grid-template-columns:30px 34px 34px minmax(0,1fr) 48px!important;grid-template-areas:'emoji sticker clip spacer spacer' 'input input input input send'!important;gap:6px!important;align-items:end!important;width:100%!important;min-width:0!important}
    #privateEmojiToggle{grid-area:emoji!important;width:30px!important;height:34px!important;min-width:30px!important;max-width:30px!important;min-height:34px!important;max-height:34px!important;border-radius:11px!important;padding:0!important;font-size:14px!important}
    #p101PrivateSticker{grid-area:sticker!important}
    #p79PrivateClip{grid-area:clip!important}
    #p101PrivateSticker,#p79PrivateClip{width:34px!important;height:34px!important;min-width:34px!important;max-width:34px!important;min-height:34px!important;max-height:34px!important;border-radius:11px!important}
    #privateInput{grid-area:input!important;width:100%!important;min-width:0!important;height:68px!important;min-height:68px!important;max-height:150px!important;padding:15px 14px!important;font-size:16px!important;line-height:1.35!important;border-radius:16px!important;background:#fff!important;color:#17313d!important;caret-color:#168f94!important;overflow-y:auto!important}
    #privateSendBtn{grid-area:send!important;width:48px!important;height:68px!important;min-width:48px!important;max-width:48px!important;min-height:68px!important;border-radius:15px!important}

    /* Panelinhas */
    .p48-compose-row{display:grid!important;grid-template-columns:auto 34px minmax(0,1fr) 48px!important;grid-template-areas:'topic sticker spacer spacer' 'input input input send'!important;gap:6px!important;align-items:end!important;width:100%!important;min-width:0!important}
    .p48-topic{grid-area:topic!important;width:auto!important;min-width:0!important;max-width:96px!important;height:34px!important;min-height:34px!important;padding:2px 9px!important;border-radius:999px!important;font-size:10.5px!important}
    #p101P48Sticker{grid-area:sticker!important;width:34px!important;height:34px!important;min-width:34px!important;max-width:34px!important;min-height:34px!important;max-height:34px!important;border-radius:11px!important}
    #p48Input{grid-area:input!important;width:100%!important;min-width:0!important;height:68px!important;min-height:68px!important;max-height:150px!important;padding:15px 14px!important;font-size:16px!important;line-height:1.35!important;border-radius:16px!important}
    #p48Send{grid-area:send!important;width:48px!important;height:68px!important;min-width:48px!important;max-width:48px!important;min-height:68px!important;border-radius:15px!important}

    /* botão coral do topo menor */
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
function labelTools(){
  [['#p101GeneralSticker','Figurinhas'],['#p101PrivateSticker','Figurinhas'],['#p101P48Sticker','Figurinhas'],['#p79GeneralClip','Enviar foto ou print'],['#p79PrivateClip','Enviar foto ou print']].forEach(([sel,label])=>{const el=$(sel);if(el){el.title=label;el.setAttribute('aria-label',label)}})
}
function boot(){css();markTopPlus();labelTools();new MutationObserver(()=>{markTopPlus();labelTools()}).observe(document.documentElement,{subtree:true,childList:true});window.addEventListener('resize',markTopPlus,{passive:true});console.info('Carbonautas',VERSION,'ferramentas do composer alinhadas')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
