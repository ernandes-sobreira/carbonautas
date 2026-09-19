CARBONAUTAS PREDATOR P6

CORREÇÕES PRINCIPAIS
- Excel com múltiplas abas: o Lab não lê mais apenas a primeira aba.
- Auto-seleção da aba mais analítica + seletor manual de aba.
- Prévia de até 60 linhas antes de escolher a análise.
- Botão Ver dados e botão Abrir Excel.
- Exclusão de base pelo dono/coordenador, incluindo arquivo no Firebase Storage.
- Análises antigas são preservadas para reprodutibilidade quando a base é excluída.
- Layout mobile refeito para não estourar horizontalmente.
- Correção de tendência para anos numéricos (ex.: 1985, 1986...), evitando interpretação como timestamp.

INSTALAÇÃO
1. Substitua no GitHub: index.html, sw.js, manifest.webmanifest, favicon.ico, favicon-32.png, favicon-64.png, icon-192.png e icon-512.png.
2. No VPS, copie todo o conteúdo de PREDATOR_P6_SERVER_UPGRADE.txt e cole no tmux carbonautas.
3. No final deve aparecer P6 BRIDGE: OK e PREDATOR P6 CONCLUIDO.
