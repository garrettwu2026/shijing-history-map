"""Apply authored TASK21 profiles in validated, atomic batches of at most 30.

Complete introductions are immutable. Catalog snapshot dates are never used as
historical event dates. Missing numerical estimates and relationships stay omitted.
"""
import importlib.util
import sys
sys.dont_write_bytecode=True
import json
from datetime import datetime, timezone
from pathlib import Path
R=Path(__file__).resolve().parents[1]
def read(p):return json.loads((R/p).read_text())
def write(p,v):
 t=R/p;tmp=t.with_suffix(t.suffix+'.tmp');tmp.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n');tmp.replace(t)
spec=importlib.util.spec_from_file_location('validator',R/'scripts/validate-intros.py');validator=importlib.util.module_from_spec(spec);spec.loader.exec_module(validator)
catalog=read('data/polities.json');polities=catalog['polities'];intros=read('data/intros.json');progress=read('scripts/v18b-progress.json');glossary=read('data/glossary.json')
def complete(v):return all(k in v for k in ['summary','年表','重要人物','背景','影響']) and 150<=len(v['summary'])<=300 and 5<=len(v['年表'])<=10 and 3<=len(v['重要人物'])<=8
pending=[]
figures=read('scripts/v21/key-figures.json')
for line in (R/'scripts/v21/polities.tsv').read_text().splitlines():
 if not line.strip() or line.startswith('#'):continue
 name,span,capital,language,background,impact,dates,people=line.split('|')
 timeline=[{'year':int(y),'text':t} for pair in dates.split(';') for y,t in [pair.split(':',1)]]
 persons=[{'name':n,'role':r} for pair in people.split(';') for n,r in [pair.split(':',1)]]
 matches=[pid for pid,p in polities.items() if p['zh']==name and p.get('translationStatus')!='untranslated'];assert matches,name
 for pid in matches:
  if complete(intros.get(pid,{})):continue
  v=dict(intros.get(pid,{}));v.update({'name':name,'summary':name+'：'+background+'。'.join(x['text'] for x in timeline[1:3])+'。'+impact,'存續年代':span,'首都':capital,'主要族群/語言':language,'重要事件':[x['text'] for x in timeline[:4]],'年表':timeline,'重要人物':persons,'背景':background,'影響':impact})
  v.setdefault('前身/後繼',[])
  if name in figures:v['關鍵數據']=figures[name]
  pending.append((pid,v))
# Explicitly reviewed equivalent labels share a historical profile. This is
# deliberately not fuzzy matching: overlapping regions and successor states are
# not equivalent. Preserve every complete record, including differing old names.
from copy import deepcopy
available={**intros,**dict(pending)}
for target,source in read('scripts/v21/equivalent-names.json').items():
 sources=[v for v in available.values() if v['name']==source and complete(v)]
 assert sources,(target,source)
 for pid,p in polities.items():
  if p['zh']!=target or p.get('translationStatus')=='untranslated' or pid in available:continue
  v=deepcopy(sources[0]);v['name']=target
  if source!=target:v['summary']=v['summary'].replace(source,target)
  pending.append((pid,v));available[pid]=v
assert len({pid for pid,v in pending})==len(pending),'Duplicate authored profile'
# Check every record before writing any batch, including all preserved records.
errors=validator.validate({**intros,**dict(pending)},catalog,glossary,True)
if errors:raise SystemExit('\n'.join(errors))
for start in range(0,len(pending),30):
 batch=pending[start:start+30];intros.update(batch);write('data/intros.json',intros)
 progress['completedIntroIds']=[pid for pid,v in intros.items() if complete(v)]
 progress['batches'].append({'kind':'task21-intros','ids':[pid for pid,v in batch],'savedAt':datetime.now(timezone.utc).isoformat()})
 progress['counts']['introsTotal']=len(intros);progress['counts']['introsNew']=len(set(intros)-set(progress['baselineIntroIds']))
 progress['counts']['introFields']={f:sum(f in v for v in intros.values()) for f in ['summary','年表','重要人物','關鍵數據','背景','影響']}
 progress.setdefault('task21',{}).update({'target':1500,'startCount':300,'completed':len(progress['completedIntroIds']),'translatedCatalogIds':sum(p.get('translationStatus')!='untranslated' for p in polities.values()),'remainingToTarget':max(0,1500-len(progress['completedIntroIds'])),'status':'in-progress','addedThisTask':len(progress['completedIntroIds'])-300,'translatedWithoutIntro':sum(pid not in intros and p.get('translationStatus')!='untranslated' for pid,p in polities.items()),'untranslatedCatalogIds':sum(p.get('translationStatus')=='untranslated' for p in polities.values())})
 progress['remainingMinimum']['newIntros']=max(0,500-len(intros));progress['updatedAt']=datetime.now(timezone.utc).isoformat();write('scripts/v18b-progress.json',progress)
 print('Saved TASK21 batch:',len(batch),'total:',len(intros))
# Refresh derived counts even after an editorial withdrawal or a no-op resume.
progress['completedIntroIds']=[pid for pid,v in intros.items() if complete(v)]
progress['counts']['introsTotal']=len(intros)
progress['counts']['introsNew']=len(set(intros)-set(progress['baselineIntroIds']))
progress['counts']['introFields']={f:sum(f in v for v in intros.values()) for f in ['summary','年表','重要人物','關鍵數據','背景','影響']}
progress.setdefault('task21',{}).update({'target':1500,'startCount':300,'completed':len(progress['completedIntroIds']),'remainingToTarget':max(0,1500-len(progress['completedIntroIds'])),'translatedCatalogIds':sum(p.get('translationStatus')!='untranslated' for p in polities.values()),'status':'in-progress','addedThisTask':len(progress['completedIntroIds'])-300,'translatedWithoutIntro':sum(pid not in intros and p.get('translationStatus')!='untranslated' for pid,p in polities.items()),'untranslatedCatalogIds':sum(p.get('translationStatus')=='untranslated' for p in polities.values())})
progress['remainingMinimum']['newIntros']=max(0,500-len(intros))
# Do not alter timestamps on a no-op rerun.
write('scripts/v18b-progress.json',progress)
print('Already complete records skipped; new records:',len(pending))
