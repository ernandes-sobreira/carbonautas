/* Carbonautas P52 · fluxo de correção legível: quem fez o quê e com quem está */
(function(){
'use strict';
const VERSION='P52';
function esc52(v=''){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function personById(id){try{return typeof memberById==='function'?memberById(id):null}catch(e){return null}}
function versionCount(p){
  try{
    const tid=p?.reviewThreadId||p?.id;
    if(typeof reviewThreadItems==='function')return reviewThreadItems(tid).length;
    if(typeof state!=='undefined'&&Array.isArray(state.publicacoes))return state.publicacoes.filter(x=>x.reviewFlow&&(x.reviewThreadId||x.id)===tid).length;
  }catch(e){}
  return Number(p?.reviewVersion||1)||1;
}
function nameOf(p,id,fallback=''){const m=personById(id);return m?.nome||fallback||''}
function flowHTML(p){
  if(!p?.reviewFlow)return '';
  const v=Number(p.reviewVersion||1)||1;
  const author=nameOf(p,p.memberId,p.memberNome||'Autor do arquivo')||'Autor do arquivo';
  const reviewer=nameOf(p,p.reviewReviewerId,'Revisor')||'Revisor';
  const next=nameOf(p,p.reviewNextRecipientId,'');
  const vc=versionCount(p);
  let now='',last='',tone='review';
  if(p.reviewStatus==='correcao_devolvida'){
    tone='adjust';
    now=next?`${next} está com a versão ${v} para ajustar`:`A versão ${v} voltou para ajustes`;
    last=`${reviewer} devolveu a correção`;
  }else if(p.reviewStatus==='nova_versao'){
    tone='review';
    now=next?`${next} está com a versão ${v} para revisar`:`Versão ${v} enviada para revisão`;
    last=`${author} enviou a versão ${v}`;
  }else{
    tone='review';
    now=next?`${next} está com a versão ${v} para revisar`:`Aguardando revisão da versão ${v}`;
    last=`${author} enviou o arquivo para correção`;
  }
  const reviewerExtra=reviewer&&next&&reviewer!==next?`<span>👤 Revisor responsável: <b>${esc52(reviewer)}</b></span>`:'';
  return `<div class="p52-review-flow ${tone}">
    <div class="p52-now"><span class="p52-label">AGORA</span><b>${esc52(now)}</b></div>
    <div class="p52-last"><span>↳ Última ação: <b>${esc52(last)}</b></span><span>🗂 ${vc} ${vc===1?'versão':'versões'} no histórico</span>${reviewerExtra}</div>
  </div>`;
}
function injectCss(){
  if(document.getElementById('p52ReviewStyle'))return;
  const st=document.createElement('style');st.id='p52ReviewStyle';st.textContent=`
  .p52-review-flow{margin:8px 0 5px;border:1px solid #d9e5e8;border-left:4px solid #1e88c7;border-radius:12px;background:#f8fbfc;padding:9px 11px;max-width:760px}
  .p52-review-flow.adjust{border-left-color:#e0912e;background:#fffaf1}.p52-now{display:flex;align-items:center;gap:8px;flex-wrap:wrap;color:#18323d}.p52-now>b{font-size:12.5px;line-height:1.35}.p52-label{font-size:9px;font-weight:900;letter-spacing:.08em;background:#0e5c63;color:#fff;border-radius:999px;padding:4px 7px}.p52-review-flow.adjust .p52-label{background:#b87316}.p52-last{display:flex;gap:10px 16px;flex-wrap:wrap;margin-top:5px;color:#6b7e85;font-size:10.5px;line-height:1.35}.p52-last b{color:#344e58}.review-note{margin-top:5px!important;color:#708188!important;font-size:10.5px!important;padding-left:0!important}.review-note:before{content:'Observação · ';font-weight:800;color:#566b73}
  @media(max-width:700px){.p52-review-flow{padding:8px 9px}.p52-now>b{font-size:12px}.p52-last{display:grid;gap:3px}}
  `;document.head.appendChild(st);
}
function install(){
  injectCss();
  try{window.reviewBadgeHTML=flowHTML}catch(e){console.warn('P52 review override',e)}
  try{reviewBadgeHTML=flowHTML}catch(e){}
  setTimeout(()=>{try{if(document.body.dataset.view==='pubs'&&typeof renderPubs==='function')renderPubs()}catch(e){}},250);
  console.info('Carbonautas fluxo de correção',VERSION,'carregado');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
