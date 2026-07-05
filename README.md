# Retirement Planner v5.3 PWA

## v5.3 更新重點

- 版本號正式升級為 `v5.3.0`，不再使用 4.x。
- 左側控制欄取消內部捲軸，全部欄位跟著主頁面一起捲動。
- 頁面右上新增版本與最後更新時間，方便確認 GitHub Pages / PWA 是否抓到新版。
- 新增 CSV 匯出：
  - 年度支出與貸款明細
  - 退休決策矩陣
- 新增「模型診斷」區，快速指出目前退休壓力來源：提領壓力、貸款壓力、高波動資產與退休門檻。
- 保留 v3.9 / v4.0 功能：淨資產試算、Dynamic COLA Freeze 條件、Portfolio Engine、退休決策矩陣、年度支出與貸款明細、PWA 快取版本更新。

## 使用方式

本機測試：

```bash
python -m http.server 8000
```

或：

```bash
python3 -m http.server 8000
```

瀏覽器開：

```text
http://localhost:8000
```

## GitHub Pages 更新方式

1. 解壓縮 ZIP。
2. 將解壓後的所有檔案與資料夾覆蓋到 GitHub repo 根目錄。
3. 確認根目錄的 `index.html` 第一行是：

```html
<!-- Retirement Planner v5.3 root index...
```

4. Commit / Push。
5. 等 GitHub Actions 的 `pages build and deployment` 變綠色成功。
6. 開網站後按 `Ctrl + F5`，或清除 PWA / Service Worker 快取。

## 注意

如果打開 GitHub Pages 看到 JavaScript 文字而不是網頁，代表 repo 根目錄的 `index.html` 被錯誤覆蓋成其他 JS 檔案。請重新覆蓋本 ZIP 根目錄的 `index.html`。


## v5.3 更新

- 年度生活費預設值改為 NT$500 萬。
- 年度支出與貸款圖表新增右側 Y 軸，顯示每年通膨率。
- 年度支出明細新增通膨與 Freeze 欄位，方便檢查生活費是否因通膨或 Dynamic COLA Freeze 調整。
- 圖表 hover tooltip 會一起顯示通膨率。

注意：如果瀏覽器已經儲存過舊設定，且生活費仍為舊版預設 600 萬，v5.3 會自動遷移成 500 萬；若你曾手動改成其他數字則會保留。


## v5.3 更新

- Dynamic COLA Freeze 的觸發門檻可在左側直接調整：
  - Freeze 通膨門檻 (%)
  - Freeze 股票跌幅門檻 (%)
  - Freeze 債券跌幅門檻 (%)
  - Freeze 提領率門檻 (%)
- Freeze 判斷不再只看整體組合報酬，會分別檢查股票與債券報酬。
- 年度支出與貸款明細新增「股票報酬」「債券報酬」欄位，方便檢查是哪一個條件觸發 Freeze。
- CSV 匯出同步加入股票報酬與債券報酬。

### Freeze 規則說明

- 寬鬆：通膨高、股票跌幅過大、債券跌幅過大、提領率過高，任一條件成立就暫停生活費上調。
- 平衡：高通膨且股票或債券其中一項跌破門檻，或提領率過高，才暫停生活費上調。
- 嚴格：只有提領率過高才暫停生活費上調。

## v5.3 股債現金連動修正

## v5.3 更新

- 修正股 / 債 / 現金比例連動。
- 現金比例改成數值欄位輸入，不再使用拉桿。
- 拉動「股票比例」時，債券比例會自動調整，確保 股票 + 債券 + 現金 = 100%。
- 拉動「債券比例」時，股票比例會自動調整。
- 修改現金比例時，股票與債券會依原本相對比例重新分配剩餘比重。
- 更新版本與快取為 v5.3.0。
