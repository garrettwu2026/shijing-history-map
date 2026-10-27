"""Check the built content-addressed manifest and Render header configuration."""
from pathlib import Path
import hashlib,json,re,gzip
root=Path(__file__).resolve().parents[1]
dist=root/'dist'
headers=[dict(re.findall(r'(path|name|value): (.+)',block)) for block in (root/'render.yaml').read_text().split('      - ')[1:]]
assert any(h['path']=='/data/*' and h['name']=='Cache-Control' and h['value']=='public, max-age=31536000, immutable' for h in headers)
assert any(h['path']=='/data/*.json' and h['value'].startswith('application/json') for h in headers)
for path in ['/','/*.html']:
 assert any(h['path']==path and h['value']=='no-cache' for h in headers)
for path in ['/app.*.js','/style.*.css','/data-worker.*.js','/modules/*.*.js']:
 assert any(h['path']==path and h['value']=='public, max-age=31536000, immutable' for h in headers)
files=list((dist/'data').glob('*.json'))
assert not list((dist/'data').glob('*.geojson'))
for p in files:
 assert re.search(r'\.'+hashlib.sha256(p.read_bytes()).hexdigest()[:16]+r'\.json$',p.name),p.name
app=next(dist.glob('app.*.js')).read_text()
manifest=next((dist/'data').glob('snapshots.*.json'))
assert manifest.name in app
rows=json.loads(manifest.read_text())
for row in rows:assert (dist/'data'/row['file']).exists()
assert next((dist/'data').glob('world_2010.*.json')).name in app
worker=next(dist.glob('data-worker.*.js'))
assert worker.name in next((dist/'modules').glob('data.*.js')).read_text()
assert not list((dist/'data').glob('events-original*'))
for p in files:assert p.read_text()==json.dumps(json.loads(p.read_text()),ensure_ascii=False,separators=(',',':'))
for p in [*dist.glob('*.js'),*dist.glob('*.css'),*(dist/'modules').glob('*.js')]:
 assert hashlib.sha256(p.read_bytes()).hexdigest()[:16] in p.name

print(f'{len(files)} hashed JSON assets; {len(rows)} snapshot URLs; Render MIME/cache rules passed')
print('Snapshot bytes:',sum((dist/'data'/s['file']).stat().st_size for s in rows),'gzip:',sum(len(gzip.compress((dist/'data'/s['file']).read_bytes())) for s in rows))
