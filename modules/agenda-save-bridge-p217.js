/* Carbonautas P217 · ponte de persistência entre atividades compartilhadas e Agenda oficial
   - não cria uma segunda Agenda
   - injeta rede_activities no carrossel/calendário oficial já existente
   - reconhece um save concluído mesmo se a notificação secundária falhar depois
*/
(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.CARBONAUTAS_AGENDA_SAVE_BRIDGE_P217=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const hasDocument=()=>typeof document!=='undefined';
const $=(s,r)=>hasDocument()?(r||document).querySelector(s):null;
const $$=(s,r)=>hasDocument()?Array.from((r||document).querySelectorAll(s)):[];
let renderLock=false,pendingToken=0;

function state(){try{return root?.CarbonautasApp?.state||root?.state||{}}catch(_e){return{}}}
function memberId(){try{return String(root?.CarbonautasApp?.memberId||root?.myId||'')}catch(_e){return''}}
function isAdmin(){try{return !!root?.CarbonautasApp?.isAdmin}catch(_e){return false}}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function done(a){return !!(a?.feito||Number(a?.progress)>=100||['concluido','concluído','feito','aprovado'].includes(String(a?.status||'').toLowerCase()))}
function visibleActivity(a){
  if(!a||(a.agendaShared!==true&&a.type!=='agenda')||!a.dueDate)return false;
  const me=memberId(),ids=Array.isArray(a.participantIds)?a.participantIds:[];
  return isAdmin()||String(a.ownerId||'')===me||ids.map(String).includes(me);
}
function activitiesForDate(date){return (state().activities||[]).filter(a=>visibleActivity(a)&&String(a.dueDate||'')===String(date||'')).sort((a,b)=>String(a.dueTime||'').localeCompare(String(b.dueTime||''))||String(a.title||'').localeCompare(String(b.title||''),'pt-BR'))}
function selectedDate(){
  if(!hasDocument())return'';
  return $('#viewCrono .ag-day.sel[data-iso]')?.dataset?.iso||document.documentElement?.dataset?.p213SelectedDate||'';
}
function ownerName(a){
  if(a?.ownerName)return a.ownerName;
  const m=(state().members||[]).find(x=>String(x.id)===String(a?.ownerId||''));
  return m?.nome||'Carbonauta';
}
function activityCard(a){
  const when=a.dueTime?esc(a.dueTime):'dia',who=ownerName(a),cls=done(a)?' done':'';
  return `<div class="ag-item p217-agenda-activity${cls}" data-p217-id="${esc(a.id)}"><div class="ag-time">${when}</div><div class="ag-main" data-p217-detail="${esc(a.id)}"><div class="ag-t">${esc(a.title||'Atividade')}</div><div class="ag-who"><span class="d" style="background:#7c8b90"></span>${esc(who)}${a.description?' · <u>detalhes</u>':''}</div>${a.description?`<div class="ag-desc">${esc(a.description)}</div>`:''}</div><div class="ag-act"><button type="button" data-p217-detail="${esc(a.id)}" title="Ver atividade">⋯</button></div></div>`;
}
function bindCards(rootEl){
  $$('[data-p217-detail]',rootEl).forEach(el=>{if(el.dataset.p217Bound==='1')return;el.dataset.p217Bound='1';el.addEventListener('click',e=>{e.stopPropagation();const id=el.dataset.p217Detail;try{root.openAgendaDetail?.('atividade',id)}catch(_e){}})});
}
function addDots(){
  $$('.p217-ag-dot').forEach(x=>x.remove());
  $$('#viewCrono .ag-day[data-iso]').forEach(day=>{
    const list=activitiesForDate(day.dataset.iso);if(!list.length)return;
    const dots=$('.ag-dots',day);if(!dots)return;
    list.slice(0,3).forEach(a=>{const i=document.createElement('i');i.className='p217-ag-dot'+(done(a)?' done':'');i.style.background='#7c8b90';i.title=a.title||'Atividade';dots.appendChild(i)});
  });
}
function augment(){
  if(!hasDocument()||renderLock)return false;
  const body=$('#agBody');if(!body)return false;
  renderLock=true;
  try{
    addDots();
    const date=selectedDate(),dayList=$('.ag-daylist',body);if(!date||!dayList)return true;
    $$('.p217-agenda-activity',dayList).forEach(x=>x.remove());
    const acts=activitiesForDate(date);if(!acts.length)return true;
    const empty=$('.ag-empty',dayList),nativeItems=$$('.ag-item:not(.p217-agenda-activity)',dayList);
    if(empty&&nativeItems.length===0)empty.remove();
    dayList.insertAdjacentHTML('beforeend',acts.map(activityCard).join(''));
    bindCards(dayList);
    return true;
  }finally{renderLock=false}
}
function refreshAgenda(date=''){
  if(date&&hasDocument())document.documentElement.dataset.p213SelectedDate=date;
  try{if(typeof root.renderCrono==='function')root.renderCrono()}catch(e){console.warn('P217 renderCrono',e)}
  [0,60,180,420].forEach(ms=>setTimeout(()=>{
    if(date){const day=$(`#viewCrono .ag-day[data-iso="${String(date).replace(/"/g,'')}"]`);if(day&&!day.classList.contains('sel')&&ms>=60){try{day.click()}catch(_e){}}}
    augment();
  },ms));
}
function matchingActivity(ctx){
  const list=(state().activities||[]).filter(a=>String(a.title||'')===ctx.title&&String(a.dueDate||'')===ctx.date);
  if(ctx.editId)return list.find(a=>String(a.id)===ctx.editId)||null;
  const me=memberId();return list.find(a=>!ctx.before.has(String(a.id))&&(String(a.ownerId||'')===me||isAdmin()))||null;
}
async function watchSave(ctx){
  const token=++pendingToken;
  for(let i=0;i<70;i++){
    if(token!==pendingToken)return null;
    const a=matchingActivity(ctx);
    if(a){
      const ov=$('#p174TaskOverlay');if(ov?.classList.contains('open'))ov.classList.remove('open');
      refreshAgenda(ctx.date);
      try{root.dispatchEvent?.(new CustomEvent('carbonautas:agenda-activity-saved',{detail:{id:a.id,date:ctx.date,title:ctx.title}}))}catch(_e){}
      return a;
    }
    await new Promise(r=>setTimeout(r,100));
  }
  return null;
}
function captureSave(){
  const ov=$('#p174TaskOverlay');if(!ov?.classList.contains('open'))return;
  const title=$('#p174Title')?.value?.trim()||'',date=$('#p174Date')?.value||'';if(!title||!date)return;
  const editing=/editar/i.test($('#p174ModalTitle')?.textContent||'');
  let editId='';if(editing){const hit=(state().activities||[]).find(a=>String(a.title||'')===title&&String(a.dueDate||'')===date&&visibleActivity(a));editId=String(hit?.id||'')}
  const ctx={title,date,editId,before:new Set((state().activities||[]).map(a=>String(a.id)))};
  const status=$('#p183Status');if(status){status.textContent='Salvando atividade…';status.className='p183-status on'}
  watchSave(ctx);
}
function scheduleAugment(){[0,50,140,320].forEach(ms=>setTimeout(augment,ms))}
function boot(){
  if(!hasDocument())return;
  document.addEventListener('click',e=>{
    if(e.target.closest?.('#p174Save'))captureSave();
    if(e.target.closest?.('#viewCrono .ag-day,#agPrev,#agNext,#agModes button,#viewCrono .ag-mini'))scheduleAugment();
  },true);
  new MutationObserver(ms=>{if(ms.some(m=>m.attributeName==='data-view')&&(document.body?.dataset?.view==='crono'||document.body?.dataset?.view==='agenda'))scheduleAugment()}).observe(document.body,{attributes:true,attributeFilter:['data-view']});
  root.addEventListener?.('carbonautas:agenda-activity-saved',scheduleAugment);
  root.addEventListener?.('pageshow',scheduleAugment,{passive:true});
  scheduleAugment();
}
const api={state,memberId,isAdmin,visibleActivity,activitiesForDate,selectedDate,activityCard,augment,refreshAgenda,matchingActivity,watchSave,captureSave};
if(hasDocument()){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot()}
return api;
});
