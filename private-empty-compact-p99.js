/* Carbonautas P99 · privadas compactas no celular */
(function(){
'use strict';
const VERSION='P99';
function css(){
  if(document.getElementById('p99PrivateCompactStyle'))return;
  const s=document.createElement('style');
  s.id='p99PrivateCompactStyle';
  s.textContent=`
  @media(max-width:760px){
    /* O estado vazio das Privadas vira apenas uma dica compacta, sem roubar a tela */
    .private-chat-pane:not(:has(.private-chat-header.show)){
      flex:0 0 auto!important;
      min-height:0!important;
      height:auto!important;
      background:transparent!important;
      border:0!important;
      box-shadow:none!important;
      overflow:visible!important;
    }
    .private-chat-pane:not(:has(.private-chat-header.show)) .private-chat-empty{
      margin:8px 12px 12px!important;
      padding:10px 12px!important;
      max-width:none!important;
      min-height:0!important;
      width:auto!important;
      border:1px solid #d9e6e4!important;
      border-radius:16px!important;
      background:rgba(255,255,255,.72)!important;
      display:grid!important;
      grid-template-columns:30px minmax(0,1fr)!important;
      grid-template-rows:auto auto!important;
      column-gap:10px!important;
      row-gap:1px!important;
      align-items:center!important;
      text-align:left!important;
      box-shadow:0 5px 16px rgba(20,38,44,.04)!important;
    }
    .private-chat-pane:not(:has(.private-chat-header.show)) .private-chat-empty .big{
      grid-row:1/3!important;
      margin:0!important;
      font-size:25px!important;
      line-height:1!important;
    }
    .private-chat-pane:not(:has(.private-chat-header.show)) .private-chat-empty b{
      margin:0!important;
      font-size:13px!important;
      line-height:1.2!important;
      color:#173640!important;
    }
    .private-chat-pane:not(:has(.private-chat-header.show)) .private-chat-empty span{
      margin:0!important;
      font-size:10.5px!important;
      line-height:1.3!important;
      color:#72858b!important;
      white-space:nowrap!important;
      overflow:hidden!important;
      text-overflow:ellipsis!important;
    }
    .private-shell:not(.chat-open){
      height:auto!important;
      min-height:0!important;
      max-height:calc(100dvh - 300px)!important;
      display:flex!important;
      flex-direction:column!important;
      overflow:hidden!important;
    }
    .private-shell:not(.chat-open) .private-list-pane{
      flex:1 1 auto!important;
      min-height:0!important;
      max-height:calc(100dvh - 390px)!important;
    }
    .private-shell:not(.chat-open) .private-thread-list{
      min-height:0!important;
      max-height:calc(100dvh - 545px)!important;
      overflow-y:auto!important;
      overflow-x:hidden!important;
    }
  }
  `;
  document.head.appendChild(s);
}
function shorten(){
  const empty=document.getElementById('privateChatEmpty');
  if(!empty)return;
  const b=empty.querySelector('b');
  const span=empty.querySelector('span');
  if(b)b.textContent='Conversa privada';
  if(span)span.textContent='Escolha alguém acima ou toque em “Nova conversa”.';
}
function boot(){css();shorten();setInterval(shorten,1200);console.info('Carbonautas',VERSION,'Privadas compactas no celular')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
