from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')
if 'p144HomeOrderStyle' in s:
    print('P144 already applied')
    raise SystemExit(0)

old_today="function relocateToday(){const hero=q('#viewPainel .dash-hero'),card=q('#p78TodayCard');if(hero&&card&&hero.nextElementSibling!==card)hero.insertAdjacentElement('afterend',card)}"
new_today="function relocateToday(){return}"
if s.count(old_today)!=1:
    raise SystemExit(f'relocateToday match count={s.count(old_today)}')
s=s.replace(old_today,new_today,1)

old_panel="""function ensurePanel(){
  let host=$('#p117Highlights');if(host)return host;
  host=document.createElement('section');host.id='p117Highlights';
  const anchor=$('#p78TodayCard')||$('#dashKpis')?.previousElementSibling||$('.dash-hero');
  if(anchor)anchor.insertAdjacentElement('afterend',host);else $('#viewPainel .dash-wrap')?.prepend(host);
  return host;
}
function relocatePanel(){const host=$('#p117Highlights'),anchor=$('#p78TodayCard');if(host&&anchor&&anchor.nextElementSibling!==host)anchor.insertAdjacentElement('afterend',host)}"""
new_panel="""function ensurePanel(){
  let host=$('#p117Highlights');if(host)return host;
  host=document.createElement('section');host.id='p117Highlights';
  const hero=$('#viewPainel .dash-hero');
  if(hero)hero.insertAdjacentElement('afterend',host);else $('#viewPainel .dash-wrap')?.prepend(host);
  return host;
}
function relocatePanel(){const host=$('#p117Highlights'),hero=$('#viewPainel .dash-hero');if(host&&hero&&hero.nextElementSibling!==host)hero.insertAdjacentElement('afterend',host)}"""
if s.count(old_panel)!=1:
    raise SystemExit(f'P117 panel block match count={s.count(old_panel)}')
s=s.replace(old_panel,new_panel,1)

block=r'''
<style id="p144HomeOrderStyle">
/* P144 · Destaques primeiro; Atenção depois; resumo Hoje no mesmo padrão das pastas */
#viewPainel #p117Highlights{margin-bottom:12px!important}
#viewPainel .p142-home-grid{margin-top:0!important}
#viewPainel .p144-today #p78TodayCard{border:0!important;background:transparent!important;box-shadow:none!important;border-radius:0!important;margin:0!important;padding:0!important;width:100%!important;max-width:none!important}
#viewPainel .p144-today #p78TodayCard .p78-head{display:none!important}
#viewPainel .p144-today .p142-body{padding-top:4px!important}
#viewPainel .p144-today .p78-sec{margin-top:10px!important}
#viewPainel .p144-today .p78-sec:first-child{margin-top:6px!important}
#viewPainel .p144-today .p78-row{border:1px solid #dfeae8!important;border-radius:16px!important;background:#fff!important;box-shadow:none!important;margin:7px 0!important}
#viewPainel .p144-today .p78-next{border-radius:15px!important;background:#f5f9f8!important;border:1px solid #e0ebe9!important}
#viewPainel .p144-today .p78-actions{margin-top:10px!important}
#viewPainel .p142-command-card>.p142-accordion:nth-of-type(1) .p142-icon{background:#fff8e9!important;border-color:#f4dfae!important}
#viewPainel .p142-command-card>.p142-accordion:nth-of-type(2) .p142-icon{background:#eaf7fb!important;border-color:#d2e8f0!important}
#viewPainel .p142-command-card>.p142-accordion:nth-of-type(3) .p142-icon{background:#eaf8f1!important;border-color:#cfe9dc!important}
#viewPainel .p142-command-card>.p142-accordion:nth-of-type(4) .p142-icon{background:#f2edfb!important;border-color:#e0d7f2!important}
#viewPainel .p142-command-card>.p142-accordion:nth-of-type(5) .p142-icon{background:#eef6fb!important;border-color:#d9e8f2!important}
@media(max-width:700px){
  #viewPainel #p117Highlights{margin-bottom:10px!important}
  #viewPainel .p144-today .p78-row{padding:11px 10px!important}
  #viewPainel .p144-today .p78-main span{font-size:11px!important;line-height:1.35!important}
}
</style>
<script id="p144HomeOrderController">
(()=>{
  'use strict';
  const q=(s,r=document)=>r.querySelector(s);
  function wrapToday(){
    const card=q('#p78TodayCard'),command=q('#viewPainel .p142-command-card');
    if(!card||!command)return false;
    let wrap=q('#p144TodayDetails');
    if(!wrap){
      wrap=document.createElement('details');
      wrap.id='p144TodayDetails';
      wrap.className='p142-accordion p144-today';
      wrap.innerHTML='<summary><span class="p142-icon">🔔</span><span class="p142-label"><b>Hoje no Carbonautas</b><small>Novidades e mudanças desde seu último acesso.</small></span><span class="p142-toggle"><span class="p142-show">Ver</span><span class="p142-hide">Fechar</span></span></summary><div class="p142-body p144-today-body"></div>';
    }
    const body=q('.p144-today-body',wrap);
    if(body&&card.parentElement!==body)body.appendChild(card);
    const first=q(':scope > .p142-accordion',command);
    if(first&&first.nextElementSibling!==wrap)first.insertAdjacentElement('afterend',wrap);
    return true;
  }
  function arrange(){
    const hero=q('#viewPainel .dash-hero'),high=q('#p117Highlights'),home=q('#viewPainel .p142-home-grid');
    if(hero&&high&&hero.nextElementSibling!==high)hero.insertAdjacentElement('afterend',high);
    if(high&&home&&high.nextElementSibling!==home)high.insertAdjacentElement('afterend',home);
    return wrapToday()&&!!high&&!!home;
  }
  function boot(){
    if(arrange())return;
    const root=q('#viewPainel')||document.body;
    const ob=new MutationObserver(()=>{if(arrange())ob.disconnect()});
    ob.observe(root,{childList:true,subtree:true});
    setTimeout(()=>{arrange();ob.disconnect()},6000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
</script>
'''
pos=s.rfind('</body>')
if pos<0:
    raise SystemExit('final body close not found')
s=s[:pos]+block+'\n'+s[pos:]

for rid in ['dashNewTaskBtn','dashAttention','dashHealth','dashProductsAllBtn','dashProducts','dashCheckin']:
    count=s.count(f'id="{rid}"')
    if count!=1:
        raise SystemExit(f'{rid} id count invalid: {count}')
if 'setInterval' in block:
    raise SystemExit('P144 must not add intervals')
if s.count('id="p144TodayDetails"'):
    raise SystemExit('wrapper must be created dynamically, not duplicate static id')

p.write_text(s,encoding='utf-8')
