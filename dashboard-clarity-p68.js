/* Carbonautas P68 · Painel claro: ação sua x só acompanhar + status do arquivo */
(function(){
'use strict';
const VERSION='P68';
const BUILD='20260917';
let busy=false,scheduled=false,baseRender=null;

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function norm(v=''){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\.(docx?|xlsx?|pptx?|pdf|odt|rtf|csv)$/,'').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ')}
function tokens(v=''){return new Set(norm(v).split(' ').filter(x=>x.length>2))}
function scoreTitle(a,b){const A=norm(a),B=norm(b);if(!A||!B)return 0;if(A===B)return 140;if(A.includes(B)||B.includes(A))return 105;const ta=tokens(A),tb=tokens(B);let hit=0;ta.forEach(x=>{if(tb.has(x))hit++});return ta.size&&tb.size?Math.round(hit/Math.max(ta.size,tb.size)*90):0}
function first(n=''){return String(n||'').trim().split(/\s+/)[0]||'Carbonauta'}
function me(){try{return typeof myId!=='undefined'?myId:''}catch(_e){return''}}
function admin(){try{return !!isAdmin}catch(_e){return false}}
function memberName(id){try{return memberById(id)?.nome||'Carbonauta'}catch(_e){return'Carbonauta'}}
function activity(id){try{return (state.activities||[]).find(a=>a.id===id)||null}catch(_e){return null}}
function reviewThreadId(p){try{return typeof repoReviewThreadId==='function'?repoReviewThreadId(p):(p.reviewThreadId||p.id)}catch(_e){return p?.reviewThreadId||p?.id||''}}
function latestReview(tid){try{return (state.publicacoes||[]).filter(p=>p.reviewFlow&&reviewThreadId(p)===tid).sort((a,b)=>Number(b.reviewVersion||1)-Number(a.reviewVersion||1))[0]||null}catch(_e){return null}}
function fmt(v){try{return typeof fmtDate==='function'?fmtDate(v):String(v||'')}catch(_e){return String(v||'')}}
function isMineActivity(a){if(!a)return false;const id=me();return a.ownerId===id||a.actionForMemberId===id||a.assignedToMemberId===id||a.responsibleMemberId===id}
function needsFile(a){return ['produto','entrega','correcao'].includes(String(a?.type||'').toLowerCase())}
function visibleFileForActivity(a){
  if(!a)return null;
  try{
    const pubs=(state.publicacoes||[]).filter(p=>p.tipo==='arquivo'&&p.url);
    const explicitId=a.linkedPublicationId||a.publicationId||a.repoPublicationId||a.sourcePublicationId||a.relatedPublicationId||'';
    if(explicitId){const ex=pubs.find(p=>p.id===explicitId);if(ex)return ex}
    let best=null;
    pubs.forEach(p=>{
      let s=Math.max(scoreTitle(a.title,p.titulo),scoreTitle(a.title,p.fileName),scoreTitle(a.title,p.reviewBaseTitle));
      if(p.memberId===a.ownerId||p.reviewReturnToId===a.ownerId||p.reviewReviewerId===a.ownerId)s+=35;else s-=15;
      if(p.reviewFlow)s-=5;
      if(!best||s>best.s)best={s,p};
    });
    return best&&best.s>=95?best.p:null;
  }catch(_e){return null}
}
function keyFromCard(card){const b=card.querySelector('button[onclick*="p56OpenItem"]');const raw=String(b?.getAttribute('onclick')||'');const m=raw.match(/p56OpenItem\('([^']+)'\)/);return m?.[1]||''}
function creatorText(a){if(a?.createdByName)return `Cadastrado por ${a.createdByName}.`;if(a?.createdByMemberId)return `Cadastrado por ${memberName(a.createdByMemberId)}.`;return 'Autor do cadastro não registrado neste item antigo.'}
function dueText(a){if(!a?.dueDate)return'';try{const d=dateInfo(a.dueDate);if(d?.over)return `Atrasado · venceu em ${fmt(a.dueDate)}.`;if(d&&d.diff===0)return `Vence hoje · ${fmt(a.dueDate)}.`;if(d&&d.diff>0)return `Vence em ${d.diff} dia(s) · ${fmt(a.dueDate)}.`}catch(_e){}return `Prazo: ${fmt(a.dueDate)}.`}
function ensureCss(){
  if(document.getElementById('p68Style'))return;
  const s=document.createElement('style');s.id='p68Style';s.textContent=`
  .p68-section{margin-bottom:18px}.p68-section-head{display:flex;align-items:center;gap:8px;margin:4px 0 10px;font-weight:900;color:#162e39}.p68-section-head span{margin-left:auto;min-width:27px;height:27px;border-radius:999px;background:#edf4f5;display:grid;place-items:center;font-size:12px;color:#38545d}.p68-section-sub{font-size:11px;color:#71858d;font-weight:500;margin-top:2px}
  .p68-mine{border-left-color:#d6497a!important;background:#fff8fa!important}.p68-watch{border-left-color:#e0912e!important;background:#fffdf8!important}.p68-decision{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:7px}.p68-pill{display:inline-flex;align-items:center;gap:5px;border-radius:999px;padding:5px 8px;font-size:10px;font-weight:900}.p68-pill.mine{background:#ffe8ef;color:#a71e4d}.p68-pill.watch{background:#fff1dd;color:#9b5a00}.p68-pill.file{background:#eaf8f1;color:#187347}.p68-pill.nofile{background:#f1f4f5;color:#5c7179}.p68-explain{font-size:12px;line-height:1.45;color:#334d57;margin-top:7px;font-weight:650}.p68-origin{font-size:10px;color:#82949a;margin-top:4px}.p68-task-actions .btn{min-height:38px}.p68-primary{background:#0e5c63!important;border-color:#0e5c63!important;color:#fff!important}.p68-chat{background:#fff!important}.p68-empty{padding:14px;border:1px dashed #d7e2e5;border-radius:12px;color:#72868d;font-size:12px;background:#fbfdfd}
  `;document.head.appendChild(s)
}
function directReviewInfo(p){
  const sender=p.reviewSenderName||p.memberNome||memberName(p.memberId),hasFile=!!p.url;
  let action='Revisar arquivo';try{if(typeof reviewActionLabel==='function')action=reviewActionLabel(p)}catch(_e){}
  return {sender,hasFile,action,file:p.fileName||p.titulo||p.reviewBaseTitle||'Arquivo',version:Number(p.reviewVersion||1)};
}
function addChatButton(actions,memberId,title,label){
  if(!actions||!memberId||memberId===me()||typeof window.openPrivateChatWithContext!=='function')return;
  if(actions.querySelector('.p68-chat'))return;
  const b=document.createElement('button');b.type='button';b.className='btn p68-chat';b.textContent=`💬 ${label||'Conversar'}`;b.onclick=()=>window.openPrivateChatWithContext(memberId,{type:'deadline',label:'ACOMPANHAMENTO',title,eventLabel:'Painel de acompanhamento',sourceId:`p68_${memberId}_${norm(title).slice(0,30)}`});actions.appendChild(b)
}
function decorateReview(card,tid){
  const p=latestReview(tid);if(!p)return {mine:true,key:`review:${tid}`};
  const info=directReviewInfo(p),main=card.querySelector('.p56-task-main'),detail=card.querySelector('.p56-detail'),actions=card.querySelector('.p56-task-actions');
  card.classList.add('p68-mine');
  if(detail)detail.innerHTML=`<div class="p68-decision"><span class="p68-pill mine">🔥 AÇÃO SUA</span><span class="p68-pill ${info.hasFile?'file':'nofile'}">${info.hasFile?'📄 Arquivo disponível':'⚠️ Sem arquivo anexado'}</span></div><div class="p68-explain">${esc(info.sender)} enviou esta versão para você. <b>Próxima ação: ${esc(info.action)}</b> · v${info.version}.</div><div class="p68-origin">${info.hasFile?`Arquivo: ${esc(info.file)}`:'Não há arquivo anexado nesta versão.'}</div>`;
  if(actions){
    actions.querySelectorAll('.p56-done-btn').forEach(b=>b.remove());
    const open=actions.querySelector('button[onclick*="p56OpenItem"]')||actions.querySelector('button');
    if(open){open.textContent=info.hasFile?'✍️ Corrigir agora':'Ver fluxo';open.classList.add('p68-primary');open.removeAttribute('onclick');open.onclick=()=>{try{if(typeof switchView==='function')switchView('pubs');setTimeout(()=>{if(info.hasFile&&typeof window.openReviewResponse==='function')window.openReviewResponse(p.id);else if(typeof window.openReviewConversation==='function')window.openReviewConversation(p.id)},120)}catch(e){console.warn(e)}}
    addChatButton(actions,p.reviewSenderId||p.memberId,p.reviewBaseTitle||p.titulo,'Conversar');
  }
  return {mine:true,key:`review:${tid}`};
}
function decorateActivity(card,id){
  const a=activity(id);if(!a)return {mine:false,key:`activity:${id}`};
  const owner=memberName(a.ownerId),mine=isMineActivity(a),file=visibleFileForActivity(a),detail=card.querySelector('.p56-detail'),actions=card.querySelector('.p56-task-actions');
  card.classList.add(mine?'p68-mine':'p68-watch');
  let explanation='';
  if(mine){
    explanation=`Esta tarefa está vinculada a você. ${dueText(a)}`;
  }else if(file){
    explanation=`Responsável: ${owner}. Há um arquivo visível no Repositório, mas <b>não existe uma solicitação de correção para você neste acompanhamento</b>. ${dueText(a)}`;
  }else if(needsFile(a)){
    explanation=`Responsável: ${owner}. <b>Nenhum arquivo correspondente está visível para você no Repositório.</b> Portanto, isto é acompanhamento do prazo, não uma correção esperando sua decisão. ${dueText(a)}`;
  }else{
    explanation=`Responsável: ${owner}. Isto é um item de acompanhamento dela/dele, não uma demanda direta para você. ${dueText(a)}`;
  }
  if(detail)detail.innerHTML=`<div class="p68-decision"><span class="p68-pill ${mine?'mine':'watch'}">${mine?'🔥 AÇÃO SUA':`👀 AÇÃO DE ${esc(first(owner).toUpperCase())}`}</span>${needsFile(a)||file?`<span class="p68-pill ${file?'file':'nofile'}">${file?'📄 Arquivo visível':'⏳ Sem arquivo visível'}</span>`:''}</div><div class="p68-explain">${explanation}</div><div class="p68-origin">${file?`Arquivo encontrado: ${esc(file.fileName||file.titulo||'Arquivo')}. `:''}${esc(creatorText(a))}</div>`;
  if(actions){
    const open=actions.querySelector('button[onclick*="p56OpenItem"]')||actions.querySelector('button');
    if(open){open.textContent=mine?'Abrir ação':'Ver detalhes';open.removeAttribute('onclick');open.onclick=()=>{if(typeof window.p67OpenActivity==='function')window.p67OpenActivity(a.id);else if(typeof window.p66OpenActivityDetail==='function')window.p66OpenActivityDetail(a.id)}}
    if(!mine)actions.querySelectorAll('.p56-done-btn').forEach(b=>b.remove());
    if(!mine)addChatButton(actions,a.ownerId,a.title||'Acompanhamento',`Falar com ${first(owner)}`);
  }
  return {mine,key:`activity:${id}`};
}
function decorateCheckin(card,key){
  const raw=key.slice(8),pos=raw.lastIndexOf(':'),memberId=pos>0?raw.slice(0,pos):raw,owner=memberName(memberId),mine=memberId===me(),detail=card.querySelector('.p56-detail'),actions=card.querySelector('.p56-task-actions');
  card.classList.add(mine?'p68-mine':'p68-watch');
  if(detail)detail.innerHTML=`<div class="p68-decision"><span class="p68-pill ${mine?'mine':'watch'}">${mine?'🔥 AÇÃO SUA':`👀 AÇÃO DE ${esc(first(owner).toUpperCase())}`}</span></div><div class="p68-explain">${mine?'Você ainda precisa registrar este check-in.':`${esc(owner)} ainda precisa registrar o check-in. <b>Você só acompanha.</b>`}</div>`;
  if(actions&&!mine){actions.querySelectorAll('.p56-done-btn').forEach(b=>b.remove());const open=actions.querySelector('button');if(open){open.textContent='Ver pessoa';open.removeAttribute('onclick');open.onclick=()=>{try{focusMemberTrack(memberId)}catch(_e){}}}addChatButton(actions,memberId,'Check-in mensal',`Lembrar ${first(owner)}`)}
  return {mine,key};
}
function decorateOther(card,key){
  const mine=!admin();card.classList.add(mine?'p68-mine':'p68-watch');const detail=card.querySelector('.p56-detail');if(detail&&admin())detail.innerHTML=`<div class="p68-decision"><span class="p68-pill watch">👀 ACOMPANHAR</span></div><div class="p68-explain">Este é um alerta de gestão. Não significa que há um arquivo esperando sua correção.</div>`;return{mine,key}
}
function processCard(card){
  const key=keyFromCard(card);if(!key)return {mine:false,key:''};
  if(key.startsWith('review:'))return decorateReview(card,key.slice(7));
  if(key.startsWith('activity:'))return decorateActivity(card,key.slice(9));
  if(key.startsWith('checkin:'))return decorateCheckin(card,key);
  return decorateOther(card,key)
}
function section(title,sub,count,nodes){const wrap=document.createElement('div');wrap.className='p68-section';wrap.innerHTML=`<div class="p68-section-head"><div>${title}<div class="p68-section-sub">${sub}</div></div><span>${count}</span></div>`;if(nodes.length)nodes.forEach(n=>wrap.appendChild(n));else{const e=document.createElement('div');e.className='p68-empty';e.textContent=title.includes('Precisa')?'Nada esperando uma decisão sua agora.':'Nada para acompanhar agora.';wrap.appendChild(e)}return wrap}
function updateKpis(mineCount,watchCount){
  try{const ks=[...document.querySelectorAll('#dashKpis .dash-kpi')];if(ks[0]){ks[0].querySelector('.k-n').textContent=mineCount;ks[0].querySelector('.k-l').textContent='precisam de você'}if(ks[2]){ks[2].querySelector('.k-n').textContent=watchCount;ks[2].querySelector('.k-l').textContent='só acompanhar'}const g=document.getElementById('dashGreeting');if(g)g.textContent='Veja primeiro o que realmente depende de você. O restante fica separado apenas para acompanhamento.'}catch(_e){}
}
function transform(){
  const root=document.getElementById('dashAttention');if(!root||busy)return;
  const cards=[...root.querySelectorAll('.p56-task')];if(!cards.length&&root.querySelector('.p68-section'))return;
  const keys=cards.map(keyFromCard).filter(Boolean).join('|');if(root.dataset.p68Signature===keys&&root.querySelector('.p68-section'))return;
  busy=true;
  try{
    const done=root.querySelector('.p56-done-box'),mine=[],watch=[];
    cards.forEach(card=>{const r=processCard(card);(r.mine?mine:watch).push(card)});
    root.innerHTML='';root.appendChild(section('🔥 Precisa de você','Só entra aqui o que realmente espera uma decisão ou ação sua.',mine.length,mine));root.appendChild(section('👀 Só acompanhar','Prazos e tarefas dos alunos. Não são demandas suas.',watch.length,watch));if(done)root.appendChild(done);
    root.dataset.p68Signature=keys;updateKpis(mine.length,watch.length);
  }finally{busy=false}
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;transform()})}
function install(){
  ensureCss();
  if(!baseRender&&typeof window.renderPainel==='function')baseRender=window.renderPainel;
  if(baseRender&&window.renderPainel!==p68Render){try{renderPainel=p68Render}catch(_e){}window.renderPainel=p68Render}
  schedule();
}
function p68Render(){const r=baseRender?baseRender.apply(this,arguments):undefined;setTimeout(transform,0);return r}
function boot(){install();const root=document.getElementById('dashAttention')||document.body;new MutationObserver(schedule).observe(root,{childList:true,subtree:true});setTimeout(install,900);setTimeout(install,2200);console.info('Carbonautas',VERSION,BUILD,'painel separa ação real de acompanhamento')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
