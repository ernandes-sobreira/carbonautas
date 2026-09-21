/* Carbonautas P213 · núcleo unificado da Agenda
   Objetivos:
   - uma única leitura visual para eventos, privados, prazos e atividades compartilhadas
   - atividade em rede_activities conta no cartão do dia e aparece no detalhe do dia
   - navegação explícita no desktop (Anterior / Próximo), além de clique e roda do mouse
   - não toca em autenticação, chat, repositório ou regras do Firebase
*/
(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.CARBONAUTAS_AGENDA_P213=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';

const BUILD='P213';
const hasDocument=()=>typeof document!=='undefined';
const $=(s,r)=>hasDocument()?(r||document).querySelector(s):null;
const $$=(s,r)=>hasDocument()?Array.from((r||document).querySelectorAll(s)):[];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function state(){
  try{return root?.state||((typeof globalThis!=='undefined'&&globalThis.state)||{})||{}}catch(_e){return{}}
}
function myId(){
  try{return String(root?.myId??globalThis.myId??'')}catch(_e){return''}
}
function isAdmin(){
  try{return !!(root?.isAdmin??globalThis.isAdmin)}catch(_e){return false}
}
function memberById(id,s=state()){
  return (s.members||[]).find(m=>String(m?.id)===String(id))||null;
}
function normalizeDate(v){
  if(!v)return'';
  if(typeof v==='string'){
    const m=v.match(/^(\d{4})-(\d{2})-(\d{2})/);if(m)return `${m[1]}-${m[2]}-${m[3]}`;
    const d=new Date(v);if(!Number.isNaN(d.getTime()))return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    return'';
  }
  try{
    const d=typeof v.toDate==='function'?v.toDate():v instanceof Date?v:null;
    if(d&&!Number.isNaN(d.getTime()))return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }catch(_e){}
  return'';
}
function todayIso(){return normalizeDate(new Date())}
function done(x){
  if(!x)return false;
  if(x.feito===true||Number(x.progress)>=100)return true;
  const s=String(x.status||'').trim().toLowerCase();
  return ['concluido','concluído','feito','aprovado','finalizado','finalizada'].includes(s);
}
function participantIds(x){
  const a=Array.isArray(x?.participantIds)?x.participantIds:[];
  const b=Array.isArray(x?.notifyMemberIds)?x.notifyMemberIds:[];
  return [...new Set([...a,...b].filter(Boolean).map(String))];
}
function relevantSchedule(e,id,admin){
  const ids=participantIds(e);
  if(!ids.length)return true;
  return admin||ids.includes(String(id));
}
function collectAgendaItems(s=state(),id=myId(),admin=isAdmin()){
  id=String(id||'');
  const out=[];
  (s.schedule||[]).forEach(e=>{
    const date=normalizeDate(e?.data||e?.date||e?.dueDate);if(!date||e?.feito===true||!relevantSchedule(e,id,admin))return;
    out.push({kind:'grupo',id:String(e.id||''),date,time:String(e.hora||e.time||''),title:e.titulo||e.title||'Evento do grupo',desc:e.descricao||e.description||'',local:e.local||'',participants:participantIds(e),raw:e});
  });
  (s.privateSchedule||[]).forEach(e=>{
    const date=normalizeDate(e?.data||e?.date||e?.dueDate);if(!date||e?.feito===true)return;
    out.push({kind:'privado',id:String(e.id||''),date,time:String(e.hora||e.time||''),title:e.titulo||e.title||'Compromisso privado',desc:e.descricao||e.description||'',local:e.local||'',participants:id?[id]:[],raw:e});
  });
  const me=memberById(id,s);
  (me?.prazos||[]).forEach((p,i)=>{
    const date=normalizeDate(p?.data||p?.date||p?.dueDate);if(!date||p?.feito===true)return;
    out.push({kind:'prazo',id:`${id}::${i}`,date,time:String(p.hora||p.time||''),title:p.titulo||p.title||'Prazo',desc:p.descricao||p.description||'',local:p.local||'',participants:id?[id]:[],raw:p});
  });
  (s.activities||[]).forEach(a=>{
    if(!(a?.agendaShared===true||String(a?.type||'')==='agenda'))return;
    if(done(a))return;
    const date=normalizeDate(a.dueDate||a.data||a.date||a.startDate);if(!date)return;
    const ids=Array.isArray(a.participantIds)?a.participantIds.filter(Boolean).map(String):[];
    const owner=String(a.ownerId||'');
    if(!admin&&owner!==id&&!ids.includes(id))return;
    out.push({kind:'atividade',id:String(a.id||''),date,time:String(a.dueTime||a.hora||a.time||''),title:a.title||a.titulo||'Atividade',desc:a.description||a.descricao||'',local:a.local||'',participants:[...new Set([owner,...ids].filter(Boolean))],ownerId:owner,raw:a});
  });
  return out.sort((a,b)=>`${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`,'pt-BR'));
}
function itemsForDate(date,s=state(),id=myId(),admin=isAdmin()){
  const iso=normalizeDate(date);return collectAgendaItems(s,id,admin).filter(x=>x.date===iso);
}
function countForDate(date,s=state(),id=myId(),admin=isAdmin()){return itemsForDate(date,s,id,admin).length}
function signature(s=state(),id=myId(),admin=isAdmin()){
  return collectAgendaItems(s,id,admin).map(x=>[x.kind,x.id,x.date,x.time,x.title,x.participants.join(',')].join('|')).join('§');
}
function fmtLong(iso){
  try{return new Date(iso+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'})}catch(_e){return iso}
}
function fmtShort(iso){
  try{return new Date(iso+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}catch(_e){return iso}
}
function names(ids,s=state()){
  return ids.map(id=>memberById(id,s)?.nome).filter(Boolean);
}

let selectedDate='';
let wrapped=false;
let lastSig='';
let pollTimer=0;
let rendering=false;
let pending=false;

function css(){
  if(!hasDocument()||$('#p213AgendaStyle'))return;
  const st=document.createElement('style');st.id='p213AgendaStyle';st.textContent=`
  #viewCrono .ag-daylist{display:none!important}
  #viewCrono .p110-subtitle,#viewCrono .p110-event-nav{display:none!important}
  #p213AgendaDay{margin:18px 0 34px;border:1px solid #d9e7e4;border-radius:24px;background:#fff;box-shadow:0 12px 32px rgba(24,66,70,.07);overflow:hidden}
  .p213-head{display:flex;align-items:center;gap:12px;padding:17px 19px;border-bottom:1px solid #e3ecea;background:linear-gradient(145deg,#fbfefd,#f3faf8)}
  .p213-head-main{flex:1;min-width:0}.p213-kicker{font-size:10px;font-weight:950;letter-spacing:.11em;text-transform:uppercase;color:#168f94}.p213-title{font-family:'Fraunces',serif;font-size:25px;line-height:1.08;color:#173d47;margin-top:3px;text-transform:capitalize}.p213-total{font-size:11px;font-weight:900;color:#688087;white-space:nowrap}
  .p213-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;padding:16px}.p213-item{border:1px solid #dce8e5;border-radius:17px;background:#fbfdfd;padding:14px;display:grid;grid-template-columns:64px minmax(0,1fr);gap:12px;align-items:start;cursor:pointer}.p213-time{min-height:52px;border-radius:14px;background:#edf7f5;display:grid;place-items:center;text-align:center;padding:7px;font-size:11px;font-weight:950;color:#157b7b}.p213-main{min-width:0}.p213-main h4{margin:0;color:#173d47;font-size:15px;line-height:1.2}.p213-main p{margin:6px 0 0;color:#657b81;font-size:11px;line-height:1.4}.p213-meta{margin-top:7px;display:flex;gap:5px;flex-wrap:wrap}.p213-chip{font-size:9px;font-weight:850;border-radius:999px;padding:5px 7px;background:#eef4f3;color:#536e75}.p213-empty{padding:35px 20px;text-align:center;color:#74878c}.p213-empty b{display:block;font-family:'Fraunces',serif;font-size:24px;color:#31545d;margin-bottom:4px}
  .p213-nav{display:flex;align-items:center;gap:10px;margin:12px 0 8px}.p213-nav button{border:1px solid #cfe1dd;background:#fff;color:#214d56;border-radius:14px;min-height:44px;padding:0 16px;font-size:12px;font-weight:950;box-shadow:0 5px 16px rgba(20,61,67,.06);cursor:pointer}.p213-nav button:hover{background:#edf8f6}.p213-nav .p213-spacer{flex:1}.p213-nav small{color:#71858a;font-size:10px;font-weight:800;text-align:center}.p213-nav button:disabled{opacity:.32;cursor:default}
  #viewCrono .ag-day{cursor:pointer!important;position:relative!important}.p213-day-count{display:block;margin-top:auto;font-size:11px;font-weight:900;color:#5e777d}.p213-day-count.has{color:#087c76}.p213-day-count.has:before{content:'●';font-size:8px;margin-right:5px;color:#1aa29a}.p213-day-count.zero{opacity:.72}
  @media(max-width:900px){.p213-list{grid-template-columns:1fr}.p213-nav small{display:none}.p213-nav button{flex:1;padding:0 10px}.p213-head{padding:15px}.p213-title{font-size:22px}}
  @media(min-width:901px){#viewCrono .ag-month{scrollbar-width:auto!important;padding-left:52px!important;padding-right:52px!important}.p213-nav{position:relative}.p213-nav button{min-width:155px;font-size:13px}.p213-nav small{max-width:360px}}
  `;document.head.appendChild(st);
}
function ensureRoot(){
  const view=$('#viewCrono');if(!view)return null;
  const month=$('#viewCrono .ag-month');if(!month)return null;
  let nav=$('#p213AgendaNav');if(!nav){
    nav=document.createElement('div');nav.id='p213AgendaNav';nav.className='p213-nav';
    nav.innerHTML='<button type="button" data-p213-prev>← Dia anterior</button><span class="p213-spacer"></span><small>Use os botões, clique em um dia ou role a rodinha do mouse sobre os dias.</small><span class="p213-spacer"></span><button type="button" data-p213-next>Próximo dia →</button>';
    month.parentNode.insertBefore(nav,month);
  }
  let day=$('#p213AgendaDay');if(!day){day=document.createElement('section');day.id='p213AgendaDay';month.insertAdjacentElement('afterend',day)}
  return {view,month,nav,day};
}
function visibleDays(month){return $$('.ag-day[data-iso]:not(.out)',month).filter(d=>normalizeDate(d.dataset.iso))}
function chooseDate(month){
  const days=visibleDays(month);if(!days.length)return'';
  const existing=days.find(d=>d.classList.contains('sel'));
  const wanted=normalizeDate(selectedDate);
  if(wanted&&days.some(d=>normalizeDate(d.dataset.iso)===wanted))return wanted;
  if(existing)return normalizeDate(existing.dataset.iso);
  const t=todayIso();if(days.some(d=>normalizeDate(d.dataset.iso)===t))return t;
  return normalizeDate(days[0].dataset.iso);
}
function selectDate(iso,{click=true,scroll=true}={}){
  const month=$('#viewCrono .ag-month');if(!month)return;
  const date=normalizeDate(iso),days=visibleDays(month),target=days.find(d=>normalizeDate(d.dataset.iso)===date);if(!target)return;
  selectedDate=date;
  if(click&&!target.classList.contains('sel')){try{target.click()}catch(_e){}}
  if(scroll){
    const left=target.offsetLeft-(month.clientWidth-target.offsetWidth)/2;
    try{month.scrollTo({left:Math.max(0,left),behavior:'smooth'})}catch(_e){month.scrollLeft=Math.max(0,left)}
  }
  scheduleRender();
}
function step(delta){
  const month=$('#viewCrono .ag-month');if(!month)return;
  const days=visibleDays(month);if(!days.length)return;
  const cur=normalizeDate(selectedDate)||chooseDate(month);
  let i=days.findIndex(d=>normalizeDate(d.dataset.iso)===cur);if(i<0)i=0;
  const j=Math.max(0,Math.min(days.length-1,i+delta));selectDate(days[j].dataset.iso);
}
function bindNav(nav,month){
  if(nav.dataset.p213Bound!=='1'){
    nav.dataset.p213Bound='1';
    $('[data-p213-prev]',nav).onclick=()=>step(-1);$('[data-p213-next]',nav).onclick=()=>step(1);
  }
  if(month.dataset.p213Bound!=='1'){
    month.dataset.p213Bound='1';
    month.addEventListener('click',e=>{const d=e.target.closest?.('.ag-day[data-iso]');if(!d)return;selectedDate=normalizeDate(d.dataset.iso);setTimeout(scheduleRender,0)},false);
    month.addEventListener('wheel',e=>{
      if(window.matchMedia&&window.matchMedia('(min-width:901px)').matches&&Math.abs(e.deltaY)>Math.abs(e.deltaX)){
        if(month.scrollWidth>month.clientWidth){e.preventDefault();month.scrollLeft+=e.deltaY;}
      }
    },{passive:false});
  }
}
function renderCounts(month,items){
  const by=new Map();items.forEach(x=>by.set(x.date,(by.get(x.date)||0)+1));
  visibleDays(month).forEach(d=>{
    const iso=normalizeDate(d.dataset.iso),n=by.get(iso)||0;let el=$('.p213-day-count',d);if(!el){el=document.createElement('div');el.className='p213-day-count';d.appendChild(el)}
    el.className=`p213-day-count ${n?'has':'zero'}`;el.textContent=n?`${n} compromisso${n===1?'':'s'}`:'dia livre';
  });
}
function itemHtml(x,s){
  const who=names(x.participants,s),kind=x.kind==='grupo'?'Reunião / evento':x.kind==='atividade'?'Atividade':x.kind==='privado'?'Privado':'Prazo';
  return `<article class="p213-item" data-p213-kind="${esc(x.kind)}" data-p213-id="${esc(x.id)}"><div class="p213-time">${esc(x.time||'Sem hora')}</div><div class="p213-main"><h4>${esc(x.title)}</h4>${x.desc?`<p>${esc(x.desc)}</p>`:''}<div class="p213-meta"><span class="p213-chip">${esc(kind)}</span>${x.local?`<span class="p213-chip">📍 ${esc(x.local)}</span>`:''}${who.length?`<span class="p213-chip">👥 ${esc(who.slice(0,3).join(', '))}${who.length>3?' +'+(who.length-3):''}</span>`:''}</div></div></article>`;
}
function renderDetail(day,items,s){
  const date=normalizeDate(selectedDate);const list=items.filter(x=>x.date===date);
  day.innerHTML=`<div class="p213-head"><div class="p213-head-main"><div class="p213-kicker">Agenda do dia</div><div class="p213-title">${esc(fmtLong(date||todayIso()))}</div></div><div class="p213-total">${list.length?`${list.length} compromisso${list.length===1?'':'s'}`:'Dia livre'}</div></div>${list.length?`<div class="p213-list">${list.map(x=>itemHtml(x,s)).join('')}</div>`:`<div class="p213-empty"><b>🌿 Dia livre</b>Nada marcado para este dia.</div>`}`;
  $$('[data-p213-kind]',day).forEach(card=>card.onclick=()=>{
    const kind=card.dataset.p213Kind,id=card.dataset.p213Id;
    if(typeof root.openAgendaDetail==='function'){root.openAgendaDetail(kind,id);return;}
    if(kind==='atividade'){
      const btn=$(`#p174AgendaTasks [data-p174-edit="${CSS.escape(id)}"]`);if(btn)btn.click();
    }
  });
}
function updateNav(nav,month){
  const days=visibleDays(month),cur=normalizeDate(selectedDate);let i=days.findIndex(d=>normalizeDate(d.dataset.iso)===cur);if(i<0)i=0;
  const prev=$('[data-p213-prev]',nav),next=$('[data-p213-next]',nav);if(prev)prev.disabled=i<=0;if(next)next.disabled=i<0||i>=days.length-1;
}
function render(){
  if(!hasDocument()||rendering||document.body?.dataset?.view!=='crono')return;
  const r=ensureRoot();if(!r)return;
  rendering=true;
  try{
    css();bindNav(r.nav,r.month);selectedDate=chooseDate(r.month)||selectedDate||todayIso();
    const s=state(),items=collectAgendaItems(s,myId(),isAdmin());
    renderCounts(r.month,items);renderDetail(r.day,items,s);updateNav(r.nav,r.month);lastSig=signature(s,myId(),isAdmin());
  }finally{rendering=false}
}
function scheduleRender(){
  if(!hasDocument()||pending)return;pending=true;requestAnimationFrame(()=>{pending=false;render()});
}
function wrapRenderCrono(){
  if(wrapped)return;
  const fn=root?.renderCrono;if(typeof fn!=='function')return;
  if(fn.__p213){wrapped=true;return;}
  const w=function(){const v=fn.apply(this,arguments);queueMicrotask(scheduleRender);return v};w.__p213=true;root.renderCrono=w;wrapped=true;
}
function openSharedTask(id=''){
  if(id){const btn=$(`#p174AgendaTasks [data-p174-edit="${CSS.escape(String(id))}"]`);if(btn){btn.click();return true}}
  const b=$('#p174AgendaTasks [data-p174-new-ag],[data-p174-new-ag]');if(b){b.click();return true}return false;
}
function boot(){
  if(!hasDocument())return;
  css();wrapRenderCrono();
  new MutationObserver(ms=>{if(ms.some(m=>m.attributeName==='data-view')&&document.body.dataset.view==='crono')setTimeout(scheduleRender,0)}).observe(document.body,{attributes:true,attributeFilter:['data-view']});
  document.addEventListener('keydown',e=>{if(document.body.dataset.view!=='crono'||e.altKey||e.ctrlKey||e.metaKey)return;const tag=(e.target?.tagName||'').toLowerCase();if(['input','textarea','select'].includes(tag))return;if(e.key==='ArrowLeft'){e.preventDefault();step(-1)}else if(e.key==='ArrowRight'){e.preventDefault();step(1)}},true);
  pollTimer=setInterval(()=>{if(document.body.dataset.view!=='crono')return;wrapRenderCrono();const sig=signature();if(sig!==lastSig)scheduleRender()},1200);
  setTimeout(scheduleRender,200);setTimeout(scheduleRender,800);
}

const api={BUILD,normalizeDate,done,participantIds,relevantSchedule,collectAgendaItems,itemsForDate,countForDate,signature,render,scheduleRender,selectDate,step,openSharedTask};
if(hasDocument()){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
}
return api;
});
