/* Carbonautas P128 · lembretes de prazo por e-mail, sem custo.
   Roda no VPS uma vez por dia (cron). Lê o Firestore com a conta de serviço
   e envia pelo Gmail (senha de app). Nada é gravado no Firestore.

   INSTALAR (uma vez, no VPS):
     mkdir -p /opt/carbonautas-lembretes && cd /opt/carbonautas-lembretes
     npm init -y && npm i firebase-admin nodemailer
     # baixar a chave da conta de serviço no Console do Firebase:
     # Configurações do projeto > Contas de serviço > Gerar nova chave privada
     # salvar como /opt/carbonautas-lembretes/serviceAccount.json (chmod 600)
     # criar /opt/carbonautas-lembretes/.env com:
     #   GMAIL_USER=seuemail@gmail.com
     #   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx   (senha de app, não a senha normal)
     #   COORD_EMAIL=ernandes.sobreira@gmail.com
     #   APP_URL=https://ernandes-sobreira.github.io/carbonautas/
     # testar:  node P128_lembretes_email.js --teste   (só imprime, não envia)
     # agendar (todo dia 7h):  crontab -e
     #   0 7 * * * cd /opt/carbonautas-lembretes && /usr/bin/node P128_lembretes_email.js >> lembretes.log 2>&1
*/
'use strict';
const fs=require('fs');
const path=require('path');
const admin=require('firebase-admin');
const nodemailer=require('nodemailer');

const DIR=__dirname;
const env={};
try{fs.readFileSync(path.join(DIR,'.env'),'utf8').split('\n').forEach(l=>{const m=l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);if(m)env[m[1]]=m[2]})}catch(_e){}
const GMAIL_USER=env.GMAIL_USER||process.env.GMAIL_USER;
const GMAIL_PASS=(env.GMAIL_APP_PASSWORD||process.env.GMAIL_APP_PASSWORD||'').replace(/\s+/g,'');
const COORD=env.COORD_EMAIL||process.env.COORD_EMAIL||'';
const APP_URL=env.APP_URL||'https://ernandes-sobreira.github.io/carbonautas/';
const TESTE=process.argv.includes('--teste');
const DIAS_AVISO=3;

if(!GMAIL_USER||!GMAIL_PASS){console.error('Faltam GMAIL_USER e GMAIL_APP_PASSWORD no .env');process.exit(1)}
admin.initializeApp({credential:admin.credential.cert(require(path.join(DIR,'serviceAccount.json')))});
const db=admin.firestore();

function hoje(){const d=new Date();return new Date(d.getFullYear(),d.getMonth(),d.getDate())}
function diasAte(iso){if(!/^\d{4}-\d{2}-\d{2}$/.test(String(iso||'')))return null;const [y,m,d]=iso.split('-').map(Number);return Math.round((new Date(y,m-1,d)-hoje())/86400000)}
function br(iso){const [y,m,d]=String(iso).split('-');return `${d}/${m}/${y}`}
function rotulo(n){if(n<0)return `atrasado ${-n} dia${-n===1?'':'s'}`;if(n===0)return 'vence hoje';return `vence em ${n} dia${n===1?'':'s'}`}

async function coletar(){
  const [membros,usuarios,atividades]=await Promise.all([
    db.collection('rede_members').get(),
    db.collection('rede_users').get(),
    db.collection('rede_activities').get()
  ]);
  const emailPorMembro={};
  usuarios.forEach(u=>{const d=u.data();if(d.memberId&&d.email)emailPorMembro[d.memberId]=d.email});
  const nomePorMembro={};
  const itens=[]; // {memberId, nome, texto, dias}
  membros.forEach(m=>{
    const d=m.data();nomePorMembro[m.id]=d.nome||m.id;
    if(d.status==='egresso')return;
    (d.prazos||[]).forEach(p=>{
      if(p.feito)return;const n=diasAte(p.data);if(n===null)return;
      if(n<=DIAS_AVISO)itens.push({memberId:m.id,nome:d.nome||m.id,texto:p.titulo||'Prazo',data:p.data,dias:n});
    });
  });
  atividades.forEach(a=>{
    const d=a.data();
    if(d.status==='concluido'||d.doneAt||!d.ownerId)return;
    const n=diasAte(d.dueDate);if(n===null)return;
    if(n<=DIAS_AVISO)itens.push({memberId:d.ownerId,nome:nomePorMembro[d.ownerId]||d.ownerId,texto:d.title||'Tarefa',data:d.dueDate,dias:n});
  });
  itens.sort((a,b)=>a.dias-b.dias);
  return {itens,emailPorMembro};
}

function corpo(nome,lista){
  const linhas=lista.map(i=>`- ${i.texto} (${br(i.data)}, ${rotulo(i.dias)})`).join('\n');
  return `Olá, ${String(nome).split(' ')[0]}.\n\nSeus prazos no Carbonautas:\n\n${linhas}\n\nAbrir: ${APP_URL}\n\nEste aviso é automático. Responda se precisar conversar.`;
}

async function main(){
  const {itens,emailPorMembro}=await coletar();
  if(!itens.length){console.log(new Date().toISOString(),'nada a avisar');return}
  const porPessoa={};
  itens.forEach(i=>{(porPessoa[i.memberId]=porPessoa[i.memberId]||[]).push(i)});
  const transporte=nodemailer.createTransport({service:'gmail',auth:{user:GMAIL_USER,pass:GMAIL_PASS}});
  const enviados=[];
  for(const [memberId,lista] of Object.entries(porPessoa)){
    const para=emailPorMembro[memberId];
    if(!para){console.log('sem e-mail cadastrado:',lista[0].nome);continue}
    const msg={from:`Carbonautas <${GMAIL_USER}>`,to:para,subject:`Carbonautas · ${lista.length} prazo${lista.length===1?'':'s'} para você`,text:corpo(lista[0].nome,lista)};
    if(TESTE){console.log('--- TESTE, não enviado ---\n',msg.to,'\n',msg.subject,'\n',msg.text,'\n');continue}
    try{await transporte.sendMail(msg);enviados.push(para)}catch(e){console.error('falha ao enviar para',para,e.message)}
  }
  if(COORD){
    const resumo=itens.map(i=>`- ${i.nome}: ${i.texto} (${br(i.data)}, ${rotulo(i.dias)})`).join('\n');
    const msg={from:`Carbonautas <${GMAIL_USER}>`,to:COORD,subject:`Carbonautas · resumo de prazos (${itens.length})`,text:`Prazos vencidos ou nos próximos ${DIAS_AVISO} dias:\n\n${resumo}\n\nAbrir: ${APP_URL}`};
    if(TESTE)console.log('--- TESTE resumo coordenação ---\n',msg.text);
    else{try{await transporte.sendMail(msg)}catch(e){console.error('falha no resumo',e.message)}}
  }
  console.log(new Date().toISOString(),'itens:',itens.length,'e-mails enviados:',enviados.length);
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});
