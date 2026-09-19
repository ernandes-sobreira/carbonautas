from pathlib import Path
import hashlib, shutil, subprocess, sys

EXPECTED_MAIN='6b30e16803eff1ff0fbef9a83a6e6efa32b88f4f'
EXPECTED_INDEX_SHA512='c55a8d00e501fe14bc1f3b375bca4b889c031feb943d7dca0a25090ec344b6c8e38a76be631677c0c046c2bb3e63ab541074fa74e750bcf2df42d320933b300f'
ASSETS=Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/p127-assets')
ROOT=Path('.')
def run(*args): return subprocess.check_output(args,text=True).strip()
head=run('git','rev-parse','HEAD')
if head!=EXPECTED_MAIN: raise SystemExit(f'ABORTADO: main mudou. Esperado {EXPECTED_MAIN}, encontrado {head}')
rules_before=hashlib.sha256(Path('firestore.rules').read_bytes()).hexdigest()
Path('backups').mkdir(exist_ok=True)
subprocess.check_call(['git','archive','--format=zip','--prefix=carbonautas-main/','-o','backups/carbonautas-P126-2026-09-19-antes-da-consolidacao.zip',EXPECTED_MAIN])
manifest=[]
for line in (ASSETS/'manifest.tsv').read_text('utf-8').splitlines():
    if not line: continue
    tag,name,opening=line.split('\t',2); manifest.append((tag,name,opening))
if len(manifest)!=64: raise SystemExit(f'ABORTADO: manifesto tem {len(manifest)} camadas, esperado 64')
base=Path('index.html').read_text('utf-8')
base=base.replace("window.CARBONAUTAS_BUILD='P25-FOTOS-LEGIVEIS-20260910';","window.CARBONAUTAS_BUILD='P127-CONSOLIDADO-20260919';")
base=base.replace('./sw.js?v=P28-20260914','./sw.js?v=P127-20260919')
closing='</body>\n</html>\n'
if not base.endswith(closing): raise SystemExit('ABORTADO: final do index base inesperado')
base=base[:-len(closing)]
out=base+'\n<!-- ===== Carbonautas P127: camadas P44 a P126 consolidadas neste arquivo (antes injetadas pelo sw.js) ===== -->\n'
for tag,name,opening in manifest:
    p=Path(name)
    if not p.exists(): raise SystemExit(f'ABORTADO: camada ausente: {name}')
    content=p.read_text('utf-8')
    if name=='dashboard-clarity-p68.js':
        old="if(open){open.textContent=info.hasFile?'✍️ Corrigir agora':'Ver fluxo';open.classList.add('p68-primary');open.removeAttribute('onclick');open.onclick=()=>{try{if(typeof switchView==='function')switchView('pubs');setTimeout(()=>{if(info.hasFile&&typeof window.openReviewResponse==='function')window.openReviewResponse(p.id);else if(typeof window.openReviewConversation==='function')window.openReviewConversation(p.id)},120)}catch(e){console.warn(e)}}"
        if old not in content: raise SystemExit('ABORTADO: trecho P68 esperado nao encontrado')
        content=content.replace(old,old+'}',1)
    out+=opening+'\n'+content+'\n'+f'</{tag}>\n'
out+='<!-- ===== fim das camadas consolidadas ===== -->\n</body>\n</html>\n'
Path('index.html').write_text(out,encoding='utf-8',newline='')
idx_hash=hashlib.sha512(Path('index.html').read_bytes()).hexdigest()
if idx_hash!=EXPECTED_INDEX_SHA512: raise SystemExit(f'ABORTADO: hash do index divergente: {idx_hash}')
Path('index.html.sha512').write_text(idx_hash+'  index.html\n',encoding='utf-8')
Path('sw.js').write_bytes((ASSETS/'sw.js').read_bytes())
Path('README.md').write_bytes((ASSETS/'README.md').read_bytes())
docs=['ALTERACOES_P28_RESUMO.txt', 'CHECKLIST_FINALIZAR_HOJE.txt', 'CHECKLIST_P13_TESTE_RAPIDO.txt', 'FIRESTORE_BLOCO_P48_PANELINHAS.txt', 'FIRESTORE_RULES_CHAT_PRIVADO_P8.txt', 'FIRESTORE_RULES_P10_COMPLETAS.txt', 'FIRESTORE_RULES_P12_COMPATIVEIS.txt', 'FIRESTORE_RULES_P13_COMPLETAS.txt', 'FIRESTORE_RULES_P28_COMPLETAS.txt', 'FIRESTORE_RULES_P8_COMPLETAS.txt', 'LEIA-ME-P22.txt', 'LEIA-ME.txt', 'LEIA-ME_P10_CHAT_PRIVADO_CORRIGIDO.txt', 'LEIA-ME_P11_SEM_FAB_LAB.txt', 'LEIA-ME_P12_WHATSAPP_AUTOMATICO.txt', 'LEIA-ME_P13_DOSSIE_PRIVACIDADE_PREVIEW.txt', 'LEIA-ME_P14_PREVIEW_SEGURO.txt', 'LEIA-ME_P15_PDF_DOC_EDIT.txt', 'LEIA-ME_P16.txt', 'LEIA-ME_P28_GOOGLE_MEDALHAS_JOGO.md', 'LEIA-ME_P8_CHAT_PRIVADO.txt', 'LEIA-ME_P9_TURNO_REPOSITORIO.txt', 'LEIA-ME_REGRAS_P8.txt', 'README.txt', 'README_P4.txt', 'TESTE_P14.txt', 'TESTE_P15.txt']
vps=['P14_VPS_PREVIEW_SEGURO.sh', 'P15_VPS_CONVERSAO_LEGADO.sh', 'P16_VPS_SALVAMENTO_ONLYOFFICE.sh', 'P22_VPS_MEU_REPOSITORIO_OFFICE.txt', 'P24_VPS_COLABORADORES_OFFICE.txt', 'PREDATOR_P4_SERVER_UPGRADE.txt', 'PREDATOR_P5_SERVER_UPGRADE.txt', 'PREDATOR_P6_SERVER_UPGRADE.txt', 'PREDATOR_SERVER_UPGRADE.txt', 'README_PREDATOR.txt']
Path('docs-antigos').mkdir(exist_ok=True); Path('vps').mkdir(exist_ok=True)
for name in docs:
    p=Path(name)
    if p.exists(): shutil.move(str(p),str(Path('docs-antigos')/name))
for name in vps:
    p=Path(name)
    if p.exists(): shutil.move(str(p),str(Path('vps')/name))
allowed={'README.md','backups','carbonautas-app-icon-p95.svg','carbonautas-soft-mark.svg','chrome-reset.html','docs-antigos','favicon-32.png','favicon-64.png','favicon.ico','firestore.rules','game.html','icon-192.png','icon-512.png','icons','index.html','index.html.sha512','manifest.webmanifest','recovery.html','sw.js','vps','.git'}
for p in list(ROOT.iterdir()):
    if p.name in allowed: continue
    if p.is_dir(): shutil.rmtree(p)
    else: p.unlink()
rules_after=hashlib.sha256(Path('firestore.rules').read_bytes()).hexdigest()
if rules_before!=rules_after: raise SystemExit('ABORTADO: firestore.rules foi alterado')
for required in ['index.html','sw.js','manifest.webmanifest']:
    if not Path(required).is_file(): raise SystemExit(f'ABORTADO: faltando {required}')
loose=[p.name for p in ROOT.iterdir() if p.is_file() and (p.suffix=='.css' or (p.suffix=='.js' and '-p' in p.name))]
if loose: raise SystemExit('ABORTADO: patches soltos na raiz: '+', '.join(loose))
if "window.CARBONAUTAS_BUILD='P127-CONSOLIDADO-20260919'" not in Path('index.html').read_text('utf-8'): raise SystemExit('ABORTADO: build marker ausente')
print('AUDITORIA OK')
print('index sha512:',idx_hash)
print('firestore sha256:',rules_after)
