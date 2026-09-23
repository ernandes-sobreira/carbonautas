const {initializeTestEnvironment,assertFails,assertSucceeds}=require('@firebase/rules-unit-testing');
const f=require('firebase/firestore'),fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
(async()=>{
 const env=await initializeTestEnvironment({projectId:'demo-carbonautas',firestore:{host:'127.0.0.1',port:8080,rules:fs.readFileSync('firestore.rules','utf8')}});
 try{
 await env.clearFirestore();
 await env.withSecurityRulesDisabled(async c=>{const db=c.firestore();for(const id of ['prof','alu','third']){await f.setDoc(f.doc(db,'rede_users',id),{memberId:id,nome:id,role:id==='prof'?'coordinator':'student'});await f.setDoc(f.doc(db,'rede_members',id),{nome:id,status:'ativo'});await f.setDoc(f.doc(db,'rede_private_directory',id),{uid:id,memberId:id})}await f.setDoc(f.doc(db,'rede_publicacoes','file'),{tipo:'arquivo',memberId:'alu',ownerUid:'alu',fileName:'a.docx',url:'https://storage/v1',storagePath:'v1',reviewFlow:true,reviewThreadId:'file',reviewVersion:1,reviewReviewerId:'prof',reviewReturnToId:'alu',onlineEditVersion:1,ts:new Date()})});
 const make=id=>{const db=env.authenticatedContext(id).firestore(),context={module:{exports:{}},console,db,FB:()=>f,auth:{currentUser:{uid:id}},CarbonautasApp:{state:{members:[{id:'prof',nivel:'coord',nome:'Professor'},{id:'alu',nome:'Aluno'}]}},fbUploadFile:async()=>({url:'https://storage/v2',path:'v2'}),fileToDataUrl:async()=>''};new Function('module','globalThis',fs.readFileSync('modules/file-handoff.js','utf8'))(context.module,context);return{api:context.module.exports,db}};
 const prof=make('prof'),alu=make('alu'),third=make('third');
 await assertSucceeds(prof.api.logDownload('file'));
 await assertSucceeds(prof.api.commitUploadAndMessage('file',{name:'corrigido.docx',size:100},'Revisado'));
 let snap=await f.getDoc(f.doc(alu.db,'rede_publicacoes','file'));assert.equal(snap.data().onlineEditVersion,2);
 await assertSucceeds(alu.api.logDownload('file'));
 await assertSucceeds(alu.api.commitUploadAndMessage('file',{name:'ajustado.docx',size:100},'Ajustei'));
 snap=await f.getDoc(f.doc(alu.db,'rede_publicacoes','file'));assert.equal(snap.data().onlineEditVersion,3);
 const tid='alu__prof';await assertSucceeds(f.getDocs(f.collection(alu.db,'rede_private_threads',tid,'messages')));
 await assertFails(f.getDoc(f.doc(third.db,'rede_private_threads',tid)));
 await assertFails(f.getDocs(f.collection(third.db,'rede_private_threads',tid,'messages')));
 await assertFails(f.updateDoc(f.doc(third.db,'rede_private_threads',tid),{participants:['third','alu']}));
 await assertSucceeds(third.api.logDownload('file'));
 await assertFails(f.updateDoc(f.doc(third.db,'rede_publicacoes','file'),{onlineEditHistory:[]}));
 await assertFails(f.updateDoc(f.doc(third.db,'rede_publicacoes','file'),{url:'https://bad'}));

 // Privacy contract: coordinator role alone grants ZERO access to a private folder.
 // The coordinator gains access only after the owner explicitly includes that memberId.
 await env.withSecurityRulesDisabled(async c=>{
  const db=c.firestore();
  await f.setDoc(f.doc(db,'rede_repository_packages','privacy'),{ownerMemberId:'alu',ownerName:'Aluno',createdByUid:'alu',createdByMemberId:'alu',accessMode:'private',allowedMemberIds:['alu']});
  await f.setDoc(f.doc(db,'rede_repository_packages','privacy','files','a'),{fileName:'only-owner.docx',url:'https://storage/private',onlineEditVersion:1,createdByUid:'alu',ts:new Date()});
 });
 await assertSucceeds(f.getDoc(f.doc(alu.db,'rede_repository_packages','privacy')));
 await assertSucceeds(f.getDoc(f.doc(alu.db,'rede_repository_packages','privacy','files','a')));
 await assertFails(f.getDoc(f.doc(prof.db,'rede_repository_packages','privacy')));
 await assertFails(f.getDoc(f.doc(prof.db,'rede_repository_packages','privacy','files','a')));
 await assertFails(f.getDoc(f.doc(third.db,'rede_repository_packages','privacy','files','a')));
 await assertSucceeds(f.updateDoc(f.doc(alu.db,'rede_repository_packages','privacy'),{accessMode:'selected',allowedMemberIds:['alu','prof']}));
 await assertSucceeds(f.getDoc(f.doc(prof.db,'rede_repository_packages','privacy')));
 await assertSucceeds(f.getDoc(f.doc(prof.db,'rede_repository_packages','privacy','files','a')));
 await assertFails(f.getDoc(f.doc(third.db,'rede_repository_packages','privacy','files','a')));
 console.log('PASS: coordinator cannot read private package; explicit owner selection grants access only to the chosen coordinator.');

 await env.withSecurityRulesDisabled(async c=>{const db=c.firestore();await f.setDoc(f.doc(db,'rede_repository_packages','pkg'),{ownerMemberId:'alu',ownerName:'Aluno',createdByUid:'alu',createdByMemberId:'alu',accessMode:'selected',allowedMemberIds:['alu','prof']});await f.setDoc(f.doc(db,'rede_repository_packages','pkg','files','a'),{fileName:'private.docx',url:'https://storage/p1',onlineEditVersion:1,createdByUid:'alu',ts:new Date()})});
 await assertSucceeds(prof.api.logDownload('package:pkg:a'));
 await assertSucceeds(prof.api.commitUploadAndMessage('package:pkg:a',{name:'private-v2.docx',size:100},'Corrigi'));
 await assertSucceeds(alu.api.commitUploadAndMessage('package:pkg:a',{name:'private-v3.docx',size:100},'Ajustei'));
 const privateFile=await f.getDoc(f.doc(alu.db,'rede_repository_packages','pkg','files','a'));assert.equal(privateFile.data().onlineEditVersion,3);
 await assertFails(f.getDoc(f.doc(third.db,'rede_repository_packages','pkg','files','a')));
 const batch=f.writeBatch(alu.db);await alu.api.addMessageReceipt(batch,{id:'package:pkg:a',threadId:tid,targetId:'prof',version:3},tid);await assertSucceeds(batch.commit());
 console.log('PASS: selected package v1 → v2 → v3 and contextual message receipt; third-party file read denied.');
 console.log('PASS: real Firestore transactions v1 → v2 → v3, receipts, messages, notifications, third-party isolation, history tampering rejection.');
 }finally{await env.cleanup()}
})().catch(e=>{console.error(e);process.exitCode=1});
