/* Carbonautas P110 · Agenda realmente deslizante: dias corretos + baralho de compromissos */
(function(){
'use strict';
const STYLE_ID='p110AgendaDeckStyle';
const initializedMonths=new Set();
let scheduled=false;

function css(){
  if(document.getElementById(STYLE_ID)) return;
  const st=document.createElement('style');
  st.id=STYLE_ID;
  st.textContent=`
  #viewCrono .ag-month{
    display:flex!important;gap:16px!important;overflow-x:auto!important;overflow-y:visible!important;
    scroll-snap-type:x mandatory!important;scroll-behavior:smooth!important;-webkit-overflow-scrolling:touch!important;
    scrollbar-width:none!important;overscroll-behavior-x:contain!important;
    padding:22px 12vw 30px!important;margin:0 -12px!important;touch-action:pan-x pan-y!important;
  }
  #viewCrono .ag-month::-webkit-scrollbar,#viewCrono .p110-event-track::-webkit-scrollbar{display:none!important}
  #viewCrono .ag-dow{display:none!important}
  #viewCrono .ag-day.out{display:none!important}
  #viewCrono .ag-day{
    --p110-bg:#eef8f5;--p110-tab:#7fc8bb;
    flex:0 0 clamp(218px,72vw,268px)!important;width:clamp(218px,72vw,268px)!important;min-width:clamp(218px,72vw,268px)!important;
    min-height:184px!important;aspect-ratio:auto!important;position:relative!important;overflow:visible!important;
    display:flex!important;flex-direction:column!important;align-items:flex-start!important;justify-content:flex-start!important;
    padding:26px 20px 18px!important;gap:9px!important;border:1px solid rgba(86,125,126,.14)!important;
    border-radius:26px!important;background:linear-gradient(145deg,rgba(255,255,255,.98),var(--p110-bg))!important;
    box-shadow:0 14px 34px rgba(25,66,69,.08)!important;scroll-snap-align:center!important;scroll-snap-stop:always!important;
    opacity:.72!important;transform:translateY(8px) scale(.955)!important;
    transition:opacity .2s ease,transform .26s cubic-bezier(.2,.8,.2,1),box-shadow .22s ease,border-color .22s ease!important;
  }
  #viewCrono .ag-day:before{
    content:''!important;position:absolute!important;left:18px!important;top:-9px!important;width:72px!important;height:18px!important;
    border-radius:12px 12px 4px 4px!important;background:var(--p110-tab)!important;opacity:.74!important;
    box-shadow:0 2px 6px rgba(25,66,69,.05)!important;
  }
  #viewCrono .ag-day:after{display:none!important}
  #viewCrono .ag-day[data-p110-tone="0"]{--p110-bg:#eef9f6;--p110-tab:#7fc9bb}
  #viewCrono .ag-day[data-p110-tone="1"]{--p110-bg:#eff6ff;--p110-tab:#8ebee6}
  #viewCrono .ag-day[data-p110-tone="2"]{--p110-bg:#f6f1ff;--p110-tab:#b5a0df}
  #viewCrono .ag-day[data-p110-tone="3"]{--p110-bg:#fff8e9;--p110-tab:#e6c678}
  #viewCrono .ag-day[data-p110-tone="4"]{--p110-bg:#fff1f5;--p110-tab:#e5a7b9}
  #viewCrono .ag-day.sel{
    opacity:1!important;transform:translateY(-3px) scale(1)!important;border-color:rgba(74,166,156,.48)!important;
    box-shadow:0 22px 50px rgba(26,105,100,.16)!important;z-index:3!important;
    animation:p110CardLand .34s cubic-bezier(.18,.86,.32,1.18)!important;
  }
  #viewCrono .ag-day.today:not(.sel){border-color:rgba(62,170,158,.28)!important}
  #viewCrono .ag-day>span{
    width:auto!important;height:auto!important;margin:0!important;padding:0!important;background:transparent!important;box-shadow:none!important;
    font-family:'Fraunces',serif!important;font-size:54px!important;line-height:.94!important;font-weight:650!important;color:#173d47!important;
  }
  #viewCrono .ag-day.sel>span{color:#087c76!important}
  #viewCrono .p110-weekday{font-size:12px;font-weight:850;letter-spacing:.10em;text-transform:uppercase;color:#5d777d;margin-top:4px}
  #viewCrono .p110-count{font-size:12px;color:#73898f;margin-top:auto;display:flex;align-items:center;gap:6px}
  #viewCrono .p110-count:before{content:'';width:7px;height:7px;border-radius:50%;background:var(--p110-tab);display:inline-block}
  #viewCrono .p110-today{position:absolute;right:15px;top:14px;border-radius:999px;padding:5px 8px;background:rgba(255,255,255,.82);font-size:9px;font-weight:900;letter-spacing:.08em;color:#0a817a}
  #viewCrono .ag-dots{margin-top:4px!important;min-height:10px!important;gap:5px!important;justify-content:flex-start!important}
  #viewCrono .ag-dots i{width:7px!important;height:7px!important;border:0!important;box-shadow:0 0 0 2px rgba(255,255,255,.84)!important}
  #viewCrono .ag-dots b{font-size:10px!important;color:#617a80!important}

  #viewCrono .ag-daylist{display:block!important;overflow:visible!important;padding:0!important;margin:10px 0 0!important;position:relative!important}
  #viewCrono .ag-daylist>h4{position:static!important;margin:0 0 8px 2px!important;font-family:'Fraunces',serif!important;font-size:24px!important;line-height:1.1!important;color:#173d47!important;letter-spacing:-.025em!important}
  #viewCrono .p110-subtitle{font-size:11px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:#8a9a9e;margin:0 0 8px 3px}
  #viewCrono .p110-event-track{
    display:flex!important;gap:15px!important;overflow-x:auto!important;overflow-y:visible!important;scroll-snap-type:x mandatory!important;
    scroll-padding-inline:9vw!important;-webkit-overflow-scrolling:touch!important;scrollbar-width:none!important;
    padding:14px 9vw 30px!important;margin:0 -9vw!important;overscroll-behavior-x:contain!important;touch-action:pan-x pan-y!important;
  }
  #viewCrono .p110-event-card{
    --event-bg:#f2faf8;--event-edge:#7ecabc;
    flex:0 0 min(520px,82vw)!important;width:min(520px,82vw)!important;min-width:min(520px,82vw)!important;
    min-height:190px!important;scroll-snap-align:center!important;scroll-snap-stop:always!important;margin:0!important;
    border:1px solid rgba(91,128,129,.13)!important;border-left:5px solid var(--event-edge)!important;border-radius:26px!important;
    background:linear-gradient(145deg,#fff,var(--event-bg))!important;box-shadow:0 16px 38px rgba(25,66,69,.09)!important;
    opacity:.72!important;transform:translateY(7px) scale(.965)!important;
    transition:opacity .2s ease,transform .24s cubic-bezier(.2,.8,.2,1),box-shadow .2s ease!important;
  }
  #viewCrono .p110-event-card[data-p110-tone="0"]{--event-bg:#eff8ff;--event-edge:#86bce1}
  #viewCrono .p110-event-card[data-p110-tone="1"]{--event-bg:#f2faf7;--event-edge:#7fc6b4}
  #viewCrono .p110-event-card[data-p110-tone="2"]{--event-bg:#f7f2ff;--event-edge:#b5a0dd}
  #viewCrono .p110-event-card[data-p110-tone="3"]{--event-bg:#fff8ea;--event-edge:#dfbd69}
  #viewCrono .p110-event-card[data-p110-tone="4"]{--event-bg:#fff2f5;--event-edge:#dfa3b4}
  #viewCrono .p110-event-card.p110-current{opacity:1!important;transform:translateY(0) scale(1)!important;box-shadow:0 22px 48px rgba(25,66,69,.14)!important}
  #viewCrono .p110-event-card.ag-item{display:grid!important;grid-template-columns:62px minmax(0,1fr)!important;grid-template-rows:auto auto!important;align-items:start!important;gap:13px 12px!important;padding:18px 17px!important}
  #viewCrono .p110-event-card .ag-time{grid-column:1!important;grid-row:1!important;min-width:0!important;width:62px!important;min-height:58px!important;display:grid!important;place-items:center!important;padding:7px 4px!important;border-radius:16px!important;background:rgba(255,255,255,.76)!important;color:#5f777d!important;font-size:12px!important;line-height:1.25!important}
  #viewCrono .p110-event-card .ag-main{grid-column:2!important;grid-row:1!important;min-width:0!important;padding-top:2px!important}
  #viewCrono .p110-event-card .ag-t{white-space:normal!important;overflow:visible!important;text-overflow:clip!important;font-size:19px!important;line-height:1.18!important;color:#173d47!important}
  #viewCrono .p110-event-card .ag-who{font-size:12px!important;margin-top:7px!important;color:#72868b!important;flex-wrap:wrap!important}
  #viewCrono .p110-event-card .ag-desc{font-size:13px!important;line-height:1.5!important;margin-top:10px!important;color:#4e666c!important}
  #viewCrono .p110-event-card .ag-act{grid-column:1/-1!important;grid-row:2!important;justify-content:flex-end!important;gap:7px!important;margin-top:auto!important}
  #viewCrono .p110-event-card .ag-act button{width:38px!important;height:38px!important;border-radius:13px!important;border:0!important;background:rgba(255,255,255,.82)!important;box-shadow:0 3px 10px rgba(25,66,69,.06)!important}
  #viewCrono .p110-event-card .ag-act button.ok{background:#dff5e6!important;color:#217c45!important}
  #viewCrono .p110-empty-card{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;text-align:center!important;padding:28px!important;border-style:solid!important;color:#5b747a!important}
  #viewCrono .p110-empty-card .p110-empty-icon{font-size:36px;margin-bottom:10px}
  #viewCrono .p110-empty-card b{font-family:'Fraunces',serif;font-size:24px;color:#234a54;margin-bottom:6px}
  #viewCrono .p110-empty-card span{font-size:13px;color:#829397}
  #viewCrono .p110-event-nav{display:flex;align-items:center;justify-content:center;gap:12px;margin:-8px 0 6px}
  #viewCrono .p110-event-nav button{width:38px;height:38px;border:0;border-radius:14px;background:#fff;color:#315d65;box-shadow:0 5px 18px rgba(25,66,69,.07);font-size:22px;line-height:1}
  #viewCrono .p110-event-nav button:disabled{opacity:.28}
  #viewCrono .p110-event-index{min-width:76px;text-align:center;font-size:11px;font-weight:850;letter-spacing:.08em;text-transform:uppercase;color:#72868b}

  @keyframes p110CardLand{0%{opacity:.35;transform:translateY(-20px) rotate(1.2deg) scale(.97)}65%{opacity:1;transform:translateY(2px) rotate(-.35deg) scale(1.01)}100%{opacity:1;transform:translateY(-3px) rotate(0) scale(1)}}
  @media(max-width:640px){
    #viewCrono .crono-wrap{padding-left:16px!important;padding-right:16px!important}
    #viewCrono .ag-month{gap:13px!important;padding:18px 11vw 28px!important;margin:0 -16px!important}
    #viewCrono .ag-day{flex-basis:72vw!important;width:72vw!important;min-width:72vw!important;max-width:255px!important;min-height:178px!important;padding:24px 18px 17px!important;border-radius:24px!important}
    #viewCrono .ag-day>span{font-size:49px!important}
    #viewCrono .ag-daylist>h4{font-size:22px!important;margin-left:1px!important}
    #viewCrono .p110-event-track{padding:12px 8vw 28px!important;margin:0 -8vw!important}
    #viewCrono .p110-event-card{flex-basis:84vw!important;width:84vw!important;min-width:84vw!important;max-width:540px!important;min-height:188px!important;border-radius:24px!important}
    #viewCrono .p110-event-card.ag-item{grid-template-columns:54px minmax(0,1fr)!important;padding:16px 14px!important;gap:11px 10px!important}
    #viewCrono .p110-event-card .ag-time{width:54px!important;min-height:52px!important;font-size:11px!important;border-radius:14px!important}
    #viewCrono .p110-event-card .ag-t{font-size:18px!important}
  }
  @media(prefers-reduced-motion:reduce){#viewCrono .ag-day,#viewCrono .p110-event-card{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
  `;
  document.head.appendChild(st);
}

function fmtWeekday(iso){
  try{
    const d=new Date(iso+'T12:00:00');
    let s=d.toLocaleDateString('pt-BR',{weekday:'long'}).replace('-feira','');
    return s.charAt(0).toUpperCase()+s.slice(1);
  }catch(_e){return ''}
}
function countEvents(day){
  const dots=day.querySelectorAll('.ag-dots i').length;
  const more=day.querySelector('.ag-dots b');
  const n=more?parseInt((more.textContent||'').replace(/\D/g,''),10)||0:0;
  return dots+n;
}
function decorateDay(day){
  if(day.classList.contains('out')) return;
  const iso=day.dataset.iso||'';
  const n=parseInt(iso.slice(-2),10)||1;
  day.dataset.p110Tone=String(n%5);
  let wd=day.querySelector('.p110-weekday');
  if(!wd){wd=document.createElement('div');wd.className='p110-weekday';day.appendChild(wd)}
  wd.textContent=fmtWeekday(iso);
  let cnt=day.querySelector('.p110-count');
  if(!cnt){cnt=document.createElement('div');cnt.className='p110-count';day.appendChild(cnt)}
  const total=countEvents(day);
  cnt.textContent=total?`${total} compromisso${total===1?'':'s'}`:'dia livre';
  if(day.classList.contains('today')&&!day.querySelector('.p110-today')){
    const t=document.createElement('div');t.className='p110-today';t.textContent='HOJE';day.appendChild(t);
  }
}
function monthKey(month){
  const first=[...month.querySelectorAll('.ag-day:not(.out)')][0];
  return first?.dataset?.iso?.slice(0,7)||'';
}
function centerDay(month,day,behavior='auto'){
  if(!month||!day) return;
  const left=day.offsetLeft-(month.clientWidth-day.offsetWidth)/2;
  month._p110Programmatic=true;
  month.scrollTo({left:Math.max(0,left),behavior});
  clearTimeout(month._p110ProgrammaticTimer);
  month._p110ProgrammaticTimer=setTimeout(()=>{month._p110Programmatic=false},behavior==='smooth'?420:80);
}
function nearestCard(track,selector){
  const cards=[...track.querySelectorAll(selector)].filter(el=>getComputedStyle(el).display!=='none');
  if(!cards.length) return null;
  const center=track.scrollLeft+track.clientWidth/2;
  let best=cards[0],dist=Infinity;
  cards.forEach(c=>{const d=Math.abs((c.offsetLeft+c.offsetWidth/2)-center);if(d<dist){dist=d;best=c}});
  return best;
}
function bindMonth(month){
  if(month.dataset.p110Bound==='1') return;
  month.dataset.p110Bound='1';
  let timer=null,startX=0,startY=0,moved=false;
  month.addEventListener('touchstart',e=>{const t=e.touches&&e.touches[0];if(!t)return;startX=t.clientX;startY=t.clientY;moved=false},{passive:true});
  month.addEventListener('touchmove',e=>{const t=e.touches&&e.touches[0];if(!t)return;if(Math.abs(t.clientX-startX)>10&&Math.abs(t.clientX-startX)>Math.abs(t.clientY-startY))moved=true},{passive:true});
  month.addEventListener('touchend',()=>{if(moved)month._p110SuppressClickUntil=Date.now()+420},{passive:true});
  month.addEventListener('click',e=>{if((month._p110SuppressClickUntil||0)>Date.now()){e.preventDefault();e.stopImmediatePropagation()}},true);
  month.addEventListener('scroll',()=>{
    if(month._p110Programmatic) return;
    clearTimeout(timer);
    timer=setTimeout(()=>{
      const near=nearestCard(month,'.ag-day:not(.out)');
      const sel=month.querySelector('.ag-day.sel:not(.out)');
      if(near&&near!==sel) near.click();
    },135);
  },{passive:true});
}
function normalizeInitial(month){
  const key=monthKey(month);
  if(!key||initializedMonths.has(key)) return false;
  initializedMonths.add(key);
  const days=[...month.querySelectorAll('.ag-day:not(.out)')];
  if(!days.length) return false;
  const today=days.find(d=>d.classList.contains('today'));
  const selected=days.find(d=>d.classList.contains('sel'));
  const target=today||selected||days[0];
  if(target&&target!==selected){setTimeout(()=>target.click(),0);return true}
  return false;
}
function enhanceMonth(){
  const month=document.querySelector('#viewCrono .ag-month');
  if(!month) return;
  [...month.querySelectorAll('.ag-day')].forEach(decorateDay);
  bindMonth(month);
  if(normalizeInitial(month)) return;
  const selected=month.querySelector('.ag-day.sel:not(.out)')||month.querySelector('.ag-day.today:not(.out)')||month.querySelector('.ag-day:not(.out)');
  if(selected) requestAnimationFrame(()=>centerDay(month,selected,'auto'));
}

function setEventCurrent(track,index){
  const cards=[...track.querySelectorAll('.p110-event-card')];
  if(!cards.length) return;
  index=Math.max(0,Math.min(index,cards.length-1));
  cards.forEach((c,i)=>c.classList.toggle('p110-current',i===index));
  const nav=track.parentElement?.querySelector('.p110-event-nav');
  if(nav){
    const label=nav.querySelector('.p110-event-index');if(label)label.textContent=`${index+1} de ${cards.length}`;
    const prev=nav.querySelector('[data-p110-prev]');const next=nav.querySelector('[data-p110-next]');
    if(prev)prev.disabled=index===0;if(next)next.disabled=index===cards.length-1;
  }
  track.dataset.p110Index=String(index);
}
function scrollEventTo(track,index){
  const cards=[...track.querySelectorAll('.p110-event-card')];
  const card=cards[index];if(!card)return;
  const left=card.offsetLeft-(track.clientWidth-card.offsetWidth)/2;
  track.scrollTo({left:Math.max(0,left),behavior:'smooth'});
  setEventCurrent(track,index);
}
function bindEventTrack(track){
  if(track.dataset.p110Bound==='1')return;
  track.dataset.p110Bound='1';
  let timer=null;
  track.addEventListener('scroll',()=>{
    clearTimeout(timer);
    timer=setTimeout(()=>{
      const near=nearestCard(track,'.p110-event-card');
      if(!near)return;
      const cards=[...track.querySelectorAll('.p110-event-card')];
      setEventCurrent(track,cards.indexOf(near));
    },120);
  },{passive:true});
}
function enhanceDayList(){
  const list=document.querySelector('#viewCrono .ag-daylist');
  if(!list||list.dataset.p110Ready==='1') return;
  list.dataset.p110Ready='1';
  const h=list.querySelector(':scope > h4');
  if(h){const sub=document.createElement('div');sub.className='p110-subtitle';sub.textContent='Deslize os cards para ver o dia';h.insertAdjacentElement('afterend',sub)}
  const directItems=[...list.children].filter(el=>el.classList&&el.classList.contains('ag-item'));
  const directEmpty=[...list.children].find(el=>el.classList&&el.classList.contains('ag-empty'));
  const track=document.createElement('div');track.className='p110-event-track';
  if(directItems.length){
    directItems.forEach((item,i)=>{item.classList.add('p110-event-card');item.dataset.p110Tone=String(i%5);track.appendChild(item)});
  }else if(directEmpty){
    directEmpty.classList.add('p110-event-card','p110-empty-card');directEmpty.dataset.p110Tone='1';
    directEmpty.innerHTML='<div class="p110-empty-icon">🌿</div><b>Dia livre</b><span>Nada marcado neste dia.</span>';track.appendChild(directEmpty);
  }else{return}
  list.appendChild(track);
  const cards=[...track.querySelectorAll('.p110-event-card')];
  const nav=document.createElement('div');nav.className='p110-event-nav';
  nav.innerHTML='<button type="button" data-p110-prev aria-label="Card anterior">‹</button><span class="p110-event-index"></span><button type="button" data-p110-next aria-label="Próximo card">›</button>';
  list.appendChild(nav);
  nav.querySelector('[data-p110-prev]').onclick=()=>scrollEventTo(track,(parseInt(track.dataset.p110Index||'0',10)||0)-1);
  nav.querySelector('[data-p110-next]').onclick=()=>scrollEventTo(track,(parseInt(track.dataset.p110Index||'0',10)||0)+1);
  if(cards.length<=1) nav.style.opacity='.55';
  bindEventTrack(track);setEventCurrent(track,0);requestAnimationFrame(()=>scrollEventTo(track,0));
}

function enhance(){css();enhanceMonth();enhanceDayList()}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;enhance()})}
function boot(){
  css();
  const body=document.getElementById('agBody');
  if(!body){setTimeout(boot,300);return}
  enhance();
  const ob=new MutationObserver(schedule);ob.observe(body,{childList:true,subtree:true});
  window.CARBONAUTAS_AGENDA_DECK_BUILD='P110';
  console.info('Carbonautas P110 agenda deslizante ativa');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
