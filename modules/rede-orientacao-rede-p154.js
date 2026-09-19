/* Carbonautas P161 · rede estável + controles alinhados + enquadramento real
   - orientação usa espessura proporcional ao número de registros
   - produção, projetos, orientação e outros vínculos têm linguagem visual própria
   - mantém a legenda horizontal da Rede
   - deixa a simulação assentar e depois congela o grafo
   - respeita o controle Nomes em vez de reativá-lo à força
   - alinha Nomes e Vínculos extra dentro de Ajustes
   - transforma o botão de quatro setas em um enquadramento real da rede
   Não grava nem altera dados do Firebase. */
(function(){
'use strict';
if(window.__CARBONAUTAS_P154_ORIENTATION_NETWORK)return;
window.__CARBONAUTAS_P154_ORIENTATION_NETWORK=true;

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
let mode='all';
let orientationDocs=new Map();
let unsubscribe=null;
let settleTimer=0;
let redrawTimer=0;
let fitRetryTimer=0;
let lastOrientationSignature='';

function S(){try{return window.state||state||{}}catch(_e){return{}}}
function my(){try{return window.myId||myId||''}catch(_e){return''}}
function admin(){try{return !!isAdmin}catch(_e){return false}}
function coordinator(members){
  let c=null;
  const id=my();
  if(admin()&&id)c=members.find(m=>m.id===id)||null;
  if(!c)c=members.find(m=>String(m.nivel||'')==='coord'||/coorden/.test(norm(m.nivel||m.papel||m.status||'')))||null;
  return c;
}
function orientationRecords(){
  if(orientationDocs.size)return [...orientationDocs.values()];
  return (S().activities||[]).filter(a=>norm(a?.type).includes('orient'));
}
function orientationSummary(members){
  const ids=new Set(members.map(m=>String(m.id)));
  const coord=coordinator(members);
  const counts=new Map();
  if(!coord||!ids.has(String(coord.id)))return {coord:null,counts,total:0};
  let total=0;
  orientationRecords().forEach(a=>{
    const owner=String(a?.ownerId||a?.memberId||'');
    if(!owner||owner===String(coord.id)||!ids.has(owner)||!norm(a?.type).includes('orient'))return;
    counts.set(owner,(counts.get(owner)||0)+1);total++;
  });
  return {coord,counts,total};
}

function orientationStroke(n){
  n=Math.max(1,Number(n)||1);
  return Math.min(8.5,3+1.6*(n-1));
}
function orientationWeight(n){return Math.min(8,2.4+1.25*Math.max(0,n-1))}
function orientationLinks(members){
  const {coord,counts}=orientationSummary(members);
  if(!coord)return [];
  return [...counts.entries()].map(([owner,n])=>({
    source:coord.id,target:owner,w:orientationWeight(n),aux:false,orientationCount:n,
    reasons:[{type:'orientacao',label:`Orientação registrada · ${n} registro${n===1?'':'s'}`}]
  }));
}
function pairKey(l){
  const a=String(l?.source?.id||l?.source||''),b=String(l?.target?.id||l?.target||'');
  return [a,b].sort().join('|');
}
function mergeOrientation(base,members){
  const out=[...base],byPair=new Map(out.map((l,i)=>[pairKey(l),i]));
  orientationLinks(members).forEach(o=>{
    const k=pairKey(o),i=byPair.get(k);
    if(i==null){byPair.set(k,out.length);out.push(o);return;}
    const l=out[i];
    l.w=Math.max(Number(l.w)||0,o.w);
    l.reasons=[...(l.reasons||[]),...(o.reasons||[])];
    l.orientationCount=o.orientationCount;
  });
  return out;
}
function activeMembers(){
  try{return typeof visibleMembers==='function'?visibleMembers():(S().members||[])}catch(_e){return S().members||[]}
}
function syncNamesVisibility(){
  const toggle=$('#tLabels');
  const show=toggle?!!toggle.checked:true;
  $$('#graph g.node').forEach(g=>{
    const d=g.__data__,t=$('text',g);
    if(t&&d?.nome)t.textContent=show?d.nome:'';
  });
}
function isProductionLink(d){
  const reasons=d?.reasons||[];
  return reasons.some(r=>norm(r?.type)==='producao'||/produ|artigo|publica|cap[ií]tulo|coautor|manuscrito/.test(norm(r?.label)));
}
function isProjectLink(d){
  const reasons=d?.reasons||[];
  return reasons.some(r=>/projeto|pesquisa em conjunto|campo em conjunto|experimento em conjunto/.test(norm(r?.label)));
}
function resetLineStyle(line){
  line.style.removeProperty('stroke');
  line.style.removeProperty('stroke-opacity');
  line.style.removeProperty('stroke-dasharray');
  line.style.removeProperty('stroke-width');
  delete line.dataset.relationVisual;
  delete line.dataset.orientationCount;
}
function styleOrientation(line,d){
  const n=Math.max(1,Number(d?.orientationCount)||1);
  line.style.setProperty('stroke','#168f94');
  line.style.setProperty('stroke-opacity','.92');
  line.style.setProperty('stroke-dasharray','none');
  line.style.setProperty('stroke-width',orientationStroke(n)+'px');
  line.dataset.relationVisual='orientation';
  line.dataset.orientationCount=String(n);
}
function styleProduction(line){
  line.style.setProperty('stroke','#6c5ce0');
  line.style.setProperty('stroke-opacity','.82');
  line.style.setProperty('stroke-dasharray','8 6');
  line.style.setProperty('stroke-width','2.7px');
  line.dataset.relationVisual='production';
}
function styleProject(line){
  line.style.setProperty('stroke','#2e9e5b');
  line.style.setProperty('stroke-opacity','.76');
  line.style.setProperty('stroke-dasharray','none');
  line.style.setProperty('stroke-width','2.4px');
  line.dataset.relationVisual='project';
}
function decorateLinkStyles(){
  $$('#graph line.link').forEach(line=>{
    const d=line.__data__||{};
    resetLineStyle(line);
    if(mode==='orientation'){styleOrientation(line,d);return;}
    if(mode==='production'){styleProduction(line);return;}
    if(mode==='projects'){styleProject(line);return;}
    const n=Number(d.orientationCount)||0;
    if(n){styleOrientation(line,d);return;}
    if(isProductionLink(d)){styleProduction(line);return;}
    if(isProjectLink(d)){styleProject(line);return;}
  });
}
function decorateOrientationView(members){
  const {coord,counts,total}=orientationSummary(members);
  const active=new Set(counts.keys());if(coord)active.add(String(coord.id));
  $$('#graph g.node').forEach(g=>{
    const id=String(g.__data__?.id||'');
    g.style.opacity=mode==='orientation'?(active.has(id)?'1':'.14'):'';
  });
  const insight=$('#p135RedeInsight');
  if(mode==='orientation'&&insight){
    insight.textContent=`${counts.size} pessoa${counts.size===1?'':'s'} com orientação · ${total} registro${total===1?'':'s'} · linha mais grossa = mais orientações`;
  }
}

function ensureLegendCss(){
  if($('#p158RedeLegendaStyle'))return;
  const st=document.createElement('style');
  st.id='p158RedeLegendaStyle';
  st.textContent=`
.p158-rede-legend{order:5;flex:1 1 100%;display:flex;align-items:center;gap:8px;overflow-x:auto;padding:2px 0 1px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.p158-rede-legend::-webkit-scrollbar{display:none}
.p158-legend-label{flex:0 0 auto;font-size:9px;font-weight:900;letter-spacing:.04em;text-transform:uppercase;color:#7a8d94}
.p158-legend-item{flex:0 0 auto;display:inline-flex;align-items:center;gap:6px;min-height:26px;padding:4px 8px;border:1px solid #e0e9e7;border-radius:999px;background:#fff;color:#506970;font-size:9.5px;font-weight:800;white-space:nowrap}
.p158-legend-item.on{border-color:#9fcfcb;background:#eef9f8;color:#173f49;box-shadow:inset 0 0 0 1px rgba(22,143,148,.08)}
.p158-line{display:inline-block;width:28px;height:0;border-top-style:solid;border-radius:999px;flex:0 0 auto}
.p158-line.orientation{border-top-width:5px;border-top-color:#168f94}
.p158-line.production{border-top-width:3px;border-top-color:#6c5ce0;border-top-style:dashed}
.p158-line.projects{border-top-width:3px;border-top-color:#2e9e5b}
.p158-line.other{border-top-width:2px;border-top-color:#c7d6d6}
@media(max-width:760px){.p158-rede-legend{gap:6px;padding-bottom:2px}.p158-legend-label{font-size:8.5px}.p158-legend-item{font-size:9px;min-height:25px;padding:4px 7px}.p158-line{width:24px}.p158-line.orientation{border-top-width:5px}}
`;
  document.head.appendChild(st);
}
function ensureControlCss(){
  if($('#p161RedeControlsStyle'))return;
  const st=document.createElement('style');
  st.id='p161RedeControlsStyle';
  st.textContent=`
#p135RedeSettings .graph-controls{
  box-sizing:border-box!important;display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;
  align-items:stretch!important;gap:8px!important;padding:9px!important;margin-top:12px!important;width:100%!important
}
#p135RedeSettings .graph-controls select{
  grid-column:1/-1!important;width:100%!important;min-height:42px!important;margin:0!important;padding:0 11px!important;box-sizing:border-box!important
}
#p135RedeSettings .graph-controls .toggle{
  box-sizing:border-box!important;display:flex!important;align-items:center!important;justify-content:flex-start!important;
  gap:8px!important;width:100%!important;min-width:0!important;min-height:44px!important;margin:0!important;padding:0 10px!important;
  border:1px solid #dce8e6!important;border-radius:12px!important;background:#f9fcfb!important;color:#385761!important;
  font-size:12px!important;line-height:1.15!important;font-weight:800!important;white-space:nowrap!important
}
#p135RedeSettings .graph-controls .toggle input{
  flex:0 0 auto!important;width:17px!important;height:17px!important;margin:0!important
}
#p135RedeSettings #fitBtn{
  grid-column:1/-1!important;box-sizing:border-box!important;width:100%!important;min-height:44px!important;margin:0!important;padding:0 12px!important;
  display:flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;border-radius:12px!important;font-weight:850!important
}
#p135RedeSettings #fitBtn svg{width:17px!important;height:17px!important;flex:0 0 auto!important}
#p135RedeSettings #fitBtn .p161-fit-label{display:inline!important}
#p135RedeSettings #fitBtn.p161-fit-ok{background:#edf9f7!important;border-color:#9fd3cd!important;color:#126f73!important}
@media(max-width:360px){
  #p135RedeSettings .graph-controls{grid-template-columns:1fr!important}
  #p135RedeSettings .graph-controls select,#p135RedeSettings #fitBtn{grid-column:1!important}
}
`;
  document.head.appendChild(st);
}
function syncLegend(){
  const legend=$('#p158RedeLegend');if(!legend)return;
  $$('.p158-legend-item',legend).forEach(el=>el.classList.toggle('on',mode!=='all'&&el.dataset.mode===mode));
}
function ensureLegend(){
  const bar=$('#p135RedeToolbar');if(!bar)return false;
  let legend=$('#p158RedeLegend');
  if(!legend){
    legend=document.createElement('div');
    legend.id='p158RedeLegend';
    legend.className='p158-rede-legend';
    legend.setAttribute('aria-label','Legenda dos tipos de ligação da Rede');
    legend.innerHTML=`
      <span class="p158-legend-label">Legenda</span>
      <span class="p158-legend-item" data-mode="orientation" title="A espessura cresce conforme aumenta o número de orientações registradas"><i class="p158-line orientation"></i>Orientação · grossura = registros</span>
      <span class="p158-legend-item" data-mode="production"><i class="p158-line production"></i>Produção</span>
      <span class="p158-legend-item" data-mode="projects"><i class="p158-line projects"></i>Projetos</span>
      <span class="p158-legend-item" data-mode="other"><i class="p158-line other"></i>Outros vínculos</span>`;
    bar.appendChild(legend);
  }
  syncLegend();
  return true;
}

function currentSimulation(){
  try{
    if(window.simulation)return window.simulation;
    if(typeof simulation!=='undefined')return simulation;
  }catch(_e){}
  return null;
}
function settleGraph(delay=900){
  clearTimeout(settleTimer);
  settleTimer=setTimeout(()=>{
    try{
      const sim=currentSimulation();
      if(!sim)return;
      if(typeof sim.alphaTarget==='function')sim.alphaTarget(0);
      if(typeof sim.alpha==='function')sim.alpha(0);
      if(typeof sim.stop==='function')sim.stop();
    }catch(_e){}
  },delay);
}
function currentZoomBehavior(){
  try{
    if(window.zoomBehavior)return window.zoomBehavior;
    if(typeof zoomBehavior!=='undefined')return zoomBehavior;
  }catch(_e){}
  return null;
}
function fitFeedback(ok){
  const btn=$('#fitBtn');if(!btn)return;
  btn.classList.toggle('p161-fit-ok',!!ok);
  clearTimeout(btn.__p161FeedbackTimer);
  btn.__p161FeedbackTimer=setTimeout(()=>btn.classList.remove('p161-fit-ok'),850);
}
function fitGraphToView(retry=true){
  const graph=$('#graph'),zoomG=$('#graph g.zoomG');
  if(!graph||!zoomG)return false;
  let box=null;
  try{box=zoomG.getBBox()}catch(_e){}
  if(!box||!Number.isFinite(box.width)||!Number.isFinite(box.height)||box.width<2||box.height<2){
    if(retry){
      clearTimeout(fitRetryTimer);
      try{(window.renderGraph||renderGraph)?.()}catch(_e){}
      fitRetryTimer=setTimeout(()=>fitGraphToView(false),180);
    }
    return false;
  }
  const r=graph.getBoundingClientRect(),W=r.width||600,H=r.height||400,pad=Math.max(24,Math.min(46,Math.min(W,H)*.07));
  const usableW=Math.max(40,W-pad*2),usableH=Math.max(40,H-pad*2);
  const scale=Math.max(.35,Math.min(2.4,Math.min(usableW/Math.max(1,box.width),usableH/Math.max(1,box.height))));
  const cx=box.x+box.width/2,cy=box.y+box.height/2,tx=W/2-scale*cx,ty=H/2-scale*cy;
  const d3ref=window.d3,zb=currentZoomBehavior();
  try{
    if(d3ref&&zb&&d3ref.zoomIdentity){
      const transform=d3ref.zoomIdentity.translate(tx,ty).scale(scale);
      const selection=d3ref.select(graph);
      selection.interrupt();
      selection.transition().duration(320).call(zb.transform,transform);
    }else{
      zoomG.setAttribute('transform',`translate(${tx},${ty}) scale(${scale})`);
    }
    settleGraph(0);
    fitFeedback(true);
    try{if(typeof toast==='function')toast('Rede enquadrada na tela.')}catch(_e){}
    return true;
  }catch(e){
    console.warn('P161 enquadramento',e);fitFeedback(false);return false;
  }
}
function bindGraphControls(){
  const btn=$('#fitBtn');
  if(btn){
    btn.type='button';
    btn.title='Enquadrar toda a rede na tela';
    btn.setAttribute('aria-label','Enquadrar toda a rede na tela');
    if(!$('.p161-fit-label',btn)){
      const span=document.createElement('span');span.className='p161-fit-label';span.textContent='Enquadrar rede';btn.appendChild(span);
    }
    if(!btn.dataset.p161Bound){
      btn.dataset.p161Bound='1';
      btn.onclick=e=>{e.preventDefault();e.stopPropagation();fitGraphToView(true)};
    }
  }
}

function installBuildWrapper(){
  let fn=null;try{fn=window.buildLinks||buildLinks}catch(_e){}
  if(typeof fn!=='function')return false;
  if(fn.__p154Orientation)return true;
  const wrapped=function(members){
    const base=fn.apply(this,arguments)||[];
    if(mode==='orientation')return orientationLinks(members);
    if(mode==='all')return mergeOrientation(base,members);
    return base;
  };
  wrapped.__p154Orientation=true;wrapped.__p154Original=fn;
  try{buildLinks=wrapped}catch(_e){}window.buildLinks=wrapped;return true;
}
function afterRender(){
  syncNamesVisibility();
  decorateLinkStyles();
  decorateOrientationView(activeMembers());
  ensureLegend();
  syncLegend();
  bindGraphControls();
}
function installRenderWrapper(){
  let fn=null;try{fn=window.renderGraph||renderGraph}catch(_e){}
  if(typeof fn!=='function')return false;
  if(fn.__p154Orientation)return true;
  const wrapped=function(){
    const r=fn.apply(this,arguments);
    afterRender();
    requestAnimationFrame(afterRender);
    setTimeout(afterRender,45);
    settleGraph(900);
    return r;
  };
  wrapped.__p154Orientation=true;
  wrapped.__p154Original=fn;
  wrapped.__p135Fixed=true;
  try{renderGraph=wrapped}catch(_e){}window.renderGraph=wrapped;return true;
}
function redraw(){
  clearTimeout(redrawTimer);
  redrawTimer=setTimeout(()=>{
    try{
      (window.renderGraph||renderGraph)?.();
      settleGraph(900);
    }catch(e){console.warn('P161 redraw',e)}
  },55);
}
function ensureOrientationButton(){
  const modes=$('#p135RedeToolbar .p135-modes');if(!modes)return false;
  let b=$('[data-p154-mode="orientation"]',modes);
  const old=$('[data-p135-mode="orientation"]',modes);if(old)old.remove();
  if(!b){
    b=document.createElement('button');b.type='button';b.dataset.p154Mode='orientation';b.textContent='Orientação';
    const all=$('[data-p135-mode="all"]',modes);if(all)all.insertAdjacentElement('afterend',b);else modes.prepend(b);
    b.addEventListener('click',()=>{
      mode='orientation';
      window.__p135NetworkMode='orientation';
      $$('[data-p135-mode]',modes).forEach(x=>x.classList.remove('on'));
      b.classList.add('on');syncLegend();redraw();
    });
  }
  b.classList.toggle('on',mode==='orientation');
  return true;
}
function bindModes(){
  const modes=$('#p135RedeToolbar .p135-modes');if(!modes||modes.dataset.p156Bound)return;
  modes.dataset.p156Bound='1';
  modes.addEventListener('click',e=>{
    const b=e.target.closest?.('[data-p135-mode]');if(!b)return;
    mode=b.dataset.p135Mode||'all';
    window.__p135NetworkMode=mode;
    $('[data-p154-mode="orientation"]',modes)?.classList.remove('on');
    syncLegend();
  },true);
}
function orientationSignature(snap){
  try{return snap.docs.map(d=>`${d.id}:${d.updateTime?.toMillis?.()||d.data()?.updatedAt?.toMillis?.()||0}`).sort().join('|')}catch(_e){return String(snap.size||0)}
}
function listenOrientations(){
  if(unsubscribe)return;
  try{
    const f=typeof FB==='function'?FB():null;if(!f||!window.db)return;
    const q=f.query(f.collection(window.db,'rede_activities'),f.where('type','==','orientacao'));
    unsubscribe=f.onSnapshot(q,snap=>{
      const signature=orientationSignature(snap);
      orientationDocs=new Map(snap.docs.map(d=>[d.id,{...d.data(),id:d.id}]));
      if(signature===lastOrientationSignature){afterRender();return;}
      lastOrientationSignature=signature;
      redraw();
    },e=>console.warn('P161 orientação snapshot',e));
  }catch(e){console.warn('P161 orientação listener',e)}
}
function install(){
  ensureLegendCss();
  ensureControlCss();
  installBuildWrapper();
  installRenderWrapper();
  ensureOrientationButton();
  bindModes();
  ensureLegend();
  bindGraphControls();
  listenOrientations();
  syncNamesVisibility();
  decorateLinkStyles();
  syncLegend();
}
function boot(){
  install();
  [220,700].forEach(ms=>setTimeout(()=>{install();bindGraphControls()},ms));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){afterRender();settleGraph(120)}});
  window.addEventListener('pageshow',()=>{afterRender();settleGraph(120)});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();