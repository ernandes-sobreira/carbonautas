#!/usr/bin/env bash
set -euo pipefail

cd /opt/carbonautas-bridge
TS=$(date +%Y%m%d-%H%M%S)
cp -f server.js "server.js.bak-p16-${TS}"

echo "Aplicando P16 - salvamento robusto ONLYOFFICE..."
python3 - <<'PY'
from pathlib import Path
import re
p=Path('/opt/carbonautas-bridge/server.js')
s=p.read_text(encoding='utf-8')
marker='/* ===== P16 ONLYOFFICE SAVEFLOW ===== */'
if marker in s:
    print('P16 já aplicado. Nenhuma duplicação feita.')
else:
    pattern=r"app\.post\('/api/session/:key/force-save',requireUser,async\(req,res\)=>\{.*?\n\}\);\n(?=app\.get\('/api/session/:key/status')"
    m=re.search(pattern,s,re.S)
    if not m:
        raise SystemExit('ERRO: endpoint /force-save atual não encontrado. Backup preservado; nada foi alterado.')
    block=r'''/* ===== P16 ONLYOFFICE SAVEFLOW ===== */
async function carbonautasForceSaveRequest(s){
  const payload={c:'forcesave',key:s.key,userdata:'carbonautas'};
  const body={...payload,token:jwt.sign(payload,OO_SECRET,{algorithm:'HS256'})};
  const endpoints=[
    OO_INTERNAL+'/command?shardkey='+encodeURIComponent(s.key),
    OO_INTERNAL+'/coauthoring/CommandService.ashx?shardkey='+encodeURIComponent(s.key)
  ];
  let last={http:0,ok:false,json:{},text:''};
  for(const url of endpoints){
    try{
      const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(body)});
      const text=await r.text();let j={};try{j=JSON.parse(text||'{}')}catch{}
      last={http:r.status,ok:r.ok,json:j,text,url};
      if(r.status===404)continue;
      return last;
    }catch(e){last={http:0,ok:false,json:{},text:e.message,url};}
  }
  return last;
}
app.post('/api/session/:key/force-save',requireUser,async(req,res)=>{
  const s=ownedSession(req,res);if(!s)return;
  try{
    s.ready=false;s.error='';
    const rr=await carbonautasForceSaveRequest(s);
    const j=rr.json||{},code=Number(j.error??(rr.ok?0:rr.http||500));
    if(code===4){
      return res.status(202).json({ok:false,pending:true,code:4,message:'As alterações ainda estão sendo sincronizadas pelo ONLYOFFICE. Aguarde alguns segundos; o Carbonautas tentará novamente.'});
    }
    if(!rr.ok||code!==0){
      return res.status(502).json({ok:false,code,error:'ONLYOFFICE recusou o salvamento. Erro '+String(code||rr.http||'desconhecido')});
    }
    return res.json({ok:true,code:0,key:s.key});
  }catch(e){console.error('FORCESAVE P16:',e);res.status(500).json({ok:false,error:e.message});}
});
/* ===== /P16 ONLYOFFICE SAVEFLOW ===== */
'''
    s=s[:m.start()]+block+s[m.end():]
    s=s.replace("version:'P6'","version:'P16'")
    p.write_text(s,encoding='utf-8')
    print('Endpoint P16 aplicado.')
PY

node --check server.js
systemctl restart carbonautas-bridge.service
sleep 2

echo
echo '=== P16 STATUS ==='
systemctl --no-pager --full status carbonautas-bridge.service | sed -n '1,18p'
echo
echo '=== P16 HEALTH ==='
curl -fsS http://127.0.0.1:3000/health || true
echo
echo
echo 'P16 CONCLUIDO'
