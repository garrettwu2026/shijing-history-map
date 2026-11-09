"""Cache exact AAT alternate-label research leads; never infer identity or apply names."""
import argparse,json
from pathlib import Path
import requests
R=Path(__file__).resolve().parents[2];B=R/'scripts/v21t'
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--refresh',action='store_true');a=p.parse_args()
cache=B/'aat-alternate-label-cache.json'
if a.refresh or not cache.exists():
 q='''PREFIX skos: <http://www.w3.org/2004/02/skos/core#> PREFIX gvp: <http://vocab.getty.edu/ontology#> SELECT ?s ?label ?zh WHERE { ?s gvp:broaderExtended <http://vocab.getty.edu/aat/300111079>. ?s skos:prefLabel ?zh; (skos:prefLabel|skos:altLabel) ?label. FILTER(lang(?zh)="zh-hant" && (langMatches(lang(?label),"en") || lang(?label)="")) }'''
 response=requests.get('https://vocab.getty.edu/sparql',params={'query':q,'format':'json'},timeout=55);response.raise_for_status()
 rows=[{k:v['value'] for k,v in r.items()} for r in response.json()['results']['bindings']]
 temp=cache.with_suffix('.json.tmp');temp.write_text(json.dumps(rows,ensure_ascii=False,separators=(',',':'))+'\n');temp.replace(cache)
by={n.casefold():r for r in json.loads((B/'candidates.json').read_text()) if r['status']=='untranslated' for n in r['original']}
leads=[dict(**r,candidate=by[r['label'].casefold()]['id']) for r in json.loads(cache.read_text()) if r['label'].casefold() in by]
out=B/'aat-alternate-label-leads.json';out.write_text(json.dumps(leads,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(dict(leads=len(leads),output=str(out.relative_to(R)),reviewRequired=True)))
