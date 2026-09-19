/* Carbonautas P156 · rede de orientações reais
   - orientação usa espessura claramente proporcional ao número de registros
   - produção e orientação têm linguagem visual diferente
   - reduz observadores e repetições para deixar a Rede mais leve
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
function setNamesVisible(){
  const toggle=$('#tLabels');if(toggle)toggle.checked=true;
  $$('#graph g.node').forEach(g=>{
    const d=g.__data__,t=$('text',g);
    if(t&&d?.nome)t.textContent=d.nome;
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
function decorateLinkStyles(){
  $$('#graph line.link').forEach(line=>{
    const d=line.__data__||{};
    line.style.removeProperty('stroke');
    line.style.removeProperty('stroke-opacity');
    line.style.removeProperty('stroke-dasharray');
    line.style.removeProperty('stroke-width');
    const n=Number(d.orientationCount)||0;
    if(n){
      line.style.setProperty('stroke','#168f94');
      line.style.setProperty('stroke-opacity','.92');
      line.style.setProperty('stroke-dasharray','none');
      line.style.setProperty('stroke-width',orientationStroke(n)+'px');
      line.dataset.relationVisual='orientation';
      line.dataset.orientationCount=String(n);
      return;
    }
    if(isProductionLink(d)){
      line.style.setProperty('stroke','#6c5ce0');
      line.style.setProperty('stroke-opacity','.78');
      line.style.setProperty('stroke-dasharray','8 6');
      line.style.setProperty('stroke-width','2.5px');
      line.dataset.relationVisual='production';
      return;
    }
    if(isProjectLink(d)){
      line.style.setProperty('stroke','#2e9e5b');
      line.style.setProperty('stroke-opacity','.72');
      line.style.setProperty('stroke-dasharray','none');
      line.style.setProperty('stroke-width','2.2px');
      line.dataset.relationVisual='project';
      return;
    }
    delete line.dataset.relationVisual;
    delete line.dataset.orientationCount;
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
  setNamesVisible();
  decorateLinkStyles();
  decorateOrientationView(activeMembers());
}
function installRenderWrapper(){
  let fn=null;try{fn=window.renderGraph||renderGraph}catch(_e){}
  if(typeof fn!=='function')return false;
  if(fn.__p154Orientation)return true;
  const wrapped=function(){
    const t=$('#tLabels');if(t)t.checked=true;
    const r=fn.apply(this,arguments);
    afterRender();
    requestAnimationFrame(afterRender);
    return r;
  };
  wrapped.__p154Orientation=true;
  wrapped.__p154Original=fn;
  wrapped.__p135Fixed=true;
  try{renderGraph=wrapped}catch(_e){}window.renderGraph=wrapped;return true;
}
function redraw(){
  try{const t=$('#tLabels');if(t)t.checked=true;(window.renderGraph||renderGraph)?.()}catch(e){console.warn('P156 redraw',e)}
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
      $$('[data-p135-mode]',modes).forEach(x=>x.classList.remove('on'));
      b.classList.add('on');redraw();
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
    $('[data-p154-mode="orientation"]',modes)?.classList.remove('on');
  },true);
}
function listenOrientations(){
  if(unsubscribe)return;
  try{
    const f=typeof FB==='function'?FB():null;if(!f||!window.db)return;
    const q=f.query(f.collection(window.db,'rede_activities'),f.where('type','==','orientacao'));
    unsubscribe=f.onSnapshot(q,snap=>{
      orientationDocs=new Map(snap.docs.map(d=>[d.id,{...d.data(),id:d.id}]));
      redraw();
    },e=>console.warn('P156 orientação snapshot',e));
  }catch(e){console.warn('P156 orientação listener',e)}
}
function install(){
  installBuildWrapper();
  installRenderWrapper();
  ensureOrientationButton();
  bindModes();
  listenOrientations();
  setNamesVisible();
  decorateLinkStyles();
}
function boot(){
  install();
  setTimeout(install,220);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)redraw()});
  window.addEventListener('pageshow',redraw);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
