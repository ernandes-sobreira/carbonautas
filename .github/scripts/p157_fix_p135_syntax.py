from pathlib import Path
p=Path('p135-rede-acompanhamento.js')
s=p.read_text(encoding='utf-8')
bad='`}}\n}\n\nfunction installGraphFix(){'
good='`}\n}\n\nfunction installGraphFix(){'
if bad in s:
    s=s.replace(bad,good,1)
p.write_text(s,encoding='utf-8')
