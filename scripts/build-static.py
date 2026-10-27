"""Publish only public assets; version every data URL by content digest."""
from pathlib import Path
import shutil,hashlib,re,json,os
R=Path(__file__).resolve().parents[1]; out=R/'dist';shutil.rmtree(out,ignore_errors=True);out.mkdir()
for name in ['index.html','app.js','style.css','favicon.svg','og-preview.png']:
 if (R/name).exists():shutil.copy(R/name,out/name)
for name in ['data','vendor']:shutil.copytree(R/name,out/name)
h=hashlib.sha256()
for p in sorted((R/'data').glob('*')):h.update(p.read_bytes())
p=out/'app.js';p.write_text(p.read_text().replace('v3-20261027',h.hexdigest()[:16]))
print('Built dist; data version',h.hexdigest()[:16])

base=os.environ.get('SITE_URL',os.environ.get('RENDER_EXTERNAL_URL','')).rstrip('/')
if base:
    p=out/'index.html'
    html=p.read_text().replace('content="/og-preview.png"',f'content="{base}/og-preview.png"')
    html=html.replace('</head>',f'<link rel="canonical" href="{base}/"><meta property="og:url" content="{base}/"></head>')
    p.write_text(html)
