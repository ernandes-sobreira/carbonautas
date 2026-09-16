/* Carbonautas P47 · paleta das conversas privadas + mensagens do repositório ficam no repositório */
(function(){
'use strict';
const style=document.createElement('style');
style.id='p47-private-repo-style';
style.textContent=`
.private-wrap{background:radial-gradient(circle at 85% 0%,rgba(30,136,199,.10),transparent 32%),radial-gradient(circle at 10% 95%,rgba(14,92,99,.09),transparent 34%),#f2f8f8!important;color:#16262c!important}
.private-head h2{color:#10283a!important}.private-head p{color:#607780!important}
.private-lock{border-color:#b9d9d7!important;background:#e8f5f3!important;color:#0e5c63!important}
.private-shell{border-color:#cfdede!important;background:#ffffff!important;box-shadow:0 18px 48px rgba(20,38,44,.12)!important}
.private-list-pane{border-right-color:#dce8e7!important;background:linear-gradient(180deg,#f9fcfc,#eef7f6)!important}
.private-list-top{border-bottom-color:#dce8e7!important}
.private-new-btn{background:linear-gradient(135deg,#0e5c63,#1e88c7)!important;color:#fff!important}
.private-search{border-color:#cfdfdf!important;background:#fff!important;color:#16262c!important}.private-search:focus{border-color:#1e88c7!important;box-shadow:0 0 0 3px rgba(30,136,199,.10)!important}
.private-thread{color:#16262c!important}.private-thread:hover{background:#eaf4f3!important;border-color:#d2e3e1!important}.private-thread.on{background:linear-gradient(135deg,#dff1ef,#e7f2fb)!important;border-color:#9fc9c5!important}
.private-av{background:#6f8f95!important;color:#fff!important}.private-thread-last{color:#6d8087!important}.private-thread-time{color:#7a8b91!important}.private-unread{background:#0e7f88!important;color:#fff!important}
.private-empty-list{color:#75878d!important}.private-chat-pane{background:radial-gradient(circle at 50% -15%,rgba(30,136,199,.08),transparent 34%),#f8fbfb!important}.private-chat-empty{color:#71848b!important}.private-chat-empty b{color:#18343d!important}
.private-chat-header{border-bottom-color:#dbe7e6!important;background:rgba(255,255,255,.94)!important}.private-chat-person b{color:#16262c!important}.private-chat-person small{color:#0e7f88!important}.private-back{border-color:#cbdcda!important;background:#fff!important;color:#0e5c63!important}
.private-day{background:#e7f0ef!important;border-color:#d2dfde!important;color:#60737a!important}.private-reply-quote{border-left-color:#1e88c7!important;background:#eef7fb!important;color:#5c7078!important}
.private-bubble{border-color:#d7e3e2!important;background:#fff!important;color:#18323d!important;box-shadow:0 4px 12px rgba(20,38,44,.06)!important}.private-msg.mine .private-bubble{background:linear-gradient(135deg,#d9efec,#dcecf6)!important;border-color:#afd1cf!important;color:#15323a!important}
.private-msg-meta{color:#71838a!important}.private-read{color:#0e7f88!important}.private-msg-actions button{color:#667b82!important}.private-msg-actions button:hover{color:#0e5c63!important}
.private-composer-zone{border-top-color:#dce7e6!important;background:#f2f8f7!important}.private-replying{background:#e9f4f3!important;border-color:#c8dfdd!important}.private-replying .text{color:#5e747b!important}.private-replying .text b{color:#0e6f78!important}.private-emoji-bar button{border-color:#d2e1df!important;background:#fff!important}
.private-emoji-toggle,.private-send{border-color:#c9dbd9!important;background:#fff!important;color:#0e5c63!important}.private-send{background:linear-gradient(135deg,#0e5c63,#1e88c7)!important;color:#fff!important}.private-composer textarea{border-color:#cedfdd!important;background:#fff!important;color:#16262c!important}.private-composer textarea:focus{border-color:#1e88c7!important;box-shadow:0 0 0 3px rgba(30,136,199,.09)!important}
.repo-direct-btn{display:none!important}
`;
document.head.appendChild(style);

function clarify(){
  const head=document.querySelector('.private-head');
  if(head){
    const h=head.querySelector('h2'); if(h)h.textContent='Privadas';
    const p=head.querySelector('p'); if(p)p.textContent='Conversa direta 1:1. Assuntos de arquivos ficam na Sala do arquivo, dentro do Repositório.';
  }
  document.querySelectorAll('.repo-room-btn').forEach(b=>{
    if(!b.dataset.p47){b.dataset.p47='1';b.textContent='🗂 Conversa do arquivo';b.title='Esta conversa fica vinculada somente a este arquivo no Repositório.';}
  });
}

// Evita que um atalho antigo do Repositório leve para Privadas.
// A conversa de arquivo permanece na Sala do arquivo e só é visível ao proprietário + colaboradores.
if(typeof window.messagePublicationOwner==='function'){
  window.messagePublicationOwner=function(pubId){
    if(typeof window.openRepoFileConversationPublication==='function') return window.openRepoFileConversationPublication(pubId);
  };
}

clarify();
setInterval(clarify,1200);
console.log('Carbonautas P47 · privadas na paleta + conversa de arquivo somente no Repositório');
})();
