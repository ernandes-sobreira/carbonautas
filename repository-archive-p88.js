/* Carbonautas P88 · Arquivo Vivo do Repositório */
(function(){
'use strict';
const BUILD='P88';
let mode=localStorage.getItem('carbonautas_repo_archive_mode')||'az';
let selectedFolder='';
let selectedLetter='*';
let query='';
let lastSig='';
let openCtx=null;

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
function norm(v=''){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim()}
function esc(v=''){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function appState(){try{return state}catch(_e){return null}}
function ms(v){try{if(!v)return 0;if(typeof v.toMillis==='function')return v.toMillis();if(typeof v.seconds==='number')return v.seconds*1000;const n=+new Date(v);return Number.isFinite(n)?n:0}catch(_e){return 0}}
function ptMonth(d){return d.toLocaleDateString('pt-BR',{month:'long',year:'numeric'}).replace(/^./,c=>c.toUpperCase())}
function sameDay(a,b){return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate()}
function memberName(id){const s=appState();return s?.members?.find?.(m=>m.id===id)?.nome||''}
function latestPublication(title,person){const s=appState();if(!s?.publicacoes)return null;const nt=norm(title),np=norm(person);return [...s.publicacoes].filter(p=>norm(p.titulo||p.fileName||p.reviewBaseTitle||'')===nt&&(!np||norm(p.memberNome||memberName(p.memberId))===np)).sort((a,b)=>ms(b.ts||b.updatedAt||b.editedAt)-ms(a.ts||a.updatedAt||a.editedAt))[0]||null}
function latestPackage(title,person){const s=appState();if(!s?.repositoryPackages)return null;const nt=norm(title),np=norm(person);return [...s.repositoryPackages].filter(p=>norm(p.title||'')===nt&&(!np||norm(p.ownerName||memberName(p.ownerMemberId))===np)).sort((a,b)=>ms(b.ts||b.updatedAt)-ms(a.ts||a.updatedAt))[0]||null}
function iconFor(title='',category='',type='pub'){
  if(type==='package')return '📦';
  const t=norm(title+' '+category);
  if(/\.pdf\b|pdf/.test(t))return '📕';
  if(/\.xlsx?\b|planilha|excel|csv/.test(t))return '📊';
  if(/\.pptx?\b|powerpoint|apresenta/.test(t))return '📽️';
  if(/\.(png|jpe?g|webp|gif)\b|foto|imagem/.test(t))return '🖼️';
  if(/\.docx?\b|word|artigo|resumo|tese|projeto/.test(t))return '📄';
  return '📎';
}
function pendingFor(card){
  const t=norm(card?.innerText||'');
  if(card?.querySelector('.review-action')||/sua acao|agora com|corrigir agora|devolver correcao/.test(t))return {key:'acao',label:'Sua ação',cls:'hot'};
  if(/correcao|corrigir|revisao|revisar/.test(t))return {key:'correcao',label:'Correções',cls:'review'};
  if(/aguardando|proxima acao|prazo|pendente/.test(t))return {key:'aguardando',label:'Aguardando',cls:'wait'};
  return {key:'ok',label:'Sem pendência',cls:'ok'};
}
function itemFromPub(card,i){
  const title=$('.pub-t',card)?.textContent?.trim()||`Arquivo ${i+1}`;
  const person=$('.pub-author',card)?.textContent?.trim()||'Sem responsável';
  const category=$('.pub-cat-tag',card)?.textContent?.trim()||'Publicação';
  const raw=latestPublication(title,person);const stamp=ms(raw?.ts||raw?.updatedAt||raw?.editedAt);
  const pending=pendingFor(card);
  return {id:'pub:'+(raw?.id||i+':'+norm(title)),type:'pub',card,title,person,category,stamp,dateText:$('.pub-date',card)?.textContent?.trim()||'',pending,icon:iconFor(title,category,'pub')};
}
function itemFromPackage(card,i){
  const title=$('.repo-package-title',card)?.textContent?.trim()||`Pasta ${i+1}`;
  const meta=$('.repo-package-meta',card)?.textContent?.replace(/\s+/g,' ')?.trim()||'';
  const s=appState();let raw=null;
  if(s?.repositoryPackages){raw=[...s.repositoryPackages].filter(p=>norm(p.title||'')===norm(title)).sort((a,b)=>ms(b.ts||b.updatedAt)-ms(a.ts||a.updatedAt))[0]||null}
  const person=raw?.ownerName||memberName(raw?.ownerMemberId)||meta.split('·')[1]?.trim()||'Sem responsável';
  const category=meta.split('·')[0]?.trim()||'Pasta';
  const stamp=ms(raw?.ts||raw?.updatedAt);const pending=pendingFor(card);
  return {id:'package:'+(raw?.id||i+':'+norm(title)),type:'package',card,title,person,category,stamp,dateText:'',pending,icon:'📦'};
}
function collectItems(){
  const pubs=$$('#pubList > .pub-row').map(itemFromPub);
  const packages=$$('#repoPackageList > .repo-package-card').map(itemFromPackage);
  return [...packages,...pubs];
}
function dateFolder(stamp){
  if(!stamp)return {key:'date:none',label:'Sem data',sort:0,sub:'Itens sem data registrada'};
  const d=new Date(stamp),now=new Date();
  if(sameDay(d,now))return {key:'date:today',label:'Hoje',sort:9999999999999,sub:'Atualizados hoje'};
  const diff=(now-d)/86400000;
  if(diff>=0&&diff<7)return {key:'date:week',label:'Últimos 7 dias',sort:9999999999000,sub:'Movimentação recente'};
  const mk=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  return {key:'date:'+mk,label:ptMonth(d),sort:new Date(d.getFullYear(),d.getMonth(),1).getTime(),sub:'Arquivos deste período'};
}
function groupsFor(items){
  const map=new Map();
  items.forEach(item=>{
    let g;
    if(mode==='az')g={key:'person:'+norm(item.person),label:item.person,sort:norm(item.person),sub:'Arquivo pessoal',letter:(item.person.trim()[0]||'#').toUpperCase()};
    else if(mode==='date')g=dateFolder(item.stamp);
    else g={key:'pending:'+item.pending.key,label:item.pending.label,sort:item.pending.key==='acao'?4:item.pending.key==='correcao'?3:item.pending.key==='aguardando'?2:1,sub:item.pending.key==='ok'?'Itens sem ação pendente':'Itens que merecem atenção'};
    if(!map.has(g.key))map.set(g.key,{...g,items:[]});map.get(g.key).items.push(item);
  });
  let groups=[...map.values()];
  if(mode==='az')groups.sort((a,b)=>String(a.sort).localeCompare(String(b.sort),'pt-BR'));
  else groups.sort((a,b)=>Number(b.sort)-Number(a.sort));
  return groups;
}
function visibleItems(){
  const nq=norm(query);let items=collectItems();
  if(nq)items=items.filter(x=>norm([x.title,x.person,x.category,x.pending.label].join(' ')).includes(nq));
  return items;
}
function currentGroup(){return groupsFor(visibleItems()).find(g=>g.key===selectedFolder)||null}
function sig(items){return JSON.stringify([mode,selectedFolder,selectedLetter,query,$('#pubCategoria')?.value||'',$('#pubPessoa')?.value||'',$('#pubMine')?.checked||false,items.map(x=>[x.id,x.title,x.person,x.category,x.stamp,x.pending.key])])}
function folderCard(g){
  const pending=g.items.filter(x=>x.pending.key!=='ok').length;
  const last=Math.max(0,...g.items.map(x=>x.stamp||0));
  const lastLabel=last?new Date(last).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'}):'—';
  return `<button type="button" class="p88-folder" data-p88-folder="${esc(g.key)}">
    <span class="p88-folder-tab"></span><span class="p88-folder-icon">📁</span>
    <span class="p88-folder-main"><b>${esc(g.label)}</b><small>${esc(g.sub||'')} · ${g.items.length} item${g.items.length===1?'':'s'}</small></span>
    <span class="p88-folder-meta">${pending?`<em>${pending} pend.</em>`:'<em class="ok">em ordem</em>'}<small>${esc(lastLabel)}</small></span>
  </button>`;
}
function itemCard(item){
  const d=item.stamp?new Date(item.stamp).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'}):(item.dateText||'Sem data');
  return `<button type="button" class="p88-file" data-p88-item="${esc(item.id)}">
    <span class="p88-file-icon">${item.icon}</span>
    <span class="p88-file-main"><b>${esc(item.title)}</b><small>${esc(item.category)} · ${esc(item.person)} · ${esc(d)}</small></span>
    <span class="p88-status ${esc(item.pending.cls)}">${esc(item.pending.label)}</span><span class="p88-open">Abrir ›</span>
  </button>`;
}
function alphaHtml(groups){
  if(mode!=='az'||selectedFolder)return '';
  const letters=[...new Set(groups.map(g=>g.letter).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
  return `<div class="p88-alpha"><button data-p88-letter="*" class="${selectedLetter==='*'?'on':''}">Todos</button>${letters.map(l=>`<button data-p88-letter="${esc(l)}" class="${selectedLetter===l?'on':''}">${esc(l)}</button>`).join('')}</div>`;
}
function render(force=false){
  const root=$('#p88Archive');if(!root)return;
  const items=visibleItems();const signature=sig(items);if(!force&&signature===lastSig)return;lastSig=signature;
  const groups=groupsFor(items);const group=currentGroup();
  const alpha=$('#p88Alpha',root),body=$('#p88Body',root),crumb=$('#p88Crumb',root);
  alpha.innerHTML=alphaHtml(groups);
  $$('.p88-mode',root).forEach(b=>b.classList.toggle('on',b.dataset.p88Mode===mode));
  if(group){
    crumb.innerHTML=`<button type="button" data-p88-back>← Voltar às pastas</button><div><b>${esc(group.label)}</b><small>${group.items.length} item${group.items.length===1?'':'s'}</small></div>`;
    body.className='p88-files';body.innerHTML=group.items.sort((a,b)=>(b.stamp||0)-(a.stamp||0)).map(itemCard).join('')||'<div class="p88-empty">Nada nesta pasta.</div>';
  }else{
    crumb.innerHTML='<div><b>Folhear o arquivo</b><small>Escolha uma pasta para abrir</small></div>';
    let show=groups;if(mode==='az'&&selectedLetter!=='*')show=groups.filter(g=>g.letter===selectedLetter);
    body.className='p88-folders';body.innerHTML=show.map(folderCard).join('')||'<div class="p88-empty">Nenhum item encontrado com esses filtros.</div>';
  }
}
function buildUI(){
  const panel=$('#repoGeneralPanel');if(!panel||$('#p88Archive'))return;
  panel.classList.add('p88-active');
  const filters=$('.crono-filters',panel);
  const root=document.createElement('section');root.id='p88Archive';root.innerHTML=`
    <div class="p88-head"><div><span class="p88-kicker">🗂 ARQUIVO VIVO</span><h3>Folheie o Repositório</h3><p>A mesma produção da Rede, organizada para encontrar rápido.</p></div><label class="p88-search">⌕<input id="p88Search" type="search" placeholder="Pesquisar nome, arquivo ou categoria…" autocomplete="off"></label></div>
    <div class="p88-modes"><button class="p88-mode" data-p88-mode="az">A–Z · Pessoas</button><button class="p88-mode" data-p88-mode="date">Data</button><button class="p88-mode" data-p88-mode="pending">Pendências</button></div>
    <div id="p88Alpha"></div><div class="p88-crumb" id="p88Crumb"></div><div id="p88Body"></div>`;
  if(filters)filters.insertAdjacentElement('afterend',root);else panel.prepend(root);
  root.addEventListener('click',e=>{
    const m=e.target.closest('[data-p88-mode]');if(m){mode=m.dataset.p88Mode;localStorage.setItem('carbonautas_repo_archive_mode',mode);selectedFolder='';selectedLetter='*';lastSig='';render(true);return}
    const l=e.target.closest('[data-p88-letter]');if(l){selectedLetter=l.dataset.p88Letter;lastSig='';render(true);return}
    if(e.target.closest('[data-p88-back]')){selectedFolder='';lastSig='';render(true);return}
    const f=e.target.closest('[data-p88-folder]');if(f){selectedFolder=f.dataset.p88Folder;lastSig='';render(true);requestAnimationFrame(()=>root.scrollIntoView({block:'start',behavior:'smooth'}));return}
    const b=e.target.closest('[data-p88-item]');if(b){const item=visibleItems().find(x=>x.id===b.dataset.p88Item);if(item)openFloat(item)}
  });
  $('#p88Search',root).addEventListener('input',e=>{query=e.target.value||'';selectedFolder='';lastSig='';render(true)});
  ['pubCategoria','pubPessoa','pubMine'].forEach(id=>$('#'+id)?.addEventListener('change',()=>setTimeout(()=>{selectedFolder='';lastSig='';render(true)},80)));
  ensureOverlay();render(true);
}
function ensureOverlay(){
  if($('#p88Float'))return;
  const ov=document.createElement('div');ov.id='p88Float';ov.hidden=true;ov.innerHTML=`<div class="p88-float-backdrop" data-p88-close></div><section class="p88-float-card"><header><button type="button" data-p88-close>← Voltar</button><div><span>ARQUIVO DO REPOSITÓRIO</span><b id="p88FloatTitle">Documento</b></div><button type="button" class="p88-x" data-p88-close>×</button></header><div id="p88FloatStage"></div></section>`;
  document.body.appendChild(ov);ov.addEventListener('click',e=>{if(e.target.closest('[data-p88-close]'))closeFloat()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!ov.hidden)closeFloat()});
}
function openFloat(item){
  ensureOverlay();if(openCtx)closeFloat();
  const card=item.card;if(!card?.isConnected)return;
  const placeholder=document.createComment('p88-return');const parent=card.parentNode;parent.insertBefore(placeholder,card);
  openCtx={card,parent,placeholder,item};
  $('#p88FloatTitle').textContent=item.title;$('#p88FloatStage').appendChild(card);card.classList.add('p88-live-card');
  $('#p88Float').hidden=false;document.documentElement.classList.add('p88-modal-open');
}
function closeFloat(){
  const ov=$('#p88Float');if(!ov||ov.hidden)return;
  if(openCtx){const {card,parent,placeholder}=openCtx;card.classList.remove('p88-live-card');if(placeholder?.parentNode)placeholder.replaceWith(card);else if(parent?.isConnected)parent.appendChild(card);openCtx=null}
  ov.hidden=true;document.documentElement.classList.remove('p88-modal-open');lastSig='';setTimeout(()=>render(true),30);
}
function injectCss(){if($('#p88Style'))return;const st=document.createElement('style');st.id='p88Style';st.textContent=`
#repoGeneralPanel.p88-active>#pubList,#repoGeneralPanel.p88-active>#repoPackageList{display:none!important}
#p88Archive{margin:14px 0 24px;border:1px solid #cfe0e5;border-radius:24px;background:linear-gradient(180deg,#fbfeff,#f3f8f9);box-shadow:0 18px 50px rgba(12,39,51,.08);overflow:hidden}
.p88-head{display:flex;gap:18px;align-items:center;justify-content:space-between;padding:20px 22px 16px;background:linear-gradient(135deg,#faffff,#f2f7ff)}.p88-head h3{font-family:'Fraunces',serif;font-size:25px;margin:3px 0 2px}.p88-head p{margin:0;color:#6b7f87;font-size:12px}.p88-kicker{font-size:10px;font-weight:900;letter-spacing:.12em;color:#0e7681}.p88-search{width:min(420px,45%);display:flex;align-items:center;gap:9px;border:1px solid #bed3d9;border-radius:14px;background:#fff;padding:10px 13px;font-size:20px;color:#6a8189}.p88-search input{width:100%;border:0!important;box-shadow:none!important;outline:0;background:transparent;font-size:13px;color:#18343e}
.p88-modes{display:flex;gap:8px;padding:12px 22px 0}.p88-mode{border:1px solid #ccdadf;background:#fff;color:#35515c;border-radius:999px;padding:9px 14px;font-weight:850;font-size:12px}.p88-mode.on{background:#0b7883;border-color:#0b7883;color:#fff;box-shadow:0 5px 18px rgba(11,120,131,.18)}
.p88-alpha{display:flex;gap:5px;overflow-x:auto;padding:11px 22px 2px}.p88-alpha button{min-width:34px;height:32px;border:1px solid #d3e0e4;background:#fff;border-radius:10px;font-weight:800;color:#50666e}.p88-alpha button.on{background:#172f3a;color:#fff;border-color:#172f3a}.p88-crumb{display:flex;align-items:center;gap:13px;padding:14px 22px 9px}.p88-crumb button{border:0;background:#e9f3f4;color:#0d6972;border-radius:11px;padding:9px 12px;font-weight:850}.p88-crumb b{display:block;font-size:14px}.p88-crumb small{color:#7a8c92;font-size:10.5px}
.p88-folders{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px;padding:9px 22px 22px}.p88-folder{position:relative;min-height:118px;text-align:left;border:1px solid #d0dde1;border-radius:18px;background:linear-gradient(145deg,#fff,#f6fafb);padding:20px 14px 14px;display:grid;grid-template-columns:42px minmax(0,1fr) auto;gap:11px;align-items:center;box-shadow:0 8px 24px rgba(20,48,60,.05);transition:.16s;overflow:visible}.p88-folder:hover{transform:translateY(-3px);border-color:#94c2c8;box-shadow:0 16px 34px rgba(20,48,60,.10)}.p88-folder-tab{position:absolute;top:-10px;left:18px;width:88px;height:18px;border:1px solid #d0dde1;border-bottom:0;border-radius:12px 12px 0 0;background:#f1f7f8}.p88-folder-icon{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;background:#eff6df;font-size:24px}.p88-folder-main{min-width:0}.p88-folder-main b{display:block;color:#17333e;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.p88-folder-main small{display:block;color:#74868c;font-size:10.5px;margin-top:5px;line-height:1.35}.p88-folder-meta{text-align:right;align-self:center}.p88-folder-meta em{display:block;font-style:normal;font-size:9.5px;font-weight:900;color:#9b5c00;background:#fff1d8;border-radius:999px;padding:4px 7px}.p88-folder-meta em.ok{color:#17734b;background:#e9f8ef}.p88-folder-meta small{display:block;font-size:9.5px;color:#93a0a4;margin-top:7px}
.p88-files{display:grid;gap:9px;padding:9px 22px 22px}.p88-file{display:grid;grid-template-columns:44px minmax(0,1fr) auto auto;gap:12px;align-items:center;text-align:left;border:1px solid #d5e1e5;background:#fff;border-radius:15px;padding:12px 14px;transition:.14s}.p88-file:hover{border-color:#8fbfc5;box-shadow:0 9px 24px rgba(18,54,67,.08);transform:translateX(3px)}.p88-file-icon{width:42px;height:42px;border-radius:12px;background:#eff5f7;display:grid;place-items:center;font-size:22px}.p88-file-main{min-width:0}.p88-file-main b{display:block;font-size:13px;color:#18343e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.p88-file-main small{display:block;color:#74868d;font-size:10px;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.p88-status{font-size:9px;font-weight:900;border-radius:999px;padding:5px 8px;white-space:nowrap;background:#edf3f5;color:#5d737b}.p88-status.hot{background:#ffe4e7;color:#a82d42}.p88-status.review{background:#eee9ff;color:#5a48a4}.p88-status.wait{background:#fff1d5;color:#875900}.p88-status.ok{background:#e7f7ed;color:#1b7049}.p88-open{font-size:11px;font-weight:850;color:#0b7883}.p88-empty{grid-column:1/-1;padding:36px;text-align:center;color:#809198;border:1px dashed #cadadd;border-radius:16px;background:#fff}
#p88Float[hidden]{display:none!important}#p88Float{position:fixed;inset:0;z-index:99990;display:grid;place-items:center;padding:28px}.p88-float-backdrop{position:absolute;inset:0;background:rgba(5,22,31,.58);backdrop-filter:blur(8px)}.p88-float-card{position:relative;width:min(1100px,94vw);max-height:90vh;display:flex;flex-direction:column;background:#f9fcfd;border:1px solid rgba(255,255,255,.7);border-radius:26px;box-shadow:0 34px 90px rgba(4,20,30,.34);overflow:hidden;animation:p88pop .18s ease-out}.p88-float-card>header{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:14px;align-items:center;padding:14px 16px;background:#fff;border-bottom:1px solid #dce7e9}.p88-float-card>header button{border:1px solid #d4e0e3;background:#fff;border-radius:11px;padding:9px 12px;font-weight:850;color:#25434e}.p88-float-card>header .p88-x{width:42px;height:42px;padding:0;font-size:23px}.p88-float-card>header span{display:block;font-size:8.5px;letter-spacing:.12em;font-weight:900;color:#779097}.p88-float-card>header b{display:block;margin-top:2px;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.p88-float-card #p88FloatStage{padding:18px;overflow:auto;min-height:0}.p88-live-card{margin:0!important;width:100%!important;max-width:none!important;box-shadow:0 12px 34px rgba(11,38,51,.09)!important;border-radius:18px!important}.p88-live-card .pub-body{min-width:0}.p88-modal-open{overflow:hidden!important}@keyframes p88pop{from{opacity:0;transform:translateY(12px) scale(.985)}to{opacity:1;transform:none}}
@media(max-width:900px){.p88-folders{grid-template-columns:repeat(2,minmax(0,1fr))}.p88-head{align-items:flex-start;flex-direction:column}.p88-search{width:100%;max-width:none}.p88-file{grid-template-columns:42px minmax(0,1fr) auto}.p88-open{display:none}.p88-status{grid-column:3}}
@media(max-width:620px){#p88Archive{margin:10px 0 18px;border-radius:20px}.p88-head{padding:16px 14px 13px}.p88-head h3{font-size:22px}.p88-modes{padding:10px 14px 0;display:grid;grid-template-columns:repeat(3,1fr);gap:5px}.p88-mode{padding:9px 5px;font-size:10px}.p88-alpha{padding:9px 14px 0}.p88-crumb{padding:13px 14px 8px}.p88-folders{grid-template-columns:1fr;padding:10px 14px 18px}.p88-folder{min-height:102px}.p88-files{padding:8px 14px 18px}.p88-file{grid-template-columns:40px minmax(0,1fr);gap:9px;padding:11px}.p88-file-main b{white-space:normal;line-height:1.3}.p88-file-main small{white-space:normal;line-height:1.35}.p88-status{grid-column:2;justify-self:start}.p88-open{display:none}#p88Float{padding:0;place-items:stretch}.p88-float-card{width:100vw;max-height:none;height:100dvh;border-radius:0;border:0}.p88-float-card>header{padding:10px 11px;position:sticky;top:0;z-index:3}.p88-float-card>header b{font-size:12px}.p88-float-card #p88FloatStage{padding:10px}.p88-live-card{border-radius:15px!important}.p88-live-card .pub-act,.p88-live-card .repo-package-actions{padding-left:0!important;width:100%!important;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important}.p88-live-card .pub-act button,.p88-live-card .pub-act a,.p88-live-card .repo-package-actions button{width:100%!important;min-width:0!important;justify-content:center!important}}
`;document.head.appendChild(st)}
function boot(){injectCss();const timer=setInterval(()=>{const panel=$('#repoGeneralPanel');if(panel){buildUI();const items=visibleItems();const s=sig(items);if(!openCtx&&s!==lastSig)render(true)}},900);setTimeout(()=>clearInterval(timer),86400000);console.info('Carbonautas',BUILD,'Arquivo Vivo carregado')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
