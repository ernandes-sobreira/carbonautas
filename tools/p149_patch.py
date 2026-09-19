from pathlib import Path
import re
p=Path('index.html')
s=p.read_text(encoding='utf-8')
original=s
if 'id="p149NetworkRelationsScript"' in s:
    raise SystemExit('P149 already applied')
s=s.replace(": [...formVinculos,{id:o.id,motivo:''}];",": [...formVinculos,{id:o.id,tipo:'outro',motivo:''}];",1)
marker="function visibleMembers(){\n  const q=$('#search').value.trim().toLowerCase();"
helper="""function p149VinculoMode(v){
  const t=String(v?.tipo||v?.type||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().trim();
  if(['orientacao','orientation','orientador','orientando'].includes(t)) return 'orientacao';
  if(['projeto','projetos','project','projects'].includes(t)) return 'projetos';
  if(['producao','production','coautoria'].includes(t)) return 'producao';
  return 'outro';
}
function p149MemberHasRelation(id,mode){
  if(!mode||mode==='all') return true;
  return state.members.some(m=>{
    if(m.id===id) return (m.vinculos||[]).some(v=>p149VinculoMode(v)===mode && memberById(v.id));
    return (m.vinculos||[]).some(v=>v.id===id && p149VinculoMode(v)===mode);
  });
}
function visibleMembers(){
  const q=$('#search').value.trim().toLowerCase();"""
assert marker in s
s=s.replace(marker,helper,1)
old="""    if(q){
      const hay=(m.nome+' '+m.tema+' '+m.linhas.join(' ')+' '+m.programa+' '+(m.origem||'')).toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;"""
new="""    if(q){
      const hay=(m.nome+' '+m.tema+' '+m.linhas.join(' ')+' '+m.programa+' '+(m.origem||'')).toLowerCase();
      if(!hay.includes(q)) return false;
    }
    const networkMode=window.__p135NetworkMode||'all';
    if(networkMode!=='all' && !p149MemberHasRelation(m.id,networkMode)) return false;
    return true;"""
assert old in s
s=s.replace(old,new,1)
old_pair="""    (a.vinculos||[]).filter(v=>v.id===b.id).forEach(v=>reasons.push({type:'vinculo',label:v.motivo||'Vínculo declarado'}));
    (b.vinculos||[]).filter(v=>v.id===a.id).forEach(v=>reasons.push({type:'vinculo',label:v.motivo||'Vínculo declarado'}));"""
new_pair="""    (a.vinculos||[]).filter(v=>v.id===b.id).forEach(v=>reasons.push({type:'vinculo',relationType:p149VinculoMode(v),label:v.motivo||'Vínculo declarado'}));
    (b.vinculos||[]).filter(v=>v.id===a.id).forEach(v=>reasons.push({type:'vinculo',relationType:p149VinculoMode(v),label:v.motivo||'Vínculo declarado'}));"""
assert old_pair in s
s=s.replace(old_pair,new_pair,1)
old_match="""function p135NetworkReasonMatches(r,mode){
  if(!mode||mode==='all')return true;
  const txt=String(r?.label||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();
  if(mode==='orientacao')return /orienta|orientad|coorient|supervis/.test(txt);
  if(mode==='projetos')return r?.type==='linha'||/projeto|pesquisa|campo|grupo|rede/.test(txt);
  if(mode==='producao')return /artigo|publica|produc|coautor|manuscrit|relat|dado|dataset|capitul|livro/.test(txt);
  return true;
}"""
new_match="""function p135NetworkReasonMatches(r,mode){
  if(!mode||mode==='all')return true;
  return r?.type==='vinculo' && r?.relationType===mode;
}"""
assert old_match in s
s=s.replace(old_match,new_match,1)
s=s.replace("const label={all:'todas as relações',orientacao:'orientação identificada',projetos:'projetos/linhas',producao:'produção identificada'}[mode]||mode;out.textContent=`${members.length} pessoas · ${links.length} conexões · ${label}. Relações sem categoria permanecem em Todos.`","const label={all:'rede completa',orientacao:'orientações cadastradas',projetos:'projetos cadastrados',producao:'produções cadastradas'}[mode]||mode;out.textContent=`${members.length} pessoas · ${links.length} conexões · ${label}`",1)
insert=r'''
<!-- P149 · vínculos estruturados da Rede -->
<style id="p149NetworkRelationsStyle">
.p149-add-relation{order:1;margin-left:auto;border:0;border-radius:12px;background:#168f94;color:#fff;padding:9px 13px;font:800 12px/1 Inter,sans-serif;box-shadow:0 7px 18px rgba(22,143,148,.16);white-space:nowrap}
#p149RelationOverlay[hidden]{display:none!important}#p149RelationOverlay{position:fixed;inset:0;z-index:2147483500;background:rgba(10,31,40,.42);backdrop-filter:blur(5px);display:grid;place-items:end center}.p149-relation-sheet{width:min(520px,100%);max-height:min(86dvh,780px);overflow:auto;background:#fbfefd;border:1px solid #d8e6e4;border-radius:25px 25px 0 0;box-shadow:0 -18px 54px rgba(12,42,52,.24);padding:16px 16px calc(20px + env(safe-area-inset-bottom))}.p149-sheet-head{display:flex;align-items:center;gap:12px;margin-bottom:6px}.p149-sheet-head>div{flex:1}.p149-sheet-head b{display:block;color:#173846;font:800 21px/1.15 'Space Grotesk',Inter,sans-serif}.p149-sheet-head small{display:block;color:#71868e;font-size:12px;margin-top:4px}.p149-sheet-close{width:40px;height:40px;border:0;border-radius:13px;background:#edf5f3;color:#173846;font-size:22px}.p149-rel-form{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}.p149-rel-field{display:flex;flex-direction:column;gap:6px}.p149-rel-field.full{grid-column:1/-1}.p149-rel-field label{font-size:11px;font-weight:800;color:#617780;text-transform:uppercase;letter-spacing:.04em}.p149-rel-field select,.p149-rel-field input{width:100%;min-height:44px;border:1px solid #d7e4e2;border-radius:13px;background:#fff;color:#173846;padding:9px 11px;font-size:14px;outline:0}.p149-save-rel{grid-column:1/-1;min-height:46px;border:0;border-radius:14px;background:#168f94;color:#fff;font-weight:850;font-size:14px}.p149-rel-list-title{margin:20px 0 8px;color:#617780;font-size:11px;font-weight:850;text-transform:uppercase;letter-spacing:.05em}.p149-rel-list{display:flex;flex-direction:column;gap:7px}.p149-rel-row{display:flex;align-items:center;gap:10px;border:1px solid #deebe9;background:#fff;border-radius:14px;padding:10px 11px}.p149-rel-badge{flex:0 0 auto;border-radius:999px;padding:5px 8px;background:#edf7f6;color:#147a7e;font-size:10px;font-weight:850}.p149-rel-copy{min-width:0;flex:1}.p149-rel-copy b{display:block;color:#1b3d49;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.p149-rel-copy small{display:block;color:#7b8d93;font-size:10.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}.p149-rel-del{flex:0 0 auto;border:0;background:#fff1f3;color:#b73d59;width:34px;height:34px;border-radius:10px;font-size:18px}.p149-rel-empty{padding:14px;border:1px dashed #d6e4e2;border-radius:13px;color:#819299;font-size:12px;text-align:center}@media(max-width:620px){.p149-add-relation{padding:8px 11px;font-size:11.5px}.p149-relation-sheet{padding:14px 14px calc(18px + env(safe-area-inset-bottom))}.p149-rel-form{grid-template-columns:1fr}.p149-rel-field.full,.p149-save-rel{grid-column:1}.p149-sheet-head b{font-size:19px}}
</style>
<script id="p149NetworkRelationsScript">
(function(){'use strict';if(window.__CARBONAUTAS_P149_RELATIONS)return;window.__CARBONAUTAS_P149_RELATIONS=true;
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>Array.from(r.querySelectorAll(s));const esc149=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const labels149={orientacao:'Orientação',projetos:'Projeto',producao:'Produção',outro:'Outro'};
function type149(v){try{return p149VinculoMode(v)}catch(_e){return'outro'}}function admin149(){try{return!!isAdmin}catch(_e){return false}}function ms149(){try{return(state.members||[]).slice().sort((a,b)=>(a.nome||'').localeCompare(b.nome||'','pt-BR'))}catch(_e){return[]}}
function ensure149(){const view=q('#viewRede'),bar=q('.p135-rede-toolbar',view);if(!view||!bar)return;let btn=q('#p149AddRelationBtn');if(admin149()&&!btn){btn=document.createElement('button');btn.type='button';btn.id='p149AddRelationBtn';btn.className='p149-add-relation';btn.textContent='+ Vínculo';bar.insertBefore(btn,q('.p135-rede-modes',bar)||null);btn.onclick=open149}if(!q('#p149RelationOverlay')){const ov=document.createElement('div');ov.id='p149RelationOverlay';ov.hidden=true;ov.innerHTML=`<section class="p149-relation-sheet"><div class="p149-sheet-head"><div><b>Novo vínculo</b><small>Cadastre a relação; a Rede deixa de adivinhar.</small></div><button type="button" class="p149-sheet-close" aria-label="Fechar">×</button></div><div class="p149-rel-form"><div class="p149-rel-field"><label>Pessoa 1</label><select id="p149RelFrom"></select></div><div class="p149-rel-field"><label>Pessoa 2</label><select id="p149RelTo"></select></div><div class="p149-rel-field full"><label>Tipo de vínculo</label><select id="p149RelType"><option value="orientacao">Orientação</option><option value="projetos">Projeto</option><option value="producao">Produção</option><option value="outro">Outro</option></select></div><div class="p149-rel-field full"><label>Qual? (opcional)</label><input id="p149RelDetail" maxlength="160" placeholder="Ex.: Mestrado, CARBONAUTAS, artigo sobre Taiamã"></div><button type="button" class="p149-save-rel" id="p149RelSave">Salvar vínculo</button></div><div class="p149-rel-list-title">Vínculos cadastrados</div><div class="p149-rel-list" id="p149RelList"></div></section>`;document.body.appendChild(ov);q('.p149-sheet-close',ov).onclick=close149;ov.onclick=e=>{if(e.target===ov)close149()};q('#p149RelSave',ov).onclick=save149}}
function fill149(){const ms=ms149(),a=q('#p149RelFrom'),b=q('#p149RelTo');if(!a||!b)return;const o=ms.map(m=>`<option value="${esc149(m.id)}">${esc149(m.nome||'Sem nome')}</option>`).join('');a.innerHTML=o;b.innerHTML=o;try{if(myId&&ms.some(m=>m.id===myId))a.value=myId}catch(_e){}if(b.value===a.value){const x=ms.find(m=>m.id!==a.value);if(x)b.value=x.id}renderList149()}
function open149(){if(!admin149()){try{toast('Só o coordenador pode cadastrar vínculos entre pessoas.')}catch(_e){}return}ensure149();fill149();q('#p149RelationOverlay').hidden=false}function close149(){const o=q('#p149RelationOverlay');if(o)o.hidden=true}
async function save149(){const from=q('#p149RelFrom')?.value,to=q('#p149RelTo')?.value,t=q('#p149RelType')?.value||'outro',d=(q('#p149RelDetail')?.value||'').trim();if(!from||!to||from===to){try{toast('Escolha duas pessoas diferentes.')}catch(_e){}return}const m=memberById(from);if(!m)return;const arr=(m.vinculos||[]).map(v=>({...v})),i=arr.findIndex(v=>v.id===to&&type149(v)===t),item={id:to,tipo:t,motivo:d};if(i>=0)arr[i]=item;else arr.push(item);const b=q('#p149RelSave');b.disabled=true;b.textContent='Salvando…';try{await fbSetMember(from,{vinculos:arr});q('#p149RelDetail').value='';try{toast('Vínculo salvo.')}catch(_e){}setTimeout(()=>{renderList149();try{renderAll()}catch(_e){}},180)}catch(e){console.error(e);try{toast('Não foi possível salvar o vínculo.')}catch(_e){}}finally{b.disabled=false;b.textContent='Salvar vínculo'}}
function renderList149(){const box=q('#p149RelList');if(!box)return;let rows=[];ms149().forEach(m=>(m.vinculos||[]).forEach((v,i)=>{const other=memberById(v.id);if(other)rows.push({source:m,index:i,target:other,type:type149(v),detail:v.motivo||''})}));rows=rows.sort((a,b)=>(a.source.nome||'').localeCompare(b.source.nome||'','pt-BR'));if(!rows.length){box.innerHTML='<div class="p149-rel-empty">Nenhum vínculo cadastrado ainda.</div>';return}box.innerHTML=rows.map((r,n)=>`<div class="p149-rel-row"><span class="p149-rel-badge">${esc149(labels149[r.type]||'Outro')}</span><span class="p149-rel-copy"><b>${esc149(r.source.nome)} ↔ ${esc149(r.target.nome)}</b><small>${esc149(r.detail||'Sem descrição')}</small></span><button type="button" class="p149-rel-del" data-n="${n}" aria-label="Excluir vínculo">×</button></div>`).join('');qa('.p149-rel-del',box).forEach(btn=>btn.onclick=async()=>{const r=rows[+btn.dataset.n];if(!r||!confirm(`Excluir vínculo entre ${r.source.nome} e ${r.target.nome}?`))return;const arr=(r.source.vinculos||[]).map(v=>({...v}));arr.splice(r.index,1);btn.disabled=true;try{await fbSetMember(r.source.id,{vinculos:arr});setTimeout(()=>{renderList149();try{renderAll()}catch(_e){}},180)}catch(e){console.error(e);btn.disabled=false}})}
function empty149(){const el=q('#emptyGraph'),m=window.__p135NetworkMode||'all',lab={orientacao:'orientação',projetos:'projeto',producao:'produção'};if(el)el.textContent=m==='all'?'Nenhum membro corresponde aos filtros.':`Nenhum vínculo de ${lab[m]||'este tipo'} cadastrado. Use + Vínculo.`}document.addEventListener('click',e=>{if(e.target.closest?.('[data-p135-mode]'))setTimeout(empty149,40)},true);function boot(){ensure149();empty149();new MutationObserver(ms=>{if(ms.some(m=>m.type==='attributes'&&m.attributeName==='data-view')&&document.body.dataset.view==='rede')setTimeout(()=>{ensure149();empty149()},60)}).observe(document.body,{attributes:true,attributeFilter:['data-view']})}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();window.CARBONAUTAS_NETWORK_RELATIONS_BUILD='P149';})();
</script>
'''
assert '</body>' in s
s=s.replace('</body>',insert+'\n</body>',1)
p.write_text(s,encoding='utf-8')
print('patched',len(original),len(s))
