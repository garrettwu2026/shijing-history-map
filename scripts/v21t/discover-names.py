"""Cache AAT Traditional Chinese culture-name leads for exact candidate matching.

This is an editorial research index, never an automatic translation. Review the
full AAT record, contributor, identity and historical sources before applying a
name. Default mode uses the cache; --refresh downloads one bounded hierarchy.
"""
import argparse
import json
from pathlib import Path
import re
import requests

ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / 'scripts/v21t'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--refresh', action='store_true')
parser.add_argument('--world', action='store_true',
                    help='Use the bounded cultures-by-region hierarchy, including non-American cultures')
args = parser.parse_args()
cache = BASE / ('aat-world-zh-cache.json' if args.world else 'aat-americas-zh-cache.json')
hierarchy = '300111079' if args.world else '300017437'
if args.refresh:
    query = ('PREFIX skos: <http://www.w3.org/2004/02/skos/core#> '
             'PREFIX gvp: <http://vocab.getty.edu/ontology#> '
             'SELECT ?s ?en ?zh WHERE { '
             f'?s gvp:broaderExtended <http://vocab.getty.edu/aat/{hierarchy}>. '
             '?s skos:prefLabel ?en; skos:prefLabel ?zh. '
             'FILTER(lang(?en)="en" && lang(?zh)="zh-hant") }')
    response = requests.get('https://vocab.getty.edu/sparql',
                            params={'query': query, 'format': 'json'}, timeout=90)
    response.raise_for_status()
    records = response.json()['results']['bindings']
    assert records and all(set(('s', 'en', 'zh')) <= r.keys() for r in records)
    data = [{'aat': r['s']['value'], 'term': r['en']['value'], 'zh': r['zh']['value']} for r in records]
    data.sort(key=lambda row: (row['aat'], row['term'], row['zh']))
    temporary = cache.with_suffix('.json.tmp')
    temporary.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n')
    temporary.replace(cache)
else:
    if not cache.exists():
        parser.error('No name cache; run with --refresh first')
    data = json.loads(cache.read_text())
candidates = json.loads((BASE / 'candidates.json').read_text())
by_name = {}
for row in candidates:
    if row['status'] == 'untranslated':
        for original in row['original']:
            by_name.setdefault(original.casefold(), []).append((row['id'], original))
matches = []
for row in data:
    name = re.sub(r' \([^)]*\)$', '', row['term']).casefold()
    for pid, original in by_name.get(name, []):
        matches.append({'id': pid, 'original': original, **row})
matches.sort(key=lambda row: (row['original'].casefold(), row['aat']))
output = 'aat-world-candidate-matches.json' if args.world else 'aat-candidate-matches.json'
(BASE / output).write_text(json.dumps(matches, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'cachedConcepts': len(data), 'exactMatchLeads': len(matches),
                  'output': 'scripts/v21t/' + output,
                  'reviewRequired': True}, ensure_ascii=False))
