/* Carbonautas runtime integrity
   - preserves existing profile data/photo when a new photo upload fails
   - writes only self-edit fields allowed by Firestore rules
   - retries Acompanhamento actions after the lazy modules are actually ready
   - closes stacked Acompanhamento/Repository UI before opening private chat
   - links the signed-in name to the member profile
   - keeps direct private chat from being blocked by stale directory state
   - freezes the network graph after layout calculation
   - keeps the secure in-app Repository preview available
   - fixes mobile modal/nav overlap and makes complete/delete feel immediate
   - no data migration, no VPS changes
*/
(function(root){
'use strict';
if(root.__CARBONAUTAS_RUNTIME_INTEGRITY)return;
root.__CARBONAUTAS_RUNTIME_INTEGRITY=true;

const $=(s,r=document)=>r.querySelector(s);
let profileBusy=false,messageBusy=false,graphInstalled=false,polishQueued=false;
let confirmRequest=null;
const pendingActivityCompletions=new Set(),pendingPublicationDeletes=new Set();

function app(){return root.CarbonautasApp||{state:{},memberId:'',isAdmin:false}}
function toastSafe(msg){try{if(typeof toast==='function')return toast(msg)}catch(_e){};root.toast?.(msg)}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]))}
function currentEditingId(){try{return editingId||null}catch(_e){return null}}
function currentFormPhoto(){try{return formFoto||''}catch(_e){return $('#mFoto')?.value?.trim()||''}}
function currentLines(){try{return [...formLinhas]}catch(_e){return[]}}
function currentResults(){try{return (formResultados||[]).filter(r=>r?.titulo||r?.url)}catch(_e){return[]}}
function currentDeadlines(){try{return (formPrazos||[]).filter(p=>p?.titulo)}catch(_e){return[]}}
function currentLinks(){try{return (formVinculos||[]).filter(v=>v?.id)}catch(_e){return[]}}
function memberByIdSafe(id){return (app().state.members||[]).find(m=>String(m?.id)===String(id))||null}
function canEdit(id){try{return typeof canEditMember==='function'?!!canEditMember(id):(app().isAdmin||app().memberId===id)}catch(_e){return app().isAdmin||app().memberId===id}}
function closeMember(){try{if(typeof closeOverlay==='function')closeOverlay('memberOverlay');else root.closeOverlay?.('memberOverlay')}catch(_e){}}
function serverTimestamp(){return root.fbFns?.serverTimestamp?.()||new Date()}
function setMember(id,data){const f=root.fbFns;if(!f||!root.db)throw new Error('Firebase ainda não está pronto.');return f.setDoc(f.doc(root.db,'rede_members',id),data,{merge:true})}
function newMemberId(){try{if(typeof uid==='function')return uid()}catch(_e){}return 'm'+Math.random().toString(36).slice(2,9)}
async function uploadPhoto(key,dataUrl){try{if(typeof fbUploadImage==='function')return await fbUploadImage(key,dataUrl)}catch(e){throw e}throw new Error('Upload de imagem indisponível.')}
async function cleanupPhoto(payload,options){try{if(typeof deleteStorageArtifacts==='function')return await deleteStorageArtifacts(payload,options)}catch(e){console.warn('Limpeza de foto',e)}return[]}
async function cleanupPublication(payload,options){try{if(typeof deleteStorageArtifacts==='function')return await deleteStorageArtifacts(payload,options)}catch(e){console.warn('Limpeza de publicação',e)}return[]}

function selfPayload(photoUrl){
 return {
  nome:$('#mNome')?.value.trim()||'',
  telefone:$('#mTelefone')?.value.trim()||'',
  tema:$('#mTema')?.value.trim()||'',
  plataforma:$('#mPlataforma')?.value.trim()||'',
  driveLink:$('#mDrive')?.value.trim()||'',
  notas:$('#mNotas')?.value.trim()||'',
  linhas:currentLines(),resultados:currentResults(),prazos:currentDeadlines(),foto:photoUrl,
  hub:!!$('#mHub')?.checked,hubMotivo:$('#mHubMotivo')?.value.trim()||'',vinculos:currentLinks()
 };
}
function adminPayload(photoUrl){
 return {
  ...selfPayload(photoUrl),
  nivel:$('#mNivel')?.value||'doutorado',programa:$('#mPrograma')?.value.trim()||'',status:$('#mStatus')?.value||'ativo',
  bolsista:!!$('#mBolsista')?.checked,bolsaModalidade:$('#mBolsaModalidade')?.value.trim()||'',bolsaInicio:$('#mBolsaInicio')?.value||'',bolsaFim:$('#mBolsaFim')?.value||'',
  origem:$('#mOrigem')?.value.trim()||''
 };
}

async function saveMemberRobust(){
 if(profileBusy)return;
 const id=currentEditingId(),nome=$('#mNome')?.value.trim()||'';
 if(!nome)return toastSafe('Informe o nome.');
 if(id&&!canEdit(id))return toastSafe('Sem permissão para editar este cadastro.');
 if(!id&&!app().isAdmin)return toastSafe('Só o coordenador pode cadastrar novos membros.');
 const button=$('#saveMember'),oldMember=id?memberByIdSafe(id):null,oldFoto=oldMember?.foto||'';
 let fotoUrl=currentFormPhoto(),uploaded=null,photoWarning='';
 profileBusy=true;if(button){button.disabled=true;button.dataset.runtimeSaving='1';button.textContent='Salvando…'}
 try{
  if(fotoUrl&&fotoUrl.startsWith('data:')){
   try{uploaded=await uploadPhoto('membro_'+(id||nome.replace(/\s+/g,'_')),fotoUrl);fotoUrl=uploaded.url}
   catch(e){console.error('Upload de foto',e);fotoUrl=oldFoto;photoWarning=oldFoto?' A foto anterior foi preservada.':' O cadastro foi salvo sem foto.'}
  }
  const data=app().isAdmin?adminPayload(fotoUrl):selfPayload(fotoUrl),target=id||newMemberId();
  if(!id)data.createdAt=serverTimestamp();
  await setMember(target,id?data:{id:target,...data});
  if(oldFoto&&oldFoto!==fotoUrl)cleanupPhoto({url:oldFoto}).then(failed=>{if(failed?.length)console.warn('Foto anterior não removida',failed)});
  closeMember();
  toastSafe((id?'Perfil atualizado.':'Aluno cadastrado.')+photoWarning);
 }catch(e){
  if(uploaded)await cleanupPhoto({storagePath:uploaded.path,url:uploaded.url},{allowUrlFallback:false});
  console.error('Falha ao salvar perfil',e);
  toastSafe(e?.code==='permission-denied'?'O Firestore bloqueou este salvamento. Os dados anteriores foram preservados.':'Erro ao salvar. Os dados anteriores foram preservados.');
 }finally{
  profileBusy=false;if(button){button.disabled=false;delete button.dataset.runtimeSaving;button.textContent='Salvar'}
 }
}

function openOwnProfile(){
 const id=String(app().memberId||'');
 if(!id||typeof root.openMember!=='function')return false;
 root.openMember(id);return true;
}

const actions={
 activity:{fn:'openActivity',args:(el,mid)=>[null,mid]},
 dossier:{fn:'openDossier',args:(el,mid)=>[mid],needsDossier:true},
 repo:{fn:'openMemberRepository',args:(el,mid)=>[mid]},
 'academic-edit':{fn:'openAcademicCardEditor',args:(el,mid)=>[mid]},
 'academic-download':{fn:'downloadAcademicCard',args:(el,mid)=>[mid]},
 'academic-share':{fn:'shareAcademicCard',args:(el,mid)=>[mid]},
 project:{fn:'openProjectProfile',args:(el,mid)=>[mid]},
 checkin:{fn:'openCheckin',args:(el,mid)=>[mid]},
 product:{fn:'openProduct',args:(el,mid)=>[mid]},
 preset:{fn:'openActivityPreset',args:(el,mid)=>[el.dataset.kind||'pendencia',mid]},
 edit:{fn:'openActivity',args:el=>[el.dataset.id]}
};
function deckMemberId(){const name=$('#p97DeckName')?.textContent?.trim();return (app().state.members||[]).find(m=>m.nome===name)?.id||''}
async function ensureActionReady(spec){
 const loader=root.CarbonautasLoader;
 if(spec.needsDossier)await loader?.ensureDossier?.();
 else await loader?.whenTrackReady?.();
 for(let i=0;i<20;i++){if(typeof root[spec.fn]==='function')return root[spec.fn];await new Promise(r=>setTimeout(r,25))}
 return null;
}
async function rescueTrackAction(el){
 const spec=actions[el.dataset.p97Action];if(!spec)return;
 const existing=root[spec.fn];if(typeof existing==='function')return false;
 const mid=el.dataset.mid||deckMemberId();
 const fn=await ensureActionReady(spec);if(typeof fn!=='function'){toastSafe('Esta ação não terminou de carregar. Reabra a ficha e tente novamente.');return true}
 fn(...spec.args(el,mid));return true;
}

function closeTrackingDeck(){
 const deck=$('#p97Deck');if(!deck||deck.hidden)return;
 const close=deck.querySelector('[data-p97-close]');
 if(close){close.click();return}
 deck.hidden=true;const stage=$('#p97Stage');if(stage)stage.innerHTML='';document.documentElement.style.overflow='';
}
async function routeRepositoryMessage(button){
 if(messageBusy)return;
 const card=button.closest('[data-file-id]'),id=card?.dataset.fileId;if(!id)return;
 const repo=root.CarbonautasRepository;if(!repo?.openMessage)return toastSafe('O Repositório ainda não terminou de carregar.');
 messageBusy=true;button.disabled=true;
 try{
  closeTrackingDeck();
  await repo.openMessage(id);
  const input=$('#privateInput');
  if(document.body?.dataset?.view!=='conversas')root.switchView?.('conversas');
  requestAnimationFrame(()=>{input?.focus?.();input?.scrollIntoView?.({block:'nearest'})});
 }catch(e){console.error('Mensagem do Repositório',e);toastSafe(e?.message||'Não foi possível abrir a conversa privada.')}finally{messageBusy=false;button.disabled=false}
}

function privateStarter(){
 try{if(typeof startPrivateConversation==='function')return startPrivateConversation}catch(_e){}
 return typeof root.startPrivateConversation==='function'?root.startPrivateConversation:null;
}
function privateAvatar(m){
 if(m?.foto)return `<span class="private-av"><img src="${esc(m.foto)}" alt=""></span>`;
 const ini=String(m?.nome||'?').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'?';
 return `<span class="private-av">${esc(ini)}</span>`;
}
function renderPrivatePeopleRobust(){
 const box=$('#privatePeopleList');if(!box)return;
 const term=String($('#privatePersonSearch')?.value||'').trim().toLowerCase(),me=String(app().memberId||'');
 const rows=(app().state.members||[]).filter(m=>String(m?.id)!==me&&m?.status!=='inativo'&&(!term||String(m?.nome||'').toLowerCase().includes(term))).sort((a,b)=>String(a?.nome||'').localeCompare(String(b?.nome||''),'pt-BR'));
 if(!rows.length){box.innerHTML='<div class="private-empty-list" style="color:#657582">Nenhuma pessoa encontrada.</div>';return}
 box.innerHTML=rows.map(m=>`<div class="private-person-row">${privateAvatar(m)}<div class="private-person-main"><b>${esc(m.nome||'Carbonauta')}</b><small>A conta será verificada ao abrir a conversa</small></div><button type="button" data-runtime-private-person="${esc(m.id)}">Conversar</button></div>`).join('');
 box.querySelectorAll('[data-runtime-private-person]').forEach(button=>button.onclick=async()=>{
  const start=privateStarter();if(!start)return toastSafe('O chat privado ainda não terminou de carregar.');
  const old=button.textContent;button.disabled=true;button.textContent='Abrindo…';
  try{await start(button.dataset.runtimePrivatePerson)}catch(e){console.error('Nova conversa',e);toastSafe(e?.message||'Não foi possível abrir a conversa.')}finally{button.disabled=false;button.textContent=old}
 });
}
function openPrivateNewRobust(){
 const original=root.openPrivateNew;
 if(typeof original!=='function')return toastSafe('O chat privado ainda não terminou de carregar.');
 original();renderPrivatePeopleRobust();
 const search=$('#privatePersonSearch');if(search)search.oninput=renderPrivatePeopleRobust;
}
function installPrivateAccess(){
 const button=$('#privateNewBtn'),search=$('#privatePersonSearch');
 if(button)button.onclick=openPrivateNewRobust;
 if(search)search.oninput=renderPrivatePeopleRobust;
}

function graphSimulation(){try{return typeof simulation!=='undefined'?simulation:null}catch(_e){return null}}
function unpinGraphMembers(){for(const m of app().state.members||[]){if(!m)continue;m.fx=null;m.fy=null}}
function settleGraph(){
 const sim=graphSimulation();if(!sim)return false;
 try{
  sim.alphaTarget?.(0);sim.alpha?.(1);sim.tick?.(220);
  const tick=sim.on?.('tick');if(typeof tick==='function')tick();
  for(const n of sim.nodes?.()||[]){if(Number.isFinite(n?.x)&&Number.isFinite(n?.y)){n.fx=n.x;n.fy=n.y}}
  sim.stop?.();return true;
 }catch(e){console.warn('Estabilização do grafo',e);return false}
}
function installGraphFreeze(){
 if(graphInstalled)return;
 let original=null;try{original=root.renderGraph||renderGraph}catch(_e){}
 if(typeof original!=='function')return;
 if(original.__runtimeFrozen){graphInstalled=true;settleGraph();return}
 const frozen=function(){unpinGraphMembers();const result=original.apply(this,arguments);settleGraph();return result};
 frozen.__runtimeFrozen=true;frozen.__runtimeOriginal=original;
 try{renderGraph=frozen}catch(_e){}root.renderGraph=frozen;graphInstalled=true;settleGraph();
 root.addEventListener?.('resize',()=>setTimeout(settleGraph,0));
}

function restoreRepositoryPreview(){
 $('#runtimeNoRepositoryPreview')?.remove();
 return true;
}

function installMobilePolish(){
 let style=$('#runtimeMobilePolish');
 if(!style){
  style=document.createElement('style');style.id='runtimeMobilePolish';style.textContent=`
  .runtime-modal-open .soft-bottom-nav{display:none!important}
  #runtimeConfirmDialog{color:#173640;background:#fff;border:0;border-radius:22px;padding:0;width:min(420px,calc(100vw - 28px));box-shadow:0 28px 90px rgba(4,28,38,.34)}
  #runtimeConfirmDialog::backdrop{background:rgba(6,27,36,.66);backdrop-filter:blur(4px)}
  #runtimeConfirmDialog .runtime-confirm-body{padding:22px 22px 13px}#runtimeConfirmDialog h3{margin:0 0 9px;font-size:21px}#runtimeConfirmDialog p{margin:0;color:#5d727a;line-height:1.45;overflow-wrap:anywhere}
  #runtimeConfirmDialog footer{display:grid;grid-template-columns:1fr 1fr;gap:9px;padding:13px 22px 22px}#runtimeConfirmDialog button{min-height:48px;border:1px solid #d6e2e4;border-radius:14px;background:#fff;color:#23434c;font:inherit;font-weight:850}#runtimeConfirmDialog .primary{background:#0e8188;border-color:#0e8188;color:#fff}
  @media(max-width:760px){
   #pubOverlay{padding:7px 7px calc(7px + env(safe-area-inset-bottom))!important;align-items:stretch!important;overflow:hidden!important}
   #pubOverlay>.modal{width:100%!important;max-width:none!important;height:calc(100dvh - 14px - env(safe-area-inset-bottom))!important;max-height:none!important;margin:0!important;border-radius:22px!important;display:flex!important;flex-direction:column!important;overflow:hidden!important}
   #pubOverlay .modal-h{flex:0 0 auto!important;padding:14px 15px!important}
   #pubOverlay .modal-h h2{font-size:20px!important;line-height:1.1!important}
   #pubOverlay .modal-b{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;padding:15px!important}
   #pubOverlay .modal-f{flex:0 0 auto!important;position:relative!important;bottom:auto!important;z-index:5!important;display:grid!important;grid-template-columns:1fr 1fr!important;padding:10px 15px calc(10px + env(safe-area-inset-bottom))!important;background:#fff!important}
   #pubOverlay .modal-f .btn{width:100%!important;min-width:0!important;min-height:48px!important;white-space:normal!important}
   #p66ActionOverlay{padding:7px 7px calc(7px + env(safe-area-inset-bottom))!important;align-items:stretch!important;overflow:hidden!important}
   #p66ActionOverlay .p66-card{width:100%!important;max-width:none!important;height:calc(100dvh - 14px - env(safe-area-inset-bottom))!important;max-height:none!important;border-radius:22px!important;display:flex!important;flex-direction:column!important;overflow:hidden!important}
   #p66ActionOverlay .p66-head{flex:0 0 auto!important;padding:15px!important}.p66-title{font-size:23px!important}
   #p66ActionOverlay .p66-body{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;padding:15px!important}
   #p66ActionOverlay .p66-foot{flex:0 0 auto!important;display:grid!important;grid-template-columns:1fr!important;gap:8px!important;padding:10px 15px calc(10px + env(safe-area-inset-bottom))!important;background:#fff!important;border-top:1px solid #e4ecee!important}
   #p66ActionOverlay .p66-foot .btn,#p66ActionOverlay .p66-edit,#p66ActionOverlay .p66-primary{grid-column:auto!important;width:100%!important;min-width:0!important;min-height:46px!important;margin:0!important;white-space:normal!important;text-align:center!important;justify-content:center!important}
   #filePreviewOverlay{padding:0!important;align-items:stretch!important}
   #filePreviewOverlay>.modal,#filePreviewOverlay .file-preview-modal{width:100vw!important;max-width:none!important;height:100dvh!important;max-height:none!important;margin:0!important;border-radius:0!important}
   #repositoryPreview{width:100vw!important;height:100dvh!important;max-width:none!important;max-height:none!important;margin:0!important;border-radius:0!important}
   #repositoryPreview #filePreviewOverlay>.modal{border-radius:0!important}
   #p195Deck .p195-detail{overflow-wrap:anywhere!important}
  }`;
  document.head.append(style)
 }
 return style;
}

function ensureConfirmDialog(){
 let d=$('#runtimeConfirmDialog');if(d)return d;
 d=document.createElement('dialog');d.id='runtimeConfirmDialog';d.innerHTML='<div class="runtime-confirm-body"><h3 id="runtimeConfirmTitle">Confirmar</h3><p id="runtimeConfirmText"></p></div><footer><button type="button" data-runtime-confirm="cancel">Cancelar</button><button type="button" class="primary" data-runtime-confirm="ok">Confirmar</button></footer>';document.body.append(d);
 d.addEventListener('click',e=>{const b=e.target.closest('[data-runtime-confirm]');if(!b)return;const ok=b.dataset.runtimeConfirm==='ok';const resolve=confirmRequest;confirmRequest=null;try{d.close(ok?'ok':'cancel')}catch(_e){}resolve?.(ok)});
 d.addEventListener('cancel',e=>{e.preventDefault();const resolve=confirmRequest;confirmRequest=null;try{d.close('cancel')}catch(_e){}resolve?.(false)});
 return d;
}
function askConfirm(title,text,confirmLabel='Confirmar'){
 const d=ensureConfirmDialog(),h=$('#runtimeConfirmTitle'),p=$('#runtimeConfirmText'),ok=d.querySelector('[data-runtime-confirm="ok"]');if(h)h.textContent=title;if(p)p.textContent=text||'';if(ok)ok.textContent=confirmLabel;
 if(typeof d.showModal!=='function')return Promise.resolve(root.confirm?root.confirm([title,text].filter(Boolean).join('\n\n')):true);
 if(confirmRequest){const old=confirmRequest;confirmRequest=null;old(false);try{d.close()}catch(_e){}}
 return new Promise(resolve=>{confirmRequest=resolve;try{d.showModal()}catch(_e){confirmRequest=null;resolve(root.confirm?root.confirm([title,text].filter(Boolean).join('\n\n')):true)}})
}

function activityDone(a){const s=String(a?.status||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();return a?.done===true||['concluido','concluida','done','finalizado','finalizada'].includes(s)}
function renderPanelNow(){try{root.renderPainel?.()}catch(e){console.warn('Atualização do Painel',e)}}
function renderRepositoryNow(){try{root.renderPubs?.()}catch(e){console.warn('Atualização do Repositório',e)}}
function closeActionDetail(){try{$('#p66ActionOverlay')?.classList.remove('open')}catch(_e){}}
function hidePendingItems(){
 for(const id of pendingPublicationDeletes){document.querySelectorAll('[data-publication-id]').forEach(el=>{if(String(el.dataset.publicationId)===String(id))el.style.setProperty('display','none','important')})}
 for(const id of pendingActivityCompletions){document.querySelectorAll('#dashAttention .p56-task').forEach(card=>{const key=String(card.dataset.p69Key||card.dataset.p76Key||'');const txt=[...card.querySelectorAll('button')].map(b=>b.getAttribute('onclick')||'').join(' ');if(key===`activity:${id}`||txt.includes(`'${id}'`)||txt.includes(`\"${id}\"`))card.style.setProperty('display','none','important')})}
}
async function completeActivityFast(id){
 id=String(id||'');if(!id||pendingActivityCompletions.has(id))return;
 const a=(app().state.activities||[]).find(x=>String(x?.id)===id);if(!a)return toastSafe('Item não encontrado.');
 if(activityDone(a))return toastSafe('Este item já está concluído.');
 if(!(app().isAdmin||String(a.ownerId||'')===String(app().memberId||'')))return toastSafe('Você não pode concluir este item.');
 if(!(await askConfirm('Marcar como concluído?',a.title||'Este item irá para Feitos.','Concluir')))return;
 const f=root.fbFns;if(!f||!root.db||typeof f.updateDoc!=='function')return toastSafe('O Firebase ainda não terminou de carregar.');
 const oldStatus=a.status,oldUpdated=a.updatedAt;pendingActivityCompletions.add(id);a.status='concluido';a.updatedAt=new Date();closeActionDetail();renderPanelNow();hidePendingItems();toastSafe('Concluindo…');
 try{
  await f.updateDoc(f.doc(root.db,'rede_activities',id),{status:'concluido',updatedAt:f.serverTimestamp()});
  const label=a.title||'Atividade concluída';
  try{if(typeof root.awardPoints==='function'){await root.awardPoints(a.ownerId,'activity_completed',id,label);if(a.dueDate)await root.awardPoints(a.ownerId,'deadline_done',id,label)}}catch(e){console.warn('Pontuação da conclusão',e)}
  toastSafe('✓ Concluído. O item foi para Feitos.');
  setTimeout(renderPanelNow,0);
 }catch(e){
  a.status=oldStatus;a.updatedAt=oldUpdated;console.error('Conclusão',e);toastSafe('Não foi possível concluir este item. A alteração foi desfeita.');renderPanelNow();
 }finally{setTimeout(()=>{pendingActivityCompletions.delete(id);hidePendingItems()},900)}
}
async function deletePublicationFast(id){
 id=String(id||'');if(!id||pendingPublicationDeletes.has(id))return;
 const original=root.deletePublicacao?.__runtimeOriginal;
 if(id.startsWith('package:'))return typeof original==='function'?original(id):toastSafe('Esta pasta precisa ser aberta para excluir o arquivo.');
 if(!(await askConfirm('Excluir publicação?','Ela será removida do Repositório.','Excluir')))return;
 const f=root.fbFns;if(!f||!root.db||typeof f.deleteDoc!=='function')return toastSafe('O Firebase ainda não terminou de carregar.');
 const list=app().state.publicacoes||[],index=list.findIndex(p=>String(p?.id)===id),pub=index>=0?list[index]:null;
 pendingPublicationDeletes.add(id);if(index>=0)list.splice(index,1);renderRepositoryNow();hidePendingItems();toastSafe('Excluindo…');
 try{
  await f.deleteDoc(f.doc(root.db,'rede_publicacoes',id));
  const failed=pub?await cleanupPublication(pub,{allowUrlFallback:pub.sourcePersonalRepo!==true}):[];
  toastSafe(failed?.length?'Publicação removida. Alguns arquivos físicos não puderam ser apagados do Storage.':'Publicação removida.');
 }catch(e){
  console.error('Exclusão',e);if(pub&&!list.some(p=>String(p?.id)===id))list.splice(Math.max(0,index),0,pub);toastSafe('Erro ao excluir. A publicação voltou para a lista.');renderRepositoryNow();
 }finally{setTimeout(()=>{pendingPublicationDeletes.delete(id);hidePendingItems()},900)}
}
function installFastMutations(){
 const complete=root.p56CompleteActivity;if(typeof complete==='function'&&!complete.__runtimeFast){const wrapped=id=>completeActivityFast(id);wrapped.__runtimeFast=true;wrapped.__runtimeOriginal=complete;root.p56CompleteActivity=wrapped}
 const del=root.deletePublicacao;if(typeof del==='function'&&!del.__runtimeFast){const wrapped=id=>deletePublicationFast(id);wrapped.__runtimeFast=true;wrapped.__runtimeOriginal=del;root.deletePublicacao=wrapped}
}

function separateAttentionText(){
 document.querySelectorAll('.p56-detail').forEach(detail=>{
  const direct=[...detail.childNodes];for(let i=1;i<direct.length;i++){const prev=direct[i-1],cur=direct[i];if(prev?.nodeType===1&&cur?.nodeType===1)detail.insertBefore(document.createTextNode(' '),cur)}
  detail.querySelectorAll('.p68-decision,.p69-decision').forEach(row=>{const nodes=[...row.childNodes];for(let i=1;i<nodes.length;i++){const prev=nodes[i-1],cur=nodes[i];if(prev?.nodeType===1&&cur?.nodeType===1)row.insertBefore(document.createTextNode(' '),cur)}})
 });
}
function modalOpen(){return !!($('#pubOverlay.open')||$('#p66ActionOverlay.open')||$('#filePreviewOverlay.open')||$('#repositoryPreview[open]')||$('#runtimeConfirmDialog[open]'))}
function polishUi(){separateAttentionText();hidePendingItems();document.body?.classList.toggle('runtime-modal-open',modalOpen())}
function schedulePolish(){if(polishQueued)return;polishQueued=true;(root.requestAnimationFrame||root.setTimeout)(()=>{polishQueued=false;polishUi()},0)}
function installPolishObserver(){
 installMobilePolish();polishUi();if(!document.body)return;
 const obs=new MutationObserver(schedulePolish);obs.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','open','hidden']});
}

function boot(){
 installPrivateAccess();installGraphFreeze();restoreRepositoryPreview();installMobilePolish();installFastMutations();installPolishObserver();
 root.addEventListener?.('firebase-ready',()=>{installFastMutations();schedulePolish()});
 [300,900,1800,3200].forEach(ms=>setTimeout(()=>{installFastMutations();schedulePolish()},ms));
 document.addEventListener('carbonautas:repository-rendered',()=>{restoreRepositoryPreview();schedulePolish()});
 document.addEventListener('click',e=>{
  const identity=e.target.closest?.('#idChip');
  if(identity&&app().memberId&&typeof root.openMember==='function'){e.preventDefault();e.stopImmediatePropagation();openOwnProfile();return}
  const save=e.target.closest?.('#saveMember');
  if(save){e.preventDefault();e.stopImmediatePropagation();saveMemberRobust();return}
  const message=e.target.closest?.('[data-file-action="message"]');
  if(message){e.preventDefault();e.stopImmediatePropagation();routeRepositoryMessage(message);return}
  const action=e.target.closest?.('#p97Deck [data-p97-action]');
  if(!action)return;
  const spec=actions[action.dataset.p97Action];if(!spec||typeof root[spec.fn]==='function')return;
  e.preventDefault();e.stopImmediatePropagation();rescueTrackAction(action).catch(err=>{console.error('Ação do Acompanhamento',err);toastSafe('Não foi possível abrir esta ação.')});
 },true);
}

root.CarbonautasRuntimeIntegrity={saveMember:saveMemberRobust,rescueTrackAction,routeRepositoryMessage,closeTrackingDeck,openOwnProfile,renderPrivatePeople:renderPrivatePeopleRobust,settleGraph,restoreRepositoryPreview,installMobilePolish,askConfirm,completeActivity:completeActivityFast,deletePublication:deletePublicationFast,separateAttentionText,installFastMutations};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(globalThis);
