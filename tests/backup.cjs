const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {Readable}=require('node:stream');const backup=require('../ops/backup.cjs');
class Timestamp{constructor(seconds,nanoseconds){this.seconds=seconds;this.nanoseconds=nanoseconds}}
class GeoPoint{constructor(latitude,longitude){this.latitude=latitude;this.longitude=longitude}}
const db={doc:p=>({path:p,firestore:true})};
test('tipos Firestore e campos especiais sobrevivem ida e volta',()=>{
 const input={name:"Foto d'água",n:NaN,inf:Infinity,minus:-Infinity,empty:null,zero:0,flag:false,date:new Timestamp(123,123456789),point:new GeoPoint(-16,-57),binary:Buffer.from([0,250,255]),ref:db.doc('rede_members/alice'),items:[{t:'timestamp',v:'texto comum'}]};
 const output=backup.decode(JSON.parse(JSON.stringify(backup.encode(input))),db,{Timestamp,GeoPoint});assert.deepEqual(output,input);
});
test('caminhos de manifesto não escapam do diretório',()=>{for(const p of ['../secret','/etc/passwd','objects/../../secret','..\\secret'])assert.throws(()=>backup.inside('/tmp/copy',p));});
test('exporta subcoleções de pais ausentes, bytes das fotos e detecta corrupção',async()=>{
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'carbonautas-test-'));const root=path.join(temp,'snapshot');
 const child={id:'messages',listDocuments:async()=>[{path:'rede_chat_threads/t/messages/m',get:async()=>({exists:true,data:()=>({text:'Olá',sentAt:new Timestamp(1,2)})}),listCollections:async()=>[]}]};
 const source={projectId:'demo-carbonautas',listCollections:async()=>[{id:'rede_chat_threads',listDocuments:async()=>[{path:'rede_chat_threads/t',get:async()=>({exists:false}),listCollections:async()=>[child]}]},{id:'outro_sistema',listDocuments:async()=>{throw Error('fora de escopo')}}]};
 const bytes=Buffer.from('imagem de teste');const object={name:'rede_uploads/alice/foto.jpg',getMetadata:async()=>[{generation:'12',contentType:'image/jpeg',metadata:{firebaseStorageDownloadTokens:'token-falso'}}]};
 const bucket={name:'test-bucket',getFiles:async()=>[[object]],file:(name,opt)=>{assert.equal(opt.generation,'12');return {createReadStream:()=>Readable.from(bytes)}}};
 try{const manifest=await backup.exportSnapshot(root,source,bucket);assert.equal(manifest.documents,1);assert.equal(manifest.objects,1);assert.equal(manifest.complete,true);await backup.verify(root);
 const file=manifest.files.find(x=>x.object);assert.deepEqual(await fs.readFile(path.join(root,file.file)),bytes);assert.equal(file.metadata.metadata.firebaseStorageDownloadTokens,'token-falso');
 await fs.writeFile(path.join(root,file.file),'arquivo alterado');await assert.rejects(backup.verify(root),/incompleto\/alterado/);
 }finally{await fs.rm(temp,{recursive:true,force:true})}
});
test('restauração recupera ausentes e nunca sobrescreve documentos/objetos existentes',async()=>{
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'carbonautas-restore-'));
 try{
 await fs.writeFile(path.join(temp,'firestore.ndjson'),['existing','missing'].map(id=>JSON.stringify({path:'rede_members/'+id,data:backup.encode({nome:id,at:new Timestamp(4,5)})})).join('\n'));
 await fs.writeFile(path.join(temp,'photo'),'foto');const docs=new Map([['rede_members/existing',{nome:'texto mais recente'}]]),objects=new Map([['rede_uploads/existing','foto mais recente']]);
 const mockDb={doc:p=>({create:async data=>{if(docs.has(p)){const e=Error('exists');e.code=6;throw e}docs.set(p,data)}})};
 const bucket={file:p=>({exists:async()=>[objects.has(p)]}),upload:async(p,opts)=>{assert.equal(opts.preconditionOpts.ifGenerationMatch,0);objects.set(opts.destination,await fs.readFile(p,'utf8'))}};
 const m={files:[{file:'photo',object:'rede_uploads/existing'},{file:'photo',object:'rede_uploads/missing'}]};
 const result=await backup.restoreMissing(temp,m,mockDb,bucket,{Timestamp,GeoPoint});assert.deepEqual(result,{restoredDocuments:1,restoredObjects:1,skipped:2,overwritten:0});assert.equal(docs.get('rede_members/existing').nome,'texto mais recente');assert.equal(objects.get('rede_uploads/existing'),'foto mais recente');assert.equal(objects.get('rede_uploads/missing'),'foto');assert.ok(docs.get('rede_members/missing').at instanceof Timestamp);
 }finally{await fs.rm(temp,{recursive:true,force:true})}
});
