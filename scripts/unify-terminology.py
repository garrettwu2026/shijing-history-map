"""Apply the reviewed glossary to editable display text, or check for drift.

Never rewrite dataset keys, IDs, geometry, citations, endonyms or chronology.
The glossary is the reviewed input; this script performs no automatic translation.
"""
import argparse
from event_text import clean_event_text
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'
CHECK = argparse.ArgumentParser()
CHECK.add_argument('--check', action='store_true')
args = CHECK.parse_args()
read = lambda name: json.loads((DATA / name).read_text())
glossary = read('glossary.json')
entries = glossary['entries']
polity_terms = {e['original']: e for e in entries if e['type'] == 'polity'}
changes = []

def write(path, value):
    old = path.read_text()
    new = json.dumps(value, ensure_ascii=False, indent=2) + '\n'
    if json.loads(old) != value:
        changes.append(str(path.relative_to(ROOT)))
        if not args.check:
            path.write_text(new)

def canonical(entry, marker=True):
    return entry['accepted_zh_TW'] or (entry['original'] + ('（待考）' if marker else ''))

# Accepted spellings take precedence over unreviewed historical variants.
replacements = {}
for accepted in (False, True):
    for entry in entries:
        if (entry['status'] == 'accepted') != accepted:
            continue
        for variant in entry.get('variants', []):
            if not accepted and entry['type'] == 'polity':
                continue
            if len(variant) >= 3 or (accepted and len(variant) >= 2):
                replacements[variant] = canonical(entry)
        if entry['type'] != 'polity' and not accepted:
            replacements[entry['original']] = canonical(entry)
# Do not rewrite fragments of a canonical label or add duplicate pending markers.
for entry in entries:
    replacements[canonical(entry)] = canonical(entry)
pattern = re.compile('|'.join(re.escape(k) for k in sorted(replacements, key=lambda k: (-len(k), k))))

def text(value, markers=True):
    # Original titles are citations, not prose to be modernized.
    def replace(match):
        result = replacements[match[0]]
        if markers:
            return result
        # Runtime joins glossary status to event prose. Do not insert new
        # inline markers here, but preserve any marker supplied by an editor.
        if '待考' in match[0]:
            return result if '待考' in result else result + '（待考）'
        return result.replace('（待考）', '')
    return ''.join(part if part.startswith('《') else pattern.sub(replace, part)
                   for part in re.split(r'(《[^》]*》)', value))

catalog = read('polities.json')
assert set(catalog['index']) == set(polity_terms), 'Glossary must cover every dataset name'
for pid, polity in catalog['polities'].items():
    candidates = [polity_terms[k] for k in polity['datasetNames']]
    accepted = [e for e in candidates if e['status'] in ('accepted', 'restored-v10')]
    assert len({e['accepted_zh_TW'] for e in accepted}) <= 1, (pid, accepted)
    entry = (accepted or candidates)[0]
    polity['zh'] = canonical(entry, marker=False)
    polity['translationStatus'] = 'translated' if accepted else 'untranslated'
    polity['terminologyStatus'] = entry['status']
    if accepted:
        if entry['status'] == 'restored-v10':
            polity['confidence'] = entry['restoredConfidence']
            polity['translationNote'] = entry['notes']
        if entry['status'] == 'accepted' and entry['source'] not in polity['sources']:
            polity['sources'].append(entry['source'])
    else:
        polity['confidence'] = 'low'
        polity['translationNote'] = entry['notes']
    # Aliases and historical exonyms retain their spelling as search/reference data.
    for period in polity['periods']:
        period['zh'] = text(period['zh'])
        period['translationStatus'] = 'untranslated' if '（待考）' in period['zh'] else 'translated'
write(DATA / 'polities.json', catalog)

errata = read('errata.json')
for row in errata['overrides']:
    row['zh'] = text(row['zh'])
    row['translationStatus'] = 'untranslated' if '（待考）' in row['zh'] else 'translated'
write(DATA / 'errata.json', errata)

names = read('names.json')
for key, name in names.items():
    polity = catalog['polities'][catalog['index'][key]]
    name['zh'] = polity['zh']
    if 'translationStatus' in name:
        name['translationStatus'] = polity['translationStatus']
write(DATA / 'names.json', names)

events = read('events.json')
registry = read('event-id-registry.json')
for event in events:
    # The runtime display helper reads glossary status; preserve editor markers.
    for field in ('title', 'summary', 'description'):
        if field in event:
            event[field] = clean_event_text(text(event[field], markers=False))
    # Keep old title registrations too, so curation scripts cannot allocate new IDs.
    assert event['title'] not in registry or registry[event['title']] == event['id']
    registry[event['title']] = event['id']
write(DATA / 'events.json', events)
write(DATA / 'event-id-registry.json', registry)

for filename in ['app.js', 'index.html']:
    path = ROOT / filename
    old = path.read_text()
    new = text(old)
    if old != new:
        changes.append(filename)
        if not args.check:
            path.write_text(new)

if args.check:
    assert not changes, 'Glossary drift: ' + ', '.join(changes)
print(('Checked' if args.check else 'Applied') + ' glossary:', len(entries), 'entries;', len(changes), 'files changed')
