import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { exportDatabase as exportFirebaseDb, importDatabase as importFirebaseDb } from '../firebase/database';
import storageBridge from '../utils/storage-bridge';
import QRCodeGenerator from '../components/qrcode/QRCodeGenerator';
import QRCodeScanner from '../components/qrcode/QRCodeScanner';
import AuthModal from '../components/auth/AuthModal';

export default function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState<'idle'|'saving'|'success'|'fail'>('idle');
  const [error, setError] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  // 資料庫匯出/匯入相關狀態
  const [dbStatus, setDbStatus] = useState<'idle'|'exporting'|'importing'|'success'|'fail'>('idle');
  const [dbError, setDbError] = useState('');
  const [dbSuccess, setDbSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 身份驗證相關狀態
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, loading: authLoading, signOut } = useAuth();

  // QR 碼相關狀態
  const [qrCodeTab, setQrCodeTab] = useState<'generate' | 'scan'>('generate');

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
    const loadApiKey = async () => {
      // 優先從 Firebase 獲取
      if (user) {
        try {
          const key = await storageBridge.getItem('gemini_api_key');
          if (key) {
            try {
              const decrypted = decryptApiKey(key);
              setApiKey(decrypted);
              return;
            } catch (e) {
              console.error('解密 API KEY 失敗', e);
              // 如果解密失敗，可能是舊版本未加密的 key，直接使用
              setApiKey(key);
              return;
            }
          }
        } catch (e) {
          console.error('從 Firebase 獲取 API KEY 失敗', e);
        }
      }

      // 從 localStorage 獲取
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
    };

    loadApiKey();
  }, [user]);

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

      // 儲存到 localStorage
      localStorage.setItem('gemini_api_key', encryptedKey);

      // 如果用戶已登入，也儲存到 Firebase
      if (user) {
        try {
          await storageBridge.setItem('gemini_api_key', encryptedKey);
        } catch (e) {
          console.error('儲存 API KEY 到 Firebase 失敗', e);
        }
      }

      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
    } else {
      setStatus('fail');
      setError(result.message || 'API KEY 驗證失敗，請確認您的 KEY 是否正確且有權限。');
    }
  };

  // 匯出資料庫
  const exportDatabase = async () => {
    try {
      setDbStatus('exporting');
      setDbError('');
      setDbSuccess('');

      // 如果用戶已登入，從 Firebase 匯出
      let data: Record<string, any> = {};
      if (user) {
        try {
          data = await exportFirebaseDb();
        } catch (e) {
          console.error('從 Firebase 匯出資料庫失敗', e);
          // 如果從 Firebase 匯出失敗，回退到從 localStorage 匯出
          data = {};
        }
      }

      // 合併 localStorage 數據
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          if (!data.storage) {
            data.storage = {};
          }
          data.storage[key] = localStorage.getItem(key);
        }
      }

      // 創建一個包含時間戳的檔案名
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `stock-analysis-backup-${timestamp}.json`;

      // 將數據轉換為 JSON 並創建下載連結
      const jsonData = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // 創建一個臨時的下載連結並觸發下載
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // 清理
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setDbStatus('success');
        setDbSuccess('資料庫匯出成功！');
        setTimeout(() => {
          setDbStatus('idle');
          setDbSuccess('');
        }, 2000);
      }, 100);
    } catch (e) {
      console.error('匯出資料庫失敗', e);
      setDbStatus('fail');
      setDbError(`匯出資料庫失敗: ${e.message}`);
    }
  };

  // 觸發檔案選擇器
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 匯入資料庫
  const importDatabase = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setDbStatus('importing');
    setDbError('');
    setDbSuccess('');

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        // 確認匯入
        if (!confirm('匯入將會覆蓋現有的所有資料，確定要繼續嗎？')) {
          setDbStatus('idle');
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          return;
        }

        // 如果用戶已登入，匯入到 Firebase
        if (user) {
          try {
            await importFirebaseDb(data);
          } catch (e) {
            console.error('匯入資料庫到 Firebase 失敗', e);
            setDbStatus('fail');
            setDbError(`匯入資料庫到 Firebase 失敗: ${e.message}`);

            // 重置檔案輸入
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
            return;
          }
        }

        // 將數據寫入 localStorage
        if (data.storage) {
          Object.keys(data.storage).forEach(key => {
            if (data.storage[key] !== null) {
              localStorage.setItem(key, data.storage[key]);
            }
          });
        } else {
          // 兼容舊版本的備份格式
          Object.keys(data).forEach(key => {
            if (data[key] !== null) {
              localStorage.setItem(key, data[key]);
            }
          });
        }

        // 同步 localStorage 和 Firebase
        if (user) {
          await storageBridge.sync();
        }

        setDbStatus('success');
        setDbSuccess('資料庫匯入成功！請重新整理頁面以套用新資料。');

        // 重置檔案輸入
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        // 3 秒後重新整理頁面
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } catch (e) {
        console.error('匯入資料庫失敗', e);
        setDbStatus('fail');
        setDbError(`匯入資料庫失敗: ${e.message}`);

        // 重置檔案輸入
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.onerror = () => {
      setDbStatus('fail');
      setDbError('讀取檔案失敗');

      // 重置檔案輸入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="py-5">
      {/* 移除返回首頁連結，確保與其他頁面一致 */}

      <div className="settings-cards">
        {/* 用戶身份驗證卡片 */}
        <div className="card mb-4">
          <div className="card-header">
            <h2 className="card-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              用戶帳號
            </h2>
          </div>

          <div className="card-body">
            <div className="mb-4">
              <p>
                登入您的帳號以在雲端同步您的資料，並在多個裝置上使用。
              </p>
              <div className="bg-info p-3 rounded-md mb-3">
                <h4 className="font-semibold mb-2">雲端同步功能</h4>
                <ul className="ml-4 list-disc">
                  <li className="mb-1">自動備份您的資料到雲端</li>
                  <li className="mb-1">在多個裝置上同步您的持股和交易記錄</li>
                  <li>使用 QR 碼快速在新裝置上載入您的資料</li>
                </ul>
              </div>
            </div>

            {authLoading ? (
              <div className="flex justify-center items-center py-4">
                <span className="spinner-border mr-2" role="status" aria-hidden="true"></span>
                <span>載入中...</span>
              </div>
            ) : user ? (
              <div className="user-info">
                <div className="flex items-center mb-4">
                  <div className="avatar placeholder mr-3">
                    <div className="bg-neutral-focus text-neutral-content rounded-full w-12">
                      <span>{user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}</span>
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold">{user.displayName || '用戶'}</div>
                    <div className="text-sm opacity-70">{user.email}</div>
                  </div>
                </div>

                <button
                  className="btn btn-outline btn-error"
                  onClick={async () => {
                    try {
                      await signOut();
                    } catch (e) {
                      console.error('登出失敗', e);
                    }
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  登出
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  className="btn btn-primary"
                  onClick={() => setShowAuthModal(true)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                    <polyline points="10 17 15 12 10 7"></polyline>
                    <line x1="15" y1="12" x2="3" y2="12"></line>
                  </svg>
                  登入
                </button>
              </div>
            )}
          </div>

          <div className="card-footer text-secondary">
            <div className="d-flex align-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              您的資料將使用 Firebase 安全加密存儲。
            </div>
          </div>
        </div>

        {/* API KEY 設定卡片 */}
        <div className="card mb-4">
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

        {/* QR 碼功能卡片 */}
        {user && (
          <div className="card mb-4">
            <div className="card-header">
              <h2 className="card-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <rect x="7" y="7" width="3" height="3"></rect>
                  <rect x="14" y="7" width="3" height="3"></rect>
                  <rect x="7" y="14" width="3" height="3"></rect>
                  <rect x="14" y="14" width="3" height="3"></rect>
                </svg>
                QR 碼管理
              </h2>
            </div>

            <div className="card-body">
              <div className="mb-4">
                <p>
                  使用 QR 碼快速在不同裝置間同步您的資料庫。
                </p>
                <div className="bg-info p-3 rounded-md mb-3">
                  <h4 className="font-semibold mb-2">使用方式</h4>
                  <ul className="ml-4 list-disc">
                    <li className="mb-1">生成 QR 碼並保存或截圖</li>
                    <li className="mb-1">在其他裝置上掃描此 QR 碼</li>
                    <li>您的資料將自動同步到新裝置</li>
                  </ul>
                </div>
              </div>

              <div className="tabs tabs-boxed mb-4">
                <a
                  className={`tab ${qrCodeTab === 'generate' ? 'tab-active' : ''}`}
                  onClick={() => setQrCodeTab('generate')}
                >
                  生成 QR 碼
                </a>
                <a
                  className={`tab ${qrCodeTab === 'scan' ? 'tab-active' : ''}`}
                  onClick={() => setQrCodeTab('scan')}
                >
                  掃描 QR 碼
                </a>
              </div>

              {qrCodeTab === 'generate' ? (
                <QRCodeGenerator />
              ) : (
                <QRCodeScanner />
              )}
            </div>

            <div className="card-footer text-secondary">
              <div className="d-flex align-items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                QR 碼包含您的用戶 ID，可用於在其他裝置上載入您的資料。
              </div>
            </div>
          </div>
        )}

        {/* 資料庫匯出/匯入卡片 */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34"></path>
                <polygon points="18 2 22 6 12 16 8 16 8 12 18 2"></polygon>
              </svg>
              資料庫管理
            </h2>
          </div>

          <div className="card-body">
            <div className="mb-4">
              <p>
                您可以匯出目前的資料庫以進行備份，或從備份檔案中匯入資料。
              </p>
              <div className="bg-info p-3 rounded-md mb-3">
                <h4 className="font-semibold mb-2">注意事項</h4>
                <ul className="ml-4 list-disc">
                  <li className="mb-1">匯出的資料包含您的所有持股、交易記錄和設定</li>
                  <li className="mb-1">匯入資料將會覆蓋目前的所有資料</li>
                  <li>建議定期匯出資料以防資料遺失</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                className={`btn ${dbStatus === 'exporting' ? 'btn-secondary' : 'btn-primary'}`}
                onClick={exportDatabase}
                disabled={dbStatus === 'exporting' || dbStatus === 'importing'}
              >
                {dbStatus === 'exporting' ? (
                  <>
                    <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                    匯出中...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    匯出資料庫
                  </>
                )}
              </button>

              <button
                className={`btn ${dbStatus === 'importing' ? 'btn-secondary' : 'btn-outline'}`}
                onClick={triggerFileInput}
                disabled={dbStatus === 'exporting' || dbStatus === 'importing'}
              >
                {dbStatus === 'importing' ? (
                  <>
                    <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                    匯入中...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    匯入資料庫
                  </>
                )}
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={importDatabase}
                accept=".json"
                style={{ display: 'none' }}
              />
            </div>

            {(dbStatus === 'success' || dbStatus === 'fail') && (
              <div className={`mt-3 ${dbStatus === 'success' ? 'text-success' : 'text-error'} d-flex align-items-center`}>
                {dbStatus === 'success' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                )}
                {dbStatus === 'success' ? dbSuccess : dbError}
              </div>
            )}
          </div>

          <div className="card-footer text-secondary">
            <div className="d-flex align-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              所有資料僅儲存在您的瀏覽器中，建議定期匯出備份。
            </div>
          </div>
        </div>
      </div>

      {/* 身份驗證模態框 */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      <style jsx>{`
        .settings-cards {
          max-width: 800px;
          margin: 0 auto;
        }

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

        .list-disc {
          list-style-type: disc;
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

        .gap-3 {
          gap: 0.75rem;
        }

        .mt-3 {
          margin-top: 0.75rem;
        }
      `}</style>
    </div>
  );
}
