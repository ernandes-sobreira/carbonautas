/* Carbonautas P67 · Painel: ir direto ao documento, correção, link ou conversa da demanda */
(function(){
'use strict';
const VERSION='P67';
const BUILD='20260917';
let baseOpenItem=null;

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function norm(v=''){
  return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
    .replace(/\.(docx?|xlsx?|pptx?|pdf|odt|rtf|csv)$/,'')
    .replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
}
function tokens(v=''){return new Set(norm(v).split(' ').filter(x=>x.length>2))}
function titleScore(a,b){
  const A=norm(a),B=norm(b);if(!A||!B)return 0;if(A===B)return 140;if(A.includes(B)||B.includes(A))return 100;
  const ta=tokens(A),tb=tokens(B);if(!ta.size||!tb.size)return 0;let hit=0;ta.forEach(x=>{if(tb.has(x))hit++});
  const coverage=hit/Math.max(ta.size,tb.size);return Math.round(coverage*90);
}
function activityById(id){try{return (state.activities||[]).find(a=>a.id===id)||null}catch(_e){return null}}
function closeDetail(){document.getElementById('p66ActionOverlay')?.classList.remove('open')}
function toastSafe(msg){try{if(typeof toast==='function')toast(msg);else console.log(msg)}catch(_e){console.log(msg)}}
function ownerMatches(a,p){return !!(p&&(p.memberId===a.ownerId||p.reviewReturnToId===a.ownerId||p.reviewReviewerId===a.ownerId||p.reviewNextRecipientId===a.ownerId))}
function pubTitle(p){return p?.reviewBaseTitle||p?.titulo||p?.fileName||'Arquivo'}
function pubScore(a,p){
  let s=Math.max(titleScore(a.title,p?.titulo),titleScore(a.title,p?.fileName),titleScore(a.title,p?.reviewBaseTitle));
  if(ownerMatches(a,p))s+=35;else s-=20;
  if(p?.tipo==='arquivo')s+=10;
  if(a?.type==='correcao'&&p?.reviewFlow)s+=20;
  if(a?.type!=='correcao'&&p?.reviewFlow)s-=5;
  return s;
}
function explicitPublication(a){
  const id=a?.linkedPublicationId||a?.publicationId||a?.repoPublicationId||a?.sourcePublicationId||a?.relatedPublicationId||(a?.sourceType==='publication'?a?.sourceId:'');
  if(!id)return null;try{return (state.publicacoes||[]).find(p=>p.id===id)||null}catch(_e){return null}
}
function bestPublication(a){
  const explicit=explicitPublication(a);if(explicit)return {score:999,p:explicit};
  try{
    let best=null;(state.publicacoes||[]).forEach(p=>{const score=pubScore(a,p);if(!best||score>best.score)best={score,p}});
    return best&&best.score>=95?best:null;
  }catch(_e){return null}
}
function targetFromPublication(a,p){
  if(!p)return null;
  if(p.labRun&&typeof window.openLabRun==='function')return {kind:'lab',label:'📈 Abrir resultados',title:pubTitle(p),where:'Resultados do Lab',open:()=>window.openLabRun(p.labRunId)};
  if(a?.type==='correcao'&&p.reviewFlow&&typeof window.openReviewResponse==='function'){
    try{if(typeof canActOnReview==='function'&&canActOnReview(p))return {kind:'correction',label:'✍️ Abrir correção',title:pubTitle(p),where:'Correção no Repositório',open:()=>window.openReviewResponse(p.id)}}catch(_e){}
  }
  if(p.tipo==='arquivo'&&p.url&&typeof window.openFilePreview==='function')return {kind:'file',label:'📄 Abrir documento',title:p.fileName||p.titulo||'Arquivo',where:p.reviewFlow?'Documento da correção':'Documento no Repositório',open:()=>window.openFilePreview(p.url,p.fileName||p.titulo||'Arquivo',{source:'publication',id:p.id})};
  if(p.url)return {kind:'link',label:'🔗 Abrir link',title:p.titulo||p.url,where:'Link no Repositório',open:()=>window.open(p.url,'_blank','noopener')};
  return null;
}
async function packageFileTarget(a){
  const explicitPkg=a?.linkedPackageId||a?.packageId||a?.sourcePackageId||'',explicitFile=a?.linkedPackageFileId||a?.packageFileId||a?.sourcePackageFileId||'';
  const F=window.fbFns;if(!F||!window.db)return null;
  let packages=[];try{packages=[...(state.repositoryPackages||[])]}catch(_e){}
  if(explicitPkg)packages.sort((x,y)=>x.id===explicitPkg?-1:y.id===explicitPkg?1:0);
  else packages=packages.filter(p=>p.ownerMemberId===a.ownerId||p.createdByMemberId===a.ownerId);
  let best=null;
  for(const pkg of packages.slice(0,12)){
    try{
      const snap=await F.getDocs(F.collection(F.doc(window.db,'rede_repository_packages',pkg.id),'files'));
      for(const d of snap.docs){
        const x={...d.data(),id:d.id};
        if(explicitPkg&&explicitFile&&pkg.id===explicitPkg&&x.id===explicitFile){best={score:999,pkg,x};break}
        const score=Math.max(titleScore(a.title,x.title),titleScore(a.title,x.fileName))+(pkg.ownerMemberId===a.ownerId?35:0)+10;
        if(!best||score>best.score)best={score,pkg,x};
      }
      if(best?.score===999)break;
    }catch(_e){/* pasta privada não compartilhada: respeita a ACL e segue */}
  }
  if(!best||best.score<95||!best.x?.url)return null;
  return {kind:'package-file',label:'📄 Abrir documento',title:best.x.fileName||best.x.title||'Arquivo',where:`Documento em “${best.pkg.title||'Meu Repositório'}”`,open:()=>window.openFilePreview(best.x.url,best.x.fileName||best.x.title||'Arquivo',{source:'package',packageId:best.pkg.id,fileId:best.x.id})};
}
async function resolveTarget(a){
  if(!a)return null;
  if(a.relatedUrl||a.externalUrl){const u=a.relatedUrl||a.externalUrl;return {kind:'link',label:'🔗 Abrir o que foi solicitado',title:a.title||u,where:'Link associado ao acompanhamento',open:()=>window.open(u,'_blank','noopener')}}
  const bp=bestPublication(a);if(bp){const t=targetFromPublication(a,bp.p);if(t)return t}
  return await packageFileTarget(a);
}
function ensureCss(){
  if(document.getElementById('p67Style'))return;const s=document.createElement('style');s.id='p67Style';s.textContent=`
  .p67-linked{margin-top:13px;border:1px solid #cfe3e6;border-radius:14px;padding:11px 13px;background:#f3fbfb;display:flex;align-items:center;gap:10px}.p67-linked-ico{width:34px;height:34px;border-radius:10px;background:#dff2f3;display:grid;place-items:center;font-size:17px}.p67-linked-main{min-width:0;flex:1}.p67-linked-main b{display:block;color:#15313b;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.p67-linked-main span{display:block;color:#678089;font-size:10px;margin-top:2px}.p67-searching{color:#71858d;font-size:11px}.p67-target{background:#0e5c63!important;border-color:#0e5c63!important;color:#fff!important;font-weight:850!important}.p67-chat-secondary{background:#fff!important;color:#17313d!important;border-color:#cbdade!important}.p66-edit{font-size:11px!important;color:#5f737b!important}.p66-edit::first-letter{font-size:12px}
  @media(max-width:650px){.p67-target{grid-column:1/-1}.p67-linked{align-items:flex-start}.p67-linked-main b{white-space:normal}.p66-edit{grid-column:auto}}
  `;document.head.appendChild(s);
}
function addLinkedCard(target){
  const body=document.getElementById('p66Body');if(!body)return;body.querySelector('.p67-linked')?.remove();
  const progress=body.querySelector('.p66-progress');const el=document.createElement('div');el.className='p67-linked';el.innerHTML=`<div class="p67-linked-ico">${target.kind==='link'?'🔗':target.kind==='lab'?'📈':target.kind==='correction'?'✍️':'📄'}</div><div class="p67-linked-main"><b>${esc(target.title)}</b><span>${esc(target.where)}</span></div>`;if(progress)body.insertBefore(el,progress);else body.appendChild(el);
}
function addSearching(){const body=document.getElementById('p66Body');if(!body||body.querySelector('.p67-searching'))return;const progress=body.querySelector('.p66-progress'),el=document.createElement('div');el.className='p67-searching';el.textContent='🔎 Procurando o documento ou item relacionado…';if(progress)body.insertBefore(el,progress);else body.appendChild(el)}
function removeSearching(){document.querySelector('#p66Body .p67-searching')?.remove()}
function tuneExistingButtons(){
  const edit=document.querySelector('#p66Foot .p66-edit');if(edit){edit.textContent='⚙️ Ajustar registro';edit.title='Alterar apenas o cadastro deste acompanhamento'}
}
function insertTargetButton(target){
  const foot=document.getElementById('p66Foot');if(!foot)return;foot.querySelector('.p67-target')?.remove();
  const b=document.createElement('button');b.type='button';b.className='btn p67-target';b.textContent=target.label;b.onclick=()=>{closeDetail();try{target.open()}catch(e){console.error('P67 abrir destino',e);toastSafe('Não consegui abrir o item relacionado.')}};
  const complete=foot.querySelector('.p66-complete'),chat=[...foot.querySelectorAll('button')].find(x=>x.textContent.includes('Conversar'));
  if(complete)foot.insertBefore(b,complete);else if(chat)foot.insertBefore(b,chat);else foot.insertBefore(b,foot.lastElementChild||null);
  if(chat){chat.classList.remove('p66-primary');chat.classList.add('p67-chat-secondary')}
}
async function enrichActivityDetail(id){
  const a=activityById(id);if(!a)return;tuneExistingButtons();ensureCss();addSearching();
  const target=await resolveTarget(a);removeSearching();
  if(!document.getElementById('p66ActionOverlay')?.classList.contains('open'))return;
  if(target){addLinkedCard(target);insertTargetButton(target);return}
  const body=document.getElementById('p66Body');if(body&&!body.querySelector('.p67-linked')){const el=document.createElement('div');el.className='p67-linked';el.innerHTML='<div class="p67-linked-ico">💬</div><div class="p67-linked-main"><b>Nenhum documento vinculado automaticamente</b><span>Use a conversa para tratar a demanda ou “Ajustar registro” para corrigir o cadastro.</span></div>';const progress=body.querySelector('.p66-progress');if(progress)body.insertBefore(el,progress);else body.appendChild(el)}
}
function openActivity(id){
  if(typeof window.p66OpenActivityDetail!=='function')return toastSafe('O detalhe do Painel ainda não terminou de carregar.');
  window.p66OpenActivityDetail(id);setTimeout(()=>enrichActivityDetail(id),0);
}
function p67OpenItem(key){const k=String(key||'');if(k.startsWith('activity:')){openActivity(k.slice(9));return}if(typeof baseOpenItem==='function')return baseOpenItem(key)}
function install(){
  ensureCss();if(!baseOpenItem&&typeof window.p56OpenItem==='function'&&window.p56OpenItem!==p67OpenItem)baseOpenItem=window.p56OpenItem;
  window.p67OpenActivity=openActivity;window.p56OpenItem=p67OpenItem;
}
function boot(){install();setTimeout(install,1200);setTimeout(install,2400);console.info('Carbonautas',VERSION,BUILD,'ações do Painel ligadas ao destino real')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
