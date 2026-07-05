# Retirement Planner v3.9 PWA

## 更新重點

- 新增 Dynamic COLA Freeze 條件選擇欄位。
- 支援三種 Freeze 規則：
  - 寬鬆：通膨高、報酬差、提領率高，任一條件即暫停調升生活費。
  - 平衡：高通膨且報酬差同時發生，或提領率過高，才暫停調升生活費。
  - 嚴格：只有提領率過高才暫停調升生活費。
- 預設為「平衡」，較符合退休現金流規劃，不會因單一通膨高就過度壓低生活費。
- 快取版本更新到 v3.9.0。

## 使用

解壓縮後把所有檔案覆蓋到 GitHub repo 根目錄，確認 index.html 第一行包含 `v3.9 root index`，再 commit。

GitHub Pages 更新後若仍看到舊版，請 Ctrl+F5 或清除 Service Worker 快取。
