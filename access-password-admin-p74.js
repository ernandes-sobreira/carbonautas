/* Carbonautas P74 · restaura criação manual de acesso + reset de senha no painel do coordenador */
(function(){
'use strict';
const VERSION='P74', BUILD='20260917';
let usersCache=[],membersCache=[],refreshing=false;

function F(){return window.fbFns}
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function toastSafe(msg){
  try{if(typeof window.toast==='function'){window.toast(msg);return}}catch(_e){}
  let el=document.getElementById('p74Toast');
  if(!el){el=document.createElement('div');el.id='p74Toast';el.style.cssText='position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147483647;background:#17313d;color:#fff;padding:11px 15px;border-radius:12px;font:700 12px/1.35 system-ui;box-shadow:0 12px 36px rgba(0,0,0,.25);max-width:min(560px,92vw);text-align:center';document.body.appendChild(el)}
  el.textContent=msg;el.style.display='block';clearTimeout(el._t);el._t=setTimeout(()=>el.style.display='none',4800)
}
function css(){
  if(document.getElementById('p74AccessStyle'))return;
  const st=document.createElement('style');st.id='p74AccessStyle';st.textContent=`
  #p74AccessAdmin{border:1px solid #cfe0e7;border-radius:14px;background:#f8fbfc;padding:14px;margin:0 0 16px}
  #p74AccessAdmin h3{margin:0 0 4px;font-size:15px;color:#102c38}#p74AccessAdmin .p74-help{font-size:11.5px;line-height:1.45;color:#617781;margin-bottom:10px}
  #p74AccessAdmin details{border-top:1px solid #dce8ed;padding-top:9px}#p74AccessAdmin summary{cursor:pointer;font-weight:800;font-size:12px;color:#17313d}
  .p74-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.p74-grid .wide{grid-column:1/-1}
  .p74-grid label{display:block;font-size:10.5px;font-weight:800;color:#526a74;margin-bottom:4px}.p74-grid input,.p74-grid select{width:100%;box-sizing:border-box;border:1px solid #c8dbe3;border-radius:10px;padding:9px 10px;background:#fff;color:#132b36}
  .p74-pass{display:flex;gap:6px}.p74-pass input{flex:1}.p74-mini{border:1px solid #c8dbe3;border-radius:10px;background:#fff;padding:0 10px;font-weight:800;cursor:pointer}
  .p74-create{justify-self:start;border:0;border-radius:10px;background:#0d7880;color:#fff;padding:9px 13px;font-weight:900;cursor:pointer}.p74-create:disabled{opacity:.55;cursor:wait}
  #accessList .access-row{gap:7px;flex-wrap:wrap}#accessList .p74-reset{border-color:#a9cfd2;background:#effafa;color:#0b666c;white-space:nowrap}
  @media(max-width:640px){.p74-grid{grid-template-columns:1fr}.p74-grid .wide{grid-column:auto}}
  `;document.head.appendChild(st)
}
async function loadData(){
  const f=F();if(!f||!window.db)return false;
  try{
    const [us,ms]=await Promise.all([f.getDocs(f.collection(window.db,'rede_users')),f.getDocs(f.collection(window.db,'rede_members'))]);
    usersCache=us.docs.map(d=>({...d.data(),uid:d.id}));membersCache=ms.docs.map(d=>({...d.data(),id:d.id}));return true
  }catch(e){console.warn('P74 acesso administrativo',e);return false}
}
function memberName(id){return membersCache.find(m=>m.id===id)?.nome||usersCache.find(u=>u.memberId===id)?.nome||'Carbonauta'}
function injectSection(){
  const modal=document.querySelector('#pinOverlay .modal-b');if(!modal||document.getElementById('p74AccessAdmin'))return;
  css();
  const box=document.createElement('section');box.id='p74AccessAdmin';box.innerHTML=`
    <h3>🔑 Senhas e acessos</h3>
    <div class="p74-help"><b>Conta já existente:</b> use “Enviar reset de senha” ao lado do aluno na lista abaixo. <b>Aluno sem conta:</b> crie o acesso manualmente com e-mail e uma senha inicial.</div>
    <details>
      <summary>+ Criar acesso manualmente para aluno sem conta</summary>
      <div class="p74-grid">
        <div class="wide"><label>Aluno</label><select id="p74Member"><option value="">Carregando…</option></select></div>
        <div><label>E-mail</label><input id="p74Email" type="email" autocomplete="off" placeholder="aluno@email.com"></div>
        <div><label>Senha inicial (mínimo 6 caracteres)</label><div class="p74-pass"><input id="p74Password" type="password" autocomplete="new-password" placeholder="Senha inicial"><button type="button" class="p74-mini" id="p74ShowPass">Mostrar</button></div></div>
        <button type="button" class="p74-create wide" id="p74CreateBtn">Criar conta e vincular</button>
      </div>
    </details>`;
  const note=modal.querySelector('.access-note');if(note)note.insertAdjacentElement('afterend',box);else modal.prepend(box);
  box.querySelector('#p74ShowPass').onclick=()=>{const p=box.querySelector('#p74Password'),b=box.querySelector('#p74ShowPass');p.type=p.type==='password'?'text':'password';b.textContent=p.type==='password'?'Mostrar':'Ocultar'};
  box.querySelector('#p74CreateBtn').onclick=createAccess;
}
function fillUnlinked(){
  const sel=document.getElementById('p74Member');if(!sel)return;
  const linked=new Set(usersCache.map(u=>u.memberId).filter(Boolean));
  const rows=membersCache.filter(m=>m.status!=='inativo'&&!linked.has(m.id)).sort((a,b)=>(a.nome||'').localeCompare(b.nome||'','pt-BR'));
  sel.innerHTML=rows.length?'<option value="">Selecione…</option>'+rows.map(m=>`<option value="${esc(m.id)}">${esc(m.nome||m.id)}</option>`).join(''):'<option value="">Todos os alunos já têm conta vinculada</option>';
}
function augmentResetButtons(){
  const rows=[...document.querySelectorAll('#accessList .access-row')];if(!rows.length)return;
  rows.forEach(row=>{
    if(row.querySelector('.p74-reset'))return;
    const u=usersCache.find(x=>(x.uid&&row.textContent.includes(x.uid))||(x.email&&row.textContent.includes(x.email)));if(!u?.email)return;
    const b=document.createElement('button');b.type='button';b.className='btn p74-reset';b.textContent='🔑 Enviar reset de senha';b.dataset.email=u.email;b.dataset.name=memberName(u.memberId);
    b.onclick=()=>sendReset(u.email,memberName(u.memberId),b);
    const danger=row.querySelector('.btn.danger');if(danger)danger.before(b);else row.appendChild(b)
  })
}
async function sendReset(email,name,btn){
  if(!email)return toastSafe('Esta conta não tem e-mail registrado.');
  if(!confirm(`Enviar e-mail de redefinição de senha para ${name}?\n\n${email}`))return;
  try{btn.disabled=true;await F().sendPasswordResetEmail(window.auth,email);toastSafe(`✓ Link de redefinição enviado para ${email}. Peça para conferir também o spam.`)}
  catch(e){console.error('P74 reset',e);toastSafe(e?.code==='auth/user-not-found'?'Esse e-mail não existe no Firebase Authentication.':(e?.message||'Não foi possível enviar o reset de senha.'))}
  finally{btn.disabled=false}
}
async function createAccess(){
  const f=F(),memberId=document.getElementById('p74Member')?.value||'',email=(document.getElementById('p74Email')?.value||'').trim(),password=document.getElementById('p74Password')?.value||'',btn=document.getElementById('p74CreateBtn');
  if(!memberId)return toastSafe('Selecione o aluno.');if(!email)return toastSafe('Informe o e-mail.');if(password.length<6)return toastSafe('A senha inicial precisa ter pelo menos 6 caracteres.');
  const m=membersCache.find(x=>x.id===memberId);let created=null;
  try{
    btn.disabled=true;btn.textContent='Criando acesso…';
    const cred=await f.createUserWithEmailAndPassword(window.secondaryAuth,email,password);created=cred.user;await f.signOut(window.secondaryAuth);
    await f.setDoc(f.doc(window.db,'rede_users',created.uid),{memberId,nome:m?.nome||'',email,role:'student',createdAt:f.serverTimestamp(),createdBy:window.auth?.currentUser?.uid||''});
    document.getElementById('p74Email').value='';document.getElementById('p74Password').value='';
    toastSafe(`✓ Conta criada e vinculada a ${m?.nome||'Carbonauta'}.`);await refresh(true)
  }catch(e){
    console.error('P74 criar acesso',e);if(created)toastSafe(`A conta foi criada, mas o vínculo falhou. UID: ${created.uid}`);else if(e?.code==='auth/email-already-in-use')toastSafe('Esse e-mail já possui uma conta. Use “Enviar reset de senha” se ela estiver vinculada, ou vincule a conta existente.');else toastSafe(e?.message||'Não foi possível criar a conta.')
  }finally{btn.disabled=false;btn.textContent='Criar conta e vincular'}
}
async function refresh(force=false){
  const ov=document.getElementById('pinOverlay');if(!ov||(!force&&!ov.classList.contains('open'))||refreshing)return;refreshing=true;
  try{injectSection();const ok=await loadData();if(ok){fillUnlinked();setTimeout(augmentResetButtons,100);setTimeout(augmentResetButtons,500)}}finally{refreshing=false}
}
function boot(){injectSection();const ov=document.getElementById('pinOverlay');if(ov)new MutationObserver(()=>refresh()).observe(ov,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});document.addEventListener('click',e=>{if(e.target.closest('#adminBtn,#managePeopleBtn'))setTimeout(()=>refresh(true),180)},true);setInterval(()=>{if(document.getElementById('pinOverlay')?.classList.contains('open'))augmentResetButtons()},1200);console.info('Carbonautas',VERSION,BUILD,'senhas e acessos restaurados')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();