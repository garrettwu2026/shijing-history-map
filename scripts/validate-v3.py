import json,hashlib
from pathlib import Path
R=Path(__file__).resolve().parents[1];D=R/'data'
def read(n):return json.loads((D/n).read_text())
c=read('polities.json');names=set();noise=set()
for s in read('snapshots.json'):
 for f in read(s['file'])['features']:
  k=f['properties'].get('NAME','')
  if k and k.strip() and k.strip()!='?':names.add(k)
  else:noise.add(k)
assert names<=c['index'].keys()
assert c['index']['Ming Chinese Empire']==c['index']['Ming Empire']
for k,pid in c['index'].items():
 p=c['polities'][pid];assert p['id']==pid and p['validFrom']<=p['validTo'];assert p['confidence'] in ['low','medium','high']
for k in ['Holy Roman Empire','Mughal','Japan','Byzantine Empire','Aztec Empire']:
 if k in c['index']:assert c['polities'][c['index'][k]]['importance']>0
registry=read('event-id-registry.json');events=read('events.json')
for e in events:
 assert registry[e['title']]==e['id'];assert e['startYear']<=e['year']<=e['endYear'];assert e['precision'] in ['exact','approximate','traditional'];assert e['sourceUrl'].startswith('https://')
assert (D/'world_1492.geojson').stat().st_size<450000
assert len(read('errata.json')['overrides'])>=2
print(f'{len(names)} names; {len(c["polities"])} polity IDs; {len(events)} stable event IDs; 1492 <450000 bytes; semantic checks passed')
