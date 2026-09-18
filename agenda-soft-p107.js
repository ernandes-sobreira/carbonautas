/* Carbonautas P107 · Agenda leve, limpa e mobile-first */
(function(){
'use strict';
const VERSION='P107';
const $=(s,r=document)=>r.querySelector(s);

function installStyle(){
  if($('#p107AgendaStyle')) return;
  const st=document.createElement('style');
  st.id='p107AgendaStyle';
  st.textContent=`
  body[data-view="crono"] #viewCrono{background:linear-gradient(180deg,#f7fbfa 0%,#ffffff 54%,#f7fbfa 100%)}
  body[data-view="crono"] .crono-scroll{background:transparent!important}
  body[data-view="crono"] .crono-wrap{max-width:820px!important;padding:28px 24px 92px!important}

  /* Cabeçalho: mês é protagonista; controles ficam leves. */
  body[data-view="crono"] .ag-head{display:grid!important;grid-template-columns:1fr auto!important;grid-template-areas:'nav nav' 'modes tools'!important;align-items:center!important;gap:12px 14px!important;margin-bottom:24px!important}
  body[data-view="crono"] .ag-nav{grid-area:nav!important;display:grid!important;grid-template-columns:42px minmax(0,1fr) 42px!important;align-items:center!important;gap:8px!important;width:100%!important}
  body[data-view="crono"] .ag-title{font-family:'Fraunces',serif!important;font-size:30px!important;line-height:1.05!important;font-weight:600!important;text-align:center!important;color:#153642!important;padding:6px 8px!important;letter-spacing:-.02em!important}
  body[data-view="crono"] .ag-arrow{width:42px!important;height:42px!important;border:0!important;border-radius:50%!important;background:transparent!important;color:#47636d!important;font-size:27px!important;box-shadow:none!important;transition:.16s ease!important}
  body[data-view="crono"] .ag-arrow:hover{background:#eaf5f2!important;color:#0f7f83!important;transform:scale(1.04)}
  body[data-view="crono"] .ag-modes{grid-area:modes!important;justify-self:start!important;border:0!important;background:#eef5f3!important;padding:3px!important;box-shadow:none!important}
  body[data-view="crono"] .ag-modes button{padding:7px 14px!important;border-radius:999px!important;color:#668087!important;font-size:12px!important}
  body[data-view="crono"] .ag-modes button.on{background:#fff!important;color:#173946!important;box-shadow:0 2px 8px rgba(26,69,78,.08)!important}
  body[data-view="crono"] .google-chip,
  body[data-view="crono"] .ag-filter-btn{height:38px!important;border:0!important;border-radius:999px!important;background:transparent!important;color:#49666f!important;padding:7px 11px!important;box-shadow:none!important;font-size:12px!important}
  body[data-view="crono"] .google-chip:hover,
  body[data-view="crono"] .ag-filter-btn:hover{background:#eef6f4!important}
  body[data-view="crono"] .ag-filter-btn{margin-left:auto!important}

  /* O botão Novo vira ação flutuante discreta. */
  body[data-view="crono"] .ag-new{position:fixed!important;right:22px!important;bottom:92px!important;z-index:38!important;width:48px!important;height:48px!important;min-width:48px!important;padding:0!important;border:0!important;border-radius:50%!important;background:#15989a!important;color:#fff!important;font-size:0!important;display:grid!important;place-items:center!important;box-shadow:0 10px 26px rgba(21,152,154,.24)!important}
  body[data-view="crono"] .ag-new::before{content:'+';font-size:28px!important;font-weight:400!important;line-height:1!important;transform:translateY(-1px)}
  body:not([data-view="crono"]) .ag-new{position:static}

  /* Filtros ficam como uma faixa leve, não outro bloco pesado. */
  body[data-view="crono"] .crono-filters{border:0!important;border-radius:16px!important;background:#f2f8f6!important;padding:10px!important;margin:0 0 18px!important;gap:8px!important;box-shadow:none!important}
  body[data-view="crono"] .crono-filters .mini{border:0!important;background:#fff!important;border-radius:999px!important;padding:8px 12px!important;font-size:12px!important}

  /* Calendário: sem 42 caixinhas. */
  body[data-view="crono"] .ag-month{display:grid!important;grid-template-columns:repeat(7,minmax(0,1fr))!important;gap:3px 2px!important;background:transparent!important;padding:4px 0 8px!important}
  body[data-view="crono"] .ag-dow{font-size:10px!important;letter-spacing:.08em!important;color:#8aa0a6!important;padding:6px 0 10px!important;font-weight:800!important}
  body[data-view="crono"] .ag-day{aspect-ratio:1!important;border:0!important;border-radius:50%!important;background:transparent!important;box-shadow:none!important;padding:0!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:1px!important;font-size:13px!important;color:#506a72!important;transition:background .16s ease,color .16s ease,transform .16s ease!important;position:relative!important;min-width:0!important}
  body[data-view="crono"] .ag-day:hover{background:#eef7f5!important;transform:translateY(-1px)}
  body[data-view="crono"] .ag-day.out{opacity:.24!important}
  body[data-view="crono"] .ag-day.today{border:1.5px solid #1a9999!important;background:#fff!important;color:#148184!important;font-weight:800!important}
  body[data-view="crono"] .ag-day.sel{background:#dff2ee!important;color:#0d7073!important;border:0!important;font-weight:900!important;box-shadow:inset 0 0 0 1px rgba(26,153,153,.13)!important}
  body[data-view="crono"] .ag-day.sel.today{box-shadow:inset 0 0 0 1.5px #179698!important}
  body[data-view="crono"] .ag-day>span{line-height:1!important;transform:translateY(-4px)}
  body[data-view="crono"] .ag-dots{position:absolute!important;left:50%!important;bottom:8px!important;transform:translateX(-50%)!important;display:flex!important;gap:3px!important;flex-wrap:nowrap!important;max-width:72%!important;align-items:center!important}
  body[data-view="crono"] .ag-dots i{width:5px!important;height:5px!important;border:0!important;box-shadow:none!important}
  body[data-view="crono"] .ag-dots i.over{box-shadow:0 0 0 1.5px #ffe4e4!important}
  body[data-view="crono"] .ag-dots b{font-size:8px!important;color:#698188!important}
  body[data-view="crono"] .ag-day.sel .ag-dots b{color:#39747a!important}

  /* Dia escolhido e compromissos: cards leves, legíveis e com respiro. */
  body[data-view="crono"] .ag-daylist{margin-top:24px!important;padding-top:18px!important;border-top:1px solid #e8f0ee!important}
  body[data-view="crono"] .ag-daylist h4{font-family:'Fraunces',serif!important;font-size:21px!important;font-weight:600!important;color:#24434d!important;margin:0 0 12px!important;text-transform:none!important;letter-spacing:0!important}
  body[data-view="crono"] .ag-item{position:relative!important;display:grid!important;grid-template-columns:58px minmax(0,1fr) auto!important;align-items:center!important;gap:10px!important;padding:12px 12px!important;border:1px solid #edf2f1!important;border-radius:16px!important;background:rgba(255,255,255,.94)!important;margin-bottom:8px!important;box-shadow:0 6px 18px rgba(28,67,74,.045)!important;overflow:hidden!important;transition:.16s ease!important}
  body[data-view="crono"] .ag-item:hover{transform:translateY(-1px);box-shadow:0 9px 22px rgba(28,67,74,.07)!important}
  body[data-view="crono"] .ag-item.over{background:#fff8f7!important;border-color:#f7dfdc!important}
  body[data-view="crono"] .ag-time{min-width:0!important;width:58px!important;text-align:left!important;font-size:11px!important;line-height:1.2!important;color:#6c858b!important;font-weight:800!important}
  body[data-view="crono"] .ag-t{font-size:14px!important;color:#183842!important}
  body[data-view="crono"] .ag-who{font-size:11px!important;color:#789097!important;margin-top:3px!important}
  body[data-view="crono"] .ag-act button{border:0!important;background:#f2f7f6!important;border-radius:50%!important;width:31px!important;height:31px!important}
  body[data-view="crono"] .ag-act button:hover{background:#e5f2ef!important}
  body[data-view="crono"] .ag-empty{padding:18px 14px!important;border:0!important;border-radius:14px!important;background:#f4f8f7!important;color:#81969b!important;font-size:12.5px!important}

  /* Ano/lista seguem a mesma linguagem. */
  body[data-view="crono"] .ag-mini{border-color:#edf2f1!important;border-radius:16px!important;box-shadow:none!important;background:#fff!important}
  body[data-view="crono"] .ag-list-group h4{color:#789097!important;letter-spacing:.08em!important}

  @media(max-width:640px){
    body[data-view="crono"] .crono-wrap{padding:18px 18px 110px!important;max-width:none!important}
    body[data-view="crono"] .ag-head{grid-template-columns:1fr!important;grid-template-areas:'nav' 'modes' 'tools'!important;gap:9px!important;margin-bottom:16px!important}
    body[data-view="crono"] .ag-title{font-size:26px!important;padding:3px 4px!important}
    body[data-view="crono"] .ag-nav{grid-template-columns:36px minmax(0,1fr) 36px!important}
    body[data-view="crono"] .ag-arrow{width:36px!important;height:36px!important;font-size:23px!important}
    body[data-view="crono"] .ag-modes{justify-self:center!important}
    body[data-view="crono"] .ag-head>.google-chip{grid-area:tools!important;justify-self:start!important}
    body[data-view="crono"] .ag-filter-btn{grid-area:tools!important;justify-self:end!important;margin-left:0!important}
    body[data-view="crono"] .ag-new{right:18px!important;bottom:92px!important;width:46px!important;height:46px!important;min-width:46px!important}
    body[data-view="crono"] .ag-new::before{font-size:25px!important}
    body[data-view="crono"] .ag-month{gap:5px 3px!important;padding:6px 0 10px!important}
    body[data-view="crono"] .ag-day{font-size:13px!important;min-height:42px!important}
    body[data-view="crono"] .ag-day>span{transform:translateY(-3px)}
    body[data-view="crono"] .ag-dots{bottom:6px!important}
    body[data-view="crono"] .ag-dots i{width:4.5px!important;height:4.5px!important}
    body[data-view="crono"] .ag-daylist{margin-top:18px!important;padding-top:15px!important}
    body[data-view="crono"] .ag-daylist h4{font-size:19px!important}
    body[data-view="crono"] .ag-item{grid-template-columns:46px minmax(0,1fr) auto!important;padding:11px 10px!important;border-radius:14px!important}
    body[data-view="crono"] .ag-time{width:46px!important;font-size:10.5px!important}
    body[data-view="crono"] .ag-t{font-size:13.5px!important}
  }
  `;
  document.head.appendChild(st);
}

function decorate(){
  const google=$('#googleCalendarBtn');
  const filter=$('#agFilterBtn');
  const add=$('#agNewBtn');
  if(google){
    google.title='Google Agenda';
    google.setAttribute('aria-label','Google Agenda');
    if(innerWidth<=640 && !google.dataset.p107Short){google.dataset.p107Original=google.textContent;google.textContent='G · Google';google.dataset.p107Short='1'}
    if(innerWidth>640 && google.dataset.p107Short){google.textContent=google.dataset.p107Original||'G · Google Agenda';delete google.dataset.p107Short}
  }
  if(filter){filter.textContent='Filtros';filter.setAttribute('aria-label','Filtros')}
  if(add){add.title='Novo compromisso';add.setAttribute('aria-label','Novo compromisso')}
}

function boot(){
  installStyle();decorate();
  const mo=new MutationObserver(()=>decorate());
  mo.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['data-view']});
  addEventListener('resize',decorate,{passive:true});
  console.info('Carbonautas',VERSION,'agenda leve carregada');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
