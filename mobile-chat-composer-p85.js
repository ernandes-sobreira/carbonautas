/* Carbonautas P85 · composer mobile legível com teclado aberto */
(function(){
'use strict';
function css(){if(document.getElementById('p85ChatComposerStyle'))return;const s=document.createElement('style');s.id='p85ChatComposerStyle';s.textContent=`
@media(max-width:760px){
  #viewConversas,.private-wrap,.private-shell,.private-chat-pane{min-width:0!important;max-width:100%!important}
  .private-chat-pane{display:flex!important;flex-direction:column!important;overflow:hidden!important}
  .private-messages{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;padding-bottom:12px!important}
  .private-composer-zone{position:sticky!important;bottom:0!important;z-index:30!important;background:#fff!important;border-top:1px solid #dce7ea!important;padding:8px 8px max(8px,env(safe-area-inset-bottom))!important;width:100%!important;max-width:100%!important;overflow:visible!important}
  .private-composer{display:grid!important;grid-template-columns:42px 42px minmax(0,1fr) 48px!important;gap:7px!important;align-items:end!important;width:100%!important;max-width:100%!important;min-width:0!important}
  #privateEmojiToggle,#p79PrivateClip{width:42px!important;height:46px!important;min-width:42px!important;max-width:42px!important;margin:0!important;padding:0!important;border-radius:13px!important;display:grid!important;place-items:center!important}
  #privateInput{display:block!important;width:100%!important;max-width:none!important;min-width:0!important;min-height:46px!important;height:46px!important;max-height:112px!important;margin:0!important;padding:11px 12px!important;border-radius:14px!important;font-size:16px!important;line-height:1.35!important;resize:none!important;overflow-y:auto!important;box-sizing:border-box!important}
  #privateSendBtn{width:48px!important;height:46px!important;min-width:48px!important;max-width:48px!important;margin:0!important;padding:0!important;border-radius:14px!important;display:grid!important;place-items:center!important;font-size:20px!important}
  .private-emoji-bar{max-width:100%!important;overflow-x:auto!important;white-space:nowrap!important;-webkit-overflow-scrolling:touch!important}
  #p79PrivateTray{width:100%!important;max-width:100%!important;margin:0 0 7px!important;overflow:hidden!important}
  #p79PrivateTray .p79-tray-main{min-width:0!important}
  #p79PrivateTray .p79-tray-main span{white-space:normal!important}
  .private-replying{max-width:100%!important;overflow:hidden!important}
  .private-replying .text{min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}

  .p46-compose{position:sticky!important;bottom:0!important;z-index:30!important;background:#fff!important;padding:7px 8px max(7px,env(safe-area-inset-bottom))!important}
  .p46-compose-row{display:grid!important;grid-template-columns:auto 40px minmax(0,1fr) 44px!important;gap:7px!important;align-items:end!important;width:100%!important;min-width:0!important}
  .p46-topic-select{max-width:86px!important;min-width:0!important;height:44px!important}
  #p79GeneralClip{width:40px!important;height:44px!important;margin:0!important}
  #p46Input{width:100%!important;min-width:0!important;max-width:none!important;min-height:44px!important;height:44px!important;max-height:110px!important;font-size:16px!important;box-sizing:border-box!important}
  #p46Send{width:44px!important;height:44px!important;min-width:44px!important}
}
`;
document.head.appendChild(s)}
function grow(){const t=document.getElementById('privateInput');if(t&&!t.dataset.p85Grow){t.dataset.p85Grow='1';const f=()=>{t.style.height='46px';t.style.height=Math.min(112,Math.max(46,t.scrollHeight))+'px'};t.addEventListener('input',f);t.addEventListener('focus',()=>setTimeout(()=>{f();t.scrollIntoView({block:'nearest'})},220));f()}const g=document.getElementById('p46Input');if(g&&!g.dataset.p85Grow){g.dataset.p85Grow='1';const f=()=>{g.style.height='44px';g.style.height=Math.min(110,Math.max(44,g.scrollHeight))+'px'};g.addEventListener('input',f);g.addEventListener('focus',()=>setTimeout(()=>{f();g.scrollIntoView({block:'nearest'})},220));f()}}
function tick(){css();grow()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',tick,{once:true});else tick();
setInterval(tick,1200);
console.info('Carbonautas P85 composer mobile corrigido');
})();
