"""Reproducible Noto TC WOFF2 split: common UI + disjoint, lazy remainder.
Sources and SIL OFL are recorded in assets/fonts/SOURCES-Noto-TC.txt.
Pass the downloaded upstream TTF files as the two positional arguments.
"""
import sys,json,re
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont
root=Path(__file__).resolve().parents[1]
text=(root/'index.html').read_text()+(root/'app.js').read_text()
for p in (root/'modules').glob('*.js'):text+=p.read_text()
events=json.loads((root/'data/events.json').read_text())
for e in events:
 if e.get('year',e.get('startYear',0)) in range(1450,1551):text+=str(e)
common=set(map(ord,text))|set(range(32,256))
css=[];manifest=[]
for path,family,slug,weight in zip(sys.argv[1:],['Noto Sans TC','Noto Serif TC'],['noto-sans-tc','noto-serif-tc'],[400,500]):
 font=TTFont(path);allchars=set(font.getBestCmap());groups=[common&allchars]
 remaining=allchars-common
 for block in sorted({c//2048 for c in remaining}):groups.append({c for c in remaining if c//2048==block})
 for i,chars in enumerate(groups):
  if not chars:continue
  f=TTFont(path);opts=subset.Options();opts.flavor='woff2';opts.recalc_timestamp=False
  sub=subset.Subsetter(options=opts);sub.populate(unicodes=chars);sub.subset(f);f.flavor='woff2'
  name=f'{slug}-{i}.woff2';f.save(root/'assets/fonts'/name)
  points=sorted(chars);ranges=[];a=b=points[0]
  for c in points[1:]:
   if c==b+1:b=c
   else:ranges.append(f'U+{a:X}'+(f'-{b:X}' if a!=b else ''));a=b=c
  ranges.append(f'U+{a:X}'+(f'-{b:X}' if a!=b else ''))
  css.append(f"@font-face{{font-family:'{family}';font-style:normal;font-weight:{weight};font-display:swap;src:url('./assets/fonts/{name}') format('woff2');unicode-range:{','.join(ranges)}}}")
  manifest.append({'file':name,'bytes':(root/'assets/fonts'/name).stat().st_size,'codepoints':len(chars)})
 assert set().union(*groups)==allchars
(root/'assets/fonts/noto-tc.css').write_text('\n'.join(css)+'\n')
(root/'assets/fonts/noto-tc-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Font bytes',sum(m['bytes'] for m in manifest),'common',[(m['file'],m['bytes']) for m in manifest if m['file'].endswith('-0.woff2')])

p=root/'style.css'
s=p.read_text()
start='/* BEGIN generated Noto TC faces; scripts/v21-build-fonts.py */'
end='/* END generated Noto TC faces */'
faces=start+'\n'+'\n'.join(css)+'\n'+end
if start in s:s=s[:s.index(start)]+faces+s[s.index(end)+len(end):]
else:s+='\n'+faces+'\n'
p.write_text(s)
