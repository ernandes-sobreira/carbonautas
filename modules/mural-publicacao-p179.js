/* Carbonautas P180 · publicação do Mural robusta e sempre pública
   - toda publicação do Mural é para toda a Rede
   - remove a lógica de destinatário do fluxo de gravação
   - salva primeiro a mensagem no Firestore; anexo é enviado depois
   - se o Storage falhar, a mensagem não é perdida
   - data/hora entram já no primeiro save
   - rodapé não cobre mais a parte baixa do formulário
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
function readDataUrl(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||''));r.onerror=()=>reject(r.error||new Error('Não foi possível ler o arquivo.'));r.readAsDataURL(file)})}
function resetFile(){
 const input=$('#postFile');if(input)input.value='';
 try{postFileData=''}catch(_e){}
 try{postFileName=''}catch(_e){}
 const pv=$('#p177PostPreview');if(pv){pv.className='';pv.innerHTML=''}
}
function firebaseMessage(e){
 const code=String(e?.code||'');
 if(code.includes('storage/unauthorized'))return 'O Firebase Storage bloqueou o anexo.';
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
 if(parent){
  const controls=parent.querySelectorAll('input,select,textarea,button');
  if(controls.length===1)parent.style.display='none';
 }
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

async function uploadAttachment(ref,file,a){
 if(!file)return {ok:true};
 try{
  status('Mensagem salva ✓ · enviando print/arquivo…');
  const dataUrl=await readDataUrl(file);
  if(typeof fbUploadAny!=='function')throw new Error('Rotina de upload não carregada.');
  const up=await fbUploadAny('rede_feed','post_'+a.id,dataUrl,file.name||'anexo');
  const f=F();
  await f.updateDoc(ref,{fileUrl:up.url||'',fileName:file.name||'anexo',storagePath:up.path||'',mimeType:file.type||'',attachmentUpdatedAt:f.serverTimestamp()});
  return {ok:true};
 }catch(e){
  console.error('P180 upload do Mural',e);
  return {ok:false,error:e};
 }
}

async function notifyAndPoints(kind,title,text,refId,a){
 try{
  const pointAction=String(kind||'').startsWith('ajuda_')?'help_post':'feed';
  if(typeof awardPoints==='function')Promise.resolve(awardPoints(a.id,pointAction,refId,title||'Mural')).catch(()=>{});
 }catch(_e){}
 try{
  if(typeof createMuralNotifications==='function')Promise.resolve(createMuralNotifications('all',{kind,title:title||'Nova publicação',message:text||title||'Nova publicação no Mural',sourceType:'mural-post',sourceId:refId})).catch(e=>console.warn('P180 notificação',e));
 }catch(_e){}
}

async function publish(){
 if(busy)return;
 hideDestinationField();
 const f=F(),btn=$('#savePostBtn');
 if(!f||!window.db||!window.auth?.currentUser){status('Sua sessão não está pronta. Feche e abra o Mural novamente.',true);return}
 const text=$('#postText')?.value.trim()||'',title=$('#postTitle')?.value.trim()||'',url=$('#postUrl')?.value.trim()||'',kind=$('#postKind')?.value||'atualizacao',date=$('#p176PostDate')?.value||'',time=$('#p176PostTime')?.value||'',file=$('#postFile')?.files?.[0]||null;
 if(!text&&!title&&!url&&!file){say('Adicione algum conteúdo à publicação.');return}
 const a=actor();if(!a?.id){status('Não consegui identificar seu perfil no CARBONAUTAS.',true);return}
 const uid=window.auth.currentUser.uid;
 busy=true;if(btn){btn.disabled=true;btn.classList.add('p177-saving');btn.textContent='Salvando…'}
 status('Salvando a mensagem…');
 try{
  const payload={authorId:a.id,authorUid:uid,authorName:a.name||'',authorFoto:a.foto||'',kind,title,text,externalUrl:url,fileUrl:'',fileName:'',storagePath:'',para:null,paraNome:'',actionDate:date,actionTime:time,ts:f.serverTimestamp()};
  const ref=await f.addDoc(f.collection(window.db,'rede_feed'),payload);
  status(file?'Mensagem salva ✓ · preparando anexo…':'Publicado ✓');
  const attachment=await uploadAttachment(ref,file,a);
  notifyAndPoints(kind,title,text,ref.id,a);
  try{window.refreshHomeAgendaMural?.()}catch(_e){}
  resetFile();
  if(typeof closeOverlay==='function')closeOverlay('postOverlay');
  if(attachment.ok){say('Publicado no Mural para toda a Rede.');}
  else{
    const msg=firebaseMessage(attachment.error);
    say('A mensagem foi publicada, mas o anexo não: '+msg);
  }
 }catch(e){
  console.error('P180 publicação do Mural',e);
  status(firebaseMessage(e),true);say(firebaseMessage(e));
 }finally{
  busy=false;if(btn){btn.disabled=false;btn.classList.remove('p177-saving');btn.textContent='Publicar'}
 }
}

function intercept(e){
 const b=e.target.closest?.('#savePostBtn');if(!b||!$('#postOverlay')?.classList.contains('open'))return;
 e.preventDefault();e.stopImmediatePropagation();
 publish();
}
function scrollPreview(e){if(e.target?.id!=='postFile')return;setTimeout(()=>$('#p177PostPreview')?.scrollIntoView({block:'nearest',behavior:'smooth'}),80)}
function watchModal(){const ov=$('#postOverlay');if(!ov||ov.dataset.p180DestWatch==='1')return;ov.dataset.p180DestWatch='1';hideDestinationField();new MutationObserver(()=>hideDestinationField()).observe(ov,{attributes:true,attributeFilter:['class'],childList:true,subtree:true})}
function boot(){addCss();hideDestinationField();watchModal();document.addEventListener('click',intercept,true);document.addEventListener('change',scrollPreview,false);setTimeout(()=>{hideDestinationField();watchModal()},220)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
