# Carbonautas · Science OS

Plataforma da Rede Carbonautas (LIPAN/LEFA/CELBE, UNEMAT). Arquivo unico `index.html` publicado no GitHub Pages, Firestore e Storage no projeto `brasa-pantanal`, bridge ONLYOFFICE e Laboratorio de Dados no VPS.

## Estrutura do repositorio

| Caminho | Uso |
|---|---|
| `index.html`, `sw.js`, `manifest.webmanifest`, icones | Publicar no GitHub Pages (raiz) |
| `firestore.rules` | Unica fonte das regras. Publicar no Console do Firebase. Contem tambem as regras de outros sistemas (`projects/`) |
| `vps/` | Scripts ja aplicados no VPS. Guardados so como referencia e para reinstalacao |
| `docs-antigos/` | LEIA-ME de patches anteriores (P4 a P24). Historico, nao precisa ler |

## Como atualizar

1. Substituir `index.html`, `sw.js` e `manifest.webmanifest` na raiz do GitHub.
2. Se o CHANGELOG da versao disser "regras", publicar `firestore.rules` no Console.
3. Se disser "VPS", rodar o script indicado em `vps/` uma vez.
4. Testar em janela anonima. O service worker limpa o cache antigo sozinho.

## CHANGELOG

### P26 · 2026-09-12
- Navegacao reduzida de 10 para 7 destinos: Repositorio (destaque, largura total no menu), Painel, Pessoas (Rede + Acompanhamento), Agenda (antigo Cronograma), Conversas (Equipe + Privadas), Mural (Mural + Fotos), Lab.
- Grupos com duas telas ganham uma sub-navegacao em pilulas no topo. Nenhum modulo foi reescrito; as telas antigas continuam existindo por baixo.
- Removidos o rodape "O botao MENU funciona em qualquer tela", o selo de versao no menu, o chip P22 do Science Dock e a versao no titulo da aba.
- Fotos no celular: so o filtro de projeto fica visivel; os demais abrem no botao Filtros.
- Nao alterado: regras, VPS, dados.

### P25b · 2026-09-11
- Regras: removido o teste `is list` na leitura de `rede_repository_packages` e `rede_personal_repositories`, que podia negar a consulta de listagem inteira. **Publicar `firestore.rules`.**
- Meu Repositorio mostra na tela o motivo quando o Firestore bloqueia a listagem ou quando o vinculo conta/pessoa esta inconsistente, em vez de ficar vazio em silencio.

### P25 · 2026-09-11
- Corrigido: quatro funcoes chamadas mas inexistentes no `index.html` (`renderRepoPackagePeople`, `updateRepoPackageAccessUI`, `rootAllowedMemberIds`, `fileToDataUrl`). A primeira quebrava o script na inicializacao e deixava sem evento os botoes Criar pasta, Publicar e o chat privado. A segunda impedia o modal Nova pasta de abrir. Isso era a causa de "Meu Repositorio nao abre para salvar".
- Corrigido (regras): leitura de `rede_personal_repositories/{id}` inexistente devolvia permission-denied e a raiz privada nunca era criada. Agora `get` e `list` sao separados. **Publicar `firestore.rules`.**
- Fotos: mural minimalista em grade, sem legenda no cartao (aparece ao passar o mouse e no lightbox). Reacoes e comentarios continuam no lightbox.
- Fotos: filtros por projeto, pessoa, ano, tipo (foto/print) e busca por texto.
- Fotos: modo Selecionar, com "selecionar todas as filtradas", e download em ZIP. O ZIP organiza as imagens em pasta por projeto, nomeia por data_autor_legenda e inclui `fotos.csv` com projeto, data, autor, legenda e acao, pronto para relatorio.
- Fotos: envio de varias imagens de uma vez, todas com o mesmo projeto, data e acao.
- Repositorio limpo: scripts de VPS em `vps/`, LEIA-ME antigos em `docs-antigos/`, quatro copias de regras removidas (a versao valida e `firestore.rules`).
- Nao alterado: VPS, Lab, chats, ONLYOFFICE.

### P24 · 2026-09-10
Mensagem privada por arquivo, colaboradores por arquivo, sala do arquivo. VPS: `vps/P24_VPS_COLABORADORES_OFFICE.txt`.

### P22
Conversa por arquivo e edicao ONLYOFFICE no Meu Repositorio. VPS: `vps/P22_VPS_MEU_REPOSITORIO_OFFICE.txt`.

### P4 a P16
Historico em `docs-antigos/`.

## Pendencia conhecida
O download em ZIP usa `fetch` nas URLs do Storage. Se o console mostrar erro de CORS, aplicar uma vez no bucket:

```
gsutil cors set cors.json gs://brasa-pantanal.firebasestorage.app
```

com `cors.json`:

```
[{"origin":["https://ernandes-sobreira.github.io"],"method":["GET"],"maxAgeSeconds":3600}]
```
