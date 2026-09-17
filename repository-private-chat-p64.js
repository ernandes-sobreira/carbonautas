/* Carbonautas P64 · Repositório → conversa privada 1:1 + exclusão segura */
(function(){
'use strict';
const VERSION='P64';
const BUILD='20260917';
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeId=s=>String(s||'x').replace(/[^A-Za-z0-9_-]/g,'_').slice(0,180);
let myProfileCache=null,contextUnsub=null,contextThreadId='',contextMessages=new Map(),patched=false,scanBusy=false;

function f(){return window.fbFns}
function toast(msg){if(typeof window.toast==='function')window.toast(msg);else console.log('[Carbonautas]',msg)}
function ms(ts){return ts?.toMillis?ts.toMillis():(ts?.seconds?ts.seconds*1000:+new Date(ts||0))}
function fmtContextDate(ts){const n=ms(ts);if(!n)return'';const d=new Date(n);return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})+' às '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}
function privateThreadId(a,b){return [String(a||''),String(b||'')].sort().map(x=>encodeURIComponent(x)).join('__')}

async function myProfile(){
  const uid=window.auth?.currentUser?.uid||'';if(!uid)return null;if(myProfileCache?.uid===uid)return myProfileCache;
  try{const F=f(),snap=await F.getDoc(F.doc(window.db,'rede_users',uid));if(!snap.exists())return null;myProfileCache={...snap.data(),uid};return myProfileCache}catch(e){console.warn('P64 perfil',e);return null}
}
async function isCoordinator(){
  const u=window.auth?.currentUser;if(!u)return false;if((u.email||'').toLowerCase()==='ernandes.sobreira@gmail.com')return true;
  const p=await myProfile();return p?.role==='coordinator'||p?.memberId==='seed-ernandes-sobreira-oliveira-junior';
}

function injectCss(){
  if($('#p64Style'))return;
  const s=document.createElement('style');s.id='p64Style';s.textContent=`
  .repo-room-btn,.repo-direct-btn,.review-chat-btn,.repo-file-chat-btn{display:none!important}
  .p64-private-chat{display:inline-flex!important;background:#fff!important;color:#17313d!important;border:1px solid #cbdade!important}
  .p64-delete{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;background:#fff7f8!important;color:#b4233d!important;border:1px solid #efc4cb!important;font-weight:850!important}
  #repoPackageList .repo-package-actions .p64-delete{min-width:96px!important;width:auto!important;height:40px!important;padding:0 12px!important;border-radius:11px!important;font-size:11px!important}
  #repoPackageList .repo-package-actions .mini-x{display:none!important}
  .p55-actions-grid .p64-delete{width:154px!important;min-width:154px!important;max-width:154px!important;height:44px!important;min-height:44px!important;max-height:44px!important;border-radius:10px!important;font-size:12px!important}
  .p64-context-card{min-width:min(330px,68vw);max-width:560px;border:1px solid #cbdfe2;border-left:4px solid #168c98;border-radius:13px;background:linear-gradient(135deg,#f7fbfb,#fff);padding:10px 11px;color:#17313d;white-space:normal}
  .p64-context-card[data-kind="correction"]{border-left-color:#7259d6}.p64-context-card[data-kind="orientation"]{border-left-color:#168dc0}.p64-context-card[data-kind="deadline"]{border-left-color:#d88923}
  .p64-context-top{display:flex;align-items:center;gap:7px;font-size:9.5px;font-weight:950;letter-spacing:.08em;text-transform:uppercase;color:#55717a;margin-bottom:5px}.p64-context-title{font-size:13px;font-weight:900;line-height:1.28;color:#15313b}.p64-context-meta{font-size:10px;color:#6b7f87;margin-top:4px;line-height:1.35}
  #p64DeleteOverlay{position:fixed;inset:0;z-index:2147483646;background:rgba(5,18,28,.68);display:none;align-items:center;justify-content:center;padding:18px}
  #p64DeleteOverlay.open{display:flex}.p64-confirm{width:min(480px,100%);background:#fff;border-radius:20px;box-shadow:0 24px 80px rgba(6,26,38,.28);overflow:hidden}.p64-confirm-body{padding:22px}.p64-confirm-body h3{margin:0 0 8px;font-size:20px;color:#142d38}.p64-confirm-body p{margin:0;color:#60767e;font-size:13px;line-height:1.5}.p64-confirm-actions{display:flex;justify-content:flex-end;gap:8px;padding:13px 16px;border-top:1px solid #e1e9eb;background:#f8fbfb}.p64-confirm-actions button{border:1px solid #ccdadd;border-radius:11px;padding:9px 14px;background:#fff;font-weight:850;color:#24414b}.p64-confirm-actions .danger{background:#b4233d;border-color:#b4233d;color:#fff}
  @media(max-width:760px){#repoPackageList .repo-package-actions .p64-delete{min-width:72px!important;width:72px!important;height:34px!important;padding:0 5px!important;font-size:9.5px!important}.p55-actions-grid .p64-delete{width:100%!important;min-width:0!important;max-width:none!important;height:42px!important;min-height:42px!important;max-height:42px!important;font-size:11px!important}.p64-context-card{min-width:min(270px,72vw)}}
  `;document.head.appendChild(s);
  if(!$('#p64DeleteOverlay')){const d=document.createElement('div');d.id='p64DeleteOverlay';d.innerHTML=`<div class="p64-confirm" role="dialog" aria-modal="true" aria-labelledby="p64ConfirmTitle"><div class="p64-confirm-body"><h3 id="p64ConfirmTitle">Excluir pasta?</h3><p id="p64ConfirmText"></p></div><div class="p64-confirm-actions"><button type="button" id="p64CancelDelete">Cancelar</button><button type="button" class="danger" id="p64ConfirmDelete">Excluir</button></div></div>`;document.body.appendChild(d)}
}
function confirmDeleteFolder(name){
  injectCss();const ov=$('#p64DeleteOverlay'),title=$('#p64ConfirmTitle'),text=$('#p64ConfirmText'),cancel=$('#p64CancelDelete'),ok=$('#p64ConfirmDelete');
  title.textContent=`Excluir “${name||'esta pasta'}”?`;text.textContent='Esta ação apagará a pasta e os arquivos dela.';ov.classList.add('open');
  return new Promise(resolve=>{let done=false;const finish=v=>{if(done)return;done=true;ov.classList.remove('open');cancel.onclick=null;ok.onclick=null;ov.onclick=null;resolve(v)};cancel.onclick=()=>finish(false);ok.onclick=()=>finish(true);ov.onclick=e=>{if(e.target===ov)finish(false)}});
}

async function getPublication(id){const F=f(),s=await F.getDoc(F.doc(window.db,'rede_publicacoes',id));return s.exists()?{...s.data(),id:s.id}:null}
async function getPackage(id){const F=f(),s=await F.getDoc(F.doc(window.db,'rede_repository_packages',id));return s.exists()?{...s.data(),id:s.id}:null}
async function getPackageFile(packageId,fileId){const F=f(),s=await F.getDoc(F.doc(window.db,'rede_repository_packages',packageId,'files',fileId));return s.exists()?{...s.data(),id:s.id}:null}
async function getDirectory(memberId){if(!memberId)return null;const F=f(),s=await F.getDoc(F.doc(window.db,'rede_private_directory',memberId));return s.exists()?{...s.data(),memberId}:null}

function normalizeContext(ctx={}){
  const type=['file','correction','orientation','deadline'].includes(ctx.type)?ctx.type:'file',icon=ctx.icon||(type==='correction'?'✍️':type==='orientation'?'🧭':type==='deadline'?'⏰':'📎'),label=ctx.label||(type==='correction'?'CORREÇÃO':type==='orientation'?'ORIENTAÇÃO':type==='deadline'?'PRAZO':'ARQUIVO');
  return {type,icon,label,title:String(ctx.title||ctx.subject||'Referência').slice(0,220),version:String(ctx.version||'').slice(0,40),eventLabel:String(ctx.eventLabel||ctx.subtitle||'').slice(0,180),sourceId:String(ctx.sourceId||'').slice(0,180)};
}
function compactContext(ctx){const c=normalizeContext(ctx),parts=[`${c.icon} ${c.label}`,c.title];if(c.version)parts.push(c.version);if(c.eventLabel)parts.push(c.eventLabel);return parts.filter(Boolean).join(' · ').slice(0,158)}
function contextMessageId(ctx){const c=normalizeContext(ctx);return `ctx_${safeId(c.type)}_${safeId(c.sourceId||c.title)}_${safeId(c.version||'base')}`.slice(0,190)}

async function createContextMessage(targetMemberId,ctx){
  const F=f(),u=window.auth?.currentUser,me=await myProfile();if(!u||!me?.memberId||!targetMemberId)return false;
  const tid=privateThreadId(me.memberId,targetMemberId),threadRef=F.doc(window.db,'rede_private_threads',tid),threadSnap=await F.getDoc(threadRef);if(!threadSnap.exists())return false;
  const targetUid=(threadSnap.data().participants||[]).find(x=>x!==u.uid)||'';if(!targetUid)return false;
  const summary=compactContext(ctx),msgRef=F.doc(F.collection(threadRef,'messages'),contextMessageId(ctx)),exists=await F.getDoc(msgRef);if(exists.exists())return true;
  const batch=F.writeBatch(window.db);batch.set(msgRef,{senderUid:u.uid,senderMemberId:me.memberId,text:summary,createdAt:F.serverTimestamp(),readBy:[u.uid],replyTo:null});batch.update(threadRef,{updatedAt:F.serverTimestamp(),lastMessage:summary,lastSenderUid:u.uid,lastSenderMemberId:me.memberId,[`unreadBy.${targetUid}`]:F.increment(1)});await batch.commit();
  try{const meName=me.nome||'Carbonauta';await F.addDoc(F.collection(window.db,'rede_notifications'),{recipientId:targetMemberId,senderId:me.memberId,senderUid:u.uid,senderName:meName,kind:'private_message',title:`🔐 Nova referência privada de ${meName}`,message:'Você recebeu uma nova mensagem privada.',sourceType:'private_chat',sourceId:tid,threadId:tid,read:false,ts:F.serverTimestamp()})}catch(e){console.warn('P64 notificação',e)}
  return true;
}
function contextFromSummary(text=''){
  const t=String(text||'').trim();let type='',icon='',label='';
  if(t.startsWith('✍️ CORREÇÃO')){type='correction';icon='✍️';label='CORREÇÃO'}else if(t.startsWith('🧭 ORIENTAÇÃO')){type='orientation';icon='🧭';label='ORIENTAÇÃO'}else if(t.startsWith('⏰ PRAZO')){type='deadline';icon='⏰';label='PRAZO'}else if(t.startsWith('📎 ARQUIVO')){type='file';icon='📎';label='ARQUIVO'}else return null;
  const parts=t.split(' · ').map(x=>x.trim()).filter(Boolean);return {type,icon,label,title:parts[1]||'Referência',meta:parts.slice(2).join(' · ')};
}
function decorateContextMessages(){
  $$('.private-msg[data-mid]').forEach(row=>{const id=row.getAttribute('data-mid'),msg=contextMessages.get(id);if(!msg)return;const c=contextFromSummary(msg.text);if(!c)return;const bubble=row.querySelector('.private-bubble');if(!bubble||bubble.dataset.p64ctx)return;bubble.dataset.p64ctx='1';bubble.innerHTML=`<div class="p64-context-card" data-kind="${esc(c.type)}"><div class="p64-context-top"><span>${esc(c.icon)}</span><span>${esc(c.label)}</span></div><div class="p64-context-title">${esc(c.title)}</div>${c.meta?`<div class="p64-context-meta">${esc(c.meta)}</div>`:''}</div>`})
}
function watchContextThread(id){
  if(!id||contextThreadId===id)return;if(contextUnsub){try{contextUnsub()}catch(e){}}contextThreadId=id;contextMessages=new Map();
  try{const F=f(),q=F.query(F.collection(window.db,'rede_private_threads',id,'messages'),F.orderBy('createdAt','asc'));contextUnsub=F.onSnapshot(q,snap=>{contextMessages=new Map(snap.docs.map(d=>[d.id,{...d.data(),id:d.id}]));setTimeout(decorateContextMessages,0)},e=>console.warn('P64 contexto',e))}catch(e){console.warn('P64 contexto subscribe',e)}
}

async function ensurePrivateConversation(targetMemberId,ctx){
  const me=await myProfile();if(!me?.memberId)return toast('Seu perfil ainda não está vinculado à Rede.');if(!targetMemberId)return toast('Não encontrei a pessoa responsável por este item.');if(targetMemberId===me.memberId)return toast('Este item está vinculado a você. Não há outra pessoa responsável para abrir uma conversa 1:1.');
  const dir=await getDirectory(targetMemberId).catch(()=>null);if(!dir?.uid)return toast('Essa pessoa ainda não está disponível no diretório do chat privado.');if(typeof window.startPrivateConversation!=='function')return toast('O chat privado ainda não terminou de carregar.');
  await window.startPrivateConversation(targetMemberId);const tid=privateThreadId(me.memberId,targetMemberId);
  for(let i=0;i<8;i++){try{const snap=await f().getDoc(f().doc(window.db,'rede_private_threads',tid));if(snap.exists())break}catch(e){}await new Promise(r=>setTimeout(r,80))}
  try{await createContextMessage(targetMemberId,ctx)}catch(e){console.error('P64 contexto',e);toast(e?.code==='permission-denied'?'A conversa abriu, mas o Firestore bloqueou o cartão de referência.':'A conversa abriu, mas não consegui inserir a referência.')}
  if(typeof window.switchView==='function')window.switchView('conversas');if(typeof window.openPrivateThread==='function')window.openPrivateThread(tid);watchContextThread(tid);setTimeout(decorateContextMessages,120);
}
async function openPublicationChat(pubId){
  try{const p=await getPublication(pubId);if(!p)return toast('Arquivo não encontrado.');const me=await myProfile();if(!me?.memberId)return toast('Seu perfil ainda não está vinculado.');let targetId=p.memberId||'',root=p;
    if(p.reviewFlow){const rootId=p.reviewThreadId||p.id;if(rootId!==p.id){const r=await getPublication(rootId);if(r)root=r}if(me.memberId===root.reviewReviewerId)targetId=root.reviewReturnToId||p.memberId||'';else if(me.memberId===root.reviewReturnToId)targetId=root.reviewReviewerId||p.reviewReviewerId||'';else targetId=p.reviewNextRecipientId||root.reviewNextRecipientId||p.memberId||'';const when=fmtContextDate(p.ts),title=p.fileName||p.reviewBaseTitle||p.titulo||'Arquivo';return ensurePrivateConversation(targetId,{type:'correction',title,version:`v${Number(p.reviewVersion||1)}`,eventLabel:when?`enviado em ${when}`:'',sourceId:p.id})}
    return ensurePrivateConversation(targetId,{type:'file',title:p.fileName||p.titulo||'Arquivo',eventLabel:'Origem: Repositório',sourceId:p.id});
  }catch(e){console.error(e);toast(e.message||'Não foi possível abrir a conversa privada.')}
}
async function openPackageChat(packageId,fileId){
  try{const [pkg,file,me]=await Promise.all([getPackage(packageId),getPackageFile(packageId,fileId),myProfile()]);if(!pkg||!file)return toast('Arquivo não encontrado nesta pasta.');let targetId=pkg.ownerMemberId||'';if(targetId===me?.memberId&&pkg.createdByMemberId&&pkg.createdByMemberId!==me.memberId)targetId=pkg.createdByMemberId;return ensurePrivateConversation(targetId,{type:'file',title:file.fileName||file.title||'Arquivo',eventLabel:'Origem: Repositório',sourceId:`${packageId}_${fileId}`})}catch(e){console.error(e);toast(e.message||'Não foi possível abrir a conversa privada.')}
}
function openPrivateChatWithContext(targetMemberId,context){return ensurePrivateConversation(targetMemberId,normalizeContext(context||{}))}

function publicationIdFromRow(row){
  const all=[...row.querySelectorAll('button[onclick],a[onclick]')];for(const el of all){const m=String(el.getAttribute('onclick')||'').match(/(?:messagePublicationOwner|openRepoFileConversationPublication|openReviewConversation|deletePublicacao)\('([^']+)'\)/);if(m)return m[1]}const m=all.map(x=>String(x.getAttribute('onclick')||'')).join(' ').match(/id:'([^']+)'/);return m?.[1]||'';
}
function packageInfoFromFileRow(row){const el=row.querySelector('[onclick*="openRepoFileConversationPackage"],[onclick*="openPackageOnlineEdit"],[onclick*="deleteRepositoryPackageFile"]');if(!el)return null;const m=String(el.getAttribute('onclick')||'').match(/(?:openRepoFileConversationPackage|openPackageOnlineEdit|deleteRepositoryPackageFile)\('([^']+)'\s*,\s*'([^']+)'\)/);return m?{packageId:m[1],fileId:m[2]}:null}
function packageIdFromCard(card){const el=card.querySelector('[onclick*="openRepositoryPackage"]'),m=String(el?.getAttribute('onclick')||'').match(/openRepositoryPackage\('([^']+)'\)/);return m?.[1]||''}
function makeChatButton(onclick){const b=document.createElement('button');b.type='button';b.className='btn p64-private-chat';b.textContent='💬 Conversar';b.onclick=onclick;return b}
function makeDeleteButton(onclick){const b=document.createElement('button');b.type='button';b.className='btn p64-delete';b.textContent='🗑 Excluir';b.onclick=onclick;return b}

async function decorateRepository(){
  if(scanBusy)return;scanBusy=true;
  try{
    $$('#viewPubs .pub-row').forEach(row=>{const area=row.querySelector('.pub-act,.repo-actions');if(!area)return;const id=publicationIdFromRow(row);if(!id)return;area.querySelectorAll('.repo-room-btn,.repo-direct-btn,.review-chat-btn,.repo-file-chat-btn,.p64-private-chat').forEach(x=>x.remove());const hasFile=!!area.querySelector('[onclick*="openFilePreview"],.review-download');if(hasFile)area.appendChild(makeChatButton(()=>openPublicationChat(id)));const del=area.querySelector('.mini-x[onclick*="deletePublicacao"],button[onclick*="deletePublicacao"]');if(del&&!del.classList.contains('p64-delete')){del.classList.remove('mini-x');del.classList.add('btn','p64-delete');del.textContent='🗑 Excluir';del.title='Excluir'}});
    $$('.repo-package-file').forEach(row=>{const area=row.querySelector('.repo-package-actions');if(!area)return;const info=packageInfoFromFileRow(row);if(!info)return;area.querySelectorAll('.repo-file-chat-btn,.p64-private-chat').forEach(x=>x.remove());area.appendChild(makeChatButton(()=>openPackageChat(info.packageId,info.fileId)));const del=area.querySelector('button[onclick*="deleteRepositoryPackageFile"]');if(del){del.classList.add('p64-delete');del.textContent='🗑 Excluir';del.title='Excluir arquivo'}});
    const coord=await isCoordinator();for(const card of $$('#repoPackageList .repo-package-card')){const area=card.querySelector('.repo-package-actions');if(!area)continue;const id=packageIdFromCard(card);if(!id)continue;let del=area.querySelector('[onclick*="deleteRepositoryPackage"]');if(del){del.classList.remove('mini-x');del.classList.add('btn','p64-delete');del.textContent='🗑 Excluir';del.title='Excluir pasta';del.onclick=()=>deletePackageP64(id)}if(!del&&coord&&card.querySelector('.repo-access-chip.group')){try{const pkg=await getPackage(id);if(pkg?.accessMode==='group'&&pkg?.personalRepo!==true){del=makeDeleteButton(()=>deletePackageP64(id));area.appendChild(del)}}catch(e){console.warn('P64 pasta pública',e)}}}
  }finally{scanBusy=false}
}
async function canDeletePackageP64(pkg){const u=window.auth?.currentUser,me=await myProfile();if(!u||!pkg)return false;if(pkg.createdByUid===u.uid||pkg.ownerMemberId===me?.memberId)return true;return (await isCoordinator())&&pkg.accessMode==='group'&&pkg.personalRepo!==true}
async function deletePackageP64(id){
  try{const pkg=await getPackage(id);if(!pkg)return toast('A pasta não existe mais.');if(!(await canDeletePackageP64(pkg)))return toast('Você não pode excluir esta pasta.');if(!(await confirmDeleteFolder(pkg.title||'esta pasta')))return;const F=f(),pref=F.doc(window.db,'rede_repository_packages',id),snap=await F.getDocs(F.collection(pref,'files'));for(const d of snap.docs){const x=d.data();if(x.storagePath&&F.deleteObject&&F.sRef&&window.storage){try{await F.deleteObject(F.sRef(window.storage,x.storagePath))}catch(e){console.warn('P64 storage',e)}}await F.deleteDoc(d.ref)}await F.deleteDoc(pref);try{if(typeof window.closeOverlay==='function')window.closeOverlay('repoPackageOverlay')}catch(e){}toast('Pasta excluída.')}catch(e){console.error(e);toast(e?.code==='permission-denied'?'O Firestore ainda não permite esta exclusão. Publique as regras P64.':(e.message||'Não foi possível excluir a pasta.'))}
}

function patchGlobals(){
  if(patched)return;patched=true;
  window.messagePublicationOwner=id=>openPublicationChat(id);window.openRepoFileConversationPublication=id=>openPublicationChat(id);window.openReviewConversation=id=>openPublicationChat(id);window.openRepoFileConversationPackage=(packageId,fileId)=>openPackageChat(packageId,fileId);window.openRepositoryPrivateChat=openPublicationChat;window.openPrivateChatWithContext=openPrivateChatWithContext;window.deleteRepositoryPackage=deletePackageP64;
  const originalOpen=window.openPrivateThread;if(typeof originalOpen==='function'&&!originalOpen.__p64){const wrapped=function(id){const out=originalOpen.apply(this,arguments);watchContextThread(id);setTimeout(decorateContextMessages,80);return out};wrapped.__p64=true;window.openPrivateThread=wrapped}
}
function boot(){injectCss();patchGlobals();decorateRepository();setInterval(()=>{decorateRepository();decorateContextMessages()},900);console.info('Carbonautas',VERSION,BUILD,'repositório → privadas 1:1 + exclusão segura carregados')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
