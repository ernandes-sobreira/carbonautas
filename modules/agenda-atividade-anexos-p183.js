/* Carbonautas P183 · link + print/foto/arquivo nas atividades da Agenda
   - mantém o salvamento original de atividades/participantes do P174
   - acrescenta link opcional e anexo opcional (até 15 MB)
   - imagem ganha prévia no formulário e aparece no detalhe da Agenda
   - arquivo não-imagem aparece como botão de anexo no detalhe
   - não altera regras do Firebase nem VPS
*/
(function(){
'use strict';
if(window.__CARBONAUTAS_P183_AGENDA_ANEXOS)return;
window.__CARBONAUTAS_P183_AGENDA_ANEXOS=true;

const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
let editId='',lastOpen=false,previewUrl='',detailWrapped=false,seq=0;

function S(){try{return window.state||state||{}}catch(_e){return{}}}
function F(){try{if(window.fbFns)return window.fbFns;if(typeof FB==='function')return FB()}catch(_e){}return null}
function mine(){try{return window.myId||myId||''}catch(_e){return''}}
function toastS(v){try{if(typeof toast==='function')toast(v);else console.log(v)}catch(_e){}}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function activity(id){return (S().activities||[]).find(a=>String(a.id)===String(id))||null}
function isImgFile(f){return !!f&&(String(f.type||'').startsWith('image/')||/\.(png|jpe?g|webp|gif)$/i.test(f.name||''))}
function isImgActivity(a){return !!a&&(String(a.attachmentMime||a.mimeType||'').startsWith('image/')||/\.(png|jpe?g|webp|gif)(\?|$)/i.test(String(a.attachmentName||a.fileName||a.attachmentUrl||a.fileUrl||'')))}
function readDataUrl(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||''));r.onerror=()=>reject(r.error||new Error('Não foi possível ler o arquivo.'));r.readAsDataURL(file)})}
function revoke(){if(previewUrl){try{URL.revokeObjectURL(previewUrl)}catch(_e){}previewUrl=''}}
function cleanUrl(v){const s=String(v||'').trim();if(!s)return'';if(/^https?:\/\//i.test(s))return s;if(/^[\w.-]+\.[a-z]{2,}(?:[\/:?#]|$)/i.test(s))return'https://'+s;return s}
async function cleanupStoredAttachment(path,url){
 if(!path&&!url)return[];
 if(typeof window.deleteStorageArtifacts==='function')return window.deleteStorageArtifacts({storagePath:path||'',attachmentUrl:url||''});
 const f=F();if(!f?.deleteObject||!f?.sRef||!window.storage||!path)return[];try{await f.deleteObject(f.sRef(window.storage,path));return[]}catch(e){if(e?.code==='storage/object-not-found')return[];return[{path,error:e}]}
}

function css(){if($('#p183Style'))return;const st=document.createElement('style');st.id='p183Style';st.textContent=`
#p174TaskOverlay .p183-file-box{border:1px dashed #c7dcda;border-radius:13px;background:#f7fbfa;padding:10px;display:grid;gap:8px}
#p174TaskOverlay .p183-file-pick{min-height:43px;border:1px solid #d3e2df;border-radius:11px;background:#fff;color:#31545c;font-size:10.5px;font-weight:900;display:flex;align-items:center;justify-content:center;cursor:pointer;text-align:center;padding:8px 10px}
#p174TaskOverlay .p183-file-pick input{display:none!important}
#p174TaskOverlay .p183-preview{display:none;border:1px solid #d8e5e2;border-radius:12px;background:#fff;overflow:hidden}
#p174TaskOverlay .p183-preview.on{display:block}.p183-preview img{display:block;width:100%;max-height:190px;object-fit:contain;background:#eef5f3}.p183-preview-row{display:flex;gap:8px;align-items:center;padding:9px 10px;font-size:9px;color:#587078}.p183-preview-row span{min-width:0;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.p183-remove{border:1px solid #ead8dc;background:#fff;color:#ad4b5c;border-radius:9px;min-height:32px;padding:0 9px;font-size:8.5px;font-weight:900}.p183-status{display:none;font-size:9px;line-height:1.35;color:#37666c}.p183-status.on{display:block}.p183-status.err{color:#a74152}
#p175AgendaDetail .p183-detail-file{display:flex;align-items:center;justify-content:center;min-height:44px;border:1px solid #d4e3df;border-radius:11px;background:#f7fbfa;color:#245d64!important;text-decoration:none;font-size:11px;font-weight:900;margin-top:8px}
`;document.head.appendChild(st)}

function ensureFields(){
 const ov=$('#p174TaskOverlay'),desc=$('#p174Desc');if(!ov||!desc)return false;
 if(!$('#p183Link')){
  const link=document.createElement('div');link.className='p174-field full';link.innerHTML='<label>Link (opcional)</label><input id="p183Link" type="url" maxlength="700" placeholder="Meet, Zoom, página do evento ou outro link">';
  desc.closest('.p174-field')?.insertAdjacentElement('afterend',link)
 }
 if(!$('#p183FileBox')){
  const box=document.createElement('div');box.id='p183FileBox';box.className='p174-field full';box.innerHTML='<label>Print, foto ou arquivo (opcional; até 15 MB)</label><div class="p183-file-box"><label class="p183-file-pick">🖼 Adicionar print, foto ou arquivo<input id="p183File" type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.zip"></label><div class="p183-preview" id="p183Preview"></div><div class="p183-status" id="p183Status"></div></div>';
  const link=$('#p183Link')?.closest('.p174-field');link?.insertAdjacentElement('afterend',box);
  $('#p183File').onchange=()=>showChosen($('#p183File').files?.[0]||null)
 }
 return true
}
function setStatus(t='',err=false){const el=$('#p183Status');if(!el)return;el.textContent=t;el.className='p183-status'+(t?' on':'')+(err?' err':'')}
function previewExisting(a){
 const pv=$('#p183Preview');if(!pv)return;revoke();pv.dataset.remove='';
 const url=String(a?.attachmentUrl||a?.fileUrl||'').trim(),name=a?.attachmentName||a?.fileName||'';
 if(!url){pv.className='p183-preview';pv.innerHTML='';return}
 const image=String(a?.imageUrl||'').trim()||(isImgActivity(a)?url:'');
 pv.className='p183-preview on';pv.innerHTML=`${image?`<img src="${esc(image)}" alt="Anexo atual">`:''}<div class="p183-preview-row"><span>📎 ${esc(name||'Anexo atual')}</span><button type="button" class="p183-remove" data-p183-remove>Remover</button></div>`;
 $('[data-p183-remove]',pv).onclick=()=>{pv.dataset.remove='1';pv.className='p183-preview';pv.innerHTML='';const fi=$('#p183File');if(fi)fi.value='';setStatus('O anexo será removido quando a atividade for salva.')}
}
function showChosen(file){
 const pv=$('#p183Preview');if(!pv)return;revoke();pv.dataset.remove='';
 if(!file){pv.className='p183-preview';pv.innerHTML='';return}
 if(file.size>15*1024*1024){toastS('O arquivo precisa ter no máximo 15 MB.');const fi=$('#p183File');if(fi)fi.value='';return}
 pv.className='p183-preview on';
 if(isImgFile(file)){previewUrl=URL.createObjectURL(file);pv.innerHTML=`<img src="${esc(previewUrl)}" alt="Prévia do anexo"><div class="p183-preview-row"><span>🖼 ${esc(file.name||'imagem')}</span><button type="button" class="p183-remove" data-p183-remove>Remover</button></div>`}
 else pv.innerHTML=`<div class="p183-preview-row"><span>📎 ${esc(file.name||'arquivo')}</span><button type="button" class="p183-remove" data-p183-remove>Remover</button></div>`;
 $('[data-p183-remove]',pv).onclick=()=>{const fi=$('#p183File');if(fi)fi.value='';showChosen(null)}
}
function inferEdit(){
 if(editId&&activity(editId))return editId;
 if(!/editar/i.test($('#p174ModalTitle')?.textContent||''))return'';
 const t=$('#p174Title')?.value.trim()||'',d=$('#p174Date')?.value||'',me=mine();
 const a=(S().activities||[]).find(x=>(x?.agendaShared===true||x?.type==='agenda')&&String(x.title||'')===t&&String(x.dueDate||'')===d&&(String(x.ownerId||'')===String(me)||!me));
 if(a)editId=String(a.id);return editId
}
function fill(){
 if(!ensureFields())return;
 const id=inferEdit(),a=id?activity(id):null;
 $('#p183Link').value=a?.link||a?.externalUrl||'';
 const fi=$('#p183File');if(fi)fi.value='';
 previewExisting(a);setStatus('')
}

async function findNew(ctx){
 for(let i=0;i<65;i++){
  const a=(S().activities||[]).find(x=>!ctx.before.has(String(x.id))&&String(x.ownerId||'')===String(mine())&&String(x.title||'')===ctx.title&&String(x.dueDate||'')===ctx.date);
  if(a)return String(a.id);
  await new Promise(r=>setTimeout(r,120))
 }
 return''
}
async function persistExtras(ctx){
 const token=++seq;
 // O P174 fecha o modal apenas quando o salvamento principal deu certo.
 let closed=false;
 for(let i=0;i<50;i++){await new Promise(r=>setTimeout(r,100));if(token!==seq)return;if(!$('#p174TaskOverlay')?.classList.contains('open')){closed=true;break}}
 if(!closed)return;
 let id=ctx.editId||await findNew(ctx);if(!id)return;
 const f=F();if(!f||!window.db)return;
 const ref=f.doc(window.db,'rede_activities',id),link=cleanUrl(ctx.link);
 try{await f.setDoc(ref,{link,externalUrl:link,updatedAt:f.serverTimestamp()},{merge:true})}catch(e){console.warn('P183 link',e)}
 if(ctx.remove&&!ctx.file){
  try{await f.setDoc(ref,{attachmentUrl:'',attachmentName:'',attachmentMime:'',storagePath:'',imageUrl:'',fileUrl:'',fileName:'',mimeType:'',updatedAt:f.serverTimestamp()},{merge:true});const failed=await cleanupStoredAttachment(ctx.previousStoragePath,ctx.previousAttachmentUrl);if(failed.length)console.warn('P183 remove storage',failed)}catch(e){console.warn('P183 remove',e)}
  return
 }
 if(!ctx.file)return;
 let up=null;
 try{
  if(typeof fbUploadAny!=='function')throw new Error('Rotina de upload não carregada.');
  const dataUrl=await readDataUrl(ctx.file);up=await fbUploadAny('rede_activities','activity_'+mine(),dataUrl,ctx.file.name||'anexo');
  const image=isImgFile(ctx.file)?(up.url||''):'';
  await f.setDoc(ref,{attachmentUrl:up.url||'',attachmentName:ctx.file.name||'anexo',attachmentMime:ctx.file.type||'',storagePath:up.path||'',imageUrl:image,fileUrl:up.url||'',fileName:ctx.file.name||'anexo',mimeType:ctx.file.type||'',updatedAt:f.serverTimestamp()},{merge:true});
  const failed=await cleanupStoredAttachment(ctx.previousStoragePath,ctx.previousAttachmentUrl);if(failed.length)console.warn('P183 replace storage',failed);
  toastS('Anexo da atividade enviado.')
 }catch(e){if(up?.path||up?.url){const failed=await cleanupStoredAttachment(up.path,up.url);if(failed.length)console.warn('P183 cleanup upload',failed)}console.error('P183 upload',e);toastS('A atividade foi salva, mas o anexo não foi enviado.')}
}
function captureSave(){
 const ov=$('#p174TaskOverlay');if(!ov?.classList.contains('open'))return;
 ensureFields();const id=inferEdit(),file=$('#p183File')?.files?.[0]||null,pv=$('#p183Preview'),previous=id?activity(id):null;
 const ctx={editId:id,before:new Set((S().activities||[]).map(a=>String(a.id))),title:$('#p174Title')?.value.trim()||'',date:$('#p174Date')?.value||'',link:$('#p183Link')?.value.trim()||'',file,remove:pv?.dataset?.remove==='1',previousStoragePath:previous?.storagePath||'',previousAttachmentUrl:previous?.attachmentUrl||previous?.fileUrl||''};
 setStatus(file?'A atividade será salva e o anexo será enviado em seguida.':'');persistExtras(ctx)
}

function patchDetail(id){
 const a=activity(id),body=$('#p175Body');if(!a||!body)return;
 body.querySelectorAll('.p183-detail-extra').forEach(x=>x.remove());
 const url=String(a.attachmentUrl||a.fileUrl||'').trim(),name=a.attachmentName||a.fileName||'Anexo';
 if(!url)return;
 const sec=document.createElement('section');sec.className='p175-section p183-detail-extra';sec.innerHTML=`<h3>Anexo</h3><a class="p183-detail-file" href="${esc(url)}" target="_blank" rel="noopener">📎 Abrir ${esc(name)}</a>`;body.appendChild(sec)
}
function wrapDetail(){
 if(detailWrapped||typeof window.openAgendaDetail!=='function')return false;
 const old=window.openAgendaDetail;const w=function(kind,id){const r=old.apply(this,arguments);if(kind==='atividade')setTimeout(()=>patchDetail(String(id)),35);return r};w.__p183=true;window.openAgendaDetail=w;detailWrapped=true;return true
}
function wrapSharedOpen(){
 const old=window.openAgendaSharedTask;if(typeof old!=='function'||old.__p183)return;
 const w=function(id){editId=String(id||'');const r=old.apply(this,arguments);setTimeout(fill,40);return r};w.__p183=true;window.openAgendaSharedTask=w
}
function observeOverlay(){
 const ov=$('#p174TaskOverlay');if(!ov||ov.dataset.p183Observed==='1')return false;
 ov.dataset.p183Observed='1';lastOpen=ov.classList.contains('open');new MutationObserver(()=>{const open=ov.classList.contains('open');if(open&&!lastOpen)setTimeout(fill,25);if(!open&&lastOpen){revoke();setStatus('')}lastOpen=open}).observe(ov,{attributes:true,attributeFilter:['class']});return true
}
function bind(){
 document.addEventListener('click',e=>{
  const ed=e.target.closest?.('[data-p174-edit]');if(ed){editId=String(ed.dataset.p174Edit||'');setTimeout(fill,25);return}
  const nw=e.target.closest?.('[data-p174-new],[data-p174-new-ag],[data-p174-menu]');if(nw){editId='';setTimeout(fill,25);return}
  if(e.target.closest?.('#p174Save'))captureSave()
 },true)
}
function boot(){css();bind();let tries=0;const t=setInterval(()=>{tries++;ensureFields();observeOverlay();wrapDetail();wrapSharedOpen();if(tries>45)clearInterval(t)},150);setTimeout(()=>{ensureFields();observeOverlay();wrapDetail();wrapSharedOpen()},40)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
