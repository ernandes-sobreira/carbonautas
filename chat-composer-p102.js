/* Carbonautas P102/P103 · base do compositor + refinamento mobile */
(function(){
'use strict';
function installBase(){
  if(document.getElementById('p102ComposerFix'))return;
  const s=document.createElement('style');s.id='p102ComposerFix';s.textContent=`
  .private-composer,.p46-compose-row,.p48-compose-row{min-width:0!important;max-width:100%!important;box-sizing:border-box!important}
  #privateInput,#p46Input,#p48Input{box-sizing:border-box!important;color:#17313d!important;background:#fff!important;caret-color:#168f94!important;opacity:1!important;visibility:visible!important}
  #p101PrivateSticker,#p101GeneralSticker,#p101P48Sticker{display:grid!important;place-items:center!important;margin:0!important;padding:0!important}
  @media(min-width:761px){
    .private-composer,.p46-compose-row,.p48-compose-row{display:flex!important;align-items:flex-end!important;gap:8px!important;width:100%!important}
    #privateInput,#p46Input,#p48Input{flex:1 1 320px!important;width:auto!important;min-width:220px!important;min-height:50px!important}
    #privateEmojiToggle,#p79PrivateClip,#p101PrivateSticker,#p79GeneralClip,#p101GeneralSticker,#p101P48Sticker{flex:0 0 42px!important;width:42px!important;min-width:42px!important;height:50px!important}
    #privateSendBtn,#p46Send,#p48Send{flex:0 0 50px!important;width:50px!important;height:50px!important}
  }
  `;document.head.appendChild(s)
}
function loadP103(){
  if(document.querySelector('script[data-carbonautas-p103]')||document.getElementById('p103ComposerStyle'))return;
  const s=document.createElement('script');s.src='./chat-composer-p103.js?v=P103-20260918b';s.async=false;s.dataset.carbonautasP103='1';document.head.appendChild(s)
}
function boot(){installBase();loadP103();console.info('Carbonautas P103 compositor mobile ampliado carregado')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
