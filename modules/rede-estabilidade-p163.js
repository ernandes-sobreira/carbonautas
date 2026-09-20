/* Carbonautas P165 · estabilidade leve da Rede
   - organiza uma vez e congela
   - evita re-render idêntico
   - sem bateria de timers de inicialização
   - não grava nem altera dados do Firebase
*/
(function(){
'use strict';
if(window.__CARBONAUTAS_P163_REDE_ESTAVEL)return;
window.__CARBONAUTAS_P163_REDE_ESTAVEL=true;

const $=(s,r=document)=>r.querySelector(s);
let freezeTimer=0,lastKey='',lastRenderAt=0;
function stateRef(){try{return window.state||state||{}}catch(_e){return{}}}
function stamp(v){try{return v?.toMillis?.()||v?.seconds||v?._seconds||v||''}catch(_e){return''}}
function structuralKey(){
 const s=stateRef(),members=(s.members||[]).map(m=>[m.id,m.nivel,m.status,m.programa,(m.linhas||[]).join('~'),!!m.hub,stamp(m.updatedAt)]).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))),pubs=(s.publicacoes||[]).map(p=>[p.id,p.memberId,(p.collaboratorMemberIds||[]).join('~'),stamp(p.updatedAt)]).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))),acts=(s.activities||[]).filter(a=>String(a.type||'').toLowerCase().includes('orient')).map(a=>[a.id,a.ownerId||a.memberId||'',a.type||'',stamp(a.updatedAt)]).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))),ids=['search','fPrograma','fStatus','grouping','tLabels','tHubLinks'].map(id=>{const e=$('#'+id);return e?(e.type==='checkbox'?!!e.checked:e.value):''}),graph=$('#graph'),rect=graph?.getBoundingClientRect();return JSON.stringify([String(window.__p135NetworkMode||'all'),ids,members,pubs,acts,Math.round(rect?.width||0),Math.round(rect?.height||0)])
}
function simulationRef(){try{if(typeof simulation!=='undefined'&&simulation)return simulation}catch(_e){}try{if(window.simulation)return window.simulation}catch(_e){}return null}
function freezeGraph(delay=360){clearTimeout(freezeTimer);freezeTimer=setTimeout(()=>{try{const sim=simulationRef();if(!sim)return;if(typeof sim.alphaTarget==='function')sim.alphaTarget(0);if(typeof sim.alpha==='function')sim.alpha(0);if(typeof sim.stop==='function')sim.stop()}catch(_e){}},delay)}
function install(){
 let current=null;try{current=window.renderGraph||renderGraph}catch(_e){}if(typeof current!=='function')return false;if(current.__p163Stable)return true;
 const wrapped=function(){if(document.body?.dataset?.view!=='rede'&&!$('#viewRede')?.classList.contains('on'))return;const key=structuralKey(),now=Date.now(),painted=!!$('#graph g.node');if(painted&&key===lastKey&&(now-lastRenderAt)<5000){freezeGraph(50);return}lastKey=key;lastRenderAt=now;const result=current.apply(this,arguments);freezeGraph(360);return result};wrapped.__p163Stable=true;wrapped.__p135Fixed=true;wrapped.__p135Original=current.__p135Original||current;try{renderGraph=wrapped}catch(_e){}window.renderGraph=wrapped;if($('#graph g.node')){lastKey=structuralKey();lastRenderAt=Date.now();freezeGraph(100)}return true
}
function boot(){install();setTimeout(install,180);document.addEventListener('visibilitychange',()=>{if(!document.hidden&&document.body?.dataset?.view==='rede')freezeGraph(70)},{passive:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
