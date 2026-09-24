const test=require('node:test');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const nav=require('../modules/agenda-desktop-nav-p218.js');

test('P218 normaliza datas da Agenda',()=>{
  assert.equal(nav.normalize('2026-09-24'),'2026-09-24');
  assert.equal(nav.normalize('2026-09-24T10:00:00'),'2026-09-24');
  assert.equal(nav.normalize('24/09/2026'),'');
});

test('P218 encontra o dia selecionado e limita anterior/proximo',()=>{
  const fake=(selected=false,today=false)=>({classList:{contains:c=>c==='sel'?selected:c==='today'?today:false}});
  assert.equal(nav.selectedIndex([fake(),fake(true),fake()]),1);
  assert.equal(nav.selectedIndex([fake(),fake(false,true),fake()]),1);
  assert.equal(nav.clampIndex(-1,3),0);
  assert.equal(nav.clampIndex(5,3),2);
  assert.equal(nav.clampIndex(1,3),1);
});

test('P218B distingue clique de arraste no PC',()=>{
  assert.equal(nav.pointerClickIntent(0,0),true);
  assert.equal(nav.pointerClickIntent(5,4),true);
  assert.equal(nav.pointerClickIntent(9,9),true);
  assert.equal(nav.pointerClickIntent(10,2),false);
  assert.equal(nav.pointerClickIntent(25,1),false);
});

test('P218B seleciona o dia no pointerup mesmo se o controlador antigo suprimir o click',async()=>{
  const dom=new JSDOM('<!doctype html><html><body data-view="crono"><div id="viewCrono" data-p114-mode="day"><div id="agBody"><div class="ag-month"><div class="ag-day sel" data-iso="2026-09-24"><span>24</span></div><div class="ag-day" data-iso="2026-09-25"><span>25</span></div></div></div></div></body></html>',{pretendToBeVisual:true});
  const previous={document:global.document,MutationObserver:global.MutationObserver,innerWidth:global.innerWidth};
  global.document=dom.window.document;global.MutationObserver=dom.window.MutationObserver;global.innerWidth=1200;
  const path=require.resolve('../modules/agenda-desktop-nav-p218.js');delete require.cache[path];
  let selected='2026-09-24';
  const d24=document.querySelector('[data-iso="2026-09-24"]'),d25=document.querySelector('[data-iso="2026-09-25"]'),track=document.querySelector('.ag-month');
  d25.onclick=()=>{selected='2026-09-25';d24.classList.remove('sel');d25.classList.add('sel')};
  track.addEventListener('pointerup',()=>{track._p114SuppressClickUntil=Date.now()+220},{capture:true});
  track.addEventListener('click',e=>{if((track._p114SuppressClickUntil||0)>Date.now()){e.preventDefault();e.stopImmediatePropagation()}},{capture:true});
  require('../modules/agenda-desktop-nav-p218.js');
  document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  const pointer=(type,x)=>{const e=new dom.window.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{pointerId:7,pointerType:'mouse',button:0,clientX:x,clientY:50});return e};
  d25.dispatchEvent(pointer('pointerdown',100));d25.dispatchEvent(pointer('pointerup',102));
  await new Promise(r=>setTimeout(r,20));
  assert.equal(selected,'2026-09-25');
  selected='2026-09-24';d25.classList.remove('sel');d24.classList.add('sel');
  d25.dispatchEvent(pointer('pointerdown',100));d25.dispatchEvent(pointer('pointermove',135));d25.dispatchEvent(pointer('pointerup',135));
  await new Promise(r=>setTimeout(r,20));
  assert.equal(selected,'2026-09-24');
  dom.window.close();
  global.document=previous.document;global.MutationObserver=previous.MutationObserver;global.innerWidth=previous.innerWidth;
});
