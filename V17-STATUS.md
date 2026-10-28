# V17 完成狀態

- 已完成：所有政體彈窗加入同樣的兩個緊湊查詢按鈕「Google 搜尋」、「維基百科」。採用既有中文顯示名，移除顯示附註後編碼；待考名稱仍保留查詢入口。Google 編碼完整的「名稱 歷史」，維基百科採用搜尋端點與 `variant=zh-tw`；兩者皆為 `target="_blank" rel="noopener"`。
- 已完成：自託管 Noto Sans Mongolian 的 WOFF2 子集，17,700 位元組。掃描所有 `data/*.json` 字串，納入實際出現的滿文、蒙古文字元及塑形控制字元，共 27 個碼位；保留 OpenType 塑形替代字形，並附完整 SIL OFL 1.1 授權。重建工具為 `scripts/subset-mongolian.py`，使用方式見 `assets/fonts/README.md`。
- 已完成：字型以專用元素類別、`font-display: swap`、`unicode-range` 按需下載。建置會複製授權與字型，為 WOFF2 加上 SHA-256 前 16 碼指紋，CSS 自動引用指紋路徑；Render 設定一年 immutable 快取。
- 已完成：泰國與暹羅兩個既有政體 ID 均依選取年套用自稱期間：1782–1938 為 `สยาม`（Sayam，暹羅）、1939–1944 為 `ประเทศไทย`、1945–1948 為 `สยาม`、1949 年起為 `ประเทศไทย`。年度介面依更名發生年使用新名，未假裝具有日級精度；1782 年前不額外推定。
- 已完成：逐項檢視其餘自稱期間；僅另外修正確定的中斷：法蘭西王國不再跨越 1793–1813 的共和與帝國時期，匈牙利王國不再涵蓋 1919 年。其餘未確定需要更動的項目保留原值。
- 已完成：移除既有政體勘誤、事件與南極洲彈窗的來源連結，資料中的查證欄位仍保留；查詢按鈕屬使用者主動開啟的外部搜尋入口。
- 已完成：保留全部既有資料名稱、中文名與 ID；未改動地圖主體與時間軸尺寸；未提交、未推送。

## 驗證

`verify-v17.cjs` 檢查清朝、東羅馬帝國、羅馬帝國的按鈕、文字、完整編碼網址與新分頁屬性；檢查非相關彈窗不下載字型、滿文與蒙古文字型確實載入且量測不同於缺字方框；使用 Chrome 字型診斷確認正式建置的字型實際繪製字形；檢查字型大小、內容指紋、授權檔、泰國各更名邊界年及實際彈窗顯示。

已通過 `python3 scripts/build-static.py`、`npm run validate`，以及以專案根目錄於 `localhost:8000` 提供服務的全部 14 支 `scripts/verify-*.cjs`：

`verify-browser`、`verify-compact`、`verify-performance`、`verify-snapshots-v7`、`verify-timeline`、`verify-v3`、`verify-v7`、`verify-v11`、`verify-v11b`、`verify-v13`、`verify-v14`、`verify-v15`、`verify-v16`、`verify-v17`。

自稱資料目前涵蓋 83 個政體 ID、92 個期間。`artifacts/v17-report.json` 記錄本次結果。
