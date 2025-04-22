import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState<'idle'|'saving'|'success'|'fail'>('idle');
  const [error, setError] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  // 簡單的加密函數
  const encryptApiKey = (key: string): string => {
    // 這是一個非常簡單的加密方法，僅用於基本混淆
    // 實際應用中應使用更強大的加密方法
    return btoa(key.split('').reverse().join(''));
  };

  // 簡單的解密函數
  const decryptApiKey = (encryptedKey: string): string => {
    try {
      const decoded = atob(encryptedKey);
      return decoded.split('').reverse().join('');
    } catch (e) {
      console.error('解密失敗', e);
      return '';
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem('gemini_api_key');
    if (stored) {
      try {
        const decrypted = decryptApiKey(stored);
        setApiKey(decrypted);
      } catch (e) {
        console.error('解密 API KEY 失敗', e);
        // 如果解密失敗，可能是舊版本未加密的 key，直接使用
        setApiKey(stored);
      }
    }
  }, []);

  const validateAndSave = async () => {
    setStatus('saving');
    setError('');
    const resp = await fetch('/api/gemini/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: apiKey.trim() })
    });
    const result = await resp.json();
    if (result.valid) {
      // 加密後存儲
      const encryptedKey = encryptApiKey(apiKey.trim());
      localStorage.setItem('gemini_api_key', encryptedKey);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
    } else {
      setStatus('fail');
      setError(result.message || 'API KEY 驗證失敗，請確認您的 KEY 是否正確且有權限。');
    }
  };

  return (
    <div className="container py-5">
      <div className="back-link mb-3">
        <a href="/" className="d-flex align-items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          返回首頁
        </a>
      </div>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="card-header">
          <h2 className="card-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            Google Gemini API KEY 設定
          </h2>
        </div>

        <div className="card-body">
          <div className="mb-4">
            <p>
              請於下方輸入您的 Gemini API KEY。
            </p>
            <div className="bg-info p-3 rounded-md mb-3">
              <h4 className="font-semibold mb-2">如何取得？</h4>
              <ol className="ml-4 list-decimal">
                <li className="mb-1">前往 <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" className="text-primary font-medium">
                  Google AI Studio - API Keys
                </a></li>
                <li className="mb-1">登入 Google 帳號，點選「Create API Key」</li>
                <li>複製產生的 API Key，貼到下方欄位</li>
              </ol>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="apiKey" className="d-block mb-2 font-medium">您的 Gemini API KEY</label>
            <div className="api-key-input-container">
              <input
                id="apiKey"
                type={showApiKey ? "text" : "password"}
                className="w-100 p-2 border rounded-md"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="請輸入您的 Gemini API KEY"
                disabled={status === 'saving'}
                autoComplete="off"
              />
              <button
                type="button"
                className="toggle-visibility-btn"
                onClick={() => setShowApiKey(!showApiKey)}
                title={showApiKey ? "隱藏 API KEY" : "顯示 API KEY"}
              >
                {showApiKey ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="d-flex align-items-center">
            <button
              className={`btn ${status === 'saving' ? 'btn-secondary' : 'btn-primary'}`}
              onClick={validateAndSave}
              disabled={status === 'saving'}
            >
              {status === 'saving' ? (
                <>
                  <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                  驗證中...
                </>
              ) : '儲存並驗證'}
            </button>

            {status === 'success' && (
              <div className="ml-3 text-success d-flex align-items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                驗證成功，已儲存！
              </div>
            )}

            {status === 'fail' && (
              <div className="ml-3 text-error d-flex align-items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="card-footer text-secondary">
          <div className="d-flex align-items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            您的 API KEY 只會儲存在本機瀏覽器，不會上傳到伺服器。
          </div>
        </div>
      </div>

      <style jsx>{`
        .spinner-border {
          display: inline-block;
          width: 1rem;
          height: 1rem;
          border: 0.2em solid currentColor;
          border-right-color: transparent;
          border-radius: 50%;
          animation: spinner-border .75s linear infinite;
        }

        @keyframes spinner-border {
          to { transform: rotate(360deg); }
        }

        .list-decimal {
          list-style-type: decimal;
        }

        .api-key-input-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .toggle-visibility-btn {
          position: absolute;
          right: 10px;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--color-text-secondary);
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color var(--transition-fast);
        }

        .toggle-visibility-btn:hover {
          color: var(--color-text-primary);
        }

        .toggle-visibility-btn:focus {
          outline: none;
          color: var(--color-primary);
        }
      `}</style>
    </div>
  );
}
