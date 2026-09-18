/* Carbonautas P95 · identidade soft/regenerativa + entrada · SOMENTE VISUAL */
(function(){
'use strict';
const BUILD='P95';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
function ensureCss(){
  if(!$('#carbonautasSoftThemeP93')){const l=document.createElement('link');l.id='carbonautasSoftThemeP93';l.rel='stylesheet';l.href='./carbonautas-soft-theme-p93.css?v=P93-20260918';document.head.appendChild(l)}
  if(!$('#carbonautasIdentityP94')){const l=document.createElement('link');l.id='carbonautasIdentityP94';l.rel='stylesheet';l.href='./carbonautas-identity-p94.css?v=P94-20260918';document.head.appendChild(l)}
  if(!$('#carbonautasEntryP95')){const l=document.createElement('link');l.id='carbonautasEntryP95';l.rel='stylesheet';l.href='./carbonautas-entry-p95.css?v=P95-20260918';document.head.appendChild(l)}
}
function useSoftMark(){$$('.brand .logo-img,.app-menu-logo,.loading .logo-img,.auth-brand .logo-img').forEach(img=>{if(img.dataset.softMark==='P95')return;img.dataset.softMark='P95';img.src='./carbonautas-soft-mark.svg?v=P95-20260918';img.alt='Carbonautas · carbono, regeneração, rede e navegação'})}
function setText(el,text){if(el&&el.textContent!==text)el.textContent=text}
function setIf(el,from,to){if(el&&String(el.textContent||'').trim()===from)setText(el,to)}
function relabel(){
  setText($('.tab[data-view="rede"] .tl'),'Galera');
  setText($('.tab[data-view="pubs"] .tl'),'Arquivo');
  setText($('.tab[data-view="mensagens"] .tl'),'Fofoca científica');
  setText($('.tab[data-view="mural"] .tl'),'Ó nóis!');
  const appRepo=$('.app-nav-card[data-app-view="pubs"] b');if(appRepo)setText(appRepo,'Arquivo Vivo');
  const appPeople=$('.app-nav-card[data-app-view="rede"] b');if(appPeople)setText(appPeople,'Galera');
  const appChat=$('.app-nav-card[data-app-view="mensagens"] b');if(appChat)setText(appChat,'Fofoca científica');
  const appMural=$('.app-nav-card[data-app-view="mural"] b');if(appMural)setText(appMural,'Ó nóis!');
  const appChatSub=$('.app-nav-card[data-app-view="mensagens"] small');if(appChatSub)setText(appChatSub,'Fofoca, panelinhas e privadas');
  const appMuralSub=$('.app-nav-card[data-app-view="mural"] small');if(appMuralSub)setText(appMuralSub,'Avisos, fotos e vida da galera');
  const menuSub=$('.app-menu-brand small');if(menuSub)setText(menuSub,'Ciência que conecta e regenera');
  const authSub=$('.auth-brand p');if(authSub)setText(authSub,'Ciência que conecta e regenera.');
  const repoTitle=$('#repoMainTitle');if(repoTitle&&['Repositório','Repositório Geral','Arquivo'].includes(repoTitle.textContent.trim()))setText(repoTitle,'Arquivo Vivo');
  const repoSub=$('#repoMainSubtitle');if(repoSub)setText(repoSub,'Documentos, dados e produção científica da Rede.');
  const addFolder=$('#addRepoPackageBtn');if(addFolder)setText(addFolder,'📁 Nova pasta');
  const p1=$('#repoPersonalNewFolderBtn');if(p1)setText(p1,'📁 Nova pasta + arquivos');
  const p2=$('#repoPersonalNewFolderBtn2');if(p2)setText(p2,'📁 Criar pasta');
  const search=$('#search');if(search)search.placeholder='Buscar na galera, tema ou linha';
  setIf($('#p46SideTitle'),'Fofoca geral','Fofoca científica');
  setIf($('#p46ChatTitle'),'Fofoca geral','Fofoca científica');
  const gen=$('#subNav [data-sub-view="mensagens"]');if(gen&&gen.childNodes[0]&&String(gen.childNodes[0].nodeValue||'').trim()==='Fofoca geral')gen.childNodes[0].nodeValue='Fofoca científica';
  setIf($('#p46MuralBtn'),'📣 Mural','📣 Ó nóis!');
  setIf($('#viewMural .mural-board-head h2'),'Mural dos Carbonautas','Ó nóis!');
  setIf($('#viewMural .view-head h2'),'Mural','Ó nóis!');
  $$('#viewMural button').forEach(b=>setIf(b,'Mural','Ó nóis!'));
  const aboutBtn=$('#p78AboutBtn');if(aboutBtn)aboutBtn.setAttribute('aria-label','Sobre o Carbonautas');
}
function decorateEntry(){
  const loading=$('.loading');
  if(loading&&!$('.p95-loading-title',loading)){
    const mark=$('.mark',loading)||$('.logo-mark',loading);
    if(mark){const title=document.createElement('div');title.className='p95-loading-title';title.textContent='Carbonautas';const sub=document.createElement('div');sub.className='p95-loading-sub';sub.textContent='Ciência que conecta e regenera';mark.insertAdjacentElement('afterend',title);title.insertAdjacentElement('afterend',sub)}
  }
  const auth=$('.auth-brand');
  if(auth){const p=$('p',auth);if(p)setText(p,'Ciência que conecta e regenera.');}
}
function icon(path){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`}
function ensureBottomNav(){
  let nav=$('#softBottomNav');
  if(!nav){nav=document.createElement('nav');nav.id='softBottomNav';nav.className='soft-bottom-nav';nav.setAttribute('aria-label','Atalhos principais');nav.innerHTML=`<button type="button" data-soft-view="painel">${icon('M3 11.5 12 4l9 7.5V21H6v-6h12v6')}<span class="soft-nav-label">Painel</span></button><button type="button" data-soft-view="pubs">${icon('M4 5.5A2.5 2.5 0 0 1 6.5 3H10l2 2h5.5A2.5 2.5 0 0 1 20 7.5V19H4Z')}<span class="soft-nav-label">Arquivo</span></button><button type="button" data-soft-view="rede">${icon('M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75')}<span class="soft-nav-label">Galera</span></button><button type="button" data-soft-view="mensagens" title="Fofoca científica">${icon('M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z')}<span class="soft-nav-label">Fofoca<br>científica</span></button>`;document.body.appendChild(nav);nav.querySelectorAll('[data-soft-view]').forEach(b=>b.addEventListener('click',()=>{const v=b.dataset.softView;try{if(typeof window.switchView==='function')window.switchView(v);else document.querySelector(`.tab[data-view="${v}"]`)?.click()}catch(e){console.warn('P95 nav',e)}try{window.closeAppMenu?.()}catch(_e){}updateBottomNav()}))}
  const chatLabel=nav.querySelector('[data-soft-view="mensagens"] .soft-nav-label');if(chatLabel)chatLabel.innerHTML='Fofoca<br>científica';
}
function updateBottomNav(){const v=document.body.dataset.view||'painel';$$('#softBottomNav [data-soft-view]').forEach(b=>b.classList.toggle('on',b.dataset.softView===v))}
function visualCleanup(){const d=$('#repoDedupeBtn');if(d)d.style.display='none';document.body.classList.add('carbonautas-soft-p93','carbonautas-identity-p94','carbonautas-entry-p95');const meta=$('meta[name="theme-color"]');if(meta)meta.setAttribute('content','#F6FAF9')}
function decorateAbout(){
  const card=$('#p78AboutCard');if(!card)return;
  const h2=card.querySelector('h2');if(h2)setText(h2,'Sobre o Carbonautas');
  const kicker=card.querySelector('.p78-kicker');if(kicker)setText(kicker,'IDENTIDADE + COMO USAR');
  const intro=h2?.nextElementSibling;if(intro&&intro.tagName==='P')intro.textContent='O Carbonautas organiza a vida científica da rede sem separar comunicação, acompanhamento, arquivos e ação. A ideia é simples: entrar, entender o que importa e seguir em frente.';
  if($('#p94Identity',card))return;
  const block=document.createElement('section');block.id='p94Identity';block.className='p94-identity';block.innerHTML=`<div class="p94-brandline"><img class="p94-brandmark" src="./carbonautas-soft-mark.svg?v=P95-20260918" alt="Símbolo Carbonautas"><div><b>Por que Carbonautas?</b><p><strong>Carbono + nautas.</strong> Pessoas que navegam pela ciência, pelos projetos, pelos dados e pelos territórios para transformar conhecimento em ação coletiva.</p></div></div><div class="p94-meaning"><div><strong>↻ C / ciclo</strong><span>Carbono, continuidade e circulação do conhecimento.</span></div><div><strong>🌿 Folha</strong><span>Ecossistemas, vida e regeneração.</span></div><div><strong>⌁ Rota + nós</strong><span>Navegação, rede de pessoas e ciência conectada.</span></div></div><div class="p94-colors"><div class="p94-color"><i class="p94-dot" style="background:#14364a"></i><span><b>Azul-petróleo</b> rigor, dados e confiança.</span></div><div class="p94-color"><i class="p94-dot" style="background:#62b98a"></i><span><b>Verde</b> vida, ecossistemas e regeneração.</span></div><div class="p94-color"><i class="p94-dot" style="background:#168f94"></i><span><b>Turquesa</b> conexão, circulação e colaboração.</span></div><div class="p94-color"><i class="p94-dot" style="background:#f45c78"></i><span><b>Coral</b> atenção, decisão e ação.</span></div></div>`;
  const author=card.querySelector('.p78-author');if(author)card.insertBefore(block,author);else card.appendChild(block);
}
function refresh(){ensureCss();useSoftMark();relabel();decorateEntry();ensureBottomNav();updateBottomNav();visualCleanup();decorateAbout()}
function boot(){
  refresh();
  const obs=new MutationObserver(()=>{relabel();useSoftMark();decorateEntry();visualCleanup();updateBottomNav()});obs.observe(document.body,{attributes:true,attributeFilter:['data-view']});
  document.addEventListener('click',e=>{if(e.target?.closest?.('#p78AboutBtn'))setTimeout(decorateAbout,0);if(e.target?.closest?.('#viewMensagens,#appMenuDrawer,#subNav,#showRegisterBtn,#showLoginBtn'))setTimeout(()=>{relabel();decorateEntry()},0)},true);
  window.addEventListener('resize',updateBottomNav,{passive:true});
  try{const u=new URL(location.href);if(u.searchParams.get('build')!==BUILD){u.searchParams.set('build',BUILD);u.searchParams.delete('pwa');history.replaceState(null,'',u.href)}}catch(_e){}
  window.CARBONAUTAS_RUNTIME_BUILD=BUILD;console.info('Carbonautas P95 entrada + identidade carregada')
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
