/* Carbonautas P211 · integra atividades compartilhadas aos dias + navegação desktop clara */
(function(){
'use strict';
if(window.__CARBONAUTAS_P211_AGENDA_INTEGRADA)return;
window.__CARBONAUTAS_P211_AGENDA_INTEGRADA=true;

const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
let liveActivities=[],unsubActivities=null,bindTimer=null,patchTimer=null;

function S(){try{return window.state||state||{}}catch(_e){return{}}}
function F(){try{return window.fbFns||(typeof FB==='function'?FB():null)}catch(_e){return window.fbFns||null}}
function mine(){try{return window.myId||myId||''}catch(_e){return''}}
function admin(){try{return !!(window.isAdmin??isAdmin)}catch(_e){return false}}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function done(a){return !!(a?.feito||Number(a?.progress)>=100||['concluido','concluído','feito','aprovado'].includes(String(a?.status||'').toLowerCase()))}
function memberName(id){return (S().members||[]).find(m=>String(m.id)===String(id))?.nome||''}
function relevant(a){const id=mine();if(!id||!a||done(a)||!a.dueDate)return false;const ids=Array.isArray(a.participantIds)?a.participantIds:[];return admin()||String(a.ownerId||'')===String(id)||ids.map(String).includes(String(id))}
function activities(){const src=liveActivities.length?liveActivities:(S().activities||[]);const map=new Map();src.forEach(a=>{if(a&&(a.agendaShared===true||a.type==='agenda')&&relevant(a))map.set(String(a.id||Math.random()),a)});return [...map.values()]}
function byDate(){const m=new Map();activities().forEach(a=>{const k=String(a.dueDate||'');if(!k)return;if(!m.has(k))m.set(k,[]);m.get(k).push(a)});for(const arr of m.values())arr.sort((a,b)=>String(a.dueTime||'').localeCompare(String(b.dueTime||'')));return m}

function css(){if($('#p211AgendaStyle'))return;const st=document.createElement('style');st.id='p211AgendaStyle';st.textContent=`
#viewCrono .p211-activity-dot{background:#11a6a0!important;box-shadow:0 0 0 2px rgba(255,255,255,.9)!important}
#viewCrono .p211-activity-card{border-left-color:#159d99!important;background:linear-gradient(145deg,#fff,#edf9f7)!important}
#viewCrono .p211-kind{display:inline-flex;align-items:center;gap:5px;margin-top:7px;padding:4px 8px;border-radius:999px;background:#e4f6f2;color:#16736f;font-size:10px;font-weight:900}
#p211DayNav{display:none}
@media(min-width:921px){
 #viewCrono[data-p114-mode="day"] .p211-daynav-wrap{position:relative!important}
 #viewCrono[data-p114-mode="day"] #p211DayNav{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:2px 0 5px;padding:0 4px}
 #viewCrono[data-p114-mode="day"] #p211DayNav button{display:flex;align-items:center;justify-content:center;gap:8px;min-width:150px;height:44px;border:1px solid #cfe0dd;border-radius:14px;background:#fff;color:#214a53;font-weight:900;font-size:13px;box-shadow:0 5px 18px rgba(25,66,69,.07);cursor:pointer}
 #viewCrono[data-p114-mode="day"] #p211DayNav button:hover{background:#eff9f7;border-color:#8fc9c1}
 #viewCrono[data-p114-mode="day"] #p211DayNav button:disabled{opacity:.32;cursor:default}
 #viewCrono[data-p114-mode="day"] #p211DayNav .p211-navhint{font-size:11px;font-weight:850;color:#71858b;text-align:center}
 #viewCrono[data-p114-mode="day"] .ag-month{cursor:grab!important}
 #viewCrono[data-p114-mode="day"] .ag-month:active{cursor:grabbing!important}
}
`;document.head.appendChild(st)}

function ensureNav(month){if(!month)return;let nav=$('#p211DayNav');if(!nav){nav=document.createElement('div');nav.id='p211DayNav';nav.innerHTML='<button type="button" data-p211-prev>← Dia anterior</button><span class="p211-navhint">Clique nas setas ou use a rodinha do mouse</span><button type="button" data-p211-next>Próximo dia →</button>';month.parentNode.insertBefore(nav,month);nav.querySelector('[data-p211-prev]').onclick=()=>stepDay(-1);nav.querySelector('[data-p211-next]').onclick=()=>stepDay(1)}
 const days=$$('.ag-day:not(.out)',month),sel=days.findIndex(d=>d.classList.contains('sel'));nav.querySelector('[data-p211-prev]').disabled=sel<=0;nav.querySelector('[data-p211-next]').disabled=sel<0||sel>=days.length-1;
 if(month.dataset.p211Wheel!=='1'){month.dataset.p211Wheel='1';month.addEventListener('wheel',e=>{if(!window.matchMedia('(min-width:921px)').matches)return;if(Math.abs(e.deltaY)<=Math.abs(e.deltaX))return;e.preventDefault();month.scrollLeft+=e.deltaY;},{passive:false})}
}
function stepDay(dir){const month=$('#viewCrono .ag-month');if(!month)return;const days=$$('.ag-day:not(.out)',month);let i=days.findIndex(d=>d.classList.contains('sel'));if(i<0)i=0;const n=Math.max(0,Math.min(days.length-1,i+dir));if(n===i)return;days[n].click();setTimeout(()=>{days[n]?.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'});schedulePatch(80)},20)}

function updateDays(map){const month=$('#viewCrono .ag-month');if(!month)return;$$('.ag-day:not(.out)',month).forEach(day=>{const iso=day.dataset.iso||'',arr=map.get(iso)||[];day.querySelectorAll('.p211-activity-dot').forEach(n=>n.remove());if(arr.length){let dots=day.querySelector('.ag-dots');if(!dots){dots=document.createElement('div');dots.className='ag-dots';day.appendChild(dots)}for(let i=0;i<Math.min(arr.length,3);i++){const dot=document.createElement('i');dot.className='p211-activity-dot';dot.title=arr[i].title||'Atividade';dots.appendChild(dot)}if(arr.length>3){let more=dots.querySelector('.p211-more');if(!more){more=document.createElement('b');more.className='p211-more';dots.appendChild(more)}more.textContent='+'+(arr.length-3)}}
 const cnt=day.querySelector('.p110-count');if(cnt){const dots=day.querySelectorAll('.ag-dots i').length;let extra=0;day.querySelectorAll('.ag-dots b:not(.p211-more)').forEach(b=>extra+=parseInt((b.textContent||'').replace(/\D/g,''),10)||0);const total=dots+extra;cnt.textContent=total?`${total} compromisso${total===1?'':'s'}`:'dia livre'}
 });ensureNav(month)}

function activityCard(a,i){const names=(a.participantIds||[]).map(memberName).filter(Boolean);const owner=a.ownerName||memberName(a.ownerId)||'';const who=[owner,names.length?'com '+names.slice(0,4).join(', ')+(names.length>4?' +'+(names.length-4):''):''].filter(Boolean).join(' · ');return `<article class="ag-item p110-event-card p211-activity-card" data-p110-tone="${i%5}" data-p211-activity="${esc(a.id||'')}"><div class="ag-time">${esc(a.dueTime||'—')}</div><div class="ag-main"><div class="ag-t">${esc(a.title||'Atividade')}</div>${who?`<div class="ag-who">${esc(who)}</div>`:''}${a.description?`<div class="ag-desc">${esc(a.description)}</div>`:''}<span class="p211-kind">✓ Atividade compartilhada</span></div></article>`}
function updateSelected(map){const selected=$('#viewCrono .ag-month .ag-day.sel');const iso=selected?.dataset.iso||'';if(!iso)return;const arr=map.get(iso)||[];const list=$('#viewCrono .ag-daylist');if(!list)return;list.querySelectorAll('.p211-activity-card').forEach(n=>n.remove());if(!arr.length)return;
 let track=list.querySelector('.p110-event-track');if(track){track.querySelectorAll('.p110-empty-card').forEach(n=>n.remove());track.insertAdjacentHTML('beforeend',arr.map(activityCard).join(''));const cards=$$('.p110-event-card',track);cards.forEach((c,i)=>c.dataset.p110Tone=String(i%5));const nav=list.querySelector('.p110-event-nav');if(nav){const idx=nav.querySelector('.p110-event-index');if(idx)idx.textContent=`1 de ${cards.length}`;nav.style.opacity=cards.length<=1?'.55':'1'}}else{list.querySelectorAll('.ag-empty').forEach(n=>n.remove());list.insertAdjacentHTML('beforeend',arr.map(activityCard).join(''))}}

function patch(){if(document.body?.dataset?.view!=='crono'&&document.body?.dataset?.view!=='agenda')return;css();const map=byDate();updateDays(map);updateSelected(map)}
function schedulePatch(ms=35){clearTimeout(patchTimer);patchTimer=setTimeout(patch,ms)}

function syncState(list){try{const s=S();if(s&&typeof s==='object'){const other=(s.activities||[]).filter(a=>!(a?.agendaShared===true||a?.type==='agenda'));s.activities=[...other,...list]}}catch(_e){}}
function bindLive(){if(unsubActivities)return true;const f=F();if(!f||!window.db||typeof f.onSnapshot!=='function'||typeof f.collection!=='function')return false;try{unsubActivities=f.onSnapshot(f.collection(window.db,'rede_activities'),snap=>{liveActivities=snap.docs.map(d=>({id:d.id,...d.data()}));syncState(liveActivities);schedulePatch(30)},err=>{console.warn('P211 atividades em tempo real indisponíveis',err);unsubActivities=null});return true}catch(e){console.warn('P211 bind activities',e);return false}}
function waitBind(){if(bindLive())return;let tries=0;clearInterval(bindTimer);bindTimer=setInterval(()=>{tries++;if(bindLive()||tries>40)clearInterval(bindTimer)},250)}

function boot(){css();waitBind();document.addEventListener('click',e=>{if(e.target.closest?.('#viewCrono .ag-day,#viewCrono #agModes button,#viewCrono #p114DayMode,.tab[data-view="crono"],.app-nav-card[data-app-view="crono"]'))schedulePatch(90)},true);document.addEventListener('keydown',e=>{if(!window.matchMedia('(min-width:921px)').matches||document.body?.dataset?.view!=='crono')return;if(e.key==='ArrowLeft'){e.preventDefault();stepDay(-1)}else if(e.key==='ArrowRight'){e.preventDefault();stepDay(1)}},true);const v=$('#viewCrono');if(v)new MutationObserver(()=>schedulePatch(70)).observe(v,{childList:true,subtree:true});new MutationObserver(()=>{if(document.body?.dataset?.view==='crono')schedulePatch(80)}).observe(document.body,{attributes:true,attributeFilter:['data-view']});setTimeout(()=>schedulePatch(0),250);setTimeout(()=>schedulePatch(0),900);console.info('Carbonautas P211 · atividades integradas aos dias + setas desktop')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
