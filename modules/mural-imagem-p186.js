/* Carbonautas P187 · imagens, compartilhamento e gestão do Mural
   - miniatura usa contain: mostra a imagem inteira e não recorta prints verticais
   - mantém compatibilidade com Storage, inlineImage e campos legados
   - leitura ampliada recebe Compartilhar e Baixar card
   - autor da publicação pode editar/excluir; coordenação também
   - edição preserva o anexo atual, com opção de removê-lo
   - não altera regras do Firebase nem VPS
*/
(function(){
'use strict';
if(window.__CARBONAUTAS_P187_MURAL_IMAGE)return;
window.__CARBONAUTAS_P187_MURAL_IMAGE=true;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
let queued=false,editingPost=null;
const shareFiles=new Map();
function S(){try{return window.state||state||{}}catch(_e){return{}}}
function F(){try{if(window.fbFns)return window.fbFns;if(typeof FB==='function')return FB()}catch(_e){}return null}
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
function actor(){try{return typeof currentActor==='function'?currentActor():null}catch(_e){return null}}
function canManage(p){
 const u=window.auth?.currentUser;if(!u||!p)return false;
 if(String(p.authorUid||'')===String(u.uid||''))return true;
 if(String(u.email||'').toLowerCase()==='ernandes.sobreira@gmail.com')return true;
 const a=actor();return String(a?.nivel||'').toLowerCase()==='coord'||String(a?.role||'').toLowerCase()==='coordinator'
}
function toastMsg(t){try{if(typeof toast==='function')toast(t);else console.log(t)}catch(_e){}}
function addCss(){
 if($('#p187Style'))return;
 const st=document.createElement('style');st.id='p187Style';st.textContent=`
 #viewMural .p182-c-media{background:#f3f7f6!important}
 #viewMural .p182-c-media img{object-fit:contain!important;object-position:center!important;background:#f3f7f6!important}
 #viewMural .mural-post .feed-image{object-fit:contain!important;background:#f3f7f6!important}
 #p182MuralDeck .p182-d-image{object-fit:contain!important;object-position:center!important;background:#f3f7f6!important}
 #p182MuralDeck .p186-share-row{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:9px}
 #p182MuralDeck .p186-share-btn{appearance:none;border:1px solid #cfe0dc;border-radius:12px;min-height:46px;padding:10px 12px;background:#168f94;color:#fff;font:900 11px/1.1 inherit;cursor:pointer}
 #p182MuralDeck .p186-download-btn{background:#fff;color:#245d64}
 #p182MuralDeck .p186-share-btn:disabled{opacity:.58;cursor:wait}
 #p182MuralDeck .p187-manage-row{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:9px}
 #p182MuralDeck .p187-manage-btn{appearance:none;border:1px solid #cfe0dc;border-radius:12px;min-height:44px;background:#fff;color:#245d64;font:900 11px/1.1 inherit;cursor:pointer}
 #p182MuralDeck .p187-delete-btn{border-color:#efcfd5;color:#b4485b;background:#fff8f9}
 #p187EditOverlay{position:fixed;inset:0;z-index:2147483646;background:rgba(8,27,34,.62);display:none;align-items:flex-end;justify-content:center}
 #p187EditOverlay.open{display:flex}
 #p187EditOverlay .p187-sheet{width:min(680px,100%);max-height:94dvh;background:#fff;border-radius:24px 24px 0 0;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 -24px 80px rgba(0,0,0,.25)}
 #p187EditOverlay .p187-h{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 18px;border-bottom:1px solid #e1ebe9}
 #p187EditOverlay .p187-h strong{font-size:20px;color:#173b47}
 #p187EditOverlay .p187-x{width:42px;height:42px;border:1px solid #d5e3e0;border-radius:12px;background:#fff;font-size:22px;color:#31545c}
 #p187EditOverlay .p187-b{padding:16px 18px;overflow-y:auto;-webkit-overflow-scrolling:touch}
 #p187EditOverlay label{display:block;margin:0 0 6px;color:#526f76;font-weight:850;font-size:12px}
 #p187EditOverlay input,#p187EditOverlay textarea,#p187EditOverlay select{width:100%;box-sizing:border-box;border:1px solid #ccdeda;border-radius:13px;background:#fff;color:#173b47;font:inherit;padding:12px 13px;margin:0 0 13px}
 #p187EditOverlay textarea{min-height:140px;resize:vertical}
 #p187EditOverlay .p187-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
 #p187EditOverlay .p187-remove{display:flex;align-items:center;gap:9px;padding:10px 0 4px;color:#6d7f84;font-size:11px}.p187-remove input{width:auto!important;margin:0!important}
 #p187EditOverlay .p187-f{display:grid;grid-template-columns:1fr 1.35fr;gap:10px;padding:12px 18px calc(12px + env(safe-area-inset-bottom,0px));border-top:1px solid #e1ebe9;background:#fff}
 #p187EditOverlay .p187-f button{min-height:48px;border-radius:13px;border:1px solid #d1e0dd;background:#fff;color:#31545c;font-weight:900}
 #p187EditOverlay .p187-save{background:#168f94!important;color:#fff!important;border-color:#168f94!important}
 @media(max-width:520px){#p182MuralDeck .p186-share-row,#p182MuralDeck .p187-manage-row{grid-template-columns:1fr 1fr}#p187EditOverlay .p187-grid{grid-template-columns:1fr 1fr}}
 `;document.head.appendChild(st)
}
function dataUrlFile(dataUrl,name='carbonautas.jpg'){
 try{const m=String(dataUrl||'').match(/^data:([^;,]+);base64,(.*)$/);if(!m)return null;const bin=atob(m[2]),a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return new File([a],name,{type:m[1]||'image/jpeg'})}catch(_e){return null}
}
async function preloadShareFile(p,u){
 if(!p?.id||!looksImage(p,u)||shareFiles.has(String(p.id)))return;
 if(/^data:image\//i.test(u)){const f=dataUrlFile(u,p.fileName||`carbonautas-${p.id}.jpg`);if(f)shareFiles.set(String(p.id),f);return}
 if(!/^https?:\/\//i.test(u))return;
 try{const r=await fetch(u,{mode:'cors',cache:'force-cache'});if(!r.ok)return;const b=await r.blob();if(!String(b.type||'').startsWith('image/'))return;shareFiles.set(String(p.id),new File([b],p.fileName||`carbonautas-${p.id}.jpg`,{type:b.type||'image/jpeg'}))}catch(_e){}
}
function postText(p){const parts=[];if(p?.title)parts.push(String(p.title).trim());if(p?.text)parts.push(String(p.text).trim());if(p?.externalUrl)parts.push(String(p.externalUrl).trim());return parts.filter(Boolean).join('\n\n')}
function wrap(ctx,text,maxWidth){const out=[];String(text||'').split(/\n/).forEach(par=>{if(!par.trim()){out.push('');return}const words=par.split(/\s+/);let line='';words.forEach(w=>{const t=line?line+' '+w:w;if(ctx.measureText(t).width>maxWidth&&line){out.push(line);line=w}else line=t});if(line)out.push(line)});return out}
async function loadImage(u){try{if(!u)return null;let blob;if(/^data:image\//i.test(u)){blob=dataUrlFile(u)}else{const r=await fetch(u,{mode:'cors',cache:'force-cache'});if(!r.ok)return null;blob=await r.blob()}if(!blob)return null;if('createImageBitmap'in window)return await createImageBitmap(blob);const url=URL.createObjectURL(blob);return await new Promise((res,rej)=>{const im=new Image();im.onload=()=>{URL.revokeObjectURL(url);res(im)};im.onerror=()=>{URL.revokeObjectURL(url);rej(new Error('imagem'))};im.src=url})}catch(_e){return null}}
function roundRect(ctx,x,y,w,h,r){r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
async function makeCardBlob(p){
 const W=1080,H=1350,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.fillStyle='#f4faf8';x.fillRect(0,0,W,H);x.fillStyle='#ffffff';roundRect(x,54,54,W-108,H-108,38);x.fill();x.fillStyle='#168f94';x.font='700 34px sans-serif';x.fillText('Carbonautas',92,118);x.fillStyle='#728b90';x.font='500 22px sans-serif';x.fillText('Mural da rede',92,154);const u=src(p),im=await loadImage(u);let y=205;if(im){const bx=92,by=y,bw=W-184,bh=410;x.fillStyle='#eef5f3';roundRect(x,bx,by,bw,bh,24);x.fill();const iw=im.width||1,ih=im.height||1,scale=Math.min(bw/iw,bh/ih),dw=iw*scale,dh=ih*scale;x.drawImage(im,bx+(bw-dw)/2,by+(bh-dh)/2,dw,dh);y=by+bh+52}x.fillStyle='#173b47';x.font='700 48px sans-serif';const tl=wrap(x,String(p?.title||'Publicação do Mural'),W-184).slice(0,3);tl.forEach(l=>{x.fillText(l,92,y);y+=58});y+=18;x.fillStyle='#3f5d64';x.font='400 31px sans-serif';wrap(x,String(p?.text||''),W-184).slice(0,12).forEach(l=>{if(y<H-190){x.fillText(l,92,y);y+=43}});if(p?.externalUrl&&y<H-145){y+=16;x.fillStyle='#168f94';x.font='600 25px sans-serif';wrap(x,String(p.externalUrl),W-184).slice(0,2).forEach(l=>{x.fillText(l,92,y);y+=34})}x.fillStyle='#7b9095';x.font='500 22px sans-serif';x.fillText(String(p?.authorName||'Carbonauta'),92,H-92);return await new Promise(res=>c.toBlob(res,'image/jpeg',0.9))
}
async function sharePost(p){
 const text=postText(p),title=p?.title||'Carbonautas',file=shareFiles.get(String(p?.id||''));
 try{const payload={title,text};if(file&&navigator.canShare?.({files:[file]}))payload.files=[file];if(navigator.share){await navigator.share(payload);return}}catch(e){if(e?.name==='AbortError')return}
 try{await navigator.clipboard?.writeText(text)}catch(_e){}toastMsg('Mensagem copiada. Você pode colar no WhatsApp, e-mail ou outro app.')
}
async function downloadCard(p,btn){const old=btn?.textContent;if(btn){btn.disabled=true;btn.textContent='Preparando…'}try{const blob=await makeCardBlob(p);if(!blob)throw new Error('card');const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=`carbonautas-${String(p?.title||'mural').toLowerCase().replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').slice(0,45)||'mural'}.jpg`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000)}catch(_e){toastMsg('Não consegui gerar o card agora.')}finally{if(btn){btn.disabled=false;btn.textContent=old||'⬇️ Baixar card'}}}
function ensureEditOverlay(){
 let ov=$('#p187EditOverlay');if(ov)return ov;
 ov=document.createElement('div');ov.id='p187EditOverlay';ov.innerHTML=`<div class="p187-sheet"><div class="p187-h"><strong>Editar publicação</strong><button type="button" class="p187-x" aria-label="Fechar">×</button></div><div class="p187-b"><label>Tipo da mensagem</label><select id="p187Kind"><option value="atualizacao">📣 Atualização</option><option value="alerta">⚠️ Pessoal, se atente a isso</option><option value="ajuda_campo">🆘 Pedido de ajuda</option><option value="ideia">💡 Ideia / proposta</option><option value="humor">😂 Humor</option><option value="resultado">🏆 Resultado</option></select><div class="p187-grid"><div><label>Data / prazo</label><input type="date" id="p187Date"></div><div><label>Hora</label><input type="time" id="p187Time"></div></div><label>Assunto</label><input id="p187Title" maxlength="240"><label>Mensagem</label><textarea id="p187Text" maxlength="5000"></textarea><label>Link</label><input id="p187Url" type="url" placeholder="https://"><label class="p187-remove"><input type="checkbox" id="p187RemoveAttachment"> Remover print/foto/arquivo desta publicação</label></div><div class="p187-f"><button type="button" class="p187-cancel">Cancelar</button><button type="button" class="p187-save">Salvar alterações</button></div></div>`;document.body.appendChild(ov);
 $('.p187-x',ov).onclick=closeEdit;$('.p187-cancel',ov).onclick=closeEdit;ov.onclick=e=>{if(e.target===ov)closeEdit()};$('.p187-save',ov).onclick=saveEdit;return ov
}
function openEdit(p){
 if(!canManage(p))return;editingPost=p;const ov=ensureEditOverlay(),kind=$('#p187Kind',ov);
 if(kind&&!Array.from(kind.options).some(o=>o.value===String(p.kind||''))){const o=document.createElement('option');o.value=String(p.kind||'atualizacao');o.textContent=String(p.kind||'Atualização');kind.appendChild(o)}
 if(kind)kind.value=String(p.kind||'atualizacao');$('#p187Date',ov).value=p.actionDate||'';$('#p187Time',ov).value=p.actionTime||'';$('#p187Title',ov).value=p.title||'';$('#p187Text',ov).value=p.text||'';$('#p187Url',ov).value=p.externalUrl||'';$('#p187RemoveAttachment',ov).checked=false;ov.classList.add('open');document.body.style.overflow='hidden'
}
function closeEdit(){const ov=$('#p187EditOverlay');if(ov)ov.classList.remove('open');editingPost=null;if(!$('#p182MuralDeck')?.classList.contains('open'))document.body.style.overflow=''}
async function saveEdit(){
 const p=editingPost,f=F(),ov=$('#p187EditOverlay'),btn=$('.p187-save',ov);if(!p||!f||!window.db)return;
 const title=$('#p187Title',ov).value.trim(),text=$('#p187Text',ov).value.trim(),externalUrl=$('#p187Url',ov).value.trim();if(!title&&!text){toastMsg('Coloque um assunto ou uma mensagem.');return}
 btn.disabled=true;btn.textContent='Salvando…';
 try{
  const patch={kind:$('#p187Kind',ov).value||p.kind||'atualizacao',actionDate:$('#p187Date',ov).value||'',actionTime:$('#p187Time',ov).value||'',title,text,externalUrl,editedAt:f.serverTimestamp(),editedByUid:window.auth?.currentUser?.uid||'',editedByName:actor()?.name||actor()?.nome||''};
  if($('#p187RemoveAttachment',ov).checked)Object.assign(patch,{fileUrl:'',inlineImage:'',imageUrl:'',attachmentUrl:'',printUrl:'',photoUrl:'',fileData:'',fileName:'',storagePath:'',mimeType:'',mime:'',attachmentKind:''});
  await f.updateDoc(f.doc(window.db,'rede_feed',p.id),patch);Object.assign(p,patch);toastMsg('Publicação atualizada.');closeEdit();$('#p182MuralDeck .p182-deck-close')?.click();setTimeout(()=>{try{if(typeof renderMural==='function')renderMural()}catch(_e){}},100)
 }catch(e){console.error('P187 editar mural',e);toastMsg('Não consegui editar esta publicação.')}
 finally{btn.disabled=false;btn.textContent='Salvar alterações'}
}
async function deletePost(p,btn){
 if(!canManage(p))return;
 const label=p.title?`“${p.title}”`:'esta publicação';if(!window.confirm(`Excluir ${label} do Mural?\n\nEssa ação não pode ser desfeita.`))return;
 const f=F();if(!f||!window.db)return;btn.disabled=true;btn.textContent='Excluindo…';
 try{await f.deleteDoc(f.doc(window.db,'rede_feed',p.id));document.querySelectorAll(`[data-mural-id="${window.CSS?.escape?window.CSS.escape(String(p.id)):String(p.id)}"]`).forEach(el=>el.remove());$('#p182MuralDeck .p182-deck-close')?.click();toastMsg('Publicação excluída do Mural.');try{window.refreshHomeAgendaMural?.()}catch(_e){}}
 catch(e){console.error('P187 excluir mural',e);toastMsg('Não consegui excluir esta publicação.')}finally{btn.disabled=false;btn.textContent='🗑 Excluir'}
}
function patchCompact(){
 $$('#muralMsgs article.feed-card[data-mural-type="post"]').forEach(card=>{const p=byId(card.dataset.muralId),u=src(p);if(!looksImage(p,u))return;const media=card.querySelector('.p182-c-media');if(media){let im=media.querySelector('img');if(!im){media.innerHTML=`<img src="${esc(u)}" alt="Imagem da publicação" loading="lazy">`;im=media.querySelector('img')}if(im&&im.getAttribute('src')!==u)im.setAttribute('src',u)}if(!card.querySelector('.feed-image')){const im=document.createElement('img');im.className='feed-image';im.src=u;im.alt=p?.title||'Imagem da publicação';const body=card.querySelector('.feed-body');body?.insertAdjacentElement('afterend',im)}preloadShareFile(p,u)})
}
function ensureShareRow(detail,p){
 const body=detail.querySelector('.p182-d-body');if(!body||body.querySelector('.p186-share-row'))return;
 const row=document.createElement('div');row.className='p186-share-row';row.innerHTML='<button type="button" class="p186-share-btn">📤 Compartilhar</button><button type="button" class="p186-share-btn p186-download-btn">⬇️ Baixar card</button>';const reacts=body.querySelector('.p182-d-react');reacts?body.insertBefore(row,reacts):body.appendChild(row);row.querySelector('.p186-share-btn').onclick=e=>{e.preventDefault();e.stopPropagation();sharePost(p)};row.querySelector('.p186-download-btn').onclick=e=>{e.preventDefault();e.stopPropagation();downloadCard(p,e.currentTarget)}
}
function ensureManageRow(detail,p){
 if(!canManage(p))return;const body=detail.querySelector('.p182-d-body');if(!body||body.querySelector('.p187-manage-row'))return;
 const row=document.createElement('div');row.className='p187-manage-row';row.innerHTML='<button type="button" class="p187-manage-btn">✏️ Editar</button><button type="button" class="p187-manage-btn p187-delete-btn">🗑 Excluir</button>';const reacts=body.querySelector('.p182-d-react');reacts?body.insertBefore(row,reacts):body.appendChild(row);row.children[0].onclick=e=>{e.preventDefault();e.stopPropagation();openEdit(p)};row.children[1].onclick=e=>{e.preventDefault();e.stopPropagation();deletePost(p,e.currentTarget)}
}
function patchDeck(){
 $$('#p182MuralDeck .p182-detail[data-p182-id]').forEach(detail=>{const p=byId(detail.dataset.p182Id),u=src(p);if(!p)return;if(looksImage(p,u)){const card=detail.querySelector('.p182-detail-card');if(card){let im=card.querySelector('.p182-d-image');if(!im){im=document.createElement('img');im.className='p182-d-image';im.alt='Imagem da publicação';const head=card.querySelector('.p182-d-head');head?.insertAdjacentElement('afterend',im)}if(im.getAttribute('src')!==u)im.setAttribute('src',u)}preloadShareFile(p,u)}ensureShareRow(detail,p);ensureManageRow(detail,p)})
}
function patch(){queued=false;addCss();patchCompact();patchDeck()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(patch)}
function boot(){addCss();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});window.addEventListener('pageshow',schedule,{passive:true});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#p187EditOverlay')?.classList.contains('open'))closeEdit()});schedule();setTimeout(schedule,250);setTimeout(schedule,900)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();