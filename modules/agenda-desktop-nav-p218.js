/* Carbonautas P218 · navegação fácil da Agenda no PC
   - mantém swipe/touch do celular intacto
   - no desktop: clique no dia tem prioridade e abre aquele dia imediatamente
   - roda do mouse percorre horizontalmente os dias
   - setas anterior/próximo e scrollbar visível ajudam quem não usa trackpad
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
let internal=false,observer=null;

function desktop(){
  if(!hasDocument())return false;
  try{return root.matchMedia('(min-width: 760px) and (hover: hover) and (pointer: fine)').matches}catch(_e){return (root.innerWidth||0)>=760}
}
function normalize(v){const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})/);return m?`${m[1]}-${m[2]}-${m[3]}`:''}
function view(){return $('#viewCrono')}
function track(){return $('#viewCrono .ag-month')}
function days(t=track()){return t?$$('.ag-day:not(.out)[data-iso]',t):[]}
function selectedIndex(list=days()){if(!list.length)return-1;const i=list.findIndex(d=>d.classList.contains('sel'));if(i>=0)return i;const t=list.findIndex(d=>d.classList.contains('today'));return t>=0?t:0}
function clampIndex(i,n){return n?Math.max(0,Math.min(Number(i)||0,n-1)):-1}
function centerDay(day,behavior='smooth'){
  const t=day?.closest?.('.ag-month');if(!t||!day)return false;
  const left=Math.max(0,day.offsetLeft-(t.clientWidth-day.offsetWidth)/2);
  try{t.scrollTo({left,behavior})}catch(_e){t.scrollLeft=left}
  return true
}
function refreshExtras(){try{root.CARBONAUTAS_AGENDA_SAVE_BRIDGE_P217?.augment?.()}catch(_e){}}
function activateDay(day){
  if(!day)return false;
  const iso=normalize(day.dataset.iso);if(!iso)return false;
  if(hasDocument())document.documentElement.dataset.p213SelectedDate=iso;
  internal=true;
  try{
    /* O onclick nativo é a fonte oficial: atualiza agSelected e chama renderCrono. */
    if(typeof day.onclick==='function')day.onclick.call(day,{type:'click',target:day,currentTarget:day,preventDefault(){},stopPropagation(){}});
    else{
      try{if(typeof agSelected!=='undefined')agSelected=iso}catch(_e){}
      try{if(typeof renderCrono==='function')renderCrono();else root.renderCrono?.()}catch(_e){}
    }
  }finally{internal=false}
  [0,35,100,220].forEach(ms=>setTimeout(()=>{
    const live=$(`#viewCrono .ag-day[data-iso="${iso}"]:not(.out)`);
    if(live)centerDay(live,ms?'smooth':'auto');
    refreshExtras();
  },ms));
  return true
}
function step(dir){
  const list=days();if(!list.length)return false;
  const from=selectedIndex(list),to=clampIndex(from+(dir<0?-1:1),list.length);
  if(to<0)return false;
  return activateDay(list[to]);
}
function addCss(){
  if(!hasDocument()||$('#p218AgendaDesktopStyle'))return;
  const st=document.createElement('style');st.id='p218AgendaDesktopStyle';st.textContent=`
  #p218AgendaDesktopNav{display:none}
  @media (min-width:760px) and (hover:hover) and (pointer:fine){
    #p218AgendaDesktopNav{display:flex;align-items:center;justify-content:flex-end;gap:9px;margin:4px 0 9px;padding:0 2px}
    #p218AgendaDesktopNav .p218-help{margin-right:auto;color:#70858a;font-size:11px;font-weight:750}
    #p218AgendaDesktopNav button{min-height:38px;border:1px solid #d3e2df;border-radius:12px;background:#fff;color:#28545c;padding:0 13px;font:850 12px/1 system-ui,-apple-system,Segoe UI,sans-serif;box-shadow:0 4px 13px rgba(25,66,69,.06);cursor:pointer}
    #p218AgendaDesktopNav button:hover{background:#edf7f5;border-color:#a8d2cc}
    #viewCrono[data-p114-mode="day"] .ag-month{scrollbar-width:auto!important;scrollbar-color:#9fc8c2 #edf4f2!important;padding-bottom:18px!important;cursor:default!important}
    #viewCrono[data-p114-mode="day"] .ag-month::-webkit-scrollbar{display:block!important;height:9px!important}
    #viewCrono[data-p114-mode="day"] .ag-month::-webkit-scrollbar-track{background:#edf4f2;border-radius:999px}
    #viewCrono[data-p114-mode="day"] .ag-month::-webkit-scrollbar-thumb{background:#9fc8c2;border-radius:999px;border:2px solid #edf4f2}
    #viewCrono[data-p114-mode="day"] .ag-day{cursor:pointer!important}
  }
  `;document.head.appendChild(st)
}
function ensureNav(){
  if(!hasDocument()||!desktop())return null;
  const t=track();if(!t)return null;
  let nav=$('#p218AgendaDesktopNav');
  if(!nav){
    nav=document.createElement('div');nav.id='p218AgendaDesktopNav';
    nav.innerHTML='<span class="p218-help">Use a roda do mouse ou clique diretamente em um dia</span><button type="button" data-p218-prev>← Dia anterior</button><button type="button" data-p218-next>Próximo dia →</button>';
    t.insertAdjacentElement('beforebegin',nav);
    $('[data-p218-prev]',nav).onclick=()=>step(-1);
    $('[data-p218-next]',nav).onclick=()=>step(1);
  }else if(nav.nextElementSibling!==t)t.insertAdjacentElement('beforebegin',nav);
  return nav
}
function bindTrack(t=track()){
  if(!t||t.dataset.p218Bound==='1')return false;t.dataset.p218Bound='1';
  let wheelTimer=0;
  t.addEventListener('wheel',e=>{
    if(!desktop()||view()?.dataset.p114Mode!=='day')return;
    const dy=Number(e.deltaY)||0,dx=Number(e.deltaX)||0;
    if(Math.abs(dy)<1||Math.abs(dx)>Math.abs(dy)*1.25)return;
    e.preventDefault();
    const move=dy*(e.deltaMode===1?28:1.15);
    t.scrollLeft+=move;
    clearTimeout(wheelTimer);wheelTimer=setTimeout(()=>{
      const list=days(t);if(!list.length)return;
      const middle=t.scrollLeft+t.clientWidth/2;
      let near=list[0],dist=Infinity;list.forEach(d=>{const c=d.offsetLeft+d.offsetWidth/2,n=Math.abs(c-middle);if(n<dist){dist=n;near=d}});
      centerDay(near,'smooth');
    },110);
  },{passive:false});
  return true
}
function enhance(){addCss();if(!hasDocument())return false;ensureNav();bindTrack();return true}
function boot(){
  if(!hasDocument())return;
  addCss();enhance();
  /* Captura no document ocorre antes do controlador P114 no trilho; assim um clique real não é engolido pelo modo drag. */
  document.addEventListener('click',e=>{
    if(internal||!desktop()||view()?.dataset.p114Mode!=='day')return;
    const day=e.target.closest?.('#viewCrono .ag-day:not(.out)[data-iso]');if(!day)return;
    e.preventDefault();e.stopImmediatePropagation();activateDay(day);
  },true);
  const body=$('#agBody');if(body){observer=new MutationObserver(()=>queueMicrotask(enhance));observer.observe(body,{childList:true,subtree:true})}
  new MutationObserver(ms=>{if(ms.some(m=>m.attributeName==='data-view')&&(document.body?.dataset?.view==='crono'||document.body?.dataset?.view==='agenda'))setTimeout(enhance,50)}).observe(document.body,{attributes:true,attributeFilter:['data-view']});
  root.addEventListener?.('resize',()=>setTimeout(enhance,80),{passive:true});
  setTimeout(enhance,180)
}
const api={desktop,normalize,days,selectedIndex,clampIndex,centerDay,activateDay,step,enhance};
if(hasDocument()){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot()}
return api;
});
