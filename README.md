# AI Stock Analysis Web App

## 執行步驟

1. **安裝依賴**

在專案根目錄執行：

```
npm install
```

2. **啟動開發伺服器**

```
npm run dev
```

3. **開啟瀏覽器**

預設網址：http://localhost:3000

4. **首次使用**
- 請點選右上角「設定」頁，輸入並驗證您的 Google Gemini API KEY
- 取得方式：
  - 前往 [Google AI Studio - API Keys](https://aistudio.google.com/app/apikey)
  - 建立 API KEY 並複製貼上

---

## 其他說明
- 若需 K 線圖，建議安裝 `chartjs-chart-financial` 並於 `ChartPanel.tsx` 引入
- 若需串接 Alpha Vantage/Yahoo Finance，請於 `.env` 設定 API KEY
- 本專案僅供學術與技術交流，請勿用於商業投資決策
