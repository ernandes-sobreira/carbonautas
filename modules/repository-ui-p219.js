/* Carbonautas P219 · Arquivo Vivo estável.
   Um único fluxo para arquivo: histórico + Visualizar + Baixar + Devolver + Mensagem.
   Funciona tanto no Repositório normal quanto no clone #p90Deck. */
(function(root){
'use strict';
const BUILD='P219.1-20260922';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const api=()=>root.CARBONAUTAS_FILE_HANDOFF_P214||null;
const state=()=>root.state||{};
const memberName=(id,f='Carbonauta')=>(state().members||[]).find(x=>String(x?.id)===String(id))?.nome||f;

function injectCss(){
  if($('#p219Style'))return;
  const s=document.createElement('style');s.id='p219Style';s.textContent=`
  /* esconder todas as gerações antigas; P219 é a única interface visível */
  .p217-controls,.p218-controls,.p216-action-set,.p218-flow,.p216-timeline{display:none!important}
  #viewPubs .pub-row .pub-act,#viewPubs .pub-row .repo-actions,
  #p90Deck .pub-row .pub-act,#p90Deck .pub-row .repo-actions{display:none!important}
  #onlyOfficeOverlay,#onlyOfficeOverlay.open{display:none!important}

  /* visualização sempre na frente do Arquivo Vivo */
  #filePreviewOverlay{z-index:2147483600!important}
  #filePreviewOverlay.open{display:flex!important}

  .p219-flow{display:block!important;margin:14px 0 12px;border:1px solid #d8e8e5;border-radius:22px;background:#fff;overflow:hidden;box-shadow:0 10px 28px rgba(25,69,78,.055)}
  .p219-flow-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 15px;background:linear-gradient(135deg,#eef8f5,#f3f8fb);border-bottom:1px solid #e1ece9}
  .p219-flow-title{display:flex;align-items:center;gap:7px;font-size:11px;font-weight:950;letter-spacing:.07em;text-transform:uppercase;color:#1b4b59}
  .p219-flow-count{font-size:10px;font-weight:850;color:#71858e;background:#fff;border:1px solid #dce9e7;border-radius:999px;padding:5px 8px}
  .p219-event{display:grid;grid-template-columns:38px minmax(0,1fr) auto;gap:11px;align-items:start;padding:12px 15px;border-bottom:1px solid #edf3f1}
  .p219-event-icon{width:38px;height:38px;border-radius:13px;display:grid;place-items:center;background:#edf8f5;border:1px solid #d6ebe5;font-size:18px}
  .p219-who{font-size:12.5px;font-weight:900;color:#173d4c}.p219-act{font-size:11.5px;color:#5f747d;margin-top:2px}.p219-when{font-size:10.5px;color:#83959c;margin-top:4px;font-variant-numeric:tabular-nums}
  .p219-ver{align-self:center;border-radius:999px;background:#edf4f5;color:#536a72;font-size:9.5px;font-weight:950;padding:5px 8px}
  .p219-turn{padding:12px 15px;background:#fff8df;border-top:1px solid #eedc91;color:#5b4f20;font-size:11.5px;line-height:1.45}.p219-turn.mine{background:#e9f7f5;border-top-color:#b9ded8;color:#174f4c}.p219-turn b{font-weight:950}

  .p219-controls{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px;width:100%;margin:12px 0 4px!important;padding:0!important}
  .p219-btn{appearance:none!important;border:1px solid #d5e6e2!important;border-radius:20px!important;min-height:76px!important;padding:11px 13px!important;background:linear-gradient(180deg,#fff,#f8fbfa)!important;color:#173d4c!important;display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:12px!important;text-align:left!important;box-shadow:0 9px 22px rgba(25,69,78,.06)!important;cursor:pointer!important;transition:transform .14s ease,border-color .14s ease,box-shadow .14s ease!important;font-family:inherit!important}
  .p219-btn:hover{transform:translateY(-2px)!important;border-color:#b9d9d2!important;box-shadow:0 13px 28px rgba(25,69,78,.09)!important}.p219-btn:active{transform:translateY(1px)!important}.p219-btn:disabled{opacity:.55!important;cursor:wait!important}
  .p219-ico{width:44px;height:44px;border-radius:15px;display:grid;place-items:center;flex:0 0 auto;font-size:23px;background:#edf8f5;border:1px solid #d6eae5}
  .p219-copy{min-width:0;display:flex;flex-direction:column;gap:3px}.p219-copy b{font-size:13.5px;line-height:1.1;color:inherit}.p219-copy small{font-size:10px;line-height:1.25;color:#72868e;font-weight:650}
  .p219-view .p219-ico{background:#eef7fb;border-color:#d5e7ef;font-size:29px}.p219-download .p219-ico{background:#f2f5ff;border-color:#dfe5f7}.p219-message .p219-ico{background:#f5f0fb;border-color:#e6dbf3}
  .p219-return{background:linear-gradient(135deg,#117f84,#18a0a4)!important;border-color:#117f84!important;color:#fff!important;box-shadow:0 12px 26px rgba(17,127,132,.20)!important}.p219-return .p219-ico{background:rgba(255,255,255,.15);border-color:rgba(255,255,255,.22)}.p219-return small{color:rgba(255,255,255,.80)!important}

  @media(max-width:560px){
    .p219-controls{gap:9px}.p219-btn{min-height:72px!important;border-radius:18px!important;padding:10px!important;gap:9px!important}.p219-ico{width:40px;height:40px;border-radius:13px;font-size:21px}.p219-copy b{font-size:12.5px}.p219-copy small{font-size:9.2px}
    .p219-event{padding:10px 12px;grid-template-columns:34px minmax(0,1fr) auto}.p219-event-icon{width:34px;height:34px;border-radius:12px}
  }`;
  document.head.appendChild(s);
}

function pubId(row){
  if(row?.dataset?.p214PubId)return String(row.dataset.p214PubId);
  try{const id=api()?.publicationIdFromRow?.(row);if(id)return String(id)}catch(_e){}
  for(const el of row?.querySelectorAll?.('[onclick]')||[]){
    const m=String(el.getAttribute('onclick')||'').match(/(?:deletePublicacao|openFilePreview|messagePublicationOwner|openRepoFileConversationPublication|openReviewConversation|openOnlineEdit|openOnlyOffice)\(\s*['\"]([^'\"]+)['\"]/);
    if(m)return m[1];
  }
  return'';
}
function pub(id){return (state().publicacoes||[]).find(x=>String(x?.id)===String(id))||null}
function title(p){return p?.fileName||p?.reviewBaseTitle||p?.titulo||p?.title||'arquivo'}
function currentVersion(p){try{return api()?.currentVersion?.(p)||Math.max(1,Number(p?.reviewVersion||p?.onlineEditVersion||1)||1)}catch(_e){return 1}}
function fmt(v){try{return api()?.formatWhen?.(v)||'—'}catch(_e){return'—'}}
function actText(e){try{return api()?.actionText?.(e)||'movimentou o arquivo'}catch(_e){return'movimentou o arquivo'}}
function events(p){try{return (api()?.historyEvents?.(p)||[]).filter(x=>x?.action!=='legacy'||x?.when||x?.byName)}catch(_e){return[]}}
function icon(e){const t=norm(e?.action)+' '+norm(actText(e));if(t.includes('download')||t.includes('baix'))return'⬇️';if(t.includes('devolv')||t.includes('nova vers')||t.includes('corrig'))return'↩️';if(t.includes('upload')||t.includes('envi'))return'⬆️';return'•'}
function flowSig(p){const ev=events(p);return JSON.stringify(ev.map(e=>[e.action,e.version,String(e.when?.seconds||e.when||''),e.byMemberId,e.byName])).slice(0,9000)+'|'+String(p?.repositoryTurnMemberId||p?.reviewNextRecipientId||'')+'|'+String(root.myId||'')}
function renderFlow(p){
  const ev=events(p);
  const rows=ev.map(e=>`<div class="p219-event"><div class="p219-event-icon">${icon(e)}</div><div><div class="p219-who">${esc(e.byName||memberName(e.byMemberId))}</div><div class="p219-act">${esc(actText(e))}</div><div class="p219-when">${esc(fmt(e.when))}</div></div><div class="p219-ver">v${esc(e.version||1)}</div></div>`).join('');
  const turn=String(p?.repositoryTurnMemberId||p?.reviewNextRecipientId||''),mine=!!turn&&turn===String(root.myId||''),tn=memberName(turn,'Participante');
  return `<div class="p219-flow-head"><div class="p219-flow-title"><span>↔️</span><span>Histórico da troca</span></div><div class="p219-flow-count">${ev.length} ocorrência${ev.length===1?'':'s'}</div></div>${rows||'<div class="p219-event"><div class="p219-event-icon">•</div><div><div class="p219-act">Ainda não há movimentações registradas.</div></div><div></div></div>'}${turn?`<div class="p219-turn ${mine?'mine':''}">${mine?'<b>Agora é sua vez.</b> Baixe, trabalhe no seu aplicativo e devolva a próxima versão.':`Agora é a vez de <b>${esc(tn)}</b>.`}</div>`:''}`;
}

function legacyPreview(row){return [...row.querySelectorAll('button,a')].filter(x=>!x.closest('.p219-controls')).find(x=>{const t=norm(x.textContent),oc=norm(x.getAttribute('onclick')||''),cl=String(x.className||'');return oc.includes('openfilepreview')||/p5[345]-view/.test(cl)||t==='visualizar'||t==='ver'||t.startsWith('👁')})||null}
function promotePreview(){const ov=$('#filePreviewOverlay');if(!ov)return;try{if(ov.parentElement!==document.body)document.body.appendChild(ov)}catch(_e){}ov.style.setProperty('z-index','2147483600','important')}
function viewFile(row,id){promotePreview();const old=legacyPreview(row);if(old){old.click();setTimeout(promotePreview,0);setTimeout(promotePreview,120);return}const p=pub(id),url=p?.url||p?.downloadURL||p?.fileUrl||'';if(url&&typeof root.openFilePreview==='function'){root.openFilePreview(url,title(p));setTimeout(promotePreview,0);return}if(url){const w=window.open(url,'_blank','noopener');if(!w)location.href=url;return}root.toast?.('Não encontrei uma visualização para este arquivo.')}
async function downloadFile(id,b){const a=api();if(!a?.downloadPublication)return root.toast?.('O download ainda não terminou de carregar.');const h=b.innerHTML;try{b.disabled=true;b.innerHTML='<span class="p219-ico">⏳</span><span class="p219-copy"><b>Preparando…</b><small>registrando data e hora</small></span>';await a.downloadPublication(id)}catch(e){console.error('P219 download',e);root.toast?.(e?.message||'Não consegui baixar o arquivo.')}finally{b.disabled=false;b.innerHTML=h}}
function returnFile(id){const a=api();if(a?.openUploadModal)return a.openUploadModal(id);root.toast?.('O envio da nova versão ainda não terminou de carregar.')}

function closeFileLayers(){
  const deck=$('#p90Deck');
  if(deck&&!deck.hidden){
    const close=deck.querySelector('[data-p90-close]');
    try{close?.click()}catch(_e){}
    deck.hidden=true;deck.style.setProperty('display','none','important');
    const stage=$('#p90Stage',deck);if(stage)stage.innerHTML='';
  }
  const ov=$('#repoOverlay');if(ov?.classList.contains('open')){try{root.closeOverlay?.('repoOverlay')}catch(_e){ov.classList.remove('open')}}
  document.documentElement.style.overflow='';document.body.style.overflow='';
}
async function messageFile(id){
  const p=pub(id),a=api();if(!p)return root.toast?.('Arquivo não encontrado.');
  const me=String(root.myId||'');let target='';try{target=String(a?.nextRecipientId?.(p,me,state())||'')}catch(_e){}
  if(!target)target=String(p?.memberId||p?.reviewReturnToId||p?.reviewReviewerId||'');
  const ctxTitle=`Sobre o arquivo “${title(p)}” que me enviou`;
  closeFileLayers();
  try{
    if(target&&typeof root.openPrivateChatWithContext==='function')await root.openPrivateChatWithContext(target,{type:'file',title:ctxTitle,version:`v${currentVersion(p)}`,eventLabel:'Arquivo do Repositório',sourceId:id});
    else if(typeof root.openRepositoryPrivateChat==='function')await root.openRepositoryPrivateChat(id);
    else if(a?.openMessageFor)await a.openMessageFor(id);
    else return root.toast?.('A mensagem privada ainda não terminou de carregar.');
    setTimeout(()=>{const box=$('#privateMessageInput')||$('.private-composer textarea')||$('#viewConversas textarea')||$('#viewConversas input[type="text"]');try{box?.focus({preventScroll:true})}catch(_e){}},360);
  }catch(e){console.error('P219 mensagem',e);root.toast?.(e?.message||'Não consegui abrir a conversa privada.')}
}
function btn(cls,ico,big,small,fn){const b=document.createElement('button');b.type='button';b.className='p219-btn '+cls;b.innerHTML=`<span class="p219-ico">${ico}</span><span class="p219-copy"><b>${big}</b><small>${small}</small></span>`;b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();fn(e)});return b}

function decorate(row){
  const id=pubId(row),p=pub(id);if(!id||!p||!api())return;
  row.dataset.p219='1';
  const body=row.querySelector('.pub-body,.pub-main,.repo-main')||row;
  let flow=body.querySelector(':scope > .p219-flow');
  if(!flow){flow=document.createElement('div');flow.className='p219-flow';body.appendChild(flow)}
  const sig=flowSig(p);if(flow.dataset.sig!==sig){flow.dataset.sig=sig;flow.innerHTML=renderFlow(p)}
  let controls=body.querySelector(':scope > .p219-controls');
  if(!controls||controls.dataset.pubId!==id){
    controls?.remove();controls=document.createElement('div');controls.className='p219-controls';controls.dataset.pubId=id;
    controls.append(
      btn('p219-view','👁️','Visualizar','abrir sem editar',()=>viewFile(row,id)),
      btn('p219-download','⬇️','Baixar','registrar data e hora',e=>downloadFile(id,e.currentTarget)),
      btn('p219-return','↩️','Devolver arquivo','nova versão + mensagem',()=>returnFile(id)),
      btn('p219-message','💬','Mensagem','abrir conversa privada',()=>messageFile(id))
    );
    body.appendChild(controls);
  }
}

let raf=0;
function scan(){raf=0;injectCss();const rows=[...new Set([...$$('#viewPubs .pub-row'),...$$('#p90Deck .pub-row')])];for(const r of rows)decorate(r)}
function schedule(){if(raf)return;raf=requestAnimationFrame(scan)}
function boot(){injectCss();schedule();const mo=new MutationObserver(ms=>{if(ms.some(m=>m.type==='childList'&&(m.addedNodes.length||m.removedNodes.length)))schedule()});mo.observe(document.body,{childList:true,subtree:true});document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});console.info('Carbonautas',BUILD,'Arquivo Vivo estabilizado sem rerender contínuo')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(typeof globalThis!=='undefined'?globalThis:window);
