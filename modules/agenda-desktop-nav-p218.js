/* Carbonautas P218D · navegação estável da Agenda no PC
   - não altera nem recria os cards produzidos pela Agenda oficial
   - evita loops de MutationObserver e travamento ao abrir Agenda
   - clique, roda/trackpad, setas de dia e troca de mês funcionam no desktop
   - mantém swipe/touch do celular intacto
*/
(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.CARBONAUTAS_AGENDA_DESKTOP_NAV_P218=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const hasDocument=()=>typeof document!=='undefined';
const $=(s,r)=>hasDocument()?(r||document).querySelector(s):null;
const $$=(s,r)=>hasDocument()?Array.from((r||document).querySelectorAll(s)):[];
const pad=n=>String(n).padStart(2,'0');
let internal=false,observer=null,observerTarget=null,enhanceQueued=false,pointerGesture=null,lastPointerActivation={iso:'',at:0},boundaryLockUntil=0;

function desktop(){
  if(!hasDocument())return false;
  const w=Number(root.innerWidth)||Number(document.documentElement?.clientWidth)||0;
  return w>=760;
}
function normalize(v){const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})/);return m?`${m[1]}-${m[2]}-${m[3]}`:''}
function shiftIso(v,offset){
  const iso=normalize(v),m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);if(!m)return'';
  const d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3])+(Number(offset)||0));
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
}
function wheelDistance(e){
  const dx=Number(e?.deltaX)||0,dy=Number(e?.deltaY)||0;
  const raw=Math.abs(dx)>Math.abs(dy)?dx:dy;if(Math.abs(raw)<1)return 0;
  return raw*((Number(e?.deltaMode)||0)===1?28:1.15)
}
function view(){return $('#viewCrono')}
function track(){return $('#viewCrono .ag-month')}
function days(t=track()){return t?$$('.ag-day:not(.out)[data-iso]',t):[]}
function stripDays(t=track()){return t?$$('.ag-day[data-iso]',t):[]}
function selectedIndex(list=days()){if(!list.length)return-1;const i=list.findIndex(d=>d.classList.contains('sel'));if(i>=0)return i;const t=list.findIndex(d=>d.classList.contains('today'));return t>=0?t:0}
function selectedIso(list=days()){const i=selectedIndex(list);return i>=0?normalize(list[i]?.dataset?.iso):''}
function clampIndex(i,n){return n?Math.max(0,Math.min(Number(i)||0,n-1)):-1}
function pointerClickIntent(maxDistance,endDistance,limit=9){return Number(maxDistance)<=limit&&Number(endDistance)<=limit}
function centerDay(day,behavior='smooth'){
  const t=day?.closest?.('.ag-month');if(!t||!day)return false;
  const left=Math.max(0,day.offsetLeft-(t.clientWidth-day.offsetWidth)/2);
  t._p218ProgrammaticUntil=Date.now()+320;
  try{t.scrollTo({left,behavior})}catch(_e){t.scrollLeft=left}
  return true
}
function refreshExtras(){try{root.CARBONAUTAS_AGENDA_SAVE_BRIDGE_P217?.augment?.()}catch(_e){}}
function liveDay(iso){return $(`#viewCrono .ag-day[data-iso="${normalize(iso)}"]:not(.out)`)}
function activateDay(day){
  if(!day||day.classList.contains('out'))return false;
  const iso=normalize(day.dataset.iso);if(!iso)return false;
  if(hasDocument())document.documentElement.dataset.p213SelectedDate=iso;
  internal=true;
  try{
    /* O onclick criado por renderAgMonth continua sendo a fonte oficial de agSelected + renderCrono. */
    if(typeof day.onclick==='function')day.onclick.call(day,{type:'click',target:day,currentTarget:day,preventDefault(){},stopPropagation(){}});
    else{
      try{if(typeof agSelected!=='undefined')agSelected=iso}catch(_e){}
      try{if(typeof renderCrono==='function')renderCrono();else root.renderCrono?.()}catch(_e){}
    }
  }finally{internal=false}
  [0,35,100,220].forEach(ms=>setTimeout(()=>{
    const live=liveDay(iso);if(live)centerDay(live,ms?'smooth':'auto');
    refreshExtras();
  },ms));
  return true
}
function activateIso(iso){const day=liveDay(iso);return day?activateDay(day):false}

function renderForIso(value){
  const iso=normalize(value),m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);if(!m)return false;
  let rendered=false,selectedWritten=false;
  internal=true;
  try{
    try{if(typeof agCursor!=='undefined'){agCursor=new Date(Number(m[1]),Number(m[2])-1,1);rendered=true}}catch(_e){}
    try{if(typeof agSelected!=='undefined'){agSelected=iso;selectedWritten=true}}catch(_e){}
    try{
      if(typeof renderCrono==='function'){renderCrono();rendered=true}
      else if(typeof root.renderCrono==='function'){root.renderCrono();rendered=true}
    }catch(_e){}
  }finally{internal=false}
  if(!rendered)return false;
  let done=false;
  const settle=()=>{
    if(done)return;
    const d=liveDay(iso);if(!d)return;
    done=true;
    if(!selectedWritten||!d.classList.contains('sel'))activateDay(d);
    else{
      if(hasDocument())document.documentElement.dataset.p213SelectedDate=iso;
      centerDay(d,'auto');refreshExtras();
    }
  };
  [0,30,80,160,280].forEach(ms=>setTimeout(settle,ms));
  return true
}
function navigateIso(value){
  const iso=normalize(value);if(!iso)return false;
  const live=liveDay(iso);if(live)return activateDay(live);
  return renderForIso(iso)
}
function step(dir){
  const list=days();if(!list.length)return false;
  const from=selectedIso(list);if(!from)return false;
  return navigateIso(shiftIso(from,dir<0?-1:1))
}
function boundaryIso(t,dir){
  const list=days(t);if(!list.length)return'';
  const base=normalize((dir<0?list[0]:list[list.length-1])?.dataset?.iso);
  return shiftIso(base,dir<0?-1:1)
}
function navigateBoundary(t,dir){
  if(Date.now()<boundaryLockUntil)return false;
  const iso=boundaryIso(t,dir);if(!iso)return false;
  boundaryLockUntil=Date.now()+420;
  return navigateIso(iso)
}
function monthStep(dir){
  const list=days();if(!list.length)return false;
  const base=selectedIso(list)||normalize(list[0]?.dataset?.iso);if(!base)return false;
  const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(base);if(!m)return false;
  const current=new Date(+m[1],+m[2]-1,+m[3]);
  const targetMonth=new Date(current.getFullYear(),current.getMonth()+(dir<0?-1:1),1);
  const maxDay=new Date(targetMonth.getFullYear(),targetMonth.getMonth()+1,0).getDate();
  const targetDay=Math.min(current.getDate(),maxDay);
  return navigateIso(`${targetMonth.getFullYear()}-${pad(targetMonth.getMonth()+1)}-${pad(targetDay)}`)
}

function addCss(){
  if(!hasDocument()||$('#p218AgendaDesktopStyle'))return;
  const st=document.createElement('style');st.id='p218AgendaDesktopStyle';st.textContent=`
  #p218AgendaDesktopNav{display:none}
  @media (min-width:760px){
    #p218AgendaDesktopNav{display:flex!important;align-items:center;gap:8px;flex-wrap:wrap;width:100%;max-width:100%;margin:4px 0 9px;padding:0 2px;position:relative;z-index:6;box-sizing:border-box}
    #p218AgendaDesktopNav .p218-help{flex:1 1 330px;color:#70858a;font-size:11px;font-weight:750}
    #p218AgendaDesktopNav button{display:inline-flex!important;align-items:center;justify-content:center;flex:0 0 auto;min-height:38px;border:1px solid #d3e2df;border-radius:12px;background:#fff;color:#28545c;padding:0 12px;font:850 12px/1 system-ui,-apple-system,Segoe UI,sans-serif;box-shadow:0 4px 13px rgba(25,66,69,.06);cursor:pointer}
    #p218AgendaDesktopNav button:hover{background:#edf7f5;border-color:#a8d2cc}
    #p218AgendaDesktopNav button[data-p218-month-prev],#p218AgendaDesktopNav button[data-p218-month-next]{background:#f5faf9;color:#42666c}
    #viewCrono[data-p114-mode="day"] .ag-month{scrollbar-width:auto!important;scrollbar-color:#83bbb4 #edf4f2!important;padding-bottom:18px!important;cursor:grab!important;overscroll-behavior-x:contain!important}
    #viewCrono[data-p114-mode="day"] .ag-month:active{cursor:grabbing!important}
    #viewCrono[data-p114-mode="day"] .ag-month::-webkit-scrollbar{display:block!important;height:11px!important}
    #viewCrono[data-p114-mode="day"] .ag-month::-webkit-scrollbar-track{background:#edf4f2;border-radius:999px}
    #viewCrono[data-p114-mode="day"] .ag-month::-webkit-scrollbar-thumb{background:#83bbb4;border-radius:999px;border:2px solid #edf4f2}
    #viewCrono[data-p114-mode="day"] .ag-day{cursor:pointer!important}
    #viewCrono[data-p114-mode="day"] .ag-day:not(.out):hover{border-color:#72bbb3!important;box-shadow:0 8px 22px rgba(25,105,99,.10)!important}
  }
  `;document.head.appendChild(st)
}
function ensureNav(){
  if(!hasDocument()||!desktop())return null;
  const t=track();if(!t)return null;
  let nav=$('#p218AgendaDesktopNav');
  if(!nav){
    nav=document.createElement('div');nav.id='p218AgendaDesktopNav';
    nav.innerHTML='<span class="p218-help">Role a faixa com a roda/trackpad. Nas bordas, ela passa para o mês vizinho.</span><button type="button" data-p218-month-prev aria-label="Mês anterior">← Mês</button><button type="button" data-p218-prev aria-label="Dia anterior">← Dia</button><button type="button" data-p218-next aria-label="Próximo dia">Dia →</button><button type="button" data-p218-month-next aria-label="Próximo mês">Mês →</button>';
    t.insertAdjacentElement('beforebegin',nav);
    $('[data-p218-month-prev]',nav).onclick=()=>monthStep(-1);
    $('[data-p218-prev]',nav).onclick=()=>step(-1);
    $('[data-p218-next]',nav).onclick=()=>step(1);
    $('[data-p218-month-next]',nav).onclick=()=>monthStep(1);
  }else if(nav.nextElementSibling!==t)t.insertAdjacentElement('beforebegin',nav);
  return nav
}
function decorateDays(t=track()){
  days(t).forEach(day=>{
    day.setAttribute('role','button');
    day.setAttribute('tabindex','0');
    day.setAttribute('aria-label',`Abrir dia ${day.dataset.iso||''}`);
  });
}
function nearestDay(t){
  const list=days(t);if(!list.length)return null;
  const middle=t.scrollLeft+t.clientWidth/2;
  let near=list[0],dist=Infinity;
  list.forEach(d=>{const c=d.offsetLeft+d.offsetWidth/2,n=Math.abs(c-middle);if(n<dist){dist=n;near=d}});
  return near;
}
function bindTrack(t=track()){
  if(!t)return false;
  decorateDays(t);
  if(t.dataset.p218Bound==='1')return true;t.dataset.p218Bound='1';
  let wheelTimer=0;
  t.addEventListener('wheel',e=>{
    if(!desktop()||view()?.dataset.p114Mode!=='day')return;
    const move=wheelDistance(e);if(!move)return;
    e.preventDefault();
    const max=Math.max(0,t.scrollWidth-t.clientWidth);
    if(move<0&&t.scrollLeft<=1){navigateBoundary(t,-1);return}
    if(move>0&&t.scrollLeft>=max-1){navigateBoundary(t,1);return}
    t.scrollLeft+=move;
    clearTimeout(wheelTimer);wheelTimer=setTimeout(()=>{
      const near=nearestDay(t);if(near)activateDay(near);
    },155);
  },{passive:false});
  return true
}
function queueEnhance(){
  if(enhanceQueued)return;
  enhanceQueued=true;
  const run=()=>{enhanceQueued=false;enhance()};
  if(typeof root.requestAnimationFrame==='function')root.requestAnimationFrame(run);else setTimeout(run,16)
}
function ensureObserver(){
  if(!hasDocument()||typeof MutationObserver==='undefined')return;
  const body=$('#agBody');if(!body)return;
  if(observer&&observerTarget===body)return;
  try{observer?.disconnect?.()}catch(_e){}
  observerTarget=body;
  observer=new MutationObserver(()=>queueEnhance());
  observer.observe(body,{childList:true,subtree:true})
}
function enhance(){
  addCss();if(!hasDocument())return false;
  ensureObserver();
  const t=track();if(!t)return false;
  ensureNav();decorateDays(t);bindTrack(t);
  return true
}
function beginPointer(e){
  if(internal||!desktop()||view()?.dataset.p114Mode!=='day')return;
  if(e.pointerType&&e.pointerType!=='mouse')return;
  if(e.button!==undefined&&e.button!==0)return;
  const day=e.target.closest?.('#viewCrono .ag-day:not(.out)[data-iso]');if(!day)return;
  const list=days(),iso=normalize(day.dataset.iso);
  pointerGesture={id:e.pointerId,startX:Number(e.clientX)||0,startY:Number(e.clientY)||0,maxDistance:0,iso,first:iso===normalize(list[0]?.dataset?.iso),last:iso===normalize(list[list.length-1]?.dataset?.iso)}
}
function movePointer(e){
  const g=pointerGesture;if(!g||e.pointerId!==g.id)return;
  const dx=(Number(e.clientX)||0)-g.startX,dy=(Number(e.clientY)||0)-g.startY;
  g.maxDistance=Math.max(g.maxDistance,Math.hypot(dx,dy))
}
function endPointer(e){
  const g=pointerGesture;if(!g||e.pointerId!==g.id)return;
  const dx=(Number(e.clientX)||0)-g.startX,dy=(Number(e.clientY)||0)-g.startY,endDistance=Math.hypot(dx,dy);
  pointerGesture=null;if(!g.iso)return;
  if(pointerClickIntent(g.maxDistance,endDistance)){
    lastPointerActivation={iso:g.iso,at:Date.now()};
    setTimeout(()=>activateIso(g.iso),0);return
  }
  if(Math.abs(dx)<=Math.abs(dy)||Math.abs(dx)<28)return;
  if(g.first&&dx>0)setTimeout(()=>navigateIso(shiftIso(g.iso,-1)),0);
  else if(g.last&&dx<0)setTimeout(()=>navigateIso(shiftIso(g.iso,1)),0)
}
function cancelPointer(e){if(pointerGesture&&e.pointerId===pointerGesture.id)pointerGesture=null}
function boot(){
  if(!hasDocument())return;
  addCss();enhance();
  document.addEventListener('pointerdown',beginPointer,true);
  document.addEventListener('pointermove',movePointer,true);
  document.addEventListener('pointerup',endPointer,true);
  document.addEventListener('pointercancel',cancelPointer,true);
  document.addEventListener('click',e=>{
    if(internal||!desktop()||view()?.dataset.p114Mode!=='day')return;
    const day=e.target.closest?.('#viewCrono .ag-day:not(.out)[data-iso]');if(!day)return;
    const iso=normalize(day.dataset.iso);if(!iso)return;
    if(lastPointerActivation.iso===iso&&Date.now()-lastPointerActivation.at<500){e.preventDefault();e.stopImmediatePropagation();return}
    e.preventDefault();e.stopImmediatePropagation();activateDay(day)
  },true);
  document.addEventListener('keydown',e=>{
    if(!desktop()||view()?.dataset.p114Mode!=='day'||(e.key!=='Enter'&&e.key!==' '))return;
    const day=e.target.closest?.('#viewCrono .ag-day:not(.out)[data-iso]');if(!day)return;
    e.preventDefault();activateDay(day)
  },true);
  if(document.body&&typeof MutationObserver!=='undefined'){
    new MutationObserver(ms=>{
      if(ms.some(m=>m.attributeName==='data-view')&&(document.body?.dataset?.view==='crono'||document.body?.dataset?.view==='agenda'))setTimeout(enhance,35)
    }).observe(document.body,{attributes:true,attributeFilter:['data-view']})
  }
  root.addEventListener?.('resize',()=>setTimeout(enhance,80),{passive:true});
  setTimeout(enhance,180)
}
const api={desktop,normalize,shiftIso,wheelDistance,days,stripDays,selectedIndex,selectedIso,clampIndex,pointerClickIntent,centerDay,activateDay,activateIso,navigateIso,step,boundaryIso,monthStep,nearestDay,enhance};
if(hasDocument()){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot()}
return api;
});
