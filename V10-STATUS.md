# V10 政體繁體中文（台灣）譯名

更新：2026-10-28，Pass 2 完成。

| 統計（按穩定政體 ID 去重） | 數量 |
| --- | ---: |
| TASK10 開始時未譯 | 2257 |
| Pass 1 新增 | 522 |
| **Pass 2 本輪新增** | **147** |
| **兩輪累計新增** | **669** |
| **剩餘未譯** | **1588** |
| **剩餘待考** | **1588** |

未譯與待考為同一批 ID，不應相加。本輪 high 20 筆、medium 127 筆；18 筆位於七個優先快照的聯集，其餘 129 筆依最大同年面積、出現快照次數排序處理。優先聯集剩餘 384 筆待考，尚未全部取得可靠中文譯名。本輪先複查優先名單，再處理可確認的大面積名稱；沒有為完成數量而自造音譯。

### 優先快照目前狀態

| 選取年 | 實際快照年 | 政體總數 | Pass 1 待考 | Pass 2 待考 |
| --- | --- | ---: | ---: | ---: |
| 1900 | 1900 | 165 | 4 | 3 |
| 1800 | 1800 | 546 | 379 | 364 |
| 1500 | 1500 | 139 | 3 | 3 |
| 1000 | 1000 | 129 | 4 | 3 |
| 500 | 500 | 87 | 9 | 9 |
| 1 | -1 | 79 | 10 | 9 |
| -500 | -500 | 74 | 2 | 2 |

公元 1 年最近快照仍為公元前 1 年；各快照可能重複計數相同 ID。1900 年未解的 `Sultanate of Utetera`、`Mirambo Unyanyembe Ukimbu`、`Ato trading confederacy`，以及 1500 年的 `Bella`、`Tlinoit`、`Coqs` 等保留原文與 low。考古文化如 `Caloosahatchee culture`、`Fourche Maline Culture`，以及 `Vishnu-Kundins` 尚缺足夠中文用名依據，維持待考。

### 資料與來源

- 新增 `scripts/translations-v10-pass2.tsv`，以 147 個完整原名逐筆對應；40 筆附來源 URL，寫入政體既有 `sources`。其餘採通行族名、既有地名與描述性翻譯，沒有宣稱每筆均有獨立學術文獻。medium 保留專業校訂空間。
- [原民會《原住民族文獻》](https://ihc.cip.gov.tw/EJournal/EJournalCat/728)支持台灣「沃爾皮里族」用稱；[SBS 繁體中文紀錄片介紹](https://www.sbs.com.au/language/chinese/zh-hant/article/audrey-napanangka-navigated-colonial-systems-in-the-central-australian-desert/cp1gv9lek)支持阿勒倫特、安馬蒂耶爾用稱。
- [澳洲政府中文介紹](https://www.austrade.gov.au/content/dam/austrade-assets/global/wip/austrade/documents/exploring-australia-print-version.pdf)支持達魯格、貢敦古拉、達金容、薩拉瓦爾等拼法；採繁體字轉寫並標 medium。
- [台灣原住民族語言研究資料《原教界》](https://alcd-web.s3-ap-northeast-1.amazonaws.com/uploads/2017/12/03/bada8ebc5880cc94605eb00cd81ea0ae.pdf)支持吉卡里拉群、美諾米尼等用稱；[另一篇美國原住民族概況](https://alcd-web.s3-ap-northeast-1.amazonaws.com/uploads/2017/12/03/b21feefd35700914757cc6511bbef2a4.pdf)支持格羅範特、納拉甘西特等用稱。未將語系名稱直接當作所有旗下族群的譯名。
- [拜倫多歷史研究](https://www.scielo.org.za/scielo.php?pid=S0259-01902019000100010&script=sci_arttext)核對 Mbailundu／Bailundo 的對應；[阿爾伯塔大學](https://www.ualberta.ca/en/admissions-programs/online-courses/indigenous-canada/glossary/lesson-8-sovereign-lands.html)核對 Dënéndeh 為德內族領地。中文名稱欄翻譯不等於驗證或新增自稱。
- 完整原名（含原生文字、上游錯字及括號）保留在 `datasetNames` 與索引中；僅更新中文名稱、信心、翻譯狀態與來源。殖民後綴沿用第一輪規則。
- `data/polities.json` 與 `data/names.json` 同步；所有既有 native、自稱、legacyNative 等欄位均保留，未新增自稱。`errata.json` 與 GeoJSON 未改。

### 可重現操作

```sh
python3 scripts/translate-polities-v10.py --rank
python3 scripts/translate-polities-v10.py
npm run build && npm run validate
```

套用腳本同時讀取兩輪 TSV，優先處理預設快照，再按面積、快照次數排序。報告 `artifacts/v10-translations.json` 現在以 `changes` 記錄完整 Pass 2 名單；`translatedThisPass` 為本輪 147，`translatedCumulative` 為原始未譯 2257 減去目前未譯數。Pass 1 的 522 筆保留在下方歷史紀錄。報告每次從資料與人工表重建，不依賴先前被 git 忽略的 artifacts；`artifacts/v10-pending.tsv` 列出全部未解項目的優先標記、估算面積與快照數。

### 本輪 20 例（依處理順位）

| 原名 | 本輪中文 |
| --- | --- |
| Eyaq | 埃雅克族 |
| Wiradjuri | 威拉德朱里族 |
| Mardu | 馬爾杜族 |
| Pintupi | 賓土比族 |
| Arrernte | 阿勒倫特族 |
| Warlpiri | 沃爾皮里族 |
| Mbailundu | 拜倫多王國 |
| Luritja | 路里加族 |
| Boihaenum | 波希米亞 |
| Pitjantjatjara | 皮詹賈賈拉族 |
| Anmatyerre | 安馬蒂耶爾族 |
| Yolngu | 雍古族 |
| Guanahatabeyes | 瓜納哈塔貝伊族 |
| Gundungurra | 貢敦古拉族 |
| Dharug | 達魯格族 |
| Darkinung | 達金容族 |
| Tharawal | 薩拉瓦爾族 |
| Larrakia | 拉若基亞族 |
| Dënéndeh | 德內族領地 |
| Očhéthi Šakówiŋ | 蘇族聯盟 |

### 驗證

- `npm run build && npm run validate` 全部通過：2997 個政體 ID、2999 個資料名稱、880 個事件與 58 個指紋 JSON 資產。
- 以本輪開始時的資料逐欄比對：只變更 147 個原未譯 ID；變更欄位限 zh、confidence、translationStatus、sources。索引、ID、原有欄位集合、自稱與其他中繼資料均保持一致，1588 筆待考資料維持原狀。
- 重跑一致性檢查：兩個資料檔與兩個 artifacts 的 SHA-256 相同。
- 未執行可選瀏覽器測試；未 commit、未 push。

---

## Pass 1 歷史紀錄（以下數字為第一輪結束時）

本次新增 **522** 筆政體 ID 的中文譯名（high 251、medium 271）；原未譯 2257 筆，剩餘未譯 **1735** 筆，剩餘待考 **1735** 筆。未譯與待考是同一批資料，不能相加。統計按穩定政體 ID 去重，不按圖徵或別名計數。

七個優先快照的 649 筆原未譯名稱全部納入處理：247 筆新增譯名，402 筆保留原文待考。其餘快照新增 275 筆。未將不明族群硬造音譯；待考資料維持 `translationStatus: untranslated`、`confidence: low` 與原名，沿用地圖既有的「（待考）」呈現方式，沒有把加上待考文字算成翻譯完成。

| 選取年 | 實際快照年 | 政體總數 | 剩餘待考 |
| --- | --- | --- | --- |
| 1900 | 1900 | 165 | 4 |
| 1800 | 1800 | 546 | 379 |
| 1500 | 1500 | 139 | 3 |
| 1000 | 1000 | 129 | 4 |
| 500 | 500 | 87 | 9 |
| 1 | -1 | 79 | 10 |
| -500 | -500 | 74 | 2 |

公元 1 年最近的是公元前 1 年快照；未將時間區間相交誤當作實際可見快照。每年待考數可能重複同一 ID。1800 年待考項目多為澳洲原住民族；其他待考例有 `Peshemegs`、`Coqs`、`Tlinoit`、`Vishnu-Kundins`，尚不足以確認通行中文名或上游指涉，保留原文。

可重現資料編修：

- `python3 scripts/translate-polities-v10.py`：讀取人工對照表 `scripts/translations-v10.tsv`，先處理優先快照，再按最大同年球面面積、出現快照數排序；面積僅作排序估值，不修改疆界。
- `python3 scripts/translate-polities-v10.py --rank`：唯讀列出未解項目的面積與出現次數，供後續考證。
- 殖民後綴只接受明列的完整括號代碼，配合已知地名，輸出「（英屬）（法屬）（西屬）（葡屬）（荷屬）（德屬）（義屬）（比屬）（美屬）（日屬）（俄屬）（鄂圖曼屬）」等格式。不依名稱片段猜測族群身分，不合併 ID。
- `data/polities.json` 與 `data/names.json` 同步中文欄位。原有自稱、legacyNative、別名、年代、重要性、實體類型均保留；新增舊字典項目的 native 為空，沒有新增自稱。`errata.json` 及全部 GeoJSON 未改。
- 腳本產生 `artifacts/v10-translations.json`（逐筆變更及統計）與 `artifacts/v10-pending.tsv`（全部待考，含優先標記、最大面積與快照次數）。artifacts 沿用專案既有忽略規則；可由腳本重建。TSV 為人工譯名表，不是音譯生成器。

考證抽查與限制：

- [克里米亞汗國：中國政治學會 2025 年會手冊，趙竹成論文摘要](https://politics.thu.edu.tw/upload/politics/news_upload/%E6%9C%83%E8%AD%B0%E6%89%8B%E5%86%8A%E5%AE%9A%E7%A8%BF.pdf)：支持台灣學術用稱。
- [多塞特文化：中國大百科全書](https://www.zgbk.com/ecph/words?ID=760035&SiteID=1&SubID=266932&Type=bkzyb)：支持 Dorset 為文化名稱；轉為繁體。
- [迦畢試國：紀贇，Faxian and the Establishment of Qiufa](https://smallpdfs.buddhistuniversity.net/jiyun_2019_faxian-and-the-establishment-of-quifa.pdf)：文中明列 Kāpiśa／迦畢試國。
- [Satavahanihara：印度考古資料](https://ignca.gov.in/Asi_data/73063.pdf)：為 Satavahana 地區的用稱，據此譯作「沙多婆訶那地區」，不誤造新的王朝名；medium。
- [基馬克汗國](https://zh.wikipedia.org/wiki/基馬克汗國)：核對基馬克／欽察組合用稱；medium。

以上五筆來源 URL 亦寫入對應政體 sources。其餘採通行名稱、既有中文地名及描述性直譯；本次沒有宣稱每筆皆有獨立文獻考證。medium 表示仍可由專業審閱進一步校訂，不等於已驗證自稱。這一輪未完成 1735 筆待考的中文譯名確認。

20 筆新增譯名：

| 原名 | 本次中文 |
| --- | --- |
| central Asian khanates | 中亞諸汗國 |
| Saharan pastoral nomads | 撒哈拉游牧族群 |
| Siberians | 西伯利亞諸族 |
| Viceroyalty of Brazil | 巴西總督轄區 |
| Kingdom of Brazil | 巴西王國 |
| Rupert's Land | 魯珀特地 |
| Proto-Altaic pastoralists | 原始阿爾泰游牧族群 |
| Viceroyalty of New Spain | 新西班牙總督轄區 |
| Viceroyalty of Peru | 祕魯總督轄區 |
| Luisiana | 路易斯安那 |
| Viceroyalty of New Granada | 新格拉納達總督轄區 |
| Kimek-Kipchak khaganate | 基馬克—欽察汗國 |
| Western Australia (UK) | 西澳大利亞（英屬） |
| Hindu kingdoms | 印度教諸王國 |
| Viceroyalty of the Río de la Plata | 拉普拉塔總督轄區 |
| Timurid Emirates | 帖木兒諸酋長國 |
| Dorset | 多塞特文化 |
| Pampas cultures | 潘帕斯文化 |
| Emirate of the White Sheep Turks | 白羊土庫曼酋長國 |
| Rajput kingdoms | 拉傑普特諸王國 |

驗證：

- `npm run build && npm run validate`：全部通過，2997 個政體 ID、2999 個資料名稱、880 個事件及靜態指紋資產驗證成功。
- 與 HEAD 資料逐欄比較：僅 522 個未譯 ID 的名稱、信心、翻譯狀態與部分來源改變；所有 ID、索引、原有欄位集合及自稱資料保持一致。
- 再次執行套用腳本後，兩個資料檔與兩個報告的 SHA-256 完全一致，確認可重跑。
- 未執行可選瀏覽器測試；本次未修改介面程式。未 commit、未 push。
