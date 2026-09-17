/* Carbonautas P75 compat · P72 agora cuida SOMENTE da UI dos check-ins.
   O chat e os lembretes sao tratados pelo P73/P75 usando o fluxo nativo. */
(function(){
'use strict';
const VERSION='P75-UI';
let scheduled=false;
function first(n=''){return String(n||'Carbonauta').trim().split(/\s+/)[0]||'Carbonauta'}
function checkinInfo(card){
  const raw=[...card.querySelectorAll('button')].map(b=>b.getAttribute('onclick')||'').join(' ');
  const m=raw.match(/checkin:([^:']+):([^'\)]+)/);
  if(m)return {memberId:m[1],month:m[2]};
  if(card.dataset.p72CheckinMember)return {memberId:card.dataset.p72CheckinMember,month:card.dataset.p72CheckinMonth||''};
  return null;
}
function decorateCheckins(){
  document.querySelectorAll('#dashAttention .p56-task').forEach(card=>{
    const src=(card.querySelector('.p56-source')?.textContent||'').trim().toUpperCase();
    if(src!=='CHECK-IN')return;
    const info=checkinInfo(card);if(!info?.memberId)return;
    card.dataset.p72CheckinMember=info.memberId;card.dataset.p72CheckinMonth=info.month||'';
    const who=(card.querySelector('.p56-who')?.textContent||'Carbonauta').trim();
    const what=(card.querySelector('.p56-what')?.textContent||'Check-in mensal').trim();
    const detail=card.querySelector('.p56-detail'),actions=card.querySelector('.p56-task-actions');
    if(detail&&!detail.dataset.p72Checkin){
      detail.dataset.p72Checkin='1';
      detail.innerHTML=`<span style="display:inline-flex;padding:4px 7px;border-radius:999px;background:#fff1dd;color:#9b5a00;font-size:9px;font-weight:900;margin-bottom:5px">👀 AÇÃO DE ${String(first(who)).toUpperCase()}</span><div style="font-size:12px;line-height:1.45;color:#405861;font-weight:650">${who} ainda não registrou este check-in. <b>Você só acompanha e pode lembrar a pessoa.</b></div>`;
    }
    if(actions&&!actions.querySelector('.p72-checkin-remind')){
      actions.innerHTML='';
      const b=document.createElement('button');b.type='button';b.className='btn p72-checkin-remind';
      b.dataset.memberId=info.memberId;b.dataset.label=what;b.textContent=`💬 Lembrar ${first(who)}`;actions.appendChild(b);
    }
  });
}
function scan(){decorateCheckins()}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;scan()})}
function boot(){scan();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});[900,2200,4500].forEach(ms=>setTimeout(scan,ms));console.info('Carbonautas',VERSION,'check-in UI sem criacao direta de thread')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();