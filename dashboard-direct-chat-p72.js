/* Carbonautas P72 · chat direto robusto + check-in como lembrete do aluno */
(function(){
'use strict';
const VERSION='P72', BUILD='20260917';
let scheduled=false,lastActivityId='';

function F(){return window.fbFns}
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
function safeToast(msg){
  try{if(typeof window.toast==='function'){window.toast(msg);return}}catch(_e){}
  let el=document.getElementById('p72Toast');
  if(!el){el=document.createElement('div');el.id='p72Toast';el.style.cssText='position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147483647;background:#17313d;color:#fff;padding:11px 15px;border-radius:12px;font:700 12px/1.35 system-ui;box-shadow:0 12px 36px rgba(0,0,0,.25);max-width:min(520px,90vw);text-align:center';document.body.appendChild(el)}
  el.textContent=msg;el.style.display='block';clearTimeout(el._t);el._t=setTimeout(()=>el.style.display='none',4200)
}
function threadId(a,b){return [String(a||''),String(b||'')].sort().map(x=>encodeURIComponent(x)).join('__')}
function first(n=''){return String(n||'').trim().split(/\s+/)[0]||'Carbonauta'}
async function currentProfile(){
  const f=F(),u=window.auth?.currentUser;if(!f||!u)return null;
  try{const s=await f.getDoc(f.doc(window.db,'rede_users',u.uid));return s.exists()?{...s.data(),uid:u.uid}:null}catch(e){console.warn('P72 perfil',e);return null}
}
async function memberDoc(memberId){
  const f=F();try{const s=await f.getDoc(f.doc(window.db,'rede_members',memberId));return s.exists()?{...s.data(),id:s.id}:null}catch(_e){return null}
}
async function targetAccount(memberId){
  const f=F();if(!f||!memberId)return null;
  try{const s=await f.getDoc(f.doc(window.db,'rede_private_directory',memberId));if(s.exists()&&s.data()?.uid)return {...s.data(),memberId}}catch(e){console.warn('P72 diretório',e)}
  try{const q=f.query(f.collection(window.db,'rede_users'),f.where('memberId','==',memberId),f.limit(1)),s=await f.getDocs(q);if(!s.empty)return {...s.docs[0].data(),uid:s.docs[0].id,memberId}}catch(e){console.warn('P72 usuário',e)}
  return null
}
function showPrivateView(){
  try{document.body.dataset.view='conversas';document.querySelectorAll('.view').forEach(v=>v.classList.remove('on'));document.getElementById('viewConversas')?.classList.add('on');document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('on',(t.dataset.group||t.dataset.view)==='conversas'))}catch(e){console.warn('P72 view',e)}
}
async function ensureThread(targetMemberId){
  const f=F(),u=window.auth?.currentUser;if(!f||!u){safeToast('Entre novamente na plataforma para abrir a conversa.');return null}
  const me=await currentProfile();if(!me?.memberId){safeToast('Seu login ainda não está vinculado ao seu perfil na Rede.');return null}
  if(targetMemberId===me.memberId){safeToast('Esta ação está vinculada ao seu próprio perfil.');return null}
  const target=await targetAccount(targetMemberId);if(!target?.uid){const m=await memberDoc(targetMemberId);safeToast(`${first(m?.nome||'Esta pessoa')} ainda não tem uma conta vinculada ao chat privado. Você continua vendo o lembrete no Painel.`);return null}
  const id=threadId(me.memberId,targetMemberId),ref=f.doc(window.db,'rede_private_threads',id);
  try{
    const snap=await f.getDoc(ref);
    if(!snap.exists()){
      const pairs=[{memberId:me.memberId,uid:u.uid},{memberId:targetMemberId,uid:target.uid}].sort((a,b)=>a.memberId.localeCompare(b.memberId)),unread={};pairs.forEach(x=>unread[x.uid]=0);
      await f.setDoc(ref,{participants:pairs.map(x=>x.uid),memberIds:pairs.map(x=>x.memberId),createdAt:f.serverTimestamp(),updatedAt:f.serverTimestamp(),lastMessage:'',lastSenderUid:'',lastSenderMemberId:'',unreadBy:unread});
    }
  }catch(e){console.error('P72 thread',e);safeToast(e?.code==='permission-denied'?'O Firestore bloqueou a abertura da conversa privada.':'Não consegui preparar a conversa privada.');return null}
  showPrivateView();
  for(let i=0;i<30;i++){
    const row=[...document.querySelectorAll('[data-private-thread]')].find(x=>x.dataset.privateThread===id);
    if(row){row.click();return {id,me,target}}
    await sleep(100)
  }
  safeToast('A conversa foi preparada, mas a lista ainda não sincronizou. Abra “Conversas” novamente em alguns segundos.');return {id,me,target}
}
function draftFor(a,name){
  const n=first(name),title=String(a?.title||'esta demanda').trim(),type=String(a?.type||'').toLowerCase(),txt=`${title} ${a?.description||''}`.toLowerCase();
  if(type==='correcao'||/correç|corrig|revis/.test(txt))return `${n}, preciso do arquivo de “${title}” para fazer a correção. Pode enviar pelo Repositório?`;
  if(/requerimento|cnpj|cpf|endereço|endereco|telefone|cep|razão social|razao social|informações|informacoes/.test(txt))return `${n}, preciso das informações de “${title}” para dar andamento. Pode me enviar por aqui?`;
  if(/planilha|base de dados|banco de dados|dataset|resultados/.test(txt))return `${n}, preciso dos dados/resultados de “${title}” para avançarmos. Pode me enviar ou indicar onde estão?`;
  if(/assinatura|assinar/.test(txt))return `${n}, preciso da assinatura referente a “${title}”. Pode providenciar e me avisar quando estiver pronta?`;
  if(type==='orientacao'||/orientação|orientacao|reunião|reuniao/.test(txt))return `${n}, precisamos alinhar “${title}”. Me diga como está o andamento e combinamos o próximo passo.`;
  if(type==='pendencia')return `${n}, a pendência “${title}” ainda está aberta. O que falta para resolver e qual a previsão?`;
  if(type==='produto'||type==='entrega'||/resumo|artigo|tese|dissertação|dissertacao|relatório|relatorio|projeto|plano|apresentação|apresentacao|manuscrito/.test(txt))return `${n}, preciso da entrega de “${title}”. Pode enviar o material pelo Repositório e me avisar por aqui?`;
  return `${n}, como está o andamento de “${title}”? Me diga o que já foi feito e qual é o próximo passo.`
}
function fillDraft(text){let tries=0;const go=()=>{tries++;const input=document.getElementById('privateInput');if(input){input.value=text;input.focus();input.style.height='auto';input.style.height=Math.min(130,input.scrollHeight)+'px';input.dispatchEvent(new Event('input',{bubbles:true}));return}if(tries<25)setTimeout(go,100)};setTimeout(go,120)}
async function activityData(id){const f=F();try{const s=await f.getDoc(f.doc(window.db,'rede_activities',id));return s.exists()?{...s.data(),id:s.id}:null}catch(e){console.warn('P72 atividade',e);return null}}
async function openActivityChat(id){
  if(!id)return safeToast('Não consegui identificar esta demanda.');lastActivityId=id;const a=await activityData(id);if(!a)return safeToast('Esta demanda não foi encontrada.');const m=await memberDoc(a.ownerId),opened=await ensureThread(a.ownerId);if(opened)fillDraft(draftFor(a,m?.nome||a.ownerName||'Carbonauta'))
}
async function openCheckinReminder(memberId,label='Check-in mensal'){
  const m=await memberDoc(memberId),name=m?.nome||'Carbonauta',opened=await ensureThread(memberId);if(opened)fillDraft(`${first(name)}, seu ${label.toLowerCase()} ainda não foi registrado. Quando puder, preencha o que foi feito, dificuldades e próximo passo.`)
}
function cardActivityId(card){const k=card?.dataset?.p69Key||'';if(k.startsWith('activity:'))return k.slice(9);const raw=[...card?.querySelectorAll('button[onclick]')||[]].map(b=>b.getAttribute('onclick')||'').join(' '),m=raw.match(/activity:([^'\)]+)/);return m?.[1]||''}
function checkinInfo(card){
  const buttons=[...card.querySelectorAll('button')],raw=buttons.map(b=>b.getAttribute('onclick')||'').join(' '),m=raw.match(/checkin:([^:']+):([^'\)]+)/);if(m)return {memberId:m[1],month:m[2]};
  if(card.dataset.p72CheckinMember)return {memberId:card.dataset.p72CheckinMember,month:card.dataset.p72CheckinMonth||''};return null
}
function decorateCheckins(){
  document.querySelectorAll('#dashAttention .p56-task').forEach(card=>{
    const src=(card.querySelector('.p56-source')?.textContent||'').trim().toUpperCase();if(src!=='CHECK-IN')return;const info=checkinInfo(card);if(!info?.memberId)return;card.dataset.p72CheckinMember=info.memberId;card.dataset.p72CheckinMonth=info.month||'';
    const who=(card.querySelector('.p56-who')?.textContent||'Carbonauta').trim(),what=(card.querySelector('.p56-what')?.textContent||'Check-in mensal').trim(),detail=card.querySelector('.p56-detail'),actions=card.querySelector('.p56-task-actions');
    if(detail&&!detail.dataset.p72Checkin){detail.dataset.p72Checkin='1';detail.innerHTML=`<span style="display:inline-flex;padding:4px 7px;border-radius:999px;background:#fff1dd;color:#9b5a00;font-size:9px;font-weight:900;margin-bottom:5px">👀 AÇÃO DE ${String(first(who)).toUpperCase()}</span><div style="font-size:12px;line-height:1.45;color:#405861;font-weight:650">${who} ainda não registrou este check-in. <b>Você só acompanha e pode lembrar a pessoa.</b></div>`}
    if(actions&&!actions.querySelector('.p72-checkin-remind')){actions.innerHTML='';const b=document.createElement('button');b.type='button';b.className='btn p72-checkin-remind';b.dataset.memberId=info.memberId;b.dataset.label=what;b.textContent=`💬 Lembrar ${first(who)}`;actions.appendChild(b)}
  })
}
function annotateSmartButtons(){document.querySelectorAll('#dashAttention .p56-task').forEach(card=>{const id=cardActivityId(card);if(!id)return;card.querySelectorAll('.p70-smart-request,.p69-wait').forEach(b=>{if(b.dataset.activityId!==id)b.dataset.activityId=id})})}
function scan(){decorateCheckins();annotateSmartButtons()}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;scan()})}

document.addEventListener('click',e=>{
  const check=e.target.closest('.p72-checkin-remind');if(check){e.preventDefault();e.stopImmediatePropagation();openCheckinReminder(check.dataset.memberId,check.dataset.label||'Check-in mensal');return}
  const req=e.target.closest('.p70-smart-request');if(req){const id=req.dataset.activityId||cardActivityId(req.closest('.p56-task'))||lastActivityId;if(id){e.preventDefault();e.stopImmediatePropagation();openActivityChat(id);return}}
  const context=e.target.closest('button');if(context&&/ver contexto/i.test(context.textContent||'')){const id=cardActivityId(context.closest('.p56-task'));if(id)lastActivityId=id}
},true);

function boot(){scan();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});[900,2200,4500].forEach(ms=>setTimeout(scan,ms));console.info('Carbonautas',VERSION,BUILD,'chat direto e check-ins como lembrete do aluno')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();