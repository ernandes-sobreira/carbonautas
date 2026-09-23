const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
const source=fs.readFileSync('modules/runtime-integrity.js','utf8');

function formHtml(){return `<body>
<button id="saveMember">Salvar</button>
<input id="mNome" value="Aluno Teste"><select id="mNivel"><option value="doutorado" selected>Doutorado</option></select>
<input id="mPrograma" value="PPG"><select id="mStatus"><option value="ativo" selected>Ativo</option></select>
<input id="mBolsista" type="checkbox"><input id="mBolsaModalidade"><input id="mBolsaInicio"><input id="mBolsaFim"><input id="mOrigem">
<input id="mTelefone" value="123"><input id="mTema" value="Tema"><input id="mPlataforma" value="Plataforma"><input id="mDrive" value="https://drive"><textarea id="mNotas">nota</textarea>
<input id="mHub" type="checkbox"><input id="mHubMotivo"><input id="mFoto">
<div id="p97Deck" hidden><button data-p97-close></button><div id="p97Stage"></div><div id="p97DeckName"></div></div>
<input id="privateInput">
</body>`}

function makeDom({admin=false,setDoc}={}){
 const dom=new JSDOM(formHtml(),{runScripts:'outside-only',pretendToBeVisual:true,url:'https://example.test'}),w=dom.window;
 w.CarbonautasApp={state:{members:[{id:'m1',nome:'Aluno Teste',foto:'https://old/photo.jpg'}]},memberId:'m1',isAdmin:admin};
 const write=setDoc||function(){return Promise.resolve()};
 w.db={};w.fbFns={doc:(_db,col,id)=>({col,id}),setDoc:write,serverTimestamp:()=>({server:true})};
 const prelude=`
 let editingId='m1',formFoto='data:image/png;base64,broken',formLinhas=new Set(['Linha']),formResultados=[{titulo:'R',url:''}],formPrazos=[{titulo:'P',data:'2026-09-30'}],formVinculos=[{id:'m2'}];
 function canEditMember(){return true}
 async function fbUploadImage(){throw new Error('storage indisponivel')}
 function closeOverlay(id){window.__closed=id}
 async function deleteStorageArtifacts(){return []}
 function toast(msg){window.__toast=msg}
 `;
 w.eval(prelude+'\n'+source);return dom;
}

test('falha no upload da foto preserva a foto anterior e self-save só envia campos permitidos',async()=>{
 let write=null;const dom=makeDom({setDoc:async(_ref,data,opts)=>{write={data,opts}}}),w=dom.window;
 await w.CarbonautasRuntimeIntegrity.saveMember();
 assert.equal(write.data.foto,'https://old/photo.jpg');
 assert.equal(write.data.nome,'Aluno Teste');
 assert.equal(write.data.telefone,'123');
 assert.equal(Object.hasOwn(write.data,'nivel'),false);
 assert.equal(Object.hasOwn(write.data,'programa'),false);
 assert.equal(Object.hasOwn(write.data,'status'),false);
 assert.equal(w.__closed,'memberOverlay');
 assert.match(w.__toast,/foto anterior foi preservada/i);
 dom.window.close();
});

test('falha do Firestore não fecha o perfil nem finge sucesso',async()=>{
 const err=Object.assign(new Error('denied'),{code:'permission-denied'});const dom=makeDom({setDoc:async()=>{throw err}}),w=dom.window;
 await w.CarbonautasRuntimeIntegrity.saveMember();
 assert.equal(w.__closed,undefined);
 assert.match(w.__toast,/dados anteriores foram preservados/i);
 dom.window.close();
});

test('ação do Acompanhamento aguarda lazy-loader e executa no primeiro clique',async()=>{
 const dom=makeDom(),w=dom.window;let called='';
 w.CarbonautasLoader={whenTrackReady:async()=>{w.openProduct=mid=>{called=mid}}};
 const b=w.document.createElement('button');b.dataset.p97Action='product';b.dataset.mid='m1';
 await w.CarbonautasRuntimeIntegrity.rescueTrackAction(b);
 assert.equal(called,'m1');dom.window.close();
});

test('rota Mensagem fecha ficha de Acompanhamento antes de abrir Privadas',async()=>{
 const dom=makeDom(),w=dom.window,deck=w.document.querySelector('#p97Deck');deck.hidden=false;w.document.querySelector('#p97DeckName').textContent='Aluno Teste';
 deck.querySelector('[data-p97-close]').onclick=()=>{deck.hidden=true};
 let opened='';w.CarbonautasRepository={openMessage:async id=>{assert.equal(deck.hidden,true);opened=id;w.document.body.dataset.view='conversas'}};
 const card=w.document.createElement('article');card.dataset.fileId='file1';const b=w.document.createElement('button');b.dataset.fileAction='message';card.append(b);w.document.body.append(card);
 await w.CarbonautasRuntimeIntegrity.routeRepositoryMessage(b);
 assert.equal(opened,'file1');assert.equal(w.document.body.dataset.view,'conversas');dom.window.close();
});
