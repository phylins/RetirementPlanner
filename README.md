# Retirement Planner v3.8 PWA

## 更新內容

- 左側「淨資產試算」移到最上方，方便快速切換情境。
- 右側主內容改為完整欄寬顯示順序：
  1. Portfolio Engine
  2. 退休決策矩陣
  3. 年度支出與貸款明細
- Portfolio Engine 不再與退休決策矩陣左右並排，改成完整寬度：左側顯示標的與市場說明，右側顯示 CAGR / 波動 / Sharpe 貢獻表。
- 保留 v3.7 的一致性修正：KPI、退休時間最佳化、退休決策矩陣使用同一組條件與 seed。
- 快取版本更新到 v3.8.0。

## GitHub Pages 更新方式

1. 解壓縮 ZIP。
2. 將解壓後所有檔案覆蓋到 GitHub repo 根目錄。
3. 確認根目錄 `index.html` 第一行含有 `v3.8 root index`。
4. Commit changes。
5. 等 GitHub Pages build/deploy 成功。
6. 瀏覽器按 `Ctrl + F5`，必要時清除 Service Worker 快取。
