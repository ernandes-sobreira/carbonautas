/* Carbonautas P165 · Rede + Acompanhamento auditados e leves
   - mantém as correções visuais e acadêmicas existentes
   - evita redesenhar a Rede ao clicar em botões de outras telas
   - reduz timers e observadores globais
   - só atualiza Rede/Acompanhamento quando a tela correspondente está ativa
   - nao grava, migra ou apaga dados do Firebase
*/
(function(){
'use strict';
if(window.__CARBONAUTAS_P135_REDE_ACOMP)return;
window.__CARBONAUTAS_P135_REDE_ACOMP=true;

const BUILD='P165-PERF-20260919';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[ch]));
let relationMode='all';
let baseBuildLinks=null;
let redeReady=false;
let trackTimer=0;
window.__p135NetworkMode=window.__p135NetworkMode||'all';

function stateRef(){try{return state}catch(_e){return null}}
function memberByName(name){const s=stateRef();return (s?.members||[]).find(m=>norm(m.nome)===norm(name))||null}
function done(a){try{return _activityDone(a)}catch(_e){return ['concluido','aprovado','feito'].includes(norm(a?.status))||Number(a?.progress)>=100}}
function overdue135(a){try{return _isOverdue(a)}catch(_e){if(done(a)||!a?.dueDate)return false;const d=new Date(String(a.dueDate)+'T23:59:59');return Number.isFinite(+d)&&d.getTime()<Date.now()}}
function dayDiff(date){if(!date)return null;const d=new Date(String(date)+'T00:00:00'),n=new Date();n.setHours(0,0,0,0);return Number.isFinite(+d)?Math.round((d-n)/86400000):null}
function datePt(date){if(!date)return'';try{return new Date(String(date)+'T12:00:00').toLocaleDateString('pt-BR')}catch(_e){return String(date)}}
function actTitle(a){try{return String(a?.title||ACTIVITY_TYPES?.[a?.type]||'Acompanhamento').trim()||'Acompanhamento'}catch(_e){return String(a?.title||a?.type||'Acompanhamento')}}
function activeView(){return document.body?.dataset?.view||''}

function installHealthFix(){
  let current=null;try{current=memberHealth}catch(_e){}
  if(typeof current!=='function')return false;
  if(current.__p135Detailed)return true;
  const detailed=function(m){
    const s=stateRef(),acts=(s?.activities||[]).filter(a=>a.ownerId===m.id),now=Date.now();
    let points=0;const reasons=[],details=[],seen=new Set();
    const add=(a,kind,when)=>{const key=a?.id||`${a?.type||''}|${a?.title||''}|${a?.dueDate||''}|${kind}`;if(seen.has(key))return;seen.add(key);const title=actTitle(a),date=a?.dueDate||'';details.push({kind,activityId:a?.id||'',title,dueDate:date,when,text:`${title}${date?' — '+datePt(date):''} — ${when}`})};
    const late=acts.filter(overdue135).sort((a,b)=>String(a.dueDate||'').localeCompare(String(b.dueDate||'')));
    if(late.length){points+=4;late.slice(0,3).forEach(a=>{const n=Math.abs(dayDiff(a.dueDate)||0);add(a,'overdue',n===1?'atrasado há 1 dia':n>1?`atrasado há ${n} dias`:'atrasado')})}
    const corrections=acts.filter(a=>a.type==='correcao'&&!done(a));
    if(corrections.length){points+=Math.min(3,corrections.length);corrections.slice(0,2).forEach(a=>add(a,'correction','correção pendente'))}
    const soon=acts.filter(a=>!done(a)&&a.dueDate).map(a=>({a,d:dayDiff(a.dueDate)})).filter(x=>x.d!==null&&x.d>=0&&x.d<=14).sort((a,b)=>a.d-b.d);
    if(soon.length){points+=2;soon.slice(0,4).forEach(({a,d})=>add(a,'soon',d===0?'vence hoje':d===1?'vence amanhã':`vence em ${d} dias`))}
    if(m.bolsista&&m.bolsaFim){const d=dayDiff(m.bolsaFim);if(d!==null&&d>=0&&d<=45){points+=2;const when=d===0?'encerra hoje':d===1?'encerra amanhã':`encerra em ${d} dias`;details.push({kind:'scholarship',activityId:'',title:m.bolsaModalidade||'Bolsa',dueDate:m.bolsaFim,when,text:`${m.bolsaModalidade||'Bolsa'} — ${datePt(m.bolsaFim)} — ${when}`})}}
    let lm=0;try{lm=lastActivityMillis(m.id)}catch(_e){}
    if(m.status!=='egresso'&&lm&&now-lm>45*86400000){const d=Math.floor((now-lm)/86400000);points+=1;details.push({kind:'stale',activityId:'',title:'Sem atualização recente',dueDate:'',when:`última atualização há ${d} dias`,text:`Sem atualização recente — última atualização há ${d} dias`})}
    if(m.status!=='egresso'&&!(m.perguntaCientifica||'').trim()){points+=1;details.push({kind:'profile',activityId:'',title:'Pergunta científica',dueDate:'',when:'não preenchida',text:'Pergunta científica — não preenchida'})}
    details.slice(0,4).forEach(d=>reasons.push(d.text));if(!reasons.length)reasons.push('Em dia — nenhum alerta ativo');
    return {level:points>=4?'red':points>=2?'yellow':'green',points,reasons,details};
  };
  detailed.__p135Detailed=true;detailed.__p135Original=current;try{memberHealth=detailed}catch(_e){}window.memberHealth=detailed;return true;
}

function decorateTrack(){
  if(activeView()!=='track'&&!$('#viewTrack')?.classList.contains('on'))return;
  const root=$('#viewTrack');if(!root)return;
  $$('.p97-folder',root).forEach(card=>{const id=card.dataset.p97Member,m=(stateRef()?.members||[]).find(x=>x.id===id);if(!m)return;const h=window.memberHealth?.(m),meta=$('.p97-folder-meta',card);if(meta){$$('.p97-mini',meta).forEach(x=>x.style.display='none');let r=$('.p135-folder-reason',meta);if(!r){r=document.createElement('span');r.className='p135-folder-reason';meta.prepend(r)}r.textContent=h?.reasons?.[0]||'Em dia'}const health=$('.p97-health',card);if(health&&/intervir/i.test(health.textContent||''))health.textContent='● Urgente'});
  const card=$('#p97Deck .p97-playing-card');if(!card)return;const name=$('#p97DeckName')?.textContent?.trim(),m=memberByName(name);if(!m)return;const health=$('.p97-health',card);if(health&&/intervir/i.test(health.textContent||''))health.textContent='● Urgente';
  const whyLabel=$$('.p97-info label',card).find(l=>norm(l.textContent).includes('por que esta assim')),box=whyLabel?.parentElement;if(box){const h=window.memberHealth?.(m),ds=h?.details||[];box.innerHTML='<label>Por que está assim?</label>'+(ds.length?`<div class="p135-reasons">${ds.slice(0,5).map(d=>`<div class="p135-reason ${esc(d.kind)}"><b>${esc(d.title)}</b><span>${d.dueDate?esc(datePt(d.dueDate))+' · ':''}${esc(d.when)}</span></div>`).join('')}</div><small class="p135-edit-hint">Edite o item em “Histórico e próximos passos”.</small>`:'<div class="p135-ok">Em dia — nenhum alerta ativo.</div>');let snap=$('.p135-snapshot',card);if(!snap){snap=document.createElement('div');snap.className='p135-snapshot';box.insertAdjacentElement('afterend',snap)}const acts=(stateRef()?.activities||[]).filter(a=>a.ownerId===m.id),open=acts.filter(a=>!done(a)),next=open.filter(a=>a.dueDate).map(a=>({a,d:dayDiff(a.dueDate)})).filter(x=>x.d!==null&&x.d>=0).sort((a,b)=>a.d-b.d)[0],late=open.filter(overdue135).sort((a,b)=>String(a.dueDate||'').localeCompare(String(b.dueDate||'')))[0],last=[...acts].sort((a,b)=>{const ta=(a.updatedAt?.toMillis?.()||a.createdAt?.toMillis?.()||0),tb=(b.updatedAt?.toMillis?.()||b.createdAt?.toMillis?.()||0);return tb-ta})[0],action=late||next?.a||open.find(a=>a.type==='correcao')||open.find(a=>a.type==='pendencia')||open[0];snap.innerHTML=`<div><span>Próximo prazo</span><b>${next?esc(actTitle(next.a)):'—'}</b><small>${next?esc(datePt(next.a.dueDate))+' · '+(next.d===0?'hoje':next.d===1?'amanhã':`em ${next.d} dias`):'Nenhum prazo futuro aberto'}</small></div><div><span>Última atividade</span><b>${last?esc(actTitle(last)):'—'}</b><small>${last?'Registro mais recente':'Sem registro'}</small></div><div><span>Próxima ação</span><b>${action?esc(actTitle(action)):'Tudo em dia'}</b><small>${late?'Está atrasado':next?`Prazo ${next.d===0?'hoje':next.d===1?'amanhã':`em ${next.d} dias`}`:action?'Item ainda aberto':'Nenhuma ação imediata'}</small></div>`}
}
function scheduleTrack(){clearTimeout(trackTimer);trackTimer=setTimeout(decorateTrack,30)}

function installGraphFix(){
  let current=null;try{current=window.renderGraph||renderGraph}catch(_e){}
  if(typeof current!=='function')return false;
  if(current.__p135Fixed)return true;
  let original=current,guard=0;
  while(guard++<6){const next=original.__p97Original||original.__p135Original;if(typeof next!=='function'||next===original)break;original=next}
  const fixed=function(){const r=original.apply(this,arguments);setTimeout(()=>{try{if(simulation){simulation.alphaTarget(0);simulation.stop()}}catch(_e){}},650);return r};
  fixed.__p135Fixed=true;fixed.__p135Original=original;try{renderGraph=fixed}catch(_e){}window.renderGraph=fixed;return true;
}
function relationKinds(link){const txt=norm((link.reasons||[]).map(r=>r.label||'').join(' ')),types=new Set((link.reasons||[]).map(r=>r.type));const kinds=new Set();if(/orient|orientador|orientand/.test(txt))kinds.add('orientation');if(/projeto|pesquisa em conjunto|campo em conjunto|experimento em conjunto/.test(txt))kinds.add('projects');if(types.has('producao')||/artigo|publica|produc|resumo|manuscrito|capitulo|coautor|dados em conjunto|escrev/.test(txt))kinds.add('production');return kinds}
function productionLinks(members,links){const s=stateRef(),ids=new Set(members.map(m=>m.id)),seen=new Set(links.map(l=>[String(l.source?.id||l.source),String(l.target?.id||l.target)].sort().join('|'))),out=[];(s?.publicacoes||[]).forEach(p=>{const people=[p.memberId,...(Array.isArray(p.collaboratorMemberIds)?p.collaboratorMemberIds:[])].filter((v,i,a)=>v&&ids.has(v)&&a.indexOf(v)===i);for(let i=0;i<people.length;i++)for(let j=i+1;j<people.length;j++){const key=[people[i],people[j]].sort().join('|');if(seen.has(key))continue;seen.add(key);out.push({source:people[i],target:people[j],reasons:[{type:'producao',label:`Produção compartilhada${p.title?' · '+p.title:''}`}],w:1,aux:true})}});return out}
function graphInsight(members,links){const deg=new Map(members.map(m=>[m.id,0]));links.forEach(l=>{const a=String(l.source?.id||l.source),b=String(l.target?.id||l.target);if(deg.has(a))deg.set(a,deg.get(a)+1);if(deg.has(b))deg.set(b,deg.get(b)+1)});const isolated=[...deg.values()].filter(n=>n===0).length,top=[...deg.entries()].sort((a,b)=>b[1]-a[1])[0],tm=top?members.find(m=>m.id===top[0]):null,el=$('#p135RedeInsight');if(el)el.textContent=`${members.length} pessoas · ${isolated} isolada(s)${tm&&top[1]?` · mais conexões: ${tm.nome} (${top[1]})`:''}`}
function installBuildLinks(){if(baseBuildLinks)return true;let fn=null;try{fn=buildLinks}catch(_e){}if(typeof fn!=='function')return false;baseBuildLinks=fn;const wrapped=function(members){const links=baseBuildLinks(members);graphInsight(members,links);return links};try{buildLinks=wrapped}catch(_e){}window.buildLinks=wrapped;return true}
function redraw(){if(activeView()!=='rede'&&!$('#viewRede')?.classList.contains('on'))return;try{(window.renderGraph||renderGraph)?.()}catch(e){console.warn('P135 redraw',e)}}
function setMode(mode){relationMode=mode;window.__p135NetworkMode=mode||'all';$$('[data-p135-mode]').forEach(b=>b.classList.toggle('on',b.dataset.p135Mode===mode));const el=$('#p135RedeInsight');if(el){const labels={all:'Todas as relações',orientation:'Orientações registradas · linha mais grossa = mais orientações',projects:'Projetos e linhas compartilhadas',production:'Produção compartilhada · linha roxa tracejada'};el.textContent=labels[mode]||labels.all}redraw()}

function setupRede(force=false){
  const view=$('#viewRede'),main=view?.querySelector('.main');if(!view||!main)return false;
  installGraphFix();installBuildLinks();let changed=false;
  if(!$('#p135RedeToolbar')){const bar=document.createElement('div');bar.id='p135RedeToolbar';bar.className='p135-rede-toolbar';bar.innerHTML=`<div class="p135-rede-title"><b>Rede</b><small>Pessoas e relações</small></div><button type="button" id="p135RedeSettingsBtn" class="p135-settings-btn">⚙ Ajustes</button><label class="p135-search"><span>⌕</span><input id="p135RedeSearch" type="search" placeholder="Buscar pessoa"></label><div class="p135-modes"><button class="on" data-p135-mode="all">Todos</button><button data-p135-mode="orientation">Orientação</button><button data-p135-mode="projects">Projetos</button><button data-p135-mode="production">Produção</button></div><div class="p135-insight" id="p135RedeInsight">Carregando rede…</div>`;view.insertBefore(bar,main);const inp=$('#p135RedeSearch'),real=$('#search');if(inp&&real){inp.value=real.value||'';inp.addEventListener('input',()=>{real.value=inp.value;real.dispatchEvent(new Event('input',{bubbles:true}))})}$$('[data-p135-mode]',bar).forEach(b=>b.onclick=()=>setMode(b.dataset.p135Mode));changed=true}
  if(!$('#p135RedeSettings')){const overlay=document.createElement('div');overlay.id='p135RedeSettings';overlay.hidden=true;overlay.innerHTML='<div class="p135-sheet"><div class="p135-sheet-head"><b>Ajustes da Rede</b><button type="button" aria-label="Fechar">×</button></div><div class="p135-sheet-body"></div></div>';document.body.appendChild(overlay);const body=$('.p135-sheet-body',overlay),side=view.querySelector('.side'),controls=view.querySelector('.graph-controls');if(side)body.appendChild(side);if(controls)body.appendChild(controls);const close=()=>overlay.hidden=true;$('#p135RedeSettingsBtn').onclick=()=>overlay.hidden=false;$('.p135-sheet-head button',overlay).onclick=close;overlay.onclick=e=>{if(e.target===overlay)close()};changed=true}
  if((!redeReady||changed||force)&&(activeView()==='rede'||view.classList.contains('on'))){redeReady=true;requestAnimationFrame(redraw)}
  return true;
}

function injectCss(){if($('#p135Style'))return;const st=document.createElement('style');st.id='p135Style';st.textContent=`#viewRede>.stats{display:none!important}#viewRede .main{min-height:0;flex:1}#viewRede .graph-wrap{min-height:0}.p135-rede-toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 12px;border-bottom:1px solid var(--line);background:rgba(255,255,255,.95);backdrop-filter:blur(10px);z-index:5}.p135-rede-title{display:flex;align-items:baseline;gap:7px}.p135-rede-title b{font:700 21px 'Space Grotesk','Inter',sans-serif;color:#14364a}.p135-rede-title small,.p135-insight{color:#758991;font-size:10px;font-weight:750}.p135-settings-btn{margin-left:auto;border:1px solid #d5e3e1;background:#fff;color:#244b58;border-radius:12px;padding:8px 10px;font-weight:850}.p135-search{order:2;flex:1 1 220px;display:flex;align-items:center;gap:7px;border:1px solid #d5e3e1;background:#fff;border-radius:13px;padding:0 10px}.p135-search input{border:0!important;box-shadow:none!important;outline:0!important;width:100%;padding:9px 0!important;background:transparent!important}.p135-modes{order:3;display:flex;gap:5px;overflow:auto;flex:1 1 100%;scrollbar-width:none}.p135-modes::-webkit-scrollbar{display:none}.p135-modes button{border:1px solid #d5e3e1;background:#fff;color:#506b74;border-radius:999px;padding:7px 11px;font-size:11px;font-weight:850;white-space:nowrap}.p135-modes button.on{background:#168f94;border-color:#168f94;color:#fff}.p135-insight{order:4;flex:1 1 100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#p135RedeSettings[hidden]{display:none!important}#p135RedeSettings{position:fixed;inset:0;z-index:2147483300;display:grid;place-items:end;background:rgba(10,31,40,.42);backdrop-filter:blur(5px)}.p135-sheet{width:min(440px,100%);max-height:82dvh;overflow:auto;background:#fbfefd;border-radius:24px 24px 0 0;border:1px solid #d7e6e3;box-shadow:0 -20px 60px rgba(12,42,52,.22);padding:14px 13px calc(16px + env(safe-area-inset-bottom))}.p135-sheet-head{display:flex;align-items:center;gap:8px;margin-bottom:9px}.p135-sheet-head b{font-size:18px;flex:1}.p135-sheet-head button{width:38px;height:38px;border:0;border-radius:12px;background:#edf5f3;font-size:20px}.p135-sheet-body>.side{display:block!important;width:auto!important;flex:auto!important;border:0!important;padding:0!important;overflow:visible!important;background:transparent!important}.p135-sheet-body>.graph-controls{position:static!important;display:flex!important;margin-top:10px;box-shadow:none!important;background:#fff!important;width:100%;border-radius:14px!important}.p135-folder-reason{flex:1 1 100%;min-width:0;color:#536c73;font-size:10px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.p135-reasons{display:flex!important;flex-direction:column;gap:7px}.p135-reason{display:flex!important;justify-content:space-between;gap:10px;border:1px solid #dfe9e7;border-radius:11px;padding:8px 9px;background:#f8fbfa}.p135-reason b{font-size:11.5px}.p135-reason span{font-size:10px;color:#71858d;text-align:right}.p135-reason.overdue{background:#fff1f2;border-color:#f1c9d0}.p135-reason.soon{background:#fff8e8;border-color:#eedca9}.p135-edit-hint{display:block;margin-top:8px;color:#7b8d93;font-size:9.5px}.p135-ok{color:#267a45!important}.p135-snapshot{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:10px}.p135-snapshot>div{border:1px solid #dde9e7;background:#fff;border-radius:13px;padding:9px;min-width:0}.p135-snapshot span{display:block;font-size:8px;text-transform:uppercase;letter-spacing:.05em;color:#809198;font-weight:900}.p135-snapshot b{display:block;font-size:11px;color:#24424d;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.p135-snapshot small{display:block;font-size:9px;color:#778b92;margin-top:3px;line-height:1.3}@media(max-width:760px){#viewRede .main{position:relative;overflow:hidden!important}#viewRede .graph-wrap{width:100%;min-height:390px}.p135-rede-toolbar{padding:7px 8px}.p135-rede-title b{font-size:19px}.p135-rede-title small{display:none}.p135-search{order:2;flex-basis:100%}.p135-modes{order:3}.p135-insight{font-size:9.5px}#viewRede .detail.open{position:absolute!important;left:6px!important;right:6px!important;bottom:6px!important;width:auto!important;max-width:none!important;z-index:40;border:1px solid #d4e4e1!important;border-radius:21px!important;box-shadow:0 16px 50px rgba(12,40,50,.22);max-height:48dvh!important;background:#fff!important}#viewRede .detail-inner{width:100%!important;height:auto!important;max-height:48dvh!important;overflow:auto!important;padding-bottom:18px!important}#viewTrack .p97-actionline button:not(.primary){display:none!important}#viewTrack .p97-actionline{display:block!important}#viewTrack .p97-actionline .primary{width:100%!important}#viewTrack .p97-toolbar{grid-template-columns:1fr!important}#viewTrack .p97-toolbar>label:not(.person){display:none!important}#viewTrack .p97-sort button{display:none!important}.p135-snapshot{grid-template-columns:1fr}.p135-reason{display:block!important}.p135-reason span{display:block;margin-top:3px;text-align:left}}`;document.head.appendChild(st)}

function bindTrackObservers(){
  const stage=$('#p97Stage');if(stage&&!stage.dataset.p135Observed){stage.dataset.p135Observed='1';new MutationObserver(scheduleTrack).observe(stage,{childList:true})}
  const grid=$('#p97FolderGrid');if(grid&&!grid.dataset.p135Observed){grid.dataset.p135Observed='1';new MutationObserver(scheduleTrack).observe(grid,{childList:true})}
}
function handleView(){
  const v=activeView();
  if(v==='rede'){setupRede(false);return}
  if(v==='track'){installHealthFix();bindTrackObservers();scheduleTrack()}
}
function boot(){
  injectCss();installHealthFix();installGraphFix();installBuildLinks();
  if(activeView()==='rede'||$('#viewRede')?.classList.contains('on'))setupRede(true);
  if(activeView()==='track'||$('#viewTrack')?.classList.contains('on')){bindTrackObservers();decorateTrack()}
  const viewObserver=new MutationObserver(handleView);viewObserver.observe(document.body,{attributes:true,attributeFilter:['data-view']});
  document.addEventListener('click',e=>{if(activeView()==='track'&&e.target.closest?.('[data-p97-member],#p97Deck button'))scheduleTrack()},true);
  setTimeout(()=>{installHealthFix();installGraphFix();installBuildLinks();handleView()},220);
  window.CARBONAUTAS_RUNTIME_BUILD=BUILD;console.info('Carbonautas P165 · desempenho Rede/Acompanhamento')
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
