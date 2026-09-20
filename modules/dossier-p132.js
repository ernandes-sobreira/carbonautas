/* Carbonautas P180 · carregador sob demanda
   - Rede e Acompanhamento só carregam quando usados
   - projetos macro também carregam diretamente no Repositório
   - agenda carrega reuniões, foco e detalhe visual só quando usada
   - capa usa foco compacto da agenda e ações datadas do Mural
   - Mural é único para toda a Rede, sem mensagens direcionadas
   - publicação do Mural salva texto antes do anexo para não perder a mensagem
   - destaques carregam compactação/ajuste visual só no Painel
   - centraliza pessoas no Acompanhamento e projetos macro no Repositório
   - mantém histórico de bolsas e projetos dos alunos
   - carrega imediatamente a proteção do check-in diário no celular
   - não altera regras do Firebase nem VPS
*/
(function(){
'use strict';
if(window.__CARBONAUTAS_P135_LOADER)return;
window.__CARBONAUTAS_P135_LOADER=true;

const $=(s,r=document)=>r.querySelector(s);
let redePromise=null,dossierPromise=null,projectsPromise=null,agendaPromise=null,agendaFocusPromise=null,agendaDetailPromise=null,homePolishPromise=null,muralVisualPromise=null,muralPolishPromise=null,muralSavePromise=null,muralUnifiedPromise=null,highlightsPromise=null,peopleScheduled=false;
function load(src,id){return new Promise((resolve,reject)=>{if(document.getElementById(id)){resolve();return}const s=document.createElement('script');s.id=id;s.src=src;s.async=false;s.onload=resolve;s.onerror=()=>reject(new Error('Falha ao carregar '+src));document.body.appendChild(s)})}
function idle(fn,timeout=1200){if('requestIdleCallback'in window)requestIdleCallback(fn,{timeout});else setTimeout(fn,320)}
function ensureDossier(){if(dossierPromise)return dossierPromise;dossierPromise=load('./modules/dossier-p133-original.js?v=P133-20260919','carbonautas-dossier-p133-original').catch(e=>{dossierPromise=null;console.error('Carbonautas dossiê',e)});return dossierPromise}
function ensureAgenda(){if(agendaPromise)return agendaPromise;agendaPromise=load('./modules/agenda-reunioes-p172.js?v=P172-20260920','carbonautas-agenda-reunioes-p172').catch(e=>{agendaPromise=null;console.error('Carbonautas agenda',e)});return agendaPromise}
function ensureAgendaFocus(){if(agendaFocusPromise)return agendaFocusPromise;agendaFocusPromise=load('./modules/agenda-foco-p174.js?v=P174-20260920','carbonautas-agenda-foco-p174').catch(e=>{agendaFocusPromise=null;console.error('Carbonautas foco agenda',e)});return agendaFocusPromise}
function ensureAgendaDetail(){if(agendaDetailPromise)return agendaDetailPromise;agendaDetailPromise=load('./modules/agenda-detalhe-p175.js?v=P175-20260920','carbonautas-agenda-detalhe-p175').catch(e=>{agendaDetailPromise=null;console.error('Carbonautas detalhe agenda',e)});return agendaDetailPromise}
function ensureHomePolish(){if(homePolishPromise)return homePolishPromise;homePolishPromise=load('./modules/agenda-mural-home-p176.js?v=P176-20260920','carbonautas-agenda-mural-home-p176').catch(e=>{homePolishPromise=null;console.error('Carbonautas capa/Mural',e)});return homePolishPromise}
function ensureMuralVisual(){if(muralVisualPromise)return muralVisualPromise;muralVisualPromise=load('./modules/mural-visual-p177.js?v=P177-20260920','carbonautas-mural-visual-p177').catch(e=>{muralVisualPromise=null;console.error('Carbonautas Mural visual',e)});return muralVisualPromise}
function ensureMuralPolish(){if(muralPolishPromise)return muralPolishPromise;muralPolishPromise=load('./modules/mural-visual-p178.js?v=P178-20260920','carbonautas-mural-visual-p178').catch(e=>{muralPolishPromise=null;console.error('Carbonautas Mural não vistos',e)});return muralPolishPromise}
function ensureMuralSave(){if(muralSavePromise)return muralSavePromise;muralSavePromise=load('./modules/mural-publicacao-p179.js?v=P180-20260920','carbonautas-mural-publicacao-p179').catch(e=>{muralSavePromise=null;console.error('Carbonautas publicação Mural',e)});return muralSavePromise}
function ensureMuralUnified(){if(muralUnifiedPromise)return muralUnifiedPromise;muralUnifiedPromise=load('./modules/mural-unificado-p180.js?v=P180-20260920','carbonautas-mural-unificado-p180').catch(e=>{muralUnifiedPromise=null;console.error('Carbonautas Mural unificado',e)});return muralUnifiedPromise}
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
function currentView(){return document.body?.dataset?.view||''}
function route(){
 const v=currentView();
 if(v==='rede'||v==='track')ensureRede();
 if(v==='pubs')ensureProjects();
 if(v==='crono'||v==='agenda'){ensureAgenda();ensureAgendaFocus();ensureAgendaDetail()}
 if(v==='painel'){
  (async()=>{await ensureAgendaFocus();await ensureHomePolish();window.refreshHomeAgendaMural?.()})();
  ensureHighlights();
 }
 if(v==='mural'||v==='feed'){ensureHomePolish();ensureMuralVisual();ensureMuralPolish();ensureMuralSave();ensureMuralUnified()}
}
function boot(){
 load('./modules/checkin-mobile-p171.js?v=P171-20260920','carbonautas-checkin-mobile-p171').catch(e=>console.error('Carbonautas check-in móvel',e));
 route();
 const mo=new MutationObserver(ms=>{if(ms.some(m=>m.attributeName==='data-view')){route();if(currentView()==='track')setTimeout(wireMacroShortcut,900)}});mo.observe(document.body,{attributes:true,attributeFilter:['data-view']});
 document.addEventListener('click',e=>{
  const t=e.target.closest?.('#dashDossierBtn,#trackDossierBtn,[data-open-dossier]');if(t)ensureDossier();
  const p=e.target.closest?.('#managePeopleBtn');if(p){ensureRede();ensurePeople()}
  const ag=e.target.closest?.('#newEventBtn,[data-open-event],#saveEventBtn,#agNewBtn,[data-p174-new],[data-p174-new-ag],#viewCrono .ag-item');if(ag){ensureAgenda();ensureAgendaFocus();ensureAgendaDetail()}
  const mural=e.target.closest?.('#newPostBtn,#muralPostBtn,#muralNewBtn,#mobileMuralFab,#mobileMuralNew,[data-mural-kind],#savePostBtn');if(mural){ensureHomePolish();ensureMuralVisual();ensureMuralPolish();ensureMuralSave();ensureMuralUnified()}
  const h=e.target.closest?.('[data-p117-add],[data-p117-edit],#p117Highlights');if(h)ensureHighlights()
 },true);
 idle(()=>ensureMuralPolish(),250);
 idle(()=>ensureMuralVisual(),650);
 idle(()=>ensureMuralSave(),850);
 idle(()=>ensureMuralUnified(),950);
 idle(()=>ensureDossier(),1800)
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
