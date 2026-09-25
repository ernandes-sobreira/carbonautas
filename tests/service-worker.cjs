const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');

function worker(){
  const listeners={},deleted=[],stores=new Map();let skipCount=0;
  const context={
    self:{
      location:{origin:'https://example.org'},
      addEventListener:(n,fn)=>listeners[n]=fn,
      skipWaiting:()=>{skipCount++},
      clients:{claim:async()=>{}}
    },
    URL,Response,
    caches:{
      keys:async()=>['carbonautas-p220-20260922','unrelated'],
      delete:async k=>deleted.push(k),
      open:async()=>({put:async(k,v)=>stores.set(k,v),match:async k=>stores.get(k)})
    },
    fetch:async()=>new Response('fresh')
  };
  vm.runInNewContext(fs.readFileSync('sw.js','utf8'),context);
  return{listeners,deleted,stores,context,get skipCount(){return skipCount}}
}

test('SW activates new cache without deleting unrelated applications',async()=>{
  const h=worker();let p;h.listeners.activate({waitUntil:v=>p=v});await p;
  assert.deepEqual(h.deleted,['carbonautas-p220-20260922']);
});

test('SW update waits for next opening instead of forcing controller reload',()=>{
  const h=worker();
  h.listeners.install?.({});
  assert.equal(h.skipCount,0,'install must not call skipWaiting');
  assert.equal(h.listeners.message,undefined,'legacy SKIP_WAITING message must be ignored');
});

test('SW injects URL stability guard before legacy P85/P86/P87 scripts',async()=>{
  const h=worker();
  h.context.fetch=async()=>new Response('<!doctype html><html><head><title>x</title></head><body>ok</body></html>',{headers:{'Content-Type':'text/html'}});
  const request={method:'GET',url:'https://example.org/carbonautas/?build=P87&apprefresh=123',mode:'navigate'};
  let p;h.listeners.fetch({request,respondWith:v=>p=v});
  const html=await(await p).text();
  assert.match(html,/id="carbonautas-url-stability"/);
  assert.match(html,/searchParams\.delete\(k\)/);
  assert.match(html,/history\.replaceState=function/);
});

test('SW network-first JS update falls back only during network failure',async()=>{
  const h=worker(),request={method:'GET',url:'https://example.org/modules/file-handoff.js',mode:'cors'};let p;
  h.listeners.fetch({request,respondWith:v=>p=v});assert.equal(await(await p).text(),'fresh');
  h.context.fetch=async()=>{throw Error('offline')};
  h.listeners.fetch({request,respondWith:v=>p=v});assert.equal(await(await p).text(),'fresh');
});

test('SW does not cache Firebase or private API requests',()=>{
  const h=worker();
  for(const request of [{method:'GET',url:'https://firebasestorage.googleapis.com/file'},{method:'POST',url:'https://example.org/api'}])
    h.listeners.fetch({request,respondWith:()=>assert.fail('must bypass cache')});
});
