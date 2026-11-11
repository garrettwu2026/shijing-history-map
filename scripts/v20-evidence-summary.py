"""Inventory the matched screenshot matrix and lazy geometry payload sizes."""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
names=[f'{w}-{y}-z{z}.png' for w in [1280,390,320] for y in [-10000,-300,1500,1900] for z in [1.25,3,5,8]]
missing={kind:[n for n in names if not (root/'artifacts'/f'v20-{kind}'/n).exists()] for kind in ['baseline','after']}
manifest=json.loads((root/'data/detail/manifest.json').read_text())
sizes={'land':(root/'data/detail'/manifest['land']).stat().st_size,**{y:(root/'data/detail'/f).stat().st_size for y,f in manifest['snapshots'].items()}}
report={'screenshotsPerVersion':len(names),'missingScreenshots':missing,'zoomThreshold':4.5,'gzipBytes':sizes,'totalGzipBytes':sum(p.stat().st_size for p in (root/'data/detail').glob('*.gz'))}
(root/'artifacts/v20-evidence-summary.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'screenshotsPerVersion':len(names),'missing':missing,'landBytes':sizes['land'],'1500bytes':sizes['1500'],'1900bytes':sizes['1900'],'totalGzipBytes':report['totalGzipBytes']},indent=2))
raise SystemExit(any(missing.values()))
