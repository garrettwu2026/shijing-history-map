"""Group identical polity properties, preserve every polygon part; simplify rings."""
import json,collections
from pathlib import Path
from shapely.geometry import shape,mapping
p=Path(__file__).resolve().parents[1]/'data/world_1492.geojson'
x=json.loads(p.read_text());groups={}; nulls=[]
for f in x['features']:
 if not f['geometry']:nulls.append(f);continue
 key=f['properties'].get('NAME','')
 if key not in groups:groups[key]={'type':'Feature','properties':{'NAME':key},'geometry':{'type':'MultiPolygon','coordinates':[]}}
 g=f['geometry'];groups[key]['geometry']['coordinates'].extend(g['coordinates'] if g['type']=='MultiPolygon' else [g['coordinates']])
features=list(groups.values())+nulls
original=json.loads(json.dumps(features))
for tolerance in [.04,.08,.12,.2,.3,.5]:
 for f,o in zip(features,original):
  if o['geometry']:f['geometry']=mapping(shape(o['geometry']).simplify(tolerance,preserve_topology=True))
 def rounded(v):
  if isinstance(v,float):return round(v,3)
  if isinstance(v,(list,tuple)):return [rounded(a) for a in v]
  if isinstance(v,dict):return {k:rounded(a) for k,a in v.items()}
  return v
 text=json.dumps(rounded({'type':'FeatureCollection','features':features}),ensure_ascii=False,separators=(',',':'))
 if len(text.encode())<450000:break
assert len(text.encode())<450000
p.write_text(text);print('1492',len(text.encode()),'bytes; tolerance',tolerance,'; grouped features',len(features))
