/* Carbonautas P119 · Agenda estável: um dia por swipe + print/link nos eventos do grupo. */
(function(){
'use strict';
const BUILD='P119';
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
function view(){return $('#viewCrono')}
function dayMode(){const v=view();return !!v && v.dataset.p119Mode==='day'}

function addCss(){
  if($('#p119AgendaStyle'))return;
  const st=document.createElement('style');st.id='p119AgendaStyle';st.textContent=`
    #viewCrono[data-p119-mode="day"] .ag-month{scroll-behavior:auto!important;scroll-snap-type:none!important;overscroll-behavior-x:none!important;touch-action:pan-y!important}
    #viewCrono[data-p119-mode="day"] .ag-day{scroll-snap-align:none!important;scroll-snap-stop:normal!important;animation:none!important}
    #viewCrono[data-p119-mode="day"] .ag-day.sel{animation:none!important}
    #viewCrono[data-p119-mode="day"] .ag-day.p119-drag{transition:none!important;will-change:transform;z-index:8!important}
    #viewCrono .p119-media{display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin-top:10px}
    #viewCrono .p119-thumb{width:74px;height:52px;border:0;border-radius:12px;padding:0;overflow:hidden;background:#eef6f4;box-shadow:0 4px 12px rgba(25,66,69,.08)}
    #viewCrono .p119-thumb img{width:100%;height:100%;object-fit:cover;display:block}
    #viewCrono .p119-link{display:inline-flex;align-items:center;gap:5px;min-height:34px;padding:7px 10px;border:1px solid #d8e6e3;border-radius:11px;background:#fff;color:#176e6a;text-decoration:none;font-size:11px;font-weight:850}
    #eventOverlay .p119-upload{border:1.5px dashed #b8d5d0;border-radius:15px;background:#f7fbfa;min-height:108px;padding:12px;display:grid;place-items:center;text-align:center;cursor:pointer;overflow:hidden}
    #eventOverlay .p119-upload img{max-width:100%;max-height:190px;border-radius:10px;object-fit:contain}
    #eventOverlay .p119-upload b{display:block;color:#2d5a60;margin-bottom:4px}
    #eventOverlay .p119-upload small{color:#71868b;line-height:1.4}
    #eventOverlay .p119-media-actions{display:flex;gap:7px;margin-top:7px;flex-wrap:wrap}
    #eventOverlay .p119-media-actions button{border:1px solid #d6e3e1;background:#fff;border-radius:10px;padding:7px 10px;font-weight:750;color:#365d63}
    #p119ImageOverlay{position:fixed;inset:0;z-index:2147483646;background:rgba(6,25,31,.82);display:none;align-items:center;justify-content:center;padding:18px}
    #p119ImageOverlay.open{display:flex}
    #p119ImageOverlay .p119-viewer{width:min(960px,100%);max-height:94dvh;background:#fff;border-radius:20px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 30px 90px rgba(0,0,0,.34)}
    #p119ImageOverlay .p119-viewer-head{display:flex;align-items:center;gap:10px;padding:11px 13px;border-bottom:1px solid #e4eceb;color:#284d54;font-weight:850}
    #p119ImageOverlay .p119-viewer-head span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    #p119ImageOverlay .p119-viewer-head button{width:38px;height:38px;border:0;border-radius:11px;background:#eef4f3;font-size:22px;color:#35545a}
    #p119ImageOverlay .p119-viewer-body{padding:12px;overflow:auto;display:grid;place-items:center;background:#f5f9f8}
    #p119ImageOverlay img{max-width:100%;max-height:78dvh;border-radius:12px;object-fit:contain}
    @media(max-width:640px){
      #eventOverlay .p119-upload{min-height:92px}.p119-media-actions{font-size:11px}
      #viewCrono .p119-thumb{width:68px;height:48px}
    }
  `;document.head.appendChild(st);
}

function cards(track){return $$('.ag-day:not(.out)',track).filter(el=>getComputedStyle(el).display!=='none')}
function selectedCard(track){return $('.ag-day.sel:not(.out)',track)||$('.ag-day.today:not(.out)',track)||cards(track)[0]||null}
function center(track,card){if(!track||!card)return;const left=Math.max(0,card.offsetLeft-(track.clientWidth-card.offsetWidth)/2);track._p110Programmatic=true;track.scrollLeft=left;requestAnimationFrame(()=>{track._p110Programmatic=false})}
function markDayMode(){
  const v=view();if(!v)return;v.dataset.p119Mode='day';
  if(v.dataset.p114Mode==='day'||!v.dataset.p114Mode)v.dataset.p114Mode='p119day';
  const day=$('#p114DayMode',v),month=$$('.ag-modes button,#agModes button',v).find(b=>(b.textContent||'').trim()==='Mês'),year=$$('.ag-modes button,#agModes button',v).find(b=>(b.textContent||'').trim()==='Ano');
  [day,month,year].filter(Boolean).forEach(b=>b.classList.remove('p114-mode-active'));
  day?.classList.add('p114-mode-active');
  const track=$('.ag-month',v);if(track){bindTrack(track);requestAnimationFrame(()=>center(track,selectedCard(track)))}
}
function choose(track,target){
  if(!track||!target)return;track._p119Internal=true;track._p110Programmatic=true;
  try{target.click()}finally{track._p119Internal=false}
  setTimeout(()=>{const nt=$('#viewCrono .ag-month');if(nt){bindTrack(nt);center(nt,$(`.ag-day[data-iso="${target.dataset.iso}"]:not(.out)`,nt)||selectedCard(nt))}},25);
}
function bindTrack(track){
  if(!track||track.dataset.p119Bound==='1')return;track.dataset.p119Bound='1';
  const g={active:false,id:null,x:0,y:0,lastX:0,axis:'',index:0,card:null,t:0};
  track.addEventListener('scroll',e=>{if(dayMode())e.stopImmediatePropagation()},{capture:true,passive:true});
  ['touchstart','touchmove','touchend','touchcancel'].forEach(type=>track.addEventListener(type,e=>{if(dayMode())e.stopImmediatePropagation()},{capture:true,passive:true}));
  track.addEventListener('click',e=>{
    if(!dayMode())return;const d=e.target.closest('.ag-day:not(.out)');if(!d)return;
    if(track._p119Internal)return;
    if(!e.isTrusted){e.preventDefault();e.stopImmediatePropagation();requestAnimationFrame(()=>center(track,selectedCard(track)));return}
    setTimeout(()=>center(track,$(`.ag-day[data-iso="${d.dataset.iso}"]:not(.out)`,track)||selectedCard(track)),20);
  },{capture:true});
  track.addEventListener('pointerdown',e=>{
    if(!dayMode()||!e.isPrimary||(e.pointerType==='mouse'&&e.button!==0)||e.target.closest('button,a,input,select,textarea'))return;
    e.stopImmediatePropagation();const list=cards(track),sel=selectedCard(track);let i=list.indexOf(sel);if(i<0)i=0;
    g.active=true;g.id=e.pointerId;g.x=e.clientX;g.lastX=e.clientX;g.y=e.clientY;g.axis='';g.index=i;g.card=list[i]||null;g.t=performance.now();
    try{track.setPointerCapture(e.pointerId)}catch(_e){}
  },{capture:true,passive:true});
  track.addEventListener('pointermove',e=>{
    if(!g.active||e.pointerId!==g.id)return;e.stopImmediatePropagation();const dx=e.clientX-g.x,dy=e.clientY-g.y;g.lastX=e.clientX;
    if(!g.axis&&Math.max(Math.abs(dx),Math.abs(dy))>7)g.axis=Math.abs(dx)>Math.abs(dy)*1.15?'x':'y';
    if(g.axis==='x'){e.preventDefault();const m=Math.max(-38,Math.min(38,dx*.22));if(g.card){g.card.classList.add('p119-drag');g.card.style.setProperty('transform',`translateX(${m}px) translateY(-3px) scale(1)`,'important')}}
  },{capture:true,passive:false});
  function finish(e,cancel){
    if(!g.active||e.pointerId!==g.id)return;e.stopImmediatePropagation();const dx=(Number.isFinite(e.clientX)?e.clientX:g.lastX)-g.x,dt=Math.max(1,performance.now()-g.t),vel=Math.abs(dx)/dt,list=cards(track);let to=g.index;
    if(!cancel&&g.axis==='x'&&(Math.abs(dx)>=34||vel>.42))to+=dx<0?1:-1;to=Math.max(0,Math.min(to,list.length-1));
    if(g.card){g.card.classList.remove('p119-drag');g.card.style.removeProperty('transform')}
    if(to!==g.index)choose(track,list[to]);else center(track,list[g.index]);g.active=false;g.id=null;g.axis='';g.card=null;
  }
  track.addEventListener('pointerup',e=>finish(e,false),{capture:true,passive:false});
  track.addEventListener('pointercancel',e=>finish(e,true),{capture:true,passive:false});
}
function bindModes(){
  const v=view();if(!v)return;
  let month=$$('.ag-modes button,#agModes button',v).find(b=>(b.textContent||'').trim()==='Mês');
  let year=$$('.ag-modes button,#agModes button',v).find(b=>(b.textContent||'').trim()==='Ano');
  let day=$('#p114DayMode',v);
  if(!day&&month){day=document.createElement('button');day.type='button';day.id='p114DayMode';day.className=month.className;day.textContent='Dia';month.insertAdjacentElement('beforebegin',day)}
  if(day&&day.dataset.p119Bound!=='1'){day.dataset.p119Bound='1';day.addEventListener('click',()=>setTimeout(markDayMode,35))}
  if(month&&month.dataset.p119Bound!=='1'){month.dataset.p119Bound='1';month.addEventListener('click',()=>setTimeout(()=>{v.dataset.p119Mode='month'},20))}
  if(year&&year.dataset.p119Bound!=='1'){year.dataset.p119Bound='1';year.addEventListener('click',()=>setTimeout(()=>{v.dataset.p119Mode='year'},20))}
  const current=v.dataset.p114Mode||'';
  if(current==='month'||current==='year')v.dataset.p119Mode=current;else markDayMode();
}

function ensureEventFields(){
  const desc=$('#eDesc'),modal=$('#eventOverlay');if(!desc||!modal||$('#p119EventLink'))return;
  const descFg=desc.closest('.fg');
  const link=document.createElement('div');link.className='fg';link.innerHTML='<label>Link do compromisso (opcional)</label><input id="p119EventLink" type="url" inputmode="url" placeholder="Meet, Zoom, formulário, artigo, documento…">';
  const img=document.createElement('div');img.className='fg';img.id='p119EventImageField';img.innerHTML='<label>Print / imagem (opcional)</label><div class="p119-upload" id="p119EventDrop" tabindex="0"><div><b>🖼 Adicionar print</b><small>Toque para escolher uma imagem. Também aceita colar um print.</small></div></div><input id="p119EventFile" type="file" accept="image/*" hidden><div class="p119-media-actions"><button type="button" id="p119ChooseImage">Escolher imagem</button><button type="button" id="p119RemoveImage">Remover</button></div>';
  descFg?.insertAdjacentElement('beforebegin',link);descFg?.insertAdjacentElement('beforebegin',img);
  const drop=$('#p119EventDrop'),file=$('#p119EventFile');
  drop.onclick=()=>file.click();$('#p119ChooseImage').onclick=()=>file.click();file.onchange=()=>{if(file.files?.[0])prepareImage(file.files[0])};
  $('#p119RemoveImage').onclick=()=>{pendingImageData='';pendingImageName='';removeExistingImage=true;renderEventImage('')};
  ['dragenter','dragover'].forEach(t=>drop.addEventListener(t,e=>{e.preventDefault();drop.style.background='#edf8f5'}));
  ['dragleave','drop'].forEach(t=>drop.addEventListener(t,e=>{e.preventDefault();drop.style.background=''}));
  drop.addEventListener('drop',e=>{const f=e.dataTransfer?.files?.[0];if(f)prepareImage(f)});
}
function renderEventImage(url=''){
  const d=$('#p119EventDrop');if(!d)return;
  if(pendingImageData)d.innerHTML=`<img src="${pendingImageData}" alt="Print pronto">`;
  else if(url)d.innerHTML=`<img src="${esc(url)}" alt="Print do compromisso">`;
  else d.innerHTML='<div><b>🖼 Adicionar print</b><small>Toque para escolher uma imagem. Também aceita colar um print.</small></div>';
}
async function prepareImage(file){
  if(!file?.type?.startsWith('image/'))return toastMsg('Escolha uma imagem.');if(file.size>15*1024*1024)return toastMsg('Imagem maior que 15 MB.');
  try{const data=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)}),im=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=data}),max=1600,s=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*s));c.height=Math.max(1,Math.round(im.height*s));c.getContext('2d').drawImage(im,0,0,c.width,c.height);pendingImageData=c.toDataURL('image/jpeg',.86);pendingImageName=file.name||'print.jpg';removeExistingImage=false;renderEventImage()}catch(e){console.warn('P119 imagem',e);toastMsg('Não consegui preparar esse print.')}
}
function currentEditingId(){try{if(typeof editingEventId!=='undefined'&&editingEventId)return String(editingEventId)}catch(_e){};const title=$('#eTitulo')?.value.trim()||'',data=$('#eData')?.value||'',hora=$('#eHora')?.value||'';if(!/Editar/i.test($('#eventTitle')?.textContent||''))return'';const matches=(S()?.schedule||[]).filter(x=>(x.titulo||'')===title&&(x.data||'')===data&&(x.hora||'')===hora);return matches.length===1?String(matches[0].id):''}
function currentEvent(){const id=currentEditingId();return id?(S()?.schedule||[]).find(x=>String(x.id)===id)||null:null}
function syncEventFields(){
  ensureEventFields();pendingImageData='';pendingImageName='';removeExistingImage=false;const ev=currentEvent();if($('#p119EventLink'))$('#p119EventLink').value=ev?.link||'';renderEventImage(ev?.imageUrl||'');
}
async function uploadImage(){const f=F(),uid=window.auth?.currentUser?.uid;if(!f||!uid||!pendingImageData)throw new Error('Sessão encerrada.');const path=`rede_uploads/${uid}/agenda_${Date.now()}_${Math.random().toString(36).slice(2,7)}.jpg`,ref=f.sRef(window.storage,path);await f.uploadString(ref,pendingImageData,'data_url');return {url:await f.getDownloadURL(ref),path}}
async function deleteImage(path){if(!path||!F())return;try{await F().deleteObject(F().sRef(window.storage,path))}catch(_e){}}
async function saveEventP119(){
  if(!admin())return toastMsg('Só o coordenador cria eventos do grupo.');const f=F();if(!f)return toastMsg('Firebase ainda não carregou.');const titulo=$('#eTitulo')?.value.trim()||'',data=$('#eData')?.value||'';if(!titulo||!data)return toastMsg('Preencha título e data.');
  const linkRaw=$('#p119EventLink')?.value.trim()||'',link=normUrl(linkRaw);if(linkRaw&&!link)return toastMsg('Confira o link informado.');const id=currentEditingId(),old=id?(S()?.schedule||[]).find(x=>String(x.id)===id):null;
  if(/Editar/i.test($('#eventTitle')?.textContent||'')&&!id)return toastMsg('Não consegui identificar o evento para editar. Feche e abra novamente.');
  const btn=$('#saveEventBtn');if(btn)btn.disabled=true;
  try{toastMsg('Salvando compromisso…');let imageUrl=old?.imageUrl||'',imagePath=old?.imagePath||'';if(removeExistingImage){imageUrl='';imagePath=''}if(pendingImageData){const up=await uploadImage();if(up){if(old?.imagePath)deleteImage(old.imagePath);imageUrl=up.url;imagePath=up.path}}else if(removeExistingImage&&old?.imagePath)deleteImage(old.imagePath);
    const payload={titulo,data,hora:$('#eHora')?.value||'',descricao:$('#eDesc')?.value.trim()||'',link,imageUrl,imagePath};
    if(id){await f.updateDoc(f.doc(window.db,'rede_schedule',id),payload);toastMsg('Evento atualizado.')}else{await f.addDoc(f.collection(window.db,'rede_schedule'),{...payload,feito:false,ts:f.serverTimestamp()});toastMsg('Evento criado.')}
    try{editingEventId=null}catch(_e){};closeOv('eventOverlay');pendingImageData='';pendingImageName='';removeExistingImage=false;
  }catch(e){console.error('P119 save event',e);toastMsg('Erro ao salvar evento.')}finally{if(btn)btn.disabled=false}
}
function bindSave(){const b=$('#saveEventBtn');if(!b||b.dataset.p119Bound==='1')return;b.dataset.p119Bound='1';b.onclick=saveEventP119}
function ensureViewer(){if($('#p119ImageOverlay'))return;const ov=document.createElement('div');ov.id='p119ImageOverlay';ov.innerHTML='<div class="p119-viewer"><div class="p119-viewer-head"><span id="p119ViewerTitle">Print do compromisso</span><button type="button" aria-label="Fechar">×</button></div><div class="p119-viewer-body"><img id="p119ViewerImg" alt="Print do compromisso"></div></div>';document.body.appendChild(ov);ov.querySelector('button').onclick=()=>ov.classList.remove('open');ov.addEventListener('click',e=>{if(e.target===ov)ov.classList.remove('open')})}
function showImage(url,title='Print do compromisso'){ensureViewer();$('#p119ViewerTitle').textContent=title;$('#p119ViewerImg').src=url;$('#p119ImageOverlay').classList.add('open')}
function decorateEventCards(){
  const s=S();if(!s)return;$$('#viewCrono .ag-item[data-ag-id^="grupo|"]').forEach(card=>{
    const id=(card.dataset.agId||'').slice(6),ev=(s.schedule||[]).find(x=>String(x.id)===id);if(!ev)return;let host=$('.p119-media',card);if(host)host.remove();if(!ev.imageUrl&&!ev.link)return;
    host=document.createElement('div');host.className='p119-media';
    if(ev.imageUrl){const b=document.createElement('button');b.type='button';b.className='p119-thumb';b.title='Ver print';b.innerHTML=`<img src="${esc(ev.imageUrl)}" alt="Print de ${esc(ev.titulo||'compromisso')}">`;b.onclick=e=>{e.preventDefault();e.stopPropagation();showImage(ev.imageUrl,ev.titulo||'Print do compromisso')};host.appendChild(b)}
    if(ev.link){const a=document.createElement('a');a.className='p119-link';a.href=normUrl(ev.link)||'#';a.target='_blank';a.rel='noopener';a.textContent='🔗 Abrir link';a.onclick=e=>e.stopPropagation();host.appendChild(a)}
    ($('.ag-main',card)||card).appendChild(host);
  })
}
function bindOverlayObserver(){const ov=$('#eventOverlay');if(!ov||ov.dataset.p119Observed==='1')return;ov.dataset.p119Observed='1';new MutationObserver(()=>{if(ov.classList.contains('open'))setTimeout(syncEventFields,0)}).observe(ov,{attributes:true,attributeFilter:['class']})}
function bindPaste(){if(document.documentElement.dataset.p119Paste==='1')return;document.documentElement.dataset.p119Paste='1';document.addEventListener('paste',e=>{if(!$('#eventOverlay')?.classList.contains('open'))return;const f=[...(e.clipboardData?.files||[])].find(x=>x.type?.startsWith('image/'));if(f){e.preventDefault();prepareImage(f)}})}
function scheduleRender(){if(renderQueued)return;renderQueued=true;requestAnimationFrame(()=>{renderQueued=false;bindModes();const t=$('#viewCrono .ag-month');if(t&&dayMode())bindTrack(t);decorateEventCards()})}
function boot(){
  addCss();ensureEventFields();bindSave();bindOverlayObserver();bindPaste();bindModes();decorateEventCards();
  const body=$('#agBody');if(body)new MutationObserver(scheduleRender).observe(body,{childList:true,subtree:true});
  else setTimeout(boot,250);
  window.CARBONAUTAS_AGENDA_STABLE_BUILD=BUILD;console.info('Carbonautas P119 · agenda estável + print/link ativa');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.addEventListener('firebase-ready',()=>setTimeout(boot,40),{once:true});
})();
