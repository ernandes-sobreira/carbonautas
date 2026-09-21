/* Carbonautas P213 · integração segura da Agenda
   - mantém a data selecionada ao criar atividade/reunião
   - detecta apenas remontagens reais do calendário e pede novo render ao núcleo
   - não observa a página inteira e não interfere em login/auth
*/
(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.CARBONAUTAS_AGENDA_INTEGRATION_P213=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const hasDocument=()=>typeof document!=='undefined';
const $=(s,r)=>hasDocument()?(r||document).querySelector(s):null;
const normalize=v=>{
  const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})/);return m?`${m[1]}-${m[2]}-${m[3]}`:'';
};
function selectedDate(){
  if(!hasDocument())return'';
  const sel=$('#viewCrono .ag-day.sel[data-iso]');
  return normalize(sel?.dataset?.iso)||normalize(document.documentElement.dataset.p213SelectedDate)||'';
}
function rememberDate(v){
  const iso=normalize(v);if(iso&&hasDocument())document.documentElement.dataset.p213SelectedDate=iso;return iso;
}
function editingEvent(){
  try{if(typeof editingEventId!=='undefined')return String(editingEventId||'')}catch(_e){}
  try{return String(root?.editingEventId||'')}catch(_e){return''}
}
function activityIsNew(){
  const t=String($('#p174ModalTitle')?.textContent||'').trim().toLowerCase();
  return !t||t.includes('nova atividade');
}
function applyActivityDate(date=selectedDate()){
  const iso=normalize(date),ov=$('#p174TaskOverlay'),input=$('#p174Date');
  if(!iso||!ov?.classList.contains('open')||!input||!activityIsNew())return false;
  input.value=iso;return true;
}
function applyEventDate(date=selectedDate(),forceNew=false){
  const iso=normalize(date),ov=$('#eventOverlay'),input=$('#eData');
  if(!iso||!ov?.classList.contains('open')||!input)return false;
  if(!forceNew&&editingEvent())return false;
  input.value=iso;return true;
}
function coreRender(){try{root?.CARBONAUTAS_AGENDA_P213?.scheduleRender?.()}catch(_e){}}
function calendarMutation(ms){
  for(const m of ms||[]){
    if(m.type!=='childList')continue;
    const nodes=[...m.addedNodes,...m.removedNodes].filter(n=>n&&n.nodeType===1);
    for(const n of nodes){
      if(n.id==='p213AgendaDay'||n.id==='p213AgendaNav'||n.classList?.contains('p213-day-count'))continue;
      if(n.matches?.('.ag-month,.ag-day[data-iso]')||n.querySelector?.('.ag-month,.ag-day[data-iso]'))return true;
    }
  }
  return false;
}
let pendingEventDate='';
let pendingUntil=0;
function bindOverlayObservers(){
  const act=$('#p174TaskOverlay');
  if(act&&act.dataset.p213DateObserver!=='1'){
    act.dataset.p213DateObserver='1';
    new MutationObserver(()=>{if(act.classList.contains('open'))setTimeout(()=>applyActivityDate(),0)}).observe(act,{attributes:true,attributeFilter:['class']});
  }
  const ev=$('#eventOverlay');
  if(ev&&ev.dataset.p213DateObserver!=='1'){
    ev.dataset.p213DateObserver='1';
    new MutationObserver(()=>{
      if(!ev.classList.contains('open'))return;
      const date=(Date.now()<pendingUntil?pendingEventDate:'')||selectedDate();
      setTimeout(()=>{applyEventDate(date,false);pendingEventDate='';pendingUntil=0},25);
    }).observe(ev,{attributes:true,attributeFilter:['class']});
  }
}
function bindCalendarObserver(){
  const view=$('#viewCrono');if(!view||view.dataset.p213CalendarObserver==='1')return;
  view.dataset.p213CalendarObserver='1';
  new MutationObserver(ms=>{if(calendarMutation(ms))setTimeout(coreRender,0)}).observe(view,{subtree:true,childList:true});
}
function boot(){
  if(!hasDocument())return;
  document.addEventListener('click',e=>{
    const day=e.target.closest?.('#viewCrono .ag-day[data-iso]');if(day)rememberDate(day.dataset.iso);
    if(e.target.closest?.('[data-p174-new],[data-p174-new-ag],[data-p174-menu]')){
      const d=selectedDate();[0,30,90].forEach(ms=>setTimeout(()=>applyActivityDate(d),ms));
    }
    if(e.target.closest?.('#agNewBtn,#newEventBtn')){
      pendingEventDate=selectedDate();pendingUntil=Date.now()+15000;
    }
  },true);
  const install=()=>{bindOverlayObservers();bindCalendarObserver()};
  install();
  // Os overlays podem ser criados sob demanda; checagens finitas, sem loop permanente.
  [150,500,1200,2500].forEach(ms=>setTimeout(install,ms));
  new MutationObserver(ms=>{
    if(ms.some(m=>m.attributeName==='data-view')&&document.body.dataset.view==='crono'){
      setTimeout(()=>{bindCalendarObserver();bindOverlayObservers();coreRender()},0);
    }
  }).observe(document.body,{attributes:true,attributeFilter:['data-view']});
}
const api={selectedDate,rememberDate,editingEvent,activityIsNew,applyActivityDate,applyEventDate,calendarMutation};
if(hasDocument()){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
}
return api;
});
