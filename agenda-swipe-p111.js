/* Carbonautas P111 · Swipe reto e previsível na agenda. Somente interação/apresentação. */
(function(){
'use strict';
const BUILD='P111';
const STYLE_ID='p111AgendaSwipeStyle';

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
    #viewCrono .ag-month.p111-dragging,
    #viewCrono .p110-event-track.p111-dragging{
      scroll-snap-type:none!important;
      scroll-behavior:auto!important;
      user-select:none!important;
      -webkit-user-select:none!important;
    }
    #viewCrono .ag-day,
    #viewCrono .p110-event-card{scroll-snap-stop:always!important}
  `;
  document.head.appendChild(st);
}

function visibleCards(track,selector){
  return [...track.querySelectorAll(selector)].filter(el=>getComputedStyle(el).display!=='none');
}
function nearestIndex(track,cards){
  if(!cards.length) return 0;
  const center=track.scrollLeft+track.clientWidth/2;
  let best=0,dist=Infinity;
  cards.forEach((card,i)=>{
    const d=Math.abs((card.offsetLeft+card.offsetWidth/2)-center);
    if(d<dist){dist=d;best=i}
  });
  return best;
}
function center(track,card,behavior='smooth'){
  if(!track||!card)return;
  const left=card.offsetLeft-(track.clientWidth-card.offsetWidth)/2;
  track.scrollTo({left:Math.max(0,left),behavior});
}
function updateEventCurrent(track,index,cards){
  cards=cards||visibleCards(track,'.p110-event-card');
  if(!cards.length)return;
  index=Math.max(0,Math.min(index,cards.length-1));
  cards.forEach((c,i)=>c.classList.toggle('p110-current',i===index));
  track.dataset.p110Index=String(index);
  const nav=track.parentElement?.querySelector('.p110-event-nav');
  if(nav){
    const label=nav.querySelector('.p110-event-index');
    if(label)label.textContent=`${index+1} de ${cards.length}`;
    const prev=nav.querySelector('[data-p110-prev]');
    const next=nav.querySelector('[data-p110-next]');
    if(prev)prev.disabled=index===0;
    if(next)next.disabled=index===cards.length-1;
  }
}

function bindStraightSwipe(track,kind){
  if(!track||track.dataset.p111Bound==='1')return;
  track.dataset.p111Bound='1';
  const selector=kind==='day'?'.ag-day:not(.out)':'.p110-event-card';
  let active=false,locked='',pointerId=null,startX=0,startY=0,startScroll=0,startTime=0,startIndex=0,lastX=0;

  function cleanup(){
    active=false;locked='';pointerId=null;
    track.classList.remove('p111-dragging');
  }
  function down(e){
    if(e.pointerType==='mouse'&&e.button!==0)return;
    if(e.target.closest('button,a,input,select,textarea'))return;
    const cards=visibleCards(track,selector);if(!cards.length)return;
    active=true;locked='';pointerId=e.pointerId;startX=e.clientX;lastX=e.clientX;startY=e.clientY;
    startScroll=track.scrollLeft;startTime=performance.now();startIndex=nearestIndex(track,cards);
  }
  function move(e){
    if(!active||e.pointerId!==pointerId)return;
    const dx=e.clientX-startX,dy=e.clientY-startY;
    lastX=e.clientX;
    if(!locked&&Math.max(Math.abs(dx),Math.abs(dy))>7){
      if(Math.abs(dx)>Math.abs(dy)*1.18){
        locked='x';track.classList.add('p111-dragging');
        /* impede o listener do P110 de trocar o dia enquanto o dedo ainda está se movendo */
        track._p110Programmatic=true;
        try{track.setPointerCapture(e.pointerId)}catch(_e){}
      }else if(Math.abs(dy)>Math.abs(dx)*1.05){
        locked='y';track._p110Programmatic=false;
      }
    }
    if(locked==='x'){
      e.preventDefault();
      track.scrollLeft=startScroll-dx;
    }
  }
  function up(e){
    if(!active||e.pointerId!==pointerId)return;
    const cards=visibleCards(track,selector);
    const dx=(Number.isFinite(e.clientX)?e.clientX:lastX)-startX;
    const elapsed=Math.max(1,performance.now()-startTime);
    const velocity=Math.abs(dx)/elapsed;
    const cardWidth=cards[startIndex]?.offsetWidth||220;
    const threshold=Math.min(62,Math.max(34,cardWidth*.16));
    let targetIndex=startIndex;

    if(locked==='x'){
      e.preventDefault();
      const decisive=Math.abs(dx)>=threshold||velocity>.42;
      if(decisive) targetIndex=startIndex+(dx<0?1:-1);
      targetIndex=Math.max(0,Math.min(targetIndex,cards.length-1));
      track._p111SuppressClickUntil=Date.now()+380;
      track._p110SuppressClickUntil=0;

      if(kind==='day'){
        const target=cards[targetIndex];
        if(target){
          /* Uma única decisão no final do gesto. O render nativo atualiza título + compromissos. */
          if(target.classList.contains('sel')){
            center(track,target,'smooth');
            setTimeout(()=>{track._p110Programmatic=false},360);
          }else{
            target.click();
          }
        }
      }else{
        const target=cards[targetIndex];
        updateEventCurrent(track,targetIndex,cards);
        if(target)center(track,target,'smooth');
        setTimeout(()=>{track._p110Programmatic=false},360);
      }
    }else{
      track._p110Programmatic=false;
    }
    cleanup();
  }
  function cancel(){track._p110Programmatic=false;cleanup()}

  track.addEventListener('pointerdown',down,{passive:true});
  track.addEventListener('pointermove',move,{passive:false});
  track.addEventListener('pointerup',up,{passive:false});
  track.addEventListener('pointercancel',cancel,{passive:true});
  track.addEventListener('click',e=>{
    if((track._p111SuppressClickUntil||0)>Date.now()){
      e.preventDefault();e.stopImmediatePropagation();
    }
  },true);
}

function enhance(){
  addStyle();
  const month=document.querySelector('#viewCrono .ag-month');
  if(month)bindStraightSwipe(month,'day');
  document.querySelectorAll('#viewCrono .p110-event-track').forEach(t=>bindStraightSwipe(t,'event'));
}
function boot(){
  addStyle();enhance();
  const body=document.getElementById('agBody');
  if(!body){setTimeout(boot,250);return}
  const ob=new MutationObserver(()=>requestAnimationFrame(enhance));
  ob.observe(body,{childList:true,subtree:true});
  window.CARBONAUTAS_AGENDA_SWIPE_BUILD=BUILD;
  console.info('Carbonautas P111 swipe reto ativo');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
