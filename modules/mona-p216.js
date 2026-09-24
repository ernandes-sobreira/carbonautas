/* Mona P216 · mascote leve do Carbonautas
   - oi na entrada, aparições raras e tchau ao sair
   - sem vídeo/GIF/bibliotecas; animação vive no SVG + CSS
   - desative a qualquer momento: Mona.setEnabled(false)
*/
(function(root){
'use strict';
if(root.__CARBONAUTAS_MONA_P216)return;
root.__CARBONAUTAS_MONA_P216=true;
const KEY='monaEnabled', SESSION_KEY='monaHelloShownV2';
const MIN_GAP=4*60*1000, MAX_GAP=8*60*1000;
let host=null,bubble=null,hideTimer=0,randomTimer=0,lastShown=0,wasInside=false;
const $=s=>document.querySelector(s);
function enabled(){try{return localStorage.getItem(KEY)!=='0'}catch(_e){return true}}
function authVisible(){const g=$('#authGate');if(!g)return false;try{return !g.classList.contains('off')&&getComputedStyle(g).display!=='none'}catch(_e){return !g.classList.contains('off')}}
function appOpen(){try{return !!root.auth?.currentUser||$('#authGate')?.classList.contains('off')}catch(_e){return false}}
function css(){
 if($('#monaP216Style'))return;
 const st=document.createElement('style');st.id='monaP216Style';st.textContent=`
 #monaP216{position:fixed;right:0;bottom:84px;z-index:135;display:flex;align-items:flex-end;gap:8px;pointer-events:none;opacity:0;transform:translateX(115%) translateY(10px);transition:opacity .24s ease,transform .42s cubic-bezier(.2,.9,.2,1);filter:drop-shadow(0 12px 22px rgba(20,61,67,.16))}
 #monaP216.on{opacity:1;transform:translateX(7%) translateY(0)}
 #monaP216.login{left:0;right:auto;bottom:12px;flex-direction:row-reverse;transform:translateX(-115%) translateY(10px)}
 #monaP216.login.on{transform:translateX(-7%) translateY(0)}
 #monaP216 .mona-stage{width:132px;height:176px;transform-origin:46% 72%}#monaP216.jump .mona-stage{animation:monaJumpP216 .58s cubic-bezier(.2,.8,.2,1) 1}
 #monaP216 img{width:132px;height:176px;object-fit:contain;display:block}
 #monaP216 .mona-bubble{max-width:160px;margin:0 0 112px;background:rgba(255,255,255,.97);border:1px solid rgba(34,91,97,.15);border-radius:17px 17px 5px 17px;padding:9px 11px;color:#214650;font:750 12px/1.28 system-ui,-apple-system,Segoe UI,sans-serif;box-shadow:0 10px 28px rgba(20,61,67,.13);opacity:0;transform:translateY(6px) scale(.96);transition:.2s ease}
 #monaP216.login .mona-bubble{border-radius:17px 17px 17px 5px}
 #monaP216.on .mona-bubble{opacity:1;transform:translateY(0) scale(1)}
 @keyframes monaJumpP216{0%{transform:translateY(18px) scale(.94)}55%{transform:translateY(-8px) scale(1.02)}100%{transform:translateY(0) scale(1)}}
 @media(max-width:620px){#monaP216{bottom:82px}#monaP216 .mona-stage,#monaP216 img{width:104px;height:139px}#monaP216 .mona-bubble{max-width:142px;margin-bottom:90px;font-size:11px}#monaP216.login{bottom:8px}}
 @media(prefers-reduced-motion:reduce){#monaP216,#monaP216 *{animation:none!important;transition:none!important}}
 `;document.head.appendChild(st);
}
function ensure(){if(host)return host;css();host=document.createElement('aside');host.id='monaP216';host.setAttribute('aria-live','polite');host.innerHTML='<div class="mona-bubble"></div><div class="mona-stage"><img src="./modules/mona-p216.svg?v=P216-20260923" alt="Mona acenando" draggable="false"></div>';document.body.appendChild(host);bubble=host.querySelector('.mona-bubble');return host}
function hide(){clearTimeout(hideTimer);if(host)host.classList.remove('on','jump','login')}
function show(text='Oi! 👋',opts={}){if(!enabled()||document.hidden)return false;const now=Date.now();if(!opts.force&&now-lastShown<25000)return false;ensure();clearTimeout(hideTimer);bubble.textContent=text;host.classList.toggle('login',!!opts.login);host.classList.remove('jump');void host.offsetWidth;host.classList.add('on','jump');lastShown=now;hideTimer=setTimeout(hide,Math.max(1500,Number(opts.duration)||2500));return true}
function scheduleRandom(){clearTimeout(randomTimer);if(!enabled()||!appOpen())return;const delay=MIN_GAP+Math.random()*(MAX_GAP-MIN_GAP);randomTimer=setTimeout(()=>{const p=['Oi! 👋','Passando só pra dar um oi 😊','Tudo certo por aí?','Mona na área ✨'];show(p[Math.floor(Math.random()*p.length)],{duration:2100});scheduleRandom()},delay)}
function hello(){if(!enabled())return;try{if(sessionStorage.getItem(SESSION_KEY)==='1')return;sessionStorage.setItem(SESSION_KEY,'1')}catch(_e){}setTimeout(()=>show('Oi! Eu sou a Mona 👋',{login:true,force:true,duration:2800}),450)}
function sync(){if(!enabled())return hide();const inside=appOpen()&&!authVisible();if(authVisible()){clearTimeout(randomTimer);if(!wasInside)hello()}else if(inside){if(!wasInside)setTimeout(()=>show('Bora trabalhar! 😊',{force:true,duration:1750}),350);scheduleRandom()}wasInside=inside}
function logout(e){const b=e.target.closest?.('#accountLogoutBtn,#unlinkedLogoutBtn,[data-logout]');if(!b||!enabled())return;if(b.dataset.monaProceed==='1'){delete b.dataset.monaProceed;return}e.preventDefault();e.stopImmediatePropagation();show('Tchau! Até logo 👋',{force:true,duration:1400});setTimeout(()=>{b.dataset.monaProceed='1';b.click()},700)}
function setEnabled(v){try{localStorage.setItem(KEY,v?'1':'0')}catch(_e){}if(!v){hide();clearTimeout(randomTimer)}else{hello();sync()}return enabled()}
function boot(){ensure();hello();document.addEventListener('click',logout,true);const gate=$('#authGate');if(gate)new MutationObserver(sync).observe(gate,{attributes:true,attributeFilter:['class','style']});document.addEventListener('visibilitychange',()=>document.hidden?hide():sync());window.addEventListener('pageshow',sync,{passive:true});setTimeout(sync,900)}
root.Mona={show,hide,scheduleRandom,setEnabled,isEnabled:enabled};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(window);
