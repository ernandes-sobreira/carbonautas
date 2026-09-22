/* Carbonautas P217 · Controles de arquivo fora da área legada.
   Objetivo: acabar com duplicação/pisca-pisca e manter apenas o fluxo simples:
   Visualizar · Baixar · Devolver arquivo · Mensagem.
   Os controles P217 são filhos diretos do cartão, nunca do contêiner antigo. */
(function(root){
'use strict';
const BUILD='P217-20260922';
const hasDoc=()=>typeof document!=='undefined';
const $=(s,r)=>hasDoc()?(r||document).querySelector(s):null;
const $$=(s,r)=>hasDoc()?Array.from((r||document).querySelectorAll(s)):[];
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const api=()=>root.CARBONAUTAS_FILE_HANDOFF_P214||null;
const state=()=>root.state||{};

function injectCss(){
  if(!hasDoc()||$('#p217Style'))return;
  const s=document.createElement('style');
  s.id='p217Style';
  s.textContent=`
    /* Tudo que é ação antiga fica definitivamente fora da interface. */
    #viewPubs .pub-row .pub-act,
    #viewPubs .pub-row .repo-actions,
    #viewPubs .pub-row .p215-action-set,
    #viewPubs .pub-row .p216-action-set,
    #viewPubs .pub-row .p214-upload,
    #viewPubs .pub-row .p214-download,
    #viewPubs .pub-row .p214-message,
    #viewPubs .pub-row .p64-private-chat,
    #viewPubs .pub-row .office-edit-btn,
    #onlyOfficeOverlay,#onlyOfficeOverlay.open{display:none!important}

    /* O novo conjunto NÃO mora dentro de .pub-act/.repo-actions. */
    #viewPubs .pub-row>.p217-controls{
      display:grid!important;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:10px;
      width:100%;
      box-sizing:border-box;
      margin:14px 0 4px;
      padding:0 2px;
      visibility:visible!important;
      opacity:1!important;
    }
    #viewPubs .p217-btn{
      min-width:0!important;
      min-height:50px!important;
      border:1px solid #c9dadd!important;
      border-radius:13px!important;
      background:#fff!important;
      color:#17313d!important;
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      gap:10px!important;
      padding:10px 12px!important;
      font-size:14px!important;
      font-weight:900!important;
      line-height:1.1!important;
      box-shadow:none!important;
      cursor:pointer!important;
      visibility:visible!important;
      opacity:1!important;
      -webkit-tap-highlight-color:transparent;
    }
    #viewPubs .p217-btn:active{transform:translateY(1px)}
    #viewPubs .p217-btn:disabled{opacity:.58!important;cursor:wait!important}
    #viewPubs .p217-icon{font-size:25px!important;line-height:1!important;flex:0 0 auto}
    #viewPubs .p217-return{background:#168f99!important;border-color:#168f99!important;color:#fff!important}
    #viewPubs .p217-message .p217-icon{font-size:23px!important}
    #viewPubs .p217-view .p217-icon{font-size:30px!important}

    @media(max-width:560px){
      #viewPubs .pub-row>.p217-controls{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:12px}
      #viewPubs .p217-btn{min-height:52px!important;font-size:13px!important;padding:9px 8px!important;gap:7px!important}
      #viewPubs .p217-icon{font-size:23px!important}
      #viewPubs .p217-view .p217-icon{font-size:29px!important}
    }
  `;
  document.head.appendChild(s);
}

function publicationId(row){
  if(!row)return'';
  if(row.dataset?.p214PubId)return String(row.dataset.p214PubId);
  if(row.dataset?.pubId)return String(row.dataset.pubId);
  if(row.dataset?.id)return String(row.dataset.id);
  const a=api();
  try{const id=a?.publicationIdFromRow?.(row);if(id)return String(id)}catch(_e){}
  for(const el of row.querySelectorAll?.('[onclick]')||[]){
    const src=String(el.getAttribute('onclick')||'');
    const m=src.match(/(?:deletePublicacao|openFilePreview|messagePublicationOwner|openRepoFileConversationPublication|openReviewConversation|openOnlineEdit|openOnlyOffice)\(\s*['\"]([^'\"]+)['\"]/);
    if(m)return m[1];
  }
  return'';
}
function publication(id){return (state().publicacoes||[]).find(x=>String(x?.id)===String(id))||null}

function legacyPreview(row){
  const candidates=[...row.querySelectorAll('button,a')].filter(el=>!el.closest('.p217-controls'));
  return candidates.find(el=>{
    const t=norm(el.textContent),oc=norm(el.getAttribute?.('onclick')||''),cl=String(el.className||'');
    return oc.includes('openfilepreview')||/p5[345]-view/.test(cl)||t==='visualizar'||t==='ver'||t.startsWith('👁');
  })||null;
}
function hideEditBadges(row){
  for(const el of row.querySelectorAll('span,small,div')){
    if(el.closest('.p217-controls'))continue;
    const t=norm(el.textContent);
    if(t&&t.length<120&&(t.includes('converter para editar')||t==='word · editavel'||t==='excel · editavel'||t==='powerpoint · editavel'))el.style.setProperty('display','none','important');
  }
}

function makeBtn(cls,icon,label,title,fn){
  const b=document.createElement('button');
  b.type='button';
  b.className=`p217-btn ${cls}`;
  b.title=title;
  b.innerHTML=`<span class="p217-icon">${icon}</span><span>${label}</span>`;
  b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();fn(e)});
  return b;
}

function runView(row,id){
  const old=legacyPreview(row);
  if(old){try{old.click();return}catch(_e){}}
  const p=publication(id);
  const url=p?.url||p?.downloadURL||p?.fileUrl||'';
  if(url){const w=window.open(url,'_blank','noopener');if(!w)location.href=url;return}
  root.toast?.('Não encontrei uma visualização para este arquivo.');
}
async function runDownload(id,btn){
  const a=api();
  if(!a?.downloadPublication)return root.toast?.('O download ainda não terminou de carregar.');
  const html=btn.innerHTML;
  try{
    btn.disabled=true;
    btn.innerHTML='<span class="p217-icon">⏳</span><span>Preparando…</span>';
    await a.downloadPublication(id);
  }catch(e){console.error('P217 download',e);root.toast?.(e?.message||'Não consegui baixar o arquivo.');}
  finally{btn.disabled=false;btn.innerHTML=html;}
}
function runReturn(id){
  const a=api();
  if(a?.openUploadModal)return a.openUploadModal(id);
  root.toast?.('O envio da nova versão ainda não terminou de carregar.');
}
function runMessage(id){
  const a=api();
  if(a?.openMessageFor)return a.openMessageFor(id);
  if(typeof root.openRepositoryPrivateChat==='function')return root.openRepositoryPrivateChat(id);
  root.toast?.('A mensagem privada ainda não terminou de carregar.');
}

function decorate(row){
  hideEditBadges(row);
  const id=publicationId(row);
  if(!id||!api())return;
  row.dataset.p217='1';
  let controls=row.querySelector(':scope > .p217-controls');
  if(!controls){
    controls=document.createElement('div');
    controls.className='p217-controls';
    controls.setAttribute('aria-label','Ações do arquivo');
    controls.appendChild(makeBtn('p217-view','👁️','Visualizar','Visualizar o arquivo sem editar',()=>runView(row,id)));
    controls.appendChild(makeBtn('p217-download','⬇️','Baixar','Baixar o arquivo e registrar data e hora',e=>runDownload(id,e.currentTarget)));
    controls.appendChild(makeBtn('p217-return','↩️','Devolver arquivo','Enviar uma nova versão com mensagem privada obrigatória',()=>runReturn(id)));
    controls.appendChild(makeBtn('p217-message','💬','Mensagem','Abrir a conversa privada desta troca de arquivo',()=>runMessage(id)));

    const timeline=row.querySelector(':scope > .p216-timeline');
    if(timeline)row.insertBefore(controls,timeline);
    else row.appendChild(controls);
  }
}

let raf=0;
function scan(){raf=0;injectCss();for(const row of $$('#viewPubs .pub-row'))decorate(row)}
function schedule(){if(raf)return;raf=requestAnimationFrame(scan)}
function boot(){
  injectCss();schedule();
  const host=$('#viewPubs')||document.body;
  const mo=new MutationObserver(muts=>{
    if(muts.some(m=>m.type==='childList'&&(m.addedNodes.length||m.removedNodes.length)))schedule();
  });
  mo.observe(host,{childList:true,subtree:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});
  console.info('Carbonautas',BUILD,'controles estáveis de arquivo carregados');
}
if(hasDoc()){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot()}
})(typeof globalThis!=='undefined'?globalThis:window);
