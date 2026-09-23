/* Carbonautas P168 · visão do coordenador no Repositório
   - mostra pastas privadas/selecionadas/grupo para a coordenação
   - respeita os filtros novos de pessoa, busca e categoria
   - não altera conteúdo nem ACL das pastas
*/
(function(root){
'use strict';
if(root.__CARBONAUTAS_REPOSITORY_COORDINATOR_P168)return;
root.__CARBONAUTAS_REPOSITORY_COORDINATOR_P168=true;
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const millis=v=>v?.toMillis?.()||(v?.seconds?v.seconds*1000:Date.parse(v)||0);
function app(){return root.CarbonautasApp||{state:{},isAdmin:false}}
function memberName(id){return (app().state.members||[]).find(m=>String(m.id)===String(id))?.nome||'Participante'}
function ownerName(p){return p.ownerName||p.createdByName||p.memberNome||memberName(p.ownerMemberId||p.createdByMemberId)}
function title(p){return p.title||p.nome||p.name||p.purpose||'Pasta do Repositório'}
function accessLabel(p){return p.accessMode==='group'?'Toda a Rede':p.accessMode==='selected'?'Selecionada':'Privada'}
function ensureStyle(){
 if($('#p168RepositoryStyle'))return;
 const st=document.createElement('style');st.id='p168RepositoryStyle';st.textContent=`
 #repoPackageList.p168-coordinator-packages{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:12px;margin:14px 0 18px}
 .p168-package{border:1px solid #d7e5e4;border-radius:18px;background:#fff;padding:14px;box-shadow:0 5px 20px rgba(20,60,70,.06);min-width:0}
 .p168-package-head{display:flex;align-items:flex-start;gap:9px}.p168-package-head>div{min-width:0;flex:1}.p168-package h3{font-size:15px;line-height:1.25;margin:0;color:#173d4c;overflow-wrap:anywhere}.p168-package p{margin:5px 0 0;color:#60757d;font-size:12px;line-height:1.35}.p168-package-meta{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}.p168-package-tag{display:inline-flex;border-radius:999px;background:#eef7f5;padding:5px 8px;font-size:10px;font-weight:800;color:#35616a}.p168-package button{min-height:40px;border:1px solid #cfe0df;border-radius:11px;background:#f7fbfa;color:#173d4c;font:inherit;font-size:12px;font-weight:800;padding:8px 13px}
 #p168CoordinatorHeading{font-size:12px;color:#567078;margin:13px 0 5px;font-weight:800}
 @media(max-width:600px){#repoPackageList.p168-coordinator-packages{grid-template-columns:1fr}.p168-package{border-radius:16px;padding:13px}}
 `;document.head.appendChild(st)
}
function addPackagePeopleOptions(){
 const select=$('#repositoryPerson');if(!select)return;
 const selected=select.value,known=new Set([...select.options].map(o=>String(o.value)));
 const rows=[];
 for(const p of app().state.repositoryPackages||[]){const id=String(p.ownerMemberId||p.createdByMemberId||'');if(id&&!known.has(id)){known.add(id);rows.push([id,ownerName(p)])}}
 rows.sort((a,b)=>String(a[1]).localeCompare(String(b[1]),'pt-BR'));
 for(const [id,name] of rows){const o=document.createElement('option');o.value=id;o.textContent=name;select.appendChild(o)}
 if([...select.options].some(o=>o.value===selected))select.value=selected;
}
function rows(){
 let out=[...(app().state.repositoryPackages||[])];
 const person=$('#repositoryPerson')?.value||'',category=$('#repositoryCategory')?.value||'',mode=$('#repositoryMode')?.value||'date',query=norm($('#repositorySearch')?.value||'');
 if(category||mode==='pending')return[];
 if(person)out=out.filter(p=>String(p.ownerMemberId||p.createdByMemberId||'')===person);
 if(query)out=out.filter(p=>norm([title(p),ownerName(p),p.purpose,p.description,accessLabel(p)].join(' ')).includes(query));
 return out.sort((a,b)=>mode==='person'?norm(ownerName(a)).localeCompare(norm(ownerName(b)),'pt-BR'):millis(b.updatedAt||b.ts||b.createdAt)-millis(a.updatedAt||a.ts||a.createdAt));
}
function render(){
 if(!app().isAdmin)return;
 const wrap=$('#repoPackageList');if(!wrap)return;
 ensureStyle();addPackagePeopleOptions();
 const data=rows();
 let h=$('#p168CoordinatorHeading');
 if(!h){h=document.createElement('div');h.id='p168CoordinatorHeading';h.textContent='Pastas enviadas pelos Carbonautas';wrap.parentNode?.insertBefore(h,wrap)}
 h.hidden=!data.length;wrap.classList.add('p168-coordinator-packages');wrap.hidden=!data.length;
 if(!data.length){wrap.innerHTML='';return}
 wrap.innerHTML=data.map(p=>`<article class="p168-package" data-p168-package="${esc(p.id)}"><div class="p168-package-head"><div><h3>${esc(title(p))}</h3><p>${esc(ownerName(p))}</p></div></div><div class="p168-package-meta"><span class="p168-package-tag">${esc(accessLabel(p))}</span>${p.purpose?`<span class="p168-package-tag">${esc(p.purpose)}</span>`:''}</div><button type="button" data-p168-open="${esc(p.id)}">Abrir pasta</button></article>`).join('');
}
function schedule(){cancelAnimationFrame(schedule.raf||0);schedule.raf=requestAnimationFrame(()=>{render();setTimeout(render,80)})}
function boot(){
 if(!app().isAdmin)return;
 document.addEventListener('carbonautas:repository-rendered',schedule);
 document.addEventListener('change',e=>{if(e.target.closest?.('#repositoryOrganizer'))schedule()});
 document.addEventListener('input',e=>{if(e.target.closest?.('#repositoryOrganizer'))schedule()});
 document.addEventListener('click',e=>{const b=e.target.closest?.('[data-p168-open]');if(!b)return;e.preventDefault();const id=b.dataset.p168Open;if(typeof root.openRepositoryPackage==='function')root.openRepositoryPackage(id);else root.toast?.('A pasta ainda não terminou de carregar.')});
 root.addEventListener?.('firebase-ready',schedule,{passive:true});schedule();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(globalThis);
