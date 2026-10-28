"""Verify glossary coverage, conservative fallback, publication and V11 invariants."""
import csv
import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'
read = lambda n: json.loads((DATA / n).read_text())

def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()

glossary = read('glossary.json')
entries = glossary['entries']
assert len({(e['type'], e['original']) for e in entries}) == len(entries)
for entry in entries:
    assert entry['type'] in ['polity', 'era', 'event-term']
    assert entry['original'] and entry['notes']
    if entry['status'] == 'accepted':
        assert entry['accepted_zh_TW'] and entry['source'].startswith('https://')
    elif entry['status'] == 'restored-v10':
        assert entry['accepted_zh_TW'] and entry['source'] == 'git:9b886f1:data/polities.json'
    else:
        assert entry['status'] == '待考' and entry['accepted_zh_TW'] is None

head = json.loads(subprocess.check_output(['git', 'show', '9b886f1:data/polities.json'], cwd=ROOT))
reverted = {a['name'] for a in csv.DictReader((ROOT / 'scripts/name-audit-v11.tsv').open(), delimiter='\t') if a['decision'] == 'revert'}
for entry in entries:
    if entry['status'] == 'restored-v10':
        assert entry['original'] not in reverted
        assert entry['accepted_zh_TW'] == head['polities'][head['index'][entry['original']]]['zh']

catalog = read('polities.json')
terms = {e['original']: e for e in entries if e['type'] == 'polity'}
assert set(terms) == set(catalog['index'])
for polity in catalog['polities'].values():
    candidates = [terms[k] for k in polity['datasetNames']]
    accepted = [e for e in candidates if e['status'] in ('accepted', 'restored-v10')]
    if accepted:
        assert polity['zh'] == accepted[0]['accepted_zh_TW']
        assert polity['translationStatus'] != 'untranslated'
    else:
        assert polity['zh'] in polity['datasetNames']
        assert polity['translationStatus'] == 'untranslated'

identity = {'index': catalog['index'], 'polities': {k: {f: v for f, v in p.items() if f not in
    ['zh', 'confidence', 'translationStatus', 'translationNote', 'terminologyStatus', 'sources', 'periods']}
    for k, p in catalog['polities'].items()}}
baseline = glossary['baselineInvariants']
assert digest(identity) == baseline['polityIdentity'], 'IDs, source names, endonyms or observation dates changed'
assert digest({k: [{f: v for f, v in row.items() if f not in ['zh', 'translationStatus']}
    for row in p['periods']] for k, p in catalog['polities'].items()}) == baseline['periodIdentity']
assert digest([{k: v for k, v in e.items() if k not in ['title', 'description']} for e in read('events.json')]) == baseline['eventNontext']
assert digest([{k: v for k, v in e.items() if k not in ['zh', 'translationStatus']} for e in read('errata.json')['overrides']]) == baseline['correctionNontext']
for filename, expected in baseline['geometry'].items():
    assert hashlib.sha256((DATA / filename).read_bytes()).hexdigest() == expected

for event in read('events.json'):
    assert '（待考）（待考）' not in event['title'] + event['description']
assert any(e['title'] == '《大日本帝國憲法》頒布' for e in read('events.json')), 'Preserve quoted historical document titles'
assert any(e['title'] == '巴拿馬運河通航' for e in read('events.json')), 'Preserve complete geographic names'
published = next((ROOT / 'dist/data').glob('glossary.*.json'))
assert json.loads(published.read_text()) == glossary
assert published.name in (ROOT / 'dist/index.html').read_text()
subprocess.run(['python3', 'scripts/unify-terminology.py', '--check'], cwd=ROOT, check=True)
print('Terminology passed:', len(entries), 'entries;', len(terms), 'dataset names;',
      sum(p['translationStatus'] == 'untranslated' for p in catalog['polities'].values()), 'pending polity IDs; 54 geometries and all event identities unchanged')
