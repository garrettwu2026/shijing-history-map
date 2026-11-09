"""Run every verify script against an already running localhost:8000 server."""
import json
import subprocess
import time
import shutil
import sys
import os
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/os.environ.get('VERIFY_OUTPUT_DIR','artifacts/v18c-verification')
OUT.mkdir(parents=True,exist_ok=True)
results=[]
node_args=[]
browser_path=os.environ.get('VERIFY_CHROMIUM_PATH') or shutil.which('google-chrome')
if browser_path:
    # Keep every regression test on the same installed or explicitly selected
    # browser, including historical tests with hard-coded executable paths.
    preload=OUT/'installed-chrome.cjs'
    preload.write_text("const {chromium}=require("+json.dumps(str(ROOT/'node_modules/playwright'))+");\nconst launch=chromium.launch.bind(chromium);\nchromium.launch=(options={})=>launch({...options,executablePath:"+json.dumps(browser_path)+"});\n")
    node_args=['--require',str(preload)]
previous=json.loads((OUT/'results.json').read_text()) if (OUT/'results.json').exists() else []
failed={r['script'] for r in previous if r['exitCode']}
retry='--retry-failed' in sys.argv
if retry:
    results=[r for r in previous if not r['exitCode']]
for script in sorted((ROOT/'scripts').glob('verify-*')):
    if script.suffix not in ('.py','.cjs'):
        continue
    if retry and script.name not in failed:
        continue
    start=time.monotonic()
    print(f'Running {script.name}',flush=True)
    with (OUT/(script.name+'.log')).open('w') as log:
        try:
            command=['python3',str(script)] if script.suffix=='.py' else ['node',*node_args,str(script)]
            run=subprocess.run(command,cwd=ROOT,stdout=log,stderr=subprocess.STDOUT,timeout=600)
            code=run.returncode
        except subprocess.TimeoutExpired:
            code=124
    results.append(dict(script=script.name,exitCode=code,seconds=round(time.monotonic()-start,2)))
    (OUT/'results.json').write_text(json.dumps(results,indent=2)+'\n')
    print(f'{script.name}: {"PASS" if code==0 else "FAIL"} ({results[-1]["seconds"]}s)',flush=True)
raise SystemExit(1 if any(r['exitCode'] for r in results) else 0)
