"""Materialize individually researched profiles; no automatic name inference."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
rows = []

def add(pid, original, zh, aat, sources, summary, span, capital, language, events, timeline, people, background, impact, aliases=None, relations=None, figures=None):
    profile = {'name': zh, 'summary': summary, '存續年代': span, '首都': capital,
               '主要族群/語言': language, '重要事件': events, '前身/後繼': relations or [],
               '年表': [dict(year=y, text=t) for y, t in timeline],
               '重要人物': [dict(name=n, role=r) for n, r in people],
               '背景': background, '影響': impact}
    if figures:
        profile['關鍵數據'] = figures
    for key, low, high in [('summary', 150, 300), ('背景', 60, 150), ('影響', 60, 150)]:
        assert low <= len(profile[key]) <= high, (original, key, len(profile[key]))
    row = dict(id=pid, original=original, zh=zh,
               identitySource='https://www.getty.edu/vow/AATFullDisplay?find=&logic=AND&note=&subjectid='+aat,
               nameBasis='逐筆核對Getty AAT文化階層、繁中首選及AS-Academia Sinica署名；名稱證據存artifacts/v21t-name-research-69。',
               note='目錄年代是地圖採樣範圍，非已核實的興亡年；自稱與地方組織另於介紹說明。',
               researchSources=sources, profile=profile)
    if aliases:
        row['nameOnlyAliases'] = [dict(id=k, original=n, note=t) for k, n, t in aliases]
    rows.append(row)

add('p-c0b203b442f03adf', 'Hän', '韓族（美洲原住民）', '300017480', [
 'https://www.biographi.ca/en/bio/isaac_16E.html',
 'https://www.trondek.ca/our-programs-services/heritage/our-language/',
 'https://www.rcaanc-cirnac.gc.ca/eng/1314908720683/1617811167972',
 'https://www.yukonu.ca/news/201304/percy-henry-receive-honorary-diploma-yukon-college',
 'https://parks.canada.ca/culture/spm-whs/sites-canada/trondek-klondike',
 'https://www.cyfn.ca/nations/trondek-hwechin/'],
 '韓族（美洲原住民）是育空河中上游兩岸的原住民族，家園跨越今日阿拉斯加與加拿大育空地區。社群依河流、鮭魚漁場及季節性狩獵路線安排生活，並無全族共同首都。十九世紀商站、傳教及克朗代克淘金潮改變人口與土地關係，部分族人遷往較遠離礦業城鎮的村落。地方領袖透過協商及跨境親族往來保存儀式和語言。近代加拿大境內的地方社群取得自治與土地協議，但這些制度只涵蓋相關社群，不能代表全族始於協議簽訂之年。',
 '歐洲接觸前已存在，社群延續至今；1492是目錄採樣年，並非建國年',
 '無全族共同首都；歷史聚落及漁場沿育空河分布，包括克朗代克河口、四十哩及今日伊格爾附近',
 '韓語屬阿薩巴斯卡語支；族語名稱Hän與河流有關，地方社群另有自己的名稱。現代亦使用英語；加拿大境內的Tr’ondëk Hwëch’in是其中一個地方社群，不能與全族等同',
 ['十九世紀商站與傳教活動增加對外往來', '1896年後淘金潮侵入克朗代克河口的族人生活空間', '地方社群遷居並透過跨境親族保存歌舞', '1998年加拿大境內一個地方社群簽訂土地及自治協議'],
 [(1896, '克朗代克發現金礦，隨後大量外來者進入相關社群的傳統領域'),
  (1897, '艾薩克領導克朗代克河口的族人遷往穆斯海德，減少淘金城鎮帶來的干擾'),
  (1932, '艾薩克逝世；其保存文化與協商土地的作為成為地方共同記憶'),
  (1993, '穆斯海德舉行近代文化聚會，歌舞與跨境親族往來成為復振重點'),
  (1998, '加拿大境內相關地方社群簽署土地及自治協議；此非全族共同建國'),
  (2023, '與族人及淘金歷史有關的克朗代克文化景觀列入世界遺產')],
 [('艾薩克', '十九至二十世紀初克朗代克河口地方領袖，帶領遷居並維護社群利益'),
  ('珀西・亨利', '地方社群前領袖與長者，參與韓語記錄、教育及文化傳承'),
  ('安吉・約瑟夫－里爾', '地方社群前領袖、韓語教師與語言工作者，推動祖語傳承')],
 '育空河的鮭魚資源、漁營與內陸狩獵路線維持社群生計。淘金潮突然帶來大量外來者，使原有聚落面對土地流失及疾病壓力；領袖選擇遷居、協商並依靠跨境親族，以延續家園和文化生活。',
 '韓族社群的語言教育、文化聚會與地方自治，使淘金史中原住民族的經驗重新受到重視。其親族關係跨越美加國界，現代地方政府與土地協議是歷史延續的一部分，並不取代全族多中心的社會傳統。')

add('p-76cea6e852620aa7', 'Tenetehara (Tembé)', '滕貝族', '300460422', [
 'https://pib.socioambiental.org/en/Povo:Temb%C3%A9',
 'https://www.31rba.abant.org.br/simposio/view?ID_SIMPOSIO=93',
 'https://www.gov.br/povosindigenas/pt-br/assuntos/noticias/2023/06/governo-entrega-titulacao-de-terra-a-indigenas-do-alto-rio-guama',
 'https://www.gov.br/funai/pt-br/assuntos/noticias/2025/funai-garante-protagonismo-indigena-atraves-do-planejamento-de-sustentabilidade-para-posse-plena-da-terra-indigena-alto-rio-guama-no-para'],
 '滕貝族是巴西東部亞馬遜地區的原住民族，自稱Tenetehara，與馬拉尼昂的近親社群具有語言及歷史聯繫。十九世紀部分祖先向帕拉境內河流遷移，逐漸形成今日所稱的西部社群。居民以大家庭和河岸村落組織農耕、漁獵與交換，沒有全族共同王都。商人預付貨物的債務制度、原住民保護站及伐木業先後改變勞動和聚落分布。土地獲法律確認後，非法占用仍引發長期交涉；族人透過跨村結盟、領袖協商及文化教育維護家園。',
 '相關祖先社群早於殖民接觸；今日西部社群的形成與十九世紀遷徙有關，後裔延續至今；1492非建國年',
 '無全族共同首都；村落分布於古魯皮、瓜馬及阿卡拉等河流域，現代原住民族土地各有行政範圍',
 '祖語屬圖皮—瓜拉尼語支，與東部近親社群使用的語言密切相關。Tenetehara是自稱，滕貝為通行外稱；各地葡萄牙語及祖語使用情況不同，不能以單一村落概括全族',
 ['十九世紀中葉部分祖先向帕拉河流域遷移', '商人債務與保護站制度介入家庭勞動', '1945年瓜馬河上游原住民族土地獲劃設', '1993年土地獲正式確認，後續仍持續清除非法占用'],
 [(1845, '巴西帝國建立省級原住民管理制度，後來遷入相關河流域的族人受其管轄'),
  (1861, '古魯皮河上游商人與族人衝突，調查中的暴力及帶走兒童造成村民逃離'),
  (1911, '古魯皮河支流附近設立保護站，部分族人遷近並參與交通及勞動'),
  (1945, '瓜馬河上游劃設原住民族土地；這是土地制度事件，非全族成立'),
  (1983, '瓜馬與古魯皮社群共同反對縮減原住民族土地'),
  (1993, '瓜馬河上游原住民族土地獲巴西政府正式確認'),
  (2023, '聯邦政府推動清除非法占用，並向當地各原住民族交付恢復占有的法律文件')],
 [('韋羅妮卡', '二十世紀古魯皮河地方女性領袖，顯示大家庭與女性在村落權威中的作用'),
  ('費利克斯・滕貝', '瓜馬河上游地方領袖，其生平反映社群土地與政治組織的歷史'),
  ('皮納・滕貝', '地方領袖，參與土地保護及恢復占有後的社群永續規劃')],
 '河流交通、木薯耕作及林產交換維持大家庭生計，村落也隨資源與親族關係分合。商人債務、保護站勞動及移民占地使地方自主受到限制，後來的土地動員則把不同河流社群重新聯繫起來。',
 '滕貝族的跨村協作把文化延續與土地權利結合，使法律承認與實際占有的落差受到關注。女性領袖、家族組織及語言儀式傳承持續形塑社群生活，而現代土地範圍不能倒推為古代單一國界。')

add('p-3abc3a17ca5e426f', 'Imbangala', '因班加拉', '300265292', [
 'https://www.cambridge.org/core/journals/history-in-africa/article/abs/translations-as-sources-for-african-history/A280DFF59613FBB01FDB662D88C1CE1A',
 'https://www.cambridge.org/core/journals/history-in-africa/article/abs/extraordinary-journey-of-the-jaga-through-the-centuries-critical-approaches-to-precolonial-angolan-historical-sources/ECD3355C2514953B6889E40C17BDBD0A',
 'https://www.cambridge.org/core/journals/journal-of-african-history/article/abs/imbangala-and-the-chronology-of-early-central-african-history/B60F2C0615DC5F1E7B92B50135E860F2',
 'https://www.cambridge.org/core/journals/journal-of-african-history/article/abs/legitimacy-and-political-power-queen-njinga-162416631/0A8C82A9E8B34BBF94A7CA12D4A819D1',
 'https://www.cambridge.org/core/journals/history-in-africa/article/abs/rivalry-and-reformation-politics-reflections-on-andrew-battells-jaga-materials-printed-by-samuel-purchas-from-1613-to-1625/1D3E1BF3F3CFC0E351613DBB6216517C'],
 '因班加拉指安哥拉歷史中的軍事社群及其後形成的地方族群，不能視為自古由單一王朝統治的國家。十七世紀早期，不同戰士集團以軍營、領袖與儀式結合成員，透過戰爭、吸納人口及奴隸貿易擴張。部分集團與葡萄牙軍隊合作，也會轉而與其他統治者結盟；其制度影響恩東戈周邊的權力競爭。後來部分社群定居並建立王國，地方認同亦逐步改變。殖民記述常以籠統外稱混稱不同人群，因此須區分戰士組織、後世族群與各個王國的歷史。',
 '十七世紀初已有較明確的軍事社群記錄，後來轉化為不同定居政治及族群組織；1815僅為目錄採樣年',
 '無各集團共同首都；早期以稱為kilombo的軍營為組織中心，定居後的各王國另有王庭',
 '成員透過軍事及儀式組織吸納，出身並不單一；後世安哥拉相關族群使用班圖語言。葡萄牙文記載的Jaga是含混外稱，不能一概當作自稱，也不可直接等同剛果境內的雅卡族',
 ['十七世紀初多個軍事社群在安哥拉活動', '部分集團參與葡萄牙對恩東戈的戰爭', '地方統治者採用或調整相關軍事與儀式制度', '部分社群約於十七世紀前期定居建國，其他集團有不同發展'],
 [(1613, '英國出版物開始刊載巴特爾的相關見聞；這是記述傳播年代，非族群起源'),
  (1617, '葡萄牙總督瓦斯孔塞洛斯任期開始，其對恩東戈戰爭使用相關戰士集團'),
  (1621, '瓦斯孔塞洛斯任期結束；先前戰爭及掠奪已大幅改變恩東戈人口和權力關係'),
  (1624, '恩津加成為恩東戈統治者，其後在戰爭與結盟中採用相關組織方式'),
  (1630, '約此前後，部分因班加拉集團建立定居王國；各集團歷程不可一概而論'),
  (1663, '恩津加逝世；其政治生涯呈現相關制度與地方王權相互結合的歷程')],
 [('庫拉申戈', '十七世紀早期相關軍事領袖，其活動與後來定居王國的形成有關'),
  ('恩津加', '恩東戈及其後馬坦巴的統治者，與相關集團結盟並運用軍事儀式制度；非全體因班加拉之王'),
  ('安德魯・巴特爾', '曾在安哥拉活動的英國人，留下相關軍事社群的見聞；其記述經後人編輯，須審慎解讀')],
 '安哥拉內陸戰爭與大西洋奴隸需求相互牽動，流動軍事組織能吸納不同出身的人口。葡萄牙官員及本地統治者既利用這些力量，也與其衝突；軍營制度因此成為重新組織權力及人口的重要方式。',
 '因班加拉的活動改變安哥拉的戰爭、人口與國家形成，部分制度也在定居王國中延續。殖民文獻留下的混稱及暴力形象影響後世理解，區分各地社群、王國和不同時期的認同，有助避免將多元歷史寫成單一路線。')

add('p-dfe3bf39f96cc851', 'Kryvichs', '克里維奇人', '', [
 'https://rus-ru.ecnu.edu.cn/u/1_1906/57201_1.pdf',
 'https://www.encyclopediaofukraine.com/display.asp?linkpath=pages%5CK%5CR%5CKrivichians.htm',
 'https://warwick.ac.uk/fac/arts/history/students/modules/hi3t4/topics/sourcesi/mythsandfolktales/the_russian_primary_chronicle.pdf',
 'https://dspace.uni.lodz.pl/xmlui/bitstream/handle/11089/41531/405-426_Siwko.pdf?isAllowed=y&sequence=1'],
 '克里維奇人是中世紀早期東斯拉夫諸部落中的一支或部落聯合，活動於第聶伯河、道加瓦河及伏爾加河上游，並與周邊波羅的海及芬蘭語居民接觸。農耕、畜牧、手工業與水路交換構成其生活基礎，地方聚落並未形成一個可確證的共同王都。編年史記述他們與瓦良格人交涉、納貢及參加羅斯遠征，部分早期故事帶有追述色彩。九世紀末以後，相關地域逐漸納入羅斯政治體系，後來分屬不同公國；居民與文化傳統的延續不能簡化為某一年全族滅亡。',
 '約第一千紀中後期形成可辨識的部落社群，九至十二世紀間逐漸納入羅斯諸公國；700為目錄採樣年',
 '無可確證的全體共同首都；重要地方中心包括斯摩稜斯克與波洛茨克，西北部社群亦與普斯科夫地區有關',
 '主要被歸入早期東斯拉夫諸部落，與波羅的海及芬蘭語居民長期接觸。克里維奇是古代記載中的族名，語源與祖先傳說仍有爭論，不能把某一推測當成全體一致的自稱',
 ['九世紀與瓦良格勢力的貢納及結盟關係見於編年史', '九世紀末相關地域逐漸納入羅斯統治網絡', '十世紀族人參與羅斯對君士坦丁堡的軍事行動', '原有地域後來分屬波洛茨克、斯摩稜斯克及諾夫哥羅德等政治中心'],
 [(859, '編年史在此年條下記載瓦良格人向克里維奇等社群徵貢；屬後世追述'),
  (862, '編年史將克里維奇列入迎請瓦良格王公的社群；故事的細節與年代仍有爭議'),
  (882, '編年史記述奧列格率包括克里維奇在內的軍隊南下，並建立新的貢納關係'),
  (907, '編年史列克里維奇為奧列格遠征君士坦丁堡的參與者；戰事敘述須審慎看待'),
  (944, '編年史記述伊戈爾集結包括克里維奇在內的兵力向拜占庭進軍，隨後議和')],
 [('留里克', '編年史迎請王公故事的主要人物；其與克里維奇的關係屬後世記載，非已證實的全族世襲君主'),
  ('奧列格', '羅斯統治者，編年史將克里維奇列入其軍隊及貢納網絡'),
  ('伊戈爾', '羅斯統治者，編年史記述其944年遠征動員克里維奇等社群')],
 '東歐北部的河流與陸間轉運路線聯繫波羅的海和黑海，農村、商人與軍事首領因交換及貢納而互相依存。地方社群與瓦良格勢力的交涉，以及羅斯王公擴張，逐漸改變原有部落認同和權力分布。',
 '克里維奇相關地域成為後來羅斯諸公國及東斯拉夫居民歷史的一部分，其聚落和工藝遺存有助理解河流貿易與地方社會。現代民族形成具有多重歷程，不能把這一中世紀部落名稱直接等同某一現代民族或國家。',
 relations=[{'id':'p-5df92b89902a16be','name':'基輔羅斯'}, {'id':'p-a1e2d29e1aec6d27','name':'波洛茨克公國'}])
rows[-1].update(
 identitySource='https://rus-ru.ecnu.edu.cn/u/1_1906/57201_1.pdf',
 nameBasis='核對華東師範大學《俄羅斯研究》刊物中文用例「克里维奇人（кривичи）」並轉為繁體；歷史身分另對照烏克蘭百科及編年史。',
 note='保留台灣通行地名與繁體字形；古代族名語源不明，不自行宣稱確定的自稱。')
target = ROOT / 'scripts/v21t/batch-69.json'
target.write_text(json.dumps(rows, ensure_ascii=False, indent=2)+'\n')
print(f'{target.relative_to(ROOT)}: {len(rows)} individually authored profiles')
