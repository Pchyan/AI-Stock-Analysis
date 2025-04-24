import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { loadDatabaseFromQRCode } from '../../utils/qrcode';
import { importDatabase } from '../../firebase/database';
import { useAuth } from '../../contexts/AuthContext';
import storageBridge from '../../utils/storage-bridge';

// 檢查是否在瀏覽器環境中
const isBrowser = typeof window !== 'undefined';

export default function QRCodeScanner() {
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState<string>('');
  const [showManualInput, setShowManualInput] = useState<boolean>(false);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);

  const manualInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();

  useEffect(() => {
    // 組件卸載時停止掃描
    return () => {
      if (scanner && isScanning) {
        try {
          scanner.stop().catch(err => {
            // 忽略錯誤，因為掃描器可能已經停止
            console.log('清理掃描器時發生錯誤，可能掃描器已經停止');
          });
        } catch (err) {
          // 忽略錯誤
          console.log('清理掃描器時發生錯誤，可能掃描器已經停止');
        }
      }
    };
  }, [scanner, isScanning]);

  const startScanning = () => {
    if (!isBrowser) return;

    if (!user) {
      setError('請先登入以使用掃描功能');
      return;
    }

    setError(null);
    setSuccess(null);
    setScannedData(null);
    setIsScanning(true);

    const html5QrCode = new Html5Qrcode('qr-reader');
    setScanner(html5QrCode);

    html5QrCode.start(
      { facingMode: 'environment' },
      {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      },
      (decodedText) => {
        // 成功掃描
        setScannedData(decodedText);
        stopScanning(html5QrCode);
      },
      (errorMessage) => {
        // 掃描過程中的錯誤，通常不需要處理
        console.log(errorMessage);
      }
    ).catch(err => {
      setError('啟動掃描失敗: ' + err.message);
      setIsScanning(false);
    });
  };

  const stopScanning = (scannerInstance: Html5Qrcode | null = scanner) => {
    if (scannerInstance && isScanning) {
      try {
        scannerInstance.stop().then(() => {
          setIsScanning(false);
        }).catch(err => {
          // 忽略錯誤，因為掃描器可能已經停止
          console.log('停止掃描時發生錯誤，可能掃描器已經停止');
          setIsScanning(false);
        });
      } catch (err) {
        // 如果發生錯誤，直接設置狀態
        console.log('停止掃描時發生錯誤，可能掃描器已經停止');
        setIsScanning(false);
      }
    } else {
      // 如果沒有掃描器或者不在掃描中，直接設置狀態
      setIsScanning(false);
    }
  };

  // 處理手動輸入
  const handleManualInput = () => {
    if (!manualInput.trim()) {
      setError('請輸入有效的 QR 碼內容');
      return;
    }

    setScannedData(manualInput);
    setManualInput('');
    setShowManualInput(false);
    setError(null);
  };

  // 切換手動輸入顯示
  const toggleManualInput = () => {
    setShowManualInput(!showManualInput);
    // 如果顯示手動輸入，則聚焦到輸入框
    if (!showManualInput && manualInputRef.current) {
      setTimeout(() => {
        manualInputRef.current?.focus();
      }, 100);
    }
  };

  // 觸發文件選擇
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 處理文件上傳
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isBrowser || !user) return;

    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsProcessingFile(true);
    setError(null);
    setSuccess(null);
    setScannedData(null);

    try {
      // 創建一個臨時的 Html5Qrcode 實例用於掃描文件
      const html5QrCode = new Html5Qrcode("qr-reader-file");

      // 掃描文件
      const result = await html5QrCode.scanFile(file, true);

      // 設置掃描結果
      setScannedData(result);
    } catch (err: any) {
      console.error('掃描文件失敗:', err);
      setError(err.message || '掃描文件失敗，請確保文件包含有效的 QR 碼');
    } finally {
      setIsProcessingFile(false);

      // 重置文件輸入，以便可以再次選擇相同的文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const importScannedData = async () => {
    if (!isBrowser || !scannedData || !user) return;

    setIsImporting(true);
    setError(null);
    setSuccess(null);

    try {
      // 確認匯入
      if (!confirm('匯入將會覆蓋現有的所有資料，確定要繼續嗎？')) {
        setIsImporting(false);
        return;
      }

      console.log('開始從 QR 碼載入資料庫...');
      // 從 QR 碼載入資料庫
      const data = await loadDatabaseFromQRCode(scannedData);
      console.log('從 QR 碼載入的資料:', data);

      if (!data) {
        throw new Error('無法從 QR 碼載入資料');
      }

      console.log('開始匯入資料庫到 Firebase...');
      // 匯入資料庫
      await importDatabase(data);
      console.log('資料庫匯入到 Firebase 成功');

      // 同步到 localStorage
      if (data.storage) {
        console.log('開始同步資料到 localStorage...');
        Object.entries(data.storage).forEach(([key, value]) => {
          // 檢查鍵名是否符合 Firebase 的規則
          if (!/[.#$/[\]:]/.test(key)) {
            if (value !== null && typeof value === 'string') {
              console.log(`同步到 localStorage: ${key}`);
              localStorage.setItem(key, value);
            }
          } else {
            console.log(`跳過不符合 Firebase 鍵名規則的項目: ${key}`);
          }
        });
        console.log('同步到 localStorage 完成');
      } else {
        console.log('沒有 storage 數據需要同步到 localStorage');
      }

      console.log('開始同步 localStorage 和 Firebase...');
      // 同步 localStorage 和 Firebase
      await storageBridge.sync();
      console.log('同步 localStorage 和 Firebase 完成');

      setSuccess('資料庫匯入成功！請重新整理頁面以套用新資料。');

      // 3 秒後重新整理頁面
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (err: any) {
      console.error('匯入資料庫失敗:', err);
      setError(err.message || '匯入資料庫失敗');
    } finally {
      setIsImporting(false);
    }
  };

  if (!user) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <p>請先登入以使用掃描功能</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">掃描 QR 碼</h2>
        <p className="text-sm text-base-content/70">掃描其他裝置上的 QR 碼以載入資料庫</p>
      </div>

      <div className="card-body">
        {error && (
          <div className="alert alert-error mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        <div className="qr-scanner-container">
          <div
            id="qr-reader"
            className="w-full max-w-sm mx-auto overflow-hidden rounded-lg"
            style={{ height: isScanning ? '300px' : '0' }}
          ></div>

          {scannedData && (
            <div className="mt-4 p-4 bg-base-200 rounded-lg">
              <p className="font-semibold">掃描結果:</p>
              <p className="text-sm break-all">{scannedData}</p>

              <div className="mt-4">
                <button
                  className={`btn btn-primary ${isImporting ? 'loading' : ''}`}
                  onClick={importScannedData}
                  disabled={isImporting}
                >
                  {isImporting ? '匯入中...' : '匯入資料庫'}
                </button>
              </div>
            </div>
          )}

          {/* 手動輸入區域 */}
          {showManualInput && (
            <div className="mt-4 p-4 bg-base-200 rounded-lg">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">手動輸入 QR 碼內容</span>
                </label>
                <div className="flex gap-2">
                  <input
                    ref={manualInputRef}
                    type="text"
                    className="input input-bordered flex-1"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="請輸入 QR 碼內容"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleManualInput();
                      }
                    }}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleManualInput}
                  >
                    確認
                  </button>
                </div>
                <label className="label">
                  <span className="label-text-alt">
                    您可以直接輸入 UID 值（如：1234567890）或 JSON 格式（如：{`{"uid":"1234567890"}`}）
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* 隱藏的文件輸入 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          {/* 用於文件掃描的隱藏元素 */}
          <div id="qr-reader-file" style={{ display: 'none' }}></div>

          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {!isScanning ? (
              <button
                className="btn btn-primary"
                onClick={startScanning}
                disabled={isProcessingFile}
              >
                開始掃描
              </button>
            ) : (
              <button
                className="btn btn-error"
                onClick={() => stopScanning()}
              >
                停止掃描
              </button>
            )}

            <button
              className={`btn ${showManualInput ? 'btn-accent' : 'btn-outline'}`}
              onClick={toggleManualInput}
              disabled={isProcessingFile}
            >
              {showManualInput ? '隱藏輸入框' : '手動輸入'}
            </button>

            <button
              className="btn btn-outline"
              onClick={triggerFileInput}
              disabled={isScanning || isProcessingFile}
            >
              {isProcessingFile ? '處理中...' : '上傳圖片'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
