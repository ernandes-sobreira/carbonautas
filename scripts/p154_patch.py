from pathlib import Path

# p135: orientação real no mesmo buildLinks do grafo
p=Path('p135-rede-acompanhamento.js')
s=p.read_text(encoding='utf-8')
old_prod="function productionLinks(members,links){const s=stateRef(),ids=new Set(members.map(m=>m.id)),seen=new Set(links.map(l=>[String(l.source?.id||l.source),String(l.target?.id||l.target)].sort().join('|'))),out=[];(s?.publicacoes||[]).forEach(p=>{const people=[p.memberId,...(Array.isArray(p.collaboratorMemberIds)?p.collaboratorMemberIds:[])].filter((v,i,a)=>v&&ids.has(v)&&a.indexOf(v)===i);for(let i=0;i<people.length;i++)for(let j=i+1;j<people.length;j++){const key=[people[i],people[j]].sort().join('|');if(seen.has(key))continue;seen.add(key);out.push({source:people[i],target:people[j],reasons:[{type:'producao',label:`Produção compartilhada${p.title?' · '+p.title:''}`}],w:1,aux:true})}});return out}"
assert old_prod in s
orient_fn="function orientationLinks(members){const s=stateRef(),ids=new Set(members.map(m=>m.id));let coord=null;try{if(isAdmin&&myId)coord=(s?.members||[]).find(m=>m.id===myId)||null}catch(_e){}if(!coord)coord=(s?.members||[]).find(m=>String(m.nivel||'')==='coord'||/coorden/.test(norm(m.nivel||m.papel||m.status||'')))||null;if(!coord||!ids.has(coord.id))return[];const counts=new Map();(s?.activities||[]).forEach(a=>{const owner=a?.ownerId||a?.memberId;if(!owner||owner===coord.id||!ids.has(owner)||!norm(a?.type).includes('orient'))return;counts.set(owner,(counts.get(owner)||0)+1)});return[...counts.entries()].map(([owner,n])=>({source:coord.id,target:owner,reasons:[{type:'orientacao',label:`Orientação registrada · ${n} registro${n===1?'':'s'}`}],w:Math.min(1.33,.28+.34*Math.sqrt(n)),aux:true,orientationCount:n}))}"
s=s.replace(old_prod,old_prod+'\n'+orient_fn,1)
old_build="function installBuildLinks(){if(baseBuildLinks)return true;let fn=null;try{fn=buildLinks}catch(_e){}if(typeof fn!=='function')return false;baseBuildLinks=fn;const wrapped=function(members){let links=baseBuildLinks(members),prod=productionLinks(members,links);if(relationMode==='all')links=links.concat(prod);else if(relationMode==='production')links=links.filter(l=>relationKinds(l).has('production')).concat(prod);else links=links.filter(l=>relationKinds(l).has(relationMode));graphInsight(members,links);return links};try{buildLinks=wrapped}catch(_e){}window.buildLinks=wrapped;return true}"
new_build="function installBuildLinks(){if(baseBuildLinks)return true;let fn=null;try{fn=buildLinks}catch(_e){}if(typeof fn!=='function')return false;baseBuildLinks=fn;const wrapped=function(members){let links=baseBuildLinks(members),prod=productionLinks(members,links),orient=orientationLinks(members);if(relationMode==='all')links=links.concat(prod,orient);else if(relationMode==='production')links=links.filter(l=>relationKinds(l).has('production')).concat(prod);else if(relationMode==='orientation')links=orient;else links=links.filter(l=>relationKinds(l).has(relationMode));graphInsight(members,links);return links};try{buildLinks=wrapped}catch(_e){}window.buildLinks=wrapped;return true}"
assert old_build in s
s=s.replace(old_build,new_build,1)
old_redraw="function redraw(){try{(window.renderGraph||renderGraph)?.()}catch(e){console.warn('P135 redraw',e)}}"
new_redraw="function redraw(){try{const labels=$('#tLabels');if(labels&&!labels.checked)labels.checked=true;(window.renderGraph||renderGraph)?.()}catch(e){console.warn('P135 redraw',e)}}"
assert old_redraw in s
s=s.replace(old_redraw,new_redraw,1)
s=s.replace("const BUILD='P135-REDE-20260919';","const BUILD='P154-REDE-20260919';",1)
p.write_text(s,encoding='utf-8')

# p150: manter botão Orientação e redesenhar após salvar
p=Path('modules/rede-orientacao-p150.js')
s=p.read_text(encoding='utf-8')
old_simple='''function simplifyNetwork(){
  const bar=$(\'#p135RedeToolbar\');
  if(!bar)return;
  const orient=$(\'[data-p135-mode="orientation"]\',bar),all=$(\'[data-p135-mode="all"]\',bar);
  if(orient?.classList.contains(\'on\'))all?.click();
  orient?.remove();
  const sub=$(\'.p135-rede-title small\',bar);if(sub)sub.textContent=\'Projetos, produção e outras conexões entre os Carbonautas\';
}'''
new_simple='''function simplifyNetwork(){
  const bar=$(\'#p135RedeToolbar\');
  if(!bar)return;
  const sub=$(\'.p135-rede-title small\',bar);if(sub)sub.textContent=\'Orientações registradas, projetos e produção\';
}'''
assert old_simple in s
s=s.replace(old_simple,new_simple,1)
old_add="await f.addDoc(f.collection(window.db,'rede_activities'),{ownerId:id,ownerUid,ownerName:m.nome||'',type:'orientacao',status:'concluido',title:`Orientação · ${m.nome||'Carbonauta'}`,description:note,startDate:date,dueDate:date,progress:100,orientadorId:my(),orientadorName:coord?.nome||'',vinculoCoordenador:roleOf(m)||'',updatedAt:f.serverTimestamp(),createdAt:f.serverTimestamp()});\n    toastSafe('Orientação registrada no dossiê.');closeModal();setTimeout(decorateDetail,250);"
new_add="const ref=await f.addDoc(f.collection(window.db,'rede_activities'),{ownerId:id,ownerUid,ownerName:m.nome||'',type:'orientacao',status:'concluido',title:`Orientação · ${m.nome||'Carbonauta'}`,description:note,startDate:date,dueDate:date,progress:100,orientadorId:my(),orientadorName:coord?.nome||'',vinculoCoordenador:roleOf(m)||'',updatedAt:f.serverTimestamp(),createdAt:f.serverTimestamp()});\n    try{const st=S();if(Array.isArray(st.activities)&&!st.activities.some(a=>a.id===ref.id))st.activities.unshift({id:ref.id,ownerId:id,ownerUid,ownerName:m.nome||'',type:'orientacao',status:'concluido',title:`Orientação · ${m.nome||'Carbonauta'}`,description:note,startDate:date,dueDate:date,progress:100,orientadorId:my(),orientadorName:coord?.nome||'',vinculoCoordenador:roleOf(m)||''})}catch(_e){}\n    toastSafe('Orientação registrada no dossiê.');closeModal();setTimeout(()=>{decorateDetail();try{(window.renderGraph||renderGraph)?.()}catch(_e){}},100);"
assert old_add in s
s=s.replace(old_add,new_add,1)
s=s.replace('/* Carbonautas P151 · acompanhamento acadêmico','/* Carbonautas P154 · acompanhamento acadêmico',1)
p.write_text(s,encoding='utf-8')

# loader: remover camada paralela, bust de cache
p=Path('modules/dossier-p132.js')
s=p.read_text(encoding='utf-8')
s=s.replace('/* Carbonautas P153 · carregador seguro','/* Carbonautas P154 · carregador seguro',1)
s=s.replace("await load('./p135-rede-acompanhamento.js?v=P135-20260919','carbonautas-p135-rede-acompanhamento');","await load('./p135-rede-acompanhamento.js?v=P154-20260919','carbonautas-p135-rede-acompanhamento');",1)
s=s.replace("await load('./modules/rede-orientacao-p150.js?v=P153-20260919','carbonautas-rede-orientacao-p150');","await load('./modules/rede-orientacao-p150.js?v=P154-20260919','carbonautas-rede-orientacao-p150');",1)
line="    await load('./modules/rede-orientacao-linhas-p152.js?v=P153-20260919','carbonautas-rede-orientacao-linhas-p152');\n"
assert line in s
s=s.replace(line,'',1)
p.write_text(s,encoding='utf-8')

# index: bust do loader para Chrome/PWA
p=Path('index.html')
s=p.read_text(encoding='utf-8')
old='<script src="./modules/dossier-p132.js?v=P132-20260919"></script>'
assert old in s
s=s.replace(old,'<script src="./modules/dossier-p132.js?v=P154-20260919"></script>',1)
p.write_text(s,encoding='utf-8')
