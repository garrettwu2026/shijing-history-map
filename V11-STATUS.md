# V11 — 時境譯名稽核與年代勘誤

更新：2026-10-28。已先閱讀 V10-STATUS.md。未 commit、未 push。

## 結果與剩餘數量

| 項目（穩定政體 ID 去重） | 數量 |
| --- | ---: |
| V10b 結束時未譯／待考 | 1588 |
| 稽核第 10b 輪 medium | 127 |
| 保留中文（附中文百科／學術用例） | 45 |
| 退回原文，low／untranslated，介面顯示待考 | 82 |
| 本輪新增可靠中文用名 | 3 |
| **剩餘未譯／待考** | **1667** |
| 優先快照聯集待考 ID | 397 |

未譯與待考是同一批 ID，不能相加。總政體 ID 仍為 2997，資料名稱索引仍為 2999。

| 選取年 | 實際快照年 | 政體 ID | 剩餘未譯／待考 |
| --- | --- | ---: | ---: |
| -500 | -500 | 74 | 2 |
| 1 | -1 | 79 | 9 |
| 500 | 500 | 87 | 9 |
| 1000 | 1000 | 129 | 3 |
| 1500 | 1500 | 139 | 2 |
| 1800 | 1800 | 546 | 377 |
| 1900 | 1900 | 165 | 4 |

公元 1 年仍對應最近的公元前 1 年快照。各快照的數量可能重複同一政體。

## 譯名稽核原則

逐筆核對 `scripts/translations-v10-pass2.tsv` 中全部 127 個 medium；完整決策保存在 [name-audit-v11.tsv](scripts/name-audit-v11.tsv)。中文百科及《原教界》學術用例可支持族名／地名；「領地」、方位與括號地名只屬描述性翻譯，不宣稱為民族自稱或國家正式名稱。未找到合格依據者一律保守退回，不等於斷言中文世界絕無該譯名。

原先澳洲旅遊／商務文件、航空公司或畫廊介紹，以及僅能支持英文身分的英文資料，不足以符合本次要求的學術／百科中文用名標準。因此 Darkinung、Gundungurra、Dharug、Tharawal 等退回；Boihaenum 不能等同波希米亞，亦退回原文。既有 `sources` 作歷史來源保留，`translationNote` 明示退回原因，不能將舊來源誤讀為本輪譯名認證。沒有新增自稱。

### 退回原文的 82 筆（全部）

下表每筆最後值均為原名，`confidence: low`、`translationStatus: untranslated`；地圖顯示「原名（待考）」。共通理由為未取得足以支持原中文拼法與原名對應的學術／百科證據；Boihaenum 另有地域誤換問題。

| 原名／退回後值 | 撤回的中文 |
| --- | --- |
| Arrernte | 阿勒倫特族 |
| Anmatyerre | 安馬蒂耶爾族 |
| Wiradjuri | 威拉德朱里族 |
| Pintupi | 賓土比族 |
| Luritja | 路里加族 |
| Pitjantjatjara | 皮詹賈賈拉族 |
| Larrakia | 拉若基亞族 |
| Mardu | 馬爾杜族 |
| Eyaq | 埃雅克族 |
| Eyak | 埃雅克族 |
| Boihaenum | 波希米亞 |
| Guanahatabeyes | 瓜納哈塔貝伊族 |
| Guanahatabey | 瓜納哈塔貝伊族 |
| Mbailundu | 拜倫多王國 |
| Očhéthi Šakówiŋ | 蘇族聯盟 |
| Kiikaapoi (Kickapoo) | 基卡普族 |
| Núu-agha-tʉvʉ-pʉ̱ (Ute) | 猶他族 |
| Wabanaki (Dawnland Confederacy) | 瓦巴納基聯盟 |
| Shawandasse Tula (Shawanwaki/Shawnee) | 肖尼族領地 |
| Kingdom of Syphax | 西法克斯王國 |
| Mvskoke (Muscogee / Creek) | 馬斯科吉族（克里克族） |
| Kryvichs | 克里維奇族 |
| Newe (Western Shoshone) | 西肖肖尼族 |
| Gondwana | 貢德瓦納 |
| Maya Yucateco | 猶加敦馬雅族 |
| Omàmìwininìwag (Algonquin) | 阿爾岡昆族 |
| Diné Bikéyah | 納瓦霍族領地 |
| Yukagir | 尤卡吉爾族 |
| Coast Salish | 海岸薩利希族 |
| Beylik of Aydin | 艾登侯國 |
| Sabirs | 薩比爾族 |
| Nimiipuu (Nez Perce) | 內茲珀斯族 |
| Ndee/Nnēē: (Western Apache) | 西部阿帕契族 |
| Ben 'Zaa/Binnizá/Mén Diiste/Bene Xhon (Zapoteco) | 薩波特克族 |
| Pima | 皮馬族 |
| Chinook | 奇努克族 |
| Wôpanâak (Wampanoag) | 萬帕諾亞格族 |
| Unangam Tanangin (Unangax̂ /Aleut) | 阿留申族領地 |
| Tupinambá | 圖皮南巴族 |
| Onʌyote'a•ka (Oneida) | 奧奈達族 |
| Onöndowa'ga:' (Seneca) | 塞內卡族 |
| Onundagaonoga (Onondaga) | 奧農達加族 |
| Odǫhwęja:deˀ (Cayuga) | 卡尤加族 |
| Kickapoo (Oklahoma) | 基卡普族（奧克拉荷馬） |
| Eastern Shawnee (Oklahoma) | 東部肖尼族（奧克拉荷馬） |
| Cheyenne-Arapaho (Oklahoma) | 夏安族與阿拉帕霍族（奧克拉荷馬） |
| Seneca-Cayuga (Oklahoma) | 塞內卡族與卡尤加族（奧克拉荷馬） |
| Potawatomi-Shawnee (Oklahoma) | 波塔瓦托米族與肖尼族（奧克拉荷馬） |
| Powhatan | 波瓦坦族 |
| Pequot | 佩科特族 |
| Mohegan | 莫希根族 |
| Tuscarora | 塔斯卡洛拉族 |
| Skaruhreh/Tuscarora (North Carolina) | 塔斯卡洛拉族（北卡羅來納） |
| Dënéndeh | 德內族領地 |
| Nunatsiavut | 努納齊亞福特 |
| Kansa | 堪薩族 |
| Mandan | 曼丹族 |
| Arikara | 阿里卡拉族 |
| Mandan, Hidatsa, and Arikara | 曼丹族、希達察族與阿里卡拉族 |
| Ponca | 龐卡族 |
| Ponca (Oklahoma) | 龐卡族（奧克拉荷馬） |
| Teton | 提頓蘇族 |
| Oglala | 奧格拉拉族 |
| Chumash | 丘馬什族 |
| Miwok | 米沃克族 |
| Klamath | 克拉馬斯族 |
| Yurok | 尤羅克族 |
| Dharug | 達魯格族 |
| Gundungurra | 貢敦古拉族 |
| Darkinung | 達金容族 |
| Tharawal | 薩拉瓦爾族 |
| Gros Ventre | 格羅範特族 |
| Miami | 邁阿密族 |
| Miami (Oklahoma) | 邁阿密族（奧克拉荷馬） |
| Fox | 美斯夸基族 |
| Meškwahki·aša·hina (Fox) | 美斯夸基族 |
| Narragansett | 納拉甘西特族 |
| Wiyot | 維約特族 |
| Piscataway | 皮斯卡塔威族 |
| Nentego (Nanticoke) | 南蒂科克族 |
| Lumbee | 拉姆畢族 |
| Yokuts | 約庫特族 |

### 保留中文的 45 筆（全部）

每筆均補入下列中文百科或學術來源；描述性修飾不等同認證原生文字自稱。全數保留 medium，沒有因找到百科頁面就提高信心。

| 原名 | 保留中文 | 中文用名依據 |
| --- | --- | --- |
| Michif Piyii (Métis) | 梅蒂族領地 | [中文用例](https://zh.wikipedia.org/wiki/梅蒂人) |
| Tekohá (Guarani) | 瓜拉尼族領地 | [中文用例](https://zh.wikipedia.org/wiki/瓜拉尼人) |
| Wallmapu (Mapuche) | 馬普切族領地 | [中文用例](https://zh.wikipedia.org/wiki/馬普切人) |
| Niitsítpiis-stahkoii ᖹᐟᒧᐧᐨᑯᐧ ᓴᐦᖾᐟ (Blackfoot / Niitsítapi ᖹᐟᒧᐧᒣᑯ) | 黑腳族領地 | [中文用例](https://zh.wikipedia.org/wiki/黑腳聯盟) |
| Nʉmʉnʉʉ (Comanche) | 科曼奇族 | [中文用例](https://zh.wikipedia.org/wiki/科曼奇人) |
| Apsaalooké (Crow) | 克羅族 | [中文用例](https://zh.wikipedia.org/wiki/克羅族) |
| ᏣᎳᎫᏪᏘᏱ Tsalaguwetiyi (Cherokee, East) | 東部切羅基族領地 | [中文用例](https://zh.wikipedia.org/wiki/文明五部落) |
| [Gáuigú (Kiowa) | 基奧瓦族 | [中文用例](https://alcd-web.s3-ap-northeast-1.amazonaws.com/uploads/2017/12/03/bada8ebc5880cc94605eb00cd81ea0ae.pdf) |
| NWT Métis Nation | 西北地區梅蒂族 | [中文用例](https://zh.wikipedia.org/wiki/梅蒂人) |
| Pâri (Pawnee) | 波尼族 | [中文用例](https://zh.wikipedia.org/wiki/波尼族) |
| Numu (Northern Paiute) | 北派尤特族 | [中文用例](https://zh.wikipedia.org/wiki/派尤特人) |
| Lokono (Arawak) | 阿拉瓦克族 | [中文用例](https://zh.wikipedia.org/wiki/阿拉瓦克人) |
| Nuwuvi (Southern Paiute) | 南派尤特族 | [中文用例](https://zh.wikipedia.org/wiki/派尤特人) |
| Ho-de-no-sau-nee-ga (Haudenosaunee) | 易洛魁聯盟 | [中文用例](https://zh.wikipedia.org/wiki/易洛魁聯盟) |
| Chahta Yakni (Choctaw) | 喬克托族領地 | [中文用例](https://zh.wikipedia.org/wiki/文明五部落) |
| Bodéwadmiakiwen (Potawatomi) | 波塔瓦托米族領地 | [中文用例](https://zh.wikipedia.org/wiki/波塔瓦托米人) |
| Potawatomi | 波塔瓦托米族 | [中文用例](https://zh.wikipedia.org/wiki/波塔瓦托米人) |
| Essequibo | 埃塞奎博 | [中文用例](https://zh.wikipedia.org/wiki/埃塞奎博) |
| Hñähñu (Otomí) | 奧托米族 | [中文用例](https://zh.wikipedia.org/wiki/奧托米人) |
| Otomies | 奧托米族 | [中文用例](https://zh.wikipedia.org/wiki/奧托米人) |
| Menominee | 美諾米尼族 | [中文用例](https://alcd-web.s3-ap-northeast-1.amazonaws.com/uploads/2017/12/03/bada8ebc5880cc94605eb00cd81ea0ae.pdf) |
| Menomini | 美諾米尼族 | [中文用例](https://alcd-web.s3-ap-northeast-1.amazonaws.com/uploads/2017/12/03/bada8ebc5880cc94605eb00cd81ea0ae.pdf) |
| Odawa | 渥太華族 | [中文用例](https://zh.wikipedia.org/wiki/渥太華人) |
| Kanienʼkehá꞉ka (Mohawk) | 莫霍克族 | [中文用例](https://zh.wikipedia.org/wiki/莫霍克人) |
| Nayarit | 納亞里特 | [中文用例](https://zh.wikipedia.org/wiki/納亞里特州) |
| Shiwinna (Zuni) | 祖尼族 | [中文用例](https://zh.wikipedia.org/wiki/祖尼人) |
| Zuni | 祖尼族 | [中文用例](https://zh.wikipedia.org/wiki/祖尼人) |
| Miskito | 米斯基托族 | [中文用例](https://zh.wikipedia.org/wiki/米斯基托人) |
| Hopie | 霍皮族 | [中文用例](https://zh.wikipedia.org/wiki/霍皮族) |
| Mohican | 莫希干族 | [中文用例](https://zh.wikipedia.org/wiki/莫希干人) |
| Mahican | 莫希干族 | [中文用例](https://zh.wikipedia.org/wiki/莫希干人) |
| Umoⁿhoⁿ (Omaha) | 奧馬哈族 | [中文用例](https://alcd-web.s3-ap-northeast-1.amazonaws.com/uploads/2017/12/03/bada8ebc5880cc94605eb00cd81ea0ae.pdf) |
| Omaha | 奧馬哈族 | [中文用例](https://alcd-web.s3-ap-northeast-1.amazonaws.com/uploads/2017/12/03/bada8ebc5880cc94605eb00cd81ea0ae.pdf) |
| Chikashsha Yaki (Chickasaw) | 奇克索族領地 | [中文用例](https://zh.wikipedia.org/wiki/文明五部落) |
| Choctaw (Oklahoma) | 喬克托族（奧克拉荷馬） | [中文用例](https://zh.wikipedia.org/wiki/文明五部落) |
| Chickasaw (Oklahoma) | 奇克索族（奧克拉荷馬） | [中文用例](https://zh.wikipedia.org/wiki/文明五部落) |
| Cherokee (Oklahoma) | 切羅基族（奧克拉荷馬） | [中文用例](https://zh.wikipedia.org/wiki/文明五部落) |
| Pawnee (Oklahoma) | 波尼族（奧克拉荷馬） | [中文用例](https://zh.wikipedia.org/wiki/波尼族) |
| Seminole (Oklahoma) | 塞米諾爾族（奧克拉荷馬） | [中文用例](https://zh.wikipedia.org/wiki/文明五部落) |
| Ottawa (Oklahoma) | 渥太華族（奧克拉荷馬） | [中文用例](https://zh.wikipedia.org/wiki/渥太華人) |
| Lingít Aaní (Tlingit) | 特林吉特族領地 | [中文用例](https://zh.wikipedia.org/wiki/特林吉特人) |
| Nahua | 納瓦族 | [中文用例](https://zh.wikipedia.org/wiki/納瓦人) |
| Nahuas | 納瓦族 | [中文用例](https://zh.wikipedia.org/wiki/納瓦人) |
| Jicarilla | 阿帕契族吉卡里拉群 | [中文用例](https://alcd-web.s3-ap-northeast-1.amazonaws.com/uploads/2017/12/03/bada8ebc5880cc94605eb00cd81ea0ae.pdf) |
| Jicarilla Apache | 阿帕契族吉卡里拉群 | [中文用例](https://alcd-web.s3-ap-northeast-1.amazonaws.com/uploads/2017/12/03/bada8ebc5880cc94605eb00cd81ea0ae.pdf) |

## 優先快照續譯

新增三筆均有已建立的中文用名，但上游拼法的對應屬「原名相似性＋圖徵位置」共同判讀，因此維持 medium；不是原文條目明載上游錯字，亦未改寫上游 NAME 或合併 ID。

| 原名 | 中文 | 查核與限制 |
| --- | --- | --- |
| Peshemegs | 佩切涅格人 | 原名疑為 Pechenegs 異拼／誤拼；1000年圖徵位於黑海北岸至中亞草原（28.93–61.96°E、41.46–52.5°N），依名稱及地理共同判讀，medium；非新增自稱，疆界另待考。 [中文依據](https://zh.wikipedia.org/wiki/佩切涅格人) |
| Tlinoit | 特林吉特人 | 原名疑為 Tlingit／Tlinkit 誤拼；1500年圖徵位於阿拉斯加東南與加拿大西北岸（151.78–128.70°W、55.73–63.33°N），依名稱及地理共同判讀，medium；非新增自稱，疆界另待考。 [中文依據](https://zh.wikipedia.org/wiki/特林吉特人) |
| Dumonii | 頓諾尼亞人 | 原名疑為 Dumnonii 漏字；公元前1年圖徵位於德文郡（4.54–3.13°W、50.22–51.19°N），與百科所述部落相符；使用部落譯名而非後來4–8世紀的同名王國。 [中文依據](https://zh.wikipedia.org/wiki/頓諾尼亞) |

其餘優先待考名稱如 El Paraiso、Glades Culture、Caloosahatchee culture、Fourche Maline Culture、Vishnu-Kundins、Bella、Coqs、Senas、Sultanate of Utetera、Mirambo Unyanyembe Ukimbu、Ato trading confederacy，未因英文考古／王朝資料或相似地名存在而硬造中文音譯；英文指涉與中文通行用名是兩個不同的查核項目。

## 所有快照的年代掃描

掃描全部 **54 個快照**，包括不可由時間軸直接選取的最早三個快照；逐年、逐原名去重後共 10093 組名稱／快照。使用 [chronology-rules-v11.json](scripts/chronology-rules-v11.json) 的 **174 個獨立年代規則**，比對 659 組有規則的名稱／快照，找出 **112 組疑點**：本輪 14 組修名並標疆界待考證、93 組標名稱／疆界待考證，另 5 組由既有蒙古／薩伊爾勘誤覆蓋。

**覆蓋限制：全快照掃描不等於每個標籤均完成歷史認證。** 其餘 9434 組沒有可直接套用的獨立存續期規則，其中包含大量民族、地理區、考古文化及狩獵採集社群；未以快照觀測範圍 `validFrom/validTo` 假冒史實建國／滅亡年代。未命中規則不代表「年代正確」。多義名、鬆散聯盟、約年、殘存政權與殖民地沿用地名都需要人工判讀。規則中標 `reference-unverified` 的參考頁沒有宣稱已逐段完成文獻校勘；因此一般超界只標待考，不擅自改成猜測的政權。

特別處理多義／非連續時期：Mali 同時容納中世紀帝國與 1960 年以後的現代馬利，避免誤標當代國家已滅亡；Chalukya 與法蘭西王國使用分段區間；秦涵蓋秦國與秦朝，不以秦朝建國年誤標戰國秦國。唐的總區間另排除武周時期。起訖年採含端點的年尺度，無法區分年內月份。

500 年南方 `Jin Empire` 圖徵範圍約 99.75–121.85°E、17.66–37.95°N，北方另有 `Toba Wei`（北魏）。南方改為 **南齊（479–502）**，不提前套用 502 年才建立的南梁；其北緣超出可直接認定的南齊疆界，故保留幾何並明確標待考證。`polities.json`／`names.json` 同步修正其中文預設值，原始英文與 `legacyNative: 大金` 僅供追溯並附錯置說明，不作當時自稱。

勘誤使用既有 `errata.overrides` 與 `featureReviews`：地圖以警示虛線描邊；標籤可見「疆界待考證」，未確定替代名稱者直接顯示「年代／疆界待考證」。彈窗依 `nameStatus` 區分「名稱已修正」及「名稱及疆界待考證」，避免將待考誤稱為完成修正。沒有更動任何 GeoJSON 幾何。

### 每一項年代處理（全部，按快照年）

「標待考」表示名稱保留供追溯、加上可見警示；不是認定該政體實際存續到該年。下列所有項目的疆界均待考證。

| 快照年 | 上游名稱 | 最後顯示名稱 | 處理／參考存續期 | 來源 |
| --- | --- | --- | --- | --- |
| -1000 | Chavin | 查文（年代／疆界待考證） | 名稱／疆界待考證；-900–-200 | [參考](https://en.wikipedia.org/wiki/Chavín_culture) |
| -1000 | El Paraiso | El Paraiso（年代／疆界待考證） | 名稱／疆界待考證；-2100–-1400 | [參考](https://en.wikipedia.org/wiki/El_Paraíso,_Peru) |
| -700 | El Paraiso | El Paraiso（年代／疆界待考證） | 名稱／疆界待考證；-2100–-1400 | [參考](https://en.wikipedia.org/wiki/El_Paraíso,_Peru) |
| -500 | El Paraiso | El Paraiso（年代／疆界待考證） | 名稱／疆界待考證；-2100–-1400 | [參考](https://en.wikipedia.org/wiki/El_Paraíso,_Peru) |
| -400 | Xiongnu | 匈奴（年代／疆界待考證） | 名稱／疆界待考證；-209–93 | [參考](https://en.wikipedia.org/wiki/Xiongnu) |
| -300 | Kingdom of Antigonus | 安提柯王國（年代／疆界待考證） | 名稱／疆界待考證；-306–-301 | [參考](https://en.wikipedia.org/wiki/Antigonus_I_Monophthalmus) |
| -300 | Nabatean Kingdom | 納巴泰王國（年代／疆界待考證） | 名稱／疆界待考證；-168–106 | [參考](https://en.wikipedia.org/wiki/Nabataean_Kingdom) |
| -200 | Kingdom of Syphax | Kingdom of Syphax（年代／疆界待考證） | 名稱／疆界待考證；-215–-203 | [參考](https://en.wikipedia.org/wiki/Syphax) |
| -200 | Nabatean Kingdom | 納巴泰王國（年代／疆界待考證） | 名稱／疆界待考證；-168–106 | [參考](https://en.wikipedia.org/wiki/Nabataean_Kingdom) |
| -100 | Chavin | 查文（年代／疆界待考證） | 名稱／疆界待考證；-900–-200 | [參考](https://en.wikipedia.org/wiki/Chavín_culture) |
| -100 | Kushan Empire | 貴霜帝國（年代／疆界待考證） | 名稱／疆界待考證；30–375 | [參考](https://en.wikipedia.org/wiki/Kushan_Empire) |
| -100 | Mauryan Empire | 孔雀帝國（年代／疆界待考證） | 名稱／疆界待考證；-322–-185 | [參考](https://en.wikipedia.org/wiki/Mauryan_Empire) |
| -1 | Axum | 阿克蘇姆（年代／疆界待考證） | 名稱／疆界待考證；100–960 | [參考](https://en.wikipedia.org/wiki/Kingdom_of_Aksum) |
| 300 | Gupta Empire | 笈多帝國（年代／疆界待考證） | 名稱／疆界待考證；320–550 | [參考](https://en.wikipedia.org/wiki/Gupta_Empire) |
| 300 | Han Zhao | 漢趙（年代／疆界待考證） | 名稱／疆界待考證；304–329 | [參考](https://dict.revised.moe.edu.tw/appendix.jsp?ID=21&la=0&powerMode=0) |
| 300 | Parthian Empire | 安息帝國（年代／疆界待考證） | 名稱／疆界待考證；-247–224 | [參考](https://en.wikipedia.org/wiki/Parthian_Empire) |
| 400 | Meroe | 麥羅埃（年代／疆界待考證） | 名稱／疆界待考證；-590–350 | [參考](https://en.wikipedia.org/wiki/Kingdom_of_Kush) |
| 500 | Jin Empire | 南齊 | 名稱修正＋疆界待考證；1115–1234 | [參考](https://zh.wikipedia.org/wiki/南齐) |
| 500 | Poverty point culture | 波弗蒂角文化（年代／疆界待考證） | 名稱／疆界待考證；-1700–-1100 | [參考](https://en.wikipedia.org/wiki/Poverty_Point_culture) |
| 500 | Tuʻi Tonga Empire | 東加帝國（年代／疆界待考證） | 名稱／疆界待考證；950–1865 | [參考](https://en.wikipedia.org/wiki/Tuʻi_Tonga_Empire) |
| 500 | Western Roman Empire | 西羅馬帝國（年代／疆界待考證） | 名稱／疆界待考證；395–476 | [參考](https://en.wikipedia.org/wiki/Western_Roman_Empire) |
| 600 | Funan | 扶南（年代／疆界待考證） | 名稱／疆界待考證；50–550 | [參考](https://en.wikipedia.org/wiki/Funan) |
| 600 | Tuʻi Tonga Empire | 東加帝國（年代／疆界待考證） | 名稱／疆界待考證；950–1865 | [參考](https://en.wikipedia.org/wiki/Tuʻi_Tonga_Empire) |
| 700 | Georgian Kingdom | 喬治亞王國（年代／疆界待考證） | 名稱／疆界待考證；1008–1490 | [參考](https://en.wikipedia.org/wiki/Kingdom_of_Georgia) |
| 700 | Koguryo | 高句麗（年代／疆界待考證） | 名稱／疆界待考證；-37–668 | [參考](https://en.wikipedia.org/wiki/Goguryeo) |
| 700 | Paekche | 百濟（年代／疆界待考證） | 名稱／疆界待考證；-18–660 | [參考](https://en.wikipedia.org/wiki/Baekje) |
| 700 | Sasanian Empire | 薩珊帝國（年代／疆界待考證） | 名稱／疆界待考證；224–651 | [參考](https://en.wikipedia.org/wiki/Sasanian_Empire) |
| 700 | Sui Empire | 武周 | 名稱修正＋疆界待考證；581–618 | [參考](https://zh.wikipedia.org/wiki/武周) |
| 800 | Toltec Empire | 托爾特克文明（年代／疆界待考證） | 名稱／疆界待考證；900–1150 | [參考](https://en.wikipedia.org/wiki/Toltec_Empire) |
| 900 | Carolingian Empire | 加洛林帝國（年代／疆界待考證） | 名稱／疆界待考證；800–888 | [參考](https://en.wikipedia.org/wiki/Carolingian_Empire) |
| 900 | Tibetan Empire | 吐蕃（年代／疆界待考證） | 名稱／疆界待考證；618–842 | [參考](https://en.wikipedia.org/wiki/Tibetan_Empire) |
| 1000 | Denmark-Norway | 丹麥－挪威（年代／疆界待考證） | 名稱／疆界待考證；1380–1814 | [參考](https://en.wikipedia.org/wiki/Denmark–Norway) |
| 1000 | Great Zimbabwe | 大辛巴威（年代／疆界待考證） | 名稱／疆界待考證；1100–1450 | [參考](https://en.wikipedia.org/wiki/Great_Zimbabwe) |
| 1000 | Kingdom of Georgia | 喬治亞王國（年代／疆界待考證） | 名稱／疆界待考證；1008–1490 | [參考](https://en.wikipedia.org/wiki/Kingdom_of_Georgia) |
| 1000 | Mali | 馬利（年代／疆界待考證） | 名稱／疆界待考證；1235–1670 | [參考](https://en.wikipedia.org/wiki/Mali_Empire) |
| 1000 | Merina Kingdom | 梅里納王國（年代／疆界待考證） | 名稱／疆界待考證；1540–1897 | [參考](https://en.wikipedia.org/wiki/Merina_Kingdom) |
| 1000 | Nan Chao | 南詔（年代／疆界待考證） | 名稱／疆界待考證；738–902 | [參考](https://en.wikipedia.org/wiki/Nanzhao) |
| 1000 | Xixia | 西夏（年代／疆界待考證） | 名稱／疆界待考證；1038–1227 | [參考](https://en.wikipedia.org/wiki/Western_Xia) |
| 1100 | Duchy of Benevento | 貝內文托公國（年代／疆界待考證） | 名稱／疆界待考證；571–1077 | [參考](https://en.wikipedia.org/wiki/Duchy_of_Benevento) |
| 1100 | Huari Empire | 瓦里帝國（年代／疆界待考證） | 名稱／疆界待考證；600–1000 | [參考](https://en.wikipedia.org/wiki/Wari_culture) |
| 1100 | Kingdom of Sukhotai | 素可泰王國（年代／疆界待考證） | 名稱／疆界待考證；1238–1438 | [參考](https://en.wikipedia.org/wiki/Sukhothai_Kingdom) |
| 1100 | Mali | 馬利（年代／疆界待考證） | 名稱／疆界待考證；1235–1670 | [參考](https://en.wikipedia.org/wiki/Mali_Empire) |
| 1100 | Merina Kingdom | 梅里納王國（年代／疆界待考證） | 名稱／疆界待考證；1540–1897 | [參考](https://en.wikipedia.org/wiki/Merina_Kingdom) |
| 1100 | Nan Chao | 南詔（年代／疆界待考證） | 名稱／疆界待考證；738–902 | [參考](https://en.wikipedia.org/wiki/Nanzhao) |
| 1100 | Tiahuanaco Empire | 蒂瓦納庫文化（年代／疆界待考證） | 名稱／疆界待考證；500–1000 | [參考](https://en.wikipedia.org/wiki/Tiwanaku) |
| 1200 | Buyid dynasty | 白益王朝（年代／疆界待考證） | 名稱／疆界待考證；934–1062 | [參考](https://en.wikipedia.org/wiki/Buyid_dynasty) |
| 1200 | Duchy of Benevento | 貝內文托公國（年代／疆界待考證） | 名稱／疆界待考證；571–1077 | [參考](https://en.wikipedia.org/wiki/Duchy_of_Benevento) |
| 1200 | Fatimid Caliphate | 法蒂瑪哈里發國（年代／疆界待考證） | 名稱／疆界待考證；909–1171 | [參考](https://en.wikipedia.org/wiki/Fatimid_Caliphate) |
| 1200 | Ghaznavid Emirate | 加茲尼王朝（年代／疆界待考證） | 名稱／疆界待考證；977–1186 | [參考](https://en.wikipedia.org/wiki/Ghaznavids) |
| 1200 | Huari Empire | 瓦里帝國（年代／疆界待考證） | 名稱／疆界待考證；600–1000 | [參考](https://en.wikipedia.org/wiki/Wari_culture) |
| 1200 | Liao | 遼（年代／疆界待考證） | 名稱／疆界待考證；916–1125 | [參考](https://en.wikipedia.org/wiki/Liao_dynasty) |
| 1200 | Mali | 馬利（年代／疆界待考證） | 名稱／疆界待考證；1235–1670 | [參考](https://en.wikipedia.org/wiki/Mali_Empire) |
| 1200 | Merina Kingdom | 梅里納王國（年代／疆界待考證） | 名稱／疆界待考證；1540–1897 | [參考](https://en.wikipedia.org/wiki/Merina_Kingdom) |
| 1200 | Mongol Empire | 蒙古各部 | 既有勘誤覆蓋；1206–1368 | [參考](https://royalarmouries.org/objects-and-stories/stories/the-mongols/rise-of-the-mongols) |
| 1200 | Nan Chao | 南詔（年代／疆界待考證） | 名稱／疆界待考證；738–902 | [參考](https://en.wikipedia.org/wiki/Nanzhao) |
| 1200 | Sultanate of Delhi | 德里蘇丹國（年代／疆界待考證） | 名稱／疆界待考證；1206–1526 | [參考](https://en.wikipedia.org/wiki/Delhi_Sultanate) |
| 1200 | Tiahuanaco Empire | 蒂瓦納庫文化（年代／疆界待考證） | 名稱／疆界待考證；500–1000 | [參考](https://en.wikipedia.org/wiki/Tiwanaku) |
| 1200 | Toltec Empire | 托爾特克文明（年代／疆界待考證） | 名稱／疆界待考證；900–1150 | [參考](https://en.wikipedia.org/wiki/Toltec_Empire) |
| 1279 | Aceh | 亞齊（年代／疆界待考證） | 名稱／疆界待考證；1496–1903 | [參考](https://en.wikipedia.org/wiki/Aceh_Sultanate) |
| 1279 | Merina Kingdom | 梅里納王國（年代／疆界待考證） | 名稱／疆界待考證；1540–1897 | [參考](https://en.wikipedia.org/wiki/Merina_Kingdom) |
| 1300 | Aceh | 亞齊（年代／疆界待考證） | 名稱／疆界待考證；1496–1903 | [參考](https://en.wikipedia.org/wiki/Aceh_Sultanate) |
| 1300 | Chola Empire | 朱羅帝國（年代／疆界待考證） | 名稱／疆界待考證；848–1279 | [參考](https://en.wikipedia.org/wiki/Chola_dynasty) |
| 1300 | Merina Kingdom | 梅里納王國（年代／疆界待考證） | 名稱／疆界待考證；1540–1897 | [參考](https://en.wikipedia.org/wiki/Merina_Kingdom) |
| 1400 | Aceh | 亞齊（年代／疆界待考證） | 名稱／疆界待考證；1496–1903 | [參考](https://en.wikipedia.org/wiki/Aceh_Sultanate) |
| 1400 | Chola Empire | 朱羅帝國（年代／疆界待考證） | 名稱／疆界待考證；848–1279 | [參考](https://en.wikipedia.org/wiki/Chola_dynasty) |
| 1400 | Merina Kingdom | 梅里納王國（年代／疆界待考證） | 名稱／疆界待考證；1540–1897 | [參考](https://en.wikipedia.org/wiki/Merina_Kingdom) |
| 1400 | Srivijaya Empire | 室利佛逝帝國（年代／疆界待考證） | 名稱／疆界待考證；650–1377 | [參考](https://en.wikipedia.org/wiki/Srivijaya) |
| 1492 | Aceh | 亞齊（年代／疆界待考證） | 名稱／疆界待考證；1496–1903 | [參考](https://en.wikipedia.org/wiki/Aceh_Sultanate) |
| 1492 | Funj | 豐吉（年代／疆界待考證） | 名稱／疆界待考證；1504–1821 | [參考](https://en.wikipedia.org/wiki/Funj_Sultanate) |
| 1492 | Golkonda | 戈爾康達（年代／疆界待考證） | 名稱／疆界待考證；1518–1687 | [參考](https://en.wikipedia.org/wiki/Qutb_Shahi_dynasty) |
| 1492 | Kō Hawaiʻi Paeʻāina (Hawaiian Kingdom) | 夏威夷諸酋邦 | 名稱修正＋疆界待考證；1795–1893 | [參考](https://zh.wikipedia.org/wiki/夏威夷王國) |
| 1492 | Merina Kingdom | 梅里納王國（年代／疆界待考證） | 名稱／疆界待考證；1540–1897 | [參考](https://en.wikipedia.org/wiki/Merina_Kingdom) |
| 1500 | Funj | 豐吉（年代／疆界待考證） | 名稱／疆界待考證；1504–1821 | [參考](https://en.wikipedia.org/wiki/Funj_Sultanate) |
| 1500 | Golkonda | 戈爾康達（年代／疆界待考證） | 名稱／疆界待考證；1518–1687 | [參考](https://en.wikipedia.org/wiki/Qutb_Shahi_dynasty) |
| 1500 | Merina Kingdom | 梅里納王國（年代／疆界待考證） | 名稱／疆界待考證；1540–1897 | [參考](https://en.wikipedia.org/wiki/Merina_Kingdom) |
| 1530 | Malacca | 麻六甲（年代／疆界待考證） | 名稱／疆界待考證；1400–1511 | [參考](https://en.wikipedia.org/wiki/Malacca_Sultanate) |
| 1530 | Merina Kingdom | 梅里納王國（年代／疆界待考證） | 名稱／疆界待考證；1540–1897 | [參考](https://en.wikipedia.org/wiki/Merina_Kingdom) |
| 1600 | Inca Empire | 印加帝國（年代／疆界待考證） | 名稱／疆界待考證；1438–1572 | [參考](https://en.wikipedia.org/wiki/Inca_Empire) |
| 1600 | Malacca | 麻六甲（年代／疆界待考證） | 名稱／疆界待考證；1400–1511 | [參考](https://en.wikipedia.org/wiki/Malacca_Sultanate) |
| 1650 | Ahmadnagar | 艾哈邁德訥格爾（年代／疆界待考證） | 名稱／疆界待考證；1490–1636 | [參考](https://en.wikipedia.org/wiki/Ahmadnagar_Sultanate) |
| 1650 | Austrian Empire | 哈布斯堡君主國 | 名稱修正＋疆界待考證；1804–1867 | [參考](https://zh.wikipedia.org/wiki/哈布斯堡君主國) |
| 1650 | Bidar | 比達爾（年代／疆界待考證） | 名稱／疆界待考證；1492–1619 | [參考](https://en.wikipedia.org/wiki/Bidar_Sultanate) |
| 1650 | Vijayanagara | 毗奢耶那伽羅（年代／疆界待考證） | 名稱／疆界待考證；1336–1646 | [參考](https://en.wikipedia.org/wiki/Vijayanagara_Empire) |
| 1700 | Austrian Empire | 哈布斯堡君主國 | 名稱修正＋疆界待考證；1804–1867 | [參考](https://zh.wikipedia.org/wiki/哈布斯堡君主國) |
| 1700 | Mali | 馬利（年代／疆界待考證） | 名稱／疆界待考證；1235–1670 | [參考](https://en.wikipedia.org/wiki/Mali_Empire) |
| 1715 | Austrian Empire | 哈布斯堡君主國 | 名稱修正＋疆界待考證；1804–1867 | [參考](https://zh.wikipedia.org/wiki/哈布斯堡君主國) |
| 1715 | Mali | 馬利（年代／疆界待考證） | 名稱／疆界待考證；1235–1670 | [參考](https://en.wikipedia.org/wiki/Mali_Empire) |
| 1783 | Austrian Empire | 哈布斯堡君主國 | 名稱修正＋疆界待考證；1804–1867 | [參考](https://zh.wikipedia.org/wiki/哈布斯堡君主國) |
| 1783 | Kingdom of the Two Sicilies | 兩西西里王國（年代／疆界待考證） | 名稱／疆界待考證；1816–1861 | [參考](https://en.wikipedia.org/wiki/Kingdom_of_the_Two_Sicilies) |
| 1800 | Austrian Empire | 哈布斯堡君主國 | 名稱修正＋疆界待考證；1804–1867 | [參考](https://zh.wikipedia.org/wiki/哈布斯堡君主國) |
| 1800 | Kingdom of the Two Sicilies | 兩西西里王國（年代／疆界待考證） | 名稱／疆界待考證；1816–1861 | [參考](https://en.wikipedia.org/wiki/Kingdom_of_the_Two_Sicilies) |
| 1815 | Kingdom of the Two Sicilies | 兩西西里王國（年代／疆界待考證） | 名稱／疆界待考證；1816–1861 | [參考](https://en.wikipedia.org/wiki/Kingdom_of_the_Two_Sicilies) |
| 1878 | Kingdom of Brazil | 巴西帝國 | 名稱修正＋疆界待考證；1815–1822 | [參考](https://zh.wikipedia.org/wiki/巴西帝國) |
| 1880 | Kingdom of Brazil | 巴西帝國 | 名稱修正＋疆界待考證；1815–1822 | [參考](https://zh.wikipedia.org/wiki/巴西帝國) |
| 1900 | First Samori Empire | 第一薩莫里帝國（年代／疆界待考證） | 名稱／疆界待考證；1878–1893 | [參考](https://en.wikipedia.org/wiki/Samori_Ture) |
| 1900 | Kingdom of Brazil | 巴西共和國 | 名稱修正＋疆界待考證；1815–1822 | [參考](https://zh.wikipedia.org/wiki/巴西第一共和國) |
| 1900 | Kingdom of Hawaii | 夏威夷領地（美屬） | 名稱修正＋疆界待考證；1795–1893 | [參考](https://zh.wikipedia.org/wiki/夏威夷領地) |
| 1900 | Second Samori Empire | 第二薩莫里帝國（年代／疆界待考證） | 名稱／疆界待考證；1893–1898 | [參考](https://en.wikipedia.org/wiki/Samori_Ture) |
| 1900 | Tukular Caliphate | 圖庫勒哈里發國（年代／疆界待考證） | 名稱／疆界待考證；1848–1893 | [參考](https://en.wikipedia.org/wiki/Toucouleur_Empire) |
| 1914 | Manchu Empire | 中華民國 | 名稱修正＋疆界待考證；1636–1912 | [參考](https://zh.wikipedia.org/wiki/中華民國大陸時期) |
| 1920 | Tanzania, United Republic of | 坦尚尼亞（年代／疆界待考證） | 名稱／疆界待考證；1964–2026 | [參考](https://en.wikipedia.org/wiki/Tanzania) |
| 1930 | Tanzania, United Republic of | 坦尚尼亞（年代／疆界待考證） | 名稱／疆界待考證；1964–2026 | [參考](https://en.wikipedia.org/wiki/Tanzania) |
| 1930 | United Kingdom of Great Britain and Ireland | 大不列顛暨北愛爾蘭聯合王國 | 名稱修正＋疆界待考證；1801–1922 | [參考](https://zh.wikipedia.org/wiki/英国) |
| 1938 | Tanzania, United Republic of | 坦尚尼亞（年代／疆界待考證） | 名稱／疆界待考證；1964–2026 | [參考](https://en.wikipedia.org/wiki/Tanzania) |
| 1945 | Central African Republic | 中非共和國（年代／疆界待考證） | 名稱／疆界待考證；1960–2026 | [參考](https://en.wikipedia.org/wiki/Central_African_Republic) |
| 1945 | Mali | 馬利（年代／疆界待考證） | 名稱／疆界待考證；1235–1670 | [參考](https://en.wikipedia.org/wiki/Mali_Empire) |
| 1945 | Tanzania, United Republic of | 坦尚尼亞（年代／疆界待考證） | 名稱／疆界待考證；1964–2026 | [參考](https://en.wikipedia.org/wiki/Tanzania) |
| 1945 | Zaire | 比屬剛果 | 既有勘誤覆蓋；1971–1997 | [參考](https://www.larousse.fr/encyclopedie/pays/République_démocratique_du_Congo/114374) |
| 1960 | Tanzania, United Republic of | 坦尚尼亞（年代／疆界待考證） | 名稱／疆界待考證；1964–2026 | [參考](https://en.wikipedia.org/wiki/Tanzania) |
| 1960 | Zaire | 剛果共和國（利奧波德維爾） | 既有勘誤覆蓋；1971–1997 | [參考](https://www.larousse.fr/encyclopedie/pays/République_démocratique_du_Congo/114374) |
| 2000 | Zaire | 剛果民主共和國 | 既有勘誤覆蓋；1971–1997 | [參考](https://www.larousse.fr/encyclopedie/pays/République_démocratique_du_Congo/114374) |
| 2010 | Zaire | 剛果民主共和國 | 既有勘誤覆蓋；1971–1997 | [參考](https://www.larousse.fr/encyclopedie/pays/République_démocratique_du_Congo/114374) |

## 重現、驗證與保留事項

```sh
python3 scripts/audit-v11.py
python3 scripts/audit-v11.py --check
python3 scripts/build-static.py
npm run validate
# 已有 http://localhost:8000 提供專案根目錄時：
npm run test:browser
node scripts/verify-snapshots-v7.cjs
node scripts/verify-v11.cjs
```

- 明細產物：`artifacts/v11-audit.json`（統計、全部年代疑點）與 `artifacts/v11-chronology-inventory.json`（全快照名稱清單，未有規則的條目明列 null）。沿用 artifacts 忽略規則，可由稽核腳本重建。
- 建置成功：58 個指紋 JSON 資產、54 個快照 URL；`npm run validate` 全通過（內容、880 個事件、V3 身分、靜態指紋與發布設定）。
- 現有 `npm run test:browser` 通過：1440×900、390×844、320×568，搜尋／彈窗、鍵盤、44px 控制、重試、Worker 恢復；零頁面錯誤。
- 現有 `verify-snapshots-v7.cjs` 通過全部 51 個可選快照；其餘三個早期快照仍已納入 Python 資料掃描。
- 新增 `verify-v11.cjs` 通過：500 年南齊標籤與疆界警示、700 年武周、1000 年梅里納待考、1800 年 Darkinung 原文譯名待考、1900 年巴西共和國；並檢查待考彈窗不宣稱名稱已修正。
- 重跑 SHA-256 一致；重跑舊 V10 翻譯腳本後資料亦不變。舊腳本已讀取 V11 否決名單，不能重新套回已撤銷音譯；V10-STATUS.md 與舊 TSV 留作歷史紀錄，最新數量以本報告為準。
- 與 HEAD 比對，所有穩定 ID、名稱索引、datasetNames、自稱、legacyNative、觀測年代、periods、實體類型保持不變；未改 GeoJSON、事件、原生文字或疆界座標。新中文索引項目沒有新增自稱。
- 未 commit、未 push。174 個規則不構成完整世界歷史年代庫；尚未解決的翻譯與年代疑點均保留可追溯狀態。
