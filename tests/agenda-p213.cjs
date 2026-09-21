const test=require('node:test');
const assert=require('node:assert/strict');
const agenda=require('../modules/agenda-core-p213.js');

const baseState={
  members:[
    {id:'m1',nome:'Ernandes',prazos:[{titulo:'Prazo dia 22',data:'2026-09-22'}]},
    {id:'m2',nome:'Daiana',prazos:[]}
  ],
  schedule:[
    {id:'r22',titulo:'Reunião dia 22',data:'2026-09-22',hora:'14:00',participantIds:['m1','m2']},
    {id:'r23',titulo:'Evento geral',data:'2026-09-23'}
  ],
  privateSchedule:[{id:'p22',titulo:'Privado dia 22',data:'2026-09-22',hora:'09:00'}],
  activities:[
    {id:'a22',ownerId:'m1',title:'Atividade dia 22',type:'agenda',agendaShared:true,dueDate:'2026-09-22',participantIds:['m2']},
    {id:'a22b',ownerId:'m2',title:'Atividade da Daiana',type:'agenda',agendaShared:true,dueDate:'2026-09-22',participantIds:[]},
    {id:'a22c',ownerId:'m1',title:'Atividade concluída',type:'agenda',agendaShared:true,dueDate:'2026-09-22',status:'concluido'},
    {id:'a24',ownerId:'m1',title:'Fallback startDate',type:'agenda',agendaShared:true,startDate:'2026-09-24'}
  ]
};

test('dia 22 unifica reunião, privado, prazo e atividade compartilhada',()=>{
  const items=agenda.itemsForDate('2026-09-22',baseState,'m1',false);
  assert.equal(items.length,4);
  assert.deepEqual(items.map(x=>x.kind).sort(),['atividade','grupo','prazo','privado']);
  assert.ok(items.some(x=>x.title==='Atividade dia 22'));
  assert.ok(items.some(x=>x.title==='Reunião dia 22'));
});

test('não mostra atividade alheia sem participação para usuário comum',()=>{
  const items=agenda.itemsForDate('2026-09-22',baseState,'m1',false);
  assert.ok(!items.some(x=>x.id==='a22b'));
});

test('coordenação enxerga atividades de todos',()=>{
  const items=agenda.itemsForDate('2026-09-22',baseState,'m1',true);
  assert.ok(items.some(x=>x.id==='a22b'));
});

test('atividade concluída não entra na agenda ativa',()=>{
  const items=agenda.collectAgendaItems(baseState,'m1',false);
  assert.ok(!items.some(x=>x.id==='a22c'));
});

test('atividade aceita startDate quando dueDate não existe',()=>{
  const items=agenda.itemsForDate('2026-09-24',baseState,'m1',false);
  assert.ok(items.some(x=>x.id==='a24'));
});

test('normaliza ISO com horário sem deslocar o dia',()=>{
  assert.equal(agenda.normalizeDate('2026-09-22T23:30:00-04:00'),'2026-09-22');
});
