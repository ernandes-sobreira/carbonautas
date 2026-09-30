/* Carbonautas runtime integrity
   - preserves existing profile data/photo when a new photo upload fails
   - writes only self-edit fields allowed by Firestore rules
   - retries Acompanhamento actions after the lazy modules are actually ready
   - closes stacked Acompanhamento/Repository UI before opening private chat
   - links the signed-in name to the member profile
   - keeps direct private chat from being blocked by stale directory state
   - freezes the network graph after layout calculation
   - removes unreliable in-app Repository previews; download remains canonical
   - no data migration, no VPS changes
*/
(function(root){
'use strict';
if(root.__CARBONAUTAS_RUNTIME_INTEGRITY)return;
root.__CARBONAUTAS_RUNTIME_INTEGRITY=true;

const $=(s,r=document)=>r.querySelector(s);
let profileBusy=false,messageBusy=false,graphInstalled=false;

function app(){return root.CarbonautasApp||{state:{},memberId:'',isAdmin:false}}
function toastSafe(msg){try{if(typeof toast==='function')return toast(msg)}catch(_e){};root.toast?.(msg)}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
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

function removeRepositoryPreview(){
 let style=$('#runtimeNoRepositoryPreview');
 if(!style){style=document.createElement('style');style.id='runtimeNoRepositoryPreview';style.textContent='[data-file-action="preview"]{display:none!important}';document.head.append(style)}
 try{root.closeOverlay?.('filePreviewOverlay')}catch(_e){}
 const dialog=$('#repositoryPreview');try{if(dialog?.open)dialog.close()}catch(_e){}
 return true;
}

function boot(){
 installPrivateAccess();installGraphFreeze();removeRepositoryPreview();
 document.addEventListener('carbonautas:repository-rendered',removeRepositoryPreview);
 document.addEventListener('click',e=>{
  const identity=e.target.closest?.('#idChip');
  if(identity&&app().memberId&&typeof root.openMember==='function'){e.preventDefault();e.stopImmediatePropagation();openOwnProfile();return}
  const save=e.target.closest?.('#saveMember');
  if(save){e.preventDefault();e.stopImmediatePropagation();saveMemberRobust();return}
  const preview=e.target.closest?.('[data-file-action="preview"]');
  if(preview){e.preventDefault();e.stopImmediatePropagation();toastSafe('A prévia dentro do Carbonautas foi removida. Use Baixar para abrir o arquivo no aplicativo adequado.');return}
  const message=e.target.closest?.('[data-file-action="message"]');
  if(message){e.preventDefault();e.stopImmediatePropagation();routeRepositoryMessage(message);return}
  const action=e.target.closest?.('#p97Deck [data-p97-action]');
  if(!action)return;
  const spec=actions[action.dataset.p97Action];if(!spec||typeof root[spec.fn]==='function')return;
  e.preventDefault();e.stopImmediatePropagation();rescueTrackAction(action).catch(err=>{console.error('Ação do Acompanhamento',err);toastSafe('Não foi possível abrir esta ação.')});
 },true);
}

root.CarbonautasRuntimeIntegrity={saveMember:saveMemberRobust,rescueTrackAction,routeRepositoryMessage,closeTrackingDeck,openOwnProfile,renderPrivatePeople:renderPrivatePeopleRobust,settleGraph,removeRepositoryPreview};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(globalThis);
