/* Carbonautas P87 · Painel estável + saúde baseada em evidência real */
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

function evidenceMemberHealth(m){
  try{
    const s=appState()||{},acts=(s.activities||[]).filter(a=>a.ownerId===m.id),now=Date.now();
    let points=0,reasons=[];
    const overdue=acts.filter(a=>{try{return _isOverdue(a)}catch(_e){return false}});
    if(overdue.length){points+=4;reasons.push(`${overdue.length} item(ns) atrasado(s)`)}
    const corrections=acts.filter(a=>{try{return a.type==='correcao'&&!_activityDone(a)}catch(_e){return false}});
    if(corrections.length){points+=Math.min(3,corrections.length);reasons.push(`${corrections.length} correção(ões) pendente(s)`)}
    const next=acts.filter(a=>{try{return !_activityDone(a)&&a.dueDate}catch(_e){return false}}).map(a=>{try{return {a,di:dateInfo(a.dueDate)}}catch(_e){return {a,di:null}}}).filter(x=>x.di&&x.di.diff>=0&&x.di.diff<=14);
    if(next.length){points+=2;reasons.push(`${next.length} prazo(s) em até 14 dias`)}
    if(m.bolsista&&m.bolsaFim){
      try{const pi=trackPeriodInfo(m.bolsaInicio,m.bolsaFim);if(pi.days!==null&&pi.days>=0&&pi.days<=45){points+=2;reasons.push('bolsa encerrando em breve')}}catch(_e){}
    }
    if(m.status!=='egresso'){
      let mk='';try{mk=monthKey()}catch(_e){}
      const check=mk?acts.find(a=>a.type==='checkin'&&a.checkinMonth===mk):null;
      if(!check){
        points+=2;
        let label='mês atual';try{label=monthLabel(mk)}catch(_e){}
        reasons.push(`check-in de ${label} pendente`);
      }
      let lm=0;
      try{lm=acts.length?Math.max(0,...acts.map(a=>_activityTime(a))):0}catch(_e){lm=0}
      if(!acts.length){
        reasons.push('nenhuma atividade registrada');
      }else if(lm&&now-lm>45*86400000){
        points+=1;reasons.push('sem atualização há mais de 45 dias');
      }
      if(!(m.perguntaCientifica||'').trim()){points+=1;reasons.push('pergunta científica não preenchida')}
    }
    const level=points>=4?'red':points>=2?'yellow':'green';
    return {level,points,reasons:reasons.length?reasons:['em dia']};
  }catch(e){
    console.warn('P87 saúde baseada em evidência',e);
    return {level:'yellow',points:2,reasons:['situação ainda não calculada']};
  }
}
function installEvidenceHealth(){
  try{memberHealth=evidenceMemberHealth}catch(_e){}
  window.memberHealth=evidenceMemberHealth;
}

function install(){
  canonicalize();
  installEvidenceHealth();
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
  try{stable()}catch(_e){}
  setTimeout(()=>{try{if(typeof renderTrack==='function')renderTrack()}catch(_e){}},350);
  console.info('Carbonautas P87 Painel estável + saúde exige evidência real');
}

setInterval(()=>{
  canonicalize();
  installEvidenceHealth();
  const r=window.renderPainel;
  if(typeof r==='function'&&!r.__p87Stable){installed=false;lastSig='';install()}
},1800);

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
