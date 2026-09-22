/* Carbonautas P218 · fluxo premium de arquivos
   - controles modernos e estáveis fora do legado
   - visualizador sempre acima da ficha do repositório
   - mensagem abre Privadas com contexto do arquivo
   - histórico único da troca (envio, download, devolução/novas versões)
*/
(function(root){
'use strict';
const BUILD='P218-20260922';
const hasDoc=()=>typeof document!=='undefined';
const $=(s,r)=>hasDoc()?(r||document).querySelector(s):null;
const $$=(s,r)=>hasDoc()?Array.from((r||document).querySelectorAll(s)):[];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const api=()=>root.CARBONAUTAS_FILE_HANDOFF_P214||null;
const state=()=>root.state||{};
const member=id=>(state().members||[]).find(x=>String(x?.id)===String(id))||null;
const memberName=(id,fallback='')=>member(id)?.nome||fallback||'Carbonauta';

function injectCss(){
  if(!hasDoc()||$('#p218Style'))return;
  const s=document.createElement('style');s.id='p218Style';s.textContent=`
    /* P218 vence as camadas anteriores. */
    #viewPubs .p217-controls,#viewPubs .p216-action-set,#viewPubs .p216-timeline{display:none!important}
    #viewPubs .pub-row .pub-act,#viewPubs .pub-row .repo-actions{display:none!important}
    #viewPubs .pub-row .p214-upload,#viewPubs .pub-row .p214-download,#viewPubs .pub-row .p214-message,
    #viewPubs .pub-row .p64-private-chat,#viewPubs .pub-row .office-edit-btn{display:none!important}
    #onlyOfficeOverlay,#onlyOfficeOverlay.open{display:none!important}

    /* O visualizador precisa ficar acima da ficha/overlay do repositório. */
    #filePreviewOverlay{z-index:2147483000!important}
    #filePreviewOverlay.open{display:flex!important}
    #filePreviewOverlay .modal{position:relative;z-index:1}

    .p218-flow{
      display:block!important;margin:14px 0 12px;padding:0!important;
      border:1px solid #d7e7e4;border-radius:20px;background:rgba(255,255,255,.96);
      overflow:hidden;box-shadow:0 8px 24px rgba(25,69,78,.045)
    }
    .p218-flow-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;background:linear-gradient(135deg,#f2faf7,#f4f8fb);border-bottom:1px solid #e1ece9}
    .p218-flow-title{display:flex;align-items:center;gap:8px;color:#173d4c;font-size:12px;font-weight:950;letter-spacing:.035em;text-transform:uppercase}
    .p218-flow-count{font-size:10px;font-weight:850;color:#70848e;background:#fff;border:1px solid #dce9e7;border-radius:999px;padding:4px 8px}
    .p218-event{display:grid!important;grid-template-columns:34px minmax(0,1fr) auto;gap:10px;align-items:start;padding:11px 14px;border-bottom:1px solid #edf3f1}
    .p218-event:last-of-type{border-bottom:0}
    .p218-event-icon{width:34px;height:34px;border-radius:12px;display:grid;place-items:center;background:#eef7f4;border:1px solid #d8ebe5;font-size:16px}
    .p218-event-main{min-width:0}.p218-event-who{font-size:12px;font-weight:900;color:#173d4c;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.p218-event-act{font-size:11.5px;color:#5f747d;margin-top:2px;line-height:1.3}.p218-event-when{font-size:10.5px;color:#7d9097;margin-top:3px;font-variant-numeric:tabular-nums}.p218-event-ver{align-self:center;border-radius:999px;background:#edf4f5;color:#536a72;font-size:9.5px;font-weight:950;padding:5px 8px}
    .p218-turn{padding:11px 14px;background:#fff8df;border-top:1px solid #eedc91;color:#5b4f20;font-size:11.5px;line-height:1.4}.p218-turn.mine{background:#e9f7f5;border-top-color:#b9ded8;color:#174f4c}.p218-turn b{font-weight:950}

    .p218-controls{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;width:100%;margin:12px 0 5px;padding:0!important}
    .p218-btn{
      appearance:none;border:1px solid #d6e7e4;border-radius:18px;min-height:70px;padding:10px 12px;
      background:linear-gradient(180deg,#ffffff,#f8fbfa);color:#173d4c;display:flex!important;align-items:center;justify-content:flex-start;
      gap:11px;text-align:left;box-shadow:0 7px 18px rgba(25,69,78,.055);cursor:pointer;transition:transform .14s ease,border-color .14s ease,box-shadow .14s ease;
      -webkit-tap-highlight-color:transparent
    }
    .p218-btn:hover{transform:translateY(-1px);border-color:#b9d9d2;box-shadow:0 10px 24px rgba(25,69,78,.08)}
    .p218-btn:active{transform:translateY(1px)}.p218-btn:disabled{opacity:.58;cursor:wait}
    .p218-ico{width:40px;height:40px;border-radius:13px;display:grid;place-items:center;flex:0 0 auto;font-size:22px;background:#edf8f5;border:1px solid #d7ebe6}
    .p218-copy{min-width:0;display:flex;flex-direction:column;gap:2px}.p218-copy b{font-size:13px;line-height:1.1;color:inherit}.p218-copy small{font-size:9.8px;line-height:1.2;color:#71858e;font-weight:650}
    .p218-view .p218-ico{background:#eef7fb;border-color:#d4e7f0}.p218-view .p218-ico span{font-size:27px}
    .p218-download .p218-ico{background:#f2f6ff;border-color:#dfe7fa}
    .p218-message .p218-ico{background:#f5f0fb;border-color:#e6dbf4}
    .p218-return{background:linear-gradient(135deg,#11878c,#159ba0)!important;border-color:#11878c!important;color:#fff!important;box-shadow:0 10px 22px rgba(17,135,140,.18)!important}.p218-return .p218-ico{background:rgba(255,255,255,.16);border-color:rgba(255,255,255,.22)}.p218-return .p218-copy small{color:rgba(255,255,255,.78)}

    @media(max-width:560px){
      .p218-flow{margin-top:12px;border-radius:18px}.p218-event{grid-template-columns:32px minmax(0,1fr) auto;padding:10px 12px;gap:9px}.p218-event-icon{width:32px;height:32px;border-radius:11px}
      .p218-controls{gap:9px;margin-top:10px}.p218-btn{min-height:68px;border-radius:16px;padding:9px 10px;gap:9px}.p218-ico{width:38px;height:38px;border-radius:12px;font-size:20px}.p218-copy b{font-size:12.2px}.p218-copy small{font-size:9.2px}.p218-view .p218-ico span{font-size:25px}
    }
  `;document.head.appendChild(s);
}

function publicationId(row){
  if(!row)return'';
  if(row.dataset?.p214PubId)return String(row.dataset.p214PubId);
  if(row.dataset?.pubId)return String(row.dataset.pubId);
  if(row.dataset?.id)return String(row.dataset.id);
  const a=api();try{const id=a?.publicationIdFromRow?.(row);if(id)return String(id)}catch(_e){}
  for(const el of row.querySelectorAll?.('[onclick]')||[]){
    const src=String(el.getAttribute('onclick')||'');
    const m=src.match(/(?:deletePublicacao|openFilePreview|messagePublicationOwner|openRepoFileConversationPublication|openReviewConversation|openOnlineEdit|openOnlyOffice)\(\s*['\"]([^'\"]+)['\"]/);if(m)return m[1];
  }
  return'';
}
function publication(id){return (state().publicacoes||[]).find(x=>String(x?.id)===String(id))||null}
function fileTitle(p){return p?.fileName||p?.reviewBaseTitle||p?.titulo||p?.title||'arquivo'}
function currentVersion(p){const a=api();try{return a?.currentVersion?a.currentVersion(p):Math.max(1,Number(p?.reviewVersion||p?.onlineEditVersion||1)||1)}catch(_e){return 1}}

function promotePreview(){
  const ov=$('#filePreviewOverlay');if(!ov)return;
  ov.style.setProperty('z-index','2147483000','important');
  try{if(ov.parentElement!==document.body)document.body.appendChild(ov)}catch(_e){}
}
function legacyPreview(row){
  return [...row.querySelectorAll('button,a')].filter(el=>!el.closest('.p218-controls')).find(el=>{
    const t=norm(el.textContent),oc=norm(el.getAttribute?.('onclick')||''),cl=String(el.className||'');
    return oc.includes('openfilepreview')||/p5[345]-view/.test(cl)||t==='visualizar'||t==='ver'||t.startsWith('👁');
  })||null;
}
function runView(row,id){
  promotePreview();
  const old=legacyPreview(row);
  if(old){try{old.click();setTimeout(promotePreview,0);setTimeout(promotePreview,120);return}catch(_e){}}
  const p=publication(id),url=p?.url||p?.downloadURL||p?.fileUrl||'';
  if(url&&typeof root.openFilePreview==='function'){try{root.openFilePreview(url,fileTitle(p));setTimeout(promotePreview,0);return}catch(_e){}}
  if(url){const w=window.open(url,'_blank','noopener');if(!w)location.href=url;return}
  root.toast?.('Não encontrei uma visualização para este arquivo.');
}
async function runDownload(id,btn){
  const a=api();if(!a?.downloadPublication)return root.toast?.('O download ainda não terminou de carregar.');
  const html=btn.innerHTML;try{btn.disabled=true;btn.innerHTML='<span class="p218-ico">⏳</span><span class="p218-copy"><b>Preparando…</b><small>registrando data e hora</small></span>';await a.downloadPublication(id)}catch(e){console.error('P218 download',e);root.toast?.(e?.message||'Não consegui baixar o arquivo.')}finally{btn.disabled=false;btn.innerHTML=html}
}
function runReturn(id){const a=api();if(a?.openUploadModal)return a.openUploadModal(id);root.toast?.('O envio da nova versão ainda não terminou de carregar.')}
function closeRepositorySheet(row){
  const ov=row?.closest?.('.overlay');if(!ov)return;
  try{if(ov.id&&typeof root.closeOverlay==='function'){root.closeOverlay(ov.id);return}}catch(_e){}
  ov.classList.remove('open');
}
async function runMessage(row,id){
  const p=publication(id),a=api();if(!p)return root.toast?.('Arquivo não encontrado.');
  const me=String(root.myId||'');
  let target='';try{target=String(a?.nextRecipientId?.(p,me,state())||'')}catch(_e){}
  if(!target)target=String(p?.memberId||p?.reviewReturnToId||p?.reviewReviewerId||'');
  const title=`Sobre o arquivo “${fileTitle(p)}” que me enviou`;
  closeRepositorySheet(row);
  try{
    if(target&&typeof root.openPrivateChatWithContext==='function'){
      await root.openPrivateChatWithContext(target,{type:'file',title,version:`v${currentVersion(p)}`,eventLabel:'Arquivo do Repositório',sourceId:id});
    }else if(typeof root.openRepositoryPrivateChat==='function'){
      await root.openRepositoryPrivateChat(id);
    }else if(a?.openMessageFor){
      await a.openMessageFor(id);
    }else return root.toast?.('A mensagem privada ainda não terminou de carregar.');
    setTimeout(()=>{
      const candidates=$$('#viewConversas textarea,#viewConversas input[type="text"],.private-chat textarea,.private-chat input[type="text"],[placeholder*="Mensagem" i]');
      const input=candidates.find(x=>x.offsetParent!==null&&!x.disabled);try{input?.focus({preventScroll:true})}catch(_e){}
    },420);
  }catch(e){console.error('P218 mensagem',e);root.toast?.(e?.message||'Não consegui abrir a conversa privada.')}
}

function eventIcon(ev){
  const a=norm(ev?.action||'')+' '+norm(api()?.actionText?.(ev)||'');
  if(a.includes('download')||a.includes('baix'))return'⬇️';
  if(a.includes('return')||a.includes('devolv')||a.includes('corrig')||a.includes('nova vers'))return'↩️';
  if(a.includes('upload')||a.includes('envi'))return'⬆️';
  if(a.includes('mensag'))return'💬';
  return'•';
}
function formatWhen(v){try{return api()?.formatWhen?.(v)||'—'}catch(_e){return'—'}}
function actionText(ev){try{return api()?.actionText?.(ev)||'movimentou o arquivo'}catch(_e){return'movimentou o arquivo'}}
function flowData(p){let ev=[];try{ev=api()?.historyEvents?.(p)||[]}catch(_e){}return ev.filter(x=>x?.action!=='legacy'||x?.when||x?.byName)}
function flowSig(p){const ev=flowData(p);return JSON.stringify(ev.map(x=>[x.action,x.version,String(x.when?.seconds||x.when||''),x.byMemberId,x.byName])).slice(0,7000)+'|'+String(p?.repositoryTurnMemberId||p?.reviewNextRecipientId||'')}
function renderFlow(p){
  const ev=flowData(p);
  const rows=ev.map(x=>`<div class="p218-event"><div class="p218-event-icon">${eventIcon(x)}</div><div class="p218-event-main"><div class="p218-event-who">${esc(x.byName||memberName(x.byMemberId))}</div><div class="p218-event-act">${esc(actionText(x))}</div><div class="p218-event-when">${esc(formatWhen(x.when))}</div></div><div class="p218-event-ver">v${esc(x.version||1)}</div></div>`).join('');
  const turnId=String(p?.repositoryTurnMemberId||p?.reviewNextRecipientId||''),mine=!!turnId&&turnId===String(root.myId||''),turnName=memberName(turnId,'Participante');
  const turn=turnId?`<div class="p218-turn ${mine?'mine':''}">${mine?'<b>Agora é sua vez.</b> Baixe o arquivo, trabalhe no seu aplicativo e devolva a próxima versão.':`Agora é a vez de <b>${esc(turnName)}</b>.`}</div>`:'';
  return `<div class="p218-flow-head"><div class="p218-flow-title"><span>↔️</span><span>Histórico da troca</span></div><div class="p218-flow-count">${ev.length} ocorrência${ev.length===1?'':'s'}</div></div>${rows||'<div class="p218-event"><div class="p218-event-icon">•</div><div class="p218-event-main"><div class="p218-event-act">Nenhuma movimentação registrada ainda.</div></div></div>'}${turn}`;
}
function hideLegacyBadges(row){for(const el of row.querySelectorAll('span,small,div')){if(el.closest('.p218-flow')||el.closest('.p218-controls'))continue;const t=norm(el.textContent);if(t&&t.length<120&&(t.includes('converter para editar')||t==='word · editavel'||t==='excel · editavel'||t==='powerpoint · editavel'))el.style.setProperty('display','none','important')}}
function makeBtn(cls,icon,label,sub,fn){const b=document.createElement('button');b.type='button';b.className=`p218-btn ${cls}`;b.innerHTML=`<span class="p218-ico"><span>${icon}</span></span><span class="p218-copy"><b>${label}</b><small>${sub}</small></span>`;b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();fn(e)});return b}
function decorate(row){
  hideLegacyBadges(row);const id=publicationId(row),p=publication(id);if(!id||!p||!api())return;
  row.dataset.p218='1';
  let flow=row.querySelector(':scope > .p218-flow');if(!flow){flow=document.createElement('div');flow.className='p218-flow';row.appendChild(flow)}const sig=flowSig(p);if(flow.dataset.sig!==sig){flow.dataset.sig=sig;flow.innerHTML=renderFlow(p)}
  let controls=row.querySelector(':scope > .p218-controls');if(!controls){controls=document.createElement('div');controls.className='p218-controls';controls.setAttribute('aria-label','Ações do arquivo');controls.appendChild(makeBtn('p218-view','👁️','Visualizar','abrir na frente',()=>runView(row,id)));controls.appendChild(makeBtn('p218-download','⬇️','Baixar','registrar data e hora',e=>runDownload(id,e.currentTarget)));controls.appendChild(makeBtn('p218-return','↩️','Devolver arquivo','nova versão + mensagem',()=>runReturn(id)));controls.appendChild(makeBtn('p218-message','💬','Mensagem','abrir conversa privada',()=>runMessage(row,id)));row.appendChild(controls)}
}
let raf=0;function scan(){raf=0;injectCss();promotePreview();for(const row of $$('#viewPubs .pub-row'))decorate(row)}function schedule(){if(raf)return;raf=requestAnimationFrame(scan)}
function boot(){injectCss();promotePreview();schedule();const host=$('#viewPubs')||document.body;const mo=new MutationObserver(muts=>{if(muts.some(m=>m.type==='childList'&&(m.addedNodes.length||m.removedNodes.length)))schedule()});mo.observe(host,{childList:true,subtree:true});document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});console.info('Carbonautas',BUILD,'fluxo premium de arquivos carregado')}
if(hasDoc()){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot()}
})(typeof globalThis!=='undefined'?globalThis:window);
