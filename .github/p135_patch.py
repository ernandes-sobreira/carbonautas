from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')
original = s


def need(old: str, new: str, label: str, count: int = 1):
    global s
    found = s.count(old)
    if found < count:
        raise SystemExit(f'ERRO P135: {label}: esperado >= {count}, encontrado {found}')
    s = s.replace(old, new, count)

# 1) CAUSA-RAIZ DA REDE VAZIA
# P97 considerava a simples existencia de .zoomG como "grafo ja desenhado".
# Desde P129 o D3 e carregado sob demanda: initGraph() cria .zoomG e a segunda
# chamada de renderGraph() era abortada antes de criar qualquer g.node/link.
need(
    "if(sig===lastGraphSig&&$('#graph .zoomG'))return;",
    "const painted=!!$('#graph g.node')||$('#emptyGraph')?.style.display==='grid';if(sig===lastGraphSig&&$('#graph .zoomG')&&painted)return;",
    'guarda de estabilidade P97'
)

# O modo visual da rede passa a fazer parte da assinatura para permitir redesenho.
need(
    "const g=$('#graph'),r=g?.getBoundingClientRect();return JSON.stringify([mem,ids,hn,hl,Math.round(r?.width||0),Math.round(r?.height||0)]);",
    "const g=$('#graph'),r=g?.getBoundingClientRect();return JSON.stringify([mem,ids,hn,hl,window.__p135NetworkMode||'all',Math.round(r?.width||0),Math.round(r?.height||0)]);",
    'assinatura do grafo P97'
)

# 2) MODOS DE LEITURA DA REDE
# Os dados existentes possuem linha/hub/vinculo e um motivo livre; portanto
# Orientacao/Producao sao classificados apenas quando o texto existente permite.
marker = "function buildLinks(members){"
if marker not in s:
    raise SystemExit('ERRO P135: buildLinks nao encontrado')
helper = r'''function p135NetworkReasonMatches(r,mode){
  if(!mode||mode==='all')return true;
  const txt=String(r?.label||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  if(mode==='orientacao')return /orienta|orientad|coorient|supervis/.test(txt);
  if(mode==='projetos')return r?.type==='linha'||/projeto|pesquisa|campo|grupo|rede/.test(txt);
  if(mode==='producao')return /artigo|publica|produc|coautor|manuscrit|relat|dado|dataset|capitul|livro/.test(txt);
  return true;
}
'''
s = s.replace(marker, helper + marker, 1)
need(
    "const reasons=pairReasons(members[i],members[j],includeAux);\n      if(reasons.length){",
    "const allReasons=pairReasons(members[i],members[j],includeAux);\n      const reasons=allReasons.filter(r=>p135NetworkReasonMatches(r,window.__p135NetworkMode||'all'));\n      if(reasons.length){",
    'filtro de vinculos da Rede'
)

# 3) ACOMPANHAMENTO: motivos concretos sem alterar o Firestore nem a pontuacao.
# healthFor() continua definindo Em dia/Atenção/Urgente pela logica existente;
# esta camada apenas recupera os registros reais que explicam o resultado.
overview_marker = "function overviewCard(m,can){"
if overview_marker not in s:
    raise SystemExit('ERRO P135: overviewCard P97 nao encontrado')
health_helpers = r'''function p135HealthDetails(m){
  const acts=actsFor(m.id),rows=[],seen=new Set();
  const title=a=>String(a?.title||typeLabel(a)||'Acompanhamento').trim()||'Acompanhamento';
  const add=(a,kind,when)=>{const key=a?.id||`${a?.type||''}|${a?.title||''}|${a?.dueDate||''}`;if(seen.has(key))return;seen.add(key);rows.push({kind,activityId:a?.id||'',title:title(a),dueDate:a?.dueDate||'',when})};
  acts.filter(overdue).sort((a,b)=>String(a.dueDate||'').localeCompare(String(b.dueDate||''))).slice(0,4).forEach(a=>{const d=dueDiff(a),n=d===null?null:Math.abs(d);add(a,'overdue',n===1?'atrasado há 1 dia':n>1?`atrasado há ${n} dias`:'atrasado')});
  acts.filter(a=>a.type==='correcao'&&!activityDone(a)).slice(0,4).forEach(a=>add(a,'correction','correção pendente'));
  acts.filter(a=>!activityDone(a)&&a.dueDate).map(a=>({a,d:dueDiff(a)})).filter(x=>x.d!==null&&x.d>=0&&x.d<=14).sort((a,b)=>a.d-b.d).slice(0,5).forEach(({a,d})=>add(a,'soon',d===0?'vence hoje':d===1?'vence amanhã':`vence em ${d} dias`));
  if(m.bolsista&&m.bolsaFim){const end=new Date(`${m.bolsaFim}T12:00:00`),today=new Date();today.setHours(12,0,0,0);const d=Math.ceil((end-today)/86400000);if(d>=0&&d<=45)rows.push({kind:'scholarship',activityId:'',title:m.bolsaModalidade||'Bolsa',dueDate:m.bolsaFim,when:d===0?'encerra hoje':d===1?'encerra amanhã':`encerra em ${d} dias`})}
  const last=acts.map(a=>millis(a.updatedAt)||millis(a.createdAt)).filter(Boolean).sort((a,b)=>b-a)[0]||0;if(m.status!=='egresso'&&last&&Date.now()-last>45*86400000){const d=Math.floor((Date.now()-last)/86400000);rows.push({kind:'stale',activityId:'',title:'Sem atualização recente',dueDate:'',when:`última atividade há ${d} dias`})}
  if(m.status!=='egresso'&&!String(m.perguntaCientifica||'').trim())rows.push({kind:'profile',activityId:'',title:'Pergunta científica',dueDate:'',when:'não preenchida'});
  return rows;
}
function p135HealthDetailsHTML(details,fallback){
  if(!details.length)return `<div>${esc97((fallback||['em dia']).slice(0,4).join(' · '))}</div>`;
  return `<div class="p135-health-reasons">${details.slice(0,5).map(d=>`<div class="p135-health-reason ${esc97(d.kind||'')}"><b>${esc97(d.title)}</b><span>${d.dueDate?esc97(fmtDate(d.dueDate))+' · ':''}${esc97(d.when)}</span></div>`).join('')}</div>`;
}
function p135SnapshotHTML(m){
  const acts=actsFor(m.id),open=acts.filter(a=>!activityDone(a));
  const due=open.filter(a=>a.dueDate).map(a=>({a,d:dueDiff(a)})).filter(x=>x.d!==null&&x.d>=0).sort((a,b)=>a.d-b.d)[0];
  const late=open.filter(overdue).sort((a,b)=>String(a.dueDate||'').localeCompare(String(b.dueDate||'')))[0];
  const last=[...acts].sort((a,b)=>(millis(b.updatedAt)||millis(b.createdAt))-(millis(a.updatedAt)||millis(a.createdAt)))[0];
  const action=late||due?.a||open.find(a=>a.type==='correcao')||open.find(a=>a.type==='pendencia')||open[0];
  const lastMs=last?(millis(last.updatedAt)||millis(last.createdAt)):0,lastDate=lastMs?new Date(lastMs).toLocaleDateString('pt-BR'):'';
  const dueTxt=due?(due.d===0?'hoje':due.d===1?'amanhã':`em ${due.d} dias`):'—';
  return `<div class="p135-snapshot"><div><span>Próximo prazo</span><b>${due?esc97(due.a.title||typeLabel(due.a)):'—'}</b><small>${due?esc97(fmtDate(due.a.dueDate))+' · '+dueTxt:'Nenhum prazo futuro aberto'}</small></div><div><span>Última atividade</span><b>${last?esc97(last.title||typeLabel(last)):'—'}</b><small>${lastDate||'Sem registro'}</small></div><div><span>Próxima ação</span><b>${action?esc97(action.title||typeLabel(action)):'Tudo em dia'}</b><small>${late?'Está atrasado':due?`Prazo ${dueTxt}`:action?'Item ainda aberto':'Nenhuma ação imediata'}</small></div></div>`;
}
'''
s = s.replace(overview_marker, health_helpers + overview_marker, 1)

need(
    "const h=healthFor(m),c=statusCounts(m),av=m.foto?`<img src=\"${esc97(m.foto)}\" alt=\"\">`:esc97(initials97(m.nome));",
    "const h=healthFor(m),details=p135HealthDetails(m),c=statusCounts(m),av=m.foto?`<img src=\"${esc97(m.foto)}\" alt=\"\">`:esc97(initials97(m.nome));",
    'dados do card Visao geral'
)
need(
    "<div class=\"p97-info full\"><label>Por que está assim?</label><div>${esc97((h.reasons||[]).slice(0,4).join(' · '))}</div></div>",
    "<div class=\"p97-info full\"><label>Por que está assim?</label>${p135HealthDetailsHTML(details,h.reasons)}</div>${p135SnapshotHTML(m)}",
    'motivo misterioso do Acompanhamento'
)
need(
    "function healthLabel(h){return h.level==='red'?'Intervir':h.level==='yellow'?'Atenção':'Em dia'}",
    "function healthLabel(h){return h.level==='red'?'Urgente':h.level==='yellow'?'Atenção':'Em dia'}",
    'rotulo de saude P97'
)
need(
    "const [soft,border,accent]=colorsFor(m.nome),h=healthFor(m),c=statusCounts(m);",
    "const [soft,border,accent]=colorsFor(m.nome),h=healthFor(m),details=p135HealthDetails(m),c=statusCounts(m);",
    'dados da pasta P97'
)
need(
    "<div class=\"p97-folder-meta\"><span class=\"p97-mini\">${c.open} abertos</span><span class=\"p97-mini\">${c.late} atrasados</span><span class=\"p97-mini\">${c.corr} correções</span><span class=\"p97-open\">abrir cartas →</span></div>",
    "<div class=\"p97-folder-meta\"><span class=\"p135-folder-reason\">${esc97(details[0]?`${details[0].title} — ${details[0].when}`:(h.reasons?.[0]||'Em dia'))}</span><span class=\"p97-open\">abrir →</span></div>",
    'resumo das pastas P97'
)
s = s.replace('Escolha um siminino ou uma siminina. A pasta abre como um baralho de acompanhamento.','Escolha uma pessoa para ver situação, prazos e próxima ação.',1)

# 4) INTERFACE LIMPA DA REDE E DO ACOMPANHAMENTO.
# Esta camada apenas reorganiza elementos existentes; nao cria/apaga documentos.
if 'id="p135-rede-acompanhamento-fix"' not in s:
    layer = r'''
<style id="p135-rede-acompanhamento-fix">
#viewRede>.stats{display:none!important}
#viewRede .main{min-height:0;flex:1}
#viewRede .graph-wrap{min-height:0}
.p135-rede-toolbar{display:flex;align-items:center;gap:8px;padding:9px 12px;border-bottom:1px solid var(--line);background:rgba(255,255,255,.94);backdrop-filter:blur(12px);flex-wrap:wrap;z-index:3}
.p135-rede-heading{display:flex;align-items:baseline;gap:8px;min-width:0}.p135-rede-heading b{font:700 22px 'Space Grotesk','Inter',sans-serif;color:#14364a}.p135-rede-heading small{color:#73878f;font-size:10.5px;font-weight:750;white-space:nowrap}
.p135-rede-toolbar>.search{order:2;flex:1 1 230px;max-width:none;min-width:170px;margin:0}
.p135-rede-modes{order:3;display:flex;gap:5px;overflow:auto;scrollbar-width:none;flex:1 1 100%}.p135-rede-modes::-webkit-scrollbar{display:none}.p135-rede-mode{border:1px solid #d7e4e2;background:#fff;color:#506b74;border-radius:999px;padding:7px 11px;font-size:11px;font-weight:850;white-space:nowrap}.p135-rede-mode.on{background:#168f94;border-color:#168f94;color:#fff}
.p135-rede-settings-btn{margin-left:auto;border:1px solid #d5e3e1;background:#fff;color:#244b58;border-radius:12px;padding:8px 10px;font-size:12px;font-weight:850}
.p135-rede-insight{order:4;flex:1 1 100%;font-size:10.5px;color:#71858d;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#p135RedeSettings[hidden]{display:none!important}#p135RedeSettings{position:fixed;inset:0;z-index:2147483300;display:grid;place-items:end;background:rgba(10,31,40,.42);backdrop-filter:blur(5px)}
.p135-settings-sheet{width:min(430px,100%);max-height:min(82dvh,760px);overflow:auto;background:#fbfefd;border-radius:24px 24px 0 0;border:1px solid #d7e6e3;box-shadow:0 -20px 60px rgba(12,42,52,.22);padding:15px 14px calc(18px + env(safe-area-inset-bottom))}
.p135-settings-head{display:flex;align-items:center;gap:10px;margin-bottom:10px}.p135-settings-head b{font-size:18px;flex:1}.p135-settings-close{width:38px;height:38px;border:0;border-radius:12px;background:#edf5f3;font-size:20px}
#p135RedeSettings .side{display:block!important;width:auto!important;flex:auto!important;border:0!important;padding:0!important;overflow:visible!important;background:transparent!important}
#p135RedeSettings .graph-controls{position:static!important;display:flex!important;margin-top:12px;box-shadow:none!important;background:#fff!important;width:100%;border-radius:15px!important;align-items:center!important}
.p135-health-reasons{display:flex;flex-direction:column;gap:7px}.p135-health-reason{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;padding:8px 10px;border-radius:12px;background:#f7faf9;border:1px solid #dfeae8}.p135-health-reason b{font-size:12px;color:#25434e}.p135-health-reason span{font-size:11px;color:#6b7f87;text-align:right}.p135-health-reason.overdue{background:#fff0f2;border-color:#f0cbd2}.p135-health-reason.soon{background:#fff8e9;border-color:#f0ddb0}
.p135-snapshot{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px}.p135-snapshot>div{border:1px solid #dce8e6;background:#fff;border-radius:14px;padding:10px;min-width:0}.p135-snapshot span,.p135-snapshot small{display:block;color:#788b91;font-size:9px;font-weight:750}.p135-snapshot b{display:block;margin:4px 0 3px;color:#21424d;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#viewTrack #p97Folders .p97-toolbar{grid-template-columns:1fr!important}#viewTrack #p97Folders .p97-toolbar .p97-field:not(.person),#viewTrack #p97Folders .p97-sort,#viewTrack #p97Folders .p97-actionline{display:none!important}#viewTrack .p97-summarychips{display:none!important}.p135-folder-reason{flex:1;min-width:0;background:rgba(255,255,255,.74);border:1px solid rgba(80,120,125,.12);border-radius:10px;padding:7px 9px;color:#526b72;font-size:10.5px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
@media(max-width:760px){
  .p135-rede-toolbar{padding:7px 8px}.p135-rede-heading{flex:1}.p135-rede-heading b{font-size:20px}.p135-rede-heading small{display:none}.p135-rede-toolbar>.search{order:3;flex-basis:100%;min-height:42px}.p135-rede-modes{order:4}.p135-rede-insight{order:5}.p135-rede-settings-btn{order:2}
  #viewRede .graph-wrap{min-height:0}.p135-snapshot{grid-template-columns:1fr}.p135-health-reason{display:block}.p135-health-reason span{text-align:left;margin-top:3px;display:block}
  #viewTrack .p97-hero p{font-size:12px}#viewTrack .p97-folder{min-height:112px!important}.p97-folder-meta{margin-top:11px!important}
}
</style>
<script id="p135-rede-acompanhamento-script">
(function(){
'use strict';
if(window.__CARBONAUTAS_P135)return;window.__CARBONAUTAS_P135=true;window.__p135NetworkMode=window.__p135NetworkMode||'all';
const $=(s,r=document)=>r.querySelector(s);
function insight(){const out=$('#p135RedeInsight');if(!out)return;try{const members=typeof visibleMembers==='function'?visibleMembers():[];const links=typeof buildLinks==='function'?buildLinks(members):[];const mode=window.__p135NetworkMode||'all';const label={all:'todas as relações',orientacao:'orientação identificada',projetos:'projetos/linhas',producao:'produção identificada'}[mode]||mode;out.textContent=`${members.length} pessoas · ${links.length} conexões · ${label}. Relações sem categoria permanecem em Todos.`}catch(_e){out.textContent='Relações sem categoria permanecem em Todos.'}}
function redraw(){try{window.renderGraph?.()}catch(_e){try{renderGraph()}catch(_e2){}}setTimeout(insight,80)}
function install(){const view=$('#viewRede'),main=$('#viewRede .main'),wrap=$('#viewRede .graph-wrap');if(!view||!main||!wrap||$('.p135-rede-toolbar',view))return;
  const bar=document.createElement('div');bar.className='p135-rede-toolbar';bar.innerHTML=`<div class="p135-rede-heading"><b>Rede</b><small>pessoas e relações</small></div><button type="button" class="p135-rede-settings-btn" id="p135RedeSettingsBtn">⚙ Ajustes</button><div class="p135-rede-modes"><button class="p135-rede-mode on" data-p135-mode="all">Todos</button><button class="p135-rede-mode" data-p135-mode="orientacao">Orientação</button><button class="p135-rede-mode" data-p135-mode="projetos">Projetos</button><button class="p135-rede-mode" data-p135-mode="producao">Produção</button></div><div class="p135-rede-insight" id="p135RedeInsight"></div>`;main.before(bar);
  const search=$('.topbar .search')||$('.search');if(search)bar.insertBefore(search,$('.p135-rede-modes',bar));
  const modal=document.createElement('div');modal.id='p135RedeSettings';modal.hidden=true;modal.innerHTML=`<section class="p135-settings-sheet"><div class="p135-settings-head"><b>Ajustes da Rede</b><button type="button" class="p135-settings-close" aria-label="Fechar">×</button></div><div id="p135SettingsBody"></div></section>`;document.body.appendChild(modal);const body=$('#p135SettingsBody',modal),side=$('.side',main),controls=$('.graph-controls',wrap);if(side)body.appendChild(side);if(controls)body.appendChild(controls);
  $('#p135RedeSettingsBtn',bar).onclick=()=>{modal.hidden=false};$('.p135-settings-close',modal).onclick=()=>{modal.hidden=true;requestAnimationFrame(redraw)};modal.addEventListener('click',e=>{if(e.target===modal){modal.hidden=true;requestAnimationFrame(redraw)}});
  bar.querySelectorAll('[data-p135-mode]').forEach(b=>b.onclick=()=>{window.__p135NetworkMode=b.dataset.p135Mode;bar.querySelectorAll('[data-p135-mode]').forEach(x=>x.classList.toggle('on',x===b));redraw()});
  requestAnimationFrame(()=>{redraw();try{fitView()}catch(_e){}});
}
function boot(){install();if(document.body.dataset.view==='rede')setTimeout(()=>{install();redraw()},80);new MutationObserver(ms=>{if(ms.some(m=>m.type==='attributes'&&m.attributeName==='data-view')&&document.body.dataset.view==='rede')setTimeout(()=>{install();redraw()},60)}).observe(document.body,{attributes:true,attributeFilter:['data-view']});window.addEventListener('resize',()=>{if(document.body.dataset.view==='rede')setTimeout(redraw,100)},{passive:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
</script>
'''
    pos = s.lower().rfind('</body>')
    if pos < 0:
        raise SystemExit('ERRO P135: </body> nao encontrado')
    s = s[:pos] + layer + '\n' + s[pos:]

# Validacoes estaticas: impedem commit parcial/silencioso.
checks = {
    'causa raiz corrigida': "const painted=!!$('#graph g.node')" in s,
    'modo na assinatura': "window.__p135NetworkMode||'all'" in s,
    'detalhe do prazo': 'function p135HealthDetails(m)' in s,
    'snapshot acompanhamento': 'Próxima ação' in s and 'Última atividade' in s,
    'ajustes rede': 'id="p135RedeSettings"' in s,
    'chips rede': 'data-p135-mode="orientacao"' in s and 'data-p135-mode="producao"' in s,
}
failed = [k for k,v in checks.items() if not v]
if failed:
    raise SystemExit('ERRO P135 validacao: ' + ', '.join(failed))
if s == original:
    raise SystemExit('ERRO P135: nenhuma alteracao produzida')
p.write_text(s, encoding='utf-8')
print('P135 OK:', len(original), '->', len(s), 'bytes')
