const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const html=fs.readFileSync('index.html','utf8');
function functionText(name,next){return html.slice(html.indexOf('function '+name+'('),html.indexOf('function '+next+'(')).replace(/async\s*$/,'')}
test('nomes com apóstrofo e conteúdo hostil não escapam de argumentos inline',()=>{
 const context={};vm.runInNewContext(functionText('encodeInlineComponent','csvTextCell'),context);
 for(const value of ["Capítulo d'água.pdf","');throw Error('injetado');//",'"<>&🚀']){
  const encoded=context.encodeInlineComponent(value);assert.ok(!encoded.includes("'"));assert.ok(!encoded.includes('"'));assert.equal(vm.runInNewContext("decodeURIComponent('"+encoded+"')"),value);
 }
});
test('CSV neutraliza fórmulas preservando textos comuns',()=>{
 const context={};vm.runInNewContext(functionText('csvTextCell','esc'),context);
 for(const value of ['=HYPERLINK("a")','+cmd','-123','@SUM(A1)','\t=1+1'])assert.ok(context.csvTextCell(value).startsWith("'"));
 assert.equal(context.csvTextCell('Topizera'),'Topizera');
});
test('agenda mantém selecionados fora da busca e limpa ao reabrir',()=>{
 const dom=new JSDOM('<body><div id="p172Notify" data-mode="group"></div><input id="p172Search"><div id="p172List"></div><p id="p172Summary"></p></body>',{runScripts:'outside-only'});
 const {window}=dom;window.state={members:[{id:'a',nome:'Ana'},{id:'b',nome:'Bia'}]};window.myId='prof';
 let source=fs.readFileSync('modules/agenda-reunioes-p172.js','utf8');source=source.slice(0,source.indexOf("if(document.readyState==='loading')"))+"window.testing={renderPeople,recipients,resetForOpen};})();";
 window.eval(source);const t=window.testing;t.renderPeople();let a=window.document.querySelector('input[value="a"]');a.checked=true;a.onchange();
 window.document.querySelector('#p172Search').value='Bia';t.renderPeople();const b=window.document.querySelector('input[value="b"]');b.checked=true;b.onchange();assert.deepEqual([...t.recipients()],['a','b']);
 window.document.querySelector('#p172Search').value='Ana';t.renderPeople();assert.equal(window.document.querySelector('input[value="a"]').checked,true);assert.deepEqual([...t.recipients()],['a','b']);
 t.resetForOpen();assert.deepEqual([...t.recipients()],[]);dom.window.close();
});
test('loader rejeita falha e permite tentar novamente sem resolver antes do carregamento',async()=>{
 const dom=new JSDOM('<body></body>',{runScripts:'outside-only'});const source=fs.readFileSync('modules/dossier-p132.js','utf8');dom.window.eval(source.slice(source.indexOf('const scriptLoads='),source.indexOf('function idle'))+'window.loadTest=load;');
 const first=dom.window.loadTest('/module.js','sample');const pending=assert.rejects(first,/Falha ao carregar/);dom.window.document.getElementById('sample').onerror();await pending;assert.equal(dom.window.document.getElementById('sample'),null);
 const second=dom.window.loadTest('/module.js','sample');assert.equal(second,dom.window.loadTest('/module.js','sample'));dom.window.document.getElementById('sample').onload();await second;dom.window.close();
});
test('edição Office rejeita versão concorrente e preserva os dados salvos',async()=>{
 let live={onlineEditVersion:2,url:'v2'},writes=0;const context={window:{db:{}},FB:()=>({runTransaction:async(db,callback)=>callback({get:async()=>({exists:()=>true,data:()=>live}),update:(_r,data)=>{writes++;live={...live,...data}}})})};
 vm.runInNewContext('async '+functionText('commitOfficeRevision','showOfficeRecovery'),context);
 await assert.rejects(context.commitOfficeRevision({}, {onlineEditVersion:1,url:'v1'}, {url:'old-edit'}),/Outra edição/);assert.equal(writes,0);assert.equal(live.url,'v2');
 await context.commitOfficeRevision({},live,{url:'v3',onlineEditVersion:3});assert.equal(writes,1);assert.equal(live.url,'v3');
});
test('sair do editor durante salvamento não fecha o modal',()=>{
 let removed=0,discarded=0;const context={$:()=>({classList:{remove:()=>removed++}}),ooSession:{closingForSave:true},activitySaving:false,toast:()=>{},discardOnlineDocument:()=>discarded++};vm.runInNewContext(functionText('closeOverlay','privateMillis').split('/* ============')[0],context);context.closeOverlay('onlyOfficeOverlay');assert.equal(removed,0);assert.equal(discarded,0);context.ooSession.closingForSave=false;context.closeOverlay('onlyOfficeOverlay');assert.equal(discarded,1);assert.equal(removed,0);
});
test('todos os scripts inline e módulos têm sintaxe válida',()=>{
 const {spawnSync}=require('node:child_process'),os=require('node:os'),path=require('node:path');const dom=new JSDOM(html);let count=0;const temp=fs.mkdtempSync(path.join(os.tmpdir(),'carbonautas-js-'));
 try{for(const script of dom.window.document.querySelectorAll('script')){if(script.src||!script.textContent.trim()||script.type==='application/ld+json')continue;const name=path.join(temp,'s'+count+++'.mjs');fs.writeFileSync(name,script.textContent);const p=spawnSync(process.execPath,['--check',name],{encoding:'utf8'});assert.equal(p.status,0,p.stderr)}for(const name of fs.readdirSync('modules').filter(x=>x.endsWith('.js'))){const p=spawnSync(process.execPath,['--check','modules/'+name],{encoding:'utf8'});assert.equal(p.status,0,p.stderr)}console.log('Scripts inline verificados:',count)}finally{fs.rmSync(temp,{recursive:true});dom.window.close()}
});
