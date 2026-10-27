#!/usr/bin/env python3
"""Apply reviewed TSV and exact-name colonial derivations; no transliteration generator.
Run from any directory. --rank prints unresolved names in review order without edits.
Untranslated records keep their name/status/low confidence; the UI adds （待考）.
"""
import argparse
import json
import math
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'
PRIORITY = [1900, 1800, 1500, 1000, 500, 1, -500]
def read(path):
    return json.loads(path.read_text())
def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')

def ring_area(ring):
    # Spherical area in km²; normalize dateline crossings.
    total = 0
    for a, b in zip(ring, ring[1:]):
        delta = (math.radians(b[0] - a[0]) + math.pi) % (2 * math.pi) - math.pi
        total += delta * (2 + math.sin(math.radians(a[1])) + math.sin(math.radians(b[1])))
    return abs(total) * 6371.0088 ** 2 / 2

def area(g):
    if not g:
        return 0
    polygons = [g['coordinates']] if g['type'] == 'Polygon' else g['coordinates'] if g['type'] == 'MultiPolygon' else []
    return sum(max(0, ring_area(p[0]) - sum(ring_area(r) for r in p[1:])) for p in polygons if p)

catalog = read(DATA / 'polities.json')
polities = catalog['polities']
snapshots = read(DATA / 'snapshots.json')
nearest = {y: min(snapshots, key=lambda s: abs(s['year'] - y))['year'] for y in PRIORITY}
seen = defaultdict(set)
max_area = defaultdict(float)
by_year = defaultdict(set)
for snapshot in snapshots:
    yearly_area = defaultdict(float)
    for feature in read(DATA / snapshot['file'])['features']:
        name = feature['properties'].get('NAME')
        pid = catalog['index'].get(name)
        if pid:
            seen[pid].add(snapshot['year'])
            by_year[snapshot['year']].add(pid)
            yearly_area[pid] += area(feature.get('geometry'))
    for pid, size in yearly_area.items():
        max_area[pid] = max(max_area[pid], size)
priority_ids = set().union(*(by_year[y] for y in nearest.values()))
order = sorted(polities, key=lambda pid: (pid not in priority_ids, -max_area[pid], -len(seen[pid]), pid))
translations = {}
translation_sources = {}
pass2_names = set()
lines = []
for filename in ('translations-v10.tsv', 'translations-v10-pass2.tsv'):
    file_lines = (ROOT / 'scripts' / filename).read_text().splitlines()
    lines.extend(file_lines)
    if filename.endswith('pass2.tsv'):
        pass2_names.update(line.split('\t')[0] for line in file_lines if line and not line.startswith('#'))
for line in lines:
    if not line or line.startswith('#'):
        continue
    fields = line.split('\t')
    name, zh = fields[:2]
    assert name not in translations, name
    confidence = fields[2] if len(fields) >= 3 else 'medium'
    if len(fields) == 4:
        assert fields[3].startswith('https://')
        translation_sources[name] = fields[3]
    assert confidence in ('medium', 'high') and re.search('[\u3400-\u9fff]', zh), line
    translations[name] = (zh, confidence)
# These authorities are exact dataset suffixes, not a guess based on modern geography.
suffixes = {'UK':'英屬', 'GB':'英屬', 'France':'法屬', 'FR':'法屬', 'Spain':'西屬',
            'Portugal':'葡屬', 'Netherlands':'荷屬', 'Dutch':'荷屬', 'Germany':'德屬',
            'Italy':'義屬', 'IT':'義屬', 'Belgium':'比屬', 'USA':'美屬', 'US':'美屬',
            'Japan':'日屬', 'Russia':'俄屬', 'RU':'俄屬', 'Ottoman':'鄂圖曼屬',
            'Egypt':'埃及屬', 'Austria':'奧地利屬', 'Danemark':'丹麥屬'}
# Existing catalog translations can supply an exact geographic base only.
bases = {name: (p['zh'], 'medium') for name, pid in catalog['index'].items()
         if (p := polities[pid])['translationStatus'] != 'untranslated'
         and re.search('[\u3400-\u9fff]', p['zh'])}
bases.update(translations)
def resolve(name):
    if name in translations:
        return translations[name]
    match = re.fullmatch(r'(.+) \(([^()]+)\)', name)
    if match and match[2] in suffixes and match[1] in bases:
        zh, confidence = bases[match[1]]
        return zh + '（' + suffixes[match[2]] + '）', confidence
    # A trailing space is present in an upstream culture name.
    return translations.get(name.strip())

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--rank', action='store_true')
args = parser.parse_args()
if args.rank:
    for pid in order:
        p = polities[pid]
        if p['translationStatus'] == 'untranslated' and not any(resolve(n) for n in p['datasetNames']):
            print(f'{"P" if pid in priority_ids else "-"}\t{max_area[pid]:.0f}\t{len(seen[pid])}\t{p["datasetNames"][0]}')
    raise SystemExit

names = read(DATA / 'names.json')
changes = []
for pid in order:
    p = polities[pid]
    if p['translationStatus'] != 'untranslated':
        continue
    resolved = next((value for n in p['datasetNames'] if (value := resolve(n))), None)
    if not resolved:
        continue
    zh, confidence = resolved
    changes.append({'id':pid, 'name':p['datasetNames'][0], 'zh':zh, 'confidence':confidence,
                    'priority':pid in priority_ids})
    p.update(zh=zh, confidence=confidence, translationStatus='curated')
    for name in p['datasetNames']:
        # Preserve all historical/native metadata; never add a self-designation.
        if name in names:
            names[name]['zh'] = zh
        else:
            names[name] = {'zh':zh, 'native':'', 'aliases':[], 'importance':p['importance']}
for p in polities.values():
    for name in p['datasetNames']:
        if name in translation_sources and p['translationStatus'] == 'curated' and p['zh'] == translations[name][0]:
            source = translation_sources[name]
            if source not in p['sources']:
                p['sources'].append(source)
write(DATA / 'polities.json', catalog)
write(DATA / 'names.json', names)
# Rebuild pass 2 statistics from the reviewed table on every run.
report_path = ROOT / 'artifacts/v10-translations.json'
report_path.parent.mkdir(parents=True, exist_ok=True)
pass2_changes = []
for pid in order:
    p = polities[pid]
    if p['translationStatus'] == 'curated' and any(
            n in pass2_names and translations[n][0] == p['zh'] for n in p['datasetNames']):
        pass2_changes.append({'id':pid, 'name':p['datasetNames'][0], 'zh':p['zh'],
                              'confidence':p['confidence'], 'priority':pid in priority_ids})
remaining = sum(p['translationStatus'] == 'untranslated' for p in polities.values())
# The initial TASK10 baseline is 2257; pass 1 added 522. Pass 2 counts come
# from the checked-in reviewed table, so ignored artifacts are not required.
report = {'translatedThisPass':len(pass2_changes), 'translatedCumulative':2257-remaining,
              'translatedPass1':522, 'remainingUntranslated':remaining,
              'remainingPending':sum(p['translationStatus']=='untranslated' and p['confidence']=='low' for p in polities.values()),
              'nearestSnapshots':nearest,
              'priority':{str(y): {'snapshot':nearest[y], 'total':len(by_year[nearest[y]]),
                         'remainingPending':sum(polities[pid]['translationStatus']=='untranslated' for pid in by_year[nearest[y]])} for y in PRIORITY},
              'changes':pass2_changes}
write(report_path, report)
pending_rows = ['priority\tmaxAreaKm2\tsnapshotCount\tname\tstatus']
for pid in order:
    p = polities[pid]
    if p['translationStatus'] == 'untranslated':
        pending_rows.append(f'{int(pid in priority_ids)}\t{max_area[pid]:.0f}\t{len(seen[pid])}\t{p["datasetNames"][0]}\t待考')
(ROOT / 'artifacts/v10-pending.tsv').write_text('\n'.join(pending_rows) + '\n')
print(json.dumps({k:v for k,v in report.items() if k != 'changes'}, ensure_ascii=False, indent=2))
for row in report['changes'][:20]:
    print(f'{row["name"]} → {row["zh"]} ({row["confidence"]})')
