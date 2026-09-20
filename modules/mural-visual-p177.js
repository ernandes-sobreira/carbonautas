/* Carbonautas P177 · Mural visual e publicação móvel confiável
   - modal sempre fica acima do FAB/navegação
   - print/foto tem preview antes de publicar
   - imagem anexada aparece dentro do card do Mural
   - publicações do Mural viram uma faixa horizontal arrastável no celular
   - data/hora do Mural têm fallback independente do P176
   - não altera regras do Firebase nem VPS
*/
(function(){
'use strict';
if(window.__CARBONAUTAS_P177_MURAL_VISUAL)return;
window.__CARBONAUTAS_P177_MURAL_VISUAL=true;

const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
let queued=false,lastOpen=false,saveWatch=0,previewUrl='';
function S(){try{return window.state||state||{}}catch(_e){return{}}}
function F(){try{if(window.fbFns)return window.fbFns;if(typeof FB==='function')return FB()}catch(_e){}return null}
function mine(){try{return window.myId||myId||''}catch(_e){return''}}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function isImage(file){return !!file&&(String(file.type||'').startsWith('image/')||/\.(png|jpe?g|webp|gif)$/i.test(file.name||''))}
function isImagePost(p){return !!p?.fileUrl&&(String(p.mime||p.mimeType||'').startsWith('image/')||/\.(png|jpe?g|webp|gif)(\?|$)/i.test(String(p.fileName||p.fileUrl||'')))}

function css(){if($('#p177Style'))return;const st=document.createElement('style');st.id='p177Style';st.textContent=`
body.p177-post-open #mobileMuralFab,body.p177-post-open #mobileMuralSheet{display:none!important}
#postOverlay{z-index:2147483600!important}
#postOverlay .modal{max-height:calc(100dvh - 16px)!important;overflow:hidden!important}
#postOverlay .modal-b{overflow:auto!important;-webkit-overflow-scrolling:touch;padding-bottom:18px!important}
#postOverlay .modal-f{position:sticky!important;bottom:0!important;z-index:5!important;background:#fff!important;border-top:1px solid #dce7e5!important;padding-bottom:calc(12px + env(safe-area-inset-bottom,0px))!important;box-shadow:0 -8px 20px rgba(12,44,50,.08)}
#postOverlay .modal-f #savePostBtn{min-width:132px;justify-content:center}
#postOverlay .modal-f #savePostBtn.p177-saving{opacity:.72;pointer-events:none}
#p177PostPreview{margin-top:10px;border:1px solid #d6e5e2;border-radius:16px;background:#f5faf9;overflow:hidden;display:none}
#p177PostPreview.on{display:block}
#p177PostPreview img{display:block;width:100%;max-height:250px;object-fit:contain;background:#eef5f3}
#p177PostPreview .p177-file{display:flex;align-items:center;gap:10px;padding:11px 12px;color:#31545c;font-size:12px;font-weight:800}
#p177PostStatus{display:none;margin:8px 0 0;border-radius:10px;padding:8px 10px;font-size:10px;font-weight:800;line-height:1.35}
#p177PostStatus.on{display:block;background:#eef7f5;color:#23666a}#p177PostStatus.err{background:#fff0f1;color:#a33d4e}
#viewMural .mural-post .feed-image{display:block!important;width:calc(100% - 24px)!important;max-width:none!important;max-height:300px!important;object-fit:cover!important;margin:0 12px 12px!important;border-radius:16px!important;border:1px solid #dbe7e5!important;background:#eef5f3!important}
#viewMural .mural-post.p177-has-image .feed-body{padding-bottom:10px}
.p177-post-rail{display:flex;gap:10px;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;scrollbar-width:none;padding:2px 2px 8px}
.p177-post-rail::-webkit-scrollbar{display:none}.p177-post-rail>.mural-post{flex:0 0 min(84vw,390px);scroll-snap-align:start;margin:0!important;align-self:stretch}
.p177-swipe-section>.day-sep{display:none!important}.p177-swipe-section>.mural-all-title{margin-bottom:1px}
.p177-swipe-note{font-size:9px;color:#71858b;margin:-5px 2px 8px;font-weight:750}
@media(max-width:760px){#postOverlay{align-items:flex-start!important;padding:7px!important}#postOverlay .modal{max-height:calc(100dvh - 14px)!important;border-radius:20px!important}#postOverlay .modal-h{padding:13px 14px!important}#postOverlay .modal-b{padding:13px 14px 20px!important}#postOverlay .modal-f{padding-left:12px!important;padding-right:12px!important}.p177-post-rail>.mural-post{flex-basis:86vw}#viewMural .mural-post .feed-image{max-height:230px!important}}
`;document.head.appendChild(st)}

function ensureDateFields(){
 const title=$('#postTitle');if(!title)return;
 if(!$('#p176PostDateRow')){
  const row=document.createElement('div');row.id='p176PostDateRow';row.className='fg';row.innerHTML='<div class="p176-post-field"><label>Data / prazo (opcional)</label><input type="date" id="p176PostDate"></div><div class="p176-post-field"><label>Hora (opcional)</label><input type="time" id="p176PostTime"></div><div class="p176-date-hint">Com data, esta publicação também aparece em “O que precisa da sua atenção”. Sem data, fica somente no Mural.</div>';title.closest('.fg')?.before(row)
 }
}
function ensureComposer(){
 const input=$('#postFile'),pick=$('#postFilePick');if(!input||!pick)return;
 const fg=input.closest('.fg');const label=fg?.querySelector('label');if(label)label.textContent='Print, foto ou arquivo (opcional; até 15 MB)';pick.textContent='🖼 Adicionar print, foto ou arquivo';
 let pv=$('#p177PostPreview');if(!pv){pv=document.createElement('div');pv.id='p177PostPreview';(fg||pick.parentElement)?.appendChild(pv)}
 let status=$('#p177PostStatus');if(!status){status=document.createElement('div');status.id='p177PostStatus';$('#postOverlay .modal-b')?.appendChild(status)}
 ensureDateFields();
}
function revokePreview(){if(previewUrl){try{URL.revokeObjectURL(previewUrl)}catch(_e){}previewUrl=''}}
function showFile(file){ensureComposer();const pv=$('#p177PostPreview');if(!pv)return;revokePreview();if(!file){pv.className='';pv.innerHTML='';return}pv.className='on';if(isImage(file)){previewUrl=URL.createObjectURL(file);pv.innerHTML=`<img src="${esc(previewUrl)}" alt="Prévia do print"><div class="p177-file">🖼 ${esc(file.name||'imagem')}</div>`}else pv.innerHTML=`<div class="p177-file">📎 ${esc(file.name||'arquivo')}</div>`}
function setStatus(text='',err=false){const s=$('#p177PostStatus');if(!s)return;s.textContent=text;s.className=text?'on'+(err?' err':''):''}
function resetComposer(){ensureComposer();showFile(null);setStatus('');const b=$('#savePostBtn');if(b){b.classList.remove('p177-saving');b.textContent='Publicar'} }

function newPostSince(before,title,text){return (S().feed||[]).find(p=>!before.has(String(p.id))&&String(p.authorId||'')===String(mine())&&(!title||String(p.title||'')===title)&&(!text||String(p.text||'')===text))||null}
async function persistDate(post,date,time){if(!post||!date)return;const f=F();if(!f)return;try{await f.setDoc(f.doc(window.db,'rede_feed',post.id),{actionDate:date,actionTime:time||''},{merge:true})}catch(e){console.warn('P177 action date',e)}}
function watchSaveClick(e){
 const b=e.target.closest?.('#savePostBtn');if(!b||!$('#postOverlay')?.classList.contains('open'))return;
 if(b.classList.contains('p177-saving')){e.preventDefault();e.stopImmediatePropagation();return}
 const before=new Set((S().feed||[]).map(p=>String(p.id))),title=$('#postTitle')?.value.trim()||'',text=$('#postText')?.value.trim()||'',date=$('#p176PostDate')?.value||'',time=$('#p176PostTime')?.value||'',hasFile=!!$('#postFile')?.files?.length;
 setStatus(hasFile?'Enviando o print/arquivo e publicando…':'Publicando…');b.textContent='Publicando…';setTimeout(()=>b.classList.add('p177-saving'),0);
 clearInterval(saveWatch);let ticks=0;saveWatch=setInterval(async()=>{
  ticks++;const p=newPostSince(before,title,text),open=$('#postOverlay')?.classList.contains('open');
  if(p){clearInterval(saveWatch);await persistDate(p,date,time);b.classList.remove('p177-saving');b.textContent='Publicar';setStatus('Publicado ✓');setTimeout(()=>{try{window.refreshHomeAgendaMural?.()}catch(_e){};decorateMural()},100);return}
  if(!open){clearInterval(saveWatch);b.classList.remove('p177-saving');b.textContent='Publicar';return}
  if(ticks>=80){clearInterval(saveWatch);b.classList.remove('p177-saving');b.textContent='Publicar';setStatus('A publicação não terminou. Confira sua conexão e tente novamente.',true)}
 },150)
}

function ensureImageInCard(card,p){if(!card||!p||!isImagePost(p))return;card.classList.add('p177-has-image');let img=card.querySelector('.feed-image');if(!img){img=document.createElement('img');img.className='feed-image';img.src=p.fileUrl;img.alt=p.title||'Imagem da publicação';const body=card.querySelector('.feed-body');body?.insertAdjacentElement('afterend',img)}else if(img.src!==p.fileUrl)img.src=p.fileUrl}
function buildSwipeRail(){
 if(!matchMedia('(max-width:760px)').matches)return;
 $$('#muralMsgs .mural-all-section').forEach(sec=>{
  const title=sec.querySelector('.mural-all-title')?.textContent||'';if(!/Publicações do Mural/i.test(title)||sec.querySelector('.p177-post-rail'))return;
  const posts=Array.from(sec.children).filter(n=>n.matches?.('article.feed-card[data-mural-type="post"]'));if(!posts.length)return;
  sec.classList.add('p177-swipe-section');const note=document.createElement('div');note.className='p177-swipe-note';note.textContent='Arraste para o lado para ver as publicações.';sec.querySelector('.mural-all-title')?.insertAdjacentElement('afterend',note);const rail=document.createElement('div');rail.className='p177-post-rail';note.insertAdjacentElement('afterend',rail);posts.forEach(p=>rail.appendChild(p))
 })
}
function decorateMural(){
 ensureComposer();$$('#muralMsgs .feed-card[data-mural-type="post"]').forEach(card=>{const p=(S().feed||[]).find(x=>String(x.id)===String(card.dataset.muralId));ensureImageInCard(card,p)});buildSwipeRail()
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;ensureComposer();if((document.body?.dataset?.view||'')==='mural')decorateMural()})}
function watchOverlay(){const ov=$('#postOverlay');if(!ov||ov.dataset.p177Observed==='1')return;ov.dataset.p177Observed='1';lastOpen=ov.classList.contains('open');document.body.classList.toggle('p177-post-open',lastOpen);if(lastOpen){ensureComposer();const f=$('#postFile')?.files?.[0];if(f)showFile(f)}new MutationObserver(()=>{const open=ov.classList.contains('open');document.body.classList.toggle('p177-post-open',open);if(open&&!lastOpen){ensureComposer();const f=$('#postFile')?.files?.[0];f?showFile(f):resetComposer()}if(!open&&lastOpen){clearInterval(saveWatch);setTimeout(resetComposer,120)}lastOpen=open}).observe(ov,{attributes:true,attributeFilter:['class']})}
function bind(){
 if(document.documentElement.dataset.p177Bound==='1')return;document.documentElement.dataset.p177Bound='1';
 document.addEventListener('change',e=>{if(e.target?.id==='postFile')showFile(e.target.files?.[0]||null)},false);
 document.addEventListener('click',watchSaveClick,true);
 new MutationObserver(()=>schedule()).observe(document.body,{childList:true,subtree:true});
 window.addEventListener('resize',schedule,{passive:true})
}
function boot(){css();ensureComposer();watchOverlay();bind();schedule();setTimeout(()=>{watchOverlay();ensureComposer();decorateMural()},250)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();