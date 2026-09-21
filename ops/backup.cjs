#!/usr/bin/env node
'use strict';
// Read-only export. Use the bridge's installed firebase-admin, never copy its credential to Git.
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const {createReadStream}=require('node:fs'),{pipeline}=require('node:stream/promises'),{createRequire}=require('node:module');
const readline=require('node:readline');
function sdk(){return createRequire(path.join(process.env.CARBONAUTAS_BRIDGE_DIR||'/opt/carbonautas-bridge','package.json'))('firebase-admin')}
function encode(value){
 if(value===null)return {t:'null'};
 if(value===undefined)throw Error('Undefined não é um valor exportável');
 if(typeof value==='number')return {t:'number',v:Number.isFinite(value)?value:String(value)};
 if(typeof value==='string'||typeof value==='boolean')return {t:typeof value,v:value};
 if(Buffer.isBuffer(value)||value instanceof Uint8Array)return {t:'bytes',v:Buffer.from(value).toString('base64')};
 if(value instanceof Date)return {t:'date',v:value.toISOString()};
 if(typeof value.seconds==='number'&&typeof value.nanoseconds==='number')return {t:'timestamp',s:value.seconds,n:value.nanoseconds};
 if(typeof value.latitude==='number'&&typeof value.longitude==='number')return {t:'geopoint',lat:value.latitude,lng:value.longitude};
 if(typeof value.path==='string'&&value.firestore)return {t:'reference',v:value.path};
 if(Array.isArray(value))return {t:'array',v:value.map(encode)};
 return {t:'map',v:Object.fromEntries(Object.entries(value).map(([k,v])=>[k,encode(v)]))};
}
function decode(value,db,types){
 switch(value.t){
 case 'null':return null;case 'string':case 'boolean':return value.v;
 case 'number':return typeof value.v==='number'?value.v:Number(value.v);
 case 'bytes':return Buffer.from(value.v,'base64');case 'date':return new Date(value.v);
 case 'timestamp':return new types.Timestamp(value.s,value.n);
 case 'geopoint':return new types.GeoPoint(value.lat,value.lng);
 case 'reference':return db.doc(value.v);case 'array':return value.v.map(x=>decode(x,db,types));
 case 'map':return Object.fromEntries(Object.entries(value.v).map(([k,v])=>[k,decode(v,db,types)]));
 default:throw Error('Tipo desconhecido no backup: '+value.t);
 }
}
async function hash(file){const digest=crypto.createHash('sha256');for await(const chunk of createReadStream(file))digest.update(chunk);return digest.digest('hex')}
function inside(root,relative){if(path.isAbsolute(relative)||relative.split(/[\\/]/).includes('..'))throw Error('Caminho inválido no manifesto');const p=path.resolve(root,relative);if(!p.startsWith(path.resolve(root)+path.sep))throw Error('Caminho fora do backup');return p}
async function verify(root){
 const manifest=JSON.parse(await fs.readFile(path.join(root,'manifest.json'),'utf8'));
 if(!Array.isArray(manifest.files)||manifest.files.filter(x=>x.file==='firestore.ndjson'&&!x.object).length!==1||new Set(manifest.files.map(x=>x.file)).size!==manifest.files.length||manifest.files.filter(x=>x.object).length!==manifest.objects)throw Error('Manifesto inconsistente');
 if(manifest.format!=='carbonautas-backup-v1'||manifest.complete!==true)throw Error('Backup incompleto ou formato desconhecido');
 for(const file of manifest.files){const p=inside(root,file.file);const st=await fs.lstat(p);if(!st.isFile()||st.isSymbolicLink()||st.size!==file.bytes||await hash(p)!==file.sha256)throw Error('Arquivo incompleto/alterado: '+file.file)}
 let docs=0;for await(const line of readline.createInterface({input:createReadStream(path.join(root,'firestore.ndjson')),crlfDelay:Infinity})){if(!line)continue;const row=JSON.parse(line);if(!/^rede_[^/]+(?:\/[^/]+)+$/.test(row.path)||row.path.split('/').length%2)throw Error('Documento fora do escopo');docs++}
 if(docs!==manifest.documents)throw Error('Contagem de documentos divergente');
 return manifest;
}
async function exportSnapshot(root,db,bucket){
 await fs.mkdir(root,{recursive:false,mode:0o700});await fs.mkdir(path.join(root,'objects'),{mode:0o700});
 const manifest={format:'carbonautas-backup-v1',complete:false,projectId:db.projectId,bucket:bucket.name,startedAt:new Date().toISOString(),documents:0,objects:0,files:[],collections:[],limitations:['Exportação por leitura, não transação global; executar em horário de menor uso.','Contas e senhas do Firebase Authentication não estão incluídas.','Links externos (Drive/YouTube etc.) não são arquivos deste bucket.']};
 const output=await fs.open(path.join(root,'firestore.ndjson'),'wx',0o600);
 async function visit(collection){
  // listDocuments includes missing parent docs with live subcollections.
  for(const ref of await collection.listDocuments()){
   const snap=await ref.get();if(snap.exists){await output.write(JSON.stringify({path:ref.path,data:encode(snap.data())})+'\n');manifest.documents++}
   for(const child of await ref.listCollections())await visit(child);
  }
 }
 try{for(const collection of (await db.listCollections()).filter(c=>c.id.startsWith('rede_'))){manifest.collections.push(collection.id);await visit(collection)}}finally{await output.close()}
 const entries=await bucket.getFiles({prefix:'rede_',autoPaginate:true});
 for(const item of entries[0]){
  const [metadata]=await item.getMetadata();const name=crypto.createHash('sha256').update(item.name).digest('hex');const relative='objects/'+name;
  // Pin the generation so a concurrent replacement never changes the bytes being read.
  await pipeline(bucket.file(item.name,{generation:metadata.generation}).createReadStream(),require('node:fs').createWriteStream(path.join(root,relative),{flags:'wx',mode:0o600}));
  const stat=await fs.stat(path.join(root,relative));
  manifest.files.push({file:relative,object:item.name,generation:metadata.generation,bytes:stat.size,sha256:await hash(path.join(root,relative)),metadata:{contentType:metadata.contentType||'application/octet-stream',cacheControl:metadata.cacheControl||'',contentDisposition:metadata.contentDisposition||'',metadata:metadata.metadata||{}}});manifest.objects++;
 }
 const stat=await fs.stat(path.join(root,'firestore.ndjson'));manifest.files.unshift({file:'firestore.ndjson',bytes:stat.size,sha256:await hash(path.join(root,'firestore.ndjson'))});
 manifest.complete=true;manifest.finishedAt=new Date().toISOString();await fs.writeFile(path.join(root,'manifest.json'),JSON.stringify(manifest,null,2),{mode:0o600,flag:'wx'});
 await verify(root);return manifest;
}
async function restoreMissing(dir,m,db,bucket,types){
 let restoredDocuments=0,restoredObjects=0,skipped=0;
 for(const entry of m.files.filter(x=>x.object)){
  if(!entry.object.startsWith('rede_'))throw Error('Objeto fora do escopo');const object=bucket.file(entry.object);
  if((await object.exists())[0]){skipped++;continue}
  try{await bucket.upload(inside(dir,entry.file),{destination:entry.object,metadata:entry.metadata,preconditionOpts:{ifGenerationMatch:0}});restoredObjects++}catch(e){if(Number(e.code)===412){skipped++;continue}throw e}
 }
 for await(const line of readline.createInterface({input:createReadStream(path.join(dir,'firestore.ndjson')),crlfDelay:Infinity})){
  if(!line)continue;const row=JSON.parse(line);try{await db.doc(row.path).create(decode(row.data,db,types));restoredDocuments++}catch(e){if(e.code===6||e.code==='already-exists'){skipped++;continue}throw e}
 }
 return {restoredDocuments,restoredObjects,skipped,overwritten:0};
}
async function main(){
 const [command,dir,...args]=process.argv.slice(2);if(!['export','verify','restore-missing'].includes(command)||!dir)throw Error('Uso: node backup.cjs export|verify|restore-missing DIRETORIO [--apply --confirm=PROJETO]');
 process.umask(0o077);
 if(command==='verify'){const m=await verify(dir);console.log(JSON.stringify({verified:true,documents:m.documents,objects:m.objects}));return}
 if(command==='restore-missing'&&!args.includes('--apply')){const m=await verify(dir);console.log(JSON.stringify({mode:'plano; nenhuma gravação',projectId:m.projectId,bucket:m.bucket,documents:m.documents,objects:m.objects,policy:'Somente itens ausentes; existentes nunca são sobrescritos.'}));return}
 const admin=sdk();const credentialPath=process.env.GOOGLE_APPLICATION_CREDENTIALS;
 if(!credentialPath)throw Error('Defina GOOGLE_APPLICATION_CREDENTIALS no servidor. Não envie essa chave por chat nem ao GitHub.');
 const serviceAccount=JSON.parse(await fs.readFile(credentialPath,'utf8'));const projectId=serviceAccount.project_id;
 if(projectId!=='brasa-pantanal')throw Error('Projeto inesperado; este utilitário é exclusivo do Carbonautas/brasa-pantanal.');
 const app=admin.initializeApp({credential:admin.credential.cert(serviceAccount),projectId,storageBucket:'brasa-pantanal.firebasestorage.app'});
 const db=app.firestore(),bucket=app.storage().bucket();
 try{
 if(command==='export'){const m=await exportSnapshot(dir,db,bucket);console.log(JSON.stringify({complete:true,documents:m.documents,objects:m.objects}));return}
 const m=await verify(dir);if(m.projectId!==projectId||m.bucket!==bucket.name||!args.includes('--confirm='+projectId))throw Error('Restauração exige projeto/bucket originais e --confirm='+projectId);
 console.log(JSON.stringify(await restoreMissing(dir,m,db,bucket,admin.firestore)));
 }finally{await app.delete()}
}
module.exports={encode,decode,hash,inside,verify,exportSnapshot,restoreMissing};
if(require.main===module)main().catch(e=>{console.error('Backup não concluído:',e.message);process.exitCode=1});
