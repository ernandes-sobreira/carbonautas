/* Carbonautas P113 · Um único controlador de swipe da Agenda. Somente interação/apresentação. */
(function(){
'use strict';
const BUILD='P113';
const STYLE_ID='p113AgendaSwipeStyle';

function addStyle(){
  if(document.getElementById(STYLE_ID)) return;
  const st=document.createElement('style');
  st.id=STYLE_ID;
  st.textContent=`
    #viewCrono .ag-month,
    #viewCrono .p110-event-track{
      touch-action:pan-y!important;
      overscroll-behavior-x:none!important;
      scroll-snap-type:x mandatory!important;
      scroll-behavior:smooth!important;
    }
    #viewCrono .ag-day,
    #viewCrono .p110-event-card{
      scroll-snap-stop:always!important;
      will-change:transform;
    }
    #viewCrono .p113-drag-card{
      transition:none!important;
      z-index:8!important;
    }
  `;
  document.head.appendChild(st);
}

function cards(track,kind){
  const selector=kind==='day'?'.ag-day:not(.out)':'.p110-event-card';
  return [...track.querySelectorAll(selector)].filter(el=>getComputedStyle(el).display!=='none');
}
function selectedIndex(track,list,kind){
  if(!list.length) return 0;
  if(kind==='day'){
    const sel=track.querySelector('.ag-day.sel:not(.out)') || track.querySelector('.ag-day.today:not(.out)');
    const i=list.indexOf(sel);
    return i>=0?i:0;
  }
  const marked=track.querySelector('.p110-event-card.p110-current');
  const markedIndex=list.indexOf(marked);
  if(markedIndex>=0) return markedIndex;
  const n=parseInt(track.dataset.p110Index||'0',10);
  return Number.isFinite(n)?Math.max(0,Math.min(n,list.length-1)):0;
}
function center(track,card,behavior='smooth'){
  if(!track||!card)return;
  const left=card.offsetLeft-(track.clientWidth-card.offsetWidth)/2;
  track._p110Programmatic=true;
  track.scrollTo({left:Math.max(0,left),behavior});
  clearTimeout(track._p113CenterTimer);
  track._p113CenterTimer=setTimeout(()=>{track._p110Programmatic=false},behavior==='smooth'?380:80);
}
function setEventCurrent(track,index,list){
  list=list||cards(track,'event');
  if(!list.length)return;
  index=Math.max(0,Math.min(index,list.length-1));
  list.forEach((c,i)=>c.classList.toggle('p110-current',i===index));
  track.dataset.p110Index=String(index);
  const nav=track.parentElement?.querySelector('.p110-event-nav');
  if(nav){
    const label=nav.querySelector('.p110-event-index');
    if(label)label.textContent=`${index+1} de ${list.length}`;
    const prev=nav.querySelector('[data-p110-prev]');
    const next=nav.querySelector('[data-p110-next]');
    if(prev)prev.disabled=index===0;
    if(next)next.disabled=index===list.length-1;
  }
}
function chooseDay(track,target){
  if(!target)return;
  const iso=target.dataset.iso||'';
  track._p110SuppressClickUntil=0;
  track._p111SuppressClickUntil=0;
  track._p112InternalClick=true;
  track._p113InternalClick=true;
  try{ target.click(); }finally{
    track._p113InternalClick=false;
    track._p112InternalClick=false;
  }
  setTimeout(()=>{
    const freshTrack=document.querySelector('#viewCrono .ag-month');
    const fresh=iso?freshTrack?.querySelector(`.ag-day[data-iso="${iso}"]:not(.out)`):null;
    if(freshTrack&&fresh) center(freshTrack,fresh,'smooth');
  },50);
}
function clearDrag(state){
  const card=state.dragCard;
  if(card){
    card.classList.remove('p113-drag-card');
    card.style.removeProperty('transform');
  }
  state.dragCard=null;
}

function bind(track,kind){
  if(!track||track.dataset.p113Bound==='1')return;
  track.dataset.p113Bound='1';
  const state={active:false,id:null,startX:0,startY:0,lastX:0,axis:'',startIndex:0,dragCard:null,startTime:0};

  /* P110 usa touch e P111/P112 usa pointer. Estes capturadores impedem ambos de dirigir o mesmo gesto. */
  ['touchstart','touchmove','touchend','touchcancel'].forEach(type=>{
    track.addEventListener(type,e=>{e.stopImmediatePropagation()}, {capture:true,passive:true});
  });
  track.addEventListener('scroll',e=>{
    /* impede o P110 de escolher "o card mais próximo" enquanto outro controlador já escolhe o dia */
    e.stopImmediatePropagation();
  },{capture:true,passive:true});

  track.addEventListener('pointerdown',e=>{
    if(!e.isPrimary)return;
    if(e.pointerType==='mouse'&&e.button!==0)return;
    if(e.target.closest('button,a,input,select,textarea'))return;
    e.stopImmediatePropagation();
    const list=cards(track,kind);if(!list.length)return;
    state.active=true;state.id=e.pointerId;state.startX=e.clientX;state.lastX=e.clientX;state.startY=e.clientY;
    state.axis='';state.startIndex=selectedIndex(track,list,kind);state.startTime=performance.now();
    state.dragCard=list[state.startIndex]||null;
    track._p110Programmatic=true;
    try{track.setPointerCapture(e.pointerId)}catch(_e){}
  },{capture:true,passive:true});

  track.addEventListener('pointermove',e=>{
    if(!state.active||e.pointerId!==state.id)return;
    e.stopImmediatePropagation();
    const dx=e.clientX-state.startX,dy=e.clientY-state.startY;
    state.lastX=e.clientX;
    if(!state.axis&&Math.max(Math.abs(dx),Math.abs(dy))>=8){
      state.axis=Math.abs(dx)>Math.abs(dy)*1.2?'x':'y';
    }
    if(state.axis==='x'){
      e.preventDefault();
      const limited=Math.max(-72,Math.min(72,dx*.34));
      if(state.dragCard){
        state.dragCard.classList.add('p113-drag-card');
        const base=kind==='day'?'translateY(-3px) scale(1)':'translateY(0) scale(1)';
        state.dragCard.style.setProperty('transform',`translateX(${limited}px) ${base}`,'important');
      }
    }
  },{capture:true,passive:false});

  function finish(e,cancelled){
    if(!state.active||e.pointerId!==state.id)return;
    e.stopImmediatePropagation();
    const dx=(Number.isFinite(e.clientX)?e.clientX:state.lastX)-state.startX;
    const elapsed=Math.max(1,performance.now()-state.startTime);
    const speed=Math.abs(dx)/elapsed;
    const list=cards(track,kind);
    const from=Math.max(0,Math.min(state.startIndex,list.length-1));
    let to=from;
    if(!cancelled&&state.axis==='x'&&(Math.abs(dx)>=44||speed>.5)) to=from+(dx<0?1:-1);
    to=Math.max(0,Math.min(to,list.length-1));
    clearDrag(state);
    track._p113SuppressClickUntil=Date.now()+360;

    if(kind==='day'){
      if(to!==from) chooseDay(track,list[to]);
      else center(track,list[from],'smooth');
    }else{
      setEventCurrent(track,to,list);
      center(track,list[to],'smooth');
    }
    state.active=false;state.id=null;state.axis='';
  }
  track.addEventListener('pointerup',e=>finish(e,false),{capture:true,passive:false});
  track.addEventListener('pointercancel',e=>finish(e,true),{capture:true,passive:false});
  track.addEventListener('click',e=>{
    if(track._p113InternalClick)return;
    if((track._p113SuppressClickUntil||0)>Date.now()){
      e.preventDefault();e.stopImmediatePropagation();
    }
  },{capture:true});
}

function enhance(){
  addStyle();
  const month=document.querySelector('#viewCrono .ag-month');
  if(month)bind(month,'day');
  document.querySelectorAll('#viewCrono .p110-event-track').forEach(t=>bind(t,'event'));
}
function boot(){
  addStyle();enhance();
  const body=document.getElementById('agBody');
  if(!body){setTimeout(boot,220);return}
  const ob=new MutationObserver(()=>requestAnimationFrame(enhance));
  ob.observe(body,{childList:true,subtree:true});
  window.CARBONAUTAS_AGENDA_SWIPE_BUILD=BUILD;
  console.info('Carbonautas P113 controlador único de swipe ativo');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
