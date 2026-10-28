"""Publish the runtime allowlist with compact, content-addressed assets."""
from pathlib import Path
import shutil,hashlib,json,os,subprocess
R=Path(__file__).resolve().parents[1];out=R/'dist'
subprocess.run(['python3','scripts/unify-terminology.py','--check'],cwd=R,check=True)
shutil.rmtree(out,ignore_errors=True);out.mkdir();(out/'data').mkdir();(out/'modules').mkdir()
for name in ['index.html','app.js','data-worker.js','style.css','favicon.svg','og-preview.png']:
 shutil.copy(R/name,out/name)
shutil.copytree(R/'vendor/leaflet',out/'vendor/leaflet')
for p in (R/'modules').glob('*.js'):shutil.copy(p,out/'modules'/p.name)
rows=json.loads((R/'data/snapshots.json').read_text());mapping={}
def emit(name,data):
 raw=json.dumps(data,ensure_ascii=False,separators=(',',':')).encode();target=f'{Path(name).stem}.{hashlib.sha256(raw).hexdigest()[:16]}.json';(out/'data'/target).write_bytes(raw);mapping[name]=target
for name in sorted({s['file'] for s in rows}|{'polities.json','errata.json','events.json','glossary.json'}):emit(name,json.loads((R/'data'/name).read_text()))
for row in rows:row['file']=mapping[row['file']]
emit('snapshots.json',rows)
shutil.copy(R/'data/LICENSE-historical-basemaps.txt',out/'data/LICENSE-historical-basemaps.txt')
for p in [out/'app.js',*(out/'modules').glob('*.js')]:
 s=p.read_text()
 for old,new in mapping.items():s=s.replace(old,new)
 p.write_text(s)
# Fingerprint dependency leaves first, then their importers.
assets={}
def fingerprint(p):
 s=p.read_text()
 for old,new in assets.items():s=s.replace(old,new)
 p.write_text(s);name=f'{p.stem}.{hashlib.sha256(p.read_bytes()).hexdigest()[:16]}{p.suffix}';p.rename(p.with_name(name));assets[p.name]=name
fingerprint(out/'data-worker.js')
for name in ['content.js','timeline.js','data.js','events.js','map.js']:fingerprint(out/'modules'/name)
fingerprint(out/'app.js');fingerprint(out/'style.css')
p=out/'index.html';s=p.read_text()
for old,new in {**mapping,**assets}.items():s=s.replace(old,new)
base=os.environ.get('SITE_URL',os.environ.get('RENDER_EXTERNAL_URL','')).rstrip('/')
if base:
 s=s.replace('content="/og-preview.png"',f'content="{base}/og-preview.png"').replace('</head>',f'<link rel="canonical" href="{base}/"><meta property="og:url" content="{base}/"></head>')
p.write_text(s)
print('Built runtime allowlist:',len(mapping),'compact JSON assets;',len(assets),'fingerprinted scripts/styles')
