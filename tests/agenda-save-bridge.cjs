const test=require('node:test');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const fs=require('node:fs');
const vm=require('node:vm');

test('P217 coloca atividade compartilhada no dia correto da Agenda oficial',()=>{
  const dom=new JSDOM('<!doctype html><html><body data-view="crono"><section id="viewCrono"><div id="agBody"><div class="ag-day sel" data-iso="2026-09-24"><div class="ag-dots"></div></div><div class="ag-daylist"><h4>Quinta-feira, 24 de setembro</h4><div class="ag-empty">Nada marcado neste dia.</div></div></div></section></body></html>',{url:'https://example.test'});
  const root=dom.window;
  root.CarbonautasApp={memberId:'ernandes',isAdmin:false,state:{members:[{id:'ernandes',nome:'Ernandes'}],activities:[{id:'a1',ownerId:'ernandes',ownerName:'Ernandes',type:'agenda',agendaShared:true,title:'Chamada urgente para ações de enfrentamento às mudanças climáticas',dueDate:'2026-09-24',dueTime:'19:30',participantIds:['ernandes'],progress:0}]}};
  const context={globalThis:root,window:root,document:root.document,module:{exports:{}},console,CustomEvent:root.CustomEvent,MutationObserver:root.MutationObserver,setTimeout,clearTimeout,queueMicrotask};
  vm.createContext(context);vm.runInContext(fs.readFileSync('modules/agenda-save-bridge-p217.js','utf8'),context);
  const api=context.module.exports;
  assert.equal(api.activitiesForDate('2026-09-24').length,1);
  assert.equal(api.augment(),true);
  assert.match(root.document.querySelector('.p217-agenda-activity .ag-t').textContent,/Chamada urgente/);
  assert.equal(root.document.querySelector('.ag-daylist .ag-empty'),null);
});

test('P217 respeita participantes: atividade de outra pessoa só aparece para quem foi marcado',()=>{
  const dom=new JSDOM('<!doctype html><html><body></body></html>');
  const root=dom.window;
  root.CarbonautasApp={memberId:'ernandes',isAdmin:false,state:{activities:[{id:'a2',ownerId:'aluno',type:'agenda',agendaShared:true,title:'Compartilhada',dueDate:'2026-09-25',participantIds:['ernandes']},{id:'a3',ownerId:'aluno',type:'agenda',agendaShared:true,title:'Privada para outro',dueDate:'2026-09-25',participantIds:['terceiro']}]}};
  const context={globalThis:root,window:root,document:root.document,module:{exports:{}},console,CustomEvent:root.CustomEvent,MutationObserver:root.MutationObserver,setTimeout,clearTimeout,queueMicrotask};
  vm.createContext(context);vm.runInContext(fs.readFileSync('modules/agenda-save-bridge-p217.js','utf8'),context);
  assert.deepEqual(context.module.exports.activitiesForDate('2026-09-25').map(x=>x.id),['a2']);
});
