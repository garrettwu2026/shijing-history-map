"""Idempotent schema migration; unknown translations remain explicitly unreviewed."""
import json,hashlib,re,collections
from pathlib import Path
R=Path(__file__).resolve().parents[1]; D=R/'data'
def read(n):return json.loads((D/n).read_text())
def write(n,x):(D/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
existing=read('polities.json')['polities'] if (D/'polities.json').exists() else {}
old=read('names.json'); seen=collections.defaultdict(list)
for s in read('snapshots.json'):
 for f in read(s['file'])['features']:
  k=f['properties'].get('NAME','')
  if k and k.strip() and k.strip()!='?':seen[k].append(s['year'])
fix={'Holy Roman Empire':'神聖羅馬帝國','Kalmar Union':'卡爾馬聯合','White Horde':'白帳汗國','Mughal':'蒙兀兒帝國','Mughal Empire':'蒙兀兒帝國','Fiji':'斐濟','Sudan':'蘇丹','Japan':'日本','Ming Empire':'明朝','Ming Chinese Empire':'明朝','Byzantine Empire':'拜占庭帝國','Aztec Empire':'阿茲特克帝國'}
index={}; polities={}
for k,years in sorted(seen.items()):
 canonical={'Ming Chinese Empire':'Ming Empire'}.get(k,k)
 pid='p-'+hashlib.sha256(canonical.encode()).hexdigest()[:16]; index[k]=pid
 n=old.get(k,old.get(canonical,{})); zh=fix.get(k,n.get('zh',k))
 if pid not in polities:polities[pid]=dict(id=pid,zh=zh,confidence='medium' if n or k in fix else 'low',translationStatus='existing-unreviewed' if n else 'curated' if k in fix else 'untranslated',importance=max(n.get('importance',0),9 if any(t in k for t in ['Byzant','Japan','Mughal','Aztec','Holy Roman','Mongol','Ming']) else 0),validFrom=min(years),validTo=max(years),datasetNames=[],endonyms=[],exonyms=[],geographicAliases=[],periods=[],sources=['https://github.com/aourednik/historical-basemaps'],legacyNative=n.get('native',''))
 p=polities[pid];p['datasetNames'].append(k);p['validFrom']=min(p['validFrom'],min(years));p['validTo']=max(p['validTo'],max(years))
for k,pid in index.items():
 p=polities[pid]
 if k=='China':p['periods']=[dict(fromYear=-5000,toYear=1911,zh='中國',aliases=[]),dict(fromYear=1912,toYear=1948,zh='中華民國',aliases=[]),dict(fromYear=1949,toYear=2026,zh='中華人民共和國',aliases=['中國'])]
 if k=='Korea':p['periods']=[dict(fromYear=1392,toYear=1896,zh='朝鮮王朝',aliases=[]),dict(fromYear=1897,toYear=1909,zh='大韓帝國',aliases=[]),dict(fromYear=1910,toYear=1944,zh='日治朝鮮',aliases=[]),dict(fromYear=1945,toYear=1947,zh='朝鮮半島（分區佔領）',aliases=[]),dict(fromYear=1948,toYear=2026,zh='朝鮮半島（南北韓）',aliases=[])]
 if 'Byzant' in k:p['endonyms']=[dict(original='Βασιλεία Ῥωμαίων',transliteration='Basileía Rhōmaíōn',meaning='羅馬帝國',fromYear=330,toYear=1453)];p['exonyms']=['拜占庭帝國（後世稱呼）']
 if k in ['Ottoman Empire','Ottomans']:p['endonyms']=[dict(original='دولت عليه عثمانيه',transliteration='Devlet-i ʿAliyye-i ʿOsmâniyye',meaning='崇高的鄂圖曼國',fromYear=1299,toYear=1922)]
for pid,p in polities.items():
 if pid in existing:
  for field in ['zh','confidence','translationStatus','endonyms','exonyms','geographicAliases','sources']:
   p[field]=existing[pid][field]
write('polities.json',dict(version=3,index=index,polities=polities))
corrections=[dict(id='err-mongol-1200',year=1200,match='Mongol Empire',zh='蒙古各部',note='1206年立國；僅覆寫名稱，上游幾何仍待考證。',source='https://royalarmouries.org/objects-and-stories/stories/the-mongols/rise-of-the-mongols'),dict(id='err-zaire-2010',year=2010,match='Zaire',zh='剛果民主共和國',note='1997年恢復國名；名稱勘誤不代表重新考證幾何。',source='https://www.britannica.com/place/Democratic-Republic-of-the-Congo')]
issues=[]
limits={'Mongol Empire':(1206,1368),'Zaire':(1971,1997),'Soviet Union':(1922,1991),'Holy Roman Empire':(962,1806),'Byzantine Empire':(330,1453),'Ming Empire':(1368,1644),'Ming Chinese Empire':(1368,1644)}
for k,(lo,hi) in limits.items():
 for y in sorted(set(seen.get(k,[]))):
  if y<lo or y>hi:issues.append(dict(name=k,year=y,expectedFrom=lo,expectedTo=hi,status='needs-review',kind='name/geometry chronology'))
write('errata.json',dict(overrides=corrections,scan=issues))
events=read('events.json'); registry={e['title']:e['id'] for e in events};write('event-id-registry.json',registry)
for e in events:
 e.setdefault('startYear',e['year']);e.setdefault('endYear',e['year']);e['precision']={'約':'approximate','傳統':'traditional'}.get(e.get('dateNote'),'exact');e.setdefault('sourceUrl','https://www.britannica.com/search?query='+__import__('urllib.parse',fromlist=['quote']).quote(e['title']));e.setdefault('sourceStatus','research-link-unverified');e.setdefault('chronologyStatus','single-year-unreviewed')
write('events.json',events)
print(len(index),'names;',len(polities),'IDs;',len(issues),'chronology issues;',len(events),'events')
