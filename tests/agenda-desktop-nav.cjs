const test=require('node:test');
const assert=require('node:assert/strict');
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
