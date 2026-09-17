/* Carbonautas P71 · Pedidos do Painel abrem o chat privado com mensagem pronta */
(function(){
'use strict';
const VERSION='P71';
const BUILD='20260917';
const previousOpen=window.openPrivateChatWithContext;

function toastSafe(msg){try{if(typeof toast==='function')toast(msg);else if(typeof window.toast==='function')window.toast(msg);else console.log(msg)}catch(_e){console.log(msg)}}
function memberName(id){try{return memberById(id)?.nome||'Carbonauta'}catch(_e){return'Carbonauta'}}
function first(n=''){return String(n||'').trim().split(/\s+/)[0]||'Carbonauta'}
function coreStart(){try{if(typeof startPrivateConversation==='function')return startPrivateConversation}catch(_e){}return typeof window.startPrivateConversation==='function'?window.startPrivateConversation:null}
function switchToChat(){try{if(typeof switchView==='function')switchView('conversas');else if(typeof window.switchView==='function')window.switchView('conversas')}catch(_e){}}
function draftFor(targetMemberId,ctx={}){
  const name=first(memberName(targetMemberId)),title=String(ctx.title||'esta demanda').trim(),label=String(ctx.label||'').toUpperCase(),event=String(ctx.eventLabel||'').toLowerCase();
  if(label.includes('ARQUIVO PARA CORREÇÃO')||event.includes('arquivo para correção'))return `${name}, preciso do arquivo de “${title}” para fazer a correção. Pode enviar pelo Repositório?`;
  if(label.includes('INFORMAÇÕES'))return `${name}, preciso das informações referentes a “${title}” para conseguir dar andamento. Pode me enviar por aqui?`;
  if(label.includes('DADOS'))return `${name}, preciso dos dados/resultados referentes a “${title}” para avançarmos. Pode me enviar ou indicar onde estão?`;
  if(label.includes('PREENCHIMENTO'))return `${name}, preciso que você faça o preenchimento referente a “${title}”. Quando concluir, me avise por aqui.`;
  if(label.includes('ASSINATURA'))return `${name}, preciso da assinatura referente a “${title}”. Pode providenciar e me avisar quando estiver pronta?`;
  if(label.includes('APROVAÇÃO'))return `${name}, preciso da sua validação/aprovação em “${title}”. Pode verificar e me dar um retorno?`;
  if(label.includes('ATUALIZAÇÃO'))return `${name}, me atualize sobre “${title}”: o que já foi feito, qual a dificuldade atual e qual é o próximo passo?`;
  if(label.includes('ORIENTAÇÃO'))return `${name}, precisamos alinhar “${title}”. Me diga como está o andamento e combinamos o próximo passo/orientação.`;
  if(label.includes('PENDÊNCIA'))return `${name}, a pendência “${title}” ainda está aberta. O que falta para resolver e qual a previsão?`;
  if(label.includes('ENTREGA'))return `${name}, preciso da entrega de “${title}”. Pode enviar o material pelo Repositório e me avisar por aqui?`;
  return `${name}, como está o andamento de “${title}”? Me diga o que já foi feito e qual é o próximo passo.`;
}
function fillDraft(text){
  let tries=0;const go=()=>{tries++;const input=document.getElementById('privateInput');if(input){if(!input.value.trim())input.value=text;input.focus();input.style.height='auto';input.style.height=Math.min(130,input.scrollHeight)+'px';try{input.dispatchEvent(new Event('input',{bubbles:true}))}catch(_e){}return}if(tries<12)setTimeout(go,100)};setTimeout(go,80)
}
async function robustOpenPrivateChat(targetMemberId,ctx={}){
  if(!targetMemberId)return toastSafe('Não encontrei a pessoa responsável por esta demanda.');
  const fn=coreStart(),draft=draftFor(targetMemberId,ctx);
  if(fn){
    try{
      const before=document.querySelector('#privateShell.chat-open');
      await fn(targetMemberId);switchToChat();fillDraft(draft);
      setTimeout(()=>{const shell=document.getElementById('privateShell'),input=document.getElementById('privateInput');if(!shell&&!input&&!before)toastSafe('Não consegui abrir o chat privado desta pessoa.')},500);
      return;
    }catch(e){console.error('P71 chat principal',e)}
  }
  if(typeof previousOpen==='function'&&previousOpen!==robustOpenPrivateChat){
    try{await previousOpen(targetMemberId,ctx);switchToChat();fillDraft(draft);return}catch(e){console.error('P71 fallback P64',e)}
  }
  toastSafe(`${first(memberName(targetMemberId))} ainda não está disponível para conversa privada. Verifique se a conta está vinculada à Rede.`);
}
function install(){window.openPrivateChatWithContext=robustOpenPrivateChat;window.openDashboardRequestChat=robustOpenPrivateChat}
function boot(){install();[800,1800,3500].forEach(ms=>setTimeout(install,ms));console.info('Carbonautas',VERSION,BUILD,'pedidos do Painel agora abrem a conversa privada')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();