/* Carbonautas P131 · Dossiê individual com contabilidade de uso e ações */
(function(){
'use strict';
if(window.__CARBONAUTAS_P131)return;window.__CARBONAUTAS_P131=true;
const BUILD='P131';
const ACCESS_WINDOW=30*60*1000;
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function F(){return window.fbFns}
function S(){try{return state||{}}catch(_e){return{}}}
function myMember(){try{return myId||''}catch(_e){return''}}
function member(id){try{return typeof memberById==='function'?memberById(id):null}catch(_e){return null}}
function dayIso(d=new Date()){return d.toISOString().slice(0,10)}
function ms(v){if(!v)return 0;if(v?.toMillis)return v.toMillis();if(v?.toDate)return v.toDate().getTime();const n=+new Date(v);return Number.isFinite(n)?n:0}
function fmtDateTime(v){const n=ms(v);if(!n)return'—';return new Date(n).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}
function actionDate(x){return ms(x?.updatedAt)||ms(x?.createdAt)||ms(x?.ts)||ms(x?.date)||0}
function selectedId(){return $('#dossierPerson')?.value||''}

async function trackAccess(){
  const id=myMember(),f=F();if(!id||!f||!window.db||!window.auth?.currentUser)return;
  const key='carbonautas_p131_access_'+id,last=Number(localStorage.getItem(key)||0);
  if(Date.now()-last<ACCESS_WINDOW)return;
  try{
    const ref=f.doc(window.db,'rede_members',id),snap=await f.getDoc(ref),cur=snap.exists()?snap.data():{},today=dayIso();
    const patch={
      lastSeenAt:f.serverTimestamp(),lastSeenDay:today,
      accessCount:f.increment(1),accessLastDay:today,accessTrackingVersion:BUILD
    };
    if(cur.accessLastDay!==today)patch.accessDaysCount=f.increment(1);
    if(!cur.accessFirstTrackedAt)patch.accessFirstTrackedAt=f.serverTimestamp();
    await f.updateDoc(ref,patch);
    localStorage.setItem(key,String(Date.now()));
  }catch(e){console.warn('P131 acesso',e?.code||e)}
}

function countsFor(id){
  const st=S(),acts=(st.activities||[]).filter(a=>a.ownerId===id);
  let repo=[];try{if(typeof memberRepositoryItems==='function')repo=memberRepositoryItems(id)||[]}catch(_e){}
  let cron=[];try{if(typeof buildCronoItems==='function')cron=(buildCronoItems()||[]).filter(x=>x.ownerId===id)}catch(_e){}
  const feed=(st.feed||[]).filter(x=>x.authorId===id);
  const chat=(st.chat||[]).filter(x=>x.authorId===id);
  const comments=(st.comments||[]).filter(x=>x.authorId===id);
  const reactions=(st.reactions||[]).filter(x=>x.actorId===id||x.actorMemberId===id);
  const doneCron=cron.filter(x=>x.feito).length;
  const pendingCron=cron.filter(x=>!x.feito).length;
  const overdue=cron.filter(x=>!x.feito&&x.data&&String(x.data)<dayIso()).length;
  const files=repo.filter(r=>r.isFile||r.fileName).length;
  const folders=repo.filter(r=>r.source==='package').length;
  return {
    acts,repo,cron,feed,chat,comments,reactions,
    orientations:acts.filter(a=>a.type==='orientacao').length,
    corrections:acts.filter(a=>a.type==='correcao').length,
    checkins:acts.filter(a=>a.type==='checkin').length,
    products:acts.filter(a=>a.type==='produto').length,
    pendingActs:acts.filter(a=>!['concluido','done','feito'].includes(String(a.status||'').toLowerCase())&&Number(a.progress||0)<100).length,
    doneCron,pendingCron,overdue,files,folders
  };
}

function stat(icon,n,label,sub=''){return `<div class="p131-stat"><span class="p131-ico">${icon}</span><strong>${Number(n||0).toLocaleString('pt-BR')}</strong><b>${esc(label)}</b>${sub?`<small>${esc(sub)}</small>`:''}</div>`}
function row(label,n,detail=''){return `<div class="p131-row"><span>${esc(label)}${detail?`<small>${esc(detail)}</small>`:''}</span><b>${Number(n||0).toLocaleString('pt-BR')}</b></div>`}

async function loadPointEvents(id){
  const f=F();if(!f||!window.db||!id)return[];
  try{const q=f.query(f.collection(window.db,'rede_points_events'),f.where('memberId','==',id));const snap=await f.getDocs(q);return snap.docs.map(d=>({...d.data(),id:d.id})).sort((a,b)=>actionDate(b)-actionDate(a))}catch(e){console.warn('P131 ações',e?.code||e);return[]}
}
function pointLabel(a=''){return ({activity_created:'Acompanhamento registrado',activity_completed:'Acompanhamento concluído',checkin:'Check-in',product:'Produto',repo_package:'Pasta no repositório',publication:'Arquivo/publicação',photo:'Foto',feed:'Publicação no mural',help_post:'Pedido/ajuda no mural',deadline_done:'Prazo concluído',game_complete:'Jogo concluído'})[a]||a||'Ação'}

function recentItems(id,c,points){
  const items=[];
  c.acts.forEach(a=>items.push({t:actionDate(a),label:a.title||pointLabel(a.type),kind:'Acompanhamento'}));
  c.feed.forEach(a=>items.push({t:actionDate(a),label:a.title||a.text||'Publicação no mural',kind:'Mural'}));
  c.comments.forEach(a=>items.push({t:actionDate(a),label:a.text||'Comentário',kind:'Comentário'}));
  c.chat.forEach(a=>items.push({t:actionDate(a),label:a.text||'Mensagem/recado',kind:'Mensagem'}));
  c.repo.forEach(a=>items.push({t:actionDate(a),label:a.title||a.fileName||'Item do repositório',kind:'Repositório'}));
  points.slice(0,40).forEach(a=>items.push({t:actionDate(a),label:a.label||pointLabel(a.action),kind:pointLabel(a.action)}));
  const seen=new Set();return items.filter(x=>x.t).sort((a,b)=>b.t-a.t).filter(x=>{const k=x.kind+'|'+x.label+'|'+x.t;if(seen.has(k))return false;seen.add(k);return true}).slice(0,8)
}

function renderBase(id){
  const host=$('#p131DossierAnalytics');if(!host)return;
  const m=member(id)||{},c=countsFor(id),access=Number(m.accessCount||0),days=Number(m.accessDaysCount||0);
  host.innerHTML=`
    <div class="p131-title"><div><span>RAIO-X INDIVIDUAL</span><h3>Uso e atividade no Carbonautas</h3><p>Contabilidade objetiva do que esta pessoa faz na plataforma.</p></div><div class="p131-last"><small>Último acesso</small><b>${esc(fmtDateTime(m.lastSeenAt||m.lastSeenDay))}</b></div></div>
    <div class="p131-stats">
      ${stat('🚪',access,'acessos','sessões de até 30 min')}
      ${stat('📅',days,'dias ativos','contagem exata desde P131')}
      ${stat('⚡',c.acts.length+c.repo.length+c.feed.length+c.chat.length+c.comments.length+c.reactions.length,'ações registradas','somatório dos registros disponíveis')}
      ${stat('📚',c.repo.length,'itens no repositório',`${c.files} arquivo(s) · ${c.folders} pasta(s)`)}
      ${stat('✅',c.doneCron,'prazos concluídos',`${c.pendingCron} pendente(s)`)}
      ${stat('💬',c.feed.length+c.chat.length+c.comments.length,'interações escritas','mural + mensagens públicas + comentários')}
    </div>
    <div class="p131-columns">
      <section><h4>O que foi feito</h4>
        ${row('Acompanhamentos',c.acts.length)}
        ${row('Orientações',c.orientations)}
        ${row('Correções',c.corrections)}
        ${row('Check-ins',c.checkins)}
        ${row('Produtos',c.products)}
        ${row('Arquivos no repositório',c.files)}
        ${row('Pastas/conjuntos',c.folders)}
      </section>
      <section><h4>Participação na rede</h4>
        ${row('Publicações no mural',c.feed.length)}
        ${row('Mensagens/recados públicos',c.chat.length)}
        ${row('Comentários',c.comments.length)}
        ${row('Reações',c.reactions.length)}
        ${row('Prazos pendentes',c.pendingCron)}
        ${row('Prazos atrasados',c.overdue)}
        ${row('Pendências de acompanhamento',c.pendingActs)}
      </section>
    </div>
    <div class="p131-history"><h4>Últimas ações</h4><div class="p131-loading">Montando histórico…</div></div>
    <div class="p131-note">A contagem de acessos passa a ser exata a partir da P131 (19/09/2026). O sistema não inventa acessos anteriores. O “último acesso” já aproveita o registro de presença existente. Conversas privadas não entram nesta contabilidade.</div>`;
}
async function renderHistory(id){
  const host=$('#p131DossierAnalytics');if(!host||host.dataset.memberId!==id)return;
  const c=countsFor(id),points=await loadPointEvents(id);if(!host||host.dataset.memberId!==id)return;
  const items=recentItems(id,c,points),h=$('.p131-history',host);if(!h)return;
  const actionCounts={};points.forEach(p=>actionCounts[pointLabel(p.action)]=(actionCounts[pointLabel(p.action)]||0)+1);
  const chips=Object.entries(actionCounts).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>`<span>${esc(k)} <b>${v}</b></span>`).join('');
  h.innerHTML=`<h4>Últimas ações</h4>${chips?`<div class="p131-chips">${chips}</div>`:''}<div class="p131-timeline">${items.length?items.map(x=>`<div><i></i><span><b>${esc(x.kind)}</b>${esc(String(x.label).slice(0,150))}</span><time>${new Date(x.t).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</time></div>`).join(''):'<div class="p131-empty">Ainda não há histórico suficiente para montar a linha do tempo.</div>'}</div>`;
}

function installAnalytics(){
  const content=$('#dossierContent'),id=selectedId();if(!content||!id)return;
  const sheet=$('.dossier-sheet',content);if(!sheet)return;
  let box=$('#p131DossierAnalytics');
  if(!box){box=document.createElement('section');box.id='p131DossierAnalytics';box.className='p131-analytics';const intro=sheet.querySelector('.p130-dossier-intro,.p130-dossier-summary,.dossier-intro');const head=sheet.querySelector('.dossier-head');(intro||head)?.insertAdjacentElement('afterend',box);if(!box.parentNode)sheet.prepend(box)}
  box.dataset.memberId=id;renderBase(id);renderHistory(id);
}

function css(){if($('#p131Style'))return;const s=document.createElement('style');s.id='p131Style';s.textContent=`
.p131-analytics{margin:18px 0 4px;border:1px solid #cfe1df;border-radius:20px;padding:16px;background:linear-gradient(145deg,#f8fcfb,#f5fafc);color:#173d4c}.p131-title{display:flex;gap:12px;align-items:flex-start;margin-bottom:13px}.p131-title>div:first-child{flex:1;min-width:0}.p131-title span{font-size:9px;font-weight:950;letter-spacing:.11em;color:#0d8c8e}.p131-title h3{margin:3px 0 3px;font:800 19px/1.1 'Space Grotesk','Inter',sans-serif}.p131-title p{margin:0;color:#6d8188;font-size:11px}.p131-last{text-align:right;min-width:128px}.p131-last small{display:block;color:#809197;font-size:9px}.p131-last b{display:block;font-size:10.5px;margin-top:3px}.p131-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.p131-stat{border:1px solid #dbe8e6;border-radius:16px;background:#fff;padding:11px;min-width:0}.p131-stat .p131-ico{font-size:18px}.p131-stat strong{display:block;font:900 24px/1 'Space Grotesk','Inter',sans-serif;color:#123c49;margin:5px 0 3px}.p131-stat b{display:block;font-size:10.5px;color:#294d59}.p131-stat small{display:block;font-size:8.8px;color:#7b8e94;margin-top:3px;line-height:1.25}.p131-columns{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}.p131-columns section{border:1px solid #dce8e6;border-radius:16px;background:#fff;padding:11px}.p131-columns h4,.p131-history h4{margin:0 0 7px;font-size:12px;color:#183c48}.p131-row{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #edf2f1;font-size:10.5px}.p131-row:last-child{border-bottom:0}.p131-row span{flex:1;min-width:0}.p131-row span small{display:block;color:#829197;font-size:8.5px;margin-top:2px}.p131-row b{font:900 14px 'Space Grotesk','Inter',sans-serif;color:#0f7f83}.p131-history{margin-top:10px;border:1px solid #dce8e6;border-radius:16px;background:#fff;padding:11px}.p131-chips{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:9px}.p131-chips span{font-size:8.5px;border-radius:999px;background:#edf7f4;color:#315c62;padding:4px 7px}.p131-chips b{color:#0b8588}.p131-timeline>div{display:grid;grid-template-columns:8px minmax(0,1fr) auto;gap:7px;align-items:start;padding:6px 0;border-bottom:1px solid #eef3f2;font-size:9.5px}.p131-timeline>div:last-child{border-bottom:0}.p131-timeline i{width:7px;height:7px;border-radius:50%;background:#17a0a0;margin-top:4px}.p131-timeline span b{display:block;font-size:8.5px;color:#6b8187;text-transform:uppercase;letter-spacing:.04em}.p131-timeline time{font-size:8.5px;color:#88999e;white-space:nowrap}.p131-loading,.p131-empty{font-size:10px;color:#7a8d93;padding:5px 0}.p131-note{margin-top:10px;font-size:8.8px;line-height:1.45;color:#75878c;background:#eef6f4;border-radius:11px;padding:8px 9px}
@media(max-width:620px){.p131-analytics{margin:14px 0 2px;padding:12px;border-radius:17px}.p131-title{display:block}.p131-last{text-align:left;margin-top:8px}.p131-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.p131-stat{padding:10px}.p131-stat strong{font-size:22px}.p131-columns{grid-template-columns:1fr}.p131-timeline>div{grid-template-columns:8px minmax(0,1fr)}.p131-timeline time{grid-column:2}.p131-title h3{font-size:18px}}
`;document.head.appendChild(s)}

function watch(){
  css();trackAccess();
  const d=$('#dossierContent');if(d){new MutationObserver(()=>{if($('#dossierOverlay')?.classList.contains('open'))setTimeout(installAnalytics,0)}).observe(d,{childList:true,subtree:false})}
  $('#dossierPerson')?.addEventListener('change',()=>setTimeout(installAnalytics,30));
  $('#dossierOverlay')&&new MutationObserver(()=>{if($('#dossierOverlay').classList.contains('open'))setTimeout(installAnalytics,40)}).observe($('#dossierOverlay'),{attributes:true,attributeFilter:['class']});
  setTimeout(()=>{if($('#dossierOverlay')?.classList.contains('open'))installAnalytics()},300);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch,{once:true});else watch();
window.addEventListener('firebase-ready',()=>{setTimeout(trackAccess,250);setTimeout(()=>{if($('#dossierOverlay')?.classList.contains('open'))installAnalytics()},500)},{once:true});
window.CARBONAUTAS_DOSSIER_ANALYTICS_BUILD=BUILD;
})();
