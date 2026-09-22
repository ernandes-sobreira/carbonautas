/* Carbonautas P216 · interface única e estável para arquivos do Repositório.
   Estratégia: esconder TODO o conjunto legado de ações no CSS antes de qualquer
   rerender e desenhar um único conjunto novo. Assim scripts antigos podem continuar
   existindo por baixo sem provocar botões duplicados ou piscadas. */
(function(root){
'use strict';
const BUILD='P216-20260922';
const hasDoc=()=>typeof document!=='undefined';
const $=(s,r)=>hasDoc()?(r||document).querySelector(s):null;
const $$=(s,r)=>hasDoc()?Array.from((r||document).querySelectorAll(s)):[];
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const api=()=>root.CARBONAUTAS_FILE_HANDOFF_P214||null;
const state=()=>root.state||{};
const member=id=>(state().members||[]).find(x=>String(x?.id)===String(id))||null;
const memberName=(id,fallback='')=>member(id)?.nome||fallback||'';

function injectCss(){
  if(!hasDoc()||$('#p216Style'))return;
  const s=document.createElement('style');s.id='p216Style';s.textContent=`
  /* OnlyOffice e toda a camada antiga ficam fora deste fluxo. */
  #onlyOfficeOverlay,#onlyOfficeOverlay.open{display:none!important}

  /* Regra principal anti-pisca: qualquer coisa antiga que reapareça na área de ações
     já nasce invisível. Só o conjunto P216 pode aparecer. */
  .pub-row .pub-act>.p216-action-set,.pub-row .repo-actions>.p216-action-set{display:contents!important}
  .pub-row .pub-act>:not(.p216-action-set),.pub-row .repo-actions>:not(.p216-action-set){display:none!important}
  .pub-row .p214-upload,.pub-row .p214-download,.pub-row .p214-message,.pub-row .p64-private-chat,
  .pub-row .p215-action-set,.pub-row .p215-action,.pub-row .office-edit-btn,
  .pub-row .p53-edit,.pub-row .p54-edit,.pub-row .p55-edit,.pub-row .p53-view,.pub-row .p54-view,.pub-row .p55-view,
  .pub-row .p55-return,.pub-row .review-action,.pub-row .review-download{display:none!important}

  /* Um único histórico. Os históricos antigos podem continuar no DOM, mas não aparecem. */
  .pub-row [class*="history"],.pub-row [class*="sequence"],.pub-row [class*="review-flow"]{display:none!important}
  .pub-row .p216-timeline{display:block!important}
  .pub-row .p216-hide{display:none!important}

  .p216-action-set{display:contents!important}
  .p216-action{
    width:154px!important;min-width:154px!important;max-width:154px!important;height:46px!important;min-height:46px!important;
    margin:0!important;padding:0 12px!important;border-radius:12px!important;box-sizing:border-box!important;
    border:1px solid #c9dadd!important;background:#fff!important;color:#17313d!important;
    display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:9px!important;
    font-size:12px!important;font-weight:900!important;line-height:1!important;white-space:nowrap!important;box-shadow:none!important;
    cursor:pointer!important;-webkit-tap-highlight-color:transparent!important
  }
  .p216-upload{background:#168f99!important;color:#fff!important;border-color:#168f99!important}
  .p216-eye{font-size:28px!important;line-height:1!important;transform:translateY(-1px);filter:saturate(1.15)}
  .p216-download-icon{font-size:20px!important}.p216-chat-icon{font-size:19px!important}
  .p216-action:disabled{opacity:.6!important;cursor:wait!important}

  .p216-timeline{margin-top:12px;border:1px solid #d6e4e6;border-radius:16px;background:#fff;overflow:hidden;max-width:900px}
  .p216-timeline-title{display:flex;align-items:center;gap:8px;padding:11px 13px;background:#f3f8f8;border-bottom:1px solid #e2ebed;color:#526b73;font-size:10px;font-weight:950;letter-spacing:.07em;text-transform:uppercase}
  .p216-timeline-row{display:grid;grid-template-columns:168px minmax(170px,1fr) minmax(180px,1fr) 55px;gap:10px;align-items:center;padding:10px 13px;border-bottom:1px solid #edf2f3;font-size:11.5px;color:#435b64}
  .p216-timeline-row:last-of-type{border-bottom:0}.p216-when{font-variant-numeric:tabular-nums;color:#657980;font-weight:750}.p216-who{font-weight:900;color:#18333d}.p216-act{color:#50676f}.p216-ver{justify-self:end;border-radius:999px;background:#edf4f5;color:#536a72;font-size:9.5px;font-weight:950;padding:4px 7px}
  .p216-turn{padding:11px 13px;background:#fff8df;border-top:1px solid #eedc91;color:#5b4f20;font-size:12px;line-height:1.4}.p216-turn.mine{background:#e9f7f5;border-top-color:#b9ded8;color:#174f4c}.p216-turn b{font-weight:950}

  @media(max-width:980px){.p216-action{width:100%!important;min-width:0!important;max-width:none!important}}
  @media(max-width:760px){.p216-timeline-row{grid-template-columns:1fr auto;gap:4px 10px}.p216-when{grid-column:1}.p216-ver{grid-column:2;grid-row:1/3}.p216-who{grid-column:1}.p216-act{grid-column:1}.p216-eye{font-size:30px!important}}
  `;document.head.appendChild(s);
}

function pubId(row){
  if(row?.dataset?.p214PubId)return row.dataset.p214PubId;
  const a=api();try{if(a?.publicationIdFromRow){const id=a.publicationIdFromRow(row);if(id)return id}}catch(_e){}
  for(const el of row?.querySelectorAll?.('[onclick]')||[]){
    const src=String(el.getAttribute('onclick')||'');
    const m=src.match(/(?:deletePublicacao|openFilePreview|messagePublicationOwner|openRepoFileConversationPublication|openReviewConversation|openOnlineEdit|openOnlyOffice)\(\s*['"]([^'"]+)['"]/);if(m)return m[1];
    const idm=src.match(/\bid\s*:\s*['"]([^'"]+)['"]/);if(idm)return idm[1];
  }
  return'';
}
function publication(id){return (state().publicacoes||[]).find(x=>String(x?.id)===String(id))||null}
function legacyButtons(area){return [...area.querySelectorAll('button,a')].filter(x=>!x.closest('.p216-action-set'))}
function byText(area,needle){const n=norm(needle);return legacyButtons(area).find(x=>norm(x.textContent).includes(n)||norm(x.getAttribute?.('title')||'').includes(n))||null}
function previewButton(area){return legacyButtons(area).find(x=>{const t=norm(x.textContent),oc=norm(x.getAttribute?.('onclick')||''),cl=String(x.className||'');return oc.includes('openfilepreview')||/p5[345]-view/.test(cl)||t==='visualizar'||t.startsWith('👁')})||null}

function makeBtn(cls,html,title,fn){const b=document.createElement('button');b.type='button';b.className=`p216-action ${cls}`;b.innerHTML=html;b.title=title||'';b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();fn?.(e)});return b}
function runUpload(id){const a=api();if(a?.openUploadModal)return a.openUploadModal(id);root.toast?.('O envio de nova versão ainda não terminou de carregar.')}
async function runDownload(id,btn){const a=api();if(!a?.downloadPublication)return root.toast?.('O download ainda não terminou de carregar.');const old=btn.innerHTML;try{btn.disabled=true;btn.innerHTML='<span class="p216-download-icon">⏳</span><span>Registrando…</span>';await a.downloadPublication(id)}catch(e){console.error(e);root.toast?.(e?.message||'Não consegui baixar o arquivo.')}finally{btn.disabled=false;btn.innerHTML=old}}
function runView(row,id){const area=row.querySelector('.pub-act,.repo-actions'),legacy=area?previewButton(area):null;if(legacy){try{legacy.click();return}catch(_e){}}
  const p=publication(id);if(p?.url){const w=window.open(p.url,'_blank','noopener');if(!w)location.href=p.url;return}root.toast?.('Este arquivo não tem visualização disponível.')}
function runChat(id){const a=api();if(a?.openMessageFor)return a.openMessageFor(id);if(typeof root.openRepositoryPrivateChat==='function')return root.openRepositoryPrivateChat(id);root.toast?.('A conversa ainda não terminou de carregar.')}
function clickLegacy(area,kind){const target=kind==='collab'?byText(area,'colaboradores'):byText(area,'excluir');if(target){target.click();return true}return false}

function formatWhen(v){const a=api();try{return a?.formatWhen?a.formatWhen(v):'—'}catch(_e){return'—'}}
function actionText(ev){const a=api();try{return a?.actionText?a.actionText(ev):'movimentou o arquivo'}catch(_e){return'movimentou o arquivo'}}
function timelineHtml(p){
  const a=api();let events=[];try{events=a?.historyEvents?a.historyEvents(p):[]}catch(_e){}
  const rows=(events||[]).filter(x=>x?.action!=='legacy'||x?.when||x?.byName).map(ev=>`<div class="p216-timeline-row"><div class="p216-when">${esc(formatWhen(ev.when))}</div><div class="p216-who">${esc(ev.byName||memberName(ev.byMemberId,'Carbonauta'))}</div><div class="p216-act">${esc(actionText(ev))}</div><div class="p216-ver">v${esc(ev.version||1)}</div></div>`).join('');
  const turnId=String(p?.repositoryTurnMemberId||p?.reviewNextRecipientId||''),mine=!!turnId&&turnId===String(root.myId||''),turnName=memberName(turnId,'Participante');
  const turn=turnId?`<div class="p216-turn ${mine?'mine':''}">${mine?'<b>Agora é sua vez.</b> Baixe, trabalhe no seu aplicativo e envie a próxima versão.':`Agora é a vez de <b>${esc(turnName)}</b>.`}</div>`:'';
  return `<div class="p216-timeline-title"><span>↔</span><span>Histórico da troca de arquivos</span></div>${rows||'<div class="p216-timeline-row"><div class="p216-act">Nenhuma movimentação registrada ainda.</div></div>'}${turn}`;
}
function timelineSig(p){const a=api();let ev=[];try{ev=a?.historyEvents?a.historyEvents(p):[]}catch(_e){}return JSON.stringify((ev||[]).map(x=>[x.action,x.version,String(x.when?.seconds||x.when||''),x.byMemberId,x.byName])).slice(0,6000)+'|'+String(p?.repositoryTurnMemberId||p?.reviewNextRecipientId||'')}

function hideLegacyTextBlocks(row){
  for(const el of row.querySelectorAll('span,small,div,strong')){
    if(el.closest('.p216-timeline')||el.closest('.p216-action-set'))continue;
    const t=norm(el.textContent);if(!t)continue;
    if(t.length<120&&t.includes('converter para editar'))el.classList.add('p216-hide');
    if(t.length<90&&(t==='historico do arquivo'||t==='historico da troca de arquivos')){
      let cur=el.parentElement,best=el;
      while(cur&&cur!==row){const ct=norm(cur.textContent);if(ct.length>1400)break;if(ct.includes('historico do arquivo')&&(ct.includes('proxima acao')||ct.includes('enviou para correcao')||ct.includes('devolveu a correcao')||ct.includes('enviou o arquivo')))best=cur;cur=cur.parentElement}
      best.classList.add('p216-hide');
    }
  }
}

function decorateRow(row){
  const id=pubId(row),p=publication(id),a=api();if(!id||!p||!a)return;
  const area=row.querySelector('.pub-act,.repo-actions');if(!area)return;
  row.dataset.p216='1';hideLegacyTextBlocks(row);
  let set=area.querySelector(':scope > .p216-action-set');
  if(!set){set=document.createElement('span');set.className='p216-action-set';area.prepend(set)}
  if(!set.querySelector('.p216-upload'))set.appendChild(makeBtn('p216-upload','<span>⬆️</span><span>Enviar nova versão</span>','Enviar arquivo + mensagem',()=>runUpload(id)));
  if(!set.querySelector('.p216-view'))set.appendChild(makeBtn('p216-view','<span class="p216-eye">👁️</span><span>Ver</span>','Ver o arquivo sem editar',()=>runView(row,id)));
  if(!set.querySelector('.p216-download'))set.appendChild(makeBtn('p216-download','<span class="p216-download-icon">↓</span><span>Baixar</span>','Baixar e registrar data/hora',e=>runDownload(id,e.currentTarget)));
  if(!set.querySelector('.p216-chat'))set.appendChild(makeBtn('p216-chat','<span class="p216-chat-icon">💬</span><span>Conversar</span>','Abrir a conversa desta troca',()=>runChat(id)));
  if(byText(area,'colaboradores')&&!set.querySelector('.p216-collab'))set.appendChild(makeBtn('p216-collab','<span>👥</span><span>Colaboradores</span>','Gerenciar colaboradores',()=>clickLegacy(area,'collab')));
  if(byText(area,'excluir')&&!set.querySelector('.p216-delete'))set.appendChild(makeBtn('p216-delete','<span>🗑️</span><span>Excluir</span>','Excluir arquivo',()=>clickLegacy(area,'delete')));

  let tl=row.querySelector(':scope > .p216-timeline');
  if(!tl){tl=document.createElement('div');tl.className='p216-timeline';const body=row.querySelector('.pub-body,.repo-main')||row;body.appendChild(tl)}
  const sig=timelineSig(p);if(tl.dataset.sig!==sig){tl.dataset.sig=sig;tl.innerHTML=timelineHtml(p)}
}
function cleanPackageFiles(){for(const row of $$('.repo-package-file')){const area=row.querySelector('.repo-package-actions')||row;for(const el of area.querySelectorAll('button,a')){const t=norm(el.textContent),title=norm(el.getAttribute?.('title')||''),oc=norm(el.getAttribute?.('onclick')||'');if(t.includes('editar')||t.includes('corrigir')||title.includes('editar')||title.includes('corrigir')||oc.includes('onlyoffice')||oc.includes('openpackageonlineedit'))el.classList.add('p216-hide')}}}
let scheduled=false;
function scan(){scheduled=false;if(!hasDoc())return;injectCss();for(const row of $$('.pub-row'))decorateRow(row);cleanPackageFiles()}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(scan)}
function boot(){injectCss();schedule();const mo=new MutationObserver(()=>schedule());mo.observe(document.body,{childList:true,subtree:true});document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});console.info('Carbonautas',BUILD,'interface única do Repositório carregada')}
if(hasDoc()){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot()}
})(typeof globalThis!=='undefined'?globalThis:window);
