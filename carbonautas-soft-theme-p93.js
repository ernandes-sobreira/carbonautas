/* Carbonautas P93 · tema global soft/regenerativo · SOMENTE VISUAL */
(function(){
'use strict';
const BUILD='P93';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
function ensureCss(){if($('#carbonautasSoftThemeP93'))return;const l=document.createElement('link');l.id='carbonautasSoftThemeP93';l.rel='stylesheet';l.href='./carbonautas-soft-theme-p93.css?v=P93-20260918';document.head.appendChild(l)}
function useSoftMark(){$$('.brand .logo-img,.app-menu-logo,.loading .logo-img').forEach(img=>{if(img.dataset.softMark==='1')return;img.dataset.softMark='1';img.src='./carbonautas-soft-mark.svg?v=P93-20260918';img.alt='Carbonautas'})}
function setText(el,text){if(el&&el.textContent!==text)el.textContent=text}
function relabel(){
  setText($('.tab[data-view="rede"] .tl'),'Galera');
  setText($('.tab[data-view="pubs"] .tl'),'Arquivo');
  const appRepo=$('.app-nav-card[data-app-view="pubs"] b');if(appRepo)setText(appRepo,'Arquivo Vivo');
  const appPeople=$('.app-nav-card[data-app-view="rede"] b');if(appPeople)setText(appPeople,'Galera');
  const repoTitle=$('#repoMainTitle');if(repoTitle&&['Repositório','Repositório Geral','Arquivo'].includes(repoTitle.textContent.trim()))setText(repoTitle,'Arquivo Vivo');
  const repoSub=$('#repoMainSubtitle');if(repoSub)setText(repoSub,'Documentos, dados e produção científica da Rede.');
  const addFolder=$('#addRepoPackageBtn');if(addFolder)setText(addFolder,'📁 Nova pasta');
  const p1=$('#repoPersonalNewFolderBtn');if(p1)setText(p1,'📁 Nova pasta + arquivos');
  const p2=$('#repoPersonalNewFolderBtn2');if(p2)setText(p2,'📁 Criar pasta');
  const search=$('#search');if(search)search.placeholder='Buscar na galera, tema ou linha';
}
function icon(path){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`}
function ensureBottomNav(){
  if($('#softBottomNav'))return;
  const nav=document.createElement('nav');nav.id='softBottomNav';nav.className='soft-bottom-nav';nav.setAttribute('aria-label','Atalhos principais');
  nav.innerHTML=`<button type="button" data-soft-view="painel">${icon('M3 11.5 12 4l9 7.5V21H6v-6h12v6')}<span class="soft-nav-label">Painel</span></button><button type="button" data-soft-view="pubs">${icon('M4 5.5A2.5 2.5 0 0 1 6.5 3H10l2 2h5.5A2.5 2.5 0 0 1 20 7.5V19H4Z')}<span class="soft-nav-label">Arquivo</span></button><button type="button" data-soft-view="rede">${icon('M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75')}<span class="soft-nav-label">Galera</span></button><button type="button" data-soft-view="mensagens">${icon('M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z')}<span class="soft-nav-label">Conversas</span></button>`;
  document.body.appendChild(nav);
  nav.querySelectorAll('[data-soft-view]').forEach(b=>b.addEventListener('click',()=>{const v=b.dataset.softView;try{if(typeof window.switchView==='function')window.switchView(v);else document.querySelector(`.tab[data-view="${v}"]`)?.click()}catch(e){console.warn('P93 nav',e)}try{window.closeAppMenu?.()}catch(_e){}updateBottomNav()}));
}
function updateBottomNav(){const v=document.body.dataset.view||'painel';$$('#softBottomNav [data-soft-view]').forEach(b=>b.classList.toggle('on',b.dataset.softView===v))}
function visualCleanup(){const d=$('#repoDedupeBtn');if(d)d.style.display='none';document.body.classList.add('carbonautas-soft-p93');const meta=$('meta[name="theme-color"]');if(meta)meta.setAttribute('content','#F6FAF9')}
function refresh(){ensureCss();useSoftMark();relabel();ensureBottomNav();updateBottomNav();visualCleanup()}
function boot(){refresh();const obs=new MutationObserver(()=>{relabel();useSoftMark();visualCleanup();updateBottomNav()});obs.observe(document.body,{attributes:true,attributeFilter:['data-view']});window.addEventListener('resize',updateBottomNav,{passive:true});try{const u=new URL(location.href);if(u.searchParams.get('build')!==BUILD){u.searchParams.set('build',BUILD);u.searchParams.delete('pwa');history.replaceState(null,'',u.href)}}catch(_e){}window.CARBONAUTAS_RUNTIME_BUILD=BUILD;console.info('Carbonautas P93 tema soft global carregado')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
