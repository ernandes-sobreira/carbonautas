/* Carbonautas P182 · Mural em cards iguais + leitura ampliada por swipe
   - corrige a faixa de filtros cortada no celular
   - cards do Mural passam a ter tamanho uniforme
   - textos longos ficam resumidos com reticências no card
   - tocar no card abre uma ficha grande que sobe da base
   - na ficha grande é possível deslizar para a próxima/anterior publicação
   - mantém imagens, links e anexos acessíveis na ficha ampliada
   - não altera Firebase nem VPS
*/
(function(){
'use strict';
if(window.__CARBONAUTAS_P182_MURAL_CARDS)return;
window.__CARBONAUTAS_P182_MURAL_CARDS=true;

const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
let queued=false,mo=null,deckPosts=[],deckIndex=0,scrollTimer=0;

function S(){try{return window.state||state||{}}catch(_e){return{}}}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function ms(p){try{return p?.ts?.toMillis?p.ts.toMillis():(p?.ts?.seconds?Number(p.ts.seconds)*1000:+new Date(p?.ts||0)||0)}catch(_e){return 0}}
function fmtDateTime(p){
 const d=ms(p)?new Date(ms(p)):null;
 const base=d&&!Number.isNaN(d.getTime())?d.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'';
 const action=p?.actionDate?`${p.actionDate.split('-').reverse().join('/')}${p.actionTime?' · '+p.actionTime:''}`:'';
 return action||base
}
function kindMeta(kind=''){
 const k=String(kind||'').toLowerCase();
 if(k.includes('ajuda'))return['🆘','Pedido de ajuda'];
 if(k.includes('alert')||k.includes('atent')||k.includes('urg'))return['⚠️','Pessoal, se atente a isso'];
 if(k.includes('ideia')||k.includes('proposta'))return['💡','Ideia / proposta'];
 if(k.includes('humor')||k.includes('piada'))return['😂','Humor'];
 if(k.includes('resultado')||k.includes('conquista'))return['🏆','Resultado'];
 return['📣','Mural']
}
function initials(name=''){return String(name).trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'C'}
function isImagePost(p){return !!p?.fileUrl&&(String(p.mime||p.mimeType||'').startsWith('image/')||/\.(png|jpe?g|webp|gif)(\?|$)/i.test(String(p.fileName||p.fileUrl||'')))}
function safeUrl(v){const s=String(v||'').trim();return /^https?:\/\//i.test(s)?s:''}
function postById(id){return (S().feed||[]).find(p=>String(p.id)===String(id))||null}

function css(){
 if($('#p182Style'))return;
 const st=document.createElement('style');st.id='p182Style';st.textContent=`
 body.p182-deck-open{overflow:hidden!important}
 /* barra de tipos: nunca mais cortada/espremida */
 #viewMural .p182-kindbar-shell{position:relative!important;height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;background:#f7fbfa!important;z-index:3!important}
 #viewMural .p182-kindbar{display:flex!important;align-items:center!important;gap:7px!important;width:100%!important;height:auto!important;min-height:44px!important;max-height:none!important;overflow-x:auto!important;overflow-y:hidden!important;padding:6px 14px 9px!important;margin:0!important;white-space:nowrap!important;scrollbar-width:none!important;-webkit-overflow-scrolling:touch!important;background:#f7fbfa!important}
 #viewMural .p182-kindbar::-webkit-scrollbar{display:none!important}
 #viewMural .p182-kindbar>*{flex:0 0 auto!important;opacity:1!important;transform:none!important;position:relative!important;top:auto!important;bottom:auto!important}
 /* cards compactos, todos exatamente do mesmo tamanho */
 #viewMural .p177-post-rail{align-items:stretch!important;min-height:365px!important}
 #viewMural .p177-post-rail>.mural-post.p182-compact{height:352px!important;min-height:352px!important;max-height:352px!important;overflow:hidden!important;display:block!important;padding:0!important;background:#fff!important;border-radius:18px!important}
 #viewMural .mural-post.p182-compact>:not(.p182-card-shell){display:none!important}
 .p182-card-shell{height:100%;display:flex;flex-direction:column;background:#fff;color:#173b47;cursor:pointer;overflow:hidden;border-radius:inherit}
 .p182-c-head{display:grid;grid-template-columns:38px minmax(0,1fr) auto;gap:8px;align-items:center;padding:11px 12px 8px}
 .p182-c-avatar{width:38px;height:38px;border-radius:12px;overflow:hidden;background:#e3f0ee;display:grid;place-items:center;font-size:11px;font-weight:950;color:#23656b}.p182-c-avatar img{width:100%;height:100%;object-fit:cover}
 .p182-c-who{min-width:0}.p182-c-name{font-size:10px;line-height:1.15;font-weight:950;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.p182-c-time{font-size:7.5px;color:#829398;margin-top:3px}
 .p182-c-kind{max-width:116px;border-radius:999px;background:#f4f1ff;color:#5e538e;padding:6px 8px;font-size:7.5px;font-weight:900;line-height:1.1;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 .p182-c-media{height:103px;min-height:103px;margin:0 11px;border-radius:13px;overflow:hidden;background:linear-gradient(145deg,#eef8f6,#f8f3ff);display:grid;place-items:center;color:#51747b}
 .p182-c-media img{width:100%;height:100%;object-fit:cover;display:block}.p182-c-media .p182-c-symbol{font-size:30px;line-height:1}.p182-c-media small{display:block;margin-top:4px;font-size:8px;font-weight:850}
 .p182-c-copy{padding:10px 12px 0;min-height:0;flex:1}.p182-c-title{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;font-size:14px;line-height:1.16;font-weight:950;color:#173b47;min-height:32px}.p182-c-text{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden;margin-top:6px;font-size:10.5px;line-height:1.32;color:#49636a;min-height:41px}
 .p182-c-foot{margin-top:auto;padding:8px 12px 11px;display:flex;align-items:center;gap:7px;border-top:1px solid #edf2f1}.p182-c-react{min-width:0;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:8px;color:#7c8d92}.p182-c-open{flex:0 0 auto;font-size:8px;font-weight:950;color:#168f94}
 /* ficha ampliada que sobe da base */
 #p182MuralDeck{position:fixed;inset:0;z-index:2147483640;background:rgba(8,27,34,.62);display:none;align-items:flex-end;justify-content:center;padding:0}
 #p182MuralDeck.open{display:flex}.p182-deck-panel{width:min(760px,100%);height:min(91dvh,900px);background:#f7fbfa;border-radius:25px 25px 0 0;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 -24px 80px rgba(0,0,0,.22);transform:translateY(28px);opacity:.5;transition:transform .2s ease,opacity .2s ease}.open .p182-deck-panel{transform:none;opacity:1}
 .p182-deck-head{flex:0 0 auto;display:grid;grid-template-columns:42px 1fr 42px;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #dde8e6;background:#fff}.p182-deck-close,.p182-deck-arrow{width:42px;height:42px;border:1px solid #d5e3e0;background:#fff;border-radius:12px;color:#31545c;font-size:18px;font-weight:900}.p182-deck-count{text-align:center;font-size:10px;font-weight:900;color:#678087}.p182-deck-hint{text-align:center;font-size:8px;color:#8a9a9f;margin-top:2px}
 .p182-deck-rail{flex:1;min-height:0;display:flex;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;scroll-behavior:smooth;overscroll-behavior-x:contain;scrollbar-width:none;-webkit-overflow-scrolling:touch}.p182-deck-rail::-webkit-scrollbar{display:none}
 .p182-detail{flex:0 0 100%;width:100%;height:100%;scroll-snap-align:start;overflow-y:auto;padding:14px 14px calc(28px + env(safe-area-inset-bottom,0px));-webkit-overflow-scrolling:touch}
 .p182-detail-card{max-width:620px;margin:0 auto;background:#fff;border:1px solid #dbe7e4;border-radius:20px;overflow:hidden;box-shadow:0 7px 26px rgba(20,61,66,.07)}
 .p182-d-head{display:flex;gap:10px;align-items:center;padding:14px}.p182-d-avatar{width:48px;height:48px;border-radius:14px;overflow:hidden;background:#e3f0ee;display:grid;place-items:center;font-weight:950;color:#23656b}.p182-d-avatar img{width:100%;height:100%;object-fit:cover}.p182-d-meta{flex:1;min-width:0}.p182-d-name{font-size:13px;font-weight:950;color:#173b47}.p182-d-time{font-size:9px;color:#809196;margin-top:3px}.p182-d-kind{border-radius:999px;background:#f4f1ff;color:#5e538e;padding:7px 9px;font-size:8px;font-weight:900;max-width:150px;text-align:center}
 .p182-d-image{display:block;width:100%;max-height:46dvh;object-fit:contain;background:#eef5f3;border-top:1px solid #e1ebe9;border-bottom:1px solid #e1ebe9}.p182-d-body{padding:16px}.p182-d-title{font-size:22px;line-height:1.13;font-weight:950;color:#173b47;margin:0}.p182-d-text{font-size:15px;line-height:1.48;color:#324f57;margin-top:12px;white-space:pre-wrap;overflow-wrap:anywhere}.p182-d-actions{display:grid;gap:8px;margin-top:16px}.p182-d-actions a{display:flex;align-items:center;justify-content:center;min-height:46px;border:1px solid #d4e3df;border-radius:12px;background:#f7fbfa;color:#245d64;text-decoration:none;font-size:11px;font-weight:900}.p182-d-react{margin-top:16px;padding-top:13px;border-top:1px solid #e8efed;font-size:10px;color:#71858b}
 @media(max-width:760px){
  #viewMural .p177-post-rail{min-height:352px!important}
  #viewMural .p177-post-rail>.mural-post.p182-compact{flex-basis:82vw!important;width:82vw!important;height:338px!important;min-height:338px!important;max-height:338px!important}
  .p182-c-media{height:94px;min-height:94px}.p182-c-title{font-size:13px}.p182-c-text{font-size:10px}
  .p182-deck-panel{height:91dvh;border-radius:22px 22px 0 0}.p182-detail{padding:10px 10px calc(24px + env(safe-area-inset-bottom,0px))}.p182-d-title{font-size:20px}.p182-d-text{font-size:14px}
 }
 `;document.head.appendChild(st)
}

function reactionSummary(card){
 if(card.dataset.p182Reacts)return card.dataset.p182Reacts;
 const raw=String(card.innerText||'').replace(/\s+/g,' '),parts=[];
 [['👍','Topizera'],['💙','Qui linduuu'],['🎉','Agó'],['🤨','çei não']].forEach(([em,l])=>{const re=new RegExp(l.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'[^0-9]{0,18}(\\d+)','i'),m=raw.match(re);if(m&&Number(m[1])>0)parts.push(em+' '+m[1])});
 card.dataset.p182Reacts=parts.join(' · ')||'Toque para ler tudo';return card.dataset.p182Reacts
}
function compactHtml(p,card){
 const [icon,label]=kindMeta(p?.kind),time=fmtDateTime(p),img=isImagePost(p)?safeUrl(p.fileUrl):'',photo=safeUrl(p?.authorFoto),title=p?.title||label,text=p?.text||'',react=reactionSummary(card);
 return `<div class="p182-card-shell" role="button" tabindex="0" aria-label="Abrir publicação: ${esc(title)}">
  <div class="p182-c-head"><div class="p182-c-avatar">${photo?`<img src="${esc(photo)}" alt="">`:esc(initials(p?.authorName||''))}</div><div class="p182-c-who"><div class="p182-c-name">${esc(p?.authorName||'Carbonauta')}</div><div class="p182-c-time">${esc(time)}</div></div><div class="p182-c-kind">${icon} ${esc(label)}</div></div>
  <div class="p182-c-media">${img?`<img src="${esc(img)}" alt="Imagem da publicação" loading="lazy">`:`<div style="text-align:center"><span class="p182-c-symbol">${icon}</span><small>${esc(label)}</small></div>`}</div>
  <div class="p182-c-copy"><div class="p182-c-title">${esc(title)}</div><div class="p182-c-text">${esc(text||'Sem texto adicional.')}</div></div>
  <div class="p182-c-foot"><span class="p182-c-react">${esc(react)}</span><span class="p182-c-open">Abrir ↗</span></div>
 </div>`
}
function decorateCards(){
 const cards=$$('#muralMsgs article.feed-card[data-mural-type="post"]');
 cards.forEach(card=>{
  const p=postById(card.dataset.muralId);if(!p)return;
  let shell=card.querySelector(':scope > .p182-card-shell');
  if(!shell){card.insertAdjacentHTML('beforeend',compactHtml(p,card));shell=card.querySelector(':scope > .p182-card-shell')}
  card.classList.add('p182-compact');
  shell.onclick=e=>{e.preventDefault();e.stopPropagation();openDeck(String(p.id))};
  shell.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openDeck(String(p.id))}}
 })
}

function fixKindBar(){
 const view=$('#viewMural');if(!view)return;
 const nodes=$$('button,[role="button"]',view).filter(el=>/^(tudo|.*ajuda|.*alerta|.*ideia|.*humor|.*piada)/i.test(String(el.textContent||'').trim()));
 if(nodes.length<3)return;
 const counts=new Map();nodes.forEach(n=>{const p=n.parentElement;if(p)counts.set(p,(counts.get(p)||0)+1)});
 const parent=[...counts.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0];if(!parent)return;
 parent.classList.add('p182-kindbar');
 if(parent.parentElement&&parent.parentElement!==view)parent.parentElement.classList.add('p182-kindbar-shell')
}

function orderedPosts(){
 const seen=new Set(),arr=[];
 $$('#muralMsgs .p177-post-rail article.feed-card[data-mural-type="post"],#muralMsgs article.feed-card[data-mural-type="post"]').forEach(card=>{const id=String(card.dataset.muralId||'');if(!id||seen.has(id))return;const p=postById(id);if(p){seen.add(id);arr.push(p)}});
 if(arr.length)return arr;
 return [...(S().feed||[])].sort((a,b)=>ms(b)-ms(a))
}
function detailHtml(p){
 const [icon,label]=kindMeta(p?.kind),photo=safeUrl(p?.authorFoto),img=isImagePost(p)?safeUrl(p.fileUrl):'',url=safeUrl(p?.externalUrl),file=!img?safeUrl(p?.fileUrl):'',title=p?.title||label,text=p?.text||'',time=fmtDateTime(p);
 return `<section class="p182-detail" data-p182-id="${esc(p.id)}"><article class="p182-detail-card">
  <div class="p182-d-head"><div class="p182-d-avatar">${photo?`<img src="${esc(photo)}" alt="">`:esc(initials(p?.authorName||''))}</div><div class="p182-d-meta"><div class="p182-d-name">${esc(p?.authorName||'Carbonauta')}</div><div class="p182-d-time">${esc(time)}</div></div><div class="p182-d-kind">${icon} ${esc(label)}</div></div>
  ${img?`<img class="p182-d-image" src="${esc(img)}" alt="Imagem da publicação">`:''}
  <div class="p182-d-body"><h2 class="p182-d-title">${esc(title)}</h2>${text?`<div class="p182-d-text">${esc(text)}</div>`:''}<div class="p182-d-actions">${url?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">🔗 Abrir link relacionado</a>`:''}${file?`<a href="${esc(file)}" target="_blank" rel="noopener noreferrer">📎 Abrir ${esc(p?.fileName||'arquivo')}</a>`:''}</div><div class="p182-d-react">${esc(reactionSummary(document.querySelector(`[data-mural-id="${window.CSS?.escape?window.CSS.escape(String(p.id)):String(p.id)}"]`)||document.createElement('div')))}</div></div>
 </article></section>`
}
function ensureDeck(){
 let ov=$('#p182MuralDeck');if(ov)return ov;
 ov=document.createElement('div');ov.id='p182MuralDeck';ov.innerHTML=`<div class="p182-deck-panel"><div class="p182-deck-head"><button type="button" class="p182-deck-close" aria-label="Fechar">×</button><div><div class="p182-deck-count">1 de 1</div><div class="p182-deck-hint">Deslize para ver outra publicação</div></div><button type="button" class="p182-deck-arrow" aria-label="Próxima">›</button></div><div class="p182-deck-rail"></div></div>`;document.body.appendChild(ov);
 $('.p182-deck-close',ov).onclick=closeDeck;$('.p182-deck-arrow',ov).onclick=()=>goDeck(deckIndex+1);
 ov.onclick=e=>{if(e.target===ov)closeDeck()};
 $('.p182-deck-rail',ov).addEventListener('scroll',()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(syncDeckIndex,90)},{passive:true});
 return ov
}
function syncDeckIndex(){const rail=$('#p182MuralDeck .p182-deck-rail');if(!rail||!rail.clientWidth)return;deckIndex=Math.max(0,Math.min(deckPosts.length-1,Math.round(rail.scrollLeft/rail.clientWidth)));updateDeckHeader()}
function updateDeckHeader(){const ov=$('#p182MuralDeck'),count=$('.p182-deck-count',ov),next=$('.p182-deck-arrow',ov);if(count)count.textContent=deckPosts.length?`${deckIndex+1} de ${deckPosts.length}`:'0 de 0';if(next){next.textContent=deckIndex>=deckPosts.length-1?'‹':'›';next.onclick=()=>goDeck(deckIndex>=deckPosts.length-1?deckIndex-1:deckIndex+1)}}
function goDeck(i){const rail=$('#p182MuralDeck .p182-deck-rail');if(!rail||!deckPosts.length)return;deckIndex=Math.max(0,Math.min(deckPosts.length-1,i));rail.scrollTo({left:deckIndex*rail.clientWidth,behavior:'smooth'});updateDeckHeader()}
function openDeck(id){
 const ov=ensureDeck(),rail=$('.p182-deck-rail',ov);deckPosts=orderedPosts();deckIndex=Math.max(0,deckPosts.findIndex(p=>String(p.id)===String(id)));rail.innerHTML=deckPosts.map(detailHtml).join('');ov.classList.add('open');document.body.classList.add('p182-deck-open');updateDeckHeader();requestAnimationFrame(()=>rail.scrollTo({left:deckIndex*rail.clientWidth,behavior:'auto'}))
}
function closeDeck(){$('#p182MuralDeck')?.classList.remove('open');document.body.classList.remove('p182-deck-open')}

function decorate(){if(!['mural','feed'].includes(document.body?.dataset?.view||''))return;fixKindBar();decorateCards();observe()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;decorate()})}
function observe(){const box=$('#muralMsgs');if(!box||box.dataset.p182Observed==='1')return;box.dataset.p182Observed='1';mo=new MutationObserver(schedule);mo.observe(box,{childList:true,subtree:true})}
function bind(){
 if(document.documentElement.dataset.p182Bound==='1')return;document.documentElement.dataset.p182Bound='1';
 new MutationObserver(ms=>{if(ms.some(m=>m.attributeName==='data-view'))schedule()}).observe(document.body,{attributes:true,attributeFilter:['data-view']});
 window.addEventListener('resize',schedule,{passive:true});
 document.addEventListener('keydown',e=>{if(!$('#p182MuralDeck')?.classList.contains('open'))return;if(e.key==='Escape')closeDeck();if(e.key==='ArrowRight')goDeck(deckIndex+1);if(e.key==='ArrowLeft')goDeck(deckIndex-1)})
}
function boot(){css();bind();observe();schedule();setTimeout(schedule,180);setTimeout(schedule,650)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
