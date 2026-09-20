/* Carbonautas P186 · publicação do Mural robusta + imagem garantida
   - toda publicação do Mural é para toda a Rede
   - salva primeiro a mensagem no Firestore
   - usa o id real da publicação no upload do anexo
   - para imagens, comprime antes do envio
   - se o Storage falhar/demorar, salva uma cópia comprimida no próprio post
   - o texto nunca é perdido por falha de anexo
   - não altera regras do Firebase nem VPS
*/
(function(){
'use strict';
if(window.__CARBONAUTAS_P179_MURAL_SAVE)return;
window.__CARBONAUTAS_P179_MURAL_SAVE=true;

const $=(s,r=document)=>r.querySelector(s);
let busy=false;

function F(){try{if(window.fbFns)return window.fbFns;if(typeof FB==='function')return FB()}catch(_e){}return null}
function actor(){try{return typeof currentActor==='function'?currentActor():null}catch(_e){return null}}
function say(msg){try{if(typeof toast==='function')toast(msg);else console.log(msg)}catch(_e){}}
function status(msg='',err=false){const el=$('#p177PostStatus');if(!el)return;el.textContent=msg;el.className=msg?'on'+(err?' err':''):''}
function isImageFile(file){return !!file&&(String(file.type||'').startsWith('image/')||/\.(png|jpe?g|webp|gif)$/i.test(String(file.name||'')))}
function readDataUrl(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||''));r.onerror=()=>reject(r.error||new Error('Não foi possível ler o arquivo.'));r.readAsDataURL(file)})}
function loadImage(src){return new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error('Não foi possível preparar a imagem.'));i.src=src})}
async function compactImage(file){
 const raw=await readDataUrl(file);if(!isImageFile(file))return raw;
 try{
  const img=await loadImage(raw);let maxSide=1400,quality=.82,out=raw;
  for(let pass=0;pass<5;pass++){
   const scale=Math.min(1,maxSide/Math.max(img.naturalWidth||img.width,img.naturalHeight||img.height));
   const w=Math.max(1,Math.round((img.naturalWidth||img.width)*scale)),h=Math.max(1,Math.round((img.naturalHeight||img.height)*scale));
   const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);
   out=c.toDataURL('image/jpeg',quality);
   if(out.length<=430000)break;
   maxSide=Math.max(720,Math.round(maxSide*.82));quality=Math.max(.58,quality-.07)
  }
  return out
 }catch(_e){return raw}
}
function withTimeout(p,ms=18000){return Promise.race([p,new Promise((_,rej)=>setTimeout(()=>rej(Object.assign(new Error('O envio da imagem demorou demais.'),{code:'storage/timeout'})),ms))])}
function resetFile(){
 const input=$('#postFile');if(input)input.value='';
 try{postFileData=''}catch(_e){}
 try{postFileName=''}catch(_e){}
 const pv=$('#p177PostPreview');if(pv){pv.className='';pv.innerHTML=''}
}
function firebaseMessage(e){
 const code=String(e?.code||'');
 if(code.includes('storage/unauthorized'))return 'O Firebase Storage bloqueou o anexo.';
 if(code.includes('storage/timeout'))return 'O envio do anexo demorou demais.';
 if(code.includes('storage/canceled'))return 'O envio do anexo foi cancelado.';
 if(code.includes('storage/quota'))return 'O Firebase Storage atingiu o limite de armazenamento.';
 if(code.includes('permission-denied'))return 'O Firebase bloqueou a gravação desta publicação.';
 return e?.message||'Não foi possível concluir a publicação.';
}
function hideDestinationField(){
 const sel=$('#postDest');if(!sel)return;
 sel.value='all';sel.setAttribute('aria-hidden','true');sel.tabIndex=-1;sel.style.display='none';
 const label=document.querySelector('label[for="postDest"]');if(label)label.style.display='none';
 const parent=sel.parentElement;
 if(parent){const controls=parent.querySelectorAll('input,select,textarea,button');if(controls.length===1)parent.style.display='none'}
}
function addCss(){if($('#p179Style'))return;const st=document.createElement('style');st.id='p179Style';st.textContent=`
#postOverlay{padding:8px!important;align-items:center!important}
#postOverlay .modal{display:flex!important;flex-direction:column!important;width:min(100%,660px)!important;height:min(94dvh,880px)!important;max-height:94dvh!important;overflow:hidden!important}
#postOverlay .modal-h{flex:0 0 auto!important}
#postOverlay .modal-b{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important;padding-bottom:28px!important}
#postOverlay .modal-f{position:relative!important;inset:auto!important;flex:0 0 auto!important;background:#fff!important;box-shadow:0 -8px 24px rgba(18,54,58,.08)!important;padding:12px 14px calc(12px + env(safe-area-inset-bottom,0px))!important;z-index:8!important}
#postOverlay .modal-f>button{min-height:48px!important}
#postOverlay #p177PostPreview{margin-bottom:8px!important}
#postOverlay #postDest{display:none!important}
@media(max-width:760px){
 #postOverlay{padding:4px!important;align-items:flex-start!important}
 #postOverlay .modal{height:calc(100dvh - 8px)!important;max-height:calc(100dvh - 8px)!important;border-radius:20px!important}
 #postOverlay .modal-h{padding:13px 14px!important}
 #postOverlay .modal-b{padding:12px 14px 36px!important}
 #postOverlay .modal-f{display:grid!important;grid-template-columns:1fr 1.25fr!important;gap:10px!important}
 #postOverlay #p177PostPreview img{max-height:190px!important;object-fit:contain!important}
}
`;document.head.appendChild(st)}

async function uploadAttachment(ref,file){
 if(!file)return {ok:true,mode:'none'};
 const f=F(),isImg=isImageFile(file);let dataUrl='';
 try{
  status(isImg?'Mensagem salva ✓ · preparando o print…':'Mensagem salva ✓ · preparando anexo…');
  dataUrl=isImg?await compactImage(file):await readDataUrl(file);
  if(typeof fbUploadAny!=='function')throw new Error('Rotina de upload não carregada.');
  status('Mensagem salva ✓ · enviando anexo…');
  const up=await withTimeout(fbUploadAny('rede_feed','post_'+ref.id,dataUrl,file.name||'anexo'));
  await f.updateDoc(ref,{fileUrl:up.url||'',inlineImage:'',fileName:file.name||'anexo',storagePath:up.path||'',mimeType:file.type||(isImg?'image/jpeg':''),attachmentKind:isImg?'image':'file',attachmentUpdatedAt:f.serverTimestamp()});
  return {ok:true,mode:'storage'};
 }catch(e){
  console.warn('P186 upload do Mural',e);
  if(isImg&&dataUrl){
   try{
    status('Storage indisponível · guardando o print na própria publicação…');
    await f.updateDoc(ref,{fileUrl:'',inlineImage:dataUrl,fileName:file.name||'print.jpg',storagePath:'',mimeType:'image/jpeg',attachmentKind:'image',attachmentFallback:'firestore-inline',attachmentUpdatedAt:f.serverTimestamp()});
    return {ok:true,mode:'inline',warning:e}
   }catch(e2){console.error('P186 fallback inline do Mural',e2);return {ok:false,error:e2,original:e}}
  }
  return {ok:false,error:e}
 }
}

async function notifyAndPoints(kind,title,text,refId,a){
 try{const pointAction=String(kind||'').startsWith('ajuda_')?'help_post':'feed';if(typeof awardPoints==='function')Promise.resolve(awardPoints(a.id,pointAction,refId,title||'Mural')).catch(()=>{})}catch(_e){}
 try{if(typeof createMuralNotifications==='function')Promise.resolve(createMuralNotifications('all',{kind,title:title||'Nova publicação',message:text||title||'Nova publicação no Mural',sourceType:'mural-post',sourceId:refId})).catch(e=>console.warn('P186 notificação',e))}catch(_e){}
}

async function publish(){
 if(busy)return;hideDestinationField();
 const f=F(),btn=$('#savePostBtn');
 if(!f||!window.db||!window.auth?.currentUser){status('Sua sessão não está pronta. Feche e abra o Mural novamente.',true);return}
 const text=$('#postText')?.value.trim()||'',title=$('#postTitle')?.value.trim()||'',url=$('#postUrl')?.value.trim()||'',kind=$('#postKind')?.value||'atualizacao',date=$('#p176PostDate')?.value||'',time=$('#p176PostTime')?.value||'',file=$('#postFile')?.files?.[0]||null;
 if(!text&&!title&&!url&&!file){say('Adicione algum conteúdo à publicação.');return}
 const a=actor();if(!a?.id){status('Não consegui identificar seu perfil no CARBONAUTAS.',true);return}
 const uid=window.auth.currentUser.uid;
 busy=true;if(btn){btn.disabled=true;btn.classList.add('p177-saving');btn.textContent='Salvando…'}status('Salvando a mensagem…');
 try{
  const payload={authorId:a.id,authorUid:uid,authorName:a.name||'',authorFoto:a.foto||'',kind,title,text,externalUrl:url,fileUrl:'',inlineImage:'',fileName:'',storagePath:'',mimeType:'',attachmentKind:'',para:null,paraNome:'',actionDate:date,actionTime:time,ts:f.serverTimestamp()};
  const ref=await f.addDoc(f.collection(window.db,'rede_feed'),payload);
  const attachment=await uploadAttachment(ref,file);
  notifyAndPoints(kind,title,text,ref.id,a);try{window.refreshHomeAgendaMural?.()}catch(_e){}resetFile();
  if(typeof closeOverlay==='function')closeOverlay('postOverlay');
  if(attachment.ok&&attachment.mode==='inline')say('Publicado ✓ O print foi salvo junto da publicação.');
  else if(attachment.ok)say('Publicado no Mural para toda a Rede.');
  else say('A mensagem foi publicada, mas o anexo não: '+firebaseMessage(attachment.error));
 }catch(e){console.error('P186 publicação do Mural',e);status(firebaseMessage(e),true);say(firebaseMessage(e))}
 finally{busy=false;if(btn){btn.disabled=false;btn.classList.remove('p177-saving');btn.textContent='Publicar'}}
}

function intercept(e){const b=e.target.closest?.('#savePostBtn');if(!b||!$('#postOverlay')?.classList.contains('open'))return;e.preventDefault();e.stopImmediatePropagation();publish()}
function scrollPreview(e){if(e.target?.id!=='postFile')return;setTimeout(()=>$('#p177PostPreview')?.scrollIntoView({block:'nearest',behavior:'smooth'}),80)}
function watchModal(){const ov=$('#postOverlay');if(!ov||ov.dataset.p186DestWatch==='1')return;ov.dataset.p186DestWatch='1';hideDestinationField();new MutationObserver(()=>hideDestinationField()).observe(ov,{attributes:true,attributeFilter:['class'],childList:true,subtree:true})}
function boot(){addCss();hideDestinationField();watchModal();document.addEventListener('click',intercept,true);document.addEventListener('change',scrollPreview,false);setTimeout(()=>{hideDestinationField();watchModal()},220)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
