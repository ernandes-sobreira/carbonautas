/* Carbonautas P83 · sincronização do Painel + mobile limpo */
(function(){
'use strict';
const BUILD='P83';
const ACK_PREFIX='carbonautas_p56_panel_done_';
let reloading=false,scheduled=false,checkinsExpanded=false,cloudStarted=false,cloudRef=null,cloudUnsub=null,pushing=false;

const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>[...r.querySelectorAll(s)];
function F(){return window.fbFns}
function uid(){return String(window.auth?.currentUser?.uid||'')}
function ackKey(){return ACK_PREFIX+(uid()||'anon')}
function loadJSON(k){try{return JSON.parse(localStorage.getItem(k)||'{}')||{}}catch(_e){return{}}}
function saveJSON(k,v){try{localStorage.setItem(k,JSON.stringify(v||{}))}catch(_e){}}
function esc(v=''){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]))}
function same(a,b){try{return JSON.stringify(a)===JSON.stringify(b)}catch(_e){return false}}
function prune(obj,max=80){return Object.fromEntries(Object.entries(obj||{}).sort((a,b)=>(Number(b[1]?.doneAt)||0)-(Number(a[1]?.doneAt)||0)).slice(0,max))}
function mergeAcks(a,b){const out={...(a||{})};for(const [k,v] of Object.entries(b||{})){if(!out[k]||(Number(v?.doneAt)||0)>=(Number(out[k]?.doneAt)||0))out[k]=v}return prune(out)}

function ensureStyle(){
  if(q('#p83Style')) return;
  const st=document.createElement('style');st.id='p83Style';st.textContent=`
  .tab[data-view="lab"],.app-nav-card[data-app-view="lab"]{display:none!important}
  #p78TodayCard{scroll-margin-top:16px}
  .p83-checkin-toggle{display:none}
  @media(max-width:760px){
    #viewPainel .dash-scroll{background:#f4f7f8!important}
    #viewPainel .dash-wrap{padding:12px 12px 42px!important;max-width:none!important;width:100%!important}
    #viewPainel .dash-hero{margin:0 0 12px!important;border-radius:24px!important;padding:22px 18px!important;gap:16px!important;box-shadow:0 10px 28px rgba(4,38,55,.08)!important;overflow:hidden!important}
    #viewPainel .dash-hero>div:first-child{min-width:0!important;width:100%!important}
    #viewPainel .dash-hero h2{font-size:31px!important;line-height:1.03!important;letter-spacing:-.035em!important;margin:0!important}
    #viewPainel .dash-hero p{font-size:14px!important;line-height:1.45!important;margin:10px 0 0!important;max-width:none!important}
    #viewPainel .dash-hero .spacer{display:none!important}
    #viewPainel .dash-hero-actions{width:100%!important;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}
    #viewPainel .dash-hero-actions .btn{width:100%!important;min-width:0!important;min-height:46px!important;padding:9px 8px!important;justify-content:center!important;border-radius:13px!important;font-size:12.5px!important;white-space:normal!important;text-align:center!important;line-height:1.15!important}
    #dashDossierBtn{grid-column:auto!important}
    #dashBackupBtn{grid-column:1/-1!important}
    #p78TodayCard{margin:0 0 12px!important;border-radius:20px!important;padding:15px!important;box-shadow:0 8px 22px rgba(10,70,76,.07)!important}
    #p78TodayCard .p78-title{font-size:18px!important}.p78-row{border-radius:13px!important;padding:10px!important}.p78-main b{font-size:12.5px!important}.p78-main span{font-size:10.5px!important}
    #dashKpis{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;margin:0 0 12px!important;width:100%!important}
    #dashKpis .dash-kpi{min-width:0!important;width:100%!important;min-height:108px!important;border-radius:20px!important;padding:16px!important;display:flex!important;flex-direction:column!important;justify-content:center!important;box-shadow:none!important;background:#fff!important;overflow:hidden!important}
    #dashKpis .dash-kpi:nth-child(5){grid-column:1/-1!important;min-height:88px!important}
    #dashKpis .k-n{font-size:34px!important;line-height:1!important}.dash-kpi .k-l{font-size:12px!important;line-height:1.25!important;margin-top:8px!important}
    #viewPainel .dash-grid{display:block!important;width:100%!important}.dash-grid>aside{display:flex!important;gap:12px!important;margin-top:12px!important}
    #viewPainel .dash-card{border-radius:22px!important;padding:15px!important;margin:0!important;box-shadow:none!important;border:1px solid #dbe5e8!important;overflow:hidden!important}
    #viewPainel .dash-card-head{gap:8px!important;align-items:flex-start!important}.dash-card-head h3{font-size:22px!important;line-height:1.08!important}.dash-sub{font-size:12px!important;line-height:1.35!important}
    #dashAttention{gap:12px!important}.p56-panel-section{gap:9px!important}.p56-section-head{padding:3px 1px 5px!important;font-size:14px!important}
    .p56-task{grid-template-columns:1fr!important;gap:11px!important;border-radius:18px!important;padding:14px!important;min-width:0!important;width:100%!important;overflow:hidden!important;box-shadow:none!important}
    .p56-task-main,.p56-task-actions{min-width:0!important;width:100%!important}.p56-task-top{gap:6px!important}.p56-source{font-size:9px!important}.p56-date{font-size:10px!important}.p56-who{font-size:12px!important}.p56-what{font-size:17px!important;line-height:1.18!important;overflow-wrap:anywhere!important}.p56-detail{font-size:13px!important;line-height:1.42!important;overflow-wrap:anywhere!important;white-space:normal!important;max-width:100%!important}
    .p56-task-actions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;justify-content:stretch!important}.p56-task-actions .btn{width:100%!important;min-width:0!important;min-height:44px!important;height:auto!important;padding:9px 8px!important;justify-content:center!important;border-radius:12px!important;font-size:12px!important;white-space:normal!important;text-align:center!important}.p56-task-actions .btn:only-child{grid-column:1/-1!important}
    .p69-state,.p76-sent{max-width:100%!important;overflow-wrap:anywhere!important}.p70-smart-request,.p69-wait,.p72-checkin-remind{min-height:46px!important}
    .p56-done-box{border-radius:16px!important}.p56-done-row{grid-template-columns:26px minmax(0,1fr)!important}.p56-done-main span{white-space:normal!important;overflow:visible!important}.p56-undo{grid-column:2!important;text-align:left!important}
    .health-row{padding:10px 0!important}.health-person{min-width:0!important}.health-person b,.health-person span{overflow-wrap:anywhere!important}.health-score{font-size:10px!important}
    .p83-checkin-toggle{display:flex!important;width:100%!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;border:1px solid #d8e5e8!important;background:#f7fbfc!important;color:#274650!important;border-radius:14px!important;padding:11px 12px!important;font-weight:850!important;font-size:12px!important;margin:2px 0 3px!important}
    .p83-checkin-hidden{display:none!important}
  }
  `;document.head.appendChild(st)
}

function relocateTodayCard(){const hero=q('#viewPainel .dash-hero'),card=q('#p78TodayCard');if(hero&&card&&hero.nextElementSibling!==card)hero.insertAdjacentElement('afterend',card)}
function hideLab(){const x=q('.app-nav-card[data-app-view="lab"]');if(x)x.style.display='none'}
function organizeCheckins(){
  if(innerWidth>760)return;
  const root=q('#dashAttention');if(!root)return;
  const cards=qa('.p56-task',root).filter(c=>!c.classList.contains('p77-hidden-treated')&&/CHECK-IN/i.test(c.querySelector('.p56-source')?.textContent||''));
  let ctrl=q('#p83CheckinToggle');
  if(cards.length<=2){ctrl?.remove();cards.forEach(c=>c.classList.remove('p83-checkin-hidden'));return}
  if(!ctrl){ctrl=document.createElement('button');ctrl.type='button';ctrl.id='p83CheckinToggle';ctrl.className='p83-checkin-toggle';ctrl.onclick=()=>{checkinsExpanded=!checkinsExpanded;organizeCheckins()};cards[0].insertAdjacentElement('beforebegin',ctrl)}
  ctrl.innerHTML=`<span>👀 Check-ins pendentes</span><b>${cards.length} · ${checkinsExpanded?'recolher':'ver todos'}</b>`;
  cards.forEach((c,i)=>c.classList.toggle('p83-checkin-hidden',!checkinsExpanded&&i>=2));
}
function polish(){ensureStyle();relocateTodayCard();hideLab();organizeCheckins()}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;polish()})}

async function profile(){const f=F(),u=uid();if(!f||!u)return null;try{const s=await f.getDoc(f.doc(window.db,'rede_users',u));return s.exists()?{...s.data(),uid:u}:null}catch(_e){return null}}
async function ensurePrivateRoot(memberId,name){
  const f=F(),u=uid(),ref=f.doc(window.db,'rede_personal_repositories',memberId);let s=await f.getDoc(ref);
  if(!s.exists()){
    await f.setDoc(ref,{ownerUid:u,ownerMemberId:memberId,ownerName:name||'Carbonauta',allowedMemberIds:[memberId],collaboratorMemberIds:[],createdAt:f.serverTimestamp(),updatedAt:f.serverTimestamp()});
    s=await f.getDoc(ref)
  }
  return ref
}
async function pushAcks(){
  if(pushing||!cloudRef||!F())return;pushing=true;
  try{const data=prune(loadJSON(ackKey()));await F().updateDoc(cloudRef,{panelAcks:data,panelAcksUpdatedAt:F().serverTimestamp(),updatedAt:F().serverTimestamp()})}catch(e){console.warn('P83 sincronização painel',e)}finally{pushing=false}
}
function applyRemote(remote){
  const local=loadJSON(ackKey()),merged=mergeAcks(remote||{},local);
  if(!same(local,merged)){saveJSON(ackKey(),merged);try{window.renderPainel?.();window.p77Refresh?.()}catch(_e){}}
  if(!same(prune(remote||{}),merged))setTimeout(pushAcks,80)
}
function wrapAckFunctions(){
  if(window.p56AckItem&&!window.p56AckItem.__p83){const old=window.p56AckItem;const fn=function(key){const r=old.apply(this,arguments);setTimeout(pushAcks,60);return r};fn.__p83=true;window.p56AckItem=fn}
  if(window.p56UndoAck&&!window.p56UndoAck.__p83){const old=window.p56UndoAck;const fn=function(key){const r=old.apply(this,arguments);setTimeout(pushAcks,60);return r};fn.__p83=true;window.p56UndoAck=fn}
}
async function startCloudSync(){
  if(cloudStarted||!window.db||!F()||!window.auth?.currentUser)return;cloudStarted=true;
  try{
    const p=await profile();if(!p?.memberId){cloudStarted=false;return}
    let name='Carbonauta';try{const m=await F().getDoc(F().doc(window.db,'rede_members',p.memberId));if(m.exists())name=m.data()?.nome||name}catch(_e){}
    cloudRef=await ensurePrivateRoot(p.memberId,name);
    const first=await F().getDoc(cloudRef),remote=first.data()?.panelAcks||{};applyRemote(remote);
    cloudUnsub?.();cloudUnsub=F().onSnapshot(cloudRef,s=>{if(s.exists())applyRemote(s.data()?.panelAcks||{})},e=>console.warn('P83 painel cloud',e));
    wrapAckFunctions();setTimeout(pushAcks,150)
  }catch(e){cloudStarted=false;console.warn('P83 iniciar sincronização',e)}
}
function waitCloud(){if(window.db&&F()&&window.auth?.currentUser)startCloudSync();else setTimeout(waitCloud,500)}

async function activateWaiting(reg){try{if(reg?.waiting)reg.waiting.postMessage('SKIP_WAITING')}catch(_e){}}
async function checkUpdate(){if(!('serviceWorker' in navigator))return;try{const reg=await navigator.serviceWorker.getRegistration('./');if(!reg)return;await reg.update();await activateWaiting(reg)}catch(e){console.warn('P83 update check',e)}}
if('serviceWorker' in navigator){navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloading)return;reloading=true;const u=new URL(location.href);u.searchParams.set('build',BUILD);u.searchParams.set('apprefresh',Date.now().toString());location.replace(u.href)});window.addEventListener('focus',()=>{checkUpdate();startCloudSync();polish()});document.addEventListener('visibilitychange',()=>{if(!document.hidden){checkUpdate();startCloudSync();polish()}});setTimeout(checkUpdate,1200)}
window.addEventListener('storage',e=>{if(e.key===ackKey()){try{window.renderPainel?.();window.p77Refresh?.()}catch(_e){}}});
const obs=new MutationObserver(schedule);obs.observe(document.documentElement,{childList:true,subtree:true});
ensureStyle();polish();waitCloud();setInterval(()=>{wrapAckFunctions();polish()},1800);
window.CARBONAUTAS_RUNTIME_BUILD=BUILD;
console.info('Carbonautas P83 sincronização + painel mobile carregado');
})();
