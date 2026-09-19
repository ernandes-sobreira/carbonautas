/* Carbonautas P121 · Agenda sem disputa de controladores.
   P113/P114 é o único responsável por Dia/Mês/Ano + swipe.
   Este arquivo cuida apenas de mídia (print/link) e da revelação estável do trilho. */
(function(){
'use strict';
const BUILD='P121';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
let pendingImageData='', pendingImageName='', removeExistingImage=false, renderQueued=false;

function S(){try{return state}catch(_e){return null}}
function F(){return window.fbFns||null}
function admin(){try{return !!isAdmin}catch(_e){return window.auth?.currentUser?.email==='ernandes.sobreira@gmail.com'}}
function toastMsg(t){try{if(typeof toast==='function')return toast(t)}catch(_e){};window.toast?.(t)}
function closeOv(id){try{if(typeof closeOverlay==='function')return closeOverlay(id)}catch(_e){};$('#'+id)?.classList.remove('open')}
function esc(v=''){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]))}
function normUrl(v=''){let s=String(v||'').trim();if(!s)return'';if(!/^https?:\/\//i.test(s))s='https://'+s;try{const u=new URL(s);return ['http:','https:'].includes(u.protocol)?u.href:''}catch(_e){return''}}

function addCss(){
  if($('#p121AgendaStableStyle'))return;
  const st=document.createElement('style');st.id='p121AgendaStableStyle';st.textContent=`
    #viewCrono[data-p114-mode="day"] .ag-month:not([data-p121-positioned="1"]){opacity:0!important;pointer-events:none!important}
    #viewCrono[data-p114-mode="day"] .ag-month[data-p121-positioned="1"]{opacity:1!important;transition:opacity .10s linear!important}
    #viewCrono .p121-media{display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin-top:10px}
    #viewCrono .p121-thumb{width:74px;height:52px;border:0;border-radius:12px;padding:0;overflow:hidden;background:#eef6f4;box-shadow:0 4px 12px rgba(25,66,69,.08)}
    #viewCrono .p121-thumb img{width:100%;height:100%;object-fit:cover;display:block}
    #viewCrono .p121-link{display:inline-flex;align-items:center;gap:5px;min-height:34px;padding:7px 10px;border:1px solid #d8e6e3;border-radius:11px;background:#fff;color:#176e6a;text-decoration:none;font-size:11px;font-weight:850}
    #eventOverlay .p121-upload{border:1.5px dashed #b8d5d0;border-radius:15px;background:#f7fbfa;min-height:108px;padding:12px;display:grid;place-items:center;text-align:center;cursor:pointer;overflow:hidden}
    #eventOverlay .p121-upload img{max-width:100%;max-height:190px;border-radius:10px;object-fit:contain}
    #eventOverlay .p121-upload b{display:block;color:#2d5a60;margin-bottom:4px}
    #eventOverlay .p121-upload small{color:#71868b;line-height:1.4}
    #eventOverlay .p121-media-actions{display:flex;gap:7px;margin-top:7px;flex-wrap:wrap}
    #eventOverlay .p121-media-actions button{border:1px solid #d6e3e1;background:#fff;border-radius:10px;padding:7px 10px;font-weight:750;color:#365d63}
    #p121ImageOverlay{position:fixed;inset:0;z-index:2147483646;background:rgba(6,25,31,.82);display:none;align-items:center;justify-content:center;padding:18px}
    #p121ImageOverlay.open{display:flex}
    #p121ImageOverlay .p121-viewer{width:min(960px,100%);max-height:94dvh;background:#fff;border-radius:20px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 30px 90px rgba(0,0,0,.34)}
    #p121ImageOverlay .p121-viewer-head{display:flex;align-items:center;gap:10px;padding:11px 13px;border-bottom:1px solid #e4eceb;color:#284d54;font-weight:850}
    #p121ImageOverlay .p121-viewer-head span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    #p121ImageOverlay .p121-viewer-head button{width:38px;height:38px;border:0;border-radius:11px;background:#eef4f3;font-size:22px;color:#35545a}
    #p121ImageOverlay .p121-viewer-body{padding:12px;overflow:auto;display:grid;place-items:center;background:#f5f9f8}
    #p121ImageOverlay img{max-width:100%;max-height:78dvh;border-radius:12px;object-fit:contain}
    @media(max-width:640px){#eventOverlay .p121-upload{min-height:92px}.p121-media-actions{font-size:11px}#viewCrono .p121-thumb{width:68px;height:48px}}
  `;document.head.appendChild(st);
}

function positionTrack(track){
  if(!track||track.dataset.p121Positioned==='1')return;
  const v=$('#viewCrono');
  if(!v||v.dataset.p114Mode!=='day'){track.dataset.p121Positioned='1';return}
  const target=track.querySelector('.ag-day.sel:not(.out)')||track.querySelector('.ag-day.today:not(.out)')||track.querySelector('.ag-day:not(.out)');
  if(!target){track.dataset.p121Positioned='1';return}
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    if(!track.isConnected)return;
    const live=track.querySelector(`.ag-day[data-iso="${target.dataset.iso||''}"]:not(.out)`)||track.querySelector('.ag-day.sel:not(.out)')||track.querySelector('.ag-day.today:not(.out)')||target;
    const left=Math.max(0,live.offsetLeft-(track.clientWidth-live.offsetWidth)/2);
    track._p110Programmatic=true;track.scrollLeft=left;track.dataset.p121Positioned='1';
    requestAnimationFrame(()=>{track._p110Programmatic=false});
  }));
}
function stabilizeAgenda(){const v=$('#viewCrono');if(!v)return;const track=v.querySelector('.ag-month');if(track)positionTrack(track)}

function ensureEventFields(){
  const desc=$('#eDesc'),modal=$('#eventOverlay');if(!desc||!modal||$('#p121EventLink'))return;
  const oldLink=$('#p119EventLink'), oldField=$('#p119EventImageField'), oldLinkValue=oldLink?.value||'';
  oldLink?.closest('.fg')?.remove();oldField?.remove();
  const descFg=desc.closest('.fg');
  const link=document.createElement('div');link.className='fg';link.innerHTML='<label>Link do compromisso (opcional)</label><input id="p121EventLink" type="url" inputmode="url" placeholder="Meet, Zoom, formulário, artigo, documento…">';
  const img=document.createElement('div');img.className='fg';img.id='p121EventImageField';img.innerHTML='<label>Print / imagem (opcional)</label><div class="p121-upload" id="p121EventDrop" tabindex="0"><div><b>🖼 Adicionar print</b><small>Toque para escolher uma imagem. Também aceita colar um print.</small></div></div><input id="p121EventFile" type="file" accept="image/*" hidden><div class="p121-media-actions"><button type="button" id="p121ChooseImage">Escolher imagem</button><button type="button" id="p121RemoveImage">Remover</button></div>';
  descFg?.insertAdjacentElement('beforebegin',link);descFg?.insertAdjacentElement('beforebegin',img);$('#p121EventLink').value=oldLinkValue;
  const drop=$('#p121EventDrop'),file=$('#p121EventFile');
  drop.onclick=()=>file.click();$('#p121ChooseImage').onclick=()=>file.click();file.onchange=()=>{if(file.files?.[0])prepareImage(file.files[0])};
  $('#p121RemoveImage').onclick=()=>{pendingImageData='';pendingImageName='';removeExistingImage=true;renderEventImage('')};
  ['dragenter','dragover'].forEach(t=>drop.addEventListener(t,e=>{e.preventDefault();drop.style.background='#edf8f5'}));
  ['dragleave','drop'].forEach(t=>drop.addEventListener(t,e=>{e.preventDefault();drop.style.background=''}));
  drop.addEventListener('drop',e=>{const f=e.dataTransfer?.files?.[0];if(f)prepareImage(f)});
}
function renderEventImage(url=''){const d=$('#p121EventDrop');if(!d)return;if(pendingImageData)d.innerHTML=`<img src="${pendingImageData}" alt="Print pronto">`;else if(url)d.innerHTML=`<img src="${esc(url)}" alt="Print do compromisso">`;else d.innerHTML='<div><b>🖼 Adicionar print</b><small>Toque para escolher uma imagem. Também aceita colar um print.</small></div>'}
async function prepareImage(file){
  if(!file?.type?.startsWith('image/'))return toastMsg('Escolha uma imagem.');if(file.size>15*1024*1024)return toastMsg('Imagem maior que 15 MB.');
  try{const data=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)}),im=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=data}),max=1600,s=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*s));c.height=Math.max(1,Math.round(im.height*s));c.getContext('2d').drawImage(im,0,0,c.width,c.height);pendingImageData=c.toDataURL('image/jpeg',.86);pendingImageName=file.name||'print.jpg';removeExistingImage=false;renderEventImage()}catch(e){console.warn('P121 imagem',e);toastMsg('Não consegui preparar esse print.')}
}
function currentEditingId(){try{if(typeof editingEventId!=='undefined'&&editingEventId)return String(editingEventId)}catch(_e){};const title=$('#eTitulo')?.value.trim()||'',data=$('#eData')?.value||'',hora=$('#eHora')?.value||'';if(!/Editar/i.test($('#eventTitle')?.textContent||''))return'';const matches=(S()?.schedule||[]).filter(x=>(x.titulo||'')===title&&(x.data||'')===data&&(x.hora||'')===hora);return matches.length===1?String(matches[0].id):''}
function currentEvent(){const id=currentEditingId();return id?(S()?.schedule||[]).find(x=>String(x.id)===id)||null:null}
function syncEventFields(){ensureEventFields();pendingImageData='';pendingImageName='';removeExistingImage=false;const ev=currentEvent();if($('#p121EventLink'))$('#p121EventLink').value=ev?.link||'';renderEventImage(ev?.imageUrl||'')}
async function uploadImage(){const f=F(),uid=window.auth?.currentUser?.uid;if(!f||!uid||!pendingImageData)throw new Error('Sessão encerrada.');const path=`rede_uploads/${uid}/agenda_${Date.now()}_${Math.random().toString(36).slice(2,7)}.jpg`,ref=f.sRef(window.storage,path);await f.uploadString(ref,pendingImageData,'data_url');return {url:await f.getDownloadURL(ref),path}}
async function deleteImage(path){if(!path||!F())return;try{await F().deleteObject(F().sRef(window.storage,path))}catch(_e){}}
async function saveEventP121(){
  if(!admin())return toastMsg('Só o coordenador cria eventos do grupo.');const f=F();if(!f)return toastMsg('Firebase ainda não carregou.');const titulo=$('#eTitulo')?.value.trim()||'',data=$('#eData')?.value||'';if(!titulo||!data)return toastMsg('Preencha título e data.');
  const linkRaw=$('#p121EventLink')?.value.trim()||'',link=normUrl(linkRaw);if(linkRaw&&!link)return toastMsg('Confira o link informado.');const id=currentEditingId(),old=id?(S()?.schedule||[]).find(x=>String(x.id)===id):null;if(/Editar/i.test($('#eventTitle')?.textContent||'')&&!id)return toastMsg('Não consegui identificar o evento para editar. Feche e abra novamente.');const btn=$('#saveEventBtn');if(btn)btn.disabled=true;
  try{toastMsg('Salvando compromisso…');let imageUrl=old?.imageUrl||'',imagePath=old?.imagePath||'';if(removeExistingImage){imageUrl='';imagePath=''}if(pendingImageData){const up=await uploadImage();if(up){if(old?.imagePath)deleteImage(old.imagePath);imageUrl=up.url;imagePath=up.path}}else if(removeExistingImage&&old?.imagePath)deleteImage(old.imagePath);const payload={titulo,data,hora:$('#eHora')?.value||'',descricao:$('#eDesc')?.value.trim()||'',link,imageUrl,imagePath};if(id){await f.updateDoc(f.doc(window.db,'rede_schedule',id),payload);toastMsg('Evento atualizado.')}else{await f.addDoc(f.collection(window.db,'rede_schedule'),{...payload,feito:false,ts:f.serverTimestamp()});toastMsg('Evento criado.')}try{editingEventId=null}catch(_e){};closeOv('eventOverlay');pendingImageData='';pendingImageName='';removeExistingImage=false}catch(e){console.error('P121 save event',e);toastMsg('Erro ao salvar evento.')}finally{if(btn)btn.disabled=false}
}
function bindSave(){const b=$('#saveEventBtn');if(!b||b.dataset.p121Bound==='1')return;b.dataset.p121Bound='1';b.onclick=saveEventP121}
function ensureViewer(){if($('#p121ImageOverlay'))return;const ov=document.createElement('div');ov.id='p121ImageOverlay';ov.innerHTML='<div class="p121-viewer"><div class="p121-viewer-head"><span id="p121ViewerTitle">Print do compromisso</span><button type="button" aria-label="Fechar">×</button></div><div class="p121-viewer-body"><img id="p121ViewerImg" alt="Print do compromisso"></div></div>';document.body.appendChild(ov);ov.querySelector('button').onclick=()=>ov.classList.remove('open');ov.addEventListener('click',e=>{if(e.target===ov)ov.classList.remove('open')})}
function showImage(url,title='Print do compromisso'){ensureViewer();$('#p121ViewerTitle').textContent=title;$('#p121ViewerImg').src=url;$('#p121ImageOverlay').classList.add('open')}
function decorateEventCards(){
  const s=S();if(!s)return;$$('#viewCrono .ag-item[data-ag-id^="grupo|"]').forEach(card=>{const id=(card.dataset.agId||'').slice(6),ev=(s.schedule||[]).find(x=>String(x.id)===id);if(!ev)return;const sig=`${ev.imageUrl||''}|${ev.link||''}`;if(card.dataset.p121MediaSig===sig)return;card.dataset.p121MediaSig=sig;$('.p119-media',card)?.remove();$('.p121-media',card)?.remove();if(!ev.imageUrl&&!ev.link)return;const host=document.createElement('div');host.className='p121-media';if(ev.imageUrl){const b=document.createElement('button');b.type='button';b.className='p121-thumb';b.title='Ver print';b.innerHTML=`<img src="${esc(ev.imageUrl)}" alt="Print de ${esc(ev.titulo||'compromisso')}">`;b.onclick=e=>{e.preventDefault();e.stopPropagation();showImage(ev.imageUrl,ev.titulo||'Print do compromisso')};host.appendChild(b)}if(ev.link){const a=document.createElement('a');a.className='p121-link';a.href=normUrl(ev.link)||'#';a.target='_blank';a.rel='noopener';a.textContent='🔗 Abrir link';a.onclick=e=>e.stopPropagation();host.appendChild(a)}($('.ag-main',card)||card).appendChild(host)})
}
function bindOverlayObserver(){const ov=$('#eventOverlay');if(!ov||ov.dataset.p121Observed==='1')return;ov.dataset.p121Observed='1';new MutationObserver(()=>{if(ov.classList.contains('open'))setTimeout(syncEventFields,0)}).observe(ov,{attributes:true,attributeFilter:['class']})}
function bindPaste(){if(document.documentElement.dataset.p121Paste==='1')return;document.documentElement.dataset.p121Paste='1';document.addEventListener('paste',e=>{if(!$('#eventOverlay')?.classList.contains('open'))return;const f=[...(e.clipboardData?.files||[])].find(x=>x.type?.startsWith('image/'));if(f){e.preventDefault();prepareImage(f)}})}
function scheduleRender(){if(renderQueued)return;renderQueued=true;requestAnimationFrame(()=>{renderQueued=false;stabilizeAgenda();decorateEventCards()})}
function observeAgenda(){const body=$('#agBody');if(!body){setTimeout(observeAgenda,220);return}if(body.dataset.p121Observed==='1')return;body.dataset.p121Observed='1';new MutationObserver(muts=>{if(muts.some(m=>m.addedNodes?.length||m.removedNodes?.length))scheduleRender()}).observe(body,{childList:true,subtree:true})}
function boot(){addCss();ensureEventFields();bindSave();bindOverlayObserver();bindPaste();observeAgenda();scheduleRender();window.CARBONAUTAS_AGENDA_STABLE_BUILD=BUILD;console.info('Carbonautas P121 · agenda estabilizada: P113 único controlador + mídia isolada')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.addEventListener('firebase-ready',()=>setTimeout(boot,40),{once:true});
})();