# V16 狀態

未建立 commit；既有 `data/` 檔案與名稱均未修改。

1. URL 狀態：完成。`year` 與穩定 `polity` ID 共用 `history.replaceState`，保留其他 query 與 hash。直接開啟連結會還原年份、選取與彈窗；搜尋選取與地圖點選更新 URL。換年後該政體仍存在就重新開啟，否則清除選取；關閉彈窗也清除選取。舊 `?year=` 仍可使用。無效或該快照不存在的 ID 安全移除。
2. 自稱：完成。新增 `data/endonyms.json`，82 個既有穩定 ID；含原文、標準轉寫、繁體中文意譯、語言、使用時期，另以 `fromYear`／`toYear` 限制適用選取年。拉丁字母原文不重複填轉寫。原有 catalog 自稱在執行期合併，相同原文優先採新檔，沒有改寫 catalog、glossary、介紹或幾何。沿用自稱區塊，移除自稱來源／參考文獻 UI；存在適用自稱時不顯示自稱待考證。新檔隨靜態建置壓縮並加內容指紋。跨很長時期的 ID 只在適用選取年代顯示現代形式；所列形式不是完整國號清單。
3. 效能：完成本輪目標。預取快照以 transferable bytes 快取，到實際使用才解碼與解析；已解析快照重用物件。事件 DOM 與標籤分開 rAF，快照未換時不重新排序／建立標籤。桌機 WebGL pixelRatio 上限改為 0.75，手機保持 1；此項以畫布清晰度換取較低繪圖成本，HTML 介面解析度不變。未修改原始幾何或既有資料名稱。

## 效能方法與結果

`scripts/profile-v16.cjs`：Google Chrome 156.0.8078.47 headless + SwiftShader、1440×900、4× CPU，從 1700 年開始，依序 1800、1900、2000、1700、1800、1900。每次從提交年份開始，等待疆界完成後再觀測 1200ms，涵蓋標籤、非同步 MapLibre 重繪與預取；沒有停用事件、標籤或預取。CDP `Performance.enable/getMetrics` 取得累積指標差值，`PerformanceObserver(type: longtask)` 計算 >50ms 任務。兩版本各使用新的 page/context，沿用應用程式記憶體快取；前三次主要為首次造訪、後三次為重訪。不是冷網路測試。

v13 基準直接由 git `4e73eb2` 匯出至 `/tmp/history-v13`，在該副本執行自己的 build-static.py，以 8013 埠服務；本版使用 8000 埠。基準沒有套用本版程式碼。原始結果：`artifacts/v16-performance.json`。

| 指標（六次合計，除最大值） | v13 | v16 |
| --- | ---: | ---: |
| >50ms 長任務 | 26 | 23 |
| 長任務總時長 | 2504ms | 1415ms |
| 最大長任務 | 206ms | 76ms |
| CDP TaskDuration | 4260.4ms | 3070.9ms |
| CDP ScriptDuration | 744.4ms | 842.3ms |
| CDP LayoutDuration | 752.1ms | 120.6ms |

各次長任務數：v13 `5,3,4,4,5,5`；v16 `6,5,3,2,3,4`。總數降低 11.5%，但 1800、1900 的首次切換沒有較少。ScriptDuration 未改善，不宣稱所有工作都變快。這些是單次本機軟體繪圖環境量測，不保證真實裝置相同比例；仍有 >50ms 任務。

前兩輪未達標的原始報告保留於 `artifacts/v16-performance-before.json`、`artifacts/v16-performance-deferred.json`。第一輪 v16 為 33 次、v13 為 21 次；僅改排程與延後解析不足，最終數字包含畫布解析度取捨。套用解析度限制後的前一輪為 v13 23 次、v16 14 次（`artifacts/v16-performance-resolution.json`）；最終重測為 26／23，顯示 50ms 門檻附近的次數有明顯波動，沒有挑選較漂亮的一輪作為最終報告。兩輪合計 49／37 次，但樣本仍少。

## 自稱查核與限制

新檔只列一種有把握的形式；同 ID 的現代通稱不代表歷代都使用該稱，數字上下界是本輪保守顯示範圍，不是歷史存續年代。有些 ID 是同主題的不同資料集鍵，因此 82 個 ID 不等於 82 個互不重複的歷史國家。轉寫為羅馬字，並非臺灣中文音譯；原文已是拉丁字母時留空。

本輪針對清、蒙古、東羅馬與鄂圖曼的用稱另查網路文獻；例如 [中國人民大學清史研究所](https://iqh.ruc.edu.cn/old/qdzwgxyj/zwgx_zwgxsda/wwda/87bb125a44a24adabaf4d237ed7a017e.htm)、[首爾科技大學研究摘要](https://pure.seoultech.ac.kr/en/publications/17%EC%84%B8%EA%B8%B0-%EC%B4%88-%EB%AA%BD%EA%B3%A8%EA%B3%BC-%EB%8B%A4%EC%9D%B4%EC%B9%AD-%EA%B5%AC%EB%A3%AC/)、[拜占庭史出版品節錄](https://www.yapikrediyayinlari.com.tr/dosyalar/2022/01/bizansdonemindeanadolu-PDF-tadimlik.pdf)、[鄂圖曼用稱整理](https://en.wikipedia.org/wiki/Ottoman_claim_to_Roman_succession)。其餘為既有知識中可確認的國名／通稱；沒有宣稱完成逐筆學術來源交叉查核。連結只在本狀態文件，不在網站 popup 或 endonyms JSON。

## 驗證

- `python3 scripts/build-static.py`：通過，61 個內容指紋 JSON、10 個程式／樣式。
- `npm run validate`：通過；54 份原始幾何與所有事件識別不變。
- 全部 13 支 `scripts/verify-*.cjs`：通過（browser、compact、performance、snapshots-v7、timeline、v11、v11b、v13、v14、v15、v16、v3、v7）；完整退出碼在 `artifacts/v16-checks.json`。
- `scripts/verify-v16.cjs`：URL 還原、同快照換年、重新載入、history 長度不變、舊 year 連結、無效 ID、跨快照保留選取、關閉清除選取及搜尋更新 URL；資料筆數／ID／欄位與多個年代自稱的實際 popup 檢查。

新增自稱依選取年篩選；既有 catalog 自稱仍沿用疆界快照年。1200 年蒙古名稱覆寫與疆界待考維持原樣，選取 1206 年後才出現大蒙古國自稱。v7 測試的換年 helper 同時等待該年的事件 signature，避免把已排程但尚未更新的上一年事件 DOM 當成本年結果。

`git diff --check` 通過；既有 `data/` tracked 檔案差異為空。新自稱的 11 個實際 popup 案例通過，`artifacts/v16-report.json` 記錄 82 筆與零 page error。沒有建立 commit。
