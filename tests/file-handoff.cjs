const test=require('node:test');
const assert=require('node:assert/strict');
const api=require('../modules/file-handoff.js');

test('private thread id is stable',()=>{
  assert.equal(api.privateThreadId('b','a'),api.privateThreadId('a','b'));
  assert.equal(api.privateThreadId('a','b'),'a__b');
});

test('student sends to coordinator and coordinator sends to owner',()=>{
  const s={members:[{id:'coord',nivel:'coord'},{id:'aluno',nivel:'ic'}]};
  const p={memberId:'aluno',tipo:'arquivo'};
  assert.equal(api.nextRecipientId(p,'aluno',s),'coord');
  assert.equal(api.nextRecipientId(p,'coord',s),'aluno');
});

test('review flow alternates between reviewer and author',()=>{
  const p={reviewFlow:true,reviewReviewerId:'prof',reviewReturnToId:'alu',memberId:'alu'};
  assert.equal(api.nextRecipientId(p,'prof',{}),'alu');
  assert.equal(api.nextRecipientId(p,'alu',{}),'prof');
});

test('exchange permission covers owner coordinator collaborator and review participant',()=>{
  const p={memberId:'alu',collaboratorMemberIds:['co'],tipo:'arquivo'};
  assert.equal(api.canExchange(p,{memberId:'alu'}),true);
  assert.equal(api.canExchange(p,{memberId:'prof',coordinator:true}),true);
  assert.equal(api.canExchange(p,{memberId:'co'}),true);
  assert.equal(api.canExchange(p,{memberId:'x'}),false);
});

test('OnlyOffice actions are recognized but download/message are not',()=>{
  const fake=(text='',title='',onclick='',className='')=>({textContent:text,className,getAttribute:k=>k==='title'?title:k==='onclick'?onclick:''});
  assert.equal(api.isLegacyOnlineAction(fake('Corrigir online')),true);
  assert.equal(api.isLegacyOnlineAction(fake('Visualizar','','openFilePreview(\'x\')')),true);
  assert.equal(api.isLegacyOnlineAction(fake('Baixar')),false);
  assert.equal(api.isLegacyOnlineAction(fake('Mensagem')),false);
});

test('timeline translates upload and download',()=>{
  assert.equal(api.actionText({action:'download'}),'baixou o arquivo');
  assert.equal(api.actionText({action:'upload',source:'p214'}),'enviou uma nova versão');
  assert.equal(api.actionText({action:'upload',source:'p214-baseline'}),'enviou o arquivo');
});

test('baseline preserves current file before replacement without duplicating same url',()=>{
  const p={url:'u1',fileName:'a.docx',memberId:'alu',onlineEditVersion:1,ts:'2026-09-22T10:00:00Z'};
  let h=api.appendBaselineIfNeeded(p,[]);
  assert.equal(h.length,1);assert.equal(h[0].url,'u1');
  h=api.appendBaselineIfNeeded(p,h);assert.equal(h.length,1);
});

test('history synthesizes initial upload before first movement',()=>{
  const p={memberId:'alu',memberNome:'Ana',ts:'2026-09-22T10:00:00Z',onlineEditHistory:[{action:'download',version:1,byName:'Prof',savedAt:'2026-09-22T11:00:00Z'}]};
  const e=api.historyEvents(p);
  assert.equal(e[0].action,'initial');assert.equal(e[1].action,'download');
});

test('review-flow history merges versions and professor download in chronological sequence',()=>{
  const p1={id:'r1',reviewFlow:true,reviewThreadId:'r1',reviewVersion:1,memberId:'alu',reviewSenderName:'Ana',ts:'2026-09-22T10:00:00Z',fileName:'a.docx',onlineEditHistory:[{action:'download',version:1,byName:'Professor',savedAt:'2026-09-22T11:00:00Z'}]};
  const p2={id:'r2',reviewFlow:true,reviewThreadId:'r1',reviewVersion:2,memberId:'alu',reviewSenderName:'Professor',ts:'2026-09-22T12:00:00Z',fileName:'a_corrigido.docx'};
  const e=api.historyEvents(p2,{publicacoes:[p1,p2]});
  assert.deepEqual(e.map(x=>x.action),['initial','download','upload']);
  assert.deepEqual(e.map(x=>x.version),[1,1,2]);
});