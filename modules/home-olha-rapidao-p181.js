/* Carbonautas P181 · capa “Olha rapidão”
   - troca o kicker “Sua agenda” por “Olha rapidão”
   - deixa na capa apenas os atalhos Ver agenda e Ver mural
   - remove “+ Atividade” da capa para evitar confusão com Agenda/Mural
   - mantém os dois botões com mesmo tamanho e alinhamento
   - não altera Firebase/VPS
*/
(function(){
'use strict';
if(window.__CARBONAUTAS_P181_HOME_RAPIDAO)return;
window.__CARBONAUTAS_P181_HOME_RAPIDAO=true;

const $=(s,r=document)=>r.querySelector(s);
let observer=null;

function openMural(){
 try{
  if(typeof switchView==='function')switchView('mural');
  else if(typeof window.switchView==='function')window.switchView('mural');
 }catch(_e){try{window.switchView?.('mural')}catch(__e){}}
}
function css(){
 if($('#p181Style'))return;
 const st=document.createElement('style');st.id='p181Style';st.textContent=`
 #p174AgendaFocus .p174-head-actions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:6px!important;align-items:stretch!important}
 #p174AgendaFocus .p174-head-actions>button{margin:0!important;width:100%!important;min-width:0!important;min-height:36px!important;padding:0 10px!important;white-space:nowrap!important;justify-content:center!important}
 #p174AgendaFocus .p181-mural-btn{background:#fff!important;color:#31545c!important;border-color:#d4e2df!important}
 #p174AgendaFocus .p181-mural-btn:active{transform:scale(.985)}
 @media(max-width:650px){
  #p174AgendaFocus .p174-head-actions{width:100%!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important;margin-top:9px!important}
  #p174AgendaFocus .p174-head-actions>button{min-height:34px!important;font-size:9.5px!important}
 }
 `;document.head.appendChild(st)
}
function patch(){
 const box=$('#p174AgendaFocus');if(!box)return false;
 const kicker=$('.p174-kicker',box);if(kicker&&kicker.textContent!=='OLHA RAPIDÃO')kicker.textContent='OLHA RAPIDÃO';
 const actions=$('.p174-head-actions',box);if(!actions)return true;
 const add=actions.querySelector('[data-p174-new]');if(add)add.remove();
 let b=actions.querySelector('.p181-mural-btn');
 if(!b){b=document.createElement('button');b.type='button';b.className='p181-mural-btn';b.textContent='Ver mural';b.setAttribute('aria-label','Ver mural');b.onclick=openMural;actions.appendChild(b)}
 const agenda=actions.querySelector('[data-p174-open]');if(agenda)agenda.textContent='Ver agenda';
 return true
}
function watch(){
 const box=$('#p174AgendaFocus');if(!box)return false;
 if(observer)observer.disconnect();
 observer=new MutationObserver(()=>patch());observer.observe(box,{childList:true,subtree:true});
 patch();return true
}
function boot(){css();if(watch())return;let tries=0;const t=setInterval(()=>{tries++;if(watch()||tries>30)clearInterval(t)},120)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
