/* Carbonautas P57 · Repositório mobile + presença diária + medalhas por período */
(function(){
'use strict';
const VERSION='P57';

function p57Pad(n){return String(n).padStart(2,'0')}
function p57DayKey(d=new Date()){return `${d.getFullYear()}-${p57Pad(d.getMonth()+1)}-${p57Pad(d.getDate())}`}
function p57MonthKey(d=new Date()){return `${d.getFullYear()}-${p57Pad(d.getMonth()+1)}`}
function p57StartOfWeek(d=new Date()){const x=new Date(d);x.setHours(0,0,0,0);const day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);return x}
function p57EndOfWeek(d=new Date()){const x=p57StartOfWeek(d);x.setDate(x.getDate()+6);x.setHours(23,59,59,999);return x}
function p57Esc(v=''){try{return typeof esc==='function'?esc(String(v)):String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}catch(_e){return String(v)}}

function p57Css(){
  if(document.getElementById('p57Style'))return;
  const s=document.createElement('style');s.id='p57Style';s.textContent=`
  /* P57 · Repositório realmente responsivo */
  @media(max-width:720px){
    #viewPubs .pub-row{
      display:grid!important;
      grid-template-columns:7px minmax(0,1fr)!important;
      grid-template-areas:"cat body" "cat actions"!important;
      column-gap:10px!important;row-gap:10px!important;
      width:100%!important;min-width:0!important;max-width:100%!important;
      min-height:0!important;height:auto!important;
      padding:12px 10px!important;margin:0 0 10px!important;
      box-sizing:border-box!important;align-items:start!important;
    }
    #viewPubs .pub-cat{grid-area:cat!important;width:6px!important;min-width:6px!important;height:100%!important;border-radius:8px!important;margin:0!important}
    #viewPubs .pub-body{grid-area:body!important;width:100%!important;min-width:0!important;max-width:100%!important;padding:0!important;margin:0!important}
    #viewPubs .pub-act{grid-area:actions!important;position:static!important;inset:auto!important;transform:none!important;float:none!important;width:100%!important;min-width:0!important;max-width:100%!important;margin:0!important}
    #viewPubs .pub-t{font-size:14px!important;line-height:1.22!important;letter-spacing:0!important;white-space:normal!important;word-break:normal!important;overflow-wrap:anywhere!important;max-width:none!important;width:auto!important}
    #viewPubs .pub-meta{display:flex!important;flex-wrap:wrap!important;gap:5px!important;align-items:center!important;font-size:10.5px!important;line-height:1.3!important}
    #viewPubs .review-note,#viewPubs .repo-seq,#viewPubs .p54-history,#viewPubs .scientific-context{max-width:100%!important;width:100%!important;min-width:0!important;overflow:hidden!important}
    #viewPubs .p54-head{display:none!important}
    #viewPubs .p54-row{display:grid!important;grid-template-columns:1fr!important;gap:2px!important;padding:8px 9px!important}
    #viewPubs .p54-row>*{min-width:0!important;white-space:normal!important;overflow-wrap:anywhere!important}
    #viewPubs .pub-act.p55-actions-grid{
      display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;
      grid-auto-rows:40px!important;gap:6px!important;width:100%!important;min-width:0!important;max-width:100%!important;
    }
    #viewPubs .p55-actions-grid button:not(.mini-x),#viewPubs .p55-actions-grid a{
      width:100%!important;min-width:0!important;max-width:100%!important;height:40px!important;min-height:40px!important;max-height:40px!important;
      padding:0 6px!important;font-size:10.5px!important;border-radius:9px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;
    }
    #viewPubs .p55-actions-grid .mini-x,#viewPubs .p55-actions-grid .p55-close{width:40px!important;min-width:40px!important;max-width:40px!important;height:40px!important;min-height:40px!important;max-height:40px!important;justify-self:end!important}
    #viewPubs .repo-item{display:grid!important;grid-template-columns:38px minmax(0,1fr)!important;grid-template-areas:"icon main" "actions actions"!important;gap:8px!important;min-height:0!important;height:auto!important}
    #viewPubs .repo-icon{grid-area:icon!important}.repo-main{grid-area:main!important;min-width:0!important}.repo-actions{grid-area:actions!important;position:static!important;width:100%!important;min-width:0!important;max-width:100%!important}
    #viewPubs .repo-title{white-space:normal!important;overflow-wrap:anywhere!important;word-break:normal!important;font-size:13px!important;line-height:1.25!important}
  }
  @media(max-width:420px){
    #viewPubs .pub-row{padding:10px 8px!important;column-gap:8px!important}
    #viewPubs .pub-t{font-size:13px!important}
    #viewPubs .pub-act.p55-actions-grid{gap:5px!important}
    #viewPubs .p55-actions-grid button:not(.mini-x){font-size:10px!important;padding:0 4px!important}
  }

  /* Chegada do dia */
  .p57-arrival{position:fixed;right:14px;bottom:18px;z-index:2147483000;background:#082b39;color:#fff;border:1px solid rgba(255,255,255,.2);box-shadow:0 12px 34px rgba(2,23,31,.28);border-radius:16px;padding:11px 14px;display:flex;gap:9px;align-items:center;font-weight:900;font-size:13px;max-width:min(330px,calc(100vw - 28px));animation:p57in .28s ease-out}
  .p57-arrival small{display:block;font-size:9px;font-weight:600;opacity:.72;margin-top:2px}.p57-arrival i{font-style:normal;font-size:23px}
  @keyframes p57in{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:none}}

  /* Raio-X de uso nas Medalhas */
  .p57-usage{border:1px solid #d8e6ea;border-radius:18px;background:#fff;padding:13px;margin:0 0 14px;box-shadow:0 5px 18px rgba(10,55,68,.04)}
  .p57-usage-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:11px}.p57-usage-head h3{margin:0;font-size:16px}.p57-usage-head p{margin:2px 0 0;color:#71858d;font-size:10.5px}.p57-usage-head .spacer{flex:1}
  .p57-periods{display:flex;gap:5px;background:#f0f5f6;border-radius:12px;padding:4px}.p57-periods button{border:0;background:transparent;border-radius:9px;padding:7px 10px;font-weight:900;font-size:10.5px;color:#5b717a;cursor:pointer}.p57-periods button.on{background:#0d8794;color:#fff;box-shadow:0 3px 8px rgba(13,135,148,.18)}
  .p57-usage-meta{font-size:10px;color:#6c8088;margin:0 0 9px}.p57-usage-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.p57-use-card{border:1px solid #dce7ea;border-radius:14px;padding:10px;background:#fbfdfd}.p57-use-card:first-child{border-color:#e9ca66;background:#fffbed}.p57-use-top{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:7px;align-items:center}.p57-use-pos{font-size:20px}.p57-use-name{min-width:0}.p57-use-name b{display:block;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.p57-use-name small{display:block;font-size:9px;color:#71848c;margin-top:2px}.p57-use-count{font:900 20px/1 sans-serif;color:#123d4b}.p57-use-count small{font-size:8px;color:#789099}.p57-use-break{display:flex;gap:4px;flex-wrap:wrap;margin-top:8px}.p57-use-chip{font-size:8.5px;font-weight:800;padding:4px 6px;border-radius:999px;background:#eef5f6;color:#3e606b}.p57-empty{padding:16px;border:1px dashed #cfdee2;border-radius:13px;color:#6e838b;text-align:center;font-size:11px}
  @media(max-width:800px){.p57-usage-grid{grid-template-columns:1fr}.p57-usage-head{align-items:flex-start}.p57-periods{width:100%;display:grid;grid-template-columns:repeat(3,1fr)}.p57-periods button{width:100%}}
  `;document.head.appendChild(s);
}

function p57Arrival(){
  let tries=0;const timer=setInterval(()=>{
    tries++;const uid=window.auth?.currentUser?.uid||'';if(!uid&&tries<30)return;if(!uid){clearInterval(timer);return}clearInterval(timer);
    const today=p57DayKey(),key=`carbonautas_arrival_${uid}_${today}`;if(localStorage.getItem(key))return;localStorage.setItem(key,'1');
    const el=document.createElement('div');el.className='p57-arrival';el.innerHTML=`<i>🛸</i><div>Tcheguei Hodje Xomano!<small>Presença de hoje registrada neste aparelho.</small></div>`;document.body.appendChild(el);setTimeout(()=>{el.style.opacity='0';el.style.transform='translateY(8px)';el.style.transition='.25s';setTimeout(()=>el.remove(),280)},4200);
  },300);
}

const P57_ACTION_LABEL={
  activity_created:'Acompanhamento',activity_completed:'Concluiu tarefa',checkin:'Check-in',product:'Produto',repo_package:'Repositório',publication:'Publicação',photo:'Foto',feed:'Mural',help_post:'Ajuda',deadline_done:'Prazo cumprido',game_complete:'Jogo'
};
function p57ActionGroup(a){
  if(['activity_created','activity_completed','deadline_done'].includes(a))return 'Acompanhamento';
  if(['publication','product'].includes(a))return 'Produção';
  if(['repo_package','photo'].includes(a))return 'Repositório';
  if(a==='checkin')return 'Check-in';if(a==='help_post')return 'Ajuda';if(a==='feed')return 'Mural';if(a==='game_complete')return 'Jogo';return P57_ACTION_LABEL[a]||a||'Outros';
}
async function p57LoadPoints(){
  const f=FB(),now=new Date(),start=p57StartOfWeek(now);start.setDate(start.getDate()-7);const months=[p57MonthKey(now),p57MonthKey(start)];
  const all=[];
  for(const mk of [...new Set(months)]){
    try{const q=f.query(f.collection(window.db,'rede_points_events'),f.where('monthKey','==',mk));const snap=await f.getDocs(q);snap.forEach(d=>all.push({...d.data(),id:d.id}))}catch(e){console.warn('P57 pontos',mk,e)}
  }
  return all;
}
function p57PeriodBounds(mode){
  const now=new Date();now.setHours(23,59,59,999);
  if(mode==='day'){const s=new Date();s.setHours(0,0,0,0);return {start:s,end:now,label:`Hoje · ${s.toLocaleDateString('pt-BR')}`}}
  if(mode==='week'){const s=p57StartOfWeek();const e=p57EndOfWeek();return {start:s,end:e,label:`Semana · ${s.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}–${e.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}`}}
  const s=new Date();s.setDate(1);s.setHours(0,0,0,0);const e=new Date(s.getFullYear(),s.getMonth()+1,0,23,59,59,999);return {start:s,end:e,label:s.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}
}
function p57EventDate(e){
  if(e.dayKey&&/^\d{4}-\d{2}-\d{2}$/.test(e.dayKey)){const [y,m,d]=e.dayKey.split('-').map(Number);return new Date(y,m-1,d,12)}
  if(e.createdAt?.toDate)return e.createdAt.toDate();if(e.createdAt?.toMillis)return new Date(e.createdAt.toMillis());return new Date(0)
}
function p57UsageRows(points,mode){
  const {start,end}=p57PeriodBounds(mode),filtered=points.filter(e=>{const d=p57EventDate(e);return d>=start&&d<=end});const map=new Map();
  filtered.forEach(e=>{const id=e.memberId||'?',name=e.memberName||((typeof memberById==='function'&&memberById(id)?.nome)||'Carbonauta');if(!map.has(id))map.set(id,{id,name,n:0,groups:{}});const r=map.get(id),g=p57ActionGroup(e.action);r.n++;r.groups[g]=(r.groups[g]||0)+1});
  return [...map.values()].sort((a,b)=>b.n-a.n||a.name.localeCompare(b.name,'pt-BR'));
}
function p57UsageCard(r,i){const pos=['🥇','🥈','🥉'][i]||`${i+1}º`;const chips=Object.entries(r.groups).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v])=>`<span class="p57-use-chip">${p57Esc(k)} ${v}</span>`).join('');const top=Object.entries(r.groups).sort((a,b)=>b[1]-a[1])[0]?.[0]||'—';return `<div class="p57-use-card"><div class="p57-use-top"><span class="p57-use-pos">${pos}</span><div class="p57-use-name"><b>${p57Esc(r.name)}</b><small>mais usou para: ${p57Esc(top)}</small></div><div class="p57-use-count">${r.n}<small> ações</small></div></div><div class="p57-use-break">${chips}</div></div>`}
let p57PointsCache=null,p57Mode='day';
async function p57RenderUsage(mode=p57Mode){
  p57Mode=mode;const host=document.getElementById('p57Usage');if(!host)return;host.querySelectorAll('.p57-periods button').forEach(b=>b.classList.toggle('on',b.dataset.mode===mode));const body=host.querySelector('.p57-usage-body');body.innerHTML='<div class="p57-empty">Calculando atividade…</div>';if(!p57PointsCache)p57PointsCache=await p57LoadPoints();const rows=p57UsageRows(p57PointsCache,mode),bounds=p57PeriodBounds(mode);body.innerHTML=`<div class="p57-usage-meta">${p57Esc(bounds.label)} · mede ações registradas na plataforma e mostra para que ela foi usada. Não substitui a medalha acadêmica mensal.</div>${rows.length?`<div class="p57-usage-grid">${rows.slice(0,9).map(p57UsageCard).join('')}</div>`:'<div class="p57-empty">Ainda não há ações registradas neste período.</div>'}`;
}
function p57InstallUsage(){
  const board=document.getElementById('medalBoard');if(!board||document.getElementById('p57Usage'))return false;const box=document.createElement('section');box.id='p57Usage';box.className='p57-usage';box.innerHTML=`<div class="p57-usage-head"><div><h3>⚡ Quem movimentou o Carbonautas?</h3><p>Atividade diária, semanal e mensal — quem usou mais e para quê.</p></div><span class="spacer"></span><div class="p57-periods"><button type="button" data-mode="day">Hoje</button><button type="button" data-mode="week">Semana</button><button type="button" data-mode="month">Mês</button></div></div><div class="p57-usage-body"><div class="p57-empty">Carregando…</div></div>`;board.parentNode.insertBefore(box,board);box.querySelectorAll('.p57-periods button').forEach(b=>b.onclick=()=>p57RenderUsage(b.dataset.mode));p57RenderUsage('day');return true
}
function p57WatchMedals(){let n=0;const t=setInterval(()=>{n++;if(p57InstallUsage()||n>120)clearInterval(t)},500)}
function p57Boot(){p57Css();p57Arrival();p57WatchMedals();console.info('Carbonautas mobile + uso medalhas',VERSION,'carregado')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',p57Boot,{once:true});else p57Boot();
})();
