# Retirement Planner v3.4 PWA

這是一個可維護的退休規劃 PWA 專案，支援本機執行、GitHub Pages 部署與離線使用。

## 功能

- 2026 起始可投資資產：可用拉桿與數值輸入調整，上限 3 億。
- 年收入：我的年收入、家人年收入，依簡化有效稅表估算稅後收入與年度新增投資。
- 六筆貸款逐年攤還：顯示年度還款與年底剩餘本金。
- 股債現金配置：預設 65 / 30 / 5。
- 股票內部配置：00631L 20%、VOO 40%、VTI 10%、VXUS 10%、SOXX 20%。
- 債券配置：IEF / TLT / VCIT / SGOV。
- 四種市場模式：Historical Backtest、Worst Historical、Regime Monte Carlo、Extreme Stress Test。
- 支出策略：Classic COLA、Dynamic COLA、Spending Smile、Guardrails。
- Dynamic COLA Freeze：遇到高通膨、組合下跌或提領率過高時，該年生活費不跟通膨上調。
- 資產曲線：P10 / P50 / P60。
- 退休時間最佳化：雙 Y 軸，左軸成功率，右軸第一年提領率。
- 退休決策矩陣：1.8 億到 3.0 億，每 0.2 億一跳。
- PWA：可安裝、可離線、設定可存到本機瀏覽器。

## 本機使用方式

### 方法 A：直接開啟

有些瀏覽器可以直接雙擊 `index.html` 開啟，但 Service Worker 與部分模組功能可能受限制。

### 方法 B：用 Python 開本機伺服器（建議）

Windows / Mac / Linux 皆可：

```bash
python -m http.server 8000
```

或：

```bash
python3 -m http.server 8000
```

然後開瀏覽器：

```text
http://localhost:8000
```

## GitHub Pages 部署

1. 建立 GitHub repository，例如 `RetirementPlanner`。
2. 將本專案所有檔案上傳到 repo 根目錄。
3. 到 GitHub repo：`Settings` → `Pages`。
4. Source 選 `Deploy from a branch`。
5. Branch 選 `main`，資料夾選 `/root`。
6. 等待 1 到 3 分鐘，GitHub 會給你網址：

```text
https://你的帳號.github.io/RetirementPlanner/
```

## 安裝成 App

部署到 GitHub Pages 後：

- Windows / Chrome：網址列右側會出現「安裝」圖示。
- Mac / Chrome：可安裝成桌面 App。
- iPhone Safari：分享 → 加入主畫面。
- Android Chrome：選單 → 安裝應用程式。

## 專案結構

```text
RetirementPlanner/
├── index.html
├── sw.js
├── package.json
├── README.md
├── public/
│   ├── manifest.json
│   └── icons/
├── data/
│   ├── assumptions.json
│   ├── loans.json
│   ├── portfolio.json
│   └── scenarios.json
└── src/
    ├── app.js
    ├── styles.css
    ├── components/
    │   └── chart.js
    ├── engines/
    │   ├── loanEngine.js
    │   ├── portfolioEngine.js
    │   ├── withdrawalEngine.js
    │   ├── simulationEngine.js
    │   └── optimizer.js
    └── utils/
        ├── format.js
        └── storage.js
```

## 後續建議開發

- v3.2：接入真實歷史報酬與 CPI 資料。
- v3.2：把 Monte Carlo 改成 Web Worker，提升速度。
- v3.4：加入完整 Scenario 儲存與比較。
- v4.0：串接 CAPE、VIX、10Y Yield 等市場資料。


## v3.4 更新重點

- 按下「儲存設定」後，改為顯示白底彈出視窗「設定已儲存」。
- `index.html` / `app.js` / `styles.css` / `sw.js` 版本升級至 v3.4，降低 GitHub Pages 與 PWA 快取抓舊版的機率。
- 可按「知道了」、點背景或按 Esc 關閉儲存成功視窗。

## v3.2 更新重點

- 修正多張 SVG 圖表空白或未渲染的問題，加入 chart error fallback。
- 年度支出、貸款餘額、退休時間最佳化圖表改用更穩定的原生 SVG renderer。
- Portfolio Engine 加入中文標的說明：00631L、VOO、VTI、VXUS、SOXX、IEF、TLT、VCIT、SGOV、現金。
- PWA cache 版本升級到 v3.4；若瀏覽器仍顯示舊版，請按 Ctrl+F5 或重新安裝 PWA。


## v3.2 更新
- 修正 PWA/Service Worker 快取造成的舊版 JS/CSS 被沿用問題。
- 圖表改成 requestAnimationFrame 後渲染，避免容器寬度尚未完成計算時空白。
- 左側 ETF 控制項加入中文標的名稱與市場/產業說明。
- Service Worker 改為 JS/CSS/data network-first，更新 GitHub Pages 後更容易抓到新版。

## v3.4 緊急修正版：根目錄部署檢查

如果網站打開只看到 `export const clamp...`，代表 GitHub repo 根目錄的 `index.html` 被錯誤覆蓋成 `src/utils/format.js` 的內容。

正確做法：
1. 解壓縮本 ZIP。
2. 打開解壓後的資料夾，應直接看到 `index.html`, `sw.js`, `src/`, `data/`, `public/`。
3. 將這些檔案與資料夾「直接覆蓋」到 GitHub repo 根目錄。
4. 到 GitHub repo 點開根目錄 `index.html`，第一行應該是 `<!-- Retirement Planner v3.4 root index... -->`，第二行是 `<!doctype html>`。
5. Commit 後等待 GitHub Pages deploy 成功。
6. 開網址後按 `Ctrl + F5`；必要時清除 Service Worker。

