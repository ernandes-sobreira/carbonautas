/* Carbonautas P214 · troca simples de arquivos
   O arquivo sai do Carbonautas para ser corrigido no app preferido de cada pessoa
   e volta como uma nova versão. Sem ONLYOFFICE no fluxo do Repositório. */
(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.CARBONAUTAS_FILE_HANDOFF_P214=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';

const BUILD='P214-20260922';
const COORD_FALLBACK='seed-ernandes-sobreira-oliveira-junior';
const hasDocument=()=>typeof document!=='undefined';
const $=(s,r)=>hasDocument()?(r||document).querySelector(s):null;
const $$=(s,r)=>hasDocument()?Array.from((r||document).querySelectorAll(s)):[];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();

function appState(){try{return root?.state||{}}catch(_e){return{}}}
function F(){try{return typeof root?.FB==='function'?root.FB():(root?.fbFns||{})}catch(_e){return root?.fbFns||{}}}
function db(){return root?.db||null}
function auth(){return root?.auth||null}
function toast(msg){try{if(typeof root?.toast==='function')root.toast(msg);else console.log('[Carbonautas]',msg)}catch(_e){}}
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
function currentVersion(p){return Math.max(1,Number(p?.onlineEditVersion||p?.reviewVersion||1)||1)}
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
function canExchange(p,actor){
  const id=String(actor?.memberId||'');if(!p||!id)return false;
  if(actor?.coordinator)return true;
  if(String(p.memberId||'')===id)return true;
  if(Array.isArray(p.collaboratorMemberIds)&&p.collaboratorMemberIds.map(String).includes(id))return true;
  if(p.reviewFlow&&[p.reviewReviewerId,p.reviewReturnToId,p.reviewNextRecipientId].filter(Boolean).map(String).includes(id))return true;
  return false;
}
function isLegacyOnlineAction(el){
  if(!el)return false;
  const text=norm(el.textContent),title=norm(el.getAttribute?.('title')||''),oc=norm(el.getAttribute?.('onclick')||''),cls=String(el.className||'');
  if(/office-edit-btn|p5[345]-edit|p55-return|review-action/.test(cls))return true;
  if(/onlyoffice|openonlyoffice|openpackageonlineedit|openonlineedit/.test(oc+' '+title+' '+text))return true;
  if(/corrigir online|editar online/.test(text+' '+title))return true;
  if(/openfilepreview/.test(oc))return true;
  if(/p5[345]-view/.test(cls))return true;
  if(text==='visualizar'||text==='👁 visualizar'||title.includes('visualizar'))return true;
  return false;
}
function publicationIdFromRow(row){
  if(!row)return'';
  if(row.dataset?.p214PubId)return row.dataset.p214PubId;
  const all=[...row.querySelectorAll('button[onclick],a[onclick]')];
  for(const el of all){
    const src=String(el.getAttribute('onclick')||'');
    const m=src.match(/(?:messagePublicationOwner|openRepoFileConversationPublication|openReviewConversation|deletePublicacao|openFilePreview|openOnlineEdit|openOnlyOffice)\(\s*['"]([^'"]+)['"]/);
    if(m)return m[1];
    const idm=src.match(/\bid\s*:\s*['"]([^'"]+)['"]/);if(idm)return idm[1];
  }
  return'';
}
function historyEvents(p,s=appState()){
  if(!p)return[];
  if(p.reviewFlow){
    const tid=String(p.reviewThreadId||p.id||'');
    const group=(s.publicacoes||[]).filter(x=>x?.reviewFlow&&String(x.reviewThreadId||x.id||'')===tid);
    const versions=(group.length?group:[p]).slice().sort((a,b)=>(Number(a.reviewVersion)||1)-(Number(b.reviewVersion)||1));
    const out=[];
    for(const v of versions){
      const ver=Math.max(1,Number(v.reviewVersion||1)||1);
      out.push({action:ver===1?'initial':'upload',version:ver,when:v.ts||v.createdAt||'',byMemberId:String(v.reviewSenderMemberId||v.editedByMemberId||v.memberId||''),byName:v.reviewSenderName||v.editedByName||v.memberNome||memberName(v.memberId,'Carbonauta'),fileName:v.fileName||publicationTitle(v),url:v.url||'',storagePath:v.storagePath||'',source:'review-version'});
      for(const h of (Array.isArray(v.onlineEditHistory)?v.onlineEditHistory:[])){
        if(h?.action!=='download')continue;
        out.push({action:'download',version:Math.max(1,Number(h.version||ver)||ver),when:h.savedAt||h.at||'',byMemberId:String(h.byMemberId||''),byName:h.byName||'',fileName:h.fileName||v.fileName||'',url:h.url||v.url||'',storagePath:h.storagePath||'',source:h.source||''});
      }
    }
    return out.sort((a,b)=>toMillis(a.when)-toMillis(b.when));
  }
  const hist=Array.isArray(p.onlineEditHistory)?p.onlineEditHistory:[];
  const out=hist.map((h,i)=>({
    action:String(h?.action||'legacy'),version:Math.max(1,Number(h?.version||i+1)||1),when:h?.savedAt||h?.at||h?.createdAt||'',byMemberId:String(h?.byMemberId||h?.memberId||''),byName:h?.byName||h?.authorName||'',fileName:h?.fileName||'',url:h?.url||'',storagePath:h?.storagePath||'',source:h?.source||''
  }));
  if(!out.some(x=>x.source==='p214-baseline'))out.unshift({action:'initial',version:1,when:p.ts||p.createdAt||'',byMemberId:String(p.memberId||''),byName:p.memberNome||memberName(p.memberId,'Aluno'),fileName:p.fileName||'',url:'',storagePath:'',source:'synthetic'});
  return out.sort((a,b)=>toMillis(a.when)-toMillis(b.when));
}
function actionText(evt){
  switch(evt?.action){case'initial':return'enviou o arquivo';case'upload':return evt?.source==='p214-baseline'?'enviou o arquivo':'enviou uma nova versão';case'download':return'baixou o arquivo';case'legacy':return'atualizou o arquivo';default:return'atualizou o arquivo'}
}
function appendBaselineIfNeeded(p,history){
  const h=Array.isArray(history)?[...history]:[];
  if(p?.url&&!h.some(x=>String(x?.url||'')===String(p.url))){
    h.push({action:'upload',source:'p214-baseline',version:currentVersion(p),byUid:String(p.ownerUid||''),byMemberId:String(p.memberId||''),byName:p.memberNome||memberName(p.memberId,'Aluno'),savedAt:p.editedAt||p.ts||new Date().toISOString(),fileName:p.fileName||publicationTitle(p),url:p.url||'',storagePath:p.storagePath||''});
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
    const memberId=String(profile?.memberId||a?.id||root?.myId||'');
    const name=profile?.nome||a?.name||root?.myName||memberName(memberId,u.displayName||u.email||'Carbonauta');
    actorCache={uid:u.uid,memberId,name,coordinator:profile?.role==='coordinator'||memberId===COORD_FALLBACK||root?.isAdmin===true};
    return actorCache;
  })();
  try{return await actorPromise}finally{actorPromise=null}
}
async function getPublication(id,fresh=false){
  if(!id)return null;
  const local=(appState().publicacoes||[]).find(x=>String(x?.id)===String(id));
  if(local&&!fresh)return local;
  try{const f=F(),snap=await f.getDoc(f.doc(db(),'rede_publicacoes',id));if(snap.exists())return {...snap.data(),id:snap.id}}catch(_e){}
  return local||null;
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
  let snap=await f.getDoc(ref);
  if(!snap.exists()){
    const unread={[actor.uid]:0,[dir.uid]:0};
    try{await f.setDoc(ref,{participants:[actor.uid,dir.uid],memberIds:[actor.memberId,String(targetId)],createdAt:f.serverTimestamp(),updatedAt:f.serverTimestamp(),lastMessage:'',lastSenderUid:'',lastSenderMemberId:'',unreadBy:unread})}
    catch(e){snap=await f.getDoc(ref);if(!snap.exists())throw e}
    snap=await f.getDoc(ref);
  }
  const data=snap.data()||{},targetUid=(data.participants||[]).find(x=>x!==actor.uid)||dir.uid;
  if(!targetUid)throw new Error('Não consegui localizar a conta do destinatário.');
  return {tid,ref,targetUid,data};
}
function notificationPayload(actor,targetId,tid,title){return {recipientId:String(targetId),senderId:actor.memberId,senderUid:actor.uid,senderName:actor.name||'Carbonauta',kind:'private_message',title:String(title||'🔐 Nova mensagem privada').slice(0,200),message:'Você recebeu uma nova mensagem privada.',sourceType:'private_chat',sourceId:tid,threadId:tid,read:false}}
async function notifyPrivate(actor,targetId,tid,title){try{const f=F(),payload=notificationPayload(actor,targetId,tid,title);await f.addDoc(f.collection(db(),'rede_notifications'),{...payload,ts:f.serverTimestamp()})}catch(e){console.warn('P214 notificação privada',e)}}
async function fileToDataUrl(file){
  if(typeof root?.fileToDataUrl==='function')return root.fileToDataUrl(file);
  return await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error||new Error('Falha ao ler o arquivo.'));r.readAsDataURL(file)});
}
async function uploadStorage(pubId,file){
  if(typeof root?.fbUploadFile!=='function')throw new Error('O módulo de upload do Carbonautas ainda não terminou de carregar.');
  const dataUrl=await fileToDataUrl(file);return root.fbUploadFile('handoff_'+pubId,dataUrl,file.name);
}
async function cleanupUploaded(up){if(!up)return;try{if(typeof root?.deleteStorageArtifacts==='function')await root.deleteStorageArtifacts({storagePath:up.path,url:up.url},{allowUrlFallback:false})}catch(e){console.warn('P214 limpeza de upload órfão',e)}}

async function commitUploadAndMessage(pubId,file,typedMessage){
  const actor=await actorProfile();if(!actor?.memberId)throw new Error('Seu perfil ainda não está vinculado à Rede.');
  let pub=await getPublication(pubId);if(!pub||!isFilePublication(pub))throw new Error('Arquivo não encontrado.');
  if(!canExchange(pub,actor))throw new Error('Você não tem permissão para enviar uma versão deste arquivo.');
  const targetId=nextRecipientId(pub,actor.memberId);if(!targetId)throw new Error('Não consegui identificar quem deve receber a próxima versão.');
  const msg=String(typedMessage||'').trim();if(!msg)throw new Error('Escreva uma mensagem junto com o arquivo.');
  if(msg.length>4400)throw new Error('A mensagem está muito longa. Reduza para até 4.400 caracteres.');
  const thread=await ensurePrivateThread(actor,targetId);
  const up=await uploadStorage(pubId,file);
  const f=F(),pubRef=f.doc(db(),'rede_publicacoes',pubId),msgRef=f.doc(f.collection(thread.ref,'messages'));
  let nextVersion=0,finalTitle='';
  try{
    await f.runTransaction(db(),async tx=>{
      const [pSnap,tSnap]=await Promise.all([tx.get(pubRef),tx.get(thread.ref)]);
      if(!pSnap.exists())throw new Error('O arquivo foi removido antes do envio.');
      if(!tSnap.exists())throw new Error('A conversa privada não está mais disponível.');
      const live={...pSnap.data(),id:pSnap.id},t=tSnap.data()||{};
      if(!canExchange(live,actor))throw new Error('Sua permissão para este arquivo mudou.');
      const liveTarget=nextRecipientId(live,actor.memberId);if(String(liveTarget)!==String(targetId))throw new Error('A vez deste arquivo mudou. Reabra o cartão e tente novamente.');
      const oldVersion=currentVersion(live);nextVersion=oldVersion+1;finalTitle=publicationTitle(live);
      const text=`📎 ${finalTitle} · v${nextVersion}\n${msg}\n\nAgora é sua vez.`.slice(0,5000);
      const unread={...(t.unreadBy||{})};unread[actor.uid]=Number(unread[actor.uid]||0);unread[thread.targetUid]=Number(unread[thread.targetUid]||0)+1;
      if(live.reviewFlow){
        const newRef=f.doc(f.collection(db(),'rede_publicacoes'));const {id:_id,...copy}=live;
        tx.set(newRef,{...copy,ownerUid:actor.uid,url:up.url,storagePath:up.path||'',fileName:file.name,reviewFlow:true,reviewThreadId:live.reviewThreadId||live.id,reviewVersion:nextVersion,reviewSenderName:actor.name,reviewSenderMemberId:actor.memberId,reviewNextRecipientId:String(targetId),reviewStatus:String(actor.memberId)===String(live.reviewReviewerId||'')||actor.coordinator?'correcao_devolvida':'nova_versao',ts:f.serverTimestamp(),onlineEditVersion:nextVersion,onlineEditHistory:[],editedOnline:false,editedAt:f.serverTimestamp(),editedByUid:actor.uid,editedByMemberId:actor.memberId,editedByName:actor.name,repositoryTurnMemberId:String(targetId),repositoryTurnFromId:actor.memberId,repositoryTurnFromName:actor.name,repositoryTurnAt:f.serverTimestamp()});
      }else{
        let history=appendBaselineIfNeeded(live,live.onlineEditHistory||[]);history.push({action:'upload',source:'p214',version:nextVersion,byUid:actor.uid,byMemberId:actor.memberId,byName:actor.name,savedAt:new Date().toISOString(),fileName:file.name,url:up.url,storagePath:up.path||''});
        tx.update(pubRef,{url:up.url,fileName:file.name,onlineEditVersion:nextVersion,onlineEditHistory:history,editedOnline:false,editedAt:f.serverTimestamp(),editedByUid:actor.uid,editedByMemberId:actor.memberId,editedByName:actor.name,repositoryTurnMemberId:String(targetId),repositoryTurnFromId:actor.memberId,repositoryTurnFromName:actor.name,repositoryTurnAt:f.serverTimestamp()});
      }
      tx.set(msgRef,{senderUid:actor.uid,senderMemberId:actor.memberId,text,createdAt:f.serverTimestamp(),readBy:[actor.uid],replyTo:null});
      tx.update(thread.ref,{updatedAt:f.serverTimestamp(),lastMessage:text.replace(/\s+/g,' ').slice(0,160),lastSenderUid:actor.uid,lastSenderMemberId:actor.memberId,unreadBy:unread});
    });
  }catch(e){await cleanupUploaded(up);throw e}
  await notifyPrivate(actor,targetId,thread.tid,`📎 Nova versão de ${finalTitle}`);
  return {targetId,nextVersion,title:finalTitle,url:up.url};
}

const recentDownload=new Map();
async function logDownload(pubId){
  const actor=await actorProfile();if(!actor?.memberId)return false;
  const key=`${actor.uid}:${pubId}`;const now=Date.now();if(now-(recentDownload.get(key)||0)<2500)return true;recentDownload.set(key,now);
  try{
    const f=F(),ref=f.doc(db(),'rede_publicacoes',pubId);
    await f.runTransaction(db(),async tx=>{const snap=await tx.get(ref);if(!snap.exists())return;const p={...snap.data(),id:snap.id},history=Array.isArray(p.onlineEditHistory)?[...p.onlineEditHistory]:[];history.push({action:'download',source:'p214',version:currentVersion(p),byUid:actor.uid,byMemberId:actor.memberId,byName:actor.name,savedAt:new Date().toISOString(),fileName:p.fileName||publicationTitle(p),url:p.url||''});tx.update(ref,{onlineEditHistory:history})});
    return true;
  }catch(e){console.warn('P214 registro de download',e);return false}
}
function downloadUrl(url,name='arquivo'){
  if(!hasDocument()||!url)return false;const a=document.createElement('a');a.href=url;a.download=name||'arquivo';a.target='_blank';a.rel='noopener';a.style.display='none';document.body.appendChild(a);a.click();setTimeout(()=>a.remove(),500);return true;
}
async function downloadPublication(pubId){
  const p=await getPublication(pubId,true);if(!p?.url)throw new Error('Este arquivo não tem uma versão disponível para baixar.');
  const logged=await logDownload(pubId);if(!logged)toast('O arquivo será aberto, mas não consegui registrar o horário do download.');downloadUrl(p.url,p.fileName||publicationTitle(p));return true;
}

function injectCss(){
  if(!hasDocument()||$('#p214FileHandoffStyle'))return;
  const s=document.createElement('style');s.id='p214FileHandoffStyle';s.textContent=`
  #onlyOfficeOverlay,#onlyOfficeOverlay.open{display:none!important}
  #viewPubs .pub-row .office-edit-btn,#viewPubs .pub-row .p53-edit,#viewPubs .pub-row .p54-edit,#viewPubs .pub-row .p55-edit,#viewPubs .pub-row .p53-view,#viewPubs .pub-row .p54-view,#viewPubs .pub-row .p55-view,#viewPubs .pub-row .review-action,#viewPubs .pub-row .p55-return,#viewPubs .pub-row .p214-old-action{display:none!important}
  #viewPubs .pub-row .p53-history,#viewPubs .pub-row .p54-history,#viewPubs .pub-row .repo-sequence,#viewPubs .pub-row .p52-review-flow{display:none!important}
  .p214-btn{height:44px!important;min-height:44px!important;border-radius:11px!important;padding:0 13px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:7px!important;font-size:12px!important;font-weight:900!important;white-space:nowrap!important;box-shadow:none!important}.p214-upload{background:#0e8897!important;color:#fff!important;border:1px solid #0e8897!important}.p214-download,.p214-message{background:#fff!important;color:#17313d!important;border:1px solid #c9dadd!important}
  .p214-history{margin-top:12px;border:1px solid #d6e4e6;border-radius:16px;background:#fff;overflow:hidden;max-width:900px}.p214-history-title{display:flex;align-items:center;gap:8px;padding:10px 12px;background:#f3f8f8;border-bottom:1px solid #e2ebed;color:#526b73;font-size:10px;font-weight:950;letter-spacing:.07em;text-transform:uppercase}.p214-history-row{display:grid;grid-template-columns:168px minmax(170px,1fr) minmax(180px,1fr) 55px;gap:10px;align-items:center;padding:9px 12px;border-bottom:1px solid #edf2f3;font-size:11.5px;color:#435b64}.p214-history-row:last-of-type{border-bottom:0}.p214-history-when{font-variant-numeric:tabular-nums;color:#657980;font-weight:750}.p214-history-who{font-weight:900;color:#18333d}.p214-history-act{color:#50676f}.p214-history-ver{justify-self:end;border-radius:999px;background:#edf4f5;color:#536a72;font-size:9.5px;font-weight:950;padding:4px 7px}.p214-turn{padding:10px 12px;background:#fff8df;border-top:1px solid #eedc91;color:#5b4f20;font-size:12px;line-height:1.4}.p214-turn b{color:#2e2913}.p214-turn.mine{background:#e9f7f5;border-top-color:#b9ded8;color:#174f4c}.p214-turn.mine b{color:#0c5f5a}
  #p214UploadOverlay{position:fixed;inset:0;z-index:2147483646;background:rgba(5,20,29,.68);display:none;align-items:center;justify-content:center;padding:16px}#p214UploadOverlay.open{display:flex}.p214-modal{width:min(610px,100%);max-height:calc(100dvh - 32px);overflow:auto;background:#fff;border-radius:24px;box-shadow:0 28px 90px rgba(3,24,34,.30)}.p214-modal-head{display:flex;gap:12px;align-items:flex-start;padding:18px 20px;border-bottom:1px solid #e2eaec}.p214-modal-head>div{flex:1;min-width:0}.p214-modal-head h3{margin:0;color:#14313b;font-size:21px}.p214-modal-head p{margin:5px 0 0;color:#6c8087;font-size:11.5px;line-height:1.4}.p214-x{border:0;background:#eef4f5;border-radius:999px;width:38px;height:38px;font-size:20px;cursor:pointer}.p214-modal-body{padding:18px 20px}.p214-field{display:grid;gap:7px;margin-bottom:15px}.p214-field label{font-size:11px;font-weight:900;color:#3b555e}.p214-field input[type=file],.p214-field textarea{width:100%;box-sizing:border-box;border:1px solid #cbdade;border-radius:13px;background:#fff;padding:11px 12px;color:#18333d;font:inherit}.p214-field textarea{min-height:120px;resize:vertical;line-height:1.45}.p214-help{font-size:10px;color:#75888f;line-height:1.45}.p214-next-person{border:1px solid #cce0dc;border-radius:13px;background:#f0faf8;padding:10px 12px;margin-bottom:15px;font-size:11.5px;color:#315a59}.p214-next-person b{color:#0f5d59}.p214-modal-actions{display:flex;gap:9px;justify-content:flex-end;padding:13px 20px 18px}.p214-modal-actions button{border-radius:12px;min-height:42px;padding:0 15px;border:1px solid #cbdade;background:#fff;color:#24414b;font-weight:900}.p214-modal-actions .primary{background:#0e8897;color:#fff;border-color:#0e8897}.p214-modal-actions button:disabled{opacity:.55;cursor:wait}
  @media(max-width:760px){.p214-history-row{grid-template-columns:1fr auto;gap:4px 10px}.p214-history-when{grid-column:1}.p214-history-ver{grid-column:2;grid-row:1/3}.p214-history-who{grid-column:1}.p214-history-act{grid-column:1}.p214-modal{border-radius:20px}.p214-modal-actions{display:grid;grid-template-columns:1fr 1fr}.p214-modal-actions button{width:100%}.p214-btn{width:100%!important;min-width:0!important}}
  `;document.head.appendChild(s);
}
function ensureModal(){
  if(!hasDocument())return null;let ov=$('#p214UploadOverlay');if(ov)return ov;
  ov=document.createElement('div');ov.id='p214UploadOverlay';ov.innerHTML=`<div class="p214-modal" role="dialog" aria-modal="true" aria-labelledby="p214UploadTitle"><div class="p214-modal-head"><div><h3 id="p214UploadTitle">Enviar nova versão</h3><p id="p214UploadSubtitle">Escolha o arquivo corrigido e deixe uma mensagem.</p></div><button type="button" class="p214-x" data-p214-close aria-label="Fechar">×</button></div><div class="p214-modal-body"><div class="p214-next-person" id="p214NextPerson"></div><div class="p214-field"><label for="p214File">Arquivo</label><input id="p214File" type="file"><div class="p214-help">Word, PowerPoint, Excel, PDF, imagem, CSV ou outro formato: o Carbonautas guarda o arquivo sem tentar editá-lo.</div></div><div class="p214-field"><label for="p214Message">Mensagem para quem vai receber</label><textarea id="p214Message" maxlength="4400" placeholder="Ex.: Corrigi as observações até a página 12. Veja principalmente a tabela 3."></textarea><div class="p214-help">A mensagem é privada e vai junto com a troca de vez do arquivo.</div></div></div><div class="p214-modal-actions"><button type="button" data-p214-close>Cancelar</button><button type="button" class="primary" id="p214SendBtn">Enviar arquivo + mensagem</button></div></div>`;document.body.appendChild(ov);
  ov.addEventListener('click',e=>{if(e.target===ov||e.target.closest?.('[data-p214-close]'))closeUploadModal()});$('#p214SendBtn',ov).addEventListener('click',submitUploadModal);return ov;
}
let modalPubId='';
async function openUploadModal(pubId){
  const ov=ensureModal(),actor=await actorProfile(),p=await getPublication(pubId);if(!ov||!p)return toast('Arquivo não encontrado.');if(!canExchange(p,actor))return toast('Você não tem permissão para enviar uma versão deste arquivo.');const target=nextRecipientId(p,actor.memberId);if(!target)return toast('Não consegui identificar quem recebe a próxima versão.');
  modalPubId=pubId;$('#p214UploadTitle',ov).textContent='Enviar nova versão';$('#p214UploadSubtitle',ov).textContent=publicationTitle(p);$('#p214NextPerson',ov).innerHTML=`Depois do envio, <b>${esc(memberName(target,'a outra pessoa'))}</b> recebe a mensagem e o aviso “Agora é sua vez”.`;$('#p214File',ov).value='';$('#p214Message',ov).value='';ov.classList.add('open');setTimeout(()=>$('#p214File',ov)?.focus(),50);
}
function closeUploadModal(){const ov=$('#p214UploadOverlay');if(ov)ov.classList.remove('open');modalPubId=''}
async function submitUploadModal(){
  const ov=$('#p214UploadOverlay'),btn=$('#p214SendBtn',ov),file=$('#p214File',ov)?.files?.[0],message=$('#p214Message',ov)?.value||'';if(!modalPubId)return;if(!file)return toast('Escolha o arquivo que será enviado.');if(!String(message).trim())return toast('Escreva uma mensagem para acompanhar o arquivo.');
  try{btn.disabled=true;btn.textContent='Enviando…';const result=await commitUploadAndMessage(modalPubId,file,message);closeUploadModal();toast(`Versão ${result.nextVersion} enviada. Agora é a vez de ${memberName(result.targetId,'quem recebeu')}.`);try{if(typeof root?.renderPubs==='function')root.renderPubs()}catch(_e){}setTimeout(decorateRepository,250)}catch(e){console.error('P214 upload',e);toast(e?.code==='permission-denied'?'O Firebase bloqueou esta troca de arquivo.':(e.message||'Não consegui enviar o arquivo.'))}finally{btn.disabled=false;btn.textContent='Enviar arquivo + mensagem'}
}
function historyHtml(p,actor){
  const events=historyEvents(p).filter(x=>x.action!=='legacy'||x.when||x.byName);
  const rows=events.map(ev=>`<div class="p214-history-row"><div class="p214-history-when">${esc(formatWhen(ev.when))}</div><div class="p214-history-who">${esc(ev.byName||memberName(ev.byMemberId,'Carbonauta'))}</div><div class="p214-history-act">${esc(actionText(ev))}</div><div class="p214-history-ver">v${esc(ev.version)}</div></div>`).join('');
  const turnId=String(p.repositoryTurnMemberId||p.reviewNextRecipientId||''),turnName=memberName(turnId,turnId?'Participante':'');const mine=turnId&&actor?.memberId&&turnId===actor.memberId;const turn=turnId?`<div class="p214-turn ${mine?'mine':''}">${mine?'<b>Agora é sua vez.</b> Baixe, trabalhe no seu aplicativo e envie a próxima versão.':`Agora é a vez de <b>${esc(turnName||'quem recebeu')}</b>.`}</div>`:'';
  return `<div class="p214-history"><div class="p214-history-title">↔ Histórico da troca de arquivos</div>${rows||'<div class="p214-history-row"><div class="p214-history-act">Nenhuma movimentação registrada ainda.</div></div>'}${turn}</div>`;
}
function makeButton(cls,text,fn){const b=document.createElement('button');b.type='button';b.className=`btn p214-btn ${cls}`;b.textContent=text;b.addEventListener('click',fn);return b}
async function openMessageFor(pubId){
  const actor=await actorProfile(),p=await getPublication(pubId);if(!p||!actor)return toast('Arquivo não encontrado.');const target=nextRecipientId(p,actor.memberId);if(!target)return toast('Não encontrei a outra pessoa desta troca.');
  if(typeof root?.openRepositoryPrivateChat==='function')return root.openRepositoryPrivateChat(pubId);
  if(typeof root?.openPrivateChatWithContext==='function')return root.openPrivateChatWithContext(target,{type:'file',title:publicationTitle(p),version:`v${currentVersion(p)}`,eventLabel:'Origem: Repositório',sourceId:p.id});
  if(typeof root?.startPrivateConversation==='function')return root.startPrivateConversation(target);toast('O chat privado ainda não terminou de carregar.');
}
function hideLegacyActions(area){
  if(!area)return;[...area.querySelectorAll('button,a')].forEach(el=>{if(isLegacyOnlineAction(el))el.classList.add('p214-old-action')});[...area.querySelectorAll('button,a')].forEach(el=>{const t=norm(el.textContent),title=norm(el.getAttribute('title')||'');if((t.includes('baixar')||title.includes('baixar'))&&!el.classList.contains('p214-download'))el.classList.add('p214-old-action')});
}
async function decorateRepository(){
  if(!hasDocument())return;injectCss();ensureModal();const actor=await actorProfile();
  for(const row of $$('#viewPubs .pub-row')){
    const area=row.querySelector('.pub-act,.repo-actions');if(!area)continue;const id=publicationIdFromRow(row);if(!id)continue;row.dataset.p214PubId=id;const p=await getPublication(id);if(!isFilePublication(p))continue;hideLegacyActions(area);area.querySelectorAll('.p214-upload,.p214-download,.p214-message').forEach(x=>x.remove());
    const existingChat=area.querySelector('.p64-private-chat');if(existingChat){existingChat.textContent='💬 Mensagem';existingChat.title='Abrir a conversa privada desta troca de arquivo'}
    area.prepend(makeButton('p214-download','⬇ Baixar arquivo',async e=>{const b=e.currentTarget;try{b.disabled=true;b.textContent='Registrando…';await downloadPublication(id)}catch(err){console.error(err);toast(err.message||'Não consegui baixar o arquivo.')}finally{b.disabled=false;b.textContent='⬇ Baixar arquivo'}}));
    if(canExchange(p,actor))area.prepend(makeButton('p214-upload','⬆ Enviar nova versão',()=>openUploadModal(id)));
    if(!existingChat&&nextRecipientId(p,actor?.memberId))area.appendChild(makeButton('p214-message','💬 Mensagem',()=>openMessageFor(id)));
    row.querySelectorAll('.p214-history').forEach(x=>x.remove());const body=row.querySelector('.pub-body,.repo-main')||row,tmp=document.createElement('div');tmp.innerHTML=historyHtml(p,actor);body.appendChild(tmp.firstElementChild);
  }
}
let decorating=false;
function scheduleDecorate(){if(decorating)return;decorating=true;setTimeout(async()=>{try{await decorateRepository()}finally{decorating=false}},20)}
function boot(){
  if(!hasDocument())return;injectCss();ensureModal();scheduleDecorate();document.addEventListener('visibilitychange',()=>{if(!document.hidden)scheduleDecorate()});document.addEventListener('click',e=>{if(e.target.closest?.('[data-nav="pubs"],#navPubs,[data-view="pubs"]'))setTimeout(scheduleDecorate,120)},true);setInterval(()=>{if(document.body?.dataset?.view==='pubs'||$('#viewPubs')?.offsetParent)scheduleDecorate()},1200);console.info('Carbonautas troca de arquivos',BUILD,'carregada');
}

const api={privateThreadId,currentVersion,coordinatorId,nextRecipientId,canExchange,isLegacyOnlineAction,historyEvents,actionText,appendBaselineIfNeeded,formatWhen,publicationIdFromRow,commitUploadAndMessage,logDownload,downloadPublication,decorateRepository,openUploadModal,openMessageFor};
if(hasDocument()){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot()}
return api;
});