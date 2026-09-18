/* Carbonautas P89 · Deck dinâmico de cards do Arquivo Vivo */
(function(){
'use strict';
const BUILD='P89';
let activeId='';
let startX=0,startY=0,startAt=0;
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];

function injectCss(){
  if($('#p89DeckStyle'))return;
  const s=document.createElement('style');s.id='p89DeckStyle';s.textContent=`
    #p88Float:not([hidden]) .p88-float-backdrop{animation:p89Fade .18s ease both;background:rgba(3,16,27,.72)!important;backdrop-filter:blur(10px)}
    #p88Float:not([hidden]) .p88-float-card{position:relative;isolation:isolate;animation:p89Pop .34s cubic-bezier(.18,.88,.28,1.16) both;transform-origin:50% 62%;overflow:visible!important}
    #p88Float:not([hidden]) .p88-float-card:before,#p88Float:not([hidden]) .p88-float-card:after{content:"";position:absolute;inset:18px 28px -14px;border-radius:28px;background:#dbe8ea;z-index:-2;opacity:.55;transform:rotate(-1.4deg)}
    #p88Float:not([hidden]) .p88-float-card:after{inset:11px 17px -8px;background:#eef5f6;z-index:-1;opacity:.9;transform:rotate(.8deg)}
    #p88Float .p89-deckbar{display:grid;grid-template-columns:minmax(110px,1fr) auto minmax(110px,1fr);align-items:center;gap:12px;padding:12px 18px 14px;border-top:1px solid #e2ebed;background:linear-gradient(180deg,#fbfefe,#f3f8f9);border-radius:0 0 24px 24px;position:sticky;bottom:0;z-index:6}
    #p88Float .p89-nav{height:46px;border:1px solid #cbdadd;border-radius:14px;background:#fff;color:#17313d;font-weight:900;font-size:13px;padding:0 16px;display:inline-flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 14px rgba(17,48,61,.05)}
    #p88Float .p89-nav.next{background:#0e8897;border-color:#0e8897;color:#fff;justify-self:end}
    #p88Float .p89-nav.prev{justify-self:start}
    #p88Float .p89-nav:disabled{opacity:.32;cursor:default;box-shadow:none}
    #p88Float .p89-progress{text-align:center;min-width:118px;color:#6a7e86;line-height:1.18}
    #p88Float .p89-progress b{display:block;color:#17313d;font-size:13px}.p89-progress small{font-size:10px;font-weight:800;letter-spacing:.05em;text-transform:uppercase}
    #p88Float .p89-hint{position:absolute;left:50%;bottom:-38px;transform:translateX(-50%);color:#d9e7e9;font-size:11px;font-weight:800;white-space:nowrap;pointer-events:none;text-shadow:0 1px 5px #001}
    #p88Float.p89-switch .p88-float-card{animation:p89Switch .2s ease both}
    @keyframes p89Fade{from{opacity:0}to{opacity:1}}
    @keyframes p89Pop{0%{opacity:0;transform:translateY(44px) scale(.82) rotateX(7deg)}65%{opacity:1;transform:translateY(-5px) scale(1.018) rotateX(0)}100%{opacity:1;transform:none}}
    @keyframes p89Switch{0%{opacity:.35;transform:translateX(var(--p89dir,18px)) scale(.96)}100%{opacity:1;transform:none}}
    @media(max-width:760px){
      #p88Float .p88-float-card{width:calc(100vw - 22px)!important;max-width:none!important;max-height:calc(100dvh - 30px)!important;border-radius:24px!important}
      #p88Float .p88-float-card:before{inset:14px 16px -10px;border-radius:24px}#p88Float .p88-float-card:after{inset:8px 9px -5px;border-radius:24px}
      #p88Float .p89-deckbar{grid-template-columns:1fr auto 1fr;padding:10px 11px calc(10px + env(safe-area-inset-bottom));gap:7px;border-radius:0 0 22px 22px}
      #p88Float .p89-nav{height:44px;min-width:0;padding:0 11px;font-size:12px}.p89-progress{min-width:72px!important}.p89-progress b{font-size:12px!important}.p89-progress small{font-size:8px!important}
      #p88Float .p89-hint{display:none}
      #p88FloatStage{touch-action:pan-y}
    }
    @media(prefers-reduced-motion:reduce){#p88Float:not([hidden]) .p88-float-card,#p88Float:not([hidden]) .p88-float-backdrop,#p88Float.p89-switch .p88-float-card{animation:none!important}}
  `;document.head.appendChild(s);
}

function deckButtons(){return $$('#p88Body .p88-file[data-p88-item]').filter(b=>b.offsetParent!==null)}
function indexNow(){const list=deckButtons();return {list,index:list.findIndex(b=>b.dataset.p88Item===activeId)}}
function folderLabel(){return $('#p88Crumb b')?.textContent?.trim()||'Arquivo Vivo'}
function ensureDeckbar(){
  const card=$('#p88Float .p88-float-card');if(!card)return;
  let bar=$('.p89-deckbar',card);
  if(!bar){
    bar=document.createElement('div');bar.className='p89-deckbar';bar.innerHTML=`<button type="button" class="p89-nav prev">← Anterior</button><div class="p89-progress"><small id="p89Folder">Arquivo Vivo</small><b id="p89Count">1 de 1</b></div><button type="button" class="p89-nav next">Próximo →</button><span class="p89-hint">← → para folhear · arraste no celular</span>`;card.appendChild(bar);
    $('.p89-nav.prev',bar).addEventListener('click',()=>navigate(-1));
    $('.p89-nav.next',bar).addEventListener('click',()=>navigate(1));
  }
  const {list,index}=indexNow();
  $('#p89Folder',bar).textContent=folderLabel();
  $('#p89Count',bar).textContent=index>=0?`${index+1} de ${list.length}`:`1 de ${Math.max(1,list.length)}`;
  $('.p89-nav.prev',bar).disabled=index<=0;
  $('.p89-nav.next',bar).disabled=index<0||index>=list.length-1;
}
function prepareOpen(id){
  activeId=id||activeId;
  setTimeout(()=>{
    const ov=$('#p88Float');if(!ov||ov.hidden)return;
    ensureDeckbar();
    const card=$('.p88-float-card',ov);if(card){card.classList.remove('p89-restart');void card.offsetWidth;card.classList.add('p89-restart')}
  },30);
}
function closeCurrent(){
  const ov=$('#p88Float');if(!ov||ov.hidden)return;
  const btn=$('[data-p88-close]',ov);if(btn)btn.click();
}
function navigate(delta){
  const {list,index}=indexNow();if(index<0)return;
  const ni=index+delta;if(ni<0||ni>=list.length)return;
  const target=list[ni];
  const ov=$('#p88Float');if(ov){ov.classList.add('p89-switch');ov.style.setProperty('--p89dir',delta>0?'22px':'-22px')}
  setTimeout(()=>{
    closeCurrent();
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      activeId=target.dataset.p88Item||'';target.click();
      setTimeout(()=>{$('#p88Float')?.classList.remove('p89-switch')},120);
    }));
  },110);
}
function autoOpenFirst(){
  setTimeout(()=>{const first=$('#p88Body .p88-file[data-p88-item]');if(first){activeId=first.dataset.p88Item||'';first.click()}},140);
}
function bindRoot(root){
  if(root.dataset.p89Bound==='1')return;root.dataset.p89Bound='1';
  root.addEventListener('click',e=>{
    const file=e.target.closest('.p88-file[data-p88-item]');if(file){prepareOpen(file.dataset.p88Item);return}
    const folder=e.target.closest('.p88-folder[data-p88-folder]');if(folder)autoOpenFirst();
  });
}
function bindSwipe(){
  const ov=$('#p88Float');if(!ov||ov.dataset.p89Swipe==='1')return;ov.dataset.p89Swipe='1';
  ov.addEventListener('touchstart',e=>{if(ov.hidden||e.touches.length!==1)return;startX=e.touches[0].clientX;startY=e.touches[0].clientY;startAt=Date.now()},{passive:true});
  ov.addEventListener('touchend',e=>{if(ov.hidden||!startAt)return;const t=e.changedTouches[0];const dx=t.clientX-startX,dy=t.clientY-startY,dur=Date.now()-startAt;startAt=0;if(dur<700&&Math.abs(dx)>58&&Math.abs(dx)>Math.abs(dy)*1.25)navigate(dx<0?1:-1)},{passive:true});
}
function boot(){
  injectCss();
  const wait=setInterval(()=>{
    const root=$('#p88Archive'),ov=$('#p88Float');
    if(root){bindRoot(root);if(ov)bindSwipe();clearInterval(wait);console.info('Carbonautas P89 deck de fichas carregado')}
  },120);
  setTimeout(()=>clearInterval(wait),20000);
  document.addEventListener('keydown',e=>{const ov=$('#p88Float');if(!ov||ov.hidden)return;if(e.key==='ArrowRight'){e.preventDefault();navigate(1)}else if(e.key==='ArrowLeft'){e.preventDefault();navigate(-1)}});
  try{const u=new URL(location.href);if(u.searchParams.get('build')!==BUILD){u.searchParams.set('build',BUILD);u.searchParams.delete('pwa');history.replaceState(null,'',u.href)}}catch(_e){}
  window.CARBONAUTAS_RUNTIME_BUILD=BUILD;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
