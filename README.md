# AI 股票分析應用

這是一個使用 Next.js 開發的股票分析應用程式，提供股票投資組合管理、交易記錄和分析功能。

## 功能

- 持股管理
- 交易記錄
- 股票分析
- 股息追蹤
- 即時股價更新
- Firebase 雲端同步
- QRCode 資料庫分享

## 本地開發

1. **安裝依賴**

在專案根目錄執行：

```
npm install
```

2. **設定環境變數**

創建 `.env.local` 檔案並設定環境變數：

```
# Alpha Vantage API Key
ALPHA_VANTAGE_KEY=您的API金鑰

# Firebase 配置
NEXT_PUBLIC_FIREBASE_API_KEY=您的Firebase API Key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=您的Firebase Auth Domain
NEXT_PUBLIC_FIREBASE_DATABASE_URL=您的Firebase Database URL
NEXT_PUBLIC_FIREBASE_PROJECT_ID=您的Firebase Project ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=您的Firebase Storage Bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=您的Firebase Messaging Sender ID
NEXT_PUBLIC_FIREBASE_APP_ID=您的Firebase App ID
```

3. **啟動開發伺服器**

```
npm run dev
```

4. **開啟瀏覽器**

預設網址：http://localhost:3000

5. **首次使用**
- 請點選右上角「設定」頁，輸入並驗證您的 Google Gemini API KEY
- 取得方式：
  - 前往 [Google AI Studio - API Keys](https://aistudio.google.com/app/apikey)
  - 建立 API KEY 並複製貼上
- 若要使用 Firebase 雲端同步功能：
  - 在「設定」頁面點擊「登入」按鈕
  - 註冊或登入您的帳號
  - 登入後即可使用 QRCode 功能和雲端同步

## 部署到 Vercel

### 自動部署（推薦）

1. 在 GitHub 上創建一個新的儲存庫並推送您的代碼
2. 在 [Vercel](https://vercel.com) 上註冊並連接您的 GitHub 帳戶
3. 導入您的儲存庫
4. 在部署設定中，添加環境變數：
   - `ALPHA_VANTAGE_KEY`: 您的 Alpha Vantage API 金鑰
   - 所有 Firebase 相關的環境變數（如上述 `.env.local` 中所列）
5. 點擊部署

### 手動部署

1. 安裝 Vercel CLI：

```bash
npm install -g vercel
```

2. 登入 Vercel：

```bash
vercel login
```

3. 部署應用程式：

```bash
vercel
```

4. 按照提示設定環境變數

## 環境變數

- `ALPHA_VANTAGE_KEY`: Alpha Vantage API 金鑰，用於獲取股票數據
- `NEXT_PUBLIC_FIREBASE_API_KEY`: Firebase API Key
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: Firebase Auth Domain
- `NEXT_PUBLIC_FIREBASE_DATABASE_URL`: Firebase Realtime Database URL
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Firebase Project ID
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: Firebase Storage Bucket
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: Firebase Messaging Sender ID
- `NEXT_PUBLIC_FIREBASE_APP_ID`: Firebase App ID

---

## 其他說明
- 若需 K 線圖，建議安裝 `chartjs-chart-financial` 並於 `ChartPanel.tsx` 引入
- 若需串接 Alpha Vantage/Yahoo Finance，請於 `.env` 設定 API KEY
- 本專案僅供學術與技術交流，請勿用於商業投資決策
