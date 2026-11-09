"""Apply explicitly reviewed TASK21T identities; no fuzzy matching or new IDs.

One manifest is one resumable batch (<=30). Sources remain editorial metadata;
self-designations are explained in prose without exposing research citations.
Run build and validators after each invocation before starting another batch.
"""
import argparse
from copy import deepcopy
from datetime import datetime, timezone
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
sys.dont_write_bytecode = True
R = Path(__file__).resolve().parents[1]
def read(path): return json.loads((R / path).read_text())
def write(path, value):
    target = R / path
    temporary = target.with_suffix(target.suffix + '.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
    temporary.replace(target)
def complete(v):
    return all(k in v for k in ['name', 'summary', '存續年代', '首都', '主要族群/語言', '重要事件', '前身/後繼', '年表', '重要人物', '背景', '影響'])
parser = argparse.ArgumentParser()
parser.add_argument('batch', help='Reviewed JSON manifest relative to repository')
args = parser.parse_args()
rows = read(args.batch)
assert 0 < len(rows) <= 30
assert len({r['id'] for r in rows}) == len(rows)
catalog = read('data/polities.json')
glossary = read('data/glossary.json')
intros = read('data/intros.json')
progress = read('scripts/v18b-progress.json')
pending = []
new_names = []
for row in rows:
    pid = row['id']; polity = catalog['polities'][pid]
    assert polity['datasetNames'] == [row['original']], pid
    if complete(intros.get(pid, {})):
        assert polity['zh'] == row['zh'] and intros[pid]['name'] == row['zh']
        for alias in row.get('nameOnlyAliases', []):
            related = catalog['polities'][alias['id']]
            assert related['datasetNames'] == [alias['original']] and related['zh'] == row['zh']
            assert related['translationStatus'] == 'translated'
        continue
    if row.get('existingTranslation'):
        assert polity['translationStatus'] == 'translated' and polity['zh'] == row['zh'], pid
    else:
        assert polity['translationStatus'] == 'untranslated', pid
        new_names.append(pid)
    source = row.get('profile') or intros[row['profileFrom']]
    assert complete(source)
    profile = deepcopy(source)
    profile['name'] = row['zh']
    profile['summary'] = row['zh'] + profile['summary'][len(source['name']):]
    # The historical profile describes this same people, while this label may
    # denote its homeland. Keep both meanings explicit instead of inventing a state.
    if row.get('profileFrom') and row.get('note'):
        profile['主要族群/語言'] += '；' + row['note'].replace('Hopitutskwa', '此土地自稱')
    # Homeland labels may reuse verified history while explicitly describing land.
    overrides = row.get('profileOverrides', {})
    assert set(overrides) <= {'summary', '存續年代', '首都', '主要族群/語言'}, pid
    profile.update(overrides)
    intros[pid] = profile
    if not row.get('existingTranslation'):
        entry = next(e for e in glossary['entries'] if e['type'] == 'polity' and e['original'] == row['original'])
        entry.update(accepted_zh_TW=row['zh'], status='accepted', source=row['identitySource'],
                     notes=row['nameBasis'] + row['note'])
        polity.update(zh=row['zh'], translationStatus='translated', terminologyStatus='accepted',
                      confidence='high', translationNote=row['nameBasis'] + row['note'])
        if row['identitySource'] not in polity['sources']: polity['sources'].append(row['identitySource'])
    pending.append(pid)
    # Same-community catalog labels receive the same name without duplicating
    # the historical profile or increasing the completed-profile count.
    for alias in row.get('nameOnlyAliases', []):
        related = catalog['polities'][alias['id']]
        assert related['datasetNames'] == [alias['original']]
        assert related['translationStatus'] == 'untranslated' or related['zh'] == row['zh']
        term = next(e for e in glossary['entries'] if e['type'] == 'polity' and e['original'] == alias['original'])
        term.update(accepted_zh_TW=row['zh'], status='accepted', source=row['identitySource'],
                    notes=row['nameBasis'] + alias['note'])
        related.update(zh=row['zh'], translationStatus='translated', terminologyStatus='accepted',
                       confidence='high', translationNote=row['nameBasis'] + alias['note'])
        if row['identitySource'] not in related['sources']: related['sources'].append(row['identitySource'])
        new_names.append(alias['id'])
if not pending:
    print('Already complete; no files changed.'); raise SystemExit(0)
spec = importlib.util.spec_from_file_location('intro_validator', R / 'scripts/validate-intros.py')
validator = importlib.util.module_from_spec(spec); spec.loader.exec_module(validator)
errors = validator.validate(intros, catalog, glossary, True)
if errors: raise SystemExit('\n'.join(errors))
write('data/glossary.json', glossary)
write('data/polities.json', catalog)
write('data/intros.json', intros)
subprocess.run([sys.executable, 'scripts/unify-terminology.py'], cwd=R, check=True)
now = datetime.now(timezone.utc).isoformat()
progress['completedIntroIds'] = [k for k,v in intros.items() if complete(v)]
progress['counts']['introsTotal'] = len(intros)
progress['counts']['introsNew'] = len(set(intros) - set(progress['baselineIntroIds']))
progress['counts']['introFields'] = {f: sum(f in v for v in intros.values()) for f in ['summary','年表','重要人物','關鍵數據','背景','影響']}
translated = sum(p['translationStatus'] != 'untranslated' for p in catalog['polities'].values())
progress['task21'].update(completed=len(intros), remainingToTarget=max(0,1500-len(intros)), addedThisTask=len(intros)-300,
                         translatedCatalogIds=translated, untranslatedCatalogIds=len(catalog['polities'])-translated,
                         translatedWithoutIntro=translated-len(intros), status='in-progress')
progress['batches'].append({'kind':'task21t-names-and-intros', 'manifest':args.batch, 'ids':pending,
                          'newNameIds':new_names, 'savedAt':now, 'validation':'pending'})
progress.setdefault('task21t', {'target':1500, 'startCount':1187, 'status':'in-progress', 'completedBatches':[]})
task = progress['task21t']
for row in rows:
    for alias in row.get('nameOnlyAliases', []):
        task.setdefault('nameOnlyAliases', {})[alias['id']] = row['id']
task.update(completed=len(intros), remainingToTarget=max(0,1500-len(intros)),
            addedThisTask=len(intros)-task['startCount'],
            resumeCommand=f'python3 scripts/expand-v21t.py {args.batch}',
            validationCommand=f'python3 scripts/validate-v21t-batch.py {args.batch}',
            nextBatch=str(Path(args.batch).with_name(f'batch-{int(Path(args.batch).stem.split("-")[-1])+1:02d}.json')),
            pendingValidation=args.batch)
if args.batch not in task['completedBatches']:
    task['completedBatches'].append(args.batch)
    task['newAuthoredProfiles'] = task.get('newAuthoredProfiles', 0) + sum('profile' in r for r in rows if r['id'] in pending)
    task['reviewedAliasProfiles'] = task.get('reviewedAliasProfiles', 0) + sum('profileFrom' in r for r in rows if r['id'] in pending)
progress['updatedAt'] = now
write('scripts/v18b-progress.json', progress)
print(f'Saved {len(pending)} reviewed names and complete profiles; total {len(intros)}.')
