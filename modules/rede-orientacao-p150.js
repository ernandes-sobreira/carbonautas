/* Carbonautas P150 · orientação explícita e registro no dossiê
   Camada isolada: não altera o núcleo da Rede. Usa os vínculos e atividades já existentes. */
(function(){
'use strict';
if(window.__CARBONAUTAS_P150_ORIENTACAO)return;
window.__CARBONAUTAS_P150_ORIENTACAO=true;

const $=(s,r=document)=>r.querySelector(s);
const today=()=>{
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
function getState(){try{return window.state||state||{}}catch(_e){return{}}}
function getMyId(){try{return window.myId||myId||''}catch(_e){return''}}
function getSelectedId(){try{return selectedId||''}catch(_e){return''}}
function isCoordinator(){try{return !!isAdmin}catch(_e){return false}}
function member(id){
  try{return typeof memberById==='function'?memberById(id):(getState().members||[]).find(m=>m.id===id)}catch(_e){return null}
}
function toastSafe(msg){try{if(typeof toast==='function')toast(msg)}catch(_e){}}
function orientationActivities(memberId){
  return (getState().activities||[]).filter(a=>
    (a.ownerId===memberId||a.memberId===memberId) && String(a.type||'').toLowerCase().includes('orient')
  );
}
function hasOrientationRelation(studentId,advisorId){
  const student=member(studentId),advisor=member(advisorId);
  const match=v=>v&&v.id && String(v.motivo||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes('orient');
  return !!(
    (student?.vinculos||[]).some(v=>v.id===advisorId&&match(v)) ||
    (advisor?.vinculos||[]).some(v=>v.id===studentId&&match(v))
  );
}
async function ensureOrientationRelation(studentId){
  const advisorId=getMyId();
  if(!studentId||!advisorId||studentId===advisorId)return false;
  if(hasOrientationRelation(studentId,advisorId))return true;
  const student=member(studentId),advisor=member(advisorId);
  if(!student||!advisor)throw new Error('Pessoa não encontrada');
  const current=Array.isArray(student.vinculos)?student.vinculos.map(v=>({...v})):[];
  current.push({
    id:advisorId,
    tipo:'orientacao',
    papel:'orientando',
    orientadorId:advisorId,
    motivo:`Orientação · orientador: ${advisor.nome||'Coordenação'}`
  });
  if(typeof fbSetMember!=='function')throw new Error('Função de gravação indisponível');
  await fbSetMember(studentId,{vinculos:current});
  student.vinculos=current;
  return true;
}
function buildSection(studentId){
  const box=document.createElement('div');
  box.className='dsec p150-orientacao-card';
  box.dataset.memberId=studentId;
  box.innerHTML=`
    <div class="lab">Orientação</div>
    <div class="p150-status"></div>
    <div class="p150-actions">
      <button type="button" class="btn p150-link-btn"></button>
      <button type="button" class="btn primary p150-log-btn">+ Registrar orientação</button>
    </div>`;
  const linkBtn=$('.p150-link-btn',box),logBtn=$('.p150-log-btn',box);
  linkBtn.addEventListener('click',async()=>{
    if(!isCoordinator())return toastSafe('Só a coordenação pode definir este vínculo.');
    linkBtn.disabled=true;
    try{
      await ensureOrientationRelation(studentId);
      toastSafe('Vínculo de orientação salvo.');
      decorateDetail();
      try{if(typeof renderAll==='function')renderAll()}catch(_e){}
    }catch(e){console.error('P150 orientação',e);toastSafe('Não foi possível salvar o vínculo de orientação.');}
    finally{linkBtn.disabled=false;}
  });
  logBtn.addEventListener('click',()=>openOrientationModal(studentId));
  return box;
}
function refreshSection(box,studentId){
  const advisorId=getMyId(),student=member(studentId),advisor=member(advisorId);
  const linked=hasOrientationRelation(studentId,advisorId);
  const n=orientationActivities(studentId).length;
  const status=$('.p150-status',box),linkBtn=$('.p150-link-btn',box),logBtn=$('.p150-log-btn',box);
  if(status){
    status.innerHTML='';
    const strong=document.createElement('strong');
    strong.textContent=linked?`${advisor?.nome||'Você'} orienta ${student?.nome||'esta pessoa'}`:'Orientação ainda não definida';
    const small=document.createElement('small');
    small.textContent=n?`${n} registro${n===1?'':'s'} de orientação no dossiê`:'Nenhuma orientação registrada no dossiê';
    status.append(strong,small);
  }
  if(linkBtn){
    linkBtn.textContent=linked?'✓ Vínculo definido':'Marcar como meu orientando';
    linkBtn.disabled=linked||!isCoordinator();
  }
  if(logBtn)logBtn.style.display=isCoordinator()?'':'none';
}
function decorateDetail(){
  const inner=$('#detailInner');
  const studentId=getSelectedId();
  if(!inner||!studentId)return;
  let box=$('.p150-orientacao-card',inner);
  if(box&&box.dataset.memberId!==studentId){box.remove();box=null;}
  if(!box){
    box=buildSection(studentId);
    const sections=Array.from(inner.querySelectorAll('.dsec'));
    const repo=sections.find(s=>($('.lab',s)?.textContent||'').trim().toLowerCase()==='repositório individual');
    if(repo)repo.insertAdjacentElement('beforebegin',box);
    else inner.appendChild(box);
  }
  refreshSection(box,studentId);
}
function ensureModal(){
  if($('#p150OrientationOverlay'))return;
  const overlay=document.createElement('div');
  overlay.id='p150OrientationOverlay';
  overlay.hidden=true;
  overlay.innerHTML=`
    <section class="p150-sheet" role="dialog" aria-modal="true" aria-labelledby="p150Title">
      <div class="p150-head">
        <div><span>ORIENTAÇÃO</span><h3 id="p150Title">Registrar orientação</h3><p id="p150Person"></p></div>
        <button type="button" class="p150-close" aria-label="Fechar">×</button>
      </div>
      <label>Data<input id="p150Date" type="date"></label>
      <label>O que foi orientado?<textarea id="p150Note" rows="5" maxlength="1000" placeholder="Ex.: Revisamos os resultados, combinamos corrigir a discussão e enviar nova versão até sexta-feira."></textarea></label>
      <button type="button" id="p150Save" class="p150-save">Salvar no dossiê</button>
    </section>`;
  document.body.appendChild(overlay);
  $('.p150-close',overlay).addEventListener('click',closeOrientationModal);
  overlay.addEventListener('click',e=>{if(e.target===overlay)closeOrientationModal();});
  $('#p150Save',overlay).addEventListener('click',saveOrientation);
}
let modalStudentId='';
function openOrientationModal(studentId){
  if(!isCoordinator())return toastSafe('Só a coordenação pode registrar orientação.');
  ensureModal();
  modalStudentId=studentId;
  const m=member(studentId);
  $('#p150Person').textContent=m?.nome||'';
  $('#p150Date').value=today();
  $('#p150Note').value='';
  $('#p150OrientationOverlay').hidden=false;
  setTimeout(()=>$('#p150Note')?.focus(),50);
}
function closeOrientationModal(){const ov=$('#p150OrientationOverlay');if(ov)ov.hidden=true;modalStudentId='';}
async function saveOrientation(){
  const studentId=modalStudentId,date=$('#p150Date')?.value||today(),note=($('#p150Note')?.value||'').trim();
  const student=member(studentId),advisorId=getMyId(),advisor=member(advisorId);
  if(!studentId||!student)return;
  if(!note)return toastSafe('Escreva rapidamente o que foi orientado.');
  const btn=$('#p150Save');if(btn){btn.disabled=true;btn.textContent='Salvando…';}
  try{
    await ensureOrientationRelation(studentId);
    const f=typeof FB==='function'?FB():null;
    if(!f)throw new Error('Firebase indisponível');
    const ownerUid=(getState().users||[]).find(u=>u.memberId===studentId)?.uid||'';
    await f.addDoc(f.collection(window.db,'rede_activities'),{
      ownerId:studentId,
      ownerUid,
      ownerName:student.nome||'',
      type:'orientacao',
      status:'concluido',
      title:`Orientação · ${student.nome||'Carbonauta'}`,
      description:note,
      startDate:date,
      dueDate:date,
      progress:100,
      orientadorId:advisorId,
      orientadorName:advisor?.nome||'',
      updatedAt:f.serverTimestamp(),
      createdAt:f.serverTimestamp()
    });
    toastSafe('Orientação registrada no dossiê.');
    closeOrientationModal();
    setTimeout(()=>decorateDetail(),250);
  }catch(e){console.error('P150 registro de orientação',e);toastSafe('Não foi possível registrar a orientação.');}
  finally{if(btn){btn.disabled=false;btn.textContent='Salvar no dossiê';}}
}
function addCss(){
  if($('#p150OrientacaoStyle'))return;
  const style=document.createElement('style');
  style.id='p150OrientacaoStyle';
  style.textContent=`
  .p150-orientacao-card{background:linear-gradient(135deg,#f4fbfa,#f8fbff)}
  .p150-status{display:flex;flex-direction:column;gap:3px;margin:7px 0 10px}.p150-status strong{font-size:14px;color:#183b48}.p150-status small{font-size:11px;color:#71858c}
  .p150-actions{display:flex;gap:8px;flex-wrap:wrap}.p150-actions .btn{min-height:39px}
  #p150OrientationOverlay[hidden]{display:none!important}#p150OrientationOverlay{position:fixed;inset:0;z-index:2147483600;background:rgba(10,29,38,.46);backdrop-filter:blur(5px);display:grid;place-items:end center}
  .p150-sheet{width:min(560px,100%);background:#fbfefd;border:1px solid #d5e6e3;border-radius:26px 26px 0 0;padding:17px 17px calc(20px + env(safe-area-inset-bottom));box-shadow:0 -18px 50px rgba(8,35,44,.2)}
  .p150-head{display:flex;gap:12px;align-items:flex-start;margin-bottom:14px}.p150-head>div{flex:1}.p150-head span{font-size:10px;letter-spacing:.12em;font-weight:900;color:#168f94}.p150-head h3{margin:3px 0 2px;font:850 22px/1.1 system-ui;color:#173946}.p150-head p{margin:0;color:#6f858c;font-size:13px}.p150-close{border:0;background:#edf5f3;border-radius:13px;width:42px;height:42px;font-size:24px;color:#183b48}
  .p150-sheet label{display:block;font-size:11px;font-weight:850;color:#617780;text-transform:uppercase;letter-spacing:.04em;margin-top:11px}.p150-sheet input,.p150-sheet textarea{display:block;width:100%;margin-top:6px;border:1px solid #d6e4e2;border-radius:14px;background:#fff;color:#183b48;padding:11px 12px;font:500 14px/1.4 system-ui;box-sizing:border-box;outline:0}.p150-sheet textarea{resize:vertical;min-height:120px}.p150-sheet input:focus,.p150-sheet textarea:focus{border-color:#168f94;box-shadow:0 0 0 3px rgba(22,143,148,.10)}
  .p150-save{width:100%;min-height:48px;margin-top:14px;border:0;border-radius:14px;background:#168f94;color:white;font-weight:850;font-size:15px}.p150-save:disabled{opacity:.65}
  @media(max-width:620px){.p150-actions{display:grid;grid-template-columns:1fr}.p150-actions .btn{width:100%}.p150-sheet{padding:15px 15px calc(18px + env(safe-area-inset-bottom))}.p150-head h3{font-size:20px}}
  `;
  document.head.appendChild(style);
}
function boot(){
  addCss();ensureModal();
  const inner=$('#detailInner');
  if(inner)new MutationObserver(()=>requestAnimationFrame(()=>decorateDetail())).observe(inner,{childList:true,subtree:false});
  document.addEventListener('click',()=>setTimeout(decorateDetail,40),true);
  setTimeout(decorateDetail,200);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
