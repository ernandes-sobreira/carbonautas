/* Carbonautas P161 · controles unificados da Rede
   - usa uma única barra para busca, filtros e ajustes
   - mantém os controles nativos e seus handlers; apenas reorganiza o DOM
   - remove a duplicação visual criada pelos dois toolbars P135
   - filtros aplicam uma única renderização por clique
   - não grava nem altera dados do Firebase
*/
(function(){
'use strict';
if(window.__CARBONAUTAS_P161_REDE_CONTROLES)return;
window.__CARBONAUTAS_P161_REDE_CONTROLES=true;

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
let renderRAF=0;

function css(){
  if($('#p161RedeControlesStyle'))return;
  const st=document.createElement('style');
  st.id='p161RedeControlesStyle';
  st.textContent=`
#viewRede #redeFiltersBtn{display:none!important}
#viewRede #p135RedeToolbar.p161-unified{display:flex!important;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 10px;border-bottom:1px solid #dbe7e5;background:rgba(255,255,255,.97);backdrop-filter:blur(12px);z-index:20}
#p135RedeToolbar.p161-unified .p135-rede-heading{order:1;display:flex;align-items:baseline;gap:7px;min-width:0}
#p135RedeToolbar.p161-unified .p135-rede-heading b{font-size:20px;color:#14364a}
#p135RedeToolbar.p161-unified .p135-rede-heading small{font-size:10px;color:#73878f;font-weight:750}
#p135RedeToolbar.p161-unified>.search{order:2;flex:1 1 220px;max-width:none;min-width:170px;margin:0}
#p135RedeToolbar.p161-unified .p161-control-row{order:3;display:flex;align-items:center;gap:7px;flex:1 1 100%;min-width:0}
#p135RedeToolbar.p161-unified .p135-rede-modes{display:flex!important;gap:5px;overflow-x:auto;scrollbar-width:none;flex:1 1 auto;min-width:0;order:initial!important}
#p135RedeToolbar.p161-unified .p135-rede-modes::-webkit-scrollbar{display:none}
#p135RedeToolbar.p161-unified .p135-rede-mode{min-height:34px;border:1px solid #d7e4e2;background:#fff;color:#506b74;border-radius:999px;padding:7px 11px;font-size:11px;font-weight:850;white-space:nowrap}
#p135RedeToolbar.p161-unified .p135-rede-mode.on{background:#168f94;border-color:#168f94;color:#fff}
.p161-settings-toggle{flex:0 0 auto;min-height:36px;border:1px solid #cadfdb;background:#f2f9f8;color:#244b58;border-radius:12px;padding:7px 11px;font-size:11px;font-weight:900;white-space:nowrap}
.p161-settings-toggle[aria-expanded="true"]{background:#173f49;border-color:#173f49;color:#fff}
#p135RedeToolbar.p161-unified .p135-rede-insight{order:4;flex:1 1 100%;font-size:10px;color:#71858d;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#p161RedeSettings{order:5;flex:1 1 100%;display:none;border:1px solid #dce8e6;background:#f7fbfa;border-radius:16px;padding:10px;min-width:0}
#p161RedeSettings.open{display:block}
.p161-settings-head{display:flex;align-items:center;gap:8px;margin-bottom:9px}
.p161-settings-head b{font-size:13px;color:#21434e;flex:1}.p161-settings-head small{font-size:9.5px;color:#7a8c92}
#p161RedeSettings .side{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;width:100%!important;max-width:none!important;border:0!important;padding:0!important;overflow:visible!important;background:transparent!important}
#p161RedeSettings .side>.side-mobile-head{display:none!important}
#p161RedeSettings .side>.block{margin:0!important;border:1px solid #dfe9e7!important;border-radius:13px!important;background:#fff!important;padding:9px!important;min-width:0}
#p161RedeSettings .side>.block h3{margin:0 0 7px!important;font-size:11px!important}
#p161RedeSettings .graph-controls{position:static!important;display:grid!important;grid-template-columns:minmax(150px,1.35fr) minmax(110px,.8fr) minmax(130px,1fr) auto;gap:7px;align-items:center;width:100%;margin-top:9px;padding:8px!important;border:1px solid #dfe9e7!important;border-radius:13px!important;background:#fff!important;box-shadow:none!important}
#p161RedeSettings .graph-controls select{width:100%;min-height:38px;border-radius:10px!important}
#p161RedeSettings .graph-controls .toggle{min-height:38px;margin:0!important;border:1px solid #dce7e5;border-radius:10px;background:#f8fbfa;padding:7px 9px!important;justify-content:center}
#p161RedeSettings #fitBtn{min-height:38px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;border:1px solid #cfe0dd!important;background:#eef7f5!important;color:#214955!important;border-radius:10px!important;padding:7px 10px!important;white-space:nowrap}
#p161RedeSettings #fitBtn span{font-size:10.5px;font-weight:850}
#p135RedeToolbar.p161-unified #p158RedeLegend{order:6;flex-basis:100%}
#p135RedeSettings.p161-placeholder{display:none!important}
@media(max-width:760px){
  #viewRede #p135RedeToolbar.p161-unified{padding:7px 8px;gap:7px}
  #p135RedeToolbar.p161-unified .p135-rede-heading{flex:1 1 auto}
  #p135RedeToolbar.p161-unified .p135-rede-heading small{display:none}
  #p135RedeToolbar.p161-unified>.search{order:2;flex:1 1 100%;min-height:42px}
  #p135RedeToolbar.p161-unified .p161-control-row{order:3;gap:6px}
  #p135RedeToolbar.p161-unified .p135-rede-modes{flex:1 1 auto}
  .p161-settings-toggle{padding:7px 9px}
  #p161RedeSettings{padding:8px;border-radius:14px}
  #p161RedeSettings .side{grid-template-columns:1fr!important;gap:7px}
  #p161RedeSettings .graph-controls{grid-template-columns:1fr 1fr!important;gap:7px}
  #p161RedeSettings .graph-controls select{grid-column:1/-1}
  #p161RedeSettings #fitBtn{grid-column:1/-1}
  #p135RedeToolbar.p161-unified .p135-rede-insight{font-size:9.5px}
}
`;
  document.head.appendChild(st);
}

function renderOnce(){
  cancelAnimationFrame(renderRAF);
  renderRAF=requestAnimationFrame(()=>{
    try{(window.renderGraph||renderGraph)?.()}catch(e){console.warn('P161 render',e)}
  });
}
function syncLegend(mode){
  const canonical={orientacao:'orientation',projetos:'projects',producao:'production'}[mode]||mode;
  $$('#p158RedeLegend .p158-legend-item').forEach(el=>el.classList.toggle('on',canonical!=='all'&&el.dataset.mode===canonical));
}
function bindModes(bar){
  const modes=$('.p135-rede-modes',bar);if(!modes)return;
  const defs=[['all','Todos'],['orientation','Orientação'],['projects','Projetos'],['production','Produção']];
  modes.innerHTML=defs.map(([v,t],i)=>`<button type="button" class="p135-rede-mode${i===0?' on':''}" data-p135-mode="${v}">${t}</button>`).join('');
  modes.querySelectorAll('[data-p135-mode]').forEach(btn=>{
    btn.onclick=e=>{
      e.preventDefault();
      const mode=btn.dataset.p135Mode||'all';
      window.__p135NetworkMode=mode;
      modes.querySelectorAll('[data-p135-mode]').forEach(x=>x.classList.toggle('on',x===btn));
      syncLegend(mode);
      const insight=$('#p135RedeInsight',bar);
      if(insight){const tx={all:'Todas as relações',orientation:'Orientações registradas',projects:'Projetos e linhas compartilhadas',production:'Produção compartilhada'};insight.textContent=tx[mode]||tx.all;}
      renderOnce();
    };
  });
  const current=String(window.__p135NetworkMode||'all');
  const normalized={orientacao:'orientation',projetos:'projects',producao:'production'}[current]||current;
  const active=$(`[data-p135-mode="${normalized}"]`,modes)||$('[data-p135-mode="all"]',modes);
  modes.querySelectorAll('[data-p135-mode]').forEach(x=>x.classList.toggle('on',x===active));
  window.__p135NetworkMode=active?.dataset.p135Mode||'all';
  syncLegend(window.__p135NetworkMode);
}
function bindFit(){
  const btn=$('#fitBtn');if(!btn)return;
  btn.title='Ajustar a rede à tela';
  btn.setAttribute('aria-label','Ajustar a rede à tela');
  if(!btn.querySelector('span'))btn.insertAdjacentHTML('beforeend','<span>Ajustar visão</span>');
  btn.onclick=e=>{
    e.preventDefault();
    try{
      if(typeof window.fitView==='function')window.fitView();
      else if(typeof fitView==='function')fitView();
    }catch(err){console.warn('P161 fitView',err)}
  };
}
function ensurePlaceholder(){
  let ov=$('#p135RedeSettings');
  if(!ov){ov=document.createElement('div');ov.id='p135RedeSettings';document.body.appendChild(ov)}
  ov.hidden=true;ov.className='p161-placeholder';ov.innerHTML='';
}
function pickBase(view){
  const bars=$$('.p135-rede-toolbar',view);
  let base=bars.find(b=>b.querySelector('#search'))||bars.find(b=>b.id!=='p135RedeToolbar')||bars[0];
  if(!base)return null;
  const external=$('#p135RedeToolbar',view);
  const legend=$('#p158RedeLegend');
  if(external&&external!==base){
    if(legend)base.appendChild(legend);
    external.remove();
  }
  bars.filter(b=>b!==base&&b!==external).forEach(b=>b.remove());
  base.id='p135RedeToolbar';
  base.classList.add('p161-unified');
  return base;
}
function mount(){
  const view=$('#viewRede');if(!view)return false;
  const base=pickBase(view);if(!base)return false;

  const heading=$('.p135-rede-heading',base)||$('.p135-rede-title',base);
  if(heading){heading.classList.remove('p135-rede-title');heading.classList.add('p135-rede-heading');const s=$('small',heading);if(s)s.textContent='pessoas e relações';}
  let modes=$('.p135-rede-modes',base)||$('.p135-modes',base);
  if(modes){modes.classList.remove('p135-modes');modes.classList.add('p135-rede-modes')}
  let insight=$('#p135RedeInsight',base)||$('.p135-insight',base);
  if(insight){insight.classList.remove('p135-insight');insight.classList.add('p135-rede-insight')}

  let row=$('.p161-control-row',base);
  if(!row){row=document.createElement('div');row.className='p161-control-row';if(modes)modes.insertAdjacentElement('beforebegin',row);if(modes)row.appendChild(modes)}
  let toggle=$('#p161SettingsToggle',base);
  if(!toggle){toggle=document.createElement('button');toggle.type='button';toggle.id='p161SettingsToggle';toggle.className='p161-settings-toggle';toggle.setAttribute('aria-expanded','false');toggle.innerHTML='⚙ Ajustes';row.appendChild(toggle)}

  let panel=$('#p161RedeSettings',base);
  if(!panel){panel=document.createElement('div');panel.id='p161RedeSettings';panel.innerHTML='<div class="p161-settings-head"><b>Ajustes e filtros</b><small>toque novamente em Ajustes para fechar</small></div>';base.appendChild(panel)}

  const side=$('#side');if(side&&side.parentElement!==panel)panel.appendChild(side);
  const controls=$('#viewRede .graph-controls')||$('#p135RedeSettings .graph-controls')||$('.graph-controls');
  if(controls&&controls.parentElement!==panel){controls.style.removeProperty('display');panel.appendChild(controls)}
  if(controls)controls.style.display='';

  ensurePlaceholder();
  toggle.onclick=()=>{
    const open=!panel.classList.contains('open');
    panel.classList.toggle('open',open);toggle.setAttribute('aria-expanded',String(open));
  };
  $('#sideCloseBtn')?.addEventListener('click',()=>{panel.classList.remove('open');toggle.setAttribute('aria-expanded','false')});
  bindModes(base);bindFit();
  return true;
}
function repair(){
  if(mount())return;
  setTimeout(mount,80);
}
function boot(){
  css();repair();
  [180,650,1200,2100].forEach(ms=>setTimeout(repair,ms));
  document.addEventListener('carbonautas:viewchange',repair);
  const mo=new MutationObserver(ms=>{
    if(ms.some(m=>m.type==='attributes'&&m.attributeName==='data-view')&&document.body.dataset.view==='rede')setTimeout(repair,0);
  });
  mo.observe(document.body,{attributes:true,attributeFilter:['data-view']});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
