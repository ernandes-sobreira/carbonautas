const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');

function worker(){
  const listeners={},deleted=[];let skipCount=0,claimCount=0;
  const context={
    self:{
      location:{origin:'https://example.org'},
      addEventListener:(n,fn)=>listeners[n]=fn,
      skipWaiting:()=>{skipCount++},
      clients:{claim:async()=>{claimCount++}}
    },
    URL,Response,
    caches:{
      keys:async()=>['carbonautas-p220-20260922','carbonautas-url-stable-20261001b','unrelated'],
      delete:async k=>{deleted.push(k);return true}
    }
  };
  vm.runInNewContext(fs.readFileSync('sw.js','utf8'),context);
  return{listeners,deleted,get skipCount(){return skipCount},get claimCount(){return claimCount}}
}

test('SW removes only Carbonautas caches on activation',async()=>{
  const h=worker();let p;h.listeners.activate({waitUntil:v=>p=v});await p;
  assert.deepEqual(h.deleted,['carbonautas-p220-20260922','carbonautas-url-stable-20261001b']);
});

test('SW update waits for next opening and never claims current clients',async()=>{
  const h=worker();
  h.listeners.install?.({});
  assert.equal(h.skipCount,0,'install must not call skipWaiting');
  assert.equal(h.claimCount,0,'activate must not claim the current page');
  assert.equal(h.listeners.message,undefined,'legacy SKIP_WAITING message must be absent');
});

test('SW is passive and never intercepts navigation or assets',()=>{
  const h=worker();
  assert.equal(typeof h.listeners.fetch,'function');
  let intercepted=0;
  for(const request of [
    {method:'GET',url:'https://example.org/carbonautas/',mode:'navigate'},
    {method:'GET',url:'https://example.org/modules/file-handoff.js',mode:'cors'},
    {method:'GET',url:'https://firebasestorage.googleapis.com/file',mode:'cors'}
  ]){
    h.listeners.fetch({request,respondWith:()=>{intercepted++}});
  }
  assert.equal(intercepted,0,'passive worker must let the browser use the network directly');
});

test('SW contains no HTML injection, cache serving or forced lifecycle code',()=>{
  const src=fs.readFileSync('sw.js','utf8');
  assert.doesNotMatch(src,/respondWith\s*\(/);
  assert.doesNotMatch(src,/caches\.open\s*\(/);
  assert.doesNotMatch(src,/clients\.claim\s*\(/);
  assert.doesNotMatch(src,/skipWaiting\s*\(/);
  assert.doesNotMatch(src,/injectBoot|networkFirstHtml|DIRECT_FILE_BOOT|URL_STABILITY_BOOT/);
});

test('index never writes legacy build or apprefresh parameters into the browser URL',()=>{
  const html=fs.readFileSync('index.html','utf8');
  assert.doesNotMatch(html,/searchParams\.set\(\s*['"](?:build|apprefresh)['"]/,
    'legacy patches must not write build/apprefresh into the address bar');
  assert.match(html,/searchParams\.delete\('build'\)/,
    'legacy cleanup should remove stale build values if an old bookmarked URL contains one');
});


test('index migrates only the Carbonautas SW and never forces reload',()=>{
  const html=fs.readFileSync('index.html','utf8');
  assert.match(html,/carbonautas_sw_passive_20261002/);
  assert.match(html,/reg\.scope!==carbonautasScope/);
  assert.match(html,/startsWith\('carbonautas-'\)/);
  assert.doesNotMatch(html,/controllerchange[^\n]*reload|location\.reload\s*\(|location\.replace\s*\(/);
});
