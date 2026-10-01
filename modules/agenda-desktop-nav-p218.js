/* Carbonautas P218C · navegação contínua da Agenda no PC
   - mantém swipe/touch do celular intacto
   - clique real no card seleciona o dia mesmo quando o P114 suprime o click nativo
   - roda/trackpad e scrollbar percorrem a faixa e atravessam a borda do mês
   - arraste no primeiro/último dia e botões anterior/próximo também atravessam meses
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
let internal=false,observer=null,pointerGesture=null,lastPointerActivation={iso:'',at:0},boundaryLockUntil=0;

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
function days(t=track()){return t?$$('.ag-day:not(.out):not(.p218-synthetic-edge)[data-iso]',t):[]}
function stripDays(t=track()){return t?$$('.ag-day[data-iso]',t):[]}
function selectedIndex(list=days()){if(!list.length)return-1;const i=list.findIndex(d=>d.classList.contains('sel'));if(i>=0)return i;const t=list.findIndex(d=>d.classList.contains('today'));return t>=0?t:0}
function selectedIso(list=days()){const i=selectedIndex(list);return i>=0?normalize(list[i]?.dataset?.iso):''}
function clampIndex(i,n){return n?Math.max(0,Math.min(Number(i)||0,n-1)):-1}
function pointerClickIntent(maxDistance,endDistance,limit=9){return Number(maxDistance)<=limit&&Number(endDistance)<=limit}
function centerDay(day,behavior='smooth'){
  const t=day?.closest?.('.ag-month');if(!t||!day)return false;
  const left=Math.max(0,day.offsetLeft-(t.clientWidth-day.offsetWidth)/2);
  t._p218ProgrammaticUntil=Date.now()+300;
  try{t.scrollTo({left,behavior})}catch(_e){t.scrollLeft=left}
  return true
}
function refreshExtras(){try{root.CARBONAUTAS_AGENDA_SAVE_BRIDGE_P217?.augment?.()}catch(_e){}}
function liveDay(iso){return $(`#viewCrono .ag-day[data-iso="${iso}"]:not(.out):not(.p218-synthetic-edge)`)}
function activateDay(day){
  if(!day||day.classList.contains('out'))return false;
  const iso=normalize(day.dataset.iso);if(!iso)return false;
  if(hasDocument())document.documentElement.dataset.p213SelectedDate=iso;
  internal=true;
  try{
    /* renderAgMonth instala onclick em cada card: ele é a fonte oficial para agSelected + renderCrono. */
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
function activateIso(iso){const day=liveDay(normalize(iso));return day?activateDay(day):false}
function navigateIso(value){
  const iso=normalize(value);if(!iso)return false;
  const live=liveDay(iso);if(live)return activateDay(live);
  const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);if(!m)return false;
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
    if(done)return;const d=liveDay(iso);if(!d)return;
    done=true;
    if(!selectedWritten||!d.classList.contains('sel'))activateDay(d);else{
      if(hasDocument())document.documentElement.dataset.p213SelectedDate=iso;
      centerDay(d,'auto');refreshExtras();
    }
  };
  [0,25,70,150,260].forEach(ms=>setTimeout(settle,ms));
  return true
}
function step(dir){
  const list=days();if(!list.length)return false;
  const from=selectedIso(list);if(!from)return false;
  return navigateIso(shiftIso(from,dir<0?-1:1));
}
function boundaryIso(t,dir){
  const list=days(t);if(!list.length)return'';
  const base=normalize((dir<0?list[0]:list[list.length-1])?.dataset?.iso);
  return shiftIso(base,dir<0?-1:1)
}
function navigateBoundary(t,dir){
  if(Date.now()<boundaryLockUntil)return false;
  const iso=boundaryIso(t,dir);if(!iso)return false;
  boundaryLockUntil=Date.now()+360;
  return navigateIso(iso)
}
function monthName(iso){
  const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(normalize(iso));if(!m)return'';
  try{return new Intl.DateTimeFormat('pt-BR',{month:'short'}).format(new Date(+m[1],+m[2]-1,+m[3])).replace('.','').toUpperCase()}catch(_e){return''}
}
function weekdayName(iso){
  const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(normalize(iso));if(!m)return'';
  try{return new Intl.DateTimeFormat('pt-BR',{weekday:'long'}).format(new Date(+m[1],+m[2]-1,+m[3])).replace('-feira','').toUpperCase()}catch(_e){return''}
}
function makeSyntheticEdge(iso){
  const d=document.createElement('div');d.className='ag-day out p218-edge-day p218-synthetic-edge';d.dataset.iso=iso;
  const n=Number(iso.slice(-2))||1;d.dataset.p110Tone=String(n%5);
  d.innerHTML=`<span>${n}</span><div class="ag-dots"></div>`;return d
}
function decorateEdgeDay(day){
  if(!day)return;day.classList.add('p218-edge-day');
  const iso=normalize(day.dataset.iso);if(!iso)return;
  const n=Number(iso.slice(-2))||1;day.dataset.p110Tone=String(n%5);
  let wd=day.querySelector('.p110-weekday');if(!wd){wd=document.createElement('div');wd.className='p110-weekday';day.appendChild(wd)}wd.textContent=weekdayName(iso);
  let tag=day.querySelector('.p218-edge-month');if(!tag){tag=document.createElement('div');tag.className='p218-edge-month';day.appendChild(tag)}tag.textContent=monthName(iso);
  let meta=day.querySelector('.p218-edge-meta');if(!meta){meta=document.createElement('div');meta.className='p218-edge-meta';day.appendChild(meta)}meta.textContent=`abrir ${monthName(iso).toLowerCase()}`;
  day.setAttribute('role','button');day.setAttribute('tabindex','0');day.setAttribute('aria-label',`Abrir dia ${iso} em outro mês`)
}
function ensureEdgeDays(t=track()){
  if(!t||view()?.dataset.p114Mode!=='day')return false;
  const list=days(t);if(!list.length)return false;
  const first=list[0],last=list[list.length-1],prev=shiftIso(first.dataset.iso,-1),next=shiftIso(last.dataset.iso,1);
  let prevDay=t.querySelector(`.ag-day[data-iso="${prev}"]`);if(!prevDay){prevDay=makeSyntheticEdge(prev);first.insertAdjacentElement('beforebegin',prevDay)}
  let nextDay=t.querySelector(`.ag-day[data-iso="${next}"]`);if(!nextDay){nextDay=makeSyntheticEdge(next);last.insertAdjacentElement('afterend',nextDay)}
  $$('.ag-day.out[data-iso]',t).forEach(decorateEdgeDay);
  return true
}
function addCss(){
  if(!hasDocument()||$('#p218AgendaDesktopStyle'))return;
  const st=document.createElement('style');st.id='p218AgendaDesktopStyle';st.textContent=`
  #p218AgendaDesktopNav{display:none}
  @media (min-width:760px){
    #p218AgendaDesktopNav{display:flex!important;align-items:center;gap:9px;flex-wrap:wrap;width:100%;max-width:100%;margin:4px 0 9px;padding:0 2px;position:relative;z-index:6;box-sizing:border-box}
    #p218AgendaDesktopNav .p218-help{flex:1 1 300px;color:#70858a;font-size:11px;font-weight:750}
    #p218AgendaDesktopNav button{display:inline-flex!important;align-items:center;justify-content:center;flex:0 0 auto;min-height:38px;border:1px solid #d3e2df;border-radius:12px;background:#fff;color:#28545c;padding:0 13px;font:850 12px/1 system-ui,-apple-system,Segoe UI,sans-serif;box-shadow:0 4px 13px rgba(25,66,69,.06);cursor:pointer}
    #p218AgendaDesktopNav button:hover{background:#edf7f5;border-color:#a8d2cc}
    #viewCrono[data-p114-mode="day"] .ag-month{scrollbar-width:auto!important;scrollbar-color:#83bbb4 #edf4f2!important;padding-bottom:18px!important;cursor:grab!important;overscroll-behavior-x:contain!important}
    #viewCrono[data-p114-mode="day"] .ag-month:active{cursor:grabbing!important}
    #viewCrono[data-p114-mode="day"] .ag-month::-webkit-scrollbar{display:block!important;height:11px!important}
    #viewCrono[data-p114-mode="day"] .ag-month::-webkit-scrollbar-track{background:#edf4f2;border-radius:999px}
    #viewCrono[data-p114-mode="day"] .ag-month::-webkit-scrollbar-thumb{background:#83bbb4;border-radius:999px;border:2px solid #edf4f2;min-width:42px}
    #viewCrono[data-p114-mode="day"] .ag-day{cursor:pointer!important}
    #viewCrono[data-p114-mode="day"] .ag-day:not(.out):hover{border-color:#72bbb3!important;box-shadow:0 8px 22px rgba(25,105,99,.10)!important}
    #viewCrono[data-p114-mode="day"] .ag-day.out.p218-edge-day{display:flex!important;opacity:.56!important;filter:saturate(.72);border-style:dashed!important;position:relative!important}
    #viewCrono[data-p114-mode="day"] .ag-day.out.p218-edge-day:hover{opacity:.82!important;border-color:#72bbb3!important;background:#f5fbf9!important}
    #viewCrono[data-p114-mode="day"] .p218-edge-month{position:absolute;right:12px;top:11px;border:1px solid #c8dfda;border-radius:999px;background:#fff;color:#47736f;padding:4px 7px;font-size:9px;font-weight:900;letter-spacing:.06em}
    #viewCrono[data-p114-mode="day"] .p218-edge-meta{margin-top:auto;color:#64817f;font-size:11px;font-weight:800}
    #viewCrono[data-p114-mode="month"] .p218-synthetic-edge{display:none!important}
    #viewCrono[data-p114-mode="month"] .p218-edge-month,#viewCrono[data-p114-mode="month"] .p218-edge-meta{display:none!important}
  }
  `;document.head.appendChild(st)
}
function ensureNav(){
  if(!hasDocument()||!desktop())return null;
  const t=track();if(!t)return null;
  let nav=$('#p218AgendaDesktopNav');
  if(!nav){
    nav=document.createElement('div');nav.id='p218AgendaDesktopNav';
    nav.innerHTML='<span class="p218-help">Rode o mouse, arraste os dias ou use a barra — no fim ela passa para outro mês</span><button type="button" data-p218-prev aria-label="Dia anterior">← Dia anterior</button><button type="button" data-p218-next aria-label="Próximo dia">Próximo dia →</button>';
    t.insertAdjacentElement('beforebegin',nav);
    $('[data-p218-prev]',nav).onclick=()=>step(-1);
    $('[data-p218-next]',nav).onclick=()=>step(1);
  }else if(nav.nextElementSibling!==t)t.insertAdjacentElement('beforebegin',nav);
  return nav
}
function decorateDays(t=track()){
  stripDays(t).forEach(day=>{
    day.setAttribute('role','button');
    day.setAttribute('tabindex','0');
    day.setAttribute('aria-label',`${day.classList.contains('out')?'Abrir outro mês, dia':'Abrir dia'} ${day.dataset.iso||''}`);
  });
}
function nearestDay(t){
  const list=stripDays(t);if(!list.length)return null;
  const middle=t.scrollLeft+t.clientWidth/2;
  let near=list[0],dist=Infinity;
  list.forEach(d=>{const c=d.offsetLeft+d.offsetWidth/2,n=Math.abs(c-middle);if(n<dist){dist=n;near=d}});
  return near;
}
function activateTarget(day){
  if(!day)return false;const iso=normalize(day.dataset.iso);if(!iso)return false;
  return day.classList.contains('out')?navigateIso(iso):activateDay(day)
}
function bindTrack(t=track()){
  if(!t)return false;
  ensureEdgeDays(t);decorateDays(t);
  if(t.dataset.p218Bound==='1')return true;t.dataset.p218Bound='1';
  let wheelTimer=0,scrollTimer=0,lastLeft=Number(t.scrollLeft)||0,lastScrollDir=0;
  t.addEventListener('wheel',e=>{
    if(!desktop()||view()?.dataset.p114Mode!=='day')return;
    const move=wheelDistance(e);if(!move)return;
    e.preventDefault();
    const max=Math.max(0,t.scrollWidth-t.clientWidth);
    if(move<0&&t.scrollLeft<=1){navigateBoundary(t,-1);return}
    if(move>0&&t.scrollLeft>=max-1){navigateBoundary(t,1);return}
    t.scrollLeft+=move;
    clearTimeout(wheelTimer);wheelTimer=setTimeout(()=>{
      const near=nearestDay(t);if(!near)return;
      activateTarget(near);
    },155);
  },{passive:false});
  t.addEventListener('scroll',()=>{
    if(!desktop()||view()?.dataset.p114Mode!=='day')return;
    const now=Number(t.scrollLeft)||0,delta=now-lastLeft;lastLeft=now;
    if(Math.abs(delta)>.5)lastScrollDir=delta>0?1:-1;
    if(t._p110Programmatic||Date.now()<(t._p218ProgrammaticUntil||0))return;
    clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>{
      if(t._p110Programmatic||Date.now()<(t._p218ProgrammaticUntil||0))return;
      const max=Math.max(0,t.scrollWidth-t.clientWidth);
      if(lastScrollDir<0&&t.scrollLeft<=1)navigateBoundary(t,-1);
      else if(lastScrollDir>0&&t.scrollLeft>=max-1)navigateBoundary(t,1);
    },170);
  },{passive:true});
  return true
}
function enhance(){addCss();if(!hasDocument())return false;ensureNav();const t=track();ensureEdgeDays(t);decorateDays(t);bindTrack(t);return true}
function beginPointer(e){
  if(internal||!desktop()||view()?.dataset.p114Mode!=='day')return;
  if(e.pointerType&&e.pointerType!=='mouse')return;
  if(e.button!==undefined&&e.button!==0)return;
  const day=e.target.closest?.('#viewCrono .ag-day[data-iso]');if(!day)return;
  const list=days(),iso=normalize(day.dataset.iso);
  pointerGesture={id:e.pointerId,startX:Number(e.clientX)||0,startY:Number(e.clientY)||0,maxDistance:0,iso,out:day.classList.contains('out'),first:iso===normalize(list[0]?.dataset?.iso),last:iso===normalize(list[list.length-1]?.dataset?.iso)};
}
function movePointer(e){
  const g=pointerGesture;if(!g||e.pointerId!==g.id)return;
  const dx=(Number(e.clientX)||0)-g.startX,dy=(Number(e.clientY)||0)-g.startY;
  g.maxDistance=Math.max(g.maxDistance,Math.hypot(dx,dy));
}
function endPointer(e){
  const g=pointerGesture;if(!g||e.pointerId!==g.id)return;
  const dx=(Number(e.clientX)||0)-g.startX,dy=(Number(e.clientY)||0)-g.startY,endDistance=Math.hypot(dx,dy);
  pointerGesture=null;
  if(!g.iso)return;
  if(pointerClickIntent(g.maxDistance,endDistance)){
    lastPointerActivation={iso:g.iso,at:Date.now()};
    /* Executa depois do pointerup do P114. Assim o drag antigo termina e, em seguida, a escolha por clique vence. */
    setTimeout(()=>g.out?navigateIso(g.iso):activateIso(g.iso),0);return
  }
  if(Math.abs(dx)<=Math.abs(dy)||Math.abs(dx)<28)return;
  /* O P114 antigo limita o arraste dentro do mês. No primeiro/último dia, P218C completa o gesto atravessando o mês. */
  if(g.first&&dx>0)setTimeout(()=>navigateIso(shiftIso(g.iso,-1)),0);
  else if(g.last&&dx<0)setTimeout(()=>navigateIso(shiftIso(g.iso,1)),0)
}
function cancelPointer(e){if(pointerGesture&&e.pointerId===pointerGesture.id)pointerGesture=null}
function boot(){
  if(!hasDocument())return;
  addCss();enhance();
  /* P114 bloqueia o click por 220 ms até quando não houve arraste. Capturamos a intenção no ciclo pointer. */
  document.addEventListener('pointerdown',beginPointer,true);
  document.addEventListener('pointermove',movePointer,true);
  document.addEventListener('pointerup',endPointer,true);
  document.addEventListener('pointercancel',cancelPointer,true);
  document.addEventListener('click',e=>{
    if(internal||!desktop()||view()?.dataset.p114Mode!=='day')return;
    const day=e.target.closest?.('#viewCrono .ag-day[data-iso]');if(!day)return;
    const iso=normalize(day.dataset.iso);if(!iso)return;
    if(lastPointerActivation.iso===iso&&Date.now()-lastPointerActivation.at<500){e.preventDefault();e.stopImmediatePropagation();return}
    e.preventDefault();e.stopImmediatePropagation();activateTarget(day);
  },true);
  document.addEventListener('keydown',e=>{
    if(!desktop()||view()?.dataset.p114Mode!=='day'||(e.key!=='Enter'&&e.key!==' '))return;
    const day=e.target.closest?.('#viewCrono .ag-day[data-iso]');if(!day)return;
    e.preventDefault();activateTarget(day);
  },true);
  const body=$('#agBody');if(body){observer=new MutationObserver(()=>queueMicrotask(enhance));observer.observe(body,{childList:true,subtree:true})}
  new MutationObserver(ms=>{if(ms.some(m=>m.attributeName==='data-view')&&(document.body?.dataset?.view==='crono'||document.body?.dataset?.view==='agenda'))setTimeout(enhance,50)}).observe(document.body,{attributes:true,attributeFilter:['data-view']});
  root.addEventListener?.('resize',()=>setTimeout(enhance,80),{passive:true});
  setTimeout(enhance,180)
}
const api={desktop,normalize,shiftIso,wheelDistance,days,stripDays,selectedIndex,selectedIso,clampIndex,pointerClickIntent,centerDay,activateDay,activateIso,navigateIso,step,boundaryIso,nearestDay,enhance};
if(hasDocument()){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot()}
return api;
});
