"""Retry one existing browser check unchanged; preserve attempts and sync progress.

Run only after validate-v21t-batch.py finishes. Aggregate failures stay failures.
"""
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('manifest')
parser.add_argument('check')
args = parser.parse_args()
manifest = Path(args.manifest)
assert manifest.parent == Path('scripts/v21t') and manifest.stem.startswith('batch-')
script = ROOT / 'scripts' / (args.check + '.cjs')
assert args.check.startswith('verify-') and script.is_file()
output = ROOT / 'artifacts' / ('v21t-' + manifest.stem)

def read(path):
    return json.loads(path.read_text())

def write(path, data):
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    temporary.replace(path)

# The final file is only created after the full validator has finished its checks.
validation = read(output / 'final-results.json')
results = read(output / 'check-results.json')
old = results[args.check]
assert not old['passed'], 'Check already passed; no repeat needed.'
attempts = old.get('attempts', [{k: v for k, v in old.items() if k != 'attempts'}])
log = output / (args.check + '.log')
archive = output / (args.check + f'-attempt-{len(attempts)}.log')
assert not archive.exists(), 'Attempt log exists; investigate before overwriting.'
log.rename(archive)
try:
    process = subprocess.run(['node', str(script.relative_to(ROOT))], cwd=ROOT,
                             capture_output=True, text=True, timeout=240)
    log.write_text(process.stdout + process.stderr)
    latest = dict(passed=process.returncode == 0, exitCode=process.returncode)
except subprocess.TimeoutExpired as error:
    log.write_text(str(error))
    latest = dict(passed=False, error='timeout')
attempts.append(latest)
results[args.check] = dict(latest, attempts=attempts)
validation.update(checks=results, checkedAt=datetime.now(timezone.utc).isoformat(),
                  otherChecksPassed=all(v['passed'] for k, v in results.items() if k != 'npm-validate'))
validation['retryNote'] = '原腳本重跑；每次結果與首次失敗日誌保留於attempts，未修改斷言或逾時門檻。'
progress_path = ROOT / 'scripts/v18b-progress.json'
progress = read(progress_path)
for batch in progress['batches']:
    if batch.get('manifest') == str(manifest):
        batch['validation'] = validation
state = progress['task21t']
state['lastValidation'] = validation
if (validation['otherChecksPassed'] and validation['resumeIdempotent']
        and validation['originalProfilesUnchanged'] is not False):
    if state.get('pendingValidation') == str(manifest):
        state.pop('pendingValidation')
else:
    state['pendingValidation'] = str(manifest)
progress['updatedAt'] = validation['checkedAt']
write(output / 'check-results.json', results)
write(output / 'final-results.json', validation)
write(progress_path, progress)
print(json.dumps(dict(check=args.check, latest=latest,
                      otherChecksPassed=validation['otherChecksPassed'],
                      npmValidate=validation['npmValidate']), ensure_ascii=False))
sys.exit(0 if latest['passed'] else 1)
