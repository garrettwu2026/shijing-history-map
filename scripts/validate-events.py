"""Validate schema, unique identities, category vocabulary, and editorial distribution."""
import json, collections, re
re_id=re.compile(r'e[0-9]{4,}')
from pathlib import Path
root=Path(__file__).resolve().parents[1]
events=json.loads((root/'data/events.json').read_text())
categories={'戰爭','王朝與政治','科技與發明','宗教與思想','文化與藝術','探索與貿易'}
ids=set();titles=set()
for e in events:
    assert type(e['year']) is int and -5000<=e['year']<=2026 and e['year']!=0,e
    assert type(e['lat']) in (int,float) and type(e['lon']) in (int,float) and -90<=e['lat']<=90 and -180<=e['lon']<=180,e
    assert type(e['startYear']) is int and type(e['endYear']) is int and e['startYear']<=e['year']<=e['endYear'],e
    assert re_id.fullmatch(e['id']),e
    assert e['category'] in categories,e
    assert e['title'] and e['description'],e
    assert all('待考' not in e.get(field, '') for field in ('title', 'summary', 'description')),e
    assert e['id'] not in ids,e
    assert (e['year'],e['title']) not in titles,e
    ids.add(e['id']);titles.add((e['year'],e['title']))
periods=[('5000–1000 BCE',-5000,-1000),('1000 BCE–500 CE',-1000,500),('500–1500',500,1500),('1500–1900',1500,1900),('1900–today',1900,2027)]
print(f'Valid JSON / schema / unique IDs: {len(events)} events')
for label,lo,hi in periods:print(f'{label} [{lo}, {hi}): {sum(lo<=e["year"]<hi for e in events)}')
print('Regions:',dict(collections.Counter(e['region'] for e in events)))
print('Categories:',dict(collections.Counter(e['category'] for e in events)))
print('Post-2010:',sum(e['year']>2010 for e in events))
# Detailed content is lazy and keyed by the stable event ID.
import re,sys
catalog=json.loads((root/'data/polities.json').read_text())['polities']
registry=json.loads((root/'data/event-id-registry.json').read_text())
assert all(registry.get(e['title'])==e['id'] for e in events),'event registry mismatch'
# Historical renamed titles may remain as aliases in the registry.
details=json.loads((root/'data/event-details.json').read_text())
for eid,item in details.items():
    assert eid in ids,f'{eid}: unknown event'
    assert {'description','背景','經過','影響','參與方'}<=item.keys(),f'{eid}: missing fields'
    assert set(item)<={'description','背景','經過','影響','參與方','參與方說明'},f'{eid}: unexpected fields'
    for field,lo,hi in [('description',100,250),('背景',50,150),('經過',50,150),('影響',50,150)]:
        assert isinstance(item[field],str) and lo<=len(item[field])<=hi,f'{eid}: {field} length {len(item[field])}'
    participants=item['參與方']
    assert isinstance(participants,list) and participants and len(set(participants))==len(participants),f'{eid}: participants'
    assert all(pid in catalog for pid in participants),f'{eid}: unknown polity'
    assert not re.search(r'https?://|www\.|來源\s*[:：]|參考(?:資料|文獻)|引用\s*[:：]|citation|source',json.dumps(item,ensure_ascii=False),re.I),f'{eid}: sources in details'
print(f'事件詳細資料結構驗證通過：{len(details)} 筆')
if '--require-complete' in sys.argv:
    progress=json.loads((root/'scripts/v18b-progress.json').read_text())
    assert 300<=len(details)<=600,f'事件詳細資料尚未達 300 筆：目前 {len(details)}'
    assert len(ids-set(progress['baselineEventIds']))>=90,'新增事件尚未接近 100 筆'
