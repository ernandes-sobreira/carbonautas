/* Carbonautas P85 · Painel estável: tratados saem da atenção sem loop de DOM */
(function(){
'use strict';
const VERSION='P85';
const FOLLOW_STORE='carbonautas_panel_followups_v1';
let scheduled=false,migrated=false;

function actorKey(){return String(window.auth?.currentUser?.uid||'anon')}
function ackStoreKey(){return `carbonautas_p56_panel_done_${actorKey()}`}
function loadJSON(key){try{return JSON.parse(localStorage.getItem(key)||'{}')||{}}catch(_e){return{}}}
function saveJSON(key,v){try{localStorage.setItem(key,JSON.stringify(v||{}))}catch(_e){}}
function norm(v=''){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function toast(msg){let el=document.getElementById('p85Toast');if(!el){el=document.createElement('div');el.id='p85Toast';el.style.cssText='position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147483647;background:#17313d;color:#fff;padding:11px 15px;border-radius:12px;font:700 12px/1.35 system-ui;box-shadow:0 12px 36px rgba(0,0,0,.25);max-width:min(560px,92vw);text-align:center';document.body.appendChild(el)}el.textContent=msg;el.style.display='block';clearTimeout(el._t);el._t=setTimeout(()=>el.style.display='none',3500)}
function cardWho(card){return (card?.querySelector('.p56-who')?.textContent||'Carbonauta').trim()}
function cardWhat(card){return (card?.querySelector('.p56-what')?.textContent||'Item tratado').trim()}
function cardKey(card){
  if(!card)return'';
  if(card.dataset.p72CheckinMember)return `checkin:${card.dataset.p72CheckinMember}:${card.dataset.p72CheckinMonth||norm(cardWhat(card))}`;
  const k=card.dataset.p69Key||'';if(k)return k;
  const raw=[...card.querySelectorAll('button[onclick]')].map(b=>b.getAttribute('onclick')||'').join(' ');
  let m=raw.match(/p56OpenItem\('([^']+)'\)/);if(m)return m[1];
  m=raw.match(/activity:([^'\)]+)/);return m?`activity:${m[1]}`:'';
}
function ensureCss(){if(document.getElementById('p85PanelStyle'))return;const s=document.createElement('style');s.id='p85PanelStyle';s.textContent=`
.p85-hidden-treated{display:none!important}.p85-treated-btn{background:#fff!important;color:#176b4a!important;border-color:#b9dfcc!important}.p85-treated-btn:hover{background:#effbf5!important}.p85-empty{padding:14px;color:#7c8b90;font-size:12px;text-align:center}
`;document.head.appendChild(s)}
function migrateOldReminders(){
  if(migrated)return;migrated=true;
  const follow=loadJSON(FOLLOW_STORE),acks=loadJSON(ackStoreKey());let changed=false;
  Object.entries(follow).forEach(([key,v])=>{if(!/^(activity|checkin):/.test(key)||!v?.ts||acks[key])return;acks[key]={key,kind:'LEMBRETE ENVIADO',who:v.personName||'Carbonauta',what:v.title||'Lembrete enviado',memberId:v.memberId||'',sourceId:v.sourceId||'',doneAt:v.ts,doneBy:'Você'};changed=true});
  if(changed){saveJSON(ackStoreKey(),acks);setTimeout(()=>{try{window.renderPainel?.()}catch(_e){}},80)}
}
function fallbackAck(key,card){const acks=loadJSON(ackStoreKey());acks[key]={key,kind:'TRATADO',who:cardWho(card),what:cardWhat(card),doneAt:Date.now(),doneBy:'Você'};saveJSON(ackStoreKey(),acks);try{window.renderPainel?.()}catch(_e){}}
function markHandled(card){const key=cardKey(card);if(!key){toast('Não consegui identificar este item.');return}try{if(typeof window.p56AckItem==='function')window.p56AckItem(key);else fallbackAck(key,card)}catch(_e){fallbackAck(key,card)}setTimeout(refresh,120);toast('✓ Item foi para Feitos / tratados.')}
function isHandled(key){if(!key)return false;const acks=loadJSON(ackStoreKey()),follow=loadJSON(FOLLOW_STORE);return !!acks[key]||!!follow[key]?.ts}
function ensureExitButtons(){
  document.querySelectorAll('#dashAttention .p56-task').forEach(card=>{
    const key=cardKey(card);if(!key||isHandled(key))return;
    const actions=card.querySelector('.p56-task-actions');if(!actions||actions.querySelector('.p85-treated-btn,.p77-treated-btn'))return;
    const reminder=actions.querySelector('.p72-checkin-remind,.p70-smart-request,.p69-wait');if(!reminder)return;
    const b=document.createElement('button');b.type='button';b.className='btn p85-treated-btn';b.textContent='✓ Já tratei';b.title='Tira da atenção e mantém no histórico';b.onclick=e=>{e.preventDefault();e.stopPropagation();markHandled(card)};actions.appendChild(b)
  })
}
function hideHandled(){document.querySelectorAll('#dashAttention .p56-task').forEach(card=>{const key=cardKey(card),hide=isHandled(key);card.classList.toggle('p85-hidden-treated',hide);card.classList.remove('p77-hidden-treated')})}
function recalc(){
  const sections=[...document.querySelectorAll('#dashAttention .p56-panel-section')];let total=0,week=0;
  sections.forEach((sec,i)=>{
    const cards=[...sec.querySelectorAll('.p56-task')].filter(c=>!c.classList.contains('p85-hidden-treated'));
    const n=cards.length;total+=n;if(i===1)week=n;
    const count=sec.querySelector('.p56-section-head span');if(count&&count.textContent!==String(n))count.textContent=String(n);
    let em=sec.querySelector(':scope > .p85-empty');
    if(!n){
      const txt=i===0?'Nada pedindo sua ação agora.':'Nenhuma ação próxima.';
      if(!em){em=document.createElement('div');em.className='p85-empty';em.textContent=txt;sec.appendChild(em)}else if(em.textContent!==txt)em.textContent=txt;
    }else if(em)em.remove();
  });
  document.querySelectorAll('#dashKpis .dash-kpi').forEach(k=>{const lab=(k.querySelector('.k-l')?.textContent||'').trim().toLowerCase(),num=k.querySelector('.k-n');if(!num)return;const val=lab==='precisam de ação'?String(total):lab==='esta semana'?String(week):null;if(val!==null&&num.textContent!==val)num.textContent=val})
}
function refresh(){ensureCss();migrateOldReminders();hideHandled();ensureExitButtons();recalc()}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;refresh()})}
window.p77Refresh=refresh;window.p85Refresh=refresh;
function boot(){refresh();const root=document.getElementById('dashAttention')||document.body;new MutationObserver(muts=>{if(muts.some(m=>m.addedNodes?.length||m.removedNodes?.length))schedule()}).observe(root,{childList:true,subtree:true});[700,1800].forEach(ms=>setTimeout(refresh,ms));console.info('Carbonautas',VERSION,'Painel sem loop de redesenho')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
