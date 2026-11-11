import json,sys
from pathlib import Path
p=Path(__file__).with_name('v20-map-progress.json');d=json.loads(p.read_text());t=d['task24']
for key in sys.argv[1:]:
 if key in t['items']:t['items'][key]='done'
t['completed']=sum(v=='done' for v in t['items'].values());t['status']='complete' if t['completed']==t['target'] else 'in-progress';p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
