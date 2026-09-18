/* Carbonautas P101 · pulinho no envio + figurinhas + leitura de notificações privadas */
(function(){
'use strict';
const VERSION='P101';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const STICKERS=[
  {wire:'🎴 Topizera!',emoji:'🔥',label:'Topizera!',tone:'mint'},
  {wire:'🎴 Qui linduuu!',emoji:'💚',label:'Qui linduuu!',tone:'rose'},
  {wire:'🎴 Agó, xaí esse!',emoji:'🎉',label:'Agó, xaí esse!',tone:'sun'},
  {wire:'🎴 Agó, çei não ein!',emoji:'🤨',label:'Agó, çei não ein!',tone:'lilac'},
  {wire:'🎴 Bora pro lab!',emoji:'🧪',label:'Bora pro lab!',tone:'aqua'},
  {wire:'🎴 Campo chamou!',emoji:'🌿',label:'Campo chamou!',tone:'mint'},
  {wire:'🎴 Cadê os dados?',emoji:'📊',label:'Cadê os dados?',tone:'sky'},
  {wire:'🎴 Partiu publicar!',emoji:'🚀',label:'Partiu publicar!',tone:'lilac'},
  {wire:'🎴 Tô de olho 👀',emoji:'👀',label:'Tô de olho',tone:'sun'},
  {wire:'🎴 Café e ciência!',emoji:'☕',label:'Café e ciência!',tone:'rose'}
];
let hopUntil=0,hopBaseline={private:0,general:0,p48:0},lastReadThread='',lastReadAt=0,myMemberId='';
function F(){return window.fbFns}
function stickerFor(text){return STICKERS.find(x=>x.wire===String(text||'').trim())||null}
function css(){
  if($('#p101ZapStyle'))return;
  const s=document.createElement('style');s.id='p101ZapStyle';s.textContent=`
  @keyframes p101SendHop{0%{transform:translateY(9px) scale(.965);opacity:.5}48%{transform:translateY(-7px) scale(1.018);opacity:1}72%{transform:translateY(2px) scale(.995)}100%{transform:translateY(0) scale(1);opacity:1}}
  .p101-send-hop{animation:p101SendHop .42s cubic-bezier(.2,.85,.28,1.18) both;transform-origin:80% 100%;will-change:transform,opacity}
  @media(prefers-reduced-motion:reduce){.p101-send-hop{animation:none!important}}
  .p101-sticker-btn{width:42px;height:42px;flex:0 0 42px;border:1px solid #d4e1e5;border-radius:13px;background:#fff;color:#27434d;font-size:19px;display:grid;place-items:center;cursor:pointer;box-shadow:none}
  .p101-sticker-btn:hover{background:#eef8f7;border-color:#a6d4cf}
  .private-composer .p101-sticker-btn{border-color:#d9e5e3;background:#fff;color:#24434c}
  .p101-tray{position:fixed;z-index:2147483646;width:min(380px,calc(100vw - 24px));padding:10px;background:rgba(255,255,255,.97);border:1px solid #d7e6e4;border-radius:18px;box-shadow:0 18px 52px rgba(22,48,56,.22);display:none;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;backdrop-filter:blur(12px)}
  .p101-tray.open{display:grid}.p101-tray:before{content:'Figurinhas dos Carbonautas';grid-column:1/-1;font:800 11px/1.2 system-ui;color:#61777d;letter-spacing:.06em;text-transform:uppercase;padding:3px 4px 2px}
  .p101-pick{border:0;border-radius:14px;padding:10px 9px;min-height:66px;text-align:left;display:grid;grid-template-columns:34px 1fr;gap:7px;align-items:center;color:#17333c;font-weight:850;cursor:pointer}
  .p101-pick .emo{font-size:25px}.p101-pick .lab{font-size:12px;line-height:1.15}.p101-pick.mint{background:#e9f7f0}.p101-pick.rose{background:#fff0f3}.p101-pick.sun{background:#fff6df}.p101-pick.lilac{background:#f2efff}.p101-pick.aqua{background:#e8f7f8}.p101-pick.sky{background:#edf6ff}
  .p101-sticker{min-width:142px;max-width:260px;border-radius:18px;padding:13px 15px;display:flex;align-items:center;gap:10px;font-weight:900;font-size:15px;line-height:1.12;box-shadow:0 7px 20px rgba(34,61,70,.08);border:1px solid rgba(70,105,112,.13)}
  .p101-sticker .emo{font-size:34px;line-height:1}.p101-sticker.mint{background:#e9f7f0}.p101-sticker.rose{background:#fff0f3}.p101-sticker.sun{background:#fff6df}.p101-sticker.lilac{background:#f2efff}.p101-sticker.aqua{background:#e8f7f8}.p101-sticker.sky{background:#edf6ff}
  .private-bubble:has(.p101-sticker),.p46-bubble:has(.p101-sticker),.p48-bubble:has(.p101-sticker){background:transparent!important;border:0!important;box-shadow:none!important;padding:0!important}
  @media(max-width:700px){.p101-sticker-btn{width:40px;height:40px;flex-basis:40px}.p101-tray{grid-template-columns:1fr 1fr;bottom:82px!important;left:12px!important;right:12px!important;width:auto!important}.p101-pick{min-height:58px;padding:8px}.p101-sticker{max-width:220px;font-size:14px}.p101-sticker .emo{font-size:30px}}
  `;document.head.appendChild(s);
}
function tray(){
  let t=$('#p101StickerTray');if(t)return t;
  t=document.createElement('div');t.id='p101StickerTray';t.className='p101-tray';
  t.innerHTML=STICKERS.map((x,i)=>`<button type="button" class="p101-pick ${x.tone}" data-p101-sticker="${i}"><span class="emo">${x.emoji}</span><span class="lab">${x.label}</span></button>`).join('');
  document.body.appendChild(t);
  return t;
}
function closeTray(){tray().classList.remove('open');tray().removeAttribute('data-target')}
function openTray(btn,target){
  const t=tray(),r=btn.getBoundingClientRect();t.dataset.target=target;t.classList.add('open');
  if(innerWidth>700){const w=Math.min(380,innerWidth-24),left=Math.max(12,Math.min(innerWidth-w-12,r.left));t.style.left=left+'px';t.style.right='auto';t.style.bottom=(innerHeight-r.top+8)+'px'}
}
function counts(){return {private:$$('#privateMessages .private-msg.mine').length,general:$$('.p46-msgs .p46-row.mine').length,p48:$$('.p48-msgs .p48-row.mine').length}}
function armHop(){hopBaseline=counts();hopUntil=Date.now()+3200}
function insertSticker(target,st){
  let input,send;
  if(target==='private'){input=$('#privateInput');send=$('#privateSendBtn')}
  else if(target==='p48'){input=$('#p48Input');send=$('#p48Send')}
  else{input=$('#p46Input');send=$('#p46Send')}
  if(!input||!send)return;
  input.value=st.wire;input.dispatchEvent(new Event('input',{bubbles:true}));armHop();closeTray();send.click();
}
function ensureButtons(){
  const pi=$('#privateInput');if(pi&&!$('#p101PrivateSticker')){const b=document.createElement('button');b.type='button';b.id='p101PrivateSticker';b.className='p101-sticker-btn';b.title='Figurinhas';b.textContent='🎴';pi.parentElement.insertBefore(b,pi);b.onclick=e=>{e.stopPropagation();openTray(b,'private')}}
  const gi=$('#p46Input');if(gi&&!$('#p101GeneralSticker')){const b=document.createElement('button');b.type='button';b.id='p101GeneralSticker';b.className='p101-sticker-btn';b.title='Figurinhas';b.textContent='🎴';gi.parentElement.insertBefore(b,gi);b.onclick=e=>{e.stopPropagation();openTray(b,'general')}}
  const p48=$('#p48Input');if(p48&&!$('#p101P48Sticker')){const b=document.createElement('button');b.type='button';b.id='p101P48Sticker';b.className='p101-sticker-btn';b.title='Figurinhas';b.textContent='🎴';p48.parentElement.insertBefore(b,p48);b.onclick=e=>{e.stopPropagation();openTray(b,'p48')}}
}
function decorateStickerBubble(el,text){
  if(!el||el.dataset.p101Sticker==='1')return;const st=stickerFor(text);if(!st)return;
  el.dataset.p101Sticker='1';el.innerHTML=`<div class="p101-sticker ${st.tone}"><span class="emo">${st.emoji}</span><span>${st.label}</span></div>`;
}
function decorate(){
  $$('.private-msg[data-mid]').forEach(row=>{const b=$('.private-bubble',row);if(b)decorateStickerBubble(b,b.textContent)});
  $$('.p46-row').forEach(row=>{const b=$('.p46-text',row);if(b)decorateStickerBubble(b,b.textContent)});
  $$('.p48-row').forEach(row=>{const b=$('.p48-text',row);if(b)decorateStickerBubble(b,b.textContent)});
}
function armHopFromEvent(e){
  const click=e.type==='click'&&e.target.closest?.('#privateSendBtn,#p46Send,#p48Send,.p79-tray .send');
  const key=e.type==='keydown'&&e.key==='Enter'&&!e.shiftKey&&e.target.matches?.('#privateInput,#p46Input,#p48Input');
  if(click||key)armHop();
}
function hopLatest(){
  if(Date.now()>hopUntil)return;
  const now=counts(),items=[['private','#privateMessages .private-msg.mine'],['general','.p46-msgs .p46-row.mine'],['p48','.p48-msgs .p48-row.mine']];
  for(const [key,sel] of items){if(now[key]<=hopBaseline[key])continue;const all=$$(sel),last=all.at(-1);if(last){last.classList.remove('p101-send-hop');void last.offsetWidth;last.classList.add('p101-send-hop');hopUntil=0;break}}
}
async function identity(){
  if(myMemberId)return myMemberId;const f=F(),uid=window.auth?.currentUser?.uid;if(!f||!uid)return '';
  try{const s=await f.getDoc(f.doc(window.db,'rede_users',uid));myMemberId=s.exists()?(s.data().memberId||''):''}catch(_e){}return myMemberId;
}
function activePrivateThread(){return $('.private-thread.on[data-private-thread]')?.dataset.privateThread||''}
async function readPrivateNotifications(threadId){
  const now=Date.now();if(!threadId||(threadId===lastReadThread&&now-lastReadAt<1200))return;const f=F(),mid=await identity();if(!f||!mid)return;lastReadThread=threadId;lastReadAt=now;
  try{const q=f.query(f.collection(window.db,'rede_notifications'),f.where('recipientId','==',mid));const snap=await f.getDocs(q);const docs=snap.docs.filter(d=>{const x=d.data();return !x.read&&x.kind==='private_message'&&(x.threadId===threadId||x.sourceId===threadId)});if(!docs.length)return;const batch=f.writeBatch(window.db);docs.forEach(d=>batch.update(d.ref,{read:true,readAt:f.serverTimestamp()}));await batch.commit();setTimeout(()=>{const badge=$('#notifyBadge');if(badge&&Number(badge.textContent||0)<=docs.length)badge.style.display='none'},60)}catch(e){console.warn('P101 leitura de notificação privada',e)}
}
function watchPrivateOpen(){const id=activePrivateThread();if(id)readPrivateNotifications(id)}
function bind(){
  document.addEventListener('click',armHopFromEvent,true);document.addEventListener('keydown',armHopFromEvent,true);
  document.addEventListener('click',e=>{const t=tray();if(t.classList.contains('open')&&!e.target.closest?.('#p101StickerTray,.p101-sticker-btn'))closeTray()});
  tray().addEventListener('click',e=>{const b=e.target.closest?.('[data-p101-sticker]');if(!b)return;const st=STICKERS[+b.dataset.p101Sticker],target=tray().dataset.target||'private';if(st)insertSticker(target,st)});
  new MutationObserver(()=>{ensureButtons();decorate();hopLatest();watchPrivateOpen()}).observe(document.documentElement,{subtree:true,childList:true});
}
function boot(){css();tray();ensureButtons();decorate();bind();setInterval(()=>{ensureButtons();decorate();hopLatest();watchPrivateOpen()},700);console.info('Carbonautas',VERSION,'pulinho + figurinhas + notificações privadas carregado')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
