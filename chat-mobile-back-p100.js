/* Carbonautas P100 · saída clara do painel lateral de conversas no celular */
(function(){
'use strict';
const VERSION='P100';
const $=(s,r=document)=>r.querySelector(s);
let historyArmed=false;

function injectCss(){
  if($('#p100ChatBackStyle'))return;
  const st=document.createElement('style');
  st.id='p100ChatBackStyle';
  st.textContent=`
    .p100-mobile-back{display:none}
    @media(max-width:760px){
      .p46-side{background:#fff!important}
      .p46-side-head{position:relative!important;padding:12px 14px 13px!important;background:rgba(255,255,255,.98)!important;border-bottom:1px solid #e5eeee!important}
      .p100-mobile-back{display:inline-flex!important;align-items:center!important;gap:7px!important;border:1px solid #d3e1e2!important;background:#f8fbfb!important;color:#173b43!important;border-radius:13px!important;padding:9px 12px!important;margin:0 0 12px!important;font-size:13px!important;font-weight:850!important;line-height:1!important;box-shadow:0 5px 16px rgba(19,66,73,.06)!important}
      .p100-mobile-back:active{transform:scale(.98)}
      .p46-side.p100-drawer-open{position:absolute!important;z-index:100!important;inset:0 10% 0 0!important;display:flex!important;box-shadow:18px 0 44px rgba(20,55,63,.20)!important;border-radius:0 22px 22px 0!important;overflow:hidden!important}
      #p100DrawerShade{display:none;position:absolute;z-index:99;inset:0;background:rgba(12,39,46,.20);backdrop-filter:blur(2px)}
      #p100DrawerShade.show{display:block}
    }
  `;
  document.head.appendChild(st);
}

function side(){return $('.p46-side')}
function isMobile(){return matchMedia('(max-width:760px)').matches}
function isOpen(){const s=side();return !!(s&&isMobile()&&getComputedStyle(s).display!=='none'&&(s.classList.contains('p100-drawer-open')||s.style.position==='absolute'))}

function ensureShade(){
  const shell=$('.p46-shell');if(!shell)return null;
  let sh=$('#p100DrawerShade');
  if(!sh){sh=document.createElement('button');sh.type='button';sh.id='p100DrawerShade';sh.setAttribute('aria-label','Fechar lista de conversas');sh.onclick=closeDrawer;shell.appendChild(sh)}
  return sh;
}

function ensureBack(){
  const head=$('.p46-side-head');if(!head)return;
  if(!$('#p100MobileBack',head)){
    const b=document.createElement('button');
    b.type='button';b.id='p100MobileBack';b.className='p100-mobile-back';b.innerHTML='← <span>Voltar às conversas</span>';
    b.onclick=closeDrawer;head.prepend(b);
  }
}

function openDrawer(){
  if(!isMobile())return;
  const s=side();if(!s)return;
  ensureBack();
  s.classList.add('p100-drawer-open');
  s.style.display='flex';
  const sh=ensureShade();sh?.classList.add('show');
  document.body.classList.add('p100-chat-drawer-open');
  if(!historyArmed){
    historyArmed=true;
    try{history.pushState({...(history.state||{}),p100ChatDrawer:true},'',location.href)}catch(_e){}
  }
}

function closeDrawer(fromPop=false){
  const s=side();if(s){
    s.classList.remove('p100-drawer-open');
    s.style.display='none';s.style.position='';s.style.zIndex='';s.style.inset='';s.style.boxShadow='';
  }
  $('#p100DrawerShade')?.classList.remove('show');
  document.body.classList.remove('p100-chat-drawer-open');
  if(historyArmed&&!fromPop){
    historyArmed=false;
    try{if(history.state?.p100ChatDrawer)history.back()}catch(_e){}
  }else if(fromPop){historyArmed=false}
}

function syncAfterNativeToggle(){
  const s=side();if(!s||!isMobile())return;
  const visible=getComputedStyle(s).display!=='none';
  if(visible)openDrawer();else closeDrawer(true);
}

function bind(){
  window.addEventListener('click',e=>{
    if(e.target.closest?.('#p46MobileGroups')){
      setTimeout(syncAfterNativeToggle,0);
      setTimeout(syncAfterNativeToggle,60);
      return;
    }
    if(e.target.closest?.('.p46-side [data-p46-general], .p46-side [data-p46-group]')){
      setTimeout(()=>closeDrawer(),90);
    }
  },true);
  window.addEventListener('popstate',()=>{if(isOpen())closeDrawer(true)});
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&isOpen()){e.preventDefault();closeDrawer()}});
}

function observe(){
  const mo=new MutationObserver(()=>{if($('.p46-side'))ensureBack()});
  mo.observe(document.documentElement,{childList:true,subtree:true});
}

function boot(){injectCss();ensureBack();bind();observe();console.info('Carbonautas',VERSION,'voltar das conversas mobile carregado')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
