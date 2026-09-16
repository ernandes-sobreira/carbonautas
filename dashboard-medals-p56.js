/* Carbonautas P56 · Painel acionável + medalhas com métrica 0–100 */
(function(){
'use strict';
const VERSION='P56';

function p56Norm(v=''){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
function p56Millis(v){
  if(!v)return 0;
  if(typeof v?.toMillis==='function')return v.toMillis();
  if(v instanceof Date)return v.getTime();
  const n=+new Date(v);return Number.isFinite(n)?n:0;
}
function p56MonthFromMillis(ms){if(!ms)return'';const d=new Date(ms);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
function p56DateTime(ms){if(!ms)return'';return new Date(ms).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}
function p56ActorKey(){
  try{return String(window.auth?.currentUser?.uid||myId||'anon')}catch(_e){return 'anon'}
}
function p56AckStorageKey(){return `carbonautas_p56_panel_done_${p56ActorKey()}`}
function p56LoadAcks(){try{return JSON.parse(localStorage.getItem(p56AckStorageKey())||'{}')||{}}catch(_e){return{}}}
function p56SaveAcks(v){try{localStorage.setItem(p56AckStorageKey(),JSON.stringify(v||{}))}catch(_e){}}
function p56SetAck(key,meta={}){
  const all=p56LoadAcks();all[key]={...meta,key,doneAt:Date.now(),doneBy:(typeof myName!=='undefined'&&myName)||memberById?.(myId)?.nome||'Você'};p56SaveAcks(all);return all[key];
}
function p56UnsetAck(key){const all=p56LoadAcks();delete all[key];p56SaveAcks(all)}
function p56IsAck(key){return !!p56LoadAcks()[key]}
function p56Scope(){
  try{return isAdmin?state.members.filter(m=>m.status!=='egresso'):state.members.filter(m=>m.id===myId)}catch(_e){return[]}
}
function p56MemberName(id){try{return memberById(id)?.nome||'Carbonauta'}catch(_e){return'Carbonauta'}}
function p56ActivityLabel(a){
  const type=(typeof ACTIVITY_TYPES!=='undefined'&&ACTIVITY_TYPES[a?.type])||a?.type||'Acompanhamento';
  return a?.title||type;
}
function p56ActivityKind(a){
  if(a?.type==='correcao')return 'CORREÇÃO · ACOMPANHAMENTO';
  if(a?.type==='pendencia')return 'PENDÊNCIA · ACOMPANHAMENTO';
  if(a?.type==='produto')return 'PRODUTO · ACOMPANHAMENTO';
  return 'PRAZO · ACOMPANHAMENTO';
}
function p56BuildItems(){
  const scope=p56Scope(),ids=new Set(scope.map(m=>m.id)),open=[],done=[];
  const mk=monthKey();
  const acks=p56LoadAcks();

  // Ações reais do acompanhamento: uma linha por tarefa, nunca resumo genérico.
  (state.activities||[]).filter(a=>ids.has(a.ownerId)).forEach(a=>{
    const isDone=_activityDone(a),di=a.dueDate?dateInfo(a.dueDate):null;
    const isCorr=a.type==='correcao';
    const relevant=!isDone && (isCorr || (di&&(di.over||(di.diff>=0&&di.diff<=7))));
    const updated=p56Millis(a.updatedAt)||p56Millis(a.createdAt);
    if(relevant){
      const sev=di?.over||((di?.diff??99)<=2)?'critical':'warn';
      let detail=isCorr&&!a.dueDate?'Correção aberta.':di?.over?`Venceu em ${fmtDate(a.dueDate)}.`:di?`Vence ${di.diff===0?'hoje':`em ${di.diff} dia(s)`} · ${fmtDate(a.dueDate)}.`:'Requer acompanhamento.';
      open.push({key:`activity:${a.id}`,kind:p56ActivityKind(a),who:p56MemberName(a.ownerId),what:p56ActivityLabel(a),detail,date:a.dueDate||'',sev,sort:sev==='critical'?0:3,action:'activity',sourceId:a.id,memberId:a.ownerId,canComplete:true});
    }
    if(isDone && p56MonthFromMillis(updated)===mk){
      done.push({key:`doneactivity:${a.id}`,kind:`✓ ${(typeof ACTIVITY_TYPES!=='undefined'&&ACTIVITY_TYPES[a.type])||a.type||'Acompanhamento'}`,who:p56MemberName(a.ownerId),what:p56ActivityLabel(a),doneAt:updated,sourceId:a.id,memberId:a.ownerId,backendDone:true});
    }
  });

  // Correções do Repositório em que o usuário logado realmente precisa agir.
  try{
    const byThread=new Map();
    (state.publicacoes||[]).filter(p=>p.reviewFlow&&typeof canActOnReview==='function'&&canActOnReview(p)).forEach(p=>{
      const tid=(typeof repoReviewThreadId==='function'&&repoReviewThreadId(p))||p.reviewThreadId||p.id;
      const old=byThread.get(tid);if(!old||Number(p.reviewVersion||1)>Number(old.reviewVersion||1))byThread.set(tid,p);
    });
    byThread.forEach((p,tid)=>{
      const key=`review:${tid}`;if(p56IsAck(key))return;
      const act=(typeof reviewActionLabel==='function'?reviewActionLabel(p):'Revisar arquivo');
      open.push({key,kind:'CORREÇÃO · REPOSITÓRIO',who:p.memberNome||p.reviewSenderName||p56MemberName(p.memberId),what:p.reviewBaseTitle||p.titulo||p.fileName||'Arquivo para correção',detail:`${act} · versão ${Number(p.reviewVersion||1)}.`,date:'',sev:'critical',sort:.5,action:'review',sourceId:p.id,memberId:p.memberId,canAck:true});
    });
  }catch(_e){}

  // Bolsa perto do fim: aviso tratável, não uma falsa conclusão acadêmica.
  scope.forEach(m=>{
    if(m.bolsista&&m.bolsaFim){
      const pi=trackPeriodInfo(m.bolsaInicio,m.bolsaFim);
      if(pi.days!==null&&pi.days>=0&&pi.days<=45){
        const key=`bolsa:${m.id}:${m.bolsaFim}`;
        if(!p56IsAck(key))open.push({key,kind:'BOLSA · ATENÇÃO',who:m.nome,what:m.bolsaModalidade||'Bolsa em encerramento',detail:`Termina em ${_daysText(pi.days)} · ${fmtDate(m.bolsaFim)}.`,date:m.bolsaFim,sev:pi.days<=15?'critical':'warn',sort:2.5,action:'member',memberId:m.id,canAck:true});
      }
    }
    const acts=(state.activities||[]).filter(a=>a.ownerId===m.id);
    const check=acts.find(a=>a.type==='checkin'&&a.checkinMonth===mk);
    if(m.status!=='egresso'&&!check){
      open.push({key:`checkin:${m.id}:${mk}`,kind:'CHECK-IN · MÊS',who:m.nome,what:`Check-in de ${monthLabel(mk)}`,detail:'Registrar o que foi feito, dificuldades e próximo passo.',date:'',sev:'warn',sort:4,action:'checkin',memberId:m.id,canAck:false});
    } else if(check && (check.ownerId===myId || isAdmin)){
      const ms=p56Millis(check.updatedAt)||p56Millis(check.createdAt);
      if(p56MonthFromMillis(ms)===mk)done.push({key:`donecheckin:${check.id}`,kind:'✓ CHECK-IN',who:m.nome,what:`Check-in de ${monthLabel(mk)}`,doneAt:ms,backendDone:true});
    }
  });

  // Itens marcados manualmente como tratados continuam visíveis em Feitos.
  Object.values(acks).forEach(a=>{
    if(!a||!a.key)return;
    done.push({key:a.key,kind:`✓ ${a.kind||'TRATADO'}`,who:a.who||'—',what:a.what||'Item tratado',doneAt:+a.doneAt||0,localAck:true});
  });

  // evita duplicar o mesmo concluído quando houver cache local + conclusão real
  const seen=new Set();
  const cleanDone=done.sort((a,b)=>(b.doneAt||0)-(a.doneAt||0)).filter(x=>{const k=`${x.kind}|${x.who}|${x.what}|${x.sourceId||x.key}`;if(seen.has(k))return false;seen.add(k);return true}).slice(0,30);
  open.sort((a,b)=>a.sort-b.sort||(a.date||'9999').localeCompare(b.date||'9999'));
  return {open,done:cleanDone};
}

function p56OpenItem(key){
  const {open}=p56BuildItems(),it=open.find(x=>x.key===key);if(!it)return;
  try{
    if(it.action==='activity'){editActivity(it.sourceId);return}
    if(it.action==='review'){switchView('pubs');setTimeout(()=>openReviewConversation(it.sourceId),120);return}
    if(it.action==='checkin'){openCheckin(it.memberId);return}
    focusMemberTrack(it.memberId);
  }catch(e){console.warn('P56 abrir item',e)}
}
async function p56CompleteActivity(id){
  const a=(state.activities||[]).find(x=>x.id===id);if(!a)return toast('Item não encontrado.');
  if(_activityDone(a))return toast('Este item já está concluído.');
  if(!(isAdmin||isMe(a.ownerId)))return toast('Você não pode concluir este item.');
  if(!confirm(`Marcar como concluído?\n\n${p56ActivityLabel(a)}`))return;
  try{
    const f=FB();
    await f.updateDoc(f.doc(window.db,'rede_activities',id),{status:'concluido',updatedAt:f.serverTimestamp()});
    try{await awardPoints(a.ownerId,'activity_completed',id,p56ActivityLabel(a));if(a.dueDate)await awardPoints(a.ownerId,'deadline_done',id,p56ActivityLabel(a))}catch(_e){}
    toast('✓ Concluído. O item foi para Feitos.');
    setTimeout(()=>renderPainel(),120);
  }catch(e){console.error(e);toast('Não foi possível concluir este item.')}
}
function p56AckItem(key){
  const {open}=p56BuildItems(),it=open.find(x=>x.key===key);if(!it)return;
  p56SetAck(key,{kind:it.kind,who:it.who,what:it.what,memberId:it.memberId||'',sourceId:it.sourceId||''});
  renderPainel();toast('✓ Marcado como tratado.');
}
function p56UndoAck(key){p56UnsetAck(key);renderPainel();toast('Item voltou para a lista de atenção.')}

function p56ItemHTML(it){
  const tag=it.kind.split('·')[0].trim();
  return `<div class="p56-task ${it.sev==='critical'?'critical':'warn'}">
    <div class="p56-task-main">
      <div class="p56-task-top"><span class="p56-source">${esc(tag)}</span>${it.date?`<span class="p56-date">${esc(fmtDate(it.date))}</span>`:''}</div>
      <div class="p56-who">${esc(it.who)}</div>
      <div class="p56-what">${esc(it.what)}</div>
      <div class="p56-detail">${esc(it.detail||'')}</div>
    </div>
    <div class="p56-task-actions">
      <button type="button" class="btn" onclick="p56OpenItem('${esc(it.key)}')">Abrir</button>
      ${it.canComplete?`<button type="button" class="btn p56-done-btn" onclick="p56CompleteActivity('${esc(it.sourceId)}')">✓ Concluir</button>`:''}
      ${it.canAck?`<button type="button" class="btn p56-done-btn" onclick="p56AckItem('${esc(it.key)}')">✓ Já tratei</button>`:''}
    </div>
  </div>`;
}
function p56DoneHTML(it){
  return `<div class="p56-done-row"><span class="p56-check">✓</span><div class="p56-done-main"><b>${esc(it.who)}</b><span>${esc(it.what)}</span><small>${it.doneAt?p56DateTime(it.doneAt):'Concluído'}</small></div>${it.localAck?`<button type="button" class="p56-undo" onclick="p56UndoAck('${esc(it.key)}')">desfazer check</button>`:''}</div>`;
}
function p56RenderPanel(){
  if(!$('#dashKpis'))return;
  const {open,done}=p56BuildItems();
  const now=open.filter(x=>x.sev==='critical');
  const week=open.filter(x=>x.sev!=='critical');
  const overdue=open.filter(x=>x.action==='activity'&&x.date&&dateInfo(x.date)?.over).length;
  const redPeople=p56Scope().filter(m=>memberHealth(m).level==='red').length;
  $('#dashGreeting').textContent='Aqui ficam somente coisas que pedem uma ação. Abra o item certo e marque ✓ quando resolver.';
  $('#dashKpis').innerHTML=`<div class="dash-kpi ${open.length?'warn':'good'}"><div class="k-n">${open.length}</div><div class="k-l">precisam de ação</div></div><div class="dash-kpi ${overdue?'bad':'good'}"><div class="k-n">${overdue}</div><div class="k-l">vencidos</div></div><div class="dash-kpi ${week.length?'warn':'good'}"><div class="k-n">${week.length}</div><div class="k-l">esta semana</div></div><div class="dash-kpi good"><div class="k-n">${done.length}</div><div class="k-l">feitos / tratados</div></div><div class="dash-kpi ${redPeople?'bad':'good'}"><div class="k-n">${redPeople}</div><div class="k-l">pessoas em intervenção</div></div>`;
  $('#dashAttention').innerHTML=`
    <div class="p56-panel-section"><div class="p56-section-head"><b>🔥 Precisa de você</b><span>${now.length}</span></div>${now.length?now.map(p56ItemHTML).join(''):'<div class="dash-empty">Nada urgente agora.</div>'}</div>
    <div class="p56-panel-section"><div class="p56-section-head"><b>🗓 Esta semana</b><span>${week.length}</span></div>${week.length?week.map(p56ItemHTML).join(''):'<div class="dash-empty">Nenhuma ação próxima.</div>'}</div>
    <details class="p56-done-box" ${done.length<=6?'open':''}><summary>✓ Feitos / tratados <span>${done.length}</span></summary><div class="p56-done-list">${done.length?done.map(p56DoneHTML).join(''):'<div class="dash-empty">Nenhum item concluído ainda.</div>'}</div></details>`;

  // Mantém as partes úteis do painel antigo, mas com nomes mais claros.
  const scope=p56Scope();
  $('#dashHealth').innerHTML=scope.length?scope.map(m=>{const h=memberHealth(m);return `<div class="health-row" onclick="focusMemberTrack('${m.id}')" style="cursor:pointer"><span class="health-dot ${h.level}"></span><div class="health-person"><b>${esc(m.nome)}</b><span>${esc(h.reasons.slice(0,2).join(' · '))}</span></div><span class="health-score">${h.level==='green'?'Em dia':h.level==='yellow'?'Atenção':'Intervir'}</span></div>`}).join(''):'<div class="dash-empty">Sem pessoas neste recorte.</div>';
  const mk=monthKey(),target=isAdmin?(memberById(myId)||scope[0]):memberById(myId),myCheck=target&&(state.activities||[]).find(a=>a.ownerId===target.id&&a.type==='checkin'&&a.checkinMonth===mk);
  $('#dashCheckin').innerHTML=target?`<div class="checkin-spot"><div class="checkin-month">${esc(monthLabel(mk))}</div><div class="checkin-title">${myCheck?'✅ Check-in preenchido':'Check-in ainda pendente'}</div><div class="checkin-note">${myCheck?esc((myCheck.checkinNext||myCheck.description||'Registrado.').slice(0,180)):'Ao preencher, o Painel reconhece automaticamente como feito.'}</div><div class="checkin-actions"><button class="btn primary" onclick="openCheckin('${target.id}')">${myCheck?'Ver / atualizar':'Preencher agora'}</button></div></div>`:'<div class="dash-empty">Vincule seu perfil para usar o check-in.</div>';
  const prods=(state.activities||[]).filter(a=>a.type==='produto'&&scope.some(m=>m.id===a.ownerId)).sort((a,b)=>_activityTime(b)-_activityTime(a)).slice(0,5);
  $('#dashProducts').innerHTML=prods.length?prods.map(a=>`<div class="product-mini"><span class="product-type">🎯</span><div class="product-main"><b>${esc(a.title||'Produto')}</b><span>${esc(a.ownerName||p56MemberName(a.ownerId))}${a.dueDate?' · '+fmtDate(a.dueDate):''}</span></div><span class="product-status">${esc(ACTIVITY_STATUS[a.status]||a.status||'')}</span></div>`).join(''):'<div class="dash-empty">Nenhum produto registrado ainda.</div>';
  $('#dashBackupBtn')?.style.setProperty('display',isAdmin?'inline-flex':'none');
  p56UpdateAttentionBadge();
}
function p56UpdateAttentionBadge(){const b=$('#attentionBadge');if(!b)return;const n=p56BuildItems().open.filter(x=>x.sev==='critical').length;b.textContent=n>9?'9+':String(n);b.style.display=n?'grid':'none'}

// ================= MEDALHAS: MÉTRICA 0–100 =================
function p56UniqueCount(points,action){return new Set((points||[]).filter(p=>p.action===action).map(p=>String(p.sourceId||p.id||Math.random()))).size}
function p56CorrectionDoneCount(points,memberId){
  const ids=new Set((points||[]).filter(p=>p.memberId===memberId&&p.action==='activity_completed').map(p=>String(p.sourceId||'')));
  let n=0;ids.forEach(id=>{const a=(state.activities||[]).find(x=>String(x.id)===id);if(a?.type==='correcao')n++});return n;
}
function p56MetricFor(member,points,mk){
  const mine=(points||[]).filter(p=>p.memberId===member.id);
  const completed=p56UniqueCount(mine,'activity_completed');
  const deadline=p56UniqueCount(mine,'deadline_done');
  const pubs=p56UniqueCount(mine,'publication');
  const products=p56UniqueCount(mine,'product');
  const help=p56UniqueCount(mine,'help_post');
  const check=p56UniqueCount(mine,'checkin');
  const packages=p56UniqueCount(mine,'repo_package');
  const corrections=p56CorrectionDoneCount(mine,member.id);
  const delivery=Math.min(40,Math.min(24,completed*8)+Math.min(16,deadline*8));
  const production=Math.min(30,Math.min(20,pubs*10)+Math.min(10,products*5));
  const collaboration=Math.min(20,Math.min(16,help*8)+Math.min(8,corrections*4));
  const organization=Math.min(10,Math.min(5,check*5)+Math.min(2,packages*2)+Math.min(3,deadline));
  const score=delivery+production+collaboration+organization;
  const current=mk===monthKey();
  const critical=current?(state.activities||[]).filter(a=>a.ownerId===member.id&&_isOverdue(a)).length:0;
  let medal='Em progresso',icon='🌱',next=50;
  if(score>=95&&critical===0){medal='Carbonauta Topizera';icon='💎';next=100}
  else if(score>=85){medal='Ouro';icon='🥇';next=critical&&score>=95?95:95}
  else if(score>=70){medal='Prata';icon='🥈';next=85}
  else if(score>=50){medal='Bronze';icon='🥉';next=70}
  return {memberId:member.id,name:member.nome||'Carbonauta',score,delivery,production,collaboration,organization,critical,medal,icon,next,events:mine.length};
}
function p56ScoreRules(){
  const host=$('#scoreRules');if(!host)return;
  host.innerHTML=`
    <div class="p56-rule"><span>🎯 Entrega</span><b>40 pts</b><small>Tarefas concluídas e prazos cumpridos</small></div>
    <div class="p56-rule"><span>🔬 Produção</span><b>30 pts</b><small>Publicações/arquivos científicos e produtos</small></div>
    <div class="p56-rule"><span>🤝 Colaboração</span><b>20 pts</b><small>Ajuda útil e correções concluídas</small></div>
    <div class="p56-rule"><span>🧭 Organização</span><b>10 pts</b><small>Check-in, repositório e prazos</small></div>
    <div class="p56-thresholds"><b>🥉 50</b><b>🥈 70</b><b>🥇 85</b><b>💎 95</b></div>
    <p class="p56-rule-note">Jogo, acesso, fotos, reações, mensagens e posts comuns <b>não contam</b>. Cada dimensão tem teto mensal, então quantidade não vence qualidade. 💎 exige também zero atraso crítico no mês atual.</p>`;
}
function p56Meter(label,val,max,cls){return `<div class="p56-meter"><div><span>${label}</span><b>${val}/${max}</b></div><i><em class="${cls}" style="width:${Math.min(100,val/max*100)}%"></em></i></div>`}
function p56PersonCard(r,pos){
  const posIcon=['🥇','🥈','🥉'][pos]||`${pos+1}º`;
  const missing=Math.max(0,(r.next||100)-r.score);
  return `<div class="p56-rank-card ${pos===0?'first':''}">
    <div class="p56-rank-head"><span class="p56-pos">${posIcon}</span><div><b>${esc(r.name)}</b><small>${r.icon} ${esc(r.medal)}</small></div><strong>${r.score}<small>/100</small></strong></div>
    <div class="p56-mini-meters">${p56Meter('Entrega',r.delivery,40,'d')}${p56Meter('Produção',r.production,30,'p')}${p56Meter('Colaboração',r.collaboration,20,'c')}${p56Meter('Organização',r.organization,10,'o')}</div>
    <div class="p56-next">${r.score>=95&&r.critical===0?'💎 Meta máxima atingida':r.critical&&r.score>=95?`⚠️ ${r.critical} atraso(s) crítico(s) impedem 💎`:`Faltam ${missing} ponto(s) para a próxima medalha`}</div>
  </div>`;
}
function p56RenderMedals(points){
  const board=$('#medalBoard');if(!board)return;
  const mk=medalMonthKey();
  const members=(state.members||[]).filter(m=>m.nivel!=='coord'&&m.status!=='egresso'&&m.status!=='inativo');
  const rank=members.map(m=>p56MetricFor(m,points,mk)).filter(r=>r.score>0||r.events>0).sort((a,b)=>b.score-a.score||b.delivery-a.delivery||a.name.localeCompare(b.name,'pt-BR'));
  const final=isPastMedalMonth(mk);
  $('#medalMonth').textContent=medalMonthLabel();$('#medalNext').disabled=mk>=monthKey();
  $('#medalStatus').textContent=final?'🏁 Resultado final · métrica 0–100':'⏱ Mês em andamento · métrica 0–100';
  const hero=document.querySelector('.medal-hero p');if(hero)hero.textContent='Mérito acadêmico mensal, com teto por dimensão. Uso da plataforma sozinho não gera medalha.';
  const sub=document.querySelector('#viewMedalhas .medal-card .medal-sub');if(sub)sub.textContent='Ranking por desempenho acadêmico normalizado, não por quantidade de cliques.';
  if(!rank.length){board.innerHTML='<div class="ag-empty">Ainda não há ações acadêmicas válidas para a métrica deste mês.</div>';p56ScoreRules();return}
  const top=rank.slice(0,3);
  const medalists=rank.filter(r=>r.score>=50);
  board.innerHTML=`<div class="p56-medal-summary"><b>${medalists.length} medalhista${medalists.length===1?'':'s'} no mês</b><span>${rank.length} Carbonauta${rank.length===1?'':'s'} com pontuação válida</span></div><div class="p56-top-grid">${top.map((r,i)=>p56PersonCard(r,i)).join('')}</div>${rank.length>3?`<div class="p56-rank-list">${rank.slice(3).map((r,i)=>p56PersonCard(r,i+3)).join('')}</div>`:''}`;
  p56ScoreRules();
}

function p56Css(){
  if(document.getElementById('p56Style'))return;
  const s=document.createElement('style');s.id='p56Style';s.textContent=`
  /* Painel P56 */
  #dashAttention{display:flex!important;flex-direction:column!important;gap:14px!important}
  .p56-panel-section{display:flex;flex-direction:column;gap:8px}.p56-section-head{display:flex;align-items:center;justify-content:space-between;padding:2px 2px 5px;font-size:13px}.p56-section-head span{min-width:25px;height:25px;border-radius:999px;background:#eef4f6;display:grid;place-items:center;font-weight:900;color:#34515c}
  .p56-task{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;border:1px solid #dbe6e9;border-left:5px solid #e2a12e;border-radius:15px;background:#fff;padding:12px 13px;box-shadow:0 3px 12px rgba(9,46,58,.035)}.p56-task.critical{border-left-color:#ef405f;background:#fffafb}.p56-task-top{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:5px}.p56-source{font-size:9.5px;letter-spacing:.05em;font-weight:950;border-radius:999px;padding:4px 7px;background:#eef5f7;color:#32525f}.p56-date{font-size:10px;color:#7d9098;font-weight:800}.p56-who{font-size:11px;color:#607781;font-weight:800}.p56-what{font-size:13.5px;font-weight:900;color:#17313d;margin-top:2px}.p56-detail{font-size:11.5px;color:#5d717a;margin-top:3px;line-height:1.4}.p56-task-actions{display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end}.p56-task-actions .btn{height:36px;padding:0 10px;font-size:11px}.p56-done-btn{background:#eaf8f1!important;border-color:#a9ddc2!important;color:#176d49!important}
  .p56-done-box{border:1px solid #dbe7e5;border-radius:15px;background:#f9fcfb;overflow:hidden}.p56-done-box summary{cursor:pointer;padding:11px 13px;font-size:12.5px;font-weight:900;color:#2b6250;display:flex;gap:8px;align-items:center}.p56-done-box summary span{margin-left:auto}.p56-done-list{padding:0 11px 11px;display:flex;flex-direction:column;gap:6px}.p56-done-row{display:grid;grid-template-columns:28px minmax(0,1fr) auto;align-items:center;gap:8px;padding:8px 9px;border-radius:11px;background:#fff;border:1px solid #e3ece9}.p56-check{width:25px;height:25px;border-radius:8px;background:#dff5e8;color:#147347;display:grid;place-items:center;font-weight:950}.p56-done-main{min-width:0}.p56-done-main b{display:block;font-size:11px}.p56-done-main span{display:block;font-size:11.5px;color:#4d646d;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.p56-done-main small{font-size:9.5px;color:#8a9aa0}.p56-undo{border:0;background:transparent;color:#698088;font-size:9.5px;text-decoration:underline;cursor:pointer}
  /* Medalhas P56 */
  .p56-medal-summary{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:10px 12px;border-radius:13px;background:#f2f8fa;margin-bottom:10px}.p56-medal-summary b{font-size:13px}.p56-medal-summary span{font-size:10.5px;color:#71858e}.p56-top-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;align-items:stretch}.p56-rank-list{display:grid;grid-template-columns:1fr;gap:7px;margin-top:10px}.p56-rank-card{border:1px solid #dce6ea;border-radius:15px;background:#fff;padding:11px}.p56-rank-card.first{background:linear-gradient(180deg,#fffbea,#fff);border-color:#ead58c}.p56-rank-head{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:8px;align-items:center}.p56-pos{font-size:22px}.p56-rank-head b{display:block;font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.p56-rank-head small{display:block;font-size:9.5px;color:#71838c;margin-top:2px}.p56-rank-head>strong{font:900 22px/1 'Space Grotesk';color:#103b49}.p56-rank-head>strong small{display:inline;font-size:9px;margin:0 0 0 1px}.p56-mini-meters{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px}.p56-meter>div{display:flex;justify-content:space-between;font-size:8.5px;color:#71838b;font-weight:800}.p56-meter i{display:block;height:5px;border-radius:999px;background:#edf2f4;overflow:hidden;margin-top:3px}.p56-meter em{display:block;height:100%;border-radius:999px}.p56-meter em.d{background:#11a683}.p56-meter em.p{background:#4e72e8}.p56-meter em.c{background:#8a58db}.p56-meter em.o{background:#e7a130}.p56-next{margin-top:8px;font-size:9.5px;color:#61747c;font-weight:700}.p56-rule{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:2px 8px;padding:9px 10px;border-radius:12px;background:#f5f8fa;margin-bottom:7px}.p56-rule span,.p56-rule b{font-size:11px;font-weight:900}.p56-rule small{grid-column:1/-1;color:#70828b;font-size:9.5px}.p56-thresholds{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin:10px 0}.p56-thresholds b{text-align:center;padding:7px 4px;border:1px solid #dde6ea;border-radius:10px;background:#fff;font-size:10px}.p56-rule-note{font-size:10px;line-height:1.45;color:#657880;margin:8px 0 0}
  @media(max-width:900px){.p56-top-grid{grid-template-columns:1fr}.p56-task{grid-template-columns:1fr}.p56-task-actions{justify-content:flex-start}.p56-mini-meters{grid-template-columns:1fr 1fr}}
  @media(max-width:620px){.p56-task-actions{display:grid;grid-template-columns:1fr 1fr}.p56-task-actions .btn{width:100%;justify-content:center}.p56-done-row{grid-template-columns:26px minmax(0,1fr)}.p56-undo{grid-column:2;text-align:left;padding:0}.p56-medal-summary{align-items:flex-start;flex-direction:column}.p56-thresholds{grid-template-columns:1fr 1fr}}
  `;document.head.appendChild(s);
}
function p56Boot(){
  p56Css();
  try{renderPainel=p56RenderPanel;window.renderPainel=p56RenderPanel}catch(_e){}
  try{renderMedalsFrom=p56RenderMedals;window.renderMedalsFrom=p56RenderMedals}catch(_e){}
  try{renderScoreRules=p56ScoreRules;window.renderScoreRules=p56ScoreRules}catch(_e){}
  try{updateAttentionBadge=p56UpdateAttentionBadge;window.updateAttentionBadge=p56UpdateAttentionBadge}catch(_e){}
  window.p56OpenItem=p56OpenItem;window.p56CompleteActivity=p56CompleteActivity;window.p56AckItem=p56AckItem;window.p56UndoAck=p56UndoAck;
  setTimeout(()=>{try{if(typeof currentView!=='undefined'&&currentView==='painel')p56RenderPanel();if(typeof currentView!=='undefined'&&currentView==='medalhas')renderMedals()}catch(_e){}},700);
  setTimeout(()=>{try{if(typeof currentView!=='undefined'&&currentView==='medalhas')renderMedals()}catch(_e){}},2200);
  console.info('Carbonautas painel + medalhas',VERSION,'carregado');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',p56Boot,{once:true});else p56Boot();
})();
