/* Carbonautas P168 · histórico de bolsas por pessoa
   - uma pessoa pode ter vários períodos de bolsa sem duplicar cadastro
   - mantém compatibilidade com os campos antigos bolsista/bolsaModalidade/bolsaInicio/bolsaFim
   - mostra histórico no Acompanhamento e permite gestão pela coordenação
   - não altera regras do Firebase nem VPS
*/
(function(){
'use strict';
if(window.__CARBONAUTAS_P168_BOLSAS)return;
window.__CARBONAUTAS_P168_BOLSAS=true;

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
let editMemberId='', managerMemberId='', editingPeriodId='', folderObserver=null;

function S(){try{return window.state||state||{}}catch(_e){return{}}}
function admin(){try{return !!(window.isAdmin??isAdmin)}catch(_e){return false}}
function member(id){return (S().members||[]).find(m=>m.id===id)||null}
function toastSafe(msg){try{if(typeof toast==='function')toast(msg)}catch(_e){}}
function esc(v){return String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function uid(){return 'bolsa_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8)}
function fmt(d){if(!d)return '—';try{return new Date(String(d)+'T12:00:00').toLocaleDateString('pt-BR')}catch(_e){return String(d)}}
function clean(p){return {id:String(p?.id||uid()),modalidade:String(p?.modalidade||p?.nome||'').trim().slice(0,120),agencia:String(p?.agencia||'').trim().slice(0,120),projeto:String(p?.projeto||'').trim().slice(0,160),inicio:String(p?.inicio||'').slice(0,10),fim:String(p?.fim||'').slice(0,10),status:String(p?.status||'encerrada')==='ativa'?'ativa':'encerrada',observacao:String(p?.observacao||'').trim().slice(0,500)}}
function legacy(m){
 if(!m||(Array.isArray(m.bolsas)&&m.bolsas.length))return null;
 if(!(m.bolsista||m.bolsaModalidade||m.bolsaInicio||m.bolsaFim))return null;
 return clean({id:'legacy_'+String(m.bolsaInicio||'sem-data').replace(/[^0-9]/g,'')+'_'+String(m.bolsaFim||'').replace(/[^0-9]/g,''),modalidade:m.bolsaModalidade||'Bolsa',inicio:m.bolsaInicio||'',fim:m.bolsaFim||'',status:m.bolsista?'ativa':'encerrada',observacao:'Registro anterior do CARBONAUTAS'});
}
function periodsOf(m){
 const list=(Array.isArray(m?.bolsas)?m.bolsas:[]).map(clean);
 const l=legacy(m);if(l)list.push(l);
 const seen=new Set();return list.filter(p=>{const k=[p.id,p.modalidade,p.inicio,p.fim].join('|');if(seen.has(k))return false;seen.add(k);return true}).sort((a,b)=>String(b.inicio||b.fim||'').localeCompare(String(a.inicio||a.fim||'')));
}
function currentOf(list){return [...list].filter(p=>p.status==='ativa').sort((a,b)=>String(b.inicio||'').localeCompare(String(a.inicio||'')))[0]||null}
function latestOf(list){return [...list].sort((a,b)=>String(b.inicio||b.fim||'').localeCompare(String(a.inicio||a.fim||'')))[0]||null}
function stateLabel(p){return p.status==='ativa'?'ATIVA':'ENCERRADA'}

async function persist(mid,list){
 const m=member(mid);if(!m)throw new Error('Pessoa não encontrada');
 const normalized=list.map(clean).sort((a,b)=>String(b.inicio||b.fim||'').localeCompare(String(a.inicio||a.fim||'')));
 const cur=currentOf(normalized),last=latestOf(normalized);
 const patch={bolsas:normalized,bolsista:!!cur,bolsaModalidade:cur?.modalidade||last?.modalidade||'',bolsaInicio:cur?.inicio||last?.inicio||'',bolsaFim:cur?.fim||last?.fim||''};
 if(typeof fbSetMember!=='function')throw new Error('Salvamento indisponível');
 await fbSetMember(mid,patch);Object.assign(m,patch);
 syncLegacyForm(mid,patch);decorateFolders();refreshMemberBox(mid);refreshVisibleCard(mid);
}
function syncLegacyForm(mid,patch){
 if(editMemberId!==mid)return;
 const cb=$('#mBolsista');if(cb)cb.checked=!!patch.bolsista;
 const mod=$('#mBolsaModalidade');if(mod)mod.value=patch.bolsaModalidade||'';
 const ini=$('#mBolsaInicio');if(ini)ini.value=patch.bolsaInicio||'';
 const fim=$('#mBolsaFim');if(fim)fim.value=patch.bolsaFim||'';
 try{if(typeof toggleScholarFields==='function')toggleScholarFields()}catch(_e){}
}

function injectCss(){
 if($('#p168ScholarStyle'))return;const st=document.createElement('style');st.id='p168ScholarStyle';st.textContent=`
.p168-member-box{grid-column:1/-1;border:1px solid #d5e5e2;border-radius:16px;background:linear-gradient(145deg,#f5fbf9,#fff);padding:12px;margin-top:3px}.p168-member-head{display:flex;gap:10px;align-items:center}.p168-member-head>div{flex:1;min-width:0}.p168-member-head b{display:block;color:#173d48;font-size:13px}.p168-member-head small{display:block;color:#74888f;font-size:10px;line-height:1.35;margin-top:3px}.p168-member-head button{min-height:40px;border:1px solid #c9ddda;border-radius:11px;background:#fff;color:#1e5059;font-weight:900;padding:8px 11px}.p168-member-summary{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}.p168-chip{display:inline-flex;align-items:center;border-radius:999px;padding:5px 8px;background:#eaf7f4;color:#217267;font-size:9.5px;font-weight:900}.p168-chip.muted{background:#f1f4f4;color:#708389}
.p168-folder-badge{display:inline-flex;margin-top:5px;width:max-content;max-width:100%;border-radius:999px;padding:4px 7px;background:#eef8f6;color:#287166;font-size:9px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#p168ScholarOverlay[hidden]{display:none!important}#p168ScholarOverlay{position:fixed;inset:0;z-index:2147483200;background:rgba(7,28,37,.52);backdrop-filter:blur(8px);display:grid;place-items:center;padding:14px}.p168-sheet{width:min(720px,100%);max-height:min(88dvh,860px);display:flex;flex-direction:column;background:#f8fbfa;border:1px solid rgba(255,255,255,.85);border-radius:26px;box-shadow:0 30px 90px rgba(0,25,35,.32);overflow:hidden}.p168-head{display:flex;gap:12px;align-items:flex-start;padding:17px 18px;background:#fff;border-bottom:1px solid #dce8e6}.p168-head>div{flex:1}.p168-head span{font-size:9px;font-weight:950;letter-spacing:.12em;color:#168f94}.p168-head h2{margin:3px 0 2px;color:#173944;font-size:24px;line-height:1.05}.p168-head p{margin:0;color:#75888e;font-size:11px}.p168-close{width:44px;height:44px;border:1px solid #d6e3e1;border-radius:13px;background:#fff;color:#24434c;font-size:24px;font-weight:900}.p168-body{padding:14px 16px 20px;overflow:auto}.p168-current{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;border:1px solid #cfe4df;border-radius:16px;background:#eff9f6;padding:12px;margin-bottom:12px}.p168-current b{display:block;color:#17454e;font-size:13px}.p168-current small{display:block;color:#6f858b;font-size:10px;margin-top:3px}.p168-current strong{font-size:10px;color:#11785f;background:#dff3ea;border-radius:999px;padding:6px 9px}.p168-list{display:flex;flex-direction:column;gap:8px}.p168-row{display:grid;grid-template-columns:12px minmax(0,1fr) auto;gap:10px;align-items:start;border:1px solid #dce7e5;border-radius:15px;background:#fff;padding:11px}.p168-dot{width:10px;height:10px;border-radius:50%;margin-top:5px;background:#9aacb0}.p168-row.active .p168-dot{background:#159b78}.p168-row-main b{display:block;color:#173b48;font-size:12.5px}.p168-row-main small{display:block;color:#74888e;font-size:10px;line-height:1.4;margin-top:3px}.p168-row-actions{display:flex;gap:5px}.p168-row-actions button{border:1px solid #d4e2df;border-radius:9px;background:#fff;padding:6px 8px;color:#31535c;font-size:9.5px;font-weight:900}.p168-row-actions .danger{color:#b5485b;border-color:#efd4da}.p168-empty{border:1px dashed #cbdcda;border-radius:15px;background:#fff;padding:22px;text-align:center;color:#74878d;font-size:11px}.p168-new{width:100%;min-height:44px;margin:11px 0 0;border:0;border-radius:12px;background:#168f94;color:#fff;font-weight:900}.p168-form{display:none;margin-top:12px;border:1px solid #d6e5e2;border-radius:17px;background:#fff;padding:12px}.p168-form.open{display:block}.p168-form h3{margin:0 0 10px;color:#1c424c;font-size:13px}.p168-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.p168-grid label{font-size:9px;font-weight:900;color:#70858c;text-transform:uppercase;letter-spacing:.04em}.p168-grid input,.p168-grid select,.p168-grid textarea{display:block;width:100%;box-sizing:border-box;margin-top:5px;border:1px solid #d5e3e1;border-radius:11px;background:#fff;color:#183b47;padding:9px 10px;font:600 12px/1.35 system-ui}.p168-grid .wide{grid-column:1/-1}.p168-form-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.p168-form-actions button{min-height:42px;border-radius:11px;font-weight:900}.p168-cancel{border:1px solid #d4e2df;background:#fff;color:#506970}.p168-save{border:0;background:#168f94;color:#fff}.p168-scholar-card{min-height:100%}.p168-scholar-hero{border:1px solid #cfe4df;border-radius:18px;background:linear-gradient(145deg,#edf9f5,#fff);padding:14px;margin-bottom:11px}.p168-scholar-hero span{font-size:9px;font-weight:950;letter-spacing:.1em;color:#18806d}.p168-scholar-hero h3{margin:5px 0 4px;color:#173b47;font-size:20px}.p168-scholar-hero p{margin:0;color:#70858b;font-size:11px}.p168-timeline{display:flex;flex-direction:column;gap:8px}.p168-time{display:grid;grid-template-columns:12px minmax(0,1fr);gap:9px;border:1px solid #dce7e5;border-radius:14px;background:#fff;padding:10px}.p168-time i{width:10px;height:10px;border-radius:50%;background:#a5b4b7;margin-top:4px}.p168-time.active i{background:#159b78}.p168-time b{display:block;color:#173b47;font-size:12px}.p168-time small{display:block;color:#74878d;font-size:10px;line-height:1.4;margin-top:2px}.p168-card-manage{width:100%;min-height:43px;margin-top:11px;border:0;border-radius:12px;background:#168f94;color:#fff;font-weight:900}
@media(max-width:620px){#p168ScholarOverlay{padding:7px;align-items:stretch}.p168-sheet{width:100%;max-height:calc(100dvh - 14px);border-radius:23px}.p168-head{padding:14px}.p168-head h2{font-size:21px}.p168-body{padding:12px}.p168-grid{grid-template-columns:1fr}.p168-grid .wide{grid-column:auto}.p168-row{grid-template-columns:10px minmax(0,1fr)}.p168-row-actions{grid-column:2;justify-content:flex-start}.p168-member-head{align-items:flex-start;flex-wrap:wrap}.p168-member-head button{width:100%}}
`;
 document.head.appendChild(st)
}

function ensureOverlay(){
 if($('#p168ScholarOverlay'))return $('#p168ScholarOverlay');
 const o=document.createElement('div');o.id='p168ScholarOverlay';o.hidden=true;o.innerHTML=`<section class="p168-sheet" role="dialog" aria-modal="true" aria-labelledby="p168Title"><header class="p168-head"><div><span>BOLSAS E VÍNCULOS</span><h2 id="p168Title">Histórico de bolsas</h2><p id="p168Person"></p></div><button type="button" class="p168-close" aria-label="Fechar">×</button></header><div class="p168-body"><div id="p168Current"></div><div class="p168-list" id="p168List"></div><button type="button" class="p168-new" id="p168New">＋ Adicionar período de bolsa</button><section class="p168-form" id="p168Form"><h3 id="p168FormTitle">Novo período</h3><div class="p168-grid"><label>Modalidade<input id="p168Modalidade" placeholder="Ex.: PIBIC, PIBITI, extensão"></label><label>Agência<input id="p168Agencia" placeholder="Ex.: CNPq, FAPEMAT, CAPES"></label><label class="wide">Projeto / vínculo<input id="p168Projeto" placeholder="Projeto ou atividade associada"></label><label>Início<input id="p168Inicio" type="date"></label><label>Fim<input id="p168Fim" type="date"></label><label>Situação<select id="p168Status"><option value="ativa">Ativa</option><option value="encerrada">Encerrada</option></select></label><label class="wide">Observação<textarea id="p168Obs" rows="3" maxlength="500" placeholder="Ex.: renovação, troca de modalidade, interrupção..."></textarea></label></div><div class="p168-form-actions"><button type="button" class="p168-cancel" id="p168Cancel">Cancelar</button><button type="button" class="p168-save" id="p168Save">Salvar período</button></div></section></div></section>`;
 document.body.appendChild(o);$('.p168-close',o).onclick=closeManager;o.onclick=e=>{if(e.target===o)closeManager()};$('#p168New',o).onclick=()=>startForm();$('#p168Cancel',o).onclick=cancelForm;$('#p168Save',o).onclick=saveForm;return o
}
function closeManager(){const o=$('#p168ScholarOverlay');if(o)o.hidden=true;managerMemberId='';editingPeriodId='';cancelForm()}
function openManager(mid){
 if(!mid)return toastSafe('Salve o aluno primeiro e depois adicione o histórico de bolsas.');
 const m=member(mid);if(!m)return toastSafe('Aluno não encontrado.');managerMemberId=mid;ensureOverlay();$('#p168Person').textContent=m.nome||'';renderManager();$('#p168ScholarOverlay').hidden=false
}
function renderManager(){
 const m=member(managerMemberId);if(!m)return;const list=periodsOf(m),cur=currentOf(list),current=$('#p168Current'),box=$('#p168List');
 current.innerHTML=cur?`<div class="p168-current"><div><b>🎓 ${esc(cur.modalidade||'Bolsa atual')}</b><small>${esc(cur.agencia||'')}${cur.inicio||cur.fim?` · ${fmt(cur.inicio)} → ${fmt(cur.fim)}`:''}</small></div><strong>ATIVA</strong></div>`:`<div class="p168-current"><div><b>Nenhuma bolsa ativa</b><small>O histórico continua guardado abaixo.</small></div><strong>HISTÓRICO</strong></div>`;
 box.innerHTML=list.length?list.map(p=>`<div class="p168-row ${p.status==='ativa'?'active':''}" data-pid="${esc(p.id)}"><i class="p168-dot"></i><div class="p168-row-main"><b>${esc(p.modalidade||'Bolsa')} ${p.agencia?'· '+esc(p.agencia):''}</b><small>${fmt(p.inicio)} → ${fmt(p.fim)} · ${stateLabel(p)}${p.projeto?' · '+esc(p.projeto):''}${p.observacao?' · '+esc(p.observacao):''}</small></div>${admin()?`<div class="p168-row-actions"><button type="button" data-p168-edit="${esc(p.id)}">Editar</button><button type="button" class="danger" data-p168-del="${esc(p.id)}">Excluir</button></div>`:''}</div>`).join(''):'<div class="p168-empty">Nenhum período de bolsa registrado ainda.</div>';
 $('#p168New').style.display=admin()?'block':'none';$$('[data-p168-edit]',box).forEach(b=>b.onclick=()=>startForm(b.dataset.p168Edit));$$('[data-p168-del]',box).forEach(b=>b.onclick=()=>deletePeriod(b.dataset.p168Del))
}
function startForm(pid=''){
 if(!admin())return;const m=member(managerMemberId),list=periodsOf(m),p=pid?list.find(x=>x.id===pid):null;editingPeriodId=pid||'';$('#p168FormTitle').textContent=p?'Editar período':'Novo período';$('#p168Modalidade').value=p?.modalidade||'';$('#p168Agencia').value=p?.agencia||'';$('#p168Projeto').value=p?.projeto||'';$('#p168Inicio').value=p?.inicio||'';$('#p168Fim').value=p?.fim||'';$('#p168Status').value=p?.status||'ativa';$('#p168Obs').value=p?.observacao||'';$('#p168Form').classList.add('open');setTimeout(()=>$('#p168Modalidade')?.focus(),30)
}
function cancelForm(){editingPeriodId='';$('#p168Form')?.classList.remove('open')}
async function saveForm(){
 if(!admin()||!managerMemberId)return;const modalidade=($('#p168Modalidade')?.value||'').trim();if(!modalidade)return toastSafe('Informe a modalidade da bolsa.');const p=clean({id:editingPeriodId||uid(),modalidade,agencia:$('#p168Agencia')?.value||'',projeto:$('#p168Projeto')?.value||'',inicio:$('#p168Inicio')?.value||'',fim:$('#p168Fim')?.value||'',status:$('#p168Status')?.value||'ativa',observacao:$('#p168Obs')?.value||''});let list=periodsOf(member(managerMemberId)).filter(x=>x.id!==p.id);
 if(p.status==='ativa'&&p.inicio)list=list.map(x=>(x.status==='ativa'&&x.fim&&x.fim<p.inicio)?{...x,status:'encerrada'}:x);
 list.push(p);const btn=$('#p168Save');btn.disabled=true;btn.textContent='Salvando…';try{await persist(managerMemberId,list);toastSafe(editingPeriodId?'Período atualizado.':'Período de bolsa adicionado.');cancelForm();renderManager()}catch(e){console.error('P168 bolsa',e);toastSafe('Não foi possível salvar o período de bolsa.')}finally{btn.disabled=false;btn.textContent='Salvar período'}
}
async function deletePeriod(pid){
 if(!admin()||!managerMemberId)return;const m=member(managerMemberId),list=periodsOf(m),p=list.find(x=>x.id===pid);if(!p||!confirm(`Excluir o período ${p.modalidade||'Bolsa'} (${fmt(p.inicio)} → ${fmt(p.fim)})?`))return;try{await persist(managerMemberId,list.filter(x=>x.id!==pid));toastSafe('Período excluído.');renderManager()}catch(e){console.error('P168 excluir bolsa',e);toastSafe('Não foi possível excluir o período.')}
}

function refreshMemberBox(mid=editMemberId){
 const box=$('.p168-member-box');if(!box)return;const m=member(mid),list=m?periodsOf(m):[],cur=currentOf(list),summary=$('.p168-member-summary',box),btn=$('button',box);if(btn){btn.disabled=!mid;btn.textContent=mid?'Gerenciar histórico':'Salve o aluno primeiro'}summary.innerHTML=mid?(list.length?`<span class="p168-chip ${cur?'':'muted'}">${cur?'🎓 Bolsa ativa':'Sem bolsa ativa'}</span><span class="p168-chip muted">${list.length} período${list.length===1?'':'s'}</span>`:'<span class="p168-chip muted">Nenhuma bolsa registrada</span>'):'<span class="p168-chip muted">O histórico fica disponível depois do primeiro salvamento.</span>'
}
function mountMemberBox(mid=editMemberId){
 const ov=$('#memberOverlay');if(!ov)return false;let box=$('.p168-member-box',ov);if(!box){box=document.createElement('section');box.className='p168-member-box';box.innerHTML='<div class="p168-member-head"><div><b>🎓 Histórico de bolsas</b><small>Uma pessoa pode ter vários períodos de bolsa sem criar outro cadastro.</small></div><button type="button">Gerenciar histórico</button></div><div class="p168-member-summary"></div>';const fields=$$('.bolsa-field',ov),anchor=fields[fields.length-1]||$('#mBolsista')?.closest('.fg');if(anchor)anchor.insertAdjacentElement('afterend',box);else $('.modal-b',ov)?.appendChild(box);$('button',box).onclick=()=>openManager(editMemberId)}refreshMemberBox(mid);return true
}
function patchOpenMember(){
 let fn=null;try{fn=window.openMember||openMember}catch(_e){}if(typeof fn!=='function'||fn.__p168Scholar)return false;const wrapped=function(id){editMemberId=id||'';const r=fn.apply(this,arguments);requestAnimationFrame(()=>mountMemberBox(editMemberId));return r};wrapped.__p168Scholar=true;wrapped.__p168Original=fn;try{openMember=wrapped}catch(_e){}window.openMember=wrapped;return true
}

function scholarshipCard(m){
 const list=periodsOf(m),cur=currentOf(list),rows=list.map(p=>`<div class="p168-time ${p.status==='ativa'?'active':''}"><i></i><div><b>${esc(p.modalidade||'Bolsa')} ${p.agencia?'· '+esc(p.agencia):''}</b><small>${fmt(p.inicio)} → ${fmt(p.fim)} · ${stateLabel(p)}${p.projeto?' · '+esc(p.projeto):''}</small></div></div>`).join('');
 return {title:'Bolsas e vínculos',kicker:'BOLSAS',__p168:true,html:`<div class="p168-scholar-card" data-mid="${esc(m.id)}"><div class="p97-card-kicker">🎓 BOLSAS E VÍNCULOS</div><div class="p97-card-title">Histórico de bolsas</div><div class="p168-scholar-hero"><span>${cur?'BOLSA ATUAL':'HISTÓRICO'}</span><h3>${esc(cur?.modalidade||'Nenhuma bolsa ativa')}</h3><p>${cur?`${esc(cur.agencia||'')}${cur.inicio||cur.fim?` · ${fmt(cur.inicio)} → ${fmt(cur.fim)}`:''}`:`${list.length} período${list.length===1?'':'s'} registrado${list.length===1?'':'s'}`}</p></div>${rows?`<div class="p168-timeline">${rows}</div>`:'<div class="p168-empty">Nenhum período de bolsa registrado para esta pessoa.</div>'}${admin()?`<button type="button" class="p168-card-manage" data-p168-manage="${esc(m.id)}">Gerenciar bolsas</button>`:''}</div>`}
}
function patchBuildCards(){
 let fn=null;try{fn=window.buildDeckCards||buildDeckCards}catch(_e){}if(typeof fn!=='function'||fn.__p168Scholar)return false;const wrapped=function(m){const cards=fn.apply(this,arguments)||[];if(!cards.some(c=>c&&c.__p168)){cards.splice(Math.min(1,cards.length),0,scholarshipCard(m))}return cards};wrapped.__p168Scholar=true;wrapped.__p168Original=fn;try{buildDeckCards=wrapped}catch(_e){}window.buildDeckCards=wrapped;return true
}
function refreshVisibleCard(mid){const wrap=$(`.p168-scholar-card[data-mid="${CSS.escape(mid)}"]`);if(!wrap)return;const m=member(mid);if(!m)return;const tmp=document.createElement('div');tmp.innerHTML=scholarshipCard(m).html;wrap.replaceWith(tmp.firstElementChild)}

function decorateFolders(){
 $$('#p97FolderGrid .p97-folder').forEach(card=>{const m=member(card.dataset.p97Member);if(!m)return;const list=periodsOf(m),cur=currentOf(list),main=$('.p97-folder-main',card);if(!main)return;let badge=$('.p168-folder-badge',main);if(!list.length){badge?.remove();return}if(!badge){badge=document.createElement('span');badge.className='p168-folder-badge';main.appendChild(badge)}badge.textContent=cur?`🎓 Bolsista atual · ${list.length} período${list.length===1?'':'s'}`:`🎓 ${list.length} período${list.length===1?'':'s'} de bolsa`})
}
function observeFolders(){const grid=$('#p97FolderGrid');if(!grid||grid===folderObserver?.__grid)return false;if(folderObserver)folderObserver.disconnect();folderObserver=new MutationObserver(()=>requestAnimationFrame(decorateFolders));folderObserver.__grid=grid;folderObserver.observe(grid,{childList:true});decorateFolders();return true}

function boot(){
 injectCss();ensureOverlay();patchOpenMember();patchBuildCards();observeFolders();
 document.addEventListener('click',e=>{const b=e.target.closest?.('[data-p168-manage]');if(b){e.preventDefault();e.stopPropagation();openManager(b.dataset.p168Manage);return}const f=e.target.closest?.('[data-p97-member]');if(f)setTimeout(decorateFolders,0)},true);
 const mo=new MutationObserver(ms=>{if(ms.some(m=>m.attributeName==='data-view')&&document.body.dataset.view==='track')requestAnimationFrame(()=>{patchBuildCards();observeFolders();decorateFolders()})});mo.observe(document.body,{attributes:true,attributeFilter:['data-view']});
 setTimeout(()=>{patchOpenMember();patchBuildCards();observeFolders();if(editMemberId)mountMemberBox(editMemberId)},220)
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
