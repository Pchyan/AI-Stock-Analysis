import { getData, saveData } from '../firebase/database';
import { getCurrentUser } from '../firebase/auth';

// 檢查是否在瀏覽器環境中
const isBrowser = typeof window !== 'undefined';

// 創建一個模擬的 localStorage，用於伺服器端渲染
class MemoryStorage implements Storage {
  private items: Record<string, string> = {};

  get length(): number {
    return Object.keys(this.items).length;
  }

  key(index: number): string | null {
    return Object.keys(this.items)[index] || null;
  }

  getItem(key: string): string | null {
    return key in this.items ? this.items[key] : null;
  }

  setItem(key: string, value: string): void {
    this.items[key] = value;
  }

  removeItem(key: string): void {
    delete this.items[key];
  }

  clear(): void {
    this.items = {};
  }
}

// 橋接 localStorage 和 Firebase
class StorageBridge {
  private isFirebaseEnabled: boolean = false;
  private fallbackStorage: Storage;

  constructor() {
    // 在伺服器端使用記憶體存儲，在瀏覽器端使用 localStorage
    this.fallbackStorage = isBrowser ? window.localStorage : new MemoryStorage();
    this.isFirebaseEnabled = isBrowser ? !!getCurrentUser() : false;
  }

  // 檢查 Firebase 是否啟用
  private checkFirebaseStatus(): boolean {
    if (!isBrowser) return false;
    this.isFirebaseEnabled = !!getCurrentUser();
    return this.isFirebaseEnabled;
  }

  // 設置項目
  async setItem(key: string, value: string): Promise<void> {
    // 總是保存到 localStorage 作為備份
    this.fallbackStorage.setItem(key, value);

    // 如果 Firebase 啟用，也保存到 Firebase
    if (this.checkFirebaseStatus()) {
      try {
        await saveData(`storage/${key}`, value);
      } catch (error) {
        console.error(`儲存 ${key} 到 Firebase 失敗:`, error);
      }
    }
  }

  // 獲取項目
  async getItem(key: string): Promise<string | null> {
    // 如果 Firebase 啟用，優先從 Firebase 獲取
    if (this.checkFirebaseStatus()) {
      try {
        const value = await getData<string>(`storage/${key}`);
        if (value !== null) {
          // 同步到 localStorage
          this.fallbackStorage.setItem(key, value);
          return value;
        }
      } catch (error) {
        console.error(`從 Firebase 獲取 ${key} 失敗:`, error);
      }
    }

    // 從 localStorage 獲取
    return this.fallbackStorage.getItem(key);
  }

  // 移除項目
  async removeItem(key: string): Promise<void> {
    // 從 localStorage 移除
    this.fallbackStorage.removeItem(key);

    // 如果 Firebase 啟用，也從 Firebase 移除
    if (this.checkFirebaseStatus()) {
      try {
        await saveData(`storage/${key}`, null);
      } catch (error) {
        console.error(`從 Firebase 移除 ${key} 失敗:`, error);
      }
    }
  }

  // 清除所有項目
  async clear(): Promise<void> {
    // 清除 localStorage
    this.fallbackStorage.clear();

    // 如果 Firebase 啟用，也清除 Firebase 中的所有項目
    if (this.checkFirebaseStatus()) {
      try {
        await saveData('storage', null);
      } catch (error) {
        console.error('清除 Firebase 存儲失敗:', error);
      }
    }
  }

  // 獲取所有鍵
  async keys(): Promise<string[]> {
    const localKeys = Object.keys(this.fallbackStorage);

    // 如果 Firebase 啟用，合併 Firebase 中的鍵
    if (this.checkFirebaseStatus()) {
      try {
        const firebaseData = await getData<Record<string, any>>('storage');
        if (firebaseData) {
          const firebaseKeys = Object.keys(firebaseData);
          // 合併並去重（使用更兼容的方式）
          const mergedKeys = localKeys.concat(firebaseKeys);
          const uniqueKeys: string[] = [];

          // 手動去重
          mergedKeys.forEach(key => {
            if (uniqueKeys.indexOf(key) === -1) {
              uniqueKeys.push(key);
            }
          });

          return uniqueKeys;
        }
      } catch (error) {
        console.error('獲取 Firebase 存儲鍵失敗:', error);
      }
    }

    return localKeys;
  }

  // 同步 localStorage 和 Firebase
  async sync(): Promise<void> {
    console.log('開始同步 localStorage 和 Firebase');

    if (!this.checkFirebaseStatus()) {
      console.log('Firebase 未啟用，無法同步');
      return;
    }

    try {
      console.log('正在從 Firebase 獲取數據...');
      // 獲取 Firebase 中的所有數據
      const firebaseData = await getData<Record<string, string>>('storage');

      if (firebaseData) {
        console.log('從 Firebase 獲取到數據，正在同步到 localStorage...');
        // 將 Firebase 數據同步到 localStorage
        Object.entries(firebaseData).forEach(([key, value]) => {
          if (value !== null) {
            console.log(`同步 Firebase -> localStorage: ${key}`);
            this.fallbackStorage.setItem(key, value);
          }
        });
      } else {
        console.log('Firebase 中沒有數據');
      }

      console.log('正在從 localStorage 獲取數據...');
      // 將 localStorage 數據同步到 Firebase
      const storageData: Record<string, string> = {};
      for (let i = 0; i < this.fallbackStorage.length; i++) {
        const key = this.fallbackStorage.key(i);
        if (key) {
          const value = this.fallbackStorage.getItem(key);
          if (value !== null) {
            console.log(`同步 localStorage -> Firebase: ${key}`);
            storageData[key] = value;
          }
        }
      }

      console.log('正在將數據保存到 Firebase...');
      await saveData('storage', storageData);
      console.log('同步完成');
    } catch (error) {
      console.error('同步存儲失敗:', error);
    }
  }
}

// 創建單例實例
const storageBridge = new StorageBridge();

export default storageBridge;
