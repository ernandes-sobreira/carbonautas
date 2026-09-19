from pathlib import Path
import re

# index.html: consolidate relation semantics in the graph core
p=Path('index.html'); s=p.read_text(encoding='utf-8')
start=s.index('function p135NetworkReasonMatches(r,mode){')
end=s.index('\n/* ============ RENDER: STATS ============ */', start)
core="""function p135NetworkReasonMatches(r,mode){
  mode=String(mode||'all').toLowerCase();
  if(mode==='orientation')mode='orientacao';
  if(mode==='projects')mode='projetos';
  if(mode==='production')mode='producao';
  if(!mode||mode==='all')return true;
  const txt=String(r?.label||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();
  if(mode==='orientacao')return false;
  if(mode==='projetos')return r?.type==='linha'||/projeto|pesquisa|campo|grupo|rede/.test(txt);
  if(mode==='producao')return r?.type==='producao'||/artigo|publica|produc|coautor|manuscrit|relat|dado|dataset|capitul|livro/.test(txt);
  return true;
}
function p157Mode(){
  const m=String(window.__p135NetworkMode||'all').toLowerCase();
  return m==='orientation'?'orientacao':m==='projects'?'projetos':m==='production'?'producao':m;
}
function p157Coordinator(members){
  const own=(typeof myId!=='undefined'&&myId)?members.find(m=>m.id===myId):null;
  return own||members.find(m=>String(m.nivel||'')==='coord'||/coorden/.test(String(m.nivel||m.papel||m.status||'').toLowerCase()))||null;
}
function p157OrientationCounts(members){
  const ids=new Set(members.map(m=>String(m.id))),coord=p157Coordinator(members),counts=new Map();
  if(!coord)return {coord:null,counts,total:0};
  let total=0;
  (state.activities||[]).forEach(a=>{
    const type=String(a?.type||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();
    if(!type.includes('orient'))return;
    const owner=String(a?.ownerId||a?.memberId||'');
    if(!owner||owner===String(coord.id)||!ids.has(owner))return;
    counts.set(owner,(counts.get(owner)||0)+1); total++;
  });
  return {coord,counts,total};
}
function p157OrientationWidth(n){return Math.min(10.4,3.2+1.8*Math.max(0,(Number(n)||1)-1))}
function p157OrientationForce(n){return Math.min(3.4,1.25+0.75*Math.log2((Number(n)||1)+1))}
function p157ForceWeight(d){return Math.max(.25,Number(d?.forceWeight??d?.w??1)||1)}
function p157StrokeWidth(d){return Math.max(.8,Number(d?.visualWidth)||(.8+(Number(d?.w)||0)*.9))}
function p157PairKey(l){
  const a=String(l?.source?.id||l?.source||''),b=String(l?.target?.id||l?.target||'');
  return [a,b].sort().join('|')+'|'+String(l?.relationType||'base');
}
function p157Push(links,link){
  const key=p157PairKey(link),old=links.find(x=>p157PairKey(x)===key);
  if(!old){links.push(link);return}
  old.reasons=[...(old.reasons||[]),...(link.reasons||[])];
  old.w=Math.max(Number(old.w)||0,Number(link.w)||0);
  old.forceWeight=Math.max(Number(old.forceWeight)||0,Number(link.forceWeight)||0);
  old.visualWidth=Math.max(Number(old.visualWidth)||0,Number(link.visualWidth)||0);
  old.orientationCount=Math.max(Number(old.orientationCount)||0,Number(link.orientationCount)||0);
}
function p157ProductionLinks(members){
  const ids=new Set(members.map(m=>String(m.id))),out=[];
  (state.publicacoes||[]).forEach(p=>{
    const people=[p.memberId,...(Array.isArray(p.collaboratorMemberIds)?p.collaboratorMemberIds:[])].map(String).filter((v,i,a)=>v&&ids.has(v)&&a.indexOf(v)===i);
    for(let i=0;i<people.length;i++)for(let j=i+1;j<people.length;j++)p157Push(out,{source:people[i],target:people[j],relationType:'production',reasons:[{type:'producao',label:`Produção compartilhada${p.title?' · '+p.title:''}`}],w:1,forceWeight:1.25,visualWidth:2.8,aux:false});
  });
  return out;
}
function buildLinks(members){
  const mode=p157Mode(),includeAux=$('#tHubLinks')?$('#tHubLinks').checked:true,links=[];
  if(mode!=='orientacao'){
    for(let i=0;i<members.length;i++)for(let j=i+1;j<members.length;j++){
      const allReasons=pairReasons(members[i],members[j],includeAux);
      const reasons=mode==='all'?allReasons:allReasons.filter(r=>p135NetworkReasonMatches(r,mode));
      if(!reasons.length)continue;
      const hasLinha=reasons.some(r=>r.type==='linha');
      const w=reasons.reduce((sum,r)=>sum+(r.type==='linha'?1:.45),0);
      const relationType=mode==='projetos'?'projects':mode==='producao'?'production':'base';
      p157Push(links,{source:members[i].id,target:members[j].id,reasons,w,forceWeight:w,aux:!hasLinha,relationType,visualWidth:relationType==='projects'?2.1:relationType==='production'?2.8:undefined});
    }
  }
  const oc=p157OrientationCounts(members);
  if((mode==='orientacao'||mode==='all')&&oc.coord)for(const [owner,n] of oc.counts.entries())p157Push(links,{source:oc.coord.id,target:owner,relationType:'orientation',orientationCount:n,reasons:[{type:'orientacao',label:`Orientação registrada · ${n} registro${n===1?'':'s'}`}],w:1,forceWeight:p157OrientationForce(n),visualWidth:p157OrientationWidth(n),aux:false});
  if(mode==='producao'||mode==='all')p157ProductionLinks(members).forEach(l=>p157Push(links,l));
  return links;
}
"""
s=s[:start]+core+s[end:]
old=".distance(d=>d.aux?150:90-d.w*8)\n      .strength(d=>d.aux?0.045:0.12+d.w*0.05))"
new=".distance(d=>d.aux?150:Math.max(58,90-p157ForceWeight(d)*8))\n      .strength(d=>d.aux?0.045:Math.min(.32,0.12+p157ForceWeight(d)*0.05)))"
assert old in s; s=s.replace(old,new,1)
old="""gLink.selectAll('line').data(links,d=>d.source.id+'-'+d.target.id).join(
    e=>e.append('line').attr('class',d=>'link'+(d.aux?' aux':'')).attr('stroke-width',d=>0.8+d.w*0.9),
    u=>u.attr('class',d=>'link'+(d.aux?' aux':'')).attr('stroke-width',d=>0.8+d.w*0.9),
    x=>x.remove()
  );"""
new="""gLink.selectAll('line').data(links,d=>[d.source.id,d.target.id,d.relationType||'base'].join('-')).join(
    e=>e.append('line').attr('class',d=>'link rel-'+(d.relationType||'base')+(d.aux?' aux':'')).attr('stroke-width',p157StrokeWidth),
    u=>u.attr('class',d=>'link rel-'+(d.relationType||'base')+(d.aux?' aux':'')).attr('stroke-width',p157StrokeWidth),
    x=>x.remove()
  );"""
assert old in s; s=s.replace(old,new,1)
anchor="  .link.aux.hl{stroke:var(--indigo);stroke-opacity:.85}\n"
css="""  .link.aux.hl{stroke:var(--indigo);stroke-opacity:.85}
  .link.rel-orientation{stroke:#168f94;stroke-opacity:.94;stroke-dasharray:none;stroke-linecap:round}
  .link.rel-orientation.hl{stroke:#0b7479;stroke-opacity:1}
  .link.rel-production{stroke:#6c5ce0;stroke-opacity:.82;stroke-dasharray:9 6;stroke-linecap:round}
  .link.rel-production.hl{stroke:#5142c7;stroke-opacity:1}
  .link.rel-projects{stroke:#2e9e5b;stroke-opacity:.76;stroke-dasharray:none}
  .link.rel-projects.hl{stroke:#1d7c43;stroke-opacity:1}
"""
assert anchor in s; s=s.replace(anchor,css,1)
p.write_text(s,encoding='utf-8')

# P135 becomes the single mode controller; it no longer filters buildLinks itself
p=Path('p135-rede-acompanhamento.js'); s=p.read_text(encoding='utf-8')
old="function installBuildLinks(){if(baseBuildLinks)return true;let fn=null;try{fn=buildLinks}catch(_e){}if(typeof fn!=='function')return false;baseBuildLinks=fn;const wrapped=function(members){let links=baseBuildLinks(members),prod=productionLinks(members,links);if(relationMode==='all')links=links.concat(prod);else if(relationMode==='production')links=links.filter(l=>relationKinds(l).has('production')).concat(prod);else links=links.filter(l=>relationKinds(l).has(relationMode));graphInsight(members,links);return links};try{buildLinks=wrapped}catch(_e){}window.buildLinks=wrapped;return true}"
new="function installBuildLinks(){if(baseBuildLinks)return true;let fn=null;try{fn=buildLinks}catch(_e){}if(typeof fn!=='function')return false;baseBuildLinks=fn;const wrapped=function(members){const links=baseBuildLinks(members);graphInsight(members,links);return links};try{buildLinks=wrapped}catch(_e){}window.buildLinks=wrapped;return true}"
assert old in s; s=s.replace(old,new,1)
old="function setMode(mode){relationMode=mode;$$('[data-p135-mode]').forEach(b=>b.classList.toggle('on',b.dataset.p135Mode===mode));redraw()}"
new="function setMode(mode){relationMode=mode;window.__p135NetworkMode=mode||'all';$$('[data-p135-mode]').forEach(b=>b.classList.toggle('on',b.dataset.p135Mode===mode));const el=$('#p135RedeInsight');if(el){const labels={all:'Todas as relações',orientation:'Orientações registradas · linha mais grossa = mais orientações',projects:'Projetos e linhas compartilhadas',production:'Produção compartilhada · linha roxa tracejada'};el.textContent=labels[mode]||labels.all}redraw()}"
assert old in s; s=s.replace(old,new,1)
marker='let baseBuildLinks=null;'; assert marker in s; s=s.replace(marker,marker+"\nwindow.__p135NetworkMode=window.__p135NetworkMode||'all';",1)
p.write_text(s,encoding='utf-8')

# P155 keeps mobile timeline only; graph styles are owned by core
p=Path('modules/rede-ui-p155.js'); s=p.read_text(encoding='utf-8')
s=re.sub(r"function orientationStroke\(n\)\{.*?\nfunction polishTimeline\(\)","function polishOrientationLines(){}\n\nfunction polishTimeline()",s,count=1,flags=re.S)
s=s.replace("  const graph=$('#graph');\n  if(graph&&!graph.dataset.p155Observed){\n    graph.dataset.p155Observed='1';\n    new MutationObserver(()=>requestAnimationFrame(polishOrientationLines)).observe(graph,{childList:true,subtree:true});\n  }\n",'')
p.write_text(s,encoding='utf-8')

# Loader drops the competing P154 graph controller and cache-busts P157
p=Path('modules/dossier-p132.js'); s=p.read_text(encoding='utf-8')
s=s.replace("await load('./p135-rede-acompanhamento.js?v=P135-20260919','carbonautas-p135-rede-acompanhamento');","await load('./p135-rede-acompanhamento.js?v=P157-20260919','carbonautas-p135-rede-acompanhamento');")
s=s.replace("    await load('./modules/rede-orientacao-rede-p154.js?v=P156-20260919','carbonautas-rede-orientacao-rede-p154');\n",'')
s=s.replace("await load('./modules/rede-ui-p155.js?v=P156-20260919','carbonautas-rede-ui-p155');","await load('./modules/rede-ui-p155.js?v=P157-20260919','carbonautas-rede-ui-p155');")
p.write_text(s,encoding='utf-8')

# Validation report
idx=Path('index.html').read_text(encoding='utf-8'); p135=Path('p135-rede-acompanhamento.js').read_text(encoding='utf-8'); loader=Path('modules/dossier-p132.js').read_text(encoding='utf-8')
checks={'orientation_width':'p157OrientationWidth' in idx,'separate_force':'p157ForceWeight' in idx,'typed_join':"d.relationType||'base'" in idx,'orientation_css':'.link.rel-orientation' in idx,'production_css':'.link.rel-production' in idx,'single_mode_controller':'window.__p135NetworkMode=mode' in p135,'p154_removed':'rede-orientacao-rede-p154.js' not in loader,'p155_cache_p157':'rede-ui-p155.js?v=P157' in loader}
assert all(checks.values()),checks
Path('p157-validation.txt').write_text('\n'.join([*(f'{k}={v}' for k,v in checks.items()),'orientation_px=1:3.2,2:5.0,3:6.8,4:8.6,5+:10.4cap','orientation=teal solid','production=purple dashed','projects=green solid','orientation_count_source=state.activities','physics=forceWeight; visuals=visualWidth'])+'\n',encoding='utf-8')
