/* Repository owns cards and the file carousel. No DOM cloning, polling or subscriptions. */
(function(root){
'use strict';
const files=()=>root.CarbonautasFiles;
const app=()=>root.CarbonautasApp||{state:{},memberId:''};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=s=>document.querySelector(s);
let deckIds=[],deckIndex=0,returnId='',returnVersion=0,busy=false,lastFocus=null;
const locks=new Set();
let recipientRequest=null,previewHome=null,previewNext=null;
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const millis=v=>v?.toMillis?.()||(v?.seconds? v.seconds*1000 : Date.parse(v)||0);
function turnId(p){return p.repositoryTurnMemberId||p.reviewNextRecipientId||files().nextRecipientId(p,p.memberId)}
function memberName(id){return (app().state.members||[]).find(m=>m.id===id)?.nome||'Participante'}
function actor(){return {memberId:app().memberId,coordinator:app().isAdmin}}
function cardHTML(p){
 const f=files(),can=f.canExchange(p,actor()),turn=turnId(p),targets=can?f.recipientIds(p,app().memberId):[];
 const history=f.historyEvents(p).map(e=>`<li><time>${esc(f.formatWhen(e.when))}</time><span><b>${esc(e.byName||memberName(e.byMemberId))}</b> ${esc(f.actionText(e))}</span><small>v${esc(e.version)}</small></li>`).join('');
 return `<article class="repository-file" data-file-id="${esc(p.id)}"><header><div><h3>${esc(p.titulo||f.publicationTitle(p))}</h3><p>${esc(p.memberNome||memberName(p.memberId))} · ${esc(f.publicationTitle(p))} · v${f.currentVersion(p)}</p></div></header><div class="repository-actions"><button type="button" data-file-action="preview">👁 Visualizar</button><button type="button" data-file-action="download">⬇ Baixar</button>${can&&targets.length?'<button type="button" data-file-action="return" class="primary">↩ Devolver arquivo</button>':''}${targets.length?'<button type="button" data-file-action="message">💬 Mensagem</button>':''}</div><details class="repository-history" open><summary>Histórico da troca</summary><ol>${history}</ol></details>${turn?`<p class="repository-turn">${turn===app().memberId?'Agora é sua vez':`Agora é a vez de ${esc(memberName(turn))}`}</p>`:''}</article>`;
}
function dialog(id,html){const el=document.createElement('dialog');el.id=id;el.className='repository-dialog';el.innerHTML=html;document.body.append(el);return el}
function closeDeck(){const d=$('#repositoryDeck');if(d?.open)d.close();deckIds=[];lastFocus?.focus?.()}
function showDeck(){
 const p=(app().state.publicacoes||[]).find(x=>x.id===deckIds[deckIndex]);if(!p){closeDeck();return}
 const d=$('#repositoryDeck');$('#repositoryStage').innerHTML=cardHTML(p);$('#repositoryCount').textContent=`${deckIndex+1} de ${deckIds.length}`;
 d.querySelector('[data-deck-prev]').disabled=deckIndex===0;d.querySelector('[data-deck-next]').disabled=deckIndex===deckIds.length-1;
 if(!d.open)d.showModal();
}
function openDeck(id){deckIds=[...document.querySelectorAll('#pubList > [data-file-id]')].filter(x=>!x.hidden).map(x=>x.dataset.fileId);deckIndex=deckIds.indexOf(id);if(deckIndex<0){deckIds=[id];deckIndex=0}lastFocus=document.activeElement;showDeck()}
function organize(){
 const list=$('#pubList'),toolbar=$('#repositoryOrganizer');if(!list||!toolbar)return;
 const mode=$('#repositoryMode').value,query=normalize($('#repositorySearch').value),select=$('#repositoryGroup'),selected=select.value;
 const pubs=new Map((app().state.publicacoes||[]).map(p=>[p.id,p]));
 const items=[...list.querySelectorAll(':scope > [data-file-id]')].map(el=>({el,p:pubs.get(el.dataset.fileId)})).filter(x=>x.p);
 const group=p=>mode==='person'?memberName(p.memberId):mode==='pending'?(turnId(p)===app().memberId?'Agora é sua vez':turnId(p)?'Aguardando outra pessoa':'Sem pendência'):(millis(p.editedAt||p.ts||p.createdAt)?new Date(millis(p.editedAt||p.ts||p.createdAt)).toISOString().slice(0,7):'Sem data');
 const groups=[...new Set(items.map(x=>group(x.p)))].sort((a,b)=>mode==='date'?b.localeCompare(a):a.localeCompare(b,'pt-BR'));
 select.innerHTML='<option value="">Todos</option>'+groups.map(g=>`<option value="${esc(g)}">${esc(g)}</option>`).join('');select.value=groups.includes(selected)?selected:'';
 items.sort((a,b)=>group(a.p).localeCompare(group(b.p),'pt-BR')*(mode==='date'?-1:1)||normalize(a.p.titulo||files().publicationTitle(a.p)).localeCompare(normalize(b.p.titulo||files().publicationTitle(b.p)),'pt-BR'));
 for(const {el,p}of items){el.hidden=!!((select.value&&group(p)!==select.value)||(query&&!normalize([p.titulo,files().publicationTitle(p),memberName(p.memberId),p.categoria].join(' ')).includes(query)));list.append(el)}
}
function refresh(){organize();if($('#repositoryDeck')?.open)showDeck()}
function chooseRecipient(p,actorId){
 const ids=files().recipientIds(p,actorId),preferred=files().nextRecipientId(p,actorId);
 if(ids.length===1)return Promise.resolve(ids[0]);
 if(!ids.length)return Promise.reject(Error('Não encontrei uma pessoa com acesso a este arquivo.'));
 const select=$('#messageRecipient');select.innerHTML=ids.map(id=>`<option value="${esc(id)}">${esc(memberName(id))}</option>`).join('');if(ids.includes(preferred))select.value=preferred;
 $('#repositoryRecipient').returnValue='';$('#repositoryRecipient').showModal();return new Promise(resolve=>{recipientRequest=resolve});
}
async function openMessage(id){
 const p=await files().getPublication(id,true),a=await files().actorProfile(true);if(!p||!a)throw Error('Arquivo ou perfil indisponível.');
 const target=await chooseRecipient(p,a.memberId);if(!target)return;
 closeDeck();$('#repositoryReturn')?.close();
 for(const key of ['repoOverlay','repoPackageOverlay','filePreviewOverlay'])root.closeOverlay?.(key);
 root.closePanelinhas?.();
 await root.startPrivateConversation(target);
 const tid=files().privateThreadId(a.memberId,target);
 if(!(app().state.privateThreads||[]).some(t=>t.id===tid))throw Error('Não foi possível abrir a conversa privada.');
 // Context is a draft, not an automatically sent message when someone just opens a file.
 root.switchView('conversas');root.openPrivateThread(tid);
 root.repositoryMessageContext={id,threadId:tid,version:files().currentVersion(p),targetId:target};
 const input=$('#privateInput');if(input){const context=`Sobre o arquivo “${files().publicationTitle(p)}” que me enviou`;input.value=input.value?input.value+'\n'+context:context;input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();}
}
async function preview(id){
 const p=await files().getPublication(id,true);if(!p?.url)throw Error('Arquivo indisponível.');
 const host=$('#repositoryPreview'),overlay=$('#filePreviewOverlay');if(!overlay)throw Error('Visualizador indisponível.');
 if(overlay.parentElement!==host){previewHome=overlay.parentNode;previewNext=overlay.nextSibling;host.append(overlay)}
 if(!host.open)host.showModal();
 // Existing viewer is read-only. Use the Storage URL directly: no OnlyOffice ticket dependency.
 const loading=root.openFilePreview(p.url,files().publicationTitle(p));
 const download=$('#filePreviewDownload');if(download){download.removeAttribute('href');download.onclick=async e=>{e.preventDefault();try{await files().downloadPublication(id)}catch(err){root.toast(err.message)}}}
 await loading;
}
async function openReturn(id){
 const p=await files().getPublication(id,true),a=await files().actorProfile(true);if(!files().canExchange(p,a))throw Error('Você não tem permissão para devolver este arquivo.');
 returnId=id;returnVersion=files().currentVersion(p);$('#repositoryReturn form').reset();$('#returnTitle').textContent=files().publicationTitle(p);const ids=files().recipientIds(p,a.memberId),select=$('#returnRecipient');select.innerHTML=ids.map(id=>`<option value="${esc(id)}">${esc(memberName(id))}</option>`).join('');const preferred=files().nextRecipientId(p,a.memberId);if(ids.includes(preferred))select.value=preferred;select.disabled=ids.length===1;$('#repositoryReturn').showModal();
}
async function submitReturn(e){
 e.preventDefault();if(busy)return;const form=e.currentTarget,file=form.elements.file.files[0],message=form.elements.message.value.trim();if(!file||!message)return;
 busy=true;const button=form.querySelector('[type=submit]');button.disabled=true;button.textContent='Enviando…';
 try{const p=await files().getPublication(returnId,true);if(files().currentVersion(p)!==returnVersion)throw Error('Outra versão chegou. Feche e reabra o formulário.');const result=await files().commitUploadAndMessage(returnId,file,message,$('#returnRecipient').value);$('#repositoryReturn').close();if(p.packageId)await root.openRepositoryPackage(p.packageId);root.toast(`Versão ${result.nextVersion} enviada. Agora é a vez de ${memberName(result.targetId)}.`)}catch(err){root.toast(err.message||'Não foi possível enviar.')}finally{busy=false;button.disabled=false;button.textContent='Enviar arquivo + mensagem'}
}
async function onAction(e){
 const button=e.target.closest('[data-file-action]');if(!button)return;const id=button.closest('[data-file-id]')?.dataset.fileId,action=button.dataset.fileAction,key=id+':'+action;if(!id||locks.has(key))return;
 e.preventDefault();locks.add(key);button.disabled=true;
 try{if(action==='download')await files().downloadPublication(id);else if(action==='preview')await preview(id);else if(action==='message')await openMessage(id);else if(action==='return')await openReturn(id)}catch(err){console.error('Repository',err);root.toast(err.message||'Não foi possível concluir.')}finally{locks.delete(key);button.disabled=false}
}
function boot(){
 dialog('repositoryDeck','<header><b>Arquivo Vivo</b><button type="button" data-deck-close aria-label="Fechar">×</button></header><div id="repositoryStage"></div><nav><button type="button" data-deck-prev>← Anterior</button><span id="repositoryCount"></span><button type="button" data-deck-next>Próximo →</button></nav>');
 dialog('repositoryReturn','<form><header><h2>Devolver arquivo</h2><button type="button" data-return-close aria-label="Fechar">×</button></header><p id="returnTitle"></p><label>Para<select id="returnRecipient" required></select></label><label>Nova versão<input type="file" name="file" required></label><label>Mensagem<textarea name="message" required maxlength="4400" rows="5" placeholder="Conte o que mudou e o que precisa ser feito."></textarea></label><footer><button type="button" data-return-close>Cancelar</button><button type="submit" class="primary">Enviar arquivo + mensagem</button></footer></form>');
 dialog('repositoryPreview','');
 dialog('repositoryRecipient','<form method="dialog"><h2>Conversar sobre o arquivo</h2><label>Com quem?<select id="messageRecipient"></select></label><footer><button value="cancel">Cancelar</button><button value="choose" class="primary">Abrir conversa</button></footer></form>');
 $('#repositoryRecipient').addEventListener('close',()=>{const resolve=recipientRequest;recipientRequest=null;resolve?.($('#repositoryRecipient').returnValue==='choose'?$('#messageRecipient').value:null)});
 $('#repositoryPreview').addEventListener('close',()=>{if($('#repositoryPreview').open)return;const overlay=$('#filePreviewOverlay');if(overlay&&previewHome){previewHome.insertBefore(overlay,previewNext?.parentNode===previewHome?previewNext:null);previewHome=null;overlay.classList.remove('open');const download=$('#filePreviewDownload');if(download)download.onclick=null}});
 document.addEventListener('click',onAction);
 document.addEventListener('dblclick',e=>{if(e.target.closest('button,a,input,summary'))return;const card=e.target.closest('#pubList > [data-file-id]');if(card)openDeck(card.dataset.fileId)});
 // A single explicit carousel launcher, outside the four file controls.
 const list=$('#pubList');if(list){const toolbar=document.createElement('div');toolbar.id='repositoryOrganizer';toolbar.innerHTML='<label>Organizar<select id="repositoryMode"><option value="person">A–Z · Pessoas</option><option value="date">Data</option><option value="pending">Pendências</option></select></label><label>Grupo<select id="repositoryGroup"><option value="">Todos</option></select></label><label>Pesquisar<input id="repositorySearch" type="search" placeholder="Pessoa ou arquivo"></label>';list.before(toolbar);toolbar.addEventListener('change',e=>{if(e.target.id==='repositoryMode')$('#repositoryGroup').value='';organize()});$('#repositorySearch').addEventListener('input',organize);const button=document.createElement('button');button.type='button';button.className='btn';button.textContent='▣ Folhear arquivos';button.onclick=()=>{const id=list.querySelector('[data-file-id]:not([hidden])')?.dataset.fileId;if(id)openDeck(id);else root.toast('Nenhum arquivo nestes filtros.')};list.before(button)}
 $('#repositoryDeck').addEventListener('click',e=>{if(e.target.closest('[data-deck-close]'))closeDeck();if(e.target.closest('[data-deck-prev]')&&deckIndex>0){deckIndex--;showDeck()}if(e.target.closest('[data-deck-next]')&&deckIndex<deckIds.length-1){deckIndex++;showDeck()}});
 $('#repositoryReturn form').addEventListener('submit',submitReturn);
 $('#repositoryReturn').addEventListener('click',e=>{if(e.target.closest('[data-return-close]')&&!busy)$('#repositoryReturn').close()});
 $('#repositoryReturn').addEventListener('cancel',e=>{if(busy)e.preventDefault()});
 $('#repositoryPreview').addEventListener('cancel',()=>root.closeOverlay?.('filePreviewOverlay'));
 document.addEventListener('carbonautas:repository-rendered',refresh);
 root.renderPubs?.();
}
root.CarbonautasRepository={cardHTML,openDeck,closeDeck,openMessage,preview,openReturn,refresh};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(globalThis);
