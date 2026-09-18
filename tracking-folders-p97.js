/* Carbonautas P97 · acompanhamento em pastas + baralho flutuante + grafo estável */
(function(){
'use strict';

const BUILD='P97';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const esc97=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const palette=[
  ['#EAF6EF','#B9DEC9','#2F7D5A'],
  ['#EAF4FA','#BDD8E7','#2A7FA8'],
  ['#F3EEFB','#D8C9ED','#7659B2'],
  ['#FBF3E7','#E8D2AF','#A66F24'],
  ['#FCEFF2','#EAC7D0','#B95870'],
  ['#E9F7F5','#B8DDD8','#238A84'],
  ['#FCF7E5','#E7D99D','#9B7D16'],
  ['#F0F5F4','#CBDDD8','#547D78']
];

let deckMemberId='',deckCardIndex=0,deckCards=[],deckTouch=null,deckAnimating=false;
let trackWrapped=false,focusWrapped=false,graphWrapped=false,lastGraphSig='',graphStopTimer=null;
let folderState={q:'',type:'',status:'',sort:'az'};

function appState(){try{return state}catch(_e){return null}}
function isCoord(){try{return !!isAdmin}catch(_e){return false}}
function meId(){try{return myId||''}catch(_e){return''}}
function memberCanEdit(id){try{return typeof canEditMember==='function'?!!canEditMember(id):(isCoord()||meId()===id)}catch(_e){return isCoord()||meId()===id}}
function call(name,...args){try{const fn=window[name]||(typeof globalThis[name]==='function'?globalThis[name]:null);if(typeof fn==='function')return fn(...args)}catch(e){console.warn('P97 ação',name,e)}}
function hash(s=''){let h=0;for(const c of s)h=((h<<5)-h)+c.charCodeAt(0)|0;return Math.abs(h)}
function colorsFor(name){return palette[hash(norm(name))%palette.length]}
function fmtDate(v){
  if(!v)return'—';
  try{
    const s=String(v);
    if(/^\d{4}-\d{2}-\d{2}$/.test(s)){const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'})}
    const d=new Date(v);return Number.isFinite(+d)?d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'}):s;
  }catch(_e){return String(v)}
}
function millis(v){try{if(!v)return 0;if(typeof v.toMillis==='function')return v.toMillis();if(typeof v.seconds==='number')return v.seconds*1000;const n=+new Date(v);return Number.isFinite(n)?n:0}catch(_e){return 0}}
function memberLevel(m){
  try{const x=NIVEIS?.[m.nivel];return x?.label||x?.short||m.nivel||'Carbonauta'}catch(_e){return m.nivel||'Carbonauta'}
}
function initials97(name){return String(name||'?').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'?'}
function activityDone(a){return ['concluido','aprovado','feito'].includes(norm(a?.status))||Number(a?.progress)>=100}
function overdue(a){
  if(activityDone(a)||!a?.dueDate)return false;
  const d=new Date(String(a.dueDate)+'T23:59:59');return Number.isFinite(+d)&&d.getTime()<Date.now();
}
function dueDiff(a){
  if(!a?.dueDate)return null;
  const d=new Date(String(a.dueDate)+'T00:00:00'),n=new Date();n.setHours(0,0,0,0);
  return Number.isFinite(+d)?Math.round((d-n)/86400000):null;
}
function actsFor(id){const s=appState();return (s?.activities||[]).filter(a=>a.ownerId===id)}
function healthFor(m){
  try{if(typeof memberHealth==='function')return memberHealth(m)}catch(_e){}
  const acts=actsFor(m.id);let p=0,reasons=[];
  const late=acts.filter(overdue);if(late.length){p+=4;reasons.push(`${late.length} item(ns) atrasado(s)`)}
  const corr=acts.filter(a=>a.type==='correcao'&&!activityDone(a));if(corr.length){p+=2;reasons.push(`${corr.length} correção(ões) pendente(s)`)}
  const soon=acts.filter(a=>{const d=dueDiff(a);return !activityDone(a)&&d!==null&&d>=0&&d<=14});if(soon.length){p+=2;reasons.push(`${soon.length} prazo(s) em até 14 dias`)}
  if(!(m.perguntaCientifica||'').trim()){p+=1;reasons.push('pergunta científica não preenchida')}
  return {level:p>=4?'red':p>=2?'yellow':'green',reasons:reasons.length?reasons:['em dia']};
}
function healthLabel(h){return h.level==='red'?'Intervir':h.level==='yellow'?'Atenção':'Em dia'}
function healthClass(h){return h.level==='red'?'bad':h.level==='yellow'?'warn':'good'}
function statusCounts(m){
  const acts=actsFor(m.id),open=acts.filter(a=>!activityDone(a)),late=open.filter(overdue),corr=open.filter(a=>a.type==='correcao');
  const soon=open.filter(a=>{const d=dueDiff(a);return d!==null&&d>=0&&d<=30});
  return {all:acts.length,open:open.length,late:late.length,corr:corr.length,soon:soon.length};
}
function typeLabel(a){const map={bolsa:'Bolsa',mestrado:'Mestrado',doutorado:'Doutorado',tcc:'TCC',orientacao:'Orientação',correcao:'Correção',qualificacao:'Qualificação',defesa:'Defesa',entrega:'Entrega / prazo',pendencia:'Pendência',checkin:'Check-in',produto:'Produto / entrega',outro:'Outro'};return map[a?.type]||a?.type||'Acompanhamento'}
function statusLabel(a){const map={planejado:'Planejado',afazer:'A fazer',andamento:'Em andamento',recebido:'Orientador recebeu',revisao:'Em correção / revisão',devolvido:'Correção devolvida',revisando:'Aluno revisando',aprovado:'Aprovado',concluido:'Concluído',pausado:'Pausado'};return map[a?.status]||a?.status||''}
function iconFor(type){return ({bolsa:'🎓',mestrado:'📘',doutorado:'📚',tcc:'📝',orientacao:'🧭',correcao:'✍️',qualificacao:'🎯',defesa:'🎓',entrega:'📌',pendencia:'⚠️',checkin:'🗓',produto:'🎯'})[type]||'•'}

function injectCss(){
  if($('#p97Style'))return;
  const st=document.createElement('style');st.id='p97Style';st.textContent=`
  #viewTrack .view-head,#viewTrack #trackKpis,#viewTrack .crono-filters,#viewTrack #trackGrid,#viewTrack #trackEmpty{display:none!important}
  #viewTrack .track-wrap{width:min(1120px,100%)!important;max-width:1120px!important;padding:12px 18px 120px!important}
  #p97Folders{display:block;width:100%;margin:0 auto}
  .p97-hero{display:flex;gap:14px;align-items:end;justify-content:space-between;margin:4px 0 14px}
  .p97-hero h2{margin:0;font-family:'Fraunces',serif;font-size:clamp(28px,4vw,42px);letter-spacing:-.03em;color:#183844}
  .p97-hero p{margin:4px 0 0;color:#71868d;font-size:13px}
  .p97-actionline{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.p97-actionline button{border:1px solid #d6e2e2;background:#fff;color:#24444e;border-radius:14px;padding:10px 13px;font-weight:850;box-shadow:0 5px 18px rgba(21,55,66,.04)}.p97-actionline .primary{background:#168f94;color:#fff;border-color:#168f94}
  .p97-toolbar{display:grid;grid-template-columns:minmax(220px,1.5fr) minmax(140px,.7fr) minmax(140px,.7fr);gap:8px;margin-bottom:10px}
  .p97-field{min-height:48px;display:flex;align-items:center;gap:8px;padding:0 13px;background:#fff;border:1px solid #d5e2e2;border-radius:16px;box-shadow:0 7px 20px rgba(21,55,66,.04)}
  .p97-field span{font-size:18px;color:#6f858d}.p97-field input,.p97-field select{width:100%;min-width:0;border:0;outline:0;background:transparent;color:#1d3d48;font:750 13px Inter,system-ui;padding:13px 0}
  .p97-sort{display:flex;gap:7px;overflow:auto;padding:2px 1px 12px;scrollbar-width:none}.p97-sort::-webkit-scrollbar{display:none}.p97-sort button{border:1px solid #d6e2e2;background:#fff;color:#587078;border-radius:999px;padding:8px 13px;font-weight:850;white-space:nowrap}.p97-sort button.on{background:#168f94;color:#fff;border-color:#168f94}
  .p97-folder-count{margin-left:auto;align-self:center;color:#73888e;font-size:11px;font-weight:800;white-space:nowrap;padding:8px 4px}
  .p97-folder-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px 14px}
  .p97-folder{--soft:#eff8f6;--border:#c7dfd8;--accent:#2f7d5a;position:relative;min-height:155px;border:1px solid var(--border);border-radius:0 24px 24px 24px;background:linear-gradient(145deg,var(--soft),#fff 65%);box-shadow:0 16px 38px rgba(21,55,66,.08);padding:23px 18px 16px;cursor:pointer;transition:transform .18s ease,box-shadow .18s ease;overflow:visible;text-align:left}
  .p97-folder:before{content:"";position:absolute;left:-1px;top:-20px;width:44%;height:28px;border:1px solid var(--border);border-bottom:0;border-radius:15px 15px 0 0;background:var(--soft)}
  .p97-folder:hover{transform:translateY(-3px);box-shadow:0 22px 48px rgba(21,55,66,.12)}.p97-folder:active{transform:translateY(0) scale(.99)}
  .p97-folder-head{display:flex;align-items:center;gap:12px}.p97-folder-av{width:50px;height:50px;border-radius:16px;display:grid;place-items:center;background:var(--accent);color:#fff;font-weight:950;font-size:16px;overflow:hidden;flex:0 0 auto}.p97-folder-av img{width:100%;height:100%;object-fit:cover}
  .p97-folder-main{min-width:0;flex:1}.p97-folder-main b{display:block;font-size:17px;color:#173640;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.p97-folder-main small{display:block;margin-top:3px;color:#75898f;font-weight:650}
  .p97-health{display:inline-flex;align-items:center;gap:5px;border-radius:999px;padding:6px 9px;font-size:10px;font-weight:900}.p97-health.good{background:#e8f7ef;color:#21704e}.p97-health.warn{background:#fff5d9;color:#956800}.p97-health.bad{background:#fee9ed;color:#b13e55}
  .p97-folder-meta{display:flex;gap:7px;flex-wrap:wrap;margin-top:16px}.p97-mini{background:rgba(255,255,255,.72);border:1px solid rgba(80,120,125,.12);border-radius:10px;padding:6px 8px;color:#526b72;font-size:10px;font-weight:800}.p97-open{margin-left:auto;color:var(--accent);font-weight:950;font-size:11px;padding:7px 3px}
  .p97-empty{padding:36px 18px;border:1px dashed #cadada;border-radius:22px;text-align:center;color:#73878d;background:#fff}
  #p97Deck[hidden]{display:none!important}#p97Deck{position:fixed;inset:0;z-index:200500;display:grid;place-items:center;padding:20px;isolation:isolate}
  #p97Deck .p97-backdrop{position:absolute;inset:0;background:rgba(10,33,43,.58);backdrop-filter:blur(13px);animation:p97Fade .2s ease both}
  #p97Deck .p97-table{--soft:#eff8f6;--border:#c7dfd8;--accent:#2f7d5a;position:relative;width:min(820px,94vw);height:min(780px,90dvh);display:flex;flex-direction:column;background:linear-gradient(160deg,#f9fcfb,#eef6f4);border:1px solid rgba(255,255,255,.82);border-radius:30px;box-shadow:0 34px 100px rgba(0,25,35,.34);overflow:visible;animation:p97Table .24s ease-out both}
  #p97Deck .p97-table:before,#p97Deck .p97-table:after{content:"";position:absolute;inset:18px 34px -18px;border-radius:28px;background:color-mix(in srgb,var(--soft) 74%,#d8e9e5);z-index:-2;transform:rotate(-1.5deg);box-shadow:0 22px 60px rgba(0,25,35,.13)}#p97Deck .p97-table:after{inset:10px 18px -10px;z-index:-1;transform:rotate(.8deg);background:color-mix(in srgb,var(--soft) 45%,#fff)}
  .p97-deck-head{flex:0 0 auto;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:12px;padding:13px 14px;border-bottom:1px solid #dce8e6;background:rgba(255,255,255,.94);border-radius:30px 30px 0 0}.p97-deck-head button{height:44px;border:1px solid #d1dfe0;background:#fff;color:#23434c;border-radius:14px;padding:0 13px;font-weight:900}.p97-deck-head .x{width:44px;padding:0;font-size:24px}.p97-deck-title{min-width:0}.p97-deck-title span{display:block;font-size:9px;letter-spacing:.14em;color:#748990;font-weight:950}.p97-deck-title b{display:block;margin-top:2px;color:#173640;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .p97-stage-wrap{position:relative;flex:1 1 auto;min-height:0;overflow:hidden;padding:22px 24px 14px}.p97-stage{height:100%;position:relative;display:grid}
  .p97-playing-card{grid-area:1/1;position:relative;width:100%;height:100%;overflow:auto;background:linear-gradient(160deg,var(--soft),#fff 35%);border:1px solid var(--border);border-top:6px solid var(--accent);border-radius:25px;box-shadow:0 24px 58px rgba(16,48,58,.16);padding:20px;will-change:transform,opacity;overscroll-behavior:contain}
  .p97-playing-card:before{content:"";position:absolute;inset:0 0 auto;height:120px;background:linear-gradient(120deg,var(--soft),transparent);pointer-events:none}.p97-playing-card>*{position:relative;z-index:1}
  .p97-playing-card.drop{animation:p97Drop .42s cubic-bezier(.16,.88,.3,1.18) both}.p97-playing-card.out-left{animation:p97OutLeft .19s ease-in both}.p97-playing-card.out-right{animation:p97OutRight .19s ease-in both}
  .p97-card-kicker{font-size:9px;font-weight:950;letter-spacing:.13em;color:var(--accent);text-transform:uppercase}.p97-card-title{font-family:'Fraunces',serif;font-size:27px;line-height:1.04;color:#173640;margin:4px 0 14px}
  .p97-personhero{display:flex;gap:14px;align-items:center}.p97-personhero .av{width:66px;height:66px;border-radius:21px;background:var(--accent);color:#fff;display:grid;place-items:center;font-size:20px;font-weight:950;overflow:hidden;flex:0 0 auto}.p97-personhero .av img{width:100%;height:100%;object-fit:cover}.p97-personhero h3{margin:0;color:#173640;font-size:22px}.p97-personhero p{margin:3px 0 0;color:#72868d}.p97-summarychips{display:flex;gap:7px;flex-wrap:wrap;margin:15px 0}.p97-summarychips span{border:1px solid rgba(64,108,115,.14);background:rgba(255,255,255,.72);border-radius:11px;padding:7px 9px;color:#536c73;font-size:10px;font-weight:850}
  .p97-card-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}.p97-card-actions button{min-height:44px;border:1px solid #d1dfe0;background:#fff;color:#21424b;border-radius:14px;padding:10px 13px;font-weight:900}.p97-card-actions .primary{background:#168f94;border-color:#168f94;color:#fff}
  .p97-info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.p97-info{border:1px solid rgba(75,113,118,.14);background:rgba(255,255,255,.76);border-radius:16px;padding:13px}.p97-info.full{grid-column:1/-1}.p97-info label{display:block;font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:#788b91;font-weight:900;margin-bottom:6px}.p97-info div{color:#26454e;font-size:13px;line-height:1.45}.p97-question{font-family:'Fraunces',serif!important;font-size:20px!important;color:#1d3841!important}
  .p97-period{border:1px solid rgba(75,113,118,.14);background:rgba(255,255,255,.75);border-radius:15px;padding:12px;margin-bottom:9px}.p97-period-top{display:flex;gap:8px;align-items:center}.p97-period-top b{color:#23434c}.p97-period-top span{margin-left:auto;color:#748990;font-size:10px;font-weight:800}.p97-bar{height:7px;background:#e6eeee;border-radius:99px;overflow:hidden;margin:9px 0}.p97-bar i{display:block;height:100%;background:var(--accent);border-radius:99px}.p97-period-foot{display:flex;justify-content:space-between;gap:8px;color:#748990;font-size:9px;font-weight:700}
  .p97-follow{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:start;border:1px solid rgba(75,113,118,.13);background:rgba(255,255,255,.78);border-radius:15px;padding:11px;margin-bottom:8px}.p97-follow .ico{width:34px;height:34px;border-radius:11px;background:var(--soft);display:grid;place-items:center}.p97-follow b{display:block;color:#23434c;font-size:12px}.p97-follow p{margin:3px 0 0;color:#6d8188;font-size:10.5px;line-height:1.35}.p97-follow small{color:#7c8f95;font-size:9px;font-weight:800}.p97-follow .edit{border:0;background:transparent;color:var(--accent);font-weight:950;padding:2px 0 0 6px}
  .p97-pending-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.p97-metric{border:1px solid rgba(75,113,118,.14);background:rgba(255,255,255,.78);border-radius:18px;padding:15px}.p97-metric strong{display:block;font-size:26px;color:#183844}.p97-metric span{color:#73888e;font-size:10px;font-weight:800}
  .p97-deck-nav{flex:0 0 auto;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:9px;padding:11px 14px 14px;border-top:1px solid #dce8e6;background:rgba(255,255,255,.94);border-radius:0 0 30px 30px}.p97-deck-nav button{height:46px;border:1px solid #ceddde;background:#fff;color:#21424b;border-radius:15px;font-weight:900}.p97-deck-nav .next{background:#168f94;color:#fff;border-color:#168f94}.p97-deck-count{text-align:center;min-width:92px}.p97-deck-count small{display:block;color:#7a8d93;font-size:8px;font-weight:950;letter-spacing:.1em}.p97-deck-count b{display:block;margin-top:3px;color:#36535b;font-size:12px}
  @keyframes p97Fade{from{opacity:0}to{opacity:1}}@keyframes p97Table{from{opacity:0;transform:translateY(15px) scale(.985)}to{opacity:1;transform:none}}@keyframes p97Drop{0%{opacity:0;transform:translateY(-82px) rotate(-3deg) scale(.94)}56%{opacity:1;transform:translateY(8px) rotate(.7deg) scale(1.006)}78%{transform:translateY(-3px) rotate(-.25deg)}100%{opacity:1;transform:none}}@keyframes p97OutLeft{to{opacity:0;transform:translateX(-70px) rotate(-3deg) scale(.96)}}@keyframes p97OutRight{to{opacity:0;transform:translateX(70px) rotate(3deg) scale(.96)}}
  @media(max-width:760px){
    #viewTrack .track-wrap{padding:8px 10px 110px!important}.p97-hero{display:block;margin-top:2px}.p97-hero h2{font-size:31px}.p97-actionline{justify-content:flex-start;margin-top:10px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.p97-actionline button{width:100%;font-size:11px;padding:9px}
    .p97-toolbar{grid-template-columns:1fr 1fr}.p97-toolbar .person{grid-column:1/-1}.p97-field{min-height:44px;border-radius:14px}.p97-folder-grid{grid-template-columns:1fr;gap:16px}.p97-folder{min-height:140px;border-radius:0 22px 22px 22px;padding:21px 15px 14px}.p97-folder:before{top:-18px;height:26px}.p97-folder-av{width:46px;height:46px;border-radius:15px}
    #p97Deck{padding:6px 6px calc(6px + env(safe-area-inset-bottom));place-items:stretch;align-items:stretch;overflow:hidden}#p97Deck .p97-table{width:calc(100vw - 12px);height:calc(100dvh - 12px - env(safe-area-inset-bottom));max-height:none;border-radius:24px;margin:0}.p97-deck-head{padding:9px;border-radius:24px 24px 0 0;gap:7px}.p97-deck-head button{height:42px;padding:0 10px}.p97-deck-head .x{width:42px;padding:0}.p97-deck-title b{font-size:13px}
    .p97-stage-wrap{padding:13px 8px 10px}.p97-playing-card{padding:15px 13px;border-radius:20px}.p97-card-title{font-size:23px}.p97-info-grid{grid-template-columns:1fr}.p97-info.full{grid-column:auto}.p97-question{font-size:18px!important}.p97-pending-grid{grid-template-columns:1fr 1fr}.p97-deck-nav{padding:8px 8px calc(8px + env(safe-area-inset-bottom));border-radius:0 0 24px 24px;gap:6px}.p97-deck-nav button{height:44px;font-size:11px}.p97-deck-count{min-width:64px}.p97-deck-count small{font-size:7px}.p97-deck-count b{font-size:11px}
  }
  @media(prefers-reduced-motion:reduce){#p97Deck .p97-backdrop,#p97Deck .p97-table,.p97-playing-card.drop,.p97-playing-card.out-left,.p97-playing-card.out-right{animation:none!important}}
  `;
  document.head.appendChild(st);
}

function folderMembers(){
  const s=appState();let list=[...(s?.members||[])];
  const q=norm(folderState.q),type=folderState.type,status=folderState.status;
  if(q)list=list.filter(m=>norm([m.nome,m.programa,m.tema,m.origem].filter(Boolean).join(' ')).includes(q));
  if(type)list=list.filter(m=>String(m.nivel||'')===type);
  if(status)list=list.filter(m=>healthFor(m).level===status);
  if(folderState.sort==='pending')list.sort((a,b)=>{const A=statusCounts(a),B=statusCounts(b);return (B.late*10+B.open)-(A.late*10+A.open)||a.nome.localeCompare(b.nome,'pt-BR')});
  else if(folderState.sort==='type')list.sort((a,b)=>memberLevel(a).localeCompare(memberLevel(b),'pt-BR')||a.nome.localeCompare(b.nome,'pt-BR'));
  else list.sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'));
  return list;
}
function fillTypeOptions(){
  const sel=$('#p97Type');if(!sel)return;
  const s=appState();const vals=[...new Set((s?.members||[]).map(m=>String(m.nivel||'')).filter(Boolean))];
  const sig=vals.sort().join('|');if(sel.dataset.sig===sig)return;const keep=folderState.type;
  sel.dataset.sig=sig;sel.innerHTML='<option value="">Todos os tipos</option>'+vals.map(v=>{const m=(s?.members||[]).find(x=>String(x.nivel||'')===v);return `<option value="${esc97(v)}">${esc97(memberLevel(m||{nivel:v}))}</option>`}).join('');
  if(vals.includes(keep))sel.value=keep;
}
function folderHtml(m){
  const [soft,border,accent]=colorsFor(m.nome),h=healthFor(m),c=statusCounts(m);
  const av=m.foto?`<img src="${esc97(m.foto)}" alt="">`:esc97(initials97(m.nome));
  return `<button type="button" class="p97-folder" data-p97-member="${esc97(m.id)}" style="--soft:${soft};--border:${border};--accent:${accent}">
    <div class="p97-folder-head"><div class="p97-folder-av">${av}</div><div class="p97-folder-main"><b>${esc97(m.nome)}</b><small>${esc97(memberLevel(m))}${m.programa?' · '+esc97(m.programa):''}</small></div><span class="p97-health ${healthClass(h)}">● ${healthLabel(h)}</span></div>
    <div class="p97-folder-meta"><span class="p97-mini">${c.open} abertos</span><span class="p97-mini">${c.late} atrasados</span><span class="p97-mini">${c.corr} correções</span><span class="p97-open">abrir cartas →</span></div>
  </button>`;
}
function ensureFolderUi(){
  const wrap=$('#viewTrack .track-wrap');if(!wrap)return null;
  let root=$('#p97Folders');
  if(!root){
    root=document.createElement('section');root.id='p97Folders';root.innerHTML=`
      <div class="p97-hero"><div><h2>Pastas de acompanhamento</h2><p>Escolha um siminino ou uma siminina. A pasta abre como um baralho de acompanhamento.</p></div><div class="p97-actionline"><button type="button" data-p97-global="checkin">✓ Check-in</button><button type="button" data-p97-global="product">🎯 Produto</button><button type="button" data-p97-global="dossier">📚 Dossiê</button><button type="button" class="primary" data-p97-global="activity">＋ Registrar</button></div></div>
      <div class="p97-toolbar"><label class="p97-field person"><span>⌕</span><input id="p97Search" type="search" autocomplete="off" placeholder="Procurar pessoa..."></label><label class="p97-field"><span>◫</span><select id="p97Type"><option value="">Todos os tipos</option></select></label><label class="p97-field"><span>●</span><select id="p97Status"><option value="">Toda situação</option><option value="red">Intervir</option><option value="yellow">Atenção</option><option value="green">Em dia</option></select></label></div>
      <div class="p97-sort"><button type="button" data-p97-sort="az" class="on">A–Z · Pessoas</button><button type="button" data-p97-sort="type">Tipo</button><button type="button" data-p97-sort="pending">Pendências</button><span class="p97-folder-count" id="p97FolderCount"></span></div>
      <div class="p97-folder-grid" id="p97FolderGrid"></div><div class="p97-empty" id="p97Empty" hidden>Nenhuma pessoa encontrada com esses filtros.</div>`;
    wrap.insertBefore(root,wrap.firstChild);
    $('#p97Search',root).addEventListener('input',e=>{folderState.q=e.target.value;renderFolders()});
    $('#p97Type',root).addEventListener('change',e=>{folderState.type=e.target.value;renderFolders()});
    $('#p97Status',root).addEventListener('change',e=>{folderState.status=e.target.value;renderFolders()});
    root.addEventListener('click',e=>{
      const sort=e.target.closest('[data-p97-sort]');if(sort){folderState.sort=sort.dataset.p97Sort;renderFolders();return}
      const folder=e.target.closest('[data-p97-member]');if(folder){openDeck(folder.dataset.p97Member);return}
      const g=e.target.closest('[data-p97-global]');if(!g)return;
      const a=g.dataset.p97Global;
      const map={checkin:'#trackCheckinBtn',product:'#trackProductBtn',dossier:'#trackDossierBtn',activity:'#addActivityBtn'};
      $(map[a])?.click();
    });
  }
  return root;
}
function renderFolders(){
  const root=ensureFolderUi();if(!root)return;fillTypeOptions();
  if($('#p97Search')&&$('#p97Search').value!==folderState.q)$('#p97Search').value=folderState.q;
  if($('#p97Type')&&$('#p97Type').value!==folderState.type)$('#p97Type').value=folderState.type;
  if($('#p97Status')&&$('#p97Status').value!==folderState.status)$('#p97Status').value=folderState.status;
  $$('#p97Folders [data-p97-sort]').forEach(b=>b.classList.toggle('on',b.dataset.p97Sort===folderState.sort));
  const list=folderMembers(),grid=$('#p97FolderGrid'),empty=$('#p97Empty');if(!grid)return;
  grid.innerHTML=list.map(folderHtml).join('');empty.hidden=!!list.length;$('#p97FolderCount').textContent=`${list.length} pasta${list.length===1?'':'s'}`;
}

function periodInfo(start,end,progress=0){
  try{if(typeof trackPeriodInfo==='function'){const x=trackPeriodInfo(start,end);return {...x,pct:(start&&end)?x.pct:Math.max(0,Math.min(100,Number(progress)||0))}}}catch(_e){}
  const s=start?new Date(start+'T00:00:00'):null,e=end?new Date(end+'T00:00:00'):null,n=new Date();n.setHours(0,0,0,0);
  if(!s||!e||!Number.isFinite(+s)||!Number.isFinite(+e))return {pct:Math.max(0,Math.min(100,Number(progress)||0)),remain:'período incompleto'};
  const total=Math.max(1,(e-s)/86400000),pct=Math.max(0,Math.min(100,Math.round((n-s)/86400000/total*100))),days=Math.round((e-n)/86400000);
  return {pct,remain:days<0?`encerrado há ${Math.abs(days)} dia(s)`:`${days} dia(s) restantes`};
}
function periodHtml(label,title,start,end,progress){
  const p=periodInfo(start,end,progress);
  return `<div class="p97-period"><div class="p97-period-top"><b>${esc97(label)}${title&&title!==label?' · '+esc97(title):''}</b><span>${esc97(p.remain||'')}</span></div><div class="p97-bar"><i style="width:${p.pct||0}%"></i></div><div class="p97-period-foot"><span>${start?'Início '+fmtDate(start):'Início não informado'}</span><b>${p.pct||0}%</b><span>${end?'Fim '+fmtDate(end):'Fim não informado'}</span></div></div>`;
}
function followHtml(a,can){
  const when=a.dueDate||a.startDate||'',late=overdue(a);
  return `<div class="p97-follow"><div class="ico">${iconFor(a.type)}</div><div><b>${esc97(typeLabel(a))} · ${esc97(a.title||statusLabel(a)||'Acompanhamento')}</b>${a.description?`<p>${esc97(a.description)}</p>`:''}<p>${esc97(statusLabel(a))}${late?' · ATRASADO':''}</p></div><div><small>${when?esc97(fmtDate(when)):''}</small>${can?`<button class="edit" type="button" data-p97-action="edit" data-id="${esc97(a.id)}">✎</button>`:''}</div></div>`;
}
function projectCard(m,can){
  const q=(m.perguntaCientifica||'').trim(),obj=(m.objetivoProjeto||'').trim(),aud=(m.grupoAtendido||'').trim(),vis=(m.ideiaVisibilidade||'').trim(),oth=(m.projetoOutros||'').trim();
  const val=(x,cls='')=>`<div class="${cls}">${x?esc97(x):'<em style="color:#8b999d">Ainda não preenchido.</em>'}</div>`;
  return {title:'Identidade do projeto',kicker:'PROJETO',html:`<div class="p97-card-kicker">🧭 identidade do projeto</div><div class="p97-card-title">A pergunta que guia tudo</div><div class="p97-info-grid"><div class="p97-info full"><label>★ Pergunta científica</label>${val(q,'p97-question')}</div><div class="p97-info"><label>Objetivo central</label>${val(obj)}</div><div class="p97-info"><label>Grupo / público atendido</label>${val(aud)}</div><div class="p97-info full"><label>Ideia de visibilidade</label>${val(vis)}</div>${oth?`<div class="p97-info full"><label>Outros aspectos</label>${val(oth)}</div>`:''}</div>${can?`<div class="p97-card-actions"><button type="button" data-p97-action="project" data-mid="${esc97(m.id)}">✎ Editar projeto</button></div>`:''}`};
}
function overviewCard(m,can){
  const h=healthFor(m),c=statusCounts(m),av=m.foto?`<img src="${esc97(m.foto)}" alt="">`:esc97(initials97(m.nome));
  return {title:'Visão geral',kicker:'ACOMPANHAMENTO',html:`<div class="p97-card-kicker">PASTA DE ACOMPANHAMENTO</div><div class="p97-card-title">Situação agora</div><div class="p97-personhero"><div class="av">${av}</div><div><h3>${esc97(m.nome)}</h3><p>${esc97(memberLevel(m))}${m.programa?' · '+esc97(m.programa):''}${m.bolsista?' · Bolsista':''}</p></div><span class="p97-health ${healthClass(h)}">● ${healthLabel(h)}</span></div><div class="p97-summarychips"><span>${c.open} itens abertos</span><span>${c.late} atrasados</span><span>${c.corr} correções</span><span>${c.soon} prazo(s) em 30 dias</span></div><div class="p97-info full"><label>Por que está assim?</label><div>${esc97((h.reasons||[]).slice(0,4).join(' · '))}</div></div><div class="p97-card-actions">${can?`<button class="primary" type="button" data-p97-action="activity" data-mid="${esc97(m.id)}">＋ Registrar</button>`:''}<button type="button" data-p97-action="dossier" data-mid="${esc97(m.id)}">Dossiê</button><button type="button" data-p97-action="repo" data-mid="${esc97(m.id)}">As coisa tudo</button></div>`};
}
function timelineCard(m,can){
  const acts=actsFor(m.id),periods=acts.filter(a=>['mestrado','doutorado','tcc'].includes(a.type)),bits=[];
  if(m.bolsista)bits.push(periodHtml('🎓 Bolsa',m.bolsaModalidade||'Bolsa',m.bolsaInicio,m.bolsaFim,0));
  periods.forEach(a=>bits.push(periodHtml(`${iconFor(a.type)} ${typeLabel(a)}`,a.title,a.startDate,a.dueDate,a.progress)));
  return {title:'Régua de tempo',kicker:'TEMPO',html:`<div class="p97-card-kicker">⏳ régua de tempo</div><div class="p97-card-title">Onde a pessoa está na jornada?</div>${bits.join('')||'<div class="p97-empty">Nenhum período de bolsa, mestrado, doutorado ou TCC registrado.</div>'}${can?`<div class="p97-card-actions"><button type="button" data-p97-action="activity" data-mid="${esc97(m.id)}">＋ Registrar acompanhamento</button></div>`:''}`};
}
function historyCard(m,can){
  const all=actsFor(m.id).filter(a=>!['mestrado','doutorado','tcc'].includes(a.type)).sort((a,b)=>(millis(b.updatedAt)||millis(b.createdAt))-(millis(a.updatedAt)||millis(a.createdAt)));
  return {title:'Histórico e próximos passos',kicker:'HISTÓRICO',html:`<div class="p97-card-kicker">🗂 histórico e próximos passos</div><div class="p97-card-title">O que está acontecendo?</div>${all.length?all.slice(0,12).map(a=>followHtml(a,can)).join(''):'<div class="p97-empty">Sem orientações, correções ou pendências registradas.</div>'}`};
}
function pendingCard(m,can){
  const c=statusCounts(m),acts=actsFor(m.id),pending=acts.filter(a=>!activityDone(a)&&(overdue(a)||['correcao','pendencia','entrega'].includes(a.type))).sort((a,b)=>(overdue(b)?1:0)-(overdue(a)?1:0)||(String(a.dueDate||'9999')).localeCompare(String(b.dueDate||'9999')));
  return {title:'Pendências e ação',kicker:'AÇÃO',html:`<div class="p97-card-kicker">⚡ pendências e ação</div><div class="p97-card-title">O que precisa acontecer agora?</div><div class="p97-pending-grid"><div class="p97-metric"><strong>${c.late}</strong><span>itens atrasados</span></div><div class="p97-metric"><strong>${c.corr}</strong><span>correções abertas</span></div><div class="p97-metric"><strong>${c.soon}</strong><span>prazos em 30 dias</span></div><div class="p97-metric"><strong>${c.open}</strong><span>itens abertos</span></div></div><div style="height:10px"></div>${pending.length?pending.slice(0,8).map(a=>followHtml(a,can)).join(''):'<div class="p97-empty">Nada urgente registrado nesta pasta.</div>'}${can?`<div class="p97-card-actions"><button type="button" data-p97-action="checkin" data-mid="${esc97(m.id)}">✓ Check-in</button><button type="button" data-p97-action="product" data-mid="${esc97(m.id)}">🎯 Produto</button><button type="button" data-p97-action="preset" data-kind="pendencia" data-mid="${esc97(m.id)}">⚠️ Pendência</button><button type="button" data-p97-action="preset" data-kind="correcao" data-mid="${esc97(m.id)}">✍️ Correção</button></div>`:''}`};
}
function buildDeckCards(m){const can=memberCanEdit(m.id);return [overviewCard(m,can),projectCard(m,can),timelineCard(m,can),historyCard(m,can),pendingCard(m,can)]}

function ensureDeck(){
  let ov=$('#p97Deck');if(ov)return ov;
  ov=document.createElement('div');ov.id='p97Deck';ov.hidden=true;ov.innerHTML=`
    <div class="p97-backdrop" data-p97-close></div>
    <section class="p97-table" role="dialog" aria-modal="true" aria-label="Acompanhamento em cartas">
      <header class="p97-deck-head"><button type="button" data-p97-close>← Pastas</button><div class="p97-deck-title"><span id="p97DeckKicker">ACOMPANHAMENTO</span><b id="p97DeckName">Carbonauta</b></div><button type="button" class="x" data-p97-close>×</button></header>
      <div class="p97-stage-wrap"><div class="p97-stage" id="p97Stage"></div></div>
      <footer class="p97-deck-nav"><button type="button" class="prev">← Anterior</button><div class="p97-deck-count"><small id="p97CardTitle">CARTA</small><b id="p97CardCount">1 de 5</b></div><button type="button" class="next">Próxima →</button></footer>
    </section>`;
  document.body.appendChild(ov);
  ov.addEventListener('click',e=>{
    if(e.target.closest('[data-p97-close]')){closeDeck();return}
    const a=e.target.closest('[data-p97-action]');if(!a)return;
    e.preventDefault();e.stopPropagation();
    const mid=a.dataset.mid||deckMemberId,action=a.dataset.p97Action;
    if(action==='activity')call('openActivity',null,mid);
    else if(action==='dossier')call('openDossier',mid);
    else if(action==='repo')call('openMemberRepository',mid);
    else if(action==='project')call('openProjectProfile',mid);
    else if(action==='checkin')call('openCheckin',mid);
    else if(action==='product')call('openProduct',mid);
    else if(action==='preset')call('openActivityPreset',a.dataset.kind||'pendencia',mid);
    else if(action==='edit')call('editActivity',a.dataset.id);
  });
  $('.p97-deck-nav .prev',ov).addEventListener('click',()=>navigateDeck(-1));
  $('.p97-deck-nav .next',ov).addEventListener('click',()=>navigateDeck(1));
  const stage=$('#p97Stage',ov);
  stage.addEventListener('touchstart',e=>{if(e.touches.length!==1)return;deckTouch={x:e.touches[0].clientX,y:e.touches[0].clientY,t:Date.now()}},{passive:true});
  stage.addEventListener('touchend',e=>{if(!deckTouch)return;const p=e.changedTouches[0],dx=p.clientX-deckTouch.x,dy=p.clientY-deckTouch.y,dt=Date.now()-deckTouch.t;deckTouch=null;if(dt<750&&Math.abs(dx)>52&&Math.abs(dx)>Math.abs(dy)*1.2)navigateDeck(dx<0?1:-1)},{passive:true});
  return ov;
}
function openDeck(memberId){
  const s=appState(),m=(s?.members||[]).find(x=>x.id===memberId);if(!m)return;
  const ov=ensureDeck();deckMemberId=memberId;deckCardIndex=0;deckCards=buildDeckCards(m);
  const [soft,border,accent]=colorsFor(m.nome),table=$('.p97-table',ov);table.style.setProperty('--soft',soft);table.style.setProperty('--border',border);table.style.setProperty('--accent',accent);
  $('#p97DeckName').textContent=m.nome;ov.hidden=false;document.documentElement.style.overflow='hidden';renderDeckCard(0,true);
}
function closeDeck(){const ov=$('#p97Deck');if(!ov||ov.hidden)return;ov.hidden=true;$('#p97Stage').innerHTML='';deckMemberId='';deckCards=[];deckCardIndex=0;deckAnimating=false;document.documentElement.style.overflow=''}
function renderDeckCard(dir=0,first=false){
  if(!deckCards.length)return;const stage=$('#p97Stage'),old=$('.p97-playing-card',stage),card=deckCards[deckCardIndex];
  const put=()=>{stage.innerHTML='';const el=document.createElement('article');el.className='p97-playing-card';el.innerHTML=card.html;stage.appendChild(el);$('#p97DeckKicker').textContent=card.kicker||'ACOMPANHAMENTO';$('#p97CardTitle').textContent=card.title;$('#p97CardCount').textContent=`${deckCardIndex+1} de ${deckCards.length}`;requestAnimationFrame(()=>el.classList.add('drop'));el.scrollTop=0;deckAnimating=false};
  if(!old||first){put();return}deckAnimating=true;old.classList.remove('drop');old.classList.add(dir>=0?'out-left':'out-right');setTimeout(put,175);
}
function navigateDeck(delta){if(deckAnimating||!deckCards.length)return;deckCardIndex=(deckCardIndex+delta+deckCards.length)%deckCards.length;renderDeckCard(delta,false)}
function refreshOpenDeck(){
  if(!deckMemberId)return;const s=appState(),m=(s?.members||[]).find(x=>x.id===deckMemberId);if(!m){closeDeck();return}
  const oldTitle=deckCards[deckCardIndex]?.title;deckCards=buildDeckCards(m);const i=deckCards.findIndex(c=>c.title===oldTitle);if(i>=0)deckCardIndex=i;renderDeckCard(0,true);
}

function renderAfterTrack(){renderFolders();refreshOpenDeck()}
function installTrackWrapper(){
  if(trackWrapped)return;
  let original=null;try{original=window.renderTrack||renderTrack}catch(_e){}
  if(typeof original!=='function'){setTimeout(installTrackWrapper,120);return}
  if(original.__p97Wrapped){trackWrapped=true;return}
  const wrapped=function(){const r=original.apply(this,arguments);requestAnimationFrame(renderAfterTrack);return r};
  wrapped.__p97Wrapped=true;wrapped.__p97Original=original;
  try{renderTrack=wrapped}catch(_e){}window.renderTrack=wrapped;trackWrapped=true;
  try{if(document.body.dataset.view==='track'||$('#viewTrack')?.classList.contains('on'))wrapped()}catch(_e){}
}

function graphSignature(){
  const s=appState();if(!s)return'nostate';
  const mem=(s.members||[]).map(m=>[m.id,m.nome,m.nivel,m.status,(m.linhas||[]).join('~'),!!m.hub,m.hubMotivo||'',JSON.stringify(m.vinculos||[])]).sort((a,b)=>String(a[0]).localeCompare(String(b[0])));
  const ids=['search','fPrograma','fStatus','grouping','tLabels','tHubLinks'].map(id=>{const e=$('#'+id);return e?(e.type==='checkbox'?!!e.checked:e.value):''});
  let hn='',hl='';try{hn=[...hiddenNiveis].sort().join('|')}catch(_e){}try{hl=[...hiddenLinhas].sort().join('|')}catch(_e){}
  const g=$('#graph'),r=g?.getBoundingClientRect();return JSON.stringify([mem,ids,hn,hl,Math.round(r?.width||0),Math.round(r?.height||0)]);
}
function installGraphStability(){
  if(graphWrapped)return;
  let original=null;try{original=window.renderGraph||renderGraph}catch(_e){}
  if(typeof original!=='function'){setTimeout(installGraphStability,120);return}
  if(original.__p97Stable){graphWrapped=true;return}
  const stable=function(){
    const sig=graphSignature();
    if(sig===lastGraphSig&&$('#graph .zoomG'))return;
    lastGraphSig=sig;
    const r=original.apply(this,arguments);
    try{
      if(simulation){
        simulation.alphaDecay(.10);
        clearTimeout(graphStopTimer);
        graphStopTimer=setTimeout(()=>{try{simulation.alphaTarget(0);simulation.stop()}catch(_e){}},950);
      }
    }catch(_e){}
    return r;
  };
  stable.__p97Stable=true;stable.__p97Original=original;
  try{renderGraph=stable}catch(_e){}window.renderGraph=stable;graphWrapped=true;
}
function forceGraphOnce(){
  try{if(document.body.dataset.view==='rede'||$('#viewRede')?.classList.contains('on'))window.renderGraph?.()}catch(_e){}
}
function installFocusWrapper(){
  if(focusWrapped)return;
  let original=null;try{original=window.focusMemberTrack||focusMemberTrack}catch(_e){}
  if(typeof original!=='function'){setTimeout(installFocusWrapper,160);return}
  if(original.__p97Wrapped){focusWrapped=true;return}
  const wrapped=function(id){const r=original.apply(this,arguments);setTimeout(()=>openDeck(id),90);return r};
  wrapped.__p97Wrapped=true;wrapped.__p97Original=original;
  try{focusMemberTrack=wrapped}catch(_e){}window.focusMemberTrack=wrapped;focusWrapped=true;
}

function boot(){
  injectCss();ensureDeck();installTrackWrapper();installFocusWrapper();installGraphStability();renderFolders();
  document.addEventListener('keydown',e=>{const ov=$('#p97Deck');if(!ov||ov.hidden)return;if(e.key==='Escape'){e.preventDefault();closeDeck()}else if(e.key==='ArrowRight'){e.preventDefault();navigateDeck(1)}else if(e.key==='ArrowLeft'){e.preventDefault();navigateDeck(-1)}});
  document.addEventListener('click',e=>{
    if(e.target.closest?.('[data-sub-view="track"],[data-view="track"]'))setTimeout(()=>{installTrackWrapper();renderFolders()},90);
    if(e.target.closest?.('[data-sub-view="rede"],[data-view="rede"]'))setTimeout(forceGraphOnce,90);
  },true);
  const bodyObs=new MutationObserver(ms=>{if(ms.some(m=>m.type==='attributes'&&m.attributeName==='data-view')){const v=document.body.dataset.view;if(v==='track')setTimeout(()=>{installTrackWrapper();renderFolders()},70);if(v==='rede')setTimeout(forceGraphOnce,70)}});
  bodyObs.observe(document.body,{attributes:true,attributeFilter:['data-view']});
  [250,700,1500].forEach(ms=>setTimeout(()=>{installTrackWrapper();installFocusWrapper();installGraphStability();if(document.body.dataset.view==='track'||$('#viewTrack')?.classList.contains('on'))renderFolders()},ms));
  try{const u=new URL(location.href);if(u.searchParams.get('build')!==BUILD){u.searchParams.set('build',BUILD);u.searchParams.delete('pwa');history.replaceState(null,'',u.href)}}catch(_e){}
  window.CARBONAUTAS_RUNTIME_BUILD=BUILD;
  console.info('Carbonautas P97 pastas + baralho + grafo estável');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();