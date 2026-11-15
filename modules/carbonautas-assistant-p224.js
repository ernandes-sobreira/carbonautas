/* Carbonautas · Assistente de acompanhamento P224
   - conversa de entrada, retomada após ausência, anexos para leitura e registro confirmado
   - chave OpenAI somente no backend do VPS; nunca no navegador
   - armazenamento da conversa e registros via API autenticada do Carbonautas
*/
(function(root){
'use strict';
if(root.__CARBONAUTAS_ASSISTANT_P224)return;
root.__CARBONAUTAS_ASSISTANT_P224=true;
const API='https://docs.carbonautas.online/carbonautas-api';
const MAX_FILES=3,MAX_FILE_BYTES=2*1024*1024;
let shell=null,body=null,input=null,fileInput=null,sendBtn=null,history=[],selectedFiles=[],busy=false,coordinator=false,startedUid='',startPromise=null;
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function user(){return root.auth?.currentUser||null}
function name(){return root.CarbonautasApp?.name||user()?.displayName||'Carbonauta'}
async function token(){const u=user();if(!u)throw new Error('Entre no Carbonautas para conversar com a Mona.');return u.getIdToken()}
async function api(path,options={}){
 const idToken=await token();
 const r=await fetch(API+path,{...options,headers:{Authorization:'Bearer '+idToken,'Content-Type':'application/json',...(options.headers||{})}});
 const data=await r.json().catch(()=>({}));
 if(!r.ok)throw new Error(data.error||'Não consegui falar com a Mona agora.');
 return data;
}
function css(){if($('#carbonautasAssistantStyle'))return;const s=document.createElement('style');s.id='carbonautasAssistantStyle';s.textContent=`
#caAI{position:fixed;right:16px;bottom:88px;z-index:240;display:flex;flex-direction:column;align-items:flex-end;font:14px/1.4 system-ui,-apple-system,Segoe UI,sans-serif;color:#18343b}
#caAI .ca-ai-launch{border:0;border-radius:999px;background:#123f47;color:#fff;padding:11px 15px;font-weight:850;box-shadow:0 10px 28px #0d303b33;display:flex;align-items:center;gap:9px;cursor:pointer}
#caAI .ca-ai-launch img{width:32px;height:42px;object-fit:contain}
#caAI .ca-ai-panel{display:none;position:fixed;right:16px;bottom:148px;width:min(440px,calc(100vw - 24px));height:min(650px,calc(100dvh - 178px));background:#f7faf9;border:1px solid #d2e2df;border-radius:20px;box-shadow:0 20px 65px #102c3840;overflow:hidden;grid-template-rows:auto 1fr auto}
#caAI.open .ca-ai-panel{display:grid}
#caAI .ca-ai-head{background:linear-gradient(130deg,#123f47,#206770);color:#fff;padding:13px 15px;display:flex;align-items:center;gap:10px}
#caAI .ca-ai-head img{height:50px;width:40px;object-fit:contain}.ca-ai-title{flex:1;min-width:0}.ca-ai-title b{display:block;font-size:15px}.ca-ai-title small{display:block;color:#c8e9e6;font-size:11px}.ca-ai-close{border:1px solid #ffffff44;background:#ffffff12;color:#fff;border-radius:10px;width:34px;height:34px;font-size:20px}
#caAI .ca-ai-body{overflow:auto;padding:13px;display:flex;flex-direction:column;gap:9px}
#caAI .ca-ai-msg{max-width:88%;padding:10px 12px;border-radius:15px;background:#fff;border:1px solid #dce8e5;white-space:pre-wrap;overflow-wrap:anywhere;box-shadow:0 2px 5px #132f3810}
#caAI .ca-ai-msg.me{align-self:flex-end;background:#e4f4ec;border-color:#cae6d8}.ca-ai-msg small{display:block;color:#68817e;font-size:10px;margin-top:5px}
#caAI .ca-ai-compose{border-top:1px solid #dce8e5;background:#fff;padding:10px;display:grid;grid-template-columns:38px 1fr 44px;gap:7px;align-items:end}
#caAI textarea{resize:none;min-height:43px;max-height:110px;border:1px solid #cbdad7;border-radius:13px;padding:10px;font:14px/1.35 inherit;outline:none}.ca-ai-send,.ca-ai-attach{height:42px;border:0;border-radius:12px;font-weight:850;cursor:pointer}.ca-ai-send{background:#123f47;color:#fff}.ca-ai-attach{background:#edf4f2;color:#1d555b;font-size:18px}.ca-ai-send:disabled{opacity:.45;cursor:wait}
#caAI .ca-ai-files{grid-column:1/-1;display:flex;gap:5px;flex-wrap:wrap}.ca-ai-file{font-size:10px;color:#365d5b;border-radius:999px;background:#eef6f3;padding:4px 8px}
#caAI .ca-ai-actions{align-self:stretch;display:flex;flex-wrap:wrap;gap:6px;margin-top:1px}.ca-ai-actions button{border:1px solid #c8ded4;background:#fff;border-radius:10px;padding:7px 9px;color:#205a49;font-size:11px;font-weight:750;cursor:pointer}
#caAI .ca-ai-status{font-size:11px;color:#627a78;padding:4px 3px}.ca-ai-admin{border:1px solid #cee0dd;background:#fff;border-radius:13px;padding:10px;font-size:12px}.ca-ai-admin b{display:block;margin-bottom:4px}
@media(max-width:620px){#caAI{right:10px;bottom:79px}#caAI .ca-ai-panel{right:8px;bottom:132px;width:calc(100vw - 16px);height:calc(100dvh - 148px);border-radius:17px}.ca-ai-compose{padding:8px}}
@media(prefers-reduced-motion:reduce){#caAI *{scroll-behavior:auto!important}}
`;document.head.appendChild(s)}
function ensure(){if(shell)return shell;css();shell=document.createElement('aside');shell.id='caAI';shell.innerHTML=`<section class="ca-ai-panel" role="dialog" aria-label="Assistente Carbonautas"><header class="ca-ai-head"><img src="./modules/mona-p216.svg?v=P216-20260923" alt=""><div class="ca-ai-title"><b>Mona · Carbonautas</b><small>Acompanhamento e apoio ao seu trabalho</small></div><button class="ca-ai-close" type="button" aria-label="Fechar">×</button></header><div class="ca-ai-body" role="log" aria-live="polite"></div><div class="ca-ai-compose"><button class="ca-ai-attach" type="button" title="Anexar foto, artigo ou planilha">＋</button><textarea rows="1" aria-label="Mensagem" placeholder="O que você fez hoje?"></textarea><button class="ca-ai-send" type="button" aria-label="Enviar">↑</button><input type="file" hidden multiple accept=".pdf,.docx,.pptx,.xlsx,.xls,.csv,.tsv,.txt,.png,.jpg,.jpeg,.webp,.gif"></div></section><button class="ca-ai-launch" type="button"><img src="./modules/mona-p216.svg?v=P216-20260923" alt=""><span>Falar com a Mona</span></button>`;document.body.appendChild(shell);body=$('.ca-ai-body',shell);input=$('textarea',shell);fileInput=$('input[type=file]',shell);sendBtn=$('.ca-ai-send',shell);
 $('.ca-ai-close',shell).addEventListener('click',()=>shell.classList.remove('open'));
 $('.ca-ai-launch',shell).addEventListener('click',()=>{shell.classList.add('open');input?.focus()});
 input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}});
 sendBtn.addEventListener('click',send);
 $('.ca-ai-attach',shell).addEventListener('click',()=>fileInput.click());
 fileInput.addEventListener('change',()=>{selectedFiles=Array.from(fileInput.files||[]).slice(0,MAX_FILES);renderFilePills();fileInput.value=''});
 return shell;
}
function scrollBottom(){if(body)body.scrollTop=body.scrollHeight}
function bubble(text,who='bot',extra=''){ensure();const d=document.createElement('div');d.className='ca-ai-msg'+(who==='me'?' me':'');d.textContent=text;if(extra){const sm=document.createElement('small');sm.textContent=extra;d.appendChild(sm)}body.appendChild(d);scrollBottom();return d}
function status(text){ensure();let el=$('.ca-ai-status',body);if(!text){el?.remove();return}if(!el){el=document.createElement('div');el.className='ca-ai-status';body.appendChild(el)}el.textContent=text;scrollBottom()}
function renderFilePills(){const row=$('.ca-ai-files',shell);if(!row)return;row.replaceChildren();selectedFiles.forEach((f,i)=>{const s=document.createElement('span');s.className='ca-ai-file';s.textContent=`${f.name} · ${Math.ceil(f.size/1024)} KB`;s.title='Toque para remover';s.addEventListener('click',()=>{selectedFiles.splice(i,1);renderFilePills()});row.appendChild(s)})}
function fileData(file){return new Promise((resolve,reject)=>{if(file.size>MAX_FILE_BYTES)return reject(new Error(`${file.name}: limite de 2 MB por arquivo nesta versão.`));const rd=new FileReader();rd.onerror=()=>reject(new Error('Não consegui ler '+file.name));rd.onload=()=>resolve(String(rd.result||''));rd.readAsDataURL(file)})}
function addLogActions(summary,files){const box=document.createElement('div');box.className='ca-ai-actions';const yes=document.createElement('button'),no=document.createElement('button'),skip=document.createElement('button');yes.textContent='Registrar · avisei o orientador';no.textContent='Registrar · ainda não avisei';skip.textContent='Só conversa';const save=async informed=>{box.remove();status('Registrando no acompanhamento…');try{await api('/api/assistant/activity',{method:'POST',body:JSON.stringify({summary,supervisorInformed:informed,fileNames:files.map(f=>f.name)})});status('Atividade registrada para o acompanhamento.');setTimeout(()=>status(''),3500)}catch(e){status(e.message)}};yes.onclick=()=>save(true);no.onclick=()=>save(false);skip.onclick=()=>box.remove();box.append(yes,no,skip);body.appendChild(box);scrollBottom()}
async function send(){if(busy)return;const text=input.value.trim(),files=selectedFiles.slice();if(!text&&!files.length)return;busy=true;sendBtn.disabled=true;input.disabled=true;const names=files.map(f=>f.name);bubble(text||'Pode analisar estes arquivos, por favor.', 'me',names.join(' · '));input.value='';selectedFiles=[];renderFilePills();status('A Mona está lendo e organizando…');try{const payloadFiles=[];for(const f of files)payloadFiles.push({name:f.name,mimeType:f.type||'application/octet-stream',data:await fileData(f)});const recent=history.slice(-12);const result=await api('/api/assistant/chat',{method:'POST',body:JSON.stringify({text,history:recent,files:payloadFiles})});const reply=String(result.reply||'Não consegui preparar uma resposta.');history.push({role:'user',text:text||'Analisou arquivos.',fileNames:names},{role:'assistant',text:reply});bubble(reply);status('');if(text||files.length)addLogActions(text||'Análise de arquivo(s): '+names.join(', '),files);if(coordinator)loadAdmin();}catch(e){status(e.message||'Falha ao conversar com a Mona.');}finally{busy=false;sendBtn.disabled=false;input.disabled=false;input.focus()}}
async function loadAdmin(){if(!coordinator)return;try{const d=await api('/api/assistant/activities');const old=$('.ca-ai-admin',body);old?.remove();if(!d.items?.length)return;const wrap=document.createElement('div');wrap.className='ca-ai-admin';const title=document.createElement('b');title.textContent='Acompanhamento recente do grupo';wrap.appendChild(title);d.items.slice(0,8).forEach(x=>{const line=document.createElement('div');line.textContent=`${x.memberName||'Carbonauta'} · ${x.summary||''} · orientador: ${x.supervisorInformed===true?'avisado':x.supervisorInformed===false?'a avisar':'não informado'}`;wrap.appendChild(line)});body.appendChild(wrap);scrollBottom()}catch(_e){}}
async function start(){const u=user();if(!u)return;ensure();if(startedUid===u.uid)return startPromise;if(startPromise)return startPromise;startedUid=u.uid;startPromise=(async()=>{try{body.replaceChildren();history=[];const s=await api('/api/assistant/session');history=Array.isArray(s.history)?s.history:[];coordinator=!!s.isCoordinator;if(history.length){history.slice(-8).forEach(m=>bubble(m.text,m.role==='user'?'me':'bot',m.fileNames?.join(' · ')||''))}const gap=Number(s.inactiveDays||0);const greeting=gap>=7?`Opa, ${name()}! Faz ${gap} dias que você não entra por aqui. Aconteceu algo? Me conte o que foi feito nesse período.`:`Oi, ${name()}! O que você fez hoje? Pode escrever, mandar foto, planilha ou artigo para eu te ajudar.`;bubble(greeting);shell.classList.add('open');if(coordinator)loadAdmin()}catch(e){startedUid='';bubble('Oi! Eu sou a Mona. Meu canal de acompanhamento ainda está sendo conectado ao servidor. Tente novamente mais tarde.');shell.classList.add('open')}finally{startPromise=null}})();return startPromise}
function boot(){ensure();if(user())setTimeout(()=>start().catch(e=>console.warn('Assistente Carbonautas',e)),900);const mo=new MutationObserver(()=>{if(user()&&!shell.classList.contains('ready')){shell.classList.add('ready');start().catch(()=>{})}else if(!user()){shell.classList.remove('open');startedUid='';startPromise=null;history=[];body?.replaceChildren()}});mo.observe(document.body,{attributes:true,attributeFilter:['class','data-view']});root.addEventListener('firebase-ready',()=>{if(user())start().catch(()=>{})},{passive:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
root.CarbonautasAssistant={open:()=>{ensure();shell.classList.add('open')},close:()=>shell?.classList.remove('open')};
})(window);
