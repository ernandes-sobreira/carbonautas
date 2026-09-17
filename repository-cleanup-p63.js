/* Carbonautas P63 · Repositório mais limpo + uma conversa por arquivo */
(function(){
'use strict';
const VERSION='P63';

function norm(v=''){
  return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toLowerCase();
}

function css63(){
  if(document.getElementById('p63Style'))return;
  const s=document.createElement('style');s.id='p63Style';s.textContent=`
  /* ===== UM ÚNICO BOTÃO DE CONVERSA POR ARQUIVO ===== */
  .p55-actions-grid button.p63-duplicate-action,
  .p55-actions-grid a.p63-duplicate-action,
  .pub-act button.p63-duplicate-action,
  .pub-act a.p63-duplicate-action{display:none!important}
  .p63-file-chat-primary{background:#fff!important;color:#17313d!important;border:1px solid #cbdade!important}

  /* ===== PACOTES/PASTAS DO TOPO DO REPOSITÓRIO ===== */
  #repoPackageList.repo-package-zone{
    display:grid!important;
    grid-template-columns:repeat(2,minmax(0,1fr))!important;
    gap:12px!important;
    margin:14px 0 20px!important;
  }
  #repoPackageList .repo-package-card{
    --p63-accent:#168c98;
    position:relative!important;
    display:grid!important;
    grid-template-columns:52px minmax(0,1fr) auto!important;
    gap:12px!important;
    align-items:center!important;
    min-height:92px!important;
    margin:0!important;
    padding:14px 14px 14px 18px!important;
    border:1px solid color-mix(in srgb,var(--p63-accent) 24%,#d8e5ea)!important;
    border-radius:19px!important;
    background:linear-gradient(135deg,color-mix(in srgb,var(--p63-accent) 7%,white),#fff 55%)!important;
    box-shadow:0 8px 22px rgba(11,44,57,.07)!important;
    overflow:hidden!important;
  }
  #repoPackageList .repo-package-card:before{
    content:"";position:absolute;left:0;top:12px;bottom:12px;width:5px;border-radius:999px;background:var(--p63-accent)
  }
  #repoPackageList .repo-package-card:hover{transform:translateY(-1px);box-shadow:0 12px 28px rgba(11,44,57,.11)!important}
  #repoPackageList .repo-package-icon{
    width:48px!important;height:48px!important;border-radius:15px!important;
    background:color-mix(in srgb,var(--p63-accent) 12%,white)!important;
    border:1px solid color-mix(in srgb,var(--p63-accent) 18%,#dce8ec)!important;
    font-size:24px!important
  }
  #repoPackageList .repo-package-title{font-size:14px!important;line-height:1.24!important;font-weight:900!important;color:#142b36!important;white-space:normal!important}
  #repoPackageList .repo-package-meta{margin-top:6px!important;gap:6px!important;font-size:10px!important;color:#6b7f87!important}
  #repoPackageList .repo-access-chip{padding:3px 7px!important}
  #repoPackageList .repo-package-actions{
    width:auto!important;display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:7px!important;
    padding:0!important;border:0!important
  }
  #repoPackageList .repo-package-actions .btn{
    min-width:88px!important;height:40px!important;padding:0 12px!important;border-radius:11px!important;
    background:#fff!important;border:1px solid #cad9de!important;color:#17313d!important;font-size:11px!important;font-weight:850!important;justify-content:center!important
  }
  #repoPackageList .repo-package-actions .mini-x{
    width:40px!important;height:40px!important;border-radius:11px!important;border:1px solid #f0c9cf!important;background:#fff7f8!important;color:#b4233d!important;font-size:18px!important;display:grid!important;place-items:center!important
  }

  /* ===== CONVERSA DO ARQUIVO: MAIS BONITA E COMPACTA ===== */
  #repoFileConversationOverlay{padding:12px!important;align-items:center!important;justify-content:center!important}
  #repoFileConversationOverlay .modal{
    width:min(760px,calc(100vw - 24px))!important;
    max-width:760px!important;
    max-height:calc(100dvh - 24px)!important;
    border-radius:24px!important;
    overflow:hidden!important;
    box-shadow:0 28px 80px rgba(4,25,37,.28)!important
  }
  #repoFileConversationOverlay .modal-h{
    min-height:64px!important;padding:13px 16px!important;background:#fff!important;border-bottom:1px solid #e0e8eb!important
  }
  #repoFileConversationOverlay .modal-h h2{font-size:19px!important;margin:0!important;color:#102b38!important}
  #repoFileConversationOverlay .modal-h .hint{font-size:10.5px!important;margin-top:3px!important;color:#6d8089!important}
  #repoFileConversationOverlay .modal-h .btn{height:38px!important;padding:0 12px!important;border-radius:11px!important}
  #repoFileConversationOverlay .modal-b{padding:0!important;overflow:hidden!important;background:#f2f7f8!important}
  #repoFileConversationOverlay .file-thread-shell{
    height:auto!important;min-height:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;
    grid-template-rows:auto minmax(190px,44dvh) auto!important;background:#f2f7f8!important
  }
  #repoFileConversationOverlay .file-thread-head{
    padding:13px 16px!important;background:linear-gradient(135deg,#0c4e5b,#0d7d86)!important;border:0!important
  }
  #repoFileConversationOverlay .file-thread-head b{font-size:15px!important;line-height:1.25!important}
  #repoFileConversationOverlay .file-thread-head small{font-size:10.5px!important;color:#d1ecee!important;margin-top:4px!important}
  #repoFileConversationOverlay .file-thread-visibility{background:rgba(255,255,255,.15)!important;color:#fff!important;border:1px solid rgba(255,255,255,.20)!important;margin-top:8px!important}
  #repoFileConversationOverlay .file-thread-messages{
    min-height:0!important;padding:15px 16px!important;gap:10px!important;
    background:radial-gradient(circle at 20% 0%,rgba(22,140,152,.07),transparent 32%),#eef4f5!important
  }
  #repoFileConversationOverlay .file-thread-msg{
    max-width:82%!important;padding:10px 12px!important;border-radius:16px!important;border:1px solid #d7e3e6!important;background:#fff!important;
    box-shadow:0 4px 12px rgba(11,44,57,.05)!important;color:#17313d!important
  }
  #repoFileConversationOverlay .file-thread-msg.mine{
    align-self:flex-end!important;background:#dff1ef!important;border-color:#afd4d0!important;color:#12333a!important
  }
  #repoFileConversationOverlay .file-thread-msg .who{font-size:10px!important;color:#526b73!important;opacity:1!important}
  #repoFileConversationOverlay .file-thread-msg .txt{font-size:13.5px!important;line-height:1.45!important}
  #repoFileConversationOverlay .file-thread-msg .when{font-size:9px!important;color:#75888f!important;opacity:1!important}
  #repoFileConversationOverlay .file-thread-compose{padding:11px 12px 12px!important;background:#fff!important;border-top:1px solid #dbe6e9!important}
  #repoFileConversationOverlay .file-thread-compose textarea{
    min-height:54px!important;max-height:110px!important;resize:vertical!important;border-radius:14px!important;padding:11px 12px!important;font-size:13px!important
  }
  #repoFileConversationOverlay .file-thread-compose .row{margin-top:8px!important;gap:8px!important}
  #repoFileConversationOverlay .file-thread-compose .row .btn.primary{
    height:40px!important;border-radius:12px!important;background:#138c97!important;border-color:#138c97!important;padding:0 16px!important
  }

  @media(max-width:760px){
    #repoPackageList.repo-package-zone{grid-template-columns:1fr!important;gap:10px!important}
    #repoPackageList .repo-package-card{grid-template-columns:46px minmax(0,1fr) auto!important;gap:10px!important;min-height:86px!important;padding:12px 10px 12px 16px!important;border-radius:17px!important}
    #repoPackageList .repo-package-icon{width:44px!important;height:44px!important;border-radius:13px!important;font-size:21px!important}
    #repoPackageList .repo-package-title{font-size:13px!important}
    #repoPackageList .repo-package-meta{font-size:9.5px!important}
    #repoPackageList .repo-package-actions{flex-direction:column!important;gap:5px!important}
    #repoPackageList .repo-package-actions .btn{min-width:72px!important;width:72px!important;height:34px!important;padding:0 7px!important;font-size:10px!important}
    #repoPackageList .repo-package-actions .mini-x{width:34px!important;height:34px!important;font-size:16px!important}

    #repoFileConversationOverlay{padding:8px!important;align-items:center!important}
    #repoFileConversationOverlay .modal{width:calc(100vw - 16px)!important;max-height:calc(100dvh - 16px)!important;border-radius:20px!important}
    #repoFileConversationOverlay .modal-h{min-height:58px!important;padding:11px 12px!important}
    #repoFileConversationOverlay .modal-h h2{font-size:17px!important}
    #repoFileConversationOverlay .modal-h .hint{display:none!important}
    #repoFileConversationOverlay .file-thread-shell{grid-template-rows:auto minmax(190px,46dvh) auto!important}
    #repoFileConversationOverlay .file-thread-head{padding:11px 12px!important}
    #repoFileConversationOverlay .file-thread-head b{font-size:14px!important}
    #repoFileConversationOverlay .file-thread-messages{padding:12px!important}
    #repoFileConversationOverlay .file-thread-msg{max-width:88%!important}
    #repoFileConversationOverlay .file-thread-compose{padding:10px!important}
    #repoFileConversationOverlay .file-thread-compose .row{display:grid!important;grid-template-columns:1fr!important}
    #repoFileConversationOverlay .file-thread-compose .row .hint{display:none!important}
    #repoFileConversationOverlay .file-thread-compose .row .btn.primary{width:100%!important;margin:0!important;justify-content:center!important}
  }
  `;document.head.appendChild(s);
}

function classifyPackage(card){
  const t=norm(card.textContent||'');
  let c='#168c98';
  if(/resumo|evento|sapi|congresso/.test(t))c='#7357d8';
  else if(/visibilidade|divulgacao|comunicacao/.test(t))c='#df941f';
  else if(/dados|planilha|excel|csv/.test(t))c='#168dc0';
  else if(/projeto|pesquisa/.test(t))c='#14966b';
  card.style.setProperty('--p63-accent',c);
  const open=card.querySelector('.repo-package-actions .btn');
  if(open&&!open.dataset.p63){open.dataset.p63='1';if(norm(open.textContent)==='abrir')open.textContent='📂 Abrir';}
}

function dedupeConversations(){
  document.querySelectorAll('#viewPubs .pub-row').forEach(card=>{
    const area=card.querySelector('.pub-act,.repo-actions');if(!area)return;
    const all=[...area.querySelectorAll('button,a')];
    all.forEach(x=>x.classList.remove('p63-duplicate-action','p63-file-chat-primary'));
    const fileCandidates=all.filter(x=>{
      const t=norm(x.textContent||''),oc=String(x.getAttribute('onclick')||'');
      return x.classList.contains('repo-room-btn')||x.classList.contains('repo-file-chat-btn')||/openRepoFileConversation|openReviewConversation/.test(oc)||/conversa do arquivo|conversa da correcao|conversa da correção/.test(t);
    });
    const generic=all.filter(x=>/^💬?\s*conversa$/.test(norm(x.textContent||''))||norm(x.textContent||'')==='conversa');
    const direct=all.filter(x=>/^falar com\b/.test(norm(x.textContent||''))||x.classList.contains('repo-direct-btn'));
    let keep=fileCandidates[0]||generic[0]||null;
    if(!keep && direct.length===1)keep=direct[0];
    if(keep){
      keep.classList.add('p63-file-chat-primary');
      const review=/devolver|correcao|correção/.test(norm(card.textContent||''));
      keep.textContent=review?'💬 Conversa da correção':'💬 Conversa do arquivo';
      [...fileCandidates,...generic,...direct].forEach(x=>{if(x!==keep)x.classList.add('p63-duplicate-action')});
    }
  });
}

function decoratePackages(){
  document.querySelectorAll('#repoPackageList .repo-package-card').forEach(classifyPackage);
}

function boot63(){
  css63();dedupeConversations();decoratePackages();
  setInterval(()=>{dedupeConversations();decoratePackages()},850);
  console.info('Carbonautas',VERSION,'repositório limpo + conversa única carregados');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot63,{once:true});else boot63();
})();
