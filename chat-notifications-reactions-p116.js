/* Carbonautas P116 · reações visíveis + notificações Geral/Panelinha + celular */
(function(){
'use strict';
const VERSION='P116';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const startedAt=Date.now();
let me={memberId:'',uid:'',name:''},members=[],chatReady=false,unsubChat=null,unsubMembers=null,unsubThreads=null;
const groupSubs=new Map();
function F(){return window.fbFns}
function S(){try{return state}catch(_e){return null}}
function escCss(v){try{return CSS.escape(String(v||''))}catch(_e){return String(v||'').replace(/[^a-zA-Z0-9_-]/g,'\\$&')}}
function millis(ts){return ts?.toMillis?ts.toMillis():(ts?.seconds?ts.seconds*1000:+new Date(ts||0))}
function fresh(ts){const ms=millis(ts);return !!ms&&ms>=startedAt-12000}
function cleanId(v=''){return String(v).replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,180)}
function activeMembers(){const list=members.length?members:(S()?.members||[]);return list.filter(m=>m?.id&&m.id!==me.memberId&&m.status!=='inativo')}
function isGeneralMessage(m){return !!m&&m.tipo!=='recado'&&m.tipo!=='chat_group_meta'&&m.tipo!=='chat_group_message'&&m.tipo!=='mural'}
function textPreview(m,fallback){if(m?.imageUrl)return '📷 Nova foto/print na conversa.';const t=String(m?.text||'').trim();return (t||fallback).slice(0,220)}

async function identity(){
  const f=F(),uid=window.auth?.currentUser?.uid;if(!f||!uid)return false;
  try{const s=await f.getDoc(f.doc(window.db,'rede_users',uid));if(!s.exists())return false;const d=s.data();me={memberId:d.memberId||'',uid,name:d.nome||''};return !!me.memberId}catch(e){console.warn('P116 identidade',e);return false}
}
async function putNotification(docId,payload){
  const f=F();if(!f||!window.db)return;const ref=f.doc(window.db,'rede_notifications',docId);
  try{await f.setDoc(ref,payload)}catch(e){if(e?.code!=='permission-denied')console.warn('P116 notificação',e)}
}
async function notifyRecipients(prefix,messageId,recipientIds,base){
  const f=F();if(!f||!me.memberId||!window.auth?.currentUser?.uid)return;
  const ids=[...new Set((recipientIds||[]).filter(x=>x&&x!==me.memberId))];
  await Promise.all(ids.map(recipientId=>putNotification(`${cleanId(prefix)}_${cleanId(messageId)}_${cleanId(recipientId)}`,{
    recipientId,senderId:me.memberId,senderUid:window.auth.currentUser.uid,senderName:me.name||'Carbonauta',read:false,ts:f.serverTimestamp(),...base
  })));
}
async function notifyGeneral(m){
  if(!m||m.authorId!==me.memberId)return;
  await notifyRecipients('gen',m.id,activeMembers().map(x=>x.id),{
    kind:'general_message',title:'💬 Fofoca científica · nova mensagem',message:textPreview(m,'Nova mensagem na Fofoca científica.'),sourceType:'general_chat',sourceId:m.id,threadId:''
  });
}
async function notifyLegacyGroup(m,docs){
  if(!m?.groupId||m.authorId!==me.memberId)return;
  const meta=(docs||[]).find(x=>x.tipo==='chat_group_meta'&&x.groupId===m.groupId&&x.active!==false);if(!meta)return;
  await notifyRecipients('grpold',m.id,meta.memberIds||[],{
    kind:'group_message',title:`👥 ${meta.groupName||'Panelinha'} · nova mensagem`,message:textPreview(m,'Nova mensagem na panelinha.'),sourceType:'group_chat',sourceId:m.groupId,threadId:m.groupId
  });
}
function subscribeGeneralChat(){
  if(unsubChat||!F())return;const f=F(),q=f.query(f.collection(window.db,'rede_chat'),f.orderBy('ts','asc'));
  unsubChat=f.onSnapshot(q,snap=>{
    const docs=snap.docs.map(d=>({...d.data(),id:d.id}));
    const changes=snap.docChanges().filter(ch=>ch.type==='added');
    if(chatReady){changes.forEach(ch=>{const m={...ch.doc.data(),id:ch.doc.id};if(m.authorId!==me.memberId)return;if(m.tipo==='chat_group_message')notifyLegacyGroup(m,docs);else if(isGeneralMessage(m))notifyGeneral(m)})}
    else{changes.forEach(ch=>{const m={...ch.doc.data(),id:ch.doc.id};if(m.authorId!==me.memberId||!fresh(m.ts))return;if(m.tipo==='chat_group_message')notifyLegacyGroup(m,docs);else if(isGeneralMessage(m))notifyGeneral(m)});chatReady=true}
  },e=>console.warn('P116 Fofoca geral',e));
}
function subscribeOneGroup(t){
  if(!t?.id||groupSubs.has(t.id)||!F())return;const f=F(),q=f.query(f.collection(window.db,'rede_group_threads',t.id,'messages'),f.orderBy('createdAt','asc'));let ready=false;
  const unsub=f.onSnapshot(q,snap=>{
    const changes=snap.docChanges().filter(ch=>ch.type==='added');
    changes.forEach(ch=>{const m={...ch.doc.data(),id:ch.doc.id};if(m.authorMemberId!==me.memberId)return;if(!ready&&!fresh(m.createdAt))return;notifyRecipients('p48',m.id,t.memberIds||[],{
      kind:'group_message',title:`👥 ${t.groupName||'Panelinha'} · nova mensagem`,message:textPreview(m,'Nova mensagem na panelinha.'),sourceType:'group_chat',sourceId:t.id,threadId:t.id
    })});
    ready=true;
  },e=>console.warn('P116 mensagens panelinha',t.id,e));
  groupSubs.set(t.id,unsub);
}
function subscribeGroups(){
  if(unsubThreads||!F()||!me.memberId)return;const f=F(),q=f.query(f.collection(window.db,'rede_group_threads'),f.where('memberIds','array-contains',me.memberId));
  unsubThreads=f.onSnapshot(q,snap=>{
    const live=new Set();snap.docs.forEach(d=>{const t={...d.data(),id:d.id};if(t.active===false)return;live.add(t.id);subscribeOneGroup(t)});
    [...groupSubs.keys()].forEach(id=>{if(!live.has(id)){try{groupSubs.get(id)?.()}catch(_e){}groupSubs.delete(id)}});
  },e=>console.warn('P116 panelinhas',e));
}
function subscribeMembers(){
  if(unsubMembers||!F())return;unsubMembers=F().onSnapshot(F().collection(window.db,'rede_members'),s=>{members=s.docs.map(d=>({...d.data(),id:d.id}))},e=>console.warn('P116 membros',e));
}

function reactionCounts(id){
  try{const rs=(S()?.reactions||[]).filter(r=>r.targetType==='chat'&&r.targetId===id);return {like:rs.filter(r=>r.type==='like').length,heart:rs.filter(r=>r.type==='heart').length,party:rs.filter(r=>r.type==='party').length,dislike:rs.filter(r=>r.type==='dislike').length}}catch(_e){return {like:0,heart:0,party:0,dislike:0}}
}
function ensureCss(){
  if($('#p116Style'))return;const st=document.createElement('style');st.id='p116Style';st.textContent=`
  .p116-live-reacts{display:flex;justify-content:flex-end;align-items:center;gap:4px;flex-wrap:wrap;margin:-4px 7px 2px;position:relative;z-index:5;pointer-events:none;min-height:0}
  .p116-live-react{display:inline-flex;align-items:center;gap:3px;background:rgba(255,255,255,.96);border:1px solid #d9e7e4;border-radius:999px;padding:2px 7px;box-shadow:0 3px 10px rgba(22,58,63,.09);font:800 10.5px/1.25 system-ui;color:#486269}
  .p46-row.mine .p116-live-reacts{justify-content:flex-end}.p46-row:not(.mine) .p116-live-reacts{justify-content:flex-start;margin-left:7px}
  #p116PhoneNotify{border:1px solid #b8d9d5;background:#eef9f7;color:#0c706f;border-radius:10px;padding:9px 12px;font:800 12px system-ui;white-space:nowrap}
  #p116PhoneStatus{font:600 10.5px/1.3 system-ui;color:#6f8287;flex:1 1 180px}
  @media(max-width:700px){.p116-live-react{font-size:10px;padding:2px 6px}#p116PhoneNotify{font-size:11px;padding:8px 9px}}
  `;document.head.appendChild(st)
}
function decorateReactions(){
  $$('.p46-row[data-msg-id]').forEach(row=>{
    const id=row.dataset.msgId||'',stack=$('.p46-stack',row);if(!id||!stack)return;const c=reactionCounts(id),vals=[['👍',c.like],['💙',c.heart],['🎉',c.party],['🤨',c.dislike]].filter(x=>x[1]>0);let bar=$('.p116-live-reacts',stack);
    if(!vals.length){bar?.remove();return}if(!bar){bar=document.createElement('div');bar.className='p116-live-reacts';const social=$('.p46-social-box',stack);if(social)stack.insertBefore(bar,social);else stack.appendChild(bar)}
    const html=vals.map(([e,n])=>`<span class="p116-live-react">${e} ${n}</span>`).join('');if(bar.innerHTML!==html)bar.innerHTML=html;
  });
}

function deviceStatus(){if(!('Notification' in window))return 'Seu navegador não oferece avisos do dispositivo.';return Notification.permission==='granted'?'✅ Avisos do celular ativados enquanto o Carbonautas estiver em execução.':Notification.permission==='denied'?'⚠️ Avisos bloqueados nas permissões do navegador/app.':'Toque para permitir avisos no celular.'}
async function requestPhoneNotifications(){
  if(!('Notification' in window)){window.toast?.('Este navegador não oferece notificações do dispositivo.');return}
  try{const p=await Notification.requestPermission();ensurePhoneButton();window.toast?.(p==='granted'?'Notificações do celular ativadas.':'Permissão não concedida.')}catch(e){console.warn('P116 permissão',e)}
}
function ensurePhoneButton(){
  const card=$('#notifyCardP39');if(!card)return;let b=$('#p116PhoneNotify',card),status=$('#p116PhoneStatus',card);const clear=$('#notifyReadP39',card);const tools=clear?.parentElement;if(!tools)return;
  if(!b){b=document.createElement('button');b.type='button';b.id='p116PhoneNotify';b.textContent='📱 Notificar no celular';b.onclick=requestPhoneNotifications;tools.insertBefore(b,clear)}
  if(!status){status=document.createElement('span');status.id='p116PhoneStatus';tools.appendChild(status)}status.textContent=deviceStatus();
}
async function deviceNotify(n){
  if(!('Notification' in window)||Notification.permission!=='granted'||!n)return;
  const title=n.title||'Carbonautas',opts={body:n.message||'Nova notificação',icon:'./icons/icon-192.png',badge:'./icons/icon-192.png',tag:'carbonautas-'+(n.id||n.sourceId||Date.now()),renotify:false,data:{notificationId:n.id||'',sourceType:n.sourceType||'',sourceId:n.sourceId||'',threadId:n.threadId||''}};
  try{
    const mobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if(mobile&&'serviceWorker' in navigator){const reg=await navigator.serviceWorker.ready;await reg.showNotification(title,opts);return}
    const note=new Notification(title,opts);note.onclick=()=>{window.focus();routeNotification(n);note.close()};
  }catch(e){try{if('serviceWorker' in navigator){const reg=await navigator.serviceWorker.ready;await reg.showNotification(title,opts)}}catch(_e){console.warn('P116 aviso do dispositivo',e)}}
}
try{window.showDeviceNotification=deviceNotify}catch(_e){}

function goView(v){try{if(typeof window.switchView==='function')window.switchView(v);else if(typeof switchView==='function')switchView(v)}catch(e){console.warn('P116 view',e)}}
async function openGeneral(){goView('mensagens');await sleep(120);const b=$('#subNav [data-sub-view="mensagens"]');b?.click()}
async function openGroup(id){goView('mensagens');await sleep(120);$('.p46-panel-btn')?.click();for(let i=0;i<8;i++){await sleep(120);const b=$(`#p48List [data-g="${escCss(id)}"]`);if(b){b.click();return}}}
async function openPrivate(id){goView('conversas');await sleep(100);try{if(typeof window.openPrivateThread==='function'){window.openPrivateThread(id);return}if(typeof openPrivateThread==='function'){openPrivateThread(id);return}}catch(_e){}const b=$(`.private-thread[data-private-thread="${escCss(id)}"]`);b?.click()}
async function routeNotification(n){
  if(!n)return;const type=n.sourceType||'';
  if(type==='general_chat')return openGeneral();if(type==='group_chat')return openGroup(n.threadId||n.sourceId);if(type==='private_chat')return openPrivate(n.threadId||n.sourceId);
  try{if(typeof window.openNotification==='function')return window.openNotification(n.id);if(typeof openNotification==='function')return openNotification(n.id)}catch(_e){}
}
async function consumeChatNotification(n){
  const f=F();if(!n?.id||!f)return;try{await f.updateDoc(f.doc(window.db,'rede_notifications',n.id),{read:true,readAt:f.serverTimestamp()})}catch(_e){}await routeNotification(n);try{await f.deleteDoc(f.doc(window.db,'rede_notifications',n.id))}catch(_e){}
}
function interceptNotification(e){
  const b=e.target.closest?.('[data-p39nid]');if(!b)return;const id=b.getAttribute('data-p39nid'),n=(S()?.notifications||[]).find(x=>x.id===id);if(!n||!['general_chat','group_chat','private_chat'].includes(n.sourceType))return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();const p=$('#notifyPanelP39');if(p)p.style.display='none';document.documentElement.style.overflow='';consumeChatNotification(n)
}

function privateReadGuard(){
  if(document.body.dataset.view==='conversas')return;$$('.private-thread.on[data-private-thread]').forEach(x=>x.classList.remove('on'));
}
function polish(){ensureCss();decorateReactions();ensurePhoneButton();privateReadGuard()}
async function boot(){
  ensureCss();document.addEventListener('click',interceptNotification,true);let tries=0;while(tries++<80){if(window.fbFns&&window.db&&window.auth?.currentUser)break;await sleep(250)}if(!await identity())return;subscribeMembers();subscribeGeneralChat();subscribeGroups();polish();new MutationObserver(()=>polish()).observe(document.documentElement,{subtree:true,childList:true});new MutationObserver(()=>privateReadGuard()).observe(document.body,{attributes:true,attributeFilter:['data-view']});setInterval(polish,750);console.info('Carbonautas',VERSION,'reações + notificações dos chats carregadas')
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
