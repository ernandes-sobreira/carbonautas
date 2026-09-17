/* Carbonautas P87 · Painel só renderiza quando os dados reais mudam */
(function(){
'use strict';
const BUILD='P87';
let installed=false,lastSig='',lastRun=0;

function ms(v){
  try{if(!v)return 0;if(typeof v.toMillis==='function')return v.toMillis();if(typeof v.seconds==='number')return v.seconds*1000;const n=+new Date(v);return Number.isFinite(n)?n:0}catch(_e){return 0}
}
function appState(){try{return state}catch(_e){return null}}
function uid(){return String(window.auth?.currentUser?.uid||'anon')}
function ackRaw(){try{return localStorage.getItem(`carbonautas_p56_panel_done_${uid()}`)||'{}'}catch(_e){return'{}'}}
function followRaw(){try{return localStorage.getItem('carbonautas_panel_followups_v1')||'{}'}catch(_e){return'{}'}}
function signature(){
  const s=appState();if(!s)return 'nostate|'+ackRaw()+'|'+followRaw();
  const acts=(s.activities||[]).map(a=>[
    String(a.id||''),String(a.ownerId||''),String(a.type||''),String(a.status||''),Number(a.progress||0),String(a.dueDate||''),
    String(a.title||''),String(a.checkinMonth||''),String(a.checkinNext||''),String(a.description||''),ms(a.updatedAt),ms(a.createdAt)
  ]).sort((a,b)=>String(a[0]).localeCompare(String(b[0])));
  const pubs=(s.publicacoes||[]).filter(p=>p.reviewFlow).map(p=>[
    String(p.id||''),String(p.reviewThreadId||''),Number(p.reviewVersion||0),String(p.reviewStatus||''),String(p.reviewNextRecipientId||''),
    String(p.memberId||''),String(p.titulo||p.fileName||''),ms(p.updatedAt),ms(p.createdAt)
  ]).sort((a,b)=>String(a[0]).localeCompare(String(b[0])));
  const members=(s.members||[]).map(m=>[
    String(m.id||''),String(m.nome||''),String(m.status||''),String(m.nivel||''),!!m.bolsista,String(m.bolsaFim||''),String(m.bolsaInicio||''),
    String(m.perguntaCientifica||m.pergunta||''),String(m.intervencao||''),ms(m.updatedAt)
  ]).sort((a,b)=>String(a[0]).localeCompare(String(b[0])));
  return JSON.stringify([acts,pubs,members,ackRaw(),followRaw(),new Date().toISOString().slice(0,10)]);
}
function panelMissing(){
  const a=document.getElementById('dashAttention'),k=document.getElementById('dashKpis');
  return !a||!k||!a.children.length||!k.children.length;
}
function canonicalize(){
  try{const u=new URL(location.href);if(u.searchParams.get('build')!==BUILD){u.searchParams.set('build',BUILD);u.searchParams.delete('pwa');history.replaceState(null,'',u.href)}}catch(_e){}
  window.CARBONAUTAS_RUNTIME_BUILD=BUILD;
}
function install(){
  canonicalize();
  if(installed)return;
  const original=window.renderPainel;
  if(typeof original!=='function'){setTimeout(install,120);return}
  if(original.__p87Stable){installed=true;return}
  const stable=function(){
    const sig=signature(),force=panelMissing();
    if(!force&&sig===lastSig)return;
    lastSig=sig;lastRun=Date.now();
    return original.apply(this,arguments);
  };
  stable.__p87Stable=true;stable.__p87Original=original;
  try{renderPainel=stable}catch(_e){}
  window.renderPainel=stable;
  installed=true;
  // Render inicial único; depois somente mudança real de dados.
  try{stable()}catch(_e){}
  console.info('Carbonautas P87 Painel estável: render somente quando dados mudam');
}

// Se algum patch antigo substituir renderPainel depois, recupera o guard sem ficar redesenhando o DOM.
setInterval(()=>{
  canonicalize();
  const r=window.renderPainel;
  if(typeof r==='function'&&!r.__p87Stable){installed=false;lastSig='';install()}
},1800);

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
