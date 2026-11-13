"""All existing browser verifiers, original assertions and thresholds, localhost only."""
import os,subprocess,json,sys,http.server,threading,socket
from pathlib import Path
out=Path('artifacts/v21-checks');out.mkdir(exist_ok=True)
results=json.loads((out/'results.json').read_text()) if '--failed' in sys.argv and (out/'results.json').exists() else []
failed={r['check'] for r in results if r['exit']}
# Keep the localhost server in the verifier process, so it cannot expire while
# a separate long-running terminal session is executing the checks.
with socket.socket() as probe: serving=probe.connect_ex(('localhost',8025))==0
if not serving:
 class QuietHandler(http.server.SimpleHTTPRequestHandler):
  def log_message(self,*args):pass
 server=http.server.ThreadingHTTPServer(('localhost',8025),QuietHandler)
 threading.Thread(target=server.serve_forever,daemon=True).start()
commands=[('test-browser',['npm','run','test:browser'])]
commands += [(p.stem,['node','scripts/v20-verify-local.cjs',str(p)]) for p in sorted(Path('scripts').glob('verify*.cjs')) if p.name not in ['verify-v7.cjs']]
commands += [('test-performance',['npm','run','test:performance'])]
for name,cmd in commands:
 if '--failed' in sys.argv and name not in failed:continue
 env={**os.environ,'BASE_URL':'http://localhost:8025' if name=='verify-performance' else 'http://localhost:8025/dist'}
 with (out/(name+'.log')).open('w') as log:r=subprocess.run(cmd,env=env,stdout=log,stderr=subprocess.STDOUT)
 results=[r for r in results if r['check']!=name]+[{'check':name,'exit':r.returncode}];(out/'results.json').write_text(json.dumps(results,indent=2));print(name,r.returncode,flush=True)
raise SystemExit(any(r['exit'] for r in results))
