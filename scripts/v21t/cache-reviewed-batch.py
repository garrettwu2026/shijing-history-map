"""Cache reviewed identity records with curl's system trust; output short excerpts.

The manifest remains a manual editorial decision. This tool does not translate,
select identities, or modify site data.
"""
import argparse,concurrent.futures,json,subprocess
from pathlib import Path
from bs4 import BeautifulSoup
p=argparse.ArgumentParser();p.add_argument('manifest');args=p.parse_args()
rows=json.loads(Path(args.manifest).read_text());out=Path('artifacts')/('v21t-'+Path(args.manifest).stem);out.mkdir(exist_ok=True)
def cache(r):
 sid=r['identitySource'].split('subjectid=')[-1];target=out/('aat-'+sid+'.html')
 if not target.exists():
  old=next(Path('artifacts').glob('v21t-*/aat-'+sid+'.html'),None)
  if old:target.write_bytes(old.read_bytes())
  else:subprocess.run(['curl','--max-time','30','--retry','1','-fsS',r['identitySource'],'-o',str(target)],check=True,capture_output=True)
 text=BeautifulSoup(target.read_text(),'html.parser').get_text(' ',strip=True)
 term=r['zh'];at=text.find('Sources and Contributors:');part=text[at:];pos=part.find(term)
 assert pos>=0 and 'AS-Academia Sinica' in part[pos:pos+160],(r['original'],'name attribution absent')
 assert 'The Americas' in text,(r['original'],'check continent')
 return dict(original=r['original'],accepted=term,aat=sid,provenance=part[pos:pos+160],identityReview=r['nameBasis'])
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:reviews=list(pool.map(cache,rows))
(out/'name-review.json').write_text(json.dumps(reviews,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(dict(reviewed=len(reviews),evidence=str(out/'name-review.json')),ensure_ascii=False))
