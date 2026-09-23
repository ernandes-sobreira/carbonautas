/* Real Chromium component tests. Firebase calls are mocked; use test:rules separately. */
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--disable-gpu']}: {})});
 try{for(const width of [1440,390,360,430]){
 const page=await browser.newPage({viewport:{width,height:900},isMobile:width<500,hasTouch:width<500});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent('<main><div id="pubList"></div></main><textarea id="privateInput"></textarea><div id="filePreviewOverlay" style="display:none"><div class="modal"><button id="closePreview">Fechar</button><a id="filePreviewDownload">Baixar</a><div id="filePreviewBody"></div></div></div>');
 await page.addStyleTag({path:'modules/repository.css'});
 await page.evaluate(()=>{
 window.calls={downloads:0,previews:0,messages:0};const pubs=Array.from({length:3},(_,i)=>({id:'f'+i,tipo:'arquivo',memberId:'alu',memberNome:'Aluno',categoria:i===0?'artigo':i===1?'apresentacao':'projetos_relatorios',fileName:'Documento '+i+'.docx',titulo:'Projeto '+i,url:'https://example.org/a',onlineEditVersion:2,repositoryTurnMemberId:'prof',onlineEditHistory:[{action:'download',version:1,byName:'Professor',savedAt:'2026-09-22T10:00:00Z'}]}));
 window.CarbonautasApp={state:{publicacoes:pubs,members:[{id:'alu',nome:'Aluno'},{id:'prof',nome:'Professor',nivel:'coord'}],privateThreads:[]},memberId:'prof',isAdmin:true};
 window.toast=m=>window.lastToast=m;window.renderPubs=()=>{document.querySelector('#pubList').innerHTML=pubs.map(window.CarbonautasRepository.cardHTML).join('');document.dispatchEvent(new CustomEvent('carbonautas:repository-rendered'))};
 window.startPrivateConversation=async id=>{window.calls.messages++;window.CarbonautasApp.state.privateThreads=[{id:'alu__prof'}]};window.switchView=v=>document.body.dataset.view=v;window.openPrivateThread=id=>window.openedThread=id;
 window.closeOverlay=id=>{if(id==='filePreviewOverlay'){document.querySelector('#repositoryPreview')?.close();document.querySelector('#filePreviewOverlay').style.display='none'}};
 window.openFilePreview=async()=>{window.calls.previews++;document.querySelector('#filePreviewOverlay').style.display='flex';document.querySelector('#filePreviewBody').textContent='Read-only preview'};
 document.querySelector('#closePreview').onclick=()=>window.closeOverlay('filePreviewOverlay');
 });
 await page.addScriptTag({path:'modules/file-handoff.js'});
 await page.evaluate(()=>{window.CarbonautasFiles.getPublication=async id=>window.CarbonautasApp.state.publicacoes.find(p=>p.id===id);window.CarbonautasFiles.actorProfile=async()=>({uid:'prof',memberId:'prof',coordinator:true});window.CarbonautasFiles.downloadPublication=async()=>{window.calls.downloads++}});
 await page.addScriptTag({path:'modules/repository.js'});
 assert.equal(await page.locator('#repositoryPerson').count(),1);assert.equal(await page.locator('#repositoryCategory').count(),1);assert.equal(await page.locator('#repositoryMode').count(),1);assert.equal(await page.locator('#repositorySearch').count(),1);
 await page.getByRole('button',{name:'▣ Folhear arquivos'}).click();
 assert.equal(await page.locator('#repositoryStage .repository-history').count(),1);
 for(let i=0;i<8;i++){await page.locator('[data-deck-next]').click();await page.locator('[data-deck-prev]').click()}
 await page.locator('#repositoryStage [data-file-action="download"]').click();assert.equal(await page.evaluate(()=>calls.downloads),1);
 await page.locator('#repositoryStage [data-file-action="preview"]').click();assert.equal(await page.locator('#repositoryPreview').evaluate(e=>e.matches(':modal')),true);
 const top=await page.locator('#closePreview').evaluate(e=>{const r=e.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===e});assert.equal(top,true);
 await page.locator('#closePreview').click();assert.equal(await page.locator('#repositoryDeck').evaluate(e=>e.open),true);
 await page.locator('#repositoryStage [data-file-action="return"]').click();assert.equal(await page.locator('#repositoryReturn').evaluate(e=>e.matches(':modal')),true);await page.locator('#repositoryReturn [data-return-close]').first().click();
 await page.locator('#repositoryStage [data-file-action="message"]').click();assert.equal(await page.locator('#repositoryDeck').evaluate(e=>e.open),false);assert.equal(await page.evaluate(()=>openedThread),'alu__prof');assert.match(await page.locator('#privateInput').inputValue(),/Sobre o arquivo/);assert.equal(await page.locator('#privateInput').evaluate(e=>document.activeElement===e),true);
 for(let i=0;i<6;i++){await page.getByRole('button',{name:'▣ Folhear arquivos'}).click();await page.locator('[data-deck-close]').click()}
 assert.equal(await page.locator('#repositoryDeck').count(),1);assert.equal(await page.locator('#pubList .repository-actions button').count(),12);
 // Search, person, category and pending filters feed the same carousel without DOM cloning.
 await page.locator('#repositorySearch').fill('Documento 2');
 assert.equal(await page.locator('#pubList > [data-file-id]:visible').count(),1);
 await page.getByRole('button',{name:'▣ Folhear arquivos'}).click();
 assert.equal(await page.locator('#repositoryCount').textContent(),'1 de 1');
 assert.equal(await page.locator('#repositoryStage > article').getAttribute('data-file-id'),'f2');
 await page.locator('[data-deck-close]').click();await page.locator('#repositorySearch').fill('');
 await page.locator('#repositoryPerson').selectOption('alu');assert.equal(await page.locator('#pubList > [data-file-id]:visible').count(),3);
 await page.locator('#repositoryCategory').selectOption('apresentacao');assert.equal(await page.locator('#pubList > [data-file-id]:visible').count(),1);
 await page.locator('#repositoryCategory').selectOption('');await page.locator('#repositoryMode').selectOption('pending');assert.equal(await page.locator('#pubList > [data-file-id]:visible').count(),3);
 // The shared preview must return home so another screen can reopen it.
 assert.equal(await page.locator('#filePreviewOverlay').evaluate(e=>e.parentElement.tagName),'BODY');
 await page.evaluate(()=>openFilePreview('https://example.org/other','Outro.pdf'));
 assert.equal(await page.locator('#filePreviewOverlay').isVisible(),true);await page.locator('#closePreview').click();
 // A shared folder with two recipients must expose an explicit choice.
 await page.evaluate(()=>{const p=CarbonautasApp.state.publicacoes[0];Object.assign(p,{packageId:'pkg',packageAccess:'selected',collaboratorMemberIds:['prof','peer']});CarbonautasApp.memberId='alu';CarbonautasApp.state.members.push({id:'peer',nome:'Colega'});CarbonautasFiles.actorProfile=async()=>({memberId:'alu',uid:'alu'});renderPubs()});
 await page.locator('#repositoryPerson').selectOption('');await page.locator('#repositoryCategory').selectOption('');await page.locator('#repositoryMode').selectOption('date');
 await page.locator('[data-file-id="f0"] [data-file-action="return"]').click();
 assert.equal(await page.locator('#returnRecipient option').count(),2);await page.locator('#returnRecipient').selectOption('peer');
 await page.locator('#repositoryReturn [data-return-close]').first().click();
 await page.locator('[data-file-id="f0"] [data-file-action="message"]').click();
 assert.equal(await page.locator('#repositoryRecipient').evaluate(e=>e.matches(':modal')),true);
 await page.locator('#repositoryRecipient button[value="cancel"]').click();
 assert.equal(await page.evaluate(()=>calls.messages),1);
 // On-demand folder cards need their receipt immediately, without reopening the folder.
 await page.evaluate(()=>{const p=CarbonautasApp.state.publicacoes[0];p.id='package:pkg:a';CarbonautasFiles.downloadPublication=async()=>{calls.downloads++;p.onlineEditHistory.push({action:'download',version:2,byName:'Aluno',savedAt:'2026-09-22T12:00:00Z'})};renderPubs()});
 const folderCard=page.locator('[data-file-id="package:pkg:a"]');
 const before=await folderCard.locator('li').count();
 await folderCard.locator('[data-file-action="download"]').click();
 await page.waitForFunction(()=>document.querySelector('[data-file-id="package:pkg:a"] ol')?.textContent.includes('Aluno'));
 assert.equal(await folderCard.locator('li').count(),before+1);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);
 console.log(`PASS Chromium ${width}px: four filters, history, navigation, single download, modal order, return form, conversation/context/focus, repeated open/close, no horizontal overflow.`);
 await page.close();
 }}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
