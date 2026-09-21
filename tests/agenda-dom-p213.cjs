const test=require('node:test');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');

test('renderiza atividade e reunião no dia selecionado e cria navegação explícita',()=>{
  const dom=new JSDOM(`<!doctype html><body data-view="crono"><section id="viewCrono"><div class="crono-wrap"><div class="ag-month"><button class="ag-day" data-iso="2026-09-21"><span>21</span></button><button class="ag-day sel" data-iso="2026-09-22"><span>22</span></button><button class="ag-day" data-iso="2026-09-23"><span>23</span></button></div><div class="ag-daylist"><h4>legado</h4><div class="ag-empty">Dia livre</div></div></div></section></body>`,{url:'https://example.test'});
  global.window=dom.window;
  global.document=dom.window.document;
  global.MutationObserver=dom.window.MutationObserver;
  global.CSS=dom.window.CSS||{escape:s=>String(s)};
  global.requestAnimationFrame=fn=>{fn();return 1};
  global.queueMicrotask=queueMicrotask;
  const realSetInterval=global.setInterval;
  global.setInterval=()=>0;
  dom.window.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});
  dom.window.HTMLElement.prototype.scrollTo=function(opts){this.scrollLeft=opts?.left||0};
  global.state={
    members:[{id:'m1',nome:'Ernandes',prazos:[]}],
    schedule:[{id:'r22',titulo:'Reunião teste',data:'2026-09-22',hora:'10:00'}],
    privateSchedule:[],
    activities:[{id:'a22',ownerId:'m1',type:'agenda',agendaShared:true,title:'Atividade teste',dueDate:'2026-09-22',dueTime:'15:00'}]
  };
  global.myId='m1';global.isAdmin=false;
  delete require.cache[require.resolve('../modules/agenda-core-p213.js')];
  const agenda=require('../modules/agenda-core-p213.js');
  agenda.render();
  const d22=document.querySelector('.ag-day[data-iso="2026-09-22"] .p213-day-count');
  assert.ok(d22);
  assert.match(d22.textContent,/2 compromissos/);
  assert.ok(document.querySelector('#p213AgendaNav [data-p213-prev]'));
  assert.ok(document.querySelector('#p213AgendaNav [data-p213-next]'));
  const text=document.querySelector('#p213AgendaDay').textContent;
  assert.match(text,/Reunião teste/);
  assert.match(text,/Atividade teste/);
  assert.doesNotMatch(text,/Nada marcado para este dia/);
  global.setInterval=realSetInterval;
  dom.window.close();
});
