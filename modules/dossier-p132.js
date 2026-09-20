/* Carbonautas P166 · carregador sob demanda
   - não bloqueia a interface inicial com todos os módulos da Rede
   - carrega Rede/Acompanhamento quando a tela é usada
   - pré-carrega em tempo ocioso
   - mantém gestão avançada fora do caminho crítico
   - não altera Firebase nem VPS
*/
(function(){
'use strict';
if(window.__CARBONAUTAS_P135_LOADER)return;
window.__CARBONAUTAS_P135_LOADER=true;

const $=(s,r=document)=>r.querySelector(s);
let redePromise=null,dossierPromise=null,peopleScheduled=false;
function load(src,id){return new Promise((resolve,reject)=>{if(document.getElementById(id)){resolve();return}const s=document.createElement('script');s.id=id;s.src=src;s.async=false;s.onload=resolve;s.onerror=()=>reject(new Error('Falha ao carregar '+src));document.body.appendChild(s)})}
function idle(fn,timeout=1200){if('requestIdleCallback'in window)requestIdleCallback(fn,{timeout});else setTimeout(fn,320)}
function ensureDossier(){if(dossierPromise)return dossierPromise;dossierPromise=load('./modules/dossier-p133-original.js?v=P133-20260919','carbonautas-dossier-p133-original').catch(e=>{dossierPromise=null;console.error('Carbonautas dossiê',e)});return dossierPromise}
function ensurePeople(){if(peopleScheduled)return;peopleScheduled=true;idle(()=>load('./modules/rede-pessoas-p164.js?v=P165-20260919','carbonautas-rede-pessoas-p164').catch(e=>console.error('Carbonautas gestão pessoas',e)),700)}
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
function route(){const v=currentView();if(v==='rede'||v==='track')ensureRede()}
function boot(){
 route();
 const mo=new MutationObserver(ms=>{if(ms.some(m=>m.attributeName==='data-view'))route()});mo.observe(document.body,{attributes:true,attributeFilter:['data-view']});
 document.addEventListener('click',e=>{const t=e.target.closest?.('#dashDossierBtn,#trackDossierBtn,[data-open-dossier]');if(t)ensureDossier();const p=e.target.closest?.('#managePeopleBtn');if(p){ensureRede();ensurePeople()}},true);
 idle(()=>{ensureDossier();ensureRede()},1800)
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
