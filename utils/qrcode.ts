import QRCode from 'qrcode';
import { getCurrentUser } from '../firebase/auth';
import { getDatabaseByUid } from '../firebase/database';

// 檢查是否在瀏覽器環境中
const isBrowser = typeof window !== 'undefined';

// 生成包含用戶 UID 的 QR 碼
export const generateQRCode = async (canvasElement: HTMLCanvasElement): Promise<string> => {
  if (!isBrowser) return '';

  try {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('用戶未登入');
    }

    const uid = user.uid;
    const qrData = JSON.stringify({ uid });

    // 生成 QR 碼到 canvas 元素
    await QRCode.toCanvas(canvasElement, qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    // 同時返回 QR 碼的 URL 字符串
    const qrUrl = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    return qrUrl;
  } catch (error) {
    console.error('生成 QR 碼失敗:', error);
    throw error;
  }
};

// 解析 QR 碼數據
export const parseQRCode = (qrData: string): { uid: string } | null => {
  try {
    // 嘗試解析 JSON
    try {
      const data = JSON.parse(qrData);
      if (data && data.uid) {
        return { uid: data.uid };
      }
    } catch (jsonError) {
      // JSON 解析失敗，嘗試其他格式
    }

    // 嘗試直接使用輸入作為 UID
    // 檢查是否是有效的 UID 格式（通常是字母數字組合）
    if (/^[a-zA-Z0-9_-]+$/.test(qrData.trim())) {
      return { uid: qrData.trim() };
    }

    // 嘗試從字符串中提取 UID
    const uidMatch = qrData.match(/["']?uid["']?\s*[:=]\s*["']?([a-zA-Z0-9_-]+)["']?/);
    if (uidMatch && uidMatch[1]) {
      return { uid: uidMatch[1] };
    }

    return null;
  } catch (error) {
    console.error('解析 QR 碼數據失敗:', error);
    return null;
  }
};

// 從 QR 碼載入資料庫
export const loadDatabaseFromQRCode = async (qrData: string): Promise<Record<string, any> | null> => {
  if (!isBrowser) return null;

  try {
    const parsedData = parseQRCode(qrData);
    if (!parsedData) {
      throw new Error('無效的 QR 碼數據');
    }

    const { uid } = parsedData;
    const data = await getDatabaseByUid(uid);
    return data;
  } catch (error) {
    console.error('從 QR 碼載入資料庫失敗:', error);
    throw error;
  }
};
