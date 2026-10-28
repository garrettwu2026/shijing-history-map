#!/usr/bin/env python3
"""Apply explicit name review, scan every snapshot against independent chronology rules.
No geometry, identity, endonym, or upstream NAME edits. --check is read-only.
"""
import argparse
import csv
import json
from pathlib import Path
from collections import Counter
ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'
def read(path): return json.loads(path.read_text())
def write(path, value): path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
def tsv(path):
    with path.open() as f: return list(csv.DictReader(f, delimiter='\t'))
def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    catalog, names, errata = (read(DATA / n) for n in ['polities.json', 'names.json', 'errata.json'])
    audits = tsv(ROOT / 'scripts/name-audit-v11.tsv')
    assert len(audits) == 127 and len({a['name'] for a in audits}) == 127
    def apply(name, zh, status, confidence, source='', note=''):
        p = catalog['polities'][catalog['index'][name]]
        expected = dict(zh=zh, translationStatus=status, confidence=confidence)
        if args.check:
            assert all(p[k] == v for k,v in expected.items()), name
        else:
            p.update(expected)
            if note: p['translationNote'] = note
            if source and source not in p['sources']: p['sources'].append(source)
        for n in p['datasetNames']:
            if args.check: assert names[n]['zh'] == zh, n
            else:
                if n not in names: names[n] = dict(zh=zh,native='',aliases=[],importance=p['importance'])
                names[n]['zh'] = zh
    for a in audits:
        n = a['name']
        if a['decision'] == 'revert':
            apply(n, n, 'untranslated', 'low', note='譯名待考：' + a['reason'])
        else:
            assert a['source'].startswith(('https://zh.wikipedia.org/wiki/', 'https://alcd-web.s3-ap-northeast-1.amazonaws.com/'))
            apply(n, a['previousZh'], 'curated', 'medium', a['source'], a['reason'])
    additions = tsv(ROOT / 'scripts/translations-v11.tsv')
    for a in additions:
        apply(a['name'], a['zh'], 'curated', 'medium', a['source'], a['note'])
    # This source name occurs only in the 500 snapshot and is a southern polygon.
    apply('Jin Empire', '南齊', 'curated', 'medium', 'https://zh.wikipedia.org/wiki/南齐',
          '500年南方圖徵依南齊時期修名；原始 Jin Empire／大金 是上游／舊字典錯置，保留以供追溯。幾何待考證。')
    rules = read(ROOT / 'scripts/chronology-rules-v11.json')
    limits = {r['name']:r for r in rules}
    snapshots = read(DATA / 'snapshots.json')
    issues, inventory, checked = [], [], 0
    # Explicit narrow replacements; other outliers retain their identity with a visible warning.
    replacements = {
        ('Jin Empire',500): ('南齊','南齐','500年南方屬南齊（479–502），北方另有 Toba Wei／北魏。此圖徵北緣達37.95°，可能跨越北魏，未擅自重畫邊界。'),
        ('United Kingdom of Great Britain and Ireland',1930): ('大不列顛暨北愛爾蘭聯合王國','英国','1922年愛爾蘭自由邦成立，1927年王室及議會稱號法變更正式國名。'),
        ('Sui Empire',700): ('武周','武周','隋亡於618年；700年為武周（690–705），不直接套用唐朝名稱。'),
        ('Manchu Empire',1914): ('中華民國','中華民國大陸時期','清帝於1912年退位；1914年修用中華民國，幾何未重新考證。'),
        ('Kingdom of Brazil',1878): ('巴西帝國','巴西帝國','巴西王國止於1822年；1822–1889年為巴西帝國。'),
        ('Kingdom of Brazil',1880): ('巴西帝國','巴西帝國','巴西王國止於1822年；1822–1889年為巴西帝國。'),
        ('Kingdom of Brazil',1900): ('巴西共和國','巴西第一共和國','1889年改為共和國；不可沿用巴西王國。'),
        ('Kingdom of Hawaii',1900): ('夏威夷領地（美屬）','夏威夷領地','夏威夷王國於1893年終結，1898年遭美國併吞；1900年成立美國領地，年內轉換採新名。'),
        ('Kō Hawaiʻi Paeʻāina (Hawaiian Kingdom)',1492): ('夏威夷諸酋邦','夏威夷王國','1795年才建立統一夏威夷王國；1492年採描述性名稱，並非宣稱其為單一政體。'),
    }
    for y in [1650,1700,1715,1783,1800]:
        replacements['Austrian Empire',y] = ('哈布斯堡君主國','哈布斯堡君主國','奧地利帝國成立於1804年；此前採哈布斯堡君主國，幾何待考證。')
    old_overrides = errata['overrides']
    generated = []
    for s in snapshots:
        yearly = Counter(f['properties'].get('NAME') for f in read(DATA / s['file'])['features'])
        for n, count in sorted(yearly.items(), key=lambda x:x[0] or ''):
            if not n: continue
            y = s['year']
            inventory.append(dict(year=y,name=n,features=count,rule=n if n in limits else None))
            if n not in limits: continue
            checked += 1
            r = limits[n]
            # Optional holes represent a name interrupted within its overall dynasty span.
            valid = any(a <= y <= b for a,b in r.get('validIntervals', [[r['fromYear'],r['toYear']]])) and not any(a <= y <= b for a,b in r.get('excludedIntervals',[]))
            if valid: continue
            prior = next((e for e in old_overrides if e['match']==n and e.get('fromYear',e.get('year'))<=y<=e.get('toYear',e.get('year')) and not e['id'].startswith('err-v11-')),None)
            p = catalog['polities'][catalog['index'][n]]
            issue = dict(name=n,year=y,expectedFrom=r['fromYear'],expectedTo=r['toYear'],features=count,
                         status='needs-review',kind='name/geometry chronology',geometryStatus='needs-review',source=r['source'])
            if prior:
                issue.update(nameStatus=prior['nameStatus'],zh=prior['zh'],note=prior['note'],source=prior['source'],action='既有勘誤覆蓋')
            else:
                replacement = replacements.get((n,y))
                if replacement:
                    zh,title,note = replacement
                    source = 'https://zh.wikipedia.org/wiki/' + title
                    status = 'corrected'
                else:
                    zh = p['zh'] + '（年代／疆界待考證）'
                    source = r['source']
                    status = 'needs-review'
                    note = f'此名稱參考存續期為 {r["fromYear"]} 至 {r["toYear"]} 年，與 {y} 年快照不符；可能是上游時序、前身／繼承政權或約年問題，名稱及疆界待考證，未推測替代政權。'
                correction = dict(id=f'err-v11-{y}-{catalog["index"][n]}',year=y,match=n,zh=zh,note=note,source=source,
                                  nameStatus=status,geometryStatus='needs-review')
                generated.append(correction)
                issue.update(nameStatus=status,zh=zh,note=note,source=source,action='名稱修正＋疆界待考證' if status=='corrected' else '名稱／疆界待考證')
            issues.append(issue)
    if args.check:
        for e in generated: assert e in old_overrides, e
        assert len([e for e in old_overrides if e['id'].startswith('err-v11-')]) == len(generated)
    else:
        errata['overrides'] = [e for e in old_overrides if not e['id'].startswith('err-v11-')] + generated
        errata['scan'] = issues
        errata['featureReviews'] = [e for e in errata['featureReviews'] if e.get('audit')!='v11'] + [dict(match=e['match'],fromYear=e['year'],toYear=e['year'],status='needs-review',note=e['note'],source=e['source'],audit='v11') for e in generated]
        for n,v in [('polities.json',catalog),('names.json',names),('errata.json',errata)]: write(DATA / n,v)
    pending = sum(p['translationStatus']=='untranslated' for p in catalog['polities'].values())
    priority = {}
    union = set()
    for y in [-500,1,500,1000,1500,1800,1900]:
        s = min(snapshots,key=lambda s:abs(s['year']-y))
        ids={catalog['index'][i['name']] for i in inventory if i['year']==s['year'] and i['name'] in catalog['index']}
        union |= ids
        priority[y] = dict(snapshot=s['year'],total=len(ids),remainingUntranslated=sum(catalog['polities'][i]['translationStatus']=='untranslated' for i in ids))
    report=dict(snapshots=len(snapshots),rules=len(rules),checkedNameSnapshots=checked,
                inventoryNameSnapshots=len(inventory),uncoveredNameSnapshots=len(inventory)-checked,
                issues=issues,auditCounts=dict(Counter(a['decision'] for a in audits)),
                remainingUntranslated=pending,remainingPending=pending,priority=priority,
                priorityUnionPending=sum(catalog['polities'][i]['translationStatus']=='untranslated' for i in union))
    if not args.check:
        (ROOT/'artifacts').mkdir(exist_ok=True)
        write(ROOT/'artifacts/v11-audit.json',report)
        write(ROOT/'artifacts/v11-chronology-inventory.json',inventory)
    print(json.dumps({k:v for k,v in report.items() if k!='issues'},ensure_ascii=False,indent=2))
if __name__=='__main__': main()
