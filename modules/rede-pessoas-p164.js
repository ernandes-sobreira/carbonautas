/* Carbonautas P165 · gestão de pessoas leve
   - mantém cards melhores, Tipos e Linhas
   - mantém IT e AT + tipos personalizados
   - remove MutationObserver global e setInterval
   - prepara a tela apenas quando ela é usada
   - não altera regras do Firebase nem VPS
*/
(function(){
'use strict';
if(window.__CARBONAUTAS_P164_REDE_PESSOAS)return;
window.__CARBONAUTAS_P164_REDE_PESSOAS=true;

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const BASE_KEYS=new Set(['coord','posdoc','doutorado','mestrado','estagio','ic','ie']);
const EXTRA_DEFAULTS=[
 {key:'it',sigla:'IT',label:'Iniciação Tecnológica',color:'#00A6C7',r:9},
 {key:'at',sigla:'AT',label:'Apoio Técnico',color:'#8A68FF',r:9}
];
let typeSig='',editingType='',returnToPeople=false;

function stateRef(){try{return window.state||state||{}}catch(_e){return{}}}
function niveisRef(){try{return NIVEIS}catch(_e){return null}}
function toastSafe(msg){try{if(typeof toast==='function')toast(msg)}catch(_e){}}
function esc(v){return String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function slug(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'').slice(0,18)}
function savedTypes(){
 const x=stateRef()?.settings?.tiposRede;if(!Array.isArray(x))return[];
 return x.filter(t=>t&&t.key&&t.label).map(t=>({key:slug(t.key),sigla:String(t.sigla||t.key||'').toUpperCase().slice(0,8),label:String(t.label||'').trim().slice(0,70),color:/^#[0-9a-f]{6}$/i.test(t.color||'')?t.color:'#00A6C7',r:9})).filter(t=>t.key&&!BASE_KEYS.has(t.key))
}
function allExtraTypes(){const map=new Map(EXTRA_DEFAULTS.map(t=>[t.key,{...t}]));savedTypes().forEach(t=>map.set(t.key,{...(map.get(t.key)||{}),...t}));return[...map.values()]}
function applyTypes(){
 const n=niveisRef();if(!n)return false;const extras=allExtraTypes(),sig=JSON.stringify(extras);
 extras.forEach(t=>{n[t.key]={label:t.label,short:t.sigla,color:t.color,r:Number(t.r)||9}});
 const sel=$('#mNivel');if(sel){extras.forEach(t=>{let o=sel.querySelector(`option[value="${CSS.escape(t.key)}"]`);if(!o){o=document.createElement('option');o.value=t.key;o.dataset.p164Type='1';sel.appendChild(o)}o.textContent=`${t.label} (${t.sigla})`});$$('option[data-p164-type]',sel).forEach(o=>{if(!extras.some(t=>t.key===o.value))o.remove()})}
 if(sig!==typeSig){typeSig=sig;try{if(typeof renderLegend==='function'&&document.body.dataset.view==='rede')renderLegend()}catch(_e){}}
 return true
}
async function persistTypes(list){
 const s=stateRef();if(!s.settings)s.settings={};s.settings.tiposRede=list;
 try{if(typeof fbSaveSettings!=='function')throw new Error('Salvamento indisponível');await fbSaveSettings();applyTypes();return true}catch(e){console.error('P165 tipos',e);toastSafe('Não consegui salvar os tipos.');return false}
}

function injectCss(){
 if($('#p164PeopleStyle'))return;const st=document.createElement('style');st.id='p164PeopleStyle';st.textContent=`
#peopleOverlay .modal{width:min(900px,calc(100vw - 24px));max-height:min(88dvh,900px);border-radius:24px;overflow:hidden}
#peopleOverlay .modal-h{display:block!important;padding:16px 18px 13px!important;background:#f7fbfb!important}#peopleOverlay .modal-h>.spacer{display:none!important}
.p164-people-head-top{display:flex;align-items:flex-start;gap:12px}.p164-people-head-top h2{flex:1;margin:0!important;font-size:25px!important;line-height:1.08!important}.p164-people-close{flex:0 0 42px!important;width:42px!important;height:42px!important;padding:0!important;border-radius:13px!important;font-size:0!important}.p164-people-close:after{content:'×';font-size:25px;line-height:1}
.p164-people-head-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.p164-people-head-actions .btn{width:100%;min-height:44px;justify-content:center;border-radius:13px;font-weight:850}
#peopleOverlay .modal-b{padding:14px 18px 22px!important;background:#f4f8f8}.p164-structure{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;background:#fff;border:1px solid #d9e6e4;border-radius:17px;padding:12px 13px;margin-bottom:12px}.p164-structure b{display:block;color:#183d49;font-size:13px}.p164-structure small{display:block;color:#74888f;font-size:10.5px;margin-top:3px;line-height:1.35}.p164-structure-actions{display:flex;gap:7px}.p164-structure-actions button{border:1px solid #cae0dc;background:#f2faf8;color:#21505a;border-radius:11px;min-height:38px;padding:7px 10px;font-size:10.5px;font-weight:900;white-space:nowrap}
#peopleOverlay #peopleSearch{min-height:48px;border-radius:14px!important;background:#fff!important;font-size:14px!important}#peopleOverlay .people-list{gap:10px!important}
#peopleOverlay .people-row{display:grid!important;grid-template-columns:58px minmax(0,1fr) auto!important;gap:12px!important;align-items:center!important;border:1px solid #d7e4e2!important;border-left:1px solid #d7e4e2!important;border-radius:18px!important;padding:13px!important;background:#fff!important;box-shadow:0 5px 16px rgba(18,65,73,.055)!important;min-width:0}
#peopleOverlay .people-row .p-av{width:54px!important;height:54px!important;border-radius:17px!important;font-size:13px!important}#peopleOverlay .people-row>div:nth-child(2){min-width:0}#peopleOverlay .people-row .p-name{font-size:15px!important;line-height:1.18!important;color:#173b48!important;font-weight:900!important;overflow-wrap:anywhere}#peopleOverlay .people-row .p-meta{font-size:11px!important;line-height:1.35!important;color:#74868d!important;margin-top:5px!important;white-space:normal!important}#peopleOverlay .people-row .p-actions{display:grid!important;grid-template-columns:1fr!important;gap:7px!important;min-width:150px}#peopleOverlay .people-row .p-actions .btn{min-height:38px!important;border-radius:12px!important;justify-content:center!important;padding:7px 10px!important;font-size:10.5px!important;font-weight:850!important;white-space:nowrap}
#p164TypesOverlay .modal{width:min(620px,calc(100vw - 24px));max-height:min(88dvh,780px);border-radius:23px;overflow:hidden}#p164TypesOverlay .modal-h{display:flex;align-items:center;gap:10px}#p164TypesOverlay .modal-h h2{flex:1;margin:0}.p164-type-note{border:1px solid #cfe5e1;background:#f1faf8;color:#4c6870;border-radius:13px;padding:10px 11px;font-size:11px;line-height:1.42;margin-bottom:12px}.p164-types-list{display:flex;flex-direction:column;gap:7px;margin-bottom:14px}.p164-type-row{display:grid;grid-template-columns:14px minmax(0,1fr) auto;gap:10px;align-items:center;border:1px solid #dce7e5;background:#fff;border-radius:13px;padding:10px}.p164-type-dot{width:12px;height:12px;border-radius:50%}.p164-type-main b{display:block;font-size:12.5px;color:#173c48}.p164-type-main small{display:block;font-size:10px;color:#7c8e94;margin-top:2px}.p164-type-actions{display:flex;gap:5px}.p164-type-actions button{border:1px solid #d5e3e1;background:#fff;border-radius:9px;padding:6px 8px;font-size:9.5px;font-weight:850}.p164-type-actions button.danger{color:#b5465c;background:#fff7f8;border-color:#efd2d8}.p164-type-form{border:1px solid #d8e6e3;background:#f8fbfa;border-radius:15px;padding:11px}.p164-type-form h3{margin:0 0 9px;font-size:12px;color:#244854}.p164-type-grid{display:grid;grid-template-columns:100px minmax(0,1fr) 78px;gap:8px}.p164-type-grid label{font-size:9px;text-transform:uppercase;letter-spacing:.04em;font-weight:900;color:#71858c}.p164-type-grid input{display:block;width:100%;margin-top:5px;min-height:40px;border:1px solid #d5e3e1;border-radius:10px;padding:8px 9px;background:#fff}.p164-type-grid input[type=color]{padding:4px}.p164-type-save{width:100%;min-height:43px;margin-top:9px;border:0;border-radius:11px;background:#168f94;color:#fff;font-weight:900}.p164-type-cancel{width:100%;min-height:38px;margin-top:6px;border:1px solid #d5e3e1;border-radius:11px;background:#fff;color:#526b73;font-weight:850;display:none}
@media(max-width:650px){#peopleOverlay .modal{width:calc(100vw - 20px);max-height:87dvh;border-radius:23px}#peopleOverlay .modal-h{padding:14px 14px 11px!important}.p164-people-head-top h2{font-size:23px!important;max-width:240px}.p164-people-head-actions .btn{font-size:11px!important;padding:8px 7px!important;white-space:normal!important;line-height:1.15!important}#peopleOverlay .modal-b{padding:12px 12px 22px!important}.p164-structure{grid-template-columns:1fr;padding:11px}.p164-structure-actions{display:grid;grid-template-columns:1fr 1fr}.p164-structure-actions button{width:100%}#peopleOverlay .people-row{grid-template-columns:58px minmax(0,1fr)!important;padding:13px 12px!important;gap:11px!important}#peopleOverlay .people-row .p-actions{grid-column:1/-1!important;grid-template-columns:1fr 1fr!important;min-width:0!important;margin-top:2px}#peopleOverlay .people-row .p-actions .btn{white-space:normal!important;line-height:1.15!important;min-height:42px!important}.p164-type-grid{grid-template-columns:88px minmax(0,1fr)}.p164-type-grid label:last-child{grid-column:1/-1}}
`;document.head.appendChild(st)
}
function organizeHeader(){
 const head=$('#peopleOverlay .modal-h');if(!head||head.dataset.p164Done)return false;const h=$('h2',head),dedupe=$('#peopleDedupeBtn'),add=$('#peopleAddBtn'),close=$('[data-close="peopleOverlay"]',head);if(!h||!dedupe||!add)return false;head.dataset.p164Done='1';$('.spacer',head)?.remove();const top=document.createElement('div');top.className='p164-people-head-top';const actions=document.createElement('div');actions.className='p164-people-head-actions';head.prepend(top);top.appendChild(h);if(close){close.classList.add('p164-people-close');close.setAttribute('aria-label','Fechar');close.title='Fechar';top.appendChild(close)}actions.append(dedupe,add);head.appendChild(actions);return true
}
function structureBox(){
 const body=$('#peopleOverlay .modal-b');if(!body)return false;let box=$('.p164-structure',body);if(box)return true;box=document.createElement('div');box.className='p164-structure';box.innerHTML='<div><b>Estrutura da rede</b><small>Cadastre novos tipos e novas linhas sem sair da gestão.</small></div><div class="p164-structure-actions"><button type="button" id="p164ManageTypes">＋ Tipos</button><button type="button" id="p164ManageLines">＋ Linhas</button></div>';body.prepend(box);$('#p164ManageTypes',box).onclick=()=>{returnToPeople=true;try{closeOverlay('peopleOverlay')}catch(_e){}openTypes()};$('#p164ManageLines',box).onclick=()=>{try{closeOverlay('peopleOverlay')}catch(_e){}try{if(typeof openLinhasModal==='function')openLinhasModal();else $('#manageLinhasBtn')?.click()}catch(e){console.warn('P165 linhas',e)}};return true
}
function ensureTypesOverlay(){
 if($('#p164TypesOverlay'))return;const o=document.createElement('div');o.className='overlay';o.id='p164TypesOverlay';o.innerHTML=`<div class="modal"><div class="modal-h"><h2>Tipos da Rede</h2><button type="button" class="btn ghost" id="p164TypesClose">Fechar</button></div><div class="modal-b"><div class="p164-type-note"><b>IT</b> e <b>AT</b> já ficam disponíveis. Você pode editar os nomes e criar outros tipos.</div><div class="p164-types-list" id="p164TypesList"></div><div class="p164-type-form"><h3 id="p164TypeFormTitle">Criar novo tipo</h3><div class="p164-type-grid"><label>Sigla<input id="p164TypeSigla" maxlength="8" placeholder="Ex.: AT"></label><label>Nome<input id="p164TypeName" maxlength="70" placeholder="Ex.: Apoio Técnico"></label><label>Cor<input id="p164TypeColor" type="color" value="#00A6C7"></label></div><button type="button" class="p164-type-save" id="p164TypeSave">Adicionar tipo</button><button type="button" class="p164-type-cancel" id="p164TypeCancel">Cancelar edição</button></div></div></div>`;document.body.appendChild(o);
 const close=()=>{try{closeOverlay('p164TypesOverlay')}catch(_e){o.classList.remove('open')}resetTypeForm();if(returnToPeople){returnToPeople=false;setTimeout(()=>{try{if(typeof openPeopleManager==='function')openPeopleManager()}catch(_e){}},30)}};$('#p164TypesClose').onclick=close;o.onclick=e=>{if(e.target===o)close()};$('#p164TypeSave').onclick=saveType;$('#p164TypeCancel').onclick=resetTypeForm
}
function openTypes(){ensureTypesOverlay();applyTypes();renderTypes();resetTypeForm();try{openOverlay('p164TypesOverlay')}catch(_e){$('#p164TypesOverlay').classList.add('open')}}
function renderTypes(){const box=$('#p164TypesList');if(!box)return;box.innerHTML=allExtraTypes().map(t=>{const custom=!EXTRA_DEFAULTS.some(d=>d.key===t.key),used=(stateRef().members||[]).filter(m=>m.nivel===t.key).length;return `<div class="p164-type-row"><i class="p164-type-dot" style="background:${esc(t.color)}"></i><div class="p164-type-main"><b>${esc(t.sigla)} · ${esc(t.label)}</b><small>${used} pessoa${used===1?'':'s'}${custom?' · personalizado':' · inicial'}</small></div><div class="p164-type-actions"><button type="button" data-edit-type="${esc(t.key)}">Editar</button>${custom?`<button type="button" class="danger" data-del-type="${esc(t.key)}">Excluir</button>`:''}</div></div>`}).join('');$$('[data-edit-type]',box).forEach(b=>b.onclick=()=>editType(b.dataset.editType));$$('[data-del-type]',box).forEach(b=>b.onclick=()=>deleteType(b.dataset.delType))}
function resetTypeForm(){editingType='';const a=$('#p164TypeSigla'),b=$('#p164TypeName'),c=$('#p164TypeColor'),save=$('#p164TypeSave'),cancel=$('#p164TypeCancel'),title=$('#p164TypeFormTitle');if(a)a.value='';if(b)b.value='';if(c)c.value='#00A6C7';if(save)save.textContent='Adicionar tipo';if(cancel)cancel.style.display='none';if(title)title.textContent='Criar novo tipo'}
function editType(key){const t=allExtraTypes().find(x=>x.key===key);if(!t)return;editingType=key;$('#p164TypeSigla').value=t.sigla;$('#p164TypeName').value=t.label;$('#p164TypeColor').value=t.color;$('#p164TypeSave').textContent='Salvar alterações';$('#p164TypeCancel').style.display='block';$('#p164TypeFormTitle').textContent='Editar tipo';$('#p164TypeName').focus()}
async function saveType(){const sigla=($('#p164TypeSigla')?.value||'').trim().toUpperCase(),label=($('#p164TypeName')?.value||'').trim(),color=$('#p164TypeColor')?.value||'#00A6C7',key=editingType||slug(sigla);if(!sigla||!label)return toastSafe('Preencha a sigla e o nome do tipo.');if(!key||BASE_KEYS.has(key))return toastSafe('Use outra sigla.');const list=savedTypes().filter(t=>t.key!==key);list.push({key,sigla:sigla.slice(0,8),label:label.slice(0,70),color,r:9});if(await persistTypes(list)){toastSafe(editingType?'Tipo atualizado.':'Tipo adicionado.');renderTypes();resetTypeForm()}}
async function deleteType(key){const used=(stateRef().members||[]).filter(m=>m.nivel===key);if(used.length)return toastSafe(`Esse tipo está sendo usado por ${used.length} pessoa${used.length===1?'':'s'}.`);const t=allExtraTypes().find(x=>x.key===key);if(!t||!confirm(`Excluir o tipo ${t.sigla} · ${t.label}?`))return;const list=savedTypes().filter(x=>x.key!==key),n=niveisRef();try{if(n&&n[key])delete n[key]}catch(_e){}if(await persistTypes(list)){toastSafe('Tipo excluído.');renderTypes();resetTypeForm()}}

function preparePeople(){injectCss();applyTypes();organizeHeader();structureBox()}
function patchOpenMember(){let fn=null;try{fn=window.openMember||openMember}catch(_e){}if(typeof fn!=='function'||fn.__p164Types)return;const wrapped=function(){applyTypes();return fn.apply(this,arguments)};wrapped.__p164Types=true;wrapped.__p164Original=fn;try{openMember=wrapped}catch(_e){}window.openMember=wrapped}
function patchPeopleManager(){let fn=null;try{fn=window.openPeopleManager||openPeopleManager}catch(_e){}if(typeof fn!=='function'||fn.__p165Fast)return;const wrapped=function(){preparePeople();return fn.apply(this,arguments)};wrapped.__p165Fast=true;wrapped.__p165Original=fn;try{openPeopleManager=wrapped}catch(_e){}window.openPeopleManager=wrapped}
function boot(){
 injectCss();applyTypes();patchOpenMember();patchPeopleManager();
 if($('#peopleOverlay')){organizeHeader();structureBox()}
 document.addEventListener('click',e=>{if(e.target.closest?.('#managePeopleBtn'))requestAnimationFrame(preparePeople);if(e.target.closest?.('#peopleAddBtn'))applyTypes()},true);
 setTimeout(()=>{patchOpenMember();patchPeopleManager()},220)
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
