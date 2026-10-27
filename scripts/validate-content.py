"""Validate editorial semantics, correction coverage, and module publication."""
import json,subprocess
from pathlib import Path
from urllib.parse import urlparse
R=Path(__file__).resolve().parents[1]
def read(n):return json.loads((R/'data'/n).read_text())
c=read('polities.json');err=read('errata.json')['overrides'];events=read('events.json')
def correction(key,year):
 return next((e for e in err if e['match']==key and e.get('fromYear',e.get('year'))<=year<=e.get('toYear',e.get('year'))),None)
for year,expected in [(1945,'比屬剛果'),(1960,'剛果共和國（利奧波德維爾）'),(1970,'剛果民主共和國'),(1971,'薩伊爾'),(1996,'薩伊爾'),(1997,'剛果民主共和國'),(2000,'剛果民主共和國'),(2010,'剛果民主共和國')]:
 e=correction('Zaire',year);assert e['zh']==expected and e['nameStatus']=='corrected' and e['geometryStatus']=='needs-review'
assert correction('Mongol Empire',1200)['geometryStatus']=='needs-review'
for i,e in enumerate(err):
 for other in err[i+1:]:
  if e['match']==other['match']:assert e.get('toYear',e.get('year'))<other.get('fromYear',other.get('year')) or other.get('toYear',other.get('year'))<e.get('fromYear',e.get('year'))
for n in c['polities'].values():
 for field in ['periods','endonyms']:
  periods=sorted(n[field],key=lambda x:x['fromYear'])
  for i,p in enumerate(periods):
   assert p['fromYear']<=p['toYear']
   if field=='periods' and i:assert periods[i-1]['toYear']<p['fromYear']
   if field=='endonyms':assert p['language'] and urlparse(p['sourceUrl']).scheme=='https' and p['sourceStatus'] in ['reference-unverified','verified']
for e in events:
 assert e['startYear']<=e['year']<=e['endYear']
 assert e['sourceStatus'] in ['verified','article-unverified','research-link-unverified']
 if e['sourceStatus']=='verified':assert 'search?' not in e['sourceUrl']
assert any(e['startYear']==1337 and e['endYear']==1453 for e in events)
# Exercise the actual shared intersection/distance/color functions.
subprocess.run(['node','--input-type=module','-e',"""
import assert from 'node:assert/strict';
import {intersects,eventDistance,stableColor} from './modules/content.js';
const e={startYear:1337,endYear:1453};
assert(intersects(e,1400,0));assert(intersects(e,1480,27));assert(!intersects(e,1481,27));assert.equal(eventDistance(e,1400),0);assert.equal(eventDistance(e,1500),47);
assert.equal(stableColor('stable-id'),stableColor('stable-id'));
"""],cwd=R,check=True)
assert list((R/'dist/modules').glob('map.*.js')) and list((R/'dist/modules').glob('events.*.js'))
print('Content semantics passed:',len(c['polities']),'polities;',sum(n['translationStatus']=='untranslated' for n in c['polities'].values()),'untranslated;',sum(e['startYear']!=e['endYear'] for e in events),'event intervals')
