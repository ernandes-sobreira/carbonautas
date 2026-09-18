/* Carbonautas P114 · swipe curto + modos Dia/Mês/Ano. Somente interface da Agenda. */
(function(){
'use strict';
const BUILD='P114';
const STYLE_ID='p114AgendaStyle';
let scheduled=false;

function addStyle(){
  if(document.getElementById(STYLE_ID)) return;
  const st=document.createElement('style');
  st.id=STYLE_ID;
  st.textContent=`
    /* O modo Dia mantém o baralho, mas o trilho NÃO percorre o mês no fim do gesto. */
    #viewCrono[data-p114-mode="day"] .ag-month{
      scroll-behavior:auto!important;
      scroll-snap-type:none!important;
      touch-action:pan-y!important;
      overscroll-behavior-x:none!important;
    }
    #viewCrono[data-p114-mode="day"] .ag-day{scroll-snap-align:none!important;scroll-snap-stop:normal!important}
    #viewCrono .ag-day.p114-dragging{transition:none!important;z-index:9!important;will-change:transform}

    /* Mês de verdade: calendário inteiro, leve e compacto. */
    #viewCrono[data-p114-mode="month"] .ag-month{
      display:grid!important;
      grid-template-columns:repeat(7,minmax(0,1fr))!important;
      gap:7px!important;
      overflow:visible!important;
      width:100%!important;
      margin:8px 0 18px!important;
      padding:8px 0 12px!important;
      scroll-snap-type:none!important;
      scroll-behavior:auto!important;
      touch-action:pan-y!important;
    }
    #viewCrono[data-p114-mode="month"] .ag-dow{
      display:flex!important;align-items:center!important;justify-content:center!important;
      min-width:0!important;width:auto!important;height:28px!important;padding:0!important;margin:0!important;
      font-size:10px!important;line-height:1!important;font-weight:850!important;letter-spacing:.08em!important;
      color:#809297!important;text-transform:uppercase!important;background:transparent!important;border:0!important;
    }
    #viewCrono[data-p114-mode="month"] .ag-day,
    #viewCrono[data-p114-mode="month"] .ag-day.out{
      display:flex!important;flex:0 0 auto!important;width:auto!important;min-width:0!important;max-width:none!important;
      min-height:72px!important;height:72px!important;aspect-ratio:auto!important;
      padding:9px 7px!important;margin:0!important;gap:4px!important;
      border-radius:16px!important;border:1px solid rgba(82,125,126,.13)!important;
      background:rgba(255,255,255,.78)!important;box-shadow:0 5px 15px rgba(25,66,69,.04)!important;
      opacity:1!important;transform:none!important;animation:none!important;transition:border-color .15s ease,background .15s ease!important;
      align-items:flex-start!important;justify-content:flex-start!important;overflow:hidden!important;
      scroll-snap-align:none!important;
    }
    #viewCrono[data-p114-mode="month"] .ag-day.out{opacity:.28!important;background:rgba(247,250,249,.55)!important}
    #viewCrono[data-p114-mode="month"] .ag-day:before,
    #viewCrono[data-p114-mode="month"] .ag-day:after{display:none!important}
    #viewCrono[data-p114-mode="month"] .ag-day>span{
      width:auto!important;height:auto!important;margin:0!important;padding:0!important;
      font-family:inherit!important;font-size:20px!important;line-height:1!important;font-weight:760!important;
      color:#3f5f66!important;background:transparent!important;box-shadow:none!important;
    }
    #viewCrono[data-p114-mode="month"] .ag-day.sel{
      border-color:#2aa89f!important;background:#e8f7f4!important;box-shadow:0 7px 18px rgba(23,125,117,.08)!important;
    }
    #viewCrono[data-p114-mode="month"] .ag-day.today{outline:2px solid rgba(31,159,149,.26)!important;outline-offset:-2px!important}
    #viewCrono[data-p114-mode="month"] .p110-weekday,
    #viewCrono[data-p114-mode="month"] .p110-count,
    #viewCrono[data-p114-mode="month"] .p110-today{display:none!important}
    #viewCrono[data-p114-mode="month"] .ag-dots{
      display:flex!important;margin:auto 0 0!important;min-height:8px!important;gap:3px!important;max-width:100%!important;overflow:hidden!important;
    }
    #viewCrono[data-p114-mode="month"] .ag-dots i{width:5px!important;height:5px!important;flex:0 0 5px!important}
    #viewCrono[data-p114-mode="month"] .ag-dots b{font-size:8px!important}
    #viewCrono[data-p114-mode="month"] .ag-daylist{display:none!important}

    #viewCrono .p114-mode-active{
      background:#fff!important;color:#147d79!important;box-shadow:0 5px 16px rgba(24,101,101,.08)!important;
      border-radius:999px!important;font-weight:850!important;
    }
    #viewCrono #p114DayMode{border:0;background:transparent;color:#61777d;font:inherit;cursor:pointer}

    @media(max-width:680px){
      #viewCrono[data-p114-mode="month"] .ag-month{gap:5px!important;margin-top:6px!important}
      #viewCrono[data-p114-mode="month"] .ag-day,
      #viewCrono[data-p114-mode="month"] .ag-day.out{height:62px!important;min-height:62px!important;padding:7px 5px!important;border-radius:13px!important}
      #viewCrono[data-p114-mode="month"] .ag-day>span{font-size:17px!important}
      #viewCrono[data-p114-mode="month"] .ag-dow{height:24px!important;font-size:9px!important}
      #viewCrono .p114-hide-mobile{display:none!important}
    }
  `;
  document.head.appendChild(st);
}

function norm(s){return String(s||'').replace(/\s+/g,' ').trim().toLowerCase()}
function view(){return document.getElementById('viewCrono')}
function findButton(label){
  const v=view();if(!v)return null;
  const wanted=norm(label);
  return [...v.querySelectorAll('button')].find(b=>norm(b.textContent)===wanted)||null;
}
function dayCards(track){
  return [...track.querySelectorAll('.ag-day:not(.out)')].filter(el=>getComputedStyle(el).display!=='none');
}
function currentDayIndex(track,list){
  if(!list.length)return 0;
  const sel=track.querySelector('.ag-day.sel:not(.out)')||track.querySelector('.ag-day.today:not(.out)');
  const i=list.indexOf(sel);return i>=0?i:0;
}
function instantCenter(track,card){
  if(!track||!card)return;
  const left=Math.max(0,card.offsetLeft-(track.clientWidth-card.offsetWidth)/2);
  track._p110Programmatic=true;
  track.scrollLeft=left;
  requestAnimationFrame(()=>{track._p110Programmatic=false});
}
function snapFresh(iso,tries=0){
  const track=document.querySelector('#viewCrono .ag-month');
  const card=iso?track?.querySelector(`.ag-day[data-iso="${iso}"]:not(.out)`):track?.querySelector('.ag-day.sel:not(.out)');
  if(track&&card){instantCenter(track,card);return}
  if(tries<8)setTimeout(()=>snapFresh(iso,tries+1),25);
}
function chooseDay(track,target){
  if(!track||!target)return;
  const iso=target.dataset.iso||'';
  track._p110SuppressClickUntil=0;
  track._p111SuppressClickUntil=0;
  track._p113SuppressClickUntil=0;
  track._p114InternalClick=true;
  try{target.click()}finally{track._p114InternalClick=false}
  /* O ponto principal da P114: SEM scroll suave atravessando o mês. */
  requestAnimationFrame(()=>snapFresh(iso));
  setTimeout(()=>snapFresh(iso),45);
}

function bindDaySwipe(track){
  if(!track||track.dataset.p114Bound==='1')return;
  track.dataset.p114Bound='1';
  const state={active:false,id:null,startX:0,startY:0,lastX:0,axis:'',index:0,card:null,time:0};

  /* Neutraliza os controladores antigos P110/P113 neste trilho. */
  ['touchstart','touchmove','touchend','touchcancel'].forEach(type=>{
    track.addEventListener(type,e=>{if(view()?.dataset.p114Mode==='day')e.stopImmediatePropagation()},{capture:true,passive:true});
  });
  track.addEventListener('scroll',e=>{
    if(view()?.dataset.p114Mode==='day')e.stopImmediatePropagation();
  },{capture:true,passive:true});

  track.addEventListener('pointerdown',e=>{
    if(view()?.dataset.p114Mode!=='day')return;
    if(!e.isPrimary)return;
    if(e.pointerType==='mouse'&&e.button!==0)return;
    if(e.target.closest('button,a,input,select,textarea'))return;
    const list=dayCards(track);if(!list.length)return;
    e.stopImmediatePropagation();
    state.active=true;state.id=e.pointerId;state.startX=e.clientX;state.lastX=e.clientX;state.startY=e.clientY;
    state.axis='';state.index=currentDayIndex(track,list);state.card=list[state.index]||null;state.time=performance.now();
    track._p110Programmatic=true;
    try{track.setPointerCapture(e.pointerId)}catch(_e){}
  },{capture:true,passive:true});

  track.addEventListener('pointermove',e=>{
    if(!state.active||e.pointerId!==state.id)return;
    e.stopImmediatePropagation();
    const dx=e.clientX-state.startX,dy=e.clientY-state.startY;state.lastX=e.clientX;
    if(!state.axis&&Math.max(Math.abs(dx),Math.abs(dy))>=6)state.axis=Math.abs(dx)>Math.abs(dy)*1.12?'x':'y';
    if(state.axis==='x'){
      e.preventDefault();
      const limited=Math.max(-34,Math.min(34,dx*.20));
      if(state.card){
        state.card.classList.add('p114-dragging');
        state.card.style.setProperty('transform',`translateX(${limited}px) translateY(-3px) scale(1)`,'important');
      }
    }
  },{capture:true,passive:false});

  function finish(e,cancelled){
    if(!state.active||e.pointerId!==state.id)return;
    e.stopImmediatePropagation();
    const dx=(Number.isFinite(e.clientX)?e.clientX:state.lastX)-state.startX;
    const elapsed=Math.max(1,performance.now()-state.time);
    const velocity=Math.abs(dx)/elapsed;
    const list=dayCards(track);
    const from=Math.max(0,Math.min(state.index,list.length-1));
    let to=from;
    if(!cancelled&&state.axis==='x'&&(Math.abs(dx)>=28||velocity>.34))to=from+(dx<0?1:-1);
    to=Math.max(0,Math.min(to,list.length-1));
    if(state.card){state.card.classList.remove('p114-dragging');state.card.style.removeProperty('transform')}
    track._p114SuppressClickUntil=Date.now()+220;
    if(to!==from)chooseDay(track,list[to]);else instantCenter(track,list[from]);
    state.active=false;state.id=null;state.axis='';state.card=null;
  }
  track.addEventListener('pointerup',e=>finish(e,false),{capture:true,passive:false});
  track.addEventListener('pointercancel',e=>finish(e,true),{capture:true,passive:false});
  track.addEventListener('click',e=>{
    if(track._p114InternalClick)return;
    if((track._p114SuppressClickUntil||0)>Date.now()){e.preventDefault();e.stopImmediatePropagation()}
  },{capture:true});
}

function updatePills(mode){
  const day=document.getElementById('p114DayMode');
  const month=findButton('Mês');const year=findButton('Ano');const list=findButton('Lista');
  [day,month,year,list].filter(Boolean).forEach(b=>b.classList.remove('p114-mode-active'));
  const active=mode==='day'?day:mode==='month'?month:mode==='year'?year:mode==='list'?list:null;
  if(active)active.classList.add('p114-mode-active');
}
function setMode(mode){
  const v=view();if(!v)return;
  v.dataset.p114Mode=mode;updatePills(mode);
  if(mode==='day'){
    const track=v.querySelector('.ag-month');
    if(track){bindDaySwipe(track);const sel=track.querySelector('.ag-day.sel:not(.out)')||track.querySelector('.ag-day.today:not(.out)');if(sel)requestAnimationFrame(()=>instantCenter(track,sel))}
  }
}
function installModes(){
  const v=view();if(!v)return;
  const month=findButton('Mês'),year=findButton('Ano'),list=findButton('Lista');
  if(!month||!year)return;
  let day=document.getElementById('p114DayMode');
  if(!day){
    day=document.createElement('button');day.type='button';day.id='p114DayMode';day.className=month.className;day.textContent='Dia';
    month.insertAdjacentElement('beforebegin',day);
    day.addEventListener('click',()=>{
      const hasMonth=!!v.querySelector('.ag-month');
      if(hasMonth){setMode('day');return}
      v._p114GoDayAfterMonth=true;month.click();
    });
  }
  if(list)list.classList.add('p114-hide-mobile');
  if(month.dataset.p114ModeBound!=='1'){
    month.dataset.p114ModeBound='1';
    month.addEventListener('click',()=>setTimeout(()=>{
      if(v._p114GoDayAfterMonth){v._p114GoDayAfterMonth=false;setMode('day')}else setMode('month');
    },30));
  }
  if(year.dataset.p114ModeBound!=='1'){
    year.dataset.p114ModeBound='1';year.addEventListener('click',()=>setTimeout(()=>setMode('year'),20));
  }
  if(list&&list.dataset.p114ModeBound!=='1'){
    list.dataset.p114ModeBound='1';list.addEventListener('click',()=>setTimeout(()=>setMode('list'),20));
  }
  if(!v.dataset.p114Mode)setMode('day');else updatePills(v.dataset.p114Mode);

  if(v.dataset.p114MonthClick!=='1'){
    v.dataset.p114MonthClick='1';
    v.addEventListener('click',e=>{
      if(v.dataset.p114Mode!=='month')return;
      const d=e.target.closest('.ag-day:not(.out)');if(!d)return;
      const iso=d.dataset.iso||'';
      setTimeout(()=>{setMode('day');snapFresh(iso)},35);
    },true);
  }
}

function enhance(){
  addStyle();installModes();
  const v=view();if(!v)return;
  const track=v.querySelector('.ag-month');
  if(track&&v.dataset.p114Mode==='day')bindDaySwipe(track);
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;enhance()})}
function boot(){
  addStyle();enhance();
  const body=document.getElementById('agBody');
  if(!body){setTimeout(boot,220);return}
  const ob=new MutationObserver(schedule);ob.observe(body,{childList:true,subtree:true});
  window.CARBONAUTAS_AGENDA_SWIPE_BUILD=BUILD;
  window.CARBONAUTAS_AGENDA_VIEW_BUILD=BUILD;
  console.info('Carbonautas P114 · swipe curto + Dia/Mês/Ano ativo');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
