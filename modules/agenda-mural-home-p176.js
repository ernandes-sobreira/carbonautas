/* Carbonautas P176 · capa compacta + Mural com data
   - elimina duplicidade "Atenção agora" x foco da Agenda na capa
   - esconde concluídos/tratados da capa (histórico unificado fica para etapa futura)
   - transforma os compromissos em faixa horizontal arrastável
   - posts do Mural só entram na atenção quando têm data explícita
   - adiciona data/hora opcional ao formulário do Mural sem alterar regras
*/
(function(){
'use strict';
if(window.__CARBONAUTAS_P176_HOME_MURAL)return;
window.__CARBONAUTAS_P176_HOME_MURAL=true;

const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
let decorating=false,queued=false,lastPostOpen=false;
function S(){try{return window.state||state||{}}catch(_e){return{}}}
function F(){try{if(window.fbFns)return window.fbFns;if(typeof FB==='function')return FB()}catch(_e){}return null}
function mine(){try{return window.myId||myId||''}catch(_e){return''}}
function admin(){try{return !!(window.isAdmin??isAdmin)}catch(_e){return false}}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function member(id){return (S().members||[]).find(m=>String(m.id)===String(id))||null}
function me(){return member(mine())}
function iso(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function today(){return iso(new Date())}
function parseDate(v){if(!v)return null;const d=new Date(v+'T12:00:00');return Number.isNaN(d.getTime())?null:d}
function dayDiff(v){const d=parseDate(v),n=parseDate(today());return d&&n?Math.round((d-n)/86400000):99999}
function fmt(v){const d=parseDate(v);return d?d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}):v||''}
function done(a){return !!(a?.feito||Number(a?.progress)>=100||['concluido','concluído','feito','aprovado'].includes(String(a?.status||'').toLowerCase()))}
function toastS(v){try{if(typeof toast==='function')toast(v)}catch(_e){}}

function css(){if($('#p176Style'))return;const st=document.createElement('style');st.id='p176Style';st.textContent=`
#viewPainel #dashKpis{display:none!important}
#viewPainel .p142-command-intro{display:none!important}
#viewPainel .p176-hide-home{display:none!important}
#viewPainel .p56-done-box{display:none!important}
#p174AgendaFocus{padding:11px 12px!important;border-radius:18px!important;margin-bottom:10px!important}
#p174AgendaFocus .p174-head{align-items:center!important}
#p174AgendaFocus .p174-title{font-size:18px!important;line-height:1.08!important}
#p174AgendaFocus .p174-sub{font-size:9.5px!important;line-height:1.3!important;max-width:560px}
#p174AgendaFocus .p174-head-actions button{min-height:34px!important;padding:0 9px!important;font-size:9.5px!important}
#p174AgendaFocus .p174-stats{gap:5px!important;margin-top:9px!important}
#p174AgendaFocus .p174-stat{padding:6px 7px!important;border-radius:10px!important;min-height:48px!important}
#p174AgendaFocus .p174-stat b{font-size:15px!important}
#p174AgendaFocus .p174-stat span{font-size:7.5px!important}
#p174AgendaFocus .p174-list.p176-strip{display:flex!important;gap:8px!important;overflow-x:auto!important;overflow-y:hidden!important;scroll-snap-type:x mandatory!important;scroll-padding:2px!important;margin-top:9px!important;padding:1px 2px 5px!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior-x:contain!important;scrollbar-width:none}
#p174AgendaFocus .p174-list.p176-strip::-webkit-scrollbar{display:none}
.p176-att-card{flex:0 0 min(76vw,286px);scroll-snap-align:start;border:1px solid #d9e6e3;background:#fff;border-radius:14px;min-height:84px;padding:10px 11px;text-align:left;display:grid;grid-template-columns:58px minmax(0,1fr);grid-template-rows:auto 1fr;column-gap:9px;row-gap:3px;box-shadow:0 4px 14px rgba(22,70,74,.045);color:#173b47}
.p176-att-card:active{transform:scale(.992)}
.p176-card-when{grid-row:1/3;font-size:9px;line-height:1.25;font-weight:950;color:#168f94;align-self:start;padding-top:2px}.p176-card-when.over{color:#b44759}
.p176-card-main{min-width:0}.p176-card-title{display:block;font-size:11px;line-height:1.22;font-weight:900;color:#173b47;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.p176-card-meta{display:flex;align-items:center;gap:5px;min-width:0;margin-top:4px;font-size:8.5px;color:#71858b}.p176-source{flex:0 0 auto;border-radius:999px;padding:3px 6px;background:#eef6f4;color:#42666e;font-size:7.5px;font-weight:900}.p176-meta-text{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.p176-source.mural{background:#fff2df;color:#956115}.p176-source.agenda{background:#eaf7f5;color:#126f73}.p176-source.atividade{background:#eef0ff;color:#5a51b6}
.p176-mural-date{display:inline-flex;align-items:center;gap:3px;border-radius:999px;background:#fff2df;color:#956115;padding:3px 7px;font-size:8px;font-weight:900;margin-left:5px;white-space:nowrap}
#p176PostDateRow{display:grid;grid-template-columns:1.15fr .85fr;gap:9px}.p176-date-hint{grid-column:1/-1;font-size:9px;color:#71858b;line-height:1.35;margin-top:-2px}.p176-post-field label{display:block;margin-bottom:5px}.p176-post-field input{width:100%}
.p176-mural-flash{animation:p176flash 1.45s ease}@keyframes p176flash{0%,100%{box-shadow:none}35%{box-shadow:0 0 0 4px rgba(224,145,46,.25)}}
@media(max-width:650px){#p174AgendaFocus .p174-head{display:grid!important;grid-template-columns:1fr auto!important;gap:8px!important}#p174AgendaFocus .p174-head-main{min-width:0}#p174AgendaFocus .p174-head-actions{margin:0!important;justify-content:flex-end!important;align-self:start!important}#p174AgendaFocus .p174-head-actions button{padding:0 8px!important}#p174AgendaFocus .p174-title{font-size:17px!important}#p174AgendaFocus .p174-sub{font-size:8.7px!important}.p176-att-card{flex-basis:78vw;min-height:80px;padding:9px 10px}#p176PostDateRow{grid-template-columns:1fr 1fr}}
`;document.head.appendChild(st)}

function compactLegacyHome(){
 $('#dashKpis')?.classList.add('p176-hide-home');
 const intro=$('#viewPainel .p142-command-intro');if(intro)intro.classList.add('p176-hide-home');
 $$('#viewPainel details.p142-accordion').forEach(d=>{const t=d.querySelector('summary')?.textContent||'';if(/Atenção agora/i.test(t))d.classList.add('p176-hide-home')});
 $$('#viewPainel .p56-done-box').forEach(x=>x.classList.add('p176-hide-home'))
}
function relevantSchedule(e){const id=mine();if(!id)return false;const ids=Array.isArray(e?.participantIds)&&e.participantIds.length?e.participantIds:(Array.isArray(e?.notifyMemberIds)&&e.notifyMemberIds.length?e.notifyMemberIds:null);return !ids||ids.includes(id)||admin()}
function baseItems(){const s=S(),id=mine(),m=me(),out=[];if(!id)return out;
 (s.schedule||[]).forEach(e=>{if(!e?.data||e.feito||!relevantSchedule(e))return;out.push({source:'grupo',id:e.id,title:e.titulo||'Evento do grupo',date:e.data,time:e.hora||'',desc:e.descricao||'',kind:'Agenda'})});
 (m?.prazos||[]).forEach((p,i)=>{if(!p?.data||p.feito)return;out.push({source:'prazo',id:id+'::'+i,title:p.titulo||'Prazo',date:p.data,time:p.hora||'',desc:p.descricao||'',kind:'Prazo'})});
 (s.privateSchedule||[]).forEach(p=>{if(!p?.data||p.feito)return;out.push({source:'privado',id:p.id,title:p.titulo||'Compromisso',date:p.data,time:p.hora||'',desc:p.descricao||'',kind:'Só eu'})});
 (s.activities||[]).filter(a=>a?.agendaShared===true||a?.type==='agenda').forEach(a=>{if(done(a)||!a.dueDate)return;const ids=Array.isArray(a.participantIds)?a.participantIds:[];if(a.ownerId!==id&&!ids.includes(id)&&!admin())return;out.push({source:'atividade',id:a.id,title:a.title||'Atividade',date:a.dueDate,time:a.dueTime||'',desc:a.description||'',kind:'Atividade'})});
 return out
}
function muralItems(){const id=mine();if(!id)return[];return (S().feed||[]).filter(p=>{if(!p?.actionDate)return false;if(admin())return true;return !p.para||String(p.para)===String(id)||String(p.authorId)===String(id)}).map(p=>({source:'mural',id:p.id,title:p.title||p.text?.slice(0,80)||'Ação do Mural',date:p.actionDate,time:p.actionTime||'',desc:p.text||'',kind:'Mural'}))}
function allItems(){const a=[...baseItems(),...muralItems()];a.sort((x,y)=>{const dx=dayDiff(x.date),dy=dayDiff(y.date);if(dx<0&&dy<0)return (y.date+(y.time||'')).localeCompare(x.date+(x.time||''));if(dx<0)return -1;if(dy<0)return 1;return (x.date+(x.time||'')).localeCompare(y.date+(y.time||''))});return a}
function stats(items){let overdue=0,todayN=0,week=0,month=0;items.forEach(x=>{const d=dayDiff(x.date);if(d<0)overdue++;if(d===0)todayN++;if(d>=0&&d<=7)week++;if(d>=0&&d<=30)month++});return[overdue,todayN,week,month]}
function when(x){const d=dayDiff(x.date);if(d<0)return `Atrasado\n${fmt(x.date)}`;if(d===0)return x.time?`Hoje · ${x.time}`:'Hoje';if(d===1)return x.time?`Amanhã · ${x.time}`:'Amanhã';return `${fmt(x.date)}${x.time?' · '+x.time:''}`}
function sourceInfo(x){if(x.source==='mural')return['📌 Mural','mural'];if(x.source==='atividade')return['✓ Atividade','atividade'];if(x.source==='privado')return['🔒 Só eu','agenda'];if(x.source==='prazo')return['⏳ Prazo','agenda'];return['📅 Agenda','agenda']}
function goMural(id){try{if(typeof switchView==='function')switchView('mural');else window.switchView?.('mural')}catch(_e){window.switchView?.('mural')}setTimeout(()=>{const raw=String(id),safe=window.CSS?.escape?window.CSS.escape(raw):raw.replace(/["']/g,'\\$&'),card=document.querySelector(`[data-mural-id="${safe}"]`);if(card){card.scrollIntoView({behavior:'smooth',block:'center'});card.classList.add('p176-mural-flash');setTimeout(()=>card.classList.remove('p176-mural-flash'),1600)}},280)}
function openItem(x){if(x.source==='mural'){goMural(x.id);return}if(typeof window.openAgendaDetail==='function'){window.openAgendaDetail(x.source,x.id);return}try{if(typeof switchView==='function')switchView('crono');else window.switchView?.('crono')}catch(_e){window.switchView?.('crono')}}
function decorateHome(){if(decorating)return;const box=$('#p174AgendaFocus');if(!box)return;decorating=true;try{compactLegacyHome();const sub=$('.p174-sub',box);if(sub)sub.textContent='Agenda + ações do Mural com data. Arraste os cards para ver os próximos.';const items=allItems(),nums=stats(items);$$('.p174-stat',box).forEach((el,i)=>{const b=$('b',el);if(b&&nums[i]!==undefined)b.textContent=String(nums[i]);if(i===0)el.classList.toggle('bad',nums[0]>0)});let list=$('.p174-list',box),empty=$('.p174-empty',box);const show=items.filter(x=>dayDiff(x.date)<=30).slice(0,6);if(show.length){if(empty)empty.remove();if(!list){list=document.createElement('div');list.className='p174-list';($('.p174-stats',box)||box).insertAdjacentElement('afterend',list)}list.classList.add('p176-strip');list.dataset.p176Decorated='1';list.innerHTML=show.map(x=>{const [label,cls]=sourceInfo(x),over=dayDiff(x.date)<0;return `<button type="button" class="p176-att-card" data-p176-source="${esc(x.source)}" data-p176-id="${esc(x.id)}"><span class="p176-card-when ${over?'over':''}">${esc(when(x)).replace(/\n/g,'<br>')}</span><span class="p176-card-main"><span class="p176-card-title">${esc(x.title)}</span><span class="p176-card-meta"><span class="p176-source ${cls}">${label}</span><span class="p176-meta-text">${esc(x.desc||x.kind)}</span></span></span></button>`}).join('');$$('[data-p176-source]',list).forEach((el,i)=>el.onclick=()=>openItem(show[i]))}else{if(list)list.remove();if(!empty){empty=document.createElement('div');empty.className='p174-empty';box.appendChild(empty)}empty.textContent='✅ Nada urgente na sua agenda ou no Mural agora.'}box.dataset.p176Ready='1'}finally{decorating=false}}

function ensurePostDateFields(){const ov=$('#postOverlay'),title=$('#postTitle');if(!ov||!title)return false;if($('#p176PostDateRow'))return true;const row=document.createElement('div');row.id='p176PostDateRow';row.className='fg';row.innerHTML='<div class="p176-post-field"><label>Data / prazo (opcional)</label><input type="date" id="p176PostDate"></div><div class="p176-post-field"><label>Hora (opcional)</label><input type="time" id="p176PostTime"></div><div class="p176-date-hint">Só publicações com data entram em “O que precisa da sua atenção”. Sem data, ficam somente no Mural.</div>';title.closest('.fg')?.before(row);return true}
function resetPostDate(){if(!ensurePostDateFields())return;$('#p176PostDate').value='';$('#p176PostTime').value=''}
async function waitNewPost(before,title,text){for(let i=0;i<24;i++){await new Promise(r=>setTimeout(r,110));const found=(S().feed||[]).find(p=>!before.has(String(p.id))&&String(p.authorId||'')===String(mine())&&(!title||String(p.title||'')===title)&&(!text||String(p.text||'')===text));if(found)return found}return null}
function bindPostSave(){const b=$('#savePostBtn');if(!b||b.dataset.p176Bound==='1'||typeof b.onclick!=='function')return false;const original=b.onclick;b.dataset.p176Bound='1';b.onclick=async function(e){const date=$('#p176PostDate')?.value||'',time=$('#p176PostTime')?.value||'',title=$('#postTitle')?.value.trim()||'',text=$('#postText')?.value.trim()||'',before=new Set((S().feed||[]).map(p=>String(p.id)));const result=await original.call(this,e);if(!date)return result;try{const p=await waitNewPost(before,title,text),f=F();if(p&&f){await f.setDoc(f.doc(window.db,'rede_feed',p.id),{actionDate:date,actionTime:time||''},{merge:true});schedule();setTimeout(decorateMural,80)}}catch(err){console.error('P176 data do mural',err);toastS('A publicação foi salva, mas não consegui vincular a data à agenda.')}return result};return true}
function watchPostOverlay(){const ov=$('#postOverlay');if(!ov||ov.dataset.p176Observed==='1')return;ov.dataset.p176Observed='1';new MutationObserver(()=>{const open=ov.classList.contains('open');if(open&&!lastPostOpen)setTimeout(resetPostDate,0);lastPostOpen=open}).observe(ov,{attributes:true,attributeFilter:['class']})}
function decorateMural(){ensurePostDateFields();$$('#muralMsgs .feed-card[data-mural-type="post"]').forEach(card=>{const id=card.dataset.muralId,p=(S().feed||[]).find(x=>String(x.id)===String(id));$('.p176-mural-date',card)?.remove();if(!p?.actionDate)return;const chip=document.createElement('span');chip.className='p176-mural-date';chip.textContent=`📅 ${fmt(p.actionDate)}${p.actionTime?' · '+p.actionTime:''}`;($('.feed-time',card)?.parentElement||$('.feed-head',card)||card).appendChild(chip)})}
function wrapGlobals(){try{if(typeof window.renderPainel==='function'&&!window.renderPainel.__p176){const o=window.renderPainel,w=function(){const r=o.apply(this,arguments);queueMicrotask(schedule);return r};w.__p176=true;window.renderPainel=w}}catch(_e){}try{if(typeof window.renderMural==='function'&&!window.renderMural.__p176){const o=window.renderMural,w=function(){const r=o.apply(this,arguments);queueMicrotask(()=>{decorateMural();schedule()});return r};w.__p176=true;window.renderMural=w}}catch(_e){}try{if(typeof window.updateMuralBadge==='function'&&!window.updateMuralBadge.__p176){const o=window.updateMuralBadge,w=function(){const r=o.apply(this,arguments);queueMicrotask(schedule);return r};w.__p176=true;window.updateMuralBadge=w}}catch(_e){}}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;compactLegacyHome();if((document.body?.dataset?.view||'')==='painel')decorateHome();if((document.body?.dataset?.view||'')==='mural')decorateMural()})}
function observeFocus(){const box=$('#p174AgendaFocus');if(!box||box.dataset.p176Observed==='1')return;box.dataset.p176Observed='1';new MutationObserver(()=>schedule()).observe(box,{childList:true,subtree:false})}
function observeMural(){const box=$('#muralMsgs');if(!box||box.dataset.p176Observed==='1')return;box.dataset.p176Observed='1';new MutationObserver(()=>{if((document.body?.dataset?.view||'')==='mural')requestAnimationFrame(decorateMural)}).observe(box,{childList:true})}
function boot(){css();compactLegacyHome();ensurePostDateFields();watchPostOverlay();wrapGlobals();window.refreshHomeAgendaMural=()=>{schedule();setTimeout(()=>{observeFocus();observeMural();schedule()},60)};schedule();observeFocus();observeMural();let tries=0;const retry=()=>{tries++;ensurePostDateFields();watchPostOverlay();bindPostSave();observeFocus();observeMural();if(tries<12&&(!$('#savePostBtn')?.dataset.p176Bound||!$('#p174AgendaFocus')))setTimeout(retry,180)};retry();new MutationObserver(ms=>{if(ms.some(m=>m.attributeName==='data-view')){schedule();[80,320,900].forEach(t=>setTimeout(()=>{observeFocus();observeMural();ensurePostDateFields();bindPostSave();schedule()},t))}}).observe(document.body,{attributes:true,attributeFilter:['data-view']})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
