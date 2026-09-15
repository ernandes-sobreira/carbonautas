/* Carbonautas · Google Calendar Sync V3 · 2026-09-14
   Sincronização manual e privada da agenda principal do usuário.
   Compatível com as regras P28 atuais da coleção rede_private_schedule.
*/
(function(){
  'use strict';

  const SYNC_VERSION='P33';
  const YEARS_BACK=5;
  const YEARS_FORWARD=5;
  const MAX_EVENTS=12000;
  const BATCH_SIZE=250;

  function cleanGoogleDescription(text=''){
    return String(text||'')
      .replace(/\n\nSincronizado a partir da agenda privada do Carbonautas\.?\s*$/i,'')
      .trim()
      .slice(0,3000);
  }

  function safeTitle(text=''){
    const s=String(text||'').trim()||'(Sem título)';
    return s.slice(0,300);
  }

  function safeDocPart(value=''){
    return String(value||'').replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,900);
  }

  function importedDocId(googleEventId){
    const uid=String(authUser?.uid||'user').slice(0,40);
    return `g_${safeDocPart(uid)}_${safeDocPart(googleEventId)}`;
  }

  function millis(v){
    if(!v)return 0;
    if(typeof v.toMillis==='function')return v.toMillis();
    if(typeof v.toDate==='function')return v.toDate().getTime();
    const n=+new Date(v);
    return Number.isFinite(n)?n:0;
  }

  function localNeedsPush(ev){
    if(!ev?.googleEventId)return true;
    const u=millis(ev.updatedAt),s=millis(ev.googleSyncedAt);
    if(!s)return true;
    return u>s+750;
  }

  function syncWindow(){
    const min=new Date();
    min.setFullYear(min.getFullYear()-YEARS_BACK);
    min.setHours(0,0,0,0);
    const max=new Date();
    max.setFullYear(max.getFullYear()+YEARS_FORWARD);
    max.setHours(23,59,59,999);
    return {min,max};
  }

  async function listGoogleEvents(){
    await ensureGoogleCalendarToken();
    const {min,max}=syncWindow();
    const items=[];
    let pageToken='',truncated=false,pages=0;

    do{
      const qs=new URLSearchParams({
        timeMin:min.toISOString(),
        timeMax:max.toISOString(),
        singleEvents:'true',
        showDeleted:'false',
        orderBy:'startTime',
        maxResults:'2500'
      });
      if(pageToken)qs.set('pageToken',pageToken);
      const data=await googleApi('/calendars/primary/events?'+qs.toString());
      pages++;
      for(const ge of (data.items||[])){
        if(ge?.status==='cancelled')continue;
        items.push(ge);
        if(items.length>=MAX_EVENTS){truncated=true;break;}
      }
      if(truncated)break;
      pageToken=data.nextPageToken||'';
    }while(pageToken&&pages<100);

    return {items,min,max,truncated};
  }

  function newPrivatePayload(ge,dt){
    return {
      titulo:safeTitle(ge.summary),
      data:dt.data,
      hora:String(dt.hora||'').slice(0,5),
      descricao:cleanGoogleDescription(ge.description),
      feito:false,
      ownerUid:authUser.uid,
      ownerMemberId:myId,
      createdAt:FB().serverTimestamp(),
      updatedAt:FB().serverTimestamp()
    };
  }

  function googleMetaPayload(ge){
    return {
      googleEventId:String(ge.id||''),
      googleHtmlLink:String(ge.htmlLink||''),
      googleSyncedAt:FB().serverTimestamp(),
      updatedAt:FB().serverTimestamp()
    };
  }

  function existingPrivatePayload(ge,dt){
    return {
      titulo:safeTitle(ge.summary),
      data:dt.data,
      hora:String(dt.hora||'').slice(0,5),
      descricao:cleanGoogleDescription(ge.description),
      ...googleMetaPayload(ge)
    };
  }

  async function commitOps(f,ops){
    for(let start=0;start<ops.length;start+=BATCH_SIZE){
      const batch=f.writeBatch(window.db);
      const slice=ops.slice(start,start+BATCH_SIZE);
      for(const op of slice){
        if(op.kind==='create')batch.set(op.ref,op.data);
        else if(op.kind==='update')batch.update(op.ref,op.data);
      }
      await batch.commit();
    }
  }

  async function pullAllGoogleToCarbonautas(){
    const btn=document.querySelector('#pullGoogleBtn');
    if(!authUser?.uid||!myId)return toast('Sua conta precisa estar vinculada a um Carbonauta para usar a agenda privada.');
    if(!googleClientId())return toast('O Client ID do Google ainda não está configurado.');

    try{
      if(btn){btn.disabled=true;btn.textContent='↓ Lendo sua agenda Google…';}
      await ensureGoogleCalendarToken();
      const {items,min,max,truncated}=await listGoogleEvents();
      if(btn)btn.textContent=`↓ Preparando ${items.length} compromissos…`;

      const locals=[...(state.privateSchedule||[])];
      const byId=new Map(locals.map(x=>[x.id,x]));
      const byGoogle=new Map(locals.filter(x=>x.googleEventId).map(x=>[x.googleEventId,x]));
      const f=FB();
      const firstPass=[];
      const metadataPass=[];
      let novos=0,atualizados=0,ignorados=0;

      for(const ge of items){
        const dt=localDatePartsFromGoogle(ge.start);
        if(!dt||!ge.id||!/^\d{4}-\d{2}-\d{2}$/.test(dt.data||'')){
          ignorados++;
          continue;
        }

        const carbonId=String(ge.extendedProperties?.private?.carbonautasPrivateId||'');
        const local=(carbonId&&byId.get(carbonId))||byGoogle.get(ge.id)||null;

        if(local){
          firstPass.push({
            kind:'update',
            ref:f.doc(window.db,'rede_private_schedule',local.id),
            data:existingPrivatePayload(ge,dt)
          });
          atualizados++;
        }else{
          const docId=importedDocId(ge.id);
          const ref=f.doc(window.db,'rede_private_schedule',docId);
          firstPass.push({kind:'create',ref,data:newPrivatePayload(ge,dt)});
          metadataPass.push({kind:'update',ref,data:googleMetaPayload(ge)});
          novos++;
        }
      }

      if(btn)btn.textContent=`↓ Salvando ${novos+atualizados} compromissos…`;
      await commitOps(f,firstPass);
      if(metadataPass.length){
        if(btn)btn.textContent='↓ Vinculando eventos ao Google…';
        await commitOps(f,metadataPass);
      }

      const periodo=`${min.toLocaleDateString('pt-BR')} a ${max.toLocaleDateString('pt-BR')}`;
      const extra=truncated?' Limite de segurança atingido; há mais eventos no Google.':'';
      toast(`Google → Carbonautas: ${novos} novos, ${atualizados} atualizados${ignorados?`, ${ignorados} ignorados`:''}. Período: ${periodo}.${extra}`);
    }catch(e){
      console.error('Google -> Carbonautas',e);
      if(e?.code==='permission-denied'){
        toast('O Firestore bloqueou a agenda privada. A importação não alterou permissões nem expôs seus eventos.');
      }else{
        toast(e?.message||'Não consegui trazer sua agenda do Google.');
      }
    }finally{
      if(btn){btn.disabled=false;btn.textContent='↓ Trazer agenda do Google';}
    }
  }

  async function pushOnePrivateToGoogle(ev){
    const body=googleEventBody(ev);
    let data=null,created=false;

    if(ev.googleEventId){
      try{
        data=await googleApi(`/calendars/primary/events/${encodeURIComponent(ev.googleEventId)}`,{
          method:'PATCH',
          body:JSON.stringify(body)
        });
      }catch(e){
        if(e.status!==404)throw e;
      }
    }

    if(!data){
      data=await googleApi('/calendars/primary/events',{
        method:'POST',
        body:JSON.stringify(body)
      });
      created=true;
    }

    await FB().updateDoc(FB().doc(window.db,'rede_private_schedule',ev.id),{
      googleEventId:data?.id||ev.googleEventId||'',
      googleHtmlLink:data?.htmlLink||ev.googleHtmlLink||'',
      googleSyncedAt:FB().serverTimestamp()
    });
    return created;
  }

  async function pushAllCarbonautasToGoogle(){
    const btn=document.querySelector('#syncAllGoogleBtn');
    if(!authUser?.uid||!myId)return toast('Sua conta precisa estar vinculada a um Carbonauta para usar a agenda privada.');
    const all=[...(state.privateSchedule||[])];
    if(!all.length)return toast('Você ainda não tem compromissos privados no Carbonautas.');
    if(!googleClientId())return toast('O Client ID do Google ainda não está configurado.');

    try{
      if(btn){btn.disabled=true;btn.textContent='↑ Verificando mudanças…';}
      await ensureGoogleCalendarToken();
      const pending=all.filter(localNeedsPush);
      if(!pending.length){
        toast('Carbonautas → Google: tudo já está sincronizado.');
        return;
      }

      let criados=0,atualizados=0,falhas=0;
      for(let i=0;i<pending.length;i++){
        if(btn)btn.textContent=`↑ Enviando ${i+1}/${pending.length}…`;
        try{
          const created=await pushOnePrivateToGoogle(pending[i]);
          if(created)criados++;else atualizados++;
        }catch(e){
          console.error('Falha ao enviar evento',pending[i]?.id,e);
          falhas++;
        }
      }
      toast(`Carbonautas → Google: ${criados} novos, ${atualizados} atualizados${falhas?`, ${falhas} falharam`:''}.`);
    }catch(e){
      console.error('Carbonautas -> Google',e);
      toast(e?.message||'Não consegui enviar as mudanças ao Google.');
    }finally{
      if(btn){btn.disabled=false;btn.textContent='↑ Enviar mudanças ao Google';}
    }
  }

  function upgradeGoogleSyncUi(){
    const pull=document.querySelector('#pullGoogleBtn');
    const push=document.querySelector('#syncAllGoogleBtn');
    if(pull){
      pull.textContent='↓ Trazer agenda do Google';
      pull.title='Importa e atualiza a agenda principal do Google, preservando a privacidade.';
      pull.onclick=pullAllGoogleToCarbonautas;
    }
    if(push){
      push.textContent='↑ Enviar mudanças ao Google';
      push.title='Cria no Google os compromissos novos e envia somente alterações locais.';
      push.onclick=pushAllCarbonautasToGoogle;
    }
    const status=document.querySelector('#googleStatusText');
    if(status&&googleConnected())status.textContent='Google Agenda conectado nesta sessão · sincronização bidirecional pronta.';
  }

  window.pullGoogleToCarbonautasV2=pullAllGoogleToCarbonautas;
  window.syncAllPrivateToGoogleV2=pushAllCarbonautasToGoogle;

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',upgradeGoogleSyncUi,{once:true});
  }else{
    upgradeGoogleSyncUi();
  }

  console.info('Carbonautas Google Sync',SYNC_VERSION,'carregado');
})();

/* P40 · ponte de notificações para instalações antigas que ainda carregam calendar-sync-v2.js?v=P33 */
(function(){
'use strict';
if(window.__CARBONAUTAS_NOTIFY_P40__)return;
window.__CARBONAUTAS_NOTIFY_P40__=true;
let lastOpen=0;
function e(v=''){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function arr(){try{return Array.isArray(state?.notifications)?state.notifications:[]}catch(_){return[]}}
function ico(n){try{return typeof notificationIcon==='function'?notificationIcon(n.kind):'🔔'}catch(_){return'🔔'}}
function when(n){try{const ms=typeof notifMillis==='function'?notifMillis(n):(n?.ts?.toMillis?n.ts.toMillis():Date.now());return new Date(ms).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}catch(_){return''}}
function close(){const p=document.getElementById('notifyPanelP40');if(p)p.style.display='none';}
function panel(){
 let p=document.getElementById('notifyPanelP40');if(p)return p;
 p=document.createElement('div');p.id='notifyPanelP40';p.style.cssText='position:fixed;inset:0;z-index:2147483647;background:rgba(3,16,27,.74);display:none;align-items:center;justify-content:center;padding:14px;overflow:auto';
 p.innerHTML='<div style="width:min(640px,100%);max-height:90vh;background:#fff;border-radius:20px;box-shadow:0 22px 80px rgba(0,0,0,.42);overflow:hidden;display:flex;flex-direction:column"><div style="display:flex;align-items:center;padding:17px 18px;border-bottom:1px solid #dce6eb;background:#f4f8fb"><div style="font-size:24px;margin-right:10px">🔔</div><div style="flex:1"><b style="font:800 20px system-ui;color:#071827">Notificações</b><div id="notifySubP40" style="font:500 12px system-ui;color:#6c7f88;margin-top:2px"></div></div><button id="notifyCloseP40" style="border:0;background:#e8eef2;border-radius:12px;width:42px;height:42px;font-size:24px">×</button></div><div id="notifyListP40" style="padding:12px;overflow:auto;max-height:70vh"></div></div>';
 document.body.appendChild(p);p.querySelector('#notifyCloseP40').onclick=close;p.onclick=x=>{if(x.target===p)close()};return p;
}
function render(){const p=panel(),l=p.querySelector('#notifyListP40'),s=p.querySelector('#notifySubP40'),a=arr(),u=a.filter(n=>!n.read).length;s.textContent=`${a.length} notificações · ${u} não lidas`;if(!a.length){l.innerHTML='<div style="padding:30px;text-align:center;color:#71838b;font:600 14px system-ui">Nenhuma notificação.</div>';return}l.innerHTML=a.slice(0,100).map(n=>`<button data-p40="${e(n.id)}" style="display:flex;width:100%;text-align:left;gap:10px;border:1px solid ${n.read?'#e2e8ec':'#9ddcf3'};background:${n.read?'#fff':'#eef9ff'};border-radius:14px;padding:12px;margin-bottom:9px"><span style="font-size:22px">${ico(n)}</span><span style="flex:1"><b style="display:block;font:800 13px system-ui;color:#10283a">${e(n.title||'Nova notificação')}</b><span style="display:block;font:500 12.5px/1.45 system-ui;color:#4a5c62;margin-top:3px">${e(n.message||'')}</span><small style="display:block;color:#7c8b90;margin-top:5px">${e(n.senderName||'Carbonauta')} · ${e(when(n))}</small></span></button>`).join('');l.querySelectorAll('[data-p40]').forEach(b=>b.onclick=async()=>{const id=b.getAttribute('data-p40');close();try{if(typeof openNotification==='function')await openNotification(id)}catch(x){console.warn('P40 abrir notificação',x)}})}
function open(){const now=Date.now();if(now-lastOpen<180)return;lastOpen=now;render();panel().style.display='flex'}
function intercept(ev){const b=ev.target?.closest?.('#notifyBtn');if(!b)return;ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();open()}
document.addEventListener('pointerdown',intercept,true);document.addEventListener('click',intercept,true);
window.openNotificationsP40=open;
console.info('Carbonautas Notifications P40 carregado');
})();
