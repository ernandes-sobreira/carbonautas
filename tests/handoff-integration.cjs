const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('modules/file-handoff.js','utf8');
function harness(ext='docx',review=false){
 let actor='prof',counter=0,fail=false,beforeTx=null,downloaded=0,cleaned=0;
 const records=new Map([
 ['rede_users/prof',{memberId:'prof',nome:'Professor',role:'coordinator'}],['rede_users/alu',{memberId:'alu',nome:'Aluno'}],
 ['rede_private_directory/alu',{uid:'alu'}],['rede_private_directory/prof',{uid:'prof'}],
 ['rede_publicacoes/file',{id:'file',tipo:'arquivo',memberId:'alu',ownerUid:'alu',fileName:'arquivo.'+ext,url:'https://storage/v1',storagePath:'v1',onlineEditVersion:1,ts:'2026-09-21T10:00:00Z',...(review?{reviewFlow:true,reviewThreadId:'file',reviewVersion:1,reviewReviewerId:'prof',reviewReturnToId:'alu'}:{})}]
 ]);
 const snapshot=ref=>({id:ref.split('/').pop(),exists:()=>records.has(ref),data:()=>structuredClone(records.get(ref))});
 const fn={doc:(...args)=>args.filter(x=>x!==db).join('/')+(args.length===1?'/auto'+(++counter):''),collection:(...args)=>args.filter(x=>x!==db).join('/'),getDoc:async ref=>{if(ref.startsWith('rede_private_threads/')&&!records.has(ref)){const e=Error('missing');e.code='permission-denied';throw e}return snapshot(ref)},setDoc:async(ref,data)=>records.set(ref,data),serverTimestamp:()=>new Date().toISOString(),runTransaction:async(_db,cb)=>{if(beforeTx){const run=beforeTx;beforeTx=null;run()}const pending=[];await cb({get:async ref=>snapshot(ref),update:(ref,data)=>pending.push([ref,{...records.get(ref),...data}]),set:(ref,data)=>pending.push([ref,data])});if(fail)throw Error('denied');for(const [k,v]of pending)records.set(k,v)}};
 const db={},context={module:{exports:{}},console,db,FB:()=>fn,auth:{get currentUser(){return{uid:actor}}},CarbonautasApp:{get state(){return{members:[{id:'prof',nome:'Professor',nivel:'coord'},{id:'alu',nome:'Aluno'}],publicacoes:[records.get('rede_publicacoes/file')]}}},fbUploadFile:async(_id,_data,name)=>({url:'https://storage/'+name,path:'uploaded/'+name}),fileToDataUrl:async()=>'',deleteStorageArtifacts:async()=>cleaned++,fetch:async()=>({ok:true,blob:async()=>({})}),URL:{createObjectURL:()=> 'blob:download',revokeObjectURL:()=>{}},setTimeout:()=>{},document:{createElement:()=>({click:()=>downloaded++,remove(){}}),body:{append(){}}}};
 vm.runInNewContext(source,context);return {api:context.module.exports,records,setActor:a=>actor=a,setFail:()=>fail=true,setRace:fn=>beforeTx=fn,downloads:()=>downloaded,cleaned:()=>cleaned,context};
}
for(const ext of ['docx','xlsx','pptx','pdf','csv','png','zip'])for(const review of [false,true])test(`${ext} ${review?'legacy review':'publication'}: download v1 → return v2 + message → download v2 → return v3`,async()=>{
 const h=harness(ext,review),api=h.api,file={name:'corrigido.'+ext,size:100};
 await api.downloadPublication('file');assert.equal(h.downloads(),1);
 await api.commitUploadAndMessage('file',file,'Veja as correções');
 let p=h.records.get('rede_publicacoes/file');assert.equal(p.onlineEditVersion,2);assert.equal(p.storagePath,'uploaded/'+file.name);assert.equal(p.repositoryTurnMemberId,'alu');
 assert.equal([...h.records.keys()].filter(k=>k.includes('/messages/')).length,1);assert.equal([...h.records.keys()].filter(k=>k.startsWith('rede_notifications/')).length,1);
 h.setActor('alu');await api.downloadPublication('file');await api.commitUploadAndMessage('file',{name:'revisado.'+ext,size:100},'Ajustei tudo');
 p=h.records.get('rede_publicacoes/file');assert.equal(p.onlineEditVersion,3);assert.equal(p.repositoryTurnMemberId,'prof');assert.equal(h.downloads(),2);
 const events=api.historyEvents(p);assert.deepEqual(Array.from(events.filter(e=>e.action==='download'),e=>e.version),[1,2]);assert.equal(events.filter(e=>e.action==='message').length,2);assert.equal([...h.records.keys()].filter(k=>/^rede_private_threads\/[^/]+$/.test(k)).length,1);
});
test('mandatory message and nonempty file prevent upload',async()=>{const h=harness();await assert.rejects(h.api.commitUploadAndMessage('file',{name:'x',size:10},''),/mensagem/);await assert.rejects(h.api.commitUploadAndMessage('file',{name:'x',size:0},'oi'),/não vazio/)});
test('failed transaction rolls back file/message/notification and cleans uploaded blob',async()=>{const h=harness();h.setFail();await assert.rejects(h.api.commitUploadAndMessage('file',{name:'x',size:10},'oi'),/denied/);assert.equal(h.records.get('rede_publicacoes/file').onlineEditVersion,1);assert.equal(h.cleaned(),1);assert.equal([...h.records.keys()].filter(k=>k.includes('/messages/')).length,0)});
test('concurrent version refuses stale return',async()=>{const h=harness();h.setRace(()=>h.records.get('rede_publicacoes/file').onlineEditVersion=2);await assert.rejects(h.api.commitUploadAndMessage('file',{name:'x',size:10},'oi'),/Outra versão/);assert.equal(h.cleaned(),1)});
test('HTTP download failure does not create a receipt or trigger an anchor',async()=>{const h=harness();h.context.fetch=async()=>({ok:false,status:403});await assert.rejects(h.api.downloadPublication('file'),/403/);assert.equal(h.downloads(),0);assert.equal(h.records.get('rede_publicacoes/file').onlineEditHistory,undefined)});
test('download records fetched version when a newer upload races',async()=>{const h=harness();h.setRace(()=>{const p=h.records.get('rede_publicacoes/file');p.onlineEditVersion=2;p.url='https://storage/v2'});await h.api.downloadPublication('file');assert.equal(h.records.get('rede_publicacoes/file').onlineEditHistory[0].version,1)});
test('shared package owner chooses peer; peer returns to owner absent from ACL list',async()=>{
 const h=harness();h.setActor('alu');h.records.set('rede_repository_packages/pkg',{ownerMemberId:'alu',accessMode:'selected',allowedMemberIds:['prof','peer']});
 h.records.set('rede_repository_packages/pkg/files/a',{fileName:'a.docx',url:'https://storage/v1',onlineEditVersion:1});
 await h.api.commitUploadAndMessage('package:pkg:a',{name:'v2.docx',size:10},'Para revisar','prof');
 h.setActor('prof');await h.api.commitUploadAndMessage('package:pkg:a',{name:'v3.docx',size:10},'Revisado');
 assert.equal(h.records.get('rede_repository_packages/pkg/files/a').onlineEditVersion,3);
});
test('package recipient losing access while uploading aborts and cleans upload',async()=>{
 const h=harness();h.setActor('alu');const pkg={ownerMemberId:'alu',accessMode:'selected',allowedMemberIds:['prof','peer']};h.records.set('rede_repository_packages/pkg',pkg);
 h.records.set('rede_repository_packages/pkg/files/a',{fileName:'a.docx',url:'https://storage/v1',onlineEditVersion:1});
 h.setRace(()=>pkg.allowedMemberIds=['peer']);
 await assert.rejects(h.api.commitUploadAndMessage('package:pkg:a',{name:'v2.docx',size:10},'Para revisar','prof'),/acesso/);
 assert.equal(h.cleaned(),1);assert.equal(h.records.get('rede_repository_packages/pkg/files/a').onlineEditVersion,1);
});
