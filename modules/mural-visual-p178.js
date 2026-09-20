/* Carbonautas P178 · Mural sem sobreposição + não vistos por pessoa
   - remove a faixa/“buraco” visual entre cabeçalho e cards no celular
   - cabeçalho das publicações deixa de ser sticky para não deixar texto passar por baixo
   - o número do cabeçalho passa a representar publicações ainda não vistas pela pessoa
   - considera a publicação vista quando o card realmente fica visível por alguns instantes
   - não altera regras do Firebase nem VPS
*/
(function(){
'use strict';
if(window.__CARBONAUTAS_P178_MURAL_POLISH)return;
window.__CARBONAUTAS_P178_MURAL_POLISH=true;

const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const legacySeenAt=Number(localStorage.getItem('rede_lastSeenChat'))||Date.now();
let queued=false,io=null,muralObserver=null,viewTimers=new Map();

function S(){try{return window.state||state||{}}catch(_e){return{}}}
function mine(){try{return window.myId||myId||''}catch(_e){return''}}
function postMs(p){try{return p?.ts?.toMillis?p.ts.toMillis():(p?.ts?.seconds?Number(p.ts.seconds)*1000:+new Date(p?.ts||0)||0)}catch(_e){return 0}}
function userKey(suffix){return `carbonautas_mural_${suffix}_${mine()||'anon'}`}
function baseline(){const k=userKey('baseline');let n=Number(localStorage.getItem(k));if(!n){n=legacySeenAt;localStorage.setItem(k,String(n))}return n}
function seenSet(){try{return new Set(JSON.parse(localStorage.getItem(userKey('seen_ids'))||'[]'))}catch(_e){return new Set()}}
function saveSeen(set){try{const arr=[...set].slice(-500);localStorage.setItem(userKey('seen_ids'),JSON.stringify(arr))}catch(_e){}}
function relevantPost(p){const id=mine();if(!p||!id)return false;if(String(p.authorId||'')===String(id))return true;return !p.para||String(p.para)===String(id)}
function isSeen(p,set){const id=mine();if(!p)return true;if(String(p.authorId||'')===String(id))return true;if(set.has(String(p.id)))return true;const ms=postMs(p);return !!ms&&ms<=baseline()}
function unseenPosts(){const set=seenSet();return (S().feed||[]).filter(p=>relevantPost(p)&&!isSeen(p,set))}

function css(){if($('#p178Style'))return;const st=document.createElement('style');st.id='p178Style';st.textContent=`
#viewMural .p177-swipe-section{overflow:hidden!important;gap:0!important}
#viewMural .p177-swipe-section>.mural-all-title{position:relative!important;top:auto!important;z-index:1!important;margin:0 0 8px!important;background:#eaf2f7!important;overflow:hidden!important}
#viewMural .p177-swipe-section>.p177-swipe-note{display:none!important}
#viewMural .p177-post-rail{position:relative!important;z-index:1!important;margin:0!important;padding-top:0!important;background:transparent!important}
#viewMural .p177-post-rail>.mural-post{overflow:hidden!important;isolation:isolate!important}
#viewMural .mural-all-title span.p178-unseen{margin-left:auto!important;min-width:28px!important;height:28px!important;display:inline-grid!important;place-items:center!important;padding:0 8px!important;border-radius:999px!important;background:#173f48!important;border-color:#173f48!important;color:#fff!important;font-size:10px!important;font-weight:950!important;line-height:1!important}
#viewMural .mural-all-title span.p178-unseen.zero{background:#fff!important;border-color:#c9dae5!important;color:#7c8e94!important}
@media(max-width:760px){#viewMural .mural-all-section{overflow:hidden!important}#viewMural .p177-swipe-section>.mural-all-title{position:relative!important;top:auto!important;transform:none!important}#viewMural .p177-post-rail{padding-bottom:8px!important}}
`;document.head.appendChild(st)}

function publicationSection(){return $$('#muralMsgs .mural-all-section').find(sec=>/Publicações do Mural/i.test(sec.querySelector('.mural-all-title')?.textContent||''))||null}
function updateCount(){const sec=publicationSection();if(!sec)return;const head=sec.querySelector('.mural-all-title'),badge=head?.querySelector('span');if(!head||!badge)return;const n=unseenPosts().length;badge.textContent=String(n);badge.classList.add('p178-unseen');badge.classList.toggle('zero',n===0);badge.title=n===1?'1 publicação ainda não vista':`${n} publicações ainda não vistas`;badge.setAttribute('aria-label',badge.title)}
function markSeen(id){if(!id)return;const p=(S().feed||[]).find(x=>String(x.id)===String(id));if(!p||!relevantPost(p))return;const set=seenSet();if(set.has(String(id)))return;set.add(String(id));saveSeen(set);updateCount()}
function clearTimer(id){const t=viewTimers.get(id);if(t){clearTimeout(t);viewTimers.delete(id)}}
function ensureIO(){if(io||!('IntersectionObserver'in window))return;io=new IntersectionObserver(entries=>{entries.forEach(entry=>{const card=entry.target,id=card.dataset.muralId||'';if(!id)return;if(entry.isIntersecting&&entry.intersectionRatio>=.58){if(!viewTimers.has(id))viewTimers.set(id,setTimeout(()=>{viewTimers.delete(id);markSeen(id)},650))}else clearTimer(id)})},{threshold:[0,.58,.85]})}
function observeCards(){ensureIO();$$('#muralMsgs .feed-card[data-mural-type="post"]').forEach(card=>{if(card.dataset.p178Observed==='1')return;card.dataset.p178Observed='1';io?.observe(card)})}
function cleanLayout(){const sec=publicationSection();if(!sec)return;sec.classList.add('p178-clean');const note=sec.querySelector('.p177-swipe-note');if(note)note.remove();$$(':scope > .day-sep',sec).forEach(x=>x.style.display='none')}
function decorate(){if((document.body?.dataset?.view||'')!=='mural')return;cleanLayout();updateCount();observeCards()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;decorate();observeMural()})}
function observeMural(){const box=$('#muralMsgs');if(!box||box.dataset.p178Observed==='1')return;box.dataset.p178Observed='1';muralObserver=new MutationObserver(()=>schedule());muralObserver.observe(box,{childList:true,subtree:false})}
function bind(){if(document.documentElement.dataset.p178Bound==='1')return;document.documentElement.dataset.p178Bound='1';new MutationObserver(ms=>{if(ms.some(m=>m.attributeName==='data-view'))schedule()}).observe(document.body,{attributes:true,attributeFilter:['data-view']});window.addEventListener('resize',schedule,{passive:true})}
function boot(){css();baseline();bind();observeMural();schedule();setTimeout(schedule,180);setTimeout(schedule,650)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
