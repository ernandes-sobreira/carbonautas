/* Carbonautas P218B · navegação simples da Agenda no PC
   - mantém swipe/touch do celular intacto
   - clique real no card seleciona o dia mesmo quando o P114 suprime o click nativo
   - roda do mouse percorre os dias e seleciona o card central ao parar
   - setas anterior/próximo e scrollbar visível continuam como alternativas
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
let internal=false,observer=null,pointerGesture=null,lastPointerActivation={iso:'',at:0};

function desktop(){
  if(!hasDocument())return false;
  const w=Number(root.innerWidth)||Number(document.documentElement?.clientWidth)||0;
  return w>=760;
}
function normalize(v){const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})/);return m?`${m[1]}-${m[2]}-${m[3]}`:''}
function view(){return $('#viewCrono')}
function track(){return $('#viewCrono .ag-month')}
function days(t=track()){return t?$$('.ag-day:not(.out)[data-iso]',t):[]}
function selectedIndex(list=days()){if(!list.length)return-1;const i=list.findIndex(d=>d.classList.contains('sel'));if(i>=0)return i;const t=list.findIndex(d=>d.classList.contains('today'));return t>=0?t:0}
function clampIndex(i,n){return n?Math.max(0,Math.min(Number(i)||0,n-1)):-1}
function pointerClickIntent(maxDistance,endDistance,limit=9){return Number(maxDistance)<=limit&&Number(endDistance)<=limit}
function centerDay(day,behavior='smooth'){
  const t=day?.closest?.('.ag-month');if(!t||!day)return false;
  const left=Math.max(0,day.offsetLeft-(t.clientWidth-day.offsetWidth)/2);
  try{t.scrollTo({left,behavior})}catch(_e){t.scrollLeft=left}
  return true
}
function refreshExtras(){try{root.CARBONAUTAS_AGENDA_SAVE_BRIDGE_P217?.augment?.()}catch(_e){}}
function liveDay(iso){return $(`#viewCrono .ag-day[data-iso="${iso}"]:not(.out)`)}
function activateDay(day){
  if(!day)return false;
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
function step(dir){
  const list=days();if(!list.length)return false;
  const from=selectedIndex(list),to=clampIndex(from+(dir<0?-1:1),list.length);
  if(to<0||to===from)return false;
  return activateDay(list[to]);
}
function addCss(){
  if(!hasDocument()||$('#p218AgendaDesktopStyle'))return;
  const st=document.createElement('style');st.id='p218AgendaDesktopStyle';st.textContent=`
  #p218AgendaDesktopNav{display:none}
  @media (min-width:760px){
    #p218AgendaDesktopNav{display:flex!important;align-items:center;gap:9px;flex-wrap:wrap;width:100%;max-width:100%;margin:4px 0 9px;padding:0 2px;position:relative;z-index:6;box-sizing:border-box}
    #p218AgendaDesktopNav .p218-help{flex:1 1 260px;color:#70858a;font-size:11px;font-weight:750}
    #p218AgendaDesktopNav button{display:inline-flex!important;align-items:center;justify-content:center;flex:0 0 auto;min-height:38px;border:1px solid #d3e2df;border-radius:12px;background:#fff;color:#28545c;padding:0 13px;font:850 12px/1 system-ui,-apple-system,Segoe UI,sans-serif;box-shadow:0 4px 13px rgba(25,66,69,.06);cursor:pointer}
    #p218AgendaDesktopNav button:hover{background:#edf7f5;border-color:#a8d2cc}
    #viewCrono[data-p114-mode="day"] .ag-month{scrollbar-width:auto!important;scrollbar-color:#9fc8c2 #edf4f2!important;padding-bottom:18px!important;cursor:default!important}
    #viewCrono[data-p114-mode="day"] .ag-month::-webkit-scrollbar{display:block!important;height:9px!important}
    #viewCrono[data-p114-mode="day"] .ag-month::-webkit-scrollbar-track{background:#edf4f2;border-radius:999px}
    #viewCrono[data-p114-mode="day"] .ag-month::-webkit-scrollbar-thumb{background:#9fc8c2;border-radius:999px;border:2px solid #edf4f2}
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
    nav.innerHTML='<span class="p218-help">Clique em um dia ou use a roda do mouse</span><button type="button" data-p218-prev aria-label="Dia anterior">← Dia anterior</button><button type="button" data-p218-next aria-label="Próximo dia">Próximo dia →</button>';
    t.insertAdjacentElement('beforebegin',nav);
    $('[data-p218-prev]',nav).onclick=()=>step(-1);
    $('[data-p218-next]',nav).onclick=()=>step(1);
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
    const dy=Number(e.deltaY)||0,dx=Number(e.deltaX)||0;
    if(Math.abs(dy)<1||Math.abs(dx)>Math.abs(dy)*1.25)return;
    e.preventDefault();
    const move=dy*(e.deltaMode===1?28:1.15);
    t.scrollLeft+=move;
    clearTimeout(wheelTimer);wheelTimer=setTimeout(()=>{
      const near=nearestDay(t);if(!near)return;
      const iso=normalize(near.dataset.iso);
      if(iso)activateIso(iso);else centerDay(near,'smooth');
    },145);
  },{passive:false});
  return true
}
function enhance(){addCss();if(!hasDocument())return false;ensureNav();bindTrack();return true}
function beginPointer(e){
  if(internal||!desktop()||view()?.dataset.p114Mode!=='day')return;
  if(e.pointerType&&e.pointerType!=='mouse')return;
  if(e.button!==undefined&&e.button!==0)return;
  const day=e.target.closest?.('#viewCrono .ag-day:not(.out)[data-iso]');if(!day)return;
  pointerGesture={id:e.pointerId,startX:Number(e.clientX)||0,startY:Number(e.clientY)||0,maxDistance:0,iso:normalize(day.dataset.iso)};
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
  if(!g.iso||!pointerClickIntent(g.maxDistance,endDistance))return;
  lastPointerActivation={iso:g.iso,at:Date.now()};
  /* Executa depois do pointerup do P114. Assim o drag antigo termina e, em seguida, a escolha por clique vence. */
  setTimeout(()=>activateIso(g.iso),0);
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
    const day=e.target.closest?.('#viewCrono .ag-day:not(.out)[data-iso]');if(!day)return;
    const iso=normalize(day.dataset.iso);if(!iso)return;
    if(lastPointerActivation.iso===iso&&Date.now()-lastPointerActivation.at<500){e.preventDefault();e.stopImmediatePropagation();return}
    e.preventDefault();e.stopImmediatePropagation();activateDay(day);
  },true);
  document.addEventListener('keydown',e=>{
    if(!desktop()||view()?.dataset.p114Mode!=='day'||(e.key!=='Enter'&&e.key!==' '))return;
    const day=e.target.closest?.('#viewCrono .ag-day:not(.out)[data-iso]');if(!day)return;
    e.preventDefault();activateDay(day);
  },true);
  const body=$('#agBody');if(body){observer=new MutationObserver(()=>queueMicrotask(enhance));observer.observe(body,{childList:true,subtree:true})}
  new MutationObserver(ms=>{if(ms.some(m=>m.attributeName==='data-view')&&(document.body?.dataset?.view==='crono'||document.body?.dataset?.view==='agenda'))setTimeout(enhance,50)}).observe(document.body,{attributes:true,attributeFilter:['data-view']});
  root.addEventListener?.('resize',()=>setTimeout(enhance,80),{passive:true});
  setTimeout(enhance,180)
}
const api={desktop,normalize,days,selectedIndex,clampIndex,pointerClickIntent,centerDay,activateDay,activateIso,step,nearestDay,enhance};
if(hasDocument()){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot()}
return api;
});
