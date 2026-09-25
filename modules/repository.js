/* Repository owns cards and the file carousel. No DOM cloning or polling. */
(function(root){
'use strict';
const files=()=>root.CarbonautasFiles;
const app=()=>root.CarbonautasApp||{state:{},memberId:'',isAdmin:false};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=s=>document.querySelector(s);
let deckIds=[],deckIndex=0,returnId='',returnVersion=0,busy=false,lastFocus=null;
const locks=new Set();
let recipientRequest=null,previewHome=null,previewNext=null;
let adminPackages=null,adminPackagesUnsub=null,adminSyncing=false;
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const millis=v=>v?.toMillis?.()||(v?.seconds? v.seconds*1000 : Date.parse(v)||0);
const CATEGORY_LABELS={
 apresentacao:'Apresentação',artigo:'Artigo científico',cronograma:'Cronograma',dados:'Dados / planilha',
 jogos_plataformas:'Jogos e plataformas',livros_capitulos:'Livros e capítulos',nota_tecnica:'Nota técnica',
 outro:'Outro',visibilidade:'Plano de visibilidade',projetos_relatorios:'Projetos e relatórios',resumos:'Resumos',video:'Vídeo'
};
const CATEGORY_ALIASES={resumo_expandido:'resumos',resumo_simples:'resumos',resumo:'resumos',jogo:'jogos_plataformas',plataforma:'jogos_plataformas',projeto:'projetos_relatorios',relatorio:'projetos_relatorios',livro:'livros_capitulos',capitulo:'livros_capitulos'};
function categoryKey(p){const raw=String(p?.categoria||'outro');return CATEGORY_ALIASES[raw]||raw||'outro'}
function categoryLabel(p){const k=categoryKey(p);return k==='outro'&&p?.categoriaOutro?String(p.categoriaOutro):CATEGORY_LABELS[k]||String(p?.categoria||'Outro')}
function turnId(p){return p.repositoryTurnMemberId||p.reviewNextRecipientId||files().nextRecipientId(p,p.memberId)}
function memberName(id){return (app().state.members||[]).find(m=>m.id===id)?.nome||'Participante'}
function actor(){return {memberId:app().memberId,coordinator:app().isAdmin}}
function cardHTML(p){
 const f=files(),can=f.canExchange(p,actor()),turn=turnId(p),targets=can?f.recipientIds(p,app().memberId):[];
 const history=f.historyEvents(p).map(e=>`<li><time>${esc(f.formatWhen(e.when))}</time><span><b>${esc(e.byName||memberName(e.byMemberId))}</b> ${esc(f.actionText(e))}</span><small>v${esc(e.version)}</small></li>`).join('');
 return `<article class="repository-file" data-file-id="${esc(p.id)}"><header><div><h3>${esc(p.titulo||f.publicationTitle(p))}</h3><p>${esc(p.memberNome||memberName(p.memberId))} · ${esc(categoryLabel(p))} · v${f.currentVersion(p)}</p></div></header><div class="repository-actions"><button type="button" data-file-action="preview">👁 Visualizar</button><button type="button" data-file-action="download">⬇ Baixar</button>${can&&targets.length?'<button type="button" data-file-action="return" class="primary">↩ Devolver arquivo</button>':''}${targets.length?'<button type="button" data-file-action="message">💬 Mensagem</button>':''}</div><details class="repository-history" open><summary>Histórico da troca</summary><ol>${history}</ol></details>${turn?`<p class="repository-turn">${turn===app().memberId?'Agora é sua vez':`Agora é a vez de ${esc(memberName(turn))}`}</p>`:''}</article>`;
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
function option(value,label){return `<option value="${esc(value)}">${esc(label)}</option>`}
function refillSelect(select,rows,placeholder){
 if(!select)return;
 const selected=select.value;
 select.innerHTML=option('',placeholder)+rows.map(([v,l])=>option(v,l)).join('');
 select.value=rows.some(([v])=>String(v)===String(selected))?selected:'';
}
const PACKAGE_PURPOSE_LABELS={artigos:'Artigos / manuscritos',resumos:'Resumos / eventos',instrumentos:'Instrumentos de coleta',dados:'Bases de dados',ferramentas:'Ferramentas / materiais',scripts:'Scripts / códigos',aula:'Material de aula',referencias:'Referências / leituras',bolsa:'Inscrição / bolsa',processo:'Processo seletivo / inscrição',prestacao:'Prestação de contas',documentos:'Documentos pessoais/acadêmicos',projeto:'Projeto / pesquisa',revisao:'Material para revisão',outro:'Outro'};
function packagePurposeLabel(p){return p?.purpose==='outro'?(p.purposeOther||'Outro'):(PACKAGE_PURPOSE_LABELS[p?.purpose]||'Pasta / conjunto')}
function dayKey(ms){if(!ms)return'';const d=new Date(ms);if(Number.isNaN(+d))return'';return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function setItemMeta(el,meta){
 el.dataset.repoItem='1';el.dataset.repoKind=meta.kind;el.dataset.personId=meta.personId||'';el.dataset.personName=meta.personName||'';el.dataset.categoryKey=meta.categoryKey||'';el.dataset.categoryLabel=meta.categoryLabel||'';el.dataset.dateMs=String(meta.dateMs||0);el.dataset.dateDay=dayKey(meta.dateMs);el.dataset.pending=meta.pending?'1':'0';el.dataset.title=meta.title||'';el.dataset.repoSearch=normalize(meta.search||'');
}
function publicationMeta(p){
 const personId=String(p.memberId||''),personName=p.memberNome||memberName(personId),categoryKeyValue=categoryKey(p),categoryLabelValue=categoryLabel(p),dateMs=millis(p.ts||p.createdAt||p.editedAt||p.updatedAt),title=p.titulo||files().publicationTitle(p);
 return {kind:'publication',personId,personName,categoryKey:categoryKeyValue,categoryLabel:categoryLabelValue,dateMs,title,pending:turnId(p)===app().memberId,search:[title,p.fileName,personName,categoryLabelValue,p.reviewNote,p.categoriaOutro].filter(Boolean).join(' ')};
}
function packageMeta(p){
 const personId=String(p.ownerMemberId||p.createdByMemberId||''),personName=p.ownerName||memberName(personId),purpose=packagePurposeLabel(p),dateMs=millis(p.ts||p.createdAt||p.updatedAt),title=p.title||'Pasta / conjunto',categoryKeyValue='package:'+String(p.purpose||'outro');
 return {kind:'package',personId,personName,categoryKey:categoryKeyValue,categoryLabel:purpose,dateMs,title,pending:false,search:[title,purpose,personName,'pasta conjunto',p.accessMode,`${Number(p.fileCount||0)} arquivos`].filter(Boolean).join(' ')};
}
function hideLegacyRepositoryUi(){
 const legacy=$('#repositoryLegacyFilters')||$('#pubCategoria')?.closest('.crono-filters');if(legacy){legacy.hidden=true;legacy.setAttribute('aria-hidden','true')}
 const zone=$('#repoPackageList');if(zone)zone.style.display='none';
}
function unifyGeneralList(){
 const list=$('#pubList');if(!list)return;
 hideLegacyRepositoryUi();
 const zone=$('#repoPackageList');if(zone){[...zone.querySelectorAll(':scope > .repo-package-card')].forEach(card=>list.append(card));zone.style.display='none'}
 const pubs=new Map((app().state.publicacoes||[]).map(p=>[String(p.id),p])),packages=new Map((app().state.repositoryPackages||[]).map(p=>[String(p.id),p]));
 [...list.children].forEach(el=>{
  const pubId=String(el.dataset.fileId||el.dataset.publicationId||''),packageId=String(el.dataset.packageId||'');
  if(pubId&&pubs.has(pubId)){setItemMeta(el,publicationMeta(pubs.get(pubId)));return}
  if(packageId&&packages.has(packageId)){setItemMeta(el,packageMeta(packages.get(packageId)));return}
  delete el.dataset.repoItem;
 });
}
function repositoryItems(){
 const list=$('#pubList');if(!list)return[];unifyGeneralList();
 return [...list.querySelectorAll(':scope > [data-repo-item="1"]')].map(el=>({el,kind:el.dataset.repoKind||'',personId:el.dataset.personId||'',personName:el.dataset.personName||'',categoryKey:el.dataset.categoryKey||'',categoryLabel:el.dataset.categoryLabel||'',dateMs:Number(el.dataset.dateMs||0),dateDay:el.dataset.dateDay||'',pending:el.dataset.pending==='1',title:el.dataset.title||'',search:el.dataset.repoSearch||''}));
}
function refreshFilterOptions(items){
 const people=new Map(),cats=new Map();
 for(const item of items){if(item.personId)people.set(item.personId,item.personName||memberName(item.personId));if(item.categoryKey)cats.set(item.categoryKey,item.categoryLabel||item.categoryKey)}
 refillSelect($('#repositoryPerson'),[...people].sort((a,b)=>String(a[1]).localeCompare(String(b[1]),'pt-BR')),'Todas as pessoas');
 refillSelect($('#repositoryCategory'),[...cats].sort((a,b)=>String(a[1]).localeCompare(String(b[1]),'pt-BR')),'Todas as categorias');
}
function organize(){
 const list=$('#pubList'),toolbar=$('#repositoryOrganizer');if(!list||!toolbar)return;
 const items=repositoryItems();refreshFilterOptions(items);
 const person=$('#repositoryPerson')?.value||'',category=$('#repositoryCategory')?.value||'',date=$('#repositoryDate')?.value||'',mode=$('#repositoryMode')?.value||'date',query=normalize($('#repositorySearch')?.value||'');
 for(const item of items){item.el.hidden=!!((person&&item.personId!==person)||(category&&item.categoryKey!==category)||(date&&item.dateDay!==date)||(mode==='pending'&&!item.pending)||(query&&!item.search.includes(query)))}
 items.sort((a,b)=>{
  if(mode==='dateAsc')return (a.dateMs||0)-(b.dateMs||0)||normalize(a.title).localeCompare(normalize(b.title),'pt-BR');
  if(mode==='person')return normalize(a.personName).localeCompare(normalize(b.personName),'pt-BR')||normalize(a.title).localeCompare(normalize(b.title),'pt-BR');
  if(mode==='title')return normalize(a.title).localeCompare(normalize(b.title),'pt-BR');
  if(mode==='pending')return Number(b.pending)-Number(a.pending)||(b.dateMs||0)-(a.dateMs||0);
  return (b.dateMs||0)-(a.dateMs||0)||normalize(a.title).localeCompare(normalize(b.title),'pt-BR');
 });
 for(const item of items)list.append(item.el);
 const empty=$('#repositoryFilteredEmpty');const visible=items.some(item=>!item.el.hidden);if(!visible&&items.length){if(!empty){const e=document.createElement('div');e.id='repositoryFilteredEmpty';e.className='crono-empty';e.textContent='Nenhum item encontrado com esses filtros.';list.append(e)}}else empty?.remove();
}
function refresh(){organize();if($('#repositoryDeck')?.open)showDeck()}
function syncAdminPackages(render=true){
 if(!app().isAdmin||!adminPackages)return;
 const next=[...adminPackages.values()].sort((a,b)=>millis(b.updatedAt||b.ts)-millis(a.updatedAt||a.ts));
 const current=app().state.repositoryPackages||[];
 const same=current.length===next.length&&current.every((p,i)=>p.id===next[i]?.id);
 if(same)return;
 app().state.repositoryPackages=next;
 if(render&&!adminSyncing){adminSyncing=true;queueMicrotask(()=>{try{root.renderPubs?.()}finally{adminSyncing=false}})}
}
function installCoordinatorPackageAccess(){
 if(!app().isAdmin||adminPackagesUnsub||!root.fbFns||!root.db)return;
 const f=root.fbFns;
 try{
  adminPackagesUnsub=f.onSnapshot(f.collection(root.db,'rede_repository_packages'),snap=>{
   adminPackages=new Map(snap.docs.map(d=>[d.id,{...d.data(),id:d.id}]));
   syncAdminPackages(true);
  },err=>{
   if(err?.code==='permission-denied')console.warn('Repositório do coordenador: publique a regra que permite leitura de todas as pastas ao coordenador.');
   else console.warn('Repositório do coordenador',err);
  });
 }catch(err){console.warn('Repositório do coordenador',err)}
}
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
 root.switchView('conversas');root.openPrivateThread(tid);
 root.repositoryMessageContext={id,threadId:tid,version:files().currentVersion(p),targetId:target};
 const input=$('#privateInput');if(input){const context=`Sobre o arquivo “${files().publicationTitle(p)}” que me enviou`;input.value=input.value?input.value+'\n'+context:context;input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();}
}
async function download(id){
 await files().downloadPublication(id);
 if(!id.startsWith('package:'))return;
 try{
  const p=await files().getPublication(id,true);if(!p)return;
  for(const card of document.querySelectorAll('[data-file-id]')){
   if(card.dataset.fileId!==id)continue;
   const wasOpen=card.querySelector('details')?.open,scroll=card.querySelector('ol')?.scrollTop||0;
   const template=document.createElement('template');template.innerHTML=cardHTML(p);const replacement=template.content.firstElementChild;
   replacement.querySelector('details').open=wasOpen;card.replaceWith(replacement);replacement.querySelector('ol').scrollTop=scroll;
  }
 }catch(err){console.warn('Atualização do histórico',err);root.toast('Arquivo baixado. Reabra a pasta para atualizar o histórico.')}
}
async function preview(id){
 const p=await files().getPublication(id,true);if(!p?.url)throw Error('Arquivo indisponível.');
 const host=$('#repositoryPreview'),overlay=$('#filePreviewOverlay');if(!overlay)throw Error('Visualizador indisponível.');
 if(overlay.parentElement!==host){previewHome=overlay.parentNode;previewNext=overlay.nextSibling;host.append(overlay)}
 if(!host.open)host.showModal();
 const loading=root.openFilePreview(p.url,files().publicationTitle(p));
 const link=$('#filePreviewDownload');if(link){link.removeAttribute('href');link.onclick=async e=>{e.preventDefault();try{await download(id)}catch(err){root.toast(err.message)}}}
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
 try{if(action==='download')await download(id);else if(action==='preview')await preview(id);else if(action==='message')await openMessage(id);else if(action==='return')await openReturn(id)}catch(err){console.error('Repository',err);root.toast(err.message||'Não foi possível concluir.')}finally{locks.delete(key);button.disabled=false}
}
function buildOrganizer(list){
 const old=$('#repositoryOrganizer');old?.remove();hideLegacyRepositoryUi();
 const toolbar=document.createElement('div');toolbar.id='repositoryOrganizer';
 toolbar.innerHTML='<label>Pessoa<select id="repositoryPerson"><option value="">Todas as pessoas</option></select></label><label>Categoria<select id="repositoryCategory"><option value="">Todas as categorias</option></select></label><label>Data<input id="repositoryDate" type="date" aria-label="Filtrar por data"></label><label>Organizar<select id="repositoryMode"><option value="date">Mais recentes</option><option value="dateAsc">Mais antigos</option><option value="person">A–Z · Pessoas</option><option value="title">A–Z · Títulos</option><option value="pending">Pendentes para mim</option></select></label><label>Pesquisar<input id="repositorySearch" type="search" placeholder="Pessoa, categoria, pasta ou arquivo"></label>';
 list.before(toolbar);
 toolbar.addEventListener('change',organize);$('#repositorySearch').addEventListener('input',organize);
 const legacyCategory=$('#pubCategoria'),legacyPerson=$('#pubPessoa'),legacyMine=$('#pubMine');if(legacyCategory)legacyCategory.value='';if(legacyPerson)legacyPerson.value='';if(legacyMine)legacyMine.checked=false;
 organize();
}
function boot(){
 dialog('repositoryDeck','<header><b>Arquivo Vivo</b><button type="button" data-deck-close aria-label="Fechar">×</button></header><div id="repositoryStage"></div><nav><button type="button" data-deck-prev>← Anterior</button><span id="repositoryCount"></span><button type="button" data-deck-next>Próximo →</button></nav>');
 dialog('repositoryReturn','<form><header><h2>Devolver arquivo</h2><button type="button" data-return-close aria-label="Fechar">×</button></header><p id="returnTitle"></p><label>Para<select id="returnRecipient" required></select></label><label>Nova versão<input type="file" name="file" required></label><label>Mensagem<textarea name="message" required maxlength="4400" rows="5" placeholder="Conte o que mudou e o que precisa ser feito."></textarea></label><footer><button type="button" data-return-close>Cancelar</button><button type="submit" class="primary">Enviar arquivo + mensagem</button></footer></form>');
 dialog('repositoryPreview','');
 dialog('repositoryRecipient','<form method="dialog"><h2>Conversar sobre o arquivo</h2><label>Com quem?<select id="messageRecipient"></select></label><footer><button value="cancel">Cancelar</button><button value="choose" class="primary">Abrir conversa</button></footer></form>');
 $('#repositoryRecipient').addEventListener('close',()=>{const resolve=recipientRequest;recipientRequest=null;resolve?.($('#repositoryRecipient').returnValue==='choose'?$('#messageRecipient').value:null)});
 $('#repositoryPreview').addEventListener('close',()=>{if($('#repositoryPreview').open)return;const overlay=$('#filePreviewOverlay');if(overlay&&previewHome){previewHome.insertBefore(overlay,previewNext?.parentNode===previewHome?previewNext:null);previewHome=null;overlay.classList.remove('open');const download=$('#filePreviewDownload');if(download)download.onclick=null}});
 document.addEventListener('click',onAction);
 document.addEventListener('dblclick',e=>{if(e.target.closest('button,a,input,summary,select'))return;const card=e.target.closest('#pubList > [data-file-id]');if(card)openDeck(card.dataset.fileId)});
 const list=$('#pubList');if(list){buildOrganizer(list);const existing=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='▣ Folhear arquivos');existing?.remove();const button=document.createElement('button');button.type='button';button.className='btn';button.textContent='▣ Folhear arquivos';button.onclick=()=>{const id=list.querySelector('[data-file-id]:not([hidden])')?.dataset.fileId;if(id)openDeck(id);else root.toast('Nenhum arquivo nestes filtros.')};list.before(button)}
 $('#repositoryDeck').addEventListener('click',e=>{if(e.target.closest('[data-deck-close]'))closeDeck();if(e.target.closest('[data-deck-prev]')&&deckIndex>0){deckIndex--;showDeck()}if(e.target.closest('[data-deck-next]')&&deckIndex<deckIds.length-1){deckIndex++;showDeck()}});
 $('#repositoryReturn form').addEventListener('submit',submitReturn);
 $('#repositoryReturn').addEventListener('click',e=>{if(e.target.closest('[data-return-close]')&&!busy)$('#repositoryReturn').close()});
 $('#repositoryReturn').addEventListener('cancel',e=>{if(busy)e.preventDefault()});
 $('#repositoryPreview').addEventListener('cancel',()=>root.closeOverlay?.('filePreviewOverlay'));
 document.addEventListener('carbonautas:repository-rendered',()=>{syncAdminPackages(false);refresh()});
 root.addEventListener?.('firebase-ready',installCoordinatorPackageAccess);
 installCoordinatorPackageAccess();
 root.renderPubs?.();
}
root.CarbonautasRepository={cardHTML,openDeck,closeDeck,openMessage,preview,openReturn,refresh,organize,installCoordinatorPackageAccess};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(globalThis);
