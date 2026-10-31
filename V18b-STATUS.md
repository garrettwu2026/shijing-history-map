# V18b / TASK21 狀態：1,187 篇，尚未達目標

本輪從 **1,184 篇**完整介紹出發，新增 **3 篇**，目前共 **1,187 篇**；距離 1,500 篇仍差 **313 篇**。TASK21 尚未完成。原有 1,184 篇逐筆 JSON 比較完全一致。沒有 commit 或 push。

## 數量

| 項目 | 數量 |
| --- | ---: |
| 政體目錄 ID | 2997 |
| 已標有中文名的 ID | 1330 |
| untranslated ID | 1667 |
| TASK20 原始介紹基準 | 214 |
| TASK21 原始開始介紹數 | 300 |
| 本輪開始介紹數 | 1184 |
| 介紹總數／完整介紹 | 1187 |
| 本輪新增 | 3 |
| 相對 TASK20 原始基準新增 | 973 |
| TASK21 累計新增 | 887 |
| 已有譯名但尚無介紹 | 143 |
| 距離 1500 篇 | 313 |
| 事件總數 | 980 |
| 相對 TASK20 基準新增事件 | 100 |
| 事件詳情總數 | 87 |
| 原有事件具詳情 | 70 |
| 新增事件具詳情 | 17 |

| 欄位 | 具備此欄位的介紹 |
| --- | ---: |
| summary | 1187 |
| 年表 | 1187 |
| 重要人物 | 1187 |
| 關鍵數據 | 33 |
| 背景 | 1187 |
| 影響 | 1187 |

## 本輪內容與保存

新增末羅、首羅犀那、般遮羅，以一批 3 筆保存並同步更新進度。摘要 150–300 字、年表 5–10 項、人物 3–8 位、背景與影響各 60–150 字。無可靠量值的關鍵數據依 TASK20 例外省略。

末羅明示佛滅紀年的爭議，年表以約前 400 年表示同一傳統中的最後旅程、入滅、葬禮及舍利分配，不宣稱精確西元年。首羅犀那區分早期王國與摩偷羅後續地方史，黑天標示為神祇。般遮羅區分吠陀時代、早期國家及後世地方王權，木柱王與黑公主明示為史詩人物，未列為可確定年代的歷史君主。外部見聞者、宗教人物與征服者均註明角色。

沒有修改政體目錄、詞彙表、既有完整介紹、事件資料、驗證門檻或 UI。編輯查核連結保存在 `artifacts/v21-task21i/editorial-review.json`，未放入 UI 資料。

目前僅 1,330 個目錄 ID 標有中文名；即使全部補齊，仍比 1,500 篇少 170 個。剩餘 143 個已譯名候選依重要性與快照跨度排序存於 `artifacts/v21-task21i/remaining-translated.json`。其中包含考古文化、語族、地理標籤與史料不足的政體。不以快照年份冒充建國年，不為湊數編造君主或音譯。本輪沒有完成對全部未譯名 ID 的中文名稱考證，不能宣稱已覆蓋所有可寫政體。

## 驗證

- `python3 scripts/build-static.py`：通過。
- `npm run validate`：未通過；既有事件詳情只有 87 筆，未達 300 筆門檻，未降低驗證要求。
- 單獨執行介紹、內容語意、事件結構、v3、靜態資產及術語驗證：全部通過。
- 全部 15 支 `scripts/verify-*.cjs`：15/15 通過，未修改斷言。
- localhost:8000 專案根目錄服務正常，沿用既有服務。
- 續跑新增 0 筆，介紹與進度檔雜湊不變；原有 1,184 篇逐筆 JSON 比較一致。
- `git diff --check`：通過。

完整執行結果與日誌在 `artifacts/v21-task21i/checks.json` 及同目錄各 `.log`；續跑雜湊在 `resume-check.json`，編輯比較與查核在 `editorial-review.json`。

| 命令 | 結果 |
| --- | --- |
| `python3 scripts/build-static.py` | 通過 |
| `npm run validate` | 未通過 |
| `python3 scripts/validate-intros.py` | 通過 |
| `python3 scripts/validate-content.py` | 通過 |
| `python3 scripts/validate-events.py` | 通過 |
| `python3 scripts/validate-v3.py` | 通過 |
| `python3 scripts/verify-static.py` | 通過 |
| `python3 scripts/verify-terminology.py` | 通過 |
| `dbus-run-session -- xvfb-run -a node scripts/verify-browser.cjs` | 通過 |
| `dbus-run-session -- xvfb-run -a node scripts/verify-compact.cjs` | 通過 |
| `dbus-run-session -- xvfb-run -a node scripts/verify-performance.cjs` | 通過 |
| `dbus-run-session -- xvfb-run -a node scripts/verify-snapshots-v7.cjs` | 通過 |
| `dbus-run-session -- xvfb-run -a node scripts/verify-timeline.cjs` | 通過 |
| `dbus-run-session -- xvfb-run -a node scripts/verify-v11.cjs` | 通過 |
| `dbus-run-session -- xvfb-run -a node scripts/verify-v11b.cjs` | 通過 |
| `dbus-run-session -- xvfb-run -a node scripts/verify-v13.cjs` | 通過 |
| `dbus-run-session -- xvfb-run -a node scripts/verify-v14.cjs` | 通過 |
| `dbus-run-session -- xvfb-run -a node scripts/verify-v15.cjs` | 通過 |
| `dbus-run-session -- xvfb-run -a node scripts/verify-v16.cjs` | 通過 |
| `dbus-run-session -- xvfb-run -a node scripts/verify-v17.cjs` | 通過 |
| `dbus-run-session -- xvfb-run -a node scripts/verify-v18b.cjs` | 通過 |
| `dbus-run-session -- xvfb-run -a node scripts/verify-v3.cjs` | 通過 |
| `dbus-run-session -- xvfb-run -a node scripts/verify-v7.cjs` | 通過 |

`scripts/v18b-progress.json` 維持 `in-progress`。可用 `python3 scripts/expand-v21.py` 續跑，完整條目會跳過；要繼續增加內容須先補入經審核的新稿。1,187 篇並非 TASK21 完成結果。
