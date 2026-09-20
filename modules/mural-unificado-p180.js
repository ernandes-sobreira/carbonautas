/* Carbonautas P180 · Mural único para toda a Rede
   - remove a seção “Mensagens direcionadas”
   - todas as publicações ficam na mesma faixa horizontal
   - remove chips de destinatário, pois o Mural é público para a Rede
   - corrige corte/colapso vertical dos cards no celular
   - não altera Firebase nem VPS
*/
(function(){
'use strict';
if(window.__CARBONAUTAS_P180_MURAL_UNIFICADO)return;
window.__CARBONAUTAS_P180_MURAL_UNIFICADO=true;

const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
let queued=false,observer=null;

function norm(v){return String(v||'').replace(/\s+/g,' ').trim().toLowerCase()}
function isDirectedTitle(el){const t=norm(el?.textContent);return t.includes('mensagens direcionadas')||t.includes('mensagem direcionada')}
function isPublicTitle(el){return /publica[cç][oõ]es do mural/i.test(el?.textContent||'')}

function css(){if($('#p180MuralStyle'))return;const st=document.createElement('style');st.id='p180MuralStyle';st.textContent=`
#viewMural .p180-hidden-directed{display:none!important}
#viewMural .p177-swipe-section{display:block!important;height:auto!important;max-height:none!important;overflow:visible!important;padding-bottom:2px!important}
#viewMural .p177-swipe-section>.mural-all-title{position:relative!important;top:auto!important;transform:none!important;z-index:2!important;margin:0 0 10px!important;background:#eaf2f7!important}
#viewMural .p177-post-rail{display:flex!important;align-items:flex-start!important;gap:10px!important;width:100%!important;height:auto!important;min-height:0!important;max-height:none!important;overflow-x:auto!important;overflow-y:hidden!important;scroll-snap-type:x mandatory!important;-webkit-overflow-scrolling:touch!important;padding:0 2px 12px!important;margin:0!important;background:transparent!important}
#viewMural .p177-post-rail>.mural-post{position:relative!important;display:block!important;flex:0 0 min(86vw,390px)!important;width:min(86vw,390px)!important;height:auto!important;min-height:0!important;max-height:none!important;overflow:hidden!important;scroll-snap-align:start!important;align-self:flex-start!important;margin:0!important}
#viewMural .p180-target-chip{display:none!important}
@media(max-width:760px){
 #viewMural #muralMsgs{overflow:visible!important}
 #viewMural .mural-all-section.p177-swipe-section{height:auto!important;max-height:none!important;overflow:visible!important}
 #viewMural .p177-post-rail{min-height:1px!important;padding-bottom:14px!important}
 #viewMural .p177-post-rail>.mural-post{flex-basis:86vw!important;width:86vw!important}
}
`;document.head.appendChild(st)}

function publicSection(){
 const secs=$$('#muralMsgs .mural-all-section');
 return secs.find(s=>isPublicTitle(s.querySelector('.mural-all-title')))||secs.find(s=>s.querySelector('article.feed-card[data-mural-type="post"]'))||null
}
function ensureRail(sec){
 if(!sec)return null;
 let rail=sec.querySelector('.p177-post-rail');
 if(!rail){
  rail=document.createElement('div');rail.className='p177-post-rail';
  const title=sec.querySelector('.mural-all-title');
  title?title.insertAdjacentElement('afterend',rail):sec.prepend(rail)
 }
 sec.classList.add('p177-swipe-section');
 return rail
}
function hideTargetChips(card){
 if(!card)return;
 card.querySelectorAll('span,small,div,button').forEach(el=>{
  if(el.children.length>0)return;
  const t=norm(el.textContent);
  if(/^para:\s*/.test(t)||t==='todo o grupo'||t==='toda a rede')el.classList.add('p180-target-chip')
 })
}
function unify(){
 if((document.body?.dataset?.view||'')!=='mural'&&(document.body?.dataset?.view||'')!=='feed')return;
 const box=$('#muralMsgs');if(!box)return;
 const primary=publicSection();if(!primary)return;
 const rail=ensureRail(primary);if(!rail)return;

 // Todos os posts passam a viver na mesma faixa, independentemente do destino legado.
 const posts=$$('#muralMsgs article.feed-card[data-mural-type="post"]');
 posts.forEach(card=>{hideTargetChips(card);if(card.parentElement!==rail)rail.appendChild(card)});

 // Some de vez com o bloco “Mensagens direcionadas” e seus separadores.
 $$('#muralMsgs .mural-all-title').filter(isDirectedTitle).forEach(title=>{
  const sec=title.closest('.mural-all-section');
  if(sec&&sec!==primary)sec.remove();else title.remove()
 });
 $$('#muralMsgs .mural-all-section').forEach(sec=>{
  if(sec===primary)return;
  const title=sec.querySelector('.mural-all-title');
  if(isDirectedTitle(title))sec.remove()
 });

 // Remove separadores de data que sobravam entre os dois blocos.
 $$('#muralMsgs .day-sep').forEach(sep=>{
  if(!sep.closest('.p177-post-rail'))sep.remove()
 });

 primary.style.height='auto';primary.style.maxHeight='none';primary.style.overflow='visible';
 rail.style.height='auto';rail.style.maxHeight='none';
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;unify();observe()})}
function observe(){const box=$('#muralMsgs');if(!box||box.dataset.p180Observed==='1')return;box.dataset.p180Observed='1';observer=new MutationObserver(()=>schedule());observer.observe(box,{childList:true,subtree:true})}
function bind(){if(document.documentElement.dataset.p180MuralBound==='1')return;document.documentElement.dataset.p180MuralBound='1';new MutationObserver(ms=>{if(ms.some(m=>m.attributeName==='data-view'))schedule()}).observe(document.body,{attributes:true,attributeFilter:['data-view']});window.addEventListener('resize',schedule,{passive:true})}
function boot(){css();bind();observe();schedule();setTimeout(schedule,120);setTimeout(schedule,450);setTimeout(schedule,1100)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
