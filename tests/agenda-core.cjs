const test=require('node:test');
const assert=require('node:assert/strict');

function loadAgenda(app){
  const path=require.resolve('../modules/agenda-core-p213.js');
  delete require.cache[path];
  delete globalThis.state;
  delete globalThis.myId;
  delete globalThis.isAdmin;
  globalThis.CarbonautasApp=app;
  return require(path);
}

test('Agenda lê estado e identidade pela interface CarbonautasApp',()=>{
  const app={
    state:{
      members:[{id:'ernandes',nome:'Ernandes',status:'ativo',prazos:[]}],
      schedule:[{id:'qgis',data:'2026-09-24',hora:'08:00',titulo:'Curso QGIS'}],
      privateSchedule:[],
      activities:[{id:'conselho',type:'agenda',agendaShared:true,ownerId:'ernandes',dueDate:'2026-09-24',title:'Constituição do conselho do parque',participantIds:[]}]
    },
    memberId:'ernandes',
    isAdmin:false
  };
  const agenda=loadAgenda(app);
  const items=agenda.itemsForDate('2026-09-24');
  assert.equal(items.length,2);
  assert.deepEqual(items.map(x=>x.title).sort(),['Constituição do conselho do parque','Curso QGIS'].sort());
  assert.equal(agenda.countForDate('2026-09-24'),2);
});

test('Agenda respeita participante usando memberId do CarbonautasApp',()=>{
  const app={
    state:{
      members:[{id:'ernandes',nome:'Ernandes',status:'ativo',prazos:[]}],
      schedule:[
        {id:'meu',data:'2026-09-24',titulo:'Minha reunião',participantIds:['ernandes']},
        {id:'outro',data:'2026-09-24',titulo:'Reunião de outra pessoa',participantIds:['outra-pessoa']}
      ],
      privateSchedule:[],activities:[]
    },
    memberId:'ernandes',isAdmin:false
  };
  const agenda=loadAgenda(app);
  assert.deepEqual(agenda.itemsForDate('2026-09-24').map(x=>x.id),['meu']);
});

test.after(()=>{
  delete globalThis.CarbonautasApp;
  delete globalThis.CARBONAUTAS_AGENDA_P213;
});
