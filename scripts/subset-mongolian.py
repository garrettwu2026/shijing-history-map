"""Regenerate the popup subset: python3 scripts/subset-mongolian.py /path/to/NotoSansMongolian-Regular.ttf"""
from pathlib import Path
import json,sys
from fontTools import subset
root=Path(__file__).resolve().parents[1]
chars=set()
def scan(value):
 if isinstance(value,str):
  if any(0x1800<=ord(c)<=0x18af for c in value):
   chars.update(c for c in value if 0x1800<=ord(c)<=0x18af or c in ' \u200c\u200d\u202f')
 elif isinstance(value,dict):
  for v in value.values():scan(v)
 elif isinstance(value,list):
  for v in value:scan(v)
for path in (root/'data').glob('*.json'):scan(json.loads(path.read_text()))
# Preserve shaping controls, including free variation selectors, even when absent in current strings.
chars.update('\u180b\u180c\u180d\u180e\u180f\u200c\u200d\u202f')
options=subset.Options();options.flavor='woff2';options.layout_features=['*'];options.name_IDs=['*']
font=subset.load_font(sys.argv[1],options);s=subset.Subsetter(options=options);s.populate(unicodes={ord(c) for c in chars});s.subset(font)
subset.save_font(font,str(root/'assets/fonts/mongolian-subset.woff2'),options)
(root/'assets/fonts/mongolian-codepoints.json').write_text(json.dumps(sorted(ord(c) for c in chars))+'\n')
print('Subset codepoints:',len(chars))
