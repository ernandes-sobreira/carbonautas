/* Carbonautas P186 · compatibilidade de imagens do Mural
   - mostra prints/fotos vindos do Storage ou fallback inline
   - reconhece campos novos e legados
   - injeta a imagem tanto no card compacto quanto na leitura ampliada
   - não altera Firebase, regras ou VPS
*/
(function(){
'use strict';
if(window.__CARBONAUTAS_P186_MURAL_IMAGE)return;
window.__CARBONAUTAS_P186_MURAL_IMAGE=true;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
let queued=false;
function S(){try{return window.state||state||{}}catch(_e){return{}}}
function byId(id){return (S().feed||[]).find(p=>String(p.id)===String(id))||null}
function src(p){
 if(!p)return'';
 const vals=[p.inlineImage,p.fileUrl,p.imageUrl,p.attachmentUrl,p.printUrl,p.photoUrl,p.fileData];
 for(const v of vals){const s=String(v||'').trim();if(/^data:image\//i.test(s)||/^https?:\/\//i.test(s)||/^blob:/i.test(s))return s}
 return''
}
function looksImage(p,s){
 if(!s)return false;
 if(/^data:image\//i.test(s))return true;
 const mime=String(p?.mimeType||p?.mime||'').toLowerCase(),name=String(p?.fileName||'');
 return String(p?.attachmentKind||'').toLowerCase()==='image'||mime.startsWith('image/')||/\.(png|jpe?g|webp|gif)(\?|$)/i.test(name)||/\.(png|jpe?g|webp|gif)(\?|$)/i.test(s)
}
function patchCompact(){
 $$('#muralMsgs article.feed-card[data-mural-type="post"]').forEach(card=>{
  const p=byId(card.dataset.muralId),u=src(p);if(!looksImage(p,u))return;
  const media=card.querySelector('.p182-c-media');if(media&&!media.querySelector('img'))media.innerHTML=`<img src="${u.replace(/"/g,'&quot;')}" alt="Imagem da publicação" loading="lazy">`;
  if(!card.querySelector('.feed-image')){const im=document.createElement('img');im.className='feed-image';im.src=u;im.alt=p?.title||'Imagem da publicação';const body=card.querySelector('.feed-body');body?.insertAdjacentElement('afterend',im)}
 })
}
function patchDeck(){
 $$('#p182MuralDeck .p182-detail[data-p182-id]').forEach(detail=>{
  const p=byId(detail.dataset.p182Id),u=src(p);if(!looksImage(p,u))return;
  const card=detail.querySelector('.p182-detail-card');if(!card)return;
  let im=card.querySelector('.p182-d-image');
  if(!im){im=document.createElement('img');im.className='p182-d-image';im.alt='Imagem da publicação';const head=card.querySelector('.p182-d-head');head?.insertAdjacentElement('afterend',im)}
  if(im.src!==u)im.src=u
 })
}
function patch(){queued=false;patchCompact();patchDeck()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(patch)}
function boot(){
 new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
 window.addEventListener('pageshow',schedule,{passive:true});
 schedule();setTimeout(schedule,250);setTimeout(schedule,900)
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
