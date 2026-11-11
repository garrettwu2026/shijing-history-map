"""All existing browser verifiers, original assertions and thresholds, localhost only."""
import os,subprocess,json
from pathlib import Path
out=Path('artifacts/v20-checks');out.mkdir(exist_ok=True);results=[]
commands=[('test-browser',['npm','run','test:browser'])]
commands += [(p.stem,['node','scripts/v20-verify-local.cjs',str(p)]) for p in sorted(Path('scripts').glob('verify*.cjs')) if p.name not in ['verify-v7.cjs']]
commands += [('test-performance',['npm','run','test:performance'])]
for name,cmd in commands:
 env={**os.environ,'BASE_URL':'http://localhost:8025' if name=='verify-performance' else 'http://localhost:8025/dist'}
 with (out/(name+'.log')).open('w') as log:r=subprocess.run(cmd,env=env,stdout=log,stderr=subprocess.STDOUT)
 results.append({'check':name,'exit':r.returncode});(out/'results.json').write_text(json.dumps(results,indent=2));print(name,r.returncode,flush=True)
raise SystemExit(any(r['exit'] for r in results))
