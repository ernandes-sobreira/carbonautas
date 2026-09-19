from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')
if 'p145QuickActionsStyle' in s:
    print('P145 already applied')
    raise SystemExit(0)

# 1) Destaques não podem mais se ancorar no hero, porque o hero será recolhido em Atalhos rápidos.
old_panel="""function ensurePanel(){
  let host=$('#p117Highlights');if(host)return host;
  host=document.createElement('section');host.id='p117Highlights';
  const hero=$('#viewPainel .dash-hero');
  if(hero)hero.insertAdjacentElement('afterend',host);else $('#viewPainel .dash-wrap')?.prepend(host);
  return host;
}
function relocatePanel(){const host=$('#p117Highlights'),hero=$('#viewPainel .dash-hero');if(host&&hero&&hero.nextElementSibling!==host)hero.insertAdjacentElement('afterend',host)}"""
new_panel="""function ensurePanel(){
  let host=$('#p117Highlights');if(host)return host;
  host=document.createElement('section');host.id='p117Highlights';
  const home=$('#viewPainel .p142-home-grid');
  if(home)home.insertAdjacentElement('beforebegin',host);else $('#viewPainel .dash-wrap')?.prepend(host);
  return host;
}
function relocatePanel(){const host=$('#p117Highlights'),home=$('#viewPainel .p142-home-grid');if(host&&home&&home.previousElementSibling!==host)home.insertAdjacentElement('beforebegin',host)}"""
if s.count(old_panel)!=1:
    raise SystemExit(f'P117 panel block match count={s.count(old_panel)}')
s=s.replace(old_panel,new_panel,1)

# 2) Acrescenta estilo específico para o antigo hero quando estiver dentro do acordeão de atalhos.
style_anchor="""#viewPainel .p144-today .p78-actions{margin-top:10px!important}
#viewPainel .p142-command-card>.p142-accordion:nth-of-type(1) .p142-icon"""
style_replacement="""#viewPainel .p144-today .p78-actions{margin-top:10px!important}
#viewPainel .p145-quick .p142-body{padding-top:4px!important}
#viewPainel .p145-quick .dash-hero{border:0!important;background:transparent!important;box-shadow:none!important;border-radius:0!important;margin:0!important;padding:2px 0 4px!important;width:100%!important;max-width:none!important;min-height:0!important}
#viewPainel .p145-quick .dash-hero>div:first-child{display:none!important}
#viewPainel .p145-quick .dash-hero .dash-hero-actions{margin:0!important;width:100%!important}
#viewPainel .p145-quick .dash-hero-actions .btn{min-height:44px!important}
#viewPainel .p142-command-card>.p142-accordion:nth-of-type(1) .p142-icon"""
if s.count(style_anchor)!=1:
    raise SystemExit(f'P144 style anchor count={s.count(style_anchor)}')
s=s.replace(style_anchor,style_replacement,1)

# 3) Transforma o hero grande em "Atalhos rápidos", preservando o elemento e todos os IDs/botões existentes.
old_wrap="""  function wrapToday(){
    const card=q('#p78TodayCard'),command=q('#viewPainel .p142-command-card');
    if(!card||!command)return false;
    let wrap=q('#p144TodayDetails');
    if(!wrap){
      wrap=document.createElement('details');
      wrap.id='p144TodayDetails';
      wrap.className='p142-accordion p144-today';
      wrap.innerHTML='<summary><span class=\"p142-icon\">🔔</span><span class=\"p142-label\"><b>Hoje no Carbonautas</b><small>Novidades e mudanças desde seu último acesso.</small></span><span class=\"p142-toggle\"><span class=\"p142-show\">Ver</span><span class=\"p142-hide\">Fechar</span></span></summary><div class=\"p142-body p144-today-body\"></div>';
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
  }"""
new_wrap="""  function wrapQuickActions(){
    const hero=q('#viewPainel .dash-hero'),command=q('#viewPainel .p142-command-card');
    if(!hero||!command)return false;
    let wrap=q('#p145QuickActions');
    if(!wrap){
      wrap=document.createElement('details');
      wrap.id='p145QuickActions';
      wrap.className='p142-accordion p145-quick';
      wrap.innerHTML='<summary><span class=\"p142-icon\">⚙️</span><span class=\"p142-label\"><b>Atalhos rápidos</b><small>Check-in, produto, dossiê e backup.</small></span><span class=\"p142-toggle\"><span class=\"p142-show\">Ver</span><span class=\"p142-hide\">Fechar</span></span></summary><div class=\"p142-body p145-quick-body\"></div>';
    }
    const body=q('.p145-quick-body',wrap);
    if(body&&hero.parentElement!==body)body.appendChild(hero);
    const first=q(':scope > .p142-accordion',command);
    if(first&&first.nextElementSibling!==wrap)first.insertAdjacentElement('afterend',wrap);
    return true;
  }
  function wrapToday(){
    const card=q('#p78TodayCard'),command=q('#viewPainel .p142-command-card');
    if(!card||!command)return false;
    let wrap=q('#p144TodayDetails');
    if(!wrap){
      wrap=document.createElement('details');
      wrap.id='p144TodayDetails';
      wrap.className='p142-accordion p144-today';
      wrap.innerHTML='<summary><span class=\"p142-icon\">🔔</span><span class=\"p142-label\"><b>Hoje no Carbonautas</b><small>Novidades e mudanças desde seu último acesso.</small></span><span class=\"p142-toggle\"><span class=\"p142-show\">Ver</span><span class=\"p142-hide\">Fechar</span></span></summary><div class=\"p142-body p144-today-body\"></div>';
    }
    const body=q('.p144-today-body',wrap);
    if(body&&card.parentElement!==body)body.appendChild(card);
    const quick=q('#p145QuickActions');
    if(quick&&quick.nextElementSibling!==wrap)quick.insertAdjacentElement('afterend',wrap);
    return true;
  }
  function arrange(){
    const high=q('#p117Highlights'),home=q('#viewPainel .p142-home-grid');
    const quick=wrapQuickActions();
    if(high&&home&&home.previousElementSibling!==high)home.insertAdjacentElement('beforebegin',high);
    return quick&&wrapToday()&&!!high&&!!home;
  }"""
if s.count(old_wrap)!=1:
    raise SystemExit(f'P144 controller block match count={s.count(old_wrap)}')
s=s.replace(old_wrap,new_wrap,1)

# Marker sem criar outro script/observer/timer: a alteração fica dentro do controlador P144 já existente.
marker="""<style id=\"p144HomeOrderStyle\">"""
if s.count(marker)!=1:
    raise SystemExit('P144 style marker missing')
s=s.replace(marker,"""<style id=\"p144HomeOrderStyle\">\n/* p145QuickActionsStyle · hero recolhido como Atalhos rápidos */""",1)

# Validações de segurança estrutural.
for rid in ['dashNewTaskBtn','dashAttention','dashHealth','dashProductsAllBtn','dashProducts','dashCheckin','dashBackupBtn']:
    count=s.count(f'id=\"{rid}\"')
    if count!=1:
        raise SystemExit(f'{rid} id count invalid: {count}')
if s.count('p145QuickActions') < 2:
    raise SystemExit('P145 quick actions controller not present')
if "function relocatePanel(){const host=$('#p117Highlights'),home=$('#viewPainel .p142-home-grid')" not in s:
    raise SystemExit('P117 still not anchored to home grid')

p.write_text(s,encoding='utf-8')
