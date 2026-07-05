# Retirement Planner v5.7 PWA

## v5.7 更新重點

- 左側欄位順序調整：`淨資產試算` → `模式` → `起始條件` → `收入與稅` → `股債現金` → `股票內部配置` → `債券內部配置`。
- `淨資產試算` 新增 2026 當下資產參考卡：
  - 淨資產：NT$139,769,290
  - 現金：NT$8,551,055
  - 投資：NT$182,697,522
  - 負債：NT$51,479,287
- 保留 v5.6 的股債現金連動、股票/債券內部配置等比例連動、Balanced Markov Regime 預設、市場模式、Dynamic COLA Freeze 以及 Portfolio Engine。
- 快取版本更新為 `v5.7.0`。

## GitHub Pages 更新方式

1. 解壓縮 ZIP。
2. 將解壓後的所有檔案與資料夾覆蓋到 GitHub repo 根目錄。
3. 確認 repo 根目錄的 `index.html` 第一行包含：

```html
<!-- Retirement Planner v5.7 root index...
```

4. Commit changes。
5. 等 GitHub Pages 部署成功。
6. 若畫面仍是舊版，請按 `Ctrl + F5`；若是 PWA 快取，請清除 Service Worker / site data 後重新開啟。

## 本機測試

```bash
python -m http.server 8000
```

或：

```bash
python3 -m http.server 8000
```

瀏覽器打開：

```text
http://localhost:8000
```
