/* Carbonautas P158 · legenda visual da Rede
   Explica o significado de cada tipo de linha sem alterar o motor do grafo. */
(function(){
'use strict';
if(window.__CARBONAUTAS_P158_REDE_LEGENDA)return;
window.__CARBONAUTAS_P158_REDE_LEGENDA=true;

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));

function css(){
  if($('#p158RedeLegendaStyle'))return;
  const st=document.createElement('style');
  st.id='p158RedeLegendaStyle';
  st.textContent=`
.p158-rede-legend{order:5;flex:1 1 100%;display:flex;align-items:center;gap:8px;overflow-x:auto;padding:1px 0 2px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.p158-rede-legend::-webkit-scrollbar{display:none}
.p158-legend-label{flex:0 0 auto;font-size:9px;font-weight:900;letter-spacing:.04em;text-transform:uppercase;color:#7a8d94}
.p158-legend-item{flex:0 0 auto;display:inline-flex;align-items:center;gap:6px;min-height:26px;padding:4px 7px;border:1px solid #e0e9e7;border-radius:999px;background:#fff;color:#506970;font-size:9.5px;font-weight:800;white-space:nowrap}
.p158-legend-item.on{border-color:#b8d8d5;background:#f4fbfa;color:#173f49}
.p158-line{display:inline-block;width:28px;height:0;border-top-style:solid;border-radius:999px;flex:0 0 auto}
.p158-line.orientation{border-top-width:5px;border-top-color:#168f94}
.p158-line.production{border-top-width:3px;border-top-color:#6c5ce0;border-top-style:dashed}
.p158-line.projects{border-top-width:3px;border-top-color:#2e9e5b}
.p158-line.other{border-top-width:2px;border-top-color:#c7d6d6}
@media(max-width:760px){.p158-rede-legend{gap:6px}.p158-legend-label{font-size:8.5px}.p158-legend-item{font-size:9px;min-height:25px;padding:4px 6px}.p158-line{width:24px}.p158-line.orientation{border-top-width:5px}}
`;
  document.head.appendChild(st);
}

function sync(){
  const legend=$('#p158RedeLegend');
  if(!legend)return;
  const mode=String(window.__p135NetworkMode||'all');
  $$('.p158-legend-item',legend).forEach(el=>el.classList.toggle('on',mode!=='all'&&el.dataset.mode===mode));
}

function mount(){
  const bar=$('#p135RedeToolbar');
  if(!bar)return false;
  if(!$('#p158RedeLegend')){
    const legend=document.createElement('div');
    legend.id='p158RedeLegend';
    legend.className='p158-rede-legend';
    legend.setAttribute('aria-label','Legenda das ligações da Rede');
    legend.innerHTML=`
      <span class="p158-legend-label">Linhas</span>
      <span class="p158-legend-item" data-mode="orientation"><i class="p158-line orientation"></i>Orientação · grossura = nº de orientações</span>
      <span class="p158-legend-item" data-mode="production"><i class="p158-line production"></i>Produção</span>
      <span class="p158-legend-item" data-mode="projects"><i class="p158-line projects"></i>Projetos</span>
      <span class="p158-legend-item" data-mode="other"><i class="p158-line other"></i>Outros vínculos</span>`;
    bar.appendChild(legend);
    bar.addEventListener('click',e=>{if(e.target.closest?.('[data-p135-mode]'))setTimeout(sync,0)},true);
  }
  sync();
  return true;
}

function boot(){
  css();
  if(mount())return;
  const mo=new MutationObserver(()=>{if(mount())mo.disconnect()});
  mo.observe(document.body,{childList:true,subtree:true});
  [150,500,1200,2200].forEach(ms=>setTimeout(mount,ms));
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
