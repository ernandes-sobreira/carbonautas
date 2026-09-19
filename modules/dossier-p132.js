/* Carbonautas P133 · Dossiê gerencial por períodos.
   Mantém o dossiê isolado do núcleo do app, mostra datas reais e acompanha
   hoje/semana/mês sem inventar histórico anterior. */
(function(){
'use strict';
if(window.__CARBONAUTAS_DOSSIER_P132)return;
window.__CARBONAUTAS_DOSSIER_P132=true;
const BUILD='P133-DOSSIE-PERIODOS-20260919';
const TRACKING_START='19/09/2026';
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
function S(){try{return window.state||state||{}}catch(_e){return{}}}
function myIdSafe(){try{return window.myId||myId||''}catch(_e){return''}}
function member(id){try{return typeof window.memberById==='function'?window.memberById(id):(typeof memberById==='function'?memberById(id):null)}catch(_e){return null}}
function ms(v){if(!v)return 0;try{if(v.toMillis)return v.toMillis();if(v.toDate)return v.toDate().getTime()}catch(_e){} const n=Date.parse(v);return Number.isFinite(n)?n:0}
function dt(v){const n=ms(v);return n?new Date(n).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}):'—'}
function dmy(v){const n=ms(v);return n?new Date(n).toLocaleDateString('pt-BR'):'—'}
function keyDate(d=new Date()){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`}
function startToday(){const d=new Date();d.setHours(0,0,0,0);return d}
function startWeek(){const d=startToday(),dow=d.getDay()||7;d.setDate(d.getDate()-(dow-1));return d}
function startMonth(){const d=startToday();d.setDate(1);return d}
function shortDate(d){return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}
function rangeText(start,end=new Date()){const same=start.toDateString()===end.toDateString();return same?end.toLocaleDateString('pt-BR'):`${shortDate(start)}–${end.toLocaleDateString('pt-BR')}`}
function actionTime(x){return ms(x?.updatedAt)||ms(x?.createdAt)||ms(x?.ts)||ms(x?.uploadedAt)||0}
function selectedId(){return $('#dossierPerson')?.value||myIdSafe()||''}
function repoItems(id){try{return typeof window.memberRepositoryItems==='function'?(window.memberRepositoryItems(id)||[]):(typeof memberRepositoryItems==='function'?(memberRepositoryItems(id)||[]):[])}catch(_e){return[]}}
function cronoItems(id){try{const all=typeof window.buildCronoItems==='function'?(window.buildCronoItems()||[]):(typeof buildCronoItems==='function'?(buildCronoItems()||[]):[]);return all.filter(x=>x.ownerId===id||x.memberId===id)}catch(_e){return[]}}
function arrays(id){
 const st=S();
 const activities=(st.activities||[]).filter(x=>x.ownerId===id||x.memberId===id);
 const feed=(st.feed||[]).filter(x=>x.authorId===id||x.memberId===id);
 const comments=(st.comments||[]).filter(x=>x.authorId===id||x.memberId===id);
 const reactions=(st.reactions||[]).filter(x=>x.actorId===id||x.actorMemberId===id||x.memberId===id);
 const repo=repoItems(id), crono=cronoItems(id);
 return {activities,feed,comments,reactions,repo,crono};
}
function doneActivity(x){const s=String(x.status||'').toLowerCase();return Number(x.progress||0)>=100||['feito','done','concluido','concluído','finalizado','finalizada'].includes(s)}
function doneDeadline(x){return !!(x.feito||x.done||x.completed||String(x.status||'').toLowerCase()==='concluido')}
function dueMs(x){const raw=x.data||x.date||x.dueDate||x.deadline;if(!raw)return 0;const n=Date.parse(String(raw).slice(0,10)+'T23:59:59');return Number.isFinite(n)?n:ms(raw)}
function counts(id){
 const a=arrays(id),now=Date.now();
 const activitiesDone=a.activities.filter(doneActivity),activitiesPending=a.activities.filter(x=>!doneActivity(x));
 const deadlinesDone=a.crono.filter(doneDeadline),deadlinesPending=a.crono.filter(x=>!doneDeadline(x));
 const overdue=deadlinesPending.filter(x=>{const d=dueMs(x);return d&&d<now});
 const products=a.activities.filter(x=>String(x.type||'').toLowerCase()==='produto');
 const checkins=a.activities.filter(x=>String(x.type||'').toLowerCase().includes('check'));
 const orientations=a.activities.filter(x=>String(x.type||'').toLowerCase().includes('orient'));
 const corrections=a.activities.filter(x=>String(x.type||'').toLowerCase().includes('corre'));
 const files=a.repo.filter(x=>x.isFile||x.fileName||x.tipo==='arquivo');
 const publicInteractions=a.feed.length+a.comments.length+a.reactions.length;
 const actionTotal=a.activities.length+a.repo.length+a.feed.length+a.comments.length+a.reactions.length+a.crono.length;
 const all=[...a.activities,...a.repo,...a.feed,...a.comments,...a.reactions,...a.crono].map(x=>({x,t:actionTime(x)})).filter(z=>z.t).sort((p,q)=>q.t-p.t);
 return {...a,activitiesDone,activitiesPending,deadlinesDone,deadlinesPending,overdue,products,checkins,orientations,corrections,files,publicInteractions,actionTotal,lastAction:all[0]?.t||0};
}
function actionRows(c){return [...c.activities,...c.repo,...c.feed,...c.comments,...c.reactions,...c.crono].map(x=>({x,t:actionTime(x)})).filter(z=>z.t&&z.t<=Date.now())}
function countFrom(rows,start){const s=start.getTime();return rows.filter(z=>z.t>=s).length}
function accessBetween(m,start,end=new Date()){
 const map=(m&&m.accessByDay&&typeof m.accessByDay==='object')?m.accessByDay:{};
 const a=keyDate(start),b=keyDate(end);let total=0,known=false;
 Object.entries(map).forEach(([k,v])=>{if(k>=a&&k<=b){known=true;total+=Number(v||0)}});
 return known?total:null;
}
function periodCard(title,range,actions,accesses){return `<div class="p133-period"><div><b>${esc(title)}</b><small>${esc(range)}</small></div><strong>${Number(actions||0).toLocaleString('pt-BR')}</strong><span>ações</span><em>${accesses===null?'acessos começam a ser detalhados agora':`${Number(accesses||0).toLocaleString('pt-BR')} acesso(s)`}</em></div>`}
function card(icon,value,label,sub=''){return `<div class="p132-kpi"><span>${icon}</span><strong>${esc(value)}</strong><b>${esc(label)}</b>${sub?`<small>${esc(sub)}</small>`:''}</div>`}
function item(label,value,bad=false){return `<div class="p132-row"><span>${esc(label)}</span><b class="${bad?'bad':''}">${Number(value||0).toLocaleString('pt-BR')}</b></div>`}
function labelOf(x){return x.title||x.nome||x.name||x.text||x.fileName||x.label||x.descricao||x.description||'Ação registrada'}
function kindOf(x){if(x.fileName||x.tipo==='arquivo')return'Repositório';if(x.authorId)return'Participação';if(x.ownerId||x.memberId)return'Acompanhamento';return'Ação'}
function recent(c){
 const all=[...c.activities,...c.repo,...c.feed,...c.comments,...c.crono].map(x=>({t:actionTime(x),label:labelOf(x),kind:kindOf(x)})).filter(x=>x.t).sort((a,b)=>b.t-a.t);
 const seen=new Set();return all.filter(x=>{const k=x.kind+'|'+x.label+'|'+x.t;if(seen.has(k))return false;seen.add(k);return true}).slice(0,10);
}
function render(){
 try{
  const id=selectedId(),content=$('#dossierContent');if(!id||!content)return;
  const sheet=$('.dossier-sheet',content)||content.firstElementChild||content;if(!sheet)return;
  let box=$('#p132Manager',sheet);if(!box){box=document.createElement('section');box.id='p132Manager';box.className='p132-manager';const head=sheet.querySelector('.dossier-head');const intro=sheet.querySelector('.p130-dossier-intro,.dossier-intro');(intro||head||sheet.firstElementChild)?.insertAdjacentElement('afterend',box);if(!box.parentNode)sheet.prepend(box)}
  const m=member(id)||{},c=counts(id),rec=recent(c),rows=actionRows(c),now=new Date(),today=startToday(),week=startWeek(),month=startMonth();
  const accessCount=Number(m.accessCount||0),activeDays=Number(m.accessDaysCount||0);
  const accessTxt=accessCount?accessCount.toLocaleString('pt-BR'):'—',daysTxt=activeDays?activeDays.toLocaleString('pt-BR'):'—';
  const firstTracked=m.accessFirstTrackedAt?dmy(m.accessFirstTrackedAt):TRACKING_START;
  const todayAccess=accessBetween(m,today,now),weekAccess=accessBetween(m,week,now),monthAccess=accessBetween(m,month,now);
  const missing=[];
  if(c.overdue.length)missing.push(`${c.overdue.length} prazo(s) atrasado(s)`);
  if(c.deadlinesPending.length)missing.push(`${c.deadlinesPending.length} prazo(s) pendente(s)`);
  if(c.activitiesPending.length)missing.push(`${c.activitiesPending.length} acompanhamento(s) pendente(s)`);
  if(!c.products.length)missing.push('nenhum produto registrado');
  const done=[];
  if(c.activitiesDone.length)done.push(`${c.activitiesDone.length} acompanhamento(s) concluído(s)`);
  if(c.deadlinesDone.length)done.push(`${c.deadlinesDone.length} prazo(s) concluído(s)`);
  if(c.files.length)done.push(`${c.files.length} arquivo(s) no repositório`);
  if(c.checkins.length)done.push(`${c.checkins.length} check-in(s)`);
  box.innerHTML=`
   <div class="p132-head"><div><span>RAIO-X DO CARBONAUTA</span><h3>O que fez e o que falta</h3><p>Contabilidade individual baseada nos registros reais da plataforma.</p></div><div class="p132-last"><small>Última atividade registrada</small><b>${esc(dt(c.lastAction||m.lastSeenAt))}</b></div></div>
   <div class="p133-periods">
    ${periodCard('Hoje',rangeText(today,now),countFrom(rows,today),todayAccess)}
    ${periodCard('Esta semana',rangeText(week,now),countFrom(rows,week),weekAccess)}
    ${periodCard('Este mês',rangeText(month,now),countFrom(rows,month),monthAccess)}
    ${periodCard('Total registrado',`até ${now.toLocaleDateString('pt-BR')}`,c.actionTotal,accessCount||null)}
   </div>
   <div class="p132-kpis">
    ${card('🚪',accessTxt,'acessos',`medidos desde ${firstTracked}`)}
    ${card('📅',daysTxt,'dias ativos',`dias com acesso desde ${firstTracked}`)}
    ${card('⚡',c.actionTotal,'ações registradas',`atualizado em ${now.toLocaleDateString('pt-BR')}`)}
    ${card('📁',c.files.length,'arquivos enviados',`${c.repo.length} item(ns) no repositório`)}
    ${card('✅',c.deadlinesDone.length,'prazos cumpridos',`${c.deadlinesPending.length} pendente(s)`)}
    ${card('💬',c.publicInteractions,'interações públicas','mural, comentários e reações')}
   </div>
   <div class="p132-summary">
    <div class="p132-good"><h4>✓ O que foi feito</h4><p>${done.length?esc(done.join(' · ')):'Ainda não há entregas/conclusões suficientes registradas.'}</p></div>
    <div class="p132-bad"><h4>! O que falta</h4><p>${missing.length?esc(missing.join(' · ')):'Sem pendências detectadas nos registros disponíveis.'}</p></div>
   </div>
   <div class="p132-cols"><section><h4>Produção e acompanhamento</h4>${item('Acompanhamentos',c.activities.length)}${item('Concluídos',c.activitiesDone.length)}${item('Pendentes',c.activitiesPending.length,c.activitiesPending.length>0)}${item('Orientações',c.orientations.length)}${item('Correções',c.corrections.length)}${item('Check-ins',c.checkins.length)}${item('Produtos',c.products.length)}${item('Arquivos',c.files.length)}</section><section><h4>Prazos e participação</h4>${item('Prazos concluídos',c.deadlinesDone.length)}${item('Prazos pendentes',c.deadlinesPending.length,c.deadlinesPending.length>0)}${item('Prazos atrasados',c.overdue.length,c.overdue.length>0)}${item('Publicações no mural',c.feed.length)}${item('Comentários',c.comments.length)}${item('Reações',c.reactions.length)}${item('Interações públicas',c.publicInteractions)}</section></div>
   <div class="p132-history"><h4>Últimas ações registradas</h4>${rec.length?rec.map(x=>`<div><i></i><span><b>${esc(x.kind)}</b>${esc(String(x.label).slice(0,150))}</span><time>${esc(dt(x.t))}</time></div>`).join(''):'<p class="p132-empty">Ainda não há ações suficientes com data para montar o histórico.</p>'}</div>
   <p class="p132-note">A contagem precisa de acessos começou em ${firstTracked}. O sistema não estima acessos anteriores. Os blocos Hoje, Semana e Mês usam automaticamente a data atual. Conversas privadas não entram nesta contabilidade.</p>`;
 }catch(e){console.warn('P133 dossier render',e)}
}
function css(){if($('#p132Style'))return;const s=document.createElement('style');s.id='p132Style';s.textContent=`
.p132-manager{margin:16px 0;border:1px solid #d5e5e2;border-radius:20px;padding:14px;background:linear-gradient(145deg,#f9fcfb,#f5f9fb);color:#173d4b}.p132-head{display:flex;gap:12px;align-items:flex-start;margin-bottom:12px}.p132-head>div:first-child{flex:1}.p132-head span{font-size:9px;font-weight:950;letter-spacing:.12em;color:#0b8e91}.p132-head h3{margin:3px 0;font:900 20px/1.1 system-ui;color:#183b49}.p132-head p{margin:0;color:#71848a;font-size:11px}.p132-last{text-align:right;min-width:145px}.p132-last small{display:block;font-size:9px;color:#7b8d92}.p132-last b{font-size:10px}.p133-periods{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:0 0 9px}.p133-period{background:#123e4b;color:#fff;border-radius:15px;padding:10px;min-width:0}.p133-period>div{min-height:33px}.p133-period b{display:block;font-size:10px}.p133-period small{display:block;font-size:8px;color:#bed3d6;margin-top:2px}.p133-period strong{display:inline-block;font-size:22px;line-height:1;margin-top:6px}.p133-period span{font-size:9px;margin-left:3px;color:#d9e8ea}.p133-period em{display:block;font-style:normal;font-size:7.8px;color:#b8d0d3;margin-top:4px;line-height:1.25}.p132-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.p132-kpi{background:#fff;border:1px solid #dce8e6;border-radius:15px;padding:10px;min-width:0}.p132-kpi span{font-size:18px}.p132-kpi strong{display:block;margin:4px 0 2px;font-size:24px;line-height:1;font-weight:950;color:#123e4b}.p132-kpi b{display:block;font-size:10px}.p132-kpi small{display:block;font-size:8.5px;color:#7f9095;margin-top:3px;line-height:1.25}.p132-summary{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px}.p132-summary>div{border-radius:14px;padding:10px}.p132-summary h4{margin:0 0 4px;font-size:11px}.p132-summary p{margin:0;font-size:10px;line-height:1.4}.p132-good{background:#edf8f4;border:1px solid #cce8dc}.p132-good h4{color:#08785d}.p132-bad{background:#fff5f3;border:1px solid #f0d5cf}.p132-bad h4{color:#a34635}.p132-cols{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px}.p132-cols section,.p132-history{background:#fff;border:1px solid #dce8e6;border-radius:15px;padding:10px}.p132-cols h4,.p132-history h4{margin:0 0 6px;font-size:11px}.p132-row{display:flex;align-items:center;padding:5px 0;border-bottom:1px solid #edf2f1;font-size:10px}.p132-row:last-child{border-bottom:0}.p132-row span{flex:1}.p132-row b{font-size:13px;color:#0c8589}.p132-row b.bad{color:#b24c3b}.p132-history{margin-top:9px}.p132-history>div{display:grid;grid-template-columns:8px minmax(0,1fr) auto;gap:7px;padding:6px 0;border-bottom:1px solid #edf2f1;font-size:9.5px}.p132-history>div:last-child{border-bottom:0}.p132-history i{width:7px;height:7px;border-radius:50%;background:#15979a;margin-top:4px}.p132-history span b{display:block;font-size:8px;color:#72868b;text-transform:uppercase}.p132-history time{font-size:8px;color:#819297;white-space:nowrap}.p132-empty,.p132-note{font-size:9px;color:#77898e;line-height:1.45}.p132-note{margin:9px 2px 0}.p132-access-track{display:none!important}
#viewPainel .dash-hero-actions #dashDossierBtn{flex:1 0 100%;width:100%;justify-content:center;min-height:48px}
@media(max-width:620px){.p132-manager{padding:11px;border-radius:17px}.p132-head{display:block}.p132-last{text-align:left;margin-top:7px}.p133-periods{grid-template-columns:repeat(2,minmax(0,1fr))}.p132-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.p132-summary,.p132-cols{grid-template-columns:1fr}.p132-kpi strong{font-size:22px}.p132-history>div{grid-template-columns:7px minmax(0,1fr)}.p132-history time{grid-column:2}#viewPainel .dash-hero-actions{display:grid!important;grid-template-columns:1fr 1fr!important;width:100%!important}#viewPainel .dash-hero-actions #dashDossierBtn,#viewPainel .dash-hero-actions #dashBackupBtn{grid-column:1/-1!important;width:100%!important;justify-content:center!important}}
`;document.head.appendChild(s)}
async function trackOwnAccess(){
 try{
  const f=window.fbFns,id=myIdSafe();if(!f||!id||!window.db||!window.auth?.currentUser||!f.doc||!f.getDoc||!f.updateDoc)return;
  const key='carbonautas_p133_access_'+id,last=Number(localStorage.getItem(key)||0);if(Date.now()-last<30*60*1000)return;
  const ref=f.doc(window.db,'rede_members',id),snap=await f.getDoc(ref);if(!snap.exists())return;const cur=snap.data()||{},today=keyDate();
  const byDay=(cur.accessByDay&&typeof cur.accessByDay==='object')?{...cur.accessByDay}:{};byDay[today]=Number(byDay[today]||0)+1;
  Object.keys(byDay).sort().slice(0,Math.max(0,Object.keys(byDay).length-400)).forEach(k=>delete byDay[k]);
  const patch={accessCount:Number(cur.accessCount||0)+1,accessLastDay:today,lastSeenAt:new Date(),accessTrackingVersion:BUILD,accessByDay:byDay};
  if(cur.accessLastDay!==today)patch.accessDaysCount=Number(cur.accessDaysCount||0)+1;
  if(!cur.accessFirstTrackedAt)patch.accessFirstTrackedAt=new Date();
  await f.updateDoc(ref,patch);localStorage.setItem(key,String(Date.now()));
 }catch(e){console.warn('P133 acesso não contabilizado',e?.code||e?.message||e)}
}
function observe(){
 css();
 const body=document.body;if(!body)return;
 let timer=0;const schedule=()=>{clearTimeout(timer);timer=setTimeout(render,80)};
 new MutationObserver(muts=>{if(muts.some(m=>[...m.addedNodes].some(n=>n.nodeType===1&&(n.id==='dossierOverlay'||n.id==='dossierContent'||n.querySelector?.('#dossierContent')))))schedule()}).observe(body,{childList:true,subtree:true});
 document.addEventListener('change',e=>{if(e.target?.id==='dossierPerson')schedule()},true);
 document.addEventListener('click',e=>{const t=e.target?.closest?.('#dashDossierBtn,#trackDossierBtn,[data-open-dossier],button');if(t&&(/dossi/i.test(t.textContent||'')||t.id==='dashDossierBtn'||t.id==='trackDossierBtn'))setTimeout(render,160)},true);
 setInterval(()=>{const o=$('#dossierOverlay');if(o&&(o.classList.contains('show')||getComputedStyle(o).display!=='none'))render()},30000);
 setTimeout(trackOwnAccess,3500);
 window.addEventListener('firebase-ready',()=>setTimeout(trackOwnAccess,1000),{once:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe,{once:true});else observe();
window.CARBONAUTAS_DOSSIER_BUILD=BUILD;
})();