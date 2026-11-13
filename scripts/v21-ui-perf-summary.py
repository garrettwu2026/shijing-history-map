"""Summarize matched cold-cache runs and enforce the unchanged +10% budget."""
import json,math,statistics
from pathlib import Path
rows=json.loads(Path('artifacts/v21-perf-paired.json').read_text())
def p95(values):return sorted(values)[math.ceil(len(values)*.95)-1]
report={'budgetRatio':1.10,'browser':sorted({r['browser'] for r in rows}),'viewports':[]}
for width in [1280,390,320]:
 groups={k:[r for r in rows if r['width']==width and r['variant']==k] for k in ['baseline','after']}
 assert all(len(v)==5 for v in groups.values()),'five independent cold-cache runs per viewport/variant'
 cold={k:statistics.median(r['cold'] for r in v) for k,v in groups.items()}
 stages={s:{k:p95([frame for r in v for frame in r['stages'][s]]) for k,v in groups.items()} for s in ['panZoom','release','playback']}
 cold['ratio']=cold['after']/cold['baseline']
 for s in stages.values():s['ratio']=s['after']/s['baseline']
 fonts=[f for r in groups['after'] for f in r['initialFonts']]
 entry={'width':width,'coldMs':cold,'interactionP95Ms':stages,'fontTransferMedianBytes':statistics.median(sum(f['bytes'] for f in r['initialFonts']) for r in groups['after']),'fontRequestCountMedian':statistics.median(len(r['initialFonts']) for r in groups['after']),'fontFirstRequestMedianMs':statistics.median(min(f['start'] for f in r['initialFonts']) for r in groups['after']),'fontTotalTransferAfterInteractionsMedianBytes':statistics.median(sum(f['bytes'] for f in r['fonts']) for r in groups['after']),'fontFiles':sorted({f['name'] for f in fonts})}
 report['viewports'].append(entry)
report['passed']=all(v['coldMs']['ratio']<=1.10 and all(s['ratio']<=1.10 for s in v['interactionP95Ms'].values()) for v in report['viewports'])
Path('artifacts/v21-perf-summary.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2));raise SystemExit(0 if report['passed'] else 1)
