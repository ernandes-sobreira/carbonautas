/* Carbonautas P215 · integração leve da Agenda
   Mantém apenas o preenchimento da data selecionada ao criar atividade/reunião.
   Não cria segunda Agenda, não esconde o P110 e não altera contadores do carrossel.
*/
(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.CARBONAUTAS_AGENDA_INTEGRATION_P213=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const hasDocument=()=>typeof document!=='undefined';
const $=(s,r)=>hasDocument()?(r||document).querySelector(s):null;
const normalize=v=>{const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})/);return m?`${m[1]}-${m[2]}-${m[3]}`:''};

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
function calendarMutation(){return false}
function scheduleActivityPrefill(date){[0,30,90,180].forEach(ms=>setTimeout(()=>applyActivityDate(date),ms))}
function scheduleEventPrefill(date){[0,40,120,260,500].forEach(ms=>setTimeout(()=>applyEventDate(date,false),ms))}
function boot(){
  if(!hasDocument())return;
  document.getElementById('p213IntegrationStyle')?.remove();
  document.addEventListener('click',e=>{
    const day=e.target.closest?.('#viewCrono .ag-day[data-iso]');if(day)rememberDate(day.dataset.iso);
    if(e.target.closest?.('[data-p174-new],[data-p174-new-ag],[data-p174-menu]'))scheduleActivityPrefill(selectedDate());
    if(e.target.closest?.('#agNewBtn,#newEventBtn'))scheduleEventPrefill(selectedDate());
    if(e.target.closest?.('#agNewMenu button,#agNewMenu [role="button"],#agNewMenu .btn'))scheduleEventPrefill(selectedDate());
  },true);
}
const api={selectedDate,rememberDate,editingEvent,activityIsNew,applyActivityDate,applyEventDate,calendarMutation,scheduleActivityPrefill,scheduleEventPrefill};
if(hasDocument()){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
}
return api;
});
