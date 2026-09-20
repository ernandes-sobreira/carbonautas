/* Carbonautas P181D · capa “Olha rapidão” + resgate seguro do Menu
   - troca o kicker “Sua agenda” por “Olha rapidão”
   - remove “+ Atividade” da capa; atividade fica na Agenda
   - mantém apenas Ver agenda + Ver mural, do mesmo tamanho
   - adiciona fallback do botão MENU sem bloquear o handler original
   - atualiza o card “Ó nóis!” para representar Mural, agenda, fotos e vida da rede
*/
(function(){
'use strict';
if(window.__CARBONAUTAS_P181_HOME_RAPIDAO)return;
window.__CARBONAUTAS_P181_HOME_RAPIDAO=true;

const $=(s,r=document)=>r.querySelector(s);
let observer=null,menuObserver=null,menuBound=false;

function openMural(){
 try{
  if(typeof switchView==='function')switchView('mural');
  else if(typeof window.switchView==='function')window.switchView('mural');
 }catch(_e){try{window.switchView?.('mural')}catch(__e){}}
}
function css(){
 if($('#p181Style'))return;
 const st=document.createElement('style');st.id='p181Style';st.textContent=`
 #p174AgendaFocus .p181-mural-btn{background:#fff!important;color:#31545c!important;border-color:#d4e2df!important}
 #p174AgendaFocus .p181-mural-btn:active{transform:scale(.985)}
 #p174AgendaFocus .p174-head-actions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:6px!important;min-width:min(250px,100%)!important}
 #p174AgendaFocus .p174-head-actions>button{width:100%!important;margin:0!important;white-space:nowrap!important;min-height:36px!important}
 @media(max-width:650px){
  #p174AgendaFocus .p174-head-actions{width:100%!important;min-width:0!important;margin-top:9px!important}
 }
 `;document.head.appendChild(st)
}
function patch(){
 const box=$('#p174AgendaFocus');if(!box)return false;
 const kicker=$('.p174-kicker',box);if(kicker&&kicker.textContent!=='OLHA RAPIDÃO')kicker.textContent='OLHA RAPIDÃO';
 const actions=$('.p174-head-actions',box);if(actions){
  actions.querySelectorAll('[data-p174-new]').forEach(b=>b.remove());
  if(!actions.querySelector('.p181-mural-btn')){
   const b=document.createElement('button');b.type='button';b.className='p181-mural-btn';b.textContent='Ver mural';b.setAttribute('aria-label','Ver mural');b.onclick=openMural;actions.appendChild(b)
  }
 }
 return true
}
function watch(){
 const box=$('#p174AgendaFocus');if(!box)return false;
 if(observer)observer.disconnect();
 observer=new MutationObserver(()=>patch());observer.observe(box,{childList:true,subtree:true});
 patch();return true
}

function patchMuralMenuCard(){
 const card=$('.app-nav-card[data-app-view="mural"]');
 if(!card)return false;
 const title=card.querySelector('h3,.app-nav-title,strong');
 if(title&&title.textContent.trim()!=='Ó nóis!')title.textContent='Ó nóis!';
 const desc=card.querySelector('p,.app-nav-desc,.app-nav-subtitle');
 if(desc&&desc.textContent.trim()!=='Mural, agenda, fotos e vida da rede')desc.textContent='Mural, agenda, fotos e vida da rede';
 let icon=card.querySelector('.app-nav-icon,.app-nav-emoji,.app-nav-card-icon,.nav-icon,.app-nav-card-emoji,[data-nav-icon]');
 if(!icon){
  icon=[...card.querySelectorAll('*')].find(el=>/^(📸|📷|📹)$/.test(String(el.textContent||'').trim()))||null;
 }
 if(icon&&icon.textContent.trim()!=='🫂')icon.textContent='🫂';
 card.setAttribute('aria-label','Ó nóis! — Mural, agenda, fotos e vida da rede');
 return true
}
function watchMuralMenuCard(){
 const menu=$('#appMenuBackdrop');if(!menu)return false;
 if(menuObserver)menuObserver.disconnect();
 menuObserver=new MutationObserver(()=>patchMuralMenuCard());
 menuObserver.observe(menu,{childList:true,subtree:true});
 patchMuralMenuCard();return true
}

function looksLikeMenuButton(el){
 if(!el)return false;
 const txt=String(el.textContent||'').replace(/\s+/g,' ').trim().toUpperCase();
 const aria=String(el.getAttribute?.('aria-label')||'').toLowerCase();
 const id=String(el.id||'').toLowerCase();
 return txt==='MENU'||aria==='menu'||aria.includes('abrir menu')||id==='menubtn'||id==='appmenubtn'||id==='mobilemenubtn'
}
function forceOpenMenu(){
 const menu=$('#appMenuBackdrop');if(!menu)return false;
 if(menu.classList.contains('open'))return true;
 menu.classList.add('open');
 menu.setAttribute('aria-hidden','false');
 document.body.classList.add('p129-menu-open');
 patchMuralMenuCard();
 return true
}
function closeMenuFallback(){
 const menu=$('#appMenuBackdrop');if(!menu)return;
 menu.classList.remove('open');menu.setAttribute('aria-hidden','true');document.body.classList.remove('p129-menu-open')
}
function bindMenuFallback(){
 if(menuBound)return;menuBound=true;
 // Não cancela o clique original. Só entra se o handler nativo não tiver aberto o menu.
 document.addEventListener('click',e=>{
  const trigger=e.target?.closest?.('button,a,[role="button"]');
  if(trigger&&looksLikeMenuButton(trigger)){
   setTimeout(()=>{patchMuralMenuCard();const menu=$('#appMenuBackdrop');if(menu&&!menu.classList.contains('open'))forceOpenMenu()},70);
   return
  }
  const menu=$('#appMenuBackdrop');
  if(menu?.classList.contains('open')&&e.target===menu)closeMenuFallback()
 },true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenuFallback()});
}
function boot(){
 css();bindMenuFallback();
 watch();watchMuralMenuCard();patchMuralMenuCard();
 let tries=0;const t=setInterval(()=>{
  tries++;
  const homeReady=watch();
  const menuReady=watchMuralMenuCard();
  patchMuralMenuCard();
  if((homeReady&&menuReady)||tries>30)clearInterval(t)
 },120)
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
