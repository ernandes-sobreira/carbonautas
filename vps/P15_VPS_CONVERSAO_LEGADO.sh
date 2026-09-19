#!/usr/bin/env bash
set -euo pipefail

cd /opt/carbonautas-bridge
TS=$(date +%Y%m%d-%H%M%S)
cp -f server.js "server.js.bak-p15-${TS}"

python3 - <<'PY'
from pathlib import Path
p=Path('/opt/carbonautas-bridge/server.js')
s=p.read_text(encoding='utf-8')
marker='/* ===== P15 · CONVERSÃO LEGADO OFFICE ===== */'
if marker in s:
    print('P15 já estava aplicado. Nenhuma duplicação feita.')
else:
    if '/* ===== P14 · PREVIEW SEGURO ===== */' not in s:
        raise SystemExit('ERRO: o bloco P14 de preview seguro não foi encontrado. Aplique primeiro o P14. Backup preservado.')
    pos=s.rfind('app.listen(')
    if pos<0:
        raise SystemExit('ERRO: não encontrei app.listen(...) no server.js. Backup preservado.')
    block=r'''
/* ===== P15 · CONVERSÃO LEGADO OFFICE ===== */
const LEGACY_OFFICE_TARGET={doc:'docx',xls:'xlsx',ppt:'pptx'};
const LEGACY_OFFICE_MIME={
  docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation'
};
function safeConvertedName(name,fromExt,toExt){
  const src=String(name||('arquivo.'+fromExt)).replace(/[\\/:*?"<>|\r\n]+/g,'_');
  const re=new RegExp('\\.'+fromExt+'$','i');
  return (src.replace(re,'')||'arquivo')+'.'+toExt;
}
function persistentFirebaseUrl(storagePath,token){
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media&token=${encodeURIComponent(token)}`;
}
app.post('/api/convert-legacy/:pubId',requireUser,async(req,res)=>{
  try{
    const pubSnap=await db.collection('rede_publicacoes').doc(String(req.params.pubId||'')).get();
    if(!pubSnap.exists)return res.status(404).json({error:'Arquivo não encontrado no Repositório.'});
    const p=pubSnap.data();
    if(p.tipo!=='arquivo')return res.status(400).json({error:'Este item não é um arquivo.'});
    const memberId=req.user.memberId,coord=isCoordinator(req.user);
    const ownerAccess=coord||p.ownerUid===req.user.uid||p.memberId===memberId;
    const reviewAccess=!!(p.reviewFlow&&(p.reviewNextRecipientId===memberId||coord));
    if(p.reviewFlow){if(!reviewAccess)return res.status(403).json({error:'Este arquivo está com outra pessoa neste momento.'});}
    else if(!ownerAccess)return res.status(403).json({error:'Você não tem permissão para converter este arquivo.'});

    const info=await resolveOfficeFile(p),fromExt=String(info.ext||'').toLowerCase(),toExt=LEGACY_OFFICE_TARGET[fromExt];
    if(!toExt)return res.status(400).json({error:'Este formato não precisa ou não pode ser convertido por este fluxo.'});

    // O Document Server precisa buscar o binário. Usamos o ticket temporário do P14,
    // em vez de expor permanentemente a URL privada do Storage.
    const sourceTicket=jwt.sign({purpose:'carbonautas-preview',source:'publication',uid:req.user.uid,memberId:req.user.memberId,id:req.params.pubId},OO_SECRET,{algorithm:'HS256',expiresIn:'10m'});
    const sourceUrl=PUBLIC_BASE+'/carbonautas-api/api/preview-file/'+encodeURIComponent(sourceTicket);
    const key=crypto.createHash('sha256').update(String(req.params.pubId)+':convert:'+fromExt+':'+Date.now()+':'+crypto.randomBytes(8).toString('hex')).digest('hex').slice(0,40);
    const title=info.fileName||p.fileName||p.titulo||('arquivo.'+fromExt);
    const conv={async:false,filetype:fromExt,key,outputtype:toExt,title,url:sourceUrl};
    const token=jwt.sign(conv,OO_SECRET,{algorithm:'HS256'});
    const cr=await fetch(OO_INTERNAL+'/converter?shardkey='+encodeURIComponent(key),{
      method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({...conv,token})
    });
    const cj=await cr.json().catch(async()=>({raw:await cr.text().catch(()=> '')}));
    if(!cr.ok)throw new Error('ONLYOFFICE converter HTTP '+cr.status);
    if(cj.error)throw new Error('ONLYOFFICE converter erro '+cj.error);
    if(!cj.endConvert||!cj.fileUrl)throw new Error('A conversão não terminou. Tente novamente em alguns segundos.');
    const convertedUrl=normalizeDownloadUrl(cj.fileUrl);
    const rr=await fetch(convertedUrl,{redirect:'follow'});
    if(!rr.ok)throw new Error('Não consegui baixar o arquivo convertido: HTTP '+rr.status);
    const buf=Buffer.from(await rr.arrayBuffer());
    if(buf.length<200)throw new Error('O arquivo convertido veio vazio ou inválido.');

    const newName=safeConvertedName(title,fromExt,toExt);
    const safeStorageName=newName.replace(/[^a-zA-Z0-9._-]+/g,'_').slice(-140);
    const storagePath=`rede_publicacoes/${p.memberId||memberId}/converted/${Date.now()}_${crypto.randomBytes(4).toString('hex')}_${safeStorageName}`;
    const downloadToken=crypto.randomUUID();
    await bucket.file(storagePath).save(buf,{resumable:false,metadata:{contentType:LEGACY_OFFICE_MIME[toExt],metadata:{firebaseStorageDownloadTokens:downloadToken}}});
    const url=persistentFirebaseUrl(storagePath,downloadToken);

    const original=p.legacyOriginal||{
      url:p.url||'',fileName:p.fileName||title,storagePath:p.storagePath||'',ext:fromExt,mimeType:p.mimeType||p.mime||p.contentType||''
    };
    await pubSnap.ref.set({
      legacyOriginal:original,
      convertedFrom:fromExt,
      convertedAt:FieldValue.serverTimestamp(),
      url,fileName:newName,storagePath,mimeType:LEGACY_OFFICE_MIME[toExt],detectedExt:toExt,officeExt:toExt
    },{merge:true});
    res.json({ok:true,ext:toExt,fileName:newName,url,storagePath,originalPreserved:true});
  }catch(e){
    console.error('CONVERT LEGACY:',e);
    res.status(500).json({error:'Falha ao converter arquivo antigo: '+e.message});
  }
});
/* ===== /P15 · CONVERSÃO LEGADO OFFICE ===== */

'''
    s=s[:pos]+block+s[pos:]
    p.write_text(s,encoding='utf-8')
    print('Bloco P15 inserido com sucesso.')
PY

node --check server.js
systemctl restart carbonautas-bridge.service
sleep 2
systemctl --no-pager --full status carbonautas-bridge.service | sed -n '1,18p'
echo
echo 'Healthcheck do bridge:'
curl -fsS http://127.0.0.1:3000/health || true
echo
echo 'Teste de presença do conversor ONLYOFFICE (erro de parâmetros é aceitável; 404 NÃO é):'
HTTP=$(curl -sS -o /tmp/p15_converter_probe.txt -w '%{http_code}' -X POST http://127.0.0.1:8080/converter -H 'Content-Type: application/json' -H 'Accept: application/json' -d '{}' || true)
echo "HTTP ${HTTP}"
head -c 300 /tmp/p15_converter_probe.txt 2>/dev/null || true
echo
echo 'P15 aplicado. Agora arquivos DOC/XLS/PPT legados podem ser convertidos para OOXML antes da edição.'
