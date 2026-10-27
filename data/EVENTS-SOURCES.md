# 事件資料編輯說明（v2）

880 件事件為人工編寫的繁體中文摘要，未由日期序列、王朝名稱組合或隨機規則產生事實。`events-original.json` 保存既有 191 件事件及經校訂的分類；`events-additions.tsv` 收錄新增 689 件；`event-places.tsv` 為相關地點座標，`event-locations.json` 優先覆寫具名戰場、遺址與發射場的位置。執行 `python3 scripts/expand-events.py` 可重建 `events.json`。

## 年代與位置

- 時段採左閉右開：[-5000,-1000)、[-1000,500)、[500,1500)、[1500,1900)、[1900,2027)。不設西元 0 年。
- `dateNote: 約` 用於考古文化、工程營造、文字形成等長期過程的代表年份，不能解讀為該年突然發生。具體定年有爭議時在描述說明。
- `dateNote: 傳統` 為傳統紀年；部分標題與描述也明示傳統性質。宗教人物生年、古代建城與日本早期紀年不作無爭議的精確史實。
- 座標指相關遺址、城市、港口或發射場，不是影響範圍。跨區域事件使用其中一個相關地點。
- `region` 是依標記位置整理的六個編輯分區（亞洲、非洲、美洲、大洋洲、歐洲、中東），不是事件影響區域或現代主權判定。
- 六個分類為探索用的單一主題分類；醫學與公共衛生歸科技類、部分災害與體育歸文化類，和平與商業協議可歸探索與貿易。
- 最新邊界快照仍是 2010 年。南蘇丹、克里米亞及其他後續事件**沒有**產生新邊界，也未修改任何 GeoJSON。

## 編輯參考與定年核對

通史與分區查考入口：

- [大都會藝術博物館 Heilbrunn 年表](https://www.metmuseum.org/toah/chronology)：各洲文化、考古分期與藝術史。
- [Smithsonian 美洲原住民博物館：中美洲與加勒比海](https://americanindian.si.edu/exhibitions/infinityofnations/mesoamerica-caribbean.html)：奧爾梅克、特奧蒂瓦坎、馬雅與墨西加文化。
- [耶魯 HRAF 考古傳統目錄](https://hraf.yale.edu/resources/reference/outline-of-archaeological-traditions-oat/)：區域文化分期。注意資料中的 BP 與西元紀年不同。
- [聯合國各會員國](https://www.un.org/en/about-us/member-states)：獨立與加入聯合國為不同日期，不能混用。

本次特別核對的條目與適用範圍：

| 條目 | 來源與定年說明 |
| --- | --- |
| 紐幾內亞濕地農業 | [UNESCO 庫克遺址](https://whc.unesco.org/en/list/887/)：長期濕地農業；堆土耕作與較晚的排水渠不能視為同一時點。 |
| 帕拉卡斯織物 | [Met 館藏說明](https://www.metmuseum.org/art/collection/search/308078)：傳統跨西元前700年至西元200年，約年前600為代表點。 |
| 哈特謝普蘇特稱王 | [埃及文物部](https://egymonuments.gov.eg/monuments/hatshepsut-temple/)：約前1473–1458年，並非前1458年開始在位。 |
| 呂底亞鑄幣 | [以色列中央銀行錢幣展](https://boi.org.il/en/bank-of-israel/education-and-visitors-center/the-currency-exhibit-development-of-money/part2/)：西元前七世紀，資料使用約前650年。 |
| 拉皮塔定居東加 | [PNAS 考古研究](https://doi.org/10.1073/pnas.181335398)：努庫勒卡最早定居約前900–850年，採約前900年。 |
| 拉皮塔定居薩摩亞 | [Mulifanua 放射碳研究](https://www.cambridge.org/core/journals/radiocarbon/article/radiocarbon-determinations-from-the-mulifanua-lapita-site-upolu-western-samoa/8B9D5F36E62589F5B3C26C870F1C90AE)：使用約前900年的代表點，不採過早的前1100年。 |
| 伊博烏庫金屬工藝 | [Met 專文](https://www.metmuseum.org/ko/essays/igbo-ukwu-ca-9th-century)、[近期纖維定年研究](https://link.springer.com/article/10.1007/s10437-022-09502-9)：九世紀定年有爭議，描述保留時段。 |
| 夏威夷定居 | [美國國家公園署](https://www.nps.gov/hale/learn/historyculture/early-hawaiians.htm)：約1000–1200年，不沿用過早的定居假說。 |
| 梅薩維德崖居 | [美國國家公園署](https://www.nps.gov/meve/learn/historyculture/cliff_dwellings_home.htm)：十三世紀前後建築。 |
| 南馬都爾 | [UNESCO](https://whc.unesco.org/en/list/1503)：主要石造宮殿、神廟與住宅建於1200–1500年。 |
| 南蘇丹獨立 | [聯合國會員國說明](https://www.un.org/en/about-us/member-states/south-sudan)：2011年7月9日獨立、7月14日入聯。 |

這是學習導覽資料，不是逐條文獻校勘版。早期考古與宗教傳統的定年須與專業研究交叉閱讀。
