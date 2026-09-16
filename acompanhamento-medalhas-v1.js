/* Carbonautas · Acompanhamento + Medalhas de mérito · P41 · 2026-09-16 */
(function(){
'use strict';
const VERSION='P41';
const MIN_MEDAL_POINTS=10;
let patched=false;

function q(id){return document.getElementById(id)}
function say(msg){try{if(typeof toast==='function')toast(msg);else console.info(msg)}catch(_e){console.info(msg)}}
function currentTrackMemberId(){return q('trackOwner')?.value||''}
function activeMembers(){
  try{return [...(state?.members||[])].filter(m=>m.status!=='egresso').sort((a,b)=>(a.nome||'').localeCompare(b.nome||'','pt-BR'))}catch(_e){return[]}
}
function renderTrackSafe(){try{if(typeof renderTrack==='function')renderTrack()}catch(e){console.warn('P41 renderTrack',e)}}
function scrollTrackTop(){setTimeout(()=>{try{q('viewTrack')?.querySelector('.track-scroll')?.scrollTo({top:0,behavior:'smooth'})}catch(_e){}},30)}
function showAllTrack(){
  const owner=q('trackOwner'),mine=q('trackMine');
  if(owner)owner.value='';
  if(mine)mine.checked=false;
  renderTrackSafe();scrollTrackTop();
}
function changeTrackPerson(step){
  const owner=q('trackOwner');if(!owner)return;
  const list=activeMembers();if(!list.length)return;
  if(q('trackMine'))q('trackMine').checked=false;
  const cur=owner.value;
  let i=list.findIndex(m=>m.id===cur);
  if(i<0)i=step>0?-1:0;
  i=(i+step+list.length)%list.length;
  owner.value=list[i].id;
  renderTrackSafe();scrollTrackTop();
}
function editScholar(memberId){
  const id=memberId||currentTrackMemberId();
  if(!id){say('Escolha um Carbonauta para editar a bolsa.');return}
  try{
    if(typeof openMember!=='function'){say('A edição do cadastro não está disponível.');return}
    openMember(id);
    setTimeout(()=>{
      const box=q('mBolsaInicio')?.closest('.grid2')||q('mBolsaInicio')?.parentElement;
      if(box){box.scrollIntoView({behavior:'smooth',block:'center'});box.style.outline='3px solid #FFC857';box.style.borderRadius='12px';setTimeout(()=>box.style.outline='',2400)}
      q('mBolsaInicio')?.focus();
    },180);
  }catch(e){console.warn('P41 editScholar',e);say('Não consegui abrir a edição da bolsa.')}
}
window.editScholarP41=editScholar;

function ensureTrackControls(){
  const owner=q('trackOwner');if(!owner)return;
  let wrap=q('trackNavP41');
  if(!wrap){
    wrap=document.createElement('div');wrap.id='trackNavP41';
    wrap.style.cssText='display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:10px 0 16px';
    wrap.innerHTML=`<button class="btn" type="button" id="trackAllP41">← Todos</button><button class="btn" type="button" id="trackPrevP41">‹ Anterior</button><button class="btn" type="button" id="trackNextP41">Próximo ›</button><button class="btn" type="button" id="trackScholarP41">🎓 Editar bolsa</button><span id="trackNavHintP41" style="font:600 11px/1.4 system-ui;color:#6b7f89"></span>`;
    const filters=owner.closest('.crono-filters');
    filters?.insertAdjacentElement('afterend',wrap);
    q('trackAllP41').onclick=showAllTrack;
    q('trackPrevP41').onclick=()=>changeTrackPerson(-1);
    q('trackNextP41').onclick=()=>changeTrackPerson(1);
    q('trackScholarP41').onclick=()=>editScholar();
  }
  const selected=currentTrackMemberId(),m=selected&&typeof memberById==='function'?memberById(selected):null;
  const scholar=q('trackScholarP41'),hint=q('trackNavHintP41');
  if(scholar)scholar.style.display=selected?'inline-flex':'none';
  if(hint)hint.textContent=m?`Analisando: ${m.nome}`:'Mostrando todos os Carbonautas';
}

function patchScholarRuler(){
  if(typeof window._scholarPeriodHTML!=='function'||window._scholarPeriodHTML.__p41)return;
  const original=window._scholarPeriodHTML;
  const wrapped=function(m){
    let html=original(m);if(!html)return html;
    let can=false;try{can=!!isAdmin||(typeof isMe==='function'&&isMe(m.id))}catch(_e){}
    if(!can)return html;
    const id=encodeURIComponent(String(m.id||''));
    const button=`<button class="follow-edit" type="button" onclick="editScholarP41(decodeURIComponent('${id}'))" title="Editar modalidade e datas da bolsa" style="width:auto;padding:4px 8px;font-weight:800">✎ Editar bolsa</button>`;
    return html.replace('</div><div class="period-bar">',button+'</div><div class="period-bar">');
  };
  wrapped.__p41=true;window._scholarPeriodHTML=wrapped;
}

function completedActivity(a){
  if(!a)return false;
  const s=String(a.status||'').toLowerCase();
  return ['concluido','aprovado','feito'].includes(s)||Number(a.progress||0)>=100;
}
function sourceActivity(p){try{return (state?.activities||[]).find(a=>a.id===p.sourceId)||null}catch(_e){return null}}
function academicWeight(p,allPoints){
  const action=String(p?.action||'');
  if(action==='checkin')return 5;
  if(action==='publication')return 15;
  if(action==='deadline_done')return 12;
  if(action==='product'){
    const a=sourceActivity(p);if(!a||a.type!=='produto'||!completedActivity(a))return 0;
    const hasCompletion=(allPoints||[]).some(x=>x.memberId===p.memberId&&x.sourceId===p.sourceId&&x.action==='activity_completed');
    return hasCompletion?0:20;
  }
  if(action!=='activity_completed')return 0;
  const a=sourceActivity(p);if(a&&!completedActivity(a))return 0;
  const type=String(a?.type||'');
  if(['defesa','qualificacao'].includes(type))return 25;
  if(['produto','entrega'].includes(type))return 20;
  if(['mestrado','doutorado','tcc'].includes(type))return 20;
  if(type==='correcao')return 15;
  if(type==='pendencia')return 10;
  if(type==='orientacao')return 6;
  return 10;
}
function academicLabel(p){
  if(p.action==='checkin')return'Check-in mensal';
  if(p.action==='publication')return'Produção científica publicada';
  if(p.action==='deadline_done')return'Prazo / entrega concluído';
  if(p.action==='product')return'Produto concluído';
  const a=sourceActivity(p),type=String(a?.type||'');
  return ({defesa:'Defesa concluída',qualificacao:'Qualificação concluída',produto:'Produto concluído',entrega:'Entrega concluída',mestrado:'Etapa de mestrado concluída',doutorado:'Etapa de doutorado concluída',tcc:'Etapa de TCC concluída',correcao:'Correção concluída / aprovada',pendencia:'Pendência resolvida',orientacao:'Orientação concluída'})[type]||'Etapa concluída';
}
function academicTotals(points){
  const map={};
  for(const p of points||[]){
    let m=null;try{m=typeof memberById==='function'?memberById(p.memberId):null}catch(_e){}
    if(!m||m.nivel==='coord')continue;
    const pts=academicWeight(p,points);if(pts<=0)continue;
    const r=map[p.memberId]||(map[p.memberId]={memberId:p.memberId,name:m.nome||p.memberName||'Carbonauta',points:0,actions:0,details:[]});
    r.points+=pts;r.actions++;r.details.push({label:academicLabel(p),points:pts});
  }
  return Object.values(map).sort((a,b)=>b.points-a.points||b.actions-a.actions||a.name.localeCompare(b.name,'pt-BR'));
}
function currentHealthLevel(memberId){
  try{const m=memberById(memberId);return m&&typeof memberHealth==='function'?memberHealth(m).level:'green'}catch(_e){return'green'}
}
function renderAcademicRules(){
  const host=q('scoreRules');if(!host)return;
  const rows=[['Defesa ou qualificação concluída','+25'],['Produto / entrega concluído','+20'],['Etapa de mestrado, doutorado ou TCC concluída','+20'],['Correção concluída / aprovada','+15'],['Produção científica publicada','+15'],['Prazo concluído','+12'],['Pendência resolvida','+10'],['Orientação concluída','+6'],['Check-in mensal','+5'],['Acesso/login, pendência aberta, registrar acompanhamento, jogo, foto, mural ou pasta','0']];
  host.innerHTML=rows.map(([a,b])=>`<div class="score-rule"><span>${typeof esc==='function'?esc(a):a}</span><b>${b}</b></div>`).join('');
}
function renderAcademicMedals(points){
  const board=q('medalBoard');if(!board)return;
  const mk=typeof medalMonthKey==='function'?medalMonthKey():'';
  const final=typeof isPastMedalMonth==='function'?isPastMedalMonth(mk):false;
  const rank=academicTotals(points);
  rank.forEach(r=>{r.health=currentHealthLevel(r.memberId);r.eligible=r.points>=MIN_MEDAL_POINTS&&(final||r.health!=='red')});
  const eligible=rank.filter(r=>r.eligible),top=eligible.slice(0,3),medals=['🥇','🥈','🥉'];
  const my=rank.find(x=>x.memberId===myId);
  if(q('medalMonth')&&typeof medalMonthLabel==='function')q('medalMonth').textContent=medalMonthLabel();
  if(q('medalNext'))q('medalNext').disabled=mk>=((typeof monthKey==='function')?monthKey():'');
  if(q('medalStatus'))q('medalStatus').textContent=final?'🏁 Resultado final · mérito acadêmico':`⏱ Ranking provisório de mérito${my?` · você tem ${my.points} pontos`:''}`;
  const info=`<div style="border:1px solid #b9d8e7;background:#f1f9fd;border-radius:14px;padding:12px 14px;margin:0 0 14px;font:600 12px/1.5 system-ui;color:#244350"><b style="color:#071827">🏅 Agora a medalha mede resultado, não movimentação.</b><br>Não há ponto por acesso, login, abrir pendência, registrar problema, jogo, foto, mural ou criar pasta. Para subir no ranking é preciso concluir ou aprovar entregas acadêmicas. ${!final?'Quem estiver em situação crítica (“Intervir”) aparece no ranking, mas não sobe ao pódio até regularizar.':''}</div>`;
  const podium=top.length?`<div class="podium">${top.map((r,i)=>`<div class="podium-person ${i===0?'first':''}"><div class="med">${medals[i]}</div><b>${typeof esc==='function'?esc(r.name):r.name}</b><strong>${r.points}</strong><small>${r.actions} resultado${r.actions===1?'':'s'} válido${r.actions===1?'':'s'}</small></div>`).join('')}</div>`:`<div class="ag-empty">Ainda ninguém atingiu os critérios mínimos para medalha neste mês.</div>`;
  const list=rank.length?`<div class="rank-list">${rank.map((r)=>{const pos=r.eligible?(eligible.findIndex(x=>x.memberId===r.memberId)+1):0;const status=r.points<MIN_MEDAL_POINTS?`faltam ${MIN_MEDAL_POINTS-r.points} pts`:(!final&&r.health==='red'?'situação crítica — fora do pódio':'elegível');return `<div class="rank-row ${r.memberId===myId?'me':''}"><div class="rank-pos">${pos>0&&pos<=3?medals[pos-1]:(pos>3?pos+'º':'—')}</div><div class="rank-name">${typeof esc==='function'?esc(r.name):r.name}${r.memberId===myId?' · você':''}<small style="display:block;color:#788a92;margin-top:2px">${status}</small></div><div class="rank-points">${r.points} pts</div></div>`}).join('')}</div>`:'<div class="ag-empty">Ainda não há resultados acadêmicos pontuáveis neste mês.</div>';
  board.innerHTML=info+podium+list;renderAcademicRules();
}

function patchMedals(){
  if(typeof window.awardPoints==='function'&&!window.awardPoints.__p41){
    const originalAward=window.awardPoints;
    const wrapped=async function(memberId,action,sourceId,label=''){
      if(!['activity_completed','checkin','product','publication','deadline_done'].includes(String(action||'')))return;
      return originalAward(memberId,action,sourceId,label);
    };
    wrapped.__p41=true;window.awardPoints=wrapped;
  }
  window.pointTotals=academicTotals;
  window.renderScoreRules=renderAcademicRules;
  window.renderMedalsFrom=renderAcademicMedals;
  if(typeof window.reportGameReward==='function'&&!window.reportGameReward.__p41){
    const f=function(){say('🎮 Jogo concluído. O jogo é recreativo e não altera a medalha acadêmica.')};f.__p41=true;window.reportGameReward=f;
  }
  try{if(typeof currentView!=='undefined'&&currentView==='medalhas'&&typeof state!=='undefined')renderAcademicMedals(state.points||[])}catch(_e){}
}

function patchRenderTrack(){
  if(typeof window.renderTrack!=='function'||window.renderTrack.__p41)return;
  const original=window.renderTrack;
  const wrapped=function(){const r=original.apply(this,arguments);setTimeout(ensureTrackControls,0);return r};
  wrapped.__p41=true;window.renderTrack=wrapped;
}
function patch(){
  if(patched)return;
  if(typeof window.renderTrack!=='function'||typeof window.awardPoints!=='function'){setTimeout(patch,300);return}
  patched=true;
  patchRenderTrack();patchScholarRuler();patchMedals();ensureTrackControls();
  const owner=q('trackOwner');if(owner&&!owner.dataset.p41){owner.dataset.p41='1';owner.addEventListener('change',()=>setTimeout(ensureTrackControls,0))}
  const obs=new MutationObserver(()=>{ensureTrackControls();patchScholarRuler()});obs.observe(document.documentElement,{childList:true,subtree:true});
  console.info('Carbonautas Acompanhamento/Medalhas',VERSION,'carregado');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',patch,{once:true});else patch();
})();
