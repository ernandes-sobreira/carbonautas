/* Carbonautas P123 · Reações nos Destaques do mês.
   Uma reação por pessoa em cada destaque: 🤯 Wowww, 👍 Joinha ou 💓 Coração.
   Reutiliza rede_feed_reactions, que já possui regras próprias por usuário. */
(function(){
'use strict';
const BUILD='P123';
const TYPES={
  wow:{emoji:'🤯',label:'Wowww'},
  like:{emoji:'👍',label:'Joinha'},
  heart:{emoji:'💓',label:'Coração'}
};
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
let reactions=[],unsub=null,renderQueued=false,panelObserver=null,pending=new Set();

function F(){return window.fbFns||null}
function uid(){return window.auth?.currentUser?.uid||''}
function memberId(){try{return myId||''}catch(_e){return''}}
function memberName(){try{return myName||''}catch(_e){return''}}
function toastMsg(t){try{if(typeof toast==='function')return toast(t)}catch(_e){};window.toast?.(t)}
function safePart(v=''){return String(v).replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,180)}
function docId(highlightId,userUid){return `hl_${safePart(highlightId)}_${safePart(userUid)}`}
function mine(highlightId){const u=uid();return reactions.find(r=>r.targetId===highlightId&&r.actorUid===u)||null}
function count(highlightId,type){return reactions.filter(r=>r.targetId===highlightId&&r.reaction===type).length}

function ensureCss(){
  if($('#p123HighlightReactionStyle'))return;
  const st=document.createElement('style');st.id='p123HighlightReactionStyle';st.textContent=`
    .p123-reactions{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:2px;padding-top:7px;border-top:1px solid #edf2f1}
    .p123-react{min-height:34px;border:1px solid #dbe6e4;background:#fff;border-radius:999px;padding:6px 9px;display:inline-flex;align-items:center;gap:5px;color:#536b71;font:800 9.5px/1 'Inter',system-ui,sans-serif;box-shadow:0 2px 8px rgba(28,67,70,.035);transition:transform .14s ease,background .14s ease,border-color .14s ease,box-shadow .14s ease;white-space:nowrap}
    .p123-react .em{font-size:15px;line-height:1}.p123-react .n{min-width:9px;text-align:center;color:#829397;font-weight:900}
    .p123-react:hover{transform:translateY(-1px);border-color:#bfd5d1}
    .p123-react.on{background:#edf8f5;border-color:#83c8bb;color:#145f59;box-shadow:0 4px 12px rgba(22,114,104,.09)}
    .p123-react[data-r="wow"].on{background:#fff7e6;border-color:#e6c878;color:#7b5a0c}
    .p123-react[data-r="heart"].on{background:#fff0f4;border-color:#e6a2b6;color:#9b3555}
    .p123-react:active{transform:scale(.94)}
    .p123-react.p123-pop .em{animation:p123Pop .34s cubic-bezier(.18,.8,.25,1.3)}
    @keyframes p123Pop{0%{transform:scale(.72) rotate(-8deg)}55%{transform:scale(1.32) rotate(5deg)}100%{transform:scale(1) rotate(0)}}
    @media(max-width:620px){.p123-reactions{gap:5px}.p123-react{padding:6px 8px;font-size:9px;min-height:33px}.p123-react .em{font-size:16px}}
  `;document.head.appendChild(st);
}

function rowHtml(highlightId){
  const own=mine(highlightId)?.reaction||'';
  return Object.entries(TYPES).map(([key,t])=>{
    const n=count(highlightId,key),on=own===key;
    return `<button type="button" class="p123-react${on?' on':''}" data-r="${key}" data-highlight-id="${highlightId}" aria-pressed="${on?'true':'false'}" title="${t.label}"><span class="em">${t.emoji}</span><span>${t.label}</span><span class="n">${n||''}</span></button>`;
  }).join('');
}

function decorateCard(card){
  const id=card?.dataset?.p117Card||'';if(!id)return;
  const body=card.querySelector('.p117-body');if(!body)return;
  let row=body.querySelector('.p123-reactions');
  if(!row){row=document.createElement('div');row.className='p123-reactions';const actions=body.querySelector('.p117-card-actions');if(actions)actions.insertAdjacentElement('beforebegin',row);else body.appendChild(row)}
  const own=mine(id)?.reaction||'';
  const sig=`${own}|${count(id,'wow')}|${count(id,'like')}|${count(id,'heart')}`;
  if(row.dataset.sig===sig)return;
  row.dataset.sig=sig;row.innerHTML=rowHtml(id);
}
function render(){ensureCss();$$('#p117Highlights .p117-card[data-p117-card]').forEach(decorateCard)}
function scheduleRender(){if(renderQueued)return;renderQueued=true;requestAnimationFrame(()=>{renderQueued=false;render()})}

async function toggle(highlightId,type,button){
  if(!TYPES[type]||!highlightId)return;
  const f=F(),u=uid();if(!f||!window.db||!u)return toastMsg('Entre na sua conta para reagir.');
  const key=`${highlightId}|${u}`;if(pending.has(key))return;pending.add(key);
  button?.classList.add('p123-pop');setTimeout(()=>button?.classList.remove('p123-pop'),380);
  const existing=mine(highlightId);const ref=f.doc(window.db,'rede_feed_reactions',existing?.id||docId(highlightId,u));
  try{
    if(existing?.reaction===type){
      await f.deleteDoc(ref);
    }else{
      await f.setDoc(ref,{
        actorUid:u,
        actorMemberId:memberId(),
        actorName:memberName(),
        targetType:'highlight',
        targetId:highlightId,
        reaction:type,
        updatedAt:f.serverTimestamp()
      },{merge:true});
    }
  }catch(e){console.error('P123 reação em destaque',e);toastMsg('Não consegui registrar sua reação. Tente novamente.')}finally{pending.delete(key)}
}

function bindClicks(){
  if(document.documentElement.dataset.p123HighlightReactionClicks==='1')return;
  document.documentElement.dataset.p123HighlightReactionClicks='1';
  document.addEventListener('click',e=>{
    const b=e.target.closest?.('.p123-react');if(!b)return;
    e.preventDefault();e.stopPropagation();toggle(b.dataset.highlightId||'',b.dataset.r||'',b);
  });
}

function watchPanel(){
  const host=$('#p117Highlights');
  if(!host){setTimeout(watchPanel,300);return}
  if(panelObserver)return;
  panelObserver=new MutationObserver(muts=>{
    if(muts.some(m=>m.addedNodes?.length||m.removedNodes?.length))scheduleRender();
  });
  panelObserver.observe(host,{childList:true,subtree:true});scheduleRender();
}

function subscribe(){
  const f=F();if(!f||!window.db)return false;
  try{
    unsub?.();
    unsub=f.onSnapshot(f.collection(window.db,'rede_feed_reactions'),snap=>{
      reactions=snap.docs.map(d=>({id:d.id,...d.data()})).filter(r=>r.targetType==='highlight'&&r.targetId&&TYPES[r.reaction]);
      scheduleRender();
    },e=>console.warn('P123 reactions snapshot',e));
    return true;
  }catch(e){console.warn('P123 subscribe',e);return false}
}

function boot(){
  ensureCss();bindClicks();watchPanel();
  let tries=0;const wait=()=>{
    if(subscribe()){window.CARBONAUTAS_HIGHLIGHT_REACTIONS_BUILD=BUILD;console.info('Carbonautas P123 · reações nos Destaques ativas');return}
    if(tries++<60)setTimeout(wait,250);
  };wait();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
