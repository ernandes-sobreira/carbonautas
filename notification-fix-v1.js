/* Carbonautas · painel independente de notificações · P39 */
(function(){
'use strict';
const VERSION='P39';
let lastOpen=0;
function esc2(v=''){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function icon(n){try{return typeof notificationIcon==='function'?notificationIcon(n.kind):'🔔'}catch(e){return'🔔'}}
function timeText(n){try{const ms=typeof notifMillis==='function'?notifMillis(n):(n?.ts?.toMillis?n.ts.toMillis():Date.now());return new Date(ms).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}catch(e){return''}}
function notifications(){try{return Array.isArray(state?.notifications)?state.notifications:[]}catch(e){return[]}}
function ensurePanel(){
  let p=document.getElementById('notifyPanelP39');
  if(p)return p;
  p=document.createElement('div');p.id='notifyPanelP39';
  p.style.cssText='position:fixed;inset:0;z-index:2147483646;background:rgba(3,16,27,.72);display:none;align-items:flex-start;justify-content:center;padding:18px 12px;overflow:auto;-webkit-overflow-scrolling:touch';
  p.innerHTML=`<div id="notifyCardP39" style="width:min(640px,100%);max-height:calc(100dvh - 36px);overflow:hidden;background:#fff;border-radius:20px;box-shadow:0 18px 70px rgba(0,0,0,.38);display:flex;flex-direction:column;margin:auto">
    <div style="display:flex;align-items:center;gap:12px;padding:18px 18px 14px;border-bottom:1px solid #dbe5ea;background:#f4f8fb">
      <div style="font-size:25px">🔔</div><div style="flex:1;min-width:0"><div style="font:800 20px/1.1 system-ui;color:#071827">Notificações</div><div id="notifySubP39" style="font:500 12px/1.4 system-ui;color:#6b7f89;margin-top:3px"></div></div>
      <button id="notifyCloseP39" type="button" style="border:0;background:#e9eff3;border-radius:12px;width:42px;height:42px;font-size:24px;color:#142833">×</button>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;padding:12px 16px;border-bottom:1px solid #edf1f3">
      <button id="notifyReadP39" type="button" style="border:1px solid #cbd8df;background:#fff;border-radius:10px;padding:9px 12px;font:700 12px system-ui;color:#17313d">Marcar tudo como lido</button>
    </div>
    <div id="notifyListP39" style="padding:12px;overflow:auto;-webkit-overflow-scrolling:touch;min-height:120px;max-height:68dvh"></div>
  </div>`;
  document.body.appendChild(p);
  p.addEventListener('click',e=>{if(e.target===p)closePanel()});
  p.querySelector('#notifyCloseP39').onclick=closePanel;
  p.querySelector('#notifyReadP39').onclick=async()=>{try{if(typeof markAllNotificationsRead==='function')await markAllNotificationsRead()}catch(e){console.warn('P39 mark read',e)}setTimeout(renderPanel,250)};
  return p;
}
function renderPanel(){
  const p=ensurePanel(),list=p.querySelector('#notifyListP39'),sub=p.querySelector('#notifySubP39'),arr=notifications();
  const unread=arr.filter(n=>!n.read).length;sub.textContent=`${arr.length} ${arr.length===1?'notificação':'notificações'} · ${unread} ${unread===1?'não lida':'não lidas'}`;
  if(!arr.length){list.innerHTML='<div style="padding:34px 18px;text-align:center;color:#71838b;font:600 14px system-ui">Nenhuma notificação ainda.</div>';return}
  list.innerHTML=arr.slice(0,100).map(n=>`<button type="button" data-p39nid="${esc2(n.id)}" style="width:100%;text-align:left;border:1px solid ${n.read?'#e1e8ec':'#9ddcf3'};background:${n.read?'#fff':'#eef9ff'};border-radius:14px;padding:12px;margin:0 0 9px;display:flex;gap:11px;align-items:flex-start;color:#132a35"><span style="font-size:22px;line-height:1">${icon(n)}</span><span style="display:block;min-width:0;flex:1"><b style="display:block;font:800 13px/1.35 system-ui;color:#10283a">${esc2(n.title||'Nova notificação')}</b><span style="display:block;font:500 12.5px/1.45 system-ui;color:#4a5c62;margin-top:3px">${esc2(n.message||'')}</span><small style="display:block;font:500 10.5px/1.35 system-ui;color:#7c8b90;margin-top:5px">${esc2(n.senderName||'Carbonauta')} · ${esc2(timeText(n))}</small></span></button>`).join('');
  list.querySelectorAll('[data-p39nid]').forEach(b=>b.onclick=async()=>{const id=b.getAttribute('data-p39nid');closePanel();try{if(typeof openNotification==='function'){await openNotification(id);return}}catch(e){console.warn('P39 openNotification',e)}try{const n=notifications().find(x=>x.id===id);if(n&&!n.read&&typeof FB==='function'){const f=FB();await f.updateDoc(f.doc(window.db,'rede_notifications',id),{read:true,readAt:f.serverTimestamp()})}}catch(e){console.warn(e)}});
}
function openPanel(){
  const now=Date.now();if(now-lastOpen<180)return;lastOpen=now;
  const old=document.getElementById('notifyOverlay');if(old){old.classList.remove('open');old.style.display='none'}
  const p=ensurePanel();renderPanel();p.style.display='flex';document.documentElement.style.overflow='hidden';
}
function closePanel(){const p=document.getElementById('notifyPanelP39');if(p)p.style.display='none';document.documentElement.style.overflow=''}
function bind(){
  const btn=document.getElementById('notifyBtn');if(btn){btn.style.pointerEvents='auto';btn.style.position='relative';btn.style.zIndex='2147483000';btn.title='Notificações';}
  const badge=document.getElementById('notifyBadge');if(badge)badge.style.pointerEvents='none';
}
function intercept(e){const t=e.target?.closest?.('#notifyBtn');if(!t)return;e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();openPanel()}
document.addEventListener('pointerdown',intercept,true);
document.addEventListener('click',intercept,true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
new MutationObserver(bind).observe(document.documentElement,{subtree:true,childList:true});
setInterval(()=>{const p=document.getElementById('notifyPanelP39');if(p&&p.style.display==='flex')renderPanel()},1200);
window.openNotificationsP39=openPanel;
console.info('Carbonautas notifications',VERSION,'carregado');
})();
