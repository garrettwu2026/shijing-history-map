# 時境｜世界歷史地圖

無建置步驟的靜態網站。以 Leaflet 呈現歷史疆界、原語名稱與繁體中文世界史事件，適用桌面與手機。

## 執行

在本目錄執行：

```sh
python3 -m http.server 8000
```

瀏覽 <http://localhost:8000>。請透過 HTTP 開啟，直接使用 `file://` 無法讀取 JSON。無需 Node、套件安裝或 API 金鑰。Leaflet 與所有地理資料已存於本機；Google Fonts 為可選網路字型，無網路時使用系統字型。

## 使用

- 拖曳時間軸、輸入年份，或使用時代捷徑。西元前請輸入負數。範圍為 -5000 至 2026，略過西元 0 年。
- 播放／暫停按鈕會以所選的 50、100 或 250 年步幅前進；每個快照載入後才進行下一步，至2026年停止。
- 上方大字為選取年份，旁邊另列實際疆界快照年份。使用「小於或等於選取年」的最近快照；早於最早資料時使用最早快照並註記。資料最新為2010年，因此2026年仍顯示2010年疆界。
- 點選疆域閱讀原語／歷史名稱、臺灣常用譯名、常見別稱與資料集原名。相同名稱的政體使用穩定色彩；顏色沒有現代政治意涵。
- 調整事件範圍（前後25至500年）。點選標記或清單可定位，以六個分類晶片篩選清單及標記，顏色與符號也是圖例。手機使用預設收合的底部面板，點選事件後自動收合。沒有事件時可跳至最近事件。
- 左側按鈕可回到世界視角、切換名稱及事件標記。`?year=1200` 可分享指定年代。

## 檔案與資料

- `index.html`、`style.css`、`app.js`：介面、響應式樣式及互動邏輯。
- `vendor/leaflet/`：Leaflet 1.9.4 與其 BSD-2-Clause 授權。
- `data/world_*.geojson`：以 **curl 實際下載的54份完整上游快照**，包含上游提供的早期史前快照。無需執行下載腳本即可使用。
- `data/snapshots.json`：按年份排序的檔案索引。
- `data/names.json`：以 GeoJSON 的 `NAME` **精確值**為鍵；包含政體、文明或文化區域的名稱。欄位為 `zh`（繁體中文）、`native`（原語文字／歷史慣用名）、`aliases`（常見別稱陣列）、`importance`（標籤優先級，0為一般、8以上為主要政體）。查無字典時顯示資料集原名，彈出視窗會說明。標籤依球面多邊形面積、名稱重要度、縮放級別與實際文字矩形取捨，並避開介面；中文大字、原語小字，別稱僅在彈出視窗；點選任一疆域仍可讀取全部收錄別稱。
- `data/events.json`：880件事件，從西元前5000年至2026年。欄位為 `id`、`year`、`lat`、`lon`、`title`、`description`、`dateNote`。`約`表示近似年代，`傳統`表示傳統紀年。座標是相關地點，例如航太任務使用發射地點，並非事件影響範圍。
- `scripts/download-data.py`：可選的更新腳本，透過 GitHub 檔案清單與 curl 重新下載快照，成功解析後才替換檔案。執行 `python3 scripts/download-data.py`；需連網與 curl，可能受到 GitHub API 流量限制。

## 資料來源與編輯原則

疆界來自 [aourednik/historical-basemaps](https://github.com/aourednik/historical-basemaps)，下載日期2026-10-27。遵循上游 **GPL-3.0**；原始授權收於 `data/LICENSE-historical-basemaps.txt`。陸地底圖使用2010年快照去除內部描邊，不使用現代國界圖磚。介面內保留資料來源連結。

早期文化區域不是現代意義的國家，歷史疆界往往是概略重建。上游本身也註明資料仍在修訂。本站保留上游幾何資料，未在快照之間插值，不推算不存在的精確國界。最新快照不是2026年的政治地圖。

名稱採通行學術或歷史稱呼。跨時代、跨語言的帝國未必有唯一官方自稱；例如「拜占庭帝國」是後世稱呼，因此另列其羅馬自稱。未解讀文字（印度河文明）與沒有可靠自稱的史前文化使用通行名稱，文化區域的英文分類不是宣稱已知其原始語言。別稱名錄為常見名稱的人工整理，無法窮盡所有語言、時代與文獻中的變體。古文字的顯示取決於裝置及字型支援。

事件為人工編輯的全球歷史摘要；古代考古年代以「約」標示，建城傳統與傳說不作確定年代。參考與進一步閱讀：

- [大都會藝術博物館 Heilbrunn 藝術史年表](https://www.metmuseum.org/toah/chronology)：分地區的古代文明與歷史分期。
- [大英百科全書歷史](https://www.britannica.com/browse/World-History)：政體、革命與世界大戰的概述。
- [聯合國歷史](https://www.un.org/en/about-us/history-of-the-un)、[世界人權宣言](https://www.un.org/en/about-us/universal-declaration-of-human-rights)：1945、1948年事件。
- [世界衛生組織疫情時間軸](https://www.who.int/emergencies/diseases/novel-coronavirus-2019/interactive-timeline)：2019–2020年事件。
- [大阪關西世博官方概述](https://www.expo2025.or.jp/en/overview/)：2025年事件。
- [國家發展委員會檔案管理局](https://www.archives.gov.tw/)：臺灣歷史檔案與近現代史資料。

## 事件資料分布與驗證

事件的可重建來源、編輯規則與查考連結見 [EVENTS-SOURCES.md](data/EVENTS-SOURCES.md)。

| 時代（左閉右開） | 件數 |
| --- | ---: |
| 西元前5000–前1000 | 80 |
| 西元前1000–西元500 | 150 |
| 500–1500 | 200 |
| 1500–1900 | 250 |
| 1900–當代 | 200 |
| 合計 | 880 |

編輯分區：亞洲291、非洲121、美洲128、大洋洲35、歐洲204、中東101。歐洲約占23.2%；各時代並非強制六區等量，避免為配額杜撰早期事件。

Chrome headless：桌面1440×900與手機390×844，在-5000、-100、200、1200、1300、1700、2011、2026年實際載入與繪製。驗證分類開關、事件定位與彈窗、標記與名稱開關、關於視窗、播放暫停、手機面板，無JavaScript或console錯誤、無水平溢出。報告與截圖存於 [artifacts](artifacts/)。2011及2026年仍明示2010年疆界限制。

```sh
python3 scripts/expand-events.py
python3 scripts/validate-events.py
node --check app.js
python3 -m http.server 8000
# 另一個終端，需已安裝 Playwright（僅驗證用，網站無此相依）
node scripts/verify-browser.cjs
```

若Playwright不在本專案，可設定 `NODE_PATH=/path/to/node_modules`。瀏覽器腳本使用 `/usr/bin/google-chrome`。


## v3 實作與目前限制

完整交付紀錄與待考證項目見 [V3-STATUS.md](V3-STATUS.md)。v3 使用 `data/polities.json` 的穩定 ID 索引；舊 `names.json` 僅保留作為遷移輸入。`validFrom/validTo` 表示資料集中觀察到的快照年代，不等同歷史上的建國／滅亡日期；`periods`、`endonyms` 各有獨立有效年代。未知中文保留資料集名稱並標記 low/untranslated，沒有偽造中文譯名或自稱。

事件 `id` 由 `event-id-registry.json` 固定，新增事件採內容衍生 ID；既有 ID 不因排序改變。`sourceStatus: research-link-unverified` 只是查考入口，**不是已核實的逐筆史料**；`chronologyStatus` 說明起訖是否已複核。所有單年事件暫以同年起訖，長期過程仍待人工編輯。

```sh
python3 scripts/validate-events.py
python3 scripts/validate-v3.py
node --check app.js
# 啟動 8000 HTTP server 後
NODE_PATH=/path/to/node_modules node scripts/verify-browser.cjs
BASE_URL=http://localhost:8000 NODE_PATH=/path/to/node_modules node scripts/verify-performance.cjs
NODE_PATH=/path/to/node_modules node scripts/verify-v3.cjs
python3 scripts/build-static.py
```

Render Blueprint 使用 static runtime、main 分支、`autoDeployTrigger: commit`（[官方規格](https://render.com/docs/blueprint-spec)）。發布內容只包含 `dist/` 公開資產；資料輸出為每檔 SHA-256 前16碼雜湊檔名（疆界改為 `.json`），manifest 與底圖 URL 同步重寫。資料採一年 immutable 快取；HTML、app.js 與 data-worker.js 為 no-cache；資料使用 application/json 以支援 CDN 壓縮。可用 `SITE_URL` 指定正式站點完整網址，建置時會補上絕對分享圖網址與 canonical。此輪未連接 Render 帳號或部署，正式環境回應標頭仍需部署後驗證。

1492 簡化需 Shapely：`python3 scripts/simplify-1492.py`。以 NAME 分組、保留各多邊形部分，0.12°拓撲保留簡化，再取座標小數3位；細節精度降低，不能作精密疆界研究。新分享圖使用本地疆界幾何繪製，延續原資料 GPL-3.0 來源。

時間控制列預設收合為「年份、滑桿、播放、設定」，桌機與手機實測高度皆為62px。「設定」可展開年份輸入、快照與年代差異說明、刻度、播放步幅及時代捷徑，保留既有功能。

空名稱區域以幾何範圍辨識：逐一檢查54份快照：53份包含橫跨全球經度、延伸至南極點且完全位於南緯60度以南的南極洲；1945與1960年有名稱，1492年混在未命名的多重多邊形中，於Worker拆分後辨識；前5000年缺少該輪廓，補用底圖的南極洲輪廓。該區域以中性色與「南極洲 Antarctica」地理區域彈窗呈現，不列入政體搜尋與政體計數。選取年1959年起補充《南極條約》體系，區分1959年簽署與1961年生效（[南極條約秘書處](https://www.ats.aq/e/antarctictreaty.html)）；無永久居民說明參考[英國南極調查局](https://www.bas.ac.uk/about/education-and-schools/antarctic-factsheet/)。其他空名稱區域採淡色且不可互動；名稱彈窗省略空白欄位。原始GeoJSON不變。

此輪驗證：既有事件／v3／靜態輸出驗證，以及Chrome headless的browser、v3、timeline、performance腳本；新增 `scripts/verify-compact.cjs` 檢查1440×900、390×844、320×568及844×390的控制列高度、展開功能、空欄位、空名稱區域及1958／1959／1961／2026條約說明。截圖與報告位於 `artifacts/compact-*`、`artifacts/antarctica-*`。
