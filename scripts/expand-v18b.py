"""Apply reviewed, resumable v18b batches. No generated filler or inferred people/dates.

Each TSV row is an authored historical profile. Timeline dates mark particular
occurrences, not catalog snapshot ranges. Re-running skips completed records.
"""
import json
from pathlib import Path
from datetime import datetime, timezone
R=Path(__file__).resolve().parents[1]
def read(p): return json.loads((R/p).read_text())
def write(p,data):
    target=R/p
    temporary=target.with_suffix(target.suffix+'.tmp')
    temporary.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    temporary.replace(target)
catalog=read('data/polities.json')['polities'];intros=read('data/intros.json');progress=read('scripts/v18b-progress.json')
REQUIRED={'年表','重要人物','背景','影響'}
def complete(v):
    return REQUIRED<=v.keys() and 5<=len(v['年表'])<=10 and 3<=len(v['重要人物'])<=8 and 150<=len(v['summary'])<=300
spans={
'藤原氏攝關時期日本':'約九世紀中葉至十一世紀後期為主要階段；並非獨立國家','日本戰國諸國':'約十五世紀後期至十六世紀末；各大名領地存續不同','明亡後割據政權':'1644年以後；南明及其他抵抗勢力終結時間各異','美軍占領下的日本':'1945—1952年（沖繩等地另論）','蒙古諸部':'十二世紀草原政治群體的集合標籤；1206年後形成帝國','教宗國':'756—1870年（期間曾中斷）','波蘭立陶宛聯邦':'1569—1795年','西夏':'1038—1227年','法蒂瑪哈里發國':'909—1171年','馬木路克蘇丹國':'1250—1517年','加茲尼王朝':'977—1186年','威尼斯':'中世紀形成共和國，至1797年','熱那亞':'中世紀形成共和國，至1797年','英格蘭':'十世紀統一，1707年合併為大不列顛王國','蘇格蘭':'中世紀形成王國，1707年合併為大不列顛王國','法蘭西王國':'987—1792年（卡佩王朝以後；此後曾復辟）','奧地利帝國':'1804—1867年','俄羅斯沙皇國':'1547—1721年','條頓騎士團':'1190年起；普魯士領地於1525年世俗化，團體仍延續','匈牙利':'約1000年建立王國；其後政體多次變更','波蘭':'十世紀形成王權；1795—1918年間失去主權國家地位','尼泊爾':'1768年統一加德滿都谷地以後；2008年改為共和國','大越':'1054—1804年間多次使用此國號，期間曾有中斷及改號','占婆':'約二世紀至十九世紀，不同地區與政權的存續有別','朱羅帝國':'約九世紀中葉—1279年','亞齊':'約十六世紀初—二十世紀初；征服後抵抗仍延續','阿曼':'各時期政體有別；1744年起為艾布賽義德家族統治','臺灣':'地理及歷史區域；各時期政體與統治範圍不同','香港':'1841年起英國占領；1997年起為特別行政區，非主權國家','荷屬東印度':'1800—1949年（1942—1945年間日本占領；西新幾內亞另論）','新西班牙總督轄區':'1535—1821年','阿散蒂':'約十七世紀末形成；二十世紀初納入英國殖民統治','克羅埃西亞':'中世紀王國至近現代多次變更；1991年宣布獨立','喬治亞':'中世紀統一王國與現代國家不屬同一連續政體；1991年恢復獨立','緬甸':'歷代王朝與現代國家有別；1948年獨立'}
spans['南詔']='738—902年（整合與建國的起點有不同分期）'
figures={'教宗國':{'領土統治終結年':1870},'波蘭立陶宛聯邦':{'聯合成立年':1569,'憲法通過年':1791},'西夏':{'稱帝年':1038,'覆亡年':1227},'奧地利帝國':{'建立帝號年':1804,'改組二元體制年':1867},'臺灣':{'解除戒嚴年':1987,'首次總統直選年':1996},'香港':{'主權移交年':1997},'荷屬東印度':{'荷蘭主要主權移交年':1949}}
# These are contextual comparisons rather than predecessor/successor links.
exclude_relations={'加茲尼王朝','尼泊爾','朱羅帝國','阿曼','笈多王朝','唐朝','宋朝','占婆','日本戰國諸國'}
name_ids={}
for k,v in catalog.items():
    if v.get('translationStatus')!='untranslated': name_ids.setdefault(v['zh'],[]).append(k)
pending=[]
for source in ('polities.tsv','existing.tsv'):
    for line in (R/'scripts/v18b'/source).read_text().splitlines():
        columns=line.split('|')
        name,capital,language,background,impact,dates,people,relations=columns[:8]
        if len(columns)>8:spans[name]=columns[8]
        assert name in name_ids,name
        timeline=[{'year':int(y),'text':text} for pair in dates.split(';') for y,text in [pair.split(':',1)]]
        persons=[{'name':n,'role':role} for pair in people.split(';') for n,role in [pair.split(':',1)]]
        for pid in name_ids[name]:
            if complete(intros.get(pid,{})):
                if not intros[pid].get('首都'):intros[pid]['首都']=capital
                continue
            old=intros.get(pid)
            record=dict(old) if old else {'name':name,'存續年代':spans[name],'首都':capital,'主要族群/語言':language,'重要事件':[x['text'] for x in timeline[:4]],'前身/後繼':[]}
            if not old:
                for relation in filter(None,relations.split(';')) if name not in exclude_relations else []:
                    rid=name_ids[relation][0]
                    record['前身/後繼'].append({'name':catalog[rid]['zh'],'id':rid})
            for field,value in [('首都',capital),('主要族群/語言',language)]:
                if not record.get(field):record[field]=value
            # A compact summary assembled solely from this profile's authored facts.
            record['summary']=name+'：'+background+'。'.join(x['text'] for x in timeline[1:3])+'。'+impact
            record.update({'年表':timeline,'重要人物':persons,'背景':background,'影響':impact})
            if name in figures: record['關鍵數據']=figures[name]
            pending.append((pid,record))
for start in range(0,len(pending),30):
    batch=pending[start:start+30]
    for pid,record in batch:
        intros[pid]=record
    write('data/intros.json',intros)
    progress['completedIntroIds']=[k for k,v in intros.items() if complete(v)]
    progress['batches'].append({'kind':'intros','ids':[pid for pid,_ in batch],'savedAt':datetime.now(timezone.utc).isoformat()})
    write('scripts/v18b-progress.json',progress)
    print('Saved introduction batch:',len(batch),'completed:',len(progress['completedIntroIds']))
# Repair missing relationship IDs only when the accepted name has an unambiguous match.
for pid,item in intros.items():
    for relation in item['前身/後繼']:
        if not relation.get('id') and len(name_ids.get(relation['name'],[]))==1:
            relation['id']=name_ids[relation['name']][0]
write('data/intros.json',intros)
events=read('data/events.json');registry=read('data/event-id-registry.json')
details_path=R/'data/event-details.json';details=read('data/event-details.json') if details_path.exists() else {}
existing={event['id']:event for event in events}
new=[]
next_number=max(int(x[1:]) for x in set(registry.values())|set(existing))+1
for line in (R/'scripts/v18b/new-events.tsv').read_text().splitlines():
    year,lat,lon,title,category,region,description=line.split('|')
    if title in registry and registry[title] in existing:continue
    eid=registry.get(title) or f'e{next_number:04d}'
    if title not in registry:next_number+=1
    event={'id':eid,'year':int(year),'lat':float(lat),'lon':float(lon),'title':title,'description':description,'category':category,'region':region,'startYear':int(year),'endYear':int(year),'precision':'traditional' if '傳統' in title else 'approximate' if title=='聖加侖修道院學術活動發展' else 'exact','sourceStatus':'editorial'}
    if event['precision']!='exact':event['dateNote']='傳統紀年' if event['precision']=='traditional' else '約'
    new.append(event)
for start in range(0,len(new),30):
    batch=new[start:start+30]
    for event in batch:
        events.append(event);registry[event['title']]=event['id']
    events.sort(key=lambda e:(e['year'],e['id']))
    write('data/events.json',events);write('data/event-id-registry.json',registry)
    progress['addedEventIds']=[e['id'] for e in events if e['id'] not in progress['baselineEventIds']]
    progress['batches'].append({'kind':'new-events','ids':[e['id'] for e in batch],'savedAt':datetime.now(timezone.utc).isoformat()})
    write('scripts/v18b-progress.json',progress)
    print('Saved new event batch:',len(batch))
existing={event['id']:event for event in events}
rows=[]
for line in (R/'scripts/v18b/events.tsv').read_text().splitlines():
    eid,participants,background,course,impact=line.split('|')
    assert eid in existing,eid
    if eid in details and all(k in details[eid] for k in ['description','背景','經過','影響','參與方']):continue
    item={'description':background+course,'背景':background,'經過':course,'影響':impact,'參與方':[name_ids[name][0] for name in participants.split(';')]}
    if '希臘' in participants.split(';') and existing[eid]['year']<0:
        item['參與方說明']='希臘為目錄的概括標籤；此處指雅典、斯巴達等古代城邦，並非現代希臘國家。點選可前往目錄有疆界資料的年代。'
    rows.append((eid,item))
for start in range(0,len(rows),30):
    batch=rows[start:start+30];details.update(batch);write('data/event-details.json',details)
    progress['completedEventIds']=list(details)
    progress['batches'].append({'kind':'event-details','ids':[eid for eid,_ in batch],'savedAt':datetime.now(timezone.utc).isoformat()})
    write('scripts/v18b-progress.json',progress)
    print('Saved event detail batch:',len(batch))
