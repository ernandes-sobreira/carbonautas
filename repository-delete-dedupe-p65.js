/* Carbonautas P65 · corrige duplicação infinita do botão Excluir nas pastas */
(function(){
'use strict';
let scheduled=false;
function packageId(card){
  const el=card.querySelector('[onclick*="openRepositoryPackage"]');
  const m=String(el?.getAttribute('onclick')||'').match(/openRepositoryPackage\('([^']+)'\)/);
  return m?.[1]||'';
}
function fixDeleteButtons(){
  document.querySelectorAll('#repoPackageList .repo-package-card').forEach(card=>{
    const area=card.querySelector('.repo-package-actions');
    if(!area)return;
    const id=packageId(card);
    if(!id)return;
    const buttons=[...area.querySelectorAll('button.p64-delete,button[onclick*="deleteRepositoryPackage"]')];
    if(!buttons.length)return;
    const keep=buttons.find(b=>String(b.getAttribute('onclick')||'').includes('deleteRepositoryPackage'))||buttons[0];
    buttons.forEach(b=>{if(b!==keep)b.remove()});
    keep.classList.remove('mini-x');
    keep.classList.add('btn','p64-delete');
    keep.textContent='🗑 Excluir';
    keep.title='Excluir pasta';
    keep.setAttribute('onclick',`deleteRepositoryPackage(${JSON.stringify(id)})`);
    keep.dataset.p65SingleDelete='1';
  });
}
function schedule(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;fixDeleteButtons()});
}
function boot(){
  fixDeleteButtons();
  const root=document.getElementById('repoPackageList')||document.body;
  new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
  setTimeout(fixDeleteButtons,300);
  setTimeout(fixDeleteButtons,1200);
  console.info('Carbonautas P65 · exclusão única por pasta carregada');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
