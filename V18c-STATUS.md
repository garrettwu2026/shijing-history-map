# V18c 完成狀態

驗證日期：2026-11-09。TASK22 從既有進度續跑，累計新增 504 筆科技事件；本次跳過已完成項目，複核地點、敘述與年代對應。未 commit、未 push。

## 資料數量與範圍

| 項目 | 數量 |
| --- | ---: |
| 原有事件（與 HEAD 逐筆比對，完整保留） | 980 |
| TASK22 新增事件及完整詳細資料 | 504 |
| 全部事件 | 1,484 |
| 科技與發明類事件 | 580 |
| 詳細資料總數 | 591 |

- 新增事件年代：西元前 1,000,000 年至西元 2024 年。
- 年代分布：前 5000 年以前 14 筆、前 5000 年至西元 499 年 49 筆、500–1499 年 49 筆、1500–1899 年 142 筆、1900–2026 年 250 筆。
- 新增地區：非洲 32 筆、亞洲 121 筆、美洲 127 筆、大洋洲 23 筆、歐洲 199 筆、南極洲 2 筆。
- 新增資料字數：description 121–158、背景 63–80、經過 58–81、影響 71–89，均符合要求；事件摘要與詳細資料摘要一致。
- 全部新增事件使用既有「科技與發明」分類、顏色、圖示及篩選按鈕，參與方皆為既有政體 ID。文字使用繁體中文，資料不顯示來源。
- 範圍包含用火、農耕、陶器、冶金、文字、印刷、數學、天文、蒸汽動力、電力、通訊、交通、疫苗、抗生素、核能、半導體、電腦、網際網路、人工智慧與太空科技。

## 資料與續跑

- `scripts/v18c-tech.tsv`：504 筆編輯資料；`scripts/v18c-tech-places.json`：地點、座標、地區與既有政體對應。
- `scripts/v18c-tech-narratives.json`：44 筆專屬背景、經過及影響；其他項目由各自的技術成果、歷史影響及領域背景組成。
- `python3 scripts/expand-v18c-tech.py`：每約 30 筆保存資料與 `scripts/v18c-tech-progress.json`，續跑跳過已完成項目。再次續跑新增 0 筆，事件、詳細資料、ID 登錄及進度檔的 SHA-256 全部相同。
- `--refresh` 保留已登錄 ID，重新產生 TASK22 新增內容，寫入前檢查地點、領域、政體與字數；不修改原有 980 筆事件。
- 史前時間軸、年份輸入及捷徑擴展至早期用火證據，較晚年代保留較細操作刻度。
- 考古項目標示約略年代與遺存地點，不將保存下來的證據當作可確定的首次發明；史前參與方附上文化社群導覽說明。
- 本次續跑另外逐筆比對 HEAD：原有 980 筆事件、87 筆詳細資料與 1,080 筆 ID 登錄對應全部保留；續寫新增 0 筆，沒有重複加入已完成事件。
- 最後複核將盧安達無人機送血座標由吉佳利改為穆漢加（-2.08, 29.75），補上配送機制與公共衛生影響。
- 列昂諾夫項目改名為「列昂諾夫太空行走任務發射」，讓拜科努爾座標與發射事件一致，並說明後續艙外活動；保留原 ID，舊標題留作登錄別名。

- 本次年代複核將「殷墟青銅分鑄技術」由約西元前 1400 年調整為約西元前 1200 年，並補寫專屬背景、製範與分鑄經過及禮制影響；沿用原 ID。

## 驗證

- `npm run build`：通過。
- `npm run validate`：通過。
- `git diff --check`：通過。
- `python3 -m http.server 8000` 提供原始與 dist 網站。
- 全部 verify 執行命令：`DISPLAY= VERIFY_OUTPUT_DIR=artifacts/v18c-verification-task22-final python3 scripts/run-v18c-verification.py`。
- 以現有 Chrome 與軟體 WebGL 執行瀏覽器檢查；逐項輸出與結果保存在上述忽略目錄。
- 本次最終複核重新執行全部 18/18 個 verify：全部通過；結果紀錄與完成時間已同步更新至進度檔。

| Verify | 結果 |
| --- | --- |
| `verify-browser.cjs` | PASS |
| `verify-compact.cjs` | PASS |
| `verify-performance.cjs` | PASS |
| `verify-snapshots-v7.cjs` | PASS |
| `verify-static.py` | PASS |
| `verify-terminology.py` | PASS |
| `verify-timeline.cjs` | PASS |
| `verify-v11.cjs` | PASS |
| `verify-v11b.cjs` | PASS |
| `verify-v13.cjs` | PASS |
| `verify-v14.cjs` | PASS |
| `verify-v15.cjs` | PASS |
| `verify-v16.cjs` | PASS |
| `verify-v17.cjs` | PASS |
| `verify-v18b.cjs` | PASS |
| `verify-v18c.cjs` | PASS |
| `verify-v3.cjs` | PASS |
| `verify-v7.cjs` | PASS |
