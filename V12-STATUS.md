# V12 狀態

修正事件數：138 件（依事件去重計算）。

已移除事件標題、摘要與描述中的行內「（待考）」「(待考)」「待考」標記。術語統一及事件產生腳本共用事件文字清理規則，避免重新產生標記。摩揭陀等名稱保留原詞；未將舊標記轉成未經確認的名稱考證狀態。事件前端無追加名稱標記的替換邏輯。政體資料與地圖標籤未變更。

驗證通過：

- `python3 scripts/build-static.py`
- `python3 scripts/validate-events.py`
- `python3 scripts/verify-terminology.py`
- `python3 scripts/verify-static.py`
- 比對修正前後事件，僅文字欄位移除標記，ID 與其他中繼資料不變。
- 檢查 dist 的 880 筆事件，title、summary、description 欄位含「待考」的筆數為 0。
- 全形括號、半形括號及裸標記清理檢查通過。
