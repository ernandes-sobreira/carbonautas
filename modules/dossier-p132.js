/* Carbonautas P170 · carregador sob demanda
   - Rede e Acompanhamento só carregam quando usados
   - projetos macro também carregam diretamente no Repositório
   - centraliza pessoas no Acompanhamento e projetos macro no Repositório
   - mantém histórico de bolsas e projetos dos alunos
   - não altera regras do Firebase nem VPS
*/
(function(){
'use strict';
if(window.__CARBONAUTAS_P135_LOADER)return;
window.__CARBONAUTAS_P135_LOADER=true;

const $=(s,r=document)=>r.querySelector(s);
let redePromise=null,dossierPromise=null,projectsPromise=null,peopleScheduled=false;
function load(src,id){return new Promise((resolve,reject)=>{if(document.getElementById(id)){resolve();return}const s=document.createElement('script');s.id=id;s.src=src;s.async=false;s.onload=resolve;s.onerror=()=>reject(new Error('Falha ao carregar '+src));document.body.appendChild(s)})}
function idle(fn,timeout=1200){if('requestIdleCallback'in window)requestIdleCallback(fn,{timeout});else setTimeout(fn,320)}
function ensureDossier(){if(dossierPromise)return dossierPromise;dossierPromise=load('./modules/dossier-p133-original.js?v=P133-20260919','carbonautas-dossier-p133-original').catch(e=>{dossierPromise=null;console.error('Carbonautas dossiê',e)});return dossierPromise}
function ensureProjects(){
 if(projectsPromise)return projectsPromise;
 projectsPromise=(async()=>{try{
  await load('./modules/projetos-hierarquia-p169.js?v=P169-20260920','carbonautas-projetos-hierarquia-p169');
  await load('./modules/projetos-repositorio-p170.js?v=P170-20260920','carbonautas-projetos-repositorio-p170');
 }catch(e){projectsPromise=null;console.error('Carbonautas projetos',e)}})();
 return projectsPromise
}
function ensurePeople(){
 if(peopleScheduled)return;peopleScheduled=true;
 idle(async()=>{try{
  await load('./modules/rede-pessoas-p164.js?v=P165-20260919','carbonautas-rede-pessoas-p164');
  await load('./modules/rede-acompanhamento-gestao-p166.js?v=P167-20260920','carbonautas-rede-acompanhamento-gestao-p166');
  await load('./modules/bolsas-historico-p168.js?v=P168-20260920','carbonautas-bolsas-historico-p168');
  await ensureProjects();
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
function route(){const v=currentView();if(v==='rede'||v==='track')ensureRede();if(v==='pubs')ensureProjects()}
function boot(){
 route();
 const mo=new MutationObserver(ms=>{if(ms.some(m=>m.attributeName==='data-view'))route()});mo.observe(document.body,{attributes:true,attributeFilter:['data-view']});
 document.addEventListener('click',e=>{const t=e.target.closest?.('#dashDossierBtn,#trackDossierBtn,[data-open-dossier]');if(t)ensureDossier();const p=e.target.closest?.('#managePeopleBtn');if(p){ensureRede();ensurePeople()}},true);
 idle(()=>ensureDossier(),1800)
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
