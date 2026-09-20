/* Carbonautas P184 · carregador sob demanda protegido pelo login
   - nenhum módulo pesado roda por trás da tela de login
   - check-in só carrega depois que o usuário entra
   - Rede/Acompanhamento/Agenda/Mural continuam sob demanda
   - mantém anexos da Agenda, cards do Mural e Olha rapidão
   - evita interferência de observers/timers no Firebase Auth
   - não altera regras do Firebase nem VPS
*/
(function(){
'use strict';
if(window.__CARBONAUTAS_P135_LOADER)return;
window.__CARBONAUTAS_P135_LOADER=true;

const $=(s,r=document)=>r.querySelector(s);
let redePromise=null,dossierPromise=null,projectsPromise=null,agendaPromise=null,agendaFocusPromise=null,agendaDetailPromise=null,homePolishPromise=null,muralVisualPromise=null,muralPolishPromise=null,muralSavePromise=null,muralUnifiedPromise=null,muralCardsPromise=null,highlightsPromise=null,checkinPromise=null,peopleScheduled=false;

function load(src,id){return new Promise((resolve,reject)=>{if(document.getElementById(id)){resolve();return}const s=document.createElement('script');s.id=id;s.src=src;s.async=false;s.onload=resolve;s.onerror=()=>reject(new Error('Falha ao carregar '+src));document.body.appendChild(s)})}
function idle(fn,timeout=1200){if('requestIdleCallback'in window)requestIdleCallback(fn,{timeout});else setTimeout(fn,320)}
function visible(el){if(!el)return false;try{const cs=getComputedStyle(el),r=el.getBoundingClientRect();return cs.display!=='none'&&cs.visibility!=='hidden'&&r.width>0&&r.height>0}catch(_e){return false}}
function atLogin(){return visible(document.getElementById('loginBtn'))}
function currentView(){return document.body?.dataset?.view||''}

function ensureCheckin(){if(checkinPromise)return checkinPromise;checkinPromise=load('./modules/checkin-mobile-p171.js?v=P171-20260920','carbonautas-checkin-mobile-p171').catch(e=>{checkinPromise=null;console.error('Carbonautas check-in móvel',e)});return checkinPromise}
function ensureDossier(){if(dossierPromise)return dossierPromise;dossierPromise=load('./modules/dossier-p133-original.js?v=P133-20260919','carbonautas-dossier-p133-original').catch(e=>{dossierPromise=null;console.error('Carbonautas dossiê',e)});return dossierPromise}
function ensureAgenda(){if(agendaPromise)return agendaPromise;agendaPromise=load('./modules/agenda-reunioes-p172.js?v=P172-20260920','carbonautas-agenda-reunioes-p172').catch(e=>{agendaPromise=null;console.error('Carbonautas agenda',e)});return agendaPromise}
function ensureAgendaFocus(){
 if(agendaFocusPromise)return agendaFocusPromise;
 agendaFocusPromise=(async()=>{try{
  await load('./modules/agenda-foco-p174.js?v=P174-20260920','carbonautas-agenda-foco-p174');
  await load('./modules/agenda-atividade-anexos-p183.js?v=P183-20260920','carbonautas-agenda-atividade-anexos-p183');
 }catch(e){agendaFocusPromise=null;console.error('Carbonautas foco/anexos agenda',e)}})();
 return agendaFocusPromise
}
function ensureAgendaDetail(){if(agendaDetailPromise)return agendaDetailPromise;agendaDetailPromise=load('./modules/agenda-detalhe-p175.js?v=P175-20260920','carbonautas-agenda-detalhe-p175').catch(e=>{agendaDetailPromise=null;console.error('Carbonautas detalhe agenda',e)});return agendaDetailPromise}
function ensureHomePolish(){
 if(homePolishPromise)return homePolishPromise;
 homePolishPromise=(async()=>{try{
  await load('./modules/agenda-mural-home-p176.js?v=P176-20260920','carbonautas-agenda-mural-home-p176');
  await load('./modules/home-olha-rapidao-p181.js?v=P181B-20260920','carbonautas-home-olha-rapidao-p181');
 }catch(e){homePolishPromise=null;console.error('Carbonautas capa/Mural',e)}})();
 return homePolishPromise
}
function ensureMuralVisual(){if(muralVisualPromise)return muralVisualPromise;muralVisualPromise=load('./modules/mural-visual-p177.js?v=P177-20260920','carbonautas-mural-visual-p177').catch(e=>{muralVisualPromise=null;console.error('Carbonautas Mural visual',e)});return muralVisualPromise}
function ensureMuralPolish(){if(muralPolishPromise)return muralPolishPromise;muralPolishPromise=load('./modules/mural-visual-p178.js?v=P178-20260920','carbonautas-mural-visual-p178').catch(e=>{muralPolishPromise=null;console.error('Carbonautas Mural não vistos',e)});return muralPolishPromise}
function ensureMuralSave(){if(muralSavePromise)return muralSavePromise;muralSavePromise=load('./modules/mural-publicacao-p179.js?v=P180-20260920','carbonautas-mural-publicacao-p179').catch(e=>{muralSavePromise=null;console.error('Carbonautas publicação Mural',e)});return muralSavePromise}
function ensureMuralUnified(){if(muralUnifiedPromise)return muralUnifiedPromise;muralUnifiedPromise=load('./modules/mural-unificado-p180.js?v=P180-20260920','carbonautas-mural-unificado-p180').catch(e=>{muralUnifiedPromise=null;console.error('Carbonautas Mural unificado',e)});return muralUnifiedPromise}
function ensureMuralCards(){if(muralCardsPromise)return muralCardsPromise;muralCardsPromise=load('./modules/mural-cards-p182.js?v=P182-20260920','carbonautas-mural-cards-p182').catch(e=>{muralCardsPromise=null;console.error('Carbonautas cards do Mural',e)});return muralCardsPromise}
function ensureHighlights(){if(highlightsPromise)return highlightsPromise;highlightsPromise=load('./modules/destaques-ui-p173.js?v=P173-20260920','carbonautas-destaques-ui-p173').catch(e=>{highlightsPromise=null;console.error('Carbonautas destaques',e)});return highlightsPromise}
function ensureProjects(){
 if(projectsPromise)return projectsPromise;
 projectsPromise=(async()=>{try{
  await load('./modules/projetos-hierarquia-p169.js?v=P169-20260920','carbonautas-projetos-hierarquia-p169');
  await load('./modules/projetos-repositorio-p170.js?v=P170-20260920','carbonautas-projetos-repositorio-p170');
 }catch(e){projectsPromise=null;console.error('Carbonautas projetos',e)}})();
 return projectsPromise
}
function wireMacroShortcut(){
 const actions=$('#p166TrackAdmin .p166-admin-actions');if(!actions||!window.openMacroProjectsRepository)return;
 let b=actions.querySelector('[data-p170-admin]')||actions.querySelector('[data-p169-admin]');
 if(!b){b=document.createElement('button');b.type='button';const types=actions.querySelector('[data-p166="types"]');types?actions.insertBefore(b,types):actions.appendChild(b)}
 b.removeAttribute('data-p169-admin');b.dataset.p170Admin='1';b.textContent='Projetos macro';b.onclick=window.openMacroProjectsRepository
}
function ensurePeople(){
 if(peopleScheduled)return;peopleScheduled=true;
 idle(async()=>{try{
  await load('./modules/rede-pessoas-p164.js?v=P165-20260919','carbonautas-rede-pessoas-p164');
  await load('./modules/rede-acompanhamento-gestao-p166.js?v=P167-20260920','carbonautas-rede-acompanhamento-gestao-p166');
  await load('./modules/bolsas-historico-p168.js?v=P168-20260920','carbonautas-bolsas-historico-p168');
  await ensureProjects();
  wireMacroShortcut();setTimeout(wireMacroShortcut,160);
 }catch(e){console.error('Carbonautas gestão pessoas',e)}},700)
}
function ensureRede(){
 if(redePromise)return redePromise;
 redePromise=(async()=>{try{
  await load('./p135-rede-acompanhamento.js?v=P165-20260919','carbonautas-p135-rede-acompanhamento');
  await load('./modules/rede-orientacao-p150.js?v=P165B-20260919','carbonautas-rede-orientacao-p150');
  await load('./modules/rede-ui-p155.js?v=P157-20260919','carbonautas-rede-ui-p155');
  await load('./modules/rede-legenda-p158.js?v=P158-20260919','carbonautas-rede-legenda-p158');
  await load('./modules/rede-controles-p161.js?v=P165-20260919','carbonautas-rede-controles-p161');
  await load('./modules/rede-estabilidade-p163.js?v=P165-20260919','carbonautas-rede-estabilidade-p163');
  ensurePeople();
 }catch(e){redePromise=null;console.error('Carbonautas Rede',e)}})();
 return redePromise
}

function route(){
 // Regra de segurança: se a tela de login está visível, não injeta nenhum módulo do app.
 if(atLogin())return;
 ensureCheckin();
 const v=currentView();
 if(v==='rede'||v==='track')ensureRede();
 if(v==='pubs')ensureProjects();
 if(v==='crono'||v==='agenda'){ensureAgenda();ensureAgendaFocus();ensureAgendaDetail()}
 if(v==='painel'){
  (async()=>{await ensureAgendaFocus();await ensureHomePolish();window.refreshHomeAgendaMural?.()})();
  ensureHighlights();
 }
 if(v==='mural'||v==='feed'){ensureHomePolish();ensureMuralVisual();ensureMuralPolish();ensureMuralSave();ensureMuralUnified();ensureMuralCards()}
}
function afterLoginChecks(){[250,700,1400,2600].forEach(ms=>setTimeout(route,ms))}
function boot(){
 // Não há preload pesado no login. Isso deixa Firebase Auth livre para inicializar e responder ao toque.
 route();
 const mo=new MutationObserver(ms=>{if(ms.some(m=>m.attributeName==='data-view')){route();if(currentView()==='track')setTimeout(wireMacroShortcut,900)}});mo.observe(document.body,{attributes:true,attributeFilter:['data-view']});
 document.addEventListener('click',e=>{
  if(e.target.closest?.('#loginBtn')){afterLoginChecks();return}
  if(atLogin())return;
  const t=e.target.closest?.('#dashDossierBtn,#trackDossierBtn,[data-open-dossier]');if(t)ensureDossier();
  const p=e.target.closest?.('#managePeopleBtn');if(p){ensureRede();ensurePeople()}
  const ag=e.target.closest?.('#newEventBtn,[data-open-event],#saveEventBtn,#agNewBtn,[data-p174-new],[data-p174-new-ag],#viewCrono .ag-item');if(ag){ensureAgenda();ensureAgendaFocus();ensureAgendaDetail()}
  const mural=e.target.closest?.('#newPostBtn,#muralPostBtn,#muralNewBtn,#mobileMuralFab,#mobileMuralNew,[data-mural-kind],#savePostBtn');if(mural){ensureHomePolish();ensureMuralVisual();ensureMuralPolish();ensureMuralSave();ensureMuralUnified();ensureMuralCards()}
  const h=e.target.closest?.('[data-p117-add],[data-p117-edit],#p117Highlights');if(h)ensureHighlights()
 },true);
 window.addEventListener('firebase-ready',afterLoginChecks,{passive:true});
 window.addEventListener('pageshow',()=>setTimeout(route,120),{passive:true});
 // Sessão lembrada pelo Firebase pode restaurar sem clique no botão.
 [350,1200,3000,6000].forEach(ms=>setTimeout(route,ms));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
