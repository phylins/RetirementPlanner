# Retirement Planner v3.7 PWA

本版修正與調整：

- 「快速情境」改名為「淨資產試算」。
- 修正退休成功率數據不一致問題：首頁 KPI、退休時間最佳化 2026、退休決策矩陣改用同一組試算條件、同一組 deterministic seed 與同一回合數。
- 第一年提領率改用「年初可投資資產」作為分母，避免用年末資產造成數字偏差。
- 決策矩陣仍會依目前模式、支出策略、Dynamic COLA、股債配置、生活費、CAPE 與貸款條件同步重算。
- 版本與快取更新至 v3.7.0。

## 更新到 GitHub Pages

1. 解壓縮 ZIP。
2. 將所有檔案覆蓋到 GitHub repo 根目錄。
3. 確認根目錄 `index.html` 第一行包含 `v3.7 root index`。
4. Commit 後等待 Pages deployment 成功。
5. 若仍顯示舊版，請 `Ctrl + F5`，或清除 Service Worker / site data。
