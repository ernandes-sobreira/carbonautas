/* Carbonautas P90 · Cartas do Arquivo Vivo: mesa fixa, troca sem piscada */
(function(){
'use strict';
const BUILD='P90';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
let currentIndex=-1;
let currentButtons=[];
let touchStart=null;
let animating=false;

function injectCss(){
  if($('#p90DeckStyle')) return;
  const st=document.createElement('style');
  st.id='p90DeckStyle';
  st.textContent=`
  #p90Deck[hidden]{display:none!important}
  #p90Deck{position:fixed;inset:0;z-index:100120;display:grid;place-items:center;padding:24px;isolation:isolate}
  #p90Deck .p90-backdrop{position:absolute;inset:0;background:rgba(4,18,28,.66);backdrop-filter:blur(11px);animation:p90fade .18s ease both}
  #p90Deck .p90-table{position:relative;width:min(900px,94vw);max-height:min(88dvh,920px);display:flex;flex-direction:column;background:linear-gradient(155deg,#f9fcfc,#eef6f6);border:1px solid rgba(255,255,255,.8);border-radius:30px;box-shadow:0 34px 100px rgba(0,12,22,.42);overflow:visible;animation:p90table .22s ease-out both}
  #p90Deck .p90-table:before,#p90Deck .p90-table:after{content:"";position:absolute;inset:18px 26px -16px;border-radius:28px;background:#d7e5e6;z-index:-2;transform:rotate(-1.2deg);box-shadow:0 24px 50px rgba(0,25,35,.12)}
  #p90Deck .p90-table:after{inset:10px 14px -8px;background:#edf5f5;z-index:-1;transform:rotate(.65deg)}
  #p90Deck .p90-head{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:14px;align-items:center;padding:14px 16px;border-bottom:1px solid #dce8e9;background:rgba(255,255,255,.92);border-radius:30px 30px 0 0}
  #p90Deck .p90-back,#p90Deck .p90-x{border:1px solid #d2dfe1;background:#fff;color:#24424c;border-radius:14px;height:44px;padding:0 14px;font-weight:900;font-size:13px}
  #p90Deck .p90-x{width:44px;padding:0;font-size:25px}
  #p90Deck .p90-title{min-width:0}.p90-title span{display:block;font-size:9px;letter-spacing:.14em;font-weight:950;color:#728990}.p90-title b{display:block;margin-top:2px;color:#132f39;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #p90Deck .p90-stage-wrap{position:relative;min-height:260px;overflow:auto;padding:22px 22px 14px;overscroll-behavior:contain}
  #p90Deck .p90-stage{position:relative;min-height:190px;display:grid;align-items:start}
  #p90Deck .p90-card-shell{grid-area:1/1;width:100%;transform-origin:50% 0%;will-change:transform,opacity,filter}
  #p90Deck .p90-card-shell.drop{animation:p90drop .42s cubic-bezier(.16,.88,.3,1.18) both}
  #p90Deck .p90-card-shell.next-out{animation:p90outLeft .20s ease-in both}
  #p90Deck .p90-card-shell.prev-out{animation:p90outRight .20s ease-in both}
  #p90Deck .p90-card-shell .pub-row,#p90Deck .p90-card-shell .repo-package-card{display:block!important;opacity:1!important;visibility:visible!important;margin:0!important;width:100%!important;max-width:none!important;border-radius:22px!important;box-shadow:0 20px 48px rgba(10,40,52,.16)!important;background:#fff!important}
  #p90Deck .p90-card-shell .pub-act,#p90Deck .p90-card-shell .repo-package-actions{display:flex!important;flex-wrap:wrap!important;gap:8px!important}
  #p90Deck .p90-nav{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px;padding:12px 16px 16px;border-top:1px solid #dce8e9;background:rgba(255,255,255,.9);border-radius:0 0 30px 30px}
  #p90Deck .p90-nav button{height:48px;border:1px solid #cadadd;border-radius:15px;background:#fff;color:#18343e;font-weight:950;font-size:13px;padding:0 16px;display:flex;align-items:center;justify-content:center;gap:8px}
  #p90Deck .p90-nav .next{justify-self:end;background:#0d8896;color:#fff;border-color:#0d8896}.p90-nav .prev{justify-self:start}
  #p90Deck .p90-nav button:disabled{opacity:.28;box-shadow:none}
  #p90Deck .p90-count{text-align:center;min-width:110px;line-height:1.1}.p90-count small{display:block;font-size:9px;font-weight:950;letter-spacing:.09em;text-transform:uppercase;color:#789096}.p90-count b{display:block;margin-top:4px;font-size:14px;color:#17343e}
  @keyframes p90fade{from{opacity:0}to{opacity:1}}
  @keyframes p90table{from{opacity:0;transform:translateY(14px) scale(.985)}to{opacity:1;transform:none}}
  @keyframes p90drop{0%{opacity:0;transform:translateY(-78px) rotate(-2.8deg) scale(.93);filter:blur(2px)}58%{opacity:1;transform:translateY(8px) rotate(.65deg) scale(1.008);filter:none}78%{transform:translateY(-3px) rotate(-.25deg)}100%{opacity:1;transform:none;filter:none}}
  @keyframes p90outLeft{to{opacity:0;transform:translateX(-62px) rotate(-3deg) scale(.96)}}
  @keyframes p90outRight{to{opacity:0;transform:translateX(62px) rotate(3deg) scale(.96)}}
  @media(max-width:680px){
    #p90Deck{padding:12px 10px calc(14px + env(safe-area-inset-bottom));place-items:center}
    #p90Deck .p90-table{width:100%;max-height:calc(100dvh - 28px);border-radius:24px}
    #p90Deck .p90-table:before{inset:12px 14px -10px;border-radius:22px}#p90Deck .p90-table:after{inset:7px 8px -5px;border-radius:22px}
    #p90Deck .p90-head{padding:10px 11px;border-radius:24px 24px 0 0;gap:9px}.p90-title b{font-size:13px!important}.p90-title span{font-size:8px!important}
    #p90Deck .p90-back{height:42px;padding:0 12px}.p90-x{height:42px!important;width:42px!important}
    #p90Deck .p90-stage-wrap{padding:14px 10px 10px;min-height:220px;max-height:calc(100dvh - 190px)}
    #p90Deck .p90-stage{min-height:180px}
    #p90Deck .p90-card-shell .pub-act,#p90Deck .p90-card-shell .repo-package-actions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;width:100%!important;padding-left:0!important}
    #p90Deck .p90-card-shell .pub-act button,#p90Deck .p90-card-shell .pub-act a,#p90Deck .p90-card-shell .repo-package-actions button{width:100%!important;min-width:0!important;justify-content:center!important}
    #p90Deck .p90-nav{padding:9px 10px calc(10px + env(safe-area-inset-bottom));gap:7px;border-radius:0 0 24px 24px}.p90-nav button{height:44px;padding:0 10px;font-size:12px}.p90-count{min-width:68px}.p90-count small{font-size:7.5px}.p90-count b{font-size:12px}
  }
  @media(prefers-reduced-motion:reduce){#p90Deck .p90-backdrop,#p90Deck .p90-table,#p90Deck .p90-card-shell.drop,#p90Deck .p90-card-shell.next-out,#p90Deck .p90-card-shell.prev-out{animation:none!important}}
  `;
  document.head.appendChild(st);
}

function norm(v=''){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim()}
function fileButtons(){return $$('#p88Body .p88-file[data-p88-item]')}
function buttonTitle(btn){return $('.p88-file-main b',btn)?.textContent?.trim()||'Documento'}
function buttonMeta(btn){return $('.p88-file-main small',btn)?.textContent?.trim()||''}
function originalCardFor(btn){
  const title=norm(buttonTitle(btn));
  const meta=norm(buttonMeta(btn));
  const pubs=$$('#pubList > .pub-row');
  let hit=pubs.find(c=>norm($('.pub-t',c)?.textContent)===title && (!meta || meta.includes(norm($('.pub-author',c)?.textContent||''))));
  if(!hit) hit=pubs.find(c=>norm($('.pub-t',c)?.textContent)===title);
  if(hit) return hit;
  const packs=$$('#repoPackageList > .repo-package-card');
  hit=packs.find(c=>norm($('.repo-package-title',c)?.textContent)===title);
  return hit||null;
}
function cloneCard(original){
  const clone=original.cloneNode(true);
  clone.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
  clone.removeAttribute('id');
  const origActions=$$('button,a,[role="button"]',original);
  const cloneActions=$$('button,a,[role="button"]',clone);
  cloneActions.forEach((el,i)=>{el.dataset.p90Proxy=String(i)});
  clone.addEventListener('click',e=>{
    const el=e.target.closest('[data-p90-proxy]');if(!el)return;
    const idx=Number(el.dataset.p90Proxy);const orig=origActions[idx];if(!orig)return;
    const hasInline=!!el.getAttribute('onclick');
    const link=el.tagName==='A'&&el.getAttribute('href');
    if(hasInline||link)return;
    e.preventDefault();e.stopPropagation();orig.click();
  });
  return clone;
}
function ensureOverlay(){
  if($('#p90Deck')) return;
  const ov=document.createElement('div');ov.id='p90Deck';ov.hidden=true;ov.innerHTML=`
    <div class="p90-backdrop" data-p90-close></div>
    <section class="p90-table" role="dialog" aria-modal="true" aria-label="Arquivo Vivo">
      <header class="p90-head"><button type="button" class="p90-back" data-p90-close>← Voltar</button><div class="p90-title"><span>ARQUIVO VIVO</span><b id="p90Title">Documento</b></div><button type="button" class="p90-x" data-p90-close>×</button></header>
      <div class="p90-stage-wrap"><div class="p90-stage" id="p90Stage"></div></div>
      <div class="p90-nav"><button type="button" class="prev">← Anterior</button><div class="p90-count"><small id="p90Folder">Pasta</small><b id="p90Count">1 de 1</b></div><button type="button" class="next">Próximo →</button></div>
    </section>`;
  document.body.appendChild(ov);
  ov.addEventListener('click',e=>{if(e.target.closest('[data-p90-close]'))closeDeck()});
  $('.p90-nav .prev',ov).addEventListener('click',()=>navigate(-1));
  $('.p90-nav .next',ov).addEventListener('click',()=>navigate(1));
  const stage=$('#p90Stage',ov);
  stage.addEventListener('touchstart',e=>{if(e.touches.length!==1)return;touchStart={x:e.touches[0].clientX,y:e.touches[0].clientY,t:Date.now()}},{passive:true});
  stage.addEventListener('touchend',e=>{if(!touchStart)return;const t=e.changedTouches[0];const dx=t.clientX-touchStart.x,dy=t.clientY-touchStart.y,dt=Date.now()-touchStart.t;touchStart=null;if(dt<700&&Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.2)navigate(dx<0?1:-1)},{passive:true});
}
function folderLabel(){return $('#p88Crumb b')?.textContent?.trim()||'Arquivo Vivo'}
function updateNav(){
  const ov=$('#p90Deck');if(!ov)return;
  $('#p90Folder',ov).textContent=folderLabel();
  $('#p90Count',ov).textContent=`${currentIndex+1} de ${Math.max(1,currentButtons.length)}`;
  $('.p90-nav .prev',ov).disabled=currentIndex<=0;
  $('.p90-nav .next',ov).disabled=currentIndex<0||currentIndex>=currentButtons.length-1;
}
function renderCurrent(direction=0,first=false){
  const btn=currentButtons[currentIndex];if(!btn)return false;
  const original=originalCardFor(btn);if(!original)return false;
  const stage=$('#p90Stage');if(!stage)return false;
  const old=$('.p90-card-shell',stage);
  const put=()=>{
    stage.innerHTML='';
    const shell=document.createElement('div');shell.className='p90-card-shell';
    shell.appendChild(cloneCard(original));stage.appendChild(shell);
    $('#p90Title').textContent=buttonTitle(btn);
    updateNav();
    requestAnimationFrame(()=>{shell.classList.add('drop')});
    $('.p90-stage-wrap')?.scrollTo({top:0,behavior:'instant'});
  };
  if(!old||first){put();return true}
  animating=true;
  old.classList.remove('drop');old.classList.add(direction>=0?'next-out':'prev-out');
  setTimeout(()=>{put();animating=false},185);
  return true;
}
function openDeck(btn){
  ensureOverlay();
  currentButtons=fileButtons();
  currentIndex=currentButtons.indexOf(btn);
  if(currentIndex<0)return;
  const ov=$('#p90Deck');ov.hidden=false;document.documentElement.style.overflow='hidden';
  renderCurrent(0,true);
}
function closeDeck(){
  const ov=$('#p90Deck');if(!ov||ov.hidden)return;
  ov.hidden=true;$('#p90Stage').innerHTML='';currentIndex=-1;currentButtons=[];animating=false;document.documentElement.style.overflow='';
}
function navigate(delta){
  if(animating)return;
  const ni=currentIndex+delta;if(ni<0||ni>=currentButtons.length)return;
  currentIndex=ni;renderCurrent(delta,false);
}
function autoOpenAfterFolder(){
  setTimeout(()=>{const first=$('#p88Body .p88-file[data-p88-item]');if(first)openDeck(first)},170);
}
function bind(){
  document.addEventListener('click',e=>{
    const btn=e.target.closest('#p88Body .p88-file[data-p88-item]');
    if(btn){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openDeck(btn);return}
  },true);
  document.addEventListener('click',e=>{if(e.target.closest('#p88Body .p88-folder[data-p88-folder]'))autoOpenAfterFolder()});
  document.addEventListener('keydown',e=>{
    const ov=$('#p90Deck');if(!ov||ov.hidden)return;
    if(e.key==='Escape'){e.preventDefault();closeDeck()}else if(e.key==='ArrowRight'){e.preventDefault();navigate(1)}else if(e.key==='ArrowLeft'){e.preventDefault();navigate(-1)}
  });
}
function boot(){
  injectCss();ensureOverlay();bind();
  try{const u=new URL(location.href);if(u.searchParams.get('build')!==BUILD){u.searchParams.set('build',BUILD);u.searchParams.delete('pwa');history.replaceState(null,'',u.href)}}catch(_e){}
  window.CARBONAUTAS_RUNTIME_BUILD=BUILD;
  console.info('Carbonautas P90 cartas flutuantes carregado');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
