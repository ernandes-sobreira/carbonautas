/* Carbonautas P60 · conversa no arquivo + editor mobile real */
(function(){
'use strict';
const VERSION='P60';

function mobile60(){
  const vv=window.visualViewport?.width||9999;
  const sw=window.screen?.width||9999;
  return Math.min(window.innerWidth||9999,vv,sw)<=900 || /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent||'');
}
function norm60(v=''){
  return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toLowerCase();
}
function editorTitle60(){
  let t=(document.getElementById('ooTitle')?.textContent||'').trim();
  t=t.replace(/^Correção\s*\/\s*revisão\s*·\s*/i,'').replace(/^Editar\s*·\s*/i,'');
  return t.trim();
}
function previewTitle60(){
  return (document.getElementById('filePreviewTitle')?.textContent||'').replace(/^Visualizar arquivo\s*·?\s*/i,'').trim();
}
function findCard60(title){
  const n=norm60(title); if(!n)return null;
  const cards=[...document.querySelectorAll('#viewPubs .pub-row')];
  let exact=cards.find(c=>norm60(c.querySelector('.pub-t')?.textContent||'')===n);
  if(exact)return exact;
  exact=cards.find(c=>{const ct=norm60(c.querySelector('.pub-t')?.textContent||'');return ct&&(ct.includes(n)||n.includes(ct))});
  return exact||null;
}
function convoBtn60(card){
  if(!card)return null;
  const all=[...card.querySelectorAll('button,a')].filter(x=>!x.disabled);
  const prefs=[/conversa da corre[cç][aã]o/i,/conversa do arquivo/i,/sala do arquivo/i,/^\s*💬?\s*conversa\s*$/i,/falar com/i];
  for(const rx of prefs){const b=all.find(x=>rx.test((x.textContent||'').trim()));if(b)return b}
  return null;
}
function littleToast60(msg){
  if(typeof window.toast==='function'){try{return window.toast(msg)}catch(_e){}}
  let t=document.getElementById('p60MiniToast');
  if(!t){t=document.createElement('div');t.id='p60MiniToast';t.className='p60-mini-toast';document.body.appendChild(t)}
  t.textContent=msg;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2800);
}
function openConversationForTitle60(title){
  const card=findCard60(title);
  const b=convoBtn60(card);
  if(!b){littleToast60('Não encontrei a conversa deste arquivo nesta tela. Volte ao Repositório e abra o cartão do arquivo.');return false}
  try{b.click();return true}catch(e){console.warn('P60 conversa',e);littleToast60('Não consegui abrir a conversa agora.');return false}
}

function css60(){
  if(document.getElementById('p60Style'))return;
  const s=document.createElement('style');s.id='p60Style';s.textContent=`
  .p60-mini-toast{position:fixed;left:50%;bottom:22px;z-index:2147483646;transform:translate(-50%,18px);opacity:0;pointer-events:none;background:#082331;color:#fff;border-radius:14px;padding:12px 16px;font:800 13px/1.3 system-ui;box-shadow:0 14px 40px rgba(0,0,0,.28);transition:.2s;max-width:min(520px,90vw);text-align:center}.p60-mini-toast.show{opacity:1;transform:translate(-50%,0)}
  .oo-chat-btn{background:#0b7f8f!important;color:#fff!important;border-color:#0b7f8f!important;font-weight:900!important}
  .oo-chat-btn:hover{filter:brightness(1.05)}
  #filePreviewOverlay .p60-preview-chat{background:#0b7f8f!important;color:#fff!important;border-color:#0b7f8f!important;font-weight:850!important}
  .p60-after-save{position:fixed;left:50%;bottom:22px;z-index:2147483645;transform:translateX(-50%);width:min(680px,calc(100vw - 24px));display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:14px 15px;border-radius:18px;background:#082331;color:#fff;border:1px solid rgba(255,255,255,.18);box-shadow:0 20px 60px rgba(0,0,0,.34);animation:p60up .24s ease-out}.p60-after-save b{display:block;font-size:14px}.p60-after-save small{display:block;color:#bbd7de;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.p60-after-save button{height:42px;border:0;border-radius:12px;padding:0 15px;background:#19a6a2;color:#fff;font-weight:900;font-size:13px}.p60-after-save .p60-x{position:absolute;right:-7px;top:-9px;width:25px;height:25px;padding:0;border-radius:50%;background:#fff;color:#17323a;border:1px solid #d5e0e5;font-size:14px}.p60-after-save .p60-x:hover{background:#f0f5f7}@keyframes p60up{from{opacity:0;transform:translate(-50%,18px)}to{opacity:1;transform:translate(-50%,0)}}
  @media(max-width:900px){
    #onlyOfficeOverlay.open{padding:0!important;align-items:stretch!important;justify-content:stretch!important;overflow:hidden!important;overscroll-behavior:none!important}
    #onlyOfficeOverlay .oo-modal{position:fixed!important;inset:0!important;width:100vw!important;max-width:100vw!important;height:100dvh!important;max-height:100dvh!important;margin:0!important;border-radius:0!important;transform:none!important;overflow:hidden!important}
    #onlyOfficeOverlay .oo-commandbar{width:100%!important;box-sizing:border-box!important;overflow:hidden!important}
    #onlyOfficeOverlay .oo-command-actions{width:100%!important;display:grid!important;grid-template-columns:minmax(0,1.15fr) minmax(0,.78fr) minmax(0,.92fr)!important;gap:5px!important}
    #onlyOfficeOverlay .oo-config-btn{display:none!important}
    #onlyOfficeOverlay .oo-command-actions .btn{width:100%!important;min-width:0!important;max-width:100%!important;height:38px!important;margin:0!important;padding:5px 6px!important;font-size:10.5px!important;display:flex!important;align-items:center!important;justify-content:center!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
    #onlyOfficeOverlay .modal-b{width:100vw!important;max-width:100vw!important;min-width:0!important;overflow:hidden!important;overscroll-behavior:none!important;touch-action:pan-y pinch-zoom!important}
    #onlyOfficeEditor{position:relative!important;width:100vw!important;max-width:100vw!important;min-width:0!important;height:100%!important;overflow:hidden!important;margin:0!important;padding:0!important;left:0!important;right:auto!important;transform:none!important}
    #onlyOfficeEditor iframe{position:absolute!important;inset:0!important;width:100%!important;max-width:100%!important;min-width:0!important;height:100%!important;margin:0!important;transform:none!important;border:0!important}
    .p60-after-save{bottom:14px;grid-template-columns:1fr;gap:9px;padding:13px 13px 12px;border-radius:16px}.p60-after-save button:not(.p60-x){width:100%}.p60-after-save small{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  }
  `;document.head.appendChild(s);
}

/* O config do ONLYOFFICE vinha como desktop no celular. Aqui mudamos a resposta da configuração para a interface mobile oficial. */
function patchEditorConfigFetch60(){
  if(window.__p60FetchPatched)return;window.__p60FetchPatched=true;
  const nativeFetch=window.fetch.bind(window);
  window.fetch=async function(...args){
    const res=await nativeFetch(...args);
    try{
      const u=typeof args[0]==='string'?args[0]:(args[0]?.url||'');
      if(mobile60()&&res.ok&&/\/carbonautas-api\/api\/editor-config(?:-package)?\//.test(u)){
        const data=await res.clone().json();
        if(data&&data.config){
          data.config.type='mobile';data.config.width='100%';data.config.height='100%';
          data.config.editorConfig=data.config.editorConfig||{};
          data.config.editorConfig.customization=data.config.editorConfig.customization||{};
          Object.assign(data.config.editorConfig.customization,{compactToolbar:true,toolbarNoTabs:true,hideRightMenu:true,hideLeftMenu:true});
          const h=new Headers(res.headers);h.delete('content-length');h.delete('content-encoding');h.set('content-type','application/json; charset=utf-8');
          return new Response(JSON.stringify(data),{status:res.status,statusText:res.statusText,headers:h});
        }
      }
    }catch(e){console.warn('P60 mobile config',e)}
    return res;
  };
}

function installChatButtons60(){
  const actions=document.querySelector('#onlyOfficeOverlay .oo-command-actions');
  if(actions&&!document.getElementById('p60EditorChatBtn')){
    const b=document.createElement('button');b.id='p60EditorChatBtn';b.type='button';b.className='btn oo-chat-btn';b.innerHTML='<span class="oo-full-label">💬 Conversar</span><span class="oo-short-label">💬 Falar</span>';
    const cfg=actions.querySelector('.oo-config-btn');actions.insertBefore(b,cfg||null);
    b.onclick=()=>openConversationForTitle60(editorTitle60());
  }
  const pActions=document.querySelector('#filePreviewOverlay .preview-actions');
  if(pActions&&!document.getElementById('p60PreviewChatBtn')){
    const b=document.createElement('button');b.id='p60PreviewChatBtn';b.type='button';b.className='btn p60-preview-chat';b.textContent='💬 Conversar';
    const close=pActions.querySelector('[data-close="filePreviewOverlay"]');pActions.insertBefore(b,close||null);
    b.onclick=()=>openConversationForTitle60(previewTitle60());
  }
}

let pendingSaveTitle='';
function showAfterSave60(title){
  document.querySelector('.p60-after-save')?.remove();
  const el=document.createElement('div');el.className='p60-after-save';
  el.innerHTML=`<div><b>✅ Edição salva</b><small>${String(title||'Arquivo')}</small></div><button type="button" class="p60-msg">💬 Mandar mensagem sobre o arquivo</button><button type="button" class="p60-x" aria-label="Fechar">×</button>`;
  el.querySelector('.p60-msg').onclick=()=>{if(openConversationForTitle60(title))el.remove()};
  el.querySelector('.p60-x').onclick=()=>el.remove();document.body.appendChild(el);setTimeout(()=>el.remove(),12000);
}
function watchEditorSave60(){
  const save=document.getElementById('ooSaveBtn'),overlay=document.getElementById('onlyOfficeOverlay');if(!save||!overlay)return;
  if(!save.dataset.p60){save.dataset.p60='1';save.addEventListener('click',()=>{pendingSaveTitle=editorTitle60()||pendingSaveTitle},{capture:true})}
  if(!overlay.dataset.p60){
    overlay.dataset.p60='1';let was=overlay.classList.contains('open');
    new MutationObserver(()=>{
      const now=overlay.classList.contains('open');
      if(was&&!now&&pendingSaveTitle){const t=pendingSaveTitle;pendingSaveTitle='';setTimeout(()=>showAfterSave60(t),450)}
      was=now;
    }).observe(overlay,{attributes:true,attributeFilter:['class']});
  }
}
function boot60(){css60();patchEditorConfigFetch60();installChatButtons60();watchEditorSave60();setInterval(()=>{installChatButtons60();watchEditorSave60()},1000);console.info('Carbonautas',VERSION,'editor mobile + conversa carregados')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot60,{once:true});else boot60();
})();
