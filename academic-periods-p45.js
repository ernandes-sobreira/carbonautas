/* Carbonautas · P45 · novos períodos acadêmicos (IC, IE, IT e Projeto) */
(function(){
'use strict';
const VERSION='P45';
const $=s=>document.querySelector(s);
const TYPES={
  ic:{label:'IC · Iniciação Científica',icon:'🔬',title:'Iniciação Científica (IC)'},
  ie:{label:'IE · Iniciação à Extensão',icon:'🤝',title:'Iniciação à Extensão (IE)'},
  it:{label:'IT · Iniciação Tecnológica',icon:'💡',title:'Iniciação Tecnológica (IT)'},
  projeto_periodo:{label:'Projeto de pesquisa',icon:'📁',title:'Projeto de pesquisa'}
};

function registerTypes(){
  try{
    if(typeof ACTIVITY_TYPES!=='undefined'){
      ACTIVITY_TYPES.ic=TYPES.ic.label;
      ACTIVITY_TYPES.ie=TYPES.ie.label;
      ACTIVITY_TYPES.it=TYPES.it.label;
      ACTIVITY_TYPES.projeto_periodo=TYPES.projeto_periodo.label;
    }
    if(typeof TRACK_ICONS!=='undefined'){
      TRACK_ICONS.ic=TYPES.ic.icon;TRACK_ICONS.ie=TYPES.ie.icon;TRACK_ICONS.it=TYPES.it.icon;TRACK_ICONS.projeto_periodo=TYPES.projeto_periodo.icon;
    }
    if(typeof TRACK_PERIOD_TYPES!=='undefined'){
      ['ic','ie','it','projeto_periodo'].forEach(t=>TRACK_PERIOD_TYPES.add(t));
    }
  }catch(e){console.warn('P45 register types',e)}
}

function addSelectOptions(){
  const sel=$('#activityType');if(!sel)return;
  const anchor=sel.querySelector('option[value="orientacao"]');
  Object.entries(TYPES).forEach(([value,meta])=>{
    if(sel.querySelector(`option[value="${value}"]`))return;
    const o=document.createElement('option');o.value=value;o.textContent=meta.label;
    if(anchor)sel.insertBefore(o,anchor);else sel.appendChild(o);
  });
  if(!sel.dataset.p45labels){
    sel.addEventListener('change',updatePeriodLabels);
    sel.dataset.p45labels='1';
  }
  updatePeriodLabels();
}

function updatePeriodLabels(){
  const sel=$('#activityType'),type=sel?.value||'';
  const start=$('#activityStart')?.closest('.fg')?.querySelector('label');
  const due=$('#activityDue')?.closest('.fg')?.querySelector('label');
  const isCustom=!!TYPES[type];
  if(start)start.textContent=isCustom?(type==='projeto_periodo'?'Início do projeto':'Início do período'):'Início / data de orientação';
  if(due)due.textContent=isCustom?(type==='projeto_periodo'?'Fim previsto do projeto':'Fim do período'):'Fim / prazo';
  if(isCustom){
    const name=$('#activityName');
    if(name&&!name.value)name.placeholder=type==='projeto_periodo'?'Ex.: Projeto de monitoramento microclimático':`Ex.: ${TYPES[type].title}`;
  }
}

function memberIdFromSection(section){
  if(!section)return'';
  for(const el of section.querySelectorAll('[onclick]')){
    const s=el.getAttribute('onclick')||'';
    let m=s.match(/openActivity\(null\s*,\s*['\"]([^'\"]+)['\"]\)/);if(m)return m[1];
    m=s.match(/openDossier\(['\"]([^'\"]+)['\"]\)/);if(m)return m[1];
    m=s.match(/openMemberRepository\(['\"]([^'\"]+)['\"]\)/);if(m)return m[1];
  }
  return'';
}

function openCustomPeriod(memberId,type){
  const section=[...document.querySelectorAll('#trackGrid .track-person')].find(x=>memberIdFromSection(x)===memberId);
  const reg=[...(section?.querySelectorAll('button[onclick]')||[])].find(x=>(x.getAttribute('onclick')||'').includes('openActivity(null'));
  if(!reg)return;
  reg.click();
  setTimeout(()=>{
    addSelectOptions();
    const sel=$('#activityType');if(sel){sel.value=type;sel.dispatchEvent(new Event('change',{bubbles:true}))}
    const name=$('#activityName');if(name&&!name.value)name.value=TYPES[type]?.title||'';
    const status=$('#activityStatus');if(status&&!status.value)status.value='andamento';
    $('#activityStart')?.focus();
  },80);
}

function enhancePicker(){
  const p=$('#p44PeriodPicker'),box=p?.querySelector('.p44-options');if(!p||!box)return;
  const defs=[
    ['ic','🔬 IC','Iniciação Científica · início e fim'],
    ['ie','🤝 IE','Iniciação à Extensão · início e fim'],
    ['it','💡 IT','Iniciação Tecnológica · início e fim'],
    ['projeto_periodo','📁 Projeto','Datas do projeto de pesquisa']
  ];
  defs.forEach(([type,label,help])=>{
    if(box.querySelector(`[data-p45type="${type}"]`))return;
    const b=document.createElement('button');b.type='button';b.className='p44-option';b.dataset.p45type=type;b.innerHTML=`${label}<small>${help}</small>`;
    b.addEventListener('click',()=>{
      const id=p.dataset.memberId||'';p.style.display='none';p.dataset.memberId='';if(id)openCustomPeriod(id,type);
    });
    box.appendChild(b);
  });
  const help=p.querySelector('.p44-help');if(help)help.textContent='Adicione períodos acadêmicos e as datas dos projetos. O próprio aluno pode registrar os períodos dele; a coordenação pode registrar para qualquer pessoa.';
}

function boot(){
  registerTypes();addSelectOptions();enhancePicker();
  setTimeout(()=>{registerTypes();addSelectOptions();enhancePicker();try{if(typeof renderTrack==='function')renderTrack()}catch(e){}},400);
  setInterval(()=>{registerTypes();addSelectOptions();enhancePicker()},1800);
  console.info('Carbonautas períodos acadêmicos',VERSION,'carregado');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
