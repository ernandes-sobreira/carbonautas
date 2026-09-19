/* Carbonautas P153 · linhas de orientação por registros reais
   - usa somente registros reais de orientação do acompanhamento acadêmico
   - mostra as linhas em Todos e em Orientações
   - em Orientações esconde as linhas antigas inferidas e destaca quem tem registro
   - espessura cresce suavemente, com teto baixo para não poluir a Rede
   - não grava nem altera dados
*/
(function(){
'use strict';
if(window.__CARBONAUTAS_P152_ORIENTATION_LINES)return;
window.__CARBONAUTAS_P152_ORIENTATION_LINES=true;

const NS='http://www.w3.org/2000/svg';
const optimisticCounts=new Map();
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function stateRef(){try{return window.state||state||{}}catch(_e){return{}}}
function coordinator(){
  const members=stateRef().members||[];
  let c=members.find(m=>String(m.nivel||'')==='coord');
  if(!c)c=members.find(m=>/coorden/.test(norm(m.nivel||m.papel||m.status||'')));
  if(!c){
    try{if(isAdmin){const id=window.myId||myId;c=members.find(m=>m.id===id)||null}}catch(_e){}
  }
  return c||null;
}
function realOrientationCount(memberId){
  return (stateRef().activities||[]).filter(a=>(a.ownerId===memberId||a.memberId===memberId)&&norm(a.type).includes('orient')).length;
}
function orientationCount(memberId){return Math.max(realOrientationCount(memberId),optimisticCounts.get(String(memberId))||0)}
function currentMode(){return document.querySelector('[data-p135-mode].on')?.dataset?.p135Mode||'all'}
function pointFor(el){
  const d=el&&el.__data__;
  if(d&&Number.isFinite(d.x)&&Number.isFinite(d.y))return{x:d.x,y:d.y};
  const tr=el?.getAttribute('transform')||'';
  const m=tr.match(/translate\(\s*([-\d.]+)[, ]+\s*([-\d.]+)/);
  return m?{x:Number(m[1]),y:Number(m[2])}:null;
}
function widthFor(n){return Math.min(2.0,0.72+0.42*Math.sqrt(Math.max(1,n)))}
function opacityFor(n,mode){const base=mode==='orientation'?.34:.16;return Math.min(mode==='orientation'?.52:.28,base+Math.min(8,n)*.025)}
function baseLines(zoom){return Array.from(zoom.querySelectorAll(':scope > g:not(.p152-orientation-layer) line'))}
function restoreNodes(nodes){nodes.forEach(el=>{el.style.opacity='';el.style.pointerEvents=''})}
function emphasizeOrientation(nodes,coordId){
  nodes.forEach(el=>{
    const id=String(el.__data__?.id||''),n=orientationCount(id),keep=id===String(coordId)||n>0;
    el.style.opacity=keep?'1':'.13';
    el.style.pointerEvents=keep?'':'none';
  });
}
function draw(){
  const svg=document.querySelector('#graph'),zoom=svg?.querySelector('g.zoomG');
  if(!svg||!zoom)return;
  const mode=currentMode();
  let layer=zoom.querySelector(':scope > g.p152-orientation-layer');
  if(!layer){layer=document.createElementNS(NS,'g');layer.setAttribute('class','p152-orientation-layer');layer.setAttribute('pointer-events','none');zoom.insertBefore(layer,zoom.firstChild)}
  layer.replaceChildren();
  const nodes=Array.from(svg.querySelectorAll('g.node'));
  baseLines(zoom).forEach(line=>line.style.display=mode==='orientation'?'none':'');
  if(mode!=='all'&&mode!=='orientation'){restoreNodes(nodes);return}

  const coord=coordinator();if(!coord){restoreNodes(nodes);return}
  if(mode==='orientation')emphasizeOrientation(nodes,coord.id);else restoreNodes(nodes);
  const byId=new Map(nodes.map(el=>[String(el.__data__?.id||''),el]));
  const cEl=byId.get(String(coord.id)),cp=pointFor(cEl);if(!cp)return;

  (stateRef().members||[]).forEach(m=>{
    if(!m||String(m.id)===String(coord.id))return;
    const n=orientationCount(m.id);if(n<1)return;
    const el=byId.get(String(m.id)),p=pointFor(el);if(!el||!p)return;
    const role=String(m.vinculoCoordenador||'').toLowerCase();
    const roleLabel=role==='coorientado'?'Coorientação':role==='orientado'?'Orientação':'Acompanhamento acadêmico';
    const line=document.createElementNS(NS,'line');
    line.setAttribute('x1',cp.x);line.setAttribute('y1',cp.y);line.setAttribute('x2',p.x);line.setAttribute('y2',p.y);
    line.setAttribute('stroke','#178f91');line.setAttribute('stroke-width',String(widthFor(n)));line.setAttribute('stroke-opacity',String(opacityFor(n,mode)));
    line.setAttribute('stroke-dasharray',mode==='orientation'?'3 3.6':'2.4 4.2');line.setAttribute('stroke-linecap','round');line.dataset.memberId=m.id;
    const title=document.createElementNS(NS,'title');title.textContent=`${roleLabel} · ${n} registro${n===1?'':'s'} de orientação`;line.appendChild(title);layer.appendChild(line);
  });
}
function scheduleDraw(){[0,80,240,650,1400,3000].forEach(ms=>setTimeout(()=>{try{draw()}catch(e){console.warn('P153 linha de orientação',e)}},ms))}
function wrapRender(){
  let fn=null;try{fn=window.renderGraph||renderGraph}catch(_e){}
  if(typeof fn!=='function')return false;
  if(fn.__p152OrientationLines)return true;
  const wrapped=function(){const r=fn.apply(this,arguments);scheduleDraw();return r};
  wrapped.__p152OrientationLines=true;wrapped.__p152Original=fn;
  try{renderGraph=wrapped}catch(_e){}window.renderGraph=wrapped;return true;
}
function boot(){
  const tryInstall=()=>{if(wrapRender()){scheduleDraw();return true}return false};
  if(!tryInstall()){let n=0;const t=setInterval(()=>{if(tryInstall()||++n>30)clearInterval(t)},150)}
  document.addEventListener('click',e=>{if(e.target?.closest?.('[data-p135-mode]'))setTimeout(draw,100)},true);
  window.addEventListener('carbonautas:orientation-saved',e=>{
    const id=String(e.detail?.memberId||''),count=Number(e.detail?.count||0);if(id&&count>0)optimisticCounts.set(id,count);
    scheduleDraw();setTimeout(()=>{if(id&&realOrientationCount(id)>=count)optimisticCounts.delete(id);draw()},4500);
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
