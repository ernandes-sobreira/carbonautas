/* Carbonautas P70 · um único pedido principal, adaptado ao tipo de demanda */
(function(){
'use strict';
const VERSION='P70';
const BUILD='20260917';
let baseOpenActivity=null,scheduled=false,lastActivityId='';

function norm(v=''){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ')}
function me(){try{return typeof myId!=='undefined'?myId:''}catch(_e){return''}}
function activity(id){try{return (state.activities||[]).find(a=>a.id===id)||null}catch(_e){return null}}
function memberName(id){try{return memberById(id)?.nome||'Carbonauta'}catch(_e){return'Carbonauta'}}
function first(n=''){return String(n||'').trim().split(/\s+/)[0]||'Carbonauta'}
function closeDetail(){document.getElementById('p66ActionOverlay')?.classList.remove('open')}

function requestIntent(a){
  const owner=memberName(a?.ownerId),name=first(owner),type=norm(a?.type),txt=norm(`${a?.title||''} ${a?.description||''}`);
  const has=(...xs)=>xs.some(x=>txt.includes(x));
  if(type==='correcao'||has('corrigir','correcao','revisar','revisao'))return {verb:'Pedir arquivo para correção',button:`💬 Pedir arquivo para correção a ${name}`,card:'💬 Pedir arquivo',label:'ARQUIVO PARA CORREÇÃO',title:'Ainda falta o material para corrigir',text:`Não há arquivo disponível para esta correção. A ação útil agora é pedir a ${name} o material que precisa ser revisado.`};
  if(has('requerimento','informacoes','informacao','cnpj','cpf','endereco','telefone','cep','razao social'))return {verb:'Pedir informações',button:`💬 Pedir informações a ${name}`,card:'💬 Pedir informações',label:'INFORMAÇÕES NECESSÁRIAS',title:'Ainda faltam informações',text:`Esta demanda depende de informações de ${name}. A próxima ação é pedir os dados necessários para continuar.`};
  if(has('planilha','base de dados','banco de dados','dados','dataset','amostra','resultados'))return {verb:'Pedir dados',button:`💬 Pedir dados a ${name}`,card:'💬 Pedir dados',label:'DADOS NECESSÁRIOS',title:'Ainda faltam dados',text:`Esta atividade depende de dados de ${name}. Peça os dados ou resultados necessários para avançar.`};
  if(has('formulario','formulário','ficha','questionario','questionário'))return {verb:'Pedir preenchimento',button:`💬 Pedir preenchimento a ${name}`,card:'💬 Pedir preenchimento',label:'PREENCHIMENTO PENDENTE',title:'Ainda falta o preenchimento',text:`O próximo passo depende de um formulário ou ficha. Peça a ${name} o preenchimento necessário.`};
  if(has('assinatura','assinar'))return {verb:'Pedir assinatura',button:`💬 Pedir assinatura a ${name}`,card:'💬 Pedir assinatura',label:'ASSINATURA PENDENTE',title:'Ainda falta a assinatura',text:`Esta etapa depende da assinatura de ${name}. A ação útil agora é solicitar a assinatura.`};
  if(has('aprovacao','aprovação','aprovar'))return {verb:'Pedir aprovação',button:`💬 Pedir aprovação a ${name}`,card:'💬 Pedir aprovação',label:'APROVAÇÃO PENDENTE',title:'Ainda falta a aprovação',text:`Esta etapa depende de uma aprovação. Peça a ${name} a validação necessária.`};
  if(type==='checkin'||has('check in','checkin'))return {verb:'Pedir atualização',button:`💬 Pedir atualização a ${name}`,card:'💬 Pedir atualização',label:'ATUALIZAÇÃO DE ANDAMENTO',title:'Falta a atualização do andamento',text:`Peça a ${name} uma atualização curta: o que foi feito, dificuldade atual e próximo passo.`};
  if(type==='orientacao'||has('orientacao','orientação','reuniao','reunião'))return {verb:'Combinar orientação',button:`💬 Combinar orientação com ${name}`,card:'💬 Combinar orientação',label:'ORIENTAÇÃO',title:'Próximo passo: alinhar a orientação',text:`Não há material para abrir agora. Combine com ${name} a orientação ou o retorno necessário.`};
  if(type==='pendencia')return {verb:'Cobrar pendência',button:`💬 Cobrar pendência de ${name}`,card:'💬 Cobrar pendência',label:'PENDÊNCIA',title:'A pendência ainda está aberta',text:`Não existe um material específico para abrir. A próxima ação é cobrar de ${name} a resolução da pendência.`};
  if(type==='produto'||type==='entrega'||has('resumo','artigo','capitulo','capítulo','tese','dissertacao','dissertação','relatorio','relatório','projeto','plano','apresentacao','apresentação','banner','poster','pôster','manuscrito'))return {verb:'Pedir entrega',button:`💬 Pedir entrega a ${name}`,card:'💬 Pedir entrega',label:'ENTREGA PENDENTE',title:'Entrega ainda sem material',text:`O prazo está registrado, mas não há material vinculado. Peça a ${name} a entrega correspondente.`};
  return {verb:'Perguntar andamento',button:`💬 Perguntar andamento a ${name}`,card:'💬 Perguntar andamento',label:'ANDAMENTO',title:'Falta saber o andamento',text:`Não há documento ou ação específica vinculada. Pergunte a ${name} o andamento e o próximo passo.`};
}

function openRequest(a,intent){
  if(!a?.ownerId||a.ownerId===me()||typeof window.openPrivateChatWithContext!=='function')return;
  closeDetail();
  window.openPrivateChatWithContext(a.ownerId,{type:a.type==='correcao'?'correction':'deadline',label:intent.label,title:a.title||'Acompanhamento',eventLabel:intent.verb,sourceId:`activity_${a.id}`});
}
function isAskButton(b){return !!b&&(b.classList.contains('p69-wait')||/pedir|cobrar|perguntar|combinar|lembrar|conversar com/i.test(String(b.textContent||'')))}
function dedupeAskButtons(foot){
  if(!foot)return null;const all=[...foot.querySelectorAll('button')].filter(isAskButton);if(!all.length)return null;const keep=all[0];all.slice(1).forEach(b=>b.remove());return keep;
}
function ensureOneAskButton(foot,a,intent){
  if(!foot||!a||!intent)return;
  let b=dedupeAskButtons(foot);
  if(!b){b=document.createElement('button');b.type='button';const close=[...foot.querySelectorAll('button')].find(x=>/^Fechar$/i.test(String(x.textContent||'').trim()));foot.insertBefore(b,close||null)}
  b.className='btn p69-wait p70-smart-request';b.textContent=intent.button;b.title=intent.text;b.onclick=()=>openRequest(a,intent);
  dedupeAskButtons(foot);
}
function updateStateBox(a,intent){
  const box=document.querySelector('#p66Body .p69-state.wait');if(!box)return;
  const title=box.querySelector('.p69-copy b'),txt=box.querySelector('.p69-copy span');if(title)title.textContent=intent.title;if(txt)txt.textContent=intent.text;
}
function inferOpenActivity(){
  if(lastActivityId&&activity(lastActivityId))return activity(lastActivityId);
  const title=norm(document.querySelector('#p66Body .p66-problem-title')?.textContent||''),person=norm(document.querySelector('#p66Body .p66-person b')?.textContent||'');
  try{return (state.activities||[]).find(a=>norm(a.title)===title&&(!person||norm(memberName(a.ownerId))===person))||null}catch(_e){return null}
}
function fixModal(id=''){
  const ov=document.getElementById('p66ActionOverlay');if(!ov?.classList.contains('open'))return;const a=id?activity(id):inferOpenActivity();if(!a)return;lastActivityId=a.id;
  const foot=document.getElementById('p66Foot');if(!foot)return;
  const hasDirect=!!foot.querySelector('.p69-direct,.p67-target')&&!document.querySelector('#p66Body .p69-state.wait');
  if(hasDirect){dedupeAskButtons(foot);return}
  const intent=requestIntent(a);ensureOneAskButton(foot,a,intent);updateStateBox(a,intent);
}
function cardActivity(card){const key=card.dataset.p69Key||'';if(key.startsWith('activity:'))return activity(key.slice(9));const raw=String(card.querySelector('button[onclick*="p56OpenItem"]')?.getAttribute('onclick')||'');const m=raw.match(/activity:([^']+)/);return m?activity(m[1]):null}
function fixCard(card){
  const a=cardActivity(card);if(!a)return;const actions=card.querySelector('.p56-task-actions');if(!actions)return;
  const ask=[...actions.querySelectorAll('button')].filter(isAskButton);if(!ask.length)return;const intent=requestIntent(a),keep=ask[0];ask.slice(1).forEach(b=>b.remove());keep.className='btn p69-wait p70-smart-request';keep.textContent=intent.card;keep.title=intent.text;keep.onclick=()=>openRequest(a,intent);
  const context=[...actions.querySelectorAll('button')].find(b=>/ver contexto/i.test(String(b.textContent||'')));if(context){context.onclick=()=>{lastActivityId=a.id;if(typeof window.p70OpenActivity==='function')window.p70OpenActivity(a.id)}}
}
function fixCards(){document.querySelectorAll('#dashAttention .p56-task').forEach(fixCard)}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;fixCards();fixModal()})}
function p70OpenActivity(id){lastActivityId=id;const fn=baseOpenActivity||window.p69OpenActivity||window.p67OpenActivity||window.p66OpenActivityDetail;if(typeof fn!=='function')return;fn(id);[80,250,700,1400].forEach(ms=>setTimeout(()=>fixModal(id),ms))}
function install(){
  if(!baseOpenActivity&&typeof window.p69OpenActivity==='function'&&window.p69OpenActivity!==p70OpenActivity)baseOpenActivity=window.p69OpenActivity;
  window.p70OpenActivity=p70OpenActivity;window.p69OpenActivity=p70OpenActivity;window.p67OpenActivity=p70OpenActivity;fixCards();fixModal();
}
function boot(){install();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});[1000,2500,5000].forEach(ms=>setTimeout(install,ms));console.info('Carbonautas',VERSION,BUILD,'pedidos inteligentes e sem duplicação')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();