/* Carbonautas P223 · triagem persistente da capa
   - "Feito" não volta na próxima sessão
   - "Fazer depois" reaparece amanhã às 08h
   - "Abrir e resolver" aciona a ação real do item oculto no Painel
*/
(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.CARBONAUTAS_HOME_ACTION_FLOW_P223=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const hasDocument=()=>typeof document!=='undefined';
const $=(s,r)=>hasDocument()?(r||document).querySelector(s):null;
const $$=(s,r)=>hasDocument()?Array.from((r||document).querySelectorAll(s)):[];
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
let observer=null,actorTimer=0,snoozeTimer=0,lastActor='';

function actor(){
  try{return String(root.auth?.currentUser?.uid||root.CarbonautasApp?.memberId||root.myId||'anon')}catch(_e){return'anon'}
}
function storeKey(kind,id=actor()){return `carbonautas_p223_home_${kind}_${id||'anon'}`}
function readJson(key,fallback){
  try{const v=JSON.parse(localStorage.getItem(key)||'');return v&&typeof v==='object'?v:fallback}catch(_e){return fallback}
}
function writeJson(key,v){try{localStorage.setItem(key,JSON.stringify(v))}catch(_e){}}
function doneSet(){return new Set(readJson(storeKey('done'),[]))}
function snoozeMap(){return readJson(storeKey('snooze'),{})}
function saveDone(set){writeJson(storeKey('done'),Array.from(set))}
function saveSnooze(map){writeJson(storeKey('snooze'),map)}
function sessionGone(){
  try{return new Set(JSON.parse(sessionStorage.getItem('p195Gone')||'[]'))}catch(_e){return new Set()}
}
function saveSessionGone(set){try{sessionStorage.setItem('p195Gone',JSON.stringify(Array.from(set)))}catch(_e){}}
function tomorrowEight(now=Date.now()){
  const d=new Date(now);d.setDate(d.getDate()+1);d.setHours(8,0,0,0);return d.getTime()
}
function toast(msg){
  try{if(typeof root.toast==='function'){root.toast(msg);return}}catch(_e){}
  const card=$('#p195Deck .p195-card');if(!card)return;
  let n=$('.p223-note',card);if(!n){n=document.createElement('div');n.className='p223-note';card.appendChild(n)}
  n.textContent=msg;clearTimeout(n._t);n._t=setTimeout(()=>n.remove(),2200)
}
function legacyFromParts(title,meta,detail){return norm([title,meta,detail].join('|'))}
function sourceRows(){
  const out=[];
  $$('#dashAttention .p56-task').forEach(el=>{
    const title=norm($('.p56-what',el)?.textContent)||norm($('.p56-who',el)?.textContent)||'item para resolver';
    const meta=[$('.p56-source',el)?.textContent,$('.p56-who',el)?.textContent,$('.p56-date',el)?.textContent].filter(Boolean).map(v=>String(v).replace(/\s+/g,' ').trim()).join(' · ');
    const detail=String($('.p56-detail',el)?.textContent||'').replace(/\s+/g,' ').trim();
    out.push({kind:'task',el,titleText:String($('.p56-what',el)?.textContent||$('.p56-who',el)?.textContent||'Item para resolver').replace(/\s+/g,' ').trim(),metaText:meta,detailText:detail,legacy:legacyFromParts(title,meta,detail)})
  });
  $$('#p78TodayCard .p78-row').forEach(el=>{
    const title=String($('.p78-main b',el)?.textContent||'Novidade').replace(/\s+/g,' ').trim();
    const meta=['Novidade',String($('.p78-tag',el)?.textContent||'').trim()].filter(Boolean).join(' · ');
    const detail=String($('.p78-main span',el)?.textContent||'').replace(/\s+/g,' ').trim();
    out.push({kind:'news',el,titleText:title,metaText:meta,detailText:detail,legacy:legacyFromParts(title,meta,detail)})
  });
  return out
}
function currentItem(){
  const card=$('#p195Deck .p195-card');if(!card||$('.p195-empty',card))return null;
  const title=String($('.p195-title',card)?.textContent||'').replace(/\s+/g,' ').trim();
  const meta=String($('.p195-meta',card)?.textContent||'').replace(/\s+/g,' ').trim();
  const detail=String($('.p195-detail',card)?.textContent||'').replace(/\s+/g,' ').trim();
  const legacy=legacyFromParts(title,meta,detail);
  const rows=sourceRows();
  let row=rows.find(x=>x.legacy===legacy);
  if(!row)row=rows.find(x=>norm(x.titleText)===norm(title)&&(!meta||norm(x.metaText)===norm(meta)));
  return row?{...row,legacy}: {kind:'card',el:null,titleText:title,metaText:meta,detailText:detail,legacy}
}
function stableTaskKey(item){
  const el=item?.el;if(!el||item.kind!=='task')return'';
  const data=String(el.dataset?.p69Key||'');if(data)return data;
  const withKey=$$('button[onclick*="p56OpenItem"]',el)[0];
  const m=String(withKey?.getAttribute('onclick')||'').match(/p56OpenItem\('([^']+)'\)/);if(m?.[1])return m[1];
  const src=norm($('.p56-source',el)?.textContent||''),title=norm($('.p56-what',el)?.textContent||'');
  if(src.includes('correcao')&&src.includes('repositorio')){
    try{
      const pubs=(root.CarbonautasApp?.state?.publicacoes||[]).filter(p=>p?.reviewFlow);
      const matches=pubs.filter(p=>[p.reviewBaseTitle,p.titulo,p.fileName].some(v=>norm(v)===title));
      if(matches.length){
        const p=matches.sort((a,b)=>Number(b.reviewVersion||1)-Number(a.reviewVersion||1))[0];
        const tid=(typeof root.repoReviewThreadId==='function'&&root.repoReviewThreadId(p))||p.reviewThreadId||p.reviewBaseId||p.id;
        if(tid)return `review:${tid}`
      }
    }catch(_e){}
  }
  return''
}
function addGone(key){if(!key)return;const s=sessionGone();s.add(key);saveSessionGone(s)}
function removeGone(key){if(!key)return;const s=sessionGone();if(s.delete(key))saveSessionGone(s)}
function poke(){
  const rootEl=$('#dashAttention');if(!rootEl)return;
  const c=document.createComment('p223-refresh');rootEl.appendChild(c);c.remove()
}
function markLocalDone(item){
  if(!item?.legacy)return false;
  const d=doneSet();d.add(item.legacy);saveDone(d);
  const s=snoozeMap();if(s[item.legacy]){delete s[item.legacy];saveSnooze(s)}
  addGone(item.legacy);poke();return true
}
function deferItem(item){
  if(!item?.legacy)return false;
  const s=snoozeMap();s[item.legacy]=tomorrowEight();saveSnooze(s);
  addGone(item.legacy);scheduleWake();poke();return true
}
function nativeDoneAction(item){
  if(!item?.el||item.kind!=='task')return null;
  const key=stableTaskKey(item);
  if(key.startsWith('activity:')&&typeof root.p56CompleteActivity==='function'){
    return async()=>{
      const id=key.slice(9);
      await root.p56CompleteActivity(id);
      setTimeout(()=>{
        try{
          const a=(root.CarbonautasApp?.state?.activities||[]).find(x=>String(x.id)===String(id));
          const st=norm(a?.status);if(!a||/conclu|feito|done|complet/.test(st)){markLocalDone(item);toast('✓ Feito. Não volta para esta caixa.')}
        }catch(_e){}
      },650)
    }
  }
  if(key.startsWith('review:')&&typeof root.p56AckItem==='function')return()=>{root.p56AckItem(key);markLocalDone(item);toast('✓ Feito. Não volta para esta caixa.')};
  const b=$$('.p56-task-actions button',item.el).find(x=>/concluir|já tratei|ja tratei|marcar resolvido|encerrar acompanhamento/i.test(x.textContent||''));
  if(b)return()=>{b.click();setTimeout(()=>{markLocalDone(item);toast('✓ Feito. Não volta para esta caixa.')},300)};
  return null
}
function clickBestAction(item){
  if(!item)return false;
  if(item.kind==='news'&&item.el){item.el.click();return true}
  if(item.kind==='task'&&item.el){
    const buttons=$$('.p56-task-actions button',item.el);
    const avoid=/concluir|já tratei|ja tratei|marcar resolvido|encerrar acompanhamento|feito/i;
    const priority=/corrigir agora|abrir para corrigir|abrir documento|abrir material|abrir ação|ver fluxo|preencher agora|pedir arquivo|pedir entrega|pedir dados|pedir informa|pedir preenchimento|pedir assinatura|pedir aprova|cobrar pend|perguntar andamento|combinar orienta|ver contexto|ver detalhes|abrir/i;
    const b=buttons.find(x=>priority.test(x.textContent||'')&&!avoid.test(x.textContent||''))||buttons.find(x=>!avoid.test(x.textContent||''));
    if(b){b.click();return true}
    const key=stableTaskKey(item);if(key&&typeof root.p56OpenItem==='function'){root.p56OpenItem(key);return true}
  }
  return false
}
function syncPersistent(){
  const id=actor();
  if(id!==lastActor){lastActor=id}
  const now=Date.now(),done=doneSet(),snooze=snoozeMap(),g=sessionGone();
  let changed=false,storeChanged=false,next=0;
  done.forEach(k=>{if(!g.has(k)){g.add(k);changed=true}});
  Object.keys(snooze).forEach(k=>{
    const until=Number(snooze[k])||0;
    if(until>now){
      if(!g.has(k)){g.add(k);changed=true}
      if(!next||until<next)next=until
    }else{
      delete snooze[k];storeChanged=true;
      if(!done.has(k)&&g.delete(k))changed=true
    }
  });
  if(storeChanged)saveSnooze(snooze);
  if(changed){saveSessionGone(g);poke()}
  scheduleWake(next)
}
function scheduleWake(explicit=0){
  clearTimeout(snoozeTimer);
  const s=snoozeMap(),now=Date.now();
  let next=explicit||0;
  if(!next)Object.values(s).forEach(v=>{const n=Number(v)||0;if(n>now&&(!next||n<next))next=n});
  if(next){snoozeTimer=setTimeout(()=>syncPersistent(),Math.min(2147480000,Math.max(250,next-now+80)))}
}
function css(){
  if(!hasDocument()||$('#p223HomeActionStyle'))return;
  const st=document.createElement('style');st.id='p223HomeActionStyle';st.textContent=`
  #p195Deck .p197-swipehint{display:none!important}
  #p195Deck .p223-done{background:#eaf8f1!important;border-color:#c7e9d8!important;color:#176c48!important}
  #p195Deck .p223-later{background:#fff8e9!important;border-color:#f0dfb9!important;color:#805d16!important}
  #p195Deck .p223-open{background:#0e6f78!important;border-color:#0e6f78!important;color:#fff!important;box-shadow:0 9px 22px rgba(14,111,120,.20)!important;padding-inline:18px!important}
  #p195Deck .p195-foot{gap:7px!important}
  #p195Deck .p223-note{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);z-index:20;padding:8px 12px;border-radius:999px;background:#173b45;color:#fff;font-size:11px;font-weight:800;box-shadow:0 10px 26px rgba(0,0,0,.16);white-space:nowrap}
  @media(max-width:700px){
    #p195Deck .p195-foot{display:grid!important;grid-template-columns:auto auto 1fr auto auto!important;align-items:center!important}
    #p195Deck .p195-count{grid-column:1/2!important;width:auto!important;margin:0!important}
    #p195Deck .p223-done{grid-column:2/3!important}
    #p195Deck .p223-later{grid-column:3/4!important}
    #p195Deck .p198-back{grid-column:4/5!important}
    #p195Deck .p195-btn[data-n]{grid-column:5/6!important}
    #p195Deck .p223-open{grid-column:1/-1!important;width:100%!important;justify-content:center!important;margin-top:4px!important;min-height:44px!important}
  }`;document.head.appendChild(st)
}
function patch(){
  const card=$('#p195Deck .p195-card');if(!card||$('.p195-empty',card))return false;
  const foot=$('.p195-foot',card);if(!foot)return false;
  let done=$('[data-p223-done]',foot);
  if(!done){done=document.createElement('button');done.type='button';done.className='p195-btn p223-done';done.dataset.p223Done='1';const later=$('[data-g]',foot);foot.insertBefore(done,later||foot.firstChild)}
  done.textContent='✓ Feito';done.title='Não mostrar novamente';done.setAttribute('aria-label','Marcar como feito e não mostrar novamente');
  const later=$('[data-g]',foot);if(later){later.textContent='⏰ Depois';later.classList.add('p223-later');later.title='Fazer depois — volta amanhã às 08h';later.setAttribute('aria-label','Fazer depois, mostrar novamente amanhã às oito')}
  const open=$('[data-o]',foot);if(open){open.textContent='Abrir e resolver';open.classList.add('p223-open');open.title='Ir direto ao ponto que precisa ser resolvido';open.setAttribute('aria-label','Abrir e resolver este item')}
  done.onclick=async e=>{e.preventDefault();e.stopPropagation();const item=currentItem();if(!item)return;const native=nativeDoneAction(item);if(native){await native()}else{markLocalDone(item);toast('✓ Feito. Não volta para esta caixa.')}};
  if(later)later.onclick=e=>{e.preventDefault();e.stopPropagation();const item=currentItem();if(!item)return;deferItem(item);toast('⏰ Guardado. Volta amanhã às 08h.')};
  if(open)open.onclick=e=>{e.preventDefault();e.stopPropagation();const item=currentItem();if(!clickBestAction(item))toast('Não encontrei uma ação direta para este item.')};
  return true
}
function boot(){
  if(!hasDocument())return;
  css();syncPersistent();patch();
  const host=$('#viewPainel')||document.body;
  observer=new MutationObserver(()=>{syncPersistent();patch()});observer.observe(host,{childList:true,subtree:true,characterData:true});
  clearInterval(actorTimer);let n=0;actorTimer=setInterval(()=>{syncPersistent();patch();if(++n>60&&actor()!=='anon')clearInterval(actorTimer)},500);
}
const api={norm,tomorrowEight,legacyFromParts,stableTaskKey,currentItem,markLocalDone,deferItem,clickBestAction,syncPersistent,patch};
if(hasDocument()){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot()}
return api;
});