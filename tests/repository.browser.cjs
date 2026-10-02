/* Real Chromium component tests. Firebase calls are mocked; use test:rules separately. */
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--disable-gpu']}: {})});
 try{for(const width of [1440,390,360,430]){
 const page=await browser.newPage({viewport:{width,height:900},isMobile:width<500,hasTouch:width<500});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent('<main id="repoGeneralPanel"><div id="repoPackageList">LEGACY PACKAGES</div><div class="repo-filters-row"><select id="pubCategoria"><option value="">Todas</option></select><select id="pubPessoa"><option value="">Todas</option></select></div><label id="legacyMineLabel"><input id="pubMine" type="checkbox">Só as minhas</label><div id="pubList"></div></main><textarea id="privateInput"></textarea><div id="filePreviewOverlay" style="display:none"><div class="modal"><button id="closePreview">Fechar</button><a id="filePreviewDownload">Baixar</a><div id="filePreviewBody"></div></div></div>');
 await page.addStyleTag({path:'modules/repository.css'});
 await page.evaluate(()=>{
 window.calls={downloads:0,previews:0,messages:0,done:0,painel:0};
 const pubs=[
  {id:'f0',tipo:'arquivo',memberId:'dia',memberNome:'Daiana',categoria:'projetos_relatorios',fileName:'Projeto_Daiana.docx',titulo:'Projeto de doutorado interativo',url:'https://example.org/f0',ts:'2026-09-02T12:00:00Z',onlineEditVersion:2,repositoryTurnMemberId:'prof',reviewFlow:true,reviewThreadId:'thread-f0',reviewBaseTitle:'Projeto de doutorado interativo',reviewVersion:2,onlineEditHistory:[{action:'upload',version:2,byMemberId:'prof',byName:'Ernandes Sobreira Oliveira Junior',savedAt:'2026-09-28T11:40:00Z'}]},
  {id:'l1',tipo:'link',memberId:'prof',memberNome:'Ernandes Sobreira Oliveira Junior',categoria:'jogos_plataformas',titulo:'Plataforma de justiça climática em MT',url:'https://example.org/plataforma',ts:'2026-09-27T12:00:00Z'},
  {id:'f2',tipo:'arquivo',memberId:'bas',memberNome:'Basirat Abiodun Ariyibi',categoria:'projetos_relatorios',fileName:'Impactos_pesca.pdf',titulo:'Impactos socioeconômicos das mudanças climáticas na pesca em Cáceres',url:'https://example.org/f2',ts:'2026-09-26T12:00:00Z',onlineEditVersion:1,repositoryTurnMemberId:'dia',onlineEditHistory:[]},
  {id:'l3',tipo:'link',memberId:'prof',memberNome:'Ernandes Sobreira Oliveira Junior',categoria:'video',titulo:'Vídeo sobre a bibliometria',url:'https://example.org/video',ts:'2026-09-19T12:00:00Z'}
 ];
 window.testPubs=pubs;
 window.CarbonautasApp={state:{publicacoes:pubs,members:[{id:'dia',nome:'Daiana'},{id:'prof',nome:'Ernandes Sobreira Oliveira Junior',nivel:'coord'},{id:'bas',nome:'Basirat Abiodun Ariyibi'}],privateThreads:[]},memberId:'prof',isAdmin:true};
 window.toast=m=>window.lastToast=m;
 window.p56BuildItems=()=>({open:[{key:'review:thread-f0',kind:'CORREÇÃO · REPOSITÓRIO',who:'Daiana',what:'Projeto de doutorado interativo',detail:'Devolver correção · versão 2.',date:''}],done:[]});
 window.p56AckItem=key=>{window.calls.done++;window.lastAck=key};
 window.renderPainel=()=>{window.calls.painel++};
 // Reproduces the production regression: files used the new card, links/videos kept the legacy card.
 window.renderPubs=()=>{document.querySelector('#pubList').innerHTML=pubs.map(p=>p.tipo==='arquivo'?window.CarbonautasRepository.cardHTML(p):`<div class="pub-row legacy-row"><div class="pub-t">${p.titulo}</div><div class="pub-author">${p.memberNome}</div></div>`).join('');document.dispatchEvent(new CustomEvent('carbonautas:repository-rendered'))};
 window.startPrivateConversation=async id=>{window.calls.messages++;window.CarbonautasApp.state.privateThreads=[{id:['prof',id].sort().join('__')}]};window.switchView=v=>document.body.dataset.view=v;window.openPrivateThread=id=>window.openedThread=id;
 window.closeOverlay=id=>{if(id==='filePreviewOverlay'){document.querySelector('#repositoryPreview')?.close();document.querySelector('#filePreviewOverlay').style.display='none'}};
 window.openFilePreview=async()=>{window.calls.previews++;document.querySelector('#filePreviewOverlay').style.display='flex';document.querySelector('#filePreviewBody').textContent='Read-only preview'};
 document.querySelector('#closePreview').onclick=()=>window.closeOverlay('filePreviewOverlay');
 });
 await page.addScriptTag({path:'modules/file-handoff.js'});
 await page.evaluate(()=>{window.CarbonautasFiles.getPublication=async id=>window.CarbonautasApp.state.publicacoes.find(p=>p.id===id);window.CarbonautasFiles.actorProfile=async()=>({uid:'prof',memberId:'prof',coordinator:true});window.CarbonautasFiles.downloadPublication=async()=>{window.calls.downloads++}});
 await page.addScriptTag({path:'modules/repository.js'});
 assert.equal(await page.locator('#repositoryPerson').count(),1);assert.equal(await page.locator('#repositoryCategory').count(),1);assert.equal(await page.locator('#repositoryMode').count(),1);assert.equal(await page.locator('#repositorySearch').count(),1);
 // Desktop/mobile use one unified list, including links and videos that previously escaped the filters.
 assert.equal(await page.locator('#repoPackageList').evaluate(e=>getComputedStyle(e).display),'none');
 assert.equal(await page.locator('.repo-filters-row').evaluate(e=>getComputedStyle(e).display),'none');
 assert.equal(await page.locator('#legacyMineLabel').evaluate(e=>getComputedStyle(e).display),'none');
 assert.equal(await page.locator('#pubList > .repository-list-card').count(),4);
 assert.equal(await page.locator('#pubList > .legacy-row').count(),0);
 assert.equal(await page.locator('#pubList .repository-file').count(),0);
 assert.equal(await page.locator('#pubList .repository-history').count(),0);
 // Default order is the actual last send, not the original creation date.
 assert.equal(await page.locator('#pubList > .repository-list-card').first().getAttribute('data-publication-id'),'f0');
 assert.match(await page.locator('[data-publication-id="f0"] .repository-last-send').textContent(),/Último envio:/);
 assert.match(await page.locator('[data-publication-id="f0"] .repository-last-send').textContent(),/Ernandes Sobreira Oliveira Junior/);
 assert.match(await page.locator('[data-publication-id="f0"] .repository-last-send').textContent(),/28\/09\/2026/);
 // Person filter must hide every publication from other people, regardless of type.
 await page.locator('#repositoryPerson').selectOption('dia');
 assert.equal(await page.locator('#pubList > [data-publication-id]:visible').count(),1);
 assert.equal(await page.locator('#pubList > [data-publication-id]:visible').getAttribute('data-publication-id'),'f0');
 assert.equal(await page.locator('#repositoryResultCount').textContent(),'1 resultado');
 await page.locator('#repositoryPerson').selectOption('');
 // Category/search also operate over files + links + videos and search includes the last sender.
 await page.locator('#repositoryCategory').selectOption('video');assert.equal(await page.locator('#pubList > [data-publication-id]:visible').count(),1);assert.equal(await page.locator('#pubList > [data-publication-id]:visible').getAttribute('data-publication-id'),'l3');
 await page.locator('#repositoryCategory').selectOption('');await page.locator('#repositorySearch').fill('Basirat');assert.equal(await page.locator('#pubList > [data-publication-id]:visible').count(),1);assert.equal(await page.locator('#pubList > [data-publication-id]:visible').getAttribute('data-publication-id'),'f2');
 await page.locator('#repositorySearch').fill('Ernandes');assert.equal(await page.locator('#pubList > [data-publication-id]:visible').count(),3);
 await page.locator('#repositorySearch').fill('');
 // User can explicitly switch between last-send order and original registration order.
 await page.locator('#repositoryMode').selectOption('created');assert.equal(await page.locator('#pubList > .repository-list-card').first().getAttribute('data-publication-id'),'l1');
 await page.locator('#repositoryMode').selectOption('recent');assert.equal(await page.locator('#pubList > .repository-list-card').first().getAttribute('data-publication-id'),'f0');
 await page.locator('#repositoryMode').selectOption('pending');assert.equal(await page.locator('#pubList > [data-publication-id]:visible').count(),1);assert.equal(await page.locator('#pubList > [data-publication-id]:visible').getAttribute('data-publication-id'),'f0');
 await page.locator('#repositoryMode').selectOption('recent');
 // Full controls/history appear only after opening a compact file card.
 await page.locator('[data-file-id="f0"] [data-file-action="open"]').click();
 assert.equal(await page.locator('#repositoryStage .repository-history').count(),1);
 assert.equal(await page.locator('#repositoryStage .repository-file').count(),1);
 assert.match(await page.locator('#repositoryStage .repository-detail-last').textContent(),/Ernandes Sobreira Oliveira Junior/);
 // Pending review offers simple decisions inside Arquivo Vivo itself.
 assert.equal(await page.locator('#repositoryStage [data-file-action="done"]').count(),1);
 assert.equal(await page.locator('#repositoryStage [data-file-action="later"]').count(),1);
 assert.match(await page.locator('#repositoryStage .repository-decision').textContent(),/Já fiz/);
 assert.match(await page.locator('#repositoryStage .repository-decision').textContent(),/Decido depois/);
 // A renderização assíncrona do Repositório não pode fazer os botões piscarem e sumirem.
 await page.evaluate(()=>document.dispatchEvent(new CustomEvent('carbonautas:repository-rendered')));
 await page.waitForTimeout(120);
 assert.equal(await page.locator('#repositoryStage [data-file-action="done"]:visible').count(),1);
 assert.equal(await page.locator('#repositoryStage [data-file-action="later"]:visible').count(),1);
 await page.evaluate(()=>document.dispatchEvent(new CustomEvent('carbonautas:repository-rendered')));
 await page.waitForTimeout(120);
 assert.equal(await page.locator('#repositoryStage [data-file-action="done"]:visible').count(),1);
 assert.equal(await page.locator('#repositoryStage [data-file-action="later"]:visible').count(),1);
 await page.locator('#repositoryStage [data-file-action="done"]').click();
 assert.equal(await page.evaluate(()=>calls.done),1);
 assert.equal(await page.evaluate(()=>lastAck),'review:thread-f0');
 assert.equal(await page.locator('#repositoryDeck').evaluate(e=>e.open),false);
 await page.locator('[data-file-id="f0"] [data-file-action="open"]').click();
 await page.locator('#repositoryStage [data-file-action="later"]').click();
 assert.equal(await page.locator('#repositoryDeck').evaluate(e=>e.open),false);
 assert.equal(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('p195Gone')||'[]').length),1);
 assert.equal(await page.evaluate(()=>calls.painel),1);
 await page.locator('[data-file-id="f0"] [data-file-action="open"]').click();
 await page.locator('#repositoryStage [data-file-action="download"]').click();assert.equal(await page.evaluate(()=>calls.downloads),1);
 await page.locator('#repositoryStage [data-file-action="preview"]').click();assert.equal(await page.locator('#repositoryPreview').evaluate(e=>e.matches(':modal')),true);
 const top=await page.locator('#closePreview').evaluate(e=>{const r=e.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===e});assert.equal(top,true);
 await page.locator('#closePreview').click();assert.equal(await page.locator('#repositoryDeck').evaluate(e=>e.open),true);
 await page.locator('#repositoryStage [data-file-action="return"]').click();assert.equal(await page.locator('#repositoryReturn').evaluate(e=>e.matches(':modal')),true);await page.locator('#repositoryReturn [data-return-close]').first().click();
 await page.locator('#repositoryStage [data-file-action="message"]').click();assert.equal(await page.locator('#repositoryDeck').evaluate(e=>e.open),false);assert.equal(await page.evaluate(()=>openedThread),'dia__prof');assert.match(await page.locator('#privateInput').inputValue(),/Sobre o arquivo/);assert.equal(await page.locator('#privateInput').evaluate(e=>document.activeElement===e),true);
 for(let i=0;i<4;i++){await page.getByRole('button',{name:'▣ Folhear arquivos'}).click();await page.locator('[data-deck-close]').click()}
 assert.equal(await page.locator('#repositoryDeck').count(),1);assert.equal(await page.locator('#pubList .repository-actions button').count(),0);assert.equal(await page.locator('#pubList > .repository-list-card').count(),4);
 // Shared preview returns home so another screen can reopen it.
 assert.equal(await page.locator('#filePreviewOverlay').evaluate(e=>e.parentElement.tagName),'BODY');
 await page.evaluate(()=>openFilePreview('https://example.org/other','Outro.pdf'));assert.equal(await page.locator('#filePreviewOverlay').isVisible(),true);await page.locator('#closePreview').click();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);
 console.log(`PASS Chromium ${width}px: unified mixed list, person/category/search filters, last sender/time, last-send ordering, file details/actions and no horizontal overflow.`);
 await page.close();
 }}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
