/* Carbonautas P92 · Arquivo Vivo soft, elegante e jovial */
(function(){
'use strict';
const BUILD='P92';
const $=(s,r=document)=>r.querySelector(s);
function injectCss(){
  if($('#p92SoftStyle')) return;
  const st=document.createElement('style');
  st.id='p92SoftStyle';
  st.textContent=`
  /* Arquivo Vivo: base mais leve */
  #p88Archive{background:linear-gradient(160deg,#fcfefe 0%,#f6fbfa 54%,#f8f7fd 100%)!important;border:1px solid #dce9ea!important;box-shadow:0 18px 54px rgba(24,65,77,.07)!important}
  #p88Archive .p88-head{background:linear-gradient(135deg,#fbfefe,#f5fafb 62%,#f8f6fc)!important}
  #p88Archive .p88-search{border-color:#d2e1e4!important;box-shadow:0 7px 22px rgba(31,77,89,.05)!important;background:rgba(255,255,255,.94)!important}
  #p88Archive .p88-mode{background:rgba(255,255,255,.9)!important;border-color:#d6e3e5!important;box-shadow:0 4px 12px rgba(29,67,78,.03)!important}
  #p88Archive .p88-mode.on{background:#178c95!important;border-color:#178c95!important;color:#fff!important;box-shadow:0 8px 22px rgba(23,140,149,.17)!important}
  #p88Archive .p88-folder{background:linear-gradient(150deg,#fff,#f8fbfb)!important;border-color:#d7e4e6!important;box-shadow:0 11px 28px rgba(18,57,69,.055)!important}
  #p88Archive .p88-folder:nth-child(5n+1) .p88-folder-icon{background:#e9f5ff!important}
  #p88Archive .p88-folder:nth-child(5n+2) .p88-folder-icon{background:#edf7ee!important}
  #p88Archive .p88-folder:nth-child(5n+3) .p88-folder-icon{background:#f2edfb!important}
  #p88Archive .p88-folder:nth-child(5n+4) .p88-folder-icon{background:#fff0e8!important}
  #p88Archive .p88-folder:nth-child(5n) .p88-folder-icon{background:#faf4df!important}

  /* Deck: cores mudam suavemente a cada carta */
  #p90Deck .p90-table{--p92-accent:#72b9db;--p92-wash:#f4fbff;--p92-back1:#dcefff;--p92-back2:#eaf6ee;transition:background .22s ease,box-shadow .22s ease,border-color .22s ease!important;background:linear-gradient(155deg,#ffffff 0%,var(--p92-wash) 100%)!important;border-color:rgba(255,255,255,.92)!important;box-shadow:0 36px 100px rgba(15,49,61,.30)!important}
  #p90Deck .p90-table[data-p92-tone="0"]{--p92-accent:#72b9db;--p92-wash:#f3faff;--p92-back1:#dcefff;--p92-back2:#e8f6ee}
  #p90Deck .p90-table[data-p92-tone="1"]{--p92-accent:#75b99a;--p92-wash:#f4fbf6;--p92-back1:#dff2e6;--p92-back2:#e8ecff}
  #p90Deck .p90-table[data-p92-tone="2"]{--p92-accent:#9c8bd2;--p92-wash:#f8f6fd;--p92-back1:#e8e2f8;--p92-back2:#faeadf}
  #p90Deck .p90-table[data-p92-tone="3"]{--p92-accent:#d79b7d;--p92-wash:#fff8f4;--p92-back1:#f9e6dc;--p92-back2:#e5f2fb}
  #p90Deck .p90-table[data-p92-tone="4"]{--p92-accent:#c4aa62;--p92-wash:#fffbf2;--p92-back1:#f5edcf;--p92-back2:#e9e4f6}
  #p90Deck .p90-table:before{background:var(--p92-back1)!important;transition:background .22s ease!important}
  #p90Deck .p90-table:after{background:var(--p92-back2)!important;transition:background .22s ease!important}
  #p90Deck .p90-head{background:rgba(255,255,255,.94)!important}
  #p90Deck .p90-stage-wrap{background:linear-gradient(180deg,color-mix(in srgb,var(--p92-wash) 82%,white),rgba(255,255,255,.7))!important}
  #p90Deck .p90-card-shell>.pub-row,#p90Deck .p90-card-shell>.repo-package-card{background:linear-gradient(180deg,#fff 0%,var(--p92-wash) 100%)!important;border:1px solid color-mix(in srgb,var(--p92-accent) 35%,#dfe9eb)!important;border-left:5px solid var(--p92-accent)!important;box-shadow:0 20px 52px color-mix(in srgb,var(--p92-accent) 12%,rgba(17,52,64,.12))!important;transition:border-color .22s ease,background .22s ease,box-shadow .22s ease!important}
  #p90Deck .p90-card-shell .pub-categoria,#p90Deck .p90-card-shell .chip,#p90Deck .p90-card-shell .badge{border-color:color-mix(in srgb,var(--p92-accent) 32%,#d9e4e6)!important}
  #p90Deck .p90-nav .next{background:#178c95!important;border-color:#178c95!important;box-shadow:0 7px 18px rgba(23,140,149,.16)!important}
  #p90Deck .p90-count b{color:#183842!important}

  @media(max-width:680px){
    #p90Deck{background:radial-gradient(circle at 50% 18%,rgba(205,237,241,.20),transparent 46%)!important}
    #p90Deck .p90-table{border-radius:24px!important}
    #p90Deck .p90-table:before{transform:translateY(2px) rotate(-.8deg)!important;opacity:.94!important}
    #p90Deck .p90-table:after{transform:translateY(1px) rotate(.45deg)!important;opacity:.96!important}
    #p90Deck .p90-card-shell>.pub-row,#p90Deck .p90-card-shell>.repo-package-card{border-radius:20px!important}
    #p90Deck .p90-head,#p90Deck .p90-nav{backdrop-filter:blur(10px)!important}
  }
  `;
  document.head.appendChild(st);
}
function toneFromCount(){
  const txt=$('#p90Count')?.textContent||'';
  const n=parseInt(txt,10)||1;
  return String((Math.max(1,n)-1)%5);
}
function applyTone(){
  const table=$('#p90Deck .p90-table');
  if(!table)return;
  const tone=toneFromCount();
  if(table.dataset.p92Tone!==tone)table.dataset.p92Tone=tone;
}
function watchDeck(){
  const deck=$('#p90Deck');
  if(!deck){setTimeout(watchDeck,350);return}
  applyTone();
  const count=$('#p90Count',deck),stage=$('#p90Stage',deck);
  const obs=new MutationObserver(()=>requestAnimationFrame(applyTone));
  if(count)obs.observe(count,{childList:true,subtree:true,characterData:true});
  if(stage)obs.observe(stage,{childList:true});
}
function boot(){
  injectCss();watchDeck();
  try{const u=new URL(location.href);if(u.searchParams.get('build')!==BUILD){u.searchParams.set('build',BUILD);u.searchParams.delete('pwa');history.replaceState(null,'',u.href)}}catch(_e){}
  window.CARBONAUTAS_RUNTIME_BUILD=BUILD;
  console.info('Carbonautas P92 visual soft do Arquivo Vivo carregado');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();