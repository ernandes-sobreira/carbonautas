/* Carbonautas · troca simples de arquivos
   O arquivo sai do Carbonautas para ser corrigido no app preferido de cada pessoa
   e volta como uma nova versão. Sem ONLYOFFICE no fluxo do Repositório. */
(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.CarbonautasFiles=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';


const COORD_FALLBACK='seed-ernandes-sobreira-oliveira-junior';
function appState(){try{return root?.CarbonautasApp?.state||root?.state||{}}catch(_e){return{}}}
function F(){try{return typeof root?.FB==='function'?root.FB():(root?.fbFns||{})}catch(_e){return root?.fbFns||{}}}
function db(){return root?.db||null}
function auth(){return root?.auth||null}
function memberById(id){
  try{if(typeof root?.memberById==='function')return root.memberById(id)}catch(_e){}
  return (appState().members||[]).find(m=>String(m?.id)===String(id))||null;
}
function memberName(id,fallback=''){return memberById(id)?.nome||fallback||''}
function privateThreadId(a,b){return [String(a||''),String(b||'')].sort().map(x=>encodeURIComponent(x)).join('__')}
function toMillis(v){
  if(!v)return 0;
  try{
    if(typeof v.toMillis==='function')return v.toMillis();
    if(typeof v.toDate==='function')return v.toDate().getTime();
    if(typeof v.seconds==='number')return v.seconds*1000;
    const n=new Date(v).getTime();return Number.isNaN(n)?0:n;
  }catch(_e){return 0}
}
function formatWhen(v){
  const n=toMillis(v);if(!n)return '—';
  const d=new Date(n);
  return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'})+' · '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
}
function currentVersion(p){return Math.max(1,Number(p?.onlineEditVersion)||1,Number(p?.reviewVersion)||1)}
function publicationTitle(p){return p?.fileName||p?.reviewBaseTitle||p?.titulo||p?.title||'Arquivo'}
function isFilePublication(p){return !!p&&(p.tipo==='arquivo'||!!p.fileName||!!p.url)}

function coordinatorId(s=appState()){
  const m=(s.members||[]).find(x=>x&&(x.nivel==='coord'||x.role==='coordinator'||x.id===COORD_FALLBACK));
  if(m?.id)return String(m.id);
  const u=(s.users||[]).find(x=>x?.role==='coordinator'&&x?.memberId);
  return String(u?.memberId||COORD_FALLBACK);
}
function nextRecipientId(p,actorId,s=appState()){
  actorId=String(actorId||'');if(!p||!actorId)return'';
  if(p.packageId&&actorId===String(p.memberId)){
    const permitted=id=>id&&id!==actorId&&(p.packageAccess==='group'||(p.collaboratorMemberIds||[]).includes(id));
    if(permitted(p.repositoryTurnFromId))return p.repositoryTurnFromId;
    const recipients=(p.collaboratorMemberIds||[]).filter(id=>id!==actorId);
    if(recipients.length===1)return recipients[0];
    const coord=coordinatorId(s);return permitted(coord)?coord:'';
  }
  if(p.reviewFlow){
    const reviewer=String(p.reviewReviewerId||''),back=String(p.reviewReturnToId||p.memberId||''),next=String(p.reviewNextRecipientId||'');
    if(actorId===reviewer)return back&&back!==actorId?back:'';
    if(actorId===back)return reviewer&&reviewer!==actorId?reviewer:'';
    if(next&&next!==actorId)return next;
  }
  const owner=String(p.memberId||'');
  if(owner&&actorId!==owner)return owner;
  const coord=coordinatorId(s);
  if(coord&&coord!==actorId)return coord;
  return'';
}
// Explicit choices are only available to the package owner; every choice is revalidated.
function recipientIds(p,actorId,s=appState()){
  if(!p||!actorId)return [];
  if(p.packageId&&String(p.memberId)===String(actorId)){
    const ids=p.packageAccess==='group'?(s.members||[]).filter(m=>m.status!=='inativo').map(m=>m.id):(p.collaboratorMemberIds||[]);
    return [...new Set(ids.map(String))].filter(id=>id&&id!==String(actorId));
  }
  const id=nextRecipientId(p,actorId,s);return id?[id]:[];
}
function resolveRecipient(p,actorId,selected){
  const ids=recipientIds(p,actorId),target=selected||nextRecipientId(p,actorId);
  if(!target||!ids.includes(target))throw new Error('Escolha uma pessoa com acesso ao arquivo.');
  return target;
}
function canExchange(p,actor){
  const id=String(actor?.memberId||'');if(!p||!id)return false;
  if(actor?.coordinator&&(!p.packageId||p.packageAccess==='group'||(p.collaboratorMemberIds||[]).includes(id)))return true;
  if(String(p.memberId||'')===id)return true;
  if(Array.isArray(p.collaboratorMemberIds)&&p.collaboratorMemberIds.map(String).includes(id))return true;
  if(p.reviewFlow&&[p.reviewReviewerId,p.reviewReturnToId,p.reviewNextRecipientId].filter(Boolean).map(String).includes(id))return true;
  return false;
}
function historyEvents(p,s=appState()){
  if(!p)return [];
  const tid=String(p.reviewThreadId||p.id||'');
  let versions=p.reviewFlow?(s.publicacoes||[]).filter(x=>x.reviewFlow&&String(x.reviewThreadId||x.id||'')===tid):[p];
  versions=versions.filter(x=>x.id!==p.id).concat(p);
  const out=[];
  for(const v of versions){
    const hist=Array.isArray(v.onlineEditHistory)?v.onlineEditHistory:[];
    if(!hist.some(h=>h.source==='p214-baseline'||h.source==='handoff-baseline'))out.push({action:Number(v.reviewVersion||1)>1?'upload':'initial',version:Number(v.reviewVersion||1),when:v.ts||v.createdAt,byMemberId:v.reviewSenderMemberId||v.reviewSenderId||v.memberId,byName:v.reviewSenderName||v.memberNome||'',fileName:v.fileName});
    for(const h of hist)out.push({...h,action:h.action||'legacy',version:Number(h.version||1),when:h.savedAt||h.at||h.createdAt,byMemberId:h.byMemberId||h.memberId,byName:h.byName||h.authorName||''});
  }
  return out.sort((a,b)=>toMillis(a.when)-toMillis(b.when));
}
function actionText(evt){
  switch(evt?.action){case'initial':return'enviou o arquivo';case'upload':return ['p214-baseline','handoff-baseline'].includes(evt?.source)?'enviou o arquivo':'enviou uma nova versão';case'download':return'baixou o arquivo';case'message':return 'enviou mensagem para '+(evt.toName||memberName(evt.toMemberId,'o participante'));case'legacy':return'atualizou o arquivo';default:return'atualizou o arquivo'}
}
function appendBaselineIfNeeded(p,history){
  const h=Array.isArray(history)?[...history]:[];
  if(p?.url&&!h.some(x=>x.action!=='download'&&x.action!=='message'&&String(x?.url||'')===String(p.url))){
    h.push({action:'upload',source:'handoff-baseline',version:currentVersion(p),byUid:String(p.ownerUid||''),byMemberId:String(p.reviewSenderMemberId||p.reviewSenderId||p.memberId||''),byName:p.reviewSenderName||p.memberNome||memberName(p.memberId,'Aluno'),savedAt:p.editedAt||p.ts||new Date().toISOString(),fileName:p.fileName||publicationTitle(p),url:p.url||'',storagePath:p.storagePath||''});
  }
  return h;
}

let actorCache=null,actorPromise=null;
async function actorProfile(force=false){
  const u=auth()?.currentUser;if(!u)return null;
  if(!force&&actorCache?.uid===u.uid)return actorCache;
  if(!force&&actorPromise)return actorPromise;
  actorPromise=(async()=>{
    let profile=null;
    try{const f=F(),snap=await f.getDoc(f.doc(db(),'rede_users',u.uid));if(snap.exists())profile=snap.data()}catch(_e){}
    let a=null;try{if(typeof root?.currentActor==='function')a=root.currentActor()}catch(_e){}
    const memberId=String(profile?.memberId||a?.id||root?.CarbonautasApp?.memberId||root?.myId||'');
    const name=profile?.nome||a?.name||root?.CarbonautasApp?.name||root?.myName||memberName(memberId,u.displayName||u.email||'Carbonauta');
    actorCache={uid:u.uid,memberId,name,coordinator:profile?.role==='coordinator'||memberId===COORD_FALLBACK||root?.CarbonautasApp?.isAdmin===true};
    return actorCache;
  })();
  try{return await actorPromise}finally{actorPromise=null}
}
function packageParts(id){return String(id).startsWith('package:')?String(id).split(':').slice(1).map(decodeURIComponent):null}
function publicationRef(id){const parts=packageParts(id);return parts?F().doc(db(),'rede_repository_packages',parts[0],'files',parts[1]):F().doc(db(),'rede_publicacoes',id)}
function normalizePackage(pkg,file){return {...file,id:'package:'+encodeURIComponent(pkg.id)+':'+encodeURIComponent(file.id),tipo:'arquivo',memberId:pkg.ownerMemberId,memberNome:pkg.ownerName,packageId:pkg.id,packageAccess:pkg.accessMode,collaboratorMemberIds:pkg.allowedMemberIds||[],packageCreatorId:pkg.createdByMemberId}}
async function getPublication(id,fresh=false){
  if(!id)return null;
  const parts=packageParts(id);
  if(parts){const f=F(),parent=await f.getDoc(f.doc(db(),'rede_repository_packages',parts[0])),snap=await f.getDoc(publicationRef(id));return parent.exists()&&snap.exists()?normalizePackage({...parent.data(),id:parent.id},{...snap.data(),id:snap.id}):null}
  const local=(appState().publicacoes||[]).find(x=>String(x?.id)===String(id));
  if(local&&!fresh)return local;
  const f=F(),snap=await f.getDoc(publicationRef(id));return snap.exists()?{...snap.data(),id:snap.id}:null;
}
async function targetDirectory(memberId){
  const f=F(),snap=await f.getDoc(f.doc(db(),'rede_private_directory',memberId));
  return snap.exists()?{...snap.data(),memberId}:null;
}
async function ensurePrivateThread(actor,targetId){
  const f=F();if(!actor?.uid||!actor.memberId||!targetId)throw new Error('Não consegui identificar os participantes da mensagem.');
  if(String(targetId)===String(actor.memberId))throw new Error('Não há outra pessoa para receber esta mensagem.');
  const dir=await targetDirectory(targetId);if(!dir?.uid)throw new Error('O destinatário ainda não está disponível no chat privado.');
  const tid=privateThreadId(actor.memberId,targetId),ref=f.doc(db(),'rede_private_threads',tid);
  let snap;try{snap=await f.getDoc(ref)}catch(e){if(e.code!=='permission-denied')throw e}
  if(!snap?.exists()){
    const unread={[actor.uid]:0,[dir.uid]:0};
    try{await f.setDoc(ref,{participants:[actor.uid,dir.uid],memberIds:[actor.memberId,String(targetId)],createdAt:f.serverTimestamp(),updatedAt:f.serverTimestamp(),lastMessage:'',lastSenderUid:'',lastSenderMemberId:'',unreadBy:unread})}
    catch(e){snap=await f.getDoc(ref);if(!snap.exists())throw e}
    snap=await f.getDoc(ref);
  }
  const data=snap.data()||{};
  if(!(data.participants||[]).includes(actor.uid)||!(data.memberIds||[]).includes(String(targetId)))throw new Error('Participantes da conversa inválidos.');
  const targetUid=(data.participants||[]).find(x=>x!==actor.uid)||dir.uid;
  if(!targetUid)throw new Error('Não consegui localizar a conta do destinatário.');
  return {tid,ref,targetUid,data};
}
function notificationPayload(actor,targetId,tid,title){return {recipientId:String(targetId),senderId:actor.memberId,senderUid:actor.uid,senderName:actor.name||'Carbonauta',kind:'private_message',title:String(title||'🔐 Nova mensagem privada').slice(0,200),message:'Você recebeu uma nova mensagem privada.',sourceType:'private_chat',sourceId:tid,threadId:tid,read:false}}
async function fileToDataUrl(file){
  if(typeof root?.fileToDataUrl==='function')return root.fileToDataUrl(file);
  return await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error||new Error('Falha ao ler o arquivo.'));r.readAsDataURL(file)});
}
async function uploadStorage(pubId,file){
  if(typeof root?.fbUploadFile!=='function')throw new Error('O módulo de upload do Carbonautas ainda não terminou de carregar.');
  const dataUrl=await fileToDataUrl(file);return root.fbUploadFile('handoff_'+pubId,dataUrl,file.name);
}
async function cleanupUploaded(up){if(!up)return;try{if(typeof root?.deleteStorageArtifacts==='function')await root.deleteStorageArtifacts({storagePath:up.path,url:up.url},{allowUrlFallback:false})}catch(e){console.warn('Limpeza de upload órfão',e)}}

async function commitUploadAndMessage(pubId,file,typedMessage,selectedRecipient){
  if(!file||!file.name||!file.size)throw new Error('Escolha um arquivo não vazio.');
  if(file.size>15*1024*1024)throw new Error('O limite por arquivo é 15 MB.');
  const actor=await actorProfile(true);if(!actor?.memberId)throw new Error('Seu perfil ainda não está vinculado à Rede.');
  let pub=await getPublication(pubId,true);if(!pub||!isFilePublication(pub))throw new Error('Arquivo não encontrado.');
  if(!canExchange(pub,actor))throw new Error('Você não tem permissão para enviar uma versão deste arquivo.');
  const targetId=resolveRecipient(pub,actor.memberId,selectedRecipient);
  const msg=String(typedMessage||'').trim();if(!msg)throw new Error('Escreva uma mensagem junto com o arquivo.');
  if(msg.length>4400)throw new Error('A mensagem está muito longa. Reduza para até 4.400 caracteres.');
  const thread=await ensurePrivateThread(actor,targetId);
  const up=await uploadStorage(pubId,file);
  const f=F(),pubRef=publicationRef(pubId),msgRef=f.doc(f.collection(thread.ref,'messages'));
  let nextVersion=0,finalTitle='';
  try{
    await f.runTransaction(db(),async tx=>{
      const [pSnap,tSnap]=await Promise.all([tx.get(pubRef),tx.get(thread.ref)]);
      if(!pSnap.exists())throw new Error('O arquivo foi removido antes do envio.');
      if(!tSnap.exists())throw new Error('A conversa privada não está mais disponível.');
      let live={...pSnap.data(),id:pubId};
      if(pub.packageId){const parent=await tx.get(f.doc(db(),'rede_repository_packages',pub.packageId));if(!parent.exists())throw new Error('Pasta removida.');live=normalizePackage({...parent.data(),id:parent.id},{...pSnap.data(),id:pSnap.id});if(live.packageAccess!=='group'&&targetId!==live.memberId&&!(live.collaboratorMemberIds||[]).includes(targetId))throw new Error('O destinatário não tem acesso a esta pasta.');}
      const t=tSnap.data()||{};
      if(!canExchange(live,actor))throw new Error('Sua permissão para este arquivo mudou.');
      const liveTarget=resolveRecipient(live,actor.memberId,selectedRecipient);if(String(liveTarget)!==String(targetId))throw new Error('A vez deste arquivo mudou. Reabra o cartão e tente novamente.');
      if(currentVersion(live)!==currentVersion(pub)||live.url!==pub.url)throw new Error('Outra versão foi enviada. Reabra o arquivo antes de devolver.');
      const oldVersion=currentVersion(live);nextVersion=oldVersion+1;finalTitle=publicationTitle(live);
      const text=`📎 ${finalTitle} · v${nextVersion}\n${msg}\n\nAgora é sua vez.`.slice(0,5000);
      const unread={...(t.unreadBy||{})};unread[actor.uid]=Number(unread[actor.uid]||0);unread[thread.targetUid]=Number(unread[thread.targetUid]||0)+1;
      const history=appendBaselineIfNeeded(live,live.onlineEditHistory||[]),savedAt=new Date().toISOString();
      history.push({action:'upload',source:'handoff',version:nextVersion,byUid:actor.uid,byMemberId:actor.memberId,byName:actor.name,savedAt,fileName:file.name,url:up.url,storagePath:up.path||''});
      history.push({action:'message',source:'handoff',version:nextVersion,byUid:actor.uid,byMemberId:actor.memberId,byName:actor.name,toMemberId:targetId,toName:memberName(targetId,'participante'),savedAt});
      const changes={url:up.url,storagePath:up.path||'',fileName:file.name,onlineEditVersion:nextVersion,onlineEditHistory:history,editedOnline:false,editedAt:f.serverTimestamp(),editedByUid:actor.uid,editedByMemberId:actor.memberId,editedByName:actor.name,repositoryTurnMemberId:String(targetId),repositoryTurnFromId:actor.memberId,repositoryTurnFromName:actor.name,repositoryTurnAt:f.serverTimestamp()};
      if(live.reviewFlow)Object.assign(changes,{reviewVersion:nextVersion,reviewNextRecipientId:String(targetId)});
      tx.update(pubRef,changes);
      tx.set(f.doc(f.collection(db(),'rede_notifications')),{...notificationPayload(actor,targetId,thread.tid,`📎 Nova versão de ${finalTitle}`),ts:f.serverTimestamp()});
      tx.set(msgRef,{senderUid:actor.uid,senderMemberId:actor.memberId,text,createdAt:f.serverTimestamp(),readBy:[actor.uid],replyTo:null});
      tx.update(thread.ref,{updatedAt:f.serverTimestamp(),lastMessage:text.replace(/\s+/g,' ').slice(0,160),lastSenderUid:actor.uid,lastSenderMemberId:actor.memberId,unreadBy:unread});
    });
  }catch(e){await cleanupUploaded(up);throw e}

  return {targetId,nextVersion,title:finalTitle,url:up.url};
}

// Log the exact version fetched, even if another version arrives during the download.
async function logDownload(pubId,downloaded){
  const actor=await actorProfile(true);if(!actor?.memberId)throw new Error('Entre com seu perfil.');
  const f=F(),ref=publicationRef(pubId);
  await f.runTransaction(db(),async tx=>{
    const snap=await tx.get(ref);if(!snap.exists())throw new Error('Arquivo removido.');
    const live={...snap.data(),id:snap.id},p=downloaded||live,history=[...(live.onlineEditHistory||[])];
    history.push({action:'download',source:'handoff',version:currentVersion(p),byUid:actor.uid,byMemberId:actor.memberId,byName:actor.name,savedAt:new Date().toISOString(),fileName:publicationTitle(p),url:p.url||''});
    tx.update(ref,{onlineEditHistory:history});
  });
  return true;
}
async function downloadPublication(pubId){
  const p=await getPublication(pubId,true);if(!p?.url)throw new Error('Arquivo indisponível.');
  const response=await root.fetch(p.url);
  if(!response.ok)throw new Error('Não foi possível baixar o arquivo ('+response.status+').');
  const blob=await response.blob();
  await logDownload(pubId,p);
  const url=root.URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=publicationTitle(p);a.hidden=true;document.body.append(a);a.click();a.remove();
  root.setTimeout(()=>root.URL.revokeObjectURL(url),60000);
  return true;
}
async function addMessageReceipt(batch,context,threadId){
  if(!context||context.threadId!==threadId)return;
  const actor=await actorProfile(true),p=await getPublication(context.id,true);
  if(!actor||!p)throw new Error('O contexto do arquivo não está mais disponível.');
  const event={action:'message',source:'handoff',version:context.version,byUid:actor.uid,byMemberId:actor.memberId,byName:actor.name,toMemberId:context.targetId,toName:memberName(context.targetId,'participante'),savedAt:new Date().toISOString()};
  batch.update(publicationRef(context.id),{onlineEditHistory:F().arrayUnion(event)});
}
const api={privateThreadId,currentVersion,coordinatorId,nextRecipientId,recipientIds,resolveRecipient,canExchange,historyEvents,actionText,appendBaselineIfNeeded,formatWhen,commitUploadAndMessage,logDownload,downloadPublication,actorProfile,getPublication,publicationTitle,ensurePrivateThread,normalizePackage,addMessageReceipt};
return api;
});
