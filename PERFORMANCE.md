Performance pass (2026-10-27)

All 54 `data/world_*.geojson` snapshots were simplified with Mapshaper 0.7.98, using `-simplify 15% keep-shapes` and `-o precision=0.01`. The fragmented 1492 snapshot uses 8%. Every original feature and property was retained. The land background uses the same simplified 2010 file and shares its in-memory fetch cache with the timeline.

Total uncompressed snapshot bytes: **71,198,645 → 9,781,849 (86.26% reduction)**. Files range from 79,159 to 406,724 bytes except 1492 (985,027 bytes). Sparse early snapshots are smaller than the requested 150 KB range. 1492 remains larger than 400 KB because its many small fragments and shared boundaries limit simplification with `keep-shapes`; dissolving fragments changed border structure and was rejected.

Polygon layers explicitly use Leaflet Canvas. Snapshot fetch promises remain cached for the session, with failed requests evicted for retry. Adjacent snapshots prefetch during idle time. Slider input updates the year immediately and debounces border swaps by 150 ms; superseded requests cannot render. Playback retains the existing layer when its snapshot has not changed. Labels, markers, and popups keep their existing behavior.

Headless Google Chrome, fresh contexts, uncompressed local HTTP server, default year -300, three runs per viewport. First render is navigation start to two animation frames after the first border snapshot and labels are built. Median observed times:

| Viewport | Before | After |
| --- | ---: | ---: |
| Desktop 1440×900 | 833.5 ms | 530.0 ms |
| Mobile 390×844, touch emulation | 612.2 ms | 436.2 ms |

These are local, unthrottled measurements; mobile emulation does not reproduce a physical phone's CPU or Render network latency.

Verification:

```sh
python3 -m http.server 8080
NODE_PATH=/path/to/playwright/node_modules node scripts/verify-performance.cjs
# Existing feature/design regression checks (expects port 8000):
NODE_PATH=/path/to/playwright/node_modules node scripts/verify-browser.cjs
```

The performance check disables Chrome's HTTP cache and verifies Canvas rendering, idle prefetching, debounced slider swaps, in-memory revisits, unchanged-snapshot playback, all selectable snapshots, and no JavaScript/console errors on desktop and mobile. It writes byte totals, timing samples, and zoom 2/4/6 screenshots under ignored `artifacts/`. Byte comparisons use the snapshots at Git HEAD as the baseline.

## v3 時間軸追加優化（2026-10-27）

此節取代上文對目前快取與國名渲染實作的描述，保留先前量測作歷史紀錄。既有 v3 資料、名稱勘誤、搜尋、事件與行動版功能均保留。

- 每個疆界快照使用獨立 Leaflet Canvas。新 Canvas 加入後經過兩次 requestAnimationFrame，讓實際繪製與一次呈現機會完成，才移除舊圖層與 renderer；過時的暫存圖層直接丟棄。載入期間保留舊疆界與國名。
- pointer 拖曳期間不換疆界、不排國名；change／pointerup／pointercancel 統一完成更新。鍵盤 input 保留 150 ms debounce。國名保留 DOM 文字：離屏候選一次加入、一次集中量測，再以固定尺寸 divIcon 批次定位；候選錨點碰撞試算不新增 tooltip、不讀版面。放開後完成一次國名排版。
- 前後各兩期在 idle 預載（省流量／2G 除外）；共用 Promise LRU 上限 10 期，命中更新最近使用順序。新選取會透過主執行緒 AbortController 通知 Worker 取消過時 fetch；失敗／取消的項目可重試。
- 所有資料 fetch 與 response.json（JSON.parse）移到 data-worker.js；球面面積、大片段排序與經緯度 bounds 也在 Worker 預處理。Leaflet 幾何建立、投影、DOM、Canvas 繪圖仍在主執行緒。

### 拖曳前後量測

以 Git HEAD 的原始 v3 app.js 與本次版本，使用相同資料、Google Chrome headless、無 CPU／網路降速、每個 viewport 各三次重新載入。每次從 1200 年開始，60 次 range input（間隔約 16 ms，位置 400→813），含 pointerdown／change／pointerup，之後觀察 1000 ms 收尾；不與其他瀏覽器測試同時執行。手機為 390×844 touch emulation，桌機 1440×900。腳本：`scripts/measure-drag.cjs`。表中為三次中位數，layout reads 為整段期間 getBoundingClientRect 次數，不等於 forced-layout 次數。

| 指標 | 桌機 v3 → 本次 | 手機 v3 → 本次 |
| --- | ---: | ---: |
| layout reads | 118 → 21（減少 82.2%） | 25 → 12（減少 52%） |
| frame interval P95 | 33.4 → 33.3 ms | 16.8 → 16.8 ms |
| 最大 frame interval | 50.0 → 66.6 ms | 33.3 → 50.0 ms |
| 整段 elapsed（含固定 1 秒觀察） | 2059.5 → 2010.4 ms | 1991.1 → 2004.4 ms |

桌機原始三次無 ≥50 ms long task；本次三次分別為 1／1／0 次（55、57 ms）。手機原始三次為零；本次為 0／0／1 次（61 ms）。**這次未量到 P95 FPS 改善，也不宣稱所有幀更快**；確實減少國名版面讀取，避免拖曳中途排版與圖層空白。放開後主執行緒的 Leaflet 建圖仍可能產生長幀。冷快取、實體手機與正式 CDN 延遲需另外量測。

`dist`（雜湊 JSON）亦以相同腳本完成桌機／手機各三次：layout reads 21／12、P95 中位數 49.9／16.8 ms，零 JavaScript／console error。此輪 dist 桌機最長幀達 333.4 ms、每次有 2–3 個 long task，手機有一次 63 ms long task；顯示建圖收尾與環境波動仍需後續改善，不能把版面讀取減少直接解讀為幀率提升。原始樣本：`artifacts/drag-before.json`、`drag-after.json`、`drag-dist.json`（artifacts 為忽略檔）。

### Render 壓縮與快取查核

實際向既有站 `https://shijing-history-map.onrender.com` 發出 `Accept-Encoding: br,gzip` 的 HEAD 請求：

| URL | 觀察到的回應 |
| --- | --- |
| `/data/world_1200.geojson` | 200；binary/octet-stream；無 Content-Encoding；141092 bytes |
| `/data/events.json` | 200；application/json；Content-Encoding: br |
| 上述兩者 Cache-Control | public, max-age=0, s-maxage=300（目前線上未套用此 repo 的一年快取設定） |

因此建置改為每個資料檔以 SHA-256 前16碼命名，疆界輸出 `.json`，同步重寫 snapshots manifest、初始 metadata 與 2010 底圖 URL。原始 data 檔案不改名，以保留既有驗證。render.yaml 設定 `/data/*.json` 為 application/json、`/data/*` 一年 immutable，HTML／app.js／data-worker.js no-cache。54 期原始總量 9,227,861 bytes；本機 gzip 2,315,448 bytes，這是壓縮可行性量測，並非 CDN 傳輸量。

[Render 官方文件](https://render.com/docs/static-sites)說明 Static Site 自動提供 Brotli；[自訂標頭文件](https://render.com/docs/static-site-headers)說明 Cache-Control 設定。這次未部署，故**新雜湊 URL 的線上壓縮與一年快取尚未實測生效**。部署後應以 `curl -sSI -H 'Accept-Encoding: br,gzip' https://站點/data/world_1200.雜湊.json` 確認 Content-Encoding: br、application/json 與一年 immutable，並確認 `/`、`/app.js`、`/data-worker.js` 為 no-cache；勿將本機配置驗證當成正式環境生效證明。

### 驗證與重現

```sh
python3 scripts/validate-events.py
python3 scripts/validate-v3.py
python3 scripts/build-static.py
python3 scripts/verify-static.py
# 以 HTTP server 提供專案根目錄於 8000；NODE_PATH 指向已安裝 Playwright
node scripts/verify-browser.cjs
node scripts/verify-v3.cjs
BASE_URL=http://localhost:8000 node scripts/verify-performance.cjs
node scripts/verify-timeline.cjs
BASE_URL=http://localhost:8000 node scripts/measure-drag.cjs artifacts/drag-after.json
# 另以 HTTP server 提供 dist 於 8082
BASE_URL=http://localhost:8082 node scripts/measure-drag.cjs artifacts/drag-dist.json
```

既有資料驗證、browser、v3、performance 全通過；新增 timeline 測試檢查四期預載、10 期上限、拖曳零國名量測、放開排版、Canvas 實際 draw 後才移除舊層、舊 renderer 清除與取消過時請求。桌機／手機零 JS 與 console errors；v3 額外涵蓋 320×568、844×390。建置驗證覆核 62 個 JSON 的檔名雜湊、54 期 URL 與 Render MIME／cache 規則。

## v7 分段效能量測（2026-10-28）

先執行既有 `measure-drag.cjs`，修改前報告保存在 `artifacts/v7-before-profile.json`。六次未降速量測的 P95 為 16.7–16.8ms、最長幀 33.3–83.4ms，沒有觀測到 >50ms 長任務。該舊腳本把拖曳及放開後一秒混合統計，與下方新腳本的方法不同，**不能以兩組數字直接推算改善百分比**。

修改內容：

- 政體色改成穩定 ID 雜湊，移除逐對鄰接掃描；每期預算樣式並快取名稱及期間覆寫。
- Worker 預算多邊形內部標籤候選，主執行緒只投影及避讓；標籤避開事件標記與面板。
- 每 24 個 feature 建圖後讓出主執行緒，完成新 Canvas 繪製才移除舊圖。仍有單一大 feature、Canvas 畫圖及 DOM 排版無法完全切小的成本。
- Leaflet 在縮放 <4 使用 smoothFactor=3，其餘為 1；以 Leaflet 原生投影／剪裁／簡化減少低縮放幾何繪製成本，未修改原始座標或改用 MapLibre。這不是另行發布三套離線 LOD 幾何。
- 時間軸拖曳時保持原圖，放開才換圖；同一期不重建；保留 Worker、LRU、預載與取消機制。

`profile-v7.cjs` 在乾淨 context 清除瀏覽器快取、禁用 HTTP cache，Chrome CDP CPU 1×／4×，1492 複雜快照冷啟動；桌機原生 mouse 拖曳、手機 CDP touchStart／touchMove／touchEnd 拖曳。分開觀測 cold、drag、release、playback，各情境一次，屬回歸基準而非穩健的多次抽樣統計。初次顯示時間含入口、metadata、Worker、疆界到完成的等待。

| CPU／尺寸 | 冷啟動至完成 ms | 放開至完成 ms | 拖曳 P95／最長幀 ms | 放開最長幀 ms | 放開長任務數 | 播放最長幀 ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1×／1440×900 | 1029 | 213 | 16.8／33.4 | 33.4 | 0 | 16.8 |
| 1×／390×844 | 978 | 226 | 16.8／16.8 | 50.0 | 1 | 16.8 |
| 4×／1440×900 | 2236 | 665 | 16.8／33.4 | 216.7 | 5 | 100.0 |
| 4×／390×844 | 1716 | 567 | 16.8／16.8 | 133.2 | 5 | 83.3 |

原始分段資料位於 `artifacts/v7-performance.json`，含每期 fetch、prepare、build、labels 及 total 耗時。正常 CPU 的拖曳保持接近 60fps；四倍降速後，放開及播放仍有可見長幀，**尚未達成全流程穩定 60fps**。分批建圖降低單段工作但增加總等待時間，不能只以載入總時間判斷輸入是否順暢。

重現（先建置並啟動 8000 埠 HTTP server）：

```sh
NODE_PATH=/tmp/history-map-check/node_modules node scripts/profile-v7.cjs
# 或 npm ci 後 npm run test:performance
```

未測實機 Android／iOS、慢速行動網路、正式站 Brotli／CDN。這些測試沒有部署或修改任何遠端資料。
