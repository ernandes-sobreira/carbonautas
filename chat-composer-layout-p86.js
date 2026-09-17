/* Carbonautas P86 · composer consistente no PC e acima do teclado no celular */
(function(){
'use strict';
const VERSION='P86';
let ro=null;
const q=(s,r=document)=>r.querySelector(s);
function canonicalize(){try{const u=new URL(location.href);if(u.searchParams.get('build')!==VERSION){u.searchParams.set('build',VERSION);u.searchParams.delete('pwa');history.replaceState(null,'',u.href)}}catch(_e){}}
function ensureCss(){
  if(q('#p86ComposerStyle'))return;
  const s=document.createElement('style');s.id='p86ComposerStyle';s.textContent=`
:root{--p86-kb:0px;--p86-private-h:72px;--p86-general-h:68px}
.private-composer-zone{width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important}
.private-composer{display:flex!important;align-items:flex-end!important;gap:8px!important;width:100%!important;max-width:100%!important;min-width:0!important}
#privateEmojiToggle,#p79PrivateClip{flex:0 0 42px!important;width:42px!important;height:44px!important;min-width:42px!important;max-width:42px!important;margin:0!important;padding:0!important;display:grid!important;place-items:center!important;border-radius:12px!important}
#privateInput{display:block!important;flex:1 1 auto!important;width:auto!important;min-width:120px!important;max-width:none!important;min-height:44px!important;height:44px!important;max-height:132px!important;margin:0!important;padding:10px 12px!important;box-sizing:border-box!important;resize:none!important;overflow-y:auto!important}
#privateSendBtn{flex:0 0 48px!important;width:48px!important;height:44px!important;min-width:48px!important;max-width:48px!important;margin:0!important;padding:0!important;display:grid!important;place-items:center!important;border-radius:13px!important}
.p46-compose-row{display:flex!important;align-items:flex-end!important;gap:8px!important;width:100%!important;max-width:100%!important;min-width:0!important}
.p46-topic-select{flex:0 0 auto!important}.p46-compose-row #p79GeneralClip{flex:0 0 40px!important}.p46-compose-row #p46Input{flex:1 1 auto!important;width:auto!important;min-width:120px!important;max-width:none!important}.p46-compose-row #p46Send{flex:0 0 44px!important}
@media(min-width:761px){
  .private-composer-zone{position:relative!important;left:auto!important;right:auto!important;bottom:auto!important;padding:9px 12px!important;background:#fff!important}
  .private-composer{width:100%!important}
  #privateInput{font-size:14px!important}
  .p46-compose{position:relative!important;left:auto!important;right:auto!important;bottom:auto!important;width:100%!important}
}
@media(max-width:760px){
  #viewConversas.on .private-composer-zone{position:fixed!important;left:8px!important;right:8px!important;bottom:calc(var(--p86-kb) + max(10px,env(safe-area-inset-bottom)))!important;width:auto!important;z-index:2147483000!important;background:#fff!important;border:1px solid #d7e4e7!important;border-radius:17px!important;padding:8px!important;box-shadow:0 10px 30px rgba(7,24,39,.16)!important}
  #viewConversas.on .private-messages{padding-bottom:calc(var(--p86-private-h) + 26px)!important;scroll-padding-bottom:calc(var(--p86-private-h) + 26px)!important}
  .private-composer{gap:6px!important}
  #privateEmojiToggle,#p79PrivateClip{flex-basis:40px!important;width:40px!important;min-width:40px!important;max-width:40px!important;height:46px!important}
  #privateInput{min-width:0!important;min-height:46px!important;height:46px!important;max-height:118px!important;font-size:16px!important;line-height:1.35!important;border-radius:13px!important}
  #privateSendBtn{flex-basis:46px!important;width:46px!important;min-width:46px!important;max-width:46px!important;height:46px!important}
  #p79PrivateTray,.private-replying,.private-emoji-bar{max-width:100%!important;min-width:0!important}
  #viewMensagens.on .p46-compose{position:fixed!important;left:8px!important;right:8px!important;bottom:calc(var(--p86-kb) + max(10px,env(safe-area-inset-bottom)))!important;width:auto!important;z-index:2147483000!important;background:#fff!important;border:1px solid #d7e4e7!important;border-radius:17px!important;padding:8px!important;box-shadow:0 10px 30px rgba(7,24,39,.16)!important}
  #viewMensagens.on .p46-msgs{padding-bottom:calc(var(--p86-general-h) + 26px)!important;scroll-padding-bottom:calc(var(--p86-general-h) + 26px)!important}
  .p46-compose-row{gap:6px!important}.p46-topic-select{max-width:76px!important;min-width:64px!important;height:46px!important;font-size:10px!important}.p46-compose-row #p79GeneralClip{flex-basis:40px!important;width:40px!important;min-width:40px!important;height:46px!important}.p46-compose-row #p46Input{min-width:0!important;min-height:46px!important;height:46px!important;max-height:118px!important;font-size:16px!important}.p46-compose-row #p46Send{flex-basis:46px!important;width:46px!important;min-width:46px!important;height:46px!important}
}
`;
  document.head.appendChild(s)
}
function autoGrow(el,min,max){
  if(!el)return;
  const h=()=>{el.style.height=min+'px';el.style.height=Math.min(max,Math.max(min,el.scrollHeight))+'px';measure()};
  if(!el.dataset.p86Grow){el.dataset.p86Grow='1';el.addEventListener('input',h);el.addEventListener('focus',()=>{setTimeout(()=>{syncViewport();h();scrollChatBottom()},80);setTimeout(()=>{syncViewport();scrollChatBottom()},320)});el.addEventListener('blur',()=>setTimeout(syncViewport,80))}
  h()
}
function syncViewport(){
  const vv=window.visualViewport;
  let kb=0;
  if(vv){kb=Math.max(0,Math.round(window.innerHeight-vv.height-vv.offsetTop));}
  document.documentElement.style.setProperty('--p86-kb',kb+'px');
  measure()
}
function measure(){
  const p=q('.private-composer-zone');if(p){document.documentElement.style.setProperty('--p86-private-h',Math.ceil(p.getBoundingClientRect().height)+'px')}
  const g=q('.p46-compose');if(g){document.documentElement.style.setProperty('--p86-general-h',Math.ceil(g.getBoundingClientRect().height)+'px')}
}
function scrollChatBottom(){
  if(document.activeElement?.id==='privateInput'){const m=q('.private-messages');if(m)m.scrollTop=m.scrollHeight}
  if(document.activeElement?.id==='p46Input'){const m=q('.p46-msgs');if(m)m.scrollTop=m.scrollHeight}
}
function bindResize(){
  if(ro)return;ro=new ResizeObserver(()=>measure());
  const p=q('.private-composer-zone'),g=q('.p46-compose');if(p)ro.observe(p);if(g)ro.observe(g)
}
function tick(){canonicalize();ensureCss();autoGrow(q('#privateInput'),44,132);autoGrow(q('#p46Input'),44,118);bindResize();syncViewport()}
if(window.visualViewport){window.visualViewport.addEventListener('resize',syncViewport);window.visualViewport.addEventListener('scroll',syncViewport)}
window.addEventListener('resize',syncViewport);window.addEventListener('focus',()=>{canonicalize();syncViewport()});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',tick,{once:true});else tick();
setInterval(tick,1200);
console.info('Carbonautas',VERSION,'composer PC/mobile carregado');
})();
