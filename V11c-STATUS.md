# V11c — 還原既有中文與簡化地圖標籤

日期：2026-10-28。保留未提交的 TASK11／TASK11b 修改，未 commit。

## 還原數量

- 還原 HEAD 9b886f1 的 **1,033 筆資料集名稱，對應 1,032 個穩定政體 ID**，詞彙表狀態為 `restored-v10`。`source` 記錄 git 版本來源，不宣稱新增學術認證；保留原有來源並還原原有信心等級。
- 保留 TASK11 明列的 82 筆撤回與錯誤對應；保留 TASK11 年代修正與 TASK11b 已接受的用語統一。
- 另保留 TASK11 新增的 Dumonii／Peshemegs／Tlinoit 三筆已查核中文對應，沿用其引用與限制說明。這三筆不計入 `restored-v10`。
- **剩餘待考：1,667 個穩定政體 ID，亦為 1,667 筆資料集名稱**，由 TASK11b 的 2,702 個 ID 減少 1,035。不同原名可共用同一 ID，因此還原筆數與 ID 數不同。

| 原名 | 現在顯示 | 處理 |
| --- | --- | --- |
| Magadha | 摩揭陀 | restored-v10 |
| Western Australia (UK) | 西澳大利亞（英屬） | restored-v10 |
| Amazon hunter-gatherers | 亞馬遜狩獵採集社群 | restored-v10；描述性翻譯 |
| Arctic marine mammal hunters | 北極海洋狩獵社群 | restored-v10；描述性翻譯 |
| Tibetan Empire | 吐蕃 | 保留 TASK11b accepted |
| Peshemegs | 佩切涅格人 | 保留 TASK11 已查核對應與地理推論限制 |
| Darkinung | Darkinung | 保留 TASK11 譯名待考 |
| Boihaenum | Boihaenum | 保留錯誤對應撤回 |

## 地圖標籤

地圖只顯示名稱，移除名稱內的「（待考）」「（年代／疆界待考證）」等文字標記，也不再追加疆界警語；未增加資訊指示符。原有年代／疆界判斷與說明留在彈窗。例如馬利不再疊加標記，1900 年巴西仍顯示巴西共和國，彈窗保留疆界待考證。

## 驗證與截圖

已通過 `npm run build`、`npm run validate`、`npm run test:browser`、`node scripts/verify-v11.cjs`、`node scripts/verify-v11b.cjs`。更新測試涵蓋純名稱標籤、摩揭陀還原與 TASK11 的佩切涅格人。資料驗證逐筆比對 restored-v10 與 HEAD，排除 TASK11 撤回名單，並檢查全部幾何、身分、年代、事件非文字欄位不變。

可用 `node scripts/screenshots-v11c.cjs` 重生五個年份截圖，並檢查實際標籤不含待考文字。

指定 `/workspace/review/v11/local{-500,500,1000,1500,1900}.png` 寫入遭 EROFS（唯讀掛載）拒絕，該位置舊截圖未更新。新截圖改存 **`/workspace/history-map/artifacts/v11c/local{-500,500,1000,1500,1900}.png`**。可設 `V11_SCREENSHOT_DIR` 指向可寫入目的地。
