/* Carbonautas P54 · histórico auditável + ações padronizadas */
(function(){
'use strict';
const VERSION='P54';
let pubs=[];
let members=new Map();
let loaded=false;
let loading=false;

function esc54(v=''){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function norm54(v=''){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim()}
function toDate54(v){
  if(!v)return null;
  try{
    if(typeof v.toDate==='function')return v.toDate();
    if(typeof v.toMillis==='function')return new Date(v.toMillis());
    const d=v instanceof Date?v:new Date(v);
    return Number.isNaN(d.getTime())?null:d;
  }catch(_e){return null}
}
function ms54(v){const d=toDate54(v);return d?d.getTime():0}
function when54(v){
  const d=toDate54(v);if(!d)return '—';
  return d.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).replace(',',' ·');
}
function name54(id,fallback=''){return members.get(id)?.nome||fallback||''}

async function loadData54(){
  if(loading)return;loading=true;
  try{
    const f=window.fbFns;
    if(!f||!window.db)return;
    const [ps,ms]=await Promise.all([
      f.getDocs(f.collection(window.db,'rede_publicacoes')),
      f.getDocs(f.collection(window.db,'rede_members'))
    ]);
    pubs=ps.docs.map(d=>({...d.data(),id:d.id}));
    members=new Map(ms.docs.map(d=>[d.id,{...d.data(),id:d.id}]));
    loaded=true;
  }catch(e){console.warn('P54 não conseguiu carregar histórico do repositório',e)}
  finally{loading=false}
}

function histRow54(date,person,action,version,icon='•'){
  return `<div class="p54-row">
    <div class="p54-date">${esc54(date)}</div>
    <div class="p54-person"><span>${icon}</span><b>${esc54(person||'Carbonauta')}</b></div>
    <div class="p54-action-text">${esc54(action)}</div>
    <div class="p54-version">v${esc54(version)}</div>
  </div>`;
}
function histBox54(rows,next=''){
  return `<div class="p54-history">
    <div class="p54-title">Histórico do arquivo</div>
    <div class="p54-head"><span>Data e hora</span><span>Pessoa</span><span>O que fez</span><span>Versão</span></div>
    ${rows.join('')}
    ${next?`<div class="p54-next"><b>Próxima ação</b><span>${esc54(next)}</span></div>`:''}
  </div>`;
}

function regularHistory54(p){
  const rows=[];
  const owner=p.memberNome||name54(p.memberId,'Proprietário');
  rows.push(histRow54(when54(p.ts),owner,'enviou o arquivo',1,'⬆'));
  const hist=Array.isArray(p.onlineEditHistory)?p.onlineEditHistory:[];
  hist.forEach((h,i)=>{
    const person=h?.byName||name54(h?.byMemberId,'Carbonauta');
    const version=Number(h?.version||i+1)+1;
    rows.push(histRow54(when54(h?.savedAt),person,'editou o arquivo',version,'✎'));
  });
  const current=Number(p.onlineEditVersion||1);
  if(hist.length===0&&current>1&&(p.editedAt||p.editedByName)){
    rows.push(histRow54(when54(p.editedAt),p.editedByName||name54(p.editedByMemberId,'Carbonauta'),'editou o arquivo',current,'✎'));
  }
  const turnId=p.repositoryTurnMemberId||'';
  const next=turnId?`${name54(turnId,turnId===p.memberId?owner:'Carbonauta')} · continuar a partir da versão ${current}`:'';
  return histBox54(rows,next);
}

function reviewGroup54(p){
  const tid=p.reviewThreadId||p.id;
  return pubs.filter(x=>x.reviewFlow&&(x.reviewThreadId||x.id)===tid).sort((a,b)=>(Number(a.reviewVersion)||1)-(Number(b.reviewVersion)||1));
}
function reviewHistory54(p){
  const group=reviewGroup54(p);const versions=group.length?group:[p];
  const rows=versions.map((v,i)=>{
    const person=v.reviewSenderName||v.memberNome||name54(v.memberId,'Carbonauta');
    let action='enviou para correção';
    if(v.reviewStatus==='correcao_devolvida')action='devolveu a correção';
    else if(v.reviewStatus==='nova_versao')action='enviou nova versão para revisão';
    else if(i>0)action='enviou nova versão';
    return histRow54(when54(v.ts),person,action,Number(v.reviewVersion)||i+1,v.reviewStatus==='correcao_devolvida'?'↩':'⬆');
  });
  const latest=versions[versions.length-1]||p;
  const nextName=name54(latest.reviewNextRecipientId,'');
  let next='';
  if(nextName){
    next=latest.reviewStatus==='correcao_devolvida'
      ?`${nextName} · ajustar a versão ${Number(latest.reviewVersion)||1}`
      :`${nextName} · revisar a versão ${Number(latest.reviewVersion)||1}`;
  }
  return histBox54(rows,next);
}

function publicationForCard54(card){
  const titleEl=card.querySelector('.pub-t,.repo-title');if(!titleEl)return null;
  const title=norm54(titleEl.textContent);if(!title)return null;
  const matches=pubs.filter(p=>norm54(p.titulo||p.reviewBaseTitle||'')===title);
  if(!matches.length)return null;
  return matches.sort((a,b)=>{
    const av=Number(a.reviewVersion||a.onlineEditVersion||1),bv=Number(b.reviewVersion||b.onlineEditVersion||1);
    if(av!==bv)return bv-av;return ms54(b.ts||b.editedAt)-ms54(a.ts||a.editedAt);
  })[0];
}

function enhanceCard54(card){
  if(!loaded)return;
  const p=publicationForCard54(card);if(!p||p.tipo!=='arquivo')return;
  const signature=`${p.id}:${p.reviewVersion||p.onlineEditVersion||1}:${(p.onlineEditHistory||[]).length}`;
  if(card.dataset.p54Signature===signature&&card.querySelector('.p54-history'))return;
  card.dataset.p54Signature=signature;
  card.querySelectorAll('.p54-history').forEach(x=>x.remove());
  const html=p.reviewFlow?reviewHistory54(p):regularHistory54(p);
  if(!html)return;
  const body=card.querySelector('.pub-body,.repo-main');if(!body)return;
  const tmp=document.createElement('div');tmp.innerHTML=html;const history=tmp.firstElementChild;
  const after=body.querySelector('.office-version');
  if(after)after.insertAdjacentElement('afterend',history);else body.appendChild(history);
  card.classList.add('p54-enhanced');
}

function normalizeAction54(btn,type,label){
  btn.classList.add('p54-action-btn',`p54-${type}`);
  btn.textContent=label;
}
function normalizeActions54(){
  document.querySelectorAll('.pub-act button,.repo-actions button,.review-version-actions button').forEach(b=>{
    if(b.classList.contains('mini-x'))return;
    const title=(b.getAttribute('title')||'').toLowerCase();
    const txt=(b.textContent||'').trim().toLowerCase();
    if(title.includes('visualizar')||txt==='👁️'||txt==='👁'||txt.includes('👁 ver')||txt==='ver') normalizeAction54(b,'view','👁 Visualizar');
    else if(title.includes('baixar')||txt.includes('baixar')) normalizeAction54(b,'download','⬇ Baixar');
    else if(b.classList.contains('office-edit-btn')||txt.includes('corrigir online')) normalizeAction54(b,'edit',txt.includes('corrigir')?'✎ Corrigir':'✎ Editar');
    else if(txt.includes('editar')&&!b.classList.contains('review-action')) normalizeAction54(b,'edit','✎ Editar');
    else if(b.classList.contains('repo-room-btn')||txt.includes('conversa do arquivo')) normalizeAction54(b,'chat','💬 Conversa');
    else if(b.classList.contains('review-action')) b.classList.add('p54-action-btn','p54-review');
  });
}

function injectCss54(){
  if(document.getElementById('p54RepoStyle'))return;
  const s=document.createElement('style');s.id='p54RepoStyle';s.textContent=`
    .p54-enhanced .repo-sequence,.p54-enhanced .p52-review-flow,.p54-enhanced .review-meta{display:none!important}
    .p54-history{margin-top:10px;border:1px solid #d8e4e7;border-radius:14px;background:#fff;overflow:hidden;max-width:860px}
    .p54-title{padding:9px 12px;background:#f2f7f8;border-bottom:1px solid #e3ecee;color:#526a73;font-size:10.5px;font-weight:900;letter-spacing:.06em;text-transform:uppercase}
    .p54-head,.p54-row{display:grid;grid-template-columns:170px minmax(190px,1.25fr) minmax(175px,1fr) 58px;gap:10px;align-items:center}
    .p54-head{padding:7px 12px;background:#fafcfc;border-bottom:1px solid #edf2f3;color:#87969b;font-size:8.5px;font-weight:900;text-transform:uppercase;letter-spacing:.05em}
    .p54-row{padding:9px 12px;border-bottom:1px solid #edf2f3;font-size:11.5px;line-height:1.3;color:#425962}
    .p54-date{font-variant-numeric:tabular-nums;font-weight:750;color:#5f737b}.p54-person{display:flex;gap:7px;align-items:center;min-width:0}.p54-person span{width:18px;text-align:center;flex:0 0 18px}.p54-person b{color:#17313d}.p54-action-text{color:#52676f}.p54-version{justify-self:end;padding:3px 7px;border-radius:999px;background:#edf4f5;color:#566c74;font-size:9.5px;font-weight:900}
    .p54-next{display:flex;gap:9px;align-items:center;flex-wrap:wrap;padding:9px 12px;background:#fff8df;border-top:1px solid #eedc91;color:#635722;font-size:11.5px}.p54-next b{color:#3e3618;text-transform:uppercase;font-size:9px;letter-spacing:.05em}
    .pub-act,.repo-actions{display:flex!important;flex-wrap:wrap!important;gap:8px!important;align-items:center!important;justify-content:flex-end!important;max-width:300px!important}
    .p54-action-btn{height:40px!important;min-width:128px!important;padding:0 13px!important;border-radius:10px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:7px!important;font-size:12px!important;font-weight:800!important;line-height:1!important;box-shadow:none!important;white-space:nowrap!important}
    .p54-view,.p54-download,.p54-chat{background:#fff!important;color:#17313d!important;border:1px solid #cbdade!important}.p54-edit{background:#0e8897!important;color:#fff!important;border:1px solid #0e8897!important}.p54-review{background:#6c5ce0!important;color:#fff!important;border:1px solid #6c5ce0!important}
    .pub-act .mini-x,.repo-actions .mini-x{width:40px!important;height:40px!important;min-width:40px!important;border-radius:10px!important;display:grid!important;place-items:center!important;font-size:18px!important;margin:0!important}
    @media(max-width:820px){.p54-head{display:none}.p54-row{grid-template-columns:1fr auto;gap:4px 10px}.p54-date{grid-column:1/2;font-size:10.5px}.p54-version{grid-column:2/3;grid-row:1/3}.p54-person{grid-column:1/2}.p54-action-text{grid-column:1/2;padding-left:25px}.pub-act,.repo-actions{max-width:none!important;justify-content:flex-start!important}.p54-action-btn{min-width:118px!important}}
  `;document.head.appendChild(s);
}

async function cycle54(){
  if(!loaded)await loadData54();
  normalizeActions54();
  document.querySelectorAll('.pub-row,.repo-item').forEach(enhanceCard54);
}
function boot54(){
  injectCss54();
  const wait=setInterval(async()=>{
    if(window.db&&window.fbFns){clearInterval(wait);await cycle54();setInterval(cycle54,1800);setInterval(loadData54,15000);console.info('Carbonautas repository UI',VERSION,'carregado');}
  },250);
  setTimeout(()=>clearInterval(wait),20000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot54,{once:true});else boot54();
})();
