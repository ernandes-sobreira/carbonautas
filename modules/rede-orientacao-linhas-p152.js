/* Carbonautas P152 · intensidade visual das orientações
   - desenha uma linha acadêmica discreta do coordenador para cada membro visível
   - a espessura cresce suavemente conforme o número de registros de orientação
   - fica atrás das demais conexões e só aparece em "Todos"
   - não grava nem altera dados
*/
(function(){
'use strict';
if(window.__CARBONAUTAS_P152_ORIENTATION_LINES)return;
window.__CARBONAUTAS_P152_ORIENTATION_LINES=true;

const NS='http://www.w3.org/2000/svg';
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
function orientationCount(memberId){
  return (stateRef().activities||[]).filter(a=>
    (a.ownerId===memberId||a.memberId===memberId) && norm(a.type).includes('orient')
  ).length;
}
function currentMode(){
  return document.querySelector('[data-p135-mode].on')?.dataset?.p135Mode||'all';
}
function pointFor(el){
  const d=el&&el.__data__;
  if(d&&Number.isFinite(d.x)&&Number.isFinite(d.y))return{x:d.x,y:d.y};
  const tr=el?.getAttribute('transform')||'';
  const m=tr.match(/translate\(\s*([-\d.]+)[, ]+\s*([-\d.]+)/);
  return m?{x:Number(m[1]),y:Number(m[2])}:null;
}
function widthFor(n){return Math.min(2.0,0.55+0.38*Math.sqrt(Math.max(0,n)))}
function opacityFor(n){return Math.min(.22,.11+Math.min(6,n)*.018)}
function draw(){
  const svg=document.querySelector('#graph');
  const zoom=svg?.querySelector('g.zoomG');
  if(!svg||!zoom)return;
  let layer=zoom.querySelector(':scope > g.p152-orientation-layer');
  if(!layer){
    layer=document.createElementNS(NS,'g');
    layer.setAttribute('class','p152-orientation-layer');
    layer.setAttribute('pointer-events','none');
    zoom.insertBefore(layer,zoom.firstChild);
  }
  layer.replaceChildren();
  if(currentMode()!=='all')return;

  const coord=coordinator();
  if(!coord)return;
  const nodes=Array.from(svg.querySelectorAll('g.node'));
  const byId=new Map(nodes.map(el=>[String(el.__data__?.id||''),el]));
  const cEl=byId.get(String(coord.id));
  const cp=pointFor(cEl);
  if(!cp)return;

  (stateRef().members||[]).forEach(m=>{
    if(!m||m.id===coord.id)return;
    const el=byId.get(String(m.id)),p=pointFor(el);
    if(!el||!p)return;
    const n=orientationCount(m.id);
    const role=String(m.vinculoCoordenador||'').toLowerCase();
    const roleLabel=role==='coorientado'?'Coorientação':role==='orientado'?'Orientação':'Acompanhamento acadêmico';
    const line=document.createElementNS(NS,'line');
    line.setAttribute('x1',cp.x);line.setAttribute('y1',cp.y);
    line.setAttribute('x2',p.x);line.setAttribute('y2',p.y);
    line.setAttribute('stroke','#178f91');
    line.setAttribute('stroke-width',String(widthFor(n)));
    line.setAttribute('stroke-opacity',String(opacityFor(n)));
    line.setAttribute('stroke-dasharray','2.4 4.2');
    line.setAttribute('stroke-linecap','round');
    line.dataset.memberId=m.id;
    const title=document.createElementNS(NS,'title');
    title.textContent=`${roleLabel} · ${n} registro${n===1?'':'s'} de orientação`;
    line.appendChild(title);
    layer.appendChild(line);
  });
}
function scheduleDraw(){[0,80,240,650,1350].forEach(ms=>setTimeout(()=>{try{draw()}catch(e){console.warn('P152 linha de orientação',e)}},ms))}
function wrapRender(){
  let fn=null;try{fn=window.renderGraph||renderGraph}catch(_e){}
  if(typeof fn!=='function')return false;
  if(fn.__p152OrientationLines)return true;
  const wrapped=function(){const r=fn.apply(this,arguments);scheduleDraw();return r};
  wrapped.__p152OrientationLines=true;wrapped.__p152Original=fn;
  try{renderGraph=wrapped}catch(_e){}window.renderGraph=wrapped;
  return true;
}
function boot(){
  const tryInstall=()=>{if(wrapRender()){scheduleDraw();return true}return false};
  if(!tryInstall()){
    let n=0;const t=setInterval(()=>{if(tryInstall()||++n>30)clearInterval(t)},150);
  }
  document.addEventListener('click',e=>{
    if(e.target?.closest?.('[data-p135-mode]'))setTimeout(draw,80);
  },true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
