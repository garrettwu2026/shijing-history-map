"""Reviewed conventional names only; uncertain originals stay untranslated.
Curated means an editorial translation, not a claim of independently verified borders.
"""
import json
from pathlib import Path
from urllib.parse import quote
R=Path(__file__).resolve().parents[1]
def read(name):return json.loads((R/'data'/name).read_text())
def save(name,data):(R/'data'/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
p=read('polities.json')
before=sum(n['translationStatus']=='untranslated' for n in p['polities'].values())
# Conventional Taiwanese scholarly names; generic descriptions are translated semantically.
rows='''Ainu|阿伊努族
Ainus|阿伊努族
Adena Culture|阿德納文化
Afanasevo|阿凡納謝沃文化
Aghlabid Emirate|阿格拉布王朝
Alamans|阿勒曼尼人
Alans|阿蘭人
Amazon hunter-gatherers|亞馬遜狩獵採集社群
Andean hunter-gatherers|安地斯狩獵採集社群
Andean states and chiefdoms|安地斯諸國與酋邦
Anatolian tribes|安那托利亞諸部族
Anasazi|古普 Pueblo 社群
Andorra|安道爾
Andronovo|安德羅諾沃文化
Angevin Empire|安茹帝國
Anglo-Egyptian Sudan|英埃共管蘇丹
Anglo-Saxons|盎格魯撒克遜人
Antarctica|南極洲
Arameans|亞蘭人
Arabs|阿拉伯人
Arakan|若開
Arakan (Indian princely state)|若開
Arawaks|阿拉瓦克人
Armenia|亞美尼亞
Asturias|阿斯圖里亞斯王國
Atropatene|阿特羅帕特尼
Austrian Netherlands|奧屬尼德蘭
Austronesians|南島語族
Avanti|阿槃提
Bactria|巴克特里亞
Baden|巴登
Bashkirs|巴什基爾人
Basques|巴斯克人
Basutoland|巴蘇陀蘭
Batavian Republic|巴達維亞共和國
Bavaria|巴伐利亞
Beaker|鐘形杯文化
Bedouins|貝都因人
Belgian Congo|比屬剛果
Bengal|孟加拉
Berber Tribes|柏柏爾諸部族
Berbers|柏柏爾人
Bithynia|比提尼亞
Blackfoot|黑腳族
Blue Horde|藍帳汗國
Bokhara Khanate|布哈拉汗國
Bosnia|波士尼亞
Bosnia and Herzegovina|波士尼亞與赫塞哥維納
Bosnia-Herzegovina|波士尼亞與赫塞哥維納
Bosporan Kingdom|博斯普魯斯王國
Bosporian Kingdom|博斯普魯斯王國
Brandenburg|布蘭登堡
Bremen|不來梅
Britany|布列塔尼
British American colonies|英屬北美殖民地
British East Africa|英屬東非
British Guiana|英屬圭亞那
British Somaliland|英屬索馬利蘭
Brunswick|布倫瑞克
Buganda|布干達王國
Bulgar Khanate|保加利亞汗國
Bulgars|保加爾人
Bunyoro|布尼奧羅王國
Burgandy|勃艮第
Burgundians|勃艮第人
Buyid Emirate|白益王朝
Buyid dynasty|白益王朝
Byelarus|白俄羅斯
Canaan|迦南
Cape Colony|開普殖民地
Cappadocia|卡帕多奇亞
Catacomb culture|地下墓穴文化
Caucasian Albania|高加索阿爾巴尼亞
Celtiberians|凱爾特伊比利亞人
Celtic kingdoms|凱爾特諸王國
Cheyenne|夏安族
Chinchorro culture|欽喬羅文化
Chinese Warlords|中國軍閥割據區
Chinese warlords|中國軍閥割據區
Chukchi|楚科奇人
Chūzan|中山王國
Cimerians|辛梅里亞人
Cochin China|交趾支那
Colchis|科爾基斯
Comanche|科曼奇族
Congo (France)|法屬剛果
Corsica|科西嘉
Cree|克里族
Crete|克里特
Croatian kingdom|克羅埃西亞王國
Cuba (Spain)|西屬古巴
Cycladic|基克拉澤斯文化
Cyrenaica|昔蘭尼加
Czechs|捷克人
Dacia|達契亞
Dacians|達契亞人
Danes|丹麥人
Danube Bulgars|多瑙河保加爾人
Danzig|但澤
Darfur|達佛
Dodecanese Islands|多德卡尼斯群島
Dominion of Newfoundland|紐芬蘭自治領
Donghu tribes|東胡諸部
Dravidians|達羅毗荼人
Duchy of Benevento|貝內文托公國
Duchy of Swabia|士瓦本公國
Dutch Brazil|荷屬巴西
Dutch East Indies|荷屬東印度
Dutch Guiana|荷屬圭亞那
Dutch Guinea|荷屬幾內亞
Dvaravati|墮羅鉢底
East Germany|東德
East Prussia|東普魯士
Emirate of Sicily|西西里酋長國
England and Ireland|英格蘭與愛爾蘭
Essex|埃塞克斯王國
Etrurians|伊特拉斯坎人
French Equatorial Africa|法屬赤道非洲
French Guiana|法屬圭亞那
French Indo-China|法屬印度支那
French Indochina|法屬印度支那
French Somaliland|法屬索馬利蘭
French West Africa|法屬西非
Frisians|弗里斯蘭人
Fulani Empire|富拉尼帝國
Funnel-Beaker|漏斗杯文化
Gandhāra|犍陀羅
Gaya|伽倻
Gepids|格皮德人
German E. Africa (Tanganyika)|德屬東非（坦干伊喀）
German South-West Africa|德屬西南非
Germanic tribes|日耳曼諸部族
Germany (France)|法國占領區（德國）
Germany (Soviet)|蘇聯占領區（德國）
Germany (UK)|英國占領區（德國）
Germany (USA)|美國占領區（德國）
Gold Coast|黃金海岸
Gold Coast (GB)|英屬黃金海岸
Goths|哥德人
Granada|格拉納達
Great Moravia|大摩拉維亞
Gurjara Pratihara|瞿折羅普臘蒂哈臘王朝
Hafsid Caliphate|哈夫斯王朝
Hallstatt culture|哈爾施塔特文化
Hamburg|漢堡
Han Zhao|漢趙
Hanover|漢諾威
Haripunjaya|駭黎朋猜
Hausa States|豪薩諸邦
Hejaz|漢志
Helvetic Republic|赫爾維蒂共和國
Himyarite Kingdom|希木葉爾王國
Hokuzan|北山王國
Hong Kong|香港
Hopewell Culture|霍普韋爾文化
Hunters-gatherers|狩獵採集社群
Hurrian Kingdoms|胡里特諸王國
Idrisid Caliphate|伊德里斯王朝
Illyrians|伊利里亞人
Italian Somaliland|義屬索馬利蘭
Japan (USA)|美軍占領下的日本
Jōmon|繩文文化
Kalinga|羯陵伽
Kamarupa|迦摩縷波
Kanem|加涅姆
Karakalpaks|卡拉卡爾帕克人
Karasuk culture|卡拉蘇克文化
Karelians|卡累利阿人
Karluks|葛邏祿
Kediri|諫義里王國
Kent|肯特王國
Khiva Khanate|希瓦汗國
Kingdom of Georgia|喬治亞王國
Kingdom of Hungary|匈牙利王國
Kingdom of Ireland|愛爾蘭王國
Kingdom of Italy|義大利王國
Kingdom of Norway|挪威王國
Korea (USA)|美軍占領區（朝鮮半島）
Korea (USSR)|蘇軍占領區（朝鮮半島）
Koreans|朝鮮人
Kosala|憍薩羅
Kuru|俱盧
Kwarezm|花剌子模
La Tène culture|拉坦文化
Lan Na|蘭納王國
Late Jomon culture|晚期繩文文化
Liechtenstein|列支敦斯登
Lombard duchies|倫巴底諸公國
Lombardy|倫巴底
Lusatian culture|盧薩蒂亞文化
Magyars|馬扎爾人
Manchuria|滿洲
Mandatory Palestine (GB)|英屬巴勒斯坦託管地
Mataram|馬打蘭王國
Mauretania|毛里塔尼亞王國
Maya chiefdoms and states|馬雅酋邦與諸國
Maya city-states|馬雅城邦
Maya states|馬雅諸國
Mercia|麥西亞王國
Meroe|麥羅埃
Middag Kingdom|大肚王國
Milan|米蘭
Min-Yue|閩越
Minoan|米諾斯文明
Mixtecs|米斯特克人
Moche|莫切文化
Mon-Khmer|孟高棉語族
Muscovy|莫斯科公國
Mysore|邁索爾王國
Mysore (Indian princely state)|邁索爾土邦
Māori|毛利人
Nabatean Kingdom|納巴泰王國
Nan Chao|南詔
Nan-Zhao|南詔
Nan-Yue|南越
Nanzan|南山王國
Naples|拿坡里
Navarre|納瓦拉
Nazca|納斯卡文化
Neanderthal|尼安德塔人
Neolithic Farmers|新石器時代農耕社群
Netherlands Indies|荷屬東印度
New Amsterdam|新阿姆斯特丹
New France|新法蘭西
Nogai Horde|諾蓋汗國
Norsemen|北歐人
Northern Liang|北涼
Northern Rhodesia|北羅德西亞
Northmen|北歐人
Northumbria|諾森布里亞王國
Novgorod|諾夫哥羅德
Numidia|努米底亞
Nyasaland|尼亞薩蘭
Oghuz|烏古斯
Oghuz Turks|烏古斯突厥人
Orange Free State|奧蘭治自由邦
Oromo|奧羅莫人
Ottoman Sultanate|鄂圖曼蘇丹國
Other Rus Principalities|羅斯諸公國
Paekche|百濟
Pagan|蒲甘王朝
Palas|波羅王朝
Pallava|帕拉瓦王朝
Pallava state|帕拉瓦王朝
Parhae|渤海國
Pechenegs|佩切涅格人
Pergamon|帕加馬王國
Persia|波斯
Phrygians|弗里吉亞人
Picts|皮克特人
Polish–Lithuanian Commonwealth|波蘭立陶宛聯邦
Polynesians|玻里尼西亞人
Portuguese Brazil|葡屬巴西
Portuguese East Africa|葡屬東非
Portuguese Guinea|葡屬幾內亞
Post-Ming Warlords|明亡後割據政權
Pratiharas|普臘蒂哈臘王朝
Principality of Galicia-Volhynia|加利西亞沃里尼亞公國
Principality of Kyiv|基輔公國
Principality of Novgorod|諾夫哥羅德公國
Principality of Polotsk|波洛茨克公國
Principality of Vladimir-Suzdal|弗拉基米爾蘇茲達爾公國
Principality of Wallachia|瓦拉幾亞公國
Prussians|普魯士人
Pyu state|驃國
Quazaq Khanate|哈薩克汗國
Rajputs|拉傑普特人
Rashtrakuta|羅濕陀羅拘陀王朝
Rashtrakuta state|羅濕陀羅拘陀王朝
Rattanakosin Kingdom|拉達那哥欣王國
Republic of Turkey|土耳其共和國
Rhodesia|羅德西亞
Rome|羅馬
Ruanruan|柔然
Rus' Khaganate|羅斯汗國
Ryazan|梁贊公國
Saba|示巴
Saffarids|薩法爾王朝
Samanid Empire|薩曼王朝
Sami|薩米人
Samis|薩米人
Sámi|薩米人
San Marino|聖馬利諾
Sardinia|薩丁尼亞
Sardinia-Piedmont|薩丁尼亞皮埃蒙特
Sarmates|薩爾馬提亞人
Saxons|薩克森人
Saxony|薩克森
Scots|蘇格蘭人
Scythians|斯基泰人
Shan states|撣邦諸國
Shogun Japan (Kamakura)|鎌倉幕府
Sicily|西西里
Sikhs|錫克人
Sind|信德
Sindh|信德
Sintashta|辛塔什塔文化
Sixteen Kingdoms|十六國
Slavic tribes|斯拉夫諸部族
Slavonic tribes|斯拉夫諸部族
Slavs|斯拉夫人
Sokoto Caliphate|索科托哈里發國
Southern Rhodesia|南羅德西亞
Southern Xiongnu|南匈奴
Spanish Sahara|西屬撒哈拉
Suebi|蘇維匯人
Sultanate of Zanzibar|桑給巴爾蘇丹國
Sultinate of Zanzibar|桑給巴爾蘇丹國
Suomi|芬蘭
Swabia|士瓦本
Sweden–Norway|瑞典挪威聯合王國
Swedes|瑞典人
Swiss Confederation|瑞士邦聯
Syunik|休尼克
Taino|泰諾人
Taiwanese Tribes|臺灣原住民族
Teutonic Knights|條頓騎士團
Thrace|色雷斯
Thule|圖勒文化
Tiahuanaco Empire|蒂瓦納庫文化
Tibetan Empire|吐蕃
Tibetans|藏人
Tibeto-Burmanese|藏緬語族
Toba Wei|北魏
Tokugawa shogunate|德川幕府
Toltec Empire|托爾特克文明
Tonkin|東京（越南北部）
Transvaal|德蘭士瓦
Trebizond|特拉比松帝國
Tripolitania|的黎波里塔尼亞
Trucial Oman|特魯西爾阿曼
Tuaregs|圖阿雷格人
Tungus|通古斯人
Tungusic Tribes|通古斯諸部族
Tuscany|托斯卡尼
Union of South Africa|南非聯邦
Urnfield cultures|骨灰甕文化
Vakataka|伐迦陀迦王朝
Vedic Aryans|吠陀時代雅利安人
Volga Bulgars|伏爾加保加爾人
Welsh|威爾斯人
Wessex|威塞克斯王國
West Germany|西德
Western Chalukyas|西遮婁其王朝
Western Sahara|西撒哈拉
White Russia|白俄羅斯
Wu|吳
Xia|夏
Xinjiang|新疆
Yayoi|彌生文化
Yue|越
Yueban|悅般
Yuezhi|月氏
Zaire|薩伊爾
Zaire (Belgium)|比屬剛果
Zanzibar|桑給巴爾
Zhangzhung Kingdom|象雄
city-states|城邦
minor states|諸小國'''
# Remove one ambiguous proposed mapping: preserve original pending review.
rows='\n'.join(r for r in rows.splitlines() if not r.startswith('Anasazi|'))
changes=[]
for row in rows.splitlines():
 key,zh=row.split('|'); ident=p['index'].get(key)
 if not ident:continue
 n=p['polities'][ident]
 if n['translationStatus']=='untranslated':changes.append(key)
 n.update(zh=zh,translationStatus='curated',confidence='medium')
 n['translationNote']='通用譯名或原文地理描述的意譯；實體性質及疆界仍須另行考證。'
 n['translationReference']='https://zh.wikipedia.org/zh-tw/'+quote(zh)
for n in p['polities'].values():
 key=n['datasetNames'][0]
 n['entityType']='cultural-area' if any(t in key.lower() for t in ['culture','hunter','gatherer','neolithic','mesolithic','pastoral','jōmon','yayoi','minoan','cycladic','sintashta','afanas','andronovo']) else 'polity-or-community'
 for e in n['endonyms']:
  e['language']='中古希臘語' if key=='Byzantine Empire' else '鄂圖曼土耳其語'
  e['sourceUrl']='https://www.britannica.com/place/Byzantine-Empire' if key=='Byzantine Empire' else 'https://www.britannica.com/place/Ottoman-Empire'
  e['sourceStatus']='reference-unverified';e['kind']='史料用稱（使用時期待逐筆複核）'
save('polities.json',p)
err=read('errata.json');err['overrides']=[x for x in err['overrides'] if x['match']!='Zaire']
for x in err['overrides']:x.update(nameStatus='corrected',geometryStatus='needs-review')
for a,b,zh in [(1908,1959,'比屬剛果'),(1960,1963,'剛果共和國（利奧波德維爾）'),(1964,1970,'剛果民主共和國'),(1971,1996,'薩伊爾'),(1997,2026,'剛果民主共和國')]:
 err['overrides'].append(dict(id=f'err-zaire-{a}',match='Zaire',fromYear=a,toYear=b,zh=zh,nameStatus='corrected',geometryStatus='needs-review',source='https://www.larousse.fr/encyclopedie/pays/République_démocratique_du_Congo/114374',note='名稱依快照所屬時期修正；1971年10月及1997年5月更名，年尺度採新名。疆界未重新考證。'))
for x in err['scan']:x.update(nameStatus='corrected',geometryStatus='needs-review')
save('errata.json',err)
# Explicit article destinations; article existence/content remain visibly unverified
# until individually checked. Never manufacture a verified status from a title.
articles={
'仰韶彩陶文化形成':'Yangshao culture','甘提亞神廟建造':'Ġgantija','紐格蘭奇通道墓建造':'Newgrange','巨石陣大型石圈建造':'Stonehenge',
'伯羅奔尼撒戰爭開始':'Peloponnesian War','第一次布匿戰爭開始':'First Punic War','第一次布匿戰爭結束':'First Punic War','凱撒展開高盧戰爭':'Gallic Wars','阿拔斯革命':'Abbasid Revolution',
'英法百年戰爭開始':'Hundred Years\' War','尼德蘭起義進入長期戰爭':'Eighty Years\' War','壬辰戰爭爆發':'Japanese invasions of Korea (1592–1598)','三十年戰爭開始':'Thirty Years\' War','英格蘭光榮革命':'Glorious Revolution',
'七年戰爭爆發':'Seven Years\' War','工業革命展開':'Industrial Revolution','巴黎和約結束七年戰爭':'Treaty of Paris (1763)','美國獨立戰爭爆發':'American Revolutionary War','法國大革命':'French Revolution','海地革命開始':'Haitian Revolution','五月革命':'May Revolution',
'希臘獨立戰爭開始':'Greek War of Independence','第一次英緬戰爭':'First Anglo-Burmese War','爪哇戰爭爆發':'Java War','第一次鴉片戰爭爆發':'First Opium War','美墨戰爭爆發':'Mexican–American War','歐洲革命浪潮':'Revolutions of 1848','第二次英緬戰爭':'Second Anglo-Burmese War',
'克里米亞戰爭爆發':'Crimean War','第二次鴉片戰爭開始':'Second Opium War','美國南北戰爭開始':'American Civil War','巴拉圭戰爭開始':'Paraguayan War','西南戰爭':'Satsuma Rebellion','太平洋戰爭爆發':'War of the Pacific','英祖戰爭':'Anglo-Zulu War','清法戰爭爆發':'Sino-French War','第三次英緬戰爭':'Third Anglo-Burmese War','甲午戰爭爆發':'First Sino-Japanese War',
'菲律賓革命爆發':'Philippine Revolution','美西戰爭':'Spanish–American War','第二次波耳戰爭爆發':'Second Boer War','美菲戰爭爆發':'Philippine–American War','日俄戰爭爆發':'Russo-Japanese War','伊朗立憲革命':'Persian Constitutional Revolution','墨西哥革命開始':'Mexican Revolution','辛亥革命':'1911 Revolution','俄國革命':'Russian Revolution','暹羅立憲革命':'Siamese revolution of 1932',
'阿爾及利亞獨立戰爭開始':'Algerian War','匈牙利革命':'Hungarian Revolution of 1956','古巴革命取得勝利':'Cuban Revolution','六日戰爭':'Six-Day War','贖罪日戰爭':'Yom Kippur War','伊朗革命':'Iranian Revolution','福克蘭／馬爾維納斯戰爭':'Falklands War','菲律賓人民力量革命':'People Power Revolution'}
ranges={'英法百年戰爭開始':(1337,1453),'三十年戰爭開始':(1618,1648),'七年戰爭爆發':(1756,1763),'美國獨立戰爭爆發':(1775,1783),'法國大革命':(1789,1799),'海地革命開始':(1791,1804),'第一次英緬戰爭':(1824,1826),'第一次鴉片戰爭爆發':(1839,1842),'美墨戰爭爆發':(1846,1848),'克里米亞戰爭爆發':(1853,1856),'第二次鴉片戰爭開始':(1856,1860),'美國南北戰爭開始':(1861,1865),'甲午戰爭爆發':(1894,1895),'第二次波耳戰爭爆發':(1899,1902),'日俄戰爭爆發':(1904,1905),'阿爾及利亞獨立戰爭開始':(1954,1962),'伯羅奔尼撒戰爭開始':(-431,-404),'第一次布匿戰爭開始':(-264,-241),'凱撒展開高盧戰爭':(-58,-50),'尼德蘭起義進入長期戰爭':(1568,1648),'壬辰戰爭爆發':(1592,1598)}
events=read('events.json')
for e in events:
 if e['title'] in articles:
  e['sourceUrl']='https://en.wikipedia.org/wiki/'+quote(articles[e['title']].replace(' ','_'));e['sourceStatus']='article-unverified'
 if e['title'] in ranges:
  e['startYear'],e['endYear']=ranges[e['title']];e['chronologyStatus']='range-editorial-review';e['title']=e['title'].removesuffix('開始').removesuffix('爆發')
 if articles.get(e['title'])=="Hundred Years' War" or e['startYear']==1337 and e['endYear']==1453:
  e['sourceUrl']='https://royalarmouries.org/objects-and-stories/stories/the-hundred-years-war-1337-1453';e['sourceStatus']='verified';e['chronologyStatus']='range-verified'
save('events.json',events)
after=sum(n['translationStatus']=='untranslated' for n in p['polities'].values())
Path('artifacts/v7-content-counts.json').write_text(json.dumps(dict(before=before,after=after,added=len(changes),names=changes,eventsDirect=sum('search?' not in e['sourceUrl'] for e in events),eventsUnverified=sum(e['sourceStatus']!='verified' for e in events),ranges=sum(e['startYear']!=e['endYear'] for e in events)),ensure_ascii=False,indent=2))
print(before,after,len(changes))
