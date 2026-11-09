"""Validate an applied TASK21T batch and save resumable, truthful check results.

Serve the repository on localhost:8000 first. The existing event-detail coverage
failure is recorded as a failure, not suppressed or converted into a passing check.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('manifest')
args = parser.parse_args()
manifest = Path(args.manifest)
rows = json.loads((ROOT / manifest).read_text())
assert manifest.parent == Path('scripts/v21t') and manifest.stem.startswith('batch-')
output = ROOT / 'artifacts' / ('v21t-' + manifest.stem)
output.mkdir(parents=True, exist_ok=True)
results = {}

def run(key, command):
    try:
        process = subprocess.run(command, cwd=ROOT, capture_output=True, text=True, timeout=240)
        (output / (key + '.log')).write_text(process.stdout + process.stderr)
        results[key] = {'passed': process.returncode == 0, 'exitCode': process.returncode}
    except subprocess.TimeoutExpired as error:
        results[key] = {'passed': False, 'error': 'timeout'}
        (output / (key + '.log')).write_text(str(error))
    (output / 'check-results.json').write_text(json.dumps(results, ensure_ascii=False, indent=2) + '\n')
    print(key, results[key], flush=True)
    return results[key]['passed']

build_ok = run('build', ['npm', 'run', 'build'])
if not build_ok:
    sys.exit('Build failed; batch remains pending validation.')
run('npm-validate', ['npm', 'run', 'validate'])
for name in ['validate-intros', 'validate-content', 'validate-events', 'validate-v3', 'verify-static', 'verify-terminology']:
    run(name, [sys.executable, 'scripts/' + name + '.py'])
for path in sorted((ROOT / 'scripts').glob('verify-*.cjs')):
    run(path.stem, ['node', str(path.relative_to(ROOT))])
run('new-polity-ui', ['node', 'scripts/check-v21t-batch-ui.cjs', str(manifest), str(output.relative_to(ROOT))])

tracked = ['data/intros.json', 'data/polities.json', 'data/glossary.json', 'data/names.json', 'scripts/v18b-progress.json']
def hashes():
    return {name: hashlib.sha256((ROOT / name).read_bytes()).hexdigest() for name in tracked}
before = hashes()
resume_ok = run('resume', [sys.executable, 'scripts/expand-v21t.py', str(manifest)])
resume_unchanged = resume_ok and hashes() == before
original_file = output / 'original-intro-hashes.json'
original_unchanged = None
if original_file.exists():
    intros = json.loads((ROOT / 'data/intros.json').read_text())
    original = json.loads(original_file.read_text())
    original_unchanged = all(k in intros and hashlib.sha256(json.dumps(intros[k], ensure_ascii=False, sort_keys=True).encode()).hexdigest() == digest for k, digest in original.items())
all_other_checks = all(value['passed'] for key, value in results.items() if key != 'npm-validate')
validation = {
    'checkedAt': datetime.now(timezone.utc).isoformat(),
    'build': build_ok,
    'npmValidate': results['npm-validate']['passed'],
    'otherChecksPassed': all_other_checks,
    'resumeIdempotent': resume_unchanged,
    'originalProfilesUnchanged': original_unchanged,
    'artifacts': str(output.relative_to(ROOT)) + '/',
    'checks': results,
}
if not validation['npmValidate']:
    validation['npmValidateReason'] = '請查閱 npm-validate.log；未放寬或略過既有驗證門檻'
progress_path = ROOT / 'scripts/v18b-progress.json'
progress = json.loads(progress_path.read_text())
for batch in progress['batches']:
    if batch.get('manifest') == str(manifest):
        batch['validation'] = validation
progress['task21t']['lastValidation'] = validation
if all_other_checks and resume_unchanged and original_unchanged is not False:
    progress['task21t'].pop('pendingValidation', None)
else:
    progress['task21t']['pendingValidation'] = str(manifest)
progress['updatedAt'] = validation['checkedAt']
temporary = progress_path.with_suffix('.json.tmp')
temporary.write_text(json.dumps(progress, ensure_ascii=False, indent=2) + '\n')
temporary.replace(progress_path)
(output / 'final-results.json').write_text(json.dumps(validation, ensure_ascii=False, indent=2) + '\n')
# Preserve the aggregate validator's failure in the command's exit status too.
if not (all_other_checks and resume_unchanged and original_unchanged is not False and validation['npmValidate']):
    sys.exit(1)
