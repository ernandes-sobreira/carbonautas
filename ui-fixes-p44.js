/* Carbonautas · P44 · régua de tempo + saída segura do editor */
(function(){
'use strict';
const VERSION='P44';
const $=s=>document.querySelector(s);

function injectCss(){
  if($('#p44Style'))return;
  const st=document.createElement('style');
  st.id='p44Style';
  st.textContent=`
    .p44-ruler-add{margin-left:auto!important;padding:6px 10px!important;border-radius:9px!important;font-size:11px!important;font-weight:800!important;background:#fff!important;border:1px solid #b8cbd2!important;color:#17313d!important;display:inline-flex!important;align-items:center!important;gap:5px!important}
    .p44-ruler-add:hover{background:#eef8fb!important;border-color:#0E5C63!important;color:#0E5C63!important}
    .p44-ruler-title{display:flex!important;align-items:center!important;gap:8px!important;width:100%!important}
    #p44PeriodPicker{position:fixed;inset:0;z-index:2147483645;background:rgba(5,18,28,.68);display:none;align-items:center;justify-content:center;padding:18px}
    #p44PeriodPicker .p44-card{width:min(520px,100%);background:#fff;border-radius:20px;box-shadow:0 22px 70px rgba(0,0,0,.35);overflow:hidden}
    #p44PeriodPicker .p44-head{display:flex;gap:12px;align-items:center;padding:18px 20px;border-bottom:1px solid #e3eaed;background:#f6fafb}
    #p44PeriodPicker .p44-head strong{font:800 20px/1.15 system-ui;color:#102631;flex:1}
    #p44PeriodPicker .p44-close{border:0;background:#e8eff2;border-radius:10px;width:40px;height:40px;font-size:24px;color:#1a323d}
    #p44PeriodPicker .p44-body{padding:18px 20px 22px}
    #p44PeriodPicker .p44-help{font:500 13px/1.45 system-ui;color:#60757d;margin:0 0 14px}
    #p44PeriodPicker .p44-options{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    #p44PeriodPicker .p44-option{border:1px solid #d3e0e4;background:#fff;border-radius:14px;padding:14px;text-align:left;font:800 14px/1.25 system-ui;color:#17313d;min-height:62px}
    #p44PeriodPicker .p44-option:hover{border-color:#0E5C63;background:#f1faf9}
    #p44PeriodPicker .p44-option small{display:block;font:500 11px/1.35 system-ui;color:#74858c;margin-top:4px}
    #ooCloseBtn{opacity:1!important;color:#fff!important;background:#111923!important;border:2px solid #ff4d73!important;font-weight:900!important;position:relative!important;z-index:50!important;pointer-events:auto!important;visibility:visible!important}
    #ooCloseBtn:not(:disabled):hover{background:#3b1722!important;border-color:#ff315f!important;color:#fff!important}
    #ooCloseBtn .oo-full-label,#ooCloseBtn .oo-short-label{color:#fff!important;opacity:1!important}
    @media(max-width:700px){#p44PeriodPicker .p44-options{grid-template-columns:1fr}.p44-ruler-add{font-size:10px!important;padding:6px 8px!important}}
  `;
  document.head.appendChild(st);
}

function memberIdFromSection(section){
  if(!section)return'';
  for(const el of section.querySelectorAll('[onclick]')){
    const s=el.getAttribute('onclick')||'';
    let m=s.match(/openActivity\(null\s*,\s*['\"]([^'\"]+)['\"]\)/);
    if(m)return m[1];
    m=s.match(/openDossier\(['\"]([^'\"]+)['\"]\)/);
    if(m)return m[1];
    m=s.match(/openMemberRepository\(['\"]([^'\"]+)['\"]\)/);
    if(m)return m[1];
  }
  return'';
}

function ensurePicker(){
  let p=$('#p44PeriodPicker');
  if(p)return p;
  p=document.createElement('div');
  p.id='p44PeriodPicker';
  p.innerHTML=`<div class="p44-card" role="dialog" aria-modal="true" aria-labelledby="p44PickerTitle">
    <div class="p44-head"><strong id="p44PickerTitle">Régua de tempo</strong><button class="p44-close" type="button" aria-label="Fechar">×</button></div>
    <div class="p44-body"><p class="p44-help">Adicione ou edite um período acadêmico. Ele aparecerá na régua desta pessoa.</p>
      <div class="p44-options">
        <button class="p44-option" type="button" data-p44type="bolsa">🎓 Bolsa / IC<small>Modalidade, agência, início e fim</small></button>
        <button class="p44-option" type="button" data-p44type="mestrado">📘 Mestrado<small>Início, término e andamento</small></button>
        <button class="p44-option" type="button" data-p44type="doutorado">📚 Doutorado<small>Início, término e andamento</small></button>
        <button class="p44-option" type="button" data-p44type="tcc">📝 TCC<small>Início, término e andamento</small></button>
      </div>
    </div></div>`;
  document.body.appendChild(p);
  const close=()=>{p.style.display='none';p.dataset.memberId='';};
  p.querySelector('.p44-close').onclick=close;
  p.addEventListener('click',e=>{if(e.target===p)close()});
  p.querySelectorAll('[data-p44type]').forEach(b=>b.addEventListener('click',()=>{
    const id=p.dataset.memberId||'',type=b.dataset.p44type||'';close();if(!id)return;
    if(type==='bolsa'){
      if(typeof window.openMember==='function')window.openMember(id);
      setTimeout(()=>{
        const cb=$('#mBolsista'),target=cb?.closest('.fg')||$('#mBolsaModalidade')?.closest('.fg');
        if(target){target.scrollIntoView({behavior:'smooth',block:'center'});target.style.outline='3px solid #FFC857';target.style.borderRadius='10px';setTimeout(()=>target.style.outline='',2200)}
        cb?.focus();
      },180);
      return;
    }
    const section=[...document.querySelectorAll('#trackGrid .track-person')].find(x=>memberIdFromSection(x)===id);
    const reg=[...(section?.querySelectorAll('button[onclick]')||[])].find(x=>(x.getAttribute('onclick')||'').includes('openActivity(null'));
    if(reg)reg.click();
    setTimeout(()=>{
      const sel=$('#activityType');if(sel){sel.value=type;sel.dispatchEvent(new Event('change',{bubbles:true}))}
      const name=$('#activityName');if(name&&!name.value)name.value=type==='mestrado'?'Mestrado':type==='doutorado'?'Doutorado':'TCC';
      $('#activityStart')?.focus();
    },90);
  }));
  return p;
}

function openPicker(id,name){
  const p=ensurePicker();p.dataset.memberId=id||'';
  const t=$('#p44PickerTitle');if(t)t.textContent=`Régua de tempo${name?' · '+name:''}`;
  p.style.display='flex';
}

function ensureRulerButtons(){
  const grid=$('#trackGrid');if(!grid)return;
  grid.querySelectorAll('.track-person').forEach(section=>{
    const id=memberIdFromSection(section);if(!id)return;
    const title=[...section.querySelectorAll('.follow-title')].find(x=>(x.textContent||'').trim().toLowerCase()==='régua de tempo');
    if(!title||title.querySelector('.p44-ruler-add'))return;
    const name=section.querySelector('.track-person-title')?.textContent?.trim()||'';
    title.classList.add('p44-ruler-title');
    const b=document.createElement('button');b.type='button';b.className='p44-ruler-add';b.textContent='＋ Adicionar / editar período';
    b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openPicker(id,name)});
    title.appendChild(b);
  });
}

function fixOnlyOfficeExit(){
  const overlay=$('#onlyOfficeOverlay'),btn=$('#ooCloseBtn');if(!overlay||!btn)return;
  const open=overlay.classList.contains('open');if(!open)return;
  const save=$('#ooSaveBtn'),status=($('#ooStatus')?.textContent||'').toLowerCase();
  const activelySaving=(save?.textContent||'').includes('Finalizando')||status.includes('sincronizando as últimas alterações');
  if(!activelySaving){btn.disabled=false;btn.removeAttribute('disabled')}
  const full=btn.querySelector('.oo-full-label');if(full){full.style.display='inline';full.style.color='#fff';full.style.opacity='1'}
  btn.title='Sair do editor sem salvar alterações';
}

function boot(){
  injectCss();ensurePicker();ensureRulerButtons();fixOnlyOfficeExit();
  setInterval(()=>{ensureRulerButtons();fixOnlyOfficeExit()},700);
  console.info('Carbonautas UI fixes',VERSION,'carregado');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
