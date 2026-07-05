# Retirement Planner v3.6 PWA

## v3.6 更新

- 圖表新增 hover tooltip：滑鼠移到資料點附近會顯示該年份與各條線/柱狀數值。
- 退休決策矩陣改成完整展開顯示，不再使用內部捲軸。
- 在左側控制區新增 Dynamic COLA Freeze、Shiller CAPE、Spending Smile 中文簡介。
- Portfolio Engine 將 CAGR 貢獻、波動/風險貢獻、Sharpe 貢獻整合成同一張表格。
- Portfolio Engine 表格欄位可點選排序，支援升冪/降冪。
- PWA cache 版本更新到 v3.6.0。

## 更新到 GitHub Pages

1. 解壓縮 ZIP。
2. 將解壓後的 `index.html`, `sw.js`, `src/`, `data/`, `public/`, `package.json`, `README.md` 覆蓋到 GitHub repo 根目錄。
3. 確認 repo 根目錄的 `index.html` 第一行包含 `v3.6 root index`。
4. Commit changes。
5. 等 GitHub Actions / Pages 部署成功。
6. 開啟網站後按 `Ctrl + F5`。若仍顯示舊版，請清除網站資料或 unregister service worker。

## 本機測試

```bash
python -m http.server 8000
```

或：

```bash
python3 -m http.server 8000
```

瀏覽器開啟：

```text
http://localhost:8000
```
