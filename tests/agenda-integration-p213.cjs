const test=require('node:test');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');

function load(html){
  const dom=new JSDOM(html,{url:'https://example.test'});
  global.window=dom.window;global.document=dom.window.document;global.MutationObserver=dom.window.MutationObserver;
  delete require.cache[require.resolve('../modules/agenda-integration-p213.js')];
  const api=require('../modules/agenda-integration-p213.js');
  return {dom,api};
}

test('atividade nova usa o dia selecionado em vez de hoje',()=>{
  const {dom,api}=load('<body data-view="crono"><section id="viewCrono"><button class="ag-day sel" data-iso="2026-09-22"></button></section><div id="p174TaskOverlay" class="open"><h2 id="p174ModalTitle">Nova atividade</h2><input id="p174Date" value="2026-09-21"></div></body>');
  assert.equal(api.selectedDate(),'2026-09-22');
  assert.equal(api.applyActivityDate(),true);
  assert.equal(document.querySelector('#p174Date').value,'2026-09-22');
  dom.window.close();
});

test('não sobrescreve data quando atividade está sendo editada',()=>{
  const {dom,api}=load('<body data-view="crono"><section id="viewCrono"><button class="ag-day sel" data-iso="2026-09-22"></button></section><div id="p174TaskOverlay" class="open"><h2 id="p174ModalTitle">Editar atividade</h2><input id="p174Date" value="2026-09-30"></div></body>');
  assert.equal(api.applyActivityDate(),false);
  assert.equal(document.querySelector('#p174Date').value,'2026-09-30');
  dom.window.close();
});

test('reunião nova usa o dia selecionado',()=>{
  const {dom,api}=load('<body data-view="crono"><section id="viewCrono"><button class="ag-day sel" data-iso="2026-09-22"></button></section><div id="eventOverlay" class="open"><input id="eData" value="2026-09-21"></div></body>');
  assert.equal(api.applyEventDate('2026-09-22',true),true);
  assert.equal(document.querySelector('#eData').value,'2026-09-22');
  dom.window.close();
});

test('observer só considera remontagem real do calendário',()=>{
  const {dom,api}=load('<body><section id="viewCrono"></section></body>');
  const p=document.createElement('div');p.id='p213AgendaDay';
  assert.equal(api.calendarMutation([{type:'childList',addedNodes:[p],removedNodes:[]}]),false);
  const month=document.createElement('div');month.className='ag-month';
  assert.equal(api.calendarMutation([{type:'childList',addedNodes:[month],removedNodes:[]}]),true);
  dom.window.close();
});
