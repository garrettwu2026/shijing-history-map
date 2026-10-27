"""Explicit reference destinations; never turn unreviewed articles into verified sources."""
import json
from pathlib import Path
from urllib.parse import quote
R=Path(__file__).resolve().parents[1]
rows='''路易斯安那購地|Louisiana Purchase
特拉法加海戰|Battle of Trafalgar
英國禁止奴隸貿易|Slave Trade Act 1807
挪威憲法制定|Constitution of Norway
滑鐵盧戰役|Battle of Waterloo
維也納會議重整歐洲|Congress of Vienna
阿根廷獨立宣言|Argentine Declaration of Independence
博亞卡戰役|Battle of Boyacá
皮欽查戰役|Battle of Pichincha
阿亞庫喬戰役|Battle of Ayacucho
斯托克頓與達靈頓鐵路通車|Stockton and Darlington Railway
血河戰役|Battle of Blood River
達蓋爾攝影法公布|Daguerreotype
《懷唐伊條約》簽署|Treaty of Waitangi
《南京條約》簽訂|Treaty of Nanking
懷勞衝突|Wairau Affray
愛爾蘭大饑荒開始|Great Famine (Ireland)
《共產黨宣言》出版|The Communist Manifesto
加州淘金潮開始|California Gold Rush
塞尼卡福爾斯婦女權利會議|Seneca Falls Convention
太平天國運動興起|Taiping Rebellion
倫敦萬國工業博覽會|Great Exhibition
維多利亞淘金潮|Victorian gold rush
《神奈川條約》|Convention of Kanagawa
尤里卡圍柵事件|Eureka Rebellion
印度大起義|Indian Rebellion of 1857
《物種起源》出版|On the Origin of Species
俄國農奴解放|Emancipation reform of 1861
《解放奴隸宣言》生效|Emancipation Proclamation
國際紅十字委員會成立|International Committee of the Red Cross
加拿大聯邦成立|Canadian Confederation
美國購得阿拉斯加|Alaska Purchase
明治維新|Meiji Restoration
美國橫貫大陸鐵路接軌|First transcontinental railroad
蘇伊士運河通航|Suez Canal
巴黎公社|Paris Commune
牡丹社事件|Japanese invasion of Taiwan (1874)
小大角戰役|Battle of the Little Bighorn
壬午軍亂|Imo Incident
喀拉喀托火山爆發|1883 eruption of Krakatoa
柏林會議召開|Berlin Conference
乾草市場事件|Haymarket affair
自由女神像揭幕|Statue of Liberty
《大日本帝國憲法》頒布|Meiji Constitution
傷膝河屠殺|Wounded Knee Massacre
夏威夷王國遭推翻|Overthrow of the Hawaiian Kingdom
東學農民運動|Donghak Peasant Revolution
阿杜瓦戰役|Battle of Adwa
首屆現代奧運|1896 Summer Olympics
恩圖曼戰役|Battle of Omdurman
義和團與八國聯軍|Boxer Rebellion
《弗里尼欣和約》|Treaty of Vereeniging
萊特兄弟動力飛行|Wright brothers
赫雷羅與納馬遭殖民屠殺|Herero and Nama genocide
挪威與瑞典聯合解體|Dissolution of the union between Norway and Sweden
舊金山大地震|1906 San Francisco earthquake
南非《原住民土地法》|Natives Land Act, 1913
第一次世界大戰爆發|World War I
亞美尼亞大屠殺|Armenian genocide
《貝爾福宣言》|Balfour Declaration
第一次世界大戰停戰|Armistice of 11 November 1918
三一獨立運動|March First Movement
五四運動|May Fourth Movement
凡爾賽條約|Treaty of Versailles
阿姆利則慘案|Jallianwala Bagh massacre
四一二清黨|Shanghai massacre
華爾街股災|Wall Street Crash of 1929
甘地食鹽進軍|Salt March
九一八事變|Mukden Incident
西班牙內戰爆發|Spanish Civil War
七七事變|Marco Polo Bridge Incident
南京大屠殺|Nanjing Massacre
第二次世界大戰在歐洲爆發|World War II
不列顛空戰|Battle of Britain
德國入侵蘇聯|Operation Barbarossa
珍珠港事件|Attack on Pearl Harbor
瓜達康納爾戰役|Guadalcanal campaign
科科達戰役|Kokoda Track campaign
布列敦森林會議|Bretton Woods Conference
諾曼第登陸|Normandy landings
廣島原子彈爆炸|Atomic bombings of Hiroshima and Nagasaki
二二八事件|February 28 incident
《世界人權宣言》通過|Universal Declaration of Human Rights
北大西洋公約組織成立|NATO
韓戰爆發|Korean War
韓戰停戰協定|Korean Armistice Agreement
奠邊府戰役|Battle of Dien Bien Phu
萬隆會議|Bandung Conference
蘇伊士運河危機|Suez Crisis
《羅馬條約》簽署|Treaty of Rome
史普尼克一號升空|Sputnik 1
八二三砲戰|Second Taiwan Strait Crisis
沙佩維爾屠殺|Sharpeville massacre
加加林首次載人太空飛行|Vostok 1
柏林圍牆興建|Berlin Wall
古巴飛彈危機|Cuban Missile Crisis
華盛頓大遊行|March on Washington for Jobs and Freedom
印尼大規模反共屠殺開始|Indonesian mass killings of 1965–66
東南亞國協成立|ASEAN
布拉格之春遭鎮壓|Warsaw Pact invasion of Czechoslovakia
阿波羅十一號登月|Apollo 11
聯大第2758號決議|United Nations General Assembly Resolution 2758
尼克森訪問中國|1972 visit by Richard Nixon to China
聯合國人類環境會議|United Nations Conference on the Human Environment
智利軍事政變|1973 Chilean coup d'état
越戰結束|Fall of Saigon
索維托起義|Soweto uprising
航海家探測器發射|Voyager program
大衛營協議|Camp David Accords
蘇聯入侵阿富汗|Soviet–Afghan War
波蘭團結工聯成立|Solidarity (Polish trade union)
博帕爾毒氣災難|Bhopal disaster
車諾比核災|Chernobyl disaster
《蒙特婁議定書》簽署|Montreal Protocol
馬提尼翁協議|Matignon Agreements (1988)
六四鎮壓|1989 Tiananmen Square protests and massacre
柏林圍牆開放|Fall of the Berlin Wall
伊拉克入侵科威特|Iraqi invasion of Kuwait
野百合學運|Wild Lily student movement
蘇聯解體|Dissolution of the Soviet Union
《馬斯垂克條約》簽署|Maastricht Treaty
聯合國地球高峰會|Earth Summit
奧斯陸協議公開簽署|Oslo Accords
南非首次不分種族大選|1994 South African general election
盧安達種族滅絕|Rwandan genocide
世界貿易組織成立|World Trade Organization
岱頓和平協議|Dayton Agreement
臺灣首次總統直選|1996 Taiwanese presidential election
香港主權移交|Handover of Hong Kong
《貝爾法斯特協議》|Good Friday Agreement
東帝汶自決公投|1999 East Timorese independence referendum
澳門主權移交|Handover of Macau
臺灣首次政黨輪替|2000 Taiwanese presidential election
九一一攻擊|September 11 attacks
神舟五號載人飛行|Shenzhou 5
美國主導入侵伊拉克|2003 invasion of Iraq
印度洋大地震與海嘯|2004 Indian Ocean earthquake and tsunami
尼泊爾人民運動|2006 Nepalese revolution
全球金融危機|2007–2008 financial crisis
海地大地震|2010 Haiti earthquake
東日本大震災與福島核災|2011 Tōhoku earthquake and tsunami
阿拉伯之春|Arab Spring
俄羅斯占領並併吞克里米亞|Annexation of Crimea by the Russian Federation
西非伊波拉疫情擴大|Western African Ebola epidemic
《巴黎協定》通過|Paris Agreement
哥倫比亞和平協議|Colombian peace process
2020 COVID-19被評估為大流行|COVID-19 pandemic
詹姆斯韋伯太空望遠鏡升空|James Webb Space Telescope
俄羅斯全面入侵烏克蘭|Russian invasion of Ukraine
印度月船三號登月|Chandrayaan-3
巴黎奧運開幕|2024 Summer Olympics
大阪世界博覽會開幕|Expo 2025'''
lookup=dict(r.split('|') for r in rows.splitlines())
events=json.loads((R/'data/events.json').read_text())
for e in events:
 if e['title'] in lookup and e['sourceStatus']!='verified':e.update(sourceUrl='https://en.wikipedia.org/wiki/'+quote(lookup[e['title']].replace(' ','_')),sourceStatus='article-unverified')
for title,start,end in [('工業革命展開',1760,1840),('第一次世界大戰爆發',1914,1918),('第二次世界大戰在歐洲爆發',1939,1945),('西班牙內戰爆發',1936,1939),('韓戰爆發',1950,1953),('愛爾蘭大饑荒開始',1845,1852)]:
 for e in events:
  if e['title']==title:
   e.update(startYear=start,endYear=end,chronologyStatus='range-editorial-review',title=title.removesuffix('開始').removesuffix('爆發').removesuffix('展開'))
   if start==1760:e.update(precision='approximate',sourceUrl='https://en.wikipedia.org/wiki/Industrial_Revolution',sourceStatus='article-unverified')
(R/'data/events.json').write_text(json.dumps(events,ensure_ascii=False,indent=2)+'\n')
p=R/'data/event-id-registry.json';registry=json.loads(p.read_text())
for e in events:registry[e['title']]=e['id']
p.write_text(json.dumps(registry,ensure_ascii=False,indent=2)+'\n')
print('Specific URLs:',sum('search?' not in e['sourceUrl'] for e in events),'/',len(events))
