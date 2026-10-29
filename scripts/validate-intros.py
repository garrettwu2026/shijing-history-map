"""Validate v18b introductions; --allow-incomplete checks resumable batches only."""
import argparse
import json
import re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def read(name):return json.loads((ROOT/'data'/name).read_text())
def validate(intros,catalog,glossary,allow_incomplete=False):
    errors=[];polities=catalog['polities']
    progress=json.loads((ROOT/'scripts/v18b-progress.json').read_text())
    baseline=set(progress['baselineIntroIds'])
    if not baseline<=intros.keys():errors.append('原有介紹 ID 不得遺失')
    if not allow_incomplete and len(intros)<500:errors.append(f'介紹總數尚未達 500：目前 {len(intros)}')
    allowed={}
    for term in glossary['entries']:
        pid=catalog['index'].get(term['original'])
        if pid:allowed.setdefault(pid,set()).add(term.get('accepted_zh_TW') or term.get('previous_zh') or term['original'])
    latin=[(re.compile(r'(?<![A-Za-z])'+re.escape(t['original'])+r'(?![A-Za-z])',re.I),t['original']) for t in glossary['entries'] if t.get('accepted_zh_TW') and re.fullmatch(r'[\x20-\x7e]+',t['original']) and re.search('[A-Za-z]',t['original'])]
    original={'name','summary','存續年代','首都','主要族群/語言','重要事件','前身/後繼'}
    structured={'年表','重要人物','背景','影響'};missing=[]
    for pid,v in intros.items():
        def check(condition,message):
            if not condition:errors.append(f'{pid}: {message}')
        check(pid in polities,'ID 不在政體目錄')
        if pid not in polities:continue
        check(polities[pid]['translationStatus']!='untranslated','不得為未翻譯政體新增介紹')
        check(original<=v.keys() and set(v)<=original|structured|{'關鍵數據'},'欄位不符')
        check(v.get('name') in allowed.get(pid,set()),'名稱須符合詞彙表')
        for field in ['name','summary','存續年代','首都','主要族群/語言']:
            check(isinstance(v.get(field),str) and bool(v[field].strip()),f'{field} 須為非空字串')
        is_complete=structured<=v.keys()
        if not is_complete:missing.append(pid)
        summary=v.get('summary','')
        check(isinstance(summary,str) and (150 if is_complete else 100)<=len(summary)<=300,'summary 須有 150–300 字元（舊資料最低 100）')
        check(v.get('name','') in summary,'摘要須包含顯示名稱')
        check(isinstance(v.get('重要事件'),list) and 3<=len(v['重要事件'])<=5 and all(isinstance(e,str) and e.strip() for e in v['重要事件']),'重要事件須有 3–5 筆')
        for label in ['背景','影響']:
            if label in v:check(isinstance(v[label],str) and 60<=len(v[label])<=150,f'{label} 須有 60–150 字元')
        if '年表' in v:
            rows=v['年表'];check(isinstance(rows,list) and 5<=len(rows)<=10,'年表須有 5–10 筆')
            for row in rows if isinstance(rows,list) else []:
                check(isinstance(row,dict) and set(row)=={'year','text'} and type(row.get('year')) is int and row['year']!=0 and -10000<=row['year']<=2026 and isinstance(row.get('text'),str) and bool(row['text'].strip()),'年表須為 {year:int, text} 且不得有西元 0 年')
        if '重要人物' in v:
            rows=v['重要人物'];check(isinstance(rows,list) and 3<=len(rows)<=8,'重要人物須有 3–8 筆')
            for row in rows if isinstance(rows,list) else []:
                check(isinstance(row,dict) and set(row)=={'name','role'} and all(isinstance(row.get(k),str) and row[k].strip() for k in ['name','role']),'人物須為 {name, role}')
        if '關鍵數據' in v:check(isinstance(v['關鍵數據'],dict) and bool(v['關鍵數據']) and all(isinstance(k,str) and k.strip() and (type(value) in (int,float) or isinstance(value,str) and value.strip()) for k,value in v['關鍵數據'].items()),'關鍵數據須為非空的簡單鍵值物件；無可靠數字時省略')
        relations=v.get('前身/後繼');check(isinstance(relations,list),'前身／後繼須為陣列')
        for relation in relations if isinstance(relations,list) else []:
            check(isinstance(relation,dict) and set(relation)=={'name','id'},'關聯須包含名稱及真實 ID')
            if isinstance(relation,dict):check(relation.get('id') in polities and relation.get('name') in allowed.get(relation.get('id'),set()),'關聯 ID 與名稱不符')
        text=json.dumps(v,ensure_ascii=False)
        check(not re.search(r'https?://|www\.|來源\s*[:：]|參考(?:資料|文獻)|引用\s*[:：]|citation|source',text,re.I),'不得含網址或來源文字')
        for pattern,latin_name in latin:check(not pattern.search(text),f'應使用中文詞彙：{latin_name}')
    if missing and not allow_incomplete:errors.append(f'{len(missing)} 筆既有介紹尚缺結構化欄位：'+', '.join(missing[:8]))
    return errors
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--allow-incomplete',action='store_true');args=parser.parse_args()
    intros=read('intros.json');errors=validate(intros,read('polities.json'),read('glossary.json'),args.allow_incomplete)
    if errors:raise SystemExit('\n'.join(errors))
    complete=sum(all(k in v for k in ['年表','重要人物','背景','影響']) for v in intros.values())
    print(f'介紹結構驗證通過：{len(intros)} 筆；完整結構 {complete} 筆'+('（分批模式，未宣告達標）' if args.allow_incomplete else ''))
