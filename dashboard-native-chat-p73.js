/* Carbonautas P75 · lembretes robustos + status "lembrado" no Painel */
(function(){
'use strict';
const VERSION='P75', BUILD='20260917', STORE='carbonautas_panel_followups_v1';
let busy=false,pending=null,scheduled=false,recovered=false;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function F(){return window.fbFns}
function toast(msg){
  let el=document.getElementById('p73Toast');
  if(!el){el=document.createElement('div');el.id='p73Toast';el.style.cssText='position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147483647;background:#17313d;color:#fff;padding:11px 15px;border-radius:12px;font:700 12px/1.35 system-ui;box-shadow:0 12px 36px rgba(0,0,0,.25);max-width:min(620px,92vw);text-align:center';document.body.appendChild(el)}
  el.textContent=msg;el.style.display='block';clearTimeout(el._t);el._t=setTimeout(()=>el.style.display='none',4600);
}
function first(v=''){return String(v||'Carbonauta').trim().split(/\s+/)[0]||'Carbonauta'}
function norm(v=''){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function cardOf(el){return el?.closest?.('.p56-task')||null}
function cardWho(card){return (card?.querySelector('.p56-who')?.textContent||'Carbonauta').trim()}
function cardTitle(card){return (card?.querySelector('.p56-what')?.textContent||'esta demanda').trim()}
function loadStore(){try{return JSON.parse(localStorage.getItem(STORE)||'{}')||{}}catch(_e){return{}}}
function saveStore(v){try{localStorage.setItem(STORE,JSON.stringify(v||{}))}catch(_e){}}
function fmtStamp(ts){const d=new Date(ts);return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})+' às '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}
function stampKey(meta){return meta?.key||''}
function markSent(meta){if(!meta?.key)return;const all=loadStore();all[meta.key]={...meta,ts:Date.now()};saveStore(all);pending=null;decorateFollowups();toast('✓ Lembrete enviado. O Painel agora mostra “aguardando retorno”.')}
function activityIdFrom(card,btn){
  if(btn?.dataset?.activityId)return btn.dataset.activityId;
  const key=card?.dataset?.p69Key||'';if(key.startsWith('activity:'))return key.slice(9);
  const raw=[...(card?.querySelectorAll('button[onclick]')||[])].map(b=>b.getAttribute('onclick')||'').join(' '),m=raw.match(/activity:([^'\)]+)/);return m?.[1]||'';
}
function cardKey(card){
  if(!card)return'';
  if(card.dataset.p72CheckinMember){return `checkin:${card.dataset.p72CheckinMember}:${card.dataset.p72CheckinMonth||norm(cardTitle(card))}`}
  const k=card.dataset.p69Key||'';if(k.startsWith('activity:'))return k;
  const id=activityIdFrom(card,null);return id?`activity:${id}`:'';
}
async function activity(id){
  if(!id||!F()||!window.db)return null;
  try{const p=F().getDoc(F().doc(window.db,'rede_activities',id)),s=await Promise.race([p,new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),5000))]);return s.exists()?{...s.data(),id:s.id}:null}catch(e){console.warn('P75 atividade',e);return null}
}
async function memberDoc(memberId){try{const s=await F().getDoc(F().doc(window.db,'rede_members',memberId));return s.exists()?{...s.data(),id:s.id}:null}catch(_e){return null}}
async function currentProfile(){const u=window.auth?.currentUser;if(!u||!F())return null;try{const s=await F().getDoc(F().doc(window.db,'rede_users',u.uid));return s.exists()?{...s.data(),uid:u.uid}:null}catch(_e){return null}}
async function directoryEntry(memberId){try{const s=await F().getDoc(F().doc(window.db,'rede_private_directory',memberId));return s.exists()?{...s.data(),memberId}:null}catch(_e){return null}}
async function ensureDirectory(memberId,name){
  const existing=await directoryEntry(memberId);if(existing?.uid)return {ok:true,uid:existing.uid};
  try{
    const f=F(),q=f.query(f.collection(window.db,'rede_users'),f.where('memberId','==',memberId),f.limit(3)),snap=await f.getDocs(q);
    if(snap.empty)return {ok:false,reason:'no-account'};
    if(snap.size>1)return {ok:false,reason:'multiple-accounts',count:snap.size};
    const u=snap.docs[0],m=await memberDoc(memberId);
    await f.setDoc(f.doc(window.db,'rede_private_directory',memberId),{uid:u.id,memberId,nome:m?.nome||u.data()?.nome||name||'',foto:m?.foto||'',updatedAt:f.serverTimestamp()},{merge:true});
    return {ok:true,uid:u.id,repaired:true};
  }catch(e){console.warn('P75 diretorio',e);return {ok:false,reason:e?.code==='permission-denied'?'permission':'directory-failed'}}
}
function contextDraft(ctx={}){
  const n=first(ctx.personName||'Carbonauta'),title=String(ctx.title||'esta demanda').trim(),label=String(ctx.label||'').toLowerCase(),event=String(ctx.eventLabel||'').toLowerCase(),txt=label+' '+event;
  if(/corre|arquivo/.test(txt))return `${n}, preciso do arquivo de “${title}” para fazer a correção. Pode enviar pelo Repositório?`;
  if(/informa/.test(txt))return `${n}, preciso das informações referentes a “${title}” para conseguir dar andamento. Pode me enviar por aqui?`;
  if(/dados/.test(txt))return `${n}, preciso dos dados/resultados referentes a “${title}”. Pode me enviar ou indicar onde estão?`;
  if(/assin/.test(txt))return `${n}, preciso da assinatura referente a “${title}”. Pode providenciar e me avisar quando estiver pronta?`;
  if(/orient/.test(txt))return `${n}, precisamos alinhar “${title}”. Me diga como está o andamento e combinamos o próximo passo.`;
  if(/pend/.test(txt))return `${n}, a pendência “${title}” ainda está aberta. O que falta para resolver e qual a previsão?`;
  if(/entrega|produto/.test(txt))return `${n}, preciso da entrega de “${title}”. Pode enviar o material pelo Repositório e me avisar por aqui?`;
  if(/atualiza|check/.test(txt))return `${n}, me atualize sobre “${title}”: o que já foi feito, qual a dificuldade atual e qual é o próximo passo?`;
  return `${n}, como está o andamento de “${title}”? Me diga o que já foi feito e qual é o próximo passo.`;
}
function activityDraft(a,name){
  const n=first(name),title=String(a?.title||'esta demanda').trim(),type=String(a?.type||'').toLowerCase(),txt=`${title} ${a?.description||''}`.toLowerCase();
  if(type==='correcao'||/correç|corrig|revis/.test(txt))return `${n}, preciso do arquivo de “${title}” para fazer a correção. Pode enviar pelo Repositório?`;
  if(/requerimento|cnpj|cpf|endereço|endereco|telefone|cep|razão social|razao social|informações|informacoes/.test(txt))return `${n}, preciso das informações de “${title}” para dar andamento. Pode me enviar por aqui?`;
  if(/planilha|base de dados|banco de dados|dataset|resultados/.test(txt))return `${n}, preciso dos dados/resultados de “${title}”. Pode me enviar ou indicar onde estão?`;
  if(type==='pendencia')return `${n}, a pendência “${title}” ainda está aberta. O que falta para resolver e qual a previsão?`;
  if(type==='produto'||/resumo|artigo|tese|dissertação|dissertacao|relatório|relatorio|projeto|plano|apresentação|apresentacao|manuscrito/.test(txt))return `${n}, preciso da entrega de “${title}”. Pode enviar o material pelo Repositório e me avisar por aqui?`;
  return `${n}, como está o andamento de “${title}”? Me diga o que já foi feito e qual é o próximo passo.`;
}
async function openNativePrivate(memberId,draft,name='Carbonauta',meta={}){
  if(busy)return;busy=true;
  try{
    if(!memberId){toast('Não consegui identificar a pessoa desta demanda.');return}
    toast(`Verificando acesso de ${first(name)}…`);
    const dir=await ensureDirectory(memberId,name);
    if(!dir.ok){
      if(dir.reason==='no-account')toast(`${first(name)} ainda não tem conta vinculada. Abra 🛡️ Gerenciar acessos para criar ou vincular a conta.`);
      else if(dir.reason==='multiple-accounts')toast(`${first(name)} tem mais de uma conta vinculada. Corrija isso em 🛡️ Gerenciar acessos antes de conversar.`);
      else if(dir.reason==='permission')toast(`Não consegui reparar o acesso privado de ${first(name)} por falta de permissão.`);
      else toast(`Não consegui preparar o chat privado de ${first(name)}.`);
      return;
    }
    const newBtn=document.getElementById('privateNewBtn');if(!newBtn){toast('A área de conversas privadas ainda não foi carregada. Recarregue a página.');return}
    toast(`Abrindo conversa com ${first(name)}…`);newBtn.click();
    let personBtn=null;
    for(let i=0;i<35;i++){personBtn=[...document.querySelectorAll('[data-private-person]')].find(b=>b.dataset.privatePerson===memberId)||null;if(personBtn&&!personBtn.disabled)break;await sleep(100)}
    if(!personBtn||personBtn.disabled){document.getElementById('privateNewOverlay')?.classList.remove('open');toast(`${first(name)} tem conta vinculada, mas o diretório privado ainda não sincronizou. Feche e abra Conversas novamente.`);return}
    personBtn.click();
    let input=null;
    for(let i=0;i<55;i++){input=document.getElementById('privateInput');if(input&&document.getElementById('privateShell')?.classList.contains('chat-open'))break;await sleep(100)}
    if(!input||!document.getElementById('privateShell')?.classList.contains('chat-open')){toast(`A conversa com ${first(name)} não abriu. Se persistir, revise o vínculo em Gerenciar acessos.`);return}
    input.value=draft;input.focus();input.style.height='auto';input.style.height=Math.min(130,input.scrollHeight)+'px';input.dispatchEvent(new Event('input',{bubbles:true}));
    pending={...meta,memberId,title:meta.title||'',draft,personName:name,openedAt:Date.now()};
    toast(`Conversa com ${first(name)} aberta. Revise e envie a mensagem.`);
  }finally{busy=false}
}
async function openRequestButton(btn){
  const card=cardOf(btn),id=activityIdFrom(card,btn),a=await activity(id),name=cardWho(card),title=cardTitle(card);
  if(!a){toast('Não consegui localizar essa demanda no acompanhamento.');return}
  await openNativePrivate(a.ownerId,activityDraft(a,name),name||a.ownerName||'Carbonauta',{key:`activity:${a.id}`,kind:'activity',sourceId:a.id,title});
}
async function openCheckin(btn){
  const card=cardOf(btn),memberId=btn.dataset.memberId,name=cardWho(card),title=btn.dataset.label||cardTitle(card)||'check-in mensal',month=card?.dataset?.p72CheckinMonth||norm(title);
  const draft=`${first(name)}, seu ${String(title).toLowerCase()} ainda não foi registrado. Quando puder, preencha o que foi feito, dificuldades e próximo passo.`;
  await openNativePrivate(memberId,draft,name,{key:`checkin:${memberId}:${month}`,kind:'checkin',title,month});
}
function waitForSend(meta,initial){
  let tries=0;const poll=()=>{tries++;const input=document.getElementById('privateInput');if(!input)return;if(!input.value.trim()){markSent(meta);return}if(tries<45)setTimeout(poll,120)};setTimeout(poll,160)
}
function armSendWatch(){
  window.addEventListener('click',e=>{if(!pending)return;const b=e.target?.closest?.('#privateSendBtn');if(!b)return;const input=document.getElementById('privateInput'),txt=(input?.value||'').trim();if(!txt)return;const meta={...pending,sentText:txt};waitForSend(meta,txt)},true);
  window.addEventListener('keydown',e=>{if(!pending||e.key!=='Enter'||e.shiftKey)return;const input=e.target;if(input?.id!=='privateInput'||!String(input.value||'').trim())return;const meta={...pending,sentText:String(input.value||'').trim()};waitForSend(meta,meta.sentText)},true);
}
function decorateFollowups(){
  const store=loadStore();
  document.querySelectorAll('#dashAttention .p56-task').forEach(card=>{
    const key=cardKey(card),st=key?store[key]:null;if(!st)return;
    card.dataset.p75Waiting='1';card.style.borderLeftColor='#23a46f';card.style.background='#f7fffb';
    const detail=card.querySelector('.p56-detail');
    if(detail&&!detail.querySelector('.p75-reminded-state')){
      const box=document.createElement('div');box.className='p75-reminded-state';box.style.cssText='margin-top:7px;padding:7px 9px;border:1px solid #bfe8d2;background:#effbf5;border-radius:9px;color:#176b4a;font-size:11px;font-weight:800';box.textContent=`✅ Lembrado em ${fmtStamp(st.ts)} · aguardando retorno`;detail.appendChild(box);
    }
    const actions=card.querySelector('.p56-task-actions');if(actions){const b=[...actions.querySelectorAll('button')].find(x=>x.classList.contains('p72-checkin-remind')||x.classList.contains('p70-smart-request')||x.classList.contains('p69-wait'));if(b&&!/conversar novamente/i.test(b.textContent||''))b.textContent='💬 Conversar novamente'}
  });
}
async function recoverFromThreads(){
  if(recovered||!F()||!window.auth?.currentUser)return;recovered=true;
  try{
    const me=await currentProfile();if(!me?.memberId)return;const f=F(),q=f.query(f.collection(window.db,'rede_private_threads'),f.where('participants','array-contains',window.auth.currentUser.uid)),snap=await f.getDocs(q),threads=snap.docs.map(d=>({...d.data(),id:d.id}));
    const store=loadStore();
    document.querySelectorAll('#dashAttention .p56-task').forEach(card=>{
      const key=cardKey(card);if(!key||store[key])return;let target='';if(card.dataset.p72CheckinMember)target=card.dataset.p72CheckinMember;else{const id=activityIdFrom(card,null);const raw=card.dataset.p69Key||'';if(id){const title=norm(cardTitle(card));const t=threads.find(x=>x.lastSenderMemberId===me.memberId&&Array.isArray(x.memberIds)&&x.memberIds.includes((x.memberIds||[]).find(v=>v!==me.memberId))&&norm(x.lastMessage||'').includes(title));if(t){const ts=t.updatedAt?.toMillis?t.updatedAt.toMillis():Date.now();store[key]={key,kind:'activity',title:cardTitle(card),ts}}}return}
      const title=norm(cardTitle(card)),t=threads.find(x=>x.lastSenderMemberId===me.memberId&&Array.isArray(x.memberIds)&&x.memberIds.includes(target)&&norm(x.lastMessage||'').includes(title));
      if(t){const ts=t.updatedAt?.toMillis?t.updatedAt.toMillis():Date.now();store[key]={key,kind:'checkin',title:cardTitle(card),memberId:target,ts}}
    });
    saveStore(store);decorateFollowups();
  }catch(e){console.warn('P75 recuperação de lembretes',e)}
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;decorateFollowups();if(!recovered)recoverFromThreads()})}

window.openPrivateChatWithContext=async function(memberId,ctx={}){
  const name=ctx.personName||'Carbonauta',source=String(ctx.sourceId||''),key=source.startsWith('activity_')?`activity:${source.slice(9)}`:(source||`chat:${memberId}:${norm(ctx.title||'')}`);
  return openNativePrivate(memberId,contextDraft(ctx),name,{key,kind:ctx.type||'request',sourceId:source,title:ctx.title||''});
};
window.addEventListener('click',e=>{
  const check=e.target?.closest?.('.p72-checkin-remind');if(check){e.preventDefault();e.stopImmediatePropagation();openCheckin(check);return}
  const req=e.target?.closest?.('.p70-smart-request,.p69-wait');if(req){e.preventDefault();e.stopImmediatePropagation();openRequestButton(req);return}
},true);
function boot(){armSendWatch();decorateFollowups();recoverFromThreads();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});[1000,2600,5200].forEach(ms=>setTimeout(()=>{decorateFollowups();if(!recovered)recoverFromThreads()},ms));console.info('Carbonautas',VERSION,BUILD,'lembretes robustos + aguardando retorno')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();