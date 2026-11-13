const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
function setup(){
  const dom=new JSDOM('<body><div id="viewTrack"><div class="track-wrap"></div></div></body>',{runScripts:'outside-only'});
  const w=dom.window,frames=[];
  w.state={members:[{id:'a',nome:'Ana',nivel:'mestrado',perguntaCientifica:'Pesquisa'}],activities:[]};
  w.isAdmin=true;w.myId='a';
  w.p135HealthDetails=()=>[];
  w.requestAnimationFrame=fn=>{frames.push(fn);return frames.length};
  w.renderTrack=()=>42;
  let source=fs.readFileSync('index.html','utf8').match(/<script data-src="tracking-folders-p97.js"[^>]*>([\s\S]*?)<\/script>/)[1];
  source=source.replace("if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();",
    'window.testTracking={renderFolders,installTrackWrapper,setFilter(q){folderState.q=q}};');
  w.eval(source);
  return {w,frames,api:w.testTracking,close:()=>w.close()};
}
test('unchanged tracking refresh preserves folder nodes and keyboard focus',()=>{
  const x=setup();try{
    x.api.renderFolders();
    const grid=x.w.document.querySelector('#p97FolderGrid'),button=grid.firstElementChild;
    button.focus();
    let mutations=0;const obs=new x.w.MutationObserver(()=>{});
    obs.observe(grid,{childList:true,subtree:true});
    for(let i=0;i<100;i++)x.api.renderFolders();
    mutations=obs.takeRecords().length;
    assert.equal(mutations,0);
    assert.equal(grid.firstElementChild,button);
    assert.equal(x.w.document.activeElement,button);
  }finally{x.close()}
});
test('changed data and filters refresh correctly, including empty results and remounted grid',()=>{
  const x=setup();try{
    x.api.renderFolders();const d=x.w.document;
    x.w.state.members[0].nome='Beatriz';x.api.renderFolders();
    assert.match(d.querySelector('#p97FolderGrid').textContent,/Beatriz/);
    x.api.setFilter('ninguém');x.api.renderFolders();
    assert.equal(d.querySelector('#p97FolderGrid').children.length,0);
    assert.equal(d.querySelector('#p97Empty').hidden,false);
    assert.equal(d.querySelector('#p97FolderCount').textContent,'0 pastas');
    x.api.setFilter('');x.api.renderFolders();
    assert.equal(d.querySelector('#p97FolderGrid').children.length,1);
    d.querySelector('#p97Folders').remove();x.api.renderFolders();
    assert.equal(d.querySelector('#p97FolderGrid').children.length,1);
    x.w.state.activities.push({ownerId:'a',status:'afazer',dueDate:'2000-01-01'});
    x.api.renderFolders();assert.match(d.querySelector('#p97FolderGrid').textContent,/Urgente/);
  }finally{x.close()}
});
test('tracking wrapper coalesces duplicate paints without dropping original calls or return values',()=>{
 const x=setup();try{
   let calls=0;x.w.renderTrack=()=>++calls;
   x.api.installTrackWrapper();
   for(let i=1;i<=100;i++)assert.equal(x.w.renderTrack(),i);
   assert.equal(calls,100);assert.equal(x.frames.length,1);
   x.frames.shift()();assert.equal(x.w.document.querySelector('#p97FolderGrid').children.length,1);
   x.w.renderTrack();assert.equal(x.frames.length,1);
 }finally{x.close()}
});
