# V18b 狀態：尚未達數量目標

目前成果已寫入資料檔，進度保留於 `scripts/v18b-progress.json`。本次沒有 commit 或 push。

## 資料數量

| 項目 | 數量 |
| --- | ---: |
| 政體目錄 | 2997 |
| 基準介紹 | 214 |
| 介紹總數 | 300 |
| 相對基準新增介紹 | 86 |
| 具完整必要結構的介紹 | 300 |
| 事件總數 | 980 |
| 新增事件 | 100 |
| 事件詳情總數 | 87 |
| 原有事件具詳情 | 70 |
| 新增事件具詳情 | 17 |

| 介紹欄位 | 具備此欄位的介紹 |
| --- | ---: |
| summary | 300 |
| 年表 | 300 |
| 重要人物 | 300 |
| 關鍵數據 | 9 |
| 背景 | 300 |
| 影響 | 300 |

`關鍵數據`只保留有把握的數字，其餘依任務規則省略。300 篇介紹的摘要、背景、影響、年表與人物筆數均通過長度與格式驗證；原有欄位及真實關聯 ID 保留。古代年代不確定時以文字標示約年或傳統紀年。部分文化分布區缺少可確定的古代統治者，人物欄明確標示相關研究者或見聞記錄者的身分。

## 尚未完成

- 介紹距離最低 500 篇還差 200 篇；距離約新增 300 篇還差 214 篇。
- 事件詳情距離最低 300 件還差 213 件。
- `npm run validate` **失敗**：介紹數量門檻尚未達成。另行執行 `python3 scripts/validate-events.py --require-complete` 也因事件詳情數量不足失敗。沒有降低這兩項門檻。

## UI 與載入

介紹及事件詳情均在首次開啟相應彈窗時才載入，後續沿用 Promise 快取。年表以小型清單顯示，人物及數據以緊湊鍵值顯示，背景與影響置於既有摺疊區。參與方按鈕會定位政體並在必要時切換到目錄有疆界資料的年代。古希臘事件使用目錄概括標籤時另有文字說明，避免誤認為現代國家。

320px 及桌面驗證通過，時間軸維持緊湊，介紹與事件詳情沒有新增來源或引用 UI。資料建置輸出包含具指紋檔名的兩個延遲載入資產。

## 驗證結果

- `python3 scripts/build-static.py`：通過。
- `python3 scripts/validate-intros.py --allow-incomplete`：通過（300 篇具完整結構；只略過總數門檻）。
- 內容語意、事件結構、V3 資料、靜態資產、詞彙驗證：全部通過，紀錄於 `artifacts/v18b/data-validation-results.json`。
- `npm run validate`：未通過，原因如上。
- 所有 `scripts/verify-*.cjs`：15/15 通過，含新增 v18b 檢查。完整結果在 `artifacts/v18b/verification-results.json`。初次執行的 v11、v7 曾逾時，最終建置完成後重跑通過；v15 已配合擴充欄位及移除舊資料上限；v18b 已修正含版本查詢字串的請求計數。
- 續作檢查：兩支資料腳本重跑後，四份資料檔及批次紀錄內容皆不變。紀錄於 `artifacts/v18b/resume-check.json`。
- `http://localhost:8000`：已提供目前專案根目錄，並以實際回傳內容比對確認。

| 瀏覽器腳本 | 最終結果 |
| --- | --- |
| `scripts/verify-browser.cjs` | 通過 |
| `scripts/verify-compact.cjs` | 通過 |
| `scripts/verify-performance.cjs` | 通過 |
| `scripts/verify-snapshots-v7.cjs` | 通過 |
| `scripts/verify-timeline.cjs` | 通過 |
| `scripts/verify-v11.cjs` | 通過 |
| `scripts/verify-v11b.cjs` | 通過 |
| `scripts/verify-v13.cjs` | 通過 |
| `scripts/verify-v14.cjs` | 通過 |
| `scripts/verify-v15.cjs` | 通過 |
| `scripts/verify-v16.cjs` | 通過 |
| `scripts/verify-v17.cjs` | 通過 |
| `scripts/verify-v18b.cjs` | 通過 |
| `scripts/verify-v3.cjs` | 通過 |
| `scripts/verify-v7.cjs` | 通過 |

舊的來源驗證允許本次自行撰寫的 `editorial` 事件不附網址；原有事件非文字內容仍比對 V11 基準，不允許被新增事件掩蓋變動。

## 續作方式

新增政體的人工撰寫資料在 `scripts/v18b/polities.tsv`，既有介紹完整內容在 `existing.tsv`，既有介紹的補充年表與人物在 `existing-structure.tsv`。事件詳情在 `events.tsv`，新增事件在 `new-events.tsv`。確認內容後執行：

```sh
python3 scripts/expand-v18b.py
python3 scripts/complete-v18b-existing.py
python3 scripts/validate-intros.py --allow-incomplete
python3 scripts/validate-events.py
```

腳本跳過已完成項目，每批最多 30 筆，以暫存檔替換方式寫回資料與進度。補足數量後必須重新建置並執行完整驗證，才可將狀態改為完成。
