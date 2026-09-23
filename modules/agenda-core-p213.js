/* Carbonautas P215 · compatibilidade da Agenda sem interface duplicada
   A interface P213 foi aposentada: a Agenda visual volta a ser somente o carrossel P110.
   Este arquivo mantém apenas helpers/API usados por integrações antigas e remove resíduos P213.
*/
(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.CARBONAUTAS_AGENDA_P213=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';

const BUILD='P215-COMPAT';
const hasDocument=()=>typeof document!=='undefined';

function app(){
  try{return root?.CarbonautasApp||((typeof globalThis!=='undefined'&&globalThis.CarbonautasApp)||null)}catch(_e){return null}
}
function state(){
  try{
    const a=app();
    if(a?.state)return a.state;
    return root?.state||((typeof globalThis!=='undefined'&&globalThis.state)||{})||{};
  }catch(_e){return{}}
}
function myId(){
  try{
    const a=app(),id=a?.memberId??a?.myId;
    if(id!==undefined&&id!==null&&String(id)!=='')return String(id);
    return String(root?.myId??globalThis.myId??'');
  }catch(_e){return''}
}
function isAdmin(){
  try{
    const a=app();
    if(a&&a.isAdmin!==undefined)return !!a.isAdmin;
    return !!(root?.isAdmin??globalThis.isAdmin);
  }catch(_e){return false}
}
function memberById(id,s=state()){
  return (s.members||[]).find(m=>String(m?.id)===String(id))||null;
}
function normalizeDate(v){
  if(!v)return'';
  if(typeof v==='string'){
    const m=v.match(/^(\d{4})-(\d{2})-(\d{2})/);if(m)return `${m[1]}-${m[2]}-${m[3]}`;
    const d=new Date(v);if(!Number.isNaN(d.getTime()))return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    return'';
  }
  try{
    const d=typeof v.toDate==='function'?v.toDate():v instanceof Date?v:null;
    if(d&&!Number.isNaN(d.getTime()))return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }catch(_e){}
  return'';
}
function done(x){
  if(!x)return false;
  if(x.feito===true||Number(x.progress)>=100)return true;
  const s=String(x.status||'').trim().toLowerCase();
  return ['concluido','concluído','feito','aprovado','finalizado','finalizada'].includes(s);
}
function participantIds(x){
  const a=Array.isArray(x?.participantIds)?x.participantIds:[];
  const b=Array.isArray(x?.notifyMemberIds)?x.notifyMemberIds:[];
  return [...new Set([...a,...b].filter(Boolean).map(String))];
}
function relevantSchedule(e,id,admin){
  const ids=participantIds(e);
  if(!ids.length)return true;
  return admin||ids.includes(String(id));
}
function collectAgendaItems(s=state(),id=myId(),admin=isAdmin()){
  id=String(id||'');
  const out=[];
  (s.schedule||[]).forEach(e=>{
    const date=normalizeDate(e?.data||e?.date||e?.dueDate);if(!date||e?.feito===true||!relevantSchedule(e,id,admin))return;
    out.push({kind:'grupo',id:String(e.id||''),date,time:String(e.hora||e.time||''),title:e.titulo||e.title||'Evento do grupo',participants:participantIds(e),raw:e});
  });
  (s.privateSchedule||[]).forEach(e=>{
    const date=normalizeDate(e?.data||e?.date||e?.dueDate);if(!date||e?.feito===true)return;
    out.push({kind:'privado',id:String(e.id||''),date,time:String(e.hora||e.time||''),title:e.titulo||e.title||'Compromisso privado',participants:id?[id]:[],raw:e});
  });
  const me=memberById(id,s);
  (me?.prazos||[]).forEach((p,i)=>{
    const date=normalizeDate(p?.data||p?.date||p?.dueDate);if(!date||p?.feito===true)return;
    out.push({kind:'prazo',id:`${id}::${i}`,date,time:String(p.hora||p.time||''),title:p.titulo||p.title||'Prazo',participants:id?[id]:[],raw:p});
  });
  (s.activities||[]).forEach(a=>{
    if(!(a?.agendaShared===true||String(a?.type||'')==='agenda')||done(a))return;
    const date=normalizeDate(a.dueDate||a.data||a.date||a.startDate);if(!date)return;
    const ids=Array.isArray(a.participantIds)?a.participantIds.filter(Boolean).map(String):[];
    const owner=String(a.ownerId||'');
    if(!admin&&owner!==id&&!ids.includes(id))return;
    out.push({kind:'atividade',id:String(a.id||''),date,time:String(a.dueTime||a.hora||a.time||''),title:a.title||a.titulo||'Atividade',participants:[...new Set([owner,...ids].filter(Boolean))],ownerId:owner,raw:a});
  });
  return out.sort((a,b)=>`${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`,'pt-BR'));
}
function itemsForDate(date,s=state(),id=myId(),admin=isAdmin()){
  const iso=normalizeDate(date);return collectAgendaItems(s,id,admin).filter(x=>x.date===iso);
}
function countForDate(date,s=state(),id=myId(),admin=isAdmin()){return itemsForDate(date,s,id,admin).length}
function signature(s=state(),id=myId(),admin=isAdmin()){
  return collectAgendaItems(s,id,admin).map(x=>[x.kind,x.id,x.date,x.time,x.title,x.participants.join(',')].join('|')).join('§');
}

function cleanupDuplicateAgenda(){
  if(!hasDocument())return false;
  document.getElementById('p213AgendaDay')?.remove();
  document.getElementById('p213AgendaNav')?.remove();
  document.getElementById('p213AgendaStyle')?.remove();
  document.querySelectorAll('.p213-day-count').forEach(el=>el.remove());
  return true;
}
function render(){return cleanupDuplicateAgenda()}
function scheduleRender(){return cleanupDuplicateAgenda()}
function selectDate(iso){
  if(!hasDocument())return false;
  const wanted=normalizeDate(iso);if(!wanted)return false;
  const day=[...document.querySelectorAll('#viewCrono .ag-day[data-iso]')].find(el=>normalizeDate(el.dataset.iso)===wanted);
  if(!day)return false;day.click();return true;
}
function step(delta){
  if(!hasDocument())return false;
  const days=[...document.querySelectorAll('#viewCrono .ag-day[data-iso]:not(.out)')];if(!days.length)return false;
  let i=days.findIndex(el=>el.classList.contains('sel'));if(i<0)i=0;
  const j=Math.max(0,Math.min(days.length-1,i+(delta<0?-1:1)));if(j===i)return false;days[j].click();return true;
}
function openSharedTask(id=''){
  if(!hasDocument())return false;
  if(id){const safe=String(id).replace(/"/g,'\\"');const btn=document.querySelector(`#p174AgendaTasks [data-p174-edit="${safe}"]`);if(btn){btn.click();return true}}
  const b=document.querySelector('#p174AgendaTasks [data-p174-new-ag],[data-p174-new-ag]');if(b){b.click();return true}return false;
}
function boot(){
  cleanupDuplicateAgenda();
  if(!hasDocument())return;
  new MutationObserver(ms=>{
    if(ms.some(m=>m.attributeName==='data-view')&&document.body.dataset.view==='crono')cleanupDuplicateAgenda();
  }).observe(document.body,{attributes:true,attributeFilter:['data-view']});
}

const api={BUILD,normalizeDate,done,participantIds,relevantSchedule,collectAgendaItems,itemsForDate,countForDate,signature,cleanupDuplicateAgenda,render,scheduleRender,selectDate,step,openSharedTask};
if(hasDocument()){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
}
return api;
});
