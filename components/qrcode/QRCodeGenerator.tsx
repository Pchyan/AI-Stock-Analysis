import React, { useRef, useEffect, useState } from 'react';
import { generateQRCode } from '../../utils/qrcode';
import { useAuth } from '../../contexts/AuthContext';

// 檢查是否在瀏覽器環境中
const isBrowser = typeof window !== 'undefined';

interface QRCodeGeneratorProps {
  width?: number;
  height?: number;
}

export default function QRCodeGenerator({ width = 300, height = 300 }: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    if (user && canvasRef.current) {
      generateQR();
    }
  }, [user]);

  const generateQR = async () => {
    if (!user) {
      setError('請先登入以生成 QR 碼');
      return;
    }

    if (!canvasRef.current) return;

    setIsGenerating(true);
    setError(null);

    try {
      const url = await generateQRCode(canvasRef.current);
      setQrUrl(url);
    } catch (err: any) {
      console.error('生成 QR 碼失敗:', err);
      setError(err.message || '生成 QR 碼失敗');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQR = () => {
    if (!isBrowser || !qrUrl) return;

    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `stock-analysis-qrcode-${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!user) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <p>請先登入以生成 QR 碼</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">您的資料庫 QR 碼</h2>
        <p className="text-sm text-base-content/70">掃描此 QR 碼可以在其他裝置上載入您的資料庫</p>
      </div>

      <div className="card-body flex flex-col items-center">
        {error && (
          <div className="alert alert-error mb-4 w-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="qr-container bg-white p-4 rounded-lg shadow-md">
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className={isGenerating ? 'opacity-50' : ''}
          />
        </div>

        <div className="flex gap-4 mt-4">
          <button
            className="btn btn-primary"
            onClick={generateQR}
            disabled={isGenerating}
          >
            {isGenerating ? '生成中...' : '重新生成'}
          </button>

          <button
            className="btn btn-outline"
            onClick={downloadQR}
            disabled={!qrUrl || isGenerating}
          >
            下載 QR 碼
          </button>
        </div>
      </div>
    </div>
  );
}
