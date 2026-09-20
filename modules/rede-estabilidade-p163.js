/* Carbonautas P163 · estabilidade da Rede
   - deixa a simulação organizar os nós por um instante e depois congela
   - ignora re-renderizações idênticas disparadas na inicialização
   - filtros e ajustes reais continuam redesenhando a Rede normalmente
   - não grava nem altera dados do Firebase
*/
(function(){
'use strict';
if(window.__CARBONAUTAS_P163_REDE_ESTAVEL)return;
window.__CARBONAUTAS_P163_REDE_ESTAVEL=true;

const $=(s,r=document)=>r.querySelector(s);
let freezeTimer=0;
let lastKey='';
let lastRenderAt=0;

function stateRef(){
  try{return window.state||state||{}}catch(_e){return{}}
}
function stamp(v){
  try{return v?.toMillis?.()||v?.seconds||v?._seconds||v||''}catch(_e){return''}
}
function structuralKey(){
  const s=stateRef();
  const members=(s.members||[]).map(m=>[
    m.id,m.nome,m.nivel,m.status,m.programa,(m.linhas||[]).join('~'),
    !!m.hub,m.hubMotivo||'',JSON.stringify(m.vinculos||[]),stamp(m.updatedAt)
  ]).sort((a,b)=>String(a[0]).localeCompare(String(b[0])));
  const pubs=(s.publicacoes||[]).map(p=>[
    p.id,p.memberId,p.title||'',(p.collaboratorMemberIds||[]).join('~'),stamp(p.updatedAt),stamp(p.createdAt)
  ]).sort((a,b)=>String(a[0]).localeCompare(String(b[0])));
  const acts=(s.activities||[]).map(a=>[
    a.id,a.ownerId||a.memberId||'',a.type||'',a.status||'',a.title||'',stamp(a.updatedAt),stamp(a.createdAt)
  ]).sort((a,b)=>String(a[0]).localeCompare(String(b[0])));
  const ids=['search','fPrograma','fStatus','grouping','tLabels','tHubLinks'].map(id=>{
    const e=$('#'+id);return e?(e.type==='checkbox'?!!e.checked:e.value):'';
  });
  const graph=$('#graph'),rect=graph?.getBoundingClientRect();
  return JSON.stringify([
    String(window.__p135NetworkMode||'all'),ids,members,pubs,acts,
    Math.round(rect?.width||0),Math.round(rect?.height||0)
  ]);
}
function simulationRef(){
  try{if(typeof simulation!=='undefined'&&simulation)return simulation}catch(_e){}
  try{if(window.simulation)return window.simulation}catch(_e){}
  return null;
}
function freezeGraph(delay=420){
  clearTimeout(freezeTimer);
  freezeTimer=setTimeout(()=>{
    try{
      const sim=simulationRef();if(!sim)return;
      if(typeof sim.alphaTarget==='function')sim.alphaTarget(0);
      if(typeof sim.alpha==='function')sim.alpha(0);
      if(typeof sim.stop==='function')sim.stop();
    }catch(_e){}
  },delay);
}
function install(){
  let current=null;
  try{current=window.renderGraph||renderGraph}catch(_e){}
  if(typeof current!=='function')return false;
  if(current.__p163Stable){
    if($('#graph g.node'))freezeGraph(100);
    return true;
  }

  const wrapped=function(){
    const key=structuralKey(),now=Date.now();
    const painted=!!$('#graph g.node');
    if(painted&&key===lastKey&&(now-lastRenderAt)<3500){
      freezeGraph(70);
      return;
    }
    lastKey=key;lastRenderAt=now;
    const result=current.apply(this,arguments);
    freezeGraph(420);
    return result;
  };
  wrapped.__p163Stable=true;
  /* Impede o P135 de substituir este wrapper nos timers tardios de boot. */
  wrapped.__p135Fixed=true;
  wrapped.__p135Original=current.__p135Original||current;
  try{renderGraph=wrapped}catch(_e){}
  window.renderGraph=wrapped;

  if($('#graph g.node')){
    lastKey=structuralKey();lastRenderAt=Date.now();
    freezeGraph(140);
  }
  return true;
}
function boot(){
  install();
  [80,220,650,1500,2300].forEach(ms=>setTimeout(()=>{install();if($('#graph g.node'))freezeGraph(120)},ms));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)freezeGraph(80)},{passive:true});
  window.addEventListener('pageshow',()=>freezeGraph(80),{passive:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
