# V8 版面修正

- 工具列與 Leaflet 縮放控制保留間距，按鈕至少 44 × 44px；手機展開事件面板時隱藏背後的工具列與縮放控制。
- 桌面與手機收合時間軸均為 62px。年份與疆界年份同列顯示，過長文字以省略號呈現；±1 年與快照切換移入「設定」，其他功能保留。
- 方向鍵在時間滑桿上每次增減一年，並保留焦點。
- 原本被時間軸遮住的地圖出處移入「設定」。介面維持臺灣繁體中文。
- 已執行 npm install、python3 scripts/build-static.py、node scripts/verify-v7.cjs。驗證改用 Playwright 管理的 Chromium，移除固定 Chrome 路徑。
- 1440×900、390×844、320×568 全數通過：時間軸高度 ≤72px、工具列／縮放／事件列無重疊、44px 操作目標、無水平溢出、無主控台或頁面錯誤；既有政體搜尋、事件、快照、焦點、底圖重試檢查亦通過。
- 截圖：artifacts/v8-1440x900.png、artifacts/v8-390x844.png、artifacts/v8-320x568.png；另存 overview 與 detail 截圖。報告：artifacts/v8-browser-report.json。
- 未執行 git commit。
