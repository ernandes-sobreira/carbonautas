// Dados sintéticos para o teste de estabilidade da Home. Nunca tocam o Firebase real.
const d = (off) => { const x = new Date(); x.setDate(x.getDate() + off); return x.toISOString().slice(0, 10); };
const ts = (off) => ({ toMillis: () => Date.now() + off * 86400000, seconds: Math.floor((Date.now() + off * 86400000) / 1000) });
const mk = new Date().toISOString().slice(0, 7);
module.exports = {
  rede_users: [{ id: 'uid_prof', memberId: 'coordenacao', nome: 'Coordenação', email: 'prof@example.org', role: 'coordinator' }],
  rede_settings: [{ id: 'app', groupLink: '', linhas: ['Carbono e GEE', 'Qualidade do ar e PM2.5', 'Saúde e clima'] }],
  rede_members: [
    { id: 'coordenacao', nome: 'Coordenação', nivel: 'coord', programa: '', status: 'ativo', linhas: [], vinculos: [], prazos: [], resultados: [], hub: true, hubMotivo: 'coord' },
    { id: 'daiana', nome: 'Daiana', nivel: 'doutorado', programa: 'PPGCA', status: 'ativo', linhas: ['Cinzas e fogo'], vinculos: [{ id: 'coordenacao', motivo: 'orientação' }], prazos: [{ titulo: 'Qualificação', data: d(12), feito: false }], resultados: [], bolsista: true, bolsaInicio: d(-300), bolsaFim: d(20), lastSeenAt: ts(-1) },
    { id: 'maisa', nome: 'Maísa', nivel: 'doutorado', programa: 'PPGCA', status: 'ativo', linhas: ['Saúde e clima'], vinculos: [{ id: 'coordenacao', motivo: 'orientação' }], prazos: [], resultados: [], perguntaCientifica: 'PM2.5 e saúde', lastSeenAt: ts(0) },
    { id: 'cleverson', nome: 'Cleverson', nivel: 'doutorado', programa: 'PPGCA', status: 'ativo', linhas: ['Qualidade do ar e PM2.5'], vinculos: [], prazos: [], resultados: [], lastSeenAt: ts(-9) },
    { id: 'ana', nome: 'Ana Paula', nivel: 'posdoc', programa: 'PPGCA', status: 'ativo', linhas: ['Carbono e GEE'], vinculos: [], prazos: [], resultados: [] },
    { id: 'egresso1', nome: 'Antigo Aluno', nivel: 'mestrado', programa: 'PPGCA', status: 'egresso', linhas: [], vinculos: [], prazos: [], resultados: [] }
  ],
  rede_activities: [
    { id: 'a1', ownerId: 'daiana', ownerName: 'Daiana', type: 'correcao', status: 'revisao', title: 'Manuscrito corrigido', description: '', dueDate: d(-3), progress: 40, createdAt: ts(-10), updatedAt: ts(-2), linkedPublicationId: 'p1' },
    { id: 'a2', ownerId: 'maisa', ownerName: 'Maísa', type: 'entrega', status: 'andamento', title: 'Capítulo 2 da tese', dueDate: d(2), progress: 50, createdAt: ts(-20), updatedAt: ts(-5) },
    { id: 'a3', ownerId: 'cleverson', ownerName: 'Cleverson', type: 'produto', productType: 'artigo', status: 'planejado', title: 'Artigo PM2.5 Cáceres', dueDate: d(25), progress: 5, createdAt: ts(-30), updatedAt: ts(-30) },
    { id: 'a4', ownerId: 'coordenacao', ownerName: 'Coordenação', type: 'pendencia', status: 'afazer', title: 'Enviar relatório CAPES', dueDate: d(0), progress: 0, createdAt: ts(-4), updatedAt: ts(-4) },
    { id: 'a5', ownerId: 'maisa', ownerName: 'Maísa', type: 'checkin', status: 'concluido', title: 'Check-in mensal', checkinMonth: mk, checkinDid: 'Coleta', checkinNext: 'Analisar dados', progress: 100, createdAt: ts(-1), updatedAt: ts(-1) },
    { id: 'a6', ownerId: 'ana', ownerName: 'Ana Paula', type: 'orientacao', status: 'concluido', title: 'Reunião de orientação', dueDate: d(-8), progress: 100, createdAt: ts(-15), updatedAt: ts(-8) },
    { id: 'a7', ownerId: 'daiana', ownerName: 'Daiana', type: 'agenda', agendaShared: true, status: 'andamento', title: 'Campo no Pantanal', dueDate: d(5), dueTime: '08:00', participantIds: ['coordenacao', 'daiana'], progress: 10, createdAt: ts(-2), updatedAt: ts(-2) }
  ],
  rede_publicacoes: [
    { id: 'p1', tipo: 'arquivo', memberId: 'daiana', memberNome: 'Daiana', categoria: 'projetos_relatorios', fileName: 'VERSÃO LIMPA-REVISÃO.docx', titulo: 'Manuscrito corrigido', url: 'https://example.invalid/p1', ts: ts(-2), reviewFlow: true, reviewStatus: 'enviado', reviewVersion: 2, reviewThreadId: 'thread_p1', reviewNextRecipientId: 'coordenacao', reviewSenderId: 'daiana', reviewSenderName: 'Daiana', reviewBaseTitle: 'Manuscrito corrigido' },
    { id: 'p2', tipo: 'link', memberId: 'coordenacao', memberNome: 'Coordenação', categoria: 'jogos_plataformas', titulo: 'Plataforma JUSTA MT', url: 'https://example.invalid/p2', ts: ts(-6) },
    { id: 'p3', tipo: 'arquivo', memberId: 'maisa', memberNome: 'Maísa', categoria: 'projetos_relatorios', fileName: 'Capitulo2.pdf', titulo: 'Capítulo 2 da tese', url: 'https://example.invalid/p3', ts: ts(-1) }
  ],
  rede_schedule: [
    { id: 's1', titulo: 'Reunião geral da rede', data: d(1), hora: '14:00', descricao: 'Sala 3', feito: false, createdAt: ts(-7) },
    { id: 's2', titulo: 'Seminário PPGCA', data: d(9), hora: '09:00', descricao: '', feito: false, createdAt: ts(-7) },
    { id: 's3', titulo: 'Entrega passada', data: d(-2), hora: '', descricao: '', feito: false, createdAt: ts(-7) }
  ],
  rede_private_schedule: [{ id: 'ps1', ownerUid: 'uid_prof', titulo: 'Banca de defesa', data: d(3), hora: '15:00', feito: false }],
  rede_notifications: [
    { id: 'n1', recipientId: 'coordenacao', senderId: 'daiana', senderName: 'Daiana', kind: 'review', title: 'Arquivo para correção', message: 'Daiana enviou nova versão', sourceType: 'repositorio', sourceId: 'p1', read: false, ts: ts(-1) },
    { id: 'n2', recipientId: 'coordenacao', senderId: 'maisa', senderName: 'Maísa', kind: 'chat', title: 'Mensagem privada', message: 'Oi professor', sourceType: 'private_chat', sourceId: 't1', read: false, ts: ts(0) },
    { id: 'n3', recipientId: 'coordenacao', senderId: 'ana', senderName: 'Ana Paula', kind: 'mural', title: 'Novo post', message: 'Publicou no mural', sourceType: 'mural', sourceId: 'f1', read: true, ts: ts(-3) }
  ],
  rede_chat: [
    { id: 'c1', authorId: 'maisa', authorName: 'Maísa', text: 'Bom dia, pessoal!', ts: ts(-1), kind: 'post' },
    { id: 'c2', authorId: 'coordenacao', authorName: 'Coordenação', text: 'Reunião amanhã às 14h.', ts: ts(0), kind: 'post' }
  ],
  rede_feed: [
    { id: 'f1', authorId: 'ana', authorName: 'Ana Paula', kind: 'destaque', title: 'Artigo aceito!', text: 'Nosso artigo foi aceito.', ts: ts(-3), actionDate: d(4) },
    { id: 'f2', authorId: 'daiana', authorName: 'Daiana', kind: 'atualizacao', title: 'Campo concluído', text: 'Coleta de cinzas finalizada.', ts: ts(-5) }
  ],
  rede_photos: [{ id: 'ph1', autorId: 'daiana', autorNome: 'Daiana', legenda: 'Campo', projeto: 'Cinzas', url: 'https://example.invalid/ph1.jpg', ts: ts(-5) }],
  rede_points_events: [],
  rede_private_threads: [],
  rede_group_threads: [],
  rede_repository_packages: [],
  rede_personal_repositories: [{ id: 'coordenacao', ownerUid: 'uid_prof', ownerMemberId: 'coordenacao', allowedMemberIds: ['coordenacao'], collaboratorMemberIds: [] }],
  rede_private_directory: [{ id: 'coordenacao', uid: 'uid_prof', memberId: 'coordenacao', nome: 'Coordenação' }],
  rede_feed_reactions: [], rede_feed_comments: []
};
