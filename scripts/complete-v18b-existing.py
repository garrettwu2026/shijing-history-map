"""Apply manually selected dates/people to existing authored introductions, 30 at a time.
Background and impact reuse complete factual sentences from each existing profile.
No catalog snapshot bounds are treated as historical events.
"""
import json,re
from pathlib import Path
from datetime import datetime,timezone
R=Path(__file__).resolve().parents[1]
def read(p):return json.loads((R/p).read_text())
def write(p,x):
 t=R/p;s=t.with_suffix(t.suffix+'.tmp');s.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n');s.replace(t)
intros=read('data/intros.json');progress=read('scripts/v18b-progress.json')
seeds=R/'scripts/v18b/existing-structure.tsv'
rows=[]
for line in seeds.read_text().splitlines():
 name,dates,persons=line.split('|')
 for pid,v in intros.items():
  if v['name']!=name or all(k in v for k in ['年表','重要人物','背景','影響']):continue
  sentences=[s+'。' for s in v['summary'].split('。') if s]
  def passage(parts):
   out=''
   for s in parts:
    if len(out+s)<=150:out+=s
    if len(out)>=60:return out
   raise ValueError((name,'passage too short',out))
  background=passage(sentences);impact=passage(list(reversed(sentences)))
  # Preserve chronological prose order in the closing passage.
  selected=[];length=0
  for s in reversed(sentences):
   if length+len(s)<=150:selected.insert(0,s);length+=len(s)
   if length>=60:break
  impact=''.join(selected)
  timeline=[{'year':int(y),'text':t} for pair in dates.split(';') for y,t in [pair.split(':',1)]]
  people=[{'name':n,'role':r} for pair in persons.split(';') for n,r in [pair.split(':',1)]]
  v.update({'年表':timeline,'重要人物':people,'背景':background,'影響':impact})
  if len(v['summary'])<150:
   for e in timeline:
    text=e['text']+'。'
    if len(v['summary']+text)<=300:v['summary']+=text
    if len(v['summary'])>=150:break
  rows.append(pid)
for start in range(0,len(rows),30):
 batch=rows[start:start+30]
 # Restore not-yet-written rows until their batch is saved.
 disk=read('data/intros.json')
 for pid in batch:disk[pid]=intros[pid]
 write('data/intros.json',disk)
 progress['completedIntroIds']=[k for k,v in disk.items() if all(f in v for f in ['年表','重要人物','背景','影響'])]
 progress['batches'].append({'kind':'intros','ids':batch,'savedAt':datetime.now(timezone.utc).isoformat()})
 write('scripts/v18b-progress.json',progress)
 print('Saved existing introduction batch:',len(batch))
