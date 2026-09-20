/* Carbonautas P186B · imagens + compartilhamento do Mural
   - miniatura usa contain: mostra a imagem inteira e não recorta só a faixa preta
   - mantém compatibilidade com Storage, inlineImage e campos legados
   - leitura ampliada recebe Compartilhar e Baixar card
   - Compartilhar usa o menu nativo do celular (WhatsApp, e-mail e apps compatíveis)
   - não altera Firebase, regras ou VPS
*/
(function(){
'use strict';
if(window.__CARBONAUTAS_P186B_MURAL_IMAGE)return;
window.__CARBONAUTAS_P186B_MURAL_IMAGE=true;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
let queued=false;
const shareFiles=new Map();
function S(){try{return window.state||state||{}}catch(_e){return{}}}
function byId(id){return (S().feed||[]).find(p=>String(p.id)===String(id))||null}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
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
function addCss(){
 if($('#p186bStyle'))return;
 const st=document.createElement('style');st.id='p186bStyle';st.textContent=`
 /* Não recorta prints verticais: mostra a imagem inteira dentro da miniatura. */
 #viewMural .p182-c-media{background:#f3f7f6!important}
 #viewMural .p182-c-media img{object-fit:contain!important;object-position:center!important;background:#f3f7f6!important}
 #viewMural .mural-post .feed-image{object-fit:contain!important;background:#f3f7f6!important}
 #p182MuralDeck .p182-d-image{object-fit:contain!important;object-position:center!important;background:#f3f7f6!important}
 #p182MuralDeck .p186-share-row{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:9px}
 #p182MuralDeck .p186-share-btn{appearance:none;border:1px solid #cfe0dc;border-radius:12px;min-height:46px;padding:10px 12px;background:#168f94;color:#fff;font:900 11px/1.1 inherit;cursor:pointer}
 #p182MuralDeck .p186-download-btn{background:#fff;color:#245d64}
 #p182MuralDeck .p186-share-btn:disabled{opacity:.58;cursor:wait}
 @media(max-width:520px){#p182MuralDeck .p186-share-row{grid-template-columns:1fr}}
 `;document.head.appendChild(st)
}
function dataUrlFile(dataUrl,name='carbonautas.jpg'){
 try{
  const m=String(dataUrl||'').match(/^data:([^;,]+);base64,(.*)$/);if(!m)return null;
  const bin=atob(m[2]),a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);
  return new File([a],name,{type:m[1]||'image/jpeg'})
 }catch(_e){return null}
}
async function preloadShareFile(p,u){
 if(!p?.id||!looksImage(p,u)||shareFiles.has(String(p.id)))return;
 if(/^data:image\//i.test(u)){const f=dataUrlFile(u,p.fileName||`carbonautas-${p.id}.jpg`);if(f)shareFiles.set(String(p.id),f);return}
 if(!/^https?:\/\//i.test(u))return;
 try{
  const r=await fetch(u,{mode:'cors',cache:'force-cache'});if(!r.ok)return;
  const b=await r.blob();if(!String(b.type||'').startsWith('image/'))return;
  shareFiles.set(String(p.id),new File([b],p.fileName||`carbonautas-${p.id}.jpg`,{type:b.type||'image/jpeg'}))
 }catch(_e){}
}
function postText(p){
 const parts=[];
 if(p?.title)parts.push(String(p.title).trim());
 if(p?.text)parts.push(String(p.text).trim());
 if(p?.externalUrl)parts.push(String(p.externalUrl).trim());
 return parts.filter(Boolean).join('\n\n')
}
function wrap(ctx,text,maxWidth){
 const out=[];String(text||'').split(/\n/).forEach(par=>{
  if(!par.trim()){out.push('');return}
  const words=par.split(/\s+/);let line='';
  words.forEach(w=>{const t=line?line+' '+w:w;if(ctx.measureText(t).width>maxWidth&&line){out.push(line);line=w}else line=t});
  if(line)out.push(line)
 });return out
}
async function loadImage(u){
 if(!u)return null;
 try{
  let blob;
  if(/^data:image\//i.test(u)){const f=dataUrlFile(u);blob=f}
  else{const r=await fetch(u,{mode:'cors',cache:'force-cache'});if(!r.ok)return null;blob=await r.blob()}
  if(!blob)return null;
  if('createImageBitmap'in window)return await createImageBitmap(blob);
  const url=URL.createObjectURL(blob);return await new Promise((res,rej)=>{const im=new Image();im.onload=()=>{URL.revokeObjectURL(url);res(im)};im.onerror=()=>{URL.revokeObjectURL(url);rej(new Error('imagem'))};im.src=url})
 }catch(_e){return null}
}
async function makeCardBlob(p){
 const W=1080,H=1350,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
 x.fillStyle='#f4faf8';x.fillRect(0,0,W,H);
 x.fillStyle='#ffffff';roundRect(x,54,54,W-108,H-108,38);x.fill();
 x.fillStyle='#168f94';x.font='700 34px sans-serif';x.fillText('Carbonautas',92,118);
 x.fillStyle='#728b90';x.font='500 22px sans-serif';x.fillText('Mural da rede',92,154);
 const u=src(p),im=await loadImage(u);let y=205;
 if(im){
  const bx=92,by=y,bw=W-184,bh=410;x.fillStyle='#eef5f3';roundRect(x,bx,by,bw,bh,24);x.fill();
  const iw=im.width||1,ih=im.height||1,scale=Math.min(bw/iw,bh/ih),dw=iw*scale,dh=ih*scale;
  x.drawImage(im,bx+(bw-dw)/2,by+(bh-dh)/2,dw,dh);y=by+bh+52
 }
 x.fillStyle='#173b47';x.font='700 48px sans-serif';const title=String(p?.title||'Publicação do Mural');
 const tl=wrap(x,title,W-184).slice(0,3);tl.forEach(l=>{x.fillText(l,92,y);y+=58});y+=18;
 x.fillStyle='#3f5d64';x.font='400 31px sans-serif';const lines=wrap(x,String(p?.text||''),W-184).slice(0,12);lines.forEach(l=>{if(y<H-190){x.fillText(l,92,y);y+=43}});
 if(p?.externalUrl&&y<H-145){y+=16;x.fillStyle='#168f94';x.font='600 25px sans-serif';const ul=wrap(x,String(p.externalUrl),W-184).slice(0,2);ul.forEach(l=>{x.fillText(l,92,y);y+=34})}
 x.fillStyle='#7b9095';x.font='500 22px sans-serif';x.fillText(String(p?.authorName||'Carbonauta'),92,H-92);
 return await new Promise(res=>c.toBlob(res,'image/jpeg',0.9))
}
function roundRect(ctx,x,y,w,h,r){
 r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()
}
async function sharePost(p,btn){
 const text=postText(p),title=p?.title||'Carbonautas',file=shareFiles.get(String(p?.id||''));
 try{
  const payload={title,text};
  if(file&&navigator.canShare?.({files:[file]}))payload.files=[file];
  if(navigator.share){await navigator.share(payload);return}
 }catch(e){if(e?.name==='AbortError')return}
 try{await navigator.clipboard?.writeText(text)}catch(_e){}
 try{if(typeof toast==='function')toast('Mensagem copiada. Você pode colar no WhatsApp, e-mail ou outro app.')}catch(_e){}
}
async function downloadCard(p,btn){
 const old=btn?.textContent;if(btn){btn.disabled=true;btn.textContent='Preparando…'}
 try{
  const blob=await makeCardBlob(p);if(!blob)throw new Error('card');
  const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=`carbonautas-${String(p?.title||'mural').toLowerCase().replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').slice(0,45)||'mural'}.jpg`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000)
 }catch(_e){try{if(typeof toast==='function')toast('Não consegui gerar o card agora.')}catch(__e){}}
 finally{if(btn){btn.disabled=false;btn.textContent=old||'⬇️ Baixar card'}}
}
function patchCompact(){
 $$('#muralMsgs article.feed-card[data-mural-type="post"]').forEach(card=>{
  const p=byId(card.dataset.muralId),u=src(p);if(!looksImage(p,u))return;
  const media=card.querySelector('.p182-c-media');if(media){let im=media.querySelector('img');if(!im){media.innerHTML=`<img src="${esc(u)}" alt="Imagem da publicação" loading="lazy">`;im=media.querySelector('img')}if(im&&im.getAttribute('src')!==u)im.setAttribute('src',u)}
  if(!card.querySelector('.feed-image')){const im=document.createElement('img');im.className='feed-image';im.src=u;im.alt=p?.title||'Imagem da publicação';const body=card.querySelector('.feed-body');body?.insertAdjacentElement('afterend',im)}
  preloadShareFile(p,u)
 })
}
function ensureShareRow(detail,p){
 const body=detail.querySelector('.p182-d-body');if(!body||body.querySelector('.p186-share-row'))return;
 const row=document.createElement('div');row.className='p186-share-row';row.innerHTML='<button type="button" class="p186-share-btn">📤 Compartilhar</button><button type="button" class="p186-share-btn p186-download-btn">⬇️ Baixar card</button>';
 const reacts=body.querySelector('.p182-d-react');reacts?body.insertBefore(row,reacts):body.appendChild(row);
 row.querySelector('.p186-share-btn').onclick=e=>{e.preventDefault();e.stopPropagation();sharePost(p,e.currentTarget)};
 row.querySelector('.p186-download-btn').onclick=e=>{e.preventDefault();e.stopPropagation();downloadCard(p,e.currentTarget)}
}
function patchDeck(){
 $$('#p182MuralDeck .p182-detail[data-p182-id]').forEach(detail=>{
  const p=byId(detail.dataset.p182Id),u=src(p);if(!p)return;
  if(looksImage(p,u)){
   const card=detail.querySelector('.p182-detail-card');if(card){let im=card.querySelector('.p182-d-image');if(!im){im=document.createElement('img');im.className='p182-d-image';im.alt='Imagem da publicação';const head=card.querySelector('.p182-d-head');head?.insertAdjacentElement('afterend',im)}if(im.getAttribute('src')!==u)im.setAttribute('src',u)}
   preloadShareFile(p,u)
  }
  ensureShareRow(detail,p)
 })
}
function patch(){queued=false;addCss();patchCompact();patchDeck()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(patch)}
function boot(){
 addCss();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
 window.addEventListener('pageshow',schedule,{passive:true});
 schedule();setTimeout(schedule,250);setTimeout(schedule,900)
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
