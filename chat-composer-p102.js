/* Carbonautas P102 · compositor alinhado com figurinhas + campo sempre visível */
(function(){
'use strict';
const VERSION='P102';
function install(){
  if(document.getElementById('p102ComposerFix'))return;
  const s=document.createElement('style');
  s.id='p102ComposerFix';
  s.textContent=`
  /* O botão de figurinha entrou depois dos compositores antigos. P102 reserva uma coluna real para ele. */
  .private-composer,.p46-compose-row,.p48-compose-row{min-width:0!important;max-width:100%!important;box-sizing:border-box!important}
  #privateInput,#p46Input,#p48Input{box-sizing:border-box!important;color:#17313d!important;background:#fff!important;caret-color:#168f94!important;opacity:1!important;visibility:visible!important}
  #p101PrivateSticker,#p101GeneralSticker,#p101P48Sticker{display:grid!important;place-items:center!important;margin:0!important;padding:0!important}

  @media(min-width:761px){
    .private-composer{display:flex!important;align-items:flex-end!important;gap:8px!important;width:100%!important}
    #privateEmojiToggle,#p79PrivateClip,#p101PrivateSticker{flex:0 0 42px!important;width:42px!important;height:50px!important;min-width:42px!important;max-width:42px!important}
    #privateInput{flex:1 1 320px!important;width:auto!important;min-width:220px!important;height:50px!important;min-height:50px!important}
    #privateSendBtn{flex:0 0 50px!important;width:50px!important;height:50px!important}

    .p46-compose-row{display:flex!important;align-items:flex-end!important;gap:8px!important;width:100%!important}
    .p46-topic-select{flex:0 0 auto!important;max-width:130px!important}
    #p79GeneralClip,#p101GeneralSticker{flex:0 0 42px!important;width:42px!important;height:50px!important;min-width:42px!important;max-width:42px!important}
    #p46Input{flex:1 1 360px!important;width:auto!important;min-width:240px!important;height:50px!important;min-height:50px!important}
    #p46Send{flex:0 0 50px!important;width:50px!important;height:50px!important}

    .p48-compose-row{display:flex!important;align-items:flex-end!important;gap:8px!important;width:100%!important}
    #p101P48Sticker{flex:0 0 42px!important;width:42px!important;height:50px!important}
    #p48Input{flex:1 1 320px!important;width:auto!important;min-width:220px!important;height:50px!important;min-height:50px!important}
    #p48Send{flex:0 0 50px!important;width:50px!important;height:50px!important}
  }

  @media(max-width:760px){
    .private-composer{
      display:grid!important;
      grid-template-columns:40px 40px 40px minmax(0,1fr) 48px!important;
      gap:6px!important;align-items:end!important;width:100%!important;
    }
    #privateEmojiToggle,#p79PrivateClip,#p101PrivateSticker{
      width:40px!important;min-width:40px!important;max-width:40px!important;height:50px!important;min-height:50px!important;
    }
    #privateInput{
      width:100%!important;min-width:0!important;max-width:none!important;height:50px!important;min-height:50px!important;max-height:118px!important;
      font-size:16px!important;line-height:1.35!important;padding:13px 12px!important;overflow-y:auto!important;
    }
    #privateSendBtn{width:48px!important;min-width:48px!important;max-width:48px!important;height:50px!important;min-height:50px!important}

    .p46-compose-row{
      display:grid!important;
      grid-template-columns:64px 40px 40px minmax(0,1fr) 48px!important;
      gap:6px!important;align-items:end!important;width:100%!important;
    }
    .p46-topic-select{width:64px!important;min-width:64px!important;max-width:64px!important;height:50px!important;font-size:10px!important;padding:4px!important}
    #p79GeneralClip,#p101GeneralSticker{width:40px!important;min-width:40px!important;max-width:40px!important;height:50px!important;min-height:50px!important}
    #p46Input{
      width:100%!important;min-width:0!important;max-width:none!important;height:50px!important;min-height:50px!important;max-height:118px!important;
      font-size:16px!important;line-height:1.35!important;padding:13px 11px!important;overflow-y:auto!important;
    }
    #p46Send{width:48px!important;min-width:48px!important;max-width:48px!important;height:50px!important;min-height:50px!important}

    .p48-compose-row{
      display:grid!important;
      grid-template-columns:68px 40px minmax(0,1fr) 48px!important;
      gap:6px!important;align-items:end!important;width:100%!important;
    }
    .p48-topic{width:68px!important;min-width:68px!important;max-width:68px!important;height:50px!important;font-size:10px!important;padding:4px!important}
    #p101P48Sticker{width:40px!important;min-width:40px!important;max-width:40px!important;height:50px!important;min-height:50px!important}
    #p48Input{width:100%!important;min-width:0!important;height:50px!important;min-height:50px!important;max-height:118px!important;font-size:16px!important;padding:13px 11px!important}
    #p48Send{width:48px!important;min-width:48px!important;max-width:48px!important;height:50px!important;min-height:50px!important}

    /* impede a quebra que jogava o enviar para uma segunda linha */
    .private-composer>*,.p46-compose-row>*,.p48-compose-row>*{grid-row:1!important;align-self:end!important}
  }

  @media(max-width:380px){
    .p46-compose-row{grid-template-columns:56px 36px 36px minmax(0,1fr) 44px!important;gap:5px!important}
    .p46-topic-select{width:56px!important;min-width:56px!important;max-width:56px!important}
    #p79GeneralClip,#p101GeneralSticker{width:36px!important;min-width:36px!important;max-width:36px!important}
    #p46Send{width:44px!important;min-width:44px!important;max-width:44px!important}
    .private-composer{grid-template-columns:36px 36px 36px minmax(0,1fr) 44px!important;gap:5px!important}
    #privateEmojiToggle,#p79PrivateClip,#p101PrivateSticker{width:36px!important;min-width:36px!important;max-width:36px!important}
    #privateSendBtn{width:44px!important;min-width:44px!important;max-width:44px!important}
  }
  `;
  document.head.appendChild(s);
  console.info('Carbonautas',VERSION,'composer corrigido');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
