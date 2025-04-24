import storageBridge from './storage-bridge';

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

class Cache {
  private prefix: string;
  private defaultExpiry: number;

  constructor(prefix: string = 'app_cache_', defaultExpiry: number = 3600000) {
    this.prefix = prefix;
    this.defaultExpiry = defaultExpiry; // 預設過期時間，單位為毫秒 (1小時)
  }

  /**
   * 設置緩存
   * @param key 緩存鍵
   * @param data 緩存數據
   * @param expiry 過期時間（毫秒），預設為 1 小時
   */
  async set<T>(key: string, data: T, expiry: number = this.defaultExpiry): Promise<void> {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now() + expiry
    };
    await storageBridge.setItem(this.prefix + key, JSON.stringify(item));
  }

  /**
   * 獲取緩存
   * @param key 緩存鍵
   * @returns 緩存數據，如果不存在或已過期則返回 null
   */
  async get<T>(key: string): Promise<T | null> {
    const item = await storageBridge.getItem(this.prefix + key);
    if (!item) return null;

    try {
      const parsedItem = JSON.parse(item) as CacheItem<T>;
      const now = Date.now();

      if (now > parsedItem.timestamp) {
        // 緩存已過期，刪除它
        await this.remove(key);
        return null;
      }

      return parsedItem.data;
    } catch (error) {
      console.error('Failed to parse cache item:', error);
      return null;
    }
  }

  /**
   * 移除緩存
   * @param key 緩存鍵
   */
  async remove(key: string): Promise<void> {
    await storageBridge.removeItem(this.prefix + key);
  }

  /**
   * 清除所有緩存
   */
  async clear(): Promise<void> {
    const keys = await storageBridge.keys();
    for (const key of keys) {
      if (key.startsWith(this.prefix)) {
        await storageBridge.removeItem(key);
      }
    }
  }

  /**
   * 清除過期的緩存
   */
  async clearExpired(): Promise<void> {
    const keys = await storageBridge.keys();
    const now = Date.now();

    for (const key of keys) {
      if (key.startsWith(this.prefix)) {
        const item = await storageBridge.getItem(key);
        if (item) {
          try {
            const parsedItem = JSON.parse(item) as CacheItem<any>;
            if (now > parsedItem.timestamp) {
              await storageBridge.removeItem(key);
            }
          } catch (error) {
            // 如果解析失敗，刪除該項
            await storageBridge.removeItem(key);
          }
        }
      }
    }
  }

  /**
   * 同步緩存
   * 將 localStorage 中的緩存同步到 Firebase
   */
  async sync(): Promise<void> {
    await storageBridge.sync();
  }
}

// 創建一個全局緩存實例
const cache = new Cache();

export default cache;
