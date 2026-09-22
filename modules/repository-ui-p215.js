/* Carbonautas P215 · Repositório sem botões duplicados e sem piscadas
   Mantém: enviar nova versão, ver, baixar, colaboradores, excluir e conversar.
   Remove do fluxo visual: editar/corrigir online e ONLYOFFICE. */
(function(root){
'use strict';
const BUILD='P215-20260922';
const hasDoc=()=>typeof document!=='undefined';
const $=(s,r)=>hasDoc()?(r||document).querySelector(s):null;
const $$=(s,r)=>hasDoc()?Array.from((r||document).querySelectorAll(s)):[];
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const api=()=>root.CARBONAUTAS_FILE_HANDOFF_P214||null;
const state=()=>root.state||{};
const member=id=>(state().members||[]).find(x=>String(x?.id)===String(id))||null;
const memberName=(id,fallback='')=>member(id)?.nome||fallback||'';
const currentActor=()=>({memberId:String(root.myId||''),coordinator:root.isAdmin===true});

function injectCss(){
  if(!hasDoc()||$('#p215RepositoryStyle'))return;
  const s=document.createElement('style');s.id='p215RepositoryStyle';s.textContent=`
  /* P215 domina visualmente as ações antigas enquanto o código legado ainda existe por segurança. */
  #onlyOfficeOverlay,#onlyOfficeOverlay.open{display:none!important}
  #viewPubs .p214-upload,#viewPubs .p214-download,#viewPubs .p214-message,#viewPubs .p64-private-chat{display:none!important}
  #viewPubs .p214-history,#viewPubs .p53-history,#viewPubs .p54-history,#viewPubs .repo-sequence,#viewPubs .p52-review-flow{display:none!important}
  #viewPubs .p215-hide{display:none!important}
  #viewPubs .p215-action.p214-old-action{display:inline-flex!important}
  #viewPubs .pub-act.p55-actions-grid,#viewPubs .repo-actions.p55-actions-grid{align-content:start!important}
  #viewPubs .p215-action{
    width:154px!important;min-width:154px!important;max-width:154px!important;height:44px!important;min-height:44px!important;
    padding:0 12px!important;margin:0!important;border-radius:11px!important;box-sizing:border-box!important;
    display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;
    border:1px solid #c9dadd!important;background:#fff!important;color:#17313d!important;text-decoration:none!important;
    font-size:12px!important;font-weight:900!important;line-height:1!important;white-space:nowrap!important;box-shadow:none!important;
    cursor:pointer!important;user-select:none!important
  }
  #viewPubs .p215-upload{background:#168f99!important;color:#fff!important;border-color:#168f99!important}
  #viewPubs .p215-eye{font-size:23px!important;line-height:1!important;filter:saturate(1.15);transform:translateY(-1px)}
  #viewPubs .p215-download-icon{font-size:19px!important;line-height:1!important}
  #viewPubs .p215-chat-icon{font-size:18px!important;line-height:1!important}
  #viewPubs .p215-history{margin-top:12px;border:1px solid #d6e4e6;border-radius:16px;background:#fff;overflow:hidden;max-width:900px}
  #viewPubs .p215-history-title{display:flex;align-items:center;gap:8px;padding:10px 12px;background:#f3f8f8;border-bottom:1px solid #e2ebed;color:#526b73;font-size:10px;font-weight:950;letter-spacing:.07em;text-transform:uppercase}
  #viewPubs .p215-history-row{display:grid;grid-template-columns:168px minmax(170px,1fr) minmax(180px,1fr) 55px;gap:10px;align-items:center;padding:9px 12px;border-bottom:1px solid #edf2f3;font-size:11.5px;color:#435b64}
  #viewPubs .p215-history-row:last-of-type{border-bottom:0}.p215-history-when{font-variant-numeric:tabular-nums;color:#657980;font-weight:750}.p215-history-who{font-weight:900;color:#18333d}.p215-history-act{color:#50676f}.p215-history-ver{justify-self:end;border-radius:999px;background:#edf4f5;color:#536a72;font-size:9.5px;font-weight:950;padding:4px 7px}
  #viewPubs .p215-turn{padding:10px 12px;background:#fff8df;border-top:1px solid #eedc91;color:#5b4f20;font-size:12px;line-height:1.4}#viewPubs .p215-turn.mine{background:#e9f7f5;border-top-color:#b9ded8;color:#174f4c}
  @media(max-width:980px){#viewPubs .p215-action{width:100%!important;min-width:0!important;max-width:none!important}}
  @media(max-width:760px){#viewPubs .p215-history-row{grid-template-columns:1fr auto;gap:4px 10px}.p215-history-when{grid-column:1}.p215-history-ver{grid-column:2;grid-row:1/3}.p215-history-who{grid-column:1}.p215-history-act{grid-column:1}.p215-eye{font-size:25px!important}}
  `;document.head.appendChild(s);
}

function publicationId(row){
  const a=api();
  if(row?.dataset?.p214PubId)return row.dataset.p214PubId;
  try{if(a?.publicationIdFromRow)return a.publicationIdFromRow(row)||''}catch(_e){}
  for(const el of row?.querySelectorAll?.('[onclick]')||[]){
    const src=String(el.getAttribute('onclick')||'');
    const m=src.match(/(?:deletePublicacao|openFilePreview|messagePublicationOwner|openRepoFileConversationPublication|openReviewConversation)\(\s*['"]([^'"]+)['"]/);if(m)return m[1];
  }
  return'';
}
function publicationById(id){return (state().publicacoes||[]).find(x=>String(x?.id)===String(id))||null}
function isOnlineOffice(el){
  const t=norm(el?.textContent),title=norm(el?.getAttribute?.('title')||''),oc=norm(el?.getAttribute?.('onclick')||''),cls=String(el?.className||'');
  return /office-edit-btn|p5[345]-edit|p55-return|review-action/.test(cls)||/onlyoffice|openonlyoffice|openpackageonlineedit|openonlineedit/.test(oc+' '+title+' '+t)||/corrigir online|editar online/.test(t+' '+title);
}
function isEdit(el){const t=norm(el?.textContent),title=norm(el?.getAttribute?.('title')||'');return isOnlineOffice(el)||/(^|\s)(editar|corrigir)(\s|$)/.test(t)||/(^|\s)(editar|corrigir)(\s|$)/.test(title)}
function isDownload(el){const t=norm(el?.textContent),title=norm(el?.getAttribute?.('title')||''),cls=String(el?.className||'');return /download/.test(cls)||t.includes('baixar')||title.includes('baixar')}
function isView(el){
  const t=norm(el?.textContent),title=norm(el?.getAttribute?.('title')||''),oc=norm(el?.getAttribute?.('onclick')||''),cls=String(el?.className||'');
  if(isOnlineOffice(el))return false;
  return /p5[345]-view/.test(cls)||oc.includes('openfilepreview')||t==='visualizar'||t==='ver'||t.includes('visualizar')||title.includes('visualizar')||t.startsWith('👁');
}
function isChat(el){const t=norm(el?.textContent),cls=String(el?.className||'');return /p64-private-chat|repo-room-btn|repo-direct-btn|review-chat-btn|repo-file-chat-btn/.test(cls)||t==='conversar'||t==='conversa'||t.includes('conversa do arquivo')||t.includes('mensagem')}
function isCollaborator(el){const t=norm(el?.textContent);return t.includes('colaboradores')}
function isDelete(el){const t=norm(el?.textContent),title=norm(el?.getAttribute?.('title')||'');return t.includes('excluir')||title.includes('excluir')}

function makeAction(cls,labelHtml,title,handler){
  const a=document.createElement('a');a.href='#';a.role='button';a.className=`p215-action ${cls}`;a.innerHTML=labelHtml;a.title=title||'';a.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();handler?.(e)});return a;
}
function pickLegacyView(area){return [...area.querySelectorAll('button,a')].find(el=>!el.classList.contains('p215-action')&&isView(el))||null}
function openView(row,id){
  const area=row.querySelector('.pub-act,.repo-actions'),legacy=pickLegacyView(area);
  if(legacy){try{legacy.click();return}catch(_e){}}
  const p=publicationById(id);if(p?.url){const w=window.open(p.url,'_blank','noopener');if(!w)location.href=p.url;return}
  root.toast?.('Este arquivo não tem visualização disponível.');
}
function runUpload(id){const a=api();if(a?.openUploadModal)return a.openUploadModal(id);root.toast?.('O envio de nova versão ainda não terminou de carregar.')}
async function runDownload(id,anchor){
  const a=api();if(!a?.downloadPublication)return root.toast?.('O download ainda não terminou de carregar.');
  const old=anchor.innerHTML;try{anchor.style.pointerEvents='none';anchor.innerHTML='<span class="p215-download-icon">⏳</span><span>Registrando…</span>';await a.downloadPublication(id)}catch(e){console.error(e);root.toast?.(e?.message||'Não consegui baixar o arquivo.')}finally{anchor.style.pointerEvents='';anchor.innerHTML=old}
}
function runChat(id){const a=api();if(a?.openMessageFor)return a.openMessageFor(id);root.openRepositoryPrivateChat?.(id)}

function historyAction(ev){const a=api();try{return a?.actionText?a.actionText(ev):''}catch(_e){return''}}
function formatWhen(ev){const a=api();try{return a?.formatWhen?a.formatWhen(ev?.when):'—'}catch(_e){return'—'}}
function historyMarkup(p){
  const a=api();let events=[];try{events=a?.historyEvents?a.historyEvents(p):[]}catch(_e){}
  const rows=(events||[]).filter(x=>x?.action!=='legacy'||x?.when||x?.byName).map(ev=>`<div class="p215-history-row"><div class="p215-history-when">${esc(formatWhen(ev))}</div><div class="p215-history-who">${esc(ev.byName||memberName(ev.byMemberId,'Carbonauta'))}</div><div class="p215-history-act">${esc(historyAction(ev)||'movimentou o arquivo')}</div><div class="p215-history-ver">v${esc(ev.version||1)}</div></div>`).join('');
  const turnId=String(p?.repositoryTurnMemberId||p?.reviewNextRecipientId||''),my=String(root.myId||''),mine=!!turnId&&turnId===my,turnName=memberName(turnId,'Participante');
  const turn=turnId?`<div class="p215-turn ${mine?'mine':''}">${mine?'<b>Agora é sua vez.</b> Baixe, trabalhe no seu aplicativo e envie a próxima versão.':`Agora é a vez de <b>${esc(turnName)}</b>.`}</div>`:'';
  return `<div class="p215-history-title"><span>↔</span><span>Histórico da troca de arquivos</span></div>${rows||'<div class="p215-history-row"><div class="p215-history-act">Nenhuma movimentação registrada ainda.</div></div>'}${turn}`;
}
function historySignature(p){
  const a=api();let ev=[];try{ev=a?.historyEvents?a.historyEvents(p):[]}catch(_e){}
  return JSON.stringify((ev||[]).map(x=>[x.action,x.version,String(x.when?.seconds||x.when||''),x.byMemberId,x.byName])).slice(0,6000)+'|'+String(p?.repositoryTurnMemberId||p?.reviewNextRecipientId||'');
}

function hideLegacyBadges(row){
  for(const el of row.querySelectorAll('span,small,div')){
    const t=norm(el.textContent);if(t&&t.length<100&&t.includes('converter para editar'))el.classList.add('p215-hide');
  }
}
function cleanOldHistories(row){
  row.querySelectorAll('[class*="history"],[class*="sequence"],[class*="review-flow"]').forEach(el=>{
    if(el.classList.contains('p215-history')||el.closest('.p215-history'))return;
    const t=norm(el.textContent);if(t.includes('historico')||t.includes('histórico')||t.includes('proxima acao')||t.includes('próxima ação'))el.classList.add('p215-hide');
  });
}
function dedupeKeep(area,test){const els=[...area.querySelectorAll('button,a')].filter(x=>!x.classList.contains('p215-action')&&test(x));els.slice(1).forEach(x=>x.classList.add('p215-hide'))}
function cleanLegacyActions(area){
  for(const el of area.querySelectorAll('button,a')){
    if(el.classList.contains('p215-action'))continue;
    if(isEdit(el)||isDownload(el)||isView(el)||isChat(el))el.classList.add('p215-hide');
  }
  dedupeKeep(area,isCollaborator);dedupeKeep(area,isDelete);
}
function decorateRow(row){
  const id=publicationId(row),p=publicationById(id),a=api();if(!id||!p||!a)return;
  const area=row.querySelector('.pub-act,.repo-actions');if(!area)return;
  row.dataset.p215='1';hideLegacyBadges(row);cleanOldHistories(row);cleanLegacyActions(area);
  let bar=area.querySelector('.p215-action-set');
  if(!bar){bar=document.createElement('span');bar.className='p215-action-set';bar.style.display='contents';area.prepend(bar)}
  if(!bar.querySelector('.p215-upload'))bar.appendChild(makeAction('p215-upload','<span>⬆️</span><span>Enviar nova versão</span>','Enviar um arquivo corrigido e uma mensagem',()=>runUpload(id)));
  if(!bar.querySelector('.p215-view'))bar.appendChild(makeAction('p215-view','<span class="p215-eye">👁️</span><span>Ver</span>','Visualizar o arquivo sem editar',()=>openView(row,id)));
  if(!bar.querySelector('.p215-download')){const d=makeAction('p215-download','<span class="p215-download-icon">↓</span><span>Baixar</span>','Baixar e registrar data e hora',e=>runDownload(id,e.currentTarget));bar.appendChild(d)}
  if(!bar.querySelector('.p215-chat'))bar.appendChild(makeAction('p215-chat','<span class="p215-chat-icon">💬</span><span>Conversar</span>','Abrir a conversa desta troca de arquivo',()=>runChat(id)));
  let hist=row.querySelector('.p215-history');if(!hist){hist=document.createElement('div');hist.className='p215-history';const body=row.querySelector('.pub-body,.repo-main')||row;body.appendChild(hist)}
  const sig=historySignature(p);if(hist.dataset.sig!==sig){hist.dataset.sig=sig;hist.innerHTML=historyMarkup(p)}
}
function cleanPackageRows(){
  $$('#viewPubs .repo-package-file').forEach(row=>{const area=row.querySelector('.repo-package-actions')||row;for(const el of area.querySelectorAll('button,a'))if(isEdit(el)||isOnlineOffice(el))el.classList.add('p215-hide')});
}
let scheduled=false;
function scan(){scheduled=false;if(!hasDoc())return;injectCss();$$('#viewPubs .pub-row').forEach(decorateRow);cleanPackageRows()}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(scan)}
function boot(){
  injectCss();schedule();
  const rootNode=$('#viewPubs')||document.body;
  const mo=new MutationObserver(()=>schedule());mo.observe(rootNode,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-nav="pubs"],#navPubs,[data-view="pubs"]'))setTimeout(schedule,80)},true);
  console.info('Carbonautas',BUILD,'ações estáveis do Repositório carregadas');
}
if(hasDoc()){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot()}
})(typeof globalThis!=='undefined'?globalThis:window);
