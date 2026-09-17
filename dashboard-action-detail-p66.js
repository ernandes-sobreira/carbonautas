/* Carbonautas P66 · Painel: abrir direto no problema, sem cair no formulário de edição */
(function(){
'use strict';
const VERSION='P66';
const BUILD='20260917';
let originalP56OpenItem=null;

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function byId(id){try{return (state.activities||[]).find(a=>a.id===id)||null}catch(_e){return null}}
function memberName(id,fallback=''){try{return memberById(id)?.nome||fallback||'Carbonauta'}catch(_e){return fallback||'Carbonauta'}}
function fmtDateSafe(v){try{return typeof fmtDate==='function'?fmtDate(v):String(v||'')}catch(_e){return String(v||'')}}
function statusLabel(a){try{return ACTIVITY_STATUS?.[a?.status]||a?.status||'—'}catch(_e){return a?.status||'—'}}
function typeLabel(a){try{return ACTIVITY_TYPES?.[a?.type]||a?.type||'Acompanhamento'}catch(_e){return a?.type||'Acompanhamento'}}
function isDone(a){try{return typeof _activityDone==='function'?_activityDone(a):['concluido','aprovado'].includes(a?.status)}catch(_e){return false}}
function canManage(a){try{return !!(isAdmin||isMe(a.ownerId))}catch(_e){return false}}
function firstName(n=''){return String(n).trim().split(/\s+/)[0]||'Carbonauta'}

function injectUi(){
  if(document.getElementById('p66Style'))return;
  const st=document.createElement('style');st.id='p66Style';st.textContent=`
  #p66ActionOverlay{position:fixed;inset:0;z-index:2147483645;display:none;align-items:center;justify-content:center;padding:22px;background:rgba(5,20,30,.72);backdrop-filter:blur(4px)}
  #p66ActionOverlay.open{display:flex}.p66-card{width:min(760px,96vw);max-height:min(88vh,860px);overflow:auto;background:#fff;border-radius:24px;box-shadow:0 30px 100px rgba(5,24,35,.34);border:1px solid #dce7ea}
  .p66-head{display:flex;gap:14px;align-items:flex-start;padding:22px 24px 16px;border-bottom:1px solid #e7eef0}.p66-head-main{flex:1;min-width:0}.p66-eyebrow{font-size:11px;font-weight:900;letter-spacing:.09em;text-transform:uppercase;color:#0e7781}.p66-title{margin:5px 0 0;font-size:25px;line-height:1.12;color:#132e39}.p66-close{border:0;background:#f2f6f7;width:38px;height:38px;border-radius:12px;font-size:21px;color:#35515b}
  .p66-body{padding:20px 24px 8px}.p66-person{display:flex;align-items:center;gap:10px;margin-bottom:14px}.p66-avatar{width:38px;height:38px;border-radius:12px;background:#e8f4f4;display:grid;place-items:center;font-weight:900;color:#176d76}.p66-person b{font-size:15px;color:#17313c}.p66-person span{display:block;font-size:11px;color:#71858d;margin-top:2px}
  .p66-tags{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:16px}.p66-tag{padding:5px 9px;border-radius:999px;background:#eef5f6;color:#35515b;font-size:10px;font-weight:850}.p66-tag.due{background:#fff1e7;color:#a75800}.p66-tag.bad{background:#fff0f2;color:#b4233d}
  .p66-problem{border:1px solid #d6e5e8;border-left:5px solid #0f8e98;border-radius:16px;padding:16px 17px;background:#f9fcfc}.p66-problem-label{font-size:10px;font-weight:950;letter-spacing:.08em;text-transform:uppercase;color:#0e7781;margin-bottom:6px}.p66-problem-title{font-size:18px;font-weight:900;line-height:1.28;color:#15313b;margin-bottom:10px}.p66-problem-text{font-size:14px;line-height:1.55;color:#3f5660;white-space:pre-wrap}.p66-problem-text.empty{color:#87979d;font-style:italic}
  .p66-progress{margin-top:14px}.p66-progress-top{display:flex;justify-content:space-between;gap:10px;font-size:11px;font-weight:800;color:#587079;margin-bottom:6px}.p66-progress-bar{height:8px;border-radius:999px;background:#e8eff1;overflow:hidden}.p66-progress-bar>span{display:block;height:100%;background:#168c98;border-radius:inherit}
  .p66-foot{display:flex;gap:9px;justify-content:flex-end;flex-wrap:wrap;padding:16px 24px 22px}.p66-foot .btn{min-height:42px}.p66-primary{background:#0e5c63!important;border-color:#0e5c63!important;color:#fff!important}.p66-complete{background:#effaf4!important;border-color:#bfe6ce!important;color:#167447!important}.p66-edit{margin-right:auto}
  @media(max-width:650px){#p66ActionOverlay{padding:10px;align-items:flex-end}.p66-card{width:100%;max-height:92vh;border-radius:22px 22px 0 0}.p66-head,.p66-body{padding-left:17px;padding-right:17px}.p66-foot{padding:14px 17px 18px;display:grid;grid-template-columns:1fr 1fr}.p66-edit{margin-right:0}.p66-foot .btn{justify-content:center}.p66-primary{grid-column:1/-1}}
  `;document.head.appendChild(st);
  const ov=document.createElement('div');ov.id='p66ActionOverlay';ov.innerHTML=`<div class="p66-card" role="dialog" aria-modal="true" aria-labelledby="p66Title"><div class="p66-head"><div class="p66-head-main"><div class="p66-eyebrow">Ação do painel</div><h2 class="p66-title" id="p66Title">O que precisa ser feito</h2></div><button type="button" class="p66-close" id="p66Close" aria-label="Fechar">×</button></div><div class="p66-body" id="p66Body"></div><div class="p66-foot" id="p66Foot"></div></div>`;document.body.appendChild(ov);
  document.getElementById('p66Close').onclick=closeDetail;
  ov.addEventListener('click',e=>{if(e.target===ov)closeDetail()});
}
function closeDetail(){document.getElementById('p66ActionOverlay')?.classList.remove('open')}

function dueMeta(a){
  if(!a?.dueDate)return {text:'Sem prazo definido',cls:''};
  try{const di=typeof dateInfo==='function'?dateInfo(a.dueDate):null;if(di?.over)return{text:`Atrasado · venceu em ${fmtDateSafe(a.dueDate)}`,cls:'bad'};if(di&&di.diff===0)return{text:`Vence hoje · ${fmtDateSafe(a.dueDate)}`,cls:'bad'};if(di&&di.diff>0)return{text:`Vence em ${di.diff} dia(s) · ${fmtDateSafe(a.dueDate)}`,cls:di.diff<=2?'bad':'due'};}catch(_e){}
  return {text:`Prazo · ${fmtDateSafe(a.dueDate)}`,cls:'due'};
}
function contextType(a){if(a?.type==='correcao')return'correction';if(a?.type==='orientacao')return'orientation';return'deadline'}
function contextLabel(a){if(a?.type==='correcao')return'CORREÇÃO';if(a?.type==='orientacao')return'ORIENTAÇÃO';return'PRAZO'}

function openActivityDetail(id){
  injectUi();const a=byId(id);if(!a){try{toast('Este item não foi encontrado.')}catch(_e){}return}
  const owner=memberName(a.ownerId,a.ownerName),due=dueMeta(a),progress=Math.max(0,Math.min(100,Number(a.progress||0))),done=isDone(a),can=canManage(a),me=(typeof myId!=='undefined'?myId:'');
  document.getElementById('p66Title').textContent=done?'Item concluído':'O que precisa ser feito';
  document.getElementById('p66Body').innerHTML=`
    <div class="p66-person"><div class="p66-avatar">${esc(firstName(owner).slice(0,1).toUpperCase())}</div><div><b>${esc(owner)}</b><span>${esc(typeLabel(a))}</span></div></div>
    <div class="p66-tags"><span class="p66-tag">${esc(statusLabel(a))}</span>${a.startDate?`<span class="p66-tag">Início · ${esc(fmtDateSafe(a.startDate))}</span>`:''}<span class="p66-tag ${due.cls}">${esc(due.text)}</span></div>
    <div class="p66-problem"><div class="p66-problem-label">O problema / próximo passo</div><div class="p66-problem-title">${esc(a.title||typeLabel(a))}</div><div class="p66-problem-text ${a.description?'':'empty'}">${esc(a.description||'Este acompanhamento ainda não tem uma observação detalhada.')}</div></div>
    <div class="p66-progress"><div class="p66-progress-top"><span>Andamento informado</span><b>${progress}%</b></div><div class="p66-progress-bar"><span style="width:${progress}%"></span></div></div>`;
  const foot=document.getElementById('p66Foot');foot.innerHTML='';
  if(can){const edit=document.createElement('button');edit.type='button';edit.className='btn p66-edit';edit.textContent='✏️ Editar';edit.onclick=()=>{closeDetail();if(typeof editActivity==='function')editActivity(a.id)};foot.appendChild(edit)}
  if(!done&&can){const complete=document.createElement('button');complete.type='button';complete.className='btn p66-complete';complete.textContent='✓ Concluir';complete.onclick=()=>{closeDetail();if(typeof window.p56CompleteActivity==='function')window.p56CompleteActivity(a.id)};foot.appendChild(complete)}
  if(a.ownerId&&a.ownerId!==me&&typeof window.openPrivateChatWithContext==='function'){
    const chat=document.createElement('button');chat.type='button';chat.className='btn p66-primary';chat.textContent=`💬 Conversar com ${firstName(owner)}`;chat.onclick=()=>{closeDetail();window.openPrivateChatWithContext(a.ownerId,{type:contextType(a),label:contextLabel(a),title:a.title||typeLabel(a),eventLabel:a.dueDate?`Vence em ${fmtDateSafe(a.dueDate)}`:`Acompanhamento de ${owner}`,sourceId:`activity_${a.id}`})};foot.appendChild(chat)
  }
  const close=document.createElement('button');close.type='button';close.className='btn';close.textContent='Fechar';close.onclick=closeDetail;foot.appendChild(close);
  document.getElementById('p66ActionOverlay').classList.add('open');
}

function p66OpenItem(key){
  const k=String(key||'');
  if(k.startsWith('activity:')){openActivityDetail(k.slice('activity:'.length));return}
  if(typeof originalP56OpenItem==='function')return originalP56OpenItem(key);
}
function install(){
  injectUi();
  if(typeof window.p56OpenItem==='function'&&window.p56OpenItem!==p66OpenItem)originalP56OpenItem=window.p56OpenItem;
  window.p66OpenActivityDetail=openActivityDetail;
  window.p56OpenItem=p66OpenItem;
  console.info('Carbonautas',VERSION,BUILD,'painel abre direto no problema');
}
function boot(){install();setTimeout(install,900)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();