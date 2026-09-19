#!/usr/bin/env bash
set -euo pipefail

cd /opt/carbonautas-bridge
TS=$(date +%Y%m%d-%H%M%S)
cp -f server.js "server.js.bak-p14-${TS}"

python3 - <<'PY'
from pathlib import Path
p=Path('/opt/carbonautas-bridge/server.js')
s=p.read_text(encoding='utf-8')
marker='/* ===== P14 · PREVIEW SEGURO ===== */'
if marker in s:
    print('P14 já estava aplicado. Nenhuma duplicação feita.')
else:
    pos=s.rfind('app.listen(')
    if pos<0:
        raise SystemExit('ERRO: não encontrei app.listen(...) no server.js. Backup preservado; nada foi alterado.')
    block=r'''
/* ===== P14 · PREVIEW SEGURO ===== */
const PREVIEW_MIME={
  pdf:'application/pdf',
  doc:'application/msword',
  docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  rtf:'application/rtf',
  odt:'application/vnd.oasis.opendocument.text',
  xls:'application/vnd.ms-excel',
  xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ods:'application/vnd.oasis.opendocument.spreadsheet',
  ppt:'application/vnd.ms-powerpoint',
  pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  odp:'application/vnd.oasis.opendocument.presentation',
  png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif',svg:'image/svg+xml',
  csv:'text/csv; charset=utf-8',txt:'text/plain; charset=utf-8'
};
function previewAllowedPackage(pkg,user){
  const ids=Array.isArray(pkg.allowedMemberIds)?pkg.allowedMemberIds:[];
  if(pkg.accessMode==='network')return true;
  return ids.includes(user.memberId)||pkg.ownerUid===user.uid||pkg.createdByUid===user.uid||pkg.ownerMemberId===user.memberId||pkg.createdByMemberId===user.memberId;
}
async function previewMetaFromTicket(payload){
  if(payload.source==='publication'){
    const snap=await db.collection('rede_publicacoes').doc(String(payload.id||'')).get();
    if(!snap.exists)throw new Error('Arquivo não encontrado no Repositório.');
    const p=snap.data();
    if(p.tipo!=='arquivo'||!p.url)throw new Error('O item não possui arquivo válido.');
    return {url:p.url,storagePath:p.storagePath||'',fileName:p.fileName||p.titulo||'arquivo',mimeType:p.mimeType||p.mime||p.contentType||''};
  }
  if(payload.source==='package'){
    const pkgSnap=await db.collection('rede_repository_packages').doc(String(payload.packageId||'')).get();
    if(!pkgSnap.exists)throw new Error('Dossiê não encontrado.');
    const pkg=pkgSnap.data();
    const userSnap=await db.collection('rede_users').doc(String(payload.uid||'')).get();
    if(!userSnap.exists)throw new Error('Perfil do destinatário não existe mais.');
    const user={uid:payload.uid,...userSnap.data()};
    if(!previewAllowedPackage(pkg,user))throw new Error('Seu acesso a este dossiê foi removido.');
    const fileSnap=await pkgSnap.ref.collection('files').doc(String(payload.fileId||'')).get();
    if(!fileSnap.exists)throw new Error('Arquivo do dossiê não encontrado.');
    const f=fileSnap.data();
    if(!f.url&&!f.storagePath)throw new Error('O arquivo não possui fonte válida.');
    return {url:f.url||'',storagePath:f.storagePath||'',fileName:f.fileName||f.title||'arquivo',mimeType:f.mimeType||''};
  }
  throw new Error('Origem de visualização inválida.');
}
function firebaseObjectPathFromUrl(u){
  try{
    const x=new URL(u||'');
    const i=x.pathname.indexOf('/o/');
    if(i<0)return '';
    return decodeURIComponent(x.pathname.slice(i+3));
  }catch{return ''}
}
async function loadPreviewBytes(meta){
  let storagePath=meta.storagePath||firebaseObjectPathFromUrl(meta.url||'');
  if(storagePath){
    try{
      const [buf]=await bucket.file(storagePath).download();
      return buf;
    }catch(e){console.warn('PREVIEW STORAGE ADMIN:',e.message)}
  }
  if(!/^https?:\/\//i.test(meta.url||''))throw new Error('URL original inválida.');
  const r=await fetch(meta.url,{redirect:'follow'});
  if(!r.ok)throw new Error('Não foi possível recuperar o arquivo original: HTTP '+r.status);
  return Buffer.from(await r.arrayBuffer());
}
app.post('/api/preview-ticket',requireUser,async(req,res)=>{
  try{
    const source=String(req.body?.source||'');
    let payload={purpose:'carbonautas-preview',source,uid:req.user.uid,memberId:req.user.memberId};
    if(source==='publication'){
      const id=String(req.body?.id||'');
      if(!id)return res.status(400).json({error:'ID do arquivo ausente.'});
      const snap=await db.collection('rede_publicacoes').doc(id).get();
      if(!snap.exists)return res.status(404).json({error:'Arquivo não encontrado.'});
      // O Repositório legado é legível por integrante autenticado, como nas regras atuais.
      payload.id=id;
    }else if(source==='package'){
      const packageId=String(req.body?.packageId||''),fileId=String(req.body?.fileId||'');
      if(!packageId||!fileId)return res.status(400).json({error:'Dossiê ou arquivo ausente.'});
      const pkgSnap=await db.collection('rede_repository_packages').doc(packageId).get();
      if(!pkgSnap.exists)return res.status(404).json({error:'Dossiê não encontrado.'});
      if(!previewAllowedPackage(pkgSnap.data(),req.user))return res.status(403).json({error:'Você não está autorizado a ver este dossiê.'});
      const fsnap=await pkgSnap.ref.collection('files').doc(fileId).get();
      if(!fsnap.exists)return res.status(404).json({error:'Arquivo não encontrado no dossiê.'});
      payload.packageId=packageId;payload.fileId=fileId;
    }else return res.status(400).json({error:'Origem de visualização não suportada.'});
    const ticket=jwt.sign(payload,OO_SECRET,{algorithm:'HS256',expiresIn:'30m'});
    res.json({ok:true,url:PUBLIC_BASE+'/carbonautas-api/api/preview-file/'+encodeURIComponent(ticket),expiresInSeconds:1800});
  }catch(e){console.error('PREVIEW TICKET:',e);res.status(500).json({error:'Falha ao preparar visualização: '+e.message});}
});
app.get('/api/preview-file/:ticket',async(req,res)=>{
  try{
    const payload=jwt.verify(String(req.params.ticket||''),OO_SECRET,{algorithms:['HS256']});
    if(payload.purpose!=='carbonautas-preview')return res.status(403).send('Ticket inválido.');
    const meta=await previewMetaFromTicket(payload);
    const buf=await loadPreviewBytes(meta);
    const ext=fileExt(meta.fileName||'',meta.url||'');
    const type=meta.mimeType||PREVIEW_MIME[ext]||'application/octet-stream';
    const safeName=String(meta.fileName||('arquivo'+(ext?'.'+ext:''))).replace(/[\r\n"]/g,'_');
    res.setHeader('Content-Type',type);
    res.setHeader('Content-Disposition',`inline; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(meta.fileName||safeName)}`);
    res.setHeader('Cache-Control','private, max-age=60');
    res.setHeader('X-Content-Type-Options','nosniff');
    res.send(buf);
  }catch(e){console.error('PREVIEW FILE:',e.message);res.status(403).type('text/plain').send('Visualização expirada ou não autorizada. Reabra o arquivo no Carbonautas.');}
});
/* ===== /P14 · PREVIEW SEGURO ===== */

'''
    s=s[:pos]+block+s[pos:]
    p.write_text(s,encoding='utf-8')
    print('Bloco P14 inserido com sucesso.')
PY

node --check server.js
systemctl restart carbonautas-bridge.service
sleep 2
systemctl --no-pager --full status carbonautas-bridge.service | sed -n '1,18p'
echo
echo 'Healthcheck:'
curl -fsS http://127.0.0.1:3000/health || true
echo
echo 'P14 aplicado. O endpoint de preview exige login para gerar ticket e usa URL temporária de 30 minutos.'
