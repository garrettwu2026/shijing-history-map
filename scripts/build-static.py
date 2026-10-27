"""Publish only public assets; version every data URL by content digest."""
from pathlib import Path
import shutil,hashlib,re,json,os
R=Path(__file__).resolve().parents[1]; out=R/'dist';shutil.rmtree(out,ignore_errors=True);out.mkdir()
for name in ['index.html','app.js','data-worker.js','style.css','favicon.svg','og-preview.png']:
 if (R/name).exists():shutil.copy(R/name,out/name)
for name in ['data','vendor','modules']:shutil.copytree(R/name,out/name)
# Hash each public data filename, including metadata. Rewrite snapshot paths
# before hashing its manifest so immutable URLs always identify exact content.
mapping={}
for p in sorted((out/'data').glob('*')):
 if p.name=='snapshots.json':continue
 digest=hashlib.sha256(p.read_bytes()).hexdigest()[:16]
 name=f'{p.stem}.{digest}.json' if p.suffix in ['.json','.geojson'] else f'{p.stem}.{digest}{p.suffix}'
 mapping[p.name]=name;p.rename(p.with_name(name))
p=out/'data/snapshots.json'
rows=json.loads(p.read_text())
for row in rows:row['file']=mapping[row['file']]
p.write_text(json.dumps(rows,ensure_ascii=False,separators=(',',':')))
name=f'snapshots.{hashlib.sha256(p.read_bytes()).hexdigest()[:16]}.json'
mapping[p.name]=name;p.rename(p.with_name(name))
for p in [out/'app.js',*(out/'modules').glob('*.js')]:
 text=p.read_text()
 for old,new in mapping.items():text=text.replace(old,new)
 p.write_text(text)
# Revalidate entry scripts to avoid holding a manifest from an old deploy.
print('Built dist with',len(mapping),'content-hashed data assets')

base=os.environ.get('SITE_URL',os.environ.get('RENDER_EXTERNAL_URL','')).rstrip('/')
if base:
    p=out/'index.html'
    html=p.read_text().replace('content="/og-preview.png"',f'content="{base}/og-preview.png"')
    html=html.replace('</head>',f'<link rel="canonical" href="{base}/"><meta property="og:url" content="{base}/"></head>')
    p.write_text(html)
