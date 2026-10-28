"""Compile hand-edited event additions; do not generate facts from date sequences.
Input: year|place|category index|title|description. A leading ~ marks approximate dates.
Coordinates represent a related site, not territorial extent.
"""
import json
from event_text import clean_event_text
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
CATEGORIES=['戰爭','王朝與政治','科技與發明','宗教與思想','文化與藝術','探索與貿易']
# Place gazetteer: latitude, longitude, broad editorial region.
PLACES={}
for line in (ROOT/'data/event-places.tsv').read_text().splitlines():
    name,lat,lon,region=line.split('|');PLACES[name]=(float(lat),float(lon),region)
def era(y):return 0 if y < -1000 else 1 if y < 500 else 2 if y < 1500 else 3 if y < 1900 else 4
def compile_events():
    # Original records are retained in a separate editorial source for reproducibility.
    events=json.loads((ROOT/'data/events-original.json').read_text())
    for line in (ROOT/'data/events-additions.tsv').read_text().splitlines():
        if not line.strip() or line.startswith('#'):continue
        date,place,cat,title,description=line.split('|')
        lat,lon,region=PLACES[place]
        events.append(dict(year=int(date.lstrip('~')),lat=lat,lon=lon,title=title,description=description,category=CATEGORIES[int(cat)],dateNote='約' if date.startswith('~') else '傳統' if '傳統年代' in title or '傳統建城年' in title or '傳統創校年' in title else '',region=region))
    locations=json.loads((ROOT/'data/event-locations.json').read_text())
    for e in events:
        if e['title'] in locations:e['lat'],e['lon']=locations[e['title']]
        if e['title'] in ['大衛營協議','岱頓和平協議']:e['region']='美洲'
        if e['title']=='加加林首次載人太空飛行':e['region']='亞洲'
    events.sort(key=lambda e:(e['year'],e['title']))
    import hashlib
    registry=json.loads((ROOT/'data/event-id-registry.json').read_text())
    previous={e['id']:e for e in json.loads((ROOT/'data/events.json').read_text())}
    for e in events:
        e['id']=registry.get(e['title'],'evt-'+hashlib.sha256((str(e['year'])+e['title']).encode()).hexdigest()[:16])
        for field in ('title', 'summary', 'description'):
            if field in e:e[field]=clean_event_text(e[field])
        registry[e['title']]=e['id']
        for key in ['startYear','endYear','precision','sourceUrl','sourceStatus','chronologyStatus']:
            if key in previous.get(e['id'],{}):e[key]=previous[e['id']][key]
    (ROOT/'data/event-id-registry.json').write_text(json.dumps(registry,ensure_ascii=False,indent=2)+'\n')
    (ROOT/'data/events.json').write_text(json.dumps(events,ensure_ascii=False,indent=2)+'\n')
    return events
if __name__=='__main__':compile_events()
