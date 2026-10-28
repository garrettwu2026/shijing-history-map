# V14 狀態（2026-10-28）

已從 Leaflet 遷移至 MapLibre GL JS 5.6.1；未提交 commit。

## 實作

- npm 依賴及 lockfile 鎖定 5.6.1；原版 JS、CSS、授權放入 `vendor/maplibre/`。建置會複製並指紋化 JS/CSS，移除 Leaflet 發佈依賴與 vendor 檔案。
- `polities`／`disputed` 各有固定 GeoJSON source、fill 與 line layer；換年只呼叫 `setData()`，不拆除重建 layer/source。原配色、文化區域透明度、爭議疆界黃色與虛線保留；hover／選取使用 feature-state。
- 標籤改為 `polity-labels` symbol layer，由 MapLibre 碰撞處理；沿用 Worker 的內部錨點、政體去重及重要度排序。只顯示既有中文名稱中的漢字，清除顯示用待考後綴，不顯示原語副標。`localIdeographFontFamily` 使用 Noto Sans TC／PingFang TC／Microsoft JhengHei／sans-serif。v5 樣式驗證需要 glyph URL 範本，指定本機路徑；純漢字圖層不請求 PBF。測試封鎖外部連線仍可渲染中文。
- 沿用本機 2010 陸地輪廓與經緯網，不使用外部底圖、glyph、sprite 或字型服務；移除 Google Fonts 依賴。
- 搜尋、fitBounds、年份 URL、事件清單／群組標記、播放、設定、無障礙焦點、資料重試與 Worker 重啟保留。彈窗保留地理錨點，必要時以 offset 移入可用畫面並限制捲動高度；彈窗 DOM 置於地圖父容器，避開地圖的 z-index:0 stacking context，避免手機橫向時遮住時間列。時間列桌機／橫向 62px，320／390px 寬 64px。
- 所有名稱狀態沿用 `modules/content.js` 的單一 helper；沒有新建第二套待考後綴邏輯。
- Worker 在執行期展開跨 ±180 的短邊並對齊孔洞；保留南極世界寬度，啟用 renderWorldCopies。搜尋 bounds 比較跨換日線的較短經度區間，斐濟不縮放成整個世界。原資料中的空幾何不進入政體搜尋。
- WebGL2 偵測失敗或 Map 初始化錯誤會顯示繁體中文說明。MapLibre 5.6.1 沒有內建 supported export，因此補上 `maplibregl.supported()` 的 WebGL2 探測（存在時不覆寫）；兩條失敗路徑均有模擬驗證。

## TASK14b 效能修正

- GeoJSON source 設定 `tolerance:1`、`buffer:16`、`maxzoom:7`、`lineMetrics:false`，使用 feature 的明確 ID，省去重複的 `promoteId`。固定 source、fill／line layer、hover／選取與黃色爭議疆界保留。關閉多餘的 fill 抗鋸齒（獨立 line layer 保留）、`fadeDuration:0`；手機 pixel ratio 上限為 1，桌機上限為 2。
- 建置以 `scripts/prepare-geometry.cjs` 重用 Worker 的相同演算法，只在 `dist` 預先產生 bounds、area、首個內部錨點與跨換日線處理結果；開發版及幾何內容變更時仍由 Worker 計算。只保留實際使用的首個錨點，不傳送重複的 polygon parts。原始 `data/**` 不寫入。
- Worker 的 FeatureCollection 以可轉移 UTF-8 ArrayBuffer 傳送，避免深層座標陣列的 structured clone；其他小型 JSON 沿用物件。拖曳期間預先請求所指向快照，但仍只在放開後交換地圖資料；未換快照不重複 `setData()`。標籤 visibility 未變更時不重設 layout。
- 初次啟動用暫時、透明的 symbol layer 預熱資料中既有漢字的本機 glyph cache，完成後移除 source／layer，才開放操作。這將一次性的 canvas glyph 生成成本移到初始化；不引入字型下載、不新增譯名，之後換年不再重複支付首次遇到漢字的成本。代價是初次可操作前增加預熱時間。
- 事件列加上 `content-visibility:auto` 與估計列高；保留全部 DOM、搜尋、鍵盤焦點與捲動，只延後畫面外列的排版。Chrome trace 顯示原本單次 Layout 約 102ms，這是桌機長幀的主要來源之一。
- 已實測 pinned 5.6.1 的 `updateData({removeAll:true,add:...})`：完整換年時 structured clone 的停頓沒有優於 `setData()`，因此保留 `setData()`。也試過分幀上傳，但完整更新時間較差，未採用。

## 資料保護

`data/**` 無變更。沒有還原英文名稱、沒有新增音譯、沒有修改事件 ID、來源、譯名查核狀態或原始幾何檔。跨換日線處理僅發生在 Worker 載入的記憶體資料。

## 效能比較

以 `git archive 4e73eb2` 複製至 `/tmp/history-v13` 並獨立建置，8001 提供 v13，8000 提供 v14。`node scripts/measure-v14.cjs` 使用相同 headless Chromium、SwiftShader（`--use-gl=swiftshader --enable-unsafe-swiftshader`）、4× CPU、1492 年起始與相同時間軸拖曳終點。桌機 1440×900、手機 390×844；每組獨立 context 五次（`RUNS=5 node scripts/measure-v14.cjs`），以下均為中位數。完成條件與原量測保持相同。

放開後量至資料更新及兩次 rAF 完成；v14 額外等待 `map.loaded()`，因此包含非同步 GeoJSON 切片及 GL 畫面完成，沒有把 `setData()` 返回當成渲染完成。長幀定義為 rAF 間隔 >50ms。

| 畫面 | 版本 | 完整放開更新 ms | 最大幀間隔 ms | 長幀數 | 長任務數 |
| --- | --- | ---: | ---: | ---: | ---: |
| 桌機 | v13 | 635.2 | 166.7 | 3 | 4 |
| 桌機 | v14 | 489.2 | 133.4 | 4 | 4 |
| 手機 | v13 | 429.6 | 116.7 | 2 | 2 |
| 手機 | v14 | 272.5 | 66.6 | 1 | 1 |

原始逐次數據：`artifacts/v14-performance.json`。亦已執行既有 `profile-v7.cjs`（1×／4×，桌機／手機），v13 結果保存在 `artifacts/v14-baseline-v13-performance.json`；該舊量測的 v14 完成條件沒有等待 GL source 渲染，故不拿它宣稱改善。

本次同批五次量測，v14 桌機完整更新比 v13 快約 23%、最大幀間隔低約 20%；手機完整更新快約 37%、最大幀間隔低約 43%。兩種畫面的完整更新及最大幀間隔均不劣於 v13，也不劣於先前記錄的 v13（579.2／133.4ms、446.9／116.6ms）。桌機 >50ms 長幀中位數仍為 4（v13 為 3），並非所有幀都已流暢。SwiftShader 與實機 GPU 不同，這裡只宣稱達成指定量測的更新時間與最大幀間隔目標；仍需真實手機硬體量測。

## 驗證

最終驗證結果記錄於 `artifacts/v14-verification/results.json`；各腳本完整輸出放於同目錄。

- `python3 scripts/build-static.py`：通過；59 個雜湊 JSON、10 個雜湊 JS/CSS，含 MapLibre。
- `npm run validate`：通過內容、事件、v3、靜態指紋與詞彙驗證；54 份幾何與全部事件 ID 保持不變。
- TASK14b 已重新執行建置、validate 與全部 11 支 `scripts/verify-*.cjs`，最終均通過：browser、compact、performance、snapshots-v7、timeline、v3、v7、v11、v11b、v13、v14。
- v14 覆蓋 500／700／1200／1900 年的實際渲染中文（南齊、武周、蒙古各部、巴西共和國）、固定 source/layer 身分、setData 換年、單一待考、手機按鈕點擊與 66px 高度限制、斐濟 fitBounds、合成跨換日線多邊形的兩側 rendered-feature 命中、兩種 WebGL fallback。報告：`artifacts/v14-report.json`。
- v3 額外檢查詳情視窗中心實際可點擊、不受其他面板遮擋。
- JS 語法及 `git diff --check`：通過。

初次 v11 導航碰到同時重建刪除舊雜湊資產，建置結束後重跑通過。舊 browser 驗證在分類點擊後立即讀取 rAF 更新結果有競態，已改為等待可觀察的事件／標記更新。

## 剩餘限制

- SwiftShader／4× CPU 下仍有上述長幀；桌機 >50ms 長幀數未全面優於 v13。字形預熱將一次性成本移到初次初始化，並不代表冷啟動時間也優於 v13。
- 未取得可靠中文譯名者仍在搜尋／彈窗保留來源原文與單一待考狀態；純漢字常駐標籤不顯示純外文名稱，不製造新譯名。
- symbol 碰撞涵蓋地圖符號之間，HTML 介面面板仍可能遮住其後方標籤；原語自稱完整保留在詳情。
- 疆界與年代沿用原本資料品質／2010 年上限；本次渲染遷移未重新查核史料。

## v14.1：修正地圖標籤註記黏連（TASK15）

- 根因位於 `modules/map.js`：原先對完整顯示名稱刪除所有非漢字，將「夏威夷領地（美屬）」變成「夏威夷領地美屬」。改由 `modules/content.js` 的 `cleanMapLabel()` 先移除完整括號註記與待考標記，再保留名稱本身的拼寫及連接符號；不再靠刪標點產生標籤。純外文名稱仍保留在搜尋／詳情，不製造局部中文標籤。
- 1900 年夏威夷地圖 source 標籤為「夏威夷領地」，彈窗標題保留「夏威夷領地（美屬）」及原有待考狀態。`app.js` 的 `nameFor()` 仍按快照年套用 errata／period／catalog 優先序，彈窗沿用完整名稱；`data-worker.js`、`scripts/prepare-geometry.cjs`、`build-static.py` 僅預算幾何／錨點，不預算或拼接文字，因此無須修改。
- 保留既有名稱中的「－／—」等連接符號。MapLibre 的本機字形涵蓋漢字及全形符號，但不涵蓋 em dash；新增原創矩形筆畫的本機 U+2014 SDF PBF（附說明），由既有靜態建置複製，無外部字型請求。
- `scripts/verify-v14.cjs` 新增全部 54 個快照年的獨立名稱比對：依各年的 catalog／period／errata 取得預期乾淨名稱，檢查每個 source 標籤及每個實際 rendered 標籤完全一致，並核對 source 數量以避免漏標籤。測試專用範圍擴充涵蓋 UI 最小年份之前的三個快照，不改產品年份範圍；另實際開啟夏威夷彈窗驗證括號註記。
- 全年掃描結果：6,035 個 source 標籤通過；舊演算法與乾淨名稱有 180 個 feature/year 差異，涵蓋 47 個快照年、73 種不同修正，包括夏威夷、各殖民地的屬地註記、區域副標與被刪除的連接符號。逐年差異保存在 `artifacts/v14-report.json` 的 `labelAudit`。
- 驗證結果：`python3 scripts/build-static.py`、`npm run validate`、全部 11 支 `scripts/verify-*.cjs` 均通過（browser、compact、performance、snapshots-v7、timeline、v11、v11b、v13、v14、v3、v7）。最終整套執行中 v7 的 metadata retry 等待曾逾時；單獨重跑完整 v7 通過，三種 metadata retry、baseline retry 及 Worker restart 均成功，零錯誤。其餘十支最終整套執行均 exit 0。
- `git diff --check` 通過；`data/**` 沒有任何變更，所有既有名稱保持原樣；未建立 commit。
