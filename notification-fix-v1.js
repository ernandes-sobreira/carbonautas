/* Carbonautas · correção robusta do painel de notificações · P38 */
(function(){
'use strict';
const VERSION='P38';
function openNotifications(){
  try{ if(typeof renderNotificationUI==='function') renderNotificationUI(); }catch(e){console.warn('P38 renderNotificationUI',e)}
  try{ if(typeof updateNotificationPermissionHint==='function') updateNotificationPermissionHint(); }catch(e){console.warn('P38 updateNotificationPermissionHint',e)}
  const overlay=document.getElementById('notifyOverlay');
  if(!overlay){ console.warn('P38: notifyOverlay não encontrado'); return; }
  overlay.classList.add('open');
  overlay.style.display='flex';
  overlay.style.zIndex='100000';
  overlay.setAttribute('aria-hidden','false');
  try{ overlay.scrollTop=0; }catch(e){}
}
function closeNotifications(){
  const overlay=document.getElementById('notifyOverlay');
  if(!overlay)return;
  overlay.classList.remove('open');
  overlay.style.display='';
  overlay.removeAttribute('aria-hidden');
}
function bind(){
  const btn=document.getElementById('notifyBtn');
  const overlay=document.getElementById('notifyOverlay');
  if(btn && !btn.dataset.p38Bound){
    btn.dataset.p38Bound='1';
    btn.style.position='relative';
    btn.style.zIndex='90';
    btn.style.pointerEvents='auto';
    btn.addEventListener('click',function(e){
      e.preventDefault();
      openNotifications();
    },true);
    btn.addEventListener('pointerup',function(e){
      if(e.pointerType==='touch') openNotifications();
    },true);
  }
  const badge=document.getElementById('notifyBadge');
  if(badge) badge.style.pointerEvents='none';
  if(overlay && !overlay.dataset.p38Bound){
    overlay.dataset.p38Bound='1';
    overlay.addEventListener('click',e=>{ if(e.target===overlay) closeNotifications(); });
    overlay.querySelectorAll('[data-close="notifyOverlay"]').forEach(b=>b.addEventListener('click',closeNotifications));
  }
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bind,{once:true}); else bind();
new MutationObserver(bind).observe(document.documentElement,{childList:true,subtree:true});
window.openNotificationsP38=openNotifications;
console.info('Carbonautas notifications fix',VERSION,'carregado');
})();
