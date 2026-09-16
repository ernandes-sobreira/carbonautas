/* Carbonautas P55 · barra de ações uniforme no Repositório */
(function(){
'use strict';
const VERSION='P55';

function txt55(el){return String(el?.textContent||'').replace(/\s+/g,' ').trim()}
function norm55(v=''){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim()}
function setAction55(btn,type,label){
  btn.classList.remove('p55-view','p55-download','p55-edit','p55-chat','p55-return','p55-other');
  btn.classList.add('p55-action',`p55-${type}`);
  btn.textContent=label;
}
function classify55(btn){
  if(!btn||btn.classList.contains('mini-x'))return;
  const raw=txt55(btn),t=norm55(raw),title=norm55(btn.getAttribute('title')||'');
  const box=btn.closest('.pub-act,.repo-actions,.review-version-actions');
  const boxText=norm55(box?.textContent||'');

  if(title.includes('visualizar')||t==='ver'||t.includes('visualizar')||t.includes('👁')){
    setAction55(btn,'view','👁 Visualizar');return;
  }
  if(title.includes('baixar')||t.includes('baixar')){
    setAction55(btn,'download','↓ Baixar');return;
  }
  if(btn.classList.contains('repo-room-btn')||t.includes('conversa do arquivo')||t.includes('conversa da correcao')||t==='conversa'){
    setAction55(btn,'chat','💬 Conversa');return;
  }
  if(btn.classList.contains('review-action')||t.includes('devolver correcao')||t.includes('devolver correção')||t==='devolver'){
    setAction55(btn,'return','↩ Devolver');return;
  }
  const penOnly = raw.length<=6 && /[✏✎🖊🖋📝✍🧪]/u.test(raw);
  if(btn.classList.contains('office-edit-btn')||t.includes('corrigir online')||t.includes('corrigir')||t.includes('editar')||penOnly){
    const isReview=boxText.includes('devolver')||boxText.includes('correcao')||boxText.includes('correção');
    setAction55(btn,'edit',isReview||t.includes('corrigir')?'✎ Corrigir':'✎ Editar');return;
  }
  // Qualquer outro comando funcional ganha o mesmo tamanho, sem alterar seu texto.
  btn.classList.add('p55-action','p55-other');
}

function standardize55(){
  document.querySelectorAll('.pub-act,.repo-actions').forEach(box=>{
    box.classList.add('p55-actions-grid');
    box.querySelectorAll('button').forEach(classify55);
    box.querySelectorAll('.mini-x').forEach(x=>{x.classList.add('p55-close');x.title=x.title||'Remover';});
  });
  document.querySelectorAll('.review-version-actions button').forEach(classify55);
}

function css55(){
  if(document.getElementById('p55ActionsStyle'))return;
  const s=document.createElement('style');s.id='p55ActionsStyle';s.textContent=`
  /* P55: todos os comandos do cartão ocupam células iguais */
  .pub-act.p55-actions-grid,.repo-actions.p55-actions-grid{
    display:grid!important;
    grid-template-columns:repeat(2,154px)!important;
    grid-auto-rows:44px!important;
    gap:8px!important;
    width:316px!important;
    min-width:316px!important;
    max-width:316px!important;
    align-items:stretch!important;
    align-content:start!important;
    justify-content:end!important;
  }
  .p55-actions-grid button:not(.mini-x){
    width:154px!important;min-width:154px!important;max-width:154px!important;
    height:44px!important;min-height:44px!important;max-height:44px!important;
    padding:0 10px!important;margin:0!important;border-radius:10px!important;
    display:inline-flex!important;align-items:center!important;justify-content:center!important;
    gap:6px!important;font-size:12px!important;font-weight:800!important;line-height:1!important;
    white-space:nowrap!important;box-sizing:border-box!important;box-shadow:none!important;
  }
  .p55-actions-grid .p55-view,.p55-actions-grid .p55-download,.p55-actions-grid .p55-chat,.p55-actions-grid .p55-other{
    background:#fff!important;color:#17313d!important;border:1px solid #cbdade!important;
  }
  .p55-actions-grid .p55-edit{background:#168c98!important;color:#fff!important;border:1px solid #168c98!important}
  .p55-actions-grid .p55-return{background:#6c5ce0!important;color:#fff!important;border:1px solid #6c5ce0!important}
  .p55-actions-grid .mini-x,.p55-actions-grid .p55-close{
    width:44px!important;min-width:44px!important;max-width:44px!important;
    height:44px!important;min-height:44px!important;max-height:44px!important;
    padding:0!important;margin:0!important;border-radius:10px!important;
    display:grid!important;place-items:center!important;justify-self:end!important;
    font-size:18px!important;line-height:1!important;box-sizing:border-box!important;
  }
  /* Se a linha terminar com apenas o X, ele fica alinhado à direita sem esticar. */
  .p55-actions-grid .mini-x:last-child{grid-column:2!important}

  /* Histórico também cabe inteiro no lado esquerdo do cartão. */
  .p54-history{max-width:100%!important;width:100%!important}
  .p54-head,.p54-row{grid-template-columns:150px minmax(150px,1.2fr) minmax(145px,1fr) 52px!important}

  @media(max-width:980px){
    .pub-act.p55-actions-grid,.repo-actions.p55-actions-grid{
      width:100%!important;min-width:0!important;max-width:none!important;
      grid-template-columns:repeat(2,minmax(128px,1fr))!important;
    }
    .p55-actions-grid button:not(.mini-x){width:100%!important;min-width:0!important;max-width:none!important}
  }
  @media(max-width:620px){
    .pub-act.p55-actions-grid,.repo-actions.p55-actions-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important}
    .p55-actions-grid button:not(.mini-x){height:42px!important;min-height:42px!important;max-height:42px!important;font-size:11px!important;padding:0 7px!important}
    .p55-actions-grid .mini-x,.p55-actions-grid .p55-close{width:42px!important;min-width:42px!important;max-width:42px!important;height:42px!important;min-height:42px!important;max-height:42px!important}
  }
  `;document.head.appendChild(s);
}
function boot55(){
  css55();standardize55();
  // A tela é re-renderizada pelo app; reaplica somente classes/estilo, sem MutationObserver.
  setInterval(standardize55,1000);
  console.info('Carbonautas repository actions',VERSION,'carregado');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot55,{once:true});else boot55();
})();
