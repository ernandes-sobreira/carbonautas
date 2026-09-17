/* Carbonautas P73 · botoes do Painel usam o fluxo NATIVO de conversa privada */
(function(){
'use strict';
const VERSION='P73', BUILD='20260917';
let busy=false;

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function F(){return window.fbFns}
function toast(msg){
  let el=document.getElementById('p73Toast');
  if(!el){
    el=document.createElement('div');el.id='p73Toast';
    el.style.cssText='position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147483647;background:#17313d;color:#fff;padding:11px 15px;border-radius:12px;font:700 12px/1.35 system-ui;box-shadow:0 12px 36px rgba(0,0,0,.25);max-width:min(560px,92vw);text-align:center';
    document.body.appendChild(el);
  }
  el.textContent=msg;el.style.display='block';clearTimeout(el._t);el._t=setTimeout(()=>el.style.display='none',4200);
}
function first(v=''){return String(v||'Carbonauta').trim().split(/\s+/)[0]||'Carbonauta'}
function cardOf(el){return el?.closest?.('.p56-task')||null}
function cardWho(card){return (card?.querySelector('.p56-who')?.textContent||'Carbonauta').trim()}
function cardTitle(card){return (card?.querySelector('.p56-what')?.textContent||'esta demanda').trim()}
function activityIdFrom(card,btn){
  if(btn?.dataset?.activityId)return btn.dataset.activityId;
  const key=card?.dataset?.p69Key||'';if(key.startsWith('activity:'))return key.slice(9);
  const raw=[...(card?.querySelectorAll('button[onclick]')||[])].map(b=>b.getAttribute('onclick')||'').join(' ');
  const m=raw.match(/activity:([^'\)]+)/);return m?.[1]||'';
}
async function activity(id){
  if(!id||!F()||!window.db)return null;
  try{
    const p=F().getDoc(F().doc(window.db,'rede_activities',id));
    const s=await Promise.race([p,new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),4500))]);
    return s.exists()?{...s.data(),id:s.id}:null;
  }catch(e){console.warn('P73 atividade',e);return null}
}
function contextDraft(memberId,ctx={}){
  const n=first(ctx.personName||'Carbonauta'),title=String(ctx.title||'esta demanda').trim(),label=String(ctx.label||'').toLowerCase(),event=String(ctx.eventLabel||'').toLowerCase();
  if(/corre|arquivo/.test(label+' '+event))return `${n}, preciso do arquivo de “${title}” para fazer a correção. Pode enviar pelo Repositório?`;
  if(/informa/.test(label+' '+event))return `${n}, preciso das informações referentes a “${title}” para conseguir dar andamento. Pode me enviar por aqui?`;
  if(/dados/.test(label+' '+event))return `${n}, preciso dos dados/resultados referentes a “${title}”. Pode me enviar ou indicar onde estão?`;
  if(/assin/.test(label+' '+event))return `${n}, preciso da assinatura referente a “${title}”. Pode providenciar e me avisar quando estiver pronta?`;
  if(/orient/.test(label+' '+event))return `${n}, precisamos alinhar “${title}”. Me diga como está o andamento e combinamos o próximo passo.`;
  if(/pend/.test(label+' '+event))return `${n}, a pendência “${title}” ainda está aberta. O que falta para resolver e qual a previsão?`;
  if(/entrega|produto/.test(label+' '+event))return `${n}, preciso da entrega de “${title}”. Pode enviar o material pelo Repositório e me avisar por aqui?`;
  if(/atualiza|check/.test(label+' '+event))return `${n}, me atualize sobre “${title}”: o que já foi feito, qual a dificuldade atual e qual é o próximo passo?`;
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
async function openNativePrivate(memberId,draft,name='Carbonauta'){
  if(busy)return;busy=true;
  try{
    if(!memberId){toast('Não consegui identificar a pessoa desta demanda.');return}
    toast(`Abrindo conversa com ${first(name)}…`);
    const newBtn=document.getElementById('privateNewBtn');
    if(!newBtn){toast('A área de conversas privadas ainda não foi carregada. Recarregue a página.');return}
    newBtn.click();
    let personBtn=null;
    for(let i=0;i<25;i++){
      personBtn=[...document.querySelectorAll('[data-private-person]')].find(b=>b.dataset.privatePerson===memberId)||null;
      if(personBtn)break;await sleep(80);
    }
    if(!personBtn){
      document.getElementById('privateNewOverlay')?.classList.remove('open');
      toast(`${first(name)} ainda não aparece no diretório do chat privado.`);return;
    }
    if(personBtn.disabled){
      document.getElementById('privateNewOverlay')?.classList.remove('open');
      toast(`${first(name)} ainda não tem uma conta vinculada ao chat privado. O lembrete continua no Painel.`);return;
    }
    personBtn.click();
    let input=null;
    for(let i=0;i<45;i++){
      input=document.getElementById('privateInput');
      if(input&&document.getElementById('privateShell')?.classList.contains('chat-open'))break;
      await sleep(100);
    }
    if(!input||!document.getElementById('privateShell')?.classList.contains('chat-open')){toast('A conversa não abriu. Tente novamente ou abra Conversas > Privadas.');return}
    input.value=draft;input.focus();input.style.height='auto';input.style.height=Math.min(130,input.scrollHeight)+'px';input.dispatchEvent(new Event('input',{bubbles:true}));
    toast(`Conversa com ${first(name)} aberta. Mensagem pronta para enviar.`);
  }finally{busy=false}
}

async function openRequestButton(btn){
  const card=cardOf(btn),id=activityIdFrom(card,btn),a=await activity(id),name=cardWho(card),title=cardTitle(card);
  if(!a){toast('Não consegui localizar essa demanda no acompanhamento.');return}
  await openNativePrivate(a.ownerId,activityDraft(a,name),name||a.ownerName||'Carbonauta');
}
async function openCheckin(btn){
  const memberId=btn.dataset.memberId,name=cardWho(cardOf(btn)),title=btn.dataset.label||cardTitle(cardOf(btn))||'check-in mensal';
  const draft=`${first(name)}, seu ${String(title).toLowerCase()} ainda não foi registrado. Quando puder, preencha o que foi feito, dificuldades e próximo passo.`;
  await openNativePrivate(memberId,draft,name);
}

// P70 chama esta função. Agora ela usa o fluxo nativo que já funciona dentro do módulo principal.
window.openPrivateChatWithContext=async function(memberId,ctx={}){
  const name=ctx.personName||'Carbonauta';
  return openNativePrivate(memberId,contextDraft(memberId,ctx),name);
};

// Captura no WINDOW antes dos handlers antigos do P72/P70.
window.addEventListener('click',e=>{
  const check=e.target?.closest?.('.p72-checkin-remind');
  if(check){e.preventDefault();e.stopImmediatePropagation();openCheckin(check);return}
  const req=e.target?.closest?.('.p70-smart-request,.p69-wait');
  if(req){e.preventDefault();e.stopImmediatePropagation();openRequestButton(req);return}
},true);

console.info('Carbonautas',VERSION,BUILD,'pedidos e lembretes usam o chat privado nativo');
})();