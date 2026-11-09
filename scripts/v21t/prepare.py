"""Extract compact TASK21T candidates; never print the full catalog/progress."""
import argparse
import json
import re
from pathlib import Path
R = Path(__file__).resolve().parents[2]
def read(p): return json.loads((R/p).read_text())
parser=argparse.ArgumentParser(description=__doc__)
mode=parser.add_mutually_exclusive_group()
mode.add_argument('--summary-only',action='store_true',help='Read progress only; do not rebuild candidates')
mode.add_argument('--select',metavar='REGEX',help='Select from the compact candidate cache without reading the catalog')
parser.add_argument('--limit',type=int,default=20,help='Maximum cached candidates to display (1–30; default 20)')
args=parser.parse_args()
if not 1 <= args.limit <= 30:
    parser.error('--limit must be between 1 and 30')
p=read('scripts/v18b-progress.json')['task21t']
print(json.dumps({k:p.get(k) for k in ['completed','remainingToTarget','nextBatch','pendingValidation','validationCommand']},ensure_ascii=False))
validation=p.get('lastValidation',{})
if validation:
    print(json.dumps({'validationSummary':{
        k:validation.get(k) for k in ['build','npmValidate','otherChecksPassed','resumeIdempotent','originalProfilesUnchanged']
    },'failedChecks':[k for k,v in validation.get('checks',{}).items() if not v.get('passed')],
    'artifacts':validation.get('artifacts')},ensure_ascii=False))
if args.summary_only:
    raise SystemExit(0)
if args.select is not None:
    try:
        pattern=re.compile(args.select,re.I)
    except re.error as error:
        parser.error(f'invalid selection regex: {error}')
    cache=R/'scripts/v21t/candidates.json'
    if not cache.exists():
        parser.error('candidate cache missing; run prepare.py without arguments first')
    rows=[v for v in json.loads(cache.read_text()) if pattern.search(' '.join(v['original'])+' '+v.get('zh',''))]
    print(json.dumps({'matches':len(rows),'shown':min(len(rows),args.limit),'candidates':rows[:args.limit]},ensure_ascii=False))
    raise SystemExit(0)
c=read('data/polities.json')['polities']; i=read('data/intros.json')
aliases=p.get('nameOnlyAliases', {})
rows=[dict(id=k,original=v['datasetNames'],zh=v.get('zh'),status=v['translationStatus'],importance=v['importance'],years=[v['validFrom'],v['validTo']]) for k,v in c.items() if k not in i and k not in aliases]
rows.sort(key=lambda v: (-v['importance'], -(v['years'][1]-v['years'][0]), v['original'][0]))
(R/'scripts/v21t/candidates.json').write_text(json.dumps(rows,ensure_ascii=False,separators=(',',':'))+'\n')
print('candidates:',len(rows))
# Candidate details stay on disk; select only the rows needed for research.
