/* Carbonautas P220 · controles de arquivo resilientes.
   Não depende de window.state: usa a API P214 e o DOM já renderizado.
   Corrige botões ocultos no Repositório e no clone #p90Deck. */
(function(root){
'use strict';
const BUILD='P220-20260922';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const api=()=>root.CARBONAUTAS_FILE_HANDOFF_P214||null;

function injectCss(){
  if($('#p220Style'))return;
  const s=document.createElement('style');
  s.id='p220Style';
  s.textContent=`
    /* P220 é a interface final dos botões de arquivo. O legado fica escondido. */
    #viewPubs .pub-row .pub-act,#viewPubs .pub-row .repo-actions,
    #p90Deck .pub-row .pub-act,#p90Deck .pub-row .repo-actions,
    .p216-action-set,.p217-controls,.p218-controls,.p219-controls{display:none!important}

    .p220-controls{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;width:100%;margin:14px 0 4px!important;padding:0!important}
    .p220-btn{appearance:none!important;-webkit-appearance:none!important;border:1px solid #d4e4e2!important;border-radius:20px!important;min-height:76px!important;padding:11px 12px!important;background:linear-gradient(180deg,#ffffff,#f8fbfa)!important;color:#173d4c!important;display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:11px!important;text-align:left!important;box-shadow:0 9px 22px rgba(25,69,78,.07)!important;cursor:pointer!important;font-family:inherit!important;transition:transform .14s ease,border-color .14s ease,box-shadow .14s ease!important}
    .p220-btn:active{transform:scale(.985)!important}.p220-btn:disabled{opacity:.55!important;cursor:wait!important}
    .p220-ico{width:44px;height:44px;border-radius:15px;display:grid;place-items:center;flex:0 0 auto;font-size:22px;background:#edf8f5;border:1px solid #d6eae5}
    .p220-copy{min-width:0;display:flex;flex-direction:column;gap:3px}.p220-copy b{font-size:13.5px;line-height:1.12;color:inherit;font-weight:900}.p220-copy small{font-size:10px;line-height:1.25;color:#73868e;font-weight:650}
    .p220-view .p220-ico{background:#eef7fb;border-color:#d5e7ef;font-size:27px}.p220-download .p220-ico{background:#f2f5ff;border-color:#dfe5f7}.p220-message .p220-ico{background:#f6f0fb;border-color:#e7dcf3}
    .p220-return{background:linear-gradient(135deg,#117f84,#18a0a4)!important;border-color:#117f84!important;color:#fff!important;box-shadow:0 12px 26px rgba(17,127,132,.20)!important}.p220-return .p220-ico{background:rgba(255,255,255,.15);border-color:rgba(255,255,255,.22)}.p220-return small{color:rgba(255,255,255,.82)!important}
    #filePreviewOverlay{z-index:2147483647!important}#filePreviewOverlay.open{display:flex!important}
    @media(max-width:560px){
      .p220-controls{gap:9px}.p220-btn{min-height:72px!important;border-radius:18px!important;padding:10px!important;gap:9px!important}.p220-ico{width:40px;height:40px;border-radius:13px;font-size:20px}.p220-copy b{font-size:12.5px}.p220-copy small{font-size:9.2px}
    }
  `;
  document.head.appendChild(s);
}

function pubId(row){
  try{const id=api()?.publicationIdFromRow?.(row);if(id)return String(id)}catch(_e){}
  if(row?.dataset?.p214PubId)return String(row.dataset.p214PubId);
  for(const el of row?.querySelectorAll?.('[onclick]')||[]){
    const src=String(el.getAttribute('onclick')||'');
    const m=src.match(/(?:messagePublicationOwner|openRepoFileConversationPublication|openReviewConversation|deletePublicacao|openFilePreview|openOnlineEdit|openOnlyOffice)\(\s*['\"]([^'\"]+)['\"]/);
    if(m)return m[1];
  }
  return'';
}
function isFileRow(row){
  if(!row)return false;
  if(row.querySelector('.p214-download,.p214-upload,.p214-history,.p217-controls,.p218-controls,.p219-controls,[onclick*="openFilePreview"],[onclick*="openOnlineEdit"],[onclick*="openOnlyOffice"]'))return true;
  const txt=norm([...row.querySelectorAll('button,a')].map(x=>x.textContent).join(' | '));
  return txt.includes('visualizar')||txt.includes('baixar arquivo')||txt.includes('devolver arquivo')||txt.includes('enviar nova versao');
}
function previewSource(row){
  return [...row.querySelectorAll('button,a')].find(el=>{
    if(el.closest('.p220-controls'))return false;
    const t=norm(el.textContent),oc=norm(el.getAttribute('onclick')||''),cl=String(el.className||'');
    return oc.includes('openfilepreview')||/p5[345]-view/.test(cl)||t==='visualizar'||t.startsWith('👁');
  })||null;
}
function promotePreview(){const ov=$('#filePreviewOverlay');if(!ov)return;try{if(ov.parentElement!==document.body)document.body.appendChild(ov)}catch(_e){}ov.style.setProperty('z-index','2147483647','important')}
function openPreview(row){
  const src=previewSource(row);
  if(!src)return root.toast?.('Não encontrei a visualização deste arquivo.');
  try{src.click()}catch(e){console.error('P220 visualizar',e);return root.toast?.('Não consegui abrir a visualização.')}
  setTimeout(promotePreview,0);setTimeout(promotePreview,120);
}
async function download(id,b){
  const a=api();if(!a?.downloadPublication)return root.toast?.('O download ainda não terminou de carregar.');
  const old=b.innerHTML;
  try{b.disabled=true;b.innerHTML='<span class="p220-ico">⏳</span><span class="p220-copy"><b>Preparando…</b><small>registrando data e hora</small></span>';await a.downloadPublication(id)}
  catch(e){console.error('P220 baixar',e);root.toast?.(e?.message||'Não consegui baixar o arquivo.')}
  finally{b.disabled=false;b.innerHTML=old}
}
function returnFile(id){const a=api();if(a?.openUploadModal)return a.openUploadModal(id);root.toast?.('O envio de nova versão ainda não terminou de carregar.')}
function closeDeck(){
  const deck=$('#p90Deck');
  if(deck&&!deck.hidden){
    const close=deck.querySelector('[data-p90-close]');
    try{close?.click()}catch(_e){}
    deck.hidden=true;
    const stage=$('#p90Stage',deck);if(stage)stage.innerHTML='';
  }
  const ov=$('#repoOverlay');if(ov?.classList.contains('open')){try{root.closeOverlay?.('repoOverlay')}catch(_e){ov.classList.remove('open')}}
  document.documentElement.style.overflow='';document.body.style.overflow='';
}
async function message(id){
  const a=api();if(!a?.openMessageFor)return root.toast?.('A conversa privada ainda não terminou de carregar.');
  closeDeck();
  try{await a.openMessageFor(id);setTimeout(()=>{const box=$('#privateMessageInput')||$('.private-composer textarea')||$('#viewConversas textarea')||$('#viewConversas input[type="text"]');try{box?.focus({preventScroll:true})}catch(_e){}},300)}
  catch(e){console.error('P220 mensagem',e);root.toast?.(e?.message||'Não consegui abrir a conversa privada.')}
}
function button(cls,ico,title,sub,fn){
  const b=document.createElement('button');b.type='button';b.className='p220-btn '+cls;
  b.innerHTML=`<span class="p220-ico">${ico}</span><span class="p220-copy"><b>${title}</b><small>${sub}</small></span>`;
  b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();fn(e.currentTarget)});return b;
}
function decorate(row){
  if(!isFileRow(row))return;
  const id=pubId(row);if(!id||!api())return;
  row.dataset.p220='1';
  const body=row.querySelector('.pub-body,.pub-main,.repo-main')||row;
  let controls=body.querySelector(':scope > .p220-controls');
  if(controls&&controls.dataset.pubId===id)return;
  controls?.remove();controls=document.createElement('div');controls.className='p220-controls';controls.dataset.pubId=id;
  controls.append(
    button('p220-view','👁️','Visualizar','abrir sem editar',()=>openPreview(row)),
    button('p220-download','⬇️','Baixar','registrar data e hora',b=>download(id,b)),
    button('p220-return','↩️','Devolver arquivo','nova versão + mensagem',()=>returnFile(id)),
    button('p220-message','💬','Mensagem','abrir conversa privada',()=>message(id))
  );
  body.appendChild(controls);
}
let scheduled=false;
function scan(){scheduled=false;injectCss();for(const row of [...$$('#viewPubs .pub-row'),...$$('#p90Deck .pub-row')])decorate(row)}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(scan)}
function boot(){
  injectCss();schedule();
  const mo=new MutationObserver(ms=>{if(ms.some(m=>m.type==='childList'&&m.addedNodes.length))schedule()});
  mo.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-nav="pubs"],#navPubs,[data-view="pubs"],[data-p90-open]'))setTimeout(schedule,100)},true);
  setInterval(()=>{if($('#viewPubs')?.offsetParent||!$('#p90Deck')?.hidden)schedule()},900);
  console.info('Carbonautas',BUILD,'controles de arquivo restaurados');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(typeof globalThis!=='undefined'?globalThis:window);
