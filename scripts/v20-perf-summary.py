"""Report paired measurements without adjusting the TASK24 10% budget."""
import json,statistics
from pathlib import Path
rows=json.loads(Path('artifacts/v20-paired-perf.json').read_text())
result={}
for width in [1280,390]:
 variants={}
 for variant in ['original','final']:
  runs=[r for r in rows if r['width']==width and r['variant']==variant]
  if len(runs)!=5:raise SystemExit(f'incomplete runs: {width} {variant}: {len(runs)}')
  variants[variant]={'runs':len(runs),'coldMedianMs':statistics.median(r['cold'] for r in runs),'interactionP95MedianMs':statistics.median(r['interaction']['p95'] for r in runs),'longFramesOver50ms':sum(r['interaction']['longFrames'] for r in runs),'longTasks':sum(len(r['longTasks']) for r in runs),'stages':{s:statistics.median(r['stages'][s]['p95'] for r in runs) for s in ['zoom','pan','release','play']}}
 a,b=variants['original'],variants['final']
 delta={k:round((b[k]/a[k]-1)*100,2) for k in ['coldMedianMs','interactionP95MedianMs']}
 result[width]={'measurements':variants,'increasePercent':delta,'passes':all(v<=10 for v in delta.values())}
Path('artifacts/v20-performance-summary.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
passes=all(r['passes'] for r in result.values())
settledPath=Path('artifacts/v20-settled-perf.json')
if settledPath.exists():
 settledRows=json.loads(settledPath.read_text());settled={}
 if len(settledRows)==24 and all('zoom' in r for r in settledRows):
  for width in [1280,390]:
   for zoom in [5,8]:
    variants={}
    for variant in ['original','final']:
     runs=[r for r in settledRows if r['width']==width and r['zoom']==zoom and r['variant']==variant]
     if len(runs)!=3:raise SystemExit('incomplete settled runs')
     variants[variant]={'p95MedianMs':statistics.median(r['p95'] for r in runs),'longFramesOver50ms':sum(r['longFrames'] for r in runs),'maxFrameMs':max(r['max'] for r in runs),'longTasks':sum(len(r['longTasks']) for r in runs)}
    delta=(variants['final']['p95MedianMs']/variants['original']['p95MedianMs']-1)*100
    settled[f'{width}-z{zoom}']={'measurements':variants,'increasePercent':round(delta,2),'passes':delta<=10}
  Path('artifacts/v20-settled-summary.json').write_text(json.dumps(settled,indent=2)+'\n')
  print(json.dumps(settled,indent=2));passes=passes and all(r['passes'] for r in settled.values())
raise SystemExit(not passes)
