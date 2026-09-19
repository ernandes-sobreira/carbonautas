/* Carbonautas P156 · acabamento leve da Rede no mobile
   Mantém apenas o layout da ficha e da linha do tempo.
   A estilização das ligações fica no módulo da Rede para evitar observadores duplicados. */
(function(){
'use strict';
if(window.__CARBONAUTAS_P155_REDE_UI)return;
window.__CARBONAUTAS_P155_REDE_UI=true;

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));

function polishTimeline(){
  const timeline=$('#viewRede #p128Timeline');
  if(!timeline)return;
  timeline.setAttribute('aria-label','Linha do tempo da pessoa');
  $$('li',timeline).forEach(li=>{
    Array.from(li.childNodes).forEach(node=>{
      if(node.nodeType===3&&node.textContent){
        node.textContent=node.textContent.replace(/Orientação\s*·\s*Orientação\s*·\s*/i,'Orientação · ');
      }
    });
  });
}

function injectCss(){
  if($('#p155RedeUiStyle'))return;
  const st=document.createElement('style');
  st.id='p155RedeUiStyle';
  st.textContent=`
@media (max-width:920px){
  #viewRede .main{position:relative!important;overflow:hidden!important}
  #viewRede #detail.detail.open{
    position:absolute!important;inset:0!important;width:100%!important;max-width:none!important;
    height:100%!important;max-height:none!important;flex:0 0 100%!important;z-index:60!important;
    border:0!important;border-radius:0!important;box-shadow:none!important;background:#fff!important;overflow:hidden!important
  }
  #viewRede #detail .detail-inner{
    width:100%!important;height:100%!important;max-height:none!important;overflow-y:auto!important;overflow-x:hidden!important;
    padding:0 0 calc(82px + env(safe-area-inset-bottom))!important;-webkit-overflow-scrolling:touch
  }
  #viewRede #detail .dh{padding:18px 18px 15px!important}
  #viewRede #detail .dsec{padding:14px 18px!important}
  #viewRede #detail .dactions{padding:14px 18px!important;gap:8px!important}
  #viewRede #p128Timeline{margin:8px 18px 0!important;padding:16px 0 0!important;border-top:1px solid #e3ecea!important}
  #viewRede #p128Timeline h4{margin:0 0 12px!important;font-size:15px!important;line-height:1.2!important;font-weight:850!important;color:#173541!important}
  #viewRede #p128Timeline ol{margin:0!important;padding:0!important;border-left:0!important;display:flex!important;flex-direction:column!important;gap:8px!important}
  #viewRede #p128Timeline li{
    position:relative!important;display:grid!important;grid-template-columns:72px minmax(0,1fr)!important;column-gap:10px!important;
    align-items:start!important;margin:0!important;padding:10px 12px 10px 18px!important;border:1px solid #e2ebe9!important;
    border-radius:13px!important;background:#fbfdfd!important;font-size:12.5px!important;line-height:1.38!important;color:#294750!important;
    overflow-wrap:anywhere!important;word-break:normal!important
  }
  #viewRede #p128Timeline li:before{left:7px!important;top:15px!important;width:6px!important;height:6px!important}
  #viewRede #p128Timeline li time{display:block!important;margin:0!important;font-size:10.5px!important;line-height:1.35!important;color:#74888e!important;white-space:normal!important}
  #viewRede #p128Timeline .p128-more{width:100%!important;margin-top:10px!important;padding:9px 12px!important}
}
`;
  document.head.appendChild(st);
}

function boot(){
  injectCss();
  document.addEventListener('click',e=>{
    if(e.target.closest?.('#graph g.node,.p128-more')){
      requestAnimationFrame(polishTimeline);
      setTimeout(polishTimeline,60);
    }
  },true);
  polishTimeline();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
