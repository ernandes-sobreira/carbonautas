/* Carbonautas P69 · Painel resolutivo: cada item mostra a próxima ação real */
(function(){
'use strict';
const VERSION='P69';
const BUILD='20260917';
let baseOpenActivity=null,baseOpenItem=null,scheduled=false;

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function norm(v=''){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\.(docx?|xlsx?|pptx?|pdf|odt|rtf|csv)$/,'').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ')}
function tokens(v=''){return new Set(norm(v).split(' ').filter(x=>x.length>2))}
function score(a,b){const A=norm(a),B=norm(b);if(!A||!B)return 0;if(A===B)return 140;if(A.includes(B)||B.includes(A))return 105;const x=tokens(A),y=tokens(B);let hit=0;x.forEach(t=>{if(y.has(t))hit++});return x.size&&y.size?Math.round(hit/Math.max(x.size,y.size)*90):0}
function me(){try{return typeof myId!=='undefined'?myId:''}catch(_e){return''}}
function activity(id){try{return (state.activities||[]).find(a=>a.id===id)||null}catch(_e){return null}}
function memberName(id){try{return memberById(id)?.nome||'Carbonauta'}catch(_e){return'Carbonauta'}}
function first(n=''){return String(n||'').trim().split(/\s+/)[0]||'Carbonauta'}
function reviewTid(p){try{return typeof repoReviewThreadId==='function'?repoReviewThreadId(p):(p.reviewThreadId||p.id)}catch(_e){return p?.reviewThreadId||p?.id||''}}
function canReview(p){try{return !!(p?.reviewFlow&&typeof canActOnReview==='function'&&canActOnReview(p))}catch(_e){return false}}
function reviewScore(a,p){let s=Math.max(score(a?.title,p?.reviewBaseTitle),score(a?.title,p?.titulo),score(a?.title,p?.fileName));if(p?.memberId===a?.ownerId||p?.reviewReturnToId===a?.ownerId||p?.reviewReviewerId===a?.ownerId)s+=40;return s}
function actionableReview(a){
  try{
    let best=null;(state.publicacoes||[]).filter(canReview).forEach(p=>{const s=reviewScore(a,p);if(!best||s>best.s)best={s,p}});
    return best&&best.s>=90?best.p:null;
  }catch(_e){return null}
}
function visiblePublication(a){
  try{
    const pubs=(state.publicacoes||[]).filter(p=>p.tipo==='arquivo'&&p.url&&!p.reviewFlow);let best=null;
    pubs.forEach(p=>{let s=Math.max(score(a?.title,p?.titulo),score(a?.title,p?.fileName));if(p.memberId===a?.ownerId)s+=35;else s-=15;if(!best||s>best.s)best={s,p}});
    return best&&best.s>=95?best.p:null;
  }catch(_e){return null}
}
function closeDetail(){document.getElementById('p66ActionOverlay')?.classList.remove('open')}
function chat(memberId,a,label){
  if(!memberId||memberId===me()||typeof window.openPrivateChatWithContext!=='function')return;
  closeDetail();window.openPrivateChatWithContext(memberId,{type:a?.type==='correcao'?'correction':'deadline',label:label||'ACOMPANHAMENTO',title:a?.title||'Acompanhamento',eventLabel:a?.type==='correcao'?'Arquivo necessário para continuar':'Ação do Painel',sourceId:`activity_${a?.id||''}`});
}
function openReview(p){closeDetail();try{if(typeof switchView==='function')switchView('pubs');setTimeout(()=>{if(typeof window.openReviewResponse==='function')window.openReviewResponse(p.id);else if(typeof window.openReviewConversation==='function')window.openReviewConversation(p.id)},120)}catch(e){console.warn('P69 review',e)}}
function openFile(p){closeDetail();try{if(typeof window.openFilePreview==='function')window.openFilePreview(p.url,p.fileName||p.titulo||'Arquivo',{source:'publication',id:p.id});else window.open(p.url,'_blank','noopener')}catch(e){console.warn('P69 arquivo',e)}}

function ensureCss(){
  if(document.getElementById('p69Style'))return;const s=document.createElement('style');s.id='p69Style';s.textContent=`
  .p69-state{margin-top:13px;border-radius:15px;padding:13px 15px;display:flex;gap:11px;align-items:flex-start}.p69-state.wait{background:#fff8e9;border:1px solid #f0d79e}.p69-state.go{background:#edf9f4;border:1px solid #bfe5d4}.p69-state.info{background:#f2f7f8;border:1px solid #d6e3e6}.p69-ico{width:36px;height:36px;border-radius:11px;background:#fff;display:grid;place-items:center;font-size:18px;flex:0 0 auto}.p69-copy{min-width:0}.p69-copy b{display:block;font-size:13px;color:#17313c}.p69-copy span{display:block;font-size:11px;line-height:1.45;color:#60757d;margin-top:3px}.p69-main{background:#0e5c63!important;border-color:#0e5c63!important;color:#fff!important;font-weight:850!important}.p69-wait{background:#b96b00!important;border-color:#b96b00!important;color:#fff!important;font-weight:850!important}.p69-secondary{background:#fff!important;color:#405962!important}.p69-hidden{display:none!important}.p69-panel-note{font-size:11px;font-weight:750;line-height:1.4;margin-top:6px;color:#425d66}.p69-panel-note.wait{color:#8c5700}.p69-panel-note.go{color:#176f4d}.p69-badge{display:inline-flex;border-radius:999px;padding:4px 7px;margin-right:5px;font-size:9px;font-weight:950;letter-spacing:.02em}.p69-badge.wait{background:#fff0cf;color:#8c5700}.p69-badge.go{background:#e5f7ef;color:#176f4d}
  `;document.head.appendChild(s)
}
function removeOldState(){document.querySelector('#p66Body .p69-state')?.remove()}
function stateBox(kind,title,text,ico){
  removeOldState();const body=document.getElementById('p66Body');if(!body)return;const el=document.createElement('div');el.className=`p69-state ${kind}`;el.innerHTML=`<div class="p69-ico">${ico}</div><div class="p69-copy"><b>${esc(title)}</b><span>${esc(text)}</span></div>`;const progress=body.querySelector('.p66-progress');if(progress)body.insertBefore(el,progress);else body.appendChild(el)
}
function clearP67NoTarget(){const x=document.querySelector('#p66Body .p67-linked');if(x&&/Nenhum documento vinculado/i.test(x.textContent||''))x.remove()}
function makePrimaryChat(a,owner,wording){
  const foot=document.getElementById('p66Foot');if(!foot)return;let b=[...foot.querySelectorAll('button')].find(x=>/Conversar com|Pedir arquivo/i.test(x.textContent||''));
  if(!b){b=document.createElement('button');b.type='button';foot.insertBefore(b,foot.lastElementChild||null)}
  b.className='btn p69-wait';b.textContent=`💬 ${wording||`Pedir arquivo a ${first(owner)}`}`;b.onclick=()=>chat(a.ownerId,a,'ARQUIVO PARA CORREÇÃO');
}
function demoteRegistry(){const edit=document.querySelector('#p66Foot .p66-edit');if(edit){edit.textContent='⚙️ Editar cadastro';edit.classList.add('p69-secondary');edit.title='Alterar apenas o registro de acompanhamento'}}
function renameComplete(text){const b=document.querySelector('#p66Foot .p66-complete');if(b){b.textContent=text||'✓ Marcar resolvido';b.classList.add('p69-secondary')}}
function insertMainButton(label,fn){
  const foot=document.getElementById('p66Foot');if(!foot)return;foot.querySelector('.p69-direct')?.remove();const b=document.createElement('button');b.type='button';b.className='btn p69-main p69-direct';b.textContent=label;b.onclick=fn;const complete=foot.querySelector('.p66-complete');if(complete)foot.insertBefore(b,complete);else foot.insertBefore(b,foot.lastElementChild||null)
}
function tuneModal(id){
  const a=activity(id),ov=document.getElementById('p66ActionOverlay');if(!a||!ov?.classList.contains('open'))return;ensureCss();demoteRegistry();
  const owner=memberName(a.ownerId),review=actionableReview(a),pub=visiblePublication(a),p67Target=document.querySelector('#p66Foot .p67-target');
  if(review){clearP67NoTarget();stateBox('go','Arquivo recebido — dá para agir agora',`${owner} enviou uma versão pelo fluxo de correção. Abra o documento e devolva a correção por ali.`,'✍️');if(p67Target)p67Target.remove();insertMainButton('✍️ Corrigir agora',()=>openReview(review));renameComplete('✓ Marcar resolvido');return}
  if(p67Target){stateBox('go','Material encontrado — abra para resolver',`Há um documento relacionado a “${a.title||'este acompanhamento'}”. Use o botão principal para ir direto a ele.`,'📄');p67Target.classList.add('p69-main');p67Target.textContent=a.type==='correcao'?'📄 Abrir documento':'📄 Abrir material';renameComplete('✓ Marcar resolvido');return}
  if(pub){clearP67NoTarget();stateBox('go','Documento encontrado no Repositório',`Encontrei “${pub.fileName||pub.titulo||'Arquivo'}”. Abra o documento para continuar.`,'📄');insertMainButton(a.type==='correcao'?'📄 Abrir para corrigir':'📄 Abrir documento',()=>openFile(pub));renameComplete('✓ Marcar resolvido');return}
  clearP67NoTarget();
  if(a.type==='correcao'){
    stateBox('wait','Ainda não há arquivo para você corrigir',`Existe um registro de correção para ${owner}, mas nenhum arquivo foi enviado a você pelo fluxo de correção. A próxima ação útil é pedir o arquivo ou orientar por conversa.`,'⏳');makePrimaryChat(a,owner,`Pedir arquivo a ${first(owner)}`);renameComplete('✓ Encerrar acompanhamento');return
  }
  if(['produto','entrega'].includes(String(a.type||'').toLowerCase())){
    stateBox('wait','Entrega ainda sem documento vinculado',`O prazo está registrado para ${owner}, mas não há um arquivo ligado a este acompanhamento. Você pode pedir a entrega diretamente.`,'⏳');makePrimaryChat(a,owner,`Pedir entrega a ${first(owner)}`);renameComplete('✓ Encerrar acompanhamento');return
  }
  stateBox('info','Este item é acompanhamento, não um documento',`Use a conversa com ${owner} para tratar o próximo passo. “Editar cadastro” serve apenas para corrigir datas, status ou descrição.`,'💬');renameComplete('✓ Marcar resolvido')
}

function cardKey(card){const b=card.querySelector('button[onclick*="p56OpenItem"]');const m=String(b?.getAttribute('onclick')||'').match(/p56OpenItem\('([^']+)'\)/);return m?.[1]||card.dataset.p69Key||''}
function tuneActivityCard(card,a){
  if(!a)return;const actions=card.querySelector('.p56-task-actions'),detail=card.querySelector('.p56-detail'),owner=memberName(a.ownerId),review=actionableReview(a),pub=visiblePublication(a);card.dataset.p69Key=`activity:${a.id}`;
  if(review){if(detail)detail.innerHTML=`<span class="p69-badge go">🔥 SUA AÇÃO</span><span class="p69-badge go">📄 ARQUIVO RECEBIDO</span><div class="p69-panel-note go">${esc(owner)} enviou material para correção. Próxima ação: corrigir e devolver.</div>`;if(actions){actions.innerHTML='';const b=document.createElement('button');b.className='btn p69-main';b.textContent='✍️ Corrigir agora';b.onclick=()=>openReview(review);actions.appendChild(b)}return}
  if(a.type==='correcao'&&!pub){if(detail)detail.innerHTML=`<span class="p69-badge wait">⏳ AGUARDANDO ARQUIVO</span><div class="p69-panel-note wait">Não há arquivo enviado para você corrigir. Este registro, sozinho, não é uma demanda de correção.</div>`;if(actions){actions.innerHTML='';if(a.ownerId!==me()&&typeof window.openPrivateChatWithContext==='function'){const b=document.createElement('button');b.className='btn p69-wait';b.textContent=`💬 Pedir arquivo`;b.onclick=()=>chat(a.ownerId,a,'ARQUIVO PARA CORREÇÃO');actions.appendChild(b)}const v=document.createElement('button');v.className='btn';v.textContent='Ver contexto';v.onclick=()=>p69OpenActivity(a.id);actions.appendChild(v)}return}
  if(pub&&['correcao','produto','entrega'].includes(String(a.type||'').toLowerCase())){if(detail)detail.innerHTML=`<span class="p69-badge go">📄 ARQUIVO ENCONTRADO</span><div class="p69-panel-note go">${esc(pub.fileName||pub.titulo||'Arquivo')} · abra o material para continuar.</div>`;if(actions){const open=actions.querySelector('button')||document.createElement('button');actions.innerHTML='';open.className='btn p69-main';open.textContent=a.type==='correcao'?'📄 Abrir para corrigir':'📄 Abrir documento';open.onclick=()=>openFile(pub);actions.appendChild(open)}return}
}
function tuneCards(){
  ensureCss();document.querySelectorAll('#dashAttention .p56-task').forEach(card=>{const key=cardKey(card);if(!key.startsWith('activity:'))return;const a=activity(key.slice(9));tuneActivityCard(card,a)})
}
function scheduleCards(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;tuneCards()})}
function p69OpenActivity(id){
  const fn=baseOpenActivity||window.p67OpenActivity||window.p66OpenActivityDetail;if(typeof fn!=='function')return;
  fn(id);setTimeout(()=>tuneModal(id),80);setTimeout(()=>tuneModal(id),350);setTimeout(()=>tuneModal(id),1000)
}
function p69OpenItem(key){const k=String(key||'');if(k.startsWith('activity:'))return p69OpenActivity(k.slice(9));if(typeof baseOpenItem==='function')return baseOpenItem(key)}
function install(){
  ensureCss();if(!baseOpenActivity&&typeof window.p67OpenActivity==='function'&&window.p67OpenActivity!==p69OpenActivity)baseOpenActivity=window.p67OpenActivity;if(!baseOpenItem&&typeof window.p56OpenItem==='function'&&window.p56OpenItem!==p69OpenItem)baseOpenItem=window.p56OpenItem;
  window.p69OpenActivity=p69OpenActivity;window.p67OpenActivity=p69OpenActivity;window.p56OpenItem=p69OpenItem;scheduleCards()
}
function boot(){install();const root=document.getElementById('dashAttention')||document.body;new MutationObserver(scheduleCards).observe(root,{childList:true,subtree:true});setTimeout(install,1200);setTimeout(install,3200);setTimeout(install,5200);console.info('Carbonautas',VERSION,BUILD,'Painel agora oferece uma próxima ação real')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
