/* Carbonautas P62 · rollback seguro do editor + conversa sem alterar ONLYOFFICE */
(function(){
'use strict';
const VERSION='P62';
function norm(v=''){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toLowerCase()}
function editorTitle(){let t=(document.getElementById('ooTitle')?.textContent||'').trim();return t.replace(/^Correção\s*\/\s*revisão\s*·\s*/i,'').replace(/^Editar\s*·\s*/i,'').trim()}
function findCard(title){const n=norm(title);if(!n)return null;const cards=[...document.querySelectorAll('#viewPubs .pub-row')];return cards.find(c=>norm(c.querySelector('.pub-t')?.textContent||'')===n)||cards.find(c=>{const ct=norm(c.querySelector('.pub-t')?.textContent||'');return ct&&(ct.includes(n)||n.includes(ct))})||null}
function convoButton(card){if(!card)return null;const els=[...card.querySelectorAll('button,a')].filter(x=>!x.disabled);for(const rx of [/conversa da corre[cç][aã]o/i,/conversa do arquivo/i,/sala do arquivo/i,/^\s*💬?\s*conversa\s*$/i,/falar com/i]){const b=els.find(x=>rx.test((x.textContent||'').trim()));if(b)return b}return null}
function toast(msg){let t=document.getElementById('p62Toast');if(!t){t=document.createElement('div');t.id='p62Toast';t.style.cssText='position:fixed;left:50%;bottom:18px;z-index:2147483646;transform:translateX(-50%);background:#082331;color:white;padding:11px 15px;border-radius:12px;font:800 13px system-ui;box-shadow:0 12px 35px #0005;max-width:90vw;text-align:center';document.body.appendChild(t)}t.textContent=msg;clearTimeout(t._x);t._x=setTimeout(()=>t.remove(),2800)}
function openConversation(title){const b=convoButton(findCard(title));if(!b){toast('Volte ao Repositório e use Conversa neste arquivo.');return false}try{b.click();return true}catch(_e){toast('Não consegui abrir a conversa agora.');return false}}
function addCss(){if(document.getElementById('p62Style'))return;const s=document.createElement('style');s.id='p62Style';s.textContent=`
@media(max-width:900px){
 #onlyOfficeOverlay.open{padding:0!important;overflow:hidden!important}
 #onlyOfficeOverlay .oo-modal{position:fixed!important;inset:0!important;width:100vw!important;max-width:100vw!important;height:100dvh!important;max-height:100dvh!important;margin:0!important;border-radius:0!important;overflow:hidden!important}
 #onlyOfficeOverlay .oo-commandbar{padding:6px!important;gap:5px!important;overflow:hidden!important}
 #onlyOfficeOverlay .oo-command-title{display:none!important}
 #onlyOfficeOverlay .oo-command-actions{width:100%!important;display:grid!important;grid-template-columns:1.05fr .85fr .85fr!important;gap:5px!important}
 #onlyOfficeOverlay .oo-command-actions .btn{width:100%!important;min-width:0!important;height:38px!important;padding:4px 5px!important;font-size:10.5px!important;justify-content:center!important;overflow:hidden!important}
 #onlyOfficeOverlay .oo-config-btn{display:none!important}
 #onlyOfficeOverlay .modal-b{padding:0!important;min-width:0!important;overflow:hidden!important}
 /* IMPORTANTE: P62 NÃO redimensiona, posiciona ou transforma o iframe do ONLYOFFICE. */
 #onlyOfficeOverlay .oo-statusbar{font-size:10px!important;min-height:32px!important;padding:6px 8px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
}
.p62-chat-btn{background:#0b8794!important;color:#fff!important;border-color:#0b8794!important;font-weight:900!important}
.p62-after-save{position:fixed;left:50%;bottom:16px;z-index:2147483645;transform:translateX(-50%);width:min(650px,calc(100vw - 22px));padding:13px;border-radius:16px;background:#082331;color:#fff;box-shadow:0 18px 50px #0006;display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center}.p62-after-save b{display:block}.p62-after-save small{display:block;color:#c2dbe1;margin-top:3px}.p62-after-save button{border:0;border-radius:11px;padding:11px 13px;background:#13a0a1;color:white;font-weight:900}@media(max-width:600px){.p62-after-save{grid-template-columns:1fr}.p62-after-save button{width:100%}}
`;document.head.appendChild(s)}
function installChat(){const a=document.querySelector('#onlyOfficeOverlay .oo-command-actions');if(a&&!document.getElementById('p62ChatBtn')){const b=document.createElement('button');b.id='p62ChatBtn';b.type='button';b.className='btn p62-chat-btn';b.textContent='💬 Falar';const cfg=a.querySelector('.oo-config-btn');a.insertBefore(b,cfg||null);b.onclick=()=>openConversation(editorTitle())}}
let pending='';
function watchSave(){const save=document.getElementById('ooSaveBtn'),ov=document.getElementById('onlyOfficeOverlay');if(!save||!ov)return;if(!save.dataset.p62){save.dataset.p62='1';save.addEventListener('click',()=>{pending=editorTitle()||pending},{capture:true})}if(!ov.dataset.p62){ov.dataset.p62='1';let was=ov.classList.contains('open');new MutationObserver(()=>{const now=ov.classList.contains('open');if(was&&!now&&pending){const title=pending;pending='';setTimeout(()=>showAfter(title),350)}was=now}).observe(ov,{attributes:true,attributeFilter:['class']})}}
function showAfter(title){document.querySelector('.p62-after-save')?.remove();const el=document.createElement('div');el.className='p62-after-save';el.innerHTML=`<div><b>✅ Arquivo salvo</b><small>${String(title||'Arquivo')}</small></div><button type="button">💬 Mandar mensagem</button>`;el.querySelector('button').onclick=()=>{if(openConversation(title))el.remove()};document.body.appendChild(el);setTimeout(()=>el.remove(),12000)}
function boot(){addCss();installChat();watchSave();setInterval(()=>{installChat();watchSave()},900);console.info('Carbonautas',VERSION,'editor original restaurado; sem interceptar config/fetch')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
