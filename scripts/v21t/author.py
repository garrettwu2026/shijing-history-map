"""Build an explicitly authored manifest without modifying site data."""
import json
from pathlib import Path
R=Path(__file__).resolve().parents[2]
rows=[]
def add(pid,original,zh,aat,sources,summary,span,capital,language,events,timeline,people,background,impact,aliases=None,figures=None):
 p={'name':zh,'summary':summary,'存續年代':span,'首都':capital,'主要族群/語言':language,'重要事件':events,'前身/後繼':[], '年表':[dict(year=y,text=t) for y,t in timeline],'重要人物':[dict(name=n,role=r) for n,r in people],'背景':background,'影響':impact}
 if figures:p['關鍵數據']=figures
 for f,l,h in [('summary',150,300),('背景',60,150),('影響',60,150)]:assert l<=len(p[f])<=h,(original,f,len(p[f]))
 row=dict(id=pid,original=original,zh=zh,identitySource='https://www.getty.edu/vow/AATFullDisplay?find=&logic=&note=&subjectid='+aat,nameBasis='逐筆核對Getty AAT文化階層、繁中首選及中研院署名；來源判讀保存在對應批次artifacts。',note='目錄採樣年不視為興亡年；自稱、地方組織與歷史範圍另於介紹區分。',researchSources=sources,profile=p)
 if aliases:row['nameOnlyAliases']=[dict(id=k,original=n,note=t) for k,n,t in aliases]
 rows.append(row)
def save(batch):
 p=R/f'scripts/v21t/batch-{batch:02d}.json';p.write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n');print('Authored',len(rows),'profiles')
