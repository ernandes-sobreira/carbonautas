/* Carbonautas P166 · gestão da Rede dentro do Acompanhamento
   - usa as pastas bonitas do Acompanhamento como lista oficial de pessoas
   - o botão Gerenciar alunos da Rede leva ao Acompanhamento
   - reúne Adicionar, Tipos, Linhas e Duplicados em um único painel admin
   - adiciona Editar/Excluir na visão geral da pessoa
   - evita uma segunda lista de alunos e não cria polling global
*/
(function(){
'use strict';
if(window.__CARBONAUTAS_P166_GESTAO_TRACK)return;
window.__CARBONAUTAS_P166_GESTAO_TRACK=true;

const $=(s,r=document)=>r.querySelector(s);
let activeMemberId='';
let retry=0;

function admin(){try{return !!(window.isAdmin??isAdmin)}catch(_e){return false}}
function S(){try{return window.state||state||{}}catch(_e){return{}}}
function toastSafe(msg){try{if(typeof toast==='function')toast(msg)}catch(_e){}}
function norm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
function trackActive(){return document.body?.dataset?.view==='track'||$('#viewTrack')?.classList.contains('on')}

function injectCss(){
 if($('#p166TrackAdminStyle'))return;
 const st=document.createElement('style');st.id='p166TrackAdminStyle';st.textContent=`
#p166TrackAdmin{margin:4px 0 14px;border:1px solid #d6e5e2;border-radius:19px;background:linear-gradient(145deg,#f5fbf9,#fff);padding:12px 13px;box-shadow:0 10px 26px rgba(21,55,66,.055)}
.p166-admin-head{display:flex;gap:10px;align-items:flex-start;margin-bottom:10px}.p166-admin-head>div{flex:1;min-width:0}.p166-admin-head b{display:block;color:#173d48;font-size:13px}.p166-admin-head small{display:block;color:#74888f;font-size:10px;line-height:1.35;margin-top:2px}.p166-admin-badge{flex:0 0 auto;border-radius:999px;background:#e8f6f3;color:#177176;padding:5px 8px;font-size:8.5px;font-weight:950;letter-spacing:.04em}
.p166-admin-actions{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.p166-admin-actions button{min-height:42px;border:1px solid #cee0dd;border-radius:12px;background:#fff;color:#244b56;font-size:10.5px;font-weight:900;padding:7px 8px}.p166-admin-actions button.primary{background:#168f94;border-color:#168f94;color:#fff}
.p166-person-admin{margin-top:12px;padding-top:11px;border-top:1px solid #dce8e6;display:grid;grid-template-columns:1fr 1fr;gap:8px}.p166-person-admin button{min-height:42px;border:1px solid #d3e1df;border-radius:12px;background:#fff;color:#244b56;font-weight:900}.p166-person-admin button.danger{border-color:#edd1d7;color:#b2475b;background:#fff9fa}
#peopleAdminBlock .hint.p166-hint{line-height:1.35}
@media(max-width:650px){#p166TrackAdmin{margin-top:2px;padding:11px}.p166-admin-actions{grid-template-columns:1fr 1fr}.p166-admin-actions button{min-height:44px;font-size:11px}}
`;
 document.head.appendChild(st)
}

function switchTrack(){
 try{if(typeof window.switchView==='function')window.switchView('track');else if(typeof switchView==='function')switchView('track')}catch(_e){}
 retry=0;prepareTrack(true)
}
function openAdd(){try{if(typeof window.openMember==='function')window.openMember(null);else if(typeof openMember==='function')openMember(null);else toastSafe('Cadastro indisponível.')}catch(e){console.warn('P166 adicionar',e)}}
function openTypes(){const b=$('#p164ManageTypes');if(b){b.click();return}toastSafe('Abra novamente em alguns instantes; os tipos ainda estão carregando.')}
function openLines(){try{if(typeof window.openLinhasModal==='function')window.openLinhasModal();else if(typeof openLinhasModal==='function')openLinhasModal();else $('#p164ManageLines')?.click()}catch(e){console.warn('P166 linhas',e)}}
function dedupe(){try{if(typeof window.dedupeMembers==='function')window.dedupeMembers();else if(typeof dedupeMembers==='function')dedupeMembers();else toastSafe('Verificação de duplicados indisponível.')}catch(e){console.warn('P166 duplicados',e)}}

function mountAdminPanel(){
 if(!admin()){$('#p166TrackAdmin')?.remove();return true}
 const root=$('#p97Folders');if(!root)return false;
 let box=$('#p166TrackAdmin');if(box)return true;
 box=document.createElement('section');box.id='p166TrackAdmin';box.innerHTML=`<div class="p166-admin-head"><div><b>Gestão da rede</b><small>Os alunos da Rede são estas mesmas pastas do Acompanhamento. Cadastros e estrutura ficam aqui; o grafo fica só para visualizar relações.</small></div><span class="p166-admin-badge">COORDENAÇÃO</span></div><div class="p166-admin-actions"><button type="button" class="primary" data-p166="add">＋ Aluno</button><button type="button" data-p166="types">Tipos</button><button type="button" data-p166="lines">Linhas</button><button type="button" data-p166="dedupe">Duplicados</button></div>`;
 const hero=$('.p97-hero',root);if(hero)hero.insertAdjacentElement('afterend',box);else root.prepend(box);
 box.addEventListener('click',e=>{const b=e.target.closest('[data-p166]');if(!b)return;const a=b.dataset.p166;if(a==='add')openAdd();else if(a==='types')openTypes();else if(a==='lines')openLines();else if(a==='dedupe')dedupe()});
 return true
}

function currentMember(){
 const list=S().members||[];
 if(activeMemberId){const m=list.find(x=>x.id===activeMemberId);if(m)return m}
 const name=$('#p97DeckName')?.textContent||'';return list.find(x=>norm(x.nome)===norm(name))||null
}
function closeDeck(){const ov=$('#p97Deck');if(ov&&!ov.hidden){ov.hidden=true;document.documentElement.style.overflow=''}}
function mountPersonAdmin(){
 if(!admin())return;
 const card=$('#p97Stage .p97-playing-card');if(!card||!$('.p97-personhero',card))return;
 const m=currentMember();if(!m)return;
 let box=$('.p166-person-admin',card);if(box&&box.dataset.mid===m.id)return;
 box?.remove();box=document.createElement('div');box.className='p166-person-admin';box.dataset.mid=m.id;box.innerHTML=`<button type="button" data-p166-person="edit">⚙ Editar cadastro</button>${m.protegido?'':(m.status==='egresso'?`<button type="button" class="danger" data-p166-person="purge">Excluir definitivamente</button>`:`<button type="button" class="danger" data-p166-person="disable">Desligar acesso</button>`)}`;card.appendChild(box);
 box.onclick=e=>{const b=e.target.closest('[data-p166-person]');if(!b)return;if(b.dataset.p166Person==='edit'){closeDeck();try{(window.openMember||openMember)?.(m.id)}catch(err){console.warn('P166 editar',err)}}else if(b.dataset.p166Person==='disable'){closeDeck();try{const fn=window.removePersonFromManager||removePersonFromManager;Promise.resolve(fn?.(m.id)).finally(()=>{activeMemberId='';setTimeout(()=>prepareTrack(false),120)})}catch(err){console.warn('P166 desligar',err)}}else if(b.dataset.p166Person==='purge'){closeDeck();try{const fn=window.permanentlyDeleteMember;Promise.resolve(fn?.(m.id)).finally(()=>{activeMemberId='';setTimeout(()=>prepareTrack(false),120)})}catch(err){console.warn('P166 excluir definitivamente',err)}}}
}
function observeDeck(){
 const stage=$('#p97Stage');if(!stage||stage.dataset.p166Observed)return;
 stage.dataset.p166Observed='1';new MutationObserver(()=>requestAnimationFrame(mountPersonAdmin)).observe(stage,{childList:true,subtree:false});mountPersonAdmin()
}

function routeManageButton(){
 const b=$('#managePeopleBtn');if(!b)return false;
 b.textContent='Gerenciar no Acompanhamento';b.title='Cadastros e ajustes da Rede ficam no Acompanhamento';
 b.onclick=e=>{e?.preventDefault?.();switchTrack()};
 const hint=b.parentElement?.querySelector('.hint');if(hint){hint.classList.add('p166-hint');hint.textContent='Cadastros, tipos e linhas ficam juntos no Acompanhamento.'}
 return true
}
function patchManagerFunction(){
 const go=function(){if(!admin())return;switchTrack()};go.__p166Track=true;
 try{window.openPeopleManager=go;openPeopleManager=go}catch(_e){}
}
function prepareTrack(scroll=false){
 if(!trackActive())return;
 const ok=mountAdminPanel();observeDeck();mountPersonAdmin();
 if(ok&&scroll){setTimeout(()=>$('#p166TrackAdmin')?.scrollIntoView({behavior:'smooth',block:'start'}),70);return}
 if(!ok&&retry++<8)setTimeout(()=>prepareTrack(scroll),90)
}
function boot(){
 injectCss();patchManagerFunction();routeManageButton();
 document.addEventListener('click',e=>{const f=e.target.closest?.('[data-p97-member]');if(f){activeMemberId=f.dataset.p97Member||'';requestAnimationFrame(mountPersonAdmin)}},true);
 const mo=new MutationObserver(ms=>{if(ms.some(m=>m.attributeName==='data-view')){routeManageButton();if(trackActive()){retry=0;requestAnimationFrame(()=>prepareTrack(false))}}});mo.observe(document.body,{attributes:true,attributeFilter:['data-view']});
 if(trackActive())prepareTrack(false);setTimeout(()=>{routeManageButton();patchManagerFunction();if(trackActive())prepareTrack(false)},220)
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
