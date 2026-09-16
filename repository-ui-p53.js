/* Carbonautas P53 · histórico claro + botões padronizados */
(function(){
'use strict';
const VERSION='P53';

function esc53(v=''){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function toDate53(v){
  if(!v)return null;
  try{
    if(typeof v.toDate==='function')return v.toDate();
    if(typeof v.toMillis==='function')return new Date(v.toMillis());
    const d=v instanceof Date?v:new Date(v);
    return Number.isNaN(d.getTime())?null:d;
  }catch(e){return null}
}
function when53(v){
  const d=toDate53(v); if(!d)return '';
  return d.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).replace(',',' ·');
}
function member53(id){try{return typeof memberById==='function'?memberById(id):null}catch(e){return null}}
function ownerName53(p){const m=member53(p?.memberId);return p?.memberNome||m?.nome||'Proprietário'}
function historyRow53(when,who,action,version,icon){
  return `<div class="p53-history-row">
    <div class="p53-when">${esc53(when||'—')}</div>
    <div class="p53-who"><span class="p53-ico">${icon||'•'}</span><b>${esc53(who||'Carbonauta')}</b></div>
    <div class="p53-action-text">${esc53(action||'alterou o arquivo')}</div>
    <div class="p53-version">v${esc53(version||'')}</div>
  </div>`;
}
function historyBox53(rows,turn=''){
  return `<div class="p53-history">
    <div class="p53-history-title">Histórico do arquivo</div>
    <div class="p53-history-head"><span>Data e hora</span><span>Pessoa</span><span>Ação</span><span>Versão</span></div>
    ${rows.join('')}${turn}
  </div>`;
}

function normalHistory53(p){
  if(!p||p.reviewFlow||p.tipo!=='arquivo')return '';
  const version=Number(p.onlineEditVersion||1),hist=Array.isArray(p.onlineEditHistory)?p.onlineEditHistory:[];
  if(version<=1&&!p.editedOnline&&!hist.length)return '';
  const ownerName=ownerName53(p),rows=[];
  rows.push(historyRow53(when53(p.ts),ownerName,'enviou o arquivo',1,'⬆'));
  const edits=hist.map((h,i)=>({
    who:h?.byName||member53(h?.byMemberId)?.nome||'Carbonauta',
    at:h?.savedAt||'',
    version:Number(h?.version||i+1)+1
  })).filter(x=>x.who||x.at);
  if(!edits.length&&version>1&&(p.editedByName||p.editedAt))edits.push({who:p.editedByName||'Carbonauta',at:p.editedAt,version});
  edits.forEach(e=>rows.push(historyRow53(when53(e.at),e.who,'editou o arquivo',e.version,'✎')));

  const last=edits[edits.length-1]||null;
  const ownerUid=p.ownerUid||((typeof state!=='undefined'&&Array.isArray(state.users)?state.users:[]).find(u=>u.memberId===p.memberId)?.uid||'');
  const rawHist=hist[hist.length-1]||null;
  const lastByMember=rawHist?.byMemberId||p.editedByMemberId||'';
  const lastByUid=rawHist?.byUid||p.editedByUid||'';
  const lastIsOwner=last ? ((lastByMember&&lastByMember===p.memberId)||(lastByUid&&ownerUid&&lastByUid===ownerUid)||(!lastByMember&&!lastByUid&&last.who===ownerName)) : true;
  const explicitTurn=p.repositoryTurnMemberId||'';
  const shouldShowTurn=(explicitTurn&&explicitTurn===p.memberId)||(!explicitTurn&&last&&!lastIsOwner);
  const turn=shouldShowTurn?`<div class="p53-next"><b>Próxima ação:</b> ${esc53(ownerName)} · continuar a partir da versão ${esc53(version)}</div>`:'';
  return historyBox53(rows,turn);
}

function reviewHistory53(p){
  if(!p?.reviewFlow)return '';
  let versions=[];
  try{versions=typeof reviewThreadItems==='function'?reviewThreadItems(p.reviewThreadId||p.id):[]}catch(e){}
  if(!versions.length)versions=[p];
  versions=[...versions].sort((a,b)=>(Number(a.reviewVersion)||1)-(Number(b.reviewVersion)||1));
  const rows=versions.map((v,i)=>{
    const who=v.reviewSenderName||v.memberNome||ownerName53(v);
    let action='enviou para correção';
    if(v.reviewStatus==='correcao_devolvida')action='devolveu a correção';
    else if(v.reviewStatus==='nova_versao')action='enviou nova versão para revisão';
    else if(i>0)action='enviou nova versão';
    return historyRow53(when53(v.ts),who,action,Number(v.reviewVersion)||i+1,v.reviewStatus==='correcao_devolvida'?'↩':'⬆');
  });
  const next=member53(p.reviewNextRecipientId);
  let nextText='';
  if(next){
    nextText=p.reviewStatus==='correcao_devolvida'
      ?`${next.nome} · ajustar a versão ${Number(p.reviewVersion)||1}`
      :`${next.nome} · revisar a versão ${Number(p.reviewVersion)||1}`;
  }
  const turn=nextText?`<div class="p53-next"><b>Próxima ação:</b> ${esc53(nextText)}</div>`:'';
  return historyBox53(rows,turn);
}

function injectCss53(){
  if(document.getElementById('p53RepoStyle'))return;
  const st=document.createElement('style');st.id='p53RepoStyle';st.textContent=`
    .repo-sequence,.p52-review-flow{display:none!important}
    .p53-history{margin-top:10px;border:1px solid #d9e4e8;border-radius:14px;background:#fbfdfd;overflow:hidden;max-width:850px}
    .p53-history-title{padding:10px 12px 7px;font-size:11px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:#526a73;background:#f3f8f8;border-bottom:1px solid #e4ecef}
    .p53-history-head,.p53-history-row{display:grid;grid-template-columns:165px minmax(180px,1.3fr) minmax(160px,1fr) 58px;gap:10px;align-items:center}
    .p53-history-head{padding:7px 12px;background:#f8fbfb;color:#83939a;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid #edf2f3}
    .p53-history-row{padding:9px 12px;border-bottom:1px solid #edf2f3;color:#354d56;font-size:11.5px;line-height:1.3}
    .p53-history-row:last-of-type{border-bottom:0}.p53-when{font-variant-numeric:tabular-nums;color:#60747c;font-weight:700}.p53-who{display:flex;align-items:center;gap:7px;min-width:0}.p53-who b{color:#17313d;white-space:normal}.p53-ico{width:20px;text-align:center;flex:0 0 20px}.p53-action-text{color:#536870}.p53-version{justify-self:end;background:#edf4f5;color:#53686f;border-radius:999px;padding:3px 7px;font-size:10px;font-weight:900}
    .p53-next{padding:9px 12px;background:#fff8df;border-top:1px solid #f0dc8f;color:#5e5122;font-size:11.5px}.p53-next b{color:#3e3517}
    .pub-act,.repo-actions{display:flex!important;flex-wrap:wrap!important;gap:8px!important;align-items:center!important;justify-content:flex-end!important;max-width:300px!important}
    .p53-action-btn{height:40px!important;min-width:128px!important;padding:0 13px!important;border-radius:10px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:7px!important;font-size:12px!important;font-weight:800!important;line-height:1!important;box-shadow:none!important;white-space:nowrap!important}
    .p53-action-btn.p53-view,.p53-action-btn.p53-download,.p53-action-btn.p53-chat{background:#fff!important;color:#17313d!important;border:1px solid #cfdde1!important}
    .p53-action-btn.p53-edit{background:#0e8897!important;color:#fff!important;border:1px solid #0e8897!important}
    .p53-action-btn.p53-review{background:#6c5ce0!important;color:#fff!important;border:1px solid #6c5ce0!important}
    .pub-act .mini-x,.repo-actions .mini-x{width:40px!important;height:40px!important;min-width:40px!important;border-radius:10px!important;display:grid!important;place-items:center!important;font-size:18px!important;margin:0!important}
    @media(max-width:800px){
      .p53-history-head{display:none}.p53-history-row{grid-template-columns:1fr auto;gap:4px 10px}.p53-when{grid-column:1/2;font-size:10.5px}.p53-version{grid-column:2/3;grid-row:1/3}.p53-who{grid-column:1/2}.p53-action-text{grid-column:1/2;padding-left:27px}.pub-act,.repo-actions{max-width:none!important;justify-content:flex-start!important}.p53-action-btn{min-width:118px!important}
    }
  `;document.head.appendChild(st);
}

function normalizeActions53(){
  document.querySelectorAll('.pub-act button,.repo-actions button,.review-version-actions button').forEach(b=>{
    if(b.classList.contains('mini-x'))return;
    const title=(b.getAttribute('title')||'').toLowerCase();
    const txt=(b.textContent||'').trim().toLowerCase();
    if(title.includes('visualizar')||txt==='👁️'||txt==='👁'||txt.includes('👁 ver')){
      b.textContent='👁 Visualizar';b.classList.add('p53-action-btn','p53-view');
    }else if(title.includes('baixar')||txt.includes('baixar')){
      b.textContent='⬇ Baixar';b.classList.add('p53-action-btn','p53-download');
    }else if(b.classList.contains('office-edit-btn')||txt.includes('editar')||txt.includes('corrigir online')){
      b.textContent=txt.includes('corrigir')?'✎ Corrigir':'✎ Editar';b.classList.add('p53-action-btn','p53-edit');
    }else if(b.classList.contains('repo-room-btn')||txt.includes('conversa do arquivo')){
      b.textContent='💬 Conversa';b.classList.add('p53-action-btn','p53-chat');
    }else if(b.classList.contains('review-action')){
      b.classList.add('p53-action-btn','p53-review');
    }
  });
}

function install53(){
  injectCss53();
  try{window.repositorySequenceHTML=normalHistory53}catch(e){}
  try{repositorySequenceHTML=normalHistory53}catch(e){console.warn('P53 repository history override',e)}
  try{window.reviewBadgeHTML=reviewHistory53}catch(e){}
  try{reviewBadgeHTML=reviewHistory53}catch(e){console.warn('P53 review history override',e)}
  setTimeout(()=>{try{if(typeof renderPubs==='function')renderPubs()}catch(e){}normalizeActions53()},220);
  setTimeout(normalizeActions53,700);
  setInterval(normalizeActions53,1500);
  console.info('Carbonautas repository UI',VERSION,'carregado');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install53,{once:true});else install53();
})();
