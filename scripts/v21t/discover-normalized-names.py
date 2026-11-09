"""Find cached spelling leads, including labels embedded in parentheses.

Read-only with respect to site data. Matching never establishes identity: records
may describe a different continent, a broader group, or an existing profile.
"""
import json
from pathlib import Path
import re
import unicodedata

BASE = Path(__file__).resolve().parent

def normalize(value):
    value = ''.join(c for c in unicodedata.normalize('NFKD', value) if not unicodedata.combining(c))
    return re.sub(r'[^a-z0-9]', '', value.casefold())

labels = {}
for row in json.loads((BASE / 'aat-alternate-label-cache.json').read_text()):
    key = normalize(re.sub(r' \([^)]*\)$', '', row['label']))
    if key:
        labels.setdefault(key, []).append(row)
leads = []
for row in json.loads((BASE / 'candidates.json').read_text()):
    if row['status'] != 'untranslated':
        continue
    seen = set()
    for original in row['original']:
        parts = [original, re.sub(r'\([^)]*\)', '', original)]
        parts += re.findall(r'\(([^)]*)\)', original)
        parts += re.split(r'[/–]', original)
        for part in parts:
            for label in labels.get(normalize(part), []):
                if label['s'] in seen:
                    continue
                seen.add(label['s'])
                leads.append(dict(id=row['id'], original=original, matchedPart=part.strip(), **label))
output = BASE / 'aat-normalized-name-leads.json'
output.write_text(json.dumps(leads, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(dict(leads=len(leads), output=str(output.name), reviewRequired=True)))
