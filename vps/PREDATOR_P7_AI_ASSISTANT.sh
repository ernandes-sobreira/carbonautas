#!/usr/bin/env bash
set -euo pipefail

# Installs the authenticated Mona assistant routes into the currently deployed
# Carbonautas bridge without replacing the rest of server.js.
cd /opt/carbonautas-bridge
test -f server.js || { echo 'ERRO: /opt/carbonautas-bridge/server.js não encontrado.'; exit 1; }
if grep -q "CARBONAUTAS_AI_ASSISTANT_P224" server.js; then
  echo 'As rotas P224 já estão instaladas; nenhuma alteração aplicada.'
  exit 0
fi
cp -f server.js "server.js.bak-p224-$(date +%Y%m%d-%H%M%S)"

python3 - <<'PY'
from pathlib import Path
p=Path('/opt/carbonautas-bridge/server.js')
s=p.read_text()
anchor="app.listen(3000,'127.0.0.1'"
if anchor not in s:
    raise SystemExit('ERRO: não encontrei app.listen esperado; backup preservado e nada foi alterado.')
if "CARBONAUTAS_AI_ASSISTANT_P224" in s:
    raise SystemExit('As rotas P224 já estão instaladas.')
s=s.replace("app.use(express.json({limit:'2mb'}));", "app.use(express.json({limit:'12mb'}));", 1)
routes=r'''
// CARBONAUTAS_AI_ASSISTANT_P224 — Mona, acompanhamento estudantil
const AI_MODEL = process.env.CARBONAUTAS_AI_MODEL || 'gpt-5-mini';
const AI_MAX_FILES = 3;
const AI_MAX_FILE_BYTES = 2 * 1024 * 1024;
const aiRate = new Map();
function aiRateLimit(uid){
  const now=Date.now(),slot=aiRate.get(uid)||{start:now,count:0};
  if(now-slot.start>60*60*1000){slot.start=now;slot.count=0;}
  slot.count++;aiRate.set(uid,slot);return slot.count<=40;
}
function aiText(v,n=4000){return String(v||'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,' ').trim().slice(0,n);}
function aiIsImage(mt){return /^image\/(png|jpeg|webp|gif)$/i.test(String(mt||''));}
function aiAllowedFile(name,mt){
  const ext=String(name||'').toLowerCase().split('.').pop();
  return ['pdf','docx','pptx','xlsx','xls','csv','tsv','txt','png','jpg','jpeg','webp','gif'].includes(ext) ||
    ['application/pdf','text/plain','text/csv','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.presentationml.presentation','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.ms-excel'].includes(String(mt||'').toLowerCase());
}
function aiDecodeDataUrl(data,mime){
  const m=String(data||'').match(/^data:([^;,]+);base64,([A-Za-z0-9+/=\r\n]+)$/);
  if(!m)throw new Error('Arquivo em formato inválido.');
  const buf=Buffer.from(m[2].replace(/\s/g,''),'base64');
  if(!buf.length||buf.length>AI_MAX_FILE_BYTES)throw new Error('Cada arquivo deve ter até 2 MB.');
  return {mime:m[1]||mime||'application/octet-stream',data:'data:'+(m[1]||mime||'application/octet-stream')+';base64,'+buf.toString('base64'),bytes:buf.length};
}
async function aiMember(req){
  const id=String(req.user.memberId||'');
  if(!id)return {id:'',name:aiText(req.user.nome||req.user.email||'Carbonauta',120)};
  const snap=await db.collection('rede_members').doc(id).get();
  return {id,name:aiText(snap.exists?(snap.data().nome||req.user.nome||'Carbonauta'):(req.user.nome||'Carbonauta'),120)};
}
function aiCoordinator(req){return isCoordinator(req.user);}
app.get('/api/assistant/session',requireUser,async(req,res)=>{
  try{
    const ref=db.collection('rede_ai_sessions').doc(req.user.uid),snap=await ref.get(),d=snap.exists?snap.data():{};
    const previous=d.lastEntryAt?.toDate?d.lastEntryAt.toDate():null;
    const inactiveDays=previous?Math.floor((Date.now()-previous.getTime())/86400000):0;
    await ref.set({uid:req.user.uid,memberId:String(req.user.memberId||''),lastEntryAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()},{merge:true});
    res.json({ok:true,inactiveDays,history:Array.isArray(d.history)?d.history.slice(-12):[],isCoordinator:aiCoordinator(req)});
  }catch(e){console.error('AI_SESSION:',e.message);res.status(500).json({error:'Não consegui abrir o acompanhamento agora.'});}
});
app.post('/api/assistant/chat',requireUser,async(req,res)=>{
  try{
    if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:'A Mona está pronta, mas falta conectar a chave de IA ao servidor.'});
    if(!aiRateLimit(req.user.uid))return res.status(429).json({error:'Você já enviou várias mensagens nesta hora. Tente novamente mais tarde.'});
    const text=aiText(req.body?.text,5000),files=Array.isArray(req.body?.files)?req.body.files:[];
    if(files.length>AI_MAX_FILES)return res.status(400).json({error:'Envie no máximo 3 arquivos por mensagem.'});
    const content=[];if(text)content.push({type:'input_text',text});let total=0;
    for(const f of files){
      const name=aiText(f?.name,180),mime=aiText(f?.mimeType,120);
      if(!aiAllowedFile(name,mime))return res.status(400).json({error:'Tipo de arquivo não aceito: '+name});
      const decoded=aiDecodeDataUrl(f?.data,mime);total+=decoded.bytes;
      if(total>5*1024*1024)return res.status(400).json({error:'O tamanho total dos arquivos deve ser de até 5 MB.'});
      if(aiIsImage(decoded.mime))content.push({type:'input_image',image_url:decoded.data,detail:'auto'});
      else content.push({type:'input_file',filename:name,file_data:decoded.data});
    }
    if(!content.length)return res.status(400).json({error:'Escreva uma mensagem ou anexe um arquivo.'});
    const member=await aiMember(req);
    const prev=Array.isArray(req.body?.history)?req.body.history.slice(-12):[];
    const input=prev.map(m=>({role:m?.role==='assistant'?'assistant':'user',content:[{type:'input_text',text:aiText(m?.text,2500)}]})).filter(m=>m.content[0].text);
    input.push({role:'user',content});
    const system=`Você é a Mona, assistente de acompanhamento do Carbonautas, grupo de pesquisa de estudantes. Fale em português brasileiro, com acolhimento, clareza e mensagens curtas. Ajude a registrar o que a pessoa fez, organizar próximos passos, solicitar fotos, planilhas, documentos ou evidências quando forem úteis e pergunte com naturalidade: “Você avisou o orientador?”. Nunca invente que algo foi registrado no sistema: o registro só ocorre após confirmação explícita do estudante. Quando receber um artigo, PDF ou link de artigo, comece com “Topizera! Você é fera! O grupo é fera!” e depois ajude a resumir ou organizar o material. Para links, diga se não conseguir acessar o conteúdo; não invente leitura. Se a pessoa voltar após vários dias, acolha sem repreensão e ajude a reconstruir o período. Nome da pessoa: ${member.name}.`;
    const requestBody={model:AI_MODEL,instructions:system,input,store:false,max_output_tokens:700};
    if(/https?:\/\//i.test(text)){requestBody.tools=[{type:'web_search'}];requestBody.reasoning={effort:'low'};}
    const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Authorization':'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify(requestBody)});
    const data=await response.json().catch(()=>({}));
    if(!response.ok){console.error('AI_PROVIDER:',response.status,data.error?.code||'provider_error');return res.status(502).json({error:'A Mona não conseguiu responder agora. Tente novamente em instantes.'});}
    const reply=aiText(data.output_text||'',5000)||'Recebi sua mensagem, mas não consegui montar a resposta. Pode tentar de novo?';
    const saved=[...prev.map(m=>({role:m?.role==='assistant'?'assistant':'user',text:aiText(m?.text,2500),fileNames:Array.isArray(m?.fileNames)?m.fileNames.slice(0,3).map(n=>aiText(n,180)):[]})),{role:'user',text:text||'Análise de arquivo(s).',fileNames:files.map(f=>aiText(f?.name,180))},{role:'assistant',text:reply}].slice(-12);
    await db.collection('rede_ai_sessions').doc(req.user.uid).set({uid:req.user.uid,memberId:member.id,history:saved,updatedAt:FieldValue.serverTimestamp()},{merge:true});
    res.json({ok:true,reply});
  }catch(e){console.error('AI_CHAT:',e.message);res.status(500).json({error:e.message==='Arquivo em formato inválido.'||e.message==='Cada arquivo deve ter até 2 MB.'?e.message:'Não consegui processar sua mensagem agora.'});}
});
app.post('/api/assistant/activity',requireUser,async(req,res)=>{
  try{
    const member=await aiMember(req),summary=aiText(req.body?.summary,1500);
    if(!summary)return res.status(400).json({error:'Não encontrei um resumo para registrar.'});
    const informed=typeof req.body?.supervisorInformed==='boolean'?req.body.supervisorInformed:null;
    const fileNames=Array.isArray(req.body?.fileNames)?req.body.fileNames.slice(0,3).map(n=>aiText(n,180)):[];
    const ref=await db.collection('rede_ai_activities').add({uid:req.user.uid,memberId:member.id,memberName:member.name,summary,supervisorInformed:informed,fileNames,createdAt:FieldValue.serverTimestamp()});
    res.json({ok:true,id:ref.id});
  }catch(e){console.error('AI_ACTIVITY:',e.message);res.status(500).json({error:'Não consegui registrar a atividade.'});}
});
app.get('/api/assistant/activities',requireUser,async(req,res)=>{
  try{
    if(!aiCoordinator(req))return res.status(403).json({error:'Acesso restrito à coordenação.'});
    const snap=await db.collection('rede_ai_activities').orderBy('createdAt','desc').limit(40).get();
    const items=snap.docs.map(d=>{const x=d.data();return{id:d.id,memberName:aiText(x.memberName,120),summary:aiText(x.summary,1500),supervisorInformed:x.supervisorInformed===true?true:x.supervisorInformed===false?false:null,fileNames:Array.isArray(x.fileNames)?x.fileNames:[],createdAt:x.createdAt?.toDate?x.createdAt.toDate().toISOString():null};});
    res.json({ok:true,items});
  }catch(e){console.error('AI_ACTIVITIES:',e.message);res.status(500).json({error:'Não consegui carregar o acompanhamento do grupo.'});}
});
// FIM CARBONAUTAS_AI_ASSISTANT_P224

'''
s=s.replace(anchor,routes+anchor,1)
p.write_text(s)
print('Rotas da Mona P224 instaladas no server.js; backup criado.')
PY

# Configure o serviço para ler um arquivo de segredo fora do repositório.
sudo install -d -m 700 /etc/carbonautas-bridge
if [ ! -e /etc/carbonautas-bridge/openai.env ]; then
  sudo install -m 600 /dev/null /etc/carbonautas-bridge/openai.env
fi
sudo install -d -m 755 /etc/systemd/system/carbonautas-bridge.service.d
sudo tee /etc/systemd/system/carbonautas-bridge.service.d/ai.conf >/dev/null <<'UNIT'
[Service]
EnvironmentFile=-/etc/carbonautas-bridge/openai.env
UNIT
sudo chmod 600 /etc/carbonautas-bridge/openai.env
sudo systemctl daemon-reload

# Reiniciar e mostrar apenas o estado do serviço, nunca imprimir o segredo.
sudo systemctl restart carbonautas-bridge
sudo systemctl --no-pager --full status carbonautas-bridge
echo 'Rotas P224 instaladas. Preencha OPENAI_API_KEY em /etc/carbonautas-bridge/openai.env e reinicie o serviço para ativar a IA.'
