/* Estabilidade da Home em Chromium real, com Firebase simulado (tests/fixtures).
   Garante que, depois de a Home ficar visível, nada dentro de #viewPainel é reescrito
   (sem "montar em etapas"), que não há layout shift, que os avisos de entrada não voltam,
   que o cartão AGORA recebe itens e que uma mudança real de dados atualiza a Home uma vez.
   Uso: npm run test:home   (CHROMIUM_PATH opcional, como em repository.browser.cjs) */
const assert=require('node:assert/strict');
const path=require('path'),fs=require('fs'),http=require('http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const SEED=require('./fixtures/home-seed.cjs');
const ROOT=path.join(__dirname,'..');
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.ico':'image/x-icon'};
function serve(delayJs){
 return http.createServer((req,res)=>{
  let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/')p='/index.html';
  const f=path.join(ROOT,p);
  if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end()}
  const delay=delayJs&&f.endsWith('.js')?delayJs:0;
  setTimeout(()=>{res.writeHead(200,{'content-type':MIME[path.extname(f)]||'application/octet-stream','cache-control':'no-store'});res.end(fs.readFileSync(f))},delay);
 });
}
const INIT=({seed,lat})=>{
 window.__MOCK_SEED=seed;window.__MOCK_LATENCY=lat;window.__MOCK_DENY=['rede_group_threads'];
 window.__T0=0;window.__PANEL_WRITES=[];window.__SHIFTS=[];
 const t=()=>performance.now();
 const inPanel=n=>{try{return !!(n&&n.closest&&(n.closest('#viewPainel')||n.id==='viewPainel'))}catch(_e){return false}};
 const rec=(api,target)=>{if(!window.__T0||!inPanel(target))return;let d='?';try{d=target.tagName.toLowerCase()+(target.id?'#'+target.id:'')+(target.className&&typeof target.className==='string'?'.'+target.className.trim().split(/\s+/).slice(0,2).join('.'):'')}catch(_e){}window.__PANEL_WRITES.push({t:Math.round(t()-window.__T0),api,target:d})};
 const wrap=(proto,name,get)=>{const o=proto[name];if(!o)return;proto[name]=function(...a){rec(name,get(this));return o.apply(this,a)}};
 ['appendChild','insertBefore','removeChild','replaceChild'].forEach(n=>wrap(Node.prototype,n,s=>s));
 ['append','prepend','before','after','remove','replaceWith','insertAdjacentElement','insertAdjacentHTML'].forEach(n=>wrap(Element.prototype,n,s=>s.parentNode||s));
 const ih=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');Object.defineProperty(Element.prototype,'innerHTML',{set(v){rec('innerHTML',this);return ih.set.call(this,v)},get(){return ih.get.call(this)},configurable:true});
 const tc=Object.getOwnPropertyDescriptor(Node.prototype,'textContent');Object.defineProperty(Node.prototype,'textContent',{set(v){if(this.nodeType===1&&this.tagName!=='STYLE')rec('textContent',this);return tc.set.call(this,v)},get(){return tc.get.call(this)},configurable:true});
 try{new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput&&window.__T0)window.__SHIFTS.push(+e.value.toFixed(4))}).observe({type:'layout-shift',buffered:true})}catch(_e){}
 document.addEventListener('DOMContentLoaded',()=>{new MutationObserver(()=>{if(!window.__T0&&document.body.classList.contains('carbonautas-session-ready'))window.__T0=t()}).observe(document.body,{attributes:true,attributeFilter:['class']})});
};
async function run(browser,{label,mobile,delayJs,lat}){
 const server=serve(delayJs);await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}/`;
 const ctx=await browser.newContext(mobile?{viewport:{width:390,height:844},isMobile:true,hasTouch:true}:{viewport:{width:1366,height:900}});
 const mock=fs.readFileSync(path.join(__dirname,'fixtures/firebase-mock.js'),'utf8');
 await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());
 await ctx.route(/gstatic\.com\/firebasejs\//,r=>r.fulfill({status:200,contentType:'text/javascript',body:mock}));
 await ctx.addInitScript(INIT,{seed:SEED,lat});
 const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__T0>0,null,{timeout:60000});
  // A capa e o cartão AGORA já estão compostos no primeiro frame visível.
  const first=await page.evaluate(()=>({kicker:document.querySelector('#p174AgendaFocus .p174-kicker')?.textContent,strip:document.querySelectorAll('#p174AgendaFocus .p176-att-card').length,count:document.querySelector('#p195Deck .p195-count')?.textContent||'',overlays:document.querySelectorAll('.p59-checkin-backdrop,.p57-arrival').length}));
  assert.equal(first.kicker,'OLHA RAPIDÃO',label+': capa compacta presente na revelação');
  assert.ok(first.strip>=1,label+': faixa de compromissos presente na revelação');
  assert.match(first.count,/^1 de \d+$/,label+': cartão AGORA com itens reais na revelação');
  assert.equal(first.overlays,0,label+': sem avisos de entrada sobre a Home');
  await page.waitForTimeout(4000);
  const after=await page.evaluate(()=>({writes:window.__PANEL_WRITES,shifts:window.__SHIFTS,overlays:document.querySelectorAll('.p59-checkin-backdrop,.p57-arrival').length,kicker:document.querySelector('#p174AgendaFocus .p174-kicker')?.textContent}));
  assert.deepEqual(after.writes,[],label+': nenhuma escrita em #viewPainel nos 4 s após a revelação');
  assert.deepEqual(after.shifts,[],label+': nenhum layout shift após a revelação');
  assert.equal(after.overlays,0,label+': avisos de entrada não aparecem depois');
  assert.equal(after.kicker,'OLHA RAPIDÃO');
  // Mudança real de dados: a Home reage uma vez, sem reconstruir a capa.
  const due=(()=>{const x=new Date();x.setDate(x.getDate()+1);return x.toISOString().slice(0,10)})();
  await page.evaluate(d=>window.__MOCK_ADD('rede_activities',{id:'a_new',ownerId:'maisa',ownerName:'Maísa',type:'pendencia',status:'afazer',title:'Nova pendência de teste',dueDate:d,progress:0}),due);
  await page.waitForTimeout(800);
  const changed=await page.evaluate(()=>({count:document.querySelector('#p195Deck .p195-count')?.textContent,capaWrites:window.__PANEL_WRITES.filter(w=>/p174AgendaFocus|p174-|p176-strip|p176-att/.test(w.target)).length,deckWrites:window.__PANEL_WRITES.filter(w=>w.target==='div.p195-card').length}));
  assert.match(changed.count,/^1 de \d+$/);
  assert.notEqual(changed.count,first.count,label+': cartão AGORA reflete a nova pendência');
  assert.equal(changed.capaWrites,0,label+': capa não é reconstruída quando só o Painel mudou');
  assert.equal(changed.deckWrites,1,label+': cartão AGORA reescrito uma única vez');
  await page.evaluate(d=>window.__MOCK_ADD('rede_schedule',{id:'s_new',titulo:'Evento novo de teste',data:d,hora:'10:00',feito:false}),due);
  await page.waitForTimeout(800);
  const strip=await page.evaluate(()=>[...document.querySelectorAll('#p174AgendaFocus .p176-card-title')].map(e=>e.textContent));
  assert.ok(strip.includes('Evento novo de teste'),label+': faixa de compromissos reflete novo evento');
  assert.deepEqual(errors,[],label+': sem erros de página');
  console.log(`PASS ${label}: Home composta antes de aparecer, sem reescritas nem layout shift depois, sem avisos de entrada, AGORA com itens (${first.count}) e reatividade a dados reais.`);
 }finally{await ctx.close();server.close()}
}
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--disable-gpu']}:{})});
 try{
  await run(browser,{label:'celular 390px rede rápida',mobile:true,delayJs:0,lat:{default:60,rede_chat:200,rede_feed:250,rede_photos:300}});
  await run(browser,{label:'celular 390px rede lenta',mobile:true,delayJs:350,lat:{default:400,rede_chat:900,rede_feed:1100,rede_photos:1300}});
  await run(browser,{label:'desktop 1366px',mobile:false,delayJs:0,lat:{default:60}});
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
