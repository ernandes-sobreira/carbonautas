/* Carbonautas · Google Calendar Sync V2 · 2026-09-14
   Sincronização manual e privada da agenda principal do usuário.
   Google -> Carbonautas importa/cria/atualiza compromissos privados.
   Carbonautas -> Google cria itens novos e envia somente alterações locais pendentes.
   Exclusões não são propagadas automaticamente por segurança.
*/
(function(){
  'use strict';
  const SYNC_VERSION='P32';
  const YEARS_BACK=5;
  const YEARS_FORWARD=5;
  const MAX_EVENTS=12000;
  const BATCH_SIZE=350;

  function cleanGoogleDescription(text=''){
    return String(text||'')
      .replace(/\n\nSincronizado a partir da agenda privada do Carbonautas\.?\s*$/i,'')
      .trim();
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
    const n=+new Date(v);return Number.isFinite(n)?n:0;
  }
  function localNeedsPush(ev){
    if(!ev?.googleEventId)return true;
    const u=millis(ev.updatedAt),s=millis(ev.googleSyncedAt);
    if(!s)return true;
    return u>s+750;
  }
  function syncWindow(){
    const min=new Date();min.setFullYear(min.getFullYear()-YEARS_BACK);min.setHours(0,0,0,0);
    const max=new Date();max.setFullYear(max.getFullYear()+YEARS_FORWARD);max.setHours(23,59,59,999);
    return {min,max};
  }
  async function listGoogleEvents(){
    await ensureGoogleCalendarToken();
    const {min,max}=syncWindow();
    const items=[];let pageToken='',truncated=false,pages=0;
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
    }while(pageToken && pages<100);
    return {items,min,max,truncated};
  }
  function googleToPrivatePayload(ge,dt){
    return {
      titulo:ge.summary||'(Sem título)',
      data:dt.data,
      hora:dt.hora,
      descricao:cleanGoogleDescription(ge.description||''),
      ownerUid:authUser.uid,
      ownerMemberId:myId,
      googleEventId:ge.id||'',
      googleHtmlLink:ge.htmlLink||'',
      googleUpdated:ge.updated||'',
      googleLocation:ge.location||'',
      googleRecurringEventId:ge.recurringEventId||'',
      googleCalendarId:'primary',
      googleSource:'google',
      googleSyncedAt:FB().serverTimestamp(),
      updatedAt:FB().serverTimestamp()
    };
  }
  async function pullAllGoogleToCarbonautas(){
    const btn=document.querySelector('#pullGoogleBtn');
    if(!authUser?.uid||!myId)return toast('Sua conta precisa estar vinculada a um Carbonauta para usar a agenda privada.');
    if(!googleClientId())return toast('O Client ID do Google ainda não está configurado.');
    try{
      if(btn){btn.disabled=true;btn.textContent='↓ Lendo sua agenda Google…';}
      await ensureGoogleCalendarToken();
      const {items,min,max,truncated}=await listGoogleEvents();
      if(btn)btn.textContent=`↓ Importando ${items.length} compromissos…`;

      const locals=[...(state.privateSchedule||[])];
      const byId=new Map(locals.map(x=>[x.id,x]));
      const byGoogle=new Map(locals.filter(x=>x.googleEventId).map(x=>[x.googleEventId,x]));
      const f=FB();
      let batch=f.writeBatch(window.db),batchCount=0,novos=0,atualizados=0,ignorados=0;
      const commitBatch=async()=>{if(!batchCount)return;await batch.commit();batch=f.writeBatch(window.db);batchCount=0;};

      for(const ge of items){
        const dt=localDatePartsFromGoogle(ge.start);
        if(!dt||!ge.id){ignorados++;continue;}
        const carbonId=String(ge.extendedProperties?.private?.carbonautasPrivateId||'');
        let local=(carbonId&&byId.get(carbonId))||byGoogle.get(ge.id)||null;
        const docId=local?.id||importedDocId(ge.id);
        const ref=f.doc(window.db,'rede_private_schedule',docId);
        const payload=googleToPrivatePayload(ge,dt);
        if(local){
          batch.set(ref,payload,{merge:true});
          atualizados++;
        }else{
          batch.set(ref,{...payload,feito:false,createdAt:f.serverTimestamp()},{merge:true});
          novos++;
          local={...payload,id:docId,googleEventId:ge.id};
          byId.set(docId,local);byGoogle.set(ge.id,local);
        }
        batchCount++;
        if(batchCount>=BATCH_SIZE)await commitBatch();
      }
      await commitBatch();
      const periodo=`${min.toLocaleDateString('pt-BR')} a ${max.toLocaleDateString('pt-BR')}`;
      const extra=truncated?' Limite de segurança atingido; há mais eventos no Google.':'';
      toast(`Google → Carbonautas: ${novos} novos, ${atualizados} atualizados${ignorados?`, ${ignorados} ignorados`:''}. Período: ${periodo}.${extra}`);
    }catch(e){
      console.error('Google -> Carbonautas',e);
      toast(e?.message||'Não consegui trazer sua agenda do Google.');
    }finally{
      if(btn){btn.disabled=false;btn.textContent='↓ Trazer agenda do Google';}
    }
  }
  async function pushOnePrivateToGoogle(ev){
    const body=googleEventBody(ev);let data=null,created=false;
    if(ev.googleEventId){
      try{
        data=await googleApi(`/calendars/primary/events/${encodeURIComponent(ev.googleEventId)}`,{method:'PATCH',body:JSON.stringify(body)});
      }catch(e){
        if(e.status!==404)throw e;
      }
    }
    if(!data){
      data=await googleApi('/calendars/primary/events',{method:'POST',body:JSON.stringify(body)});
      created=true;
    }
    await FB().updateDoc(FB().doc(window.db,'rede_private_schedule',ev.id),{
      googleEventId:data?.id||ev.googleEventId||'',
      googleHtmlLink:data?.htmlLink||ev.googleHtmlLink||'',
      googleUpdated:data?.updated||'',
      googleCalendarId:'primary',
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
      if(!pending.length){toast('Carbonautas → Google: tudo já está sincronizado.');return;}
      let criados=0,atualizados=0,falhas=0;
      for(let i=0;i<pending.length;i++){
        if(btn)btn.textContent=`↑ Enviando ${i+1}/${pending.length}…`;
        try{
          const created=await pushOnePrivateToGoogle(pending[i]);
          if(created)criados++;else atualizados++;
        }catch(e){console.error('Falha ao enviar evento',pending[i]?.id,e);falhas++;}
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
    const pull=document.querySelector('#pullGoogleBtn'),push=document.querySelector('#syncAllGoogleBtn');
    if(pull){pull.textContent='↓ Trazer agenda do Google';pull.title='Importa e atualiza os compromissos da sua agenda principal do Google (5 anos para trás e 5 anos para frente).';pull.onclick=pullAllGoogleToCarbonautas;}
    if(push){push.textContent='↑ Enviar mudanças ao Google';push.title='Cria no Google os compromissos novos e envia apenas alterações feitas no Carbonautas.';push.onclick=pushAllCarbonautasToGoogle;}
    const status=document.querySelector('#googleStatusText');
    if(status&&googleConnected())status.textContent='Google Agenda conectado nesta sessão · sincronização bidirecional pronta.';
  }

  window.pullGoogleToCarbonautasV2=pullAllGoogleToCarbonautas;
  window.syncAllPrivateToGoogleV2=pushAllCarbonautasToGoogle;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',upgradeGoogleSyncUi,{once:true});
  else upgradeGoogleSyncUi();
  console.info('Carbonautas Google Sync',SYNC_VERSION,'carregado');
})();
