/* Carbonautas P59 · check-in grande + cards visuais no Repositório */
(function(){
'use strict';
const VERSION='P59';

function esc59(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function pad59(n){return String(n).padStart(2,'0')}
function day59(d=new Date()){return `${d.getFullYear()}-${pad59(d.getMonth()+1)}-${pad59(d.getDate())}`}
function mobile59(){const vv=window.visualViewport?.width||9999;const sw=window.screen?.width||9999;return Math.min(window.innerWidth||9999,vv,sw)<=900}

function css59(){
  if(document.getElementById('p59Style'))return;
  const s=document.createElement('style');s.id='p59Style';s.textContent=`
  /* ===== CHECK-IN DIÁRIO GRANDE ===== */
  .p59-checkin-backdrop{position:fixed;inset:0;z-index:2147483600;background:rgba(4,20,31,.34);backdrop-filter:blur(4px);display:grid;place-items:start center;padding:clamp(18px,8vh,70px) 14px;animation:p59fade .22s ease-out}
  .p59-checkin-card{position:relative;width:min(680px,calc(100vw - 28px));overflow:hidden;border-radius:28px;padding:28px 30px 24px;background:linear-gradient(135deg,#072b39 0%,#0b6d77 48%,#15a5a3 100%);color:#fff;border:1px solid rgba(255,255,255,.24);box-shadow:0 28px 80px rgba(2,24,34,.42);animation:p59pop .32s cubic-bezier(.2,.85,.25,1.2)}
  .p59-checkin-card:before{content:"";position:absolute;width:300px;height:300px;border-radius:50%;right:-100px;top:-170px;background:radial-gradient(circle,rgba(255,255,255,.30),transparent 66%);pointer-events:none}
  .p59-checkin-card:after{content:"";position:absolute;width:220px;height:220px;border-radius:50%;left:-120px;bottom:-150px;background:radial-gradient(circle,rgba(159,244,197,.30),transparent 68%);pointer-events:none}
  .p59-checkin-main{position:relative;z-index:1;display:grid;grid-template-columns:auto minmax(0,1fr);gap:18px;align-items:center}
  .p59-checkin-icon{width:82px;height:82px;border-radius:23px;display:grid;place-items:center;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.26);font-size:42px;box-shadow:inset 0 1px 0 rgba(255,255,255,.18)}
  .p59-checkin-kicker{font-size:12px;font-weight:950;letter-spacing:.12em;text-transform:uppercase;color:#b9fff0;margin-bottom:6px}
  .p59-checkin-title{font-family:Fraunces,Georgia,serif;font-size:clamp(30px,5vw,46px);line-height:1.02;font-weight:900;letter-spacing:-.02em;margin:0}
  .p59-checkin-sub{font-size:16px;font-weight:800;margin-top:9px;color:#e9ffff}.p59-checkin-time{margin-top:7px;font-size:12px;color:#bce0e4;font-weight:700}
  .p59-checkin-ok{position:relative;z-index:1;margin-top:20px;display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:15px;background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.18);font-size:13px;font-weight:850}
  .p59-checkin-ok b{font-size:17px}.p59-checkin-close{position:absolute;z-index:2;right:14px;top:14px;width:40px;height:40px;border:0;border-radius:13px;background:rgba(4,29,36,.22);color:#fff;font-size:22px;font-weight:900;cursor:pointer}
  .p59-checkin-bar{position:absolute;left:0;bottom:0;height:5px;width:100%;background:rgba(255,255,255,.22);overflow:hidden}.p59-checkin-bar:after{content:"";display:block;height:100%;background:#d7ff72;animation:p59timer 6.2s linear forwards}
  @keyframes p59fade{from{opacity:0}to{opacity:1}}@keyframes p59pop{from{opacity:0;transform:translateY(-18px) scale(.94)}to{opacity:1;transform:none}}@keyframes p59timer{from{width:100%}to{width:0}}
  @media(max-width:600px){
    .p59-checkin-backdrop{padding:70px 12px 12px;align-items:start}
    .p59-checkin-card{padding:24px 18px 20px;border-radius:24px}
    .p59-checkin-main{grid-template-columns:64px minmax(0,1fr);gap:13px}.p59-checkin-icon{width:64px;height:64px;border-radius:19px;font-size:32px}
    .p59-checkin-title{font-size:30px}.p59-checkin-sub{font-size:14px}.p59-checkin-ok{font-size:12px}.p59-checkin-ok b{font-size:15px}
  }

  /* ===== REPOSITÓRIO EM CARDS ===== */
  #pubList{display:grid!important;gap:16px!important;align-items:start!important}
  #viewPubs .pub-row.p59-card{
    --p59-accent:#5d71d9;
    position:relative!important;isolation:isolate!important;
    border:1.5px solid color-mix(in srgb,var(--p59-accent) 30%,#d6e1e7)!important;
    border-radius:20px!important;
    background:linear-gradient(140deg,color-mix(in srgb,var(--p59-accent) 9%,white) 0%,#fff 32%,#fff 100%)!important;
    box-shadow:0 9px 26px rgba(12,42,56,.09)!important;
    margin:0!important;padding:16px 16px 15px 23px!important;
    overflow:hidden!important;
  }
  #viewPubs .pub-row.p59-card:before{content:"";position:absolute;z-index:-1;right:-60px;top:-75px;width:190px;height:190px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--p59-accent) 16%,transparent),transparent 68%);pointer-events:none}
  #viewPubs .pub-row.p59-card .pub-cat{position:absolute!important;left:8px!important;top:13px!important;bottom:13px!important;width:6px!important;height:auto!important;border-radius:999px!important;background:var(--p59-accent)!important;box-shadow:0 0 0 3px color-mix(in srgb,var(--p59-accent) 9%,transparent)!important}
  #viewPubs .pub-row.p59-card .pub-t{font-weight:900!important;color:#102635!important;letter-spacing:-.01em!important}
  #viewPubs .pub-row.p59-card .pub-cat-tag{box-shadow:0 2px 7px color-mix(in srgb,var(--p59-accent) 18%,transparent)!important}
  #viewPubs .pub-row.p59-card .review-note{padding:8px 10px!important;border-radius:11px!important;background:#fff!important;border:1px solid #e1e9ed!important}
  #viewPubs .pub-row.p59-card .p54-history,
  #viewPubs .pub-row.p59-card .repo-sequence,
  #viewPubs .pub-row.p59-card .repo-seq{
    margin-top:12px!important;border:1px solid color-mix(in srgb,var(--p59-accent) 16%,#dfe8ec)!important;border-radius:14px!important;overflow:hidden!important;background:rgba(255,255,255,.88)!important;box-shadow:0 3px 10px rgba(12,42,56,.035)!important
  }
  #viewPubs .pub-row.p59-card .p54-head{background:color-mix(in srgb,var(--p59-accent) 7%,#f6fafb)!important}
  #viewPubs .pub-row.p59-card .p54-next,#viewPubs .pub-row.p59-card .repo-turn{border-top:1px solid color-mix(in srgb,var(--p59-accent) 20%,#e6dfb6)!important}
  #viewPubs .pub-row.p59-card .pub-act,
  #viewPubs .pub-row.p59-card .pub-act.p55-actions-grid{
    margin-top:13px!important;padding-top:12px!important;border-top:1px solid color-mix(in srgb,var(--p59-accent) 14%,#e3ebef)!important;
  }
  #viewPubs .pub-row.p59-card .pub-act button:not(.mini-x),
  #viewPubs .pub-row.p59-card .pub-act a{
    border-radius:11px!important;box-shadow:none!important;font-weight:850!important
  }
  #viewPubs .pub-row.p59-review-card{--p59-accent:#6a55e8}
  #viewPubs .pub-row.p59-data-card{--p59-accent:#168dc0}
  #viewPubs .pub-row.p59-project-card{--p59-accent:#14966b}
  #viewPubs .pub-row.p59-doc-card{--p59-accent:#697b86}
  #viewPubs .pub-row.p59-event-card{--p59-accent:#a057d1}
  #viewPubs .pub-row.p59-card:hover{transform:translateY(-1px);box-shadow:0 12px 30px rgba(12,42,56,.12)!important}

  @media(max-width:900px){
    #pubList{gap:14px!important}
    #viewPubs .pub-row.p59-card{padding:14px 11px 13px 20px!important;border-radius:17px!important;box-shadow:0 7px 20px rgba(12,42,56,.10)!important}
    #viewPubs .pub-row.p59-card .pub-cat{left:7px!important;top:11px!important;bottom:11px!important;width:5px!important}
    #viewPubs .pub-row.p59-card .pub-t{font-size:14px!important;line-height:1.25!important}
    #viewPubs .pub-row.p59-card .pub-act,#viewPubs .pub-row.p59-card .pub-act.p55-actions-grid{margin-top:11px!important;padding-top:10px!important}
  }
  `;document.head.appendChild(s);
}

function inferAccent(card){
  const cat=card.querySelector('.pub-cat');
  let c=(cat?.style?.background||cat?.style?.backgroundColor||'').trim();
  if(!c){try{c=getComputedStyle(cat).backgroundColor}catch(_e){}}
  return c||'#5d71d9';
}
function classify(card){
  const txt=(card.textContent||'').toLowerCase();
  card.classList.remove('p59-review-card','p59-data-card','p59-project-card','p59-doc-card','p59-event-card');
  if(/corrigir|devolver correção|devolver correcao|enviou para correção|enviou para correcao/.test(txt))card.classList.add('p59-review-card');
  else if(/dados\s*\/\s*planilha|planilha|base de dados|csv|excel/.test(txt))card.classList.add('p59-data-card');
  else if(/projeto|pesquisa/.test(txt))card.classList.add('p59-project-card');
  else if(/resumo|evento|sapi|congresso/.test(txt))card.classList.add('p59-event-card');
  else card.classList.add('p59-doc-card');
}
function decorateRepo(){
  document.querySelectorAll('#viewPubs .pub-row').forEach(card=>{
    card.classList.add('p59-card');
    const accent=inferAccent(card);card.style.setProperty('--p59-accent',accent);
    classify(card);
  });
}

function showCheckin(){
  let tries=0;const t=setInterval(()=>{
    tries++;
    const uid=window.auth?.currentUser?.uid||'';
    if(!uid&&tries<40)return;
    clearInterval(t);if(!uid)return;
    const key=`carbonautas_checkin_big_${uid}_${day59()}`;
    if(localStorage.getItem(key))return;
    localStorage.setItem(key,'1');
    document.querySelectorAll('.p57-arrival,.p59-checkin-backdrop').forEach(x=>x.remove());
    const now=new Date();
    const when=now.toLocaleString('pt-BR',{weekday:'long',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
    const el=document.createElement('div');el.className='p59-checkin-backdrop';
    el.innerHTML=`<section class="p59-checkin-card" role="status" aria-live="polite"><button class="p59-checkin-close" type="button" aria-label="Fechar">×</button><div class="p59-checkin-main"><div class="p59-checkin-icon">✅</div><div><div class="p59-checkin-kicker">Check-in diário registrado</div><h2 class="p59-checkin-title">Tcheguei Hodje Xomano!</h2><div class="p59-checkin-sub">Seu check-in de hoje foi feito com sucesso.</div><div class="p59-checkin-time">${esc59(when)}</div></div></div><div class="p59-checkin-ok"><b>⚡ Presença marcada</b><span>Agora bora movimentar ciência, projeto e entrega.</span></div><div class="p59-checkin-bar"></div></section>`;
    const close=()=>{el.style.opacity='0';el.style.transition='.22s';setTimeout(()=>el.remove(),230)};
    el.querySelector('.p59-checkin-close').onclick=close;el.addEventListener('click',e=>{if(e.target===el)close()});document.body.appendChild(el);setTimeout(close,6400);
  },250);
}

function boot(){css59();decorateRepo();showCheckin();setInterval(decorateRepo,800);console.info('Carbonautas',VERSION,'check-in e cards carregados');}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
