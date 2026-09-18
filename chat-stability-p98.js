/* Carbonautas P104 · estabilidade das abas de conversa + composer maior */
(function(){
'use strict';
const VERSION='P104';
let panelActive=false,hiddenGeneral=null,obs=null;
const $=(s,r=document)=>r.querySelector(s);

function injectCss(){
  if($('#p98ChatStableStyle'))return;
  const s=document.createElement('style');
  s.id='p98ChatStableStyle';
  s.textContent=`
  /* Panelinha só recebe destaque quando a tela real aberta é Mensagens */
  body.p98-panel-active[data-view="mensagens"] #subNav [data-sub-view="mensagens"]{background:#fff!important;color:#516a72!important;border-color:#d5e1e2!important;box-shadow:none!important}
  body.p98-panel-active[data-view="mensagens"] #subNav .p46-panel-btn{background:#168f94!important;color:#fff!important;border-color:#168f94!important;box-shadow:0 8px 22px rgba(22,143,148,.14)!important}
  body:not([data-view="mensagens"]) #subNav .p46-panel-btn{background:#fff!important;color:#516a72!important;border-color:#d5e1e2!important;box-shadow:none!important}
  [data-p98-general-sentinel]{display:none!important;position:absolute!important;width:0!important;height:0!important;overflow:hidden!important;pointer-events:none!important;visibility:hidden!important}

  /* Campo de conversa: confortável em todas as três modalidades */
  .private-composer-zone,.p46-compose,.p48-compose{box-sizing:border-box!important}
  #privateInput,#p46Input,#p48Input{min-height:52px!important;height:52px!important;max-height:148px!important;padding:13px 14px!important;border-radius:16px!important;line-height:1.38!important}
  .private-composer,.p46-compose-row,.p48-compose-row{align-items:flex-end!important}
  #privateSendBtn,#p46Send,#p48Send{min-height:50px!important;height:50px!important;border-radius:15px!important}
  #privateEmojiToggle,#p79PrivateClip,#p79GeneralClip{min-height:50px!important;height:50px!important;border-radius:14px!important}
  .p48-topic,.p46-topic-select{min-height:50px!important;height:50px!important;border-radius:14px!important}

  @media(min-width:761px){
    .private-composer-zone,.p46-compose,.p48-compose{padding:10px 14px!important}
    #privateInput,#p46Input,#p48Input{font-size:14px!important}
  }

  @media(max-width:760px){
    .private-composer-zone.show{left:7px!important;right:7px!important;width:auto!important;padding:9px!important;border-radius:19px!important}
    .private-composer{display:grid!important;grid-template-columns:38px 38px minmax(0,1fr) 48px!important;gap:6px!important;width:100%!important;min-width:0!important}
    #privateEmojiToggle,#p79PrivateClip{width:38px!important;min-width:38px!important;max-width:38px!important}
    #privateSendBtn{width:48px!important;min-width:48px!important;max-width:48px!important}
    #privateInput{width:100%!important;min-width:0!important;font-size:16px!important}

    .p46-compose{left:7px!important;right:7px!important;width:auto!important;padding:9px!important;border-radius:19px!important}
    .p46-compose-row{display:grid!important;grid-template-columns:70px 38px minmax(0,1fr) 48px!important;gap:6px!important;width:100%!important;min-width:0!important}
    .p46-topic-select{width:70px!important;min-width:70px!important;max-width:70px!important;font-size:10px!important;padding:5px!important}
    #p79GeneralClip{width:38px!important;min-width:38px!important;max-width:38px!important}
    #p46Send{width:48px!important;min-width:48px!important;max-width:48px!important}
    #p46Input{width:100%!important;min-width:0!important;font-size:16px!important}

    #p48GroupsRoot{min-height:0!important;height:100%!important}
    .p48-shell{min-height:0!important;height:100%!important}
    .p48-main{min-height:0!important;overflow:hidden!important}
    .p48-msgs{padding-bottom:14px!important}
    .p48-compose{position:sticky!important;bottom:0!important;z-index:25!important;padding:9px 8px max(9px,env(safe-area-inset-bottom))!important;background:rgba(255,255,255,.98)!important;box-shadow:0 -10px 28px rgba(18,52,61,.08)!important}
    .p48-compose-row{display:grid!important;grid-template-columns:76px minmax(0,1fr) 48px!important;gap:6px!important;width:100%!important;min-width:0!important}
    .p48-topic{width:76px!important;min-width:76px!important;max-width:76px!important;font-size:10px!important;padding:5px!important}
    #p48Input{width:100%!important;min-width:0!important;font-size:16px!important}
    #p48Send{width:48px!important;min-width:48px!important;max-width:48px!important}
  }
  `;
  document.head.appendChild(s);
}

function captureGeneralShell(){
  const view=$('#viewMensagens');
  const shell=view?.querySelector('.p46-shell:not([data-p98-general-sentinel])');
  if(shell){
    hiddenGeneral=shell.cloneNode(true);
    hiddenGeneral.setAttribute('data-p98-general-sentinel','1');
    hiddenGeneral.setAttribute('aria-hidden','true');
  }
}

function installSentinel(){
  if(!panelActive||document.body.dataset.view!=='mensagens')return;
  const view=$('#viewMensagens');
  const root=view?.querySelector('#p48GroupsRoot');
  if(!view||!root)return;
  if(!view.querySelector('.p46-shell')){
    if(hiddenGeneral){
      const clone=hiddenGeneral.cloneNode(true);
      clone.setAttribute('data-p98-general-sentinel','1');
      root.appendChild(clone);
    }else{
      const stub=document.createElement('div');
      stub.className='p46-shell';stub.setAttribute('data-p98-general-sentinel','1');stub.setAttribute('aria-hidden','true');
      stub.innerHTML='<div id="p46ChatTitle"></div><div id="p46ChatSub"></div><div id="p46ChatIcon"></div><div id="p46Topics"></div><div id="p46SideList"></div><div id="p46Msgs"></div><div id="p46Replying"></div>';
      root.appendChild(stub);
    }
  }
  document.body.classList.add('p98-panel-active');
}

function leavePanelMode(){
  panelActive=false;
  document.body.classList.remove('p98-panel-active');
  document.querySelectorAll('[data-p98-general-sentinel]').forEach(n=>n.remove());
  const nav=$('#subNav');
  nav?.querySelector('.p46-panel-btn')?.classList.remove('on');
}

function syncActualTab(){
  const view=document.body.dataset.view||'';
  const nav=$('#subNav');
  if(view!=='mensagens'){
    if(panelActive||document.body.classList.contains('p98-panel-active'))leavePanelMode();
    if(view==='conversas'){
      nav?.querySelector('[data-sub-view="conversas"]')?.classList.add('on');
      nav?.querySelector('[data-sub-view="mensagens"]')?.classList.remove('on');
      nav?.querySelector('.p46-panel-btn')?.classList.remove('on');
    }
    return;
  }
  if(panelActive){
    nav?.querySelector('.p46-panel-btn')?.classList.add('on');
    nav?.querySelector('[data-sub-view="mensagens"]')?.classList.remove('on');
  }
}

function watchMensagens(){
  const view=$('#viewMensagens');
  if(!view||obs)return;
  obs=new MutationObserver(()=>{
    syncActualTab();
    if(panelActive&&document.body.dataset.view==='mensagens'&&view.querySelector('#p48GroupsRoot'))installSentinel();
  });
  obs.observe(view,{childList:true,subtree:true});
  new MutationObserver(syncActualTab).observe(document.body,{attributes:true,attributeFilter:['data-view']});
}

function bindTabGuard(){
  window.addEventListener('click',e=>{
    const panel=e.target.closest?.('#subNav .p46-panel-btn');
    if(panel){
      captureGeneralShell();
      panelActive=true;
      document.body.classList.add('p98-panel-active');
      queueMicrotask(installSentinel);
      setTimeout(installSentinel,0);
      setTimeout(installSentinel,60);
      setTimeout(installSentinel,220);
      return;
    }
    const general=e.target.closest?.('#subNav [data-sub-view="mensagens"]');
    const priv=e.target.closest?.('#subNav [data-sub-view="conversas"]');
    if(general||priv)leavePanelMode();
    if(priv)setTimeout(syncActualTab,0);
  },true);
}

function keepState(){
  const view=document.body.dataset.view||'';
  if(view!=='mensagens'){
    leavePanelMode();
    syncActualTab();
    return;
  }
  if($('#p48GroupsRoot')){
    if(!panelActive){captureGeneralShell();panelActive=true}
    installSentinel();
  }
  syncActualTab();
}

function grow(id,min=52,max=148){
  const el=$(id);if(!el||el.dataset.p98Grow)return;
  el.dataset.p98Grow='1';
  const run=()=>{el.style.height=min+'px';el.style.height=Math.min(max,Math.max(min,el.scrollHeight))+'px'};
  el.addEventListener('input',run);el.addEventListener('focus',()=>setTimeout(run,80));run();
}

function boot(){
  injectCss();watchMensagens();bindTabGuard();keepState();
  setInterval(()=>{keepState();grow('#privateInput');grow('#p46Input');grow('#p48Input')},450);
  console.info('Carbonautas',VERSION,'abas sincronizadas com a tela real + campos de conversa ampliados');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
