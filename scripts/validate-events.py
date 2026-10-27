"""Validate schema, unique identities, category vocabulary, and editorial distribution."""
import json, collections
from pathlib import Path
root=Path(__file__).resolve().parents[1]
events=json.loads((root/'data/events.json').read_text())
categories={'戰爭','王朝與政治','科技與發明','宗教與思想','文化與藝術','探索與貿易'}
ids=set();titles=set()
for e in events:
    assert isinstance(e['year'],int) and -5000<=e['year']<=2026 and e['year']!=0,e
    assert -90<=e['lat']<=90 and -180<=e['lon']<=180,e
    assert e['category'] in categories,e
    assert e['title'] and e['description'],e
    assert e['id'] not in ids,e
    assert (e['year'],e['title']) not in titles,e
    ids.add(e['id']);titles.add((e['year'],e['title']))
periods=[('5000–1000 BCE',-5000,-1000),('1000 BCE–500 CE',-1000,500),('500–1500',500,1500),('1500–1900',1500,1900),('1900–today',1900,2027)]
print(f'Valid JSON / schema / unique IDs: {len(events)} events')
for label,lo,hi in periods:print(f'{label} [{lo}, {hi}): {sum(lo<=e["year"]<hi for e in events)}')
print('Regions:',dict(collections.Counter(e['region'] for e in events)))
print('Categories:',dict(collections.Counter(e['category'] for e in events)))
print('Post-2010:',sum(e['year']>2010 for e in events))
